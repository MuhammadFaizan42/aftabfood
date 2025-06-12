"use client";
import React from "react";
import Link from "next/link";
import { useState } from "react";
import MainHeader from "../components/common/MainHeader";
import Header from "../components/common/Header";
import Sidebar from "../components/common/Sidebar";
import ReusableButton from '../components/common/Button';


export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  return (
    <div className="flex min-h-screen text-white">
      <div className="flex flex-col flex-1 overflow-hidden md:overflow-visible">
        <div className="hidden md:block">
          <MainHeader />
        </div>
        <div className="block md:hidden">
          <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
          <Header toggleSidebar={toggleSidebar} />
        </div>

        <main>
          <div className="absolute top-[164px] md:top-1/2 left-1/2 -translate-x-1/2 md:-translate-y-1/2 bg-white/10 border border-white/[0.16] backdrop-blur-xl rounded-2xl p-6 mx-auto w-[90%] md:w-1/2">
            <h1 className="text-center font-bold text-2xl mb-8">Log In</h1>
            <form className="flex flex-col gap-6">
              <div>
                <label className="block text-sm font-medium mb-[6px]">Account</label>
                <input
                  type="text"
                  placeholder="Enter Account Number"
                  className="py-2.5 px-3.5 block text-base w-full bg-white/10 backdrop-blur-xl border border-white/[0.16] rounded-md focus:outline-none focus:border-[var(--wow)] transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-[6px]">Password</label>
                <input
                  type="Password"
                  placeholder="***********"
                  className="py-2.5 px-3.5 block text-base w-full bg-white/10 backdrop-blur-xl border border-white/[0.16] rounded-md focus:outline-none focus:border-[var(--wow)] transition-all duration-200"
                />
              </div>
              <ReusableButton text="Login" className="w-[123px] mt-2" />
            </form>
          </div>

        </main>
      </div>
    </div>
  );
}
