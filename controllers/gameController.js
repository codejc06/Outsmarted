import fetch from 'node-fetch';

export async function getQuestion() {
  try {
    const response = await fetch('https://the-trivia-api.com/api/questions?limit=1');
    const data = await response.json();

    if (!data || data.length === 0) {
      throw new Error("No question returned from API");
    }

    const raw = data[0];

    return {
      question: raw.question,
      answer: raw.correctAnswer
    };
  } catch (error) {
    console.error("Failed to fetch question:", error.message);

    // fallback static question
    return {
      question: "Fallback: What is the capital of France?",
      answer: "Paris"
    };
  }
}




