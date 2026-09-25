/* =========================================================
   FRIZA GELO
   WEBHOOK.JS
   Integração com o n8n
========================================================= */

const WEBHOOK_URL =
  "https://filthysunbear-n8n.cloudfy.live/webhook/order_friza";


export async function sendOrderToWebhook(payload) {

  if (!WEBHOOK_URL) {
    throw new Error(
      "URL do webhook do n8n não configurada."
    );
  }


  const response =
    await fetch(
      WEBHOOK_URL,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },

        body:
          JSON.stringify(payload)
      }
    );


  /*
    fetch não lança erro automaticamente
    quando o servidor responde 4xx ou 5xx.

    Por isso validamos manualmente
    qualquer status fora da faixa 200–299.
  */

  if (!response.ok) {

    let errorBody = "";

    try {
      errorBody =
        await response.text();
    } catch {
      errorBody = "";
    }


    console.error(
      "Erro retornado pelo n8n:",
      {
        status: response.status,
        statusText: response.statusText,
        body: errorBody
      }
    );


    throw new Error(
      `Falha no envio do pedido. Status HTTP: ${response.status}`
    );
  }


  /*
    A partir daqui sabemos que o n8n
    respondeu com sucesso HTTP (2xx).

    O conteúdo da resposta é secundário.
  */

  const contentType =
    response.headers.get(
      "content-type"
    ) || "";


  let data = null;


  try {

    if (
      contentType.includes(
        "application/json"
      )
    ) {

      data =
        await response.json();

    } else {

      const text =
        await response.text();

      data =
        text || null;
    }

  } catch (error) {

    console.warn(
      "O pedido foi enviado, mas não foi possível interpretar a resposta do n8n.",
      error
    );

  }


  return {
    ok: true,
    status: response.status,
    data
  };
}