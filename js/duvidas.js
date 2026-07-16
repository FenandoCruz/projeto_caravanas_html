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

	document.querySelectorAll('.lista-assuntos li').forEach(li => {
		li.addEventListener('click', () => {
			assuntoSelecionado = li.dataset.assunto;
			previewMensagemDuvida.textContent = `"Olá, tenho dúvidas sobre ${assuntoSelecionado} - pode me ajudar com isso?"`;
			etapaAssunto.hidden = true;
			etapaConfirmarDuvida.hidden = false;
		});
	});

	document.getElementById('btnEnviarDuvidaWhatsapp')?.addEventListener('click', async () => {
		const mensagem = `Olá, tenho dúvidas sobre ${assuntoSelecionado} - pode me ajudar com isso?`;
		try {
			const response = await fetch(SCRIPT_URL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'whatsapp-duvida', mensagem })
			});
			const payload = await response.json();
			if (!payload.ok || !payload.url) {
				throw new Error(payload.error || 'Não foi possível abrir o WhatsApp.');
			}
			window.open(payload.url, '_blank', 'noopener');
		} catch (error) {
			console.error('Erro ao abrir WhatsApp:', error);
			window.alert('Não foi possível abrir o WhatsApp agora. Tente novamente em instantes.');
		} finally {
			fecharModalDuvidas();
		}
	});
});
