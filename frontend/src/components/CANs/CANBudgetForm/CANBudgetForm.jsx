import RoundedBox from "../../UI/RoundedBox";
import CurrencyFormat from "react-currency-format";

const CANBudgetForm = ({ carryForwardAmount = 5_000_000 }) => {
    return (
        <RoundedBox
            style={{minHeight: "69px"}}
        >
            <p>Previous FYs Carry Forward</p>
            <CurrencyFormat
                value={carryForwardAmount}
                displayType="text"
                thousandSeparator={true}
                decimalScale={2}
                fixedDecimalScale={true}
                prefix="$ "
            />
        </RoundedBox>
    );
};
export default CANBudgetForm;
