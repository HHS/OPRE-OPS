import React from "react";
import ReactDOM from "react-dom/client";

import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";

import store from "./store";

import HomeRoutes from "./components/HomeRoutes/HomeRoutes";

// eslint-disable-next-line import/no-unresolved
import "@uswds/uswds/css/uswds.min.css";
import "@uswds/uswds";

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
