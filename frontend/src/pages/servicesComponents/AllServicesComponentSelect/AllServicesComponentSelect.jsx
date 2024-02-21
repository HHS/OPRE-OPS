import Select from "../Select";
import { useGetServicesComponentsListQuery } from "../../../api/opsAPI";

function AllServicesComponentSelect({ value, onChange, options, agreementId }) {
    const { data: servicesComponents } = useGetServicesComponentsListQuery(agreementId);

    const selectOptions = servicesComponents?.map((serviceComponent) => {
        return {
            value: serviceComponent.id,
            label: serviceComponent.display_name
        };
    });
    return (
        <Select
            name="allServicesComponentSelect"
            label="Services Component"
            onChange={onChange}
            value={value}
            messages={[]}
            defaultOption=""
            options={selectOptions}
        />
    );
}

export default AllServicesComponentSelect;
