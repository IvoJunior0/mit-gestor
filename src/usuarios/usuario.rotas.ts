import { Router } from "express";
import { criarUsuario } from "./usuario.servico";
import { criarUsuarioSchema } from "./usuario.schema";

const router = Router();

router.post("/",  async (req, res, next) => {
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
        next(erro);
    }
});

export default router;
