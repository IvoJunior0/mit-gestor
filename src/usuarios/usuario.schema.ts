import { z } from "zod";

export const criarUsuarioSchema = z.object({
    nome: z.string().min(2, "O nome deve possuir pelo menos 2 caracteres"),
    email: z.email("E-mail inválido"),
    senha: z.string().min(8, "A senha deve possuir pelo menos 8 caracteres"),
    tipo: z.enum(["ADMINISTRADOR", "GESTOR", "TECNICO", "OPERADOR"]),
});
