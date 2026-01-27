import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API
});

function cleanJsonResponse(text) {
  if (!text) return "";
  return text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

export async function generateInterviewQuestions({
  jobRole,
  jobDescription,
  techStack,
  yearsOfExperience,
  numberOfQuestions = 5
}) {
  try {
    const messages = [
      {
        role: "system",
        content: `
You are a professional technical interviewer.

STRICT RULES:
- Output MUST be valid raw JSON
- Return ONLY JSON
- No markdown or extra text

QUESTION GUIDELINES:
- Adjust difficulty by years of experience:
  • 0–2 years → Junior
  • 3–5 years → Mid-level
  • 6+ years → Senior
- Include technical, scenario-based, behavioral, and system design questions (6+ years)
- Must be realistic and interview-ready

Current Date: ${new Date().toUTCString()}
        `
      },
      {
        role: "user",
        content: JSON.stringify({ jobRole, jobDescription, techStack, yearsOfExperience, numberOfQuestions })
      }
    ];

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      messages
    });

    const rawContent = response.choices?.[0]?.message?.content;
    if (!rawContent) throw new Error("Empty AI response");

    const cleanedContent = cleanJsonResponse(rawContent);

    let parsedResult;
    try {
      parsedResult = JSON.parse(cleanedContent);
    } catch (e) {
      console.error("❌ AI returned invalid JSON:\n", cleanedContent);
      throw new Error("Failed to parse AI JSON response");
    }

    // Optional validation
    if (!Array.isArray(parsedResult.questions)) {
      throw new Error("AI JSON does not contain 'questions' array");
    }

    return parsedResult;

  } catch (error) {
    console.error("❌ Error generating interview questions:", error.message);
    throw error;
  }
}


// utils/interviewFeedback.js
export async function generateInterviewFeedback({
  jobRole,
  questionsAndAnswers,
  yearsOfExperience
}) {
  try {
    const messages = [
      {
        role: "system",
        content: `
You are an experienced technical interviewer and career coach.

STRICT RULES:
- Output MUST be valid raw JSON
- Return ONLY JSON
- No markdown or extra text

FEEDBACK GUIDELINES:
- Provide per-question feedback, score (1–5), and the ideal/correct answer
- Adjust depth by experience:
  • 0–2 years → focus on basics
  • 3–5 years → practical insights
  • 6+ years → advanced/system-level advice

FEW-SHOT EXAMPLES:
{
  "overallScore": 4,
  "feedback": [
    {
      "questionId": 1,
      "answer": "I used a for loop to iterate over array elements.",
      "correctAnswer": "Using array.map is more concise and idiomatic.",
      "feedback": "Good basic approach, but could use array methods for cleaner code.",
      "score": 4
    }
  ]
}

Current Date: ${new Date().toUTCString()}
        `
      },
      {
        role: "user",
        content: JSON.stringify({ jobRole, yearsOfExperience, questionsAndAnswers })
      }
    ];

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      messages
    });

    const rawContent = response.choices?.[0]?.message?.content;
    if (!rawContent) throw new Error("Empty AI response");

    const cleanedContent = cleanJsonResponse(rawContent);

    let parsedResult;
    try {
      parsedResult = JSON.parse(cleanedContent);
    } catch (e) {
      console.error("❌ AI returned invalid JSON:\n", cleanedContent);
      throw new Error("Failed to parse AI JSON response");
    }

    if (!Array.isArray(parsedResult.feedback) || typeof parsedResult.overallScore !== "number") {
      throw new Error("AI JSON feedback missing required fields");
    }

    const scaleScore = (score1to5) =>
      Math.round((Math.min(Math.max(score1to5 || 1, 1), 5) * 10) / 5);

    // Map AI feedback to include user's original answer
    parsedResult.feedback = parsedResult.feedback.map(f => {
      const userAns = questionsAndAnswers.find(q => q.questionId === f.questionId)?.answer || "";
      return {
        questionId: f.questionId,
        userAnswer: userAns,
        correctAnswer: f.correctAnswer || "",
        feedback: f.feedback,
        score: scaleScore(f.score)
      };
    });

    parsedResult.overallScore = scaleScore(parsedResult.overallScore);

    return parsedResult;

  } catch (error) {
    console.error("❌ Error generating interview feedback:", error.message);
    throw error;
  }
}

