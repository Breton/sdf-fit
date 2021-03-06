canvas = document.getElementById('prime');
//ocanvas = new OffscreenCanvas(256,256);
canvassmall = document.getElementById('small');
canvasresult = document.getElementById('result');
canvascheck = document.getElementById('check');
canvasbenchmark = document.getElementById('benchmark');
canvaschecksmall = document.getElementById('checksmall');
canvasbenchmarksmall = document.getElementById('benchmarksmall');
img = document.getElementsByTagName('img')[0];

//octx = ocanvas.getContext('2d');
ctxmain = canvas.getContext('2d');
ctxsmall = canvassmall.getContext('2d');
ctxresult = canvasresult.getContext('2d');
ctxcheck = canvascheck.getContext('2d');
ctxbenchmark = canvasbenchmark.getContext('2d');
ctxchecksmall = canvaschecksmall.getContext('2d');
ctxbenchmarksmall = canvasbenchmarksmall.getContext('2d');
letter = 'g';
onepixel = 0;


weightSuccess = 1;
weightFail = 1;

pixelSuccess = 1;
pixelFail = 1;
oldscore = 0;
gindex = [];
olderscore = 0;

modebias = 0;
weightbias = 0.5;
pixelbias = 0.5;

willAdjustWeights = true;
willMutate = false;
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



time = 0;
duration = 0;
scoreSamples = [];
scoreRate = 10;
scoreRateRate = 0;
letters = '0123456789ABCDEFGHIJKLMNOP';

letters = '1';


letters = '869';

lowestScorePerIndex = [];
evalSize = 32  ;
modelock = false;
scoreDebug = {};
scoreWindowSize = 100;

possiblelength = 0;

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
				// ["rotate",  rotation + (i) * ( 2*( Math.PI )/ (letters.length ))],
				// ["fillRect", 0, 0, 96, 96]
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
					["translate", 128, 128],
					// ["rotate", rotation + (i) * ( 2*( Math.PI )/ (letters.length ))],
					// ["fillRect", 0, 0, 96, 96]
					["fillText", letters[i], 20, 20, 256]
			];
	}
}



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
			ctxmain.globalAlpha = 1;
			ctxmain.fillStyle = "black";
			ctxmain.fillRect(0, 0, 256, 256);
			ctxmain.fillStyle = "white"
			evalCanvas(ctxmain, instructions[i]);
			ctxmain.globalCompositeOperation="screen";
			 

	}
	setDataImg(canvas,'userAction');
}

// primeCanvas();
buttons['load and average']();
// buttons['random pixels']();

ctxmain.globalCompositeOperation = "source-over";
ctxsmall.globalCompositeOperation = "source-over";



/* init lowest scores for scoreInstructionsAndWeights */

 for (let i = 0; i < instructions.length; i++){
		if (lowestScorePerIndex[i]===undefined) {
				let size=16;
				ctxmain.canvas.width=size;
				ctxmain.canvas.height=size;
				ctxmain.save();
				ctxmain.scale(size/256,size/256);

				ctxmain.globalCompositeOperation='source-over';
				ctxmain.fillStyle="black";
				ctxmain.fillRect(0,0,256,256);
				evalCanvas(ctxmain, instructions[i]);
				if(!targetDataObjects[i]){
				 targetDataObjects[i]=ctxmain.getImageData(0,0,16,16);
				}
				 lowestScorePerIndex[i] = score(ctxmain);
				 ctxmain.restore();

					 //debugCanvas(ctx,'lowestscore-'+i);
					//console.log(ctx.canvas.width, "lowest score per index", lowestScorePerIndex[i]);
				 
		 }
 }

{

	let m;
	m = pop(6);

	for(let i=0;i<6**6;i++){
			let r = m.next();
			if(!r.done){
					addInvertKey(...r.value);
			}
	}
	// m = pop(4);

	// for(let i=0;i<4**6;i++){
	//     let r = m.next();
	//     if(!r.done){
	//         addInvertKey(...r.value);
	//     }
	// }
	// m = pop(5);

	// for(let i=0;i<5**6;i++){
	//     let r = m.next();
	//     if(!r.done){
	//         addInvertKey(...r.value);
	//     }
	// }

}




