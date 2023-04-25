import { useState, Fragment } from "react";
import { useDispatch, useSelector } from "react-redux";
import CurrencyFormat from "react-currency-format";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { faClock, faClone } from "@fortawesome/free-regular-svg-icons";
import Tag from "../../../components/UI/Tag/Tag";
import "./AgreementsList.scss";
import { useGetAgreementsQuery } from "../../../api/agreementSlice";
import App from "../../../App";

export const AgreementsList = () => {
    const dispatch = useDispatch();
    // const agreements = useSelector((state) => state.globalState.agreements);
    const { data: agreements, error: errorAgreement, isLoading: isLoadingAgreement } = useGetAgreementsQuery();
    // const agreements = agreementsIsLoading ? null : agreementsData;
    // const sortedAgreements = agreements
    //     .slice()
    //     .sort((a, b) => Date.parse(a.created_on) - Date.parse(b.created_on))
    //     .reverse();

    const TableRow = ({ agreement }) => {
        const [isExpanded, setIsExpanded] = useState(false);
        const [isRowActive, setIsRowActive] = useState(false);

        const agreementName = agreement.name;
        const researchProjectName = "";
        const agreementType = agreement?.agreement_type;
        // const agreementTotal = agreement?.budget_line_items?.reduce((n, { amount }) => n + amount, 0);
        const agreementTotal = 0;
        const nextNeedBy = "09/30/23";
        const agreementStatus = "DRAFT";
        const agreementCreatedBy = "Sheila Celentano";
        const agreementCreatedOn = "May 9, 2022";
        const agreementDescription = agreement?.description;

        // function to format date like this 9/30/2023 || MM/DD/YYYY
        // const formatDate = (date) => {
        //     return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
        // };

        // const formatted_today = new Date().toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric" });
        // const bl_created_on = bl?.created_on
        //     ? new Date(bl.created_on).toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric" })
        //     : formatted_today;
        // let formatted_date_needed;
        // let fiscalYear;
        // if (bl?.date_needed !== "--") {
        //     let date_needed = new Date(bl?.date_needed);
        //     formatted_date_needed = formatDate(date_needed);
        //     // FY will automate based on the Need by Date. Anything after September 30th rolls over into the next FY.
        //     let month = date_needed.getMonth();
        //     let year = date_needed.getFullYear();
        //     fiscalYear = month > 8 ? year + 1 : year;
        // }
        // let feeTotal = bl?.amount * (bl?.psc_fee_amount / 100);
        // let total = bl?.amount + feeTotal;
        // let status = bl?.status.charAt(0).toUpperCase() + bl?.status.slice(1).toLowerCase();

        const handleExpandRow = () => {
            setIsExpanded(!isExpanded);
            setIsRowActive(true);
        };

        const handleEditAgreement = (event) => {};
        const handleDeleteAgreement = (event) => {};

        const TableTag = ({ status }) => {
            if (status === "In_execution") {
                status = "Executing";
            }
            let classNames = "padding-x-105 padding-y-1 ";
            switch (status) {
                case "Draft":
                    classNames += "bg-brand-neutral-lighter";
                    break;
                case "Executing":
                    classNames += "bg-brand-data-viz-primary-8";
                    break;
                case "Obligated":
                    classNames += "bg-brand-data-viz-primary-6 text-white";
                    break;
                case "Planned":
                    classNames += "bg-brand-data-viz-primary-11 text-white";
                    break;
                default:
            }
            return <Tag className={classNames} text={status} />;
        };

        const ChangeIcons = ({ agreement }) => {
            // const handleDuplicateBudgetLine = (budgetLine) => {
            //     dispatch(duplicateBudgetLineAdded({ ...budgetLine, created_by: loggedInUser }));
            // };
            return (
                <>
                    {agreements.status === "DRAFT" && (
                        <>
                            <FontAwesomeIcon
                                icon={faPen}
                                className="text-primary height-2 width-2 margin-right-1 hover: cursor-pointer usa-tooltip"
                                title="edit"
                                data-position="top"
                                onClick={() => dispatch(handleEditAgreement(agreement.id))}
                            />
                            <FontAwesomeIcon
                                icon={faTrash}
                                title="delete"
                                data-position="top"
                                className="text-primary height-2 width-2 margin-right-1 hover: cursor-pointer usa-tooltip"
                                onClick={() => handleDeleteAgreement(agreement.id)}
                            />
                        </>
                    )}
                    {/*<FontAwesomeIcon*/}
                    {/*    icon={faClone}*/}
                    {/*    title="duplicate"*/}
                    {/*    data-position="top"*/}
                    {/*    className={`text-primary height-2 width-2 hover: cursor-pointer usa-tooltip ${*/}
                    {/*        budgetLine.status !== "DRAFT" ? "margin-left-6" : ""*/}
                    {/*    }`}*/}
                    {/*    onClick={() => handleDuplicateBudgetLine(budgetLine)}*/}
                    {/*/>*/}
                </>
            );
        };
        return (
            <Fragment key={agreement?.id}>
                <tr onMouseEnter={() => setIsRowActive(true)} onMouseLeave={() => !isExpanded && setIsRowActive(false)}>
                    <th scope="row" style={{ backgroundColor: isRowActive && "#F0F0F0" }}>
                        {agreementName}
                    </th>
                    <td style={{ backgroundColor: isRowActive && "#F0F0F0" }}>{researchProjectName}</td>
                    <td style={{ backgroundColor: isRowActive && "#F0F0F0" }}>{agreementType || ""}</td>
                    <td style={{ backgroundColor: isRowActive && "#F0F0F0" }}>
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
                    <td style={{ backgroundColor: isRowActive && "#F0F0F0" }}>{nextNeedBy}</td>
                    <td style={{ backgroundColor: isRowActive && "#F0F0F0" }}>
                        {isRowActive && !isExpanded ? (
                            <div>
                                <ChangeIcons agreement={agreement} />
                            </div>
                        ) : (
                            <TableTag status={agreementStatus} />
                        )}
                    </td>
                    <td style={{ backgroundColor: isRowActive && "#F0F0F0" }}>
                        <FontAwesomeIcon
                            icon={isExpanded ? faChevronUp : faChevronDown}
                            className="height-2 width-2 padding-right-1 hover: cursor-pointer"
                            onClick={() => handleExpandRow()}
                        />
                    </td>
                </tr>

                {isExpanded && (
                    <tr className="border-top-0">
                        <td colSpan="9" style={{ backgroundColor: "#F0F0F0" }}>
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
                                        {agreementDescription ? agreementDescription : "No notes added."}
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

    if (isLoadingAgreement) {
        return <div>Loading...</div>;
    }
    if (errorAgreement) {
        return <div>Oops, an error occured</div>;
    }

    return (
        <App>
            <h1 className="font-sans-lg">Agreements</h1>
            <h2 className="font-sans-md">Test explaining this page.</h2>

            <table className="usa-table usa-table--borderless width-full">
                <thead>
                    <tr>
                        <th scope="col">Agreement</th>
                        <th scope="col">Project</th>
                        <th scope="col">Type</th>
                        <th scope="col">Agreement Total</th>
                        <th scope="col">Next Need By</th>
                        <th scope="col" className="padding-0" style={{ width: "6.25rem" }}>
                            Status
                        </th>
                    </tr>
                </thead>
                {console.log("agreements", agreements)}
                <tbody>
                    {agreements?.map((agreement) => (
                        <TableRow key={agreement?.id} agreement={agreement} />
                    ))}
                </tbody>
            </table>
        </App>
    );
};
