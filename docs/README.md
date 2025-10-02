# Documentation Index

This directory contains critical documentation for the Culture Bridge codebase. Read these documents to understand coding standards, architectural patterns, and implementation protocols.

---

## 📚 Documentation Structure

### 🚨 **Start Here**

#### [`critical-guidelines.md`](./critical-guidelines.md)
**Purpose**: Non-negotiable rules for all code  
**When to read**: FIRST - Before writing any code  
**Contains**:
- Cardinal sins (architecture violations, SOA bypasses)
- Mandatory workflow (build → fix → commit → push → verify)
- Code quality commandments
- Anti-patterns to avoid
- Success criteria

**Key Rule**: Service-Oriented Architecture (SOA) is LAW

---

### 🏆 **Battle-Tested Implementation System**

When implementing features based on proven patterns, use these three documents:

#### 1. [`reference-implementations.md`](./reference-implementations.md)
**Purpose**: Catalog of battle-tested code to replicate  
**When to read**: When told to "follow X pattern" or "X is battle-tested"  
**Contains**:
- Gold standard implementations (Shop = reference)
- Critical patterns to replicate
- Component mapping guides
- Alignment checklists

**Key Insight**: Shop Product Flow is the proven reference for all similar features

---

#### 2. [`implementation-protocol.md`](./implementation-protocol.md)
**Purpose**: Step-by-step procedure for reference-based work  
**When to read**: After identifying a reference implementation  
**Contains**:
- Mandatory protocol phases
- Comprehensive comparison checklist template
- Anti-patterns to avoid
- Validation gates

**Key Rule**: "Battle-tested" triggers comprehensive comparison, not just spot fixes

---

#### 3. [`ai-assistant-guidance.md`](./ai-assistant-guidance.md)
**Purpose**: Explicit instructions for AI assistants  
**When to read**: At session start (AI) or when supervising AI work (human)  
**Contains**:
- Keyword trigger table (battle-tested, proven, reference)
- Standard Operating Procedures
- Escalation rules (reactive → comprehensive mode)
- Communication protocols

**Key Insight**: "Battle-tested" is a COMMAND, not context

---

### 📖 **Feature-Specific Guides**

#### [`heritage-testing-guide.md`](./heritage-testing-guide.md)
**Purpose**: Testing procedures for heritage contributions  
**Contains**: End-to-end testing workflows

#### Other Guides
- `detail-page-inconsistencies.md`
- `heritage-architectural-issues-and-fixes.md`
- `heritage-contribution-system.md`
- `heritage-nostr-integration.md`
- `product-detail-page-requirements.md`
- `project-rules-and-memories.md`
- TipTap editor guides

---

## 🎯 Quick Decision Tree

### "I'm starting new work"
→ Read [`critical-guidelines.md`](./critical-guidelines.md)

### "User says: 'Follow shop pattern'" or "'Shop is battle-tested'"
1. Read [`reference-implementations.md`](./reference-implementations.md) - What to replicate
2. Follow [`implementation-protocol.md`](./implementation-protocol.md) - How to execute
3. Use [`ai-assistant-guidance.md`](./ai-assistant-guidance.md) - AI workflow

### "I'm fixing a bug"
→ Check [`critical-guidelines.md`](./critical-guidelines.md) for anti-patterns

### "I'm testing a feature"
→ Check feature-specific guides + [`critical-guidelines.md`](./critical-guidelines.md) success criteria

---

## 🔑 Key Concepts

### SOA (Service-Oriented Architecture)
**Defined in**: [`critical-guidelines.md`](./critical-guidelines.md)
```
Page → Component → Hook → Business Service → Event Service → Generic Service
```
**Non-negotiable**: Never bypass these layers

### Battle-Tested Pattern
**Defined in**: [`reference-implementations.md`](./reference-implementations.md)
- Shop Product Flow = Gold Standard
- All similar features must replicate its patterns
- Use [`implementation-protocol.md`](./implementation-protocol.md) for systematic replication

### Tag System
**Defined in**: [`critical-guidelines.md`](./critical-guidelines.md)
```typescript
['t', 'culture-bridge-{content-type}']
```
**Rule**: Use established patterns, don't invent new ones

---

## 📋 Document Relationships

```
critical-guidelines.md (Foundation)
    ├─ Defines: SOA, Tag patterns, Workflow
    └─ References: Shop as proven pattern
         ↓
reference-implementations.md (Catalog)
    ├─ Lists: Shop as battle-tested reference
    ├─ Documents: Critical patterns to replicate
    └─ Triggers: Use of implementation protocol
         ↓
implementation-protocol.md (Process)
    ├─ Defines: How to replicate battle-tested patterns
    ├─ Provides: Step-by-step checklist
    └─ Enforces: Comprehensive comparison
         ↓
ai-assistant-guidance.md (Meta)
    ├─ Interprets: When to use which protocol
    ├─ Provides: AI-specific workflows
    └─ Ensures: Correct execution of protocols
```

---

## ⚡ For AI Assistants

**Session Start Checklist**:
1. ✅ Read [`critical-guidelines.md`](./critical-guidelines.md) - Know the rules
2. ✅ Open [`ai-assistant-guidance.md`](./ai-assistant-guidance.md) - Know the protocols
3. ✅ Check if "battle-tested" mentioned → Execute comprehensive comparison

**Trigger Phrases** (escalate to battle-tested protocol):
- "battle-tested"
- "proven"
- "use X as reference"
- "follow X pattern"
- "make it work like X"

---

## 🚀 For Human Developers

**Before coding**:
- Read [`critical-guidelines.md`](./critical-guidelines.md)
- Check if similar feature exists in [`reference-implementations.md`](./reference-implementations.md)
- Follow SOA layers strictly

**During implementation**:
- Use battle-tested patterns when available
- Test before marking complete
- Document as you code

**Before commit**:
- Build succeeds
- All errors fixed
- Manual testing complete
- User verified

---

## 🔄 Maintenance

**When to update**:
- New battle-tested implementation → Add to [`reference-implementations.md`](./reference-implementations.md)
- New anti-pattern discovered → Add to [`critical-guidelines.md`](./critical-guidelines.md)
- Protocol improvement → Update [`implementation-protocol.md`](./implementation-protocol.md)
- New keyword trigger → Update [`ai-assistant-guidance.md`](./ai-assistant-guidance.md)

**How to update**:
1. Make changes
2. Update this README if structure changes
3. Commit with clear explanation
4. Ensure cross-references remain valid

---

*This documentation system ensures consistent, high-quality implementations by providing clear standards, proven patterns, and systematic procedures.*
