/**
 * @typedef {Object} changeRequestDiff
 * @property {number} old
 * @property {number} new
 */
/**
 * @param {import("../types/ChangeRequestsTypes").ChangeRequest[]} changeRequests
 * @returns {changeRequestDiff[]}
 */
export function getAwardingEntityIds(changeRequests) {
    /** @type changeRequestDiff[] */
    const changes = [];

    if (!Array.isArray(changeRequests)) return changes;

    changeRequests.forEach((request) => {
        const diff = request.requested_change_diff;
        if (diff && diff.awarding_entity_id) {
            changes.push({
                old: diff.awarding_entity_id.old,
                new: diff.awarding_entity_id.new
            });
        }
    });

    return changes;
}
