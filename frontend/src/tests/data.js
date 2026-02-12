export const budgetLine = {
    agreement_id: 1,
    agreement: {
        name: "Contract #1: African American Child and Family Research Center",
        agreement_type: "AgreementType.CONTRACT",
        awarding_entity_id: 1
    },
    amount: 1_000_000,
    fees: 0,
    can: {
        appropriation_date: "2023-10-01T00:00:00.000000Z",
        active_period: 1,
        description: "Head Start Research",
        expiration_date: "2024-09-01T00:00:00.000000Z",
        id: 5,
        portfolio_id: 2,
        nick_name: "HS",
        number: "G994426",
        display_name: "G994426"
    },
    can_id: 5,
    change_requests_in_review: null,
    comments: "comment one",
    created_by: null,
    created_on: "2024-05-27T13:56:50.363964Z",
    date_needed: "2043-06-13",
    fiscal_year: 2043,
    id: 1,
    in_review: false,
    line_description: "LI 1",
    portfolio_id: 2,
    proc_shop_fee_percentage: 0,
    procurement_shop_fee_id: 2,
    procurement_shop_fee: {
        id: 2,
        procurement_shop_id: 2,
        fee: 0,
        start_date: null,
        end_date: null
    },
    services_component_id: 1,
    status: "DRAFT",
    on_hold: false,
    certified: false,
    closed: false,
    team_members: [
        '{email: "chris.fortunato@example.com", full_name: "…}',
        '{email: "Amelia.Popham@example.com", full_name: "Am…}',
        '{email: "admin.demo@email.com", full_name: "Admin D…}',
        '{email: "dave.director@email.com", full_name: "Dave…}'
    ],
    updated_on: "2024-05-27T13:56:50.363964Z",
    _meta: { isEditable: true }
};

export const agreement = {
    agreement_reason: "RECOMPETE",
    agreement_type: "CONTRACT",
    nick_name: "AACFRC",
    budget_line_items: [
        {
            agreement_id: 1,
            amount: 1_000_000,
            fees: 0,
            can: {
                appropriation_date: "2023-10-01T00:00:00.000000Z",
                active_period: 1,
                description: "Head Start Research",
                expiration_date: "2024-09-01T00:00:00.000000Z",
                id: 5,
                portfolio_id: 2,
                nick_name: "HS",
                number: "G994426",
                display_name: "G994426"
            },
            can_id: 5,
            change_requests_in_review: null,
            comments: "",
            created_by: null,
            created_on: "2024-05-27T19:20:46.105099Z",
            date_needed: "2043-06-13",
            fiscal_year: 2043,
            id: 1,
            in_review: false,
            line_description: "LI 1",
            portfolio_id: 2,
            proc_shop_fee_percentage: 0,
            procurement_shop_fee_id: 2,
            procurement_shop_fee: {
                id: 2,
                procurement_shop_id: 2,
                fee: 0,
                start_date: null,
                end_date: null
            },
            services_component_id: 1,
            status: "DRAFT",
            on_hold: false,
            certified: false,
            closed: false,
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
            updated_on: "2024-05-27T19:20:46.105099Z"
        },
        {
            agreement_id: 1,
            amount: 1_000_000,
            fees: 0,
            can: {
                appropriation_date: "2023-10-01T00:00:00.000000Z",
                active_period: 1,
                description: "Head Start Research",
                expiration_date: "2024-09-01T00:00:00.000000Z",
                id: 5,
                portfolio_id: 2,
                nick_name: "HS",
                number: "G994426",
                display_name: "G994426"
            },
            can_id: 5,
            change_requests_in_review: null,
            comments: "",
            created_by: null,
            created_on: "2024-05-27T19:20:46.118542Z",
            date_needed: "2043-06-13",
            fiscal_year: 2043,
            id: 2,
            in_review: false,
            line_description: "LI 2",
            portfolio_id: 2,
            proc_shop_fee_percentage: 0,
            procurement_shop_fee_id: 2,
            procurement_shop_fee: {
                id: 2,
                procurement_shop_id: 2,
                fee: 0,
                start_date: null,
                end_date: null
            },
            services_component_id: null,
            status: "DRAFT",
            on_hold: false,
            certified: false,
            closed: false,
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
            updated_on: "2024-05-27T19:20:46.118542Z"
        }
    ],
    contract_number: "XXXX000000001",
    contract_type: "FIRM_FIXED_PRICE",
    created_by: 503,
    created_on: "2024-05-27T19:20:43.774009Z",
    delivered_status: false,
    description: "Test description",
    display_name: "Contract #1: African American Child and Family Research Center",
    id: 1,
    name: "Contract #1: African American Child and Family Research Center",
    notes: "",
    procurement_shop: {
        id: 1,
        name: "Product Service Center",
        abbr: "PSC",
        procurement_shop_fees: [
            {
                id: 1,
                procurement_shop_id: 1,
                procurement_shop: {
                    id: 1,
                    name: "Product Service Center",
                    abbr: "PSC",
                    fee_percentage: 0
                },
                fee: 0,
                start_date: null,
                end_date: null
            }
        ],
        fee_percentage: 0,
        current_fee: {
            id: 1,
            procurement_shop_id: 1,
            procurement_shop: {
                id: 1,
                name: "Product Service Center",
                abbr: "PSC",
                fee_percentage: 0
            },
            fee: 0,
            start_date: null,
            end_date: null
        }
    },
    awarding_entity_id: 1,
    procurement_tracker_id: null,
    product_service_code: {
        description: "",
        id: 1,
        naics: 541690,
        name: "Other Scientific and Technical Consulting Services",
        support_code: "R410 - Research"
    },
    product_service_code_id: 1,
    project: {
        description:
            "This contract will conduct interoperability activities to facilitate the exchange of information within, between, and from states and tribal organizations by facilitating lower-burden, interoperable data reporting and exchange to other state agencies and to ACF. The contract will focus on developing content that facilitates streamlined, interoperable reporting to ACF. The contract will also conduct research and evaluation activities with states and tribal organizations to assess the effectiveness of providing these interoperability artifacts for these organizations to use. The ability to share data and develop interoperable data systems is important for effective operation and oversight of these programs. This contract is designed to address these requirements and deliver needed and practical tools to accelerate implementation of data sharing and interoperable initiatives.",
        id: 1,
        project_type: "RESEARCH",
        short_title: "HSS",
        title: "Human Services Interoperability Support",
        url: "https://www.acf.hhs.gov/opre/project/acf-human-services-interoperability-support"
    },
    project_id: 1,
    project_officer_id: 500,
    alternate_project_officer_id: 501,
    service_requirement_type: "NON_SEVERABLE",
    support_contacts: [],
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
    updated_by: null,
    updated_on: "2024-05-27T19:20:43.774009Z",
    vendor: "Vendor 1",
    vendor_id: 500,
    is_awarded: false
};

export const document = {
    testDocuments: [
        {
            title: "Certification of Funding",
            filename: "SOW - Child Care Contract 1.pdf",
            uploaded_by: "Team Member",
            upload_date: "June 26, 2023",
            file_size: "68mb"
        },
        {
            title: "Independent Government Cost Estimate (ICGE)",
            filename: "SOW - Child Care Contract 1.pdf",
            uploaded_by: "Team Member 2",
            upload_date: "June 26, 2023",
            file_size: "68mb"
        },
        {
            title: "Statement of Requirements (PWS/SOO/SOW)",
            filename: "SOW - Child Care Contract 1.pdf",
            uploaded_by: "Team Member",
            upload_date: "June 26, 2023",
            file_size: "68mb"
        },
        {
            title: "Section 508 Exception Documentatio (if applicable)",
            filename: "SOW - Child Care Contract 1.pdf",
            uploaded_by: "Team Member",
            upload_date: "June 26, 2023",
            file_size: "68mb"
        },
        {
            title: "ITAR checklist for all IT Procurement Actions",
            filename: "SOW - Child Care Contract 1.pdf",
            uploaded_by: "Team Member",
            upload_date: "June 26, 2023",
            file_size: "68mb"
        },
        {
            title: "COR Nomination and Certification Document",
            filename: "SOW - Child Care Contract 1.pdf",
            uploaded_by: "Team Member",
            upload_date: "June 26, 2023",
            file_size: "68mb"
        }
    ]
};

