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
    var things = [];
	/*
    for (var i = 0; i < 10; i++) {
        for (var j = 0; j < 10; j++) {
            vertices.push(new vertex(i * 100, j * 100));
        }
    }

    for (var i = 0; i < 15; i++) {
        segments.push([vertices[Math.floor(Math.random() * vertices.length)], vertices[Math.floor(Math.random() * vertices.length)], "#00ff00"]);
    }
	*/

    var mouseIsDown = false;
    var dragOffset = {};
    dragOffset.x = 0;
    dragOffset.y = 0;

    var editor = new Editor(vertices, segments, things);
    window.addEventListener('keydown', editor.keydown, false);
    canvas.onmousedown = editor.mdown;
    canvas.onmouseup = editor.mup;
    canvas.onmousemove = editor.mmove;
    document.onmousewheel = editor.mwheel;

    renderContext = new RenderContext(context, vertices, segments,things, editor);

    window.requestAnimationFrame(function(delta) {
        renderContext.render(renderContext, editor);
    });

    $('.dropdown-persist').on('click', function(event) {
        $(this).parent().toggleClass('open');
    });

    $('body').on('click', function(e) {
        if (!$('.dropdown-persist').is(e.target) && $('.dropdown-persist').has(e.target).length === 0 && $('.open').has(e.target).length === 0) {
            // hacky but works
            $('li').removeClass('open');
        }
    });
}
