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
lastimprovement = 0;
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
scoreSamples = [];
scoreWindowSize = 100;
scoreRate = 10;
scoreRateRate = 0;
letters = '0123456789ABCDEFGHIJKLMNOP';
letters = '0147';
evalSize = 16;
modelock = false;
scoreDebug = {};
weightBenchmarks = [];
weightBenchmarkCount = 100;


minimumScoreDiff = 0;



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
        ["font", "256px sans-serif"],
        ["textAlign", "center"],
        ["translate", 128, 128],
        //["rotate",  rotation + (i) * ( 2*( Math.PI )/ (letters.length ))],
        //["fillRect", 0, 0, 96, 96]
        ["fillText", letters[i], 20, 90, 256]
    ];
}

function resetInstructions(){
  rotation += Math.PI/32;
  instructions = [];
  for (let i = 0; i < letters.length; i++) {
      instructions[i] = [
          ['fillStyle', 'black'],
          ["fillRect", 0, 0, 256, 256],
          ["fillStyle", "white"],
          // ["translate", 128, 128],
          //["rotate", rotation + (i) * ( 2*( Math.PI )/ (letters.length ))],
          //["fillRect", 0, 0, 96, 96]
          ["fillText", letters[i], 20, 20, 256]
      ];
  }
}


iterations = 1;
r = Math.random;
weights = [];
oldweights = [];
olderweights = [];
bestweights = [];
for (let i = 0; i < letters.length; i++) {
    weights[i] = [r(), r(), r()];
    oldweights[i] = [r(), r(), r()];
    olderweights[i] = [r(), r(), r()];
    bestweights[i] = [r(), r(), r()];
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

    if(Math.random()>0.5){
      gindex = (gradient.map((x, i) => ( x !== gmin && ((x-gmin)/grange < 0.1) ? i : 0) )).filter(x => !!x);
      //gindex = (gradient.map((x, i) => (Math.abs(x-(grange/2)-gmin) < (0.1) ? i : 0))).filter(x => x);
    } else {
      gindex = (gradient.map((x, i) => (((x-gmin)/grange > Math.random()) ? i : 0))).filter(x => !!x);
    }
    debug('gindex', gmin, gmax, grange, (gmin + grange), gindex.length);
    debug('diff', diff);
    
    if (gindex.length > 0) {
        onepixel = gindex[updatecount%gindex.length];
        onepixel += ([-1,1,-16,16,0,0,0,0,0,0,0,0,0,0,0,0])[Math.floor(Math.random()*16)];
    } else {
        onepixel += ([2,1,32,16,16,1,16,1,0,0,0,0,0,0,0,0])[Math.floor(Math.random()*16)];
    }


    return Math.abs(onepixel);
}
minimumWeights=cloneWeights(weights);
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
      bestweights = cloneWeights(weights);
    }



    let deltapixel = [0, 0, 0];
    let idx = onepixel % (bestdata.data.length / 4);
    if(!modelock) {
      if (weightFail > 1 && scoreRateRate >= 0 && scoreRate >= 0 ) {
          
          modebias = 1;
          weightFail = 1;
          //smoothduration=500;
          weightSuccess = 1;
          weights=cloneWeights(minimumWeights);
          oldweights=cloneWeights(minimumWeights)
          olderweights=cloneWeights(minimumWeights)
      }
      if (pixelFail > 1 && scoreRateRate >= 0 && scoreRate >= 0 ) {
          
          modebias = 0.0;
          pixelFail = 0;

          
          minimumScore=10000;
          weightMemo = new Map();
          //smoothduration=500;
          pixelSuccess = 0;
      }
    }
    //modebias = Math.sin(time * Math.PI / 10000 ) * 0.25 + 0.75;

    willAdjustWeights = Math.random() > modebias;

    olderscore = oldscore;
    oldscore = newscore;


    olderdata = olddata;
    olddata = (newdata||olddata);

    olderweights = cloneWeights(oldweights);
    oldweights = cloneWeights(weights);
    newweights = cloneWeights(weights);
    
    needsMostImprovement =indexOfMax(weightscores);
    function flipCoin(){
      return Math.random()>0.5;
    }
    debug('maxweightscore',indexOfMax(weightscores),weightscores);
    //console.log('weights',weights);
    if (willAdjustWeights) {
        if(scoreRate >= 0) {
          let whichweights = 'none';
          switch (Math.floor(Math.random()*10)){
            case 0: 
              if(weightBenchmarks && weightBenchmarks.length)
              weights = cloneWeights(weightBenchmarks[Math.floor(weightBenchmarks.length*Math.random())].weights);
              whichweights= 'random benchmark'
              break;
            case 1: 
              weights = cloneWeights(bestweights);
              whichweights= 'best'
              break;
            case 2: 
              weights = cloneWeights(weightBenchmarks[0].weights);
              whichweights= 'lowest bench'
              break;
            case 3: 
              weights = cloneWeights(minimumWeights);
              whichweights= 'minimal'
              break;
            case 4: 
              weights = randomWeights(weights);
              whichweights= 'random'
              break;
            default:
              whichweights = 'no, none';
              break;
          }

           console.log('loaded',whichweights,updatecount);
        } 
        if(letters.length>2) {
          if (flipCoin()) {
            weights = tweenWeights(weights,0.01);
            
          }
          if (flipCoin()) {
            weights = distributeWeights(weights,0.01,0.5);
          }

        }

        if(flipCoin()) {

          weights = perturbWeights(weights);
          
        } 
        if (flipCoin()) {
          //console.log('weights1',weights);
          newweights = await optimiseWeightsForInstructions(ctx, ctxsmall, weights, instructions,(weightscores.length && Math.random()>0.9)?indexOfMax(weightscores):(((weightSuccess)%instructions.length)),1);
        } else {
          //console.log('weights2',weights);
          newweights = await optimiseWeightsForInstructions(ctx, ctxsmall, weights, instructions,(weightscores.length && Math.random()>0.9)?indexOfMax(weightscores):(((weightSuccess)%instructions.length)),1);
        }
    } else {
        onepixel = updatePixel(onepixel, oldscore-olderscore);
        await optimisePixelForWeights(ctx, ctxsmall, weights, instructions, onepixel,needsMostImprovement);
    }


    
    newdata = ctxsmall.getImageData(0, 0, canvassmall.width, canvassmall.height);
    
    //ctxsmall.putImageData(bestdata, 0, 0);
    //bestScore = await scoreLoopAsync(ctx, ctxsmall, bestweights, instructions, 0, letterCounter);
    
    //minimumScoreDiff = (await scoreLoopAsync(ctx, ctxsmall, minimumWeights, instructions, 0, letterCounter));
    //minimumScoreDiff = minimumScore - minimumScoreDiff.score;
    //ctxsmall.putImageData(newdata, 0, 0);

    newscore = await scoreLoopAsync(ctx, ctxsmall, newweights, instructions, 0, letterCounter);
    gradient = newscore.bins.map((x,i)=> Math.floor(x*0.5+gradient[i]*0.5) );

    scoreDebug = newscore;
    newscore = newscore.score;
      
    debugWeights(newweights,letters.split('').map(x=>'n'+x ),'gray' );

    if (willAdjustWeights && newscore < minimumScore || (weightBenchmarks.length && newscore < weightBenchmarks[weightBenchmarks.length-1].score)){
      minimumScore = newscore;
      minimumWeights = cloneWeights(newweights);
      weightBenchmarks.push({score:Math.round(newscore),weights:minimumWeights,sum:sumWeights(minimumWeights) });
      weightBenchmarks.sort((a,b)=>a.score-b.score);
      weightBenchmarks = weightBenchmarks.filter((x,i,a)=> ( x.score !== (a[i-1]||{}).score ) );
      if(weightBenchmarks.length > weightBenchmarkCount) {
        weightBenchmarks.length = weightBenchmarkCount;
      }
      weightBenchmarks.sort((a,b)=>a.sum-b.sum);
      weightBenchmarks = weightBenchmarks.filter((x,i,a)=> ( x.sum !== (a[i-1]||{}).sum ) );


    }
    if (newscore < oldscore) {
      debug('scores', newscore,oldscore,olderscore,globalscore,'small improvement', newscore - oldscore);
    }
    if (newscore > oldscore) {
       debug('scores', newscore,oldscore,olderscore,globalscore,'small fail', newscore - oldscore);
       ctxsmall.putImageData(olddata, 0, 0);
       newdata = olddata;
       //setWeights(oldweights);
    }
    if (newscore > olderscore ) {
        debug('scores', newscore,oldscore,olderscore,globalscore,'big fail', newscore - olderscore);

        ctxsmall.putImageData(bestdata, 0, 0);
        newdata = bestdata;
    }
    if (newscore < globalscore) {
       debug('scores', newscore,oldscore,olderscore,globalscore,'big improvement', newscore - globalscore);
       bestweights = cloneWeights(newweights);
       bestdata = newdata;
       if(weightBenchmarks[0].score !== newscore ){
         
         weightBenchmarks.push({score:Math.round(newscore),weights:bestweights,sum:sumWeights(bestweights)});
         weightBenchmarks.sort((a,b)=>a.score-b.score);
         weightBenchmarks = weightBenchmarks.filter((x,i,a)=> ( x.score !== (a[i-1]||{}).score ) );
         if(weightBenchmarks.length > weightBenchmarkCount) {
            weightBenchmarks.length = weightBenchmarkCount;
         }
         weightBenchmarks.sort((a,b)=>a.sum-b.sum);
         weightBenchmarks = weightBenchmarks.filter((x,i,a)=> ( x.sum !== (a[i-1]||{}).sum ) );
       }

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


    
    if (newscore >= globalscore) {
        let m = 0.0273015
        let k = 0.260159
        let o = 1.00663
        let b = -m*Math.pow(lastimprovement,k)+o;
        lastimprovement++;

        globalscore = globalscore * b + newscore * (1-b);
    } 
    if(newscore < globalscore) {
        globalscore = newscore;
        lastimprovement = 1;
    }
    //globalscore = Math.max(globalscore, bestScore);
    if (lowestever > globalscore) {
        lowestever = globalscore;
    }
    

    {
      let l = scoreSamples.length
      scoreSamples.push(newscore);
      if(l > scoreWindowSize){
        scoreSamples.shift();
      }
      l=l-1;

      let v = (l*l)/2;

      let newScoreRate=  (scoreSamples.reduce((a,b,i)=>a+b*(i))/v - scoreSamples.reduce((a,b,i)=>a+b*(l-i))/v)/l;
      scoreRateRate = newScoreRate  - scoreRate;
      scoreRate=newScoreRate;

     
      //scoreRate=(scoreSamples[l-1]-scoreSamples[0])/l +  ).reduce((a,b)=>a+b)/l;
      
      

    }

    debug2D('gradient',gradient,16,16);

    debugWeights(bestweights,letters.split('').map(x=>'b'+x ),'green' );
    debugWeights(minimumWeights,letters.split('').map(x=>'m'+x ),'red' );
    debugWeights(weights,letters);
    debugTable(weights);
    debugTable(minimumWeights);


    //sctx.drawImage(ocanvas,0,0);
    debug('clear');

    debug(`
  weightSuccess ${weightSuccess}
  weightFail ${weightFail}
  pixelSuccess ${pixelSuccess}
  pixelFail ${pixelFail}
  mscore ${scoreDebug.mscore} nscore ${scoreDebug.nscore} cscore ${scoreDebug.cscore}
  mscores ${scoreDebug.mscores} 
  nscores ${scoreDebug.nscores} 
  cscores ${scoreDebug.cscores}
  lscores ${lowestScorePerIndex}
  scoreRate ${scoreRate}
  scoreRateRate ${scoreRateRate}
  samplecount ${samplecount}
  scorecount ${scorecount}
  duration ${duration}
  smoothduration ${smoothduration}
  modebias ${modebias}
  willAdjustWeights ${willAdjustWeights}
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
  lastimprovement ${lastimprovement}
  updatecount ${updatecount}
  minimumScore ${minimumScore}  
  minimumScoreDiff ${minimumScoreDiff}  
  letters ${letters}
  difference ${difference}
  gindex.length ${gindex.length}
  
    
 


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
  var blend = 0;
  var u=0,v=0,w=0,i=0,l=0;
  var last = 0;
  var itouched = false;
  uel.onchange=uel.onmousemove=function () {  u= +(this.value);  }
  vel.onchange=vel.onmousemove=function () {  v= +(this.value);  }
  wel.onchange=wel.onmousemove=function () {  w= +(this.value);  }
  iel.onchange=iel.onmousemove=function () { itouched = true; idx=i= Math.floor(+(this.value)); blend=+(this.value)-i; }
  iel.setAttribute('max', weights.length);
  iel.setAttribute('min', 0);
  setTimeout(preview, 200);
  
  function preview (name,value) {
      setTimeout(preview, 100);
      let time=new Date();
      if(time-last > 200){
        last = time;

        idx = idx % Math.min(letterCounter, weights.length);
        ctxresult.globalCompositeOperation = "source-over";

        ctxresult.globalAlpha = 1;
        ctxresult.drawImage(canvassmall, 0, 0, 256, 256);
        
        if(idx < weights.length-1) {
          u = weights[idx][0]*(1-blend) + weights[(idx+1)%weights.length][0]*blend;
          v = weights[idx][1]*(1-blend) + weights[(idx+1)%weights.length][1]*blend;
          w = weights[idx][2]*(1-blend) + weights[(idx+1)%weights.length][2]*blend;
        } else {
          u = weights[idx][0];
          v = weights[idx][1];
          w = weights[idx][2];          
        }

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