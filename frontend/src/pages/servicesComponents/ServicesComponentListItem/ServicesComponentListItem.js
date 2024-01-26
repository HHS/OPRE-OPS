import React from "react";
import RoundedBox from "../../../components/UI/RoundedBox";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";

function ServicesComponentListItem({ item }) {
    return (
        <RoundedBox
            className="width-full flex-column padding-2"
            style={{ width: " 100%" }}
        >
            <section className="display-flex flex-justify">
                <h2 className="margin-0">{item.servicesComponent}</h2>
                <div>
                    <button
                        id="edit"
                        onClick={() => {
                            alert("not yet implemented");
                        }}
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
                            alert("not yet implemented");
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
            <section>
                <dl className="display-flex font-12px">
                    <div>
                        <dt className="margin-0 text-base-dark margin-top-3">Period of Performance - Start</dt>
                        <dd className="margin-0 margin-top-05">
                            {item.popStartMonth}/{item.popStartDay}/{item.popStartYear}
                        </dd>
                    </div>
                    <div className="margin-left-4">
                        <dt className="margin-0 text-base-dark margin-top-3">Period of Performace - End</dt>
                        <dd className="margin-0 margin-top-05">
                            {item.popEndMonth}/{item.popEndDay}/{item.popEndYear}
                        </dd>
                    </div>
                    <div
                        className="margin-left-auto"
                        style={{ width: "400px" }}
                    >
                        <dt className="margin-0 text-base-dark margin-top-3">Description</dt>
                        <dd className="margin-0 margin-top-05 text-semibold">{item.description}</dd>
                    </div>
                </dl>
            </section>
        </RoundedBox>
    );
}

export default ServicesComponentListItem;
