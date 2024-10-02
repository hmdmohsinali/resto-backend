import express from "express";
import {
  signUp,
  login,
  forgotPassword,
  verifyOtp,
  changePassword,
  editProfile,
  getMenuItems,
  getMenuItemById,
  createReservation,
} from "../controllers/userController.js";
import bcrypt from "bcrypt";
import Customer from "../models/Customer.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Hello from customers side");
})

router.post('/signup', signUp);

router.post('/login', login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/change-password", changePassword);
router.put("/edit-profile", editProfile);
router.get('/getAllMenuItems' , getMenuItems)
router.get('/getSingleItem' , getMenuItemById);
router.post('/bookReservation' , createReservation);


export default router;
