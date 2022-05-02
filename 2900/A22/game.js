/*
game.js for Perlenspiel 3.3.x
Last revision: 2022-03-15 (BM)

Perlenspiel is a scheme by Professor Moriarty (bmoriarty@wpi.edu).
This version of Perlenspiel (3.3.x) is hosted at <https://ps3.perlenspiel.net>
Perlenspiel is Copyright © 2009-22 Brian Moriarty.
This file is part of the standard Perlenspiel 3.3.x devkit distribution.

Perlenspiel is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Perlenspiel is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Lesser General Public License for more details.

You may have received a copy of the GNU Lesser General Public License
along with the Perlenspiel devkit. If not, see <http://www.gnu.org/licenses/>.

CREDITS:
Cover image created with the use of Canva.com
Egg collection sound: https://freesound.org/people/rhodesmas/sounds/320655/
Leprechaun laugh: https://freesound.org/people/insanity54/sounds/325462/
Leprechaun steal: https://freesound.org/people/petenice/sounds/9509/
Background music: https://pixabay.com/music/solo-piano-alexanders-ragtime-band-live-recorded-piano-music-7934/
Victory sound: https://freesound.org/people/Fupicat/sounds/521643/
Lose sound: https://freesound.org/people/TaranP/sounds/362205/
Chick chirp: https://freesound.org/people/basedMedia/sounds/548096/
Thud: https://freesound.org/people/hy96/sounds/48170/

*/

/*
This JavaScript file is a template for creating new Perlenspiel 3.3.x games.
Any unused event-handling function templates can be safely deleted.
Refer to the tutorials and documentation at <https://ps3.perlenspiel.net> for details.
*/

/*
The following comment lines are for JSHint <https://jshint.com>, a tool for monitoring code quality.
You may find them useful if your development environment is configured to support JSHint.
If you don't use JSHint (or are using it with a configuration file), you can safely delete these two lines.
*/

/* jshint browser : true, devel : true, esversion : 6, freeze : true */
/* globals PS : true */

"use strict"; // Do NOT remove this directive!

