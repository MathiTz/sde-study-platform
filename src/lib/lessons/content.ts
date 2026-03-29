export { clientServerContent } from "./client-server";
export { databasesContent } from "./databases";
export { cachingContent } from "./caching";

export const lessonContent: Record<string, string> = {
  "client-server": "",
  "databases": "",
  "caching": "",
  
  "load-balancing": `## Load Balancing

Load balancers distribute incoming traffic across multiple servers to ensure no single server becomes overwhelmed, improving availability and scalability.

### Load Balancing Algorithms

**Round Robin** - Distributes requests sequentially. Simple but doesn't account for server capacity differences.

\`\`\`
Request 1  →  Server A
Request 2  →  Server B
Request 3  →  Server C
Request 4  →  Server A (repeat)
\`\`\`

**Least Connections** - Routes to the server with fewest active connections. Better for varying request durations.

\`\`\`
Server A: 5 active connections
Server B: 2 active connections  ← Next request goes here
Server C: 8 active connections
\`\`\`

**IP Hash** - Hashes client IP to determine server. Ensures same client returns to same server (useful for sessions).

\`\`\`javascript
// IP Hash implementation
function getServerByIPHash(clientIP, servers) {
  const hash = simpleHash(clientIP);
  const index = hash % servers.length;
  return servers[index];
}

// With weights for capacity
function weightedRoundRobin(servers, weights) {
  let currentIndex = 0;
  let currentWeight = 0;
  
  return function getNextServer() {
    let maxWeight = 0;
    let selectedServer = null;
    
    for (let i = 0; i < servers.length; i++) {
      const effectiveWeight = weights[i] + (i === currentIndex ? currentWeight : 0);
      if (effectiveWeight > maxWeight) {
        maxWeight = effectiveWeight;
        selectedServer = servers[i];
        currentIndex = i;
      }
    }
    
    currentWeight = maxWeight - weights[currentIndex];
    return selectedServer;
  };
}
\`\`\`

### Layer 4 vs Layer 7 Load Balancing

**Layer 4 (TCP/UDP)** - Faster, makes routing decisions based on IP and port only.

\`\`\`
Client → [LB Layer 4] → Server A (port 8080)
                      → Server B (port 8080)
                      → Server C (port 8080)
\`\`\`

**Layer 7 (HTTP/HTTPS)** - Smarter, can inspect application layer data for routing decisions.

\`\`\`javascript
// Layer 7 routing based on URL path
// nginx configuration
upstream api_servers {
  server 10.0.0.1:8080;
  server 10.0.0.2:8080;
}

upstream static_servers {
  server 10.0.0.3:80;
  server 10.0.0.4:80;
}

server {
  location /api/ {
    proxy_pass http://api_servers;
  }
  
  location /static/ {
    proxy_pass http://static_servers;
  }
}
\`\`\`

### Health Checks

Load balancers monitor server health and remove unhealthy servers.

\`\`\`yaml
# Nginx health check configuration
upstream backend {
  server 10.0.0.1:8080;
  server 10.0.0.2:8080;
  server 10.0.0.3:8080;
}

server {
  location / {
    proxy_pass http://backend;
    
    # Passive health check
    proxy_next_upstream error timeout http_500 http_502 http_503;
    
    # Active health check (nginx plus)
    health_check interval=5 fails=3 passes=2 uri=/health;
  }
  
  location /health {
    return 200 'OK';
    add_header Content-Type text/plain;
  }
}
\`\`\`

\`\`\`javascript
// Application health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await db.query('SELECT 1');
    
    // Check Redis connection
    await redis.ping();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: 'ok',
        redis: 'ok'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
\`\`\`

### Session Affinity (Sticky Sessions)

Some applications require users to return to the same server.

\`\`\`javascript
// Cookie-based session affinity
app.use(session({
  cookie: {
    name: 'session_id',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  store: new RedisStore({
    client: redis,
    prefix: 'session:'
  })
}));

// nginx sticky cookie
// sticky cookie JSESSIONID uid expires=1h domain=example.com;
\`\`\`

### Consistent Hashing

Minimizes redistribution when servers are added or removed.

\`\`\`javascript
class ConsistentHash {
  constructor(nodes = [], virtualNodes = 150) {
    this.ring = new Map();
    this.sortedKeys = [];
    
    for (const node of nodes) {
      this.addNode(node, virtualNodes);
    }
  }

  // Hash function for ring positioning
  hash(key) {
    return Math.abs(
      key.split('').reduce((hash, char) => {
        return ((hash << 5) - hash) + char.charCodeAt(0);
      }, 0)
    );
  }

  addNode(node, virtualNodes = 150) {
    for (let i = 0; i < virtualNodes; i++) {
      const key = this.hash(node + ':' + i);
      this.ring.set(key, node);
    }
    this.sortedKeys = [...this.ring.keys()].sort((a, b) => a - b);
  }

  removeNode(node, virtualNodes = 150) {
    for (let i = 0; i < virtualNodes; i++) {
      const key = this.hash(node + ':' + i);
      this.ring.delete(key);
    }
    this.sortedKeys = [...this.ring.keys()].sort((a, b) => a - b);
  }

  getNode(key) {
    if (this.ring.size === 0) {
      return null;
    }
    
    const hash = this.hash(key);
    
    // Binary search for the first node >= hash
    let left = 0;
    let right = this.sortedKeys.length - 1;
    
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (this.sortedKeys[mid] < hash) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }
    
    const index = left === this.sortedKeys.length ? 0 : left;
    return this.ring.get(this.sortedKeys[index]);
  }
}

// Usage
const ring = new ConsistentHash(['server1', 'server2', 'server3']);
console.log(ring.getNode('user:123')); // Always returns same server for same user
\`\`\`

### Scaling Considerations

| Challenge | Solution |
|-----------|----------|
| Session state | Store in Redis, not server memory |
| Local cache | Use distributed cache (Redis) |
| File uploads | Store in shared storage (S3) |
| WebSocket connections | Use sticky sessions or Redis adapter |`,

  "messaging-queues": `## Message Queues & Async Communication

Message queues enable asynchronous processing, decoupling producers from consumers. This is fundamental for building scalable, resilient systems.

### Why Asynchronous Communication?

\`\`\`
Synchronous (Blocking):
Client → Server → Database → Response
         (waits for each step)

Asynchronous (Non-Blocking):
Client → Queue → Worker → Database
         (immediate response)
\`\`\`

Benefits:
- **Decoupling**: Producers and consumers operate independently
- **Resilience**: Failed workers can retry without affecting producers
- **Scalability**: Workers can scale independently based on queue depth
- **Load Leveling**: Handle traffic spikes without overwhelming services

### Amazon SQS (Simple Queue Service)

Point-to-point messaging. Messages are consumed by exactly one consumer.

\`\`\`javascript
const { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs');

const sqs = new SQSClient({ region: 'us-east-1' });

// Producer: Send message to queue
async function sendOrder(orderData) {
  const command = new SendMessageCommand({
    QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/orders',
    MessageBody: JSON.stringify({
      orderId: orderData.id,
      userId: orderData.userId,
      items: orderData.items,
      total: orderData.total,
      timestamp: Date.now()
    }),
    DelaySeconds: 0,
    MessageAttributes: {
      Priority: {
        DataType: 'String',
        StringValue: orderData.urgent ? 'high' : 'normal'
      }
    }
  });
  
  const response = await sqs.send(command);
  return response.MessageId;
}

// Consumer: Process messages from queue
async function processOrders() {
  while (true) {
    const receiveCommand = new ReceiveMessageCommand({
      QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/orders',
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 20,
      VisibilityTimeout: 30
    });
    
    const { Messages } = await sqs.send(receiveCommand);
    
    if (!Messages || Messages.length === 0) {
      continue;
    }
    
    for (const message of Messages) {
      try {
        const order = JSON.parse(message.Body);
        await processOrder(order);
        
        // Delete message after successful processing
        await sqs.send(new DeleteMessageCommand({
          QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/orders',
          ReceiptHandle: message.ReceiptHandle
        }));
      } catch (error) {
        console.error('Failed to process message:', error);
        // Message will become visible again after VisibilityTimeout
      }
    }
  }
}
\`\`\`

### Apache Kafka

Pub/sub messaging with message retention. Multiple consumer groups can consume the same messages independently.

\`\`\`javascript
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'order-service',
  brokers: ['kafka1:9092', 'kafka2:9092', 'kafka3:9092'],
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});

// Producer
const producer = kafka.producer({
  allowAutoTopicCreation: true,
  transactionTimeout: 30000
});

async function sendOrderEvent(order) {
  await producer.connect();
  
  await producer.send({
    topic: 'order-events',
    messages: [
      {
        key: order.userId,  // Partition by user ID
        value: JSON.stringify({
          type: 'ORDER_CREATED',
          data: order,
          timestamp: Date.now()
        }),
        headers: {
          'correlation-id': generateUUID()
        }
      }
    ]
  });
}

// Consumer
const consumer = kafka.consumer({ 
  groupId: 'order-processor-group',
  sessionTimeout: 30000,
  heartbeatInterval: 3000
});

async function consumeOrderEvents() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'order-events', fromBeginning: false });
  
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const { type, data } = JSON.parse(message.value.toString());
      
      switch (type) {
        case 'ORDER_CREATED':
          await handleOrderCreated(data);
          break;
        case 'ORDER_CANCELLED':
          await handleOrderCancelled(data);
          break;
      }
    }
  });
}

// Exactly-once semantics with transactions
async function sendOrderWithIdempotency(order) {
  const transaction = await kafka.transaction();
  
  try {
    await transaction.send({
      topic: 'order-events',
      messages: [{
        key: order.id,
        value: JSON.stringify({ type: 'ORDER_CREATED', data: order })
      }]
    });
    
    await transaction.send({
      topic: 'inventory-events',
      messages: [{
        key: order.id,
        value: JSON.stringify({ type: 'RESERVE_INVENTORY', orderId: order.id })
      }]
    });
    
    await transaction.commit();
  } catch (error) {
    await transaction.abort();
    throw error;
  }
}
\`\`\`

### SQS vs Kafka Comparison

| Feature | SQS | Kafka |
|---------|-----|-------|
| Message Retention | Up to 14 days | Infinite (configurable) |
| Replay Messages | No | Yes |
| Ordering | Per message | Per partition |
| Throughput | Up to ~10K msg/s | Up to ~1M msg/s |
| Latency | ~100ms | ~5ms |
| Pricing | Per request + data transfer | Per TB + brokers |
| Use Case | Task queues, workflows | Event streaming, CDC |

### Dead Letter Queue Pattern

Handle failed messages gracefully without losing them.

\`\`\`javascript
async function processWithDLQ(message, attemptCount = 0) {
  const MAX_RETRIES = 3;
  
  try {
    const data = JSON.parse(message.Body);
    await processMessage(data);
    
    // Success - delete from main queue
    await sqs.deleteMessage({
      QueueUrl: MAIN_QUEUE_URL,
      ReceiptHandle: message.ReceiptHandle
    });
    
  } catch (error) {
    console.error('Processing failed:', error);
    
    if (attemptCount < MAX_RETRIES - 1) {
      // Retry with exponential backoff
      const delaySeconds = Math.pow(2, attemptCount) * 10;
      
      // Re-queue with delay
      await sqs.sendMessage({
        QueueUrl: MAIN_QUEUE_URL,
        MessageBody: message.Body,
        DelaySeconds: delaySeconds
      });
      
      // Delete original
      await sqs.deleteMessage({
        QueueUrl: MAIN_QUEUE_URL,
        ReceiptHandle: message.ReceiptHandle
      });
      
    } else {
      // Max retries exceeded - send to DLQ
      await sqs.sendMessage({
        QueueUrl: DLQ_URL,
        MessageBody: JSON.stringify({
          originalMessage: message.Body,
          error: error.message,
          failedAt: new Date().toISOString(),
          attemptCount: attemptCount + 1
        })
      });
      
      // Delete from main queue
      await sqs.deleteMessage({
        QueueUrl: MAIN_QUEUE_URL,
        ReceiptHandle: message.ReceiptHandle
      });
    }
  }
}
\`\`\`

### Saga Pattern for Distributed Transactions

Coordinate multi-step processes across services.

\`\`\`javascript
// Order Saga Implementation
class OrderSaga {
  async execute(orderData) {
    const saga = {
      orderId: generateUUID(),
      steps: [],
      status: 'pending'
    };
    
    try {
      // Step 1: Reserve inventory
      await this.reserveInventory(saga.orderId, orderData.items);
      saga.steps.push({ name: 'reserve_inventory', status: 'completed' });
      
      // Step 2: Process payment
      await this.processPayment(saga.orderId, orderData.payment);
      saga.steps.push({ name: 'process_payment', status: 'completed' });
      
      // Step 3: Create order
      await this.createOrder(saga.orderId, orderData);
      saga.steps.push({ name: 'create_order', status: 'completed' });
      
      saga.status = 'completed';
      return saga;
      
    } catch (error) {
      // Compensating transactions
      await this.compensate(saga);
      saga.status = 'failed';
      saga.error = error.message;
      return saga;
    }
  }
  
  async compensate(saga) {
    // Run compensating transactions in reverse order
    for (const step of saga.steps.reverse()) {
      if (step.name === 'reserve_inventory') {
        await this.releaseInventory(saga.orderId);
      }
      if (step.name === 'process_payment') {
        await this.refundPayment(saga.orderId);
      }
    }
  }
}
\`\`\``,

  "real-time": `## Real-Time Communication

Real-time features require persistent connections between client and server. Understanding when and how to use WebSockets vs Server-Sent Events is crucial.

### WebSocket vs Server-Sent Events

**WebSocket** - Full-duplex, bidirectional communication. Client and server can send messages anytime.

**Server-Sent Events (SSE)** - Unidirectional, server-to-client streaming. Simpler but limited to server-initiated messages.

\`\`\`
WebSocket:
Client ↔ Server (both can initiate)

SSE:
Client ← Server (only server can initiate)
\`\`\`

### When to Use Each

| Feature | WebSocket | SSE |
|---------|-----------|-----|
| Bidirectional | Yes | No |
| Simple implementation | No | Yes |
| HTTP/2 multiplexing | No | Yes |
| Firewall/NAT friendly | No | Yes |
| Automatic reconnection | Manual | Built-in |
| Real-time chat | Yes | No |
| Live notifications | Yes | Yes |
| Stock prices | Yes | Yes |
| Gaming | Yes | No |

### WebSocket Implementation

\`\`\`javascript
// Server with Socket.io
const { Server } = require('socket.io');

const io = new Server(3000, {
  cors: {
    origin: ['https://example.com'],
    methods: ['GET', 'POST']
  }
});

// Authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (verifyToken(token)) {
    next();
  } else {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.user.id;
  
  // Join user-specific room
  socket.join('user:' + userId);
  
  // Join conversation rooms
  socket.on('join:conversation', (conversationId) => {
    socket.join('conversation:' + conversationId);
  });
  
  // Send message
  socket.on('message:send', async ({ conversationId, content }) => {
    const message = await saveMessage({
      conversationId,
      userId,
      content,
      timestamp: Date.now()
    });
    
    // Broadcast to all in conversation
    io.to('conversation:' + conversationId).emit('message:new', message);
  });
  
  // Typing indicator
  socket.on('typing:start', ({ conversationId }) => {
    socket.to('conversation:' + conversationId).emit('typing:update', {
      userId,
      isTyping: true
    });
  });
  
  // Disconnect handling
  socket.on('disconnect', () => {
    console.log('User disconnected:', userId);
  });
});

// Client
import { io } from 'socket.io-client';

const socket = io('wss://api.example.com', {
  auth: { token: userToken },
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

socket.on('connect', () => {
  console.log('Connected to socket server');
});

socket.on('message:new', (message) => {
  appendMessageToChat(message);
});

socket.on('typing:update', ({ userId, isTyping }) => {
  updateTypingIndicator(userId, isTyping);
});
\`\`\`

### Server-Sent Events Implementation

\`\`\`javascript
// Server endpoint
app.get('/api/notifications/stream', (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Send initial connection message
  res.write('event: connected\\n');
  res.write('data: {"status": "connected"}\\n\\n');
  
  // Keep connection alive with heartbeat
  const keepAlive = setInterval(() => {
    res.write(': keepalive\\n\\n');
  }, 30000);
  
  // Subscribe to notifications
  const unsubscribe = notificationService.subscribe(userId, (notification) => {
    res.write('event: notification\\n');
    res.write('data: ' + JSON.stringify(notification) + '\\n\\n');
  });
  
  // Cleanup on close
  req.on('close', () => {
    clearInterval(keepAlive);
    unsubscribe();
  });
});

// Client with EventSource API
function connectToNotifications() {
  const eventSource = new EventSource('/api/notifications/stream');
  
  eventSource.addEventListener('connected', (event) => {
    console.log('Connected to notification stream');
  });
  
  eventSource.addEventListener('notification', (event) => {
    const notification = JSON.parse(event.data);
    showNotification(notification);
  });
  
  eventSource.onerror = (error) => {
    console.error('SSE Error:', error);
    
    if (eventSource.readyState === EventSource.CLOSED) {
      // Reconnect after delay
      setTimeout(connectToNotifications, 5000);
    }
  };
}
\`\`\`

### Scaling WebSockets

\`\`\`javascript
// Redis Adapter for Socket.io
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
  console.log('Socket.io Redis adapter connected');
});

// Now socket.to(room).emit works across multiple servers
io.on('connection', (socket) => {
  socket.on('private:message', ({ toUserId, message }) => {
    // Send to specific user regardless of which server they're connected to
    io.to('user:' + toUserId).emit('message:received', {
      from: socket.user.id,
      message
    });
  });
});

// Horizontal scaling architecture
//                        → Server 1 → Socket 1
// Client → Load Balancer → Server 2 → Socket 2
//                        → Server 3 → Socket 3
// (All connected via Redis for message routing)
\`\`\`

### Presence and Status

\`\`\`javascript
// Presence tracking with Redis
class PresenceService {
  constructor(redis) {
    this.redis = redis;
  }
  
  async setUserOnline(userId) {
    const now = Date.now();
    await this.redis.hset('presence:online', userId, now);
    await this.redis.setex('presence:heartbeat:' + userId, 60, now);
    
    // Publish presence update
    await this.redis.publish('presence:updates', JSON.stringify({
      userId,
      status: 'online',
      timestamp: now
    }));
  }
  
  async setUserOffline(userId) {
    await this.redis.hdel('presence:online', userId);
    await this.redis.del('presence:heartbeat:' + userId);
    
    await this.redis.publish('presence:updates', JSON.stringify({
      userId,
      status: 'offline',
      timestamp: Date.now()
    }));
  }
  
  async getOnlineUsers() {
    return this.redis.hgetall('presence:online');
  }
  
  async isUserOnline(userId) {
    const exists = await this.redis.hexists('presence:online', userId);
    return exists === 1;
  }
}

// Heartbeat to detect stale connections
setInterval(async () => {
  const keys = await redis.keys('presence:heartbeat:*');
  const cutoff = Date.now() - 90000; // 90 seconds
  
  for (const key of keys) {
    const lastHeartbeat = await redis.get(key);
    if (parseInt(lastHeartbeat) < cutoff) {
      const userId = key.split(':')[2];
      await presenceService.setUserOffline(userId);
    }
  }
}, 30000);
\`\`\``,

  "cap-theorem": `## CAP Theorem & Consistency

The CAP theorem states that a distributed system can only guarantee two of three properties simultaneously. Understanding these trade-offs is essential for system design.

### The Three Properties

| Property | Description |
|----------|-------------|
| Consistency | All nodes see the same data at the same time |
| Availability | Every request receives a response |
| Partition Tolerance | System continues despite network partitions |

Since network partitions will happen, you must choose between **Consistency** and **Availability**.

\`\`\`
        CAP
         |
   ┌─────┴─────┐
   │           │
   C       A
   │           │
   └─────┬─────┘
         │
         P
   (Always Required)
\`\`\`

### CP Systems (Consistency + Partition Tolerance)

When a partition occurs, the system refuses to respond rather than risk returning stale data.

\`\`\`javascript
// MongoDB Replica Set with Strong Consistency
const mongoose = require('mongoose');

mongoose.connect('mongodb://primary:27017,replica1:27017,replica2:27017/db', {
  replicaSet: 'rs0',
  readPreference: 'primary',         // Always read from primary
  writeConcern: { w: 'majority' },   // Wait for majority acknowledgment
  readConcern: { level: 'majority' } // Strong consistency
});

// Cassandra with quorum
const cassandra = require('cassandra-driver');
const client = new cassandra.Client({
  contactPoints: ['cassandra1', 'cassandra2', 'cassandra3'],
  localDataCenter: 'dc1'
});

// Strong consistency with quorum
async function writeWithQuorum(query, params) {
  await client.execute(query, params, { 
    consistency: cassandra.types.consistencies.quorum 
  });
}

// Cassandra: SELECT with quorum consistency
const result = await client.execute(
  'SELECT * FROM users WHERE id = ?',
  [userId],
  { consistency: cassandra.types.consistencies.quorum }
);
\`\`\`

### AP Systems (Availability + Partition Tolerance)

When a partition occurs, the system continues to respond but may return stale data.

\`\`\`javascript
// DynamoDB with eventual consistency (default)
const dynamodb = new AWS.DynamoDB.DocumentClient();

const params = {
  TableName: 'Users',
  Key: { id: userId }
};

// Eventually consistent read (default, faster, higher throughput)
const user = await dynamodb.get(params).promise();

// Strongly consistent read (slower, lower throughput)
const stronglyConsistentParams = {
  TableName: 'Users',
  Key: { id: userId },
  ConsistentRead: true
};
const userStrong = await dynamodb.get(stronglyConsistentParams).promise();

// Cassandra - always available, can become eventually consistent
const result = await client.execute(
  'SELECT * FROM users WHERE id = ?',
  [userId],
  { consistency: cassandra.types.consistencies.one } // Local quorum
);
\`\`\`

### PACELC Model

Even without partitions, there's a trade-off between latency and consistency.

| System | If Partition | Else (Normal) |
|--------|--------------|---------------|
| Cassandra | Available + Low Latency | Eventual Consistency + Low Latency |
| HBase | Consistent | Strong Consistency + Higher Latency |
| DynamoDB | Available | You Choose |
| MongoDB | Consistent | Strong Consistency |
| Kafka | Available | Strong Ordering |

\`\`\`javascript
// DynamoDB: Choosing your consistency model
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Use eventually consistent reads for high performance
const highPerformanceParams = {
  TableName: 'ProductCatalog',
  Key: { id: 'product-123' }
};
// ~10ms latency, higher throughput

// Use strongly consistent reads for critical operations
const criticalParams = {
  TableName: 'AccountBalance',
  Key: { id: 'account-123' },
  ConsistentRead: true
};
// ~20ms latency, lower throughput

// Use transactions for ACID guarantees
const transactionParams = {
  TransactItems: [
    {
      Update: {
        TableName: 'Accounts',
        Key: { id: 'account-123' },
        UpdateExpression: 'SET balance = balance - :amount',
        ConditionExpression: 'balance >= :amount',
        ExpressionAttributeValues: { ':amount': 100 }
      }
    },
    {
      Update: {
        TableName: 'Accounts',
        Key: { id: 'account-456' },
        UpdateExpression: 'SET balance = balance + :amount',
        ExpressionAttributeValues: { ':amount': 100 }
      }
    }
  ]
};
await dynamodb.transactWrite(transactionParams).promise();
\`\`\`

### Eventual Consistency Implementation

\`\`\`javascript
// Vector Clocks for Tracking Causality
class VectorClock {
  constructor(nodeId) {
    this.nodeId = nodeId;
    this.clock = { [nodeId]: 0 };
  }
  
  increment() {
    this.clock[this.nodeId]++;
    return this;
  }
  
  merge(other) {
    const merged = { ...this.clock };
    for (const [node, time] of Object.entries(other.clock)) {
      merged[node] = Math.max(merged[node] || 0, time);
    }
    return merged;
  }
  
  compare(other) {
    const merged = this.merge(other);
    let dominates = false;
    let dominated = false;
    
    for (const node of new Set([...Object.keys(this.clock), ...Object.keys(other.clock)])) {
      const thisTime = merged[node] - (this.clock[node] || 0);
      const otherTime = merged[node] - (other.clock[node] || 0);
      
      if (thisTime > 0) dominates = true;
      if (otherTime > 0) dominated = true;
    }
    
    if (dominates && !dominated) return 'AFTER';
    if (dominated && !dominates) return 'BEFORE';
    if (!dominates && !dominated) return 'EQUAL';
    return 'CONCURRENT';
  }
}

// Last-Writer-Wins Conflict Resolution
class LWWRegister {
  constructor() {
    this.store = new Map();
  }
  
  set(key, value, timestamp = Date.now()) {
    const existing = this.store.get(key);
    if (!existing || timestamp > existing.timestamp) {
      this.store.set(key, { value, timestamp });
      return true;
    }
    return false;
  }
  
  get(key) {
    return this.store.get(key)?.value;
  }
}
\`\`\`

### Consistency Patterns in Practice

| Pattern | Description | Use Case |
|---------|-------------|----------|
| Strong | All reads see most recent write | Financial transactions |
| Sequential | All clients see writes in order | Event sourcing |
| Causal | Dependent writes are ordered | Social interactions |
| Eventual | Writes propagate async | Most web apps |
| Read-your-writes | Client sees own writes | User profiles |

\`\`\`javascript
// Read-your-writes consistency
class SessionConsistency {
  async updateUser(userId, updates) {
    // Write to primary (synchronous)
    await db.users.update(userId, updates);
    
    // Invalidate local cache immediately
    await redis.del('user:' + userId);
    
    // Force next read from primary for this user
    await redis.setex('user:primary-read:' + userId, 60, '1');
    
    return { success: true };
  }
  
  async getUser(userId) {
    // Check if we should force primary read
    const forcePrimary = await redis.get('user:primary-read:' + userId);
    
    if (forcePrimary) {
      // Read from primary
      const user = await db.users.findById(userId);
      await redis.setex('user:' + userId, 3600, JSON.stringify(user));
      return user;
    }
    
    // Normal: try cache first
    const cached = await redis.get('user:' + userId);
    if (cached) return JSON.parse(cached);
    
    const user = await db.replica.users.findById(userId);
    await redis.setex('user:' + userId, 3600, JSON.stringify(user));
    return user;
  }
}
\`\`\``,

  "file-upload": `## File Upload & Storage

Handling file uploads efficiently is crucial for scalability. Direct-to-cloud uploads save bandwidth and processing resources.

### Presigned URL Pattern

The most efficient approach: client uploads directly to cloud storage, bypassing your application servers.

\`\`\`javascript
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3 = new S3Client({ region: 'us-east-1' });

// Generate presigned URL for upload
async function generateUploadUrl(userId, filename, contentType) {
  const key = 'uploads/' + userId + '/' + Date.now() + '-' + filename;
  
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ContentType: contentType
  });
  
  const uploadUrl = await getSignedUrl(s3, command, { 
    expiresIn: 3600 // 1 hour
  });
  
  return {
    uploadUrl,
    key,
    expiresIn: 3600
  };
}

// Generate presigned URL for download/viewing
async function generateDownloadUrl(key) {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key
  });
  
  return getSignedUrl(s3, command, { 
    expiresIn: 3600 // 1 hour
  });
}

// API endpoint to get upload URL
app.post('/api/upload-url', async (req, res) => {
  const { filename, contentType, size } = req.body;
  
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowedTypes.includes(contentType)) {
    return res.status(400).json({ error: 'Invalid file type' });
  }
  
  // Validate file size (e.g., 10MB max)
  if (size > 10 * 1024 * 1024) {
    return res.status(400).json({ error: 'File too large' });
  }
  
  const { uploadUrl, key } = await generateUploadUrl(
    req.user.id,
    filename,
    contentType
  );
  
  res.json({ uploadUrl, key });
});
\`\`\`

### Client-Side Upload Implementation

\`\`\`javascript
// Client-side upload with progress tracking
async function uploadFile(file, onProgress) {
  // Get presigned URL from server
  const { uploadUrl, key } = await fetch('/api/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      size: file.size
    })
  }).then(r => r.json());
  
  // Upload directly to S3 with progress
  const xhr = new XMLHttpRequest();
  
  return new Promise((resolve, reject) => {
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = (e.loaded / e.total) * 100;
        onProgress(percent);
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ key, url: '/api/files/' + key });
      } else {
        reject(new Error('Upload failed'));
      }
    });
    
    xhr.addEventListener('error', () => reject(new Error('Network error')));
    
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

// Modern browsers: use fetch with ReadableStream for progress
async function uploadWithProgress(file, onProgress) {
  const { uploadUrl, key } = await getUploadUrl(file);
  
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type }
  });
  
  if (response.ok) {
    return { key };
  }
  throw new Error('Upload failed');
}
\`\`\`

### Multipart Upload for Large Files

For files over 100MB, use multipart uploads for reliability and speed.

\`\`\`javascript
const { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3 = new S3Client({});

// Initiate multipart upload
async function startMultipartUpload(key, contentType) {
  const command = new CreateMultipartUploadCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ContentType: contentType
  });
  
  const response = await s3.send(command);
  return response.UploadId;
}

// Generate presigned URLs for each part
async function getPartUploadUrls(key, uploadId, totalParts) {
  const urls = [];
  
  for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
    const command = new UploadPartCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber
    });
    
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    urls.push({ partNumber, url });
  }
  
  return urls;
}

// Complete multipart upload
async function completeMultipartUpload(key, uploadId, parts) {
  const command = new CompleteMultipartUploadCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: parts.map(p => ({
        PartNumber: p.partNumber,
        ETag: p.etag
      }))
    }
  });
  
  return s3.send(command);
}

// Client-side multipart upload
async function multipartUpload(file, onProgress) {
  const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB
  const totalParts = Math.ceil(file.size / CHUNK_SIZE);
  
  // Start upload
  const key = 'uploads/' + Date.now() + '-' + file.name;
  const uploadId = await startMultipartUpload(key, file.type);
  
  try {
    // Get upload URLs for each part
    const partUrls = await getPartUploadUrls(key, uploadId, totalParts);
    
    // Upload parts in parallel
    const uploadedParts = [];
    for (let i = 0; i < totalParts; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);
      
      const response = await fetch(partUrls[i].url, {
        method: 'PUT',
        body: chunk
      });
      
      const etag = response.headers.get('ETag');
      uploadedParts.push({
        partNumber: i + 1,
        etag
      });
      
      onProgress(((i + 1) / totalParts) * 100);
    }
    
    // Complete upload
    await completeMultipartUpload(key, uploadId, uploadedParts);
    return { key };
    
  } catch (error) {
    // Abort on failure
    const abortCommand = new AbortMultipartUploadCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      UploadId: uploadId
    });
    await s3.send(abortCommand);
    throw error;
  }
}
\`\`\`

### CDN Integration

\`\`\`javascript
const { CloudFrontClient, CreateInvalidationCommand } = require('@aws-sdk/client-cloudfront');

const cloudfront = new CloudFrontClient({});

// Invalidate cache after upload
async function invalidateCDN(paths) {
  const command = new CreateInvalidationCommand({
    DistributionId: process.env.CF_DISTRIBUTION_ID,
    InvalidationBatch: {
      CallerReference: Date.now().toString(),
      Paths: {
        Quantity: paths.length,
        Items: paths.map(p => '/' + p)
      }
    }
  });
  
  return cloudfront.send(command);
}

// Call after successful upload
app.post('/api/upload-url', async (req, res) => {
  // ... existing code ...
  
  const { uploadUrl, key } = await generateUploadUrl(...);
  
  res.json({ 
    uploadUrl, 
    key,
    publicUrl: 'https://cdn.example.com/' + key
  });
});

// Automatic invalidation via Lambda
// S3 → Lambda → CloudFront Invalidation
\`\`\`

### Image Processing and Thumbnails

\`\`\`javascript
const sharp = require('sharp');

// Process images after upload using Lambda
exports.handler = async (event) => {
  const s3Event = event.Records[0].s3;
  const bucket = s3Event.bucket.name;
  const key = decodeURIComponent(s3Event.object.key.replace(/\\+/g, ' '));
  
  // Only process images in the uploads folder
  if (!key.startsWith('uploads/') || !key.match(/\.(jpg|jpeg|png|webp)$/i)) {
    return;
  }
  
  try {
    // Get the original image
    const s3Object = await s3.getObject({ Bucket: bucket, Key: key }).promise();
    const buffer = s3Object.Body;
    
    // Generate thumbnails
    const sizes = [200, 400, 800];
    const processedImages = await Promise.all(
      sizes.map(async (size) => {
        const thumbnail = await sharp(buffer)
          .resize(size, size, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();
        
        const thumbnailKey = key.replace('uploads/', 'thumbnails/').replace(/\.[^.]+$/, '_' + size + '.jpg');
        
        await s3.putObject({
          Bucket: bucket,
          Key: thumbnailKey,
          Body: thumbnail,
          ContentType: 'image/jpeg'
        }).promise();
        
        return { size, key: thumbnailKey };
      })
    );
    
    // Generate metadata
    const metadata = await sharp(buffer).metadata();
    
    console.log('Processed:', key, '->', processedImages);
    
  } catch (error) {
    console.error('Processing failed:', error);
    throw error;
  }
};
\`\`\``,
};
