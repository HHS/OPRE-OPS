import React from "react";
import Accordion from "../../UI/Accordion";
import Term from "../../UI/Term/Term";

function AgreementMetaAccordion() {
    return (
        <Accordion heading="">
            <dl className="margin-0 font-12px">
                <Term
                    name="name"
                    label="Project"
                    messages={res.getErrors("name")}
                    className={cn("name")}
                    value={agreement?.name}
                />
                <Term
                    name="type"
                    label="Agreement Type"
                    messages={res.getErrors("type")}
                    className={cn("type")}
                    value={convertCodeForDisplay("agreementType", agreement?.agreement_type)}
                />
                <Term
                    name="description"
                    label="Description"
                    messages={res.getErrors("description")}
                    className={cn("description")}
                    value={agreement?.description}
                />
                <Term
                    name="psc"
                    label="Product Service Code"
                    messages={res.getErrors("psc")}
                    className={cn("psc")}
                    value={agreement?.product_service_code?.name}
                />
                <Term
                    name="naics"
                    label="NAICS Code"
                    messages={res.getErrors("naics")}
                    className={cn("naics")}
                    value={agreement?.product_service_code?.naics}
                />
                <Term
                    name="program-support-code"
                    label="Program Support Code"
                    messages={res.getErrors("program-support-code")}
                    className={cn("program-support-code")}
                    value={agreement?.product_service_code?.support_code}
                />
                <Term
                    name="procurement-shop"
                    label="Procurement Shop"
                    messages={res.getErrors("procurement-shop")}
                    className={cn("procurement-shop")}
                    value={`${agreement?.procurement_shop?.abbr} - Fee Rate: ${
                        agreement?.procurement_shop?.fee * 100
                    }%`}
                />
                <Term
                    name="reason"
                    label="Reason for creating the agreement"
                    messages={res.getErrors("reason")}
                    className={cn("reason")}
                    value={convertCodeForDisplay("agreementReason", agreement?.agreement_reason)}
                />

                {agreement?.incumbent && (
                    <Term
                        name="incumbent"
                        label="Incumbent"
                        messages={res.getErrors("incumbent")}
                        className={cn("incumbent")}
                        value={agreement?.incumbent}
                    />
                )}
                <Term
                    name="project-officer"
                    label="Project Officer"
                    messages={res.getErrors("project-officer")}
                    className={cn("project-officer")}
                    value={projectOfficerName}
                />

                {agreement?.team_members.length > 0 ? (
                    <>
                        <dt className="margin-0 text-base-dark margin-top-3">Team Members</dt>
                        {agreement?.team_members.map((member) => (
                            <dd
                                key={member.id}
                                className="text-semibold margin-0 margin-top-05"
                            >
                                {member.full_name}
                            </dd>
                        ))}
                    </>
                ) : (
                    <Term
                        name="team-member"
                        label="Team Members"
                        messages={res.getErrors("team-member")}
                        className={cn("team-member")}
                        value={agreement?.team_members[0]}
                    />
                )}
            </dl>
        </Accordion>
    );
}

export default AgreementMetaAccordion;
