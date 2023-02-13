import store from "../../../store";
import { getCurrentFiscalYear } from "../../../helpers/utils";

test("initial state", () => {
    const state = store.getState().portfolio;
    expect(state.portfolio).toEqual({});
    expect(state.portfolioCans).toEqual([]);
    expect(state.portfolioCansFundingDetails).toEqual([]);
    expect(state.selectedFiscalYear).toEqual({ value: getCurrentFiscalYear(new Date()) });
    expect(state.researchProjects).toEqual([]);
});
