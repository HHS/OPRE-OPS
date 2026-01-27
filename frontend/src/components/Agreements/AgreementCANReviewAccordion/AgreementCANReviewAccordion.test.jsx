import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { useGetCanFundingSummaryQuery, useGetPortfoliosQuery } from "../../../api/opsAPI";
import store from "../../../store";
import AgreementCANReviewAccordion from "./AgreementCANReviewAccordion";
import { CHANGE_REQUEST_SLUG_TYPES } from "../../ChangeRequests/ChangeRequests.constants";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../../api/opsAPI");

describe("AgreementCANReview", () => {
    useGetPortfoliosQuery.mockReturnValue({ data: canData });
    const initialProps = {
        instructions: "instructions",
        selectedBudgetLines: selectedBudgetLines,
        afterApproval: true,
        setAfterApproval: vi.fn(),
        action: "PLANNED_TO_EXECUTING",
        isApprovePage: false
    };
    it("should render from review page for PLANNED_TO_EXECUTING BLIS", () => {
        useGetCanFundingSummaryQuery
            .mockReturnValueOnce({ data: canFundingCardData })
            .mockReturnValueOnce({ data: canFundingCardData2 });
        render(
            <MemoryRouter>
                <Provider store={store}>
                    <AgreementCANReviewAccordion {...initialProps} />
                </Provider>
            </MemoryRouter>
        );

        const headingCard1 = screen.getByRole("heading", { name: "G99PHS9-1Y CAN Available Budget" });
        const headingCard2 = screen.getByRole("heading", { name: "G99XXX8-1Y CAN Available Budget" });
        const totalSpendingCard1 = screen.getByText(/10,403,500/i);
        const remainingBudgetCard1 = screen.getByText(/13,596,500/i);
        const totalSpendingCard2 = screen.getByText(/602,000/i);
        const remainingBudgetCard2 = screen.getByText(/1,678,000/i);

        expect(headingCard1).toBeInTheDocument();
        expect(headingCard2).toBeInTheDocument();
        expect(totalSpendingCard1).toBeInTheDocument();
        expect(remainingBudgetCard1).toBeInTheDocument();
        expect(totalSpendingCard2).toBeInTheDocument();
        expect(remainingBudgetCard2).toBeInTheDocument();
    });
    it("should render from review page for DRAFT_TO_PLANNED BLIS", async () => {
        const user = userEvent.setup();
        const mockSetAfterApproval = vi.fn(); // Create a mock function
        useGetCanFundingSummaryQuery.mockReturnValueOnce({ data: canFundingCard_G994426 });
        render(
            <MemoryRouter>
                <Provider store={store}>
                    <AgreementCANReviewAccordion
                        {...initialProps}
                        action="DRAFT_TO_PLANNED"
                        selectedBudgetLines={selectedBudgetLinesDRAFT_TO_PLANNED}
                        afterApproval={false}
                        setAfterApproval={mockSetAfterApproval}
                        changeRequestType={CHANGE_REQUEST_SLUG_TYPES.STATUS}
                    />
                </Provider>
            </MemoryRouter>
        );

        const headingCard = screen.getByRole("heading", { name: "G994426-1Y CAN Available Budget" });
        const toggle = screen.getByRole("button", { name: "Off (Drafts excluded) After Approval" });
        const totalSpendingCardBeforeApproval = screen.getByText("$3,000,000.00");
        const remainingBudgetCardBeforeApproval = screen.getByText("$ 37,000,000");

        expect(headingCard).toBeInTheDocument();
        expect(toggle).toBeInTheDocument();
        expect(totalSpendingCardBeforeApproval).toBeInTheDocument();
        expect(remainingBudgetCardBeforeApproval).toBeInTheDocument();

        await user.click(toggle);
        expect(mockSetAfterApproval).toHaveBeenCalled();
        useGetCanFundingSummaryQuery.mockReturnValueOnce({ data: canFundingCard_G994426 });
        render(
            <MemoryRouter>
                <Provider store={store}>
                    <AgreementCANReviewAccordion
                        {...initialProps}
                        action="DRAFT_TO_PLANNED"
                        selectedBudgetLines={selectedBudgetLinesDRAFT_TO_PLANNED}
                        afterApproval={true}
                    />
                </Provider>
            </MemoryRouter>
        );

        const toggleAfterApproval = screen.getByRole("button", { name: "On (Drafts included) After Approval" });
        const totalSpendingCardAfterApproval1 = screen.getByText("$5,000,000.00");
        const remainingBudgetCardAfterApproval1 = screen.getByText("$ 35,000,000");

        expect(toggleAfterApproval).toBeInTheDocument();
        expect(totalSpendingCardAfterApproval1).toBeInTheDocument();
        expect(remainingBudgetCardAfterApproval1).toBeInTheDocument();
    });
    it("should render from approve page with a procurement change", async () => {
        const user = userEvent.setup();
        const mockSetAfterApproval = vi.fn(); // Create a mock function
        useGetCanFundingSummaryQuery.mockReturnValueOnce({ data: canFundingCardG99SHARED });
        render(
            <MemoryRouter>
                <Provider store={store}>
                    <AgreementCANReviewAccordion
                        action=""
                        afterApproval={false}
                        instructions="budget change to amount"
                        isApprovePage={true}
                        selectedBudgetLines={selectedBudgetLines_ProcurementShop}
                        setAfterApproval={mockSetAfterApproval}
                        changeRequestType={CHANGE_REQUEST_SLUG_TYPES.PROCUREMENT_SHOP}
                    />
                </Provider>
            </MemoryRouter>
        );

        const toggle = screen.getByRole("button", { name: "Off (Drafts excluded) After Approval" });
        const headingCard1 = screen.getByRole("heading", { name: "G99SHARED-5Y CAN Available Budget" });
        const totalSpendingCard1 = screen.getByText(/221,614,865/i);
        const remainingBudgetCard1 = screen.getByText(/500,000/i);

        expect(toggle).toBeInTheDocument();
        expect(headingCard1).toBeInTheDocument();
        expect(totalSpendingCard1).toBeInTheDocument();
        expect(remainingBudgetCard1).toBeInTheDocument();

        await user.click(toggle);
        expect(mockSetAfterApproval).toHaveBeenCalled();

        // Re-render with afterApproval true - this will replace the previous render
        useGetCanFundingSummaryQuery.mockReturnValueOnce({ data: canFundingCardG99SHARED });
        render(
            <MemoryRouter>
                <Provider store={store}>
                    <AgreementCANReviewAccordion
                        action=""
                        afterApproval={true}
                        instructions="budget change to amount"
                        isApprovePage={true}
                        selectedBudgetLines={selectedBudgetLines_ProcurementShop}
                        setAfterApproval={mockSetAfterApproval}
                        changeRequestType={CHANGE_REQUEST_SLUG_TYPES.PROCUREMENT_SHOP}
                        newAwardingEntityFeePercentage={4.8}
                    />
                </Provider>
            </MemoryRouter>
        );
        const toggleAfterApproval = screen.getByRole("button", { name: "On (Drafts included) After Approval" });
        const totalSpendingCardAfterApproval1 = screen.getByText(/221,627,765/i);
        // Use getAllByText to handle multiple elements with same text pattern
        const remainingBudgetElements = screen.getAllByText(/500,000/i);
        const remainingBudgetCardAfterApproval1 = remainingBudgetElements[remainingBudgetElements.length - 1];

        expect(toggleAfterApproval).toBeInTheDocument();
        expect(totalSpendingCardAfterApproval1).toBeInTheDocument();
        expect(remainingBudgetCardAfterApproval1).toBeInTheDocument();
    });
    it("should render from approve page with budget change to amount", async () => {
        const user = userEvent.setup();
        const mockSetAfterApproval = vi.fn(); // Create a mock function
        useGetCanFundingSummaryQuery
            .mockReturnValueOnce({ data: canFundingCardData })
            .mockReturnValueOnce({ data: canFundingCardData2 });
        render(
            <MemoryRouter>
                <Provider store={store}>
                    <AgreementCANReviewAccordion
                        action=""
                        afterApproval={false}
                        instructions="budget change to amount"
                        isApprovePage={true}
                        selectedBudgetLines={selectedBudgetLinesToAmount}
                        setAfterApproval={mockSetAfterApproval}
                    />
                </Provider>
            </MemoryRouter>
        );

        const toggle = screen.getByRole("button", { name: "Off (Drafts excluded) After Approval" });
        const headingCard1 = screen.getByRole("heading", { name: "G99PHS9-1Y CAN Available Budget" });
        const headingCard2 = screen.getByRole("heading", { name: "G99XXX8-1Y CAN Available Budget" });
        const totalSpendingCard1 = screen.getByText(/9,700,000/i);
        const remainingBudgetCard1 = screen.getByText(/14,300,000/i);
        const totalSpendingCard2 = screen.getByText(/300,500/i);
        const remainingBudgetCard2 = screen.getByText(/1,979,500/i);

        expect(toggle).toBeInTheDocument();
        expect(headingCard1).toBeInTheDocument();
        expect(headingCard2).toBeInTheDocument();
        expect(totalSpendingCard1).toBeInTheDocument();
        expect(remainingBudgetCard1).toBeInTheDocument();
        expect(totalSpendingCard2).toBeInTheDocument();
        expect(remainingBudgetCard2).toBeInTheDocument();

        await user.click(toggle);
        expect(mockSetAfterApproval).toHaveBeenCalled();
        useGetCanFundingSummaryQuery
            .mockReturnValueOnce({ data: canFundingCardData })
            .mockReturnValueOnce({ data: canFundingCardData2 });
        render(
            <MemoryRouter>
                <Provider store={store}>
                    <AgreementCANReviewAccordion
                        action=""
                        afterApproval={true}
                        instructions="budget change to amount"
                        isApprovePage={true}
                        selectedBudgetLines={selectedBudgetLinesToAmount}
                        setAfterApproval={mockSetAfterApproval}
                    />
                </Provider>
            </MemoryRouter>
        );
        const toggleAfterApproval = screen.getByRole("button", { name: "On (Drafts included) After Approval" });
        const totalSpendingCardAfterApproval1 = screen.getByText(/9,800,500/i);
        const remainingBudgetCardAfterApproval1 = screen.getByText(/14,199,500/i);
        const totalSpendingCardAfterApproval2 = screen.getByText(/401,000/i);
        const remainingBudgetCardAfterApproval2 = screen.getByText(/1,879,000/i);

        expect(toggleAfterApproval).toBeInTheDocument();
        expect(totalSpendingCardAfterApproval1).toBeInTheDocument();
        expect(remainingBudgetCardAfterApproval1).toBeInTheDocument();
        expect(totalSpendingCardAfterApproval2).toBeInTheDocument();
        expect(remainingBudgetCardAfterApproval2).toBeInTheDocument();
    });
    it("should render from approve page with budget change to CAN", async () => {
        const mockSetAfterApproval = vi.fn();
        const user = userEvent.setup();
        useGetCanFundingSummaryQuery
            .mockReturnValueOnce({ data: canFundingCardData })
            .mockReturnValueOnce({ data: canFundingCardData2 });
        render(
            <MemoryRouter>
                <Provider store={store}>
                    <AgreementCANReviewAccordion
                        action=""
                        afterApproval={false}
                        instructions="budget change to CAN"
                        isApprovePage={true}
                        selectedBudgetLines={selectedBudgetLinesToCans}
                        setAfterApproval={mockSetAfterApproval}
                    />
                </Provider>
            </MemoryRouter>
        );

        const toggle = screen.getByRole("button", { name: "Off (Drafts excluded) After Approval" });
        const headingCard1 = screen.getByRole("heading", { name: "G99PHS9-1Y CAN Available Budget" });
        const headingCard2 = screen.getByRole("heading", { name: "G99XXX8-1Y CAN Available Budget" });
        const totalSpendingCard1 = screen.getByText(/9,700,000/i);
        const remainingBudgetCard1 = screen.getByText(/14,300,000/i);
        const totalSpendingCard2 = screen.getByText(/300,500/i);
        const remainingBudgetCard2 = screen.getByText(/1,979,500/i);

        expect(toggle).toBeInTheDocument();
        expect(headingCard1).toBeInTheDocument();
        expect(headingCard2).toBeInTheDocument();
        expect(totalSpendingCard1).toBeInTheDocument();
        expect(remainingBudgetCard1).toBeInTheDocument();
        expect(totalSpendingCard2).toBeInTheDocument();
        expect(remainingBudgetCard2).toBeInTheDocument();

        await user.click(toggle);
        expect(mockSetAfterApproval).toHaveBeenCalled();
        useGetCanFundingSummaryQuery
            .mockReturnValueOnce({ data: canFundingCardData })
            .mockReturnValueOnce({ data: canFundingCardData2 });
        render(
            <MemoryRouter>
                <Provider store={store}>
                    <AgreementCANReviewAccordion
                        action=""
                        afterApproval={true}
                        instructions="budget change to CAN"
                        isApprovePage={true}
                        selectedBudgetLines={selectedBudgetLinesToCans}
                        setAfterApproval={mockSetAfterApproval}
                    />
                </Provider>
            </MemoryRouter>
        );
        const toggleAfterApproval = screen.getByRole("button", { name: "On (Drafts included) After Approval" });
        const totalSpendingCardAfterApproval1 = screen.getByText(/8,996,500/i);
        const remainingBudgetCardAfterApproval1 = screen.getByText(/15,003,500/i);
        const totalSpendingCardAfterApproval2 = screen.getByText(/1,004,000/i);
        const remainingBudgetCardAfterApproval2 = screen.getByText(/1,276,000/i);

        expect(toggleAfterApproval).toBeInTheDocument();
        expect(totalSpendingCardAfterApproval1).toBeInTheDocument();
        expect(remainingBudgetCardAfterApproval1).toBeInTheDocument();
        expect(totalSpendingCardAfterApproval2).toBeInTheDocument();
        expect(remainingBudgetCardAfterApproval2).toBeInTheDocument();
    });
    it("should render from approve page with budget change to amount and CAN", async () => {
        const mockSetAfterApproval = vi.fn();
        const user = userEvent.setup();
        useGetCanFundingSummaryQuery
            .mockReturnValueOnce({ data: canFundingCardData })
            .mockReturnValueOnce({ data: canFundingCardData2 });
        render(
            <MemoryRouter>
                <Provider store={store}>
                    <AgreementCANReviewAccordion
                        action=""
                        afterApproval={false}
                        instructions="budget change to CAN"
                        isApprovePage={true}
                        selectedBudgetLines={selectedBudgetLines_CAN_and_AMT}
                        setAfterApproval={mockSetAfterApproval}
                    />
                </Provider>
            </MemoryRouter>
        );

        const toggle = screen.getByRole("button", { name: "Off (Drafts excluded) After Approval" });
        const headingCard1 = screen.getByRole("heading", { name: "G99PHS9-1Y CAN Available Budget" });
        const headingCard2 = screen.getByRole("heading", { name: "G99XXX8-1Y CAN Available Budget" });
        const totalSpendingCard1 = screen.getByText(/9,700,000/i);
        const remainingBudgetCard1 = screen.getByText(/14,300,000/i);
        const totalSpendingCard2 = screen.getByText(/300,500/i);
        const remainingBudgetCard2 = screen.getByText(/1,979,500/i);

        expect(toggle).toBeInTheDocument();
        expect(headingCard1).toBeInTheDocument();
        expect(headingCard2).toBeInTheDocument();
        expect(totalSpendingCard1).toBeInTheDocument();
        expect(remainingBudgetCard1).toBeInTheDocument();
        expect(totalSpendingCard2).toBeInTheDocument();
        expect(remainingBudgetCard2).toBeInTheDocument();

        await user.click(toggle);
        expect(mockSetAfterApproval).toHaveBeenCalled();
        useGetCanFundingSummaryQuery
            .mockReturnValueOnce({ data: canFundingCardData })
            .mockReturnValueOnce({ data: canFundingCardData2 });
        render(
            <MemoryRouter>
                <Provider store={store}>
                    <AgreementCANReviewAccordion
                        action=""
                        afterApproval={true}
                        instructions="budget change to CAN"
                        isApprovePage={true}
                        selectedBudgetLines={selectedBudgetLines_CAN_and_AMT}
                        setAfterApproval={mockSetAfterApproval}
                    />
                </Provider>
            </MemoryRouter>
        );
        const toggleAfterApproval = screen.getByRole("button", { name: "On (Drafts included) After Approval" });
        const totalSpendingCardAfterApproval1 = screen.getByText(/8,996,500/i);
        const remainingBudgetCardAfterApproval1 = screen.getByText(/15,003,500/i);
        const totalSpendingCardAfterApproval2 = screen.getByText(/1,104,500/i);
        const remainingBudgetCardAfterApproval2 = screen.getByText(/1,175,500/i);

        expect(toggleAfterApproval).toBeInTheDocument();
        expect(totalSpendingCardAfterApproval1).toBeInTheDocument();
        expect(remainingBudgetCardAfterApproval1).toBeInTheDocument();
        expect(totalSpendingCardAfterApproval2).toBeInTheDocument();
        expect(remainingBudgetCardAfterApproval2).toBeInTheDocument();
    });
    it("should render from approve page with status change to PLANNED", async () => {
        const user = userEvent.setup();
        const mockSetAfterApproval = vi.fn(); // Create a mock function
        useGetCanFundingSummaryQuery.mockReturnValueOnce({ data: canFundingCard_G994426 });
        render(
            <MemoryRouter>
                <Provider store={store}>
                    <AgreementCANReviewAccordion
                        {...initialProps}
                        action="PLANNED"
                        selectedBudgetLines={selectedBudgetLinesDRAFT_TO_PLANNED}
                        afterApproval={false}
                        setAfterApproval={mockSetAfterApproval}
                        isApprovePage={true}
                        changeRequestType={CHANGE_REQUEST_SLUG_TYPES.STATUS}
                    />
                </Provider>
            </MemoryRouter>
        );
        const headingCard = screen.getByRole("heading", { name: "G994426-1Y CAN Available Budget" });
        const toggle = screen.getByRole("button", {
            name: "Off (Drafts excluded) After Approval"
        });
        // const totalSpendingCardBeforeApproval = screen.getByText("$ 3,000,000");
        const remainingBudgetCardBeforeApproval = screen.getByText("$ 37,000,000");

        expect(headingCard).toBeInTheDocument();
        expect(toggle).toBeInTheDocument();
        // expect(totalSpendingCardBeforeApproval).toBeInTheDocument();
        expect(remainingBudgetCardBeforeApproval).toBeInTheDocument();

        await user.click(toggle);
        expect(mockSetAfterApproval).toHaveBeenCalled();
        useGetCanFundingSummaryQuery.mockReturnValueOnce({ data: canFundingCard_G994426 });
        render(
            <MemoryRouter>
                <Provider store={store}>
                    <AgreementCANReviewAccordion
                        {...initialProps}
                        action="PLANNED"
                        selectedBudgetLines={selectedBudgetLinesDRAFT_TO_PLANNED}
                        afterApproval={true}
                        setAfterApproval={mockSetAfterApproval}
                        isApprovePage={true}
                    />
                </Provider>
            </MemoryRouter>
        );

        const toggleAfterApproval = screen.getByRole("button", { name: "On (Drafts included) After Approval" });
        // const totalSpendingCardAfterApproval1 = screen.getByText("$ 5,000,000");
        const remainingBudgetCardAfterApproval1 = screen.getByText("$ 35,000,000");

        expect(toggleAfterApproval).toBeInTheDocument();
        // expect(totalSpendingCardAfterApproval1).toBeInTheDocument();
        expect(remainingBudgetCardAfterApproval1).toBeInTheDocument();
    });
    it("should render from approve page with status change to EXECUTING", async () => {
        const user = userEvent.setup();
        const mockSetAfterApproval = vi.fn(); // Create a mock function
        useGetCanFundingSummaryQuery
            .mockReturnValueOnce({ data: canFundingCardData })
            .mockReturnValueOnce({ data: canFundingCardData2 });
        render(
            <MemoryRouter>
                <Provider store={store}>
                    <AgreementCANReviewAccordion
                        {...initialProps}
                        action="EXECUTING"
                        selectedBudgetLines={selectedBudgetLines}
                        afterApproval={false}
                        setAfterApproval={mockSetAfterApproval}
                        isApprovePage={true}
                    />
                </Provider>
            </MemoryRouter>
        );

        const headingCard1 = screen.getByRole("heading", { name: "G99PHS9-1Y CAN Available Budget" });
        const headingCard2 = screen.getByRole("heading", { name: "G99XXX8-1Y CAN Available Budget" });
        const totalSpendingCard1 = screen.getByText(/9,700,000/i);
        const remainingBudgetCard1 = screen.getByText(/14,300,000/i);
        const totalSpendingCard2 = screen.getByText(/300,500/i);
        const remainingBudgetCard2 = screen.getByText(/1,979,500/i);
        const toggle = screen.getByRole("button", {
            name: "Off (Drafts excluded) After Approval"
        });

        expect(headingCard1).toBeInTheDocument();
        expect(headingCard2).toBeInTheDocument();
        expect(totalSpendingCard1).toBeInTheDocument();
        expect(remainingBudgetCard1).toBeInTheDocument();
        expect(totalSpendingCard2).toBeInTheDocument();
        expect(remainingBudgetCard2).toBeInTheDocument();

        await user.click(toggle);
        expect(mockSetAfterApproval).toHaveBeenCalled();
        useGetCanFundingSummaryQuery
            .mockReturnValueOnce({ data: canFundingCardData })
            .mockReturnValueOnce({ data: canFundingCardData2 });
        render(
            <MemoryRouter>
                <Provider store={store}>
                    <AgreementCANReviewAccordion
                        {...initialProps}
                        action="EXECUTING"
                        selectedBudgetLines={selectedBudgetLines}
                        afterApproval={true}
                        setAfterApproval={mockSetAfterApproval}
                        isApprovePage={true}
                    />
                </Provider>
            </MemoryRouter>
        );

        const toggleAfterApproval = screen.getByRole("button", { name: "On (Drafts included) After Approval" });

        //NOTE: The total spending and remaining budget values are the same as the initial render
        expect(toggleAfterApproval).toBeInTheDocument();
        expect(headingCard1).toBeInTheDocument();
        expect(headingCard2).toBeInTheDocument();
        expect(totalSpendingCard1).toBeInTheDocument();
        expect(remainingBudgetCard1).toBeInTheDocument();
        expect(totalSpendingCard2).toBeInTheDocument();
        expect(remainingBudgetCard2).toBeInTheDocument();
    });
});

