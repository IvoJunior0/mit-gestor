import { Router } from "express";
import { criarUsuario } from "./usuario.servico";
import { criarUsuarioSchema } from "./usuario.schema";

const router = Router();

router.post("/",  async (req, res) => {
    const resultado = criarUsuarioSchema.safeParse(req.body);

    if (!resultado.success) {
        return res.status(400).json({
            erro: "Dados inválidos",
            detalhes: resultado.error.issues,
        });
    }

    try {
        const usuario = await criarUsuario(resultado.data);

        return res.status(201).json(usuario);
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
});

export default router;
