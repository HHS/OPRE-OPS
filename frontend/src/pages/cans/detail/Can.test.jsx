import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildTrailState, LIST_CRUMBS } from "../../../helpers/breadcrumb.helpers";
import Can from "./Can";

const spendingProps = vi.fn();

vi.mock("./Can.hooks", () => ({
    default: () => ({
        can: { id: 1, display_name: "G994426" },
        canId: 1,
        fiscalYear: 2027,
        isLoading: false,
        isEditMode: { detailPage: false, fundingPage: false }
    })
}));
vi.mock("../../../App", () => ({ default: ({ children }) => <div>{children}</div> }));
vi.mock("../../../components/CANs/CanDetailTabs/CanDetailTabs", () => ({ default: () => null }));
vi.mock("../list/CANFiscalYearSelect", () => ({ default: () => null }));
vi.mock("./CanDetail", () => ({ default: () => null }));
vi.mock("./CanFunding", () => ({ default: () => null }));
vi.mock("./CanSpending", () => ({
    default: (props) => {
        spendingProps(props);
        return null;
    }
}));

const renderCanSpending = (ancestors) =>
    render(
        <MemoryRouter initialEntries={[{ pathname: "/cans/1/spending", state: buildTrailState("/cans/1", ancestors) }]}>
            <Routes>
                <Route
                    path="/cans/:id/*"
                    element={<Can />}
                />
            </Routes>
        </MemoryRouter>
    );

const ownCrumb = { label: "G994426", to: "/cans/1/spending?fy=2027" };

describe("Can breadcrumb ancestry for agreement links", () => {
    beforeEach(() => spendingProps.mockClear());

    it("builds on the trail when the CAN was reached from its portfolio", () => {
        const portfolio = { label: "Portfolio A", to: "/portfolios/3/funding" };
        renderCanSpending([LIST_CRUMBS.portfolios, portfolio]);
        expect(spendingProps.mock.lastCall[0].ancestry).toEqual([LIST_CRUMBS.portfolios, portfolio, ownCrumb]);
    });

    it("starts over at the CANs list when the CAN was reached from a project", () => {
        renderCanSpending([
            { label: "Projects", to: "/projects?filter=my-projects" },
            { label: "Project X", to: "/projects/1002/funding?fy=2027" }
        ]);
        expect(spendingProps.mock.lastCall[0].ancestry).toEqual([LIST_CRUMBS.cans, ownCrumb]);
    });
});
