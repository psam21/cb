# Implementation Protocol

This document defines **mandatory procedures** for implementing features based on reference implementations.

## 🚨 When This Protocol Applies

### Trigger Keywords from User:
- "battle-tested"
- "proven"
- "use X as reference" 
- "follow X pattern"
- "make it work like X"
- "X is the gold standard"

### Automatic Triggers:
- Implementing Feature B based on Feature A
- Migrating patterns between modules
- Standardizing across components

---

## ✅ Mandatory Protocol Steps

### Phase 1: Reference Identification
**STOP and Execute:**

1. **Locate Reference** in `/docs/reference-implementations.md`
2. **Read ALL critical patterns** listed for that reference
3. **Map components**: What maps to what?
   ```
   Reference Shop          → New Heritage
   ProductEditForm         → HeritageContributionForm
   useProductEditing       → useHeritageEditing
   ShopBusinessService     → HeritageContentService
   ```

### Phase 2: Comprehensive Comparison
**STOP and Execute:**

Create explicit comparison for EVERY aspect:

```markdown
## Comparison Checklist: [Reference] → [New]

### Form Layer
- [ ] Props passed to components
- [ ] Initial state structure
- [ ] Default values handling
- [ ] Form field mapping

### Data Processing
- [ ] Tag filtering/handling
- [ ] System tag management
- [ ] Attachment operations
- [ ] Data validation

### State Management
- [ ] Hook usage patterns
- [ ] State initialization
- [ ] Update handlers
- [ ] Error states

### Service Layer
- [ ] API call patterns
- [ ] Progress callbacks
- [ ] Error handling
- [ ] Event creation logic

### Edge Cases
- [ ] Empty states
- [ ] Null/undefined handling
- [ ] Fallback values
- [ ] Error scenarios
```

**DO NOT PROCEED** until ALL items verified.

### Phase 3: Implementation
**STOP and Execute:**

1. **Implement ONE section at a time**
2. **Verify against reference** after EACH section
3. **Document intentional deviations** with reasoning
4. **Test immediately** - don't accumulate untested code

### Phase 4: Final Validation
**STOP and Execute:**

1. **Side-by-side code review**: Open reference file and new file
2. **Line-by-line pattern verification** for critical sections
3. **Run comparison search**:
   ```bash
   # Example: Compare tag handling
   grep -n "filterVisibleTags" src/components/shop/ProductEditForm.tsx
   grep -n "filterVisibleTags" src/components/heritage/HeritageContributionForm.tsx
   ```
4. **Build and test**
5. **Document completion** in `/docs/reference-implementations.md`

---

## 🚫 What NOT to Do

### ❌ Anti-Patterns:

1. **Narrow Focus**
   - Wrong: "They asked about rich text, so I only check RichTextEditor"
   - Right: "Battle-tested means check EVERYTHING"

2. **Premature Satisfaction**
   - Wrong: "Found one match, must be aligned"
   - Right: "Check entire checklist systematically"

3. **Assumption of Difference**
   - Wrong: "This is a different feature, might need different approach"
   - Right: "Battle-tested pattern should be replicated unless PROVEN otherwise"

4. **Reactive Analysis**
   - Wrong: "Wait for user to point out each difference"
   - Right: "Proactively compare ALL aspects upfront"

---

## 📝 Communication Protocol

### When User Says "Battle-Tested":

**Your Response Should Be:**
```
"Understood - I'll use [Reference] as the complete template.
Let me do a comprehensive comparison of:
1. Form patterns
2. Data handling  
3. Tag management
4. State management
5. Service layer
6. Error handling

I'll verify EACH aspect matches before proceeding."
```

**NOT:**
```
"I'll check the specific thing you asked about" ❌
```

### During Implementation:

**Communicate Pattern Matches:**
```
✅ Form initialization matches Shop pattern (filterVisibleTags)
✅ RichTextEditor props match Shop pattern (|| '' fallback)
✅ Tag handling matches Shop pattern (duplicate prevention)
```

**Flag Deviations Immediately:**
```
⚠️ Found difference in [X]. Shop does [A], Heritage does [B].
Should Heritage match Shop's approach?
```

---

## 🔄 Learning Loop

After each "battle-tested" implementation:

1. **Update** `/docs/reference-implementations.md` with lessons learned
2. **Add patterns** discovered during comparison
3. **Refine** this protocol based on what worked/didn't work
4. **Document** any new trigger phrases encountered

---

## 📌 Quick Reference Card

```
BATTLE-TESTED DETECTED
    ↓
1. Identify reference in reference-implementations.md
2. Create comprehensive comparison checklist  
3. Verify EVERY pattern (not just obvious ones)
4. Implement with continuous verification
5. Final side-by-side validation
6. Document completion
    ↓
ONLY THEN: Declare complete
```

**Remember**: "Battle-tested" is not context, it's a **COMMAND** to execute this protocol.
