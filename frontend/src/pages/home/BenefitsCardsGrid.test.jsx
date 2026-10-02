import { render, screen } from "@testing-library/react";
import BenefitsCardsGrid from "./BenefitsCardsGrid";

describe("BenefitsCardsGrid", () => {
    it("should render all benefit cards", () => {
        render(<BenefitsCardsGrid />);

        expect(screen.getByText("Transparency")).toBeInTheDocument();
        expect(screen.getByText("Data visualization")).toBeInTheDocument();
        expect(screen.getByText("Autonomy")).toBeInTheDocument();
        expect(screen.getByText("Built-in approvals")).toBeInTheDocument();
        expect(screen.getByText("Real-time planning")).toBeInTheDocument();
    });
});
