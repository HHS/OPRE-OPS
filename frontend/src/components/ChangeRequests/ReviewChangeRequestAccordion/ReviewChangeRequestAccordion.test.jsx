import { render, screen } from "@testing-library/react";
import { changeRequests } from "../../../tests/data";
import ReviewChangeRequestAccordion from "./ReviewChangeRequestAccordion";

describe("ReviewChangesAccordion", () => {
    const initialProps = {
        changeType: "budget change",
        changeRequests: changeRequests,
        statusChangeTo: ""
    };
    it("should render the review accordion for budget change", () => {
        render(<ReviewChangeRequestAccordion {...initialProps} />);
        expect(screen.getByText(/review changes/i)).toBeInTheDocument();
        expect(screen.getByText(/budget changes/i)).toBeInTheDocument();
    });
    it("should render the review accordion for status change to planned", () => {
        render(
            <ReviewChangeRequestAccordion
                {...initialProps}
                changeType="status change"
                statusChangeTo="planned"
            />
        );
        expect(screen.getByText(/review changes/i)).toBeInTheDocument();
        expect(screen.getByText(/status changes/i)).toBeInTheDocument();
        expect(screen.getByText(/planned/i)).toBeInTheDocument;
    });
    it("should render the review accordion for status change to executing", () => {
        render(
            <ReviewChangeRequestAccordion
                {...initialProps}
                changeType="status change"
                statusChangeTo="executing"
            />
        );
        expect(screen.getByText(/review changes/i)).toBeInTheDocument();
        expect(screen.getByText(/status changes/i)).toBeInTheDocument();
        expect(screen.getByText(/executing/i)).toBeInTheDocument;
    });
});
