"use client";
import React from "react";

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
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full px-4 py-3 pr-10 bg-white border text-gray-900 focus:outline-none focus:ring-2 appearance-none cursor-pointer transition-all hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed ${error
            ? "border-red-300 focus:ring-red-500 focus:border-transparent"
            : "border-gray-200 focus:ring-blue-500 focus:border-transparent"
            }`}
          style={{
            borderRadius: "8px",
            fontSize: "15px",
          }}
        >
          <option value="" disabled={required}>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
          <svg
            className="w-4 h-4 text-blue-600"
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
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      <style jsx>{`
        select {
          background-color: white;
          color: #1f2937;
          font-weight: 400;
        }
        select option {
          background-color: white;
          color: #1f2937;
          padding: 12px 16px;
          font-size: 15px;
          font-weight: 400;
          line-height: 1.6;
        }
        select option:hover {
          background-color: #f9fafb !important;
        }
        select option:checked,
        select option:checked:hover {
          background-color: white !important;
          color: #1f2937;
          font-weight: 400;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%233b82f6' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 16px center;
          padding-right: 45px;
        }
      `}</style>
    </div>
  );
}
