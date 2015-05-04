var EasyBSP = function(verts, segs) {
    this.verts = verts;
    this.segs = segs;
    this.lines = [];
}
var __ed;
// editor for debugging
EasyBSP.prototype.partition = function(editor) {
    for (var i = 0; i < this.segs.length; i++) {
		var ln = new line(this.segs[i][0], this.segs[i][1], editor);
		ln._idx = i;
        this.lines.push(ln);
    }
	__ed = editor;
	console.log(this.ed);
	//var lines = this.lines;
	
	// console.clear();
	// console.log(editor.towards);
	
	// for(var i = 0; i < this.segs.length; i++){
		// this.segs[i][2] = "#00ff00";
	// }
	
	// for(var i = 0; i < lines.length; i++){
		// /*
		// var normal = lines[i].normal(true);
		// var v1 = new vertex(normal.v1.x, normal.v1.y);
		// var v2 = new vertex(normal.v2.x, normal.v2.y);
		// this.verts.push(v1);
		// this.verts.push(v2);
		// this.segs.push([v1, v2, "#ff0000"]);
		
		
		
		// for(var j = 0; j < lines.length; j++){
			// if(i == j) continue;
			// var dir = lines[i].ahead(lines[j]);
			// var ln = lines[j].mid();
			// var v1 = new vertex(ln.x, ln.y);
			// var v2 = new vertex(ln.x + dir.x, ln.y + dir.y);
			// this.verts.push(v1);
			// this.verts.push(v2);
			// this.segs.push([v1, v2, "#ff0000"]);  
		// }
		// */
	
	// }
	
	// var concave = true;
	// for(var i = 0; i < lines.length; i++){
		// lines[i].__idx = i;
		// console.log("Testing idx " + i);
		// for(var j = 0; j < lines.length; j++){
			// if(i == j) continue;
			// if(lines[j].ahead(lines[i], editor.towards)){
				// log([lines[j], "ahead", lines[i]]);
			// } else {
				// concave = false;
			// }
		// }
	// }
	
	// log(["concavity:", concave]);
	
	// log(['segs', this.segs]);
	
	// // debugging some normal stuff
	// return;
	
	
    // create the BSP tree
	var limit = 3;
	// dumb heuristic, just picks a random line
	//this.head = new BSPNode(this.lines, this.dumbHeuristic, limit);
	
	// binary split heuristic, try to split in half 
    // this.head = new BSPNode(this.lines, this.binaryHeuristic, limit);

	// balanced heuristic, split according to number of linesegs on each side 
	this.head = new BSPNode(this.lines, this.balancedHeuristic, limit);
	
    // for debugging, clear verts&segs
    this.segs.length = 0;
    this.verts.length = 0;

    var ezbsp = this;
    var _additrs = 0

    function addAll(node) {
        // debug
        _additrs++;
        if (node == undefined || node.value == undefined) return;

        if (!(node.ahead == undefined) && node.ahead.length && node.ahead.length > 0) {
            var color = '#' + Math.floor(Math.random() * 16777215).toString(16);
            var arr = node.ahead;
            for (var i = 0; i < arr.length; i++) {
                v1 = new vertex(arr[i].v1.x, arr[i].v1.y);
                v2 = new vertex(arr[i].v2.x, arr[i].v2.y);
                ezbsp.segs.push([v1, v2, color]);
                ezbsp.verts.push(v1);
                ezbsp.verts.push(v2);
            }
        } else {
            addAll(node.ahead);
        }

        if (!(node.behind == undefined) && node.behind.length && node.behind.length > 0) {
            var color = '#' + Math.floor(Math.random() * 16777215).toString(16);
            var arr = node.behind;
            for (var i = 0; i < arr.length; i++) {
                v1 = new vertex(arr[i].v1.x, arr[i].v1.y);
                v2 = new vertex(arr[i].v2.x, arr[i].v2.y);
                ezbsp.segs.push([v1, v2, color]);
                ezbsp.verts.push(v1);
                ezbsp.verts.push(v2);
            }
        } else {
            addAll(node.behind);
        }

        var rise = node.value.v1.y - node.value.v2.y
        var run = node.value.v1.x - node.value.v2.x;
        rise = 0;
        run = 0;
        v1 = new vertex(node.value.v1.x + run * 1000, node.value.v1.y + rise * 1000);
        v2 = new vertex(node.value.v2.x - run * 1000, node.value.v2.y - rise * 1000);
        ezbsp.segs.push([v1, v2, "#ff0000"]);
        ezbsp.verts.push(v1);
        ezbsp.verts.push(v2);

    };
	
	
	__ed.vertices.push(new vertex(0, 0));
    addAll(this.head);
};

// naive heuristic, just pops the first line in the list out and partitions on that
EasyBSP.prototype.dumbHeuristic = function(lines){
	return lines.splice(parseInt(lines.length / 2, 10), 1)[0];
};

