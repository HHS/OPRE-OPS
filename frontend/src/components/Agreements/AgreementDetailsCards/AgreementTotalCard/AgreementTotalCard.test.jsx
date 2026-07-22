import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import AgreementTotalCard from "./AgreementTotalCard";

describe("AgreementTotalCard", () => {
    const props = { total: 1500000, subtotal: 1400000, fees: 100000, procurementShopAbbr: "GCS" };

    it("shows subtotal, fees, and procurement shop for non-grant agreements", () => {
        render(<AgreementTotalCard {...props} />);
        expect(screen.getByText("Agreement Total")).toBeInTheDocument();
        expect(screen.getByText("Agreement Subtotal")).toBeInTheDocument();
        expect(screen.getByText("Fees")).toBeInTheDocument();
        expect(screen.getByText("Procurement Shop")).toBeInTheDocument();
        expect(screen.getByText("GCS")).toBeInTheDocument();
    });

    it("shows only the total for grant agreements", () => {
        render(
            <AgreementTotalCard
                {...props}
                isGrant={true}
            />
        );
        expect(screen.getByText("Agreement Total")).toBeInTheDocument();
        expect(screen.queryByText("Agreement Subtotal")).not.toBeInTheDocument();
        expect(screen.queryByText("Fees")).not.toBeInTheDocument();
        expect(screen.queryByText("Procurement Shop")).not.toBeInTheDocument();
    });
});
