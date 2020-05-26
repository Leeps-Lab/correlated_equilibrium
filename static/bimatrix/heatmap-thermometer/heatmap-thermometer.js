import {html,PolymerElement} from '/static/otree-redwood/node_modules/@polymer/polymer/polymer-element.js';
import {get_gradient_color} from '../color.js';
// other imports go here

export class HeatmapThermometer extends PolymerElement {

    static get template() {
        return html `
            <style>
                canvas {
                    border: 1px black solid;
                    width: 20px;
                    height: 100%;
                }
            </style>

            <canvas></canvas>
        `
    }

    static get properties() {
        return {
            color: {
                type: String,
                observer: 'make_thermometer',
            },
        }
    }

    make_thermometer() {
        if (!this.color)
            return

        const canvas = this.shadowRoot.querySelector('canvas')
        const w = canvas.width
        const h = canvas.height
        const ctx = canvas.getContext('2d')

        // create empty imageData object
        const imageData = ctx.createImageData(w, h)
        const data = imageData.data

        for (let row = 0; row < h; row++) {
            const point_color = get_gradient_color(1 - (row / h), this.color);
            for (let col = 0; col < w; col++) {
                const index = (row * w * 4) + (col * 4)
                data[index] = point_color[0]
                data[index + 1] = point_color[1]
                data[index + 2] = point_color[2]
                // set alpha channel to fully opaque
                data[index + 3] = 255
            }
        }

        ctx.putImageData(imageData, 0, 0);
    }
}

window.customElements.define('heatmap-thermometer', HeatmapThermometer);
