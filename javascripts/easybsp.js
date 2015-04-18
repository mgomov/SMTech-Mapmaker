var EasyBSP = function(verts, segs) {
    this.verts = verts;
    this.segs = segs;
    this.lines = [];
}

EasyBSP.prototype.partition = function() {
    for (var i = 0; i < this.segs.length; i++) {
        this.lines.push(new line(this.segs[i][0], this.segs[i][1]));

    }

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
	var closestIdx = 0;
	
	for(var i = 0; i < lines.length; i++){
		var current = lines[i];
		var count = 0;
		
		for(var j = 0; j < lines.length; j++){
			if(i == j){
				continue;
			}
			
			var intersection = current.intersect(lines[j]);
			
			// if there's an intersection, that means adding a seg on each side,
			// of the current line, so add one here as well
			if(intersection.onOther || current.ahead(lines[j])){

					count++;
				
			}
		}
		
		if(Math.abs((lines.length / 2) - count) < closest){
		
			closest = Math.abs((lines.length / 2) - count);
			closestIdx = i;
		} 
	}
	
	splitter = lines.splice(closestIdx, 1)[0];
	
	return splitter;
};

EasyBSP.prototype.traverse = function(position) {

    log(["TRAVERSING", "", "", this.head]);

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
        log([node]);
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
    this.value = heuristic(lines);
    this.ahead = [];
    this.behind = [];
    this.limit = limit;
    this.partition(this.value, lines);

    // not sure if this has to be stored
    var len = lines.length;
    if (len > limit) {
        if (this.ahead.length > limit) {
            this.ahead = new BSPNode(this.ahead, heuristic, limit);
        }
        if (this.behind.length > limit) {
            this.behind = new BSPNode(this.behind, heuristic, limit);
        }
    }
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

    for (var i = 0; i < lines.length; i++) {
        var intersection = split.intersect(lines[i]);
        if (intersection.onOther) {
            nl1 = new line(new vertex(intersection.x, intersection.y), new vertex(lines[i].v1.x, lines[i].v1.y));
            nl2 = new line(new vertex(intersection.x, intersection.y), new vertex(lines[i].v2.x, lines[i].v2.y));
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
};