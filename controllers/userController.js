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
import cloudinary from "../config/cloudinary.js";
import Table from "../models/Table.js";
import Points from "../models/Points.js";
import Transaction from "../models/Transaction.js";
dotenv.config();

const generateOtp = () => Math.floor(10000 + Math.random() * 90000);

export const signUp = async (req, res) => {
  const { email, password } = req.body;
  if(!email || !password)
  
    res.status(404).json({message: "Enter both email and passowrd"})
  console.log(req.body)
  try {
    let user = await Customer.findOne({ email });
    if (user) {
      console.log("Customer already exists");
      return res.status(400).json({ msg: "Customer already exists" });
    }

    console.log("Customer not found, proceeding with signup");

    // Generate OTP and save it temporarily (e.g., store it in Redis or DB with a TTL)
    const otp = generateOtp();
    console.log("Generated OTP:", otp);

    // Send OTP via email
    const mailOptions = {
      from: 'admin@resto.com.my', // Your sender email
      to: email, // User's email
      subject: 'Email Verification - OTP',
      text: `Your verification code is: ${otp}`, // Simple text message
    };

    transporter.sendMail(mailOptions, async (err, info) => {
      if (err) {
        console.log("Error sending email:", err);
        return res.status(500).json({ error: "Error sending OTP" });
      } else {
        console.log("Email sent:", info.response);
        
        // Instead of creating a customer immediately, save the OTP in a temporary collection (e.g., OTP or verification)
        const customer = new Customer({
          email,
          password,
          otp, // Store the OTP temporarily
          isVerified: false, // User is not verified yet
        });
        await customer.save();
        console.log("Customer saved with OTP");

        return res.status(201).json({ msg: "OTP sent to email. Please verify.", id: customer._id });
      }
    });
  } catch (error) {
    console.log("Error:", error.message);
    return res.status(500).json({ error: "Server error" });
  }
};

export const verifyOtpforSignup = async (req, res) => {
  const { email, otp } = req.body;
  
  try {
    // Find the user based on email
    const customer = await Customer.findOne({ email });

    if (!customer) {
      return res.status(404).json({ msg: "Customer not found" });
    }

    // Check if the provided OTP matches
    if (customer.otp !== otp) {
      return res.status(400).json({ msg: "Invalid OTP" });
    }

    // If OTP is correct, mark the user as verified
    customer.isVerified = true;
    customer.otp = null; // Clear the OTP once verified
    await customer.save();

    return res.status(200).json({ msg: "Email verified successfully" });
  } catch (error) {
    console.log("Error:", error.message);
    return res.status(500).json({ error: "Server error" });
  }
};


