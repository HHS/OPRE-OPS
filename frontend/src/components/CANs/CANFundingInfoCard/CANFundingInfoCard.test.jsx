import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CANFundingInfoCard from "./CANFundingInfoCard";

describe("CANFundingInfoCard", () => {
    describe("TAS # field", () => {
        it("renders TAS # with funding.appropriation value", () => {
            const funding = {
                id: 1,
                fiscal_year: 2026,
                active_period: 1,
                fund_code: "FC-123",
                appropriation: "075-2026/2027-1234"
            };

            render(<CANFundingInfoCard funding={funding} />);

            const card = screen.getByTestId("can-funding-info-card");
            expect(within(card).getByText("TAS #")).toBeInTheDocument();
            expect(within(card).getByText("075-2026/2027-1234")).toBeInTheDocument();
        });

        it("displays TBD fallback when appropriation is null", () => {
            const funding = {
                id: 1,
                fiscal_year: 2026,
                active_period: 1,
                fund_code: "FC-123",
                appropriation: null
            };

            render(<CANFundingInfoCard funding={funding} />);

            const card = screen.getByTestId("can-funding-info-card");
            expect(within(card).getByText("TAS #")).toBeInTheDocument();

            // Find the TAS # term and verify TBD is in the adjacent description
            const allDescriptions = within(card).getAllByRole("definition");
            const allTerms = within(card).getAllByRole("term");

            // Find index of TAS # term
            const tasIndex = allTerms.findIndex((term) => term.textContent === "TAS #");
            expect(tasIndex).toBeGreaterThan(-1);

            // Verify the corresponding description shows TBD
            expect(allDescriptions[tasIndex].textContent).toBe("TBD");
        });

        it("displays TBD fallback when appropriation is undefined", () => {
            const funding = {
                id: 1,
                fiscal_year: 2026,
                active_period: 1,
                fund_code: "FC-123"
            };

            render(<CANFundingInfoCard funding={funding} />);

            const card = screen.getByTestId("can-funding-info-card");
            expect(within(card).getByText("TAS #")).toBeInTheDocument();

            const allDescriptions = within(card).getAllByRole("definition");
            const allTerms = within(card).getAllByRole("term");

            const tasIndex = allTerms.findIndex((term) => term.textContent === "TAS #");
            expect(tasIndex).toBeGreaterThan(-1);
            expect(allDescriptions[tasIndex].textContent).toBe("TBD");
        });
    });

    describe("field ordering", () => {
        it("displays TAS # in the same column as Funding Received (4th column)", () => {
            const funding = {
                id: 1,
                fiscal_year: 2026,
                active_period: 1,
                fund_code: "FC-123",
                appropriation: "075-2026/2027-1234",
                funding_received: "Direct"
            };

            render(<CANFundingInfoCard funding={funding} />);

            const card = screen.getByTestId("can-funding-info-card");

            // Get all grid columns - they're divs with class grid-col
            // eslint-disable-next-line testing-library/no-node-access
            const gridRow = card.querySelector(".grid-row");
            // eslint-disable-next-line testing-library/no-node-access
            const columns = gridRow.querySelectorAll(".grid-col, .grid-col-2");

            // The 4th column (index 3) should contain both Funding Received and TAS #
            const fourthColumn = columns[3];
            expect(within(fourthColumn).getByText("Funding Received")).toBeInTheDocument();
            expect(within(fourthColumn).getByText("TAS #")).toBeInTheDocument();
            expect(within(fourthColumn).getByText("Direct")).toBeInTheDocument();
            expect(within(fourthColumn).getByText("075-2026/2027-1234")).toBeInTheDocument();
        });

        it("displays Funding Source in the same column as Funding Method (5th column)", () => {
            const funding = {
                id: 1,
                fiscal_year: 2026,
                active_period: 1,
                fund_code: "FC-123",
                funding_method: "IAA",
                funding_source: "OPRE"
            };

            render(<CANFundingInfoCard funding={funding} />);

            const card = screen.getByTestId("can-funding-info-card");
            // eslint-disable-next-line testing-library/no-node-access
            const gridRow = card.querySelector(".grid-row");
            // eslint-disable-next-line testing-library/no-node-access
            const columns = gridRow.querySelectorAll(".grid-col, .grid-col-2");

            // The 5th column (index 4) should contain both Funding Method and Funding Source
            const fifthColumn = columns[4];
            expect(within(fifthColumn).getByText("Funding Method")).toBeInTheDocument();
            expect(within(fifthColumn).getByText("Funding Source")).toBeInTheDocument();
            expect(within(fifthColumn).getByText("IAA")).toBeInTheDocument();
            expect(within(fifthColumn).getByText("OPRE")).toBeInTheDocument();
        });

        it("displays Partner in the same column as Funding Type (6th column)", () => {
            const funding = {
                id: 1,
                fiscal_year: 2026,
                active_period: 1,
                fund_code: "FC-123",
                funding_type: "Contract",
                funding_partner: "External Partner"
            };

            render(<CANFundingInfoCard funding={funding} />);

            const card = screen.getByTestId("can-funding-info-card");
            // eslint-disable-next-line testing-library/no-node-access
            const gridRow = card.querySelector(".grid-row");
            // eslint-disable-next-line testing-library/no-node-access
            const columns = gridRow.querySelectorAll(".grid-col, .grid-col-2");

            // The 6th column (index 5) should contain both Funding Type and Partner
            const sixthColumn = columns[5];
            expect(within(sixthColumn).getByText("Funding Type")).toBeInTheDocument();
            expect(within(sixthColumn).getByText("Partner")).toBeInTheDocument();
            expect(within(sixthColumn).getByText("Contract")).toBeInTheDocument();
            expect(within(sixthColumn).getByText("External Partner")).toBeInTheDocument();
        });

        it("verifies complete field ordering across all columns", () => {
            const funding = {
                id: 1,
                fiscal_year: 2026,
                active_period: 2,
                fund_code: "FC-123",
                allowance: "Allowance Value",
                obligate_by: "2027-09-30",
                allotment: "Allotment Value",
                funding_received: "Direct",
                appropriation: "075-2026/2027-1234",
                funding_method: "IAA",
                funding_source: "OPRE",
                funding_type: "Contract",
                funding_partner: "External Partner",
                method_of_transfer: "Transfer Method"
            };

            render(<CANFundingInfoCard funding={funding} />);

            const card = screen.getByTestId("can-funding-info-card");
            // eslint-disable-next-line testing-library/no-node-access
            const gridRow = card.querySelector(".grid-row");
            // eslint-disable-next-line testing-library/no-node-access
            const columns = gridRow.querySelectorAll(".grid-col, .grid-col-2");

            // Verify we have 7 columns total
            expect(columns).toHaveLength(7);

            // Column 1: Appropriation FY, Fund Code
            const col1 = columns[0];
            expect(within(col1).getByText("Appropriation FY")).toBeInTheDocument();
            expect(within(col1).getByText("Fund Code")).toBeInTheDocument();

            // Column 2: Active Period, Allowance
            const col2 = columns[1];
            expect(within(col2).getByText("Active Period")).toBeInTheDocument();
            expect(within(col2).getByText("Allowance")).toBeInTheDocument();

            // Column 3: Obligate By, Allotment
            const col3 = columns[2];
            expect(within(col3).getByText("Obligate By")).toBeInTheDocument();
            expect(within(col3).getByText("Allotment")).toBeInTheDocument();

            // Column 4: Funding Received, TAS #
            const col4 = columns[3];
            expect(within(col4).getByText("Funding Received")).toBeInTheDocument();
            expect(within(col4).getByText("TAS #")).toBeInTheDocument();

            // Column 5: Funding Method, Funding Source
            const col5 = columns[4];
            expect(within(col5).getByText("Funding Method")).toBeInTheDocument();
            expect(within(col5).getByText("Funding Source")).toBeInTheDocument();

            // Column 6: Funding Type, Partner
            const col6 = columns[5];
            expect(within(col6).getByText("Funding Type")).toBeInTheDocument();
            expect(within(col6).getByText("Partner")).toBeInTheDocument();

            // Column 7: Method of Transfer
            const col7 = columns[6];
            expect(within(col7).getByText("Method of Transfer")).toBeInTheDocument();
        });
    });
});
