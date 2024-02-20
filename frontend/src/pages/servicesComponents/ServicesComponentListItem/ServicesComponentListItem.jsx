import RoundedBox from "../../../components/UI/RoundedBox";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import Tag from "../../../components/UI/Tag";
import { formatServiceComponent, dateToYearMonthDay } from "../servicesComponents.helpers";

const Header = ({ servicesComponent, optional, serviceTypeReq, title }) => {
    // const formattedServiceComponent = formatServiceComponent(servicesComponent, optional, serviceTypeReq);

    // return <h2 className="margin-0">{formattedServiceComponent}</h2>;
    return <h2 className="margin-0">{title}</h2>;
};

function ServicesComponentListItem({ item, setFormDataById, handleDelete, serviceTypeReq }) {
    const { year: popStartYear, month: popStartMonth, day: popStartDay } = dateToYearMonthDay(item?.period_start);
    const { year: popEndYear, month: popEndMonth, day: popEndDay } = dateToYearMonthDay(item?.period_end);

    return (
        <RoundedBox
            className="width-full flex-column padding-2 margin-top-4"
            style={{ width: "100%", height: "auto", minHeight: "8.375rem" }}
        >
            <section className="display-flex flex-justify">
                <Header
                    servicesComponent={item.number}
                    optional={item.optional}
                    serviceTypeReq={serviceTypeReq}
                    title={item.display_title}
                />
                <div>
                    <button
                        id="edit"
                        onClick={() => setFormDataById(item.id)}
                    >
                        <FontAwesomeIcon
                            icon={faPen}
                            size="2x"
                            className="text-primary height-2 width-2 margin-right-1 cursor-pointer usa-tooltip"
                            title="edit"
                            data-position="top"
                        />
                    </button>
                    <button
                        id="delete"
                        onClick={() => {
                            handleDelete(item.id);
                        }}
                    >
                        <FontAwesomeIcon
                            icon={faTrash}
                            size="2x"
                            className="text-primary height-2 width-2 cursor-pointer usa-tooltip"
                            title="delete"
                            data-position="top"
                        />
                    </button>
                </div>
            </section>
            <section className="margin-top-0">
                <dl className="display-flex font-12px">
                    <div>
                        <dt className="margin-0 text-base-dark margin-top-1px">Period of Performance - Start</dt>
                        <dd className="margin-0 margin-top-1">
                            <Tag tagStyle="primaryDarkTextLightBackground">
                                {popStartMonth}/{popStartDay}/{popStartYear}
                            </Tag>
                        </dd>
                    </div>
                    <div className="margin-left-4">
                        <dt className="margin-0 text-base-dark margin-top-1px">Period of Performance - End</dt>
                        <dd className="margin-0 margin-top-1">
                            <Tag tagStyle="primaryDarkTextLightBackground">
                                {popEndMonth}/{popEndDay}/{popEndYear}
                            </Tag>
                        </dd>
                    </div>
                    <div
                        className="margin-left-8"
                        style={{ width: "25rem" }}
                    >
                        <dt className="margin-0 text-base-dark margin-top-1px">Description</dt>
                        <dd className="margin-0 margin-top-05 text-semibold">{item.description}</dd>
                    </div>
                </dl>
            </section>
        </RoundedBox>
    );
}

export default ServicesComponentListItem;
