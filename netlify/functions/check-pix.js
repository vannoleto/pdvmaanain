exports.handler = async function (event) {
  const id = event.queryStringParameters && event.queryStringParameters.id;
  if (!id) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Parâmetro id é obrigatório.' }) };
  }

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'MP_ACCESS_TOKEN não configurado nas variáveis de ambiente do Netlify.' })
    };
  }

  try {
    const resp = await fetch('https://api.mercadopago.com/v1/payments/' + encodeURIComponent(id), {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await resp.json();

    if (!resp.ok) {
      return { statusCode: resp.status, body: JSON.stringify({ error: data.message || 'Erro ao consultar pagamento' }) };
    }

    return { statusCode: 200, body: JSON.stringify({ status: data.status }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
