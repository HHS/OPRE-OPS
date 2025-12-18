import { render, screen } from "@testing-library/react";
import BenefitsGrid from "./BenefitsGrid";

describe("BenefitsGrid", () => {
    it("should render the OPS Benefits heading", () => {
        render(<BenefitsGrid />);
        expect(screen.getByText("OPS Benefits")).toBeInTheDocument();
    });

    it("should render all benefit cards", () => {
        render(<BenefitsGrid />);

        expect(screen.getByText("Transparency")).toBeInTheDocument();
        expect(screen.getByText("Data visualization")).toBeInTheDocument();
        expect(screen.getByText("Autonomy")).toBeInTheDocument();
        expect(screen.getByText("Built-in approvals")).toBeInTheDocument();
        expect(screen.getByText("Real-time planning")).toBeInTheDocument();
    });

    it("should render the flourish image", () => {
        render(<BenefitsGrid />);
        const flourishImage = screen.getByAltText("flourish");
        expect(flourishImage).toBeInTheDocument();
    });
});
