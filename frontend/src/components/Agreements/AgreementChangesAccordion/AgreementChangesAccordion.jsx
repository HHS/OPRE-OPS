import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSubtract, faAdd } from "@fortawesome/free-solid-svg-icons";
import CurrencyFormat from "react-currency-format";
import Accordion from "../../UI/Accordion";
import { getDecimalScale } from "../../../helpers/currencyFormat.helpers";
import SummaryCard from "../../UI/SummaryCard";
import styles from "./small-summary-card.module.css";

// NOTE: This component is not currently being used in the application.

/**
 * Renders an accordion component to review changes in an agreement.
 * @component
 * @param {Object} props - The component props.
 * @param {React.ReactNode} [props.children] - The child components to be rendered inside the accordion.
 * @param {number} props.changeInBudgetLines - The change in budget lines.
 * @param {Array<any>} props.changeInCans - The changes in cans.
 * @returns {JSX.Element} - The AgreementChangesAccordion component.
 */
const AgreementChangesAccordion = ({ children, changeInBudgetLines, changeInCans }) => {
    /**
     * Returns a string representing the term in years.
     * @param {number} term - The term in years.
     * @returns {string} - The term in years as a string.
     */
    const handleTerm = (term) => (term === 1 ? `${term} Year` : `${term} Years`);
    const cardStyles = `padding-y-205 padding-x-2 display-inline-block ${styles.card}`;

    return (
        <Accordion
            heading="Review Changes"
            level={2}
        >
            <p>Review the changes below to confirm what you are sending for approval.</p>
            <div
                className="display-flex flex-wrap"
                style={{ gap: "32px 32px" }}
            >
                <SummaryCard
                    title="Agreement Total"
                    className={cardStyles}
                    dataCy="agreement-total-card"
                >
                    <p className={`text-bold ${styles.font20}`}>
                        <FontAwesomeIcon
                            icon={faAdd}
                            className="text-ink height-2 width-2 margin-right-1"
                        />
                        <CurrencyFormat
                            value={changeInBudgetLines || 0}
                            displayType={"text"}
                            thousandSeparator={true}
                            prefix={"$"}
                            decimalScale={getDecimalScale(changeInBudgetLines)}
                            fixedDecimalScale={true}
                        />
                    </p>
                </SummaryCard>
                {changeInCans.length > 0 &&
                    changeInCans.map(({ canNumber, amount, term }) => (
                        <SummaryCard
                            key={canNumber}
                            title={`CAN ${canNumber} (${handleTerm(term)})`}
                            className={cardStyles}
                            dataCy={`can-total-card-${canNumber}`}
                        >
                            <p className={`text-bold ${styles.font20}`}>
                                <FontAwesomeIcon
                                    icon={faSubtract}
                                    className="text-ink height-2 width-2 margin-right-1"
                                />
                                <CurrencyFormat
                                    value={amount || 0}
                                    displayType={"text"}
                                    thousandSeparator={true}
                                    prefix={"$"}
                                    decimalScale={getDecimalScale(amount)}
                                    fixedDecimalScale={true}
                                />
                            </p>
                        </SummaryCard>
                    ))}
            </div>
            {children && children}
        </Accordion>
    );
};

AgreementChangesAccordion.propTypes = {
    children: PropTypes.node,
    changeInBudgetLines: PropTypes.number,
    changeInCans: PropTypes.arrayOf(
        PropTypes.shape({
            canNumber: PropTypes.string,
            amount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
            term: PropTypes.number
        })
    )
};
export default AgreementChangesAccordion;
