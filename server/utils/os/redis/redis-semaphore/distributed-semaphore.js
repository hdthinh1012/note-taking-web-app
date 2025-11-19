const { redisClient } = require("../redis");

class DistributedSemaphore {
    constructor(options) {
        this.redis = options.redisClient || redisClient;
        this.key = options.key;
        this.permits = options.permits;
        this.timeout = options.timeout || 30000; // default timeout 30 seconds
        this.retryDelay = options.retryDelay || 100; // default retry delay 100 ms
        this.jitter = options.jitter || 50; // default jitter 50 ms, to avoid thundering herd
        this.processId = process.pid;
    }

    async _tryAcquire() {
        const script = `
            local current = tonumber(redis.call("GET", KEYS[1]) or "0")
            if current < tonumber(ARGV[1]) + 1 then
                redis.call("INCR", KEYS[1])
                return 1
            else
                return 0
            end 
        `;

        // ioredis eval syntax: eval(script, numKeys, key1, key2, ..., arg1, arg2, ...)
        const result = await this.redis.eval(
            script,
            1, // number of keys
            this.key, // KEYS[1]
            this.permits // ARGV[1]
        );

        return result === 1;
    }

    async acquire() {
        const start = Date.now();
        while (true) {
            const acquired = await this._tryAcquire();
            if (acquired) {
                return;
            }

            if (Date.now() - start > this.timeout) {
                throw new Error("Timeout while acquiring semaphore");
            }

            const remainingTime = this.timeout - (Date.now() - start);

            if (remainingTime > 500) {
                // ioredis blpop syntax: blpop(key, timeout_in_seconds)
                // Returns null on timeout, or [key, value] on success
                const result = await this.redis.blpop(
                    `${this.key}:notify`, 
                    Math.min(remainingTime, 30000) / 1000
                );
                // Continue loop whether we got a notification or timeout
            } else {
                throw new Error("Timeout while acquiring semaphore");
            }
        }
    }

    async release() {
        const current = await this.redis.decr(this.key);
        if (current < 0) {
            await this.redis.set(this.key, 0);
            throw new Error("Semaphore released more times than it was acquired");
        }
        // Notify one waiting client
        await this.redis.rpush(`${this.key}:notify`, `${Date.now()}:${this.processId}`);
    }
}

module.exports = DistributedSemaphore;