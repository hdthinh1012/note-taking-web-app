# Simplified Integration Test Plan: DistributedSemaphore

## Core Idea: Spy + Redis Validator Queue

The simplest approach:
1. **SpyOn** `markSsoAsVerified` (the critical section)
2. Inside the spy, **push PID to Redis queue on entry, pop on exit**
3. **Check queue length** is always ≤ semaphore limit

No complex monitor classes, no worker orchestration - just spy and validate!

---

## Simplified Architecture

```javascript
// SpyOn markSsoAsVerified
jest.spyOn(ssoRepository, 'markSsoAsVerified')
    .mockImplementation(async (uuid) => {
        const pid = process.pid;
        
        // ENTER: Push to Redis queue and check atomically
        await redis.eval(`
            local pid = ARGV[1]
            local limit = tonumber(ARGV[2])
            
            -- Push to executing queue
            redis.call('RPUSH', 'test:executing', pid)
            
            -- Check count
            local count = redis.call('LLEN', 'test:executing')
            
            -- Record violation if over limit
            if count > limit then
                redis.call('RPUSH', 'test:violations', 
                    string.format('Violation: %d processes at %s', count, ARGV[3]))
            end
            
            -- Update max concurrent
            local max = tonumber(redis.call('GET', 'test:max_concurrent') or '0')
            if count > max then
                redis.call('SET', 'test:max_concurrent', count)
            end
            
            return count
        `, 0, pid, SEMAPHORE_PERMITS, Date.now());
        
        // SIMULATE WORK
        await new Promise(r => setTimeout(r, 100));
        
        // EXIT: Remove from Redis queue
        await redis.lrem('test:executing', 1, pid);
        
        return [1]; // Sequelize update response
    });
```

---

## Files to Create

### 1. Docker Setup for Redis Test Container

#### Directory: `server/__tests__/integration/docker/redis/`

##### `Dockerfile`
```dockerfile
FROM redis:latest

# Expose port 6380 instead of default 6379
EXPOSE 6380

# Use custom redis.conf
COPY redis.conf /usr/local/etc/redis/redis.conf

CMD ["redis-server", "/usr/local/etc/redis/redis.conf"]
```

##### `redis.conf`
```conf
# Bind to all interfaces for testing
bind 0.0.0.0

# Listen on port 6380
port 6380

# Disable persistence for testing (faster)
save ""
appendonly no

# Logging
loglevel notice
logfile ""

# Max memory policy
maxmemory 256mb
maxmemory-policy allkeys-lru
```

##### `docker-compose.yml`
```yaml
version: '3.8'

services:
  redis-test:
    build: .
    container_name: redis-test-semaphore
    ports:
      - "6380:6380"
    networks:
      - test-network
    healthcheck:
      test: ["CMD", "redis-cli", "-p", "6380", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

networks:
  test-network:
    driver: bridge
```

##### `start.ps1`
```powershell
# Start Redis test container
Write-Host "Starting Redis test container..."
docker-compose up -d

# Wait for Redis to be ready
Write-Host "Waiting for Redis to be ready..."
$maxAttempts = 30
$attempt = 0

while ($attempt -lt $maxAttempts) {
    $result = docker exec redis-test-semaphore redis-cli -p 6380 ping 2>$null
    if ($result -eq "PONG") {
        Write-Host "✅ Redis is ready!"
        exit 0
    }
    $attempt++
    Write-Host "Attempt $attempt/$maxAttempts..."
    Start-Sleep -Seconds 1
}

Write-Host "❌ Redis failed to start"
exit 1
```

##### `stop.ps1`
```powershell
# Stop and remove Redis test container
Write-Host "Stopping Redis test container..."
docker-compose down -v
Write-Host "✅ Redis container stopped"
```

---

### 2. Test Redis Client

**File**: `server/utils/os/redis/redis-test.js`

