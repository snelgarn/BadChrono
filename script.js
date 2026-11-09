document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('container');
    const addButton = document.getElementById('add-button');
    let squareCount = 0;

    // Initialize drag functionality for squares
    function initDrag(square) {
        let isDragging = false;
        let currentX, currentY;
        
        square.addEventListener('mousedown', function(e) {
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
        squareCount++;
        createSquare(squareCount);
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

        // Add double-click event for editing
        square.addEventListener('dblclick', function() {
            makeEditable(square);
        });

        initDrag(square);
        container.appendChild(square);
    }

    // Make a square editable on double-click
    function makeEditable(square) {
        square.classList.add('editable');
        square.contentEditable = true;
        square.focus();

        // Remove editable state when clicking outside
        document.addEventListener('click', function handleOutsideClick(event) {
            if (event.target !== square && !square.contains(event.target)) {
                square.classList.remove('editable');
                square.contentEditable = false;
                document.removeEventListener('click', handleOutsideClick);
            }
        }, { once: true });
    }
});