import bcrypt from "bcrypt";
import Customer from "../models/Customer.js";
import dotenv from "dotenv";
import { transporter } from "../utils/transpoter.js";
import Restaurant from "../models/Restaurant.js";
import Reservation from "../models/Reservations.js";
import Menu from "../models/Menu.js";
import Review from "../models/Review.js";
import { updateRestaurantRating } from "../utils/updateRating.js";
import moment from "moment"
import Category from "../models/Category.js";
import Promotion from "../models/Promotion.js";
dotenv.config();

export const signUp = async (req, res) => {
  const { email, password } = req.body;
  console.log("Request body:", req.body); // Check if req.body is coming through

  try {
    let user = await Customer.findOne({ email });
    if (user) {
      console.log("Customer already exists");
      return res.status(400).json({ msg: "Customer already exists" });
    }

    console.log("Customer not found, proceeding with signup");

    const customer = new Customer({ email, password });
    await customer.save();
    console.log("Customer saved to database");

    return res
      .status(201)
      .json({ msg: "Customer created successfully", id: customer._id });
  } catch (error) {
    console.log("Error:", error.message);
    return res.status(500).json({ error: "Server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  console.log("Request body:", req.body); // Check if req.body is coming through

  try {
    const customer = await Customer.findOne({ email });
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

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await Customer.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "Customer not found" });
    }

    const otp = Math.floor(10000 + Math.random() * 90000);
    user.otp = otp;
    await user.save();

    // Sending OTP via email
    const mailOptions = {
      from: process.env.Email_User, // Sender email
      to: email, // Recipient email
      subject: "Your OTP Code", // Email subject
      text: `Your OTP code is ${otp}`, // Email content
    };

    // Use transporter to send mail
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(`Error sending OTP email: ${error.message}`);
        return res.status(500).json({ msg: "Failed to send OTP email" });
      } else {
        console.log(`OTP email sent: ${info.response}`);
        return res
          .status(200)
          .json({ msg: "OTP sent to your email", userID: user._id });
      }
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Server error" });
  }
};
export const verifyOtp = async (req, res) => {
    const { otp, userId } = req.body;
  
    try {
      const user = await Customer.findById(userId);
      if (!user || user.otp !== otp) {
        return res.status(400).json({ msg: "Invalid OTP" });
      }
  
      user.otp = null; // Clear the OTP after verification
      user.otpVerified = true; // Mark user as OTP verified
      await user.save();
  
      return res.status(200).json({ msg: "OTP verified successfully" });
    } catch (error) {
      return res.status(500).json({ error: "Server error" });
    }
  };


  export const changePassword = async (req, res) => {
    const { newPassword, userId } = req.body;
  
    try {
      const user = await Customer.findById(userId);
      if (!user) {
        return res.status(404).json({ msg: "Customer not found" });
      }
  
      if (!user.otpVerified) {
        return res.status(403).json({ msg: "User is not verified to change password" });
      }
  
      user.password = newPassword;
      await user.save();
  
      return res.status(200).json({ msg: "Password changed successfully" });
    } catch (error) {
      return res.status(500).json({ error: "Server error" });
    }
  };

  export const editProfile = async (req, res) => {
    const { userId, fullName, address, phoneNumber } = req.body;
  
    try {
      let user = await Customer.findById(userId);
      if (!user) {
        return res.status(404).json({ msg: "Customer not found" });
      }
  
      // Update only allowed fields
      if (fullName) user.fullName = fullName;
      if (address) user.address = address;
      if (phoneNumber) user.phoneNumber = phoneNumber;
  
      // Prevent updates to other fields
      if (req.body.email || req.body.password || req.body.otpVerified) {
        return res.status(400).json({ msg: "Not allowed to update email, password, or verification status" });
      }
  
      await user.save();
  
      return res.status(200).json({ msg: "Profile updated successfully", user });
    } catch (error) {
      return res.status(500).json({ error: "Server error" });
    }
  };

export const deleteUser = async (req, res) => {
    const { userId } = req.params; 
  
    try {
      const user = await Customer.findByIdAndDelete(userId);
  
      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      }
  
      return res.status(200).json({ msg: "User deleted successfully" });
    } catch (error) {
      return res.status(500).json({ error: "Server error" });
    }
};  

export const getUserDetails = async (req, res) => {
    const { userId } = req.params; 
  
    try {
      const user = await Customer.findById(userId);
  
      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      }
  
      const { password, otp, otpVerified, ...userDetails } = user.toObject();
  
      return res.status(200).json(userDetails);
    } catch (error) {
      return res.status(500).json({ error: "Server error" });
    }
  };

