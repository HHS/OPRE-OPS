import CurrencyWithSmallCents from "../CurrencyWithSmallCents/CurrencyWithSmallCents";

const CurrencySummaryCard = ({ headerText, amount }) => {
    return (
        <div className="usa-card__container bg-base-lightest font-family-sans padding-left-2">
            <div className="usa-card__header padding-top-2">
                <div className="use-card__heading">
                    <h3 className="margin-0 font-sans-3xs text-normal">{headerText}</h3>
                </div>
            </div>
            <div className="usa-card__body padding-top-3 padding-bottom-4">
                <CurrencyWithSmallCents dollarsClasses="font-sans-xl" centsClasses="font-sans-3xs" amount={amount} />
            </div>
        </div>
    );
};

export default CurrencySummaryCard;
