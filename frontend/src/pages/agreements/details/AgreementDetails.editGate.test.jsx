import { configureStore } from "@reduxjs/toolkit";
import { act, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AgreementDetails from "./AgreementDetails";

// Kept apart from AgreementDetails.test.js, which mocks React's useState for the whole file.

vi.mock("../../../hooks/user.hooks", () => ({
    useIsUserSuperUser: () => false,
    useCanEditByRole: () => true
}));
vi.mock("../../../components/Agreements/AgreementDetailHeader", () => ({ default: () => <div /> }));
vi.mock("./AgreementDetailsView", () => ({ default: () => <div data-testid="agreement-details-view" /> }));
vi.mock("./AgreementDetailsEdit", () => ({
    default: ({ agreement }) => <div data-testid="agreement-details-edit">name:{agreement.name}</div>
}));

// Stand-in for the RTK Query slice, so a test can mark a request as pending.
const idleOpsApi = { queries: {}, mutations: {} };
const opsApiReducer = (state = idleOpsApi, action) => (action.type === "test/setOpsApi" ? action.payload : state);

const cachedAgreement = {
    id: 7,
    name: "Old",
    agreement_type: "CONTRACT",
    budget_line_items: [],
    _meta: { isEditable: true }
};
const freshAgreement = { ...cachedAgreement, name: "New" };

// The Details editor seeds its draft once on mount, and its save PATCHes the whole draft. Entering edit mode
// while the agreement refetches (e.g. right after a save, or a revisit with cached data) would freeze the
// cached fields, so a notes-only save would send them back over the refetched ones.
describe("AgreementDetails edit gate", () => {
    let store;
    beforeEach(() => {
        store = configureStore({ reducer: { opsApi: opsApiReducer } });
    });

    const ui = (agreement, props = {}) => (
        <Provider store={store}>
            <AgreementDetails
                agreement={agreement}
                projectOfficer={{}}
                alternateProjectOfficer={{}}
                isEditMode={true}
                setIsEditMode={vi.fn()}
                setHasAgreementChanged={vi.fn()}
                isAgreementNotDeveloped={false}
                {...props}
            />
        </Provider>
    );

    it("opens the editor right away when nothing is fetching", () => {
        render(ui(freshAgreement));

        expect(screen.getByTestId("agreement-details-edit")).toHaveTextContent("name:New");
    });

    it("waits for the agreement refetch before mounting the editor", () => {
        const { rerender } = render(ui(cachedAgreement, { isAgreementFetching: true }));

        expect(screen.queryByTestId("agreement-details-edit")).not.toBeInTheDocument();
        expect(screen.getByRole("status")).toHaveTextContent(/loading/i);

        rerender(ui(freshAgreement, { isAgreementFetching: false }));

        expect(screen.getByTestId("agreement-details-edit")).toHaveTextContent("name:New");
    });

    // RTK Query holds a refetch while any other request in the slice is in flight.
    it("waits while any other API request is pending before mounting the editor", () => {
        store.dispatch({
            type: "test/setOpsApi",
            payload: { queries: { "getNotificationsByUserId(1)": { status: "pending" } }, mutations: {} }
        });
        const { rerender } = render(ui(cachedAgreement));

        expect(screen.queryByTestId("agreement-details-edit")).not.toBeInTheDocument();

        rerender(ui(freshAgreement));
        act(() => store.dispatch({ type: "test/setOpsApi", payload: idleOpsApi }));

        expect(screen.getByTestId("agreement-details-edit")).toHaveTextContent("name:New");
    });

    // Saving starts a refetch while the save is still running; unmounting the editor would drop it.
    it("keeps the editor mounted when a refetch starts", () => {
        const { rerender } = render(ui(freshAgreement));

        rerender(ui(freshAgreement, { isAgreementFetching: true }));

        expect(screen.getByTestId("agreement-details-edit")).toBeInTheDocument();
    });

    it("shows the read-only view outside edit mode, whatever is fetching", () => {
        render(ui(cachedAgreement, { isEditMode: false, isAgreementFetching: true }));

        expect(screen.getByTestId("agreement-details-view")).toBeInTheDocument();
        expect(screen.getByRole("status")).toBeEmptyDOMElement();
    });

    // Screen readers reliably announce text added to a live region that's already on the page, so the region
    // must exist before the loading text is put in it.
    it("puts the loading text into a live region that was already on the page", () => {
        const { rerender } = render(ui(cachedAgreement, { isEditMode: false }));
        const region = screen.getByRole("status");
        expect(region).toBeEmptyDOMElement();

        rerender(ui(cachedAgreement, { isAgreementFetching: true }));

        expect(screen.getByRole("status")).toBe(region);
        expect(region).toHaveTextContent("Loading the latest agreement details...");
    });

    it("tells the user how to recover when the agreement takes too long", () => {
        vi.useFakeTimers();
        try {
            render(ui(cachedAgreement, { isAgreementFetching: true }));
            expect(screen.getByRole("status")).not.toHaveTextContent(/still loading/i);

            act(() => vi.advanceTimersByTime(10000));

            expect(screen.getByRole("status")).toHaveTextContent(/still loading/i);
            expect(screen.getByRole("status")).toHaveTextContent(/refresh the page/i);
            expect(screen.getByRole("heading", { level: 3, name: "Still loading" })).toBeInTheDocument();
        } finally {
            vi.useRealTimers();
        }
    });
});
