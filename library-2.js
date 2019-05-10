 //library functions

 let debugbuffer = "";
  Number.prototype.mod = function(n) {
      return ((this%n)+n)%n;
  };

 function debug(str, ...rest) {

     if (str === 'clear') {
         document.getElementById('debug').value = debugbuffer;
         debugbuffer = ""
     } else {
         debugbuffer += str + "\n";
         if (rest && rest.length) {
             debugbuffer += '\t:' + rest.join(",") + "\n";
         }

     }

 }


//todo, put scheduler inside makeAsync, so that workerpool wrangling code is not needed.
//find out whether a particular worker is currently active or not so inactive workers can be prioritised. 


 function makeAsync(fn) {
     const workerstring = `
        onmessage = function (event) {
          //console.log("worker event",event);
          let returnValue = (${fn})(...event.data.args);
          let jobid = event.data.jobid;
          postMessage( {returnValue , jobid} );  
        }
    `
     let jobid = 0;
     let callbacks = {};

     const worker = new Worker(URL.createObjectURL(new Blob([workerstring])));
     worker.onmessage = function(event) {
         if (typeof event.data.jobid === 'number') {
             if (typeof callbacks[event.data.jobid] === 'function') {
                 callbacks[event.data.jobid](event.data.returnValue);
                 //console.log("returned ",jobid, typeof event.data.returnValue, typeof callbacks[event.data.jobid]);
                 delete callbacks[event.data.jobid];

             } else {
                 console.error('job callback missing');
             }
         } else {
             console.error("jobid isn't number", jobid);
         }
     }
     return function(...args) {
         jobid += 1;

         return new Promise(function(res, err) {
             callbacks[jobid] = res;
             worker.onerror = err;
             //console.log('calling', jobid, ...(args.map(x=>typeof x)));
             worker.postMessage({
                 args: args,
                 jobid: jobid
             });
         });
     }
 }

 tmax = 0;
 tmin = 100000;


 function scoreKernel(d) {
     let length = d.length / 4;
     let score = 0;
     for (let i = 0; i < d.length; i += 4) {
         score += d[i] * d[i];
         let x = d[i] / 255;
         let g = ((-Math.cos(x * Math.PI * 2) * 0.5 + 0.5) * 255)
             //penalize graytones.
         score += g * g;
     }
     return score / length;
 }

 function thresholdKernel(d, r, g, b) {
     const pi = Math.PI;

     const o = Math.sin(r * pi * 2) * 0.5 + 0.5;
     const s = Math.sin(g * pi * 2) * 0.5 + 0.5;
     const w = Math.sin(b * pi * 2) * 0.5 + 0.5;


     const x = Math.sin((o - s - w) * pi * 2) * 0.5 + 0.5;
     const y = Math.sin((o + 0 - w) * pi * 2) * 0.5 + 0.5;
     const z = Math.sin((o + s - w) * pi * 2) * 0.5 + 0.5;

     for (let i = 0; i < d.length; i += 4) {
         d[i] = d[i + 1] = d[i + 2] = ((Math.min(Math.min(
                 ((d[i + 0] / 255 - 1 + x * 2) / w) * 255,
                 ((d[i + 1] / 255 - 1 + y * 2) / w) * 255),
             ((d[i + 2] / 255 - 1 + z * 2) / w) * 255))) + 127;
     }
     return d;
 }

 robin = 0;
 srobin = 0;
 swpool = [
     makeAsync(scoreKernel),
     makeAsync(scoreKernel),
     makeAsync(scoreKernel),
     makeAsync(scoreKernel),
     makeAsync(scoreKernel),
     makeAsync(scoreKernel),
     makeAsync(scoreKernel),
     makeAsync(scoreKernel)
 ];

 twpool = [
     makeAsync(thresholdKernel),
     makeAsync(thresholdKernel),
     makeAsync(thresholdKernel),
     makeAsync(thresholdKernel)
 ];
 async function thresholdAsync(ctx, r = 1, g = 1, b = 1) {
     let dataobj;
     let thresholdKernel = twpool[robin % twpool.length];
     robin += 1;
     let w = ctx.canvas.width;
     let h = ctx.canvas.height;
     dataobj = ctx.getImageData(0, 0, w, h);
     dataobj = new ImageData(await thresholdKernel(dataobj.data, r, g, b), w, h);
     ctx.putImageData(dataobj, 0, 0);
     return dataobj;
 }

 function scoreAsync(ctx) {
     let dataobj, w, h;
     if (ctx.data !== undefined) {
         dataobj = ctx;
         w = ctx.width;
         h = ctx.height;
     } else {
         dataobj = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
         w = ctx.canvas.width;
         h = ctx.canvas.height;
     }

     srobin += 1;
     let scoreKernel = swpool[srobin % swpool.length];
     return scoreKernel(dataobj.data);
 }

 function threshold(ctx, r = 1, g = 1, b = 1) {
     let dataobj;
     dataobj = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
     const d = dataobj.data;
     const pi = Math.PI;

     const o = Math.sin(r * pi * 2) * 0.5 + 0.5;
     const s = Math.sin(g * pi * 2) * 0.5 + 0.5;
     const w = Math.sin(b * pi * 2) * 0.5 + 0.5;


     const x = Math.sin((o - s - w) * pi * 2) * 0.5 + 0.5;
     const y = Math.sin((o + 0 - w) * pi * 2) * 0.5 + 0.5;
     const z = Math.sin((o + s - w) * pi * 2) * 0.5 + 0.5;

     for (let i = 0; i < d.length; i += 4) {
         d[i] = d[i + 1] = d[i + 2] = ((Math.min(Math.min(
                 ((d[i + 0] / 255 - 1 + x * 2) / w) * 255,
                 ((d[i + 1] / 255 - 1 + y * 2) / w) * 255),
             ((d[i + 2] / 255 - 1 + z * 2) / w) * 255))) + 127;
     }

     ctx.putImageData(dataobj, 0, 0);

     return dataobj;
 }

 function tweenWeights(weights) {
     let newweights = [];
     for (let i = 0; i < weights.length; i++) {
         let lidx = (i + weights.length - 1) % weights.length;
         let ridx = (i + weights.length + 1) % weights.length;
         newweights[i] = [];
         if (i !== 0 && i !== (weights.length - 1)) {
             const s = Math.sin
             const c = Math.cos
             const t = Math.PI * 2


             const r = (weights[i][0]) * t;
             const g = (weights[i][1]) * t;
             const b = (weights[i][2]) * t;
             const rl = (weights[lidx][0]) * t;
             const gl = (weights[lidx][1]) * t;
             const bl = (weights[lidx][2]) * t;
             const rr = (weights[ridx][0]) * t;
             const gr = (weights[ridx][1]) * t;
             const br = (weights[ridx][2]) * t;

             newweights[i][0] = Math.atan2((s(r) * 0.98 + s(rl) * 0.01 + s(rr)) * 0.01, (c(r) * 0.98 + c(rl) * 0.01 + c(rr)) * 0.01) / t;
             newweights[i][1] = Math.atan2((s(g) * 0.98 + s(gl) * 0.01 + s(gr)) * 0.01, (c(g) * 0.98 + c(gl) * 0.01 + c(gr)) * 0.01) / t;
             newweights[i][2] = Math.atan2((s(b) * 0.98 + s(bl) * 0.01 + s(br)) * 0.01, (c(b) * 0.98 + c(bl) * 0.01 + c(br)) * 0.01) / t;

         } else {
             newweights[i][0] = ((weights[i][0] + 1e6) % 1);
             newweights[i][1] = ((weights[i][1] + 1e6) % 1);
             newweights[i][2] = ((weights[i][2] + 1e6) % 1);
         }
     }
     console.log("tweened");
     return newweights;
 }

 function darken(ctx) {
     let dataobj = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
     let d = dataobj.data;
     const amount = 1 - Math.random() / 32;
     for (let i = 0; i < d.length / 4; i += 1) {
         d[i * 4 + 0] *= amount;
         d[i * 4 + 1] *= amount;
         d[i * 4 + 2] *= amount;

         d[i * 4 + 0] += (255 - 255 * amount) / 2;
         d[i * 4 + 1] += (255 - 255 * amount) / 2;
         d[i * 4 + 2] += (255 - 255 * amount) / 2;
     }
     ctx.putImageData(dataobj, 0, 0);
 }

 function enhancePerturb(ctx, recentimprovements, maxri, minri, gradient) {
     let dataobj = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
     let d = dataobj.data;
     for (let i = 0; i < d.length / 4; i += 1) {
         //let degree = ((recentimprovements[i] - minri) / (maxri - minri));

         /*          if(Math.random() < degree) {
                              d[i * 4 + 0] += (gradient[i * 3 + 0] || 0);
                     d[i * 4 + 1] += (gradient[i * 3 + 1] || 0);
                     d[i * 4 + 2] += (gradient[i * 3 + 2] || 0);
                          } */
         if (gradient[i * 3 + 0] !== undefined && gradient[i * 3 + 1] !== undefined && gradient[i * 3 + 2] !== undefined) {
             if (Math.random() > 0) {
                 let f = (x) => (x < 3 && x > -3 ? x * 1 / 0.9 : x)
                 d[i * 4 + 0] += (Math.round(gradient[i * 3 + 0]));
                 d[i * 4 + 1] += (Math.round(gradient[i * 3 + 1]));
                 d[i * 4 + 2] += (Math.round(gradient[i * 3 + 2]));
                 // gradient[i * 3 + 0] = f(gradient[i * 3 + 0]);
                 // gradient[i * 3 + 1] = f(gradient[i * 3 + 1]);
                 // gradient[i * 3 + 2] = f(gradient[i * 3 + 2]);
             } else {
                 gradient[i * 3 + 0] *= 0.9;
                 gradient[i * 3 + 1] *= 0.9;
                 gradient[i * 3 + 2] *= 0.9;
             }
         }

     }
     ctx.putImageData(dataobj, 0, 0);
 }



 function smoothHorizontal(ctx) {
     let dataobj = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
     let dest = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
     let d = dataobj.data;
     let destd = dest.data;
     for (let i = 0; i < d.length; i += 4) {

         let l = [
             d[(i - 1) * 4 + 0] || 0,
             d[(i - 1) * 4 + 1] || 0,
             d[(i - 1) * 4 + 2] || 0,
         ];

         let r = [
             d[(i + 1) * 4 + 0] || 0,
             d[(i + 1) * 4 + 1] || 0,
             d[(i + 1) * 4 + 2] || 0,
         ]

         destd[i * 4 + 0] = l[0] * 0.3 + d[i * 4 + 0] * 0.4 + r[0] * 0.3;
         destd[i * 4 + 1] = l[1] * 0.3 + d[i * 4 + 1] * 0.4 + r[1] * 0.3;
         destd[i * 4 + 2] = l[2] * 0.3 + d[i * 4 + 2] * 0.4 + r[2] * 0.3;




     }
     ctx.putImageData(dest, 0, 0);
 }

 function bigPerturb(ctx, magnitude = 3) {
     let dataobj = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
     let d = dataobj.data;
     for (let i = 0; i < d.length; i += 1) {

         d[i * 4 + 0] += (Math.random() - 0.5) * magnitude;
         d[i * 4 + 1] += (Math.random() - 0.5) * magnitude;
         d[i * 4 + 2] += (Math.random() - 0.5) * magnitude;
     }
     ctx.putImageData(dataobj, 0, 0);
 }

 function perturb(ctx, idx) {
     let dataobj = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
     let d = dataobj.data;

     if (idx === undefined) {
         idx = ((d.length * Math.random()) / 4) | 0;
     }
     let i = (idx % (d.length / 4)) | 0;
     let o1 = d[i * 4 + 0],
         o2 = d[i * 4 + 1],
         o3 = d[i * 4 + 2];

     if (Math.random() > 0.5) {
         d[i * 4 + ((Math.random() * 3) | 0)] += -1;
     } else {
         d[i * 4 + ((Math.random() * 3) | 0)] += +1;
     }
     let n1 = d[i * 4 + 0],
         n2 = d[i * 4 + 1],
         n3 = d[i * 4 + 2];
     ctx.putImageData(dataobj, 0, 0);
     return [(n1 - o1) || 0, (n2 - o2) || 0, (n3 - o3) || 0];
 }

 function perturbWeights(weights, count = 1) {
     let a = [];
     let idx = Math.min(count - 1, Math.random() * weights.length | 0);
     for (let i = 0; i < weights.length; i++) {
         a[i] = [];
         a[i][0] = weights[i][0];
         a[i][1] = weights[i][1];
         a[i][2] = weights[i][2];
         if (i < count) {
             a[i][2] = weights[i][2] + Math.random() * 0.01 - 0.005;
             a[i][0] = weights[i][0] + Math.random() * 0.01 - 0.005;
             a[i][1] = weights[i][1] + Math.random() * 0.01 - 0.005;
         }


     }
     return a
 }

 function subWeights(a, b) {
     return a.map((a, i) => ([a[0] - b[i][0], a[1] - b[i][1], a[2] - b[i][2]]))
 }

 function addWeights(a, b, factor) {
     return a.map((a, i) => ([a[0] + b[i][0] * factor, a[1] + b[i][1] * factor, a[2] + b[i][2] * factor]))
 }

 function randomWeights(a) {
     return a.map((a, i) => ([Math.random(), Math.random(), Math.random()]))
 }

 function rangeWeights(a) {
     return a.map((a, i) => (
         [a[0] < -1 || a[0] > 1 ? Math.random() : a[0],
             a[1] < -1 || a[1] > 1 ? Math.random() : a[1],
             a[2] < -1 || a[2] > 1 ? Math.random() : a[2]
         ]
     ))
 }

 function avgWeights(a, b, factor = 0.5) {
     let afac = 1 - factor;
     return a.map((a, i) => ([a[0] * afac + b[i][0] * factor, a[1] * afac + b[i][1] * factor, a[2] * afac + b[i][2] * factor]))
 }

 function score(ctx) {
     let dataobj, width, height;
     if (ctx.data !== undefined) {
         dataobj = ctx;
         width = ctx.width;
         height = ctx.height;
     } else {
         dataobj = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
         width = ctx.canvas.width;
         height = ctx.canvas.height;
     }
     let score = 0;
     for (let d = dataobj.data, i = 0; i < d.length; i += 4) {
         score += d[i] * d[i];
         let x = d[i] / 255;
         let g = ((-Math.cos(x * Math.PI * 2) * 0.5 + 0.5) * 255)
             //penalize graytones.
         score += g * g;
     }
     return score / (width * height);
 }

 function chunk(array, size) {
     const chunked_arr = [];
     for (let i = 0; i < array.length; i++) {
         const last = chunked_arr[chunked_arr.length - 1];
         if (!last || last.length === size) {
             chunked_arr.push([array[i]]);
         } else {
             last.push(array[i]);
         }
     }
     return chunked_arr;
 }

 samplecache = {}

 async function optimiseWeightsForInstructions(ctx, ctxsmall, weights, instructions, start = 0, count = 1000) {
     let newscore = 0;
     let mscore = 14100;
     let nscore = 14100;
     let lowestScorePerIndex = [];
     let r, g, b;
     let inc = Math.random() * 0.1;
     let f = (x) => (Math.floor(x * 1000) / 1000);
     let minr = 1000000,
         ming = 1000000,
         minb = 1000000;
     let minscore = 1000000;
     let newweights = [];
     ctx.globalAlpha = 1;
     //outer functions:
     // threshold
     // score
     // evalCanvas
     let time = new Date();

     count = Math.floor(Math.min(weights.length, instructions.length, count) - start);

     async function sample(idx, r, g, b) {
         let mscore, nscore;
         let mscorep, nscorep;
         ctx.globalCompositeOperation = 'source-atop';
         ctx.drawImage(canvassmall, 0, 0, 256, 256);
         let tmpdata = await thresholdAsync(ctx, r, g, b);

         mscorep = scoreAsync(tmpdata);
         ctx.globalCompositeOperation = 'difference';
         evalCanvas(ctx, instructions[idx]);
         nscorep = scoreAsync(ctx);
         let scores = await Promise.all([mscorep, nscorep]);
         mscore = (Math.abs(1 - Math.sqrt(scores[0]) / lowestScorePerIndex[idx]));
         nscore = (Math.sqrt((scores[1])) / lowestScorePerIndex[idx]);
         return nscore * nscore + mscore * mscore;

     }

     for (let i = 0; i < instructions.length; i++) {
         r = weights[i][0], g = weights[i][1], b = weights[i][2];
         newweights[i] = [];
         newweights[i][0] = r, newweights[i][1] = g, newweights[i][2] = b;
     }
     //start = Math.floor(Math.random()*(count-1));
     for (let i = start; i < count; i += 1) {

         let tmpdata;


         ctx.globalCompositeOperation = 'source-atop';

         if (!lowestScorePerIndex[i]) {
             evalCanvas(ctx, instructions[i]);
             lowestScorePerIndex[i] = Math.sqrt(score(ctx));
         }
         r = weights[i][0], g = weights[i][1], b = weights[i][2];
         newweights[i] = [];
         newweights[i][0] = r, newweights[i][1] = g, newweights[i][2] = b;
         let rsample, gsample, bsample;

         rsample = 0;
         gsample = 0;
         bsample = 0;




         let counter = 20
         let rinc = inc,
             binc = inc,
             ginc = inc;
         while (rsample === 0 && counter > 0) {
             counter--;
             rinc *= 1.5;
             const samples = await Promise.all([sample(i, r + rinc, g, b), sample(i, r - rinc, g, b)])
             rsample = samples[0] - samples[1];

             ;
         }
         while (gsample === 0 && counter > 0) {
             counter--;
             ginc *= 1.5;
             const samples = await Promise.all([sample(i, r + rinc, g + ginc, b), sample(i, r - rinc, g - ginc, b)])
             gsample = samples[0] - samples[1];

         }
         while (bsample === 0 && counter > 0) {
             counter--;
             binc *= 1.5;
             const samples = await Promise.all([sample(i, r + rinc, g + ginc, b + binc), sample(i, r - rinc, g - ginc, b - binc)]);

             bsample = samples[0] - samples[1];

         }
         let rslope = Math.sign(rsample);
         let gslope = Math.sign(gsample);
         let bslope = Math.sign(bsample);




         // slope is rise over run (y/x)
         // the line equation is 
         // y = xm + c
         // we want to use m to adjust x to minimize y.
         let scale = 1;

         minscore = await sample(i, r, g, b);
         let diff = await sample(i, r - rslope * rinc, g - gslope * ginc, b - bslope * binc) - minscore;

         while (diff > 0 && counter > 0) {
             counter--;
             let samples = await Promise.all([
                 sample(i, r - rslope * rinc, g - gslope * ginc, b - bslope * binc),
                 sample(i, r + rslope * rinc, g + gslope * ginc, b + bslope * binc)
             ]);
             if (samples[1] - minscore < 0) {
                 rslope = -rslope;
                 gslope = -gslope;
                 bslope = -gslope;
                 diff = samples[1] - minscore;
             } else {
                 diff = samples[0] - minscore;
             }
            // debug("swapslope", counter, diff);

             if (diff > 0) {
                 r += Math.random() * 5 - 2.5;
                 g += Math.random() * 5 - 2.5;
                 b += Math.random() * 5 - 2.5;
             }
         }
         debug("samples", i, counter, rinc, ginc, binc, rsample, gsample, bsample, rslope, gslope, bslope, diff);

         while (diff <= 0 && counter > 0) {
             counter--;

             let score = await sample(i, r - rslope * rinc, g - gslope * ginc, b - bslope * binc);


             diff = score - minscore;

             if (diff <= 0) {
                 r = r - rslope * rinc;
                 g = g - gslope * ginc;
                 b = b - bslope * binc;
                 debug(`dscore, c ${counter} i ${i}, rgb ${[f(r),f(g),f(b)]} slope ${[f(rslope*inc), f(gslope*inc), f(bslope*inc)]} score ${f(score)}, minscore ${f(minscore)}, diff  ${f(score - minscore)}`)
                 minscore = score;
                 inc *= 1.1;
                 rinc *= 1.5;
                 ginc *= 1.5;
                 binc *= 1.5;
                 scale *= 0.5;
             }

         }
         diff = -1;
         rinc *= .5;
         ginc *= .5;
         binc *= .5;

         while (diff < 0 && counter > 0) {
             counter--;

             let score = await sample(i, r + rslope * rinc, g + gslope * ginc, b + bslope * binc);


             diff = score - await sample(i, r, g, b);
             if (diff <= 0) {
                 r = r + rslope * inc;
                 g = g + gslope * inc;
                 b = b + bslope * inc;
                 debug(`iscore, c ${counter} i ${i}, rgb ${[f(r),f(g),f(b)]} slope ${[f(rslope*inc), f(gslope*inc), f(bslope*inc)]} score ${f(score)}, minscore ${f(minscore)}, diff  ${f(score - minscore)}`)
                 minscore = score;
                 inc *= 0.5;
                 rinc *= 0.5;
                 ginc *= 0.5;
                 binc *= 0.5;
             }

         }
         if (counter > 0) {
             newweights[i][0] = r, newweights[i][1] = g, newweights[i][2] = b;
         }

     }
     return newweights;
 }


 async function optimisePixelForWeights(ctx, ctxsmall, weights, instructions, idx) {
     let newscore = 0;
     let mscore = 14100;
     let nscore = 14100;
     let lowestScorePerIndex = [];
     let r, g, b;
     let inc = 1;
     let minr = 1000000,
         ming = 1000000,
         minb = 1000000;
     let f = (x) => (Math.floor(x * 1000) / 1000);
     let minscore = 1000000;
     let newweights = [];
     ctx.globalAlpha = 1;
     let dataobj = ctxsmall.getImageData(0, 0, ctxsmall.canvas.width, ctxsmall.canvas.height);
     let d = dataobj.data;

     if (idx === undefined) {
         idx = ((d.length * Math.random()) / 4) | 0;
     }
     let i = (idx % (d.length / 4)) | 0;
     let time = new Date();

     async function sample(pixelidx, r, g, b) {
         d[pixelidx * 4 + 0] = 255*(1 - Math.abs((r/255).mod(2) - 1));
         d[pixelidx * 4 + 1] = 255*(1 - Math.abs((g/255).mod(2) - 1));
         d[pixelidx * 4 + 2] = 255*(1 - Math.abs((b/255).mod(2) - 1));

         ctxsmall.putImageData(dataobj, 0, 0);
         return 1000 * (await scoreInstructionsAndWeights(ctx, ctxsmall, weights, instructions));
     }

     r = d[i * 4 + 0], g = d[i * 4 + 1], b = d[i * 4 + 2];
     let or = d[i * 4 + 0],
         og = d[i * 4 + 1],
         ob = d[i * 4 + 2];

         
     let rsample = ((await sample(i, r + inc, g, b) - await sample(i, r - inc, g, b)));
     let gsample = ((await sample(i, r, g + inc, b) - await sample(i, r, g - inc, b)));
     let bsample = ((await sample(i, r, g, b + inc) - await sample(i, r, g, b - inc)));

     let counter = 100
     let rinc = inc,
         binc = inc,
         ginc = inc;

     while (rsample === 0 && counter > 0) {
         counter--;
         rinc *= 1.5;
         rsample = (await Promise.all([sample(i, r + rinc, g, b), sample(i, r - rinc, g, b)])).reduce((a, b) => (a - b));
     }
     while (gsample === 0 && counter > 0) {
         counter--;
         ginc *= 1.5;
         gsample = (await Promise.all([sample(i, r + rinc, g + ginc, b), sample(i, r - rinc, g - ginc, b)])).reduce((a, b) => (a - b));
     }
     while (bsample === 0 && counter > 0) {
         counter--;
         binc *= 1.5;
         bsample = (await Promise.all([sample(i, r + rinc, g + ginc, b + binc), sample(i, r - rinc, g - ginc, b - binc)])).reduce((a, b) => (a - b));
     }
     let rslope = Math.sign(rsample);
     let gslope = Math.sign(gsample);
     let bslope = Math.sign(bsample);



     // slope is rise over run (y/x)
     // the line equation is 
     // y = xm + c
     // we want to use m to adjust x to minimize y.
     let scale = 1;

     minscore = await sample(i, r, g, b);
     let diff = await sample(i, r - rslope * rinc, g - gslope * ginc, b - bslope * binc) - minscore;

     while (diff > 0 && counter > 0) {
         counter--;
         let samples = await Promise.all([
             sample(i, r - rslope * rinc, g - gslope * ginc, b - bslope * binc),
             sample(i, r + rslope * rinc, g + gslope * ginc, b + bslope * binc)
         ]);
         if (samples[1] - minscore < 0) {
             rslope = -rslope;
             gslope = -gslope;
             bslope = -gslope;
             diff = samples[1] - minscore;
         } else {
             diff = samples[0] - minscore;
         }
         //debug("swapslope", counter, diff);

         if (diff > 0) {
             r += Math.random() * 5 - 2.5;
             g += Math.random() * 5 - 2.5;
             b += Math.random() * 5 - 2.5;
         }
     }
     debug("pxsamples", i, counter, rinc, ginc, binc, rsample, gsample, bsample, rslope, gslope, bslope, diff);

     while (diff <= 0 && counter > 0) {
         counter--;

         let score = await sample(i, r - rslope * rinc, g - gslope * ginc, b - bslope * binc);


         diff = score - minscore;

         if (diff <= 0) {
             r = r - rslope * rinc;
             g = g - gslope * ginc;
             b = b - bslope * binc;
             debug(`pxdscore, c ${counter} i ${i}, rgb ${[f(r),f(g),f(b)]} slope ${[f(rslope*inc), f(gslope*inc), f(bslope*inc)]} score ${f(score)}, minscore ${f(minscore)}, diff  ${f(score - minscore)}`)
             minscore = score;
             inc *= 1.1;
             rinc *= 1.5;
             ginc *= 1.5;
             binc *= 1.5;
             scale *= 0.5;
         }

     }
     diff = -1;
     rinc *= .5;
     ginc *= .5;
     binc *= .5;

     while (diff < 0 && counter > 0) {
         counter--;

         let score = await sample(i, r + rslope * rinc, g + gslope * ginc, b + bslope * binc);


         diff = score - await sample(i, r, g, b);
         if (diff <= 0) {
             r = r + rslope * inc;
             g = g + gslope * inc;
             b = b + bslope * inc;
             debug(`pxiscore, c ${counter} i ${i}, rgb ${[f(r),f(g),f(b)]} slope ${[f(rslope*inc), f(gslope*inc), f(bslope*inc)]} score ${f(score)}, minscore ${f(minscore)}, diff  ${f(score - minscore)}`)
             minscore = score;
             inc *= 0.5;
             rinc *= 0.5;
             ginc *= 0.5;
             binc *= 0.5;
         }

     }
     if (counter > 0) {
         minscore = await sample(i, r * 0.5 + or * 0.5, g * 0.5 + og * 0.5, b * 0.5 + ob * 0.5);
     } else {
         minscore = await sample(i, or, og, ob);
     }


     debug("new", minscore);
     return minscore;
 }
 //weights correspond to instructions.
 //we are evaluating the fitness of ctxsmall combined with threshold and weights
 //for matching the shapes in instructions.
 // ctx is used as scratch for doing the scoring.
 lowestScorePerIndex = [];
 let targetDataObjects = [];
 /*
 async function scoreInstructionsAndWeights(ctx, ctxsmall, weights, instructions, start = 0, count = 1000) {
     let newscore = 0;
     let mscore, nscore;
     let mscorep, nscorep;
     let tmpdata;
     let mscoreps = [];
     let nscoreps = [];
     //outer functions:
     // threshold
     // score
     // evalCanvas

     count = Math.min(weights.length, instructions.length, count);

     for (let i = start; i < count; i += 1) {
         ctx.globalCompositeOperation = 'source-atop';
         ctx.globalAlpha = 1;
         if (!lowestScorePerIndex[i]) {
             evalCanvas(ctx, instructions[i]);
             lowestScorePerIndex[i] = Math.sqrt(score(ctx));
         }
     }
     for (let i = start; i < count; i += 1) {
         ctx.globalAlpha = 1;
         ctx.globalCompositeOperation = 'source-atop';
         ctx.drawImage(canvassmall, 0, 0, 256, 256);

         tmpdata = await thresholdAsync(ctx, weights[i][0], weights[i][1], weights[i][2]);
         mscorep = scoreAsync(tmpdata);
         ctx.globalCompositeOperation = 'difference';
         evalCanvas(ctx, instructions[idx]);
         nscorep = scoreAsync(ctx);
         nscoreps.push(nscorep);
         mscoreps.push(mscorep);

     }

     let mscores = await Promise.all(mscoreps);
     let nscores = await Promise.all(nscoreps);

     mscore = mscores.map((x, idx) => (Math.abs(1 - Math.sqrt(x) / lowestScorePerIndex[idx]))).map(x => x * x).reduce((a, b) => a + b);
     nscore = nscores.map((x, idx) => (Math.sqrt((x)) / lowestScorePerIndex[idx])).map(x => x * x).reduce((a, b) => a + b);
     newscore = mscore + nscore;
     return (Math.sqrt(newscore)) * 1000 / count;
 }
 */

  async function scoreInstructionsAndWeights(ctx, ctxsmall, weights, instructions, start = 0, count = 1000) {
    let newscore = 0;
    let mscore = 14100;
    let nscore = 14100;
    let mscores = [];
    let nscores = [];
    let mscoreps = [];
    let nscoreps = [];
    //outer functions:
    // threshold
    // score
    // evalCanvas

    count = Math.min(weights.length, instructions.length, count);

    for (let i = start; i < count; i += 1) {
      let scoreidx = i;
      let tmpdata;
      ctx.globalCompositeOperation = 'source-atop';
      ctx.globalAlpha = 1;
      if (!lowestScorePerIndex[scoreidx]) {
        evalCanvas(ctx, instructions[i]);


        lowestScorePerIndex[scoreidx] = Math.sqrt(score(ctx));
      }
      ctx.globalCompositeOperation = 'source-atop';
      ctx.globalAlpha = 1;
      ctx.drawImage(canvassmall, 0, 0, 256, 256);         

      tmpdata = await thresholdAsync(ctx, weights[i][0], weights[i][1], weights[i][2]);
      //mscore = score(tmpdata);
      mscorep = scoreAsync(tmpdata);
      mscoreps.push(mscorep);

      //mscores.push(mscore);
      //mscore = (Math.abs(1 - Math.sqrt(mscore) / lowestScorePerIndex[scoreidx]));

      ctx.globalCompositeOperation = 'difference';
      evalCanvas(ctx, instructions[i]);
      //nscore = score(ctx);
      //nscores.push(nscore)
      nscorep = scoreAsync(ctx);
      nscoreps.push(nscorep);

      //nscore = (Math.sqrt((nscore)) / lowestScorePerIndex[scoreidx]);
      //newscore += nscore * nscore + mscore * mscore;
    }
    
    mscores = await Promise.all(mscoreps);
    nscores = await Promise.all(nscoreps);

    mscore = mscores.map((x, idx) => (Math.abs(1 - Math.sqrt(x) / lowestScorePerIndex[idx]))).map(x => x * x).reduce((a, b) => a + b);
    nscore = nscores.map((x, idx) => (Math.sqrt((x)) / lowestScorePerIndex[idx])).map(x => x * x).reduce((a, b) => a + b);
    //console.log('scoring instructions and weights', newscore, mscore, nscore, nscore+mscore,nscore+mscore-newscore);
    return (Math.sqrt(nscore+mscore)) * 1000 / count;
  }

 function evalCanvas(ctx, instructions, variables) {
     ctx.save();
     instructions.forEach(function(o, i) {
         switch (typeof ctx[o[0]]) {
             case 'function':
                 //console.log('function', o[0], ctx[o[0]],o.slice(1));
                 ctx[o[0]](...o.slice(1));
                 break;
             default:
                 //console.log('default',o[0],ctx[o[0]])
                 ctx[o[0]] = o[1];
                 break;
         }
     });
     ctx.restore();
 }



 /* return r g b and counter. */
 async function findSmaller3Vector(idx, r, g, b, sample) {
     let rsample, gsample, bsample;

     rsample = 0;
     gsample = 0;
     bsample = 0;



     console.log('begin optimise weight');

     let counter = 20
     let rinc = inc,
         binc = inc,
         ginc = inc;
     while (rsample === 0 && counter > 0) {
         counter--;
         rinc *= 1.5;
         const samples = await Promise.all([sample(i, r + rinc, g, b), sample(i, r - rinc, g, b)])
         rsample = samples[0] - samples[1];

         ;
     }
     while (gsample === 0 && counter > 0) {
         counter--;
         ginc *= 1.5;
         const samples = await Promise.all([sample(i, r + rinc, g + ginc, b), sample(i, r - rinc, g - ginc, b)])
         gsample = samples[0] - samples[1];

     }
     while (bsample === 0 && counter > 0) {
         counter--;
         binc *= 1.5;
         const samples = await Promise.all([sample(i, r + rinc, g + ginc, b + binc), sample(i, r - rinc, g - ginc, b - binc)]);

         bsample = samples[0] - samples[1];

     }
     let rslope = Math.sign(rsample);
     let gslope = Math.sign(gsample);
     let bslope = Math.sign(bsample);




     // slope is rise over run (y/x)
     // the line equation is 
     // y = xm + c
     // we want to use m to adjust x to minimize y.
     let scale = 1;

     minscore = await sample(i, r, g, b);
     let diff = await sample(i, r - rslope * rinc, g - gslope * ginc, b - bslope * binc) - minscore;

     while (diff > 0 && counter > 0) {
         counter--;
         let samples = await Promise.all([
             sample(i, r - rslope * rinc, g - gslope * ginc, b - bslope * binc),
             sample(i, r + rslope * rinc, g + gslope * ginc, b + bslope * binc)
         ]);
         if (samples[1] - minscore < 0) {
             rslope = -rslope;
             gslope = -gslope;
             bslope = -gslope;
             diff = samples[1] - minscore;
         } else {
             diff = samples[0] - minscore;
         }
         debug("swapslope", counter, diff);

         if (diff > 0) {
             r += Math.random() * 5 - 2.5;
             g += Math.random() * 5 - 2.5;
             b += Math.random() * 5 - 2.5;
         }
     }
     debug("samples", i, counter, rinc, ginc, binc, rsample, gsample, bsample, rslope, gslope, bslope, diff);

     while (diff <= 0 && counter > 0) {
         counter--;

         let score = await sample(i, r - rslope * rinc, g - gslope * ginc, b - bslope * binc);


         diff = score - minscore;

         if (diff <= 0) {
             r = r - rslope * rinc;
             g = g - gslope * ginc;
             b = b - bslope * binc;
             debug(`dscore, c ${counter} i ${i}, rgb ${[f(r),f(g),f(b)]} slope ${[f(rslope*inc), f(gslope*inc), f(bslope*inc)]} score ${f(score)}, minscore ${f(minscore)}, diff  ${f(score - minscore)}`)
             minscore = score;
             inc *= 1.1;
             rinc *= 1.5;
             ginc *= 1.5;
             binc *= 1.5;
             scale *= 0.5;
         }

     }
     diff = -1;
     rinc *= .5;
     ginc *= .5;
     binc *= .5;

     while (diff < 0 && counter > 0) {
         counter--;

         let score = await sample(i, r + rslope * rinc, g + gslope * ginc, b + bslope * binc);


         diff = score - await sample(i, r, g, b);
         if (diff <= 0) {
             r = r + rslope * inc;
             g = g + gslope * inc;
             b = b + bslope * inc;
             debug(`iscore, c ${counter} i ${i}, rgb ${[f(r),f(g),f(b)]} slope ${[f(rslope*inc), f(gslope*inc), f(bslope*inc)]} score ${f(score)}, minscore ${f(minscore)}, diff  ${f(score - minscore)}`)
             minscore = score;
             inc *= 0.5;
             rinc *= 0.5;
             ginc *= 0.5;
             binc *= 0.5;
         }

     }
 }


 setTimeout(function() {
     div = document.createElement('div');
     div.style.position = 'absolute'
     div.style.width = '16px'
     div.style.height = '16px'
     div.style.backgroundColor = 'red'
     div.style.left = canvassmall.offsetLeft + "px"
     div.style.top = canvassmall.offsetTop + "px"

     document.body.appendChild(div);

     interval = setInterval(function() {
         div.style.left = ((onepixel % 16) * 16 + canvassmall.offsetLeft) + 'px';
         div.style.top = ((((onepixel / 16) | 0) % 16) * 16 + canvassmall.offsetTop) + 'px';
     }, 10);


 }, 1000);