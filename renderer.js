/*
  ///  ////
 ///#//////
/// #/// ///

Miller IDE: Advanced G-Code Editor
/*

/*
Structure:
- Setup
- Navigation menu
- Tool-bar
- Workspace
- Right Panel
- Generate Code
- Boot-up operations
- Resources
*/

/* Notes:
- Canvases.length > 1 on initialization
- Create for the browser, and help operators visualize the program; Mobile and desktop
- Manage workflow for operations; Cloud-based
/*

/* Import libraries */
// File System
var fs = require('fs');
const { readdirSync } = require('fs');
const { statSync } = require('fs');
// Path
var path = require('path');
// Electron
const { BrowserWindow } = require('electron');
const { ipcRenderer } = require('electron');
const { shell } = require('electron');
const { webFrame } = require('electron');
const { dialog } = require('electron').remote;

/* Navigation menu */
var file;

// Trim menus list
var menus = [...document.getElementsByClassName('menu')];
for (i = 0; i < menus.length; i++) {
    if (menus[i].parentNode.id == 'window-icons') {
        menus.splice(i, 1);
        i = 0;
    }
}

// Open menu
function down(event) {
    var dropDown;
    for (i = 0; i < menus.length; i++) {
        dropDown = menus[i].getElementsByClassName('drop-down')[0];
        dropDown.style.display = 'none';
    }
    var target = event.target.getElementsByClassName('drop-down')[0];
    if (target) {
        target.style.display = 'block';
    }
    for (i = 0; i < menus.length; i++) {
        menus[i].addEventListener('mouseover', hover);
        menus[i].removeEventListener('mouseover', hoverOn);
        menus[i].removeEventListener('mouseout', hoverOff);
    }
}

// On hover
function hover(event) {
    if (event.target.getElementsByClassName('drop-down')[0]) {
        var dropDown;
        for (i = 0; i < menus.length; i++) {
            menus[i].style.backgroundColor = '#4387f1';
            dropDown = menus[i].getElementsByClassName('drop-down')[0];
            dropDown.style.display = 'none';
        }
        event.target.style.backgroundColor = '#65a0fb';
        var target = event.target.getElementsByClassName('drop-down')[0];
        target.style.display = 'block';
    }
}

// When hovering...
function hoverOn() {
    this.style.backgroundColor = '#65a0fb';
}

// When not hovering...
function hoverOff() {
    this.style.backgroundColor = 'transparent';
}

// Close menu
function off(event) {
    if (event.target.className != 'menu' && event.target.className != 'drop-down') {
        var dropDown;
        for (i = 0; i < menus.length; i++) {
            menus[i].style.backgroundColor = 'transparent';
            dropDown = menus[i].getElementsByClassName('drop-down')[0];
            dropDown.style.display = 'none';
            menus[i].removeEventListener('mouseover', hover);
            menus[i].addEventListener('mouseover', hoverOn);
            menus[i].addEventListener('mouseout', hoverOff);
        }
    }
}

// Add event-listeners
for (i = 0; i < menus.length; i++) {
    menus[i].addEventListener('click', down);
}
document.body.addEventListener('click', off);

// Minimize window
function windowMinimize() {
    ipcRenderer.send('windowMinimize');
}

// Maximize/Un-maximize window
function windowMaximize() {
    ipcRenderer.send('windowMaximize');
}

ipcRenderer.on('windowMaximized', (event) => {
    var windowMaximizer = document.getElementById('window-maximizer');
    windowMaximizer.innerHTML = "<i class='fa fa-window-maximize'></i>";
});

ipcRenderer.on('windowUnmaximized', (event) => {
    var windowMaximizer = document.getElementById('window-maximizer');
    windowMaximizer.innerHTML = "<i class='fa fa-window-restore'></i>";
});

// Close window
function windowClose() {
    ipcRenderer.send('windowClose');
}

// Select first canvas in list
function selectFirst() {
    canvases[0].click();
}

// Select last canvas in list
function selectLast() {
    canvases[canvases.length - 1].click();
}

// View Miller IDE website ("Help" section is on its way)
function viewHelp() {
    shell.openExternal('http://www.milleride.com');
}

// Email feedback
function sendFeedback() {
    shell.openExternal('mailto:milleride.help@gmail.com?subject=Miller IDE: Send Feedback');
}

// Load demonstration program; Must match up with "openFile()"
function loadExample() {
    fileContents = deepCopyFunction(exampleProgram);
    var firstCanvas = document.getElementById('first-canvas');
    firstCanvas.style.display = '';
    while (canvases.length > 1) {
        deleteCanvas();
    }
    canvases[0].className = 'canvas none selected';
    canvases[0].title = "Work Offset: G54,\nRotation: 0°,\nTransform: 0X, 0Y, 0Z";
    var openDialog = document.getElementById('open-dialog');
    if (openDialog.style.display != 'none') {
        openDialog.style.display = 'none';
    }
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('resize'));
}

// Zoom in window
function zoomIn() {
    var zoomFactor = webFrame.getZoomFactor();
    if (zoomFactor < 1.5) {
        webFrame.setZoomFactor(zoomFactor + 0.25);
    }
}

// Zoom out window
function zoomOut() {
    var zoomFactor = webFrame.getZoomFactor();
    if (zoomFactor > 0.5) {
        webFrame.setZoomFactor(zoomFactor - 0.25);
    }
}

// Get local file contents 
function updateFile() {
    var rawFile = new XMLHttpRequest();
    rawFile.open('GET', [file], false);
    rawFile.onreadystatechange = function () {
        if (rawFile.readyState === 4) {
            if (rawFile.status === 200 || rawFile.status == 0) {
                fileContents = rawFile.responseText;
            }
        }
    }
    rawFile.send(null);
}

// Prompt to "Open" file
function openFile() {
    dialog.showOpenDialog(BrowserWindow, {
        title: 'Open G-Code File',
        properties: ['openFile'],
        filters: [
            { name: 'All Files (.*)', extensions: ['*'] },
            { name: 'NC File (.nc)', extensions: ['nc'] }
        ]
    }).then(result => {
        file = result.filePaths[0];
        updateFile();
        if (file != null) {
            var firstCanvas = document.getElementById('first-canvas');
            firstCanvas.style.display = '';
        }
        while (canvases.length > 1) {
            deleteCanvas();
        }
        canvases[0].className = 'canvas none selected';
        canvases[0].title = "Work Offset: G54,\nRotation: 0°,\nTransform: 0X, 0Y, 0Z";
        var openDialog = document.getElementById('open-dialog');
        if (openDialog.style.display != 'none' && file != null) {
            openDialog.style.display = 'none';
        }
        window.dispatchEvent(new Event('resize'));
        window.dispatchEvent(new Event('resize'));
    });
}

