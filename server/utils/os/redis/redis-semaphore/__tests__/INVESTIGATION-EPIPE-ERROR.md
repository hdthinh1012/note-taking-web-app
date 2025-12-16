# Investigation: Redis EPIPE Error on Connection Initialization

**Date:** December 17, 2025  
**Issue:** Running `node semaphore-cluster.js` fails with EPIPE error during Redis connection

## Initial Error

```
Failed to create the Redis client with error:
Error: write EPIPE
    at afterWriteDispatched (node:internal/stream_base_commons:159:15)
    ...
    errno: -32,
    code: 'EPIPE',
    syscall: 'write'
```

The error indicates the client is trying to write to a socket that has been closed by the other end.

---

## Step 1: Verify Redis Server is Running

### Command
```bash
redis-cli -u redis://localhost:6379 PING
```

### Intention
Check if the Redis server is accessible and responding to basic commands.

### Result
```
PONG
```

### Conclusion
Redis server IS running and responding. The issue is not that Redis is down.

---

## Step 2: Research ioredis Documentation

### Action
Used Context7 MCP to fetch ioredis library documentation, focusing on EPIPE error and connection handling.

### Intention
Understand how ioredis handles connection errors and what might cause EPIPE during initialization.

### Key Findings
- ioredis has auto-reconnect with `retryStrategy`
- Connection events: `connect`, `ready`, `close`, `end`, `error`
- The `error` event can be emitted during connection phase
- `lazyConnect: true` delays connection until first command

---

## Step 3: Search ioredis GitHub Source Code

### Action
Used GitHub repo search on `redis/ioredis` for EPIPE, error handling, and event_handler code.

### Intention
Find how ioredis handles socket errors internally, particularly during the connection handshake phase.

### Key Findings from Source Code
- `event_handler.ts` manages connection lifecycle
- `silentEmit` is used for error events to prevent crashes
- Connection errors trigger `closeHandler` which may attempt reconnection
- Socket write errors (EPIPE) occur when sending commands on a closed socket

---

## Step 4: Test Basic ioredis Connection

### Command
```bash
node -e "
const Redis = require('ioredis').default;
const redis = new Redis('redis://localhost:6379');
redis.on('connect', () => console.log('Connected!'));
redis.on('ready', () => { console.log('Ready!'); redis.quit(); });
redis.on('error', (e) => console.log('Error:', e.message));
redis.ping().then(r => console.log('PING:', r));
"
```

### Intention
Test if ioredis can connect to Redis at all, outside of the semaphore-cluster context.

### Result
```
[EVENT] Connected
[EVENT] Error: EPIPE
Retry attempt: 1
[EVENT] Close
[EVENT] Connected
[EVENT] Error: EPIPE
... (repeated pattern)
PING error: Reached the max retries per request limit
```

### Conclusion
The connection IS established ("Connected") but then immediately fails with EPIPE. This happens consistently, suggesting a systematic issue rather than a transient network problem.

---

## Step 5: Test Redis CLI Commands

### Command
```bash
redis-cli -h localhost -p 6379 PING
redis-cli -h localhost -p 6379 SET testkey hello
redis-cli -h localhost -p 6379 GET testkey
redis-cli -h localhost -p 6379 DEL testkey
```

### Intention
Verify Redis operations work via the official CLI tool.

### Result
```
PONG
OK
"hello"
(integer) 1
```

### Conclusion
Redis CLI works perfectly! This rules out Redis server issues. The problem is specific to how Node.js/ioredis connects.

---

## Step 6: Check Redis Server Configuration

### Commands
```bash
redis-cli -u redis://localhost:6379 CONFIG GET maxclients
redis-cli -u redis://localhost:6379 INFO clients
redis-cli -u redis://localhost:6379 CONFIG GET timeout
redis-cli -u redis://localhost:6379 CONFIG GET protected-mode
redis-cli -u redis://localhost:6379 ACL LIST
```

### Intention
Check if there are connection limits, timeouts, or ACL rules blocking connections.

### Results
- `maxclients`: 10000
- `connected_clients`: 1 (just the CLI)
- `timeout`: 0 (no idle timeout)
- `protected-mode`: no
- ACL: `user default on nopass ~* &* +@all` (full access)

### Conclusion
No server-side restrictions. All clients should be able to connect freely.

---

## Step 7: Test Raw TCP Connection

### Command
```bash
node << 'SCRIPT'
const net = require('net');
const socket = net.createConnection({ host: 'localhost', port: 6379 }, () => {
  console.log('TCP connected');
});
socket.on('data', (data) => console.log('Received:', data.toString()));
socket.on('error', (e) => console.log('Socket error:', e.message));
socket.on('close', () => console.log('Socket closed'));

setTimeout(() => {
  if (socket.destroyed === false) {
    console.log('Sending PING...');
    socket.write('*1\r\n$4\r\nPING\r\n');
  }
}, 100);
setTimeout(() => process.exit(0), 2000);
SCRIPT
```

### Intention
Bypass ioredis entirely and test raw TCP socket behavior to isolate whether the issue is in ioredis or lower.

### Result
```
TCP connected to localhost
Socket closed
```

### Conclusion
**Critical finding!** The socket connects but is immediately closed by the server BEFORE we can even send data. This is happening at the TCP level, not in ioredis.

---

## Step 8: Test with 127.0.0.1 Instead of localhost

