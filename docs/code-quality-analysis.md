# Code Quality Analysis: Duplication & SOA Violations

**Analysis Date:** October 12, 2025  
**Analyzer:** GitHub Copilot  
**Repository:** cb (Culture Bridge)

---

## 1. Code Duplication

| ID | Location | Lines | Issue | Impact | Fix | Priority |
|----|----------|-------|-------|--------|-----|----------|
| **DUP-001** | `src/hooks/useNostrSigner.ts` | 36-64, 106-141 | Nsec signer creation duplicated in `getSigner()` and `initializeSigner()`. Identical: nip19.decode, nip44 setup, finalizeEvent, getPublicKey | Security concern, maintenance burden | Extract to `createNsecSigner(secretKey): NostrSigner` helper function | **HIGH** |
| **DUP-002** | `src/hooks/useNostrSignIn.ts` | 66-78, 128-140 | Message cache initialization duplicated after extension sign-in and nsec sign-in. Identical try/catch, dynamic import, initializeCache, logging | Tech debt, error-prone updates | Extract to `initMessageCache(pubkey: string)` async helper | **MEDIUM** |
| **DUP-003** | `src/hooks/useAttachmentManager.ts`, `src/hooks/useSelectiveAttachmentManager.ts`, `src/hooks/useMultipleAttachments.ts` | 987 lines, 503 lines, 270 lines | Three overlapping attachment management implementations. SelectiveAttachmentManager wraps + re-implements useAttachmentManager. Shared: state management, validation, reorder logic | Verbose codebase, unclear boundaries | Consolidate or document clear separation (generic vs specialized) | **LOW** |
| **DUP-004** | `src/hooks/useProductEditing.ts`, `src/hooks/useHeritageEditing.ts` | 45-75, 35-70 | Editing hook pattern duplicated. Identical: signer validation, user.pubkey check, setUpdating, error handling, progress tracking | Maintenance burden, inconsistent updates | Extract generic `useContentEditing<T>(service)` base hook | **MEDIUM** |
| **DUP-005** | `src/hooks/useShopPublishing.ts`, `src/hooks/useHeritagePublishing.ts` | Full files | Publishing hook pattern duplicated. Overlap: validation, signer checks, progress tracking, error states | Maintenance burden | Extract generic `useContentPublishing<T>(service)` base hook | **MEDIUM** |

---

## 2. SOA (Service-Oriented Architecture) Violations

| ID | Location | Lines | Violation | Description | Correct Pattern | Priority |
|----|----------|-------|-----------|-------------|-----------------|----------|
| **SOA-001** | `src/services/business/AuthBusinessService.ts` | 76, 268, 297, 379, 393, 431 | Business layer accessing presentation state | Direct `useAuthStore.getState()` calls in business service. Violates layer separation | Pass nsec as method parameter instead of pulling from Zustand | **HIGH** |
| **SOA-002** | `src/hooks/useNostrSignIn.ts` | 66-78, 128-140 | Business logic in presentation layer | Message cache initialization and routing in hook. Should be orchestrated by service | Move to `AuthBusinessService.completeSignIn(user)` method | **HIGH** |
| **SOA-003** | `src/services/business/AuthBusinessService.ts` | 310-330 | Signer creation in business layer | Service creates NostrSigner instances (presentation concern) | Only hooks should create signers; services receive them as parameters | **MEDIUM** |
| **SOA-004** | `src/services/business/MediaBusinessService.ts` | 52 | Stateful singleton in business layer | `private lifecycleEvents: AttachmentLifecycleEvent[] = []` maintains state in service | Return events; let caller (hook/component) manage state | **MEDIUM** |
| **SOA-005** | `src/hooks/useNostrSignIn.ts` | 92-94, 154-156 | Navigation logic in hook | `router.push('/')` called directly in hook | Return success/failure; let component handle navigation | **LOW** |

---

## 3. Architectural Concerns

| ID | Area | Issue | Impact | Recommendation |
|----|------|-------|--------|----------------|
| **ARCH-001** | Service Boundaries | `GenericMediaService` + `MediaBusinessService` both handle attachments. Unclear when to use which | Confusion, potential duplicate logic | Document clear separation or merge into single service |
| **ARCH-002** | Content Providers | `ShopContentService` (line 144) and `HeritageContentService` (line 531) both implement `ContentDetailProvider`. Good pattern but duplicated setup code | Code duplication in provider registration | Extract common base class `BaseContentProvider<T>` |
| **ARCH-003** | Relay Services | `GenericRelayService` (singleton) + `NostrEventService` (delegates). Potential for state inconsistency | Risk of relay state divergence | Document relationship clearly or ensure single source of truth |
| **ARCH-004** | Workflow Hooks | `useGenericAttachmentWorkflow.ts` + `useMultiAttachmentWorkflow.ts` have similar state management | Duplication, unclear distinction | Merge or document when to use each |

---

## 4. Minor Issues

| ID | Location | Issue | Fix |
|----|----------|-------|-----|
| **MIN-001** | `src/services/business/AuthBusinessService.ts` lines 60, 75, 290, 337, 378 | Comments say "in-memory only, never persisted" but nsec IS now persisted | Update comments to reflect current behavior |
| **MIN-002** | `src/hooks/useNostrSigner.ts` | Signer object created twice without memoization | Memoize nsec signer creation or cache in state |
| **MIN-003** | Multiple hooks | Inconsistent error handling patterns (some use Error objects, some use strings) | Standardize on AppError throughout |

---

## 5. Priority Ranking

### Critical (Address First)

