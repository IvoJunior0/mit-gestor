import "dotenv/config";
import express from "express";
import { prisma } from "./prisma";

const app = express();
app.use(express.json());

app.get("/saude", async (_req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: "ok", banco: "conectado" });
    } catch {
        res.status(503).json({ status: "erro", banco: "indisponivel" });
    }
});

app.get("/setores", async (_req, res) => {
    const setores = await prisma.setor.findMany({
        include: { maquinas: true },
        orderBy: { nome: "asc" },
    });
    res.json(setores);
});

app.get("/maquinas", async (_req, res) => {
    const maquinas = await prisma.maquina.findMany({
        include: { setor: true },
        orderBy: { codigo: "asc" },
    });
    res.json(maquinas);
});

app.get("/ordens-servico", async (_req, res) => {
    const ordens = await prisma.ordemServico.findMany({
        include: {
            maquina: true,
            tecnicoResponsavel: true,
            itens: { include: { peca: true } },
            manutencao: true,
        },
        orderBy: { criadoEm: "desc" },
    });
    res.json(ordens);
});

app.use((_req, res) => {
    res.status(404).json({ erro: "Rota não encontrada" });
});

const porta = Number(process.env.PORT ?? 3000);

app.listen(porta, () => {
    console.log(
        `API de manutenção industrial rodando em http://localhost:${porta}`,
    );
});