// Write program to file
function saveFile() {
    var fullProgram = generateCode();
    fs.writeFileSync(file, fullProgram, 'utf-8');
}

// Prompt "Save As..."
function getCode() {
    dialog.showSaveDialog(BrowserWindow, {
        title: 'Save As...',
        properties: ['openFile'],
        filters: [
            { name: 'All Files (.*)', extensions: ['*'] },
            { name: 'NC File (.nc)', extensions: ['nc'] }
        ]
    }).then(result => {
        file = result.filePath;
        saveFile();
    });
}

// Perform deep copy on array
const deepCopyFunction = (inObject) => {
    let outObject, value, key
    if (typeof inObject !== "object" || inObject === null) {
        return inObject
    }
    outObject = Array.isArray(inObject) ? [] : {}
    for (key in inObject) {
        value = inObject[key]
        outObject[key] = deepCopyFunction(value)
    }
    return outObject
}

/* Tool-bar */
// Rotate canvas clock-wise
function rotateCW() {
    if ([...selectedCanvas.classList].indexOf('none') >= 0) {
        selectedCanvas.classList.remove('none');
        selectedCanvas.classList.add('quarter');
    }
    else if ([...selectedCanvas.classList].indexOf('quarter') >= 0) {
        selectedCanvas.classList.remove('quarter');
        selectedCanvas.classList.add('half');
    }
    else if ([...selectedCanvas.classList].indexOf('half') >= 0) {
        selectedCanvas.classList.remove('half');
        selectedCanvas.classList.add('threeQuarters');
    }
    else if ([...selectedCanvas.classList].indexOf('threeQuarters') >= 0) {
        selectedCanvas.classList.remove('threeQuarters');
        selectedCanvas.classList.add('none');
    }
    window.dispatchEvent(new Event('resize'));
}

// Rotate canvas counter clock-wise
function rotateCCW() {
    if ([...selectedCanvas.classList].indexOf('none') >= 0) {
        selectedCanvas.classList.remove('none');
        selectedCanvas.classList.add('threeQuarters');
    }
    else if ([...selectedCanvas.classList].indexOf('quarter') >= 0) {
        selectedCanvas.classList.remove('quarter');
        selectedCanvas.classList.add('none');
    }
    else if ([...selectedCanvas.classList].indexOf('half') >= 0) {
        selectedCanvas.classList.remove('half');
        selectedCanvas.classList.add('quarter');
    }
    else if ([...selectedCanvas.classList].indexOf('threeQuarters') >= 0) {
        selectedCanvas.classList.remove('threeQuarters');
        selectedCanvas.classList.add('half');
    }
    window.dispatchEvent(new Event('resize'));
}

/* Workspace */
var workspace = document.getElementById('workspace');
// Canvas variables
var canvases = document.getElementsByClassName('canvas');
var canvasRows = document.getElementsByClassName('canvas-row');
canvases[0].title = 'Work Offset: G54,\nRotation: 0°,\nTransform: 0X, 0Y, 0Z';
canvases[0].style.display = 'none';
var workOffset = document.getElementById('work-offset');
var rotation = document.getElementById('rotation');
var transformX = document.getElementById('transform-x');
var transformY = document.getElementById('transform-y');
var transformZ = document.getElementById('transform-z');
var selectedCanvas;
var copyBank;
var points;
var heightIsLarger = true;

// Return points-list
function plotPoints(program, canvas) {
    var xPoints = lookUp(program, 'X');
    var yPoints = lookUp(program, 'Y');
    points = [[0, 0]]
    for (i = 0; i < xPoints.length; i++) {
        points.push([program[xPoints[i][0]][xPoints[i][1]], points[points.length - 1][1]]);
        for (j = 0; j < yPoints.length; j++) {
            if (xPoints[i][0] == yPoints[j][0]) {
                points[points.length - 1][1] = program[yPoints[j][0]][yPoints[j][1]];
            }
            if (i < xPoints.length - 1) {
                if (xPoints[i][0] < yPoints[j][0] && xPoints[i + 1][0] > yPoints[j][0]) {
                    points.push([points[points.length - 1][0], program[yPoints[j][0]][yPoints[j][1]]]);
                }
            }
        }
    }
    for (i = 0; i < points.length; i++) {
        if (points[i][0][0] == 'X') {
            points[i][0] = parseFloat(points[i][0].slice(1, points[i][0].length));
        }
        if (points[i][1][0] == 'Y') {
            points[i][1] = parseFloat(points[i][1].slice(1, points[i][1].length));
        }
    }
    points = points.slice(1, points.length);
    var xVals = [];
    var yVals = [];
    for (i = 0; i < points.length; i++) {
        xVals.push(points[i][0]);
        yVals.push(points[i][1]);
    }
    var maxX = Math.max.apply(null, xVals);
    var minX = Math.min.apply(null, xVals);
    var maxY = Math.max.apply(null, yVals);
    var minY = Math.min.apply(null, yVals);
    if (Math.abs(maxX - minX) < Math.abs(maxY - minY)) {
        console.log('Height');
        for (i = 0; i < points.length; i++) {
            points[i][0] = ((0.9 * (canvas.offsetHeight / 2)) * (points[i][0] - minY) / (maxY - minY)) + (0.45 * (0.1 * (canvas.offsetHeight / 2)));
            points[i][1] = ((0.9 * (canvas.offsetHeight / 2)) * (points[i][1] - minY) / (maxY - minY)) + (0.45 * (0.1 * (canvas.offsetHeight / 2)));
            heightIsLarger = true;

        }
    }
    else {
        console.log('Width');
        for (i = 0; i < points.length; i++) {
            points[i][0] = (0.9 * (canvas.offsetWidth / 2)) * (points[i][0] - minX) / (maxX - minX);
            points[i][1] = (0.9 * (canvas.offsetWidth / 2)) * (points[i][1] - minX) / (maxX - minX);
            heightIsLarger = false;
        }
    }
    var rotate;
    if (canvas.classList[1] == 'none') {
        rotate = 0;
    }
    else if (canvas.classList[1] == 'quarter') {
        rotate = 1;
    }
    else if (canvas.classList[1] == 'half') {
        rotate = 2;
    }
    else if (canvas.classList[1] == 'threeQuarters') {
        rotate = 3;
    }
    for (r = 0; r < rotate; r++) {
        var xVals = [];
        var yVals = [];
        for (i = 0; i < points.length; i++) {
            xVals.push(points[i][0]);
            yVals.push(points[i][1]);
        }
        var maxX = Math.max.apply(null, xVals);
        var minX = Math.min.apply(null, xVals);
        var maxY = Math.max.apply(null, yVals);
        var minY = Math.min.apply(null, yVals);
        var xTheta = 0.5 * (maxX + minX);
        var yTheta = 0.5 * (maxY + minY);
        for (i = 0; i < points.length; i++) {
            points[i][0] -= xTheta;
            points[i][1] -= yTheta;
        }
        for (i = 0; i < points.length; i++) {
            var x = points[i][0];
            var y = points[i][1];
            points[i][0] = y;
            points[i][1] = -1 * x;
        }
        for (i = 0; i < points.length; i++) {
            points[i][0] += xTheta;
            points[i][1] += yTheta;
        }
    }
    return points;
}

