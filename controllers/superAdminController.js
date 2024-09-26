import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { transporter } from "../utils/transpoter.js";
import SuperAdmin from "../models/SuperAdmin.js";
import Restaurant from "../models/Restaurant.js";

dotenv.config();

export const signUp = async (req, res) => {
  const { email, password } = req.body;
  console.log("Request body:", req.body);

  try {
    let user = await SuperAdmin.findOne({ email });
    if (user) {
      console.log("SuperAdmin already exists");
      return res.status(400).json({ msg: "SuperAdmin already exists" });
    }

    console.log("SuperAdmin not found, proceeding with signup");

    const customer = new SuperAdmin({ email, password });
    await customer.save();
    console.log("SuperAdmin saved to database");

    return res.status(201).json({ msg: "SuperAdmin created successfully" });
  } catch (error) {
    console.log("Error:", error.message);
    return res.status(500).json({ error: "Server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  console.log("Request body:", req.body); // Check if req.body is coming through

  try {
    const customer = await SuperAdmin.findOne({ email });
    if (!customer) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }
    return res
      .status(200)
      .json({ msg: "Login successful", userId: customer._id });
  } catch (error) {
    console.log("Error:", error.message);
    return res.status(500).json({ error: "Server error" });
  }
};

export const addRestaurant = async (req, res) => {
  const { name, username, password } = req.body;

  try {
    let existingRestaurant = await Restaurant.findOne({ username });
    if (existingRestaurant) {
      return res.status(400).json({ msg: "Username is already taken" });
    }

    const newRestaurant = new Restaurant({ name, username, password });

    await newRestaurant.save();

    return res
      .status(201)
      .json({
        msg: "Restaurant registered successfully",
        restaurant: newRestaurant,
      });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Server error" });
  }
};

export const getRestaurantNames = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({}, "name"); 
    return res.status(200).json({ restaurants });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Server error" });
  }
};

export const deleteRestaurant = async (req, res) => {
    const { id } = req.params;
  
    try {
      const restaurant = await Restaurant.findByIdAndDelete(id);
      if (!restaurant) {
        return res.status(404).json({ msg: "Restaurant not found" });
      }
      return res.status(200).json({ msg: "Restaurant deleted successfully" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Server error" });
    }
  };

  export const changeRestaurantPassword = async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;
  
    try {
      let restaurant = await Restaurant.findById(id);
      if (!restaurant) {
        return res.status(404).json({ msg: "Restaurant not found" });
      }
  
      restaurant.password = newPassword; // Update the password field
      await restaurant.save();
  
      return res.status(200).json({ msg: "Password updated successfully" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Server error" });
    }
  };

