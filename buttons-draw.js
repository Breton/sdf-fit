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
            'blur': function blurButton() {



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
          ctxs.small.putImageData(data,0,0);
          //ctxsmall.putImageData(bestdata, 0, 0);
      },

  };

  Object.keys(buttons).forEach(name => makeButton(name, buttons[name]));
  sortButtons(makeButton.counts||{},'buttons');