// Draw canvases
function drawCanvas() {
    if (fileContents) {
        console.log(heightIsLarger);
        var program = subroutine(fileContents);
        for (p = 0; p < canvases.length; p++) {
            points = plotPoints(program, canvases[p]); 
            if (heightIsLarger) {
                canvases[p].width = (workspace.clientHeight - ($(window).height() / 100) * 7.5) / canvasRows.length;
                canvases[p].height = (workspace.clientHeight - ($(window).height() / 100) * 7.5) / canvasRows.length;
            }
            else if (heightIsLarger == false) {
                canvases[p].width = (workspace.clientWidth - ($(window).height() / 100) * 7.5) / canvasRows.length;
                canvases[p].height = (workspace.clientWidth - ($(window).height() / 100) * 7.5) / canvasRows.length;
            }
            canvases[p].parentNode.parentNode.style.margin = (5 / canvasRows.length) + 'vh 0 0 0';
            var ctx = canvases[p].getContext('2d');
            ctx.lineWidth = 1;
            ctx.scale(2, 2);
            if ([...canvases[p].classList].indexOf('selected') >= 0) {
                ctx.strokeStyle = '#2577f7';
            }
            else {
                ctx.strokeStyle = '#71a0ea';
            }
            ctx.clearRect(0, 0, canvases[p].width, canvases[p].height);
            for (t = 1; t < points.length; t++) {
                ctx.beginPath();
                ctx.moveTo(points[t - 1][0], points[t - 1][1]);
                ctx.lineTo(points[t][0], points[t][1]);
                ctx.stroke();
            }
        }
        var numContainers = Math.floor(workspace.offsetWidth / canvases[0].offsetHeight);
        var workspaceContainer = document.getElementById('workspaceContainer');
        for (var r = canvasRows.length - 1; r >= 1; r--) {
            while (canvasRows[r].childElementCount > 1 && canvasRows[r - 1].childElementCount < numContainers) {
                canvasRows[r - 1].appendChild(canvasRows[r].children[0].cloneNode(true));
                canvasRows[r].removeChild(canvasRows[r].children[0]);
            }
        }
        for (var cr = 0; cr < canvasRows.length; cr++) {
            if (canvasRows[cr + 1]) {
                if (canvasRows[cr].children.length > numContainers) {
                    canvasRows[cr + 1].appendChild(canvasRows[cr].children[0].cloneNode(true));
                    canvasRows[cr].removeChild(canvasRows[cr].children[0]);
                }
            }
        }
        for (var cr = canvasRows.length - 1; cr >= 1; cr--) {
            if (canvasRows[cr].childElementCount == 0) {
                workspaceContainer.removeChild(canvasRows[canvasRows.length - 1]);
            }
        }
        while (canvasRows[canvasRows.length - 1].childElementCount > numContainers) {
            var removedCanvases = [];
            var numRemove = canvasRows[canvasRows.length - 1].childElementCount - numContainers;
            for (var rc = 0; rc < numRemove; rc++) {
                removedCanvases.push(canvasRows[canvasRows.length - 1].removeChild(canvasRows[canvasRows.length - 1].children[canvasRows[canvasRows.length - 1].children.length - 1]));
            }
            var blankRow = canvasRows[0].cloneNode(true);
            blankRow.innerHTML = '';
            for (var br = 0; br < removedCanvases.length; br++) {
                blankRow.appendChild(removedCanvases[br].cloneNode(true));
            }
            workspaceContainer.appendChild(blankRow);
        }
        for (var c = 0; c < canvases.length; c++) {
            canvases[c].addEventListener('click', selectCanvas);
            canvases[c].style.zIndex = '10';
        }
        if (selectedCanvas) {
            selectedCanvas.click();
        }
        for (var c = 0; c < canvases.length; c++) {
            var splitTitle = canvases[c].title.split('\n');
            if ([...canvases[c].classList].indexOf('none') >= 0) {
                canvases[c].title = splitTitle[0] + '\nRotation: 0°,' + '\n' + splitTitle[2];
            }
            else if ([...canvases[c].classList].indexOf('quarter') >= 0) {
                canvases[c].title = splitTitle[0] + '\nRotation: 270°,' + '\n' + splitTitle[2];
            }
            else if ([...canvases[c].classList].indexOf('half') >= 0) {
                canvases[c].title = splitTitle[0] + '\nRotation: 180°,' + '\n' + splitTitle[2];
            }
            else if ([...canvases[c].classList].indexOf('threeQuarters') >= 0) {
                canvases[c].title = splitTitle[0] + '\nRotation: 90°,' + '\n' + splitTitle[2];
            }
        }
    }
}