export const servicesComponent = {
    clin_id: 1,
    agreement_id: 1,
    created_by: null,
    created_on: "2024-05-29T20:06:50.973668Z",
    description: "Perform Research",
    display_name: "SC1",
    display_title: "Services Component 1",
    id: 1,
    number: 1,
    optional: false,
    period_end: "2044-06-13",
    period_start: "2043-06-13,",
    updated_on: "2024-05-29T20:06:50.973668Z"
};

export const changeRequests = [
    {
        agreement_id: 9,
        budget_line_item_id: 15022,
        change_request_type: "BUDGET_LINE_ITEM_CHANGE_REQUEST",
        created_by: 520,
        created_by_user: {
            full_name: "Admin Demo",
            id: 520
        },
        created_on: "2024-06-17T22:03:15.201945",
        display_name: "BudgetLineItemChangeRequest#3",
        has_budget_change: true,
        has_status_change: false,
        id: 3,
        managing_division_id: 4,
        requested_change_data: {
            amount: 333333
        },
        requested_change_diff: {
            amount: {
                new: 333333,
                old: 300000
            }
        },
        requestor_notes: null,
        reviewed_on: null,
        reviewer_notes: null,
        status: "ChangeRequestStatus.IN_REVIEW",
        type: "BUDGET_LINE_ITEM_CHANGE_REQUEST",
        updated_by: 520,
        updated_on: "2024-06-17T22:03:15.201945"
    },
    {
        agreement_id: 9,
        budget_line_item_id: 15022,
        change_request_type: "BUDGET_LINE_ITEM_CHANGE_REQUEST",
        created_by: 520,
        created_by_user: {
            full_name: "Admin Demo",
            id: 520
        },
        created_on: "2024-06-17T22:03:15.220286",
        display_name: "BudgetLineItemChangeRequest#4",
        has_budget_change: true,
        has_status_change: false,
        id: 4,
        managing_division_id: 4,
        requested_change_data: {
            date_needed: "2045-06-13"
        },
        requested_change_diff: {
            date_needed: {
                new: "2045-06-13",
                old: "2044-06-13"
            }
        },
        requestor_notes: null,
        reviewed_on: null,
        status: "ChangeRequestStatus.IN_REVIEW",
        type: "BUDGET_LINE_ITEM_CHANGE_REQUEST",
        updated_by: 520,
        updated_on: "2024-06-17T22:03:15.220286"
    },
    {
        agreement_id: 9,
        budget_line_item_id: 15022,
        change_request_type: "BUDGET_LINE_ITEM_CHANGE_REQUEST",
        created_by: 520,
        created_by_user: {
            full_name: "Admin Demo",
            id: 520
        },
        created_on: "2024-06-17T22:03:15.239904",
        display_name: "BudgetLineItemChangeRequest#5",
        has_budget_change: true,
        has_status_change: false,
        id: 5,
        managing_division_id: 4,
        requested_change_data: {
            can_id: 10
        },
        requested_change_diff: {
            can_id: {
                new: 10,
                old: 13
            }
        },
        requestor_notes: null,
        reviewed_on: null,
        status: "IN_REVIEW",
        type: "BUDGET_LINE_ITEM_CHANGE_REQUEST",
        updated_by: 520,
        updated_on: "2024-06-17T22:03:15.239904"
    },
    {
        agreement_id: 1,
        budget_line_item_id: 15011,
        change_request_type: "BUDGET_LINE_ITEM_CHANGE_REQUEST",
        created_by: 520,
        created_by_user: {
            full_name: "Admin Demo",
            id: 520
        },
        created_on: "2024-06-17T18:55:41.810562",
        display_name: "BudgetLineItemChangeRequest#1",
        has_budget_change: false,
        has_status_change: true,
        id: 1,
        managing_division_id: 4,
        requested_change_data: {
            status: "PLANNED"
        },
        requested_change_diff: {
            status: {
                new: "PLANNED",
                old: "DRAFT"
            }
        },
        requestor_notes: null,
        reviewed_on: null,
        status: "ChangeRequestStatus.IN_REVIEW",
        type: "BUDGET_LINE_ITEM_CHANGE_REQUEST",
        updated_by: 520,
        updated_on: "2024-06-17T18:55:41.810562"
    },
    {
        agreement_id: 1,
        budget_line_item_id: 15020,
        change_request_type: "BUDGET_LINE_ITEM_CHANGE_REQUEST",
        created_by: 520,
        created_by_user: {
            full_name: "Admin Demo",
            id: 520
        },
        created_on: "2024-06-17T18:55:41.826716",
        display_name: "BudgetLineItemChangeRequest#2",
        has_budget_change: false,
        has_status_change: true,
        id: 2,
        managing_division_id: 4,
        requested_change_data: {
            status: "PLANNED"
        },
        requested_change_diff: {
            status: {
                new: "PLANNED",
                old: "DRAFT"
            }
        },
        requestor_notes: null,
        reviewed_on: null,
        reviewer_notes: null,
        status: "ChangeRequestStatus.IN_REVIEW",
        type: "BUDGET_LINE_ITEM_CHANGE_REQUEST",
        updated_by: 520,
        updated_on: "2024-06-17T18:55:41.826716"
    }
];

export const canFiscalYearFundingDetails = [
    {
        id: 1,
        fund: "DFGBTN2024BCDS",
        allowance: "JDI109DHAD",
        sub_allowance: "RHI45T78F0",
        allotment_org: "JJH45ST607",
        current_fy_funding_ytd: 25000,
        can_fiscal_year_id: 5001
    },
    {
        id: 2,
        fund: "FLYDIG2024RSTF",
        allowance: "JHH939DHAD",
        sub_allowance: "RHI45T8EX2",
        allotment_org: "RT045ST607",
        current_fy_funding_ytd: 38000,
        can_fiscal_year_id: 5002
    },
    {
        id: 3,
        fund: "IMTEDG2023SEMI",
        allowance: "JHH9JJNHAD",
        sub_allowance: "RASTO8EX27",
        allotment_org: "BFSIE5ST60",
        current_fy_funding_ytd: 45899,
        can_fiscal_year_id: 5003
    },
    {
        id: 4,
        fund: "FNCTSM2022QRTA",
        allowance: "JH98HG3HAD",
        sub_allowance: "RASTO8EX27",
        allotment_org: "BFSIE5ST60",
        current_fy_funding_ytd: 100000,
        can_fiscal_year_id: 5004
    }
];
export const canAppropriationDetails = [
    {
        id: 1,
        appropriation_prefix: "ABCDE",
        appropriation_postfix: "FGHIJ",
        appropriation_year: "2024"
    },
    {
        id: 2,
        appropriation_prefix: "PREFI",
        appropriation_postfix: "POSTF",
        appropriation_year: "2023"
    },
    {
        id: 3,
        appropriation_prefix: "AEIOU",
        appropriation_postfix: "ALSOY",
        appropriation_year: "2024"
    }
];

export const roles = [
    {
        id: 1,
        name: "SYSTEM_OWNER",
        is_superuser: false
    },
    {
        id: 2,
        name: "VIEWER_EDITOR",
        is_superuser: false
    },
    {
        id: 3,
        name: "REVIEWER_APPROVER",
        is_superuser: false
    },
    {
        id: 4,
        name: "USER_ADMIN",
        is_superuser: false
    },
    {
        id: 5,
        name: "BUDGET_TEAM",
        is_superuser: false
    },
    {
        id: 6,
        name: "PROCUREMENT_TEAM",
        is_superuser: false
    },
    {
        id: 7,
        name: "SUPER_USER",
        is_superuser: true
    }
];

