import cx from "clsx";
import { useGetAgreementReasonsQuery } from "../../../api/opsAPI";
import { convertCodeForDisplay } from "../../../helpers/utils";

/**
 * A select input for choosing an agreement type.
 * @param {Object} props - The component props.
 * @param {string} props.name - The name of the input field.
 * @param {string} [props.label] - The label to display for the input field (optional).
 * @param {string} props.selectedAgreementReason - The currently selected agreement type.
 * @param {Function} props.onChange - A function to call when the input value changes.
 * @param {boolean} [props.pending] - A flag to indicate if the input is pending (optional).
 * @param {Array<String>} [props.messages] - An array of error messages to display (optional).
 * @param {string} [props.className] - Additional CSS classes to apply to the component (optional).
 * @returns {JSX.Element} - The rendered component.
 */
export const AgreementReasonSelect = ({
    name,
    label = name,
    selectedAgreementReason,
    onChange,
    pending = false,
    messages = [],
    className,
}) => {
    const {
        data: agreementReasons,
        error: errorAgreementReasons,
        isLoading: isLoadingAgreementReasons,
    } = useGetAgreementReasonsQuery();

    if (isLoadingAgreementReasons) {
        return <div>Loading...</div>;
    }
    if (errorAgreementReasons) {
        return <div>Oops, an error occurred</div>;
    }

    const handleChange = (e) => {
        onChange(name, e.target.value);
    };

    return (
        <fieldset className={cx("usa-fieldset", pending && "pending", className)}>
            <label className={`usa-label margin-top-0 ${messages.length ? "usa-label--error" : null} `} htmlFor={name}>
                {label}
            </label>
            {messages.length ? (
                <span className="usa-error-message" id="input-error-message" role="alert">
                    {messages[0]}
                </span>
            ) : null}
            <div className="display-flex flex-align-center margin-top-1">
                <select
                    className={`usa-select margin-top-0 width-card-lg ${messages.length ? "usa-input--error" : null}`}
                    name={name}
                    id={name}
                    onChange={handleChange}
                    value={selectedAgreementReason || ""}
                >
                    <option value={0}>- Select Agreement Reason -</option>
                    {agreementReasons.map((reason, index) => (
                        <option key={index + 1} value={reason}>
                            {convertCodeForDisplay("agreementReason", reason)}
                        </option>
                    ))}
                </select>
            </div>
        </fieldset>
    );
};

export default AgreementReasonSelect;
