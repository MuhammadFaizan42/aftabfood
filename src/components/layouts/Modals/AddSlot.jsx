import React from "react";
import { useState } from 'react';
import { CloseIcon } from '../../assets'
import ReusableButton from "../../common/Button";
import InputField from "../../common/InputField";

export default function AddSlotModal({ setShowAddSlotModal }) {
  const [name, setName] = useState("");

  return (
    <React.Fragment>
      <div className="app-modal">
        <div className="backdrop-blur-xl bg-black/10 justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
          <div className="relative w-full my-6 mx-auto max-w-[400px]">
            {/*content*/}
            <div className="popup-style p-6 max-[768px]:w-[95%] mx-auto rounded-2xl relative flex flex-col w-full">
              {/*header*/}
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-[18px] font-semibold">Add Recommended Slot</h1>
                <button
                  className="close-modal cursor-pointer"
                  onClick={() => setShowAddSlotModal(false)}
                >
                  <CloseIcon />
                </button>
              </div>
              {/*body*/}
              <div className="relative flex-auto no-asteric">
                <InputField
                  label="Slot Name"
                  placeholder="Enter slot name..."
                  className="mb-6"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <ReusableButton text="Save" className="py-2 px-7" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}