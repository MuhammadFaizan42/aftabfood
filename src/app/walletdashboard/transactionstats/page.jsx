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
  { header: "Chain", accessor: "Chain", padding: "18px 16px" },
  { header: "Token", accessor: "Token", padding: "18px 16px" },
  { header: "Total Transaction Amount Sent", accessor: "totalTransactionAmountSent", padding: "18px 16px" },
  { header: "Total Number Of Transactions Sent", accessor: "totalNumberOfTransactionsSent", padding: "18px 16px" },
];

const data = [
  {
    Date: '2025-06-01',
    Chain: 'EVM',
    Token: "USDT",
    totalTransactionAmountSent: "116,000",
    totalNumberOfTransactionsSent: "116,000",
  },
];

const columns1 = [
  { header: "Chain", accessor: "Chain", padding: "18px 16px" },
  { header: "Token", accessor: "Token", padding: "18px 16px" },
  { header: "Total Transaction Amount Sent", accessor: "totalTransactionAmountSent", padding: "18px 16px" },
  { header: "Total Number Of Transactions Sent", accessor: "totalNumberOfTransactionsSent", padding: "18px 16px" },
];

const data1 = [
  {
    Chain: 'EVM',
    Token: "USDT",
    totalTransactionAmountSent: "116,000",
    totalNumberOfTransactionsSent: "116,000",
  },
];

const columns2 = [
  { header: "Address", accessor: "Address", padding: "18px 16px" },
  { header: "Date", accessor: "Date", padding: "18px 16px" },
  { header: "Chain", accessor: "Chain", padding: "18px 16px" },
  { header: "Token", accessor: "Token", padding: "18px 16px" },
  { header: "Total Transaction Amount Sent", accessor: "totalTransactionAmountSent", padding: "18px 16px" },
];

const data2 = [
  {
    Address: '0x123456789',
    Date: '2025-12-12 10:00:00',
    Chain: 'EVM',
    Token: "USDT",
    totalTransactionAmountSent: "116,000",
  },
];

export default function TransactionStats() {
  const [isTransactionStatsVisible, setIsTransactionStatsVisible] = useState(false); // State to control the visibility of the Add Token section

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
            {!isTransactionStatsVisible && (
              <div>
                <div className="flex justify-between flex-wrap gap-6 items-center mb-6">
                  <h1 className="text-xl font-semibold">
                    Transaction Stats
                  </h1>
                  <ReusableButton onClick={() => setIsTransactionStatsVisible(true)} text="Visual Chart" />
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
                        <ReusableTable columns={columns1} data={data1} rowsPerPage={5} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-6 flex-1 overflow-auto rounded-md border border-white/[0.16] backdrop-blur-xl">
                  <div className="token-wrapper">
                    <h1 className="text-xl font-semibold mb-6">
                      Daily Transaction Stats
                    </h1>
                    <div className="w-full">
                      <div className="mb-6 flex flex-wrap items-center gap-4">
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
                        <ReusableTable columns={columns} data={data} rowsPerPage={5} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-6 flex-1 overflow-auto rounded-md border border-white/[0.16] backdrop-blur-xl">
                  <div className="token-wrapper">
                    <h1 className="text-xl font-semibold mb-6">
                      Transaction Details
                    </h1>
                    <div className="w-full">
                      <div className="mb-6 flex flex-wrap items-center gap-4">
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
                        <ReusableTable columns={columns2} data={data2} rowsPerPage={5} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isTransactionStatsVisible && (
              <div className="chart-view">
                <div className="flex gap-4 items-center mb-6">
                  <button
                    className="cursor-pointer"
                    onClick={() => setIsTransactionStatsVisible(false)}
                  >
                    <Image src={BackArrow} width={24} height={24} alt="Back" />
                  </button>
                  <h2 className="text-xl">Transaction Sending Data Analysis by Chain</h2>
                </div>
                <div className="p-6 flex-1 overflow-auto rounded-md border border-white/[0.16] backdrop-blur-xl">
                  <h2 className="text-xl font-semibold mb-6">Swap Data Statistics</h2>

                  <div className="event-wrapper">
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

                    <div className="mt-6">
                      <Image src={EventChart} width={100} height={100} alt="Event Chart" className="w-full h-auto" />
                    </div>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </>
  );
}
