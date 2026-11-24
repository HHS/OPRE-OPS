import { configureStore } from "@reduxjs/toolkit";
import { act, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EditAgreement from "./EditAgreement";

const mockAgreement = { id: 42, name: "Agreement 42", budget_line_items: [], _meta: { isEditable: true } };

let mockAgreementResult;
let mockServicesComponentsResult;
let mockGrantNumbersResult;

vi.mock("../../api/opsAPI", () => ({
    useGetAgreementByIdQuery: () => mockAgreementResult,
    useGetServicesComponentsListQuery: () => mockServicesComponentsResult,
    useGetGrantNumbersListQuery: () => mockGrantNumbersResult
}));

const navigateMock = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => ({
    ...(await importOriginal()),
    useNavigate: () => navigateMock
}));

vi.mock("../../api/getUser", () => ({ getUser: vi.fn().mockResolvedValue({}) }));

vi.mock("../../App", () => ({ default: ({ children }) => <div>{children}</div> }));

vi.mock("../../components/Agreements/AgreementEditor/AgreementEditorContext", () => ({
    EditAgreementProvider: ({ children }) => <div data-testid="edit-agreement-provider">{children}</div>
}));

vi.mock("./CreateEditAgreement", () => ({ default: () => <div data-testid="create-edit-agreement" /> }));

// Stand-in for the RTK Query slice, so a test can mark a request as pending.
const idleOpsApi = { queries: {}, mutations: {} };
const opsApiReducer = (state = idleOpsApi, action) => (action.type === "test/setOpsApi" ? action.payload : state);

const buildStore = () => configureStore({ reducer: { opsApi: opsApiReducer } });

const renderPage = (store = buildStore()) => {
    const page = () => (
        <Provider store={store}>
            <MemoryRouter initialEntries={["/agreements/edit/42"]}>
                <Routes>
                    <Route
                        path="/agreements/edit/:id"
                        element={<EditAgreement />}
                    />
                </Routes>
            </MemoryRouter>
        </Provider>
    );
    const utils = render(page());
    return { ...utils, store, rerenderPage: () => utils.rerender(page()) };
};

describe("EditAgreement", () => {
    beforeEach(() => {
        navigateMock.mockReset();
        mockAgreementResult = { data: mockAgreement, error: undefined, isLoading: false, isFetching: false };
        mockServicesComponentsResult = { data: [], error: undefined, isLoading: false, isFetching: false };
        mockGrantNumbersResult = { data: [], error: undefined, isLoading: false, isFetching: false };
    });

    it("mounts the editor once its data has loaded", () => {
        renderPage();

        expect(screen.getByTestId("edit-agreement-provider")).toBeInTheDocument();
    });

    // The editor seeds its draft once on mount. This page refetches on every visit, so with cached data the
    // queries report isLoading false while still fetching; mounting then would freeze the cached draft.
    it.each([
        ["the agreement", () => (mockAgreementResult = { ...mockAgreementResult, isFetching: true })],
        [
            "the services components",
            () => (mockServicesComponentsResult = { ...mockServicesComponentsResult, isFetching: true })
        ],
        ["the grant numbers", () => (mockGrantNumbersResult = { ...mockGrantNumbersResult, isFetching: true })]
    ])("waits while %s refetch before mounting the editor", (_label, startRefetch) => {
        startRefetch();
        const { rerenderPage } = renderPage();

        expect(screen.queryByTestId("edit-agreement-provider")).not.toBeInTheDocument();
        expect(screen.getByText("Loading...")).toBeInTheDocument();

        mockAgreementResult = { ...mockAgreementResult, isFetching: false };
        mockServicesComponentsResult = { ...mockServicesComponentsResult, isFetching: false };
        mockGrantNumbersResult = { ...mockGrantNumbersResult, isFetching: false };
        rerenderPage();

        expect(screen.getByTestId("edit-agreement-provider")).toBeInTheDocument();
    });

    // RTK Query holds a refetch while any other request in the slice is in flight.
    it("waits while any other API request is pending before mounting the editor", () => {
        const store = buildStore();
        store.dispatch({
            type: "test/setOpsApi",
            payload: { queries: { "getNotificationsByUserId(1)": { status: "pending" } }, mutations: {} }
        });
        renderPage(store);

        expect(screen.queryByTestId("edit-agreement-provider")).not.toBeInTheDocument();

        act(() => store.dispatch({ type: "test/setOpsApi", payload: idleOpsApi }));

        expect(screen.getByTestId("edit-agreement-provider")).toBeInTheDocument();
    });

    // Saving starts refetches while the save is still running; unmounting the editor would drop it.
    it("keeps the editor mounted when a refetch starts", () => {
        const { rerenderPage } = renderPage();
        expect(screen.getByTestId("edit-agreement-provider")).toBeInTheDocument();

        mockAgreementResult = { ...mockAgreementResult, isFetching: true };
        rerenderPage();

        expect(screen.getByTestId("edit-agreement-provider")).toBeInTheDocument();
    });

    it("still sends a failed load to the error page", () => {
        mockAgreementResult = { data: undefined, error: { status: 500 }, isLoading: false, isFetching: false };
        renderPage();

        expect(navigateMock).toHaveBeenCalledWith("/error");
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
        expect(screen.queryByTestId("edit-agreement-provider")).not.toBeInTheDocument();
    });

    // If a request hangs, the page keeps waiting; tell the user how to get out of it.
    it("tells the user how to recover when the agreement takes too long", () => {
        vi.useFakeTimers();
        try {
            mockAgreementResult = { ...mockAgreementResult, isFetching: true };
            renderPage();
            expect(screen.getByRole("status")).toBeEmptyDOMElement();

            act(() => vi.advanceTimersByTime(10000));

            expect(screen.getByRole("status")).toHaveTextContent(/still loading/i);
            expect(screen.getByRole("status")).toHaveTextContent(/refresh the page/i);
            expect(screen.getByRole("heading", { level: 2, name: "Still loading" })).toBeInTheDocument();
        } finally {
            vi.useRealTimers();
        }
    });
});
