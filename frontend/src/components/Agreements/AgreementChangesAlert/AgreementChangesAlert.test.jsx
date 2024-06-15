import { vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AgreementChangesAlert from "./AgreementsChangesAlert";

const changeRequests = ["Change Request 1", "Change Request 2"];

describe("AgreementChangesAlert", () => {
    it("should render ", () => {
        render(
            <AgreementChangesAlert
                isAlertVisible={true}
                setIsAlertVisible={() => {}}
                changeRequests={[]}
            />
        );
        const heading = screen.getByRole("heading", { name: /in review/i });
        const message = screen.getByText(/edits pending approval/i);
        expect(heading).toBeInTheDocument();
        expect(message).toBeInTheDocument();
    });
    it("should render change requests", () => {
        render(
            <AgreementChangesAlert
                isAlertVisible={true}
                setIsAlertVisible={() => {}}
                changeRequests={changeRequests}
            />
        );
        const list = screen.getByRole("list");
        expect(list).toBeInTheDocument();
        expect(screen.getByText("Change Request 1")).toBeInTheDocument();
        expect(screen.getByText("Change Request 2")).toBeInTheDocument();
    });
    it("should be closable", async () => {
        const setIsAlertVisible = vi.fn();
        const { rerender } = render(
            <AgreementChangesAlert
                isAlertVisible={true}
                setIsAlertVisible={setIsAlertVisible}
                changeRequests={changeRequests}
            />
        );
        const close = screen.getByRole("img", { name: "close" });
        expect(close).toBeInTheDocument();
        fireEvent.click(close);
        expect(setIsAlertVisible).toHaveBeenCalledWith(false);
        // Rerender the component with the updated prop
        rerender(
            <AgreementChangesAlert
                isAlertVisible={false}
                setIsAlertVisible={setIsAlertVisible}
                changeRequests={changeRequests}
            />
        );
        // Wait for the alert to be removed from the DOM
        await waitFor(() => {
            expect(screen.queryByRole("status", { name: "alert" })).not.toBeInTheDocument();
        });
    });
});