const selectedBudgetLines = [
    {
        agreement_id: 9,
        amount: 700000,
        can: {
            appropriation_date: "2023-10-01T00:00:00.000000Z",
            active_period: 1,
            description: "Social Science Research and Development",
            display_name: "G99PHS9",
            expiration_date: "2024-09-01T00:00:00.000000Z",
            id: 502,
            portfolio_id: 8,
            nick_name: "SSRD",
            number: "G99PHS9"
        },
        can_id: 502,
        change_requests_in_review: null,
        comments: "",
        created_by: null,
        created_on: "2024-07-29T14:45:03.641377",
        date_needed: "2043-06-13",
        fiscal_year: 2043,
        id: 15020,
        in_review: false,
        line_description: "SC2",
        portfolio_id: 8,
        proc_shop_fee_percentage: 0.005,
        services_component_id: 6,
        status: "PLANNED",
        team_members: [
            {
                email: "Niki.Denmark@example.com",
                full_name: "Niki Denmark",
                id: 511
            },
            {
                email: "admin.demo@email.com",
                full_name: "Admin Demo",
                id: 520
            }
        ],
        updated_on: "2024-07-29T14:45:03.641377",
        selected: true,
        actionable: true
    },
    {
        agreement_id: 9,
        amount: 300000,
        can: {
            appropriation_date: "2022-10-01T00:00:00.000000Z",
            active_period: 1,
            description: "Example CAN",
            display_name: "G99XXX8",
            expiration_date: "2023-09-01T00:00:00.000000Z",
            id: 512,
            portfolio_id: 3,
            nick_name: "",
            number: "G99XXX8"
        },
        can_id: 512,
        change_requests_in_review: null,
        comments: "",
        created_by: null,
        created_on: "2024-07-29T14:45:03.648546",
        date_needed: "2044-06-13",
        fiscal_year: 2044,
        id: 15021,
        in_review: false,
        line_description: "SC3",
        portfolio_id: 3,
        proc_shop_fee_percentage: 0.005,
        services_component_id: 6,
        status: "PLANNED",
        team_members: [
            {
                email: "Niki.Denmark@example.com",
                full_name: "Niki Denmark",
                id: 511
            },
            {
                email: "admin.demo@email.com",
                full_name: "Admin Demo",
                id: 520
            }
        ],
        updated_on: "2024-07-29T14:45:03.648546",
        selected: true,
        actionable: true
    }
];

