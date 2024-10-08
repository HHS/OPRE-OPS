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
    http.get(`https://localhost:8000/api/v1/agreements/:id`, (req, res, ctx) => {
        const { id } = req.params;

        return res(ctx.status(200), ctx.json({ id, name: `Agreement ${id}` }));
    }),

    http.get(`https://localhost:8000/api/v1/research-projects/`, (req, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.json([
                { id: 1, name: "Research Project 1" },
                { id: 2, name: "Research Project 2" }
            ]),
            ctx.delay(150)
        );
    }),

    http.post(`https://localhost:8000/api/v1/research-projects/`, (req, res, ctx) => {
        const { body } = req;

        return res(ctx.status(201), ctx.json({ id: 3, name: body.name }), ctx.delay(150));
    }),

    http.get(`https://localhost:8000/api/v1/change-requests/`, (req, res, ctx) => {
        return res(ctx.status(200), ctx.json(changeRequests), ctx.delay(150));
    }),

    http.get(`https://localhost:8000/auth/roles/`, () => {
        return HttpResponse.json(roles);
    }),

    http.get(`https://localhost:8000/api/v1/divisions/`, () => {
        return HttpResponse.json(divisions);
    }),

    http.patch("https://localhost:8000/api/v1/users/:id", (req, res, ctx) => {
        const { id } = req.params;
        const { body } = req;

        return res(ctx.status(200), ctx.json({ id, ...body }), ctx.delay(150));
    }),

    http.get("https://localhost:8000/api/v1/cans/", () => {
        return HttpResponse.json(cans);
    })
];

export const server = setupServer(...handlers);
