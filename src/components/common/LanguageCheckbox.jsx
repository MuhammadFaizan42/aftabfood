import { useState } from 'react';
import Check from '../assets/images/check.svg';
import Image from 'next/image';
export default function LanguageCheckbox({ flagSrc, languageName }) {
  const [isChecked, setIsChecked] = useState(false);

  const handleToggle = () => {
    setIsChecked(!isChecked);
  };

  return (
    <div className="bg-white/10 border border-white/[0.16] p-3.5 rounded-lg flex items-center space-x-3 cursor-pointer" onClick={handleToggle}>
      {/* Flag and Text */}
      <div className="flex items-center space-x-2">
        <img
          src={flagSrc} // Local image path will be used here
          alt="Flag"
          className="w-6 h-6"
        />
        <span className="text-sm">{languageName}</span> {/* Dynamically set the language */}
      </div>

      {/* Green Round Checkbox */}
      <div
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isChecked ? 'bg-[var(--wow)] border-[var(--wow)]' : 'bg-transparent border-white'}`}
      >
        {isChecked && (
          <div className="w-4 h-4 rounded-full bg-[var(--wow)] flex items-center justify-center">
            <span className="text-green-500">
              <Image src={Check} alt="Check Mark" width={16} height={16} />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
