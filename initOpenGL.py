from OpenGL.GL import *
from OpenGL.GLU import *
from OpenGL.GL import shaders

def initOpenGL():
	glMatrixMode(GL_PROJECTION)
	gluPerspective(75, 1.333, 0.001, 100000.0);
	glMatrixMode(GL_MODELVIEW)

	glEnable(GL_LIGHTING)
	glShadeModel(GL_SMOOTH)
	glEnable(GL_LIGHT0)
	glLightfv(GL_LIGHT0, GL_DIFFUSE, (0.9, 0.45, 0.0, 1.0))
	glLightfv(GL_LIGHT0, GL_POSITION, (0.0, 10.0, 10.0, 10.0))
	glEnable(GL_DEPTH_TEST)
	glDepthFunc(GL_LEQUAL)
	glEnable(GL_CULL_FACE)

	glMatrixMode(GL_MODELVIEW)
	gluLookAt(
		12,-1.5,11.5,
		-2.4,0,-2,
		0,1,0
		)

	glEnable(GL_BLEND)
	glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA)

initOpenGL()

