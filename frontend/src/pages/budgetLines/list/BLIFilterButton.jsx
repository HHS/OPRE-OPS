import React, { useEffect } from "react";
import Modal from "react-modal";
import customStyles from "./BLIFilterButton.module.css";
import FilterButton from "../../../components/UI/FilterButton/FilterButton";
import setFilterList from "../../../components/UI/FilterButton/utils";
import FiscalYearComboBox from "../../../components/UI/Form/FiscalYearComboBox";

/**
 * A filter for agreements.
 * @param {Object} props - The component props.
 * @param {Object} props.filters - The current filters.
 * @param {Function} props.setFilters - A function to call to set the filters.
 * @returns {JSX.Element} - The procurement shop select element.
 */
export const BLIFilterButton = ({ filters, setFilters }) => {
    // const currentFY = new Date(getCurrentFiscalYear()).getFullYear();
    const [fiscalYears, setFiscalYears] = React.useState([]);
    const [needBy, setNeedBy] = React.useState("all-time");
    const [project, setProject] = React.useState({});
    const [po, setPO] = React.useState({});
    const [agreementType, setAgreementType] = React.useState("");
    const [procurementShop, setProcurementShop] = React.useState({});
    const [bliStatus, setBliStatus] = React.useState({
        draft: true,
        planned: true,
        executing: true,
        obligated: true,
    });

    // const {
    //     data: projectData,
    //     error: errorProjectData,
    //     isLoading: isLoadingProjectData,
    // } = useGetResearchProjectsQuery();

    // The useEffect() hook calls below are used to set the state appropriately when the filter tags (X) are clicked.
    useEffect(() => {
        setNeedBy(filters.upcomingNeedByDate);
    }, [filters.upcomingNeedByDate]);

    useEffect(() => {
        setProject(filters.projects ? filters.projects[0] : {});
    }, [filters.projects]);

    useEffect(() => {
        setPO(filters.projectOfficers ? filters.projectOfficers[0] : {});
    }, [filters.projectOfficers]);

    useEffect(() => {
        setAgreementType(filters.types ? filters.types[0] : {});
    }, [filters.types]);

    useEffect(() => {
        setProcurementShop(filters.procurementShops ? filters.procurementShops[0] : {});
    }, [filters.procurementShops]);

    useEffect(() => {
        setBliStatus(filters.budgetLineStatus);
    }, [filters.budgetLineStatus]);

    const applyFilter = () => {
        setFilters((prevState) => {
            return {
                ...prevState,
                upcomingNeedByDate: needBy,
            };
        });
        setFilters((prevState) => {
            return setFilterList(prevState, "projects", project, true);
        });
        setFilters((prevState) => {
            return setFilterList(prevState, "projectOfficers", po, true);
        });
        setFilters((prevState) => {
            return setFilterList(prevState, "types", agreementType);
        });
        setFilters((prevState) => {
            return setFilterList(prevState, "procurementShops", procurementShop);
        });
        setFilters((prevState) => {
            return {
                ...prevState,
                budgetLineStatus: {
                    draft: bliStatus.draft,
                    planned: bliStatus.planned,
                    executing: bliStatus.executing,
                    obligated: bliStatus.obligated,
                },
            };
        });
    };

    const resetFilter = () => {
        setFilters({
            upcomingNeedByDate: "all-time",
            projects: [],
            projectOfficers: [],
            types: [],
            procurementShops: [],
            budgetLineStatus: {
                draft: true,
                planned: true,
                executing: true,
                obligated: true,
            },
        });
        setNeedBy("all-time");
    };

    // if (isLoadingProjectData) {
    //     return <div>Loading...</div>;
    // }
    // if (errorProjectData) {
    //     return <div>Oops, an error occurred</div>;
    // }

    const fieldStyles = "usa-fieldset margin-bottom-205";
    const legendStyles = `usa-legend font-sans-3xs margin-top-0 padding-bottom-1 ${customStyles.legendColor}`;

    const fieldsetList = [
        <fieldset key="field1" className={fieldStyles}>
            <FiscalYearComboBox
                selectedFiscalYears={fiscalYears}
                setSelectedFiscalYears={setFiscalYears}
                legendClassname={legendStyles}
                defaultString={"All Fiscal Years"}
                overrideStyles={{ width: "22.7rem" }}
            />
        </fieldset>,
    ];

    Modal.setAppElement("#root");

    return <FilterButton applyFilter={applyFilter} resetFilter={resetFilter} fieldsetList={fieldsetList} />;
};

export default BLIFilterButton;
