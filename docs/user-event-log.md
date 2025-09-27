```markdown
# User Event Log Feature - Complete Development Specification

## Overview
Build a `/user-event-log` page that displays analytics for Nostr events published through our site, showing relay publishing success/failure data and performance metrics.

## Tech Stack
- **Frontend:** Next.js + Tailwind CSS
- **Storage:** Vercel KV (Redis)
- **Deployment:** Vercel
- **Tier:** Free tier (30k commands/month - sufficient for use case)

## Page Requirements

### URL
`/user-event-log`

## Data Capture
GenericRelayService.publishEvent() 
- has either inputs or outputs to capture below fields.
- parse information from the event or its metadata to capture below fields.

### Data Columns to Display
| Column | Description |
|--------|-------------|
| npub | Public key in bech32 format |
| Event ID | Unique event identifier/hash |
| Event Kind | Nostr event type (0, 1, 3, 5, 23, etc.) |
| Created Timestamp | When event was originally created |
| Processed Timestamp | When our system processed the event |
| Processing Duration | Time taken to process and distribute (ms) |
| Total Relays Attempted | Number of relays event was sent to |
| Successful Relays | Count and list of relays that accepted event |
| Failed Relays | Count and list of relays that failed |
| Average Response Time | Mean relay response time (ms) |
| Tags Count | Number of tags in the event |
| Retry Attempts | Number of publishing retries |
| njump Link | Clickable link to view event on njump.me |

## Data Storage (Vercel KV)

### Key Structure
```
user_events:{npub}:{timestamp}:{eventId} -> Event JSON
user_events_index:{npub} -> Sorted set of event keys for pagination
```

### Event Data Schema
```json
{
  "npub": "npub1xxx...",
  "eventId": "abc123...",
  "eventKind": 1,
  "createdTimestamp": 1695123456789,
  "processedTimestamp": 1695123457034,
  "processingDuration": 245,
  "totalRelaysAttempted": 8,
  "successfulRelays": ["wss://relay1.com", "wss://relay2.com"],
  "failedRelays": ["wss://relay3.com"],
  "averageResponseTime": 150,
  "tagsCount": 3,
  "retryAttempts": 1
}
```

## API Routes to Build

### 1. POST `/api/log-event`
**Purpose:** Store event analytics data after publishing attempt

**Request Body:**
```json
{
  "npub": "npub1xxx...",
  "eventId": "abc123...",
  "eventKind": 1,
  "createdTimestamp": 1695123456789,
  "processedTimestamp": 1695123457034,
  "processingDuration": 245,
  "totalRelaysAttempted": 8,
  "successfulRelays": ["wss://relay1.com", "wss://relay2.com"],
  "failedRelays": ["wss://relay3.com"],
  "averageResponseTime": 150,
  "tagsCount": 3,
  "retryAttempts": 1
}
```

**KV Operations:**
- Store event data with structured key
- Update user's event index for pagination
- Return success/error response

### 2. GET `/api/get-user-events`
**Purpose:** Retrieve paginated event data for display

**Query Parameters:**
- `npub` (required): User's public key
- `page` (optional): Page number (default: 1)
- `limit` (optional): Events per page (default: 50)
- `eventKind` (optional): Filter by event kind
- `startDate` (optional): Filter by date range
- `endDate` (optional): Filter by date range

**Response:**
```json
{
  "events": [...], // Array of event objects
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

## Frontend Components

### 1. Main Page Component (`/pages/user-event-log.js`)
- any user logged in or not can view this page; add User activity link in footer below support 
- Manage pagination and sorting state
- Fetch data from API and handle loading/error states
- Render EventTable component

### 2. EventTable Component
- Display data in responsive Tailwind table
- Sortable columns (click column headers)
- Format timestamps and durations for readability
- Generate njump links (`https://njump.me/{eventId}`)

### 3. Filters Component
- no filters needed for now.

### 4. Pagination Component
- Previous/Next buttons
- Page number display 20 items per page
- Items per page selector

## UI/UX Requirements

### Table Design
- Clean, minimal Tailwind styling
- Responsive design (stack on mobile if needed)
- Loading states with skeleton loaders
- Empty states when no data (there's enough data to display)
- Error handling with retry options

### Key Features
- **Sortable columns:** Click headers to sort
- **Real-time updates:** manual Refresh button option
- **Mobile responsive:** Table should work on mobile devices

### Visual Indicators
- ✅ Green indicator for successful relays
- ❌ Red indicator for failed relays
- ⏱️ Processing time badges (fast/slow)
- 🔗 Distinct styling for njump links

## Data Management Strategy

### Storage Optimization (Free Tier)
- **Retain as long as possible** - don't implement aggressive cleanup
- **Monitor usage** in Vercel dashboard (Storage tab)
- **Efficient data structure** - use Unix timestamps, short relay names

### Command Usage
- **Write per event:** ~3 commands (set event data, update index, metadata)
- **Read per page load:** ~5-10 commands (get index, get events, pagination)
- **30k commands/month** = ~1,000 events logged + regular dashboard usage
- **Usage monitoring:** Check Vercel dashboard > Project > Storage tab


## Integration Points

### Where to Call `/api/log-event`
Integrate the logging API call into your existing Nostr event publishing functions. After attempting to publish to relays, collect the results and send to the logging endpoint.

### Authentication
- page available open for public
- If no auth, allow manual npub input

## Performance Considerations
- **Pagination:** Default to 20 items per page
- **KV Limits:** 30k commands/month sufficient for moderate usage
- **Lazy loading:** Load additional data as user scrolls/navigates

## Testing Requirements
- Test with various event kinds and relay combinations (Kinds: 1, 3, 5, 23, etc.)
- Test pagination with large datasets (20 items per page)
- Test sorting functionality
- Test mobile responsiveness (stack on mobile if needed)
- Test error handling (network failures, KV errors) (don't add any error handling for now)

## Vercel KV Setup
1. **Create KV database** in Vercel dashboard
2. **Environment variables** auto-generated for your project
3. **Install KV SDK:** `npm install @vercel/kv`
4. **Monitor usage** in Storage tab of your project


-