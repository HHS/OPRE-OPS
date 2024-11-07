/**
    @typedef {Object} PageHeaderProps
    @property {string} title
    @property {string} [subTitle]
*/

/**
 * @component - Renders a page header with a title and optional subtitle.
 * @param {PageHeaderProps} props - The properties passed to the component.
 * @returns {JSX.Element} - The rendered component.
 */
const PageHeader = ({ title, subTitle }) => {
    return (
        <div className="margin-bottom-3">
            <h1 className="margin-0 text-brand-primary font-sans-2xl">{title}</h1>
            {subTitle && <p className="font-sans-3xs margin-0">{subTitle}</p>}
        </div>
    );
};

export default PageHeader;
