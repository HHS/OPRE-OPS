import App from "../../../App";
import { useParams } from "react-router-dom";
import { EditAgreementForm } from "./EditAgreementForm";
import Breadcrumb from "../../../components/UI/Header/Breadcrumb";
import { EditAgreementProvider } from "./EditAgreementContext";
import {useGetAgreementByIdQuery} from "../../../api/opsAPI";
import React from "react";
import {convertCodeForDisplay} from "../../../helpers/utils";

export const AgreementCard = ({ agreement }) => {

    const agreement_remote = agreement

    return (
        <>
            <dl className="margin-0 font-12px">
                <dt className="margin-0 text-base-dark margin-top-3">Project</dt>
                <dd className="text-semibold margin-0 margin-top-05">{agreement_remote?.research_project?.title}</dd>
                <dt className="margin-0 text-base-dark margin-top-3">Agreement Type</dt>
                <dd className="text-semibold margin-0 margin-top-05">
                    {convertCodeForDisplay("agreementType", agreement_remote?.agreement_type)}
                </dd>
                <dt className="margin-0 text-base-dark margin-top-3">Agreement</dt>
                <dd className="text-semibold margin-0 margin-top-05">{agreement_remote?.name}</dd>
                <dt className="margin-0 text-base-dark margin-top-3">Description</dt>
                <dd className="text-semibold margin-0 margin-top-05">{agreement_remote?.description}</dd>
                <dt className="margin-0 text-base-dark margin-top-3">Product Service Code</dt>
                <dd className="text-semibold margin-0 margin-top-05">{agreement_remote?.product_service_code?.name}</dd>
                <dt className="margin-0 text-base-dark margin-top-3">NAICS Code</dt>
                <dd className="text-semibold margin-0 margin-top-05">{agreement_remote?.product_service_code?.naics}</dd>
                <dt className="margin-0 text-base-dark margin-top-3">Program Support Code</dt>
                <dd className="text-semibold margin-0 margin-top-05">
                    {agreement_remote?.product_service_code?.support_code}
                </dd>
                <dt className="margin-0 text-base-dark margin-top-3">Procurement Shop</dt>
                <dd className="text-semibold margin-0 margin-top-05">{`${
                    agreement_remote?.procurement_shop?.abbr
                } - Fee Rate: ${agreement_remote?.procurement_shop?.fee * 100}%`}</dd>
                <dt className="margin-0 text-base-dark margin-top-3">Reason for creating the agreement</dt>
                <dd className="text-semibold margin-0 margin-top-05">
                    {convertCodeForDisplay("agreementReason", agreement_remote?.agreement_reason)}
                </dd>
                {agreement_remote.incumbent && (
                    <>
                        <dt className="margin-0 text-base-dark margin-top-3">Incumbent</dt>
                        <dd className="text-semibold margin-0 margin-top-05">{agreement_remote?.incumbent}</dd>
                    </>
                )}
                <dt className="margin-0 text-base-dark margin-top-3">Project Officer</dt>
                <dd className="text-semibold margin-0 margin-top-05"></dd>
                {agreement_remote?.team_members?.length > 0 && (
                    <>
                        <dt className="margin-0 text-base-dark margin-top-3">Team Members</dt>
                        {agreement_remote?.team_members.map((member) => (
                            <dd key={member.id} className="text-semibold margin-0 margin-top-05">
                                {member.full_name}
                            </dd>
                        ))}
                    </>
                )}
            </dl>
        </>
    );
};