// Select canvas by click
function selectCanvas(event) {
    for (var c = 0; c < canvases.length; c++) {
        if ([...canvases[c].classList].indexOf('selected') >= 0) {
            canvases[c].classList.remove('selected');
        }
    }
    event.target.classList.add('selected');
    selectedCanvas = event.target;
    var splitTitle = selectedCanvas.title.split(',\n');
    workOffset.value = splitTitle[0].split('Work Offset: ')[1];
    rotation.value = splitTitle[1].split('Rotation: ')[1];
    var transformVals = splitTitle[2].split('Transform: ')[1].split(' ');
    transformX.value = transformVals[0].slice(0, -2);
    transformY.value = transformVals[1].slice(0, -2);
    transformZ.value = transformVals[2].slice(0, -1);
    window.dispatchEvent(new Event('resize'));
}

// Copy canvas
function copy() {
    if (selectedCanvas) {
        copyBank = selectedCanvas.parentNode.cloneNode(true);
    }
}

// Cut canvas
function cut() {
    if (selectedCanvas && canvases.length > 1) {
        copyBank = selectedCanvas.parentNode.cloneNode(true);
        selectedCanvas.parentNode.remove();
        window.dispatchEvent(new Event('resize'));
        canvases[canvases.length - 1].click()
    }
}

// Paste canvas
function paste() {
    if (selectedCanvas) {
        copyBank.children[0].classList.remove('selected');
        canvasRows[canvasRows.length - 1].appendChild(copyBank.cloneNode(true));
        window.dispatchEvent(new Event('resize'));
        selectedCanvas.click()
        canvases[canvases.length - 1].click()
    }
}

// Delete canvas
function deleteCanvas() {
    if (selectedCanvas && canvases.length > 1) {
        selectedCanvas.parentNode.remove();
        window.dispatchEvent(new Event('resize'));
        canvases[canvases.length - 1].click();
    }
}

// Keyboard shortcuts
function copyShortcut(event) {
    if (event.ctrlKey && event.keyCode == 67) {
        copy();
    }
}
document.addEventListener('keydown', copyShortcut, false);

function cutShortcut(event) {
    if (event.ctrlKey && event.keyCode == 88) {
        cut();
    }
}
document.addEventListener('keydown', cutShortcut, false);

function pasteShortcut(event) {
    if (event.ctrlKey && event.keyCode == 86) {
        paste();
    }
}
document.addEventListener('keydown', pasteShortcut, false);

function deleteShortcut(event) {
    if (event.keyCode == 8) {
        deleteCanvas();
    }
}
document.addEventListener('keydown', deleteShortcut, false);

// Add grid-lines
$(window).resize(function() {
    var vertLines = document.getElementsByClassName('vert-line');
    while (vertLines[0]) {
        vertLines[0].parentNode.removeChild(vertLines[0]);
    }
    var horizLines = document.getElementsByClassName('horiz-line');
    while (horizLines[0]) {
        horizLines[0].parentNode.removeChild(horizLines[0]);
    }
    for (var i = 0; i < 55; i++) {
        var line = document.createElement('div');
        line.className = 'vert-line';
        var workspaceWidth = workspace.offsetWidth - 20;
        line.style.left = i * (workspaceWidth / 54) + 'px';
        workspace.appendChild(line);
    }
    for (var j = 0; j < 31; j++) {
        var line = document.createElement('div');
        line.className = 'horiz-line';
        var workspaceWidth = workspace.offsetHeight - 2;
        line.style.top = j * (workspaceWidth / 30) + 'px';
        workspace.appendChild(line);
    }
});

/* Right panel */
var categories = document.getElementsByClassName('category');
var note = 'Made with Miller IDE – Get the Most Out of G-Code';
// Modify default "Note" input-value
var noteInput = document.getElementById('note');
noteInput.value = note;

// Open "Category" on click
function openCategory(event) {
    var settings = event.target.parentNode.getElementsByClassName('setting');
    if (settings[0].style.display == 'none' || settings[0].style.display == '') {
        var chevron = event.target.getElementsByClassName('fa-chevron-down');
        chevron[0].className = 'fa fa-chevron-right';
    }
    else {
        var chevron = event.target.getElementsByClassName('fa-chevron-right');
        chevron[0].className = 'fa fa-chevron-down';
    }
    for (i = 0; i < settings.length; i++) {
        if (settings[i].style.display == 'none' || settings[i].style.display == '') {
            settings[i].style.display = 'flex';
        }
        else {
            settings[i].style.display = 'none';
        }
    }
}

// Add event-listener
for (i = 0; i < categories.length; i++) {
    categories[i].addEventListener('click', openCategory);
}

// Add "event-listeners" for parameter inputs
$('#work-offset').on('input', function() {
    if (selectedCanvas) {
        var splitTitle = selectedCanvas.title.split(',\n');
        selectedCanvas.title = 'Work Offset: ' + workOffset.value + ',\n' + splitTitle[1] + ',\n' + splitTitle[2];
    }
});

$('#transform-x').on('input', function() {
    if (selectedCanvas) {
        var splitTitle = selectedCanvas.title.split(',\n');
        selectedCanvas.title = splitTitle[0] + ',\n' + splitTitle[1] + ',\nTransform: ' + transformX.value + 'X, ' +  transformY.value + 'Y, ' + transformZ.value + 'Z';
    }
});

$('#transform-y').on('input', function() {
    if (selectedCanvas) {
        var splitTitle = selectedCanvas.title.split(',\n');
        selectedCanvas.title = splitTitle[0] + ',\n' + splitTitle[1] + ',\nTransform: ' + transformX.value + 'X, ' +  transformY.value + 'Y, ' + transformZ.value + 'Z';
    }
});

$('#transform-z').on('input', function() {
    if (selectedCanvas) {
        var splitTitle = selectedCanvas.title.split(',\n');
        selectedCanvas.title = splitTitle[0] + ',\n' + splitTitle[1] + ',\nTransform: ' + transformX.value + 'X, ' +  transformY.value + 'Y, ' + transformZ.value + 'Z';
    }
});

// Prevents users from typing "(" or ")" inside "Note" input
function preventParenthesis(event) {
    if (event.key == '(' || event.key == ')') {
        event.preventDefault();
    }
}

// Check if "Note" input is focused
var focusedNoteInput = false;
function checkNoteInput() {
    focusedNoteInput = $("#note").is(":focus");
    if (focusedNoteInput) {
        document.addEventListener('keydown', preventParenthesis, false);
    }
    else {
        document.removeEventListener('keydown', preventParenthesis, false);
    }
}
document.addEventListener('click', checkNoteInput);

