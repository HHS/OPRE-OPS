/*
    NOTE: This file contains MOCKED data for the "OPS at a Glance" roadmap status board (OPS-6330).
    NOTE: "Done" and "Currently Developing" items render in this file's authored order.
    NOTE: "Not Started Yet" items are sorted alphabetically at render time (per the Figma footnote).
    NOTE: Real data wiring is handled separately (see OPS-6331).
*/
import { ROADMAP_STATUS } from "./constants";

export const data = [
    { id: 1, title: "Login", status: ROADMAP_STATUS.DONE },
    { id: 2, title: "Navigation", status: ROADMAP_STATUS.DONE },
    { id: 3, title: "Home Page", status: ROADMAP_STATUS.DONE },
    { id: 4, title: "View Portfolios", status: ROADMAP_STATUS.DONE },
    { id: 5, title: "Create, View, Edit Grants", status: ROADMAP_STATUS.DONE },
    { id: 6, title: "View, Export Agreements", status: ROADMAP_STATUS.DONE },
    { id: 7, title: "View, Edit CANs", status: ROADMAP_STATUS.DONE },
    { id: 8, title: "Viewing Award & Mod info", status: ROADMAP_STATUS.CURRENTLY_DEVELOPING },
    { id: 9, title: "Something of a feature", status: ROADMAP_STATUS.CURRENTLY_DEVELOPING },
    { id: 10, title: "Staffing / People & Teams", status: ROADMAP_STATUS.NOT_STARTED },
    { id: 11, title: "Awarding Grants", status: ROADMAP_STATUS.NOT_STARTED },
    { id: 12, title: "Contract Mods", status: ROADMAP_STATUS.NOT_STARTED },
    { id: 13, title: "CAN Statutory Authority", status: ROADMAP_STATUS.NOT_STARTED },
    { id: 14, title: "Vendor Management", status: ROADMAP_STATUS.NOT_STARTED },
    { id: 15, title: "System Owner Dashboard", status: ROADMAP_STATUS.NOT_STARTED }
];