export const getAllRestaurantsWithTags = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({}).select(
      "averageRating mainTag name address imageSnippet imagesCover"
    ); // Select only the fields you want

    return res.status(200).json(restaurants);
  } catch (error) {
    console.error("Error fetching restaurants:", error.message);
    return res.status(500).json({ error: "Server error" });
  }
};

// export const createReservation = async (req, res) => {
//   const {
//     restaurantId,
//     guestNumber,
//     date,
//     time,
//     menuItems,
//     note,
//     name,
//     contactNo,
//     promotionCard,
//   } = req.body;

//   try {
//     const restaurant = await Restaurant.findById(restaurantId);
//     if (!restaurant) {
//       return res.status(404).json({ message: "Restaurant not found" });
//     }

//     // Calculate total amount
//     let totalAmount = 0;
//     let discountApplied = 0;

//     // Fetch menu items and calculate price
//     for (const item of menuItems) {
//       const menuItem = await Menu.findById(item.menuItem);
//       if (!menuItem) {
//         return res
//           .status(404)
//           .json({ message: `Menu item not found: ${item.menuItem}` });
//       }
//       totalAmount += menuItem.price * item.quantity;
//     }

//     // Check if promotional hours apply
//     const currentDay = new Date(date).getDay(); // Get the day of the week (0 for Sunday, etc.)
//     const promotionalHours = restaurant.promotionalHours.find(
//       (ph) => ph.day === currentDay
//     );

//     if (promotionalHours) {
//       const reservationTime = new Date(`1970-01-01T${time}:00`);
//       const promoStartTime = new Date(
//         `1970-01-01T${promotionalHours.start}:00`
//       );
//       const promoEndTime = new Date(`1970-01-01T${promotionalHours.end}:00`);

//       if (
//         reservationTime >= promoStartTime &&
//         reservationTime <= promoEndTime
//       ) {
//         discountApplied = promotionalHours.discountPercent;
//         totalAmount = totalAmount * ((100 - discountApplied) / 100);
//       }
//     }

//     // Check if a promotion card is applied
//     if (promotionCard) {
//       const promotion = await Promotion.findOne({
//         code: promotionCard,
//         restaurant: restaurantId,
//       });
//       if (promotion) {
//         // Apply the promotion card discount
//         totalAmount = totalAmount * ((100 - promotion.percentage) / 100);
//         discountApplied += promotion.percentage; // Track total discount applied
//       } else {
//         return res
//           .status(400)
//           .json({ message: "Invalid or expired promotion card" });
//       }
//     }

//     // Create the reservation
//     const reservation = new Reservation({
//       user: req.user._id,
//       restaurant: restaurantId,
//       guestNumber,
//       date,
//       time,
//       menuItems,
//       note,
//       name,
//       contactNo,
//       totalAmount,
//       promotionCard,
//       discountApplied,
//     });

//     await reservation.save();

//     res
//       .status(201)
//       .json({ message: "Reservation created successfully", reservation });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// };


