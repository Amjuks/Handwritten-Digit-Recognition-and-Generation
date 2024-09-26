function main() {
    const numberInput = document.querySelector('input#numberInput');
    const generateButton = document.querySelector('button#generateButton');
    const generateMixed = document.querySelector('button#generateMixed');
    const imageDisplay = document.querySelector('.image-container');
    const resultText = document.querySelector('#resultText');

    generateButton.addEventListener('click', () => {
        let number = numberInput.value;
        number = number === '' ? Math.floor(Math.random() * 999999) : Number.parseInt(number);
        
        fetch('/generate_advanced', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify({numbers: number})
        })
        .then(response => response.json())
        .then(data => {
            imageDisplay.innerHTML = '';

            data.images.forEach(image => {
                const url = `data:image/png;base64,${image}`;
                const img = document.createElement('img');
                img.src = url;

                image = img;
                imageDisplay.appendChild(img);
            });
                        
            resultText.textContent = number;

        })
        .catch(error => console.error('Error fetching the image:', error));
    })

    generateMixed.addEventListener('click', () => {
        const numbers = Math.floor(Math.random() * 999);

        fetch('/generate_advanced', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify({mixed: true, numbers: numbers})
        })
        .then(response => response.json())
        .then(data => {
            imageDisplay.innerHTML = '';

            data.images.forEach(image => {
                const url = `data:image/png;base64,${image}`;
                const img = document.createElement('img');
                img.src = url;

                imageDisplay.appendChild(img);
            })
            
            // imageDisplay.insertBefore(img, imageDisplay.firstChild);
            resultText.textContent = numbers.toString().split('').join('+');
        })
        .catch(error => console.error('Error fetching the image:', error));
    })
}

document.addEventListener('DOMContentLoaded', () => {
    main()
})