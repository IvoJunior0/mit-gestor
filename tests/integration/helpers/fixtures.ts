import { prisma } from "./db";

let contador = 0;

export async function criarSetorTeste(nome?: string) {
    contador += 1;

    return prisma.setor.create({
        data: {
            nome: nome ?? `Setor Teste ${contador}`,
            descricao: "Setor criado para testes de integração",
        },
    });
}

export async function criarMaquinaTeste(
    setorId: string,
    dados: Partial<{
        codigo: string;
        nome: string;
        status: "EM_OPERACAO" | "EM_MANUTENCAO" | "PARADA" | "INATIVA";
        horimetro: number;
    }> = {},
) {
    contador += 1;

    return prisma.maquina.create({
        data: {
            codigo: dados.codigo ?? `MAQ-${contador}`,
            nome: dados.nome ?? `Máquina Teste ${contador}`,
            horimetro: dados.horimetro ?? 0,
            status: dados.status ?? "EM_OPERACAO",
            setorId,
        },
    });
}

export async function criarPecaTeste(
    dados: Partial<{
        codigo: string;
        nome: string;
        quantidadeEstoque: number;
        estoqueMinimo: number;
    }> = {},
) {
    contador += 1;

    return prisma.peca.create({
        data: {
            codigo: dados.codigo ?? `PC-${contador}`,
            nome: dados.nome ?? `Peça Teste ${contador}`,
            unidadeMedida: "UN",
            quantidadeEstoque: dados.quantidadeEstoque ?? 10,
            estoqueMinimo: dados.estoqueMinimo ?? 1,
        },
    });
}
