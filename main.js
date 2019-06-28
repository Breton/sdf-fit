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
pixelBenchmarkCount = 100;
scoreWindowSize = pixelBenchmarkCount;
scoreRate = 10;
scoreRateRate = 0;
letters = '0123456789ABCDEFGHIJKLMNOP';

letters = '1';

letters = '149';

evalSize = 64;
modelock = false;
scoreDebug = {};
weightBenchmarks = [];
weightBenchmarkCount = 100;
pixelBenchmarks = [];
lowestScorePerIndex = [];




async function addPixelBenchmark(data,newscore) {
    //console.log("adding pixel benchmrark, newscore",!!pixelBenchmarks, pixelBenchmarks.length,(pixelBenchmarks[0]||{}).score,  newscore )
  if(pixelBenchmarks && typeof pixelBenchmarks.push === 'function' && !willAdjustWeights ){
       let sum =  score(data);
       let range = 10;
       let diff = 20;
       let l = pixelBenchmarks.length;
        let sumindex = pixelBenchmarks.map(x=>x.sum).indexOf(sum);
         if(sumindex<0) {
          pixelBenchmarks.push({score:(newscore),data:data,sum:Math.round(sum*100000000000)});
         } else {
          pixelBenchmarks[sumindex] = ({score:(newscore),data:data,sum:Math.round(sum*100000000000)});
         }

       
       
       pixelBenchmarks.sort((a,b)=>a.score-b.score);
       
       if(l>2 && pixelBenchmarks[l-1]) {
        range = pixelBenchmarks[l-1].score - pixelBenchmarks[0].score;
       }

       let crunch = diff/pixelBenchmarkCount
       console.log('adding pixel benchmark', range, crunch, newscore, Math.round(sum*100000000000));
       pixelBenchmarks = pixelBenchmarks.filter((x,i,a)=> ( Math.floor(x.score/crunch) !== Math.floor((a[i-1]||{}).score/crunch) ) );
       pixelBenchmarks.sort((a,b)=>a.sum-b.sum);
       pixelBenchmarks = pixelBenchmarks.filter((x,i,a)=> ( x.sum !== (a[i-1]||{}).sum ) );
       pixelBenchmarks.sort((a,b)=>a.score-b.score);
       
       if(l > 3 && range > diff) {
          pixelBenchmarks.length = Math.max(3,Math.min(l-1,pixelBenchmarkCount));
       }
  }
}
function randomPixelBenchmark() {
  if(pixelBenchmarks && pixelBenchmarks.length) {
    return (pixelBenchmarks[Math.floor(pixelBenchmarks.length*Math.random())].data);
  } else {
    return bestdata || ctxsmall.getImageData(0, 0, canvassmall.width, canvassmall.height);
  }

}

function averagePixelBenchmark() {
    let c = [];
    let avg = [];

    for (let i = 0; i < (pixelBenchmarks.length); i++) {
        let item = pixelBenchmarks[i].data;
        if(typeof item !== 'undefined') {
          let j = c.length-1;
          c[j] = item;
          c[j].data.length = 16 * 16 * 4;
          c[j] = Array.from(c[j].data);

          if (avg.length === 0) {
              avg = Array.from(c[j]);
          } else {
              avg = avg.map((x, k) => x + c[j][k]);
          }
        }
        //console.log('c[i]', i, c[i]);
    }

    avg = avg.map((x) => x / pixelBenchmarks.length);
    //console.log('avg', counter, avg);
    //    console.log(avg);
    if(avg.length===0){
      return []
    }
    let d = new ImageData(new Uint8ClampedArray(avg, 16, 16), 16, 16);
    return d;
          
          
}
function breedPixelBenchmark() {
    let c = [];
    let avg = [];
    if(pixelBenchmarks.length > 0) {
      avg.length = pixelBenchmarks[0].data.data.length;
      avg.fill(1);

      avg = avg.map((x,i) => pixelBenchmarks[Math.floor(Math.random()*pixelBenchmarks.length)].data.data[i] );
      //console.log('avg', counter, avg);
      //    console.log(avg);
      let d = new ImageData(new Uint8ClampedArray(avg, 16, 16), 16, 16);
      return d;
    } else {
      return new ImageData(new Uint8ClampedArray((new Array(256*4)).fill(127), 16, 16), 16, 16);
    }

          
          
}

function breedWeightBenchmark() {
    let avg = [];
    if(weightBenchmarks && weightBenchmarks.length > 0) {
      avg.length = weightBenchmarks[0].weights.length
      avg.fill(0).map(x=>[x,x,x]);
      avg = avg.map((x,i) => weightBenchmarks[rollDie(weightBenchmarks.length)].weights[i] );
      return cloneWeights(avg);
    } else {
      return cloneWeights(bestweights)
    }

          
          
}

