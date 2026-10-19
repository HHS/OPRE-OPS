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
        const tip = screen.getByRole("tooltip", { hidden: true });
        expect(button).toHaveAttribute("aria-describedby", tip.id);
        expect(tip).not.toBeVisible();

        await user.hover(button);
        expect(tip).toBeVisible();
        expect(tip).toHaveTextContent("You can search agreements by:");
        expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual(SEARCH_INFO_ITEMS);

        await user.unhover(button);
        expect(tip).not.toBeVisible();
    });

    it("shows on keyboard focus, and Esc dismisses it", async () => {
        const user = userEvent.setup();
        render(<SearchInfoTip />);
        const tip = screen.getByRole("tooltip", { hidden: true });

        await user.tab();
        expect(tip).toBeVisible();

        await user.keyboard("{Escape}");
        expect(tip).not.toBeVisible();

        await user.tab();
        expect(tip).not.toBeVisible();
    });
});
