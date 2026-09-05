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

type StatusOrdemServico =
    | "ABERTA"
    | "EM_ANDAMENTO"
    | "AGUARDANDO_PECA"
    | "CONCLUIDA"
    | "CANCELADA";

const transicoesPermitidas: Record<StatusOrdemServico, StatusOrdemServico[]> = {
    ABERTA: ["EM_ANDAMENTO", "CANCELADA"],
    EM_ANDAMENTO: ["AGUARDANDO_PECA", "CONCLUIDA", "CANCELADA"],
    AGUARDANDO_PECA: ["EM_ANDAMENTO", "CANCELADA"],
    CONCLUIDA: [],
    CANCELADA: [],
};

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

export async function atualizarStatusOrdemServico(
    id: string,
    novoStatus: StatusOrdemServico,
) {
    return prisma.$transaction(async (tx) => {
        const ordemServico = await tx.ordemServico.findUnique({
            where: {
                id,
            },
        });

        if (!ordemServico) {
            throw new Error("Ordem de serviço não encontrada");
        }

        validarTransicaoStatus(ordemServico.status, novoStatus);

        if (
            ordemServico.status === "ABERTA" &&
            novoStatus === "EM_ANDAMENTO" &&
            !ordemServico.tecnicoResponsavelId
        ) {
            throw new Error(
                "A ordem de serviço precisa ter um técnico responsável para ser iniciada",
            );
        }

        const agora = new Date();

        const dadosAtualizacao: {
            status: StatusOrdemServico;
            iniciadoEm?: Date;
            concluidoEm?: Date;
        } = {
            status: novoStatus,
        };

        if (ordemServico.status === "ABERTA" && novoStatus === "EM_ANDAMENTO") {
            dadosAtualizacao.iniciadoEm = agora;
        }

        if (
            ordemServico.status === "EM_ANDAMENTO" &&
            novoStatus === "CONCLUIDA"
        ) {
            dadosAtualizacao.concluidoEm = agora;
        }

        // A manutenção começou
        if (novoStatus === "EM_ANDAMENTO") {
            await tx.maquina.update({
                where: {
                    id: ordemServico.maquinaId,
                },
                data: {
                    status: "EM_MANUTENCAO",
                },
            });
        }

        // A manutenção terminou ou foi cancelada
        if (
            novoStatus === "CONCLUIDA" ||
            (novoStatus === "CANCELADA" && ordemServico.status !== "ABERTA")
        ) {
            await tx.maquina.update({
                where: {
                    id: ordemServico.maquinaId,
                },
                data: {
                    status: "EM_OPERACAO",
                },
            });
        }

        return tx.ordemServico.update({
            where: {
                id,
            },
            data: dadosAtualizacao,
            include: {
                maquina: true,
                tecnicoResponsavel: true,
                itens: {
                    include: {
                        peca: true,
                    },
                },
            },
        });
    });
}

function validarTransicaoStatus(
    statusAtual: StatusOrdemServico,
    novoStatus: StatusOrdemServico,
) {
    const transicoes = transicoesPermitidas[statusAtual];

    if (!transicoes.includes(novoStatus)) {
        throw new Error(
            `Não é possível alterar uma ordem de serviço de ${statusAtual} para ${novoStatus}`,
        );
    }
}
