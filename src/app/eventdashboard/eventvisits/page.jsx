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
import FlagUSA from "../../../components/assets/images/FlagUSA.svg";
import FlagUK from "../../../components/assets/images/FlagUK.svg";
import FlagChina from "../../../components/assets/images/FlagChina.svg";
import FlagDubai from "../../../components/assets/images/FlagDubai.svg";
import FlagTurkey from "../../../components/assets/images/FlagTurkey.svg";
import FlagIndia from "../../../components/assets/images/FlagIndia.svg";
import BackArrow from "../../../components/assets/images/BackArrow.svg";
import PlaceholderIcon from "../../../components/assets/images/placeholder.png";
import ReusableTable from "../../../components/common/ReusableTable";
import Dropdown from "../../../components/common/Dropdown";
import SearchField from "../../../components/common/SearchField";
import DeleteTokenModal from "../../../components/layouts/Modals/DeleteToken";
import InputField from "../../../components/common/InputField";
import FileUpload from "../../../components/common/FileUpload";
import ReusableButton from "../../../components/common/Button";
import LanguageDropdown from "../../../components/common/LanguageDropdown";
import DeleteAdModal from "../../../components/layouts/Modals/DeleteAd";
import LanguageCheckbox from "../../../components/common/LanguageCheckbox";

const columnsEventTable = [
  { header: "Event", accessor: "Event", padding: "18px 16px" },
  { header: "Total Visits", accessor: "totalVisits" },
  {
    header: "US Address Count", accessor: "uSAddressCount", padding: "18px 16px",
    headerImages: [
      { src: FlagUSA, alt: 'Flag' },
    ]
  },
  {
    header: "Dubai Address Count", accessor: "dubaiAddressCount", padding: "18px 16px",
    headerImages: [
      { src: FlagDubai, alt: 'Flag' },
    ]
  },
  {
    header: "Turkey Address Count", accessor: "turkeyAddressCount", padding: "18px 16px",
    headerImages: [
      { src: FlagTurkey, alt: 'Flag' },
    ]
  },
  {
    header: "India Address Count", accessor: "indiaAddressCount", padding: "18px 16px",
    headerImages: [
      { src: FlagIndia, alt: 'Flag' },
    ]
  },
];

const dataEventTable = [
  {
    Event: 'Twitter',
    totalVisits: "116,000",
    marketingSlot: 'Test Slot Name',
    uSAddressCount: "116,000",
    dubaiAddressCount: "116,000",
    turkeyAddressCount: "116,000",
    indiaAddressCount: "116,000",
  },
];

export default function EventVisits() {
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
      {showDeleteAdModal && <DeleteAdModal setShowDeleteAdModal={setShowDeleteAdModal} />}
      <div className="flex min-h-screen text-white">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="flex flex-col flex-1 overflow-hidden md:overflow-visible">
          <Header toggleSidebar={toggleSidebar} />

          <main>
            <div className="m-6 p-6 flex-1 overflow-auto rounded-md border border-white/[0.16] backdrop-blur-xl">
              <div className="token-wrapper">
                <div className="flex items-center justify-between gap-6 flex-wrap mb-6">
                  <h1 className="text-xl font-semibold">
                    Event Visit Data Statistics
                  </h1>
                  <ReusableButton text="Visual Chart" />
                </div>
                <div className="w-full">
                  <div className="mb-6 flex flex-wrap items-center gap-4">
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="w-full md:w-auto">
                        <SearchField placeholder="Search Event..."
                          className="bg-white/10 border border-white/[0.16] rounded-md pl-4 pr-11 py-[13px] flex-grow w-full outline-0 focus:border-[var(--wow)] transition duration-300 focus:ring-0 text-base"
                        />
                      </div>
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

                    <button
                      className="flex w-max gap-2 items-center text-sm font-semibold bg-btn-gradient border-2 border-[var(--wow)] hover:bg-black hover:border-[var(--hover-color)] rounded-full py-[11px] px-6 min-h-[50px] whitespace-nowrap cursor-pointer box-border"
                    >
                      <Image src={Export} width={24} height={24} alt="Media" />
                      Export
                    </button>
                  </div>

                  <div className="table-section">
                    <ReusableTable columns={columnsEventTable} data={dataEventTable} rowsPerPage={5} />
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
