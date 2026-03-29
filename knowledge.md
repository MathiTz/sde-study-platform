# System Design Knowledge Base

## 8-Week Study Plan (DesignGurus)

### Week 1: Building Blocks
- Client-Server Model
- Databases (SQL vs NoSQL)
- APIs (REST, GraphQL)
- Networking basics (DNS, HTTP, TCP/IP)
- Back-of-envelope calculations

### Week 2: Scalability & Performance
- Vertical vs Horizontal Scaling
- Load Balancing (L4 vs L7)
- Caching (Redis, Memcached)
- CDNs (CloudFront, Cloudflare)
- Connection Pooling

### Week 3: Data Storage Deep Dive
- SQL vs NoSQL trade-offs
- Database Indexing (B-trees, hash indexes)
- Replication (master-slave, multi-master)
- Sharding strategies
- Partition keys

### Week 4: Communication Patterns
- Synchronous vs Asynchronous
- Message Queues (Kafka, SQS, RabbitMQ)
- Pub/Sub systems
- gRPC
- Webhooks

### Week 5: Advanced Patterns
- Real-time Updates (WebSockets, SSE, Polling)
- Long-Running Tasks (async workers, job queues)
- Large File Handling (presigned URLs, multipart upload)
- CDN integration

### Week 6: Consistency & Reliability
- CAP Theorem
- ACID vs BASE
- Consensus algorithms (Raft, Paxos)
- Replication lag and eventual consistency
- Conflict resolution

### Week 7: The 7 SD Interview Patterns (Lucas Faria)
1. **Scaling Reads** - indices → read replicas → cache → CDN
2. **Scaling Writes** - sharding → queues → batching → aggregation
3. **Long-Running Tasks** - async workers → heartbeat → retries → DLQ
4. **Real-time Updates** - polling → SSE → WebSockets → pub/sub
5. **Large Files** - presigned URLs → multipart → S3 events
6. **Contention** - pessimistic locking → OCC → reservations
7. **Multi-step Processes** - saga pattern → workflow engines

### Week 8: Interview Mastery
- Requirements gathering (who, where, what, when, why)
- Trade-off discussions
- Pushback handling
- Whiteboard communication
- Mock interviews

## Key Concepts Summary

### Scaling Reads
```
Optimize DB (indices + pooling) → Read Replicas → Cache (Redis) → CDN
```

### Scaling Writes
```
Sharding by partition key → Queues (buffer) → Batching → Aggregation hierarchy
```

### Real-time Patterns
```
Polling → Long Polling → SSE → WebSockets + Pub/Sub
```

### Contention Solutions
```
Pessimistic Locking → Optimistic OCC → Reservations (TTL)
```

## Question Types in App
- `SINGLE` - Single correct answer (radio buttons)
- `MULTIPLE` - Multiple correct answers (checkboxes)
- `ABSTRACT` - Written explanation (AI evaluated)
- `DRAWING` - Excalidraw diagram (AI evaluated)

## Scoring
- Multiple/Single: Correct/Incorrect (0 or 100%)
- Abstract/Drawing: AI evaluation (0-100%, pass threshold 60%)

## Common Mistakes to Avoid
1. Starting with architecture before requirements
2. Ignoring back-of-envelope calculations
3. Not considering the user
4. Adding complexity prematurely
5. Not verbalizing reasoning
6. Defensive pushback behavior
