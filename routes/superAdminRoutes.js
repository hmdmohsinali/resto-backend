import express from "express";
import {
  addRestaurant,
  changeRestaurantPassword,
  deleteRestaurant,
  getRestaurantNames,
  login,
  logout,
  pointsManagement,
  signUp,
} from "../controllers/superAdminController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Hello from super admin");
});

router.post("/signup", signUp);
router.post("/login", login);
router.get('/logout', logout);
router.post("/addRestaurant", verifyToken, addRestaurant);
router.get("/getRestaurants", verifyToken, getRestaurantNames);
router.delete("/deleteRestaurant", verifyToken, deleteRestaurant);
router.put("/changeRestaurantPassword", verifyToken, changeRestaurantPassword);
router.post("/points", verifyToken, pointsManagement);


export default router;
