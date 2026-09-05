import { describe, expect, it, vi, beforeEach } from "vitest";
import {
    criarPeca,
    atualizarPeca,
    deletarPeca,
} from "../../../src/pecas/peca.servico";
import { prisma } from "../../../src/prisma";

vi.mock("../../../src/prisma", () => ({
    prisma: {
        peca: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
    },
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe("criarPeca", () => {
    it("deve rejeitar quando já existe uma peça com o mesmo código", async () => {
        vi.mocked(prisma.peca.findUnique).mockResolvedValue({
            id: "peca-1",
            codigo: "PC-001",
        } as any);

        await expect(
            criarPeca({
                codigo: "PC-001",
                nome: "Rolamento",
                unidadeMedida: "UN",
                quantidadeEstoque: 10,
                estoqueMinimo: 2,
            }),
        ).rejects.toThrow("Já existe uma peça com este código");

        expect(prisma.peca.create).not.toHaveBeenCalled();
    });

    it("deve criar a peça quando o código é inédito", async () => {
        vi.mocked(prisma.peca.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.peca.create).mockResolvedValue({
            id: "peca-1",
            codigo: "PC-002",
            nome: "Correia",
        } as any);

        const resultado = await criarPeca({
            codigo: "PC-002",
            nome: "Correia",
            unidadeMedida: "UN",
            quantidadeEstoque: 5,
            estoqueMinimo: 1,
        });

        expect(resultado).toEqual(
            expect.objectContaining({ id: "peca-1", codigo: "PC-002" }),
        );
    });
});

describe("atualizarPeca", () => {
    it("deve rejeitar quando a peça não existe", async () => {
        vi.mocked(prisma.peca.findUnique).mockResolvedValue(null);

        await expect(
            atualizarPeca("peca-inexistente", { nome: "Novo nome" }),
        ).rejects.toThrow("Peça não encontrada");
    });

    it("deve rejeitar quando o novo código já pertence a outra peça", async () => {
        vi.mocked(prisma.peca.findUnique).mockResolvedValue({
            id: "peca-1",
            codigo: "PC-001",
        } as any);
        vi.mocked(prisma.peca.findFirst).mockResolvedValue({
            id: "peca-2",
            codigo: "PC-999",
        } as any);

        await expect(
            atualizarPeca("peca-1", { codigo: "PC-999" }),
        ).rejects.toThrow("Já existe uma peça com este código");
    });

    it("deve atualizar a peça quando os dados são válidos", async () => {
        vi.mocked(prisma.peca.findUnique).mockResolvedValue({
            id: "peca-1",
            codigo: "PC-001",
        } as any);
        vi.mocked(prisma.peca.update).mockResolvedValue({
            id: "peca-1",
            quantidadeEstoque: 50,
        } as any);

        const resultado = await atualizarPeca("peca-1", {
            quantidadeEstoque: 50,
        });

        expect(resultado).toEqual(
            expect.objectContaining({ quantidadeEstoque: 50 }),
        );
        expect(prisma.peca.findFirst).not.toHaveBeenCalled();
    });
});

describe("deletarPeca", () => {
    it("deve rejeitar quando a peça não existe", async () => {
        vi.mocked(prisma.peca.findUnique).mockResolvedValue(null);

        await expect(deletarPeca("peca-inexistente")).rejects.toThrow(
            "Peça não encontrada",
        );
    });

    it("deve excluir a peça quando ela existe", async () => {
        vi.mocked(prisma.peca.findUnique).mockResolvedValue({
            id: "peca-1",
        } as any);
        vi.mocked(prisma.peca.delete).mockResolvedValue({ id: "peca-1" } as any);

        const resultado = await deletarPeca("peca-1");

        expect(resultado).toEqual(expect.objectContaining({ id: "peca-1" }));
        expect(prisma.peca.delete).toHaveBeenCalledWith({
            where: { id: "peca-1" },
        });
    });
});
