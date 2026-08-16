# PDV

Aplicativo de ponto de venda (PDV) em HTML/JavaScript com suporte a pagamentos via PIX usando Mercado Pago e funções serverless do Netlify.

## Funcionalidades

- Cadastro de itens e seleção de produtos
- Cálculo de subtotal, desconto e total
- Geração de QR Code PIX para pagamento
- Consulta de status de pagamento pelo código de transação
- PWA com manifest e service worker
- Integração com Netlify Functions

## Estrutura do projeto

- `index.html` — interface da aplicação
- `manifest.json` — configurações da PWA
- `sw.js` — service worker
- `netlify/functions/` — funções serverless para criar e consultar PIX
- `netlify.toml` — configuração do deploy do Netlify

## Variáveis de ambiente

No Netlify, configure a variável:

- `MP_ACCESS_TOKEN` — token do Mercado Pago

## Executar localmente

Como se trata de uma aplicação estática, você pode abrir o `index.html` diretamente no navegador ou usar algum servidor local simples, como:

```bash
python -m http.server 8000
```

Depois acesse: `http://localhost:8000`

## Deploy

Este projeto está preparado para deploy no Netlify.

1. Conecte o repositório ao Netlify
2. Configure a variável `MP_ACCESS_TOKEN`
3. Faça o deploy da branch principal

## Licença

Este projeto foi desenvolvido para uso local e comercial, conforme a necessidade da sua operação.
