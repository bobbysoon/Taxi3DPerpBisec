# Taxi3DPerpBisec
Perpendicular Bisector, Taxicab metric, raytraced in 3D with PyOpenGL-GLSL

Modified a ray tracer I found (https://gist.github.com/num3ric/4408481), mainly capitolizing off it's ray origin & direction determination method.
Really shoddy, what I did, as graphical quality goes, but it lets you see the general shape of a 3d perpendicular bisector "plane" (in taxicab metric) of two centroids looks like in 3d, by sub-dividing each pixel(frag)'s ray down to the (3d) point where the two centroids are equidistant, in taxi metric.
Uses python-sfml, PyOpenGL, & numpy

of the shading of the perpendicular bisecting plane, TaxiNorm is the function. It point samples a 3x3x3 grid around the ray-plane intersect, and averages the vectors on the cam's side of the plane. Works well enough for visualizing, but it's probably where the circular artifacts are coming from.
