import PropTypes from "prop-types";
import Accordion from "../../UI/Accordion";
import Term from "../../UI/Term";

/**
 * Renders an accordion component that displays the details of an agreement.
 * @component
 * @param {Object} props - The component props.
 * @param {Object} props.agreement - The agreement object to display.
 * @param {string} props.projectOfficerName - The name of the project officer.
 * @param {Object} [props.res] - The response object.
 * @param {Object} [props.cn] - The classnames object.
 * @param {Function} props.convertCodeForDisplay - The function to convert codes for display.
 * @param {string} props.instructions - The instruction text of the agreement.
 * @returns {JSX.Element} - The rendered component.
 */
const AgreementMetaAccordion = ({ agreement, projectOfficerName, res, cn, convertCodeForDisplay, instructions }) => {
    const MORE_THAN_THREE_TEAM_MEMBERS = agreement?.team_members.length > 3;

    return (
        <Accordion
            heading="Review Agreement Details"
            level={2}
        >
            <p>{instructions}</p>
            {/* WITH VALIDATION */}
            {res && (
                <div className="grid-row grid-gap">
                    <dl className="margin-0 font-12px grid-col">
                        <Term
                            name="project"
                            label="Project"
                            value={agreement?.project?.title}
                        />
                        <Term
                            name="name"
                            label="Agreement"
                            messages={res.getErrors("name")}
                            className={cn("name")}
                            value={agreement?.name}
                        />
                        <Term
                            name="description"
                            label="Description"
                            messages={res.getErrors("description")}
                            className={cn("description")}
                            value={agreement?.description}
                        />
                    </dl>

                    <div className="margin-0 font-12px grid-col">
                        <dl>
                            <Term
                                name="type"
                                label="Agreement Type"
                                messages={res.getErrors("type")}
                                className={cn("type")}
                                value={convertCodeForDisplay("agreementType", agreement?.agreement_type)}
                            />
                            <Term
                                name="psc"
                                label="Product Service Code"
                                messages={res.getErrors("psc")}
                                className={cn("psc")}
                                value={agreement?.product_service_code?.name}
                            />
                        </dl>
                        <dl className="grid-row">
                            <Term
                                name="naics"
                                label="NAICS Code"
                                messages={res.getErrors("naics")}
                                className={`grid-col margin-top-0 ${cn("program-support-code")}`}
                                value={agreement?.product_service_code?.naics}
                            />
                            <Term
                                name="program-support-code"
                                label="Program Support Code"
                                messages={res.getErrors("program-support-code")}
                                className={`grid-col margin-top-0 ${cn("program-support-code")}`}
                                value={agreement?.product_service_code?.support_code}
                            />
                        </dl>
                        <dl>
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
                        </dl>

                        {agreement?.team_members.length > 0 ? (
                            <dl className="grid-row grid-gap-sm">
                                <dt className="margin-0 text-base-dark margin-top-3 grid-col-12">Team Members</dt>
                                {agreement?.team_members.map((member) => (
                                    <dd
                                        key={member.id}
                                        className={`text-semibold margin-0 margin-top-05 ${
                                            MORE_THAN_THREE_TEAM_MEMBERS ? "grid-col-6" : "grid-col-12"
                                        }`}
                                    >
                                        {member.full_name}
                                    </dd>
                                ))}
                            </dl>
                        ) : (
                            <dl>
                                <Term
                                    name="team-member"
                                    label="Team Members"
                                    messages={res.getErrors("team-member")}
                                    className={cn("team-member")}
                                    value={agreement?.team_members[0]}
                                />
                            </dl>
                        )}
                    </div>
                </div>
            )}
            {/* WITHOUT VALIDATION */}
            {!res && (
                <div className="grid-row grid-gap">
                    <dl className="margin-0 font-12px grid-col">
                        <Term
                            name="project"
                            label="Project"
                            value={agreement?.project?.title}
                        />
                        <Term
                            name="name"
                            label="Agreement"
                            value={agreement?.name}
                        />
                        <Term
                            name="description"
                            label="Description"
                            value={agreement?.description}
                        />
                    </dl>

                    <div className="margin-0 font-12px grid-col">
                        <dl>
                            <Term
                                name="type"
                                label="Agreement Type"
                                value={convertCodeForDisplay("agreementType", agreement?.agreement_type)}
                            />
                            <Term
                                name="psc"
                                label="Product Service Code"
                                value={agreement?.product_service_code?.name}
                            />
                        </dl>
                        <dl className="grid-row">
                            <Term
                                name="naics"
                                label="NAICS Code"
                                className="grid-col margin-top-0"
                                value={agreement?.product_service_code?.naics}
                            />
                            <Term
                                name="program-support-code"
                                label="Program Support Code"
                                className="grid-col margin-top-0"
                                value={agreement?.product_service_code?.support_code}
                            />
                        </dl>
                        <dl>
                            <Term
                                name="procurement-shop"
                                label="Procurement Shop"
                                value={`${agreement?.procurement_shop?.abbr} - Fee Rate: ${
                                    agreement?.procurement_shop?.fee * 100
                                }%`}
                            />
                            <Term
                                name="reason"
                                label="Reason for creating the agreement"
                                value={convertCodeForDisplay("agreementReason", agreement?.agreement_reason)}
                            />

                            {agreement?.incumbent && (
                                <Term
                                    name="incumbent"
                                    label="Incumbent"
                                    value={agreement?.incumbent}
                                />
                            )}
                            <Term
                                name="project-officer"
                                label="Project Officer"
                                value={projectOfficerName}
                            />
                        </dl>

                        {agreement?.team_members.length > 0 ? (
                            <dl className="grid-row grid-gap-sm">
                                <dt className="margin-0 text-base-dark margin-top-3 grid-col-12">Team Members</dt>
                                {agreement?.team_members.map((member) => (
                                    <dd
                                        key={member.id}
                                        className={`text-semibold margin-0 margin-top-05 ${
                                            MORE_THAN_THREE_TEAM_MEMBERS ? "grid-col-6" : "grid-col-12"
                                        }`}
                                    >
                                        {member.full_name}
                                    </dd>
                                ))}
                            </dl>
                        ) : (
                            <dl>
                                <Term
                                    name="team-member"
                                    label="Team Members"
                                    value={agreement?.team_members[0]}
                                />
                            </dl>
                        )}
                    </div>
                </div>
            )}
        </Accordion>
    );
};

AgreementMetaAccordion.propTypes = {
    agreement: PropTypes.object.isRequired,
    projectOfficerName: PropTypes.string,
    res: PropTypes.object,
    cn: PropTypes.func,
    convertCodeForDisplay: PropTypes.func.isRequired,
    instructions: PropTypes.string.isRequired
};
export default AgreementMetaAccordion;
