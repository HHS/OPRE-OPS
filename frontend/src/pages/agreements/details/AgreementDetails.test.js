import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
// import "@testing-library/jest-dom";
import AgreementDetails from "./AgreementDetails";
import { Router } from "react-router-dom";
import { createMemoryHistory } from "history";
import TestApplicationContext from "../../../applicationContext/TestApplicationContext";
const history = createMemoryHistory();
import store from "../../../store";
import { vi } from "vitest";

// mocking ResponsiveBar until there's a solution for TypeError: Cannot read properties of null (reading 'width')
vi.mock("@nivo/bar", () => ({
    __esModule: true,
    ResponsiveBar: () => {
        return <div />;
    }
}));

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => vi.fn()
    };
});

vi.mock("react", async () => {
    const actual = await vi.importActual("react");
    return {
        ...actual,
        useState: () => [null, vi.fn()]
    };
});

const agreementHistoryData = [
    {
        changes: {
            product_service_code_id: {
                new: 1,
                old: null
            },
            project_officer: {
                new: 1,
                old: null
            },
            team_members: {
                added: [
                    {
                        full_name: "Amy Madigan",
                        id: 2
                    }
                ],
                collection_of: "User",
                deleted: []
            }
        },
        class_name: "ContractAgreement",
        created_by: 17,
        created_by_user_full_name: "Steve Tekell",
        created_on: "2023-08-30T14:05:59.958722",
        event_details: {
            agreement_reason: null,
            agreement_type: "CONTRACT",
            contract_number: null,
            contract_type: null,
            created_by: 17,
            created_on: "2023-08-29T21:36:25.183870",
            delivered_status: false,
            description: "blah blah blah",
            id: 11,
            incumbent: null,
            name: "Demo Contract Title Edited",
            notes: "",
            number: "",
            procurement_shop: {
                abbr: "GCS",
                created_by: null,
                created_on: "2023-08-24T16:19:01.268399",
                fee: 0.0,
                id: 2,
                name: "Government Contracting Services",
                updated_on: "2023-08-24T16:19:01.268399"
            },
            procurement_shop_id: 2,
            product_service_code: {
                created_by: null,
                created_on: "2023-08-24T16:19:01.268399",
                description: "",
                id: 1,
                naics: 541690,
                name: "Other Scientific and Technical Consulting Services",
                support_code: "R410 - Research",
                updated_on: "2023-08-24T16:19:01.268399"
            },
            product_service_code_id: 1,
            project_officer_id: 1,
            research_project: {
                created_by: null,
                created_on: "2023-08-24T16:18:48.654514",
                description:
                    "The Administration for Children and Families (ACF), within the U.S. Department of Health and Human Services, is responsible for federal programs that address the needs of vulnerable children and families throughout our society, including Native Americans, individuals with developmental disabilities, and refugees.",
                id: 3,
                methodologies: [
                    "SURVEY",
                    "FIELD_RESEARCH",
                    "PARTICIPANT_OBSERVATION",
                    "ETHNOGRAPHY",
                    "EXPERIMENT",
                    "SECONDARY_DATA_ANALYSIS",
                    "CASE_STUDY"
                ],
                origination_date: "2000-01-01",
                populations: ["POPULATION_1"],
                short_title: "",
                team_leaders: [],
                title: "Annual Performance Plans and Reports",
                updated_on: "2023-08-24T16:18:48.654514",
                url: "https://www.acf.hhs.gov/opre/project/acf-annual-performance-plans-and-reports-2000-2012"
            },
            research_project_id: 3,
            support_contacts: [],
            team_members: [
                {
                    created_by: null,
                    created_on: "2023-08-24T16:18:57.391020",
                    date_joined: "2023-08-24T16:18:57.391020",
                    division: 1,
                    email: "Amy.Madigan@example.com",
                    first_name: "Amy",
                    full_name: "Amy Madigan",
                    hhs_id: null,
                    id: 2,
                    last_name: "Madigan",
                    oidc_id: "00000000-0000-1111-a111-000000000002",
                    updated: null,
                    updated_on: "2023-08-24T16:18:57.391020"
                }
            ],
            updated_on: "2023-08-29T21:37:20.045738",
            vendor: null
        },
        event_type: "UPDATED",
        id: 58,
        row_key: "11",
        updated_on: "2023-08-30T14:05:59.958722"
    },
    {
        changes: {
            amount: {
                new: 200000.0,
                old: 100000.0
            },
            date_needed: {
                new: "2023-02-02",
                old: "2023-01-01"
            },
            proc_shop_fee_percentage: {
                new: 0.0,
                old: null
            }
        },
        class_name: "BudgetLineItem",
        created_by: 17,
        created_by_user_full_name: "Steve Tekell",
        created_on: "2023-08-29T21:37:56.300512",
        event_details: {
            agreement_id: 11,
            amount: 200000.0,
            can: {
                id: 1,
                nickname: "HMRF-OPRE",
                number: "G99HRF2"
            },
            can_id: 1,
            comments: "",
            created_by: 17,
            created_on: "2023-08-29T21:36:51.385646",
            date_needed: "2023-02-02",
            id: 25,
            line_description: "My Budget Line",
            proc_shop_fee_percentage: null,
            status: "DRAFT",
            updated_on: "2023-08-29T21:36:51.385646"
        },
        event_type: "UPDATED",
        id: 56,
        original: {
            agreement_id: 11,
            amount: 100000.0,
            can_id: 1,
            created_by: 17,
            created_on: "2023-08-29T21:36:51.385646",
            date_needed: "2023-01-01",
            id: 25,
            line_description: "My Budget Line",
            status: "DRAFT",
            updated_on: "2023-08-29T21:36:51.385646"
        },
        row_key: "25",
        updated_on: "2023-08-29T21:37:56.300512"
    },
    {
        changes: {
            description: {
                new: "blah blah blah",
                old: "yadda yadda yadda"
            },
            name: {
                new: "Demo Contract Title Edited",
                old: "Demo Contract Title"
            }
        },
        class_name: "ContractAgreement",
        created_by: 17,
        created_by_user_full_name: "Steve Tekell",
        created_on: "2023-08-29T21:37:20.045738",
        event_details: {
            agreement_reason: null,
            agreement_type: "CONTRACT",
            contract_number: null,
            contract_type: null,
            created_by: 17,
            created_on: "2023-08-29T21:36:25.183870",
            delivered_status: false,
            description: "blah blah blah",
            id: 11,
            incumbent: null,
            name: "Demo Contract Title Edited",
            notes: "",
            number: "",
            procurement_shop: {
                abbr: "GCS",
                created_by: null,
                created_on: "2023-08-24T16:19:01.268399",
                fee: 0.0,
                id: 2,
                name: "Government Contracting Services",
                updated_on: "2023-08-24T16:19:01.268399"
            },
            procurement_shop_id: 2,
            product_service_code: null,
            product_service_code_id: null,
            project_officer_id: null,
            research_project: {
                id: 3,
                title: "Annual Performance Plans and Reports"
            },
            research_project_id: 3,
            support_contacts: [],
            team_members: [],
            updated_on: "2023-08-29T21:36:25.183870",
            vendor: null
        },
        event_type: "UPDATED",
        id: 55,
        row_key: "11",
        updated_on: "2023-08-29T21:37:20.045738"
    },
    {
        changes: {
            agreement_id: {
                new: 11
            },
            amount: {
                new: 100000.0
            },
            can_id: {
                new: 1
            },
            created_by: {
                new: 17
            },
            date_needed: {
                new: "2023-01-01"
            },
            line_description: {
                new: "My Budget Line"
            },
            status: {
                new: "DRAFT"
            }
        },
        class_name: "BudgetLineItem",
        created_by: 17,
        created_by_user_full_name: "Steve Tekell",
        created_on: "2023-08-29T21:36:51.385646",
        event_details: {
            agreement_id: 11,
            amount: 100000.0,
            can: null,
            can_id: 1,
            comments: "",
            created_by: 17,
            created_on: "2023-08-29T21:36:51.385646",
            date_needed: "2023-01-01",
            id: 25,
            line_description: "My Budget Line",
            proc_shop_fee_percentage: null,
            status: "DRAFT",
            updated_on: "2023-08-29T21:36:51.385646"
        },
        event_type: "NEW",
        id: 54,
        row_key: "25",
        updated_on: "2023-08-29T21:36:51.385646"
    },
    {
        changes: {
            agreement_type: {
                new: "CONTRACT"
            },
            created_by: {
                new: 17
            },
            description: {
                new: "yadda yadda yadda"
            },
            name: {
                new: "Demo Contract Title"
            },
            procurement_shop_id: {
                new: 2
            },
            research_project_id: {
                new: 3
            }
        },
        class_name: "ContractAgreement",
        created_by: 17,
        created_by_user_full_name: "Steve Tekell",
        created_on: "2023-08-29T21:36:25.183870",
        event_details: {
            agreement_reason: null,
            agreement_type: "CONTRACT",
            contract_number: null,
            contract_type: null,
            created_by: 17,
            created_on: "2023-08-29T21:36:25.183870",
            delivered_status: false,
            description: "yadda yadda yadda",
            id: 11,
            incumbent: null,
            name: "Demo Contract Title",
            notes: "",
            number: "",
            procurement_shop: null,
            procurement_shop_id: 2,
            product_service_code: null,
            product_service_code_id: null,
            project_officer_id: null,
            research_project: null,
            research_project_id: 3,
            support_contacts: [],
            team_members: [],
            updated_on: "2023-08-29T21:36:25.183870",
            vendor: null
        },
        event_type: "NEW",
        id: 53,
        row_key: "11",
        updated_on: "2023-08-29T21:36:25.183870"
    }
];

