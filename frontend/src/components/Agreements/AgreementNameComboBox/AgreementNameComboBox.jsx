import { useMemo, useEffect } from "react";
import ComboBox from "../../UI/Form/ComboBox";
import { useNavigate } from "react-router-dom";
import { useGetAllAgreements } from "../../../hooks/useGetAllAgreements";

/**
 * A comboBox for choosing Agreement Name(s).
 * Fetches all agreements and extracts unique names for the filter options.
 * @param {Object} props - The component props.
 * @param {object[]} props.selectedAgreementNames - The currently selected agreement names.
 * @param {Function} props.setSelectedAgreementNames - A function to call when the selected agreement names change.
 * @param {string} [props.legendClassname] - Additional CSS classes to apply to the label/legend (optional).
 * @param {string} [props.defaultString] - Initial text to display in select (optional).
 * @param {Object} [props.overrideStyles] - Some CSS styles to override the default (optional).
 * @param {object[] | null} [props.agreementNameOptions] - Optional pre-fetched agreement name options from API (optional).
 * @param {string} [props.filterLabel] - Label for the filter (optional, defaults to "Agreement Title").
 * @returns {React.ReactElement} - The rendered component.
 */
export const AgreementNameComboBox = ({
    selectedAgreementNames,
    setSelectedAgreementNames,
    legendClassname = "usa-label margin-top-0",
    defaultString = "",
    overrideStyles = {},
    agreementNameOptions = null,
    filterLabel = "Agreement Title"
}) => {
    const navigate = useNavigate();

    // Fetch all agreements to get unique names using pagination (only if options not provided)
    const { agreements, error, isLoading } = useGetAllAgreements(
        {
            filters: {},
            onlyMy: false,
            sortConditions: "",
            sortDescending: false
        },
        { skip: agreementNameOptions !== null }
    );

    // Extract unique agreement names and create options
    const computedAgreementNameOptions = useMemo(() => {
        // If options provided via props, use them directly
        if (agreementNameOptions !== null) {
            return agreementNameOptions.map((option) => ({
                id: option.id,
                title: option.name,
                name: option.name
            }));
        }

        // Otherwise, fetch from agreements
        if (!agreements || agreements.length === 0) return [];

        // Create a Map to ensure uniqueness by display_name
        const uniqueNames = new Map();

        agreements.forEach((agreement) => {
            if (agreement.display_name && !uniqueNames.has(agreement.display_name)) {
                uniqueNames.set(agreement.display_name, {
                    id: agreement.id,
                    title: agreement.display_name,
                    display_name: agreement.display_name
                });
            }
        });

        // Convert Map to array and sort alphabetically
        return Array.from(uniqueNames.values()).sort((a, b) => a.title.localeCompare(b.title));
    }, [agreements, agreementNameOptions]);

    // Handle navigation on error in useEffect to avoid state updates during render
    useEffect(() => {
        if (error) {
            navigate("/error");
        }
    }, [error, navigate]);

    // Only show loading if we're fetching and options weren't provided
    if (isLoading && agreementNameOptions === null) {
        return <h1>Loading...</h1>;
    }

    return (
        <div className="display-flex flex-justify">
            <div>
                <label
                    className={legendClassname}
                    htmlFor="agreement-name-combobox-input"
                >
                    {filterLabel}
                </label>
                <div>
                    <ComboBox
                        namespace="agreement-name-combobox"
                        data={computedAgreementNameOptions}
                        selectedData={selectedAgreementNames}
                        setSelectedData={setSelectedAgreementNames}
                        defaultString={defaultString}
                        overrideStyles={overrideStyles}
                        isMulti={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default AgreementNameComboBox;
