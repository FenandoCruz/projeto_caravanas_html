const MEMBROS_SHEET = 'Membros';       // aba privada com a lista importada do PDF (Nome completo, Sexo, Idade, Data de Nascimento, Telefone, Email)
const RESPOSTAS_SHEET = 'Sheet1';      // aba onde ficam "Nome completo" / "Número do documento ( com foto )" (a que já existe)
const RESPOSTAS_HEADER_ROW = 3;        // linha onde estão os títulos "Nome completo" | "Número do documento..."
const MAX_RESULTS = 8;
const MIN_QUERY_LEN = 3;
const EMAIL_NOTIFICACAO = 'telesthierry@gmail.com'; // recebe um e-mail a cada nova inscrição

function doGet(e) {
  // se "e" vier undefined (ex: rodando pelo botão "Executar" do editor, sem
  // requisição real por trás), trata como busca vazia em vez de quebrar
  const query = ((e && e.parameter && e.parameter.nome) || '').trim();
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
    const numExistentes = Math.max(lastRow - RESPOSTAS_HEADER_ROW, 0);

    // evita inscrição duplicada do mesmo nome (só olha a planilha se já tiver alguma linha)
    if (numExistentes > 0) {
      const existentes = sheet
        .getRange(RESPOSTAS_HEADER_ROW + 1, 1, numExistentes, 1)
        .getValues()
        .flat()
        .map(v => normalize_(String(v)));
      if (existentes.includes(norm)) {
        return jsonResponse({ ok: false, error: 'Essa pessoa já está inscrita.' });
      }
    }

    sheet.getRange(lastRow + 1, 1, 1, 3).setValues([[nome, documento, new Date()]]);
    notificarNovaInscricao_(nome, documento);
    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: 'Erro ao processar inscrição: ' + err.message });
  }
}

// Avisa por e-mail a cada nova inscrição. Envolvido em try/catch pra nunca
// travar a inscrição da pessoa por causa de um problema no envio do e-mail.
function notificarNovaInscricao_(nome, documento) {
  if (!EMAIL_NOTIFICACAO) return;
  try {
    MailApp.sendEmail({
      to: EMAIL_NOTIFICACAO,
      subject: `${nome} fez uma inscrição para a caravana`,
      body: `${nome} fez uma inscrição para a caravana.\n\n` +
        `Documento informado: ${documento}\n` +
        `Data/hora: ${new Date().toLocaleString('pt-BR')}`,
      htmlBody: montarEmailHtml_(nome, documento)
    });
  } catch (err) {
    // a inscrição já foi gravada com sucesso; só registra o erro do e-mail no log
    // (Apps Script > ícone de relógio "Execuções" na barra lateral) pra dar pra depurar
    console.error('Erro ao enviar e-mail de notificação: ' + err.message);
  }
}

// Template do e-mail com a cara do site (azul/laranja) + botão pra abrir a planilha
function montarEmailHtml_(nome, documento) {
  const dataHora = new Date().toLocaleString('pt-BR');
  const linkPlanilha = SpreadsheetApp.getActiveSpreadsheet().getUrl();

  return `
    <div style="background-color:#E6F0FA; padding:2rem 1rem; font-family:Arial, sans-serif;">
      <table role="presentation" width="100%" style="max-width:480px; margin:0 auto; background-color:#ffffff; border-radius:8px; border-collapse:collapse; overflow:hidden;">
        <tr>
          <td style="background-color:#2A4D8F; padding:1.5rem; text-align:center;">
            <span style="color:#ffffff; font-size:1.2rem; font-weight:bold;">Caravanas SUD à Casa do Senhor</span>
          </td>
        </tr>
        <tr>
          <td style="padding:1.75rem;">
            <p style="margin:0 0 0.5rem; color:#333; font-size:1rem;">✅ Nova inscrição confirmada</p>
            <p style="margin:0 0 1.25rem; color:#2A4D8F; font-size:1.3rem; font-weight:bold;">${nome}</p>
            <table role="presentation" width="100%" style="border-collapse:collapse; margin-bottom:1.5rem;">
              <tr>
                <td style="padding:0.4rem 0; color:#555; font-size:0.95rem;">Documento (com foto)</td>
                <td style="padding:0.4rem 0; color:#333; font-size:0.95rem; text-align:right;">${documento}</td>
              </tr>
              <tr>
                <td style="padding:0.4rem 0; color:#555; font-size:0.95rem;">Data/hora</td>
                <td style="padding:0.4rem 0; color:#333; font-size:0.95rem; text-align:right;">${dataHora}</td>
              </tr>
            </table>
            <table role="presentation" width="100%">
              <tr>
                <td align="center">
                  <a href="${linkPlanilha}" style="display:inline-block; background-color:#FF9800; color:#ffffff; text-decoration:none; font-weight:bold; padding:0.75rem 1.5rem; border-radius:5px; font-size:1rem;">Abrir planilha</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
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

// Função só pra testar o envio de e-mail na mão (selecione "testarEnvioEmail" no
// menu ao lado do botão "Executar" e clique em Executar). Se for a primeira vez
// que o script manda e-mail, o Apps Script deve abrir uma tela pedindo autorização
// -- é essa autorização que provavelmente está faltando.
function testarEnvioEmail() {
  MailApp.sendEmail({
    to: EMAIL_NOTIFICACAO,
    subject: 'Teste de e-mail do Apps Script',
    body: 'Se você recebeu isso, o envio de e-mail está funcionando.'
  });
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
