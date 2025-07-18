/**
 * Define a configuração padrão para os campos da ficha do paciente.
 * Este é o "molde" que a extensão usará se nenhuma configuração personalizada for encontrada.
 *
 * Estrutura de cada objeto de campo:
 * - id: Um identificador único para o campo (usado no HTML).
 * - key: O caminho para acessar o dado no objeto da ficha LOCAL (ex: 'entidadeFisica.entidade.entiNome').
 * - cadsusKey: O índice do dado correspondente no array 'cell' do CADSUS. Null se não houver correspondência.
 * - label: O nome do campo exibido na interface (pode ser editado pelo usuário).
 * - enabled: Se o campo deve ser exibido por padrão.
 * - section: Onde o campo aparece por padrão ('main' para sempre visível, 'more' para "Mostrar Mais").
 * - formatter: (Opcional) Uma função para formatar o valor antes da exibição e comparação.
 */

// Função para obter um valor aninhado de um objeto de forma segura
const getNestedValue = (obj, path) => {
  if (!path) return undefined;
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
};

// Função para normalizar e formatar telefones para exibição
const formatPhone = (value) => {
  if (!value) return "";
  // Remove todos os caracteres não numéricos, incluindo o DDI 55 que pode vir do CADSUS
  const digits = String(value).replace(/\D/g, "").replace(/^55/, "");
  if (digits.length === 11) {
    // (XX) XXXXX-XXXX
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (digits.length === 10) {
    // (XX) XXXX-XXXX
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return value; // Retorna original se não corresponder
};

// Formatter para valores 't' (true) e 'f' (false)
const formatBoolean = (value) => {
  if (value === "t" || value === true) return "Sim";
  if (value === "f" || value === false) return "Não";
  return value;
};

export const defaultFieldConfig = [
  // --- Seção Principal (Main) ---
  {
    id: "nomeCompleto",
    key: "entidadeFisica.entidade.entiNome",
    cadsusKey: 2,
    label: "Nome",
    enabled: true,
    section: "main",
    order: 1,
  },
  {
    id: "cpf",
    key: "entidadeFisica.entfCPF",
    cadsusKey: 50,
    label: "CPF",
    enabled: true,
    section: "main",
    order: 2,
    formatter: (value) => String(value || "").replace(/\D/g, ""), // Normaliza para comparação
  },
  {
    id: "cns",
    key: "isenNumCadSus",
    cadsusKey: (cell) =>
      (String(cell[1]) || "")
        .split("\n")[0]
        .replace(/\s*\(.*\)/, "")
        .trim(),
    label: "CNS",
    enabled: true,
    section: "main",
    order: 3,
  },
  {
    id: "nomeMae",
    key: "entidadeFisica.entfNomeMae",
    cadsusKey: 7,
    label: "Nome da Mãe",
    enabled: true,
    section: "main",
    order: 4,
  },
  {
    id: "dtNasc",
    key: "entidadeFisica.entfDtNasc",
    cadsusKey: 3,
    label: "Nascimento",
    enabled: true,
    section: "main",
    order: 5,
  },
  {
    id: "telefone",
    key: (data) =>
      `${data.entidadeFisica?.entidade?.entiTel1Pre || ""}${
        data.entidadeFisica?.entidade?.entiTel1 || ""
      }`,
    cadsusKey: 16,
    label: "Telefone",
    enabled: true,
    section: "main",
    order: 6,
    formatter: formatPhone,
  },
  // --- Seção "Mostrar Mais" (More) ---
  {
    id: "nomeSocial",
    key: "entidadeFisica.entidade.entiNomeSocial",
    cadsusKey: null,
    label: "Nome Social",
    enabled: true,
    section: "more",
    order: 1,
  },
  {
    id: "rg",
    key: "entidadeFisica.entfRG",
    cadsusKey: 51, // CORRIGIDO
    label: "RG",
    enabled: true,
    section: "more",
    order: 2,
  },
  {
    id: "endereco",
    key: (data) =>
      `${
        data.entidadeFisica?.entidade?.logradouro?.tipoLogradouro?.tiloNome ||
        ""
      } ${String(data.entidadeFisica?.entidade?.logradouro?.logrNome || "")
        .split("/")[0]
        .trim()}`.trim(),
    cadsusKey: (cell) =>
      `${String(cell[35] || "")} ${String(cell[34] || "")
        .split("/")[0]
        .trim()}`.trim(),
    label: "Endereço",
    enabled: true,
    section: "more",
    order: 3,
  },
  {
    id: "bairro",
    key: "entidadeFisica.entidade.localidade.locaNome",
    cadsusKey: 30,
    label: "Bairro",
    enabled: true,
    section: "more",
    order: 4,
  },
  {
    id: "cidade",
    key: "entidadeFisica.entidade.localidade.cidade.cidaNome",
    cadsusKey: 29,
    label: "Cidade",
    enabled: true,
    section: "more",
    order: 5,
  },
  {
    id: "cep",
    key: "entidadeFisica.entidade.entiEndeCEP",
    cadsusKey: 41,
    label: "CEP",
    enabled: true,
    section: "more",
    order: 6,
    formatter: (value) => String(value || "").replace(/\D/g, ""), // Normaliza para comparação
  },
  {
    id: "alergiaMedicamentos",
    key: "isenAlergMedicamentos",
    cadsusKey: null,
    label: "Alergia a Medicamentos",
    enabled: true,
    section: "more",
    order: 7,
  },
  {
    id: "alergiaAlimentos",
    key: "isenAlergAlimentos",
    cadsusKey: null,
    label: "Alergia a Alimentos",
    enabled: true,
    section: "more",
    order: 8,
  },
  {
    id: "alergiaQuimicos",
    key: "isenAlergElementosQuimicos",
    cadsusKey: null,
    label: "Alergia a Químicos",
    enabled: true,
    section: "more",
    order: 9,
  },
  {
    id: "acamado",
    key: "isenIsAcamado",
    cadsusKey: null,
    label: "Acamado",
    enabled: true,
    section: "more",
    order: 10,
    formatter: formatBoolean,
  },
  {
    id: "deficiente",
    key: "isenPessoaDeficiente",
    cadsusKey: null,
    label: "Pessoa com Deficiência",
    enabled: true,
    section: "more",
    order: 11,
    formatter: formatBoolean,
  },
  {
    id: "gemeo",
    key: "isenPossuiIrmaoGemeo",
    cadsusKey: null,
    label: "Possui Irmão Gêmeo",
    enabled: true,
    section: "more",
    order: 12,
    formatter: formatBoolean,
  },
  {
    id: "statusCadastro",
    key: "status.valor",
    cadsusKey: null,
    label: "Status do Cadastro",
    enabled: true,
    section: "more",
    order: 13,
  },
  {
    id: "unidadeSaude",
    key: "unidadeSaude.entidade.entiNome",
    cadsusKey: null,
    label: "Unidade de Saúde",
    enabled: true,
    section: "more",
    order: 14,
  },
  {
    id: "observacao",
    key: "entidadeFisica.entidade.entiObs",
    cadsusKey: null,
    label: "Observação do Cadastro",
    enabled: true,
    section: "more",
    order: 15,
  },
  {
    id: "nomePai",
    key: "entidadeFisica.entfNomePai",
    cadsusKey: 8, // CORRIGIDO
    label: "Nome do Pai",
    enabled: false,
    section: "more",
    order: 16,
  },
  {
    id: "racaCor",
    key: "entidadeFisica.racaCor.racoNome",
    cadsusKey: 11, // CORRIGIDO
    label: "Raça/Cor",
    enabled: false,
    section: "more",
    order: 17,
  },
  {
    id: "grauInstrucao",
    key: "entidadeFisica.grauInstrucao.grinNome",
    cadsusKey: null,
    label: "Grau de Instrução",
    enabled: false,
    section: "more",
    order: 18,
  },
  {
    id: "cidadeNascimento",
    key: "entidadeFisica.cidadeNasc.cidaNome",
    cadsusKey: 45, // CORRIGIDO
    label: "Cidade de Nascimento",
    enabled: false,
    section: "more",
    order: 19,
  },
  {
    id: "nacionalidade",
    key: "entidadeFisica.nacionalidade.naciDescricao",
    cadsusKey: 23, // CORRIGIDO
    label: "Nacionalidade",
    enabled: false,
    section: "more",
    order: 20,
  },
  {
    id: "religiao",
    key: "entidadeFisica.religiao.reliNome",
    cadsusKey: null,
    label: "Religião",
    enabled: false,
    section: "more",
    order: 21,
  },
  {
    id: "cbo",
    key: "entidadeFisica.cbo.dcboNome",
    cadsusKey: null,
    label: "Profissão (CBO)",
    enabled: false,
    section: "more",
    order: 22,
  },
  {
    id: "pis",
    key: "entidadeFisica.entfPis",
    cadsusKey: 55, // CORRIGIDO
    label: "PIS",
    enabled: false,
    section: "more",
    order: 23,
  },
  {
    id: "ctps",
    key: (data) => {
      const ctps = data.entidadeFisica?.entfCTPS || "";
      const serie = data.entidadeFisica?.entfCTPSSerie || "";
      if (!ctps) return "";
      return `${ctps} (Série: ${serie})`;
    },
    cadsusKey: null,
    label: "CTPS",
    enabled: false,
    section: "more",
    order: 24,
  },
  {
    id: "convulsivo",
    key: "isenIsConvulsivo",
    cadsusKey: null,
    label: "É Convulsivo",
    enabled: true,
    section: "more",
    order: 25,
    formatter: formatBoolean,
  },
  {
    id: "bpc",
    key: "isenRecebeBPC",
    cadsusKey: null,
    label: "Recebe BPC",
    enabled: true,
    section: "more",
    order: 26,
    formatter: formatBoolean,
  },
  {
    id: "autista",
    key: "isenEspectroAutista",
    cadsusKey: null,
    label: "Espectro Autista",
    enabled: true,
    section: "more",
    order: 27,
    formatter: formatBoolean,
  },
];

// Exporta a função para obter valores, será útil no sidebar.js
export { getNestedValue };
