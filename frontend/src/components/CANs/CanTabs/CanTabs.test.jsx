import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RootLayout from "../../Layouts/RootLayout";
import CanTabs from "./CanTabs";

describe("CanTabs", () => {
    beforeEach(() => {
        window.scrollTo = vi.fn();
        sessionStorage.clear();
    });

    it("keeps the page's scroll position when the All CANs tab is clicked", async () => {
        const router = createMemoryRouter(
            [{ element: <RootLayout />, children: [{ path: "/cans", element: <CanTabs /> }] }],
            { initialEntries: ["/cans?page=2"] }
        );
        render(<RouterProvider router={router} />);
        window.scrollTo.mockClear();

        fireEvent.click(screen.getByText("All CANs"));
        await vi.waitFor(() => expect(router.state.location.search).toBe(""));

        expect(window.scrollTo).not.toHaveBeenCalled();
    });
});
