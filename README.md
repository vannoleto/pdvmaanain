# PDV

Aplicativo de ponto de venda (PDV) em HTML/JavaScript com suporte a pagamentos via PIX usando Mercado Pago e funções serverless do Netlify.

Este README foi escrito para ser autossuficiente: contém instruções completas de configuração (Netlify e Mercado Pago), testes locais e produção, troubleshooting e recomendações de segurança. Se você voltar a este repositório no futuro para outro projeto, siga os passos abaixo.

---

## Sumário

- Visão geral
- Requisitos
- Estrutura do projeto
- Credenciais Mercado Pago: como obter
- Variáveis de ambiente (Netlify) — nomes exatos e como configurar
- Testes locais (Netlify Dev) e comandos curl
- Testes em produção (deployado no Netlify)
- Logs e troubleshooting
- Segurança e boas práticas
- Fluxo de trabalho para reutilizar o repositório

---

## Visão geral

O frontend é estático e roda em `index.html`. As integrações sensíveis com o Mercado Pago (criação de pagamento PIX e checagem de status) são feitas por Netlify Functions em `netlify/functions/` para manter as chaves secretas no servidor.

Arquivos principais:

- [index.html](index.html) — interface do PDV
- [netlify/functions/create-pix.js](netlify/functions/create-pix.js#L1-L200) — cria pagamento PIX
- [netlify/functions/check-pix.js](netlify/functions/check-pix.js#L1-L200) — consulta status do pagamento
- [netlify.toml](netlify.toml) — configuração do Netlify (se presente)

## Requisitos

- Node.js (para usar o Netlify CLI e outras ferramentas locais)
- npm ou yarn
- Conta no Netlify com site criado (ou permissão para conectar repositório)
- Conta no Mercado Pago com credenciais (Access Token e Public Key)

## Estrutura do projeto

Organização resumida:

- `index.html` — app principal (frontend)
- `netlify/functions/create-pix.js` — cria pagamentos via Mercado Pago (server-side)
- `netlify/functions/check-pix.js` — consulta pagamentos (server-side)
- `sw.js`, `manifest.json` — PWA

## Como obter credenciais no Mercado Pago

1. Acesse https://www.mercadopago.com.br/ e faça login.
2. No Dashboard procure por **Credenciais / Configurações** (ou Developer / Credenciais/API).
3. Copie:
   - **Access Token**: usado no backend (server-side). Exemplos: `APP_USR-...` para conta real, `TEST-...` para testes.
   - **Public Key**: usado no frontend quando necessário (SDK). Pode ser exposta.
4. Se for produção, confirme que a conta está habilitada para Pix (verifique no painel do Mercado Pago).

Observação: não misture tokens de teste com endpoints de produção — isso gera erros como `Unauthorized use of live credentials`.

## Variáveis de ambiente (Netlify)

As Netlify Functions leem as variáveis do ambiente do Netlify. Configure no painel as variáveis abaixo:

- `MP_ACCESS_TOKEN` — **obrigatório (server-side)**: Access Token do Mercado Pago. Nunca expor no frontend.
- `MP_SECONDARY_TOKEN` — opcional: outra chave para uso interno, se necessário.
- `MP_PUBLIC_KEY` — opcional: public key (apenas se usar SDK no frontend).

Nomes exatos: use `MP_ACCESS_TOKEN` no Netlify porque as functions deste repositório leem `process.env.MP_ACCESS_TOKEN`.

Passo a passo (Netlify UI):

1. No painel do site Netlify: **Site settings** → **Build & deploy** → **Environment** → **Environment variables** → **Add variable**.
2. Preencha:
   - **Key**: `MP_ACCESS_TOKEN`
   - **Value (Production)**: cole o token (ex.: `APP_USR-400893...2574445341`)
   - Marque **Contains secret values** para ocultar o valor
   - **Scopes**: escolha **Specific scopes** e marque **Builds** e **Functions** (permite acesso às functions)
   - **Values / Deploy contexts**: se **Same value for all deploy contexts** não estiver disponível, selecione **Different value for each deploy context** e cole o token em **Production** (ou nos contexts que usar).
3. Salve e *redeploy* o site (Deploy → Trigger deploy → Deploy site).

Observações:

- Se você colocou o token no campo **Key** por engano, apague e recrie corretamente (Key=MP_ACCESS_TOKEN, Value=token).
- Se quiser usar outro nome (por exemplo `MERCADOPAGO_ACCESS_TOKEN`), atualize as functions para usar `process.env.NOVO_NOME` e redeploy.

## Testes locais (Netlify Dev)

Instale o Netlify CLI e rode as functions localmente com suas variáveis:

PowerShell (Windows):
```powershell
$env:MP_ACCESS_TOKEN="SEU_TOKEN_AQUI"
npx netlify-cli@latest dev
```

Bash (macOS/Linux):
```bash
export MP_ACCESS_TOKEN="SEU_TOKEN_AQUI"
npx netlify-cli@latest dev
```

Netlify Dev expõe as functions em `http://localhost:8888/.netlify/functions/<nome>`.

Exemplo de teste direto (gerar Pix):

```bash
curl -i -X POST http://localhost:8888/.netlify/functions/create-pix \
  -H "Content-Type: application/json" \
  -d '{"amount":12,"description":"teste","payerEmail":"cliente@exemplo.com"}'
```

Se você estiver usando token de teste local, alguns comportamentos podem diferir — use as credenciais apropriadas.

## Testes em produção (deployado no Netlify)

Depois de configurar a variável no painel e redeployar, teste a function pública:

```bash
curl -i -X POST https://<seu-site>.netlify.app/.netlify/functions/create-pix \
  -H "Content-Type: application/json" \
  -d '{"amount":12,"description":"teste","payerEmail":"cliente@exemplo.com"}'
```

Resposta esperada (HTTP 200) inclui `paymentId` e `qr_code_base64`. Se vir `Unauthorized use of live credentials` ou 401/403, troque para o Access Token de produção.

## Logs e troubleshooting

- Ver logs das functions no Netlify: **Functions** → escolha `create-pix` (ou `check-pix`) → **View logs**.
- Mensagens comuns e soluções:
  - `MP_ACCESS_TOKEN não configurado nas variáveis de ambiente do Netlify.`
    - Solução: confirme a variável `MP_ACCESS_TOKEN` no painel e redeploy.
  - `Unauthorized use of live credentials` / 401/403 do Mercado Pago
    - Causa: token de teste usado contra endpoint de produção, token inválido ou conta sem permissão para Pix.
    - Solução: usar Access Token de produção ou testar localmente com Netlify Dev usando credenciais de teste para endpoints de teste.
  - Token colocado no campo **Key** em vez de **Value**
    - Solução: editar variável e corrigir campo.

Se quiser debug mais profundo, posso adicionar temporariamente logs nas functions para confirmar se `process.env.MP_ACCESS_TOKEN` está presente no runtime (removeremos depois).

## Segurança e boas práticas

- Nunca commit credenciais no repositório.
- Use o painel do Netlify para guardar secrets.
- Use `MP_PUBLIC_KEY` no frontend somente quando necessário (é pública). O `MP_ACCESS_TOKEN` deve ficar apenas nas functions.
- Remova logs sensíveis antes de colocar em produção.

## Fluxo de trabalho recomendado para reutilizar este repositório

1. Clone/fork o repositório.
2. Atualize `index.html` e `manifest.json` com dados da nova loja.
3. Obtenha credenciais do Mercado Pago (Access Token e Public Key).
4. Configure `MP_ACCESS_TOKEN` no Netlify (veja seção acima).
5. Rode testes locais com `netlify-cli dev`.
6. Faça deploy no Netlify e teste via `curl` ou UI.

## Comandos úteis

- Instalar Netlify CLI (global):
```bash
npm i -g netlify-cli
```
- Login Netlify:
```bash
netlify login
```
- Rodar Netlify Dev:
```bash
npx netlify-cli@latest dev
```
- Trigger deploy via CLI (require site configurado):
```bash
netlify deploy --prod --dir=.
```

---

Se quiser, eu:

- adiciono um `.env.example` contendo as chaves (sem valores) para referência local;
- insiro logs temporários nas functions para confirmar presença do `MP_ACCESS_TOKEN` em produção;
- crio um script de deploy automatizado.

Arquivo atualizado: [README.md](README.md)
