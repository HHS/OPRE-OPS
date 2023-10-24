import Accordion from "../../UI/Accordion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSubtract, faAdd } from "@fortawesome/free-solid-svg-icons";
import CurrencyFormat from "react-currency-format";
import { getDecimalScale } from "../../../helpers/currencyFormat.helpers";
import SummaryCard from "../../UI/SummaryCard";
import styles from "./small-summary-card.module.css";

function AgreementChangesAccordion({ children, changeInBudgetLines, changeInCans }) {
    const handleTerm = (term) => (term === 1 ? `${term} Year` : `${term} Years`);
    const cardStyles = `padding-y-205 padding-x-2 display-inline-block ${styles.card}`;

    return (
        <Accordion heading="Review Changes">
            <p>Review the changes below to confirm what you are sending for approval.</p>
            <div
                className="display-flex flex-wrap"
                style={{ gap: "32px 32px" }}
            >
                <SummaryCard
                    title="Agreement Total"
                    className={cardStyles}
                >
                    <p className={`text-bold ${styles.font20}`}>
                        <FontAwesomeIcon
                            icon={faAdd}
                            className="text-ink height-2 width-2 margin-right-1 usa-tooltip"
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
                        >
                            <p className={`text-bold ${styles.font20}`}>
                                <FontAwesomeIcon
                                    icon={faSubtract}
                                    className="text-ink height-2 width-2 margin-right-1 usa-tooltip"
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
            {children}
        </Accordion>
    );
}

export default AgreementChangesAccordion;
