import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from "./signin";
import OrderPage from "./order";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<SignIn />} />
          <Route path="/orderby" element={<OrderPage />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
