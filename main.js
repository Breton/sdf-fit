canvas = document.getElementsByTagName('canvas')[0];
//ocanvas = new OffscreenCanvas(256,256);
canvassmall = document.getElementsByTagName('canvas')[1];
canvasresult = document.getElementsByTagName('canvas')[2];
img = document.getElementsByTagName('img')[0];

//octx = ocanvas.getContext('2d');
ctx = canvas.getContext('2d');
ctxsmall = canvassmall.getContext('2d');
ctxresult = canvasresult.getContext('2d');
letter = 'g';
onepixel = 0;
temp = 0.1;
lasti = 0;
listd = 0;

weightSuccess = 1;
weightFail = 1;

pixelSuccess = 1;
pixelFail = 1;
oldscore = 0;
gindex = [];
olderscore = 0;
bestScore = 0;
modebias = 0;
weightbias = 0.5;
pixelbias = 0.5;
twopixel = 0;
willAdjustWeights = true;
lastimprovoement = 0;
globalscore = 1000000;
updatecount = 0;
difference = 0;
starttime = new Date();
bestdata = null;
newdata = null;
olddata = null;
needsMostImprovement = 0;
recentimprovements = [];
rotation = Math.random();
gradient = [0, 0, 0]; // (r,g,b,r,g,b...)
gradient.length = 256;
gradient.fill(1);
enhancementLoopCount = 0;
anneal = 0;
maxri = 0;
minri = 0;
time = 0;
duration = 0;

letters = '0123456789ABCDEFGHIJKLMNOP';


letters = '0123';



letterCounter = letters.length;
fonts = [
    "normal 256px serif",
    "bold 256px serif"
]

instructions = [];
for (let i = 0; i < letters.length; i++) {
    instructions[i] = [
        ['fillStyle', 'black'],
        ["fillRect", 0, 0, 256, 256],
        ["fillStyle", "white"],
        ["translate", 128, 128],
        ["rotate",  rotation + (i) * ( 2*( Math.PI )/ (letters.length ))],
        ["fillRect", 0, 0, 96, 96]
       // ["fillText", letters[i], 20, 90, 256]
    ];
}

function resetInstructions(){
  rotation += Math.random();
  instructions = [];
  for (let i = 0; i < letters.length; i++) {
      instructions[i] = [
          ['fillStyle', 'black'],
          ["fillRect", 0, 0, 256, 256],
          ["fillStyle", "white"],
          ["translate", 128, 128],
          ["rotate", rotation + (i) * ( 2*( Math.PI )/ (letters.length ))],
          ["fillRect", 0, 0, 96, 96]
         // ["fillText", letters[i], 20, 90, 256]
      ];
  }
}


iterations = 1;
r = Math.random;
weights = [];
oldweights = [];
olderweights = [];
bestweights = null;
for (let i = 0; i < letters.length; i++) {
    weights[i] = [r(), r(), r()];
    oldweights[i] = [r(), r(), r()];
    olderweights[i] = [r(), r(), r()];
}
weights.length = letters.length
weightsDiff = [];


lowestScorePerLetter = {};
nscores = [];
mscores = [];

newscore = 0;
newweights = weights;
lowestever = letterCounter * 100000;

ctx.fillStyle = "black"
ctx.fillRect(0, 0, 256, 256);

for (let i = 0; i < instructions.length; i++) {

    ctx.globalCompositeOperation = "lighten";
    evalCanvas(ctx, instructions[i]);
    ctx.globalCompositeOperation = "multiply";
    ctx.globalAlpha = 1 / (instructions.length + 5);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 256, 256);
    ctx.globalAlpha = 1;
}
ctx.globalCompositeOperation = "multiply";
ctx.fillStyle = "red";
ctx.fillRect(0, 0, 256, 256);
ctxsmall.globalCompositeOperation = "screen";
ctxsmall.drawImage(canvas, 0, 0, canvassmall.width, canvassmall.height);

