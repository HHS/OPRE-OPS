import React from "react";
import ReactDOM from "react-dom/client";
import reportWebVitals from "./reportWebVitals";

import { Provider } from "react-redux";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import store from "./store";

import ApplicationContext from "./applicationContext/ApplicationContext";
import DeployedApplicationContext from "./applicationContext/DeployedApplicationContext";

import "./index.css";
import App from "./App";
import CanList from "./pages/cans/list/CanList";
import CanDetail from "./pages/cans/detail/CanDetail";
import PortfolioList from "./pages/portfolios/list/PortfolioList";

ApplicationContext.registerApplicationContext(DeployedApplicationContext);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <React.StrictMode>
        <Provider store={store}>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<App />} />
                    <Route path="/portfolios" element={<PortfolioList />} />
                    <Route path="/cans" element={<CanList />}>
                        <Route path="/cans/:id" element={<CanDetail />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </Provider>
    </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
