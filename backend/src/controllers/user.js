import {
  checkOtpRestrictions,
  trackOtpRequests,
  sendOtpByEmail,
} from "../utils/authHelper.js";
import db from "../config/db.js";
import redis from "../config/redis.js";
import bcrypt from "bcrypt";
import { generateTokenAndSetCookie } from "../utils/generateToken.js";
import { uploadToTebi } from "../libs/s3.js";


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
      .first(["id", "name", "email","isBoarding"]);

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
      user: { id: user.id, name: user.name, email: user.email,isBoarding:user.isBoarding },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};



export const forgotPasswordSendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await db("users").where({ email }).first();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }


    

    const restriction = await checkOtpRestrictions(email);
    if (!restriction.success) {
      return res.status(restriction.status).json({ message: restriction.message });
    }

    const tracking = await trackOtpRequests(email);
    if (!tracking.success) {
      return res.status(tracking.status).json({ message: tracking.message });
    }

    const otpResult = await sendOtpByEmail(user.name, email);
    if (!otpResult.success) {
      return res.status(otpResult.status).json({ message: otpResult.message });
    }
     

    res.status(200).json({ message: "OTP sent for password reset" });
  
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const resendForgotPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await db("users").where({ email }).first();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const restriction = await checkOtpRestrictions(email);
    if (!restriction.success) {
      return res.status(restriction.status).json({ message: restriction.message });
    }

    const tracking = await trackOtpRequests(email);
    if (!tracking.success) {
      return res.status(tracking.status).json({ message: tracking.message });
    }

    const otpResult = await sendOtpByEmail(user.name, email);
    if (!otpResult.success) {
      return res.status(otpResult.status).json({ message: otpResult.message });
    }

    res.status(200).json({ message: "OTP resent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const verifyForgotPasswordOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const savedOtp = await redis.get(`otp:${email}`);
    if (!savedOtp) {
      return res.status(400).json({ message: "OTP expired or not found" });
    }

    if (savedOtp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }


    await redis.setex(`reset_verified:${email}`, 300, "true");

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: "Email and new password are required" });
    }

    const isVerified = await redis.get(`reset_verified:${email}`);
    if (!isVerified) {
      return res.status(403).json({ message: "OTP verification required" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db("users")
      .where({ email })
      .update({ password: hashedPassword });


    await redis.del(`otp:${email}`);
    await redis.del(`reset_verified:${email}`);

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};





export const onboarding = async (req, res) => {
  try {
    const { college_name, year_passing, linkedin_url } = req.body;
    // const userId = 17;
    const userId = req.user.id;

    if (!college_name || !year_passing || !linkedin_url) {
      return res.status(400).json({ message: "Fill All required fields" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const file = req.file;
    const fileUrl = await uploadToTebi(
      file.buffer,
      file.originalname,
      file.mimetype
    );

    const onboarding = await db("onboarding").insert({
      img: fileUrl,
      college_name,
      year_passing,
      linkedin_url,
      user_id: userId,
    });

    if (!onboarding) {
      return res.status(400).json({
        message: "Onboarding failed, please try again",
      });
    }

    await db("users")
      .where({ id: userId })
      .update({ isBoarding: true });

    // ✅ fetch updated user
    const user = await db("users")
      .select("id", "name", "email", "isBoarding")
      .where({ id: userId })
      .first();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Onboarding Successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isBoarding: user.isBoarding,
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


export const getUserProfile = async (req, res) => {
  try {
    // const userId = req.user.id;
    const userId = 17;

    const user = await db("users as u")
      .leftJoin("onboarding as o", "u.id", "=", "o.user_id")
      .select(
        "u.id",
        "u.name",
        "u.email",
        "u.isBoarding",
        "u.created_at",
        "o.img",
        "o.college_name",
        "o.year_passing",
        "o.linkedin_url",
        "o.created_at as onboarding_created_at"
      )
      .where("u.id", userId)
      .first(); 

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      user,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


