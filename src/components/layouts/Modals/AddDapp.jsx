import React from "react";
import { useState } from 'react';
import { CloseIcon } from '../../assets'
import Image from "next/image";
// import SuccessIcon from "../../assets/images/SuccessIcon.svg";
import ReusableButton from "../../common/Button";
import InputField from "../../common/InputField";
import FileUpload from "../../common/FileUpload";
import Dropdown from "../../common/Dropdown";
import MultiDropdown from "../../common/MultiDropdoown";

export default function AddDappModal({ setShowAddDappModal }) {
  const [name, setName] = useState("");
  const [dappDescription, setdappDescription] = useState("");
  const [dappURL, setdappURL] = useState("");
  const [priorityLevel, setpriorityLevel] = useState("");

  const [selectedValue, setSelectedValue] = useState("Both");
  const handleSelectionChange = (value) => {
    setSelectedValue(value);
  };
  const options = [
    { value: "Both" },
    { value: "IOS" },
    { value: "Android" },
  ];

  // Multi Dropdown
  // Separate states for each dropdown
  const [selectedDAppCategory, setSelectedDAppCategory] = useState([]);
  const [selectedDAppNetwork, setSelectedDAppNetwork] = useState([]);

  // Options for DApp Category dropdown
  const dAppCategoryOptions = [
    { value: "DeFi" },
    { value: "NFT" },
    { value: "Gaming" },
    { value: "Metaverse" },
  ];

  // Options for Network dropdown
  const dAppnetworkOptions = [
    { value: "Ethereum" },
    { value: "AVAX" },
    { value: "BNB" },
    { value: "SOL" },
    { value: "TRC" },
  ];

  const handleFileChange = (file) => {
    console.log("Selected file:", file);
  };
  return (
    <React.Fragment>
      <div className="app-modal">
        <div className="backdrop-blur-xl bg-black/10 justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
          <div className="relative w-full mb-6 mt-80 mx-auto max-w-[400px]">
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
                <div className="no-asteric">
                  <InputField
                    label="DApp Name"
                    placeholder="WOW EARN XXXX"
                    className="mb-4"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="mb-4 no-asteric">
                  <FileUpload buttonText="Choose File" onFileChange={handleFileChange} />
                </div>

                <div className="flex items-center flex-wrap md:flex-nowrap gap-4 w-full mb-4">
                  <div className="w-full">
                    <MultiDropdown
                      label="DApp Category"
                      options={dAppCategoryOptions}
                      selectedValues={selectedDAppCategory}
                      onChange={setSelectedDAppCategory}
                      width="w-full"
                    />
                  </div>
                  <div className="w-full">
                    <MultiDropdown
                      label="DApp Network"
                      options={dAppnetworkOptions}
                      selectedValues={selectedDAppNetwork}
                      onChange={setSelectedDAppNetwork}
                      width="w-full"
                    />
                  </div>
                </div>

                <div className="no-asteric">
                  <InputField
                    label="DApp Description"
                    placeholder="Enter description (max 300 characters)"
                    className="mb-4"
                    value={dappDescription}
                    onChange={(e) => setdappDescription(e.target.value)}
                  />
                </div>

                <div>
                  <InputField
                    label="DApp URL *"
                    placeholder="https://"
                    className="mb-4"
                    value={dappURL}
                    onChange={(e) => setdappURL(e.target.value)}
                  />
                </div>

                <div className="flex items-center flex-wrap md:flex-nowrap gap-4 w-full mb-6">
                  <div className="w-full">
                    <Dropdown
                      label="Supported Platform"
                      options={options}
                      selectedValue={selectedValue}
                      onChange={handleSelectionChange}
                      width="w-full"
                    />
                  </div>
                  <div className="w-full no-asteric">
                    <InputField
                      label="Priority Level"
                      placeholder="99"
                      className=" "
                      value={priorityLevel}
                      onChange={(e) => setpriorityLevel(e.target.value)}
                    />
                  </div>
                </div>

                <ReusableButton text="Confirm" className="py-2 px-7" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}