import {db, User} from '../../../utils/database/database.js';

class UserRepository {
    constructor(model) {
        this.model = model || User;
    }

    async createUser(data) {
        try {
            // Add a code test using sequelize model to get all available tables in the database
            const tables = await db.sequelize.getQueryInterface().showAllTables();
            console.log('Available tables in the database:', tables);
            const newUser = await this.model.create({
                ...data,
                phone: "",
                isActive: true
            });
            return newUser;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    async getUserByUsername(username) {
        try {
            const user = await this.model.findOne({ where: { username } });
            return user;
        } catch (error) {
            console.error('Error fetching user by username:', error);
            throw error;
        }
    }
}

const userRepository = new UserRepository();

export { userRepository, UserRepository };