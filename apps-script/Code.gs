const MEMBROS_SHEET = 'Membros';       // aba privada com a lista importada do PDF (Nome completo, Sexo, Idade, Data de Nascimento, Telefone, Email)
const RESPOSTAS_SHEET = 'Sheet1';      // aba onde ficam "Nome completo" / "Número do documento ( com foto )" (a que já existe)
const RESPOSTAS_HEADER_ROW = 3;        // linha onde estão os títulos "Nome completo" | "Número do documento..."
const MAX_RESULTS = 8;
const MIN_QUERY_LEN = 3;
const EMAIL_NOTIFICACAO = 'telesthierry@gmail.com'; // recebe um e-mail a cada nova inscrição
const NUMERO_WHATSAPP = '5527996302669';
const AGENDAMENTOS_SHEET = 'Agendamentos';
const HORARIOS_ENTREVISTA = ['19:00', '19:30', '20:00', '20:30', '21:00'];

function doGet(e) {
  const action = ((e && e.parameter && e.parameter.action) || '').trim();

  if (action === 'disponibilidade') {
    const ocupados = getAgendamentos_().map(agendamento => ({
      data: agendamento.data,
      hora: agendamento.hora
    }));
    return jsonResponse({ ok: true, ocupados, horarios: HORARIOS_ENTREVISTA });
  }

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
    const rawBody = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    let body;

    try {
      body = JSON.parse(rawBody);
    } catch (err) {
      return jsonResponse({ ok: false, error: 'Corpo da requisição inválido.' });
    }

    const action = String(body.action || '').trim();
    const allowedActions = new Set(['whatsapp-duvida', 'whatsapp-entrevista', 'agendar-entrevista', 'inscricao']);

    if (!allowedActions.has(action)) {
      return jsonResponse({ ok: false, error: 'Ação não permitida.' });
    }

    if (action === 'whatsapp-duvida' || action === 'whatsapp-entrevista') {
      const mensagem = String(body.mensagem || '').trim();
      if (!mensagem) {
        return jsonResponse({ ok: false, error: 'Mensagem do WhatsApp é obrigatória.' });
      }

      const url = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensagem)}`;
      return jsonResponse({ ok: true, url });
    }

    if (action === 'cancelar-entrevista') {
      const data = String(body.data || '').trim();
      const hora = String(body.hora || '').trim();
      const motivo = String(body.motivo || '').trim();
      const mensagem = String(body.mensagem || '').trim();

      if (!data || !hora || !motivo || !mensagem) {
        return jsonResponse({ ok: false, error: 'Data, horário, justificativa e mensagem são obrigatórios.' });
      }

      const dataHoraAgendamento = new Date(`${data}T${hora}:00`);
      const diffHoras = (dataHoraAgendamento.getTime() - Date.now()) / (1000 * 60 * 60);
      if (diffHoras < 24) {
        return jsonResponse({ ok: false, error: 'O cancelamento deve ser solicitado com antecedência mínima de 24 horas.' });
      }

      const agendamentos = getAgendamentos_();
      const reservado = agendamentos.some(item => item.data === data && item.hora === hora && item.status !== 'cancelado');
      if (!reservado) {
        return jsonResponse({ ok: false, error: 'Nenhum agendamento encontrado para essa data e horário.' });
      }

      const sheet = getAgendaSheet_();
      const rows = sheet.getDataRange().getValues();
      const rowIndex = rows.findIndex(row => String(row[0] || '').trim() === data && String(row[1] || '').trim() === hora);
      if (rowIndex >= 0) {
        sheet.getRange(rowIndex + 1, 3, 1, 1).setValue('cancelado');
        sheet.getRange(rowIndex + 1, 4, 1, 1).setValue(new Date().toISOString());
      }

      const url = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensagem)}`;
      return jsonResponse({ ok: true, url, data, hora, motivo });
    }

    if (action === 'agendar-entrevista') {
      const data = String(body.data || '').trim();
      const hora = String(body.hora || '').trim();
      const mensagem = String(body.mensagem || '').trim();

      if (!data || !hora || !mensagem) {
        return jsonResponse({ ok: false, error: 'Data, horário e mensagem são obrigatórios.' });
      }

      if (!HORARIOS_ENTREVISTA.includes(hora)) {
        return jsonResponse({ ok: false, error: 'Horário selecionado é inválido.' });
      }

      const agendamentos = getAgendamentos_();
      const jaExiste = agendamentos.some(item => item.data === data && item.hora === hora);
      if (jaExiste) {
        return jsonResponse({ ok: false, error: 'Esse horário já está ocupado. Escolha outro dia ou horário.' });
      }

      const sheet = getAgendaSheet_();
      sheet.appendRow([data, hora, 'reservado', new Date().toISOString()]);

      const url = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensagem)}`;
      return jsonResponse({ ok: true, url, data, hora });
    }

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

function getAgendaSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(AGENDAMENTOS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(AGENDAMENTOS_SHEET);
  }

  const header = sheet.getRange(1, 1, 1, 4).getValues()[0];
  if (!header[0] || String(header[0]).trim() !== 'data') {
    sheet.getRange(1, 1, 1, 4).setValues([['data', 'hora', 'status', 'criadoEm']]);
  }

  return sheet;
}

function getAgendamentos_() {
  const sheet = getAgendaSheet_();
  const rows = sheet.getDataRange().getValues();
  const [header, ...dataRows] = rows;
  if (!header || !header[0] || String(header[0]).trim() !== 'data') return [];

  return dataRows
    .filter(row => row[0] && row[1])
    .map(row => ({
      data: String(row[0]).trim(),
      hora: String(row[1]).trim(),
      status: String(row[2] || '').trim(),
      criadoEm: row[3] || ''
    }));
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
