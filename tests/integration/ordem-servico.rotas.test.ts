import { describe, expect, it, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app";
import { limparBanco, encerrarConexao, prisma } from "./helpers/db";
import { criarUsuarioAutenticadoTeste, criarUsuarioTeste } from "./helpers/auth";
import { criarSetorTeste, criarMaquinaTeste, criarPecaTeste } from "./helpers/fixtures";

beforeEach(async () => {
    await limparBanco();
});

afterAll(async () => {
    await encerrarConexao();
});

async function criarCenarioBasico() {
    const setor = await criarSetorTeste();
    const maquina = await criarMaquinaTeste(setor.id);
    const tecnico = await criarUsuarioTeste({ tipo: "TECNICO" });

    return { setor, maquina, tecnico };
}

describe("POST /ordens-servico", () => {
    it("deve rejeitar sem token com 401", async () => {
        const resposta = await request(app).post("/ordens-servico").send({});

        expect(resposta.status).toBe(401);
    });

    it("deve rejeitar OPERADOR (sem permissão) com 403", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("OPERADOR");
        const { maquina } = await criarCenarioBasico();

        const resposta = await request(app)
            .post("/ordens-servico")
            .set("Authorization", cabecalhoAuth)
            .send({
                descricao: "Troca de rolamento",
                prioridade: "ALTA",
                maquinaId: maquina.id,
            });

        expect(resposta.status).toBe(403);
    });

    it("deve rejeitar corpo inválido com 400", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("TECNICO");

        const resposta = await request(app)
            .post("/ordens-servico")
            .set("Authorization", cabecalhoAuth)
            .send({ descricao: "a" });

        expect(resposta.status).toBe(400);
    });

    it("deve retornar 404 quando a máquina não existe", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("GESTOR");

        const resposta = await request(app)
            .post("/ordens-servico")
            .set("Authorization", cabecalhoAuth)
            .send({
                descricao: "Troca de rolamento",
                prioridade: "ALTA",
                maquinaId: "00000000-0000-0000-0000-000000000000",
            });

        expect(resposta.status).toBe(404);
        expect(resposta.body.erro).toBe("Máquina não encontrada");
    });

    it("deve criar uma ordem de serviço válida", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("GESTOR");
        const { maquina } = await criarCenarioBasico();

        const resposta = await request(app)
            .post("/ordens-servico")
            .set("Authorization", cabecalhoAuth)
            .send({
                descricao: "Troca de rolamento",
                prioridade: "ALTA",
                maquinaId: maquina.id,
            });

        expect(resposta.status).toBe(201);
        expect(resposta.body).toEqual(
            expect.objectContaining({
                descricao: "Troca de rolamento",
                status: "ABERTA",
            }),
        );
    });

    it("deve retornar 404 quando a máquina já possui uma OS ativa", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("GESTOR");
        const { maquina } = await criarCenarioBasico();

        await prisma.ordemServico.create({
            data: {
                descricao: "OS já em andamento",
                prioridade: "MEDIA",
                status: "EM_ANDAMENTO",
                maquinaId: maquina.id,
            },
        });

        const resposta = await request(app)
            .post("/ordens-servico")
            .set("Authorization", cabecalhoAuth)
            .send({
                descricao: "Nova OS",
                prioridade: "BAIXA",
                maquinaId: maquina.id,
            });

        expect(resposta.status).toBe(409);
        expect(resposta.body.erro).toBe(
            "A máquina já possui uma ordem de serviço em andamento.",
        );
    });

    it("deve retornar 404 quando o técnico responsável não existe", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("GESTOR");
        const { maquina } = await criarCenarioBasico();

        const resposta = await request(app)
            .post("/ordens-servico")
            .set("Authorization", cabecalhoAuth)
            .send({
                descricao: "Troca de rolamento",
                prioridade: "ALTA",
                maquinaId: maquina.id,
                tecnicoResponsavelId: "00000000-0000-0000-0000-000000000000",
            });

        expect(resposta.status).toBe(404);
        expect(resposta.body.erro).toBe("Técnico não encontrado.");
    });
});

describe("GET /ordens-servico e /ordens-servico/:id", () => {
    it("deve listar as ordens de serviço cadastradas", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("OPERADOR");
        const { maquina } = await criarCenarioBasico();

        await prisma.ordemServico.create({
            data: {
                descricao: "OS de teste",
                prioridade: "BAIXA",
                maquinaId: maquina.id,
            },
        });

        const resposta = await request(app)
            .get("/ordens-servico")
            .set("Authorization", cabecalhoAuth);

        expect(resposta.status).toBe(200);
        expect(resposta.body).toHaveLength(1);
    });

    it("deve retornar 404 para uma OS inexistente", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("OPERADOR");

        const resposta = await request(app)
            .get("/ordens-servico/00000000-0000-0000-0000-000000000000")
            .set("Authorization", cabecalhoAuth);

        expect(resposta.status).toBe(404);
    });
});

