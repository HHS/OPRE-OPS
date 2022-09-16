import { Route, Routes } from "react-router-dom";
import App from "../../App";
import PortfolioList from "../../pages/portfolios/list/PortfolioList";
import PortfolioDetail from "../../pages/portfolios/detail/PortfolioDetail";
import CanList from "../../pages/cans/list/CanList";
import CanDetail from "../../pages/cans/detail/CanDetail";
import Login from "../Auth/Login";
import React from "react";

const HomeRoutes = () => (
    <Routes>
        <Route path="/" element={<App />} />
        <Route path="/portfolios" element={<PortfolioList />}>
            <Route path="/portfolios/:id" element={<PortfolioDetail />} />
        </Route>
        <Route path="/cans" element={<CanList />}>
            <Route path="/cans/:id" element={<CanDetail />} />
        </Route>
        <Route path="/login" element={<Login />}></Route>
    </Routes>
);

export default HomeRoutes;
