document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('container');
    const addButton = document.getElementById('add-button');
    let squareCount = 0;

    // Initialize interact.js for draggable elements
    interact('.square').draggable({
        inertia: true,
        modifiers: [
            interact.modifiers.restrictRect({
                restriction: 'parent',
                endOnly: true
            })
        ],
        listeners: {
            move(event) {
                const target = event.target;
                let x = parseFloat(target.getAttribute('data-x')) || 0;
                let y = parseFloat(target.getAttribute('data-y')) || 0;
                
                // Calculate the current position if data attributes don't exist
                if (isNaN(x) || isNaN(y)) {
                    const rect = target.getBoundingClientRect();
                    x = rect.left - container.getBoundingClientRect().left;
                    y = rect.top - container.getBoundingClientRect().top;
                    target.setAttribute('data-x', x);
                    target.setAttribute('data-y', y);
                }
                
                // Apply the drag movement
                x += event.dx;
                y += event.dy;

                target.style.transform = `translate(${x}px, ${y}px)`;
                target.setAttribute('data-x', x);
                target.setAttribute('data-y', y);
            }
        }
    });

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
        square.setAttribute('data-number', number);

        // Position the square randomly within the container
        const randomX = Math.floor(Math.random() * (window.innerWidth - 100));
        const randomY = Math.floor(Math.random() * (window.innerHeight - 200));
        square.style.transform = `translate(${randomX}px, ${randomY}px)`;

        // Add double-click event for editing
        square.addEventListener('dblclick', function() {
            makeEditable(square);
        });

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