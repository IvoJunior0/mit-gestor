import { ErroAplicacao } from "./ErroAplicacao";

export class RecursoNaoEncontradoError extends ErroAplicacao {
    constructor(mensagem: string) {
        super(mensagem, 404);
        this.name = "RecursoNaoEncontradoError";
    }
}
