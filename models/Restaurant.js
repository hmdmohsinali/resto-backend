import mongoose from "mongoose";
import bcrypt from "bcrypt";


const operationalHoursSchema = new mongoose.Schema({
  day: {
      type: String,
      required: true,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  },
  open: {
      type: String, // Format: "HH:mm" (e.g., "09:00")
      required: true
  },
  close: {
      type: String, // Format: "HH:mm" (e.g., "22:00")
      required: true
  }
});


const promotionalHoursSchema = new mongoose.Schema({
  day: {
      type: String,
      required: true,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  },
  start: {
      type: String, // Format: "HH:mm" (e.g., "12:00")
      required: true
  },
  end: {
      type: String, // Format: "HH:mm" (e.g., "14:00")
      required: true
  },
  discountPercent: {
      type: Number, // Discount percentage (e.g., 20 for 20%)
      required: true,
      min: 1,
      max: 100
  }
})

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Restaurant name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "email is required"],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters long"],
  },
  mainTag: {
    type: String,
  },
  imageSnippet: {
    type: String,
  },
  imagesCover: {
    type: [String], 
  },
  description: {
    type: String,
    trim: true, 
  },
  address: {
    type: String, 
    trim: true,
  },
  locationLink: {
    type: String, 
    trim: true,
  },
  vacationMode: {
    type: Boolean,
    default: false,
  },
  averageRating: {
    type: Number,
    default: 0
  },
  operationalHours: [operationalHoursSchema], 
  promotionalHours: [promotionalHoursSchema],
});

restaurantSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const Restaurant = mongoose.model("Restaurant", restaurantSchema);

export default Restaurant;
