// Agendamento de entrevista de recomendação: calendário (só terça a sexta) -> horário -> confirmação -> WhatsApp
// Espera 'partials:prontos' porque o modal vem de partials/modal-entrevista.html
document.addEventListener('partials:prontos', () => {
	// Entrevistas só de terça (2) a sexta (5), sempre após as 19h
	const DIAS_PERMITIDOS = [2, 3, 4, 5];

	const modalEntrevista = document.getElementById('modalEntrevista');
	const etapaDataEntrevista = document.getElementById('etapaDataEntrevista');
	const etapaHorarioEntrevista = document.getElementById('etapaHorarioEntrevista');
	const etapaConfirmarEntrevista = document.getElementById('etapaConfirmarEntrevista');
	const btnProximoData = document.getElementById('btnProximoData');
	const selectHorarioEntrevista = document.getElementById('selectHorarioEntrevista');
	const previewMensagemEntrevista = document.getElementById('previewMensagemEntrevista');

	const calMesAno = document.getElementById('calMesAno');
	const calGrade = document.getElementById('calGrade');
	const calMesAnterior = document.getElementById('calMesAnterior');
	const calProximoMes = document.getElementById('calProximoMes');

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

			if (passado || !diaPermitido) {
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
					btnProximoData.disabled = false;
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

	function abrirModalEntrevista() {
		etapaDataEntrevista.hidden = false;
		etapaHorarioEntrevista.hidden = true;
		etapaConfirmarEntrevista.hidden = true;
		btnProximoData.disabled = true;
		selectHorarioEntrevista.selectedIndex = 0;
		iniciarCalendario();
		modalEntrevista.hidden = false;
	}

	function fecharModalEntrevista() {
		modalEntrevista.hidden = true;
	}

	document.getElementById('btnAgendarEntrevista')?.addEventListener('click', abrirModalEntrevista);
	document.getElementById('btnFecharModalEntrevistaX')?.addEventListener('click', fecharModalEntrevista);

	btnProximoData?.addEventListener('click', () => {
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

	document.getElementById('btnEnviarEntrevistaWhatsapp')?.addEventListener('click', () => {
		const mensagem = `Olá, tudo bem? Pode marcar minha entrevista de renovação de recomendação para o dia ${dataEntrevistaSelecionada} às ${horarioEntrevistaSelecionado}?`;
		const url = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensagem)}`;
		window.open(url, '_blank');
		fecharModalEntrevista();
	});
});
