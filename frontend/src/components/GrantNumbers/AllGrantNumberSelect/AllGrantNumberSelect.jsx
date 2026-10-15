import Select from "../../UI/Form/Select";
import { useEditAgreement } from "../../Agreements/AgreementEditor/AgreementEditorContext.hooks";

/**
 * A select component for all grant numbers on the current agreement.
 * Reads grant numbers from the AgreementEditor context so it reflects
 * grant numbers created in the same editing session (not yet persisted).
 * This is the grant analog of AllServicesComponentSelect.
 *
 * @component
 * @param {Object} props - Component props
 * @param {Array<string>} [props.messages] - An array of error messages to display
 * @param {string} [props.className] - Additional CSS classes to apply to the component
 * @param {string | number} props.value - The current value of the select (grant number `number`)
 * @param {Function} props.onChange - Handler to be called when the select value changes
 * @returns {JSX.Element} - The rendered component
 */
function AllGrantNumberSelect({ messages, className, value, onChange }) {
    const { grant_numbers: grantNumbers = [] } = useEditAgreement();

    const selectOptions = [...grantNumbers]
        ?.sort((a, b) => a.number - b.number)
        .map((grantNumber) => {
            return {
                value: grantNumber.number,
                label: grantNumber.display_title ?? `Grant ${grantNumber.number}`
            };
        });

    return (
        <Select
            name="allGrantNumberSelect"
            label="Grant Number"
            onChange={onChange}
            value={value}
            className={className}
            messages={messages}
            defaultOption=""
            options={selectOptions}
        />
    );
}

export default AllGrantNumberSelect;
