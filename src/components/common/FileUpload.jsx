import React, { useState } from "react";
// import { FaPlus } from "react-icons/fa"; 
import Image from "next/image";
import Plus from "../assets/images/plus.svg"; // Assuming you have a plus icon in your assets
const FileUpload = ({ buttonText = "Choose File", onFileChange }) => {
  const [fileName, setFileName] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFileName(selectedFile ? selectedFile.name : "");
    if (onFileChange) {
      onFileChange(selectedFile);
    }
  };

  return (
    <div className="flex flex-col">
      <label htmlFor="file-upload" className="text-sm font-medium mb-2">
        Icon Upload
      </label>
      <div className="relative">
        <input
          type="file"
          id="file-upload"
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={handleFileChange}
        />
        <div className="flex items-center border border-white/[0.16] rounded-lg px-3.5 py-2.5 bg-white/10 hover:border-[var(--wow)] transition duration-300 cursor-pointer">
          {/* Plus Icon */}
          <div className="flex items-center gap-2 bg-white/10 rounded-sm px-2.5 py-[3px]">
            <Image src={Plus} width={24} height={24} alt="Media" />
            <span className="text-white">{fileName || buttonText}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
