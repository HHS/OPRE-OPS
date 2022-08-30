import React from "react";
import ReactDOM from "react-dom/client";

import { Provider } from "react-redux";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import store from "./store";

import ApplicationContext from "./applicationContext/ApplicationContext";
import DeployedApplicationContext from "./applicationContext/DeployedApplicationContext";

import "./index.css";

// import "@uswds/uswds";
// import "@uswds/uswds/css/uswds.min.css";
// import "@uswds/uswds/fonts/source-sans-pro/sourcesanspro-regular-webfont.woff2";

import "./uswds/css/styles.css";
import "./uswds/js/uswds-init";
import "./uswds/js/uswds";

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
