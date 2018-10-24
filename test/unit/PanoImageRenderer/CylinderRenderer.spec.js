import {createPanoImageRenderer, renderAndCompareSequentially} from "../util";
import PanoViewer from "../../../src/PanoViewer/PanoViewer";
import WebGLUtils from "../../../src/PanoImageRenderer/WebGLUtils";
import {PROJECTION_TYPE} from "../../../src/PanoViewer/consts";
import CylinderRenderer from "../../../src/PanoImageRenderer/renderer/CylinderRenderer";
import {glMatrix} from "../../../src/utils/math-util.js";

const WEBGL_AVAILABILITY = WebGLUtils.isWebGLAvailable();
const IT = WEBGL_AVAILABILITY ? it : it.skip;

// Sub test cases of PanoImageRenderer.spec.js
describe("CylinderRenderer", () => {
	describe("Construction", () => {
		IT("Shader data should be initialized after image is bound", async () => {
			// Given
			const expectedVertexDataBeforeTextureBound = false;
			const expectedVertexDataAfterTextureBound = true;
			let isTypeValid = false;

			const renderer = createPanoImageRenderer("./images/PanoViewer/Panorama/smartphone-panorama-picture.jpg", false, PROJECTION_TYPE.PANORAMA, {});

			const projRenderer = renderer.getProjectionRenderer();

			isTypeValid = projRenderer instanceof CylinderRenderer;
			const vertexDataBeforeTextureBound = projRenderer.getVertexPositionData().length > 0;

			// When
			await renderer.bindTexture();
			const vertexDataAfterTextureBound = projRenderer.getVertexPositionData().length > 0;

			// Then
			expect(isTypeValid).to.be.equal(true);
			expect(vertexDataBeforeTextureBound).to.be.equal(expectedVertexDataBeforeTextureBound);
			expect(vertexDataAfterTextureBound).to.be.equal(expectedVertexDataAfterTextureBound);
		});
	});

	describe("Ratio of panorma image", () => {
		const CIRCULAR_BANDS_COUNT = 61;
		const VERTEX_PAIRS_COUNT = 3;

		IT("Cylider height should be depend on aspect ratio of image if image ratio is bigger or equal than 6:1", async () => {
			// Given
			const renderer = createPanoImageRenderer("./images/PanoViewer/Panorama/smartphone-panorama-picture.jpg", false, PROJECTION_TYPE.PANORAMA, {});

			// When
			await renderer.bindTexture();

			const image = renderer.getContent();
			const aspectRatio = image.naturalWidth / image.naturalHeight;
			const projRenderer = renderer.getProjectionRenderer();
			const vertexData = projRenderer.getVertexPositionData();

			// 1 means index of y.
			const lowY = vertexData[1];
			const highY = vertexData[CIRCULAR_BANDS_COUNT * VERTEX_PAIRS_COUNT + 1];
			const fov = 360 / aspectRatio;
			const halfCylinderY = Math.tan(glMatrix.toRadian(fov / 2));

			// Then
			expect(aspectRatio).to.be.above(6);
			expect(highY - lowY).to.be.equal(halfCylinderY * 2);
		});

		IT("Cylider height should be 1 if image ratio is smaller than 6:1", async () => {
			// Given
			const renderer = createPanoImageRenderer("./images/PanoViewer/Panorama/half-panorama.jpg", false, PROJECTION_TYPE.PANORAMA, {});

			// When
			await renderer.bindTexture();

			const image = renderer.getContent();
			const aspectRatio = image.naturalWidth / image.naturalHeight;
			const projRenderer = renderer.getProjectionRenderer();
			const vertexData = projRenderer.getVertexPositionData();

			// 1 means index of y.
			const lowY = vertexData[1];
			const highY = vertexData[CIRCULAR_BANDS_COUNT * VERTEX_PAIRS_COUNT + 1];

			// Then
			expect(aspectRatio).to.be.below(6);
			expect(highY - lowY).to.be.equal(1);
		});
	});

	describe("Rendering Test", () => {
		const deviceRatio = window.devicePixelRatio;
		const suffix = `_${deviceRatio}x.png`;

		function calcMaxFov(renderer) {
			const image = renderer.getContent();
			const aspectRatio = image.naturalWidth / image.naturalHeight;

			return (aspectRatio < 6 ?
				glMatrix.toDegree(Math.atan(0.5)) * 2 : (360 / aspectRatio)).toFixed(5); // Make it 5 fixed as axes does.
		}

		IT("Test if image is aligned center by different aspect ratio.", async () => {
			// Given
			let maxFov;
			const renderer = createPanoImageRenderer("./images/PanoViewer/Panorama/smartphone-panorama-picture.jpg", false, PROJECTION_TYPE.PANORAMA, {});

			// When
			/**
			 * First Image Test (aspect ratio >= 6.0)
			 */
			await renderer.bindTexture();
			maxFov = calcMaxFov(renderer);
			renderer.render();

			const result1 = await renderAndCompareSequentially(renderer, [[0, 0, maxFov, `./images/PanoViewer/Panorama/smartphone-panorama-picture-init${suffix}`]]);

			/**
			 * Second Image Test (aspect ratio < 6.0)
			 */
			renderer.setImage({
				image: "./images/PanoViewer/Panorama/half-panorama.jpg",
				imageType: PROJECTION_TYPE.PANORAMA
			});

			await renderer.bindTexture();
			maxFov = calcMaxFov(renderer);
			renderer.render();

			const result2 = await renderAndCompareSequentially(renderer, [[0, 0, maxFov, `./images/PanoViewer/Panorama/half-panorama-init${suffix}`]]);

			// Then
			expect(result1.success).to.be.equal(true);
			expect(result2.success).to.be.equal(true);
		});
	});

	describe("PanoViewer Test", () => {
		function calcMaxFov(viewer) {
			const image = viewer.getImage();
			const aspectRatio = image.naturalWidth / image.naturalHeight;

			return +(aspectRatio < 6 ?
				glMatrix.toDegree(Math.atan(0.5)) * 2 : (360 / aspectRatio)).toFixed(5); // Make it 5 fixed as axes does.
		}

		it("Fov, FovRange should be updated by image's aspect ratio", async () => {
			const target = sandbox();

			/**
			 * Given / When
			 *
			 * Set image of different aspect ratio each time.
			 */
			// More or equal than 6 : 1
			const viewer = new PanoViewer(target, {
				image: "./images/PanoViewer/Panorama/half-panorama.jpg",
				projectionType: PROJECTION_TYPE.PANORAMA
			});

			await new Promise(res => viewer.on("ready", res));

			const fov1 = viewer.getFov();
			const maxFov1 = +viewer.getFovRange()[1].toFixed(5);
			const maxFovByAspectRatio1 = calcMaxFov(viewer);


			// Set less than 6:1
			viewer.setImage("./images/PanoViewer/Panorama/smartphone-panorama-picture.jpg", {
				projectionType: PROJECTION_TYPE.PANORAMA
			});

			await new Promise(res => viewer.on("ready", res));

			const fov2 = viewer.getFov();
			const maxFov2 = +viewer.getFovRange()[1].toFixed(5);
			const maxFovByAspectRatio2 = calcMaxFov(viewer);

			// Then
			expect(maxFov1).to.be.equal(maxFovByAspectRatio1);
			expect(maxFov1).to.be.equal(fov1);

			expect(maxFov2).to.be.equal(maxFovByAspectRatio2);
			expect(maxFov2).to.be.equal(fov2);

			cleanup();
		});
	});
});
