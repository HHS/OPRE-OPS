import { useState } from "react";
import ProcShopComboBox from "./ProcShopComboBox";

const sampleProcShops = [
    { id: 1, abbr: "GCS" },
    { id: 2, abbr: "PSC" },
    { id: 3, abbr: "NIH" }
];

export default {
    title: "UI/Form/ProcShopComboBox",
    component: ProcShopComboBox,
    parameters: {
        docs: {
            description: {
                component:
                    "A multi-select ComboBox for filtering by procurement shop. Renders the shop `abbr` as the option text."
            }
        }
    }
};

export const Default = {
    args: {
        procShopOptions: sampleProcShops,
        procShop: []
    },
    render: (args) => {
        const [procShop, setProcShop] = useState(args.procShop);
        return (
            <ProcShopComboBox
                {...args}
                procShop={procShop}
                setProcShop={setProcShop}
            />
        );
    }
};

export const WithSelection = {
    args: {
        procShopOptions: sampleProcShops,
        procShop: [sampleProcShops[0]]
    },
    render: (args) => {
        const [procShop, setProcShop] = useState(args.procShop);
        return (
            <ProcShopComboBox
                {...args}
                procShop={procShop}
                setProcShop={setProcShop}
            />
        );
    }
};
