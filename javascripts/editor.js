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
		MENU:72
    });

    // copy buffer to allow copying of various constructs
    this.copyBuffer = {
        // TODO enforce max buffer size
        // TODO allow choosing selection from copy buffer
        maxBuffered: 10,
        buffer: [],
    };

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
    this.snapToGridX = false;
    this.snapToGridY = false;

	// current segment color to apply to new segments
	this.segColor = "#00ff00";
	this.randomColor = false;
	
	// zoom logic
	this.zoom = 1;
	
	// input function bindings
    this.mdown = this.mouseDown.bind(this);
    this.mup = this.mouseUp.bind(this);
    this.mmove = this.mouseMove.bind(this);
    this.keydown = this.keyDown.bind(this);
	this.mwheel = this.scrollWheel.bind(this);
	
    var ed = this;
    // UI hooks
    $("#snap-to-grid-x").click(function() {
        var $this = $(this);
        // $this will contain a reference to the checkbox   
        if ($this.is(':checked')) {
            ed.snapToGridX = true;
        } else {
            ed.snapToGridX = false;
        }
    });

    $("#snap-to-grid-y").click(function() {
        var $this = $(this);
        log([this]);

        if ($this.is(':checked')) {
            ed.snapToGridY = true;
        } else {
            ed.snapToGridY = false;
        }
    });
	
	$("#random-color").click(function() {
        var $this = $(this);
        // $this will contain a reference to the checkbox   
        if ($this.is(':checked')) {
            ed.randomColor = true;
        } else {
            ed.randomColor = false;
        }
    });

    $("#grid-size-go").click(function(e) {
        console.log(parseInt(ed.gridHeight));
        ed.gridHeight = parseInt($("#grid-size").val());
    });

    $("#import").click(function(e) {
        csv = "";
        var segs = ed.segments;
        for (var i = 0; i < segs.length; i++) {
            csv += segs[i][0].pos.x + "," + segs[i][0].pos.y + "," + segs[i][1].pos.x + "," + segs[i][1].pos.y + "\n"
        }
        console.log(csv);
    });

    this.exportType = "csv";
    $("#export").click(function(e) {
        if (ed.exportType == "csv") {
            csv = "";
            var segs = ed.segments;
            for (var i = 0; i < segs.length; i++) {
			log([segs[i][2]], segs[i][2].slice(1, 6));
                csv += segs[i][0].pos.x + "," + segs[i][0].pos.y + "," + segs[i][1].pos.x + "," + segs[i][1].pos.y + "," + parseInt(segs[i][2].replace("#", ""), 16) + (i == segs.length - 1 ? "," : ",") /* broken loader, broken export, fix loader please */;
            }
            console.log(csv);
            $("#export-window").val(csv);
            console.log($("#export-window").val());
        }
    });
	
	// segment colorpicker things
	$(function(){
		$('.edcolorpicker').colorpicker();
	});
	
	$('.edcolorpicker').colorpicker().on('changeColor.colorpicker', function(event){
		ed.segColor = event.color.toHex();
	});
};

Editor.prototype.scrollWheel = function(e){
	if(e.wheelDeltaY > 0){
		this.zoom += 0.1
		if(this.zoom > 10){
			this.zoom = 10;
		}
	} else {
		this.zoom -= 0.1;
		if(this.zoom < 0.1){
			this.zoom = 0.1;
		}
	}
	log([this.zoom]);
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

            log(['del']);
            break;
        case this.keyEnum.COPY:
            if (e.ctrlKey) {
                log(['copy']);

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
                log(['paste']);

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

                if (vtx.pos.x  * this.zoom < br.x && vtx.pos.x * this.zoom> tl.x && vtx.pos.y * this.zoom> tl.y && vtx.pos.y * this.zoom< br.y) {
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
            this.vertices.push(new vertex(e.x - this.panPos.x, e.y - this.panPos.y));
        } else {
            // if there's a selected vertex, try picking for another vertex to make a segment
            linePt = this.pick({
                x: e.x,
                y: e.y
            });
            if (linePt) {
                if (this.selected.connected.indexOf(linePt) == -1) {
                    this.segments.push([this.selected, linePt, this.segColor]);
                    this.selected.connected.push(linePt);
                    linePt.connected.push(this.selected);
					if(this.randomColor){
						this.segColor = '#'+Math.floor(Math.random()*16777215).toString(16); // js magic, http://www.paulirish.com/2009/random-hex-color-code-snippets/
						$(".edcolorpicker input").val(this.segColor);
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
            }
        }
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
            this.panPos.x = this.startPanPos.x - (this.dragStart.x - e.x);
            this.panPos.y = this.startPanPos.y - (this.dragStart.y - e.y);
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
        copy.verts.push(new vertex(toCopy[i].pos.x, toCopy[i].pos.y));
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
        if ((Math.sqrt(Math.pow(pos.x - ed.zoom * el.pos.x - ed.zoom * panPos.x, 2) + Math.pow(pos.y - ed.zoom * el.pos.y - ed.zoom * panPos.y, 2))) < (2 * el.r)) {
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