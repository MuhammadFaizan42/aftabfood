// OrderPage.jsx
import React, { useState, useRef, useCallback, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import useMediaQuery from "@mui/material/useMediaQuery";
import { Plus, Trash2, Edit } from "lucide-react";

export default function OrderPage() {
  // inputs
  const [product, setProduct] = useState("");
  const [orderBy, setOrderBy] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [price, setPrice] = useState("");

  // data rows (each row MUST have a unique id for DataGrid)
  const [addedProducts, setAddedProducts] = useState([]);
  const idRef = useRef(1); // simple incremental id generator

  // responsive: detect small screens
  const isSmall = useMediaQuery("(max-width:600px)");

  // column visibility model (controlled). we update on screen-size changes
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});

  useEffect(() => {
    if (isSmall) {
      // hide less-important columns on mobile
      setColumnVisibilityModel({
        orderBy: false,
        unit: false,
        price: false,
      });
    } else {
      // show all columns on larger screens
      setColumnVisibilityModel({
        orderBy: true,
        unit: true,
        price: true,
      });
    }
  }, [isSmall]);

  // add a product (creates a row with unique id)
  const handleAddProduct = () => {
    if (product && orderBy && quantity && unit && price) {
      const newRow = {
        id: idRef.current++,
        product,
        orderBy,
        quantity,
        unit,
        price,
      };
      setAddedProducts((prev) => [...prev, newRow]);
      // clear inputs
      setProduct("");
      setOrderBy("");
      setQuantity("");
      setUnit("");
      setPrice("");
    }
  };

  // remove by id
  const handleRemoveProduct = (id) => {
    setAddedProducts((prev) => prev.filter((r) => r.id !== id));
  };

  // load row into inputs for edit (keeps same Add button UX)
  const handleEditProduct = (id) => {
    const row = addedProducts.find((r) => r.id === id);
    if (!row) return;
    setProduct(row.product);
    setOrderBy(row.orderBy);
    setQuantity(row.quantity);
    setUnit(row.unit);
    setPrice(row.price);
    // remove old row (we will add a new row on Save so ID will change)
    setAddedProducts((prev) => prev.filter((r) => r.id !== id));
  };

  // DataGrid inline edit persistence handler (row editing API)
  // This function is called by DataGrid when a row edit finishes.
  const processRowUpdate = useCallback((newRow) => {
    // Persist the edited row to React state
    setAddedProducts((prev) =>
      prev.map((r) => (r.id === newRow.id ? newRow : r))
    );
    return newRow;
  }, []);

  // columns definition
  const columns = [
    {
      field: "product",
      headerName: "Product",
      flex: 1,
      minWidth: 140,
      editable: true,
    },
    {
      field: "orderBy",
      headerName: "Order By",
      flex: 1,
      minWidth: 140,
      editable: true,
    },
    {
      field: "quantity",
      headerName: "Qty",
      type: "number",
      flex: 0.5,
      minWidth: 90,
      editable: true,
    },
    {
      field: "unit",
      headerName: "Unit",
      flex: 0.6,
      minWidth: 100,
      editable: true,
    },
    {
      field: "price",
      headerName: "Price",
      type: "number",
      flex: 0.6,
      minWidth: 100,
      editable: true,
    },
    {
      field: "actions",
      headerName: "Actions",
      sortable: false,
      filterable: false,
      width: 110,
      renderCell: (params) => {
        const onEdit = (e) => {
          e.stopPropagation();
          handleEditProduct(params.row.id);
        };
        const onDelete = (e) => {
          e.stopPropagation();
          handleRemoveProduct(params.row.id);
        };
        return (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onEdit}
              aria-label="Edit"
              style={{
                background: "transparent",
                border: "none",
                padding: 6,
                cursor: "pointer",
                color: "#2563eb",
              }}
            >
              <Edit size={16} />
            </button>
            <button
              onClick={onDelete}
              aria-label="Delete"
              style={{
                background: "transparent",
                border: "none",
                padding: 6,
                cursor: "pointer",
                color: "#ef4444",
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        );
      },
    },
  ];

  // rows for DataGrid
  const rows = addedProducts;

  return (
    <div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box}
        body { font-family: 'Inter', sans-serif; background-color: #f3f4f6; margin:0; }
        .container {
          width: 100%;
          max-width: 980px;
          margin: 28px auto;
          background: #fff;
          border-radius: 16px;
          padding: 22px;
          box-shadow: 0 10px 15px rgba(0,0,0,0.06);
        }
        .header { display:flex; align-items:center; gap:10px; margin-bottom: 14px; }
        .header-title { font-size: 1.4rem; font-weight:700; color:#111827; margin:0; }
        .input-grid { display:grid; gap:12px; margin-bottom:16px; }
        @media(min-width:768px){
          .input-grid { grid-template-columns: repeat(6, minmax(0,1fr)); }
          .col-2 { grid-column: span 2 / span 2; }
          .col-1 { grid-column: span 1 / span 1; }
        }
        .input-field { width:100%; padding:10px 12px; border-radius:10px; border:1px solid #e5e7eb; outline:none; }
        .input-field:focus{ box-shadow: 0 0 0 3px rgba(59,130,246,0.08); border-color:#3b82f6; }
        .add-button { display:flex; gap:8px; align-items:center; justify-content:center; width:100%; background:#000; color:#fff; padding:10px; border-radius:10px; border:none; cursor:pointer; font-weight:600; }
        .add-button:hover{ background:#111827; }
        /* DataGrid wrapper */
        .grid-wrapper { width:100%; margin-top:12px; background: #f9fafb; border-radius:10px; padding:10px; }
        /* ensure DataGrid cells wrap when narrow */
        .MuiDataGrid-cell { white-space: normal; line-height:1.25; }
        /* small-screen tweaks */
        @media(max-width:600px){
          .container{ padding:14px; border-radius:12px; }
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
          <h2 className="header-title">Order Booking</h2>
        </div>

        {/* Inputs (responsive grid) */}
        <div className="input-grid">
          <div className="col-2">
            <select
              className="input-field"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
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
              className="input-field"
              value={orderBy}
              onChange={(e) => setOrderBy(e.target.value)}
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
              className="input-field"
              placeholder="Qty"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <div className="col-1">
            <select
              className="input-field"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              <option value="">Unit</option>
              <option value="Pieces">Pieces</option>
              <option value="Cotton">Cotton</option>
              <option value="Tree">Tree</option>
            </select>
          </div>

          <div className="col-1">
            <input
              className="input-field"
              placeholder="Price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
        </div>

        {/* Add button */}
        <div style={{ marginBottom: 12 }}>
          <button onClick={handleAddProduct} className="add-button">
            <Plus size={16} /> Add Product
          </button>
        </div>

        {/* DataGrid */}
        <div className="grid-wrapper">
          <DataGrid
            rows={rows}
            columns={columns}
            autoHeight
            density="comfortable"
            pageSizeOptions={[5, 10, 25]}
            initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
            disableRowSelectionOnClick
            processRowUpdate={processRowUpdate}
            onProcessRowUpdateError={(err) =>
              console.error("row update error", err)
            }
            experimentalFeatures={{ newEditingApi: true }}
            columnVisibilityModel={columnVisibilityModel}
            onColumnVisibilityModelChange={(newModel) =>
              setColumnVisibilityModel(newModel)
            }
            sx={{
              ".MuiDataGrid-virtualScroller": { background: "transparent" },
            }}
          />
        </div>
      </div>
    </div>
  );
}