```javascript
const Redis = require('ioredis');

let testRedisClient = null;

/**
 * Initialize Redis client for integration testing
 * @param {Object} options - Redis connection options
 * @returns {Redis} Redis client instance
 */
function initializeTestRedisClient(options = {}) {
    if (testRedisClient && testRedisClient.status === 'ready') {
        return testRedisClient;
    }

    testRedisClient = new Redis({
        host: options.host || 'localhost',
        port: options.port || 6380,
        retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
        ...options
    });

    testRedisClient.on('error', (err) => {
        console.error('Test Redis Client Error:', err);
    });

    testRedisClient.on('connect', () => {
        console.log('✅ Test Redis Client connected');
    });

    return testRedisClient;
}

/**
 * Close test Redis client
 */
async function closeTestRedisClient() {
    if (testRedisClient) {
        await testRedisClient.quit();
        testRedisClient = null;
        console.log('✅ Test Redis Client closed');
    }
}

/**
 * Flush all data from test Redis
 */
async function flushTestRedis() {
    if (testRedisClient && testRedisClient.status === 'ready') {
        await testRedisClient.flushall();
        console.log('✅ Test Redis flushed');
    }
}

module.exports = {
    initializeTestRedisClient,
    closeTestRedisClient,
    flushTestRedis,
    getTestRedisClient: () => testRedisClient
};
```

---

### 3. Simplified Integration Test

**File**: `server/__tests__/integration/distributed-semaphore-simple.integration.test.js`

