import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const problems = [
  {
    title: "Bit.ly",
    slug: "bitly",
    difficulty: "EASY",
    description:
      "Design a URL shortening service like Bit.ly that converts long URLs into shorter, manageable links and redirects users when they visit the short link.",
    referenceData: JSON.stringify({
      requirements: {
        functional: [
          "Users should be able to submit a long URL and receive a shortened version",
          "Users should be able to access the original URL by using the shortened URL",
          "Optionally, users can specify a custom alias or expiration date",
        ],
        nonFunctional: [
          "The system should scale to support 1B shortened URLs and 100M DAU",
          "High availability (99.99%), prioritizing availability over consistency",
          "Redirection should occur with minimal delay (< 100ms)",
          "Short codes must be unique — each maps to exactly one long URL",
        ],
        keyInsight:
          "Read-to-write ratio is heavily skewed towards reads (~1000:1). This asymmetry drives caching strategy and architecture.",
      },
      entities: ["User", "ShortURL (shortCode, longUrl, expiresAt, createdAt)"],
      api: [
        {
          method: "POST",
          path: "/urls",
          body: '{ "long_url": "string", "custom_alias?": "string", "expiration_date?": "string" }',
          response: '{ "short_url": "string" }',
          description: "Create a shortened URL",
        },
        {
          method: "GET",
          path: "/{short_code}",
          response: "HTTP 302 Redirect to original long URL",
          description: "Redirect to original URL",
        },
      ],
      architecture: {
        components: [
          "Client (Web/Mobile)",
          "Load Balancer",
          "URL Shortening Service",
          "Database (NoSQL — key-value store for fast lookups)",
          "Cache (Redis — for hot short URLs)",
          "CDN (optional, for static assets)",
        ],
        flow: [
          "POST /urls → Service generates short code (base62 encoding of auto-increment ID or hash) → stores mapping in DB → returns short URL",
          "GET /{code} → Check cache first → if miss, query DB → return 302 redirect → update cache",
        ],
        keyDecisions: [
          "Short code generation: Base62 encoding of counter (simple, unique) vs MD5/SHA hash truncation (no coordination needed)",
          "Cache strategy: Write-through for new URLs, LRU eviction for reads",
          "Database: NoSQL key-value (DynamoDB/Cassandra) for fast O(1) lookups by short code",
        ],
      },
      deepDives: [
        {
          topic: "Short Code Generation",
          description:
            "Compare base62 counter vs hash-based approaches. Counter needs coordination (single point of failure) but guarantees uniqueness. Hash needs collision handling but is stateless.",
          expectedPoints: [
            "Base62 with auto-increment counter or distributed ID generator (Snowflake)",
            "Hash approach: MD5/SHA256 → take first 7 chars → check for collision → retry or append",
            "Custom aliases: validate uniqueness, namespace separation from generated codes",
          ],
        },
        {
          topic: "Caching & Read Optimization",
          description:
            "With 1000:1 read/write ratio, caching is critical.",
          expectedPoints: [
            "Redis/Memcached as cache layer",
            "Cache-aside pattern: check cache → if miss, read DB, populate cache",
            "80/20 rule: cache top 20% of URLs that get 80% of traffic",
            "TTL-based eviction aligned with URL expiration",
          ],
        },
        {
          topic: "Database Scaling",
          description: "How to handle 1B+ URLs with high read throughput.",
          expectedPoints: [
            "Range-based or hash-based sharding on short code",
            "Read replicas to distribute read load",
            "NoSQL for horizontal scalability (Cassandra, DynamoDB)",
          ],
        },
      ],
      rubric: {
        REQUIREMENTS: {
          passing: 60,
          criteria: [
            "Identifies core CRUD operations (create short URL, redirect)",
            "Mentions read-heavy nature of the system",
            "Quantifies scale or mentions high availability",
          ],
        },
        CORE_ENTITIES: {
          passing: 60,
          criteria: [
            "Identifies URL mapping as the core entity",
            "Includes relevant fields (shortCode, longUrl, expiresAt)",
          ],
        },
        API_DESIGN: {
          passing: 60,
          criteria: [
            "Correct HTTP methods (POST for create, GET for redirect)",
            "Uses 301/302 redirect for short URL resolution",
            "Clean RESTful endpoint design",
          ],
        },
        HIGH_LEVEL_DESIGN: {
          passing: 60,
          criteria: [
            "Shows client → load balancer → service → database flow",
            "Includes caching layer for reads",
            "Short code generation mechanism is addressed",
          ],
        },
        DEEP_DIVES: {
          passing: 60,
          criteria: [
            "Discusses short code generation trade-offs",
            "Addresses caching strategy for read-heavy workload",
            "Mentions database scaling approach",
          ],
        },
      },
    }),
  },
  {
    title: "Dropbox",
    slug: "dropbox",
    difficulty: "EASY",
    description:
      "Design a cloud file storage service like Dropbox that allows users to upload, download, and sync files across devices.",
    referenceData: JSON.stringify({
      requirements: {
        functional: [
          "Users should be able to upload and download files",
          "Users should be able to sync files across multiple devices",
          "Users should be able to share files/folders with other users",
        ],
        nonFunctional: [
          "High reliability — files should never be lost (durability > 99.9999%)",
          "Sync should be near real-time across devices",
          "Support files up to 10GB in size",
          "Scale to 500M users, 100M DAU",
        ],
        keyInsight:
          "Chunked upload/download is essential for large files. Delta sync (only send changed bytes) dramatically reduces bandwidth.",
      },
      entities: [
        "User",
        "File (id, name, path, size, checksum, versions[])",
        "FileChunk (id, fileId, chunkIndex, hash, storageLocation)",
        "SharedFolder (id, ownerId, members[])",
      ],
      api: [
        {
          method: "POST",
          path: "/files/upload",
          body: "multipart/form-data with chunks",
          response: '{ "file_id": "string", "version": "number" }',
          description: "Upload a file (chunked)",
        },
        {
          method: "GET",
          path: "/files/{file_id}",
          response: "File stream",
          description: "Download a file",
        },
        {
          method: "GET",
          path: "/sync/changes?cursor={cursor}",
          response: '{ "changes": [...], "cursor": "string" }',
          description: "Get changes since last sync",
        },
      ],
      architecture: {
        components: [
          "Client App (desktop/mobile with local sync agent)",
          "API Gateway / Load Balancer",
          "Metadata Service (file metadata, user data)",
          "Block Storage Service (handles chunking)",
          "Object Storage (S3-like for actual file data)",
          "Sync Service (WebSocket/long-polling for real-time sync)",
          "Message Queue (for async processing)",
          "Metadata DB (relational — PostgreSQL)",
        ],
        flow: [
          "Upload: Client chunks file → uploads chunks to Block Storage → Block Storage stores in Object Storage → Metadata Service records file metadata",
          "Sync: Client connects to Sync Service via WebSocket → on file change, Sync Service notifies connected clients → clients fetch delta changes",
        ],
        keyDecisions: [
          "Chunking: Split files into 4MB chunks, deduplicate by content hash",
          "Delta sync: Only transfer changed chunks using rolling checksum (rsync algorithm)",
          "Storage: Object storage (S3) for file data, relational DB for metadata",
        ],
      },
      deepDives: [
        {
          topic: "Chunking & Deduplication",
          description:
            "How to efficiently handle large files and avoid storing duplicate data.",
          expectedPoints: [
            "Content-defined chunking (Rabin fingerprinting) vs fixed-size chunks",
            "Content-addressable storage: hash each chunk, deduplicate globally",
            "Saves storage for common files (e.g., OS files, libraries)",
          ],
        },
        {
          topic: "Sync Protocol",
          description: "How to keep files in sync across devices efficiently.",
          expectedPoints: [
            "Long-polling or WebSocket for real-time notifications",
            "Cursor-based sync: client sends last cursor, server returns changes since then",
            "Conflict resolution: last-writer-wins or create conflict copies",
          ],
        },
        {
          topic: "Reliability & Durability",
          description: "Ensuring files are never lost.",
          expectedPoints: [
            "Replication across multiple data centers (3+ copies)",
            "Erasure coding for storage efficiency vs full replication",
            "Checksums for data integrity verification",
          ],
        },
      ],
      rubric: {
        REQUIREMENTS: {
          passing: 60,
          criteria: [
            "Identifies upload, download, and sync as core features",
            "Mentions large file support and reliability",
            "Addresses multi-device sync requirement",
          ],
        },
        CORE_ENTITIES: {
          passing: 60,
          criteria: [
            "Identifies File and Chunk as separate entities",
            "Mentions versioning or metadata",
          ],
        },
        API_DESIGN: {
          passing: 60,
          criteria: [
            "Chunked upload endpoint",
            "Sync/changes endpoint with cursor-based pagination",
          ],
        },
        HIGH_LEVEL_DESIGN: {
          passing: 60,
          criteria: [
            "Separates metadata from file storage",
            "Includes block/object storage",
            "Shows sync mechanism",
          ],
        },
        DEEP_DIVES: {
          passing: 60,
          criteria: [
            "Discusses chunking strategy",
            "Addresses sync protocol and conflict resolution",
            "Mentions durability measures",
          ],
        },
      },
    }),
  },
  {
    title: "WhatsApp",
    slug: "whatsapp",
    difficulty: "MEDIUM",
    description:
      "Design a real-time messaging service like WhatsApp that supports 1-on-1 and group messaging with delivery receipts and online status.",
    referenceData: JSON.stringify({
      requirements: {
        functional: [
          "Users should be able to send and receive messages in real-time (1-on-1)",
          "Users should be able to create group chats and send messages to groups",
          "Users should see message delivery status (sent, delivered, read)",
        ],
        nonFunctional: [
          "Low latency message delivery (< 500ms for online users)",
          "High availability — messages must not be lost",
          "Support 2B users, 100M concurrent connections",
          "Messages should be delivered in order within a conversation",
        ],
        keyInsight:
          "The core challenge is maintaining millions of persistent connections and routing messages efficiently. A chat service is fundamentally a pub/sub system.",
      },
      entities: [
        "User (id, name, lastSeen, status)",
        "Conversation (id, type, participants[])",
        "Message (id, conversationId, senderId, content, timestamp, status)",
      ],
      api: [
        {
          method: "WebSocket",
          path: "/ws/connect",
          description: "Establish persistent connection for real-time messaging",
        },
        {
          method: "POST",
          path: "/messages",
          body: '{ "conversation_id": "string", "content": "string" }',
          response: '{ "message_id": "string", "timestamp": "string" }',
          description: "Send a message (also via WebSocket)",
        },
        {
          method: "GET",
          path: "/conversations/{id}/messages?cursor={cursor}",
          response: '{ "messages": [...], "cursor": "string" }',
          description: "Fetch message history",
        },
      ],
      architecture: {
        components: [
          "Client Apps (mobile/web)",
          "WebSocket Gateway (manages persistent connections)",
          "Chat Service (message routing and processing)",
          "Presence Service (online/offline status)",
          "Message Queue (Kafka — for async delivery and ordering)",
          "Message Store (Cassandra — write-heavy, partitioned by conversation)",
          "User Service + DB",
          "Push Notification Service (for offline users)",
        ],
        flow: [
          "Send: Client sends message via WebSocket → Gateway routes to Chat Service → Chat Service publishes to Kafka → Consumer stores in Cassandra + routes to recipient's Gateway",
          "Offline: If recipient is offline → push notification via APNs/FCM → message stored for later delivery",
          "Group: Message published to group topic → fanout to all members' connections",
        ],
        keyDecisions: [
          "WebSocket for real-time bidirectional communication",
          "Kafka for message ordering and durability",
          "Cassandra for write-heavy message storage (partitioned by conversation_id)",
          "Connection-to-server mapping via consistent hashing or session registry",
        ],
      },
      deepDives: [
        {
          topic: "Connection Management at Scale",
          description: "Handling millions of concurrent WebSocket connections.",
          expectedPoints: [
            "Each gateway server handles ~100K connections",
            "Service registry maps user → gateway server",
            "Sticky sessions or consistent hashing for connection routing",
            "Graceful failover when a gateway goes down",
          ],
        },
        {
          topic: "Message Ordering & Delivery Guarantees",
          description: "Ensuring messages arrive in order and aren't lost.",
          expectedPoints: [
            "Per-conversation ordering via Kafka partitions (partition by conversation_id)",
            "At-least-once delivery with client-side deduplication (message IDs)",
            "Delivery receipts: sent (server ack), delivered (recipient ack), read (client event)",
          ],
        },
        {
          topic: "Group Messaging",
          description: "Efficient fanout for group messages.",
          expectedPoints: [
            "Small groups (< 256): server-side fanout, write to each member",
            "Message stored once, pointer/reference per member",
            "Last-read pointer per member for unread counts",
          ],
        },
      ],
      rubric: {
        REQUIREMENTS: {
          passing: 60,
          criteria: [
            "Identifies real-time 1-on-1 and group messaging",
            "Mentions delivery status/receipts",
            "Addresses scale (concurrent users) and low latency",
          ],
        },
        CORE_ENTITIES: {
          passing: 60,
          criteria: [
            "Identifies User, Conversation, Message",
            "Message includes status/delivery tracking",
          ],
        },
        API_DESIGN: {
          passing: 60,
          criteria: [
            "Uses WebSocket for real-time communication",
            "Has REST fallback for history/offline",
          ],
        },
        HIGH_LEVEL_DESIGN: {
          passing: 60,
          criteria: [
            "Shows WebSocket gateway layer",
            "Includes message queue for async delivery",
            "Separates presence service",
          ],
        },
        DEEP_DIVES: {
          passing: 60,
          criteria: [
            "Addresses connection management at scale",
            "Discusses message ordering guarantees",
            "Mentions offline delivery / push notifications",
          ],
        },
      },
    }),
  },
  {
    title: "Ticketmaster",
    slug: "ticketmaster",
    difficulty: "MEDIUM",
    description:
      "Design an event ticketing platform like Ticketmaster that handles high-concurrency ticket sales, seat selection, and prevents overselling.",
    referenceData: JSON.stringify({
      requirements: {
        functional: [
          "Users should be able to browse events and view available seats",
          "Users should be able to select seats and purchase tickets",
          "The system should prevent double-booking / overselling of seats",
        ],
        nonFunctional: [
          "Handle extreme traffic spikes (100K+ concurrent users for popular events)",
          "Strong consistency for seat inventory — no overselling",
          "Low latency seat selection (< 1s to lock a seat)",
          "High availability with graceful degradation",
        ],
        keyInsight:
          "The core challenge is concurrent seat booking. You need distributed locking or optimistic concurrency to prevent overselling while maintaining performance under flash-sale conditions.",
      },
      entities: [
        "Event (id, name, date, venue, sections[])",
        "Seat (id, eventId, section, row, number, status)",
        "Reservation (id, userId, seatIds[], status, expiresAt)",
        "Booking (id, userId, reservationId, paymentId, createdAt)",
      ],
      api: [
        {
          method: "GET",
          path: "/events/{id}/seats?section={section}",
          response: '{ "seats": [{ "id", "status", "price" }] }',
          description: "Get available seats for an event",
        },
        {
          method: "POST",
          path: "/reservations",
          body: '{ "event_id": "string", "seat_ids": ["string"] }',
          response: '{ "reservation_id": "string", "expires_at": "string" }',
          description: "Temporarily reserve seats (hold for N minutes)",
        },
        {
          method: "POST",
          path: "/bookings",
          body: '{ "reservation_id": "string", "payment_info": {} }',
          response: '{ "booking_id": "string", "tickets": [...] }',
          description: "Confirm booking and process payment",
        },
      ],
      architecture: {
        components: [
          "Client (Web/Mobile)",
          "CDN (for static event pages)",
          "API Gateway / Load Balancer",
          "Event Service (browse, search events)",
          "Inventory Service (seat availability, reservation logic)",
          "Booking Service (payment, confirmation)",
          "Queue (for processing bookings asynchronously)",
          "Relational DB (PostgreSQL — strong consistency for seat inventory)",
          "Cache (Redis — for real-time seat availability view)",
          "Virtual Waiting Room (queue users during flash sales)",
        ],
        flow: [
          "Browse: Client → CDN/Cache for event info → Event Service for seat map",
          "Reserve: Client → Inventory Service → lock seats in DB (optimistic locking or SELECT FOR UPDATE) → create temporary reservation with TTL",
          "Book: Client → Booking Service → verify reservation not expired → process payment → mark seats as sold",
          "Expiry: Background job releases expired reservations back to available pool",
        ],
        keyDecisions: [
          "Two-phase booking: reserve (temporary hold) → confirm (payment)",
          "Optimistic locking with version column on seat status",
          "Virtual waiting room / queue for flash sales to control concurrency",
          "PostgreSQL for seat inventory (ACID transactions, SELECT FOR UPDATE)",
        ],
      },
      deepDives: [
        {
          topic: "Preventing Overselling",
          description: "How to ensure no two users book the same seat.",
          expectedPoints: [
            "Optimistic concurrency control: version column, retry on conflict",
            "Pessimistic locking: SELECT FOR UPDATE in a transaction",
            "Temporary reservations with TTL (e.g., 10 min hold)",
            "Idempotency keys to prevent duplicate bookings",
          ],
        },
        {
          topic: "Handling Flash Sales / Traffic Spikes",
          description: "Managing extreme concurrency during popular event sales.",
          expectedPoints: [
            "Virtual waiting room: queue users, release in batches",
            "Rate limiting per user",
            "Pre-compute seat availability in Redis, sync back to DB",
            "CDN + edge caching for event pages",
          ],
        },
        {
          topic: "Payment & Failure Handling",
          description: "Ensuring consistent state through the payment flow.",
          expectedPoints: [
            "Saga pattern or two-phase commit for reservation → payment → booking",
            "Payment failure → release reservation",
            "Retry with idempotency for payment gateway calls",
          ],
        },
      ],
      rubric: {
        REQUIREMENTS: {
          passing: 60,
          criteria: [
            "Identifies browse, select, purchase flow",
            "Explicitly mentions preventing overselling",
            "Addresses high concurrency / flash sale scenario",
          ],
        },
        CORE_ENTITIES: {
          passing: 60,
          criteria: [
            "Separates Reservation from Booking",
            "Seat has a status field",
          ],
        },
        API_DESIGN: {
          passing: 60,
          criteria: [
            "Two-step flow: reserve then book",
            "Reservation has an expiration",
          ],
        },
        HIGH_LEVEL_DESIGN: {
          passing: 60,
          criteria: [
            "Shows separate inventory and booking services",
            "Includes locking/concurrency mechanism",
            "Has a queue or waiting room concept",
          ],
        },
        DEEP_DIVES: {
          passing: 60,
          criteria: [
            "Discusses concurrency control (optimistic vs pessimistic)",
            "Addresses flash sale handling",
            "Mentions payment failure recovery",
          ],
        },
      },
    }),
  },
  {
    title: "Uber",
    slug: "uber",
    difficulty: "HARD",
    description:
      "Design a ride-sharing service like Uber that matches riders with nearby drivers in real-time, tracks rides, and handles pricing.",
    referenceData: JSON.stringify({
      requirements: {
        functional: [
          "Riders should be able to request a ride and be matched with a nearby driver",
          "Drivers should be able to accept/decline ride requests",
          "Both parties should see real-time location tracking during a ride",
        ],
        nonFunctional: [
          "Low latency matching (< 1s to find nearby drivers)",
          "Real-time location updates (every 3-5 seconds)",
          "Scale to 1M concurrent rides, 10M DAU",
          "High availability — ride in progress must not be disrupted",
        ],
        keyInsight:
          "The core challenge is efficient geospatial querying at scale — quickly finding drivers near a given location. This requires specialized spatial indexing (geohash, quadtree, or S2 cells).",
      },
      entities: [
        "User (id, name, type: rider/driver)",
        "DriverLocation (driverId, lat, lng, geohash, updatedAt, status)",
        "Ride (id, riderId, driverId, status, pickup, dropoff, fare, createdAt)",
        "RideRequest (id, riderId, pickup, dropoff, estimatedFare, status)",
      ],
      api: [
        {
          method: "POST",
          path: "/rides/request",
          body: '{ "pickup": { "lat", "lng" }, "dropoff": { "lat", "lng" } }',
          response: '{ "ride_request_id": "string", "estimated_fare": "number" }',
          description: "Request a ride",
        },
        {
          method: "POST",
          path: "/rides/{request_id}/accept",
          body: '{ "driver_id": "string" }',
          response: '{ "ride_id": "string" }',
          description: "Driver accepts a ride request",
        },
        {
          method: "WebSocket",
          path: "/ws/location",
          description: "Real-time location updates (driver → server, server → rider)",
        },
      ],
      architecture: {
        components: [
          "Client Apps (Rider & Driver)",
          "API Gateway / Load Balancer",
          "Ride Matching Service (finds nearby drivers, dispatches requests)",
          "Location Service (ingests and queries driver locations)",
          "Ride Service (manages ride lifecycle)",
          "Pricing Service (surge pricing, fare calculation)",
          "Geospatial Index (Redis with geohash or dedicated spatial DB)",
          "Message Queue (Kafka — for location event streaming)",
          "Ride DB (PostgreSQL for ride records)",
          "Push Notification Service",
        ],
        flow: [
          "Driver Location: Driver app sends GPS → Location Service → updates geospatial index (Redis GEOADD)",
          "Ride Request: Rider requests → Ride Matching Service queries geospatial index for nearby available drivers → sends request to closest drivers",
          "Matching: First driver to accept wins → Ride Service creates ride → both parties get WebSocket updates",
          "During Ride: Driver location streams via WebSocket → relayed to rider in real-time",
        ],
        keyDecisions: [
          "Geospatial indexing: Redis GEO commands (GEOADD, GEORADIUS) or S2/H3 cells for spatial partitioning",
          "Location updates at high frequency: Kafka for ingestion, batch writes to index",
          "Matching: nearest-first with expanding radius, timeout and re-dispatch if no accept",
        ],
      },
      deepDives: [
        {
          topic: "Geospatial Indexing",
          description: "Efficiently finding nearby drivers among millions.",
          expectedPoints: [
            "Geohash: encode lat/lng into string prefix, nearby locations share prefix",
            "Quadtree: recursively partition 2D space, efficient range queries",
            "S2/H3 cells: hierarchical spatial indexing used by Uber/Google",
            "Redis GEO commands for simple implementation",
          ],
        },
        {
          topic: "Real-Time Location Tracking",
          description: "Handling millions of location updates per second.",
          expectedPoints: [
            "Driver sends updates every 3-5 seconds",
            "Kafka for high-throughput location event ingestion",
            "In-memory geospatial index (Redis) updated from Kafka consumer",
            "WebSocket for pushing updates to rider during active ride",
          ],
        },
        {
          topic: "Ride Matching & Dispatch",
          description: "Matching riders with optimal drivers efficiently.",
          expectedPoints: [
            "Query nearby available drivers within expanding radius",
            "Send request to top N candidates, first-accept wins",
            "Timeout → expand radius → re-dispatch",
            "Consider ETA (not just distance) for better matching",
          ],
        },
      ],
      rubric: {
        REQUIREMENTS: {
          passing: 60,
          criteria: [
            "Identifies matching, tracking, and ride lifecycle",
            "Mentions real-time requirements",
            "Addresses scale of concurrent rides",
          ],
        },
        CORE_ENTITIES: {
          passing: 60,
          criteria: [
            "Separates DriverLocation from User",
            "Ride entity tracks full lifecycle (status field)",
          ],
        },
        API_DESIGN: {
          passing: 60,
          criteria: [
            "Request/accept flow for matching",
            "WebSocket for real-time location",
          ],
        },
        HIGH_LEVEL_DESIGN: {
          passing: 60,
          criteria: [
            "Shows geospatial index for location queries",
            "Separates matching service from ride service",
            "Includes real-time communication layer",
          ],
        },
        DEEP_DIVES: {
          passing: 60,
          criteria: [
            "Discusses geospatial indexing approach",
            "Addresses high-frequency location update handling",
            "Explains matching/dispatch algorithm",
          ],
        },
      },
    }),
  },
  // ─── NEW EASY PROBLEMS ───────────────────────────────────────
  {
    title: "Rate Limiter",
    slug: "rate-limiter",
    difficulty: "EASY",
    description:
      "Design a rate limiting service that controls the rate of traffic sent by a client or service. Commonly used to protect APIs from abuse and ensure fair resource usage.",
    referenceData: JSON.stringify({
      requirements: {
        functional: [
          "Limit the number of requests a client can make within a time window",
          "Return appropriate error responses (429 Too Many Requests) when limit is exceeded",
          "Support configurable rate limits per client, API endpoint, or globally",
        ],
        nonFunctional: [
          "Low latency — rate check must add < 5ms overhead per request",
          "High availability — rate limiter failure should not block traffic (fail-open)",
          "Distributed — work correctly across multiple API servers",
          "Accurate counting even under high concurrency",
        ],
        keyInsight:
          "The choice of rate limiting algorithm (token bucket, sliding window, fixed window) directly impacts accuracy, memory usage, and burst handling. Distributed counters need atomic operations.",
      },
      entities: [
        "RateLimitRule (id, clientId, endpoint, maxRequests, windowSeconds)",
        "Counter (key, count, windowStart, ttl)",
      ],
      api: [
        {
          method: "POST",
          path: "/api/* (middleware)",
          description: "Rate limit check applied as middleware before any API handler",
        },
        {
          method: "GET",
          path: "/rate-limit/status",
          response: '{ "limit": 100, "remaining": 42, "reset_at": "ISO timestamp" }',
          description: "Check current rate limit status for the caller",
        },
        {
          method: "PUT",
          path: "/rate-limit/rules",
          body: '{ "client_id": "string", "endpoint": "string", "max_requests": 100, "window_seconds": 60 }',
          description: "Configure rate limit rules (admin)",
        },
      ],
      architecture: {
        components: [
          "Client",
          "API Gateway / Load Balancer",
          "Rate Limiter Middleware",
          "Redis (distributed counter store)",
          "Rules Configuration DB",
          "API Servers",
        ],
        flow: [
          "Request arrives → Rate Limiter middleware extracts client key (IP, API key, user ID)",
          "Middleware queries Redis for current counter → if under limit, increment and forward; if over, return 429",
          "Response includes X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset headers",
        ],
        keyDecisions: [
          "Algorithm: Token bucket (smooth bursts), sliding window log (accurate), or fixed window counter (simple)",
          "Redis for distributed atomic counters (INCR + EXPIRE or Lua scripts)",
          "Fail-open policy: if Redis is down, allow requests through",
        ],
      },
      deepDives: [
        {
          topic: "Rate Limiting Algorithms",
          description: "Compare different algorithms and their trade-offs.",
          expectedPoints: [
            "Token Bucket: smooth rate, allows controlled bursts, memory-efficient",
            "Sliding Window Log: most accurate, but higher memory (stores timestamps)",
            "Fixed Window Counter: simplest, but allows 2x burst at window boundaries",
            "Sliding Window Counter: hybrid — weighted average of current and previous window",
          ],
        },
        {
          topic: "Distributed Rate Limiting",
          description: "Ensuring accurate counting across multiple servers.",
          expectedPoints: [
            "Centralized counter in Redis with atomic INCR + EXPIRE",
            "Lua scripting for atomic check-and-increment",
            "Race condition handling with Redis transactions",
            "Local rate limiting as first pass, global as second (reduces Redis calls)",
          ],
        },
        {
          topic: "Edge Cases & Resilience",
          description: "Handling failure modes and special scenarios.",
          expectedPoints: [
            "Fail-open vs fail-closed when Redis is unavailable",
            "Rate limit by multiple dimensions (IP + user + endpoint)",
            "Distributed clock skew — use Redis server time, not client time",
            "Graceful degradation: return Retry-After header",
          ],
        },
      ],
      rubric: {
        REQUIREMENTS: { passing: 60, criteria: ["Identifies rate limiting by client/endpoint", "Mentions distributed requirement", "Addresses low latency overhead"] },
        CORE_ENTITIES: { passing: 60, criteria: ["Identifies rule/config entity and counter entity", "Counter includes time window concept"] },
        API_DESIGN: { passing: 60, criteria: ["Rate limit as middleware concept", "Includes rate limit response headers"] },
        HIGH_LEVEL_DESIGN: { passing: 60, criteria: ["Shows Redis for distributed counters", "Middleware placement in request flow", "Fail-open strategy mentioned"] },
        DEEP_DIVES: { passing: 60, criteria: ["Compares rate limiting algorithms", "Addresses distributed counting", "Mentions failure handling"] },
      },
    }),
  },
  {
    title: "Notification System",
    slug: "notification-system",
    difficulty: "EASY",
    description:
      "Design a notification system that supports push notifications (mobile), SMS, and email delivery to millions of users with reliable delivery and user preferences.",
    referenceData: JSON.stringify({
      requirements: {
        functional: [
          "Send notifications via multiple channels: push (iOS/Android), SMS, and email",
          "Users can configure notification preferences (opt-in/out per channel and type)",
          "Support both real-time and scheduled notifications",
        ],
        nonFunctional: [
          "High throughput — handle millions of notifications per day",
          "Reliable delivery — notifications must not be lost (at-least-once)",
          "Low latency for real-time notifications (< 5s end-to-end)",
          "Graceful degradation when a delivery channel is down",
        ],
        keyInsight:
          "The core challenge is fan-out at scale — a single event (e.g., 'new post') can trigger millions of notifications. Decoupling ingestion from delivery via message queues is essential.",
      },
      entities: [
        "User (id, email, phone, deviceTokens[])",
        "NotificationPreference (userId, notificationType, channels[])",
        "Notification (id, userId, type, channel, content, status, scheduledAt, sentAt)",
        "Template (id, type, channel, body)",
      ],
      api: [
        {
          method: "POST",
          path: "/notifications/send",
          body: '{ "user_ids": ["string"], "type": "string", "data": {} }',
          response: '{ "notification_id": "string", "queued": true }',
          description: "Queue a notification for delivery",
        },
        {
          method: "GET",
          path: "/users/{id}/preferences",
          response: '{ "preferences": [{ "type": "string", "channels": ["push", "email"] }] }',
          description: "Get user notification preferences",
        },
        {
          method: "PUT",
          path: "/users/{id}/preferences",
          body: '{ "type": "string", "channels": ["push"] }',
          description: "Update notification preferences",
        },
      ],
      architecture: {
        components: [
          "Client Apps (Web/Mobile)",
          "API Gateway",
          "Notification Service (validates, fans out)",
          "Message Queue (Kafka/SQS — decouples ingestion from delivery)",
          "Push Worker (APNs/FCM)",
          "SMS Worker (Twilio/SNS)",
          "Email Worker (SES/SendGrid)",
          "Notification DB (PostgreSQL — notification logs, preferences)",
          "Template Service",
          "Scheduler (cron-based for scheduled notifications)",
        ],
        flow: [
          "Send: API receives request → Notification Service checks preferences → renders template → publishes to per-channel queues",
          "Delivery: Channel workers consume from queues → call provider APIs (APNs, Twilio, SES) → update status in DB",
          "Retry: Failed deliveries re-queued with exponential backoff → DLQ for permanent failures",
        ],
        keyDecisions: [
          "Message queue per channel for independent scaling and isolation",
          "Template-based rendering to separate content from delivery logic",
          "Preference check before queueing to avoid wasted work",
          "Idempotency key to prevent duplicate notifications",
        ],
      },
      deepDives: [
        {
          topic: "Reliable Delivery & Retry",
          description: "Ensuring notifications aren't lost.",
          expectedPoints: [
            "At-least-once delivery with idempotency keys to prevent duplicates",
            "Per-channel retry with exponential backoff",
            "Dead letter queue (DLQ) for permanently failed notifications",
            "Delivery status tracking: queued → sending → delivered/failed",
          ],
        },
        {
          topic: "Fan-out at Scale",
          description: "Handling events that trigger millions of notifications.",
          expectedPoints: [
            "Batch processing: chunk large recipient lists into smaller batches",
            "Separate 'event ingestion' from 'notification creation' from 'delivery'",
            "Rate limiting per provider (APNs/FCM have throttling limits)",
            "Priority queues: urgent notifications skip ahead",
          ],
        },
        {
          topic: "User Preferences & Deduplication",
          description: "Respecting user choices and avoiding spam.",
          expectedPoints: [
            "Per-type, per-channel opt-in/out stored per user",
            "Frequency capping: max N notifications per user per hour",
            "Deduplication window: same notification not sent twice within X minutes",
            "Quiet hours: respect user timezone and DND settings",
          ],
        },
      ],
      rubric: {
        REQUIREMENTS: { passing: 60, criteria: ["Identifies multi-channel delivery", "Mentions user preferences", "Addresses scale and reliability"] },
        CORE_ENTITIES: { passing: 60, criteria: ["Separates Notification from Preference from Template", "Notification has status tracking"] },
        API_DESIGN: { passing: 60, criteria: ["Send endpoint accepts batch of users", "Preference management endpoints"] },
        HIGH_LEVEL_DESIGN: { passing: 60, criteria: ["Queue-based decoupling of ingestion and delivery", "Per-channel workers", "Shows retry mechanism"] },
        DEEP_DIVES: { passing: 60, criteria: ["Discusses retry and DLQ strategy", "Addresses fan-out scaling", "Mentions preference/dedup logic"] },
      },
    }),
  },
  {
    title: "Pastebin",
    slug: "pastebin",
    difficulty: "EASY",
    description:
      "Design a text-sharing service like Pastebin where users can create, share, and retrieve text snippets via unique URLs.",
    referenceData: JSON.stringify({
      requirements: {
        functional: [
          "Users can create a paste with text content and receive a unique URL",
          "Users can retrieve paste content via the unique URL",
          "Pastes can optionally have an expiration time and syntax highlighting",
        ],
        nonFunctional: [
          "High availability and low latency for reads (< 100ms)",
          "Scale to 10M pastes/month, read-heavy (10:1 read/write ratio)",
          "Paste content should be durable — never lost before expiration",
          "URLs must be short and unique",
        ],
        keyInsight:
          "Very similar to URL shortener but with content storage. The key difference is storing potentially large text blobs efficiently — separate metadata from content storage.",
      },
      entities: [
        "Paste (id, shortKey, content, title, syntax, expiresAt, createdAt)",
        "User (id, name — optional, for tracking authored pastes)",
      ],
      api: [
        {
          method: "POST",
          path: "/pastes",
          body: '{ "content": "string", "title?": "string", "syntax?": "string", "expires_in?": "number" }',
          response: '{ "key": "string", "url": "string" }',
          description: "Create a new paste",
        },
        {
          method: "GET",
          path: "/pastes/{key}",
          response: '{ "content": "string", "title": "string", "syntax": "string", "created_at": "string" }',
          description: "Retrieve a paste by key",
        },
        {
          method: "DELETE",
          path: "/pastes/{key}",
          description: "Delete a paste",
        },
      ],
      architecture: {
        components: [
          "Client (Web)",
          "Load Balancer",
          "Paste Service",
          "Metadata DB (key, title, syntax, expiry — relational or NoSQL)",
          "Object/Blob Storage (S3 — for large paste content)",
          "Cache (Redis — for hot pastes)",
          "Cleanup Service (TTL-based expiration worker)",
        ],
        flow: [
          "Create: Client → Paste Service generates unique key (base62) → stores content in blob storage → stores metadata in DB → returns URL",
          "Read: Client → check cache → if miss, fetch metadata from DB + content from blob storage → populate cache → return",
          "Expire: Background worker scans for expired pastes → deletes from storage + DB",
        ],
        keyDecisions: [
          "Separate metadata DB from content storage (blob storage for large text)",
          "Key generation: base62 encoding of auto-increment or KGS (Key Generation Service)",
          "Cache frequently accessed pastes in Redis",
        ],
      },
      deepDives: [
        {
          topic: "Storage Strategy",
          description: "Efficiently storing variable-size text content.",
          expectedPoints: [
            "Small pastes (< 10KB) can be stored directly in DB",
            "Large pastes stored in object storage (S3) with metadata in DB",
            "Content-addressable storage: hash content to dedup identical pastes",
            "Compression for large text blobs",
          ],
        },
        {
          topic: "Key Generation",
          description: "Generating short unique keys at scale.",
          expectedPoints: [
            "Base62 encoding (a-z, A-Z, 0-9) of auto-increment counter",
            "Pre-generated key pool (KGS) for zero-collision guarantee",
            "6-char base62 = ~56 billion unique keys",
          ],
        },
        {
          topic: "Expiration & Cleanup",
          description: "Managing paste lifecycle.",
          expectedPoints: [
            "TTL-based: set expiry at creation time",
            "Background cleanup worker runs periodically",
            "Lazy deletion: check expiry on read, delete if expired",
            "Redis TTL for cache auto-eviction",
          ],
        },
      ],
      rubric: {
        REQUIREMENTS: { passing: 60, criteria: ["Identifies create/read as core operations", "Mentions expiration feature", "Addresses read-heavy workload"] },
        CORE_ENTITIES: { passing: 60, criteria: ["Paste entity with key, content, expiry", "Separates metadata from content conceptually"] },
        API_DESIGN: { passing: 60, criteria: ["RESTful create and retrieve endpoints", "Supports optional expiration"] },
        HIGH_LEVEL_DESIGN: { passing: 60, criteria: ["Shows separate content storage from metadata", "Includes caching layer", "Cleanup mechanism present"] },
        DEEP_DIVES: { passing: 60, criteria: ["Discusses storage strategy for variable-size content", "Addresses key generation", "Mentions cleanup approach"] },
      },
    }),
  },
  // ─── NEW MEDIUM PROBLEMS ─────────────────────────────────────
  {
    title: "News Feed",
    slug: "news-feed",
    difficulty: "MEDIUM",
    description:
      "Design a social media news feed system like Facebook/Twitter that aggregates posts from followed users and displays them in a personalized, ranked timeline.",
    referenceData: JSON.stringify({
      requirements: {
        functional: [
          "Users can publish posts (text, images, links)",
          "Users can follow/unfollow other users",
          "Users see a personalized feed of posts from people they follow, ranked by relevance/time",
        ],
        nonFunctional: [
          "Feed generation should be fast (< 500ms)",
          "Support 500M users with 10M DAU",
          "Near real-time: new posts appear in followers' feeds within seconds",
          "High availability — feed should always load, even if slightly stale",
        ],
        keyInsight:
          "The fundamental trade-off is fan-out-on-write (push model — pre-compute feeds when a post is created) vs fan-out-on-read (pull model — assemble feed at read time). Most systems use a hybrid.",
      },
      entities: [
        "User (id, name, followerCount)",
        "Post (id, userId, content, mediaUrls[], createdAt)",
        "Follow (followerId, followeeId)",
        "FeedItem (userId, postId, score, createdAt) — pre-computed feed cache",
      ],
      api: [
        {
          method: "POST",
          path: "/posts",
          body: '{ "content": "string", "media_urls?": ["string"] }',
          response: '{ "post_id": "string" }',
          description: "Create a new post",
        },
        {
          method: "GET",
          path: "/feed?cursor={cursor}&limit={limit}",
          response: '{ "items": [{ "post": {}, "author": {} }], "next_cursor": "string" }',
          description: "Get personalized feed for current user",
        },
        {
          method: "POST",
          path: "/users/{id}/follow",
          description: "Follow a user",
        },
      ],
      architecture: {
        components: [
          "Client (Web/Mobile)",
          "API Gateway / Load Balancer",
          "Post Service (creates posts, stores in DB)",
          "Fan-out Service (distributes posts to follower feeds)",
          "Feed Service (reads pre-computed feed)",
          "Feed Cache (Redis — sorted sets per user)",
          "Post DB (stores actual post content)",
          "Social Graph DB (follow relationships)",
          "Message Queue (Kafka — for async fan-out)",
          "Ranking Service (optional — ML-based ranking)",
        ],
        flow: [
          "Post: User creates post → Post Service stores in DB → publishes event to Kafka → Fan-out Service writes to each follower's feed cache (Redis sorted set)",
          "Feed: User requests feed → Feed Service reads from Redis sorted set → fetches full post data from Post DB → returns ranked list",
          "Celebrity handling: Very popular users (>1M followers) use fan-out-on-read instead to avoid massive writes",
        ],
        keyDecisions: [
          "Hybrid fan-out: push for normal users, pull for celebrities",
          "Redis sorted sets for pre-computed feeds (score = timestamp or ranking score)",
          "Cursor-based pagination for infinite scroll",
          "Async fan-out via Kafka to decouple post creation from distribution",
        ],
      },
      deepDives: [
        {
          topic: "Fan-out Strategy",
          description: "Push vs pull model trade-offs.",
          expectedPoints: [
            "Fan-out-on-write (push): fast reads, expensive writes for popular users",
            "Fan-out-on-read (pull): cheap writes, slow reads (must query all followees)",
            "Hybrid: push for users with < N followers, pull for celebrities",
            "Threshold typically around 10K-100K followers",
          ],
        },
        {
          topic: "Feed Ranking",
          description: "How to order posts beyond simple chronological.",
          expectedPoints: [
            "Simple: reverse chronological (timestamp as score)",
            "Advanced: ML ranking based on engagement signals (likes, comments, shares)",
            "Affinity score: how often you interact with the author",
            "Recency decay: older posts get lower scores",
          ],
        },
        {
          topic: "Feed Cache Design",
          description: "Storing and managing pre-computed feeds.",
          expectedPoints: [
            "Redis sorted sets: one per user, post_id as member, score for ranking",
            "Limit feed cache size (e.g., last 500 posts per user)",
            "Cache invalidation on unfollow: remove that user's posts from feed",
            "Cold start: for new users or cache miss, fall back to fan-out-on-read",
          ],
        },
      ],
      rubric: {
        REQUIREMENTS: { passing: 60, criteria: ["Identifies post creation, following, and feed retrieval", "Mentions personalization/ranking", "Addresses scale and latency"] },
        CORE_ENTITIES: { passing: 60, criteria: ["User, Post, Follow entities", "FeedItem or pre-computed feed concept"] },
        API_DESIGN: { passing: 60, criteria: ["Feed endpoint with cursor pagination", "Post creation endpoint"] },
        HIGH_LEVEL_DESIGN: { passing: 60, criteria: ["Shows fan-out mechanism", "Includes feed cache (Redis)", "Async processing via queue"] },
        DEEP_DIVES: { passing: 60, criteria: ["Discusses push vs pull trade-offs", "Addresses celebrity/hot user problem", "Mentions feed ranking approach"] },
      },
    }),
  },
  {
    title: "Web Crawler",
    slug: "web-crawler",
    difficulty: "MEDIUM",
    description:
      "Design a web crawler that systematically browses the internet to download and index web pages for a search engine, handling billions of pages.",
    referenceData: JSON.stringify({
      requirements: {
        functional: [
          "Crawl web pages starting from a set of seed URLs",
          "Extract and follow links to discover new pages",
          "Store downloaded page content for indexing",
        ],
        nonFunctional: [
          "Crawl billions of pages (handle the scale of the web)",
          "Be polite: respect robots.txt and rate-limit per domain",
          "Avoid duplicate crawling of the same page",
          "Fault tolerant — resume after crashes without re-crawling",
        ],
        keyInsight:
          "The core challenge is managing a massive frontier of URLs to visit while being polite (rate-limiting per domain), avoiding duplicates (URL dedup), and handling the sheer scale (distributed workers).",
      },
      entities: [
        "URL (url, domain, priority, lastCrawledAt, status)",
        "CrawledPage (url, content, headers, crawledAt, checksum)",
        "RobotsRule (domain, rules, fetchedAt)",
      ],
      api: [
        {
          method: "POST",
          path: "/crawl/seed",
          body: '{ "urls": ["string"] }',
          description: "Add seed URLs to the frontier",
        },
        {
          method: "GET",
          path: "/crawl/status",
          response: '{ "pages_crawled": 0, "frontier_size": 0, "pages_per_second": 0 }',
          description: "Get crawler status and metrics",
        },
      ],
      architecture: {
        components: [
          "URL Frontier (priority queue of URLs to crawl)",
          "Crawler Workers (distributed fleet that fetches pages)",
          "DNS Resolver (cached DNS lookups)",
          "Content Store (S3/HDFS for raw HTML)",
          "URL Dedup Store (Bloom filter + DB for seen URLs)",
          "Link Extractor (parses HTML, extracts links)",
          "Robots.txt Cache",
          "Politeness Controller (per-domain rate limiter)",
          "Message Queue (distributes URLs to workers)",
        ],
        flow: [
          "Seed: Initial URLs added to frontier queue",
          "Fetch: Worker picks URL from frontier → checks robots.txt → respects politeness delay → fetches page",
          "Process: Worker extracts links → dedup check against Bloom filter → new URLs added to frontier → content stored",
          "Loop: Continue until frontier is empty or crawl budget exhausted",
        ],
        keyDecisions: [
          "URL frontier: priority queue with per-domain queues for politeness",
          "Bloom filter for fast URL dedup (acceptable false positive rate)",
          "Consistent hashing to assign domains to specific worker groups",
          "Checksum-based content dedup (detect near-duplicate pages)",
        ],
      },
      deepDives: [
        {
          topic: "URL Frontier Design",
          description: "Managing billions of URLs to crawl efficiently.",
          expectedPoints: [
            "Two-level queue: priority queue (important pages first) + politeness queue (per-domain)",
            "Priority based on PageRank, freshness, or domain importance",
            "Back queue: one sub-queue per domain to enforce crawl delay",
            "Persistent frontier for crash recovery",
          ],
        },
        {
          topic: "Duplicate Detection",
          description: "Avoiding redundant crawling.",
          expectedPoints: [
            "URL normalization (remove fragments, lowercase, sort params)",
            "Bloom filter for fast membership check (O(1), space-efficient)",
            "Content fingerprinting (SimHash/MinHash) for near-duplicate detection",
            "Checksum comparison to detect unchanged pages on re-crawl",
          ],
        },
        {
          topic: "Politeness & Scalability",
          description: "Being a good citizen while crawling at scale.",
          expectedPoints: [
            "Respect robots.txt directives and Crawl-delay",
            "Per-domain rate limiting (e.g., 1 request per second per domain)",
            "Distributed workers with domain-based sharding",
            "DNS caching to reduce DNS query load",
          ],
        },
      ],
      rubric: {
        REQUIREMENTS: { passing: 60, criteria: ["Identifies crawling, link extraction, storage", "Mentions politeness/robots.txt", "Addresses deduplication"] },
        CORE_ENTITIES: { passing: 60, criteria: ["URL entity with crawl state", "CrawledPage for content storage"] },
        API_DESIGN: { passing: 60, criteria: ["Seed URL endpoint", "Status/monitoring endpoint"] },
        HIGH_LEVEL_DESIGN: { passing: 60, criteria: ["Shows URL frontier queue", "Distributed workers", "Dedup mechanism (Bloom filter)"] },
        DEEP_DIVES: { passing: 60, criteria: ["Discusses frontier design with prioritization", "Addresses duplicate detection strategy", "Mentions politeness controls"] },
      },
    }),
  },
  {
    title: "Search Autocomplete",
    slug: "search-autocomplete",
    difficulty: "MEDIUM",
    description:
      "Design a search autocomplete/typeahead system that suggests the top search queries as the user types, with real-time responsiveness.",
    referenceData: JSON.stringify({
      requirements: {
        functional: [
          "As the user types, suggest the top N most relevant/popular search queries",
          "Suggestions update with each keystroke",
          "Ranking based on historical query popularity/frequency",
        ],
        nonFunctional: [
          "Ultra-low latency (< 100ms per keystroke)",
          "Support millions of concurrent users",
          "Suggestions should be fresh — reflect recent trending queries",
          "Handle billions of historical queries",
        ],
        keyInsight:
          "Trie (prefix tree) is the classic data structure for prefix matching. At scale, the trie is sharded across nodes and cached at edge locations. Offline analytics pipelines update query popularity.",
      },
      entities: [
        "QueryFrequency (prefix, query, frequency, updatedAt)",
        "TrieNode (prefix, topSuggestions[], children)",
      ],
      api: [
        {
          method: "GET",
          path: "/suggestions?prefix={prefix}&limit={limit}",
          response: '{ "suggestions": [{ "query": "string", "score": 0 }] }',
          description: "Get top suggestions for a prefix",
        },
        {
          method: "POST",
          path: "/queries/log",
          body: '{ "query": "string" }',
          description: "Log a completed search query for analytics",
        },
      ],
      architecture: {
        components: [
          "Client (with debouncing)",
          "CDN / Edge Cache (cache popular prefixes)",
          "API Gateway / Load Balancer",
          "Suggestion Service (serves from Trie)",
          "Trie Store (in-memory or Redis-based prefix index)",
          "Query Log Collector (Kafka — streams search events)",
          "Analytics Pipeline (Spark/Flink — aggregates query frequencies)",
          "Trie Builder (offline job: builds/updates trie from analytics)",
        ],
        flow: [
          "Query: User types → client debounces (wait 50-100ms) → sends prefix to Suggestion Service → looks up trie → returns top-k",
          "Logging: Completed search → event to Kafka → Analytics Pipeline aggregates frequencies per time window",
          "Update: Trie Builder periodically rebuilds trie from latest frequency data → swaps in new trie (blue-green)",
        ],
        keyDecisions: [
          "Trie with pre-computed top-k at each node for O(1) lookup",
          "Client-side debouncing to reduce requests (50-100ms)",
          "CDN caching for popular prefixes (1-2 char prefixes)",
          "Offline trie rebuild (not real-time) — avoids write contention",
        ],
      },
      deepDives: [
        {
          topic: "Trie Design & Optimization",
          description: "Building an efficient prefix index.",
          expectedPoints: [
            "Standard trie: one node per character, but memory-heavy",
            "Compressed trie (radix tree): merge single-child chains",
            "Store top-k suggestions at each node (pre-computed, avoids tree traversal)",
            "Trie sharding: partition by first 1-2 characters across servers",
          ],
        },
        {
          topic: "Data Collection & Freshness",
          description: "Keeping suggestions relevant and up-to-date.",
          expectedPoints: [
            "Log all search queries to Kafka",
            "Aggregate with time decay: recent queries weighted higher",
            "Periodic trie rebuild (every 15-60 minutes)",
            "Trending queries: fast path for sudden spikes",
          ],
        },
        {
          topic: "Client-Side Optimizations",
          description: "Reducing latency and server load.",
          expectedPoints: [
            "Debounce: wait N ms after last keystroke before sending request",
            "Local caching: cache prefix → suggestions on client",
            "Pre-fetch: when user types 'ab', pre-fetch 'abc' through 'abz'",
            "Cancel in-flight requests when user types next character",
          ],
        },
      ],
      rubric: {
        REQUIREMENTS: { passing: 60, criteria: ["Identifies prefix-based suggestion", "Mentions real-time per-keystroke latency", "Addresses popularity-based ranking"] },
        CORE_ENTITIES: { passing: 60, criteria: ["Query frequency tracking", "Trie or prefix index concept"] },
        API_DESIGN: { passing: 60, criteria: ["Suggestion endpoint with prefix param", "Query logging endpoint"] },
        HIGH_LEVEL_DESIGN: { passing: 60, criteria: ["Shows trie-based lookup service", "Offline analytics pipeline", "CDN/edge caching"] },
        DEEP_DIVES: { passing: 60, criteria: ["Discusses trie optimization (compressed, pre-computed top-k)", "Addresses data freshness pipeline", "Mentions client-side optimizations"] },
      },
    }),
  },
  // ─── NEW HARD PROBLEMS ──────────────────────────────────────
  {
    title: "Distributed Message Queue",
    slug: "distributed-message-queue",
    difficulty: "HARD",
    description:
      "Design a distributed message queue system like Apache Kafka that supports high-throughput, fault-tolerant, ordered message streaming between producers and consumers.",
    referenceData: JSON.stringify({
      requirements: {
        functional: [
          "Producers publish messages to named topics",
          "Consumers subscribe to topics and consume messages",
          "Support consumer groups with partition-based message distribution",
        ],
        nonFunctional: [
          "High throughput: millions of messages per second",
          "Durable: messages persisted to disk, survive broker failures",
          "Ordered: messages within a partition are strictly ordered",
          "Scalable: add brokers and partitions to increase throughput",
          "Fault tolerant: no data loss when a broker dies",
        ],
        keyInsight:
          "The key insight is the append-only log abstraction. By writing messages sequentially to an append-only log partitioned across brokers, you get high throughput (sequential I/O), ordering (per partition), and scalability (add partitions).",
      },
      entities: [
        "Topic (name, partitionCount, replicationFactor, retentionMs)",
        "Partition (topicName, partitionId, leaderId, replicaIds[], highWatermark)",
        "Message (key, value, timestamp, offset, partition)",
        "ConsumerGroup (groupId, topicSubscriptions[], partitionAssignments[])",
        "Broker (id, host, port, partitionsOwned[])",
      ],
      api: [
        {
          method: "POST",
          path: "/topics/{topic}/messages",
          body: '{ "key?": "string", "value": "string" }',
          response: '{ "partition": 0, "offset": 42 }',
          description: "Produce a message to a topic",
        },
        {
          method: "GET",
          path: "/topics/{topic}/partitions/{partition}/messages?offset={offset}&limit={limit}",
          response: '{ "messages": [...], "next_offset": 43 }',
          description: "Consume messages from a partition",
        },
        {
          method: "POST",
          path: "/topics",
          body: '{ "name": "string", "partitions": 8, "replication_factor": 3 }',
          description: "Create a topic",
        },
      ],
      architecture: {
        components: [
          "Producers (client library)",
          "Consumers (client library with group coordination)",
          "Broker Cluster (stores and serves messages)",
          "Controller / Coordinator (leader election, partition assignment — ZooKeeper or KRaft)",
          "Append-Only Log (on-disk segment files per partition)",
          "Replication Manager (ISR — in-sync replicas)",
          "Consumer Group Coordinator (partition assignment, offset tracking)",
        ],
        flow: [
          "Produce: Producer → partition by key hash (or round-robin) → send to partition leader broker → leader appends to log → replicates to followers → ack to producer",
          "Consume: Consumer joins group → coordinator assigns partitions → consumer polls leader for messages at its committed offset → processes → commits offset",
          "Replication: Leader writes to local log → followers fetch and replicate → message committed when all ISR replicas have it",
        ],
        keyDecisions: [
          "Append-only log with sequential I/O for maximum throughput",
          "Partitioning for parallelism, key-based for ordering guarantees",
          "ISR (In-Sync Replica) set for replication — configurable acks (0, 1, all)",
          "Consumer group protocol for coordinated consumption",
        ],
      },
      deepDives: [
        {
          topic: "Storage Engine: Append-Only Log",
          description: "How messages are stored on disk for maximum throughput.",
          expectedPoints: [
            "Sequential writes only — orders of magnitude faster than random I/O",
            "Log segmented into files (e.g., 1GB each), old segments garbage-collected by retention policy",
            "Zero-copy transfer: sendfile() syscall to send directly from disk to network",
            "Index files for fast offset-to-position lookup",
          ],
        },
        {
          topic: "Replication & Fault Tolerance",
          description: "Ensuring no data loss when brokers fail.",
          expectedPoints: [
            "Each partition has a leader and N-1 followers",
            "ISR (In-Sync Replicas): only replicas that are caught up",
            "Producer acks: acks=0 (fire-and-forget), acks=1 (leader only), acks=all (all ISR)",
            "Leader election: when leader dies, new leader chosen from ISR",
            "Unclean leader election: allow out-of-sync replica to become leader (risks data loss)",
          ],
        },
        {
          topic: "Consumer Groups & Ordering",
          description: "Coordinated consumption with ordering guarantees.",
          expectedPoints: [
            "One consumer per partition within a group (ensures ordering)",
            "Rebalancing: when consumers join/leave, partitions reassigned",
            "Offset management: consumer commits offset to track progress",
            "At-least-once vs exactly-once semantics",
          ],
        },
      ],
      rubric: {
        REQUIREMENTS: { passing: 60, criteria: ["Identifies pub/sub with topics and consumer groups", "Mentions ordering guarantees", "Addresses durability and fault tolerance"] },
        CORE_ENTITIES: { passing: 60, criteria: ["Topic, Partition, Message, ConsumerGroup, Broker", "Message has offset concept"] },
        API_DESIGN: { passing: 60, criteria: ["Produce and consume endpoints", "Offset-based consumption"] },
        HIGH_LEVEL_DESIGN: { passing: 60, criteria: ["Shows broker cluster with partitions", "Replication mechanism", "Consumer group coordination"] },
        DEEP_DIVES: { passing: 60, criteria: ["Discusses append-only log and sequential I/O", "Explains ISR replication model", "Addresses consumer group rebalancing"] },
      },
    }),
  },
  {
    title: "Payment System",
    slug: "payment-system",
    difficulty: "HARD",
    description:
      "Design a payment processing platform like Stripe that handles payment initiation, processing, and settlement with strong consistency, idempotency, and fraud detection.",
    referenceData: JSON.stringify({
      requirements: {
        functional: [
          "Process payments: charge a card, bank transfer, or digital wallet",
          "Support refunds, partial refunds, and disputes",
          "Provide a ledger/audit trail of all transactions",
        ],
        nonFunctional: [
          "Strong consistency — double charges or lost payments are unacceptable",
          "Exactly-once payment processing (idempotency)",
          "PCI DSS compliance for card data handling",
          "High availability (99.99%) with graceful degradation",
          "Low latency for payment confirmation (< 2s)",
        ],
        keyInsight:
          "Payment systems require exactly-once processing in a distributed environment. Idempotency keys, the saga pattern for multi-step transactions, and double-entry bookkeeping for the ledger are foundational.",
      },
      entities: [
        "PaymentIntent (id, amount, currency, status, paymentMethodId, idempotencyKey, createdAt)",
        "PaymentMethod (id, userId, type, tokenizedData)",
        "Transaction (id, paymentIntentId, amount, type, status, createdAt)",
        "LedgerEntry (id, transactionId, accountId, debit, credit, createdAt)",
        "Refund (id, paymentIntentId, amount, status, reason)",
      ],
      api: [
        {
          method: "POST",
          path: "/payment-intents",
          body: '{ "amount": 1000, "currency": "usd", "payment_method_id": "string", "idempotency_key": "string" }',
          response: '{ "id": "string", "status": "processing", "client_secret": "string" }',
          description: "Create a payment intent",
        },
        {
          method: "POST",
          path: "/payment-intents/{id}/confirm",
          response: '{ "status": "succeeded" | "failed" | "requires_action" }',
          description: "Confirm and process the payment",
        },
        {
          method: "POST",
          path: "/refunds",
          body: '{ "payment_intent_id": "string", "amount?": 500 }',
          response: '{ "refund_id": "string", "status": "pending" }',
          description: "Initiate a refund",
        },
      ],
      architecture: {
        components: [
          "Client (Web/Mobile with payment SDK)",
          "API Gateway (TLS, authentication)",
          "Payment Service (orchestrates payment flow)",
          "Payment Processor Gateway (talks to card networks — Visa, Mastercard)",
          "Ledger Service (double-entry bookkeeping)",
          "Fraud Detection Service (rule-based + ML scoring)",
          "Notification Service (webhooks, email receipts)",
          "Primary DB (PostgreSQL — ACID for transactions)",
          "Idempotency Store (Redis — caches idempotency keys)",
          "Message Queue (for async operations: webhooks, reconciliation)",
        ],
        flow: [
          "Create: Client → Payment Service creates PaymentIntent → runs fraud check → returns client_secret",
          "Confirm: Client confirms → Payment Service checks idempotency key → sends to Payment Processor → receives result → records in ledger → returns status",
          "Refund: Refund request → Payment Service creates reverse transaction → sends to processor → updates ledger",
          "Reconciliation: Daily batch job compares internal ledger with processor settlement files",
        ],
        keyDecisions: [
          "Idempotency keys on every mutating operation to prevent double-processing",
          "Double-entry ledger: every transaction has balanced debit and credit entries",
          "Saga pattern for multi-step payment flow (create → authorize → capture)",
          "PCI compliance: tokenize card data, never store raw card numbers",
        ],
      },
      deepDives: [
        {
          topic: "Exactly-Once Processing & Idempotency",
          description: "Preventing double charges in a distributed system.",
          expectedPoints: [
            "Client-generated idempotency key on every request",
            "Server stores key → result mapping; on retry, return cached result",
            "Database-level uniqueness constraint on idempotency key",
            "Timeout handling: if client doesn't get response, retries with same key",
          ],
        },
        {
          topic: "Ledger & Reconciliation",
          description: "Maintaining financial accuracy.",
          expectedPoints: [
            "Double-entry bookkeeping: every transaction creates balanced entries (debit account A, credit account B)",
            "Append-only ledger: never update or delete entries",
            "Daily reconciliation against payment processor settlement files",
            "Discrepancy alerts and manual review workflow",
          ],
        },
        {
          topic: "Failure Handling & Sagas",
          description: "Managing failures in multi-step payment flows.",
          expectedPoints: [
            "Saga pattern: create → authorize → capture, with compensating actions on failure",
            "Authorization failure → cancel PaymentIntent",
            "Capture failure → reverse authorization",
            "Async retry with exponential backoff for transient failures",
            "Circuit breaker for payment processor outages",
          ],
        },
      ],
      rubric: {
        REQUIREMENTS: { passing: 60, criteria: ["Identifies payment processing, refunds, and ledger", "Mentions exactly-once/idempotency", "Addresses PCI compliance or security"] },
        CORE_ENTITIES: { passing: 60, criteria: ["PaymentIntent with status lifecycle", "LedgerEntry with debit/credit", "Idempotency key concept"] },
        API_DESIGN: { passing: 60, criteria: ["Two-step: create intent then confirm", "Idempotency key in request", "Refund endpoint"] },
        HIGH_LEVEL_DESIGN: { passing: 60, criteria: ["Shows payment processor integration", "Ledger service", "Fraud detection"] },
        DEEP_DIVES: { passing: 60, criteria: ["Discusses idempotency implementation", "Explains double-entry ledger", "Addresses saga/failure handling"] },
      },
    }),
  },
  {
    title: "E-Commerce Platform",
    slug: "e-commerce-platform",
    difficulty: "HARD",
    description:
      "Design the backend of an e-commerce platform like Amazon, covering product catalog, shopping cart, order processing, inventory management, and microservice decomposition.",
    referenceData: JSON.stringify({
      requirements: {
        functional: [
          "Users can browse and search a product catalog",
          "Users can add items to a cart and place orders",
          "Inventory is tracked and reserved during checkout to prevent overselling",
        ],
        nonFunctional: [
          "Handle flash sale traffic spikes (100x normal traffic)",
          "Strong consistency for inventory (no overselling)",
          "Eventual consistency acceptable for product catalog and search",
          "Low latency product browsing (< 200ms)",
          "Scale to millions of products and thousands of orders per second",
        ],
        keyInsight:
          "This is a bounded-context problem — the platform naturally decomposes into domains (catalog, cart, orders, inventory, payments) that map to microservices. The hard part is managing data consistency across services, especially inventory during checkout.",
      },
      entities: [
        "Product (id, title, description, price, categoryId, sellerId, imageUrls[])",
        "Inventory (productId, warehouseId, available, reserved)",
        "Cart (userId, items[{productId, quantity}])",
        "Order (id, userId, items[], totalAmount, status, createdAt)",
        "OrderItem (orderId, productId, quantity, unitPrice)",
      ],
      api: [
        {
          method: "GET",
          path: "/products?query={query}&category={cat}&page={page}",
          response: '{ "products": [...], "total": 0, "page": 1 }',
          description: "Search and browse products",
        },
        {
          method: "POST",
          path: "/cart/items",
          body: '{ "product_id": "string", "quantity": 1 }',
          description: "Add item to cart",
        },
        {
          method: "POST",
          path: "/orders",
          body: '{ "cart_id": "string", "shipping_address": {}, "payment_method_id": "string" }',
          response: '{ "order_id": "string", "status": "pending" }',
          description: "Place an order from cart",
        },
      ],
      architecture: {
        components: [
          "Client (Web/Mobile)",
          "API Gateway / BFF (Backend for Frontend)",
          "Product Catalog Service + Elasticsearch",
          "Cart Service + Redis",
          "Order Service + PostgreSQL",
          "Inventory Service + PostgreSQL (ACID for stock)",
          "Payment Service (integrates with payment gateway)",
          "Notification Service",
          "Event Bus (Kafka — cross-service events)",
          "CDN (product images, static assets)",
        ],
        flow: [
          "Browse: Client → API Gateway → Product Catalog Service → Elasticsearch → return results (cached at CDN/Redis)",
          "Cart: Client → Cart Service → Redis (session-based, fast updates)",
          "Checkout: Order Service orchestrates saga → reserve inventory → process payment → create order → emit events → notify user",
          "Failure: Payment fails → compensating action releases inventory reservation",
        ],
        keyDecisions: [
          "Microservice decomposition by bounded context (DDD)",
          "Saga pattern for distributed checkout transaction",
          "Elasticsearch for fast product search (separate read model — CQRS)",
          "Redis for cart (fast, ephemeral, session-scoped)",
          "Event-driven communication between services via Kafka",
        ],
      },
      deepDives: [
        {
          topic: "Inventory Management & Consistency",
          description: "Preventing overselling in a distributed system.",
          expectedPoints: [
            "Optimistic locking with version field on inventory",
            "Two-phase inventory: reserve on checkout start, confirm on payment success",
            "TTL on reservations: auto-release if checkout not completed",
            "Separate 'available' and 'reserved' counters",
          ],
        },
        {
          topic: "Service Decomposition (DDD)",
          description: "How to split into microservices using domain-driven design.",
          expectedPoints: [
            "Bounded contexts: Catalog, Cart, Orders, Inventory, Payments are separate domains",
            "Each service owns its data (no shared database)",
            "Events for cross-service communication (OrderCreated, PaymentSucceeded, InventoryReserved)",
            "API Gateway / BFF to aggregate responses for frontend",
          ],
        },
        {
          topic: "Handling Flash Sales",
          description: "Managing extreme traffic spikes for popular products.",
          expectedPoints: [
            "Virtual queue / waiting room to control checkout concurrency",
            "Pre-warm cache for sale products",
            "Rate limiting per user during flash sales",
            "Async order processing: accept order, process in background",
            "Pre-decrement inventory in Redis, sync to DB",
          ],
        },
      ],
      rubric: {
        REQUIREMENTS: { passing: 60, criteria: ["Identifies catalog, cart, orders, inventory", "Mentions consistency for inventory", "Addresses traffic spikes"] },
        CORE_ENTITIES: { passing: 60, criteria: ["Separates Product, Inventory, Cart, Order", "Inventory has available/reserved concept"] },
        API_DESIGN: { passing: 60, criteria: ["Product search with filters", "Cart management", "Order placement"] },
        HIGH_LEVEL_DESIGN: { passing: 60, criteria: ["Microservice decomposition by domain", "Event-driven communication", "Separate search index (Elasticsearch)"] },
        DEEP_DIVES: { passing: 60, criteria: ["Discusses inventory reservation strategy", "Explains service decomposition rationale", "Addresses flash sale handling"] },
      },
    }),
  },
  {
    title: "YouTube",
    slug: "youtube",
    difficulty: "HARD",
    description:
      "Design a video streaming platform like YouTube that handles video upload, processing, storage, and adaptive streaming to millions of concurrent viewers.",
    referenceData: JSON.stringify({
      requirements: {
        functional: [
          "Users should be able to upload videos",
          "Users should be able to stream/watch videos with adaptive quality",
          "Users should be able to search for videos",
        ],
        nonFunctional: [
          "Support 1B DAU with millions of concurrent video streams",
          "Low startup latency for video playback (< 2s)",
          "High availability and global reach via CDN",
          "Support multiple video resolutions (adaptive bitrate streaming)",
        ],
        keyInsight:
          "Video processing pipeline is the backbone — raw uploads must be transcoded into multiple resolutions/codecs asynchronously. CDN distribution is critical for global low-latency playback.",
      },
      entities: [
        "User (id, name, channelInfo)",
        "Video (id, userId, title, description, status, uploadedAt, duration)",
        "VideoVariant (id, videoId, resolution, codec, storageUrl, size)",
        "Comment (id, videoId, userId, content, createdAt)",
      ],
      api: [
        {
          method: "POST",
          path: "/videos/upload",
          body: "multipart/form-data (chunked upload for large files)",
          response: '{ "video_id": "string", "upload_url": "string" }',
          description: "Initiate video upload (returns pre-signed URL for direct-to-storage upload)",
        },
        {
          method: "GET",
          path: "/videos/{id}/stream",
          response: "HLS/DASH manifest with adaptive bitrate segments",
          description: "Stream a video",
        },
        {
          method: "GET",
          path: "/search?q={query}",
          response: '{ "videos": [...] }',
          description: "Search for videos",
        },
      ],
      architecture: {
        components: [
          "Client (Web/Mobile player with ABR support)",
          "CDN (CloudFront/Akamai — edge servers for video segments)",
          "API Gateway / Load Balancer",
          "Upload Service (handles chunked uploads to Object Storage)",
          "Video Processing Pipeline (transcoding, thumbnail generation)",
          "Object Storage (S3 — raw uploads + transcoded variants)",
          "Metadata Service + DB (PostgreSQL for video metadata)",
          "Search Service (Elasticsearch for video search)",
          "Message Queue (Kafka/SQS — triggers processing pipeline)",
          "Recommendation Service (future scope)",
        ],
        flow: [
          "Upload: Client → Upload Service → direct upload to S3 via pre-signed URL → event published to queue → Processing Pipeline picks up",
          "Processing: Pipeline transcodes to multiple resolutions (1080p, 720p, 480p, 360p) → generates HLS/DASH segments → stores in S3 → updates metadata",
          "Watch: Client requests video → Metadata Service returns CDN URL for manifest → client player fetches segments from nearest CDN edge → adaptive bitrate based on bandwidth",
          "Search: Client query → Search Service (Elasticsearch) → returns ranked results",
        ],
        keyDecisions: [
          "Pre-signed URLs for direct client-to-S3 upload (bypasses application server)",
          "Async processing pipeline triggered by message queue",
          "HLS/DASH for adaptive bitrate streaming",
          "CDN for global distribution and low-latency playback",
          "Elasticsearch for full-text search on video metadata",
        ],
      },
      deepDives: [
        {
          topic: "Video Processing Pipeline",
          description: "Transcoding raw uploads into multiple formats/resolutions.",
          expectedPoints: [
            "Async pipeline: upload event → Kafka/SQS → fleet of transcoding workers",
            "Transcode to multiple resolutions (360p, 480p, 720p, 1080p, 4K)",
            "Generate HLS/DASH manifests with segmented chunks",
            "Thumbnail generation at key frames",
            "Auto-scaling worker fleet based on queue depth",
          ],
        },
        {
          topic: "Adaptive Bitrate Streaming",
          description: "Delivering optimal video quality based on user's bandwidth.",
          expectedPoints: [
            "HLS (Apple) or DASH (standard): split video into small segments (2-10 seconds)",
            "Manifest file lists available quality levels",
            "Client player monitors bandwidth and switches quality dynamically",
            "CDN caches popular video segments at edge locations",
          ],
        },
        {
          topic: "CDN & Global Distribution",
          description: "Serving video to a global audience with low latency.",
          expectedPoints: [
            "Multi-tier CDN: edge → regional → origin",
            "Cache popular content at edge (hot videos = high cache hit rate)",
            "Origin shield to protect S3 from thundering herd",
            "Geo-routing to direct users to nearest edge server",
          ],
        },
      ],
      rubric: {
        REQUIREMENTS: {
          passing: 60,
          criteria: [
            "Identifies upload, streaming, and search as core features",
            "Mentions adaptive quality / multiple resolutions",
            "Addresses global scale and CDN needs",
          ],
        },
        CORE_ENTITIES: {
          passing: 60,
          criteria: [
            "Separates Video metadata from VideoVariant/encoded versions",
            "Includes status tracking for processing state",
          ],
        },
        API_DESIGN: {
          passing: 60,
          criteria: [
            "Chunked or pre-signed URL upload",
            "Streaming endpoint returns manifest",
          ],
        },
        HIGH_LEVEL_DESIGN: {
          passing: 60,
          criteria: [
            "Shows async video processing pipeline",
            "Includes CDN for distribution",
            "Separates upload path from streaming path",
          ],
        },
        DEEP_DIVES: {
          passing: 60,
          criteria: [
            "Discusses transcoding pipeline and worker scaling",
            "Explains adaptive bitrate streaming (HLS/DASH)",
            "Addresses CDN caching strategy",
          ],
        },
      },
    }),
  },
];

