var EasyBSP = function(verts, segs){
	this.verts = verts;
	this.segs = segs;
	this.lines = [];
}

EasyBSP.prototype.partition = function(){
	log([this.verts, this.segs]);
	for(var i = 0; i < this.segs.length; i++){
		this.lines.push(new line(this.segs[i][0], this.segs[i][1]));
		
	}
	log([this.lines]);
	
	// the line to do the first partition step along
	// TODO pick a better initial line
	// TODO find borders of map and span to that, not just *1000
	var split = this.lines.splice(parseInt(this.lines.length / 2, 10), 1)[0];
	
	// create the BSP tree
	head = new BSPNode(split, this.lines, 10);
	
	// for debugging, clear verts&segs
	this.segs.length = 0;
	this.verts.length = 0;
	
	var ezbsp = this;
	var _additrs = 0
	function addAll(node){
		//console.log(node);
		_additrs++;
		console.log(_additrs);
		if(node == undefined || node.value == undefined ) return;
		
		
		
		if(!(node.ahead == undefined) && node.ahead.length && node.ahead.length >0){
			var color = '#'+Math.floor(Math.random()*16777215).toString(16);
			var arr = node.ahead;
			for(var i = 0; i < arr.length; i++){
				v1 = new vertex(arr[i].v1.x, arr[i].v1.y);
				v2 = new vertex(arr[i].v2.x, arr[i].v2.y);
				ezbsp.segs.push([v1, v2, color]);
				ezbsp.verts.push(v1);
				ezbsp.verts.push(v2);
			}
			
			
		} else {
			addAll(node.ahead);
		}
		
		if(!(node.behind == undefined) && node.behind.length && node.behind.length >0){
			var color = '#'+Math.floor(Math.random()*16777215).toString(16);
			var arr = node.behind;
			for(var i = 0; i < arr.length; i++){
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
		
	}
	
	addAll(head);
	
	v1 = new vertex(split.v1.x, split.v1.y);
	v2 = new vertex(split.v2.x, split.v2.y);
	this.segs.push([v1, v2, "#ff00ff"]);
	this.verts.push(v1);
	this.verts.push(v2);
}

var _nidx = 0;

var BSPNode = function(divider, lines, limit){
	this.__idx = _nidx++;
	this.value = divider;
	this.ahead = [];
	this.behind = [];
	this.limit = limit;
	this.partition(divider, lines);
	
	// not sure if this has to be stored
	var len = lines.length;
	log(['new bsp node', this, lines]);
	if(len > limit){
		if(this.ahead.length > limit){
			console.log("creating ahead for " + lines.length + " " + len);
			this.ahead = new BSPNode(this.ahead.splice(0, 1)[0], this.ahead, limit);
		}
		if(this.behind.length > limit){
		console.log("creating behind for " + lines.length + " " + len);
			this.behind = new BSPNode(this.behind.splice(0, 1)[0], this.behind, limit);
		}
	}
};

BSPNode.prototype.partition = function(splitOriginal, lines){
	var ahead = [];
	var behind = []; 
	
	// TODO figure out a better way other than just *1000 to extend the line,
	// e.g. calculate a borders and project to that
	var split = new line(new vertex(splitOriginal.v1.x, splitOriginal.v1.y), new vertex(splitOriginal.v2.x, splitOriginal.v2.y));
	rise = (split.v1.y - split.v2.y);
	run = split.v1.x - split.v2.x;
	split.v1.x += run * 1000;
	split.v1.y += rise * 1000;
	split.v2.x -= run * 1000;
	split.v2.y -= rise * 1000;
	
	for(var i = 0; i < lines.length; i++){
		var intersection = split.intersect(lines[i]);
		if(intersection.onOther){
			nl1 = new line(new vertex(intersection.x, intersection.y), new vertex(lines[i].v1.x, lines[i].v1.y));
			nl2 = new line(new vertex(intersection.x, intersection.y), new vertex(lines[i].v2.x, lines[i].v2.y));
			if(split.position(nl1.v2) < 0){
				ahead.push(nl1);
				behind.push(nl2);
			} else {
				ahead.push(nl2);
				behind.push(nl1);
			}
		} else {
			if(split.ahead(lines[i])){
				ahead.push(new line(new vertex(lines[i].v1.x, lines[i].v1.y), new vertex(lines[i].v2.x, lines[i].v2.y)));
			} else {
				behind.push(new line(new vertex(lines[i].v1.x, lines[i].v1.y), new vertex(lines[i].v2.x, lines[i].v2.y)));
			}
		}
	}
	
	this.ahead = ahead;
	this.behind = behind;
};