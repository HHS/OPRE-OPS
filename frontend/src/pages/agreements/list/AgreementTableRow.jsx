import { Fragment, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { useDispatch } from "react-redux";
import CurrencyFormat from "react-currency-format";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { faClock } from "@fortawesome/free-regular-svg-icons";
import "./AgreementsList.scss";
import { getUser } from "../../../api/getUser";
import icons from "../../../uswds/img/sprite.svg";
import { convertCodeForDisplay, formatDate } from "../../../helpers/utils";
import TableTag from "../../../components/UI/PreviewTable/TableTag";
import { useDeleteAgreementMutation } from "../../../api/opsAPI";
import Modal from "../../../components/UI/Modal";
import { setAlert } from "../../../components/UI/Alert/alertSlice";

/**
 * Renders a row in the agreements table.
 *
 * @param {Object} props - The component props.
 * @param {Object} props.agreement - The agreement object to display.
 * @returns {React.JSX.Element} - The rendered component.
 */
export const AgreementTableRow = ({ agreement }) => {
    const navigate = useNavigate();
    const globalDispatch = useDispatch();
    const [deleteAgreement] = useDeleteAgreementMutation();
    const [user, setUser] = useState({});
    const [isExpanded, setIsExpanded] = useState(false);
    const [isRowActive, setIsRowActive] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalProps, setModalProps] = useState({});

    const agreementName = agreement?.name;
    const researchProjectName = agreement?.research_project?.title;

    let agreementType;
    agreementType = convertCodeForDisplay("agreementType", agreement?.agreement_type);

    const agreementSubTotal = agreement?.budget_line_items?.reduce((n, { amount }) => n + amount, 0);
    const procurementShopSubTotal = agreement?.budget_line_items?.reduce(
        (n, { amount }) => n + amount * (agreement.procurement_shop ? agreement.procurement_shop.fee : 0),
        0
    );
    const agreementTotal = agreementSubTotal + procurementShopSubTotal;

    // find the min(date_needed) of the BLIs
    let nextNeedBy = agreement?.budget_line_items?.reduce(
        (n, { date_needed }) => (n < date_needed ? n : date_needed),
        0
    );

    nextNeedBy = nextNeedBy ? formatDate(new Date(nextNeedBy)) : "";

    useEffect(() => {
        const getUserAndSetState = async (id) => {
            const results = await getUser(id);
            setUser(results);
        };

        if (agreement?.created_by) {
            getUserAndSetState(agreement?.created_by).catch(console.error);
        } else {
            setUser({ full_name: "Sheila Celentano" });
        }

        return () => {
            setUser({});
        };
    }, [agreement]);

    const agreementCreatedBy = user?.full_name;
    const agreementNotes = agreement?.notes;
    const formatted_today = new Date().toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const agreementCreatedOn = agreement?.created_on
        ? new Date(agreement.created_on).toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric" })
        : formatted_today;

    const handleExpandRow = () => {
        setIsExpanded(!isExpanded);
        setIsRowActive(true);
    };

    const removeBorderBottomIfExpanded = isExpanded ? "border-bottom-none" : undefined;
    const changeBgColorIfExpanded = { backgroundColor: isRowActive ? "#F0F0F0" : undefined };

    const handleEditAgreement = (event) => {
        navigate(`/agreements/${event}?mode=edit`);
    };

    /**
     * Deletes an agreement.
     * @param {number} id - The id of the agreement to delete.
     * @returns {void}
     */
    const handleDeleteAgreement = (id) => {
        setShowModal(true);
        setModalProps({
            heading: "Are you sure you want to delete this agreement?",
            actionButtonText: "Delete",
            handleConfirm: () => {
                deleteAgreement(id)
                    .unwrap()
                    .then((fulfilled) => {
                        console.log(`DELETE agreement success: ${JSON.stringify(fulfilled, null, 2)}`);
                        globalDispatch(
                            setAlert({
                                type: "success",
                                heading: "Agreement deleted",
                                message: "The agreement has been successfully deleted.",
                            })
                        );
                    })
                    .catch((rejected) => {
                        console.error(`DELETE agreement rejected: ${JSON.stringify(rejected, null, 2)}`);
                        globalDispatch(
                            setAlert({
                                type: "error",
                                heading: "Error",
                                message: "An error occurred while deleting the agreement.",
                            })
                        );
                    });
            },
        });
    };
    const handleSubmitAgreementForApproval = (event) => {
        navigate(`/agreements/approve/${event}`);
    };

    const agreementStatus = agreement?.budget_line_items?.find((bli) => bli.status === "UNDER_REVIEW")
        ? "In Review"
        : "Draft";

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
                            className="text-primary height-2 width-2 margin-right-1 hover: cursor-pointer usa-tooltip"
                            title="edit"
                            data-position="top"
                            onClick={() => handleEditAgreement(agreement.id)}
                        />

                        <FontAwesomeIcon
                            icon={faTrash}
                            title="delete"
                            data-position="top"
                            className="text-primary height-2 width-2 margin-right-1 hover: cursor-pointer usa-tooltip"
                            onClick={() => handleDeleteAgreement(agreement.id)}
                        />

                        <svg
                            className="usa-icon text-primary height-205 width-205 hover: cursor-pointer usa-tooltip"
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
                <Modal
                    heading={modalProps.heading}
                    setShowModal={setShowModal}
                    actionButtonText={modalProps.actionButtonText}
                    handleConfirm={modalProps.handleConfirm}
                />
            )}
            <tr onMouseEnter={() => setIsRowActive(true)} onMouseLeave={() => !isExpanded && setIsRowActive(false)}>
                <th scope="row" className={removeBorderBottomIfExpanded} style={changeBgColorIfExpanded}>
                    <Link className="text-ink text-no-underline" to={"/agreements/" + agreement.id}>
                        {agreementName}
                    </Link>
                </th>
                <td className={removeBorderBottomIfExpanded} style={changeBgColorIfExpanded}>
                    {researchProjectName}
                </td>
                <td className={removeBorderBottomIfExpanded} style={changeBgColorIfExpanded}>
                    {agreementType || ""}
                </td>
                <td className={removeBorderBottomIfExpanded} style={changeBgColorIfExpanded}>
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
                <td className={removeBorderBottomIfExpanded} style={changeBgColorIfExpanded}>
                    {nextNeedBy}
                </td>
                <td className={removeBorderBottomIfExpanded} style={changeBgColorIfExpanded}>
                    {isRowActive && !isExpanded ? (
                        <div>
                            <ChangeIcons agreement={agreement} status={agreementStatus} />
                        </div>
                    ) : (
                        <TableTag status={agreementStatus} />
                    )}
                </td>
                <td className={removeBorderBottomIfExpanded} style={changeBgColorIfExpanded}>
                    <FontAwesomeIcon
                        icon={isExpanded ? faChevronUp : faChevronDown}
                        className="height-2 width-2 padding-right-1 hover: cursor-pointer"
                        onClick={() => handleExpandRow()}
                    />
                </td>
            </tr>

            {isExpanded && (
                <tr>
                    <td colSpan={9} className="border-top-none" style={{ backgroundColor: "#F0F0F0" }}>
                        <div className="display-flex padding-right-9">
                            <dl className="font-12px">
                                <dt className="margin-0 text-base-dark">Created By</dt>
                                <dd className="margin-0">{agreementCreatedBy}</dd>
                                <dt className="margin-0 text-base-dark display-flex flex-align-center margin-top-2">
                                    <FontAwesomeIcon icon={faClock} className="height-2 width-2 margin-right-1" />
                                    {agreementCreatedOn}
                                </dt>
                            </dl>
                            <dl className="font-12px" style={{ marginLeft: "9.0625rem" }}>
                                <dt className="margin-0 text-base-dark">Notes</dt>
                                <dd className="margin-0" style={{ maxWidth: "400px" }}>
                                    {agreementNotes ? agreementNotes : "No notes added."}
                                </dd>
                            </dl>
                            <div className="flex-align-self-end margin-left-auto margin-bottom-1">
                                <ChangeIcons agreement={agreement} />
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
            title: PropTypes.string.isRequired,
        }),
        agreement_type: PropTypes.string.isRequired,
        budget_line_items: PropTypes.arrayOf(
            PropTypes.shape({
                amount: PropTypes.number.isRequired,
                date_needed: PropTypes.string.isRequired,
                status: PropTypes.string.isRequired,
            })
        ).isRequired,
        procurement_shop: PropTypes.shape({
            fee: PropTypes.number.isRequired,
        }),
        created_by: PropTypes.number.isRequired,
        notes: PropTypes.string,
        created_on: PropTypes.string,
    }).isRequired,
};
