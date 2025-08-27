import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from "./signin";
import OrderPage from "./order";

function App() {
  return (
    <>
      <OrderPage />
    </>
  );
}

export default App;
