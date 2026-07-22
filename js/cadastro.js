// Envio do formulário de cadastro. Os campos "required" já bloqueiam o
// envio se algo estiver vazio; só falta mandar pra tela de login depois.
const formCadastro = document.getElementById('formCadastro');

formCadastro?.addEventListener('submit', (evento) => {
	evento.preventDefault();
	window.location.href = 'login.html';
});
