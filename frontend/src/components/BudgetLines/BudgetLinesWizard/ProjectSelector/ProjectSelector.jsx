import DynamicSelector from "../../../UI/DynamicSelector/DynamicSelector";

const ProjectSelector = ({ onChange }) => {
    const options = [
        { id: "1", title: "Project 1" },
        { id: "2", title: "Project 2" },
        { id: "3", title: "Project 3" },
    ];

    const handleSelectedChange = (event) => {
        // dispatch to initialize Agreements
        // dispatch to set selected state
    };

    return (
        <DynamicSelector
            labelText="Project"
            comboTitle="--Select a Project--"
            items={options}
            selectedItem="0"
            handleChangeEvent={onChange || handleSelectedChange}
        />
    );
};

export default ProjectSelector;
