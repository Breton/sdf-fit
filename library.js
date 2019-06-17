weightscores = [];
// Library local variables
let lowestScorePerIndex = [];
let scorecount = 0;
let samplecount = 0;
let maxpixelcounter = 50;
 //library functions

 let debugbuffer = "";
  Number.prototype.mod = function(n) {
      return ((this%n)+n)%n;
  };


 // median = max(min(a,b), min(max(a,b),c));
 function debug(str, ...rest) {

     if (str === 'clear') {
         document.getElementById('debug').value = debugbuffer;
         debugbuffer = ""
     } else if (str === 'log') {
        console.log(debugbuffer);
     } else {
         debugbuffer += str + "\n";
         if (rest && rest.length) {
             debugbuffer += '\t:' + rest.join(",") + "\n";
         }

     }

 }
 function debugTable (table,columns) {

 }
 function debugCanvas(ctx,id){
    id=id.trim().replace(' ','');
    let el = document.getElementById('img-'+id.trim());
    if(!el) {
        let p = document.getElementById('debugImages');

        el = document.createElement("IMG");
        el.setAttribute("id", "img-"+id.trim());
        p.appendChild(el);
    }
    ctx.canvas.toBlob((x)=>(el.setAttribute('src', URL.createObjectURL(x) )));
     

 }
 function debugWeights(weights,letters,color='blue') {
    let el = document.getElementById('weights');
    let elmap = {}
    if(typeof letters === "string") {
        letters=letters.split('');

    }
    if(typeof letters === "undefined") {
        letters = new Array(weights.length);
        letters.fill('0');
        letters = letters.map((x,i)=>'d'+i);

    }
    let elselector = letters.map(x=>'#n-'+x).join(',')
    let weightels = document.querySelectorAll(elselector);

    
    //create elements that don't exist yet.
    if(weightels.length<letters.length) {
        for(let i = 0 ; i < weights.length; i++) {
            let wel = document.getElementById('n-'+letters[i]);
            
            if(!wel){

                let span = document.createElement('SPAN');
                span.textContent=letters[i];
                span.setAttribute('id', 'n-'+letters[i]);
                span.className='weight';
                span.style.backgroundColor=color;
                el.appendChild(span);
            }

        }
    }



    for (let i = 0; i < letters.length ;i++) {
        let wel = document.getElementById('n-'+letters[i]);
        //console.log('weightsdebug',weights);
        if(wel  && weights.length  ) {
            wel.style.left = (weights[i][0]*256) + 'px';
            wel.style.top = (weights[i][1]*256) + 'px';
            wel.style.width = (weights[i][2]*240+10) + 'px';
        }
    }
 }
 function debug2D(id,array,width,height) {
    id=id.trim().replace(' ','');
    let el = document.getElementById('img-'+id.trim());
    if(!el) {
        let p = document.getElementById('debugImages');
        el = document.createElement("CANVAS");
        el.setAttribute("id", "img-"+id.trim());
        p.appendChild(el);
        el.width=width;
        el.height=height;
    }
    //normalise array; 
    array = ((max,min) => (
      array.map(x=> (x-min)/(max-min) )
    ))(
      (array.reduce((a, b) => Math.max(a,b) )),
      (array.reduce((a, b) => Math.min(a,b) ))
    );

    let ctx = el.getContext('2d');
    let d = ctx.getImageData(0,0,width,height);
    for(let i = 0; i<array.length;i++) {
        d.data[i*4+0]=array[i]*255;
        d.data[i*4+1]=array[i]*255;
        d.data[i*4+2]=array[i]*255;
        d.data[i*4+3]=255;
    }
    ctx.putImageData(d,0,0);
 }
