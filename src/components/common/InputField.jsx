"use client";

export default function InputField({
  label = "Name", // Default label
  placeholder = "Address...", // Default placeholder
  className = "", // Default className if none is passed
  type = "text", // Default type is text, but you can change it (e.g., "password")
  ...props // Spread other props like value, onChange, etc.
}) {
  // Split label into the main part and the asterisk
  const [mainLabel, asterisk] = label.split("*");

  return (
    <div className="flex flex-col">
      {/* Label with styled asterisk */}
      {label && (
        <label className="text-sm font-medium mb-2">
          {mainLabel}
          <span className="text-red-500">&nbsp;*</span> {/* Styling for the asterisk */}
        </label>
      )}

      {/* Input Field */}
      <input
        type={type}
        placeholder={placeholder}
        className={`bg-white/10 border border-white/[0.16] backdrop-blur-xl rounded-md px-[14px] py-3 flex-grow w-full outline-0 focus:border-[var(--wow)] transition duration-300 focus:ring-0 text-base h-[51.33px] ${className}`}
        {...props} // Spread the rest of the props (e.g., value, onChange)
      />
    </div>
  );
}
