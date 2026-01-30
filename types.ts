export enum GradeLevel {
  Low = "低年級",
  MidHigh = "中高年級",
  Advanced = "高年級難題"
}

export interface QuizQuestion {
  level: GradeLevel;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export interface QuizResponse {
  locationName: string;
  description: string;
  questions: QuizQuestion[];
}

export interface GeneratedContent {
  quizData: QuizResponse;
  originalImage: string; // Base64
}