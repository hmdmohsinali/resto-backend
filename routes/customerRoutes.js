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
  getUserDetails,
  deleteUser,
  getPrAndOr,
  getCategories,
  verfiyCard,
  getHistory,
  hasUserRated,
  getPoints,
  topup,
  getTransactionHistory,
  getBalance,
  verifyOtpforSignup,
} from "../controllers/userController.js";


const router = express.Router();

router.get("/", (req, res) => {
  res.send("Hello from customers side");
})

router.post('/signup', signUp);
router.post('/verifyOtpforSignup', verifyOtpforSignup);
router.post('/login', login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/change-password", changePassword);
router.put("/edit-profile", editProfile);
router.get('/getUserDetails/:userId' , getUserDetails);
router.delete('/deleteUser/:userId', deleteUser);
router.get('/getRestaurantsWithTags', getAllRestaurantsWithTags)
router.get('/getAllMenuItems' , getMenuItems);
router.get('/getCategories', getCategories);
router.get('/getSingleItem' , getMenuItemById);
router.get('/getPromotionalAndOperationalHours/:id', getPrAndOr)
router.post('/bookReservation' , createReservation);
router.post('/addReview' , createReview);
router.get('/getRestaurantReviews/:restaurantId', getRestaurantReviews)
router.post('/verfiyCard',verfiyCard )
router.get('/getHistory',getHistory );
router.get('/hasRated' , hasUserRated);
router.get('/getPoints' ,  getPoints);
router.post('/topup', topup);
router.get('/transactionHistory/:userId' , getTransactionHistory);
router.get('/getBalance/:userId' , getBalance )

export default router;
