import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SEARCH_INFO_ITEMS } from "./HeaderSearch.helpers";
import SearchInfoTip from "./SearchInfoTip";

describe("SearchInfoTip", () => {
    it("is a labelled button whose tip is hidden until hover or focus", async () => {
        const user = userEvent.setup();
        render(<SearchInfoTip />);
        const button = screen.getByRole("button", { name: "What can I search for?" });
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
        expect(button).not.toHaveAttribute("aria-describedby");

        await user.hover(button);
        const tip = screen.getByRole("tooltip");
        expect(button).toHaveAttribute("aria-describedby", tip.id);
        expect(tip).toHaveTextContent("You can search agreements by:");
        expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual(SEARCH_INFO_ITEMS);

        await user.unhover(button);
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("shows on keyboard focus, and Esc dismisses it", async () => {
        const user = userEvent.setup();
        render(<SearchInfoTip />);

        await user.tab();
        expect(screen.getByRole("tooltip")).toBeVisible();

        await user.keyboard("{Escape}");
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

        await user.tab();
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("stays visible while either hover or focus is active", async () => {
        const user = userEvent.setup();
        render(<SearchInfoTip />);
        const button = screen.getByRole("button", { name: "What can I search for?" });

        // focused, then hovered and un-hovered: still focused, so still shown
        await user.tab();
        await user.hover(button);
        await user.unhover(button);
        expect(screen.getByRole("tooltip")).toBeVisible();

        // hovered, then blurred: still hovered, so still shown
        await user.hover(button);
        await user.tab();
        expect(screen.getByRole("tooltip")).toBeVisible();

        await user.unhover(button);
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("dismisses on Esc even when the icon only has hover and focus is elsewhere", async () => {
        const user = userEvent.setup();
        render(
            <>
                <input aria-label="other" />
                <SearchInfoTip />
            </>
        );
        await user.click(screen.getByLabelText("other"));
        await user.hover(screen.getByRole("button", { name: "What can I search for?" }));
        expect(screen.getByRole("tooltip")).toBeVisible();

        await user.keyboard("{Escape}");
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("comes back on the next hover after being dismissed", async () => {
        const user = userEvent.setup();
        render(<SearchInfoTip />);
        const button = screen.getByRole("button", { name: "What can I search for?" });
        await user.hover(button);
        await user.keyboard("{Escape}");
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

        await user.unhover(button);
        await user.hover(button);
        expect(screen.getByRole("tooltip")).toBeVisible();
    });
});
