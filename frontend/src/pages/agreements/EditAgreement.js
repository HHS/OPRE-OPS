import App from "../../App";
import { CreateAgreementProvider } from "./CreateAgreementContext";
import CreateAgreement from "./CreateAgreement";
import {useParams} from "react-router-dom";
import {useGetAgreementByIdQuery} from "../../api/opsAPI";
import {AgreementCard} from "./edit/AgreementCard";
import React from "react";

const EditAgreement = () => {
    const agreement_1 = {
        "agreement_reason": "NEW_REQ",
        "agreement_type": "CONTRACT",
        "budget_line_items": [
            {
                "agreement_id": 1,
                "amount": 1000000.0,
                "can": {
                    "appropriation_date": "01/10/2023",
                    "appropriation_term": 1,
                    "arrangement_type": "OPRE_APPROPRIATION",
                    "authorizer_id": 26,
                    "created_by": null,
                    "created_on": "2023-06-12T14:36:01.421646",
                    "description": "Head Start Research",
                    "expiration_date": "01/09/2024",
                    "id": 5,
                    "managing_portfolio_id": 2,
                    "nickname": "HS",
                    "number": "G994426",
                    "purpose": "",
                    "updated_on": "2023-06-12T14:36:01.421646"
                },
                "can_id": 5,
                "comments": "",
                "created_by": null,
                "created_on": "2023-06-12T14:36:08.588472",
                "date_needed": "2023-06-13",
                "id": 1,
                "line_description": "LI 1",
                "psc_fee_amount": 0.5,
                "status": "PLANNED",
                "updated_on": "2023-06-12T14:36:08.588472"
            },
            {
                "agreement_id": 1,
                "amount": 1000000.0,
                "can": {
                    "appropriation_date": "01/10/2023",
                    "appropriation_term": 1,
                    "arrangement_type": "OPRE_APPROPRIATION",
                    "authorizer_id": 26,
                    "created_by": null,
                    "created_on": "2023-06-12T14:36:01.421646",
                    "description": "Head Start Research",
                    "expiration_date": "01/09/2024",
                    "id": 5,
                    "managing_portfolio_id": 2,
                    "nickname": "HS",
                    "number": "G994426",
                    "purpose": "",
                    "updated_on": "2023-06-12T14:36:01.421646"
                },
                "can_id": 5,
                "comments": "",
                "created_by": null,
                "created_on": "2023-06-12T14:36:08.588472",
                "date_needed": "2023-06-13",
                "id": 2,
                "line_description": "LI 2",
                "psc_fee_amount": 0.5,
                "status": "PLANNED",
                "updated_on": "2023-06-12T14:36:08.588472"
            }
        ],
        "contract_number": "CT00XX1",
        "contract_type": "RESEARCH",
        "created_by": null,
        "created_on": "2023-06-12T14:36:08.588472",
        "delivered_status": false,
        "description": "Test description PATCH. 234234",
        "id": 1,
        "incumbent": null,
        "name": "Contract #1: African American Child and Family Research Center",
        "notes": null,
        "number": "AGR0001",
        "procurement_shop": {
            "abbr": "GCS",
            "created_by": null,
            "created_on": "2023-06-12T14:36:08.588472",
            "fee": 0.0,
            "id": 2,
            "name": "Government Contracting Services",
            "updated_on": "2023-06-12T14:36:08.588472"
        },
        "procurement_shop_id": 2,
        "product_service_code": null,
        "product_service_code_id": null,
        "project_officer": 1,
        "research_project": {
            "created_by": null,
            "created_on": "2023-06-12T14:35:57.964365",
            "description": "This contract will conduct interoperability activities to facilitate the exchange of information within, between, and from states and tribal organizations by facilitating lower-burden, interoperable data reporting and exchange to other state agencies and to ACF. The contract will focus on developing content that facilitates streamlined, interoperable reporting to ACF. The contract will also conduct research and evaluation activities with states and tribal organizations to assess the effectiveness of providing these interoperability artifacts for these organizations to use. The ability to share data and develop interoperable data systems is important for effective operation and oversight of these programs. This contract is designed to address these requirements and deliver needed and practical tools to accelerate implementation of data sharing and interoperable initiatives.",
            "id": 1,
            "methodologies": [
                "SURVEY",
                "FIELD_RESEARCH",
                "PARTICIPANT_OBSERVATION",
                "ETHNOGRAPHY",
                "EXPERIMENT",
                "SECONDARY_DATA_ANALYSIS",
                "CASE_STUDY"
            ],
            "origination_date": "2021-01-01",
            "populations": [
                "POPULATION_1"
            ],
            "short_title": "",
            "team_leaders": [
                {
                    "created_by": null,
                    "created_on": "2023-06-12T14:36:04.265272",
                    "date_joined": "2023-06-12T14:36:04.265272",
                    "division": 1,
                    "email": "chris.fortunato@example.com",
                    "first_name": "Chris",
                    "full_name": "Chris Fortunato",
                    "id": 1,
                    "last_name": "Fortunato",
                    "oidc_id": "00000000-0000-1111-a111-000000000001",
                    "updated": null,
                    "updated_on": "2023-06-12T14:36:04.265272"
                }
            ],
            "title": "Human Services Interoperability Support",
            "updated_on": "2023-06-12T14:35:57.964365",
            "url": "https://www.acf.hhs.gov/opre/project/acf-human-services-interoperability-support"
        },
        "research_project_id": 1,
        "support_contacts": [],
        "team_members": [],
        "updated_on": "2023-06-12T21:33:19.936345",
        "vendor": "Vendor 1"
    }

    const urlPathParams = useParams();
    const agreementId = parseInt(urlPathParams.id);

    const {
        data: agreement,
        error: errorAgreement,
        isLoading: isLoadingAgreement,
    } = useGetAgreementByIdQuery(agreementId);

    if (isLoadingAgreement) {
        return <div>Loading...</div>;
    }
    if (errorAgreement) {
        return <div>Oops, an error occurred</div>;
    }

    let project_officer = null;
    if (agreement.project_officer) {

    }

    return (
        <App>
            <CreateAgreementProvider agreement={agreement}>
                <CreateAgreement />
            </CreateAgreementProvider>
            <pre>{JSON.stringify(agreement, null, 2)}</pre>


            <AgreementCard agreement={agreement} />
        </App>
    );
};

export default EditAgreement;
