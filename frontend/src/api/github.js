import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const githubApi = createApi({
    reducerPath: "githubApi",
    tagTypes: ["Releases"],
    baseQuery: fetchBaseQuery({
        baseUrl: "https://api.github.com/",
        prepareHeaders: (headers) => {
            headers.set("Accept", "application/vnd.github.v3+json");
            // Add GitHub token if you have one for higher rate limits
            // headers.set("Authorization", `token ${process.env.GITHUB_TOKEN}`);
            return headers;
        }
    }),
    endpoints: (builder) => ({
        getReleases: builder.query({
            query: ({ owner = "HHS", repo = "OPRE-OPS", limit = 4 } = {}) =>
                `repos/${owner}/${repo}/releases?per_page=${limit}`,
            transformResponse: (response) => {
                return response.map((release) => ({
                    version: release.tag_name,
                    date: new Date(release.published_at).toISOString().split("T")[0],
                    changes: [
                        {
                            id: release.id.toString(),
                            subject: release.name || release.tag_name,
                            type: "Release",
                            description: release.body || "No description available"
                        }
                    ]
                }));
            },
            providesTags: ["Releases"]
        })
    })
});

export const { useGetReleasesQuery } = githubApi;
