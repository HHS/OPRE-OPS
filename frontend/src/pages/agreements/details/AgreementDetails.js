import { Link } from "react-router-dom";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import AgreementTotalBudgetLinesCard from "../../../components/Agreements/AgreementDetailsCards/AgreementTotalBudgetLinesCard";
import AgreementValuesCard from "../../../components/Agreements/AgreementDetailsCards/AgreementValuesCard";
import { convertCodeForDisplay } from "../../../helpers/utils";
import Tag from "../../../components/UI/Tag/Tag";
import { notesData } from "./data";
import ListItem from "../../../components/UI/ListItem";

const AgreementDetails = ({ agreement, projectOfficer }) => {
    // eslint-disable-next-line no-unused-vars
    let { budget_line_items: _, ...agreement_details } = agreement;
    const missingValueText = "TBD";
    // details for AgreementTotalBudgetLinesCard
    const blis = agreement.budget_line_items ? agreement.budget_line_items : [];
    const numberOfAgreements = blis.length;
    const countsByStatus = blis.reduce((p, c) => {
        const status = c.status;
        if (!(status in p)) {
            p[status] = 0;
        }
        p[status]++;
        return p;
    }, {});

    return (
        <div>
            <div className="display-flex flex-justify flex-align-center">
                <h2 className="font-sans-lg">Agreement Summary</h2>

                <Link to={"/agreements/edit/" + agreement.id + "?mode=edit"}>
                    <FontAwesomeIcon
                        icon={faPen}
                        className="text-primary height-2 width-2 margin-right-1 hover: cursor-pointer usa-tooltip"
                        title="edit"
                        data-position="top"
                    />
                    <span className="text-primary">Edit</span>
                </Link>
            </div>
            <p className="font-sans-sm">The summary below shows the budget lines and spending for this agreement.</p>
            <div className="display-flex flex-justify">
                <AgreementTotalBudgetLinesCard
                    numberOfAgreements={numberOfAgreements}
                    countsByStatus={countsByStatus}
                />
                <AgreementValuesCard />
            </div>
            <section>
                <h2 className="font-sans-lg">Agreement Details</h2>

                <div className="grid-row margin-top-2">
                    <div className="grid-col-6 padding-right-1" data-cy="details-left-col">
                        {/* NOTE: Left Column */}
                        <dl className="margin-0 font-12px">
                            <dt className="margin-0 text-base-dark margin-top-3">Description</dt>
                            <dd className="margin-0 margin-top-05">
                                {agreement?.description ? agreement.description : missingValueText}
                            </dd>
                        </dl>
                        <h3 className="text-base-dark margin-top-3 text-normal font-12px">Notes</h3>
                        <ul className="usa-list--unstyled overflow-y-scroll" style={{ height: "11.375rem" }}>
                            {/* // TODO: Replace with real data */}
                            {notesData.map((note) => (
                                <ListItem
                                    key={note.id}
                                    title={note.created_by}
                                    createdOn={note.created_on}
                                    message={note.message}
                                    variant="condensed"
                                />
                            ))}
                        </ul>
                        <dl className="margin-0 font-12px">
                            <dt className="margin-0 text-base-dark margin-top-3">History</dt>
                            <dd className="text-semibold margin-0 margin-top-05">TODO</dd>
                        </dl>
                    </div>
                    <div className="grid-col-6" data-cy="details-right-col">
                        {/* NOTE: Right Column */}
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
                                                ? agreement.product_service_code.naics
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
                                        <Tag tagStyle="primaryDarkTextLightBackground" text={agreement?.incumbent} />
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
                                        <dd key={member.id} className="margin-0 margin-top-1 margin-bottom-2">
                                            <Tag tagStyle="primaryDarkTextLightBackground" text={member.full_name} />
                                        </dd>
                                    ))}
                                </>
                            ) : (
                                <dd className="margin-0 margin-top-1 margin-bottom-2">
                                    <Tag tagStyle="primaryDarkTextLightBackground" text={missingValueText} />
                                </dd>
                            )}
                        </dl>
                    </div>
                </div>
            </section>

            <div style={{ background: "#cccccc", border: "1px dashed #999999" }}>
                <h2>TEMP DEBUG</h2>
                <pre>{JSON.stringify(countsByStatus, null, 2)}</pre>
                <pre>{JSON.stringify(projectOfficer, null, 2)}</pre>
                <pre>{JSON.stringify(agreement_details, null, 2)}</pre>
            </div>
        </div>
    );
};

export default AgreementDetails;
