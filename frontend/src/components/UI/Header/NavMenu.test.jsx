import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter } from "react-router-dom";
import NavMenu from "./NavMenu";

describe("NavMenu", () => {
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

    it("renders a projects navigation link", () => {
        renderComponent();

        const projectsLink = screen.getByRole("link", { name: "Projects" });
        expect(projectsLink).toBeInTheDocument();
        expect(projectsLink).toHaveAttribute("href", "/projects");
    });
});
