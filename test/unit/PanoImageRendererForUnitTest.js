import PanoImageRenderer from "../../src/PanoImageRenderer/PanoImageRenderer";

const DEBUG_CONTEXT_ATTRIBUTES = {
	preserveDrawingBuffer: true,
	antialias: false,
	premultipliedAlpha: false
};

/**
 *
 */
export default class PanoImageRendererForUnitTest extends PanoImageRenderer {
	constructor(image, width, height, isVideo, sphericalConfig) {
		super(image, width, height, isVideo, sphericalConfig, DEBUG_CONTEXT_ATTRIBUTES);
	}
}
