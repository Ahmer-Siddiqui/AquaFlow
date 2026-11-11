# Rule 07: Node.js Performance, Concurrency & Background Processing

## ⚡ Concurrency & Event Loop Rules

1. **Non-Blocking I/O**:
   - Never execute synchronous CPU-intensive operations (e.g. `fs.readFileSync`, long regex loops) on the main event loop.
   - Use streaming or worker threads for heavy PDF invoice generation.

2. **Database Connection Pooling**:
   - PostgreSQL connection pool size must be tuned for production (default pool sizing with Prisma: `connection_limit = 10` per Node process).
   - Use PgBouncer in transaction pooling mode for high concurrency.

3. **Background Job Processing with BullMQ & Redis**:
   - Long-running or scheduled tasks (e.g. generating tomorrow's recurring subscription orders, dispatching email invoices, sending low-stock notifications) must run via **BullMQ queues**.
   - Workers must be idempotent: include a deterministic `jobId` (e.g., `sub-${subscriptionId}-${date}`) so a duplicate job trigger does not generate duplicate orders or charges.

4. **Real-Time WebSockets (Socket.IO)**:
   - Namespace rooms by tenant: `socket.join(`tenant:${businessId}`);`.
   - Namespace delivery rooms: `socket.join(`delivery:${deliveryId}`);`.
   - Never broadcast tenant events globally across all connected sockets.

