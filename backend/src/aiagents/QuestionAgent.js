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

Your task is to generate mock interview questions.

STRICT RULES:
- Output MUST be valid raw JSON
- DO NOT wrap the response in markdown or code blocks
- DO NOT include explanations, comments, or extra text
- Return ONLY JSON

QUESTION GUIDELINES:
- Adjust difficulty based on years of experience:
  • 0–2 years → Junior
  • 3–5 years → Mid-level
  • 6+ years → Senior
- Include a mix of:
  • Technical questions
  • Scenario-based questions
  • Behavioral questions
  • System design questions (ONLY for 6+ years experience)
- Questions must be realistic and interview-ready

Current Date: ${new Date().toUTCString()}
        `
      },
      {
        role: "user",
        content: JSON.stringify({
          jobRole,
          jobDescription,
          techStack,
          yearsOfExperience,
          numberOfQuestions
        })
      }
    ];

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      messages
    });

    const rawContent = response.choices?.[0]?.message?.content;

    if (!rawContent) {
      throw new Error("Empty response from AI");
    }

    const cleanedContent = cleanJsonResponse(rawContent);

    let parsedResult;
    try {
      parsedResult = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("❌ AI returned invalid JSON:\n", cleanedContent);
      throw new Error("Failed to parse AI JSON response");
    }

    return parsedResult;

  } catch (error) {
    console.error("❌ Error generating interview questions:", error.message);
    throw error;
  }
}





