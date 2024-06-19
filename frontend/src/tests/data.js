export const budgetLine = {
    active_workflow_current_step_id: null,
    agreement_id: 1,
    amount: 1_000_000,
    can: {
        appropriation_date: "2023-10-01T00:00:00.000000Z",
        appropriation_term: 1,
        authorizer_id: 26,
        description: "Head Start Research",
        expiration_date: "2024-09-01T00:00:00.000000Z",
        id: 5,
        managing_portfolio_id: 2,
        nickname: "HS",
        number: "G994426",
        purpose: "",
        display_name: "G994426"
    },
    can_id: 5,
    change_requests_in_review: null,
    comments: "comment one",
    created_by: null,
    created_on: "2024-05-27T13:56:50.363964Z",
    date_needed: "2043-06-13",
    fiscal_year: 2043,
    has_active_workflow: false,
    id: 1,
    in_review: false,
    line_description: "LI 1",
    portfolio_id: 2,
    proc_shop_fee_percentage: 0,
    services_component_id: 1,
    status: "DRAFT",
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
            active_workflow_current_step_id: null,
            agreement_id: 1,
            amount: 1_000_000,
            can: {
                appropriation_date: "2023-10-01T00:00:00.000000Z",
                appropriation_term: 1,
                authorizer_id: 26,
                description: "Head Start Research",
                expiration_date: "2024-09-01T00:00:00.000000Z",
                id: 5,
                managing_portfolio_id: 2,
                nickname: "HS",
                number: "G994426",
                purpose: "",
                display_name: "G994426"
            },
            can_id: 5,
            change_requests_in_review: null,
            comments: "",
            created_by: null,
            created_on: "2024-05-27T19:20:46.105099Z",
            date_needed: "2043-06-13",
            fiscal_year: 2043,
            has_active_workflow: false,
            id: 1,
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
                    id: 1
                },
                {
                    email: "Amelia.Popham@example.com",
                    full_name: "Amelia Popham",
                    id: 4
                },
                {
                    email: "admin.demo@email.com",
                    full_name: "Admin Demo",
                    id: 21
                },
                {
                    email: "dave.director@email.com",
                    full_name: "Dave Director",
                    id: 23
                }
            ],
            updated_on: "2024-05-27T19:20:46.105099Z"
        },
        {
            active_workflow_current_step_id: null,
            agreement_id: 1,
            amount: 1_000_000,
            can: {
                appropriation_date: "2023-10-01T00:00:00.000000Z",
                appropriation_term: 1,
                authorizer_id: 26,
                description: "Head Start Research",
                expiration_date: "2024-09-01T00:00:00.000000Z",
                id: 5,
                managing_portfolio_id: 2,
                nickname: "HS",
                number: "G994426",
                purpose: "",
                display_name: "G994426"
            },
            can_id: 5,
            change_requests_in_review: null,
            comments: "",
            created_by: null,
            created_on: "2024-05-27T19:20:46.118542Z",
            date_needed: "2043-06-13",
            fiscal_year: 2043,
            has_active_workflow: false,
            id: 2,
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
                    id: 1
                },
                {
                    email: "Amelia.Popham@example.com",
                    full_name: "Amelia Popham",
                    id: 4
                },
                {
                    email: "admin.demo@email.com",
                    full_name: "Admin Demo",
                    id: 21
                },
                {
                    email: "dave.director@email.com",
                    full_name: "Dave Director",
                    id: 23
                }
            ],
            updated_on: "2024-05-27T19:20:46.118542Z"
        }
    ],
    contract_number: "XXXX000000001",
    contract_type: "LABOR_HOUR",
    created_by: 4,
    created_on: "2024-05-27T19:20:43.774009Z",
    delivered_status: false,
    description: "Test description",
    display_name: "Contract #1: African American Child and Family Research Center",
    id: 1,
    incumbent: "Vendor 1",
    incumbent_id: 1,
    name: "Contract #1: African American Child and Family Research Center",
    notes: "",
    procurement_shop: {
        abbr: "PSC",
        fee: 0,
        id: 1,
        name: "Product Service Center"
    },
    procurement_shop_id: 1,
    procurement_tracker_workflow_id: null,
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
    project_officer_id: 1,
    service_requirement_type: "NON_SEVERABLE",
    support_contacts: [],
    team_members: [
        {
            email: "chris.fortunato@example.com",
            full_name: "Chris Fortunato",
            id: 1
        },
        {
            email: "Amelia.Popham@example.com",
            full_name: "Amelia Popham",
            id: 4
        },
        {
            email: "admin.demo@email.com",
            full_name: "Admin Demo",
            id: 21
        },
        {
            email: "dave.director@email.com",
            full_name: "Dave Director",
            id: 23
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
        budget_line_item_id: 22,
        created_by: 21,
        created_by_user: {
            full_name: "Admin Demo",
            id: 21
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
        updated_by: 21,
        updated_on: "2024-06-17T22:03:15.201945"
    },
    {
        agreement_id: 9,
        budget_line_item_id: 22,
        created_by: 21,
        created_by_user: {
            full_name: "Admin Demo",
            id: 21
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
        updated_by: 21,
        updated_on: "2024-06-17T22:03:15.220286"
    },
    {
        agreement_id: 9,
        budget_line_item_id: 22,
        created_by: 21,
        created_by_user: {
            full_name: "Admin Demo",
            id: 21
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
        updated_by: 21,
        updated_on: "2024-06-17T22:03:15.239904"
    },
    {
        agreement_id: 1,
        budget_line_item_id: 1,
        created_by: 21,
        created_by_user: {
            full_name: "Admin Demo",
            id: 21
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
        updated_by: 21,
        updated_on: "2024-06-17T18:55:41.810562"
    },
    {
        agreement_id: 1,
        budget_line_item_id: 2,
        created_by: 21,
        created_by_user: {
            full_name: "Admin Demo",
            id: 21
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
        updated_by: 21,
        updated_on: "2024-06-17T18:55:41.826716"
    }
];
