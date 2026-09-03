import bcrypt from "bcrypt";
import { prisma } from "../prisma";

interface CriarUsuarioDados {
    nome: string;
    email: string;
    senha: string;
    tipo: "ADMINISTRADOR" | "GESTOR" | "TECNICO" | "OPERADOR";
}

export async function criarUsuario(dados: CriarUsuarioDados) {
    const usuarioExistente = await prisma.usuario.findUnique({
        where: {
            email: dados.email,
        },
    });

    if (usuarioExistente) {
        throw new Error("E-mail já cadastrado");
    }

    const senhaHash = await bcrypt.hash(dados.senha, 12);

    const usuario = await prisma.usuario.create({
        data: {
            nome: dados.nome,
            email: dados.email,
            senha: senhaHash,
            tipo: dados.tipo,
        },
    });

    return {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo,
    };
}
