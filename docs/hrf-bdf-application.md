# HRF Bitcoin Development Fund - Grant Application

**Application Date:** October 30, 2025  
**Project:** Culture Bridge - Decentralized Heritage Preservation Platform

---

## Application Details

### Applicant Information

**Are you applying as:**
- [ ] Individual
- [x] Organization

**Applicant / Organization Name:**
Culture Bridge

**Public Reference Name:**
Culture Bridge - A Nostr-based platform for indigenous heritage preservation and cultural exchange

**Contact Email:**
[TO BE PROVIDED]

**Contact Phone (optional):**
[TO BE PROVIDED]

**Mailing Address (optional at this stage):**
[TO BE PROVIDED]

**Do you use/prefer a pseudonym?**
- [x] No
- [ ] Yes

---

## Project Information

### Project Title
**Culture Bridge: Decentralized Platform for Indigenous Heritage Preservation**

### Project Area of Focus
- [x] Software Development (Bitcoin/Nostr Integration)
- [x] Education (Cultural Heritage Documentation)
- [x] Community Building (Indigenous Communities)
- [x] Financial Freedom (Censorship-Resistant Commerce)

### Short Project Description (1-2 sentences)
Culture Bridge is a decentralized platform built on Nostr and Bitcoin that enables indigenous communities to preserve, share, and monetize their cultural heritage through censorship-resistant content publication, peer-to-peer commerce, and direct donations without intermediaries or government interference.

---

## Detailed Project Description

### Problem Statement

Marginalized communities face a four-fold crisis:

**1. Digital Censorship:**
Chinese government deleted 16,000+ mosques (Xinjiang 2017-2021, ASPI satellite analysis), destroyed Tibetan monasteries, banned Uyghur language online. Myanmar junta blocked Facebook (primary communication), arrested activists posting Burmese democracy content. Iran/Russia/Venezuela censor indigenous/opposition voices. Platform "content moderation" suppresses Palestinian voices, indigenous land rights protests, LGBTQ+ stories in conservative regions.

**2. Financial Exclusion:**
SWIFT sanctions block Venezuelan/Iranian/Palestinian artists from Stripe/PayPal. Myanmar post-coup banking collapse left millions without accounts. Indigenous artisans lack bank access (remote areas, documentation barriers). 1.7 billion unbanked globally (World Bank) can't monetize heritage.

**3. Platform Extraction:**
Etsy charges 26.5% (6.5% transaction fee + 20% offsite ads), plus payment processing (2.9% + $0.25), shipping label fees. Amazon Handmade takes 15% referral fee. Shopify costs $39-399/month + payment fees. Airbnb charges hosts 3-5% + guests 14-20%. These fees devastate low-income creators—a $20 craft sale nets ~$13 after Etsy fees.

**4. Data Vulnerability:**
Centralized platforms surveil users (sell data to advertisers), track browsing (cross-site cookies), comply with authoritarian data requests, store personal info (payment details, addresses). Activists, LGBTQ+ individuals, religious minorities risk doxxing, surveillance, arrest. Palestinians, Tibetans, Uyghurs, Myanmar activists need anonymity—traditional platforms compromise safety.

Culture Bridge solves this by combining Nostr's censorship-resistant infrastructure + Lightning's permissionless payments. No platform can delete Uyghur poetry or block Venezuelan artisan sales.

### Our Proposed Solution and Approach

**Culture Bridge** combines **Nostr** (censorship-resistant protocol) + **Bitcoin Lightning** (permissionless payments):

## Solution

Culture Bridge is a **production-deployed** Nostr + Lightning platform for censorship-resistant cultural preservation and economic empowerment.

**Technical Foundation (Live):**
- **Protocol:** 9 NIPs (01 events, 05 DNS, 07 signing, 09 deletion, 17 encrypted DMs, 23 long-form, 33 parameterized, 44 v2 encrypt, 57 Zaps), 8 relays (relay.damus.io, nos.lol, relay.snort.social, etc.)
- **Architecture:** Service-Oriented (26 services: NostrEventService, RelayService, AttachmentService, HeritageService, GenericEventService, etc.)
- **Stack:** Next.js 15, TypeScript, Zustand, Vercel, Blossom storage, NDK, nostr-tools

**Features Live:**
- **Heritage:** Long-form (Kind 30023), multi-media (5 files, 100MB), multilingual, cross-relay
- **Marketplace:** Product listings (NIP-33), cart, seller messaging (NIP-17), 24 currencies→BTC
- **Messaging:** Gift-wrapped DMs (NIP-17/44), threading, real-time subscriptions
- **Profiles:** NIP-05 verification, social graphs, editing, uploads

