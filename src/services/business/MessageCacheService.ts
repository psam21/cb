/**
 * MessageCacheService
 * 
 * Persistent encrypted cache for Nostr messages using IndexedDB.
 * 
 * Features:
 * - Encrypts all messages before storing (AES-GCM)
 * - Caches conversations and messages
 * - Tracks last sync timestamp for incremental updates
 * - Auto-cleanup of old cached data
 * - Fast indexed queries by conversation and timestamp
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { CacheEncryptionService } from '../core/CacheEncryptionService';
import type { Message, Conversation } from '@/types/messaging';

/**
 * IndexedDB Schema
 */
interface MessageCacheDB extends DBSchema {
  messages: {
    key: string; // messageId
    value: {
      id: string;
      conversationId: string; // pubkey of other user
      ciphertext: string;     // Encrypted message object
      iv: string;             // Initialization vector
      timestamp: number;      // Message timestamp
      cachedAt: number;       // When it was cached
    };
    indexes: {
      'by-conversation': string;
      'by-timestamp': number;
      'by-cached-at': number;
    };
  };
  conversations: {
    key: string; // pubkey
    value: {
      pubkey: string;
      ciphertext: string; // Encrypted conversation object
      iv: string;
      lastMessageTime: number;
      unreadCount: number;
      cachedAt: number;
    };
    indexes: {
      'by-lastMessage': number;
      'by-cached-at': number;
    };
  };
  metadata: {
    key: string;
    value: {
      key: string;
      value: string | number | boolean;
    };
  };
}

const DB_NAME = 'nostr-message-cache';
const DB_VERSION = 1;
const CACHE_TTL_DAYS = 30; // Auto-delete cached data older than 30 days

export class MessageCacheService {
  private db: IDBPDatabase<MessageCacheDB> | null = null;
  private encryption: CacheEncryptionService;
  private static instance: MessageCacheService;

  private constructor() {
    this.encryption = CacheEncryptionService.getInstance();
  }

  static getInstance(): MessageCacheService {
    if (!MessageCacheService.instance) {
      MessageCacheService.instance = new MessageCacheService();
    }
    return MessageCacheService.instance;
  }

