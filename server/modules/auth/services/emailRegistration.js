const { ssoRepository } = require('../repository/ssoRepository');
const { verifySsoSem } = require('../../../utils/multithread/child/setup-distributed-semaphore');

class EmailRegistrationService {
    static async verifyUuid(uuid) {
        await verifySsoSem.acquire();
        try {
            const ssoEntry = await ssoRepository.getSsoEntryByUuid(uuid);
            if (!ssoEntry) {
                throw new Error('Invalid UUID');
            }
            if (ssoEntry.verified) {
                throw new Error('UUID already verified');
            }
            await ssoRepository.markSsoAsVerified(uuid);
        } catch (error) {
            throw error;
        } finally {
            await verifySsoSem.release();
        } 
    }
}

module.exports = { EmailRegistrationService };