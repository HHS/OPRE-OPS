import style from "./styles.module.css";
import CurrencyWithSmallCents from "../UI/CurrencyWithSmallCents/CurrencyWithSmallCents";
import Tag from "../UI/Tag/Tag";
import CANFundingYTD from "../CANFundingYTD/CANFundingYTD";

const CanCard = () => {
    const sectionClasses = `${style.container}`;
    const leftMarginClasses = `padding-left-1 padding-top-1 ${style.leftMarginContainer}`;
    const cardBodyClasses = `padding-left-3 padding-top-2 ${style.cardBodyDiv}`;
    const leftMarginBlockClasses = `font-sans-3xs padding-top-1 ${style.leftMarginSubContainer}`;
    const fundingYTDClasses = `grid-container ${style.fundingYTD}`;
    const budgetStatusClasses = `${style.budgetStatus}`;
    const tagClasses = `grid-col-1`;

    return (
        <div className={sectionClasses}>
            <div className={leftMarginClasses}>
                <div className={leftMarginBlockClasses}>
                    <div className="font-sans-3xs">CAN</div>
                    <div className="font-sans-md text-bold">G99PHS9</div>
                </div>
                <div className={leftMarginBlockClasses}>
                    <div className="font-sans-3xs">Description</div>
                    <div className="font-sans-md text-bold">SSRD-5 YR</div>
                </div>
                <div className={leftMarginBlockClasses}>
                    <div className="font-sans-3xs">FY Total Budget</div>
                    <div className="font-sans-md text-bold">
                        <CurrencyWithSmallCents
                            amount="7019379.60"
                            dollarsClasses="font-sans-md text-bold"
                            centsStyles={{ fontSize: "10px" }}
                        />
                    </div>
                </div>
            </div>
            <div className={cardBodyClasses}>
                <div className={fundingYTDClasses}>
                    <div className="grid-row">
                        <Tag text="Funding YTD" className={tagClasses} />
                    </div>
                    <div>
                        <CANFundingYTD className={style.canFundingYTD} />
                    </div>
                </div>
                <div className={budgetStatusClasses}>
                    <Tag text="Budget Status" />
                </div>
            </div>
        </div>
    );
};

export default CanCard;
