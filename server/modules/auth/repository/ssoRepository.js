const {db, Sso} = require('../../../utils/database/database');

class SsoRepository {
    constructor() {
        this.model = Sso;
        this.db = db;
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
}

const ssoRepository = new SsoRepository();
module.exports = ssoRepository;