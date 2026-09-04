import { z } from "zod";

export const criarMaquinaSchema = z.object({
    codigo: z.string().min(1),
    nome: z.string().min(2),
    fabricante: z.string().optional(),
    modelo: z.string().optional(),
    numeroSerie: z.string().optional(),
    horimetro: z.number().int().min(0),
    setorId: z.string(),
});

export const atualizarMaquinaSchema = z.object({
    codigo: z.string().min(1).optional(),
    nome: z.string().min(2).optional(),
    fabricante: z.string().optional(),
    modelo: z.string().optional(),
    numeroSerie: z.string().optional(),
    horimetro: z.number().int().min(0).optional(),
    setorId: z.string().optional(),
    status: z
        .enum(["EM_OPERACAO", "EM_MANUTENCAO", "PARADA", "INATIVA"])
        .optional(),
});
