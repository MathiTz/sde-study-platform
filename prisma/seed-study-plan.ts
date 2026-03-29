import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const studyPlanData = {
  title: "8-Week System Design Interview Mastery",
  description: "A comprehensive 8-week study plan covering all essential system design concepts for interview success.",
  duration: 8,
  weeks: [
    {
      weekNumber: 1,
      title: "Building Blocks",
      description: "Learn the fundamental components that form the foundation of system design.",
      topics: "client-server,database,api,networking,dns,http,tcp-ip,rest,graphql",
      questions: [
        {
          questionType: "SINGLE",
          question: "What is the primary purpose of DNS in a web application?",
          options: JSON.stringify([
            { text: "To encrypt data between client and server", isCorrect: false },
            { text: "To translate domain names to IP addresses", isCorrect: true },
            { text: "To cache frequently accessed web pages", isCorrect: false },
            { text: "To balance load across multiple servers", isCorrect: false }
          ]),
          hint: "Think about what happens when you type a URL in your browser.",
          explanation: "DNS (Domain Name System) acts as the phonebook of the internet, translating human-readable domain names (like google.com) into IP addresses (like 142.250.185.46) that computers use to identify each other.",
          topic: "networking",
          difficulty: "BEGINNER"
        },
        {
          questionType: "SINGLE",
          question: "Which type of database is best suited for storing hierarchical data like a file system?",
          options: JSON.stringify([
            { text: "Relational Database (PostgreSQL)", isCorrect: false },
            { text: "Key-Value Store (Redis)", isCorrect: false },
            { text: "Document Store (MongoDB)", isCorrect: false },
            { text: "Graph Database (Neo4j)", isCorrect: true }
          ]),
          hint: "Consider relationships between entities and traversal patterns.",
          explanation: "Graph databases excel at handling hierarchical and connected data because they store relationships as first-class citizens, enabling efficient traversal of connected entities.",
          topic: "database",
          difficulty: "INTERMEDIATE"
        },
        {
          questionType: "MULTIPLE",
          question: "Which of the following are HTTP methods commonly used in REST APIs? (Select all that apply)",
          options: JSON.stringify([
            { text: "GET", isCorrect: true },
            { text: "POST", isCorrect: true },
            { text: "SEND", isCorrect: false },
            { text: "DELETE", isCorrect: true },
            { text: "FETCH", isCorrect: false }
          ]),
          hint: "REST follows standard HTTP verbs for CRUD operations.",
          explanation: "REST APIs use standard HTTP methods: GET (read), POST (create), PUT/PATCH (update), DELETE (delete). SEND and FETCH are not standard REST methods.",
          topic: "api",
          difficulty: "BEGINNER"
        },
        {
          questionType: "ABSTRACT",
          question: "Explain the difference between a client and a server in the context of web applications. Why is this separation important for system design?",
          hint: "Consider the roles of each component and how they communicate.",
          explanation: null,
          topic: "client-server",
          difficulty: "BEGINNER"
        },
        {
          questionType: "DRAWING",
          question: "Draw a simple client-server architecture diagram showing: a web browser, a load balancer, and two server instances connected to a database. Show the request/response flow.",
          hint: "Use rectangles for components and arrows to show data flow.",
          explanation: null,
          topic: "client-server",
          difficulty: "BEGINNER"
        },
        {
          questionType: "SINGLE",
          question: "What is the purpose of connection pooling in database connections?",
          options: JSON.stringify([
            { text: "To encrypt database connections", isCorrect: false },
            { text: "To reuse existing connections instead of creating new ones for each request", isCorrect: true },
            { text: "To automatically backup database contents", isCorrect: false },
            { text: "To partition data across multiple databases", isCorrect: false }
          ]),
          hint: "Think about the overhead of creating new connections for each request.",
          explanation: "Connection pooling reuses existing database connections instead of creating new ones for each request. This reduces connection overhead (5-10ms per connection) and allows handling more concurrent requests.",
          topic: "database",
          difficulty: "INTERMEDIATE"
        }
      ]
    },
    {
      weekNumber: 2,
      title: "Scalability & Performance",
      description: "Master the art of scaling systems to handle millions of users.",
      topics: "vertical-scaling,horizontal-scaling,load-balancing,caching,cdn,redis,memcached",
      questions: [
        {
          questionType: "SINGLE",
          question: "What is the main disadvantage of vertical scaling compared to horizontal scaling?",
          options: JSON.stringify([
            { text: "It's more expensive to implement", isCorrect: false },
            { text: "There's a physical limit to how powerful a single machine can become", isCorrect: true },
            { text: "It requires more complex software", isCorrect: false },
            { text: "It doesn't improve performance", isCorrect: false }
          ]),
          hint: "Consider the limits of hardware resources.",
          explanation: "Vertical scaling (adding more CPU, RAM, storage to a single machine) has inherent physical limits. A single machine cannot be upgraded infinitely, and represents a single point of failure.",
          topic: "vertical-scaling",
          difficulty: "BEGINNER"
        },
        {
          questionType: "MULTIPLE",
          question: "Which of the following are valid strategies for load balancing? (Select all that apply)",
          options: JSON.stringify([
            { text: "Round Robin", isCorrect: true },
            { text: "Least Connections", isCorrect: true },
            { text: "IP Hash", isCorrect: true },
            { text: "Random Selection", isCorrect: true },
            { text: "First Come First Served", isCorrect: false }
          ]),
          hint: "Load balancers distribute traffic based on various algorithms.",
          explanation: "Round Robin, Least Connections, IP Hash, and Weighted variants are common load balancing algorithms. FCFS is a scheduling algorithm, not typically used for load balancing.",
          topic: "load-balancing",
          difficulty: "INTERMEDIATE"
        },
        {
          questionType: "SINGLE",
          question: "When should you consider adding a CDN to your architecture?",
          options: JSON.stringify([
            { text: "When you have primarily dynamic content", isCorrect: false },
            { text: "When you have static content accessed by users geographically distributed", isCorrect: true },
            { text: "When your database queries are slow", isCorrect: false },
            { text: "When you need to process real-time data", isCorrect: false }
          ]),
          hint: "CDNs specialize in content delivery to end users.",
          explanation: "CDNs cache static content (images, videos, CSS, JS) on edge servers worldwide, reducing latency by serving content from geographically closer locations to users.",
          topic: "cdn",
          difficulty: "INTERMEDIATE"
        },
        {
          questionType: "ABSTRACT",
          question: "Explain the cache-aside pattern. When would you choose write-through over write-back caching?",
          hint: "Consider consistency vs performance trade-offs.",
          explanation: null,
          topic: "caching",
          difficulty: "INTERMEDIATE"
        },
        {
          questionType: "DRAWING",
          question: "Draw a caching architecture showing the request flow through a load balancer, application servers, Redis cache, and PostgreSQL database. Include cache hit and cache miss paths.",
          hint: "Show both paths: when data is in cache vs when it needs to be fetched from DB.",
          explanation: null,
          topic: "caching",
          difficulty: "INTERMEDIATE"
        },
        {
          questionType: "SINGLE",
          question: "What is cache invalidation, and why is it challenging?",
          options: JSON.stringify([
            { text: "The process of removing outdated data from cache", isCorrect: true },
            { text: "A security measure to prevent unauthorized cache access", isCorrect: false },
            { text: "A technique to compress cached data", isCorrect: false },
            { text: "A method to encrypt cached content", isCorrect: false }
          ]),
          hint: "Think about what happens when data changes in the source of truth.",
          explanation: "Cache invalidation ensures cached data stays consistent with the source. It's challenging because you must decide WHEN to remove/update cache entries without causing stale data or excessive load on the database.",
          topic: "caching",
          difficulty: "INTERMEDIATE"
        }
      ]
    },
    {
      weekNumber: 3,
      title: "Data Storage Deep Dive",
      description: "Understand the nuances of different database technologies and storage strategies.",
      topics: "sql,nosql,indexing,replication,sharding,partitioning",
      questions: [
        {
          questionType: "SINGLE",
          question: "What is the primary advantage of database indexing?",
          options: JSON.stringify([
            { text: "Reducing storage costs", isCorrect: false },
            { text: "Faster read queries by enabling O(log n) lookups instead of O(n) scans", isCorrect: true },
            { text: "Automatic data backup", isCorrect: false },
            { text: "Better security through encryption", isCorrect: false }
          ]),
          hint: "Consider how databases find data without indexes.",
          explanation: "Indexes create data structures (typically B-trees) that allow databases to find data in O(log n) time instead of scanning every row (O(n)). This can improve query performance from milliseconds to microseconds.",
          topic: "indexing",
          difficulty: "INTERMEDIATE"
        },
        {
          questionType: "MULTIPLE",
          question: "Which scenarios favor NoSQL databases over relational databases? (Select all that apply)",
          options: JSON.stringify([
            { text: "Need for flexible schema that evolves over time", isCorrect: true },
            { text: "Handling massive scale with billions of records", isCorrect: true },
            { text: "Complex multi-row transactions with ACID guarantees", isCorrect: false },
            { text: "High-velocity writes with simple query patterns", isCorrect: true },
            { text: "Need for rich JOIN capabilities", isCorrect: false }
          ]),
          hint: "NoSQL excels in specific use cases - think about scale and flexibility.",
          explanation: "NoSQL is favored for flexible schemas, massive scale, and high-velocity writes. Complex transactions and rich joins typically favor SQL databases.",
          topic: "nosql",
          difficulty: "INTERMEDIATE"
        },
        {
          questionType: "SINGLE",
          question: "What is database replication lag?",
          options: JSON.stringify([
            { text: "The time it takes to create a database backup", isCorrect: false },
            { text: "The delay between writing to the primary and data being available on replicas", isCorrect: true },
            { text: "The time to restore from a failed database", isCorrect: false },
            { text: "The latency of complex JOIN queries", isCorrect: false }
          ]),
          hint: "Replication is asynchronous by nature.",
          explanation: "Replication lag is the time delay between when data is written to the primary database and when it's propagated to read replicas. This affects read consistency from replicas.",
          topic: "replication",
          difficulty: "INTERMEDIATE"
        },
        {
          questionType: "ABSTRACT",
          question: "When designing a sharding strategy, what makes a good partition key? Explain with examples of good and bad choices.",
          hint: "Consider data distribution and query patterns.",
          explanation: null,
          topic: "sharding",
          difficulty: "ADVANCED"
        },
        {
          questionType: "SINGLE",
          question: "What problem does master-slave replication solve?",
          options: JSON.stringify([
            { text: "Data loss if the primary database fails", isCorrect: false },
            { text: "Improving read throughput by distributing reads across replicas", isCorrect: true },
            { text: "Eliminating the need for database backups", isCorrect: false },
            { text: "Automatically encrypting sensitive data", isCorrect: false }
          ]),
          hint: "Think about read vs write patterns in most applications.",
          explanation: "Master-slave replication improves read scalability by creating replicas that can serve read queries, while writes go to the master. It also provides read availability during master outages.",
          topic: "replication",
          difficulty: "BEGINNER"
        }
      ]
    },
    {
      weekNumber: 4,
      title: "Communication Patterns",
      description: "Learn how components communicate in distributed systems.",
      topics: "sync-async,messaging-queues,kafka,sqs,grpc,webhooks,pub-sub",
      questions: [
        {
          questionType: "SINGLE",
          question: "What is the main advantage of asynchronous communication over synchronous?",
          options: JSON.stringify([
            { text: "Lower latency per request", isCorrect: false },
            { text: "Decoupling of services and better tolerance of varying processing speeds", isCorrect: true },
            { text: "Simpler code implementation", isCorrect: false },
            { text: "Guaranteed message delivery", isCorrect: false }
          ]),
          hint: "Consider what happens when one service is slower than others.",
          explanation: "Asynchronous communication decouples services, allowing them to operate independently. A slow downstream service won't block the caller, improving overall system resilience.",
          topic: "sync-async",
          difficulty: "INTERMEDIATE"
        },
        {
          questionType: "MULTIPLE",
          question: "Which are valid use cases for message queues? (Select all that apply)",
          options: JSON.stringify([
            { text: "Decoupling a web API from background processing", isCorrect: true },
            { text: "Buffering requests during traffic spikes", isCorrect: true },
            { text: "Real-time chat messaging", isCorrect: false },
            { text: "Ensuring exactly-once processing of payments", isCorrect: true },
            { text: "Video transcoding jobs", isCorrect: true }
          ]),
          hint: "Message queues excel at background processing and buffering.",
          explanation: "Message queues are ideal for decoupling, buffering traffic spikes, background jobs, and ensuring processing reliability. Real-time chat typically uses WebSockets for lower latency.",
          topic: "messaging-queues",
          difficulty: "INTERMEDIATE"
        },
        {
          questionType: "SINGLE",
          question: "What is the difference between Kafka and SQS (Amazon Simple Queue Service)?",
          options: JSON.stringify([
            { text: "Kafka is pull-based, SQS is push-based", isCorrect: false },
            { text: "Kafka retains messages (log-based), SQS is a traditional queue that deletes messages after consumption", isCorrect: true },
            { text: "SQS is open-source, Kafka is proprietary", isCorrect: false },
            { text: "There's no significant difference", isCorrect: false }
          ]),
          hint: "Consider message retention and replay capabilities.",
          explanation: "Kafka is a distributed log that retains messages, allowing replay. SQS is a traditional queue where messages are deleted after being consumed, making replay impossible.",
          topic: "kafka",
          difficulty: "ADVANCED"
        },
        {
          questionType: "ABSTRACT",
          question: "Explain the Publisher-Subscriber pattern. How does it differ from a traditional message queue, and when would you choose one over the other?",
          hint: "Consider fan-out and message routing patterns.",
          explanation: null,
          topic: "pub-sub",
          difficulty: "ADVANCED"
        },
        {
          questionType: "DRAWING",
          question: "Draw the architecture of a notification system using a message queue. Show: API service, message queue, email worker, SMS worker, and push notification worker. Indicate how messages are routed to different consumers.",
          hint: "Use different colors/shapes for producers and consumers.",
          explanation: null,
          topic: "messaging-queues",
          difficulty: "INTERMEDIATE"
        }
      ]
    },
    {
      weekNumber: 5,
      title: "Advanced Patterns",
      description: "Master complex system design patterns for real-world scenarios.",
      topics: "real-time,websockets,sse,long-running-tasks,file-upload,cdn",
      questions: [
        {
          questionType: "SINGLE",
          question: "When would you choose Server-Sent Events (SSE) over WebSockets?",
          options: JSON.stringify([
            { text: "When you need bidirectional communication", isCorrect: false },
            { text: "When the server needs to push updates to the client but the client rarely sends data", isCorrect: true },
            { text: "When you need sub-millisecond latency", isCorrect: false },
            { text: "When building a video streaming application", isCorrect: false }
          ]),
          hint: "SSE is unidirectional by design.",
          explanation: "SSE is ideal for server-to-client streaming where the client doesn't need to send frequent messages (like stock price updates, notifications). It's simpler than WebSockets and works over HTTP/2.",
          topic: "real-time",
          difficulty: "INTERMEDIATE"
        },
        {
          questionType: "SINGLE",
          question: "Why should file uploads bypass your application servers when using cloud storage?",
          options: JSON.stringify([
            { text: "Application servers don't support file storage", isCorrect: false },
            { text: "To avoid your servers becoming bottlenecks and paying double bandwidth (client-to-server, server-to-storage)", isCorrect: true },
            { text: "Cloud storage is faster than application servers", isCorrect: false },
            { text: "Application servers have storage limits", isCorrect: false }
          ]),
          hint: "Think about bandwidth costs and scalability.",
          explanation: "Direct uploads to cloud storage (via presigned URLs) avoid your servers handling large files, saving bandwidth costs and preventing them from becoming bottlenecks during uploads.",
          topic: "file-upload",
          difficulty: "INTERMEDIATE"
        },
        {
          questionType: "MULTIPLE",
          question: "What are the benefits of multipart uploads for large files? (Select all that apply)",
          options: JSON.stringify([
            { text: "Resumable uploads if connection is interrupted", isCorrect: true },
            { text: "Parallel upload of different parts for faster speeds", isCorrect: true },
            { text: "Automatic encryption of the file", isCorrect: false },
            { text: "Lower memory usage on the uploader's device", isCorrect: true },
            { text: "Built-in virus scanning", isCorrect: false }
          ]),
          hint: "Consider the practical challenges of uploading large files.",
          explanation: "Multipart uploads enable resumability, parallel uploads for speed, and lower memory usage since files can be uploaded in chunks rather than loading entirely into memory.",
          topic: "file-upload",
          difficulty: "INTERMEDIATE"
        },
        {
          questionType: "ABSTRACT",
          question: "Design an async job processing system. Explain how you would handle job failures, retries, and dead-letter queues.",
          hint: "Consider reliability and observability.",
          explanation: null,
          topic: "long-running-tasks",
          difficulty: "ADVANCED"
        },
        {
          questionType: "DRAWING",
          question: "Draw the architecture for a video transcoding service. Show: upload endpoint, presigned URL flow, S3 storage, message queue, transcoding workers, and notification system. Include the failure retry path.",
          hint: "Use boxes and arrows to show the complete flow.",
          explanation: null,
          topic: "long-running-tasks",
          difficulty: "ADVANCED"
        }
      ]
    },
    {
      weekNumber: 6,
      title: "Consistency & Reliability",
      description: "Understand how to build reliable distributed systems.",
      topics: "cap-theorem,acid-base,consensus,replication,eventual-consistency,failure-handling",
      questions: [
        {
          questionType: "SINGLE",
          question: "According to the CAP theorem, what can a distributed system guarantee at most?",
          options: JSON.stringify([
            { text: "Consistency, Availability, and Partition tolerance simultaneously", isCorrect: false },
            { text: "Any two of Consistency, Availability, and Partition tolerance", isCorrect: true },
            { text: "Only Consistency and Partition tolerance", isCorrect: false },
            { text: "Only Availability and Partition tolerance", isCorrect: false }
          ]),
          hint: "Partitions will happen in real networks.",
          explanation: "The CAP theorem states that during a network partition, you must choose between consistency and availability. Since partitions are unavoidable, you can only guarantee two of the three properties.",
          topic: "cap-theorem",
          difficulty: "INTERMEDIATE"
        },
        {
          questionType: "SINGLE",
          question: "What is eventual consistency?",
          options: JSON.stringify([
            { text: "Data will always be consistent across all replicas immediately", isCorrect: false },
            { text: "Given no new updates, all replicas will eventually become consistent", isCorrect: true },
            { text: "Data is never consistent and constantly changes", isCorrect: false },
            { text: "Consistency is only achieved when the system is idle", isCorrect: false }
          ]),
          hint: "Think about the time dimension of consistency.",
          explanation: "Eventual consistency guarantees that if no new updates are made, all replicas will eventually return the same value. This allows systems to be highly available during network partitions.",
          topic: "eventual-consistency",
          difficulty: "INTERMEDIATE"
        },
        {
          questionType: "MULTIPLE",
          question: "Which strategies help handle database contention? (Select all that apply)",
          options: JSON.stringify([
            { text: "Pessimistic locking with SELECT FOR UPDATE", isCorrect: true },
            { text: "Optimistic concurrency control with version checks", isCorrect: true },
            { text: "Reservation systems with TTL", isCorrect: true },
            { text: "Disabling database indexes", isCorrect: false },
            { text: "Adding more database connections", isCorrect: false }
          ]),
          hint: "Think about how to prevent or detect conflicting updates.",
          explanation: "Pessimistic locking, optimistic OCC, and reservations are all valid strategies. Disabling indexes or adding connections don't address contention directly.",
          topic: "consistency",
          difficulty: "ADVANCED"
        },
        {
          questionType: "ABSTRACT",
          question: "Compare ACID and BASE database models. When would you choose BASE over ACID?",
          hint: "Consider availability and scale requirements.",
          explanation: null,
          topic: "acid-base",
          difficulty: "ADVANCED"
        },
        {
          questionType: "SINGLE",
          question: "What is the purpose of a circuit breaker pattern?",
          options: JSON.stringify([
            { text: "To prevent database deadlocks", isCorrect: false },
            { text: "To stop cascading failures by failing fast when a service is unhealthy", isCorrect: true },
            { text: "To balance load across multiple servers", isCorrect: false },
            { text: "To encrypt data in transit", isCorrect: false }
          ]),
          hint: "Think about preventing system-wide failures.",
          explanation: "Circuit breakers prevent cascading failures by detecting when a service is struggling and short-circuiting requests to it, allowing the service time to recover instead of being overwhelmed.",
          topic: "reliability",
          difficulty: "ADVANCED"
        }
      ]
    },
    {
      weekNumber: 7,
      title: "The 7 SD Interview Patterns",
      description: "Master the 7 fundamental patterns that appear in most system design interviews.",
      topics: "scaling-reads,scaling-writes,long-running-tasks,real-time-updates,large-files,contention,multi-step",
      questions: [
        {
          questionType: "SINGLE",
          question: "What is the recommended order for scaling reads?",
          options: JSON.stringify([
            { text: "Cache → CDNs → Database → Read Replicas", isCorrect: false },
            { text: "Optimize DB → Read Replicas → Cache → CDN", isCorrect: true },
            { text: "CDN → Cache → Read Replicas → Optimize DB", isCorrect: false },
            { text: "Read Replicas → Cache → CDN → Optimize DB", isCorrect: false }
          ]),
          hint: "Start with the simplest solution first.",
          explanation: "Follow the progression: first optimize your database with proper indexing and connection pooling (often sufficient), then add read replicas, then cache for hot spots, and finally CDN for static content.",
          topic: "scaling-reads",
          difficulty: "INTERMEDIATE"
        },
        {
          questionType: "MULTIPLE",
          question: "Which are valid strategies for scaling writes? (Select all that apply)",
          options: JSON.stringify([
            { text: "Database sharding by partition key", isCorrect: true },
            { text: "Message queues to buffer writes", isCorrect: true },
            { text: "Batching multiple writes into single operations", isCorrect: true },
            { text: "Adding more memory to the database server", isCorrect: false },
            { text: "Hierarchical aggregation for extreme volumes", isCorrect: true }
          ]),
          hint: "Consider the patterns used by systems like YouTube.",
          explanation: "Sharding, queues, batching, and hierarchical aggregation are all valid write-scaling strategies. More memory alone doesn't help if writes are the bottleneck.",
          topic: "scaling-writes",
          difficulty: "ADVANCED"
        },
        {
          questionType: "SINGLE",
          question: "For the 'Scaling Reads' pattern, when is Redis cache most valuable?",
          options: JSON.stringify([
            { text: "When all data fits in a single database", isCorrect: false },
            { text: "When there are hot spots or expensive queries", isCorrect: true },
            { text: "When read replicas are available", isCorrect: false },
            { text: "When using NoSQL databases", isCorrect: false }
          ]),
          hint: "Cache excels when the same data is read repeatedly.",
          explanation: "Redis cache is most valuable for hot spots (frequently accessed data like celebrity profiles) and expensive queries (complex joins). These benefit most from avoiding repeated database work.",
          topic: "scaling-reads",
          difficulty: "INTERMEDIATE"
        },
        {
          questionType: "ABSTRACT",
          question: "Explain the Saga pattern for multi-step processes. How does it differ from traditional database transactions, and what are its trade-offs?",
          hint: "Consider distributed transactions and eventual consistency.",
          explanation: null,
          topic: "multi-step",
          difficulty: "ADVANCED"
        },
        {
          questionType: "DRAWING",
          question: "Draw the architecture for handling seat reservations in a ticket booking system. Show the reservation flow, expiration mechanism, and payment integration. Include how you handle concurrent booking attempts.",
          hint: "Use rectangles for components and show the reservation timeline.",
          explanation: null,
          topic: "contention",
          difficulty: "ADVANCED"
        },
        {
          questionType: "SINGLE",
          question: "What distinguishes a 'hot spot' problem in system design?",
          options: JSON.stringify([
            { text: "A database table with too many columns", isCorrect: false },
            { text: "A single piece of data accessed much more frequently than others, overwhelming replicas", isCorrect: true },
            { text: "A server running at maximum CPU capacity", isCorrect: false },
            { text: "An overly complex data model", isCorrect: false }
          ]),
          hint: "Think about popular content vs. average content.",
          explanation: "A hot spot occurs when a single piece of data (like a celebrity's profile) is accessed so frequently that even multiple replicas struggle. Cache is the solution here since replicas still need to serve the same expensive query.",
          topic: "scaling-reads",
          difficulty: "INTERMEDIATE"
        }
      ]
    },
    {
      weekNumber: 8,
      title: "Interview Mastery",
      description: "Perfect your interview performance with soft skills and communication.",
      topics: "requirements,trade-offs,pushback,whiteboard,communication,mock-interviews",
      questions: [
        {
          questionType: "SINGLE",
          question: "What should be the first step when given a system design interview question?",
          options: JSON.stringify([
            { text: "Start drawing the architecture diagram", isCorrect: false },
            { text: "Ask clarifying questions about requirements and scale", isCorrect: true },
            { text: "List all the technologies you know", isCorrect: false },
            { text: "Jump into database schema design", isCorrect: false }
          ]),
          hint: "Interviewers want to see you understand the problem first.",
          explanation: "Always start by gathering requirements: Who are the users? What's the scale? What's the read/write ratio? What are the functional and non-functional requirements? This shows product thinking.",
          topic: "requirements",
          difficulty: "BEGINNER"
        },
        {
          questionType: "MULTIPLE",
          question: "Which questions help clarify requirements in a system design interview? (Select all that apply)",
          options: JSON.stringify([
            { text: "Who are the users and what do they need?", isCorrect: true },
            { text: "What's the expected scale (users, requests, data volume)?", isCorrect: true },
            { text: "What's the read/write ratio?", isCorrect: true },
            { text: "What's the exact database schema?", isCorrect: false },
            { text: "What are the latency and availability requirements?", isCorrect: true }
          ]),
          hint: "Good requirements cover users, scale, and constraints.",
          explanation: "Users, scale, read/write ratio, and SLAs are all important clarifications. Exact schema comes later after understanding requirements.",
          topic: "requirements",
          difficulty: "BEGINNER"
        },
        {
          questionType: "ABSTRACT",
          question: "A interviewer pushes back on your design choice. How do you respond? Explain with specific examples of good and bad responses.",
          hint: "Show collaboration, not defensiveness.",
          explanation: null,
          topic: "communication",
          difficulty: "INTERMEDIATE"
        },
        {
          questionType: "DRAWING",
          question: "Draw an ideal system design whiteboard. Show: (1) User at the top, (2) Components with clear labels, (3) Data flow arrows, (4) Databases, (5) Caching layer. Make it readable and organized.",
          hint: "A good diagram tells a story.",
          explanation: null,
          topic: "whiteboard",
          difficulty: "INTERMEDIATE"
        },
        {
          questionType: "ABSTRACT",
          question: "You've designed a system using microservices. The interviewer asks 'Why not a monolith?' How would you defend microservices while acknowledging their complexity?",
          hint: "Show you understand trade-offs.",
          explanation: null,
          topic: "trade-offs",
          difficulty: "ADVANCED"
        },
        {
          questionType: "SINGLE",
          question: "When the interviewer says 'What if we need to support 10x the traffic?', what should you do?",
          options: JSON.stringify([
            { text: "Immediately redesign the entire system", isCorrect: false },
            { text: "Identify which components would be affected and discuss scaling strategies for those", isCorrect: true },
            { text: "Say you'd need more time to think about it", isCorrect: false },
            { text: "Add more servers to every component", isCorrect: false }
          ]),
          hint: "Show you can think incrementally about scaling.",
          explanation: "Identify the bottleneck (database? cache? load balancer?), then discuss specific scaling strategies. Don't redesign from scratch - show you understand where the system would break.",
          topic: "requirements",
          difficulty: "INTERMEDIATE"
        }
      ]
    }
  ]
};

