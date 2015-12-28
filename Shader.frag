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

uniform float time;
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


float pointLineDist( vec3 P, vec3 L0, vec3 L1)
{
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

#define focusDistance (5.0*zoom)
Camera cam = Camera(rotationMatrix*vec3(0.0, -1.5, focusDistance),
					vec3(0.0, 0.5, 0.0),
					10.0);

float rrad = 1.35;
float rspeed = 0.5;

Sphere sphere1 = Sphere(sphere1Pos, .1, vec4(0.7, 0.9, 0.0, 1.0));
Sphere sphere2 = Sphere(sphere2Pos, .1, vec4(1.0, 0.2, 0.0, 1.0));

float reflection_factor = 0.25;
vec4 specularColor = vec4(1.0);
vec3 lightPos = vec3(10.0, 10.0, 10.0);
vec4 amb = vec4(0.1, 0.2, 0.4, 1.0);

/* ---------- Object intersection functions ---------- */

float intersectSphere(in Ray ray, in Sphere sphere)
{
	vec3 oc = ray.o - sphere.pos;
	float b = 2.0 * dot(ray.d, oc);
	float c = dot(oc, oc) - sphere.rad*sphere.rad;
	float disc = b * b - 4.0 * c;
	
	if (disc < 0.0)
		return -1.0;

	// compute q as described above
	float q;
	if (b < 0.0)
		q = (-b - sqrt(disc))/2.0;
	else
		q = (-b + sqrt(disc))/2.0;
	
	float t0 = q;
	float t1 = c / q;
	
	// make sure t0 is smaller than t1
	if (t0 > t1) {
		// if t0 is bigger than t1 swap them around
		float temp = t0;
		t0 = t1;
		t1 = temp;
	}
	
	// if t1 is less than zero, the object is in the ray's negative direction
	// and consequently the ray misses the sphere
	if (t1 < 0.0)
		return -1.0;

	// if t0 is less than zero, the intersection point is at t1
	if (t0 < 0.0) {
		return t1;
	} else {
		return t0; 
	}
}
	
float intersectPlane(in Ray ray)
{
	return -ray.o.y/ray.d.y;
}

int worldIntersect(in Ray ray, in float maxlen, in int id, inout float t)
{
	t = maxlen;
	float ts1 = intersectSphere(ray, sphere1);
	float ts2 = intersectSphere(ray, sphere2);
	float tp = intersectPlane(ray);
	//float td= intersectTaxiBisector(ray);
	
	//FIXME: why is id needed to prevent surface acne (idem in worldShadow)?
	if (ts1 > EPS && id !=1) {
		t = ts1;
		id = 1;
	}
	if (ts2 > EPS && ts2 < t && id !=2 ) {
		t = ts2;
		id = 2;
	}
	if ( tp > EPS && tp < t && id !=3 ) {
		t = tp;
		id = 3;
	}
	return id;
}

	/* ---------- Object normals functions ---------- */
	
vec3 sphereNormal(in vec3 pos, in Sphere sphere)
{
	return normalize((pos - sphere.pos)/sphere.rad);
}

vec3 worldNormal(in vec3 pos, in int id)
{
	if (id == 1) {
		return sphereNormal(pos, sphere1);
	} else if (id == 2) {
		return sphereNormal(pos, sphere2);
	} else if (id == 3) {
		return vec3(0.0, 1.0, 0.0);
	}
}

/* ----------------------------------------------- */

float worldShadow(in Ray ray, in float maxlen, in int id)
{
	float ts1 = intersectSphere(ray, sphere1);
	float ts2 = intersectSphere(ray, sphere2);
	if(ts1 > EPS && id !=1 )
		return 0.0;
	if(ts2 > EPS && id !=2 )
		return 0.0;
	return 1.0;
}
		

float diffuseFactor(in vec3 surfaceNormal, in vec3 lightDir)
{
	return clamp(dot(surfaceNormal, lightDir), 0.0, 1.0);
}

float specularFactor(in vec3 surfaceNormal, in vec3 lightDir)
{
	vec3 viewDirection = normalize(cam.pos);
	vec3 halfAngle = normalize(lightDir + viewDirection);
	float ks = dot(surfaceNormal, halfAngle);
	ks = clamp(ks, 0.0, 1.0);
	ks = pow(ks, 50.0);
	return ks;
}

void applyFog(in float t, inout vec4 col)
{
	col = mix(col, amb, clamp(sqrt(t*t)/10.0, 0.0, 1.0));
}

void reflect(inout Ray ray, in vec3 surfaceNormal)
{
	float cosI = -dot(surfaceNormal, ray.d);
	ray.d = ray.d + 2.0*cosI*surfaceNormal;
}


vec4 rendererCalculateColor(inout Ray ray, inout int id)
{
	vec4 col = vec4(0.0);
	float t = 0.0;
	float maxlen = 1000.0;
	bool hit = false;
	
	// Find the ray's closest intersection in the world scene
	id = worldIntersect(ray, maxlen, id, t);
	if (t<0.0 || t+EPS>maxlen) {
		applyFog(maxlen, col);
		return col;
	}
	
	// Compute the color (diffuse & specular reflection)
	vec3 pos = ray.o + t*ray.d;
	vec3 lightDir = normalize(lightPos-pos);
	vec3 surfaceNormal = worldNormal(pos, id);
	if (id == 1) {
		float dif = diffuseFactor(surfaceNormal, lightDir);
		float spec = specularFactor(surfaceNormal, lightDir);
		col = dif*sphere1.col+spec*specularColor;
	} else if (id == 2) {
		float dif = diffuseFactor(surfaceNormal, lightDir);
		float spec = specularFactor(surfaceNormal, lightDir);
		col = dif*sphere2.col+spec*specularColor;
	} else if (id == 3) {
		col = vec4(0.7, 0.7, 0.7, 1.0);
	}
	
	// Darken the color if it's in the shadow
	col *= worldShadow(Ray(pos, lightDir), 100.0, id);
	col = col + 0.2*amb;
	
	// Apply fog to the color using the distance to the intersection
	applyFog(t, col);
	
	// Update the ray for the next reflection iteration
	reflect(ray, surfaceNormal);
	ray.o = pos;
	return col;
}

vec4 RayTracer() {
	vec2 uv = gl_FragCoord.xy/resolution.xy - 0.5;
	vec3 d = (cam.aim - cam.pos) + rotationMatrix*vec3(cam.fov*uv, 0.0);
	d.y *= resolution.y/resolution.x;
	
	Ray ray = Ray(cam.pos, normalize(d));
	vec3 surfaceNormal;
	int id = 0;
	vec4 col = rendererCalculateColor(ray, id);
	
	//We compute reflected rays iteratively (no recursion in this version of glsl)
	//Both 'ray' and intersection 'id' are updated by renderedCalculateColor.
	for(int i=1; i<=2; ++i) {
		vec4 new_col = rendererCalculateColor(ray, id);
		col = (1.0-reflection_factor)*col + reflection_factor*mix(new_col, col, 1.0-reflection_factor);
	}

	return col;
}

float mDist(vec3 p1, vec3 p2) {
	vec3 d=p1-p2;
	return abs(d.x)+abs(d.y)+abs(d.z);
}

int Region(vec3 p) {
	return mDist(p,sphere1.pos)<mDist(p,sphere2.pos)?1:2;
}

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
		if (Region(p+spread[i]) != r) {
			norm+= spread[i];
			nc+=1;
		}
	}
	return norm/nc;
}

