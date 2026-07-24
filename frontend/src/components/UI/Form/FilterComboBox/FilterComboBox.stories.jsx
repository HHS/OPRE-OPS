import { useState } from "react";
import FilterComboBox from "./FilterComboBox";

const sampleProcShops = [
    { id: 1, abbr: "GCS" },
    { id: 2, abbr: "PSC" },
    { id: 3, abbr: "NIH" }
];

const sampleDivisions = [
    { id: 1, name: "Division of Child and Family Development", abbreviation: "DCFD" },
    { id: 2, name: "Division of Economic Independence", abbreviation: "DEI" },
    { id: 3, name: "Division of Family Strengthening", abbreviation: "DFS" }
];

export default {
    title: "UI/Form/FilterComboBox",
    component: FilterComboBox,
    parameters: {
        docs: {
            description: {
                component:
                    "A labelled multi-select ComboBox for filtering by a single field. Parameterize `label`, `namespace` and `optionText` to back any filter."
            }
        }
    }
};

export const ProcurementShop = {
    args: {
        label: "Procurement Shop",
        namespace: "proc-shop-combobox",
        options: sampleProcShops,
        selected: [],
        optionText: (shop) => shop.abbr
    },
    render: (args) => {
        const [selected, setSelected] = useState(args.selected);
        return (
            <FilterComboBox
                {...args}
                selected={selected}
                setSelected={setSelected}
            />
        );
    }
};

export const Division = {
    args: {
        label: "Division",
        namespace: "division-combobox",
        options: sampleDivisions,
        selected: [sampleDivisions[0]],
        optionText: (division) => division.name
    },
    render: (args) => {
        const [selected, setSelected] = useState(args.selected);
        return (
            <FilterComboBox
                {...args}
                selected={selected}
                setSelected={setSelected}
            />
        );
    }
};
