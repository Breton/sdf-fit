weightBenchmarks = [];
pixelBenchmarks = [];
benchmarks = [];
weightBenchmarkCount = 100;
benchmarkCount = 20;
pixelBenchmarkCount = 100;

function sumInstructions (instructions) {
  let string = JSON.stringify(instructions);
  let sum1 = string.split('').reduce((a,b) => (a+b.charCodeAt(0)) ,0);
  let sum2 = string.split('').reduce((a,b) => (a*b.charCodeAt(0)) ,0);
  let sum3 = string.split('').reduce((a,b) => (a^b.charCodeAt(0)) ,0);
  return `${sum1}:${sum2};${sum3}`;
}
async function recheckBenchmarks(update=false) {
  for(let i = 0; i < benchmarks.length; i++){
    let benchmark = benchmarks[i];
    ctxchecksmall.putImageData(benchmark.data,0,0);
    // setDataImg(benchmark.data,'recheck');
    let checkscore = await scoreLoopAsync('recheck',ctxcheck, ctxchecksmall, benchmark.weights, instructions, 0, letterCounter);
    let newscore = checkscore;
    let weightsum = sumWeights(benchmark.weights);
    let instructionssum = sumInstructions(instructions);
    let pixsum = sumPixels(benchmark.data);
    const trunc = x=>(x).toString().slice(-5);
    let sum = `${instructionssum}-${newscore.score}-d${newscore.checksumd}-${newscore.checksumsa.join(':')}-${newscore.checksumsb.join(':')}-${newscore.checksumsc.join(':')}-${weightsum}-${pixsum}`;
    if(benchmark.sum !== sum) {
     console.log('checkscore',benchmark.sum, sum, benchmark.score, checkscore.score, checkscore.mscores, checkscore.nscores, checkscore.cscores);
     if(update){
      benchmark.score=checkscore.score;
      benchmark.sum=sum
      }
    } else {
      console.log('good score',checkscore.nscores, checkscore.cscores)
    }
  }

}
function cloneImageData(data) {
  return new ImageData(new Uint8ClampedArray(data.data), 16, 16);
}
async function addBenchmark(data,weights,nscore,userAction) {
  ctxbenchmarksmall.putImageData(data,0,0);
  newscore = await scoreLoopAsync('benchmark',ctxbenchmark, ctxbenchmarksmall, weights, instructions, 0, letterCounter);
  let d = new ImageData(new Uint8ClampedArray(data.data), 16, 16);
  data = d;
  // console.log("newscore add",newscore);
  if(weights && benchmarks && typeof benchmarks.push === 'function' ){
       let sum; 
       let range = 10;
       let min = 0;
       let max = 20;
       let diff = 100;
       let nonuser = benchmarks.filter(x=>!x.userAction);
       let l = nonuser.length;
       let weightsum = sumWeights(weights);
       let instructionssum = sumInstructions(instructions);
       let pixsum = sumPixels(data);
       const trunc = x=>(x).toString().slice(-5);
       sum = `${instructionssum}-${newscore.score}-d${newscore.checksumd}-${newscore.checksumsa.join(':')}-${newscore.checksumsb.join(':')}-${newscore.checksumsc.join(':')}-${weightsum}-${pixsum}`;
       //console.log('checkscore',sum,newscore,checkscore);
       //console.log('new',newscore,nonuser && nonuser.length && nonuser[l-1].score)
       if(l>=1 && newscore.score > nonuser[l-1].score && !userAction && !willAdjustWeights) {
          console.log("didn't add", newscore.score);
            return newscore;
       }
       let sumindex = benchmarks.map(x=>x.sum).indexOf(sum);
       if(userAction){
        console.log('adding user benchmark', userAction, sumindex, newscore, sum, weightsum);
       }
       
       //if(sumindex<0) {
        benchmarks.push({userAction: userAction, mscore: newscore.mscore, score:(newscore.score),weights:cloneWeights(weights), data:data,sum:sum});
       //} else {
       // console.log('early return');
       // return newscore;
       // benchmarks[sumindex] = ({userAction: userAction && benchmarks[sumindex].userAction, score:(newscore.score),weights:cloneWeights(weights),data:data,sum:sum});
       //}

       benchmarks.sort((a,b)=>a.score-b.score);
       nonuser = benchmarks.filter(x=>!x.userAction);

       if(l>2 && nonuser[l-1]) {
        min =nonuser[0].score;
        max = nonuser[l-1].score;
        range = max-min;
       }

       
       
       
       //benchmarks = benchmarks.filter((x,i,a)=> ( (x.score) !== ((a[i-1]||{}).score) ) );
       benchmarks.sort((a,b)=>a.sum-b.sum);
       benchmarks = benchmarks.filter((x,i,a)=> ( x.sum !== (a[i-1]||{}).sum ) );
        nonuser = benchmarks.filter(x=>!x.userAction);
        l = nonuser.length;
        benchmarks.sort((a,b)=>a.score-b.score);
        benchmarks = benchmarks.filter((x,i,a)=> ( x.score !== (a[i-1]||{}).score ) );

		if(l > benchmarkCount) {
            benchmarks = benchmarks.filter((x,i) => ( x.userAction || i<=1 ) )
            //benchmarks = benchmarks.filter((x,i,a)=> ( x.userAction || x.score < min+(max-min)/2 ) );
      }
    console.log('add',l,benchmarks.length,sum)
  }
  return newscore;
}



