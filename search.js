// KINONEOX — поиск и динамические новинки

(() => {
    'use strict';

    const API_BASE_URL =
        'https://myvoicebot2026-lilmacky.waw0.amvera.tech';

    const API_URL =
        `${API_BASE_URL}/api/search`;

    const NEW_RELEASES_URL =
        `${API_BASE_URL}/api/new-releases`;

    const REQUEST_TIMEOUT_MS = 20000;

    try {
        if (
            window.Telegram &&
            window.Telegram.WebApp
        ) {
            window.Telegram.WebApp.ready();
            window.Telegram.WebApp.expand();
        }
    } catch (error) {
        console.warn(
            'KINONEOX: ошибка Telegram WebApp:',
            error
        );
    }

    const searchInput =
        document.getElementById('search-input');

    const movieGrid =
        document.getElementById('movie-grid');

    let homeStatus =
        document.getElementById('home-status');

    if (!searchInput) {
        console.error(
            'KINONEOX: не найден #search-input'
        );
        return;
    }

    if (!movieGrid) {
        console.error(
            'KINONEOX: не найден #movie-grid'
        );
        return;
    }

    if (!homeStatus) {
        homeStatus =
            document.createElement('div');

        homeStatus.id = 'home-status';

        homeStatus.style.cssText = [
            'color:#888892',
            'font-size:12px',
            'text-align:center',
            'margin:10px 0 20px',
        ].join(';');

        movieGrid.parentNode.insertBefore(
            homeStatus,
            movieGrid
        );
    }

    function showMessage(message) {
        try {
            const webApp =
                window.Telegram?.WebApp;

            if (
                webApp &&
                typeof webApp.showAlert === 'function'
            ) {
                webApp.showAlert(message);
                return;
            }
        } catch (error) {
            console.warn(
                'KINONEOX: ошибка showAlert:',
                error
            );
        }

        window.alert(message);
    }

    function hapticFeedback(style) {
        try {
            const feedback =
                window.Telegram?.WebApp
                    ?.HapticFeedback;

            if (
                feedback &&
                typeof feedback.impactOccurred ===
                    'function'
            ) {
                feedback.impactOccurred(style);
            }
        } catch (error) {
            console.warn(
                'KINONEOX: ошибка виброотклика:',
                error
            );
        }
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function safeUrl(value) {
        if (!value) {
            return '';
        }

        try {
            const url =
                new URL(String(value));

            if (
                url.protocol !== 'https:' &&
                url.protocol !== 'http:'
            ) {
                return '';
            }

            return url.href;
        } catch (error) {
            return '';
        }
    }

    function normalizeMovie(movie) {
        return {
            id: movie?.id || null,

            title: String(
                movie?.title || 'Без названия'
            ).trim(),

            year: String(
                movie?.year || '—'
            ).trim(),

            genre: String(
                movie?.genre || 'Фильм'
            ).trim(),

            poster: safeUrl(
                movie?.poster || ''
            ),

            tmdbUrl: safeUrl(
                movie?.tmdb_url || ''
            ),

            overview: String(
                movie?.overview || ''
            ).trim(),

            rating: movie?.rating
                ? String(movie.rating)
                : '',
        };
    }

    function saveSelectedMovie(movie, mode) {
        try {
            localStorage.setItem(
                'kinoneox_selected_movie',
                JSON.stringify({
                    ...movie,
                    mode,
                    selectedAt: Date.now(),
                })
            );
        } catch (error) {
            console.warn(
                'KINONEOX: фильм не сохранён:',
                error
            );
        }
    }

    function watchSolo(movie) {
        hapticFeedback('light');

        saveSelectedMovie(movie, 'solo');

        showMessage(
            `🍿 Режим «Соло» выбран.\n\n` +
            `${movie.title} (${movie.year})\n\n` +
            `Эта кнопка уже работает как выбор ` +
            `фильма. Настоящий видеоплеер подключим ` +
            `следующим этапом.`
        );
    }

    function createRoom(movie) {
        hapticFeedback('medium');

        saveSelectedMovie(movie, 'room');

        showMessage(
            `👥 Комната для фильма:\n\n` +
            `${movie.title} (${movie.year})\n\n` +
            `Кнопка готова. Настоящие комнаты, ` +
            `приглашения друзей и синхронизация ` +
            `плеера подключаются отдельно.`
        );
    }

    function openDetails(movie) {
        hapticFeedback('light');

        let text =
            `🎬 ${movie.title}\n` +
            `📅 ${movie.year}\n` +
            `🎭 ${movie.genre}`;

        if (movie.rating) {
            text += `\n⭐ Рейтинг: ${movie.rating}`;
        }

        if (movie.overview) {
            text += `\n\n${movie.overview}`;
        }

        showMessage(text);

        if (movie.tmdbUrl) {
            setTimeout(() => {
                try {
                    const webApp =
                        window.Telegram?.WebApp;

                    if (
                        webApp &&
                        typeof webApp.openLink ===
                            'function'
                    ) {
                        webApp.openLink(
                            movie.tmdbUrl
                        );
                    }
                } catch (error) {
                    console.warn(
                        'KINONEOX: ссылка не открылась:',
                        error
                    );
                }
            }, 400);
        }
    }

    function createButton(
        className,
        text,
        background,
        border
    ) {
        const button =
            document.createElement('button');

        button.type = 'button';
        button.className = className;
        button.textContent = text;

        button.style.cssText = [
            `background:${background}`,
            'color:#fff',
            'border:1px solid ' + border,
            'padding:11px 10px',
            'border-radius:10px',
            'font-size:11px',
            'font-weight:bold',
            'cursor:pointer',
            'width:100%',
            'box-sizing:border-box',
        ].join(';');

        return button;
    }

    function createMovieCard(movie) {
        const data =
            normalizeMovie(movie);

        const card =
            document.createElement('article');

        card.style.cssText = [
            'background:#0c0b0f',
            'border:1px solid rgba(255,42,75,.5)',
            'border-radius:18px',
            'overflow:hidden',
            'display:flex',
            'flex-direction:column',
            'width:100%',
            'max-width:280px',
            'box-sizing:border-box',
            'box-shadow:0 8px 30px rgba(0,0,0,.8)',
        ].join(';');

        const posterBox =
            document.createElement('div');

        posterBox.style.cssText = [
            'position:relative',
            'width:100%',
            'aspect-ratio:2/3',
            'background:linear-gradient(135deg,#18151c,#09080a)',
            'display:flex',
            'align-items:center',
            'justify-content:center',
            'overflow:hidden',
            'font-size:42px',
        ].join(';');

        posterBox.textContent = '🎬';

        if (data.poster) {
            const image =
                document.createElement('img');

            image.src = data.poster;
            image.alt = data.title;
            image.loading = 'lazy';

            image.style.cssText = [
                'position:absolute',
                'inset:0',
                'width:100%',
                'height:100%',
                'object-fit:cover',
            ].join(';');

            image.addEventListener(
                'error',
                () => image.remove(),
                { once: true }
            );

            posterBox.appendChild(image);
        }

        const badge =
            document.createElement('span');

        badge.textContent = '1080P';

        badge.style.cssText = [
            'position:absolute',
            'top:12px',
            'left:12px',
            'background:#b51a34',
            'color:#fff',
            'font-size:9px',
            'font-weight:800',
            'padding:4px 8px',
            'border-radius:8px',
        ].join(';');

        posterBox.appendChild(badge);

        const content =
            document.createElement('div');

        content.style.cssText = [
            'padding:14px',
            'display:flex',
            'flex-direction:column',
            'align-items:center',
            'text-align:center',
            'background:#070609',
            'box-sizing:border-box',
        ].join(';');

        const title =
            document.createElement('div');

        title.textContent = data.title;

        title.style.cssText = [
            'font-size:14px',
            'font-weight:700',
            'color:#fff',
            'margin-bottom:5px',
        ].join(';');

        const meta =
            document.createElement('div');

        meta.textContent =
            `${data.year} • ${data.genre.toUpperCase()}`;

        meta.style.cssText = [
            'font-size:11px',
            'color:#8f8796',
            'margin-bottom:14px',
            'font-weight:600',
        ].join(';');

        const buttons =
            document.createElement('div');

        buttons.style.cssText = [
            'display:flex',
            'flex-direction:column',
            'gap:9px',
            'width:100%',
            'max-width:220px',
        ].join(';');

        const detailsButton =
            createButton(
                'details-button',
                '🔎 Подробнее',
                'linear-gradient(180deg,#282332,#15111d)',
                '#6e557f'
            );

        const roomButton =
            createButton(
                'create-room-button',
                '👥 Создать комнату',
                'linear-gradient(180deg,#b51a34,#730f1e)',
                '#ff2a4b'
            );

        const soloButton =
            createButton(
                'solo-watch-button',
                '🍿 Смотреть соло',
                'linear-gradient(180deg,#187a4b,#0d4d30)',
                '#39d98a'
            );

        detailsButton.addEventListener(
            'click',
            () => openDetails(data)
        );

        roomButton.addEventListener(
            'click',
            () => createRoom(data)
        );

        soloButton.addEventListener(
            'click',
            () => watchSolo(data)
        );

        buttons.appendChild(detailsButton);
        buttons.appendChild(roomButton);
        buttons.appendChild(soloButton);

        content.appendChild(title);
        content.appendChild(meta);
        content.appendChild(buttons);

        card.appendChild(posterBox);
        card.appendChild(content);

        return card;
    }

    function renderMovies(movies) {
        movieGrid.replaceChildren();

        movies.forEach((movie) => {
            movieGrid.appendChild(
                createMovieCard(movie)
            );
        });
    }

    async function fetchJson(url) {
        const controller =
            new AbortController();

        const timeoutId =
            window.setTimeout(
                () => controller.abort(),
                REQUEST_TIMEOUT_MS
            );

        try {
            const response =
                await fetch(url, {
                    method: 'GET',
                    headers: {
                        Accept:
                            'application/json',
                    },
                    cache: 'no-store',
                    signal: controller.signal,
                });

            const text =
                await response.text();

            if (!response.ok) {
                throw new Error(
                    `HTTP ${response.status}: ` +
                    text.slice(0, 300)
                );
            }

            try {
                return JSON.parse(text);
            } catch (error) {
                throw new Error(
                    'Сервер вернул неправильный JSON'
                );
            }
        } finally {
            window.clearTimeout(timeoutId);
        }
    }

    async function loadNewReleases() {
        homeStatus.textContent =
            'Загружаем свежие фильмы...';

        try {
            const data =
                await fetchJson(
                    NEW_RELEASES_URL
                );

            if (
                !data ||
                !Array.isArray(data.movies)
            ) {
                throw new Error(
                    'Нет массива новинок'
                );
            }

            if (data.movies.length === 0) {
                homeStatus.textContent =
                    'Новинки пока не найдены.';
                return;
            }

            renderMovies(data.movies);

            homeStatus.textContent =
                'Свежие фильмы обновляются автоматически';
        } catch (error) {
            console.error(
                'KINONEOX releases error:',
                error
            );

            homeStatus.textContent =
                'Не удалось загрузить новинки.';
        }
    }

    async function searchMovies() {
        const query =
            searchInput.value.trim();

        if (query.length < 3) {
            showMessage(
                'Введи минимум 3 символа для поиска.'
            );
            return;
        }

        const originalValue = query;

        searchInput.disabled = true;
        searchInput.value =
            '🤖 ИИ ищет фильмы...';

        try {
            const data =
                await fetchJson(
                    `${API_URL}?q=` +
                    encodeURIComponent(query)
                );

            if (
                !data ||
                !Array.isArray(data.movies)
            ) {
                throw new Error(
                    'Сервер не вернул movies'
                );
            }

            if (data.movies.length === 0) {
                showMessage(
                    '🤖 Подходящих фильмов не найдено.'
                );
                return;
            }

            homeStatus.textContent =
                'Результаты поиска';

            renderMovies(data.movies);
        } catch (error) {
            console.error(
                'KINONEOX search error:',
                error
            );

            if (
                error &&
                error.name === 'AbortError'
            ) {
                showMessage(
                    'Сервер отвечает слишком долго.'
                );
            } else {
                showMessage(
                    'Ошибка подключения к серверу.'
                );
            }
        } finally {
            searchInput.value =
                originalValue;

            searchInput.disabled = false;
        }
    }

    searchInput.addEventListener(
        'keydown',
        (event) => {
            if (event.key !== 'Enter') {
                return;
            }

            event.preventDefault();
            searchMovies();
        }
    );

    loadNewReleases();
})();
