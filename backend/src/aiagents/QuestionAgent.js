import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API,
});



function cleanJsonResponse(text) {
  if (!text) return "";
  return text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

const isEmptyAnswer = (ans) =>
  typeof ans !== "string" || ans.trim().length === 0;

const scaleScore = (s) => {
  const score = Number(s);
  if (!score || score <= 1) return 0;
  if (score >= 5) return 10;
  return Math.round(((score - 1) / 4) * 10);
};


const questiongenerateSystemPrompt= `
You are a professional technical interviewer generating interview questions
for a mock interview platform.

STRICT OUTPUT RULES:
- Output MUST be valid JSON
- Return ONLY JSON
- No markdown, no comments, no extra text

JSON SCHEMA (MUST MATCH EXACTLY):
{
  "questions": [
    {
      "type": "technical" | "scenario" | "behavioral" | "system-design",
      "question": string
    }
  ]
}

MANDATORY RULES:
- Generate EXACTLY the requested number of questions
- Use ONLY the provided jobRole, jobDescription, techStack, and yearsOfExperience
- Do NOT include IDs
- Do NOT repeat or rephrase questions
- Questions must be realistic and interview-ready
- Avoid trivia and purely theoretical questions

ANTI-REPETITION RULES:
- Do NOT reuse common interview questions
- Rotate focus areas (performance, debugging, architecture, testing, edge cases)
- Vary real-world scenarios and contexts
- Generate different questions on each request even if inputs are identical

DIFFICULTY BY EXPERIENCE:
- 0–2 years → junior fundamentals
- 3–5 years → mid-level real-world trade-offs
- 6+ years → senior architecture and scalability

QUESTION MIX RULES:
- Always include technical questions
- Always include at least one scenario-based question
- Include behavioral questions for all levels
- Include system-design questions ONLY if yearsOfExperience >= 6

Current Date: ${new Date().toUTCString()}
`;


export async function generateInterviewQuestions({
  jobRole,
  jobDescription,
  techStack,
  yearsOfExperience,
  numberOfQuestions = 5,
}) {
  try {
    const messages = [
      {
        role: "system",
        content: questiongenerateSystemPrompt,
      },
      {
        role: "user",
        content: JSON.stringify({
          jobRole,
          jobDescription,
          techStack,
          yearsOfExperience,
          numberOfQuestions,
        }),
      },
    ];

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.6,
      top_p: 0.9,
      messages,
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

    if (!Array.isArray(parsedResult.questions)) {
      throw new Error("AI JSON does not contain 'questions' array");
    }

    return parsedResult;
  } catch (error) {
    console.error("❌ Error generating interview questions:", error.message);
    throw error;
  }
}

const systemPrompt = `
You are an experienced technical interviewer and career coach.

STRICT OUTPUT RULES:
- Output MUST be valid JSON
- Return ONLY JSON
- No markdown, no comments, no extra text

JSON SCHEMA (MUST MATCH EXACTLY):
{
  "overallScore": number (1-5),
  "feedback": [
    {
      "questionId": number,
      "question": string,
      "correctAnswer": string,
      "feedback": string,
      "score": number (1-5)
    }
  ]
}

MANDATORY RULES:
- Use ONLY the provided questionIds
- Do NOT invent, reword, or merge questions
- Score strictly from 1 to 5 (1 = very poor, 5 = excellent)
- NEVER output score 0 (0 will be handled by the system)
- If the user's answer is empty, null, or only whitespace:
  - Set score to 1
  - Set feedback to "No answer provided by the candidate."

SCORING GUIDELINES:
- 1 → No attempt or completely incorrect
- 2 → Minimal understanding, major gaps
- 3 → Basic correctness, lacks depth
- 4 → Strong, mostly correct with minor gaps
- 5 → Excellent, complete, and well-explained

FEEDBACK DEPTH BY EXPERIENCE:
- 0–2 years → fundamentals, syntax, clarity
- 3–5 years → practical usage, edge cases, trade-offs
- 6+ years → architecture, performance, scalability

Current Date: ${new Date().toUTCString()}
`;


export async function generateInterviewFeedback({
  jobRole,
  questionsAndAnswers,
  yearsOfExperience,
}) {
  try {
    const messages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: JSON.stringify({
          jobRole,
          yearsOfExperience,
          questionsAndAnswers,
        }),
      },
    ];

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      messages,
    });

    const rawContent = response.choices?.[0]?.message?.content;
    if (!rawContent) throw new Error("Empty AI response");

    const cleanedContent = cleanJsonResponse(rawContent);
    const parsed = JSON.parse(cleanedContent);

    if (!Array.isArray(parsed.feedback)) {
      throw new Error("Invalid feedback array");
    }

    const validQuestionIds = new Set(
      questionsAndAnswers.map((q) => q.questionId)
    );

    parsed.feedback = parsed.feedback
      .filter((f) => validQuestionIds.has(f.questionId))
      .map((f) => {
        const qa = questionsAndAnswers.find(
          (q) => q.questionId === f.questionId
        );

        const userAnswer = qa?.answer || "";

        if (isEmptyAnswer(userAnswer)) {
          return {
            questionId: f.questionId,
            question: qa?.question || "",
            userAnswer: "",
            correctAnswer: f.correctAnswer || "",
            feedback: "No answer provided by the candidate.",
            score: 0,
          };
        }

        return {
          questionId: f.questionId,
          question: qa?.question || "",
          userAnswer,
          correctAnswer: f.correctAnswer || "",
          feedback: f.feedback || "",
          score: scaleScore(f.score),
        };
      });

   
    parsed.overallScore = Math.round(
      parsed.feedback.reduce((sum, f) => sum + f.score, 0) /
        parsed.feedback.length
    );

    return parsed;
  } catch (error) {
    console.error("❌ Error generating interview feedback:", error.message);
    throw error;
  }
}


