"use client";
import React from "react";
import UnlockModal from "../../components/layouts/Modals/UnlockPartner";
import Header from "../../components/common/Header";
export default function DashboardPage() {

  const [showModal, setShowModal] = React.useState(false);
  return (
    <div>
      <Header />
      {showModal && <UnlockModal setShowModal={setShowModal} />}
      <h1 className="text-3xl font-bold underline">Hello world!</h1>
      <button onClick={() => setShowModal(true)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Button
      </button>
    </div>
  );
}