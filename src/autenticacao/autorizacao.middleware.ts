import { NextFunction, Request, Response } from "express";

type TipoUsuario = "ADMINISTRADOR" | "GESTOR" | "TECNICO" | "OPERADOR";

export function autorizar(...tiposPermitidos: TipoUsuario[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.usuario) {
            return res.status(401).json({
                erro: "Usuário não autenticado",
            });
        }

        if (!tiposPermitidos.includes(req.usuario.tipo)) {
            return res.status(403).json({
                erro: "Usuário não possui permissão para realizar esta operação",
            });
        }

        next();
    };
}
