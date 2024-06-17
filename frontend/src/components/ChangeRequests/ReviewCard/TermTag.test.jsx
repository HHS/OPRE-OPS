import { render, screen } from "@testing-library/react";
import TermTag from "./TermTag";

describe("TermTag", () => {
    it("should render the TermTag component", () => {
        render(
            <TermTag
                label="Test Label"
                value="test value"
            />
        );
        const label = screen.getByText(/test label/i);
        const term = screen.getByRole("term");
        const value = screen.getByText(/test value/i);

        expect(label).toBeInTheDocument();
        expect(term).toBeInTheDocument();
        expect(value).toBeInTheDocument();
    });
});
