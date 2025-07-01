/**
 * Salva as opções no chrome.storage.
 */
function saveOptions() {
  const baseUrl = document.getElementById("baseUrlInput").value;
  const status = document.getElementById("statusMessage");
  // Novas preferências
  const autoLoadExams = document.getElementById(
    "autoLoadExamsCheckbox"
  ).checked;
  const autoLoadConsultations =
    document.getElementById("autoLoadConsultationsCheckbox")?.checked || false;
  const examWithResultDefault = document.getElementById(
    "examWithResultDefaultCheckbox"
  ).checked;
  const examWithoutResultDefault = document.getElementById(
    "examWithoutResultDefaultCheckbox"
  ).checked;
  const hideNoShowDefault = document.getElementById(
    "hideNoShowDefaultCheckbox"
  ).checked;
  const monthsBack =
    parseInt(document.getElementById("monthsBackInput").value, 10) || 6;

  // Validação simples da URL
  if (
    !baseUrl ||
    (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://"))
  ) {
    status.textContent =
      "Erro: A URL é inválida. Deve começar com http:// ou https://";
    status.className = "mt-4 text-sm font-medium text-red-600";
    setTimeout(() => {
      status.textContent = "";
    }, 3000);
    return;
  }

  // Salva as opções usando a API de armazenamento do Chrome
  chrome.storage.sync.set(
    {
      baseUrl: baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl, // Remove barra final
      autoLoadExams,
      autoLoadConsultations,
      examWithResultDefault,
      examWithoutResultDefault,
      hideNoShowDefault,
      monthsBack,
    },
    () => {
      // Exibe uma mensagem de confirmação para o usuário.
      status.textContent = "Opções salvas com sucesso!";
      status.className = "mt-4 text-sm font-medium text-green-600";
      setTimeout(() => {
        status.textContent = "";
      }, 2000);
    }
  );
}

/**
 * Restaura as opções salvas quando a página é carregada.
 */
function restoreOptions() {
  chrome.storage.sync.get(
    {
      baseUrl: "", // Valor padrão caso nada esteja salvo
      autoLoadExams: false,
      autoLoadConsultations: false,
      examWithResultDefault: true,
      examWithoutResultDefault: true,
      hideNoShowDefault: false,
      monthsBack: 6,
    },
    (items) => {
      document.getElementById("baseUrlInput").value = items.baseUrl;
      document.getElementById("autoLoadExamsCheckbox").checked =
        items.autoLoadExams;
      if (document.getElementById("autoLoadConsultationsCheckbox"))
        document.getElementById("autoLoadConsultationsCheckbox").checked =
          items.autoLoadConsultations;
      document.getElementById("examWithResultDefaultCheckbox").checked =
        items.examWithResultDefault;
      document.getElementById("examWithoutResultDefaultCheckbox").checked =
        items.examWithoutResultDefault;
      document.getElementById("hideNoShowDefaultCheckbox").checked =
        items.hideNoShowDefault;
      document.getElementById("monthsBackInput").value = items.monthsBack;
    }
  );
}

// Adiciona botão "voltar" para a sidebar
function addBackButton() {
  const main = document.querySelector("main");
  if (!main) return;
  const backBtn = document.createElement("a");
  backBtn.href = "sidebar.html";
  backBtn.className =
    "inline-flex items-center mb-4 text-blue-600 hover:underline text-sm";
  backBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="mr-1">
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
    Voltar para a Sidebar
  `;
  main.insertBefore(backBtn, main.firstChild);
}

// Adiciona os listeners aos eventos da página.
document.addEventListener("DOMContentLoaded", () => {
  restoreOptions();
  addBackButton();
});
document.getElementById("saveButton").addEventListener("click", saveOptions);