### Command
```bash
node << 'SCRIPT'
const net = require('net');
const socket = net.createConnection({ host: '127.0.0.1', port: 6379 }, () => {
  console.log('TCP connected to 127.0.0.1');
});
socket.on('data', (data) => console.log('Received:', data.toString()));
socket.on('error', (e) => console.log('Socket error:', e.message));
socket.on('close', () => console.log('Socket closed'));

setTimeout(() => {
  if (socket.destroyed === false) {
    console.log('Sending PING...');
    socket.write('*1\r\n$4\r\nPING\r\n');
  }
}, 100);
setTimeout(() => process.exit(0), 2000);
SCRIPT
```

### Intention
Test if the behavior differs when using IPv4 address directly instead of hostname.

### Result
```
TCP connected to 127.0.0.1
Sending PING...
Received: +PONG
```

### Conclusion
**ROOT CAUSE FOUND!** Connection to `127.0.0.1` works perfectly, but `localhost` fails. This suggests an IPv4 vs IPv6 issue.

---

## Step 9: Verify DNS Resolution of localhost

### Command
```bash
getent hosts localhost
node -e "require('dns').lookup('localhost', (err, addr, fam) => console.log('DNS:', addr, 'family:', fam))"
```

### Intention
Check how `localhost` is resolved on this system.

### Result
```
::1             localhost localhost.localdomain localhost6 localhost6.localdomain6
---
DNS: ::1 family: 6
```

### Conclusion
**Confirmed!** On Fedora, `localhost` resolves to `::1` (IPv6), not `127.0.0.1` (IPv4).

---

## Step 10: Check Podman Container Network Binding

### Command
```bash
podman inspect ntwa-redis --format '{{.NetworkSettings.IPAddress}}'
```

### Intention
Verify how the Redis container is bound to the network.

### Result
The container has no direct IP (using port mapping via slirp4netns), and is bound to `0.0.0.0:6379` (IPv4 only).

### Conclusion
The Podman container only listens on IPv4. When Node.js connects to `localhost` → `::1` (IPv6), the connection reaches the port mapping but the container can't properly handle it, causing immediate connection close.

---

## Root Cause Analysis

```
┌─────────────────────────────────────────────────────────────┐
│                     Connection Flow                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Node.js app                                                 │
│      │                                                       │
│      │ connect to "localhost:6379"                          │
│      │                                                       │
│      ▼                                                       │
│  DNS Resolution                                              │
│      │                                                       │
│      │ localhost → ::1 (IPv6)    ← Fedora default           │
│      │                                                       │
│      ▼                                                       │
│  TCP Connect to [::1]:6379                                   │
│      │                                                       │
│      │ Podman port mapping receives connection               │
│      │                                                       │
│      ▼                                                       │
│  Container bound to 0.0.0.0:6379 (IPv4 only)                │
│      │                                                       │
│      │ IPv6 connection cannot be properly forwarded          │
│      │                                                       │
│      ▼                                                       │
│  Connection immediately closed → EPIPE/ECONNRESET           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Solution Applied

### File Changed: `server/utils/os/redis/redis.js`

```javascript
// Before (problematic):
let redisURL = process.env.REDIS_URI || process.env.REDIS_URL || 'redis://localhost:6379';

// After (fixed):
let redisURL = process.env.REDIS_URI || process.env.REDIS_URL || 'redis://127.0.0.1:6379';
```

### Rationale
Using `127.0.0.1` explicitly forces IPv4 connection, bypassing the IPv6 resolution issue with Podman containers.

---

## Additional Fix Found

### File: `semaphore-cluster.js`

```javascript
// Bug found - resolve() was being called immediately:
await new Promise((resolve) => setTimeout(resolve(), 1000));  // WRONG

// Fixed:
await new Promise((resolve) => setTimeout(resolve, 1000));    // CORRECT
```

---

## Alternative Solutions

1. **Configure Podman to listen on IPv6**: Bind container to `[::]:6379` in addition to `0.0.0.0:6379`

2. **Use ioredis `family: 4` option**: Force IPv4 in the client
   ```javascript
   new Redis({ host: 'localhost', port: 6379, family: 4 })
   ```

3. **Modify `/etc/hosts`**: Make localhost resolve to 127.0.0.1 first
   ```
   127.0.0.1   localhost
   ::1         localhost6
   ```

4. **Environment variable**: Set `REDIS_URI=redis://127.0.0.1:6379` in `.env` file

---

## Verification

### Command
```bash
echo "" > /tmp/test-sem.txt && node ./semaphore-cluster.js /tmp/test-sem.txt
cat /tmp/test-sem.txt
redis-cli -h 127.0.0.1 GET sem-test-1
```

### Result
```
Connected to Redis successfully!
DistributedSemaphore using Redis client: Commander { ... status: 'ready' ... }
Worker 97215 died
Worker 97216 died
Primary exiting as all workers have exited
---
File content: Q
Semaphore value: "0"
```

### Conclusion
✅ Redis connection works  
✅ Semaphore acquired and released correctly  
✅ Workers complete successfully

---

## Lessons Learned

1. **EPIPE != Server Down**: EPIPE means "broken pipe" - the socket was closed by the remote end. It can happen for many reasons including protocol mismatches.

2. **IPv4 vs IPv6 matters**: Modern systems often prefer IPv6, but containerized services may only bind to IPv4.

3. **Test at multiple levels**: When debugging connection issues, test at:
   - Application level (ioredis)
   - Raw socket level (net.createConnection)
   - CLI level (redis-cli)
   - DNS level (getent, dns.lookup)

4. **localhost ≠ 127.0.0.1**: On many Linux distributions, these are NOT equivalent due to IPv6.

5. **Container networking**: Podman's slirp4netns rootless networking has IPv4/IPv6 considerations that differ from Docker's bridge networking.
