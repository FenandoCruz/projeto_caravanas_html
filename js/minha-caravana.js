// Calcula o status de cada data (Disponível/Encerrada) comparando com a data de
// hoje, em vez de deixar fixo no HTML -- assim nunca fica "Disponível" pra uma
// data que já passou. Quando a planilha de vagas for integrada, o "Em breve"
// entra aqui também (baseado na contagem de vagas, não só na data).
document.querySelectorAll('.schedule-badge[data-fim]').forEach(badge => {
	const hoje = new Date();
	hoje.setHours(0, 0, 0, 0);
	const fim = new Date(badge.dataset.fim + 'T00:00:00');

	if (fim < hoje) {
		badge.textContent = 'Encerrada';
		badge.className = 'schedule-badge encerrada';
	} else {
		badge.textContent = 'Disponível';
		badge.className = 'schedule-badge disponivel';
	}
});
