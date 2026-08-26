import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import {
    useGetAgreementsQuery,
    useGetAgreementsFilterOptionsQuery,
    useLazyGetUserQuery,
    useLazyGetAgreementsQuery
} from "../../../api/opsAPI";
import { tableSortCodes } from "../../../helpers/utils";
import store from "../../../store";
import AgreementsList from "./AgreementsList";

// Deliberately do NOT mock Table.hooks here (contrast with AgreementsList.test.jsx),
// so the real useSetSortConditions initialization is exercised.
vi.mock("../../../api/opsAPI");

vi.mock("../../../App", () => ({
    default: ({ children }) => <div data-testid="app-mock">{children}</div>
}));

vi.mock("./AgreementsTabs", () => ({
    default: () => <div data-testid="agreement-tabs">All Agreements</div>
}));

describe("AgreementsList - default sort on initial load", () => {
    it("requests agreements sorted alphabetically by name, ascending, before any header click", () => {
        useLazyGetUserQuery.mockReturnValue([vi.fn(), {}]);
        useLazyGetAgreementsQuery.mockReturnValue([vi.fn(), {}]);
        useGetAgreementsFilterOptionsQuery.mockReturnValue({ data: {} });
        useGetAgreementsQuery.mockReturnValue({
            data: { agreements: [], count: 0, limit: 10, offset: 0 },
            error: undefined,
            isLoading: false,
            isFetching: false
        });

        render(
            <Provider store={store}>
                <BrowserRouter>
                    <AgreementsList />
                </BrowserRouter>
            </Provider>
        );

        expect(useGetAgreementsQuery).toHaveBeenCalled();
        const initialCall = useGetAgreementsQuery.mock.calls[0];
        expect(initialCall[0].sortConditions).toBe(tableSortCodes.agreementCodes.AGREEMENT);
        expect(initialCall[0].sortDescending).toBe(false);
    });
});
