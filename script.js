// Exemplo simples: mostrar alerta quando o vídeo terminar
const video = document.getElementById('videoCaravanas');
// Adiciona um evento para quando o vídeo terminar
video.addEventListener('ended', () => {
    alert('O vídeo terminou!');
});