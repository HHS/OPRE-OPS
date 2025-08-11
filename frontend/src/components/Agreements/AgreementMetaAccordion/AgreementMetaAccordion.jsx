import { CHANGE_REQUEST_SLUG_TYPES } from "../../ChangeRequests/ChangeRequests.constants";
import Accordion from "../../UI/Accordion";
import Term from "../../UI/Term";

/**
 * Renders an accordion component that displays the details of an agreement.
 * @component
 * @param {Object} props - The component props.
 * @param {import("../../../types/AgreementTypes").Agreement} props.agreement - The agreement object to display.
 * @param {CHANGE_REQUEST_SLUG_TYPES} props.changeRequestType - The type of change request
 * @param {string} props.projectOfficerName - The name of the project officer.
 * @param {string} props.alternateProjectOfficerName - The name of the alternate project officer.
 * @param {Object} [props.res] - The response object.
 * @param {Object} [props.cn] - The classnames object.
 * @param {Function} props.convertCodeForDisplay - The function to convert codes for display.
 * @param {string} props.instructions - The instruction text of the agreement.
 * @param {import("../../../types/AgreementTypes").ProcurementShop|null} [props.newAwardingEntity] - The new awarding entity information.
 * @returns {React.ReactElement} - The rendered component.
 */
const AgreementMetaAccordion = ({
    agreement,
    changeRequestType,
    projectOfficerName,
    alternateProjectOfficerName,
    res,
    cn,
    convertCodeForDisplay,
    instructions,
    newAwardingEntity
}) => {
    const MORE_THAN_THREE_TEAM_MEMBERS = agreement?.team_members && agreement?.team_members.length > 3;

    /**
     * Renders a Term component.
     * @component
     * @param {string} name - The name of the input field.
     * @param {string} [label] - The label to display for the input field (optional)..
     * @param {string|number} [value] - The value of the input field (optional).
     * @param {string} [className=""] - The optional classnames for styles
     * @returns {React.ReactElement} - The rendered Term component.
     * @private
     */
    const renderTerm = (name, label, value, className = "") => (
        <Term
            name={name}
            label={label}
            value={value}
            messages={res ? res.getErrors(name) : undefined}
            className={className || (cn ? cn(name) : undefined)}
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
                    {newAwardingEntity && changeRequestType === CHANGE_REQUEST_SLUG_TYPES.PROCUREMENT_SHOP ? (
                        <div className="padding-left-1 border-left-05 text-brand-portfolio-budget-graph-3">
                            <dl>
                                {renderTerm(
                                    "procurement-shop",
                                    "Procurement Shop",
                                    newAwardingEntity?.abbr,
                                    "text-brand-portfolio-budget-graph-3"
                                )}
                            </dl>
                        </div>
                    ) : (
                        <dl>{renderTerm("procurement-shop", "Procurement Shop", agreement?.procurement_shop?.abbr)}</dl>
                    )}
                    <dl>
                        {renderTerm(
                            "reason",
                            "Reason for creating the agreement",
                            convertCodeForDisplay("agreementReason", agreement?.agreement_reason)
                        )}
                        {agreement?.vendor && renderTerm("vendor", "Vendor", agreement?.vendor)}
                    </dl>
                    {/* TODO: show the Division Directors and Team Leaders */}
                    {!import.meta.env.PROD && (
                        <dl className="display-flex flex-justify">
                            {renderTerm("division-directors", "Division Director(s)", "TBD")}
                            {renderTerm("team-leaders", "Team Leader(s)", "TBD")}
                        </dl>
                    )}
                    <dl className="display-flex flex-justify">
                        {renderTerm(
                            "project-officer",
                            convertCodeForDisplay("projectOfficer", agreement?.agreement_type),
                            projectOfficerName
                        )}
                        {renderTerm(
                            "alternate-project-officer",
                            `Alternate ${convertCodeForDisplay("projectOfficer", agreement?.agreement_type)}`,
                            alternateProjectOfficerName
                        )}
                    </dl>

                    {agreement?.team_members && agreement?.team_members.length > 0 ? (
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
                        <dl className="text-semibold margin-0 margin-top-05 grid-col-12">
                            {renderTerm("team-members", "Team Members", "No team members")}
                        </dl>
                    )}
                </div>
            </div>
        </Accordion>
    );
};

export default AgreementMetaAccordion;
