import { NO_DATA } from "../../../constants";
import { AGREEMENT_NICKNAME_LABEL } from "../../../pages/agreements/agreements.constants";
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
 * @param {boolean} [props.isAgreementAwarded] - if the agreement is awarded
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
    newAwardingEntity,
    isAgreementAwarded = false
}) => {
    const MORE_THAN_THREE_RESEARCH_METHODS =
        agreement?.research_methodologies && agreement?.research_methodologies.length > 3;
    const MORE_THAN_THREE_SPECIAL_TOPICS = agreement?.special_topics && agreement?.special_topics.length > 3;
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
    const renderTerm = (name, label, value = NO_DATA, className = "") => (
        <Term
            name={name}
            label={label}
            value={value}
            messages={res ? res.getErrors(name) : undefined}
            className={className || (cn ? cn(name) : undefined)}
            dataCy={`agreement-meta-${name}`}
        />
    );

    return (
        <Accordion
            heading="Review Agreement Details"
            level={2}
        >
            <p>{instructions}</p>
            <div className="grid-row grid-gap">
                {/* NOTE: This is the left column*/}
                <dl className="margin-0 font-12px grid-col">
                    {renderTerm("project", "Project", agreement?.project?.title)}
                    {renderTerm("name", "Agreement", agreement?.name)}
                    {renderTerm("nickname", AGREEMENT_NICKNAME_LABEL, agreement?.nick_name ?? NO_DATA)}
                    {renderTerm("description", "Description", agreement?.description || NO_DATA)}
                </dl>
                {/* NOTE: This is the right column*/}
                <div className="margin-0 font-12px grid-col">
                    <dl className="margin-0">
                        {renderTerm(
                            "type",
                            "Agreement Type",
                            convertCodeForDisplay("agreementType", agreement?.agreement_type)
                        )}
                        {renderTerm(
                            "contract-type",
                            "Contract Type",
                            convertCodeForDisplay("contractType", agreement?.contract_type) ?? NO_DATA
                        )}
                        {isAgreementAwarded &&
                            renderTerm("contract-number", "Contract #", agreement?.contract_number ?? NO_DATA)}
                        {renderTerm(
                            "service-requirement-type",
                            "Service Requirement Type",
                            convertCodeForDisplay("serviceRequirementType", agreement?.service_requirement_type)
                        )}
                        {renderTerm("psc", "Product Service Code", agreement?.product_service_code?.name)}
                    </dl>
                    <div className="display-flex margin-top-neg-1">
                        <dl className="grid-col-4">
                            {renderTerm("naics", "NAICS Code", agreement?.product_service_code?.naics)}
                        </dl>
                        <dl className="grid-col-4">
                            {renderTerm(
                                "program-support-code",
                                "Program Support Code",
                                agreement?.product_service_code?.support_code
                            )}
                        </dl>
                    </div>
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
                    <dl className="margin-0">
                        {renderTerm(
                            "reason",
                            "Reason for creating the agreement",
                            convertCodeForDisplay("agreementReason", agreement?.agreement_reason) ?? NO_DATA
                        )}
                        {agreement?.vendor && renderTerm("vendor", "Vendor", agreement?.vendor)}
                    </dl>
                    {agreement?.research_methodologies && agreement?.research_methodologies.length > 0 ? (
                        <dl className="margin-top-2">
                            <dt className="margin-0 text-base-dark grid-col-12">Research Methodologies</dt>
                            {agreement?.research_methodologies?.map((research_methodology) => (
                                <dd
                                    key={research_methodology.id}
                                    className={`text-semibold margin-0 margin-top-05 ${
                                        MORE_THAN_THREE_RESEARCH_METHODS ? "grid-col-6" : "grid-col-12"
                                    }`}
                                    data-cy={`agreement-meta-${research_methodology.name}`}
                                >
                                    {research_methodology.name}
                                </dd>
                            ))}
                        </dl>
                    ) : (
                        <dl className="text-semibold margin-0 grid-col-12">
                            {renderTerm("research-methodologies", "Research Methodology", NO_DATA)}
                        </dl>
                    )}
                    {agreement?.special_topics && agreement?.special_topics.length > 0 ? (
                        <dl className="margin-0">
                            <dt className="margin-0 text-base-dark margin-top-2 grid-col-12">
                                Special Topic/Populations
                            </dt>
                            {agreement?.special_topics?.map((special_topic) => (
                                <dd
                                    key={special_topic.id}
                                    className={`text-semibold margin-0 margin-top-05 ${
                                        MORE_THAN_THREE_SPECIAL_TOPICS ? "grid-col-6" : "grid-col-12"
                                    }`}
                                    data-cy={`agreement-meta-${special_topic.name}`}
                                >
                                    {special_topic.name}
                                </dd>
                            ))}
                        </dl>
                    ) : (
                        <dl className="text-semibold margin-0 margin-top-05 grid-col-12">
                            {renderTerm("special-topics", "Special Topic/Populations", NO_DATA)}
                        </dl>
                    )}
                    <div className="display-flex">
                        <dl className="grid-col-4 margin-0">
                            {renderTerm("division-directors", "Division Director(s)", NO_DATA)}
                        </dl>
                        <dl className="grid-col-4 margin-0">{renderTerm("team-leaders", "Team Leader(s)", NO_DATA)}</dl>
                    </div>
                    <div className="display-flex">
                        <dl className="grid-col-4 margin-0">
                            {renderTerm(
                                "project-officer",
                                convertCodeForDisplay("projectOfficer", agreement?.agreement_type),
                                projectOfficerName
                            )}
                        </dl>
                        <dl className="grid-col-4 margin-0">
                            {renderTerm(
                                "alternate-project-officer",
                                `Alternate ${convertCodeForDisplay("projectOfficer", agreement?.agreement_type)}`,
                                alternateProjectOfficerName
                            )}
                        </dl>
                    </div>
                    <TeamMembers
                        teamMembers={agreement?.team_members ?? []}
                        renderTerm={renderTerm}
                    />
                </div>
            </div>
        </Accordion>
    );
};

