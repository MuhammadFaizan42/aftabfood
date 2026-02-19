"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "../../components/common/Header";
import Dropdown from "../../components/common/Dropdown";
import Image from "next/image";
import TwoGrid from "../../components/assets/images/two-grid.svg";
import FourGrid from "../../components/assets/images/four-grid.svg";
import { getProducts, addToCart, updateCartItem, removeCartItem } from "@/services/shetApi";
import { getSaleOrderPartyCode, getCartTrnsId, setCartTrnsId, clearCartTrnsId } from "@/lib/api";

const DEFAULT_PRODUCT_IMAGE = "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=400&fit=crop";

function mapApiProduct(p) {
  // IDs / basic fields as per your API shape
  const id =
    p.PK_INV_ID ??
    p.PK_ID ??
    p.PRODUCT_ID ??
    p.id ??
    p.SKU ??
    String(Math.random());

  const name = p.PRODUCT_NAME ?? p.ITEM_NAME ?? p.name ?? "—";
  const sku = p.PRODUCT_ID ?? p.SKU ?? p.PRODUCT_CODE ?? p.CODE ?? "";
  const category = p.CATEGORY ?? p.category ?? "";

  // ITEM_RATE aa raha hai string me (e.g. "1") – usko number banayen
  const itemRateNumber = Number(p.ITEM_RATE ?? 0) || 0;
  // UI ke liye 2-decimal string with £, jaise screenshot me
  const priceDisplay = `£${itemRateNumber.toFixed(2)}`;

  const unitMeasure =
    p.UOM ??
    p.UNIT_OF_MEASURE ??
    p.UOM_DESC ??
    p.PER_VAL ??
    p.UNIT ??
    p.unitOfMeasure ??
    "Unit";

  const stockVal = p.STOCK ?? p.QTY ?? p.stock ?? 0;
  const stock = Number(stockVal) || 0;

  // Prefer IMAGE_URL from API, then other possible image fields
  const img =
    p.IMAGE_URL ??
    p.IMAGE ??
    p.PIC ??
    p.IMG ??
    p.image ??
    "";

  return {
    id,
    name,
    description: p.DESCRIPTION
      ? `${p.DESCRIPTION} • SKU: ${sku}`
      : sku
        ? `SKU: ${sku}`
        : "",
    // UI me dikhne wala price
    price: priceDisplay,
    // Unit price controls bhi isi ko use karen
    unitPrice: priceDisplay,
    // Saath me clean numeric ITEM_RATE bhi expose kar dein
    itemRate: itemRateNumber,
    unitOfMeasure: unitMeasure,
    image: img && img.trim() ? img.trim() : DEFAULT_PRODUCT_IMAGE,
    sku,
    inStock: stock > 0,
    category,
    stock,
    _raw: p,
  };
}

