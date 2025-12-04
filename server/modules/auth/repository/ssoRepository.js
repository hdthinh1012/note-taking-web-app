import { db, Sso } from '../../../utils/database/database.js';

const SsoStatus = {
    PENDING: 'pending',
    VERIFIED: 'verified',
    REJECTED: 'rejected',
    INVALID: 'invalid',
};

class SsoRepository {
    constructor(model) {
        this.model = model || Sso;
    }

    /**
     * Create a new SSO entry
     * @param {*} data: {
     *  userId: DataTypes.UUID, 
     *  type: DataTypes.STRING, 
     *  sso_account: DataTypes.STRING, 
     *  verified: DataTypes.BOOLEAN
     * }
     * @returns 
     */
    async createSsoEntry(data) {
        try {
            const newEntry = await this.model.create(data);
            return newEntry;
        } catch (error) {
            console.error('Error creating SSO entry:', error);
            throw error;
        }
    }

    async getSsoEntryByUuid(uuid) {
        try {
            const entry = await this.model.findOne({ where: { uuid } });
            return entry;
        } catch (error) {
            console.error('Error fetching SSO entry by UUID:', error);
            throw error;
        }
    }

    async getSsosByAccount(sso_account) {
        try {
            const entries = await this.model.findAll({ where: { sso_account } });
            return entries;
        } catch (error) {
            console.error('Error fetching SSO entries by account:', error);
            throw error;
        }
    }

    async markSsoAsVerified(uuid) {
        try {
            const result = await this.model.update(
                { verified: true, status: SsoStatus.VERIFIED },
                { where: { uuid } }
            );
            return result;
        }
        catch (error) {
            console.error('Error marking SSO as verified:', error);
            throw error;
        }
    }

    async markSsoAsInvalid(uuids) {
        try {
            const result = await this.model.update(
                { status: SsoStatus.INVALID },
                { where: { uuid: uuids } }
            );
            return result;
        } catch (error) {
            console.error('Error marking SSO as invalid:', error);
            throw error;
        }
    }
}

const ssoRepository = new SsoRepository();
export { ssoRepository, SsoStatus, SsoRepository };