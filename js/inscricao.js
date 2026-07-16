// Inscrição na caravana: botão abre modal -> busca por nome -> confirmação -> documento -> data -> revisão
// Espera 'partials:prontos' porque o modal vem de partials/modal-inscricao.html
document.addEventListener('partials:prontos', () => {
	const btnAbrirInscricao = document.getElementById('btnAbrirInscricao');
	const inputNome = document.getElementById('inputNome');
	const listaResultados = document.getElementById('listaResultados');
	const buscaMensagem = document.getElementById('buscaMensagem');

	const modal = document.getElementById('modalConfirmacao');
	const etapaBusca = document.getElementById('etapaBusca');
	const etapaConfirmar = document.getElementById('etapaConfirmar');
	const etapaDocumento = document.getElementById('etapaDocumento');
	const etapaData = document.getElementById('etapaData');
	const etapaRevisao = document.getElementById('etapaRevisao');
	const etapaSucesso = document.getElementById('etapaSucesso');
	const modalNome = document.getElementById('modalNome');
	const modalNascimento = document.getElementById('modalNascimento');
	const modalIdade = document.getElementById('modalIdade');
	const modalTelefone = document.getElementById('modalTelefone');
	const inputDocumento = document.getElementById('inputDocumento');
	const modalErro = document.getElementById('modalErro');
	const btnContinuarDocumento = document.getElementById('btnContinuarDocumento');
	const listaDatas = document.getElementById('listaDatas');
	const datasMensagem = document.getElementById('datasMensagem');
	const revisaoNome = document.getElementById('revisaoNome');
	const revisaoData = document.getElementById('revisaoData');
	const inputDocumentoRevisao = document.getElementById('inputDocumentoRevisao');
	const btnTrocarData = document.getElementById('btnTrocarData');
	const btnConfirmarInscricao = document.getElementById('btnConfirmarInscricao');
	const modalErroRevisao = document.getElementById('modalErroRevisao');

	let pessoaSelecionada = null;
	let dataSelecionada = null;
	let debounceTimer = null;

	function esconderTodasEtapas() {
		etapaBusca.hidden = true;
		etapaConfirmar.hidden = true;
		etapaDocumento.hidden = true;
		etapaData.hidden = true;
		etapaRevisao.hidden = true;
		etapaSucesso.hidden = true;
	}

	function mostrarEtapaBusca() {
		pessoaSelecionada = null;
		dataSelecionada = null;
		esconderTodasEtapas();
		etapaBusca.hidden = false;
		modalErro.hidden = true;
		inputNome.value = '';
		inputDocumento.value = '';
		btnContinuarDocumento.disabled = true;
		listaResultados.hidden = true;
		listaResultados.innerHTML = '';
		buscaMensagem.hidden = true;
	}

	btnAbrirInscricao?.addEventListener('click', () => {
		mostrarEtapaBusca();
		modal.hidden = false;
		inputNome.focus();
	});

	// Máscara do documento: só números, até 11 dígitos (tamanho do registro da CNH,
	// o maior entre os documentos aceitos; RG e outros cabem dentro desse limite)
	inputDocumento?.addEventListener('input', () => {
		inputDocumento.value = inputDocumento.value.replace(/\D/g, '').slice(0, 11);
		btnContinuarDocumento.disabled = !inputDocumento.value;
	});

	inputDocumentoRevisao?.addEventListener('input', () => {
		inputDocumentoRevisao.value = inputDocumentoRevisao.value.replace(/\D/g, '').slice(0, 11);
		btnConfirmarInscricao.disabled = !inputDocumentoRevisao.value;
	});

	inputNome?.addEventListener('input', () => {
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

			const avatar = document.createElement('span');
			avatar.className = 'resultado-avatar';
			avatar.textContent = pessoa.nome.trim().charAt(0).toUpperCase();

			const nome = document.createElement('span');
			nome.textContent = pessoa.nome;

			li.appendChild(avatar);
			li.appendChild(nome);
			li.addEventListener('click', () => abrirConfirmacao(pessoa));
			listaResultados.appendChild(li);
		});
		listaResultados.hidden = false;
	}

	function preencherInfo_(elemento, rotulo, valor) {
		if (valor) {
			elemento.hidden = false;
			elemento.textContent = `${rotulo}: ${valor}`;
		} else {
			elemento.hidden = true;
		}
	}

	function abrirConfirmacao(pessoa) {
		pessoaSelecionada = pessoa;
		modalNome.textContent = pessoa.nome;
		preencherInfo_(modalNascimento, 'Nascimento', pessoa.dataNascimento);
		preencherInfo_(modalIdade, 'Idade', pessoa.idade ? `${pessoa.idade} anos` : '');
		preencherInfo_(modalTelefone, 'Telefone', pessoa.telefone);

		esconderTodasEtapas();
		etapaConfirmar.hidden = false;
		modalErro.hidden = true;
		inputDocumento.value = '';
		btnContinuarDocumento.disabled = true;
	}

	function fecharModal() {
		modal.hidden = true;
		pessoaSelecionada = null;
		dataSelecionada = null;
	}

	document.getElementById('btnFecharModalX')?.addEventListener('click', fecharModal);
	document.getElementById('btnFecharModal')?.addEventListener('click', fecharModal);
	// "Não sou eu" volta para a busca em vez de fechar o modal inteiro
	document.getElementById('btnConfirmarNao')?.addEventListener('click', mostrarEtapaBusca);

	document.getElementById('btnConfirmarSim')?.addEventListener('click', () => {
		esconderTodasEtapas();
		etapaDocumento.hidden = false;
	});

	async function buscarDatas() {
		listaDatas.innerHTML = '';
		datasMensagem.hidden = true;

		try {
			const resp = await fetch(`${SCRIPT_URL}?action=datas`);
			const data = await resp.json();
			renderDatas(data.datas || []);
		} catch (err) {
			datasMensagem.hidden = false;
			datasMensagem.textContent = 'Não foi possível buscar as datas agora. Tente novamente em instantes.';
		}
	}

	function renderDatas(datas) {
		listaDatas.innerHTML = '';

		if (datas.length === 0) {
			datasMensagem.hidden = false;
			datasMensagem.textContent = 'Nenhuma data disponível no momento. Fale com seu líder.';
			return;
		}

		datasMensagem.hidden = true;
		datas.forEach(data => {
			const botao = document.createElement('button');
			botao.type = 'button';
			botao.className = 'assunto-btn';
			botao.textContent = data;
			botao.addEventListener('click', () => selecionarData(data));
			listaDatas.appendChild(botao);
		});
	}

	function selecionarData(data) {
		dataSelecionada = data;
		revisaoNome.textContent = pessoaSelecionada.nome;
		revisaoData.textContent = `Data: ${data}`;
		inputDocumentoRevisao.value = inputDocumento.value;
		btnConfirmarInscricao.disabled = !inputDocumentoRevisao.value;
		modalErroRevisao.hidden = true;

		esconderTodasEtapas();
		etapaRevisao.hidden = false;
	}

	btnContinuarDocumento?.addEventListener('click', async () => {
		modalErro.hidden = true;
		esconderTodasEtapas();
		etapaData.hidden = false;
		await buscarDatas();
	});

	btnTrocarData?.addEventListener('click', () => {
		esconderTodasEtapas();
		etapaData.hidden = false;
	});

	btnConfirmarInscricao?.addEventListener('click', async () => {
		const documento = inputDocumentoRevisao.value.trim();
		modalErroRevisao.hidden = true;

		try {
			const resp = await fetch(SCRIPT_URL, {
				method: 'POST',
				// text/plain evita o preflight de CORS (o Apps Script não responde a OPTIONS)
				headers: { 'Content-Type': 'text/plain;charset=utf-8' },
				body: JSON.stringify({ nome: pessoaSelecionada.nome, documento, data: dataSelecionada })
			});
			const data = await resp.json();

			if (!data.ok) {
				modalErroRevisao.hidden = false;
				modalErroRevisao.textContent = data.error || 'Não foi possível confirmar a inscrição.';
				return;
			}

			esconderTodasEtapas();
			etapaSucesso.hidden = false;
			inputNome.value = '';
		} catch (err) {
			modalErroRevisao.hidden = false;
			modalErroRevisao.textContent = 'Erro de conexão. Tente novamente.';
		}
	});
});
