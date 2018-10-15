import Renderer from "./Renderer";
import WebGLUtils from "../WebGLUtils";

// const latitudeBands = 60;
const longitudeBands = 60;
const radius = 1;

const textureCoordData = [];
const vertexPositionData = [];
const indexData = [];

let lngIdx;

const MAX_CYLIDER_Y = Math.tan(30 * Math.PI / 180);
const MIN_CYLIDER_Y = -MAX_CYLIDER_Y;

const CYLIDER_Y = [MIN_CYLIDER_Y, MAX_CYLIDER_Y];

for (let yIdx = 0, yLength = CYLIDER_Y.length; yIdx < yLength/* bottom & top */; yIdx++) {
	for (lngIdx = 0; lngIdx <= longitudeBands; lngIdx++) {
		const phi = (lngIdx / longitudeBands - 0.5) * 2 * Math.PI;
		const sinPhi = Math.sin(phi);
		const cosPhi = Math.cos(phi);
		const x = cosPhi;
		const y = CYLIDER_Y[yIdx];
		const z = sinPhi;
		const u = lngIdx / longitudeBands;
		const v = yIdx / (yLength - 1);

		textureCoordData.push(u, v);
		vertexPositionData.push(radius * x, radius * y, radius * z);

		if (yIdx === 0 && lngIdx < longitudeBands) {
			const a = lngIdx;
			const b = a + longitudeBands + 1;

			indexData.push(a, b, a + 1, b, b + 1, a + 1);
		}
	}
}

export default class CylinderRenderer extends Renderer {
	static _VERTEX_POSITION_DATA = vertexPositionData;
	static _TEXTURE_COORD_DATA = textureCoordData;
	static _INDEX_DATA = indexData;
	getVertexPositionData() {
		return CylinderRenderer._VERTEX_POSITION_DATA;
	}

	getIndexData() {
		return CylinderRenderer._INDEX_DATA;
	}

	getTextureCoordData() {
		return CylinderRenderer._TEXTURE_COORD_DATA;
	}

	getVertexShaderSource() {
		return `
			attribute vec3 aVertexPosition;
			attribute vec2 aTextureCoord;
			uniform mat4 uMVMatrix;
			uniform mat4 uPMatrix;
			varying highp vec2 vTextureCoord;
			void main(void) {
				gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
				vTextureCoord = aTextureCoord;
			}`;
	}

	getFragmentShaderSource() {
		return `
			varying highp vec2 vTextureCoord;
			uniform sampler2D uSampler;
			void main(void) {
				gl_FragColor = texture2D(
					uSampler,
					vec2(vTextureCoord.s, vTextureCoord.t)
				);
			}`;
	}

	updateTexture(gl, image) {
		WebGLUtils.texImage2D(gl, gl.TEXTURE_2D, this._getPixelSource(image));
	}

	bindTexture(gl, texture, image) {
		// Make sure image isn't too big
		const {width, height} = this.getDimension(image);
		const size = Math.max(width, height);
		const maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);

		if (size > maxSize) {
			this._triggerError(`Image width(${width}) exceeds device limit(${maxSize}))`);
			return;
		}

		// Pixel Source for IE11 & Video
		this._initPixelSource(image);

		gl.activeTexture(gl.TEXTURE0);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.bindTexture(gl.TEXTURE_2D, texture);

		this.updateTexture(gl, image);
	}
}