const canData = [
    {
        abbreviation: "CWR",
        cans: [501, 503],
        created_by: null,
        created_by_user: null,
        created_on: "2024-07-29T14:44:49.526443Z",
        description:
            "             The promotion of children’s safety, permanence, and well-being are the principles that guide child             welfare practice and policy. ACF seeks to improve the safety, permanency, and well-being of children through             leadership, support for necessary services, and productive partnerships with states, tribes, and              communities. ACF’s Children’s Bureau has the primary responsibility for administering federal programs             that support state child welfare services. ACF provides matching federal funds to states, tribes, and             communities to help them operate every aspect of their child welfare systems. This includes the             prevention of child abuse and neglect, the support of permanent placements through adoption and             subsidized guardianship, and the creation and maintenance of information systems necessary to support             these programs. ACF supports a number of research and evaluation activities as well as learning from a             broad array of other activities relevant to child welfare such as performance management, technical             assistance, stakeholder engagement, site monitoring, developing systems to oversee and use data, and             continuous quality improvement. ACF also analyzes and reports information on administrative data             such as the National Child Abuse and Neglect Data System (NCANDS), Adoption and Foster Care             Analysis and Reporting System (AFCARS), and National Youth in Transition Database (NYTD)             \n\nOver the past several decades, research and evaluation activities in child welfare have increased             significantly. This body of knowledge has shown that child maltreatment is a complex problem associated             with multiple, interrelated risk and protective factors at individual, family, community, and contextual             levels.  This research has demonstrated that child abuse and neglect may have long-lasting and cumulative             effects on the well-being of children into adulthood. There is burgeoning research examining the             potential effectiveness of preventative and intervention treatments to improve the safety, stability,             and well-being of children and their families.             \n\nOPRE’s child welfare research portfolio includes research on children who are maltreated or who are at             risk for child maltreatment; children and families who come to the attention of child protective services;             and children and families who are receiving child welfare services either in their families of origin or             in substitute care settings. OPRE also partners with the Children’s Bureau to conduct research covering a             broad array of topics, including identification of antecedents and consequences of child maltreatment,             strategies for prevention of maltreatment, and service needs and service outcomes for children who come             to the attention of child welfare.        ",
        display_name: "Child Welfare Research",
        division: {
            abbreviation: "DCFD",
            created_by: null,
            created_by_user: null,
            created_on: "2024-07-29T14:44:44.541526Z",
            deputy_division_director_id: 520,
            display_name: "Division of Child and Family Development",
            division_director_id: 522,
            id: 4,
            name: "Division of Child and Family Development",
            updated_by: null,
            updated_by_user: null,
            updated_on: "2024-07-29T14:44:44.541526Z",
            versions: [
                {
                    id: 4,
                    transaction_id: 4
                }
            ]
        },
        division_id: 4,
        id: 1,
        name: "Child Welfare Research",
        shared_cans: [],
        status: "IN_PROCESS",
        team_leaders: [
            {
                agreements: [1, 2, 10],
                contracts: [],
                created_by: null,
                created_by_user: null,
                created_on: "2024-07-29T14:44:44.632819Z",
                display_name: "Chris Fortunato",
                division: 1,
                email: "chris.fortunato@example.com",
                first_name: "Chris",
                full_name: "Chris Fortunato",
                groups: [],
                hhs_id: null,
                id: 500,
                last_name: "Fortunato",
                notifications: [1],
                oidc_id: "00000000-0000-1111-a111-000000000001",
                portfolios: [1],
                projects: [1000, 1013, 1014],
                roles: [1],
                sessions: [],
                status: "INACTIVE",
                updated_by: null,
                updated_by_user: null,
                updated_on: "2024-07-29T14:44:44.632819Z",
                versions: [
                    {
                        id: 500,
                        transaction_id: 18
                    }
                ]
            }
        ],
        updated_by: null,
        updated_by_user: null,
        updated_on: "2024-07-29T14:44:49.526443Z",
        urls: [1],
        versions: [
            {
                id: 1,
                transaction_id: 103
            }
        ]
    },
    {
        abbreviation: "HS",
        cans: [504],
        created_by: null,
        created_by_user: null,
        created_on: "2024-07-29T14:44:49.635136Z",
        description:
            "             Established in 1965, Head Start was designed to promote the school readiness of children, ages             three to five, from families with low income, by supporting the development of the whole child through             high-quality, comprehensive services. In 1994, the Early Head Start program was established to provide             the same comprehensive services to families with low income who have infants and toddlers, as well as             pregnant women. Today, ACF’s Office of Head Start oversees approximately 1,600 Head Start and Early Head             Start grantees that serve nearly one million children, birth to age five, and their families.             \n\nFor over 50 years, Head Start research has examined the impact of its programs as a whole and how             those impacts vary for different populations, communities, or program characteristics. In doing so,             Head Start research targets strategies for improving program quality and child and family outcomes.             Through partnerships between researchers and local programs, Head Start develops and evaluates             innovations in Head Start practice related to infant mental health, parenting, dual language learning,             curricular enhancements, caregiver-child interactions, dual-generation approaches, and other topics.             This growing research base provides valuable information not only for guiding program improvements in             Head Start itself, but also for the larger field of ECE.      ",
        display_name: "Head Start",
        division: {
            abbreviation: "DCFD",
            created_by: null,
            created_by_user: null,
            created_on: "2024-07-29T14:44:44.541526Z",
            deputy_division_director_id: 520,
            display_name: "Division of Child and Family Development",
            division_director_id: 522,
            id: 4,
            name: "Division of Child and Family Development",
            updated_by: null,
            updated_by_user: null,
            updated_on: "2024-07-29T14:44:44.541526Z",
            versions: [
                {
                    id: 4,
                    transaction_id: 4
                }
            ]
        },
        division_id: 4,
        id: 2,
        name: "Head Start",
        shared_cans: [507],
        status: "IN_PROCESS",
        team_leaders: [
            {
                agreements: [],
                contracts: [],
                created_by: null,
                created_by_user: null,
                created_on: "2024-07-29T14:44:44.659939Z",
                display_name: "Amy Madigan",
                division: 1,
                email: "Amy.Madigan@example.com",
                first_name: "Amy",
                full_name: "Amy Madigan",
                groups: [],
                hhs_id: null,
                id: 501,
                last_name: "Madigan",
                notifications: [2],
                oidc_id: "00000000-0000-1111-a111-000000000002",
                portfolios: [2],
                projects: [],
                roles: [1],
                sessions: [],
                status: "INACTIVE",
                updated_by: null,
                updated_by_user: null,
                updated_on: "2024-07-29T14:44:44.659939Z",
                versions: [
                    {
                        id: 501,
                        transaction_id: 20
                    }
                ]
            }
        ],
        updated_by: null,
        updated_by_user: null,
        updated_on: "2024-07-29T14:44:49.635136Z",
        urls: [2],
        versions: [
            {
                id: 2,
                transaction_id: 105
            }
        ]
    },
    {
        abbreviation: "CC",
        cans: [512, 513, 514, 515, 516],
        created_by: null,
        created_by_user: null,
        created_on: "2024-07-29T14:44:49.648222Z",
        description:
            "            Quality child care and early education programs are a critical resource for families, support young            children’s development in a variety of domains, and assist parents in accessing comprehensive services            for their families.            \n\nACF supports working families with low incomes by providing funding and implementing policies intended            to increase access to affordable, quality child care and early education programs serving children from            birth through age 13. ACF’s Office of Child Care administers the Child Care and Development Fund (CCDF),            which is a block grant authorized under the Child Care and Development Block Grant (CCDBG). In 2021,            CCDF made $9.5 billion available to state, territory, and tribal governments to support children and            their families by paying for child care that meets families’ needs and supports children’s development            and well-being. CCDF also provides funding to improve the quality of care by supporting efforts such as            child care licensing, quality improvement systems, and training and education for child care workers.            \n\nOPRE’s child care research portfolio aims to increase knowledge about the efficacy of child care            subsidy policies and programs in enhancing employment and economic self-sufficiency of low-income            families, and in improving quality in child care and early education settings to support learning and            development of children from birth through age 13. Research demonstrating the link between subsidies,            quality child care and early education, and positive child and family outcomes has encouraged efforts to            enhance early care and education programs through investments of CCDF quality set-aside funds.      ",
        display_name: "Child Care",
        division: {
            abbreviation: "DCFD",
            created_by: null,
            created_by_user: null,
            created_on: "2024-07-29T14:44:44.541526Z",
            deputy_division_director_id: 520,
            display_name: "Division of Child and Family Development",
            division_director_id: 522,
            id: 4,
            name: "Division of Child and Family Development",
            updated_by: null,
            updated_by_user: null,
            updated_on: "2024-07-29T14:44:44.541526Z",
            versions: [
                {
                    id: 4,
                    transaction_id: 4
                }
            ]
        },
        division_id: 4,
        id: 3,
        name: "Child Care",
        shared_cans: [],
        status: "IN_PROCESS",
        team_leaders: [
            {
                agreements: [],
                contracts: [],
                created_by: null,
                created_by_user: null,
                created_on: "2024-07-29T14:44:44.672274Z",
                display_name: "Ivelisse Martinez-Beck",
                division: 1,
                email: "Ivelisse.Martinez-Beck@example.com",
                first_name: "Ivelisse",
                full_name: "Ivelisse Martinez-Beck",
                groups: [],
                hhs_id: null,
                id: 502,
                last_name: "Martinez-Beck",
                notifications: [3],
                oidc_id: "00000000-0000-1111-a111-000000000003",
                portfolios: [3],
                projects: [],
                roles: [2],
                sessions: [],
                status: "INACTIVE",
                updated_by: null,
                updated_by_user: null,
                updated_on: "2024-07-29T14:44:44.672274Z",
                versions: [
                    {
                        id: 502,
                        transaction_id: 22
                    }
                ]
            }
        ],
        updated_by: null,
        updated_by_user: null,
        updated_on: "2024-07-29T14:44:49.648222Z",
        urls: [3],
        versions: [
            {
                id: 3,
                transaction_id: 107
            }
        ]
    },
    {
        abbreviation: "WR",
        cans: [],
        created_by: null,
        created_by_user: null,
        created_on: "2024-07-29T14:44:49.662046Z",
        description:
            "            ACF’s Office of Family Assistance administers the Temporary Assistance for Needy Families (TANF)            program. Established by the Personal Responsibility and Work Opportunity Reconciliation Act (PRWORA)            of 1996, the TANF block grant provides funds to States, eligible territories, and tribes, which decide            on the design of the program, the type and amount of assistance payments to families, and the range of            other services to be provided. In FY 2021, ACF provided $16.5 billion in TANF funding. Approximately            437,000 adults and 1.6 million children received TANF cash assistance in FY 2019. The program supports            a wide range of efforts to promote family economic stability. For example, TANF grant dollars are used            for programs that promote job readiness through education and training; provide assistance with child            care, transportation, or other services that support employment activities; and improve services that            support family strengthening.            \n\nACF’s recent TANF-related research and evaluation has sought to understand and inform how TANF and            other programs that serve TANF or TANF-eligible populations can best support their self-sufficiency and            economic well-being. Rigorous studies funded by ACF and others have demonstrated that different types of            interventions can improve labor market outcomes for disadvantaged groups, with variation in the            magnitude and duration of impacts. However, there are still significant gaps in our understanding—and            even more still to learn if we want to keep improving the effectiveness and efficiency of services.            Future activities will also be informed by emerging findings from ongoing research and evaluation            activities, other learning activities, and continued engagement with welfare and family self-sufficiency            stakeholders.            \n\nOPRE’s self-sufficiency, welfare, and employment portfolio addresses innovative approaches for            increasing economic self-sufficiency and reducing public assistance dependency, including rigorous            evaluations of promising employment and training strategies. Studies address a variety of topics            including alternative welfare-to-work strategies, career pathways and post-secondary training models,            employment retention and advancement approaches, subsidized employment and job search strategies, and            tests to understand the effects of employment coaching models.      ",
        display_name: "Welfare Research",
        division: {
            abbreviation: "DECONI",
            created_by: null,
            created_by_user: null,
            created_on: "2024-07-29T14:44:44.529800Z",
            deputy_division_director_id: 520,
            display_name: "Division of Economic Independence",
            division_director_id: 522,
            id: 2,
            name: "Division of Economic Independence",
            updated_by: null,
            updated_by_user: null,
            updated_on: "2024-07-29T14:44:44.529800Z",
            versions: [
                {
                    id: 2,
                    transaction_id: 2
                }
            ]
        },
        division_id: 2,
        id: 4,
        name: "Welfare Research",
        shared_cans: [],
        status: "IN_PROCESS",
        team_leaders: [
            {
                agreements: [1, 2, 10],
                contracts: [],
                created_by: null,
                created_by_user: null,
                created_on: "2024-07-29T14:44:44.683882Z",
                display_name: "Amelia Popham",
                division: 2,
                email: "Amelia.Popham@example.com",
                first_name: "Amelia",
                full_name: "Amelia Popham",
                groups: [1],
                hhs_id: null,
                id: 503,
                last_name: "Popham",
                notifications: [4],
                oidc_id: "00000000-0000-1111-a111-000000000004",
                portfolios: [4],
                projects: [],
                roles: [1, 5],
                sessions: [],
                status: "ACTIVE",
                updated_by: null,
                updated_by_user: null,
                updated_on: "2024-07-29T14:44:44.683882Z",
                versions: [
                    {
                        id: 503,
                        transaction_id: 24
                    }
                ]
            }
        ],
        updated_by: null,
        updated_by_user: null,
        updated_on: "2024-07-29T14:44:49.662046Z",
        urls: [4],
        versions: [
            {
                id: 4,
                transaction_id: 109
            }
        ]
    },
    {
        abbreviation: "ADR",
        cans: [],
        created_by: null,
        created_by_user: null,
        created_on: "2024-07-29T14:44:49.675533Z",
        description:
            "            Despite recent declines in teen childbirth rates, teen pregnancy rates in the United States are much            higher than in other western industrialized nations. More research and programming innovations are needed            to identify effective ways to decrease rates of teen sexual risk behavior and associated negative            outcomes. Since 2009, ACF has supported research and evaluation efforts in teen pregnancy prevention            and, more recently, sexual risk avoidance. ACF supports a number of research and evaluation activities            as well as learning from a broad array of other activities such as performance management, technical            assistance, stakeholder engagement, site monitoring, and program improvement.            \n\nTo help reduce non-marital sexual activity, teen pregnancies, sexually transmitted infections, and            other risk behaviors, ACF’s Family and Youth Services Bureau oversees two funding streams within the            Adolescent Pregnancy Prevention (APP) program: the Personal Responsibility Education Program (PREP) and            the Sexual Risk Avoidance Education (SRAE) Program. PREP programs educate adolescents on both abstinence            and contraception for the prevention of pregnancy and sexually transmitted infections. The SRAE Program            funds projects that exclusively implement sexual risk avoidance education that teaches youth how to            voluntarily refrain from non-marital sexual activity, empower youth to make healthy decisions, and            provide tools and resources to prevent youth engagement in other risky behaviors.            \n\nACF coordinates research and evaluation with other offices that oversee teen pregnancy prevention            programming and evaluation, including the Department of Health and Human Services’ (HHS) Office of            Population Affairs (OPA), the HHS Office of the Assistant Secretary for Planning and Evaluation (ASPE),            and the Centers for Disease Control and Prevention’s Division of Reproductive Health (DRH). Past ACF            research includes the completion of a multi-component evaluation which included national descriptive            and performance analysis studies and an impact and implementation study of four PREP sites. Key findings            from the 2018-2019 performance measures show that 141,586 youth were served during that reporting            period. The most commonly implemented Adulthood Preparation Subjects (APS) by grantees were healthy            relationships, healthy life skills, and adolescent development. Nearly 90 percent of the youth reported            that they felt respected as people and that the material presented was clear most or all of the time.            Large majorities of youth reported that the discussions or activities helped them to learn program            lessons and that they had a chance to ask questions most or all of the time.            \n\nOPRE’s youth services portfolio also includes research and evaluation of approaches to improve other            outcomes for at-risk youth, including unaccompanied refugee minors, youth at-risk of homelessness, and            youth with experience in the child welfare system.      ",
        display_name: "Adolescent Development Research",
        division: {
            abbreviation: "DFS",
            created_by: null,
            created_by_user: null,
            created_on: "2024-07-29T14:44:44.546987Z",
            deputy_division_director_id: 520,
            display_name: "Division of Family Strengthening",
            division_director_id: 522,
            id: 5,
            name: "Division of Family Strengthening",
            updated_by: null,
            updated_by_user: null,
            updated_on: "2024-07-29T14:44:44.546987Z",
            versions: [
                {
                    id: 5,
                    transaction_id: 5
                }
            ]
        },
        division_id: 5,
        id: 5,
        name: "Adolescent Development Research",
        shared_cans: [],
        status: "IN_PROCESS",
        team_leaders: [
            {
                agreements: [],
                contracts: [],
                created_by: null,
                created_by_user: null,
                created_on: "2024-07-29T14:44:44.712414Z",
                display_name: "Tia Brown",
                division: 3,
                email: "Tia.Brown@example.com",
                first_name: "Tia",
                full_name: "Tia Brown",
                groups: [],
                hhs_id: null,
                id: 504,
                last_name: "Brown",
                notifications: [5],
                oidc_id: "00000000-0000-1111-a111-000000000005",
                portfolios: [5],
                projects: [],
                roles: [1],
                sessions: [],
                status: "INACTIVE",
                updated_by: null,
                updated_by_user: null,
                updated_on: "2024-07-29T14:44:44.712414Z",
                versions: [
                    {
                        id: 504,
                        transaction_id: 28
                    }
                ]
            }
        ],
        updated_by: null,
        updated_by_user: null,
        updated_on: "2024-07-29T14:44:49.675533Z",
        urls: [5],
        versions: [
            {
                id: 5,
                transaction_id: 111
            }
        ]
    },
    {
        abbreviation: "HMRF",
        cans: [500, 505, 506, 507, 508, 509, 510, 511],
        created_by: null,
        created_by_user: null,
        created_on: "2024-07-29T14:44:49.689179Z",
        description:
            "            The Healthy Marriage and Responsible Fatherhood (HMRF) program is part of ACF’s strategy to improve the            long-term well-being of children and families. HMRF is a $150 million discretionary grant program            originally authorized under the Deficit Reduction Act of 2005 and reauthorized under the Claims            Resolution Act of 2010. ACF supports a number of research and evaluation activities as well as learning            from a broad array of other activities such as performance management, technical assistance, stakeholder            engagement, site monitoring, and continuous quality improvement.            \n\nA large body of research has shown that, on average, children raised in stable, two-parent families            have better outcomes on a range of measures, even into adulthood. Research has also identified dimensions            of couples’ relationship functioning (e.g., positive communication, effective conflict management,            problem solving, etc.) that could be modified or enhanced through relationship- focused educational            programming.  Some evaluations have found that such programming can produce improvement in multiple            dimensions of relationship quality and reductions in break-up or divorce. In recent decades, efforts to            support and promote responsible fatherhood have been spurred by research that shows a link between            supportive fathering and positive child outcomes. Responsible fatherhood programs aim to provide            resources and supports to fathers around healthy marriage and relationships, parenting, and economic            stability.            \n\nOPRE’s strengthening families, healthy marriage, and responsible fatherhood portfolio includes            research and evaluation on topics such as family formation and stability, co-parenting, marriage,            fatherhood, and violence in relationships. Studies include a focus on the implications of programs and            policies (including welfare policies) for child, adult, and family well-being.      ",
        display_name: "Healthy Marriage & Responsible Fatherhood",
        division: {
            abbreviation: "DFS",
            created_by: null,
            created_by_user: null,
            created_on: "2024-07-29T14:44:44.546987Z",
            deputy_division_director_id: 520,
            display_name: "Division of Family Strengthening",
            division_director_id: 522,
            id: 5,
            name: "Division of Family Strengthening",
            updated_by: null,
            updated_by_user: null,
            updated_on: "2024-07-29T14:44:44.546987Z",
            versions: [
                {
                    id: 5,
                    transaction_id: 5
                }
            ]
        },
        division_id: 5,
        id: 6,
        name: "Healthy Marriage & Responsible Fatherhood",
        shared_cans: [],
        status: "IN_PROCESS",
        team_leaders: [
            {
                agreements: [],
                contracts: [],
                created_by: null,
                created_by_user: null,
                created_on: "2024-07-29T14:44:44.725407Z",
                display_name: "Katie Pahigiannis",
                division: 3,
                email: "Katie.Pahigiannis@example.com",
                first_name: "Katie",
                full_name: "Katie Pahigiannis",
                groups: [],
                hhs_id: null,
                id: 505,
                last_name: "Pahigiannis",
                notifications: [6],
                oidc_id: "00000000-0000-1111-a111-000000000006",
                portfolios: [6],
                projects: [],
                roles: [1],
                sessions: [],
                status: "INACTIVE",
                updated_by: null,
                updated_by_user: null,
                updated_on: "2024-07-29T14:44:44.725407Z",
                versions: [
                    {
                        id: 505,
                        transaction_id: 30
                    }
                ]
            }
        ],
        updated_by: null,
        updated_by_user: null,
        updated_on: "2024-07-29T14:44:49.689179Z",
        urls: [6],
        versions: [
            {
                id: 6,
                transaction_id: 113
            }
        ]
    },
    {
        abbreviation: "HV",
        cans: [],
        created_by: null,
        created_by_user: null,
        created_on: "2024-07-29T14:44:49.700904Z",
        description:
            "            Home visiting is a service delivery strategy that aims to support the healthy development and well-being            of children and families. While each home visiting model has its unique aspects, in general, home            visiting involves three main intervention activities conducted through one-on-one interactions between            home visitors and families: assessing family needs, educating and supporting parents, and referring            families to needed services in the community. Early childhood home visiting programs aim to improve a            wide range of outcomes including maternal health, child health and development, child maltreatment            prevention, and family economic self-sufficiency.            \n\nThe Health Resources and Services Administration (HRSA) administers the Maternal, Infant, and Early            Childhood Home Visiting (MIECHV) Program in collaboration with ACF, which oversees the Tribal MIECHV            program. The Tribal MIECHV program provides grants to tribes, tribal organizations, and Urban Indian            Organizations to develop, implement, and evaluate home visiting programs in American Indian and Alaska            Native communities. The MIECHV Program carries out a continuous program of research and evaluation            activities in order to increase knowledge about the implementation and effectiveness of home visiting            programs. OPRE, in collaboration with HRSA and with the Tribal MIECHV program, oversees a majority of            the MIECHV-funded research and evaluation projects.            \n\nThe home visiting field has engaged in research and evaluation for decades, generating a rich            literature on the effects of home visiting. Studies have found home visiting impacts on child development,            school readiness, family economic self-sufficiency, maternal health, reductions in child maltreatment,            child health, positive parenting practices, juvenile delinquency, family violence, and crime. While            effects have varied across studies, overall, the research indicates that home visiting has had modest            benefits for families on average. However, there are still significant gaps in our understanding—and            even more still to learn if we want to keep improving the effectiveness and efficiency of services.      ",
        display_name: "Home Visiting",
        division: {
            abbreviation: "DFS",
            created_by: null,
            created_by_user: null,
            created_on: "2024-07-29T14:44:44.546987Z",
            deputy_division_director_id: 520,
            display_name: "Division of Family Strengthening",
            division_director_id: 522,
            id: 5,
            name: "Division of Family Strengthening",
            updated_by: null,
            updated_by_user: null,
            updated_on: "2024-07-29T14:44:44.546987Z",
            versions: [
                {
                    id: 5,
                    transaction_id: 5
                }
            ]
        },
        division_id: 5,
        id: 7,
        name: "Home Visiting",
        shared_cans: [],
        status: "IN_PROCESS",
        team_leaders: [
            {
                agreements: [],
                contracts: [],
                created_by: null,
                created_by_user: null,
                created_on: "2024-07-29T14:44:44.737535Z",
                display_name: "Nancy Margie",
                division: 3,
                email: "Nancy.Margie@example.com",
                first_name: "Nancy",
                full_name: "Nancy Margie",
                groups: [],
                hhs_id: null,
                id: 506,
                last_name: "Margie",
                notifications: [7],
                oidc_id: "00000000-0000-1111-a111-000000000007",
                portfolios: [7],
                projects: [],
                roles: [],
                sessions: [],
                status: "INACTIVE",
                updated_by: null,
                updated_by_user: null,
                updated_on: "2024-07-29T14:44:44.737535Z",
                versions: [
                    {
                        id: 506,
                        transaction_id: 32
                    }
                ]
            }
        ],
        updated_by: null,
        updated_by_user: null,
        updated_on: "2024-07-29T14:44:49.700904Z",
        urls: [7],
        versions: [
            {
                id: 7,
                transaction_id: 115
            }
        ]
    },
    {
        abbreviation: "PS",
        cans: [502],
        created_by: null,
        created_by_user: null,
        created_on: "2024-07-29T14:44:49.714945Z",
        description: "",
        display_name: "Program Support",
        division: {
            abbreviation: "DDI",
            created_by: null,
            created_by_user: null,
            created_on: "2024-07-29T14:44:44.552281Z",
            deputy_division_director_id: 520,
            display_name: "Division of Data and Improvement",
            division_director_id: 522,
            id: 6,
            name: "Division of Data and Improvement",
            updated_by: null,
            updated_by_user: null,
            updated_on: "2024-07-29T14:44:44.552281Z",
            versions: [
                {
                    id: 6,
                    transaction_id: 6
                }
            ]
        },
        division_id: 6,
        id: 8,
        name: "Program Support",
        shared_cans: [],
        status: "IN_PROCESS",
        team_leaders: [
            {
                agreements: [],
                contracts: [],
                created_by: null,
                created_by_user: null,
                created_on: "2024-07-29T14:44:44.743736Z",
                display_name: "Nicole Deterding",
                division: 4,
                email: "Nicole.Deterding@example.com",
                first_name: "Nicole",
                full_name: "Nicole Deterding",
                groups: [],
                hhs_id: null,
                id: 507,
                last_name: "Deterding",
                notifications: [8],
                oidc_id: "00000000-0000-1111-a111-000000000008",
                portfolios: [8],
                projects: [],
                roles: [],
                sessions: [],
                status: "INACTIVE",
                updated_by: null,
                updated_by_user: null,
                updated_on: "2024-07-29T14:44:44.743736Z",
                versions: [
                    {
                        id: 507,
                        transaction_id: 33
                    }
                ]
            },
            {
                agreements: [],
                contracts: [],
                created_by: null,
                created_by_user: null,
                created_on: "2024-07-29T14:44:44.748552Z",
                display_name: "Valeria Butler",
                division: 4,
                email: "Valeria.Butler@example.com",
                first_name: "Valeria",
                full_name: "Valeria Butler",
                groups: [],
                hhs_id: null,
                id: 508,
                last_name: "Butler",
                notifications: [9],
                oidc_id: "00000000-0000-1111-a111-000000000009",
                portfolios: [8],
                projects: [],
                roles: [],
                sessions: [],
                status: "INACTIVE",
                updated_by: null,
                updated_by_user: null,
                updated_on: "2024-07-29T14:44:44.748552Z",
                versions: [
                    {
                        id: 508,
                        transaction_id: 34
                    }
                ]
            },
            {
                agreements: [1, 2, 9, 10, 11],
                contracts: [],
                created_by: null,
                created_by_user: null,
                created_on: "2024-07-29T14:44:44.915642Z",
                display_name: "Admin Demo",
                division: 3,
                email: "admin.demo@email.com",
                first_name: "Admin",
                full_name: "Admin Demo",
                groups: [],
                hhs_id: null,
                id: 520,
                last_name: "Demo",
                notifications: [21],
                oidc_id: "00000000-0000-1111-a111-000000000018",
                portfolios: [8],
                projects: [],
                roles: [1],
                sessions: [1],
                status: "ACTIVE",
                updated_by: null,
                updated_by_user: null,
                updated_on: "2024-07-29T14:44:44.915642Z",
                versions: [
                    {
                        id: 520,
                        transaction_id: 63
                    }
                ]
            }
        ],
        updated_by: null,
        updated_by_user: null,
        updated_on: "2024-07-29T14:44:49.714945Z",
        urls: [],
        versions: [
            {
                id: 8,
                transaction_id: 117
            }
        ]
    },
    {
        abbreviation: "DG",
        cans: [],
        created_by: null,
        created_by_user: null,
        created_on: "2024-07-29T14:44:49.746697Z",
        description: "",
        display_name: "Data Governance",
        division: {
            abbreviation: "DDI",
            created_by: null,
            created_by_user: null,
            created_on: "2024-07-29T14:44:44.552281Z",
            deputy_division_director_id: 520,
            display_name: "Division of Data and Improvement",
            division_director_id: 522,
            id: 6,
            name: "Division of Data and Improvement",
            updated_by: null,
            updated_by_user: null,
            updated_on: "2024-07-29T14:44:44.552281Z",
            versions: [
                {
                    id: 6,
                    transaction_id: 6
                }
            ]
        },
        division_id: 6,
        id: 9,
        name: "Data Governance",
        shared_cans: [],
        status: "IN_PROCESS",
        team_leaders: [],
        updated_by: null,
        updated_by_user: null,
        updated_on: "2024-07-29T14:44:49.746697Z",
        urls: [],
        versions: [
            {
                id: 9,
                transaction_id: 121
            }
        ]
    }
];

