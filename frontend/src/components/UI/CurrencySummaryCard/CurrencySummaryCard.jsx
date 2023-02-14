import CurrencyWithSmallCents from "../CurrencyWithSmallCents/CurrencyWithSmallCents";

const CurrencySummaryCard = ({ headerText, amount, children }) => {
    return (
        <div className="usa-card__container bg-base-lightest font-family-sans padding-left-1">
            <div className="usa-card__header padding-top-2">
                <div className="use-card__heading">
                    <h3 className="margin-0 font-12px text-brand-neutral text-normal">{headerText}</h3>
                </div>
            </div>
            <div className="usa-card__body">
                <CurrencyWithSmallCents dollarsClasses="font-sans-xl" centsClasses="font-sans-3xs" amount={amount} />
                {children}
            </div>
        </div>
    );
};

export default CurrencySummaryCard;
