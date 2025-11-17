import { getAwardingEntityIds } from "./procurementShop.helpers";

describe("getAwardingEntityIds", () => {
    it("should return an empty array when no change requests are provided", () => {
        const result = getAwardingEntityIds([]);
        expect(result).toEqual([]);
    });

    it("should return an empty array when change requests is not an array", () => {
        const result1 = getAwardingEntityIds(null);
        const result2 = getAwardingEntityIds(undefined);
        const result3 = getAwardingEntityIds("not an array");
        const result4 = getAwardingEntityIds({});

        expect(result1).toEqual([]);
        expect(result2).toEqual([]);
        expect(result3).toEqual([]);
        expect(result4).toEqual([]);
    });

    it("should extract awarding entity ID changes from valid change requests", () => {
        const changeRequests = [
            {
                requested_change_diff: {
                    awarding_entity_id: {
                        old: 1,
                        new: 2
                    }
                }
            },
            {
                requested_change_diff: {
                    awarding_entity_id: {
                        old: 3,
                        new: 4
                    }
                }
            }
        ];

        const result = getAwardingEntityIds(changeRequests);

        expect(result).toEqual([
            { old: 1, new: 2 },
            { old: 3, new: 4 }
        ]);
    });

    it("should skip change requests without requested_change_diff", () => {
        const changeRequests = [
            {
                requested_change_diff: {
                    awarding_entity_id: {
                        old: 1,
                        new: 2
                    }
                }
            },
            {
                // No requested_change_diff
            },
            {
                requested_change_diff: {
                    awarding_entity_id: {
                        old: 3,
                        new: 4
                    }
                }
            }
        ];

        const result = getAwardingEntityIds(changeRequests);

        expect(result).toEqual([
            { old: 1, new: 2 },
            { old: 3, new: 4 }
        ]);
    });

    it("should skip change requests without awarding_entity_id in diff", () => {
        const changeRequests = [
            {
                requested_change_diff: {
                    awarding_entity_id: {
                        old: 1,
                        new: 2
                    }
                }
            },
            {
                requested_change_diff: {
                    // No awarding_entity_id
                    other_field: {
                        old: "value1",
                        new: "value2"
                    }
                }
            }
        ];

        const result = getAwardingEntityIds(changeRequests);

        expect(result).toEqual([{ old: 1, new: 2 }]);
    });

    it("should handle change requests with null requested_change_diff", () => {
        const changeRequests = [
            {
                requested_change_diff: {
                    awarding_entity_id: {
                        old: 1,
                        new: 2
                    }
                }
            },
            {
                requested_change_diff: null
            }
        ];

        const result = getAwardingEntityIds(changeRequests);

        expect(result).toEqual([{ old: 1, new: 2 }]);
    });

    it("should handle mixed valid and invalid change requests", () => {
        const changeRequests = [
            {
                requested_change_diff: {
                    awarding_entity_id: {
                        old: 5,
                        new: 6
                    }
                }
            },
            {
                requested_change_diff: {
                    other_field: {
                        old: "a",
                        new: "b"
                    }
                }
            },
            {
                requested_change_diff: {
                    awarding_entity_id: {
                        old: 7,
                        new: 8
                    }
                }
            }
        ];

        const result = getAwardingEntityIds(changeRequests);

        expect(result).toEqual([
            { old: 5, new: 6 },
            { old: 7, new: 8 }
        ]);
    });

    it("should handle awarding entity IDs with different data types", () => {
        const changeRequests = [
            {
                requested_change_diff: {
                    awarding_entity_id: {
                        old: "1",
                        new: "2"
                    }
                }
            },
            {
                requested_change_diff: {
                    awarding_entity_id: {
                        old: 0,
                        new: null
                    }
                }
            }
        ];

        const result = getAwardingEntityIds(changeRequests);

        expect(result).toEqual([
            { old: "1", new: "2" },
            { old: 0, new: null }
        ]);
    });
});