describe("POST /ordens-servico/:ordemServicoId/pecas", () => {
    async function criarOrdemServicoTeste(maquinaId: string) {
        return prisma.ordemServico.create({
            data: {
                descricao: "OS para itens",
                prioridade: "MEDIA",
                maquinaId,
            },
        });
    }

    it("deve retornar 404 quando a OS não existe", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("TECNICO");
        const peca = await criarPecaTeste({ quantidadeEstoque: 10 });

        const resposta = await request(app)
            .post("/ordens-servico/00000000-0000-0000-0000-000000000000/pecas")
            .set("Authorization", cabecalhoAuth)
            .send({ pecaId: peca.id, quantidade: 1 });

        expect(resposta.status).toBe(404);
        expect(resposta.body.erro).toBe("Ordem de serviço não encontrada");
    });

    it("deve retornar 409 quando o estoque é insuficiente", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("TECNICO");
        const { maquina } = await criarCenarioBasico();
        const ordemServico = await criarOrdemServicoTeste(maquina.id);
        const peca = await criarPecaTeste({ quantidadeEstoque: 2 });

        const resposta = await request(app)
            .post(`/ordens-servico/${ordemServico.id}/pecas`)
            .set("Authorization", cabecalhoAuth)
            .send({ pecaId: peca.id, quantidade: 5 });

        expect(resposta.status).toBe(409);
        expect(resposta.body.erro).toBe("Estoque insuficiente");
    });

    it("deve adicionar a peça à OS e decrementar o estoque", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("TECNICO");
        const { maquina } = await criarCenarioBasico();
        const ordemServico = await criarOrdemServicoTeste(maquina.id);
        const peca = await criarPecaTeste({ quantidadeEstoque: 10 });

        const resposta = await request(app)
            .post(`/ordens-servico/${ordemServico.id}/pecas`)
            .set("Authorization", cabecalhoAuth)
            .send({ pecaId: peca.id, quantidade: 4 });

        expect(resposta.status).toBe(201);
        expect(resposta.body.quantidade).toBe(4);

        const pecaAtualizada = await prisma.peca.findUnique({
            where: { id: peca.id },
        });
        expect(pecaAtualizada?.quantidadeEstoque).toBe(6);
    });

    it("deve incrementar a quantidade ao adicionar a mesma peça de novo", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("TECNICO");
        const { maquina } = await criarCenarioBasico();
        const ordemServico = await criarOrdemServicoTeste(maquina.id);
        const peca = await criarPecaTeste({ quantidadeEstoque: 20 });

        await request(app)
            .post(`/ordens-servico/${ordemServico.id}/pecas`)
            .set("Authorization", cabecalhoAuth)
            .send({ pecaId: peca.id, quantidade: 3 });

        const segunda = await request(app)
            .post(`/ordens-servico/${ordemServico.id}/pecas`)
            .set("Authorization", cabecalhoAuth)
            .send({ pecaId: peca.id, quantidade: 2 });

        expect(segunda.status).toBe(201);
        expect(segunda.body.quantidade).toBe(5);

        const itens = await prisma.itemOrdemServico.findMany({
            where: { ordemServicoId: ordemServico.id },
        });
        expect(itens).toHaveLength(1);
    });
});

