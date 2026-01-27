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
     


  
    const aiResult = await generateInterviewQuestions({
      jobRole,
      jobDescription,
      techStack,
      yearsOfExperience,
      numberOfQuestions
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


    const interviews = await db("mock_interviews")
      .where({ user_id: userId })
      .orderBy("created_at", "desc")
      .select(
        "id",
        "job_role",
        "experience_level",
        "created_at"
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
        message: "Interview ID and answers array are required",
      });
    }

    const interview = await db("mock_interviews")
      .where({ id: interviewId, user_id: userId })
      .first();

    if (!interview) {
      return res.status(404).json({
        message: "Interview not found",
      });
    }

    const questions = await db("interview_questions")
      .where({ interview_id: interviewId })
      .select("id", "question");

    if (!questions.length) {
      return res.status(400).json({
        message: "No questions found for this interview",
      });
    }

    const questionsAndAnswers = questions.map((q) => {
      const userAnswer = answers.find((a) => a.questionId === q.id);
      return {
        questionId: q.id,
        question: q.question,
        answer: userAnswer?.answer || "",
      };
    });


    const feedbackResult = await generateInterviewFeedback({
      jobRole: interview.job_role,
      yearsOfExperience: interview.experience_level,
      questionsAndAnswers,
    });

  

    if (
      !feedbackResult ||
      !Array.isArray(feedbackResult.feedback)
    ) {
      console.error("Invalid AI feedback:", feedbackResult);
      return res.status(500).json({
        message: "Invalid feedback response from AI",
      });
    }

   
    const feedbackRows = feedbackResult.feedback.map((f) => ({
      interview_id: interviewId,
      question_id: f.questionId,
      answer: f.answer || "",
      feedback: f.feedback,
      score: f.score,
    }));

    await db("interview_feedback").insert(feedbackRows);

    return res.status(201).json({
      message: "Interview feedback generated successfully",
      overallScore: feedbackResult.overallScore,
      summary: feedbackResult.summary,
      strengths: feedbackResult.strengths || [],
      improvements: feedbackResult.improvements || [],
      feedback: feedbackResult.feedback,
    });

  } catch (error) {
    console.error("Submit Interview Feedback Error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


export const getInterviewFeedback = async (req, res) => {
  try {
    const userId = req.user.id;
    const { interviewId } = req.params;

    
    const interview = await db("mock_interviews")
      .where({ id: interviewId, user_id: userId })
      .first();

    if (!interview) {
      return res.status(404).json({
        message: "Interview not found"
      });
    }

    const feedback = await db("interview_feedback as f")
      .join("interview_questions as q", "q.id", "f.question_id")
      .where("f.interview_id", interviewId)
      .select(
        "q.question",
        "f.answer",
        "f.feedback",
        "f.score",
        "f.created_at"
      )
      .orderBy("q.id", "asc");

    res.status(200).json({
      message: "Interview feedback fetched successfully",
      interviewId,
      feedback
    });

  } catch (error) {
    console.error("Get Interview Feedback Error:", error);
    res.status(500).json({
      message: "Internal server error"
    });
  }
};