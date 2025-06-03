// components/Header.js
"use client";
import React from 'react';
import Link from 'next/link';
import logo from '../assets/images/logo.png';
import EN from '../assets/images/en.svg';
import copy from '../assets/images/copy.svg';
import logout from '../assets/images/logout.svg';
import Image from 'next/image';
import { useState } from 'react';

export default function Header() {
  const [activeNav, setActiveNav] = useState('Home');
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);

  return (
    <header className="bg-[var(--header)] relative z-10 p-4 flex items-center justify-between text-white">
      {/* Left side: Logo + Title */}
      <div className="flex items-center gap-6">
        <div className="flex items-center">
          <Image src={logo} alt="WOW Earn Logo" width={50} height={50} />
          <span className="text-2xl font-bold tracking-wide ml-3">WOW EARN</span>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex gap-2">
          {['Home', 'Minting', 'Withdraw', 'Presale'].map((nav) => (
            <button
              key={nav}
              onClick={() => setActiveNav(nav)}
              className={`py-3 px-5 border-b-2 text-xs cursor-pointer ${activeNav === nav ? 'border-[var(--wow)] font-bold text-[#2EBC84]' : 'border-transparent text-white/50'
                } hover:border-[var(--wow)] transition`}
            >
              {nav}
            </button>
          ))}
        </nav>
      </div>

      {/* Navigation */}
      {/* <nav className="hidden md:flex space-x-8">
        {['Home', 'Minting', 'Withdraw', 'Presale'].map((nav) => (
          <button
            key={nav}
            onClick={() => setActiveNav(nav)}
            className={`font-semibold py-1 border-b-2 ${activeNav === nav ? 'border-[#00FFC2]' : 'border-transparent'
              } hover:border-[#00FFC2] transition`}
          >
            {nav}
          </button>
        ))}
      </nav> */}

      {/* Right side: Invite, Lang selector, Wallet */}
      <div className="hidden md:flex items-center space-x-4">
        {/* Invite button */}
        <button className="border-2 rounded-full border-[var(--wow)] text-sm font-bold px-5 py-2 text-white cursor-pointer hover:bg-[#00FFC2] hover:text-black transition">
          Invite
        </button>
        <div className='h-8 w-[2px] bg-[#F7F9FC]'></div>
        {/* Language selector */}
        <div className="relative">
          <button
            onClick={() => setLangMenuOpen(!langMenuOpen)}
            className="flex items-center space-x-2 text-white hover:text-[var(--wow)] text-base font-bold uppercase focus:outline-none"
          >
            {/* <span className="fi fi-us"></span> */}
            <Image src={EN} width={24} height={24} alt='Media' />
            <span>EN</span>
            <svg
              className={`w-4 h-4 transform transition-transform ${langMenuOpen ? 'rotate-180' : 'rotate-0'
                }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {langMenuOpen && (
            <ul className="absolute right-0 mt-2 bg-black border border-white/50 rounded-[10px] shadow-md z-10 w-24">
              <li className="px-3 py-1 rounded-tl-[10px] rounded-tr-[10px] border-b border-white/50 hover:bg-[var(--wow)] cursor-pointer">EN</li>
              <li className="px-3 py-1 border-b border-white/50 hover:bg-[var(--wow)] cursor-pointer">FR</li>
              <li className="px-3 py-1 rounded-bl-[10px] rounded-br-[10px] hover:bg-[var(--wow)] cursor-pointer">DE</li>
            </ul>
          )}
        </div>

        <button
          className="hidden bg-gradient-to-b border border-[#0157FE] from-[var(--wow)] to-[#026F4B] rounded-full text-sm font-bold px-5 py-2 text-white items-center space-x-2 focus:outline-none"
        >
          Connect Wallet
        </button>

        {/* Wallet dropdown */}
        <div className="relative">
          <button
            onClick={() => setWalletMenuOpen(!walletMenuOpen)}
            className="bg-gradient-to-b border border-[#0157FE] from-[var(--wow)] to-[#026F4B] rounded-full text-sm font-bold px-5 py-2 text-white flex items-center space-x-2 focus:outline-none"
          >
            <span>0x123...456</span>
            <svg
              className={`w-4 h-4 transform transition-transform ${walletMenuOpen ? 'rotate-180' : 'rotate-0'
                }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {walletMenuOpen && (
            <ul className="absolute right-0 mt-2 bg-black border border-white/50 rounded-[10px] shadow-md z-10 w-auto">
              <li className="flex items-center gap-2 border-b rounded-tl-[10px] rounded-tr-[10px] border-white/50 px-3 py-2 hover:bg-[var(--wow)] cursor-pointer">
                0x123...456
                <Image src={copy} alt='Media' width={16} height={16} />
              </li>
              <li className="flex items-center gap-2 px-3 py-2 rounded-bl-[10px] rounded-br-[10px] hover:bg-[var(--wow)] cursor-pointer">
                Disconnect
                <Image src={logout} alt='Media' width={16} height={16} />
              </li>
            </ul>
          )}
        </div>
      </div>

      {/* Mobile hamburger & responsive nav */}
      <MobileNav activeNav={activeNav} setActiveNav={setActiveNav} />
    </header>
  );
}

