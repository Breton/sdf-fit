debugVariable('test','test2');

canvases={}
ctxs={}
Array.from(document.getElementsByTagName('CANVAS'))
  .forEach(function(canvas){
    let id=canvas.getAttribute('id');
    canvases[id]=canvas;
    ctxs[id]=canvas.getContext('2d');
  });


ctxs.prime.clearRect(0,0,256,256);
ctxs.small.fillRect(0,0,256,256);
u=0.5,v=0.5,w=0.5,i=5,l=0;

HTMLElement.prototype.on= function (eventname,handler) { this.addEventListener(eventname,handler,false) }

let pendown = false;

function onDraw (evt){ 
  // console.log(evt);
  debugVariable('offsetX',evt.offsetX);
  debugVariable('offsetY',evt.offsetY);
  let x = evt.offsetX;
  let y = evt.offsetY;
  if(evt.which) {
    canvasDraw(x/this.offsetWidth,y/this.offsetHeight,i);
  }
}


canvases.prime.on('click',onDraw);
canvases.prime.on('mousemove',onDraw);
canvases.prime.on('touch',onDraw);
canvases.prime.on('touchmove',onDraw);

canvases.small.on('click',onDraw);
canvases.small.on('mousemove',onDraw);
canvases.small.on('touch',onDraw);
canvases.small.on('touchmove',onDraw);


{
  let uel = document.getElementById('u');
  let vel = document.getElementById('v');
  let wel = document.getElementById('w');
  let iel = document.getElementById('i');
  
  
  uel.onchange = uel.oninput=function () {  u= +(this.value); updateCanvas(ctxs,u,v,w); }
  vel.onchange = vel.oninput=function () {  v= +(this.value); updateCanvas(ctxs,u,v,w); }
  wel.onchange = wel.oninput=function () {  w= +(this.value); updateCanvas(ctxs,u,v,w); }
  iel.onchange = iel.oninput=function () {  i= +(this.value); updateCanvas(ctxs,u,v,w); }
  
  // $('#uv').xy({min:0,max:1, change:function(v){
  //   // console.log(v);
  // }})
  
}

setInterval(function(){
  
  ;
  updateCanvas(ctxs,u + Math.random()*0.05-0.025,v + Math.random()*0.05-0.025,w);
},100);
drawqueue=[]
function canvasDraw(x,y,color){
  drawqueue.push({x,y,color});
}
drawqueuebusy=false;
setTimeout(function loop(){
  
  if(drawqueuebusy || drawqueue.length === 0){
    //exitearly if busy
    setTimeout(loop,0);
    return;
  }


  
  let c = drawqueue.shift();
  let {x,y,color} = c;
  
  
  let width=canvases.small.width;
  let height=canvases.small.height;
  let colors='000,010,110,100,001,011,111,101'.split(',').map(x=>x.split('').map(y=>+y*255));
  let rgb = colors[color];

  x=x.mod(1);
  y=y.mod(1);
  x=Math.floor(x*width);
  y=Math.floor(y*height);
  debugVariable('x',x);
  debugVariable('y',y);
  debugVariable('rgb',rgb.toString());
  if(rgb.length) {
    let data  = ctxs.small.getImageData(x,y,1,1);

    data.data[0]=rgb[0];
    data.data[1]=rgb[1];
    data.data[2]=rgb[2];
    
    drawqueuebusy=true;
    ctxs.small.putImageData(data,x,y);
    debugVariable('rgb',rgb);

    updateCanvas(ctxs,u,v,w).then(function(){
      drawqueuebusy=false;
      setTimeout(loop,0);
    })
    
  }

},10)

function blurcanvasdata() {
  let data= ctxs.small.getImageData(0, 0, canvases.small.width, canvases.small.height);

        for (let i = 0; i < data.data.length; i += 4) {
            let l = data.data.length
            data.data[i + 0] = data.data[(i + 0).mod(l)] * 0.5 + data.data[(i + 4 + 0).mod(l)] * 0.25 + data.data[(i - 4 + 0).mod(l)] * 0.25
            data.data[i + 1] = data.data[(i + 1).mod(l)] * 0.5 + data.data[(i + 4 + 1).mod(l)] * 0.25 + data.data[(i - 4 + 1).mod(l)] * 0.25
            data.data[i + 2] = data.data[(i + 2).mod(l)] * 0.5 + data.data[(i + 4 + 2).mod(l)] * 0.25 + data.data[(i - 4 + 2).mod(l)] * 0.25

            data.data[i + 0] = data.data[(i + 0).mod(l)] * 0.5 + data.data[(i + 4 * 16 + 0).mod(l)] * 0.25 + data.data[(i - 4 * 16 + 0).mod(l)] * 0.25
            data.data[i + 1] = data.data[(i + 1).mod(l)] * 0.5 + data.data[(i + 4 * 16 + 1).mod(l)] * 0.25 + data.data[(i - 4 * 16 + 1).mod(l)] * 0.25
            data.data[i + 2] = data.data[(i + 2).mod(l)] * 0.5 + data.data[(i + 4 * 16 + 2).mod(l)] * 0.25 + data.data[(i - 4 * 16 + 2).mod(l)] * 0.25

        }
        return data; //ctxs.small.putImageData(data,0,0);
}
function updateCanvas(ctxs,u,v,w) {
  let data= ctxs.small.getImageData(0, 0, canvases.small.width, canvases.small.height);
  ctxs.scratch.clearRect(0,0,256,256)

  let blurreddata = blurcanvasdata();
  ctxs.small.putImageData(blurreddata,0,0);
  ctxs.scratch.drawImage(ctxs.small.canvas, 0, 0, 256, 256);
  ctxs.small.putImageData(data,0,0);
  ctxs.scratch.globalAlpha=0.5
  ctxs.scratch.drawImage(ctxs.small.canvas, 0, 0, 256, 256);
  ctxs.scratch.globalAlpha=1
  debugVariable('u',u);
  debugVariable('v',v);
  debugVariable('w',w);

  return thresholdAsync(ctxs.scratch,u,v,w,0.05,1,0,0,1,1,0,0,0).then(function(){
    ctxs.prime.clearRect(0,0,256,256);
    ctxs.prime.drawImage(canvases.scratch,0,0);
    ctxs.small.putImageData(data,0,0);
  });
}