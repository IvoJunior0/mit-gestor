import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";
import { gerarHashToken, gerarRefreshToken } from "./autenticacao.util";

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

    const accessToken = jwt.sign(
        {
            id: usuario.id,
            tipo: usuario.tipo,
        },
        process.env.JWT_SECRET!,
        {
            expiresIn: "15m",
        },
    );

    const refreshToken = gerarRefreshToken();
    const refreshTokenHash = gerarHashToken(refreshToken);

    await prisma.sessao.create({
        data: {
            tokenHash: refreshTokenHash,
            usuarioId: usuario.id,
            expiraEm: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
    });

    return {
        accessToken,
        refreshToken,
        usuario: {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            tipo: usuario.tipo,
        },
    };
}

export async function renovarAccessToken(refreshToken: string) {
    const tokenHash = gerarHashToken(refreshToken);

    const sessao = await prisma.sessao.findUnique({
        where: {
            tokenHash,
        },
        include: {
            usuario: true,
        },
    });

    if (!sessao) {
        throw new Error("Refresh token inválido");
    }

    if (sessao.revogadaEm) {
        throw new Error("Sessão revogada");
    }

    if (sessao.expiraEm < new Date()) {
        throw new Error("Refresh token expirado");
    }

    const accessToken = jwt.sign(
        {
            id: sessao.usuario.id,
            tipo: sessao.usuario.tipo,
        },
        process.env.JWT_SECRET!,
        {
            expiresIn: "15m",
        },
    );

    return {
        accessToken,
    };
}

export async function realizarLogout(refreshToken: string) {
    const tokenHash = gerarHashToken(refreshToken);

    const sessao = await prisma.sessao.findUnique({
        where: {
            tokenHash,
        },
    });

    if (!sessao) {
        return;
    }

    await prisma.sessao.update({
        where: {
            id: sessao.id,
        },
        data: {
            revogadaEm: new Date(),
        },
    });
}
