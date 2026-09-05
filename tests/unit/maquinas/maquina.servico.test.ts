import { describe, expect, it, vi, beforeEach } from "vitest";
import {
    criarMaquina,
    atualizarMaquina,
    deletarMaquina,
} from "../../../src/maquinas/maquina.servico";
import { prisma } from "../../../src/prisma";

vi.mock("../../../src/prisma", () => ({
    prisma: {
        maquina: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        setor: {
            findUnique: vi.fn(),
        },
    },
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe("criarMaquina", () => {
    it("deve rejeitar quando já existe uma máquina com o mesmo código", async () => {
        vi.mocked(prisma.maquina.findUnique).mockResolvedValue({
            id: "maquina-1",
        } as any);

        await expect(
            criarMaquina({
                codigo: "MAQ-001",
                nome: "Torno",
                horimetro: 0,
                setorId: "setor-1",
            }),
        ).rejects.toThrow("Já existe uma máquina com este código");

        expect(prisma.setor.findUnique).not.toHaveBeenCalled();
    });

    it("deve rejeitar quando o setor informado não existe", async () => {
        vi.mocked(prisma.maquina.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.setor.findUnique).mockResolvedValue(null);

        await expect(
            criarMaquina({
                codigo: "MAQ-002",
                nome: "Torno",
                horimetro: 0,
                setorId: "setor-inexistente",
            }),
        ).rejects.toThrow("Setor não encontrado");
    });

    it("deve criar a máquina quando código e setor são válidos", async () => {
        vi.mocked(prisma.maquina.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.setor.findUnique).mockResolvedValue({
            id: "setor-1",
        } as any);
        vi.mocked(prisma.maquina.create).mockResolvedValue({
            id: "maquina-1",
            codigo: "MAQ-003",
        } as any);

        const resultado = await criarMaquina({
            codigo: "MAQ-003",
            nome: "Torno",
            horimetro: 0,
            setorId: "setor-1",
        });

        expect(resultado).toEqual(
            expect.objectContaining({ id: "maquina-1", codigo: "MAQ-003" }),
        );
    });
});

describe("atualizarMaquina", () => {
    it("deve rejeitar quando a máquina não existe", async () => {
        vi.mocked(prisma.maquina.findUnique).mockResolvedValue(null);

        await expect(
            atualizarMaquina("maquina-inexistente", { nome: "Novo nome" }),
        ).rejects.toThrow("Máquina não encontrada");
    });

    it("deve rejeitar quando o novo código já pertence a outra máquina", async () => {
        vi.mocked(prisma.maquina.findUnique).mockResolvedValue({
            id: "maquina-1",
        } as any);
        vi.mocked(prisma.maquina.findFirst).mockResolvedValue({
            id: "maquina-2",
        } as any);

        await expect(
            atualizarMaquina("maquina-1", { codigo: "MAQ-999" }),
        ).rejects.toThrow("Já existe uma máquina com este código");
    });

    it("deve rejeitar quando o novo setor não existe", async () => {
        vi.mocked(prisma.maquina.findUnique).mockResolvedValue({
            id: "maquina-1",
        } as any);
        vi.mocked(prisma.setor.findUnique).mockResolvedValue(null);

        await expect(
            atualizarMaquina("maquina-1", { setorId: "setor-inexistente" }),
        ).rejects.toThrow("Setor não encontrado");
    });

    it("deve atualizar a máquina quando os dados são válidos", async () => {
        vi.mocked(prisma.maquina.findUnique).mockResolvedValue({
            id: "maquina-1",
        } as any);
        vi.mocked(prisma.maquina.update).mockResolvedValue({
            id: "maquina-1",
            status: "PARADA",
        } as any);

        const resultado = await atualizarMaquina("maquina-1", {
            status: "PARADA",
        });

        expect(resultado).toEqual(
            expect.objectContaining({ status: "PARADA" }),
        );
    });
});

describe("deletarMaquina", () => {
    it("deve rejeitar quando a máquina não existe", async () => {
        vi.mocked(prisma.maquina.findUnique).mockResolvedValue(null);

        await expect(deletarMaquina("maquina-inexistente")).rejects.toThrow(
            "Máquina não encontrada",
        );
    });

    it("deve excluir a máquina quando ela existe", async () => {
        vi.mocked(prisma.maquina.findUnique).mockResolvedValue({
            id: "maquina-1",
        } as any);
        vi.mocked(prisma.maquina.delete).mockResolvedValue({
            id: "maquina-1",
        } as any);

        const resultado = await deletarMaquina("maquina-1");

        expect(resultado).toEqual(expect.objectContaining({ id: "maquina-1" }));
    });
});
