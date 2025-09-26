export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

export interface NIP23Event extends NostrEvent {
  kind: 30023; // Parameterized replaceable long-form content
  event_id?: string;
}

export interface NIP23Content {
  title: string;
  content: string;
  summary: string;
  published_at: number;
  tags: string[];
  language: string;
  region: string;
  permissions: string;
  file_id?: string;
  file_type?: string;
  file_size?: number;
}

export interface AuthenticationContext {
  method: 'nsec' | 'signer';
  nsec?: string;
  signer?: NostrSigner;
  signedEvent?: NostrEvent;
}

export interface SigningResult {
  success: boolean;
  signedEvent?: NostrEvent;
  error?: string;
}

export interface NostrSigner {
  getPublicKey(): Promise<string>;
  signEvent(event: Omit<NostrEvent, 'id' | 'sig'>): Promise<NostrEvent>;
  getRelays(): Promise<Record<string, RelayInfo>>;
  nip04?: {
    encrypt(peer: string, plaintext: string): Promise<string>;
    decrypt(peer: string, ciphertext: string): Promise<string>;
  };
}

export interface RelayInfo {
  read: boolean;
  write: boolean;
}