export const divisions = [
    {
        abbreviation: "CC",
        deputy_division_director_id: 520,
        display_name: "Child Care",
        division_director_id: 522,
        id: 1,
        name: "Child Care"
    },
    {
        abbreviation: "DECONI",
        deputy_division_director_id: 520,
        display_name: "Division of Economic Independence",
        division_director_id: 522,
        id: 2,
        name: "Division of Economic Independence"
    },
    {
        abbreviation: "OD",
        deputy_division_director_id: 520,
        display_name: "Office of the Director",
        division_director_id: 522,
        id: 3,
        name: "Office of the Director"
    },
    {
        abbreviation: "DCFD",
        deputy_division_director_id: 520,
        display_name: "Division of Child and Family Development",
        division_director_id: 522,
        id: 4,
        name: "Division of Child and Family Development"
    },
    {
        abbreviation: "DFS",
        deputy_division_director_id: 520,
        display_name: "Division of Family Strengthening",
        division_director_id: 522,
        id: 5,
        name: "Division of Family Strengthening"
    },
    {
        abbreviation: "DDI",
        deputy_division_director_id: 520,
        display_name: "Division of Data and Improvement",
        division_director_id: 522,
        id: 6,
        name: "Division of Data and Improvement"
    },
    {
        abbreviation: "OTHER",
        deputy_division_director_id: 520,
        display_name: "Non-OPRE Division",
        division_director_id: 522,
        id: 7,
        name: "Non-OPRE Division"
    }
];

export const budgetLineWithBudgetChangeRequest = {
    agreement_id: 9,
    amount: 300000,
    fees: 1500,
    total: 301500,
    can: {
        appropriation_date: "2022-10-01T00:00:00.000000Z",
        active_period: 1,
        description: "Example CAN",
        display_name: "G99XXX8",
        expiration_date: "2023-09-01T00:00:00.000000Z",
        id: 512,
        portfolio_id: 3,
        nick_name: "",
        number: "G99XXX8",
        portfolio: {
            division_id: 1,
            id: 1,
            name: "Test Portfolio",
            division: {
                abbreviation: "test",
                deputy_division_director_id: 1,
                display_name: "test",
                division_director_id: 1,
                id: 1,
                name: "test"
            }
        }
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
            created_on: "2024-07-26T14:39:51.776768",
            display_name: "BudgetLineItemChangeRequest#1",
            has_budget_change: true,
            has_status_change: false,
            id: 1,
            managing_division_id: 4,
            requested_change_data: {
                amount: 333333
            },
            requested_change_diff: {
                amount: {
                    new: 333333,
                    old: 300000
                }
            },
            requestor_notes: null,
            reviewed_on: null,
            reviewer_notes: null,
            status: "IN_REVIEW",
            updated_by: 520,
            updated_on: "2024-07-26T14:39:51.776768"
        },
        {
            agreement_id: 9,
            budget_line_item_id: 15021,
            change_request_type: "BUDGET_LINE_ITEM_CHANGE_REQUEST",
            created_by: 520,
            created_by_user: {
                full_name: "Admin Demo",
                id: 520
            },
            created_on: "2024-07-26T14:39:51.847196",
            display_name: "BudgetLineItemChangeRequest#2",
            has_budget_change: true,
            has_status_change: false,
            id: 2,
            managing_division_id: 4,
            requested_change_data: {
                can_id: 507
            },
            requested_change_diff: {
                can_id: {
                    new: 507,
                    old: 512
                }
            },
            requestor_notes: null,
            reviewed_on: null,
            reviewer_notes: null,
            status: "IN_REVIEW",
            updated_by: 520,
            updated_on: "2024-07-26T14:39:51.847196"
        },
        {
            agreement_id: 9,
            budget_line_item_id: 15021,
            change_request_type: "BUDGET_LINE_ITEM_CHANGE_REQUEST",
            created_by: 520,
            created_by_user: {
                full_name: "Admin Demo",
                id: 520
            },
            created_on: "2024-07-26T14:39:51.891458",
            display_name: "BudgetLineItemChangeRequest#3",
            has_budget_change: true,
            has_status_change: false,
            id: 3,
            managing_division_id: 4,
            requested_change_data: {
                date_needed: "2045-06-13"
            },
            requested_change_diff: {
                date_needed: {
                    new: "2045-06-13",
                    old: "2044-06-13"
                }
            },
            requestor_notes: null,
            reviewed_on: null,
            reviewer_notes: null,
            status: "IN_REVIEW",
            updated_by: 520,
            updated_on: "2024-07-26T14:39:51.891458"
        }
    ],
    comments: "",
    created_by: null,
    created_on: "2024-07-26T14:07:14.551311",
    date_needed: "2044-06-13",
    fiscal_year: 2044,
    id: 15021,
    in_review: true,
    line_description: "SC3",
    portfolio_id: 3,
    proc_shop_fee_percentage: 0.005,
    procurement_shop_fee_id: 3,
    procurement_shop_fee: {
        id: 3,
        procurement_shop_id: 3,
        fee: 0.5,
        start_date: null,
        end_date: null
    },
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
    updated_on: "2024-07-26T14:39:51.723293"
};

export const budgetLineWithStatusChangeRequestToPlanned = {
    agreement_id: 1,
    amount: 1000000,
    fees: 0,
    can: {
        appropriation_date: "2023-10-01T00:00:00.000000Z",
        active_period: 1,
        description: "Head Start Research",
        display_name: "G994426",
        expiration_date: "2024-09-01T00:00:00.000000Z",
        id: 504,
        portfolio_id: 2,
        nick_name: "HS",
        number: "G994426",
        portfolio: {
            division_id: 1,
            id: 1,
            name: "Test Portfolio",
            division: {
                abbreviation: "test",
                deputy_division_director_id: 1,
                display_name: "test",
                division_director_id: 1,
                id: 1,
                name: "test"
            }
        }
    },
    can_id: 504,
    change_requests_in_review: [
        {
            agreement_id: 1,
            budget_line_item_id: 15000,
            change_request_type: "BUDGET_LINE_ITEM_CHANGE_REQUEST",
            created_by: 520,
            created_by_user: {
                full_name: "Admin Demo",
                id: 520
            },
            created_on: "2024-07-26T15:03:08.071953",
            display_name: "BudgetLineItemChangeRequest#4",
            has_budget_change: false,
            has_status_change: true,
            id: 4,
            managing_division_id: 4,
            requested_change_data: {
                status: "PLANNED"
            },
            requested_change_diff: {
                status: {
                    new: "PLANNED",
                    old: "DRAFT"
                }
            },
            requestor_notes: "pls approve status change to PLANNED",
            reviewed_on: null,
            reviewer_notes: null,
            status: "IN_REVIEW",
            updated_by: 520,
            updated_on: "2024-07-26T15:03:08.071953"
        }
    ],
    comments: "",
    created_by: null,
    created_on: "2024-07-26T14:07:14.315499",
    date_needed: "2043-06-13",
    fiscal_year: 2043,
    id: 15000,
    in_review: true,
    line_description: "LI 1",
    portfolio_id: 2,
    proc_shop_fee_percentage: 0,
    procurement_shop_fee_id: 2,
    procurement_shop_fee: {
        id: 2,
        procurement_shop_id: 2,
        fee: 0,
        start_date: null,
        end_date: null
    },
    services_component_id: 1,
    status: "PLANNED",
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
    updated_on: "2024-07-26T14:07:14.315499"
};

