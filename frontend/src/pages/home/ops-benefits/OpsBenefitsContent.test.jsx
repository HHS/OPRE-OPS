import { render, screen } from "@testing-library/react";
import OpsBenefitsContent from "./OpsBenefitsContent";

describe("OpsBenefitsContent", () => {
    it("renders the OPS Benefits heading and subtitle", () => {
        render(<OpsBenefitsContent />);

        expect(screen.getByRole("heading", { level: 2, name: "OPS Benefits" })).toBeInTheDocument();
        expect(screen.getByText(/OPS brings everyone together/)).toBeInTheDocument();
    });

    it("renders all benefit cards", () => {
        render(<OpsBenefitsContent />);

        expect(screen.getByText("Transparency")).toBeInTheDocument();
        expect(screen.getByText("Data visualization")).toBeInTheDocument();
        expect(screen.getByText("Autonomy")).toBeInTheDocument();
        expect(screen.getByText("Built-in approvals")).toBeInTheDocument();
        expect(screen.getByText("Real-time planning")).toBeInTheDocument();
    });

    it("does not render the legacy flourish image divider", () => {
        render(<OpsBenefitsContent />);

        expect(screen.queryByAltText("flourish")).not.toBeInTheDocument();
    });
});
