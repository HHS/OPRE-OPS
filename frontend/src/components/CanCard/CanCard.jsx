import style from "./styles.module.css";
import CurrencyWithSmallCents from "../UI/CurrencyWithSmallCents/CurrencyWithSmallCents";
import Tag from "../UI/Tag/Tag";
import CANFundingYTD from "../CANFundingYTD/CANFundingYTD";
import { useEffect } from "react";
import { getCanTotalFundingandSetState } from "./getCanCardDetails";
import { useDispatch, useSelector } from "react-redux";
import { setCanTotalFunding } from "./canCardDetailSlice";
import constants from "../../constants";

const CanCard = (props) => {
    /* Styling */
    const sectionClasses = `${style.container}`;
    const leftMarginClasses = `padding-left-2 padding-top-1 ${style.leftMarginContainer}`;
    const cardBodyClasses = `padding-left-3 padding-top-2 ${style.cardBodyDiv}`;
    const leftMarginBlockClasses = `font-sans-3xs padding-top-1 ${style.leftMarginSubContainer}`;
    const fundingYTDClasses = `padding-left-0 grid-container ${style.fundingYTD}`;
    const budgetStatusClasses = `${style.budgetStatus}`;
    const budgetStatusTableClasses = `usa-table usa-table--borderless ${style.budgetStatusTable}`;
    const tagClasses = `grid-col-1`;
    /* vars */
    const dispatch = useDispatch();
    const canTotalFunding = useSelector((state) => state.canCardDetails.canTotalFunding);

    useEffect(() => {
        dispatch(getCanTotalFundingandSetState(props.can.id, props.fiscalYear));

        return () => {
            dispatch(setCanTotalFunding({}));
        };
    }, [dispatch, props.can.id, props.fiscalYear]);

    return (
        <section>
            <div className={sectionClasses}>
                <div className={leftMarginClasses}>
                    <div className={leftMarginBlockClasses}>
                        <div className="font-sans-3xs">CAN</div>
                        <div className="font-sans-md text-bold">{props.can.number}</div>
                    </div>
                    <div className={leftMarginBlockClasses}>
                        <div className="font-sans-3xs">Description</div>
                        <div className="font-sans-md text-bold">{props.can.nickname}</div>
                    </div>
                    <div className={leftMarginBlockClasses}>
                        <div className="font-sans-3xs">FY Total Budget</div>
                        <div className="font-sans-md text-bold">
                            <CurrencyWithSmallCents
                                amount={canTotalFunding.total_fiscal_year_funding || constants.notFilledInText}
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
                                        <td>$0*</td>
                                        <td>$0*</td>
                                        <td>$5,677,279.24*</td>
                                        <td>$1,352,100.36*</td>
                                        <td>5 Years*</td>
                                        <td>09/30/2027*</td>
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