export const login = async (req, res) => {
  const { email, password, fcmToken } = req.body;

  console.log("Request body:", req.body);

  try {
  
    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    if (fcmToken) {
      customer.fcmToken = fcmToken; // Assuming the schema has an `fcmToken` field
      await customer.save();
    }

    return res.status(200).json({
      msg: "Login successful",
      userId: customer._id,
    });
  } catch (error) {
    console.error("Error:", error.message);
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
      "averageRating mainTag name address imageSnippet imagesCover vacationMode"
    );

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
    points, 
    discountApplied,
  } = req.body;

  try {
    const user = await Customer.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (points > user.points) {
      return res.status(400).json({ message: "Insufficient points" });
    }
    if (totalAmount > user.balance) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const validatedMenuItems = await Promise.all(
      menuItems.map(async (item) => {
        const menuItem = await Menu.findById(item.menuItem);
        if (!menuItem) {
          throw new Error(`Menu item with ID ${item.menuItem} not found`);
        }

        const selectedOptions = item.selectedOptions || [];
        selectedOptions.forEach((option) => {
          const menuOption = menuItem.options.find((opt) => opt.name === option.name);
          if (!menuOption || !menuOption.values.includes(option.value)) {
            throw new Error(`Invalid option "${option.value}" for "${option.name}" in menu item ${menuItem.name}`);
          }
        });

        return {
          menuItem: item.menuItem,
          quantity: item.quantity,
          selectedOptions: selectedOptions,
        };
      })
    );

    user.points -= points;
    user.balance -= totalAmount;
    await user.save(); 

    const reservation = new Reservation({
      user: userId,
      restaurant: restaurantId,
      guestNumber,
      date,
      time,
      menuItems: validatedMenuItems,
      note,
      name,
      contactNo,
      totalAmount, 
      promotionCard, 
      discountApplied, 
      pointsApplied: points,
      balanceDeducted: totalAmount, 
    });

    await reservation.save();

    res.status(201).json({ message: "Reservation created successfully", reservation });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const getPrAndOr = async (req, res)=> {
  const {id} = req.params
  try {
    const restaurants = await Restaurant.findById(id).select(
      " name description imagesCover operationalHours promotionalHours locationLink address"
    );

    return res.status(200).json(restaurants);
  } catch (error) {
    console.error("Error fetching restaurants:", error.message);
    return res.status(500).json({ error: "Server error" });
  }
}

export const getMenuItems = async (req, res) => {
  const { restaurantId, categoryName } = req.query; 

  try {
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

export const deleteMenuItem = async (req, res) => {
  const { menuItemId } = req.params; // Get the menuItemId from the route parameters

  try {
    // Find and delete the menu item
    const deletedMenuItem = await Menu.findByIdAndDelete(menuItemId);

    // If no menu item is found, send a 404 response
    if (!deletedMenuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    // Send a success response
    res.status(200).json({ message: "Menu item deleted successfully" });
  } catch (error) {
    console.error("Error deleting menu item:", error); // Log error for debugging
    res.status(500).json({ message: "Server error", error });
  }
};

export const getCategories = async (req, res) => {
  const { restaurantId } = req.query; 

  try {
    const [categories, tables] = await Promise.all([
      Category.find({ restaurant: restaurantId }).select('name').exec(),
      Table.find({ restaurantId }).select('availablePax').exec()
    ]);

    const totalAvailablePax = tables.reduce((sum, table) => sum + table.availablePax, 0);

    res.status(200).json({ categories, totalAvailablePax });
  } catch (error) {
    console.error("Error fetching categories and pax:", error);
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

export const hasUserRated = async (req, res) => {
  const { userId, reservationId  } = req.query;

  try {
    const review = await Review.findOne({
      customer: userId,
      reservation: reservationId
    });

    if (!review) {
      return res.status(200).json(false);
    }

    // Return true or false based on whether the user has rated
    res.status(200).json(true);
  } catch (error) {
    console.error("Error checking rating status:", error);
    res.status(500).json({ message: "Server error", error });
  }
};


export const createReview = async (req, res) => {
  const { restaurantId, reservationId, customerId, rating, reviewText } = req.body;

  try {
    // Find the reservation
    const reservation = await Reservation.findById(reservationId);
    if (!reservation || reservation.user.toString() !== customerId.toString()) {
      return res.status(400).json({ message: "Invalid reservation or not authorized" });
    }

    if (reservation.restaurant.toString() !== restaurantId) {
      return res.status(400).json({ message: "Reservation does not match the restaurant" });
    }

    // Handle image uploads if provided in the request
    let imageUrls = [];
    if (req.files && req.files.images) {
      // Check if multiple files or a single file
      const images = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
      
      // Upload each image to Cloudinary
      for (const image of images) {
        const result = await cloudinary.uploader.upload(image.tempFilePath, {
          folder: 'reviews/images',
        });
        imageUrls.push(result.secure_url);
      }
    }

    // Create a new review
    const review = new Review({
      customer: customerId,
      restaurant: restaurantId,
      reservation: reservationId,
      rating,
      reviewText,
      images: imageUrls
  
    });
    console.log(review)

    await review.save();

    // Update restaurant's average rating
    await updateRestaurantRating(restaurantId);

    res.status(201).json({ message: "Review created successfully", review });
  } catch (error) {
    console.error("Error creating review:", error);
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

export const getPoints = async (req, res) => {
  try {
    const points = await Points.findOne();

    if (!points) {
      return res.status(404).json({
        success: false,
        message: "Points configuration not found",
      });
    }

    res.status(200).json({
      success: true,
      points,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const topup = async (req,res) => {

  const {userId , amount , transactionId} = req.body
  try {
    
    let user = await Customer.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const transaction = new Transaction({
      userId,
      amount,
      transactionId,
      status: 'success'
    });
    await transaction.save();

    
    user.balance += amount;
    await user.save();

    const pointsToAdd = Math.floor(amount / 10);
    if (pointsToAdd > 0) {
      user.points += pointsToAdd;
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: "Wallet topped up and points added",
      walletBalance: user.balance,
      points: user.points,
      transactionId: transaction.transactionId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

export const getTransactionHistory = async (req, res) => {
  const { userId } = req.params;

  try {
    const topUpTransactions = await Transaction.find({ userId }).sort({ createdAt: -1 });
    const reservations = await Reservation.find({ user: userId })
      .populate('restaurant', 'name') // Populate the restaurant name
      .select('totalAmount restaurant createdAt') // Only select necessary fields
      .sort({ createdAt: -1 });
    const reservationHistory = reservations.map((reservation) => ({
      type: 'Reservation', // Specify that this is a reservation entry
      restaurantName: reservation.restaurant.name,
      amountPaid: reservation.totalAmount,
      date: reservation.createdAt,
    }));

    const topUpHistory = topUpTransactions.map((transaction) => ({
      type: 'Top-up',
      amount: transaction.amount,
      date: transaction.createdAt,
    }));

    const transactionHistory = [...topUpHistory, ...reservationHistory];

    transactionHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      success: true,
      transactionHistory,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export const getBalance = async (req, res) => {

  const {userId}  = req.params

  try {

    const user = await Customer.findById(userId);
    if(!user){
      res.status(404).json({message : "User not Found"})
    }
    const balance = user.balance;
    const points = user.points
    
    res.status(200).json({success : true, balance, points })
    
  } catch (error) {
    console.log(error);
    res.status(500).json({message: "Server Error ", error})
  }
  
}