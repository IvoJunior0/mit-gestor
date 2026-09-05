# MIT Gestor

### API REST para gestão de manutenção industrial

Uma API backend desenvolvida em **TypeScript** para gerenciamento de ativos e processos de manutenção industrial, incluindo máquinas, setores, peças, ordens de serviço, manutenções e usuários com autenticação por JWT e permissões por tipo de usuário.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript\&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24-339933?logo=node.js\&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express\&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql\&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma\&logoColor=white)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker\&logoColor=white)](https://www.docker.com/)
[![Vitest](https://img.shields.io/badge/Vitest-5-6E9F18?logo=vitest\&logoColor=white)](https://vitest.dev/)
---

## Principais funcionalidades

### Usuários e autenticação

* Cadastro de usuários;
* Diferentes tipos de usuário;
* Login utilizando email e senha;
* Senhas armazenadas com hash utilizando `bcrypt`;
* Autenticação baseada em JWT;
* Refresh token;
* Revogação de sessões;
* Middleware de autenticação e autorização.

Tipos de usuário disponíveis:

```text
ADMINISTRADOR
GESTOR
TECNICO
OPERADOR
```

---

### Gestão de setores

Permite organizar as máquinas de acordo com os setores da indústria.

Operações disponíveis:

* Criar setor;
* Listar setores;
* Buscar setor por ID;
* Atualizar setor;
* Remover setor.

---

### Gestão de máquinas

Cada máquina possui informações como:

* código;
* nome;
* fabricante;
* modelo;
* número de série;
* horímetro;
* status;
* setor ao qual pertence.

Estados possíveis:

```text
EM_OPERACAO
EM_MANUTENCAO
PARADA
INATIVA
```

A API também aplica regras de negócio relacionadas ao estado das máquinas e às ordens de serviço abertas.

---

### Gestão de peças

O módulo de peças permite controlar o estoque utilizado nas manutenções.

Cada peça possui:

* código;
* nome;
* unidade de medida;
* quantidade em estoque;
* estoque mínimo.

Também existe relacionamento entre peças e ordens de serviço, permitindo registrar quais componentes foram utilizados durante uma manutenção.

---

### Ordens de serviço

As ordens de serviço são o núcleo do fluxo de manutenção.

Uma OS pode possuir:

* descrição;
* prioridade;
* máquina relacionada;
* técnico responsável;
* status;
* peças utilizadas;
* manutenção associada;
* datas de abertura, início e conclusão.

Prioridades:

```text
BAIXA
MEDIA
ALTA
CRITICA
```

Status:

```text
ABERTA
EM_ANDAMENTO
AGUARDANDO_PECA
CONCLUIDA
CANCELADA
```

---

### Manutenções

O sistema suporta dois tipos de manutenção:

```text
PREVENTIVA
CORRETIVA
```

Cada registro pode armazenar:

* descrição;
* máquina;
* ordem de serviço;
* data de realização;
* próxima manutenção programada.

---

## Arquitetura

A aplicação utiliza uma separação entre:

```text
src/
├── autenticacao/
├── manutencoes/
├── maquinas/
├── ordens-servico/
├── pecas/
├── setores/
├── usuarios/
├── prisma.ts
└── servidor.ts
```

Cada módulo possui suas próprias responsabilidades, mantendo as funcionalidades relacionadas agrupadas.

O servidor HTTP também é separado da instância do Express, permitindo reutilizar a aplicação nos testes de integração.

```text
servidor.ts
    │
    └── app.ts
          │
          ├── Middlewares
          ├── Rotas
          │    ├── Autenticação
          │    ├── Usuários
          │    ├── Setores
          │    ├── Máquinas
          │    ├── Peças
          │    ├── Ordens de Serviço
          │    └── Manutenções
          │
          └── Tratamento de erros
                    │
                    └── Prisma / PostgreSQL
```

---

## Stack

### Backend

* **Node.js**
* **TypeScript**
* **Express 5**

### Banco de dados

* **PostgreSQL**
* **Prisma ORM**

### Segurança e validação

* **JWT**
* **bcrypt**
* **Zod**

### Desenvolvimento e infraestrutura

* **Docker / Docker Compose**
* **Vitest**
* **Supertest**
* **tsx**

---

## Modelo de dados

O banco é modelado utilizando Prisma.

```text
Usuario
   │
   └── Sessao

Setor
   │
   └── Maquina
          │
          ├── OrdemServico
          │       │
          │       └── ItemOrdemServico ── Peca
          │
          └── Manutencao
```

A relação entre **ordens de serviço e peças** é representada por uma entidade intermediária, permitindo controlar a quantidade utilizada de cada peça.

O schema completo pode ser encontrado em:

```text
prisma/schema.prisma
```

---

## Tratamento de erros

A API possui middleware centralizado para tratamento de erros.

A intenção é diferenciar erros de validação, autenticação, autorização, recursos inexistentes, conflitos de regra de negócio e erros internos.

Exemplos:

| Status | Situação                               |
| ------ | -------------------------------------- |
| `400`  | Dados de entrada inválidos             |
| `401`  | Usuário não autenticado                |
| `403`  | Usuário sem permissão                  |
| `404`  | Recurso não encontrado                 |
| `409`  | Conflito com o estado atual do sistema |
| `500`  | Erro interno inesperado                |

Isso evita que cada rota precise implementar individualmente toda a lógica de resposta de erros.

---

## API

### Autenticação

```http
POST /autenticacao/login
POST /autenticacao/refresh
POST /autenticacao/logout
```

### Usuários

```http
POST /usuarios
```

### Setores

```http
GET    /setores
POST   /setores
GET    /setores/:id
PATCH  /setores/:id
DELETE /setores/:id
```

### Máquinas

```http
GET    /maquinas
GET    /maquinas/:id
POST   /maquinas
PATCH  /maquinas/:id
DELETE /maquinas/:id
```

### Peças

```http
GET    /pecas
GET    /pecas/:id
POST   /pecas
PATCH  /pecas/:id
DELETE /pecas/:id
```

### Ordens de serviço

```http
GET    /ordens-servico
GET    /ordens-servico/:id
POST   /ordens-servico
PATCH  /ordens-servico/:id
PATCH  /ordens-servico/:id/status
POST   /ordens-servico/:ordemServicoId/pecas
DELETE /ordens-servico/:id
```

### Manutenções

```http
GET    /manutencoes
GET    /manutencoes/:id
POST   /manutencoes
PATCH  /manutencoes/:id
DELETE /manutencoes/:id
```

### Health check

```http
GET /saude
```

---

## Validação

Os dados recebidos pela API são validados utilizando **Zod** antes de serem processados pela camada de negócio.

Isso permite rejeitar entradas inválidas na borda da aplicação e manter as regras de negócio protegidas contra dados inconsistentes.

Exemplo conceitual:

```text
HTTP Request
     │
     ▼
   Zod
     │
     ├── inválido ──► 400
     │
     ▼
 Controller / Route
     │
     ▼
 Regra de negócio
     │
     ▼
 Prisma
     │
     ▼
 PostgreSQL
```

---

## Testes

### Testes unitários

Os testes unitários isolam as regras da aplicação utilizando mocks para dependências externas como Prisma, bcrypt e JWT.

```bash
npm run test:unit
```

### Testes de integração

Os testes de integração utilizam:

* Express real;
* Supertest;
* PostgreSQL real;
* Prisma;
* autenticação;
* middlewares;
* validação;
* rotas completas.

```bash
npm run test:integration
```

O banco de testes é separado do banco de desenvolvimento:

```text
manutencao_industrial
        │
        └── desenvolvimento

manutencao_industrial_test
        │
        └── testes de integração
```

### Executar todos os testes

```bash
npm run test:all
```

Essa separação permite testar a aplicação em diferentes níveis sem tornar os testes unitários dependentes de infraestrutura externa.

---

## Executando localmente

### Pré-requisitos

Antes de começar, tenha instalado:

* Node.js;
* npm;
* Docker;
* Docker Compose.

### 1. Clone o repositório

```bash
git clone https://github.com/IvoJunior0/mit-gestor.git
cd mit-gestor
```

### 2. Suba o PostgreSQL

```bash
docker compose up -d
```

### 3. Instale as dependências

```bash
npm install
```

### 4. Configure as variáveis de ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

Configure as variáveis necessárias no `.env`.

### 5. Gere o Prisma Client

```bash
npx prisma generate
```

### 6. Execute as migrations

```bash
npx prisma migrate dev
```

### 7. Popule o banco

```bash
npm run prisma:seed
```

### 8. Inicie a aplicação

```bash
npm run dev
```

A API estará disponível em:

```text
http://localhost:3000
```

Health check:

```text
http://localhost:3000/saude
```

---

## Scripts disponíveis

| Comando                   | Descrição                                 |
| ------------------------- | ----------------------------------------- |
| `npm run dev`             | Inicia o servidor em modo desenvolvimento |
| `npm run build`           | Compila o TypeScript                      |
| `npm start`               | Executa a aplicação compilada             |
| `npm run prisma:generate` | Gera o Prisma Client                      |
| `npm run prisma:migrate`  | Executa migrations                        |
| `npm run prisma:seed`     | Popula o banco com dados iniciais         |
| `npm test`                | Executa os testes                         |
| `npm run test:watch`      | Executa os testes em modo watch           |

---

## Decisões técnicas


### TypeScript

Utilizado para aumentar a segurança durante o desenvolvimento através de tipagem estática e facilitar a manutenção da aplicação.

### Prisma

Utilizado como ORM para facilitar o acesso ao PostgreSQL e manter o modelo de dados versionado através de migrations.

### PostgreSQL

Escolhido por ser um banco relacional robusto e adequado ao domínio, que possui diversas relações entre entidades.

### Zod

Utilizado para validação explícita dos dados recebidos pela API.

### JWT + sessões

O access token é utilizado para autenticação das requisições, enquanto as sessões persistidas permitem trabalhar com refresh tokens e revogação de sessões.

### Docker

O PostgreSQL é executado através de Docker Compose, reduzindo a quantidade de configuração necessária para reproduzir o ambiente de desenvolvimento.

### Testes unitários + integração

A combinação permite testar tanto regras isoladas quanto o comportamento da aplicação completa, incluindo banco de dados e HTTP.

---

## Estrutura do projeto

```text
mit-gestor/
│
├── docker/
│   └── init-scripts/
│
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
│
├── src/
│   ├── autenticacao/
│   ├── manutencoes/
│   ├── maquinas/
│   ├── ordens-servico/
│   ├── pecas/
│   ├── setores/
│   ├── usuarios/
│   ├── prisma.ts
│   └── servidor.ts
│
├── tests/
│   ├── integration/
│   ├── unit/
│   └── README.md
│
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── vitest.integration.config.ts
```

## Licença

Este projeto está atualmente em desenvolvimento para fins de estudo.
