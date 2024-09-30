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

export const updateRestaurantDetails = async (req, res) => {
    const updates = req.body; 
    const {id} = req.query
    if (updates.username || updates.password) {
        return res.status(400).json({
            success: false,
            message: "You cannot update the username or password"
        });
    }

    try {
        const restaurant = await Restaurant.findById(id);
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurant not found"
            });
        }

        for (const key in updates) {
            if (restaurant[key] !== undefined) {
                restaurant[key] = updates[key];
            }
        }

        await restaurant.save();

        res.status(200).json({
            success: true,
            data: restaurant,
            message: "Restaurant details updated successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

export const deleteRestaurantImage = async (req, res) => {
  const { imageUrl } = req.body;
  const {id} = req.query

  try {
      const restaurant = await Restaurant.findById(id);
      if (!restaurant) {
          return res.status(404).json({
              success: false,
              message: "Restaurant not found"
          });
      }

      const imageIndex = restaurant.imagesCover.indexOf(imageUrl);
      if (imageIndex === -1) {
          return res.status(404).json({
              success: false,
              message: "Image not found in the imagesCover array"
          });
      }

      restaurant.imagesCover.splice(imageIndex, 1);

      await restaurant.save();

      res.status(200).json({
          success: true,
          message: "Image removed successfully",
          data: restaurant.imagesCover
      });
  } catch (error) {
      res.status(500).json({
          success: false,
          error: error.message
      });
  }
};

