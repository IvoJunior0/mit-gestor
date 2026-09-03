# Gestão de Manutenção Industrial

API backend para gerenciamento de máquinas, setores, ordens de serviço, manutenções e peças em um ambiente industrial.

## Tecnologias

- Node.js
- TypeScript
- Express
- PostgreSQL
- Prisma ORM
- Docker

## Executando

### 1. Suba o PostgreSQL

```bash
docker compose up -d
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o ambiente

```bash
cp .env.example .env
```

### 4. Gere o cliente Prisma e crie as tabelas

```bash
npx prisma generate
npx prisma migrate dev --name inicial
```

### 5. Popule dados de exemplo

```bash
npm run prisma:seed
```

### 6. Inicie a API

```bash
npm run dev
```

A API estará em `http://localhost:3000`.

## Rotas iniciais

- `GET /saude`
- `GET /setores`
- `GET /maquinas`
- `GET /ordens-servico`
- `PUT /login`
- `PUT /usuarios`

## Próximos módulos

- CRUD de setores e máquinas
- Abertura e gerenciamento de ordens de serviço
- Manutenção preventiva e corretiva
- Controle transacional de peças
- Histórico de manutenção
- Alertas de estoque
- Testes automatizados
- Swagger/OpenAPI
# mit-gestor
