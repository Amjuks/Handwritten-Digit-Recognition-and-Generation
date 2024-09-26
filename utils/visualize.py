import io
import numpy as np
import tensorflow as tf

import matplotlib
import matplotlib.pyplot as plt

from PIL import Image
from tensorflow.keras.models import Model

matplotlib.use('Agg')

def get_layer_outputs(model):
    """
    Create a model that outputs the intermediate outputs of each layer.
    
    Parameters:
    model (tf.keras.Model): The Keras model to extract layer outputs from.
    
    Returns:
    dict: A dictionary where keys are layer names and values are the corresponding layer output models.
    """
    layer_outputs = {}
    for layer in model.layers:
        if hasattr(layer, 'output'):
            intermediate_model = Model(inputs=model.input, outputs=layer.output)
            layer_outputs[layer.name] = intermediate_model
    return layer_outputs

def get_intermediate_outputs(layer_outputs, input_data):
    """
    Get outputs for each layer given input data.
    
    Parameters:
    layer_outputs (dict): Dictionary of layer names to models that output intermediate layers' outputs.
    input_data (np.ndarray): Input data to pass through the models.
    
    Returns:
    dict: A dictionary where keys are layer names and values are the corresponding outputs.
    """
    intermediate_results = {}
    for layer_name, model in layer_outputs.items():
        intermediate_results[layer_name] = model.predict(input_data)
    return intermediate_results

def get_layer_name(layer):
    if layer == 'input_layer':
        return "Number Input"
    
    if layer == "input_layer_1":
        return "Random Noise"

    return ' '.join(name for name in layer.split('_') if not name.isdigit()).title()

def visualize_intermediate_outputs(outputs, num_cols=4):
    """
    Visualize the intermediate outputs of each layer.

    Parameters:
    outputs (dict): A dictionary where keys are layer names and values are the corresponding outputs.
    num_cols (int): Number of columns in the visualization grid.
    """
    num_layers = len(outputs)
    num_rows = (num_layers + num_cols - 1) // num_cols
    
    figsize = 10
    plt.figure(figsize=(figsize, figsize))
    
    for i, (layer_name, output) in enumerate(outputs.items()):
        plt.subplot(num_rows, num_cols, i + 1)
        plt.title(get_layer_name(layer_name))
        
        # Check if output is an image-like tensor
        if output.ndim == 4:  # Example: (None, height, width, channels)
            # continue

            # Visualize only the first example in the batch
            img = output[0]
            
            # For layers with multiple channels, visualize the first channel
            if img.shape[-1] > 1:
                img = img[:, :, 0]
            
            plt.imshow(img, cmap='viridis')
        
        # Handle other types of outputs
        else:

            if output.shape[1] == 10:
                output = output.reshape(1, -1)
                plt.xticks(np.arange(0, len(output[0]) + 1))
                plt.yticks([])
                plt.imshow(output)
                continue

            elif output.shape[1] == 110:
                output = output.reshape((11, 10))

            else:
                side_length = int(np.sqrt(output.shape[1]))
                output = output.reshape((side_length, side_length))

            plt.imshow(output)
        
        plt.axis('off')
    
    plt.subplots_adjust(wspace=0.04, hspace=0.35)
    buffer = io.BytesIO()
    plt.savefig(buffer, dpi=500)
    buffer.seek(0)

    return buffer

if __name__ == '__main__':
    
    # Initialize the model
    model = tf.keras.models.load_model("../models/advanced_mnist_gan.keras", compile=False)

    layer_outputs = get_layer_outputs(model)

    # inputs
    number = np.random.randint(10)
    noise = tf.random.normal([1, 100])
    labels = tf.keras.utils.to_categorical([[number]], 10)

    # Get intermediate outputs
    generator_intermediate_outputs = get_intermediate_outputs(layer_outputs, [labels, noise])

    # Visualize the intermediate outputs
    visualize_intermediate_outputs(generator_intermediate_outputs)