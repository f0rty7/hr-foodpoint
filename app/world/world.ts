import { api } from "encore.dev/api";

export const get = api(
    {expose: true, method: 'GET', path: '/world'},
    async(): Promise<Response> => {
        return {
            message: 'Hello World!'
        }
    }
)

interface Response {
    message: string;
}