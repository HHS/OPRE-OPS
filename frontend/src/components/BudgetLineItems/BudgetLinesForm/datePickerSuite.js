import { create, test, enforce, only } from "vest";
import { USER_ROLES } from "../../Users/User.constants";

const suite = create((data = {}, fieldNameOrUserRoles) => {
    // Handle both old signature (data, fieldName) and new signature (data, userRoles)
    let fieldName;
    let actualUserRoles;

    if (typeof fieldNameOrUserRoles === "string") {
        // Old signature: (data, fieldName)
        fieldName = fieldNameOrUserRoles;
        actualUserRoles = [];
    } else {
        // New signature: (data, userRoles)
        fieldName = null;
        actualUserRoles = Array.isArray(fieldNameOrUserRoles) ? fieldNameOrUserRoles : [];
    }

    const isSuperUser = Array.isArray(actualUserRoles) && actualUserRoles.includes(USER_ROLES.SUPER_USER);

    // skip all validations if user is a super user
    if (isSuperUser) {
        return;
    }

    if (fieldName) {
        only(fieldName);
    }

    // Only validate the needbyDate field if it has a value since it is not required
    if (data.needByDate === null || data.needByDate === "") {
        return;
    }
    test("needByDate", "Date must be MM/DD/YYYY", () => {
        enforce(data.needByDate).matches(/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/);
    });
    test("needByDate", "Date must be in the future", () => {
        const today = new Date();
        const enteredDate = new Date(data.needByDate);
        enforce(enteredDate.getTime()).greaterThan(today.getTime());
    });
});

export default suite;
