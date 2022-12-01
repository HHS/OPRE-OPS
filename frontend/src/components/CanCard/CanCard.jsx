import style from "./styles.module.css";
import CurrencyWithSmallCents from "../UI/CurrencyWithSmallCents/CurrencyWithSmallCents";
import Tag from "../UI/Tag/Tag";
import CANFundingYTD from "../CANFundingYTD/CANFundingYTD";
import { useEffect, useState } from "react";
import { getCanFundingSummary } from "../../helpers/api";
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
    const [canFundingData, setCanFundingDataLocal] = useState({});

    useEffect(() => {
        getCanTotalFundingandSetState(props.can.id, props.fiscalYear);
        return () => {
            setCanFundingDataLocal({});
        };
    }, [props.can.id, props.fiscalYear]);

    const getCanTotalFundingandSetState = async (id, fiscalYear) => {
        if (id && fiscalYear) {
            const results = await getCanFundingSummary(id, fiscalYear);
            setCanFundingDataLocal(results);
            return results;
        }
    };

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
                                amount={canFundingData?.total_funding || constants.notFilledInText}
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
                            <CANFundingYTD
                                className={style.canFundingYTD}
                                current_funding={canFundingData?.current_funding}
                                expected_funding={canFundingData?.expected_funding}
                            />
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
                                        <td>{canFundingData?.planned_funding || constants.notFilledInText}</td>
                                        <td>{canFundingData?.in_execution_funding || constants.notFilledInText}</td>
                                        <td>{canFundingData?.obligated_funding || constants.notFilledInText}</td>
                                        <td>{canFundingData?.available_funding || constants.notFilledInText}</td>
                                        <td>{canFundingData?.can?.appropriation_term || "-"} Years</td>
                                        <td>{canFundingData?.expiration_date || "---"}</td>
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
