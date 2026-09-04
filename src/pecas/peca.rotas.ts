import { Router } from "express";
import { prisma } from "../prisma";
import { autenticar } from "../autenticacao/autenticacao.middleware";
import { autorizar } from "../autenticacao/autorizacao.middleware";

import { criarPeca, atualizarPeca, deletarPeca } from "./peca.servico";

import { criarPecaSchema, atualizarPecaSchema } from "./peca.schema";

const router = Router();

router.get("/", autenticar, async (_req, res) => {
    const pecas = await prisma.peca.findMany({
        orderBy: {
            criadoEm: "desc",
        },
    });

    return res.json(pecas);
});

router.get("/:id", autenticar, async (req, res) => {
    const id = req.params.id as string;

    const peca = await prisma.peca.findUnique({
        where: { id },
    });

    if (!peca) {
        return res.status(404).json({
            erro: "Peça não encontrada",
        });
    }

    return res.json(peca);
});

router.post(
    "/",
    autenticar,
    autorizar("ADMINISTRADOR", "GESTOR"),
    async (req, res) => {
        const resultado = criarPecaSchema.safeParse(req.body);

        if (!resultado.success) {
            return res.status(400).json({
                erro: "Dados inválidos",
                detalhes: resultado.error.issues,
            });
        }

        try {
            const peca = await criarPeca(resultado.data);

            return res.status(201).json(peca);
        } catch (erro) {
            if (erro instanceof Error) {
                return res.status(409).json({
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
    autorizar("ADMINISTRADOR", "GESTOR"),
    async (req, res) => {
        const resultado = atualizarPecaSchema.safeParse(req.body);

        if (!resultado.success) {
            return res.status(400).json({
                erro: "Dados inválidos",
                detalhes: resultado.error.issues,
            });
        }

        const id = req.params.id as string;

        try {
            const peca = await atualizarPeca(id, resultado.data);

            return res.json(peca);
        } catch (erro) {
            if (erro instanceof Error) {
                if (erro.message === "Peça não encontrada") {
                    return res.status(404).json({
                        erro: erro.message,
                    });
                }

                return res.status(409).json({
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
    autorizar("ADMINISTRADOR"),
    async (req, res) => {
        const id = req.params.id as string;

        try {
            await deletarPeca(id);

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
