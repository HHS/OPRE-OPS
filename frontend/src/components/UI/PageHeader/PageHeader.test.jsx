import { render, screen } from "@testing-library/react";
import PageHeader from "./PageHeader";

describe("PageHeader", () => {
    it("should render the Page Header", () => {
        render(
            <PageHeader
                title="Test Title"
                subTitle="Test Subtitle"
            />
        );
        expect(screen.getByText("Test Title")).toBeInTheDocument();
        expect(screen.getByText("Test Subtitle")).toBeInTheDocument();
    }),
        it("should render the Page Header without a subtitle", () => {
            render(<PageHeader title="Test Title" />);
            expect(screen.getByText("Test Title")).toBeInTheDocument();
        });
});
