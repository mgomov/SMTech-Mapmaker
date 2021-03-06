var Editor = function(vertices, segments) {
	this.vertices = vertices;
	this.segments = segments;
	this.dragOffset = {};
	this.dragOffset.x = 0;
	this.dragOffset.y = 0;

	this.position = {};
	this.position.x = 0;
	this.position.y = 0;

	this.mouseIsDown = false;

	// dragging logic
	this.dragging = false;
	this.dragTolerance = 1;
	this.dragStart = {};
	this.dragStart.x = 0;
	this.dragStart.y = 0;

	// group select logic
	this.gsPos = {};
	this.gsPos.x = 0;
	this.gsPos.y = 0;

	// selected logic
	// TODO change from 0 to undef or some other definition
	this.selected = false;
	this.selectedChained = [];

	// functions
	// DELETE = del
	// COPY = ctrl + 'c'
	// PASTE = ctrl + 'v'
	// MENU = 'h'
	this.keyEnum = Object.freeze({
		DELETE: 46,
		COPY: 67,
		PASTE: 86,
		MENU: 77
	});

	// copy buffer to allow copying of various constructs
	this.copyBuffer = {
		// TODO enforce max buffer size
		// TODO allow choosing selection from copy buffer
		maxBuffered: 10,
		buffer: [],
	};
	this.randomPasteColors = true;

	// panning logic
	this.panning = false;
	this.panPos = {};
	this.panPos.x = 0;
	this.panPos.y = 0;
	this.startPanPos = {};
	this.startPanPos.x = 0;
	this.startPanPos.y = 0;

	// grid logic
	this.gridHeight = 50;
	this.snapToGridX = true;
	this.snapToGridY = true;

	// current segment color to apply to new segments
	this.textures = {};
	this.textures["wall1"] = "#ff0000";
	this.textures["wall2"] = "#00ff00";
	this.textures["wall3"] = "#0000ff";
	this.textures["wall4"] = "#ff00ff";
	this.textures["wall5"] = "#f0f0f0";
	this.textures["wall6"] = "#0f0f0f";
	this.textures["wall7"] = "#ffff00";
	this.textures["wall8"] = "#aaaa00";
	this.textures["wall9"] = "#aa00aa";
	this.textures["wall10"] = "#aa0000";
	this.textures["wall11"] = "#a0a0aa";
	this.textures["wall12"] = "#abab00";
	this.textures["wall13"] = "#0000ab";
	this.textures["wall14"] = "#ab00ab";
	this.textures["wall15"] = "#abcde0";
	this.textures["wall16"] = "#efgabc";
	this.textures["wall17"] = "#abc000";
	this.textures["wall18"] = "#abbeff";
	this.textures["wall19"] = "#deadf0";
	this.textures["wall20"] = "#deadbe";
	this.textures["wall21"] = "#efc323";
	this.segTexture = ["wall1", this.textures["wall1"]];

	// 'things' (sprites, map objects)
	// treated as vertices with attached resources
	this.thingPresets = {};
	this.thingPresets["thing1"] = "#ff0000";
	this.thingPresets["thing2"] = "#00ff00";
	this.thingPresets["thing3"] = "#ffff00";
	this.thingPresets["thing4"] = "#ff00ff";
	this.currentThing = ["thing1", "#ff0000"];
		
	// zoom logic
	this.zoom = 1;

	// input function bindings
	this.mdown = this.mouseDown.bind(this);
	this.mup = this.mouseUp.bind(this);
	this.mmove = this.mouseMove.bind(this);
	this.keydown = this.keyDown.bind(this);
	this.mwheel = this.scrollWheel.bind(this);

	// print debugging stats
	this.debug = true;
	var ed = this;

	// convenience, select the seglinked vertex
	this.selectLinked = true;

	// UI hooks
	$("#snap-to-grid-x").click(function() {
		var $this = $(this);
		if ($this.is(':checked')) {
			ed.snapToGridX = true;
		} else {
			ed.snapToGridX = false;
		}
	});

	$("#select-linked").click(function() {
		var $this = $(this);
		if ($this.is(':checked')) {
			ed.selectLinked = true;
		} else {
			ed.selectLinked = false;
		}
	});

	$("#random-paste-color").click(function() {
		var $this = $(this);
		if ($this.is(':checked')) {
			ed.randomPasteColors = true;
		} else {
			ed.randomPasteColors = false;
		}
	});

	$("#snap-to-grid-y").click(function() {
		var $this = $(this);
		if ($this.is(':checked')) {
			ed.snapToGridY = true;
		} else {
			ed.snapToGridY = false;
		}
	});


	$("#debugging-info").click(function() {
		var $this = $(this);
		if ($this.is(':checked')) {
			ed.debug = true;
		} else {
			ed.debug = false;
		}
	});

	$("#random-color").click(function() {
		var $this = $(this);
		if ($this.is(':checked')) {
			ed.randomColor = true;
			$("#color-input").prop('disabled', true);
		} else {
			ed.randomColor = false;
			$("#color-input").prop('disabled', false);
		}
	});

	$("#grid-size-go").click(function(e) {
		var ghval = parseInt($("#grid-size").val());
		if(ghval < 5){
			ghval = 5;
		}
		ed.gridHeight = ghval;
	});

	$("#import-toggle").click(function(e) {
		if ($('#import-div').is(':visible')) {
			$("#import-div").hide();
		} else {
			$("#import-div").show();
		}
	});

	$("#export-toggle").click(function(e) {
		if ($('#export-div').is(':visible')) {
			$("#export-div").hide();
		} else {
			$("#export-div").show();
		}
	});

	$("#help-toggle").click(function(e) {
		if ($('#help-div').is(':visible')) {
			$("#help-div").hide();
		} else {
			$("#help-div").show();
		}
	});



	$("#import").click(function(e) {
		csv = $("#import-window").val();

		// clear
		ed.vertices.length = 0;
		ed.segments.length = 0;

		tokens = csv.split(',');

		// broken comma means iterate to length - 1... blame the main program's loader for this one
		for (var i = 0; i < tokens.length - 1; i += 5) {
			var v1x = parseInt(tokens[i], 10);
			var v1y = parseInt(tokens[i + 1], 10);
			var v2x = parseInt(tokens[i + 2], 10);
			var v2y = parseInt(tokens[i + 3], 10);
			var color = '#' + parseInt(tokens[i + 4], 10).toString(16);
			var v1 = new vertex(v1x, v1y);
			var v2 = new vertex(v2x, v2y);
			v1.connected.push(v2);
			v2.connected.push(v1);
			ed.vertices.push(v1);
			ed.vertices.push(v2);
			ed.segments.push([v1, v2, color]);
		}
	});

	this.exportType = "csv";
	$("#export").click(function(e) {
		exported = "";
		// export things first
		var verts = ed.vertices;
		for(var i = 0; i < verts.length; i++){
			// if the vertex has an attached resource it means that it's a thing
			if(verts[i].resource){
				exported += verts[i].pos.x + " " + verts[i].pos.y + " " + verts[i].resource + " "; 
			}
		}

		// separate sections by commas
		exported += ", ";

		// export segs
		var segs = ed.segments;
		for (var i = 0; i < segs.length; i++) {
			// old, colorful format
			//csv += segs[i][0].pos.x + " " + segs[i][0].pos.y + " " + segs[i][1].pos.x + " " + segs[i][1].pos.y + " " + parseInt(segs[i][2].replace("#", ""), 16) + (i == segs.length - 1 ? " " : " ") /* broken loader, broken export, fix loader please */ ;
			// x1, y1, x2, y2, texture format
			exported += segs[i][0].pos.x + " " + segs[i][0].pos.y + " " + segs[i][1].pos.x + " " + segs[i][1].pos.y + " " + segs[i][2][0] + " "; 
		}
		$("#export-window").val(exported);
		console.log($("#export-window").val());
	});

	$(".texture-category").click(function(e){
		var key = e.currentTarget.innerText.replace("\n", "");
		ed.segTexture = [key, ed.textures[key]];
                
                console.log(ed.segTexture);
	});
	
	$(".thing-category").click(function(e){
		var key = e.currentTarget.innerText.replace("\n", "");
		ed.currentThing = [key, ed.thingPresets[key]];
	});

	$("#do-bsp").click(function(e) {
		ed.ebsp = new EasyBSP(ed.vertices, ed.segments);
		ed.ebsp.partition(ed);
	});

};

