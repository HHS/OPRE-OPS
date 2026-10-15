import AgreementsTable from "../../../../components/Agreements/AgreementsTable";
import Input from "../../../../components/UI/Form/Input/Input";
import useAgreementOdnLookup, { ODN_LOOKUP_STATUS } from "./AgreementOdnLookup.hooks";

/**
 * Lookup widget that finds an agreement by its exact order/document number (ODN).
 * @component
 * @returns {React.ReactElement} - The rendered component.
 */
export const AgreementOdnLookup = () => {
    const { inputValue, queriedValue, status, matches, handleChange, handleSubmit } = useAgreementOdnLookup();

    return (
        <div data-cy="agreement-odn-lookup">
            <form
                onSubmit={handleSubmit}
                className="display-flex flex-align-end"
                data-testid="agreement-odn-lookup-form"
            >
                <Input
                    name="agreement-odn-lookup-input"
                    label="Find agreement by ODN"
                    onChange={handleChange}
                    value={inputValue}
                />
                <button
                    type="submit"
                    className="usa-button margin-left-1"
                    data-cy="agreement-odn-lookup-submit"
                    disabled={status === ODN_LOOKUP_STATUS.LOADING && inputValue.trim() === queriedValue}
                >
                    Find
                </button>
            </form>

            {status === ODN_LOOKUP_STATUS.LOADING && (
                <div
                    role="status"
                    aria-live="polite"
                >
                    <span className="usa-sr-only">Searching for agreement…</span>
                </div>
            )}

            {status === ODN_LOOKUP_STATUS.MULTIPLE && (
                <div
                    className="margin-top-2"
                    data-cy="agreement-odn-lookup-multiple"
                >
                    <div
                        role="status"
                        aria-live="polite"
                    >
                        {/* Deliberately not a heading: this sits between the page's <h1> and <h2>
                            subtitle, so an <h3> here would skip/invert the heading hierarchy. */}
                        <p className="margin-bottom-1 text-bold">
                            {matches.length} agreements match ODN &quot;{queriedValue}&quot;
                        </p>
                    </div>
                    <AgreementsTable
                        agreements={matches}
                        sortConditions={null}
                        sortDescending={false}
                        setSortConditions={() => {}}
                        selectedFiscalYear="All"
                        disableRowActions
                        disableSorting
                    />
                </div>
            )}

            {status === ODN_LOOKUP_STATUS.NONE && (
                <div
                    id="agreement-odn-lookup-no-match"
                    role="status"
                    aria-live="polite"
                    className="margin-top-2"
                    data-cy="agreement-odn-lookup-no-match"
                >
                    No agreements found with ODN &quot;{queriedValue}&quot;.
                </div>
            )}
        </div>
    );
};

export default AgreementOdnLookup;
