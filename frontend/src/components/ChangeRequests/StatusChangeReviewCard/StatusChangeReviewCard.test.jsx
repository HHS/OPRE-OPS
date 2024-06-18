import { render, screen } from "@testing-library/react";
import StatusChangeReviewCard from "./StatusChangeReviewCard";

describe("StatusChangeReviewCard", () => {
    it.todo("should render the StatusChangeReviewCard component", () => {
        render(
            <StatusChangeReviewCard
                agreementId={1}
                bliId={123}
                key={1}
            />
        );
        expect(screen.getByRole("heading", { name: "Status Change" })).toBeInTheDocument();
    });
});
