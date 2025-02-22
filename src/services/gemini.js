import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API with your API key
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

// Get the model
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Function to generate content using Gemini
export const generateContent = async (prompt) => {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating content:", error);
    throw error;
  }
};

// Function to generate content with chat history
export const generateChatContent = async (messages) => {
  try {
    const chat = model.startChat();
    const result = await chat.sendMessage(messages);
    return result.response.text();
  } catch (error) {
    console.error("Error generating chat content:", error);
    throw error;
  }
}; 