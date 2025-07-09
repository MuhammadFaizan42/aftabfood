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

const columns = [
  { header: "Marketing Slot", accessor: "marketingSlot" },
  { header: "Image", accessor: "Image" },
  { header: "Total Visits", accessor: "totalVisits" },
  {
    header: "US Visits", accessor: "uSVisits",
    headerImages: [
      { src: FlagUSA, alt: 'Image 1' },  // First image
    ]
  },
  {
    header: "UK Visits", accessor: "uKVisits",
    headerImages: [
      { src: FlagUK, alt: 'Image 1' },  // First image
    ]
  },
  { header: "Status", accessor: "status" },
];

const data = [
  {
    marketingSlot: 'Test Slot Name',
    Image:
      (
        <div>
          <Image
            width={100}
            height={100}
            className="min-w-[150px] h-9 object-cover rounded"
            src={PlaceholderIcon}
          />
        </div>
      ),
    totalVisits: "116,000",
    uSVisits: "116,000",
    uKVisits: "116,000",
    status:
      (
        <div>
          <div className="py-1 px-5 w-[90px] text-[var(--wow)] bg-[var(--wow)]/[0.16] text-center rounded-full text-xs font-normal">
            Listed
          </div>

          {/* <div className="py-1 px-5 w-[90px] text-[#FAE715] bg-[#FAE715]/[0.16] text-center rounded-full text-xs font-normal">
            Unlisted
          </div>
          <div className="py-1 px-5 w-[90px] text-[#DC2626] bg-[#DC2626]/[0.16] text-center rounded-full text-xs font-normal">
            Delisted
          </div> */}
        </div>
      ),

  },
];

export default function BannerStats() {
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

          <main className="m-6">
            <div className="p-6 flex-1 overflow-auto rounded-md border border-white/[0.16] backdrop-blur-xl">
              <div className="token-wrapper">
                <h1 className="text-xl flex items-center gap-4 font-semibold mb-6">
                  Banner Data Statistics
                </h1>
                <div className="w-full">
                  <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="w-full md:w-auto">
                        <SearchField placeholder="Search Slot..."
                          className="bg-white/10 border border-white/[0.16] rounded-md pl-4 pr-11 py-[13px] flex-grow w-full outline-0 focus:border-[var(--wow)] transition duration-300 focus:ring-0 text-base"
                        />
                      </div>
                      <div className="no-margin w-full md:w-auto">
                        <Dropdown
                          // label="Label"
                          options={options}
                          selectedValue={selectedValue}
                          onChange={handleSelectionChange}
                          width="w-full md:min-w-[150px] text-sm"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => setIsAddTokenVisible(true)}
                      className="flex w-max gap-2 items-center text-sm font-semibold bg-btn-gradient border-2 border-[var(--wow)] hover:bg-black hover:border-[var(--hover-color)] rounded-full py-[11px] px-6 min-h-[50px] whitespace-nowrap cursor-pointer box-border"
                    >
                      <Image src={Export} width={24} height={24} alt="Media" />
                      Export
                    </button>
                  </div>

                  <div className="table-section">
                    <ReusableTable columns={columns} data={data} rowsPerPage={5} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-6 flex-1 overflow-auto rounded-md border border-white/[0.16] backdrop-blur-xl">
              <div className="token-wrapper">
                <h1 className="text-xl flex items-center gap-4 font-semibold mb-6">
                  Daily Banner Data
                </h1>
                <div className="w-full">
                  <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="w-full md:w-auto">
                        <SearchField placeholder="Search Slot..."
                          className="bg-white/10 border border-white/[0.16] rounded-md pl-4 pr-11 py-[13px] flex-grow w-full outline-0 focus:border-[var(--wow)] transition duration-300 focus:ring-0 text-base"
                        />
                      </div>
                      <div className="no-margin w-full md:w-auto">
                        <Dropdown
                          // label="Label"
                          options={options}
                          selectedValue={selectedValue}
                          onChange={handleSelectionChange}
                          width="w-full md:min-w-[150px] text-sm"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => setIsAddTokenVisible(true)}
                      className="flex w-max gap-2 items-center text-sm font-semibold bg-btn-gradient border-2 border-[var(--wow)] hover:bg-black hover:border-[var(--hover-color)] rounded-full py-[11px] px-6 min-h-[50px] whitespace-nowrap cursor-pointer box-border"
                    >
                      <Image src={Export} width={24} height={24} alt="Media" />
                      Export
                    </button>
                  </div>

                  <div className="table-section">
                    <ReusableTable columns={columns} data={data} rowsPerPage={5} />
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
