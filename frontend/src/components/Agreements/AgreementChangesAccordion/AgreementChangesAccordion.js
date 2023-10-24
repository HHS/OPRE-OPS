import Accordion from "../../UI/Accordion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSubtract, faAdd } from "@fortawesome/free-solid-svg-icons";
import CurrencyFormat from "react-currency-format";
import { getDecimalScale } from "../../../helpers/currencyFormat.helpers";
import SummaryCard from "../../UI/SummaryCard";

function AgreementChangesAccordion({ children, changeInBudgetLines, changeInCans }) {
    const handleTerm = (term) => (term === 1 ? `${term} Year` : `${term} Years`);
    return (
        <Accordion heading="Review Changes">
            <p>Review the changes below to confirm what you are sending for approval.</p>
            <SummaryCard title="Agreement Total">
                <p className="text-bold">
                    <FontAwesomeIcon
                        icon={faAdd}
                        className="text-ink height-2 width-2 margin-right-1  usa-tooltip"
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
                        title={`CAN ${canNumber} - ${handleTerm(term)}`}
                    >
                        <p className="text-bold">
                            <FontAwesomeIcon
                                icon={faSubtract}
                                className="text-ink height-2 width-2 margin-right-1  usa-tooltip"
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
            {children}
        </Accordion>
    );
}

export default AgreementChangesAccordion;
