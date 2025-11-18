import cx from "clsx";
import { useGetAllAgreementAgenciesQuery } from "../../../api/opsAPI";
import ComboBox from "../../UI/Form/ComboBox";

/**
 * @param {Object} props
 * @param {"Servicing"|"Requesting"} props.agencyType
 * @param {Function} props.setAgency
 * @param {Function} props.onChange
 * @param {string|number} props.value
 * @param {string} props.className
 * @param {string[]} props.messages
 * @param {string} [props.legendClassname]
 * @returns {React.ReactElement}
 */
const AgencySelect = ({
    agencyType,
    setAgency,
    onChange,
    value,
    className,
    messages,
    legendClassname = "usa-label margin-top-0",
    ...rest
}) => {
    /** @typedef {import("../../../types/AgreementTypes").Agency} Agency */
    /** @type {{data?: Agency[] | undefined, isError: boolean,  isLoading: boolean}} */
    const { data, isLoading, isError } = useGetAllAgreementAgenciesQuery({ [agencyType.toLowerCase()]: true });

    if (isLoading) {
        return <div>Loading...</div>;
    }
    if (isError) {
        console.error("Error loading agencies");
        return <div>Error loading agencies</div>;
    }

    const handleChange = (agency) => {
        setAgency(agency);
        onChange(`${agencyType.toLowerCase()}_agency`, agency);
    };
    return (
        <div
            className={cx("usa-form-group margin-top-3", messages.length && "usa-form-group--error", className)}
            style={{ width: "508px" }}
        >
            <label
                className={`${legendClassname} ${messages.length ? "usa-label--error" : ""}`}
                htmlFor={`${agencyType.toLowerCase()}-agency-combobox-input`}
                id={`${agencyType.toLowerCase()}-agency-combobox-label`}
            >
                {`${agencyType} Agency`}
            </label>
            {messages?.length > 0 ? (
                <span
                    className="usa-error-message"
                    id={`${agencyType.toLowerCase()}-agency-combobox-error`}
                    role="alert"
                >
                    {messages[0]}
                </span>
            ) : (
                <span className="usa-hint">Required Information*</span>
            )}
            <div className="margin-top-05">
                <ComboBox
                    namespace={`${agencyType.toLowerCase()}-agency-combobox`}
                    data={data}
                    selectedData={value}
                    setSelectedData={handleChange}
                    defaultString="-Select an option-"
                    optionText={(agency) => agency.name ?? agency.abbr}
                    messages={messages}
                    className={className}
                    isMulti={false}
                    {...rest}
                />
            </div>
        </div>
    );
};

export default AgencySelect;
