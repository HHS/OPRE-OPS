import CurrencyInput from "../../UI/Form/CurrencyInput";
import TextArea from "../../UI/Form/TextArea";
import icons from "../../../uswds/img/sprite.svg";

/**
 * @typedef {Object} CANFundingReceivedFormProps
 * @property {(arg: string) => string} cn
 * @property {Object} res
 * @property {string} receivedFundingAmount
 * @property {(e: React.FormEvent<HTMLFormElement>) => void} handleSubmit
 * @property {boolean} isEditing
 * @property {(name: string, value: string) => void} runValidate
 * @property { React.Dispatch<React.SetStateAction<string>>} setReceivedFundingAmount
 * @property {string} notes
 * @property { React.Dispatch<React.SetStateAction<string>>} setNotes
 * @property { () => void } cancelFundingReceived
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
    isEditing,
    receivedFundingAmount,
    setReceivedFundingAmount,
    notes,
    setNotes,
    cancelFundingReceived
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
            <div className="display-flex flex-justify margin-top-4">
                <button
                    className="usa-button usa-button--outline "
                    disabled={isFormInValid}
                    data-cy="add-funding-received-btn"
                >
                    {!isEditing && (
                        <svg
                            className="height-2 width-2 margin-right-05 cursor-pointer"
                            style={{ fill: fillColor }}
                        >
                            <use xlinkHref={`${icons}#add`}></use>
                        </svg>
                    )}

                    {isEditing ? "Update Funding Received" : "Add Funding Received"}
                </button>

                {isEditing && (
                    <button
                        className="usa-button usa-button--unstyled  margin-right-7"
                        onClick={cancelFundingReceived}
                    >
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
};

export default CANFundingReceivedForm;