// tries to partition in half based on area
// not finished
EasyBSP.prototype.binaryHeuristic = function(lines){
	var splitter;
	var bl = {};
	var tr = {};
	bl.x = Number.MAX_VALUE;
	bl.y = Number.MAX_VALUE;
	tr.x = -1 * Number.MAX_VALUE;
	tr.y = -1 * Number.MAX_VALUE;
	
	for(var i = 0; i < lines.length; i++){
		var l = lines[i];
		var lx = Math.min(l.v1.x, l.v2.x);
		var ly = Math.min(l.v1.y, l.v2.y);
		var hx = Math.max(l.v1.x, l.v2.x);
		var hy = Math.max(l.v1.y, l.v2.y);
		
		if(lx < bl.x){
			bl.x = lx;
		}
		if(ly < bl.y){
			bl.y = ly;
		}
		if(tr.x < hx){
			tr.x = hx;
		}
		if(tr.y < hy){
			tr.y = hy;
		}
	}
		
	var mindiff = Number.MAX_VALUE;
	
	// rough integral function for getting one half of the area of the box defined by (bl, tr) split by line
	var integral = function(bl, tr, line){
		// get our line into point-slope to work with it
		// y = mx + b form of line
		var rise = line.v2.y - line.v1.y;
		var run = line.v2.x - line.v1.x;
		var m = rise/run;
		
		// plug in one of the vertices b = y - mx
		var b = line.v1.y - (m * line.v1.x);
		
		var sum = 0;
		
		// tweak this... for accuracy / speed compromise
		var base = 10;
		for(var x = 0; x < tr.x - bl.x; x += base){
			var y = ((m * x) + b);
			if(y > 0 && y < (tr.y - bl.y)){
				sum += base * y;
			}
			// grab remainder of area and add it to sum
			if(y > (tr.y - bl.y)){
				sum += ((tr.x - bl.x) - x) * (tr.y - bl.y);
				break;
			}
		}
		return sum;
	};
	
	var best = Number.MAX_VALUE;
	var bestIdx;
	for(var i = 0; i < lines.length; i++){
		// smallest difference between half of the current space's area and the area covered by the line
		var area = ((tr.x - bl.x) * (tr.y - bl.y)) / 2;
		var integ = integral(bl, tr, lines[i]);
		var current = area - integ;
		log(['area', area, 'integral', integ, 'current', current]);
		if(current < best){
			best = current;
			bestIdx = i;
		}
	}
	
	splitter = lines.splice(bestIdx, 1)[0];
	return splitter;
};

// attempt to balance the tree as best as possible
EasyBSP.prototype.balancedHeuristic = function(lines){
	var splitter;
	
	var closest = Number.MAX_VALUE;
	var closestIdx = -1;
	
	for(var i = 0; i < lines.length; i++){
		var current = lines[i];
		var count = 0;
		
		for(var j = 0; j < lines.length; j++){
			if(i == j){
				continue;
			}
			if(lines[j].__used){
				console.log("Skipping used line");
				continue;
			}
			
			var intersection = current.intersect(lines[j]);
			
			// if there's an intersection, that means adding a seg on each side,
			// of the current line, so add one here as well
			if(intersection.onOther || current.ahead(lines[j])){

					count++;
				
			}
		}
		
		if(Math.abs((lines.length / 2) - count) < closest && !lines[i].__used){
			closest = Math.abs((lines.length / 2) - count);
			closestIdx = i;
		} 
	}
	
	if(closestIdx == -1){
		console.log("Couldn't find an unused segment");
	}
	
	splitter = lines.splice(closestIdx, 1)[0];
	
	splitter.__used = true;
	
	return splitter;
};

