// URL do Google Apps Script publicado (Extensões > Apps Script > Implantar > Nova implantação > App da Web)
const SCRIPT_URL = 'COLE_AQUI_A_URL_DO_APPS_SCRIPT_DEPOIS_DE_PUBLICAR';

// Exibe um alerta quando o vídeo terminar
const video = document.getElementById('videoCaravanas');
if (video) {
	video.addEventListener('ended', () => {
		alert('O vídeo terminou!');
	});
}

// ---- Inscrição na caravana: botão abre modal -> busca por nome -> confirmação -> documento ----
const btnAbrirInscricao = document.getElementById('btnAbrirInscricao');
const inputNome = document.getElementById('inputNome');
const listaResultados = document.getElementById('listaResultados');
const buscaMensagem = document.getElementById('buscaMensagem');

const modal = document.getElementById('modalConfirmacao');
const etapaBusca = document.getElementById('etapaBusca');
const etapaConfirmar = document.getElementById('etapaConfirmar');
const etapaDocumento = document.getElementById('etapaDocumento');
const etapaSucesso = document.getElementById('etapaSucesso');
const modalNome = document.getElementById('modalNome');
const modalNascimento = document.getElementById('modalNascimento');
const inputDocumento = document.getElementById('inputDocumento');
const modalErro = document.getElementById('modalErro');

let pessoaSelecionada = null;
let debounceTimer = null;

function mostrarEtapaBusca() {
	pessoaSelecionada = null;
	etapaBusca.hidden = false;
	etapaConfirmar.hidden = true;
	etapaDocumento.hidden = true;
	etapaSucesso.hidden = true;
	modalErro.hidden = true;
	inputNome.value = '';
	inputDocumento.value = '';
	listaResultados.hidden = true;
	listaResultados.innerHTML = '';
	buscaMensagem.hidden = true;
}

btnAbrirInscricao?.addEventListener('click', () => {
	mostrarEtapaBusca();
	modal.hidden = false;
	inputNome.focus();
});

if (inputNome) {
	inputNome.addEventListener('input', () => {
		clearTimeout(debounceTimer);
		const termo = inputNome.value.trim();

		if (termo.length < 3) {
			listaResultados.hidden = true;
			listaResultados.innerHTML = '';
			buscaMensagem.hidden = true;
			return;
		}

		debounceTimer = setTimeout(() => buscarNome(termo), 350);
	});
}

async function buscarNome(termo) {
	if (SCRIPT_URL.includes('COLE_AQUI')) {
		buscaMensagem.hidden = false;
		buscaMensagem.textContent = 'A busca ainda não foi configurada (URL do Apps Script pendente).';
		return;
	}

	try {
		const resp = await fetch(`${SCRIPT_URL}?nome=${encodeURIComponent(termo)}`);
		const data = await resp.json();
		renderResultados(data.results || []);
	} catch (err) {
		buscaMensagem.hidden = false;
		buscaMensagem.textContent = 'Não foi possível buscar agora. Tente novamente em instantes.';
	}
}

function renderResultados(results) {
	listaResultados.innerHTML = '';

	if (results.length === 0) {
		buscaMensagem.hidden = false;
		buscaMensagem.textContent = 'Nenhum nome encontrado. Confira a digitação ou fale com seu líder.';
		listaResultados.hidden = true;
		return;
	}

	buscaMensagem.hidden = true;
	results.forEach(pessoa => {
		const li = document.createElement('li');
		li.textContent = pessoa.nome;
		li.addEventListener('click', () => abrirConfirmacao(pessoa));
		listaResultados.appendChild(li);
	});
	listaResultados.hidden = false;
}

function abrirConfirmacao(pessoa) {
	pessoaSelecionada = pessoa;
	modalNome.textContent = pessoa.nome;
	modalNascimento.textContent = pessoa.dataNascimento ? `Nascimento: ${pessoa.dataNascimento}` : '';

	etapaBusca.hidden = true;
	etapaConfirmar.hidden = false;
	etapaDocumento.hidden = true;
	etapaSucesso.hidden = true;
	modalErro.hidden = true;
	inputDocumento.value = '';
}

