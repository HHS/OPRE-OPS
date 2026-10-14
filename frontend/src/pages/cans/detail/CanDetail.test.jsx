import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getCurrentFiscalYear } from "../../../helpers/utils";
import CanDetail from "./CanDetail";

vi.mock("../../../api/opsAPI", () => ({
    useGetDivisionQuery: () => ({ data: { display_name: "Division", division_director_id: 1 }, isSuccess: true })
}));
vi.mock("../../../hooks/user.hooks", () => ({ default: () => "Director Name" }));
vi.mock("../../../components/CANs/CANDetailForm", () => ({ default: () => <div>CAN detail form</div> }));
vi.mock("../../../components/CANs/CANDetailView/CANDetailView", () => ({
    default: () => <div>CAN detail view</div>
}));

const renderCanDetail = (props = {}) =>
    render(
        <CanDetail
            canId={1}
            description="Description"
            canNumber="CAN-001"
            nickname="Nickname"
            portfolioName="Portfolio"
            portfolioId={1}
            teamLeaders={[]}
            divisionId={1}
            fiscalYear={Number(getCurrentFiscalYear())}
            isBudgetTeamMember={false}
            isEditMode={false}
            toggleEditMode={() => {}}
            {...props}
        />
    );

describe("CanDetail", () => {
    it("hides the Edit button when the user is not on the Budget Team", () => {
        renderCanDetail({ isBudgetTeamMember: false });

        expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
    });

    it("renders the Edit button for Budget Team members in the current fiscal year", () => {
        renderCanDetail({ isBudgetTeamMember: true });

        expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
    });

    it("hides the Edit button for Budget Team members in a past fiscal year", () => {
        renderCanDetail({ isBudgetTeamMember: true, fiscalYear: Number(getCurrentFiscalYear()) - 1 });

        expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
    });
});
