import { useDispatch, useSelector } from "react-redux";
import { setSelectedProjectType } from "./createProjectSlice";

const PROJECT_TYPES = ["Research"];

export const ProjectTypeSelect = () => {
    const dispatch = useDispatch();
    const selectedProjectType = useSelector((state) => state.createProject.project.selected_project_type);

    const onChangeProjectTypeSelection = (projectType) => {
        if (projectType === "0") {
            dispatch(setSelectedProjectType(null));
            return;
        }

        dispatch(setSelectedProjectType(projectType));
    };

    return (
        <>
            <label className="usa-label" htmlFor="project-type-select-options">
                Project Type
            </label>
            <div className="display-flex flex-align-center margin-top-1">
                <select
                    className="usa-select margin-top-0 width-card-lg"
                    name="projectTypeSelectOptions"
                    id="project-type-select-options"
                    onChange={(e) => onChangeProjectTypeSelection(e.target.value || 0)}
                    value={selectedProjectType || ""}
                    required
                >
                    <option value={0}>- Select Project Type -</option>
                    {PROJECT_TYPES.map((type, index) => (
                        <option key={index + 1} value={type}>
                            {type}
                        </option>
                    ))}
                </select>
            </div>
        </>
    );
};

export default ProjectTypeSelect;
