import { Router } from "express";
import { prisma } from "../prisma";
import { autenticar } from "../autenticacao/autenticacao.middleware";
import { autorizar } from "../autenticacao/autorizacao.middleware";

import {
    criarManutencao,
    atualizarManutencao,
    deletarManutencao,
} from "./manutencao.servico";

import {
    criarManutencaoSchema,
    atualizarManutencaoSchema,
} from "./manutencao.schema";

const router = Router();

router.get("/", autenticar, async (_req, res) => {
    const manutencoes = await prisma.manutencao.findMany({
        include: {
            maquina: true,
            ordemServico: true,
        },
        orderBy: {
            realizadaEm: "desc",
        },
    });

    return res.json(manutencoes);
});

router.get("/:id", autenticar, async (req, res) => {
    const id = req.params.id as string;

    const manutencao = await prisma.manutencao.findUnique({
        where: { id },
        include: {
            maquina: true,
            ordemServico: true,
        },
    });

    if (!manutencao) {
        return res.status(404).json({
            erro: "Manutenção não encontrada",
        });
    }

    return res.json(manutencao);
});

router.post(
    "/",
    autenticar,
    autorizar("ADMINISTRADOR", "GESTOR", "TECNICO"),
    async (req, res) => {
        const resultado = criarManutencaoSchema.safeParse(req.body);

        if (!resultado.success) {
            return res.status(400).json({
                erro: "Dados inválidos",
                detalhes: resultado.error.issues,
            });
        }

        try {
            const manutencao = await criarManutencao(resultado.data);

            return res.status(201).json(manutencao);
        } catch (erro) {
            if (erro instanceof Error) {
                return res.status(404).json({
                    erro: erro.message,
                });
            }

            return res.status(500).json({
                erro: "Erro interno do servidor",
            });
        }
    },
);

router.patch(
    "/:id",
    autenticar,
    autorizar("ADMINISTRADOR", "GESTOR", "TECNICO"),
    async (req, res) => {
        const resultado = atualizarManutencaoSchema.safeParse(req.body);

        if (!resultado.success) {
            return res.status(400).json({
                erro: "Dados inválidos",
                detalhes: resultado.error.issues,
            });
        }

        const id = req.params.id as string;

        try {
            const manutencao = await atualizarManutencao(id, resultado.data);

            return res.json(manutencao);
        } catch (erro) {
            if (erro instanceof Error) {
                return res.status(404).json({
                    erro: erro.message,
                });
            }

            return res.status(500).json({
                erro: "Erro interno do servidor",
            });
        }
    },
);

router.delete(
    "/:id",
    autenticar,
    autorizar("ADMINISTRADOR", "GESTOR"),
    async (req, res) => {
        const id = req.params.id as string;

        try {
            await deletarManutencao(id);

            return res.status(204).send();
        } catch (erro) {
            if (erro instanceof Error) {
                return res.status(404).json({
                    erro: erro.message,
                });
            }

            return res.status(500).json({
                erro: "Erro interno do servidor",
            });
        }
    },
);

export default router;
