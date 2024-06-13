import { render, screen } from "@testing-library/react";
import Identifier from "./Identifier";

describe("Identifier", () => {
    it("should render the identifier info", () => {
        render(<Identifier />);

        expect(screen.getByText(/department of health & human services/i)).toBeInTheDocument();
        expect(screen.getByText(/about hhs/i)).toBeInTheDocument();
        expect(screen.getByText(/opre/i)).toBeInTheDocument();
        expect(screen.getByText(/acf/i)).toBeInTheDocument();
    });
});
