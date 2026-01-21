import express from "express";
import {
  generateInterview,
  getInterviewQuestions,
  getUserInterviews
} from "../controllers/interview.js";
import {authMiddleware} from "../middleware/index.js";

const router = express.Router();

// router.post("/generate",  generateInterview);
// router.get("/:interviewId",  getInterviewQuestions);
// router.get("/",  getUserInterviews);


router.post("/generate", authMiddleware, generateInterview);
router.get("/:interviewId", authMiddleware, getInterviewQuestions);
router.get("/", authMiddleware, getUserInterviews);

export default router;
