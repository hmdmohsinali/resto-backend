import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { transporter } from "../utils/transpoter.js";
import SuperAdmin from "../models/SuperAdmin.js";
import Restaurant from "../models/Restaurant.js";
import Points from "../models/Points.js";
import jwt from "jsonwebtoken";
import Customer from "../models/Customer.js";
import admin from "../firebaseAdmin.js";
dotenv.config();



const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }  
  );
};

export const signUp = async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await SuperAdmin.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'SuperAdmin already exists' });
    }

    const customer = new SuperAdmin({ email, password });
    await customer.save();

    return res.status(201).json({ msg: 'SuperAdmin created successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
};

export const logout = async (req, res) => {
  res.clearCookie('token');
  return res.status(200).json({ msg: 'Logged out successfully' });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const customer = await SuperAdmin.findOne({ email });
    if (!customer) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

   
    const userId = customer._id

    return res.status(200).json({ msg: 'Login successful' , id: userId });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
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
    const { id } = req.query;
    
  
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
    const { id } = req.query;
    const { newPassword } = req.body;
  
    try {
      let restaurant = await Restaurant.findById(id);
      if (!restaurant) {
        return res.status(404).json({ msg: "Restaurant not found" });
      }
  
      restaurant.password = newPassword; 
      await restaurant.save();
  
      return res.status(200).json({ msg: "Password updated successfully" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Server error" });
    }
};

export const pointsManagement = async (req, res) => {
  const { pointsPerTopup, pointEqualTo } = req.body;

  try {
    let points = await Points.findOne();

    if (points) {
      points.pointsPerTopup = pointsPerTopup;
      points.pointEqualTo = pointEqualTo;

      points = await points.save();
      return res.status(200).json({
        success: true,
        message: "Points updated successfully",
        points,
      });
    } else {
      points = new Points({
        pointsPerTopup,
        pointEqualTo,
      });

      await points.save();
      return res.status(201).json({
        success: true,
        message: "Points created successfully",
        points,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const sendNotification =  async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required" });
  }

  try {
    const customers = await Customer.find({}, "fcmToken");
    const tokens = customers.map((customer) => customer.fcmToken).filter(Boolean);

    if (tokens.length === 0) {
      return res.status(404).json({ error: "No customers with FCM tokens found" });
    }
    const message = {
      notification: {
        title,
        body: content,
      },
      tokens,
    };

    // Send the notification
    const response = await admin.messaging().sendMulticast(message);

    // Handle invalid tokens
    const invalidTokens = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) invalidTokens.push(tokens[idx]);
    });

    // Optionally, remove invalid tokens from the database
    await Customer.updateMany(
      { fcmToken: { $in: invalidTokens } },
      { $unset: { fcmToken: 1 } }
    );

    return res.status(200).json({
      message: "Notifications sent successfully",
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
  } catch (error) {
    console.error("Error sending notifications:", error);
    return res.status(500).json({ error: "Failed to send notifications" });
  }
};

