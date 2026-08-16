const crypto = require('crypto');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método não permitido' }) };
  }

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'MP_ACCESS_TOKEN não configurado nas variáveis de ambiente do Netlify.' })
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Corpo da requisição inválido.' }) };
  }

  const { amount, description, payerEmail } = payload;
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Valor inválido.' }) };
  }

  try {
    const resp = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
        'X-Idempotency-Key': crypto.randomUUID()
      },
      body: JSON.stringify({
        transaction_amount: Number(Number(amount).toFixed(2)),
        description: description || 'Venda PDV',
        payment_method_id: 'pix',
        payer: { email: payerEmail || 'cliente@lanchonete.com' }
      })
    });

    const data = await resp.json();

    if (!resp.ok) {
      return {
        statusCode: resp.status,
        body: JSON.stringify({ error: data.message || 'Erro ao criar pagamento no Mercado Pago', details: data })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        paymentId: data.id,
        qrCodeBase64: data.point_of_interaction?.transaction_data?.qr_code_base64 || null,
        qrCode: data.point_of_interaction?.transaction_data?.qr_code || null
      })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
