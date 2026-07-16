// Modal de dúvidas: escolher assunto -> confirmar -> abrir WhatsApp com mensagem pronta
// Espera 'partials:prontos' porque o modal vem de partials/modal-duvidas.html
document.addEventListener('partials:prontos', () => {
	const modalDuvidas = document.getElementById('modalDuvidas');
	const etapaAssunto = document.getElementById('etapaAssunto');
	const etapaConfirmarDuvida = document.getElementById('etapaConfirmarDuvida');
	const previewMensagemDuvida = document.getElementById('previewMensagemDuvida');

	let assuntoSelecionado = '';

	function abrirModalDuvidas(e) {
		e?.preventDefault();
		assuntoSelecionado = '';
		document.querySelectorAll('.assunto-btn').forEach(b => b.classList.remove('selecionado'));
		etapaAssunto.hidden = false;
		etapaConfirmarDuvida.hidden = true;
		modalDuvidas.hidden = false;
	}

	function fecharModalDuvidas() {
		modalDuvidas.hidden = true;
	}

	document.getElementById('linkDuvidasWhatsapp')?.addEventListener('click', abrirModalDuvidas);
	document.getElementById('btnFecharModalDuvidasX')?.addEventListener('click', fecharModalDuvidas);

	document.getElementById('btnVoltarAssunto')?.addEventListener('click', () => {
		etapaAssunto.hidden = false;
		etapaConfirmarDuvida.hidden = true;
	});

	document.querySelectorAll('.assunto-btn').forEach(btn => {
		btn.addEventListener('click', () => {
			assuntoSelecionado = btn.dataset.assunto;
			document.querySelectorAll('.assunto-btn').forEach(b => b.classList.toggle('selecionado', b === btn));
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
});
