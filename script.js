document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('container');
    const addButton = document.getElementById('add-button');
    const chronoButton = document.getElementById('chrono-button');
    let squareCount = 0;
    let isChronoMode = false;

    // Initialize drag functionality for squares
    function initDrag(square) {
        let isDragging = false;
        let currentX, currentY;
        
        square.addEventListener('mousedown', function(e) {
            if (isChronoMode) return; // Disable dragging in chrono mode
            isDragging = true;
            const rect = square.getBoundingClientRect();
            currentX = e.clientX - rect.left;
            currentY = e.clientY - rect.top;
        });

        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            
            const containerRect = container.getBoundingClientRect();
            let x = e.clientX - currentX - containerRect.left;
            let y = e.clientY - currentY - containerRect.top;
            
            // Constrain to container
            x = Math.max(0, Math.min(x, containerRect.width - square.offsetWidth));
            y = Math.max(0, Math.min(y, containerRect.height - square.offsetHeight));
            
            square.style.transform = `translate(${x}px, ${y}px)`;
        });

        document.addEventListener('mouseup', function() {
            isDragging = false;
        });
    }

    // Add new square when clicking the "+" button
    addButton.addEventListener('click', function() {
        if (isChronoMode) return; // Disable adding squares in chrono mode
        squareCount++;
        createSquare(squareCount);
    });

    // Toggle between setup and chrono modes
    chronoButton.addEventListener('click', function() {
        isChronoMode = !isChronoMode;
        
        if (isChronoMode) {
            chronoButton.textContent = '⚙️';
            addButton.style.display = 'none';
            // Switch to chrono mode
            const squares = document.querySelectorAll('.square');
            squares.forEach(square => {
                convertToChronoSquare(square);
            });
        } else {
            chronoButton.textContent = '✓';
            addButton.style.display = 'block';
            // Switch back to setup mode
            const squares = document.querySelectorAll('.square');
            squares.forEach(square => {
                convertToSetupSquare(square);
            });
        }
    });

    // Create a new square with the given number
    function createSquare(number) {
        const square = document.createElement('div');
        square.className = 'square';
        square.textContent = number;

        // Position the square randomly within the container
        const randomX = Math.floor(Math.random() * (window.innerWidth - 100));
        const randomY = Math.floor(Math.random() * (window.innerHeight - 200));
        
        square.style.transform = `translate(${randomX}px, ${randomY}px)`;

        // Add double-click event for editing in setup mode
        square.addEventListener('dblclick', function() {
            if (!isChronoMode) {
                makeEditable(square);
            }
        });

        initDrag(square);
        container.appendChild(square);
    }

    // Make a square editable on double-click (setup mode)
    function makeEditable(square) {
        square.classList.add('editable');
        square.contentEditable = true;
        square.focus();
        
        // Select all text when entering edit mode
        const range = document.createRange();
        range.selectNodeContents(square);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        // Remove editable state when clicking outside
        document.addEventListener('click', function handleOutsideClick(event) {
            if (event.target !== square && !square.contains(event.target)) {
                square.classList.remove('editable');
                square.contentEditable = false;
                document.removeEventListener('click', handleOutsideClick);
            }
        }, { once: true });
    }

    // Convert a square to chrono mode
    function convertToChronoSquare(square) {
        const title = square.textContent.trim();
        
        // Create inner structure for chrono mode
        square.innerHTML = '';
        square.classList.add('chrono-mode');
        square.style.cursor = 'default';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'square-content';
        
        const titleDiv = document.createElement('div');
        titleDiv.className = 'square-title';
        titleDiv.textContent = title;
        
        const timerDiv = document.createElement('div');
        timerDiv.className = 'timer-line';
        timerDiv.textContent = '00:00';
        
        contentDiv.appendChild(titleDiv);
        contentDiv.appendChild(timerDiv);
        square.appendChild(contentDiv);
        
        // Store the title for reference
        square.dataset.title = title;
        
        // Add click handler for chrono functionality
        let timers = [];
        let currentTimerIndex = 0;
        
        square.addEventListener('click', function() {
            if (!isChronoMode) return;
            
            const contentDiv = this.querySelector('.square-content');
            const titleDiv = contentDiv.querySelector('.square-title');
            
            // Click 1: Start first timer (on the existing line)
            if (timers.length === 0) {
                startTimer(contentDiv, titleDiv);
                timers.push({ div: contentDiv.querySelector('.timer-line'), startTime: Date.now() });
            }
            // Click 2: Add second timer below
            else if (timers.length === 1) {
                currentTimerIndex = 1;
                timers.push({ div: createTimerDisplay(), startTime: Date.now() });
            }
            // Click 3: Reset second timer
            else if (timers.length === 2) {
                currentTimerIndex = 1;
                timers[1].startTime = Date.now();
            }
        });

        square.addEventListener('dblclick', function() {
            if (!isChronoMode) return;
            
            // Reset to initial state with one timer at 00:00
            const contentDiv = this.querySelector('.square-content');
            
            // Remove all timers except the first one
            while (contentDiv.children.length > 2) {
                contentDiv.removeChild(contentDiv.lastChild);
            }
            
            // Reset the timer display to 00:00
            const timerDiv = contentDiv.querySelector('.timer-line');
            if (timerDiv) {
                timerDiv.textContent = '00:00';
            }
            
            timers = [];
            currentTimerIndex = 0;
            // Reset background color to green
            square.style.backgroundColor = '#4CAF50';
        });

        // Start updating all timers
        setInterval(function() {
            if (!isChronoMode || timers.length === 0) return;
            
            for (let i = 0; i < timers.length; i++) {
                updateTimer(timers[i]);
            }
        }, 1000);

        function startTimer(contentDiv, titleDiv) {
            // Change appearance to indicate active chrono mode
            square.style.backgroundColor = '#2196F3';
            titleDiv.style.fontSize = '18px';
        }

        function createTimerDisplay() {
            const timerDiv = document.createElement('div');
            timerDiv.className = 'timer-line';
            timerDiv.textContent = '00:00';
            contentDiv.appendChild(timerDiv);
            return timerDiv;
        }

        function updateTimer(timer) {
            const elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const seconds = (elapsed % 60).toString().padStart(2, '0');
            timer.div.textContent = `${minutes}:${seconds}`;
        }
    }

    // Convert a square back to setup mode
    function convertToSetupSquare(square) {
        const title = square.dataset.title || squareCount++;
        
        square.innerHTML = title;
        square.classList.remove('chrono-mode');
        square.style.backgroundColor = '#4CAF50';
        square.style.cursor = 'move';
        
        // Re-enable editing
        square.addEventListener('dblclick', function() {
            if (!isChronoMode) {
                makeEditable(square);
            }
        });
    }
});