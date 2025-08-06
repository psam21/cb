# 📝 Nostr Learning Plan for Culture Bridge

> **Goal**: Master Nostr protocol to design and build *Culture Bridge*, a decentralized platform for cultural memory preservation.
> **Tool**: Use this document in **NotebookLM** with all linked NIPs and documents uploaded for contextual AI support.

---

## 🗓️ Week 1: Foundations of Nostr
**Focus**: Understand the protocol, key concepts, identities, and how Nostr differs from other systems.

### Daily Goals
- **Day 1**: Read and summarize [NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md) (core protocol).
- **Day 2**: Learn about public/private key identity ([NIP-06](https://github.com/nostr-protocol/nips/blob/master/06.md)).
- **Day 3**: Study event kinds (0–6): metadata, text notes, deletions, contact lists.
- **Day 4**: Understand relays: public/private, roles, propagation.
- **Day 5**: Try signing events using [nostr-tools](https://github.com/nbd-wtf/nostr-tools).
- **Day 6**: Explore Nostr clients: Snort, Iris, Amethyst.
- **Day 7**: Reflect: “What makes Nostr truly decentralized and resilient?”

### NotebookLM Prompts
- “Explain the relationship between relays and clients in Nostr.”
- “Summarize NIP-01 in bullet points.”
- “How do signed events maintain identity on Nostr?”

---

## 📆 Week 2: Development + Relay Mechanics
**Focus**: Learn how to publish/subscribe to events, filter, and manage relays.

### Daily Goals
- **Day 8**: Set up using `nostr-tools` (JS) or `nostr-sdk` (Rust).
- **Day 9**: Publish + subscribe to events.
- **Day 10**: Study [NIP-02](https://github.com/nostr-protocol/nips/blob/master/02.md), [NIP-10](https://github.com/nostr-protocol/nips/blob/master/10.md), [NIP-65](https://github.com/nostr-protocol/nips/blob/master/65.md).
- **Day 11**: Deep dive into event tags: `#p`, `#e`, `#t`, filtering.
- **Day 12**: Query events from public relays.
- **Day 13**: Learn to run your own relay using [nostr-rs-relay](https://github.com/scsibug/nostr-rs-relay).
- **Day 14**: Reflect: “How does discovery work without central servers?”

### NotebookLM Prompts
- “How do event filters work in Nostr?”
- “What’s the difference between `#e` and `#p` tags?”
- “Write code to post and fetch notes from a relay.”

---

## 🌎 Week 3: Use Cases for Culture Bridge
**Focus**: Map Nostr capabilities to cultural preservation.

### Daily Goals
- **Day 15**: Learn [NIP-23](https://github.com/nostr-protocol/nips/blob/master/23.md): long-form content.
- **Day 16**: Understand [NIP-94](https://github.com/nostr-protocol/nips/blob/master/94.md): media references.
- **Day 17**: Explore [NIP-05](https://github.com/nostr-protocol/nips/blob/master/05.md) and [NIP-26](https://github.com/nostr-protocol/nips/blob/master/26.md): identity + delegation.
- **Day 18**: Draft 5 use cases: oral histories, wisdom capsules, journals.
- **Day 19**: Study moderation (relay policy, NIP-36, content filters).
- **Day 20**: Learn trust models: Zaps ([NIP-57](https://github.com/nostr-protocol/nips/blob/master/57.md)), badges, WoT.
- **Day 21**: Reflect: “What would Culture Bridge's UI + flow look like?”

### NotebookLM Prompts
- “Compare NIP-23 and NIP-94 for documenting folk stories.”
- “How to allow elders to post through curators (NIP-26)?”
- “Design a Nostr-based cultural story format with tags and metadata.”

---

## 🚀 Week 4: Permanence, Payments, and Interoperability
**Focus**: Store rich media, enable patronage, and build for the future.

### Daily Goals
- **Day 22**: Study IPFS + Filecoin for permanent media storage.
- **Day 23**: Deep dive into [NIP-57](https://github.com/nostr-protocol/nips/blob/master/57.md): Lightning/Zaps.
- **Day 24**: Integrate Lightning wallets (Alby, Amethyst).
- **Day 25**: Study [NIP-89](https://github.com/nostr-protocol/nips/blob/master/89.md), [NIP-78](https://github.com/nostr-protocol/nips/blob/master/78.md): bookmarks, zap goals.
- **Day 26**: Explore ActivityPub bridges for future Fediverse reach.
- **Day 27**: Prototype schema: cultural song + image + story.
- **Day 28**: Reflect: “What does Culture Bridge MVP need from Nostr?”

### NotebookLM Prompts
- “Suggest a tagging structure for community memories.”
- “Show a JSON event for a media post using NIP-94.”
- “How do Zaps work in a custom Nostr app?”

---

## 📁 Recommended Uploads for NotebookLM

| Document | Use |
|----------|-----|
| [All NIPs](https://github.com/nostr-protocol/nips) | Ground protocol answers |
| `nostr-tools` GitHub README | Code examples |
| Your Culture Bridge concept note | Contextual suggestions |
| Sample JSON events | Debug + simulate ideas |
| Metadata formats for oral history | Schema alignment |
| List of relay services | Infrastructure planning |

---

> “To preserve culture in motion, one must master protocols in stillness.”

Your notebook is now a bridge—between the old world and the new.

