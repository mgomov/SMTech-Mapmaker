drawWindow = function(context, editor) {
    context.fillStyle = "#666666";
    context.lineWidth = 1;
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid(context, editor);
};

drawGrid = function(context, editor) {
    context.beginPath();
    for (var x = 0.5; x < canvas.width; x += (editor.zoom * editor.gridHeight)) {
        context.moveTo(x + editor.zoom * (editor.panPos.x % editor.gridHeight), 0);
        context.lineTo(x + editor.zoom * (editor.panPos.x % editor.gridHeight), canvas.height);
    }

    for (var y = 0.5; y < canvas.height + editor.gridHeight; y += (editor.zoom * editor.gridHeight)) {
        context.moveTo(0, y + editor.zoom * (editor.panPos.y % editor.gridHeight));
        context.lineTo(canvas.width, y + editor.zoom * (editor.panPos.y % editor.gridHeight));
    }

    context.strokeStyle = "#545454";
    context.stroke();
}

var vertex = function(xpos, ypos) {
    this.pos = {
        x: xpos,
        y: ypos
    };
    this.color = "#0000ff";
    this.pickedColor = "#ff00ff";
    this.chainedColor = "#00cccc";
    this.currentColor = this.color;
    this.r = 7;
    this.connected = [];
};

var RenderContext = function(context, vertices, segments, editor) {
    this.context = context;
    this.segments = segments;
    this.vertices = vertices;
    this.editor = editor;
	this.lastLoop = (new Date()).getMilliseconds();
	this.count = 1;
	this.fps = 0;
};

RenderContext.prototype.render = function(renderContext, editor) {
    var verts = renderContext.vertices;
    var segs = renderContext.segments;
    var context = renderContext.context;

    drawWindow(context, editor);

    // draw vertices
    for (var i = 0; i < verts.length; i++) {
        context.fillStyle = verts[i].currentColor;
        context.lineWidth = 2;
        context.strokeStyle = verts[i].currentColor;
        context.beginPath();
        context.arc(editor.zoom * (verts[i].pos.x + editor.panPos.x), editor.zoom * (verts[i].pos.y + editor.panPos.y), editor.zoom * verts[i].r, 0, Math.PI * 2, true);
        context.stroke();
    }

    // draw segments
    for (var j = 0; j < segs.length; j++) {
        pt1 = segs[j][0];
        pt2 = segs[j][1];
        context.lineWidth = editor.zoom * 5;
        context.strokeStyle = segs[j][2];
        context.beginPath();
        context.moveTo(editor.zoom * (pt1.pos.x + editor.panPos.x), editor.zoom * (pt1.pos.y + editor.panPos.y));
        context.lineTo(editor.zoom * (pt2.pos.x + editor.panPos.x), editor.zoom * (pt2.pos.y + editor.panPos.y));
        context.stroke();
    }

    // draw selection box
    if (editor.dragging && !editor.selected && !editor.panning) {
        context.beginPath();
        context.strokeStyle = "#020202";
        context.lineWidth = 0.5;
        context.rect(editor.dragStart.x, editor.dragStart.y, editor.gsPos.x - editor.dragStart.x, editor.gsPos.y - editor.dragStart.y);
        context.stroke();
    }

	if(editor.debug){
		context.font = "16px serif";
		// color fps based on how high it is
		context.fillStyle = this.fps < 50 ? (this.fps < 30? (this.fps < 15? "#ff0000" : "#ff8000") : "#ffff00") : "#00ff00"
		context.fillText("FPS: " + this.fps, 0, 16);
		context.fillStyle="#00ff00";
		context.fillText("Verts: " + editor.vertices.length, 0, 32);
		context.fillText("Segs: " + editor.segments.length, 0, 48);
	}
	
	// calculate fps
	var currentLoop = (new Date()).getMilliseconds();
    if (this.lastLoop > currentLoop) {
      this.fps = this.count;
      this.count = 1;
    } else {
      this.count += 1;
    }
    this.lastLoop = currentLoop;
	
    // go to the next frame
    window.requestAnimationFrame(function() {
        renderContext.render(renderContext, editor);
    });
};