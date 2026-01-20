import {
  checkOtpRestrictions,
  trackOtpRequests,
  sendOtpByEmail,
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

    const existingUser = await db("users").where({ email }).first();
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const restriction = await checkOtpRestrictions(email);
    if (!restriction.success) {
      return res.status(restriction.status).json({ message: restriction.message });
    }

    const tracking = await trackOtpRequests(email);
    if (!tracking.success) {
      return res.status(tracking.status).json({ message: tracking.message });
    }

    const otpResult = await sendOtpByEmail(name, email);
    if (!otpResult.success) {
      return res.status(otpResult.status).json({ message: otpResult.message });
    }

    res.status(200).json({ message: "OTP sent successfully to email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const resendSignupOtp = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const existingUser = await db("users").where({ email }).first();
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const restriction = await checkOtpRestrictions(email);
    if (!restriction.success) {
      return res.status(restriction.status).json({ message: restriction.message });
    }

    const tracking = await trackOtpRequests(email);
    if (!tracking.success) {
      return res.status(tracking.status).json({ message: tracking.message });
    }

    const otpResult = await sendOtpByEmail(name || "User", email);
    if (!otpResult.success) {
      return res.status(otpResult.status).json({ message: otpResult.message });
    }

    res.status(200).json({ message: "OTP resent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const signupVerifyOtp = async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: "OTP is required" });
    }

    const savedOtp = await redis.get(`otp:${email}`);
    if (!savedOtp) {
      return res.status(400).json({ message: "OTP expired or not found" });
    }

    if (savedOtp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [userId] = await db("users").insert({
      name,
      email,
      password: hashedPassword,
    });

    const user = await db("users")
      .where({ id: userId })
      .first(["id", "name", "email"]);

    await redis.del(`otp:${email}`);

    generateTokenAndSetCookie(res, { id: user.id, email: user.email });

    res.status(201).json({ message: "Signup successful", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const loginWithPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await db("users").where({ email }).first();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    generateTokenAndSetCookie(res, { id: user.id, email: user.email });

    res.status(200).json({
      message: "Login successful",
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
