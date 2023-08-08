import { useGetUsersQuery } from "../../../api/opsAPI";
import ComboBox from "./ComboBox";

/**
 *  A comboBox for choosing a project officer.
 * @param {Object} props - The component props.
 * @param {string} props.selectedProjectOfficer - The currently selected agreement type.
 * @param {Function} props.setSelectedProjectOfficer - A function to call when the selected agreement type changes.
 * @param {string} [props.legendClassname] - Additional CSS classes to apply to the label/legend (optional).
 * @param {string} [props.defaultString] - Initial text to display in select (optional).
 * @returns {JSX.Element} - The rendered component.
 */
export const ProjectOfficerReactSelect = ({
    selectedProjectOfficer,
    setSelectedProjectOfficer,
    legendClassname = "",
    defaultString = "",
}) => {
    const { data: users, error: errorUsers, isLoading: isLoadingUsers } = useGetUsersQuery();

    if (isLoadingUsers) {
        return <div>Loading...</div>;
    }
    if (errorUsers) {
        return <div>Oops, an error occurred</div>;
    }

    return (
        <div className="display-flex flex-justify">
            <div className="left-half width-full">
                <label className={legendClassname} htmlFor="project-officer" id="project-officer-label">
                    Project Officer
                </label>
                <div>
                    <ComboBox
                        namespace="project-officer-react-select"
                        data={users}
                        selectedData={selectedProjectOfficer}
                        setSelectedData={setSelectedProjectOfficer}
                        defaultString={defaultString}
                        optionText={(user) => user.full_name || user.email}
                    />
                </div>
            </div>
        </div>
    );
};

export default ProjectOfficerReactSelect;
