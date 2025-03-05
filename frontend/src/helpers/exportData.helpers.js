import { USER_ROLES } from "../components/Users/User.constants";

/**
 * @description Converts an array of objects to a CSV string.
 * @param {Object[]} data - The array of objects to convert.
 * @returns {string} - The CSV string.
 */
const convertToCSV = (data) => {
  const flattenObject = (obj, parent = '', res = {}) => {
    for (let key in obj) {
      let propName = parent ? `${parent}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        flattenObject(obj[key], propName, res);
      } else {
        res[propName] = obj[key];
      }
    }
    return res;
  };

  const flattenedData = data.map(item => flattenObject(item));
  const headers = Object.keys(flattenedData[0]).join(",");
  const rows = flattenedData.map((row) => Object.values(row).join(",")).join("\n");
  return `${headers}\n${rows}`;
};

/**
 * @description Exports data to a CSV file.
 * @param {Object[]} data - The data to export.
 * @param {import("../components/Users/UserTypes").User} user - The active user.
 * @param {string} fileName - The name of the file to export.
 */

export const exportData = (data, user, fileName) => {
    const isSystemOwner = user?.roles.includes(USER_ROLES.SYSTEM_OWNER);
    if (!isSystemOwner) return;

    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const date = new Date().toISOString().split("T")[0];
    link.download = `${fileName}_${date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
};
