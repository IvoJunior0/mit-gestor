import { describe, expect, it, vi, beforeEach } from "vitest";
import {
    criarManutencao,
    atualizarManutencao,
    deletarManutencao,
} from "../../../src/manutencoes/manutencao.servico";
import { prisma } from "../../../src/prisma";

vi.mock("../../../src/prisma", () => ({
    prisma: {
        maquina: {
            findUnique: vi.fn(),
        },
        ordemServico: {
            findUnique: vi.fn(),
        },
        manutencao: {
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
    },
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe("criarManutencao", () => {
    it("deve rejeitar quando a máquina não existe", async () => {
        vi.mocked(prisma.maquina.findUnique).mockResolvedValue(null);

        await expect(
            criarManutencao({
                tipo: "PREVENTIVA",
                descricao: "Troca de óleo",
                dataInicio: new Date(),
                maquinaId: "maquina-inexistente",
            }),
        ).rejects.toThrow("Máquina não encontrada");
    });

    it("deve rejeitar quando a ordem de serviço informada não existe", async () => {
        vi.mocked(prisma.maquina.findUnique).mockResolvedValue({
            id: "maquina-1",
        } as any);
        vi.mocked(prisma.ordemServico.findUnique).mockResolvedValue(null);

        await expect(
            criarManutencao({
                tipo: "CORRETIVA",
                descricao: "Troca de rolamento",
                dataInicio: new Date(),
                maquinaId: "maquina-1",
                ordemServicoId: "os-inexistente",
            }),
        ).rejects.toThrow("Ordem de serviço não encontrada");
    });

    it("deve criar a manutenção quando os dados são válidos", async () => {
        vi.mocked(prisma.maquina.findUnique).mockResolvedValue({
            id: "maquina-1",
        } as any);
        vi.mocked(prisma.manutencao.create).mockResolvedValue({
            id: "manutencao-1",
            descricao: "Troca de óleo",
        } as any);

        const resultado = await criarManutencao({
            tipo: "PREVENTIVA",
            descricao: "Troca de óleo",
            dataInicio: new Date(),
            maquinaId: "maquina-1",
        });

        expect(resultado).toEqual(
            expect.objectContaining({ id: "manutencao-1" }),
        );
        expect(prisma.ordemServico.findUnique).not.toHaveBeenCalled();
    });
});

describe("atualizarManutencao", () => {
    it("deve rejeitar quando a manutenção não existe", async () => {
        vi.mocked(prisma.manutencao.findUnique).mockResolvedValue(null);

        await expect(
            atualizarManutencao("manutencao-inexistente", {
                descricao: "Nova descrição",
            }),
        ).rejects.toThrow("Manutenção não encontrada");
    });

    it("deve atualizar a manutenção quando ela existe", async () => {
        vi.mocked(prisma.manutencao.findUnique).mockResolvedValue({
            id: "manutencao-1",
        } as any);
        vi.mocked(prisma.manutencao.update).mockResolvedValue({
            id: "manutencao-1",
            descricao: "Nova descrição",
        } as any);

        const resultado = await atualizarManutencao("manutencao-1", {
            descricao: "Nova descrição",
        });

        expect(resultado).toEqual(
            expect.objectContaining({ descricao: "Nova descrição" }),
        );
    });
});

describe("deletarManutencao", () => {
    it("deve rejeitar quando a manutenção não existe", async () => {
        vi.mocked(prisma.manutencao.findUnique).mockResolvedValue(null);

        await expect(deletarManutencao("manutencao-inexistente")).rejects.toThrow(
            "Manutenção não encontrada",
        );
    });

    it("deve excluir a manutenção quando ela existe", async () => {
        vi.mocked(prisma.manutencao.findUnique).mockResolvedValue({
            id: "manutencao-1",
        } as any);
        vi.mocked(prisma.manutencao.delete).mockResolvedValue({
            id: "manutencao-1",
        } as any);

        const resultado = await deletarManutencao("manutencao-1");

        expect(resultado).toEqual(
            expect.objectContaining({ id: "manutencao-1" }),
        );
    });
});
