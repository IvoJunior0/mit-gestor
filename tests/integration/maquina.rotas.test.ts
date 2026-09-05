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

describe("Máquinas - fluxo básico de CRUD", () => {
    it("deve rejeitar listagem sem token com 401", async () => {
        const resposta = await request(app).get("/maquinas");
        expect(resposta.status).toBe(401);
    });

    it("deve retornar 404 ao criar máquina com setor inexistente", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("GESTOR");

        const resposta = await request(app)
            .post("/maquinas")
            .set("Authorization", cabecalhoAuth)
            .send({
                codigo: "MAQ-001",
                nome: "Torno CNC",
                horimetro: 0,
                setorId: "00000000-0000-0000-0000-000000000000",
            });

        expect(resposta.status).toBe(404);
        expect(resposta.body.erro).toBe("Setor não encontrado.");
    });

    it("deve criar, listar, buscar e atualizar o status de uma máquina", async () => {
        const { cabecalhoAuth } =
            await criarUsuarioAutenticadoTeste("ADMINISTRADOR");
        const setor = await criarSetorTeste();

        const criacao = await request(app)
            .post("/maquinas")
            .set("Authorization", cabecalhoAuth)
            .send({
                codigo: "MAQ-100",
                nome: "Torno CNC",
                horimetro: 120,
                setorId: setor.id,
            });

        expect(criacao.status).toBe(201);
        const maquinaId = criacao.body.id;

        const listagem = await request(app)
            .get("/maquinas")
            .set("Authorization", cabecalhoAuth);
        expect(listagem.status).toBe(200);
        expect(listagem.body).toHaveLength(1);

        const atualizacao = await request(app)
            .patch(`/maquinas/${maquinaId}`)
            .set("Authorization", cabecalhoAuth)
            .send({ status: "PARADA" });
        expect(atualizacao.status).toBe(200);
        expect(atualizacao.body.status).toBe("PARADA");

        const exclusao = await request(app)
            .delete(`/maquinas/${maquinaId}`)
            .set("Authorization", cabecalhoAuth);
        expect(exclusao.status).toBe(204);
    });

    it("deve retornar 409 ao criar máquina com código duplicado", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("GESTOR");
        const setor = await criarSetorTeste();
        await criarMaquinaTeste(setor.id, { codigo: "MAQ-DUP" });

        const resposta = await request(app)
            .post("/maquinas")
            .set("Authorization", cabecalhoAuth)
            .send({
                codigo: "MAQ-DUP",
                nome: "Outra máquina",
                horimetro: 0,
                setorId: setor.id,
            });

        expect(resposta.status).toBe(409);
    });
});