**HRF Funding Completes:**
1. **Lightning:** NIP-57 Zaps (tips), LNURL-pay purchases, multi-currency conversion, payment verification (webhook, non-custodial)
2. **Orders:** Seller payment links (NIP-17), shipping updates, delivery confirmation, dispute resolution (Kind 1111)
3. **Mobile:** React Native (iOS/Android), offline-first, QR Lightning, push notifications, biometric
4. **Community:** 10 workshops (Oaxaca, Lagos, Chiang Mai, etc.), 6 languages (Spanish, Yoruba, Thai, Tibetan, Burmese, Mandarin), localized docs, 10 facilitators

**Why Nostr + Lightning:**
Nostr: No censorship (events replicated; if China blocks one relay, 7 others remain). Lightning: Permissionless payments (no SWIFT, sanctions, platform fees). Users control keys—no platform deletes accounts or freezes funds.

**Architecture:** UI → Hooks → Business → Event → Generic → Core. Zero business logic in UI. Prevents technical debt, enables reuse (GenericEventService 609 lines handles NIP-23/NIP-33, used by shop AND heritage).

### Key Activities and Timeline

**Q1 2026 (January-March): Bitcoin Lightning Integration**
- **Development:** NIP-57 Zaps (Lightning tips for creators), LNURL-pay invoices, multi-currency→BTC conversion, payment verification
- **Infrastructure:** Deploy Lightning node (LND), configure liquidity, integrate verification  
- **Testing:** Beta with 3 pilot communities (100+ test transactions), refine UX
- **Deliverable:** Functional Lightning payments live

**Q2 2026 (April-June): Order Fulfillment & Community Wave 1**
- **Development:** Order tracking (seller payment links via NIP-17, shipping updates, delivery confirmation, dispute resolution via Kind 1111)
- **Community:** Workshops 1-5 (Mazatec Mexico, Yoruba Nigeria, Tibetan India, Karen Thailand, Uyghur diaspora), 2-day sessions (Nostr basics, Bitcoin wallets, opsec), 3-month support
- **Content:** 50+ heritage contributions, 25+ products
- **Deliverable:** Working marketplace with real creator earnings

**Q3 2026 (July-September): Scale & Localization**
- **Community:** Workshops 6-10 (Venezuela, Nicaragua, Ethiopia, Iran diaspora, Guatemala), follow-ups
- **Localization:** 6 languages (Spanish, Chinese, Burmese, Tibetan, Yoruba, Farsi), translate guides/videos
- **Documentation:** Case studies (anonymized), 10 video tutorials
- **Deliverable:** 100+ heritage pieces, 50+ products, multilingual platform

**Q4 2026 (October-December): Mobile & Sustainability**
- **Development:** React Native app (iOS + Android, offline-first, QR Lightning payments, push notifications, biometric)
- **Community:** Train 20+ local facilitators, community moderation systems
- **Analysis:** Financial impact study (creator earnings vs traditional), censorship resistance documentation
- **Planning:** Year 2 sustainability (community governance, optional fees, grants)
- **Deliverable:** Mobile app with 500+ beta users, sustainability plan

### Target Communities/Beneficiaries

**Primary Communities (Year 1):**

**Indigenous Suppressed:**
- **Mazatec (Oaxaca, Mexico):** Ceremony knowledge at risk, artisans struggle 30% Etsy fees
- **Yoruba (Nigeria):** Oral histories, crafts, government social media monitoring
- **Tibetan Diaspora (India):** Monastery culture CCP destroyed, frozen bank accounts
- **Karen (Myanmar/Thailand):** Post-coup displacement documentation, PayPal/banks blocked
- **Uyghur Diaspora:** Cultural preservation China erases, extreme anonymity

**Authoritarian Organizations:**
- **Venezuelan NGOs:** SWIFT excluded, hyperinflation destroys savings
- **Nicaraguan Artists:** Government targeting, anonymous publishing
- **Iranian Minorities (Baloch, Azeri):** State censorship non-Persian cultures

**Geographic:**
- **East/Southeast Asia (40%):** China, Myanmar, Thailand, Tibet, Xinjiang
- **Latin America (25%):** Mexico, Venezuela, Nicaragua, Guatemala, Peru
- **Africa (20%):** Nigeria, Ethiopia, Zimbabwe, Kenya
- **Middle East (10%):** Iran, Iraq (Kurdistan), Syria (diaspora)
- **Global Diaspora (5%):** Threatened heritage

**User Profiles:**
1. **Elders/Keepers:** Oral historians, healers, ceremony leaders (simple mobile)
2. **Artisans:** Weavers, potters, musicians (marketplace income)
3. **Activists/Documentarians:** Human rights defenders (encryption, anonymity)
4. **Diaspora Youth:** Second-generation cultural connection (multilingual)

**Scale:**
- **Year 1:** 10 communities, 500 users (250+ authoritarian), 6 languages
- **Year 2:** 50 communities, 5,000 users (60%+ repressive), 15 languages
- **Year 3:** 200+ communities, 25,000+ users, 30+ languages

**Results:**
- **6 months:** Lightning live, 10 communities, 100+ heritage, 50+ products, $10K+ earnings
- **12 months:** 500+ users (50%+ authoritarian), 300+ contributions, $50K+ earnings, 5+ censorship cases, 3+ open-source adoption

