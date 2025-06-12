"use client";
import { useState, useEffect } from 'react';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import logo from '../assets/images/logo.png';
import EN from '../assets/images/en.svg';
import ReusableButton from './Button';
// import ChineseFlag from '../assets/images/ChineseFlag.svg';
// import ArFlag from '../assets/images/ArFlag.svg';

export default function MainHeader() {
  const [langOpen, setLangOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  return (
    <header className="flex bg-black/10 items-center justify-between px-4 md:px-6 py-[7px] sticky top-0 z-10">
      <div className="flex items-center">
        <Image src={logo} alt="WOW Earn Logo" width={50} height={50} className='w-8 h-8 md:w-[50px] md:h-[50px]' />
        <span className="text-base md:text-2xl font-bold tracking-wide ml-3">WOW EARN</span>
      </div>

      <div className="flex items-center gap-4">
        <div className='h-8 w-[2px] bg-[#F7F9FC]'></div>
        <div className="relative">
          <button
            onClick={() => setLangMenuOpen(!langMenuOpen)}
            className="flex cursor-pointer items-center space-x-2 text-white hover:text-[var(--wow)] text-base font-bold uppercase focus:outline-none"
          >
            <Image src={EN} width={24} height={24} alt='Media' />
            <span>EN</span>
            <svg
              className={`w-4 h-4 transform transition-transform ${langMenuOpen ? 'rotate-180' : 'rotate-0'
                }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {langMenuOpen && (
            <ul className="absolute right-0 mt-2 bg-black border border-white/50 rounded-[10px] shadow-md z-10 w-24">
              <li className="px-3 py-1 rounded-tl-[10px] rounded-tr-[10px] border-b border-white/50 hover:bg-[var(--wow)] cursor-pointer">EN</li>
              <li className="px-3 py-1 border-b border-white/50 hover:bg-[var(--wow)] cursor-pointer">FR</li>
              <li className="px-3 py-1 rounded-bl-[10px] rounded-br-[10px] hover:bg-[var(--wow)] cursor-pointer">DE</li>
            </ul>
          )}
        </div>

        <ReusableButton text="Admin" className='h-10 text-sm' />
      </div>
    </header>
  );
}
