import { Router } from "express";
import {
    realizarLogin,
    renovarAccessToken,
    realizarLogout,
} from "./autenticacao.servico";
import { loginSchema, refreshTokenSchema } from "./autenticacao.schema";

const router = Router();

router.post("/login", async (req, res) => {
    const resultado = loginSchema.safeParse(req.body);

    if (!resultado.success) {
        return res.status(400).json({
            erro: "Dados inválidos",
            detalhes: resultado.error.issues,
        });
    }

    try {
        const resultadoLogin = await realizarLogin(resultado.data);

        return res.status(200).json(resultadoLogin);
    } catch (erro) {
        if (erro instanceof Error) {
            return res.status(401).json({
                erro: erro.message,
            });
        }

        return res.status(500).json({
            erro: "Erro interno do servidor",
        });
    }
});

router.post("/refresh", async (req, res) => {
    const resultado = refreshTokenSchema.safeParse(req.body);

    if (!resultado.success) {
        return res.status(400).json({
            erro: "Dados inválidos",
            detalhes: resultado.error.issues,
        });
    }

    try {
        const resultadoRefresh = await renovarAccessToken(
            resultado.data.refreshToken,
        );

        return res.status(200).json(resultadoRefresh);
    } catch (erro) {
        if (erro instanceof Error) {
            return res.status(401).json({
                erro: erro.message,
            });
        }

        return res.status(500).json({
            erro: "Erro interno do servidor.",
        });
    }
});

router.post("/logout", async (req, res) => {
    const resultado = refreshTokenSchema.safeParse(req.body);

    if (!resultado.success) {
        return res.status(400).json({
            erro: "Dados inválidos",
            detalhes: resultado.error.issues,
        });
    }

    await realizarLogout(resultado.data.refreshToken);

    return res.status(200).json({
        mensagem: "Logout realizado com sucesso.",
    });
});

export default router;