```javascript
const cluster = require('cluster');
const { initializeTestRedisClient, closeTestRedisClient, flushTestRedis } = require('../../utils/os/redis/redis-test');
const DistributedSemaphore = require('../../utils/os/redis/redis-semaphore/distributed-semaphore').default;
const { ssoRepository } = require('../../modules/auth/repository/ssoRepository');
const uuid = require('uuid');
const { execSync } = require('child_process');

describe('DistributedSemaphore - Simplified Integration Test', () => {
    let redisClient;
    const WORKER_COUNT = 2;
    const SEMAPHORE_PERMITS = 1;
    const CONCURRENT_REQUESTS = 10;

    beforeAll(async () => {
        // Start Redis test container
        console.log('Starting Redis test container...');
        try {
            execSync('cd server/__tests__/integration/docker/redis && .\\start.ps1', {
                stdio: 'inherit',
                shell: 'powershell.exe'
            });
        } catch (error) {
            console.error('Failed to start Redis container:', error);
            throw error;
        }

        // Wait for Redis to be ready
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Initialize Redis client
        redisClient = initializeTestRedisClient({ port: 6380 });
        
        // Flush all test data
        await flushTestRedis();
    }, 60000);

    afterAll(async () => {
        // Close Redis connection
        await closeTestRedisClient();

        // Stop Redis test container
        console.log('Stopping Redis test container...');
        try {
            execSync('cd server/__tests__/integration/docker/redis && .\\stop.ps1', {
                stdio: 'inherit',
                shell: 'powershell.exe'
            });
        } catch (error) {
            console.error('Failed to stop Redis container:', error);
        }
    }, 30000);

    test('Semaphore prevents concurrent execution beyond permit limit', async () => {
        if (cluster.isMaster) {
            console.log('\n=== MASTER: Starting Simplified Test ===\n');

            // Clean validator queues
            await redisClient.del('test:executing');
            await redisClient.del('test:violations');
            await redisClient.del('test:max_concurrent');

            // Create test SSO entries
            const testUuids = [];
            for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
                const testUuid = uuid.v4();
                await ssoRepository.createSsoEntry({
                    uuid: testUuid,
                    userId: null,
                    type: 'email',
                    sso_account: `test${i}@example.com`,
                    verified: false,
                    verifyLink: `http://test/verify/${testUuid}`,
                    status: 'pending'
                });
                testUuids.push(testUuid);
            }

            console.log(`Created ${CONCURRENT_REQUESTS} test SSO entries`);

            // Fork workers
            const workers = [];
            for (let i = 0; i < WORKER_COUNT; i++) {
                const worker = cluster.fork({
                    WORKER_ID: i,
                    TEST_MODE: 'true',
                    REDIS_PORT: '6380',
                    SEMAPHORE_PERMITS: SEMAPHORE_PERMITS
                });
                workers.push(worker);
                console.log(`Forked worker ${worker.process.pid}`);
            }

            // Wait for workers to be ready
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Distribute UUIDs to workers
            console.log('\n=== Distributing UUIDs ===\n');
            const requestsPerWorker = Math.ceil(CONCURRENT_REQUESTS / WORKER_COUNT);
            
            workers.forEach((worker, idx) => {
                const startIdx = idx * requestsPerWorker;
                const endIdx = Math.min(startIdx + requestsPerWorker, CONCURRENT_REQUESTS);
                const workerUuids = testUuids.slice(startIdx, endIdx);
                
                worker.send({ type: 'PROCESS_UUIDS', uuids: workerUuids });
                console.log(`Sent ${workerUuids.length} UUIDs to worker ${worker.process.pid}`);
            });

            // Wait for all workers to complete
            await Promise.all(workers.map(worker => {
                return new Promise(resolve => {
                    worker.on('message', msg => {
                        if (msg.type === 'COMPLETE') {
                            console.log(`✅ Worker ${worker.process.pid} completed`);
                            resolve();
                        }
                    });
                });
            }));

            // Kill workers
            workers.forEach(worker => worker.kill());
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Get test results
            const violations = await redisClient.lrange('test:violations', 0, -1);
            const maxConcurrent = parseInt(await redisClient.get('test:max_concurrent') || '0');
            const executingCount = await redisClient.llen('test:executing');

            console.log('\n=== TEST RESULTS ===');
            console.log(`Max concurrent: ${maxConcurrent}`);
            console.log(`Semaphore limit: ${SEMAPHORE_PERMITS}`);
            console.log(`Violations: ${violations.length}`);
            console.log(`Still executing: ${executingCount}`);

            if (violations.length > 0) {
                console.log('\n=== VIOLATIONS ===');
                violations.forEach(v => console.log(v));
            }

            // Cleanup test SSO entries
            for (const testUuid of testUuids) {
                await ssoRepository.markSsoAsInvalid([testUuid]);
            }

            // Assertions
            expect(violations.length).toBe(0);
            expect(maxConcurrent).toBeLessThanOrEqual(SEMAPHORE_PERMITS);
            expect(executingCount).toBe(0);

            console.log('\n✅ TEST PASSED: No concurrency violations detected\n');

        } else {
            // ==================== WORKER PROCESS ====================
            const workerId = process.env.WORKER_ID;
            const semaphorePermits = parseInt(process.env.SEMAPHORE_PERMITS);
            
            console.log(`[Worker ${process.pid}] Started (ID: ${workerId})`);

            // Initialize worker Redis
            const workerRedis = initializeTestRedisClient({ port: 6380 });

            // Create semaphore
            const semaphore = new DistributedSemaphore({
                redisClient: workerRedis,
                key: 'test-semaphore',
                permits: semaphorePermits,
                timeout: 30000
            });

            // ==================== SPY ON CRITICAL SECTION ====================
            // This is the KEY PART: Spy with validator queue
            jest.spyOn(ssoRepository, 'markSsoAsVerified')
                .mockImplementation(async (uuid) => {
                    const pid = process.pid;
                    
                    // === ENTER CRITICAL SECTION (ATOMIC) ===
                    const enterScript = `
                        local pid = ARGV[1]
                        local limit = tonumber(ARGV[2])
                        local timestamp = ARGV[3]
                        
                        -- Push to executing queue
                        redis.call('RPUSH', 'test:executing', pid)
                        
                        -- Get current count
                        local count = redis.call('LLEN', 'test:executing')
                        
                        -- Update max concurrent
                        local currentMax = tonumber(redis.call('GET', 'test:max_concurrent') or '0')
                        if count > currentMax then
                            redis.call('SET', 'test:max_concurrent', count)
                        end
                        
                        -- Check violation
                        if count > limit then
                            local executing = redis.call('LRANGE', 'test:executing', 0, -1)
                            local violation = string.format(
                                'VIOLATION at %s: %d processes (limit: %d) - PIDs: [%s]',
                                timestamp, count, limit, table.concat(executing, ', ')
                            )
                            redis.call('RPUSH', 'test:violations', violation)
                            return 0  -- Violation
                        end
                        
                        return count  -- Return current count
                    `;
                    
                    const count = await workerRedis.eval(
                        enterScript,
                        0,
                        pid,
                        semaphorePermits,
                        Date.now()
                    );
                    
                    console.log(`[Worker ${pid}] ✅ ENTER critical section. Count: ${count}/${semaphorePermits} for UUID: ${uuid}`);
                    
                    if (count > semaphorePermits) {
                        console.error(`[Worker ${pid}] ⚠️ VIOLATION! ${count} > ${semaphorePermits}`);
                    }
                    
                    // === SIMULATE WORK ===
                    // This delay makes it more likely to catch concurrency issues
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    // === EXIT CRITICAL SECTION ===
                    await workerRedis.lrem('test:executing', 1, pid);
                    
                    const remaining = await workerRedis.llen('test:executing');
                    console.log(`[Worker ${pid}] ⬅️ EXIT critical section. Remaining: ${remaining}`);
                    
                    return [1]; // Mock Sequelize response
                });

            // Listen for UUIDs from master
            process.on('message', async (msg) => {
                if (msg.type === 'PROCESS_UUIDS') {
                    console.log(`[Worker ${process.pid}] Received ${msg.uuids.length} UUIDs to process`);
                    
                    // Process all UUIDs concurrently (stress test!)
                    await Promise.all(
                        msg.uuids.map(async (testUuid) => {
                            try {
                                // Acquire semaphore
                                console.log(`[Worker ${process.pid}] 🔒 Acquiring for ${testUuid}...`);
                                await semaphore.acquire();
                                
                                try {
                                    // Execute critical section with spy
                                    const ssoEntry = await ssoRepository.getSsoEntryByUuid(testUuid);
                                    if (!ssoEntry) throw new Error('Invalid UUID');
                                    if (ssoEntry.verified) throw new Error('Already verified');
                                    
                                    // This calls our spy!
                                    await ssoRepository.markSsoAsVerified(testUuid);
                                    
                                } finally {
                                    // Release semaphore
                                    await semaphore.release();
                                    console.log(`[Worker ${process.pid}] 🔓 Released for ${testUuid}`);
                                }
                            } catch (error) {
                                console.error(`[Worker ${process.pid}] ❌ Error processing ${testUuid}:`, error.message);
                            }
                        })
                    );
                    
                    // Notify master of completion
                    process.send({ type: 'COMPLETE' });
                }
            });
        }
    }, 120000); // 2 minute timeout
});
```

---

## How It Works

### Flow Diagram

```
Worker 1: UUID-1                    Worker 2: UUID-2
    ↓                                   ↓
