import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const triggerGetAgreementsMock = vi.fn();
const unwrapMock = vi.fn();
const updateAgreementMock = vi.fn();
const deleteAgreementMock = vi.fn();
const navigateMock = vi.fn();
const setAlertMock = vi.fn();
const useEditAgreementMock = vi.fn();
const useEditAgreementDispatchMock = vi.fn();
const useSetStateMock = vi.fn();
const useUpdateAgreementMock = vi.fn();
const useSelectorMock = vi.fn();
const useLocationMock = vi.fn();
const hasStateChangedMock = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useLocation: () => useLocationMock(),
        useNavigate: () => navigateMock
    };
});

vi.mock("react-redux", () => ({
    useSelector: (selector) => useSelectorMock(selector)
}));

vi.mock("../../../api/opsAPI", () => ({
    useDeleteAgreementMutation: () => [deleteAgreementMock],
    useGetProjectsQuery: () => ({ data: { projects: [] }, error: null, isLoading: false }),
    useGetProductServiceCodesQuery: () => ({ data: [], error: null, isLoading: false }),
    useLazyGetAgreementsQuery: () => [triggerGetAgreementsMock],
    useUpdateAgreementMutation: () => [updateAgreementMock]
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
        setIsCancelling: vi.fn()
    })
}));

vi.mock("./AgreementEditorContext.hooks", () => ({
    useEditAgreement: () => useEditAgreementMock(),
    useEditAgreementDispatch: () => useEditAgreementDispatchMock(),
    useSetState: (key) => useSetStateMock(key),
    useUpdateAgreement: (key) => useUpdateAgreementMock(key)
}));

import useAgreementEditForm from "./AgreementEditForm.hooks";

const makeAgreement = (overrides = {}) => ({
    id: undefined,
    agreement_type: "CONTRACT",
    name: "",
    nick_name: undefined,
    project_id: undefined,
    team_members: [],
    ...overrides
});

const makeEditState = (agreementOverrides = {}) => ({
    agreement: makeAgreement(agreementOverrides),
    selected_project: {},
    selected_procurement_shop: {},
    selected_product_service_code: {},
    selected_project_officer: {},
    selected_alternate_project_officer: {}
});

const renderUseAgreementEditForm = (args = {}) => {
    const defaults = {
        isAgreementAwarded: false,
        areAnyBudgetLinesPlanned: false,
        setHasAgreementChanged: vi.fn(),
        goBack: vi.fn(),
        goToNext: vi.fn(),
        isReviewMode: false,
        isEditMode: false,
        setIsEditMode: vi.fn(),
        selectedAgreementId: undefined,
        cancelHeading: undefined
    };
    const merged = { ...defaults, ...args };
    return renderHook(() =>
        useAgreementEditForm(
            merged.isAgreementAwarded,
            merged.areAnyBudgetLinesPlanned,
            merged.setHasAgreementChanged,
            merged.goBack,
            merged.goToNext,
            merged.isReviewMode,
            merged.isEditMode,
            merged.setIsEditMode,
            merged.selectedAgreementId,
            merged.cancelHeading
        )
    );
};

const setLazyQueryResult = (count) => {
    unwrapMock.mockResolvedValueOnce({ count, agreements: [] });
    triggerGetAgreementsMock.mockReturnValueOnce({ unwrap: unwrapMock });
};

