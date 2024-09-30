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
        type: String,                            
    },
    image: { 
        type: String                             
    },
    options: [{
        type: optionSchema                       
    }]
}, { timestamps: true });

const Menu = mongoose.model('Menu', menuSchema);

export default Menu;