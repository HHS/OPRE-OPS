import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import CurrencyWithSmallCents from "./CurrencyWithSmallCents";

const renderText = (amount) => {
    const { container } = render(<CurrencyWithSmallCents amount={amount} />);
    return container.textContent;
};

describe("CurrencyWithSmallCents", () => {
    it("renders zero as '$ 0' with no cents span", () => {
        expect(renderText(0)).toBe("$ 0");
    });

    it("renders a positive whole-dollar amount with .00 cents", () => {
        expect(renderText(1234)).toBe("$ 1,234.00");
    });

    it("renders a positive amount with cents", () => {
        expect(renderText(1234.56)).toBe("$ 1,234.56");
    });

    it("renders a negative whole-dollar amount with sign before $", () => {
        expect(renderText(-1234)).toBe("-$ 1,234.00");
    });

    it("renders a negative amount with cents and sign before $", () => {
        expect(renderText(-120797640.5)).toBe("-$ 120,797,640.50");
    });

    it("preserves the sign for sub-dollar negatives", () => {
        // Regression: parseInt(-0.5) is 0, so a naive sign check would lose the minus.
        expect(renderText(-0.5)).toBe("-$ 0.50");
    });

    it("treats NaN as zero", () => {
        expect(renderText(NaN)).toBe("$ 0");
    });
});
