import { describe, expect, it, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app";
import { limparBanco, encerrarConexao, prisma } from "./helpers/db";
import { criarUsuarioAutenticadoTeste } from "./helpers/auth";

beforeEach(async () => {
    await limparBanco();
});

afterAll(async () => {
    await encerrarConexao();
});

async function criarPecaDireto(sufixo: string) {
    return prisma.peca.create({
        data: {
            codigo: `PC-${sufixo}`,
            nome: `Peça ${sufixo}`,
            unidadeMedida: "UN",
            quantidadeEstoque: 10,
            estoqueMinimo: 2,
        },
    });
}

describe("GET /pecas", () => {
    it("deve rejeitar sem token com 401", async () => {
        const resposta = await request(app).get("/pecas");

        expect(resposta.status).toBe(401);
    });

    it("deve listar peças cadastradas", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("OPERADOR");
        await criarPecaDireto("001");
        await criarPecaDireto("002");

        const resposta = await request(app)
            .get("/pecas")
            .set("Authorization", cabecalhoAuth);

        expect(resposta.status).toBe(200);
        expect(resposta.body).toHaveLength(2);
    });
});

describe("GET /pecas/:id", () => {
    it("deve retornar 404 quando a peça não existe", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("OPERADOR");

        const resposta = await request(app)
            .get("/pecas/00000000-0000-0000-0000-000000000000")
            .set("Authorization", cabecalhoAuth);

        expect(resposta.status).toBe(404);
        expect(resposta.body.erro).toBe("Peça não encontrada");
    });

    it("deve retornar a peça quando ela existe", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("OPERADOR");
        const peca = await criarPecaDireto("003");

        const resposta = await request(app)
            .get(`/pecas/${peca.id}`)
            .set("Authorization", cabecalhoAuth);

        expect(resposta.status).toBe(200);
        expect(resposta.body.id).toBe(peca.id);
    });
});

describe("POST /pecas", () => {
    it("deve rejeitar sem token com 401", async () => {
        const resposta = await request(app).post("/pecas").send({});

        expect(resposta.status).toBe(401);
    });

    it("deve rejeitar usuário sem permissão (OPERADOR) com 403", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("OPERADOR");

        const resposta = await request(app)
            .post("/pecas")
            .set("Authorization", cabecalhoAuth)
            .send({
                codigo: "PC-100",
                nome: "Rolamento",
                unidadeMedida: "UN",
                quantidadeEstoque: 5,
                estoqueMinimo: 1,
            });

        expect(resposta.status).toBe(403);
    });

    it("deve rejeitar corpo inválido com 400", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("GESTOR");

        const resposta = await request(app)
            .post("/pecas")
            .set("Authorization", cabecalhoAuth)
            .send({ codigo: "" });

        expect(resposta.status).toBe(400);
        expect(resposta.body.erro).toBe("Dados inválidos");
    });

    it("deve criar uma peça com dados válidos (GESTOR)", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("GESTOR");

        const resposta = await request(app)
            .post("/pecas")
            .set("Authorization", cabecalhoAuth)
            .send({
                codigo: "PC-100",
                nome: "Rolamento",
                unidadeMedida: "UN",
                quantidadeEstoque: 5,
                estoqueMinimo: 1,
            });

        expect(resposta.status).toBe(201);
        expect(resposta.body).toEqual(
            expect.objectContaining({ codigo: "PC-100", nome: "Rolamento" }),
        );
    });

    it("deve rejeitar código duplicado com 409", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("ADMINISTRADOR");
        await criarPecaDireto("100");

        const resposta = await request(app)
            .post("/pecas")
            .set("Authorization", cabecalhoAuth)
            .send({
                codigo: "PC-100",
                nome: "Outra peça",
                unidadeMedida: "UN",
                quantidadeEstoque: 1,
                estoqueMinimo: 0,
            });

        expect(resposta.status).toBe(409);
        expect(resposta.body.erro).toBe("Já existe uma peça com este código");
    });
});

describe("PATCH /pecas/:id", () => {
    it("deve retornar 404 para peça inexistente", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("GESTOR");

        const resposta = await request(app)
            .patch("/pecas/00000000-0000-0000-0000-000000000000")
            .set("Authorization", cabecalhoAuth)
            .send({ nome: "Novo nome" });

        expect(resposta.status).toBe(404);
    });

    it("deve atualizar uma peça existente", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("GESTOR");
        const peca = await criarPecaDireto("200");

        const resposta = await request(app)
            .patch(`/pecas/${peca.id}`)
            .set("Authorization", cabecalhoAuth)
            .send({ quantidadeEstoque: 50 });

        expect(resposta.status).toBe(200);
        expect(resposta.body.quantidadeEstoque).toBe(50);
    });
});

describe("DELETE /pecas/:id", () => {
    it("deve rejeitar GESTOR (apenas ADMINISTRADOR pode excluir) com 403", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("GESTOR");
        const peca = await criarPecaDireto("300");

        const resposta = await request(app)
            .delete(`/pecas/${peca.id}`)
            .set("Authorization", cabecalhoAuth);

        expect(resposta.status).toBe(403);
    });

    it("deve excluir uma peça existente (ADMINISTRADOR)", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("ADMINISTRADOR");
        const peca = await criarPecaDireto("400");

        const resposta = await request(app)
            .delete(`/pecas/${peca.id}`)
            .set("Authorization", cabecalhoAuth);

        expect(resposta.status).toBe(204);

        const pecaNoBanco = await prisma.peca.findUnique({
            where: { id: peca.id },
        });
        expect(pecaNoBanco).toBeNull();
    });
});
