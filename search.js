try {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }
} catch (e) {
    console.error("Ошибка инициализации WebApp:", e);
}

document.querySelector('.search-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        let query = this.value.trim();
        if (query.length > 2) {
            this.value = '🤖 ИИ думает...';
            
            // Насильно очищаем Бойцовский клуб СРАЗУ при клике на Enter!
            let grid = document.getElementById('movie-grid');
            if (grid) grid.innerHTML = '<div style="color: #6a6273; font-size: 13px; font-weight: 600; margin-top: 20px;">Подождите, нейросеть подбирает фильмы...</div>';
            
            // Стучимся на сервер Amvera
           etch('https://myvoicebot2026-lilmacky.waw0.amvera.tech/api/search?q=' + encodeURIComponent(query))
                .then(response => response.json())
                .then(data => {
                    document.querySelector('.search-input').value = query;
                    if (data.movies && data.movies.length > 0) {
                        renderMovies(data.movies);
                    } else {
                        if (grid) grid.innerHTML = '<div style="color: #ff2a4b; font-size: 13px; font-weight: 600; margin-top: 20px; text-align: center; padding: 0 20px;">🤖 ИИ временно выдал пустой список. Попробуй переформулировать запрос (например: "Фантастика про космос")!</div>';
                    }
                })
                .catch(err => {
                    document.querySelector('.search-input').value = query;
                    if (grid) grid.innerHTML = '<div style="color: #ff2a4b; font-size: 13px; font-weight: 600; margin-top: 20px;">Ошибка подключения к ИИ-серверу KINONEOX.</div>';
                    console.error(err);
                });
        }
    }
});

function renderMovies(movies) {
    let grid = document.getElementById('movie-grid');
    if (!grid) return;
    grid.innerHTML = ''; // Полностью очищаем экран под новые карточки

    movies.forEach(movie => {
        let card = document.createElement('div');
        card.style.cssText = 'background-color: #0c0b0f; border: 1px solid rgba(255, 42, 75, 0.4); border-radius: 18px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 8px 30px rgba(0, 0, 0, 0.8), 0 0 15px rgba(181, 26, 52, 0.2); width: 100%; max-width: 280px; box-sizing: border-box; margin-bottom: 22px;';
        
        let posterUrl = movie.poster ? movie.poster : 'https://afisha.ru';
        
        card.innerHTML = `
            <div style="width: 100%; aspect-ratio: 2/3; position: relative; overflow: hidden; display: flex; background: #18151c; align-items: center; justify-content: center; font-size: 40px;">
                <img src="${posterUrl}" alt="${movie.title}" style="width: 100%; height: 100%; object-fit: cover; position: absolute; top:0; left:0;">
                🎬
                <span style="position: absolute; top: 12px; left: 12px; background-color: #b51a34; color: white; font-size: 9px; font-weight: 800; padding: 4px 8px; border-radius: 8px; box-shadow: 0 0 12px #ff2a4b;">1080P</span>
            </div>
            <div style="padding: 14px; display: flex; flex-direction: column; text-align: center; background-color: #070609; align-items: center;">
                <div style="font-size: 14px; font-weight: 700; color: #ffffff; margin-bottom: 4px;">${movie.title}</div>
                <div style="font-size: 11px; color: #6a6273; margin-bottom: 14px; font-weight: 600;">${movie.year} • ${movie.genre.toUpperCase()}</div>
                <button style="background: linear-gradient(180deg, #b51a34, #730f1e); color: #ffffff; border: none; padding: 11px; border-radius: 10px; font-size: 11px; font-weight: bold; width: 100%; max-width: 200px; box-shadow: 0 4px 15px rgba(181, 26, 52, 0.4);" onclick="alert('🍿 Создаем приватную комнату для фильма: ${movie.title}...')">Создать комноту</button>
            </div>
        `;
        grid.appendChild(card);
    });
}
