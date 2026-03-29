export interface Lesson {
  id: string;
  title: string;
  description: string;
  topics: string[];
  icon: string;
  resources: LessonResource[];
}

export interface LessonResource {
  title: string;
  url: string;
  source: string;
}

export interface LessonContentBlock {
  type: "h2" | "h3" | "p" | "code" | "list" | "table";
  content?: string;
  items?: string[];
  language?: string;
  headers?: string[];
  rows?: string[][];
}

export const LESSONS: Lesson[] = [
  {
    id: "client-server",
    title: "Client-Server Architecture",
    description: "Understanding the fundamental client-server model and how web applications communicate.",
    topics: ["client-server", "http", "rest", "api"],
    icon: "🌐",
    resources: [
      {
        title: "Client-Server Overview",
        url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/First_steps/Client-Server_overview",
        source: "MDN Web Docs",
      },
      {
        title: "How the Web Works",
        url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works",
        source: "MDN Web Docs",
      },
      {
        title: "Overview of HTTP",
        url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview",
        source: "MDN Web Docs",
      },
      {
        title: "HTTP Guides",
        url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides",
        source: "MDN Web Docs",
      },
      {
        title: "REST API Tutorial",
        url: "https://restfulapi.net/",
        source: "restfulapi.net",
      },
    ],
  },
  {
    id: "databases",
    title: "Database Fundamentals",
    description: "SQL vs NoSQL, indexing, replication, and sharding strategies.",
    topics: ["database", "sql", "nosql", "indexing", "replication", "sharding"],
    icon: "🗄️",
    resources: [
      {
        title: "Path to Scaling",
        url: "https://planetscale.com/learn/courses/database-scaling/scaling/path-to-scaling",
        source: "PlanetScale",
      },
      {
        title: "Database Replication",
        url: "https://planetscale.com/learn/courses/database-scaling/scaling/replication",
        source: "PlanetScale",
      },
      {
        title: "Sharding Strategies",
        url: "https://planetscale.com/blog/types-of-sharding",
        source: "PlanetScale",
      },
      {
        title: "Database Sharding",
        url: "https://planetscale.com/blog/database-sharding",
        source: "PlanetScale",
      },
      {
        title: "Vertical Sharding",
        url: "https://planetscale.com/learn/courses/database-scaling/sharding/vertical-sharding",
        source: "PlanetScale",
      },
      {
        title: "Sharding vs Partitioning",
        url: "https://planetscale.com/blog/sharding-vs-partitioning-whats-the-difference",
        source: "PlanetScale",
      },
    ],
  },
  {
    id: "caching",
    title: "Caching Strategies",
    description: "Cache-aside, write-through, and how to handle cache invalidation.",
    topics: ["caching", "cache-aside", "redis", "memcached"],
    icon: "⚡",
    resources: [
      {
        title: "Optimize Your Cache for Fast, Fresh Data",
        url: "https://redis.io/guides/optimize-your-cache-for-fast-fresh-and-in-sync-data/",
        source: "Redis",
      },
      {
        title: "Key Eviction Policies",
        url: "https://redis.io/docs/latest/develop/reference/eviction",
        source: "Redis",
      },
      {
        title: "Client-Side Caching Introduction",
        url: "https://redis.io/docs/latest/develop/clients/client-side-caching/",
        source: "Redis",
      },
      {
        title: "Cache REST API Responses with Node.js and Redis",
        url: "https://redis.io/learn/howtos/caching/",
        source: "Redis",
      },
      {
        title: "Redis Anti-Patterns",
        url: "https://redis.io/tutorials/redis-anti-patterns-every-developer-should-avoid/",
        source: "Redis",
      },
    ],
  },
  {
    id: "load-balancing",
    title: "Load Balancing",
    description: "Horizontal scaling, load balancer algorithms, and session management.",
    topics: ["load-balancing", "horizontal-scaling", "round-robin", "consistent-hashing"],
    icon: "⚖️",
    resources: [
      {
        title: "HTTP Load Balancing",
        url: "https://docs.nginx.com/nginx/admin-guide/load-balancer/http-load-balancer/",
        source: "NGINX",
      },
      {
        title: "HTTP Health Checks",
        url: "https://docs.nginx.com/nginx/admin-guide/load-balancer/http-health-check",
        source: "NGINX",
      },
      {
        title: "Global Server Load Balancing",
        url: "https://docs.nginx.com/nginx/deployment-guides/global-server-load-balancing",
        source: "NGINX",
      },
      {
        title: "Load Balancing Node.js Servers",
        url: "https://docs.nginx.com/nginx/deployment-guides/load-balance-third-party/node-js",
        source: "NGINX",
      },
      {
        title: "Scaling Control Plane and Data Plane",
        url: "https://docs.nginx.com/nginx-gateway-fabric/how-to/scaling",
        source: "NGINX",
      },
    ],
  },
  {
    id: "messaging-queues",
    title: "Message Queues & Async Communication",
    description: "Kafka, SQS, pub/sub patterns, and handling distributed workflows.",
    topics: ["messaging-queues", "kafka", "sqs", "pub-sub", "sync-async"],
    icon: "📬",
    resources: [
      {
        title: "Apache Kafka Documentation",
        url: "https://kafka.apache.org/documentation/",
        source: "Apache Kafka",
      },
      {
        title: "Kafka Architecture",
        url: "https://kafka.apache.org/28/streams/architecture/",
        source: "Apache Kafka",
      },
      {
        title: "Kafka Design",
        url: "https://kafka.apache.org/42/design/design/",
        source: "Apache Kafka",
      },
      {
        title: "Kafka Use Cases",
        url: "https://kafka.apache.org/42/getting-started/uses/",
        source: "Apache Kafka",
      },
      {
        title: "KRaft vs ZooKeeper",
        url: "https://kafka.apache.org/41/getting-started/zk2kraft/",
        source: "Apache Kafka",
      },
    ],
  },
  {
    id: "real-time",
    title: "Real-Time Communication",
    description: "WebSockets, Server-Sent Events, and handling persistent connections.",
    topics: ["real-time", "websockets", "sse"],
    icon: "🔄",
    resources: [
      {
        title: "Server-Sent Events Overview",
        url: "https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events",
        source: "MDN Web Docs",
      },
      {
        title: "Using Server-Sent Events",
        url: "https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events",
        source: "MDN Web Docs",
      },
      {
        title: "WebSocket API",
        url: "https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API",
        source: "MDN Web Docs",
      },
      {
        title: "Writing WebSocket Servers",
        url: "https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers",
        source: "MDN Web Docs",
      },
      {
        title: "Writing WebSocket Client Applications",
        url: "https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications",
        source: "MDN Web Docs",
      },
    ],
  },
  {
    id: "cap-theorem",
    title: "CAP Theorem & Consistency",
    description: "Understanding trade-offs between consistency, availability, and partition tolerance.",
    topics: ["cap-theorem", "consistency", "eventual-consistency", "acid-base"],
    icon: "🎯",
    resources: [
      {
        title: "Eventual Consistency Today",
        url: "https://amplab.cs.berkeley.edu/publication/eventual-consistency-today-limitations-extensions-and-beyond",
        source: "UC Berkeley AMPLab",
      },
      {
        title: "HAT, not CAP: Towards Highly Available Transactions",
        url: "https://amplab.cs.berkeley.edu/publication/hat-not-cap-towards-highly-available-transactions",
        source: "UC Berkeley AMPLab",
      },
      {
        title: "The Network is Reliable",
        url: "https://amplab.cs.berkeley.edu/publication/the-network-is-reliable",
        source: "UC Berkeley AMPLab",
      },
      {
        title: "Bolt-on Causal Consistency",
        url: "https://amplab.cs.berkeley.edu/publication/bolt-on-causal-consistency",
        source: "UC Berkeley AMPLab",
      },
      {
        title: "An Overview of the CALM Theorem",
        url: "https://rise.cs.berkeley.edu/blog/an-overview-of-the-calm-theorem/",
        source: "RISE Lab",
      },
    ],
  },
  {
    id: "file-upload",
    title: "File Upload & Storage",
    description: "Direct uploads to cloud storage, presigned URLs, and handling large files.",
    topics: ["file-upload", "cdn"],
    icon: "📁",
    resources: [
      {
        title: "Implementing Secure File Uploads to S3 at the Edge",
        url: "https://aws.amazon.com/blogs/networking-and-content-delivery/implementing-secure-file-uploads-to-amazon-s3-at-the-edge-choosing-the-right-pattern/",
        source: "AWS",
      },
      {
        title: "Using AWS Edge to Optimize Object Uploads to S3",
        url: "https://aws.amazon.com/blogs/networking-and-content-delivery/using-aws-edge-to-optimize-object-uploads-to-amazon-s3/",
        source: "AWS",
      },
      {
        title: "Secure File Sharing with Presigned URLs",
        url: "https://aws.amazon.com/blogs/security/how-to-securely-transfer-files-with-presigned-urls/",
        source: "AWS",
      },
      {
        title: "Uploading Large Objects to S3 with Multipart Upload",
        url: "https://aws.amazon.com/blogs/compute/uploading-large-objects-to-amazon-s3-using-multipart-upload-and-transfer-acceleration/",
        source: "AWS",
      },
      {
        title: "Patterns for Building an API to Upload Files to S3",
        url: "https://aws.amazon.com/blogs/compute/patterns-for-building-an-api-to-upload-files-to-amazon-s3/",
        source: "AWS",
      },
      {
        title: "Uploading to S3 Directly from Web or Mobile",
        url: "https://aws.amazon.com/blogs/compute/uploading-to-amazon-s3-directly-from-a-web-or-mobile-application/",
        source: "AWS",
      },
      {
        title: "Securing S3 Presigned URLs for Serverless",
        url: "https://aws.amazon.com/blogs/compute/securing-amazon-s3-presigned-urls-for-serverless-applications",
        source: "AWS",
      },
    ],
  },
];