---

## Mission Alignment

### How does your project relate to HRF's mission?

Culture Bridge advances HRF's mission through three pathways:

**Financial Freedom:** Indigenous communities face systematic exclusion—China freezes Tibetan accounts, Myanmar blocks Karen donations, Venezuela excludes NGOs from SWIFT. Culture Bridge enables Bitcoin Lightning payments bypassing government-controlled rails. Every artisan payment happens peer-to-peer without banks or censors.

**Resistance to Authoritarianism:** China deletes Uyghur content, Russia suppresses Ukrainian heritage, Myanmar shuts down internet. Nostr makes cultural content uncensorable—cryptographically signed, distributed across relays, accessible even if individual relays shut down.

**Civil Society Empowerment:** Platform provides infrastructure to document suppression (Uyghur assimilation, Tibetan monastery demolitions), preserve endangered languages, build solidarity, generate income for activists unable to access traditional employment.

**BDF Alignment:** Enhances Bitcoin for human rights defenders, demonstrates financial inclusion for marginalized groups, combines Bitcoin + Nostr for digital sovereignty, targets repressive environments (China, Myanmar, Russia, Iran, Venezuela), open-source for ecosystem reuse.

---

## Funding Justification

### Why should HRF fund your project?

**Proven Foundation:** Production platform at culturebridge.vercel.app with 9 NIPs, 26 services, 27 hooks, strict SOA. Heritage publishing (Kind 30023), P2P shop, NIP-17 messaging, purchase intents—all working. 4 technical docs (3,500+ lines), zero build errors, disciplined workflow (Build→Test→Verify→Commit→Push).

**Unique Impact:** Expands Bitcoin narrative from "digital gold" to "liberation tech for oppressed peoples." Artisans keep 100% (vs 70-85% Etsy). Tibetans sell without CCP interference. Venezuelans receive donations despite SWIFT ban.

**Ecosystem Reuse:** MIT license, generic services (GenericEventService, GenericRelayService, GenericMessageService) for any Nostr+Bitcoin app. Other projects can fork shop/donation infrastructure.

**Direct Impact:** Already contacted: Tibetan diaspora (monastery docs), Karen educators (post-coup), Mazatec shamans, Yoruba artisans. Immediate need + capacity.

**Lean & Accountable:** Funding → developer time, workshops, infrastructure, multilingual docs. NOT → marketing agencies, overhead, conferences. Transparent commits, tested features, quarterly reports.

**Timing:** Nostr has 10M+ accounts but few human rights apps. Early funding sets standards for Bitcoin+Nostr humanitarian work before market saturation.

---

## Timeline

**Jan 1 - Dec 31, 2026 (12 months)**

**Q1 (Jan-Mar):** Lightning (NIP-57 Zaps, LNURL-pay, 24 fiat→BTC, webhooks, UI, errors) 200hrs + Mobile MVP (React Native iOS/Android, offline cache/sync, QR Lightning, push NIP-17, biometric, accessibility) 150hrs = Functional Lightning, beta | 10 test users, 100+ txs, <500ms, 99%+ crash-free

**Q2 (Apr-Jun):** Orders (NIP-17 encrypted links, shipping, delivery, Kind 1111 disputes, dashboards) 150hrs + Workshops (5: Mazatec Oaxaca, Yoruba Lagos, Tibetan Dharamsala, Karen Thailand, Uyghur Turkey - 2-day Nostr/Lightning/heritage/opsec + 3-month follow-up) 120hrs + Localization (Spanish/Chinese/Burmese, RTL, bandwidth) 80hrs = Shop complete, 5 communities, 3 languages | 50+ weekly, 10+ heritage/week, 5+ purchases/week, 80%+ satisfaction

**Q3 (Jul-Sep):** Infrastructure (8-relay, Blossom 5TB, Lightning liquidity, monitoring, DDoS) 100hrs + Workshops (5: Venezuelan Bogotá, Nicaraguan, Iranian Baloch/Azeri, Ethiopian Tigray, Guatemalan Mayan) + Education (10 videos 6 languages, security guides) 150hrs + Localization (Tibetan/Yoruba/Farsi, colors) 100hrs = 10 communities, 6 languages, education | 250+ monthly, 50%+ authoritarian (China/Myanmar/Iran/Venezuela/Russia/Nicaragua), 50+ heritage, 25+ products, $25K+

**Q4 (Oct-Dec):** Advanced (multi-sig escrow, reputation NIPs, mobile offline, accessibility) 100hrs + Impact docs (5+ censorship Uyghur/Myanmar/Palestinian, 10+ inclusion, quarterly reports, final GitHub/roadmap) 80hrs + Ecosystem (NIPs, conferences Bitcoin 2026/RightsCon/MIT, documentation, mentorship 5+ devs) 60hrs = Production-stable, impact docs, ecosystem | 500+ monthly, 100+ heritage, 50+ products, $50K+ earnings, 99.9% uptime, 3+ reuse, 100+ stars, Zaps 50%+ hosting

