import { render, screen } from "@testing-library/react";
import ReviewChangeRequestAccordion from "./ReviewChangeRequestAccordion";

describe("ReviewChangesAccordion", () => {
    const initialProps = {
        changeType: "budget change",
        budgetLinesInReview: []
    };
    it("should render the review accordion", () => {
        render(<ReviewChangeRequestAccordion {...initialProps} />);
        expect(screen.getByText(/review changes/i)).toBeInTheDocument();
        expect(screen.getByText(/budget changes/i)).toBeInTheDocument();
    });
});
