import { describe, expect, it, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { autorizar } from "../../../src/autenticacao/autorizacao.middleware";

function criarMockRes() {
    const res: Partial<Response> = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    };
    return res as Response;
}

describe("autorizar", () => {
    it("deve retornar 401 quando req.usuario não está definido", () => {
        const req = {} as Request;
        const res = criarMockRes();
        const next = vi.fn() as NextFunction;

        autorizar("ADMINISTRADOR")(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            erro: "Usuário não autenticado",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("deve retornar 403 quando o tipo do usuário não está na lista permitida", () => {
        const req = {
            usuario: { id: "usuario-1", tipo: "OPERADOR" },
        } as Request;
        const res = criarMockRes();
        const next = vi.fn() as NextFunction;

        autorizar("ADMINISTRADOR", "GESTOR")(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            erro: "Usuário não possui permissão para realizar esta operação",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("deve chamar next quando o tipo do usuário está na lista permitida", () => {
        const req = {
            usuario: { id: "usuario-1", tipo: "GESTOR" },
        } as Request;
        const res = criarMockRes();
        const next = vi.fn() as NextFunction;

        autorizar("ADMINISTRADOR", "GESTOR")(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });
});
