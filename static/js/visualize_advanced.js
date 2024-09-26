function main() {
    const numberInput = document.querySelector('input#numberInput');
    const generateButton = document.querySelector('button#generateButton');
    const imageDisplay = document.querySelector('.image-container');
    const resultText = document.querySelector('#resultText');
    const loadingSpinner = document.querySelector('.loading');
    const resultInfo = document.querySelector('.result-info');
    let image;
    let zoom = 1;

    generateButton.addEventListener('click', () => {
        loadingSpinner.style.display = 'block';
        resultInfo.style.display = 'none';

        let number = numberInput.value;
        number = number === '' ? Math.floor(Math.random() * 10) : Number.parseInt(number);
        
        fetch('/visualize_advanced', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify({number: number})
        })
        .then(response => response.json())
        .then(data => {
            // const url = URL.createObjectURL(blob);
            const url = `data:image/png;base64,${data.image}`;
            const img = document.createElement('img');

            img.src = url;
            imageDisplay.innerHTML = '';
            imageDisplay.insertBefore(img, imageDisplay.firstChild);
            resultText.textContent = number;

            image = img;
            loadingSpinner.style.display = 'none';
            resultInfo.style.display = 'flex';

            img.addEventListener('load', () => {
                URL.revokeObjectURL(url);
            })
        })
        .catch(error => console.error('Error fetching the image:', error));
    })

    imageDisplay.addEventListener('mousemove', event => zoomImage(event, image, imageDisplay));
    imageDisplay.addEventListener('mouseover', event => {
        zoomImage(event, image, imageDisplay);
        image.style.transform = `scale(${zoom})`;
    });

    imageDisplay.addEventListener('mouseout', function() {
        image.style.transform = 'scale(1)';
    });

    imageDisplay.addEventListener('click', () => {
        if (zoom >= 10) {
            zoom = 1;
        } else {
            zoom += 2;
        }

        image.style.transform = `scale(${zoom})`;
    })
}

function zoomImage(event, image, display) {
    const { left, top, width, height } = display.getBoundingClientRect();
    const { clientX, clientY } = event;
    
    // Calculate mouse position relative to the image
    const x = (clientX - left) / width * 100;
    const y = (clientY - top) / height * 100;

    image.style.transformOrigin = `${x}% ${y}%`;
}

document.addEventListener('DOMContentLoaded', () => {
    main()
})