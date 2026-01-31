import PptxGenJS from "pptxgenjs";
import { QuizResponse } from "../types";

export const generatePPT = (data: QuizResponse, imageBase64: string) => {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";

  // Define Colors
  const bgMain = "F0F9FF"; // Light Blue
  const textDark = "1E293B"; // Slate 800
  const accentColor = "3B82F6"; // Blue 500

  // 1. Cover Slide
  const cover = pptx.addSlide();
  cover.background = { color: bgMain };
  
  // Title
  cover.addText(data.locationName, {
    x: 0.5, y: 1, w: "90%", h: 1,
    fontSize: 44, bold: true, color: textDark, align: "center"
  });

  // Description
  cover.addText(data.description, {
    x: 1, y: 2, w: "80%", h: 1.5,
    fontSize: 18, color: "475569", align: "center" // Slate 600
  });

  // Image
  if (imageBase64) {
    cover.addImage({
      data: `data:image/jpeg;base64,${imageBase64}`,
      x: "30%", y: 3.8, w: "40%", h: 3,
      sizing: { type: "contain", w: 4, h: 3 }
    });
  }

  cover.addText("製作: Gemini AI 國小教材生成器", {
    x: 0, y: 6.8, w: "100%", h: 0.5,
    fontSize: 12, color: "94A3B8", align: "center"
  });

  // 2. Question Slides
  data.questions.forEach((q, index) => {
    const slide = pptx.addSlide();
    slide.background = { color: "#FFFFFF" };

    // Header bar
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.8, fill: { color: accentColor } });
    slide.addText(`第 ${index + 1} 題 - ${q.level}`, {
      x: 0.5, y: 0.1, w: "90%", h: 0.6,
      fontSize: 24, color: "FFFFFF", bold: true
    });

    // Question
    slide.addText(q.question, {
      x: 0.5, y: 1.2, w: "90%", h: 1.5,
      fontSize: 32, color: textDark, bold: true,
      valign: "top"
    });

    // Options
    q.options.forEach((opt, idx) => {
      const yPos = 3 + (idx * 0.7);
      slide.addText(`${idx + 1}. ${opt}`, {
        x: 1, y: yPos, w: "80%", h: 0.6,
        fontSize: 20, color: textDark
      });
    });

    // Answer & Explanation (Initially hidden in presentation mode if we could, 
    // but for simple PPTX generation, we'll put it in a box at the bottom or a separate slide.
    // Let's put it on the same slide but visually distinct at the bottom).
    
    slide.addShape(pptx.ShapeType.rect, { 
      x: 0.5, y: 6.0, w: "90%", h: 1.2, 
      fill: { color: "FEF3C7" }, // Amber 100
      line: { color: "F59E0B", width: 1 } // Amber 500
    });

    slide.addText(`答案: ${q.answer}`, {
      x: 0.7, y: 6.1, w: "85%", h: 0.4,
      fontSize: 18, color: "B45309", bold: true // Amber 700
    });

    slide.addText(`解析: ${q.explanation}`, {
      x: 0.7, y: 6.5, w: "85%", h: 0.6,
      fontSize: 14, color: "92400E" // Amber 800
    });
  });

  pptx.writeFile({ fileName: `${data.locationName}_教材.pptx` });
};