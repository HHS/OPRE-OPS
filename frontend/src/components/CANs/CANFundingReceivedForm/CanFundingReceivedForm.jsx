import CurrencyInput from "../../UI/Form/CurrencyInput";
import TextArea from "../../UI/Form/TextArea";
import icons from "../../../uswds/img/sprite.svg";

/**
 * @typedef {Object} CANFundingReceivedFormProps
 * @property {(arg: string) => string} cn
 * @property {Object} res
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
    const isFormInValid = !receivedFundingAmount || res.hasErrors("funding-received-amount");
    const fillColor = !isFormInValid ? "#005ea2" : "#757575";

    return (
        <form
            onSubmit={(e) => {
                handleSubmit(e);
            }}
        >
            <div style={{ width: "383px" }}>
                <CurrencyInput
                    name="funding-received-amount"
                    label="Funding Received"
                    onChange={(name, value) => {
                        runValidate("funding-received-amount", value);
                    }}
                    setEnteredAmount={setReceivedFundingAmount}
                    value={receivedFundingAmount || ""}
                    messages={res.getErrors("funding-received-amount")}
                    className={`${cn("funding-received-amount")} margin-top-0`}
                />
                <TextArea
                    maxLength={75}
                    name="notes"
                    label="Notes (optional)"
                    value={notes}
                    onChange={(name, value) => setNotes(value)}
                    textAreaStyle={{ height: "51px" }}
                />{" "}
            </div>
            <button
                className="usa-button usa-button--outline margin-top-4"
                disabled={isFormInValid}
                data-cy="add-funding-received-btn"
            >
                <svg
                    className="height-2 width-2 margin-right-05 cursor-pointer"
                    style={{ fill: fillColor }}
                >
                    <use xlinkHref={`${icons}#add`}></use>
                </svg>
                Add Funding Received
            </button>
        </form>
    );
};

export default CANFundingReceivedForm;
