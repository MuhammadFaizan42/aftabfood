"use client";
import { useState, useEffect } from 'react';
import React from 'react';
import Link from 'next/link';
import logo from '../assets/images/logo.png';
import Dashboard from '../assets/images/dashboard.svg';
import UserList from '../assets/images/UserList.svg';
import EN from '../assets/images/en.svg';
import ReviewList from '../assets/images/ReviewList.svg';
import Image from 'next/image';
export default function Sidebar({ isOpen, toggleSidebar }) {
  const [langOpen, setLangOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-20 bg-black/10 backdrop-blur-xl lg:hidden transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        onClick={toggleSidebar}
      ></div>

      <aside
        className={`
          fixed top-0 left-0 h-screen bg-black/10 backdrop-blur-xl border-r border-white/50 w-64 text-white z-30
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:sticky lg:flex-shrink-0
          flex flex-col
        `}
      >
        <div className="flex items-center justify-center gap-3 px-6 py-5">
          <Image src={logo} width={50} height={50} alt="Media" />
          <span className="font-bold text-2xl">WOW EARN</span>
        </div>

        <nav className="flex flex-col mt-6 space-y-2 px-4">
          <Link href="/userlist" className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-[var(--wow)]">
            <Image src={UserList} width={24} height={24} alt='Media' />
            User List
          </Link>
          <Link href="/reviewlist" className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md hover:bg-[var(--wow)] transition-colors">
            <Image src={ReviewList} width={24} height={24} alt='Media' />
            Review List
          </Link>
          <div className='w-full h-[1px] bg-white/50 mt-3'></div>

          <div className="flex md:hidden mt-5 flex-col items-start px-4 gap-4">
            {/* <div className='h-8 w-[2px] bg-[#F7F9FC]'></div> */}
            <div className="relative w-full">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex w-full justify-between cursor-pointer items-center space-x-2 text-white hover:text-[var(--wow)] text-base font-bold uppercase focus:outline-none"
              >
                <div className='flex items-center gap-2'>
                  <Image src={EN} width={24} height={24} alt='Media' />
                  <span>EN</span>
                </div>
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
                <ul className="w-full absolute right-0 mt-2 bg-black border border-white/50 rounded-[10px] shadow-md z-10">
                  <li className="px-3 py-1 rounded-tl-[10px] rounded-tr-[10px] border-b border-white/50 hover:bg-[var(--wow)] cursor-pointer">EN</li>
                  <li className="px-3 py-1 border-b border-white/50 hover:bg-[var(--wow)] cursor-pointer">FR</li>
                  <li className="px-3 py-1 rounded-bl-[10px] rounded-br-[10px] hover:bg-[var(--wow)] cursor-pointer">DE</li>
                </ul>
              )}
            </div>

            <div className='text-base font-bold mt-1'>Admin</div>
          </div>
        </nav>
      </aside>
    </>
  );
}
