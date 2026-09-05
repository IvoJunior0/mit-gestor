import { describe, expect, it, vi, beforeEach } from "vitest";
import {
    criarSetor,
    atualizarSetor,
    deletarSetor,
} from "../../../src/setores/setor.servico";
import { prisma } from "../../../src/prisma";

vi.mock("../../../src/prisma", () => ({
    prisma: {
        setor: {
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

describe("criarSetor", () => {
    it("deve rejeitar quando já existe um setor com o mesmo nome", async () => {
        vi.mocked(prisma.setor.findFirst).mockResolvedValue({
            id: "setor-1",
        } as any);

        await expect(
            criarSetor({ nome: "Produção" }),
        ).rejects.toThrow("Já existe um setor com este nome");
    });

    it("deve criar o setor quando o nome é inédito", async () => {
        vi.mocked(prisma.setor.findFirst).mockResolvedValue(null);
        vi.mocked(prisma.setor.create).mockResolvedValue({
            id: "setor-1",
            nome: "Produção",
        } as any);

        const resultado = await criarSetor({ nome: "Produção" });

        expect(resultado).toEqual(
            expect.objectContaining({ id: "setor-1", nome: "Produção" }),
        );
    });
});

describe("atualizarSetor", () => {
    it("deve rejeitar quando o setor não existe", async () => {
        vi.mocked(prisma.setor.findUnique).mockResolvedValue(null);

        await expect(
            atualizarSetor("setor-inexistente", { nome: "Novo nome" }),
        ).rejects.toThrow("Setor não encontrado");
    });

    it("deve rejeitar quando o novo nome já pertence a outro setor", async () => {
        vi.mocked(prisma.setor.findUnique).mockResolvedValue({
            id: "setor-1",
            nome: "Produção",
        } as any);
        vi.mocked(prisma.setor.findFirst).mockResolvedValue({
            id: "setor-2",
            nome: "Manutenção",
        } as any);

        await expect(
            atualizarSetor("setor-1", { nome: "Manutenção" }),
        ).rejects.toThrow("Já existe um setor com este nome");
    });

    it("deve atualizar o setor quando os dados são válidos", async () => {
        vi.mocked(prisma.setor.findUnique).mockResolvedValue({
            id: "setor-1",
            nome: "Produção",
        } as any);
        vi.mocked(prisma.setor.update).mockResolvedValue({
            id: "setor-1",
            descricao: "Nova descrição",
        } as any);

        const resultado = await atualizarSetor("setor-1", {
            descricao: "Nova descrição",
        });

        expect(resultado).toEqual(
            expect.objectContaining({ descricao: "Nova descrição" }),
        );
        expect(prisma.setor.findFirst).not.toHaveBeenCalled();
    });
});

describe("deletarSetor", () => {
    it("deve rejeitar quando o setor não existe", async () => {
        vi.mocked(prisma.setor.findUnique).mockResolvedValue(null);

        await expect(deletarSetor("setor-inexistente")).rejects.toThrow(
            "Setor não encontrado",
        );
    });

    it("deve excluir o setor quando ele existe", async () => {
        vi.mocked(prisma.setor.findUnique).mockResolvedValue({
            id: "setor-1",
        } as any);
        vi.mocked(prisma.setor.delete).mockResolvedValue({ id: "setor-1" } as any);

        const resultado = await deletarSetor("setor-1");

        expect(resultado).toEqual(expect.objectContaining({ id: "setor-1" }));
    });
});
