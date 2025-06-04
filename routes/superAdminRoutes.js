import express from "express";
import {
  addRestaurant,
  changeRestaurantPassword,
  deleteRestaurant,
  getRestaurantNames,
  getRestaurantReservations,
  login,
  logout,
  pointsManagement,
  sendNotification,
  signUp,
  sendMonthlyReport
} from "../controllers/superAdminController.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Hello from super admin");
});

router.post("/signup", signUp);
router.post("/login", login);
router.get('/logout', logout);
router.post("/addRestaurant", addRestaurant);
router.get("/getRestaurants", getRestaurantNames);
router.delete("/deleteRestaurant", deleteRestaurant);
router.put("/changeRestaurantPassword", changeRestaurantPassword);
router.post("/points", pointsManagement);
router.post('/sendNotification', sendNotification);
router.get('/restaurant/:restaurantId', getRestaurantReservations);
router.post('/restaurant/:restaurantId/send-report', sendMonthlyReport);

export default router;
