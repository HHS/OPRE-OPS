import GrantNumberListItem from "../GrantNumberListItem";

/**
 * @component
 * @param {Object} props
 * @param {Array<any>} props.grantNumbers - The list of grant numbers.
 * @param {Function} props.setFormDataById - The function to set the form data by ID.
 * @param {Function} props.handleDelete - The function to handle the deletion of a grant number.
 * @returns {React.ReactElement}
 *
 * @example
 * <GrantNumbersList grantNumbers={grantNumbers} setFormDataById={setFormDataById} handleDelete={handleDelete} />
 */
function GrantNumbersList({ grantNumbers, setFormDataById, handleDelete }) {
    const sortedGrantNumbers = [...grantNumbers].sort((a, b) => a.number - b.number);

    return (
        <section
            className="margin-top-6"
            data-cy="grant-number-list"
        >
            {grantNumbers && grantNumbers?.length > 0 ? (
                sortedGrantNumbers.map((item, index) => (
                    <GrantNumberListItem
                        key={`${item.number}-${index}`}
                        id={item.number}
                        title={item.display_title}
                        periodStart={item.period_start}
                        periodEnd={item.period_end}
                        description={item.description}
                        setFormDataById={setFormDataById}
                        handleDelete={handleDelete}
                    />
                ))
            ) : (
                <p className="text-center margin-y-7">You have not added any Grants Numbers yet.</p>
            )}
        </section>
    );
}

export default GrantNumbersList;
