# Order Tracking System

## The Problem

Purchase intents are sent via NIP-17 encrypted messages, but there's no persistent tracking of orders. Users can't view order history, check order status, or track shipments. Sellers can't manage orders or update delivery information. No audit trail exists for purchases.

## Current State

**Have:** Purchase intent sending (NIP-17), formatted messages to sellers, progress bar for sending  
**Missing:** Order persistence, order history, status tracking, delivery management, buyer/seller dashboards

## Solution Overview

Implement order tracking in Redis KV storage (SOA Core layer) to maintain complete order lifecycle from intent to delivery, separate from existing event analytics system.

---

## Order Lifecycle States

```
intent-sent → payment-requested → paid → processing → shipped → delivered
                                   ↓
                              cancelled / disputed
```

| Status | Trigger | Updated By | Next Action |
|---|---|---|---|
| `intent-sent` | Buyer sends purchase intent | System (auto) | Seller responds with payment link |
| `payment-requested` | Seller replies with payment link | Seller | Buyer completes payment |
| `paid` | Buyer confirms payment made | Buyer | Seller confirms payment received |
| `processing` | Seller confirms payment received | Seller | Seller ships order |
| `shipped` | Seller marks as shipped (with tracking) | Seller | Buyer receives & confirms delivery |
| `delivered` | Buyer confirms receipt | Buyer | Order complete |
| `cancelled` | Either party cancels | Buyer/Seller | Order terminated |
| `disputed` | Issue raised | Buyer/Seller | Dispute resolution |

---

## Data Structure

### OrderData Interface

```typescript
export interface OrderData {
  // Core Identifiers
  intentId: string;                    // Format: pi_<npub>_<timestamp>
  eventId?: string;                    // NIP-17 message event ID
  
  // Parties (Both Formats for Flexibility)
  buyerPubkey: string;                 // Hex format
  buyerNpub: string;                   // Bech32 format (for display)
  sellerPubkey: string;
  sellerNpub: string;
  
  // Order Details
  products: OrderProduct[];
  totalSats: number;
  shippingQuote?: number;              // Added by seller (in sats)
  grandTotal: number;                  // totalSats + shippingQuote
  
  // Status & Timeline
  status: OrderStatus;
  createdTimestamp: number;            // When intent was sent
  updatedTimestamp: number;            // Last status update
  
  // Payment Information (Updated by Seller/Buyer)
  paymentLink?: string;                // Lightning invoice or BTC address
  paymentRequestedTimestamp?: number;  // When seller provided payment link
  paymentConfirmedTimestamp?: number;  // When buyer marked as paid
  
  // Shipping Information (Updated by Seller)
  shippingAddress?: string;            // Encrypted in messages, stored encrypted
  shippingTimestamp?: number;          // When seller marked as shipped
  trackingNumber?: string;
  carrier?: string;                    // e.g., "USPS", "FedEx", "DHL"
  
  // Delivery Information
  estimatedDeliveryDate?: number;      // Timestamp provided by seller
  actualDeliveryTimestamp?: number;    // When buyer confirmed delivery
  
  // Communication & Notes
  messageThreadId?: string;            // NIP-17 conversation reference
  buyerNotes?: string;                 // Buyer's notes on order
  sellerNotes?: string;                // Seller's internal notes
  
  // Dispute Management
  disputeReason?: string;
  disputeTimestamp?: number;
  disputeResolution?: string;
}

export interface OrderProduct {
  productId: string;
  title: string;
  quantity: number;
  pricePerUnit: number;
  subtotal: number;
  currency: string;
  imageUrl?: string;
}

export type OrderStatus = 
  | 'intent-sent'
  | 'payment-requested'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'disputed';

export interface OrderStats {
  totalOrders: number;
  ordersByStatus: Record<OrderStatus, number>;
  totalRevenue: number;              // In sats (sellers only)
  totalSpent: number;                // In sats (buyers only)
  averageOrderValue: number;         // In sats
  completedOrders: number;           // Status = 'delivered'
  cancelledOrders: number;
  disputedOrders: number;
}
```

---

## Redis Key Structure

**Completely separate from existing event analytics (`user_events:*`)**

```
orders:{intentId}                      → Individual order data (hash)
orders_by_buyer:{buyerNpub}           → Sorted set (score = timestamp, value = intentId)
orders_by_seller:{sellerNpub}         → Sorted set (score = timestamp, value = intentId)
orders_by_status:{status}             → Sorted set (score = timestamp, value = intentId)
orders_index                           → Global sorted set (score = timestamp, value = intentId)
```

