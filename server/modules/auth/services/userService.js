import { userRepository } from "../repository/userRepository.js";

class UserService {
    static async createUser({username, email, hashedPassword}) {
        try {
            const newUser = await userRepository.createUser({ username, email, password: hashedPassword });
            return newUser;
        } catch (error) {
            console.error('Error creating user in UserService:', error);
            throw error;
        }
    }

    static async getUserByUsername(username) {
        try {
            const user = await userRepository.getUserByUsername(username);
            return user;
        } catch (error) {
            console.error('Error retrieving user in UserService:', error);
            throw error;
        }
    }
}

export { UserService };