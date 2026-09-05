import { z } from "zod";

export const criarOrdemServicoSchema = z.object({
    descricao: z.string().min(3),
    prioridade: z.enum(["BAIXA", "MEDIA", "ALTA", "CRITICA"]),
    maquinaId: z.string(),
    tecnicoResponsavelId: z.string().optional(),
});

export const atualizarOrdemServicoSchema = z.object({
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
    tecnicoResponsavelId: z.string().nullable().optional(),
});

export const adicionarPecaOrdemServicoSchema = z.object({
    pecaId: z.uuid(),
    quantidade: z
        .number()
        .int("A quantidade deve ser um número inteiro")
        .positive("A quantidade deve ser maior que zero"),
});

export type AdicionarPecaOrdemServicoDados = z.infer<
    typeof adicionarPecaOrdemServicoSchema
>;

export const atualizarStatusOrdemServicoSchema = z.object({
    status: z.enum([
        "ABERTA",
        "EM_ANDAMENTO",
        "AGUARDANDO_PECA",
        "CONCLUIDA",
        "CANCELADA",
    ]),
});

export type AtualizarStatusOrdemServicoDados = z.infer<
    typeof atualizarStatusOrdemServicoSchema
>;
