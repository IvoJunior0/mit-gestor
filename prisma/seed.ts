import { PrismaClient, StatusMaquina, TipoUsuario } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const setor = await prisma.setor.upsert({
        where: { nome: "Produção" },
        update: {},
        create: {
            nome: "Produção",
            descricao:
                "Setor responsável pelas operações de produção industrial.",
        },
    });

    await prisma.maquina.upsert({
        where: { codigo: "PRENSA-01" },
        update: {},
        create: {
            codigo: "PRENSA-01",
            nome: "Prensa Hidráulica",
            fabricante: "Fabricante Industrial",
            modelo: "PH-500",
            horimetro: 8450,
            status: StatusMaquina.EM_OPERACAO,
            setorId: setor.id,
        },
    });

    await prisma.usuario.upsert({
        where: { email: "tecnico@industria.local" },
        update: {},
        create: {
            nome: "Técnico de Manutenção",
            email: "tecnico@industria.local",
            senha: "trocar-esta-senha",
            tipo: TipoUsuario.TECNICO,
        },
    });

    await prisma.peca.upsert({
        where: { codigo: "ROL-6205" },
        update: {},
        create: {
            codigo: "ROL-6205",
            nome: "Rolamento 6205",
            quantidadeEstoque: 10,
            estoqueMinimo: 5,
            unidadeMedida: "unidade",
        },
    });
}

main()
    .then(() => console.log("Dados iniciais criados."))
    .catch(console.error)
    .finally(() => prisma.$disconnect());
