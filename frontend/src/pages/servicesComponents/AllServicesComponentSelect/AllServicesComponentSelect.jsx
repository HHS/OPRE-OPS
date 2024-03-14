import PropTypes from "prop-types";
import Select from "../Select";
import { useGetServicesComponentsListQuery } from "../../../api/opsAPI";
/**
 * A select component for all services.
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.value - The current value of the select
 * @param {Function} props.onChange - Handler to be called when the select value changes
 * @param {number} props.agreementId - The ID of the agreement
 *
 * @example
 * <AllServicesComponentSelect value="service1" onChange={handleChange} agreementId={123} />
 *
 * @returns {JSX.Element} - The rendered component
 */
function AllServicesComponentSelect({ value, onChange, agreementId }) {
    const { data: servicesComponents } = useGetServicesComponentsListQuery(agreementId);

    const selectOptions = servicesComponents?.map((serviceComponent) => {
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
            messages={[]}
            defaultOption=""
            options={selectOptions}
        />
    );
}

AllServicesComponentSelect.propTypes = {
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    agreementId: PropTypes.number.isRequired
};

export default AllServicesComponentSelect;
