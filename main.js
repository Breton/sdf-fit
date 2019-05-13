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
modebias = 0.5;
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
recentimprovements = [];

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
letters = '0123456789';

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
        ["rotate", i * (0.5 * Math.PI / (letters.length - 1))],
        ["fillRect", 0, 0, 96, 96]
    ];
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
    ctx.globalAlpha = 1 / ((instructions.length + 5));
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

    debug('gindex', gmin, gmax, grange, (gmin + grange*0.50), gindex.length);
    debug('diff', diff);
    gindex = (gradient.map((x, i) => ((x) > (gmin + grange*0.50) ? i : 0))).filter(x => x);
    
    if (gindex.length > 10 && diff >= 0) {
        onepixel = Math.floor(gindex[Math.floor(Math.random() * gindex.length)] );
    } else {
        onepixel += ([2,1,32,16,16,1,16,1])[Math.floor(Math.random()*8)];
    }


    return Math.abs(onepixel);
}
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

    
    // if (weightFail - weightSuccess > 0) {
    //     modebias = 0.9;
    //     weightFail = 0;
    //     //smoothduration=500;
    //     weightSuccess = 0;
    // }
    // if (pixelFail - pixelSuccess > 0) {
    //     modebias = 0.1;
    //     pixelFail = 0;
    //     //smoothduration=500;
    //     pixelSuccess = 0;
    // }

    //modebias = Math.sin(time * Math.PI / 10000 ) * 0.25 + 0.75;

    willAdjustWeights = Math.random() > modebias;

    olderscore = oldscore;
    oldscore = newscore;


    olderdata = olddata;
    olddata = (newdata||olddata);

    olderweights = oldweights;
    oldweights = weights;
    newweights = weights;
    

    debug('maxweightscore',indexOfMax(weightscores),weightscores);

    if (willAdjustWeights) {
        // newweights = perturbWeights(weights);

        newweights = await optimiseWeightsForInstructions(ctx, ctxsmall, weights, instructions,(weightscores.length && Math.random()>0.9)?indexOfMax(weightscores):(((weightSuccess)%instructions.length)),1);
    } else {
        onepixel = updatePixel(onepixel, oldscore-olderscore);
        await optimisePixelForWeights(ctx, ctxsmall, weights, instructions, onepixel);
    }


    
    newdata = ctxsmall.getImageData(0, 0, canvassmall.width, canvassmall.height);
//    ctxsmall.putImageData(bestdata, 0, 0);
  //  bestScore = await scoreLoopAsync(ctx, ctxsmall, bestweights, instructions, 0, letterCounter);
    // bestScore = bestScore - await scoreLoopAsync(ctx, ctxsmall, bestweights, instructions, 0, letterCounter);
    ctxsmall.putImageData(newdata, 0, 0);
    newscore = await scoreLoopAsync(ctx, ctxsmall, newweights, instructions, 0, letterCounter);


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
            weightSuccess += 1;
            modebias *= 0.9;
        } else {
            weightFail += 1;
            modebias = 1 * 0.1 + modebias * 0.9
            
        }
    } else {
        if (newscore < oldscore) {
            pixelSuccess += 1;
            modebias = 1 * 0.1 + modebias * 0.9
            
        } else {
            pixelFail += 1;
            modebias *= 0.9;
        }
    }



    if (!willAdjustWeights ) {
        //if newscore is greater than oldscore, 
        //that's worse, so invert whatever was just done to the pixel.
        //if newscore is less, then that's better, do it again.
        let dir =  (oldscore - newscore) > 0 ? 1 : -1;

        gradient[onepixel % 256] = (gradient[onepixel % 256] || 0) + dir;
        
        

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
    

    //sctx.drawImage(ocanvas,0,0);
    debug('clear');
    debug(`
  weightSuccess ${weightSuccess}
  weightFail ${weightFail}
  weightRange ${weightRange}
  weightMin ${weightMin}
  weightMax ${weightMax}
  badWeightMin ${badWeightMin}
  badWeightMax ${badWeightMax}
  idealWeightRange ${idealWeightRange}
  badWeightRange ${badWeightRange}
  
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
  weights.map 
  ${weights.map((x)=>(x.map((x)=>((x*10000|0)/10000)).join(',   ')+'\n'))}
  letters ${letters}
  difference ${difference}
  gindex.length ${gindex.length}
  gradient
  ${(gradient.map((x,i)=>( !!x ?(i+ ":" + x):0  ) )).filter(x=>x).join(' ')}
    
  grdient 2

${
    ((gmax,gmin) => (
      (gradient.map((x, i) => ((x) > (gmin + (gmax-gmin)*0.5) ? i : 0))).filter(x => x)
    ))(
      (gradient.reduce((a, b) => Math.max(a,b) )),
      (gradient.reduce((a, b) => Math.min(a,b) ))
    )

    
}


  `)

    lasttime = time;
    time = new Date() - starttime;
    duration = time - lasttime;
    smoothduration = smoothduration * 0.99 + duration * 0.01;
    setTimeout(main, 10);
}

setTimeout(main, 10);

let idx = 0;
let prv = 0;
async function preview () {
    idx = prv / 1 | 0;
    idx = idx % Math.min(letterCounter, weights.length);


    ctxresult.globalAlpha = 1;
    ctxresult.drawImage(canvassmall, 0, 0, 256, 256);
    if (weights.length !== 0);
    
    threshold(ctxresult, ...weights[idx]);
    ctxresult.font = "16px sans-serif";
    ctxresult.fillStyle = 'white';
    ctxresult.textAlign = 'center'
    ctxresult.save();
    ctxresult.scale(0.2, 0.2);
    ctxresult.translate(0, 0);
    evalCanvas(ctxresult, instructions[idx]);
    ctxresult.restore();

    ctxresult.fillText(letters[idx] + " " + fonts[idx % fonts.length], 128, 20, 256);
    prv++;
}
setInterval(preview, 100);