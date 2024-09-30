import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant', // Reference to the restaurant
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    }
});

const Category = mongoose.model('Category', categorySchema);

export default Category;