function scoreLoopAsync(name='main',ctx, ctxsmall, weights, instructions, start, letterCounter) {
		ctx.clearRect(0,0,256,256);
		return new Promise(function(res, err) {
				res(scoreInstructionsAndWeights(name,ctx, ctxsmall, weights, instructions, 0, letterCounter,true));
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
			

			// gindex = (gradient.map((x, i) => ( x===gmax || x !== gmin && ((x-gmin)/grange < Math.random()) ? i : 0) )).filter(x => !!x);
      gindex = (gradient.map((x, i) => ( x!== gmin && x-gmin < grange/2) ? i : 0) ).filter(x => !!x);
		
			let onepixelmod = onepixel.mod(gradient.length);

			if(gindex.indexOf(onepixelmod) < 0 ) {
				gindex.push(onepixelmod);
				gindex.sort();
			}
			
			let oindex=gindex.indexOf(onepixelmod);

			//debug(`gindex, ${gindex} oindex: ${oindex}, gmin: ${gmin} gmax: ${gmax} gran: ${grange} gindindex.lneght ${gindex.length}`);
			if (gindex.length > 0) {
					onepixel = gindex[(oindex).mod(gindex.length)];  
			} 
		 
		}
		onepixel += ([-1,1,-16,16,0,0,0,0,0,0,0,0,0,0,0,0])[Math.floor(Math.random()*16)];
		gval = (gradient[onepixel]-gmin)/grange;

		return {pixel:Math.abs(onepixel),value:Math.sqrt(gval)};
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
			if (weightFail > 100 && scoreRateRate >= 0 && scoreRate >= 0 || lastimprovement === 100 ) {
					
					modebias = 1;
					willMutate = flipCoin();
					weightFail = 1;
					//smoothduration=500;
					weightSuccess = 1;
					
					setWeights(lowestWeightBenchmark());
					
					

					//weights=cloneWeights(minimumWeights);
					//oldweights=cloneWeights(minimumWeights)
					//olderweights=cloneWeights(minimumWeights)
			}
			if (pixelFail > 100 && scoreRateRate >= 0 && scoreRate >= 0  || lastimprovement === 100) {
					
					modebias = 0;
					willMutate = flipCoin();
					pixelFail = 0;

					
					minimumScore=10000;
					weightMemo = new Map();
					//smoothduration=500;
					pixelSuccess = 0;
					setDataImg(lowestPixelBenchmark(),'optim lowest');
			}
		}
		//modebias = Math.sin(time * Math.PI / 10000 ) * 0.25 + 0.75;

		willAdjustWeights = 0.5 > modebias;

		

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

		if(willMutate && benchmarks && benchmarks[0] && weightBenchmarks && weightBenchmarks[0] && pixelBenchmarks && pixelBenchmarks[0]) {
			switch (rollDie(4)) {
				case 0:
						weights = randomWeightBenchmark();
						setDataImg(randomPixelBenchmark(),'breed top');
						console.log('random each');       
					break;
				case 1:
					weights = cloneWeights(benchmarks[0].weights);
					setDataImg((benchmarks[0].data),'pair lowest');
					console.log('lowest pair');
					break;
				case 2:
					weights = cloneWeights(randomBenchmark().weights);
					setDataImg(randomBenchmark().data,'random pair top');
					break;
				case 3:
					weights = breedWeightBenchmark();
					setDataImg(breedPixelBenchmark(),'breed top');
					console.log('breed each');    
			}
 
			
		}
		//console.log('weights',weights);
		if (willAdjustWeights) {

				
					let whichweights = 'none';

					switch (updatecount % 6){
						case 0:
							weights = lowestWeightBenchmark();
							whichweights= 'lowest bench'
							
							break;

						case 1:
							if(willMutate) {
								weights = breedWeightBenchmark();
							}
							whichweights= 'breed'
							break;
						case 2: 
							weights = perturbWeights(weights,Math.random()*Math.random());
							whichweights= 'perturb'
							break;
						case 3: 
							weights = randomWeightBenchmark();
							whichweights= 'random benchmark'
							break;
						case 4: 
							weights = cloneWeights(lowestWeightBenchmark());
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
					debug('weightmutation', whichweights);
					 
				if (scoreDebug && scoreDebug.nscores && flipCoin()) {
					newweights = await optimiseWeightsForInstructions(ctxmain, ctxsmall, weights, instructions,needsMostImprovement,1);
				} else {
					newweights = await optimiseWeightsForInstructions(ctxmain, ctxsmall, weights, instructions,(updatecount%instructions.length),1);
				}
		} else {

				let oneframe = needsMostImprovement;

				if(willMutate && pixelBenchmarks && pixelBenchmarks.length > 3) {
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
					let value = onepixel.value*Math.sin(time/3141.59/10);
					onepixel=onepixel.pixel;

					let possible;
					let w = cloneWeights(weights);
					possible = nthPossibleRGB(onepixel,0.01,w);
 
					// if(possible.length === 0) {
					//	possible = nthPossibleRGB(onepixel,0.08,w);

					//	if(possible.length === 0) {
					//		possible = nthPossibleRGB(onepixel,0.1,w);
					//		debugVariable('teir',`0.1 ${possible.length}`);
					  		
					//	} else {
					//		debugVariable('teir',`0.08 ${possible.length}`);
					//	}

					// } else {
					//	debugVariable('teir',`0.01 ${possible.length}`);
					// } 

					console.log('avgw',w,weights,newweights)
					newweights =avgWeights(w,weights,0.99);
					possiblelength = possible.length;
					if(possible.length > 0){
						{
							// let weights = newweights;
							// weights.forEach(function(weight){
							//   let m;
							//   m = popuvw(3,...weight);
							//   for(let i=0;i<3**3;i++){
							//       let r = m.next();
							//       if(!r.done){
							//           addInvertKey(...r.value);
							//       }
							//   }
							// });

						 

						} 
					}
					if(possible.length > 0) {

						let dataobj = ctxsmall.getImageData(0, 0,16, 16);
						let rgb = possible[0];
						console.log("possible",onepixel,...rgb)
						dataobj.data[(onepixel*4+0).mod(dataobj.data.length)]=rgb[0];
						dataobj.data[(onepixel*4+1).mod(dataobj.data.length)]=rgb[1];
						dataobj.data[(onepixel*4+2).mod(dataobj.data.length)]=rgb[2];
						ctxsmall.putImageData(dataobj, 0, 0);

					}

					if(flipCoin()) {
						await optimise8colorPixel(ctxmain, ctxsmall, [weights[oneframe]], [instructions[oneframe]], onepixel,value);
					} else {
						await optimise8colorPixel(ctxmain, ctxsmall, weights, instructions, onepixel,value);
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
		
	
		// newscore = await scoreLoopAsync(ctx, ctxsmall, newweights, instructions, 0, letterCounter);
		//setDataImg(newdata,'checkscore');
		//let checkscore = await scoreLoopAsync(ctx, ctxsmall, newweights, instructions, 0, letterCounter);
	 // let scoremy = sumWeights(newweights);
	//  let weightsum = score(newdata);
	 // let sum = `${newscore.score}-${scoremy}-${weightsum}`;
	 // console.log("adding", newscore);
	 let oldlowest= lowestBenchmark();
	 newscore = await addBenchmark(newdata,newweights,newscore);
	 // console.log('checkscore2',sum,newscore.score);
		
		let newlowest= lowestBenchmark();
		if(oldlowest && newlowest) {
			console.log('improvement',oldlowest.score,newlowest.score)
			if(oldlowest.score > newlowest.score) {
					lastimprovement=0;
			} else {
					lastimprovement++;
			}
		}

		gradient = newscore.bins.map((x,i)=> Math.floor(x*0.5+gradient[i]*0.5) );
		scoreDebug = newscore;
		newscore = newscore.score;
		
		
		
		//console.log('adding benchmark');


		if (newscore < oldscore) {
			// {
			//   let weights = lowestWeightBenchmark();
			//   weights.forEach(function(weight){
			//     let m;

			//     m = popuvw(6,...weight);
			//     for(let i=0;i<6**3;i++){
			//         let r = m.next();
			//         if(!r.done){
			//             addInvertKey(...r.value);
			//         }
			//     }
			//   });

			 

			// }

			
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
				// lastimprovement++;

				globalscore = globalscore * b + newscore * (1-b);
		} 


		if(newscore < globalscore) {
				globalscore = newscore;
				
		}
		
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

		debugWeights(bestweights,letters.split('').map((x,i)=>'b'+x+i ),'green' );
		debugWeights(lowestWeightBenchmark(),letters.split('').map((x,i)=>'m'+x+i ),'red' );
		debugWeights(weights,letters.split('').map((x,i)=>'t'+x+i, 'grey' ));
		debugWeights(newweights,letters.split('').map(x=>'n'+x ) );
		debugTable(weights);
		debugTable(minimumWeights);


		//sctx.drawImage(ocanvas,0,0);
		debug('clear');
		pollution.main
			.filter(x=> typeof window[x] === 'number' || typeof window[x] === 'boolean' || Array.isArray(window[x]) )
			.forEach(function(x){
				debugVariable(x,window[x]);
			});
		
		debug(`
	pixelscores ${ pixelBenchmarks.filter(x=>!x.userAction).map(x=>x.score).filter((x,i,a)=>i===0||i===a.length-1) }
	weightscores ${ weightBenchmarks.filter(x=>!x.userAction).map(x=>x.score).filter((x,i,a)=>i===0||i===a.length-1) }
	combinedscores ${ benchmarks.filter(x=>!x.userAction).map(x=>x.score).filter((x,i,a)=>i===0||i===a.length-1) }
	mscore ${scoreDebug.mscore} nscore ${scoreDebug.nscore} cscore ${scoreDebug.cscore}
	mscores ${scoreDebug.mscores} 
	nscores ${scoreDebug.nscores} 
	cscores ${scoreDebug.cscores}
	lscores ${lowestScorePerIndex}
	`)

		lasttime = time;
		time = new Date() - starttime;
		duration = time - lasttime;
		smoothduration = smoothduration * 0.99 + duration * 0.01;
		setTimeout(main, 10);
}

setTimeout(main, 10);

{ let bestscore=1000; let interval = (setInterval(function () { if(benchmarks && benchmarks[0] && bestscore !== benchmarks[0].score ) { buttons.showbest(); bestscore=benchmarks[0].score }    } ,100)) }


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
	//setTimeout(preview, 200);
	
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