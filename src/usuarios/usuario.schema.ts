import { z } from "zod";

export const criarUsuarioSchema = z.object({
    nome: z.string().min(2),
    email: z.email(),
    senha: z.string().min(8),
    tipo: z.enum(["ADMINISTRADOR", "GESTOR", "TECNICO", "OPERADOR"]),
});
