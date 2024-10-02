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
  createReview,
  getRestaurantReviews,
  getAllRestaurantsWithTags,
} from "../controllers/userController.js";


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
router.get('/getRestaurantsWithTags', getAllRestaurantsWithTags)
router.get('/getAllMenuItems' , getMenuItems)
router.get('/getSingleItem' , getMenuItemById);
router.post('/bookReservation' , createReservation);
router.post('/addReview' , createReview);
router.get('/getRestaurantReviews', getRestaurantReviews)
router.get('/getHistory' , );
router.get('/upcomingBooking' , )

export default router;
