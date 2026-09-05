import { ErroAplicacao } from "./ErroAplicacao";

export class RegraNegocioError extends ErroAplicacao {
    constructor(mensagem: string) {
        super(mensagem, 422);
        this.name = "RegraNegocioError";
    }
}
