# Testes

## Estrutura

- `tests/unit` — testes unitários. Todo acesso ao Prisma, bcrypt e
  jsonwebtoken é mockado com `vi.mock`. Não precisam de banco de dados e
  rodam em qualquer máquina/CI.
- `tests/integration` — testes de integração. Sobem a aplicação Express
  real (`src/app.ts`) com `supertest` e conversam com um Postgres real
  (via docker-compose), passando por rotas, middlewares de
  autenticação/autorização, validação com Zod e o banco de dados.

## Arquivos novos/alterados fora de `tests/`

Para viabilizar os testes de integração, os seguintes arquivos foram
adicionados/alterados no projeto (fora da pasta `tests`, então não estão
dentro deste zip — aplique-os manualmente ou peça o projeto completo):

- **novo** `src/app.ts`: a instância do Express foi extraída para este
  arquivo (sem `app.listen`), permitindo importá-la nos testes com
  `supertest`.
- **alterado** `src/servidor.ts`: agora apenas importa `app` de
  `./app` e chama `app.listen(...)`. Nenhuma rota ou lógica mudou.
- **novo** `vitest.config.ts`: config dos testes unitários.
- **novo** `vitest.integration.config.ts`: config dos testes de
  integração (carrega `.env.test`, roda migrations, executa em um único
  processo).
- **novo** `.env.test.example`: modelo de variáveis de ambiente para o
  banco de testes.
- **novo** `docker/init-scripts/01-criar-banco-teste.sql`: cria o banco
  `manutencao_industrial_test` automaticamente ao subir o Postgres.
- **alterado** `docker-compose.yml`: monta a pasta `docker/init-scripts`
  no container do Postgres.
- **alterado** `package.json`: novos scripts (`test:unit`,
  `test:integration`, `test:all`) e as devDependencies `supertest` e
  `@types/supertest`.

## Como rodar

### Testes unitários (não precisa de banco)

```bash
npm run test:unit
```

### Testes de integração (precisa do Postgres via docker-compose)

1. Suba o banco (se o volume já existia antes desta mudança, recrie-o
   uma vez para que o script de criação do banco de teste seja
   executado):

   ```bash
   docker compose down -v
   docker compose up -d
   ```

2. Copie o arquivo de variáveis de ambiente de teste:

   ```bash
   cp .env.test.example .env.test
   ```

3. Rode os testes (as migrations são aplicadas automaticamente no
   banco de teste antes da suíte começar):

   ```bash
   npm run test:integration
   ```

### Tudo de uma vez

```bash
npm run test:all
```

## Observações

- Os testes de integração truncam as tabelas do banco de teste antes de
  cada caso (`beforeEach`), então rode-os sempre contra
  `manutencao_industrial_test`, nunca contra o banco de desenvolvimento.
- Os testes de integração rodam em um único processo/sequencialmente
  (`singleFork`), já que compartilham o mesmo banco.
- Alguns comportamentos testados refletem o comportamento **atual** das
  rotas, mesmo quando parecem inconsistentes — por exemplo, `POST
  /ordens-servico` devolve **404** para qualquer erro de negócio em
  `criarOrdemServico` (incluindo "máquina já possui OS ativa", que
  semanticamente seria mais um 409), e `POST
  /ordens-servico/:id/pecas` devolve **400** para qualquer erro
  (incluindo "OS não encontrada", que seria mais um 404). Isso não foi
  "corrigido" nos testes de propósito, para não mascarar o
  comportamento real da API; vale considerar revisar essas rotas.
