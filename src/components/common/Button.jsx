"use client";
export default function ReusableButton({ text, onClick, className = "" }) {
  return (
    <button
      className={`text-base font-semibold bg-btn-gradient border-2 border-[var(--wow)] hover:bg-black hover:border-[var(--hover-color)] rounded-full py-2 px-6 cursor-pointer ${className}`}
      onClick={onClick}
    >
      {text}
    </button>
  );
}
