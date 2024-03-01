
import * as tf from "@tensorflow/tfjs";

const DEFAULT_OBJECT = {
    "name": "sku",
    "color_style": "lime"
}

const get_box_coords = (image, box) => {

    const [y, x, height, width] = box
    const [image_height, image_width] = [image.shape[0], image.shape[1]]

    const resized_coords = {
        "min_y": y * image_height,
        "min_x": x * image_width,
        "max_y": height * image_height,
        "max_x": width * image_width
    }

    const box_coords = {
        "x": resized_coords["min_x"],
        "y": resized_coords["min_y"],
        "width": resized_coords["max_x"] - resized_coords["min_x"],
        "height": resized_coords["max_y"] - resized_coords["min_y"],

    }

    return box_coords
}

const classify_product = async (model_classification, image, box) => {

    const box_coords = get_box_coords(image, box)

    try {

        const product_img = image.slice([parseInt(box_coords["y"]), parseInt(box_coords['x']), 0], [parseInt(box_coords['height']), parseInt(box_coords['width']), -1])

        const product_img_processed = tf.image.resizeBilinear(product_img, model_classification['target_size']).cast(model_classification['dtype']).div(255).expandDims(0)

        const output = await model_classification['model'].predict(product_img_processed)
        const idx_max_value = output.argMax(1).dataSync()[0]
        const max_value = output.dataSync()[idx_max_value]

        tf.dispose(product_img)
        tf.dispose(product_img_processed)
        tf.dispose(output)

        if (max_value >= model_classification['threshold_classification']) {
            console.log(model_classification['index_to_class'][idx_max_value])
            return {
                "name": `${model_classification['index_to_class'][idx_max_value]} - ${(max_value * 100).toFixed(2)}%`,
                "color_style": model_classification['colors_styles'][idx_max_value],
                "box": box_coords
            }
        }

    } catch (error) {
        console.error(`Error trying to classify product, ${error.message}`);
    }

    return {
        ...DEFAULT_OBJECT,
        "box": box_coords
    }

}

const draw_box = (product, ctx) => {

    ctx.strokeStyle = product['color_style']
    ctx.lineWidth = 1
    ctx.fillStyle = 'white'
    ctx.font = '16px sans-serif'

    ctx.beginPath()
    ctx.fillText(product['name'], product['box']['x'], product['box']['y'] - 10)
    ctx.rect(product['box']['x'], product['box']['y'], product['box']['width'], product['box']['height']);
    ctx.stroke()
}

export const get_unique_colors = (num_colors) => {

    const colors = [];
    const seen = new Set();

    while (colors.length < num_colors) {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);

        const hexColor = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);

        if (!seen.has(hexColor)) {
            seen.add(hexColor);
            colors.push(hexColor);
        }
    }

    return colors;
}

export const draw_objects = async (
    image,
    boxes,
    classes,
    scores,
    model_classification,
    threshold_detection,
    ctx) => {
    
    
    const filtered_scores = scores.greater(threshold_detection)
    const filtered_boxes = await tf.booleanMaskAsync(boxes, filtered_scores)
    const actual_boxes = filtered_boxes.arraySync()
    
    tf.dispose(filtered_scores)
    tf.dispose(filtered_boxes)

    for (let i = 0; i < actual_boxes.length; i++) {
        const product = await classify_product(model_classification, image, actual_boxes[i])

        requestAnimationFrame(() => {
            draw_box(product, ctx)
        })

    }

}