const canFundingCardData = {
    available_funding: 14300000.0,
    cans: [
        {
            can: {
                appropriation_date: "2023-10-01T00:00:00.000000Z",
                active_period: 1,
                arrangement_type: "OPRE_APPROPRIATION",
                budget_line_items: [15011, 15017, 15020],
                can_type: null,
                created_by: null,
                created_by_user: null,
                created_on: "2024-07-29T14:44:58.757452Z",
                description: "Social Science Research and Development",
                display_name: "G99PHS9",
                division_id: 6,
                expiration_date: "2024-09-01T00:00:00.000000Z",
                funding_sources: [26],
                id: 502,
                managing_portfolio: 8,
                portfolio_id: 8,
                nick_name: "SSRD",
                number: "G99PHS9",
                projects: [],
                shared_portfolios: [],
                updated_by: null,
                updated_by_user: null,
                updated_on: "2024-07-29T14:44:58.757452Z",
                versions: [
                    {
                        id: 502,
                        transaction_id: 208
                    }
                ]
            },
            carry_forward_label: "Carry-Forward",
            expiration_date: "09/01/2024"
        }
    ],
    carry_forward_funding: 14300000.0,
    expected_funding: 5000000.0,
    in_draft_funding: 0,
    in_execution_funding: 2000000.0,
    new_funding: 0,
    obligated_funding: 0,
    planned_funding: 7700000.0,
    received_funding: 19000000.0,
    total_funding: 24000000.0
};

