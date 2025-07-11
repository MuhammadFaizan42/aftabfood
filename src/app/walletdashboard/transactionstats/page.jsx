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
import EventChart from "../../../components/assets/images/EventChart.svg";
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
  { header: "Date", accessor: "Date", padding: "18px 16px" },
  { header: "IOS", accessor: "IOS", padding: "18px 16px" },
  { header: "Android", accessor: "Android", padding: "18px 16px" },
];

const data = [
  {
    Date: '2025-06-01',
    IOS: "116,000",
    Android: "116,000",
  },
];

const columnsWalletStatsTable = [
  { header: "Date", accessor: "Date", padding: "18px 16px" },
  { header: "Total Visit", accessor: "totalVisit", padding: "18px 16px" },
  {
    header: "US Visits", accessor: "uSVisits", padding: "18px 16px",
    headerImages: [
      { src: FlagUSA, alt: 'Flag' },
    ]
  },
  {
    header: "Dubai Visits", accessor: "dubaiVisits", padding: "18px 16px",
    headerImages: [
      { src: FlagDubai, alt: 'Flag' },
    ]
  },
  {
    header: "Turkey Visits", accessor: "turkeyVisits", padding: "18px 16px",
    headerImages: [
      { src: FlagTurkey, alt: 'Flag' },
    ]
  },
  {
    header: "India Visits", accessor: "indiaVisits", padding: "18px 16px",
    headerImages: [
      { src: FlagIndia, alt: 'Flag' },
    ]
  },
];

const dataWalletStatsTable = [
  {
    Date: '2025-06-01',
    totalVisit: "116,000",
    uSVisits: "116,000",
    dubaiVisits: "116,000",
    turkeyVisits: "116,000",
    indiaVisits: "116,000",
  },
];

export default function TransactionStats() {
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

  const [selectedValue1, setSelectedValue1] = useState("Chain");
  const handleSelectionChange1 = (value) => {
    setSelectedValue1(value);
  };
  const options1 = [
    { value: "Chain" },
    { value: "EVM" },
  ];

  const [selectedValue2, setSelectedValue2] = useState("Token");
  const handleSelectionChange2 = (value) => {
    setSelectedValue2(value);
  };
  const options2 = [
    { value: "Token" },
    { value: "USDT" },
  ];
  return (
    <>
      {showDeleteAdModal && <DeleteAdModal setShowDeleteAdModal={setShowDeleteAdModal} />}
      <div className="flex min-h-screen text-white">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="flex flex-col flex-1 overflow-hidden md:overflow-visible">
          <Header toggleSidebar={toggleSidebar} />

          <main className="m-6">
            <div className="flex justify-between flex-wrap gap-6 items-center mb-6">
              <h1 className="text-xl font-semibold">
                Transaction Stats
              </h1>
              <ReusableButton text="Visual Chart" />
            </div>
            <div className="p-6 flex-1 overflow-auto rounded-md border border-white/[0.16] backdrop-blur-xl">
              <div className="token-wrapper">
                <h1 className="text-xl font-semibold mb-6">
                  Transaction Stats
                </h1>
                <div className="w-full">
                  <div className="mb-6 grid grid-cols-2 md:grid-cols-[1fr_1fr_auto] gap-4">
                    <div className="no-margin w-full md:w-auto">
                      <Dropdown
                        // label="Label"
                        options={options1}
                        selectedValue={selectedValue1}
                        onChange={handleSelectionChange1}
                        width="w-full md:min-w-[150px] text-sm"
                      />
                    </div>
                    <div className="no-margin w-full md:w-auto">
                      <Dropdown
                        // label="Label"
                        options={options2}
                        selectedValue={selectedValue2}
                        onChange={handleSelectionChange2}
                        width="w-full md:min-w-[150px] text-sm"
                      />
                    </div>
                    <button
                      className="flex w-max gap-2 items-center text-sm font-semibold bg-btn-gradient border-2 border-[var(--wow)] hover:bg-black hover:border-[var(--hover-color)] rounded-full py-[11px] px-6 min-h-[50px] whitespace-nowrap cursor-pointer box-border"
                    >
                      <Image src={Export} width={24} height={24} alt="Media" />
                      Export
                    </button>
                  </div>

                  <div className="table-section">
                    <ReusableTable columns={columnsWalletStatsTable} data={dataWalletStatsTable} rowsPerPage={5} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-6 flex-1 overflow-auto rounded-md border border-white/[0.16] backdrop-blur-xl">
              <div className="token-wrapper">
                <h1 className="text-xl font-semibold mb-6">
                  Device-wise Daily Wallet Visits
                </h1>
                <div className="w-full">
                  <div className="mb-6 flex flex-wrap items-center md:grid md:grid-cols-[1fr_auto] gap-4">
                    <div className="flex items-center flex-wrap md:grid md:grid-cols-[auto_1fr_auto_1fr] gap-4">
                      <label htmlFor="date" className="text-sm font-bold block">Time:</label>
                      <div>
                        <input
                          type="date"
                          id="date"
                          className="w-full px-4 py-[13px] rounded-md bg-white/10 border border-white/[0.16] focus:outline-none focus:ring focus:ring-[var(--wow)] transition duration-300 text-base"
                        />
                      </div>

                      <div className="text-base">-</div>

                      <div>
                        <input
                          type="date"
                          id="date"
                          className="w-full px-4 py-[13px] rounded-md bg-white/10 border border-white/[0.16] focus:outline-none focus:ring focus:ring-[var(--wow)] transition duration-300 text-base"
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
