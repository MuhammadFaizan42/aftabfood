// components/Tabs.js
import { useState } from "react";

export default function Tabs({ tabs }) {
  const [activeTab, setActiveTab] = useState(0); // Default active tab is 0

  return (
    <div className="w-full mx-auto mb-6">
      <div className="flex space-x-4 border-b border-gray-200">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`py-2 px-4 text-base cursor-pointer transition-all duration-200 ${activeTab === index ? 'font-bold border-b-2 border-[var(--wow)] text-[var(--wow)]' : 'text-white/50 hover:text-[var(--wow)]'}`}
            onClick={() => setActiveTab(index)}
          >
            {tab.tabName}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tabs[activeTab]?.content}
      </div>
    </div>
  );
}
