import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Footer from "./Footer";

describe("Footer", () => {
    beforeEach(() => {
        window.scrollTo = vi.fn();
    });

    it("renders a Return to top button", () => {
        render(<Footer />);
        expect(screen.getByRole("button", { name: "Return to top" })).toBeInTheDocument();
    });

    it("scrolls to the top of the page when clicked", async () => {
        const user = userEvent.setup();
        render(<Footer />);

        await user.click(screen.getByRole("button", { name: "Return to top" }));

        expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
    });

    it("moves focus to the main-content landmark after scrolling, so the next Tab continues from the top of the page", async () => {
        const user = userEvent.setup();
        render(
            <>
                <Footer />
                <main
                    id="main-content"
                    tabIndex={-1}
                />
            </>
        );

        await user.click(screen.getByRole("button", { name: "Return to top" }));

        expect(screen.getByRole("main")).toHaveFocus();
    });

    it("does not throw when the main-content landmark isn't present on the page", async () => {
        const user = userEvent.setup();
        render(<Footer />);

        await expect(user.click(screen.getByRole("button", { name: "Return to top" }))).resolves.not.toThrow();
    });
});
