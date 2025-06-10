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
import Tabs from "../../../components/common/Tabs";

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

export default function UserListDetail() {
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

  const tabsData = [
    {
      tabName: "Stake List",
      content: (
        <div className="overflow-x-auto">
          <ReusableTable columns={columns} data={data} rowsPerPage={5} />
        </div>
      ),
    },
    {
      tabName: "Referral List",
      content: (
        <div className="overflow-x-auto">
          <ReusableTable columns={columns} data={data} rowsPerPage={5} />
        </div>
      ),
    },
  ];
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
          <div className="w-full">
            <div className="mb-4 grid grid-cols-[auto] md:grid-cols-[58%_auto_auto] md:justify-between items-center gap-4">
              <div className="relative flex items-center gap-4 md:gap-4">
                <label className="text-sm font-bold">Address</label>
                <input
                  type="text"
                  placeholder="Ox742d35Cc6634C0532925a3b844Bc454e4438f44e"
                  className="bg-white/10 border border-white/[0.16] rounded-md px-4 py-[13px] flex-grow w-full outline-0 focus:border-[var(--wow)] transition duration-300 focus:ring-0 text-base" disabled
                />
                {/* <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Image src={Search} width={24} height={24} alt="Media" />
                </div> */}
              </div>

              <div className="flex items-center gap-1">
                <p className="text-sm font-bold">Level:</p>
                <p className="text-base">Shareholder</p>
              </div>

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
              {/* <ReusableTable columns={columns} data={data} rowsPerPage={5} /> */}
              <Tabs tabs={tabsData} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
