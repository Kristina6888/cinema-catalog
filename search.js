// ============================================================
// KINONEOX — ПОЛНЫЙ ФАЙЛ search.js
// Поиск фильмов, новинки, карточки и кнопки
// ============================================================

(() => {
    'use strict';

    // ========================================================
    // АДРЕС СЕРВЕРА AMVERA
    // ========================================================

    const API_BASE_URL =
        'https://myvoicebot2026-lilmacky.waw0.amvera.tech';

    const SEARCH_API_URL =
        `${API_BASE_URL}/api/search`;

    const NEW_RELEASES_API_URL =
        `${API_BASE_URL}/api/new-releases`;

    const REQUEST_TIMEOUT_MS = 40000;


    // ========================================================
    // TELEGRAM MINI APP
    // ========================================================

    const telegramWebApp =
        window.Telegram &&
        window.Telegram.WebApp
            ? window.Telegram.WebApp
            : null;

    try {
        if (telegramWebApp) {
            telegramWebApp.ready();
            telegramWebApp.expand();
        }
    } catch (error) {
        console.warn(
            'KINONEOX: ошибка запуска Telegram WebApp:',
            error
        );
    }


    // ========================================================
    // ЭЛЕМЕНТЫ СТРАНИЦЫ
    // ========================================================

    const searchInput =
        document.getElementById('search-input');

    const searchButton =
        document.getElementById('search-button');

    const searchIcon =
        document.querySelector('.search-icon');

    const movieGrid =
        document.getElementById('movie-grid');

    let homeStatus =
        document.getElementById('home-status');


    // ========================================================
    // ПРОВЕРКА HTML
    // ========================================================

    if (!searchInput) {
        console.error(
            'KINONEOX: в index.html не найден элемент #search-input'
        );

        return;
    }

    if (!movieGrid) {
        console.error(
            'KINONEOX: в index.html не найден элемент #movie-grid'
        );

        return;
    }

    if (!homeStatus) {
        homeStatus =
            document.createElement('div');

        homeStatus.id = 'home-status';
        homeStatus.setAttribute(
            'role',
            'status'
        );

        homeStatus.setAttribute(
            'aria-live',
            'polite'
        );

        homeStatus.style.cssText = [
            'min-height:18px',
            'margin:6px 0 18px',
            'color:#888892',
            'font-size:12px',
            'line-height:1.4',
            'text-align:center',
        ].join(';');

        movieGrid.parentNode.insertBefore(
            homeStatus,
            movieGrid
        );
    }


    // ========================================================
    // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
    // ========================================================

    function setStatus(message) {
        if (homeStatus) {
            homeStatus.textContent =
                String(message || '');
        }
    }


    function showMessage(message) {
        const text =
            String(message || '');

        try {
            if (
                telegramWebApp &&
                typeof telegramWebApp.showAlert ===
                    'function'
            ) {
                telegramWebApp.showAlert(text);
                return;
            }
        } catch (error) {
            console.warn(
                'KINONEOX: ошибка Telegram showAlert:',
                error
            );
        }

        window.alert(text);
    }


    function hapticFeedback(style = 'light') {
        try {
            if (
                telegramWebApp &&
                telegramWebApp.HapticFeedback &&
                typeof telegramWebApp
                    .HapticFeedback
                    .impactOccurred === 'function'
            ) {
                telegramWebApp
                    .HapticFeedback
                    .impactOccurred(style);
            }
        } catch (error) {
            console.warn(
                'KINONEOX: ошибка виброотклика:',
                error
            );
        }
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
        const source =
            movie && typeof movie === 'object'
                ? movie
                : {};

        let rating = '';

        if (
            source.rating !== undefined &&
            source.rating !== null &&
            source.rating !== ''
        ) {
            rating =
                String(source.rating);
        }

        return {
            id:
                source.id || null,

            title:
                String(
                    source.title ||
                    'Без названия'
                ).trim(),

            year:
                String(
                    source.year ||
                    '—'
                ).trim(),

            genre:
                String(
                    source.genre ||
                    'Фильм'
                ).trim(),

            poster:
                safeUrl(
                    source.poster || ''
                ),

            tmdbUrl:
                safeUrl(
                    source.tmdb_url || ''
                ),

            overview:
                String(
                    source.overview || ''
                ).trim(),

            rating,
        };
    }


    function saveSelectedMovie(
        movie,
        mode
    ) {
        try {
            localStorage.setItem(
                'kinoneox_selected_movie',
                JSON.stringify({
                    ...movie,
                    mode,
                    selectedAt:
                        new Date().toISOString(),
                })
            );
        } catch (error) {
            console.warn(
                'KINONEOX: фильм не удалось сохранить:',
                error
            );
        }
    }


    function setSearchBusy(isBusy) {
        searchInput.disabled =
            isBusy;

        if (searchButton) {
            searchButton.disabled =
                isBusy;
        }

        if (searchIcon) {
            searchIcon.style.opacity =
                isBusy ? '0.5' : '1';

            searchIcon.style.cursor =
                isBusy ? 'wait' : 'pointer';
        }
    }


    function openExternalLink(url) {
        const safeLink =
            safeUrl(url);

        if (!safeLink) {
            return;
        }

        try {
            if (
                telegramWebApp &&
                typeof telegramWebApp.openLink ===
                    'function'
            ) {
                telegramWebApp.openLink(
                    safeLink
                );

                return;
            }
        } catch (error) {
            console.warn(
                'KINONEOX: Telegram не открыл ссылку:',
                error
            );
        }

        window.open(
            safeLink,
            '_blank',
            'noopener,noreferrer'
        );
    }


    // ========================================================
    // ДЕЙСТВИЯ КНОПОК ФИЛЬМА
    // ========================================================

    function openMovieDetails(movie) {
        hapticFeedback('light');

        let message =
            `🎬 ${movie.title}\n` +
            `📅 Год: ${movie.year}\n` +
            `🎭 Жанр: ${movie.genre}`;

        if (movie.rating) {
            message +=
                `\n⭐ Рейтинг: ${movie.rating}`;
        }

        if (movie.overview) {
            const shortOverview =
                movie.overview.length > 700
                    ? `${movie.overview.slice(0, 700)}…`
                    : movie.overview;

            message +=
                `\n\n${shortOverview}`;
        }

        if (!movie.tmdbUrl) {
            showMessage(message);
            return;
        }

        const confirmText =
            `${message}\n\n` +
            'Открыть страницу фильма?';

        try {
            if (
                telegramWebApp &&
                typeof telegramWebApp.showConfirm ===
                    'function'
            ) {
                telegramWebApp.showConfirm(
                    confirmText,
                    (confirmed) => {
                        if (confirmed) {
                            openExternalLink(
                                movie.tmdbUrl
                            );
                        }
                    }
                );

                return;
            }
        } catch (error) {
            console.warn(
                'KINONEOX: ошибка подтверждения:',
                error
            );
        }

        const confirmed =
            window.confirm(confirmText);

        if (confirmed) {
            openExternalLink(
                movie.tmdbUrl
            );
        }
    }


    function createRoom(movie) {
        hapticFeedback('medium');

        saveSelectedMovie(
            movie,
            'room'
        );

        showMessage(
            `👥 Создание комнаты\n\n` +
            `🎬 ${movie.title}\n` +
            `📅 ${movie.year}\n\n` +
            `Фильм выбран и сохранён. ` +
            `Создание настоящей комнаты и ` +
            `приглашение друга будут подключены ` +
            `на следующем этапе.`
        );
    }


    function watchSolo(movie) {
        hapticFeedback('light');

        saveSelectedMovie(
            movie,
            'solo'
        );

        showMessage(
            `🍿 Выбран режим «Соло»\n\n` +
            `🎬 ${movie.title}\n` +
            `📅 ${movie.year}\n\n` +
            `Фильм выбран и сохранён. ` +
            `Для настоящего просмотра необходимо ` +
            `подключить легальный источник видео.`
        );
    }


    // ========================================================
    // СОЗДАНИЕ КРАСНОЙ НЕОНОВОЙ КНОПКИ
    // ========================================================

    function createActionButton(
        className,
        text
    ) {
        const button =
            document.createElement('button');

        button.type = 'button';
        button.className =
            className;

        button.textContent =
            text;

        button.style.cssText = [
            'position:relative',
            'display:block',
            'width:100%',
            'min-height:44px',
            'padding:11px 12px',
            'overflow:hidden',
            'color:#ffffff',
            'font-size:11px',
            'font-weight:800',
            'line-height:1.2',
            'letter-spacing:.25px',
            'text-align:center',
            'text-transform:uppercase',
            'cursor:pointer',
            'background:linear-gradient(180deg,#c51d3a 0%,#8f1429 55%,#650c1b 100%)',
            'border:1px solid #ff3759',
            'border-radius:10px',
            'box-sizing:border-box',
            'box-shadow:0 0 8px rgba(255,42,75,.72),0 0 18px rgba(181,26,52,.45),inset 0 1px 0 rgba(255,255,255,.18)',
            'text-shadow:0 0 8px rgba(255,255,255,.35)',
            'transition:transform .15s ease,filter .15s ease,box-shadow .15s ease',
            '-webkit-tap-highlight-color:transparent',
            'touch-action:manipulation',
        ].join(';');

        const pressedStyle = () => {
            button.style.transform =
                'scale(0.97)';

            button.style.filter =
                'brightness(1.18)';

            button.style.boxShadow =
                '0 0 13px rgba(255,42,75,.95),' +
                '0 0 26px rgba(181,26,52,.70),' +
                'inset 0 1px 0 rgba(255,255,255,.22)';
        };

        const normalStyle = () => {
            button.style.transform =
                'scale(1)';

            button.style.filter =
                'brightness(1)';

            button.style.boxShadow =
                '0 0 8px rgba(255,42,75,.72),' +
                '0 0 18px rgba(181,26,52,.45),' +
                'inset 0 1px 0 rgba(255,255,255,.18)';
        };

        button.addEventListener(
            'pointerdown',
            pressedStyle
        );

        button.addEventListener(
            'pointerup',
            normalStyle
        );

        button.addEventListener(
            'pointercancel',
            normalStyle
        );

        button.addEventListener(
            'pointerleave',
            normalStyle
        );

        return button;
    }


    // ========================================================
    // СОЗДАНИЕ КАРТОЧКИ ФИЛЬМА
    // ========================================================

    function createMovieCard(movie) {
        const data =
            normalizeMovie(movie);

        const card =
            document.createElement('article');

        card.style.cssText = [
            'width:100%',
            'max-width:280px',
            'overflow:hidden',
            'display:flex',
            'flex-direction:column',
            'background:#0c0b0f',
            'border:1px solid rgba(255,42,75,.5)',
            'border-radius:18px',
            'box-sizing:border-box',
            'box-shadow:0 8px 30px rgba(0,0,0,.8),0 0 18px rgba(181,26,52,.28)',
        ].join(';');


        // Блок постера

        const posterBox =
            document.createElement('div');

        posterBox.style.cssText = [
            'position:relative',
            'display:flex',
            'align-items:center',
            'justify-content:center',
            'width:100%',
            'aspect-ratio:2/3',
            'overflow:hidden',
            'color:#ffffff',
            'font-size:44px',
            'background:linear-gradient(135deg,#18151c,#09080a)',
        ].join(';');

        const placeholder =
            document.createElement('span');

        placeholder.textContent =
            '🎬';

        placeholder.setAttribute(
            'aria-hidden',
            'true'
        );

        posterBox.appendChild(
            placeholder
        );


        // Изображение постера

        if (data.poster) {
            const image =
                document.createElement('img');

            image.src =
                data.poster;

            image.alt =
                `Постер фильма ${data.title}`;

            image.loading =
                'lazy';

            image.decoding =
                'async';

            image.style.cssText = [
                'position:absolute',
                'inset:0',
                'display:block',
                'width:100%',
                'height:100%',
                'object-fit:cover',
                'background:#111',
            ].join(';');

            image.addEventListener(
                'error',
                () => {
                    image.remove();
                },
                {
                    once: true,
                }
            );

            posterBox.appendChild(
                image
            );
        }


        // Значок качества

        const qualityBadge =
            document.createElement('span');

        qualityBadge.textContent =
            '1080P';

        qualityBadge.style.cssText = [
            'position:absolute',
            'top:12px',
            'left:12px',
            'z-index:2',
            'padding:4px 8px',
            'color:#ffffff',
            'font-size:9px',
            'font-weight:800',
            'background:#b51a34',
            'border:1px solid #ff3759',
            'border-radius:8px',
            'box-shadow:0 0 12px rgba(255,42,75,.75)',
        ].join(';');

        posterBox.appendChild(
            qualityBadge
        );


        // Информация о фильме

        const content =
            document.createElement('div');

        content.style.cssText = [
            'display:flex',
            'flex-direction:column',
            'align-items:center',
            'width:100%',
            'padding:15px',
            'text-align:center',
            'background:#070609',
            'box-sizing:border-box',
        ].join(';');


        const title =
            document.createElement('div');

        title.textContent =
            data.title;

        title.style.cssText = [
            'width:100%',
            'margin-bottom:5px',
            'color:#ffffff',
            'font-size:15px',
            'font-weight:750',
            'line-height:1.3',
            'overflow-wrap:anywhere',
        ].join(';');


        const meta =
            document.createElement('div');

        meta.textContent =
            `${data.year} • ${data.genre}`;

        meta.style.cssText = [
            'width:100%',
            'margin-bottom:14px',
            'color:#918a98',
            'font-size:11px',
            'font-weight:600',
            'line-height:1.4',
            'overflow-wrap:anywhere',
        ].join(';');


        // Контейнер кнопок

        const buttons =
            document.createElement('div');

        buttons.style.cssText = [
            'display:flex',
            'flex-direction:column',
            'gap:10px',
            'width:100%',
            'max-width:220px',
        ].join(';');


        const detailsButton =
            createActionButton(
                'details-button',
                '🔎 Подробнее'
            );

        const roomButton =
            createActionButton(
                'create-room-button',
                '👥 Создать комнату'
            );

        const soloButton =
            createActionButton(
                'solo-watch-button',
                '🍿 Смотреть соло'
            );


        detailsButton.addEventListener(
            'click',
            () => {
                openMovieDetails(data);
            }
        );

        roomButton.addEventListener(
            'click',
            () => {
                createRoom(data);
            }
        );

        soloButton.addEventListener(
            'click',
            () => {
                watchSolo(data);
            }
        );


        buttons.appendChild(
            detailsButton
        );

        buttons.appendChild(
            roomButton
        );

        buttons.appendChild(
            soloButton
        );

        content.appendChild(
            title
        );

        content.appendChild(
            meta
        );

        content.appendChild(
            buttons
        );

        card.appendChild(
            posterBox
        );

        card.appendChild(
            content
        );

        return card;
    }


    // ========================================================
    // ОТОБРАЖЕНИЕ ФИЛЬМОВ
    // ========================================================

    function renderMovies(movies) {
        movieGrid.replaceChildren();

        if (
            !Array.isArray(movies) ||
            movies.length === 0
        ) {
            const emptyMessage =
                document.createElement('div');

            emptyMessage.textContent =
                'Фильмы не найдены. Попробуй изменить запрос.';

            emptyMessage.style.cssText = [
                'width:100%',
                'padding:20px',
                'color:#958e9b',
                'font-size:13px',
                'line-height:1.5',
                'text-align:center',
                'background:rgba(12,11,15,.7)',
                'border:1px solid rgba(255,42,75,.2)',
                'border-radius:14px',
                'box-sizing:border-box',
            ].join(';');

            movieGrid.appendChild(
                emptyMessage
            );

            return;
        }

        movies.forEach((movie) => {
            const card =
                createMovieCard(movie);

            movieGrid.appendChild(
                card
            );
        });
    }


    // ========================================================
    // ЗАПРОС К СЕРВЕРУ
    // ========================================================

    async function fetchJson(url) {
        const controller =
            new AbortController();

        const timeoutId =
            window.setTimeout(
                () => {
                    controller.abort();
                },
                REQUEST_TIMEOUT_MS
            );

        try {
            const response =
                await fetch(
                    url,
                    {
                        method: 'GET',
                        headers: {
                            Accept:
                                'application/json',
                        },
                        cache:
                            'no-store',
                        signal:
                            controller.signal,
                    }
                );

            const responseText =
                await response.text();

            console.log(
                'KINONEOX API:',
                response.status,
                url
            );

            let data = null;

            if (responseText) {
                try {
                    data =
                        JSON.parse(
                            responseText
                        );
                } catch (error) {
                    throw new Error(
                        'Сервер вернул неправильный JSON'
                    );
                }
            }

            if (!response.ok) {
                const serverMessage =
                    data &&
                    typeof data.error === 'string'
                        ? data.error
                        : `Ошибка сервера HTTP ${response.status}`;

                const requestError =
                    new Error(serverMessage);

                requestError.status =
                    response.status;

                throw requestError;
            }

            if (
                !data ||
                typeof data !== 'object'
            ) {
                throw new Error(
                    'Сервер вернул пустой ответ'
                );
            }

            return data;
        } finally {
            window.clearTimeout(
                timeoutId
            );
        }
    }


    // ========================================================
    // ЗАГРУЗКА НОВИНОК
    // ========================================================

    async function loadNewReleases() {
        setStatus(
            'Загружаем свежие фильмы...'
        );

        try {
            const data =
                await fetchJson(
                    NEW_RELEASES_API_URL
                );

            if (
                !Array.isArray(
                    data.movies
                )
            ) {
                throw new Error(
                    'Сервер не вернул список новинок'
                );
            }

            if (
                data.movies.length === 0
            ) {
                setStatus(
                    data.error ||
                    'Новинки пока не найдены.'
                );

                renderMovies([]);
                return;
            }

            renderMovies(
                data.movies
            );

            setStatus(
                'Свежие фильмы обновляются автоматически'
            );
        } catch (error) {
            console.error(
                'KINONEOX: ошибка загрузки новинок:',
                error
            );

            if (
                error &&
                error.name === 'AbortError'
            ) {
                setStatus(
                    'Сервер отвечает слишком долго.'
                );
            } else {
                setStatus(
                    error.message ||
                    'Не удалось загрузить новинки.'
                );
            }
        }
    }


    // ========================================================
    // ИИ-ПОИСК ФИЛЬМОВ
    // ========================================================

    async function searchMovies() {
        if (searchInput.disabled) {
            return;
        }

        const query =
            searchInput.value.trim();

        if (query.length < 3) {
            showMessage(
                'Введи минимум 3 символа для поиска.'
            );

            searchInput.focus();
            return;
        }

        hapticFeedback('light');

        const originalPlaceholder =
            searchInput.placeholder;

        setSearchBusy(true);

        searchInput.placeholder =
            'ИИ ищет фильмы...';

        setStatus(
            '🤖 ИИ ищет подходящие фильмы...'
        );

        try {
            const requestUrl =
                `${SEARCH_API_URL}?q=` +
                encodeURIComponent(query);

            const data =
                await fetchJson(
                    requestUrl
                );

            if (
                !Array.isArray(
                    data.movies
                )
            ) {
                throw new Error(
                    'Сервер не вернул массив movies'
                );
            }

            if (
                data.movies.length === 0
            ) {
                renderMovies([]);

                setStatus(
                    data.error ||
                    'Подходящие фильмы не найдены.'
                );

                return;
            }

            renderMovies(
                data.movies
            );

            setStatus(
                `Результаты поиска: «${query}»`
            );
        } catch (error) {
            console.error(
                'KINONEOX: ошибка поиска:',
                error
            );

            if (
                error &&
                error.name === 'AbortError'
            ) {
                setStatus(
                    'Сервер отвечает слишком долго.'
                );

                showMessage(
                    'Сервер отвечает слишком долго. Попробуй ещё раз.'
                );
            } else {
                const message =
                    error &&
                    error.message
                        ? error.message
                        : 'Ошибка подключения к серверу';

                setStatus(message);

                showMessage(
                    `Не удалось выполнить поиск.\n\n${message}`
                );
            }
        } finally {
            setSearchBusy(false);

            searchInput.placeholder =
                originalPlaceholder;
        }
    }


    // ========================================================
    // НАЖАТИЕ ENTER
    // ========================================================

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


    // ========================================================
    // КНОПКА #search-button
    // ========================================================

    if (searchButton) {
        searchButton.addEventListener(
            'click',
            () => {
                searchMovies();
            }
        );
    }


    // ========================================================
    // ИКОНКА .search-icon
    // Работает, если в index.html нет отдельной кнопки
    // ========================================================

    if (
        searchIcon &&
        !searchButton
    ) {
        searchIcon.style.pointerEvents =
            'auto';

        searchIcon.style.cursor =
            'pointer';

        searchIcon.setAttribute(
            'role',
            'button'
        );

        searchIcon.setAttribute(
            'tabindex',
            '0'
        );

        searchIcon.setAttribute(
            'aria-label',
            'Найти фильм'
        );

        searchIcon.addEventListener(
            'click',
            () => {
                searchMovies();
            }
        );

        searchIcon.addEventListener(
            'keydown',
            (event) => {
                if (
                    event.key === 'Enter' ||
                    event.key === ' '
                ) {
                    event.preventDefault();
                    searchMovies();
                }
            }
        );
    }


    // ========================================================
    // ЗАПУСК ПРИ ОТКРЫТИИ СТРАНИЦЫ
    // ========================================================

    loadNewReleases();
})();
