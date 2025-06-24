"use client";
import { useState } from 'react';
import React from 'react';
import Link from 'next/link';
import logo from '../assets/images/logo.png';
import Dashboard from '../assets/images/dashboard.svg';
import DownArrow from '../assets/images/DownArrow.svg';
import Configuration from '../assets/images/configuration.svg';
import Ad from '../assets/images/ad.svg';
import sms from '../assets/images/sms.svg';
import Update from '../assets/images/update.svg';
import Calendar from '../assets/images/calendar.svg';
import Data from '../assets/images/data.svg';
import System from '../assets/images/system.svg';
import UpArrow from '../assets/images/UpArrow.svg';
import UserList from '../assets/images/UserList.svg';
import EN from '../assets/images/en.svg';
import Image from 'next/image';

export default function Sidebar({ isOpen, toggleSidebar }) {
  const [langOpen, setLangOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [openSections, setOpenSections] = useState({
    siteMessage: false,
    versionUpdate: false,
    eventPlatform: false,
    config: false,
    adSlot: false,
    dataManagement: false,
    system: false,
  }); // State for tracking which section is open

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    })); // Toggle specific section
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-20 bg-black/10 backdrop-blur-xl lg:hidden transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        onClick={toggleSidebar}
      ></div>

      <aside
        className={`fixed top-0 left-0 h-screen bg-black/10 backdrop-blur-xl border-r border-white/50 w-[280px] text-white z-30 transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:sticky lg:flex-shrink-0 flex flex-col`}
      >
        <div className="flex items-center justify-center gap-3 px-6 py-5">
          <Image src={logo} width={50} height={50} alt="Media" />
          <span className="font-bold text-2xl">WOW EARN</span>
        </div>

        <nav className="flex flex-col mt-6 space-y-2 px-4 h-[calc(100vh-122px)] overflow-y-auto">
          {/* Collapsible Site Message */}
          <div className="flex flex-col">
            <button
              onClick={() => toggleSection('siteMessage')} // Toggle the collapsible state for Configuration
              className="flex items-center cursor-pointer gap-2 px-4 py-2 text-sm font-medium rounded-md hover:bg-[var(--wow)] transition-colors"
            >
              <Image src={sms} width={24} height={24} alt="Site Message" />
              Site Message
              <span className="ml-auto">
                <Image
                  src={openSections.siteMessage ? UpArrow : DownArrow}
                  width={24}
                  height={24}
                  alt="Toggle Arrow"
                />
              </span>
            </button>

            {/* Collapsible Links with smooth transition */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${openSections.siteMessage ? 'max-h-[1000px]' : 'max-h-0'}`}
            >
              {openSections.siteMessage && (
                <>
                  <Link
                    href="/dapp-management"
                    className="flex items-center gap-2 pl-12 pr-4 py-2.5 text-sm font-medium rounded-md hover:text-[var(--wow)] hover:bg-[var(--collapse)]/10 transition-colors cursor-pointer mb-1"
                  >
                    Site Message
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Collapsible Version Update */}
          <div className="flex flex-col">
            <button
              onClick={() => toggleSection('versionUpdate')} // Toggle the collapsible state for Configuration
              className="flex items-center cursor-pointer gap-2 px-4 py-2 text-sm font-medium rounded-md hover:bg-[var(--wow)] transition-colors"
            >
              <Image src={Update} width={24} height={24} alt="Version Update" />
              Version Update
              <span className="ml-auto">
                <Image
                  src={openSections.versionUpdate ? UpArrow : DownArrow}
                  width={24}
                  height={24}
                  alt="Toggle Arrow"
                />
              </span>
            </button>

            {/* Collapsible Links with smooth transition */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${openSections.versionUpdate ? 'max-h-[1000px]' : 'max-h-0'}`}
            >
              {openSections.versionUpdate && (
                <>
                  <Link
                    href="/dapp-management"
                    className="flex items-center gap-2 pl-12 pr-4 py-2.5 text-sm font-medium rounded-md hover:text-[var(--wow)] hover:bg-[var(--collapse)]/10 transition-colors cursor-pointer mb-1"
                  >
                    Version Update
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Collapsible Event Platform */}
          <div className="flex flex-col">
            <button
              onClick={() => toggleSection('eventPlatform')} // Toggle the collapsible state for Configuration
              className="flex items-center cursor-pointer gap-2 px-4 py-2 text-sm font-medium rounded-md hover:bg-[var(--wow)] transition-colors"
            >
              <Image src={Calendar} width={24} height={24} alt="Event Platform" />
              Event Platform
              <span className="ml-auto">
                <Image
                  src={openSections.eventPlatform ? UpArrow : DownArrow}
                  width={24}
                  height={24}
                  alt="Toggle Arrow"
                />
              </span>
            </button>

            {/* Collapsible Links with smooth transition */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${openSections.eventPlatform ? 'max-h-[1000px]' : 'max-h-0'}`}
            >
              {openSections.eventPlatform && (
                <>
                  <Link
                    href="/dapp-management"
                    className="flex items-center gap-2 pl-12 pr-4 py-2.5 text-sm font-medium rounded-md hover:text-[var(--wow)] hover:bg-[var(--collapse)]/10 transition-colors cursor-pointer mb-1"
                  >
                    Event Platform
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Collapsible Configuration */}
          <div className="flex flex-col">
            <button
              onClick={() => toggleSection('config')} // Toggle the collapsible state for Configuration
              className="flex items-center cursor-pointer gap-2 px-4 py-2 text-sm font-medium rounded-md hover:bg-[var(--wow)] transition-colors"
            >
              <Image src={Configuration} width={24} height={24} alt="Configuration" />
              Configuration
              <span className="ml-auto">
                <Image
                  src={openSections.config ? UpArrow : DownArrow}
                  width={24}
                  height={24}
                  alt="Toggle Arrow"
                />
              </span>
            </button>

            {/* Collapsible Links with smooth transition */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${openSections.config ? 'max-h-[1000px]' : 'max-h-0'}`}
            >
              {openSections.config && (
                <>
                  <Link
                    href="/configuration/dappmanagement"
                    className="flex items-center gap-2 pl-12 pr-4 py-2.5 text-sm font-medium rounded-md hover:text-[var(--wow)] hover:bg-[var(--collapse)]/10 transition-colors cursor-pointer mb-1"
                  >
                    DApp Management
                  </Link>
                  <Link
                    href="/configuration/tokenmanagement"
                    className="flex items-center gap-2 pl-12 pr-4 py-2.5 text-sm font-medium rounded-md hover:text-[var(--wow)] hover:bg-[var(--collapse)]/10 transition-colors cursor-pointer mb-1"
                  >
                    Token Management
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Collapsible Ad Slot Management */}
          <div className="flex flex-col">
            <button
              onClick={() => toggleSection('adSlot')} // Toggle the collapsible state for Ad Slot Management
              className="flex items-center cursor-pointer gap-2 px-4 py-2 text-sm font-medium rounded-md hover:bg-[var(--wow)] transition-colors"
            >
              <Image src={Ad} width={24} height={24} alt="Ad" />
              Ad Slot Management
              <span className="ml-auto">
                <Image
                  src={openSections.adSlot ? UpArrow : DownArrow}
                  width={24}
                  height={24}
                  alt="Toggle Arrow"
                />
              </span>
            </button>

            {/* Collapsible Links with smooth transition */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${openSections.adSlot ? 'max-h-[1000px]' : 'max-h-0'}`}
            >
              {openSections.adSlot && (
                <>
                  <Link
                    href="/admanagement/adslotmanagement"
                    className="flex items-center gap-2 pl-12 pr-4 py-2.5 text-sm font-medium rounded-md hover:text-[var(--wow)] hover:bg-[var(--collapse)]/10 transition-all duration-200 cursor-pointer mb-1"
                  >
                    Ad Slot Management
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Collapsible Data Dashboard */}
          <div className="flex flex-col">
            <button
              onClick={() => toggleSection('dataManagement')} // Toggle the collapsible state for Ad Slot Management
              className="flex items-center cursor-pointer gap-2 px-4 py-2 text-sm font-medium rounded-md hover:bg-[var(--wow)] transition-colors"
            >
              <Image src={Data} width={24} height={24} alt="Data" />
              Data Dashboard
              <span className="ml-auto">
                <Image
                  src={openSections.dataManagement ? UpArrow : DownArrow}
                  width={24}
                  height={24}
                  alt="Toggle Arrow"
                />
              </span>
            </button>

            {/* Collapsible Links with smooth transition */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${openSections.dataManagement ? 'max-h-[1000px]' : 'max-h-0'}`}
            >
              {openSections.dataManagement && (
                <>
                  <Link
                    href="/ad-management"
                    className="flex items-center gap-2 pl-12 pr-4 py-2.5 text-sm font-medium rounded-md hover:text-[var(--wow)] hover:bg-[var(--collapse)]/10 transition-colors cursor-pointer mb-1"
                  >
                    Data Management
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Collapsible System */}
          <div className="flex flex-col">
            <button
              onClick={() => toggleSection('system')} // Toggle the collapsible state for Ad Slot Management
              className="flex items-center cursor-pointer gap-2 px-4 py-2 text-sm font-medium rounded-md hover:bg-[var(--wow)] transition-colors"
            >
              <Image src={System} width={24} height={24} alt="System" />
              System
              <span className="ml-auto">
                <Image
                  src={openSections.system ? UpArrow : DownArrow}
                  width={24}
                  height={24}
                  alt="Toggle Arrow"
                />
              </span>
            </button>

            {/* Collapsible Links with smooth transition */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${openSections.system ? 'max-h-[1000px]' : 'max-h-0'}`}
            >
              {openSections.system && (
                <>
                  <Link
                    href="/ad-management"
                    className="flex items-center gap-2 pl-12 pr-4 py-2.5 text-sm font-medium rounded-md hover:text-[var(--wow)] hover:bg-[var(--collapse)]/10 transition-colors cursor-pointer mb-1"
                  >
                    System
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="w-full h-[1px] bg-white/50 mt-3"></div>

          {/* Language Selection */}
          <div className="relative w-full block md:hidden">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex w-full justify-between cursor-pointer items-center space-x-2 text-white hover:text-[var(--wow)] text-base font-bold uppercase focus:outline-none"
            >
              <div className="flex items-center gap-2">
                <Image src={EN} width={24} height={24} alt="Media" />
                <span>EN</span>
              </div>
              <svg
                className={`w-4 h-4 transform transition-transform ${langMenuOpen ? 'rotate-180' : 'rotate-0'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {langMenuOpen && (
              <ul className="w-full absolute right-0 mt-2 bg-black border border-white/50 rounded-[10px] shadow-md z-10">
                <li className="px-3 py-1 rounded-tl-[10px] rounded-tr-[10px] border-b border-white/50 hover:bg-[var(--wow)] cursor-pointer">EN</li>
                <li className="px-3 py-1 border-b border-white/50 hover:bg-[var(--wow)] cursor-pointer">FR</li>
                <li className="px-3 py-1 rounded-bl-[10px] rounded-br-[10px] hover:bg-[var(--wow)] cursor-pointer">DE</li>
              </ul>
            )}
          </div>

          <div className="text-base font-bold mt-1 block md:hidden">Admin</div>
        </nav>

      </aside>
    </>
  );
}