**Examples:**
```
orders:pi_npub1abc...xyz_1729512345
orders_by_buyer:npub1abc...
orders_by_seller:npub1def...
orders_by_status:shipped
orders_index
```

---

## KVService Methods (Order Tracking)

### Create

```typescript
/**
 * Store order data when purchase intent is sent
 * 
 * @param orderData - Complete order information
 * @returns Promise<void>
 */
public async logOrder(orderData: OrderData): Promise<void>
```

**Called by:** `PurchaseBusinessService.sendPurchaseIntent()` after successful send  
**Key Operations:**
1. Store order as JSON in `orders:{intentId}`
2. Add to buyer's index: `orders_by_buyer:{buyerNpub}` (sorted set)
3. Add to seller's index: `orders_by_seller:{sellerNpub}` (sorted set)
4. Add to status index: `orders_by_status:intent-sent` (sorted set)
5. Add to global index: `orders_index` (sorted set)

---

### Read

```typescript
/**
 * Get single order by intent ID
 */
public async getOrder(intentId: string): Promise<OrderData | null>

/**
 * Get all orders for a buyer (paginated)
 */
public async getBuyerOrders(
  buyerNpub: string,
  page?: number,
  limit?: number,
  status?: OrderStatus
): Promise<PaginatedOrderResponse>

/**
 * Get all orders for a seller (paginated)
 */
public async getSellerOrders(
  sellerNpub: string,
  page?: number,
  limit?: number,
  status?: OrderStatus
): Promise<PaginatedOrderResponse>

/**
 * Get orders by status (paginated, global view)
 */
public async getOrdersByStatus(
  status: OrderStatus,
  page?: number,
  limit?: number
): Promise<PaginatedOrderResponse>

/**
 * Get all orders (admin/global view, paginated)
 */
public async getAllOrders(
  page?: number,
  limit?: number
): Promise<PaginatedOrderResponse>
```

---

### Update

```typescript
/**
 * Update order status (generic status change)
 */
public async updateOrderStatus(
  intentId: string,
  status: OrderStatus,
  updates?: Partial<OrderData>
): Promise<void>

/**
 * Seller provides payment link and delivery estimate
 */
public async updateOrderPayment(
  intentId: string,
  paymentLink: string,
  estimatedDeliveryDate?: number,
  shippingQuote?: number
): Promise<void>

/**
 * Buyer confirms payment made
 */
public async confirmPayment(
  intentId: string,
  shippingAddress?: string
): Promise<void>

/**
 * Seller marks order as shipped with tracking info
 */
public async updateOrderShipping(
  intentId: string,
  trackingNumber: string,
  carrier: string,
  shippingTimestamp: number
): Promise<void>

/**
 * Buyer confirms delivery received
 */
public async confirmDelivery(
  intentId: string,
  deliveryTimestamp: number
): Promise<void>

/**
 * Cancel order (buyer or seller)
 */
public async cancelOrder(
  intentId: string,
  reason: string,
  cancelledBy: 'buyer' | 'seller'
): Promise<void>

/**
 * Raise dispute
 */
public async disputeOrder(
  intentId: string,
  reason: string,
  disputedBy: 'buyer' | 'seller'
): Promise<void>
```

---

### Statistics

```typescript
/**
 * Get order statistics for a buyer
 */
public async getBuyerOrderStats(buyerNpub: string): Promise<OrderStats>

/**
 * Get order statistics for a seller
 */
public async getSellerOrderStats(sellerNpub: string): Promise<OrderStats>
```

---

## Integration Points

### 1. Purchase Intent Sent (Automatic Logging)

**File:** `/src/services/business/PurchaseBusinessService.ts`  
**Method:** `sendPurchaseIntent()`  
**When:** After successfully sending NIP-17 message to seller  

```typescript
// After sendResult.success
const orderData: OrderData = {
  intentId,
  eventId: sendResult.message?.id,
  buyerPubkey,
  buyerNpub: nip19.npubEncode(buyerPubkey),
  sellerPubkey: sellerGroup.sellerPubkey,
  sellerNpub: nip19.npubEncode(sellerGroup.sellerPubkey),
  products: sellerGroup.products.map(p => ({
    productId: p.productId,
    title: p.title,
    quantity: p.quantity,
    pricePerUnit: p.price,
    subtotal: p.price * p.quantity,
    currency: p.currency,
    imageUrl: p.imageUrl
  })),
  totalSats: sellerGroup.totalSats,
  grandTotal: sellerGroup.totalSats,
  status: 'intent-sent',
  createdTimestamp: Date.now(),
  updatedTimestamp: Date.now()
};

await kvService.logOrder(orderData);
```

