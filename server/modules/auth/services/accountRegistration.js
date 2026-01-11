import {registerTokenRepository} from '../repository/registerTokenRepository.js';

class AccountRegistrationService {
    static async createRegisterToken(sso_uuid) {
        try {
            const newToken = await registerTokenRepository.createRegisterToken({
                uuid: crypto.randomUUID(),
                sso_uuid,
                status: 'CREATED'
            });
            return newToken;
        } catch (error) {
            console.error('Error creating register token in AccountRegistrationService:', error);
            throw error;
        }
    }

    static async getRegisterTokenBySsoUuid(ssoUuid) {
        try {
            const token = await registerTokenRepository.getRegisterTokenBySsoUuid(ssoUuid);
            return token;
        } catch (error) {
            console.error('Error retrieving register token in AccountRegistrationService:', error);
            throw error;
        }
    }

    static async getRegisterToken(tokenUuid) {
        try {
            const token = await registerTokenRepository.getRegisterToken(tokenUuid);
            return token;
        } catch (error) {
            console.error('Error retrieving register token in AccountRegistrationService:', error);
            throw error;
        }
    }

    static async markRegisterTokenAsUsed(tokenUuid) {
        try {
            const updatedToken = await registerTokenRepository.markRegisterTokenAsUsed(tokenUuid);
            return updatedToken;
        } catch (error) {
            console.error('Error marking register token as used in AccountRegistrationService:', error);
            throw error;
        }
    }
}

export { AccountRegistrationService };