import { ErroAplicacao } from "./ErroAplicacao";

export class ConflitoError extends ErroAplicacao {
    constructor(mensagem: string) {
        super(mensagem, 409);
        this.name = "ConflitoError";
    }
}
