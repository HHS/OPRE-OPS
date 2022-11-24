import style from "./styles.module.css";
import CurrencyWithSmallCents from "../UI/CurrencyWithSmallCents/CurrencyWithSmallCents";
import Tag from "../UI/Tag/Tag";
import CANFundingYTD from "../CANFundingYTD/CANFundingYTD";

const CanCard = () => {
    const sectionClasses = `${style.container}`;
    const leftMarginClasses = `padding-left-2 padding-top-1 ${style.leftMarginContainer}`;
    const cardBodyClasses = `padding-left-3 padding-top-2 ${style.cardBodyDiv}`;
    const leftMarginBlockClasses = `font-sans-3xs padding-top-1 ${style.leftMarginSubContainer}`;
    const fundingYTDClasses = `padding-left-0 grid-container ${style.fundingYTD}`;
    const budgetStatusClasses = `${style.budgetStatus}`;
    const budgetStatusTableClasses = `usa-table usa-table--borderless ${style.budgetStatusTable}`;
    const tagClasses = `grid-col-1`;

    return (
        <section>
            <h2>Portfolio Budget Details by CAN </h2>
            <p>
                The list of CANs below are specific to this portfolio’s budget. It does not include funding from other
                CANs outside of this portfolio that might occur during cross-portfolio collaborations on research
                projects.
            </p>
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
                        <div className={budgetStatusTableClasses}>
                            <table className={budgetStatusTableClasses}>
                                <thead>
                                    <tr>
                                        <th scope="col">Planned</th>
                                        <th scope="col">in Execution</th>
                                        <th scope="col">Obligated</th>
                                        <th scope="col">Remaining</th>
                                        <th scope="col">Appropriation Term</th>
                                        <th scope="col">Expiration</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>$0</td>
                                        <td>$0</td>
                                        <td>$5,677,279.24</td>
                                        <td>$1,352,100.36</td>
                                        <td>5 Years</td>
                                        <td>09/30/2027</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CanCard;
