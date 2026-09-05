import { prisma } from "../prisma";

interface CriarManutencaoDados {
    tipo: "PREVENTIVA" | "CORRETIVA";
    descricao: string;
    realizadaEm?: Date;
    proximaManutencao?: Date;
    maquinaId: string;
    ordemServicoId?: string;
}

interface AtualizarManutencaoDados {
    descricao?: string;
    realizadaEm?: Date;
    proximaManutencao?: Date | null;
}

export async function criarManutencao(dados: CriarManutencaoDados) {
    const maquina = await prisma.maquina.findUnique({
        where: {
            id: dados.maquinaId,
        },
    });

    if (!maquina) {
        throw new Error("Máquina não encontrada");
    }

    if (dados.ordemServicoId) {
        const ordem = await prisma.ordemServico.findUnique({
            where: {
                id: dados.ordemServicoId,
            },
        });

        if (!ordem) {
            throw new Error("Ordem de serviço não encontrada");
        }
    }

    return prisma.manutencao.create({
        data: dados,
        include: {
            maquina: true,
            ordemServico: true,
        },
    });
}

export async function atualizarManutencao(
    id: string,
    dados: AtualizarManutencaoDados,
) {
    const manutencao = await prisma.manutencao.findUnique({
        where: { id },
    });

    if (!manutencao) {
        throw new Error("Manutenção não encontrada");
    }

    return prisma.manutencao.update({
        where: { id },
        data: dados,
        include: {
            maquina: true,
            ordemServico: true,
        },
    });
}

export async function deletarManutencao(id: string) {
    const manutencao = await prisma.manutencao.findUnique({
        where: { id },
    });

    if (!manutencao) {
        throw new Error("Manutenção não encontrada");
    }

    return prisma.manutencao.delete({
        where: { id },
    });
}
