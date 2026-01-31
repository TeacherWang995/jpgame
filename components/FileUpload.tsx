import React, { useCallback, useState } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  }, [onFileSelect]);

  return (
    <div className="w-full max-w-xl mx-auto mb-8">
      <div
        className={`relative group flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl transition-all duration-300 ease-in-out ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50"
        } ${isProcessing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
            <svg
              className={`w-12 h-12 mb-4 transition-colors ${
                dragActive ? "text-blue-500" : "text-slate-400 group-hover:text-blue-500"
              }`}
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 16"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
              />
            </svg>
            <p className="mb-2 text-sm text-slate-500 font-medium">
              <span className="font-semibold">點擊上傳</span> 或拖放照片至此
            </p>
            <p className="text-xs text-slate-400">
              支援 JPG, PNG (用於生成日本文化教材)
            </p>
          </div>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleChange}
            disabled={isProcessing}
          />
        </label>
      </div>
    </div>
  );
};

export default FileUpload;