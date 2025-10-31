import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { vi } from "vitest";
import RouterLayout from "./RouterLayout";

// Mock the NavigationBlockerContext
vi.mock("../../contexts/NavigationBlockerContext", () => ({
    NavigationBlockerProvider: ({ children }) => <div data-testid="navigation-blocker-provider">{children}</div>
}));

describe("RouterLayout", () => {
    const renderWithRouter = (initialEntries = ["/"]) => {
        const router = createMemoryRouter(
            [
                {
                    path: "/",
                    element: <RouterLayout />,
                    children: [
                        {
                            path: "",
                            element: <div data-testid="test-child">Test Child</div>
                        }
                    ]
                }
            ],
            { initialEntries }
        );

        return render(<RouterProvider router={router} />);
    };

    it("should render the NavigationBlockerProvider", () => {
        renderWithRouter();
        expect(screen.getByTestId("navigation-blocker-provider")).toBeInTheDocument();
    });

    it("should render child routes via Outlet", () => {
        renderWithRouter();
        expect(screen.getByTestId("test-child")).toBeInTheDocument();
    });

    it("should wrap child content with NavigationBlockerProvider", () => {
        renderWithRouter();
        const provider = screen.getByTestId("navigation-blocker-provider");
        const child = screen.getByTestId("test-child");
        expect(provider).toContainElement(child);
    });
});