function MobileNav({ activeNav, setActiveNav }) {
  const [open, setOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden text-white focus:outline-none"
        aria-label="Toggle menu"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {open ? (
            <path strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {open && (
        <nav className="absolute top-full h-[calc(100vh-81px)] left-0 w-full bg-black md:hidden p-4 space-y-4 z-20">
          {/* Nav Links */}
          <div className="space-y-2 border-b border-[var(--wow)] pb-4">
            {['Home', 'Minting', 'Withdraw', 'Presale'].map((nav) => (
              <button
                key={nav}
                onClick={() => {
                  setActiveNav(nav);
                  setOpen(false);
                }}
                className={`block w-full text-center text-xs py-2 border-b-2 ${activeNav === nav ? 'border-[var(--wow)] text-[var(--wow)] font-bold' : 'border-transparent text-white/50'
                  }`}
              >
                {nav}
              </button>
            ))}
          </div>

          {/* Invite Button */}
          <button
            onClick={() => setOpen(false)}
            className="w-full border-2 text-sm font-bold border-[var(--wow)] rounded-full px-5 py-2 text-white hover:bg-[var(--wow)] hover:text-white transition"
          >
            Invite
          </button>

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="w-full flex justify-center gap-2 items-center px-4 py-2 border border-[var(--wow)] rounded-full text-white font-semibold hover:border-[var(--wow)]"
            >
              <Image src={EN} width={24} height={24} alt='Media' />
              <span>EN</span>
              <svg
                className={`w-4 h-4 transform transition-transform ${langMenuOpen ? 'rotate-180' : 'rotate-0'
                  }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {langMenuOpen && (
              <ul className="absolute left-0 right-0 bg-black border border-white/50 rounded-[10px] mt-1 z-30">
                {['EN', 'FR', 'DE'].map((lang) => (
                  <li
                    key={lang}
                    className="px-4 py-2 hover:bg-[var(--wow)] border-b border-white/50 last:border-b-0 cursor-pointer"
                    onClick={() => {
                      setLangMenuOpen(false);
                      setOpen(false);
                    }}
                  >
                    {lang}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            className="hidden bg-gradient-to-b border border-[#0157FE] from-[var(--wow)] to-[#026F4B] rounded-full text-sm font-bold px-5 py-2 text-white items-center space-x-2 focus:outline-none"
          >
            Connect Wallet
          </button>
          {/* Wallet Menu */}
          <div className="relative">
            <button
              onClick={() => setWalletMenuOpen(!walletMenuOpen)}
              className="bg-gradient-to-b w-full justify-center border border-[#0157FE] from-[var(--wow)] to-[#026F4B] rounded-full text-sm font-bold px-5 py-2 text-white flex items-center space-x-2 focus:outline-none"
            >
              <span className='text-white'>0x123...456</span>
              <svg
                className={`w-4 h-4 transform transition-transform ${walletMenuOpen ? 'rotate-180' : 'rotate-0'
                  }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {walletMenuOpen && (
              <ul className="absolute w-full left-0 right-0 bg-black border border-white/50 rounded-[10px] mt-1 z-30">
                <li
                  className="flex items-center justify-center gap-2 border-b border-white/50 px-4 py-2 hover:bg-[var(--wow)] cursor-pointer"
                  onClick={() => {
                    setWalletMenuOpen(false);
                    setOpen(false);
                  }}
                >
                  0x123...456
                  <Image src={copy} alt='Media' width={16} height={16} />
                </li>
                <li
                  className="flex items-center justify-center gap-2 px-4 py-2 hover:bg-[var(--wow)] cursor-pointer"
                  onClick={() => {
                    setWalletMenuOpen(false);
                    setOpen(false);
                    // add disconnect logic here
                  }}
                >
                  Disconnect
                  <Image src={logout} alt='Media' width={16} height={16} />
                </li>
              </ul>
            )}
          </div>
        </nav>
      )}
    </>
  );
}

