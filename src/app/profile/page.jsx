"use client";
import React from "react";
import Link from "next/link";
import { useState } from "react";
// import Header from "../../../components/common/Header";
import Image from "next/image";
// import PlaceholderIcon from "../../../components/assets/images/placeholder.png";
// import ReusableTable from "../../../components/common/ReusableTable";
// import LanguageCheckbox from "../../../components/common/LanguageCheckbox";
// const columns = [
//   { header: "Date", accessor: "Date", padding: "18px 16px" },
//   { header: "IOS", accessor: "IOS", padding: "18px 16px" },
//   { header: "Android", accessor: "Android", padding: "18px 16px" },
// ];

// const data = [
//   {
//     Date: '2025-06-01',
//     IOS: "116,000",
//     Android: "116,000",
//   },
// ];

export default function DailyVisits() {
  const customPlaceholder = "Search Slot..."; // Custom placeholder for the search field

  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const toggleDropdown = () => {
    setIsDropdownVisible((prevState) => !prevState);
  };

  const [showDeleteAdModal, setShowDeleteAdModal] = React.useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleFileChange = (file) => {
    console.log("Selected file:", file);
  };
  const [selectedValue, setSelectedValue] = useState("All");
  const handleSelectionChange = (value) => {
    setSelectedValue(value);
  };
  const options = [
    { value: "All" },
    { value: "One" },
  ];
  return (
    <>
      {/* {showDeleteAdModal && <DeleteAdModal setShowDeleteAdModal={setShowDeleteAdModal} />} */}
      <div className="flex min-h-screen text-white">
        <div className="flex flex-col flex-1 overflow-hidden md:overflow-visible">
          {/* <Header toggleSidebar={toggleSidebar} /> */}

          <main className="m-6">
            <h1 className="text-xl font-semibold mb-6">
              Daily Vists
            </h1>
          </main>
        </div>
      </div>
    </>
  );
}
