import Restaurant from "../models/Restaurant.js";  
import bcrypt from "bcrypt";  

export const signUp = async (req, res) => {
    const { name, username, password } = req.body;
  
    try {
      let existingRestaurant = await Restaurant.findOne({ username });
      if (existingRestaurant) {
        return res.status(400).json({ msg: "Username is already taken" });
      }
  
      const newRestaurant = new Restaurant({ name, username, password });
  
      await newRestaurant.save();
  
      return res.status(201).json({ msg: "Restaurant registered successfully", restaurant: newRestaurant });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Server error" });
    }
  };

  export const login = async (req, res) => {
    const { username, password } = req.body;
  
    try {
      let restaurant = await Restaurant.findOne({ username });
      if (!restaurant) {
        return res.status(400).json({ msg: "Invalid username or password" });
      }
  
      const isMatch = await bcrypt.compare(password, restaurant.password);
      if (!isMatch) {
        return res.status(400).json({ msg: "Invalid username or password" });
      }
  
      return res.status(200).json({ msg: "Login successful", restaurant });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Server error" });
    }
  };