import jwt from "jsonwebtoken";
import db from "../config/db.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    
    

    if (!token)
      return res.status(401).json({ message: "Unauthorized: Token not found" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);


    const user = await db("users")
      .where({ id: decoded.id })
      .first(["id", "name", "email"]);
    
      

    if (!user)
      return res.status(401).json({ message: "Unauthorized: User not found" });

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};




export const adminAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: Token not found" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Admin access only" });
    }

    const admin = await db("admins")
      .where({ id: decoded.id })
      .first(["id", "email","role"]);

    if (!admin) {
      return res.status(401).json({ message: "Unauthorized: Admin not found" });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};