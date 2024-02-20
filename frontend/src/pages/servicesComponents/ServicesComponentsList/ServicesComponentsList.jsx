import ServicesComponentListItem from "../ServicesComponentListItem";
import DebugCode from "../DebugCode";

function ServicesComponentsList({ servicesComponents, serviceTypeReq, setFormDataById, handleDelete }) {
    const sortedServicesComponents = [...servicesComponents].sort((a, b) => a.number - b.number);

    return (
        <section className="margin-top-6">
            {servicesComponents.length > 0 ? (
                sortedServicesComponents.map((item, index) => (
                    <ServicesComponentListItem
                        key={index}
                        item={item}
                        setFormDataById={setFormDataById}
                        handleDelete={handleDelete}
                        serviceTypeReq={serviceTypeReq}
                    />
                ))
            ) : (
                <p>You have not added any Services Component yet.</p>
            )}
            <DebugCode
                title="Services Components"
                data={servicesComponents}
            />
        </section>
    );
}

export default ServicesComponentsList;
