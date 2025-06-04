"use client";
import { useState, useEffect } from 'react';
import React from 'react';
import Link from 'next/link';
import logo from '../assets/images/logo.png';
import Dashboard from '../assets/images/dashboard.svg';
import UserList from '../assets/images/UserList.svg';
import ReviewList from '../assets/images/ReviewList.svg';
import Image from 'next/image';
export default function Sidebar({ isOpen, toggleSidebar }) {
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
          <Link href=" " className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md hover:bg-[var(--wow)]  transition duration-300">
            <Image src={Dashboard} width={24} height={24} alt='Media' />
            Dashboard
          </Link>
          <Link href=" " className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-[var(--wow)]">
            <Image src={UserList} width={24} height={24} alt='Media' />
            User List
          </Link>
          <Link href=" " className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md hover:bg-[var(--wow)] transition-colors">
            <Image src={ReviewList} width={24} height={24} alt='Media' />
            Review List
          </Link>
          <div className='w-full h-[1px] bg-white/50 mt-3'></div>
        </nav>
      </aside>
    </>
  );
}
