import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CanFunding from "./CanFunding";

vi.mock("./CanFunding.hooks.js", () => ({
    default: () => ({
        handleAddBudget: vi.fn(),
        handleAddFundingReceived: vi.fn(),
        handleCancel: vi.fn(),
        handleSubmit: vi.fn(),
        modalProps: {},
        runValidate: vi.fn(),
        cn: {},
        res: {},
        setShowModal: vi.fn(),
        showButton: false,
        showModal: false,
        budgetForm: {},
        handleEnteredBudgetAmount: vi.fn(),
        fundingReceivedForm: { enteredNotes: "", isEditing: false, isSubmitted: false },
        handleEnteredFundingReceivedAmount: vi.fn(),
        handleEnteredNotes: vi.fn(),
        totalReceived: 0,
        enteredFundingReceived: [{ id: 1, fiscal_year: 2026, funding: 100 }],
        populateFundingReceivedForm: vi.fn(),
        cancelFundingReceived: vi.fn(),
        deleteFundingReceived: vi.fn(),
        deletedFundingReceivedIds: [],
        budgetEnteredAmount: 0,
        fundingReceivedEnteredAmount: 0
    })
}));

vi.mock("../../../components/CANs/CANBudgetByFYCard/CANBudgetByFYCard", () => ({
    default: () => <div>Budget by FY card</div>
}));
vi.mock("../../../components/CANs/CANBudgetForm", () => ({ default: () => <div>Budget form</div> }));
vi.mock("../../../components/CANs/CANFundingInfoCard", () => ({ default: () => <div>Funding info card</div> }));
vi.mock("../../../components/CANs/CANFundingReceivedForm", () => ({ default: () => <div>Funding received form</div> }));
vi.mock("../../../components/CANs/CANFundingReceivedTable", () => ({
    default: () => <div>Funding received table</div>
}));
vi.mock("../../../components/UI/Cards/BudgetCard/ReceivedFundingCard", () => ({
    default: () => <div>Received funding card</div>
}));
vi.mock("../../../components/UI/Cards/CurrencyCard", () => ({ default: () => <div>Currency card</div> }));
vi.mock("../../../components/UI/Modals/index.js", () => ({ default: () => <div>Modal</div> }));
vi.mock("../../../components/UI/RoundedBox", () => ({ default: ({ children }) => <div>{children}</div> }));

describe("CanFunding", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it("shows the funding received skeleton while parent data is refetching", () => {
        render(
            <CanFunding
                canId={1}
                canNumber="CAN-001"
                currentFiscalYearFundingId={11}
                funding={{ fiscal_year: 2026, active_period: 1 }}
                fundingBudgets={[]}
                fiscalYear={2026}
                totalFunding={1000}
                receivedFunding={100}
                fundingReceived={[]}
                isBudgetTeamMember={false}
                isEditMode={false}
                toggleEditMode={() => {}}
                carryForwardFunding={0}
                welcomeModal={{ showModal: false }}
                resetWelcomeModal={() => {}}
                isExpired={false}
                isTableLoading={true}
            />
        );

        expect(screen.getByRole("button", { name: "Funding Received YTD" })).toBeInTheDocument();
        expect(screen.getByRole("table", { name: "Loading funding received" })).toBeInTheDocument();
        expect(screen.queryByText("Funding received table")).not.toBeInTheDocument();
    });
});
