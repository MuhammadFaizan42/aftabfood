import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import DownArrow from "../assets/images/DownArrow.svg";

// Reusable dropdown component
export default function Dropdown({ label, options, selectedValue, onChange, width }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null); // Reference for the dropdown
  const buttonRef = useRef(null); // Reference for the button

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleOptionClick = (value) => {
    onChange(value); // Call the onChange prop to handle the selection
    setIsOpen(false);
  };

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false); // Close the dropdown if clicked outside
      }
    };

    // Adding the event listener to the document
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup the event listener on component unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const buttonWidth = width || "w-40"; // Set a default width if no width is passed

  return (
    <div className="flex items-center gap-6">
      <label htmlFor="dropdown" className="text-sm font-bold">
        {label}
      </label>
      <div className="relative inline-block" ref={dropdownRef}>
        <button
          id="dropdown"
          onClick={toggleDropdown}
          ref={buttonRef}
          className={`bg-white/10 cursor-pointer rounded-lg shadow-md px-[14px] py-[13px] flex justify-between items-center focus:border-[var(--wow)] outline-none border border-white/[0.16] transition-colors duration-300 ${buttonWidth}`}
        >
          {selectedValue}
          <span className="ml-2">
            <Image src={DownArrow} width={24} height={24} alt="Dropdown Arrow" />
          </span>
        </button>

        {isOpen && (
          <div
            className="absolute left-0 mt-2 w-full bg-black border backdrop-blur-xl rounded-lg shadow-md z-10 transition-all duration-200 ease-in-out"
            style={{ animation: "fadeIn 0.2s ease-in-out" }}
          >
            {options.map((option, index) => (
              <div
                key={index}
                onClick={() => handleOptionClick(option.value)}
                className="px-4 py-2 hover:bg-[var(--wow)] first:rounded-t-md last:rounded-b-md cursor-pointer transition-colors duration-200"
              >
                {option.value}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
