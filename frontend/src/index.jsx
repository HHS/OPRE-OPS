import React from "react";
import ReactDOM from "react-dom/client";

import { Provider } from "react-redux";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import store from "./store";

// eslint-disable-next-line import/no-unresolved
import "@uswds/uswds/css/uswds.min.css";
import "@uswds/uswds";
import App from "./App";
import Home from "./pages/Home";
import PortfolioList from "./pages/portfolios/list/PortfolioList";
import PortfolioDetail from "./pages/portfolios/detail/PortfolioDetail";
import CanList from "./pages/cans/list/CanList";
import CanDetail from "./pages/cans/detail/CanDetail";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
    <React.StrictMode>
        <Provider store={store}>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/portfolios" element={<PortfolioList />} />
                    <Route path="/portfolios/:id" element={<PortfolioDetail />} />
                    <Route path="/cans" element={<CanList />} />
                    <Route path="/cans/:id" element={<CanDetail />} />
                    
                </Routes>
            </BrowserRouter>
        </Provider>
    </React.StrictMode>
);

if (window.Cypress) {
    window.store = store;
}
