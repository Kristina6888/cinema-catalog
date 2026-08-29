if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
}
document.querySelector('input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        let query = this.value.trim();
        if (query.length > 2) {
            this.value = '🤖 ИИ думает...';
            // Отправляем запрос на сервер Amvera
            fetch('https://myvoicebot2026-lilmacky.waw0.amvera.tech/api/search?q=' + encodeURIComponent(query))
                .then(response => response.json())
                .then(data => {
                    document.querySelector('input').value = query;
                    if (data.movies && data.movies.length > 0) {
                        renderMovies(data.movies);
                    } else {
                        alert('🤖 ИИ не нашел подходящих фильмов. Попробуй другое описание!');
                    }
                })
                .catch(err => {
                    document.querySelector('input').value = query;
                    alert('Ошибка подключения к ИИ-серверу.');
                });
        }
    }
});

function renderMovies(movies) {
  let grid = document.getElementById('movie-grid');
    if (!grid) return;('Ошибка: На сайте не найден блок для вывода фильмов.');
    grid.innerHTML = ''; // Теперь точно стираем старые два фильма
    
    movies.forEach(movie => {
        let card = document.createElement('div');
        card.style = "background-color: #0c0b0f; border: 1px solid rgba(255, 42, 75, 0.5); border-radius: 18px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 8px 30px rgba(0, 0, 0, 0.8), 0 0 18px rgba(181, 26, 52, 0.35); width: 100%; max-width: 280px; box-sizing: border-box; margin-bottom: 20px;";
        card.innerHTML = `
            <div style="width: 100%; aspect-ratio: 2/3; position: relative; overflow: hidden; display: flex;">
                <img src="${movie.poster}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src=''">
                <span style="position: absolute; top: 12px; left: 12px; background-color: #b51a34; color: white; font-size: 9px; font-weight: 800; padding: 4px 8px; border-radius: 8px; box-shadow: 0 0 12px #ff2a4b;">1080P</span>
            </div>
            <div style="padding: 14px; display: flex; flex-direction: column; text-align: center; background-color: #070609; align-items: center;">
                <div style="font-size: 14px; font-weight: 700; color: #ffffff; margin-bottom: 4px;">${movie.title}</div>
                <div style="font-size: 11px; color: #6a6273; margin-bottom: 14px; font-weight: 600;">${movie.year} • ${movie.genre}</div>
                <button style="background: linear-gradient(180deg, #b51a34, #730f1e); color: #ffffff; border: none; padding: 11px; border-radius: 10px; font-size: 11px; font-weight: bold; cursor: pointer; text-transform: uppercase; box-shadow: 0 4px 15px rgba(181, 26, 52, 0.6); width: 100%; max-width: 200px; border-top: 1px solid #ff2a4b;" onclick="alert('Создаем комнату для: ${movie.title}')">Создать</button>
            </div>
        `;
        grid.appendChild(card);
    });
}
