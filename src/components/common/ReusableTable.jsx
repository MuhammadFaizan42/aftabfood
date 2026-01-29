"use client";
import React, { useState } from "react";

export default function ReusableTable({
  columns,
  data,
  rowsPerPage = 5,
  totalAmount = null,
  totalLabel = "Total Amount",
  showPagination = true
}) {
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
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Table Container with Horizontal Scroll */}
      <div className="overflow-x-auto table-scroll" style={{ scrollbarWidth: 'thin', scrollbarColor: '#94a3b8 #f1f5f9' }}>
        <table style={{ minWidth: columns.reduce((acc, col) => acc + (parseInt(col.minWidth) || 120), 0) + 'px', width: '100%', borderCollapse: 'collapse' }}>
          {/* Table Header */}
          <thead className="bg-blue-50 border-b border-gray-200">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.accessor}
                  className="text-sm font-semibold text-blue-700 whitespace-nowrap text-left px-4 py-4"
                  style={{ minWidth: col.minWidth || '100px', width: col.width || 'auto' }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-gray-200">
            {paginatedData.map((row, idx) => (
              <tr
                key={idx}
                className="hover:bg-gray-50 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.accessor}
                    className="text-sm px-4 py-4"
                    style={{ minWidth: col.minWidth || '100px', width: col.width || 'auto' }}
                  >
                    {col.render ? col.render(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total Section */}
      {totalAmount !== null && (
        <div className="bg-blue-50 border-t border-gray-200 px-6 py-4">
          <div className="flex justify-end items-center space-x-4">
            <span className="text-sm font-medium text-gray-600">
              {totalLabel}:
            </span>
            <span className="text-xl font-bold text-gray-900">
              {totalAmount}
            </span>
          </div>
        </div>
      )}

      {/* Pagination */}
      {showPagination && (
        <div className="border-t border-gray-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-600">
            Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, data.length)} of {data.length} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            {/* Page numbers */}
            <div className="flex items-center space-x-1">
              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                if (page === 1 || page === totalPages || Math.abs(currentPage - page) <= 1) {
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 rounded-lg transition-colors ${page === currentPage
                        ? "bg-blue-600 text-white font-semibold"
                        : "text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                      {page}
                    </button>
                  );
                }
                if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="px-2 text-gray-500">...</span>;
                }
                return null;
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
