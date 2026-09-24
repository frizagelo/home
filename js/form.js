/* =========================================================
   FRIZA GELO
   FORM.JS
   Lógica do formulário de pedido
========================================================= */

const form = document.querySelector("#order-form");


/* =========================================================
   CONFIGURAÇÃO COMERCIAL
   Valores provisórios para desenvolvimento.
   Altere aqui quando os preços oficiais forem definidos.
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


if (form) {

  /* =========================================================
     ELEMENTOS PRINCIPAIS
  ========================================================= */

  const steps = form.querySelectorAll(".form-step");

  const progressItems =
    document.querySelectorAll(".form-progress-item");

  const currentStepElement =
    document.querySelector("#current-step");


  const nextButton =
    document.querySelector("#next-step");

  const previousButton =
    document.querySelector("#previous-step");

  const nextContactButton =
    document.querySelector("#next-step-contact");

  const previousContactButton =
    document.querySelector("#previous-step-contact");

  const submitButton =
    document.querySelector("#submit-order");


  const quantityInputs =
    form.querySelectorAll(
      '.quantity-stepper input[type="number"]'
    );

  const quantityButtons =
    form.querySelectorAll(".quantity-button");


  const quantity5kg =
    document.querySelector("#quantidade-5kg");

  const quantity10kg =
    document.querySelector("#quantidade-10kg");


  const deliveryDate =
    document.querySelector("#data-entrega");


  const orderSummaryText =
    document.querySelector("#order-summary-text");

  const finalOrderSummaryText =
    document.querySelector("#final-order-summary-text");


  const cepInput =
    document.querySelector("#cep");

  const cepFeedback =
    document.querySelector("#cep-feedback");


  const streetInput =
    document.querySelector("#logradouro");

  const numberInput =
    document.querySelector("#numero");

  const complementInput =
    document.querySelector("#complemento");

  const neighborhoodInput =
    document.querySelector("#bairro");

  const cityInput =
    document.querySelector("#cidade");

  const stateInput =
    document.querySelector("#uf");


  const nameInput =
    document.querySelector("#nome");

  const whatsappInput =
    document.querySelector("#whatsapp");

  const observationInput =
    document.querySelector("#observacao");


  const paymentInputs =
    form.querySelectorAll(
      'input[name="forma_pagamento"]'
    );


  const formFeedback =
    document.querySelector("#form-feedback");


  let currentStep = 1;


  /* =========================================================
     HELPERS
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


  /* =========================================================
     CONTROLE DAS ETAPAS
  ========================================================= */

  function showStep(stepNumber) {

    steps.forEach((step) => {

      const stepValue =
        Number(step.dataset.step);

      const isCurrentStep =
        stepValue === stepNumber;


      step.hidden =
        !isCurrentStep;


      step.classList.toggle(
        "is-active",
        isCurrentStep
      );

    });


    progressItems.forEach((item) => {

      const itemStep =
        Number(item.dataset.progressStep);


      const isActive =
        itemStep === stepNumber;


      const isComplete =
        itemStep < stepNumber;


      item.classList.toggle(
        "is-active",
        isActive
      );


      item.classList.toggle(
        "is-complete",
        isComplete
      );


      if (isActive) {

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


    currentStep =
      stepNumber;


    if (currentStepElement) {

      currentStepElement.textContent =
        stepNumber;

    }

  }


  /* =========================================================
     FEEDBACK DO FORMULÁRIO
  ========================================================= */

  function showFormFeedback(
    message,
    type = "error"
  ) {

    if (!formFeedback) return;


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


  function clearFormFeedback() {

    if (!formFeedback) return;


    formFeedback.textContent =
      "";


    formFeedback.classList.remove(
      "is-visible",
      "is-success",
      "is-error",
      "is-loading"
    );

  }


  /* =========================================================
     QUANTIDADE / STEPPER
  ========================================================= */

  function sanitizeQuantity(value) {

    const parsedValue =
      Number.parseInt(
        value,
        10
      );


    if (
      Number.isNaN(parsedValue) ||
      parsedValue < 0
    ) {

      return 0;

    }


    return parsedValue;

  }


  function setQuantity(
    input,
    quantity
  ) {

    const safeQuantity =
      Math.max(
        0,
        quantity
      );


    input.value =
      safeQuantity;


    input.setAttribute(
      "value",
      safeQuantity
    );


    const productItem =
      input.closest(
        ".product-quantity-item"
      );


    if (productItem) {

      productItem.classList.toggle(
        "has-quantity",
        safeQuantity > 0
      );

    }


    updateOrderSummary();

  }


  quantityButtons.forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          const targetId =
            button.dataset.target;


          const action =
            button.dataset.action;


          const input =
            document.querySelector(
              `#${targetId}`
            );


          if (!input) return;


          const currentValue =
            sanitizeQuantity(
              input.value
            );


          if (
            action === "increase"
          ) {

            setQuantity(
              input,
              currentValue + 1
            );

          }


          if (
            action === "decrease"
          ) {

            setQuantity(
              input,
              currentValue - 1
            );

          }

        }
      );

    }
  );


  quantityInputs.forEach(
    (input) => {

      input.addEventListener(
        "input",
        () => {

          const quantity =
            sanitizeQuantity(
              input.value
            );


          setQuantity(
            input,
            quantity
          );

        }
      );

    }
  );


  /* =========================================================
     CÁLCULOS DO PEDIDO
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
      cityInput?.value || "";


    const hasConfirmedCity =
      Boolean(
        selectedCity.trim()
      );


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
      Ao atingir o peso mínimo:

      - antes de confirmar o CEP,
        mostramos visualmente o benefício;

      - após o CEP,
        o benefício permanece somente
        se a cidade for Salvador;

      - fora de Salvador,
        o frete volta a ser cobrado.
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
     RESUMO DO PEDIDO
  ========================================================= */

  function updateOrderSummary() {

    /*
      Atualizamos simultaneamente:

      - resumo da etapa 1
      - resumo final da etapa 3
    */

    const summaryTargets = [

      orderSummaryText,

      finalOrderSummaryText

    ].filter(Boolean);


    if (
      summaryTargets.length === 0
    ) {

      return;

    }


    const order =
      getOrderData();


    const items =
      [];


    if (
      order.amount5kg > 0
    ) {

      items.push(
        `${order.amount5kg}x 5 kg`
      );

    }


    if (
      order.amount10kg > 0
    ) {

      items.push(
        `${order.amount10kg}x 10 kg`
      );

    }


    /* =========================
       PEDIDO VAZIO
    ========================== */

    if (
      items.length === 0
    ) {

      summaryTargets.forEach(
        (target) => {

          target.innerHTML = `
            <span class="order-summary-empty">
              Nenhum item selecionado.
            </span>
          `;

        }
      );


      return;

    }


    /* =========================
       QUANTIDADE DE SACOS
    ========================== */

    const bagLabel =
      order.totalBags === 1
        ? "1 saco"
        : `${order.totalBags} sacos`;


    /* =========================
       ENTREGA
    ========================== */

    let shippingRow =
      "";


    if (
      order.freeShippingApplied
    ) {

      shippingRow = `
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

    } else {

      shippingRow = `
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


    /* =========================
       AVISO DE FRETE
    ========================== */

    let freeShippingMessage =
      "";


    /*
      Já atingiu 40 kg,
      mas ainda não confirmou o CEP.
    */

    if (
      order.meetsFreeShippingWeight &&
      !order.hasConfirmedCity
    ) {

      freeShippingMessage = `
        <div class="order-summary-benefit is-success">

          ✓ Frete grátis liberado para Salvador.
          Confirme o CEP para validar a entrega.

        </div>
      `;

    }


    /*
      CEP validado em Salvador.
    */

    else if (
      order.meetsFreeShippingWeight &&
      order.isSalvador
    ) {

      freeShippingMessage = `
        <div class="order-summary-benefit is-success">

          ✓ Frete grátis aplicado em Salvador.

        </div>
      `;

    }


    /*
      Tem 40 kg ou mais,
      mas cidade confirmada não é Salvador.
    */

    else if (
      order.meetsFreeShippingWeight &&
      order.hasConfirmedCity &&
      !order.isSalvador
    ) {

      freeShippingMessage = `
        <div class="order-summary-benefit">

          Frete fixo de

          <strong>
            ${formatCurrency(
              CONFIG.shipping.fixedPrice
            )}
          </strong>

          para esta cidade.

        </div>
      `;

    }


    /*
      Ainda não chegou a 40 kg.
    */

    else {

      const remaining =
        CONFIG.shipping
          .freeShippingMinimumWeightKg -
        order.totalWeight;


      freeShippingMessage = `
        <div class="order-summary-benefit">

          Faltam

          <strong>
            ${remaining} kg
          </strong>

          para frete grátis em Salvador.

        </div>
      `;

    }


    /* =========================
       HTML DO RESUMO
    ========================== */

    const summaryHTML = `

      <div class="order-summary-products">

        <strong>
          ${items.join(" + ")}
        </strong>

        <span>
          ${bagLabel} • ${order.totalWeight} kg
        </span>

      </div>


      <div class="order-summary-divider"></div>


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


      ${freeShippingMessage}

    `;


    summaryTargets.forEach(
      (target) => {

        target.innerHTML =
          summaryHTML;

      }
    );

  }


  /* =========================================================
     DATA MÍNIMA
  ========================================================= */

  function setMinimumDeliveryDate() {

    if (!deliveryDate) return;


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
     VALIDAÇÃO — ETAPA 1
  ========================================================= */

  function validateStepOne() {

    clearFormFeedback();


    const order =
      getOrderData();


    if (
      order.totalBags === 0
    ) {

      showFormFeedback(
        "Selecione pelo menos 1 saco de gelo.",
        "error"
      );


      return false;

    }


    if (
      !deliveryDate?.value
    ) {

      showFormFeedback(
        "Escolha a data desejada para a entrega.",
        "error"
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
        "Escolha uma data com pelo menos 24 horas de antecedência.",
        "error"
      );


      deliveryDate.focus();


      return false;

    }


    return true;

  }


  /* =========================================================
     NAVEGAÇÃO — ETAPA 1 → ETAPA 2
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
     CEP — MÁSCARA
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
      `${digits.slice(5, 8)}`
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


      if (
        digits.length < 8
      ) {

        clearAddress();


        setCEPFeedback(
          "Cidade, UF, bairro e rua serão preenchidos pelo CEP."
        );


        updateOrderSummary();

      }

    }
  );


  /* =========================================================
     CEP — FEEDBACK
  ========================================================= */

  function setCEPFeedback(
    message,
    type = ""
  ) {

    if (!cepFeedback) return;


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
     CEP — ENDEREÇO
  ========================================================= */

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


  function setAddressFieldReadonly(
    field,
    readonly
  ) {

    if (!field) return;


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


  /* =========================================================
     BUSCA DO CEP
  ========================================================= */

  async function fetchAddressByCEP() {

    if (!cepInput) return;


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


      if (
        !response.ok
      ) {

        throw new Error(
          "Erro ao consultar CEP."
        );

      }


      const data =
        await response.json();


      if (
        data.erro
      ) {

        clearAddress();


        setCEPFeedback(
          "CEP não encontrado. Confira e tente novamente.",
          "error"
        );


        updateOrderSummary();


        return false;

      }


      /* =========================
         PREENCHE ENDEREÇO
      ========================== */

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
        Se ViaCEP encontrou rua ou bairro,
        mantém readonly.

        Caso não tenha encontrado,
        permite digitação manual.
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


      setCEPFeedback(
        "Endereço encontrado.",
        "success"
      );


      /*
        Recalcula o frete porque
        agora sabemos a cidade.
      */

      updateOrderSummary();


      numberInput?.focus();


      return true;

    } catch (error) {

      console.error(error);


      setCEPFeedback(
        "Não foi possível consultar o CEP agora. Tente novamente.",
        "error"
      );


      return false;

    }

  }


  cepInput?.addEventListener(
    "blur",
    fetchAddressByCEP
  );


  cepInput?.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Enter"
      ) {

        event.preventDefault();


        fetchAddressByCEP();

      }

    }
  );


  /* =========================================================
     VALIDAÇÃO — ETAPA 2
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
        "Informe um CEP válido.",
        "error"
      );


      cepInput?.focus();


      return false;

    }


    if (
      !cityInput?.value.trim()
    ) {

      showFormFeedback(
        "Não conseguimos identificar a cidade pelo CEP.",
        "error"
      );


      cepInput?.focus();


      return false;

    }


    if (
      !stateInput?.value.trim()
    ) {

      showFormFeedback(
        "Não conseguimos identificar o estado pelo CEP.",
        "error"
      );


      cepInput?.focus();


      return false;

    }


    if (
      !neighborhoodInput?.value.trim()
    ) {

      showFormFeedback(
        "Informe o bairro.",
        "error"
      );


      neighborhoodInput?.focus();


      return false;

    }


    if (
      !streetInput?.value.trim()
    ) {

      showFormFeedback(
        "Informe a rua da entrega.",
        "error"
      );


      streetInput?.focus();


      return false;

    }


    if (
      !numberInput?.value.trim()
    ) {

      showFormFeedback(
        "Informe o número do endereço.",
        "error"
      );


      numberInput?.focus();


      return false;

    }


    return true;

  }


  /* =========================================================
     NAVEGAÇÃO — ETAPA 2
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

      const cepDigits =
        cepInput?.value.replace(
          /\D/g,
          ""
        ) || "";


      /*
        Se o usuário digitou um CEP válido,
        mas o endereço ainda não foi carregado,
        tentamos consultar antes de avançar.
      */

      if (
        cepDigits.length === 8 &&
        !cityInput?.value.trim()
      ) {

        await fetchAddressByCEP();

      }


      if (
        !validateStepTwo()
      ) {

        return;

      }


      clearFormFeedback();


      /*
        Neste momento o CEP já foi validado.

        Portanto o resumo final já pode
        mostrar o valor definitivo do frete.
      */

      updateOrderSummary();


      showStep(3);


      nameInput?.focus();

    }
  );


  /* =========================================================
     WHATSAPP — MÁSCARA
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
     VALIDAÇÃO — ETAPA 3
  ========================================================= */

  function validateStepThree() {

    clearFormFeedback();


    /* =========================
       NOME
    ========================== */

    if (
      !nameInput?.value.trim()
    ) {

      showFormFeedback(
        "Informe seu nome.",
        "error"
      );


      nameInput?.focus();


      return false;

    }


    /* =========================
       WHATSAPP
    ========================== */

    const phoneDigits =
      whatsappInput?.value.replace(
        /\D/g,
        ""
      ) || "";


    if (
      phoneDigits.length < 10
    ) {

      showFormFeedback(
        "Informe um WhatsApp válido.",
        "error"
      );


      whatsappInput?.focus();


      return false;

    }


    /* =========================
       FORMA DE PAGAMENTO
    ========================== */

    const selectedPayment =
      form.querySelector(
        'input[name="forma_pagamento"]:checked'
      );


    if (
      !selectedPayment
    ) {

      showFormFeedback(
        "Escolha uma forma de pagamento.",
        "error"
      );


      paymentInputs[0]?.focus();


      return false;

    }


    return true;

  }


  /* =========================================================
     NAVEGAÇÃO — ETAPA 3
  ========================================================= */

  previousContactButton?.addEventListener(
    "click",
    () => {

      clearFormFeedback();


      showStep(2);

    }
  );


  /* =========================================================
     ENVIO DO PEDIDO
  ========================================================= */

  form.addEventListener(
    "submit",
    (event) => {

      event.preventDefault();


      /*
        Valida novamente todas as etapas
        antes de considerar o pedido pronto.
      */

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


      /*
        Por enquanto o envio definitivo
        ainda não está integrado.

        Aqui futuramente entra:
        WhatsApp, backend, banco de dados etc.
      */

      showFormFeedback(
        "Pedido preenchido corretamente. A integração de envio será adicionada na próxima etapa.",
        "success"
      );

  });


  /* =========================================================
     INICIALIZAÇÃO
  ========================================================= */

  setMinimumDeliveryDate();


  updateOrderSummary();


  showStep(1);

}