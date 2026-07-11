// Carrega os pedaços de HTML dos modais (pasta partials/) e injeta cada um
// no lugar do respectivo <div data-partial="..."></div> do index.html.
//
// Importante: isso usa fetch(), então só funciona servindo o site por
// http/https (ex: GitHub Pages, ou "Live Server" no VS Code durante o
// desenvolvimento). Abrir o index.html direto com duplo clique (file://)
// não funciona, porque o navegador bloqueia fetch() de arquivos locais.
(async function carregarPartials() {
	const placeholders = document.querySelectorAll('[data-partial]');

	await Promise.all(Array.from(placeholders).map(async (el) => {
		const resposta = await fetch(el.dataset.partial);
		el.outerHTML = await resposta.text();
	}));

	document.dispatchEvent(new Event('partials:prontos'));
})();
