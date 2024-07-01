// TODO: remove this module

import React from "react";
import { useGetWorkflowInstanceQuery, useGetWorkflowStepInstanceQuery } from "../api/opsAPI";

/**
 * This hook returns the workflow instance given its id.
 * @param {number} id - The id of the workflow instance.
 * @returns {object} - The workflow instance
 * @example
 * const workflowInstance = useGetWorkflowInstanceFromId(1);
 */
export const useGetWorkflowInstanceFromId = (id) => {
    const [workflowInstance, setWorkflowInstance] = React.useState({});
    const { data, isSuccess } = useGetWorkflowInstanceQuery(id);

    React.useEffect(() => {
        if (isSuccess) {
            setWorkflowInstance(data);
        }
    }, [data, isSuccess]);

    return workflowInstance;
};

/**
 * This hook returns the workflow step instance given its id.
 * @param {number} id - The id of the workflow step instance.
 * @returns {object} - The workflow step instance
 * @example
 * const workflowStepInstance = useGetWorkflowStepInstanceFromId(1);
 */
export const useGetWorkflowStepInstanceFromId = (id) => {
    const [workflowStepInstance, setWorkflowStepInstance] = React.useState({});
    const { data, isSuccess } = useGetWorkflowStepInstanceQuery(id);

    React.useEffect(() => {
        if (isSuccess) {
            setWorkflowStepInstance(data);
        }
    }, [data, isSuccess]);

    return workflowStepInstance;
};
