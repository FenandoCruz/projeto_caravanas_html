// Menu flutuante (FAB): alterna entre bolinha fechada e lista de links.
// Não é um partial, então não precisa esperar 'partials:prontos'.
const fabToggle = document.getElementById('fabToggle');
const fabLinks = document.getElementById('fabLinks');

fabToggle?.addEventListener('click', () => {
	const abrir = fabLinks.hidden;
	fabLinks.hidden = !abrir;
	fabToggle.setAttribute('aria-expanded', String(abrir));
});
