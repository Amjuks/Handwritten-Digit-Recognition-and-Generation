function main() {
    const imageDisplay = document.querySelector('.image-container');
    const generateButton = document.querySelector('#generateButton');

    generateButton.addEventListener('click', () => {
        fetch('/generate_normal', {
            method: 'POST'
        })
        .then(response => response.blob())
        .then(blob => {
            const url = URL.createObjectURL(blob);
            const img = document.createElement('img');
            
            img.src = url;
            // imageDisplay.innerHTML = '';
            imageDisplay.insertBefore(img, imageDisplay.firstChild);

            img.addEventListener('load', () => {
                URL.revokeObjectURL(url);
            })
        })
        .catch(error => console.error('Error fetching the image:', error));
    })
}

document.addEventListener('DOMContentLoaded', () => {
    main();
});