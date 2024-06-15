import PropTypes from "prop-types";
import Select from "../../UI/Select";
import { useGetServicesComponentsListQuery } from "../../../api/opsAPI";
/**
 * A select component for all services.
 *
 * @component
 * @param {Object} props - Component props
 * @param {Array<string>} [props.messages] - An array of error messages to display
 * @param {string} [props.className] - Additional CSS classes to apply to the component
 * @param {string} props.value - The current value of the select
 * @param {Function} props.onChange - Handler to be called when the select value changes
 * @param {number} props.agreementId - The ID of the agreement
 *
 * @example
 * <AllServicesComponentSelect value="service1" onChange={handleChange} agreementId={123} />
 *
 * @returns {JSX.Element | null} - The rendered component
 */
function AllServicesComponentSelect({ messages, className, value, onChange, agreementId }) {
    const { data: servicesComponents, isSuccess } = useGetServicesComponentsListQuery(agreementId);
    if (isSuccess && !servicesComponents) {
        return null;
    }
    if (!isSuccess) {
        return null;
    }

    const selectOptions = [...servicesComponents]
        ?.sort((a, b) => a.number - b.number)
        .map((serviceComponent) => {
            return {
                value: serviceComponent.id,
                label: serviceComponent.display_name
            };
        });

    return (
        <Select
            name="allServicesComponentSelect"
            label="Services Component"
            onChange={onChange}
            value={value}
            className={className}
            messages={messages}
            defaultOption=""
            options={selectOptions}
        />
    );
}

AllServicesComponentSelect.propTypes = {
    messages: PropTypes.array,
    className: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    agreementId: PropTypes.number.isRequired
};

export default AllServicesComponentSelect;
