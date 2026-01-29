"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "../../components/common/Header";
import Dropdown from "../../components/common/Dropdown";
import Image from "next/image";
import TwoGrid from "../../components/assets/images/two-grid.svg";
import FourGrid from "../../components/assets/images/four-grid.svg";

export default function Products() {
  const router = useRouter();
  const categories = ["All Items", "Beverages", "Snacks", "Household", "Personal Care"];
  const [activeCategory, setActiveCategory] = useState("All Items");
  const [isTwoColumnView, setIsTwoColumnView] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  const products = [
    {
      id: 1,
      name: "Premium Arabica Coffee",
      description: "500g Bag • SKU: SKU-CA001",
      price: "$12.50",
      unitPrice: "$12.50",
      unitOfMeasure: "Bag (500g)",
      image: "/products/coffee.jpg",
      sku: "SKU-CA001",
      inStock: true,
      category: "Beverages",
      stock: 45,
    },
    {
      id: 2,
      name: "Organic Green Tea",
      description: "20 Teabags • SKU: GT-045",
      price: "$4.80",
      unitPrice: "$4.80",
      unitOfMeasure: "Box (20 bags)",
      image: "/products/green-tea.jpg",
      sku: "GT-045",
      inStock: true,
      category: "Beverages",
      stock: 32,
    },
    {
      id: 3,
      name: "Classic Salted Chips",
      description: "150g Pack • SKU: SN-027",
      price: "$2.20",
      unitPrice: "$2.20",
      unitOfMeasure: "Pack (150g)",
      image: "/products/chips.jpg",
      sku: "SN-027",
      inStock: true,
      category: "Snacks",
      stock: 67,
    },
    {
      id: 4,
      name: "Dark Chocolate Bar",
      description: "100g • SKU: CH-001",
      price: "$3.50",
      unitPrice: "$3.50",
      unitOfMeasure: "Bar (100g)",
      image: "/products/chocolate.jpg",
      sku: "CH-001",
      inStock: true,
      category: "Snacks",
      stock: 28,
    },
    {
      id: 5,
      name: "Sparkling Water",
      description: "500ml Bottle • SKU: DR-009",
      price: "$1.10",
      unitPrice: "$1.10",
      unitOfMeasure: "Bottle (500ml)",
      image: "/products/water.jpg",
      sku: "DR-009",
      inStock: true,
      category: "Beverages",
      stock: 150,
    },
    {
      id: 6,
      name: "Lemon Dish Soap",
      description: "750ml • SKU: HS-221",
      price: "$2.95",
      unitPrice: "$2.95",
      unitOfMeasure: "Bottle (750ml)",
      image: "/products/soap.jpg",
      sku: "HS-221",
      inStock: true,
      category: "Household",
      stock: 55,
    },
    {
      id: 7,
      name: "Hand Sanitizer",
      description: "250ml • SKU: PC-105",
      price: "$4.50",
      unitPrice: "$4.50",
      unitOfMeasure: "Bottle (250ml)",
      image: "/products/sanitizer.jpg",
      sku: "PC-105",
      inStock: true,
      category: "Personal Care",
      stock: 42,
    },
    {
      id: 8,
      name: "Orange Juice",
      description: "1L Carton • SKU: BV-032",
      price: "$3.80",
      unitPrice: "$3.80",
      unitOfMeasure: "Carton (1L)",
      image: "/products/juice.jpg",
      sku: "BV-032",
      inStock: true,
      category: "Beverages",
      stock: 38,
    },
    {
      id: 9,
      name: "Potato Crackers",
      description: "200g Pack • SKU: SN-041",
      price: "$2.80",
      unitPrice: "$2.80",
      unitOfMeasure: "Pack (200g)",
      image: "/products/crackers.jpg",
      sku: "SN-041",
      inStock: true,
      category: "Snacks",
      stock: 51,
    },
    {
      id: 10,
      name: "All-Purpose Cleaner",
      description: "500ml • SKU: HS-315",
      price: "$3.20",
      unitPrice: "$3.20",
      unitOfMeasure: "Bottle (500ml)",
      image: "/products/cleaner.jpg",
      sku: "HS-315",
      inStock: true,
      category: "Household",
      stock: 63,
    },
    {
      id: 11,
      name: "Shampoo",
      description: "400ml • SKU: PC-201",
      price: "$5.50",
      unitPrice: "$5.50",
      unitOfMeasure: "Bottle (400ml)",
      image: "/products/shampoo.jpg",
      sku: "PC-201",
      inStock: true,
      category: "Personal Care",
      stock: 29,
    },
  ];

  // Filter products based on active category
  const filteredProducts = activeCategory === "All Items"
    ? products
    : products.filter(product => product.category === activeCategory);

  const [productQuantities, setProductQuantities] = useState(
    products.reduce((acc, product) => ({ ...acc, [product.id]: 0 }), {})
  );

  const [editablePrices, setEditablePrices] = useState(
    products.reduce((acc, product) => ({ ...acc, [product.id]: product.price }), {})
  );

  const [selectedUnits, setSelectedUnits] = useState(
    products.reduce((acc, product) => ({ ...acc, [product.id]: product.unitOfMeasure }), {})
  );

  const [editingPrice, setEditingPrice] = useState(null);

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

  const handleAddToCart = (productId) => {
    const quantity = productQuantities[productId];
    if (quantity > 0) {
      setCartItems((prev) => {
        const existingItem = prev.find((item) => item.id === productId);
        if (existingItem) {
          return prev.map((item) =>
            item.id === productId ? { ...item, quantity: item.quantity + quantity } : item
          );
        }
        return [...prev, { id: productId, quantity }];
      });
    }
    console.log(`Added product ${productId} to cart with quantity:`, quantity);
  };

  const handleUpdateCart = (productId) => {
    const quantity = productQuantities[productId];
    setCartItems((prev) => {
      if (quantity === 0) {
        return prev.filter((item) => item.id !== productId);
      }
      const existingItem = prev.find((item) => item.id === productId);
      if (existingItem) {
        return prev.map((item) =>
          item.id === productId ? { ...item, quantity } : item
        );
      }
      return [...prev, { id: productId, quantity }];
    });
    console.log(`Updated cart for product ${productId} with quantity:`, quantity);
  };

  const getTotalCartItems = () => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  };

  const isCartEmpty = cartItems.length === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Header Section */}
        <div className="mb-6">
          <Link
            href="/customer-dashboard"
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

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products by name or SKU..."
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
                {/* Product Image */}
                <div className="relative h-48 bg-gray-200 overflow-hidden flex items-center justify-center">
                  <img
                    src={
                      product.id === 1 ? 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=400&fit=crop' : // Coffee
                        product.id === 2 ? 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&h=400&fit=crop' : // Green tea
                          product.id === 3 ? 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop' : // Chips
                            product.id === 4 ? 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=400&h=400&fit=crop' : // Chocolate
                              product.id === 5 ? 'https://images.unsplash.com/photo-1625772452859-1c03d5369f5f?w=400&h=400&fit=crop' : // Sparkling water
                                product.id === 6 ? 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&h=400&fit=crop' : // Dish soap/cleaning
                                  product.id === 7 ? 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=400&h=400&fit=crop' : // Hand sanitizer
                                    product.id === 8 ? 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=400&fit=crop' : // Orange juice
                                      product.id === 9 ? 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&h=400&fit=crop' : // Crackers
                                        product.id === 10 ? 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400&h=400&fit=crop' : // Cleaner spray
                                          'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&h=400&fit=crop' // Shampoo
                    }
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `
                        <svg class="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                      `;
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

                  {/* Unit of Measure */}
                  <div className="mb-3">
                    <Dropdown
                      label="Unit of Measure"
                      name={`unit-${product.id}`}
                      value={selectedUnits[product.id]}
                      onChange={(e) => setSelectedUnits(prev => ({ ...prev, [product.id]: e.target.value }))}
                      options={[
                        { value: product.unitOfMeasure, label: product.unitOfMeasure },
                        { value: "Box (20 bags)", label: "Box (20 bags)" },
                        { value: "Carton (12 units)", label: "Carton (12 units)" },
                        { value: "Pack (6 units)", label: "Pack (6 units)" },
                      ]}
                    />
                  </div>

                  {/* Comments/Remarks */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-400 mb-1">Comments / Remarks</p>
                    <textarea
                      placeholder="Add remark if any..."
                      rows={2}
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
                      onClick={() => handleUpdateCart(product.id)}
                      className="cursor-pointer w-full h-11 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Update Cart
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAddToCart(product.id)}
                      className="cursor-pointer w-full h-11 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg border border-gray-300 transition-colors"
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Fixed Checkout Button */}
      <button
        onClick={() => router.push('/cart')}
        disabled={isCartEmpty}
        className={`fixed bottom-6 right-6 px-6 py-3 rounded-lg font-medium shadow-lg transition-all flex items-center gap-2 cursor-pointer ${isCartEmpty
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
