import CurrencyInput from "../../UI/Form/CurrencyInput";
import TextArea from "../../UI/Form/TextArea";
import icons from "../../../uswds/img/sprite.svg";

const CANFundingReceivedForm = ({ handleSubmit, setReceivedFundingAmount }) => {
    return (
        <form onSubmit={handleSubmit}>
            <CurrencyInput
                name="funding-received-amount"
                label="Funding Received"
                onChange={() => {}}
                setEnteredAmount={setReceivedFundingAmount}
                value={""}
            />
            <TextArea
                maxLength={75}
                name="Notes"
                label="Notes (optional)"
                value={""}
                onChange={() => {}}
            />
            <button className="usa-button usa-button--outline margin-top-4">
                <svg
                    className="height-2 width-2 margin-right-05 cursor-pointer"
                    style={{ fill: "#005ea2" }}
                >
                    <use xlinkHref={`${icons}#add`}></use>
                </svg>
                Add Funding Received
            </button>
        </form>
    );
};

export default CANFundingReceivedForm;
