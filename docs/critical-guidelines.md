# CRITICAL GUIDELINES - NON-NEGOTIABLE

**FOR: All developers and AI agents working on this codebase**
**CONTEXT LIMIT FRIENDLY: Essential rules only. No exceptions.**

---

## 🚨 CARDINAL SINS (Never Do These)

### 1. ARCHITECTURE THEATER

**❌ Building code that looks right but doesn't work**

- Coding without testing = FAILURE
- "Complete" without proof = LYING
- Pretty code without functionality = WASTE
- Architecture over working features = WRONG PRIORITY

**✅ THE FIX:**

- Build → Test → Verify → THEN mark complete
- Proof required: Event IDs, console logs, UI verification
- Function over form. Working over pretty.
- **NO SHORTCUTS. NO ASSUMPTIONS.**

### 2. SOA VIOLATIONS

**❌ Bypassing established service layers**

**CORRECT FLOW (NON-NEGOTIABLE):**

```text
Page → Component → Hook → Business Service → Event Service → Generic Service
```

**❌ WRONG (What heritage did):**

```text
Hook → Manually build events → Publish    // ARCHITECTURAL VIOLATION
```

**✅ THE FIX:**

- ALWAYS use service layers
- NEVER build events in hooks/components
- REUSE existing services (GenericEventService, NostrEventService)
- Follow shop pattern, not custom shortcuts

### 3. TAG SYSTEM CHAOS

**❌ Inventing your own tagging patterns**

**ESTABLISHED PATTERN (Use This):**

```typescript
// Event creation
['t', 'culture-bridge-{content-type}']

// Query filter
{ kinds: [30023], '#t': ['culture-bridge-{content-type}'] }
```

**❌ NEVER:**

- Invent new tag patterns without checking shop
- Use different discovery mechanisms per content type
- Create tags that aren't queryable

### 4. DEAD CODE ACCUMULATION

**❌ Leaving unused code "just in case"**

- If it's not imported → DELETE
- If it's not called → DELETE
- If tests don't exist → DELETE or write tests
- "Future use" without clear plan → DELETE

**✅ THE FIX:**

- Grep for usage before keeping code
- Remove immediately when confirmed unused
- No orphaned utilities, no dead exports

### 5. MOCK/PLACEHOLDER IMPLEMENTATIONS

**❌ Shipping incomplete code**

- "Coming Soon" pages → NOT ACCEPTABLE
- Mock data without real implementation → REMOVE
- Placeholder functions → COMPLETE OR DELETE
- "TODO" comments older than 1 sprint → TECHNICAL DEBT

---

## ⚡ MANDATORY WORKFLOW

### Build → Fix → Commit → Push → Verify

**EVERY. SINGLE. TIME.**

1. **Build:** `npm run build`
2. **Fix:** ALL errors iteratively
3. **Commit:** Detailed message explaining WHAT changed and WHY
4. **Push:** `git push origin main`
5. **Verify:** User tests on https://culturebridge.vercel.app
6. **Confirm:** Get explicit confirmation before marking complete

**❌ NO SKIPPING STEPS**
**❌ NO ASSUMING IT WORKS**
**❌ NO "IT COMPILES SO IT'S DONE"**

---

## 🎯 CODE QUALITY COMMANDMENTS

### 1. Service-Oriented Architecture (SOA)

**Layers are LAW:**

- **UI Layer:** Pages, Components (display only)
- **Hook Layer:** State management, UI logic (no business logic)
- **Business Service Layer:** Orchestration, validation, workflows
- **Event Service Layer:** Nostr event creation/formatting
- **Generic Service Layer:** Reusable NIP-23 event building
- **Relay Service Layer:** Network communication

**Each layer talks ONLY to adjacent layers.**

### 2. Code Reuse First

**Before writing ANY new code:**

1. Search for existing implementations
2. Check GenericEventService for event creation
3. Check if shop does something similar
4. Reuse > Refactor > Create new

**The question: "Does this already exist?" is MANDATORY.**

