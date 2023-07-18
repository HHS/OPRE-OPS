import CurrencyWithSmallCents from "../../UI/CurrencyWithSmallCents/CurrencyWithSmallCents";
import RoundedBox from "../../UI/RoundedBox/RoundedBox";
import Tag from "../../UI/Tag/Tag";

const AgreementTotalBudgetLinesCard = ({
}) => {
    const headerText = "Total Agreement Value";





    return (
        <RoundedBox className="padding-y-205 padding-x-4 padding-right-9 display-inline-block">
            <div className="">

                <article>
                    <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">
                        {headerText}
                    </h3>

                </article>
            </div>
        </RoundedBox>
    )
}

export default AgreementTotalBudgetLinesCard