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

// var g_points = [];
// var g_colors = [];
// var g_sizes = [];
var g_shapesList = [];

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

  // Create a new Point object
  let point = new Point();
  point.position = [x, y];

  // Read color from sliders
  point.color = [
    document.getElementById('redSlider').value / 100,
    document.getElementById('greenSlider').value / 100,
    document.getElementById('blueSlider').value / 100,
    1.0
  ];

  // Read size from slider
  point.size = document.getElementById('sizeSlider').value;

  // Add to shapes list
  g_shapesList.push(point);

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