function lowestPixelBenchmark() {
  if(pixelBenchmarks && pixelBenchmarks.length) {
    return (pixelBenchmarks[0].data);
  } else {
    return bestdata || ctxsmall.getImageData(0, 0, canvassmall.width, canvassmall.height);
  }

}
function addWeightBenchmark(weights,newscore) {
    if(weights && weightBenchmarks &&  (weightBenchmarks[0]||{}).score !== newscore ){

         let range = 10;

         
         let diff = 100;
         let l = weightBenchmarks.length;
         let sum = sumWeights(weights);
         let sumindex = weightBenchmarks.map(x=>x.sum).indexOf(sum);
         if(sumindex<0) {
          weightBenchmarks.push({score: newscore,weights:weights,sum:sum});
         } else {
          weightBenchmarks[sumindex]={score: newscore,weights:weights,sum:sum};
         }
         weightBenchmarks.sort((a,b)=>a.score-b.score);
         if(l>2 && weightBenchmarks[l-1]) {

          range = weightBenchmarks[l-1].score - weightBenchmarks[0].score;
         }
         
        let crunch = diff/weightBenchmarkCount;
         console.log('addWeightBenchmark',range,crunch,newscore,sum);
         weightBenchmarks = weightBenchmarks.filter((x,i,a)=> ( Math.floor(x.score/crunch) !== Math.floor((a[i-1]||{}).score/crunch) ) );
         weightBenchmarks.sort((a,b)=>a.sum-b.sum);
         weightBenchmarks = weightBenchmarks.filter((x,i,a)=> ( x.sum !== (a[i-1]||{}).sum ) );
         weightBenchmarks.sort((a,b)=>a.score-b.score);

         if(l > 3 && range > diff) {
            
            weightBenchmarks.length = Math.max(2,Math.min(weightBenchmarks.length-1,weightBenchmarkCount));
         }
    }
}

debug2D('gradient',gradient,16,16);
(function() {
     let div = document.createElement('div');
     let container = document.createElement('div');

     let imgGradient = document.getElementById('img-gradient');
     container.style.position = 'relative';
     container.style.display = 'inline-block';

     div.style.position = 'absolute'
     div.style.width = '16px'
     div.style.height = '16px'
     div.style.backgroundColor = 'red'
     // div.style.left = canvasvassmall.offsetLeft + "px"
     // div.style.top = canvassmall.offsetTop + "px"
     if(imgGradient) {
     imgGradient.replaceWith(container);
     container.appendChild(imgGradient);

     container.appendChild(div);
     }
     setInterval(function() {
         div.style.left = ((onepixel % 16) * 16 ) + 'px';
         div.style.top = ((((onepixel / 16) | 0) % 16) * 16 ) + 'px';
     }, 10);


 }());


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
console.log("instructions populated",instructions.length, instructions[0][6][1]);
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


function primeCanvas() {
  console.log("priming canvas");
  for (let i = 0; i < instructions.length; i++) {
      ctx.globalAlpha = 1;
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = "white"
      evalCanvas(ctx, instructions[i]);
      ctx.globalCompositeOperation="screen";
       

  }
  setDataImg(canvas,'userAction');
}

primeCanvas();

ctx.globalCompositeOperation = "source-over";
ctxsmall.globalCompositeOperation = "source-over";



/* init lowest scores for scoreInstructionsAndWeights */

 for (let i = 0; i < instructions.length; i++){
    if (lowestScorePerIndex[i]===undefined) {
         ctx.globalCompositeOperation='source-over';
         ctx.fillStyle="black";
         ctx.fillRect(0,0,256,256);
         
         evalCanvas(ctx, instructions[i]);
         lowestScorePerIndex[i] = score(ctx);
           //debugCanvas(ctx,'lowestscore-'+i);
          //console.log(ctx.canvas.width, "lowest score per index", lowestScorePerIndex[i]);
         
     }
 }

