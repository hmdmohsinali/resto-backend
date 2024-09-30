import mongoose from "mongoose";
import bcrypt from "bcrypt";

const restaurantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Restaurant name is required"],
        trim: true
    },
    username: {
        type: String,
        required: [true, "Username is required"],
        unique: true,
        trim: true,
        minlength: [3, "Username must be at least 3 characters long"]
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters long"]
    },
    mainTag: {
        type: String
    },
    imageSnippet: {
        type: String
    },
    imagesCover: {
        type: [String], // Array of strings to store image URLs
       
    },
    description: {
        type: String,
        trim: true, // To remove excess spaces
    }
});

restaurantSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

const Restaurant = mongoose.model("Restaurant", restaurantSchema);

export default Restaurant;