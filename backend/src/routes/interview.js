import express from "express";
import {
  generateInterview,
  getInterviewDetail,
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
router.get("/interviewDetail/:interviewId",  getInterviewDetail);
// router.get("/interviewDetail:interviewId", authMiddleware, getInterviewDetail);
router.get("/", authMiddleware, getUserInterviews);

export default router;
