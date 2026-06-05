import { useState } from "react";
import DoubleRangeSlider from "./DoubleRangeSlider";

export default {
    title: "UI/Slider/DoubleRangeSlider",
    component: DoubleRangeSlider,
    parameters: {
        docs: {
            description: {
                component:
                    "Dual-thumb range slider built on `react-slider` with styled-components. " +
                    "Fully controlled — parent must manage `value` state and pass a `handleChange` callback."
            }
        }
    }
};

export const Default = {
    render: () => {
        const [value, setValue] = useState([25, 75]);
        return (
            <DoubleRangeSlider
                value={value}
                handleChange={setValue}
            />
        );
    }
};

export const NarrowRange = {
    render: () => {
        const [value, setValue] = useState([40, 60]);
        return (
            <DoubleRangeSlider
                value={value}
                handleChange={setValue}
            />
        );
    }
};

export const FullRange = {
    render: () => {
        const [value, setValue] = useState([0, 100]);
        return (
            <DoubleRangeSlider
                value={value}
                handleChange={setValue}
            />
        );
    }
};
