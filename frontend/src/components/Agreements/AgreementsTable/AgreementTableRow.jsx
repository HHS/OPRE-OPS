import { Fragment, useState } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import CurrencyFormat from "react-currency-format";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { faClock } from "@fortawesome/free-regular-svg-icons";
import { convertCodeForDisplay } from "../../../helpers/utils";
import TableTag from "../../UI/TableTag";
import icons from "../../../uswds/img/sprite.svg";
import ConfirmationModal from "../../UI/Modals/ConfirmationModal";
import useGetUserFullNameFromId from "../../../helpers/user-hooks";
import { useIsUserAllowedToEditAgreement } from "../../../helpers/agreement-hooks";
import { DISABLED_ICON_CLASSES } from "../../../constants";
import { useAgreementApproval, useHandleEditAgreement, useHandleDeleteAgreement } from "./agreements-table.hooks";
import {
    getAgreementName,
    getResearchProjectName,
    getAgreementSubTotal,
    getProcurementShopSubTotal,
    findMinDateNeeded,
    getAgreementNotes,
    getAgreementCreatedDate,
    getAgreementStatus,
    areAllBudgetLinesInStatus,
    isThereAnyBudgetLines
} from "./AgreementsTable.helpers";

/**
 * Renders a row in the agreements table.
 *
 * @param {Object} props - The component props.
 * @param {Object} props.agreement - The agreement object to display.
 * @returns {React.JSX.Element} - The rendered component.
 */
