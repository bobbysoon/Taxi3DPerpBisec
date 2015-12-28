#!/usr/bin/python

from __future__ import division

from Window import *
from initOpenGL import *
from Shader import *

sphere1Pos= -2,-1,1.5
sphere2Pos= 2,1,-1.5

mx,my=0.,0.
while Window.isOpen():
	mouse_dx,mouse_dy = Window.Input()
	wd,ht=Window.window.size
	mx-= mouse_dx/wd
	my+= mouse_dy/ht

	glMatrixMode(GL_MODELVIEW);glPushMatrix();glLoadIdentity()
	glMatrixMode(GL_PROJECTION);glPushMatrix();glLoadIdentity()

	shaders.glUseProgram(Shader.shadyMcShader)
	glUniform2f(Shader.mouse, mx,my)
	glUniform2f(Shader.resolution, wd,ht)
	glUniform1f(Shader.zoom, Window.scale)
	glUniform3f(Shader.sphere1Pos, *sphere1Pos)
	glUniform3f(Shader.sphere2Pos, *sphere2Pos)

	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

	glRectf(-1,-1,1,1) # the only actual geometry drawn. AKA, "Two triangles, one shader"

	shaders.glUseProgram(Shader.shadyMcSolid)
	glLineWidth(2.5)
	#glColor3f(1.0, 0.0, 0.0)
	glBegin(GL_LINES)
	glVertex3f(*sphere1Pos)		# fixme
	glVertex3f(*sphere2Pos)
	glEnd()

	glPopMatrix();glMatrixMode(GL_MODELVIEW);glPopMatrix()

	Window.display()


