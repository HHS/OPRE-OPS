import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../../constants", () => ({
    IS_PROJECTS_LIST_READY: false
}));

// Must import after vi.mock so the mock is applied
import NavMenu from "./NavMenu";

describe("NavMenu with projects feature flag off", () => {
    const renderComponent = () => {
        const store = configureStore({
            reducer: {
                auth: () => ({
                    activeUser: {
                        id: 1,
                        roles: []
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

    it("renders projects as disabled text with tooltip when feature flag is off", () => {
        renderComponent();

        // Should not have a link for Projects
        const projectsLink = screen.queryByRole("link", { name: "Projects" });
        expect(projectsLink).not.toBeInTheDocument();

        // Should have Projects text visible
        const projectsText = screen.getByText("Projects");
        expect(projectsText).toBeInTheDocument();
        expect(projectsText.tagName).toBe("SPAN");

        // USWDS tooltip should render the "Coming soon!" tooltip body
        // The tooltip body has aria-hidden="true" so we need to include hidden elements
        const tooltipBody = screen.getByRole("tooltip", { hidden: true });
        expect(tooltipBody).toHaveTextContent("Coming soon!");
    });
});
