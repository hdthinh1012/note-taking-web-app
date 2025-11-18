const cluster = require('cluster');
const { initializeTestRedisClient, closeTestRedisClient, flushTestRedis } = require('../../redis-test');
const DistributedSemaphore = require('../distributed-semaphore');
const { ssoRepository } = require('../../../../../modules/auth/repository/ssoRepository');
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