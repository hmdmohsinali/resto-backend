import bcrypt from "bcrypt";
import Customer from "../models/Customer.js";
import dotenv from "dotenv";
import { transporter } from "../utils/transpoter.js";
import Restaurant from "../models/Restaurant.js";
import Reservation from "../models/Reservations.js";
import Menu from "../models/Menu.js";
import Review from "../models/Review.js";
import { updateRestaurantRating } from "../utils/updateRating.js";

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

    return res.status(201).json({ msg: "Customer created successfully" , id: customer._id});
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

    const otp = Math.floor(100000 + Math.random() * 900000);
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

    user.otp = null;
    await user.save();

    return res.status(200).json({ msg: "OTP verified successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
};

// Change Password
export const changePassword = async (req, res) => {
  const { newPassword, userId } = req.body;

  try {
    const user = await Customer.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "Customer not found" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
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

    user.fullName = fullName || user.fullName;
    user.address = address || user.address;
    user.phoneNumber = phoneNumber || user.phoneNumber;

    await user.save();

    return res.status(200).json({ msg: "Profile updated successfully", user });
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
};

export const createReservation = async (req, res) => {
  const {
    restaurantId,
    guestNumber,
    date,
    time,
    menuItems,
    note,
    name,
    contactNo,
    promotionCard,
  } = req.body;

  try {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Calculate total amount
    let totalAmount = 0;
    let discountApplied = 0;

    // Fetch menu items and calculate price
    for (const item of menuItems) {
      const menuItem = await Menu.findById(item.menuItem);
      if (!menuItem) {
        return res
          .status(404)
          .json({ message: `Menu item not found: ${item.menuItem}` });
      }
      totalAmount += menuItem.price * item.quantity;
    }

    // Check if promotional hours apply
    const currentDay = new Date(date).getDay(); // Get the day of the week (0 for Sunday, etc.)
    const promotionalHours = restaurant.promotionalHours.find(
      (ph) => ph.day === currentDay
    );

    if (promotionalHours) {
      const reservationTime = new Date(`1970-01-01T${time}:00`);
      const promoStartTime = new Date(
        `1970-01-01T${promotionalHours.start}:00`
      );
      const promoEndTime = new Date(`1970-01-01T${promotionalHours.end}:00`);

      if (
        reservationTime >= promoStartTime &&
        reservationTime <= promoEndTime
      ) {
        discountApplied = promotionalHours.discountPercent;
        totalAmount = totalAmount * ((100 - discountApplied) / 100);
      }
    }

    // Check if a promotion card is applied
    if (promotionCard) {
      const promotion = await Promotion.findOne({
        code: promotionCard,
        restaurant: restaurantId,
      });
      if (promotion) {
        // Apply the promotion card discount
        totalAmount = totalAmount * ((100 - promotion.percentage) / 100);
        discountApplied += promotion.percentage; // Track total discount applied
      } else {
        return res
          .status(400)
          .json({ message: "Invalid or expired promotion card" });
      }
    }

    // Create the reservation
    const reservation = new Reservation({
      user: req.user._id,
      restaurant: restaurantId,
      guestNumber,
      date,
      time,
      menuItems,
      note,
      name,
      contactNo,
      totalAmount,
      promotionCard,
      discountApplied,
    });

    await reservation.save();

    res
      .status(201)
      .json({ message: "Reservation created successfully", reservation });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getMenuItems = async (req, res) => {
  const { restaurantId } = req.query;

  try {
    const menuItems = await Menu.find({ restaurant: restaurantId })
      .select("name price image description") // Select specific fields
      .exec();

    if (!menuItems || menuItems.length === 0) {
      return res
        .status(404)
        .json({ message: "No menu items found for this restaurant." });
    }

    res.status(200).json(menuItems);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getMenuItemById = async (req, res) => {
    const { menuItemId } = req.query;
  
    try {
      const menuItem = await Menu.findById(menuItemId)
        .populate('category', 'name')  
        .exec();
  
      if (!menuItem) {
        return res.status(404).json({ message: 'Menu item not found.' });
      }
  
      res.status(200).json(menuItem);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  };


export const createReview = async (req, res) => {
    const { restaurantId, reservationId, rating, reviewText, images } = req.body;
    
    try {
      // Check if the reservation exists and is valid
      const reservation = await Reservation.findById(reservationId);
      if (!reservation || reservation.user.toString() !== req.user._id.toString()) {
        return res.status(400).json({ message: 'Invalid reservation or not authorized' });
      }
  
      // Ensure the reservation belongs to the restaurant
      if (reservation.restaurant.toString() !== restaurantId) {
        return res.status(400).json({ message: 'Reservation does not match the restaurant' });
      }
  
      // Create a new review
      const review = new Review({
        user: req.user._id,
        restaurant: restaurantId,
        reservation: reservationId,
        rating,
        reviewText,
        images
      });
  
      await review.save();
  
      // Update restaurant's average rating
      await updateRestaurantRating(restaurantId);
  
      res.status(201).json({ message: 'Review created successfully', review });
  
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  };
  
export const getRestaurantReviews = async (req, res) => {
    const { restaurantId } = req.params;
  
    try {
      // Fetch the restaurant along with its average rating
      const restaurant = await Restaurant.findById(restaurantId).select('averageRating');
      
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found.' });
      }
  
      // Fetch all reviews for the restaurant
      const reviews = await Review.find({ restaurant: restaurantId })
        .populate('user', 'name')  // Populate user to get the name of the reviewer
        .select('user images reviewText rating')  // Select specific fields from the Review schema
        .exec();
  
      // Send the reviews and average rating from the restaurant schema
      res.status(200).json({
        totalReviews: reviews.length,
        averageRating: restaurant.averageRating,
        reviews
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  };