import { prisma } from "../prisma";

interface CriarMaquinaDados {
    codigo: string;
    nome: string;
    fabricante?: string;
    modelo?: string;
    numeroSerie?: string;
    horimetro: number;
    setorId: string;
}

interface AtualizarMaquinaDados {
    codigo?: string;
    nome?: string;
    fabricante?: string;
    modelo?: string;
    numeroSerie?: string;
    horimetro?: number;
    setorId?: string;
    status?: "EM_OPERACAO" | "EM_MANUTENCAO" | "PARADA" | "INATIVA";
}

export async function criarMaquina(dados: CriarMaquinaDados) {
    const codigoExistente = await prisma.maquina.findUnique({
        where: {
            codigo: dados.codigo,
        },
    });

    if (codigoExistente) {
        throw new Error("Já existe uma máquina com este código");
    }

    const setor = await prisma.setor.findUnique({
        where: {
            id: dados.setorId,
        },
    });

    if (!setor) {
        throw new Error("Setor não encontrado");
    }

    return prisma.maquina.create({
        data: dados,
    });
}

export async function atualizarMaquina(
    id: string,
    dados: AtualizarMaquinaDados,
) {
    const maquina = await prisma.maquina.findUnique({
        where: { id },
    });

    if (!maquina) {
        throw new Error("Máquina não encontrada");
    }

    if (dados.codigo) {
        const codigoExistente = await prisma.maquina.findFirst({
            where: {
                codigo: dados.codigo,
                NOT: {
                    id,
                },
            },
        });

        if (codigoExistente) {
            throw new Error("Já existe uma máquina com este código");
        }
    }

    if (dados.setorId) {
        const setor = await prisma.setor.findUnique({
            where: {
                id: dados.setorId,
            },
        });

        if (!setor) {
            throw new Error("Setor não encontrado");
        }
    }

    return prisma.maquina.update({
        where: { id },
        data: dados,
    });
}

export async function deletarMaquina(id: string) {
    const maquina = await prisma.maquina.findUnique({
        where: { id },
    });

    if (!maquina) {
        throw new Error("Máquina não encontrada");
    }

    return prisma.maquina.delete({
        where: { id },
    });
}
