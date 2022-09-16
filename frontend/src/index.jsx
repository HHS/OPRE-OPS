import React from "react";
import ReactDOM from "react-dom/client";

import { Provider } from "react-redux";
import { BrowserRouter, Route } from "react-router-dom";

import store from "./store";

import ApplicationContext from "./applicationContext/ApplicationContext";
import DeployedApplicationContext from "./applicationContext/DeployedApplicationContext";

import HomeRoutes from "./components/HomeRoutes/HomeRoutes";

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
                <HomeRoutes />
            </BrowserRouter>
        </Provider>
    </React.StrictMode>
);