function randomBenchmark() {
  if(benchmarks && benchmarks.length > 0) {
    let b = (benchmarks[Math.floor(benchmarks.length*Math.random())]);
    return {data: cloneImageData(b.data), weights: cloneWeights(b.weights)};
  } else {
    return {data: cloneImageData(bestdata), weights: cloneWeights(bestweights)};
  }
}




async function addPixelBenchmark(data,newscore,userAction) {
    //console.log("adding pixel benchmrark, newscore",!!pixelBenchmarks, pixelBenchmarks.length,(pixelBenchmarks[0]||{}).score,  newscore )
  if(pixelBenchmarks && typeof pixelBenchmarks.push === 'function'){
       let sum =  score(data);
       let range = 10;
       let min = 0; 
       let max = 10;
       addPixelBenchmark.diff =  addPixelBenchmark.diff || 20;
       let nonuser = pixelBenchmarks.filter(x=>!x.userAction);
       let l = nonuser.length;
        let sumindex = pixelBenchmarks.map(x=>x.sum).indexOf(sum);
         if(sumindex<0) {
          pixelBenchmarks.push({userAction:userAction, score:(newscore),data:data,sum:Math.round(sum*100000000000)});
         } else {
          pixelBenchmarks[sumindex] = ({userAction:userAction,score:(newscore),data:data,sum:Math.round(sum*100000000000)});
         }

       let phi = Math.sqrt(Math.sqrt(2))
       
       pixelBenchmarks.sort((a,b)=>a.score-b.score);
       
       if(l>2 && nonuser[l-1]) {
        min =nonuser[0].score;
        max = nonuser[l-1].score;
        range = max-min;
       }
       if(l < pixelBenchmarkCount) {
         addPixelBenchmark.diff*=1/phi;
       }
       if(l > pixelBenchmarkCount) {
         addPixelBenchmark.diff*=phi;
       } 

       let crunch = 0.00001;

       debug('adding pixel benchmark', range, crunch, newscore, Math.round(sum*100000000000));
       pixelBenchmarks = pixelBenchmarks.filter((x,i,a)=> ( x.userAction || Math.floor(x.score/crunch) !== Math.floor((a[i-1]||{}).score/crunch) ) );
       pixelBenchmarks.sort((a,b)=>a.sum-b.sum);
       pixelBenchmarks = pixelBenchmarks.filter((x,i,a)=> ( x.userAction || x.sum !== (a[i-1]||{}).sum ) );
       pixelBenchmarks.sort((a,b)=>a.score-b.score);
     
       if(pixelBenchmarks.length > pixelBenchmarkCount && range > 20) {
          pixelBenchmarks = pixelBenchmarks.filter((x,i,a)=> ( x.userAction || x.score < min+20 || flipCoin() ) );
       }



  }
}


function randomPixelBenchmark() {
  return randomBenchmark().data;
}