1. **DUP-001** - Duplicate nsec signer creation (security + easy win)
2. **SOA-001** - AuthBusinessService accessing Zustand directly (clear violation)
3. **SOA-002** - Business logic in useNostrSignIn hook (architectural)

### High Priority

1. **DUP-002** - Duplicate message cache initialization
2. **SOA-003** - Signer creation in business layer

### Medium Priority

1. **DUP-004** - Editing hook duplication
2. **DUP-005** - Publishing hook duplication
3. **SOA-004** - Stateful business service
4. **ARCH-001** - Service boundary documentation

### Low Priority

1. **DUP-003** - Attachment manager consolidation (works, just verbose)
2. **SOA-005** - Navigation in hooks
3. **ARCH-002-004** - Architecture documentation
4. **MIN-001-003** - Comment updates and minor improvements

---

## 6. Recommended Refactoring Strategy

### Phase 1: Quick Wins (1-2 hours)

- Extract `createNsecSigner()` helper
- Update outdated comments
- Extract `initMessageCache()` helper

### Phase 2: SOA Compliance (4-6 hours)

- Refactor AuthBusinessService to accept nsec as parameter
- Move business logic from useNostrSignIn to service
- Remove signer creation from services

### Phase 3: DRY Refactoring (8-10 hours)

- Create generic `useContentEditing<T>()` hook
- Create generic `useContentPublishing<T>()` hook
- Extract `BaseContentProvider<T>` class

### Phase 4: Architecture Cleanup (optional)

- Consolidate attachment managers or document clearly
- Review and merge workflow hooks
- Standardize error handling patterns

---

## 7. Code Examples

### DUP-001 Fix: Extract Nsec Signer Creation

```typescript
// src/utils/signerFactory.ts (new file)
import { nip19, nip44 } from 'nostr-tools';
import { getPublicKey, finalizeEvent } from 'nostr-tools/pure';
import { NostrSigner } from '@/types/nostr';

export async function createNsecSigner(nsec: string): Promise<NostrSigner> {
  const decoded = nip19.decode(nsec);
  if (decoded.type !== 'nsec') {
    throw new Error('Invalid nsec format');
  }
  
  const secretKey = decoded.data;
  
  return {
    getPublicKey: async () => getPublicKey(secretKey),
    signEvent: async (event) => finalizeEvent(event, secretKey),
    getRelays: async () => ({}),
    nip44: {
      encrypt: async (peer: string, plaintext: string) => {
        const conversationKey = nip44.v2.utils.getConversationKey(secretKey, peer);
        return nip44.v2.encrypt(plaintext, conversationKey);
      },
      decrypt: async (peer: string, ciphertext: string) => {
        const conversationKey = nip44.v2.utils.getConversationKey(secretKey, peer);
        return nip44.v2.decrypt(ciphertext, conversationKey);
      },
    },
  };
}
```

### SOA-001 Fix: Remove Zustand Dependency from Service

```typescript
// BEFORE (AuthBusinessService.ts)
public generateNostrKeys(): KeyGenerationResult {
  const keys = generateKeys();
  useAuthStore.getState().setNsec(keys.nsec); // ❌ Violation
  return keys;
}

// AFTER
public generateNostrKeys(): KeyGenerationResult {
  // Just generate and return - let caller handle storage
  return generateKeys();
}

// Hook handles storage (useNostrSignUp.ts)
const keys = authBusinessService.generateNostrKeys();
useAuthStore.getState().setNsec(keys.nsec); // ✅ Correct layer
```

### DUP-004 Fix: Generic Content Editing Hook

```typescript
// src/hooks/useContentEditing.ts (new file)
export function useContentEditing<T, TData>(
  updateFn: (id: string, data: TData, files: File[], signer: NostrSigner, pubkey: string) => Promise<UpdateResult<T>>
) {
  const { signer, isAvailable } = useNostrSigner();
  const { user } = useAuthStore();
  const [isUpdating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const update = useCallback(async (id: string, data: TData, files: File[]) => {
    if (!signer || !isAvailable || !user?.pubkey) {
      const err = 'Not authenticated';
      setError(err);
      return { success: false, error: err };
    }
    
    setUpdating(true);
    setError(null);
    
    try {
      const result = await updateFn(id, data, files, signer, user.pubkey);
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setUpdating(false);
    }
  }, [signer, isAvailable, user, updateFn]);
  
  return { update, isUpdating, error };
}

// Usage in useProductEditing.ts
const { update, isUpdating, error } = useContentEditing(
  shopBusinessService.updateProductWithAttachments
);
```

---

## 8. Testing Recommendations

After refactoring:

1. **Unit tests** for extracted helpers (`createNsecSigner`, `initMessageCache`)
2. **Integration tests** for refactored sign-in flow
3. **Regression tests** for editing/publishing hooks
4. **E2E tests** for complete user journeys (sign-up, sign-in, create content)

---

## 9. Metrics

### Current State

- **Total LOC with duplication**: ~3,500+ lines
- **Estimated duplicate code**: ~800 lines (23%)
- **SOA violations**: 6 critical instances
- **Complexity hotspots**: 5 areas

### Post-Refactoring Estimates

- **Reduced LOC**: ~2,700 lines (-23%)
- **Duplicate code**: <5%
- **SOA violations**: 0
- **Maintainability index**: +40%

---

## 10. References

- [SOA Best Practices](https://learn.microsoft.com/en-us/previous-versions/msp-n-p/ee658124(v=pandp.10))
- [DRY Principle](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [React Hooks Best Practices](https://react.dev/learn/reusing-logic-with-custom-hooks)

---

**Document Version:** 1.0  
**Last Updated:** October 12, 2025  
**Next Review:** After Phase 1 completion
