import AgreementHistoryPanel from "../../../components/Agreements/AgreementDetails/AgreementHistoryPanel";
import Tag from "../../../components/UI/Tag/Tag";
import { NO_DATA } from "../../../constants";
import { getAgreementType, getFundingMethod, getPartnerType, isFieldVisible } from "../../../helpers/agreement.helpers";
import { convertCodeForDisplay } from "../../../helpers/utils";
import { AgreementFields } from "../agreements.constants";

/**
 * @component - Renders the details of an agreement
 * @param {Object} props - The component props.
 * @param {import("../../../types/AgreementTypes").Agreement} props.agreement - The agreement object to display details for.
 * @param {import("../../../types/UserTypes").SafeUser} props.projectOfficer - The project officer object for the agreement.
 * @param {import("../../../types/UserTypes").SafeUser} props.alternateProjectOfficer - The alternate project officer object for the agreement.
 * @returns {React.ReactElement} - The rendered component.
 */
const AgreementDetailsView = ({ agreement, projectOfficer, alternateProjectOfficer }) => {
    if (!agreement) {
        return <p>No agreement</p>;
    }

    return (
        <section>
            <div
                className="grid-row margin-top-2"
                style={{ columnGap: "82px" }}
            >
                <div
                    className="grid-col"
                    data-cy="details-left-col"
                >
                    {/* // NOTE: Left Column */}
                    {isFieldVisible(agreement.agreement_type, AgreementFields.DescriptionAndNotes) && (
                        <>
                            <dl className="margin-0 font-12px">
                                <dt className="margin-0 text-base-dark margin-top-3">Description</dt>
                                <dd
                                    className="margin-0 margin-top-05 text-semibold wrap-text"
                                    data-cy="agreement-description"
                                >
                                    {agreement?.description ?? NO_DATA}
                                </dd>
                            </dl>

                            <h3 className="text-base-dark margin-top-3 text-normal font-12px">Notes</h3>
                            {agreement.notes ? (
                                <div
                                    className="font-12px overflow-y-scroll force-show-scrollbars wrap-text"
                                    style={{ height: "11.375rem" }}
                                    data-cy="details-notes"
                                    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
                                    tabIndex={0}
                                    role="region"
                                    aria-live="polite"
                                    aria-label="Agreement Notes"
                                >
                                    {agreement.notes}
                                </div>
                            ) : (
                                <p className="font-12px">There are currently no notes for this agreement.</p>
                            )}
                        </>
                    )}
                    <h3 className="text-base-dark margin-top-3 text-normal font-12px history-title">History</h3>
                    <AgreementHistoryPanel
                        agreementId={agreement.id}
                    />
                </div>
                <div
                    className="grid-col"
                    data-cy="details-right-col"
                >
                    {/* // NOTE: Right Column */}
                    <dl className="margin-0 font-12px">
                        {/* NOTE: Agreement Type is derived from the agreement_type */}
                        <dt className="margin-0 text-base-dark margin-top-3">Agreement Type</dt>
                        <dd className="margin-0 margin-top-1">
                            <Tag
                                dataCy="agreement-type-tag"
                                tagStyle="primaryDarkTextLightBackground"
                                text={getAgreementType(agreement.agreement_type, false)}
                            />
                        </dd>
                    </dl>

                    <div className="display-flex">
                        {/* NOTE: Partner Type on the Front End is agreement_type from the Back End  */}
                        {isFieldVisible(agreement.agreement_type, AgreementFields.PartnerType) && (
                            <>
                                <dl className="grid-col-5 margin-0 font-12px">
                                    <dt className="margin-0 text-base-dark margin-top-3">Partner Type</dt>
                                    <dd className="margin-0 margin-top-1">
                                        <Tag
                                            dataCy="partner-type-tag"
                                            tagStyle="primaryDarkTextLightBackground"
                                            text={getPartnerType(agreement.agreement_type, false)}
                                        />
                                    </dd>
                                </dl>
                            </>
                        )}
                        {isFieldVisible(agreement.agreement_type, AgreementFields.FundingMethod) && (
                            <>
                                <dl className="grid-col-4 margin-0 margin-left-2 font-12px">
                                    <dt className="margin-0 text-base-dark margin-top-3">Funding Method</dt>
                                    <dd className="margin-0 margin-top-1">
                                        <Tag
                                            dataCy="funding-method-tag"
                                            tagStyle="primaryDarkTextLightBackground"
                                            text={getFundingMethod(agreement.agreement_type)}
                                        />
                                    </dd>
                                </dl>
                            </>
                        )}
                    </div>

                    <dl className="margin-0 font-12px">
                        {isFieldVisible(agreement.agreement_type, AgreementFields.RequestingAgency) && (
                            <>
                                <dt className="margin-0 text-base-dark margin-top-3">Requesting Agency</dt>
                                <dd className="margin-0 margin-top-1">
                                    <Tag
                                        dataCy="requesting-agency-tag"
                                        tagStyle="primaryDarkTextLightBackground"
                                        text={agreement?.requesting_agency?.name ?? NO_DATA}
                                    />
                                </dd>
                            </>
                        )}

                        {isFieldVisible(agreement.agreement_type, AgreementFields.ServicingAgency) && (
                            <>
                                <dt className="margin-0 text-base-dark margin-top-3">Servicing Agency</dt>
                                <dd className="margin-0 margin-top-1">
                                    <Tag
                                        dataCy="servicing-agency-tag"
                                        tagStyle="primaryDarkTextLightBackground"
                                        text={agreement?.servicing_agency?.name ?? NO_DATA}
                                    />
                                </dd>
                            </>
                        )}

                        {isFieldVisible(agreement.agreement_type, AgreementFields.ContractType) && (
                            <>
                                <dt className="margin-0 text-base-dark margin-top-3">Contract Type</dt>
                                <dd className="margin-0 margin-top-1">
                                    <Tag
                                        dataCy="contract-type-tag"
                                        tagStyle="primaryDarkTextLightBackground"
                                        text={convertCodeForDisplay(
                                            "contractType",
                                            agreement?.contract_type ?? NO_DATA
                                        )}
                                    />
                                </dd>
                            </>
                        )}

                        {isFieldVisible(agreement.agreement_type, AgreementFields.ServiceRequirementType) && (
                            <>
                                <dt className="margin-0 text-base-dark margin-top-3">Service Requirement Type</dt>
                                <dd className="margin-0 margin-top-1">
                                    <Tag
                                        dataCy="servicing-required-type-tag"
                                        tagStyle="primaryDarkTextLightBackground"
                                        text={convertCodeForDisplay(
                                            "serviceRequirementType",
                                            agreement?.service_requirement_type ?? NO_DATA
                                        )}
                                    />
                                </dd>
                            </>
                        )}

                        {isFieldVisible(agreement.agreement_type, AgreementFields.ProductServiceCode) && (
                            <>
                                <dt className="margin-0 text-base-dark margin-top-3">Product Service Code</dt>
                                <dd className="margin-0 margin-top-1">
                                    <Tag
                                        dataCy="product-service-code-tag"
                                        tagStyle="primaryDarkTextLightBackground"
                                        text={
                                            agreement?.product_service_code?.name
                                                ? agreement.product_service_code.name
                                                : NO_DATA
                                        }
                                    />
                                </dd>
                            </>
                        )}
                    </dl>

                    <div className="display-flex">
                        {isFieldVisible(agreement.agreement_type, AgreementFields.ProductServiceCode) && (
                            <>
                                <dl className="grid-col-4 margin-0 font-12px">
                                    <dt className="margin-0 text-base-dark margin-top-3">NAICS Code</dt>
                                    <dd className="margin-0 margin-top-1">
                                        <Tag
                                            dataCy="naics-code-tag"
                                            tagStyle="primaryDarkTextLightBackground"
                                            text={agreement?.product_service_code?.naics?.toString() ?? NO_DATA}
                                        />
                                    </dd>
                                </dl>
                            </>
                        )}
                        {isFieldVisible(agreement.agreement_type, AgreementFields.ProgramSupportCode) && (
                            <>
                                <dl className="grid-col-4 margin-0 margin-left-2 font-12px">
                                    <dt className="margin-0 text-base-dark margin-top-3">Program Support Code</dt>
                                    <dd className="margin-0 margin-top-1">
                                        <Tag
                                            dataCy="program-support-code-tag"
                                            tagStyle="primaryDarkTextLightBackground"
                                            text={agreement?.product_service_code?.support_code ?? NO_DATA}
                                        />
                                    </dd>
                                </dl>
                            </>
                        )}
                    </div>

                    {isFieldVisible(agreement.agreement_type, AgreementFields.ProcurementShop) && (
                        <dl className="margin-0 font-12px">
                            <dt className="margin-0 text-base-dark margin-top-3">Procurement Shop</dt>
                            <dd className="margin-0 margin-top-1">
                                <Tag
                                    dataCy="procurement-shop-tag"
                                    tagStyle="primaryDarkTextLightBackground"
                                    text={agreement?.procurement_shop?.abbr ?? NO_DATA}
                                />
                            </dd>
                        </dl>
                    )}

                    <div className="display-flex">
                        {isFieldVisible(agreement.agreement_type, AgreementFields.AgreementReason) && (
                            <>
                                <dl className="grid-col-4 margin-0 font-12px">
                                    <dt className="margin-0 text-base-dark margin-top-3">Agreement Reason</dt>
                                    <dd className="margin-0 margin-top-1">
                                        <Tag
                                            dataCy="agreement-reason-tag"
                                            tagStyle="primaryDarkTextLightBackground"
                                            text={
                                                agreement?.agreement_reason
                                                    ? convertCodeForDisplay(
                                                          "agreementReason",
                                                          agreement?.agreement_reason
                                                      )
                                                    : NO_DATA
                                            }
                                        />
                                    </dd>
                                </dl>
                            </>
                        )}

                        {isFieldVisible(agreement.agreement_type, AgreementFields.Vendor) && agreement?.vendor && (
                            <>
                                <dl className="grid-col-4 margin-0 margin-left-2 font-12px">
                                    <dt className="margin-0 text-base-dark margin-top-3">Vendor</dt>
                                    <dd className="margin-0 margin-top-1">
                                        <Tag
                                            dataCy="vendor-tag"
                                            tagStyle="primaryDarkTextLightBackground"
                                            text={agreement?.vendor}
                                        />
                                    </dd>
                                </dl>
                            </>
                        )}
                    </div>

                    {isFieldVisible(agreement.agreement_type, AgreementFields.Methodologies) && (
                        <dl className="margin-0 font-12px">
                            <dt className="margin-0 text-base-dark margin-top-3">Methodologies</dt>
                            <dd className="margin-0 margin-top-1">
                                <Tag
                                    dataCy="methodologies-tag"
                                    tagStyle="primaryDarkTextLightBackground"
                                    text={agreement?.methodologies ?? NO_DATA}
                                />
                            </dd>
                        </dl>
                    )}
                    {isFieldVisible(agreement.agreement_type, AgreementFields.SpecialTopic) && (
                        <dl className="margin-0 font-12px">
                            <dt className="margin-0 text-base-dark margin-top-3">Special Topic/Populations</dt>
                            <dd className="margin-0 margin-top-1">
                                <Tag
                                    dataCy="special-topic-tag"
                                    tagStyle="primaryDarkTextLightBackground"
                                    text={agreement?.special_topic ?? NO_DATA}
                                />
                            </dd>
                        </dl>
                    )}

                    <div className="display-flex">
                        {isFieldVisible(agreement.agreement_type, AgreementFields.DivisionDirectors) && (
                            <>
                                <dl className="grid-col-4 margin-0 font-12px">
                                    <dt className="margin-0 text-base-dark margin-top-3">Division Director(s)</dt>
                                    {agreement.division_directors && agreement.division_directors.length > 0 ? (
                                        <>
                                            {agreement.division_directors.map((director, index) => (
                                                <dd
                                                    key={index}
                                                    className="margin-0 margin-top-1 margin-bottom-2"
                                                >
                                                    <Tag
                                                        dataCy="division-director-tag"
                                                        tagStyle="primaryDarkTextLightBackground"
                                                        text={director}
                                                    />
                                                </dd>
                                            ))}
                                        </>
                                    ) : (
                                        <dd className="margin-0 margin-top-1">
                                            <Tag
                                                dataCy="division-director-tag-no-data"
                                                tagStyle="primaryDarkTextLightBackground"
                                                text={NO_DATA}
                                            />
                                        </dd>
                                    )}
                                </dl>
                            </>
                        )}

                        {isFieldVisible(agreement.agreement_type, AgreementFields.TeamLeaders) && (
                            <>
                                <dl className="grid-col-4 margin-0 margin-left-2 font-12px">
                                    <dt className="margin-0 text-base-dark margin-top-3">Team Leader(s)</dt>
                                    {agreement.team_leaders && agreement.team_leaders.length > 0 ? (
                                        <>
                                            {agreement.team_leaders.map((leader, index) => (
                                                <dd
                                                    key={index}
                                                    className="margin-0 margin-top-1 margin-bottom-2"
                                                >
                                                    <Tag
                                                        dataCy="team-leader-tag"
                                                        tagStyle="primaryDarkTextLightBackground"
                                                        text={leader}
                                                    />
                                                </dd>
                                            ))}
                                        </>
                                    ) : (
                                        <dd className="margin-0 margin-top-1">
                                            <Tag
                                                dataCy="team-leader-tag-no-data"
                                                tagStyle="primaryDarkTextLightBackground"
                                                text={NO_DATA}
                                            />
                                        </dd>
                                    )}
                                </dl>
                            </>
                        )}
                    </div>

                    <div className="display-flex">
                        <dl className="grid-col-4 margin-0 font-12px">
                            <dt className="margin-0 text-base-dark margin-top-3">
                                {convertCodeForDisplay("projectOfficer", agreement?.agreement_type)}
                            </dt>
                            <dd className="margin-0 margin-top-1">
                                <Tag
                                    dataCy="project-officer-tag"
                                    tagStyle="primaryDarkTextLightBackground"
                                    text={
                                        projectOfficer && projectOfficer.id !== 0 ? projectOfficer?.full_name : NO_DATA
                                    }
                                />
                            </dd>
                        </dl>
                        <dl className="grid-col-4 margin-0 margin-left-2 font-12px">
                            <dt className="margin-0 text-base-dark margin-top-3">{`Alternate ${convertCodeForDisplay("projectOfficer", agreement?.agreement_type)}`}</dt>
                            <dd className="margin-0 margin-top-1">
                                <Tag
                                    dataCy="alternate-project-officer-tag"
                                    tagStyle="primaryDarkTextLightBackground"
                                    text={
                                        alternateProjectOfficer && alternateProjectOfficer.id !== 0
                                            ? alternateProjectOfficer?.full_name
                                            : NO_DATA
                                    }
                                />
                            </dd>
                        </dl>
                    </div>

                    <dl className="margin-0 font-12px">
                        <dt className="margin-0 text-base-dark margin-top-3">Team Members</dt>
                        {agreement?.team_members && agreement?.team_members?.length > 0 ? (
                            <>
                                {[...agreement.team_members]
                                    .sort((a, b) => a.full_name.localeCompare(b.full_name))
                                    .map((member) => (
                                        <dd
                                            key={member.id}
                                            className="margin-0 margin-top-1 margin-bottom-2"
                                        >
                                            <Tag
                                                dataCy={`team-member-tag-${member.id}`}
                                                tagStyle="primaryDarkTextLightBackground"
                                                text={member.full_name}
                                            />
                                        </dd>
                                    ))}
                            </>
                        ) : (
                            <dd className="margin-0 margin-top-1 margin-bottom-2">
                                <Tag
                                    dataCy="team-member-tag-no-data"
                                    tagStyle="primaryDarkTextLightBackground"
                                    text={NO_DATA}
                                />
                            </dd>
                        )}
                    </dl>
                </div>
            </div>
        </section>
    );
};

export default AgreementDetailsView;
