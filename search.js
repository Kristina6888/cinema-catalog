// KINONEOX — поиск фильмов для Telegram Mini App

(() => {
    'use strict';

    const API_URL = 'https://http://kinoneox-test-lilmacky.waw0.amvera.tech//api/search';
    const REQUEST_TIMEOUT_MS = 20000;

    // Инициализация Telegram Mini App.
    try {
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.ready();
            window.Telegram.WebApp.expand();
        }
    } catch (error) {
        console.warn('KINONEOX: Telegram WebApp init error:', error);
    }

    const searchInput = document.getElementById('search-input');
    const movieGrid = document.getElementById('movie-grid');

    if (!searchInput) {
        console.error('KINONEOX: не найден элемент #search-input');
        return;
    }

    if (!movieGrid) {
        console.error('KINONEOX: не найден элемент #movie-grid');
        return;
    }

    function showMessage(message) {
        try {
            if (window.Telegram && window.Telegram.WebApp && typeof window.Telegram.WebApp.showAlert === 'function') {
                window.Telegram.WebApp.showAlert(message);
                return;
            }
        } catch (error) {
            console.warn('KINONEOX: showAlert error:', error);
        }

        window.alert(message);
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function safePosterUrl(value) {
        if (!value) return '';

        try {
            const url = new URL(String(value));
            if (url.protocol !== 'https:' && url.protocol !== 'http:') {
                return '';
            }
            return url.href;
        } catch (_) {
            return '';
        }
    }

    function renderMovies(movies) {
        movieGrid.replaceChildren();

        movies.forEach((movie) => {
            const title = String(movie && movie.title ? movie.title : 'Без названия');
            const year = String(movie && movie.year ? movie.year : '—');
            const genre = String(movie && movie.genre ? movie.genre : 'Фильм').toUpperCase();
            const posterUrl = safePosterUrl(movie && movie.poster ? movie.poster : '');

            const card = document.createElement('div');
            card.style.cssText = 'background-color:#0c0b0f;border:1px solid rgba(255,42,75,.5);border-radius:18px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 8px 30px rgba(0,0,0,.8),0 0 18px rgba(181,26,52,.35);width:100%;max-width:280px;box-sizing:border-box;';

            card.innerHTML = `
                <div style="width:100%;aspect-ratio:2/3;position:relative;overflow:hidden;display:flex;background:linear-gradient(135deg,#18151c,#09080a);align-items:center;justify-content:center;font-size:40px;">
                    🎬
                    ${posterUrl ? `<img src="${escapeHtml(posterUrl)}" alt="${escapeHtml(title)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;" onerror="this.remove()">` : ''}
                    <span style="position:absolute;top:12px;left:12px;background-color:#b51a34;color:#fff;font-size:9px;font-weight:800;padding:4px 8px;border-radius:8px;box-shadow:0 0 12px #ff2a4b;">1080P</span>
                </div>
                <div style="padding:14px;display:flex;flex-direction:column;text-align:center;background-color:#070609;align-items:center;">
                    <div style="font-size:14px;font-weight:700;color:#fff;margin-bottom:4px;letter-spacing:-.1px;">${escapeHtml(title)}</div>
                    <div style="font-size:11px;color:#6a6273;margin-bottom:14px;font-weight:600;">${escapeHtml(year)} • ${escapeHtml(genre)}</div>
                    <button type="button" class="watch-solo-btn" style="background:linear-gradient(180deg,#24123a,#150924);color:#fff;border:1px solid #ff2a4b;padding:11px;border-radius:10px;font-size:11px;font-weight:bold;cursor:pointer;text-transform:uppercase;box-shadow:0 0 10px rgba(255,42,75,.3);width:100%;max-width:200px;margin-bottom:10px;">Смотреть одной</button>
                    <button type="button" class="create-room-btn" style="background:linear-gradient(180deg,#b51a34,#730f1e);color:#fff;border:none;padding:11px;border-radius:10px;font-size:11px;font-weight:bold;cursor:pointer;text-transform:uppercase;box-shadow:0 4px 15px rgba(181,26,52,.6);width:100%;max-width:200px;border-top:1px solid #ff2a4b;">Создать</button>
                </div>
            `;

            const createButton = card.querySelector('.create-room-btn');
            if (createButton) {
                createButton.addEventListener('click', () => {
                    showMessage(`🍿 Создаем приватную комнату для фильма: ${title}`);
                });
            }
            const watchSoloBtn = card.querySelector('.watch-solo-btn');
            if (watchSoloBtn) {
                watchSoloBtn.addEventListener('click', () => {
                    const isSerial = genre.toLowerCase().includes('СЕРИАЛ') || genre.toLowerCase().includes('АНИМЕ');
                    const typePath = isSerial ? 'tv' : 'movie';
                    const iframe = document.createElement('iframe');
                    iframe.src = `https://vidsrc.cc/v2/embed/movie/${movie.kinopoiskId || movie.title}`; 
                    iframe.style.cssText = 'width:100%;height:100%;border:none;position:absolute;inset:0;background:#000;z-index:90;';
                    iframe.setAttribute('allowfullscreen', 'true');
                    card.style.padding = '0';
                    card.style.overflow = 'hidden';
                    card.innerHTML = '';
                    card.appendChild(iframe);
                });
            }

            movieGrid.appendChild(card);
        });
    }

    async function searchMovies() {
        const query = searchInput.value.trim();

        if (query.length < 3) {
            showMessage('Введи хотя бы 3 символа для поиска.');
            return;
        }

        const originalValue = query;
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        searchInput.value = '🤖 ИИ думает...';
        searchInput.disabled = true;
        searchInput.blur();

        try {
            const response = await fetch(`${API_URL}?q=${encodeURIComponent(query)}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                signal: controller.signal,
                cache: 'no-store'
            });

            const responseText = await response.text();
            console.log('KINONEOX API status:', response.status);
            console.log('KINONEOX API raw response:', responseText);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${responseText.slice(0, 300)}`);
            }

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (error) {
                throw new Error('Сервер вернул невалидный JSON');
            }

            if (!data || !Array.isArray(data.movies)) {
                throw new Error('В ответе сервера отсутствует массив movies');
            }

            if (data.movies.length === 0) {
                showMessage('🤖 ИИ не нашел подходящих фильмов. Попробуй изменить описание.');
                return;
            }

            renderMovies(data.movies);
        } catch (error) {
            console.error('KINONEOX search error:', error);

            if (error && error.name === 'AbortError') {
                showMessage('ИИ-сервер отвечает слишком долго. Попробуй ещё раз.');
            } else {
                showMessage('Ошибка подключения к ИИ-серверу KINONEOX.');
            }
        } finally {
            window.clearTimeout(timeoutId);
            searchInput.value = originalValue;
            searchInput.disabled = false;
        }
    }

    searchInput.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        searchMovies();
    });
})();