Editor.prototype.scrollWheel = function(e) {
	if (e.wheelDeltaY > 0) {
		this.zoom += 0.05;
		if (this.zoom > 10) {
			this.zoom = 10;
		}
	} else {
		this.zoom -= 0.05;
		if (this.zoom < 0.1) {
			this.zoom = 0.1;
		}
	}
};

Editor.prototype.keyDown = function(e) {
	//e.preventDefault();
	switch (e.keyCode) {
		case this.keyEnum.DELETE:
			// delete the selection
			// don't care about maintaining selected or selectedChained, so take the easy way here
			this.selectedChained.push(this.selected);
			var remove = this.selectedChained;

			this.selected = false;
			this.selectedChained = [];

			for (var i = 0; i < remove.length; i++) {
				var vtx = remove[i];

				// remove all segs with this vertex
				for (var j = 0; j < this.segments.length; j++) {
					if (this.segments[j][0] == vtx || this.segments[j][1] == vtx) {
						this.segments.splice(j, 1);
						j--;
					}
				}

				// remove this vertex from connectivity lists of other vertices
				for (var j = 0; j < this.vertices.length; j++) {
					var idx = this.vertices[j].connected.indexOf(vtx);
					if (idx != -1) {
						this.vertices[j].connected.splice(idx, 1);
					}

				}

				this.vertices.splice(this.vertices.indexOf(vtx), 1);
			}
			break;
		case this.keyEnum.COPY:
			if (e.ctrlKey) {
				// add vertices that will be copied to an array
				var toCopy = [];
				toCopy.push(this.selected);
				toCopy = toCopy.concat(this.selectedChained);

				// feed verts and segs into createCopy, which throws a 'base copy' 
				var copy = this.createCopy(toCopy, this.segments);
				this.copyBuffer.buffer.push(copy);
			}
			break;
		case this.keyEnum.PASTE:
			if (e.ctrlKey) {
				// clear any selections
				this.selected.currentColor = this.selected.color;
				this.selected = false;
				for (var i = 0; i < this.selectedChained.length; i++) {
					this.selectedChained[i].currentColor = this.selectedChained[i].color;
				}
				this.selectedChained = [];

				// grab the most recent copy from the copy buffer
				var copy = this.copyBuffer.buffer[this.copyBuffer.buffer.length - 1];

				// create a new, standalone copy from the copyBuffer's base segs and verts
				var copyToPlace = this.createCopy(copy.verts, copy.segs);

				var verts = copyToPlace.verts;
				var segs = copyToPlace.segs;

				// populate selected and selectedChained, put verts into vertices and segs into segments
				this.selected = verts.shift();
				this.selected.currentColor = this.selected.pickedColor;
				this.vertices.push(this.selected);
				for (var i = 0; i < verts.length; i++) {
					verts[i].currentColor = verts[i].chainedColor;
					this.vertices.push(verts[i]);
					this.selectedChained.push(verts[i]);
				}

				for (var i = 0; i < segs.length; i++) {
					this.segments.push(segs[i]);
				}

			}
			break;
		case this.keyEnum.MENU:
			$("#menu").toggle();
			break;
	}
}