---

### 2. Seller Provides Payment Link (Future)

**File:** `/src/components/messages/SellerReplyPanel.tsx` (future component)  
**Hook:** `useSellerOrderActions.ts` (future hook)  

```typescript
// When seller clicks "Send Payment Link"
await kvService.updateOrderPayment(
  intentId,
  paymentLink,
  estimatedDeliveryDate,
  shippingQuote
);
```

---

### 3. Buyer Confirms Payment (Future)

**File:** `/src/components/orders/OrderDetailPage.tsx` (future component)  
**Hook:** `useBuyerOrderActions.ts` (future hook)  

```typescript
// When buyer clicks "Mark as Paid"
await kvService.confirmPayment(intentId, shippingAddress);
```

---

### 4. Seller Ships Order (Future)

**File:** `/src/components/orders/SellerOrderManagement.tsx` (future component)  

```typescript
// When seller clicks "Mark as Shipped"
await kvService.updateOrderShipping(
  intentId,
  trackingNumber,
  carrier,
  Date.now()
);
```

---

### 5. Buyer Confirms Delivery (Future)

**File:** `/src/components/orders/OrderDetailPage.tsx`  

```typescript
// When buyer clicks "Confirm Delivery"
await kvService.confirmDelivery(intentId, Date.now());
```

---

## UI Components (Future Implementation)

### Buyer Dashboard (`/orders` or `/my-orders`)

```
| Order ID | Date | Seller | Total | Status | Actions |
|----------|------|--------|-------|--------|---------|
| pi_npub1...234 | Oct 21 | @seller | 60,000 sats | Shipped | [View] [Track] |
| pi_npub1...123 | Oct 18 | @seller2 | 25,000 sats | Payment Requested | [Pay] [Cancel] |
```

**Features:**
- Filter by status
- Search by order ID
- Download invoice (future)

---

### Seller Dashboard (`/my-shop/orders`)

```
| Order ID | Date | Buyer | Total | Status | Actions |
|----------|------|-------|-------|--------|---------|
| pi_npub1...234 | Oct 21 | @buyer | 60,000 sats | Paid | [Ship] [Cancel] |
| pi_npub1...123 | Oct 18 | @buyer2 | 25,000 sats | Intent Sent | [Send Payment Link] |
```

**Features:**
- Bulk status updates
- Export order data
- Print shipping labels (future)

---

### Order Detail Page (`/orders/[intentId]`)

**Timeline View:**
```
✅ Oct 21, 2025 1:43 PM  - Purchase Intent Sent
✅ Oct 21, 2025 2:15 PM  - Payment Link Provided
✅ Oct 21, 2025 3:00 PM  - Payment Confirmed
✅ Oct 22, 2025 10:00 AM - Order Shipped (Tracking: 1Z999AA10123456784)
⏳ Oct 24, 2025          - Estimated Delivery
```

**Product Details:**
- List of products with quantities and prices
- Shipping address
- Tracking link
- Download receipt button

---

## Architecture Compliance

### Service-Oriented Architecture (SOA)

```
┌─────────────────────────────────────────────────────────────┐
│ Page Layer                                                   │
│ /orders, /my-shop/orders, /orders/[intentId]               │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│ Component Layer                                              │
│ OrdersList, OrderDetail, OrderTimeline, OrderActions       │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│ Hook Layer                                                   │
│ useOrderTracking, useBuyerOrders, useSellerOrders          │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│ Business Layer (NEW)                                         │
│ OrderBusinessService (orchestrates order operations)        │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│ Core Layer (EXISTING - ENHANCED)                            │
│ KVService (+ new order tracking methods)                   │
└─────────────────────────────────────────────────────────────┘
```

**Key Principle:** Order tracking methods live in **Core Layer (KVService)**, consumed by **Business Layer (OrderBusinessService)**, exposed via **Hooks**, rendered by **Components**.

---

## Implementation Phases

### Phase 1: Core Infrastructure (Current)
- ✅ Define `OrderData`, `OrderProduct`, `OrderStatus` types
- ✅ Add order tracking methods to KVService
- ✅ Integrate `logOrder()` in PurchaseBusinessService
- ✅ Test order creation on purchase intent send