function scoreLoopAsync(ctx, ctxsmall, weights, instructions, start, letterCounter) {
    ctx.clearRect(0,0,256,256);
    return new Promise(function(res, err) {
        res(scoreInstructionsAndWeights(ctx, ctxsmall, weights, instructions, 0, letterCounter,true));
    });
}
smoothduration = 1000;
/* outer gradient */
function updatePixel(onepixel,diff=0) {
    let gval = 1, gmax =1, gmin=0, grange=1; 
    if(gradient && gradient.length){
      gmax = (gradient.reduce((a, b) => Math.max(a,b) ));
      gmin = (gradient.reduce((a, b) => Math.min(a,b) ));
      grange = gmax-gmin;
      

      gindex = (gradient.map((x, i) => ( x===gmax || x !== gmin && ((x-gmin)/grange < Math.random()) ? i : 0) )).filter(x => !!x);
    
      let onepixelmod = onepixel.mod(gradient.length);

      if(gindex.indexOf(onepixelmod) < 0 ) {
        gindex.push(onepixelmod);
        gindex.sort();
      }
      
      let oindex=gindex.indexOf(onepixelmod);

      //debug(`gindex, ${gindex} oindex: ${oindex}, gmin: ${gmin} gmax: ${gmax} gran: ${grange} gindindex.lneght ${gindex.length}`);
      if (gindex.length > 0) {
          onepixel = gindex[(oindex+1).mod(gindex.length)];  
      } 
     
    }
    onepixel += ([-1,1,-16,16,0,0,0,0,0,0,0,0,0,0,0,0])[Math.floor(Math.random()*16)];
    gval = (gradient[onepixel]-gmin)/grange;

    return {pixel:Math.abs(onepixel),value:gval};
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
    } else {
      bestdata = lowestPixelBenchmark();
    }
    if (!bestweights) {
      bestweights = cloneWeights(weights);
    }



    let deltapixel = [0, 0, 0];
    let idx = onepixel % (bestdata.data.length / 4);
    if(!modelock) {
      if (weightFail > 100 && scoreRateRate >= 0 && scoreRate >= 0 || lastimprovement ===0 ) {
          
          modebias = 1;
          weightFail = 1;
          //smoothduration=500;
          weightSuccess = 1;
          if(weightBenchmarks && weightBenchmarks[0] ) {}
          setWeights(cloneWeights(weightBenchmarks[0].weights));

          //weights=cloneWeights(minimumWeights);
          //oldweights=cloneWeights(minimumWeights)
          //olderweights=cloneWeights(minimumWeights)
      }
      if (pixelFail > 100 && scoreRateRate >= 0 && scoreRate >= 0  || lastimprovement ===0) {
          
          modebias = 0.0;
          pixelFail = 0;

          
          minimumScore=10000;
          weightMemo = new Map();
          //smoothduration=500;
          pixelSuccess = 0;
          setDataImg(lowestPixelBenchmark(),'optim lowest');
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

    if(scoreDebug && scoreDebug.nscores ){
      needsMostImprovement = indexOfMax(scoreDebug.nscores)
    }
    if(flipCoin() && scoreDebug && scoreDebug.mscores ){
      needsMostImprovement = indexOfMax(scoreDebug.mscores)
    }
    if(flipCoin() && scoreDebug && scoreDebug.cscores ){
      needsMostImprovement = indexOfMax(scoreDebug.cscores)
    }


    debug('maxweightscore',needsMostImprovement);
    //console.log('weights',weights);
    if (willAdjustWeights) {

        
          let whichweights = 'none';

          switch (updatecount % 6){
            case 0:

              if(weightBenchmarks && weightBenchmarks[0]) {
                weights = cloneWeights(weightBenchmarks[0].weights);
                whichweights= 'lowest bench'
              }
              break;

            case 1:
              weights = breedWeightBenchmark();
              whichweights= 'breed'
              break;
            case 2: 
              weights = perturbWeights(weights,Math.random()*Math.random());
              whichweights= 'perturb'
              break;
            case 3: 
              if(weightBenchmarks && weightBenchmarks.length) {
                weights = cloneWeights(weightBenchmarks[Math.floor(weightBenchmarks.length*Math.random())].weights);  
              }
              
              whichweights= 'random benchmark'
              break;
            case 4: 
              weights = cloneWeights(minimumWeights);
              whichweights= 'minimal'
              break;
            case 5: 
              weights = randomWeights(weights);
              whichweights= 'random'
              break;

            case 6: 
              weights = cloneWeights(bestweights);
              whichweights= 'best'

              break;
            default:
              whichweights = 'no, none';
              break;
          }
          console.log('weightmutation', whichweights);
           
        if (scoreDebug && scoreDebug.nscores) {
          newweights = await optimiseWeightsForInstructions(ctx, ctxsmall, weights, instructions,needsMostImprovement,1);
        } else {
          newweights = await optimiseWeightsForInstructions(ctx, ctxsmall, weights, instructions,(updatecount%instructions.length),1);
        }
    } else {

        let oneframe = needsMostImprovement;

        if(flipCoin() && pixelBenchmarks && pixelBenchmarks.length > 3) {
          //setDataImg(lowestPixelBenchmark(),'optim lowest');
          //setDataImg(averagePixelBenchmark(),'optim average');
          if(flipCoin()) {
             setDataImg(breedPixelBenchmark(),'optim breed');
          }
          else {
              setDataImg(averagePixelBenchmark(),'optim average');
          } 
          
 
  
        } else {
          setDataImg(lowestPixelBenchmark(),'optim lowest');
          onepixel = updatePixel(onepixel, oldscore-olderscore);
          let value = onepixel.value;
          onepixel=onepixel.pixel;

          if(flipCoin()) {
            await optimise8colorPixel(ctx, ctxsmall, [weights[oneframe]], [instructions[oneframe]], onepixel,value);
          } else {
            await optimise8colorPixel(ctx, ctxsmall, weights, instructions, onepixel,value);
          }
        }

          
        

        
        //flipCoin() && (await optimisePixelForWeights(ctx, ctxsmall, [weights[oneframe]], [instructions[oneframe]], onepixel,needsMostImprovement));
       // if (scoreRate > 1) {
        //await optimisePixelForWeights(ctx, ctxsmall, [weights[indexOfMax(weightscores)]], [instructions[indexOfMax(weightscores)]], onepixel,needsMostImprovement);
       //}
        /*
        flipCoin() && await optimise9PixelsForWeights(ctx, ctxsmall, weights, instructions, onepixel,needsMostImprovement);
        flipCoin() && (onepixel = updatePixel(onepixel, oldscore-olderscore));
        
        x
        */
        
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

    if (willAdjustWeights && newscore < minimumScore) {
      minimumScore = newscore;
      minimumWeights = cloneWeights(newweights);
      addWeightBenchmark(minimumWeights,newscore);

    }

    if (willAdjustWeights){
    
      addWeightBenchmark(newweights,newscore);
   
    }
    if(!willAdjustWeights) {
      addPixelBenchmark(newdata,newscore);
    }
    if (newscore < oldscore) {
      
      
      debug('scores', newscore,oldscore,olderscore,globalscore,'small improvement', newscore - oldscore);

    }
    if (newscore > oldscore) {
       debug('scores', newscore,oldscore,olderscore,globalscore,'small fail', newscore - oldscore);
       
       if(!willAdjustWeights){
        if(flipCoin()){
        //  setDataImg(averagePixelBenchmark(),'newscore > oldscore: average');
        } else {
        //  setDataImg(breedPixelBenchmark(),'newscore > oldscore: breed');
        }
       }
       //setWeights(oldweights);
    }
    if (newscore > olderscore ) {
        debug('scores', newscore,oldscore,olderscore,globalscore,'big fail', newscore - olderscore);

        if(!willAdjustWeights){
      //    setDataImg(lowestPixelBenchmark(),'newscore > olderscore: lowest');
        }
        //newdata = bestdata;
    }
    if (newscore < globalscore) {
       debug('scores', newscore,oldscore,olderscore,globalscore,'big improvement', newscore - globalscore);
       bestweights = cloneWeights(newweights);
       bestdata = newdata;
       
       

   
    }
    if (newscore === oldscore) {
       debug('scores', newscore,oldscore,olderscore,globalscore,'no change', newscore - globalscore);
    }
    if (willAdjustWeights) {
        if (scoreRate < 0 && scoreRateRate < 0) {
            weightSuccess += 1
            // modebias *= 0.9;
        } else {
            weightFail += 1
            // modebias = 1 * 0.1 + modebias * 0.9
            
        }
    } else {
        if (scoreRate < 0 && scoreRateRate < 0) {
            pixelSuccess += 1
            // modebias = 1 * 0.1 + modebias * 0.9
            
        } else {
            pixelFail += 1
            // modebias *= 0.9;
        }
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
  globalscore ${globalscore}
  minimumScore ${minimumScore}  
  pixelscores ${ pixelBenchmarks.map(x=>x.score).filter((x,i,a)=>i===0||i===a.length-1) }
  weightscores ${ weightBenchmarks.map(x=>x.score).filter((x,i,a)=>i===0||i===a.length-1) }
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
  olderscore ${olderscore}
  oldscore ${oldscore}
  newscore ${newscore}
  diff ${newscore - oldscore }
  differ ${newscore - olderscore}
  lowestever ${lowestever}
  lastimprovement ${lastimprovement}
  updatecount ${updatecount}
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
  let idx=0;
  var blend = 0;
  var u=0,v=0,w=0,i=0,l=0;
  var last = 0;
  var itouched = false;
  uel.onchange=uel.oninput=function () {  u= +(this.value);  }
  vel.onchange=vel.oninput=function () {  v= +(this.value);  }
  wel.onchange=wel.oninput=function () {  w= +(this.value);  }
  iel.onchange=iel.oninput=function () { itouched = true; idx=i= Math.floor(+(this.value)); blend=+(this.value)-i; }
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
        //console.log('weights', (idx+1)%weights.length, idx, blend );
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