  /**
   * Initialize database and encryption key
   * Call this once on user login
   * 
   * @param pubkey - User's Nostr public key (hex format)
   */
  async initialize(pubkey: string): Promise<void> {
    try {
      // Initialize encryption key
      await this.encryption.initializeKey(pubkey);

      // Open/create database
      this.db = await openDB<MessageCacheDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // Messages store
          if (!db.objectStoreNames.contains('messages')) {
            const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
            messageStore.createIndex('by-conversation', 'conversationId');
            messageStore.createIndex('by-timestamp', 'timestamp');
            messageStore.createIndex('by-cached-at', 'cachedAt');
          }

          // Conversations store
          if (!db.objectStoreNames.contains('conversations')) {
            const convoStore = db.createObjectStore('conversations', { keyPath: 'pubkey' });
            convoStore.createIndex('by-lastMessage', 'lastMessageTime');
            convoStore.createIndex('by-cached-at', 'cachedAt');
          }

          // Metadata store
          if (!db.objectStoreNames.contains('metadata')) {
            db.createObjectStore('metadata', { keyPath: 'key' });
          }
        }
      });

      console.log('✅ Message cache initialized');

      // Cleanup old cached data
      await this.cleanupOldCache();
    } catch (error) {
      console.error('❌ Failed to initialize message cache:', error);
      throw error;
    }
  }

  /**
   * Check if cache is initialized
   */
  isInitialized(): boolean {
    const dbReady = this.db !== null;
    const encryptionReady = this.encryption.isInitialized();
    const isReady = dbReady && encryptionReady;
    
    console.log('[Cache] 🔍 isInitialized check:', { 
      dbReady, 
      encryptionReady, 
      isReady 
    });
    
    return isReady;
  }

  /**
   * Cache multiple messages
   */
  async cacheMessages(messages: Message[]): Promise<void> {
    if (!this.db) {
      console.warn('⚠️ Cache not initialized, skipping cacheMessages');
      return;
    }

    // Encrypt all messages first, before opening transaction
    const encryptedMessages = await Promise.all(
      messages.map(async (message) => {
        try {
          const { ciphertext, iv } = await this.encryption.encrypt(message);
          const conversationId = message.isSent 
            ? message.recipientPubkey 
            : message.senderPubkey;

          return {
            id: message.id,
            conversationId,
            ciphertext,
            iv,
            timestamp: message.createdAt,
            cachedAt: Date.now()
          };
        } catch (error) {
          console.error(`❌ Failed to encrypt message ${message.id}:`, error);
          return null;
        }
      })
    );

    // Filter out failed encryptions
    const validMessages = encryptedMessages.filter(m => m !== null);

    if (validMessages.length === 0) {
      console.warn('⚠️ No valid messages to cache');
      return;
    }

    // Now do the transaction with already-encrypted data
    const tx = this.db.transaction('messages', 'readwrite');
    const store = tx.objectStore('messages');

    // Add all messages to store synchronously (no await in loop)
    validMessages.forEach(message => {
      store.put(message);
    });

    await tx.done;
    console.log(`✅ Cached ${validMessages.length} messages`);
  }

  /**
   * Retrieve messages for a specific conversation
   */
  async getMessages(conversationPubkey: string): Promise<Message[]> {
    if (!this.db) {
      return [];
    }

    try {
      const tx = this.db.transaction('messages', 'readonly');
      const index = tx.objectStore('messages').index('by-conversation');
      
      // Get all encrypted messages for this conversation
      const encryptedMessages = await index.getAll(conversationPubkey);

      // Decrypt all messages
      const messages: Message[] = [];
      for (const encrypted of encryptedMessages) {
        try {
          const message = await this.encryption.decrypt<Message>(
            encrypted.ciphertext,
            encrypted.iv
          );
          messages.push(message);
        } catch (error) {
          console.error(`❌ Failed to decrypt message ${encrypted.id}:`, error);
        }
      }

      // Sort by timestamp
      messages.sort((a, b) => a.createdAt - b.createdAt);

      return messages;
    } catch (error) {
      console.error('❌ Failed to get cached messages:', error);
      return [];
    }
  }

  /**
   * Cache conversations
   */
  async cacheConversations(conversations: Conversation[]): Promise<void> {
    console.log(`[Cache] 💾 cacheConversations called with ${conversations.length} conversations`, {
      dbInitialized: this.db !== null,
      encryptionReady: this.encryption.isInitialized()
    });

    if (!this.db) {
      console.warn('[Cache] ⚠️ Cache not initialized, skipping cacheConversations');
      return;
    }

    // Encrypt all conversations first, before opening transaction
    const encryptedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        try {
          const { ciphertext, iv } = await this.encryption.encrypt(conversation);
          return {
            pubkey: conversation.pubkey,
            ciphertext,
            iv,
            lastMessageTime: conversation.lastMessageAt,
            unreadCount: conversation.unreadCount || 0,
            cachedAt: Date.now()
          };
        } catch (error) {
          console.error(`❌ Failed to encrypt conversation ${conversation.pubkey}:`, error);
          return null;
        }
      })
    );

    // Filter out failed encryptions
    const validConversations = encryptedConversations.filter(c => c !== null);
    
    if (validConversations.length === 0) {
      console.warn('[Cache] ⚠️ No valid conversations to cache');
      return;
    }

    // Now do the transaction with already-encrypted data
    const tx = this.db.transaction('conversations', 'readwrite');
    const store = tx.objectStore('conversations');

    // Add all conversations to store synchronously (no await in loop)
    validConversations.forEach(conversation => {
      store.put(conversation);
    });

    await tx.done;
    console.log(`[Cache] ✅ Cache save transaction completed: ${validConversations.length} saved, ${conversations.length - validConversations.length} failed`);
  }

  /**
   * Update a single conversation in cache
   * Optimized method for updating one conversation (e.g., when new message arrives)
   * 
   * @param conversation - Conversation to update
   */
  async updateConversation(conversation: Conversation): Promise<void> {
    if (!this.db) {
      return;
    }

    try {
      // Encrypt conversation first, before opening transaction
      const { ciphertext, iv } = await this.encryption.encrypt(conversation);

      // Now do the transaction with already-encrypted data
      const tx = this.db.transaction('conversations', 'readwrite');
      const store = tx.objectStore('conversations');

      // Store/update encrypted conversation (synchronous call)
      store.put({
        pubkey: conversation.pubkey,
        ciphertext,
        iv,
        lastMessageTime: conversation.lastMessageAt,
        unreadCount: conversation.unreadCount || 0,
        cachedAt: Date.now()
      });

      await tx.done;
    } catch (error) {
      console.error(`❌ Failed to update conversation ${conversation.pubkey}:`, error);
    }
  }

  /**
   * Get all cached conversations
   */
  async getConversations(): Promise<Conversation[]> {
    console.log('[Cache] 🔍 getConversations called', {
      dbInitialized: this.db !== null,
      encryptionReady: this.encryption.isInitialized()
    });

    if (!this.db) {
      console.warn('[Cache] ⚠️ Database not initialized in getConversations');
      return [];
    }

    try {
      const tx = this.db.transaction('conversations', 'readonly');
      const store = tx.objectStore('conversations');
      
      // Get all encrypted conversations
      const encryptedConvos = await store.getAll();
      console.log(`[Cache] 📦 Retrieved ${encryptedConvos.length} encrypted conversations from IndexedDB`);

      // Decrypt all conversations
      const conversations: Conversation[] = [];
      for (const encrypted of encryptedConvos) {
        try {
          const conversation = await this.encryption.decrypt<Conversation>(
            encrypted.ciphertext,
            encrypted.iv
          );
          conversations.push(conversation);
        } catch (error) {
          console.error(`❌ Failed to decrypt conversation ${encrypted.pubkey}:`, error);
        }
      }

      console.log(`[Cache] ✅ Successfully decrypted ${conversations.length} conversations`);

      // Sort by last message time (newest first)
      conversations.sort((a, b) => b.lastMessageAt - a.lastMessageAt);

      return conversations;
    } catch (error) {
      console.error('❌ Failed to get cached conversations:', error);
      return [];
    }
  }

  /**
   * Get last sync timestamp (for "since" filtering)
   */
  async getLastSyncTime(): Promise<number> {
    if (!this.db) {
      return 0;
    }

    try {
      const metadata = await this.db.get('metadata', 'lastSyncTime');
      return (typeof metadata?.value === 'number' ? metadata.value : 0);
    } catch (error) {
      console.error('❌ Failed to get last sync time:', error);
      return 0;
    }
  }

  /**
   * Update last sync timestamp
   */
  async setLastSyncTime(timestamp: number): Promise<void> {
    if (!this.db) {
      return;
    }

    try {
      await this.db.put('metadata', {
        key: 'lastSyncTime',
        value: timestamp
      });
    } catch (error) {
      console.error('❌ Failed to set last sync time:', error);
    }
  }

  /**
   * Clear all cached data (on logout)
   */
  async clearCache(): Promise<void> {
    if (!this.db) {
      return;
    }

    try {
      const tx = this.db.transaction(['messages', 'conversations', 'metadata'], 'readwrite');
      await tx.objectStore('messages').clear();
      await tx.objectStore('conversations').clear();
      await tx.objectStore('metadata').clear();
      await tx.done;

      // Close database
      this.db.close();
      this.db = null;

      // Clear encryption key
      this.encryption.clearKey();

      console.log('🔒 Cache cleared');
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
    }
  }

  /**
   * Delete cached data older than TTL
   */
  private async cleanupOldCache(): Promise<void> {
    if (!this.db) {
      return;
    }

    const cutoffTime = Date.now() - (CACHE_TTL_DAYS * 24 * 60 * 60 * 1000);

    try {
      // Cleanup old messages
      const msgTx = this.db.transaction('messages', 'readwrite');
      const msgIndex = msgTx.objectStore('messages').index('by-cached-at');
      let msgCursor = await msgIndex.openCursor(IDBKeyRange.upperBound(cutoffTime));
      let deletedMessages = 0;

      while (msgCursor) {
        await msgCursor.delete();
        deletedMessages++;
        msgCursor = await msgCursor.continue();
      }

      // Cleanup old conversations
      const convoTx = this.db.transaction('conversations', 'readwrite');
      const convoIndex = convoTx.objectStore('conversations').index('by-cached-at');
      let convoCursor = await convoIndex.openCursor(IDBKeyRange.upperBound(cutoffTime));
      let deletedConvos = 0;

      while (convoCursor) {
        await convoCursor.delete();
        deletedConvos++;
        convoCursor = await convoCursor.continue();
      }

      if (deletedMessages > 0 || deletedConvos > 0) {
        console.log(`🧹 Cleaned up ${deletedMessages} old messages, ${deletedConvos} old conversations`);
      }
    } catch (error) {
      console.error('❌ Failed to cleanup old cache:', error);
    }
  }

  /**
   * Get cache statistics (for debugging)
   */
  async getCacheStats(): Promise<{
    messageCount: number;
    conversationCount: number;
    lastSyncTime: number;
  }> {
    if (!this.db) {
      return { messageCount: 0, conversationCount: 0, lastSyncTime: 0 };
    }

    try {
      const [messageCount, conversationCount, lastSyncTime] = await Promise.all([
        this.db.count('messages'),
        this.db.count('conversations'),
        this.getLastSyncTime()
      ]);

      return { messageCount, conversationCount, lastSyncTime };
    } catch (error) {
      console.error('❌ Failed to get cache stats:', error);
      return { messageCount: 0, conversationCount: 0, lastSyncTime: 0 };
    }
  }
}
