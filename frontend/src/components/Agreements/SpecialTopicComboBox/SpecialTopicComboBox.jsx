import ComboBox from "../../UI/Form/ComboBox";
import { useNavigate } from "react-router-dom";
import { useGetSpecialTopicsQuery } from "../../../api/opsAPI";

/**
 * A multiselect combobox for choosing research methodologies
 * @param {Object} props - The component props.
 * @param {import("../../types/AgreementTypes").ResearchMethodology[]} props.selectedResearchMethodologies - The currently selected research methodologies.
 * @param {Function} props.setSelectedResearchMethodologies - A function to call when the selected research methodologies change.
 * @param {string} [props.defaultString] - Initial text to display in select (optional).
 * @param {string} [props.legendClassName] - Additional CSS classes to apply to the label/legend (optional).
 * @returns {React.ReactElement} - The rendered component.
 */
export const  ResearchMethodologyComboBox = ({
    selectedResearchMethodologies,
    setSelectedResearchMethodologies,
    defaultString = "",
    legendClassName = "usa-label margin-top-0"
}) => {
    const navigate = useNavigate();
    const { data: specialTopics, error: errorSpecialTopics, isLoading: isLoadingSpecialTopics } = useGetSpecialTopicsQuery({});

    console.log('Special Topics data:', specialTopics);
    if (isLoadingSpecialTopics) {
        return <div>Loading...</div>;
    }
    if (errorSpecialTopics) {
        navigate("/error");
        return <></>;
    }

    return (
        <div className="display-flex flex-column width-full">
            <label
                className={legendClassName}
                htmlFor="special-topic-combobox-input"
            >
                Special Topic/Populations
            </label>
            <p className="usa-hint margin-top-neg-2px margin-bottom-1">Select all that apply</p>
            <ComboBox
                selectedData={selectedResearchMethodologies}
                setSelectedData={setSelectedResearchMethodologies}
                namespace="special-topic-combobox"
                data={specialTopics}
                optionText = {(specialTopic) => specialTopic.name}
                defaultString={defaultString}
                isMulti={true}
            />
        </div>
    );
}

export default ResearchMethodologyComboBox;
