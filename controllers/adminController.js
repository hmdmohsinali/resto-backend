import Restaurant from "../models/Restaurant.js";
import Table from "../models/Table.js"  
import PromotionSlider from "../models/PromotionSlider.js";
import bcrypt from "bcrypt";  
import Category from "../models/Category.js";

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


export const addTable = async (req, res) => {
  const { tableNo, totalPax, restaurantId } = req.body; // Include restaurantId in the body

  try {
      const newTable = new Table({ tableNo, totalPax, restaurantId });
      await newTable.save();

      res.status(201).json({
          success: true,
          message: "Table added successfully",
          data: newTable
      });
  } catch (error) {
      res.status(400).json({
          success: false,
          error: error.message
      });
  }
};


export const updatePax = async (req, res) => {
  const { restaurantId, tableNo } = req.query;  // Get restaurantId and tableNo from query parameters
  const { totalPax } = req.body;  // Get the new pax value from the request body

  try {
      const table = await Table.findOne({ restaurantId, tableNo });

      if (!table) {
          return res.status(404).json({
              success: false,
              message: "Table not found"
          });
      }

      // Update totalPax
      table.totalPax = totalPax;
      await table.save();

      res.status(200).json({
          success: true,
          message: "Total pax updated successfully",
          data: table
      });
  } catch (error) {
      res.status(500).json({
          success: false,
          error: error.message
      });
  }
};


export const addPromotionalImages = async (req, res) => {
  const { restaurantId, images } = req.body;

  try {
      let slider = await PromotionSlider.findOne({ restaurantId });

      // If no slider exists for the restaurant, create a new one
      if (!slider) {
          slider = new PromotionSlider({ restaurantId, images });
      } else {
          // If a slider exists, append new images to the array
          slider.images = slider.images.concat(images);
      }

      await slider.save();

      res.status(201).json({
          success: true,
          message: "Promotional images added successfully",
          data: slider
      });
  } catch (error) {
      res.status(400).json({
          success: false,
          error: error.message
      });
  }
};


export const deletePromotionalImage = async (req, res) => {
  const { restaurantId, imageUrl } = req.body;

  try {
      const slider = await PromotionSlider.findOne({ restaurantId });

      if (!slider) {
          return res.status(404).json({
              success: false,
              message: "Promotion slider not found"
          });
      }

      // Check if the image exists in the array
      const imageIndex = slider.images.indexOf(imageUrl);
      if (imageIndex === -1) {
          return res.status(404).json({
              success: false,
              message: "Image not found in the slider"
          });
      }

      // Remove the image from the array
      slider.images.splice(imageIndex, 1);

      // Save the updated slider
      await slider.save();

      res.status(200).json({
          success: true,
          message: "Image removed successfully",
          data: slider.images
      });
  } catch (error) {
      res.status(500).json({
          success: false,
          error: error.message
      });
  }
};


export const addCategory = async (req, res) => {
  const { restaurantId, name } = req.body;

  try {
      const existingCategory = await Category.findOne({ restaurant: restaurantId, name });
      if (existingCategory) {
          return res.status(400).json({
              success: false,
              message: "Category already exists for this restaurant"
          });
      }

      const category = new Category({ restaurant: restaurantId, name });
      await category.save();

      res.status(201).json({
          success: true,
          message: "Category created successfully",
          data: category
      });
  } catch (error) {
      res.status(500).json({
          success: false,
          message: error.message
      });
  }
};

export const getCategories = async (req, res) => {
  const { restaurantId } = req.query;

  try {
      const categories = await Category.find({ restaurant: restaurantId });
      res.status(200).json({
          success: true,
          data: categories
      });
  } catch (error) {
      res.status(500).json({
          success: false,
          message: error.message
      });
  }
};

export const addMenuItem = async (req, res) => {
  const { restaurantId, name, description, price, categoryName, image, options } = req.body;

  try {
      // Find or create the category for the restaurant
      let selectedCategory = await Category.findOne({ restaurant: restaurantId, name: categoryName });

      if (!selectedCategory) {
          selectedCategory = new Category({ restaurant: restaurantId, name: categoryName });
          await selectedCategory.save();
      }

      // Create the new menu item
      const menuItem = new Menu({
          restaurant: restaurantId,
          name,
          description,
          price,
          category: selectedCategory._id, // Link the category by its ID
          image,
          options
      });

      await menuItem.save();

      res.status(201).json({
          success: true,
          message: "Menu item added successfully",
          data: menuItem
      });
  } catch (error) {
      res.status(500).json({
          success: false,
          message: error.message
      });
  }
};

export const editMenuItem = async (req, res) => {
  const { menuId } = req.query; // ID of the menu item to update
  const { restaurantId, name, description, price, categoryName, image, options } = req.body;

  try {
      // Find the menu item by ID and restaurant ID to ensure it's part of that restaurant's menu
      let menuItem = await Menu.findOne({ _id: menuId, restaurant: restaurantId });

      if (!menuItem) {
          return res.status(404).json({
              success: false,
              message: "Menu item not found for this restaurant"
          });
      }

      // If a new category name is provided, find or create it
      if (categoryName) {
          let selectedCategory = await Category.findOne({ restaurant: restaurantId, name: categoryName });
          if (!selectedCategory) {
              selectedCategory = new Category({ restaurant: restaurantId, name: categoryName });
              await selectedCategory.save();
          }
          menuItem.category = selectedCategory._id; // Update the category reference
      }

      // Update the menu item fields
      if (name) menuItem.name = name;
      if (description) menuItem.description = description;
      if (price) menuItem.price = price;
      if (image) menuItem.image = image;
      if (options) menuItem.options = options;

      // Save the updated menu item
      await menuItem.save();

      res.status(200).json({
          success: true,
          message: "Menu item updated successfully",
          data: menuItem
      });
  } catch (error) {
      res.status(500).json({
          success: false,
          message: error.message
      });
  }
};


export const toggleMenuItemVisibility = async (req, res) => {
    const { menuId } = req.query;
    const { restaurantId } = req.body;
    try {
        let menuItem = await Menu.findOne({ _id: menuId, restaurant: restaurantId });

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: "Menu item not found for this restaurant"
            });
        }

        menuItem.visible = !menuItem.visible;
        await menuItem.save();

        res.status(200).json({
            success: true,
            message: `Menu item visibility changed to ${menuItem.visible ? 'visible' : 'hidden'}`,
            data: menuItem
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getAllMenuItems = async (req, res) => {
  const { restaurantId } = req.query;

  try {
      // Fetch all menu items for the given restaurant, no filtering by visibility
      const menuItems = await Menu.find({ restaurant: restaurantId }).populate('category');

      res.status(200).json({
          success: true,
          data: menuItems
      });
  } catch (error) {
      res.status(500).json({
          success: false,
          message: error.message
      });
  }
};

export const updateAdress= async (req, res) => {
  const { id } = req.query;
  const { address, locationLink } = req.body;

  try {
      // Find the restaurant by ID and update the fields
      const updatedRestaurant = await Restaurant.findByIdAndUpdate(
          id,
          { address, locationLink },
          { new: true, runValidators: true }
      );

      if (!updatedRestaurant) {
          return res.status(404).json({ message: "Restaurant not found" });
      }

      res.json(updatedRestaurant);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
};
