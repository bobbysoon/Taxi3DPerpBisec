#version 120

/* 
* Reviewing ray-tracing basics in glsl. Loosely based on Inigo Quilez's articles. 
* Éric Renaud-Houde - num3ric.com
* December 2012
*/

//	dec. 2015: used ray caster for taxi-metric stuff. All ugliness credit to bobbysoon
//	https://github.com/bobbysoon/Taxi3DPerpBisec

#ifdef GL_ES
precision highp float;
#endif

#define EPS 1e-04
#define PI 3.14159265
#define TWO_PI 6.28318530

uniform vec2 mouse;
uniform vec2 resolution;
uniform float zoom;

uniform vec3 camPos;
uniform vec3 sphere1Pos;
uniform vec3 sphere2Pos;

struct Ray {
	vec3 o; //origin
	vec3 d; //direction (should always be normalized)
};

struct Sphere {
	vec3 pos;   //center of sphere position
	float rad;  //radius
	vec4 col;   //surface color
};

struct Camera {
	vec3 pos;   //camera position
	vec3 aim;   //view target 
	float fov;  //field of view
};


float pointLineDist( vec3 P, vec3 L0, vec3 L1) {
	vec3 v = L1 - L0;
	vec3 w = P - L0;
	
	float c1 = dot(w,v);
	float c2 = dot(v,v);
	float b = c1 / c2;
	
	vec3 Pb = L0 + b * v;
	return length(P-Pb);
}

#define BIG 32767.0
float iRayLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4, inout vec3 llMidpoint) {
	vec3 p13=p1-p3;
	vec3 p43=p4-p3;
	if (abs(p43.x) < EPS && abs(p43.y) < EPS && abs(p43.z) < EPS)      return BIG;
	vec3 p21=p2-p1;
	if (abs(p21.x) < EPS && abs(p21.y) < EPS && abs(p21.z) < EPS)      return BIG;

	float d1343 = p13.x * p43.x + p13.y * p43.y + p13.z * p43.z;
	float d4321 = p43.x * p21.x + p43.y * p21.y + p43.z * p21.z;
	float d1321 = p13.x * p21.x + p13.y * p21.y + p13.z * p21.z;
	float d4343 = p43.x * p43.x + p43.y * p43.y + p43.z * p43.z;
	float d2121 = p21.x * p21.x + p21.y * p21.y + p21.z * p21.z;
	
	float denom = d2121 * d4343 - d4321 * d4321;
	if (abs(denom) < EPS)      return BIG;
	float numer = d1343 * d4321 - d1321 * d4343;

	float mua = numer / denom;
	float mub = (d1343 + d4321 * (mua)) / d4343;

	if (0.0<=mua) {
		vec3 pa=p1+p21*mua;
		vec3 pb=p3+p43*mub;
		llMidpoint= (pa+pb)/2.0;
		return length(pa-pb);
	}
	return BIG;
}


// mat3 version of what's at http://www.neilmendoza.com/glsl-rotation-about-an-arbitrary-axis/
mat3 RotationMatrix(vec3 axis, float angle) {
	axis = normalize(axis);
	float s = sin(angle);
	float c = cos(angle);
	float oc = 1.0 - c;
	
	return mat3(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  
			oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  
			oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c);
}

mat3 rotationMatrix=	RotationMatrix(vec3(0,1,0), TWO_PI*mouse.x-PI)*
						RotationMatrix(vec3(1,0,0), TWO_PI*mouse.y-PI);

#define focusDistance 5.0
vec3 pos= rotationMatrix*vec3(0.0, -1.5, focusDistance);
Camera cam = Camera(pos,
					normalize(pos)*.5,
					10.0*zoom);

Sphere sphere1 = Sphere(sphere1Pos, .5, vec4(0.7, 0.9, 0.0, 1.0));
Sphere sphere2 = Sphere(sphere2Pos, .5, vec4(1.0, 0.2, 0.0, 1.0));



float mDist(vec3 p1, vec3 p2) {vec3 d=p1-p2;return abs(d.x)+abs(d.y)+abs(d.z);}

