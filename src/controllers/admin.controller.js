import db from "../config/db.js";
import bcrypt from "bcrypt";
import { generateTokenAndSetCookie } from "../utils/generateToken.js";


export const createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    const exists = await db("admins").where({ email }).first();
    if (exists) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db("admins").insert({
      name,
      email,
      password_hash: hashedPassword,
      role: "admin",
    });

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
    });
  } catch (error) {
    console.error("Create admin error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createAdminByAdmin = async (req, res) => {
  try {
    if (req.admin.role !== "super_admin") {
      return res.status(403).json({
        message: "Only super admin can create admins",
      });
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    const exists = await db("admins").where({ email }).first();
    if (exists) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db("admins").insert({
      name,
      email,
      password_hash: hashedPassword,
      role: "admin",
    });

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
    });
  } catch (error) {
    console.error("Create admin error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const admin = await db("admins")
      .where({ email })
      .first(["id", "name", "email", "password_hash", "role"]);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    generateTokenAndSetCookie(res, {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    });

    res.status(200).json({
      success: true,
      message: "Admin login successful",
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



export const adminLogout = async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Admin logged out successfully" });
};


export const getAllAdmins = async (req, res) => {
  try {
    const admins = await db("admins")
      .select("id", "name", "email", "role", "created_at")
      .orderBy("created_at", "desc");

    res.status(200).json({
      success: true,
      admins,
    });
  } catch (error) {
    console.error("Get admins error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const deleteAdmin = async (req, res) => {
  try {
    if (req.admin.role !== "super_admin") {
      return res.status(403).json({
        message: "Only super admin can delete admins",
      });
    }

    const { adminId } = req.params;

    const admin = await db("admins").where({ id: adminId }).first();
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (admin.role === "super_admin") {
      return res.status(403).json({
        message: "Super admin cannot be deleted",
      });
    }

    await db("admins").where({ id: adminId }).del();

    res.status(200).json({
      success: true,
      message: "Admin deleted successfully",
    });
  } catch (error) {
    console.error("Delete admin error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
