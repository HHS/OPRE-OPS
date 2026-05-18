import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import useAgreementEditForm from "./AgreementEditForm.hooks";

const navigateMock = vi.fn();
const setAlertMock = vi.fn();
const addAgreementMock = vi.fn();
const updateAgreementMock = vi.fn();
const deleteAgreementMock = vi.fn();
const dispatchMock = vi.fn();

let editAgreementMockData;

vi.mock("react-redux", () => ({
    useSelector: () => ({ is_superuser: false })
}));

vi.mock("react-router-dom", () => ({
    useNavigate: () => navigateMock,
    useLocation: () => ({ pathname: "/agreements/create" })
}));

vi.mock("../../../api/opsAPI", () => ({
    useAddAgreementMutation: () => [addAgreementMock],
    useUpdateAgreementMutation: () => [updateAgreementMock],
    useDeleteAgreementMutation: () => [deleteAgreementMock],
    useGetProjectsQuery: () => ({ data: { projects: [] }, error: null, isLoading: false }),
    useGetProductServiceCodesQuery: () => ({ data: [], error: null, isLoading: false })
}));

vi.mock("../../../hooks/use-alert.hooks", () => ({
    __esModule: true,
    default: () => ({ setAlert: setAlertMock })
}));

vi.mock("../../../hooks/useHasStateChanged.hooks", () => ({
    __esModule: true,
    default: () => true
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
    useEditAgreement: () => editAgreementMockData,
    useEditAgreementDispatch: () => dispatchMock,
    useSetState: () => vi.fn(),
    useUpdateAgreement: () => vi.fn()
}));

vi.mock("./AgreementEditFormSuite", () => {
    const mockSuite = vi.fn();
    mockSuite.run = vi.fn();
    mockSuite.get = vi.fn(() => ({
        getErrors: vi.fn(() => []),
        hasErrors: vi.fn(() => false),
        isValid: vi.fn(() => true)
    }));
    mockSuite.reset = vi.fn();
    return { default: mockSuite };
});

vi.mock("../../../helpers/agreement.helpers.js", () => ({
    calculateAgreementTotal: vi.fn(() => 0),
    cleanAgreementForApi: vi.fn((data) => ({ id: data.id, cleanData: { ...data } })),
    formatTeamMember: vi.fn((tm) => tm)
}));

vi.mock("../../../helpers/scrollToTop.helper", () => ({
    scrollToTop: vi.fn()
}));

vi.mock("vest/classnames", () => ({
    __esModule: true,
    default: () => vi.fn()
}));

describe("useAgreementEditForm - handleDraft", () => {
    const mockSetHasAgreementChanged = vi.fn();
    const mockGoBack = vi.fn();
    const mockGoToNext = vi.fn();
    const mockSetIsEditMode = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        addAgreementMock.mockReturnValue({ unwrap: () => Promise.resolve({ id: 1 }) });
        updateAgreementMock.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    });

    it("calls addAgreement when agreement has no id (new draft)", async () => {
        editAgreementMockData = {
            agreement: {
                name: "Test Agreement",
                agreement_type: "CONTRACT",
                team_members: [{ id: 1, full_name: "Test User" }],
                requesting_agency: { id: 1 },
                servicing_agency: { id: 2 },
                _meta: { immutable_awarded_fields: [] }
            },
            selected_project: { id: 1 },
            selected_procurement_shop: null,
            selected_product_service_code: null,
            selected_project_officer: null,
            selected_alternate_project_officer: null
        };

        const { result } = renderHook(() =>
            useAgreementEditForm(
                false,
                false,
                mockSetHasAgreementChanged,
                mockGoBack,
                mockGoToNext,
                false,
                false,
                mockSetIsEditMode,
                null,
                null
            )
        );

        await act(async () => {
            await result.current.handleDraft();
        });

        expect(addAgreementMock).toHaveBeenCalled();
        expect(setAlertMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "success",
                heading: "Agreement Draft Saved"
            })
        );
        expect(navigateMock).toHaveBeenCalledWith("/agreements");
    });

    it("does NOT call addAgreement when agreement has an id (existing agreement)", async () => {
        editAgreementMockData = {
            agreement: {
                id: 123,
                name: "Existing Agreement",
                agreement_type: "CONTRACT",
                team_members: [{ id: 1, full_name: "Test User" }],
                requesting_agency: { id: 1 },
                servicing_agency: { id: 2 },
                _meta: { immutable_awarded_fields: [] }
            },
            selected_project: { id: 1 },
            selected_procurement_shop: null,
            selected_product_service_code: null,
            selected_project_officer: null,
            selected_alternate_project_officer: null
        };

        const { result } = renderHook(() =>
            useAgreementEditForm(
                false,
                false,
                mockSetHasAgreementChanged,
                mockGoBack,
                mockGoToNext,
                false,
                false,
                mockSetIsEditMode,
                null,
                null
            )
        );

        await act(async () => {
            await result.current.handleDraft();
        });

        expect(addAgreementMock).not.toHaveBeenCalled();
        expect(navigateMock).toHaveBeenCalledWith("/agreements");
    });

    it("shows error alert when addAgreement fails", async () => {
        editAgreementMockData = {
            agreement: {
                name: "Test Agreement",
                agreement_type: "CONTRACT",
                team_members: [],
                requesting_agency: null,
                servicing_agency: null,
                _meta: { immutable_awarded_fields: [] }
            },
            selected_project: { id: 1 },
            selected_procurement_shop: null,
            selected_product_service_code: null,
            selected_project_officer: null,
            selected_alternate_project_officer: null
        };

        addAgreementMock.mockReturnValue({ unwrap: () => Promise.reject(new Error("API error")) });

        const { result } = renderHook(() =>
            useAgreementEditForm(
                false,
                false,
                mockSetHasAgreementChanged,
                mockGoBack,
                mockGoToNext,
                false,
                false,
                mockSetIsEditMode,
                null,
                null
            )
        );

        await act(async () => {
            await result.current.handleDraft();
        });

        expect(addAgreementMock).toHaveBeenCalled();
        expect(setAlertMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "error",
                heading: "Error",
                message: "An error occurred while saving the agreement."
            })
        );
        expect(navigateMock).not.toHaveBeenCalledWith("/agreements");
    });

    it("does not set error alert when updateAgreement fails (saveAgreement handles it)", async () => {
        editAgreementMockData = {
            agreement: {
                id: 123,
                name: "Existing Agreement",
                agreement_type: "CONTRACT",
                team_members: [{ id: 1, full_name: "Test User" }],
                requesting_agency: { id: 1 },
                servicing_agency: { id: 2 },
                _meta: { immutable_awarded_fields: [] }
            },
            selected_project: { id: 1 },
            selected_procurement_shop: null,
            selected_product_service_code: null,
            selected_project_officer: null,
            selected_alternate_project_officer: null
        };

        updateAgreementMock.mockReturnValue({ unwrap: () => Promise.reject(new Error("Update failed")) });

        const { result } = renderHook(() =>
            useAgreementEditForm(
                false,
                false,
                mockSetHasAgreementChanged,
                mockGoBack,
                mockGoToNext,
                false,
                false,
                mockSetIsEditMode,
                null,
                null
            )
        );

        await act(async () => {
            await result.current.handleDraft();
        });

        expect(addAgreementMock).not.toHaveBeenCalled();
        expect(setAlertMock).toHaveBeenCalledTimes(1);
        expect(setAlertMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "error",
                heading: "Error",
                redirectUrl: "/error"
            })
        );
        expect(navigateMock).not.toHaveBeenCalledWith("/agreements");
    });
});
