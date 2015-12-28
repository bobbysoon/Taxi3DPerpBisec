from OpenGL.GL import *

class Shader:
	vert= open('Shader.vert').read()
	frag= open('Shader.frag').read()

	VERTEX_SHADER = shaders.compileShader(vert, GL_VERTEX_SHADER)
	FRAGMENT_SHADER = shaders.compileShader(frag, GL_FRAGMENT_SHADER)
	shadyMcShader = shaders.compileProgram(VERTEX_SHADER,FRAGMENT_SHADER)
	shaders.glUseProgram(shadyMcShader)

	zoom=		glGetUniformLocation( shadyMcShader, 'zoom' )
	time=		glGetUniformLocation( shadyMcShader, 'time' )
	mouse=		glGetUniformLocation( shadyMcShader, 'mouse' )
	resolution=	glGetUniformLocation( shadyMcShader, 'resolution' )
	camPos=		glGetUniformLocation( shadyMcShader, 'camPos' )
	sphere1Pos=		glGetUniformLocation( shadyMcShader, 'sphere1Pos' )
	sphere2Pos=		glGetUniformLocation( shadyMcShader, 'sphere2Pos' )