const G = (function () {
	var exports = {
		ticks: 0,
		cam: {
			desX: 0.0,
			desY: 0.0,
			x: 0.0,
			y: 0.0,
			target: {
				x: 0.0,
				y: 0.0,
			}
		},
		visibleObjects: [],
		hiddenObjects: [],
		spyglass: {
			x: 0.0,
			y: 0.0,
			afterimage: []
		},
		assets: {
			lensImage: null,
			spyglassImage: null,
			objects: [],
		},
		eggs: [],
		lepAnim: null,
		eggFlash: 0,
		timeTotal: 7500,
		timeRemaining: 7500,

		tick: () => {

			G.spyglass.afterimage.push({ x: G.spyglass.x, y: G.spyglass.y });
			G.spyglass.afterimage = G.spyglass.afterimage.slice(-6);

			if (G.timeRemaining > 0) {
				const timerBefore = G.timeRemaining / G.timeTotal;

				G.timeRemaining -= 1;

				if (G.timeRemaining === 0) {
					if (G.eggs.length < 16) {
						PS.audioPlay("lose", { fileTypes: ["mp3", "ogg"], path: "audio/", volume: 0.25 });
					}
				}

				const timerAfter = G.timeRemaining / G.timeTotal;

				if (timerBefore >= 1.0 && timerAfter < 1.0) {
					PS.audioPlay("clock", { fileTypes: ["mp3", "ogg"], path: "audio/", volume: 0.25 });
				} else if (timerBefore > 0.75 && timerAfter <= 0.75) {
					PS.audioPlay("clock", { fileTypes: ["mp3", "ogg"], path: "audio/", volume: 0.25 });
				} else if (timerBefore > 0.5 && timerAfter <= 0.5) {
					PS.audioPlay("clock", { fileTypes: ["mp3", "ogg"], path: "audio/", volume: 0.25 });
				} else if (timerBefore > 0.25 && timerAfter <= 0.25) {
					PS.audioPlay("clock", { fileTypes: ["mp3", "ogg"], path: "audio/", volume: 0.25 });
				}

				if (G.cam.target !== null) {
					const camTarget = G.cam.target;

					const camDx = camTarget.x - G.cam.x;
					const camDy = camTarget.y - G.cam.y;
					const camDist = Math.sqrt(camDx * camDx + camDy * camDy);

					let slowdown = false;
					if (G.lepAnim !== null) {
						if (G.lepAnim.y >= 0) {
							slowdown = true;
						}
					}

					let camSpeed = slowdown ? 0.001 : 0.2;

					if (camDist < camSpeed) {
						if (G.hiddenObjects.length > 0) {
							G.cam.target = G.hiddenObjects[PS.random(G.hiddenObjects.length) - 1];
						}
					} else {
						G.cam.desX += camDx / camDist * camSpeed;
						G.cam.desY += camDy / camDist * camSpeed;
					}

					const dx = (G.cam.desX - G.cam.x) * (slowdown ? 0.01 : 0.025);
					const dy = (G.cam.desY - G.cam.y) * (slowdown ? 0.01 : 0.025);

					G.cam.x += dx;
					G.cam.y += dy;

					for (let i = 0; i < G.spyglass.afterimage.length; i++) {
						G.spyglass.afterimage[i].x -= dx;
						G.spyglass.afterimage[i].y -= dy;
					}
				}
			}

			if (G.lepAnim !== null) {
				const dx = G.lepAnim.target.x - G.lepAnim.x;
				const dy = G.lepAnim.target.y - G.lepAnim.y;

				const dist = Math.pow(dx * dx + dy * dy, 0.4);

				G.lepAnim.x += dx / Math.max(dist / 0.6, 1.0);
				G.lepAnim.y += dy / Math.max(dist / 0.6, 1.0);

				if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
					G.lepAnim.x = G.lepAnim.target.x;
					G.lepAnim.y = G.lepAnim.target.y;

					if (G.lepAnim.target.y >= 0) {
						G.lepAnim.target.x = PS.random(40) - 4;
						G.lepAnim.target.y = -2;

						G.eggs.pop();
						G.eggFlash = 0;
						PS.audioPlay("lepSteal", { fileTypes: ["mp3", "ogg"], path: "audio/", volume: 0.4 });
					} else {
						G.lepAnim = null;
					}
				}
			}

			if (G.eggFlash > 0) {
				G.eggFlash -= 1;
			}

			G.ticks += 1;

			G.render();
		},

		screenToWorld: (p) => {
			const worldX = p.x + Math.floor(G.cam.x) - PS.gridSize().width / 2;
			const worldY = p.y + Math.floor(G.cam.y) - PS.gridSize().height / 2;
			return { x: worldX, y: worldY };
		},

		worldToScreen: (p) => {
			const screenX = p.x - Math.floor(G.cam.x) + PS.gridSize().width / 2;
			const screenY = p.y - Math.floor(G.cam.y) + PS.gridSize().height / 2;
			return { x: screenX, y: screenY };
		},

		distance: (p1, p2) => {
			const dx = p1.x - p2.x;
			const dy = p1.y - p2.y;

			return Math.sqrt(dx * dx + dy * dy);
		},

		isInBounds: (p) => {
			return p.x >= 0 && p.x < PS.gridSize().width && p.y >= 0 && p.y < PS.gridSize().height;
		},

		inSpyglassAmount: (screenPos) => {

			if (G.assets.lensImage !== null) {
				const img = G.assets.lensImage;

				const dxFromCenter = G.spyglass.x - Math.floor(screenPos.x);
				const dyFromCenter = G.spyglass.y - Math.floor(screenPos.y);

				const x = Math.floor(img.width / 2) - dxFromCenter;
				const y = Math.floor(img.height / 2) - dyFromCenter;

				if (x >= 0 && y >= 0 && x < img.width && y < img.height) {
					const i = x + y * img.width;
					const a = img.data[i * 4 + 3];
					if (a > 0) {
						return 1.0;
					}
				}

				for (let si = G.spyglass.afterimage.length - 1; si >= 0; si--) {
					const dxFromCenter = G.spyglass.afterimage[si].x - Math.floor(screenPos.x);
					const dyFromCenter = G.spyglass.afterimage[si].y - Math.floor(screenPos.y);

					const x = Math.floor(img.width / 2) - dxFromCenter;
					const y = Math.floor(img.height / 2) - dyFromCenter;

					if (x >= 0 && y >= 0 && x < img.width && y < img.height) {
						const i = x + y * img.width;
						const a = img.data[i * 4 + 3];
						if (a > 0) {
							return 1 / Math.pow(1.5, (G.spyglass.afterimage.length - si));
						}
					}
				}

			}

			return false;
		},

		blendColors: (color1, color2, factor) => {
			const c1 = PS.unmakeRGB(color1, []);
			const c2 = PS.unmakeRGB(color2, []);

			return PS.makeRGB(
				c1[0] + (c2[0] - c1[0]) * factor,
				c1[1] + (c2[1] - c1[1]) * factor,
				c1[2] + (c2[2] - c1[2]) * factor
			);
		},

		drawSpyglassPixel: (screenPos, color) => {
			if (G.isInBounds(screenPos)) {
				const spyglassAmount = G.inSpyglassAmount(screenPos);
				if (spyglassAmount > 0) {
					PS.color(screenPos.x, screenPos.y, G.blendColors(PS.color(screenPos.x, screenPos.y, PS.CURRENT), color, spyglassAmount));
				}
			}
		},

		drawPixel: (screenPos, color, a = 1.0) => {
			if (G.isInBounds(screenPos)) {
				if (a !== 1.0) {
					PS.color(screenPos.x, screenPos.y, G.blendColors(PS.color(screenPos.x, screenPos.y, PS.CURRENT), color, Math.min(Math.max(a, 0.0), 1.0)));
				} else {
					PS.color(screenPos.x, screenPos.y, color);
				}
			}
		},

		drawPixelWithAlpha: (screenPos, color, a = 1.0) => {
			if (G.isInBounds(screenPos)) {
				if (a !== 1.0) {
					PS.color(screenPos.x, screenPos.y, G.blendColors(PS.color(screenPos.x, screenPos.y, PS.CURRENT), color, Math.min(Math.max(a, 0.0), 1.0)));
				} else {
					PS.color(screenPos.x, screenPos.y, color);
				}
				PS.alpha(screenPos.x, screenPos.y, PS.ALPHA_OPAQUE);
			}
		},

		getBGTileAt: (p) => {
			const veryGoodHash = Math.sin(p.x) + p.y;
			const val = G.badRandom(veryGoodHash) * 12;
			return PS.makeRGB(val / 2 + 160, Math.min(Math.max(val + 220, 0), 255), 140);
		},

		render: () => {
			PS.gridPlane(0);
			for (let screenX = 0; screenX < PS.gridSize().width; screenX++) {
				for (let screenY = 0; screenY < PS.gridSize().height; screenY++) {
					const worldPos = G.screenToWorld({ x: screenX, y: screenY });

					PS.color(screenX, screenY, G.getBGTileAt(worldPos));
				}
			}

			for (let i in G.visibleObjects) {
				const obj = G.visibleObjects[i];

				const screenPos = G.worldToScreen(obj);

				switch (obj.type) {
					case "TEST1":
						for (let dx = -2; dx <= 2; dx++) {
							for (let dy = -2; dy <= 2; dy++) {
								G.drawPixel({ x: screenPos.x + dx, y: screenPos.y + dy }, G.blendColors(PS.COLOR_GREEN, PS.COLOR_BLACK, 0.6));
							}
						}
						break;
					default:
						const img = G.assets.objects[obj.type];
						if (img !== undefined) {

							for (let y = 0; y < img.height; y++) {
								for (let x = 0; x < img.width; x++) {
									const i = x + y * img.width;
									const r = img.data[i * 4];
									const g = img.data[i * 4 + 1];
									const b = img.data[i * 4 + 2];
									const a = img.data[i * 4 + 3];
									if (a > 0) {
										G.drawPixel({ x: screenPos.x + x - img.width / 2, y: screenPos.y + y - img.height / 2 }, PS.makeRGB(r, g, b), a / 255);
									}
								}
							}

							// PS.imageBlit(G.assets.objects[0], screenPos.x, screenPos.y);
						}
						break;
				}
			}

			const spyglassCenterScreenPos = G.spyglass;
			if (G.assets.lensImage !== null) {
				const img = G.assets.lensImage;

				let drawnPixels = [];

				for (let y = 0; y < G.assets.lensImage.height; y++) {
					for (let x = 0; x < G.assets.lensImage.width; x++) {
						const i = x + y * img.width;
						const r = img.data[i * 4];
						const g = img.data[i * 4 + 1];
						const b = img.data[i * 4 + 2];
						const a = img.data[i * 4 + 3];
						const screenPos = { x: spyglassCenterScreenPos.x + x - img.width / 2 + 1, y: spyglassCenterScreenPos.y + y - img.height / 2 + 1 };
						if (a > 0 && G.isInBounds(screenPos)) {
							PS.color(screenPos.x, screenPos.y, G.blendColors(PS.color(screenPos.x, screenPos.y, PS.CURRENT), PS.makeRGB(r, g, b), a / 255));
							drawnPixels.push(screenPos);
						}
					}
				}

				for (let si = G.spyglass.afterimage.length - 1; si >= 0; si--) {
					for (let y = 0; y < G.assets.lensImage.height; y++) {
						px: for (let x = 0; x < G.assets.lensImage.width; x++) {
							const i = x + y * img.width;
							const r = img.data[i * 4];
							const g = img.data[i * 4 + 1];
							const b = img.data[i * 4 + 2];
							const a = img.data[i * 4 + 3] / Math.pow(1.5, (G.spyglass.afterimage.length - si));
							const screenPos = { x: G.spyglass.afterimage[si].x + x - img.width / 2 + 1, y: G.spyglass.afterimage[si].y + y - img.height / 2 + 1 };

							for (let prevI = 0; prevI < drawnPixels.length; prevI++) {
								if (drawnPixels[prevI].x == screenPos.x && drawnPixels[prevI].y == screenPos.y) {
									continue px;
								}
							}

							if (a > 0 && G.isInBounds(screenPos)) {
								PS.color(screenPos.x, screenPos.y, G.blendColors(PS.color(screenPos.x, screenPos.y, PS.CURRENT), PS.makeRGB(r, g, b), a / 255));
								drawnPixels.push(screenPos);
							}
						}
					}
				}
			}

			for (let i in G.hiddenObjects) {
				const obj = G.hiddenObjects[i];

				const screenPos = G.worldToScreen(obj);

				switch (obj.type) {
					case "EGG":
						G.drawSpyglassPixel(screenPos, obj.color);
						G.drawSpyglassPixel({ x: screenPos.x, y: screenPos.y - 1 }, obj.color);
						break;
					case "LEP":
						G.drawSpyglassPixel(screenPos, 0x00CC00);
						G.drawSpyglassPixel({ x: screenPos.x + 1, y: screenPos.y }, 0x00CC00);
						G.drawSpyglassPixel({ x: screenPos.x - 1, y: screenPos.y }, 0x00CC00);
						G.drawSpyglassPixel({ x: screenPos.x, y: screenPos.y - 1 }, 0x00CC00);
						G.drawSpyglassPixel({ x: screenPos.x, y: screenPos.y + 1 }, PS.COLOR_ORANGE);
						break;
				}
			}

			if (G.assets.spyglassImage !== null) {
				PS.gridPlane(1);
				PS.alpha(PS.ALL, PS.ALL, PS.ALPHA_TRANSPARENT);
				// I think this might technically be against rule 1?
				// PS.imageBlit(G.assets.spyglassImage, spyglassCenterScreenPos.x - 3, spyglassCenterScreenPos.y - 3);
			}

			G.renderHUD();

			PS.gridPlane(0);
			PS.gridRefresh();
		},

		renderHUD: () => {
			PS.gridPlane(2);

			PS.alpha(PS.ALL, PS.ALL, PS.ALPHA_TRANSPARENT);

			let timerLeft = G.timeRemaining / G.timeTotal;

			// const baseColor = G.blendColors(PS.COLOR_GREEN, PS.COLOR_GRAY, 0.5);
			const baseColor = PS.COLOR_GRAY_DARK;
			const consumedColor = G.blendColors(PS.COLOR_RED, PS.COLOR_GRAY, 0.5);

			for (let x = 0; x < PS.gridSize().width; x++) {
				const thru = 1.0 - ((x + 1) / PS.gridSize().width);
				const factor = Math.min(Math.max((timerLeft - thru) / (1 / PS.gridSize().width), 0.0), 1.0);

				PS.alpha(x, PS.gridSize().height - 1, PS.ALPHA_OPAQUE);
				PS.color(x, PS.gridSize().height - 1, G.blendColors(consumedColor, baseColor, factor % 0.1 > 0.05 ? 1 : factor));

				PS.alpha(x, PS.gridSize().height - 2, PS.ALPHA_OPAQUE);
				PS.color(x, PS.gridSize().height - 2, PS.COLOR_WHITE);
			}

			const eggColor = 0xAEEEEF;
			const missingColor = 0xB3B3B3;
			for (let x = 0; x < PS.gridSize().width; x += 2) {
				PS.color(x, PS.gridSize().height - 2, (G.eggs.length > (x / 2) && !(G.eggs.length - 1 == (x / 2) && G.eggFlash % 8 >= 5)) ? G.eggs[x / 2] : missingColor);
			}

			if (G.lepAnim !== null) {
				const screenPos = G.lepAnim;

				G.drawPixelWithAlpha(screenPos, 0x00CC00);
				G.drawPixelWithAlpha({ x: screenPos.x + 1, y: screenPos.y }, 0x00CC00);
				G.drawPixelWithAlpha({ x: screenPos.x - 1, y: screenPos.y }, 0x00CC00);
				G.drawPixelWithAlpha({ x: screenPos.x, y: screenPos.y - 1 }, 0x00CC00);
				G.drawPixelWithAlpha({ x: screenPos.x, y: screenPos.y + 1 }, PS.COLOR_ORANGE);
			}

			PS.gridPlane(0);
		},

		// a very bad but simple seedable prng
		// https://stackoverflow.com/a/19303725/8267529
		badRandom: (seed) => {
			var x = Math.sin(seed) * 10000;
			return x - Math.floor(x);
		},

		populateWorld: () => {
			let numEggs = 0;
			outer: for (let i = 0; i < 100; i++) {
				const x = G.badRandom(i) * 150;
				const y = G.badRandom(i + 100) * 150;

				// prevent them from being too close together
				for (let i in G.visibleObjects) {
					const obj = G.visibleObjects[i];
					if (G.distance(obj, { x, y }) < 12) {
						continue outer;
					}
				}

				G.visibleObjects.push({
					x,
					y,
					type: PS.random(7) - 1,
				});

				if (PS.random(2) === 1 || numEggs < 16) {
					if (PS.random(3) === 1 || numEggs < 16) {
						const colors = [0xC767EA, 0x56E2E2, 0xEF8C45, 0xE26379, 0x0094FF];
						G.hiddenObjects.push({
							x,
							y,
							type: "EGG",
							color: colors[PS.random(colors.length) - 1],
						});

						numEggs += 1;
					} else {
						G.hiddenObjects.push({
							x,
							y,
							type: "LEP",
						});
					}
				}
			}
		},

		onClick: (clickScreenPos) => {
			let closestDistSq = 100000;
			let closestIndex = null;
			for (let i in G.hiddenObjects) {
				const obj = G.hiddenObjects[i];

				const screenPos = G.worldToScreen(obj);

				const dx = clickScreenPos.x - screenPos.x;
				const dy = clickScreenPos.y - screenPos.y;

				const dstSq = dx * dx + dy * dy;

				if (dstSq < closestDistSq) {
					closestDistSq = dstSq;
					closestIndex = i;
				}
			}

			if (closestDistSq <= 4.0 * 4.0) {
				const removedObj = G.hiddenObjects.splice(closestIndex, 1)[0];
				console.log(removedObj);
				switch (removedObj.type) {
					case "EGG":
						G.eggs.push(removedObj.color);
						G.eggFlash = 40;

						const eggCt = G.hiddenObjects.filter(o => o.type === "EGG").length;

						if (G.eggs.length === 16) {
							PS.audioPlay("win", { fileTypes: ["mp3", "ogg"], path: "audio/", volume: 0.25 });
						} else {
							PS.audioPlay("egg", { fileTypes: ["mp3", "ogg"], path: "audio/", volume: 0.25 });
						}
						break;
					case "LEP":
						// can't steal if you have no eggs!
						if (G.eggs.length > 0) {
							G.lepAnim = {
								x: G.worldToScreen(removedObj).x,
								y: G.worldToScreen(removedObj).y,
								target: {
									x: G.eggs.length * 2 - 1,
									y: 30.0,
								},
							};
						} else {
							G.lepAnim = {
								x: G.worldToScreen(removedObj).x,
								y: G.worldToScreen(removedObj).y,
								target: {
									x: PS.random(40) - 4,
									y: -2,
								},
							};
						}

						PS.audioPlay("lepLaugh", { fileTypes: ["mp3", "ogg"], path: "audio/", volume: 0.25 });
						break;
				}

			} else {
				const cur = PS.color(clickScreenPos.x, clickScreenPos.y, PS.CURRENT);
				const rgb = PS.unmakeRGB(cur, []);
				console.log(rgb);
				//[ 206, 248, 234 ]

				if (Math.abs(rgb[0] - 206) <= 2 && Math.abs(rgb[1] - 248) <= 2 && Math.abs(rgb[2] - 234) <= 2) {
					PS.audioPlay("chick", { fileTypes: ["mp3", "ogg"], path: "audio/", volume: 0.25 });
				} else if (Math.abs(rgb[0] - 205) <= 2 && Math.abs(rgb[1] - 243) <= 2 && Math.abs(rgb[2] - 243) <= 2) {
					PS.audioPlay("bunny", { fileTypes: ["mp3", "ogg"], path: "audio/", volume: 0.15 });
				} else {
					PS.audioPlay("thud", { fileTypes: ["mp3", "ogg"], path: "audio/", volume: 0.05 });
				}
			}

		},

		// source: https://stackoverflow.com/a/12646864/8267529
		shuffleArray: array => {
			for (let i = array.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[array[i], array[j]] = [array[j], array[i]];
			}
		}
	};

	return exports;
}());

