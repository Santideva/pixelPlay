document.addEventListener('DOMContentLoaded', () => {
    // Setup canvas
    const canvas = document.getElementById('pixelPlayCanvas');
    const context = canvas.getContext('2d');
    canvas.width = 800; // Width of the canvas
    canvas.height = 500; // Height of the canvas

    const startButton = document.getElementById('startButton');

    // Center Cartesian coordinates in the middle of the canvas
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Virtual pixels
    let pixels = [];
    let animationId;
    let totalIterations = 0;
    const maxIterations = 1000; // Maximum number of iterations

    // Function to draw a pixel at a given (x, y) position in the Cartesian coordinate system
    function drawPixel(x, y, color = 'black') {
        const canvasX = centerX + x;
        const canvasY = centerY - y; // Invert y to match the Cartesian coordinate system
        context.fillStyle = color;
        context.fillRect(canvasX, canvasY, 1, 1);
    }

    // Function to generate a random RGB color
    function generateRandomColor() {
        return `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)})`;
    }

    // Function to propagate changes outward
    function propagateChanges(parentPixels, visited) {
        const newParents = [];
        parentPixels.forEach(({x, y, color: parentColor}) => {
            const children = [
                {x: x + 1, y},
                {x: x - 1, y},
                {x, y: y + 1},
                {x, y: y - 1}
            ];

            children.forEach(child => {
                const key = `${child.x},${child.y}`;
                if (!visited.has(key) && Math.random() < 0.5) {
                    visited.add(key);
                    let newColor;
                    do {
                        newColor = generateRandomColor();
                    } while (newColor === parentColor); // Ensure the new color is different from the parent color
                    pixels.push({...child, color: newColor});
                    newParents.push({...child, color: newColor});
                    drawPixel(child.x, child.y, newColor); // Draw new child pixel
                }
            });
        });

        console.log('New parents:', newParents.length);
        return newParents;
    }

    // Function to clear the entire canvas
    function clearCanvas() {
        context.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Function to find an adjacent pixel to the last parent
    function findAdjacentPixel(parent) {
        const directions = [
            {x: 1, y: 0},
            {x: -1, y: 0},
            {x: 0, y: 1},
            {x: 0, y: -1}
        ];

        for (const direction of directions) {
            const adjacentPixel = {x: parent.x + direction.x, y: parent.y + direction.y};
            if (!pixels.some(pixel => pixel.x === adjacentPixel.x && pixel.y === adjacentPixel.y)) {
                return adjacentPixel;
            }
        }
        return null; // If all adjacent pixels are already occupied
    }

    // Main function to start the Pixel-Play program
    function startPixelPlay(startX = 0, startY = 0) {
        if (totalIterations === 0) {
            clearCanvas(); // Clear the canvas at the beginning of the initialization process
        }

        pixels = [
            {x: startX, y: startY, color: 'red'}
        ];

        // Draw initial pixel
        drawPixel(startX, startY, 'red');

        // Function to update and draw pixels
        function updateAndDrawPixels() {
            pixels.forEach(pixel => {
                const originalColor = pixel.color;
                if (Math.random() < 0.33) {
                    do {
                        pixel.color = generateRandomColor();
                    } while (pixel.color === originalColor); // Ensure the new color is different from the original color
                    drawPixel(pixel.x, pixel.y, pixel.color);
                }
            });
        }

        // Function to handle outward propagation
        function outwardPropagation(parents) {
            console.log('Outward propagation started.');
            const visited = new Set(parents.map(({x, y}) => `${x},${y}`));
            let newParents = parents;
            let iterations = 0;

            function propagate() {
                if (totalIterations >= maxIterations) {
                    console.log('Maximum iterations reached. Stopping program.');
                    startButton.disabled = false;
                    return;
                }

                newParents = propagateChanges(newParents, visited);
                iterations++;
                totalIterations++;

                if (newParents.length === 0) {
                    const lastParent = parents[parents.length - 1];
                    const newSeed = findAdjacentPixel(lastParent);
                    if (newSeed) {
                        console.log('Restarting propagation from new seed:', newSeed);
                        startPixelPlay(newSeed.x, newSeed.y);
                    } else {
                        console.log('No adjacent pixels available. Stopping program.');
                        startButton.disabled = false;
                    }
                    return;
                }

                animationId = requestAnimationFrame(propagate);
            }

            propagate();
        }

        // Function to propagate changes inward
        function inwardPropagation(parents) {
            console.log('Inward propagation started.');
            const visited = new Set(parents.map(({x, y}) => `${x},${y}`)); // Ensure we track visited pixels
            let newParents = parents;
            let iterations = 0;

            function propagateInward() {
                if (totalIterations >= maxIterations) {
                    console.log('Maximum iterations reached. Stopping program.');
                    startButton.disabled = false;
                    return;
                }

                if (newParents.length === 0) {
                    console.log('Inward propagation ended.');
                    startButton.disabled = false;
                    return;
                }

                const newChildren = [];
                newParents.forEach(({x, y, color: parentColor}) => {
                    const children = [
                        {x: x - 1, y},
                        {x: x + 1, y},
                        {x, y: y - 1},
                        {x, y: y + 1}
                    ];

                    children.forEach(child => {
                        const key = `${child.x},${child.y}`;
                        if (!visited.has(key) && Math.random() < 0.33) {
                            visited.add(key);
                            let newColor;
                            do {
                                newColor = generateRandomColor();
                            } while (newColor === parentColor); // Ensure the new color is different from the parent color
                            pixels.push({...child, color: newColor});
                            newChildren.push({...child, color: newColor});
                            drawPixel(child.x, child.y, newColor); // Draw new child pixel
                        }
                    });
                });

                console.log('New parents:', newChildren.length);
                newParents = newChildren;
                iterations++;
                totalIterations++;
                animationId = requestAnimationFrame(propagateInward);
            }

            propagateInward();
        }

        // Initial update and draw
        updateAndDrawPixels();

        // Alter initial pixels and start propagation
        setTimeout(() => {
            updateAndDrawPixels();
            outwardPropagation(pixels);
        }, 1000);
    }

    // Start button event listener
    startButton.addEventListener('click', () => {
        startButton.disabled = true;
        totalIterations = 0;
        startPixelPlay();
    });
});
