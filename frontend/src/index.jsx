import React from "react";
import ReactDOM from "react-dom/client";

import { Provider } from "react-redux";
// import { createBrowserRouter, RouterProvider, Navigate, Route, Routes, Link } from "react-router-dom";
import {
    createBrowserRouter,
    createRoutesFromElements,
    Route,
    Routes,
    RouterProvider,
    Link,
    Navigate,
} from "react-router-dom";
import store from "./store";

import "./uswds/css/styles.css";

import Home from "./pages/Home";
import PortfolioList from "./pages/portfolios/list/PortfolioList";
import PortfolioDetail from "./pages/portfolios/detail/PortfolioDetail";
import CanList from "./pages/cans/list/CanList";
import CanDetail from "./pages/CanDetail";
import ResearchProjects from "./components/Portfolios/ResearchProjects/ResearchProjects";
import PeopleAndTeams from "./components/Portfolios/PeopleAndTeams/PeopleAndTeams";
import BudgetAndFunding from "./components/Portfolios/BudgetAndFunding/BudgetAndFunding";
import ResearchProjectDetail from "./pages/researchProjects/detail/ResearchProjectDetail";

// const root = ReactDOM.createRoot(document.getElementById("root"));

const router = createBrowserRouter(
    createRoutesFromElements(
        <>
            <Route path="/" element={<Home />} />
            <Route path="/portfolios" element={<PortfolioList />} />
            <Route
                path="/portfolios/:id"
                element={<PortfolioDetail />}
                handle={{
                    // you can put whatever you want on a route handle
                    // here we use "crumb" and return some elements,
                    // this is what we'll render in the breadcrumbs
                    // for this route
                    crumb: () => <Link to="/portfolios">Portfolios</Link>,
                }}
            >
                {/* Default to BudgetAndFunding */}
                <Route exact path="" element={<Navigate to={"budget-and-funding"} />} />
                <Route path="budget-and-funding" element={<BudgetAndFunding />} />
                <Route path="research-projects" element={<ResearchProjects />} />
                <Route path="people-and-teams" element={<PeopleAndTeams />} />
            </Route>
            <Route path="/cans" element={<CanList />} />
            <Route path="/cans/:id" element={<CanDetail />} />
            <Route path="/research-projects/:id" element={<ResearchProjectDetail />} />
        </>
    )
);

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <Provider store={store}>
            <RouterProvider router={router} />
        </Provider>
    </React.StrictMode>
);
// root.render(
//     <React.StrictMode>
//         <Provider store={store}>
//             <createBrowserRouter>
//                 <Routes>
//                     <Route path="/" element={<Home />} />
//                     <Route path="/portfolios" element={<PortfolioList />} />
//                     <Route
//                         path="/portfolios/:id"
//                         element={<PortfolioDetail />}
//                         handle={{
//                             // you can put whatever you want on a route handle
//                             // here we use "crumb" and return some elements,
//                             // this is what we'll render in the breadcrumbs
//                             // for this route
//                             crumb: () => <Link to="/">Home</Link>,
//                         }}
//                     >
//                         {/* Default to BudgetAndFunding */}
//                         <Route exact path="" element={<Navigate to={"budget-and-funding"} />} />
//                         <Route path="budget-and-funding" element={<BudgetAndFunding />} />
//                         <Route path="research-projects" element={<ResearchProjects />} />
//                         <Route path="people-and-teams" element={<PeopleAndTeams />} />
//                     </Route>
//                     <Route path="/cans" element={<CanList />} />
//                     <Route path="/cans/:id" element={<CanDetail />} />
//                     <Route path="/research-projects/:id" element={<ResearchProjectDetail />} />
//                 </Routes>
//             </createBrowserRouter>
//         </Provider>
//     </React.StrictMode>
// );

if (window.Cypress) {
    window.store = store;
}
