import { getCanFiscalYearByCan } from "./getCanFiscalYear";
import store from "../../store";
import TestApplicationContext from "../../applicationContext/TestApplicationContext";
import { dispatchUsecase } from "../../helpers/test";
import constants from "../../constants";
import { setCanFiscalYear, setPendingFunds } from "../../store/canDetailSlice";
import { describe, expect, test } from "@jest/globals";

describe("unit tests for CANBudgetSummary", () => {
    afterEach(() => {
        // TODO: The way the unit tests are currently set up share state between the
        // TODO: tests in a module - it would be a good idea to setup the test framework so that
        // TODO: this work around isn't needed.
        // Clean up the store between tests - re-initialize the store
        store.dispatch(setCanFiscalYear({}));
        store.dispatch(setPendingFunds("--"));
    });

    test("successfully gets the CFY from the backend by can_id and fiscal_year and directly puts it into state", async () => {
        const mockCfyId = 3;
        const mockBackendResponse = {
            id: mockCfyId,
            fiscal_year: 2022,
            otherStuff: "DogCow",
            total_fiscal_year_funding: 10,
            amount_available: 5,
        };
        TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
            return [mockBackendResponse];
        });

        const actualGetCfy = getCanFiscalYearByCan(mockCfyId, 2022);

        await dispatchUsecase(actualGetCfy);

        const canFiscalYear = store.getState().canDetail.canFiscalYearObj;
        expect(canFiscalYear).toEqual(mockBackendResponse);

        const pendingFunds = store.getState().canDetail.pendingFunds;
        expect(pendingFunds).toEqual(
            mockBackendResponse.total_fiscal_year_funding - mockBackendResponse.amount_available
        );
    });

    test("don't get the CAN fiscal year and set the pending funds to the nothing string", async () => {
        TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
            return [];
        });

        const actualGetCfy = getCanFiscalYearByCan(1, 2022);

        await dispatchUsecase(actualGetCfy);

        const canFiscalYear = store.getState().canDetail.canFiscalYearObj;
        expect(canFiscalYear).toEqual({});

        const pendingFunds = store.getState().canDetail.pendingFunds;
        expect(pendingFunds).toEqual(constants.notFilledInText);
    });
});