int Region(vec3 p) {return mDist(p,sphere1.pos)<mDist(p,sphere2.pos)?1:2;}


//	for point p which lies virtually equidistant between spheres (in taxi metric),
// sample points around it using 3x3x3 spread
#define spread_sz 26
vec3 spread[spread_sz] = vec3[](
	vec3(-1.0,-1.0,-1.0),
	vec3( 0.0,-1.0,-1.0),
	vec3( 1.0,-1.0,-1.0),
	vec3(-1.0, 0.0,-1.0),
	vec3( 0.0, 0.0,-1.0),
	vec3( 1.0, 0.0,-1.0),
	vec3(-1.0, 1.0,-1.0),
	vec3( 0.0, 1.0,-1.0),
	vec3( 1.0, 1.0,-1.0),
	vec3(-1.0,-1.0, 0.0),
	vec3( 0.0,-1.0, 0.0),
	vec3( 1.0,-1.0, 0.0),
	vec3(-1.0, 0.0, 0.0),
	vec3( 1.0, 0.0, 0.0),
	vec3(-1.0, 1.0, 0.0),
	vec3( 0.0, 1.0, 0.0),
	vec3( 1.0, 1.0, 0.0),
	vec3(-1.0,-1.0, 1.0),
	vec3( 0.0,-1.0, 1.0),
	vec3( 1.0,-1.0, 1.0),
	vec3(-1.0, 0.0, 1.0),
	vec3( 0.0, 0.0, 1.0),
	vec3( 1.0, 0.0, 1.0),
	vec3(-1.0, 1.0, 1.0),
	vec3( 0.0, 1.0, 1.0),
	vec3( 1.0, 1.0, 1.0));

vec3 TaxiNorm(vec3 p) {
	int nc=0,r=Region(p);
	vec3 norm=vec3(0.0,0.0,0.0);
	for (int i=0;i<spread_sz;i++) {
		if (Region(p+spread[i]*EPS) != r) {
			norm+= spread[i];
			nc+=1;
		}
	}
	return norm/nc;
}

void RayCast(vec3 rOrig, vec3 rDir) {
	vec3 p,cp= (sphere1.pos+sphere2.pos)/2.0;
	float maxDist= max(length(rOrig-sphere1.pos),length(rOrig-sphere2.pos))*2.0;
	float sphDist= length(sphere1.pos-sphere2.pos);
	float l, lMin=0.0,lMax= length(rOrig-cp)*2;
	int r, r1=Region(rOrig+rDir*lMin), r2=Region(rOrig+rDir*lMax);
	
	float brightness=0.0;
	if (r1!=r2) {
		while (lMax-lMin>1e-04) {
			l= (lMin+lMax)/2.0;
			p= rOrig+rDir*l;
			r= Region(p);
			if (r==r1) lMin=l;
			if (r==r2) lMax=l;
		}

		vec3 n= TaxiNorm(p);
		if (r==r1) n*=-1.0;

		brightness= dot(rDir,-n);
	} else p=cp;

	gl_FragColor= vec4(vec3(brightness),1.0);
	//	draw centroids
	float d, sd1= length(rOrig-sphere1.pos) , sd2= length(rOrig-sphere2.pos);
	if ( length(rOrig-sphere1.pos) < length(rOrig-sphere2.pos) )
		d= dot(normalize(sphere1.pos-rOrig),rDir);
	else
		d= dot(normalize(sphere2.pos-rOrig),rDir);
	if (d>.9999) {
		gl_FragColor.r= min(.5,gl_FragColor.r);
		gl_FragColor.g= max(.5,gl_FragColor.g);
		gl_FragColor.b= max(.5,gl_FragColor.b);
	}
}

void main( void ) {
	vec2 uv = gl_FragCoord.xy/resolution.xy - 0.5;
	vec3 d = (cam.aim - cam.pos) + rotationMatrix*vec3(cam.fov*uv, 0.0);
	d.y *= resolution.y/resolution.x;

	RayCast(cam.pos, normalize(d));
}

