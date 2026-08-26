import { Provider } from "react-redux";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "../../../tests/mocks";
import { setupStore } from "../../../store";

const navigateMock = vi.fn();
const useLocationMock = vi.fn();
const setAlertMock = vi.fn();
const hasStateChangedMock = vi.fn();
const setIsCancellingMock = vi.fn();
const useEditAgreementMock = vi.fn();
const useEditAgreementDispatchMock = vi.fn();
const useSetStateMock = vi.fn();
const useUpdateAgreementMock = vi.fn();
const scrollToCenterMock = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useLocation: () => useLocationMock(),
        useNavigate: () => navigateMock
    };
});

vi.mock("../../../helpers/scrollToCenter.helper", () => ({
    scrollToCenter: (...args) => scrollToCenterMock(...args)
}));

vi.mock("../../../hooks/use-alert.hooks", () => ({
    __esModule: true,
    default: () => ({ setAlert: setAlertMock })
}));

vi.mock("../../../hooks/useHasStateChanged.hooks", () => ({
    __esModule: true,
    default: (...args) => hasStateChangedMock(...args)
}));

vi.mock("../../../hooks/useNavigationBlocker.hooks", () => ({
    __esModule: true,
    default: () => ({
        showBlockerModal: false,
        setShowBlockerModal: vi.fn(),
        blockerModalProps: {},
        setIsCancelling: setIsCancellingMock
    })
}));

vi.mock("../../../hooks/user.hooks", () => ({
    useIsUserBudgetTeam: () => false
}));

vi.mock("./AgreementEditorContext.hooks", () => ({
    useEditAgreement: () => useEditAgreementMock(),
    useEditAgreementDispatch: () => useEditAgreementDispatchMock(),
    useSetState: (key) => useSetStateMock(key),
    useUpdateAgreement: (key) => useUpdateAgreementMock(key)
}));

import useAgreementEditForm from "./AgreementEditForm.hooks";

const renderUseAgreementEditForm = () => {
    const store = setupStore({});
    return renderHook(
        () => useAgreementEditForm(false, false, vi.fn(), vi.fn(), vi.fn(), false, true, vi.fn(), undefined, undefined),
        {
            wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
        }
    );
};

describe("useAgreementEditForm - project pagination regression (GH #6142)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useLocationMock.mockReturnValue({ pathname: "/agreements/review/1/edit" });
        useEditAgreementDispatchMock.mockReturnValue(vi.fn());
        useSetStateMock.mockReturnValue(vi.fn());
        useUpdateAgreementMock.mockReturnValue(vi.fn());
        hasStateChangedMock.mockReturnValue(false);
        useEditAgreementMock.mockReturnValue({
            agreement: { id: 1, agreement_type: "CONTRACT", name: "", team_members: [] },
            selected_project: {},
            selected_procurement_shop: {},
            selected_product_service_code: {},
            selected_project_officer: {},
            selected_alternate_project_officer: {}
        });
    });

    afterEach(() => {
        server.resetHandlers();
    });

    it("loads every project across multiple pages, not just the first page", async () => {
        const page1 = Array.from({ length: 50 }, (_, i) => ({ id: i + 1, title: `Project ${i + 1}` }));
        const page2 = [{ id: 51, title: "Project 51" }];

        server.use(
            http.get("*/api/v1/projects/", ({ request }) => {
                const url = new URL(request.url);
                const offset = parseInt(url.searchParams.get("offset") ?? "0");
                if (offset === 0) {
                    return HttpResponse.json({ data: page1, count: 51, limit: 50, offset: 0 });
                }
                return HttpResponse.json({ data: page2, count: 51, limit: 50, offset: 50 });
            })
        );

        const { result } = renderUseAgreementEditForm();

        await waitFor(() => expect(result.current.projects).toHaveLength(51));
        expect(result.current.projects[50].id).toBe(51);
    });
});
