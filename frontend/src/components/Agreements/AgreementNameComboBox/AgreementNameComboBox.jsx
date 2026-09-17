import { useMemo, useEffect } from "react";
import ComboBox from "../../UI/Form/ComboBox";
import { useNavigate } from "react-router-dom";
import { useGetAllAgreements } from "../../../hooks/useGetAllAgreements";
import { getAgreementDisplayName } from "../../../helpers/agreement.helpers";

/**
 * Builds the shared option shape used by both the pre-fetched-options branch and the
 * derived-fetch branch of computedAgreementNameOptions below, so a future field addition
 * only needs to change one place. Ref: issue #6144.
 * @param {{id: number, name?: string, nick_name?: string}} agreement
 */
const buildAgreementNameOption = (agreement) => {
    const display = getAgreementDisplayName(agreement);
    return {
        id: agreement.id,
        title: display,
        name: agreement.name,
        nick_name: agreement.nick_name,
        display_name: display,
        searchText: [agreement.name, agreement.nick_name].filter(Boolean).join(" ")
    };
};

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
    isLoading = false,
    filterLabel = "Agreement Title"
}) => {
    const navigate = useNavigate();

    // Fetch all agreements to get unique names using pagination (only if options not provided)
    const {
        agreements,
        error,
        isLoading: isAgreementsLoading
    } = useGetAllAgreements(
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
        // Both branches below build the same option shape so downstream consumers
        // (AgreementsFilterTags, BLIFilterTags) don't need to special-case which path
        // produced the option — see buildAgreementNameOption.
        if (agreementNameOptions !== null) {
            return agreementNameOptions.map(buildAgreementNameOption);
        }

        // Otherwise, fetch from agreements
        if (!agreements || agreements.length === 0) return [];

        // Create a Map to ensure uniqueness by agreement id — NOT by the rendered display
        // string. Keying by the string would let one agreement's nickname collide with a
        // different agreement's full name (or vice versa), silently dropping the loser from
        // this Map. Duplicate labels among distinct ids are a legitimate (if confusing) UI
        // state; a lost agreement is a data bug. Ref: issue #6144 trap 4.
        const uniqueAgreements = new Map();

        agreements.forEach((agreement) => {
            if (getAgreementDisplayName(agreement) && !uniqueAgreements.has(agreement.id)) {
                uniqueAgreements.set(agreement.id, buildAgreementNameOption(agreement));
            }
        });

        // Convert Map to array and sort alphabetically
        return Array.from(uniqueAgreements.values()).sort((a, b) => a.title.localeCompare(b.title));
    }, [agreements, agreementNameOptions]);

    // Handle navigation on error in useEffect to avoid state updates during render
    useEffect(() => {
        if (error) {
            navigate("/error");
        }
    }, [error, navigate]);

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
                        isLoading={isLoading || (agreementNameOptions === null && isAgreementsLoading)}
                    />
                </div>
            </div>
        </div>
    );
};

export default AgreementNameComboBox;