// Check if any input is focused
var focused = false;
function checkFocus() {
    focused = $("input").is(":focus");
    if (focused) {
        document.removeEventListener('keydown', deleteShortcut, false);
    }
    else {
        document.addEventListener('keydown', deleteShortcut, false);

    }
}
document.addEventListener('click', checkFocus);

// Check if "Note" input-value is changed
$('#note').on('input', function() {
    note = noteInput.value;
});

/* Generate G-code */
var fileContents;

// Look-up string in program
function lookUp(program, string, strict=false, many=false) {
    var indices = [];
    for (var i = 0; i < program.length; i++) {
        for (var j = 0; j < program[i].length; j++) {
            var isComment = program[i][0].includes('(') || program[i][0].includes(')');
            if (strict) {
                if (many) {
                    for (var s = 0; s < string.length; s++) {
                        if (program[i][j].trim() == string[s] && isComment == false) {
                            indices.push([i, j]);
                        }
                    }
                }
                else {
                    if (program[i][j].trim() == string && isComment == false) {
                        indices.push([i, j]);
                    }
                }
            }
            else {
                if (program[i][j].includes(string) && isComment == false) {
                    indices.push([i, j]);
                }
            }
        }
    }
    return indices;
}

// Re-structure the program
function subroutine(program) {
    program = program.split('\n');
    for (i = 0; i < program.length; i++) {
        if (program[i].includes('(') || program[i].includes(')')) {
            program[i] = [program[i]];
        }
        else {
            program[i] = program[i].split(' ');
        }
    }
    return program;
}

// Change the work-offset to ...
function swapOffset(program, offset) {
    var offsets = ['G54', 'G55', 'G56', 'G57', 'G58', 'G59'];
    for (i = 0; i < offsets.length; i++) {
        var indices = lookUp(program, offsets[i]);
        for (j = 0; j < indices.length; j++) {
            program[indices[j][0]][indices[j][1]] = offset;
        }
    }
    return program;
}

// Modify all X, Y, and Z values by ...
function transform(program, xOffset, yOffset, zOffset) {
    xIndices = lookUp(program, 'X');
    for (i = 0; i < xIndices.length; i++) {
        var processX = program[xIndices[i][0]][xIndices[i][1]];
        processX = 'X' + (parseFloat(processX.slice(1, processX.length)) + parseFloat(xOffset)).toFixed(4);
        if (processX[processX.length - 1] == '0') {
            while (processX[processX.length - 1] == '0') {
                processX = processX.slice(0, processX.length - 1);
            }
        }
        program[xIndices[i][0]][xIndices[i][1]] = processX;
    }
    yIndices = lookUp(program, 'Y');
    for (i = 0; i < yIndices.length; i++) {
        var processY = program[yIndices[i][0]][yIndices[i][1]];
        processY = 'Y' + (parseFloat(processY.slice(1, processY.length)) + parseFloat(yOffset)).toFixed(4);
        if (processY[processY.length - 1] == '0') {
            while (processY[processY.length - 1] == '0') {
                processY = processY.slice(0, processY.length - 1);
            }
        }
        program[yIndices[i][0]][yIndices[i][1]] = processY;
    }
    zIndices = lookUp(program, 'Z');
    for (i = 0; i < zIndices.length; i++) {
        var processZ = program[zIndices[i][0]][zIndices[i][1]];
        processZ = 'Z' + (parseFloat(processZ.slice(1, processZ.length)) + parseFloat(zOffset)).toFixed(4);
        if (processZ[processZ.length - 1] == '0') {
            while (processZ[processZ.length - 1] == '0') {
                processZ = processZ.slice(0, processZ.length - 1);
            }
        }
        program[zIndices[i][0]][zIndices[i][1]] = processZ;
    }
    return program;
}

// Rotate by 90 degrees counter-clockwise
function rotate90(program) {
    var xIndices = lookUp(program, 'X');
    for (var xi = 0; xi < xIndices.length; xi++) {
        var xR = program[xIndices[xi][0]][xIndices[xi][1]];
        xR = xR.slice(1, xR.length);
        var yInLine = lookUp(program[xIndices[xi][0]], 'Y');
        var yR;
        var isY = false;
        if (yInLine[0]) {
            yR = program[xIndices[xi][0]][yInLine[0][0]];
            yR = yR.slice(1, yR.length);
            isY = true;
        }
        else {
            yR = '0';
        }
        program[xIndices[xi][0]][xIndices[xi][1]] = 'X' + (-1 * yR);
        if (isY) {
            program[xIndices[xi][0]][yInLine[0][0]] = 'Y' + xR;
        }
    }
    var yIndices = lookUp(program, 'Y');
    for (var yi = 0; yi < yIndices.length; yi++) {
        var yFlag = true;
        for (var xri = 0; xri < xIndices.length; xri++) {
            if (xIndices[xri][0] == yIndices[yi][0]) {
                yFlag = false;
            }
        }
        if (yFlag) {
            var yR = program[yIndices[yi][0]][yIndices[yi][1]];
            yR = yR.slice(1, yR.length);
            program[yIndices[yi][0]][yIndices[yi][1]] = 'X' + (-1 * yR);
        }
    }
    return program;
}