Editor.prototype.mouseDown = function(e) {
	e.preventDefault();
	this.dragStart.x = e.x;
	this.dragStart.y = e.y;

	this.mouseIsDown = true;
};

Editor.prototype.mouseUp = function(e) {
	e.preventDefault();
	// if the user isn't dragging when they release the button, assume that it's a click
	if (!this.dragging) {
		this.mouseClick(e);
	} else {

		// else, stop dragging a vertex
		if (!this.panning && !this.selected) {
			for (var i = 0; i < this.selectedChained.length; i++) {
				this.selectedChained[i].currentColor = this.selectedChained[i].color;
			}

			this.selectedChained = [];
			this.selected = false;
			for (var i = 0; i < this.vertices.length; i++) {
				var vtx = this.vertices[i];
				var tl = {
					x: Math.min(this.dragStart.x, this.gsPos.x) - this.panPos.x * this.zoom,
					y: Math.min(this.dragStart.y, this.gsPos.y) - this.panPos.y * this.zoom
				};
				var br = {
					x: Math.max(this.dragStart.x, this.gsPos.x) - this.panPos.x * this.zoom,
					y: Math.max(this.dragStart.y, this.gsPos.y) - this.panPos.y * this.zoom
				};

				if (vtx.pos.x * this.zoom < br.x && vtx.pos.x * this.zoom > tl.x && vtx.pos.y * this.zoom > tl.y && vtx.pos.y * this.zoom < br.y) {
					if (this.selected == 0) {
						this.selected = vtx;
						this.selected.currentColor = this.selected.pickedColor;
					} else {
						this.selectedChained.push(vtx);
						vtx.currentColor = vtx.chainedColor;
					}
				}
			}
		}
	}

	// manage state (not dragging anymore since button was released)
	this.dragging = false;
	this.panning = false;
	this.mouseIsDown = false;
};