semaphore.acquire()              semaphore.acquire()
    ↓                                   ↓
[BLOCKS on BLPOP]    <───────    ✅ ACQUIRED
                                        ↓
                              markSsoAsVerified(uuid)
                                        ↓
                              ┌──────────────────────┐
                              │  SPY IMPLEMENTATION  │
                              │                      │
                              │  ATOMIC LUA SCRIPT:  │
                              │  - RPUSH PID         │
                              │  - LLEN executing    │
                              │  - CHECK <= limit    │
                              │  - Record violation  │
                              └──────────────────────┘
                                        ↓
                              Count: 1/1 ✅ OK
                                        ↓
                              Do work (100ms)...
                                        ↓
                              LREM PID
                                        ↓
                              semaphore.release()
                                        ↓
Worker 1: [WAKES UP]  ────────►  RPUSH notify
    ↓
✅ ACQUIRED
    ↓
markSsoAsVerified(uuid)
    ↓
(continues same flow...)
```

### Key Components

1. **Atomic Enter Check** (Lua Script)
   ```lua
   -- Push, count, and validate in ONE atomic operation
   redis.call('RPUSH', 'test:executing', pid)
   local count = redis.call('LLEN', 'test:executing')
   if count > limit then
       redis.call('RPUSH', 'test:violations', violation)
   end
   ```

2. **Spy Implementation**
   - Wraps `markSsoAsVerified` directly
   - Adds validation logic
   - No separate monitor class needed

3. **Semaphore Integration**
   - Worker calls `semaphore.acquire()` before spy
   - Worker calls `semaphore.release()` after spy
   - BLPOP ensures only `permits` workers proceed

---

## Running the Test

### Prerequisites

```powershell
# Ensure Docker Desktop is running

# Install dependencies
cd server
npm install

# Verify jest is configured
# package.json should have jest setup
```

### Execute Test

```powershell
# Run the simplified integration test
npm test -- __tests__/integration/distributed-semaphore-simple.integration.test.js

# With verbose output
npm test -- __tests__/integration/distributed-semaphore-simple.integration.test.js --verbose

# With coverage
npm test -- __tests__/integration/distributed-semaphore-simple.integration.test.js --coverage
```

### Manual Redis Inspection (During Test)

```powershell
# Connect to test Redis
docker exec -it redis-test-semaphore redis-cli -p 6380

# View executing queue (who's in critical section)
LRANGE test:executing 0 -1

# View violations (should be empty!)
LRANGE test:violations 0 -1

# View max concurrent count
GET test:max_concurrent

# View semaphore state
GET test-semaphore
LLEN test-semaphore:notify
```

---

## Expected Output

```
Starting Redis test container...
✅ Redis is ready!
✅ Test Redis Client connected
✅ Test Redis flushed

=== MASTER: Starting Simplified Test ===

