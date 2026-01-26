import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { createBrowserRouter, createRoutesFromElements, Link, Navigate, Route, RouterProvider } from "react-router-dom";
import store from "./store";
import { ProtectedRoute } from "./components/Auth/ProtectedRoute/ProtectedRoute";
import ApproveAgreement from "./pages/agreements/approve";
import Agreement from "./pages/agreements/details/Agreement";
import AgreementsList from "./pages/agreements/list/AgreementsList";
import BenefitsGrid from "./pages/home/BenefitsGrid";
import BudgetLineItemList from "./pages/budgetLines/list/BudgetLineItemList";
import CreateAgreement from "./pages/agreements/CreateAgreement";
import Can from "./pages/cans/detail/Can";
import CanList from "./pages/cans/list/CanList";
import CreateProject from "./pages/projects/CreateProject";
import EditAgreement from "./pages/agreements/EditAgreement";
import ErrorBoundary from "./components/ErrorBoundary";
import ErrorPage from "./pages/ErrorPage";
import HelpCenter from "./pages/help/HelpCenter";
import Home from "./pages/home";
import Login from "./pages/Login";
import PortfolioDetail from "./pages/portfolios/detail/PortfolioDetail";
import PortfolioFunding from "./components/Portfolios/PortfolioFunding";
import PortfolioSpending from "./components/Portfolios/PortfolioSpending";
import PortfolioList from "./pages/portfolios/list/PortfolioList";
import ResearchProjectDetail from "./pages/researchProjects/detail/ResearchProjectDetail";
import ReleaseNotes from "./pages/home/release-notes";
import UserAdmin from "./pages/users/admin/UserAdmin.jsx";
import ReviewAgreement from "./pages/agreements/review/ReviewAgreement";
import UserDetail from "./pages/users/detail/UserDetail";
import UploadDocument from "./components/Agreements/Documents/UploadDocument.jsx";
import EditUser from "./pages/users/edit/EditUser";
import VersionPage from "./pages/version/VersionPage";
import WhatsNext from "./pages/home/whats-next";
import ProcurementMocksDebug from "./pages/dev/ProcurementMocksDebug";

// NOTE: store muse be imported after react-router-dom to avoid access lexical declaration 'opsApi' before initialization

//  USWDS
import "./uswds/css/styles.css";

// NOTE: Uncomment the following line to include the USWDS JavaScript but breaks DatePicker
// import "./uswds/js/uswds.min.js";

const router = createBrowserRouter(
    createRoutesFromElements(
        <Route errorElement={<ErrorPage />}>
            <Route
                path="/login"
                element={<Login />}
            />
            <Route
                path="/"
                element={<Home />}
            >
                <Route
                    path="" // default for home page
                    element={<BenefitsGrid />}
                />
                <Route
                    path="release-notes"
                    element={<ReleaseNotes />}
                />
                <Route
                    path="next"
                    element={<WhatsNext />}
                />
            </Route>
            <Route
                path="/version"
                element={<VersionPage />}
            />
            <Route element={<ProtectedRoute />}>
                {/* BEGIN PROTECTED ROUTES */}

                <Route
                    path="/portfolios"
                    element={<PortfolioList />}
                />

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
                    {/* Default to Spending tab */}
                    <Route
                        path=""
                        element={<Navigate to={"spending"} />}
                    />
                    <Route
                        path="spending"
                        element={<PortfolioSpending />}
                    />
                    <Route
                        path="funding"
                        element={<PortfolioFunding />}
                    />
                </Route>

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
                    path="/dev/procurement-mocks"
                    element={import.meta.env.DEV ? <ProcurementMocksDebug /> : <Navigate to="/error" />}
                />
                <Route
                    path="/user-admin"
                    element={<UserAdmin />}
                />
                <Route
                    path="/upload-document"
                    element={<UploadDocument />}
                />
                <Route
                    path="/help-center/*"
                    element={<HelpCenter />}
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
        </Route>
    )
);

const rootElement = document.getElementById("root");

const startApp = async () => {
    if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MSW === "true" && !window.Cypress) {
        const { worker } = await import("./mocks/browser");
        await worker.start({ onUnhandledRequest: "bypass" });
    }

    if (rootElement) {
        ReactDOM.createRoot(rootElement, {
            onUncaughtError: (error, errorInfo) => {
                console.error('Uncaught error:', error);
                console.error('Error Info:', errorInfo);
            },
            onCaughtError: (error, errorInfo) => {
                console.error('Caught error:', error);
                console.error('Error Info:', errorInfo);
            }
        }).render(
            <React.StrictMode>
                <ErrorBoundary>
                    <Provider store={store}>
                        <RouterProvider router={router} />
                    </Provider>
                </ErrorBoundary>
            </React.StrictMode>
        );
    } else {
        console.error("No root element found");
    }
};

startApp();

// Expose redux store when running in Cypress (e2e)
if (window.Cypress) {
    window.store = store;
}
