import ComboBox from "../../UI/Form/ComboBox";
import { useGetSpecialTopicsQuery } from "../../../api/opsAPI";

/**
 * A multiselect combobox for choosing special topics and populations
 * @param {Object} props - The component props.
 * @param {Function} [props.onChange] - A function to call when the input value changes (optional).
 * @param {import("../../../types/AgreementTypes").SpecialTopic[]} props.selectedSpecialTopics - The currently selected special topics.
 * @param {Function} props.setSelectedSpecialTopics - A function to call when the selected special topics change.
 * @param {string} [props.defaultString] - Initial text to display in select (optional).
 * @param {string} [props.legendClassName] - Additional CSS classes to apply to the label/legend (optional).
 * @param {Object} [props.overrideStyles] - Some CSS styles to override the default (optional).
 * @param {string} [props.className] - Additional CSS classes to apply to the component (optional).
 * @returns {React.ReactElement} - The rendered component.
 */
export const  SpecialTopicComboBox = ({
    selectedSpecialTopics,
    setSelectedSpecialTopics,
    defaultString = "-Select an option-",
    onChange = () => {},
    overrideStyles = {},
    legendClassName = "usa-label margin-top-0",
    className
}) => {
    const { data: specialTopics, isError: errorSpecialTopics, isLoading: isLoadingSpecialTopics } = useGetSpecialTopicsQuery({});

    const handleChange = (specialTopics) => {
        setSelectedSpecialTopics(specialTopics);
        onChange('special_topics', specialTopics);
    }
    if (isLoadingSpecialTopics) {
        return <div>Loading...</div>;
    }
    if (errorSpecialTopics) {
        console.error("Error loading special topics and populations");
        return <div>Error loading special topics and populations</div>;
    }

    return (
        <div className={"display-flex flex-column width-full " + (className || "")}>
            <label
                className={legendClassName}
                htmlFor="special-topics-combobox-input"
            >
                Special Topic/Populations
            </label>
            <p className="usa-hint margin-top-neg-2px margin-bottom-1">Select all that apply</p>
            <ComboBox
                selectedData={selectedSpecialTopics}
                setSelectedData={handleChange}
                namespace="special-topics-combobox"
                data={specialTopics}
                optionText = {(specialTopic) => specialTopic.name}
                defaultString={defaultString}
                overrideStyles={overrideStyles}
                isMulti={true}
            />
        </div>
    );
}

export default SpecialTopicComboBox;