export const AgreementTableRow = ({ agreement }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isRowActive, setIsRowActive] = useState(false);

    const agreementName = getAgreementName(agreement);
    const researchProjectName = getResearchProjectName(agreement);
    const agreementType = convertCodeForDisplay("agreementType", agreement?.agreement_type);
    const agreementSubTotal = getAgreementSubTotal(agreement);
    const procurementShopSubTotal = getProcurementShopSubTotal(agreement);
    const agreementTotal = agreementSubTotal + procurementShopSubTotal;
    const nextNeedBy = findMinDateNeeded(agreement);
    const agreementCreatedByName = useGetUserFullNameFromId(agreement?.created_by);
    const agreementNotes = getAgreementNotes(agreement);
    const agreementCreatedOn = getAgreementCreatedDate(agreement);
    const agreementStatus = getAgreementStatus(agreement);

    // row stuff
    const handleExpandRow = () => {
        setIsExpanded(!isExpanded);
        setIsRowActive(true);
    };
    // styles for the expanded row
    const removeBorderBottomIfExpanded = isExpanded ? "border-bottom-none" : "";
    const changeBgColorIfExpanded = { backgroundColor: isRowActive ? "var(--neutral-lightest)" : "" };
    // Validations for deleting an agreement
    const canUserEditAgreement = useIsUserAllowedToEditAgreement(agreement?.id);
    const areAllBudgetLinesInDraftStatus = areAllBudgetLinesInStatus(agreement, "DRAFT");
    const areThereAnyBudgetLines = isThereAnyBudgetLines(agreement);
    const canUserDeleteAgreement = canUserEditAgreement && (areAllBudgetLinesInDraftStatus || !areThereAnyBudgetLines);
    // hooks
    const handleSubmitAgreementForApproval = useAgreementApproval();
    const handleEditAgreement = useHandleEditAgreement();
    const { handleDeleteAgreement, modalProps, setShowModal, showModal } = useHandleDeleteAgreement();

    /**
     * Renders the edit, delete, and submit for approval icons.
     *
     * @param {Object} props - The component props.
     * @param {Object} props.agreement - The agreement object to display.
     * @param {string} props.status - The status of the agreement.
     * @returns {React.JSX.Element} - The rendered component.
     */
    const ChangeIcons = ({ agreement, status }) => {
        return (
            <>
                {(status === "Draft" || status === "In Review") && (
                    <div className="display-flex flex-align-center">
                        <FontAwesomeIcon
                            icon={faPen}
                            title={`${canUserEditAgreement ? "edit" : "user does not have permissions to edit"}`}
                            className={`text-primary height-2 width-2 margin-right-1 cursor-pointer usa-tooltip ${
                                !canUserEditAgreement ? DISABLED_ICON_CLASSES : null
                            }`}
                            data-position="top"
                            onClick={() => canUserEditAgreement && handleEditAgreement(agreement.id)}
                        />

                        <FontAwesomeIcon
                            icon={faTrash}
                            title={`${canUserDeleteAgreement ? "delete" : "user does not have permissions to delete"}`}
                            data-position="top"
                            className={`text-primary height-2 width-2 margin-right-1 cursor-pointer usa-tooltip ${
                                !canUserDeleteAgreement ? DISABLED_ICON_CLASSES : null
                            }`}
                            onClick={() => canUserDeleteAgreement && handleDeleteAgreement(agreement.id, agreementName)}
                            data-cy="delete-agreement"
                        />

                        <svg
                            className="usa-icon text-primary height-205 width-205 cursor-pointer usa-tooltip"
                            onClick={() => handleSubmitAgreementForApproval(agreement.id)}
                            id={`submit-for-approval-${agreement.id}`}
                        >
                            <use xlinkHref={`${icons}#send`}></use>
                        </svg>
                    </div>
                )}
            </>
        );
    };
    return (
        <Fragment key={agreement?.id}>
            {showModal && (
                <ConfirmationModal
                    heading={modalProps.heading}
                    setShowModal={setShowModal}
                    actionButtonText={modalProps.actionButtonText}
                    handleConfirm={modalProps.handleConfirm}
                />
            )}
            <tr
                onMouseEnter={() => setIsRowActive(true)}
                onMouseLeave={() => !isExpanded && setIsRowActive(false)}
            >
                <th
                    scope="row"
                    className={removeBorderBottomIfExpanded}
                    style={changeBgColorIfExpanded}
                >
                    <Link
                        className="text-ink text-no-underline"
                        to={"/agreements/" + agreement.id}
                    >
                        {agreementName}
                    </Link>
                </th>
                <td
                    className={removeBorderBottomIfExpanded}
                    style={changeBgColorIfExpanded}
                >
                    {researchProjectName}
                </td>
                <td
                    className={removeBorderBottomIfExpanded}
                    style={changeBgColorIfExpanded}
                >
                    {agreementType || ""}
                </td>
                <td
                    className={removeBorderBottomIfExpanded}
                    style={changeBgColorIfExpanded}
                >
                    <CurrencyFormat
                        value={agreementTotal}
                        displayType={"text"}
                        thousandSeparator={true}
                        prefix={"$"}
                        decimalScale={2}
                        fixedDecimalScale={true}
                        renderText={(value) => value}
                    />
                </td>
                <td
                    className={removeBorderBottomIfExpanded}
                    style={changeBgColorIfExpanded}
                >
                    {nextNeedBy}
                </td>
                <td
                    className={removeBorderBottomIfExpanded}
                    style={changeBgColorIfExpanded}
                >
                    {isRowActive && !isExpanded ? (
                        <div>
                            <ChangeIcons
                                agreement={agreement}
                                status={agreementStatus}
                            />
                        </div>
                    ) : (
                        <TableTag status={agreementStatus} />
                    )}
                </td>
                <td
                    className={removeBorderBottomIfExpanded}
                    style={changeBgColorIfExpanded}
                >
                    <FontAwesomeIcon
                        icon={isExpanded ? faChevronUp : faChevronDown}
                        className="height-2 width-2 padding-right-1 cursor-pointer"
                        onClick={() => handleExpandRow()}
                        data-cy="expand-row"
                    />
                </td>
            </tr>

            {isExpanded && (
                <tr>
                    <td
                        colSpan={9}
                        className="border-top-none"
                        style={{ backgroundColor: "var(--neutral-lightest)" }}
                    >
                        <div className="display-flex padding-right-9">
                            <dl className="font-12px">
                                <dt className="margin-0 text-base-dark">Created By</dt>
                                <dd className="margin-0">{agreementCreatedByName}</dd>
                                <dt className="margin-0 text-base-dark display-flex flex-align-center margin-top-2">
                                    <FontAwesomeIcon
                                        icon={faClock}
                                        className="height-2 width-2 margin-right-1"
                                    />
                                    {agreementCreatedOn}
                                </dt>
                            </dl>
                            <dl
                                className="font-12px"
                                style={{ marginLeft: "9.0625rem" }}
                            >
                                <dt className="margin-0 text-base-dark">Notes</dt>
                                <dd
                                    className="margin-0"
                                    style={{ maxWidth: "400px" }}
                                >
                                    {agreementNotes ? agreementNotes : "No notes added."}
                                </dd>
                            </dl>
                            <div className="flex-align-self-end margin-left-auto margin-bottom-1">
                                <ChangeIcons
                                    agreement={agreement}
                                    status={agreementStatus}
                                />
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </Fragment>
    );
};

AgreementTableRow.propTypes = {
    agreement: PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        research_project: PropTypes.shape({
            title: PropTypes.string.isRequired
        }),
        agreement_type: PropTypes.string.isRequired,
        budget_line_items: PropTypes.arrayOf(
            PropTypes.shape({
                amount: PropTypes.number.isRequired,
                date_needed: PropTypes.string.isRequired,
                status: PropTypes.string.isRequired
            })
        ).isRequired,
        procurement_shop: PropTypes.shape({
            fee: PropTypes.number.isRequired
        }),
        created_by: PropTypes.number.isRequired,
        notes: PropTypes.string,
        created_on: PropTypes.string,
        project_officer: PropTypes.number.isRequired,
        team_members: PropTypes.arrayOf(
            PropTypes.shape({
                id: PropTypes.number.isRequired
            })
        ).isRequired
    }).isRequired
};

export default AgreementTableRow;
