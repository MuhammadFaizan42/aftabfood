"use client";
import React from "react";
import Link from "next/link";
import { useState } from "react";
import Sidebar from "../../components/common/Sidebar";
import Header from "../../components/common/Header";
import Image from "next/image";
import Search from "../../components/assets/images/search.svg";
import Export from "../../components/assets/images/export.svg";
import BackArrow from "../../components/assets/images/BackArrow.svg";
import ReusableTable from "../../components/common/ReusableTable";
import ReusableButton from "../../components/common/Button";
import Dropdown from "../../components/common/Dropdown";
import Tabs from "../../components/common/Tabs";

const columns = [
  { header: "Address", accessor: "address" },
  { header: "Identity ID", accessor: "identityID" },
  { header: "Email", accessor: "email" },
  { header: "Name", accessor: "name" },
  { header: "Phone Number", accessor: "phoneNumber" },
  { header: "Application Time", accessor: "applicationTime" },
  { header: "Status", accessor: "status" },
  { header: "Action", accessor: "action" },
];

const data = [
  {
    address: "Ox742d35Ccadsf",
    identityID: 123456789,
    email: "example@gmail.com",
    name: "Ruth Smith",
    phoneNumber: "(399) 465-8793",
    applicationTime: "2025-12-12 12:00:00",
    email: "example@gmail.com",
    status: (
      <Link className="text-[var(--wow)] bg-[var(--wow)]/[0.16] rounded-full px-3 py-1 text-xs font-normal hover:bg-[var(--hover-color)] transition-all duration-200" href="">
        Approved
      </Link>
    ),
    action: (
      <Link className="text-[var(--wow)] text-xs font-normal hover:text-[var(--hover-color)] transition-all duration-200 underline" href="/reviewlist/detail">
        Details
      </Link>
    )
  },
];

export default function ReviewList() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);


  const [selectedValue, setSelectedValue] = useState("All");
  const handleSelectionChange = (value) => {
    setSelectedValue(value);
  };
  const options = [
    { value: "All" },
    { value: "Active" },
    { value: "Inactive" },
  ];

  const tabsData = [
    {
      tabName: "Reviewed",
      content: (
        <div >
          <div className="flex flex-wrap gap-6 items-center mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Address, Email"
                className="bg-white/10 border border-white/[0.16] rounded-md pl-4 pr-11 py-[13px] flex-grow w-full outline-0 focus:border-[var(--wow)] transition duration-300 focus:ring-0 text-base"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Image src={Search} width={24} height={24} alt="Media" />
              </div>
            </div>

            <div>
              <Dropdown
                label="Status:"
                options={options}
                selectedValue={selectedValue}
                onChange={handleSelectionChange}
                width="w-full md:w-[118px]"
              />
            </div>

            <div className="flex items-center flex-wrap gap-4">
              <div className="flex items-center flex-wrap gap-4">
                <label htmlFor="date" className="text-sm font-bold">Time:</label>
                <input
                  type="date"
                  id="date"
                  className="px-4 py-[13px] rounded-md bg-white/10 border border-white/[0.16] focus:outline-none focus:ring focus:ring-[var(--wow)] transition duration-300 text-base"
                />
              </div>

              <div className="text-base">-</div>

              <div>
                <input
                  type="date"
                  id="date"
                  className="px-4 py-[13px] rounded-md bg-white/10 border border-white/[0.16] focus:outline-none focus:ring focus:ring-[var(--wow)] transition duration-300 text-base"
                />
              </div>
            </div>

            <ReusableButton text="Filter" className="w-max" />
          </div>
          <ReusableTable columns={columns} data={data} rowsPerPage={5} />
        </div>
      ),
    },
    {
      tabName: "Unreviewed",
      content: (
        <div >
          <div className="flex flex-wrap gap-6 items-center mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Address, Email"
                className="bg-white/10 border border-white/[0.16] rounded-md pl-4 pr-11 py-[13px] flex-grow w-full outline-0 focus:border-[var(--wow)] transition duration-300 focus:ring-0 text-base"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Image src={Search} width={24} height={24} alt="Media" />
              </div>
            </div>

            <div>
              <Dropdown
                label="Status:"
                options={options}
                selectedValue={selectedValue}
                onChange={handleSelectionChange}
                width="w-full md:w-[118px]"
              />
            </div>

            <div className="flex items-center flex-wrap gap-4">
              <div className="flex items-center flex-wrap gap-4">
                <label htmlFor="date" className="text-sm font-bold">Time:</label>
                <input
                  type="date"
                  id="date"
                  className="px-4 py-[13px] rounded-md bg-white/10 border border-white/[0.16] focus:outline-none focus:ring focus:ring-[var(--wow)] transition duration-300 text-base"
                />
              </div>

              <div className="text-base">-</div>

              <div>
                <input
                  type="date"
                  id="date"
                  className="px-4 py-[13px] rounded-md bg-white/10 border border-white/[0.16] focus:outline-none focus:ring focus:ring-[var(--wow)] transition duration-300 text-base"
                />
              </div>
            </div>

            <ReusableButton text="Filter" className="w-max" />
          </div>
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
            Review List
          </h1>
          <div className="w-full">

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