export const budgetLineWithStatusChangeRequestToExecuting = {
    agreement_id: 9,
    amount: 700000,
    fees: 3500,
    can: {
        appropriation_date: "2023-10-01T00:00:00.000000Z",
        active_period: 1,
        description: "Social Science Research and Development",
        display_name: "G99PHS9",
        expiration_date: "2024-09-01T00:00:00.000000Z",
        id: 502,
        portfolio_id: 8,
        nick_name: "SSRD",
        number: "G99PHS9",
        portfolio: {
            division_id: 1,
            id: 1,
            name: "Test Portfolio",
            division: {
                abbreviation: "test",
                deputy_division_director_id: 1,
                display_name: "test",
                division_director_id: 1,
                id: 1,
                name: "test"
            }
        }
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
            created_on: "2024-07-26T15:13:56.046655",
            display_name: "BudgetLineItemChangeRequest#6",
            has_budget_change: false,
            has_status_change: true,
            id: 6,
            managing_division_id: 6,
            requested_change_data: {
                status: "IN_EXECUTION"
            },
            requested_change_diff: {
                status: {
                    new: "IN_EXECUTION",
                    old: "PLANNED"
                }
            },
            requestor_notes: "",
            reviewed_on: null,
            reviewer_notes: null,
            status: "IN_REVIEW",
            updated_by: 520,
            updated_on: "2024-07-26T15:13:56.046655"
        }
    ],
    comments: "",
    created_by: null,
    created_on: "2024-07-26T14:07:14.544417",
    date_needed: "2043-06-13",
    fiscal_year: 2043,
    id: 15020,
    in_review: true,
    line_description: "SC2",
    portfolio_id: 8,
    proc_shop_fee_percentage: 0.005,
    procurement_shop_fee_id: 3,
    procurement_shop_fee: {
        id: 3,
        procurement_shop_id: 3,
        fee: 0.5,
        start_date: null,
        end_date: null
    },
    services_component_id: 6,
    status: "IN_EXECUTION",
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
    updated_on: "2024-07-26T14:07:14.544417"
};

