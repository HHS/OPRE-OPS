import React from "react";
import ReactDOM from "react-dom/client";

import { Provider } from "react-redux";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import store from "./store";

import "./uswds/css/styles.css";

import Home from "./pages/Home";
import PortfolioList from "./pages/portfolios/list/PortfolioList";
import PortfolioDetail from "./pages/PortfolioDetail";
import CanList from "./pages/cans/list/CanList";
import CanDetail from "./pages/CanDetail";
import ResearchProjects from "./components/Portfolios/ResearchProjects/ResearchProjects";
import PeopleAndTeams from "./components/Portfolios/PeopleAndTeams/PeopleAndTeams";
import BudgetAndFunding from "./components/Portfolios/BudgetAndFunding/BudgetAndFunding";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
    <React.StrictMode>
        <Provider store={store}>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/portfolios" element={<PortfolioList />} />
                    <Route path="/portfolios/:id" element={<PortfolioDetail />}>
                        {/* Default to BudgetAndFunding */}
                        <Route exact path="" element={<Navigate to={"budget-and-funding"} />} />
                        <Route path="budget-and-funding" element={<BudgetAndFunding />} />
                        <Route path="research-projects" element={<ResearchProjects />} />
                        <Route path="people-and-teams" element={<PeopleAndTeams />} />
                    </Route>
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
