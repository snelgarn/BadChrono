document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('container');
    const addButton = document.getElementById('add-button');
    const chronoButton = document.getElementById('chrono-button');
    const configButton = document.getElementById('config-button');
    const configMenu = document.getElementById('config-menu');
    let squareCount = 0;
    let isChronoMode = false;

    const COLORS = {
        green: '#4CAF50',
        blue: '#2196F3',
        orange: '#FF9800',
        red: '#F44336'
    };
    const ORANGE_AFTER_DEFAULT = 30;
    const RED_AFTER_DEFAULT = 60;
    let ORANGE_AFTER = ORANGE_AFTER_DEFAULT;
    let RED_AFTER = RED_AFTER_DEFAULT;
    let ZOOM_LEVEL = 1;

    function formatTime(elapsedMs) {
        const total = Math.floor(elapsedMs / 1000);
        const minutes = Math.floor(total / 60).toString().padStart(2, '0');
        const seconds = (total % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    }

    function parseTime(timeStr) {
        if (!timeStr) return null;
        const parts = timeStr.split(':');
        if (parts.length !== 2) return null;
        const minutes = parseInt(parts[0], 10);
        const seconds = parseInt(parts[1], 10);
        if (isNaN(minutes) || isNaN(seconds)) return null;
        return (minutes * 60) + seconds;
    }

    function setupAlarmInput(id, setter, defaultValue) {
        const element = document.getElementById(id);
        if (!element) return;

        let prev = '';

        function format(raw) {
            let min = '', sec = '', inSeconds = false;
            for (const ch of raw) {
                if (ch === ':') {
                    if (!inSeconds) {
                        min = min.padStart(2, '0');
                        inSeconds = true;
                    }
                    continue;
                }
                if (!/\d/.test(ch)) continue;

                if (!inSeconds) {
                    min += (min === '' && ch > '5') ? '0' + ch : ch;
                    if (min.length === 2) inSeconds = true;
                } else if (sec.length < 2) {
                    sec += (sec === '' && ch > '5') ? '0' + ch : ch;
                }
            }
            const showColon = inSeconds && (sec !== '' || raw.includes(':'));
            return showColon ? min + ':' + sec : min;
        }

        element.addEventListener('input', (e) => {
            const raw = element.value;
            const colonDeleted = e.inputType.startsWith('delete') && prev.includes(':') && !raw.includes(':');
            element.value = prev = colonDeleted ? raw.slice(0, 1) : format(raw);
        });

        element.addEventListener('blur', function() {
            const val = this.value;
            const parts = val.split(':');

            if (parts.length >= 1) {
                const mm = parseInt(parts[0], 10);
                const ss = parts.length === 2 ? parseInt(parts[1], 10) : 0;
                if (!isNaN(mm) && !isNaN(ss)) {
                    const totalSeconds = mm * 60 + ss;
                    this.value = formatTime(totalSeconds * 1000);
                    setter(totalSeconds);
                    return;
                }
            }

            // Fallback to default
            this.value = formatTime(defaultValue * 1000);
            setter(defaultValue);
        });
    }

    // Color a running timer should have while its alarm is active
    function alarmColor(elapsedMs) {
        if (elapsedMs >= RED_AFTER * 1000) return 'red';
        if (elapsedMs >= ORANGE_AFTER * 1000) return 'orange';
        return 'blue';
    }

    function applyColor(square, name) {
        square.style.backgroundColor = COLORS[name];
    }

    function setAlarmEmoji(square, on) {
        square.classList.toggle('alarm', on);
    }

    // Initialize drag functionality for squares (mouse + touch via pointer events)
    function initDrag(square) {
        let isDragging = false;
        let startX, startY;
        let startRectLeft, startRectTop;
        
        square.addEventListener('pointerdown', function(e) {
            if (isChronoMode) return;
            
            const rect = square.getBoundingClientRect();
            startX = e.clientX;
            startY = e.clientY;
            startRectLeft = rect.left;
            startRectTop = rect.top;

            isDragging = true;
            square.setPointerCapture(e.pointerId);
        });

        document.addEventListener('pointermove', function(e) {
            if (!isDragging) return;
            
            const containerRect = container.getBoundingClientRect();
            
            // Calculate delta from the start position
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            // Calculate new position based on initial rect + mouse delta
            let targetX = startRectLeft + dx - containerRect.left;
            let targetY = startRectTop + dy - containerRect.top;
            
            // Constrain within container
            targetX = Math.max(0, Math.min(targetX, containerRect.width - square.offsetWidth));
            targetY = Math.max(0, Math.min(targetY, containerRect.height - square.offsetHeight));
            
            square.style.transform = `translate(${targetX}px, ${targetY}px)`;
        });

        document.addEventListener('pointerup', function(e) {
            if (!isDragging) return;
            isDragging = false;
            if (square.hasPointerCapture(e.pointerId)) {
                square.releasePointerCapture(e.pointerId);
            }
        });

        document.addEventListener('pointercancel', function(e) {
            if (!isDragging) return;
            isDragging = false;
            if (square.hasPointerCapture(e.pointerId)) {
                square.releasePointerCapture(e.pointerId);
            }
        });
    }

    // Create a new square with the given number
    function createSquare(number) {
        const square = document.createElement('div');
        square.className = 'square';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'square-content';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'square-title';
        titleDiv.textContent = number;

        const timerDiv = document.createElement('div');
        timerDiv.className = 'timer-line';
        timerDiv.textContent = '00:00';

        contentDiv.appendChild(titleDiv);
        contentDiv.appendChild(timerDiv);
        square.appendChild(contentDiv);

        const emojiSpan = document.createElement('img');
        emojiSpan.className = 'alarm-emoji';
        emojiSpan.src = 'src/images/notification-svgrepo-com.svg';
        square.appendChild(emojiSpan);

        square.dataset.title = String(number);

        // Phases:
        //  0 idle: timer 1 at 00:00, green background
        //  1 timer 1 running (total time), alarm active on it
        //  2 timer 1 running, alarm disabled
        //  3 timer 2 running, alarm active on it
        //  4 timer 2 stopped at 00:00, alarm disabled
        square._chrono = {
            phase: 0,
            titleDiv,
            contentDiv,
            emojiSpan,
            timer1: { div: timerDiv, startTime: null },
            timer2: null
        };

        // Position the square randomly within the container
        const containerRect = container.getBoundingClientRect();
        const randomX = Math.floor(Math.random() * (containerRect.width - 150));
        const randomY = Math.floor(Math.random() * (containerRect.height - 150));
        square.style.transform = `translate(${randomX}px, ${randomY}px)`;

        // Click: chrono phase machine (only active in chrono mode)
        square.addEventListener('click', function() {
            if (!isChronoMode) return;
            const s = square._chrono;

            if (s.phase === 0) {
                // First click: start timer 1 (total time), activate the alarm
                s.timer1.startTime = Date.now();
                s.phase = 1;
            } else if (s.phase === 1) {
                // Alarm active on timer 1: disable it, timer 1 keeps running
                s.phase = 2;
            } else if (s.phase === 2) {
                // Add timer 2 below, start it directly, re-activate the alarm
                const div = document.createElement('div');
                div.className = 'timer-line';
                div.textContent = '00:00';
                s.contentDiv.appendChild(div);
                s.timer2 = { div, startTime: Date.now() };
                s.phase = 3;
            } else if (s.phase === 3) {
                // Alarm active on timer 2: disable it and reset timer 2
                s.phase = 4;
                s.timer2.startTime = null;
                s.timer2.div.textContent = '00:00';
            } else {
                // Restart timer 2, re-activate the alarm (loop)
                s.timer2.startTime = Date.now();
                s.phase = 3;
            }
            setAlarmEmoji(square, s.phase === 1 || s.phase === 3);
            applyColor(square, 'blue');
        });

        // Double-click: reset in chrono mode, edit the title in setup mode
        square.addEventListener('dblclick', function() {
            if (isChronoMode) {
                resetChrono(square);
            } else {
                editTitle(square);
            }
        });

        initDrag(square);
        container.appendChild(square);
    }

    // Reset a square to its initial chrono state
    function resetChrono(square) {
        const s = square._chrono;
        while (s.contentDiv.children.length > 2) {
            s.contentDiv.removeChild(s.contentDiv.lastChild);
        }
        s.timer1.startTime = null;
        s.timer1.div.textContent = '00:00';
        s.timer2 = null;
        s.phase = 0;
        setAlarmEmoji(square, false);
        applyColor(square, 'green');
    }

    // Make the square title editable (setup mode)
    function editTitle(square) {
        const titleDiv = square._chrono.titleDiv;
        titleDiv.contentEditable = true;
        titleDiv.focus();

        // Select all text when entering edit mode
        const range = document.createRange();
        range.selectNodeContents(titleDiv);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        // Save when clicking outside the title
        const outsideClickHandler = function(event) {
            if (event.target !== titleDiv && !titleDiv.contains(event.target)) {
                titleDiv.contentEditable = false;
                square.dataset.title = titleDiv.textContent.trim();
                document.removeEventListener('click', outsideClickHandler);
            }
        };
        document.addEventListener('click', outsideClickHandler, { once: true });
    }

    // Update one square's timer lines and alarm color
    function tickSquare(square) {
        const s = square._chrono;
        if (s.phase === 0) return;
        const now = Date.now();

        if (s.timer1.startTime !== null) {
            s.timer1.div.textContent = formatTime(now - s.timer1.startTime);
        }
        if (s.timer2 && s.timer2.startTime !== null) {
            s.timer2.div.textContent = formatTime(now - s.timer2.startTime);
        }

        // Only the active alarm drives the background color
        if (s.phase === 1) {
            applyColor(square, alarmColor(now - s.timer1.startTime));
        } else if (s.phase === 3) {
            applyColor(square, alarmColor(now - s.timer2.startTime));
        }
    }

    // Global tick: keeps every square's state running, in both modes
    setInterval(() => {
        document.querySelectorAll('.square').forEach(tickSquare);
    }, 500);

    // Add new square when clicking the "+" button
    addButton.addEventListener('click', function() {
        if (isChronoMode) return;
        squareCount++;
        createSquare(squareCount);
    });

    // Toggle between setup and chrono modes (square state is preserved)
    chronoButton.addEventListener('click', function() {
        isChronoMode = !isChronoMode;
        if (isChronoMode) {
            chronoButton.innerHTML = '<img src="src/images/pencil-svgrepo-com.svg" alt="edit" class="config-button-icon">';
            addButton.style.display = 'none';
            document.querySelectorAll('.square').forEach(square => {
                square.classList.add('chrono-mode');
                square.style.cursor = 'default';
            });
        } else {
            chronoButton.innerHTML = '<img src="src/images/check-svgrepo-com.svg" alt="check" class="config-button-icon">';
            addButton.style.display = 'flex';
            document.querySelectorAll('.square').forEach(square => {
                square.classList.remove('chrono-mode');
                square.style.cursor = 'move';
            });
        }
    });

    // Configuration menu functionality
    configButton.addEventListener('click', (e) => {
        e.stopPropagation();
        configMenu.style.display = configMenu.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', (e) => {
        if (!configMenu.contains(e.target) && !configButton.contains(e.target)) {
            configMenu.style.display = 'none';
        }
    });

    // Zoom Scaling: Change the root font-size to scale all rem units
    document.getElementById('zoom-level').addEventListener('input', function() {
        ZOOM_LEVEL = parseFloat(this.value);
        document.documentElement.style.fontSize = `${10 * ZOOM_LEVEL}px`;
    });

    setupAlarmInput('orange-alarm', val => ORANGE_AFTER = val, ORANGE_AFTER_DEFAULT);
    setupAlarmInput('red-alarm', val => RED_AFTER = val, RED_AFTER_DEFAULT);
});