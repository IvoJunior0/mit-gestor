import { z } from "zod";

export const criarSetorSchema = z.object({
    nome: z.string().min(2, "O nome deve possuir pelo menos 2 caracteres"),
    descricao: z.string().optional(),
});

export const atualizarSetorSchema = z.object({
    nome: z.string().min(2).optional(),
    descricao: z.string().optional()
});
