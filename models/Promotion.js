import mongoose from 'mongoose';

const promotionSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',                       
        required: true
    },
    code: {
        type: String,
        required: true,
        unique: true                             
    },
    percentage: {
        type: Number,
        required: true,
        min: 0,                                  
        max: 100                                 
    }
}, { timestamps: true });

const Promotion = mongoose.model('Promotion', promotionSchema);

export default Promotion;