export const cans = [
    {
        active_period: 1,
        budget_line_items: [
            {
                agreement_id: 2,
                amount: 2000000,
                can: {
                    active_period: 1,
                    description: "Healthy Marriages Responsible Fatherhood - OPRE",
                    display_name: "G99HRF2",
                    id: 500,
                    nick_name: "HMRF-OPRE",
                    number: "G99HRF2",
                    portfolio_id: 6
                },
                can_id: 500,
                change_requests_in_review: null,
                comments: "",
                created_by: 503,
                created_on: "2024-09-17T18:12:32.976627",
                date_needed: "2043-06-13",
                fiscal_year: 2043,
                id: 15008,
                in_review: false,
                line_description: "Line Item 2",
                portfolio_id: 6,
                proc_shop_fee_percentage: 0.005,
                procurement_shop_fee_id: 3,
                procurement_shop_fee: {
                    id: 3,
                    procurement_shop_id: 2,
                    fee: 0.5,
                    start_date: null,
                    end_date: null
                },
                services_component_id: null,
                status: "IN_EXECUTION",
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
                    }
                ],
                updated_on: "2024-09-17T18:12:32.976627"
            }
        ],
        created_by: null,
        created_by_user: null,
        created_on: "2024-09-17T18:12:25.558006Z",
        description: "Healthy Marriages Responsible Fatherhood - OPRE",
        display_name: "G99HRF2",
        funding_budgets: [
            {
                budget: 1140000,
                can: {
                    active_period: 1,
                    description: "Healthy Marriages Responsible Fatherhood - OPRE",
                    display_name: "G99HRF2",
                    id: 500,
                    nick_name: "HMRF-OPRE",
                    number: "G99HRF2",
                    portfolio_id: 6,
                    projects: []
                },
                can_id: 500,
                created_by: null,
                created_by_user: null,
                created_on: "2024-09-17T18:12:25.781382Z",
                display_name: "CANFundingBudget#1",
                fiscal_year: 2023,
                id: 1,
                notes: null,
                updated_by: null,
                updated_by_user: null,
                updated_on: "2024-09-17T18:12:25.781382Z",
                versions: [
                    {
                        budget: 1140000,
                        can: {
                            description: "Healthy Marriages Responsible Fatherhood - OPRE",
                            id: 500,
                            nick_name: "HMRF-OPRE",
                            number: "G99HRF2",
                            portfolio_id: 6,
                            projects: []
                        },
                        can_id: 500,
                        created_by: null,
                        created_on: "2024-09-17T18:12:25.781382Z",
                        end_transaction_id: null,
                        fiscal_year: 2023,
                        id: 1,
                        notes: null,
                        operation_type: 0,
                        transaction_id: 186,
                        updated_by: null,
                        updated_on: "2024-09-17T18:12:25.781382Z"
                    }
                ]
            }
        ],
        funding_details: {
            allotment: null,
            allowance: null,
            created_by: null,
            created_by_user: null,
            created_on: "2024-09-17T18:12:25.370020Z",
            display_name: "CANFundingDetails#1",
            fiscal_year: 2023,
            fund_code: "AAXXXX20231DAD",
            funding_partner: null,
            funding_source: "CANFundingSource.OPRE",
            id: 1,
            method_of_transfer: "DIRECT",
            sub_allowance: null,
            updated_by: null,
            updated_by_user: null,
            updated_on: "2024-09-17T18:12:25.370020Z"
        },
        funding_details_id: 1,
        funding_received: [
            {
                can: {
                    active_period: 1,
                    description: "Healthy Marriages Responsible Fatherhood - OPRE",
                    display_name: "G99HRF2",
                    id: 500,
                    nick_name: "HMRF-OPRE",
                    number: "G99HRF2",
                    portfolio_id: 6,
                    projects: []
                },
                can_id: 500,
                created_by: null,
                created_by_user: null,
                created_on: "2024-09-17T18:12:26.088324Z",
                display_name: "CANFundingReceived#500",
                fiscal_year: 2023,
                funding: 880000,
                id: 500,
                notes: null,
                updated_by: null,
                updated_by_user: null,
                updated_on: "2024-09-17T18:12:26.088324Z"
            }
        ],
        id: 500,
        nick_name: "HMRF-OPRE",
        number: "G99HRF2",
        portfolio: {
            abbreviation: "HMRF",
            created_by: null,
            created_by_user: null,
            created_on: "2024-09-17T18:12:16.659182Z",
            division_id: 5,
            id: 6,
            name: "Healthy Marriage & Responsible Fatherhood",
            status: "IN_PROCESS",
            team_leaders: [
                {
                    full_name: "Katie Pahigiannis",
                    id: 505
                }
            ],
            updated_by: null,
            updated_by_user: null,
            updated_on: "2024-09-17T18:12:16.659182Z",
            urls: [
                {
                    created_by: null,
                    created_by_user: null,
                    created_on: "2024-09-17T18:12:16.802256Z",
                    id: 6,
                    portfolio_id: 6,
                    updated_by: null,
                    updated_by_user: null,
                    updated_on: "2024-09-17T18:12:16.802256Z",
                    url: "https://acf.gov/opre/topic/strengthening-families-healthy-marriage-responsible-fatherhood"
                }
            ]
        },
        portfolio_id: 6,
        projects: [],
        updated_by: null,
        updated_by_user: null,
        updated_on: "2024-09-17T18:12:25.558006Z"
    },
    {
        active_period: 5,
        budget_line_items: [
            {
                agreement_id: 2,
                amount: 2000000,
                can: {
                    active_period: 5,
                    description: "Incoming Interagency Agreements",
                    display_name: "G99IA14",
                    id: 501,
                    nick_name: "IAA-Incoming",
                    number: "G99IA14",
                    portfolio_id: 1
                },
                can_id: 501,
                change_requests_in_review: null,
                comments: "",
                created_by: 503,
                created_on: "2024-09-17T18:12:33.000154",
                date_needed: "2043-06-13",
                fiscal_year: 2043,
                id: 15010,
                in_review: false,
                line_description: "Line Item 2",
                portfolio_id: 1,
                proc_shop_fee_percentage: 0.005,
                procurement_shop_fee_id: 3,
                procurement_shop_fee: {
                    id: 3,
                    procurement_shop_id: 2,
                    fee: 0.5,
                    start_date: null,
                    end_date: null
                },
                services_component_id: null,
                status: "IN_EXECUTION",
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
                    }
                ],
                updated_on: "2024-09-17T18:12:33.000154"
            },
            {
                agreement_id: 2,
                amount: 1000000,
                can: {
                    active_period: 5,
                    description: "Incoming Interagency Agreements",
                    display_name: "G99IA14",
                    id: 501,
                    nick_name: "IAA-Incoming",
                    number: "G99IA14",
                    portfolio_id: 1
                },
                can_id: 501,
                change_requests_in_review: null,
                comments: "",
                created_by: 503,
                created_on: "2024-09-17T18:12:33.060480",
                date_needed: "2043-06-13",
                fiscal_year: 2043,
                id: 15015,
                in_review: false,
                line_description: "Line Item 2",
                portfolio_id: 1,
                proc_shop_fee_percentage: 0.005,
                procurement_shop_fee_id: 3,
                procurement_shop_fee: {
                    id: 3,
                    procurement_shop_id: 2,
                    fee: 0.5,
                    start_date: null,
                    end_date: null
                },
                services_component_id: null,
                status: "PLANNED",
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
                    }
                ],
                updated_on: "2024-09-17T18:12:33.060480"
            },
            {
                agreement_id: 2,
                amount: 3000000,
                can: {
                    active_period: 5,
                    description: "Incoming Interagency Agreements",
                    display_name: "G99IA14",
                    id: 501,
                    nick_name: "IAA-Incoming",
                    number: "G99IA14",
                    portfolio_id: 1
                },
                can_id: 501,
                change_requests_in_review: null,
                comments: "",
                created_by: 503,
                created_on: "2024-09-17T18:12:33.073854",
                date_needed: "2043-06-13",
                fiscal_year: 2043,
                id: 15016,
                in_review: false,
                line_description: "Line Item 2",
                portfolio_id: 1,
                proc_shop_fee_percentage: 0.005,
                procurement_shop_fee_id: 3,
                procurement_shop_fee: {
                    id: 3,
                    procurement_shop_id: 2,
                    fee: 0.5,
                    start_date: null,
                    end_date: null
                },
                services_component_id: null,
                status: "OBLIGATED",
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
                    }
                ],
                updated_on: "2024-09-17T18:12:33.073854"
            }
        ],
        created_by: null,
        created_by_user: null,
        created_on: "2024-09-17T18:12:25.579527Z",
        description: "Incoming Interagency Agreements",
        display_name: "G99IA14",
        funding_budgets: [
            {
                budget: 200000,
                can: {
                    active_period: 5,
                    description: "Incoming Interagency Agreements",
                    display_name: "G99IA14",
                    id: 501,
                    nick_name: "IAA-Incoming",
                    number: "G99IA14",
                    portfolio_id: 1,
                    projects: []
                },
                can_id: 501,
                created_by: null,
                created_by_user: null,
                created_on: "2024-09-17T18:12:25.799918Z",
                display_name: "CANFundingBudget#2",
                fiscal_year: 2021,
                id: 2,
                notes: null,
                updated_by: null,
                updated_by_user: null,
                updated_on: "2024-09-17T18:12:25.799918Z",
                versions: [
                    {
                        budget: 200000,
                        can: {
                            description: "Incoming Interagency Agreements",
                            id: 501,
                            nick_name: "IAA-Incoming",
                            number: "G99IA14",
                            portfolio_id: 1,
                            projects: []
                        },
                        can_id: 501,
                        created_by: null,
                        created_on: "2024-09-17T18:12:25.799918Z",
                        end_transaction_id: null,
                        fiscal_year: 2021,
                        id: 2,
                        notes: null,
                        operation_type: 0,
                        transaction_id: 187,
                        updated_by: null,
                        updated_on: "2024-09-17T18:12:25.799918Z"
                    }
                ]
            },
            {
                budget: 10000000,
                can: {
                    active_period: 5,
                    description: "Incoming Interagency Agreements",
                    display_name: "G99IA14",
                    id: 501,
                    nick_name: "IAA-Incoming",
                    number: "G99IA14",
                    portfolio_id: 1,
                    projects: []
                },
                can_id: 501,
                created_by: null,
                created_by_user: null,
                created_on: "2024-09-17T18:12:25.903789Z",
                display_name: "CANFundingBudget#13",
                fiscal_year: 2023,
                id: 13,
                notes: null,
                updated_by: null,
                updated_by_user: null,
                updated_on: "2024-09-17T18:12:25.903789Z",
                versions: [
                    {
                        budget: 10000000,
                        can: {
                            description: "Incoming Interagency Agreements",
                            id: 501,
                            nick_name: "IAA-Incoming",
                            number: "G99IA14",
                            portfolio_id: 1,
                            projects: []
                        },
                        can_id: 501,
                        created_by: null,
                        created_on: "2024-09-17T18:12:25.903789Z",
                        end_transaction_id: null,
                        fiscal_year: 2023,
                        id: 13,
                        notes: null,
                        operation_type: 0,
                        transaction_id: 198,
                        updated_by: null,
                        updated_on: "2024-09-17T18:12:25.903789Z"
                    }
                ]
            }
        ],
        funding_details: {
            allotment: null,
            allowance: null,
            created_by: null,
            created_by_user: null,
            created_on: "2024-09-17T18:12:25.394257Z",
            display_name: "CANFundingDetails#2",
            fiscal_year: 2021,
            fund_code: "BBXXXX20215DAD",
            funding_partner: null,
            funding_source: null,
            id: 2,
            method_of_transfer: "COST_SHARE",
            sub_allowance: null,
            updated_by: null,
            updated_by_user: null,
            updated_on: "2024-09-17T18:12:25.394257Z"
        },
        funding_details_id: 2,
        funding_received: [
            {
                can: {
                    active_period: 5,
                    description: "Incoming Interagency Agreements",
                    display_name: "G99IA14",
                    id: 501,
                    nick_name: "IAA-Incoming",
                    number: "G99IA14",
                    portfolio_id: 1,
                    projects: []
                },
                can_id: 501,
                created_by: null,
                created_by_user: null,
                created_on: "2024-09-17T18:12:26.106152Z",
                display_name: "CANFundingReceived#501",
                fiscal_year: 2021,
                funding: 200000,
                id: 501,
                notes: null,
                updated_by: null,
                updated_by_user: null,
                updated_on: "2024-09-17T18:12:26.106152Z"
            },
            {
                can: {
                    active_period: 5,
                    description: "Incoming Interagency Agreements",
                    display_name: "G99IA14",
                    id: 501,
                    nick_name: "IAA-Incoming",
                    number: "G99IA14",
                    portfolio_id: 1,
                    projects: []
                },
                can_id: 501,
                created_by: null,
                created_by_user: null,
                created_on: "2024-09-17T18:12:26.216160Z",
                display_name: "CANFundingReceived#512",
                fiscal_year: 2023,
                funding: 6000000,
                id: 512,
                notes: null,
                updated_by: null,
                updated_by_user: null,
                updated_on: "2024-09-17T18:12:26.216160Z"
            }
        ],
        id: 501,
        nick_name: "IAA-Incoming",
        number: "G99IA14",
        portfolio: {
            abbreviation: "CWR",
            created_by: null,
            created_by_user: null,
            created_on: "2024-09-17T18:12:16.472498Z",
            division_id: 4,
            id: 1,
            name: "Child Welfare Research",
            status: "IN_PROCESS",
            team_leaders: [
                {
                    full_name: "Chris Fortunato",
                    id: 500
                }
            ],
            updated_by: null,
            updated_by_user: null,
            updated_on: "2024-09-17T18:12:16.472498Z",
            urls: [
                {
                    created_by: null,
                    created_by_user: null,
                    created_on: "2024-09-17T18:12:16.760426Z",
                    id: 1,
                    portfolio_id: 1,
                    updated_by: null,
                    updated_by_user: null,
                    updated_on: "2024-09-17T18:12:16.760426Z",
                    url: "https://acf.gov/opre/topic/overview/abuse-neglect-adoption-foster-care"
                }
            ]
        },
        portfolio_id: 1,
        projects: [],
        updated_by: null,
        updated_by_user: null,
        updated_on: "2024-09-17T18:12:25.579527Z"
    }
];

