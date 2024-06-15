/**
 * A wrapper component for displaying filter tags.
 *
 * @component
 * @param {Object} props - The props object containing children.
 * @param {React.ReactNode} props.children - The child components to be rendered.
 * @returns {JSX.Element} - The JSX element representing the filter tags wrapper.
 */
const FilterTagsWrapper = ({ children }) => {
    return (
        <div className="display-flex flex-align-center flex-wrap padding-bottom-205">
            <span className="padding-right-205 text-base-dark font-sans-3xs line-height-sans-5 padding-top-05">
                Filters Applied:
            </span>
            {children}
        </div>
    );
};

export default FilterTagsWrapper;