### 3. Testing is Not Optional

**Definition of "Complete":**

- ✅ Code written
- ✅ Build succeeds
- ✅ Tested manually end-to-end
- ✅ User verified it works
- ✅ Proof exists (event ID, console logs, screenshots)

**Anything less = INCOMPLETE**

### 4. Documentation is Sacred

**When you touch architecture:**

- Document the pattern
- Explain WHY (Architecture Decision Record)
- Update relevant docs
- Leave it better than you found it

---

## 🔥 HERITAGE SYSTEM LESSONS (Never Repeat)

### What Went Wrong

1. **No Architecture Review** → Built without checking shop pattern
2. **Took Shortcuts** → Bypassed service layers for "speed" → Technical debt
3. **Invented New Patterns** → Used `content-type` tag instead of `t` tag
4. **Built Events in Hooks** → Violated SOA, duplicated GenericEventService logic
5. **No Validation** → Skipped event validation that GenericEventService provides
6. **Dead Code Created** → createRevisionEvent() never used, revisionFilter.ts orphaned

### Remediation Applied

- ✅ Tag system aligned with shop pattern
- ⏳ Service layers being added (business + event)
- ⏳ Event creation moving to GenericEventService
- ⏳ Dead code removal in progress
- ⏳ Full architectural compliance required

### Prevention Rules

1. **MANDATORY:** Review shop pattern before implementing similar features
2. **MANDATORY:** Use GenericEventService.createNIP23Event() for all Kind 30023 events
3. **MANDATORY:** Architecture review for any new content type
4. **MANDATORY:** Follow SOA layers without exception
5. **FORBIDDEN:** Building events manually in hooks/components

---

## 💀 ANTI-PATTERNS (Instant Rejection)

### ❌ "It Compiles, Ship It"

**Problem:** TypeScript happy ≠ Feature working
**Fix:** Manual end-to-end testing REQUIRED

### ❌ "Works on My Machine"

**Problem:** Localhost ≠ Production
**Fix:** Test on https://culturebridge.vercel.app ONLY

### ❌ "I'll Document Later"

**Problem:** Later = Never
**Fix:** Document AS YOU CODE or don't code at all

### ❌ "Just One Little Shortcut"

**Problem:** Technical debt compounds
**Fix:** Do it right or don't do it

### ❌ "The User Will Test It"

**Problem:** User is not QA
**Fix:** YOU test it first, THEN user verifies

---

## 🛡️ DEFENSIVE CODING RULES

### 1. Never Trust Existing Code

- Read it
- Verify it works
- Test it yourself
- Ask user if uncertain

### 2. Never Assume State

- Check for null/undefined
- Validate all inputs
- Log extensively (console, not runtime)
- Handle errors explicitly

### 3. Never Skip Verification

- grep for imports before deleting
- Check usage before refactoring
- Verify queries return data
- Test ALL user paths

### 4. Never Bypass Validation

- Use existing validation utilities
- GenericEventService.validateEventForSigning()
- Business service validation methods
- Don't create events manually

---

## 📋 CHECKLIST FOR ANY NEW FEATURE

**Before writing a single line:**

- [ ] Does shop already do this? Study the pattern
- [ ] What services exist? Reuse them
- [ ] What's the SOA layer flow? Map it out
- [ ] Where does GenericEventService fit? Use it

**While coding:**

- [ ] Following SOA layers strictly
- [ ] Reusing existing services
- [ ] Using established tag patterns
- [ ] Adding extensive console logging
- [ ] No business logic in hooks/components

**Before committing:**

- [ ] `npm run build` succeeds
- [ ] All errors fixed
- [ ] Manual testing complete
- [ ] Proof collected (event IDs, logs)
- [ ] User verified it works
- [ ] Documentation updated

**After pushing:**

- [ ] Vercel deployment successful
- [ ] Production testing complete
- [ ] User confirmation received
- [ ] Feature marked complete

---

## 🚀 EFFICIENCY FOR AI AGENTS

### Context Window Optimization

