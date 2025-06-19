"use client";
import { useState } from 'react';
import Image from 'next/image';
import Search from '../assets/images/search.svg';

const SearchField = ({
  placeholder = "Address...",
  className = "bg-white/10 border border-white/[0.16] rounded-md pl-4 pr-11 py-[13px] flex-grow w-full outline-0 focus:border-[var(--wow)] transition duration-300 focus:ring-0 text-base"
}) => {
  const [inputClass, setInputClass] = useState(className); // Dynamically set className
  const [inputPlaceholder, setInputPlaceholder] = useState(placeholder); // Dynamically set placeholder

  return (
    <div className="relative">
      <input
        type="text"
        placeholder={inputPlaceholder} // Dynamically set the placeholder
        className={inputClass} // Dynamically set the className
      />
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
        <Image src={Search} width={24} height={24} alt="Search" />
      </div>
    </div>
  );
};

export default SearchField;
