    var mvMatrix = mat4.create();
    var pMatrix = mat4.create();
    var viewMatrix = mat4.create();
    
    var buildingArrayBuffer;
    var buildingIndexBuffer;
    var buildingTexCoordBuffer;
    
    var xMin = -100.0;
    var xMax = 100.0;
    var yMin = -100.0;
    var yMax = 100.0;
    var zMin = -100.0;
    var zMax = 100.0;
    
    function deg2rad(deg) {
    	return deg * (Math.PI/180);
    }
    
     
    var mvMatrixStack = [];
    var pMatrixStack = [];
    
    // store the current mvmatrix to the stack
    function pushMVMatrix() {
    	var mvMatrixCopy = mat4.create();
    	mat4.set(mvMatrix, mvMatrixCopy);
    	mvMatrixStack.push(mvMatrixCopy);
    }
    
    function popMVMatrix() {
    	mvMatrix = mvMatrixStack.pop();
    }
    
    // initializes all the properties of a node not specific to a certain type
    function nodeBoilerplate() {
    	var node = {}
    	node.mMatrix = mat4.create(); // the matrix that gets applied to this node and all its children
    	mat4.identity(node.mMatrix); // it does nothing, by default
    	node.children = []
    	node.draw = function() { // default implementation of draw() just draws all children. TODO: create abstraction such that no need for manual specifying of pushMVMatrix() and popMVMatrix()
    					pushMVMatrix();
    					mat4.multiply(mvMatrix, this.mMatrix, mvMatrix);
    					for (i = 0; i < this.children.length; i++) {
    						node.children[i].draw()
    					}
    					popMVMatrix();
    			}
    	return node
    }
    
    // a block is a collection of buildings
    // V1: the generation of buildins is random, they just follow the total area
    // specified as parameters of this function. Actually for this version
    // it's the height of the building that will be randomized, 
    function blockNode(length, width) {
    	var node = nodeBoilerplate()
    	var NUM_BUILDINGS = 6
    	var BUILDING_MAX_HEIGHT = 100
    	// for now, divide the length and width equally among all buildings
    	var building_length = length / NUM_BUILDINGS;
    	// same for width
    	var building_width = width;
    	for (i =  -(length / 2); i < length  / 2; i += building_length) {
    		var building = buildingNode(building_length, building_width, Math.random() * BUILDING_MAX_HEIGHT);
    		translate(building.mMatrix, i, 0, 0);
    		node.children.push(building)
    	}
    	return node
    }
    
    
    function buildingNode(length, width, height) {
    	var node = nodeBoilerplate()
    	node.draw = function() {
    					pushMVMatrix();
    					mat4.multiply(mvMatrix, this.mMatrix, mvMatrix);
    					mat4.scale(mvMatrix, [width, height, length])
    					translate(mvMatrix, 0, height, 0) // raise building to above x axis
    					
    					gl.bindBuffer(gl.ARRAY_BUFFER, buildingArrayBuffer);
    					gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, buildingArrayBuffer.itemSize, gl.FLOAT, false, 0, 0);
    					
    					gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buildingIndexBuffer);
    					setMatrixUniforms();
    					gl.drawElements(gl.TRIANGLE_STRIP, buildingIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    					popMVMatrix();
    		}
    	return node;
    }
    
    function initBuffers() {
    	buildingArrayBuffer = gl.createBuffer();
    	buildingTexCoordBuffer = gl.createBuffer();
    	buildingIndexBuffer = gl.createBuffer();
    	// the following vertices are copy pasted from: http://learningwebgl.com/lessons/lesson05/index.html
		// since computing the vertices in my head is such a drag
    	building_vertices = [
            // Front face
            -1.0, -1.0,  1.0,
             1.0, -1.0,  1.0,
             1.0,  1.0,  1.0,
            -1.0,  1.0,  1.0,

            // Back face
            -1.0, -1.0, -1.0,
            -1.0,  1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0, -1.0, -1.0,

            // Top face
            -1.0,  1.0, -1.0,
            -1.0,  1.0,  1.0,
             1.0,  1.0,  1.0,
             1.0,  1.0, -1.0,

            // Bottom face
            -1.0, -1.0, -1.0,
             1.0, -1.0, -1.0,
             1.0, -1.0,  1.0,
            -1.0, -1.0,  1.0,

            // Right face
             1.0, -1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0,  1.0,  1.0,
             1.0, -1.0,  1.0,

            // Left face
            -1.0, -1.0, -1.0,
            -1.0, -1.0,  1.0,
            -1.0,  1.0,  1.0,
            -1.0,  1.0, -1.0,
        ];
        buildingArrayBuffer.itemSize = 3
        buildingArrayBuffer.numItems = 24
        gl.bindBuffer(gl.ARRAY_BUFFER, buildingArrayBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(building_vertices), gl.STATIC_DRAW);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, buildingArrayBuffer.itemSize, gl.FLOAT, false, 0, 0);
        
        var building_vertex_indices = [
            0, 1, 2,      0, 2, 3,    // Front face
            4, 5, 6,      4, 6, 7,    // Back face
            8, 9, 10,     8, 10, 11,  // Top face
            12, 13, 14,   12, 14, 15, // Bottom face
            16, 17, 18,   16, 18, 19, // Right face
            20, 21, 22,   20, 22, 23  // Left face
        ];
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buildingIndexBuffer)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(building_vertex_indices), gl.STATIC_DRAW)
        buildingIndexBuffer.itemSize = 1
        buildingIndexBuffer.numItems = 36
        
        var textureCoords = [
          // Front face
          0.0, 0.0,
          1.0, 0.0,
          1.0, 1.0,
          0.0, 1.0,

          // Back face
          1.0, 0.0,
          1.0, 1.0,
          0.0, 1.0,
          0.0, 0.0,

          // Top face
          0.0, 1.0,
          0.0, 0.0,
          1.0, 0.0,
          1.0, 1.0,

          // Bottom face
          1.0, 1.0,
          0.0, 1.0,
          0.0, 0.0,
          1.0, 0.0,

          // Right face
          1.0, 0.0,
          1.0, 1.0,
          0.0, 1.0,
          0.0, 0.0,

          // Left face
          0.0, 0.0,
          1.0, 0.0,
          1.0, 1.0,
          0.0, 1.0,
        ];
        gl.bindBuffer(gl.ARRAY_BUFFER, buildingTexCoordBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
        buildingTexCoordBuffer.itemSize = 2;
        buildingTexCoordBuffer.numItems = 24;
    }
    
    var buildingTexture;
    function initBuildingTexture() {
    	buildingTexture = gl.createTexture()
    	buildingTexture.image = new Image()
    	buildingTexture.image.onload = function() {
    		handleLoadedTexture(buildingTexture)
    	}
    	buildingTexture.image.src = "building_texture.jpg"
    }
    
    function handleLoadedTexture(texture) {
    	gl.bindTexture(gl.TEXTURE_2D, texture);
    	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // flip due to differences in coordinate system of images and OpenGL
	    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	    gl.bindTexture(gl.TEXTURE_2D, null); // we're done manipulating this texture
    }

    
    function setMatrixUniforms() {
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
        gl.uniformMatrix4fv(shaderProgram.viewMatrixUniform, false, viewMatrix);
    }
    
    function perspective(l, r, t, b, n, f, d) { // follow the call type of mat4.perspective
    	d[0] = 2*n/(r-l)	; d[4] = 0			; d[8] = (r+l)/(r-l)	; d[12] = 0				;
    	d[1] = 0			; d[5] = 2*n/(t-b)	; d[9] = (t+b)/(t-b)	; d[13] = 0				;
    	d[2] = 0			; d[6] = 0			; d[10] = (n+f)/(n-f)	; d[14] = (2*f*n)/(n-f)	;
    	d[3] = 0			; d[7] = 0			; d[11] = -1			; d[15] = 0				;
    	
    }
    
    // mat4.translate implementation is buggy, x isn't translated. So we implement our own, based on slides
    function translate(mat, x, y, z) { // follow the call type of mat4.perspective
    	var d = mat4.create();
    	d[0] = 1			; d[4] = 0			; d[8] = 0				; d[12] = x				;
    	d[1] = 0			; d[5] = 1			; d[9] = 0				; d[13] = y				;
    	d[2] = 0			; d[6] = 0			; d[10] = 1				; d[14] = z				;
    	d[3] = 0			; d[7] = 0			; d[11] = 0    			; d[15] = 1				;
    	mat4.multiply(d, mat, mat);
    	// note: try setting d[11] to -1 and see some weird shit :))
    }
   
   	var block;
    function drawScene(angle) {
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mat4.ortho(xMin, xMax, yMin, yMax, zMin, zMax, pMatrix);
        //mat4.frustum(xMin, xMax, yMin, yMax * 2, 0.5, 100, pMatrix);
        mat4.identity(viewMatrix);
        //mat4.lookAt([ Math.cos(deg2rad(angle)), Math.cos(deg2rad(angle)) , Math.cos(deg2rad(angle))], [0, 3, 1], [0, 1, 0], viewMatrix);
        mat4.identity(mvMatrix);
		
		
        block = block || blockNode(10, 10, 50);
        block.draw();
        
    }
    
    var angle = 0;
    function render() {
    	requestAnimFrame(render);
    	drawScene(angle);
    	angle += 1;
    }

    function webGLStart() {
        var canvas = document.getElementById("lesson01-canvas");
        initGL(canvas);
        initShaders();
        initBuffers();

        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
		
		render();
    }



















































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































