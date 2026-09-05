import { describe, expect, it, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app";
import { limparBanco, encerrarConexao } from "./helpers/db";
import { criarUsuarioAutenticadoTeste } from "./helpers/auth";
import { criarSetorTeste } from "./helpers/fixtures";

beforeEach(async () => {
    await limparBanco();
});

afterAll(async () => {
    await encerrarConexao();
});

describe("Setores - fluxo básico de CRUD", () => {
    it("deve rejeitar listagem sem token com 401", async () => {
        const resposta = await request(app).get("/setores");
        expect(resposta.status).toBe(401);
    });

    it("deve rejeitar criação por OPERADOR com 403", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("OPERADOR");

        const resposta = await request(app)
            .post("/setores")
            .set("Authorization", cabecalhoAuth)
            .send({ nome: "Produção" });

        expect(resposta.status).toBe(403);
    });

    it("deve criar, listar, buscar, atualizar e excluir um setor", async () => {
        const { cabecalhoAuth: authGestor } =
            await criarUsuarioAutenticadoTeste("GESTOR");
        const { cabecalhoAuth: authAdmin } =
            await criarUsuarioAutenticadoTeste("ADMINISTRADOR");

        const criacao = await request(app)
            .post("/setores")
            .set("Authorization", authGestor)
            .send({ nome: "Produção", descricao: "Linha principal" });

        expect(criacao.status).toBe(201);
        const setorId = criacao.body.id;

        const listagem = await request(app)
            .get("/setores")
            .set("Authorization", authGestor);
        expect(listagem.status).toBe(200);
        expect(listagem.body).toHaveLength(1);

        const busca = await request(app)
            .get(`/setores/${setorId}`)
            .set("Authorization", authGestor);
        expect(busca.status).toBe(200);
        expect(busca.body.nome).toBe("Produção");

        const atualizacao = await request(app)
            .patch(`/setores/${setorId}`)
            .set("Authorization", authGestor)
            .send({ descricao: "Linha secundária" });
        expect(atualizacao.status).toBe(200);
        expect(atualizacao.body.descricao).toBe("Linha secundária");

        const exclusaoSemPermissao = await request(app)
            .delete(`/setores/${setorId}`)
            .set("Authorization", authGestor);
        expect(exclusaoSemPermissao.status).toBe(403);

        const exclusao = await request(app)
            .delete(`/setores/${setorId}`)
            .set("Authorization", authAdmin);
        expect(exclusao.status).toBe(204);
    });

    it("deve retornar 409 ao criar setor com nome duplicado", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("GESTOR");
        await criarSetorTeste("Manutenção");

        const resposta = await request(app)
            .post("/setores")
            .set("Authorization", cabecalhoAuth)
            .send({ nome: "Manutenção" });

        expect(resposta.status).toBe(409);
    });

    it("deve retornar 404 ao buscar setor inexistente", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("OPERADOR");

        const resposta = await request(app)
            .get("/setores/00000000-0000-0000-0000-000000000000")
            .set("Authorization", cabecalhoAuth);

        expect(resposta.status).toBe(404);
    });
});
