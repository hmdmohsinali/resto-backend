import mongoose from "mongoose";

const promotionSliderSchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId, // Reference to the restaurant
        ref: 'Restaurant',
        required: [true, "Restaurant ID is required"]
    },
    images: {
        type: [String], 
        required: [true, "At least one image URL is required"]
    }
});

const PromotionSlider = mongoose.model("PromotionSlider", promotionSliderSchema);

export default PromotionSlider;
