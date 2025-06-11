"use client";
import React from "react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import Sidebar from "../../../components/common/Sidebar";
import Header from "../../../components/common/Header";
import Image from "next/image";
import Search from "../../../components/assets/images/search.svg";
import Export from "../../../components/assets/images/export.svg";
import BackArrow from "../../../components/assets/images/BackArrow.svg";
import DownArrow from "../../../components/assets/images/DownArrow.svg";
import ReusableTable from "../../../components/common/ReusableTable";
import Dropdown from "../../../components/common/Dropdown";
import ReusableButton from "../../../components/common/Button";


export default function ReviewListDetail() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const [selectedValue, setSelectedValue] = useState("Select Reason");
  const handleSelectionChange = (value) => {
    setSelectedValue(value);
  };
  const options = [
    { value: "All" },
    { value: "Active" },
    { value: "Inactive" },
  ];


  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null); // Reference for the dropdown
  const buttonRef = useRef(null); // Reference for the button

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleOptionClick = (value) => {
    onChange(value); // Call the onChange prop to handle the selection
    setIsOpen(false);
  };

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false); // Close the dropdown if clicked outside
      }
    };

    // Adding the event listener to the document
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup the event listener on component unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // const buttonWidth = width || "w-40";
  return (
    <div className="flex min-h-screen text-white">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex flex-col flex-1 overflow-hidden md:overflow-visible">
        <Header toggleSidebar={toggleSidebar} />

        <main className="p-6 m-6 flex-1 overflow-auto rounded-md border border-white/[0.16] backdrop-blur-xl">
          <h1 className="text-xl flex items-center gap-4 font-semibold mb-6">
            <Link href='/reviewlist' className="block">
              <Image src={BackArrow} width={24} height={24} alt="Media" />
            </Link>
            Detail
          </h1>
          <div className="w-full md:w-[60%] lg:w-1/2 mx-auto">
            <div className="mb-4">
              <div className="grid grid-cols-[30%_auto] gap-4 md:gap-6 items-center">
                <p className="text-sm font-medium block text-end">Email</p>
                <input
                  type="text"
                  placeholder="testing123@gmail.com"
                  className="block bg-white/10 border border-white/[0.16] rounded-md px-4 py-[13px] flex-grow w-full outline-0 focus:border-[var(--wow)] transition duration-300 focus:ring-0 text-base"
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="grid grid-cols-[30%_auto] gap-4 md:gap-6 items-center">
                <p className="text-sm font-medium block text-end">Name</p>
                <input
                  type="text"
                  placeholder="xxxxxx xxxxxxxx"
                  className="block bg-white/10 border border-white/[0.16] rounded-md px-4 py-[13px] flex-grow w-full outline-0 focus:border-[var(--wow)] transition duration-300 focus:ring-0 text-base"
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="grid grid-cols-[30%_auto] gap-4 md:gap-6 items-center">
                <p className="text-sm font-medium block text-end">Phone Number</p>
                <input
                  type="text"
                  placeholder="12345678"
                  className="block bg-white/10 border border-white/[0.16] rounded-md px-4 py-[13px] flex-grow w-full outline-0 focus:border-[var(--wow)] transition duration-300 focus:ring-0 text-base"
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="grid grid-cols-[30%_auto] gap-4 md:gap-6 items-center">
                <p className="text-sm font-medium block text-end">Residence</p>
                <input
                  type="text"
                  placeholder="2234 North Waverly Road"
                  className="block bg-white/10 border border-white/[0.16] rounded-md px-4 py-[13px] flex-grow w-full outline-0 focus:border-[var(--wow)] transition duration-300 focus:ring-0 text-base"
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="grid grid-cols-[30%_auto] gap-4 md:gap-6 items-center">
                <p className="text-sm font-medium block text-end">Application Time</p>
                <input
                  type="text"
                  placeholder="2025-12-12 12:00:00"
                  className="block bg-white/10 border border-white/[0.16] rounded-md px-4 py-[13px] flex-grow w-full outline-0 focus:border-[var(--wow)] transition duration-300 focus:ring-0 text-base"
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="grid grid-cols-[30%_auto] gap-4 md:gap-6 items-center">
                <p className="text-sm font-medium block text-end">Upload File</p>
                <input
                  type="file"
                  className="block bg-white/10 border border-white/[0.16] rounded-md px-4 py-[13px] flex-grow w-full outline-0 focus:border-[var(--wow)] transition duration-300 focus:ring-0 text-base"
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="grid grid-cols-[30%_auto] gap-4 md:gap-6 items-center">
                <p className="text-sm font-medium block text-end">Approval Status</p>
                <div className="radio-container w-full flex items-center gap-6">
                  <div className="radio-wrapper">
                    <label className="radio-button">
                      <input id="option1" name="radio-group" type="radio" />
                      <span className="radio-checkmark" />
                      <span className="radio-label">Yes</span>
                    </label>
                  </div>
                  <div className="radio-wrapper">
                    <label className="radio-button">
                      <input id="option2" name="radio-group" type="radio" />
                      <span className="radio-checkmark" />
                      <span className="radio-label">No</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="grid grid-cols-[30%_auto] gap-4 md:gap-6 items-center">
                <p className="text-sm font-medium block text-end">Reason</p>
                <div className="relative inline-block" ref={dropdownRef}>
                  <button
                    id="dropdown"
                    onClick={toggleDropdown}
                    ref={buttonRef}
                    className={`bg-white/10 cursor-pointer rounded-lg shadow-md px-[14px] py-[13px] flex justify-between items-center focus:border-[var(--wow)] outline-none border border-white/[0.16] transition-colors duration-300 w-full`}
                  >
                    {selectedValue}
                    <span className="ml-2">
                      <Image src={DownArrow} width={24} height={24} alt="Dropdown Arrow" />
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      className="absolute left-0 mt-2 w-full bg-black border backdrop-blur-xl rounded-lg shadow-md z-10 transition-all duration-200 ease-in-out"
                      style={{ animation: "fadeIn 0.2s ease-in-out" }}
                    >
                      {options.map((option, index) => (
                        <div
                          key={index}
                          onClick={() => handleOptionClick(option.value)}
                          className="px-4 py-2 hover:bg-[var(--wow)] first:rounded-t-md last:rounded-b-md cursor-pointer transition-colors duration-200"
                        >
                          {option.value}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-4 flex justify-end">
              <ReusableButton text="Submit" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
