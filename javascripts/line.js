// TODO useless constructor, refactor 
var line = function(v1, v2, ed) {
    this.v1 = {
        x: v1.pos.x,
        y: v1.pos.y
    };
    this.v2 = {
        x: v2.pos.x,
        y: v2.pos.y
    };
	
	this.epsilon = 0.0001;
	
	// for drawing debugging lines
	if(ed) this.ed = ed;
}

// bsp concept
line.prototype.ahead = function(other, towards) {
	if(towards){
		// a point on our plane, in this case the midpoint
		// TODO create good vector class
		var vec1 = {};
		vec1.x = (this.v1.x + this.v2.x) / 2;
		vec1.y = (this.v1.y + this.v2.y) / 2;
		
		// the other line's points
		var vec2 = {};
		vec2.x = other.v1.x;
		vec2.y = other.v1.y;
		
		var vec3 = {};
		vec3.x = other.v2.x;
		vec3.y = other.v2.y;
		
		// direction vectors, from point to line geo
		var dirvec1 = {};
		dirvec1.x = vec1.x - vec2.x;
		dirvec1.y = vec1.y - vec2.y;
		
		var dirvec2 = {};
		dirvec2.x = vec1.x - vec3.x;
		dirvec2.x = vec1.y - vec3.y;
		
		// the normal line of the plane being tested against
		var normalLine = this.normal(true);
		var normal = {};
		normal.x = normalLine.v2.x - normalLine.v1.x;
		normal.y = normalLine.v2.y - normalLine.v1.y;

		// make sure that the normal is pointing towards the point of orientation
		// by taking the dot product of the normal and a vector composed of the
		// point of orientation and one of the plane's points (which will always 
		// point towards the point of orientation) and swapping the normal's direction
		// if necessary
		if(towards){
			if(normal.x * (towards.x - vec1.x) + normal.y * (towards.y - vec1.y) < -1 * this.epsilon){
				normal.x = normalLine.v1.x - normalLine.v2.x;
				normal.y = normalLine.v1.y - normalLine.v2.y;
			}
		}
		
		// debugging, show the normal vector
		if(this.ed)
			this.ed.segments.push([new vertex(this.mid().x, this.mid().y), new vertex(this.mid().x + normal.x, this.mid().y + normal.y) , "#ff0000"]);
		
		var dot1 = normal.x * dirvec1.x + normal.y * dirvec1.y;
		var dot2 = normal.x * dirvec2.x + normal.y * dirvec2.y;
		
		var behind = 0;
		var ahead = 0;
		var on = 0;
		
		
		if(Math.abs(vec1.x - this.v1.x) > this.epsilon && Math.abs(vec1.y - this.v1.y) > this.epsilon && Math.abs(vec1.x - this.v2.x) > this.epsilon && Math.abs(vec1.y - this.v2.y) > this.epsilon){
			if(dot1 > this.epsilon){
				behind++;
			} else if(dot1 < -1 * this.epsilon){
				ahead++;
			} else {
				behind++;
				ahead++;
				on++;
			}
		} else {
			ahead++;
		}
		
		if(Math.abs(vec2.x - this.v1.x) > this.epsilon && Math.abs(vec2.y - this.v1.y) > this.epsilon && Math.abs(vec2.x - this.v2.x) > this.epsilon && Math.abs(vec2.y - this.v2.y) > this.epsilon){
			if(dot2 > this.epsilon){
				behind++;
			} else if(dot2 < -1 * this.epsilon){
				ahead++;
			} 
			else {
				behind++;
				ahead++;
				on++;
			}
		} else {
			ahead++;
		}
		
		if(ahead > behind){
			return true;
		} else {
			return false;
		}
	} else {
		// old code
		p1 = this.position(other.v1);
		p2 = this.position(other.v2);
		return p2 + p1 < 0;
	}
}

line.prototype.position = function(vtx) {
    // http://stackoverflow.com/questions/7624920/number-sign-in-javascript
    function sign(x) {
            return typeof x === 'number' ? x ? x < 0 ? -1 : 1 : x === x ? 0 : NaN : NaN;
        }
        // sign( (Bx-Ax)*(Y-Ay) - (By-Ay)*(X-Ax) ) http://stackoverflow.com/questions/1560492/how-to-tell-whether-a-point-is-to-the-right-or-left-side-of-a-line
    return sign((this.v2.x - this.v1.x) * (vtx.y - this.v1.y) - (this.v2.y - this.v1.y) * (vtx.x - this.v1.x));
}

line.prototype.normal = function(translate){
	var dx = this.v2.x - this.v1.x;
	var dy = this.v2.y - this.v1.y;
	if(translate){
		var m = this.mid();
		var mx = m.x;
		var my = m.y;
		return new line(new vertex(-dy + mx, dx + my), new vertex(dy + mx, -dx+ my));
	} else {
		return new line(new vertex(-dy, dx), new vertex(dy, -dx));
	}
};

line.prototype.mid = function(){
	var mid = {};
	mid.x = (this.v1.x + this.v2.x) / 2;
	mid.y = (this.v1.y + this.v2.y) / 2;
	return mid;
}

line.prototype.length = function(){
	return Math.sqrt(Math.pow(this.v1.x - this.v2.x, 2) + Math.pow(this.v1.y - this.v2.y, 2));
};

// grabbed and adapted from from http://jsfiddle.net/justin_c_rounds/Gd2S2/
line.prototype.intersect = function(other) {
    // if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite) and booleans for whether line segment 1 or line segment 2 contain the point
    var denominator, a, b, numerator1, numerator2, result = {
        x: null,
        y: null,
        onThis: false,
        onOther: false
    };

    denominator = ((other.v2.y - other.v1.y) * (this.v2.x - this.v1.x)) - ((other.v2.x - other.v1.x) * (this.v2.y - this.v1.y));
    if (denominator == 0) {
        return result;
    }

    a = this.v1.y - other.v1.y;
    b = this.v1.x - other.v1.x;

    numerator1 = ((other.v2.x - other.v1.x) * a) - ((other.v2.y - other.v1.y) * b);
    numerator2 = ((this.v2.x - this.v1.x) * a) - ((this.v2.y - this.v1.y) * b);

    a = numerator1 / denominator;
    b = numerator2 / denominator;

    // if we cast these lines infinitely in both directions, they intersect here:
    result.x = this.v1.x + (a * (this.v2.x - this.v1.x));
    result.y = this.v1.y + (a * (this.v2.y - this.v1.y));
    /*
            // it is worth noting that this should be the same as:
            x = other.v1.x + (b * (other.v2.x - other.v1.x));
            y = other.v1.x + (b * (other.v2.y - other.v1.y));
            */
    // if line1 is a segment and line2 is infinite, they intersect if:
    if (a > 0 && a < 1) {
        result.onThis = true;
    }
    // if line2 is a segment and line1 is infinite, they intersect if:
    if (b > 0 && b < 1) {
        result.onOther = true;
    }
    // if line1 and line2 are segments, they intersect if both of the above are true
    return result;
};

line.prototype.ptDist = function(v){

}