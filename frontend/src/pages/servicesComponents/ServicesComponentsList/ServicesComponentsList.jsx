import PropTypes from "prop-types";
import ServicesComponentListItem from "../ServicesComponentListItem";
import DebugCode from "../DebugCode";

/**
 * ServicesComponentsList is a component that displays a list of service components.
 *
 * @component
 * @param {object} props
 * @param {Array<any>} props.servicesComponents - The list of service components.
 * @param {function} props.setFormDataById - The function to set the form data by ID.
 * @param {function} props.handleDelete - The function to handle the deletion of a service component.
 * @returns {JSX.Element}
 *
 * @example
 * <ServicesComponentsList servicesComponents={servicesComponents} setFormDataById={setFormDataById} handleDelete={handleDelete} />
 */
function ServicesComponentsList({ servicesComponents, setFormDataById, handleDelete }) {
    const sortedServicesComponents = [...servicesComponents].sort((a, b) => a.number - b.number);

    return (
        <section className="margin-top-6">
            {servicesComponents.length > 0 ? (
                sortedServicesComponents.map((item) => (
                    <ServicesComponentListItem
                        key={item.id}
                        id={item.id}
                        title={item.display_title}
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
            <DebugCode
                title="services components"
                data={servicesComponents}
            />
        </section>
    );
}

ServicesComponentsList.propTypes = {
    servicesComponents: PropTypes.array.isRequired,
    serviceTypeReq: PropTypes.string.isRequired,
    setFormDataById: PropTypes.func.isRequired,
    handleDelete: PropTypes.func.isRequired
};
export default ServicesComponentsList;