const canFundingCardData2 = {
    available_funding: 1979500.0,
    cans: [
        {
            can: {
                appropriation_date: "2022-10-01T00:00:00.000000Z",
                active_period: 1,
                arrangement_type: "OPRE_APPROPRIATION",
                budget_line_items: [15018, 15021],
                can_type: null,
                created_by: null,
                created_by_user: null,
                created_on: "2024-07-29T14:44:58.941288Z",
                description: "Example CAN",
                display_name: "G99XXX8",
                division_id: 4,
                expiration_date: "2023-09-01T00:00:00.000000Z",
                funding_sources: [26],
                id: 512,
                managing_portfolio: 3,
                portfolio_id: 3,
                nick_name: "",
                number: "G99XXX8",
                projects: [1000],
                shared_portfolios: [],
                updated_by: null,
                updated_by_user: null,
                updated_on: "2024-07-29T14:44:58.941288Z",
                versions: [
                    {
                        id: 512,
                        transaction_id: 229
                    }
                ]
            },
            carry_forward_label: "Carry-Forward",
            expiration_date: "09/01/2023"
        }
    ],
    carry_forward_funding: 1979500.0,
    expected_funding: 520000.0,
    in_execution_funding: 0,
    obligated_funding: 500.0,
    planned_funding: 300000.0,
    received_funding: 1760000.0,
    total_funding: 2280000.0
};

