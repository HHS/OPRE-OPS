import { useState } from "react";
import DivisionComboBox from "./DivisionComboBox";

const sampleDivisions = [
    { id: 1, name: "Division of Child and Family Development", abbreviation: "DCFD" },
    { id: 2, name: "Division of Economic Independence", abbreviation: "DEI" },
    { id: 3, name: "Division of Family Strengthening", abbreviation: "DFS" }
];

export default {
    title: "UI/Form/DivisionComboBox",
    component: DivisionComboBox,
    parameters: {
        docs: {
            description: {
                component:
                    "A multi-select ComboBox for filtering by division. Renders the division `name` as the option text."
            }
        }
    }
};

export const Default = {
    args: {
        divisionOptions: sampleDivisions,
        division: []
    },
    render: (args) => {
        const [division, setDivision] = useState(args.division);
        return (
            <DivisionComboBox
                {...args}
                division={division}
                setDivision={setDivision}
            />
        );
    }
};

export const WithSelection = {
    args: {
        divisionOptions: sampleDivisions,
        division: [sampleDivisions[0]]
    },
    render: (args) => {
        const [division, setDivision] = useState(args.division);
        return (
            <DivisionComboBox
                {...args}
                division={division}
                setDivision={setDivision}
            />
        );
    }
};
