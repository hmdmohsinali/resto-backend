import mongoose from "mongoose";

const optionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    values: [{ type: String }]
});

const menuSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    price: {
        type: Number,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId, // Reference to the Category schema
        ref: 'Category',
        required: true
    },
    image: {
        type: String
    },
    options: [{
        type: optionSchema
    }],
    visible: {
        type: Boolean,
        default: true // Indicates if the item is visible on the menu
    }
    
}, { timestamps: true });

const Menu = mongoose.model('Menu', menuSchema);

export default Menu;
