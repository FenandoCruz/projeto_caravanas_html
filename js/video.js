// Exibe um alerta quando o vídeo terminar
const video = document.getElementById('videoCaravanas');
if (video) {
	video.addEventListener('ended', () => {
		alert('O vídeo terminou!');
	});
}
