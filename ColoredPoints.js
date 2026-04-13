// ColoredPoints.Js

// Skeleton Code extracted from WebGL textbook by Matsuda

// ColoredPoints.js

// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform float u_Size;\n' +
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '  gl_PointSize = u_Size;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' +
  '}\n';

// Global WebGL variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

// Shape tracking
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

    // Disable vertex attrib array so vertexAttrib3f works
    gl.disableVertexAttribArray(a_Position);

    gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    gl.uniform1f(u_Size, this.size);
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
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);

    // Scale size to clip coordinates
    var d = this.size / 200.0;
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
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);

    var d = this.size / 200.0;
    var angleStep = 360 / this.segments;

    // Draw circle as a fan of triangles
    for (var angle = 0; angle < 360; angle += angleStep) {
      var a1 = angle * Math.PI / 180;
      var a2 = (angle + angleStep) * Math.PI / 180;

      drawTriangle([
        xy[0], xy[1],
        xy[0] + Math.cos(a1) * d, xy[1] + Math.sin(a1) * d,
        xy[0] + Math.cos(a2) * d, xy[1] + Math.sin(a2) * d
      ]);
    }
  }
}

// Draws a triangle from 6 vertex values
function drawTriangle(vertices) {
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// Sets color then draws a triangle
function drawColoredTriangle(vertices, color) {
  gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
  drawTriangle(vertices);
}

// Get canvas and WebGL context
function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
}

// Compile shaders and connect JS variables to GLSL
function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }
}

// Register mouse event handlers
function handleClicks() {
  canvas.onmousedown = function(ev) { click(ev); };
  canvas.onmousemove = function(ev) { if (ev.buttons == 1) { click(ev); } };
}

// Handle a click or drag event
function click(ev) {
  // Convert mouse coordinates to WebGL clip space
  var rect = ev.target.getBoundingClientRect();
  var x = ((ev.clientX - rect.left) - canvas.width/2) / (canvas.width/2);
  var y = (canvas.height/2 - (ev.clientY - rect.top)) / (canvas.height/2);

  // Read UI values
  var r = document.getElementById('redSlider').value / 100;
  var g = document.getElementById('greenSlider').value / 100;
  var b = document.getElementById('blueSlider').value / 100;
  var size = document.getElementById('sizeSlider').value;

  // Create the right shape
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
  g_shapesList.push(shape);

  renderAllShapes();
}

// Redraw everything in the shapes list
function renderAllShapes() {
  var startTime = performance.now();

  gl.clear(gl.COLOR_BUFFER_BIT);

  var len = g_shapesList.length;
  for (var i = 0; i < len; i++) {
    g_shapesList[i].render();
  }

  // Show performance stats
  var duration = performance.now() - startTime;
  sendTextToHTML("numdot: " + len + " ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot");
}

// Update an HTML element's text
function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}

// Empty the shapes list and redraw
function clearCanvas() {
  g_shapesList = [];
  renderAllShapes();
}

// Remove the last shape and redraw
function undoShape() {
  if (g_shapesList.length > 0) {
    g_shapesList.pop();
    renderAllShapes();
  }
}

// Update the canvas background color from BG sliders
function setBgColor() {
  var r = document.getElementById('bgRedSlider').value / 100;
  var g = document.getElementById('bgGreenSlider').value / 100;
  var b = document.getElementById('bgBlueSlider').value / 100;
  gl.clearColor(r, g, b, 1.0);
  renderAllShapes();
}

// Draw a mountain scene using 30+ triangles
function drawPicture() {
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Sky
  drawColoredTriangle([-1.0, 1.0, -1.0, -0.2, 1.0, 1.0], [0.3, 0.5, 0.9, 1.0]);
  drawColoredTriangle([1.0, 1.0, -1.0, -0.2, 1.0, -0.2], [0.3, 0.5, 0.9, 1.0]);

  // Ground
  drawColoredTriangle([-1.0, -0.2, -1.0, -1.0, 1.0, -0.2], [0.2, 0.6, 0.2, 1.0]);
  drawColoredTriangle([1.0, -0.2, -1.0, -1.0, 1.0, -1.0], [0.2, 0.6, 0.2, 1.0]);

  // Sun (6-triangle fan)
  var sunX = 0.7, sunY = 0.75, sunR = 0.15;
  var sunColor = [1.0, 0.9, 0.0, 1.0];
  for (var i = 0; i < 6; i++) {
    var a1 = (i * 60) * Math.PI / 180;
    var a2 = ((i + 1) * 60) * Math.PI / 180;
    drawColoredTriangle([
      sunX, sunY,
      sunX + Math.cos(a1) * sunR, sunY + Math.sin(a1) * sunR,
      sunX + Math.cos(a2) * sunR, sunY + Math.sin(a2) * sunR
    ], sunColor);
  }

  // Large mountain and snow cap
  drawColoredTriangle([-0.1, 0.7, -0.7, -0.2, 0.5, -0.2], [0.4, 0.4, 0.45, 1.0]);
  drawColoredTriangle([-0.1, 0.7, -0.2, 0.5, 0.0, 0.5], [1.0, 1.0, 1.0, 1.0]);

  // Medium mountain and snow cap
  drawColoredTriangle([-0.5, 0.45, -0.95, -0.2, -0.05, -0.2], [0.5, 0.5, 0.55, 1.0]);
  drawColoredTriangle([-0.5, 0.45, -0.58, 0.3, -0.42, 0.3], [1.0, 1.0, 1.0, 1.0]);

  // Small mountain and snow cap
  drawColoredTriangle([0.55, 0.35, 0.15, -0.2, 0.95, -0.2], [0.45, 0.45, 0.5, 1.0]);
  drawColoredTriangle([0.55, 0.35, 0.48, 0.22, 0.62, 0.22], [1.0, 1.0, 1.0, 1.0]);

  // Left tree trunk
  drawColoredTriangle([-0.72, -0.2, -0.72, -0.5, -0.66, -0.2], [0.4, 0.25, 0.1, 1.0]);
  drawColoredTriangle([-0.66, -0.2, -0.72, -0.5, -0.66, -0.5], [0.4, 0.25, 0.1, 1.0]);

  // Left tree 
  drawColoredTriangle([-0.69, 0.1, -0.82, -0.15, -0.56, -0.15], [0.1, 0.5, 0.1, 1.0]);
  drawColoredTriangle([-0.69, -0.0, -0.85, -0.25, -0.53, -0.25], [0.0, 0.45, 0.0, 1.0]);
  drawColoredTriangle([-0.69, -0.1, -0.88, -0.35, -0.50, -0.35], [0.0, 0.4, 0.0, 1.0]);

  // Right tree trunk
  drawColoredTriangle([0.78, -0.2, 0.78, -0.5, 0.84, -0.2], [0.45, 0.28, 0.12, 1.0]);
  drawColoredTriangle([0.84, -0.2, 0.78, -0.5, 0.84, -0.5], [0.45, 0.28, 0.12, 1.0]);

  // Right tree 
  drawColoredTriangle([0.81, 0.1, 0.68, -0.15, 0.94, -0.15], [0.1, 0.5, 0.1, 1.0]);
  drawColoredTriangle([0.81, -0.0, 0.65, -0.25, 0.97, -0.25], [0.0, 0.45, 0.0, 1.0]);
  drawColoredTriangle([0.81, -0.1, 0.62, -0.35, 1.0, -0.35], [0.0, 0.4, 0.0, 1.0]);
}

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  handleClicks();

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}