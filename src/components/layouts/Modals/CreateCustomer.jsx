"use client";
import React, { useState, useEffect } from "react";
import Dropdown from "../../common/Dropdown";
import { getCustomerCategories, createCustomer } from "@/services/shetApi";

export default function CreateCustomer({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    postCode: "",
    town: "",
    contactPerson: "",
    mobile: "",
    category: "",
  });
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    let cancelled = false;
    setCategoriesLoading(true);
    getCustomerCategories()
      .then((res) => {
        if (cancelled) return;
        if (!res?.success) {
          setCategories([]);
          return;
        }
        const raw = res.data;
        const list = Array.isArray(raw) ? raw : raw?.categories ?? raw?.data ?? [];
        const options = list.map((c) => {
          if (typeof c === "string") return { value: c, label: c };
          return { value: c.value ?? c.id ?? c.CATEGORY ?? c.name ?? "", label: c.label ?? c.name ?? c.CATEGORY ?? c.value ?? "" };
        }).filter((o) => o.value);
        setCategories(options);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      })
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false);
      });
    return () => { cancelled = true; };
  }, [isOpen]);

  const handleSave = async () => {
    const { name, address, postCode, town, contactPerson, mobile, category } = formData;
    if (!name?.trim() || !address?.trim() || !postCode?.trim() || !town?.trim() || !contactPerson?.trim() || !mobile?.trim() || !category) {
      setError("All mandatory fields are required.");
      return;
    }
    setError(null);
    setSaveLoading(true);
    try {
      const payload = {
        name: name.trim(),
        post_code: postCode.trim(),
        address: address.trim(),
        town: town.trim(),
        contact_person_name: contactPerson.trim(),
        mobile: mobile.trim(),
        customer_category: category,
      };
      const res = await createCustomer(payload);
      if (!res?.success) {
        setError(res?.message || "Failed to create customer.");
        return;
      }
      setFormData({ name: "", address: "", postCode: "", town: "", contactPerson: "", mobile: "", category: "" });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create customer.");
    } finally {
      setSaveLoading(false);
    }
  };

  if (!isOpen) return null;

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
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
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

          {/* Address Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Street address, area"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
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

          {/* Customer Category – API se fetch (customer.php?category_only=1) */}
          <Dropdown
            label="Customer Category (from ERP)"
            name="category"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            options={categories}
            placeholder={categoriesLoading ? "Loading categories..." : "Select category"}
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
            disabled={saveLoading}
            className="cursor-pointer px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium rounded-lg transition-colors"
          >
            {saveLoading ? "Saving..." : "Save Customer"}
          </button>
        </div>
      </div>
    </div>
  );
}
