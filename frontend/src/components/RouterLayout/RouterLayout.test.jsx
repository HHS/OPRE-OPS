import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import RouterLayout from "./RouterLayout";

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

    it("should render child routes via Outlet", () => {
        renderWithRouter();
        expect(screen.getByTestId("test-child")).toBeInTheDocument();
    });
});
