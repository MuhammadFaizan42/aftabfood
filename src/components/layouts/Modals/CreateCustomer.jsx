"use client";
import React, { useState } from "react";
import Dropdown from "../../common/Dropdown";

export default function CreateCustomer({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    postCode: "",
    town: "",
    contactPerson: "",
    mobile: "",
    category: "",
  });

  if (!isOpen) return null;

  const handleSave = () => {
    // Handle save customer logic here
    console.log("Save customer:", formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-[550px] w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Create New Customer
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Enter the mandatory details to register a new customer
            </p>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Customer Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Post Code and Town */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Post code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="12345"
                value={formData.postCode}
                onChange={(e) =>
                  setFormData({ ...formData, postCode: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Town <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Town / City"
                value={formData.town}
                onChange={(e) =>
                  setFormData({ ...formData, town: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Warning Message */}
          {/* <p className="text-xs text-yellow-600">
            Post code already exists.
          </p> */}

          {/* Contact Person and Mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Person Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Primary contact person"
                value={formData.contactPerson}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contactPerson: e.target.value,
                  })
                }
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="+00 000 000000"
                value={formData.mobile}
                onChange={(e) =>
                  setFormData({ ...formData, mobile: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Customer Category */}
          <Dropdown
            label="Customer Category (from ERP)"
            name="category"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            options={[
              { value: "retail", label: "Retail" },
              { value: "wholesale", label: "Wholesale" },
              { value: "distributor", label: "Distributor" },
            ]}
            placeholder="Select category"
            required
          />

          {/* Mandatory Fields Note */}
          <p className="text-xs text-gray-500 pt-2">
            All fields marked with * are mandatory.
          </p>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="cursor-pointer px-5 py-2.5 text-gray-700 border border-gray-300 font-medium hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="cursor-pointer px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Save Customer
          </button>
        </div>
      </div>
    </div>
  );
}
