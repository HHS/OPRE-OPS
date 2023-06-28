import cx from "clsx";
import { useGetAgreementTypesQuery } from "../../../api/opsAPI";
import { convertCodeForDisplay } from "../../../helpers/utils";

/**
 * A select input for choosing an agreement type.
 * @param {Object} props - The component props.
 * @param {string} props.selectedAgreementType - The currently selected agreement type.
 * @param {function} props.setSelectedAgreementType - A function to set the selected agreement type.
 * @param {Function} props.onChange - A function to call when the input value changes.
 * @param {Array<String>} [props.messages] - An array of error messages to display (optional).
 * @param {string} [props.className] - Additional CSS classes to apply to the component (optional).
 * @param {boolean} [props.pending] - A flag to indicate if the input is pending (optional).
 * @returns {JSX.Element} - The rendered component.
 */
export const AgreementTypeSelect = ({
    selectedAgreementType,
    setSelectedAgreementType,
    onChange,
    pending = false,
    messages = [],
    className,
}) => {
    const {
        data: agreementTypes,
        error: errorAgreementTypes,
        isLoading: isLoadingAgreementTypes,
    } = useGetAgreementTypesQuery();

    if (isLoadingAgreementTypes) {
        return <div>Loading...</div>;
    }
    if (errorAgreementTypes) {
        return <div>Oops, an error occurred</div>;
    }

    const handleChange = (e) => {
        const { value } = e.target;
        setSelectedAgreementType(value);
    };

    return (
        <div className={cx("usa-form-group", pending && "pending", className)}>
            <label className="usa-label margin-top-205" htmlFor="agreement-type-options">
                Agreement Type
            </label>
            {messages.length ? (
                <span className="usa-error-message" id="input-error-message" role="alert">
                    {messages[0]}
                </span>
            ) : null}
            <div className="display-flex flex-align-center margin-top-1">
                <select
                    className="usa-select margin-top-0 width-card-lg"
                    name="agreement-type-options"
                    id="agreement-type-options"
                    onChange={handleChange}
                    value={selectedAgreementType}
                    required
                >
                    <option value={0}>- Select Agreement Type -</option>
                    {agreementTypes.map((type, index) => (
                        <option key={index + 1} value={type}>
                            {convertCodeForDisplay("agreementType", type)}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default AgreementTypeSelect;
