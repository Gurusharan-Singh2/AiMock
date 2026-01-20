import express from 'express'
import { registerUser, signupVerifyOtp } from '../controllers/user.js';

const router=express.Router();

router.post('/signup',registerUser);
router.post('/verify-otp',signupVerifyOtp);



export default router;