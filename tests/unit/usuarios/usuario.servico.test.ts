import { describe, expect, it, vi, beforeEach } from "vitest";
import { criarUsuario } from "../../../src/usuarios/usuario.servico";
import { prisma } from "../../../src/prisma";
import bcrypt from "bcrypt";

vi.mock("../../../src/prisma", () => ({
    prisma: {
        usuario: {
            findUnique: vi.fn(),
            create: vi.fn(),
        },
    },
}));

vi.mock("bcrypt", () => ({
    default: {
        hash: vi.fn(),
    },
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe("criarUsuario", () => {
    it("deve rejeitar quando o e-mail já está cadastrado", async () => {
        vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
            id: "usuario-1",
        } as any);

        await expect(
            criarUsuario({
                nome: "Fulano",
                email: "fulano@exemplo.com",
                senha: "senha12345",
                tipo: "OPERADOR",
            }),
        ).rejects.toThrow("E-mail já cadastrado");

        expect(prisma.usuario.create).not.toHaveBeenCalled();
    });

    it("deve criar o usuário com a senha em hash e nunca retornar a senha", async () => {
        vi.mocked(prisma.usuario.findUnique).mockResolvedValue(null);
        vi.mocked(bcrypt.hash).mockResolvedValue("senha-em-hash" as never);
        vi.mocked(prisma.usuario.create).mockResolvedValue({
            id: "usuario-1",
            nome: "Fulano",
            email: "fulano@exemplo.com",
            senha: "senha-em-hash",
            tipo: "OPERADOR",
        } as any);

        const resultado = await criarUsuario({
            nome: "Fulano",
            email: "fulano@exemplo.com",
            senha: "senha12345",
            tipo: "OPERADOR",
        });

        expect(bcrypt.hash).toHaveBeenCalledWith("senha12345", 12);
        expect(resultado).toEqual({
            id: "usuario-1",
            nome: "Fulano",
            email: "fulano@exemplo.com",
            tipo: "OPERADOR",
        });
        expect(resultado).not.toHaveProperty("senha");
    });
});
