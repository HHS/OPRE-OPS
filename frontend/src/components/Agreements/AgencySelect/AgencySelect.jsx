import { useGetAgreementAgenciesQuery } from "../../../api/opsAPI";
import Select from "../../UI/Form/Select";

/**
 * @param {Object} props
 * @param {"SERVICING"|"REQUESTING"} props.agencyType
 * @param {Function} props.onChange
 * @param {string|number} props.value
 * @param {string} [props.className]
 * @returns {JSX.Element}
 */
const AgencySelect = ({ agencyType, onChange, value, className }) => {
    /** @typedef {import("../../../types/AgreementTypes").Agency} Agency */
    /** @type {{data?: Agency[] | undefined, isError: boolean,  isLoading: boolean}} */
    const { data, isLoading, isError } = useGetAgreementAgenciesQuery({ [agencyType.toLowerCase()]: true });

    if (isLoading) {
        return <div>Loading...</div>;
    }
    if (isError) {
        console.error("Error loading agencies");
        return <div>Error loading agencies</div>;
    }

    const options = data?.map((agency) => ({
        label: `${agency.name} (${agency.abbreviation})`,
        value: agency.id
    }));

    return (
        <>
            <Select

                name={`${agencyType.toLowerCase()}-agency`}
                label={`${agencyType} Agency`}
                options={options}
                onChange={onChange}
                value={value}
                className={className}
            />
        </>
    );
};

export default AgencySelect;
