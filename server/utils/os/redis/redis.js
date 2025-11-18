const Redis = require("ioredis");

var redisClient = undefined;

async function initializeRedisClient() {
  // read the Redis connection URL from the envs
  let redisURL = process.env.REDIS_URI;
  
  if (redisURL) {
    try {
      // create the Redis client object using ioredis
      redisClient = new Redis(redisURL, {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: null,
        enableReadyCheck: false
      });

      redisClient.on("error", (e) => {
        console.error(`Failed to create the Redis client with error:`);
        console.error(e);
      });

      redisClient.on("connect", () => {
        console.log(`Connected to Redis successfully!`);
      });

      // ioredis connects automatically, but we can wait for ready event
      await new Promise((resolve, reject) => {
        redisClient.once('ready', resolve);
        redisClient.once('error', reject);
      });

      return redisClient;
    } catch (e) {
      console.error(`Connection to Redis failed with error:`);
      console.error(e);
    }
  }
}

function getRedisClient() {
  return redisClient;
}

async function closeRedisClient() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = undefined;
  }
}

module.exports = { initializeRedisClient, redisClient, getRedisClient, closeRedisClient };