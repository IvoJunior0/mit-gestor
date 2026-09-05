import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { autenticar } from "../../../src/autenticacao/autenticacao.middleware";
import jwt from "jsonwebtoken";

vi.mock("jsonwebtoken", () => ({
    default: {
        verify: vi.fn(),
    },
}));

function criarMockRes() {
    const res: Partial<Response> = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    };
    return res as Response;
}

beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "segredo-de-teste-unitario";
});

describe("autenticar", () => {
    it("deve retornar 401 quando não há cabeçalho Authorization", () => {
        const req = { headers: {} } as Request;
        const res = criarMockRes();
        const next = vi.fn() as NextFunction;

        autenticar(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            erro: "Token de autenticação não fornecido",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("deve retornar 401 quando o formato do cabeçalho é inválido", () => {
        const req = {
            headers: { authorization: "TokenSemBearer abc123" },
        } as Request;
        const res = criarMockRes();
        const next = vi.fn() as NextFunction;

        autenticar(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            erro: "Formato do token inválido",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("deve retornar 401 quando o token é inválido ou expirado", () => {
        const req = {
            headers: { authorization: "Bearer token-invalido" },
        } as Request;
        const res = criarMockRes();
        const next = vi.fn() as NextFunction;

        vi.mocked(jwt.verify).mockImplementation(() => {
            throw new Error("jwt expired");
        });

        autenticar(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            erro: "Token inválido ou expirado",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("deve popular req.usuario e chamar next quando o token é válido", () => {
        const req = {
            headers: { authorization: "Bearer token-valido" },
        } as Request;
        const res = criarMockRes();
        const next = vi.fn() as NextFunction;

        vi.mocked(jwt.verify).mockReturnValue({
            id: "usuario-1",
            tipo: "GESTOR",
        } as any);

        autenticar(req, res, next);

        expect(req.usuario).toEqual({ id: "usuario-1", tipo: "GESTOR" });
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });
});
