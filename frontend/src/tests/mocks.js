import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { changeRequests } from "./data";

export const handlers = [
    http.get(`http://localhost:8000/api/v1/agreements/`, () => {
        return HttpResponse.json([
            { id: 1, name: "Agreement 1" },
            { id: 2, name: "Agreement 2" }
        ]);
    }),
    http.get(`http://localhost:8000/api/v1/agreements/:id`, (req, res, ctx) => {
        const { id } = req.params;

        return res(ctx.status(200), ctx.json({ id, name: `Agreement ${id}` }));
    }),

    http.get(`http://localhost:8000/api/v1/research-projects/`, (req, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.json([
                { id: 1, name: "Research Project 1" },
                { id: 2, name: "Research Project 2" }
            ]),
            ctx.delay(150)
        );
    }),

    http.post(`http://localhost:8000/api/v1/research-projects/`, (req, res, ctx) => {
        const { body } = req;

        return res(ctx.status(201), ctx.json({ id: 3, name: body.name }), ctx.delay(150));
    }),

    http.get(`http://localhost:8000/api/v1/change-requests/`, (req, res, ctx) => {
        return res(ctx.status(200), ctx.json(changeRequests), ctx.delay(150));
    })
];

export const server = setupServer(...handlers);
