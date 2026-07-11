// Inscrição na caravana: botão abre modal -> busca por nome -> confirmação -> documento
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
	const etapaSucesso = document.getElementById('etapaSucesso');
	const modalNome = document.getElementById('modalNome');
	const modalNascimento = document.getElementById('modalNascimento');
	const modalIdade = document.getElementById('modalIdade');
	const modalTelefone = document.getElementById('modalTelefone');
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
});
