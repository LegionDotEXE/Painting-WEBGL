// ColoredPoints.Js

// Skeleton Code extracted from WebGL textbook by Matsuda


// ColoredPoints.js

// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform float u_Size;\n' +
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  // '  gl_PointSize = 10.0;\n' +
  '  gl_PointSize = u_Size;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' +
  '}\n';

// Global variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

var g_shapesList = [];
var g_selectedType = 'point';

// Point class
class Point {
  constructor() {
    this.type = 'point';
    this.position = [0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 5.0;
  }

  render() {
    var xy = this.position;
    var rgba = this.color;
    var size = this.size;

    // Pass the position of a point to a_Position variable
    gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
    // Pass the color of a point to u_FragColor variable
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    // Pass the size of a point to u_Size variable
    gl.uniform1f(u_Size, size);
    // Draw a point
    gl.drawArrays(gl.POINTS, 0, 1);
  }
}

// Triangle class
class Triangle {
  constructor() {
    this.type = 'triangle';
    this.position = [0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 5.0;
  }

  render() {
    var xy = this.position;
    var rgba = this.color;
    var size = this.size;

    // Pass the color of a point to u_FragColor variable
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    // Draw the triangle centered at xy with given size
    var d = size / 200.0; // scale size to clip coordinates
    drawTriangle([xy[0], xy[1] + d, xy[0] - d, xy[1] - d, xy[0] + d, xy[1] - d]);
  }
}

// Circle class
class Circle {
  constructor() {
    this.type = 'circle';
    this.position = [0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 5.0;
    this.segments = 10;
  }

  render() {
    var xy = this.position;
    var rgba = this.color;
    var size = this.size;

    // Pass the color to u_FragColor variable
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    // Draw the circle as a fan of triangles
    var d = size / 200.0;
    var angleStep = 360 / this.segments;
    for (var angle = 0; angle < 360; angle += angleStep) {
      var angle1 = angle * Math.PI / 180;
      var angle2 = (angle + angleStep) * Math.PI / 180;
      var vec1 = [Math.cos(angle1) * d, Math.sin(angle1) * d];
      var vec2 = [Math.cos(angle2) * d, Math.sin(angle2) * d];

      drawTriangle([xy[0], xy[1], xy[0] + vec1[0], xy[1] + vec1[1], xy[0] + vec2[0], xy[1] + vec2[1]]);
    }
  }
}

function drawTriangle(vertices) {
  var n = 3; // The number of vertices

  // Create a buffer object
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Write data into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

  // Assign the buffer object to a_Position variable
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(a_Position);

  // Draw the triangle
  gl.drawArrays(gl.TRIANGLES, 0, n);
}

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
}

function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }

  // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Get the storage location of u_Size
  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }
}

function handleClicks() {
  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = function(ev) { click(ev); };
  // Register function for mouse motion drawing
  canvas.onmousemove = function(ev) { if (ev.buttons == 1) { click(ev); } };
}

function click(ev) {
  var x = ev.clientX;
  var y = ev.clientY;
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2) / (canvas.width/2);
  y = (canvas.height/2 - (y - rect.top)) / (canvas.height/2);

  // Read color from sliders
  var r = document.getElementById('redSlider').value / 100;
  var g = document.getElementById('greenSlider').value / 100;
  var b = document.getElementById('blueSlider').value / 100;

  // Read size from slider
  var size = document.getElementById('sizeSlider').value;

  // Create the appropriate shape based on selected type
  let shape;
  if (g_selectedType == 'point') {
    shape = new Point();
  } else if (g_selectedType == 'triangle') {
    shape = new Triangle();
  } else if (g_selectedType == 'circle') {
    shape = new Circle();
    shape.segments = document.getElementById('segmentSlider').value;
  }

  shape.position = [x, y];
  shape.color = [r, g, b, 1.0];
  shape.size = size;

  // Add to shapes list
  g_shapesList.push(shape);

  renderAllShapes();
}

function renderAllShapes() {
  // Check the time at the start of this function
  var startTime = performance.now();

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Draw each shape in the list
  var len = g_shapesList.length;
  for (var i = 0; i < len; i++) {
    g_shapesList[i].render();
  }

  // Check the time at the end of the function, and show on web page
  var duration = performance.now() - startTime;
  sendTextToHTML("numdot: " + len + " ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot");
}

function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}

function clearCanvas() {
  g_shapesList = [];
  renderAllShapes();
}

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  handleClicks();

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}