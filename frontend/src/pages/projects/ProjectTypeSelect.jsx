import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setProjectTypesList, setSelectedProjectType } from "./createProjectSlice";

const PROJECT_TYPES = ["Research"];

export const ProjectTypeSelect = () => {
    const dispatch = useDispatch();
    const projectTypes = useSelector((state) => state.createProject.project_types_list);
    const selectedProjectType = useSelector((state) => state.createProject.project.selected_project_type);

    // On component load, get ProjectTypes from API, and set returned list in State
    // Currently set to a default of a single hard-coded value.
    useEffect(() => {
        const getProjectTypesAndSetState = async () => {
            dispatch(setProjectTypesList(PROJECT_TYPES));
        };

        getProjectTypesAndSetState().catch(console.error);

        return () => {
            dispatch(setProjectTypesList([]));
        };
    }, [dispatch]);

    const onChangeProjectTypeSelection = (projectType) => {
        if (projectType === "0") {
            dispatch(setSelectedProjectType(null));
            return;
        }

        dispatch(setSelectedProjectType(projectType));
    };

    return (
        <>
            <label className="usa-label" htmlFor="options">
                Project Type
            </label>
            <div className="display-flex flex-align-center margin-top-1">
                <select
                    className="usa-select margin-top-0 width-card-lg"
                    name="options"
                    id="options"
                    onChange={(e) => onChangeProjectTypeSelection(e.target.value || 0)}
                    value={selectedProjectType || ""}
                    required
                >
                    <option value={0}>- Select Project Type -</option>
                    {projectTypes.map((type, index) => (
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
