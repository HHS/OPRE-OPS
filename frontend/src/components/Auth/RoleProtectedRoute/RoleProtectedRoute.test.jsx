import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { setupStore } from "../../../store";
import { USER_ROLES } from "../../Users/User.constants";
import RoleProtectedRoute from "./RoleProtectedRoute";

function renderWithRoute(preloadedState, allowedRoles) {
    const store = setupStore(preloadedState);

    return render(
        <Provider store={store}>
            <MemoryRouter initialEntries={["/protected"]}>
                <Routes>
                    <Route element={<RoleProtectedRoute allowedRoles={allowedRoles} />}>
                        <Route
                            path="/protected"
                            element={<div>Protected Content</div>}
                        />
                    </Route>
                    <Route
                        path="/error"
                        element={<div>Error Page</div>}
                    />
                </Routes>
            </MemoryRouter>
        </Provider>
    );
}

describe("RoleProtectedRoute", () => {
    it("renders children when user has an allowed role", () => {
        renderWithRoute(
            {
                auth: {
                    activeUser: {
                        id: 1,
                        roles: [{ id: 1, name: USER_ROLES.BUDGET_TEAM }]
                    }
                }
            },
            [USER_ROLES.BUDGET_TEAM, USER_ROLES.PROCUREMENT_TEAM]
        );

        expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("redirects to /error when user does not have an allowed role", () => {
        renderWithRoute(
            {
                auth: {
                    activeUser: {
                        id: 1,
                        roles: [{ id: 1, name: USER_ROLES.VIEWER_EDITOR }]
                    }
                }
            },
            [USER_ROLES.BUDGET_TEAM, USER_ROLES.PROCUREMENT_TEAM]
        );

        expect(screen.getByText("Error Page")).toBeInTheDocument();
        expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });

    it("redirects to /error when user has no roles", () => {
        renderWithRoute(
            {
                auth: {
                    activeUser: {
                        id: 1,
                        roles: []
                    }
                }
            },
            [USER_ROLES.BUDGET_TEAM]
        );

        expect(screen.getByText("Error Page")).toBeInTheDocument();
    });

    it("renders children while activeUser is hydrating (isLoggedIn but no activeUser yet)", () => {
        renderWithRoute(
            {
                auth: {
                    isLoggedIn: true,
                    activeUser: null
                }
            },
            [USER_ROLES.BUDGET_TEAM]
        );

        expect(screen.getByText("Protected Content")).toBeInTheDocument();
        expect(screen.queryByText("Error Page")).not.toBeInTheDocument();
    });

    it("renders children while activeUser is hydrating (not logged in, no activeUser yet)", () => {
        renderWithRoute(
            {
                auth: {
                    isLoggedIn: false,
                    activeUser: null
                }
            },
            [USER_ROLES.BUDGET_TEAM]
        );

        expect(screen.getByText("Protected Content")).toBeInTheDocument();
        expect(screen.queryByText("Error Page")).not.toBeInTheDocument();
    });

    it("allows access when user has one of multiple allowed roles", () => {
        renderWithRoute(
            {
                auth: {
                    activeUser: {
                        id: 1,
                        roles: [{ id: 1, name: USER_ROLES.REVIEWER_APPROVER }]
                    }
                }
            },
            [USER_ROLES.PROCUREMENT_TEAM, USER_ROLES.BUDGET_TEAM, USER_ROLES.REVIEWER_APPROVER]
        );

        expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });
});
