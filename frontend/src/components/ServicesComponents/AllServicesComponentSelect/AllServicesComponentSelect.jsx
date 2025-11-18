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
 * @returns {JSX.Element | null} - The rendered component
 */
function AllServicesComponentSelect({ messages, className, value, onChange }) {
    const { agreement, services_components: servicesComponents } = useEditAgreement();

    const selectOptions = [...servicesComponents]
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

    // remove duplicated options with same value from selectOptions
    const seenValues = new Set();
    const dedupedOptions = [];
    for (const opt of selectOptions) {
        if (!seenValues.has(opt.value)) {
            seenValues.add(opt.value);
            dedupedOptions.push(opt);
        }
    }

    return (
        <Select
            name="allServicesComponentSelect"
            label="Services Component"
            onChange={onChange}
            value={value}
            className={className}
            messages={messages}
            defaultOption=""
            options={dedupedOptions}
        />
    );
}

export default AllServicesComponentSelect;
