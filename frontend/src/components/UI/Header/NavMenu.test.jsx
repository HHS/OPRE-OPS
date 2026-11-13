import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter } from "react-router-dom";
import NavMenu from "./NavMenu";

const renderWithRoles = (roles = [], initialEntries = ["/"]) => {
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
            <MemoryRouter initialEntries={initialEntries}>
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

    it("renders the Create menu item when the user has no roles", () => {
        renderWithRoles([]);

        expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
    });

    it("hides the Project and Agreement sub-links for read-only users", () => {
        renderWithRoles([{ name: "READ_ONLY" }]);

        expect(screen.queryByRole("link", { name: "Project" })).not.toBeInTheDocument();
        expect(screen.queryByRole("link", { name: "Agreement" })).not.toBeInTheDocument();
    });

    describe("Home nav link active state", () => {
        it.each(["/", "/release-notes", "/next", "/ops-at-a-glance", "/ops-benefits"])("stays active on %s", (path) => {
            renderWithRoles([], [path]);

            expect(screen.getByRole("link", { name: "Home" })).toHaveClass("usa-current");
        });

        it("is not active on an unrelated route", () => {
            renderWithRoles([], ["/portfolios"]);

            expect(screen.getByRole("link", { name: "Home" })).not.toHaveClass("usa-current");
        });
    });

    describe("Esc closes an open accordion submenu and returns focus to its toggle", () => {
        it("closes the Create menu and refocuses its toggle when Esc is pressed on the toggle itself", async () => {
            const user = userEvent.setup();
            renderWithRoles([{ name: "BUDGET_TEAM" }]);

            const createButton = screen.getByRole("button", { name: "Create" });
            await user.click(createButton);
            expect(createButton).toHaveAttribute("aria-expanded", "true");

            await user.keyboard("{Escape}");

            expect(createButton).toHaveAttribute("aria-expanded", "false");
            expect(createButton).toHaveFocus();
        });

        it("closes the Create menu and returns focus to its toggle when Esc is pressed on a submenu item", async () => {
            const user = userEvent.setup();
            renderWithRoles([{ name: "BUDGET_TEAM" }]);

            const createButton = screen.getByRole("button", { name: "Create" });
            await user.click(createButton);
            screen.getByRole("link", { name: "Project" }).focus();

            await user.keyboard("{Escape}");

            expect(createButton).toHaveAttribute("aria-expanded", "false");
            expect(createButton).toHaveFocus();
        });

        it("closes the Reporting menu and refocuses its toggle when Esc is pressed on the toggle itself", async () => {
            const user = userEvent.setup();
            renderWithRoles();

            const reportingButton = screen.getByRole("button", { name: "Reporting" });
            await user.click(reportingButton);
            expect(reportingButton).toHaveAttribute("aria-expanded", "true");

            await user.keyboard("{Escape}");

            expect(reportingButton).toHaveAttribute("aria-expanded", "false");
            expect(reportingButton).toHaveFocus();
        });

        it("closes the Reporting menu and returns focus to its toggle when Esc is pressed on a submenu item", async () => {
            const user = userEvent.setup();
            renderWithRoles();

            const reportingButton = screen.getByRole("button", { name: "Reporting" });
            await user.click(reportingButton);
            screen.getByRole("link", { name: "OPRE Budget Reporting" }).focus();

            await user.keyboard("{Escape}");

            expect(reportingButton).toHaveAttribute("aria-expanded", "false");
            expect(reportingButton).toHaveFocus();
        });

        it("does not close the Create menu when Esc is pressed while the Reporting menu is open", async () => {
            const user = userEvent.setup();
            renderWithRoles([{ name: "BUDGET_TEAM" }]);

            const reportingButton = screen.getByRole("button", { name: "Reporting" });
            const createButton = screen.getByRole("button", { name: "Create" });
            await user.click(createButton);
            expect(createButton).toHaveAttribute("aria-expanded", "true");

            reportingButton.focus();
            await user.keyboard("{Escape}");

            // Esc on an unrelated, unopened toggle shouldn't affect the Create menu's own state.
            expect(createButton).toHaveAttribute("aria-expanded", "true");
        });
    });
});
