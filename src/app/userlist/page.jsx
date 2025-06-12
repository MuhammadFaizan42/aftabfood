"use client";
import React from "react";
import Link from "next/link";
import { useState } from "react";
import Sidebar from "../../components/common/Sidebar";
import Header from "../../components/common/Header";
import Image from "next/image";
import Search from "../../components/assets/images/search.svg";
import Export from "../../components/assets/images/export.svg";
import ReusableTable from "../../components/common/ReusableTable";
import Dropdown from "../../components/common/Dropdown";

const columns = [
  { header: "Address", accessor: "address" },
  { header: "WBond", accessor: "wbond" },
  { header: "WPass", accessor: "wpass" },
  { header: "Invited", accessor: "invited" },
  { header: "Level", accessor: "level" },
  { header: "Action", accessor: "action" },
];

const data = [
  {
    address: "Ox742d35Cc6634C0532",
    wbond: 1,
    wpass: 2,
    invited: 7,
    level: "Shareholder",
    action: (
      <Link className="text-[var(--wow)] text-xs font-normal hover:text-[var(--hover-color)] transition-all duration-200 underline" href="/userlist/detail">
        Details
      </Link>
    )
  },

];

export default function UserList() {
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
          <h1 className="text-xl font-semibold mb-6">User List</h1>
          <div className="w-full">
            <div className="mb-6 grid grid-cols-1 md:grid-cols-[auto_auto_auto] justify-between items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Address..."
                  className="bg-white/10 border border-white/[0.16] rounded-md pl-4 pr-11 py-[13px] flex-grow w-full outline-0 focus:border-[var(--wow)] transition duration-300 focus:ring-0 text-base"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Image src={Search} width={24} height={24} alt="Media" />
                </div>
              </div>

              <div>
                <Dropdown
                  label="WBond"
                  options={options}
                  selectedValue={selectedValue}
                  onChange={handleSelectionChange}
                  width="w-full md:w-[150px]"
                />
              </div>

              <button
                className="w-max flex gap-2 items-center text-sm font-semibold bg-btn-gradient border-2 border-[var(--wow)] hover:bg-black hover:border-[var(--hover-color)] rounded-full py-[13px] h-[51.33px] px-6 whitespace-nowrap cursor-pointer"
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