/*
PS.init( system, options )
Called once after engine is initialized but before event-polling begins.
This function doesn't have to do anything, although initializing the grid dimensions with PS.gridSize() is recommended.
If PS.grid() is not called, the default grid dimensions (8 x 8 beads) are applied.
Any value returned is ignored.
[system : Object] = A JavaScript object containing engine and host platform information properties; see API documentation for details.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.init = function (system, options) {
	// Uncomment the following code line
	// to verify operation:

	// PS.debug( "PS.init() called\n" );

	// This function should normally begin
	// with a call to PS.gridSize( x, y )
	// where x and y are the desired initial
	// dimensions of the grid.
	// Call PS.gridSize() FIRST to avoid problems!
	// The sample call below sets the grid to the
	// default dimensions (8 x 8).
	// Uncomment the following code line and change
	// the x and y parameters as needed.

	PS.gridSize(32, 32);
	PS.borderAlpha(PS.ALL, PS.ALL, PS.ALPHA_TRANSPARENT);
	PS.border(PS.ALL, PS.ALL, 0);
	PS.gridColor(G.blendColors(PS.COLOR_GREEN, PS.COLOR_BLACK, 0.75));
	PS.statusText("Egg-sposed");
	PS.statusColor(PS.COLOR_WHITE);

	// PS.imageLoad("image/spyglass.png", (image) => G.assets.spyglassImage = image);
	PS.imageLoad("image/lens.png", (image) => G.assets.lensImage = image);

	for (let i = 0; i < 7; i++) {
		PS.imageLoad("image/obj" + (i + 1) + ".png", image => G.assets.objects[i] = image); // jshint ignore:line
	}

	PS.audioLoad("background", { fileTypes: ["mp3", "ogg"], path: "audio/", autoplay: true, loop: true, volume: 0.125 });
	PS.audioLoad("egg", { fileTypes: ["mp3", "ogg"], path: "audio/" });
	PS.audioLoad("lepLaugh", { fileTypes: ["mp3", "ogg"], path: "audio/" });
	PS.audioLoad("lepSteal", { fileTypes: ["mp3", "ogg"], path: "audio/" });
	PS.audioLoad("lose", { fileTypes: ["mp3", "ogg"], path: "audio/" });
	PS.audioLoad("win", { fileTypes: ["mp3", "ogg"], path: "audio/" });
	PS.audioLoad("chick", { fileTypes: ["mp3", "ogg"], path: "audio/" });
	PS.audioLoad("bunny", { fileTypes: ["mp3", "ogg"], path: "audio/" });
	PS.audioLoad("thud", { fileTypes: ["mp3", "ogg"], path: "audio/" });
	PS.audioLoad("clock", { fileTypes: ["mp3", "ogg"], path: "audio/" });

	// This is also a good place to display
	// your game title or a welcome message
	// in the status line above the grid.
	// Uncomment the following code line and
	// change the string parameter as needed.

	// PS.statusText( "Game" );

	// Add any other initialization code you need here.

	G.populateWorld();

	PS.timerStart(1, G.tick);
};

/*
PS.touch ( x, y, data, options )
Called when the left mouse button is clicked over bead(x, y), or when bead(x, y) is touched.
This function doesn't have to do anything. Any value returned is ignored.
[x : Number] = zero-based x-position (column) of the bead on the grid.
[y : Number] = zero-based y-position (row) of the bead on the grid.
[data : *] = The JavaScript value previously associated with bead(x, y) using PS.data(); default = 0.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.touch = function (x, y, data, options) {
	// Uncomment the following code line
	// to inspect x/y parameters:

	// PS.debug( "PS.touch() @ " + x + ", " + y + "\n" );

	// Add code here for mouse clicks/touches
	// over a bead.
	G.onClick({ x, y });
};

/*
PS.release ( x, y, data, options )
Called when the left mouse button is released, or when a touch is lifted, over bead(x, y).
This function doesn't have to do anything. Any value returned is ignored.
[x : Number] = zero-based x-position (column) of the bead on the grid.
[y : Number] = zero-based y-position (row) of the bead on the grid.
[data : *] = The JavaScript value previously associated with bead(x, y) using PS.data(); default = 0.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.release = function (x, y, data, options) {
	// Uncomment the following code line to inspect x/y parameters:

	// PS.debug( "PS.release() @ " + x + ", " + y + "\n" );

	// Add code here for when the mouse button/touch is released over a bead.
};

/*
PS.enter ( x, y, button, data, options )
Called when the mouse cursor/touch enters bead(x, y).
This function doesn't have to do anything. Any value returned is ignored.
[x : Number] = zero-based x-position (column) of the bead on the grid.
[y : Number] = zero-based y-position (row) of the bead on the grid.
[data : *] = The JavaScript value previously associated with bead(x, y) using PS.data(); default = 0.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.enter = function (x, y, data, options) {
	// Uncomment the following code line to inspect x/y parameters:

	// PS.debug( "PS.enter() @ " + x + ", " + y + "\n" );

	// Add code here for when the mouse cursor/touch enters a bead.

	G.spyglass.x = x;
	G.spyglass.y = y;

};

/*
PS.exit ( x, y, data, options )
Called when the mouse cursor/touch exits bead(x, y).
This function doesn't have to do anything. Any value returned is ignored.
[x : Number] = zero-based x-position (column) of the bead on the grid.
[y : Number] = zero-based y-position (row) of the bead on the grid.
[data : *] = The JavaScript value previously associated with bead(x, y) using PS.data(); default = 0.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.exit = function (x, y, data, options) {
	// Uncomment the following code line to inspect x/y parameters:

	// PS.debug( "PS.exit() @ " + x + ", " + y + "\n" );

	// Add code here for when the mouse cursor/touch exits a bead.
};

/*
PS.exitGrid ( options )
Called when the mouse cursor/touch exits the grid perimeter.
This function doesn't have to do anything. Any value returned is ignored.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.exitGrid = function (options) {
	// Uncomment the following code line to verify operation:

	// PS.debug( "PS.exitGrid() called\n" );

	// Add code here for when the mouse cursor/touch moves off the grid.
};

/*
PS.keyDown ( key, shift, ctrl, options )
Called when a key on the keyboard is pressed.
This function doesn't have to do anything. Any value returned is ignored.
[key : Number] = ASCII code of the released key, or one of the PS.KEY_* constants documented in the API.
[shift : Boolean] = true if shift key is held down, else false.
[ctrl : Boolean] = true if control key is held down, else false.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.keyDown = function (key, shift, ctrl, options) {
	// Uncomment the following code line to inspect first three parameters:

	// PS.debug( "PS.keyDown(): key=" + key + ", shift=" + shift + ", ctrl=" + ctrl + "\n" );

	// Add code here for when a key is pressed.
};

/*
PS.keyUp ( key, shift, ctrl, options )
Called when a key on the keyboard is released.
This function doesn't have to do anything. Any value returned is ignored.
[key : Number] = ASCII code of the released key, or one of the PS.KEY_* constants documented in the API.
[shift : Boolean] = true if shift key is held down, else false.
[ctrl : Boolean] = true if control key is held down, else false.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.keyUp = function (key, shift, ctrl, options) {
	// Uncomment the following code line to inspect first three parameters:

	// PS.debug( "PS.keyUp(): key=" + key + ", shift=" + shift + ", ctrl=" + ctrl + "\n" );

	// Add code here for when a key is released.
};

/*
PS.input ( sensors, options )
Called when a supported input device event (other than those above) is detected.
This function doesn't have to do anything. Any value returned is ignored.
[sensors : Object] = A JavaScript object with properties indicating sensor status; see API documentation for details.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
NOTE: Currently, only mouse wheel events are reported, and only when the mouse cursor is positioned directly over the grid.
*/

PS.input = function (sensors, options) {
	// Uncomment the following code lines to inspect first parameter:

	//	 var device = sensors.wheel; // check for scroll wheel
	//
	//	 if ( device ) {
	//	   PS.debug( "PS.input(): " + device + "\n" );
	//	 }

	// Add code here for when an input event is detected.
};

