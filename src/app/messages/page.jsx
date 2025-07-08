"use client";
import React from "react";
import Link from "next/link";
import { useState } from "react";
import Sidebar from "../../components/common/Sidebar";
import Header from "../../components/common/Header";
import Image from "next/image";
import Search from "../../components/assets/images/search.svg";
import Loudspeaker from "../../components/assets/images/loudspeaker.svg";
import Stopwatch from "../../components/assets/images/stopwatch.svg";
import Views from "../../components/assets/images/views.svg";
import Plus from "../../components/assets/images/plus.svg";
import Logo from "../../components/assets/images/logo.png";
import Edit from "../../components/assets/images/edit.svg";
import Delete from "../../components/assets/images/delete.svg";
import Save from "../../components/assets/images/save.svg";
import Drag from "../../components/assets/images/drag.svg";
import BackArrow from "../../components/assets/images/BackArrow.svg";
import ReusableTable from "../../components/common/ReusableTable";
import SearchField from "../../components/common/SearchField";
import AddDappModal from "../../components/layouts/Modals/AddDapp";
import DeleteDAppModal from "../../components/layouts/Modals/DeleteDApp";
import AddSlotModal from "../../components/layouts/Modals/AddSlot";
import Tabs from "../../components/common/Tabs";
import ReusableButton from "../../components/common/Button";

const columns = [
  { header: "No.", accessor: "No" },
  { header: "Icon", accessor: "Icon" },
  { header: "DApp Name", accessor: "dAppName" },
  { header: "Type", accessor: "Type" },
  { header: "Action", accessor: "Action" },
];

const data = [
  {
    No: 1,
    Icon: (
      <Image src={Logo} width={35} height={35} alt="Media" />
    ),
    dAppName: "WOWEARN",
    Type: "NFT",
    Action: (
      <div className="flex gap-2 items-center">
        <button className="p-2 border rounded-lg border-white/10 bg-white/10 hover:border-[var(--wow)] transition-all duration-200 cursor-pointer hover:shadow-lg box-border">
          <Image src={Edit} width={24} height={24} className="min-w-6" alt="Media" />
        </button>
        <button className="p-2 border rounded-lg border-white/10 bg-white/10 hover:border-[var(--wow)] transition-all duration-200 cursor-pointer hover:shadow-lg box-border">
          <Image src={Delete} width={24} height={24} className="min-w-6" alt="Media" />
        </button>
      </div>
    ),
  },
];

export default function Messages() {
  const customPlaceholder = "Search DApp Name...";

  const [showAddDappModal, setShowAddDappModal] = React.useState(false);
  const [showDeleteDAppModal, setShowDeleteDAppModal] = React.useState(false);
  const [showAddSlotModal, setShowAddSlotModal] = React.useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const [selectedValue, setSelectedValue] = useState("0");
  const handleSelectionChange = (value) => {
    setSelectedValue(value);
  };

  function toggleCheckbox(optionId) {
    const checkbox = document.getElementById(optionId);
    checkbox.checked = !checkbox.checked; // Toggle the checkbox state
  }
  const tabsData = [
    {
      tabName: "Announcement",
      content: (
        <div >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            <div className="grid-item border border-white/[0.16] bg-white/10 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <div className="bg-[#28AA77] flex items-center justify-center rounded-full p-1 min-w-12 min-h-12">
                  <div className="bg-[var(--wow)] flex items-center justify-center rounded-full p-1 min-w-8 max-h-8 w-8 h-8">
                    <Image src={Loudspeaker} width={20} height={20} alt="Media" />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <p className="text-xs font-semibold">Total Announcements</p>
                  <p className="text-xl font-semibold">4,369</p>
                </div>
              </div>
            </div>

            <div className="grid-item border border-white/[0.16] bg-white/10 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <div className="bg-[#065BB6] flex items-center justify-center rounded-full p-1 min-w-12 min-h-12">
                  <div className="bg-[#137EE4] flex items-center justify-center rounded-full p-1 min-w-8 max-h-8 w-8 h-8">
                    <Image src={Stopwatch} width={20} height={20} alt="Media" />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <p className="text-xs font-semibold">Pushed Count</p>
                  <p className="text-xl font-semibold">10,000,000</p>
                </div>
              </div>
            </div>

            <div className="grid-item border border-white/[0.16] bg-white/10 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <div className="bg-[#8E1A83] flex items-center justify-center rounded-full p-1 min-w-12 min-h-12">
                  <div className="bg-[#D128C6] flex items-center justify-center rounded-full p-1 min-w-8 max-h-8 w-8 h-8">
                    <Image src={Views} width={20} height={20} alt="Media" />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <p className="text-xs font-semibold">Views</p>
                  <p className="text-xl font-semibold">8,411</p>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:flex flex-wrap gap-6 items-center mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search Title"
                className="bg-white/10 border border-white/[0.16] rounded-md pl-4 pr-11 py-[13px] flex-grow w-full outline-0 focus:border-[var(--wow)] transition duration-300 focus:ring-0 text-base"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Image src={Search} width={24} height={24} alt="Media" />
              </div>
            </div>
            <ReusableButton className="text-sm min-h-[50px]"
              text="Search" />
            {/* <div>
              <Dropdown
                label="Status:"
                options={options}
                selectedValue={selectedValue}
                onChange={handleSelectionChange}
                width="w-full md:w-[118px]"
              />
            </div> */}

            <div className="flex items-center flex-wrap gap-4">
              <div className="flex items-center flex-wrap gap-4">
                <label htmlFor="date" className="text-sm font-medium">Time:</label>
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
            <button className="text-base font-bold bg-btn-gradient border-2 border-[var(--wow)] hover:border-[var(--hover-color)] rounded-full py-2 px-6 cursor-pointer min-h-[50px]">
              <Image src={Plus} width={24} height={24} alt="Add" className="inline-block mr-2" />
              Add
            </button>
          </div>
          <ReusableTable columns={columns} data={data} rowsPerPage={5} />
        </div>
      ),
    },
    {
      tabName: "Event",
      content: (
        <div >
          <div className="grid grid-cols-1 md:flex flex-wrap gap-6 items-center mb-6">
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
            {/* <div>
              <Dropdown
                label="Status:"
                options={options}
                selectedValue={selectedValue}
                onChange={handleSelectionChange}
                width="w-full md:w-[118px]"
              />
            </div> */}

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
    <>
      {showAddDappModal && <AddDappModal setShowAddDappModal={setShowAddDappModal} />}
      {showDeleteDAppModal && <DeleteDAppModal setShowDeleteDAppModal={setShowDeleteDAppModal} />}
      {showAddSlotModal && <AddSlotModal setShowAddSlotModal={setShowAddSlotModal} />}
      <div className="flex min-h-screen text-white">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="flex flex-col flex-1 overflow-hidden md:overflow-visible">
          <Header toggleSidebar={toggleSidebar} />

          <main className="p-6 m-6 flex-1 overflow-auto rounded-md border border-white/[0.16] backdrop-blur-xl">
            <h1 className="text-xl flex items-center gap-4 font-semibold mb-6">
              Messages
            </h1>

            <div className="table-section">
              <Tabs tabs={tabsData} />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
