import { Fragment, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CurrencyFormat from "react-currency-format";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { faClock } from "@fortawesome/free-regular-svg-icons";
import "./AgreementsList.scss";
import { getUser } from "../../../api/getUser";
import icons from "../../../uswds/img/sprite.svg";
import { convertCodeForDisplay, formatDate } from "../../../helpers/utils";
import TableTag from "../../../components/UI/PreviewTable/TableTag";

export const AgreementTableRow = ({ agreement }) => {
    const [user, setUser] = useState({});
    const navigate = useNavigate();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isRowActive, setIsRowActive] = useState(false);

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
    const changeBgColorIfExpanded = { backgroundColor: isRowActive && "#F0F0F0" };

    const handleEditAgreement = (event) => {
        navigate(`/agreements/edit/${event}?mode=edit`);
    };
    const handleDeleteAgreement = () => {
        // TODO: implement delete agreement
        alert("not implemented yet");
    };
    const handleSubmitAgreementForApproval = (event) => {
        navigate(`/agreements/approve/${event}`);
    };

    const ChangeIcons = ({ agreement }) => {
        return (
            <>
                <div className="display-flex flex-align-center">
                    {(agreement.status === "DRAFT" || agreement.status === "UNDER_REVIEW") && (
                        <FontAwesomeIcon
                            icon={faPen}
                            className="text-primary height-2 width-2 margin-right-1 hover: cursor-pointer usa-tooltip"
                            title="edit"
                            data-position="top"
                            onClick={() => handleEditAgreement(agreement.id)}
                        />
                    )}
                    <FontAwesomeIcon
                        icon={faTrash}
                        title="delete"
                        data-position="top"
                        className="text-primary height-2 width-2 margin-right-1 hover: cursor-pointer usa-tooltip"
                        onClick={() => handleDeleteAgreement(agreement.id)}
                    />

                    {(agreement.status === "DRAFT" || agreement.status === "UNDER_REVIEW") && (
                        <svg
                            className="usa-icon text-primary height-205 width-205 hover: cursor-pointer usa-tooltip"
                            onClick={() => handleSubmitAgreementForApproval(agreement.id)}
                            id={`submit-for-approval-${agreement.id}`}
                        >
                            <use xlinkHref={`${icons}#send`}></use>
                        </svg>
                    )}
                </div>
            </>
        );
    };
    return (
        <Fragment key={agreement?.id}>
            <tr onMouseEnter={() => setIsRowActive(true)} onMouseLeave={() => !isExpanded && setIsRowActive(false)}>
                <th scope="row" className={removeBorderBottomIfExpanded} style={changeBgColorIfExpanded}>
                    {agreementName}
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
                            <ChangeIcons agreement={agreement} />
                        </div>
                    ) : (
                        <TableTag status={agreement?.status} />
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
