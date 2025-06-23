import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import DownArrow from "../assets/images/DownArrow.svg"; // Adjust as per your path

// Example flag images (you can use flag images in your assets or use URLs)
import FlagUSA from "../assets/images/FlagUSA.svg";
import FlagIndia from "../assets/images/FlagIndia.svg";
import FlagChina from "../assets/images/FlagChina.svg";

// Reusable dropdown component
export default function LanguageDropdown({
  label,
  isRequired = false,
  options,
  selectedValue,
  onChange,
  width,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(selectedValue);
  const dropdownRef = useRef(null); // Reference for the dropdown
  const buttonRef = useRef(null); // Reference for the button

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleOptionClick = (value, flag) => {
    setSelectedLanguage(value); // Update selected language in the state
    onChange(value); // Call the onChange prop to handle the selection
    setIsOpen(false); // Close the dropdown
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
    <div>
      {/* Conditionally render label if it is passed */}
      {label && (
        <label htmlFor="dropdown" className="text-sm font-medium mb-2">
          {label}
          {isRequired && <span className="text-red-500">&nbsp;*</span>} {/* Add asterisk if required */}
        </label>
      )}

      <div className="relative" ref={dropdownRef}>
        <button
          id="dropdown"
          onClick={toggleDropdown}
          ref={buttonRef}
          className={`bg-white/10 mt-2 cursor-pointer rounded-lg shadow-md px-[14px] py-[13px] flex justify-between items-center focus:border-[var(--wow)] outline-none border border-white/[0.16] transition-colors duration-300 ${buttonWidth}`}
        >
          {/* Show the selected value and its flag */}
          <div className="flex items-center">
            <Image
              src={options.find((option) => option.value === selectedLanguage)?.flag}
              width={24}
              height={24}
              alt="Selected Flag"
              className="rounded-full"
            />
            <span className="ml-2">{selectedLanguage}</span>
          </div>
          <span className="ml-2">
            <Image src={DownArrow} width={24} height={24} alt="Dropdown Arrow" />
          </span>
        </button>

        {isOpen && (
          <div
            className="absolute left-0 mt-2 w-full bg-[var(--dropdown)] border backdrop-blur-xl rounded-lg shadow-md z-10 transition-all duration-200 ease-in-out"
            style={{ animation: "fadeIn 0.2s ease-in-out" }}
          >
            {options.map((option, index) => (
              <div
                key={index}
                onClick={() => handleOptionClick(option.value, option.flag)}
                className="px-4 py-2 hover:bg-[var(--wow)]/20 first:rounded-t-md last:rounded-b-md cursor-pointer transition-colors duration-200"
              >
                {/* Display flag image and language name */}
                <div className="flex items-center gap-2">
                  <Image
                    src={option.flag}
                    width={24}
                    height={24}
                    alt={`${option.value} Flag`}
                    className="rounded-full"
                  />
                  <span>{option.value}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
