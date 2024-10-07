import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  reservation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  reviewText: {
    type: String,
    trim: true
  },
  images: {
    type: [String], // Array of image URLs
  }
}, {
  timestamps: true
});

const Review = mongoose.model('Review', reviewSchema);

export default Review;
