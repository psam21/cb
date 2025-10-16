/**
 * MessageComposer.tsx
 * Component Layer - Message Input and Sending
 * 
 * Input field with send button for composing messages.
 * Follows battle-tested Shop component patterns.
 */

'use client';

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { logger } from '@/services/core/LoggingService';
import { GenericAttachment } from '@/types/attachments';
import { FileUp, X, Image, Film, Music } from 'lucide-react';

interface MessageComposerProps {
  onSend: (content: string, attachments?: GenericAttachment[]) => void;
  disabled?: boolean;
  placeholder?: string;
  isSending?: boolean;
  conversationKey?: string | null; // To detect conversation changes
  maxAttachments?: number;
  maxFileSizeMB?: number;
  uploadProgress?: { fileName: string; progress: number } | null;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Type a message...',
  isSending = false,
  conversationKey = null,
  maxAttachments = 5,
  maxFileSizeMB = 100,
  uploadProgress: externalUploadProgress = null,
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<GenericAttachment[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ fileName: string; progress: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use external progress if provided, otherwise use internal
  const displayProgress = externalUploadProgress || uploadProgress;

  // Auto-focus when conversation changes or component mounts
  useEffect(() => {
    if (!disabled && textareaRef.current) {
      // Small delay to ensure DOM is ready and scroll has completed
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
      
      return () => clearTimeout(timer);
    }
  }, [conversationKey, disabled]);

  // Reset attachments when conversation changes
  useEffect(() => {
    setAttachments([]);
    setUploadError(null);
    setUploadProgress(null);
  }, [conversationKey]);

  const handleSend = () => {
    const trimmedMessage = message.trim();
    
    // Allow sending if there's text OR attachments
    if ((!trimmedMessage && attachments.length === 0) || disabled || isSending) {
      return;
    }

    logger.info('Sending message', {
      service: 'MessageComposer',
      method: 'handleSend',
      messageLength: trimmedMessage.length,
      attachmentCount: attachments.length,
    });

    onSend(trimmedMessage, attachments.length > 0 ? attachments : undefined);
    setMessage('');
    setAttachments([]);
    setUploadError(null);
    setUploadProgress(null);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadError(null);
    setUploadProgress(null);

    if (attachments.length + files.length > maxAttachments) {
      setUploadError(`Maximum ${maxAttachments} files allowed`);
      return;
    }

    // Validate files
    const maxBytes = maxFileSizeMB * 1024 * 1024;
    const allowedTypes = ['image/', 'video/', 'audio/'];
    
    for (const file of files) {
      if (file.size > maxBytes) {
        setUploadError(`${file.name} exceeds ${maxFileSizeMB}MB limit`);
        return;
      }
      
      if (!allowedTypes.some(type => file.type.startsWith(type))) {
        setUploadError(`${file.name} is not a supported media file`);
        return;
      }
    }

    // Create attachment objects from files
    const newAttachments: GenericAttachment[] = files.map(file => {
      const type = file.type.startsWith('image/') ? 'image' 
        : file.type.startsWith('video/') ? 'video'
        : 'audio';

      return {
        id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
        type,
        name: file.name,
        size: file.size,
        mimeType: file.type,
        originalFile: file,
        createdAt: Date.now(),
      };
    });

    setAttachments(prev => [...prev, ...newAttachments]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
    setUploadError(null);
    setUploadProgress(null);
  };

  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'video': return <Film className="w-4 h-4" />;
      case 'audio': return <Music className="w-4 h-4" />;
      default: return <FileUp className="w-4 h-4" />;
    }
  };

  return (
    <div className="border-t border-primary-200 bg-white p-4 md:p-4">
      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map(attachment => (
            <div
              key={attachment.id}
              className="flex items-center gap-2 px-3 py-2 bg-primary-100 rounded-lg text-sm"
            >
              {getAttachmentIcon(attachment.type)}
              <span className="max-w-[150px] truncate">{attachment.name}</span>
              <button
                onClick={() => removeAttachment(attachment.id)}
                className="text-primary-500 hover:text-red-600 transition-colors"
                disabled={isSending}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error message */}
      {uploadError && (
        <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {uploadError}
        </div>
      )}

      {/* Upload progress */}
      {displayProgress && (
        <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-blue-700">Uploading {displayProgress.fileName}...</span>
            <span className="text-sm font-medium text-blue-700">{displayProgress.progress}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${displayProgress.progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-start gap-2">
        {/* File upload button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,audio/*"
          capture="environment"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || isSending || attachments.length >= maxAttachments}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isSending || attachments.length >= maxAttachments}
          className="px-3 py-3 md:py-2 border border-primary-300 rounded-lg hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[48px] md:min-h-[40px]"
          title="Attach media (images, video, audio)"
        >
          <FileUp className="w-5 h-5 text-primary-600" />
        </button>

        {/* Message input */}
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isSending}
            rows={1}
            className="w-full px-4 py-3 md:py-2 border border-primary-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent disabled:bg-primary-50 disabled:text-primary-400 disabled:cursor-not-allowed text-base"
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          <p className="text-xs text-primary-500 mt-1 hidden md:block">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={(!message.trim() && attachments.length === 0) || disabled || isSending}
          className="px-5 md:px-6 py-3 md:py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 disabled:bg-primary-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-h-[48px] md:min-h-[40px]"
        >
          {isSending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              <span>Sending...</span>
            </>
          ) : (
            <span>Send</span>
          )}
        </button>
      </div>

      {/* Disabled state message */}
      {disabled && !isSending && (
        <p className="text-xs text-red-600 mt-2">
          Please sign in to send messages
        </p>
      )}
    </div>
  );
};
