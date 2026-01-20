import express from 'express'
import { loginWithPassword, registerUser, signupVerifyOtp } from '../controllers/user.js';

const router=express.Router();

router.post('/signup',registerUser);
router.post('/verify-otp',signupVerifyOtp);
router.post('/login',loginWithPassword);



export default router;