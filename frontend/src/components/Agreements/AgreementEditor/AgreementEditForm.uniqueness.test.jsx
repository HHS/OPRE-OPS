import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AgreementEditForm from "./AgreementEditForm";
import useAgreementEditForm from "./AgreementEditForm.hooks";

vi.mock("./AgreementEditForm.hooks", () => ({
    default: vi.fn()
}));

vi.mock("../../ServicesComponents/ContractTypeSelect", () => ({ default: () => <div /> }));
vi.mock("../../ServicesComponents/ServiceReqTypeSelect", () => ({ default: () => <div /> }));
vi.mock("../../UI/Button/GoBackButton", () => ({ default: () => <div /> }));
vi.mock("../../UI/Cards/DefinitionListCard", () => ({ default: () => <div /> }));
vi.mock("../../UI/Form/Select", () => ({ default: () => <div /> }));
vi.mock("../../UI/Form/TextArea/TextArea", () => ({ default: () => <div /> }));
vi.mock("../../UI/Modals/ConfirmationModal", () => ({ default: () => <div /> }));
vi.mock("../../UI/Modals/SaveChangesAndExitModal", () => ({ default: () => <div /> }));
vi.mock("../AgencySelect", () => ({ default: () => <div /> }));
vi.mock("../AgreementReasonSelect", () => ({ default: () => <div /> }));
vi.mock("../AgreementTypeSelect", () => ({ default: () => <div /> }));
vi.mock("../ProcurementShopSelectWithFee", () => ({ default: () => <div /> }));
vi.mock("../ProductServiceCodeSelect", () => ({ default: () => <div /> }));
vi.mock("../SummaryBox", () => ({ default: () => <div /> }));
vi.mock("../ProjectOfficerComboBox", () => ({ default: () => <div /> }));
vi.mock("../ResearchMethodologyComboBox", () => ({ default: () => <div /> }));
vi.mock("../SpecialTopicComboBox", () => ({ default: () => <div /> }));
vi.mock("../TeamMemberComboBox", () => ({ default: () => <div /> }));
vi.mock("../TeamMemberList", () => ({ default: () => <div /> }));
vi.mock("../../Projects/ProjectComboBox", () => ({ default: () => <div /> }));

const baseHookState = {
    cn: () => "",
    isWizardMode: true,
    isAgreementCreated: false,
    agreement: { id: undefined },
    agreementNotes: "",
    agreementVendor: "",
    agreementType: "CONTRACT",
    agreementTitle: "",
    agreementNickName: "",
    agreementDescription: "",
    agreementReason: "NEW_REQ",
    selectedTeamMembers: [],
    projects: [],
    selectedProject: null,
    contractType: "",
    serviceReqType: "",
    servicingAgency: null,
    requestingAgency: null,
    specialTopics: [],
    researchMethodologies: [],
    productServiceCodes: [],
    selectedProductServiceCode: null,
    selectedProcurementShop: null,
    selectedProjectOfficer: null,
    selectedAlternateProjectOfficer: null,
    showModal: false,
    setShowModal: vi.fn(),
    modalProps: {},
    selectedAgreementFilter: "CONTRACT",
    vendorDisabled: false,
    immutableFields: [],
    isAgreementAA: false,
    isSuperUser: false,
    shouldDisableBtn: false,
    changeSelectedProject: vi.fn(),
    changeSelectedProductServiceCode: vi.fn(),
    changeSelectedProjectOfficer: vi.fn(),
    changeSelectedAlternateProjectOfficer: vi.fn(),
    setSelectedTeamMembers: vi.fn(),
    removeTeamMember: vi.fn(),
    setResearchMethodology: vi.fn(),
    setSpecialTopics: vi.fn(),
    handleContinue: vi.fn(),
    handleDraft: vi.fn(),
    handleCancel: vi.fn(),
    handleOnChangeSelectedProcurementShop: vi.fn(),
    runValidate: vi.fn(),
    checkUniqueOnBlur: vi.fn(),
    uniquenessErrors: { name: [], nick_name: [] },
    isProcurementShopDisabled: false,
    disabledMessage: vi.fn(),
    fundingMethod: [],
    agreementFilterOptions: [],
    handleAgreementFilterChange: vi.fn(),
    setAgreementDescription: vi.fn(),
    setAgreementNickName: vi.fn(),
    setAgreementReason: vi.fn(),
    setAgreementTitle: vi.fn(),
    setContractType: vi.fn(),
    setServiceReqType: vi.fn(),
    setRequestingAgency: vi.fn(),
    setServicingAgency: vi.fn(),
    setAgreementVendor: vi.fn(),
    setAgreementNotes: vi.fn(),
    setAgreementType: vi.fn(),
    res: { getErrors: () => [] },
    showBlockerModal: false,
    setShowBlockerModal: vi.fn(),
    blockerModalProps: {},
    saveAgreement: vi.fn(),
    isLoadingProductServiceCodes: false,
    isLoadingProjects: false
};

describe("AgreementEditForm uniqueness validation wiring", () => {
    it("renders the duplicate-title error when uniquenessErrors.name is set", () => {
        useAgreementEditForm.mockReturnValue({
            ...baseHookState,
            uniquenessErrors: { name: ["This title already exists. Try a different one"], nick_name: [] }
        });

        render(<AgreementEditForm isEditMode={false} />);

        expect(screen.getByText("This title already exists. Try a different one")).toBeInTheDocument();
    });

    it("renders the duplicate-nickname error when uniquenessErrors.nick_name is set", () => {
        useAgreementEditForm.mockReturnValue({
            ...baseHookState,
            uniquenessErrors: { name: [], nick_name: ["This nickname already exists. Try a different one"] }
        });

        render(<AgreementEditForm isEditMode={false} />);

        expect(screen.getByText("This nickname already exists. Try a different one")).toBeInTheDocument();
    });

    it("does not render duplicate errors when uniquenessErrors are empty", () => {
        useAgreementEditForm.mockReturnValue(baseHookState);

        render(<AgreementEditForm isEditMode={false} />);

        expect(screen.queryByText(/already exists/i)).not.toBeInTheDocument();
    });

    it("calls checkUniqueOnBlur with 'name' when title input loses focus", () => {
        const checkUniqueOnBlur = vi.fn();
        useAgreementEditForm.mockReturnValue({
            ...baseHookState,
            agreementTitle: "Some title",
            checkUniqueOnBlur
        });

        render(<AgreementEditForm isEditMode={false} />);

        const titleInput = screen.getByLabelText(/Agreement Title/i);
        fireEvent.blur(titleInput);

        expect(checkUniqueOnBlur).toHaveBeenCalledWith("name", "Some title");
    });

    it("calls checkUniqueOnBlur with 'nick_name' when nickname input loses focus", () => {
        const checkUniqueOnBlur = vi.fn();
        useAgreementEditForm.mockReturnValue({
            ...baseHookState,
            agreementNickName: "MyNick",
            checkUniqueOnBlur
        });

        render(<AgreementEditForm isEditMode={false} />);

        const nicknameInput = screen.getByLabelText(/Agreement Nickname or Acronym/i);
        fireEvent.blur(nicknameInput);

        expect(checkUniqueOnBlur).toHaveBeenCalledWith("nick_name", "MyNick");
    });

    it("disables Continue button when shouldDisableBtn is true (uniqueness errors present)", () => {
        useAgreementEditForm.mockReturnValue({
            ...baseHookState,
            shouldDisableBtn: true,
            uniquenessErrors: { name: ["This title already exists. Try a different one"], nick_name: [] }
        });

        render(<AgreementEditForm isEditMode={false} />);

        expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    });
});
