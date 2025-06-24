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
        <span className="text-sm font-medium">{languageName}</span> {/* Dynamically set the language */}
      </div>

      {/* Green Round Checkbox */}
      <div
        className={`w-5 h-5 rounded-full border flex items-center justify-center ${isChecked ? 'bg-[var(--wow)] border-[var(--wow)]' : 'bg-transparent border-white'}`}
      >
        {isChecked && (
          <div className="w-3 h-3 rounded-full bg-[var(--wow)] flex items-center justify-center">
            <span>
              <Image src={Check} alt="Check Mark" width={12} height={12} />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
