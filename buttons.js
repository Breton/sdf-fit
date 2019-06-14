  //buttons

  function makeNameSafe(name) {
      return name.replace(/[^a-z0-9]/g, function(s) {
          var c = s.charCodeAt(0);
          if (c == 32) return '-';
          if (c >= 65 && c <= 90) return '_' + s.toLowerCase();
          return '__' + ('000' + c.toString(16)).slice(-4);
      });
  }

  function makeButton(name, func) {
      let container = document.getElementById("buttons");
      let newel = document.createElement('button');
      newel.setAttribute('id', makeNameSafe(name));
      newel.textContent = name;
      newel.addEventListener('click', func, false);
      newel.className="btn btn-primary";
      
      container.appendChild(newel);



  }
  buttons = {
      'clear memory': () => Object.keys(localStorage).forEach(x => delete localStorage[x]),
      'random weights': function randomweights() {
        let w = [];
          for (let i = 0; i < weights.length; i++) {
              w[i] = [r(), r(), r()];
          }
          setWeights(w);
          
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
              
              bestdata.data[i + 2] = 0;


          }
          ctxsmall.putImageData(bestdata, 0, 0);

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
          ctxsmall.putImageData(d, 0, 0);
          olddata = bestdata = d;
      },
      'toggle mode': function () {
        if(modebias > 0.5) {
          modebias = 0;
          minimumWeights=cloneWeights(weights);
          minimumScore=10000;
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
          ctxsmall.putImageData(bestdata, 0, 0);
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
      'kill blue': function blurButton() {
          olddata = bestdata = ctxsmall.getImageData(0, 0, canvassmall.width, canvassmall.height);
          for (let i = 0; i < bestdata.data.length; i += 4) {
              let l = bestdata.data.length
              bestdata.data[i + 2] = 0.5*255;
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
      ctxsmall.putImageData(d, 0, 0);
      bestdata = d;
  }

  function loadWeights() {
      weights = JSON.parse(localStorage.getItem('weights'));
      newweights = JSON.parse(localStorage.getItem('weights'));
  }