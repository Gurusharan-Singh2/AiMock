import { generateInterviewFeedback, generateInterviewQuestions } from "../aiagents/QuestionAgent.js";
import db from "../config/db.js";

export const generateInterview = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      jobRole,
      jobDescription,
      techStack,
      yearsOfExperience,
      numberOfQuestions = 5
    } = req.body;

    if (!jobRole || !techStack || !yearsOfExperience) {
      return res.status(400).json({
        message: "jobRole, techStack, and yearsOfExperience are required"
      });
    }

   
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const MONTHLY_LIMIT = 10; 

    const monthlyStat = await db("user_monthly_interview_stats")
      .where({ user_id: userId, year, month })
      .first();

    if ((monthlyStat?.interview_count || 0) >= MONTHLY_LIMIT) {
      return res.status(403).json({
        message: "Monthly interview limit reached"
      });
    };


    const aiResult = await generateInterviewQuestions({
      jobRole,
      jobDescription,
      techStack,
      yearsOfExperience,
      numberOfQuestions,
      entropySeed: Date.now()
    });

    if (!aiResult || !aiResult.questions?.length) {
      return res.status(500).json({
        message: "Failed to generate interview questions"
      });
    }

   
    const [interviewId] = await db("mock_interviews").insert({
      user_id: userId,
      job_role: jobRole,
      experience_level: yearsOfExperience,
      tech_stack: JSON.stringify(techStack)
    });

    const questionRows = aiResult.questions.map(q => ({
      interview_id: interviewId,
      question_type: q.type,
      question: q.question
    }));

    await db("interview_questions").insert(questionRows);

 
    res.status(201).json({
      message: "Interview questions generated successfully",
      interviewId,
      questions: aiResult.questions
    });

  } catch (error) {
    console.error("Generate Interview Error:", error);
    res.status(500).json({
      message: "Internal server error"
    });
  }
};



export const getInterviewQuestions = async (req, res) => {
  try {
 const userId = req.user.id;
    const { interviewId } = req.params;

    if (!interviewId) {
      return res.status(400).json({
        message: "Interview ID is required"
      });
    }

    
    const interview = await db("mock_interviews")
      .where({ id: interviewId, user_id: userId })
      .first();

    if (!interview) {
      return res.status(404).json({
        message: "Interview not found"
      });
    }

   
    const questions = await db("interview_questions")
      .where({ interview_id: interviewId })
      .select("id", "question_type", "question");

    res.status(200).json({
      message: "Interview questions fetched successfully",
      interview: {
        id: interview.id,
        jobRole: interview.job_role,
        experienceLevel: interview.experience_level,
        techStack: interview.tech_stack,
        questions
      }
    });

  } catch (error) {
    console.error("Fetch Interview Error:", error);
    res.status(500).json({
      message: "Internal server error"
    });
  }
};

export const getInterviewDetail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { interviewId } = req.params;

    if (!interviewId) {
      return res.status(400).json({
        message: "Interview ID is required"
      });
    }

    const interview = await db("mock_interviews")
      .where({ id: interviewId, user_id: userId })
      .first();

    if (!interview) {
      return res.status(404).json({
        message: "Interview not found"
      });
    }

    
    const questions = await db("interview_questions")
      .select("id", "question", "question_type", "created_at")
      .where({ interview_id: interviewId })
      .orderBy("id", "asc");

    res.status(200).json({
      message: "Interview details fetched successfully",
      interview: {
        id: interview.id,
        jobRole: interview.job_role,
        experienceLevel: interview.experience_level,
        techStack: JSON.parse(interview.tech_stack),
        totalQuestions: questions.length, 
        questions, 
        createdAt: interview.created_at
      }
    });

  } catch (error) {
    console.error("Fetch Interview Detail Error:", error);
    res.status(500).json({
      message: "Internal server error"
    });
  }
};




export const getUserInterviews = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch interviews along with feedback ID if exists
    const interviews = await db("mock_interviews as m")
      .leftJoin("mock_interview_attempts as a", function () {
        this.on("m.id", "=", "a.interview_id")
            .andOn("a.user_id", "=", db.raw("?", [userId]));
      })
      .where("m.user_id", userId)
      .orderBy("m.created_at", "desc")
      .select(
        "m.id",
        "m.job_role",
        "m.experience_level",
        "m.created_at",
        "a.id as feedbackId" // <-- include feedback ID
      );

    res.status(200).json({
      message: "User interviews fetched successfully",
      interviews
    });

  } catch (error) {
    console.error("Fetch User Interviews Error:", error);
    res.status(500).json({
      message: "Internal server error"
    });
  }
};


