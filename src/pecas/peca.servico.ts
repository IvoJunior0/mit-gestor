import { prisma } from "../prisma";

interface CriarPecaDados {
    codigo: string;
    nome: string;
    unidadeMedida: string;
    quantidadeEstoque: number;
    estoqueMinimo: number;
}

interface AtualizarPecaDados {
    codigo?: string;
    nome?: string;
    unidadeMedida?: string;
    quantidadeEstoque?: number;
    estoqueMinimo?: number;
}

export async function criarPeca(dados: CriarPecaDados) {
    const pecaExistente = await prisma.peca.findUnique({
        where: {
            codigo: dados.codigo,
        },
    });

    if (pecaExistente) {
        throw new Error("Já existe uma peça com este código");
    }

    return prisma.peca.create({
        data: dados,
    });
}

export async function atualizarPeca(id: string, dados: AtualizarPecaDados) {
    const peca = await prisma.peca.findUnique({
        where: { id },
    });

    if (!peca) {
        throw new Error("Peça não encontrada");
    }

    if (dados.codigo) {
        const codigoExistente = await prisma.peca.findFirst({
            where: {
                codigo: dados.codigo,
                NOT: {
                    id,
                },
            },
        });

        if (codigoExistente) {
            throw new Error("Já existe uma peça com este código");
        }
    }

    return prisma.peca.update({
        where: { id },
        data: dados,
    });
}

export async function deletarPeca(id: string) {
    const peca = await prisma.peca.findUnique({
        where: { id },
    });

    if (!peca) {
        throw new Error("Peça não encontrada");
    }

    return prisma.peca.delete({
        where: { id },
    });
}