Created 10 test SSO entries
Forked worker 12345
Forked worker 12346

=== Distributing UUIDs ===

Sent 5 UUIDs to worker 12345
Sent 5 UUIDs to worker 12346

[Worker 12345] Started (ID: 0)
[Worker 12346] Started (ID: 1)
✅ Test Redis Client connected
✅ Test Redis Client connected
[Worker 12345] Received 5 UUIDs to process
[Worker 12346] Received 5 UUIDs to process
[Worker 12345] 🔒 Acquiring for abc-123...
[Worker 12346] 🔒 Acquiring for def-456...
[Worker 12345] ✅ ENTER critical section. Count: 1/1 for UUID: abc-123
[Worker 12346] [BLOCKED on BLPOP...]
[Worker 12345] ⬅️ EXIT critical section. Remaining: 0
[Worker 12345] 🔓 Released for abc-123
[Worker 12346] ✅ ENTER critical section. Count: 1/1 for UUID: def-456
[Worker 12346] ⬅️ EXIT critical section. Remaining: 0
[Worker 12346] 🔓 Released for def-456
...
✅ Worker 12345 completed
✅ Worker 12346 completed

=== TEST RESULTS ===
Max concurrent: 1
Semaphore limit: 1
Violations: 0
Still executing: 0

✅ TEST PASSED: No concurrency violations detected

✅ Test Redis Client closed
Stopping Redis test container...
✅ Redis container stopped
```

---

## Key Advantages

### ✅ Follows Your Suggestion Exactly
- SpyOn the critical section ✅
- Validator queue in Redis ✅
- Check queue length atomically ✅

### ✅ Simple & Maintainable
- No complex monitor class (200 lines → 0 lines)
- No separate test service (80 lines → 0 lines)
- Validation logic in spy (~20 lines)

### ✅ Atomic & Correct
- Lua script ensures push + check is atomic
- No race conditions between workers
- Master never chokes (Redis handles everything)

### ✅ Observable
- Can inspect Redis during test execution
- Clear console output with emojis
- Detailed violation messages with PIDs

---

## Troubleshooting

### Docker Issues

**Problem**: Container fails to start
```powershell
# Check Docker status
docker ps -a

# View logs
docker logs redis-test-semaphore

# Manual restart
cd server/__tests__/integration/docker/redis
docker-compose down -v
docker-compose up -d
```

**Problem**: Port 6380 already in use
```powershell
# Find process using port
netstat -ano | findstr :6380

# Kill process or change port in docker-compose.yml
```

### Redis Connection Issues

**Problem**: `ECONNREFUSED` errors
- Ensure Docker Desktop is running
- Increase timeout in `beforeAll` to 5000ms
- Check Redis health: `docker exec redis-test-semaphore redis-cli -p 6380 ping`

### Test Hangs

**Problem**: Test never completes
- Add timeout to worker operations
- Check worker logs for errors
- Verify semaphore key matches: `test-semaphore`

### False Violations

**Problem**: Violations detected but semaphore seems correct
- Increase critical section delay (100ms → 200ms)
- Check Redis latency: `redis-cli -p 6380 --latency`
- Verify Lua script with `SCRIPT DEBUG YES`

---

## Extending the Test

### Test Different Scenarios

```javascript
// 1. More workers
const WORKER_COUNT = 4; // More processes competing

// 2. Higher permits
const SEMAPHORE_PERMITS = 3; // Allow more concurrent

// 3. More requests
const CONCURRENT_REQUESTS = 50; // More stress

// 4. Longer critical section
await new Promise(resolve => setTimeout(resolve, 500)); // Longer overlap
```

### Add Latency Monitoring

```javascript
// In spy implementation
const startTime = Date.now();
await new Promise(resolve => setTimeout(resolve, 100));
const duration = Date.now() - startTime;

await workerRedis.rpush('test:durations', duration);
```

### Test Failure Scenarios

```javascript
// Simulate worker crash
if (Math.random() < 0.1) {
    process.exit(1); // 10% chance of crash
}

// Simulate Redis failure
setTimeout(() => {
    workerRedis.disconnect();
}, 5000);
```

---

## Summary

This simplified approach:
1. ✅ SpyOn the critical section directly
2. ✅ Adds validator queue in Redis (atomic)
3. ✅ No complex abstractions
4. ✅ ~250 lines vs ~600 lines
5. ✅ Easier to debug and maintain

The core insight: **The spy IS the monitor** - validation logic lives right where the critical section executes!
