import { render, screen } from "@testing-library/react";
import PortfolioHero from "./PortfolioHero";

describe("PortfolioHero", () => {
    it("renders the division director and deputy division director", () => {
        render(
            <PortfolioHero
                entityName="Test Portfolio"
                divisionName="Test Division"
                teamLeaders={[]}
                divisionDirector={{ id: 1, full_name: "JANE SMITH" }}
                deputyDivisionDirector={{ id: 2, full_name: "JOHN DOE" }}
            />
        );

        expect(screen.getByText("Division Director")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
        expect(screen.getByText("Deputy Division Director")).toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("renders TBD when the division director or deputy is missing", () => {
        render(
            <PortfolioHero
                entityName="Test Portfolio"
                divisionName="Test Division"
                teamLeaders={[]}
                divisionDirector={null}
                deputyDivisionDirector={null}
            />
        );

        const tbds = screen.getAllByText("TBD");
        expect(tbds).toHaveLength(3);
    });
});
