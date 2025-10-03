# AI Assistant Session Guidance

**Purpose**: This document provides explicit instructions to AI assistants working on this codebase to ensure consistent, complete implementations.

---

## 🎯 Core Principles

### 1. Strategic Keywords Trigger Protocols

When you encounter these keywords from the user, **STOP normal workflow** and execute specific protocols:

| Keyword                   | Meaning                                | Required Action                            |
| ------------------------- | -------------------------------------- | ------------------------------------------ |
| **"battle-tested"**       | Proven reference implementation exists | Execute `/docs/implementation-protocol.md` |
| **"proven"**              | Same as battle-tested                  | Execute `/docs/implementation-protocol.md` |
| **"use X as reference"**  | X is the template for new work         | Do comprehensive comparison                |
| **"make it work like X"** | Replicate ALL patterns from X          | Check EVERY aspect, not just obvious ones  |
| **"follow same pattern"** | Pattern replication required           | Systematic verification needed             |

### 2. Escalation Triggers

Certain situations require escalating from "fix this thing" to "comprehensive audit":

**Escalate When:**

- User mentions another feature as reference
- User says "same as", "like", "follow"
- You're implementing Feature B based on Feature A
- User mentions production, tested, proven, stable

**Escalation Means:**

1. Read `/docs/reference-implementations.md` for the reference
2. Follow `/docs/implementation-protocol.md` completely
3. Create explicit comparison checklist
4. Verify EVERY pattern before declaring done

### 3. Completeness Definition

**Incomplete (❌)**:

- "I found one difference and fixed it"
- "The main functionality works"
- "I checked the obvious things"

**Complete (✅)**:

- "I compared ALL aspects systematically"
- "Here's the checklist of what I verified"
- "I found X differences, fixed all, here's the summary"

---

## 📋 Standard Operating Procedures

### SOP 1: Reference Implementation Work

**Input**: User mentions battle-tested code or asks to replicate a feature

**Steps**:

1. **Acknowledge Protocol**:

   ```text
   "I see [Feature X] is battle-tested. I'll use the comprehensive
   comparison protocol to ensure complete alignment."
   ```

2. **Read Reference Docs**:
   - `/docs/reference-implementations.md` - What patterns to replicate
   - `/docs/implementation-protocol.md` - How to execute

3. **Create Comparison Matrix**:

   ```markdown
   ## [Reference] → [New Implementation]

   ### Form Layer

   - [ ] Pattern 1: [status]
   - [ ] Pattern 2: [status]

   ### Data Layer

   - [ ] Pattern 3: [status]
         ...
   ```

4. **Systematic Verification**:
   - Check each item individually
   - Use grep/search to compare code patterns
   - Don't skip "obvious" ones

5. **Report Comprehensively**:

   ```text
   Verified alignment on:
   ✅ Tag filtering (filterVisibleTags)
   ✅ System tag prevention
   ✅ RichTextEditor props
   ✅ State initialization
   ...
   ```

### SOP 2: Handling Deviations

**When you find differences**:

1. **Don't assume it's intentional**
2. **Flag it immediately**:

   ```text
   ⚠️ Deviation found:
   Reference: [code pattern]
   Current: [code pattern]

   Should this match the reference?
   ```

3. **Wait for user confirmation** before proceeding

### SOP 3: Documentation Updates

**After completing battle-tested implementation**:

1. Update `/docs/reference-implementations.md`:
   - Add completion date
   - List verified patterns
   - Note any intentional deviations

2. Update `/docs/implementation-protocol.md`:
   - Add any new lessons learned
   - Refine steps that were unclear
   - Add new trigger phrases discovered

---

## 🚫 Common Pitfalls to Avoid

### Pitfall 1: Narrow Focus Bias

**Problem**: User asks about specific issue → You only check that issue  
**Solution**: When reference exists, check EVERYTHING regardless of question

### Pitfall 2: Premature Satisfaction

**Problem**: Found one match → Assume everything is aligned  
**Solution**: Complete entire checklist systematically

### Pitfall 3: Missing Meta-Signals

**Problem**: User says "battle-tested" → You treat as casual context  
**Solution**: "Battle-tested" is a COMMAND to execute protocol

### Pitfall 4: Reactive Analysis

**Problem**: Wait for user to point out each issue  
**Solution**: Proactively compare all aspects upfront

---

## 🎯 Success Criteria

### Before Declaring "Done":

- [ ] All comparison checklist items verified
- [ ] Deviations flagged and approved
- [ ] Documentation updated
- [ ] Build passes
- [ ] Side-by-side code review completed

### Communication Quality:

**Good**:

```text
"Comprehensive comparison complete:
✅ 12 patterns verified matching reference
✅ 2 deviations found and aligned
✅ Documentation updated

Reference implementation: Shop
New implementation: Heritage
Status: Fully aligned"
```

**Bad**:

```text
"Fixed the issue" ❌
"Should work now" ❌
"Looks good" ❌
```

---

## 📖 Key Documents Reference

Always have these open when working:

1. `/docs/reference-implementations.md` - What to replicate
2. `/docs/implementation-protocol.md` - How to replicate
3. `/docs/critical-guidelines.md` - General coding standards
4. This document - How to interpret user instructions

---

## 🔄 Continuous Improvement

After each session where "battle-tested" was mentioned:

1. **Self-review**: Did I follow the protocol completely?
2. **Gaps found**: What did I miss and why?
3. **Update docs**: Add learnings to prevent repeat
4. **Refine protocol**: Make it clearer for next time

---

## 💡 Remember

> **"Battle-tested" is not context information.  
> It's an instruction to execute a specific protocol.**

When in doubt:

1. Check if reference implementation exists
2. If yes → Execute comprehensive protocol
3. If no → Ask user for reference or proceed with standard approach

**Default Mode**: Reactive to specific questions  
**Battle-Tested Mode**: Proactive comprehensive comparison

**Switch modes when keywords detected!**
