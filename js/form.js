import { sendOrderToWebhook } from "./webhook.js";

/* =========================================================
   FRIZA GELO
   FORM.JS
   Formulário de pedido
========================================================= */

const form = document.querySelector("#order-form");

if (!form) {
  console.warn("Friza: formulário #order-form não encontrado.");
} else {

  /* =========================================================
     1. CONFIGURAÇÃO COMERCIAL
  ========================================================= */

  const CONFIG = {
    products: {
      "5kg": {
        label: "Gelo em cubos 5 kg",
        weightKg: 5,
        price: 8
      },

      "10kg": {
        label: "Gelo em cubos 10 kg",
        weightKg: 10,
        price: 14
      }
    },

    shipping: {
      fixedPrice: 8,
      freeShippingCity: "Salvador",
      freeShippingMinimumWeightKg: 40
    }
  };


  /* =========================================================
     2. ELEMENTOS
  ========================================================= */

  const steps =
    form.querySelectorAll(".form-step");

  const progressItems =
    document.querySelectorAll(".form-progress-item");

  const currentStepElement =
    document.querySelector("#current-step");

  const formWrapper =
    form.closest(".order-form-wrapper");


  /* Navegação */

  const nextButton =
    document.querySelector("#next-step");

  const previousButton =
    document.querySelector("#previous-step");

  const nextContactButton =
    document.querySelector("#next-step-contact");

  const previousContactButton =
    document.querySelector("#previous-step-contact");


  /* Produtos */

  const quantityButtons =
    form.querySelectorAll(".quantity-button");

  const quantityInputs =
    form.querySelectorAll(
      '.quantity-stepper input[type="number"]'
    );

  const quantity5kg =
    document.querySelector("#quantidade-5kg");

  const quantity10kg =
    document.querySelector("#quantidade-10kg");


  /* Pedido */

  const deliveryDate =
    document.querySelector("#data-entrega");

  const orderSummaryText =
    document.querySelector("#order-summary-text");

  const finalOrderSummaryText =
    document.querySelector("#final-order-summary-text");


  /* Endereço */

  const cepInput =
    document.querySelector("#cep");

  const cepFeedback =
    document.querySelector("#cep-feedback");

  const cityInput =
    document.querySelector("#cidade");

  const stateInput =
    document.querySelector("#uf");

  const neighborhoodInput =
    document.querySelector("#bairro");

  const streetInput =
    document.querySelector("#logradouro");

  const numberInput =
    document.querySelector("#numero");

  const complementInput =
    document.querySelector("#complemento");


  /* Contato */

  const nameInput =
    document.querySelector("#nome");

  const whatsappInput =
    document.querySelector("#whatsapp");

  const observationInput =
    document.querySelector("#observacao");

  const submitButton =
    document.querySelector("#submit-order");

  const paymentInputs =
    form.querySelectorAll(
      'input[name="forma_pagamento"]'
    );


  /* Feedback */

  const formFeedback =
    document.querySelector("#form-feedback");

  const mobileOrderCTA =
    document.querySelector("#mobile-order-cta");

  /* Estado */

  let currentStep = 1;

  let isSubmitting = false;

  const SUCCESS_RESET_DELAY = 4000;

  const originalSubmitButtonText =
    submitButton?.textContent.trim() ||
    "Enviar pedido";

  let lastResolvedCEP = "";


  /* =========================================================
     3. HELPERS
  ========================================================= */

  function normalizeText(value = "") {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
  }


  function formatCurrency(value) {
    return new Intl.NumberFormat(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL"
      }
    ).format(value);
  }


  function formatDateBR(dateString) {

    if (!dateString) {
      return "";
    }

    const [year, month, day] =
      dateString.split("-");

    if (
      !year ||
      !month ||
      !day
    ) {
      return dateString;
    }

    return `${day}/${month}/${year}`;
  }


  function sanitizeQuantity(value) {

    const quantity =
      Number.parseInt(
        value,
        10
      );

    if (
      Number.isNaN(quantity) ||
      quantity < 0
    ) {
      return 0;
    }

    return quantity;
  }


  function closeMobileKeyboard() {

    const activeElement =
      document.activeElement;

    if (
      activeElement instanceof HTMLElement
    ) {
      activeElement.blur();
    }
  }


  function scrollFormToTop() {

    const target =
      formWrapper || form;

    const headerOffset = 80;

    const targetTop =
      window.scrollY +
      target.getBoundingClientRect().top -
      headerOffset;

    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: "smooth"
    });
  }

  function updateMobileOrderCTA() {

    if (!mobileOrderCTA) {
      return;
    }

    const isMobile =
      window.matchMedia(
        "(max-width: 768px)"
      ).matches;

    if (!isMobile) {
      mobileOrderCTA.classList.remove(
        "is-visible"
      );

      return;
    }


    const formRect =
      form.getBoundingClientRect();

    const formIsVisible =
      formRect.bottom > 0 &&
      formRect.top < window.innerHeight;


    mobileOrderCTA.classList.toggle(
      "is-visible",
      !formIsVisible
    );
  }


  /* =========================================================
     4. FEEDBACK
  ========================================================= */

  function clearFormFeedback() {

    if (!formFeedback) {
      return;
    }

    formFeedback.textContent = "";

    formFeedback.classList.remove(
      "is-visible",
      "is-success",
      "is-error",
      "is-loading"
    );
  }


  function showFormFeedback(
    message,
    type = "error"
  ) {

    if (!formFeedback) {
      return;
    }

    formFeedback.textContent =
      message;

    formFeedback.classList.remove(
      "is-success",
      "is-error",
      "is-loading"
    );

    formFeedback.classList.add(
      "is-visible",
      `is-${type}`
    );
  }


  /* =========================================================
     5. ETAPAS
  ========================================================= */

  function showStep(stepNumber) {

    currentStep =
      stepNumber;


    steps.forEach((step) => {

      const number =
        Number(step.dataset.step);

      const active =
        number === stepNumber;

      step.hidden =
        !active;

      step.classList.toggle(
        "is-active",
        active
      );
    });


    progressItems.forEach((item) => {

      const number =
        Number(
          item.dataset.progressStep
        );

      const active =
        number === stepNumber;

      const complete =
        number < stepNumber;


      item.classList.toggle(
        "is-active",
        active
      );

      item.classList.toggle(
        "is-complete",
        complete
      );


      if (active) {
        item.setAttribute(
          "aria-current",
          "step"
        );
      } else {
        item.removeAttribute(
          "aria-current"
        );
      }
    });


    if (currentStepElement) {
      currentStepElement.textContent =
        String(stepNumber);
    }
  }


  /* =========================================================
     6. QUANTIDADE
  ========================================================= */

  function setQuantity(
    input,
    quantity
  ) {

    if (!input) {
      return;
    }


    const safeQuantity =
      Math.max(
        0,
        sanitizeQuantity(quantity)
      );


    input.value =
      String(safeQuantity);

    input.setAttribute(
      "value",
      String(safeQuantity)
    );


    const productItem =
      input.closest(
        ".product-quantity-item"
      );


    productItem?.classList.toggle(
      "has-quantity",
      safeQuantity > 0
    );


    updateOrderSummaries();
  }


  quantityButtons.forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          const target =
            document.querySelector(
              `#${button.dataset.target}`
            );

          if (!target) {
            return;
          }


          const currentQuantity =
            sanitizeQuantity(
              target.value
            );


          const nextQuantity =
            button.dataset.action === "increase"
              ? currentQuantity + 1
              : currentQuantity - 1;


          setQuantity(
            target,
            nextQuantity
          );
        }
      );
    }
  );


  quantityInputs.forEach(
    (input) => {

      input.addEventListener(
        "input",
        () => {

          setQuantity(
            input,
            input.value
          );
        }
      );
    }
  );


  /* =========================================================
     7. DADOS DO PEDIDO
  ========================================================= */

  function getOrderData() {

    const amount5kg =
      sanitizeQuantity(
        quantity5kg?.value
      );

    const amount10kg =
      sanitizeQuantity(
        quantity10kg?.value
      );


    const product5kg =
      CONFIG.products["5kg"];

    const product10kg =
      CONFIG.products["10kg"];


    const totalBags =
      amount5kg +
      amount10kg;


    const totalWeight =
      (
        amount5kg *
        product5kg.weightKg
      ) +
      (
        amount10kg *
        product10kg.weightKg
      );


    const subtotal =
      (
        amount5kg *
        product5kg.price
      ) +
      (
        amount10kg *
        product10kg.price
      );


    const selectedCity =
      cityInput?.value.trim() || "";


    const hasConfirmedCity =
      Boolean(selectedCity);


    const isSalvador =
      normalizeText(
        selectedCity
      ) ===
      normalizeText(
        CONFIG.shipping.freeShippingCity
      );


    const meetsFreeShippingWeight =
      totalWeight >=
      CONFIG.shipping
        .freeShippingMinimumWeightKg;


    /*
      REGRA ATUAL:

      Ao atingir 40 kg:
      - visualmente o frete fica grátis;
      - posteriormente o CEP valida se é Salvador;
      - fora de Salvador, volta para R$ 8.
    */

    const freeShippingApplied =
      meetsFreeShippingWeight &&
      (
        !hasConfirmedCity ||
        isSalvador
      );


    const shippingPrice =
      freeShippingApplied
        ? 0
        : CONFIG.shipping.fixedPrice;


    const total =
      subtotal +
      shippingPrice;


    return {
      amount5kg,
      amount10kg,

      totalBags,
      totalWeight,

      subtotal,

      deliveryDate:
        deliveryDate?.value || "",

      selectedCity,
      hasConfirmedCity,
      isSalvador,

      meetsFreeShippingWeight,
      freeShippingApplied,

      shippingPrice,

      total
    };
  }


  /* =========================================================
     8. RESUMO — PRODUTOS
  ========================================================= */

  function getOrderItems(order) {

    const items = [];


    if (
      order.amount5kg > 0
    ) {
      items.push(
        `${order.amount5kg}× 5 kg`
      );
    }


    if (
      order.amount10kg > 0
    ) {
      items.push(
        `${order.amount10kg}× 10 kg`
      );
    }


    return items;
  }


  /* =========================================================
     9. RESUMO — FRETE
  ========================================================= */

  function buildShippingRow(order) {

    if (
      order.freeShippingApplied
    ) {

      return `
        <div class="order-summary-row">

          <span>
            Entrega
          </span>

          <div class="order-summary-delivery-free">

            <span class="order-summary-old-price">
              ${formatCurrency(
        CONFIG.shipping.fixedPrice
      )}
            </span>

            <strong class="order-summary-free">
              Grátis
            </strong>

          </div>

        </div>
      `;
    }


    return `
      <div class="order-summary-row">

        <span>
          Entrega
        </span>

        <strong>
          ${formatCurrency(
      order.shippingPrice
    )}
        </strong>

      </div>
    `;
  }


  /* =========================================================
     10. RESUMO — BENEFÍCIO DO FRETE
  ========================================================= */

  function buildShippingMessage(order) {

    /*
      Cidade já confirmada e não é Salvador.

      Nesse caso não mostramos nenhuma mensagem
      relacionada ao frete grátis de Salvador.
      O valor normal da entrega já aparece
      no resumo do pedido.
    */

    if (
      order.hasConfirmedCity &&
      !order.isSalvador
    ) {
      return "";
    }


    /*
      Atingiu 40 kg,
      mas ainda não informou/confirmou o CEP.
    */

    if (
      order.meetsFreeShippingWeight &&
      !order.hasConfirmedCity
    ) {

      return `
        <div class="order-summary-benefit is-success">

          ✓ Você atingiu o mínimo para
          frete grátis em Salvador.
          Confirme o CEP para validar.

        </div>
      `;
    }


    /*
      Salvador confirmado
      e atingiu os 40 kg.
    */

    if (
      order.meetsFreeShippingWeight &&
      order.isSalvador
    ) {

      return `
        <div class="order-summary-benefit is-success">

          ✓ Frete grátis aplicado em Salvador.

        </div>
      `;
    }


    /*
      Ainda não atingiu 40 kg.

      Essa mensagem aparece:
      - antes de confirmar a cidade;
      - ou quando a cidade confirmada é Salvador.
    */

    const remaining =
      Math.max(
        0,
        CONFIG.shipping
          .freeShippingMinimumWeightKg -
        order.totalWeight
      );


    return `
      <div class="order-summary-benefit">

        Faltam

        <strong>
          ${remaining} kg
        </strong>

        para frete grátis em Salvador.

      </div>
    `;
  }


  /* =========================================================
     11. RESUMO — HTML
  ========================================================= */

  function buildOrderSummary(
    order,
    {
      isFinal = false
    } = {}
  ) {

    const items =
      getOrderItems(order);


    if (
      items.length === 0
    ) {

      return `
        <span class="order-summary-empty">
          Nenhum item selecionado.
        </span>
      `;
    }


    const bagLabel =
      order.totalBags === 1
        ? "1 saco"
        : `${order.totalBags} sacos`;


    const shippingRow =
      buildShippingRow(order);


    const shippingMessage =
      buildShippingMessage(order);


    /*
      Informações extras aparecem
      apenas no resumo final.
    */

    let finalDetails = "";


    if (isFinal) {

      const delivery =
        order.deliveryDate
          ? formatDateBR(
            order.deliveryDate
          )
          : "Não informada";


      const city =
        order.hasConfirmedCity
          ? order.selectedCity
          : "Não confirmada";


      const neighborhood =
        neighborhoodInput?.value.trim() || "";


      const deliveryLocation =
        neighborhood
          ? `${city} • ${neighborhood}`
          : city;


      finalDetails = `
        <div class="order-summary-details">

          <div class="order-summary-detail">
            <span>Data</span>
            <strong>${delivery}</strong>
          </div>

          <div class="order-summary-detail">
            <span>Entrega em</span>
            <strong>${deliveryLocation}</strong>
          </div>

        </div>

        <div class="order-summary-divider"></div>
      `;
    }


    return `

      <div class="order-summary-products">

        <strong>
          ${items.join(" + ")}
        </strong>

        <span>
          ${bagLabel} • ${order.totalWeight} kg
        </span>

      </div>


      <div class="order-summary-divider"></div>


      ${finalDetails}


      <div class="order-summary-values">

        <div class="order-summary-row">

          <span>
            Subtotal
          </span>

          <strong>
            ${formatCurrency(
      order.subtotal
    )}
          </strong>

        </div>


        ${shippingRow}

      </div>


      <div class="order-summary-divider"></div>


      <div class="order-summary-total">

        <span>
          Total
        </span>

        <strong>
          ${formatCurrency(
      order.total
    )}
        </strong>

      </div>


      ${shippingMessage}
    `;
  }


  /* =========================================================
     12. ATUALIZAÇÃO DOS RESUMOS
  ========================================================= */

  function updateOrderSummaries() {

    const order =
      getOrderData();


    if (orderSummaryText) {

      orderSummaryText.innerHTML =
        buildOrderSummary(
          order
        );
    }


    if (finalOrderSummaryText) {

      finalOrderSummaryText.innerHTML =
        buildOrderSummary(
          order,
          {
            isFinal: true
          }
        );
    }
  }


  /*
    Se a data for alterada,
    atualiza o resumo final.
  */

  deliveryDate?.addEventListener(
    "change",
    updateOrderSummaries
  );


  /* =========================================================
     13. DATA MÍNIMA
  ========================================================= */

  function setMinimumDeliveryDate() {

    if (!deliveryDate) {
      return;
    }


    const tomorrow =
      new Date();


    tomorrow.setDate(
      tomorrow.getDate() + 1
    );


    const year =
      tomorrow.getFullYear();


    const month =
      String(
        tomorrow.getMonth() + 1
      ).padStart(
        2,
        "0"
      );


    const day =
      String(
        tomorrow.getDate()
      ).padStart(
        2,
        "0"
      );


    deliveryDate.min =
      `${year}-${month}-${day}`;
  }


  /* =========================================================
     14. VALIDAÇÃO — ETAPA 1
  ========================================================= */

  function validateStepOne() {

    clearFormFeedback();


    const order =
      getOrderData();


    if (
      order.totalBags === 0
    ) {

      showFormFeedback(
        "Selecione pelo menos 1 saco de gelo."
      );

      return false;
    }


    if (
      !deliveryDate?.value
    ) {

      showFormFeedback(
        "Escolha a data desejada para a entrega."
      );

      deliveryDate?.focus();

      return false;
    }


    if (
      deliveryDate.min &&
      deliveryDate.value <
      deliveryDate.min
    ) {

      showFormFeedback(
        "Escolha uma data com pelo menos 24 horas de antecedência."
      );

      deliveryDate.focus();

      return false;
    }


    return true;
  }


  /* =========================================================
     15. ETAPA 1 → 2
  ========================================================= */

  nextButton?.addEventListener(
    "click",
    () => {

      if (
        !validateStepOne()
      ) {
        return;
      }


      clearFormFeedback();

      showStep(2);

      cepInput?.focus();
    }
  );


  /* =========================================================
     16. CEP — MÁSCARA + BUSCA AUTOMÁTICA
  ========================================================= */

  function formatCEP(value) {

    const digits =
      value
        .replace(
          /\D/g,
          ""
        )
        .slice(
          0,
          8
        );


    if (
      digits.length <= 5
    ) {
      return digits;
    }


    return (
      `${digits.slice(0, 5)}-` +
      `${digits.slice(5)}`
    );
  }


  cepInput?.addEventListener(
    "input",
    () => {

      cepInput.value =
        formatCEP(
          cepInput.value
        );


      const digits =
        cepInput.value.replace(
          /\D/g,
          ""
        );


      /*
        Enquanto o CEP ainda não tem
        os 8 números, qualquer endereço
        anterior deixa de ser válido.
      */

      if (
        digits.length < 8
      ) {

        lastResolvedCEP = "";

        clearAddress();

        setCEPFeedback(
          "Cidade, UF, bairro e rua serão preenchidos pelo CEP."
        );

        updateOrderSummaries();

        return;
      }


      /*
        Assim que o oitavo número
        é digitado ou colado,
        consulta automaticamente.
      */

      if (
        digits.length === 8 &&
        digits !== lastResolvedCEP
      ) {

        /*
          Caso o usuário substitua
          um CEP completo por outro.
        */

        clearAddress();

        updateOrderSummaries();

        fetchAddressByCEP();
      }
    }
  );


  /* =========================================================
     17. CEP — FEEDBACK
  ========================================================= */

  function setCEPFeedback(
    message,
    type = ""
  ) {

    if (!cepFeedback) {
      return;
    }


    cepFeedback.textContent =
      message;


    cepFeedback.classList.remove(
      "is-success",
      "is-error"
    );


    if (type) {

      cepFeedback.classList.add(
        `is-${type}`
      );
    }
  }


  /* =========================================================
     18. ENDEREÇO
  ========================================================= */

  function setAddressFieldReadonly(
    field,
    readonly
  ) {

    if (!field) {
      return;
    }


    field.readOnly =
      readonly;


    if (readonly) {

      field.setAttribute(
        "readonly",
        ""
      );

    } else {

      field.removeAttribute(
        "readonly"
      );
    }
  }


  function clearAddress() {

    if (streetInput) {
      streetInput.value = "";
    }

    if (neighborhoodInput) {
      neighborhoodInput.value = "";
    }

    if (cityInput) {
      cityInput.value = "";
    }

    if (stateInput) {
      stateInput.value = "";
    }


    setAddressFieldReadonly(
      streetInput,
      true
    );

    setAddressFieldReadonly(
      neighborhoodInput,
      true
    );
  }


  /* =========================================================
     19. VIA CEP
  ========================================================= */

  async function fetchAddressByCEP() {

    if (!cepInput) {
      return false;
    }


    const cep =
      cepInput.value.replace(
        /\D/g,
        ""
      );


    if (
      cep.length !== 8
    ) {

      setCEPFeedback(
        "Digite um CEP válido.",
        "error"
      );

      return false;
    }


    setCEPFeedback(
      "Buscando endereço..."
    );


    try {

      const response =
        await fetch(
          `https://viacep.com.br/ws/${cep}/json/`
        );


      if (!response.ok) {

        throw new Error(
          "Erro ao consultar CEP."
        );
      }


      const data =
        await response.json();


      /*
        Se o usuário alterar o CEP
        enquanto a consulta estiver acontecendo,
        ignoramos a resposta anterior.
      */

      const currentCEP =
        cepInput.value.replace(
          /\D/g,
          ""
        );

      if (
        currentCEP !== cep
      ) {
        return false;
      }


      if (data.erro) {

        lastResolvedCEP = "";

        clearAddress();

        setCEPFeedback(
          "CEP não encontrado. Confira e tente novamente.",
          "error"
        );

        updateOrderSummaries();

        return false;
      }


      if (streetInput) {
        streetInput.value =
          data.logradouro || "";
      }


      if (neighborhoodInput) {
        neighborhoodInput.value =
          data.bairro || "";
      }


      if (cityInput) {
        cityInput.value =
          data.localidade || "";
      }


      if (stateInput) {
        stateInput.value =
          data.uf || "";
      }


      /*
        Se o ViaCEP não devolver rua
        ou bairro, libera digitação.
      */

      setAddressFieldReadonly(
        streetInput,
        Boolean(
          data.logradouro
        )
      );


      setAddressFieldReadonly(
        neighborhoodInput,
        Boolean(
          data.bairro
        )
      );


      if (
        streetInput &&
        !data.logradouro
      ) {

        streetInput.placeholder =
          "Digite sua rua";
      }


      if (
        neighborhoodInput &&
        !data.bairro
      ) {

        neighborhoodInput.placeholder =
          "Digite seu bairro";
      }


      lastResolvedCEP =
        cep;


      setCEPFeedback(
        "Endereço encontrado.",
        "success"
      );


      /*
        Agora a cidade foi confirmada.
        Recalculamos o frete.
      */

      updateOrderSummaries();


      /*
        Leva o usuário diretamente
        para o campo Número.
      */

      numberInput?.focus();


      return true;

    } catch (error) {

      lastResolvedCEP = "";

      console.error(
        "Erro ao consultar CEP:",
        error
      );


      setCEPFeedback(
        "Não foi possível consultar o CEP agora. Tente novamente.",
        "error"
      );


      return false;
    }
  }


  /*
    Enter continua funcionando
    como alternativa.
  */

  cepInput?.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key !== "Enter"
      ) {
        return;
      }


      event.preventDefault();

      fetchAddressByCEP();
    }
  );


  /* =========================================================
     20. VALIDAÇÃO — ETAPA 2
  ========================================================= */

  function validateStepTwo() {

    clearFormFeedback();


    const cep =
      cepInput?.value.replace(
        /\D/g,
        ""
      ) || "";


    if (
      cep.length !== 8
    ) {

      showFormFeedback(
        "Informe um CEP válido."
      );

      cepInput?.focus();

      return false;
    }


    if (
      !cityInput?.value.trim()
    ) {

      showFormFeedback(
        "Não conseguimos identificar a cidade pelo CEP."
      );

      cepInput?.focus();

      return false;
    }


    if (
      !stateInput?.value.trim()
    ) {

      showFormFeedback(
        "Não conseguimos identificar o estado pelo CEP."
      );

      cepInput?.focus();

      return false;
    }


    if (
      !neighborhoodInput?.value.trim()
    ) {

      showFormFeedback(
        "Informe o bairro."
      );

      neighborhoodInput?.focus();

      return false;
    }


    if (
      !streetInput?.value.trim()
    ) {

      showFormFeedback(
        "Informe a rua da entrega."
      );

      streetInput?.focus();

      return false;
    }


    if (
      !numberInput?.value.trim()
    ) {

      showFormFeedback(
        "Informe o número do endereço."
      );

      numberInput?.focus();

      return false;
    }


    return true;
  }


  /* =========================================================
     21. ETAPA 2 — NAVEGAÇÃO
  ========================================================= */

  previousButton?.addEventListener(
    "click",
    () => {

      clearFormFeedback();

      showStep(1);
    }
  );


  nextContactButton?.addEventListener(
    "click",
    async () => {

      const cep =
        cepInput?.value.replace(
          /\D/g,
          ""
        ) || "";


      /*
        Segurança extra:
        caso o CEP esteja completo mas
        ainda não tenha sido resolvido.
      */

      if (
        cep.length === 8 &&
        !cityInput?.value.trim()
      ) {

        await fetchAddressByCEP();
      }


      if (
        !validateStepTwo()
      ) {
        return;
      }


      updateOrderSummaries();

      clearFormFeedback();

      showStep(3);

      nameInput?.focus();
    }
  );


  /* =========================================================
     22. WHATSAPP — MÁSCARA
  ========================================================= */

  function formatPhone(value) {

    const digits =
      value
        .replace(
          /\D/g,
          ""
        )
        .slice(
          0,
          11
        );


    if (
      digits.length <= 2
    ) {
      return digits;
    }


    if (
      digits.length <= 7
    ) {

      return (
        `(${digits.slice(0, 2)}) ` +
        `${digits.slice(2)}`
      );
    }


    if (
      digits.length <= 10
    ) {

      return (
        `(${digits.slice(0, 2)}) ` +
        `${digits.slice(2, 6)}-` +
        `${digits.slice(6)}`
      );
    }


    return (
      `(${digits.slice(0, 2)}) ` +
      `${digits.slice(2, 7)}-` +
      `${digits.slice(7)}`
    );
  }


  whatsappInput?.addEventListener(
    "input",
    () => {

      whatsappInput.value =
        formatPhone(
          whatsappInput.value
        );
    }
  );


  /* =========================================================
     23. VALIDAÇÃO — ETAPA 3
  ========================================================= */

  function validateStepThree() {

    clearFormFeedback();


    if (
      !nameInput?.value.trim()
    ) {

      showFormFeedback(
        "Informe seu nome."
      );

      nameInput?.focus();

      return false;
    }


    const phoneDigits =
      whatsappInput?.value.replace(
        /\D/g,
        ""
      ) || "";


    if (
      phoneDigits.length < 10
    ) {

      showFormFeedback(
        "Informe um WhatsApp válido."
      );

      whatsappInput?.focus();

      return false;
    }


    const payment =
      form.querySelector(
        'input[name="forma_pagamento"]:checked'
      );


    if (!payment) {

      showFormFeedback(
        "Escolha uma forma de pagamento."
      );

      paymentInputs[0]?.focus();

      return false;
    }


    return true;
  }


  /* =========================================================
     24. ETAPA 3 — VOLTAR
  ========================================================= */

  previousContactButton?.addEventListener(
    "click",
    () => {

      clearFormFeedback();

      showStep(2);
    }
  );


  /* =========================================================
     25. PAYLOAD DO PEDIDO
  ========================================================= */

  function getSelectedPayment() {

    return form.querySelector(
      'input[name="forma_pagamento"]:checked'
    )?.value || "";
  }


  function buildOrderPayload() {

    const order =
      getOrderData();


    return {
      schemaVersion: 1,

      origem: "site-friza",

      criadoEm:
        new Date().toLocaleString(
          "sv-SE",
          {
            timeZone: "America/Bahia"
          }
        ).replace(" ", "T"),

      cliente: {
        nome:
          nameInput?.value.trim() || "",

        whatsapp:
          whatsappInput?.value.trim() || ""
      },

      pedido: {
        produtos: {
          gelo5kg: {
            quantidade:
              order.amount5kg,

            pesoUnitarioKg:
              CONFIG.products["5kg"].weightKg,

            precoUnitario:
              CONFIG.products["5kg"].price
          },

          gelo10kg: {
            quantidade:
              order.amount10kg,

            pesoUnitarioKg:
              CONFIG.products["10kg"].weightKg,

            precoUnitario:
              CONFIG.products["10kg"].price
          }
        },

        totalSacos:
          order.totalBags,

        pesoTotalKg:
          order.totalWeight,

        dataEntrega:
          order.deliveryDate,

        subtotal:
          order.subtotal,

        frete:
          order.shippingPrice,

        freteGratis:
          order.freeShippingApplied,

        total:
          order.total
      },

      entrega: {
        cep:
          cepInput?.value.trim() || "",

        cidade:
          cityInput?.value.trim() || "",

        uf:
          stateInput?.value.trim() || "",

        bairro:
          neighborhoodInput?.value.trim() || "",

        rua:
          streetInput?.value.trim() || "",

        numero:
          numberInput?.value.trim() || "",

        complemento:
          complementInput?.value.trim() || ""
      },

      pagamento: {
        forma:
          getSelectedPayment()
      },

      observacao:
        observationInput?.value.trim() || ""
    };
  }


  /* =========================================================
     26. ESTADO DE ENVIO
  ========================================================= */

  function setSubmitting(isLoading) {

    isSubmitting =
      isLoading;


    if (!submitButton) {
      return;
    }


    submitButton.disabled =
      isLoading;


    submitButton.classList.toggle(
      "is-loading",
      isLoading
    );


    submitButton.setAttribute(
      "aria-busy",
      String(isLoading)
    );


    submitButton.textContent =
      isLoading
        ? "Enviando..."
        : originalSubmitButtonText;
  }


  function showSubmitSuccess() {

    if (!submitButton) {
      return;
    }


    /*
      Remove o loading.

      O botão permanece desabilitado
      enquanto a confirmação fica visível.
    */

    submitButton.classList.remove(
      "is-loading"
    );


    submitButton.disabled =
      true;


    submitButton.setAttribute(
      "aria-busy",
      "false"
    );


    submitButton.textContent =
      "✓ Pedido enviado";
  }


  /* =========================================================
     27. RESET DO FORMULÁRIO
  ========================================================= */

  function resetOrderForm() {

    /*
      Fecha o teclado no celular.
    */

    closeMobileKeyboard();

    lastResolvedCEP = "";


    /*
      Reseta inputs, radios,
      textarea e demais campos.
    */

    form.reset();


    /*
      Garante que as quantidades
      voltem explicitamente para zero.
    */

    quantityInputs.forEach(
      (input) => {

        input.value = "0";

        input.setAttribute(
          "value",
          "0"
        );


        input
          .closest(
            ".product-quantity-item"
          )
          ?.classList.remove(
            "has-quantity"
          );
      }
    );


    /*
      Limpa os campos preenchidos
      automaticamente pelo ViaCEP.
    */

    clearAddress();


    if (cepInput) {
      cepInput.value = "";
    }


    if (numberInput) {
      numberInput.value = "";
    }


    if (complementInput) {
      complementInput.value = "";
    }


    setCEPFeedback(
      "Cidade, UF, bairro e rua serão preenchidos pelo CEP."
    );


    /*
      Recalcula a data mínima.
    */

    setMinimumDeliveryDate();


    /*
      Resumos voltam ao estado inicial.
    */

    updateOrderSummaries();


    /*
      Remove a mensagem de sucesso.
    */

    clearFormFeedback();


    /*
      Volta para Pedido.
    */

    showStep(1);


    /*
      Restaura o botão.
    */

    if (submitButton) {

      submitButton.disabled =
        false;

      submitButton.classList.remove(
        "is-loading"
      );

      submitButton.removeAttribute(
        "aria-busy"
      );

      submitButton.textContent =
        originalSubmitButtonText;
    }


    isSubmitting = false;


    /*
      Depois de voltar para a etapa 1,
      reposiciona a página no topo
      do formulário.

      Não focamos nenhum campo para
      manter o teclado fechado.
    */

    window.requestAnimationFrame(
      () => {
        scrollFormToTop();
      }
    );
  }


  /* =========================================================
     28. ENVIO
  ========================================================= */

  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      /*
        Impede envio duplicado.
      */

      if (isSubmitting) {
        return;
      }


      if (
        !validateStepOne()
      ) {

        showStep(1);

        return;
      }


      if (
        !validateStepTwo()
      ) {

        showStep(2);

        return;
      }


      if (
        !validateStepThree()
      ) {

        showStep(3);

        return;
      }


      updateOrderSummaries();

      clearFormFeedback();


      const payload =
        buildOrderPayload();


      try {

        /*
          Durante a requisição:
          - bloqueia o botão;
          - ativa o loading;
          - impede novos envios.
        */

        setSubmitting(true);


        showFormFeedback(
          "Enviando seu pedido...",
          "loading"
        );


        /*
          webhook.js valida o status HTTP.
        */

        await sendOrderToWebhook(
          payload
        );


        /*
          Se chegou aqui,
          o n8n respondeu com sucesso.
        */

        showSubmitSuccess();


        showFormFeedback(
          "Pedido enviado! Em breve você receberá a confirmação pelo WhatsApp.",
          "success"
        );


        /*
          Mantém a confirmação visível
          por 4 segundos.

          Depois:
          - fecha o teclado;
          - limpa tudo;
          - volta para Pedido;
          - sobe até o topo do formulário.
        */

        window.setTimeout(
          () => {

            resetOrderForm();

          },
          SUCCESS_RESET_DELAY
        );


      } catch (error) {

        console.error(
          "Erro ao enviar pedido:",
          error
        );


        showFormFeedback(
          "Não foi possível enviar o pedido agora. Tente novamente.",
          "error"
        );


        /*
          Em caso de erro,
          libera nova tentativa.
        */

        setSubmitting(false);

      }

    }
  );


  /* =========================================================
     29. INICIALIZAÇÃO
  ========================================================= */

  setMinimumDeliveryDate();

  updateOrderSummaries();

  showStep(1);

  updateMobileOrderCTA();

  window.addEventListener(
    "scroll",
    updateMobileOrderCTA,
    {
      passive: true
    }
  );

  window.addEventListener(
    "resize",
    updateMobileOrderCTA
  );
}