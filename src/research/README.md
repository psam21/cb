# Phase 0: Batch Authentication Research & POC

## Overview
This directory contains research and proof-of-concept implementations for batch authentication approaches to enable multiple file uploads with minimal signer prompts.

## Files

### `batch-auth-poc.ts`
Core POC implementation containing:
- **CurrentSingleFileUpload**: Baseline implementation for comparison
- **ProtocolLevelBatchAuth**: Attempt to create batch auth events covering multiple files
- **TimeWindowAuth**: Time-based authentication window approach  
- **PreComputedHashAuth**: Pre-compute file hashes then batch authenticate
- **BatchAuthPOCRunner**: Test runner that compares all approaches

### Test Page
- **`/test-batch-auth`**: Interactive test page to run POC experiments
- Upload multiple files and test different batch authentication approaches
- View detailed results and performance metrics
- Get Go/No-Go recommendation for full implementation

## Research Questions

### 1. Current Blossom SDK Analysis ✅
**Question**: How does the current `blossom-client-sdk` handle authentication?

**Findings**:
- Uses `BlossomClient.createUploadAuth(signer, file, options)` 
- Each call triggers `signer.signEvent()` which prompts user
- Creates Kind 24242 auth events with file-specific data
- No apparent built-in batch authentication support

### 2. Signer Interaction Patterns ✅  
**Question**: What triggers signer prompts and can they be batched?

**Findings**:
- Each `signer.signEvent()` call triggers browser extension popup
- Current flow: 1 file = 1 auth event = 1 signer prompt
- Naive multiple files: N files = N auth events = N signer prompts (UX disaster)
- Need to create multiple auth tokens from single signer interaction

### 3. Protocol-Level Batch Support ❓
**Question**: Does Blossom protocol support batch authentication natively?

**Status**: Needs testing with real servers
- POC attempts to create batch auth events with multiple file hashes
- Unknown if Blossom servers accept batch auth formats
- May require server-side support that doesn't exist

### 4. Browser Extension Compatibility ⏳
**Question**: How do different Nostr extensions handle batch signing?

**Status**: Pending real-world testing
- Need to test with Alby, nos2x, and other extensions
- Some extensions may have rate limiting or UX considerations
- May vary by extension implementation

## POC Approaches Implemented

### Approach 1: Protocol-Level Batch Authentication
```typescript
// Create single auth event covering multiple file hashes
const batchAuth = {
  kind: 24242,
  tags: [
    ['t', 'batch_upload'],
    ['f', 'hash1'], ['f', 'hash2'], ['f', 'hash3'], // All file hashes
    ['expiration', '1hour']
  ],
  content: 'Batch upload: file1.jpg, file2.mp4, file3.mp3'
};
```

**Pros**: Most elegant, follows Nostr event patterns
**Cons**: May not be supported by Blossom servers
**Test Status**: Implemented, needs server testing

### Approach 2: Time-Window Authentication  
```typescript
// Create auth valid for time window
const windowAuth = {
  kind: 24242,
  tags: [
    ['expiration', '10_minutes'],
    ['purpose', 'batch_upload']
  ],
  content: 'Authorize file uploads for 10 minutes'
};
```

**Pros**: Flexible, could work with existing servers
**Cons**: Security implications of longer-lived auth
**Test Status**: Implemented, needs server testing

### Approach 3: Pre-Computed Hash Authentication
```typescript
// Calculate hashes first, then batch authorize
const hashes = await Promise.all(files.map(getFileHash));
const preAuth = await createHashBasedAuth(hashes, signer);
```

**Pros**: Deterministic, hash-based security
**Cons**: Requires hash calculation upfront
**Test Status**: Implemented, needs server testing

## Testing Instructions

1. **Navigate to test page**: `/test-batch-auth`
2. **Select multiple files**: Choose 3-5 test files of different types
3. **Run POC tests**: Click "Start POC Tests" (requires Nostr signer)
4. **Review results**: Analyze signer prompt counts and success rates
5. **Check recommendation**: Get Go/No-Go decision for full implementation

## Expected Outcomes

### Success Criteria ✅
- **1 signer prompt** for multiple files (vs N prompts for N files)
- **All files upload successfully** with batch authentication
- **Performance acceptable** (auth + upload time reasonable)
- **Works across browser extensions**

### Failure Scenarios ❌
- Batch auth approaches don't work with Blossom servers
- Still requires multiple signer prompts
- Upload failures or compatibility issues
- Performance worse than sequential uploads

## Next Steps

### If POC Succeeds ✅
1. **Document working approach** with specific implementation details
2. **Proceed to Phase 1**: SOA Architecture Setup
3. **Implement full multiple attachments feature** following the spec
4. **Expected timeline**: 15-20 days for full implementation

### If POC Fails ❌  
1. **Document limitations** and technical barriers
2. **Consider alternatives**:
   - Limit to 2-3 files maximum
   - Implement with user warnings about multiple prompts
   - Abandon multiple attachments feature entirely
3. **Update project scope** based on findings

## Research Status

- ✅ **POC Implementation**: All 3 approaches coded and ready for testing
- ✅ **Test Infrastructure**: Interactive test page created  
- ⏳ **Real-World Testing**: Needs testing with actual Blossom servers
- ⏳ **Extension Compatibility**: Needs testing across browser extensions
- ⏳ **Go/No-Go Decision**: Pending test results

## Critical Dependencies

This entire Phase 0 determines the viability of the multiple attachments feature:
- **Success**: Proceed with full 7-phase implementation
- **Failure**: Significantly reduce scope or abandon feature
- **Investment**: 2-3 days research vs 15-20 days full implementation

The POC approach prevents building a feature that would have terrible UX due to signer popup spam.
