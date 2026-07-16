// Envio do formulário de login. Sem backend de autenticação ainda: só
// guarda o e-mail (pra podermos reaproveitar depois) e marca como logado.
const formLogin = document.getElementById('formLogin');

formLogin?.addEventListener('submit', (evento) => {
	evento.preventDefault();
	const email = document.getElementById('inputLoginEmail').value;
	localStorage.setItem('caravanasLogado', 'true');
	localStorage.setItem('caravanasEmail', email);
	window.location.href = 'index.html';
});