**When you have limited context:**

1. **Read this file FIRST** - It contains critical patterns
2. **Check shop implementation** - It's the reference pattern
3. **Use grep aggressively** - Find before you build
4. **Reuse over create** - GenericEventService exists for a reason
5. **Test incrementally** - Don't batch changes

### Critical Questions to Ask BEFORE Coding

1. **Does this violate SOA?** → If yes, STOP
2. **Does shop do this?** → Study shop's approach
3. **Can I reuse existing services?** → Use them
4. **Is there a generic service?** → GenericEventService probably has it
5. **Have I verified existing code?** → Don't assume

### Red Flags (STOP Immediately)

- 🚩 Building events in a hook
- 🚩 Creating new tag patterns
- 🚩 Duplicating GenericEventService logic
- 🚩 Skipping service layers
- 🚩 Not testing before marking complete
- 🚩 Assuming code works without proof

---

## 🎓 LESSONS FROM FAILURES

### Heritage Implementation Failures

**Failure 1: Tag System Deviation**

- **What:** Used `content-type` tag instead of `t` tag pattern
- **Why:** Didn't check shop's established pattern
- **Fix:** Always review shop before implementing
- **Prevention:** Tag pattern is NOW standardized (see §3)

**Failure 2: SOA Bypass**

- **What:** Built events directly in useHeritagePublishing hook
- **Why:** Took shortcut instead of creating service layers
- **Fix:** Refactoring to use proper business/event services
- **Prevention:** SOA is NON-NEGOTIABLE (see §2)

**Failure 3: Code Duplication**

- **What:** Reimplemented GenericEventService.createNIP23Event() logic
- **Why:** Didn't check if event creation already existed
- **Fix:** Migrate to use GenericEventService
- **Prevention:** Code reuse first (see §2 of Code Quality)

**Failure 4: Dead Code**

- **What:** createRevisionEvent() created but never used
- **Why:** Planned feature abandoned, code not removed
- **Fix:** Deleting unused code + orphaned utilities
- **Prevention:** Delete unused code immediately (see §4)

### Architecture Theater Failure

**Failure:** Generic event service "complete" but never tested

- **What:** Built services, hooks, components
- **Why:** Focused on architecture over functionality
- **Fix:** Marked incomplete, went back, tested each piece
- **Prevention:** Test BEFORE marking complete (see Workflow)

---

## ⚖️ PRIORITY HIERARCHY (When in Doubt)

1. **SOA compliance** > Shortcuts (NON-NEGOTIABLE)
2. **User verification** > Your assumptions
3. **Code reuse** > Writing new code
4. **Testing** > Shipping
5. **Documentation** > Moving fast
6. **Proper architecture** > Quick hacks

---

## 🔒 SECURITY & DATA

- **NEVER** hardcode credentials
- **NEVER** access runtime logs
- **ALWAYS** use environment variables
- **ALWAYS** ask before showing user data
- **ALWAYS** implement proper access controls
- **ALWAYS** validate ALL inputs
- **ALWAYS** sanitize event content

---

## 📞 WHEN UNCERTAIN

**ASK. DON'T ASSUME.**

- Uncertain about pattern? → Check shop implementation
- Uncertain about architecture? → Follow SOA layers
- Uncertain about tags? → Use established pattern
- Uncertain about testing? → Ask user to verify
- Uncertain about deletion? → Grep for usage first

**The cardinal rule: When in doubt, ask the user.**

---

## ✅ SUCCESS CRITERIA

**A feature is complete when:**

1. ✅ Follows SOA architecture
2. ✅ Reuses existing services
3. ✅ Uses established patterns (tags, events, etc.)
4. ✅ Builds without errors
5. ✅ Tested end-to-end manually
6. ✅ User verified on production
7. ✅ Proof exists (event IDs, logs)
8. ✅ Documentation updated
9. ✅ No dead code introduced
10. ✅ Committed and pushed

**Anything less = INCOMPLETE. No exceptions.**

---