const canFundingCardG99SHARED = {
    available_funding: -221614865.0,
    cans: [
        {
            can: {
                active_period: 5,
                appropriation_date: 2023,
                description: "Shared CAN",
                display_name: "G99SHARED",
                expiration_date: 2028,
                funding_budgets: [
                    {
                        budget: "500000.0",
                        can_id: 516,
                        display_name: "CANFundingBudget#31",
                        fiscal_year: 2023,
                        id: 31,
                        notes: null
                    }
                ],
                funding_details: {
                    allotment: null,
                    allowance: null,
                    appropriation: null,
                    display_name: "CANFundingDetails#17",
                    fiscal_year: 2023,
                    fund_code: "QQXXXX20235DAD",
                    funding_partner: null,
                    funding_source: null,
                    id: 17,
                    method_of_transfer: "IDDA",
                    sub_allowance: null
                },
                funding_details_id: 17,
                funding_received: [],
                id: 516,
                nick_name: "SHARED",
                number: "G99SHARED",
                portfolio: 3,
                portfolio_id: 3,
                projects: [{}, {}]
            },
            carry_forward_label: " Carry-Forward",
            expiration_date: "10/01/2028"
        }
    ],
    carry_forward_funding: 0.0,
    expected_funding: 500000.0,
    in_draft_funding: 50806571.0,
    in_execution_funding: 60769953.0,
    new_funding: 500000.0,
    obligated_funding: 70454089.0,
    planned_funding: 90890823.0,
    received_funding: 0.0,
    total_funding: 500000.0
};

const canFundingCard_G994426 = {
    available_funding: 37000000.0,
    cans: [
        {
            can: {
                appropriation_date: "2023-10-01T00:00:00.000000Z",
                active_period: 1,
                arrangement_type: "OPRE_APPROPRIATION",
                budget_line_items: [15000, 15001, 15012, 15022, 15023],
                can_type: null,
                created_by: null,
                created_by_user: null,
                created_on: "2024-08-02T13:45:56.155989Z",
                description: "Head Start Research",
                display_name: "G994426",
                division_id: 4,
                expiration_date: "2024-09-01T00:00:00.000000Z",
                funding_sources: [26],
                id: 504,
                managing_portfolio: 2,
                portfolio_id: 2,
                nick_name: "HS",
                number: "G994426",
                projects: [],
                shared_portfolios: [],
                updated_by: null,
                updated_by_user: null,
                updated_on: "2024-08-02T13:45:56.155989Z",
                versions: [
                    {
                        id: 504,
                        transaction_id: 212
                    }
                ]
            },
            carry_forward_label: "Carry-Forward",
            expiration_date: "09/01/2024"
        }
    ],
    carry_forward_funding: 37000000.0,
    expected_funding: 16000000.0,
    in_execution_funding: 2000000.0,
    obligated_funding: 0,
    planned_funding: 1000000.0,
    received_funding: 24000000.0,
    total_funding: 40000000.0
};

