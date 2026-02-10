import { categoryRepository } from "../repository/categoryRepository.js";

class CategoryService {
    static async getAllCategories() {
        try {
            const categories = await categoryRepository.getAllCategories();
            return categories;
        } catch (error) {
            console.error('Error retrieving categories in CategoryService:', error);
            throw error;
        }
    }
}

export { CategoryService };