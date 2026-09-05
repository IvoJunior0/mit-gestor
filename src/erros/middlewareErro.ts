import { Request, Response, NextFunction } from "express";
import { ErroAplicacao } from "./ErroAplicacao";

export function middlewareErro(
    erro: unknown,
    req: Request,
    res: Response,
    next: NextFunction,
) {
    if (erro instanceof ErroAplicacao) {
        return res.status(erro.statusCode).json({
            erro: erro.message,
        });
    }

    console.error(erro);

    return res.status(500).json({
        erro: "Erro interno do servidor",
    });
}
