import { act, fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, Link, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RootLayout from "./RootLayout";

const setScrollY = (y) => Object.defineProperty(window, "scrollY", { value: y, configurable: true });

describe("RootLayout scroll restoration", () => {
    beforeEach(() => {
        window.scrollTo = vi.fn();
        sessionStorage.clear();
    });

    afterEach(() => {
        setScrollY(0);
    });

    const mountRouter = () => {
        const router = createMemoryRouter(
            [
                {
                    element: <RootLayout />,
                    children: [
                        { path: "/list", element: <Link to="/detail">Open detail</Link> },
                        { path: "/detail", element: <h1>Detail</h1> }
                    ]
                }
            ],
            { initialEntries: ["/list"] }
        );
        render(<RouterProvider router={router} />);
        return router;
    };

    it("scrolls a new page to the top", async () => {
        mountRouter();
        setScrollY(500);
        window.scrollTo.mockClear();

        fireEvent.click(screen.getByText("Open detail"));
        await screen.findByRole("heading", { name: "Detail" });

        expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    });

    it("restores the previous position on Back", async () => {
        const router = mountRouter();
        setScrollY(500);
        fireEvent.click(screen.getByText("Open detail"));
        await screen.findByRole("heading", { name: "Detail" });
        window.scrollTo.mockClear();

        await act(() => router.navigate(-1));

        expect(screen.getByText("Open detail")).toBeInTheDocument();
        expect(window.scrollTo).toHaveBeenCalledWith(0, 500);
    });
});
