registerSimple("system-design", {
"Design a distributed ID generator":
`Many servers need to create unique ids at the same time without asking a central database each time. A popular approach, Snowflake, builds a 64-bit number from the current time, a machine number and a counter, so every server can create ids on its own, they never clash, and they sort roughly by creation time.`,

"Design a distributed cache like Redis":
`A distributed cache keeps frequently used data in memory across many machines. Consistent hashing decides which machine holds each key, copies on other machines protect against a machine dying, and when memory is full the least recently used data is removed. The goal is very fast reads that take load off the database.`,

"Design a search / autocomplete system":
`As the user types, suggest popular matches within about 100 milliseconds. Store popular search phrases in a structure built for prefix lookups (a trie) with the top suggestions saved at each prefix, keep it in memory and cache results, and update popularity from search logs in the background.`,

"Design a payment processing system":
`Payments must never be charged twice and never lost. Use idempotency keys so retries are safe, record every money movement in a ledger that is only ever added to, call payment providers with timeouts and retries, and regularly compare your records with the provider's (reconciliation) to catch anything that slipped through.`,

"How do you design for observability from the start?":
`Observability means being able to answer "what is going wrong, and why?" from the outside. From day one, emit structured logs, metrics (rates, errors and durations) and traces, all sharing a trace id, and set alerts based on what users actually feel, such as error rates and slow responses.`,

"Design a ride-hailing / delivery matching system":
`The key problem is quickly finding nearby drivers while they constantly move. Drivers send their location every few seconds; the map is split into cells (using geohash or H3) so you only search nearby cells; drivers are kept in memory by cell; and matching offers a ride to the best nearby driver.`,

"How do you estimate and plan capacity for a new service?":
`Start from users and work forward: daily users × actions per user = requests per day; divide by 86,400 for an average per second, then multiply for peak hours. Measure what one server can handle, divide to get how many servers you need, and add headroom. Do the same for storage.`,

"Design a food delivery system like Swiggy or Zomato":
`Main parts: restaurant search by location, a menu and cart, ordering with payment, matching a delivery partner, and live order tracking. Each can be its own service. Key challenges are finding nearby restaurants and riders quickly, handling dinner-time peaks, and sending live location updates to customers.`,

"Design a scalable notification system for 50 million users":
`Accept notification requests, store them, and put them on queues per channel (push, SMS, email). Worker pools send them through providers, with retries and limits per user. Respect user preferences, remove duplicates, and keep urgent messages (such as one-time passwords) on a fast lane separate from bulk marketing messages.`,

"How would you design a system to handle a flash sale or ticket booking?":
`Huge numbers of people want a few items at the same moment. Never let the database be hammered directly: queue users or hand out tokens, keep the stock count in a fast store with atomic decrements so you never oversell, hold items briefly while payment happens, and serve pages from caches and a CDN.`,

"What is the difference between vertical and horizontal partitioning, and when do you use each?":
`<b>Vertical partitioning</b> splits a table by columns, for example moving big, rarely used columns into a separate table. <b>Horizontal partitioning</b> (sharding) splits it by rows, for example customers 1 to 1 million in one database and the rest in another. Use vertical for wide tables and horizontal when there are too many rows for one machine.`,

"How do you design for idempotency across an entire distributed system?":
`In a distributed system you often cannot tell whether a request succeeded, so things get retried and duplicates happen. Make every step safe to repeat: give each request a unique key, record keys already processed, use unique database constraints, and design operations like "set status to PAID" rather than "add 100".`,

"How do you design a multi-region system, and what breaks?":
`Running in several regions keeps you online if one goes down and puts servers closer to users. Either one region is active and another waits as a backup, or several are active. What gets hard: keeping data in sync across long distances, deciding which region owns which data, and handling the same record being changed in two places.`,

"Design a URL shortener like bit.ly — walk through the whole design":
`Users submit a long URL and get a short code; visiting the code redirects to the long URL. Generate unique short codes (for example a counter turned into letters and digits), store code to URL in a fast key-value store, and cache popular codes, because there are far more redirects than new links.`,

"How do you design a rate limiter, and which algorithm would you choose?":
`A rate limiter caps how many requests a user can make in a period, to prevent abuse. The token bucket is the usual choice: it allows short bursts while capping the average rate. Keep the counters in a shared fast store such as Redis so every server agrees, and return 429 when the limit is reached.`,

"How do you scale a database — replication, sharding and caching?":
`Go step by step. First add indexes and tune slow queries. Then add a cache for popular reads, and read replicas to spread reading. Only when writes or data size outgrow one machine, shard the data across several databases. Each step adds complexity, so stop as soon as you have enough.`,

"Design a news feed like Twitter or Instagram":
`The key choice: build each user's feed when someone posts (push the post to all followers' feeds) or when the user opens the app (pull from everyone they follow). Push makes reading fast but is costly for celebrities with millions of followers, so most systems push for normal users and pull for celebrities.`,

"Design a distributed unique ID generator":
`Options: database auto-increment (simple but a single bottleneck), random UUIDs (no coordination but long and unordered), or a Snowflake-style scheme that combines time, machine number and a counter into a 64-bit number. Snowflake ids are unique, compact and sort by time, so they are the usual choice at scale.`,

"Back-of-the-envelope estimation — the numbers every design round expects":
`Quick rough maths that tells you the scale: users × actions per day ÷ 86,400 seconds gives requests per second; multiply by data per action to get storage per day. You also need a feel for key speeds: memory is about 1,000 times faster than a network call across the world. Round freely; the method matters more than precision.`,

"Design a chat system like WhatsApp or Slack":
`Clients keep a live connection (WebSocket) to chat servers. A message is saved, given an order number within its conversation, then pushed to recipients who are online, or sent as a push notification if they are offline. Delivery and read receipts are small messages travelling back the same way.`,

"Design a ride-hailing service like Uber":
`The hard part is matching riders with nearby drivers instantly while millions of drivers move. Drivers report their location every few seconds, the city is divided into small cells for fast "who is near" searches, and a matching service offers the trip to the best nearby driver, with trip state stored safely.`,

"Design a distributed job scheduler":
`Store jobs and their run times in a durable database. Several scheduler instances look for jobs that are due and claim them safely so each runs only once, then hand them to workers. Retry failures with waits, record the outcome of every run, and make jobs safe to run twice in case a worker crashes midway.`,

"Design an inventory and checkout system that never oversells":
`Correctness matters more than speed here. Decrease stock with a single conditional update ("reduce by 1 only if stock is above 0") so two buyers can never both take the last item, reserve items for a few minutes during payment, release them if payment fails, and use idempotency keys so retries do not double-order.`,

"How do you structure the first ten minutes of a system design interview?":
`Spend about five minutes clarifying requirements (what it must do, how many users, how fast it must be), two or three minutes estimating scale with rough numbers, and the rest sketching a simple high-level design. This shows clear thinking before you dive into any details.`,

"Design a URL shortener, end to end":
`Create a short unique code for each long URL, store the mapping, and redirect when someone visits the code. The main choices: how to generate codes (a counter turned into short text is simplest and never collides), where to store them (a key-value store), and caching, because links are read far more often than created.`,

"How do you make a distributed system resilient — timeouts, retries, circuit breakers and backpressure?":
`Every network call can be slow or fail. Use <b>timeouts</b> so you never wait forever, <b>retries</b> with growing waits for temporary errors, <b>circuit breakers</b> to stop calling a broken service, and <b>backpressure</b> to slow down or refuse work when you are overloaded, rather than collapsing.`,

"Design a web crawler":
`Start from a list of URLs, download each page, extract its links and add new ones to the list. The challenges: never visiting the same URL twice (use a set or a Bloom filter), being polite (not overloading any one website), spotting duplicate content, and spreading the work across many machines.`,

"Design a video streaming service like YouTube or Netflix":
`Uploading and watching are very different jobs. Uploads go into a background pipeline that converts each video into several quality levels and small chunks. Watching is served from CDN servers close to viewers, and the player switches quality up or down depending on the viewer's connection speed.`,

"Design a real-time leaderboard for 100 million players":
`Use a Redis sorted set, which keeps players ordered by score and can update a score or find a player's rank very quickly. With 100 million players, split it into several sorted sets by game mode or region, and store scores durably in a database as well, in case the in-memory data is lost.`,

"Design a file storage and sharing service like Google Drive or Dropbox":
`Split each file into chunks, name each chunk by the hash of its contents, and store chunks in object storage like S3. Then only changed chunks are uploaded, identical chunks are stored once, and uploads can resume. A separate database keeps file details, versions and sharing permissions, and devices are notified to sync changes.`,

"Design a metrics and monitoring system like Prometheus or Datadog":
`Collect numbers (CPU, request rates, errors) from many machines every few seconds, store them in a time-series database built for this kind of data and heavily compressed, keep less detail for older data, show dashboards, and run alert rules continuously. Watch out for labels with unlimited values, such as user ids, which explode the amount of data.`,

"How do you approach a system design interview?":
`Follow a clear structure: clarify requirements, estimate the scale, sketch a high-level design, go deep on the most important or difficult part, then discuss bottlenecks, failures and trade-offs. Think out loud, so the interviewer sees your reasoning, not just the final diagram.`,

"What numbers should you memorise for capacity estimation?":
`Useful rough figures: reading memory takes about 100 nanoseconds, an SSD read about 100 microseconds, a network round trip inside a data centre about half a millisecond, and across continents around 150 milliseconds. There are 86,400 seconds in a day, about 2.5 million in a month. These let you sanity-check designs quickly.`,

"Explain the CAP theorem and PACELC":
`<b>CAP</b>: when the network between servers breaks, a distributed system must choose between staying consistent (refusing some requests) and staying available (answering, but possibly with stale data). <b>PACELC</b> adds that even when the network is fine, there is a constant trade-off between speed (latency) and consistency.`,

"How does caching work and what are the caching strategies?":
`A cache keeps copies of frequently used data in fast memory. The common strategy, cache-aside, is: check the cache first; if the data is missing, read the database and store it in the cache. Others write to the cache and the database together. The hard parts are keeping cached data fresh and avoiding a rush of requests when a popular entry expires.`,

"What is load balancing and what algorithms exist?":
`A load balancer spreads incoming requests across several servers and stops sending to any that fail their health checks. Common methods: <b>round robin</b> (take turns), <b>least connections</b> (send to the least busy server), and <b>hashing</b> (the same user always goes to the same server).`,

"How do you scale a database?":
`In order: tune queries and add indexes, add a cache, add read replicas for read-heavy loads, split data by feature into separate databases, and only then shard (split rows across many databases). Each step adds complexity, so most systems never need the last one.`,

"SQL vs NoSQL — how do you choose?":
`Choose <b>SQL</b> (PostgreSQL, MySQL) when your data has clear relationships and you need transactions and flexible queries; it is the safe default. Choose <b>NoSQL</b> when you need huge scale on simple access patterns, flexible document shapes, or very high write volumes, accepting fewer guarantees and fewer query options.`,

"Design a URL shortener (like bit.ly)":
`Store a mapping from a short code to the original URL, generate codes that never clash (for example a counter turned into short text), and redirect visitors quickly. Since reads far outnumber writes, cache popular codes in memory. Optionally add custom aliases, expiry dates and click statistics.`,

"Design a rate limiter":
`Limit how many requests each user, API key or IP can make in a period. Use a token bucket or sliding window algorithm, keep the counters in Redis so all servers share them, make the check very fast because it runs on every request, and return 429 Too Many Requests when the limit is exceeded.`,

"Design a news feed (like Twitter/Instagram)":
`Decide when to build each feed. "Fan-out on write" adds a new post to every follower's feed immediately, so reading is fast. "Fan-out on read" collects posts from everyone you follow when you open the app. Most real systems combine them: push for normal accounts, pull for celebrities with huge followings.`,

"Design a chat application (like WhatsApp)":
`Users keep a live WebSocket connection to chat servers. Messages are stored durably, ordered within each conversation, delivered instantly to online users and through push notifications to offline ones. Track which server each user is connected to, and send delivery and read receipts as small messages back to the sender.`,

"What is consistent hashing and why does it matter?":
`With simple "hash(key) mod number of servers", adding or removing one server moves almost every key, which empties a cache all at once. Consistent hashing places servers and keys on a circle so that adding or removing a server only moves the keys next to it. It is used in distributed caches and databases.`,

"How do you design for high availability?":
`High availability means the system keeps working when parts fail. Remove single points of failure by running several copies of everything, spread them across availability zones, use health checks with automatic failover, replicate data, and test failures on purpose. Each extra "nine" of uptime (99.9% to 99.99%) costs much more.`,

"What is the difference between horizontal and vertical scaling?":
`<b>Vertical scaling</b> means a bigger machine: more CPU and memory. It is simple, but there is a ceiling and it is a single point of failure. <b>Horizontal scaling</b> means more machines sharing the work behind a load balancer. It can grow almost without limit, but your application must be designed to run as many copies.`,

"How would you design a notification system?":
`Accept notification requests through an API, check user preferences and opt-outs, render the message from a template, and put it on a queue for its channel (push, SMS, email). Workers send through providers with retries, remove duplicates, limit how many messages each user gets, and record delivery status.`,

"What is eventual consistency and how do you design around it?":
`Eventual consistency means copies of data may disagree for a short time but will catch up. Design around it by showing users their own changes immediately (reading your own writes from the main copy), showing "processing" states, making operations safe to repeat, and only requiring strict consistency where it truly matters, such as money.`,

"How do you design a system for multi-tenancy?":
`Multi-tenancy means many customers (tenants) share one system. You can give each tenant its own database (strongest isolation, most expensive), its own schema, or share tables with a tenant id on every row (cheapest, but every query must filter by tenant). Also stop one big tenant from using up everyone else's resources.`
});