const selectedBudgetLinesToAmount = [
    {
        agreement_id: 9,
        amount: 300000,
        can: {
            appropriation_date: "2022-10-01T00:00:00.000000Z",
            active_period: 1,
            description: "Example CAN",
            display_name: "G99XXX8",
            expiration_date: "2023-09-01T00:00:00.000000Z",
            id: 512,
            portfolio_id: 3,
            nick_name: "",
            number: "G99XXX8"
        },
        can_id: 512,
        change_requests_in_review: [
            {
                agreement_id: 9,
                budget_line_item_id: 15021,
                change_request_type: "BUDGET_LINE_ITEM_CHANGE_REQUEST",
                created_by: 520,
                created_by_user: {
                    full_name: "Admin Demo",
                    id: 520
                },
                created_on: "2024-07-30T21:05:39.749813",
                display_name: "BudgetLineItemChangeRequest#2",
                has_budget_change: true,
                has_status_change: false,
                id: 2,
                managing_division_id: 4,
                requested_change_data: {
                    amount: 400000
                },
                requested_change_diff: {
                    amount: {
                        new: 400000,
                        old: 300000
                    }
                },
                requestor_notes: null,
                reviewed_on: null,
                reviewer_notes: null,
                status: "IN_REVIEW",
                updated_by: 520,
                updated_on: "2024-07-30T21:05:39.749813"
            }
        ],
        comments: "",
        created_by: null,
        created_on: "2024-07-30T20:27:23.655910",
        date_needed: "2044-06-13",
        fiscal_year: 2044,
        id: 15021,
        in_review: true,
        line_description: "SC3",
        portfolio_id: 3,
        proc_shop_fee_percentage: 0.005,
        services_component_id: 6,
        status: "PLANNED",
        team_members: [
            {
                email: "Niki.Denmark@example.com",
                full_name: "Niki Denmark",
                id: 511
            },
            {
                email: "admin.demo@email.com",
                full_name: "Admin Demo",
                id: 520
            }
        ],
        updated_on: "2024-07-30T21:05:39.694193"
    },
    {
        agreement_id: 9,
        amount: 700000,
        can: {
            appropriation_date: "2023-10-01T00:00:00.000000Z",
            active_period: 1,
            authorizer_id: 26,
            description: "Social Science Research and Development",
            display_name: "G99PHS9",
            expiration_date: "2024-09-01T00:00:00.000000Z",
            id: 502,
            portfolio_id: 8,
            nick_name: "SSRD",
            number: "G99PHS9"
        },
        can_id: 502,
        change_requests_in_review: [
            {
                agreement_id: 9,
                budget_line_item_id: 15020,
                change_request_type: "BUDGET_LINE_ITEM_CHANGE_REQUEST",
                created_by: 520,
                created_by_user: {
                    full_name: "Admin Demo",
                    id: 520
                },
                created_on: "2024-07-30T21:05:39.751887",
                display_name: "BudgetLineItemChangeRequest#3",
                has_budget_change: true,
                has_status_change: false,
                id: 3,
                managing_division_id: 6,
                requested_change_data: {
                    amount: 800000
                },
                requested_change_diff: {
                    amount: {
                        new: 800000,
                        old: 700000
                    }
                },
                requestor_notes: null,
                reviewed_on: null,
                reviewer_notes: null,
                status: "IN_REVIEW",
                updated_by: 520,
                updated_on: "2024-07-30T21:05:39.751887"
            }
        ],
        comments: "",
        created_by: null,
        created_on: "2024-07-30T20:27:23.646229",
        date_needed: "2043-06-13",
        fiscal_year: 2043,
        id: 15020,
        in_review: true,
        line_description: "SC2",
        portfolio_id: 8,
        proc_shop_fee_percentage: 0.005,
        services_component_id: 6,
        status: "PLANNED",
        team_members: [
            {
                email: "Niki.Denmark@example.com",
                full_name: "Niki Denmark",
                id: 511
            },
            {
                email: "admin.demo@email.com",
                full_name: "Admin Demo",
                id: 520
            }
        ],
        updated_on: "2024-07-30T21:05:39.693127"
    }
];

const selectedBudgetLinesToCans = [
    {
        agreement_id: 9,
        amount: 300000,
        can: {
            appropriation_date: "2022-10-01T00:00:00.000000Z",
            active_period: 1,
            authorizer_id: 26,
            description: "Example CAN",
            display_name: "G99XXX8",
            expiration_date: "2023-09-01T00:00:00.000000Z",
            id: 512,
            portfolio_id: 3,
            nick_name: "",
            number: "G99XXX8"
        },
        can_id: 512,
        change_requests_in_review: null,
        comments: "",
        created_by: null,
        created_on: "2024-07-30T20:27:23.655910",
        date_needed: "2044-06-13",
        fiscal_year: 2044,
        id: 15021,
        in_review: false,
        line_description: "SC3",
        portfolio_id: 3,
        proc_shop_fee_percentage: 0.005,
        services_component_id: 6,
        status: "PLANNED",
        team_members: [
            {
                email: "Niki.Denmark@example.com",
                full_name: "Niki Denmark",
                id: 511
            },
            {
                email: "admin.demo@email.com",
                full_name: "Admin Demo",
                id: 520
            }
        ],
        updated_on: "2024-07-30T22:27:22.626774"
    },
    {
        agreement_id: 9,
        amount: 700000,
        can: {
            appropriation_date: "2023-10-01T00:00:00.000000Z",
            active_period: 1,
            authorizer_id: 26,
            description: "Social Science Research and Development",
            display_name: "G99PHS9",
            expiration_date: "2024-09-01T00:00:00.000000Z",
            id: 502,
            portfolio_id: 8,
            nick_name: "SSRD",
            number: "G99PHS9"
        },
        can_id: 502,
        change_requests_in_review: [
            {
                agreement_id: 9,
                budget_line_item_id: 15020,
                change_request_type: "BUDGET_LINE_ITEM_CHANGE_REQUEST",
                created_by: 520,
                created_by_user: {
                    full_name: "Admin Demo",
                    id: 520
                },
                created_on: "2024-07-30T22:33:16.130507",
                display_name: "BudgetLineItemChangeRequest#6",
                has_budget_change: true,
                has_status_change: false,
                id: 6,
                managing_division_id: 6,
                requested_change_data: {
                    can_id: 512
                },
                requested_change_diff: {
                    can_id: {
                        new: 512,
                        old: 502
                    }
                },
                requestor_notes: null,
                reviewed_on: null,
                reviewer_notes: null,
                status: "IN_REVIEW",
                updated_by: 520,
                updated_on: "2024-07-30T22:33:16.130507"
            }
        ],
        comments: "",
        created_by: null,
        created_on: "2024-07-30T20:27:23.646229",
        date_needed: "2043-06-13",
        fiscal_year: 2043,
        id: 15020,
        in_review: true,
        line_description: "SC2",
        portfolio_id: 8,
        proc_shop_fee_percentage: 0.005,
        services_component_id: 6,
        status: "PLANNED",
        team_members: [
            {
                email: "Niki.Denmark@example.com",
                full_name: "Niki Denmark",
                id: 511
            },
            {
                email: "admin.demo@email.com",
                full_name: "Admin Demo",
                id: 520
            }
        ],
        updated_on: "2024-07-30T22:33:16.102621"
    }
];

const selectedBudgetLinesDRAFT_TO_PLANNED = [
    {
        agreement_id: 1,
        amount: 1000000,
        can: {
            appropriation_date: "2023-10-01T00:00:00.000000Z",
            active_period: 1,
            authorizer_id: 26,
            description: "Head Start Research",
            display_name: "G994426",
            expiration_date: "2024-09-01T00:00:00.000000Z",
            id: 504,
            portfolio_id: 2,
            nick_name: "HS",
            number: "G994426"
        },
        can_id: 504,
        change_requests_in_review: null,
        comments: "",
        created_by: null,
        created_on: "2024-08-02T13:46:05.462783",
        date_needed: "2043-06-13",
        fiscal_year: 2043,
        id: 15000,
        in_review: false,
        line_description: "LI 1",
        portfolio_id: 2,
        proc_shop_fee_percentage: 0,
        services_component_id: 1,
        status: "DRAFT",
        team_members: [
            {
                email: "chris.fortunato@example.com",
                full_name: "Chris Fortunato",
                id: 500
            },
            {
                email: "Amelia.Popham@example.com",
                full_name: "Amelia Popham",
                id: 503
            },
            {
                email: "admin.demo@email.com",
                full_name: "Admin Demo",
                id: 520
            },
            {
                email: "dave.director@email.com",
                full_name: "Dave Director",
                id: 522
            }
        ],
        updated_on: "2024-08-02T13:46:05.462783",
        selected: true,
        actionable: true
    },
    {
        agreement_id: 1,
        amount: 1000000,
        can: {
            appropriation_date: "2023-10-01T00:00:00.000000Z",
            active_period: 1,
            authorizer_id: 26,
            description: "Head Start Research",
            display_name: "G994426",
            expiration_date: "2024-09-01T00:00:00.000000Z",
            id: 504,
            portfolio_id: 2,
            nick_name: "HS",
            number: "G994426"
        },
        can_id: 504,
        change_requests_in_review: null,
        comments: "",
        created_by: null,
        created_on: "2024-08-02T13:46:05.478582",
        date_needed: "2043-06-13",
        fiscal_year: 2043,
        id: 15001,
        in_review: false,
        line_description: "LI 2",
        portfolio_id: 2,
        proc_shop_fee_percentage: 0,
        services_component_id: null,
        status: "DRAFT",
        team_members: [
            {
                email: "chris.fortunato@example.com",
                full_name: "Chris Fortunato",
                id: 500
            },
            {
                email: "Amelia.Popham@example.com",
                full_name: "Amelia Popham",
                id: 503
            },
            {
                email: "admin.demo@email.com",
                full_name: "Admin Demo",
                id: 520
            },
            {
                email: "dave.director@email.com",
                full_name: "Dave Director",
                id: 522
            }
        ],
        updated_on: "2024-08-02T13:46:05.478582",
        selected: true,
        actionable: true
    }
];

