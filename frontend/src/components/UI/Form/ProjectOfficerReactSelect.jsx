import { useEffect, useState } from "react";
import { useGetUsersQuery } from "../../../api/opsAPI";
import Select from "react-select";

/**
 *  A comboBox for choosing a project officer.
 * @param {Object} props - The component props.
 * @param {string} props.name - The name of the input field.
 * @param {string} [props.label] - The label to display for the input field (optional).
 * @param {string} props.selectedProjectOfficer - The currently selected agreement type.
 * @param {Function} props.setSelectedProjectOfficer - A function to call when the selected agreement type changes.
 * @param {Function} props.onChange - A function to call when the input value changes.
 * @param {Array<String>} [props.messages] - An array of error messages to display (optional).
 * @param {string} [props.className] - Additional CSS classes to apply to the component (optional).
 * @param {boolean} [props.pending] - A flag to indicate if the input is pending (optional).
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
            borderColor: "#9e9e9e",
            minHeight: "40px",
            height: "40px",
            boxShadow: state.isFocused ? null : null,
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

    const handleChange = (e) => {
        const userId = e.value;
        const user = users.find((user) => user.id === Number(userId));
        setSelectedProjectOfficer(user);

        const option = options.find((option) => option.value === Number(userId));
        setSelectedOption(option);
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
                        data-cy="project-officer-select"
                        data-testid="project-officer-select"
                        name="project-officer"
                        tabIndex="-1"
                        value={defaultOption ?? selectedOption}
                        onChange={handleChange}
                        options={options}
                        placeholder={defaultString}
                        styles={customStyles}
                        isSearchable={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default ProjectOfficerReactSelect;