describe("useAgreementEditForm uniqueness checks", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useLocationMock.mockReturnValue({ pathname: "/agreements/create" });
        useSelectorMock.mockReturnValue(false);
        hasStateChangedMock.mockReturnValue(false);
        useEditAgreementDispatchMock.mockReturnValue(vi.fn());
        useSetStateMock.mockReturnValue(vi.fn());
        useUpdateAgreementMock.mockReturnValue(vi.fn());
        useEditAgreementMock.mockReturnValue(makeEditState());
    });

    it("clears the title error when the value is empty", async () => {
        useEditAgreementMock.mockReturnValue(makeEditState({ agreement_type: "CONTRACT" }));
        const { result } = renderUseAgreementEditForm();

        await act(async () => {
            result.current.checkUniqueOnBlur("name", "   ");
        });

        // No API call for empty/whitespace input
        expect(triggerGetAgreementsMock).not.toHaveBeenCalled();
        expect(result.current.uniquenessErrors.name).toEqual([]);
    });

    it("skips the title check when no agreement_type is selected", async () => {
        useEditAgreementMock.mockReturnValue(makeEditState({ agreement_type: undefined }));
        const { result } = renderUseAgreementEditForm();

        await act(async () => {
            result.current.checkUniqueOnBlur("name", "Some Title");
        });

        expect(triggerGetAgreementsMock).not.toHaveBeenCalled();
    });

    it("sets a duplicate-title error when a conflict is found in create mode", async () => {
        useEditAgreementMock.mockReturnValue(makeEditState({ agreement_type: "CONTRACT" }));
        setLazyQueryResult(1);

        const { result } = renderUseAgreementEditForm();

        await act(async () => {
            await result.current.checkUniqueOnBlur.flush();
            result.current.checkUniqueOnBlur("name", "Existing Title");
            await result.current.checkUniqueOnBlur.flush();
        });

        await waitFor(() => {
            expect(result.current.uniquenessErrors.name).toEqual(["This title already exists. Try a different one"]);
        });
        expect(triggerGetAgreementsMock).toHaveBeenCalledWith({
            filters: {
                agreementName: [{ name: "Existing Title" }],
                agreementType: [{ type: "CONTRACT" }]
            },
            page: 0,
            limit: 1
        });
    });

    it("does not flag the current agreement as a duplicate of itself in edit mode", async () => {
        useEditAgreementMock.mockReturnValue(
            makeEditState({
                id: 42,
                agreement_type: "CONTRACT",
                name: "My Title"
            })
        );
        setLazyQueryResult(1);

        const { result } = renderUseAgreementEditForm({ isEditMode: true });

        await act(async () => {
            result.current.checkUniqueOnBlur("name", "My Title");
            await result.current.checkUniqueOnBlur.flush();
        });

        await waitFor(() => {
            expect(result.current.uniquenessErrors.name).toEqual([]);
        });
    });

    it("flags a conflict in edit mode when the title matches a different agreement", async () => {
        useEditAgreementMock.mockReturnValue(
            makeEditState({
                id: 42,
                agreement_type: "CONTRACT",
                name: "Original Title"
            })
        );
        setLazyQueryResult(1);

        const { result } = renderUseAgreementEditForm({ isEditMode: true });

        await act(async () => {
            result.current.checkUniqueOnBlur("name", "Different Existing Title");
            await result.current.checkUniqueOnBlur.flush();
        });

        await waitFor(() => {
            expect(result.current.uniquenessErrors.name).toEqual(["This title already exists. Try a different one"]);
        });
    });

    it("sets a duplicate-nickname error when a conflict is found", async () => {
        useEditAgreementMock.mockReturnValue(makeEditState({ agreement_type: "CONTRACT" }));
        setLazyQueryResult(1);

        const { result } = renderUseAgreementEditForm();

        await act(async () => {
            result.current.checkUniqueOnBlur("nick_name", "Taken");
            await result.current.checkUniqueOnBlur.flush();
        });

        await waitFor(() => {
            expect(result.current.uniquenessErrors.nick_name).toEqual([
                "This nickname already exists. Try a different one"
            ]);
        });
        expect(triggerGetAgreementsMock).toHaveBeenCalledWith({
            filters: { nickName: ["Taken"] },
            page: 0,
            limit: 1
        });
    });

    it("clears errors and does not throw when the API call fails", async () => {
        useEditAgreementMock.mockReturnValue(makeEditState({ agreement_type: "CONTRACT" }));
        unwrapMock.mockRejectedValueOnce(new Error("network down"));
        triggerGetAgreementsMock.mockReturnValueOnce({ unwrap: unwrapMock });

        const { result } = renderUseAgreementEditForm();

        await act(async () => {
            result.current.checkUniqueOnBlur("name", "Anything");
            await result.current.checkUniqueOnBlur.flush();
        });

        await waitFor(() => {
            expect(result.current.uniquenessErrors.name).toEqual([]);
        });
    });

    it("disables the Continue button while uniqueness errors exist", async () => {
        useEditAgreementMock.mockReturnValue(
            makeEditState({
                agreement_type: "CONTRACT",
                name: "Existing Title",
                project_id: 5
            })
        );
        setLazyQueryResult(1);

        const { result } = renderUseAgreementEditForm();

        await act(async () => {
            result.current.checkUniqueOnBlur("name", "Existing Title");
            await result.current.checkUniqueOnBlur.flush();
        });

        await waitFor(() => {
            expect(result.current.shouldDisableBtn).toBe(true);
        });
    });
});