async function main() {
  console.log("Seeding study plan...");

  // Delete existing study plan data
  await prisma.questionAttempt.deleteMany();
  await prisma.weekProgress.deleteMany();
  await prisma.studyQuestion.deleteMany();
  await prisma.studyWeek.deleteMany();
  await prisma.studyPlan.deleteMany();

  // Create study plan with weeks and questions
  const plan = await prisma.studyPlan.create({
    data: {
      title: studyPlanData.title,
      description: studyPlanData.description,
      duration: studyPlanData.duration,
      weeks: {
        create: studyPlanData.weeks.map((week) => ({
          weekNumber: week.weekNumber,
          title: week.title,
          description: week.description,
          topics: week.topics,
          questions: {
            create: week.questions.map((q) => ({
              questionType: q.questionType,
              question: q.question,
              options: q.options,
              hint: q.hint,
              explanation: q.explanation,
              topic: q.topic,
              difficulty: q.difficulty,
            })),
          },
        })),
      },
    },
  });

  console.log(`Created study plan: ${plan.id}`);
  console.log(`Total weeks: ${studyPlanData.weeks.length}`);
  const totalQuestions = studyPlanData.weeks.reduce(
    (acc, w) => acc + w.questions.length,
    0
  );
  console.log(`Total questions: ${totalQuestions}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
