import {db, User} from '../../../utils/database/database.js';

class UserRepository {
    constructor(model) {
        this.model = model || User;
    }

    async createUser(data) {
        try {
            const newUser = await this.model.create({
                ...data,
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