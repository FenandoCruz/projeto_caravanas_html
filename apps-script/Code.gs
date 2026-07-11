const MEMBROS_SHEET = 'Membros';       // aba privada com a lista importada do PDF (Nome completo, Sexo, Idade, Data de Nascimento, Telefone, Email)
const RESPOSTAS_SHEET = 'Sheet1';      // aba onde ficam "Nome completo" / "Número do documento ( com foto )" (a que já existe)
const RESPOSTAS_HEADER_ROW = 3;        // linha onde estão os títulos "Nome completo" | "Número do documento..."
const MAX_RESULTS = 8;
const MIN_QUERY_LEN = 3;

function doGet(e) {
  const query = (e.parameter.nome || '').trim();
  if (query.length < MIN_QUERY_LEN) {
    return jsonResponse({ ok: true, results: [] });
  }

  const membros = getMembros_();
  const norm = normalize_(query);
  const matches = membros
    .filter(m => normalize_(m.nome).includes(norm))
    .slice(0, MAX_RESULTS)
    .map(m => ({ nome: m.nome, dataNascimento: m.dataNascimento, idade: m.idade, telefone: m.telefone }));

  return jsonResponse({ ok: true, results: matches });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const nome = (body.nome || '').trim();
    const documento = (body.documento || '').trim();

    if (!nome || !documento) {
      return jsonResponse({ ok: false, error: 'Nome e número do documento são obrigatórios.' });
    }

    const membros = getMembros_();
    const norm = normalize_(nome);
    const existe = membros.some(m => normalize_(m.nome) === norm);
    if (!existe) {
      return jsonResponse({ ok: false, error: 'Nome não encontrado na lista de membros.' });
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(RESPOSTAS_SHEET);
    const lastRow = Math.max(sheet.getLastRow(), RESPOSTAS_HEADER_ROW);

    // evita inscrição duplicada do mesmo nome
    const existentes = sheet
      .getRange(RESPOSTAS_HEADER_ROW + 1, 1, Math.max(lastRow - RESPOSTAS_HEADER_ROW, 0), 1)
      .getValues()
      .flat()
      .map(v => normalize_(String(v)));
    if (existentes.includes(norm)) {
      return jsonResponse({ ok: false, error: 'Essa pessoa já está inscrita.' });
    }

    sheet.getRange(lastRow + 1, 1, 1, 3).setValues([[nome, documento, new Date()]]);
    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: 'Erro ao processar inscrição: ' + err.message });
  }
}

function getMembros_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MEMBROS_SHEET);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  const [header, ...rows] = values;
  const idxNome = header.indexOf('Nome completo');
  const idxData = header.indexOf('Data de Nascimento');
  const idxIdade = header.indexOf('Idade');
  const idxTelefone = header.indexOf('Telefone');
  return rows
    .filter(r => r[idxNome])
    .map(r => ({
      nome: String(r[idxNome]),
      dataNascimento: idxData >= 0 ? formatarData_(r[idxData]) : '',
      idade: idxIdade >= 0 && r[idxIdade] ? String(r[idxIdade]) : '',
      telefone: idxTelefone >= 0 && r[idxTelefone] ? String(r[idxTelefone]) : ''
    }));
}

// A planilha converte datas para o tipo Date automaticamente na importação do CSV;
// aqui formatamos por extenso em português em vez do texto bruto do JavaScript.
function formatarData_(valor) {
  if (!valor) return '';
  if (Object.prototype.toString.call(valor) === '[object Date]') {
    return valor.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  return String(valor);
}

function normalize_(s) {
  return String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
