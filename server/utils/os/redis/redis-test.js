import Redis from 'ioredis';

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
        port: options.port || 6379,
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

export {
    initializeTestRedisClient,
    closeTestRedisClient,
    flushTestRedis,
    getTestRedisClient
};

function getTestRedisClient() {
    return testRedisClient;
}