EasyBSP.prototype.traverse = function(position) {
    this.verts.length = 0;
    this.segs.length = 0;

    var ezbsp = this;

    function addAll(node) {
        // debug

        if (node == undefined || node.value == undefined) return;

        if (!(node.ahead == undefined) && node.ahead.length && node.ahead.length > 0) {
            var color = '#ff0000';
            var arr = node.ahead;
            for (var i = 0; i < arr.length; i++) {
                v1 = new vertex(arr[i].v1.x, arr[i].v1.y);
                v2 = new vertex(arr[i].v2.x, arr[i].v2.y);
                ezbsp.segs.push([v1, v2, color]);
                ezbsp.verts.push(v1);
                ezbsp.verts.push(v2);
            }
        } else {
            addAll(node.ahead);
        }

        if (!(node.behind == undefined) && node.behind.length && node.behind.length > 0) {
            var color = '#ff0000';
            var arr = node.behind;
            for (var i = 0; i < arr.length; i++) {
                v1 = new vertex(arr[i].v1.x, arr[i].v1.y);
                v2 = new vertex(arr[i].v2.x, arr[i].v2.y);
                ezbsp.segs.push([v1, v2, color]);
                ezbsp.verts.push(v1);
                ezbsp.verts.push(v2);
            }
        } else {
            addAll(node.behind);
        }

        var rise = node.value.v1.y - node.value.v2.y
        var run = node.value.v1.x - node.value.v2.x;
        rise = 0;
        run = 0;
        v1 = new vertex(node.value.v1.x + run * 1000, node.value.v1.y + rise * 1000);
        v2 = new vertex(node.value.v2.x - run * 1000, node.value.v2.y - rise * 1000);
        ezbsp.segs.push([v1, v2, "#ff0000"]);
        ezbsp.verts.push(v1);
        ezbsp.verts.push(v2);

    };
    addAll(this.head);

    /*
	void	Draw_BSP_Tree (BSP_tree *tree, point eye)
{
   real   result = tree->partition.Classify_Point (eye);
   if (result > 0)
   {
      Draw_BSP_Tree (tree->back, eye);
      tree->polygons.Draw_Polygon_List ();
      Draw_BSP_Tree (tree->front, eye);
   }
   else if (result < 0)
   {
      Draw_BSP_Tree (tree->front, eye);
      tree->polygons.Draw_Polygon_List ();
      Draw_BSP_Tree (tree->back, eye);
   }
   else // result is 0
   {
      // the eye point is on the partition plane...
      Draw_BSP_Tree (tree->front, eye);
      Draw_BSP_Tree (tree->back, eye);
   }
}
	*/
    var traverse = function(node, pos) {
        if (node.value != undefined) {


            if (node.value.position(pos) <= 0) {
                if (node.ahead.length != undefined) {
                    console.log("adding bulk geo " + node.ahead.length);
                    for (var i = 0; i < node.ahead.length; i++) {
                        v1 = new vertex(node.ahead[i].v1.x, node.ahead[i].v1.y);
                        v2 = new vertex(node.ahead[i].v2.x, node.ahead[i].v2.y);
                        ezbsp.verts.push(v1);
                        ezbsp.verts.push(v2);
                        ezbsp.segs.push([v1, v2, "#00ff00"]);
                    }
                    /*
					if(node.behind.length != undefined){
						log(['adding behind geo']);
						for(var i = 0; i < node.behind.length; i++){
							v1 = new vertex(node.behind[i].v1.x, node.behind[i].v1.y);
							v2 = new vertex(node.behind[i].v2.x, node.behind[i].v2.y);
							ezbsp.verts.push(v1);
							ezbsp.verts.push(v2);
							ezbsp.segs.push([v1, v2, "#00ff00"]);
						}
					}
					*/
                } else {
                    traverse(node.ahead, pos);
                }
            } else {
                if (node.behind.length != undefined) {
                    console.log("adding bulk geo " + node.behind.length);
                    for (var i = 0; i < node.behind.length; i++) {
                        v1 = new vertex(node.behind[i].v1.x, node.behind[i].v1.y);
                        v2 = new vertex(node.behind[i].v2.x, node.behind[i].v2.y);
                        ezbsp.verts.push(v1);
                        ezbsp.verts.push(v2);
                        ezbsp.segs.push([v1, v2, "#00ff00"]);
                    }
                    /*
					if(node.ahead.length != undefined){
						log(['adding ahead geo']);
						for(var i = 0; i < node.ahead.length; i++){
							v1 = new vertex(node.ahead[i].v1.x, node.ahead[i].v1.y);
							v2 = new vertex(node.ahead[i].v2.x, node.ahead[i].v2.y);
							ezbsp.verts.push(v1);
							ezbsp.verts.push(v2);
							ezbsp.segs.push([v1, v2, "#00ff00"]);
						}
					}
					*/
                } else {
                    traverse(node.behind, pos);
                }
            }

            v1 = new vertex(node.value.v1.x, node.value.v1.y);
            v2 = new vertex(node.value.v2.x, node.value.v2.y);
            ezbsp.verts.push(v1);
            ezbsp.verts.push(v2);
            ezbsp.segs.push([v1, v2, "#0000ff"]);
        } else {
            if (node.ahead != undefined) {
                log(["losing something", node.ahead]);
            }
            if (node.behind != undefined) {
                log(["losing something", node.behind]);
            }
        }
    };

    traverse(this.head, position);
};

var _nidx = 0;

