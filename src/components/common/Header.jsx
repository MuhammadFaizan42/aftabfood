"use client";
import { useState, useEffect } from 'react';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import logo from '../assets/images/logo.png';
import EN from '../assets/images/en.svg';
import { MenuIcon } from '../assets';

export default function Header({ toggleSidebar }) {
  const [langOpen, setLangOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  return (
    <header className="flex md:bg-black items-center justify-between px-6 py-[14px] border-b border-white/50 sticky top-0 z-10">
      {/* Mobile hamburger */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden focus:outline-none text-white"
        aria-label="Toggle Sidebar"
      >
        <MenuIcon />
        {/* <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <line x1={3} y1={12} x2={21} y2={12} />
          <line x1={3} y1={6} x2={21} y2={6} />
          <line x1={3} y1={18} x2={21} y2={18} />
        </svg> */}
      </button>

      <div className="flex-1 flex items-center justify-center lg:justify-start text-xl font-bold">
        Users List
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

        <div className='text-base font-bold'>Admin</div>
      </div>
    </header>
  );
}