// This will reset all mocks after each test
afterEach(() => {
    vi.resetAllMocks();
});

describe("AgreementDetails", () => {
    const agreement = {
        id: 1,
        name: "Test Agreement",
        description: "Test Description",
        research_project: { title: "Test Project" },
        agreement_type: "CONTRACT",
        product_service_code: {
            name: "Test PSC",
            naics: "Test NAICS"
        },

        procurement_shop: {
            abbr: "NIH",
            fee: 0.005,
            name: "National Institute of Health"
        },
        agreement_reason: "RECOMPETE",
        incumbent: "Test Incumbent",
        project_officer_id: 1,
        team_members: [
            {
                full_name: "Amy Madigan",
                id: 2
            },
            {
                full_name: "Ivelisse Martinez-Beck",
                id: 3
            }
        ],
        budget_line_items: [
            { amount: 100, date_needed: "2024-05-02T11:00:00", status: "DRAFT" },
            { amount: 200, date_needed: "2023-03-02T11:00:00", status: "UNDER_REVIEW" }
        ],
        created_by: "user1",
        notes: "Test notes",
        created_on: "2021-10-21T03:24:00"
    };

    const projectOfficer = {
        full_name: "Chris Fortunato",
        id: 1
    };

    test("renders correctly", () => {
        TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
            return agreementHistoryData;
        });

        // IntersectionObserver isn't available in test environment
        const mockIntersectionObserver = vi.fn();
        mockIntersectionObserver.mockReturnValue({
            observe: () => null,
            unobserve: () => null,
            disconnect: () => null
        });
        window.IntersectionObserver = mockIntersectionObserver;

        render(
            <Provider store={store}>
                <Router
                    location={history.location}
                    navigator={history}
                >
                    <AgreementDetails
                        agreement={agreement}
                        projectOfficer={projectOfficer}
                        isEditMode={false}
                        setIsEditMode={vi.fn}
                    />
                </Router>
            </Provider>
        );

        expect(screen.getByText("Test Description")).toBeInTheDocument();
        expect(screen.getByText("Agreement Type")).toBeInTheDocument();
        expect(screen.getByText("Contract")).toBeInTheDocument();
        expect(screen.getByText("Product Service Code")).toBeInTheDocument();
        expect(screen.getByText("Test PSC")).toBeInTheDocument();
        expect(screen.getByText("NAICS Code")).toBeInTheDocument();
        expect(screen.getByText("Test NAICS")).toBeInTheDocument();
        expect(screen.getByText("Procurement Shop")).toBeInTheDocument();
        expect(screen.getByText("NIH - Fee Rate: 0.5%")).toBeInTheDocument();
        expect(screen.getByText("Agreement Reason")).toBeInTheDocument();
        expect(screen.getByText("Recompete")).toBeInTheDocument();
        expect(screen.getByText("Incumbent")).toBeInTheDocument();
        expect(screen.getByText("Test Incumbent")).toBeInTheDocument();
        expect(screen.getByText("Project Officer")).toBeInTheDocument();
        expect(screen.getByText("Chris Fortunato")).toBeInTheDocument();
        expect(screen.getByText("Team Members")).toBeInTheDocument();
        expect(screen.getByText("Amy Madigan")).toBeInTheDocument();
        expect(screen.getByText("Ivelisse Martinez-Beck")).toBeInTheDocument();
    });
});
