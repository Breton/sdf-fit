  //buttons

  function makeNameSafe(name) {
      return name.replace(/[^a-z0-9]/g, function(s) {
          var c = s.charCodeAt(0);
          if (c == 32) return '-';
          if (c >= 65 && c <= 90) return '_' + s.toLowerCase();
          return '__' + ('000' + c.toString(16)).slice(-4);
      });
  }

  function makeButton(name, func,containerId='buttons') {
      let container = document.getElementById(containerId);
      let newel = document.createElement('button');
      //track button presses
      let key = 'btn-count-'+makeNameSafe(name);
      let count = +localStorage.getItem(key);
      makeButton.counts=makeButton.counts||{};
      makeButton.counts[makeNameSafe(name)]=count||0;

      newel.setAttribute('id', makeNameSafe(name));
      newel.textContent = name;


      newel.addEventListener('click', func, false);
      newel.addEventListener('click', function () {
        let count = +localStorage.getItem(key);
        localStorage.setItem(key, count+1);
        makeButton.counts[makeNameSafe(name)]=count+1;
        
      }, false);
      newel.className="btn btn-primary";   
      container.appendChild(newel);



  }
  function sortButtons(counts,containerId) {
    let container = document.getElementById(containerId)
    let buttonorder = Object.keys(counts).sort((a,b)=> counts[b]-counts[a] );
    buttonorder.forEach(function (key){
      let id = '#'+key;
      let el = container.querySelector(id);
      container.appendChild(el);
    });
  }
  buttons = {
      'clear memory': () => Object.keys(localStorage).forEach(x => { if( x[0]==='a' ) { delete localStorage[x]; }} ),
      'random weights': function randomweights() {
        let w = [];
          for (let i = 0; i < weights.length; i++) {
              w[i] = [r(), r(), r()];
          }
          setWeights(w);
          
      },
      'tween weights': function () {
        setWeights(distributeWeights(tweenWeights(weights,0.005),0.1,0.5));
      },
      'mode lock': function () {
        modelock = !modelock;
        this.style.backgroundColor= modelock ? 'red' : 'blue';
      },
      'save data point': function saveDataPoint() {
          let counter = +localStorage.getItem('acounter');
          let index =  +localStorage.getItem('aindex');
          let max = 10;
          if (!counter) {
              counter = 0;
          }
          if(typeof index === 'undefined' || index >= max) {
            index=0;
          }
          index += 1;

          if(counter < max) {
            counter = 1 + (+counter);
            
          } 
          console.log(index,counter);

          localStorage.setItem('acounter', counter);
          localStorage.setItem('aindex', index);
          saveCtx('aavg_' + (index));

      },
      'kill blue': function(){

          olddata = bestdata = ctxsmall.getImageData(0, 0, canvassmall.width, canvassmall.height);
          for (let i = 0; i < bestdata.data.length; i += 4) {
              
              bestdata.data[i + 2] = 127;


          }
          
          setDataImg(bestdata,'userAction');

      },
      'prime canvas': function () {
        setDataImg(primeCanvas(),'userAction');
      },
      'load and average': function loadAndAverage() {
          let counter = +localStorage.getItem('acounter');
          let index =  localStorage.getItem('aindex');
          let c = [];
          let avg = [];

          for (let i = 0; i < (counter); i++) {
              let item = (JSON.parse(localStorage.getItem('aavg_' + (i + 1))));
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

          avg = avg.map((x) => x / counter);
          //console.log('avg', counter, avg);
          //    console.log(avg);
          let d = new ImageData(new Uint8ClampedArray(avg, 16, 16), 16, 16);
          setDataImg(d,'userAction');
          
          
      },
      'toggle mode': function () {
        if(modebias > 0.5) {
          modebias = 0;
          minimumWeights=cloneWeights(weights);
          minimumScore=globalscore;
          weightMemo = new Map();
        } else {
          modebias = 1;
          setWeights(minimumWeights);
        }
      },
      'reset instructions': function () {
        resetInstructions();
      },
      'sdplaritm': function() {
        buttons['save data point']();
        buttons['load and average']();
        buttons['reset instructions']();
        buttons['toggle mode']();

      },
      'random pixels': function randomize() {


          globalscore = 100000000;
          olddata = bestdata = ctxsmall.getImageData(0, 0, canvassmall.width, canvassmall.height);

          for (let i = 0; i < bestdata.data.length; i += 4) {
              bestdata.data[i + 0] = Math.random() * 255
              bestdata.data[i + 1] = Math.random() * 255
              bestdata.data[i + 2] = Math.random() * 255

          }
          setDataImg(bestdata,'userAction');
          
      },
      'flatten': function () {
        flatten(ctxsmall);
      },
      'blur': function blurButton() {



          olddata = bestdata = ctxsmall.getImageData(0, 0, canvassmall.width, canvassmall.height);

          for (let i = 0; i < bestdata.data.length; i += 4) {
              let l = bestdata.data.length
              bestdata.data[i + 0] = bestdata.data[(i + 0).mod(l)] * 0.5 + bestdata.data[(i + 4 + 0).mod(l)] * 0.25 + bestdata.data[(i - 4 + 0).mod(l)] * 0.25
              bestdata.data[i + 1] = bestdata.data[(i + 1).mod(l)] * 0.5 + bestdata.data[(i + 4 + 1).mod(l)] * 0.25 + bestdata.data[(i - 4 + 1).mod(l)] * 0.25
              bestdata.data[i + 2] = bestdata.data[(i + 2).mod(l)] * 0.5 + bestdata.data[(i + 4 + 2).mod(l)] * 0.25 + bestdata.data[(i - 4 + 2).mod(l)] * 0.25

              bestdata.data[i + 0] = bestdata.data[(i + 0).mod(l)] * 0.5 + bestdata.data[(i + 4 * 16 + 0).mod(l)] * 0.25 + bestdata.data[(i - 4 * 16 + 0).mod(l)] * 0.25
              bestdata.data[i + 1] = bestdata.data[(i + 1).mod(l)] * 0.5 + bestdata.data[(i + 4 * 16 + 1).mod(l)] * 0.25 + bestdata.data[(i - 4 * 16 + 1).mod(l)] * 0.25
              bestdata.data[i + 2] = bestdata.data[(i + 2).mod(l)] * 0.5 + bestdata.data[(i + 4 * 16 + 2).mod(l)] * 0.25 + bestdata.data[(i - 4 * 16 + 2).mod(l)] * 0.25

          }
          ctxsmall.putImageData(bestdata, 0, 0);
      },
   


      save: function save() {
          saveCtx();
          saveWeights();

      },

      load: function load() {
          loadCtx();
          loadWeights();

      }

  };

  Object.keys(buttons).forEach(name => makeButton(name, buttons[name]));
  sortButtons(makeButton.counts,'buttons');





  //take a function that has a vector as input
  //and a scalar as output
  //then find the minimum scalar for that function

  function binarySearch(scoreVectorFunc, ary = 1, min = -1, max = 1) {
      let maxvec = new Array(ary);
      let minvec = new Array(ary);
      //need to keep a min vec and a max vec
      //loop through each item one at a time. 

      maxvec.fill(max);

      if (typeof scoreVectorFunc === "function") {


      }
  }







  function saveCtx(key = 'ctxsmalldata') {
      let imgdata = ctxsmall.getImageData(0, 0, 16, 16);
      imgdata.data = Array.from(imgdata.data);
      localStorage.setItem(key, JSON.stringify(imgdata));
  }

  function saveWeights() {
      localStorage.setItem('weights', JSON.stringify(weights))
  }

  function loadCtx() {
      let c = (JSON.parse(localStorage.getItem('ctxsmalldata')));
      c.data.length = 16 * 16 * 4;
      let d = new ImageData(new Uint8ClampedArray(Array.from(c.data), 16, 16), 16, 16);

      setDataImg(d,'userAction');
      //ctxsmall.putImageData(d, 0, 0);
  }

  function loadWeights() {
      setWeights(JSON.parse(localStorage.getItem('weights')));
      
  }