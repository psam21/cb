# CRITICAL FAILURE PATTERNS - MUST AVOID

Go through these along with Rules and Memories.

## 🚨 PATTERN #1: "Architecture Theater" - Building Code That Looks Right But Doesn't Work

### **SYMPTOMS:**
- Building hooks/services/methods that look correct but aren't actually connected
- Marking steps as "complete" when they're just "coded" 
- Focusing on code structure over actual functionality
- Not testing and assuming it just works
- Rushing to show progress instead of ensuring it works
- Making assumptions about existing code without verifying
- Skipping the "connect everything" step
- Violating project workflow (build → fix → commit → push)

### **PREVENTION INSTRUCTIONS:**
**NEVER** mark anything as "complete" until it's actually tested and working, and confirmed by user
**ALWAYS** follow the project workflow: build → fix → commit → push
**NEVER** assume existing code works as expected - verify it with user if they have tested to confirm
**ALWAYS** ask to test the complete user journey end-to-end
**NEVER** rush to "completion" - functionality over progress
**ALWAYS** verify data flows from methods to UI via comprehensive logging that can be seen in the console logs; runtime logs will not be accessible
**ALWAYS** test the actual user experience, not just code compilation
**ALWAYS** have proof on Nostr such as a eventid from a succesful event creation


### **WHEN THIS PATTERN OCCURS:**
- **STOP IMMEDIATELY**
- Go back to the last working state
- Build one piece at a time
- As to Test each piece
- Fix issues as they arise
- Don't move forward until current piece actually works

### **EXAMPLE OF THIS FAILURE:**
- Built generic service, hooks, components for event creation
- Marked all steps as "complete"
- But never actually tested if users can publish; 
- Never verified the the complete flow actually works with proof of eventid
- Presented as "successful implementation" when it was just "coded scaffolding"

### **CRITICAL RULE:**
**This is a CRITICAL failure pattern that must be avoided at all costs.**
**Functionality over architecture. Working code over pretty code.**
**Test everything. Verify everything. Make it work.**

---

## 🚨 PATTERN #2: [TO BE ADDED AS NEEDED]

---

## 🚨 PATTERN #3: [TO BE ADDED AS NEEDED]

---

**Last Updated:** 2024-12-24
**Status:** ACTIVE - Must be followed for all future implementations
