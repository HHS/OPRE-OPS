import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import AgreementDetails from "./AgreementDetails";
import { Router } from "react-router-dom";
import { createMemoryHistory } from "history";
import TestApplicationContext from "../../../applicationContext/TestApplicationContext";
const history = createMemoryHistory();
import store from "../../../store";
import { vi } from "vitest";
import { USER_ROLES } from "../../../components/Users/User.constants";
import { configureStore } from "@reduxjs/toolkit";

const mockFn = TestApplicationContext.helpers().mockFn;
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
        useNavigate: () => mockFn,
        useBlocker: () => ({
            state: "idle",
            proceed: vi.fn(),
            reset: vi.fn(),
            nextLocation: null
        })
    };
});

vi.mock("react", async () => {
    const actual = await vi.importActual("react");
    return {
        ...actual,
        useState: () => [null, mockFn]
    };
});

vi.mock("./AgreementDetailsEdit", () => ({
    __esModule: true,
    default: () => <div data-testid="agreement-details-edit" />
}));

const agreementHistoryData = [
    {
        changes: {
            product_service_code_id: {
                new: 1,
                old: null
            },
            project_officer: {
                new: 500,
                old: null
            },
            team_members: {
                added: [
                    {
                        full_name: "Amy Madigan",
                        id: 501
                    }
                ],
                collection_of: "User",
                deleted: []
            }
        },
        class_name: "ContractAgreement",
        created_by: 516,
        created_by_user_full_name: "Steve Tekell",
        created_on: "2023-08-30T14:05:59.958722",
        event_details: {
            agreement_reason: null,
            agreement_type: "CONTRACT",
            contract_number: null,
            contract_type: null,
            created_by: 516,
            created_on: "2023-08-29T21:36:25.183870",
            delivered_status: false,
            description: "blah blah blah",
            id: 11,
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
            awarding_entity_id: 2,
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
            project_officer_id: 500,
            project: {
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
                url: "https://acf.gov/opre/project/acf-annual-performance-plans-and-reports-2000-2012"
            },
            project_id: 3,
            support_contacts: [],
            team_members: [
                {
                    created_by: null,
                    created_on: "2023-08-24T16:18:57.391020",
                    division: 1,
                    email: "Amy.Madigan@example.com",
                    first_name: "Amy",
                    full_name: "Amy Madigan",
                    hhs_id: null,
                    id: 501,
                    last_name: "Madigan",
                    oidc_id: "00000000-0000-1111-a111-000000000002",
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
    }
];

// This will reset all mocks after each test
afterEach(() => {
    vi.resetAllMocks();
});

const mockIntersectionObserver = () => {
    window.IntersectionObserver = vi.fn(function () {
        return {
            observe: vi.fn(),
            unobserve: vi.fn(),
            disconnect: vi.fn()
        };
    });
};

describe("AgreementDetails", () => {
    const agreement = {
        _meta: {
            isEditable: true
        },
        id: 1,
        in_review: true,
        name: "Test Agreement",
        description: "Test Description",
        project: undefined,
        agreement_type: "CONTRACT",
        product_service_code: {
            id: 1,
            name: "Test PSC",
            naics: 12345
        },
        team_leaders: [],
        division_directors: [],
        procurement_shop: {
            id: 2,
            abbr: "NIH",
            fee_percentage: 0.5,
            name: "National Institute of Health",
            procurement_shop_fees: []
        },
        agreement_reason: "RECOMPETE",
        vendor: "Test Vendor",
        project_officer_id: 500,
        team_members: [
            {
                full_name: "Amy Madigan",
                id: 501,
                email: "amy.madigan@example.com"
            },
            {
                full_name: "Ivelisse Martinez-Beck",
                id: 502,
                email: "ivelisse.martinez@example.com"
            }
        ],
        budget_line_items: [],
        created_by: "user1",
        notes: "Test notes",
        created_on: new Date("2021-10-21T03:24:00")
    };

    const projectOfficer = {
        full_name: "Chris Fortunato",
        id: 500,
        email: "chris.fortunato@example.com"
    };

    test("renders AA type agreement correctly", () => {
        TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
            return agreementHistoryData;
        });
        mockIntersectionObserver();

        render(
            <Provider store={store}>
                <Router
                    location={history.location}
                    navigator={history}
                >
                    <AgreementDetails
                        agreement={{ ...agreement, agreement_type: "AA" }}
                        projectOfficer={projectOfficer}
                        alternateProjectOfficer={projectOfficer}
                        isEditMode={false}
                        setIsEditMode={mockFn}
                        setHasAgreementChanged={mockFn}
                        isAgreementNotDeveloped={true}
                        isAgreementAwarded={false}
                    />
                </Router>
            </Provider>
        );

        expect(screen.getByText("Edit Agreement Details")).toBeInTheDocument();
        expect(screen.getByText("Agreement Type")).toBeInTheDocument();
        expect(screen.getAllByText("Assisted Acquisition (AA)").length).toBeGreaterThan(0);
        expect(screen.getByText("COR")).toBeInTheDocument();
        expect(screen.getAllByText("Chris Fortunato")[0]).toBeInTheDocument();
        expect(screen.getByText("Team Members")).toBeInTheDocument();
        expect(screen.getByText("Amy Madigan")).toBeInTheDocument();
        expect(screen.getByText("Ivelisse Martinez-Beck")).toBeInTheDocument();
    });

    test("renders contract type agreement correctly", () => {
        TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
            return agreementHistoryData;
        });
        mockIntersectionObserver();

        render(
            <Provider store={store}>
                <Router
                    location={history.location}
                    navigator={history}
                >
                    <AgreementDetails
                        agreement={{
                            ...agreement,
                            procurement_shop: {
                                id: 2,
                                abbr: "GCS",
                                fee_percentage: 0,
                                name: "GCS",
                                procurement_shop_fees: []
                            }
                        }}
                        projectOfficer={projectOfficer}
                        alternateProjectOfficer={projectOfficer}
                        isEditMode={false}
                        setIsEditMode={mockFn}
                        setHasAgreementChanged={mockFn}
                        isAgreementNotDeveloped={false}
                        isAgreementAwarded={false}
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
        expect(screen.getByText("12345")).toBeInTheDocument();
        expect(screen.getByText("Procurement Shop")).toBeInTheDocument();
        expect(screen.getByText("GCS")).toBeInTheDocument();
        expect(screen.getByText("Agreement Reason")).toBeInTheDocument();
        expect(screen.getByText("Recompete")).toBeInTheDocument();
        expect(screen.getByText("Vendor")).toBeInTheDocument();
        expect(screen.getByText("Test Vendor")).toBeInTheDocument();
        expect(screen.getByText("COR")).toBeInTheDocument();
        expect(screen.getAllByText("Chris Fortunato")[0]).toBeInTheDocument();
        expect(screen.getByText("Team Members")).toBeInTheDocument();
        expect(screen.getByText("Amy Madigan")).toBeInTheDocument();
        expect(screen.getByText("Ivelisse Martinez-Beck")).toBeInTheDocument();
    });

    test("allows super user to edit when isAgreementNotDeveloped is true", () => {
        TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
            return agreementHistoryData;
        });

        // Create a test store with super user
        const testStore = configureStore({
            reducer: {
                auth: () => ({
                    activeUser: {
                        id: 1,
                        full_name: "Super User",
                        email: "super@example.com",
                        roles: [{ id: 7, name: USER_ROLES.SUPER_USER, is_superuser: true }],
                        is_superuser: true
                    }
                })
            }
        });
        mockIntersectionObserver();

        render(
            <Provider store={testStore}>
                <Router
                    location={history.location}
                    navigator={history}
                >
                    <AgreementDetails
                        agreement={{ ...agreement, agreement_type: "GRANT" }}
                        projectOfficer={projectOfficer}
                        alternateProjectOfficer={projectOfficer}
                        isEditMode={false}
                        setIsEditMode={mockFn}
                        setHasAgreementChanged={mockFn}
                        isAgreementNotDeveloped={true}
                        isAgreementAwarded={false}
                    />
                </Router>
            </Provider>
        );

        // Should show edit button for super users even on non-contract agreements
        expect(screen.getByRole("button", { name: /Edit/i })).toBeInTheDocument();
        expect(screen.getByText("Edit Agreement Details")).toBeInTheDocument();
    });

    test("allows super user to edit when agreement._meta.isEditable is false", () => {
        TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
            return agreementHistoryData;
        });

        // Create a test store with super user
        const testStore = configureStore({
            reducer: {
                auth: () => ({
                    activeUser: {
                        id: 1,
                        full_name: "Super User",
                        email: "super@example.com",
                        roles: [{ id: 7, name: USER_ROLES.SUPER_USER, is_superuser: true }],
                        is_superuser: true
                    }
                })
            }
        });
        mockIntersectionObserver();

        render(
            <Provider store={testStore}>
                <Router
                    location={history.location}
                    navigator={history}
                >
                    <AgreementDetails
                        agreement={{
                            ...agreement,
                            _meta: { isEditable: false }
                        }}
                        projectOfficer={projectOfficer}
                        alternateProjectOfficer={projectOfficer}
                        isEditMode={false}
                        setIsEditMode={mockFn}
                        setHasAgreementChanged={mockFn}
                        isAgreementNotDeveloped={false}
                        isAgreementAwarded={false}
                    />
                </Router>
            </Provider>
        );

        // Should show edit button for super users even when agreement is not normally editable
        expect(screen.getByRole("button", { name: /Edit/i })).toBeInTheDocument();
        expect(screen.getByText("Edit Agreement Details")).toBeInTheDocument();
    });

    test("regular user cannot edit when isAgreementNotDeveloped is true", () => {
        TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
            return agreementHistoryData;
        });

        // Create a test store with regular user (no super user role)
        const testStore = configureStore({
            reducer: {
                auth: () => ({
                    activeUser: {
                        id: 1,
                        full_name: "Regular User",
                        email: "user@example.com",
                        roles: [{ id: 2, name: USER_ROLES.VIEWER_EDITOR, is_superuser: false }]
                    }
                })
            }
        });
        mockIntersectionObserver();

        render(
            <Provider store={testStore}>
                <Router
                    location={history.location}
                    navigator={history}
                >
                    <AgreementDetails
                        agreement={{ ...agreement, agreement_type: "GRANT" }}
                        projectOfficer={projectOfficer}
                        alternateProjectOfficer={projectOfficer}
                        isEditMode={false}
                        setIsEditMode={mockFn}
                        setHasAgreementChanged={mockFn}
                        isAgreementNotDeveloped={true}
                        isAgreementAwarded={false}
                    />
                </Router>
            </Provider>
        );

        // Should NOT show edit button for regular users on non-contract agreements
        expect(screen.queryByRole("button", { name: /Edit/i })).not.toBeInTheDocument();
        expect(screen.getByText("Edit Agreement Details")).toBeInTheDocument();
    });

    test("renders awarded agreement with contract number", () => {
        TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
            return agreementHistoryData;
        });
        mockIntersectionObserver();

        const awardedAgreement = {
            ...agreement,
            contract_number: "XXXX000000007"
        };

        render(
            <Provider store={store}>
                <Router
                    location={history.location}
                    navigator={history}
                >
                    <AgreementDetails
                        agreement={awardedAgreement}
                        projectOfficer={projectOfficer}
                        alternateProjectOfficer={projectOfficer}
                        isEditMode={false}
                        setIsEditMode={mockFn}
                        setHasAgreementChanged={mockFn}
                        isAgreementNotDeveloped={false}
                        isAgreementAwarded={true}
                    />
                </Router>
            </Provider>
        );

        expect(screen.getByText("Contract #")).toBeInTheDocument();
        expect(screen.getByText("XXXX000000007")).toBeInTheDocument();
    });

    test("does not render contract number for non-awarded agreement", () => {
        TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
            return agreementHistoryData;
        });
        mockIntersectionObserver();

        render(
            <Provider store={store}>
                <Router
                    location={history.location}
                    navigator={history}
                >
                    <AgreementDetails
                        agreement={agreement}
                        projectOfficer={projectOfficer}
                        alternateProjectOfficer={projectOfficer}
                        isEditMode={false}
                        setIsEditMode={mockFn}
                        setHasAgreementChanged={mockFn}
                        isAgreementNotDeveloped={false}
                        isAgreementAwarded={false}
                    />
                </Router>
            </Provider>
        );

        expect(screen.queryByText("Contract #")).not.toBeInTheDocument();
    });

    test("renders correctly when isAgreementAwarded is derived from agreement.is_awarded property", () => {
        TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
            return agreementHistoryData;
        });
            mockIntersectionObserver();

        const awardedAgreement = {
            ...agreement,
            contract_number: "DERIVED_TEST_123",
            is_awarded: true
        };

        render(
            <Provider store={store}>
                <Router
                    location={history.location}
                    navigator={history}
                >
                    <AgreementDetails
                        agreement={awardedAgreement}
                        projectOfficer={projectOfficer}
                        alternateProjectOfficer={projectOfficer}
                        isEditMode={false}
                        setIsEditMode={mockFn}
                        setHasAgreementChanged={mockFn}
                        isAgreementNotDeveloped={false}
                        isAgreementAwarded={awardedAgreement.is_awarded}
                    />
                </Router>
            </Provider>
        );

        expect(screen.getByText("DERIVED_TEST_123")).toBeInTheDocument();
        expect(screen.getByText("Contract #")).toBeInTheDocument();
    });

    describe("hasAgreementChanged prop propagation", () => {
        test("passes hasAgreementChanged to AgreementDetailHeader as hasUnsavedChanges", () => {
            TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
                return agreementHistoryData;
            });
            mockIntersectionObserver();

            render(
                <Provider store={store}>
                    <Router
                        location={history.location}
                        navigator={history}
                    >
                        <AgreementDetails
                            agreement={agreement}
                            projectOfficer={projectOfficer}
                            alternateProjectOfficer={projectOfficer}
                            isEditMode={true}
                            setIsEditMode={mockFn}
                            setHasAgreementChanged={mockFn}
                            isAgreementNotDeveloped={false}
                            isAgreementAwarded={false}
                            hasAgreementChanged={true}
                        />
                    </Router>
                </Provider>
            );

            // Unsaved changes badge should appear when in edit mode with changes
            expect(screen.getByText("Unsaved Changes")).toBeInTheDocument();
        });

        test("hides unsaved changes badge when hasAgreementChanged is false", () => {
            TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
                return agreementHistoryData;
            });
            mockIntersectionObserver();

            render(
                <Provider store={store}>
                    <Router
                        location={history.location}
                        navigator={history}
                    >
                        <AgreementDetails
                            agreement={agreement}
                            projectOfficer={projectOfficer}
                            alternateProjectOfficer={projectOfficer}
                            isEditMode={true}
                            setIsEditMode={mockFn}
                            setHasAgreementChanged={mockFn}
                            isAgreementNotDeveloped={false}
                            isAgreementAwarded={false}
                            hasAgreementChanged={false}
                        />
                    </Router>
                </Provider>
            );

            // Unsaved changes badge should not appear
            expect(screen.queryByText("Unsaved Changes")).not.toBeInTheDocument();
        });

        test("hides unsaved changes badge when not in edit mode", () => {
            TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
                return agreementHistoryData;
            });
            mockIntersectionObserver();

            render(
                <Provider store={store}>
                    <Router
                        location={history.location}
                        navigator={history}
                    >
                        <AgreementDetails
                            agreement={agreement}
                            projectOfficer={projectOfficer}
                            alternateProjectOfficer={projectOfficer}
                            isEditMode={false}
                            setIsEditMode={mockFn}
                            setHasAgreementChanged={mockFn}
                            isAgreementNotDeveloped={false}
                            isAgreementAwarded={false}
                            hasAgreementChanged={true}
                        />
                    </Router>
                </Provider>
            );

            // Unsaved changes badge should not appear when not in edit mode
            expect(screen.queryByText("Unsaved Changes")).not.toBeInTheDocument();
        });

        test("shows editing indicator when in edit mode", () => {
            TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
                return agreementHistoryData;
            });
            mockIntersectionObserver();

            render(
                <Provider store={store}>
                    <Router
                        location={history.location}
                        navigator={history}
                    >
                        <AgreementDetails
                            agreement={agreement}
                            projectOfficer={projectOfficer}
                            alternateProjectOfficer={projectOfficer}
                            isEditMode={true}
                            setIsEditMode={mockFn}
                            setHasAgreementChanged={mockFn}
                            isAgreementNotDeveloped={false}
                            isAgreementAwarded={false}
                            hasAgreementChanged={false}
                        />
                    </Router>
                </Provider>
            );

            // "Editing..." indicator should appear in edit mode
            expect(screen.getByText("Editing...")).toBeInTheDocument();
        });
    });
});