export const createReservation = async (req, res) => {
  const {
    userId,
    restaurantId,
    guestNumber,
    date,
    time,
    menuItems,
    note,
    name,
    contactNo,
    promotionCard,
    totalAmount, 
    discountApplied, 
  } = req.body;

  try {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    const reservation = new Reservation({
      user: userId,
      restaurant: restaurantId,
      guestNumber,
      date,
      time,
      menuItems,
      note,
      name,
      contactNo,
      totalAmount, // Save the total amount directly
      promotionCard, // Save the promotion card if provided
      discountApplied, // Save the discount applied if provided
    });

    await reservation.save();

    res
      .status(201)
      .json({ message: "Reservation created successfully", reservation });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getPrAndOr = async (req, res)=> {
  const {id} = req.params
  try {
    const restaurants = await Restaurant.findById(id).select(
      " name description imagesCover operationalHours promotionalHours locationLink"
    );

    return res.status(200).json(restaurants);
  } catch (error) {
    console.error("Error fetching restaurants:", error.message);
    return res.status(500).json({ error: "Server error" });
  }
}

export const getMenuItems = async (req, res) => {
  const { restaurantId, categoryName } = req.query; // Get restaurantId and optional categoryName

  try {
    // categoryName is provided, find the category first
    let categoryId = null;
    if (categoryName) {
      const category = await Category.findOne({
        restaurant: restaurantId,
        name: categoryName
      }).exec();

      if (!category) {
        return res.status(200).json([]); // Return empty array if category not found
      }

      categoryId = category._id; // Store the category ID
    }

    // Build the query for fetching menu items
    const query = {
      restaurant: restaurantId,
    };

    // If categoryId is available, add it to the query
    if (categoryId) {
      query.category = categoryId;
    }

    // Fetch menu items based on the query
    const menuItems = await Menu.find(query)
      .select("name price image description visible") // Select specific fields
      .exec();

      
    res.status(200).json(menuItems);
  } catch (error) {
    console.error("Error fetching menu items:", error); // Log error for debugging
    res.status(500).json({ message: "Server error", error });
  }
};

export const getCategories = async (req, res) => {
  const { restaurantId } = req.query; // Assuming restaurantId is passed as a query parameter

  try {
    // Find categories by restaurant ID and select only the name field
    const categories = await Category.find({ restaurant: restaurantId })
      .select('name')
      .exec();

    // Return categories (empty array if none found)
    res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

export const getMenuItemById = async (req, res) => {
  const { menuItemId } = req.query;

  try {
    const menuItem = await Menu.findById(menuItemId)
      .populate("category", "name")
      .exec();

  
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found." });
    }

    res.status(200).json(menuItem);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const createReview = async (req, res) => {
  const { restaurantId, reservationId, customerId, rating, reviewText, images } = req.body;

  try {
    const reservation = await Reservation.findById(reservationId);
    if (!reservation || reservation.user.toString() !== customerId.toString()) {
      return res
        .status(400)
        .json({ message: "Invalid reservation or not authorized" });
    }
    if (reservation.restaurant.toString() !== restaurantId) {
      return res
        .status(400)
        .json({ message: "Reservation does not match the restaurant" });
    }

    // Create a new review
    const review = new Review({
      customer: customerId,
      restaurant: restaurantId,
      reservation: reservationId,
      rating,
      reviewText,
      images,
    });

    await review.save();

    // Update restaurant's average rating
    await updateRestaurantRating(restaurantId);

    res.status(201).json({ message: "Review created successfully", review });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};


export const getRestaurantReviews = async (req, res) => {
  const { restaurantId } = req.params;

  try {
    // Fetch the restaurant along with its average rating
    const restaurant = await Restaurant.findById(restaurantId).select("averageRating");
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found." });
    }

    // Fetch the reviews and populate the customer field to get the user's full name
    const reviews = await Review.find({ restaurant: restaurantId })
      .select("customer images reviewText rating createdAt reservation") // Select specific fields from the Review schema
      .populate('customer', 'fullName')  // Populate the 'customer' field with the user's 'fullName'
      .exec();

    const totalReviews = reviews.length;

    const ratingBreakdown = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    reviews.forEach((review) => {
      ratingBreakdown[review.rating]++;
    });

    const formattedReviews = reviews.map((review) => ({
      fullName: review.customer.fullName, // Get the user's full name from the populated 'customer' field
      daysAgo: moment(review.createdAt).fromNow(), // e.g., "2 days ago"
      reviewText: review.reviewText,
      images: review.images,
      rating: review.rating,
      createdAt: review.createdAt
    }));

    res.status(200).json({
      totalReviews,
      averageRating: restaurant.averageRating,
      ratingBreakdown,
      reviews: formattedReviews,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const verfiyCard= async (req, res) => {
  try {
      const { restaurantId, code } = req.body;
      console.log(code)

      if (!restaurantId || !code) {
          return res.status(400).json({ error: 'Restaurant ID and code are required' });
      }
      const promotion = await Promotion.findOne({ restaurant: restaurantId, code });

      if (!promotion) {
          return res.status(404).json({ valid: false, message: 'Invalid promotion code' });
      }
      res.json({
          valid: true,
          percentage: promotion.percentage,
          message: 'Promotion code is valid'
      });
  } catch (error) {
      res.status(500).json({ error: 'Server error' });
  }
}

export const getHistory = async (req, res) => {
  try {
      const userId = req.query.userId; // assuming you're passing the user ID as a query parameter
      const completed = req.query.completed; // filter by completion status, 'true' or 'false'
      
      if (!userId) {
          return res.status(400).json({ message: "User ID is required." });

      }

      const reservations = await Reservation.find({ 
          user: userId,
          completed: completed
      })
      .populate('restaurant', 'name imageSnippet') // populating restaurant data (optional)
      .populate('menuItems.menuItem', 'name price description image') // populating menu items data (optional)
      .sort({ date: -1 }) // Sort by date in descending order (newest first)

      res.status(200).json(reservations);
  } catch (error) {
      res.status(500).json({ message: "An error occurred while fetching reservations.", error });
  }
}