import { Router } from "express";
import { criarSetor, atualizarSetor, deletarSetor } from "./setor.servico";
import { criarSetorSchema, atualizarSetorSchema } from "./setor.schema";
import { autenticar } from "../autenticacao/autenticacao.middleware";
import { autorizar } from "../autenticacao/autorizacao.middleware";

import { prisma } from "../prisma";

const router = Router();

router.post(
    "/",
    autenticar,
    autorizar("ADMINISTRADOR", "GESTOR"),
    async (req, res, next) => {
        const resultado = criarSetorSchema.safeParse(req.body);

        if (!resultado.success) {
            return res.status(400).json({
                erro: "Dados inválidos",
                detalhes: resultado.error.issues,
            });
        }

        try {
            const setor = await criarSetor(resultado.data);

            return res.status(201).json(setor);
        } catch (erro) {
            next(erro);
        }
    },
);

router.get("/", autenticar, async (req, res) => {
    const setores = await prisma.setor.findMany({
        orderBy: { criadoEm: "desc" },
    });

    return res.json(setores);
});

router.get("/:id", autenticar, async (req, res) => {
    const idUsuario = req.params.id as string;

    const setor = await prisma.setor.findUnique({
        where: {
            id: idUsuario,
        },
    });

    if (!setor) {
        return res.status(404).json({
            erro: "Setor não encontrado.",
        });
    }

    return res.json(setor);
});

router.patch(
    "/:id",
    autenticar,
    autorizar("ADMINISTRADOR", "GESTOR"),
    async (req, res, next) => {
        const resultado = atualizarSetorSchema.safeParse(req.body);

        if (!resultado.success) {
            return res.status(400).json({
                erro: "Dados inválidos",
                detalhes: resultado.error.issues,
            });
        }

        const id = req.params.id as string;

        try {
            const setor = await atualizarSetor(id, resultado.data);

            return res.json(setor);
        } catch (erro) {
            next(erro);
        }
    },
);

router.delete(
    "/:id",
    autenticar,
    autorizar("ADMINISTRADOR"),
    async (req, res, next) => {
        const id = req.params.id as string;

        try {
            await deletarSetor(id);

            return res.status(204).send();
        } catch (erro) {
            next(erro);
        }
    },
);

export default router;
