import express from "express";
import {
  addRestaurant,
  changeRestaurantPassword,
  deleteRestaurant,
  getRestaurantNames,
  login,
  pointsManagement,
  signUp,
} from "../controllers/superAdminController.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Hello from super admin");
});

router.post("/signup", signUp);
router.post("/login", login);
router.post("/addRestaurant", addRestaurant);
router.get("/getRestaurants", getRestaurantNames);
router.delete("/deleteRestaurant", deleteRestaurant);
router.put("/changeRestaurantPassword", changeRestaurantPassword);
router.post("/points", pointsManagement);

export default router;