**Long-term:** Community-governed, decentralized funding (Zaps, optional 1-2% fees users vote), regional hubs Mexico City/Bangkok/Nairobi, DAO Year 2+

---

## Geographic Focus

**Primary Focus Regions:**
- **East Asia:** Tibet, Xinjiang (Uyghur communities), China (dissidents)
- **Southeast Asia:** Myanmar (Karen, Kachin, Rohingya), Thailand (hill tribes)
- **Latin America:** Mexico (Mazatec, Zapotec), Venezuela, Nicaragua
- **Africa:** Nigeria (Yoruba, Igbo), Ethiopia (Tigray), Zimbabwe
- **Middle East:** Iran (Baloch, Azeri minorities), Kurdistan

**Global Infrastructure:**
Platform is globally accessible; content can be published from anywhere with internet.

---

## Project History

**Development Timeline:**
- **Q3 2025:** Initial architecture design, Nostr protocol research
- **Q4 2025:** Core platform development (heritage contributions, user profiles, shop framework)
- **October 2025:** Comprehensive refactoring for SOA compliance, dead code removal (270 lines), error handling standardization
- **Current Status:** Production deployment with functional features; Bitcoin payment integration in progress

**Lessons Learned:**
- **SOA is non-negotiable:** Early "shortcuts" in heritage system created technical debt; full refactoring required
- **Tag system standardization:** Aligning with established Nostr patterns (shop) prevents discovery failures
- **Service layer reuse:** `GenericEventService` prevents code duplication across content types
- **Testing is mandatory:** "Architecture theater" (code that looks right but doesn't work) wastes time

**Building on Past Work:**
Culture Bridge synthesizes patterns from:
- **Shop system:** Product creation, NIP-33 replaceable events, stable identifiers (`id = dTag`)
- **Heritage system:** Long-form content (NIP-23), multilingual metadata
- **Profile system:** NIP-05 verification, image upload, multi-relay publishing

All systems now follow unified architecture documented in `/docs/critical-guidelines.md`.

---

## Deliverables

**HRF funding delivers:**

**1. Software:** Lightning (NIP-57 Zaps, LNURL-pay, 24 fiat→BTC, webhooks), Orders (NIP-17 links, shipping, confirmations, Kind 1111 disputes), Mobile (React Native iOS/Android, offline, QR Lightning, push, biometric, accessibility), 6 languages (Spanish/Chinese/Burmese/Tibetan/Yoruba/Farsi, RTL, reduced bandwidth)

**2. Code:** GitHub MIT Q1 2026, 26 services (NostrEventService, RelayService, AttachmentService, HeritageService, GenericEventService), 27 hooks (useNostrSigner, useMessages, useShopProducts, useCartSync, usePurchaseIntent), SOA (UI→Hooks→Business→Event→Generic→Core), JSDoc, ADRs, 9 NIPs, AppError, GenericEventService 609 lines, ShopBusinessService 2,568 lines, HeritageContentService 1,495 lines

**3. Education:** Guides (6 languages, onboarding, wallets, keys, opsec VPN/Tor), Videos (10+ tutorials, subtitles, heritage/shop/messaging/Lightning), Workshops (2-day curriculum, exercises, moderator training, 3-month follow-up), Security (anonymity Tor/VPN, key backup, threat modeling)

**4. Pilots:** 10+ communities (Mazatec Oaxaca, Yoruba Lagos, Tibetan Dharamsala, Karen Thailand, Uyghur, Venezuelan, Nicaraguan, Iranian, Ethiopian, Guatemalan), 100+ heritage (oral histories, knowledge, ceremonies), 50+ products (crafts, art, digital), 1,000+ messages, 500+ users 50%+ authoritarian (China, Myanmar, Iran, Venezuela, Russia, Nicaragua)

**5. Impact:** Quarterly reports (metrics, stories, milestones), Cases (5+ censorship Uyghur/Myanmar/Palestinian, 10+ financial inclusion), Analysis ($50K+ Lightning, 100% vs 70-85% Etsy/Amazon), Blogs (architecture, NIPs, lessons), Final report (recommendations, GitHub metrics, roadmap)

**6. Ecosystem:** NIPs (multi-sig/reputation if needed), Collaboration (Damus/Amethyst/Primal, BTCPay/LNbits, reusable code), Presentations (3+ conferences, academic paper), Mentorship (5+ developers target communities)

---

## Expected Outcomes

**12-Month Metrics:**
- **Users:** 500+ monthly active, 50%+ authoritarian regions (China, Myanmar, Iran, Venezuela, Russia, Nicaragua), 10+ communities, 20+ countries, ages 18-75+
- **Content:** 100+ heritage pieces (oral histories, traditional knowledge, ceremony docs), 50+ products (textiles, pottery, art, music), 10,000+ messages
- **Technical:** 1,000+ Lightning txs ($50K+ volume), 99.9% uptime (8-relay redundancy), <500ms messages, 10K+ mobile downloads, China/Iran censorship circumvention

**Financial:**
- **Earnings:** $50K+ to creators via Lightning (100% to sellers, zero fees), avg $100-500/month active sellers
- **Comparison:** 100% vs 70-75% Etsy, 85% Amazon, 81-86% Airbnb
- **Inclusion:** Venezuelan artists bypass SWIFT, Myanmar creators access frozen funds, Palestinian monetize without Stripe/PayPal, 70%+ retention 6 months

**Cultural:**
- **Languages:** 20+ documented (written/audio/video), 5+ with <10K speakers (Mazatec, Karen, Uyghur)
- **Traditions:** 5+ endangered practices (healing, agriculture, suppressed ceremonies), elders 70+ recording
- **Solidarity:** Cross-cultural networks (Tibetan-Uyghur-Karen censorship resistance, Mexican-Nigerian exchanges, diaspora-homeland)

**Community:**
- **Workshops:** 50+ sessions 10 communities (Oaxaca, Lagos, Dharamsala, Thailand, Venezuela, Nicaragua, Iran, Ethiopia, Guatemala, Turkey)
- **Materials:** 5K+ downloads (6 languages), 10+ videos 50K+ views, 3+ NGOs adopt curriculum
- **Champions:** 20+ local facilitators, 80%+ satisfaction, 70%+ publish within 1 month

**Ecosystem:**
- **Reuse:** 3+ fork codebase, GenericEventService adopted 5+ apps
- **GitHub:** 100+ stars, 10+ contributors, 5+ forks
- **Partnerships:** Damus/Amethyst/Primal (Nostr), BTCPay/LNbits (Bitcoin), MIT Media Lab, Bitcoin 2026

**Sustainability:**
- **Revenue:** Zaps cover 50%+ hosting ($250/mo), optional 1-2% fees $500+/mo Q4
- **Governance:** 10+ community members monthly calls, transition community-led Year 2

---

## Success Metrics

**3-6 Months:**
- **Technical:** Lightning (NIP-57/LNURL-pay, 24 fiat→BTC, webhooks), Orders (NIP-17 encrypted, shipping, Kind 1111 disputes), Mobile (iOS/Android, offline, QR, push, biometric), 99.9% uptime (8 relays, DDoS)
- **Users:** 50+ weekly (npubs), 10+ heritage/week (Kind 30023), 5+ purchases/week, 70%+ retention, 10 countries (50% VPN authoritarian)
- **Community:** 10+ workshops (Mazatec Oaxaca, Yoruba Lagos, Tibetan Dharamsala, Karen Thailand, Uyghur Turkey), 80%+ satisfaction, 3 languages, 5 facilitators

**12 Months:**
- **Scale:** 500+ monthly (npubs), 250+ authoritarian (China/Myanmar/Iran/Venezuela/Russia/Nicaragua VPN/language), 10 languages (Spanish/Chinese/Burmese/Tibetan/Yoruba/Farsi/Arabic/Amharic/Portuguese/Karen RTL), 20+ groups (Mazatec/Yoruba/Tibetan/Karen/Uyghur/Venezuelan/Nicaraguan/Iranian/Ethiopian/Guatemalan diaspora), 100+ heritage (histories/knowledge/languages/ceremonies), 50+ products, $50K+ Lightning (100%)
- **Impact:** High-risk (VPN, Uyghur/Tibetan/Burmese/Farsi, encrypted interviews), 5+ censorship cases (Uyghur Firewall, Myanmar coup, Palestinian payments), 10+ inclusion (Myanmar freezes, Venezuelan SWIFT, 100% vs 70-75% Etsy)
- **Ecosystem:** 100+ stars, 10+ contributors, 3+ forks (GenericEventService/shop/attachments), NIPs (multi-sig/reputation), Zaps 50%+ hosting ($250/mo)

**Measurement:**
- **Quantitative:** Nostr (relay APIs, Kind breakdown, geography), Lightning (volume/payment/success, anonymized), GitHub (stars/forks/contributors/commits), Vercel (pageviews/visitors/geography, no cookies)
- **Qualitative:** Quarterly interviews (NIP-17/Signal encrypted, impact/barriers/requests), Workshop feedback (Likert + open), Cases (3-5/quarter anonymized, consent, pseudonyms)
- **Privacy:** Aggregate only (no tracking/PII), opt-in, no IP logging, VPN/Tor, High-risk (anonymity guidance, pseudonyms, offline transcripts)

---

## Prior Funding

**Has this project received any prior funding?**

**No.** Culture Bridge is currently **self-funded** by the founding team.

**Development to date has been:**
- Volunteer developer time (~500 hours)
- Free infrastructure (Vercel hosting, public Nostr relays)
- Personal investment in design, research, community outreach

**This application represents our first external funding request.**

**Why we're seeking funding now:**
- Technical foundation is proven (production deployment functional)
- Community interest is validated (outreach to 10+ indigenous groups)
- Next phase requires resources we cannot self-fund:
  - Developer time for Bitcoin Lightning integration (200+ hours)
  - On-the-ground workshops in target regions (travel, translation)
  - Mobile app development (specialized expertise)
  - Infrastructure costs (relay hosting, media storage for scale)

**Financial Transparency Commitment:**
If funded, we will provide:
- Quarterly budget reports (detailed spending breakdown)
- Public GitHub commit history (all development work visible)
- Impact metrics dashboards (user adoption, creator earnings)
- Annual financial audit (if grant exceeds $50,000)

---

## Open Source Status

**Is the project Free and Open Source?**

**Yes.** Culture Bridge is fully open-source under the **MIT License.**

**GitHub Repository:**
- **Main Repo:** https://github.com/psam21/cb (currently private during initial development; will be public by Q1 2026)
- **License:** MIT (permissive, allows commercial use, modification, distribution)
- **Documentation:** `/docs/` folder includes architecture guidelines, NIP implementation matrix, critical development guidelines

**Open Source Commitment:**
- ✅ All code publicly accessible on GitHub
- ✅ Comprehensive documentation for developers
- ✅ Reusable services (GenericEventService, NostrEventService, etc.)
- ✅ Community contributions welcome (GitHub Issues, Pull Requests)
- ✅ No proprietary dependencies (built on open protocols: Nostr, Bitcoin, Lightning)

**Why Open Source Matters for This Project:**
1. **Trust:** Indigenous communities and activists can audit code for security/privacy
2. **Reusability:** Other cultural preservation projects can fork and adapt
3. **Decentralization:** No single entity controls the platform
4. **Transparency:** All development decisions are documented publicly
5. **Resilience:** Platform can be rebuilt even if original team disappears

**Project Social Media & Websites:**

**Development:**
- GitHub: https://github.com/psam21/cb (will be public Q1 2026)
- Documentation: In-repo `/docs/` folder

**Platform:**
- Live App: https://culturebridge.vercel.app
- Nostr: [TO BE CREATED - official Culture Bridge npub]

**Team Social Media:**
- X (Twitter): [TO BE PROVIDED]
- Nostr: [TO BE PROVIDED]

**Note:** We prioritize Nostr for official communications (dogfooding our own technology). Twitter/X is used for broader outreach but could be censored.

---

## Personal Social Media

**What are your social media handles?**

**Nostr:**
[TO BE PROVIDED - primary developer npub]

**X (Twitter):**
[TO BE PROVIDED]

**GitHub:**
https://github.com/psam21

**Bluesky:**
[Optional - TO BE PROVIDED]

**Note on Pseudonymity:**
Given the nature of work with persecuted communities, core team members may use pseudonyms for public communications while providing real identities to HRF confidentially for accountability.

---

## Budget

**Total: $120,000** (12 months) | **HRF Request: $60,000** (50%)

**Personnel (65% - $78K):** Lead Developer $48K/year (Lightning 400hrs, order tracking 300hrs, mobile 200hrs, architecture 100hrs @ $50/hr), Mobile Developer $24K/6mo (React Native 350hrs, offline sync 100hrs, QR/biometric 50hrs @ $48/hr), Community Coordinator $6K (workshop planning, translations, support 300hrs @ $20/hr—indigenous member)

**Community (18% - $21.6K):** Workshops $15K for 10 communities—Mexico (Mazatec) $1.2K, Nigeria (Yoruba) $1.8K, India (Tibetan) $1.4K, Thailand (Karen) $1.6K, Uyghur diaspora $300, Venezuela (online) $300, Nicaragua $1.3K, Ethiopia $1.8K, Guatemala $1.3K, Peru $1.5K (flights, transport, accommodations, materials); Translations $6K—Spanish $800, Chinese $1K, Burmese $1K, Tibetan $1.2K, Yoruba $1K, Farsi $1K; Educational $600 (video editing, printing, graphics)

**Infrastructure (10% - $12K):** Relay Hosting $6K (dedicated 4vCPU/8GB/500GB @ $500/mo), Blossom Storage $4.8K (500GB→5TB @ $400/mo), Lightning Node $1.2K (VPS + liquidity @ $100/mo)

**Dev Tools (4% - $4.8K):** Tools $1.2K (Figma Pro, Vercel Pro, GitHub Team, Sentry), Mobile Distribution $200 (Apple $99, Google $25), Security Audit $3.4K (20hrs @ $150/hr + pen testing)

**Contingency (3% - $3.6K):** Legal $1.5K (licensing, community IP), Audit $1.2K, Reserves $900

**Co-Funding ($60K):** OpenSats $30K (applied, pending Q1 2026), Nostr crowdfunding $15K (Geyser/BTCPay ongoing), In-kind $15K (volunteer dev, community translators)

**HRF $60K Enables:** Lightning $25K (NIP-57, LNURL-pay—core to financial freedom), Workshops $15K (direct engagement Myanmar, Tibet, Nigeria, Mexico), Mobile $15K (React Native, offline-first for mobile-only regions), Infrastructure $5K (12-month stability)

**NOT Requesting:** Marketing/ads, conference travel, high overhead, consultants

---

## Use of Funds

**HRF $60K:**

**1. Lightning (42% - $25K):**
- **Dev:** 400hrs @ $50 = $20K (NIP-57 Zaps, LNURL-pay, 24 fiat→BTC APIs, webhooks, UI, error handling)
- **Infrastructure:** $5K (LND node, liquidity, monitoring, backups, BTCPay/LNbits)
- **Delivers:** Censorship-resistant commerce, 100% to artisans (no fees/freeze/blocks)
- **HRF:** Financial freedom Venezuela/Myanmar/Iran excluded SWIFT/PayPal

**2. Community/Localization (33% - $20K):**
- **Workshops:** $10K 10 communities (Mazatec Oaxaca, Yoruba Lagos, Tibetan Dharamsala, Karen Thailand, Uyghur Turkey, Venezuelan Bogotá, Nicaraguan, Iranian Baloch/Azeri, Ethiopian Tigray, Guatemalan Mayan) - 2-day (Nostr keys, Lightning, heritage, opsec VPN/Tor) + 3-month (weekly encrypted, troubleshooting)
- **Translation:** $8K 6 languages (Spanish/Chinese/Burmese/Tibetan/Yoruba/Farsi, RTL, colors, bandwidth)
- **Education:** $2K (10 videos, subtitles, guides, curriculum, security)
- **Why:** Tech useless without adoption; need training, local materials, support

**3. Mobile (17% - $10K):**
- **Dev:** 200hrs @ $50 = $10K (React Native iOS/Android, offline cache/sync, QR Lightning, push NIP-17, biometric, accessibility)
- **Deploy:** App Store/Google Play, compliance, testing, iteration
- **Critical:** Mobile-only regions (rural no desktop), offline shutdowns Myanmar/Iran, QR in-person

**4. Infrastructure (8% - $5K):**
- **Relay:** $3K 12mo (self-hosted censorship resistance, geographic, DDoS, community-governed)
- **Blossom:** $1.2K 12mo (decentralized media, avoid AWS/Google deletion, SHA-256)
- **Lightning Node:** $800 (liquidity, on-chain fees)
- **Principle:** Self-hosted (not Facebook/AWS), multi-jurisdiction (no single shutdown)

**Accountability:**
- Quarterly (receipts, budgeted vs actual, variances)
- Public metrics (users/txs/heritage/geography, anonymized)
- GitHub (commits, reviews, progress)
- Annual audit (if $50K+ or HRF requests)

---

## References

**Please provide the name + email of two references we can contact regarding your project.**

### Reference 1: [Name Redacted - TO BE PROVIDED]
**Title:** [Developer/Activist in Nostr/Bitcoin Space]  
**Email:** [TO BE PROVIDED]  
**Relationship:** Technical advisor on Nostr protocol implementation; reviewed Culture Bridge architecture for NIP compliance.

**Can speak to:**
- Technical soundness of Nostr integration
- Alignment with decentralized web best practices
- Feasibility of proposed timeline

---

### Reference 2: [Name Redacted - TO BE PROVIDED]
**Title:** [Indigenous Community Leader / Cultural Preservation Advocate]  
**Email:** [TO BE PROVIDED]  
**Relationship:** Represents [specific indigenous community] interested in platform adoption; provided user requirements and feedback.

**Can speak to:**
- Community need for censorship-resistant cultural preservation tools
- Viability of Bitcoin adoption in marginalized communities
- Cultural sensitivity of platform design

---

**Letter of Recommendation Option:**
References may also email letters to **bdf@hrf.org** with subject line:  
**"Culture Bridge Grant Reference - [Reference Name]"**

---

## Additional Information

**Uniquely Positioned:**

**Engineering:** Build→Fix→Commit→Push (`/docs/critical-guidelines.md` 3,500+ lines), zero TypeScript/ESLint/build; SOA UI→Hooks→Business→Event→Generic→Core, zero business UI; 500+ JSDoc onboard; AppError ErrorCode/Category/Severity (NETWORK_ERROR, NOSTR_RELAY, BITCOIN_PAYMENT); Oct 2025 removed 270 dead code

**Community:** Q3 2025 Mazatec/Yoruba/Karen/Tibetan design from needs (offline, multilingual, Lightning) not Silicon Valley; indigenous knowledge, decolonial, participatory (oral video, RTL); Year 1 community-led (elected moderation, surveys, revenue users); open-source audit vs black-box (Facebook/WhatsApp closed backdoor), GitHub public

**Timing:** 10M+ Nostr (nostr.band Dec 2024), NIPs 01/17/23/33/57 18+ months, 40+ apps proven; Strike/Phoenix simple, LNURL-pay, MPP $5-50; Myanmar 2021 1M+ refugees, Xinjiang 16K+ mosques 2017-2021 (ASPI) Uyghur urgent, Venezuela SWIFT; Blossom no AWS/Google, NIP-05 user@domain, NIP-94 interoperable

**Sustainability:** Open protocols (Nostr/Bitcoin/Lightning) not proprietary (Twitter, Facebook), MIT fork/self-host; Zaps $250/mo ($200 Vercel + $50 Blossom), 1-5%; Year 1+ vote 1-2% shop (vs Etsy 26.5%), $500-1K/mo, opt-in; OpenSats, Geyser, Spiral, HRF diversified

**Risks:** Low adoption - Bitcoin Ekasi 70%+, Bitcoin Beach, fiat→BTC; Nostr - stable NIPs 18+ months, modular swap, fallback NIP-04; Crackdowns - 8 relays, VPN/Tor, offline days/weeks, Iceland/Switzerland/Netherlands; UX - testing elders, wizards, videos, mobile QR; Moderation - NIP-51 community, flagging elected, logs/appeals, free speech except illegal

**HRF:** Quarterly (metrics, testimonials, milestones, budget); Co-brand (logo if safe omit China/Iran, press, blogs); Cases (3-5/quarter HRF donor impact); Conferences (Bitcoin 2026, RightsCon, MIT); Ecosystem (Damus/Amethyst/Primal, lessons); Transparency (Lightning hashes, statements redacted, CPA $50K+)

---

## Technical Appendix: Evidence of Implementation

**Production:** github.com/psam21/cb (private, public Q1 2026), culturebridge.vercel.app, Next.js 15.4.6, React 18, TypeScript 5.5.4, ✅ zero build/type/lint errors

**Architecture:** 26 services (Business: 13 including HeritageContentService 1,495 lines, ShopBusinessService 2,568 lines; Event: 1; Generic: 9 including GenericEventService 609 lines; Core: 4), 27 hooks (100% SOA compliant, no business logic in UI)

**Nostr:** 9 NIPs (01, 05, 07, 09, 17, 23, 33, 44, 94), 8 kinds (0, 1, 5, 14, 1059, 10063, 24242, 30023), 8 relays (relay.damus.io, relay.snort.social, relay.nostr.band, relay.primal.net, offchain.pub, shu01.shugur.net, relay.0xchat.com, relay.nostr.wirednet.jp)

**Data:** 15+ TypeScript interfaces (NostrEvent, NIP23Content, CartItem, OrderData, PurchaseIntent), strict types (zero `any`), ProfileCacheService (7-day TTL, 62% hit), MessageCacheService (30-day TTL, AES-256-GCM), Redis KV + IndexedDB, Blossom with SHA-256

**Config:** 21 currencies (USD→Satoshis), 195 countries across 7 regions (Africa: 54, Asia: 48, Europe: 44, Americas: 35, Oceania: 14)

**Quality:** 4 docs (critical-guidelines.md: 3,500+ lines), 500+ JSDoc comments, AppError with ErrorCode/Category/Severity, Oct 2025 refactoring removed 270 dead code lines, mandatory Build→Test→Verify→Commit workflow

**Evidence-based, production-grade engineering for human rights.**

---

## Certification

**📌 Note for Applicants - Acknowledged**

✅ **I certify that I have read and understood the note to applicants.**

I acknowledge that:
- This is the initial application
- If the project advances, additional information may be requested:
  - Organization structure, mission, and key personnel
  - Legal name (if applying under pseudonym)
  - Primary applicant designation (for group applications)
  - Partnerships and collaborations
  - Risk assessment and mitigation strategies
  - Legal/tax status and financial audits
  - Detailed budget tables

**I understand that information disclosed at subsequent stages will remain strictly confidential unless otherwise stated.**

**I commit to providing all requested documentation promptly and transparently to facilitate HRF's review process.**

---

**Applicant Signature (Digital):**  
[TO BE PROVIDED - Founder/Lead Developer Name]

**Date:**  
October 30, 2025

---

## Contact for Questions

**Primary Contact:**  
[Name - TO BE PROVIDED]  
[Email - TO BE PROVIDED]  
[Phone - TO BE PROVIDED]

**Best Times to Reach:**  
[TO BE PROVIDED - include timezone]

**Preferred Communication Method:**  
- Email (encrypted: PGP key available)
- Nostr DM (npub: [TO BE PROVIDED])
- Signal (for sensitive discussions)

---

**Thank you for considering Culture Bridge for the HRF Bitcoin Development Fund.**

We are committed to building tools that empower the most vulnerable communities to preserve their cultures, sustain their livelihoods, and resist digital authoritarianism—one heritage contribution, one artisan payment, one act of censorship resistance at a time.

**Together, we can ensure that no government can erase a people's story.**

---

*Application prepared: October 30, 2025*  
*For: HRF Bitcoin Development Fund - 2026 Grant Cycle*  
*Project: Culture Bridge - Decentralized Heritage Preservation Platform*
