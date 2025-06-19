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

const columns = [
  { header: "Type", accessor: "type" },
  { header: "Amount", accessor: "amount" },
  { header: "Interest", accessor: "interest" },
  { header: "Locked", accessor: "locked" },
  { header: "Time Left", accessor: "timeLeft" },
  { header: "Time", accessor: "time" },
];

const data = [
  {
    type: "WBond",
    amount: "50,000",
    interest: "52.01",
    locked: "100,000",
    timeLeft: "51 Weeks",
    time: "2025-05-11 12:00:00",
  },
];

export default function DappManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);


  const [selectedValue, setSelectedValue] = useState("0");
  const handleSelectionChange = (value) => {
    setSelectedValue(value);
  };
  const options = [
    { value: "0" },
    { value: "1" },
    { value: "2" },
    { value: "3" },
  ];


  return (
    <div className="flex min-h-screen text-white">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex flex-col flex-1 overflow-hidden md:overflow-visible">
        <Header toggleSidebar={toggleSidebar} />

        <main className="p-6 m-6 flex-1 overflow-auto rounded-md border border-white/[0.16] backdrop-blur-xl">
          <h1 className="text-xl flex items-center gap-4 font-semibold mb-6">
            {/* <Link href='/userlist' className="block">
              <Image src={BackArrow} width={24} height={24} alt="Media" />
            </Link> */}
            DApp Management
          </h1>
          <div className="w-full">
            <div className="mb-4 grid grid-cols-[auto] md:grid-cols-[58%_auto_auto] md:justify-between items-center gap-4">

              <Dropdown
                label="WBond"
                options={options}
                selectedValue={selectedValue}
                onChange={handleSelectionChange}
                width="w-full md:w-[150px]"
              />

              <button
                className="flex w-max gap-2 items-center text-sm font-semibold bg-btn-gradient border-2 border-[var(--wow)] hover:bg-black hover:border-[var(--hover-color)] rounded-full py-[13px] h-[51.33px] px-6 whitespace-nowrap cursor-pointer"
              >
                <Image
                  src={Export}
                  width={24}
                  height={24}
                  alt="Media" />
                Export
              </button>

            </div>

            <div className="table-section">
              <ReusableTable columns={columns} data={data} rowsPerPage={5} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
