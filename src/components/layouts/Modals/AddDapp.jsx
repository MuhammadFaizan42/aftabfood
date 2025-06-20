import React from "react";
import { useState } from 'react';
import { CloseIcon } from '../../assets'
import Image from "next/image";
// import SuccessIcon from "../../assets/images/SuccessIcon.svg";
import ReusableButton from "../../common/Button";
import InputField from "../../common/InputField";
import FileUpload from "../../common/FileUpload";
import Dropdown from "../../common/Dropdown";

export default function AddDappModal({ setShowAddDappModal }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

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

  const handleFileChange = (file) => {
    console.log("Selected file:", file);
  };
  return (
    <React.Fragment>
      <div className="app-modal">
        <div className="backdrop-blur-xl bg-black/10 justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
          <div className="relative w-full my-6 mx-auto max-w-[400px]">
            {/*content*/}
            <div className="popup-style p-6 max-[768px]:w-[95%] mx-auto rounded-2xl relative flex flex-col w-full">
              {/*header*/}
              <div className="flex items-start justify-end">
                <button
                  className="close-modal cursor-pointer"
                  onClick={() => setShowAddDappModal(false)}
                >
                  <CloseIcon />
                </button>
              </div>
              {/*body*/}
              <div className="relative flex-auto">
                <InputField
                  label="DApp Name"
                  placeholder="WOW EARN XXXX"
                  className="mb-4"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                {/* Using InputField for Address */}
                <InputField
                  label="Address"
                  placeholder="Enter your address"
                  className="mb-4"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />

                <FileUpload buttonText="Choose File" onFileChange={handleFileChange} />

                <Dropdown
                  label="WBond"
                  options={options}
                  selectedValue={selectedValue}
                  onChange={handleSelectionChange}
                  width="w-full"
                />
                <ReusableButton text="Download Excel File" className="w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}