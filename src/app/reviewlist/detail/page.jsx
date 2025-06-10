"use client";
import React from "react";
import Link from "next/link";
import { useState } from "react";
import Sidebar from "../../../components/common/Sidebar";
import Header from "../../../components/common/Header";
import Image from "next/image";
import Search from "../../../components/assets/images/search.svg";
import Export from "../../../components/assets/images/export.svg";
import BackArrow from "../../../components/assets/images/BackArrow.svg";
import ReusableTable from "../../../components/common/ReusableTable";
import Dropdown from "../../../components/common/Dropdown";


export default function ReviewListDetail() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="flex min-h-screen text-white">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex flex-col flex-1 overflow-hidden md:overflow-visible">
        <Header toggleSidebar={toggleSidebar} />

        <main className="p-6 m-6 flex-1 overflow-auto rounded-md border border-white/[0.16] backdrop-blur-xl">
          <h1 className="text-xl flex items-center gap-4 font-semibold mb-6">
            <Link href='/userlist' className="block">
              <Image src={BackArrow} width={24} height={24} alt="Media" />
            </Link>
            Detail
          </h1>
          <div className="w-full md:w-[60%] lg:w-1/2 mx-auto">
            <div className="mb-4">
              <div className="grid grid-cols-1 md:grid-cols-[30%_auto] gap-4 md:gap-6 items-center">
                <p className="text-sm font-medium block whitespace-nowrap text-end">Email</p>
                <input
                  type="text"
                  placeholder="testing123@gmail.com"
                  className="block bg-white/10 border border-white/[0.16] rounded-md px-4 py-[13px] flex-grow w-full outline-0 focus:border-[var(--wow)] transition duration-300 focus:ring-0 text-base"
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="grid grid-cols-1 md:grid-cols-[30%_auto] gap-4 md:gap-6 items-center">
                <p className="text-sm font-medium block whitespace-nowrap text-end">Name</p>
                <input
                  type="text"
                  placeholder="xxxxxx xxxxxxxx"
                  className="block bg-white/10 border border-white/[0.16] rounded-md px-4 py-[13px] flex-grow w-full outline-0 focus:border-[var(--wow)] transition duration-300 focus:ring-0 text-base"
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="grid grid-cols-1 md:grid-cols-[30%_auto] gap-4 md:gap-6 items-center">
                <p className="text-sm font-medium block whitespace-nowrap text-end">Phone Number</p>
                <input
                  type="text"
                  placeholder="12345678"
                  className="block bg-white/10 border border-white/[0.16] rounded-md px-4 py-[13px] flex-grow w-full outline-0 focus:border-[var(--wow)] transition duration-300 focus:ring-0 text-base"
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="grid grid-cols-1 md:grid-cols-[30%_auto] gap-4 md:gap-6 items-center">
                <p className="text-sm font-medium block whitespace-nowrap text-end">Residence</p>
                <input
                  type="text"
                  placeholder="2234 North Waverly Road"
                  className="block bg-white/10 border border-white/[0.16] rounded-md px-4 py-[13px] flex-grow w-full outline-0 focus:border-[var(--wow)] transition duration-300 focus:ring-0 text-base"
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="grid grid-cols-1 md:grid-cols-[30%_auto] gap-4 md:gap-6 items-center">
                <p className="text-sm font-medium block whitespace-nowrap text-end">Application Time</p>
                <input
                  type="text"
                  placeholder="2025-12-12 12:00:00"
                  className="block bg-white/10 border border-white/[0.16] rounded-md px-4 py-[13px] flex-grow w-full outline-0 focus:border-[var(--wow)] transition duration-300 focus:ring-0 text-base"
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="grid grid-cols-1 md:grid-cols-[30%_auto] gap-4 md:gap-6 items-center">
                <p className="text-sm font-medium block whitespace-nowrap text-end">Upload File</p>
                <input
                  type="file"
                  className="block bg-white/10 border border-white/[0.16] rounded-md px-4 py-[13px] flex-grow w-full outline-0 focus:border-[var(--wow)] transition duration-300 focus:ring-0 text-base"
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="grid grid-cols-1 md:grid-cols-[30%_auto] gap-4 md:gap-6 items-center">
                <p className="text-sm font-medium block whitespace-nowrap text-end">Approval Status</p>
                <div className="radio-container flex items-center gap-6">
                  <div className="radio-wrapper">
                    <label className="radio-button">
                      <input id="option1" name="radio-group" type="radio" />
                      <span className="radio-checkmark" />
                      <span className="radio-label">Male</span>
                    </label>
                  </div>
                  <div className="radio-wrapper">
                    <label className="radio-button">
                      <input id="option2" name="radio-group" type="radio" />
                      <span className="radio-checkmark" />
                      <span className="radio-label">Female</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