function setWeights(w) {
    if(w.length < letters.length) {
        let a = [];
        for(let i = 0; i < letters.length; i++) {
            a[i] = w[i%w.length];
        }
        w = a;
    }
    if(w.length > letters.length) {
        w.length = letters.length;
    }
    if(w.length && w[0].length) {
      weights=Array.from(w.map((x)=>Array.from(x)));
      bestweights=Array.from(w.map((x)=>Array.from(x)));
      newweights=Array.from(w.map((x)=>Array.from(x)));
      oldweights=Array.from(w.map((x)=>Array.from(x)));
      olderweights=Array.from(w.map((x)=>Array.from(x)));

       
    }
}
function cloneWeights(w) {
    if(w.length > 0 && w[0] && w[0].length) {
        let c = Array.from(w.map((x)=>Array.from(x)));
        
        return c;
    } else {
        return w
    }
}
function indexOfMax(arr) {

    if (arr.length === 0) {
        return -1;
    }

    var max = arr[0];
    var maxIndex = 0;

    for (var i = 1; i < arr.length; i++) {
        if (arr[i] > max) {
            maxIndex = i;
            max = arr[i];
        }
    }

    return maxIndex;
}
function indexOfMin(arr) {
    if (arr.length === 0) {
        return -1;
    }

    var min = arr[0];
    var minIndex = 0;

    for (var i = 1; i < arr.length; i++) {
        if (arr[i] < min) {
            minIndex = i;
            min = arr[i];
        }
    }

    return minIndex;
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


function scoreKernel(d,withbins=false) {
    let length = d.length / 4;
    let score = 0;
    let size = Math.sqrt(length);
     
    let bins = []; //256 bins;
    
    for (let i = 0; i < d.length; i += 4) {
        if(withbins){
            let i2 = i/4;
            let y2 = Math.floor(i2/size);
            let x2 = ((i2%size)+size)%size;
            
            let y3 = Math.floor(y2/(size/16));
            let x3 = Math.floor(x2/(size/16));

            let i3 = x3 + y3 * 16;
            bins[i3] = bins[i3] || 0;
            bins[i3] += d[i];
        }
        score += (d[i]/255)*(d[i]/255);

        //let x = d[i] / 255;
        //let g = ((-Math.cos(x * Math.PI * 2) * 0.5 + 0.5) * 255)
        //penalize graytones.
        //score += g * g;
    }
    //console.log("bins",bins);
    if(withbins){
        
        return {score: Math.sqrt(score) , bins:bins};
    } else {
        return  Math.sqrt(score);
    }
 }
 function thresholdKernelOld(d, r, g, b) {

     const pi = Math.PI;
     Number.prototype.mod = function(n) {
      return ((this%n)+n)%n;
     };
     const sin = Math.sin;
     const cos = Math.cos;


      //  const o = r;
      // const s = g;
      // const w = b/3;

      // const x = (o - s - w);
      // const y = (o + 0 - w);
      // const z = (o + s - w);

     const u = r*2-1//g*Math.cos(r*pi*2);
     const v = g*2-1;//g*Math.sin(r*pi*2);
     const w = (b)/3;
     const o = Math.sqrt(u*u+v*v);
     const s = Math.atan2(u,v);
     const t = Math.cos(Math.atan2(u,v))*(1-Math.min(1,2*o))/2;
     //const S = (x)=>( x ) ;
     const S = (x)=>( 3*(Math.max(Math.min(x,1),0)**2) - 2*(Math.max(Math.min(x,1),0)**3) ) ;
        //const R = (x,v)=>( ((x - 1 + (o + s*(v-1) - w) * 2) / w ) ); 

         const R = (x,z)=>S( 
            ( x + t - o * Math.cos(s-(2*z*pi)/3) + w/2 )
            /w
         ) ;

        for (let i = 0; i < d.length; i += 4) {
            let r = d[i + 0] / 255;
            let g = d[i + 1] / 255;
            let b = d[i + 2] / 255;
            d[i] = d[i + 1] = d[i + 2] = Math.min(
                R(r, 1) ,
                R(g, 2) ,
                R(b, 3) ) * 255 ;
        }
    
     return d;
 }
 function thresholdKernelWeird(d, r, g, b) {

      Number.prototype.mod = function(n) {
          return ((this%n)+n)%n;
      };

     const pi = Math.PI;
     const min = Math.min;
     const cos = Math.cos;
     const sin = Math.sin;
     const u = (+r).mod(1);
     const v = (+g).mod(1);
     const w = (+b).mod(1);

     const S = (x) => x;
     const R = (a,z) => (((a) + (2*u-1)*cos(2*pi*(z/3 + a)) + (2*v-1)*sin(2*pi*(z/3 + a)) )/w + 0.5)
     //const R = (a,z,m) => ((m + (2*u-1)*cos(2*pi*(z/3 + a)) + (2*v-1)*sin(2*pi*(z/3 + a)) )/w + 0.5)
     
     const C = (r,g,b) => {const m = (r+g+b)/3; return min(R(r,1,m),R(g,2,m),R(b,3,m)) };
     const T = (x) => max(0,min(1,x));
     //given a particular u,v,w,
     //the function y=T(C(x,g,b)) gives which r values will get closer to target per pixel. 
     // so for a sset of u,v,w values, they're trying to match a target value for a pixel. 
     // which C(r,g,b,u,v,w) = 

     for (let i = 0; i < d.length; i += 4) {

         d[i] = d[i + 1] = d[i + 2] =  C(d[i + 0] / 255,d[i + 1] / 255,d[i + 2] / 255) * 255;

     }
     return d;
 }
 function thresholdKernelMin(d, r, g, b) {

     const pi = Math.PI;
     Number.prototype.mod = function(n) {
      return ((this%n)+n)%n;
     };
     const sin = Math.sin;
     const cos = Math.cos;

     

     const u = r*2-1//g*Math.cos(r*pi*2);
     const v = g*2-1;//g*Math.sin(r*pi*2);
     const w = (b)/3;
     //const o = Math.sqrt(u*u+v*v);
     //const s = Math.atan2(u,v);
     //const t = Math.cos(Math.atan2(u,v))*(1-Math.min(1,2*o))/2;
     //const S = (x)=>( 3*(Math.max(Math.min(x,0),1)**2) - 2*(Math.max(Math.min(x,0),1)**3) ) ;
     const S = (x)=>( x ) ;
     // const R = (x,z)=>S( 
     //    ( x - t - o * Math.cos(s-(2*z*pi)/3) + w/2 - 0.5 )
     //    /w
     // ) ;
     const R = (a,z)=>( ( a + u * cos( 2*pi*z/3 ) + v * sin( 2*pi*z/3 ) )/w+0.5 )
    //console.log('threshold',u,v,w,o,s,t,[0,0.1,0.5,0.9,1].map(S));

     const C = (r,g,b) => (Math.min(R(r,1),R(g,2),R(b,3)));

     for (let i = 0; i < d.length; i += 4) {
         let r = d[i + 0] / 255;
         let g = d[i + 1] / 255;
         let b = d[i + 2] / 255;
         d[i + 0] = d[i + 1] = d[i + 2] = 
         Math.min( 
            (( r + u * cos( 2*pi*1/3 ) + v * sin( 2*pi*1/3 ) )/w+0.5 ),
            (( g + u * cos( 2*pi*2/3 ) + v * sin( 2*pi*2/3 ) )/w+0.5 ),
            (( b + u * cos( 2*pi*3/3 ) + v * sin( 2*pi*3/3 ) )/w+0.5 )
            
         ) * 255;
               
    }
    return d;
 }

  function thresholdKernelMinMax(d, r, g, b) {

     const pi = Math.PI;
     Number.prototype.mod = function(n) {
      return ((this%n)+n)%n;
     };
     const sin = Math.sin;
     const cos = Math.cos;

     

     const u = 2*(r.mod(1))-1;
     const v = 2*(g.mod(1))-1;
     const w = 2*(b.mod(1))-1;
     //const o = Math.sqrt(u*u+v*v);
     //const s = Math.atan2(u,v);
     //const t = Math.cos(Math.atan2(u,v))*(1-Math.min(1,2*o))/2;
     //const S = (x)=>( 3*(Math.max(Math.min(x,0),1)**2) - 2*(Math.max(Math.min(x,0),1)**3) ) ;
     const S = (x)=>( x ) ;
     // const R = (x,z)=>S( 
     //    ( x - t - o * Math.cos(s-(2*z*pi)/3) + w/2 - 0.5 )
     //    /w
     // ) ;
     const R = (a,z)=>( ( a + u * cos( 2*pi*z/3 ) + v * sin( 2*pi*z/3 ) )/w+0.5 )
    //console.log('threshold',u,v,w,o,s,t,[0,0.1,0.5,0.9,1].map(S));

     const C = (r,g,b) => (Math.min(R(r,1),R(g,2),R(b,3)));

     for (let i = 0; i < d.length; i += 4) {
         let r = d[i + 0] / 255;
         let g = d[i + 1] / 255;
         let b = d[i + 2] / 255;
         d[i + 0] = d[i + 1] = d[i + 2] = 
         Math.max(Math.min( 
            (r + u) /0.1+0.5 ,
            (g + v) /0.1+0.5 ),
            (b + w) /0.1+0.5 
            
         ) * 255;
               
    }
    return d;
 }
  function thresholdKernelCircle2(d, r, g, b) {

     const pi = Math.PI;
     Number.prototype.mod = function(n) {
      return ((this%n)+n)%n;
     };
     const sin = Math.sin;
     const cos = Math.cos;

     

     const u = r*2-1//g*Math.cos(r*pi*2);
     const v = g*2-1;//g*Math.sin(r*pi*2);
     const w = (b)/3;
     const a = Math.atan2( u, v );
     const s = Math.sqrt( u*u + v*v );
     //const o = Math.sqrt(u*u+v*v);
     //const s = Math.atan2(u,v);
     //const t = Math.cos(Math.atan2(u,v))*(1-Math.min(1,2*o))/2;
     //const S = (x)=>( 3*(Math.max(Math.min(x,0),1)**2) - 2*(Math.max(Math.min(x,0),1)**3) ) ;
     const S = (x)=>( x ) ;
     // const R = (x,z)=>S( 
     //    ( x - t - o * Math.cos(s-(2*z*pi)/3) + w/2 - 0.5 )
     //    /w
     // ) ;
     const R = (a,z)=>( ( a + u * cos( 2*pi*z/3 ) + v * sin( 2*pi*z/3 ) )/w+0.5 )
    

     const C = (r,g,b) => (Math.min(R(r,1),R(g,2),R(b,3)));

     for (let i = 0; i < d.length; i += 4) {
         let r = d[i + 0] / 255;
         let g = d[i + 1] / 255;
         let b = d[i + 2] / 255;
         d[i + 0] = d[i + 1] = d[i + 2] = 
         Math.min( 
            (( r - s * cos( a + ( 2*pi*1 )/3 )  )/w+0.5 ),
            (( g - s * cos( a + ( 2*pi*2 )/3 )  )/w+0.5 ),
            (( b - s * cos( a + ( 2*pi*3 )/3 )  )/w+0.5 )
            
         ) * 255;
               
    }
    return d;
 }  
 function thresholdKernelMULTIPLY(d, r, g, b) {

     const pi = Math.PI;
     Number.prototype.mod = function(n) {
      return ((this%n)+n)%n;
     };
     const sin = Math.sin;
     const cos = Math.cos;

     

     const u = r*2-1//g*Math.cos(r*pi*2);
     const v = g*2-1;//g*Math.sin(r*pi*2);
     const w = (b)/3;
     const a = Math.atan2( u, v );
     const s = Math.sqrt( u*u + v*v );
     //const o = Math.sqrt(u*u+v*v);
     //const s = Math.atan2(u,v);
     //const t = Math.cos(Math.atan2(u,v))*(1-Math.min(1,2*o))/2;
     //const S = (x)=>( 3*(Math.max(Math.min(x,0),1)**2) - 2*(Math.max(Math.min(x,0),1)**3) ) ;
     const S = (x)=>( x ) ;
     // const R = (x,z)=>S( 
     //    ( x - t - o * Math.cos(s-(2*z*pi)/3) + w/2 - 0.5 )
     //    /w
     // ) ;
     const R = (a,z)=>( ( a + u * cos( 2*pi*z/3 ) + v * sin( 2*pi*z/3 ) )/w+0.5 )
    

     const C = (r,g,b) => (Math.min(R(r,1),R(g,2),R(b,3)));

     for (let i = 0; i < d.length; i += 4) {
         let r = d[i + 0] / 255;
         let g = d[i + 1] / 255;
         let b = d[i + 2] / 255;
         d[i + 0] = d[i + 1] = d[i + 2] = 
          (((( r - s * cos( a + ( 2*pi*1 )/3 )  ) ) *
            (( g - s * cos( a + ( 2*pi*2 )/3 )  ) ) *
            (( b - s * cos( a + ( 2*pi*3 )/3 )  ) ) ) / w + 0.5 )
            * 255;
               
    }
    return d;
 }
function thresholdKernelCircle1(d, r, g, b) {

     const pi = Math.PI;
     Number.prototype.mod = function(n) {
      return ((this%n)+n)%n;
     };
     const sin = Math.sin;
     const cos = Math.cos;

     

     const u = r*2-1//g*Math.cos(r*pi*2);
     const v = g*2-1;//g*Math.sin(r*pi*2);
     const w = (b)/3;
     //const o = Math.sqrt(u*u+v*v);
     //const s = Math.atan2(u,v);
     //const t = Math.cos(Math.atan2(u,v))*(1-Math.min(1,2*o))/2;
     //const S = (x)=>( 3*(Math.max(Math.min(x,0),1)**2) - 2*(Math.max(Math.min(x,0),1)**3) ) ;
     const S = (x)=>( x ) ;
     // const R = (x,z)=>S( 
     //    ( x - t - o * Math.cos(s-(2*z*pi)/3) + w/2 - 0.5 )
     //    /w
     // ) ;
     const R = (a,z)=>( ( a + u * cos( 2*pi*z/3 ) + v * sin( 2*pi*z/3 ) )/w+0.5 )
    

     const C = (r,g,b) => (Math.min(R(r,1),R(g,2),R(b,3)));

     for (let i = 0; i < d.length; i += 4) {
         let r = d[i + 0] / 255;
         let g = d[i + 1] / 255;
         let b = d[i + 2] / 255;
         d[i + 0] = d[i + 1] = d[i + 2] = 
         (
            1 - (
                Math.sqrt(u*u+v*v) +
                r * ( cos( Math.atan2(u,v) + (2 * pi)/3 ) ) +
                g * ( cos( Math.atan2(u,v) + (4 * pi)/3 ) ) +
                b * ( cos( Math.atan2(u,v) + (6 * pi)/3 ) ) 
            )/w - 0.5
         ) * 255;
               
    }
    return d;
 }

function thresholdKernelMedian(d, r, g, b) {

     const pi = Math.PI;
     Number.prototype.mod = function(n) {
      return ((this%n)+n)%n;
     };
     const sin = Math.sin;
     const cos = Math.cos;

     

     const u = r.mod(1)*2-1;
     const v = g.mod(1)*2-1;
     const w = b.mod(1)*2-1;
     const s = Math.sqrt(u*u+v*v);
     const a = Math.atan2(u,v);

     const C = (r,g,b) => (Math.min(R(r,1),R(g,2),R(b,3)));

     for (let i = 0; i < d.length; i += 4) {
         let r = d[i + 0] / 255;
         let g = d[i + 1] / 255;
         let b = d[i + 2] / 255;
         d[i + 0] = d[i + 1] = d[i + 2] = 
         (Math.max(Math.min(u+r,v+g), Math.min(Math.max(u+r,v+g),w+b))/0.03 + 0.5)*255;

         
               
    }
    return d;
 }
 

function thresholdKernelMinMaxBlend(d, r, g, b) {

     const pi = Math.PI;
     Number.prototype.mod = function(n) {
      return ((this%n)+n)%n;
     };
     const sin = Math.sin;
     const cos = Math.cos;

     

     const u = r.mod(1)*2-1;
     const v = g.mod(1)*2-1;
     const w = b.mod(1)*2-1;
     const s = Math.sqrt(u*u+v*v);
     const a = Math.atan2(u,v);

     const C = (r,g,b) => (Math.min(R(r,1),R(g,2),R(b,3)));

     for (let i = 0; i < d.length; i += 4) {
         let r = d[i + 0] / 255;
         let g = d[i + 1] / 255;
         let b = d[i + 2] / 255;
         d[i + 0] = d[i + 1] = d[i + 2] = 
         (( (1-(b+w)) * Math.min(u+r,v+g) + (b+w) * Math.max(u+r,v+g)) /0.02 )*255;

         
               
    }
    return d;
 }

 function thresholdKernelMinMaxMinBlend(d, r, g, b) {

     const pi = Math.PI;
     Number.prototype.mod = function(n) {
      return ((this%n)+n)%n;
     };
     const sin = Math.sin;
     const cos = Math.cos;

     

     const u = r.mod(1)*2-1;
     const v = g.mod(1)*2-1;
     const w = b.mod(1)*2-1;
     // const c = [1,1]
     // const d = 2;
     // u = r.mod(1)*sin(g.mod(1)*pi*2)
     const s = Math.sqrt(u*u+v*v);
     const a = Math.atan2(u,v);

     const C = (r,g,b) => (Math.min(R(r,1),R(g,2),R(b,3)));

     for (let i = 0; i < d.length; i += 4) {
         let r = d[i + 0] / 255;
         let g = d[i + 1] / 255;
         let b = d[i + 2] / 255;
         d[i + 0] = d[i + 1] = d[i + 2] = 
         (Math.min( (1-(b+w)) * Math.min(u+r,v+g), (b+w) * Math.max(u+r,v+g)) /0.02 )*255;

         
               
    }
    return d;
 }
  function thresholdKernelMinMaxMinMaxBlend(d, r, g, b) {

     const pi = Math.PI;
     Number.prototype.mod = function(n) {
      return ((this%n)+n)%n;
     };
     const sin = Math.sin;
     const cos = Math.cos;


     

     const u = r.mod(1)*2-1;
     const v = g.mod(1)*2-1;
     const w = b.mod(1)*2-1;
     const s = Math.sqrt(u*u+v*v);
     const a = Math.atan2(u,v);

     

     for (let i = 0; i < d.length; i += 4) {
         let r = d[i + 0] / 255;
         let g = d[i + 1] / 255;
         let b = d[i + 2] / 255;
         d[i + 0] = d[i + 1] = d[i + 2] = 
         (Math.min( (1-(b+w)) * Math.min(u+r,v+g), (b+w) * Math.max(u+r,v+g)) /0.02 )*255;

         
               
    }
    return d;
 }
   function thresholdKernelMinMaxMinMaxCosBlend(d, r, g, b) {

     const pi = Math.PI;
     Number.prototype.mod = function(n) {
      return ((this%n)+n)%n;
     };
     const sin = Math.sin;
     const cos = Math.cos;


     

     const u = r.mod(1);
     const v = g.mod(1);
     const w = b.mod(1);
     const s = Math.sqrt(u*u+v*v);
     const a = Math.atan2(u,v);

     

     for (let i = 0; i < d.length; i += 4) {
         let r = d[i + 0] / 255;
         let g = d[i + 1] / 255;
         let b = d[i + 2] / 255;
         let bc = (-w/2)*cos(pi*(b+w*16))+(-w/2);
         let rc = (-w/2)*cos(pi*(b+w*16))+(-w/2);
         let gc = (-w/2)*cos(pi*(b+w*16))+(-w/2);

         d[i + 0] = d[i + 1] = d[i + 2] = 
         (( (1-bc) * Math.min(r+u,g+v) + bc * Math.max(r+u,g+v)) /0.02 )*255;

         
               
    }
    return d;
 }
 function thresholdKernelMinMaxCone(d, r, g, b) {

     const pi = Math.PI;
     Number.prototype.mod = function(n) {
      return ((this%n)+n)%n;
     };
     const sin = Math.sin;
     const cos = Math.cos;
     const min = Math.min;
     const max = Math.max;
     const abs = Math.abs;
     
     
     

     const u = (((r%1)+1)%1)*2-1;
     const v = (((g%1)+1)%1)*2-1;
     const w = (((b%1)+1)%1)*2-1;
     const s = Math.sqrt(u*u+v*v);
     

     
    
    for (let i = 0; i < d.length; i += 4) {
        const r = (d[i + 0] / 255)*2-1;
        const g = (d[i + 1] / 255)*2-1;
        const b = (d[i + 2] / 255)*2-1;
        


        const s = b;//Math.sqrt((u-b)*(u-b)+(v-w)*(v-w))-1;
        const t = ((-abs(s*2)+1 ) * pi) / 4 ;
        const maxormin = (s > 0 ? min : max) ;
        const a = w*pi;//Math.atan2(u-b,v-w);

        /* r,g,b,u,v,w -> a,t,s*/
        
        
        const left = (r - u) * cos(a - t) - (g - v) * sin(a - t);
        const rite = (r - u) * sin(a + t) + (g - v) * cos(a + t);
        d[i + 0] = d[i + 1] = d[i + 2] = (maxormin( left , rite ) / 0.01 + 0.5) * 255
    }
     
     


    return d;
 }
function thresholdKernelCiirckle(d, r, g, b) {

     const pi = Math.PI;
     Number.prototype.mod = function(n) {
      return ((this%n)+n)%n;
     };
     const sin = Math.sin;
     const cos = Math.cos;

     

     const u = r*2-1//g*Math.cos(r*pi*2);
     const v = g*2-1;//g*Math.sin(r*pi*2);
     const w = (b)/3;
     const s = Math.sqrt(u*u+v*v);
     const a = Math.atan2(u,v);
     //const o = Math.sqrt(u*u+v*v);
     //const s = Math.atan2(u,v);
     //const t = Math.cos(Math.atan2(u,v))*(1-Math.min(1,2*o))/2;
     //const S = (x)=>( 3*(Math.max(Math.min(x,0),1)**2) - 2*(Math.max(Math.min(x,0),1)**3) ) ;
     const S = (x)=>( x ) ;
     // const R = (x,z)=>S( 
     //    ( x - t - o * Math.cos(s-(2*z*pi)/3) + w/2 - 0.5 )
     //    /w
     // ) ;
     const R = (a,z)=>( ( a + u * cos( 2*pi*z/3 ) + v * sin( 2*pi*z/3 ) )/w+0.5 )
    

     const C = (r,g,b) => (Math.min(R(r,1),R(g,2),R(b,3)));

     for (let i = 0; i < d.length; i += 4) {
         let r = d[i + 0] / 255;
         let g = d[i + 1] / 255;
         let b = d[i + 2] / 255;
         d[i + 0] = d[i + 1] = d[i + 2] = 
         (
            - (
                s -
                ( r * 0.5 * ( cos( a + (2 * pi)/3 ) + 1) +
                  g * 0.5 * ( cos( a + (4 * pi)/3 ) + 1) +
                  b * 0.5 * ( cos( a + (6 * pi)/3 ) + 1) )
            )/w + 0.5
         ) * 255;
               
    }
    return d;
 }
 
 thresholdKernel = thresholdKernelMinMaxCone;


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

 function scoreAsync(ctx,withbins=false) {
     let dataobj, w, h;
     scorecount+=1;

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

     return scoreKernel(dataobj.data,withbins);
 }


 function threshold(ctx, r = 1, g = 1, b = 1) {
     let dataobj;
     dataobj = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);


     let w = ctx.canvas.width;
     let h = ctx.canvas.height; 
     let d = thresholdKernel(dataobj.data, r, g, b);

     dataobj = new ImageData(d, w, h);

     ctx.putImageData(dataobj, 0, 0);
     return dataobj;
 }
 function distributeWeights(weights,amount=0.01,distance=0.1){
    let newweights = cloneWeights(weights);
    let l = weights.length;
    for (var i = weights.length - 1; i >= 0; i--) {
        for (var j = weights.length - 1; j >= 0; j--) {
            let rd=newweights[i][0]-newweights[j][0];
            let gd=newweights[i][1]-newweights[j][1];
            let bd=newweights[i][2]-newweights[j][2];
            if(Math.sqrt(rd*rd+gd*gd+bd*bd)<distance) {
                newweights[i][0] = Math.max(0,Math.min(1,newweights[i][0]+rd*amount));
                newweights[i][1] = Math.max(0,Math.min(1,newweights[i][1]+gd*amount));
                newweights[i][2] = Math.max(0,Math.min(1,newweights[i][2]+bd*amount));
              
                newweights[j][0] = Math.max(0,Math.min(1,newweights[j][0]-rd*amount));
                newweights[j][1] = Math.max(0,Math.min(1,newweights[j][1]-gd*amount));
                newweights[j][2] = Math.max(0,Math.min(1,newweights[j][2]-bd*amount));
            }

        }
    }
    return newweights;
 }
 function tweenWeights(weights,amount=0.5) {
     let newweights = [];
     for (let i = 0; i < weights.length; i++) {
         let lidx = (i + weights.length - 1).mod( weights.length );
         let ridx = (i + weights.length + 1).mod( weights.length );

         newweights[i] = [];
         
         const s = Math.sin
         const c = Math.cos
         const t = Math.PI * 2

         const r = (weights[i][0]); 
         const g = (weights[i][1]);
         const b = (weights[i][2]);
         const rl = (weights[lidx][0]);
         const gl = (weights[lidx][1]);
         const bl = (weights[lidx][2]);
         const rr = (weights[ridx][0]);
         const gr = (weights[ridx][1]);
         const br = (weights[ridx][2]);

         let ia = (1-amount);
         let da = amount/2;

         newweights[i][0] = (r * ia + (rl) * da + (rr) * da);
         newweights[i][1] = (g * ia + (gl) * da + (gr) * da);
         newweights[i][2] = (b * ia + (bl) * da + (br) * da);


     }
     //console.log("tweened");
     return newweights;
 }

 function flatten(ctx) {
     let dataobj = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
     
     let d = dataobj.data;
     let amount = 0.5;
     for (let i = 0; i < d.length / 4; i += 1) {
         d[i * 4 + 0] = d[i * 4 + 0] / 2 + 64 + (Math.random()*32-16);
         d[i * 4 + 1] = d[i * 4 + 1] / 2 + 64 + (Math.random()*32-16);
         d[i * 4 + 2] = d[i * 4 + 2] / 2 + 64 + (Math.random()*32-16);

        
     }
     // amount = 1/amount;
     // for (let i = 0; i < weights.length; i++) {
     //    weights[0][0] = (((weights[0][0]*2-1)*amount)+1)/2
     //    weights[0][1] = (((weights[0][1]*2-1)*amount)+1)/2
     //    weights[0][2] = (((weights[0][2]*2-1)*amount)+1)/2
        
     // }
     olderdata=olddata=bestdata=dataobj;
     setWeights(weights);
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

 function perturbWeights(weights, count = 1, amount = 0.01) {
     let a = [];
     let idx = Math.min(count - 1, Math.random() * weights.length | 0);
     for (let i = 0; i < weights.length; i++) {
         a[i] = [];
         a[i][0] = weights[i][0];
         a[i][1] = weights[i][1];
         a[i][2] = weights[i][2];
         if (i < count) {
             a[i][2] = weights[i][2] + Math.random() * amount - amount/2;
             a[i][0] = weights[i][0] + Math.random() * amount - amount/2;
             a[i][1] = weights[i][1] + Math.random() * amount - amount/2;
         }


     }
     return a
 }

 function perturbWeights2(weights, count = 1) {
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
 function sumWeights(a) {
    return Math.sqrt(a.reduce((a,b)=>( a[0]*a[9] + a[1]*a[1] + a[2]*a[2] + b[0]*b[9] + b[1]*b[1] + b[2]*b[2] )) )
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
     scorecount+=1;
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
         score += (d[i]/255)*(d[i]/255);

         //let x = d[i] / 255;
         //let g = ((-Math.cos(x * Math.PI * 2) * 0.5 + 0.5) * 255)
         //penalize graytones.
         //score += g * g;
     }
     return Math.sqrt(score);
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
 let weightRange=0.3;
 let weightMin=0;
 let weightMax=0.1;
 let idealWeightRange=0.5;
 let badWeightRange=0.5;
 let weightModeSuccess=0;
 let weightModeFail=0;

  
  let badWeightMin = 0;
  let badWeightMax = 0.1;

 let weightMemo = new Map();
  
 async function optimiseWeightsForInstructions(ctx, ctxsmall, weights, instructions, start = 0, count = 1000) {
     /* outer: lowestScorePerIndex */
     let newscore = 0;
     let mscore = 14100;
     let nscore = 14100;
     let r, g, b;
     let phi = Math.sqrt(2);// 
     let range = 1/256;
     let inc = Math.random();
     let f = (x) => (Math.floor(x * 1000) / 1000);
     let minr = 1000000,
         ming = 1000000,
         minb = 1000000;
     let minscore = 1000000;
     let newweights = [];
     let oldscore = 0;
     ctx.globalAlpha = 1;
     //outer functions:
     // threshold
     // score
     // evalCanvas
     let time = new Date();

     count = Math.floor(Math.min(weights.length, instructions.length, count));
     //candidate for moving out of this function and into initilisation routine
     ctx.globalCompositeOperation = 'source-over';

     async function sample(idx, r, g, b) {
        let key = `${idx},${Math.floor(r*255)},${Math.floor(g*255)},${Math.floor(b*255)}`;
        if(weightMemo.has(key)) {
            return weightMemo.get(key)
        } else {
         let mscore, nscore, cscore;
         let mscorep, nscorep;
         samplecount+=1;

         
         let result = await scoreInstructionsAndWeights(ctx, ctxsmall, [[r,g,b]], [instructions[idx]], 0, 1)
          // ctx.globalCompositeOperation = 'source-over';
          // ctx.drawImage(canvassmall, 0, 0, 256, 256);
          // let tmpdata =  threshold(ctx, r, g, b);
          // mscorep = scoreAsync(tmpdata);
          // ctx.globalCompositeOperation = 'difference';
          // evalCanvas(ctx, instructions[idx]);

          // nscorep = scoreAsync(ctx);
          // let scores = await Promise.all([mscorep, nscorep]);

          // mscore = (Math.abs(1 - Math.sqrt(scores[0]) / lowestScorePerIndex[idx]));
          // nscore = (   Math.sqrt(scores[1]) ) / lowestScorePerIndex[idx];
          // cscore = (   Math.sqrt(scores[1]) - Math.sqrt(scores[0]) ) / lowestScorePerIndex[idx];
          // let result = Math.sqrt(nscore*nscore + mscore*mscore + cscore*cscore);

          weightMemo.set(key, result);
         
         return result;
       }
     }

     for (let i = 0; i < instructions.length; i++) {
         r = weights[i][0], g = weights[i][1], b = weights[i][2];
         newweights[i] = [];
         newweights[i][0] = r, newweights[i][1] = g, newweights[i][2] = b;
     }

     //start = Math.floor(Math.random()*(count-1));
     for (let i = start; i < count+start; i += 1) {

         let tmpdata;




         r = weights[i][0], g = weights[i][1], b = weights[i][2];
         newweights[i] = [];
         newweights[i][0] = r, newweights[i][1] = g, newweights[i][2] = b;
         let rsample, gsample, bsample;

         rsample = 0;
         gsample = 0;
         bsample = 0;


         let counter = 40;
         let rslope = Math.sign(Math.random()-0.5);
         let gslope = Math.sign(Math.random()-0.5);
         let bslope = Math.sign(Math.random()-0.5);

         let rinc = inc,
             binc = inc,
             ginc = inc;





         // slope is rise over run (y/x)
         // the line equation is 
         // y = xm + c
         // we want to use m to adjust x to minimize y.
         let scale = 1;

         oldscore = minscore = await sample(i, r, g, b);
         diff = await sample(i, r + rslope * rinc, g + gslope * ginc, b + bslope * binc) - minscore;

         
         while (diff === 0 && counter > 0) {
             counter--;
             
            switch (Math.floor(Math.random()*3)) {
                case 0:
                 binc *= phi;
                 
                case 1:
                 binc *= phi;
                 
                case 2:
                 binc *= phi;
                 
             }


             diff = await sample(i, r + rslope * rinc, g + gslope * ginc, b + bslope * binc) - minscore;
         }
      
         debug("wsamples a", i, counter, rinc, ginc, binc, rslope, gslope, bslope, diff);
         

         while (diff > 0 && counter > 0) {
             counter--;
             let samples = await sample(i, r + rslope * rinc, g + gslope * ginc, b + bslope * binc);
             if (samples - minscore > 0) {
                 rslope = -rslope;
                 gslope = -gslope;
                 bslope = -gslope;
                 diff = await sample(i, r + rslope * rinc, g + gslope * ginc, b + bslope * binc) - minscore;
                 debug("wswapslope", counter, diff);
             }
       


             while (diff >= -0.0001 && counter > 0) {
                 counter--;
                 //convert the counter to 3 digits of -1, 0 or 1.
                [rslope,gslope,bslope] = ('000'+(counter+updatecount).toString(3)).slice(-3).split('').map(x=>+x-1)



                 diff = await sample(i, r + rslope * rinc, g + gslope * ginc, b + bslope * binc) - minscore;
                 debug("wenumerate slope", rinc,ginc,binc, rslope, gslope, bslope, counter, diff);
             }
    

         }

         debug("wsamples b", i, counter, rinc, ginc, binc, rslope, gslope, bslope, diff);
         while (diff < 0 && counter > 0) {
             
             counter--;



             newscore = await sample(i, r + rslope * rinc, g + gslope * ginc, b + bslope * binc);

             if (newscore - minscore < 0) {
                 r = r + rslope * rinc;
                 g = g + gslope * ginc;
                 b = b + bslope * binc;
                 rinc /= phi;
                 ginc /= phi;
                 binc /= phi;
                 diff = newscore - minscore;
                 minscore = newscore;
                 
             } else {
                 newscore = await sample(i, r, g, b);
                 diff = newscore - minscore;
             }

             debug("wsamples c", i, counter, r, g, b, rinc, ginc, binc, rslope, gslope, bslope, newscore, minscore, diff);

         }
         weightscores[i]=await sample(i, r, g, b);
         //console.log("weight score",i, weightSuccess,weightFail,  weightscores[i],oldscore, weightscores[i]-oldscore,lowestScorePerIndex[i],counter);
         
         debug("wsamples d", i, counter, rinc, ginc, binc, rslope, gslope, bslope, diff);

         if (counter > 0 ) {
     
             newweights[i][0] = r.mod(1), newweights[i][1] = g.mod(1), newweights[i][2] = b.mod(1);
             
             

         } else {

            
         }

     }
    

     return newweights;
 }
 async function optimisePixelForWeights(ctx, ctxsmall, weights, instructions, idx, weightindex=0) {
     /* outer: lowestScorePErIndex */
     let newscore = 0;
     let mscore = 14100;
     let nscore = 14100;
     let r, g, b;
     let diff;
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
     let maxmilliseconds = 200;
     if (idx === undefined) {
         idx = ((d.length * Math.random()) / 4) | 0;
     }
     let i = (idx % (d.length / 4)) | 0;
     let time = new Date();
     let getElapsed = ()=>(new Date()-time);

     async function sample(pixelidx, r, g, b) {

         d[pixelidx * 4 + 0] = 255*(1 - Math.abs((r/255).mod(2) - 1));
         d[pixelidx * 4 + 1] = 255*(1 - Math.abs((g/255).mod(2) - 1));
         d[pixelidx * 4 + 2] = 255*(1 - Math.abs((b/255).mod(2) - 1));

         ctxsmall.putImageData(dataobj, 0, 0);
        // console.log('weightssc',weights);
         let score = await scoreInstructionsAndWeights(ctx, ctxsmall, weights, instructions);
         return 1000 * (score.score);
     }


     r = [], g = [], b = [];

     r = [ d[(i + 0) * 4 + 0],
           d[(i + 1) * 4 + 0],
           d[(i - 1) * 4 + 0],
           d[(i +16) * 4 + 0],
           d[(i -16) * 4 + 0],
           d[(i +17) * 4 + 0],
           d[(i -17) * 4 + 0],
           d[(i +15) * 4 + 0],
           d[(i -15) * 4 + 0]  ];
     
     g = [ d[(i + 0) * 4 + 1],
           d[(i + 1) * 4 + 1],
           d[(i - 1) * 4 + 1],
           d[(i +16) * 4 + 1],
           d[(i -16) * 4 + 1],
           d[(i +17) * 4 + 1],
           d[(i -17) * 4 + 1],
           d[(i +15) * 4 + 1],
           d[(i -15) * 4 + 1]  ];

     b = [ d[(i + 0) * 4 + 2],
           d[(i + 1) * 4 + 2],
           d[(i - 1) * 4 + 2],
           d[(i +16) * 4 + 2],
           d[(i -16) * 4 + 2],
           d[(i +17) * 4 + 2],
           d[(i -17) * 4 + 2],
           d[(i +15) * 4 + 2],
           d[(i -15) * 4 + 2]  ];
     
     r = r.filter(x=>(!isNaN(x)));
     g = g.filter(x=>(!isNaN(x)));
     b = b.filter(x=>(!isNaN(x)));

     r = (r.reduce( (a,b)=>( a+b ), 0 ) / r.length)|| Math.random()*255;
     g = (g.reduce( (a,b)=>( a+b ), 0 ) / g.length)|| Math.random()*255;
     b = (b.reduce( (a,b)=>( a+b ), 0 ) / b.length)|| Math.random()*255;


     let or = d[i * 4 + 0],
         og = d[i * 4 + 1],
         ob = d[i * 4 + 2];



     let counter = 100;
     let rslope = Math.round(Math.random()*3-1.5);
     let gslope = Math.round(Math.random()*3-1.5);
     let bslope = Math.round(Math.random()*3-1.5);

     let rinc = inc,
         binc = inc,
         ginc = inc;





     // slope is rise over run (y/x)
     // the line equation is 
     // y = xm + c
     // we want to use m to adjust x to minimize y.
     let scale = 1;

     minscore = await sample(i, r, g, b);
     diff = await sample(i, r + rslope * rinc, g + gslope * ginc, b + bslope * binc) - minscore;
     
     const phi = Math.sqrt(Math.sqrt(Math.sqrt(Math.sqrt(Math.sqrt(2)))));
     while(diff===0 && counter > 0) {
        counter--;
        rinc *= phi;
        ginc *= phi;
        binc *= phi;
        diff = await sample(i, r + rslope * rinc, g + gslope * ginc, b + bslope * binc) - minscore;
     }
     if(diff !== 0) {
      counter += 10;
     }
     debug("pxsamples a", i, counter, rinc, ginc, binc, rslope, gslope, bslope, diff);
     while (diff > 0 && getElapsed() < 100) {
         counter--;
         let samples = await sample(i, r + rslope * rinc, g + gslope * ginc, b + bslope * binc);
         if (samples - minscore > 0) {
             rslope = -rslope;
             gslope = -gslope;
             bslope = -gslope;
             diff = await sample(i, r + rslope * rinc, g + gslope * ginc, b + bslope * binc) - minscore;
             debug("swapslope", counter, diff);
         }


         while(diff>=0 && getElapsed() < 100) {
            counter--;
            //convert the counter to 3 digits of -1, 0 or 1.
            [rslope,gslope,bslope] = ('000'+(updatecount + counter).toString(5)).slice(-3).split('').map(x=>+x-2)
            rinc *= phi;
            ginc *= phi;
            binc *= phi;



            diff = await sample(i, r + rslope * rinc, g + gslope * ginc, b + bslope * binc) - minscore;
            debug("enumerate slope", rslope, gslope, bslope, counter, diff);
         }

        
     }
     debug("pxsamples b", i, counter, rinc, ginc, binc, rslope, gslope, bslope, diff);
     while (diff < 0 && getElapsed() < 100) {
        let newscore;
        counter--;



        newscore = await sample(i, r + rslope * rinc, g + gslope * ginc, b + bslope * binc);
          
        if(newscore-minscore < 0) {
          let or=r,og=g,ob=b;

          r = r + rslope * rinc;
          g = g + gslope * ginc;
          b = b + bslope * binc;
          if(isNaN(r)){   console.log('isnan r',or,rslope,rinc,r) }
          if(isNaN(g)){   console.log('isnan g',og,gslope,ginc,g) }
          if(isNaN(b)){   console.log('isnan b',ob,bslope,binc,b) }
          rinc *= phi;
          ginc *= phi;
          binc *= phi;
          diff = newscore-minscore;
          minscore = newscore;
          
        } else {
          newscore = await sample(i, r , g , b);
          diff = newscore-minscore;
        }

        debug("pxsamples c", i, counter, r,g,b,rinc, ginc, binc, rslope, gslope, bslope, newscore, minscore, diff);

     }
     debug("pxsamples d", i, counter, rinc, ginc, binc, rslope, gslope, bslope, diff);

     if (counter > 0) {
         minscore = await sample(i, r , g, b);
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
 
 let targetDataObjects = [];
 

 async function scoreInstructionsAndWeights(ctx, ctxsmall, weights, instructions, start = 0, count = 1000, debug = false) {
    let newscore = 0;
    let mscore = 14100;
    let nscore = 14100;
    let cscore = 0;
    let mscores = [];
    let nscores = [];
    let cscores = [];
    let mscoreps = [];
    let nscoreps = [];
    let size=evalSize;
    //outer functions:
    // threshold
    // score
    // evalCanvas
    
     for (let i = 0; i < instructions.length; i++){
        if (!lowestScorePerIndex[i]) {
             ctx.globalCompositeOperation='source-over';
             ctx.fillStyle="black";
             ctx.fillRect(0,0,256,256);
             evalCanvas(ctx, instructions[i]);
             lowestScorePerIndex[i] = (score(ctx));
         }
     }
    count = Math.min(weights.length-start, instructions.length-start, count);
    ctx.canvas.width=size;
    ctx.canvas.height=size;
    ctx.save();
    ctx.scale(size/256,size/256);
    
    for (let i = start; i < count+start; i += 1) {
      let scoreidx = i;
      let tmpdata;
      samplecount +=1;
      ctx.globalAlpha = 1;

      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(canvassmall, 0, 0, 256, 256);  
      
      tmpdata = await thresholdAsync(ctx, weights[i][0], weights[i][1], weights[i][2]);
      mscorep = scoreAsync(tmpdata);
      mscoreps[i-start]=(mscorep);
      ctx.globalCompositeOperation = 'difference';
      evalCanvas(ctx, instructions[i]);
    

      nscorep = scoreAsync(ctx,true);

      nscoreps[i-start]=(nscorep);
      

      if(debug){
        debugCanvas(ctx,'nscore-'+i);
      }
      //nscore = (Math.sqrt((nscore)) / lowestScorePerIndex[scoreidx]);
      //newscore += nscore * nscore + mscore * mscore;
    }
    ctx.restore();
    const binsreduce = (a,b)=>( 
            a.map((x,i)=>(x+b[i]))
    )

 
    mscores = await Promise.all(mscoreps);
    nscores = await Promise.all(nscoreps);
    
    
    mscore = Math.sqrt(mscores.map((x, idx) => (Math.abs(1 - (x) / lowestScorePerIndex[idx]))).map(x => x*x).reduce((a, b) => a + b));
    nscore = Math.sqrt(nscores.map(x=>x.score).map( (x, idx) => (( (x)  ) / lowestScorePerIndex[idx]) ).map(x => x*x).reduce((a, b) => a + b));
    cscores = nscores.map(x=>x.score).map( (x, idx) => (( Math.max(0, (x) - (mscores[idx]))  ) / lowestScorePerIndex[idx]) );
    cscore = Math.sqrt(cscores.map(x => x*x).reduce((a, b) => a + b));
    
    nscorebins = nscores.map(x=>x.bins).reduce(binsreduce).map(x=>Math.sqrt(x));

    
    
    
    return {score:(Math.sqrt(mscore*mscore+nscore*nscore+cscore*cscore)) * 1000, bins:nscorebins, mscore, nscore, cscore, mscores:mscores.map((x, idx) => (Math.abs(1 - (x) / lowestScorePerIndex[idx]))), nscores:nscores.map(x=>x.score), cscores} ;
  }

 function evalCanvas(ctx, instructions, variables) {
     ctx.save();
     instructions.forEach(function(o, i) {
         switch (typeof ctx[o[0]]) {
             case 'function':
                 
                 ctx[o[0]](...o.slice(1));
                 break;
             default:
                 
                 ctx[o[0]] = o[1];
                 break;
         }
     });
     ctx.restore();
 }



 /* return r g b and counter. */
 async function findSmaller3Vector(idx, r, g, b, sample) {
     let rsample, gsample, bsample;
     const phi = Math.sqrt(2);
     rsample = 0;
     gsample = 0;
     bsample = 0;





     let counter = 100;
     let rinc = inc,
         binc = inc,
         ginc = inc;
     while (rsample === 0 && counter > 0) {
         counter--;
         rinc *= phi;
         const samples = await Promise.all([sample(i, r + rinc, g, b), sample(i, r - rinc, g, b)])
         rsample = samples[0] - samples[1];

         ;
     }
     while (gsample === 0 && counter > 0) {
         counter--;
         ginc *= phi;
         const samples = await Promise.all([sample(i, r + rinc, g + ginc, b), sample(i, r - rinc, g - ginc, b)])
         gsample = samples[0] - samples[1];

     }
     while (bsample === 0 && counter > 0) {
         counter--;
         binc *= phi;
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
             inc *= phi;
             rinc *= phi;
             ginc *= phi;
             binc *= phi;
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
             inc *= 1/phi;
             rinc *= 1/phi;
             ginc *= 1/phi;
             binc *= 1/phi;
         }

     }
 }


 setTimeout(function() {
     let div = document.createElement('div');
     let container = document.createElement('div');

     let imgGradient = document.getElementById('img-gradient');
     container.style.position = ' relative';

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
     interval = setInterval(function() {
         div.style.left = ((onepixel % 16) * 16 ) + 'px';
         div.style.top = ((((onepixel / 16) | 0) % 16) * 16 ) + 'px';
     }, 10);


 }, 10000);