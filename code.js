
    var mvMatrix = mat4.create();
    var pMatrix = mat4.create();
    
    var xMin = -100.0;
    var xMax = 100.0;
    var yMin = -100.0;
    var yMax = 100.0;
    var zMin = -100.0;
    var zMax = 100.0;

    // returns a node object ready to be drawn to the screen with drawNode()
    //
    // location is of the form [X, Y, Z] where X, Y Z are the offsets from the 
    // parent of the object (usually the absolute origin) if you don't really care
    // radius is the radius of the circle which represents the node. Duh.
    // color is the color of the circle which represents the node. Should be a javascript array.
    function createNode(location, radius, color) {
    	var translationMatrix = mat4.create();
    	mat4.translate(translationMatrix, location);
    	var node  = {};
    	node.modelMatrix = translationMatrix; // translation is all we need to set the location of this badass
    	node.type = "node"; // Maybe it's not a node?
    	node.drawType = gl.TRIANGLE_FAN;
    	
    	vertices = [0, 0, 0,
    				Math.cos(1 * Math.PI / 3), Math.sin(1 * Math.PI / 3), 0,
    				Math.cos(2 * Math.PI / 3), Math.sin(2 * Math.PI / 3), 0,
       				Math.cos(3 * Math.PI / 3), Math.sin(3 * Math.PI / 3), 0,
    				Math.cos(4 * Math.PI / 3), Math.sin(4 * Math.PI / 3), 0,
    				Math.cos(5 * Math.PI / 3), Math.sin(5 * Math.PI / 3), 0,
    				Math.cos(6 * Math.PI / 3), Math.sin(6 * Math.PI / 3), 0,		
    				Math.cos(1 * Math.PI / 3), Math.sin(1 * Math.PI / 3), 0

    	];
    	
    	for (i = 0; i < vertices.length; i++) { // apply scaling
    		vertices[i] = radius * vertices[i];
    	}
    	
    	
    	node.vertices  = new Float32Array(vertices);
    	node.itemSize = 3;
    	node.buffer = gl.createBuffer();
    	node.numItems = vertices.length / node.itemSize;
    	return node;
    }
    
    function drawNode(node) {
    
        nodeBuffer = node.buffer;
        gl.bindBuffer(gl.ARRAY_BUFFER, nodeBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, node.vertices, gl.STATIC_DRAW);
        setMatrixUniforms();
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, node.itemSize, gl.FLOAT, false, 0, 0);
        //mat4.multiply(node.modelMatrix, mvMatrix, mvMatrix);
        setMatrixUniforms();
        gl.drawArrays(gl.TRIANGLE_FAN, 0, node.numItems);
        // drawNode(node);
        
        
    }
    
    
    // all the code below is just boilerplate, but we keep it here since we're gonna keep changing it as the code evolves.
    var triangleVertexPositionBuffer;
    var squareVertexPositionBuffer;
    function initBuffers() {
        triangleVertexPositionBuffer = gl.createBuffer();
        squareVertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
        var vertices = [
             0.0,  1.0,  0.0,
            -1.0, -1.0,  0.0,
             1.0, -1.0,  0.0
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        triangleVertexPositionBuffer.itemSize = 3;
        triangleVertexPositionBuffer.numItems = 3;

        gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
        vertices = [
             1.0,  1.0,  0.0,
            -1.0,  1.0,  0.0,
             1.0, -1.0,  0.0,
            -1.0, -1.0,  0.0
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        squareVertexPositionBuffer.itemSize = 3;
        squareVertexPositionBuffer.numItems = 4;
    }
    
    
    function setMatrixUniforms() {
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
    }
    

    function drawScene() {
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mat4.ortho(xMin, xMax, yMin, yMax, zMin, zMax, pMatrix);

        mat4.identity(mvMatrix);
        mat4.scale([10.0, 10.0, 0], mvMatrix);
        
        mat4.translate([0.0, 33.0, 0.0], mvMatrix);

		var node = createNode([22.0, 3.0, 0.0], 6, 0);
		drawNode(node);
    }

    function webGLStart() {
        var canvas = document.getElementById("lesson01-canvas");
        initGL(canvas);
        initShaders();
        initBuffers();

        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.enable(gl.DEPTH_TEST);

        drawScene();
    }


