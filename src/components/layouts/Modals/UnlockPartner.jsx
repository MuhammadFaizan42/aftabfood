import React from "react";
import Link from "next/link";
// import { IMG } from "@/assests/images";
import Image from "next/image";

export default function UnlockModal({ setShowModal }) {
  return (
    <React.Fragment>
      {/* Get the app Modal Starts Here */}
      <div className="app-modal">
        <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
          <div className="relative w-auto my-6 mx-auto max-w-3xl">
            {/*content*/}
            <div className="max-[768px]:w-[95%] mx-auto border-0 rounded-2xl shadow-2xl relative flex flex-col w-full bg-[#2d2d2d] outline-none focus:outline-none">
              {/*header*/}
              <div className="flex items-start justify-end px-[20px] py-3 rounded-t">
                <button
                  className="close-modal rounded-full bg-slate-800 hover:bg-slate-700 p-2"
                  onClick={() => setShowModal(false)}
                >
                  <svg
                    className="GetTheAppModal__CloseIcon-sc-eef42c6b-2 ewJRTo"
                    fill="white"
                    height="24"
                    stroke="white"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="24"
                  >
                    <line x1="18" x2="6" y1="6" y2="18" />
                    <line x1="6" x2="18" y1="6" y2="18" />
                  </svg>
                </button>
              </div>
              {/*body*/}
              <div className="relative px-9 pb-9 flex-auto">
                <h1 className="text-center text-2xl font-semibold m-0">
                  Download the WOW EARN app
                </h1>
                <p className="mt-1 mb-3 text-sm text-center leading-relaxed text-white">
                  Scan the QR code with your phone to download the wow earn app
                </p>
                <div className="flex justify-center mt-6 mb-9">
                  {/* <Image
                    alt=""
                    src={IMG.download}
                    width={144}
                    height={144}
                    className="w-36 rounded-xl"
                  /> */}
                </div>

                <div className="flex gap-4 justify-center">
                  <Link className="block" href="">
                    {/* <Image
                      alt=""
                      src={IMG.apple}
                      width={144}
                      height={144}
                      className="w-36"
                    /> */}
                  </Link>

                  <Link className="blocl" href="">
                    {/* <Image
                      alt=""
                      src={IMG.play}
                      width={144}
                      height={144}
                      className="w-36"
                    /> */}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
      </div>
      {/* Get the app Modal Starts Here */}
    </React.Fragment>
  );
}
