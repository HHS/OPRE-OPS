import PropTypes from "prop-types";
import { notesData } from "./data";
import LogItem from "../../../components/UI/LogItem";
import Tag from "../../../components/UI/Tag/Tag";
import { convertCodeForDisplay } from "../../../helpers/utils";
import AgreementHistoryPanel from "../../../components/Agreements/AgreementDetails/AgreementHistoryPanel";

/**
 * Renders the details of an agreement
 * @param {object} props - The component props.
 * @param {object} props.agreement - The agreement object to display details for.
 * @param {object} props.projectOfficer - The project officer object for the agreement.
 * @returns {React.JSX.Element} - The rendered component.
 */
const AgreementDetailsView = ({ agreement, projectOfficer }) => {
    const missingValueText = "TBD";

    return (
        <section>
            <div className="grid-row margin-top-2">
                <div
                    className="grid-col-6 padding-right-1"
                    data-cy="details-left-col"
                >
                    {/* // NOTE: Left Column */}
                    <dl className="margin-0 font-12px">
                        <dt className="margin-0 text-base-dark margin-top-3">Description</dt>
                        <dd className="margin-0 margin-top-05 text-semibold">
                            {agreement?.description ? agreement.description : missingValueText}
                        </dd>
                    </dl>
                    <h3 className="text-base-dark margin-top-3 text-normal font-12px">Notes</h3>
                    {agreement.notes ? (
                        <div
                            className="font-12px overflow-y-scroll force-show-scrollbars"
                            style={{ height: "11.375rem" }}
                            tabIndex={0}
                            data-cy="details-notes"
                        >
                            {agreement.notes}
                        </div>
                    ) : (
                        <p className="font-12px">There are currently no notes for this agreement.</p>
                    )}
                    <h3 className="text-base-dark margin-top-3 text-normal font-12px">History</h3>
                    <AgreementHistoryPanel agreementId={agreement.id} />
                </div>
                <div
                    className="grid-col-6 padding-left-2"
                    data-cy="details-right-col"
                >
                    {/* // NOTE: Right Column */}
                    <dl className="margin-0 font-12px">
                        <dt className="margin-0 text-base-dark margin-top-3">Agreement Type</dt>
                        <dd className="margin-0 margin-top-1">
                            <Tag
                                tagStyle="primaryDarkTextLightBackground"
                                text={convertCodeForDisplay("agreementType", agreement?.agreement_type)}
                            />
                        </dd>
                        <dt className="margin-0 text-base-dark margin-top-3">Product Service Code</dt>
                        <dd className="margin-0 margin-top-1">
                            <Tag
                                tagStyle="primaryDarkTextLightBackground"
                                text={
                                    agreement?.product_service_code?.name
                                        ? agreement.product_service_code.name
                                        : missingValueText
                                }
                            />
                        </dd>
                    </dl>
                    <div className="display-flex">
                        <dl className="grid-col-4 margin-0 font-12px">
                            <dt className="margin-0 text-base-dark margin-top-3">NAICS Code</dt>
                            <dd className="margin-0 margin-top-1">
                                <Tag
                                    tagStyle="primaryDarkTextLightBackground"
                                    text={
                                        agreement?.product_service_code?.naics
                                            ? `${agreement.product_service_code.naics}`
                                            : missingValueText
                                    }
                                />
                            </dd>
                        </dl>
                        <dl className="grid-col-4 margin-0 margin-left-2 font-12px">
                            <dt className="margin-0 text-base-dark margin-top-3">Program Support Code</dt>
                            <dd className="margin-0 margin-top-1">
                                <Tag
                                    tagStyle="primaryDarkTextLightBackground"
                                    text={
                                        agreement?.product_service_code?.support_code
                                            ? agreement?.product_service_code?.support_code
                                            : missingValueText
                                    }
                                />
                            </dd>
                        </dl>
                    </div>
                    <dl className="margin-0 font-12px">
                        <dt className="margin-0 text-base-dark margin-top-3">Procurement Shop</dt>
                        <dd className="margin-0 margin-top-1">
                            <Tag
                                tagStyle="primaryDarkTextLightBackground"
                                text={`${agreement?.procurement_shop?.abbr} - Fee Rate: ${
                                    agreement?.procurement_shop?.fee * 100
                                }%`}
                            />
                        </dd>
                    </dl>
                    <div className="display-flex">
                        <dl className="grid-col-4 margin-0 font-12px">
                            <dt className="margin-0 text-base-dark margin-top-3">Agreement Reason</dt>
                            <dd className="margin-0 margin-top-1">
                                <Tag
                                    tagStyle="primaryDarkTextLightBackground"
                                    text={
                                        agreement?.agreement_reason
                                            ? convertCodeForDisplay("agreementReason", agreement?.agreement_reason)
                                            : missingValueText
                                    }
                                />
                            </dd>
                        </dl>
                        {agreement?.incumbent && (
                            <dl className="grid-col-4 margin-0 margin-left-2 font-12px">
                                <dt className="margin-0 text-base-dark margin-top-3">Incumbent</dt>
                                <dd className="margin-0 margin-top-1">
                                    <Tag
                                        tagStyle="primaryDarkTextLightBackground"
                                        text={agreement?.incumbent}
                                    />
                                </dd>
                            </dl>
                        )}
                    </div>
                    <dl className="margin-0 font-12px">
                        <dt className="margin-0 text-base-dark margin-top-3">Project Officer</dt>
                        <dd className="margin-0 margin-top-1">
                            <Tag
                                tagStyle="primaryDarkTextLightBackground"
                                text={
                                    projectOfficer && Object.keys(projectOfficer).length !== 0
                                        ? projectOfficer?.full_name
                                        : missingValueText
                                }
                            />
                        </dd>
                    </dl>
                    <dl className="margin-0 font-12px">
                        <dt className="margin-0 text-base-dark margin-top-3">Team Members</dt>
                        {agreement?.team_members?.length > 0 ? (
                            <>
                                {agreement?.team_members.map((member) => (
                                    <dd
                                        key={member.id}
                                        className="margin-0 margin-top-1 margin-bottom-2"
                                    >
                                        <Tag
                                            tagStyle="primaryDarkTextLightBackground"
                                            text={member.full_name}
                                        />
                                    </dd>
                                ))}
                            </>
                        ) : (
                            <dd className="margin-0 margin-top-1 margin-bottom-2">
                                <Tag
                                    tagStyle="primaryDarkTextLightBackground"
                                    text={missingValueText}
                                />
                            </dd>
                        )}
                    </dl>
                </div>
            </div>
        </section>
    );
};

AgreementDetailsView.propTypes = {
    agreement: PropTypes.object.isRequired,
    projectOfficer: PropTypes.object
};

export default AgreementDetailsView;
