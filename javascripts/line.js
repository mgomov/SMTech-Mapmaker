// TODO useless constructor, refactor 
var line = function(v1, v2) {
    this.v1 = {
        x: v1.pos.x,
        y: v1.pos.y
    };
    this.v2 = {
        x: v2.pos.x,
        y: v2.pos.y
    };
}

// bsp concept
line.prototype.ahead = function(other) {
    p1 = this.position(other.v1);
    p2 = this.position(other.v2);
    return p2 + p1 < 0;
}

line.prototype.position = function(vtx) {
    // http://stackoverflow.com/questions/7624920/number-sign-in-javascript
    function sign(x) {
            return typeof x === 'number' ? x ? x < 0 ? -1 : 1 : x === x ? 0 : NaN : NaN;
        }
        // sign( (Bx-Ax)*(Y-Ay) - (By-Ay)*(X-Ax) ) http://stackoverflow.com/questions/1560492/how-to-tell-whether-a-point-is-to-the-right-or-left-side-of-a-line
    return sign((this.v2.x - this.v1.x) * (vtx.y - this.v1.y) - (this.v2.y - this.v1.y) * (vtx.x - this.v1.x));
}

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