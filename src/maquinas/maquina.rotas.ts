import { Router } from "express";
import { prisma } from "../prisma";
import { autenticar } from "../autenticacao/autenticacao.middleware";
import { autorizar } from "../autenticacao/autorizacao.middleware";
import {
    criarMaquina,
    atualizarMaquina,
    deletarMaquina,
} from "./maquina.servico";
import { criarMaquinaSchema, atualizarMaquinaSchema } from "./maquina.schema";

const router = Router();

router.get("/", autenticar, async (_req, res) => {
    const maquinas = await prisma.maquina.findMany({
        include: {
            setor: true,
        },
        orderBy: {
            criadoEm: "desc",
        },
    });

    return res.json(maquinas);
});

router.get("/:id", autenticar, async (req, res) => {
    const id = req.params.id as string;

    const maquina = await prisma.maquina.findUnique({
        where: { id },
        include: {
            setor: true,
        },
    });

    if (!maquina) {
        return res.status(404).json({
            erro: "Máquina não encontrada",
        });
    }

    return res.json(maquina);
});

router.post(
    "/",
    autenticar,
    autorizar("ADMINISTRADOR", "GESTOR"),
    async (req, res) => {
        const resultado = criarMaquinaSchema.safeParse(req.body);

        if (!resultado.success) {
            return res.status(400).json({
                erro: "Dados inválidos",
                detalhes: resultado.error.issues,
            });
        }

        try {
            const maquina = await criarMaquina(resultado.data);

            return res.status(201).json(maquina);
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
        const resultado = atualizarMaquinaSchema.safeParse(req.body);

        if (!resultado.success) {
            return res.status(400).json({
                erro: "Dados inválidos",
                detalhes: resultado.error.issues,
            });
        }

        const id = req.params.id as string;

        try {
            const maquina = await atualizarMaquina(id, resultado.data);

            return res.json(maquina);
        } catch (erro) {
            if (erro instanceof Error) {
                if (
                    erro.message === "Máquina não encontrada" ||
                    erro.message === "Setor não encontrado"
                ) {
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
            await deletarMaquina(id);

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