void Main( void ) {
	vec2 uv = gl_FragCoord.xy/resolution.xy - 0.5;
	vec3 d = (cam.aim - cam.pos) + rotationMatrix*vec3(cam.fov*uv, 0.0);
	d.y *= resolution.y/resolution.x;
	Ray ray = Ray(cam.pos, normalize(d) );

	float maxDist= max(length(ray.o-sphere1.pos),length(ray.o-sphere2.pos))*2.0;
	float sphDist= length(sphere1.pos-sphere2.pos);
	float l, lMin=0.0,lMax= maxDist;
	int r, r1=Region(ray.o+ray.d*lMin), r2=Region(ray.o+ray.d*lMax);
	vec3 p;
	if (r1!=r2) {
		while (lMax-lMin>1e-02 || r!=r1) {
			l= (lMin+lMax)/2.0;
			p= ray.o+ray.d*l;
			r= Region(p);
			if (r==r1) lMin=l;
			if (r==r2) lMax=l;
		}
		vec3 cp= (sphere1.pos+sphere2.pos)/2.0;
		float f= (sphDist-length(cp-p))/sphDist;

		gl_FragColor= f>0?vec4( TaxiNorm(p)*f ,1.0 ):RayTracer();
	} else
		gl_FragColor= RayTracer();
}


void RayCast(vec3 rOrig, vec3 rDir) {
	float maxDist= max(length(rOrig-sphere1.pos),length(rOrig-sphere2.pos))*2.0;
	float sphDist= length(sphere1.pos-sphere2.pos);
	float l, lMin=0.0,lMax= maxDist;
	int r, r1=Region(rOrig+rDir*lMin), r2=Region(rOrig+rDir*lMax);
	vec3 p;
	while (r1==r2 && lMax<16384.0) {
		lMax*=2.0;
		r2=Region(rOrig+rDir*lMax);
	}
	if (r1!=r2) {
		while (lMax-lMin>1e-02) {
			l= (lMin+lMax)/2.0;
			p= rOrig+rDir*l;
			r= Region(p);
			if (r==r1) lMin=l;
			if (r==r2) lMax=l;
		}

		//vec3 cp= (sphere1.pos+sphere2.pos)/2.0;
		//float f= (sphDist-length(cp-p))/sphDist;
		vec3 n= TaxiNorm(p);
		if (r==r1) n*=-1.0;

		gl_FragColor= vec4(vec3(1+dot(rDir,n)),1.0);
		}
	else
		gl_FragColor= vec4(vec3(0),1);

	float sr1= sphere1.rad-pointLineDist( sphere1.pos , rOrig,rOrig+rDir );
	if (length(rOrig-sphere1.pos)>length(rOrig-p)) sr1/=2.0;
	if (sr1>0.0) gl_FragColor.xyz+= sphere1.col.xyz*sr1;

	float sr2= sphere2.rad-pointLineDist( sphere2.pos , rOrig,rOrig+rDir );
	if (length(rOrig-sphere2.pos)>length(rOrig-p)) sr2/=2.0;
	if (sr2>0.0) gl_FragColor.xyz+= sphere2.col.xyz*sr2;
}

void main( void ) {
	vec2 uv = gl_FragCoord.xy/resolution.xy - 0.5;
	vec3 d = (cam.aim - cam.pos) + rotationMatrix*vec3(cam.fov*uv, 0.0);
	d.y *= resolution.y/resolution.x;
	RayCast(cam.pos, normalize(d));
}

