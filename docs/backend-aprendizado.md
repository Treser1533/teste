# Aula: entendendo e ampliando o backend

Este guia acompanha o código do projeto. A ideia é seguir uma solicitação desde o clique na tela até o registro no PostgreSQL.

## 1. O caminho de uma solicitação

```text
Catálogo/Painel (Next.js)
        │ HTTP + JSON
        ▼
API Fastify (porta 4000)
  valida o corpo e escolhe a rota
        │ SQL parametrizado
        ▼
Pool do pg ───── PostgreSQL (porta 5432)
        ▲
        └──────── JSON de resposta
```

O Next.js apresenta a interface. Fastify recebe HTTP. PostgreSQL persiste os dados. O pacote `pg` conecta a API ao banco por um pool de conexões. [Guia TypeScript do Fastify](https://fastify.dev/docs/latest/Reference/TypeScript/) · [Consultas parametrizadas do node-postgres](https://node-postgres.com/features/queries)

Como o site e a API usam portas diferentes (`3000` e `4000`), o navegador trata a chamada como uma origem diferente. O plugin CORS permite que o endereço definido em `FRONTEND_ORIGIN` faça essas chamadas durante o desenvolvimento. [Guia CORS do Fastify](https://github.com/fastify/fastify-cors#readme)

## 2. Ler o modelo de dados

Abra `backend/migrations/001_create_tables.sql`.

- `brands` guarda as marcas.
- `products` aponta para uma marca com `brand_id`.
- `product_flavors` permite vários sabores por produto.
- `customers` guarda os contatos.
- `orders` guarda cliente, andamento, pagamento e vencimento.
- `order_items` guarda os itens e uma cópia do nome/preço usado no pedido.

Uma chave estrangeira é uma regra do banco: `products.brand_id`, por exemplo, só pode apontar para uma marca existente. Esse vínculo protege os dados mesmo quando uma tela não valida algo. [Documentação de chaves estrangeiras do PostgreSQL](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK)

### Exercício curto

Encontre `CHECK (stock >= 0)` no SQL. Ele impede estoque negativo no banco. Procure também o `enum` de status em `backend/src/schemas.ts`: a validação acontece antes de tentar executar SQL.

## 3. Entender migrações

Uma migração é uma mudança versionada no esquema do banco. `001_create_tables.sql` cria as tabelas; `002_seed_demo.sql` inclui registros fictícios. `backend/src/migrate.ts` lê os arquivos em ordem, registra os nomes em `schema_migrations` e não reaplica os que já rodaram.

Quando for adicionar uma coluna, crie `003_nome_da_mudanca.sql`; não altere uma migração que já foi aplicada em outro computador. Assim os ambientes conseguem avançar na mesma ordem.

## 4. Entender a conexão

Em `backend/src/db.ts`, `new Pool(...)` cria um conjunto pequeno de conexões reutilizáveis. A URL vem de `backend/.env`, para não colocar credenciais dentro do código.

```text
postgres://usuario:senha@host:porta/banco
```

O arquivo `backend/.env.example` mostra a URL local. A senha `nevoa_dev` é somente para o banco de desenvolvimento do Compose; não use esse arquivo como configuração de produção.

## 5. Ler uma rota GET

Em `backend/src/routes/catalog.ts`, procure:

```ts
app.get("/api/brands", async () => listBrands());
```

Isso registra `GET /api/brands`. A rota delega a consulta para `listBrands()` em `backend/src/repositories/app-repository.ts`. Separar HTTP de SQL ajuda a encontrar cada responsabilidade.

Com a API ligada, consulte no navegador ou PowerShell:

```powershell
Invoke-RestMethod http://localhost:4000/api/brands
```

## 6. Entender uma gravação PUT

Uma rota `PUT /api/products/:id` recebe o identificador na URL e o produto em JSON. `schemas.ts` verifica os campos. A rota abre uma transação, grava o produto, substitui seus sabores e confirma com `COMMIT`.

Essa validação ocorre no servidor; a validação do formulário no navegador é só conveniência para a pessoa usuária. A API valida mesmo quando uma chamada não vem da interface. [Validação do Fastify](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/)

`BEGIN` inicia a transação. `COMMIT` confirma tudo. Se ocorrer erro, `ROLLBACK` desfaz tudo. Assim o produto não fica salvo sem os sabores.

As consultas passam valores separadamente, por exemplo `WHERE id = $1` com `[id]`. Não monte SQL juntando texto digitado pelo usuário: parâmetros evitam tratar esse texto como código SQL. [Documentação do node-postgres](https://node-postgres.com/features/queries)

## 7. Entender pedidos e itens

Em `backend/src/routes/orders.ts`, atualizar um pedido usa a mesma ideia de transação:

1. grava ou atualiza `orders`;
2. apaga as linhas antigas desse pedido;
3. grava cada item enviado;
4. confirma com `COMMIT`.

Se a gravação do segundo item falhar, o `ROLLBACK` também desfaz a atualização do pedido. Esse padrão evita estado parcial.

## 8. Acompanhar a ligação frontend → API

`lib/api.ts` é um cliente HTTP pequeno: monta a URL, serializa o corpo como JSON e transforma respostas de erro em exceções. `components/app-provider.tsx` carrega `/api/bootstrap` ao abrir o site e envia alterações para as rotas de cadastro.

No painel, a faixa superior informa se o backend está conectado. A API é a fonte dos dados e o frontend não mantém uma cópia local. Com a API desligada, o painel informa que está offline e não conclui gravações. Ligue a API e recarregue para buscar os dados atuais do PostgreSQL.

## 9. Testar uma gravação manualmente

Com API e banco ligados, este comando cria ou atualiza uma marca de exemplo:

```powershell
$body = @{
  name = "Vento"
  description = "Marca criada no exercício"
  active = $true
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Put `
  -Uri http://localhost:4000/api/brands/marca-vento `
  -ContentType "application/json" `
  -Body $body
```

O `:id` da rota é `marca-vento`. Como a validação não exige `id` dentro do JSON, o identificador vem da URL.

## 10. Seu primeiro exercício de programação

Adicione um campo `instagram` a uma marca:

1. Inclua a coluna em uma nova migração `003_brand_instagram.sql`.
2. Atualize o tipo `Brand` em `backend/src/types.ts` e `lib/types.ts`.
3. Permita o campo no JSON Schema de marca.
4. Atualize `PUT /api/brands/:id` para gravar e devolver o campo.
5. Atualize o formulário de marcas no frontend.
6. Rode `npm run db:migrate`, reinicie os servidores e confira a rota.

Em cada etapa, pergunte: **qual é a forma do dado? Onde ele é validado? Onde é salvo? Como volta na resposta?** Esse raciocínio serve para qualquer campo novo.

## Glossário

- **Endpoint/rota:** endereço HTTP associado a uma função, como `GET /api/orders`.
- **JSON:** formato de texto usado para trocar dados entre frontend e backend.
- **Schema:** regras que dizem quais campos e tipos a rota aceita.
- **Pool:** conexões com o PostgreSQL reutilizadas pela aplicação.
- **Chave estrangeira:** regra relacional que exige que um vínculo aponte para um registro existente.
- **Transação:** grupo de comandos SQL confirmado por inteiro ou desfeito por inteiro.
- **Migração:** arquivo versionado que muda tabelas ou inicia dados.
