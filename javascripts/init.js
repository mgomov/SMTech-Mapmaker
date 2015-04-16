window.onload = function() {
    var canvas = document.getElementById("canvas");
    var context = canvas.getContext('2d');

    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;


    window.onresize = function() {
        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;

    }

    var vertices = [];
    var segments = [];
    for (var i = 0; i < 10; i++) {
        for (var j = 0; j < 10; j++) {
            vertices.push(new vertex(i * 100, j * 100));
        }
    }

    var mouseIsDown = false;
    var dragOffset = {};
    dragOffset.x = 0;
    dragOffset.y = 0;

    var editor = new Editor(vertices, segments);
    window.addEventListener('keydown', editor.keydown, false);
    canvas.onmousedown = editor.mdown;
    canvas.onmouseup = editor.mup;
    canvas.onmousemove = editor.mmove;

    renderContext = new RenderContext(context, vertices, segments, editor);

    window.requestAnimationFrame(function(delta) {
        renderContext.render(renderContext, editor);
    });
}