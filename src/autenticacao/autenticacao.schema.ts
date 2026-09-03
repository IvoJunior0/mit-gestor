import { z } from "zod";

export const loginSchema = z.object({
    email: z.email("E-mail inválido"),
    senha: z.string().min(1, "A senha é obrigatória"),
});
