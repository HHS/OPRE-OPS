import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { changeRequests } from "./data";

// const BACKEND_DOMAIN = import.meta.env.VITE_BACKEND_DOMAIN;
// Adding optional runtime config.
const BACKEND_DOMAIN = window.__RUNTIME_CONFIG__?.REACT_APP_BACKEND_DOMAIN || import.meta.env.VITE_BACKEND_DOMAIN;

export const handlers = [
    http.get(`${BACKEND_DOMAIN}/api/v1/agreements/`, (req, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.json([
                { id: 1, name: "Agreement 1" },
                { id: 2, name: "Agreement 2" }
            ]),
            ctx.delay(150)
        );
    }),

    http.get(`${BACKEND_DOMAIN}/api/v1/agreements/:id`, (req, res, ctx) => {
        const { id } = req.params;

        return res(ctx.status(200), ctx.json({ id, name: `Agreement ${id}` }));
    }),

    http.get(`${BACKEND_DOMAIN}/api/v1/research-projects/`, (req, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.json([
                { id: 1, name: "Research Project 1" },
                { id: 2, name: "Research Project 2" }
            ]),
            ctx.delay(150)
        );
    }),

    http.post(`${BACKEND_DOMAIN}/api/v1/research-projects/`, (req, res, ctx) => {
        const { body } = req;

        return res(ctx.status(201), ctx.json({ id: 3, name: body.name }), ctx.delay(150));
    }),

    http.get(`${BACKEND_DOMAIN}/api/v1/change-requests/`, (req, res, ctx) => {
        return res(ctx.status(200), ctx.json(changeRequests), ctx.delay(150));
    })
];

export const server = setupServer(...handlers);
