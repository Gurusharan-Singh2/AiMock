import {
  checkOtpRestrictions,
  sendOtpByEmail,
  trackOtpRequests,
} from "../utils/authHelper.js";
import db from "../config/db.js";
import redis from "../config/redis.js";
import bcrypt from "bcrypt";
import { generateTokenAndSetCookie } from "../utils/generateToken.js";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await db
      .select("*")
      .from("users")
      .where({ email: email })
      .first();
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    await checkOtpRestrictions(email);
    await trackOtpRequests(email);
    await sendOtpByEmail(name, email);

    res.status(200).json({ message: "OTP sent successfully to email." });
  } catch (error) {
    res.status(400).json({ error: error.message });
  } finally {
    await db.destroy();
  }
};

export const signupVerifyOtp = async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;

    if (!otp) return res.status(400).json({ message: "OTP is required" });

    const savedOtp = await redis.get(`otp:${email}`);
    if (!savedOtp)
      return res.status(400).json({ message: "OTP expired or not found" });

    if (savedOtp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db("users").insert({
      name,
      email,
      password: hashedPassword,
    });

    const userId = result[0];

    const user = await db("users")
      .where({ id: userId })
      .first(["name", "email"]);

    await redis.del(`otp:${email}`);

    generateTokenAndSetCookie(res, { id: user.id, email: user.email });

    res.status(201).json({ message: "Signup successful", user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  } finally {
    await db.destroy();
  }
};


export const loginWithPassword = async (req, res, next) => {
  
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Email and password are required", 400));
  }

  const user = await db('users')
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  
  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    return next(new ErrorHandler("Incorrect password", 401));
  }

  const token = generateToken({ id: user._id, email: user.email, name: user.username });

  res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    userInfo: {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      image: user.image,
    },
  });
};