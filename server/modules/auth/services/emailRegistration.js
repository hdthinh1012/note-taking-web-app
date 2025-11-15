import { ssoRepository } from '../repository/ssoRepository.js';
import { verifySsoSem } from '../../../utils/multithread/child/setup-distributed-semaphore.js';

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