function fecharModal() {
	modal.hidden = true;
	pessoaSelecionada = null;
}

document.getElementById('btnFecharModalX')?.addEventListener('click', fecharModal);
document.getElementById('btnFecharModal')?.addEventListener('click', fecharModal);
// "Não sou eu" volta para a busca em vez de fechar o modal inteiro
document.getElementById('btnConfirmarNao')?.addEventListener('click', mostrarEtapaBusca);

document.getElementById('btnConfirmarSim')?.addEventListener('click', () => {
	etapaConfirmar.hidden = true;
	etapaDocumento.hidden = false;
});

document.getElementById('btnEnviarInscricao')?.addEventListener('click', async () => {
	const documento = inputDocumento.value.trim();
	modalErro.hidden = true;

	if (!documento) {
		modalErro.hidden = false;
		modalErro.textContent = 'Informe o número do documento (com foto).';
		return;
	}

	try {
		const resp = await fetch(SCRIPT_URL, {
			method: 'POST',
			// text/plain evita o preflight de CORS (o Apps Script não responde a OPTIONS)
			headers: { 'Content-Type': 'text/plain;charset=utf-8' },
			body: JSON.stringify({ nome: pessoaSelecionada.nome, documento })
		});
		const data = await resp.json();

		if (!data.ok) {
			modalErro.hidden = false;
			modalErro.textContent = data.error || 'Não foi possível confirmar a inscrição.';
			return;
		}

		etapaDocumento.hidden = true;
		etapaSucesso.hidden = false;
		inputNome.value = '';
	} catch (err) {
		modalErro.hidden = false;
		modalErro.textContent = 'Erro de conexão. Tente novamente.';
	}
});

// ---- Modal de dúvidas: escolher assunto -> confirmar -> abrir WhatsApp com mensagem pronta ----
const NUMERO_WHATSAPP = '5527988571560';
const modalDuvidas = document.getElementById('modalDuvidas');
const etapaAssunto = document.getElementById('etapaAssunto');
const etapaConfirmarDuvida = document.getElementById('etapaConfirmarDuvida');
const previewMensagemDuvida = document.getElementById('previewMensagemDuvida');

let assuntoSelecionado = '';

function abrirModalDuvidas(e) {
	e?.preventDefault();
	assuntoSelecionado = '';
	etapaAssunto.hidden = false;
	etapaConfirmarDuvida.hidden = true;
	modalDuvidas.hidden = false;
}

function fecharModalDuvidas() {
	modalDuvidas.hidden = true;
}

document.getElementById('btnWhatsappFlutuante')?.addEventListener('click', abrirModalDuvidas);
document.getElementById('linkDuvidasWhatsapp')?.addEventListener('click', abrirModalDuvidas);
document.getElementById('btnFecharModalDuvidasX')?.addEventListener('click', fecharModalDuvidas);

document.getElementById('btnVoltarAssunto')?.addEventListener('click', () => {
	etapaAssunto.hidden = false;
	etapaConfirmarDuvida.hidden = true;
});

document.querySelectorAll('.lista-assuntos li').forEach(li => {
	li.addEventListener('click', () => {
		assuntoSelecionado = li.dataset.assunto;
		previewMensagemDuvida.textContent = `"Olá, tenho dúvidas sobre ${assuntoSelecionado} - pode me ajudar com isso?"`;
		etapaAssunto.hidden = true;
		etapaConfirmarDuvida.hidden = false;
	});
});

document.getElementById('btnEnviarDuvidaWhatsapp')?.addEventListener('click', () => {
	const mensagem = `Olá, tenho dúvidas sobre ${assuntoSelecionado} - pode me ajudar com isso?`;
	const url = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensagem)}`;
	window.open(url, '_blank');
	fecharModalDuvidas();
});
