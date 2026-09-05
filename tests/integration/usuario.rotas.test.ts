import { describe, expect, it, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app";
import { limparBanco, encerrarConexao } from "./helpers/db";

beforeEach(async () => {
    await limparBanco();
});

afterAll(async () => {
    await encerrarConexao();
});

describe("POST /usuarios", () => {
    it("deve rejeitar corpo inválido com 400", async () => {
        const resposta = await request(app).post("/usuarios").send({
            nome: "A",
            email: "nao-e-email",
            senha: "123",
            tipo: "OPERADOR",
        });

        expect(resposta.status).toBe(400);
        expect(resposta.body.erro).toBe("Dados inválidos");
    });

    it("deve criar um usuário com dados válidos e nunca retornar a senha", async () => {
        const resposta = await request(app).post("/usuarios").send({
            nome: "Fulano da Silva",
            email: "fulano@exemplo.com",
            senha: "senha-super-segura",
            tipo: "OPERADOR",
        });

        expect(resposta.status).toBe(201);
        expect(resposta.body).toEqual(
            expect.objectContaining({
                nome: "Fulano da Silva",
                email: "fulano@exemplo.com",
                tipo: "OPERADOR",
            }),
        );
        expect(resposta.body).not.toHaveProperty("senha");
    });

    it("deve rejeitar e-mail já cadastrado com 409", async () => {
        const dados = {
            nome: "Fulano da Silva",
            email: "duplicado@exemplo.com",
            senha: "senha-super-segura",
            tipo: "OPERADOR",
        };

        await request(app).post("/usuarios").send(dados);
        const resposta = await request(app).post("/usuarios").send(dados);

        expect(resposta.status).toBe(409);
        expect(resposta.body.erro).toBe("E-mail já cadastrado");
    });
});
