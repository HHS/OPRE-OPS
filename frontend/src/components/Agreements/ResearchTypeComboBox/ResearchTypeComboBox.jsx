import ComboBox from "../../UI/Form/ComboBox";

function ResearchTypeComboBox({ researchTypes, setResearchTypes, messages, onChange = () => {} }) {
    const data = [
        {
            id: 1,
            title: "Knowledge Development",
            status: "KNOWLEDGE_DEVELOPMENT"
        },
        {
            id: 2,
            title: "Research and Evaluation Design",
            status: "RESEARCH_AND_EVALUATION_DESIGN"
        },
        {
            id: 3,
            title: "Descriptive Study",
            status: "DESCRIPTIVE_STUDY"
        },
        {
            id: 4,
            title: "Impact Study",
            status: "IMPACT_STUDY"
        },
        {
            id: 5,
            title: "Capacity Building",
            status: "CAPACITY_BUILDING"
        },
        {
            id: 6,
            title: " Translation and Communication",
            status: "TRANSLATION_AND_COMMUNICATION"
        }
    ];

    const handleChange = (researchTypes) => {
        setResearchTypes(researchTypes);
        onChange("research_types", researchTypes);
    };
    return (
        <div className="display-flex flex-column width-full">
            <label
                className={` ${messages.length ? "usa-label--error" : ""}`}
                htmlFor="research-type-combobox-input"
            >
                Research Type
            </label>
            {messages?.length > 0 && (
                <span
                    className="usa-error-message"
                    id="research-types-combobox-input-error-message"
                    role="alert"
                >
                    {messages[0]}
                </span>
            )}
            <p className="usa-hint margin-top-neg-2px margin-bottom-1">Select all that apply</p>
            <ComboBox
                selectedData={researchTypes}
                setSelectedData={handleChange}
                namespace="research-type-combobox"
                data={data}
                defaultString="not implemented yet"
                isMulti={true}
                messages={messages}
            />
        </div>
    );
}

export default ResearchTypeComboBox;
