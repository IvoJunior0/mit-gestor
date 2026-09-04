import { z } from "zod";

export const criarPecaSchema = z.object({
    codigo: z.string().min(1),
    nome: z.string().min(2),
    descricao: z.string().optional(),
    estoque: z.number().int().min(0),
    estoqueMinimo: z.number().int().min(0),
});

export const atualizarPecaSchema = z.object({
    codigo: z.string().min(1).optional(),
    nome: z.string().min(2).optional(),
    descricao: z.string().optional(),
    estoque: z.number().int().min(0).optional(),
    estoqueMinimo: z.number().int().min(0).optional(),
});