for (let i = 0; i < instructions.length; i++) {

    ctx.globalCompositeOperation = "lighten";
    evalCanvas(ctx, instructions[instructions.length - i - 1]);
    ctx.globalCompositeOperation = "multiply";
    ctx.globalAlpha = 1 / ((instructions.length));
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 256, 256);
    ctx.globalAlpha = 1;
}
ctx.globalCompositeOperation = "multiply";
ctx.fillStyle = "green";
ctx.fillRect(0, 0, 256, 256);
ctxsmall.globalCompositeOperation = "screen";
ctxsmall.drawImage(canvas, 0, 0, canvassmall.width, canvassmall.height);


ctx.globalCompositeOperation = "source-over";
ctxsmall.globalCompositeOperation = "source-over";
ctx.fillStyle = 'white';
ctx.font = "256px sans-serif";
ctx.textAlign = "center";


//loadCtx();
//loadWeights();


function scoreLoopAsync(ctx, ctxsmall, weights, instructions, start, letterCounter) {
    ctx.clearRect(0,0,256,256);
    return new Promise(function(res, err) {
        res(scoreInstructionsAndWeights(ctx, ctxsmall, weights, instructions, 0, letterCounter,true));
    });
}
smoothduration = 1000;
/* outer gradient */
function updatePixel(onepixel,diff=0) {
    let gmax = (gradient.reduce((a, b) => Math.max(a,b) ));
    let gmin = (gradient.reduce((a, b) => Math.min(a,b) ));
    let grange = gmax-gmin;

    debug('gindex', gmin, gmax, grange, (gmin + grange*Math.random()), gindex.length);
    debug('diff', diff);
    gindex = (gradient.map((x, i) => ((x) > (gmin + grange*Math.random()) ? i : 0))).filter(x => x);
    
    if (gindex.length > 0) {
        onepixel = gindex[updatecount%gindex.length];
        onepixel += ([-1,1,-16,16,0,0,0,0,0,0,0,0,0,0,0,0])[Math.floor(Math.random()*16)];
    } else {
        onepixel += ([2,1,32,16,16,1,16,1,0,0,0,0,0,0,0,0])[Math.floor(Math.random()*16)];
    }


    return Math.abs(onepixel);
}
let minimumWeights=[];
let minimumScore=10000;

