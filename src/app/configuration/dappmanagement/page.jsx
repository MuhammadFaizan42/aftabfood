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
import Save from "../../../components/assets/images/save.svg";
import Drag from "../../../components/assets/images/drag.svg";
import BackArrow from "../../../components/assets/images/BackArrow.svg";
import ReusableTable from "../../../components/common/ReusableTable";
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
          <Image src={Edit} width={24} height={24} className="min-w-6" alt="Media" />
        </button>
        <button className="p-2 border rounded-lg border-white/10 bg-white/10 hover:border-[var(--wow)] transition-all duration-200 cursor-pointer hover:shadow-lg box-border">
          <Image src={Delete} width={24} height={24} className="min-w-6" alt="Media" />
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

  function toggleCheckbox(optionId) {
    const checkbox = document.getElementById(optionId);
    checkbox.checked = !checkbox.checked; // Toggle the checkbox state
  }

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
              DApp Management
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-[200px_auto] gap-6">
              <div className="dapp-category bg-white/10 border border-white/[0.16] rounded-[10px] p-2.5 backdrop-blur-xl">

                <div className="flex justify-end gap-4">
                  <button className="p-2 border rounded-lg border-white/[0.16] bg-white/10 hover:border-[var(--wow)] transition-all duration-200 cursor-pointer hover:shadow-lg box-border">
                    <Image src={Edit} width={24} height={24} alt="Media" />
                  </button>

                  <button className="p-2 border rounded-lg border-white/[0.16] bg-white/10 hover:border-[var(--wow)] transition-all duration-200 cursor-pointer hover:shadow-lg box-border">
                    <Image src={Delete} width={24} height={24} alt="Media" />
                  </button>

                  <button className="p-2 border rounded-lg border-white/[0.16] bg-white/10 hover:border-[var(--wow)] transition-all duration-200 cursor-pointer hover:shadow-lg box-border">
                    <Image src={Save} width={24} height={24} alt="Media" />
                  </button>
                </div>

                <div className="slot-lists mt-8 mb-6">
                  <div className="px-3 py-4 border-b border-white/[0.16] text-xs font-medium">
                    All
                  </div>
                  <div className="px-3 py-4 border-b border-white/[0.16] text-xs font-medium">
                    Popular
                  </div>
                  <div className="px-3 py-4 border-b border-white/[0.16] text-xs font-medium">
                    MEME
                  </div>
                  <div className="px-3 py-4 border-b border-white/[0.16] text-xs font-medium">
                    Defi
                  </div>
                  <div className="px-3 py-4 border-b border-white/[0.16] text-xs font-medium">
                    AirDrop
                  </div>
                  <div className="px-3 py-4 border-b border-white/[0.16] text-xs font-medium">
                    NFT
                  </div>
                  <div className="px-3 py-4 border-b border-white/[0.16] text-xs font-medium">
                    Other
                  </div>
                </div>

                {/* Draggable List Starts Here */}
                <div className="hidden draggable-list mt-8 mb-6">
                  <div className="px-3 py-4 border-b border-white/[0.16]">
                    <div className="checkbox-item cursor-pointer" onClick={() => toggleCheckbox('all')}>
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <div className="round flex items-center">
                          <input type="checkbox" id="all" className="checkbox hidden" />
                          <label htmlFor="all" className="checkbox-label"></label>
                        </div>
                        All
                      </div>
                    </div>
                  </div>

                  <div className="px-3 py-4 border-b border-white/[0.16] flex justify-between items-center">
                    <div className="checkbox-item cursor-pointer" onClick={() => toggleCheckbox('popular')}>
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <div className="round flex items-center">
                          <input type="checkbox" id="popular" className="checkbox hidden" />
                          <label htmlFor="popular" className="checkbox-label"></label>
                        </div>
                        Popular
                      </div>
                    </div>
                    <button className="cursor-pointer">
                      <Image src={Drag} width={12} height={9} alt="Media" />
                    </button>
                  </div>

                  <div className="px-3 py-4 border-b border-white/[0.16] flex justify-between items-center">
                    <div className="checkbox-item cursor-pointer" onClick={() => toggleCheckbox('meme')}>
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <div className="round flex items-center">
                          <input type="checkbox" id="meme" className="checkbox hidden" />
                          <label htmlFor="meme" className="checkbox-label"></label>
                        </div>
                        MEME
                      </div>
                    </div>
                    <button className="cursor-pointer">
                      <Image src={Drag} width={12} height={9} alt="Media" />
                    </button>
                  </div>

                  <div className="px-3 py-4 border-b border-white/[0.16] flex justify-between items-center">
                    <div className="checkbox-item cursor-pointer" onClick={() => toggleCheckbox('defi')}>
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <div className="round flex items-center">
                          <input type="checkbox" id="defi" className="checkbox hidden" />
                          <label htmlFor="defi" className="checkbox-label"></label>
                        </div>
                        Defi
                      </div>
                    </div>
                    <button className="cursor-pointer">
                      <Image src={Drag} width={12} height={9} alt="Media" />
                    </button>
                  </div>

                  <div className="px-3 py-4 border-b border-white/[0.16] flex justify-between items-center">
                    <div className="checkbox-item cursor-pointer" onClick={() => toggleCheckbox('airdrop')}>
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <div className="round flex items-center">
                          <input type="checkbox" id="airdrop" className="checkbox hidden" />
                          <label htmlFor="airdrop" className="checkbox-label"></label>
                        </div>
                        AirDrop
                      </div>
                    </div>
                    <button className="cursor-pointer">
                      <Image src={Drag} width={12} height={9} alt="Media" />
                    </button>
                  </div>

                  <div className="px-3 py-4 border-b border-white/[0.16] flex justify-between items-center">
                    <div className="checkbox-item cursor-pointer" onClick={() => toggleCheckbox('nft')}>
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <div className="round flex items-center">
                          <input type="checkbox" id="nft" className="checkbox hidden" />
                          <label htmlFor="nft" className="checkbox-label"></label>
                        </div>
                        NFT
                      </div>
                    </div>
                    <button className="cursor-pointer">
                      <Image src={Drag} width={12} height={9} alt="Media" />
                    </button>
                  </div>

                  <div className="px-3 py-4 border-b border-white/[0.16] flex justify-between items-center">
                    <div className="checkbox-item cursor-pointer" onClick={() => toggleCheckbox('other')}>
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <div className="round flex items-center">
                          <input type="checkbox" id="other" className="checkbox hidden" />
                          <label htmlFor="other" className="checkbox-label"></label>
                        </div>
                        Other
                      </div>
                    </div>
                    <button className="cursor-pointer">
                      <Image src={Drag} width={12} height={9} alt="Media" />
                    </button>
                  </div>
                </div>
                {/* Draggable List Ends Here */}

                <div className="slot-actions">
                  <button onClick={() => setShowAddSlotModal(true)}
                    className="flex w-full gap-2 items-center text-sm font-semibold bg-btn-gradient border-2 border-[var(--wow)] hover:bg-black hover:border-[var(--hover-color)] rounded-full py-1.5 px-6 whitespace-nowrap cursor-pointer box-border mb-6"
                  >
                    <Image
                      src={Plus}
                      width={24}
                      height={24}
                      alt="Media" />
                    Add Slot
                  </button>

                  <div className="add-slot-actions hidden">
                    <button onClick={() => setShowAddSlotModal(true)}
                      className="flex w-full gap-2 items-center text-sm font-semibold bg-btn-gradient border-2 border-[var(--wow)] justify-center hover:border-[var(--hover-color)] rounded-full py-1.5 px-6 whitespace-nowrap cursor-pointer box-border mb-6"
                    >
                      Confirm
                    </button>

                    <button onClick={() => setShowAddSlotModal(true)}
                      className="flex w-full gap-2 items-center text-sm font-semibold bg-[#1f1f1f] border-2 border-black/[0.16] justify-center hover:border-black rounded-full py-1.5 px-6 whitespace-nowrap cursor-pointer box-border mb-6"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>

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
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
