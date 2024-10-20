import Restaurant from "../models/Restaurant.js";
import Review from "../models/Review.js";


export const updateRestaurantRating = async (restaurantId) => {
    const reviews = await Review.find({ restaurant: restaurantId });
    const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
    
    await Restaurant.findByIdAndUpdate(restaurantId, { averageRating });
  }