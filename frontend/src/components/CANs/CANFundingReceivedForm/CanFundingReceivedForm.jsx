import CurrencyInput from "../../UI/Form/CurrencyInput";
import TextArea from "../../UI/Form/TextArea";
import icons from "../../../uswds/img/sprite.svg";

/**
 * @typedef {Object} CANFundingReceivedFormProps
 * @property {(arg: string) => string} cn
 * @property {Object} res
 * @property {Object} suite
 * @property {string} receivedFundingAmount
 * @property {(e: React.FormEvent<HTMLFormElement>) => void} handleSubmit
 * @property {(name: string, value: string) => void} runValidate
 * @property { React.Dispatch<React.SetStateAction<string>>} setReceivedFundingAmount
 * @property {string} notes
 * @property { React.Dispatch<React.SetStateAction<string>>} setNotes
 */

/**
 * @component - The CAN Funding Received Form component.
 * @param {CANFundingReceivedFormProps} props
 * @returns  {JSX.Element} - The component JSX.
 */

const CANFundingReceivedForm = ({
    cn,
    res,
    runValidate,
    handleSubmit,
    receivedFundingAmount,
    setReceivedFundingAmount,
    notes,
    setNotes
}) => {
    return (
        <form
            onSubmit={(e) => {
                handleSubmit(e);
            }}
        >
            <CurrencyInput
                name="funding-received-amount"
                label="Funding Received"
                onChange={(name, value) => {
                    runValidate("funding-received-amount", value);
                }}
                setEnteredAmount={setReceivedFundingAmount}
                value={receivedFundingAmount || ""}
                messages={res.getErrors("funding-received-amount")}
                className={cn("funding-received-amount")}
            />
            <TextArea
                maxLength={75}
                name="Notes"
                label="Notes (optional)"
                value={notes}
                onChange={(name, value) => setNotes(value)}
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
