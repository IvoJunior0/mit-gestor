import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "./db";

export type TipoUsuario = "ADMINISTRADOR" | "GESTOR" | "TECNICO" | "OPERADOR";

let contador = 0;

interface CriarUsuarioTesteOpcoes {
    tipo?: TipoUsuario;
    nome?: string;
    email?: string;
    senha?: string;
}

/**
 * Cria um usuário direto no banco (sem passar pela rota HTTP) para agilizar
 * o setup dos testes que não estão testando o cadastro em si.
 */
export async function criarUsuarioTeste(opcoes: CriarUsuarioTesteOpcoes = {}) {
    contador += 1;

    const senha = opcoes.senha ?? "senha-super-segura-123";
    const senhaHash = await bcrypt.hash(senha, 12);

    const usuario = await prisma.usuario.create({
        data: {
            nome: opcoes.nome ?? `Usuário Teste ${contador}`,
            email: opcoes.email ?? `usuario.teste.${contador}@exemplo.com`,
            senha: senhaHash,
            tipo: opcoes.tipo ?? "ADMINISTRADOR",
        },
    });

    return { ...usuario, senhaPlana: senha };
}

/**
 * Gera um access token válido (mesmo formato usado em autenticacao.servico)
 * para um usuário já existente, sem precisar chamar a rota de login.
 */
export function gerarAccessTokenTeste(usuario: { id: string; tipo: TipoUsuario }) {
    return jwt.sign(
        { id: usuario.id, tipo: usuario.tipo },
        process.env.JWT_SECRET!,
        { expiresIn: "15m" },
    );
}

/**
 * Cria um usuário de teste do tipo informado e já retorna o cabeçalho
 * Authorization pronto para uso nas requisições supertest.
 */
export async function criarUsuarioAutenticadoTeste(tipo: TipoUsuario = "ADMINISTRADOR") {
    const usuario = await criarUsuarioTeste({ tipo });
    const token = gerarAccessTokenTeste(usuario);

    return {
        usuario,
        token,
        cabecalhoAuth: `Bearer ${token}`,
    };
}
