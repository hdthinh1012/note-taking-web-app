const DistributedSemaphore = require("../../os/redis/redis-semaphore/distributed-semaphore");

const verifySsoSem = new DistributedSemaphore({
    key: "sso-email-registration-service-verify-uuid-semaphore",
    permits: 1,
    timeout: 10000 // 10 seconds
});

module.exports = { verifySsoSem };