const studyResources = [
  // ─── CACHING ─────────────────────────────────────────────────
  { title: "Caching Strategies and How to Choose the Right One", url: "https://codeahoy.com/2017/08/11/caching-strategies-and-how-to-choose-the-right-one/", source: "Blog", topics: "caching,cache-aside,write-through,write-behind,read-through", difficulty: "BEGINNER", description: "Comprehensive overview of caching patterns: cache-aside, read-through, write-through, and write-behind with trade-offs for each.", resourceType: "ARTICLE" },
  { title: "Redis Documentation: Data Types & Patterns", url: "https://redis.io/docs/data-types/", source: "Documentation", topics: "caching,redis,data-structures,sorted-sets", difficulty: "BEGINNER", description: "Official Redis docs on core data types (strings, hashes, sorted sets, streams) used in system design for caching, rate limiting, and real-time feeds.", resourceType: "DOCUMENTATION" },
  { title: "Distributed Caching (Foundations of Scalable Systems, Ch. 6)", url: "https://learning.oreilly.com/library/view/foundations-of-scalable/9781098106058/", source: "O'Reilly", topics: "caching,distributed-caching,web-caching,cache-control", difficulty: "INTERMEDIATE", description: "Covers application caching, web caching (Cache-Control, ETags), and distributed cache architectures for scalable systems.", resourceType: "BOOK_CHAPTER" },
  // ─── LOAD BALANCING & SCALING ────────────────────────────────
  { title: "Load Balancing Algorithms Explained", url: "https://samwho.dev/load-balancing/", source: "Blog", topics: "load-balancing,scaling,horizontal-scaling,round-robin,consistent-hashing", difficulty: "BEGINNER", description: "Visual, interactive explanation of load balancing algorithms: round-robin, weighted, least connections, and consistent hashing.", resourceType: "ARTICLE" },
  { title: "Application Services & Horizontal Scaling (Foundations of Scalable Systems, Ch. 5)", url: "https://learning.oreilly.com/library/view/foundations-of-scalable/9781098106058/", source: "O'Reilly", topics: "horizontal-scaling,load-balancing,elasticity,session-affinity,stateless-services", difficulty: "INTERMEDIATE", description: "Service design, stateless services, load distribution policies, health monitoring, and elasticity for horizontally scaled applications.", resourceType: "BOOK_CHAPTER" },
  { title: "Consistent Hashing: Algorithmic Tradeoffs", url: "https://dgryski.medium.com/consistent-hashing-algorithmic-tradeoffs-ef6b8e2fcae8", source: "Blog", topics: "consistent-hashing,sharding,load-balancing,distributed-systems", difficulty: "INTERMEDIATE", description: "Deep dive into consistent hashing algorithms, virtual nodes, and their trade-offs for distributed system load distribution.", resourceType: "ARTICLE" },
  // ─── DATABASE & SHARDING ─────────────────────────────────────
  { title: "Database Sharding Explained", url: "https://planetscale.com/learn/articles/sharding-vs-partitioning", source: "Blog", topics: "sharding,partitioning,database-scaling,horizontal-scaling", difficulty: "BEGINNER", description: "Clear explanation of database sharding vs partitioning, shard key selection strategies, and common pitfalls.", resourceType: "ARTICLE" },
  { title: "Scalable Database Fundamentals (Foundations of Scalable Systems, Ch. 10)", url: "https://learning.oreilly.com/library/view/foundations-of-scalable/9781098106058/", source: "O'Reilly", topics: "database-scaling,sql,nosql,cap-theorem,read-replicas,sharding", difficulty: "INTERMEDIATE", description: "Covers relational DB scaling (replicas, partitioning), NoSQL data models, the CAP theorem, and when to use each approach.", resourceType: "BOOK_CHAPTER" },
  { title: "Eventual Consistency (Foundations of Scalable Systems, Ch. 11)", url: "https://learning.oreilly.com/library/view/foundations-of-scalable/9781098106058/", source: "O'Reilly", topics: "eventual-consistency,consistency,quorum,version-vectors,conflict-resolution", difficulty: "ADVANCED", description: "Deep dive into eventual consistency: inconsistency windows, tunable consistency, quorum reads/writes, replica repair, and conflict resolution.", resourceType: "BOOK_CHAPTER" },
  { title: "Strong Consistency (Foundations of Scalable Systems, Ch. 12)", url: "https://learning.oreilly.com/library/view/foundations-of-scalable/9781098106058/", source: "O'Reilly", topics: "strong-consistency,two-phase-commit,distributed-consensus,raft,spanner", difficulty: "ADVANCED", description: "Distributed transactions, two-phase commit, Raft consensus, and practical implementations in VoltDB and Google Cloud Spanner.", resourceType: "BOOK_CHAPTER" },
  // ─── MICROSERVICES ───────────────────────────────────────────
  { title: "Microservices Architecture (SDE Roadmap)", url: "https://github.com/aasthas2022/SDE-Interview-and-Prep-Roadmap/blob/main/System%20Design/Microservices.md", source: "GitHub", topics: "microservices,service-discovery,api-gateway,circuit-breaker,CQRS,event-sourcing", difficulty: "BEGINNER", description: "Comprehensive overview of microservices concepts: key characteristics, advantages/disadvantages, design patterns (service discovery, API gateway, circuit breaker, CQRS, service mesh).", resourceType: "ARTICLE" },
  { title: "Building Microservices: Designing Fine-Grained Systems (Sam Newman)", url: "https://learning.oreilly.com/library/view/building-microservices-2nd/9781492034018/", source: "O'Reilly", topics: "microservices,domain-driven-design,bounded-context,service-decomposition,coupling", difficulty: "INTERMEDIATE", description: "The definitive guide to microservices: modeling, splitting monoliths, communication patterns, deployment, testing, and organizational considerations.", resourceType: "BOOK_CHAPTER" },
  { title: "Monolith to Microservices (Sam Newman)", url: "https://learning.oreilly.com/library/view/monolith-to-microservices/9781492047834/", source: "O'Reilly", topics: "microservices,monolith-decomposition,strangler-fig,domain-driven-design", difficulty: "INTERMEDIATE", description: "Practical strategies for incrementally migrating from monolith to microservices using patterns like Strangler Fig, parallel run, and feature toggles.", resourceType: "BOOK_CHAPTER" },
  // ─── EVENT-DRIVEN & MESSAGE QUEUES ───────────────────────────
  { title: "Event-Driven Architecture Style (Fundamentals of SW Architecture, Ch. 15)", url: "https://learning.oreilly.com/library/view/fundamentals-of-software/9781098175511/", source: "O'Reilly", topics: "event-driven,message-queue,pub-sub,broker,mediator,async", difficulty: "INTERMEDIATE", description: "Event-driven architecture patterns: broker vs mediator topology, event payload design, error handling, preventing data loss, and request-reply processing.", resourceType: "BOOK_CHAPTER" },
  { title: "Scalable Event-Driven Processing with Kafka (Foundations of Scalable Systems, Ch. 14)", url: "https://learning.oreilly.com/library/view/foundations-of-scalable/9781098106058/", source: "O'Reilly", topics: "kafka,event-driven,message-queue,topics,partitions,consumer-groups", difficulty: "INTERMEDIATE", description: "Apache Kafka internals: topics, producers/consumers, partitioning for scalability, and replication for availability.", resourceType: "BOOK_CHAPTER" },
  { title: "Asynchronous Messaging Patterns (Foundations of Scalable Systems, Ch. 7)", url: "https://learning.oreilly.com/library/view/foundations-of-scalable/9781098106058/", source: "O'Reilly", topics: "messaging,rabbitmq,pub-sub,competing-consumers,exactly-once,poison-messages", difficulty: "INTERMEDIATE", description: "Messaging primitives, publish-subscribe, message persistence, competing consumers, exactly-once processing, and poison message handling.", resourceType: "BOOK_CHAPTER" },
  // ─── DISTRIBUTED SYSTEMS PATTERNS ────────────────────────────
  { title: "Designing Distributed Systems: Sidecar, Ambassador, Adapter Patterns", url: "https://learning.oreilly.com/library/view/designing-distributed-systems/9781098156350/", source: "O'Reilly", topics: "sidecar,ambassador,adapter,distributed-systems,kubernetes,containers", difficulty: "INTERMEDIATE", description: "Single-node patterns (sidecar, ambassador, adapter) and multi-node patterns (replicated services, sharded services, scatter/gather) for distributed systems.", resourceType: "BOOK_CHAPTER" },
  { title: "The Fallacies of Distributed Computing", url: "https://en.wikipedia.org/wiki/Fallacies_of_distributed_computing", source: "Blog", topics: "distributed-systems,network-reliability,latency,architecture-fundamentals", difficulty: "BEGINNER", description: "The 8 fallacies every system designer must understand: the network is reliable, latency is zero, bandwidth is infinite, etc.", resourceType: "ARTICLE" },
  { title: "Common Failure Patterns in Distributed Systems (Designing Distributed Systems, Ch. 16)", url: "https://learning.oreilly.com/library/view/designing-distributed-systems/9781098156350/", source: "O'Reilly", topics: "failure-patterns,thundering-herd,distributed-systems,resilience", difficulty: "ADVANCED", description: "Real-world failure patterns: thundering herd, absence of errors as errors, versioning errors, optional components myth, and processing obsolete work.", resourceType: "BOOK_CHAPTER" },
  // ─── ARCHITECTURE STYLES ─────────────────────────────────────
  { title: "Architecture Styles Overview (Fundamentals of SW Architecture)", url: "https://learning.oreilly.com/library/view/fundamentals-of-software/9781098175511/", source: "O'Reilly", topics: "layered-architecture,microkernel,service-based,event-driven,space-based,microservices", difficulty: "INTERMEDIATE", description: "Comprehensive survey of architecture styles: layered, modular monolith, pipeline, microkernel, service-based, event-driven, space-based, and microservices.", resourceType: "BOOK_CHAPTER" },
  { title: "Space-Based Architecture (Fundamentals of SW Architecture, Ch. 16)", url: "https://learning.oreilly.com/library/view/fundamentals-of-software/9781098175511/", source: "O'Reilly", topics: "space-based-architecture,in-memory-data-grid,data-pumps,high-scalability", difficulty: "ADVANCED", description: "Space-based architecture for extreme scalability: processing units, data grids, data pumps, and use cases like ticketing and auctions.", resourceType: "BOOK_CHAPTER" },
  // ─── SAGAS & DISTRIBUTED TRANSACTIONS ────────────────────────
  { title: "Transactional Sagas (Software Architecture: The Hard Parts, Ch. 12)", url: "https://learning.oreilly.com/library/view/software-architecture-the/9781492086888/", source: "O'Reilly", topics: "saga,distributed-transactions,compensating-actions,orchestration,choreography", difficulty: "ADVANCED", description: "Comprehensive coverage of saga patterns for distributed transactions: epic, phone tag, fairy tale, time travel, and anthology sagas with state machine management.", resourceType: "BOOK_CHAPTER" },
  { title: "Data Ownership & Distributed Transactions (Software Architecture: The Hard Parts, Ch. 9)", url: "https://learning.oreilly.com/library/view/software-architecture-the/9781492086888/", source: "O'Reilly", topics: "data-ownership,distributed-transactions,eventual-consistency,background-sync,event-based", difficulty: "ADVANCED", description: "Patterns for assigning data ownership (single, common, joint) and achieving eventual consistency across service boundaries.", resourceType: "BOOK_CHAPTER" },
  { title: "Workflow: Sagas vs Distributed Transactions (Building Microservices, Ch. 6)", url: "https://learning.oreilly.com/library/view/building-microservices-2nd/9781492034018/", source: "O'Reilly", topics: "saga,distributed-transactions,two-phase-commit,workflow,choreography,orchestration", difficulty: "INTERMEDIATE", description: "Practical guide to managing workflows across microservices: ACID transactions, distributed transactions (and why to avoid them), saga failure modes, and implementation strategies.", resourceType: "BOOK_CHAPTER" },
  // ─── DOMAIN-DRIVEN DESIGN ────────────────────────────────────
  { title: "Learning Domain-Driven Design (Vlad Khononov)", url: "https://learning.oreilly.com/library/view/learning-domain-driven-design/9781098100124/", source: "O'Reilly", topics: "domain-driven-design,bounded-context,aggregate,ubiquitous-language,strategic-design", difficulty: "INTERMEDIATE", description: "Practical introduction to DDD: strategic design, bounded contexts, aggregates, domain events, and how they relate to microservice boundaries.", resourceType: "BOOK_CHAPTER" },
  { title: "Data Mesh: Domain Ownership & Data as a Product", url: "https://learning.oreilly.com/library/view/data-mesh/9781492092391/", source: "O'Reilly", topics: "data-mesh,data-ownership,domain-driven-design,analytical-data,data-products", difficulty: "ADVANCED", description: "Data mesh principles: domain ownership of analytical data, data as a product, self-serve data platform, and federated computational governance.", resourceType: "BOOK_CHAPTER" },
  // ─── REST & API DESIGN ───────────────────────────────────────
  { title: "RESTful Architecture (SDE Roadmap)", url: "https://github.com/aasthas2022/SDE-Interview-and-Prep-Roadmap/blob/main/System%20Design/RESTfulArchitecture.md", source: "GitHub", topics: "rest,api-design,http-methods,status-codes,HATEOAS,versioning", difficulty: "BEGINNER", description: "Complete RESTful architecture guide: principles, HTTP methods, status codes, best practices, API versioning, idempotency, HATEOAS, and 75 interview questions.", resourceType: "ARTICLE" },
  { title: "API Design Patterns", url: "https://microservice-api-patterns.org/", source: "Documentation", topics: "api-design,rest,graphql,pagination,rate-limiting,versioning", difficulty: "INTERMEDIATE", description: "Catalog of API design patterns for microservice architectures: endpoint types, data transfer, quality, and evolution patterns.", resourceType: "DOCUMENTATION" },
  // ─── RATE LIMITING ───────────────────────────────────────────
  { title: "Rate Limiting Algorithms Explained with Code", url: "https://blog.bytebytego.com/p/rate-limiting-fundamentals", source: "Blog", topics: "rate-limiting,token-bucket,sliding-window,api-gateway", difficulty: "BEGINNER", description: "Visual walkthrough of rate limiting algorithms: token bucket, leaky bucket, fixed window, sliding window log, and sliding window counter.", resourceType: "ARTICLE" },
  // ─── URL SHORTENER & KEY GENERATION ──────────────────────────
  { title: "Designing a URL Shortener: Key Generation Strategies", url: "https://blog.bytebytego.com/p/how-to-design-a-url-shortener", source: "Blog", topics: "url-shortener,key-generation,base62,hashing,short-code", difficulty: "BEGINNER", description: "System design walkthrough for URL shorteners: base62 encoding, hash-based approaches, key generation services, and database choices.", resourceType: "ARTICLE" },
  // ─── REAL-TIME SYSTEMS ───────────────────────────────────────
  { title: "WebSocket vs Long Polling vs Server-Sent Events", url: "https://blog.bytebytego.com/p/websocket-vs-long-polling-vs-sse", source: "Blog", topics: "websocket,real-time,long-polling,server-sent-events,chat", difficulty: "BEGINNER", description: "Comparison of real-time communication protocols: when to use WebSocket vs long polling vs SSE, with use case examples.", resourceType: "ARTICLE" },
  // ─── GEOSPATIAL ──────────────────────────────────────────────
  { title: "Geospatial Indexing: Geohash, Quadtree, and S2", url: "https://blog.bytebytego.com/p/how-do-we-design-location-based-services", source: "Blog", topics: "geospatial,geohash,quadtree,s2-cells,location-based,proximity", difficulty: "INTERMEDIATE", description: "Comparison of geospatial indexing approaches for proximity search: geohash, quadtree, S2 cells, and how Uber/Google use them.", resourceType: "ARTICLE" },
  // ─── CDN & CONTENT DELIVERY ──────────────────────────────────
  { title: "How CDNs Work", url: "https://blog.bytebytego.com/p/how-does-a-cdn-work", source: "Blog", topics: "cdn,content-delivery,edge-caching,video-streaming,global-distribution", difficulty: "BEGINNER", description: "How CDNs work: push vs pull, edge caching, cache invalidation, and why CDNs are critical for global-scale applications.", resourceType: "ARTICLE" },
  // ─── SEARCH ──────────────────────────────────────────────────
  { title: "Elasticsearch: The Definitive Guide (Basics)", url: "https://www.elastic.co/guide/en/elasticsearch/reference/current/getting-started.html", source: "Documentation", topics: "search,elasticsearch,full-text-search,inverted-index,search-autocomplete", difficulty: "BEGINNER", description: "Official Elasticsearch getting-started guide: indexing documents, full-text search, aggregations, and inverted index fundamentals.", resourceType: "DOCUMENTATION" },
  // ─── NOTIFICATION SYSTEMS ────────────────────────────────────
  { title: "Designing a Notification System", url: "https://blog.bytebytego.com/p/design-a-notification-system", source: "Blog", topics: "notifications,push-notifications,email,sms,fan-out,message-queue", difficulty: "BEGINNER", description: "End-to-end design of notification systems: multi-channel delivery, preference management, retry logic, and rate limiting.", resourceType: "ARTICLE" },
  // ─── PAYMENT SYSTEMS ─────────────────────────────────────────
  { title: "Designing a Payment System", url: "https://blog.bytebytego.com/p/payment-system", source: "Blog", topics: "payments,idempotency,ledger,double-entry-bookkeeping,saga,reconciliation", difficulty: "INTERMEDIATE", description: "How payment systems work: payment intent lifecycle, idempotency keys, double-entry ledgers, and reconciliation with payment processors.", resourceType: "ARTICLE" },
  // ─── NEWS FEED ───────────────────────────────────────────────
  { title: "Designing a News Feed System", url: "https://blog.bytebytego.com/p/news-feed-system-design", source: "Blog", topics: "news-feed,fan-out,social-graph,feed-ranking,timeline", difficulty: "INTERMEDIATE", description: "Fan-out-on-write vs fan-out-on-read, hybrid approaches for celebrity users, feed ranking algorithms, and cache design.", resourceType: "ARTICLE" },
  // ─── SERVICE GRANULARITY & DECOMPOSITION ─────────────────────
  { title: "Service Granularity (Software Architecture: The Hard Parts, Ch. 7)", url: "https://learning.oreilly.com/library/view/software-architecture-the/9781492086888/", source: "O'Reilly", topics: "service-granularity,microservices,decomposition,coupling,cohesion", difficulty: "ADVANCED", description: "Framework for deciding service granularity: disintegrators (scope, volatility, scalability, fault tolerance) vs integrators (transactions, data relationships, shared code).", resourceType: "BOOK_CHAPTER" },
  { title: "Architectural Decomposition Patterns (Software Architecture: The Hard Parts, Ch. 4-5)", url: "https://learning.oreilly.com/library/view/software-architecture-the/9781492086888/", source: "O'Reilly", topics: "decomposition,component-based,tactical-forking,monolith-to-microservices", difficulty: "ADVANCED", description: "Systematic approach to decomposing monoliths: identify components, gather common domains, flatten, determine dependencies, and create domain services.", resourceType: "BOOK_CHAPTER" },
  // ─── RESILIENCE & FAULT TOLERANCE ────────────────────────────
  { title: "Resilience Patterns for Microservices", url: "https://learn.microsoft.com/en-us/azure/architecture/patterns/category/resiliency", source: "Documentation", topics: "circuit-breaker,bulkhead,retry,resilience,fault-tolerance,microservices", difficulty: "INTERMEDIATE", description: "Microsoft's catalog of resilience patterns: circuit breaker, bulkhead, retry, health endpoint monitoring, and compensating transactions.", resourceType: "DOCUMENTATION" },
  // ─── OBSERVABILITY ───────────────────────────────────────────
  { title: "Monitoring and Observability Patterns (Designing Distributed Systems, Ch. 14)", url: "https://learning.oreilly.com/library/view/designing-distributed-systems/9781098156350/", source: "O'Reilly", topics: "monitoring,observability,logging,metrics,tracing,alerting", difficulty: "INTERMEDIATE", description: "Observability fundamentals: logging, metrics, request monitoring, alerting, distributed tracing, and aggregating information from distributed systems.", resourceType: "BOOK_CHAPTER" },
  // ─── WEB CRAWLERS ────────────────────────────────────────────
  { title: "Designing a Web Crawler", url: "https://blog.bytebytego.com/p/design-a-web-crawler", source: "Blog", topics: "web-crawler,bloom-filter,url-frontier,politeness,deduplication", difficulty: "INTERMEDIATE", description: "Web crawler design: URL frontier with priority and politeness queues, Bloom filters for dedup, robots.txt handling, and content fingerprinting.", resourceType: "ARTICLE" },
  // ─── VIDEO STREAMING ─────────────────────────────────────────
  { title: "How Video Streaming Works (HLS/DASH)", url: "https://blog.bytebytego.com/p/how-does-live-streaming-work", source: "Blog", topics: "video-streaming,hls,dash,adaptive-bitrate,transcoding,cdn", difficulty: "INTERMEDIATE", description: "How video streaming works: transcoding pipelines, adaptive bitrate streaming (HLS/DASH), CDN delivery, and live vs on-demand architectures.", resourceType: "ARTICLE" },
  // ─── DISTRIBUTED CONSENSUS ───────────────────────────────────
  { title: "Understanding Raft Consensus", url: "https://raft.github.io/", source: "Documentation", topics: "raft,consensus,leader-election,distributed-consensus,replication", difficulty: "ADVANCED", description: "Interactive visualization and explanation of the Raft consensus algorithm: leader election, log replication, and safety guarantees.", resourceType: "DOCUMENTATION" },
  // ─── SYSTEM DESIGN INTERVIEW META ────────────────────────────
  { title: "SDE Interview Preparation Roadmap", url: "https://github.com/aasthas2022/SDE-Interview-and-Prep-Roadmap", source: "GitHub", topics: "interview-prep,system-design,data-structures,algorithms,databases,networking", difficulty: "BEGINNER", description: "Comprehensive checklist covering data structures, algorithms, system design, OS, networking, databases, and behavioral skills for SDE interview preparation.", resourceType: "ARTICLE" },
  { title: "System Design Interview Framework", url: "https://blog.bytebytego.com/p/a-framework-for-system-design-interviews", source: "Blog", topics: "interview-prep,system-design,requirements,api-design,high-level-design,deep-dives", difficulty: "BEGINNER", description: "Step-by-step framework for system design interviews: requirements gathering, API design, high-level architecture, and deep dive strategies.", resourceType: "ARTICLE" },
];

async function main() {
  console.log("Seeding database...");

  for (const problem of problems) {
    await prisma.problem.upsert({
      where: { slug: problem.slug },
      update: problem,
      create: problem,
    });
    console.log(`  ✓ ${problem.title} (${problem.difficulty})`);
  }

  console.log(`\nSeeded ${problems.length} problems.`);

  // Seed study resources (clear and re-create for idempotent seeding)
  console.log("\nSeeding study resources...");
  await prisma.studyResource.deleteMany();
  await prisma.studyResource.createMany({ data: studyResources });
  console.log(`  ✓ Seeded ${studyResources.length} study resources.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
