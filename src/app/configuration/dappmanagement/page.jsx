"use client";
import React from "react";
import Link from "next/link";
import { useState } from "react";
import Sidebar from "../../../components/common/Sidebar";
import Header from "../../../components/common/Header";
import Image from "next/image";
import Search from "../../../components/assets/images/search.svg";
import Export from "../../../components/assets/images/export.svg";
import Plus from "../../../components/assets/images/plus.svg";
import Logo from "../../../components/assets/images/logo.png";
import Edit from "../../../components/assets/images/edit.svg";
import Delete from "../../../components/assets/images/delete.svg";
import BackArrow from "../../../components/assets/images/BackArrow.svg";
import ReusableTable from "../../../components/common/ReusableTable";
import Dropdown from "../../../components/common/Dropdown";
import SearchField from "../../../components/common/SearchField";
import AddDappModal from "../../../components/layouts/Modals/AddDapp";
import DeleteDAppModal from "../../../components/layouts/Modals/DeleteDApp";
import AddSlotModal from "../../../components/layouts/Modals/AddSlot";

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
          <Image src={Edit} width={24} height={24} alt="Media" />
        </button>
        <button className="p-2 border rounded-lg border-white/10 bg-white/10 hover:border-[var(--wow)] transition-all duration-200 cursor-pointer hover:shadow-lg box-border">
          <Image src={Delete} width={24} height={24} alt="Media" />
        </button>
      </div>
    ),
  },
];

export default function DappManagement() {
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
  const options = [
    { value: "0" },
    { value: "1" },
    { value: "2" },
    { value: "3" },
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
              {/* <Link href='/userlist' className="block">
              <Image src={BackArrow} width={24} height={24} alt="Media" />
            </Link> */}
              DApp Management
            </h1>
            <div className="w-full">
              <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
                <SearchField placeholder={customPlaceholder} />
                {/* <Dropdown
                label="WBond"
                options={options}
                selectedValue={selectedValue}
                onChange={handleSelectionChange}
                width="w-full md:w-[150px]"
              /> */}
                <button onClick={() => setShowAddDappModal(true)}
                  className="flex w-max gap-2 items-center text-sm font-semibold bg-btn-gradient border-2 border-[var(--wow)] hover:bg-black hover:border-[var(--hover-color)] rounded-full py-[11px] px-6 min-h-[50px] whitespace-nowrap cursor-pointer box-border"
                >
                  <Image
                    src={Plus}
                    width={24}
                    height={24}
                    alt="Media" />
                  Add DApp
                </button>
              </div>

              <div className="table-section">
                <ReusableTable columns={columns} data={data} rowsPerPage={5} />
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
