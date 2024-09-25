import express from "express";
import {
  signUp,
  login,
  forgotPassword,
  verifyOtp,
  changePassword,
  editProfile,
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

export default router;
