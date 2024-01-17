import React from "react";
import ComboBox from "../ComboBox";

function ResearchTypeComboBox({ legendClassName = "usa-label margin-top-0" }) {
    const [selected, setSelected] = React.useState([]);
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
    return (
        <div className="display-flex flex-column width-full">
            <label
                className={legendClassName}
                htmlFor="research-type-combobox-input"
            >
                Research Type
            </label>
            <p className="usa-hint margin-top-neg-2px margin-bottom-1">Select all that apply</p>
            <ComboBox
                selectedData={selected}
                setSelectedData={setSelected}
                namespace="research-type-combobox"
                data={data}
                defaultString="not implemented yet"
                isMulti={true}
            />
        </div>
    );
}

export default ResearchTypeComboBox;
