import { z } from "zod";

export const criarOrdemServicoSchema = z.object({
    titulo: z.string().min(3),
    descricao: z.string().min(3),
    prioridade: z.enum(["BAIXA", "MEDIA", "ALTA", "CRITICA"]),
    maquinaId: z.string(),
    responsavelId: z.string().optional(),
});

export const atualizarOrdemServicoSchema = z.object({
    titulo: z.string().min(3).optional(),
    descricao: z.string().min(3).optional(),
    prioridade: z.enum(["BAIXA", "MEDIA", "ALTA", "CRITICA"]).optional(),
    status: z
        .enum([
            "ABERTA",
            "EM_ANDAMENTO",
            "AGUARDANDO_PECA",
            "CONCLUIDA",
            "CANCELADA",
        ])
        .optional(),
    responsavelId: z.string().nullable().optional(),
});
