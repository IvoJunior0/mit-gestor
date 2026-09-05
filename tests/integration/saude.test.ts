import { describe, expect, it, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app";
import { encerrarConexao } from "./helpers/db";

describe("GET /saude", () => {
    afterAll(async () => {
        await encerrarConexao();
    });

    it("deve retornar status ok quando o banco está conectado", async () => {
        const resposta = await request(app).get("/saude");

        expect(resposta.status).toBe(200);
        expect(resposta.body).toEqual({ status: "ok", banco: "conectado" });
    });
});

describe("Rota inexistente", () => {
    it("deve retornar 404 para rotas não mapeadas", async () => {
        const resposta = await request(app).get("/rota-que-nao-existe");

        expect(resposta.status).toBe(404);
        expect(resposta.body).toEqual({ erro: "Rota não encontrada" });
    });
});
