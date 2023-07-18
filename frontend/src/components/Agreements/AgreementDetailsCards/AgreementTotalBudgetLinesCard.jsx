import CurrencyWithSmallCents from "../../UI/CurrencyWithSmallCents/CurrencyWithSmallCents";
import RoundedBox from "../../UI/RoundedBox/RoundedBox";
import Tag from "../../UI/Tag/Tag";
import StatusTag, {StatusTagList} from "../../UI/Tag/StatusTag";
import {statuses} from "../../UI/Tag/StatusTag";
import * as React from "react";

const AgreementTotalBudgetLinesCard = ({
    numberOfAgreements = 0,
    countsByStatus = {},

}) => {
    const headerText = "Total Budget Lines";

    return (
        <RoundedBox className="padding-y-205 padding-x-4 padding-right-9 display-inline-block">
            <div className="">

                <article>
                    <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">
                        {headerText}
                    </h3>
                    <div className="display-flex flex-justify width-fit-content">
                        <span className="font-sans-xl text-bold line-height-sans-1">{numberOfAgreements}</span>
                        <div className="display-flex flex-column margin-left-105 grid-gap">
                            {/*{ Object.entries(countsByStatusWithZeros).map(([key,value],i) =>*/}
                            {/*    <StatusTag status={key} count={value} key={key}/>*/}
                            {/*)}*/}

                            <StatusTagList countsByStatus={countsByStatus}/>
                        </div>
                    </div>
                </article>
            </div>
        </RoundedBox>
    )
}

export default AgreementTotalBudgetLinesCard