import ServicesComponentListItem from "../ServicesComponentListItem";

/**
 * @component
 * @param {Object} props
 * @param {Array<any>} props.servicesComponents - The list of service components.
 * @param {Function} props.setFormDataById - The function to set the form data by ID.
 * @param {Function} props.handleDelete - The function to handle the deletion of a service component.
 * @returns {React.ReactElement}
 *
 * @example
 * <ServicesComponentsList servicesComponents={servicesComponents} setFormDataById={setFormDataById} handleDelete={handleDelete} />
 */
function ServicesComponentsList({ servicesComponents, setFormDataById, handleDelete }) {
    const sortedServicesComponents = [...servicesComponents].sort((a, b) => {
        // First, sort by number
        if (a.number !== b.number) {
            return a.number - b.number;
        }

        // If numbers are the same, sort by sub_component
        // Items without sub_component come first
        if (!a.sub_component && !b.sub_component) return 0;
        if (!a.sub_component) return -1;
        if (!b.sub_component) return 1;

        // Both have sub_component, use natural sorting for alphanumeric values
        return String(a.sub_component).localeCompare(String(b.sub_component), undefined, {
            numeric: true,
            sensitivity: "base"
        });
    });

    return (
        <section
            className="margin-top-6"
            data-cy="services-component-list"
        >
            {servicesComponents && servicesComponents?.length > 0 ? (
                sortedServicesComponents.map((item, index) => (
                    <ServicesComponentListItem
                        key={`${item.number}-${index}`}
                        id={item.number}
                        number={item.number}
                        title={`${item.display_title}${item.sub_component ? `-${item.sub_component}` : ""}`}
                        periodStart={item.period_start}
                        periodEnd={item.period_end}
                        description={item.description}
                        setFormDataById={setFormDataById}
                        handleDelete={handleDelete}
                        isSubComponent={!!item.sub_component}
                    />
                ))
            ) : (
                <p className="text-center margin-y-7">You have not added any Services Component yet.</p>
            )}
        </section>
    );
}

export default ServicesComponentsList;
