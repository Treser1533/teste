# Névoa OS — catálogo, pedidos e backend

Aplicação local com frontend Next.js, TypeScript, Tailwind CSS e API Fastify ligada ao PostgreSQL. O frontend carrega e grava cadastros e pedidos pela API; não usa localStorage como banco alternativo.

## Requisitos

- Node.js 20.19 ou superior
- npm
- PostgreSQL instalado e iniciado no Windows

## 1. Instale e prepare o PostgreSQL

Instale o PostgreSQL para Windows pelo site oficial: https://www.postgresql.org/download/windows/. Durante a instalação, defina a senha do usuário postgres e mantenha a porta 5432.

No pgAdmin, conecte-se ao servidor, abra o Query Tool no banco postgres e execute:

~~~sql
CREATE DATABASE nevoa;
~~~

## 2. Configure o projeto

Extraia o ZIP e abra o PowerShell na pasta nevoa-pods:

~~~powershell
npm install
npm --prefix backend install
if (-not (Test-Path backend\.env)) { Copy-Item backend\.env.example backend\.env }
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
notepad backend\.env
~~~

No backend/.env, ajuste DATABASE_URL para a senha que você definiu no instalador:

~~~env
PORT=4000
DATABASE_URL=postgres://postgres:senha_local@localhost:5432/nevoa
FRONTEND_ORIGIN=http://localhost:3000
~~~

Troque senha_local pela sua senha. Para simplificar, use uma senha local com letras e números ou codifique caracteres especiais da URL.

Se npm install falhar com ECONNRESET, é um problema de rede do npm. Quando a conexão voltar, repita a instalação que falhou.

## 3. Inicie backend e frontend

No primeiro PowerShell, aplique as tabelas e os dados iniciais e inicie a API:

~~~powershell
npm run db:migrate
npm run dev:api
~~~

Deixe essa janela aberta. Em outro PowerShell, na mesma pasta, inicie o frontend:

~~~powershell
npm run dev
~~~

Acesse http://localhost:3000. Para conferir a API e o banco, abra http://localhost:4000/health. A resposta esperada é status ok e database connected.

O selo do painel mostra PostgreSQL online quando a conexão está funcionando. Ao criar ou editar clientes, produtos, marcas, sabores e pedidos, a tela aguarda a confirmação da API. Se a API estiver desligada, os dados não são salvos localmente e o painel informa que está offline.

## Rotas

| Caminho | Função |
| --- | --- |
| / | Página inicial com métricas carregadas da API |
| /login | Redireciona para o painel local; não há autenticação configurada |
| /catalogo | Catálogo carregado do PostgreSQL e criação de pedidos |
| /admin | Gestão de clientes, produtos, marcas, pedidos e financeiro |
| /health | Confere a conexão da API com o PostgreSQL |
| /api/bootstrap | Carrega os registros atuais do banco para o frontend |
| /api/customers, /api/products, /api/brands, /api/orders | Consultas e alterações nos cadastros |

## Dados e recursos que ainda não existem

A migração inicial inclui registros fictícios de exemplo diretamente no PostgreSQL. Eles aparecem como dados do banco e podem ser editados ou removidos. A aplicação não mantém cópia local para substituir a API.

O backend não inclui autenticação, autorização de usuários, processamento de pagamentos, webhooks nem envio de mensagens por WhatsApp. O status Pago é apenas um valor gravado no pedido, não uma transação. Não publique a API na internet sem implementar controles de acesso e proteção de segredos.

## Estrutura

~~~text
app/                         páginas Next.js
components/                  interface, catálogo e painel
lib/api.ts                   cliente HTTP da API
lib/types.ts                 tipos compartilhados pelo frontend
backend/.env.example         conexão com PostgreSQL local
backend/migrations/          tabelas e dados iniciais em SQL
backend/src/db.ts             pool de conexões PostgreSQL
backend/src/migrate.ts        aplica migrações versionadas
backend/src/repositories/     consultas ao banco
backend/src/routes/           endpoints Fastify
backend/src/schemas.ts        validação de corpos JSON
backend/src/server.ts         CORS, rotas e inicialização
docs/backend-aprendizado.md   explicação passo a passo do backend
~~~

Leia docs/backend-aprendizado.md para acompanhar como uma requisição sai do frontend, passa pelo Fastify e chega ao PostgreSQL.

Para compilar os projetos:

~~~powershell
npm run build:api
npm run build
~~~