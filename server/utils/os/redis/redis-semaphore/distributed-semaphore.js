import { redisClient } from "../redis";

export default class DistributedSemaphore {
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
            if current < tonumber(ARGV[1]) then
                redis.call("INCR", KEYS[1])
                return 1
            else
                return 0
            end 
        `;

        const result = await this.redis.eval(script, {
            keys: [this.key],
            arguments: [this.permits]
        });

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
                await this.redis.blpop(`${this.key}:notify`, Math.min(remainingTime, 30000) / 1000);
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
        await this.redis.rpush(`${this.key}:notify`, `${Date.now()}:${this.processId}`); // Notify one waiting client
    }
}