// Generate G-code
function generateCode() {
    if (fileContents) {
        var tempProgram = [];
        var program = subroutine(fileContents);
        var sbMarkers = ['M3'];
        var subroutines = [];
        var events = lookUp(program, ['M3', 'M4', 'M5'], strict=true, many=true);
        subroutines.push([program.slice(0, events[0][0])]);
        for (var sr = 0; sr < events.length - 1; sr++) {
            subroutines.push([program.slice(events[sr][0], events[sr + 1][0])]);
            if (program[events[sr][0]][events[sr][1]].includes('M3') || program[events[sr][0]][events[sr][1]].includes('M4')) {
                sbMarkers.push('M3');
            }
            else if (program[events[sr][0]][events[sr][1]].includes('M5')) {
                sbMarkers.push('M5');
            }
        }
        subroutines.push([program.slice(events[events.length - 1][0], (program.length - 1))]);
        sbMarkers.push('M5');
        for (var sb = 0; sb < subroutines.length; sb++) {
            for (var k = 0; k < canvases.length; k++) {
                if (sbMarkers[sb] == 'M5' && k < canvases.length - 1) {
                    // Do nothing
                }
                else {
                    var canvasTitle = canvases[k].title.split(',\n');
                    var thisWorkOffset = canvasTitle[0].slice(13, canvasTitle[0].length);
                    var thisRotate = canvasTitle[1].slice(10, canvasTitle[1].length - 1);
                    var xOffset = canvasTitle[2].split(' ')[1];
                    xOffset = xOffset.slice(0, xOffset.length - 2);
                    var yOffset = canvasTitle[2].split(' ')[2];
                    yOffset = yOffset.slice(0, yOffset.length - 2);
                    var zOffset = canvasTitle[2].split(' ')[3];
                    zOffset = zOffset.slice(0, zOffset.length - 1);
                    var tempSR = deepCopyFunction(subroutines[sb][0]);
                    tempSR = transform(tempSR, xOffset, yOffset, zOffset);
                    if (thisRotate.trim() == '0') {
                        // Do nothing
                    }
                    else if (thisRotate.trim() == '90') {
                        for (var r = 0; r < 3; r++) {
                            tempSR = rotate90(tempSR);
                        }
                    }
                    else if (thisRotate.trim() == '180') {
                        for (var r = 0; r < 2; r++) {
                            tempSR = rotate90(tempSR);
                        }
                    }
                    else if (thisRotate.trim() == '270') {
                        for (var r = 0; r < 1; r++) {
                            tempSR = rotate90(tempSR);
                        }
                    }
                    tempSR = swapOffset(tempSR, thisWorkOffset);
                    if (sb != 0 && sb != subroutines.length - 1) {
                        tempSR.unshift(['( TOOL-PATH: ' + sb + ', PART: ' + k + ' )']);
                        tempProgram.push(tempSR);
                    }
                    else if (k == 0 && sb == 0) {
                        var startSequence = tempSR;
                    }
                    else if (k == canvases.length - 1 && sb == subroutines.length - 1) {
                        var endSequence = tempSR;
                    }
                }
            }
        }
        for (t = 0; t < tempProgram.length; t++) {
            for (var li = 0; li < tempProgram[t].length; li++) {
                tempProgram[t][li] = tempProgram[t][li].join(' ');
            }
            tempProgram[t] = tempProgram[t].join('\n');
        }
        tempProgram = tempProgram.join('\n\n');
        for (var si = 0; si < startSequence.length; si++) {
            startSequence[si] = startSequence[si].join(' ');
        }
        tempProgram = startSequence.join('\n') + '\n\n' + tempProgram;
        for (var ei = 0; ei < endSequence.length; ei++) {
            endSequence[ei] = endSequence[ei].join(' ');
        }
        tempProgram = tempProgram + '\n\n' + endSequence.join('\n');
        tempProgram = '( ' + note.toUpperCase() + ' )' + '\n\n' + tempProgram;
        if (tempProgram[tempProgram.length - 1].trim() == '' || tempProgram[tempProgram.length - 1].trim() == '\n') {
            tempProgram = tempProgram.slice(0, -1);
        }
        return tempProgram;
    }
}

/* Boot-up operations */
$(window).resize(function() {
    drawCanvas();
    drawCanvas();
});

$('document').ready(function () {
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('resize'));
});

