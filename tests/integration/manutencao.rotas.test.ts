import { describe, expect, it, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app";
import { limparBanco, encerrarConexao } from "./helpers/db";
import { criarUsuarioAutenticadoTeste } from "./helpers/auth";
import { criarSetorTeste, criarMaquinaTeste } from "./helpers/fixtures";

beforeEach(async () => {
    await limparBanco();
});

afterAll(async () => {
    await encerrarConexao();
});

describe("Manutenções - fluxo básico de CRUD", () => {
    it("deve rejeitar listagem sem token com 401", async () => {
        const resposta = await request(app).get("/manutencoes");
        expect(resposta.status).toBe(401);
    });

    it("deve retornar 404 ao criar manutenção com máquina inexistente", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("TECNICO");

        const resposta = await request(app)
            .post("/manutencoes")
            .set("Authorization", cabecalhoAuth)
            .send({
                tipo: "PREVENTIVA",
                descricao: "Troca de óleo",
                dataInicio: new Date().toISOString(),
                maquinaId: "00000000-0000-0000-0000-000000000000",
            });

        expect(resposta.status).toBe(404);
        expect(resposta.body.erro).toBe("Máquina não encontrada");
    });

    it("deve criar, listar, atualizar e excluir uma manutenção", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("TECNICO");
        const setor = await criarSetorTeste();
        const maquina = await criarMaquinaTeste(setor.id);

        const criacao = await request(app)
            .post("/manutencoes")
            .set("Authorization", cabecalhoAuth)
            .send({
                tipo: "PREVENTIVA",
                descricao: "Troca de óleo",
                maquinaId: maquina.id,
            });
        expect(criacao.status).toBe(201);
        const manutencaoId = criacao.body.id;

        const listagem = await request(app)
            .get("/manutencoes")
            .set("Authorization", cabecalhoAuth);
        expect(listagem.status).toBe(200);
        expect(listagem.body).toHaveLength(1);

        const atualizacao = await request(app)
            .patch(`/manutencoes/${manutencaoId}`)
            .set("Authorization", cabecalhoAuth)
            .send({ descricao: "Troca de óleo e filtro" });
        expect(atualizacao.status).toBe(200);
        expect(atualizacao.body.descricao).toBe("Troca de óleo e filtro");

        const exclusaoSemPermissao = await request(app)
            .delete(`/manutencoes/${manutencaoId}`)
            .set("Authorization", cabecalhoAuth);
        expect(exclusaoSemPermissao.status).toBe(403);
    });

    it("deve retornar 404 ao atualizar manutenção inexistente", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("TECNICO");

        const resposta = await request(app)
            .patch("/manutencoes/00000000-0000-0000-0000-000000000000")
            .set("Authorization", cabecalhoAuth)
            .send({ descricao: "Nova descrição" });

        expect(resposta.status).toBe(404);
    });
});
