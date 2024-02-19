import Select from "../Select";

function ContractTypeSelect({ value, onChange, ...rest }) {
    return (
        <Select
            name="contractType"
            label="Contract Type"
            options={CONTRACT_TYPE_OPTIONS}
            onChange={onChange}
            value={value}
            messages={[]}
            {...rest}
        />
    );
}

const CONTRACT_TYPE_OPTIONS = [
    {
        label: "Firm Fixed Price (FFP)",
        value: "FIRM_FIXED_PRICE"
    },
    {
        label: "Time & Materials (T&M)",
        value: "TIME_AND_MATERIALS"
    },
    {
        label: "Labor Hour (LH)",
        value: "LABOR_HOUR"
    },
    {
        label: "Cost Plus Fixed Fee (CPFF)",
        value: "COST_PLUS_FIXED_FEE"
    },
    {
        label: "Cost Plus Award Fee (CPAF)",
        value: "COST_PLUS_AWARD_FEE"
    }
];

export default ContractTypeSelect;
