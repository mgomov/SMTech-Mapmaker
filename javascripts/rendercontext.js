drawWindow = function(context, editor) {
    context.fillStyle = "#f0f0f0";
    context.lineWidth = 1;
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid(context, editor);
};

drawGrid = function(context, editor) {
    //console.log(editor.gridHeight);
    for (var x = 0.5; x < canvas.width; x += editor.gridHeight) {
        context.moveTo(x + editor.panPos.x % editor.gridHeight, 0);
        context.lineTo(x + editor.panPos.x % editor.gridHeight, canvas.height);
    }

    for (var y = 0.5; y < canvas.height; y += editor.gridHeight) {
        context.moveTo(0, y + editor.panPos.y % editor.gridHeight);
        context.lineTo(canvas.width, y + editor.panPos.y % editor.gridHeight);
    }

    context.strokeStyle = "#ddd";
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
        context.arc(verts[i].pos.x + editor.panPos.x, verts[i].pos.y + editor.panPos.y, verts[i].r, 0, Math.PI * 2, true);
        context.stroke();
    }

    // draw segments
    for (var j = 0; j < segs.length; j++) {
        pt1 = segs[j][0];
        pt2 = segs[j][1];
        context.lineWidth = 5;
        context.strokeStyle = "#00ff00";
        context.beginPath();
        context.moveTo(pt1.pos.x + editor.panPos.x, pt1.pos.y + editor.panPos.y);
        context.lineTo(pt2.pos.x + editor.panPos.x, pt2.pos.y + editor.panPos.y);
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

    // go to the next frame
    window.requestAnimationFrame(function() {
        renderContext.render(renderContext, editor);
    });
};