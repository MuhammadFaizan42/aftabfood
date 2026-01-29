"use client";
import React, { useState, useRef, useEffect } from "react";

export default function Dropdown({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  required = false,
  className = "",
  error = "",
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Get selected option label
  const selectedOption = options.find((opt) => opt.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    onChange({ target: { name, value: optionValue } });
    setIsOpen(false);
  };

  return (
    <div className={className} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {/* Dropdown Trigger */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`cursor-pointer w-full px-4 py-3 pr-10 bg-white border text-left focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-[15px] ${error
            ? "border-red-300 focus:ring-red-500 focus:border-transparent"
            : "border-gray-200 focus:ring-blue-500 focus:border-transparent hover:border-gray-300"
            } ${!selectedOption ? "text-gray-400" : "text-gray-900"}`}
        >
          {displayText}
        </button>

        {/* Dropdown Arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            <ul className="max-h-60 overflow-auto">
              {options.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`cursor-pointer w-full px-4 py-3 text-left text-[15px] flex items-center justify-between hover:bg-gray-200 transition-colors ${value === option.value
                      ? "text-gray-900 bg-white"
                      : "text-gray-700"
                      }`}
                  >
                    <span>{option.label}</span>
                    {value === option.value && (
                      <svg
                        className="w-5 h-5 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
