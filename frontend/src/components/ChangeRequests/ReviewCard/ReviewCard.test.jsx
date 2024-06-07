import { render, screen } from "@testing-library/react";
import ReviewCard from "./ReviewCard";
import { useGetAgreementByIdQuery } from "../../../api/opsAPI";
import { vi } from "vitest";

vi.mock("../../../api/opsAPI");
describe("ReviewCard", () => {
    const initialProps = {
        type: "budget_line_item_change_request",
        agreementId: 1,
        actionIcons: false,
        requesterName: "Jane Doe",
        requestDate: "2021-10-01"
    };
    it("should render the ReviewCard component", () => {
        useGetAgreementByIdQuery.mockReturnValue({ data: { display_name: "TBD" } });
        render(<ReviewCard {...initialProps} />);

        const type = screen.getByText("Budget Change");
        const agreementName = screen.getByText("TBD");
        const requesterName = screen.getByText("Jane Doe");
        const requestDate = screen.getByText("2021-10-01");
        const actionIcons = screen.queryByText("icons");

        expect(type).toBeInTheDocument();
        expect(agreementName).toBeInTheDocument();
        expect(requesterName).toBeInTheDocument();
        expect(requestDate).toBeInTheDocument();
        expect(actionIcons).not.toBeInTheDocument();
    });
    it.todo("should render the ReviewCard component with action icons");
    it.todo('should render the ReviewCard component with a type of "type"');
});
