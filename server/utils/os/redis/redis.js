import Redis from 'ioredis';

async function initializeRedisClient() {
  console.log("Initializing Redis client...");
  // read the Redis connection URL from the envs
  // Note: Use 127.0.0.1 instead of localhost to avoid IPv6 resolution issues
  // (localhost may resolve to ::1 which can cause connection problems with containerized Redis)
  let redisURL = process.env.REDIS_URI || process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  console.log("Redis URL from env:", redisURL);
  
  if (redisURL) {
    // create the Redis client object using ioredis
    const redisClient = new Redis(redisURL, {
      lazyConnect: true,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });

    redisClient.on("error", (e) => {
      // ioredis can emit transient socket errors (e.g. EPIPE/ECONNRESET) while
      // it is reconnecting; logging here is fine, but initialization should not
      // fail just because the first attempt errored.
      console.error(`Redis client error:`);
      console.error(e);
    });

    redisClient.on("connect", () => {
      console.log(`Connected to Redis successfully!`);
    });

    // const readyPromise = new Promise((resolve, reject) => {
    //   const timeout = setTimeout(() => reject(new Error("Redis connection timeout")), 5000);
    //   redisClient.once('ready', () => {
    //     clearTimeout(timeout);
    //     resolve();
    //   });
    // });

    try {
      await redisClient.connect();
      return redisClient;
    } catch (e) {
      try {
        // Best-effort cleanup on init failure
        redisClient.disconnect(true);
      } catch {}
      console.error(`Connection to Redis failed with error:`, e);
      throw e;
    }
  }

  throw new Error('Redis URL is not defined');
}

async function closeRedisClient(redisClient) {
  if (redisClient) {
    const endPromise = new Promise((resolve) => redisClient.once('end', resolve));
    try {
      await redisClient.quit();
    } finally {
      // Ensure the underlying socket is torn down and avoid open handles
      redisClient.disconnect();
      await Promise.race([
        endPromise,
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
    }
  }
}

export { initializeRedisClient, closeRedisClient };