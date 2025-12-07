import DistributedSemaphore from '../../os/redis/redis-semaphore/distributed-semaphore.js';

const verifySsoSem = await DistributedSemaphore.create({
    key: "sso-email-registration-service-verify-uuid-semaphore",
    permits: 1,
    timeout: 10000 // 10 seconds
});

export { verifySsoSem };