const TeamMembers = ({ teamMembers, renderTerm }) => {
    if (!teamMembers?.length) {
        return (
            <dl className="text-semibold margin-0 margin-top-05 grid-col-12">
                {renderTerm("team-members", "Team Members", "No team members")}
            </dl>
        );
    }

    const MORE_THAN_THREE_TEAM_MEMBERS = teamMembers && teamMembers.length > 3;

    if (MORE_THAN_THREE_TEAM_MEMBERS) {
        // Group team members into rows of 2 for multi-column layout
        const teamMemberRows = [];
        for (let i = 0; i < teamMembers.length; i += 2) {
            teamMemberRows.push(teamMembers.slice(i, i + 2));
        }

        return (
            <dl className="margin-0 margin-top-2">
                <dt className="margin-0 text-base-dark grid-col-12">Team Members</dt>
                {teamMemberRows.map((row, rowIndex) => (
                    <dd
                        key={`team-row-${rowIndex}`}
                        className="margin-0"
                    >
                        <div className="display-flex margin-0 margin-top-05">
                            {row.map((member) => (
                                <div
                                    key={member.id}
                                    className="grid-col-4"
                                >
                                    <span className="text-semibold margin-0">{member.full_name}</span>
                                </div>
                            ))}
                        </div>
                    </dd>
                ))}
            </dl>
        );
    }

    // Single column layout for 3 or fewer team members
    return (
        <dl className="margin-0 margin-top-2">
            <dt className="margin-0 text-base-dark grid-col-12">Team Members</dt>
            {teamMembers.map((member) => (
                <dd
                    key={member.id}
                    className="text-semibold margin-0 margin-top-05 grid-col-12"
                >
                    {member.full_name}
                </dd>
            ))}
        </dl>
    );
};

export default AgreementMetaAccordion;
