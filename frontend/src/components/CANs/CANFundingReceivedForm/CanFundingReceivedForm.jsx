import CurrencyInput from "../../UI/Form/CurrencyInput";

const CANFundingReceivedForm = () => {
    return (
        <form>
            <CurrencyInput
                name="funding-received-amount"
                label="Funding Received"
                onChange={() => {}}
                setEnteredAmount={() => {}}
            />
        </form>
    );
};
export default CANFundingReceivedForm;
