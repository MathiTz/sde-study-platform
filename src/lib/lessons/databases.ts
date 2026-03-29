export const databasesContent = `## Database Fundamentals

Databases are the backbone of any system. They store, organize, and retrieve data efficiently. Understanding database fundamentals is essential for system design.

### SQL vs NoSQL: Deep Comparison

**SQL (Relational) Databases** use structured schemas and relationships between tables. They excel at ensuring data integrity and handling complex queries.

\`\`\`sql
-- Creating a relational schema with proper constraints
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
  shipping_address_id INTEGER REFERENCES addresses(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Performance indexes
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status) WHERE status != 'completed';
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- Partial index for active orders
CREATE INDEX idx_orders_pending ON orders(user_id, created_at DESC)
WHERE status IN ('pending', 'processing');

-- Complex query with JOINs and aggregations
SELECT 
  u.id,
  u.name,
  u.email,
  COUNT(o.id) AS order_count,
  COALESCE(SUM(o.total), 0) AS total_spent,
  MAX(o.created_at) AS last_order_date,
  AVG(o.total) AS avg_order_value
FROM users u
LEFT JOIN orders o ON u.id = o.user_id AND o.deleted_at IS NULL
WHERE u.deleted_at IS NULL
  AND u.created_at >= '2023-01-01'
GROUP BY u.id, u.name, u.email
HAVING COUNT(o.id) >= 5
ORDER BY total_spent DESC
LIMIT 100;

-- Window functions for running totals
SELECT 
  o.id,
  o.user_id,
  o.total,
  o.created_at,
  SUM(o.total) OVER (PARTITION BY o.user_id ORDER BY o.created_at) AS running_total,
  AVG(o.total) OVER (PARTITION BY o.user_id) AS user_avg,
  RANK() OVER (PARTITION BY DATE(o.created_at) ORDER BY o.total DESC) AS daily_rank
FROM orders o
WHERE o.status = 'completed';
\`\`\`

**NoSQL Databases** provide flexible schemas and are optimized for specific access patterns.

\`\`\`javascript
// MongoDB Document Store - Flexible Schema
// No strict schema - documents can have different fields
db.users.insertOne({
  _id: ObjectId(),
  email: "john@example.com",
  profile: {
    firstName: "John",
    lastName: "Doe",
    preferences: {
      theme: "dark",
      notifications: { email: true, push: false }
    }
  },
  roles: ["customer", "premium"],
  createdAt: new Date(),
  metadata: { source: "web", referrer: "google" }
});

// MongoDB Aggregation Pipeline
db.orders.aggregate([
  // Stage 1: Filter completed orders from last 30 days
  {
    $match: {
      status: "completed",
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }
  },
  // Stage 2: Join with users collection
  {
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "_id",
      as: "user"
    }
  },
  // Stage 3: Unwind user array
  { $unwind: "$user" },
  // Stage 4: Group by user
  {
    $group: {
      _id: "$userId",
      email: { $first: "$user.email" },
      totalOrders: { $sum: 1 },
      totalSpent: { $sum: "$total" },
      avgOrderValue: { $avg: "$total" },
      itemsPurchased: { $sum: { $size: "$items" } }
    }
  },
  // Stage 5: Add computed fields
  {
    $addFields: {
      customerTier: {
        $switch: {
          branches: [
            { case: { $gte: ["$totalSpent", 1000] }, then: "gold" },
            { case: { $gte: ["$totalSpent", 500] }, then: "silver" }
          ],
          default: "bronze"
        }
      }
    }
  },
  // Stage 6: Sort and limit
  { $sort: { totalSpent: -1 } },
  { $limit: 100 }
]);

// Redis Key-Value and Data Structures
const redis = require('ioredis');
const client = new redis();

// String operations
await client.set('user:123:profile', JSON.stringify({ name: 'John', email: 'john@example.com' }), 'EX', 3600);
const profile = JSON.parse(await client.get('user:123:profile'));

// Hash for structured data
await client.hset('user:123', {
  name: 'John Doe',
  email: 'john@example.com',
  tier: 'premium',
  points: '1500'
});
const userData = await client.hgetall('user:123');
await client.hincrby('user:123', 'points', 100);

// Sorted Set for leaderboards
await client.zadd('leaderboard', 1500, 'user:123');
await client.zadd('leaderboard', 2000, 'user:456', 1800, 'user:789');
const topUsers = await client.zrevrange('leaderboard', 0, 9, 'WITHSCORES');
// Returns: ['user:456', '2000', 'user:789', '1800', 'user:123', '1500']

// Real-time analytics with HyperLogLog
await client.pfadd('daily:unique:users', 'user:123', 'user:456', 'user:789');
const estimatedUnique = await client.pfcount('daily:unique:users');
\`\`\`

### When to Use Each Type

| Consideration | SQL | NoSQL |
|---------------|-----|-------|
| Data structure | Fixed, known schema | Flexible, evolving |
| Relationships | Strong, complex joins | Limited or denormalized |
| Queries | Complex, ad-hoc | Simple, predictable patterns |
| Transactions | ACID guaranteed | Limited or BASE |
| Scale | Moderate (vertical) | Extreme (horizontal) |
| Consistency | Strong, immediate | Eventual available |

\`\`\`javascript
// Decision Framework

// Use SQL when:
const useSQL = {
  needACID: true,                    // Financial transactions
  complexJoins: true,                // Analytics with many relationships
  structuredData: true,              // Known, stable schema
  reporting: true,                    // Complex aggregations
  compliance: 'SOX' | 'HIPAA'        // Audit requirements
};

// Use MongoDB when:
const useMongoDB = {
  flexibleSchema: true,             // User profiles with varying fields
  highWriteVolume: true,            // IoT sensor data
  documentStorage: true,             // Content management
  rapidDevelopment: true,            // Iterating on data model
  horizontalScaling: true            // Need to scale across regions
};

// Use Redis when:
const useRedis = {
  caching: true,                     // Session data, API responses
  realTime: true,                   // Leaderboards, counters
  pubSub: true,                     // Chat, notifications
  sessionStore: true,                // User sessions
  rateLimiting: true                // API rate limits
};
\`\`\`

### Indexing Strategies

Indexes dramatically improve query performance. Understanding index types and when to use them is crucial.

\`\`\`sql
-- Single column index
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- Composite index (order matters!)
-- Good for: WHERE user_id = ? AND status = ?
CREATE INDEX idx_orders_user_status ON orders(user_id, status);

-- Bad: WHERE status = ? (can't use index efficiently)
-- Bad: ORDER BY status (can't use index for sorting)

-- Partial index (PostgreSQL) - smaller, faster
CREATE INDEX idx_active_users ON users(email)
WHERE deleted_at IS NULL;

-- Covering index includes all needed columns
-- Query can be satisfied entirely from index
CREATE INDEX idx_orders_covering 
ON orders(user_id, status, created_at) 
INCLUDE (total, shipping_address_id);

-- Now this query uses only the index (index-only scan)
SELECT user_id, status, total 
FROM orders 
WHERE user_id = 123 AND status = 'completed';

-- Index for text search (PostgreSQL)
CREATE INDEX idx_products_name_gin 
ON products USING gin(to_tsvector('english', name));

SELECT * FROM products 
WHERE to_tsvector('english', name) @@ to_tsquery('english', 'coffee & machine');

-- MySQL full-text search
ALTER TABLE products ADD FULLTEXT(name, description);
SELECT * FROM products 
WHERE MATCH(name, description) AGAINST('+coffee +machine' IN BOOLEAN MODE);
\`\`\`

### Replication Patterns

Replication copies data across multiple servers for redundancy and read scaling.

\`\`\`javascript
// PostgreSQL Streaming Replication
// postgresql.conf
// wal_level = replica
// max_wal_senders = 5
// max_replication_slots = 5
// hot_standby = on
// wal_keep_size = 1GB

// pg_hba.conf - Allow replication connections
// host replication all md5

// Create replication user
// CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD 'secure_password';

// Create slot for each replica
// SELECT pg_create_physical_replication_slot('replica1_slot');
// SELECT pg_create_physical_replication_slot('replica2_slot');

// Read from replica for scale
async function getUser(userId, options = {}) {
  const isReadOnly = options.readOnly !== false; // Default to replica
  
  if (isReadOnly) {
    // Use replica connection pool
    const replica = await getReplicaConnection();
    return replica.query('SELECT * FROM users WHERE id = $1', [userId]);
  } else {
    // Use primary for writes
    const primary = await getPrimaryConnection();
    return primary.query('SELECT * FROM users WHERE id = $1', [userId]);
  }
}

// MongoDB Replica Set
const mongoose = require('mongoose');

mongoose.connect('mongodb://mongo1:27017,mongo2:27017,mongo3:27017/mydb', {
  replicaSet: 'rs0',
  readPreference: 'secondaryPreferred',
  readConcern: { level: 'majority' },
  writeConcern: { w: 'majority' },
  maxPoolSize: 10,
  minPoolSize: 5,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
});

// Switch to primary for critical reads
const user = await User.findById(id).read('primary');
\`\`\`

### Sharding Strategies

Sharding partitions data across multiple database instances.

\`\`\`javascript
// Application-Level Sharding

// Hash-based sharding
class HashSharding {
  constructor(shards) {
    this.shards = shards;
    this.numShards = shards.length;
  }

  getShardId(key) {
    const hash = this.hashKey(key);
    return hash % this.numShards;
  }

  getConnection(key) {
    const shardId = this.getShardId(key);
    return this.shards[shardId];
  }

  // Example: Shard by user ID
  async findUser(userId) {
    const connection = this.getConnection(userId);
    return connection.query('SELECT * FROM users WHERE id = $1', [userId]);
  }

  // Example: Query across all shards
  async findAllUsers(filter) {
    const promises = this.shards.map(shard => 
      shard.query('SELECT * FROM users WHERE ?', [filter])
    );
    const results = await Promise.all(promises);
    return results.flat().sort((a, b) => a.id - b.id);
  }
}

// Range-based sharding
class RangeSharding {
  constructor(shards) {
    this.shards = shards; // [{min: 0, max: 1000, connection}, ...]
  }

  getShard(key) {
    for (const shard of this.shards) {
      if (key >= shard.min && key < shard.max) {
        return shard;
      }
    }
    return this.shards[this.shards.length - 1];
  }

  // Example: Shard orders by user ID ranges
  async getOrdersForUser(userId) {
    const shard = this.getShard(userId);
    return shard.connection.query(
      'SELECT * FROM orders WHERE user_id = $1',
      [userId]
    );
  }
}

// Consistent hashing (minimizes redistribution)
class ConsistentHashRing {
  constructor(nodes, virtualNodes = 150) {
    this.ring = new Map();
    this.sortedKeys = [];
    
    for (const node of nodes) {
      this.addNode(node, virtualNodes);
    }
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
    const hash = this.hash(key);
    for (const sortedKey of this.sortedKeys) {
      if (hash <= sortedKey) {
        return this.ring.get(sortedKey);
      }
    }
    // Wrap around
    return this.ring.get(this.sortedKeys[0]);
  }
}
\`\`\`

### Connection Pooling

Connection pooling reuses database connections for better performance.

\`\`\`javascript
// PostgreSQL with pg-pool
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  
  // Pool size configuration
  max: 20,                    // Maximum connections
  min: 5,                     // Minimum idle connections
  idleTimeoutMillis: 30000,    // Close idle after 30s
  connectionTimeoutMillis: 5000,
  
  // SSL configuration
  ssl: {
    rejectUnauthorized: true
  }
});

// Monitor pool health
pool.on('connect', () => {
  console.log('New client connected to pool');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Query with automatic connection management
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  
  // Log slow queries
  if (duration > 100) {
    console.warn('Slow query:', { text, duration, rows: res.rowCount });
  }
  
  return res;
}

// Transaction helper
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// Usage
const result = await transaction(async (client) => {
  // All queries in this callback use the same client
  await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [100, 1]);
  await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [100, 2]);
  return { success: true };
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});
\`\`\`

### Query Optimization

Understanding query execution plans helps identify performance issues.

\`\`\`sql
-- EXPLAIN ANALYZE shows execution plan and timing
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT 
  u.name,
  COUNT(o.id) as order_count,
  SUM(o.total) as total
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at >= '2024-01-01'
GROUP BY u.id, u.name;

-- Sample output:
-- Hash Left Join  (cost=1000.00..5000.00 rows=500 width=64)
--   (actual time=10.5..50.2 rows=450 loops=1)
--   Buffers: shared hit=1250
--   ->  Seq Scan on users  (cost=0..1000.00 rows=10000 width=32)
--         (actual time=0.1..5.0 rows=10000 loops=1)
--         Filter: (created_at >= '2024-01-01'::date)
--         Rows Removed by Filter: 5000
--   ->  Hash  (cost=500.00..500.00 rows=10000 width=32)
--         (actual time=10.2..10.2 rows=5000 loops=1)
--         Buckets: 1024  Batches: 1
--         ->  Seq Scan on orders  (cost=0..500.00 rows=10000 width=16)
-- Planning Time: 0.5 ms
-- Execution Time: 50.3 ms

-- Index creation based on EXPLAIN
-- If you see "Seq Scan on orders", add an index:
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at)
WHERE status = 'completed';
\`\`\`

| Optimization Technique | Example |
|---------------------|---------|
| Use covering indexes | Include all SELECT columns in index |
| Avoid SELECT * | Specify only needed columns |
| Use EXPLAIN ANALYZE | Understand query execution |
| Batch operations | INSERT INTO ... VALUES (...), (...), (...) |
| Use pagination | LIMIT/OFFSET for large result sets |
| Avoid functions on indexed columns | WHERE YEAR(date) (bad) |
| Use prepared statements | Reuse query plans |`;