const selectedBudgetLines_CAN_and_AMT = [
    {
        agreement_id: 9,
        amount: 300000,
        can: {
            appropriation_date: "2022-10-01T00:00:00.000000Z",
            active_period: 1,
            authorizer_id: 26,
            description: "Example CAN",
            display_name: "G99XXX8",
            expiration_date: "2023-09-01T00:00:00.000000Z",
            id: 512,
            portfolio_id: 3,
            nick_name: "",
            number: "G99XXX8"
        },
        can_id: 512,
        change_requests_in_review: null,
        comments: "",
        created_by: null,
        created_on: "2024-08-02T13:46:05.685553",
        date_needed: "2044-06-13",
        fiscal_year: 2044,
        id: 15021,
        in_review: false,
        line_description: "SC3",
        portfolio_id: 3,
        proc_shop_fee_percentage: 0.005,
        services_component_id: 6,
        status: "PLANNED",
        team_members: [
            {
                email: "Niki.Denmark@example.com",
                full_name: "Niki Denmark",
                id: 511
            },
            {
                email: "admin.demo@email.com",
                full_name: "Admin Demo",
                id: 520
            }
        ],
        updated_on: "2024-08-02T13:46:05.685553"
    },
    {
        agreement_id: 9,
        amount: 700000,
        can: {
            appropriation_date: "2023-10-01T00:00:00.000000Z",
            active_period: 1,
            authorizer_id: 26,
            description: "Social Science Research and Development",
            display_name: "G99PHS9",
            expiration_date: "2024-09-01T00:00:00.000000Z",
            id: 502,
            portfolio_id: 8,
            nick_name: "SSRD",
            number: "G99PHS9"
        },
        can_id: 502,
        change_requests_in_review: [
            {
                agreement_id: 9,
                budget_line_item_id: 15020,
                change_request_type: "BUDGET_LINE_ITEM_CHANGE_REQUEST",
                created_by: 520,
                created_by_user: {
                    full_name: "Admin Demo",
                    id: 520
                },
                created_on: "2024-08-02T14:49:14.036675",
                display_name: "BudgetLineItemChangeRequest#2",
                has_budget_change: true,
                has_status_change: false,
                id: 2,
                managing_division_id: 6,
                requested_change_data: {
                    can_id: 512
                },
                requested_change_diff: {
                    can_id: {
                        new: 512,
                        old: 502
                    }
                },
                requestor_notes: null,
                reviewed_on: null,
                reviewer_notes: null,
                status: "IN_REVIEW",
                updated_by: 520,
                updated_on: "2024-08-02T14:49:14.036675"
            },
            {
                agreement_id: 9,
                budget_line_item_id: 15020,
                change_request_type: "BUDGET_LINE_ITEM_CHANGE_REQUEST",
                created_by: 520,
                created_by_user: {
                    full_name: "Admin Demo",
                    id: 520
                },
                created_on: "2024-08-02T14:49:14.076041",
                display_name: "BudgetLineItemChangeRequest#3",
                has_budget_change: true,
                has_status_change: false,
                id: 3,
                managing_division_id: 6,
                requested_change_data: {
                    amount: 800000
                },
                requested_change_diff: {
                    amount: {
                        new: 800000,
                        old: 700000
                    }
                },
                requestor_notes: null,
                reviewed_on: null,
                reviewer_notes: null,
                status: "IN_REVIEW",
                updated_by: 520,
                updated_on: "2024-08-02T14:49:14.076041"
            }
        ],
        comments: "",
        created_by: null,
        created_on: "2024-08-02T13:46:05.675655",
        date_needed: "2043-06-13",
        fiscal_year: 2043,
        id: 15020,
        in_review: true,
        line_description: "SC2",
        portfolio_id: 8,
        proc_shop_fee_percentage: 0.005,
        services_component_id: 6,
        status: "PLANNED",
        team_members: [
            {
                email: "Niki.Denmark@example.com",
                full_name: "Niki Denmark",
                id: 511
            },
            {
                email: "admin.demo@email.com",
                full_name: "Admin Demo",
                id: 520
            }
        ],
        updated_on: "2024-08-02T14:49:14.006540"
    }
];

const selectedBudgetLines_ProcurementShop = [
    {
        agreement: {
            agreement_type: "CONTRACT",
            awarding_entity_id: 3,
            id: 11,
            name: "Support Contract #1",
            project: {
                id: 1013,
                title: "Support Project #1"
            }
        },
        agreement_id: 11,
        amount: 300000,
        budget_line_item_type: "CONTRACT",
        can: {
            active_period: 5,
            description: "Shared CAN",
            display_name: "G99SHARED",
            funding_frequency: "Quarterly",
            funding_method: "Direct",
            funding_type: "Discretionary",
            id: 516,
            nick_name: "SHARED",
            number: "G99SHARED",
            portfolio: {
                division: {
                    abbreviation: "DCFD",
                    created_by: null,
                    created_on: "2025-08-08T18:26:34.526624Z",
                    deputy_division_director_id: null,
                    division_director_id: 522,
                    id: 4,
                    name: "Division of Child and Family Development",
                    updated_by: null,
                    updated_on: "2025-08-08T18:26:34.526624Z"
                },
                division_id: 4
            },
            portfolio_id: 3
        },
        can_id: 516,
        change_requests_in_review: [
            {
                agreement_id: 11,
                change_request_type: "AGREEMENT_CHANGE_REQUEST",
                created_by: 522,
                created_by_user: {
                    full_name: "Dave Director",
                    id: 522
                },
                created_on: "2025-08-08T19:17:41.050287",
                display_name: "AgreementChangeRequest#3",
                has_proc_shop_change: true,
                id: 3,
                managing_division_id: null,
                requested_change_data: {
                    awarding_entity_id: 4
                },
                requested_change_diff: {
                    awarding_entity_id: {
                        new: 4,
                        old: 3
                    }
                },
                requestor_notes: null,
                reviewed_on: null,
                reviewer_notes: null,
                status: "IN_REVIEW",
                updated_by: 522,
                updated_on: "2025-08-08T19:17:41.050287"
            }
        ],
        comments: "",
        created_by: 503,
        created_on: "2025-08-08T18:27:03.273429",
        date_needed: "2044-06-13",
        fees: 1500,
        fiscal_year: 2044,
        id: 15006,
        in_review: true,
        is_obe: false,
        line_description: "Support #1",
        portfolio_id: 3,
        portfolio_team_leaders: [
            {
                email: "Ivelisse.Martinez-Beck@example.com",
                full_name: "Ivelisse Martinez-Beck",
                id: 502
            }
        ],
        proc_shop_fee_percentage: 0.005,
        procurement_shop_fee: null,
        procurement_shop_fee_id: null,
        services_component_id: 8,
        status: "PLANNED",
        team_members: [
            {
                email: "Niki.Denmark@example.com",
                full_name: "Niki Denmark",
                id: 511
            },
            {
                email: "system.owner@email.com",
                full_name: "System Owner",
                id: 520
            }
        ],
        updated_by: null,
        updated_on: "2025-08-08T18:27:03.273429"
    },
    {
        agreement: {
            agreement_type: "CONTRACT",
            awarding_entity_id: 3,
            id: 11,
            name: "Support Contract #1",
            project: {
                id: 1013,
                title: "Support Project #1"
            }
        },
        agreement_id: 11,
        amount: 500000,
        budget_line_item_type: "CONTRACT",
        can: {
            active_period: 5,
            description: "Shared CAN",
            display_name: "G99SHARED",
            funding_frequency: "Quarterly",
            funding_method: "Direct",
            funding_type: "Discretionary",
            id: 516,
            nick_name: "SHARED",
            number: "G99SHARED",
            portfolio: {
                division: {
                    abbreviation: "DCFD",
                    created_by: null,
                    created_on: "2025-08-08T18:26:34.526624Z",
                    deputy_division_director_id: null,
                    division_director_id: 522,
                    id: 4,
                    name: "Division of Child and Family Development",
                    updated_by: null,
                    updated_on: "2025-08-08T18:26:34.526624Z"
                },
                division_id: 4
            },
            portfolio_id: 3
        },
        can_id: 516,
        change_requests_in_review: [
            {
                agreement_id: 11,
                change_request_type: "AGREEMENT_CHANGE_REQUEST",
                created_by: 522,
                created_by_user: {
                    full_name: "Dave Director",
                    id: 522
                },
                created_on: "2025-08-08T19:17:41.050287",
                display_name: "AgreementChangeRequest#3",
                has_proc_shop_change: true,
                id: 3,
                managing_division_id: null,
                requested_change_data: {
                    awarding_entity_id: 4
                },
                requested_change_diff: {
                    awarding_entity_id: {
                        new: 4,
                        old: 3
                    }
                },
                requestor_notes: null,
                reviewed_on: null,
                reviewer_notes: null,
                status: "IN_REVIEW",
                updated_by: 522,
                updated_on: "2025-08-08T19:17:41.050287"
            }
        ],
        comments: null,
        created_by: 520,
        created_on: "2025-08-08T19:00:32.412092",
        date_needed: "2025-08-20",
        fees: 250000,
        fiscal_year: 2025,
        id: 16044,
        in_review: true,
        is_obe: false,
        line_description: "",
        portfolio_id: 3,
        portfolio_team_leaders: [
            {
                email: "Ivelisse.Martinez-Beck@example.com",
                full_name: "Ivelisse Martinez-Beck",
                id: 502
            }
        ],
        proc_shop_fee_percentage: 0.5,
        procurement_shop_fee: null,
        procurement_shop_fee_id: null,
        services_component_id: 8,
        status: "DRAFT",
        team_members: [
            {
                email: "Niki.Denmark@example.com",
                full_name: "Niki Denmark",
                id: 511
            },
            {
                email: "system.owner@email.com",
                full_name: "System Owner",
                id: 520
            }
        ],
        updated_by: 520,
        updated_on: "2025-08-08T19:00:32.412092"
    }
];
