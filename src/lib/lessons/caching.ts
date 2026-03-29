export const cachingContent = `## Caching Strategies

Caching is one of the most powerful techniques for improving system performance. It stores frequently accessed data in fast storage to reduce latency and load on backend systems.

### Understanding Cache Effectiveness

The effectiveness of a cache is measured by hit ratio. A well-designed cache achieves 95%+ hit rates.

\`\`\`javascript
// Cache metrics
const cacheMetrics = {
  hits: 9500,
  misses: 500,
  hitRate: () => hits / (hits + misses) * 100, // 95%
  missRate: () => misses / (hits + misses) * 100, // 5%
  
  // Latency comparison (typical values)
  cacheHitLatency: '0.1ms',   // Redis
  cacheMissLatency: '10ms',    // DB with connection pool
  dbQueryLatency: '50ms'       // Cold DB query
};

// Impact of cache on performance
function calculateEffectiveLatency(cacheHitRate) {
  const hitLatency = 0.1;  // ms
  const missLatency = 60;   // ms
  
  return (cacheHitRate * hitLatency) + ((1 - cacheHitRate) * missLatency);
}

// 95% hit rate: 0.95 * 0.1 + 0.05 * 60 = 3.095ms average
// 80% hit rate: 0.80 * 0.1 + 0.20 * 60 = 12.08ms average
\`\`\`

### Cache-Aside Pattern (Lazy Loading)

The most common caching pattern. The application checks the cache first, loads from database on miss, then populates the cache.

\`\`\`javascript
class CacheAside {
  constructor(redis, db) {
    this.redis = redis;
    this.db = db;
    this.defaultTTL = 3600; // 1 hour
  }

  async getUser(userId) {
    const cacheKey = 'user:' + userId;
    
    // Step 1: Check cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      console.log('Cache HIT for user:', userId);
      return JSON.parse(cached);
    }
    
    console.log('Cache MISS for user:', userId);
    
    // Step 2: Fetch from database
    const user = await this.db.users.findById(userId);
    if (!user) {
      return null;
    }
    
    // Step 3: Populate cache
    await this.redis.setex(
      cacheKey,
      this.defaultTTL,
      JSON.stringify(user)
    );
    
    return user;
  }

  async getUserWithCustomTTL(userId, ttl = this.defaultTTL) {
    const cacheKey = 'user:' + userId;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    const user = await this.db.users.findById(userId);
    if (user) {
      await this.redis.setex(cacheKey, ttl, JSON.stringify(user));
    }
    
    return user;
  }
}

// Usage with Express
const cache = new CacheAside(redis, db);

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await cache.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    // Fallback to database if cache fails
    const user = await db.users.findById(req.params.id);
    res.json(user);
  }
});
\`\`\`

### Write-Through Pattern

Writes go to both cache and database simultaneously. Ensures strong consistency but adds write latency.

\`\`\`javascript
class WriteThroughCache {
  constructor(redis, db) {
    this.redis = redis;
    this.db = db;
  }

  async createUser(userData) {
    // Write to database first
    const user = await this.db.users.create(userData);
    
    // Then write to cache
    await this.redis.set(
      'user:' + user.id,
      JSON.stringify(user)
    );
    
    return user;
  }

  async updateUser(userId, updates) {
    // Update database
    const user = await this.db.users.findByIdAndUpdate(
      userId,
      updates,
      { new: true }
    );
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Update cache
    await this.redis.set(
      'user:' + userId,
      JSON.stringify(user)
    );
    
    return user;
  }

  async deleteUser(userId) {
    // Delete from database
    await this.db.users.delete(userId);
    
    // Delete from cache
    await this.redis.del('user:' + userId);
    
    return { success: true };
  }
}
\`\`\`

### Write-Back Pattern (Lazy Write)

Writes go to cache first, and the cache periodically flushes to the database. Best write performance but risk of data loss.

\`\`\`javascript
class WriteBackCache {
  constructor(redis, db) {
    this.redis = redis;
    this.db = db;
    this.dirtySetKey = 'dirty:users';
    this.flushInterval = 30000; // 30 seconds
  }

  async updateUser(userId, updates) {
    // Write to cache only (fast)
    const user = await this.redis.get('user:' + userId);
    const currentUser = user ? JSON.parse(user) : await this.db.users.findById(userId);
    
    const updatedUser = { ...currentUser, ...updates };
    await this.redis.set(
      'user:' + userId,
      JSON.stringify(updatedUser)
    );
    
    // Mark as dirty for later flush
    await this.redis.sadd(this.dirtySetKey, userId);
    
    return updatedUser;
  }

  // Background job to flush dirty data
  async flushDirtyUsers() {
    const dirtyUserIds = await this.redis.smembers(this.dirtySetKey);
    
    if (dirtyUserIds.length === 0) {
      return;
    }
    
    console.log('Flushing', dirtyUserIds.length, 'dirty users');
    
    for (const userId of dirtyUserIds) {
      try {
        const data = await this.redis.get('user:' + userId);
        if (data) {
          await this.db.users.updateOne(
            { _id: userId },
            JSON.parse(data)
          );
        }
        await this.redis.srem(this.dirtySetKey, userId);
      } catch (error) {
        console.error('Failed to flush user:', userId, error);
        // Keep in dirty set for retry
      }
    }
  }

  startFlushJob() {
    setInterval(() => this.flushDirtyUsers(), this.flushInterval);
  }
}
\`\`\`

### Cache Invalidation Strategies

Cache invalidation is critical for data consistency. There are several strategies:

\`\`\`javascript
// Strategy 1: TTL-Based Expiration
async function setWithTTL(key, value, ttlSeconds = 3600) {
  await redis.setex(key, ttlSeconds, JSON.stringify(value));
}

// Strategy 2: Event-Driven Invalidation
async function invalidateOnUpdate(userId) {
  // Delete from cache when data is updated
  await redis.del('user:' + userId);
}

// Using Redis Pub/Sub for distributed invalidation
class DistributedCacheInvalidator {
  constructor(redis) {
    this.redis = redis;
    this.subscriber = redis.duplicate();
  }

  async publishInvalidation(pattern, keys) {
    await this.redis.publish('cache:invalidate', JSON.stringify({
      pattern,
      keys,
      timestamp: Date.now()
    }));
  }

  subscribe(handler) {
    this.subscriber.subscribe('cache:invalidate');
    this.subscriber.on('message', (channel, message) => {
      const data = JSON.parse(message);
      handler(data);
    });
  }
}

// Usage in application
const invalidator = new DistributedCacheInvalidator(redis);

// When user data changes
app.put('/api/users/:id', async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body);
  
  // Publish invalidation event
  await invalidator.publishInvalidation('user:*', ['user:' + req.params.id]);
  
  res.json(user);
});

// Subscribe and handle invalidation
invalidator.subscribe(async ({ keys }) => {
  for (const key of keys) {
    await redis.del(key);
  }
});
\`\`\`

### LRU Cache Implementation

Least Recently Used eviction when the cache is full.

\`\`\`javascript
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map(); // Map maintains insertion order
  }

  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }
    
    // Move to end (most recently used)
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    
    return value;
  }

  put(key, value) {
    // If key exists, update and move to end
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } 
    // If at capacity, remove least recently used (first item)
    else if (this.cache.size >= this.capacity) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, value);
  }

  has(key) {
    return this.cache.has(key);
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      capacity: this.capacity,
      utilization: (this.cache.size / this.capacity) * 100
    };
  }
}

// Usage
const lruCache = new LRUCache(100);
lruCache.put('user:1', { name: 'John', email: 'john@example.com' });
lruCache.put('user:2', { name: 'Jane', email: 'jane@example.com' });
console.log(lruCache.get('user:1')); // Returns and marks as recently used
console.log(lruCache.get('user:3')); // null - not found
console.log(lruCache.getStats()); // { size: 2, capacity: 100, utilization: 2 }
\`\`\`

### Distributed Caching with Redis

Redis provides powerful distributed caching capabilities.

\`\`\`javascript
const Redis = require('ioredis');

// Connection with automatic reconnection
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: 6379,
  password: process.env.REDIS_PASSWORD,
  
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redis.on('reconnecting', () => {
  console.log('Redis reconnecting...');
});

// Pipeline for batch operations
async function getUserFeed(userId) {
  const friends = await getFriends(userId);
  const pipeline = redis.pipeline();
  
  for (const friendId of friends) {
    pipeline.get('feed:' + friendId);
  }
  
  const results = await pipeline.exec();
  return results
    .map(([err, data]) => err ? null : JSON.parse(data))
    .filter(Boolean);
}

// Redis Cluster for horizontal scaling
const RedisCluster = require('ioredis/cluster');

const cluster = new RedisCluster([
  { host: '10.0.0.1', port: 6379 },
  { host: '10.0.0.2', port: 6379 },
  { host: '10.0.0.3', port: 6379 }
], {
  redisOptions: {
    password: process.env.REDIS_PASSWORD
  },
  slotsRefreshTimeout: 10000,
  maxRedirects: 3
});

// Using hash for structured data
async function cacheUserProfile(userId, profile) {
  await redis.hset('profiles:' + userId, {
    name: profile.name,
    email: profile.email,
    avatar: profile.avatar || '',
    updatedAt: Date.now().toString()
  });
  await redis.expire('profiles:' + userId, 3600);
}

async function getUserProfile(userId) {
  return redis.hgetall('profiles:' + userId);
}
\`\`\`

### Cache Stampede Prevention

Prevent thundering herd when cache expires or misses.

\`\`\`javascript
// Mutex/Lock-based approach
async function getWithLock(key, fetchFn, ttl = 3600) {
  const lockKey = 'lock:' + key;
  
  // Try to get from cache first
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Try to acquire lock
  const lockAcquired = await redis.set(lockKey, '1', 'NX', 'EX', 10);
  
  if (!lockAcquired) {
    // Another process is fetching, wait and retry
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Retry cache
    const retryCached = await redis.get(key);
    if (retryCached) {
      return JSON.parse(retryCached);
    }
    
    // Still no cache, wait longer
    await new Promise(resolve => setTimeout(resolve, 200));
    return getWithLock(key, fetchFn, ttl);
  }
  
  // We have the lock, fetch and cache
  try {
    const data = await fetchFn();
    await redis.setex(key, ttl, JSON.stringify(data));
    return data;
  } finally {
    // Always release lock
    await redis.del(lockKey);
  }
}

// Probabilistic Early Expiration
async function getWithProbabilisticEarlyRefresh(key, fetchFn, ttl = 3600) {
  const cached = await redis.get(key);
  
  if (cached) {
    const data = JSON.parse(cached);
    const age = (Date.now() - data._cachedAt) / 1000;
    
    // Calculate probability of early refresh
    const threshold = ttl * 0.8;
    const shouldRefresh = age > threshold && Math.random() < (age - threshold) / threshold;
    
    if (shouldRefresh) {
      // Refresh in background
      fetchFn().then(freshData => {
        redis.setex(key, ttl, JSON.stringify(freshData));
      }).catch(err => console.error('Background refresh failed:', err));
    }
    
    return data;
  }
  
  // Cache miss
  const data = await fetchFn();
  await redis.setex(key, ttl, JSON.stringify(data));
  return data;
}
\`\`\`

### Multi-Level Caching

Combine L1 (local in-memory) and L2 (distributed Redis) caches.

\`\`\`javascript
const NodeCache = require('node-cache');

class MultiLevelCache {
  constructor() {
    // L1: Local in-memory cache (very fast, per-process)
    this.l1 = new NodeCache({
      stdTTL: 60,      // 1 minute
      checkperiod: 30,  // Cleanup every 30 seconds
      useClones: false  // Store references
    });
    
    // L2: Redis distributed cache (slower, shared)
    this.redis = new Redis();
  }

  async get(key) {
    // Check L1 first
    let value = this.l1.get(key);
    if (value !== undefined) {
      console.log('L1 HIT:', key);
      return value;
    }
    
    // Check L2
    console.log('L1 MISS, checking L2:', key);
    const cached = await this.redis.get(key);
    if (cached) {
      console.log('L2 HIT:', key);
      value = JSON.parse(cached);
      // Populate L1 for future requests
      this.l1.set(key, value);
      return value;
    }
    
    console.log('L2 MISS:', key);
    return null;
  }

  async set(key, value, l2ttl = 3600) {
    // Set in both levels
    this.l1.set(key, value);
    await this.redis.setex(key, l2ttl, JSON.stringify(value));
  }

  async delete(key) {
    this.l1.del(key);
    await this.redis.del(key);
  }

  // Pre-warm cache from database
  async warmCache(keys, fetchFn) {
    const values = await fetchFn(keys);
    for (const [key, value] of Object.entries(values)) {
      await this.set(key, value);
    }
  }

  getStats() {
    return {
      l1: this.l1.getStats(),
      l2Connected: this.redis.status === 'ready'
    };
  }
}
\`\`\`

### Cache Design Patterns Summary

| Pattern | Write Path | Read Path | Consistency | Complexity |
|---------|-----------|-----------|-------------|------------|
| Cache-Aside | Direct to DB | Cache → DB on miss | Eventual | Low |
| Write-Through | Cache + DB | Cache | Strong | Medium |
| Write-Behind | Cache | Cache → DB on miss | Eventual | High |
| Read-Through | Cache → DB | Cache | Eventual | Medium |`;
