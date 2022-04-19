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

Cover image created with the use of Canva.com
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
			x: 0.0,
			y: 0.0,
			path: [
				{ x: 0.0, y: 0.0 },
				{ x: 110.0, y: 10.0 },
				{ x: 120.0, y: 50.0 },
				{ x: 70.0, y: 32.0 },
				{ x: 30.0, y: 30.0 },
				{ x: 120.0, y: 80.0 },
				{ x: 105.0, y: 110.0 },
				{ x: 40.0, y: 60.0 },
				{ x: 65.0, y: 110.0 },
				{ x: 10.0, y: 100.0 },
				{ x: 20.0, y: 70.0 },
			],
			pathIndex: 0,
		},
		visibleObjects: [],
		hiddenObjects: [],
		spyglass: {
			x: 0.0,
			y: 0.0,
		},
		assets: {
			spyglassImage: null,
		},

		tick: () => {

			const camTarget = G.cam.path[G.cam.pathIndex];

			const camDx = camTarget.x - G.cam.x;
			const camDy = camTarget.y - G.cam.y;
			const camDist = Math.sqrt(camDx * camDx + camDy * camDy);
			const camSpeed = 0.2;

			if (camDist < camSpeed) {
				G.cam.pathIndex = (G.cam.pathIndex + 1) % G.cam.path.length;
			} else {
				G.cam.x += camDx / camDist * camSpeed;
				G.cam.y += camDy / camDist * camSpeed;
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

		isInSpyglass: (screenPos) => {
			const dx = G.spyglass.x - Math.floor(screenPos.x);
			const dy = G.spyglass.y - Math.floor(screenPos.y);

			return Math.abs(dx) <= 2 && Math.abs(dy) <= 2;
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
			if (G.isInBounds(screenPos) && G.isInSpyglass(screenPos)) {
				PS.color(screenPos.x, screenPos.y, color);
			}
		},

		drawPixel: (screenPos, color) => {
			if (G.isInBounds(screenPos)) {
				PS.color(screenPos.x, screenPos.y, color);
			}
		},

		getBGTileAt: (p) => {
			const veryGoodHash = Math.sin(p.x) + p.y;
			const val = G.badRandom(veryGoodHash) * 12;
			return PS.makeRGB(0, Math.min(Math.max(val + 127, 0), 255), 0);
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
				}
			}

			const spyglassCenterScreenPos = G.spyglass;
			for (let dx = -2; dx <= 2; dx++) {
				for (let dy = -2; dy <= 2; dy++) {
					const screenPos = { x: spyglassCenterScreenPos.x + dx, y: spyglassCenterScreenPos.y + dy };
					if (G.isInBounds(screenPos)) {
						PS.color(screenPos.x, screenPos.y, G.blendColors(PS.color(screenPos.x, screenPos.y, PS.CURRENT), PS.COLOR_CYAN, 0.5));
					}
				}
			}

			for (let i in G.hiddenObjects) {
				const obj = G.hiddenObjects[i];

				const screenPos = G.worldToScreen(obj);

				switch (obj.type) {
					case "EGG":
						G.drawSpyglassPixel(screenPos, PS.COLOR_CYAN);
						break;
					case "LEP":
						G.drawSpyglassPixel(screenPos, PS.COLOR_GREEN);
						G.drawSpyglassPixel({ x: screenPos.x + 1, y: screenPos.y }, PS.COLOR_GREEN);
						G.drawSpyglassPixel({ x: screenPos.x - 1, y: screenPos.y }, PS.COLOR_GREEN);
						G.drawSpyglassPixel({ x: screenPos.x, y: screenPos.y - 1 }, PS.COLOR_GREEN);
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

			PS.gridRefresh();
		},

		// a very bad but simple seedable prng
		// https://stackoverflow.com/a/19303725/8267529
		badRandom: (seed) => {
			var x = Math.sin(seed) * 10000;
			return x - Math.floor(x);
		},

		populateWorld: () => {
			outer: for (let i = 0; i < 100; i++) {
				const x = G.badRandom(i) * 110;
				const y = G.badRandom(i + 100) * 110;

				// prevent them from being too close together
				for (let i in G.visibleObjects) {
					const obj = G.visibleObjects[i];
					if (G.distance(obj, { x, y }) < 8) {
						continue outer;
					}
				}

				G.visibleObjects.push({
					x,
					y,
					type: "TEST1",
				});
				if (PS.random(2) === 1) {
					if (PS.random(3) > 1) {
						G.hiddenObjects.push({
							x,
							y,
							type: "EGG",
						});
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

			if (closestDistSq <= 2.5 * 2.5) {
				const removedObj = G.hiddenObjects.splice(closestIndex, 1)[0];
				console.log(removedObj);
				switch (removedObj.type) {
					case "EGG":

						const eggCt = G.hiddenObjects.filter(o => o.type === "EGG").length;

						if (eggCt === 0) {
							PS.audioPlay("fx_tada", { volume: 0.25 });
						} else {
							PS.audioPlay("fx_pop", { volume: 0.25 });
						}
						break;
					case "LEP":
						PS.audioPlay("fx_hoot", { volume: 0.25 });
						break;
				}

			}

		},
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

	PS.imageLoad("image/spyglass.png", (image) => G.assets.spyglassImage = image);

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