Editor.prototype.mouseClick = function(e) {
	// shift is the main modifier in the program
	if (e.shiftKey) {
		// if there wasn't a vertex picked in mousedown, create a new vertex
		if (!this.selected) {
			this.vertices.push(new vertex(e.x / this.zoom - this.panPos.x, e.y / this.zoom - this.panPos.y));
		} else {
			// if there's a selected vertex, try picking for another vertex to make a segment
			linePt = this.pick({
				x: e.x,
			       y: e.y
			});
			if (linePt) {
				if (this.selected.connected.indexOf(linePt) == -1) {
					this.segments.push([this.selected, linePt, this.segTexture]);
					this.selected.connected.push(linePt);
					linePt.connected.push(this.selected);

					if (this.selectLinked) {
						this.selected.currentColor = this.selected.color;
						this.selected = linePt;
						linePt.currentColor = linePt.pickedColor;
					}
				} else {
					this.selected.connected.splice(this.selected.connected.indexOf(linePt), 1);
					linePt.connected.splice(linePt.connected.indexOf(this.selected), 1);
					for (var i = 0; i < this.segments.length; i++) {
						if ((this.segments[i][0] == this.selected || this.segments[i][0] == linePt) && (this.segments[i][1] == this.selected || this.segments[i][1] == linePt)) {
							this.segments.splice(i, 1);
						}
					}
				}


			} else {
				this.selected.currentColor = this.selected.color;
				this.selected = false;
				this.vertices.push(new vertex(e.x / this.zoom - this.panPos.x, e.y / this.zoom - this.panPos.y));
			}
		}
	} else if (e.altKey) {
		/*
		if(this.ebsp){
			this.ebsp.traverse({
				x: e.x / this.zoom - this.panPos.x,
				y: e.y / this.zoom - this.panPos.y
			});
			this.vertices.push(new vertex(e.x / this.zoom - this.panPos.x, e.y / this.zoom - this.panPos.y));
		} 
		console.log("setting");
		this.towards = {};
		this.towards.x = e.x / this.zoom - this.panPos.x;
		this.towards.y = e.y / this.zoom - this.panPos.y
			console.log(this.towards);
		this.vertices.push(new vertex(e.x / this.zoom - this.panPos.x, e.y / this.zoom - this.panPos.y));
		*/
		this.vertices.push(new vertex(e.x / this.zoom - this.panPos.x, e.y / this.zoom - this.panPos.y, this.currentThing[0], this.currentThing[1]));
	} else {
		// reset the color of the last-picked vertex, since it's being unselected
		if (this.selected) {
			this.selected.currentColor = this.selected.color;
			for (var i = 0; i < this.selectedChained.length; i++) {
				this.selectedChained[i].currentColor = this.selectedChained[i].color;
			}
			this.selectedChained = [];
		}

		// try picking for a vertex
		this.selected = this.pick({
			x: e.x,
			y: e.y
		});

		// there's a newly selected vertex now
		if (this.selected) {
			// select chain of vertices

			if (e.ctrlKey) {
				traversed = [];
				// TODO replace with 2 stacks instead of a queue
				toTraverse = [this.selected];
				while (toTraverse.length != 0) {
					//log(["traversed:", traversed, "toTraverse:", toTraverse]);
					current = toTraverse.shift();
					if (traversed.indexOf(current) == -1) {
						traversed.push(current);
						for (var i = 0; i < current.connected.length; i++) {
							if (traversed.indexOf(current.connected[i]) == -1 && toTraverse.indexOf(current.connected[i] == -1)) {
								toTraverse.push(current.connected[i]);

							}
						}
					}
				}

				for (var i = 0; i < traversed.length; i++) {
					traversed[i].currentColor = traversed[i].chainedColor;
				}

				traversed.splice(traversed.indexOf(this.selected), 1);

				this.selectedChained = traversed;
			}
			this.selected.currentColor = this.selected.pickedColor;
		}
	}
};