export const agreementWithDraftBudgetLines = {
    agreement_reason: "RECOMPETE",
    agreement_type: "CONTRACT",
    nick_name: "DRAFT-TEST",
    budget_line_items: [
        {
            agreement_id: 15,
            amount: 500000,
            can: {
                appropriation_date: "2023-10-01T00:00:00.000000Z",
                active_period: 1,
                description: "Child Care Research",
                expiration_date: "2024-09-01T00:00:00.000000Z",
                id: 520,
                portfolio_id: 1,
                nick_name: "CCR",
                number: "G99CCR1",
                display_name: "G99CCR1"
            },
            can_id: 520,
            change_requests_in_review: [
                {
                    agreement_id: 15,
                    budget_line_item_id: 16001,
                    change_request_type: "BUDGET_LINE_ITEM_CHANGE_REQUEST",
                    created_by: 520,
                    created_by_user: {
                        full_name: "Admin Demo",
                        id: 520
                    },
                    created_on: "2024-07-26T15:03:08.071953",
                    display_name: "BudgetLineItemChangeRequest#7",
                    has_budget_change: false,
                    has_status_change: true,
                    id: 7,
                    managing_division_id: 1,
                    requested_change_data: {
                        status: "PLANNED"
                    },
                    requested_change_diff: {
                        status: {
                            new: "PLANNED",
                            old: "DRAFT"
                        }
                    },
                    requestor_notes: "Status change request to PLANNED for Budget Line 1",
                    reviewed_on: null,
                    reviewer_notes: null,
                    status: "IN_REVIEW",
                    updated_by: 520,
                    updated_on: "2024-07-26T15:03:08.071953"
                }
            ],
            comments: "First budget line for Child Care Research",
            created_by: null,
            created_on: "2024-07-26T14:07:14.315499",
            date_needed: "2024-09-30",
            fiscal_year: 2024,
            id: 16001,
            in_review: true,
            line_description: "Child Care Research Line 1",
            portfolio_id: 1,
            proc_shop_fee_percentage: 0.005,
            procurement_shop_fee_id: 3,
            procurement_shop_fee: {
                id: 3,
                procurement_shop_id: 3,
                fee: 0.5,
                start_date: null,
                end_date: null
            },
            services_component_id: 10,
            status: "DRAFT",
            team_members: [
                {
                    email: "chris.fortunato@example.com",
                    full_name: "Chris Fortunato",
                    id: 500
                },
                {
                    email: "admin.demo@email.com",
                    full_name: "Admin Demo",
                    id: 520
                }
            ],
            updated_on: "2024-07-26T14:07:14.315499"
        },
        {
            agreement_id: 15,
            amount: 750000,
            can: {
                appropriation_date: "2023-10-01T00:00:00.000000Z",
                active_period: 1,
                description: "Child Care Research",
                expiration_date: "2024-09-01T00:00:00.000000Z",
                id: 520,
                portfolio_id: 1,
                nick_name: "CCR",
                number: "G99CCR1",
                display_name: "G99CCR1"
            },
            can_id: 520,
            change_requests_in_review: [
                {
                    agreement_id: 15,
                    budget_line_item_id: 16002,
                    change_request_type: "BUDGET_LINE_ITEM_CHANGE_REQUEST",
                    created_by: 520,
                    created_by_user: {
                        full_name: "Admin Demo",
                        id: 520
                    },
                    created_on: "2024-07-26T15:03:08.071953",
                    display_name: "BudgetLineItemChangeRequest#8",
                    has_budget_change: false,
                    has_status_change: true,
                    id: 8,
                    managing_division_id: 1,
                    requested_change_data: {
                        status: "PLANNED"
                    },
                    requested_change_diff: {
                        status: {
                            new: "PLANNED",
                            old: "DRAFT"
                        }
                    },
                    requestor_notes: "Status change request to PLANNED for Budget Line 2",
                    reviewed_on: null,
                    reviewer_notes: null,
                    status: "IN_REVIEW",
                    updated_by: 520,
                    updated_on: "2024-07-26T15:03:08.071953"
                }
            ],
            comments: "Second budget line for Child Care Research",
            created_by: null,
            created_on: "2024-07-26T14:07:14.315499",
            date_needed: "2024-09-30",
            fiscal_year: 2024,
            id: 16002,
            in_review: true,
            line_description: "Child Care Research Line 2",
            portfolio_id: 1,
            proc_shop_fee_percentage: 0.005,
            procurement_shop_fee_id: 3,
            procurement_shop_fee: {
                id: 3,
                procurement_shop_id: 3,
                fee: 0.5,
                start_date: null,
                end_date: null
            },
            services_component_id: 11,
            status: "DRAFT",
            team_members: [
                {
                    email: "chris.fortunato@example.com",
                    full_name: "Chris Fortunato",
                    id: 500
                },
                {
                    email: "admin.demo@email.com",
                    full_name: "Admin Demo",
                    id: 520
                }
            ],
            updated_on: "2024-07-26T14:07:14.315499"
        },
        {
            agreement_id: 15,
            amount: 100000,
            can: {
                appropriation_date: "2023-10-01T00:00:00.000000Z",
                active_period: 1,
                description: "Child Care Research",
                expiration_date: "2024-09-01T00:00:00.000000Z",
                id: 520,
                portfolio_id: 1,
                nick_name: "CCR",
                number: "G99CCR1",
                display_name: "G99CCR1"
            },
            can_id: 520,
            change_requests_in_review: [],
            comments: "Draft budget line for Child Care Research",
            created_by: null,
            created_on: "2025-07-26T14:07:14.315499",
            date_needed: "2025-09-30",
            fiscal_year: 2025,
            id: 16003,
            in_review: false,
            line_description: "Child Care Research Line 2",
            portfolio_id: 1,
            proc_shop_fee_percentage: 0.005,
            procurement_shop_fee_id: 3,
            procurement_shop_fee: {
                id: 3,
                procurement_shop_id: 3,
                fee: 0.5,
                start_date: null,
                end_date: null
            },
            services_component_id: 11,
            status: "DRAFT",
            team_members: [
                {
                    email: "chris.fortunato@example.com",
                    full_name: "Chris Fortunato",
                    id: 500
                },
                {
                    email: "admin.demo@email.com",
                    full_name: "Admin Demo",
                    id: 520
                }
            ],
            updated_on: "2025-07-26T14:07:14.315499"
        }
    ],
    contract_number: "75P00124C00001",
    contract_type: "COST_PLUS_FIXED_FEE",
    created_by: 520,
    created_on: "2024-07-26T14:07:14.315499",
    delivered_status: false,
    description: "Research on Child Care Policy and Implementation",
    display_name: "Contract #15: Child Care Research Initiative",
    id: 15,
    name: "Contract #15: Child Care Research Initiative",
    notes: "",
    procurement_shop: {
        abbr: "PSC",
        fee_percentage: 0.5,
        id: 1,
        name: "Product Service Center"
    },
    awarding_entity_id: 1,
    procurement_tracker_id: null,
    product_service_code: {
        description: "Research and Development",
        id: 1,
        naics: 541720,
        name: "Research and Development in the Social Sciences and Humanities",
        support_code: "R410"
    },
    product_service_code_id: 1,
    project: {
        description: "Research initiative focused on child care policy implementation and outcomes",
        id: 15,
        project_type: "RESEARCH",
        short_title: "CCR",
        title: "Child Care Research Initiative",
        url: "https://www.acf.hhs.gov/opre/research/project/child-care-research"
    },
    project_id: 15,
    project_officer_id: 500,
    alternate_project_officer_id: 520,
    service_requirement_type: "NON_SEVERABLE",
    support_contacts: [],
    team_members: [
        {
            email: "chris.fortunato@example.com",
            full_name: "Chris Fortunato",
            id: 500
        },
        {
            email: "admin.demo@email.com",
            full_name: "Admin Demo",
            id: 520
        }
    ],
    updated_by: null,
    updated_on: "2024-07-26T14:07:14.315499",
    vendor: "Research Associates Inc.",
    vendor_id: 550,
    is_awarded: false
};

