import { render, screen } from "@testing-library/react";
import NavFooter from "./NavFooter";

describe("NaVFooter", () => {
    it("should render the footer nav links", () => {
        render(<NavFooter />);

        expect(screen.getByText(/documentation/i)).toBeInTheDocument();
        expect(screen.getByText(/features/i)).toBeInTheDocument();
        expect(screen.getByText(/getting started/i)).toBeInTheDocument();
        expect(screen.getByText(/about/i)).toBeInTheDocument();
    });
});
