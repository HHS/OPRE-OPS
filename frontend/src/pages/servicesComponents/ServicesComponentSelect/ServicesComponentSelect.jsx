import Select from "../Select";

function ServicesComponentSelect({ value, onChange, options }) {
    return (
        <Select
            name="servicesComponentSelect"
            label="Services Component"
            onChange={onChange}
            value={value}
            messages={[]}
            defaultOption=""
            options={options}
            valueOverride={true}
        />
    );
}

export default ServicesComponentSelect;
