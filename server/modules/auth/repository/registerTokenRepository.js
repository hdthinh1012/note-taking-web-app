import {db, RegisterToken} from '../../../utils/database/database.js';

class RegisterTokenRepository {
    constructor(model) {
        this.model = model || RegisterToken;
    }

    async createRegisterToken(data) {
        try {
            const newToken = await this.model.create(data);
            return newToken;
        } catch (error) {
            console.error('Error creating register token:', error);
            throw error;
        }
    }

    async getRegisterToken(tokenUuid) {
        try {
            const entry = await this.model.findOne({ where: { uuid: tokenUuid } });
            return entry;
        } catch (error) {
            console.error('Error fetching register token by tokenUuid:', error);
            throw error;
        }
    }

    async getRegisterTokenBySsoUuid(ssoUuid) {
        try {
            const entry = await this.model.findOne({ where: { sso_uuid: ssoUuid } });
            return entry;
        } catch (error) {
            console.error('Error fetching register token by ssoUuid:', error);
            throw error;
        }
    }

    async invalidateRegisterToken(token) {
        try {
            const result = await this.model.update(
                { status: 'INVALID' },
                { where: { uuid: token } }
            );
            return result;
        } catch (error) {
            console.error('Error invalidating register token:', error);
            throw error;
        }
    }

    async markRegisterTokenAsUsed(token) {
        try {
            const result = await this.model.update(
                { status: 'USED' },
                { where: { uuid: token } }
            );
            return result;
        } catch (error) {
            console.error('Error marking register token as used:', error);
            throw error;
        }
    }
}

const registerTokenRepository = new RegisterTokenRepository();

export { registerTokenRepository, RegisterTokenRepository };