## 🚨 EMERGENCY STOP CONDITIONS

**STOP all work immediately if:**

- ❌ You're building events outside service layer
- ❌ You're inventing new patterns without checking shop
- ❌ You're bypassing validation
- ❌ You're duplicating existing code
- ❌ You can't explain the SOA flow
- ❌ You haven't tested but want to mark complete

**STOP. Go back. Do it right.**

---

## 📚 REFERENCE IMPLEMENTATIONS

### ✅ CORRECT: Shop Product Creation

```text
useShopPublishing.ts (Hook)
  ↓ calls
ShopBusinessService.createProduct() (Business Layer)
  ↓ calls
NostrEventService.createProductEvent() (Event Layer)
  ↓ calls
GenericEventService.createNIP23Event() (Generic Layer)
  ↓ returns
Unsigned event → Sign → Publish
```

**Critical Patterns:**

- Uses `id = dTag` as stable identifier (persists across updates)
- NIP-33 alignment: dTag stays same, eventId changes on replacement
- `dTagPrefix: 'product'` generates IDs like `product-{timestamp}-{random}`
- Business service orchestrates, event service builds, generic service creates

**Study this. Replicate this. Don't deviate from this.**

### ✅ CORRECT: Heritage Contribution Creation

```text
useHeritagePublishing.ts (Hook)
  ↓ calls
HeritageContentService.createHeritageContribution() (Business Layer)
  ↓ calls
NostrEventService.createHeritageEvent() (Event Layer)
  ↓ calls
GenericEventService.createNIP23Event() (Generic Layer)
  ↓ returns
Unsigned event → Sign → Publish
```

**Critical Patterns:**

- Uses `id = dTag` as stable identifier (matches Shop pattern)
- `dTagPrefix: 'contribution'` generates IDs like `contribution-{timestamp}-{random}`
- Auto-redirects to detail page after successful publication (1 second delay)
- Follows same SOA architecture as Shop

**Status: ✅ Fully aligned with Shop pattern (as of 2025-10-03)**

### ✅ CORRECT: Profile Metadata Publishing

```text
useUserProfile.ts (Hook)
  ↓ calls
ProfileBusinessService.updateUserProfile() (Business Layer)
  ↓ calls
ProfileBusinessService.publishProfile() (Publishing)
  ↓ calls
GenericEventService.signEvent() + GenericRelayService.publishEvent() (Generic Layer)
  ↓ returns
Kind 0 metadata event → Publish to relays
```

**Critical Patterns:**

- Kind 0 metadata events (user profile information)
- Image upload + cropping workflow (react-easy-crop)
- Field-level validation with inline error display
- NIP-05 DNS-based verification (real-time status checking)
- Multi-relay publishing with partial failure handling
- Immediate publish after image upload (no explicit save needed)
- State propagation via auth store to all components

**Status: ✅ Production-ready (as of 2025-10-06)**

### ❌ WRONG: Manual Event Building (NEVER DO THIS)

```text
useCustomHook.ts (Hook)
  ↓ manually builds tags
  ↓ manually creates event object
  ↓ signs and publishes directly

NO business layer
NO event service
NO generic service usage
= ARCHITECTURAL VIOLATION
```

**Never do this. Always use service layers.**

---

## 🎯 THE BOTTOM LINE

1. **Follow SOA** - No exceptions
2. **Reuse services** - GenericEventService exists for a reason
3. **Test everything** - No assumptions
4. **Verify with user** - They decide when it's complete
5. **Document changes** - Leave it better than you found it
6. **Delete dead code** - No orphaned utilities
7. **Use established patterns** - Check shop first

**This codebase has ZERO tolerance for:**

- Architecture violations
- Untested code marked "complete"
- Pattern deviations without justification
- Dead code accumulation
- Shortcuts that create technical debt

**Work with discipline. Build with integrity. Ship with proof.**

---

_Last Updated: October 1, 2025_
_Status: ACTIVE - Mandatory compliance for all contributors_
_Violations: Will be rejected and require immediate remediation_
