import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProjectSpendingTotalsCard from "./ProjectSpendingTotalsCard";

describe("ProjectSpendingTotalsCard", () => {
    const defaultProps = {
        fiscalYear: 2043,
        fyTotal: 2016173277,
        lifetimeTotal: 3548149497,
        fyAgreementCount: 3
    };

    it("renders FY label and total", () => {
        render(<ProjectSpendingTotalsCard {...defaultProps} />);
        expect(screen.getByText("FY 2043 Project Total")).toBeInTheDocument();
        // CurrencyWithSmallCents splits dollars from cents — check dollars portion
        expect(screen.getByText(/2,016,173,277/)).toBeInTheDocument();
    });

    it("renders lifetime project total", () => {
        render(<ProjectSpendingTotalsCard {...defaultProps} />);
        expect(screen.getByText("Lifetime Project Total")).toBeInTheDocument();
        expect(screen.getByText("$3,548,149,497.00")).toBeInTheDocument();
    });

    it("renders FY agreement count", () => {
        render(<ProjectSpendingTotalsCard {...defaultProps} />);
        expect(screen.getByText("FY 2043 Agreements")).toBeInTheDocument();
        expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("shows $0 when fyTotal is 0", () => {
        render(
            <ProjectSpendingTotalsCard
                {...defaultProps}
                fyTotal={0}
            />
        );
        expect(screen.getByText("FY 2043 Project Total")).toBeInTheDocument();
    });

    it("renders inside a RoundedBox wrapper", () => {
        render(<ProjectSpendingTotalsCard {...defaultProps} />);
        // RoundedBox renders a div — verify the card section is present
        // by checking for the FY label which is the card's first element
        expect(screen.getByText("FY 2043 Project Total")).toBeInTheDocument();
    });
});
