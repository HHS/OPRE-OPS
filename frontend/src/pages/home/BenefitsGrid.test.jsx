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

    it("should render the Transparency region", () => {
        render(<BenefitsGrid />);

        expect(screen.getByLabelText("Transparency")).toBeInTheDocument();
    });

    it("should render the Data visualization region", () => {
        render(<BenefitsGrid />);

        expect(screen.getByLabelText("Data visualization")).toBeInTheDocument();
    });

    it("should render the Autonomy region", () => {
        render(<BenefitsGrid />);

        expect(screen.getByLabelText("Autonomy")).toBeInTheDocument();
    });

    it("should render the Built-in approvals region", () => {
        render(<BenefitsGrid />);

        expect(screen.getByLabelText("Built-in approvals")).toBeInTheDocument();
    });

    it("should render the Real-time planning region", () => {
        render(<BenefitsGrid />);

        expect(screen.getByLabelText("Real-time planning")).toBeInTheDocument();
    });

    it("should render the flourish image", () => {
        render(<BenefitsGrid />);
        const flourishImage = screen.getByAltText("flourish");
        expect(flourishImage).toBeInTheDocument();
    });
});
