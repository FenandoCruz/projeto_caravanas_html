# projeto_caravanas

Site para divulgação e inscrição de caravanas SUD até templos do Brasil.

## Objetivo

Apresentar a página inicial com requisitos, custos, reservas de ordenanças e perguntas frequentes, e permitir que os membros:

- confirmem presença na caravana buscando o próprio nome numa lista privada (sem precisar criar conta),
- agendem entrevista de renovação de recomendação com controle de disponibilidade,
- cancelem entrevistas com justificativa e antecedência mínima de 24 horas,
- tirem dúvidas direto pelo WhatsApp do líder, sem expor o número em código do frontend.

Também existem páginas iniciais de cadastro/login/"minha caravana" (`cadastro.html`, `login.html`, `minha_caravana.html`), ainda só como protótipo visual, sem backend próprio.

## Funcionalidades principais

- Página principal (`index.html`) com:
  - requisitos, custos, reservas de ordenanças, horários e perguntas frequentes
  - **"Fazer minha inscrição"**: busca por nome (contra uma lista privada), confirmação em modal, e envio do número do documento
  - **"Agendar minha entrevista"**: calendário próprio (só permite terça a sexta), seleção de horários disponíveis, prevenção de sobreposição e envio seguro para WhatsApp
  - **"Cancelar meu agendamento"**: fluxo com justificativa obrigatória e regra de antecedência de 24 horas
  - botões flutuantes organizados em um único menu principal, com identidade visual alinhada à paleta da página
  - botão flutuante de WhatsApp com modal de "sobre o que você tem dúvida"
  - vídeo de apresentação num modal dedicado
  - menu flutuante (canto inferior esquerdo) para as páginas de cadastro/login/minha caravana
- `cadastro.html`, `login.html`, `minha_caravana.html` — protótipo visual (formulários sem função ainda)

## Backend (Google Apps Script + Google Sheets)

A busca de nomes, o envio da inscrição, a disponibilidade de horários e o cancelamento de entrevistas **não usam nenhum arquivo local** — os dados ficam numa planilha privada do Google Sheets, acessada através de um Google Apps Script publicado como Web App:

- `apps-script/Code.gs` — código do Apps Script (busca por nome, grava inscrição, evita duplicidade, valida disponibilidade, gerencia agendamentos e envia a mensagem de WhatsApp pela rota segura do backend)
- `Agendamentos` — aba usada para controlar os horários ocupados e validar conflitos
- A URL do Apps Script publicado fica em `js/config.js` (`SCRIPT_URL`)

Veja os comentários em `apps-script/Code.gs` para os nomes de aba esperados na planilha (`Membros` para a lista de busca, e a aba de respostas configurada em `RESPOSTAS_SHEET`).

## Estrutura de arquivos

- `index.html` — página principal
- `cadastro.html`, `login.html`, `minha_caravana.html` — páginas de protótipo
- `css/` — estilos separados por responsabilidade (`base.css`, `nav.css`, `modais.css`, `calendario.css`, `video.css`, `responsivo.css`)
- `js/` — scripts separados por funcionalidade (`config.js`, `partials.js`, `video.js`, `inscricao.js`, `duvidas.js`, `entrevista.js`)
- `partials/` — pedaços de HTML dos modais, carregados em tempo de execução por `js/partials.js`
- `apps-script/Code.gs` — backend (Google Apps Script)
- `img/` — imagens do site
- `videos/` — vídeo de apresentação

## Como usar (importante: precisa de um servidor local)

Os modais são carregados via `fetch()` (arquivos em `partials/`), então **abrir o `index.html` com duplo clique não funciona** — o navegador bloqueia esse tipo de carregamento em arquivos locais (`file://`).

1. Sirva a pasta do projeto com um servidor local, por exemplo a extensão **Live Server** do VS Code (botão direito no `index.html` → "Open with Live Server"), ou `npx serve`.
2. Abra o endereço local gerado (ex: `http://127.0.0.1:5500`).
3. Para testar a busca/inscrição e o agendamento de verdade, o `SCRIPT_URL` em `js/config.js` precisa apontar pra um Apps Script publicado (veja a seção Backend acima).
4. A geração do link de WhatsApp é feita pelo backend para evitar expor o número diretamente no cliente.

## Como contribuir

- Crie uma nova branch para sua mudança: `git checkout -b minha-melhorias`.
- Teste localmente com um servidor (veja acima) antes de abrir PR.
- Faça commit das alterações com mensagens claras.
- Envie o branch para o repositório remoto e abra um pull request.
