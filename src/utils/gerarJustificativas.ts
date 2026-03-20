export function gerarJustificativas(lines: string[]): string[] {
  return lines
    .filter((line) => line.trim().length > 3)
    .map((line, idx) => gerarUmaJustificativa(line, idx + 1));
}

function extrair(line: string, keys: string[]): string {
  for (const key of keys) {
    const regex = new RegExp(key + "[:\\s]+([^|\\n;]+)", "i");
    const match = line.match(regex);
    if (match) return match[1].trim();
  }
  return "";
}

function gerarUmaJustificativa(line: string, num: number): string {
  // Extração de campos
  const coleta =
    extrair(line, ["coleta", "origem", "retirada", "pickup"]) ||
    extrair(line, ["de"]);
  const entrega =
    extrair(line, ["entrega", "destino", "delivery"]) || extrair(line, ["para"]);
  const solicitante = extrair(line, [
    "solicitante",
    "solicitado por",
    "aprovado por",
    "resp",
    "responsável",
  ]);
  const email = (line.match(/[\w.+-]+@electrolux\.com\.br/i) || [])[0] || "";
  const debora =
    /d[eé]bora/i.test(line) ||
    /debora\.alvelino/i.test(line) ||
    /debora alvelino/i.test(line);
  const st =
    extrair(line, ["st", "ocorrência", "ocorrencia", "chamado", "ticket"]) ||
    (line.match(/\bst[:\s#-]*(\d{4,7})\b/i) || [])[1] ||
    (line.match(/\bocorr[eê]ncia[:\s#-]*(\d{4,7})\b/i) || [])[1] ||
    "";
  const ordem =
    extrair(line, ["ordem interna", "ordem", "oi", "op"]) ||
    (line.match(/\b([A-Z]{2}\d{2}[A-Z]\d{4})\b/) || [])[1] ||
    "";
  const valor =
    extrair(line, ["valor", "total", "R\\$"]) ||
    (line.match(/R\$[\s]?[\d.,]+/i) || [])[0] ||
    "";
  const contato = extrair(line, ["contato", "fone", "tel", "com"]);
  const material = extrair(line, ["material", "item", "produto", "carga"]);
  const motorista = extrair(line, [
    "motorista",
    "condutor",
    "driver",
  ]);

  // -- Construção da justificativa --
  let partes: string[] = [];

  // Linha do material/movimentação
  if (material) {
    partes.push(`Movimentação de ${material}`);
  } else if (coleta && entrega) {
    partes.push(`Coleta e entrega de material`);
  } else if (coleta) {
    partes.push(`Coleta de material`);
  } else if (entrega) {
    partes.push(`Entrega de material`);
  } else {
    partes.push(`Movimentação operacional`);
  }

  // Trajeto
  if (coleta && entrega) {
    partes.push(`com origem em ${coleta} e destino em ${entrega}`);
  } else if (coleta) {
    partes.push(`com retirada em ${coleta}`);
  } else if (entrega) {
    partes.push(`com entrega em ${entrega}`);
  }

  // Contato/telefone
  if (contato && !coleta && !entrega) {
    partes.push(`com contato ${contato}`);
  }

  // Finaliza o parágrafo 1
  const p1 = partes.join(" ") + ".";
  partes = [];

  // Parágrafo 2 — ST, Ordem, Solicitante
  const p2Parts: string[] = [];

  if (st) {
    p2Parts.push(`Atendimento da ocorrência/ST ${st}`);
  }
  if (ordem) {
    p2Parts.push(st ? `(Ordem Interna: ${ordem})` : `Ordem interna: ${ordem}`);
  }
  if (debora && email) {
    p2Parts.push(`solicitado e aprovado por Débora Alvelino (${email})`);
  } else if (debora) {
    p2Parts.push(`solicitado e aprovado por Débora Alvelino`);
  } else if (solicitante) {
    p2Parts.push(`solicitado por ${solicitante}`);
  } else if (email) {
    p2Parts.push(`solicitado via ${email}`);
  }

  const p2 = p2Parts.length
    ? p2Parts.join(", ") + "."
    : "";

  // Parágrafo 3 — Valor, motorista, necessidade
  const p3Parts: string[] = [];
  if (valor) {
    p3Parts.push(`Valor envolvido: ${valor}`);
  }
  if (motorista) {
    p3Parts.push(`Motorista responsável: ${motorista}`);
  }

  // Fecho
  const fechos = [
    "Movimentação necessária para continuidade das operações da unidade.",
    "Ação essencial para suporte logístico e administrativo da unidade.",
    "Necessário para regularização e atendimento da demanda registrada.",
    "Essencial para garantir o fluxo operacional e atendimento ao solicitante.",
    "Movimentação autorizada conforme necessidade operacional vigente.",
  ];
  const fecho = fechos[num % fechos.length];

  const blocos = [p1, p2, p3Parts.join(". ") + (p3Parts.length ? "." : ""), fecho]
    .filter((b) => b.trim().length > 1)
    .join(" ");

  return blocos.trim();
}