describe("PATCH /ordens-servico/:id/status", () => {
    async function criarOrdemServicoComTecnico(
        maquinaId: string,
        tecnicoResponsavelId?: string,
        status: "ABERTA" | "EM_ANDAMENTO" | "AGUARDANDO_PECA" = "ABERTA",
    ) {
        return prisma.ordemServico.create({
            data: {
                descricao: "OS para status",
                prioridade: "ALTA",
                maquinaId,
                tecnicoResponsavelId,
                status,
            },
        });
    }

    it("deve retornar 400 para status inválido (fora do enum)", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("TECNICO");
        const { maquina } = await criarCenarioBasico();
        const ordemServico = await criarOrdemServicoComTecnico(maquina.id);

        const resposta = await request(app)
            .patch(`/ordens-servico/${ordemServico.id}/status`)
            .set("Authorization", cabecalhoAuth)
            .send({ status: "FINALIZADA" });

        expect(resposta.status).toBe(400);
    });

    it("deve retornar 409 ao iniciar uma OS sem técnico responsável", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("GESTOR");
        const { maquina } = await criarCenarioBasico();
        const ordemServico = await criarOrdemServicoComTecnico(maquina.id);

        const resposta = await request(app)
            .patch(`/ordens-servico/${ordemServico.id}/status`)
            .set("Authorization", cabecalhoAuth)
            .send({ status: "EM_ANDAMENTO" });

        expect(resposta.status).toBe(409);
        expect(resposta.body.erro).toBe(
            "A ordem de serviço precisa ter um técnico responsável para ser iniciada",
        );
    });

    it("deve retornar 409 para uma transição de status inválida", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("GESTOR");
        const { maquina, tecnico } = await criarCenarioBasico();
        const ordemServico = await criarOrdemServicoComTecnico(
            maquina.id,
            tecnico.id,
        );

        const resposta = await request(app)
            .patch(`/ordens-servico/${ordemServico.id}/status`)
            .set("Authorization", cabecalhoAuth)
            .send({ status: "CONCLUIDA" });

        expect(resposta.status).toBe(409);
    });

    it("deve iniciar a OS e colocar a máquina em EM_MANUTENCAO", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("GESTOR");
        const { maquina, tecnico } = await criarCenarioBasico();
        const ordemServico = await criarOrdemServicoComTecnico(
            maquina.id,
            tecnico.id,
        );

        const resposta = await request(app)
            .patch(`/ordens-servico/${ordemServico.id}/status`)
            .set("Authorization", cabecalhoAuth)
            .send({ status: "EM_ANDAMENTO" });

        expect(resposta.status).toBe(200);
        expect(resposta.body.status).toBe("EM_ANDAMENTO");
        expect(resposta.body.iniciadoEm).not.toBeNull();

        const maquinaAtualizada = await prisma.maquina.findUnique({
            where: { id: maquina.id },
        });
        expect(maquinaAtualizada?.status).toBe("EM_MANUTENCAO");
    });

    it("deve concluir a OS e devolver a máquina para EM_OPERACAO", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("GESTOR");
        const { maquina, tecnico } = await criarCenarioBasico();
        const ordemServico = await criarOrdemServicoComTecnico(
            maquina.id,
            tecnico.id,
            "EM_ANDAMENTO",
        );
        await prisma.maquina.update({
            where: { id: maquina.id },
            data: { status: "EM_MANUTENCAO" },
        });

        const resposta = await request(app)
            .patch(`/ordens-servico/${ordemServico.id}/status`)
            .set("Authorization", cabecalhoAuth)
            .send({ status: "CONCLUIDA" });

        expect(resposta.status).toBe(200);
        expect(resposta.body.status).toBe("CONCLUIDA");
        expect(resposta.body.concluidoEm).not.toBeNull();

        const maquinaAtualizada = await prisma.maquina.findUnique({
            where: { id: maquina.id },
        });
        expect(maquinaAtualizada?.status).toBe("EM_OPERACAO");
    });

    it("deve retornar 404 quando a OS não existe", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("GESTOR");

        const resposta = await request(app)
            .patch("/ordens-servico/00000000-0000-0000-0000-000000000000/status")
            .set("Authorization", cabecalhoAuth)
            .send({ status: "EM_ANDAMENTO" });

        expect(resposta.status).toBe(404);
    });
});

describe("PATCH /ordens-servico/:id", () => {
    it("deve atualizar a descrição de uma OS existente", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("GESTOR");
        const { maquina } = await criarCenarioBasico();
        const ordemServico = await prisma.ordemServico.create({
            data: {
                descricao: "Descrição antiga",
                prioridade: "BAIXA",
                maquinaId: maquina.id,
            },
        });

        const resposta = await request(app)
            .patch(`/ordens-servico/${ordemServico.id}`)
            .set("Authorization", cabecalhoAuth)
            .send({ descricao: "Descrição atualizada" });

        expect(resposta.status).toBe(200);
        expect(resposta.body.descricao).toBe("Descrição atualizada");
    });

    it("deve retornar 404 para uma OS inexistente", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("GESTOR");

        const resposta = await request(app)
            .patch("/ordens-servico/00000000-0000-0000-0000-000000000000")
            .set("Authorization", cabecalhoAuth)
            .send({ descricao: "Nova descrição" });

        expect(resposta.status).toBe(404);
    });
});

describe("DELETE /ordens-servico/:id", () => {
    it("deve rejeitar TECNICO (sem permissão) com 403", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("TECNICO");
        const { maquina } = await criarCenarioBasico();
        const ordemServico = await prisma.ordemServico.create({
            data: {
                descricao: "OS a excluir",
                prioridade: "BAIXA",
                maquinaId: maquina.id,
            },
        });

        const resposta = await request(app)
            .delete(`/ordens-servico/${ordemServico.id}`)
            .set("Authorization", cabecalhoAuth);

        expect(resposta.status).toBe(403);
    });

    it("deve excluir uma OS existente (GESTOR)", async () => {
        const { cabecalhoAuth } = await criarUsuarioAutenticadoTeste("GESTOR");
        const { maquina } = await criarCenarioBasico();
        const ordemServico = await prisma.ordemServico.create({
            data: {
                descricao: "OS a excluir",
                prioridade: "BAIXA",
                maquinaId: maquina.id,
            },
        });

        const resposta = await request(app)
            .delete(`/ordens-servico/${ordemServico.id}`)
            .set("Authorization", cabecalhoAuth);

        expect(resposta.status).toBe(204);

        const osNoBanco = await prisma.ordemServico.findUnique({
            where: { id: ordemServico.id },
        });
        expect(osNoBanco).toBeNull();
    });
});
