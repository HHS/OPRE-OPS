export const budgetLine = {
    agreement_id: 1,
    amount: 1_000_000,
    can: {
        appropriation_date: "2023-10-01T00:00:00.000000Z",
        appropriation_term: 1,
        authorizer_id: 525,
        description: "Head Start Research",
        expiration_date: "2024-09-01T00:00:00.000000Z",
        id: 5,
        managing_portfolio_id: 2,
        nickname: "HS",
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
    updated_on: "2024-05-27T13:56:50.363964Z"
};

export const agreement = {
    agreement_reason: "RECOMPETE",
    agreement_type: "CONTRACT",
    budget_line_items: [
        {
            agreement_id: 1,
            amount: 1_000_000,
            can: {
                appropriation_date: "2023-10-01T00:00:00.000000Z",
                appropriation_term: 1,
                authorizer_id: 525,
                description: "Head Start Research",
                expiration_date: "2024-09-01T00:00:00.000000Z",
                id: 5,
                managing_portfolio_id: 2,
                nickname: "HS",
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
            can: {
                appropriation_date: "2023-10-01T00:00:00.000000Z",
                appropriation_term: 1,
                authorizer_id: 525,
                description: "Head Start Research",
                expiration_date: "2024-09-01T00:00:00.000000Z",
                id: 5,
                managing_portfolio_id: 2,
                nickname: "HS",
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
    contract_type: "LABOR_HOUR",
    created_by: 503,
    created_on: "2024-05-27T19:20:43.774009Z",
    delivered_status: false,
    description: "Test description",
    display_name: "Contract #1: African American Child and Family Research Center",
    id: 1,
    incumbent: "Vendor 1",
    incumbent_id: 500,
    name: "Contract #1: African American Child and Family Research Center",
    notes: "",
    procurement_shop: {
        abbr: "PSC",
        fee: 0,
        id: 1,
        name: "Product Service Center"
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
    vendor_id: 1
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
    contract_agreement_id: 1,
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
  ]
  export const canAppropriationDetails =  [
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
        name: "admin"
    },
    {
        id: 2,
        name: "user"
    },
    {
        id: 3,
        name: "unassigned"
    },
    {
        id: 4,
        name: "division-director"
    },
    {
        id: 5,
        name: "USER_ADMIN"
    },
    {
        id: 6,
        name: "BUDGET_TEAM"
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
        abbreviation: "DEI",
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
        abbreviation: "DFCD",
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
    can: {
        appropriation_date: "2022-10-01T00:00:00.000000Z",
        appropriation_term: 1,
        authorizer_id: 26,
        description: "Example CAN",
        display_name: "G99XXX8",
        expiration_date: "2023-09-01T00:00:00.000000Z",
        id: 512,
        managing_portfolio_id: 3,
        nickname: "",
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
    can: {
        appropriation_date: "2023-10-01T00:00:00.000000Z",
        appropriation_term: 1,
        authorizer_id: 26,
        description: "Head Start Research",
        display_name: "G994426",
        expiration_date: "2024-09-01T00:00:00.000000Z",
        id: 504,
        managing_portfolio_id: 2,
        nickname: "HS",
        number: "G994426"
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
    can: {
        appropriation_date: "2023-10-01T00:00:00.000000Z",
        appropriation_term: 1,
        authorizer_id: 26,
        description: "Social Science Research and Development",
        display_name: "G99PHS9",
        expiration_date: "2024-09-01T00:00:00.000000Z",
        id: 502,
        managing_portfolio_id: 8,
        nickname: "SSRD",
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
