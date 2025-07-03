/**
 * Define a configuração padrão para todos os filtros disponíveis na extensão.
 * Este arquivo centraliza a definição de cada filtro, que será usado tanto
 * na página de opções (para configurar a disposição) quanto na barra lateral
 * (para renderização e funcionamento).
 *
 * Estrutura de cada objeto de filtro:
 * - id: Identificador único do elemento HTML.
 * - label: O texto que descreve o filtro na interface.
 * - type: O tipo de elemento de input ('text', 'select', 'checkbox', 'buttonGroup', 'selectGroup').
 * - section: A qual seção principal o filtro pertence ('consultations', 'exams', 'appointments', 'regulations').
 * - defaultLocation: Onde o filtro aparece por padrão ('main' ou 'more').
 * - placeholder: (Opcional) Texto de exemplo para campos de texto.
 * - options: (Opcional) Um array de objetos {value, text} para elementos 'select' ou 'selectGroup'.
 * - defaultChecked: (Opcional) Estado padrão para 'checkbox'.
 */

export const filterConfig = {
  consultations: [
    {
      id: "consultation-filter-keyword",
      label: "Busca por Palavra-chave",
      type: "text",
      section: "consultations",
      defaultLocation: "main",
      placeholder: "Busque em todo o conteúdo...",
    },
    {
      id: "hide-no-show-checkbox",
      label: "Ocultar faltas",
      type: "checkbox",
      section: "consultations",
      defaultLocation: "main",
      defaultChecked: false,
    },
    {
      // ALTERADO: De buttonGroup para selectGroup para economizar espaço.
      id: "fetch-type-buttons",
      label: "Tipo de Consulta",
      type: "selectGroup",
      section: "consultations",
      defaultLocation: "more",
      options: [
        { value: "all", text: "Todas" },
        { value: "basic", text: "Básicas" },
        { value: "specialized", text: "Especializadas" },
      ],
    },
    {
      id: "consultation-filter-cid",
      label: "CID/CIAP",
      type: "text",
      section: "consultations",
      defaultLocation: "more",
      placeholder: "Ex: A09, Z00...",
    },
    {
      id: "consultation-filter-specialty",
      label: "Especialidade",
      type: "text",
      section: "consultations",
      defaultLocation: "more",
      placeholder: "Digite especialidades, separe por vírgula...",
    },
    {
      id: "consultation-filter-professional",
      label: "Profissional",
      type: "text",
      section: "consultations",
      defaultLocation: "more",
      placeholder: "Digite nomes, separe por vírgula...",
    },
    {
      id: "consultation-filter-unit",
      label: "Unidade de Saúde",
      type: "text",
      section: "consultations",
      defaultLocation: "more",
      placeholder: "Digite unidades, separe por vírgula...",
    },
  ],
  exams: [
    {
      // ALTERADO: De buttonGroup para selectGroup.
      id: "exam-fetch-type-buttons",
      label: "Status do Resultado",
      type: "selectGroup",
      section: "exams",
      defaultLocation: "main",
      options: [
        { value: "all", text: "Todos" },
        { value: "withResult", text: "Com Resultado" },
        { value: "withoutResult", text: "Sem Resultado" },
      ],
    },
    {
      id: "exam-filter-name",
      label: "Nome do Exame",
      type: "text",
      section: "exams",
      defaultLocation: "main",
      placeholder: "Digite nomes, separe por vírgula...",
    },
    {
      id: "exam-filter-professional",
      label: "Profissional Solicitante",
      type: "text",
      section: "exams",
      defaultLocation: "more",
      placeholder: "Digite nomes, separe por vírgula...",
    },
    {
      id: "exam-filter-specialty",
      label: "Especialidade Solicitante",
      type: "text",
      section: "exams",
      defaultLocation: "more",
      placeholder: "Digite especialidades, separe por vírgula...",
    },
  ],
  appointments: [
    {
      // ALTERADO: De buttonGroup para selectGroup.
      id: "appointment-fetch-type-buttons",
      label: "Tipo de Agendamento",
      type: "selectGroup",
      section: "appointments",
      defaultLocation: "main",
      options: [
        { value: "all", text: "Todos" },
        { value: "consultas", text: "Consultas" },
        { value: "exames", text: "Exames" },
      ],
    },
    {
      id: "appointment-filter-status",
      label: "Status",
      type: "select",
      section: "appointments",
      defaultLocation: "main",
      options: [
        { value: "todos", text: "Todos" },
        { value: "AGENDADO", text: "Agendado" },
        { value: "PRESENTE", text: "Presente" },
        { value: "FALTOU", text: "Faltou" },
        { value: "CANCELADO", text: "Cancelado" },
        { value: "ATENDIDO", text: "Atendido" },
      ],
    },
    {
      id: "appointment-filter-term",
      label: "Busca por Termo",
      type: "text",
      section: "appointments",
      defaultLocation: "more",
      placeholder: "Profissional, especialidade...",
    },
    {
      id: "appointment-filter-location",
      label: "Local",
      type: "text",
      section: "appointments",
      defaultLocation: "more",
      placeholder: "Digite locais, separe por vírgula...",
    },
  ],
  regulations: [
    {
      // ALTERADO: De buttonGroup para selectGroup.
      id: "regulation-fetch-type-buttons",
      label: "Modalidade",
      type: "selectGroup",
      section: "regulations",
      defaultLocation: "main",
      options: [
        { value: "all", text: "Todos" },
        { value: "ENC", text: "Consultas" },
        { value: "EXA", text: "Exames" },
      ],
    },
    {
      id: "regulation-filter-status",
      label: "Status",
      type: "select",
      section: "regulations",
      defaultLocation: "main",
      options: [
        { value: "todos", text: "Todos" },
        { value: "AUTORIZADO", text: "Autorizado" },
        { value: "PENDENTE", text: "Pendente" },
        { value: "NEGADO", text: "Negado" },
        { value: "DEVOLVIDO", text: "Devolvido" },
        { value: "CANCELADA", text: "Cancelada" },
        { value: "EM ANÁLISE", text: "Em Análise" },
      ],
    },
    {
      id: "regulation-filter-priority",
      label: "Prioridade",
      type: "select",
      section: "regulations",
      defaultLocation: "more",
      options: [
        { value: "todas", text: "Todas" },
        { value: "EMERGENCIA", text: "Emergência" },
        { value: "MUITO ALTA", text: "Muito Alta" },
        { value: "ALTA", text: "Alta" },
        { value: "NORMAL", text: "Normal" },
        { value: "BAIXA", text: "Baixa" },
      ],
    },
    {
      id: "regulation-filter-procedure",
      label: "Procedimento/Especialidade",
      type: "text",
      section: "regulations",
      defaultLocation: "more",
      placeholder: "Ex: Ortopedia, Raio X...",
    },
    {
      id: "regulation-filter-requester",
      label: "Profissional/Unidade Solicitante",
      type: "text",
      section: "regulations",
      defaultLocation: "more",
      placeholder: "Digite nomes, separe por vírgula...",
    },
  ],
};
