import { render, screen } from "@testing-library/react";
import TeamLeaders from "./TeamLeaders";

describe("TeamLeaders", () => {
    it("should render team leaders when provided", () => {
        const teamLeaders = [
            { id: 1, full_name: "John Doe" },
            { id: 2, full_name: "Jane Smith" }
        ];
        render(<TeamLeaders teamLeaders={teamLeaders} />);

        expect(screen.getByText("Team Leader")).toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    it("should render TBD when team leaders array is empty", () => {
        render(<TeamLeaders teamLeaders={[]} />);

        expect(screen.getByText("Team Leader")).toBeInTheDocument();
        expect(screen.getByText("TBD")).toBeInTheDocument();
    });

    it("should not render anything when teamLeaders is undefined", () => {
        const { container } = render(<TeamLeaders teamLeaders={undefined} />);
        expect(container).toBeEmptyDOMElement();
    });

    it("should not render anything when teamLeaders is null", () => {
        const { container } = render(<TeamLeaders teamLeaders={null} />);
        expect(container).toBeEmptyDOMElement();
    });
});
