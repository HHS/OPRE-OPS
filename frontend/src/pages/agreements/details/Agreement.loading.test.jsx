import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { buildTrailState, LIST_CRUMBS } from "../../../helpers/breadcrumb.helpers";
import store from "../../../store";
import Agreement from "./Agreement";

vi.mock("../../../api/opsAPI", async (importOriginal) => ({
    ...(await importOriginal()),
    useGetAgreementByIdQuery: () => ({ data: undefined, isLoading: true, isSuccess: false }),
    useGetNotificationsByUserIdAndAgreementIdQuery: () => ({ data: [] }),
    useGetProcurementTrackersByAgreementIdQuery: () => ({ data: undefined }),
    useGetProcurementShopByIdQuery: () => ({ data: undefined })
}));
vi.mock("../../../hooks/useChangeRequests.hooks", () => ({ useChangeRequestsForAgreement: () => [] }));
vi.mock("../../../App", () => ({
    default: ({ breadCrumbName }) => <div data-testid="leaf">{String(breadCrumbName)}</div>
}));

const renderLoadingAgreement = (state) =>
    render(
        <Provider store={store}>
            <MemoryRouter initialEntries={[{ pathname: "/agreements/1", state }]}>
                <Routes>
                    <Route
                        path="/agreements/:id/*"
                        element={<Agreement />}
                    />
                </Routes>
            </MemoryRouter>
        </Provider>
    );

describe("Agreement breadcrumb leaf while the agreement loads", () => {
    it("shows the name carried by the link that opened it", () => {
        renderLoadingAgreement(buildTrailState("/agreements/1", [LIST_CRUMBS.budgetLines], "Contract #1: Long Name"));
        expect(screen.getByTestId("leaf")).toHaveTextContent(/^Contract #1: Long Name$/);
    });

    it("leaves the leaf empty instead of a placeholder when no name was carried", () => {
        renderLoadingAgreement(undefined);
        expect(screen.getByTestId("leaf")).toBeEmptyDOMElement();
    });
});
