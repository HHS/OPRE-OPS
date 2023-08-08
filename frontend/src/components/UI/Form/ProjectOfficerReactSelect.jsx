import { useEffect, useState } from "react";
import { useGetUsersQuery } from "../../../api/opsAPI";
import Select from "react-select";

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
    const [selectedOption, setSelectedOption] = useState(null);

    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            background: "#fff",
            borderColor: "565c65",
            minHeight: "40px",
            height: "40px",
            boxShadow: state.isFocused ? null : null,
            outline: state.isFocused ? "0.25rem solid #2491ff" : null,
            borderRadius: 0,
        }),

        placeholder: (provided) => ({
            ...provided,
            color: "#1b1b1b",
        }),

        valueContainer: (provided) => ({
            ...provided,
            height: "40px",
            padding: "0 6px",
        }),

        input: (provided) => ({
            ...provided,
            margin: "0px",
        }),
        indicatorSeparator: () => ({
            display: "none",
        }),
        indicatorsContainer: (provided) => ({
            ...provided,
            height: "40px",
        }),
    };

    const handleChange = (e, actionObj) => {
        if (actionObj.action === "clear") {
            setSelectedProjectOfficer({});
            setSelectedOption(null);
        } else {
            const userId = e.value;
            const user = users.find((user) => user.id === Number(userId));
            setSelectedProjectOfficer(user);

            const option = options.find((option) => option.value === Number(userId));
            setSelectedOption(option);
        }
    };

    useEffect(() => {
        selectedProjectOfficer === undefined && setSelectedOption(null);
    }, [selectedProjectOfficer]);

    if (isLoadingUsers) {
        return <div>Loading...</div>;
    }
    if (errorUsers) {
        return <div>Oops, an error occurred</div>;
    }

    const options = users.map((user) => {
        return { value: user.id, label: user.full_name || user.email };
    });

    const defaultOption = selectedProjectOfficer
        ? options.find((option) => option.value === Number(selectedProjectOfficer?.id))
        : null;

    return (
        <div className="display-flex flex-justify">
            <div className="left-half width-full">
                <label className={legendClassname} htmlFor="project-officer" id="project-officer-label">
                    Project Officer
                </label>
                <div className="" data-enhanced="true">
                    <Select
                        className="margin-0"
                        classNamePrefix={"project-officer-react-select"}
                        data-cy="project-officer-react-select"
                        data-testid="project-officer-react-select"
                        name="project-officer-react-select"
                        tabIndex="0"
                        value={defaultOption ?? selectedOption}
                        onChange={handleChange}
                        options={options}
                        placeholder={defaultString}
                        styles={customStyles}
                        isSearchable={true}
                        isClearable={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default ProjectOfficerReactSelect;
