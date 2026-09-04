import { prisma } from "../prisma";

interface CriarSetorDados {
    nome: string;
    descricao?: string;
}

interface AtualizarSetorDados {
    nome?: string;
    descricao?: string;
}

export async function criarSetor(dados: CriarSetorDados) {
    const setorExistente = await prisma.setor.findFirst({
        where: {
            nome: dados.nome,
        },
    });

    if (setorExistente) {
        throw new Error("Já existe um setor com este nome");
    }

    const setor = await prisma.setor.create({
        data: {
            nome: dados.nome,
            descricao: dados.descricao,
        },
    });

    return setor;
}

export async function atualizarSetor(id: string, dados: AtualizarSetorDados) {
    const setor = await prisma.setor.findUnique({
        where: {
            id,
        },
    });

    if (!setor) {
        throw new Error("Setor não encontrado");
    }

    if (dados.nome) {
        const setorComMesmoNome = await prisma.setor.findFirst({
            where: {
                nome: dados.nome,
                NOT: {
                    id,
                },
            },
        });

        if (setorComMesmoNome) {
            throw new Error("Já existe um setor com este nome");
        }
    }

    return prisma.setor.update({
        where: {
            id,
        },
        data: dados,
    });
}

export async function deletarSetor(id: string) {
    const setor = await prisma.setor.findUnique({
        where: {
            id,
        },
    });

    if (!setor) {
        throw new Error("Setor não encontrado");
    }

    return prisma.setor.delete({
        where: {
            id,
        },
    });
}
