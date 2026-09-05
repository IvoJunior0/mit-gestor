import express from "express";
import { prisma } from "./prisma";

import usuarioRotas from "./usuarios/usuario.rotas";
import autenticacaoRotas from "./autenticacao/autenticacao.rotas";
import setorRotas from "./setores/setor.rotas";
import maquinaRotas from "./maquinas/maquina.rotas";
import pecaRotas from "./pecas/peca.rotas";
import ordemServicoRotas from "./ordens-servico/ordem-servico.rotas";
import manutencaoRotas from "./manutencoes/manutencao.rotas";
import { middlewareErro } from "./erros/middlewareErro";

// Instância do Express extraída do servidor.ts para permitir testes de
// integração com supertest sem a necessidade de abrir uma porta TCP real.
export const app = express();
app.use(express.json());

// Todas as rotas do projeto com seus métodos HTTP.
app.get("/saude", async (_req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: "ok", banco: "conectado" });
    } catch {
        res.status(503).json({ status: "erro", banco: "indisponivel" });
    }
});

app.use("/usuarios", usuarioRotas);
app.use("/autenticacao", autenticacaoRotas);
app.use("/setores", setorRotas);
app.use("/maquinas", maquinaRotas);
app.use("/pecas", pecaRotas);
app.use("/ordens-servico", ordemServicoRotas);
app.use("/manutencoes", manutencaoRotas);
app.use(middlewareErro);

app.use((_req, res) => {
    res.status(404).json({ erro: "Rota não encontrada" });
});

export default app;
