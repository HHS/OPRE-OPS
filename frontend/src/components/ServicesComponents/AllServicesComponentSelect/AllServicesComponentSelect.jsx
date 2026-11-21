import Select from "../../UI/Form/Select";
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
 * @param {boolean} [props.isDisabled] - Whether the select is disabled
 * @returns {JSX.Element | null} - The rendered component
 */
function AllServicesComponentSelect({ messages, className, value, onChange, isDisabled = false }) {
    const { agreement, services_components: servicesComponents } = useEditAgreement();

    const selectOptions = [...servicesComponents]
        // filter out services components that have no sub_components
        .filter((serviceComponent) => !serviceComponent.sub_component)
        ?.sort((a, b) => a.number - b.number)
        .map((serviceComponent) => {
            return {
                value: serviceComponent.number,
                label: formatServiceComponent(
                    serviceComponent.number,
                    serviceComponent.optional,
                    agreement.service_requirement_type,
                    true
                )
            };
        });

    // A disabled Select shows its value as-is, so give it the services component's label.
    const selectedLabel = selectOptions.find((option) => option.value === Number(value))?.label ?? value;

    return (
        <Select
            name="allServicesComponentSelect"
            label="Services Component"
            onChange={onChange}
            value={isDisabled ? selectedLabel : value}
            className={className}
            messages={messages}
            defaultOption=""
            options={selectOptions}
            isDisabled={isDisabled}
            // No tooltip here, so fill the form column instead of the fixed disabled width.
            disabledWidthClassName=""
        />
    );
}

export default AllServicesComponentSelect;