export default function Products() {
  const router = useRouter();
  const [categories, setCategories] = useState(["All Items"]);
  const [activeCategory, setActiveCategory] = useState("All Items");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTwoColumnView, setIsTwoColumnView] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [productQuantities, setProductQuantities] = useState({});
  const [editablePrices, setEditablePrices] = useState({});
  const [selectedUnits, setSelectedUnits] = useState({});
  const [editingPrice, setEditingPrice] = useState(null);
  const [productComments, setProductComments] = useState({});
  const [cartApiLoadingId, setCartApiLoadingId] = useState(null);
  const [cartApiError, setCartApiError] = useState(null);
  const [partyCode, setPartyCode] = useState(null);

  useEffect(() => {
    setPartyCode(getSaleOrderPartyCode());
  }, []);

  const fetchProducts = useCallback(async (opts = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        limit: 100,
        ...(opts.category && opts.category !== "All Items" && { category: opts.category }),
        ...(opts.search && { search: opts.search }),
      };
      const res = await getProducts(params);
      if (!res?.success || !Array.isArray(res.data)) {
        setProducts([]);
        return [];
      }
      const mapped = res.data.map(mapApiProduct);
      setProducts(mapped);
      return mapped;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products.");
      setProducts([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await fetchProducts({
        category: activeCategory === "All Items" ? undefined : activeCategory,
        search: searchQuery || undefined,
      });
      if (cancelled) return;
      if (list.length && activeCategory === "All Items" && categories.length <= 1) {
        const cats = ["All Items", ...new Set(list.map((p) => p.category).filter(Boolean))];
        setCategories(cats);
      }
    })();
    return () => { cancelled = true; };
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const q = products.reduce((acc, p) => ({ ...acc, [p.id]: productQuantities[p.id] ?? 0 }), {});
    const p = products.reduce((acc, p) => ({ ...acc, [p.id]: editablePrices[p.id] ?? p.price }), {});
    const u = products.reduce((acc, p) => ({ ...acc, [p.id]: selectedUnits[p.id] ?? p.unitOfMeasure }), {});
    const c = products.reduce((acc, p) => ({ ...acc, [p.id]: productComments[p.id] ?? "" }), {});
    setProductQuantities((prev) => ({ ...q, ...prev }));
    setEditablePrices((prev) => ({ ...p, ...prev }));
    setSelectedUnits((prev) => ({ ...u, ...prev }));
    setProductComments((prev) => ({ ...c, ...prev }));
  }, [products]);

  const filteredProducts = products;

  const handleQuantityChange = (productId, delta) => {
    setProductQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] || 0) + delta),
    }));
  };

  const handlePriceEdit = (productId, newPrice) => {
    setEditablePrices((prev) => ({
      ...prev,
      [productId]: newPrice,
    }));
  };

  const togglePriceEdit = (productId) => {
    setEditingPrice(editingPrice === productId ? null : productId);
  };

  /** Backend ko item_id me PRODUCT_ID (sku) bhejte hain */
  const getItemIdForApi = (p) => (p && (p.sku || p._raw?.PRODUCT_ID)) || String(p?.id ?? "");

  /** "£2.00" / "2.00" se number nikaalna */
  const parseUnitPrice = (priceStr, fallbackNum = 0) => {
    if (priceStr == null) return fallbackNum;
    const s = String(priceStr).replace(/[^\d.-]/g, "").trim();
    const n = Number(s);
    return Number.isNaN(n) ? fallbackNum : n;
  };

  const getAddToCartPayload = (product) => {
    const productId = product.id;
    const currentPriceStr = editablePrices[productId] ?? product.price;
    return {
      unit_price: parseUnitPrice(currentPriceStr, product.itemRate ?? 0),
      uom: selectedUnits[productId] ?? product.unitOfMeasure ?? "",
      comments: productComments[productId] ?? "",
    };
  };

  const handleAddToCart = async (product) => {
    const productId = product.id;
    const itemIdForApi = getItemIdForApi(product);
    const quantity = productQuantities[productId];
    if (quantity <= 0 || !partyCode) return;
    setCartApiError(null);
    setCartApiLoadingId(productId);
    try {
      const trnsId = getCartTrnsId();
      const opts = getAddToCartPayload(product);
      const res = await addToCart(partyCode, itemIdForApi, quantity, trnsId || undefined, opts);
      const newTrnsId = res?.data?.trns_id ?? res?.trns_id;
      if (newTrnsId) setCartTrnsId(newTrnsId);
      setCartItems((prev) => {
        const existing = prev.find((item) => item.id === productId);
        if (existing) {
          return prev.map((item) =>
            item.id === productId ? { ...item, quantity: existing.quantity + quantity } : item
          );
        }
        return [...prev, { id: productId, quantity }];
      });
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : "Failed to add to cart.";
      if (rawMessage.toLowerCase().includes("only draft orders can be edited")) {
        clearCartTrnsId();
        setCartApiError(
          "This order has already been submitted and can no longer be edited. Please start a new order from the customer dashboard."
        );
      } else {
        setCartApiError(rawMessage);
      }
    } finally {
      setCartApiLoadingId(null);
    }
  };

  const handleUpdateCart = async (product) => {
    const productId = product.id;
    const itemIdForApi = getItemIdForApi(product);
    const quantity = productQuantities[productId];
    const trnsId = getCartTrnsId();
    if (quantity <= 0 && !trnsId) return;
    setCartApiError(null);
    setCartApiLoadingId(productId);
    try {
      if (quantity === 0 && trnsId) {
        await removeCartItem(trnsId, itemIdForApi);
        setCartItems((prev) => prev.filter((item) => item.id !== productId));
      } else if (quantity > 0) {
        const opts = getAddToCartPayload(product);
        const res = await addToCart(partyCode, itemIdForApi, quantity, trnsId || undefined, opts);
        const newTrnsId = res?.data?.trns_id ?? res?.trns_id;
        if (newTrnsId) setCartTrnsId(newTrnsId);
        setCartItems((prev) => {
          const existing = prev.find((item) => item.id === productId);
          if (existing) {
            return prev.map((item) =>
              item.id === productId ? { ...item, quantity } : item
            );
          }
          return [...prev, { id: productId, quantity }];
        });
      }
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : "Failed to update cart.";
      if (rawMessage.toLowerCase().includes("only draft orders can be edited")) {
        clearCartTrnsId();
        setCartApiError(
          "This order has already been submitted and can no longer be edited. Please start a new order from the customer dashboard."
        );
      } else {
        setCartApiError(rawMessage);
      }
    } finally {
      setCartApiLoadingId(null);
    }
  };

  const getTotalCartItems = () => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  };

  const isCartEmpty = cartItems.length === 0;

  if (partyCode === null) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800 text-sm">
            Loading...
          </div>
        </main>
      </div>
    );
  }

  if (!partyCode) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800 text-sm mb-4">
            No customer selected. Please start from Customer Dashboard and click &quot;New Order&quot;.
          </div>
          <Link href="/new-order" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800">
            Select Customer
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Header Section */}
        <div className="mb-6">
          <Link
            href={partyCode ? `/customer-dashboard?party_code=${encodeURIComponent(partyCode)}` : "/customer-dashboard"}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            New Order
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Browse and add products to your cart
          </p>
        </div>

        {/* Category Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === category
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar – search by name or code (API search param) */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full h-11 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm mb-6">
            {error}
          </div>
        )}
        {cartApiError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm mb-6">
            {cartApiError}
          </div>
        )}

        {loading && (
          <div className="text-center py-12 text-gray-500">Loading products...</div>
        )}

        {/* Change Grid Layout */}
        <div className="hidden sm:flex gap-2 items-end mb-3 justify-end">
          <button
            onClick={() => setIsTwoColumnView(!isTwoColumnView)}
            className="cursor-pointer bg-gray-300 hover:bg-gray-400 transition-colors flex items-center justify-center w-12 h-12 rounded-md"
          >
            <Image
              src={isTwoColumnView ? FourGrid : TwoGrid}
              alt="Toggle Grid View"
              width={30}
              height={30}
            />
          </button>
        </div>

        {/* Products Grid */}
        {!loading && (
        <div className={`grid grid-cols-1 gap-6 ${isTwoColumnView
          ? 'sm:grid-cols-1 lg:grid-cols-2'
          : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          }`}>
          {filteredProducts.map((product) => {
            const quantity = productQuantities[product.id] || 0;
            const hasQuantity = quantity > 0;
            const isEditingPrice = editingPrice === product.id;
            const currentPrice = editablePrices[product.id] || product.price;

            return (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Product Image – show full image, no cropping */}
                <div className="relative h-48 bg-white border-b border-gray-200 overflow-hidden flex items-center justify-center">
                  <img
                    src={product.image || DEFAULT_PRODUCT_IMAGE}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = DEFAULT_PRODUCT_IMAGE;
                    }}
                  />
                </div>

                {/* Product Details */}
                <div className="p-4">
                  {/* Product Header */}
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-base font-semibold text-gray-900 flex-1">
                      {product.name}
                    </h3>
                    <span className="text-lg font-bold text-blue-600 ml-2">
                      {currentPrice}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 mb-1">
                    {product.description}
                  </p>
                  <p className="text-xs text-gray-500 mb-2">
                    Stock: {product.stock} units available
                  </p>

                  {/* Unit Price */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-400 mb-1">Unit Price</p>
                    <div className="flex items-center justify-between">
                      {isEditingPrice ? (
                        <input
                          type="text"
                          value={currentPrice}
                          onChange={(e) => handlePriceEdit(product.id, e.target.value)}
                          onBlur={() => setEditingPrice(null)}
                          className="text-lg font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none w-24"
                          autoFocus
                        />
                      ) : (
                        <p className="text-lg font-bold text-gray-900">
                          {currentPrice}
                        </p>
                      )}
                      <button
                        onClick={() => togglePriceEdit(product.id)}
                        className="cursor-pointer text-xs text-gray-400 hover:text-blue-600"
                      >
                        Tap to edit
                      </button>
                    </div>
                  </div>

                  {/* Unit of Measure – sirf us product ka API UOM */}
                  <div className="mb-3">
                    <Dropdown
                      label="Unit of Measure"
                      name={`unit-${product.id}`}
                      value={selectedUnits[product.id] ?? product.unitOfMeasure}
                      onChange={(e) => setSelectedUnits(prev => ({ ...prev, [product.id]: e.target.value }))}
                      options={[
                        { value: product.unitOfMeasure, label: product.unitOfMeasure },
                      ]}
                    />
                  </div>

                  {/* Comments/Remarks – API me comments bhejte hain */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-400 mb-1">Comments / Remarks</p>
                    <textarea
                      placeholder="Add remark if any..."
                      rows={2}
                      value={productComments[product.id] ?? ""}
                      onChange={(e) => setProductComments((prev) => ({ ...prev, [product.id]: e.target.value }))}
                      className="w-full px-3 py-2 text-sm text-gray-600 placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between mb-3 bg-gray-50 rounded-lg p-2">
                    <button
                      onClick={() => handleQuantityChange(product.id, -1)}
                      className="cursor-pointer w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors text-lg"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setProductQuantities((prev) => ({
                          ...prev,
                          [product.id]: Math.max(0, value),
                        }));
                      }}
                      className="text-lg font-semibold text-gray-900 w-24 text-center bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                      min="0"
                    />
                    <button
                      onClick={() => handleQuantityChange(product.id, 1)}
                      className="cursor-pointer w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors text-lg"
                    >
                      +
                    </button>
                  </div>

                  {/* Action Button */}
                  {hasQuantity ? (
                    <button
                      onClick={() => handleUpdateCart(product)}
                      disabled={cartApiLoadingId === product.id}
                      className="cursor-pointer w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {cartApiLoadingId === product.id ? "Updating..." : "Update Cart"}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={quantity <= 0 || cartApiLoadingId === product.id}
                      className="cursor-pointer w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {cartApiLoadingId === product.id ? "Adding..." : "Add to Cart"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        )}
      </main>

      {/* Fixed Checkout Button */}
      <button
        onClick={() => router.push('/cart')}
        disabled={isCartEmpty}
        className={`fixed bottom-14 right-6 px-6 py-3 rounded-lg font-medium shadow-lg transition-all flex items-center gap-2 ${isCartEmpty
          ? 'bg-blue-300 text-gray-900 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-xl'
          }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        Checkout {!isCartEmpty && `(${getTotalCartItems()})`}
      </button>
    </div>
  );
}
