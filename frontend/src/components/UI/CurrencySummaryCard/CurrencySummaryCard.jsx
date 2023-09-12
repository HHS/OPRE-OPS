import CurrencyWithSmallCents from "../CurrencyWithSmallCents/CurrencyWithSmallCents";
import RoundedBox from "../RoundedBox";

const CurrencySummaryCard = ({ headerText, amount, children }) => {
    return (
        <RoundedBox className="padding-y-205 padding-x-4 padding-right-9 display-inline-block">
            {headerText && (
                <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">{headerText}</h3>
            )}
            {amount && (
                <CurrencyWithSmallCents dollarsClasses="font-sans-xl" centsClasses="font-sans-3xs" amount={amount} />
            )}
            {children}
        </RoundedBox>
    );
};

export default CurrencySummaryCard;
