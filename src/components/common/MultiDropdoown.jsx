import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import DownArrow from "../assets/images/DownArrow.svg";

// Reusable MultiDropdown component
export default function MultiDropdown({ label, options, selectedValues, onChange, width }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleOptionClick = (value) => {
    const newSelectedValues = [...selectedValues];
    const index = newSelectedValues.indexOf(value);
    if (index > -1) {
      newSelectedValues.splice(index, 1); // Remove the value if already selected
    } else {
      newSelectedValues.push(value); // Add the value if not selected
    }
    onChange(newSelectedValues);
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
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const buttonWidth = width || "w-40";

  return (
    <div>
      <label htmlFor="dropdown" className="text-sm font-medium mb-2">
        {label}
      </label>
      <div className="relative mt-2" ref={dropdownRef}>
        <button
          id="dropdown"
          onClick={toggleDropdown}
          ref={buttonRef}
          className={`bg-white/10 cursor-pointer rounded-lg shadow-md px-[14px] py-[13px] flex justify-between items-center focus:border-[var(--wow)] outline-none border border-white/[0.16] transition-colors duration-300 ${buttonWidth}`}
        >
          {selectedValues.length > 0
            ? `${selectedValues.length} selected`
            : "All"}
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
                onClick={() => handleOptionClick(option.value)}
                className={`px-3.5 py-2 hover:bg-[var(--wow)]/10 first:rounded-t-md last:rounded-b-md cursor-pointer transition-colors duration-200 ${selectedValues.includes(option.value) ? 'bg-[var(--wow)]/10' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <div className="round flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedValues.includes(option.value)}
                      onChange={() => { }}
                      id={option.value}
                      className="hidden"
                    />
                    <label htmlFor={option.value} className="checkbox-label"></label>
                  </div>
                  {option.value}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
