import { useState } from "react";
import BudgetRangeSlider from "./BudgetRangeSlider";

export default {
    title: "UI/Slider/BudgetRangeSlider",
    component: BudgetRangeSlider,
    parameters: {
        docs: {
            description: {
                component:
                    "Budget-aware range slider that displays currency-formatted min/max values. " +
                    "Wraps DoubleRangeSlider and converts percentage-based slider positions into dollar amounts."
            }
        }
    }
};

export const Default = {
    render: () => {
        const [selectedRange, setSelectedRange] = useState([200_000, 800_000]);
        return (
            <BudgetRangeSlider
                budgetRange={[0, 1_000_000]}
                selectedRange={selectedRange}
                setSelectedRange={setSelectedRange}
            />
        );
    }
};

export const NarrowBudget = {
    render: () => {
        const [selectedRange, setSelectedRange] = useState([50_000, 150_000]);
        return (
            <BudgetRangeSlider
                budgetRange={[0, 200_000]}
                selectedRange={selectedRange}
                setSelectedRange={setSelectedRange}
                label="Small Budget Range"
            />
        );
    }
};

export const FullRange = {
    render: () => {
        const [selectedRange, setSelectedRange] = useState([0, 5_000_000]);
        return (
            <BudgetRangeSlider
                budgetRange={[0, 5_000_000]}
                selectedRange={selectedRange}
                setSelectedRange={setSelectedRange}
            />
        );
    }
};
