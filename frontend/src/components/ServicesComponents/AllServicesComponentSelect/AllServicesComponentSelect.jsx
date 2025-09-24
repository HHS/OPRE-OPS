import PropTypes from "prop-types";
import Select from "../../UI/Form/Select";
// import { useGetServicesComponentsListQuery } from "../../../api/opsAPI";
import { useEditAgreement } from "../../Agreements/AgreementEditor/AgreementEditorContext.hooks";
import { formatServiceComponent } from "../ServicesComponents.helpers";
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
// function AllServicesComponentSelect({ messages, className, value, onChange, agreementId }) {
function AllServicesComponentSelect({ messages, className, value, onChange }) {
    const { agreement, services_components: servicesComponents } = useEditAgreement();
    // const { data: servicesComponents, isSuccess } = useGetServicesComponentsListQuery(agreementId);
    // if (isSuccess && !servicesComponents) {
    //     return null;
    // }
    // if (!isSuccess) {
    //     return null;
    // }

    const selectOptions = [...servicesComponents]
        ?.sort((a, b) => a.number - b.number)
        .map((serviceComponent) => {
            return {
                value: serviceComponent.number,
                label: formatServiceComponent(serviceComponent.number, serviceComponent.optional, agreement.service_requirement_type )
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
