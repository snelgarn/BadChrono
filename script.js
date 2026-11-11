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
    let ORANGE_AFTER_MS = 30 * 1000;
    let RED_AFTER_MS = 60 * 1000;
    let ZOOM_LEVEL = 1;

    function formatTime(elapsedMs) {
        const total = Math.floor(elapsedMs / 1000);
        const minutes = Math.floor(total / 60).toString().padStart(2, '0');
        const seconds = (total % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    }

    // Color a running timer should have while its alarm is active
    function alarmColor(elapsedMs) {
        if (elapsedMs >= RED_AFTER_MS) return 'red';
        if (elapsedMs >= ORANGE_AFTER_MS) return 'orange';
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
        let currentX, currentY;
        
        square.addEventListener('pointerdown', function(e) {
            if (isChronoMode) return; // Disable dragging in chrono mode
            isDragging = true;
            const rect = square.getBoundingClientRect();
            currentX = e.clientX - rect.left;
            currentY = e.clientY - rect.top;
        });

        document.addEventListener('pointermove', function(e) {
            if (!isDragging) return;
            
            const containerRect = container.getBoundingClientRect();
            let x = e.clientX - currentX - containerRect.left;
            let y = e.clientY - currentY - containerRect.top;
            
            // Constrain to container
            x = Math.max(0, Math.min(x, containerRect.width - square.offsetWidth));
            y = Math.max(0, Math.min(y, containerRect.height - square.offsetHeight));
            
            square.style.transform = `translate(${x}px, ${y}px)`;
        });

        document.addEventListener('pointerup', function() {
            isDragging = false;
        });

        document.addEventListener('pointercancel', function() {
            isDragging = false;
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

        const emojiSpan = document.createElement('span');
        emojiSpan.className = 'alarm-emoji';
        emojiSpan.textContent = '⏰';
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
        const randomX = Math.floor(Math.random() * (window.innerWidth - 100));
        const randomY = Math.floor(Math.random() * (window.innerHeight - 200));
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
        document.addEventListener('click', function handleOutsideClick(event) {
            if (event.target !== titleDiv && !titleDiv.contains(event.target)) {
                titleDiv.contentEditable = false;
                square.dataset.title = titleDiv.textContent.trim();
                document.removeEventListener('click', handleOutsideClick);
            }
        }, { once: true });
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
    setInterval(function() {
        document.querySelectorAll('.square').forEach(tickSquare);
    }, 500);

    // Add new square when clicking the "+" button
    addButton.addEventListener('click', function() {
        if (isChronoMode) return; // Disable adding squares in chrono mode
        squareCount++;
        createSquare(squareCount);
    });

    // Toggle between setup and chrono modes (square state is preserved)
    chronoButton.addEventListener('click', function() {
        isChronoMode = !isChronoMode;

        if (isChronoMode) {
            chronoButton.textContent = '⚙️';
            addButton.style.display = 'none';
            document.querySelectorAll('.square').forEach(square => {
                square.classList.add('chrono-mode');
                square.style.cursor = 'default';
            });
        } else {
            chronoButton.textContent = '✓';
            addButton.style.display = 'block';
            document.querySelectorAll('.square').forEach(square => {
                square.classList.remove('chrono-mode');
                square.style.cursor = 'move';
            });
        }
    });

    // Configuration menu functionality
    configButton.addEventListener('click', function() {
        if (configMenu.style.display === 'block') {
            configMenu.style.display = 'none';
        } else {
            configMenu.style.display = 'block';
        }
    });

    // Close config menu when clicking outside
    document.addEventListener('click', function(event) {
        if (!configMenu.contains(event.target) && 
            !configButton.contains(event.target) &&
            configMenu.style.display === 'block') {
            configMenu.style.display = 'none';
        }
    });

    // Update settings when they change
    document.getElementById('orange-alarm').addEventListener('input', function() {
        ORANGE_AFTER_MS = parseInt(this.value) * 1000;
    });

    document.getElementById('red-alarm').addEventListener('input', function() {
        RED_AFTER_MS = parseInt(this.value) * 1000;
    });

    // Initialize zoom level
    
    // Ensure config menu is hidden initially
    configMenu.style.display = 'none';
});