export const submitInterviewFeedback = async (req, res) => {
  try {
    const userId = req.user.id;
    const { interviewId } = req.params;
    const { answers } = req.body;

    if (!interviewId || !Array.isArray(answers)) {
      return res.status(400).json({
        message: "Interview ID and answers array are required"
      });
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const MONTHLY_LIMIT = 10; 

    const monthlyStat = await db("user_monthly_interview_stats")
      .where({ user_id: userId, year, month })
      .first();

    if ((monthlyStat?.interview_count || 0) >= MONTHLY_LIMIT) {
      return res.status(403).json({
        message: "Monthly interview limit reached"
      });
    }

    
    const interview = await db("mock_interviews")
      .where({ id: interviewId, user_id: userId })
      .first();

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    const questions = await db("interview_questions")
      .where({ interview_id: interviewId })
      .select("id", "question");

    if (!questions.length) {
      return res.status(400).json({
        message: "No questions found for this interview"
      });
    }

    const questionsAndAnswers = questions.map(q => {
      const userAnswer = answers.find(
        a => Number(a.questionId) === Number(q.id)
      );

      return {
        questionId: q.id,
        question: q.question,
        answer: userAnswer?.answer || ""
      };
    });

  
    const feedbackResult = await generateInterviewFeedback({
      jobRole: interview.job_role,
      yearsOfExperience: interview.experience_level,
      questionsAndAnswers
    });

    if (!feedbackResult || !Array.isArray(feedbackResult.feedback)) {
      console.error("Invalid AI feedback:", feedbackResult);
      return res.status(500).json({
        message: "Invalid feedback response from AI"
      });
    }

    const feedbackPayload = {
      overallScore: feedbackResult.overallScore,
      summary: feedbackResult.summary || "",
      strengths: feedbackResult.strengths || [],
      improvements: feedbackResult.improvements || [],
      questions: feedbackResult.feedback
    };

   
    await db.raw(
      `
      INSERT INTO mock_interview_attempts
        (user_id, interview_id, responses, feedback, status)
      VALUES (?, ?, ?, ?, 'feedback_generated')
      ON DUPLICATE KEY UPDATE
        feedback = VALUES(feedback),
        status = 'feedback_generated',
        updated_at = CURRENT_TIMESTAMP
      `,
      [
        userId,
        interviewId,
        JSON.stringify(answers),
        JSON.stringify(feedbackPayload)
      ]
    );

    await db.raw(
      `
      INSERT INTO user_monthly_interview_stats
        (user_id, year, month, interview_count)
      VALUES (?, ?, ?, 1)
      ON DUPLICATE KEY UPDATE
        interview_count = interview_count + 1,
        updated_at = CURRENT_TIMESTAMP
      `,
      [userId, year, month]
    );

    return res.status(201).json({
      message: "Interview feedback generated successfully",
      ...feedbackPayload
    });

  } catch (error) {
    console.error("Submit Interview Feedback Error:", error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};


export const getInterviewFeedback = async (req, res) => {
  try {
    const userId = req.user.id;
    const { interviewId } = req.params;

    const attempt = await db("mock_interview_attempts")
      .where({ user_id: userId, interview_id: interviewId })
      .first();

    if (!attempt) {
      return res.status(404).json({ message: "Interview not found" });
    }

    let feedbackData = null;
    try {
      feedbackData = attempt.feedback ? JSON.parse(attempt.feedback) : null;
    } catch (e) {
      console.error("❌ Failed to parse stored feedback JSON:", e);
      return res.status(500).json({ message: "Stored feedback is corrupted" });
    }

    
    

    res.status(200).json({
      message: "Interview feedback fetched successfully",
      interviewId,
      overallScore: feedbackData?.overallScore ?? null,
      summary: feedbackData?.summary ?? "",
      strengths: feedbackData?.strengths ?? [],
      improvements: feedbackData?.improvements ?? [],
      questions: feedbackData?.questions ?? [] 
    });

  } catch (error) {
    console.error("Get Interview Feedback Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



export const getRemainingInterviewLimit = async (req, res) => {
  try {
    const userId = req.user.id;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const subscription = await db("user_subscriptions as us")
      .join("subscriptions as s", "us.subscription_id", "s.id")
      .where("us.user_id", userId)
      .select("s.monthly_interview_limit")
      .first();

    const limit = subscription?.monthly_interview_limit ?? 10; // FREE PLAN

  
    const stat = await db("user_monthly_interview_stats")
      .where({ user_id: userId, year, month })
      .first();

    const used = stat?.interview_count || 0;
    const remaining = Math.max(limit - used, 0);

    
    res.status(200).json({
      year,
      month,
      limit,
      used,
      remaining,
      isLimitReached: remaining === 0
    });

  } catch (error) {
    console.error("Remaining Interview Limit Error:", error);
    res.status(500).json({
      message: "Internal server error"
    });
  }
};