### Phase 2: Read Operations
- Create `OrderBusinessService` to orchestrate order queries
- Create `useOrderTracking` hook
- Build buyer order list page (`/orders`)
- Build seller order list page (`/my-shop/orders`)
- Build order detail page (`/orders/[intentId]`)

### Phase 3: Update Operations
- Seller payment link form (in messages or orders page)
- Buyer payment confirmation button
- Seller shipping form with tracking number
- Buyer delivery confirmation button

### Phase 4: Advanced Features
- Order statistics dashboard
- Export order data (CSV/JSON)
- Dispute management UI
- Order search and filtering
- Email/Nostr notifications for status changes

---

## Privacy & Security Considerations

### Encrypted Data
- Shipping addresses stored encrypted (same encryption as NIP-17)
- Payment links visible only to buyer/seller
- Order notes encrypted

### Access Control
- Buyers can only view their own orders
- Sellers can only view orders where they are the seller
- No global order visibility except to platform admin (for dispute resolution)

### Data Retention
- Orders kept indefinitely for accounting/disputes
- Can add TTL for old completed orders (e.g., 2 years)
- Disputed orders never auto-deleted

---

## Testing Strategy

### Unit Tests
- KVService order methods (CRUD operations)
- OrderBusinessService orchestration
- Hook state management

### Integration Tests
- Full order lifecycle (intent → delivery)
- Status transitions validation
- Pagination and filtering
- Buyer/seller access control

### E2E Tests
- Complete purchase flow with order tracking
- Multi-item orders across multiple sellers
- Order cancellation and disputes

---

## Success Metrics

- **Order Tracking Rate:** % of purchase intents that create order records (target: 100%)
- **Order Completion Rate:** % of orders that reach "delivered" status (target: >80%)
- **Status Update Frequency:** Average time between status changes (track bottlenecks)
- **Dispute Rate:** % of orders that enter "disputed" status (target: <5%)
- **User Engagement:** % of users who check order status after purchase (measure utility)

---

## Future Enhancements

1. **Automated Status Updates:** Detect payment via Lightning node integration
2. **Carrier API Integration:** Auto-update tracking from USPS/FedEx APIs
3. **Smart Contracts:** Escrow via Bitcoin smart contracts (future)
4. **Reputation System:** Link order completion to seller/buyer reputation scores
5. **Analytics Dashboard:** Seller revenue tracking, buyer spending patterns
6. **Order Templates:** Quick re-order from past purchases
7. **Wishlist Integration:** Track orders that originated from wishlist

---

## Files to Create/Modify

### NEW Files

**Types:**
- `/src/types/order.ts` - OrderData, OrderProduct, OrderStatus, OrderStats

**Business Layer:**
- `/src/services/business/OrderBusinessService.ts` - Order orchestration logic

**Hooks:**
- `/src/hooks/useOrderTracking.ts` - Fetch and manage single order
- `/src/hooks/useBuyerOrders.ts` - Fetch buyer's order list
- `/src/hooks/useSellerOrders.ts` - Fetch seller's order list
- `/src/hooks/useOrderActions.ts` - Update order status/details

**Components:**
- `/src/components/orders/OrdersList.tsx` - List of orders (table)
- `/src/components/orders/OrderDetail.tsx` - Single order detail view
- `/src/components/orders/OrderTimeline.tsx` - Status timeline visualization
- `/src/components/orders/OrderActions.tsx` - Action buttons (ship, cancel, etc.)
- `/src/components/orders/OrderStatusBadge.tsx` - Status indicator component

**Pages:**
- `/src/app/orders/page.tsx` - Buyer order list page
- `/src/app/orders/[intentId]/page.tsx` - Order detail page
- `/src/app/my-shop/orders/page.tsx` - Seller order management page

### MODIFIED Files

**Core Layer:**
- `/src/services/core/KVService.ts` - Add all order tracking methods

**Business Layer:**
- `/src/services/business/PurchaseBusinessService.ts` - Add `kvService.logOrder()` call

---

## Summary

Order tracking provides persistent, queryable storage for the complete purchase lifecycle. It bridges the gap between ephemeral NIP-17 messages and the need for long-term order management. By keeping it in the Core layer (KVService) alongside event analytics, we maintain SOA compliance while enabling powerful buyer/seller dashboards and dispute resolution workflows.

**Key Benefits:**
- ✅ Complete audit trail of purchases
- ✅ Buyer/seller order dashboards
- ✅ Status tracking and timeline visualization
- ✅ Foundation for reputation system
- ✅ Dispute resolution support
- ✅ Analytics and reporting capabilities
