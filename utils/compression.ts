import LZString from 'lz-string';
import { QuizResponse } from '../types';

export const compressQuizData = (data: QuizResponse): string => {
  const jsonString = JSON.stringify(data);
  return LZString.compressToEncodedURIComponent(jsonString);
};

export const decompressQuizData = (compressedString: string): QuizResponse | null => {
  try {
    const jsonString = LZString.decompressFromEncodedURIComponent(compressedString);
    if (!jsonString) return null;
    return JSON.parse(jsonString) as QuizResponse;
  } catch (e) {
    console.error("Failed to decompress data", e);
    return null;
  }
};