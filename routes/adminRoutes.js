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
  updateAdress,
  updatePax,
  updateRestaurantDetails,
} from "../controllers/adminController.js";

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
router.post("/deletePromotionImage", deletePromotionalImage);

router.post("/addCategories", addCategory);
router.get("/getCategories", getCategories);
router.post("/addMenuItem", addMenuItem);
router.put("/editMenu", editMenuItem);


router.put("/toggleMenuVisibility", toggleMenuItemVisibility);
router.get("/getAllMenuItems", getAllMenuItems);

router.post ('/upateAdress' , updateAdress)




export default router;
