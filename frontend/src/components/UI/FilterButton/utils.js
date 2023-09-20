import _ from "lodash";

const setFilterList = (prevState, filterKeyString, stateObject, onlyAllowOne = false) => {
    let updatedFilters = { ...prevState };
    let filterList = _.get(updatedFilters, filterKeyString, []);
    _.set(updatedFilters, filterKeyString, filterList);
    if (onlyAllowOne) {
        filterList[0] = stateObject;
    } else {
        filterList.push(stateObject);
    }
    _.set(
        updatedFilters,
        filterKeyString,
        filterList.filter((filter) => !_.isEmpty(filter))
    );
    _.set(updatedFilters, filterKeyString, [...new Set(_.get(updatedFilters, filterKeyString, []))]); // remove dups

    return updatedFilters;
};

export default setFilterList;