var BSPNode = function(lines, heuristic, limit) {
    this.__idx = _nidx++;
	log([this.__idx, lines.length, lines]);
	var pt = this.grabCenter(lines);
    this.value = heuristic(lines);
    this.ahead = [];
    this.behind = [];
    this.limit = limit;
	if(this.concavity(lines, pt)){
		console.log("fully concave node");
		this.ahead = lines;
		return;
	}
    this.partition(this.value, lines);
	
	// debug yeah yeah
	__ed.segments.push([new vertex(this.value.v1.x, this.value.v1.y), new vertex(this.value.v2.x, this.value.v2.y),"#00ff00"]);
	
	// hopefully leafy
	this.value.__used = true;
	this.ahead.push(this.value);
	
	log(["splitting on", this.value]);
	
	if(!this.concavity(this.ahead, pt)){
		this.ahead = new BSPNode(this.ahead, heuristic, limit);
	} else {
		console.log("we have leaftoff ahead");
	}
	
	if(!this.concavity(this.behind, pt)){
		this.behind = new BSPNode(this.behind, heuristic, limit);
	} else {
		console.log("we have leaftoff behind");
	}
	
	// this is for normal 'bsp', we want 'leafy' concave bsp
	/*
    // not sure if this has to be stored
    if (lines.length > limit) {
        if (this.ahead.length > limit) {
            this.ahead = new BSPNode(this.ahead, heuristic, limit);
        }
        if (this.behind.length > limit) {
            this.behind = new BSPNode(this.behind, heuristic, limit);
        }
    }
	*/
};

BSPNode.prototype.grabCenter = function(lines){
	var bl = {};
	var tr = {};
	bl.x = Number.MAX_VALUE;
	bl.y = Number.MAX_VALUE;
	tr.x = Number.MIN_VALUE;
	tr.y = Number.MIN_VALUE;
	
	for(var i = 0; i < lines.length; i++){
		var l = lines[i];
		var lx = Math.min(l.v1.x, l.v2.x);
		var ly = Math.min(l.v1.y, l.v2.y);
		var hx = Math.max(l.v1.x, l.v2.x);
		var hy = Math.max(l.v1.y, l.v2.y);
		
		if(lx < bl.x){
			bl.x = lx;
		}
		if(ly < bl.y){
			bl.y = ly;
		}
		if(tr.x < hx){
			tr.x = hx;
		}
		if(tr.y < hy){
			tr.y = hy;
		}
	}
	//950,600,750,600,6943119,750,600,750,400,9779202,750,400,950,400,9123218,950,400,950,600,7852902,900,550,800,550,14078725,800,550,800,450,3049033,800,450,900,450,14462668,900,450,900,550,7573756,
	var pos = {x:bl.x + (tr.x - bl.x) / 2, y:bl.y + (tr.y - bl.y) / 2};
	//var pos = {x:tr.x, y:tr.y};
	
	__ed.vertices.push(new vertex(pos.x, pos.y));
	return pos;
}

BSPNode.prototype.concavity = function(lines, por){
	for(var i = 0; i < lines.length; i++){
		for(var j = 0; j < lines.length; j++){
			if(i == j) continue;
			if(!lines[j].ahead(lines[i]), por){
				return false;
			}
		}
	}
	
	return true;
};

BSPNode.prototype.partition = function(splitOriginal, lines) {
    var ahead = [];
    var behind = [];

    
	// Copy of the partitioning line
    var split = new line(new vertex(splitOriginal.v1.x, splitOriginal.v1.y), new vertex(splitOriginal.v2.x, splitOriginal.v2.y));
	
	// TODO figure out a better way other than just *1000 to extend the line,
    // e.g. calculate the map borders and project to that
    rise = (split.v1.y - split.v2.y);
    run = split.v1.x - split.v2.x;
    split.v1.x += run * 1000;
    split.v1.y += rise * 1000;
    split.v2.x -= run * 1000;
    split.v2.y -= rise * 1000;

	// hmm...
	var resplit = false;
    
	for (var i = 0; i < lines.length; i++) {
        var intersection = split.intersect(lines[i]);
        if (intersection.onOther) {
            nl1 = new line(new vertex(intersection.x, intersection.y), new vertex(lines[i].v1.x, lines[i].v1.y));
            nl2 = new line(new vertex(intersection.x, intersection.y), new vertex(lines[i].v2.x, lines[i].v2.y));
			if(lines[i].__used){
				nl1.__used = true;
				nl2.__used = true;
				resplit = true;
			}
            if (split.position(nl1.v2) < 0) {
                ahead.push(nl1);
                behind.push(nl2);
            } else {
                ahead.push(nl2);
                behind.push(nl1);
            }
        } else {
            if (split.ahead(lines[i])) {
                ahead.push(new line(new vertex(lines[i].v1.x, lines[i].v1.y), new vertex(lines[i].v2.x, lines[i].v2.y)));
            } else {
                behind.push(new line(new vertex(lines[i].v1.x, lines[i].v1.y), new vertex(lines[i].v2.x, lines[i].v2.y)));
            }
        }
    }

    this.ahead = ahead;
    this.behind = behind;
	
	return resplit;
};