export const agreementWithPlannedBudgetLineChanges = {
    agreement_reason: "RECOMPETE",
    agreement_type: "CONTRACT",
    nick_name: "PLANNED-TEST",
    budget_line_items: [
        {
            agreement_id: 15,
            amount: 500000,
            can: {
                appropriation_date: "2023-10-01T00:00:00.000000Z",
                active_period: 1,
                description: "Child Care Research",
                expiration_date: "2024-09-01T00:00:00.000000Z",
                id: 520,
                portfolio_id: 1,
                nick_name: "CCR",
                number: "G99CCR1",
                display_name: "G99CCR1"
            },
            can_id: 520,
            change_requests_in_review: [
                {
                    agreement_id: 15,
                    budget_line_item_id: 16001,
                    change_request_type: "BUDGET_LINE_ITEM_CHANGE_REQUEST",
                    created_by: 520,
                    created_by_user: {
                        full_name: "Admin Demo",
                        id: 520
                    },
                    created_on: "2024-07-26T15:03:08.071953",
                    display_name: "BudgetLineItemChangeRequest#7",
                    has_budget_change: true,
                    has_status_change: false,
                    id: 7,
                    managing_division_id: 1,
                    requested_change_data: {
                        amount: 600000
                    },
                    requested_change_diff: {
                        amount: {
                            new: 600000,
                            old: 500000
                        }
                    },
                    requestor_notes: "Amount change request to PLANNED for Budget Line 1",
                    reviewed_on: null,
                    reviewer_notes: null,
                    status: "IN_REVIEW",
                    updated_by: 520,
                    updated_on: "2024-07-26T15:03:08.071953"
                }
            ],
            comments: "First budget line for Child Care Research",
            created_by: null,
            created_on: "2024-07-26T14:07:14.315499",
            date_needed: "2024-09-30",
            fiscal_year: 2024,
            id: 16001,
            in_review: true,
            line_description: "Child Care Research Line 1",
            portfolio_id: 1,
            proc_shop_fee_percentage: 0.005,
            procurement_shop_fee_id: 3,
            procurement_shop_fee: {
                id: 3,
                procurement_shop_id: 3,
                fee: 0.5,
                start_date: null,
                end_date: null
            },
            services_component_id: 10,
            status: "PLANNED",
            team_members: [
                {
                    email: "chris.fortunato@example.com",
                    full_name: "Chris Fortunato",
                    id: 500
                },
                {
                    email: "admin.demo@email.com",
                    full_name: "Admin Demo",
                    id: 520
                }
            ],
            updated_on: "2024-07-26T14:07:14.315499"
        },
        {
            agreement_id: 15,
            amount: 750000,
            can: {
                appropriation_date: "2023-10-01T00:00:00.000000Z",
                active_period: 1,
                description: "Child Care Research",
                expiration_date: "2024-09-01T00:00:00.000000Z",
                id: 520,
                portfolio_id: 1,
                nick_name: "CCR",
                number: "G99CCR1",
                display_name: "G99CCR1"
            },
            can_id: 520,
            change_requests_in_review: [],
            comments: "Second budget line for Child Care Research",
            created_by: null,
            created_on: "2024-07-26T14:07:14.315499",
            date_needed: "2024-09-30",
            fiscal_year: 2024,
            id: 16002,
            in_review: false,
            line_description: "Child Care Research Line 2",
            portfolio_id: 1,
            proc_shop_fee_percentage: 0.005,
            procurement_shop_fee_id: 3,
            procurement_shop_fee: {
                id: 3,
                procurement_shop_id: 3,
                fee: 0.5,
                start_date: null,
                end_date: null
            },
            services_component_id: 11,
            status: "PLANNED",
            team_members: [
                {
                    email: "chris.fortunato@example.com",
                    full_name: "Chris Fortunato",
                    id: 500
                },
                {
                    email: "admin.demo@email.com",
                    full_name: "Admin Demo",
                    id: 520
                }
            ],
            updated_on: "2024-07-26T14:07:14.315499"
        },
        {
            agreement_id: 15,
            amount: 100000,
            can: {
                appropriation_date: "2023-10-01T00:00:00.000000Z",
                active_period: 1,
                description: "Child Care Research",
                expiration_date: "2024-09-01T00:00:00.000000Z",
                id: 520,
                portfolio_id: 1,
                nick_name: "CCR",
                number: "G99CCR1",
                display_name: "G99CCR1"
            },
            can_id: 520,
            change_requests_in_review: [],
            comments: "Draft budget line for Child Care Research",
            created_by: null,
            created_on: "2025-07-26T14:07:14.315499",
            date_needed: "2025-09-30",
            fiscal_year: 2025,
            id: 16003,
            in_review: false,
            line_description: "Child Care Research Line 2",
            portfolio_id: 1,
            proc_shop_fee_percentage: 0.005,
            procurement_shop_fee_id: 3,
            procurement_shop_fee: {
                id: 3,
                procurement_shop_id: 3,
                fee: 0.5,
                start_date: null,
                end_date: null
            },
            services_component_id: 11,
            status: "DRAFT",
            team_members: [
                {
                    email: "chris.fortunato@example.com",
                    full_name: "Chris Fortunato",
                    id: 500
                },
                {
                    email: "admin.demo@email.com",
                    full_name: "Admin Demo",
                    id: 520
                }
            ],
            updated_on: "2025-07-26T14:07:14.315499"
        }
    ],
    contract_number: "75P00124C00001",
    contract_type: "COST_PLUS_FIXED_FEE",
    created_by: 520,
    created_on: "2024-07-26T14:07:14.315499",
    delivered_status: false,
    description: "Research on Child Care Policy and Implementation",
    display_name: "Contract #15: Child Care Research Initiative",
    id: 15,
    name: "Contract #15: Child Care Research Initiative",
    notes: "",
    procurement_shop: {
        abbr: "PSC",
        fee_percentage: 0.5,
        id: 1,
        name: "Product Service Center"
    },
    awarding_entity_id: 1,
    procurement_tracker_id: null,
    product_service_code: {
        description: "Research and Development",
        id: 1,
        naics: 541720,
        name: "Research and Development in the Social Sciences and Humanities",
        support_code: "R410"
    },
    product_service_code_id: 1,
    project: {
        description: "Research initiative focused on child care policy implementation and outcomes",
        id: 15,
        project_type: "RESEARCH",
        short_title: "CCR",
        title: "Child Care Research Initiative",
        url: "https://www.acf.hhs.gov/opre/research/project/child-care-research"
    },
    project_id: 15,
    project_officer_id: 500,
    alternate_project_officer_id: 520,
    service_requirement_type: "NON_SEVERABLE",
    support_contacts: [],
    team_members: [
        {
            email: "chris.fortunato@example.com",
            full_name: "Chris Fortunato",
            id: 500
        },
        {
            email: "admin.demo@email.com",
            full_name: "Admin Demo",
            id: 520
        }
    ],
    updated_by: null,
    updated_on: "2024-07-26T14:07:14.315499",
    vendor: "Research Associates Inc.",
    vendor_id: 550,
    is_awarded: false
};

