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
import FlagChina from "../../../components/assets/images/FlagChina.svg";
import FlagIndia from "../../../components/assets/images/FlagIndia.svg";
import BackArrow from "../../../components/assets/images/BackArrow.svg";
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
  { header: "No #.", accessor: "No" },
  { header: "Ad Name", accessor: "adName" },
  { header: "Start Time", accessor: "startTime" },
  { header: "End Time", accessor: "endTime" },
  { header: "Status", accessor: "status" },
  { header: "Action", accessor: "Action" },
];

const data = [
  {
    No: 1,
    adName: "Summer Promo",
    startTime: "2025-06-01",
    endTime: "2025-06-30",
    status:
      (
        <div>
          <div className="py-1 px-5 w-[90px] text-[var(--wow)] bg-[var(--wow)]/[0.16] text-center rounded-full text-xs font-normal">
            Active
          </div>

          {/* <div className="py-1 px-5 w-[90px] text-[#FAE715] bg-[#FAE715]/[0.16] text-center rounded-full text-xs font-normal">
            Inactive
          </div>
          <div className="py-1 px-5 w-[90px] text-[#DC2626] bg-[#DC2626]/[0.16] text-center rounded-full text-xs font-normal">
            Expired
          </div> */}
        </div>
      ),
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

export default function AdSlotManagement() {
  const customPlaceholder = "Search by token name..."; // Custom placeholder for the search field
  const [isAddTokenVisible, setIsAddTokenVisible] = useState(false); // State to control the visibility of the Add Token section

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
  return (
    <>
      {showDeleteAdModal && <DeleteAdModal setShowDeleteAdModal={setShowDeleteAdModal} />}
      <div className="flex min-h-screen text-white">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="flex flex-col flex-1 overflow-hidden md:overflow-visible">
          <Header toggleSidebar={toggleSidebar} />

          <main className="p-6 m-6 flex-1 overflow-auto rounded-md border border-white/[0.16] backdrop-blur-xl">
            {!isAddTokenVisible && (
              <div className="token-wrapper">
                <h1 className="text-xl flex items-center gap-4 font-semibold mb-6">
                  Ad Slot Management
                </h1>
                <div className="w-full">
                  <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
                    <div className="flex flex-wrap items-center gap-6">
                      <SearchField placeholder={customPlaceholder} />
                      <div className="no-margin">
                        <Dropdown
                          isRequired={false}  // No label or asterisk
                          options={[{ value: "Ethereum" }, { value: "Bitcoin" }]}
                          selectedValue="Bitcoin"
                          onChange={(value) => console.log(value)}
                          width={"w-[150px] h-[49.33px] mt-0"}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => setIsAddTokenVisible(true)}
                      className="flex w-max gap-2 items-center text-sm font-semibold bg-btn-gradient border-2 border-[var(--wow)] hover:bg-black hover:border-[var(--hover-color)] rounded-full py-[11px] px-6 min-h-[50px] whitespace-nowrap cursor-pointer box-border"
                    >
                      <Image src={Plus} width={24} height={24} alt="Add" />
                      Create Ad
                    </button>
                  </div>

                  <div className="table-section">
                    <ReusableTable columns={columns} data={data} rowsPerPage={5} />
                  </div>
                </div>
              </div>
            )}

            {/* Create Ad Wrapper */}
            {isAddTokenVisible && (
              <div className="add-token-wrapper">
                <div className="flex gap-4 items-center mb-6">
                  <button
                    className="cursor-pointer"
                    onClick={() => setIsAddTokenVisible(false)}
                  >
                    <Image src={BackArrow} width={24} height={24} alt="Back" />
                  </button>
                  <h2 className="text-xl font-semibold">Create Ad</h2>
                </div>

                <div className="flex flex-wrap gap-4 mb-6">
                  {/* Using local image for German flag */}
                  <LanguageCheckbox
                    flagSrc="/flags/germany.svg"  // Local image path (stored in the public/flags directory)
                    languageName="German (DE)"
                  />

                  {/* Using local image for USA flag */}
                  <LanguageCheckbox
                    flagSrc="https://toppng.com/uploads/preview/uk-round-flag-11563596900h0bvrmnyb2.png"  // Local image path (stored in the public/flags directory)
                    languageName="English (USA)"
                  />

                  {/* Using local image for India flag */}
                  <LanguageCheckbox
                    flagSrc="/flags/india.svg"  // Local image path (stored in the public/flags directory)
                    languageName="Hindi (IN)"
                  />
                </div>

                <div className="md:w-[60%] xl:w-1/2 mx-auto">
                  <div className="add-token-form">
                    <div className="flex justify-end">
                      <button onClick={toggleDropdown} className="flex justify-end items-center text-sm bg-white/10 py-1.5 px-2.5 rounded hover:bg-[var(--wow)]/50 cursor-pointer transition-colors duration-300">
                        <Image src={Plus} width={18} height={18} alt="Plus" className="min-w-4 mr-2" />
                        <span>Add other language ad</span>
                      </button>
                    </div>

                    <div className="add-token-dropdown my-4">
                      {isDropdownVisible && (
                        <LanguageDropdown
                          label="Select Language"
                          isRequired={true} // Optional, adds asterisk if true
                          options={[
                            { value: "English (USA)", flag: FlagUSA },
                            { value: "INR - India", flag: FlagIndia },
                            { value: "中国手语 (CSL)", flag: FlagChina },
                          ]}
                          selectedValue="English (USA)"
                          onChange={(value) => console.log(value)}
                          width="w-full"
                        />
                      )}
                    </div>

                    <div>
                      <InputField
                        label="Ad Name"
                        placeholder="e.g., WOWEARN"
                        className="mb-4"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-[35%_auto] gap-6 mb-4">
                      <lable className="text-sm font-medium text-end">
                        Description <span className="text-red-800">&nbsp;*</span>
                      </lable>
                      <textarea
                        placeholder="write desciption"
                        className="w-full bg-white/10 mt-2 rounded-lg shadow-md px-[14px] py-[13px] focus:border-[var(--wow)] outline-none border border-white/[0.16] transition-colors duration-300"
                        rows={4}
                        onChange={(e) => setDescription(e.target.value)}></textarea>
                    </div>

                    <div className="no-asteric">
                      <InputField
                        label="URL (Optional)"
                        placeholder="https://example.com"
                        className="mb-4"
                        // value={symbol}
                        onChange={(e) => setSymbol(e.target.value)}
                      />
                    </div>

                    <div className="mb-4">
                      <FileUpload
                        buttonText="Choose File"
                        label="[EN] Upload Image (Day)"
                        onFileChange={handleFileChange}
                      />
                    </div>

                    <div className="mb-4">
                      <FileUpload
                        buttonText="Choose File"
                        label="[EN] Upload Image (Night)"
                        onFileChange={handleFileChange}
                      />
                    </div>

                    <div className="grid grid-cols-[35%_auto] gap-6 mb-4 items-center">
                      <lable className="text-sm font-medium text-end">
                        Start Time <span className="text-red-800">&nbsp;*</span>
                      </lable>
                      <input type="date" className="w-full bg-white/10 rounded-lg shadow-md px-[14px] py-[13px] focus:border-[var(--wow)] outline-none border border-white/[0.16] transition-colors duration-300" />
                    </div>

                    <div className="grid grid-cols-[35%_auto] gap-6 mb-4 items-center">
                      <lable className="text-sm font-medium text-end">
                        End Time <span className="text-red-800">&nbsp;*</span>
                      </lable>
                      <input type="date" className="w-full bg-white/10 rounded-lg shadow-md px-[14px] py-[13px] focus:border-[var(--wow)] outline-none border border-white/[0.16] transition-colors duration-300" />
                    </div>

                    <div>
                      <InputField
                        label="Priority Level"
                        placeholder="99"
                        className="mb-4"
                        // value={symbol}
                        onChange={(e) => setSymbol(e.target.value)}
                      />
                    </div>

                    <div className="flex gap-4 justify-end">
                      <button className="text-base font-semibold border-2 border-white/10 hover:border-white bg-white/10 rounded-full py-2 px-6 whitespace-nowrap cursor-pointer">Cancel</button>

                      <ReusableButton text="Save" />
                      <ReusableButton text="Confirm" />
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
