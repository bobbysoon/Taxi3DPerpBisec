#!/usr/bin/python

from __future__ import division
from math import *
from Window import *
from initOpenGL import *
from Shader import *

sphSphYaw=pi/4.0
sphSphPitch=pi/4.0

mx,my=-0.125,-0.125
while Window.isOpen():
	mouse_dx,mouse_dy = Window.Input()
	wd,ht=Window.window.size
	mx-= mouse_dx/wd
	my+= mouse_dy/ht

	glMatrixMode(GL_MODELVIEW);glPushMatrix();glLoadIdentity()
	glMatrixMode(GL_PROJECTION);glPushMatrix();glLoadIdentity()

	kb,k = sf.Keyboard.is_key_pressed,sf.Keyboard
	x= 1.0 if kb(k.J) else -1.0 if kb(k.L) else .0
	z= 1.0 if kb(k.I) else -1.0 if kb(k.K) else .0
	sphSphPitch+=x*.1;sphSphYaw+=z*.1
	cp=cos( sphSphPitch );cy=cos( sphSphYaw );sy=sin( sphSphYaw );sp=sin( sphSphPitch )
	sphere1Pos = cp * cy , sy , sp * cy
	sphere2Pos =-cp * cy ,-sy ,-sp * cy

	shaders.glUseProgram(Shader.shadyMcShader)
	glUniform2f(Shader.mouse, mx,my)
	glUniform2f(Shader.resolution, wd,ht)
	glUniform1f(Shader.zoom, Window.scale)
	glUniform3f(Shader.sphere1Pos, *sphere1Pos)
	glUniform3f(Shader.sphere2Pos, *sphere2Pos)

	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

	glRectf(-1,-1,1,1) # the only actual geometry drawn. AKA, "Two triangles, one shader"

	if False:
		shaders.glUseProgram(Shader.shadyMcSolid)
		glLineWidth(2.5)
		glBegin(GL_LINES)
		glVertex3f(*sphere1Pos)		# fixme
		glVertex3f(*sphere2Pos)
		glEnd()

	glPopMatrix();glMatrixMode(GL_MODELVIEW);glPopMatrix()

	Window.display()


