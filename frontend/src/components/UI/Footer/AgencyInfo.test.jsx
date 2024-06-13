import { render, screen } from "@testing-library/react";
import AgencyInfo from "./AgencyInfo";

describe("AgencyInfo", () => {
    it("should render the agency info", () => {
        render(<AgencyInfo />);

        expect(screen.getByText(/opre/i)).toBeInTheDocument();
    });
});
