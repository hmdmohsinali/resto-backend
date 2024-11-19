import Restaurant from "../models/Restaurant.js";
import Table from "../models/Table.js";
import PromotionSlider from "../models/PromotionSlider.js";
import bcrypt from "bcrypt";
import Category from "../models/Category.js";
import Promotion from "../models/Promotion.js";
import Menu from "../models/Menu.js";
import cloudinary from "../config/cloudinary.js";
import Reservation from "../models/Reservations.js";
import formidable from "formidable";

export const signUp = async (req, res) => {
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

// export const updateRestaurantDetails = async (req, res) => {
//   const updates = req.body; 
//   const { id } = req.query;

//   // Disallow updating username and password
//   if (updates.username || updates.password) {
//     return res.status(400).json({
//       success: false,
//       message: "You cannot update the username or password",
//     });
//   }

//   try {
//     // Find the restaurant by ID
//     const restaurant = await Restaurant.findById(id);

//     // If restaurant doesn't exist
//     if (!restaurant) {
//       return res.status(404).json({
//         success: false,
//         message: "Restaurant not found",
//       });
//     }

//     // Update only the provided fields and retain existing ones
//     const updatedFields = {
//       name: updates.name || restaurant.name,
//       mainTag: updates.mainTag || restaurant.mainTag,
//       imageSnippet: updates.imageSnippet || restaurant.imageSnippet,
//       imagesCover: updates.imagesCover || restaurant.imagesCover,
//       description: updates.description || restaurant.description,
//       address: updates.address || restaurant.address,
//       locationLink: updates.locationLink || restaurant.locationLink,
//       vacationMode: updates.vacationMode !== undefined ? updates.vacationMode : restaurant.vacationMode,
//       operationalHours: updates.operationalHours || restaurant.operationalHours,
//       promotionalHours: updates.promotionalHours || restaurant.promotionalHours,
//       averageRating: restaurant.averageRating, // Keep this unchanged as it's calculated elsewhere
//     };

//     // Apply the updates to the restaurant document
//     Object.assign(restaurant, updatedFields);

//     // Save the updated restaurant
//     await restaurant.save();

//     res.status(200).json({
//       success: true,
//       data: restaurant,
//       message: "Restaurant details updated successfully",
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message,
//     });
//   }
// };
export const updateRestaurantDetails = async (req, res) => {
  const updates = req.body; 
  const { id } = req.query;
  console.log(updates)
  if (updates.username || updates.password) {
    return res.status(400).json({
      success: false,
      message: "You cannot update the username or password",
    });
  }

  try {
    // Find the restaurant by ID
    const restaurant = await Restaurant.findById(id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    // Handle image uploads if provided in the request
    let imageSnippetUrl = restaurant.imageSnippet;
    if (req.files && req.files.imageSnippet) {
      const imageSnippetResult = await cloudinary.uploader.upload(req.files.imageSnippet.tempFilePath, {
        folder: 'restaurants/imageSnippet',
      });
      imageSnippetUrl = imageSnippetResult.secure_url;
    }

    let imagesCoverUrls = restaurant.imagesCover || [];
    if (req.files && req.files.imagesCover) {
      const imageFiles = Array.isArray(req.files.imagesCover) ? req.files.imagesCover : [req.files.imagesCover];

      for (const imageFile of imageFiles) {
        const imagesCoverResult = await cloudinary.uploader.upload(imageFile.tempFilePath, {
          folder: 'restaurants/imagesCover',
        });
        imagesCoverUrls.push(imagesCoverResult.secure_url); // Append new images to the array
      }
    }

    const updatedFields = {
      name: updates.name || restaurant.name,
      mainTag: updates.mainTag || restaurant.mainTag,
      imageSnippet: imageSnippetUrl,
      imagesCover: imagesCoverUrls,
      description: updates.description || restaurant.description,
      address: updates.address || restaurant.address,
      locationLink: updates.locationLink || restaurant.locationLink,
      vacationMode: updates.vacationMode !== undefined ? updates.vacationMode : restaurant.vacationMode,
      operationalHours: updates.operationalHours || restaurant.operationalHours,
      promotionalHours: updates.promotionalHours || restaurant.promotionalHours,
      averageRating: restaurant.averageRating, 
    };

    Object.assign(restaurant, updatedFields);
    await restaurant.save();

    res.status(200).json({
      success: true,
      data: restaurant,
      message: "Restaurant details updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};


export const deleteRestaurantImage = async (req, res) => {
  const { imageUrl } = req.body;
  const { id } = req.query;

  try {
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    const imageIndex = restaurant.imagesCover.indexOf(imageUrl);
    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Image not found in the imagesCover array",
      });
    }

    restaurant.imagesCover.splice(imageIndex, 1);

    await restaurant.save();

    res.status(200).json({
      success: true,
      message: "Image removed successfully",
      data: restaurant.imagesCover,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
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
      data: newTable,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

export const updatePax = async (req, res) => {
  const { restaurantId, tableId } = req.query; 
  const { totalPax } = req.body;

  try {
    // Find the table by tableId and restaurantId
    const table = await Table.findOne({ _id: tableId, restaurantId });

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found or does not belong to this restaurant",
      });
    }

    if (table.availablePax === table.totalPax) {
      table.availablePax = totalPax;
    } else if (totalPax < table.availablePax) {
      table.availablePax = totalPax;
    }

    // Update totalPax
    table.totalPax = totalPax;
    await table.save();

    res.status(200).json({
      success: true,
      message: "Total pax updated successfully",
      data: table,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
export const addPromotionalImages = async (req, res) => {
  const { restaurantId } = req.body;
  const { files } = req; 

  try {
    let slider = await PromotionSlider.findOne({ restaurantId });

    if (!slider) {
      slider = new PromotionSlider({ restaurantId, images: [] });
    }

    let uploadedImages = [];

    if (files && files.images) {
      const imageFiles = Array.isArray(files.images) ? files.images : [files.images];

      for (const imageFile of imageFiles) {
        const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validMimeTypes.includes(imageFile.mimetype)) {
          return res.status(400).json({
            success: false,
            message: "Only image files are allowed.",
          });
        }

        const result = await cloudinary.uploader.upload(imageFile.tempFilePath, {
          folder: `restaurants/${restaurantId}/promotions`, // Store images in a folder per restaurant
        });

        uploadedImages.push(result.secure_url);
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "No image files provided.",
      });
    }

    // Add the newly uploaded images to the existing ones
    slider.images = slider.images.concat(uploadedImages);

    await slider.save();

    res.status(201).json({
      success: true,
      message: "Promotional images added successfully",
      data: slider,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

export const getPromotionalImages = async (req, res) => {
  const { restaurantId } = req.params; // Get restaurantId from the request parameters

  try {
    // Find the promotional slider for the specified restaurant
    const slider = await PromotionSlider.findOne({ restaurantId });

    if (!slider) {
      return res.status(404).json({
        success: false,
        message: "No promotional images found for this restaurant",
      });
    }

    res.status(200).json({
      success: true,
      data: slider.images, // Return the array of promotional images
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
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
        message: "Promotion slider not found",
      });
    }

    // Check if the image exists in the array
    const imageIndex = slider.images.indexOf(imageUrl);
    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Image not found in the slider",
      });
    }

    // Remove the image from the array
    slider.images.splice(imageIndex, 1);

    // Save the updated slider
    await slider.save();

    res.status(200).json({
      success: true,
      message: "Image removed successfully",
      data: slider.images,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const addCategory = async (req, res) => {
  const { restaurantId, name } = req.body;

  try {
    const existingCategory = await Category.findOne({
      restaurant: restaurantId,
      name,
    });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category already exists for this restaurant",
      });
    }

    const category = new Category({ restaurant: restaurantId, name });
    await category.save();

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getCategories = async (req, res) => {
  const { restaurantId } = req.query;

  try {
    const categories = await Category.find({ restaurant: restaurantId });
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const config = {
  api: {
    bodyParser: false, // Disable default body parser for file handling
  },
};

export const addMenuItem = async (req, res) => {
  const { restaurantId, name, description, price, categoryName } = req.body;
  let { options } = req.body;
  const imageFile = req.files?.image;

  if (!imageFile) {
    return res.status(400).json({
      success: false,
      message: "No image file provided.",
    });
  }

  try {
    // Parse options if it's a JSON string
    if (typeof options === "string") {
      options = JSON.parse(options);
    }

    // Ensure options is an array of objects with 'name' and 'values'
    if (!Array.isArray(options) || !options.every(opt => opt.name && Array.isArray(opt.values))) {
      return res.status(400).json({
        success: false,
        message: "Invalid options format. Each option should have a name and an array of values.",
      });
    }

    // Validate the image file type
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validMimeTypes.includes(imageFile.mimetype)) {
      return res.status(400).json({
        success: false,
        message: "Only image files are allowed.",
      });
    }

    // Upload the image to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(imageFile.tempFilePath, {
      folder: "menu_items",
    });

    const imageUrl = uploadResponse.secure_url;

    // Find or create the category for the restaurant
    let selectedCategory = await Category.findOne({
      restaurant: restaurantId,
      name: categoryName,
    });

    if (!selectedCategory) {
      selectedCategory = new Category({
        restaurant: restaurantId,
        name: categoryName,
      });
      await selectedCategory.save();
    }

    // Create the new menu item with the image URL and options array
    const menuItem = new Menu({
      restaurant: restaurantId,
      name,
      description,
      price,
      category: selectedCategory._id,
      image: imageUrl,
      options, // Parsed options array
    });

    await menuItem.save();

    res.status(201).json({
      success: true,
      message: "Menu item added successfully",
      data: menuItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const editMenuItem = async (req, res) => {
  const { menuId } = req.query; // ID of the menu item to update
  const {
    restaurantId,
    name,
    description,
    price,
    categoryName,
    image,
    options,
  } = req.body;

  try {
    // Find the menu item by ID and restaurant ID to ensure it's part of that restaurant's menu
    let menuItem = await Menu.findOne({
      _id: menuId,
      restaurant: restaurantId,
    });

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found for this restaurant",
      });
    }

    // If a new category name is provided, find or create it
    if (categoryName) {
      let selectedCategory = await Category.findOne({
        restaurant: restaurantId,
        name: categoryName,
      });
      if (!selectedCategory) {
        selectedCategory = new Category({
          restaurant: restaurantId,
          name: categoryName,
        });
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
      data: menuItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const toggleMenuItemVisibility = async (req, res) => {
  const { menuId } = req.query;
  const { restaurantId } = req.body;
  try {
    let menuItem = await Menu.findOne({
      _id: menuId,
      restaurant: restaurantId,
    });

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found for this restaurant",
      });
    }

    menuItem.visible = !menuItem.visible;
    await menuItem.save();

    res.status(200).json({
      success: true,
      message: `Menu item visibility changed to ${
        menuItem.visible ? "visible" : "hidden"
      }`,
      data: menuItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllMenuItems = async (req, res) => {
  const { restaurantId } = req.query;

  try {
    // Fetch all menu items for the given restaurant, no filtering by visibility
    const menuItems = await Menu.find({ restaurant: restaurantId }).populate(
      "category"
    );

    res.status(200).json({
      success: true,
      data: menuItems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateAdress = async (req, res) => {
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

export const toggleVacationMode = async (req, res) => {
  const { restaurantId } = req.query;

  try {
    let restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    restaurant.vacationMode = !restaurant.vacationMode;
    await restaurant.save();

    res.status(200).json({
      success: true,
      message: `Vacation mode set to ${restaurant.vacationMode ? "ON" : "OFF"}`,
      data: restaurant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const updateRestaurantHours = async (req, res) => {
  const { restaurantId, operationalHours, promotionalHours } = req.body;

  try {
    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    // Update operational hours if provided
    if (operationalHours && Array.isArray(operationalHours)) {
      restaurant.operationalHours = operationalHours; // Overwrites existing operational hours with new data
    }

    // Add promotional hours if provided
    if (promotionalHours && Array.isArray(promotionalHours)) {
      // You can either overwrite or add the promotional hours depending on the requirement.
      restaurant.promotionalHours = promotionalHours; // Overwrites existing promotional hours with new data
    }

    await restaurant.save();

    res.status(200).json({
      success: true,
      message: "Restaurant hours updated successfully",
      data: {
        operationalHours: restaurant.operationalHours,
        promotionalHours: restaurant.promotionalHours,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating restaurant hours.",
      error: error.message,
    });
  }
};

export const getOperationalHours = async (req, res) => {
  const { restaurantId } = req.query;

  try {
    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    res.status(200).json({
      success: true,
      data: restaurant.operationalHours,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPromotionalHours = async (req, res) => {
  const { restaurantId } = req.query;

  try {
    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    res.status(200).json({
      success: true,
      data: restaurant.promotionalHours,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const addPromotionCode = async (req, res) => {
  const { restaurantId, code, percentage } = req.body;

  try {
    const newPromotion = new Promotion({
      restaurant: restaurantId,
      code,
      percentage
    });

    const savedPromotion = await newPromotion.save();

    res.status(201).json({
      success: true,
      message: "Promotion code added successfully",
      data: savedPromotion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllPromotions = async (req, res) => {
  const { restaurantId } = req.query;

  try {
    const promotions = await Promotion.find({ restaurant: restaurantId });

    res.status(200).json({
      success: true,
      data: promotions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deletePromotionCode = async (req, res) => {
  const { promotionId } = req.body;

  try {
    const deletedPromotion = await Promotion.findByIdAndDelete(promotionId);

    if (!deletedPromotion) {
      return res.status(404).json({
        success: false,
        message: "Promotion code not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Promotion code deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const getCompletedReservations = async (req, res) => {
  try {
      const restaurantId = req.query.restaurantId; // assuming you're passing the restaurant ID as a query parameter

      if (!restaurantId) {
          return res.status(400).json({ message: "Restaurant ID is required." });
      }

      const reservations = await Reservation.find({ 
          restaurant: restaurantId,
          completed: true // Fetching completed reservations
      })
      .populate('menuItems.menuItem', 'name')
      .populate('user', 'name contactNo')
      .sort({ date: -1 }); // Sort by date in descending order (newest first)

      res.status(200).json(reservations);
  } catch (error) {
      console.log(error);
      res.status(500).json({ message: "An error occurred while fetching completed reservations.", error });
  }
};

export const getUpcomingReservations = async (req, res) => {
  try {
      const restaurantId = req.query.restaurantId; // assuming you're passing the restaurant ID as a query parameter

      if (!restaurantId) {
          return res.status(400).json({ message: "Restaurant ID is required." });
      }

      const reservations = await Reservation.find({ 
          restaurant: restaurantId,
          completed: false // Fetching upcoming reservations
      })
      .populate('menuItems.menuItem', 'name')
      .populate('user', 'name contactNo')
      .sort({ date: -1 }); // Sort by date in descending order (newest first)

      res.status(200).json(reservations);
  } catch (error) {
      console.log(error);
      res.status(500).json({ message: "An error occurred while fetching upcoming reservations.", error });
  }
};


export const getRestaurant =  async (req, res) => {
  try {
    const { id } = req.params;
    
    const restaurant = await Restaurant.findById(id).select(
      "name mainTag description imageSnippet imagesCover address locationLink vacationMode"
    );

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    res.json(restaurant);
  } catch (error) {
    console.error("Error fetching restaurant:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export const getTables = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    const tables = await Table.find({ restaurantId }).select("tableNo totalPax");

    if (!tables.length) {
      return res.status(404).json({ message: "No tables found for this restaurant" });
    }

    res.json(tables);
  } catch (error) {
    console.error("Error fetching tables:", error);
    res.status(500).json({ message: "Server error" });
  }
}


export const getReservationDetails = async (req, res) => {
  const { reservationId } = req.params;

  try {
    const reservation = await Reservation.findById(reservationId)
    
      .populate({
        path: 'menuItems.menuItem',
        select: 'name options', 
      })
      .select('guestNumber date note menuItems contactNo name completed') // Select relevant fields from the reservation
      .exec();

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    const reservationDetails = {
      name:reservation.name,
      contactNo: reservation.contactNo,
      completed : reservation.completed,
      orderDate: reservation.date, // Reservation date
      note: reservation.note, // Reservation note
      pax: reservation.guestNumber, // Total guests (pax)
      menuItems: reservation.menuItems.map(item => ({
        name: item.menuItem.name, // Menu item name
        quantity: item.quantity, // Quantity of the menu item
        options: item.menuItem.options // Menu item options
      }))
    };

    res.status(200).json(reservationDetails);
  } catch (error) {
    console.error("Error fetching reservation details:", error);
    res.status(500).json({ message: "Server error", error });
  }
};


export const toggleReservationCompleted = async (req, res) => {
  const { reservationId } = req.params;

  try {
    const reservation = await Reservation.findById(reservationId);

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (reservation.completed) {
      return res.status(400).json({ message: "Reservation is already completed. Status cannot be reverted." });
    }

    reservation.completed = true;

    const tables = await Table.find({ restaurantId: reservation.restaurant });
    const table = tables.find(t => t.totalPax >= reservation.guestNumber);

    if (table) {
      table.availablePax += reservation.guestNumber;

      // Ensure availablePax does not exceed totalPax
      if (table.availablePax > table.totalPax) {
        table.availablePax = table.totalPax;
      }

      // Save the updated table
      await table.save();
    }

    // Save the updated reservation
    await reservation.save();

    // Return the updated reservation
    res.status(200).json({
      message: "Reservation marked as completed successfully",
      completed: reservation.completed,
      reservation
    });
  } catch (error) {
    console.error("Error updating reservation:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

export const deleteTable = async (req, res) => {
  const { tableId } = req.query; // Get the tableId from query parameters

  try {
    // Find the table by ID and delete it
    const deletedTable = await Table.findByIdAndDelete(tableId);

    if (!deletedTable) {
      return res.status(404).json({
        success: false,
        message: "Table not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Table deleted successfully",
      data: deletedTable, // Optionally return the deleted table details
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};