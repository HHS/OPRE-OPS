import ServicesComponentListItem from "../ServicesComponentListItem";
import { formatServiceComponent } from "../ServicesComponents.helpers";

/**
 * @component
 * @param {Object} props
 * @param {string} props.serviceTypeReq - The type of service requirement.
 * @param {Array<any>} props.servicesComponents - The list of service components.
 * @param {Function} props.setFormDataById - The function to set the form data by ID.
 * @param {Function} props.handleDelete - The function to handle the deletion of a service component.
 * @returns {React.ReactElement}
 *
 * @example
 * <ServicesComponentsList servicesComponents={servicesComponents} setFormDataById={setFormDataById} handleDelete={handleDelete} />
 */
function ServicesComponentsList({ serviceTypeReq, servicesComponents, setFormDataById, handleDelete }) {
    const sortedServicesComponents = [...servicesComponents].sort((a, b) => a.number - b.number);

    return (
        <section
            className="margin-top-6"
            data-cy="services-component-list"
        >
            {servicesComponents && servicesComponents?.length > 0 ? (
                sortedServicesComponents.map((item) => (
                    <ServicesComponentListItem
                        key={item.number}
                        id={item.number}
                        number={item.number}
                        title={item.display_title ?? formatServiceComponent(item.number, item.optional, serviceTypeReq)}
                        periodStart={item.period_start}
                        periodEnd={item.period_end}
                        description={item.description}
                        setFormDataById={setFormDataById}
                        handleDelete={handleDelete}
                    />
                ))
            ) : (
                <p className="text-center margin-y-7">You have not added any Services Component yet.</p>
            )}
        </section>
    );
}

export default ServicesComponentsList;
