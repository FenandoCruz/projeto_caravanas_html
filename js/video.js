// Vídeo: abre num modal exclusivo, toca automaticamente ao abrir e pausa ao fechar
// Espera 'partials:prontos' porque o modal vem de partials/modal-video.html
document.addEventListener('partials:prontos', () => {
	const modalVideo = document.getElementById('modalVideo');
	const video = document.getElementById('videoCaravanas');
	const btnAbrirVideo = document.getElementById('btnAbrirVideo');

	function abrirModalVideo() {
		modalVideo.hidden = false;
		if (video) {
			video.currentTime = 0;
			video.play().catch(() => {});
		}
	}

	function fecharModalVideo() {
		modalVideo.hidden = true;
		if (video) {
			video.pause();
		}
	}

	btnAbrirVideo?.addEventListener('click', abrirModalVideo);
	document.getElementById('btnFecharModalVideoX')?.addEventListener('click', fecharModalVideo);

	video?.addEventListener('ended', () => {
		alert('O vídeo terminou!');
	});
});
