export class ErroAplicacao extends Error {
    statusCode: number;

    constructor(mensagem: string, statusCode: number) {
        super(mensagem);
        this.name = "ErroAplicacao";
        this.statusCode = statusCode;
    }
}
