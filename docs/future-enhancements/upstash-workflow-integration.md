# Upstash Workflow Integration Plan

## Overview
Upstash Workflow is a serverless orchestration platform that enables durable, multi-step workflows with automatic retries, long-running operations, and event-driven coordination - all without managing infrastructure. Built on top of QStash, it provides a higher-level abstraction for complex business processes.

**Nostr Ethos Constraint**: All data operations requiring Nostr event fetching, signing, or private data access MUST occur in the user's browser with their consent via signer (NIP-07/NIP-46). Workflow is limited to processing data already obtained through user-initiated actions, orchestrating multi-step operations based on existing data, and performing non-Nostr background tasks.

**Why Workflow Over QStash**: Workflow provides step-based orchestration with checkpointing, long delays (days/weeks/months), event waiting, and parallel execution - all while being cheaper at scale ($1/100K steps vs QStash's $0.50/1K messages). Each workflow step is a QStash message internally, but with added durability and state management.

## Primary Use Cases

### 1. Multi-Step Notification Workflows
**Priority: High**

- **User-Initiated Event Notifications**: Orchestrate multi-step notification workflows triggered by events the user has already published/received in their browser session
- **Message Alerts**: Detect new NIP-17 messages client-side, then workflow handles: check preferences → format notification → send → wait for read receipt → send reminder if unread after 24h
- **Community Updates**: Multi-step workflow: user joins event → immediate confirmation → sleep 24h → send reminder → sleep until event day → send "happening now" alert
- **Heritage Contributions**: Workflow: submission logged → notify admin → wait for approval event → publish content → sleep 7 days → send engagement follow-up
- **Shop Activity**: Order placed → verify stock → wait for payment confirmation → notify seller → sleep 3 days → check shipping → notify buyer → sleep 7 days → request review

**Workflow Advantages**:
- Each step is a checkpoint - retries don't restart entire process
- Long delays (7 days, 30 days) without keeping connections open
- Wait for external events (admin approval, payment confirmation)
- Parallel execution where appropriate
- Dead Letter Queue (DLQ) for permanently failed workflows

**User Consent Model**:
- Workflow triggered AFTER user action in browser with signer
- Processes event metadata already stored in Redis
- No background polling of Nostr relays
- All steps operate on user-consented data

### 2. Scheduled Relay Verification Workflows
**Priority: Medium**

- **Periodic Health Checks**: Scheduled workflows (every 30 minutes) to verify all relay endpoints
- **Parallel Relay Verification**: Query all 8 relays in parallel, aggregate results in single workflow run
- **Multi-Step Verification**: Check NIP-11 capabilities → verify event storage → test write operations → update Redis → notify if degraded
- **Performance Trending**: Each verification run logs results, monthly workflow aggregates trends
- **Automatic Cleanup**: Failed relay triggers workflow: retry 3 times over 6 hours → if still failing, notify admin → wait for decision event → remove or keep relay

**Nostr Compliance**:
- Health checks only query relay capabilities (NIP-11 documents)
- Event verification uses public event IDs already logged in Redis
- No private key operations or encrypted content access
- Operates on relay infrastructure, not user data

**Workflow Example**:
```typescript
// Scheduled every 30 minutes via Upstash console
export const { POST } = serve(async (context) => {
  // Step 1: Parallel verification of all relays
  const results = await context.run("verify-all-relays", async () => {
    const relays = getConfiguredRelays();
    return Promise.all(relays.map(relay => checkRelayHealth(relay)));
  });
  
  // Step 2: Update Redis with results
  await context.run("update-redis", async () => {
    await kvService.setRelayHealth(results);
  });
  
  // Step 3: Check for failures
  const failed = results.filter(r => !r.healthy);
  if (failed.length > 0) {
    await context.run("notify-failures", async () => {
      await notifyAdmin(failed);
    });
  }
});
```

### 3. Event-Driven Content Moderation Workflows
**Priority: Medium**

- **Heritage Review Workflow**: Submission → notify admin → `waitForEvent("approval")` → if approved: publish + notify user → sleep 7d → engagement followup; if rejected: notify with reason
- **Shop Product Review**: Product created → validate against guidelines → if needs review: wait for admin decision → publish or reject → notify seller
- **Report Processing**: User reports content → aggregate similar reports → if threshold met: flag for review → wait for moderator action → apply decision → notify reporter
- **Spam Detection**: Background analysis of submission patterns → if suspicious: hold for review → wait for verification → release or block

**Workflow Benefits**:
- `context.waitForEvent()` pauses workflow until admin/moderator acts
- `context.notify()` resumes paused workflows from admin dashboard
- Each moderation step is independently retried on failure
- Long waits (approval can take days) don't tie up resources

### 4. Data Synchronization
**Priority: Low** ⚠️ **Requires careful Nostr compliance**

- **~~Profile Sync~~**: ❌ REMOVED - Cannot fetch user profiles without browser signer consent
- **~~Event Aggregation~~**: ❌ REMOVED - Cannot query events for users without their active session
- **Media Processing**: ✅ Queue image optimization for media already uploaded by user
- **Search Indexing**: ✅ Background indexing of PUBLIC heritage content logged in Redis

**Nostr Constraints**:
- Cannot perform any Nostr relay queries for user-specific data server-side
- Can only process media/content already submitted through user's browser session
- Public content (kind:0 profiles, public posts) may be cached but not fetched without context
- All data must originate from user-initiated actions with signer

### 5. Analytics & Reporting
**Priority: Low**

- **Daily Metrics**: Generate usage reports from Redis event logs (user-initiated events only)
- **User Engagement**: Track content views, interactions, contributions (logged during user sessions)
- **Relay Performance**: Aggregate verification data into trends (server-side relay monitoring)
- **Email Digests**: Weekly summaries based on user's own activity (data from their logged events)

**Privacy Model**:
- Analytics only use data from events the user has already published/logged
- No cross-user data aggregation without explicit consent
- All metrics derived from Redis event log (user-initiated actions)
- Digests only contain the user's own activity, not discovered via background relay queries

## Technical Architecture

### Nostr Compliance Principles

**Core Rule**: QStash operates ONLY on data already obtained through user consent in their browser session.

**Allowed Operations**:
- ✅ Processing events logged to Redis after user published them (with signer)
- ✅ Querying relay health/capabilities (NIP-11) - no user data
- ✅ Verifying event storage using public event IDs from Redis
- ✅ Sending notifications based on events user already received in their session
- ✅ Processing media/content user uploaded through browser

**Forbidden Operations**:
- ❌ Background polling of Nostr relays for user events without active session
- ❌ Fetching user profiles without browser signer consent
- ❌ Aggregating events across users without explicit permission
- ❌ Accessing encrypted content (NIP-04/NIP-44) server-side
- ❌ Any operation requiring private keys or decryption

**Data Flow**:
1. User interacts with Culture Bridge in browser (with NIP-07/NIP-46 signer)
2. Events published/received → logged to Redis with user consent
3. QStash processes Redis data (already user-authorized)
4. Notifications/tasks queued based on logged events
5. Never: QStash independently queries Nostr relays for user data

### QStash Endpoints
```
### Workflow Endpoints

```typescript
/api/workflow/notify              - Multi-step notification workflows
/api/workflow/verify-relays       - Scheduled relay health checks
/api/workflow/moderate-content    - Event-driven content review
/api/workflow/process-media       - Long-running media processing
/api/workflow/generate-analytics  - Scheduled report generation
```

**Endpoint Structure**:
```typescript
import { serve } from "@upstash/workflow/nextjs";

export const { POST } = serve<PayloadType>(async (context) => {
  // Step 1
  await context.run("step-name", async () => {
    // Your logic - independently retried on failure
  });
  
  // Sleep for hours/days/weeks
  await context.sleep("wait-period", seconds);
  
  // Wait for external event
  const data = await context.waitForEvent("approval", { timeout: "7d" });
  
  // Make HTTP calls (up to 2 hours, no function timeout)
  const result = await context.call("api-call", {
    url: "https://external-api.com",
    method: "POST",
    body: { data }
  });
});
```
```

### Redis Integration
- Queue state persistence
- Deduplication using event IDs
- Rate limit counters
- Processing status tracking

### Authentication
- QStash signing key verification
- Upstash request validation
- API route protection

## Implementation Phases

**Phase 1: Notifications** (Week 1-2)
**Phase 1: Notifications** (Week 1-2)
- Message notification workflows with multi-step orchestration
- Workflow SDK setup and signature verification
- Basic retry logic via `context.run()` checkpointing
- Test with simple 2-3 step workflows

**Phase 2: Relay Monitoring** (Week 3)
- Scheduled verification workflows (30-minute cron)
- Parallel relay checks using workflow parallelism
- Performance tracking and Redis updates
- Auto-cleanup workflow with retry logic

**Phase 3: Content Workflows** (Week 4-5)
- Event-driven moderation with `context.waitForEvent()`
- Admin dashboard with `context.notify()` integration
- Multi-day workflows with `context.sleep()`
- Review notifications and decision workflows

**Phase 4: Optimization** (Week 6+)
- ~~Profile sync~~ REMOVED (violates Nostr ethos)
- Media processing workflows (long-running uploads)
- Analytics workflows with scheduled generation
- Performance monitoring and step usage optimization

## Configuration

```env
QSTASH_URL=https://qstash.upstash.io/v2/publish
QSTASH_TOKEN=<your-token>
QSTASH_CURRENT_SIGNING_KEY=<key>
QSTASH_NEXT_SIGNING_KEY=<key>
```

## Free Tier & Cost Analysis

**Free Tier Limits**:
- 1,000 steps/day ✅
- 1,000 steps max per workflow run
- 7-day max sleep duration
- 3-day DLQ retention

**Estimated Daily Usage** (Culture Bridge current scale):
- **Messaging notifications**: 20 users × 5 msgs × 3 steps = 300 steps/day
- **Relay verification**: 48 runs/day × 8 relays (parallel) = 384 steps/day  
- **Heritage workflows**: 2-3 submissions × 6 steps = 18 steps/day
- **Shop workflows**: 1-2 orders × 8 steps = 16 steps/day
- **TOTAL**: ~718 steps/day ✅ **Well within free tier**

**Step Counting**:
- `context.run()` = 1 step
- `context.sleep()` = 1 step + 1 step on resume
- `context.waitForEvent()` = 1 step + 1 step on notify
- `context.call()` = 2 steps (HTTP request + response)
- Parallel runs = 1 extra step per parallel task
- Each retry = counts as new steps

**Growth Projections**:
- **100 DAU**: ~2,500 steps/day → Upgrade to paid tier
- **500 DAU**: ~12,000 steps/day → $1.20/month
- **1,000 DAU**: ~25,000 steps/day → $2.50/month

**Paid Tier Pricing**:
- Pay-as-you-go: $1 per 100K steps
- Fixed 1M: $180/month (1M steps/month = 33K steps/day)
- Fixed 10M: $420/month (10M steps/month = 333K steps/day)

**Recommendation**: Start with free tier, monitor usage in Upstash console, upgrade when hitting limits (likely at 100+ DAU when Culture Bridge has revenue potential).

## Cost Optimization Strategies

**If approaching 1,000 steps/day limit**:
1. Reduce relay verification frequency (30min → 1 hour saves 192 steps/day)
2. Batch notifications (digest emails instead of per-message)
3. Conditional workflows (skip steps if no action needed)
4. Optimize parallel runs (aggregate before parallelizing)
5. Cache relay health checks (verify only on failure)

**Monitor in Upstash Console**:
- Real-time step usage dashboard
- Per-workflow cost breakdown
- Failed step analysis
- DLQ inspection

## Workflow vs Alternatives

**Upstash Workflow Advantages**:
- Multi-step orchestration with checkpointing
- Long delays (days/weeks) without infrastructure
- Event-driven coordination (wait/notify)
- Cheaper than QStash alone ($1/100K vs $0.50/1K)
- Built-in DLQ and observability
- No serverless timeout constraints

**vs Vercel Cron**:
- ❌ Cron: Only scheduled tasks, no orchestration
- ✅ Workflow: Schedule + multi-step + events + retries

**vs BullMQ**:
- ❌ BullMQ: Requires Redis management, server infrastructure
- ✅ Workflow: Serverless, no infrastructure

**vs AWS Step Functions**:
- ❌ Step Functions: Complex setup, higher cost at small scale
- ✅ Workflow: Simple Next.js integration, generous free tier

**vs Plain QStash**:
- ❌ QStash: Single HTTP calls, manual state management
- ✅ Workflow: Multi-step orchestration, automatic checkpointing

## Cost Considerations (Legacy QStash)
- QStash free tier: 500 messages/day
- QStash paid tier: $0.50 per 1,000 messages
- **Workflow is better**: 1,000 steps/day free (2x capacity) + orchestration features
- Workflow paid: $1 per 100,000 steps (100x cheaper at scale)

## Next Steps
1. Create Upstash account and obtain Workflow credentials (QStash token + signing keys)
2. Install Upstash Workflow SDK: `npm install @upstash/workflow`
3. Implement first workflow `/api/workflow/notify/route.ts` with signature verification
4. **CRITICAL**: Ensure workflows only process Redis event data (user-initiated)
5. Add workflow triggers to existing event logging (after user publishes with signer)
6. Test with message notification workflows (events already received in user's browser)
7. Expand to relay monitoring (scheduled workflows - relay health, not user data)
8. Implement event-driven moderation workflows with `waitForEvent()` 
9. Monitor step usage in Upstash console
10. **Validate**: All workflows respect Nostr's user consent model

## References
- [Upstash Workflow Documentation](https://upstash.com/docs/workflow)
- [Next.js Quickstart](https://upstash.com/docs/workflow/quickstarts/vercel-nextjs)
- [Workflow Context API](https://upstash.com/docs/workflow/basics/context)
- [Workflow Pricing](https://upstash.com/docs/workflow/pricing)
- [QStash Documentation](https://upstash.com/docs/qstash) (underlying message queue)
- [Signature Verification](https://upstash.com/docs/workflow/howto/security)
