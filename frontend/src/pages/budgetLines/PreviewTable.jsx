import { useEffect, useState, Fragment } from "react";
import { useDispatch, useSelector } from "react-redux";
import Tag from "../../components/UI/Tag/Tag";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { faClock } from "@fortawesome/free-regular-svg-icons";

export const PreviewTable = ({ budgetLines }) => {
    const dispatch = useDispatch();
    const budgetLinesAdded = useSelector((state) => state.createBudgetLine.budget_lines_added);
    const loggedInUser = useSelector((state) => state.auth.activeUser.full_name);

    const TableRow = ({ bl }) => {
        const [isExpanded, setIsExpanded] = useState(false);
        const [isRowActive, setIsRowActive] = useState(false);
        // create function to format date like this 9/30/2023 || MM/DD/YYYY
        const formatDate = (date) => {
            return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
        };
        let today = new Date();
        const formatted_today = formatDate(today);
        let date_needed = new Date(bl.date_needed);
        const formatted_date_needed = formatDate(date_needed);
        // FY will automate based on the Need by Date. Anything after September 30th rolls over into the next FY.
        let month = date_needed.getMonth();
        let year = date_needed.getFullYear();
        let fiscalYear = month > 8 ? year + 1 : year;
        let feeTotal = bl.amount * (bl.psc_fee_amount / 10);
        let total = bl.amount + feeTotal;
        let status = bl.status.charAt(0).toUpperCase() + bl.status.slice(1).toLowerCase();
        // Format the amounts like this $500,000.00 || $1,000,000.00 to allow for commas
        let formattedAmount = `$${bl.amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")}`;
        let formattedFeeTotal = `$${feeTotal.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")}`;
        let formattedTotal = `$${total.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")}`;

        const handleExpandRow = () => {
            setIsExpanded(!isExpanded);
            setIsRowActive(true);
        };
        return (
            <Fragment key={bl.id}>
                <tr onMouseEnter={() => setIsRowActive(true)} onMouseLeave={() => !isExpanded && setIsRowActive(false)}>
                    <th scope="row" style={{ backgroundColor: isRowActive && "#F0F0F0" }}>
                        {bl.line_description}
                    </th>
                    <td style={{ backgroundColor: isRowActive && "#F0F0F0" }}>{formatted_date_needed}</td>
                    <td style={{ backgroundColor: isRowActive && "#F0F0F0" }}>{fiscalYear}</td>
                    <td style={{ backgroundColor: isRowActive && "#F0F0F0" }}>{bl.can_number}</td>
                    <td style={{ backgroundColor: isRowActive && "#F0F0F0" }}>{formattedAmount}</td>
                    <td style={{ backgroundColor: isRowActive && "#F0F0F0" }}>
                        {feeTotal === 0 ? 0 : formattedFeeTotal}
                    </td>
                    <td style={{ backgroundColor: isRowActive && "#F0F0F0" }}>{total === 0 ? 0 : formattedTotal}</td>
                    <td style={{ backgroundColor: isRowActive && "#F0F0F0" }}>
                        <Tag text={status} className="bg-brand-neutral-lighter padding-x-105 padding-y-1" />
                    </td>
                    <td style={{ backgroundColor: isRowActive && "#F0F0F0" }}>
                        <FontAwesomeIcon
                            icon={isExpanded ? faChevronDown : faChevronUp}
                            className="height-2 width-2 padding-right-1 hover: cursor-pointer"
                            onClick={() => handleExpandRow(bl)}
                        />
                    </td>
                </tr>

                {isExpanded && (
                    <tr className="border-top-0">
                        <td colSpan="9" style={{ backgroundColor: "#F0F0F0" }}>
                            <div className="display-flex">
                                <dl className="font-12px">
                                    <dt className="margin-0 text-base-dark">Created By</dt>
                                    {/* TODO: Get logged in user's full name */}
                                    <dd className="margin-0">
                                        {loggedInUser === "(no name) (no name)" ? "Sheila Celentano" : loggedInUser}
                                    </dd>
                                    <dt className="margin-0 text-base-dark display-flex flex-align-center margin-top-2">
                                        <FontAwesomeIcon icon={faClock} className="height-2 width-2 margin-right-1" />
                                        {formatted_today}
                                    </dt>
                                </dl>
                                <dl className="font-12px" style={{ marginLeft: "9.0625rem" }}>
                                    <dt className="margin-0 text-base-dark">Notes</dt>
                                    <dd className="margin-0" style={{ maxWidth: "400px" }}>
                                        {bl.comments}
                                    </dd>
                                </dl>
                            </div>
                        </td>
                    </tr>
                )}
            </Fragment>
        );
    };

    return (
        <table className="usa-table usa-table--borderless width-full">
            <thead>
                <tr>
                    <th scope="col">Description</th>
                    <th scope="col">Need By</th>
                    <th scope="col">FY</th>
                    <th scope="col">CAN</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Fee</th>
                    <th scope="col">Total</th>
                    <th scope="col">Status</th>
                </tr>
            </thead>
            <tbody>
                {budgetLinesAdded.map((bl) => (
                    <TableRow key={bl.id} bl={bl} />
                ))}
            </tbody>
        </table>
    );
};
