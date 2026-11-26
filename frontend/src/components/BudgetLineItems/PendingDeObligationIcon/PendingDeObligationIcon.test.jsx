import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PendingDeObligationIcon from "./PendingDeObligationIcon";

/* eslint-disable testing-library/no-node-access */
// Tooltip delegates its DOM structure to USWDS's tooltip.js, which moves the label into a
// sibling `.usa-tooltip__body` span and clears the trigger's own `title` (see Tooltip.test.jsx).

describe("PendingDeObligationIcon", () => {
    it("renders nothing when there is no pending de-obligation", () => {
        render(<PendingDeObligationIcon budgetLine={{ amount: 500000, requested_de_obligation_amount: null }} />);

        expect(screen.queryByAltText("Pending de-obligation")).not.toBeInTheDocument();
    });

    it("uses the current amount as the original on a line's first pending de-obligation", () => {
        render(
            <PendingDeObligationIcon
                budgetLine={{ amount: 500000, requested_de_obligation_amount: 100000, original_obligated_amount: null }}
            />
        );

        expect(screen.getByAltText("Pending de-obligation")).toBeInTheDocument();
        expect(document.querySelector(".usa-tooltip__body")).toHaveTextContent(
            "Original obligated amount was $500,000.00 with $100,000.00 de-obligated in a modification"
        );
    });

    it("uses the line's true original -- not the already-reduced current amount -- on a repeat de-obligation (OPS-6489 regression guard)", () => {
        // A line already de-obligated once (original_obligated_amount set, amount already reduced
        // to 400,000) now has a second pending de-obligation of 50,000.
        render(
            <PendingDeObligationIcon
                budgetLine={{
                    amount: 400000,
                    requested_de_obligation_amount: 50000,
                    original_obligated_amount: 500000
                }}
            />
        );

        expect(document.querySelector(".usa-tooltip__body")).toHaveTextContent(
            "Original obligated amount was $500,000.00 with $50,000.00 de-obligated in a modification"
        );
    });
});
