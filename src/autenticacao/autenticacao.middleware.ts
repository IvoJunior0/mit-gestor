import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

interface DadosToken {
    id: string;
    tipo: "ADMINISTRADOR" | "GESTOR" | "TECNICO" | "OPERADOR";
}

declare global {
    namespace Express {
        interface Request {
            usuario?: DadosToken;
        }
    }
}

export function autenticar(req: Request, res: Response, next: NextFunction) {
    const cabecalho = req.headers.authorization;

    if (!cabecalho) {
        return res.status(401).json({
            erro: "Token de autenticação não fornecido",
        });
    }

    const [tipo, token] = cabecalho.split(" ");

    if (tipo !== "Bearer" || !token) {
        return res.status(401).json({
            erro: "Formato do token inválido",
        });
    }

    try {
        const dados = jwt.verify(token, process.env.JWT_SECRET!) as DadosToken;

        req.usuario = dados;

        next();
    } catch {
        return res.status(401).json({
            erro: "Token inválido ou expirado",
        });
    }
}
