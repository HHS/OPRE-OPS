import CurrencyInput from "../../UI/Form/CurrencyInput";
import TextArea from "../../UI/Form/TextArea/index.js";

const CANFundingReceivedForm = () => {
    return (
        <form>
            <CurrencyInput
                name="funding-received-amount"
                label="Funding Received"
                onChange={() => {}}
                setEnteredAmount={() => {}}
            />
            <TextArea
                maxLength={75}
                name="Notes"
                label="Notes (optional)"
                value={""}
                onChange={() => {}}
            />
            <p>Test 2</p>
        </form>
    );
};

export default CANFundingReceivedForm;
