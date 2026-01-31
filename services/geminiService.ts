import { GoogleGenAI, Type, Schema } from "@google/genai";
import { QuizResponse } from "../types";

// Helper to convert file to base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

const quizSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    locationName: {
      type: Type.STRING,
      description: "The name of the location or object in the image.",
    },
    description: {
      type: Type.STRING,
      description: "A brief educational description of the scene.",
    },
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          level: {
            type: Type.STRING,
            enum: ["低年級", "中高年級", "高年級難題"],
            description: "The difficulty level of the question.",
          },
          question: {
            type: Type.STRING,
            description: "The quiz question text (max 30 words).",
          },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "4 multiple choice options.",
          },
          answer: {
            type: Type.STRING,
            description: "The correct answer (must match one of the options).",
          },
          explanation: {
            type: Type.STRING,
            description: "Explanation suitable for elementary students.",
          },
        },
        required: ["level", "question", "options", "answer", "explanation"],
      },
    },
  },
  required: ["locationName", "description", "questions"],
};

export const generateQuiz = async (base64Image: string): Promise<QuizResponse> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    你是一位資深國小老師,熟悉國小低中高年級學生知識程度,並且熟悉日本文化與日文.
    請將上傳照片根據線上維基百科和線上國小教科書內容。
    幫我出三題低年級的選擇題與三題中高年級的選擇題,一題高年級的難題.
    共七題,每一題字數不含選項在30字以內,難度中偏易.
    針對這些風景特色來考考學生.
    在每一個題目後方要附上答案,和國小學生聽得懂的解析.
    請確保輸出的 JSON 格式正確。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        tools: [{ googleSearch: {} }], // Enable grounding
        responseMimeType: "application/json",
        responseSchema: quizSchema,
        systemInstruction: "You are an expert Japanese culture and elementary education guide.",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text) as QuizResponse;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};