import { jsPDF } from "jspdf";
import { QuizResponse } from "../types";

let cachedFont: string | null = null;

// 使用「粉圓體 (Open Huninn)」 - 適合國小教材的圓體字，且檔案較小易於下載
const FONT_URLS = [
  "https://cdn.jsdelivr.net/gh/justfont/open-huninn-font@master/font/jf-openhuninn-2.0.ttf",
  "https://raw.githubusercontent.com/justfont/open-huninn-font/master/font/jf-openhuninn-2.0.ttf"
];

export const generatePDF = async (data: QuizResponse, imageBase64: string): Promise<void> => {
  const doc = new jsPDF();
  
  // 1. Load Chinese Font
  if (!cachedFont) {
    for (const url of FONT_URLS) {
      try {
        console.log(`正在嘗試下載字體: ${url}`);
        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) {
            console.warn(`字體下載失敗 ${url}: ${response.statusText}`);
            continue;
        }
        const buffer = await response.arrayBuffer();
        
        // Convert ArrayBuffer to Binary String
        const bytes = new Uint8Array(buffer);
        let binary = "";
        const len = bytes.byteLength;
        const CHUNK_SIZE = 8192;
        
        for (let i = 0; i < len; i += CHUNK_SIZE) {
          binary += String.fromCharCode.apply(
            null, 
            Array.from(bytes.subarray(i, Math.min(i + CHUNK_SIZE, len)))
          );
        }
        
        cachedFont = binary;
        console.log("字體下載成功！");
        break; 
      } catch (e) {
        console.warn(`字體下載發生錯誤: ${url}`, e);
      }
    }
  }

  if (!cachedFont) {
    alert("錯誤：無法下載中文字體檔（jf-openhuninn），可能是網路連線不穩或被防火牆阻擋。\n\nPDF 將無法正確顯示中文。");
    throw new Error("Font loading failed");
  }

  // Register Font
  const fontFileName = "jf-openhuninn-2.0.ttf";
  const fontName = "OpenHuninn";
  
  doc.addFileToVFS(fontFileName, cachedFont);
  doc.addFont(fontFileName, fontName, "normal");
  doc.setFont(fontName);

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxLineWidth = pageWidth - margin * 2;
  let yPosition = 20;

  // --- 封面頁 (Cover Page) ---
  
  // Title
  doc.setFontSize(24);
  doc.setTextColor(0, 0, 0);
  doc.text(data.locationName, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 15;

  // Description
  doc.setFontSize(12);
  const splitDesc = doc.splitTextToSize(data.description, maxLineWidth);
  doc.text(splitDesc, margin, yPosition);
  yPosition += splitDesc.length * 6 + 10;

  // Image
  if (imageBase64) {
      const imgProps = doc.getImageProperties(`data:image/jpeg;base64,${imageBase64}`);
      const imgWidth = 140; // Slightly larger for cover
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      
      // Check for page break on cover (rare but possible)
      if (yPosition + imgHeight > 270) {
          doc.addPage();
          yPosition = 20;
      }
      
      doc.addImage(`data:image/jpeg;base64,${imageBase64}`, "JPEG", (pageWidth - imgWidth) / 2, yPosition, imgWidth, imgHeight);
  }

  // Footer for Cover
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Gemini AI 日本文化教材生成器", pageWidth / 2, 280, { align: "center" });


  // --- 題目頁 (Question Pages) ---
  // Loop through each question and create a NEW page for it
  data.questions.forEach((q, index) => {
      doc.addPage(); // Force new page for every question
      yPosition = 25;

      // Header: Question Number & Level Badge
      // Draw a colored badge for level
      let badgeColor = [100, 116, 139]; // Default Slate
      if (q.level === '低年級') badgeColor = [34, 197, 94]; // Green
      else if (q.level === '中高年級') badgeColor = [59, 130, 246]; // Blue
      else if (q.level.includes('高年級')) badgeColor = [239, 68, 68]; // Red

      doc.setDrawColor(badgeColor[0], badgeColor[1], badgeColor[2]);
      doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
      // Small rounded rect simulation for badge
      doc.roundedRect(margin, yPosition - 6, 25, 8, 2, 2, "F");
      
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text(q.level, margin + 12.5, yPosition - 1, { align: "center" });

      // Question Number
      doc.setFontSize(14);
      doc.setTextColor(100, 100, 100);
      doc.text(`第 ${index + 1} 題`, margin + 35, yPosition);
      
      yPosition += 20;

      // Question Text
      doc.setFontSize(18); // Larger font for question
      doc.setTextColor(0, 0, 0);
      const splitQ = doc.splitTextToSize(q.question, maxLineWidth);
      doc.text(splitQ, margin, yPosition);
      yPosition += splitQ.length * 9 + 15;

      // Options
      doc.setFontSize(14);
      q.options.forEach((opt, idx) => {
          doc.text(`${idx + 1}. ${opt}`, margin + 5, yPosition);
          yPosition += 12; // More spacing
      });
      
      yPosition += 15;

      // Answer & Explanation Box
      // We calculate size first to ensure it looks good
      const splitExp = doc.splitTextToSize(`解析: ${q.explanation}`, maxLineWidth - 10);
      const boxHeight = 25 + (splitExp.length * 6);
      
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(255, 251, 235); // Amber-50 equivalent
      doc.rect(margin, yPosition, maxLineWidth, boxHeight, "FD");
      
      // Answer Text
      doc.setFontSize(12);
      doc.setTextColor(180, 83, 9); // Amber-700
      doc.text(`答案: ${q.answer}`, margin + 5, yPosition + 10);
      
      // Divider line inside box
      doc.setDrawColor(252, 211, 77); // Amber-300
      doc.line(margin + 5, yPosition + 15, margin + maxLineWidth - 5, yPosition + 15);

      // Explanation Text
      doc.setTextColor(51, 65, 85); // Slate-700
      doc.text(splitExp, margin + 5, yPosition + 22);
      
      // Reset color
      doc.setTextColor(0, 0, 0);
  });

  // 6. Global Footer (Page Numbers)
  const pageCount = doc.internal.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 20, 285, { align: "right" });
  }

  doc.save(`${data.locationName}_測驗教材.pdf`);
};