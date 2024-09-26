const penSize = 20;
const gridSize = 28;

let drawing = false;
let lastX, lastY;


function main() {
    const canvas = document.querySelector('canvas#identifyCanvas');
    const analyzeButton = document.querySelector('button#analyzeButton');
    const clearButton = document.querySelector('button#clearButton');
    const resultText = document.querySelector('#analyzedResult');

    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = penSize;
    ctx.strokeStyle = 'black';

    canvas.addEventListener('mousedown', (event) => {
        drawing = true;
        [lastX, lastY] = [event.offsetX, event.offsetY];
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
    });

    canvas.addEventListener('mousemove', (event) => {
        if (drawing) {
            const x = event.offsetX;
            const y = event.offsetY;

            ctx.lineWidth = penSize;
            ctx.strokeStyle = 'black';

            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, y);
            ctx.stroke();

            [lastX, lastY] = [x, y];
        }
    });

    canvas.addEventListener('mouseup', () => {
        drawing = false;
        ctx.closePath();
    });

    canvas.addEventListener('mouseleave', () => {
        drawing = false;
        ctx.closePath();
    });

    canvas.addEventListener('mouseenter', () => {
        ctx.beginPath();
    });

    clearButton.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        resultText.textContent = '';
    })

    analyzeButton.addEventListener('click', event => {
        const grid = convertCanvasToGrid(canvas);

        if (grid.every(row => row.every(value => value === 0))) {
            return;
        }
        
        fetch('/analyze_image', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify({image: grid}),
        })
        .then(response => response.json())
        .then(data => {
            resultText.textContent = data.number;
        })
    })
}

function convertCanvasToGrid(canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const cellSize = canvas.width / gridSize;
    const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(1)); // Default to white

    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const startX = Math.floor(x * cellSize);
            const startY = Math.floor(y * cellSize);
            const endX = Math.ceil((x + 1) * cellSize);
            const endY = Math.ceil((y + 1) * cellSize);
            
            let totalPixels = 0;
            let blackPixels = 0;

            for (let j = startY; j < endY; j++) {
                for (let i = startX; i < endX; i++) {
                    if (i < canvas.width && j < canvas.height) { // Check bounds
                        const index = (j * canvas.width + i) * 4;
                        const r = data[index];
                        const g = data[index + 1];
                        const b = data[index + 2];
                        const a = data[index + 3];
                        if (a > 0) { // Pixel is not fully transparent
                            totalPixels++;
                            if (r < 128 && g < 128 && b < 128) {
                                blackPixels++;
                            }
                        }
                    }
                }
            }

            // If more than half of the pixels in the cell are black, mark the cell as black (0)
            grid[y][x] = (blackPixels / totalPixels > 0.5) ? 1 : 0;
        }
    }

    return grid;
}

document.addEventListener('DOMContentLoaded', () => {
    main();
});