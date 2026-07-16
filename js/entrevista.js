// Agendamento de entrevista de recomendação: calendário (só terça a sexta) -> horário -> confirmação -> WhatsApp
// Espera 'partials:prontos' porque o modal vem de partials/modal-entrevista.html
document.addEventListener('partials:prontos', () => {
	// Entrevistas só de terça (2) a sexta (5), sempre após as 19h
	const DIAS_PERMITIDOS = [2, 3, 4, 5];

	const modalEntrevista = document.getElementById('modalEntrevista');
	const etapaDataEntrevista = document.getElementById('etapaDataEntrevista');
	const etapaHorarioEntrevista = document.getElementById('etapaHorarioEntrevista');
	const etapaConfirmarEntrevista = document.getElementById('etapaConfirmarEntrevista');
	const etapaCancelarEntrevista = document.getElementById('etapaCancelarEntrevista');
	const erroDataEntrevista = document.getElementById('erroDataEntrevista');
	const selectHorarioEntrevista = document.getElementById('selectHorarioEntrevista');
	const previewMensagemEntrevista = document.getElementById('previewMensagemEntrevista');
	const inputDataCancelamento = document.getElementById('inputDataCancelamento');
	const selectHorarioCancelamento = document.getElementById('selectHorarioCancelamento');
	const motivoCancelamento = document.getElementById('motivoCancelamento');
	const previewMensagemCancelamento = document.getElementById('previewMensagemCancelamento');

	const calMesAno = document.getElementById('calMesAno');
	const calGrade = document.getElementById('calGrade');
	const calMesAnterior = document.getElementById('calMesAnterior');
	const calProximoMes = document.getElementById('calProximoMes');

	const ocupadosPorData = new Map();
	let dataEntrevistaSelecionada = '';
	let horarioEntrevistaSelecionado = '';
	let calAno, calMes;
	let dataSelecionadaISO = null;

	function paraISO(data) {
		const y = data.getFullYear();
		const m = String(data.getMonth() + 1).padStart(2, '0');
		const d = String(data.getDate()).padStart(2, '0');
		return `${y}-${m}-${d}`;
	}

	async function carregarDisponibilidade() {
		try {
			const response = await fetch(`${SCRIPT_URL}?action=disponibilidade`);
			const payload = await response.json();
			if (!payload.ok) {
				throw new Error(payload.error || 'Não foi possível carregar a disponibilidade.');
			}

			ocupadosPorData.clear();
			payload.ocupados.forEach(({ data, hora }) => {
				const dataKey = String(data).trim();
				if (!ocupadosPorData.has(dataKey)) {
					ocupadosPorData.set(dataKey, new Set());
				}
				ocupadosPorData.get(dataKey).add(String(hora).trim());
			});
		} catch (error) {
			console.error('Erro ao carregar disponibilidade:', error);
			window.alert('Não foi possível carregar os horários disponíveis no momento. Tente novamente mais tarde.');
		}
	}

	function horariosDisponiveisParaData(dataISO) {
		const ocupados = ocupadosPorData.get(dataISO) || new Set();
		return ['19:00', '19:30', '20:00', '20:30', '21:00'].filter(hora => !ocupados.has(hora));
	}

	function dataTemDisponibilidade(dataISO) {
		const disponiveis = horariosDisponiveisParaData(dataISO);
		return disponiveis.length > 0;
	}

	function renderHorariosDisponiveis() {
		selectHorarioEntrevista.innerHTML = '';
		const disponiveis = horariosDisponiveisParaData(dataSelecionadaISO);

		if (disponiveis.length === 0) {
			const option = document.createElement('option');
			option.value = '';
			option.textContent = 'Nenhum horário disponível';
			option.disabled = true;
			option.selected = true;
			selectHorarioEntrevista.appendChild(option);
			selectHorarioEntrevista.disabled = true;
			return;
		}

		disponiveis.forEach(hora => {
			const option = document.createElement('option');
			option.value = hora;
			option.textContent = hora;
			selectHorarioEntrevista.appendChild(option);
		});
		selectHorarioEntrevista.disabled = false;
	}

	function iniciarCalendario() {
		const hoje = new Date();
		calAno = hoje.getFullYear();
		calMes = hoje.getMonth();
		dataSelecionadaISO = null;
		dataEntrevistaSelecionada = '';
		renderCalendario();
	}

	function renderCalendario() {
		const hoje = new Date();
		hoje.setHours(0, 0, 0, 0);

		const primeiroDia = new Date(calAno, calMes, 1);
		const nomeMes = primeiroDia.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
		calMesAno.textContent = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);
		calMesAnterior.disabled = calAno === hoje.getFullYear() && calMes === hoje.getMonth();

		const diaSemanaInicio = primeiroDia.getDay();
		const diasNoMes = new Date(calAno, calMes + 1, 0).getDate();

		calGrade.innerHTML = '';
		for (let i = 0; i < diaSemanaInicio; i++) {
			const vazio = document.createElement('span');
			vazio.className = 'cal-dia cal-vazio';
			calGrade.appendChild(vazio);
		}

		for (let dia = 1; dia <= diasNoMes; dia++) {
			const data = new Date(calAno, calMes, dia);
			const iso = paraISO(data);
			const btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'cal-dia';
			btn.textContent = dia;

			const passado = data < hoje;
			const diaPermitido = DIAS_PERMITIDOS.includes(data.getDay());

			if (passado || !diaPermitido || !dataTemDisponibilidade(iso)) {
				btn.classList.add('cal-dia-desabilitado');
				btn.disabled = true;
			} else {
				btn.addEventListener('click', () => {
					dataSelecionadaISO = iso;
					dataEntrevistaSelecionada = data.toLocaleDateString('pt-BR', {
						weekday: 'long',
						day: '2-digit',
						month: '2-digit',
						year: 'numeric'
					});
					erroDataEntrevista.hidden = true;
					renderCalendario();
				});
			}

			if (iso === paraISO(hoje)) btn.classList.add('cal-dia-hoje');
			if (iso === dataSelecionadaISO) btn.classList.add('cal-dia-selecionado');

			calGrade.appendChild(btn);
		}
	}

	calMesAnterior?.addEventListener('click', () => {
		const hoje = new Date();
		if (calAno === hoje.getFullYear() && calMes === hoje.getMonth()) return;
		calMes--;
		if (calMes < 0) { calMes = 11; calAno--; }
		renderCalendario();
	});

	calProximoMes?.addEventListener('click', () => {
		calMes++;
		if (calMes > 11) { calMes = 0; calAno++; }
		renderCalendario();
	});

	async function abrirModalEntrevista() {
		await carregarDisponibilidade();
		etapaDataEntrevista.hidden = false;
		etapaHorarioEntrevista.hidden = true;
		etapaConfirmarEntrevista.hidden = true;
		erroDataEntrevista.hidden = true;
		selectHorarioEntrevista.selectedIndex = 0;
		iniciarCalendario();
		modalEntrevista.hidden = false;
	}

	function fecharModalEntrevista() {
		modalEntrevista.hidden = true;
	}

	document.getElementById('btnAgendarEntrevista')?.addEventListener('click', abrirModalEntrevista);
	document.getElementById('btnCancelarEntrevista')?.addEventListener('click', () => {
		etapaDataEntrevista.hidden = true;
		etapaHorarioEntrevista.hidden = true;
		etapaConfirmarEntrevista.hidden = true;
		etapaCancelarEntrevista.hidden = false;
		inputDataCancelamento.value = '';
		selectHorarioCancelamento.selectedIndex = 0;
		motivoCancelamento.value = '';
		previewMensagemCancelamento.textContent = '';
		modalEntrevista.hidden = false;
	});
	document.getElementById('btnFecharModalEntrevistaX')?.addEventListener('click', fecharModalEntrevista);

	document.getElementById('btnProximoData')?.addEventListener('click', () => {
		if (!dataSelecionadaISO) {
			erroDataEntrevista.hidden = false;
			erroDataEntrevista.textContent = 'Escolha uma data no calendário.';
			return;
		}

		if (!dataTemDisponibilidade(dataSelecionadaISO)) {
			erroDataEntrevista.hidden = false;
			erroDataEntrevista.textContent = 'Esse dia já está totalmente ocupado. Escolha outro.';
			return;
		}

		renderHorariosDisponiveis();
		etapaDataEntrevista.hidden = true;
		etapaHorarioEntrevista.hidden = false;
	});

	document.getElementById('btnProximoHorario')?.addEventListener('click', () => {
		horarioEntrevistaSelecionado = selectHorarioEntrevista.value;
		previewMensagemEntrevista.textContent =
			`"Olá, tudo bem? Pode marcar minha entrevista de renovação de recomendação para o dia ${dataEntrevistaSelecionada} às ${horarioEntrevistaSelecionado}?"`;

		etapaHorarioEntrevista.hidden = true;
		etapaConfirmarEntrevista.hidden = false;
	});

	document.getElementById('btnEnviarEntrevistaWhatsapp')?.addEventListener('click', async () => {
		const mensagem = `Olá, tudo bem? Pode marcar minha entrevista de renovação de recomendação para o dia ${dataEntrevistaSelecionada} às ${horarioEntrevistaSelecionado}?`;
		try {
			const response = await fetch(SCRIPT_URL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'agendar-entrevista',
					data: dataSelecionadaISO,
					hora: horarioEntrevistaSelecionado,
					mensagem
				})
			});
			const payload = await response.json();
			if (!payload.ok || !payload.url) {
				throw new Error(payload.error || 'Não foi possível abrir o WhatsApp.');
			}
			window.open(payload.url, '_blank', 'noopener');
			await carregarDisponibilidade();
		} catch (error) {
			console.error('Erro ao agendar entrevista:', error);
			window.alert(error.message || 'Não foi possível concluir o agendamento agora. Tente novamente em instantes.');
		} finally {
			fecharModalEntrevista();
		}
	});

	document.getElementById('btnConfirmarCancelamento')?.addEventListener('click', async () => {
		const dataCancelamento = inputDataCancelamento.value;
		const horaCancelamento = selectHorarioCancelamento.value;
		const motivo = motivoCancelamento.value.trim();
		if (!dataCancelamento || !horaCancelamento || !motivo) {
			window.alert('Informe a data, o horário e a justificativa para o cancelamento.');
			return;
		}

		const mensagem = `Olá, tudo bem? Gostaria de cancelar a minha entrevista de renovação de recomendação marcada para o dia ${dataCancelamento} às ${horaCancelamento}. Justificativa: ${motivo}`;
		previewMensagemCancelamento.textContent = `"${mensagem}"`;

		try {
			const response = await fetch(SCRIPT_URL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'cancelar-entrevista',
					data: dataCancelamento,
					hora: horaCancelamento,
					motivo,
					mensagem
				})
			});
			const payload = await response.json();
			if (!payload.ok || !payload.url) {
				throw new Error(payload.error || 'Não foi possível abrir o WhatsApp para cancelamento.');
			}
			window.open(payload.url, '_blank', 'noopener');
			await carregarDisponibilidade();
		} catch (error) {
			console.error('Erro ao cancelar entrevista:', error);
			window.alert(error.message || 'Não foi possível cancelar o agendamento agora.');
		} finally {
			fecharModalEntrevista();
		}
	});
});