Editor.prototype.mouseMove = function(e) {
	e.preventDefault();
	// update position of a vertex being dragged
	if (this.dragging && this.selected) {
		var oX = this.selected.pos.x;
		var oY = this.selected.pos.y;

		var dx = -1 * (this.selected.pos.x - e.x / this.zoom + this.panPos.x);
		var dy = -1 * (this.selected.pos.y - e.y / this.zoom + this.panPos.y);

		this.selected.pos.x = e.x / this.zoom - this.panPos.x;
		this.selected.pos.y = e.y / this.zoom - this.panPos.y;

		// TODO need to refactor negative coord case
		if (this.snapToGridX) {
			var xDist = this.selected.pos.x % this.gridHeight;
			if (this.selected.pos.x > 0) {
				if (xDist < 0.5 * this.gridHeight) {
					this.selected.pos.x = this.selected.pos.x - xDist;
				} else {
					this.selected.pos.x = this.selected.pos.x + (this.gridHeight - xDist);
				}
			} else {
				xDist = this.gridHeight - Math.abs(xDist);

				if (Math.abs(xDist) < 0.5 * this.gridHeight) {
					this.selected.pos.x = this.selected.pos.x - xDist;
				} else {
					this.selected.pos.x = this.selected.pos.x + (this.gridHeight - xDist);
				}
			}
			dx = this.selected.pos.x - oX;
		}

		if (this.snapToGridY) {
			var yDist = this.selected.pos.y % this.gridHeight;
			if (this.selected.pos.y > 0) {
				if (yDist < 0.5 * this.gridHeight) {
					this.selected.pos.y = this.selected.pos.y - yDist;
				} else {
					this.selected.pos.y = this.selected.pos.y + (this.gridHeight - yDist);
				}
			} else {
				yDist = this.gridHeight - Math.abs(yDist);
				if (Math.abs(yDist) < 0.5 * this.gridHeight) {
					this.selected.pos.y = this.selected.pos.y - yDist;
				} else {
					this.selected.pos.y = this.selected.pos.y + (this.gridHeight - yDist);
				}
			}
			dy = this.selected.pos.y - oY;
		}

		// update positions of each chained vertex based on the delta of the movement of the selected point
		for (var i = 0; i < this.selectedChained.length; i++) {
			this.selectedChained[i].pos.x += dx;
			this.selectedChained[i].pos.y += dy;
		}
	}

	// dragging logic
	if (this.mouseIsDown && !e.shiftKey) {
		// start dragging if not already dragging and the mouse has moved more than a certain
		// tolerated distance to register as a click instead
		if (!this.panning && !this.dragging && Math.sqrt(Math.pow(this.dragStart.x - e.x, 2) + Math.pow(this.dragStart.y - e.y, 2)) > this.dragTolerance) {
			this.dragging = true;

			// grab this so we can swap out the selected vertex into selectedChained if necessary
			var tmp = this.selected;

			// try picking a vertex to drag
			this.selected = this.pick(this.dragStart);
			if (this.selected) {
				// if the picked vertex isn't the currently selected vertex, swap them out
				if (this.selectedChained.indexOf(this.selected) != -1) {
					this.selectedChained.splice(this.selectedChained.indexOf(this.selected), 1);
					this.selectedChained.push(tmp);
					this.selected.currentColor = this.selected.pickedColor;
					tmp.currentColor = tmp.chainedColor;
				}
			} else {
				tmp.currentColor = tmp.color;
				for (var i = 0; i < this.selectedChained.length; i++) {
					this.selectedChained[i].currentColor = this.selectedChained[i].color;
				}
				if (e.ctrlKey) {
					this.panning = true;
					this.startPanPos.x = this.panPos.x;
					this.startPanPos.y = this.panPos.y;
				}
			}
		}

		if (this.dragging && !this.panning) {
			// group selection position
			this.gsPos.x = e.x;
			this.gsPos.y = e.y;
		}

		if (this.panning) {
			this.panPos.x = this.startPanPos.x - (this.dragStart.x - e.x) / this.zoom;
			this.panPos.y = this.startPanPos.y - (this.dragStart.y - e.y) / this.zoom;
		}
	}
	return false;
};

