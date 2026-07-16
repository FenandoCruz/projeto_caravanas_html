// Login básico (sem backend real): guarda se a pessoa já entrou no
// localStorage e ajusta o menu de acordo. Enquanto não loga, só o botão
// "Login" aparece; depois de logar, só "Minha caravana" aparece.
const CHAVE_LOGADO = 'caravanasLogado';

function estaLogado() {
	return localStorage.getItem(CHAVE_LOGADO) === 'true';
}

function atualizarMenuAuth() {
	const logado = estaLogado();
	document.querySelectorAll('a[href="login.html"]').forEach(link => {
		link.hidden = logado;
	});
	document.querySelectorAll('a[href="minha_caravana.html"]').forEach(link => {
		link.hidden = !logado;
	});
}

atualizarMenuAuth();

// Só login.html e cadastro.html são públicas; o resto da aplicação (incluindo
// a raiz "/") exige login -- a aplicação sempre começa no login.
const PAGINAS_PUBLICAS = ['login.html', 'cadastro.html'];
const paginaAtual = location.pathname.split('/').pop();

if (!estaLogado() && !PAGINAS_PUBLICAS.includes(paginaAtual)) {
	location.href = 'login.html';
}
