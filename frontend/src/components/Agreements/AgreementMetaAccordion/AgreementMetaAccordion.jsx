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
    /**
     * Renders a Term component.
     * @component
     * @param {string} name - The name of the input field.
     * @param {string} [label] - The label to display for the input field (optional)..
     * @param {string|number} [value] - The value of the input field (optional).
     * @returns {JSX.Element} - The rendered input component.
     */
    const renderTerm = (name, label, value) => (
        <Term
            name={name}
            label={label}
            value={value}
            messages={res ? res.getErrors(name) : undefined}
            className={cn ? cn(name) : undefined}
        />
    );

    return (
        <Accordion
            heading="Review Agreement Details"
            level={2}
        >
            <p>{instructions}</p>
            <div className="grid-row grid-gap">
                <dl className="margin-0 font-12px grid-col">
                    {renderTerm("project", "Project", agreement?.project?.title)}
                    {renderTerm("name", "Agreement", agreement?.name)}
                    {renderTerm("description", "Description", agreement?.description)}
                </dl>

                <div className="margin-0 font-12px grid-col">
                    <dl>
                        {renderTerm(
                            "type",
                            "Agreement Type",
                            convertCodeForDisplay("agreementType", agreement?.agreement_type)
                        )}
                        {renderTerm(
                            "contract-type",
                            "Contract Type",
                            convertCodeForDisplay("contractType", agreement?.contract_type)
                        )}
                        {renderTerm(
                            "service-requirement-type",
                            "Service Requirement Type",
                            convertCodeForDisplay("serviceRequirementType", agreement?.service_requirement_type)
                        )}
                        {renderTerm("psc", "Product Service Code", agreement?.product_service_code?.name)}
                    </dl>
                    <dl className="display-flex flex-justify">
                        {renderTerm("naics", "NAICS Code", agreement?.product_service_code?.naics)}
                        {renderTerm(
                            "program-support-code",
                            "Program Support Code",
                            agreement?.product_service_code?.support_code
                        )}
                    </dl>
                    <dl>
                        {renderTerm(
                            "procurement-shop",
                            "Procurement Shop",
                            `${agreement?.procurement_shop?.abbr} - Fee Rate: ${agreement?.procurement_shop?.fee * 100}%`
                        )}
                        {renderTerm(
                            "reason",
                            "Reason for creating the agreement",
                            convertCodeForDisplay("agreementReason", agreement?.agreement_reason)
                        )}
                        {agreement?.incumbent && renderTerm("incumbent", "Incumbent", agreement?.incumbent)}
                        {renderTerm("project-officer", "Project Officer", projectOfficerName)}
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
                        renderTerm("team-members", "Team Members", agreement?.team_members[0])
                    )}
                </div>
            </div>
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