async function main() {
    samplecount = 0;
    scorecount = 0;
    time = new Date() - starttime;
    updatecount+=1
    

    if (!bestdata) {
        olddata = bestdata = ctxsmall.getImageData(0, 0, canvassmall.width, canvassmall.height);
    }
    if (!bestweights) {
      bestweights = weights;
    }



    let deltapixel = [0, 0, 0];
    let idx = onepixel % (bestdata.data.length / 4);

    if(weightFail - weightSuccess > 1  ){
      newweights=weights=bestweights=minimumWeights;
    }
    if (weightFail - weightSuccess > 10) {
        modebias = 1;
        weightFail = 0;
        //smoothduration=500;
        weightSuccess = 0;
        newweights=weights=bestweights=minimumWeights;
    }
    if (pixelFail - pixelSuccess > 10) {
        modebias = 0.0;
        pixelFail = 0;
        
          resetInstructions();

        
        
        buttons['save data point']();
        if(Math.random()>0.5){  
          buttons['load and average']();
        } else {
          buttons.blur();
        }
        minimumWeights=[];
        minimumScore=10000;
        weightMemo = new Map();
        //smoothduration=500;
        pixelSuccess = 0;
    }

    //modebias = Math.sin(time * Math.PI / 10000 ) * 0.25 + 0.75;

    willAdjustWeights = Math.random() > modebias;

    olderscore = oldscore;
    oldscore = newscore;


    olderdata = olddata;
    olddata = (newdata||olddata);

    olderweights = oldweights;
    oldweights = weights;
    newweights = weights;
    
    needsMostImprovement =indexOfMax(weightscores);

    debug('maxweightscore',indexOfMax(weightscores),weightscores);

    if (willAdjustWeights) {
        if(Math.random()>0.5) {
          newweights = perturbWeights(weights,instructions.length);
        } else if (Math.random()>0.5) {
          newweights = await optimiseWeightsForInstructions(ctx, ctxsmall, weights, instructions,(weightscores.length && Math.random()>0.9)?indexOfMax(weightscores):(((weightSuccess)%instructions.length)),1);
        } else {
          newweights = perturbWeights(weights,instructions.length);
          newweights = await optimiseWeightsForInstructions(ctx, ctxsmall, newweights, instructions,(weightscores.length && Math.random()>0.9)?indexOfMax(weightscores):(((weightSuccess)%instructions.length)),1);
        }
    } else {
        onepixel = updatePixel(onepixel, oldscore-olderscore);
        await optimisePixelForWeights(ctx, ctxsmall, weights, instructions, onepixel,needsMostImprovement);
    }


    
    newdata = ctxsmall.getImageData(0, 0, canvassmall.width, canvassmall.height);
//    ctxsmall.putImageData(bestdata, 0, 0);
  //  bestScore = await scoreLoopAsync(ctx, ctxsmall, bestweights, instructions, 0, letterCounter);
    // bestScore = bestScore - await scoreLoopAsync(ctx, ctxsmall, bestweights, instructions, 0, letterCounter);
    ctxsmall.putImageData(newdata, 0, 0);
    newscore = await scoreLoopAsync(ctx, ctxsmall, newweights, instructions, 0, letterCounter);
    gradient = newscore.bins.map((x,i)=> Math.floor(x*0.5+gradient[i]*0.5) );

    newscore = newscore.score;

    if (willAdjustWeights && newscore < minimumScore){
      minimumScore = newscore;
      minimumWeights = newweights;

    }
    if (newscore < oldscore) {
      debug('scores', newscore,oldscore,olderscore,globalscore,'small improvement', newscore - oldscore);
    }
    if (newscore > oldscore) {
       debug('scores', newscore,oldscore,olderscore,globalscore,'small fail', newscore - oldscore);
       ctxsmall.putImageData(olddata, 0, 0);
       newdata = olddata;
       weights = newweights = oldweights;
    }
    if (newscore > olderscore) {
        debug('scores', newscore,oldscore,olderscore,globalscore,'big fail', newscore - olderscore);
        weights = newweights = oldweights = olderweights = bestweights;
        ctxsmall.putImageData(bestdata, 0, 0);
        newdata = bestdata;
    }
    if (newscore < globalscore) {
       debug('scores', newscore,oldscore,olderscore,globalscore,'big improvement', newscore - globalscore);
       bestweights = newweights;
       bestdata = newdata;
    }
    if (newscore === oldscore) {
       debug('scores', newscore,oldscore,olderscore,globalscore,'no change', newscore - globalscore);
    }
    if (willAdjustWeights) {
        if (newscore < oldscore) {
            weightSuccess += 1
            // modebias *= 0.9;
        } else {
            weightFail += 1
            // modebias = 1 * 0.1 + modebias * 0.9
            
        }
    } else {
        if (newscore < oldscore) {
            pixelSuccess += 1
            // modebias = 1 * 0.1 + modebias * 0.9
            
        } else {
            pixelFail += 1
            // modebias *= 0.9;
        }
    }



    if (false && !willAdjustWeights ) {
        //if newscore is greater than oldscore, 
        //that's worse, so invert whatever was just done to the pixel.
        //if newscore is less, then that's better, do it again.
        let dir =  (oldscore - newscore) > 0 ? 1 : -1;

        //gradient[onepixel % 256] = (gradient[onepixel % 256] || 0) + dir;
        
        

        if(dir === 0) {
          gradient[(onepixel % 256)] = 0;
        }

        //gradient = gradient.map(x =>  x*0.9 );
    }


    if (newscore > globalscore) {
        globalscore = globalscore * 0.99 + newscore * 0.01;
    } else {
        globalscore = newscore;
    }
    //globalscore = Math.max(globalscore, bestScore);
    if (lowestever > globalscore) {
        lowestever = globalscore;
    }

    globalscore = Math.max(newscore,globalscore);
    debug2D('gradient',gradient,16,16);

    debugWeights(weights,letters);
    //sctx.drawImage(ocanvas,0,0);
    debug('clear');

    debug(`
  weightSuccess ${weightSuccess}
  weightFail ${weightFail}
  samplecount ${samplecount}
  scorecount ${scorecount}
  pixelSuccess ${pixelSuccess}
  pixelFail ${pixelFail}
  duration ${duration}
  smoothduration ${smoothduration}
  modebias ${modebias}
  weightbias ${weightbias}
  pixelbias ${pixelbias}
  willAdjustWeights ${willAdjustWeights}
  letterCounter ${letterCounter}
  anneal ${anneal}
  iterations ${iterations}
  onepixel ${onepixel}
  bestScore ${bestScore}
  globalscore ${globalscore}
  olderscore ${olderscore}
  oldscore ${oldscore}
  newscore ${newscore}
  diff ${newscore - oldscore }
  differ ${newscore - olderscore}
  lowestever ${lowestever}
  lastimprovoement ${lastimprovoement}
  updatecount ${updatecount}
  minimumScore ${minimumScore}
  minimumWeights ${minimumWeights.map((x)=>(x.map((x)=>((x*10000|0)/10000)).join(',   ')+'\n'))}
  weights.map 
  ${weights.map((x)=>(x.map((x)=>((x*10000|0)/10000)).join(',   ')+'\n'))}
  letters ${letters}
  difference ${difference}
  gindex.length ${gindex.length}
  gradient
  ${(gradient.map((x,i)=>( !!x ?(i+ ":" + x):0  ) )).filter(x=>x).join(' ')}
    
 


  `)

    lasttime = time;
    time = new Date() - starttime;
    duration = time - lasttime;
    smoothduration = smoothduration * 0.99 + duration * 0.01;
    setTimeout(main, 10);
}

