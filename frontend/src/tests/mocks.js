import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { changeRequests, divisions, roles, cans } from "./data";

export const handlers = [
    http.get(`https://localhost:8000/api/v1/agreements/`, () => {
        return HttpResponse.json([
            { id: 1, name: "Agreement 1" },
            { id: 2, name: "Agreement 2" }
        ]);
    }),
    http.get(`https://localhost:8000/api/v1/agreements/:id`, ({ params }) => {
        const { id } = params;

        return HttpResponse.json({ id, name: `Agreement ${id}` });
    }),

    http.get(`https://localhost:8000/api/v1/research-projects/`, () => {
        return HttpResponse.json([
            { id: 1, name: "Research Project 1" },
            { id: 2, name: "Research Project 2" }
        ]);
    }),

    http.post(`https://localhost:8000/api/v1/research-projects/`, async ({ request }) => {
        const body = await request.json();

        return HttpResponse.json({ id: 3, name: body.name }, { status: 201 });
    }),

    http.get(`https://localhost:8000/api/v1/change-requests/`, () => {
        return HttpResponse.json(changeRequests);
    }),

    http.get(`https://localhost:8000/auth/roles/`, () => {
        return HttpResponse.json(roles);
    }),

    http.get(`https://localhost:8000/api/v1/divisions/`, () => {
        return HttpResponse.json(divisions);
    }),

    http.patch("https://localhost:8000/api/v1/users/:id", async ({ request, params }) => {
        const { id } = params;
        const body = await request.json();

        return HttpResponse.json({ id, ...body }, { status: 200 });
    }),

    http.get("https://localhost:8000/api/v1/cans/", () => {
        return HttpResponse.json(cans);
    })
];

export const server = setupServer(...handlers);
