import { useSelector } from "react-redux";
import { ComboBox } from "@trussworks/react-uswds";

export const DynamicSelect = () => {
    const researchProjects = useSelector((state) => state.createBudgetLine.research_projects);

    const projects = Object.entries(researchProjects).map(([value, key]) => ({
        value: value,
        label: key,
    }));

    const options = [...projects];

    return (
        <>
            <label className="usa-label" htmlFor="project">
                Project
            </label>
            <ComboBox id="projectSelect" name="projectSelect" options={options} />
        </>
    );
};
