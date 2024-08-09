import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import AgreementChangesResponseAlert from "./AgreementChangesResponseAlert";

const changeRequests = [{
    id: 1,
    change_request: {
        status: "APPROVED",
        budget_line_item_id: "123456",
        requested_change_diff: {
            status: { old: "planned", new: "executing"}
        }
    }
},
{
    id: 2,
    change_request: {
        status: "APPROVED",
        budget_line_item_id: "132456",
        requested_change_diff: {
            status: { old: "planned", new: "executing"}
        }
    }
}];

describe("AgreementChangesAlert", () => {
    it("should render ", () => {
        render(
            <AgreementChangesResponseAlert
                isApproveAlertVisible={true}
                isDeclineAlertVisible={true}
                setIsApproveAlertVisible={() => {}}
                setIsDeclineAlertVisible={() => {}}
                changeRequests={[]}
            />
        );
    });
    it("should render change requests", () => {
        render(
            <AgreementChangesResponseAlert
                isApproveAlertVisible={true}
                isDeclineAlertVisible={true}
                setIsApproveAlertVisible={() => {}}
                setIsDeclineAlertVisible={() => {}}
                changeRequests={changeRequests}
            />
        );
        const list = screen.getByRole("list");
        expect(list).toBeInTheDocument();
        expect(screen.getByText(/Your changes have been successfully approved by your Division Director/)).toBeInTheDocument();
    });
    it("should be closable", async () => {
        const setIsAlertVisible = vi.fn();
        const { rerender } = render(
            <AgreementChangesResponseAlert
                isApproveAlertVisible={true}
                isDeclineAlertVisible={true}
                setIsApproveAlertVisible={setIsAlertVisible}
                setIsDeclineAlertVisible={setIsAlertVisible}
                changeRequests={changeRequests}
            />
        );
        const close = screen.getByRole("img", { name: "close" });
        expect(close).toBeInTheDocument();
        fireEvent.click(close);
        expect(setIsAlertVisible).toHaveBeenCalledWith(false);
        // Rerender the component with the updated prop
        rerender(
            <AgreementChangesResponseAlert
                isApproveAlertVisible={true}
                isDeclineAlertVisible={true}
                setIsApproveAlertVisible={setIsAlertVisible}
                setIsDeclineAlertVisible={setIsAlertVisible}
                changeRequests={changeRequests}
            />
        );
        // Wait for the alert to be removed from the DOM
        await waitFor(() => {
            expect(screen.queryByRole("status", { name: "alert" })).not.toBeInTheDocument();
        });
    });
});
