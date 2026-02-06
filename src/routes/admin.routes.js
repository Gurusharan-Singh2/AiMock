import express from "express";
import {
  adminLogin,
  adminLogout,
  createAdminByAdmin,
  getAllAdmins,
  deleteAdmin,
  createAdmin,
  getAllUser,
} from "../controllers/admin.controller.js";
import { adminAuth } from "../middleware/index.js";

const router = express.Router();

router.post("/login", adminLogin);
router.post("/logout", adminLogout);

router.post("/create-api",createAdmin);
router.post("/create", adminAuth, createAdminByAdmin);
router.get("/list", adminAuth, getAllAdmins);
router.delete("/:adminId", adminAuth, deleteAdmin);

router.get("/allUser",getAllUser)
export default router;
