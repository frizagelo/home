/* =========================================================
   FRIZA GELO
   WEBHOOK.JS
   Integração com o n8n
========================================================= */

const WEBHOOK_URL =
  "https://filthysunbear-n8n.cloudfy.live/webhook/order_friza";


export async function sendOrderToWebhook(payload) {

  if (
    !WEBHOOK_URL ||
    WEBHOOK_URL.includes("COLE_AQUI")
  ) {
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


  if (!response.ok) {
    throw new Error(
      `Erro ao enviar pedido. Status: ${response.status}`
    );
  }


  const contentType =
    response.headers.get("content-type") || "";


  if (
    contentType.includes("application/json")
  ) {
    return await response.json();
  }


  const text =
    await response.text();


  return {
    success: true,
    message:
      text ||
      "Pedido enviado com sucesso."
  };
}