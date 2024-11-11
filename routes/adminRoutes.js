import express from "express";
import {
  addCategory,
  addMenuItem,
  addPromotionalImages,
  addTable,
  deletePromotionalImage,
  deleteRestaurantImage,
  editMenuItem,
  getAllMenuItems,
  getCategories,
  login,
  signUp,
  toggleMenuItemVisibility,
  toggleVacationMode,
  updateAdress,
  updatePax,
  updateRestaurantDetails,
  getOperationalHours,
  getPromotionalHours,
  addPromotionCode,
  getAllPromotions,
  deletePromotionCode,
  getCompletedReservations,
  getUpcomingReservations,
  updateRestaurantHours,
  getRestaurant,
  getTables,
  getReservationDetails,
  toggleReservationCompleted,
  getPromotionalImages,
  deleteTable,
} from "../controllers/adminController.js";
import { deleteMenuItem } from "../controllers/userController.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Hello from admin");
});

router.post("/signup", signUp);
router.post("/login", login);

router.post("/updateRestaurant", updateRestaurantDetails);
router.post("/deleteImage", deleteRestaurantImage);

router.post("/addTable", addTable);
router.put("/updateTable", updatePax);

router.post("/addPromotionImages", addPromotionalImages);
router.get('/getPromotioanlImages/:restaurantId'  ,getPromotionalImages )
router.post("/deletePromotionImage", deletePromotionalImage);

router.post("/addCategories", addCategory);
router.get("/getCategories", getCategories);
router.post("/addMenuItem", addMenuItem);
router.put("/editMenu", editMenuItem);

router.put("/toggleMenuVisibility", toggleMenuItemVisibility);
router.get("/getAllMenuItems", getAllMenuItems);
router.delete('/deleteMenuItem/:menuItemId', deleteMenuItem);

router.post("/upateAdress", updateAdress);
router.post("/toggleVacation", toggleVacationMode);

router.post("/updateHours", updateRestaurantHours);
router.get("/getOperationalHours", getOperationalHours);
router.get("/getPromotionalHours", getPromotionalHours);

router.post("/addPromotionCode", addPromotionCode);
router.get("/getAllPromotions", getAllPromotions);
router.delete("/deletePromotionCode", deletePromotionCode);
router.get("/getCompleted", getCompletedReservations);
router.get("/getUpcoming", getUpcomingReservations);
router.get("/restaurant/:id", getRestaurant);
router.get("/tables/:restaurantId", getTables);
router.get("/getSingleReservation/:reservationId", getReservationDetails);
router.post('/toggleComplete/:reservationId', toggleReservationCompleted)
router.delete('/deleteTable' , deleteTable)

export default router;
