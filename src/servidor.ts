import "dotenv/config";
import { app } from "./app";

const porta = Number(process.env.PORT ?? 3000);

app.listen(porta, () => {
    console.log(
        `API de manutenção industrial rodando em http://localhost:${porta}`,
    );
});