setTimeout(main, 10);



{
  var uel = document.getElementById('u');
  var vel = document.getElementById('v');
  var wel = document.getElementById('w');
  var iel = document.getElementById('i');
  var idx=0;
  var u=0,v=0,w=0,i=0,l=0;
  var last = 0;
  var itouched = false;
  uel.onchange=uel.onmousemove=function () {  u= +(this.value);  }
  vel.onchange=vel.onmousemove=function () {  v= +(this.value);  }
  wel.onchange=wel.onmousemove=function () {  w= +(this.value);  }
  iel.onchange=iel.onmousemove=function () { itouched = true; idx=i= +(this.value); }
  iel.setAttribute('max', weights.length);
  iel.setAttribute('min', 0);
  setInterval(preview, 200);
  
  function preview (name,value) {
      let time=new Date();
      if(time-last > 100){
        last = time;

        idx = idx % Math.min(letterCounter, weights.length);
        ctxresult.globalCompositeOperation = "source-over";

        ctxresult.globalAlpha = 1;
        ctxresult.drawImage(canvassmall, 0, 0, 256, 256);
        
        u = weights[idx][0];
        v = weights[idx][1];
        w = weights[idx][2];

        let dataobj;
       dataobj = ctxresult.getImageData(0, 0, ctxresult.canvas.width, ctxresult.canvas.height);


       let wd = ctxresult.canvas.width;
       let hd = ctxresult.canvas.height; 
       let dd = thresholdKernel(dataobj.data, u, v, w);



       ctxresult.putImageData(dataobj, 0, 0);
       

//        threshold(ctxresult, u,v,w);

          if(itouched){
            uel.value=weights[idx][0]; 
            vel.value=weights[idx][1]; 
            wel.value=weights[idx][2]; 

            
        
            itouched=false;
          } 

        
        
        ctxresult.font = "16px sans-serif";
        ctxresult.fillStyle = 'white';
        ctxresult.textAlign = 'center'
        ctxresult.save();
        ctxresult.scale(0.2, 0.2);
        ctxresult.translate(0, 0);
        evalCanvas(ctxresult, instructions[idx]);
        ctxresult.restore();

        ctxresult.fillText(letters[idx] + " " + fonts[idx % fonts.length], 128, 20, 256);
      } 
  }
}
// setInterval(preview, 100);