import CurrencyWithSmallCents from "../CurrencyWithSmallCents/CurrencyWithSmallCents";
import SummaryCard from "../SummaryCard";

const CurrencySummaryCard = ({ headerText, amount, children }) => {
    return (
        <SummaryCard title={headerText}>
            {amount && (
                <CurrencyWithSmallCents
                    dollarsClasses="font-sans-xl"
                    centsClasses="font-sans-3xs"
                    amount={amount}
                />
            )}
            {children}
        </SummaryCard>
    );
};

export default CurrencySummaryCard;
