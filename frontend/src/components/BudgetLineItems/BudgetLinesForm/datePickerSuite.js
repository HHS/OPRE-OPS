import { create, test, enforce } from "vest";

const DATE_FORMAT_REGEX = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;

const suite = create((data = {}, isSuperUser) => {
    // skip all validations if user is a super user
    if (isSuperUser) {
        return;
    }

    // Only validate the needbyDate field if it has a value since it is not required
    if (data.needByDate === null || data.needByDate === "") {
        return;
    }
    test("needByDate", "Date must be MM/DD/YYYY", () => {
        enforce(data.needByDate).matches(DATE_FORMAT_REGEX);
    });
    test("needByDate", "Date must be in the future", () => {
        const today = new Date();
        const enteredDate = new Date(data.needByDate);
        enforce(enteredDate.getTime()).greaterThan(today.getTime());
    });
    if (data.needByDate && DATE_FORMAT_REGEX.test(data.needByDate) && (data.scStartDate || data.scEndDate)) {
        test("needByDate", "Date must fall within the agreement's period of performance", () => {
            const [month, day, year] = data.needByDate.split("/");
            const enteredDateStr = `${year}-${month}-${day}`;
            enforce(
                (!data.scStartDate || enteredDateStr >= data.scStartDate) &&
                    (!data.scEndDate || enteredDateStr <= data.scEndDate)
            ).isTruthy();
        });
    }
});

export default suite;
