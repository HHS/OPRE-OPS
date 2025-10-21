import { useGetAgreementAgenciesQuery } from "../../../api/opsAPI";
import ComboBox from "../../UI/Form/ComboBox";

/**
 * @param {Object} props
 * @param {"Servicing"|"Requesting"} props.agencyType
 * @param {Function} props.setAgency
 * @param {Function} props.onChange
 * @param {string|number} props.value
 * @param {string} props.className
 * @param {string[]} props.messages
 * @returns {React.ReactElement}
 */
const AgencySelect = ({ agencyType, setAgency, onChange, value, className, messages, ...rest }) => {
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

    // const options = data?.map((agency) => ({
    //     label: `${agency.name} (${agency.abbreviation})`,
    //     value: agency.id
    // }));

    const handleChange = (agency) => {
        console.log("** Got here**")
        console.log(`Selected ${agencyType} Agency:`, agency);
        setAgency(+agency.id);
        onChange(`${agencyType.toLowerCase()}_agency_id`, agency.id);
    }
    //            label={`${agencyType} Agency`}

    return (
        <ComboBox
            namespace={`${agencyType.toLowerCase()}-agency`}
            data={data}
            selectedData={value}
            setSelectedData={handleChange}
            defaultString="-Select an option-"
            optionText={(agency) => agency.name ?? agency.abbr}
            messages={messages}
            className={className}
            isMulti={false}
            {...rest}
        />
    );
};

export default AgencySelect;
