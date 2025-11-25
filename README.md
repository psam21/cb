# Culture Bridge

> **Preserve Heritage, Empower Communities**

A decentralized platform built on Nostr protocol to permanently preserve cultural practices, languages, and traditions. Empowering indigenous and minority communities to self-document their heritage without relying on centralized institutions.

🌐 **Live:** [https://culturebridge.vercel.app](https://culturebridge.vercel.app)

[![Built with Next.js](https://img.shields.io/badge/Next.js-15.4-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Nostr Protocol](https://img.shields.io/badge/Nostr-Protocol-purple)](https://nostr.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🎯 Mission

For too long, cultural preservation has been controlled by institutions and corporations. Culture Bridge returns this power to communities themselves, using decentralized technology to ensure traditions survive and thrive.

### Why Nostr?

- **Censorship Resistant** - No single entity can delete or control cultural content
- **Permanent Storage** - Content lives on multiple relays across the world
- **User Sovereignty** - Communities own their data and keys
- **No Middlemen** - Direct peer-to-peer publishing and discovery

---

## ✨ Features

### 🏛️ Heritage Contributions

- Share cultural practices, languages, and traditions
- Multi-media support (images, videos, audio)
- Markdown-based long-form content (NIP-23)
- Permanent preservation on Nostr relays

### 🛒 Decentralized Marketplace

- List cultural items and artifacts
- Parameterized replaceable events (NIP-33)
- Product discovery with tags
- Shopping cart synced to Nostr (NIP-78)

### 💬 Private Messaging

- End-to-end encrypted messages (NIP-17)
- Gift-wrapped encryption (double encryption)
- Message attachments (images, videos, audio)
- Conversation context with product/heritage references

### 👤 Self-Sovereign Identity

- Own your identity with Nostr keys
- Profile management (Kind 0)
- NIP-05 verification
- Lightning address support

### 📊 Analytics Dashboard

- Event publishing tracking
- Redis-powered analytics
- User event history
- Relay health monitoring

---

## 🏗️ Architecture

Culture Bridge implements a strict **6-layer Service-Oriented Architecture (SOA)**:

```text
┌─────────────────────────────────────────┐
│  UI Layer (Pages/Components)            │ ← Display only
├─────────────────────────────────────────┤
│  Hook Layer (Custom Hooks)              │ ← State management
├─────────────────────────────────────────┤
│  Business Service Layer                 │ ← Orchestration
├─────────────────────────────────────────┤
│  Event Service Layer (Nostr)            │ ← Event creation
├─────────────────────────────────────────┤
│  Generic Service Layer                  │ ← Infrastructure
├─────────────────────────────────────────┤
│  Core Service Layer                     │ ← Logging, caching
└─────────────────────────────────────────┘
```

### Tech Stack

- **Frontend:** Next.js 15.4 (App Router), React 18, TypeScript 5.5
- **Styling:** Tailwind CSS with custom design tokens
- **State Management:** Zustand (with persistence)
- **Nostr Integration:** nostr-tools 2.17, custom service layer
- **File Storage:** Blossom (decentralized CDN)
- **Database:** Redis (Upstash KV for analytics)
- **Rich Text:** TipTap with Markdown support
- **Animations:** Framer Motion
- **Deployment:** Vercel

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ and npm
- Nostr browser extension (Alby, nos2x, Nostore) or use built-in key management

### Installation

```bash
# Clone the repository
git clone https://github.com/psam21/cb.git
cd cb

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Build for Production

```bash
# Build optimized production bundle
npm run build

# Start production server
npm start
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run typecheck` - TypeScript type checking
- `npm run format` - Format code with Prettier

---

## 📡 Nostr Implementation

### Supported NIPs

- **NIP-01** - Basic protocol flow
- **NIP-05** - DNS-based verification
- **NIP-07** - Browser extension signer
- **NIP-09** - Event deletion
- **NIP-17** - Private direct messages
- **NIP-23** - Long-form content
- **NIP-33** - Parameterized replaceable events
- **NIP-44** - Encrypted payloads (v2)
- **NIP-78** - Application-specific data
- **NIP-94** - File metadata

### Event Kinds Used

- **Kind 0** - User profiles
- **Kind 1** - Text notes (welcome messages)
- **Kind 5** - Event deletion
- **Kind 14** - Rumor (NIP-17 inner message)
- **Kind 1059** - Gift wrap (NIP-17 encryption)
- **Kind 10063** - Blossom server list
- **Kind 24242** - Blossom authorization
- **Kind 30023** - Products & heritage contributions
- **Kind 30078** - Cart & app data storage

### Relay Configuration

Connected to **8 high-reliability relays**:

- relay.damus.io
- relay.snort.social
- relay.nostr.band
- relay.primal.net
- offchain.pub
- shu01.shugur.net (35+ NIPs)
- relay.0xchat.com (messaging-focused)
- relay.nostr.wirednet.jp (APAC)

---

## 🗂️ Project Structure

```plaintext
cb/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── shop/              # Marketplace pages
│   │   ├── heritage/          # Heritage contribution pages
│   │   ├── messages/          # Private messaging
│   │   ├── profile/           # User profile
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── primitives/        # Reusable UI components
│   │   ├── shop/              # Shop-specific components
│   │   ├── heritage/          # Heritage components
│   │   └── auth/              # Authentication forms
│   ├── services/              # Service layer (SOA)
│   │   ├── core/              # Core services (logging, KV)
│   │   ├── generic/           # Generic infrastructure
│   │   ├── nostr/             # Nostr event facade
│   │   └── business/          # Business logic orchestration
│   ├── hooks/                 # Custom React hooks
│   ├── stores/                # Zustand state stores
│   ├── types/                 # TypeScript type definitions
│   ├── utils/                 # Utility functions
│   ├── config/                # Configuration files
│   ├── errors/                # Error handling
│   └── styles/                # Global styles
├── docs/                      # Documentation
│   ├── cb-critical-guidelines.md
│   └── nip-kind-implementation-matrix.md
├── public/                    # Static assets
└── package.json
```

---

## 🔐 Security & Privacy

### Authentication

- **Dual Authentication:** Browser extension (NIP-07) or nsec storage
- Keys never leave the user's device
- All event signing requires user approval

### Encryption

- **NIP-44 v2** - Modern ChaCha20-Poly1305 encryption
- **NIP-17** - Double gift-wrap for messages
- **IndexedDB** - Encrypted cache storage with AES-256-GCM
- **PBKDF2** - 100k iterations for key derivation

### Data Ownership

- Users control their private keys
- Content published to multiple relays
- No centralized database for user data
- Logout clears all browser storage

---

## 📚 Documentation

- [Critical Guidelines](./docs/cb-critical-guidelines.md) - Development rules and patterns
- [NIP Implementation Matrix](./docs/nip-kind-implementation-matrix.md) - Detailed protocol implementation

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Read the guidelines:** Check `docs/cb-critical-guidelines.md`
2. **Follow SOA:** Respect the 6-layer architecture
3. **Build before commit:** `npm run build` must pass
4. **Write tests:** Manual end-to-end verification required
5. **Document changes:** Update relevant docs

### Development Workflow

```bash
# 1. Build (must pass with 0 errors)
npm run build

# 2. Fix any errors/warnings iteratively
npm run lint:fix

# 3. Stage changes
git add .

# 4. Commit with detailed message
git commit -m "feat: Description of WHAT and WHY"

# 5. Push
git push origin main

# 6. Verify on production
# Visit https://culturebridge.vercel.app
```

---

## 📊 Key Metrics

- **10 NIPs** implemented
- **9 Event Kinds** supported
- **8 Relays** connected
- **21 Services** in SOA architecture
- **6 Layers** of separation of concerns

---

## 🌟 Roadmap

### Current Features

- ✅ Heritage contributions
- ✅ Decentralized marketplace
- ✅ Private messaging (NIP-17)
- ✅ Shopping cart with relay sync
- ✅ Analytics dashboard
- ✅ Profile management

### Future Enhancements

- 🔄 NIP-46 (Remote signer protocol)
- 🔄 NIP-65 (Relay list metadata)
- 🔄 WebSocket profile updates
- 🔄 Video/audio streaming optimization
- 🔄 IPFS fallback for media

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- **Nostr Protocol** - For building censorship-resistant infrastructure
- **Blossom** - For decentralized file hosting
- **Community** - For preserving and sharing cultural heritage

---

## 📞 Support

- **Website:** [https://culturebridge.vercel.app](https://culturebridge.vercel.app)
- **Issues:** [GitHub Issues](https://github.com/psam21/cb/issues)
- **Nostr:** Follow us on Nostr for updates

---

## 💚 Built With Love

Built with ❤️ for cultural preservation and community empowerment

