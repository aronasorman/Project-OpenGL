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
    var angle = 0.0;

    
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
    
    // a city is a collection of blocks
    function cityNode(numBlocks) {
    	var node = nodeBoilerplate();
    	/* The shit below causes my laptop to lag
    	var blockWidth = (zMax - zMin) / Math.sqrt(numBlocks);
    	var blockLength = (xMax - xMin) / Math.sqrt(numBlocks);
    	alert(blockWidth);
    	debugger
    	
    	for(x = xMin; x <= xMax; x += blockLength) {
    		for (z = zMin; z <= zMax; z += blockWidth) {
    			var block = blockNode(blockLength, blockWidth);
    			translate(block.mMatrix, x, 0, z);
    			node.children.push(block);
    		}
    	}
    	return node
    	*/
    	
    	var blocksPerRow = 3;
    	var blockWidth = 20;
    	var blockLength = 20;
    	var spacing = 20;
    	
    
    	var block = blockNode(blockLength, blockWidth);
    	translate(block.mMatrix,blockLength * 2 + spacing, 0, blockWidth * 2 + spacing);
    	node.children.push(block);
    
    	
    	var block2 = blockNode(blockLength, blockWidth);
    	node.children.push(block2);
    	
    	var block2 = blockNode(blockLength, blockWidth);
    	translate(block2.mMatrix,-blockLength * 2 + spacing, 0, -blockWidth * 2 + spacing);
    	node.children.push(block2);
    	
    	
    	// make the whole city small
    	mat4.scale(node.mMatrix, [0.5, 1, 1]);
    	return node
    }
    
    // a block is a collection of buildings
    // V1: the generation of buildins is random, they just follow the total area
    // specified as parameters of this function. Actually for this version
    // it's the height of the building that will be randomized, 
    function blockNode(length, width) {
    	var node = nodeBoilerplate()
    	var NUM_BUILDINGS = 4
    	var BUILDING_MAX_HEIGHT = 100
    	// for now, divide the length and width equally among all buildings
    	var building_length = length / NUM_BUILDINGS;
    	// same for width
    	var building_width = width;
    	for (i =  -(length / 2); i < length  / 2; i += building_length) {
    		var building = buildingNode(Math.random() * building_length, building_width, Math.random() * BUILDING_MAX_HEIGHT);
    		translate(building.mMatrix, i, 0, 0);
    		node.children.push(building)
    	}
    	return node
    }
    
    
    function buildingNode(length, width, height) {
    	var node = nodeBoilerplate()
    	node.draw = function(blinkVal) {
    					pushMVMatrix();
    					mat4.multiply(mvMatrix, this.mMatrix, mvMatrix);
    					mat4.scale(mvMatrix, [width, height, length])
    					translate(mvMatrix, 0, height, 0) // raise building to above x axis
    					
    					gl.bindBuffer(gl.ARRAY_BUFFER, buildingArrayBuffer);
    					gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, buildingArrayBuffer.itemSize, gl.FLOAT, false, 0, 0);
    					
    					gl.bindBuffer(gl.ARRAY_BUFFER, buildingTexCoordBuffer);
    					gl.vertexAttribPointer(shaderProgram.texCoordAttribute, buildingTexCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
    					gl.activeTexture(gl.TEXTURE0);
    					gl.bindTexture(gl.TEXTURE_2D, buildingTexture);
    					gl.uniform1i(gl.getUniformLocation(shaderProgram, "uSampler"), 0);
    					
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
    	buildingTexture.image.src = "building_texture.jpg"
    	buildingTexture.image.onload = function() {
    		handleLoadedTexture(buildingTexture)
    	}
    }
    
    function handleLoadedTexture(texture) {
    	gl.bindTexture(gl.TEXTURE_2D, texture);
    	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // flip due to differences in coordinate system of images and OpenGL
	    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	    gl.bindTexture(gl.TEXTURE_2D, null); // we're done manipulating this texture
    }

    
    function setMatrixUniforms() {
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
        gl.uniformMatrix4fv(shaderProgram.viewMatrixUniform, false, viewMatrix);
        var blinkValue = Math.round(Math.abs(Math.cos(deg2rad(angle))));
        // gl.uniform1i(gl.getUniformLocation(shaderProgram, "uSampler"), 0);
        gl.uniform1f(shaderProgram.blinkGradientUniform, blinkValue);
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
   	var node;
   	var cameraPosition = [4, 0, 0];
   	var cameraFacing = [0, 0, 1];
   	var cameraUp = [0, 1, 0];
    function drawScene(blinkVal) {
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mat4.ortho(xMin, xMax, yMin, yMax, zMin, zMax, pMatrix);
        //mat4.frustum(xMin, xMax, yMin, yMax * 2, 0.5, 100, pMatrix);
        mat4.identity(viewMatrix);
        mat4.identity(mvMatrix);
        mat4.lookAt(cameraPosition, cameraFacing, cameraUp, viewMatrix);
		
		
        //block = block || blockNode(70, 10);
        //block.draw();
        
        //node = node || cityNode(9);
        //setMatrixUniforms();
        
        node = node || blockNode(75, 10);
        node.draw();
        
    }
    
    var keys = []
    function render() {
    	requestAnimFrame(render);
    	handleKeys();
    	drawScene(angle);
    	clearKeys();    	
    	angle += 1;

    }
    
    function clearKeys() {
    	keys = []
    }
    
    function handleKeys() {
    	var cameraChange = 0.8;
    	for (i = 0; i < keys.length; i++) {
    		switch(keys[i]) {
    			// handle the camera rotation functions first
    			case 37: // left arrow, rotate camera to left
    				cameraFacing[0] -= cameraChange;
    				break;
    			case 38: // up arrow, rotate camera up
    				cameraFacing[0] += cameraChange;
    				break;
    			case 39: // right arrow, rotate camera to right
    				break;
    			case 40: // down arrow, rotate to right
    				break;
    				
    			// WASD keys, for moving the position of the camera
    			case 87: // W, move camera closer to object
    				cameraPosition[2] -= cameraChange;
    				break;
    			case 65: // A, move camera left
    				cameraPosition[0] -= cameraChange;
    				break;
    			case 83: // S, move camera backward
    				cameraPosition[2] += cameraChange;
    				break;
    			case 68: // D, move camera right
    				cameraPosition[0] += cameraChange;
    				break;
    			
    			// P L for moving camera up and down
    			case 76: // L, move camera down
    				cameraPosition[1] -= cameraChange;
    				break;
    			case 80: // P, move camera up
    				cameraPosition[1] += cameraChange;
    				break;
    		}
    	}
    }
    
    function handleKeyDown(event) {
    	keys.push(event.keyCode);
    }

    function webGLStart() {
        var canvas = document.getElementById("lesson01-canvas");
        initGL(canvas);
        initShaders();
        initBuffers();
        initBuildingTexture();

        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        
        document.onkeydown = handleKeyDown;
		
		render();
    }



















































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