Editor.prototype.createCopy = function(toCopy, cpySegs) {
	// create a new 'copy struct'
	var copy = {
		verts: [],
		segs: []
	}

	// create a list of copied vertices, and throw a corresponding __idx onto originals and copies
	for (var i = 0; i < toCopy.length; i++) {
		copy.verts.push(new vertex(toCopy[i].pos.x, toCopy[i].pos.y, toCopy[i].resource, toCopy[i].color));
		toCopy[i].__idx = i;
		copy.verts[i].__idx = i;
	}

	// go through all the segs given, and when finding a seg that is composed of 2 points in the copy
	// verts list, create a new seg with the copied verts as endpoints
	for (var i = 0; i < cpySegs.length; i++) {
		if (cpySegs[i][0].__idx != undefined && cpySegs[i][1].__idx != undefined) {
			copy.segs.push([copy.verts[cpySegs[i][0].__idx], copy.verts[cpySegs[i][1].__idx], cpySegs[i][2]]);
			copy.verts[cpySegs[i][0].__idx].connected.push(copy.verts[cpySegs[i][1].__idx]);
			copy.verts[cpySegs[i][1].__idx].connected.push(copy.verts[cpySegs[i][0].__idx]);
		}
	}

	for (var i = 0; i < toCopy.length; i++) {
		delete toCopy[i]['__idx'];
		delete copy.verts[i]['__idx'];
	}
	//log(['orig', toCopy, 'origSegs', cpySegs, 'copied', copy.verts, 'segs', copy.segs]);
	return copy;
}

// pick a vertex on click
Editor.prototype.pick = function(pos) {
	var picked = false;
	var panPos = this.panPos;
	var ed = this;
	this.vertices.forEach(function(el, i, arr) {
		if ((Math.sqrt(Math.pow(pos.x - ed.zoom * el.pos.x - ed.zoom * panPos.x, 2) + Math.pow(pos.y - ed.zoom * el.pos.y - ed.zoom * panPos.y, 2))) < (2 * el.r) * ed.zoom) {
			picked = el;
			return;
		}
	});
	//log(['Picked:', picked]);
	return picked;
};

var log = function(args) {
	for (var i = 0; i < args.length; i++) {
		console.log(args[i]);
	}
	console.log("");
}
