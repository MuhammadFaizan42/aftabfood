import React, { useState } from "react";
import { Plus, Trash2, Edit } from "lucide-react";

export default function OrderPage() {
  const [product, setProduct] = useState("");
  const [orderBy, setOrderBy] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [price, setPrice] = useState("");
  const [addedProducts, setAddedProducts] = useState([]);

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

  const handleRemoveProduct = (index) => {
    const updated = addedProducts.filter((_, i) => i !== index);
    setAddedProducts(updated);
  };

  const handleEditProduct = (index) => {
    console.log(`Edit product at index: ${index}`);
  };

  return (
    <div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        body {
          font-family: 'Inter', sans-serif;
          background-color: #f3f4f6;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 1rem;
        }

        .container {
          width: 100%;
          max-width: 960px;
          background-color: #ffffff;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          border-radius: 1.5rem;
          padding: 2.5rem;
        }

        .header {
          display: flex;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .header-title {
          font-size: 1.875rem;
          font-weight: 700;
          color: #1f2937;
        }

        .icon {
          margin-right: 0.5rem;
          color: #4b5563;
        }

        .input-grid {
          display: grid;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        /* Desktop grid (>=768px) */
        @media (min-width: 768px) {
          .input-grid {
            grid-template-columns: repeat(6, minmax(0, 1fr));
          }
          .col-2 { grid-column: span 2 / span 2; }
          .col-1 { grid-column: span 1 / span 1; }
        }

        /* Mobile grid (<768px) — single column */
        @media (max-width: 767px) {
          .input-grid {
            grid-template-columns: 1fr;
          }
        }

        .input-field {
          width: 100%;
          padding: 0.75rem;
          border-width: 1px;
          border-color: #d1d5db;
          border-radius: 0.75rem;
          outline: none;
          transition-property: border-color, box-shadow;
          transition-duration: 300ms;
        }

        .input-field:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
        }

        .add-button {
          width: 100%;
          background-color: #000000;
          color: #ffffff;
          padding: 0.75rem 1.5rem;
          border-radius: 0.75rem;
          font-size: 1.125rem;
          font-weight: 500;
          transition-property: background-color;
          transition-duration: 300ms;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .add-button:hover {
          background-color: #4b5563;
        }

        .table-container {
          background-color: #f9fafb;
          border-radius: 0.75rem;
          padding: 1rem;
          overflow-x: auto;
        }

        .styled-table {
          width: 100%;
          text-align: left;
          border-collapse: collapse;
        }

        .styled-table th {
          padding: 0.5rem;
          font-weight: 600;
          color: #4b5563;
          border-bottom: 1px solid #e5e7eb;
          word-break: break-word;
        }

        .styled-table td {
          padding: 0.75rem 0.5rem;
          color: #1f2937;
          border-bottom: 1px solid #e5e7eb;
          word-break: break-word;
        }

        .styled-table tbody tr:last-child td {
          border-bottom: none;
        }

        .styled-table .actions-cell {
          text-align: right;
        }

        .action-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .action-button {
          padding: 0.5rem;
          border-radius: 9999px;
          transition-property: background-color, color;
          transition-duration: 300ms;
        }

        .edit-button { color: #3b82f6; }
        .edit-button:hover { color: #1d4ed8; background-color: #e5e7eb; }

        .remove-button { color: #ef4444; }
        .remove-button:hover { color: #b91c1c; background-color: #e5e7eb; }

        .empty-row {
          text-align: center;
          padding: 1.5rem;
          color: #6b7280;
          font-style: italic;
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }

        /* Utilities used in JSX */
        .mr-2 { margin-right: 0.5rem; }
        .mb-8 { margin-bottom: 2rem; }

        /* Small screens: transform table rows to cards */
        @media (max-width: 640px) {
          .styled-table thead { display: none; }
          .styled-table tbody tr {
            display: block;
            border: 1px solid #e5e7eb;
            border-radius: 0.75rem;
            padding: 0.75rem;
            margin-bottom: 0.75rem;
            background-color: #fff;
          }
          .styled-table td {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: none;
            padding: 0.5rem 0;
          }
          .styled-table td::before {
            content: attr(data-label);
            font-weight: 600;
            color: #6b7280;
            margin-right: 1rem;
          }
          .styled-table .actions-cell {
            text-align: left;
            justify-content: flex-start;
          }
          .container {
            padding: 1rem;
            border-radius: 1rem;
          }
        }
      `}</style>

      <div className="container">
        {/* Header */}
        <div className="header">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="icon"
          >
            <circle cx="8" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
          </svg>
          <h1 className="header-title">Order Booking</h1>
        </div>

        {/* Inputs */}
        <div className="input-grid">
          {/* Product (2 cols on desktop) */}
          <div className="product-col col-2">
            <label htmlFor="product-select" className="sr-only">
              Select Product
            </label>
            <select
              id="product-select"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              className="input-field"
            >
              <option value="" disabled>
                Select Product
              </option>
              <option value="Laptop">Laptop</option>
              <option value="Keyboard">Keyboard</option>
              <option value="Mouse">Mouse</option>
              <option value="Monitor">Monitor</option>
            </select>
          </div>

          {/* Order By (2 cols on desktop) */}
          <div className="orderby-col col-2">
            <label htmlFor="order-by" className="sr-only">
              Order By
            </label>
            <select
              id="order-by"
              value={orderBy}
              onChange={(e) => setOrderBy(e.target.value)}
              className="input-field"
            >
              <option value="" disabled>
                Select Customer
              </option>
              <option value="Jane Doe">Jane Doe</option>
              <option value="John Smith">John Smith</option>
              <option value="Alice Johnson">Alice Johnson</option>
              <option value="Bob Williams">Bob Williams</option>
            </select>
          </div>

          {/* Qty (1 col on desktop) */}
          <div className="col-1">
            <label htmlFor="quantity" className="sr-only">
              Quantity
            </label>
            <input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Qty"
              className="input-field"
            />
          </div>

          {/* Unit (1 col on desktop) */}
          <div className="col-1">
            <label htmlFor="unit" className="sr-only">
              Unit
            </label>
            <select
              id="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="input-field"
            >
              <option value="" disabled>
                Unit
              </option>
              <option value="Pieces">Pieces</option>
              <option value="Cotton">Cotton</option>
              <option value="Tree">Tree</option>
            </select>
          </div>

          {/* Price (1 col on desktop) */}
          <div className="col-1">
            <label htmlFor="price" className="sr-only">
              Price
            </label>
            <input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Price"
              className="input-field"
            />
          </div>
        </div>

        {/* Add button */}
        <div className="mb-8">
          <button onClick={handleAddProduct} className="add-button">
            <Plus size={20} className="mr-2" /> Add Product
          </button>
        </div>

        {/* Table */}
        <div className="table-container">
          <table className="styled-table">
            <thead>
              <tr>
                <th className="py-2 px-2">Product</th>
                <th className="py-2 px-2">Order By</th>
                <th className="py-2 px-2">Qty</th>
                <th className="py-2 px-2">Unit</th>
                <th className="py-2 px-2">Price</th>
                <th className="py-2 px-2 actions-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {addedProducts.length > 0 ? (
                addedProducts.map((item, index) => (
                  <tr key={index}>
                    <td data-label="Product" className="py-3 px-2">
                      {item.product}
                    </td>
                    <td data-label="Order By" className="py-3 px-2">
                      {item.orderBy}
                    </td>
                    <td data-label="Qty" className="py-3 px-2">
                      {item.quantity}
                    </td>
                    <td data-label="Unit" className="py-3 px-2">
                      {item.unit}
                    </td>
                    <td data-label="Price" className="py-3 px-2">
                      {item.price}
                    </td>
                    <td data-label="Actions" className="py-3 px-2 actions-cell">
                      <div className="action-buttons">
                        <button
                          onClick={() => handleEditProduct(index)}
                          className="action-button edit-button"
                        >
                          <Edit size={20} />
                        </button>
                        <button
                          onClick={() => handleRemoveProduct(index)}
                          className="action-button remove-button"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-row">
                    No products added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
