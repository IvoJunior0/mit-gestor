import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";

interface LoginDados {
    email: string;
    senha: string;
}

export async function realizarLogin(dados: LoginDados) {
    const usuario = await prisma.usuario.findUnique({
        where: {
            email: dados.email,
        },
    });

    if (!usuario) {
        throw new Error("E-mail ou senha inválidos");
    }

    const senhaCorreta = await bcrypt.compare(dados.senha, usuario.senha);

    if (!senhaCorreta) {
        throw new Error("E-mail ou senha inválidos");
    }

    const token = jwt.sign(
        {
            id: usuario.id,
            tipo: usuario.tipo,
        },
        process.env.JWT_SECRET!,
        {
            expiresIn: "1h",
        },
    );

    return {
        token,
        usuario: {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            tipo: usuario.tipo,
        },
    };
}
