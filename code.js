    var mvMatrix = mat4.create();
    var pMatrix = mat4.create();
    var viewMatrix = mat4.create();
    
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
    	node.vertices = [-1.0, -1.0,  1.0, 1.0,
    					1.0, -1.0,  1.0, 1.0,
    					-1.0,  1.0,  1.0, 1.0,
    					1.0,  1.0,  1.0, 1.0,
    					-1.0, -1.0, -1.0, 1.0,
    					1.0, -1.0, -1.0, 1.0,
    					-1.0,  1.0, -1.0, 1.0,
    					1.0,  1.0, -1.0, 1.0
    					]
    	node.itemSize = 4
    	node.draw = function() {
    					pushMVMatrix();
    					mat4.multiply(mvMatrix, this.mMatrix, mvMatrix);
    					mat4.scale(mvMatrix, [width, height, length])
    					translate(mvMatrix, 0, height, 0) // raise building to above x axis
    					var buildingArrayBuffer = gl.createBuffer();
    					var buildingIndexBuffer = gl.createBuffer();
    					gl.bindBuffer(gl.ARRAY_BUFFER, buildingArrayBuffer);
    					gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
    					gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 4, gl.FLOAT, false, 0, 0);
    					
    					var indices = [0, 1, 2, 3, 7, 1, 5, 4, 7, 6, 2, 4, 0, 1];
    					gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buildingBuffer);
    					gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    					setMatrixUniforms();
    					gl.drawElements(gl.TRIANGLE_STRIP, 14, gl.UNSIGNED_SHORT, 0);
    					popMVMatrix();
    		}
    	return node;
    }
    
    function initBuffers() {
    	buildingBuffer = gl.createBuffer();
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



















































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































