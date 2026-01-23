import express from 'express'
import { forgotPasswordSendOtp, getUserProfile, loginWithPassword, onboarding, registerUser, resendForgotPasswordOtp, resendSignupOtp, resetPassword, signupVerifyOtp, verifyForgotPasswordOtp } from '../controllers/user.js';
import { authMiddleware } from '../middleware/index.js';
import { upload } from '../libs/s3.js';

const router=express.Router();

router.post('/signup',registerUser);
router.post('/resend-otp',resendSignupOtp);
router.post('/verify-otp',signupVerifyOtp);
router.post('/login',loginWithPassword);

router.post("/forgot-password", forgotPasswordSendOtp);
router.post("/forgot-password/resend", resendForgotPasswordOtp);
router.post("/forgot-password/verify-otp", verifyForgotPasswordOtp);
router.post("/forgot-password/reset", resetPassword);

// router.post("/onboarding" ,onboarding);
router.post("/onboarding",authMiddleware,upload.single("img"),onboarding);
router.get("/profile",authMiddleware,getUserProfile)
// router.get("/profile",getUserProfile)
// router.post("/onboarding",upload.single("img"),onboarding);




export default router;