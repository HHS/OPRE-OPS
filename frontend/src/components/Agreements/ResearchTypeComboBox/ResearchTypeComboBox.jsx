import cx from "clsx";
import ComboBox from "../../UI/Form/ComboBox";
import { useNavigate } from "react-router-dom";
import { useGetResearchMethodologiesQuery } from "../../../api/opsAPI";

/**
 * A multiselect combobox for choosing research methodologies
 * @param {Object} props - The component props.
 * @param {import("../../../types/AgreementTypes").ResearchMethodology[]} props.selectedResearchMethodologies - The currently selected research methodologies.
 * @param {Function} props.setSelectedResearchMethodologies - A function to call when the selected research methodologies change.
 * @param {string} [props.defaultString] - Initial text to display in select (optional).
 * @param {Function} [props.onChange] - A function to call when the input value changes (optional).
 * @param {string} [props.legendClassName] - Additional CSS classes to apply to the label/legend (optional).
 * @param {string} [props.className] - Additional CSS classes to apply to the component (optional).
 * @returns {React.ReactElement} - The rendered component.
 */
export const  ResearchMethodologyComboBox = ({
    selectedResearchMethodologies,
    setSelectedResearchMethodologies,
    defaultString = "",
    onChange = () => {},
    legendClassName = "usa-label margin-top-0",
    className
}) => {
    const navigate = useNavigate();
    const { data: researchMethodologies, error: errorResearchMethodologies, isLoading: isLoadingResearchMethodologies } = useGetResearchMethodologiesQuery({});

    const handleChange = (researchMethodologies) => {
        setSelectedResearchMethodologies(researchMethodologies);
        onChange('research_methodologies', researchMethodologies);
    }
    console.log('Research Methodologies data:', researchMethodologies);
    if (isLoadingResearchMethodologies) {
        return <div>Loading...</div>;
    }
    if (errorResearchMethodologies) {
        navigate("/error");
        return <></>;
    }

    return (
        <div
            className={cx(
                            "usa-form-group margin-top-0",
                            className
                        )}
        >
            <label
                className={legendClassName}
                htmlFor="research-type-combobox-input"
            >
                Research Type
            </label>
            <p className="usa-hint margin-top-neg-2px margin-bottom-1">Select all that apply</p>
            <ComboBox
                selectedData={selectedResearchMethodologies}
                setSelectedData={handleChange}
                namespace="research-type-combobox"
                data={researchMethodologies}
                optionText = {(rm) => rm.name}
                defaultString={defaultString}
                isMulti={true}
            />
        </div>
    );
}

export default ResearchMethodologyComboBox;
