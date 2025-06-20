"use client";
import React, { useState } from "react";

export default function ReusableTable({ columns, data, rowsPerPage = 5 }) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / rowsPerPage);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Slice data for current page
  const paginatedData = data.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="table-container">
      <div className="overflow-x-auto">
        <table className="w-full border border-[#f5f5f5]/[0.16] rounded-xl border-separate border-spacing-0 backdrop-blur-xl">
          <thead className="">
            <tr>
              {columns.map((col) => (
                <th key={col.accessor} className="relative px-4 py-[18px] text-left text-xs font-bold first:rounded-tl-xl bg-white/20 backdrop-blur-xl last:rounded-tr-xl word-break-all">
                  <p className="t-head">{col.header}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, idx) => (
              <tr
                key={idx}
                className="backdrop-blur-xl"
                style={{
                  backgroundColor: idx % 2 === 0 ? "rgba(255, 255, 255, 0)" : "rgba(255, 255, 255, 0.1)",
                }}
              >
                {columns.map((col) => (
                  <td key={col.accessor} className="px-4 py-2 word-break-all text-xs font-medium">
                    {row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="my-4 flex justify-between items-center">
        <div className="text-sm font-medium">Showing {paginatedData.length} results</div>
        <div>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              marginRight: 8,
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              backgroundColor: "transparent",
              border: "none",
              color: currentPage === 1 ? "#555" : "#fff",
            }}
          >
            &lt;
          </button>

          {/* Simple page numbers */}
          {[...Array(totalPages)].map((_, i) => {
            const page = i + 1;
            if (page === 1 || page === totalPages || Math.abs(currentPage - page) <= 1) {
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  style={{
                    margin: "0 4px",
                    fontWeight: page === currentPage ? "bold" : "normal",
                    cursor: "pointer",
                    backgroundColor: "transparent",
                    fontSize: "14px",
                    border: "none",
                    color: page === currentPage ? "#0f9" : "#fff",
                  }}
                >
                  {page}
                </button>
              );
            }
            if (page === currentPage - 2 || page === currentPage + 2) {
              return <span key={page} style={{ margin: "0 4px" }}>...</span>;
            }
            return null;
          })}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{
              marginLeft: 8,
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              backgroundColor: "transparent",
              border: "none",
              color: currentPage === totalPages ? "#555" : "#fff",
            }}
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
}
