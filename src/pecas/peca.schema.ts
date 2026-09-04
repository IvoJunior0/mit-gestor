import { z } from "zod";

export const criarPecaSchema = z.object({
    codigo: z.string().min(1),
    nome: z.string().min(2),
    unidadeMedida: z.string(),
    quantidadeEstoque: z.number().int().min(0),
    estoqueMinimo: z.number().int().min(0),
});

export const atualizarPecaSchema = z.object({
    codigo: z.string().min(1).optional(),
    nome: z.string().min(2).optional(),
    unidadeMedida: z.string().optional(),
    quantidadeEstoque: z.number().int().min(0).optional(),
    estoqueMinimo: z.number().int().min(0).optional(),
});
