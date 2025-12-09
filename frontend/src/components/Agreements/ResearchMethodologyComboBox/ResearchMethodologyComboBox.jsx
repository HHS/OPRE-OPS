import ComboBox from "../../UI/Form/ComboBox";
import { useGetResearchMethodologiesQuery } from "../../../api/opsAPI";

/**
 * A multiselect combobox for choosing research methodologies
 * @param {Object} props - The component props.
 * @param {import("../../../types/AgreementTypes").ResearchMethodology[]} props.selectedResearchMethodologies - The currently selected research methodologies.
 * @param {Function} props.setSelectedResearchMethodologies - A function to call when the selected research methodologies change.
 * @param {string} [props.defaultString] - Initial text to display in select (optional).
 * @param {Function} [props.onChange] - A function to call when the input value changes (optional).
 * @param {string} [props.legendClassName] - Additional CSS classes to apply to the label/legend (optional).
 * @param {Object} [props.overrideStyles] - Some CSS styles to override the default (optional).
 * @param {string} [props.className] - Additional CSS classes to apply to the component (optional).
 * @returns {React.ReactElement} - The rendered component.
 */
export const  ResearchMethodologyComboBox = ({
    selectedResearchMethodologies,
    setSelectedResearchMethodologies,
    defaultString ="-Select an option-",
    onChange = () => {},
    overrideStyles = {},
    legendClassName = "usa-label margin-top-0",
    className
}) => {
    const { data: researchMethodologies, isError: errorResearchMethodologies, isLoading: isLoadingResearchMethodologies } = useGetResearchMethodologiesQuery({});

    // @ts-ignore
    const handleChange = (researchMethodologies) => {
        setSelectedResearchMethodologies(researchMethodologies);
        onChange('research_methodologies', researchMethodologies);
    }
    if (isLoadingResearchMethodologies) {
        return <div>Loading...</div>;
    }
    if (errorResearchMethodologies) {
        console.error("Error loading research methodologies");
        return <div>Error loading research methodologies</div>;
    }

    return (
        <div
            className={"display-flex flex-column width-full " + (className || "")}
        >
            <label
                className={legendClassName}
                htmlFor="research-methodologies-combobox-input"
            >
                Research Methodologies
            </label>
            <p className="usa-hint margin-top-neg-2px margin-bottom-1">Select all that apply</p>
            <ComboBox
                selectedData={selectedResearchMethodologies}
                setSelectedData={handleChange}
                namespace="research-methodologies-combobox"
                data={researchMethodologies}
                optionText = {(rm) => rm.name}
                defaultString={defaultString}
                overrideStyles={overrideStyles}
                isMulti={true}
            />
        </div>
    );
}

export default ResearchMethodologyComboBox;
