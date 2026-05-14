import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter } from "react-router-dom";
import NavMenu from "./NavMenu";

const renderWithRoles = (roles = []) => {
    const store = configureStore({
        reducer: {
            auth: () => ({
                activeUser: {
                    id: 1,
                    roles
                }
            })
        }
    });

    return render(
        <Provider store={store}>
            <MemoryRouter>
                <NavMenu />
            </MemoryRouter>
        </Provider>
    );
};

describe("NavMenu", () => {
    it("renders a projects navigation link", () => {
        renderWithRoles();

        const projectsLink = screen.getByRole("link", { name: "Projects" });
        expect(projectsLink).toBeInTheDocument();
        expect(projectsLink).toHaveAttribute("href", "/projects");
    });

    it("does not render the Create menu item for read-only users", () => {
        renderWithRoles([{ name: "READ_ONLY" }]);

        expect(screen.queryByRole("button", { name: "Create" })).not.toBeInTheDocument();
    });

    it("renders the Create menu item for non-read-only users", () => {
        renderWithRoles([{ name: "BUDGET_TEAM" }]);

        expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
    });
});
