import DistributedSemaphore from "../../os/redis/redis-semaphore/distributed-semaphore";

export const verifySsoSem = new DistributedSemaphore({
    key: "sso-email-registration-service-verify-uuid-semaphore",
    permits: 1,
    timeout: 10000 // 10 seconds
});