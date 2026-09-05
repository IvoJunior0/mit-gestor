import { describe, expect, it, vi, beforeEach } from "vitest";
import {
    realizarLogin,
    renovarAccessToken,
    realizarLogout,
} from "../../../src/autenticacao/autenticacao.servico";
import { prisma } from "../../../src/prisma";

vi.mock("../../../src/prisma", () => ({
    prisma: {
        usuario: {
            findUnique: vi.fn(),
        },
        sessao: {
            create: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
        },
    },
}));

vi.mock("bcrypt", () => ({
    default: {
        compare: vi.fn(),
    },
}));

vi.mock("jsonwebtoken", () => ({
    default: {
        sign: vi.fn(),
    },
}));

vi.mock("../../../src/autenticacao/autenticacao.util", () => ({
    gerarRefreshToken: vi.fn(),
    gerarHashToken: vi.fn(),
}));

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
    gerarRefreshToken,
    gerarHashToken,
} from "../../../src/autenticacao/autenticacao.util";

beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "segredo-de-teste-unitario";
});

describe("realizarLogin", () => {
    it("deve rejeitar quando o e-mail não existe", async () => {
        vi.mocked(prisma.usuario.findUnique).mockResolvedValue(null);

        await expect(
            realizarLogin({ email: "inexistente@exemplo.com", senha: "123456" }),
        ).rejects.toThrow("E-mail ou senha inválidos");
    });

    it("deve rejeitar quando a senha está incorreta", async () => {
        vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
            id: "usuario-1",
            senha: "hash-armazenado",
        } as any);
        vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

        await expect(
            realizarLogin({ email: "usuario@exemplo.com", senha: "senha-errada" }),
        ).rejects.toThrow("E-mail ou senha inválidos");
    });

    it("deve autenticar com sucesso e criar uma sessão", async () => {
        vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
            id: "usuario-1",
            nome: "Fulano",
            email: "usuario@exemplo.com",
            senha: "hash-armazenado",
            tipo: "GESTOR",
        } as any);
        vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
        vi.mocked(jwt.sign).mockReturnValue("access-token-fake" as any);
        vi.mocked(gerarRefreshToken).mockReturnValue("refresh-token-fake");
        vi.mocked(gerarHashToken).mockReturnValue("hash-do-refresh-token");
        vi.mocked(prisma.sessao.create).mockResolvedValue({} as any);

        const resultado = await realizarLogin({
            email: "usuario@exemplo.com",
            senha: "senha-correta",
        });

        expect(resultado).toEqual({
            accessToken: "access-token-fake",
            refreshToken: "refresh-token-fake",
            usuario: {
                id: "usuario-1",
                nome: "Fulano",
                email: "usuario@exemplo.com",
                tipo: "GESTOR",
            },
        });

        expect(prisma.sessao.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    tokenHash: "hash-do-refresh-token",
                    usuarioId: "usuario-1",
                }),
            }),
        );
    });
});

describe("renovarAccessToken", () => {
    it("deve rejeitar quando a sessão não existe", async () => {
        vi.mocked(gerarHashToken).mockReturnValue("hash-qualquer");
        vi.mocked(prisma.sessao.findUnique).mockResolvedValue(null);

        await expect(renovarAccessToken("token-invalido")).rejects.toThrow(
            "Refresh token inválido",
        );
    });

    it("deve rejeitar quando a sessão foi revogada", async () => {
        vi.mocked(gerarHashToken).mockReturnValue("hash-qualquer");
        vi.mocked(prisma.sessao.findUnique).mockResolvedValue({
            id: "sessao-1",
            revogadaEm: new Date(),
            expiraEm: new Date(Date.now() + 100000),
            usuario: { id: "usuario-1", tipo: "GESTOR" },
        } as any);

        await expect(renovarAccessToken("token-revogado")).rejects.toThrow(
            "Sessão revogada",
        );
    });

    it("deve rejeitar quando a sessão está expirada", async () => {
        vi.mocked(gerarHashToken).mockReturnValue("hash-qualquer");
        vi.mocked(prisma.sessao.findUnique).mockResolvedValue({
            id: "sessao-1",
            revogadaEm: null,
            expiraEm: new Date(Date.now() - 1000),
            usuario: { id: "usuario-1", tipo: "GESTOR" },
        } as any);

        await expect(renovarAccessToken("token-expirado")).rejects.toThrow(
            "Refresh token expirado",
        );
    });

    it("deve gerar um novo access token para uma sessão válida", async () => {
        vi.mocked(gerarHashToken).mockReturnValue("hash-qualquer");
        vi.mocked(prisma.sessao.findUnique).mockResolvedValue({
            id: "sessao-1",
            revogadaEm: null,
            expiraEm: new Date(Date.now() + 100000),
            usuario: { id: "usuario-1", tipo: "GESTOR" },
        } as any);
        vi.mocked(jwt.sign).mockReturnValue("novo-access-token" as any);

        const resultado = await renovarAccessToken("token-valido");

        expect(resultado).toEqual({ accessToken: "novo-access-token" });
    });
});

describe("realizarLogout", () => {
    it("não deve lançar erro quando a sessão não existe (idempotente)", async () => {
        vi.mocked(gerarHashToken).mockReturnValue("hash-qualquer");
        vi.mocked(prisma.sessao.findUnique).mockResolvedValue(null);

        await expect(realizarLogout("token-inexistente")).resolves.toBeUndefined();
        expect(prisma.sessao.update).not.toHaveBeenCalled();
    });

    it("deve revogar a sessão existente", async () => {
        vi.mocked(gerarHashToken).mockReturnValue("hash-qualquer");
        vi.mocked(prisma.sessao.findUnique).mockResolvedValue({
            id: "sessao-1",
        } as any);
        vi.mocked(prisma.sessao.update).mockResolvedValue({} as any);

        await realizarLogout("token-valido");

        expect(prisma.sessao.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: "sessao-1" },
                data: expect.objectContaining({ revogadaEm: expect.any(Date) }),
            }),
        );
    });
});
