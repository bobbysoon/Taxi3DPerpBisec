#!/usr/bin/python

from __future__ import division

from Window import *
from initOpenGL import *
from Shader import *

sphere1Pos= -2,-1,1.5
sphere2Pos= 2,1,-1.5
from time import time
start=time()
mx,my=0.,0.
while Window.isOpen():
	if Window.hasFocus:
		mouse_dx,mouse_dy = Window.Input()
		wd,ht=Window.window.size
		mx+= mouse_dx/wd
		my+= mouse_dy/ht

		glUniform1f(Shader.time, time()-start)
		glUniform2f(Shader.mouse, mx,my)
		glUniform2f(Shader.resolution, wd,ht)
		glUniform1f(Shader.zoom, Window.scale)
		glUniform3f(Shader.sphere1Pos, *sphere1Pos)
		glUniform3f(Shader.sphere2Pos, *sphere2Pos)

		glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

		glMatrixMode(GL_MODELVIEW);glPushMatrix();glLoadIdentity()
		glMatrixMode(GL_PROJECTION);glPushMatrix();glLoadIdentity()

		glRectf(-1,-1,1,1)

		glPopMatrix();glMatrixMode(GL_MODELVIEW);glPopMatrix()

		Window.display()

