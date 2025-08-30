// OrderPagePrint.jsx  (drop into your project or replace your current file)
import React, { useState, useRef } from "react";
import { Plus, Trash2, Edit } from "lucide-react";
import { DataGrid } from "@mui/x-data-grid";
import { IconButton } from "@mui/material";

export default function OrderPage() {
  const [product, setProduct] = useState("");
  const [orderBy, setOrderBy] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [price, setPrice] = useState("");
  const [addedProducts, setAddedProducts] = useState([]);

  const printRef = useRef(); // reference to printable DOM

  const handleAddProduct = () => {
    if (product && orderBy && quantity && unit && price) {
      const newProduct = { product, orderBy, quantity, unit, price };
      setAddedProducts([...addedProducts, newProduct]);
      setProduct("");
      setOrderBy("");
      setQuantity("");
      setUnit("");
      setPrice("");
    }
  };
  // Edit handler
  const handleEditRow = (row) => {
    // Example: load values into form for editing
    setProduct(row.product);
    setOrderBy(row.orderBy);
    setQuantity(row.quantity);
    setUnit(row.unit);
    setPrice(row.price);

    // Optionally: remove row temporarily so "Save" updates it
    setAddedProducts((prev) => prev.filter((_, index) => index + 1 !== row.id));
  };

  // Delete handler
  const handleDeleteRow = (id) => {
    setAddedProducts((prev) => prev.filter((_, index) => index + 1 !== id));
  };

  // ---------- Printing ----------
  const handlePrint = () => {
    window.print(); // browser print preview — CSS ensures printable area shows only that content
  };

  const totalAmount = addedProducts.reduce(
    (sum, product) => sum + Number(product.price),
    0
  );

  return (
    <div>
      <style>{`
        /* basic page + your previous styles (trimmed) */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *,*::before,*::after { box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; margin:0; background:#f3f4f6; }

        .container { width:100%; max-width:960px; margin:24px auto; background:#fff; border-radius:16px; padding:24px; box-shadow:0 8px 20px rgba(0,0,0,0.06); }
        .header { display:flex; align-items:center; gap:8px; margin-bottom:14px; }
        .header-title { font-size:1.25rem; font-weight:700; margin:0; color:#111827; }

        /* input grid (responsive) */
        .input-grid { display:grid; gap:12px; margin-bottom:12px; }
        @media(min-width:768px){ .input-grid{ grid-template-columns: repeat(6, minmax(0,1fr)); } .col-2 { grid-column: span 2; } .col-1 { grid-column: span 1; } }
        .input-field { width:100%; padding:10px 12px; border-radius:10px; border:1px solid #e6e9ee; outline:none; }
        .add-button { display:inline-flex; gap:8px; align-items:center; justify-content:center; padding:10px 12px; background:#000; color:#fff; border-radius:10px; border:none; cursor:pointer; font-weight:600; }

        /* small helpers */
        .controls { display:flex; gap:50px; margin-bottom:12px; flex-wrap:wrap; }
        .btn-outline { background:#fff; color:#111; border:1px solid #e5e7eb; }
        .btn-primary { background:#0b74ff; color:#fff; border:none; }
        .controls-right { justify-content: flex-end;}


        /* visible table on screen (keeps current UI) */
        .table-container { background:#f9fafb; border-radius:10px; padding:12px; overflow-x:auto; }
        .styled-table { width:100%; border-collapse:collapse; }
        .styled-table th, .styled-table td { padding:8px 10px; border-bottom:1px solid #eaecef; text-align:left; }
        .actions-cell { text-align:right; }

        /* ---------- Printable area (off-screen during normal view) ---------- */
        #export-area {
          display: none;  
          width: 210mm;    
          padding: 18px;
          background: white;
        }
        .print-header { text-align: left; margin-bottom: 12px; }
        .print-title { font-size: 18px; font-weight:700; margin:0; }
        .print-meta { font-size: 12px; color: #6b7280; margin-top:4px; }

        .print-table { width:100%; border-collapse: collapse; margin-top: 8px; }
        .print-table th, .print-table td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
        .print-table th { background: #f3f4f6; font-weight:700; }

        .print-summary { margin-top: 12px; font-weight:700; text-align:right; }

        /* page-break control when printing */
        .print-table tr { page-break-inside: avoid; }
        .print-table thead { display: table-header-group; } /* ensures header repeats on pages */

        /* ---------- Hide everything except export-area in print preview ---------- */
        @media print {
          body * { visibility: hidden !important; }
          #export-area, #export-area * { visibility: visible !important; }
          #export-area { display: block; position: relative; width: auto; margin: 0 auto; }
          /* ensure page margins for printing */
          @page { margin: 12mm; }
        }
      `}</style>

      <div className="container">
        {/* Header */}
        <div className="header">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <circle cx="8" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
          </svg>
          <h1 className="header-title">Order Booking</h1>
        </div>

        {/* Inputs */}
        <div className="input-grid">
          <div className="col-2">
            <select
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              className="input-field"
            >
              <option value="">Select Product</option>
              <option value="Laptop">Laptop</option>
              <option value="Keyboard">Keyboard</option>
              <option value="Mouse">Mouse</option>
              <option value="Monitor">Monitor</option>
            </select>
          </div>

          <div className="col-2">
            <select
              value={orderBy}
              onChange={(e) => setOrderBy(e.target.value)}
              className="input-field"
            >
              <option value="">Select Customer</option>
              <option value="Jane Doe">Jane Doe</option>
              <option value="John Smith">John Smith</option>
              <option value="Alice Johnson">Alice Johnson</option>
              <option value="Bob Williams">Bob Williams</option>
            </select>
          </div>

          <div className="col-1">
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Qty"
              className="input-field"
            />
          </div>

          <div className="col-1">
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="input-field"
            >
              <option value="">Unit</option>
              <option value="Pieces">Pieces</option>
              <option value="Cotton">Cotton</option>
              <option value="Tree">Tree</option>
            </select>
          </div>

          <div className="col-1">
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Price"
              className="input-field"
            />
          </div>
        </div>

        {/* Buttons: Add | Print*/}
        <div className="controls controls-right">
          <button
            onClick={handlePrint}
            className="add-button btn-outline"
            title="Open print preview"
          >
            Print
          </button>
          <button onClick={handleAddProduct} className="add-button">
            <Plus size={16} /> Add Product
          </button>
        </div>

        {/* On-screen table (keeps current UI) */}
        {/* On-screen grid using Material UI */}
        <div style={{ height: 400, width: "100%" }}>
          <DataGrid
            rows={addedProducts.map((item, index) => ({
              id: index + 1,
              product: item.product,
              orderBy: item.orderBy,
              quantity: item.quantity,
              unit: item.unit,
              price: item.price,
            }))}
            columns={[
              { field: "product", headerName: "Product", flex: 1 },
              { field: "orderBy", headerName: "Customer Name", flex: 1 },
              { field: "quantity", headerName: "Qty", width: 100 },
              { field: "unit", headerName: "Unit", width: 120 },
              { field: "price", headerName: "Price", width: 120 },
              { field: "order", headerName: "Order By", width: 70 },
              {
                field: "actions",
                headerName: "Actions",
                width: 150,
                sortable: false,
                renderCell: (params) => (
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <IconButton
                      color="primary"
                      onClick={() => handleEditRow(params.row)}
                    >
                      <Edit size={18} />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteRow(params.row.id)}
                    >
                      <Trash2 size={18} />
                    </IconButton>
                  </div>
                ),
              },
            ]}
            pageSize={5}
            rowsPerPageOptions={[5, 10, 20]}
          />
        </div>
      </div>

      {/* ---------- Printable / PDF area (off-screen during normal browsing) ---------- */}
      <div id="export-area" ref={printRef}>
        <div className="print-header">
          <div>
            <div className="print-title">Order Booking</div>
            <div className="print-meta">
              Generated: {new Date().toLocaleString()}
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 12 }}>
            <div>
              Prepared by: {/* put username if you have it */ "Aftab Foods"}
            </div>
          </div>
        </div>

        <table className="print-table">
          <thead>
            <tr>
              <th style={{ width: "35%" }}>Product</th>
              <th style={{ width: "25%" }}>Customer Name</th>
              <th style={{ width: "10%" }}>Qty</th>
              <th style={{ width: "15%" }}>Unit</th>
              <th style={{ width: "15%" }}>Price</th>
              <th style={{ width: "15%" }}>Order By</th>
            </tr>
          </thead>
          <tbody>
            {addedProducts.length > 0 ? (
              addedProducts.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.product}</td>
                  <td>{item.orderBy}</td>
                  <td style={{ textAlign: "right" }}>{item.quantity}</td>
                  <td style={{ textAlign: "right" }}>{item.unit}</td>
                  <td style={{ textAlign: "right" }}>{item.price}</td>
                  <td style={{ textAlign: "right" }}>{item.order}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: 20 }}>
                  No products
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="print-summary">
          Total items: {addedProducts.length} <br />
          Total amount: {totalAmount.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
