import { describe, expect, it, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app";
import { limparBanco, encerrarConexao } from "./helpers/db";
import { criarUsuarioTeste } from "./helpers/auth";

beforeEach(async () => {
    await limparBanco();
});

afterAll(async () => {
    await encerrarConexao();
});

describe("POST /autenticacao/login", () => {
    it("deve rejeitar corpo inválido com 400", async () => {
        const resposta = await request(app)
            .post("/autenticacao/login")
            .send({ email: "nao-e-email" });

        expect(resposta.status).toBe(400);
        expect(resposta.body.erro).toBe("Dados inválidos");
    });

    it("deve rejeitar e-mail inexistente com 401", async () => {
        const resposta = await request(app).post("/autenticacao/login").send({
            email: "inexistente@exemplo.com",
            senha: "qualquer-coisa",
        });

        expect(resposta.status).toBe(401);
        expect(resposta.body.erro).toBe("E-mail ou senha inválidos");
    });

    it("deve rejeitar senha incorreta com 401", async () => {
        const usuario = await criarUsuarioTeste({
            email: "tecnico@exemplo.com",
            senha: "senha-correta-123",
        });

        const resposta = await request(app).post("/autenticacao/login").send({
            email: usuario.email,
            senha: "senha-errada",
        });

        expect(resposta.status).toBe(401);
        expect(resposta.body.erro).toBe("E-mail ou senha inválidos");
    });

    it("deve autenticar com credenciais válidas e retornar tokens", async () => {
        const usuario = await criarUsuarioTeste({
            email: "gestor@exemplo.com",
            senha: "senha-correta-123",
            tipo: "GESTOR",
        });

        const resposta = await request(app).post("/autenticacao/login").send({
            email: usuario.email,
            senha: "senha-correta-123",
        });

        expect(resposta.status).toBe(200);
        expect(resposta.body).toHaveProperty("accessToken");
        expect(resposta.body).toHaveProperty("refreshToken");
        expect(resposta.body.usuario).toEqual(
            expect.objectContaining({
                id: usuario.id,
                email: usuario.email,
                tipo: "GESTOR",
            }),
        );
        expect(resposta.body.usuario).not.toHaveProperty("senha");
    });
});

describe("POST /autenticacao/refresh", () => {
    async function realizarLoginTeste() {
        const usuario = await criarUsuarioTeste({
            email: "refresh@exemplo.com",
            senha: "senha-correta-123",
        });

        const login = await request(app).post("/autenticacao/login").send({
            email: usuario.email,
            senha: "senha-correta-123",
        });

        return { usuario, refreshToken: login.body.refreshToken as string };
    }

    it("deve rejeitar corpo inválido com 400", async () => {
        const resposta = await request(app)
            .post("/autenticacao/refresh")
            .send({});

        expect(resposta.status).toBe(400);
    });

    it("deve rejeitar refresh token inexistente com 401", async () => {
        const resposta = await request(app)
            .post("/autenticacao/refresh")
            .send({ refreshToken: "token-que-nunca-existiu" });

        expect(resposta.status).toBe(401);
        expect(resposta.body.erro).toBe("Refresh token inválido");
    });

    it("deve gerar um novo access token com refresh token válido", async () => {
        const { refreshToken } = await realizarLoginTeste();

        const resposta = await request(app)
            .post("/autenticacao/refresh")
            .send({ refreshToken });

        expect(resposta.status).toBe(200);
        expect(resposta.body).toHaveProperty("accessToken");
        expect(typeof resposta.body.accessToken).toBe("string");
    });

    it("deve rejeitar um refresh token já revogado (após logout)", async () => {
        const { refreshToken } = await realizarLoginTeste();

        await request(app).post("/autenticacao/logout").send({ refreshToken });

        const resposta = await request(app)
            .post("/autenticacao/refresh")
            .send({ refreshToken });

        expect(resposta.status).toBe(401);
        expect(resposta.body.erro).toBe("Sessão revogada");
    });
});

describe("POST /autenticacao/logout", () => {
    it("deve rejeitar corpo inválido com 400", async () => {
        const resposta = await request(app)
            .post("/autenticacao/logout")
            .send({});

        expect(resposta.status).toBe(400);
    });

    it("deve retornar 200 mesmo para um refresh token inexistente (idempotente)", async () => {
        const resposta = await request(app)
            .post("/autenticacao/logout")
            .send({ refreshToken: "token-que-nunca-existiu" });

        expect(resposta.status).toBe(200);
        expect(resposta.body).toEqual({
            mensagem: "Logout realizado com sucesso.",
        });
    });

    it("deve revogar uma sessão válida", async () => {
        const usuario = await criarUsuarioTeste({
            email: "logout@exemplo.com",
            senha: "senha-correta-123",
        });

        const login = await request(app).post("/autenticacao/login").send({
            email: usuario.email,
            senha: "senha-correta-123",
        });

        const refreshToken = login.body.refreshToken as string;

        const respostaLogout = await request(app)
            .post("/autenticacao/logout")
            .send({ refreshToken });

        expect(respostaLogout.status).toBe(200);

        const respostaRefresh = await request(app)
            .post("/autenticacao/refresh")
            .send({ refreshToken });

        expect(respostaRefresh.status).toBe(401);
        expect(respostaRefresh.body.erro).toBe("Sessão revogada");
    });
});
