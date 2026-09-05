import { prisma } from "../../../src/prisma";

export { prisma };

/**
 * Remove todos os dados do banco de teste, respeitando a ordem das
 * chaves estrangeiras. Deve ser chamado no beforeEach/afterEach de cada
 * suíte de integração para garantir isolamento entre os testes.
 */
export async function limparBanco() {
    await prisma.$transaction([
        prisma.itemOrdemServico.deleteMany(),
        prisma.manutencao.deleteMany(),
        prisma.ordemServico.deleteMany(),
        prisma.sessao.deleteMany(),
        prisma.maquina.deleteMany(),
        prisma.peca.deleteMany(),
        prisma.setor.deleteMany(),
        prisma.usuario.deleteMany(),
    ]);
}

export async function encerrarConexao() {
    await prisma.$disconnect();
}
