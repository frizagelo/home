const accordionItems = document.querySelectorAll(".accordion-item");

accordionItems.forEach((item) => {
  const trigger = item.querySelector(".accordion-trigger");
  const content = item.querySelector(".accordion-content");
  const icon = item.querySelector(".accordion-icon");

  trigger.addEventListener("click", () => {
    const isOpen = trigger.getAttribute("aria-expanded") === "true";

    accordionItems.forEach((otherItem) => {
      const otherTrigger = otherItem.querySelector(".accordion-trigger");
      const otherContent = otherItem.querySelector(".accordion-content");
      const otherIcon = otherItem.querySelector(".accordion-icon");

      if (otherItem !== item) {
        closeAccordion(otherTrigger, otherContent, otherIcon);
      }
    });

    if (isOpen) {
      closeAccordion(trigger, content, icon);
    } else {
      openAccordion(trigger, content, icon);
    }
  });
});


function openAccordion(trigger, content, icon) {
  trigger.setAttribute("aria-expanded", "true");
  icon.textContent = "−";

  content.hidden = false;

  content.style.height = "0px";
  content.style.opacity = "0";

  requestAnimationFrame(() => {
    content.style.height = `${content.scrollHeight}px`;
    content.style.opacity = "1";
  });

  content.addEventListener(
    "transitionend",
    () => {
      if (trigger.getAttribute("aria-expanded") === "true") {
        content.style.height = "auto";
      }
    },
    { once: true }
  );
}


function closeAccordion(trigger, content, icon) {
  if (content.hidden) {
    return;
  }

  trigger.setAttribute("aria-expanded", "false");
  icon.textContent = "+";

  content.style.height = `${content.scrollHeight}px`;

  requestAnimationFrame(() => {
    content.style.height = "0px";
    content.style.opacity = "0";
  });

  content.addEventListener(
    "transitionend",
    () => {
      if (trigger.getAttribute("aria-expanded") === "false") {
        content.hidden = true;
      }
    },
    { once: true }
  );
}