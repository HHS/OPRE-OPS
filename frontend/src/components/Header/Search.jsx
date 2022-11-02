import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { solid } from "@fortawesome/fontawesome-svg-core/import.macro";

export const Search = () => {
    return (
        <section aria-label="Small search component">
            <form className="usa-search usa-search--small" role="search">
                <label className="usa-sr-only" htmlFor="search-field-en-small">
                    Search
                </label>
                <input className="usa-input" id="search-field-en-small" type="search" name="search" tabIndex="0" />
                <button className="usa-button" type="submit" value="Search">
                    <FontAwesomeIcon icon={solid("magnifying-glass")} title="Search" />
                </button>
            </form>
        </section>
    );
};
