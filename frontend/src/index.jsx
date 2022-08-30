import React from "react";
import ReactDOM from "react-dom/client";

import { Provider } from "react-redux";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import store from "./store";

import ApplicationContext from "./applicationContext/ApplicationContext";
import DeployedApplicationContext from "./applicationContext/DeployedApplicationContext";

import "./index.css";

// eslint-disable-next-line import/no-unresolved
import "@uswds/uswds/css/uswds.min.css";
import "@uswds/uswds";

import App from "./App";
import CanList from "./pages/cans/list/CanList";
import CanDetail from "./pages/cans/detail/CanDetail";
import PortfolioList from "./pages/portfolios/list/PortfolioList";
import PortfolioDetail from "./pages/portfolios/detail/PortfolioDetail";

ApplicationContext.registerApplicationContext(DeployedApplicationContext);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <React.StrictMode>
        <Provider store={store}>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<App />} />
                    <Route path="/portfolios" element={<PortfolioList />}>
                        <Route path="/portfolios/:id" element={<PortfolioDetail />} />
                    </Route>
                    <Route path="/cans" element={<CanList />}>
                        <Route path="/cans/:id" element={<CanDetail />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </Provider>
    </React.StrictMode>
);
