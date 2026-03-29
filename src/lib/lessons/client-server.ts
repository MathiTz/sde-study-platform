export const clientServerContent = `## Client-Server Architecture

The client-server model is the foundation of modern web applications. This architectural pattern defines how clients and servers interact, and understanding it is crucial for system design.

### The Fundamental Model

At its core, the client-server model consists of two main components:

**Client**: The interface that initiates requests. This could be a web browser, mobile app, or any application that needs services from a server.

**Server**: The backend system that processes requests and returns responses.

The key insight is that clients and servers are independent entities that communicate through a defined protocol (typically HTTP).

### HTTP Protocol Fundamentals

HTTP (Hypertext Transfer Protocol) is the foundation of client-server communication. Understanding HTTP is essential for system design.

\`\`\`javascript
// HTTP Request Anatomy
// Request Line
GET /api/users/123 HTTP/1.1

// Headers
Host: api.example.com
Accept: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

// Request Body (for POST/PUT)
{
  "name": "John Doe",
  "email": "john@example.com"
}
\`\`\`

Understanding HTTP methods and status codes is fundamental:

| Method | Purpose | Idempotent | Safe |
|--------|---------|------------|------|
| GET | Retrieve resource | Yes | Yes |
| POST | Create resource | No | No |
| PUT | Replace resource | Yes | No |
| PATCH | Update resource | No | No |
| DELETE | Delete resource | Yes | No |

\`\`\`javascript
// HTTP Response Anatomy
// Status Line
HTTP/1.1 200 OK

// Headers
Content-Type: application/json
Content-Length: 256
Cache-Control: public, max-age=3600
X-Request-Id: abc123

// Response Body
{
  "id": 123,
  "name": "John Doe",
  "created_at": "2024-01-15T10:30:00Z"
}
\`\`\`

### RESTful API Design

REST (Representational State Transfer) is an architectural style for designing networked applications. RESTful APIs use standard HTTP methods and status codes.

**Core REST Principles**:

1. **Client-Server Separation**: Clients and servers are independent
2. **Stateless**: Each request contains all information needed
3. **Cacheable**: Responses can be cached for performance
4. **Uniform Interface**: Resources identified by URIs
5. **Layered System**: Client cannot tell if connected directly to server

\`\`\`javascript
// RESTful API Design Example

// Good RESTful Endpoints
GET    /api/v1/users           // List all users
POST   /api/v1/users           // Create a user
GET    /api/v1/users/:id      // Get a specific user
PUT    /api/v1/users/:id      // Replace a user entirely
PATCH  /api/v1/users/:id      // Partially update a user
DELETE /api/v1/users/:id      // Delete a user

// Nested Resources (when appropriate)
GET    /api/v1/users/:id/orders      // Get user's orders
POST   /api/v1/users/:id/orders     // Create order for user
GET    /api/v1/users/:id/orders/:id // Get specific order

// Implementation
const express = require('express');
const app = express();

// List users with pagination
app.get('/api/v1/users', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;
  
  const [users, total] = await Promise.all([
    User.findAll({ limit, offset, order: [['created_at', 'DESC']] }),
    User.count()
  ]);
  
  res.json({
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

// Get single user
app.get('/api/v1/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'User not found'
    });
  }
  
  res.json({ data: user });
});

// Create user with validation
app.post('/api/v1/users', async (req, res) => {
  const { name, email, password } = req.body;
  
  // Validation
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Valid email is required'
    });
  }
  
  // Check for duplicate
  const existing = await User.findByEmail(email);
  if (existing) {
    return res.status(409).json({
      error: 'Conflict',
      message: 'Email already in use'
    });
  }
  
  const user = await User.create({
    name,
    email,
    password: await hashPassword(password)
  });
  
  res.status(201).json({ data: user });
});
\`\`\`

### Request-Response Cycle

Understanding the complete request-response lifecycle helps in debugging and optimization.

\`\`\`javascript
// Complete Request-Response Flow

async function createOrder(orderData) {
  try {
    // 1. Client constructs request
    const request = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + authToken,
        'X-Request-ID': generateUUID(),
        'X-Correlation-ID': getCorrelationId()
      },
      body: JSON.stringify(orderData)
    };
    
    // 2. Client sends request
    const response = await fetch('/api/orders', request);
    
    // 3. Client handles response
    if (response.status === 201) {
      const order = await response.json();
      return { success: true, order };
    }
    
    if (response.status === 401) {
      // Token expired
      await refreshToken();
      return createOrder(orderData); // Retry
    }
    
    if (response.status === 422) {
      // Validation error
      const errors = await response.json();
      return { success: false, errors };
    }
    
    if (response.status === 429) {
      // Rate limited
      const retryAfter = response.headers.get('Retry-After');
      await sleep(parseInt(retryAfter) * 1000);
      return createOrder(orderData); // Retry
    }
    
    throw new Error('Unexpected response: ' + response.status);
    
  } catch (error) {
    if (error.name === 'NetworkError') {
      // Network issue - retry with backoff
      return retryWithBackoff(() => createOrder(orderData));
    }
    throw error;
  }
}
\`\`\`

### Statelessness and State Management

Each HTTP request is independent. The server doesn't store client state between requests.

\`\`\`javascript
// BAD: Stateful server (causes problems with scaling)
const sessions = new Map();

app.post('/login', (req, res) => {
  const user = authenticate(req.body);
  sessions.set(req.sessionId, { userId: user.id });
  res.json({ success: true });
});

// Every request needs the session
app.get('/api/data', (req, res) => {
  const session = sessions.get(req.sessionId);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });
  // ...
});

// PROBLEMS:
// - Can't scale horizontally (sessions are local)
// - Sessions lost on server restart
// - Hard to manage session expiration
\`\`\`

\`\`\`javascript
// GOOD: Stateless server with token-based auth
app.post('/login', async (req, res) => {
  const user = await authenticate(req.body);
  
  // Token contains all needed info (stateless)
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  res.json({ token });
});

// Every request is self-contained
app.get('/api/data', (req, res) => {
  try {
    const decoded = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
    const data = fetchDataForUser(decoded.userId);
    res.json({ data });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// BENEFITS:
// - Easy horizontal scaling
// - Stateless - no session storage needed
// - Token can include expiry, permissions, etc.
\`\`\`

### Caching and Performance

HTTP provides built-in caching mechanisms that significantly improve performance.

\`\`\`javascript
// Server-side cache headers
app.get('/api/users/:id', async (req, res) => {
  const user = await getUserFromCacheOrDB(req.params.id);
  
  // Cache-Control directives
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
  // public: can be cached by proxies
  // max-age: cache for 5 minutes
  // stale-while-revalidate: serve stale content while revalidating in background
  
  res.json({ data: user });
});

// Conditional requests (ETags)
app.get('/api/users/:id', async (req, res) => {
  const user = await getUser(req.params.id);
  const etag = generateETag(user);
  
  // Check If-None-Match header
  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end(); // Not Modified - saves bandwidth
  }
  
  res.setHeader('ETag', etag);
  res.json({ data: user });
});

// Last-Modified for time-based caching
app.get('/api/products', async (req, res) => {
  const products = await getProducts();
  const lastModified = await getLastModifiedTime();
  
  if (req.headers['if-modified-since'] >= lastModified) {
    return res.status(304).end();
  }
  
  res.setHeader('Last-Modified', lastModified);
  res.json({ data: products });
});
\`\`\`

### API Versioning Strategies

As APIs evolve, versioning maintains backward compatibility while enabling improvements.

\`\`\`javascript
// Strategy 1: URL Path Versioning (most common, explicit)
app.use('/api/v1', require('./routes/v1'));
app.use('/api/v2', require('./routes/v2'));
app.use('/api/v3', require('./routes/v3'));

// V1 route
app.get('/api/v1/users/:id', (req, res) => {
  res.json({ id: 1, name: 'John', email: 'john@example.com' });
});

// V2 adds avatar field
app.get('/api/v2/users/:id', (req, res) => {
  res.json({
    id: 1,
    name: 'John',
    email: 'john@example.com',
    avatar_url: 'https://...'
  });
});

// Strategy 2: Header Versioning
app.get('/api/users/:id', (req, res) => {
  const version = req.headers['api-version'] || 'v1';
  
  const response = { id: 1, name: 'John' };
  
  if (version === 'v2') {
    response.email = 'john@example.com';
    response.avatar_url = 'https://...';
  }
  
  res.json(response);
});

// Strategy 3: Query Parameter
app.get('/api/users/:id', (req, res) => {
  const version = req.query.v || '1';
  // Handle different versions...
});
\`\`\`

### Error Handling Best Practices

Consistent error responses help clients handle failures gracefully.

\`\`\`javascript
// Standard error response format
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: {
        code: getErrorCode(err.statusCode),
        message: err.message,
        details: err.details,
        request_id: req.headers['x-request-id']
      }
    });
  }
  
  // Unexpected errors - don't leak details
  console.error('Unexpected error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      request_id: req.headers['x-request-id']
    }
  });
});

// Usage
app.get('/api/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
});
\`\`\``;