export const agreementWithBudgetLineFromPlannedToExecution = {
    agreement_reason: "RECOMPETE",
    agreement_type: "CONTRACT",
    nick_name: "EXEC-TEST",
    budget_line_items: [
        {
            agreement_id: 15,
            amount: 500000,
            can: {
                appropriation_date: "2023-10-01T00:00:00.000000Z",
                active_period: 1,
                description: "Child Care Research",
                expiration_date: "2024-09-01T00:00:00.000000Z",
                id: 520,
                portfolio_id: 1,
                nick_name: "CCR",
                number: "G99CCR1",
                display_name: "G99CCR1"
            },
            can_id: 520,
            change_requests_in_review: [
                {
                    agreement_id: 15,
                    budget_line_item_id: 16001,
                    change_request_type: "BUDGET_LINE_ITEM_CHANGE_REQUEST",
                    created_by: 520,
                    created_by_user: {
                        full_name: "Admin Demo",
                        id: 520
                    },
                    created_on: "2024-07-26T15:03:08.071953",
                    display_name: "BudgetLineItemChangeRequest#7",
                    has_budget_change: false,
                    has_status_change: true,
                    id: 7,
                    managing_division_id: 1,
                    requested_change_data: {
                        status: "IN_EXECUTION"
                    },
                    requested_change_diff: {
                        status: {
                            new: "IN_EXECUTION",
                            old: "PLANNED"
                        }
                    },
                    requestor_notes: "Status change request to IN_EXECUTION for Budget Line 1",
                    reviewed_on: null,
                    reviewer_notes: null,
                    status: "IN_REVIEW",
                    updated_by: 520,
                    updated_on: "2024-07-26T15:03:08.071953"
                }
            ],
            comments: "First budget line for Child Care Research",
            created_by: null,
            created_on: "2024-07-26T14:07:14.315499",
            date_needed: "2024-09-30",
            fiscal_year: 2024,
            id: 16001,
            in_review: true,
            line_description: "Child Care Research Line 1",
            portfolio_id: 1,
            proc_shop_fee_percentage: 0.005,
            procurement_shop_fee_id: 3,
            procurement_shop_fee: {
                id: 3,
                procurement_shop_id: 3,
                fee: 0.5,
                start_date: null,
                end_date: null
            },
            services_component_id: 10,
            status: "DRAFT",
            team_members: [
                {
                    email: "chris.fortunato@example.com",
                    full_name: "Chris Fortunato",
                    id: 500
                },
                {
                    email: "admin.demo@email.com",
                    full_name: "Admin Demo",
                    id: 520
                }
            ],
            updated_on: "2024-07-26T14:07:14.315499"
        },
        {
            agreement_id: 15,
            amount: 750000,
            can: {
                appropriation_date: "2023-10-01T00:00:00.000000Z",
                active_period: 1,
                description: "Child Care Research",
                expiration_date: "2024-09-01T00:00:00.000000Z",
                id: 520,
                portfolio_id: 1,
                nick_name: "CCR",
                number: "G99CCR1",
                display_name: "G99CCR1"
            },
            can_id: 520,
            change_requests_in_review: [],
            comments: "Second budget line for Child Care Research",
            created_by: null,
            created_on: "2024-07-26T14:07:14.315499",
            date_needed: "2024-09-30",
            fiscal_year: 2024,
            id: 16002,
            in_review: false,
            line_description: "Child Care Research Line 2",
            portfolio_id: 1,
            proc_shop_fee_percentage: 0.005,
            procurement_shop_fee_id: 3,
            procurement_shop_fee: {
                id: 3,
                procurement_shop_id: 3,
                fee: 0.5,
                start_date: null,
                end_date: null
            },
            services_component_id: 11,
            status: "PLANNED",
            team_members: [
                {
                    email: "chris.fortunato@example.com",
                    full_name: "Chris Fortunato",
                    id: 500
                },
                {
                    email: "admin.demo@email.com",
                    full_name: "Admin Demo",
                    id: 520
                }
            ],
            updated_on: "2024-07-26T14:07:14.315499"
        },
        {
            agreement_id: 15,
            amount: 100000,
            can: {
                appropriation_date: "2023-10-01T00:00:00.000000Z",
                active_period: 1,
                description: "Child Care Research",
                expiration_date: "2024-09-01T00:00:00.000000Z",
                id: 520,
                portfolio_id: 1,
                nick_name: "CCR",
                number: "G99CCR1",
                display_name: "G99CCR1"
            },
            can_id: 520,
            change_requests_in_review: [],
            comments: "Draft budget line for Child Care Research",
            created_by: null,
            created_on: "2025-07-26T14:07:14.315499",
            date_needed: "2025-09-30",
            fiscal_year: 2025,
            id: 16003,
            in_review: false,
            line_description: "Child Care Research Line 2",
            portfolio_id: 1,
            proc_shop_fee_percentage: 0.005,
            procurement_shop_fee_id: 3,
            procurement_shop_fee: {
                id: 3,
                procurement_shop_id: 3,
                fee: 0.5,
                start_date: null,
                end_date: null
            },
            services_component_id: 11,
            status: "DRAFT",
            team_members: [
                {
                    email: "chris.fortunato@example.com",
                    full_name: "Chris Fortunato",
                    id: 500
                },
                {
                    email: "admin.demo@email.com",
                    full_name: "Admin Demo",
                    id: 520
                }
            ],
            updated_on: "2025-07-26T14:07:14.315499"
        }
    ],
    contract_number: "75P00124C00001",
    contract_type: "COST_PLUS_FIXED_FEE",
    created_by: 520,
    created_on: "2024-07-26T14:07:14.315499",
    delivered_status: false,
    description: "Research on Child Care Policy and Implementation",
    display_name: "Contract #15: Child Care Research Initiative",
    id: 15,
    name: "Contract #15: Child Care Research Initiative",
    notes: "",
    procurement_shop: {
        abbr: "PSC",
        fee_percentage: 0.5,
        id: 1,
        name: "Product Service Center"
    },
    awarding_entity_id: 1,
    procurement_tracker_id: null,
    product_service_code: {
        description: "Research and Development",
        id: 1,
        naics: 541720,
        name: "Research and Development in the Social Sciences and Humanities",
        support_code: "R410"
    },
    product_service_code_id: 1,
    project: {
        description: "Research initiative focused on child care policy implementation and outcomes",
        id: 15,
        project_type: "RESEARCH",
        short_title: "CCR",
        title: "Child Care Research Initiative",
        url: "https://www.acf.hhs.gov/opre/research/project/child-care-research"
    },
    project_id: 15,
    project_officer_id: 500,
    alternate_project_officer_id: 520,
    service_requirement_type: "NON_SEVERABLE",
    support_contacts: [],
    team_members: [
        {
            email: "chris.fortunato@example.com",
            full_name: "Chris Fortunato",
            id: 500
        },
        {
            email: "admin.demo@email.com",
            full_name: "Admin Demo",
            id: 520
        }
    ],
    updated_by: null,
    updated_on: "2024-07-26T14:07:14.315499",
    vendor: "Research Associates Inc.",
    vendor_id: 550,
    is_awarded: true
};

export const budgetLineWithProcurementShopChangeRequest = {
    agreement_id: 1,
    amount: 250000,
    fees: 1250,
    total: 251250,
    can: {
        appropriation_date: "2022-10-01T00:00:00.000000Z",
        active_period: 1,
        description: "Example CAN",
        display_name: "G99XXX8",
        expiration_date: "2023-09-01T00:00:00.000000Z",
        id: 512,
        portfolio_id: 3,
        nick_name: "",
        number: "G99XXX8",
        portfolio: {
            division_id: 1,
            id: 1,
            name: "Test Portfolio",
            division: {
                abbreviation: "test",
                deputy_division_director_id: 1,
                display_name: "test",
                division_director_id: 1,
                id: 1,
                name: "test"
            }
        }
    },
    can_id: 512,
    change_requests_in_review: [
        {
            agreement_id: 1,
            budget_line_item_id: 15021,
            change_request_type: "AGREEMENT_CHANGE_REQUEST",
            created_by: 520,
            created_by_user: {
                full_name: "Admin Demo",
                id: 520
            },
            created_on: "2024-07-26T14:39:51.776768",
            display_name: "AgreementChangeRequest#1",
            has_budget_change: false,
            has_status_change: false,
            has_proc_shop_change: true,
            id: 1,
            managing_division_id: 4,
            requested_change_data: {
                awarding_entity_id: 2
            },
            requested_change_diff: {
                awarding_entity_id: {
                    new: 2,
                    old: 1
                }
            },
            requestor_notes: "sc3",
            reviewed_on: null,
            reviewer_notes: null,
            status: "IN_REVIEW",
            type: "AGREEMENT_CHANGE_REQUEST",
            updated_by: 520,
            updated_on: "2024-07-26T14:39:51.776768"
        }
    ],
    comments: "",
    created_by: null,
    created_on: "2024-07-26T14:39:51.776768Z",
    date_needed: "2044-06-13",
    fiscal_year: 2044,
    id: 15021,
    in_review: true,
    line_description: "SC3",
    portfolio_id: 3,
    proc_shop_fee_percentage: 0.005,
    procurement_shop_fee_id: 1,
    procurement_shop_fee: {
        id: 1,
        procurement_shop_id: 1,
        fee: 0.5,
        start_date: null,
        end_date: null
    },
    services_component_id: 1,
    status: "PLANNED",
    team_members: [
        {
            email: "chris.fortunato@example.com",
            full_name: "Chris Fortunato",
            id: 500
        },
        {
            email: "admin.demo@email.com",
            full_name: "Admin Demo",
            id: 520
        }
    ],
    updated_on: "2024-07-26T14:39:51.776768"
};
