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
            const sso_account = ssoEntry.sso_account;
            const existingVerifiedSsos = await ssoRepository.getVerifiedSsosByAccount(sso_account);
            if (existingVerifiedSsos && existingVerifiedSsos.length > 0) {
                throw new Error('Email is already registered');
            }
            await ssoRepository.markSsoAsVerified(uuid);
            await new Promise((resolve) => setTimeout(resolve, 10000));
            console.log(`Verified UUID: ${uuid}`);
        } catch (error) {
            throw error;
        } finally {
            await verifySsoSem.release();
        } 
    }

    static async rejectUuid(uuid) {
        await verifySsoSem.acquire();
        try {
            const ssoEntry = await ssoRepository.getSsoEntryByUuid(uuid);
            if (!ssoEntry) {
                throw new Error('Invalid UUID');
            }
            if (ssoEntry.verified) {
                throw new Error('UUID already verified');
            }
            await ssoRepository.markSsoAsRejected(uuid);
            await new Promise((resolve) => setTimeout(resolve, 10000));
            console.log(`Rejected UUID: ${uuid}`);
        } catch (error) {
            throw error;
        } finally {
            await verifySsoSem.release();
        }
    }
}

export { EmailRegistrationService };