/* Resources */
// Test program
var exampleProgram = `
O8651( PGM-07-100-010 SONY VLOCK WEDGE A-V3A S1 )
( DATE - NOV. 15 2019 )
( TIME - 7:42 PM )
G20
G0 G17 G40 G80 G90 G94 G98
/M31
G0 G28 G91 Z0.
( TOOL - 6 2"  MITSUBISIHI FACE MILL    DIA. OFF. - 6  LEN. - 6  DIA. - 2. )
( MACHINE GROUP-1 )
T6 M6
M01
G0 G90 G54 X0. Y-2.9593 B0. A0. S8500 M3
T1
G43 H6 Z.25 /M8
Z.2
G1 Z-.02 F200.
Y2.9407 F150.
G0 Z.23
/M9
M5
G0 G28 G91 Z0.
M01
G0 G17 G40 G80 G90 G94 G98
G0 G28 G91 Z0.
( TOOL - 1  3/4 FLAT ENDMILL VIPER    DIA. OFF. - 1  LEN. - 1  DIA. - .75 )
( MACHINE GROUP-1 )
T1 M6
M01
G0 G90 G54 X-.2031 Y-.1441 B0. A0. S7500 M3
T4
G43 H1 Z.23 /M8
Z.08
G1 Z-.27 F25.
G41 D1 X-.1165 Y-.0941 F100.
G3 X0. Y.0577 I-.125 J.2165
G1 X.045 Y.2257
X-.045
X0. Y.0577
G3 X.1165 Y-.0941 I.2415 J.0647
G1 G40 X.2031 Y-.1441
G0 Z-.02
Z.08 /M9
/M8
X-.2031 Y-.376
G1 Z-.27 F25.
G41 D1 X-.1165 Y-.326 F100.
G3 X0. Y-.1742 I-.125 J.2165
G1 X.1232 Y.2857
X-.1232
X0. Y-.1742
G3 X.1165 Y-.326 I.2415 J.0647
G1 G40 X.2031 Y-.376
G0 Z-.02
Z.08 /M9
/M8
X-.2031 Y-.4146
G1 Z-.27 F25.
G41 D1 X-.1165 Y-.3646 F100.
G3 X0. Y-.2128 I-.125 J.2165
G1 X.1362 Y.2957
X-.1362
X0. Y-.2128
G3 X.1165 Y-.3646 I.2415 J.0647
G1 G40 X.2031 Y-.4146
G0 Z-.02
Z.23 /M9
/M8
X-.3584 Y-.1004
Z.08
G1 Z-.27 F25.
G41 D1 X-.2876 Y-.1711 F100.
G3 X-.1109 Y-.2443 I.1767 J.1768
G1 X.1109
G3 X.2876 Y-.1711 J.25
G1 G40 X.3584 Y-.1004
G0 Z-.02
Z.08 /M9
/M8
X-.3584 Y-.1604
G1 Z-.27 F25.
G41 D1 X-.2876 Y-.2311 F100.
G3 X-.1109 Y-.3043 I.1767 J.1768
G1 X.1109
G3 X.2876 Y-.2311 J.25
G1 G40 X.3584 Y-.1604
G0 Z-.02
Z.08 /M9
/M8
X-.3584 Y-.1704
G1 Z-.27 F25.
G41 D1 X-.2876 Y-.2411 F100.
G3 X-.1109 Y-.3143 I.1767 J.1768
G1 X.1109
G3 X.2876 Y-.2411 J.25
G1 G40 X.3584 Y-.1704
G0 Z.23 /M9
M5
G0 G28 G91 Z0.
M01
G0 G17 G40 G80 G90 G94 G98
G0 G28 G91 Z0.
( TOOL - 4  1/4 3F CRB VIPER EM    DIA. OFF. - 4  LEN. - 4  DIA. - .25 )
( MACHINE GROUP-1 )
T4 M6
M01
G0 G90 G54 X-.6203 Y-.3135 B0. A0. S12000 M3
T12
G43 H4 Z.28 /M8
Z.13
G1 Z-.169 F12.
G41 D4 X-.5429 Y-.2932 F60.
G3 X-.5279 Y-.2738 I-.0051 J.0194
X-.5286 Y-.2687 I-.0201
G2 X-.5373 Y-.2204 I.3028 J.0794
X-.538 Y-.2055 I.1492 J.0149
X-.5365 Y-.1842 I.1499
G1 X-.5362 Y-.1817
G2 X-.3834 Y-.0132 I.2072 J-.0344
G1 X-.3582 Y-.0065
X-.0456 Y.0773
X-.4209
X-.4639
G2 X-.6239 Y.1513 J.21
X-.6362 Y.168 I.1143 J.0971
X-.6463 Y.1866 I.1266 J.0804
X-.6632 Y.2338 I.2812 J.1273
G3 X-.6825 Y.2486 I-.0193 J-.0052
X-.6877 Y.2479 J-.02
G1 G40 X-.7649 Y.2271
G0 Z.081
Z.13 /M9
/M8
X-.5961 Y-.3071
G1 Z-.169 F12.
G41 D4 X-.5187 Y-.2868 F60.
G3 X-.5038 Y-.2675 I-.0051 J.0193
X-.5044 Y-.2624 I-.02
G2 X-.5124 Y-.2179 I.2786 J.0731
X-.513 Y-.2055 I.1243 J.0124
X-.5118 Y-.1877 I.1249
G1 X-.5115 Y-.1855
G2 X-.3769 Y-.0374 I.1825 J-.0306
G1 X-.3518 Y-.0307
X-.0024 Y.063
G3 X.0124 Y.0823 I-.0052 J.0193
X-.0076 Y.1023 I-.02
G1 X-.4209
X-.4639
G2 X-.6049 Y.1675 J.185
X-.6151 Y.1814 I.0953 J.0809
X-.6235 Y.1969 I.1055 J.067
X-.639 Y.2402 I.2584 J.117
G3 X-.6583 Y.2551 I-.0193 J-.0051
X-.6635 Y.2544 J-.02
G1 G40 X-.7408 Y.2336
G0 Z.28 /M9
M5
G0 G28 G91 Z0.
M01
G0 G17 G40 G80 G90 G94 G98
G0 G28 G91 Z0.
( TOOL - 12  3/16 CRB FLAT ENDMILL    DIA. OFF. - 12  LEN. - 12  DIA. - .1875 )
( MACHINE GROUP-1 )
T12 M6
M01
G0 G90 G54 X-.0187 Y.9207 B0. A0. S12000 M3
T17
G43 H12 Z.13 /M8
G1 Z-.035 F15.
G41 D12 Y.6707 F40.
Y-.6893
G40 Y-.9393
G0 Z.065
Z.13 /M9
/M8
X.0187
G1 Z-.035 F15.
G41 D12 Y-.6893 F40.
Y.6707
G40 Y.9207
G0 Z.13 /M9
M5
G0 G28 G91 Z0.
M01
G0 G17 G40 G80 G90 G94 G98
G0 G28 G91 Z0.
( TOOL - 17  NO. 32 DRILL    DIA. OFF. - 0  LEN. - 17  DIA. - .116 )
( MACHINE GROUP-1 )
T17 M6
M01
G0 G90 G54 X-.2552 Y.4424 B0. A0. S6000 M3
T13
G43 H17 Z.105 /M8
G83 G99 Z-.245 R.105 I.04 J.04 K.04 F8.
X.2552
G80 /M9
( MACHINE GROUP-1 )
/M8
X0. Y-.3672
Z.09
G83 G99 Z-.26 R.09 I.04 J.04 K.04 F8.
G80 /M9
M5
G0 G28 G91 Z0.
M01
G0 G17 G40 G80 G90 G94 G98
G0 G28 G91 Z0.
( TOOL - 13  NO. 43 DRILL    DIA. OFF. - 0  LEN. - 13  DIA. - .089 )
( MACHINE GROUP-1 )
T13 M6
M01
G0 G90 G54 X0. Y.4424 B0. A0. S8000 M3
T15
G43 H13 Z.065 /M8
G83 G99 Z-.285 R.065 I.03 J.03 K.03 F5.
Y-.5576
G80 /M9
M5
G0 G28 G91 Z0.
M01
G0 G17 G40 G80 G90 G94 G98
G0 G28 G91 Z0.
( TOOL - 15  1/4 COUNTERSINK 82 DEGREE    DIA. OFF. - 10  LEN. - 15  DIA. - .25 )
( MACHINE GROUP-1 )
T15 M6
M01
G0 G90 G54 X-.2552 Y.4424 B0. A0. S4800 M3
T10
G43 H15 Z.08 /M8
G81 G99 Z-.1534 R.08 F15.
X.2552
G80 /M9
( MACHINE GROUP-1 )
/M8
X0. Y-.3672
G81 G99 Z-.1684 R.08 F15.
G80 /M9
M5
G0 G28 G91 Z0.
M01
G0 G17 G40 G80 G90 G94 G98
G0 G28 G91 Z0.
( TOOL - 10 1/4X90 MILL DRILL    DIA. OFF. - 10  LEN. - 10  DIA. - .25 )
( MACHINE GROUP-1 )
T10 M6
M01
G0 G90 G54 X-.4209 Y-.4431 B0. A0. S12000 M3
T11
G43 H10 Z.13 /M8
G1 Z-.09 F15.
G41 D10 X-.4084 Y-.4215 F100.
G3 X-.405 Y-.409 I-.0216 J.0125
X-.4059 Y-.4025 I-.025
G1 X-.4473 Y-.2478
G2 X-.4515 Y-.2161 I.1183 J.0317
X-.3607 Y-.0978 I.1225
G1 X.0138 Y.0026
G3 X.0749 Y.0823 I-.0214 J.0797
X-.0076 Y.1648 I-.0825
G1 X-.4639
G2 X-.5822 Y.2556 J.1225
G1 X-.6891 Y.6545
G2 X-.6912 Y.6707 I.0604 J.0162
X-.6287 Y.7332 I.0625
G1 X.6287
G2 X.6912 Y.6707 J-.0625
X.6891 Y.6545 I-.0625
G1 X.3644 Y-.5573
G2 X.1109 Y-.7518 I-.2535 J.068
G1 X-.1109
G2 X-.3644 Y-.5573 J.2625
G1 X-.4059 Y-.4025
X-.4188 Y-.3542
G3 X-.4305 Y-.3391 I-.0242 J-.0065
G1 G40 X-.4521 Y-.3266
G0 Z.13 /M9
( MACHINE GROUP-1 )
S3800 M3
/M8
X0. Y.4424
Z.065
G81 G99 Z-.085 R.065 F20.
Y-.5576
G80 /M9
M5
G0 G28 G91 Z0.
M01
G0 G17 G40 G80 G90 G94 G98
G0 G28 G91 Z0.
( TOOL - 11  1/16 3F CRB FLAT ENDMILL    DIA. OFF. - 11  LEN. - 11  DIA. - .0625 )
( MACHINE GROUP-1 )
T11 M6
M01
G0 G90 G54 X0. Y-.5576 B0. A0. S12000 M3
T8
G43 H11 Z.215 /M8
Z.065
G1 Z-.135 F20.
Y-.5492 F10.
G41 D11 X.0084
G3 X0. Y-.5409 I-.0084
X-.0167 Y-.5576 J-.0167
X0. Y-.5743 I.0167
X.0167 Y-.5576 J.0167
X0. Y-.5409 I-.0167
X-.0084 Y-.5492 J-.0083
G1 G40 X0.
Y-.5576
G0 Z.215
Y.4424
Z.065
G1 Z-.135 F20.
Y.4508 F10.
G41 D11 X.0084
G3 X0. Y.4591 I-.0084
X-.0167 Y.4424 J-.0167
X0. Y.4257 I.0167
X.0167 Y.4424 J.0167
X0. Y.4591 I-.0167
X-.0084 Y.4508 J-.0083
G1 G40 X0.
Y.4424
G0 Z.215 /M9
( MACHINE GROUP-1 )
/M8
Y-.5576
Z.1
G1 Z-.22 F20.
Y-.55 F6.
G41 D11 X.0076
G3 X0. Y-.5424 I-.0076
X-.0152 Y-.5576 J-.0152
X0. Y-.5728 I.0152
X.0152 Y-.5576 J.0152
X0. Y-.5424 I-.0152
X-.0076 Y-.55 J-.0076
G1 G40 X0.
Y-.5576
G0 Z.1
Y.4424
G1 Z-.22 F20.
Y.45 F6.
G41 D11 X.0076
G3 X0. Y.4576 I-.0076
X-.0152 Y.4424 J-.0152
X0. Y.4272 I.0152
X.0152 Y.4424 J.0152
X0. Y.4576 I-.0152
X-.0076 Y.45 J-.0076
G1 G40 X0.
Y.4424
G0 Z.1 /M9
M5
G0 G28 G91 Z0.
M01
G0 G17 G40 G80 G90 G94 G98
G0 G28 G91 Z0.
( TOOL - 8  1/2X60 CRB DOVETAIL HARVEY    DIA. OFF. - 8  LEN. - 8  DIA. - .5 )
( MACHINE GROUP-1 )
T8 M6
M01
G0 G90 G54 X.9111 Y1.2551 B0. A0. S8500 M3
T4
G43 H8 Z.2074 /M8
G1 Z-.2426 F100.
G41 D8 X.7385 Y.6111 F25.
X.3753 Y-.7443
G40 X.2028 Y-1.3883
G0 Z-.0176
Z.2074 /M9
/M8
X-.2028
G1 Z-.2426 F100.
G41 D8 X-.3753 Y-.7443 F25.
X-.7385 Y.6111
G40 X-.9111 Y1.2551
G0 Z.2074 /M9
M5
G0 G28 G91 Z0.
M01
G0 G17 G40 G80 G90 G94 G98
G0 G28 G91 Z0.
( TOOL - 4  1/4 3F CRB VIPER EM    DIA. OFF. - 4  LEN. - 4  DIA. - .25 )
( MACHINE GROUP-1 )
T4 M6
M01
G0 G90 G54 X.0286 Y-.517 B0. A0. S12000 M3
T6
G43 H4 Z.23 /M8
Z.08
G1 Z-.27 F50.
G41 D4 X.0523 Y-.5404 F80.
G3 X.1108 Y-.5644 I.0585 J.0594
X.1115 Y-.5643 J.0834
X.1724 Y-.5322 I-.0007 J.075
X.1798 Y-.5078 I-.3977 J.1332
G1 X.4621 Y.5457
X-.4621
X-.1798 Y-.5078
G3 X-.1724 Y-.5321 I.4031 J.1081
X-.1115 Y-.5643 I.0616 J.0428
G1 X-.1108
G3 X-.0523 Y-.5404 J.0833
G1 G40 X-.0286 Y-.517
G0 Z-.02
Z.23 /M9
/M8
X-.1934 Y-.5163
Z.08
G1 Z-.27 F50.
G41 D4 X-.1698 Y-.5399 F80.
G3 X-.1109 Y-.5643 I.0589 J.0589
G1 X.1109
G3 X.1698 Y-.5399 J.0833
G1 G40 X.1934 Y-.5163
G0 Z.23 /M9
M5
G0 G28 G91 Z0.
G0 G28 Y0.
M30
%`