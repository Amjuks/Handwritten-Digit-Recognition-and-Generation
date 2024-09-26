import io
import base64
import numpy as np
import traceback

import tensorflow as tf

from flask import Flask, render_template, request, jsonify, Response
from PIL import Image

from utils.visualize import get_layer_outputs, get_intermediate_outputs, visualize_intermediate_outputs

LARGE_IMAGE_SIZE = (280, 280)

analyzer_model = tf.keras.models.load_model("models/identifier.h5") 
generate_normal_model = tf.keras.models.load_model("models/normal_gan.h5", compile=False) 
generate_advanced_model = tf.keras.models.load_model("models/advanced_gan.keras", compile=False)

advanced_layer_outputs = get_layer_outputs(generate_advanced_model)

app = Flask(__name__)

def generate_normal_image():
    noise = tf.random.normal([1, 100])
    image_array = generate_normal_model.predict(noise)

    return prediction_to_png(image_array)

def generate_advanced_image(labels):
    noise = tf.random.normal([1, 100])
    # labels = tf.keras.utils.to_categorical([[number]], 10)
    image_array = generate_advanced_model.predict([labels, noise])

    return prediction_to_png(image_array)

def prediction_to_png(image_array):

    # Ensure the image is in the expected format (e.g., 28x28 for MNIST)
    image_array = np.squeeze(image_array, axis=0)
    
    # Normalize and scale the image array
    image_array = (image_array + 1) / 2.0 * 255
    image_array = np.clip(image_array, 0, 255).astype(np.uint8)
    
    # Convert grayscale to RGB
    if image_array.ndim == 2:
        image_array = np.expand_dims(image_array, axis=-1)  # Add channel dimension for grayscale
    elif image_array.ndim == 3 and image_array.shape[-1] == 1:
        image_array = np.concatenate([image_array] * 3, axis=-1)  # Convert grayscale to RGB
    
    # Convert to PIL Image
    image_pil = Image.fromarray(image_array.squeeze(), mode='RGB' if image_array.shape[-1] == 3 else 'L')
    
    # Resize image
    image_pil = image_pil.resize(LARGE_IMAGE_SIZE, Image.LANCZOS)
    
    img_io = io.BytesIO()
    image_pil.save(img_io, 'PNG')
    img_io.seek(0)

    return img_io

def mixed_labels(numbers):

    arr = np.zeros(10)
    for number in numbers:
        arr[number] = 1
    return tf.convert_to_tensor(arr.reshape(1, -1), dtype=tf.float32)

def encode_image_to_base64(image_buffer):
    image_bytes = image_buffer.read()
    return base64.b64encode(image_bytes).decode('utf-8')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze_image', methods=['POST'])
def analyze_image():
    image = np.reshape(request.json['image'], (1, 28, 28, 1))

    analyzations = list(analyzer_model.predict(image)[0])
    result = analyzations.index(max(analyzations))

    return jsonify({'number': result})

@app.route('/generate_normal', methods=['GET', 'POST'])
def generate_normal():
    if request.method == 'GET':
        return render_template('generate_normal.html')
    
    elif request.method == 'POST':

        image = generate_normal_image()
        return Response(image, mimetype='image/png')
    
@app.route('/generate_advanced', methods=['GET', 'POST'])
def generate_advanced():
    if request.method == 'GET':
        return render_template('generate_advanced.html')
    
    elif request.method == 'POST':
        try:
            numbers = int(request.json['numbers'])
            numbers = [int(i) for i in str(numbers)]
            
            if 'mixed' in request.json:
                labels = [mixed_labels(numbers)]
            else:
                labels = [tf.keras.utils.to_categorical([[number]], 10) for number in numbers]
            
            images = [encode_image_to_base64(generate_advanced_image(label)) for label in labels]
            
            return jsonify({'images': images})
        
        except Exception as e:
            traceback.print_exc()

@app.route('/visualize_advanced', methods=['GET', 'POST'])
def visualize_advanced():
    if request.method == 'GET':
        return render_template('visualize_advanced.html')
    
    elif request.method == 'POST':
        number = request.json['number']

        noise = tf.random.normal([1, 100])
        labels = tf.keras.utils.to_categorical([[number]], 10)

        # Get intermediate outputs
        generator_intermediate_outputs = get_intermediate_outputs(advanced_layer_outputs, [labels, noise])

        # Visualize the intermediate outputs
        image = visualize_intermediate_outputs(generator_intermediate_outputs)

        return jsonify({'image': encode_image_to_base64(image)})