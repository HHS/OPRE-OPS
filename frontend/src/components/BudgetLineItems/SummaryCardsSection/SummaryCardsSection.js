import RoundedBox from "../../UI/RoundedBox";

const BudgetLineTotalSummaryCard = (title) => {
    return (
        <RoundedBox className="padding-y-205 padding-x-4 padding-right-9 ">
            <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">{title}</h3>
        </RoundedBox>
    );
};

const SummaryCardsSection = () => {
    return (
        <div className="display-flex flex-justify">
            <BudgetLineTotalSummaryCard title="Budget Lines Total" />
            <BudgetLineTotalSummaryCard />
        </div>
    );
};

export default SummaryCardsSection;