function averagePixelBenchmark() {
    let c = [];
    let avg = [];

    for (let i = 0; i < (benchmarks.length); i++) {
        if(benchmarks[i] && benchmarks[i].data){
          let item = benchmarks[i].data;
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
        }
        //console.log('c[i]', i, c[i]);
    }

    avg = avg.map((x) => x / benchmarks.length);
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
    if(benchmarks.length > 0) {
      avg.length = benchmarks[0].data.data.length;
      avg.fill(1);

      avg = avg.map((x,i) => benchmarks[Math.floor(Math.random()*benchmarks.length)].data.data[i] );
      //console.log('avg', counter, avg);
      //    console.log(avg);
      let d = new ImageData(new Uint8ClampedArray(avg, 16, 16), 16, 16);
      return d;
    } else {
      return cloneImageData(bestdata);
    }

          
          
}


function lowestPixelBenchmark() {
  if(benchmarks && benchmarks.length) {
    return cloneImageData(benchmarks[0].data);
  } else {
    return cloneImageData(bestdata) || cloneImageData(ctxsmall.getImageData(0, 0, canvassmall.width, canvassmall.height));
  }

}



function breedWeightBenchmark() {
    let avg = [];
    if(benchmarks && benchmarks.length > 0) {
      avg.length = benchmarks[0].weights.length
      avg.fill(0).map(x=>[x,x,x]);
      avg = avg.map((x,i) => benchmarks[rollDie(benchmarks.length)].weights[i] );
      return cloneWeights(avg);
    } else {
      return cloneWeights(bestweights)
    }

          
          
}


function lowestWeightBenchmark() {
  if(benchmarks &&  benchmarks[0]){
    return cloneWeights(benchmarks[0].weights);
  } else {
    return cloneWeights(bestweights);
  }
  

}
function addWeightBenchmark(weights,newscore,internal) {
    if(weights && weightBenchmarks &&  (weightBenchmarks[0]||{}).score !== newscore ){
         let sum = sumWeights(weights);
         let range = 10;
         let phi = Math.sqrt(Math.sqrt(2));
         let l = weightBenchmarks.length;
         let sumindex = weightBenchmarks.map(x=>x.sum).indexOf(sum);
         addWeightBenchmark.diff =  addWeightBenchmark.diff || 100;
         if(l>=2 && newscore > weightBenchmarks[l-1].score ) {
            return ;
         }
         if(sumindex<0) {
          weightBenchmarks.push({internal: internal, score: newscore,weights:weights,sum:sum});
         } else {
          weightBenchmarks[sumindex]={internal: internal, score: newscore,weights:weights,sum:sum};
         }

         weightBenchmarks.sort((a,b)=>a.score-b.score);
        
         if(l>2 && weightBenchmarks[l-1]) {
            range = weightBenchmarks[l-1].score - weightBenchmarks[0].score;
         }

         if(l>weightBenchmarkCount && range > 100) {
            weightBenchmarks.length = weightBenchmarkCount;
         }
         
         l = weightBenchmarks.length;

         if(l>2 && weightBenchmarks[l-1]) {
            range = weightBenchmarks[l-1].score - weightBenchmarks[0].score;
         }

         if(l>weightBenchmarkCount/2 && range > 100) {
            weightBenchmarks.length = l-1;
         }

     
         let crunch = 1/1000000;
         debug('addWeightBenchmark',range,crunch,newscore,sum);
         weightBenchmarks = weightBenchmarks.filter((x,i,a)=> ( Math.floor(x.score/crunch) !== Math.floor((a[i-1]||{}).score/crunch) ) );
         weightBenchmarks.sort((a,b)=>a.sum-b.sum);
         weightBenchmarks = weightBenchmarks.filter((x,i,a)=> ( x.sum !== (a[i-1]||{}).sum ) );
         weightBenchmarks.sort((a,b)=>a.score-b.score);

    
    }
}


function randomWeightBenchmark() {
  if(benchmarks && benchmarks.length > 0) {
    return cloneWeights(benchmarks[Math.floor(benchmarks.length*Math.random())].weights);
  } else {
    return cloneWeights(bestweights);
  }
}