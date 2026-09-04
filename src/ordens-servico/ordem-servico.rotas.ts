import { Router } from "express";
import { prisma } from "../prisma";
import { autenticar } from "../autenticacao/autenticacao.middleware";
import { autorizar } from "../autenticacao/autorizacao.middleware";
import { Request, Response } from "express";
import { adicionarPecaOrdemServicoSchema } from "./ordem-servico.schema";
import { adicionarPecaNaOrdemServico } from "./ordem-servico.servico";

import {
    criarOrdemServico,
    atualizarOrdemServico,
    deletarOrdemServico,
} from "./ordem-servico.servico";

import {
    criarOrdemServicoSchema,
    atualizarOrdemServicoSchema,
} from "./ordem-servico.schema";

const router = Router();

router.get("/", autenticar, async (_req, res) => {
    const ordens = await prisma.ordemServico.findMany({
        include: {
            maquina: true,
            tecnicoResponsavel: true,
        },
        orderBy: {
            criadoEm: "desc",
        },
    });

    return res.json(ordens);
});

router.get("/:id", autenticar, async (req, res) => {
    const id = req.params.id as string;

    const ordem = await prisma.ordemServico.findUnique({
        where: { id },
        include: {
            maquina: true,
            tecnicoResponsavel: true,
            itens: {
                include: {
                    peca: true,
                },
            },
        },
    });

    if (!ordem) {
        return res.status(404).json({
            erro: "Ordem de serviço não encontrada",
        });
    }

    return res.json(ordem);
});

router.post(
    "/",
    autenticar,
    autorizar("ADMINISTRADOR", "GESTOR", "TECNICO"),
    async (req, res) => {
        const resultado = criarOrdemServicoSchema.safeParse(req.body);

        if (!resultado.success) {
            return res.status(400).json({
                erro: "Dados inválidos",
                detalhes: resultado.error.issues,
            });
        }

        try {
            const ordem = await criarOrdemServico(resultado.data);

            return res.status(201).json(ordem);
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

router.post(
    "/:ordemServicoId/pecas",
    autenticar,
    autorizar("ADMINISTRADOR", "GESTOR", "TECNICO"),
    async (req: Request, res: Response) => {
        try {
            const dados = adicionarPecaOrdemServicoSchema.parse(req.body);

            const item = await adicionarPecaNaOrdemServico(
                req.params.ordemServicoId as string,
                dados,
            );

            return res.status(201).json(item);
        } catch (erro) {
            if (erro instanceof Error) {
                return res.status(400).json({
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
        const resultado = atualizarOrdemServicoSchema.safeParse(req.body);

        if (!resultado.success) {
            return res.status(400).json({
                erro: "Dados inválidos",
                detalhes: resultado.error.issues,
            });
        }

        const id = req.params.id as string;

        try {
            const ordem = await atualizarOrdemServico(id, resultado.data);

            return res.json(ordem);
        } catch (erro) {
            if (erro instanceof Error) {
                if (erro.message === "Ordem de serviço não encontrada") {
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
    autorizar("ADMINISTRADOR", "GESTOR"),
    async (req, res) => {
        const id = req.params.id as string;

        try {
            await deletarOrdemServico(id);

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
