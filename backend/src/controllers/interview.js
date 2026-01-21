import { generateInterviewQuestions } from "../aiagents/QuestionAgent.js";
import db from "../config/db.js";


export const generateInterview = async (req, res) => {
  try {
    const userId = req.user.id;
    // const userId = 1;

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
    // const userId = 1;    
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


export const getUserInterviews = async (req, res) => {
  try {
 const userId = req.user.id;
    // const userId = 1;
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
