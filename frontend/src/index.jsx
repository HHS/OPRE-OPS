import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { createBrowserRouter, createRoutesFromElements, Link, Navigate, Route, RouterProvider } from "react-router-dom";
import store from "./store";
import UploadDocument from "./components/Agreements/Documents/UploadDocument.jsx";
import { ProtectedRoute } from "./components/Auth/ProtectedRoute/ProtectedRoute";
import BudgetAndFunding from "./components/Portfolios/BudgetAndFunding/BudgetAndFunding";
import PeopleAndTeams from "./components/Portfolios/PeopleAndTeams/PeopleAndTeams";
import ResearchProjects from "./components/Portfolios/ResearchProjects/ResearchProjects";
import ApproveAgreement from "./pages/agreements/approve";
import CreateAgreement from "./pages/agreements/CreateAgreement";
import Agreement from "./pages/agreements/details/Agreement";
import EditAgreement from "./pages/agreements/EditAgreement";
import AgreementsList from "./pages/agreements/list/AgreementsList";
import ReviewAgreement from "./pages/agreements/review/ReviewAgreement";
import BudgetLineItemList from "./pages/budgetLines/list/BudgetLineItemList";
import Can from "./pages/cans/detail/Can";
import CanList from "./pages/cans/list/CanList";
import ErrorPage from "./pages/ErrorPage";
import Home from "./pages/Home";
import Login from "./pages/Login";
import PortfolioDetail from "./pages/portfolios/detail/PortfolioDetail";
import PortfolioList from "./pages/portfolios/list/PortfolioList";
import CreateProject from "./pages/projects/CreateProject";
import ResearchProjectDetail from "./pages/researchProjects/detail/ResearchProjectDetail";
import UserAdmin from "./pages/users/admin/UserAdmin.jsx";
import UserDetail from "./pages/users/detail/UserDetail";
import EditUser from "./pages/users/edit/EditUser";
import VersionPage from "./pages/version/VersionPage";

//  USWDS
import "./uswds/css/styles.css";
// NOTE: Uncomment the following line to include the USWDS JavaScript but breaks DatePicker
// import "./uswds/js/uswds.min.js";

const router = createBrowserRouter(
    createRoutesFromElements(
        <>
            <Route
                path="/login"
                element={<Login />}
            />
            <Route
                path="/"
                element={<Home />}
            />
            <Route
                path="/version"
                element={<VersionPage />} // Use the VersionPage component
            />
            <Route
                element={
                    // This demonstrates a Protected Route. All children within this Route
                    // will have to be processed by the Protection rules before rendering.
                    // By default, we redirect back to "/login" if they're not allowed. This can
                    // overwritten with a 'redirectPath="/whatever"' prop.
                    //
                    // In this example, all /portfolio routes are currently protected.

                    <ProtectedRoute />
                }
            >
                {/* BEGIN PROTECTED ROUTES */}
                {(import.meta.env.MODE === "development") && (
                <Route
                    path="/portfolios"
                    element={<PortfolioList />}
                />
                )}
                {(import.meta.env.MODE === "development") && (
                <Route
                    path="/portfolios/:id"
                    element={<PortfolioDetail />}
                    handle={{
                        // you can put whatever you want on a route handle
                        // here we use "crumb" and return some elements,
                        // this is what we'll render in the breadcrumbs
                        // for this route
                        crumb: () => (
                            <Link
                                to="/portfolios"
                                className="text-primary"
                            >
                                Portfolios
                            </Link>
                        )
                    }}
                >
                    {/* Default to BudgetAndFunding */}
                    <Route
                        exact
                        path=""
                        element={<Navigate to={"budget-and-funding"} />}
                    />
                    <Route
                        path="budget-and-funding"
                        element={<BudgetAndFunding />}
                    />
                    <Route
                        path="research-projects"
                        element={<ResearchProjects />}
                    />
                    <Route
                        path="people-and-teams"
                        element={<PeopleAndTeams />}
                    />
                </Route>
                )}
                <Route
                    path="/research-projects/:id/*"
                    element={<ResearchProjectDetail />}
                    handle={{
                        crumb: () => (
                            <div>
                                <Link
                                    to="/"
                                    className="text-primary"
                                >
                                    Research Projects
                                </Link>
                            </div>
                        )
                    }}
                />
                <Route
                    path="/users/:id/*"
                    element={<UserDetail />}
                    handle={{
                        crumb: () => (
                            <div>
                                <Link
                                    to="/"
                                    className="text-primary"
                                >
                                    Users
                                </Link>
                            </div>
                        )
                    }}
                />
                <Route
                    path="/users/edit/:id"
                    element={<EditUser />}
                    handle={{
                        crumb: () => (
                            <div>
                                <Link
                                    to="/"
                                    className="text-primary"
                                >
                                    Edit User
                                </Link>
                            </div>
                        )
                    }}
                />
                <Route
                    path="/users/edit"
                    element={<EditUser />}
                    handle={{
                        crumb: () => (
                            <div>
                                <Link
                                    to="/"
                                    className="text-primary"
                                >
                                    Edit User
                                </Link>
                            </div>
                        )
                    }}
                />
                <Route
                    path="/agreements/:id/*"
                    element={<Agreement />}
                    handle={{
                        crumb: () => (
                            <Link
                                to="/agreements"
                                className="text-primary"
                            >
                                Agreements
                            </Link>
                        )
                    }}
                />
                {/*/!* Default to BudgetAndFunding *!/*/}
                {/*<Route exact path="" element={<Navigate to={"budget-and-funding"} />} />*/}
                <Route
                    path="/budget-lines"
                    element={<BudgetLineItemList />}
                />
                <Route
                    path="/projects/create"
                    element={<CreateProject />}
                />
                <Route
                    path="/agreements"
                    element={<AgreementsList />}
                />
                <Route
                    path="/agreements/create"
                    element={<CreateAgreement />}
                />
                <Route
                    path="/agreements/edit/:id/*"
                    element={<EditAgreement />}
                />
                <Route
                    path="/agreements/review/:id/*"
                    element={<ReviewAgreement />}
                    handle={{
                        crumb: () => (
                            <Link
                                to="/agreements"
                                className="text-primary"
                            >
                                Agreements
                            </Link>
                        )
                    }}
                />
                <Route
                    path="/agreements/approve/:id/*"
                    element={<ApproveAgreement />}
                    handle={{
                        crumb: () => (
                            <Link
                                to="/agreements"
                                className="text-primary"
                            >
                                Agreements
                            </Link>
                        )
                    }}
                />
                <Route
                    path="/cans"
                    element={<CanList />}
                />
                <Route
                    path="/cans/:id/*"
                    element={<Can />}
                    handle={{
                        crumb: () => (
                            <Link
                                to="/cans"
                                className="text-primary"
                            >
                                CANs
                            </Link>
                        )
                    }}
                />
                <Route
                    path="/user-admin"
                    element={<UserAdmin />}
                />
                <Route
                    path="/upload-document"
                    element={<UploadDocument />}
                />
            </Route>
            {/* END PROTECTED ROUTES */}
            <Route
                path="/error"
                element={<ErrorPage />}
            />
            <Route
                path="*"
                element={<Navigate to="/error" />}
            />
        </>
    )
);

const rootElement = document.getElementById("root");

if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <Provider store={store}>
                <RouterProvider router={router} />
            </Provider>
        </React.StrictMode>
    );
} else {
    console.error("No root element found");
}

// Expose redux store when running in Cypress (e2e)
if (window.Cypress) {
    window.store = store;
}
