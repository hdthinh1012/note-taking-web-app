import {db, Category} from '../../../utils/database/database.js';

class CategoryRepository {
    constructor(model) {
        this.model = model || Category;
    }

    async getAllCategories() {
        try {
            const categories = await this.model.findAll();
            return categories;
        } catch (error) {
            console.error('Error fetching all categories:', error);
            throw error;
        }
    }
}

const categoryRepository = new CategoryRepository();

export { categoryRepository, CategoryRepository };