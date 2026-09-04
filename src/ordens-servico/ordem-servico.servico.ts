import { prisma } from "../prisma";

interface CriarOrdemServicoDados {
    titulo: string;
    descricao: string;
    prioridade: "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";
    maquinaId: string;
    responsavelId?: string;
}

interface AtualizarOrdemServicoDados {
    titulo?: string;
    descricao?: string;
    prioridade?: "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";
    status?:
        | "ABERTA"
        | "EM_ANDAMENTO"
        | "AGUARDANDO_PECA"
        | "CONCLUIDA"
        | "CANCELADA";
    responsavelId?: string | null;
}

export async function criarOrdemServico(dados: CriarOrdemServicoDados) {
    const maquina = await prisma.maquina.findUnique({
        where: {
            id: dados.maquinaId,
        },
    });

    if (!maquina) {
        throw new Error("Máquina não encontrada");
    }

    if (dados.responsavelId) {
        const responsavel = await prisma.usuario.findUnique({
            where: {
                id: dados.responsavelId,
            },
        });

        if (!responsavel) {
            throw new Error("Responsável não encontrado");
        }
    }

    return prisma.ordemServico.create({
        data: dados,
        include: {
            maquina: true,
            responsavel: true,
        },
    });
}

export async function atualizarOrdemServico(
    id: string,
    dados: AtualizarOrdemServicoDados,
) {
    const ordem = await prisma.ordemServico.findUnique({
        where: { id },
    });

    if (!ordem) {
        throw new Error("Ordem de serviço não encontrada");
    }

    if (dados.responsavelId) {
        const responsavel = await prisma.usuario.findUnique({
            where: {
                id: dados.responsavelId,
            },
        });

        if (!responsavel) {
            throw new Error("Responsável não encontrado");
        }
    }

    return prisma.ordemServico.update({
        where: { id },
        data: dados,
        include: {
            maquina: true,
            responsavel: true,
        },
    });
}

export async function deletarOrdemServico(id: string) {
    const ordem = await prisma.ordemServico.findUnique({
        where: { id },
    });

    if (!ordem) {
        throw new Error("Ordem de serviço não encontrada");
    }

    return prisma.ordemServico.delete({
        where: { id },
    });
}
