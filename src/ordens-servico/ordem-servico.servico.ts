import { prisma } from "../prisma";
import type { AdicionarPecaOrdemServicoDados } from "./ordem-servico.schema";

interface CriarOrdemServicoDados {
    descricao: string;
    prioridade: "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";
    maquinaId: string;
    responsavelId?: string;
}

interface AtualizarOrdemServicoDados {
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

    const ordemAtiva = await prisma.ordemServico.findFirst({
        where: {
            maquinaId: dados.maquinaId,
            status: {
                in: ["ABERTA", "EM_ANDAMENTO", "AGUARDANDO_PECA"],
            },
        },
    });

    if (ordemAtiva) {
        throw new Error(
            "A máquina já possui uma ordem de serviço em andamento.",
        );
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
            tecnicoResponsavel: true,
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
            tecnicoResponsavel: true,
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

export async function adicionarPecaNaOrdemServico(
    ordemServicoId: string,
    dados: AdicionarPecaOrdemServicoDados,
) {
    return prisma.$transaction(async (tx) => {
        const ordemServico = await tx.ordemServico.findUnique({
            where: {
                id: ordemServicoId,
            },
        });

        if (!ordemServico) {
            throw new Error("Ordem de serviço não encontrada");
        }

        const peca = await tx.peca.findUnique({
            where: {
                id: dados.pecaId,
            },
        });

        if (!peca) {
            throw new Error("Peça não encontrada");
        }

        // if (peca.quantidadeEstoque < dados.quantidade) {
        //     throw new Error(
        //         `Estoque insuficiente. Disponível: ${peca.quantidadeEstoque}`,
        //     );
        // }

        // await tx.peca.update({
        //     where: {
        //         id: dados.pecaId,
        //     },
        //     data: {
        //         quantidadeEstoque: {
        //             decrement: dados.quantidade,
        //         },
        //     },
        // });

        const estoqueAtualizado = await tx.peca.updateMany({
            where: {
                id: dados.pecaId,
                quantidadeEstoque: {
                    gte: dados.quantidade,
                },
            },
            data: {
                quantidadeEstoque: {
                    decrement: dados.quantidade,
                },
            },
        });

        if (estoqueAtualizado.count === 0) {
            throw new Error("Estoque insuficiente");
        }

        // 5. Verifica se a peça já foi adicionada à OS
        const itemExistente = await tx.itemOrdemServico.findUnique({
            where: {
                ordemServicoId_pecaId: {
                    ordemServicoId,
                    pecaId: dados.pecaId,
                },
            },
        });

        let item;

        if (itemExistente) {
            // Se já existe, apenas aumenta a quantidade
            item = await tx.itemOrdemServico.update({
                where: {
                    id: itemExistente.id,
                },
                data: {
                    quantidade: {
                        increment: dados.quantidade,
                    },
                },
                include: {
                    peca: true,
                },
            });
        } else {
            // Caso ainda não exista, cria o item
            item = await tx.itemOrdemServico.create({
                data: {
                    ordemServicoId,
                    pecaId: dados.pecaId,
                    quantidade: dados.quantidade,
                },
                include: {
                    peca: true,
                },
            });
        }

        return item;
    });
}
