import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import TablePageLayout from "./TablePageLayout";

// Mock Tooltip to render the label in a USWDS-style tooltip body so the width fitting can be checked.
vi.mock("../../UI/USWDS/Tooltip", () => ({
    __esModule: true,
    default: ({ label, children }) => (
        <span>
            {children}
            <span className="usa-tooltip__body">{label}</span>
        </span>
    )
}));

const renderLayout = (props = {}) =>
    render(
        <MemoryRouter>
            <TablePageLayout
                title="Agreements"
                subtitle="All Agreements"
                details="Details"
                TabsSection={<div />}
                {...props}
            />
        </MemoryRouter>
    );

describe("TablePageLayout title info icon", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("does not render an info icon when titleTooltip is not provided", () => {
        renderLayout();
        expect(screen.queryByRole("button", { name: "About Agreements" })).not.toBeInTheDocument();
    });

    it("renders an accessible info icon with the definition when titleTooltip is provided", () => {
        renderLayout({ titleTooltip: "An agreement is a general term" });
        expect(screen.getByRole("button", { name: "About Agreements" })).toBeInTheDocument();
        expect(screen.getByText("An agreement is a general term")).toBeInTheDocument();
    });

    it("shrinks the tooltip to hug its longest line when shown", () => {
        vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
            cb();
            return 0;
        });
        vi.spyOn(document, "createRange").mockReturnValue({
            selectNodeContents: () => {},
            getClientRects: () => [
                { left: 10, right: 210 },
                { left: 10, right: 260 }
            ]
        });
        renderLayout({ titleTooltip: "An agreement is a general term" });

        fireEvent.mouseOver(screen.getByRole("button", { name: "About Agreements" }));

        expect(screen.getByText("An agreement is a general term").style.width).toBe("250px");
    });
});
