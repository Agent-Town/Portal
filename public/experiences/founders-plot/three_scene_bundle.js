var FoundersPlotThreeBundle=(()=>{var jh=0,jl=1,Qh=2;var ms=1,eu=2,Ar=3,Yn=0,Vt=1,Bt=2,Pn=0,Li=1,Ql=2,ec=3,tc=4,tu=5;var ci=100,nu=101,iu=102,ru=103,su=104,au=200,ou=201,lu=202,cu=203,ma=204,ga=205,hu=206,uu=207,du=208,fu=209,pu=210,mu=211,gu=212,_u=213,yu=214,_a=0,ya=1,xa=2,Oi=3,Sa=4,va=5,ba=6,Ma=7,nc=0,xu=1,Su=2,gn=0,ic=1,rc=2,sc=3,ac=4,oc=5,lc=6,cc=7;var hc=300,yi=301,ki=302,io=303,ro=304,gs=306,Ta=1e3,Jt=1001,Ea=1002,Dt=1003,vu=1004;var _s=1005;var ce=1006,so=1007;var _n=1008;var rn=1009,uc=1010,dc=1011,Cr=1012,ao=1013,yn=1014,xn=1015,Dn=1016,oo=1017,lo=1018,Rr=1020,fc=35902,pc=35899,mc=1021,gc=1022,hn=1023,An=1026,xi=1027,_c=1028,co=1029,Si=1030,ho=1031;var uo=1033,ys=33776,xs=33777,Ss=33778,vs=33779,fo=35840,po=35841,mo=35842,go=35843,_o=36196,yo=37492,xo=37496,So=37488,vo=37489,bs=37490,bo=37491,Mo=37808,To=37809,Eo=37810,wo=37811,Ao=37812,Co=37813,Ro=37814,Io=37815,Po=37816,Do=37817,Lo=37818,Oo=37819,Fo=37820,No=37821,Uo=36492,ko=36494,Bo=36495,Ho=36283,zo=36284,Ms=36285,Vo=36286;var Wr=2300,wa=2301,fa=2302,Hl=2303,zl=2400,Vl=2401,Gl=2402;var bu=3200;var yc=0,Mu=1,Zn="",De="srgb",Xr="srgb-linear",Yr="linear",Qe="srgb";var Di=7680;var Wl=519,Tu=512,Eu=513,wu=514,Go=515,Au=516,Cu=517,Wo=518,Ru=519,Aa=35044;var xc="300 es",pn=2e3,qr=2001;function lf(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function cf(n){return ArrayBuffer.isView(n)&&!(n instanceof DataView)}function fr(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function Iu(){let n=fr("canvas");return n.style.display="block",n}var xh={},pr=null;function $r(...n){let e="THREE."+n.shift();pr?pr("log",e,...n):console.log(e,...n)}function Pu(n){let e=n[0];if(typeof e=="string"&&e.startsWith("TSL:")){let t=n[1];t&&t.isStackTrace?n[0]+=" "+t.getLocation():n[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return n}function Ce(...n){n=Pu(n);let e="THREE."+n.shift();if(pr)pr("warn",e,...n);else{let t=n[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...n)}}function Re(...n){n=Pu(n);let e="THREE."+n.shift();if(pr)pr("error",e,...n);else{let t=n[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...n)}}function Ca(...n){let e=n.join(" ");e in xh||(xh[e]=!0,Ce(...n))}function Du(n,e,t){return new Promise(function(i,r){function s(){switch(n.clientWaitSync(e,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:r();break;case n.TIMEOUT_EXPIRED:setTimeout(s,t);break;default:i()}}setTimeout(s,t)})}var Lu={[_a]:ya,[xa]:ba,[Sa]:Ma,[Oi]:va,[ya]:_a,[ba]:xa,[Ma]:Sa,[va]:Oi},Cn=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){let i=this._listeners;return i===void 0?!1:i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){let i=this._listeners;if(i===void 0)return;let r=i[e];if(r!==void 0){let s=r.indexOf(t);s!==-1&&r.splice(s,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let i=t[e.type];if(i!==void 0){e.target=this;let r=i.slice(0);for(let s=0,a=r.length;s<a;s++)r[s].call(this,e);e.target=null}}},Ut=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var dl=Math.PI/180,Ra=180/Math.PI;function Wn(){let n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Ut[n&255]+Ut[n>>8&255]+Ut[n>>16&255]+Ut[n>>24&255]+"-"+Ut[e&255]+Ut[e>>8&255]+"-"+Ut[e>>16&15|64]+Ut[e>>24&255]+"-"+Ut[t&63|128]+Ut[t>>8&255]+"-"+Ut[t>>16&255]+Ut[t>>24&255]+Ut[i&255]+Ut[i>>8&255]+Ut[i>>16&255]+Ut[i>>24&255]).toLowerCase()}function We(n,e,t){return Math.max(e,Math.min(t,n))}function hf(n,e){return(n%e+e)%e}function fl(n,e,t){return(1-t)*n+t*e}function wn(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("Invalid component type.")}}function st(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("Invalid component type.")}}var xe=class n{static{n.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,i=this.y,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6],this.y=r[1]*t+r[4]*i+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=We(this.x,e.x,t.x),this.y=We(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=We(this.x,e,t),this.y=We(this.y,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(We(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(We(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let i=Math.cos(t),r=Math.sin(t),s=this.x-e.x,a=this.y-e.y;return this.x=s*i-a*r+e.x,this.y=s*r+a*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Rn=class{constructor(e=0,t=0,i=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=r}static slerpFlat(e,t,i,r,s,a,o){let c=i[r+0],h=i[r+1],u=i[r+2],f=i[r+3],d=s[a+0],p=s[a+1],g=s[a+2],y=s[a+3];if(f!==y||c!==d||h!==p||u!==g){let m=c*d+h*p+u*g+f*y;m<0&&(d=-d,p=-p,g=-g,y=-y,m=-m);let l=1-o;if(m<.9995){let b=Math.acos(m),v=Math.sin(b);l=Math.sin(l*b)/v,o=Math.sin(o*b)/v,c=c*l+d*o,h=h*l+p*o,u=u*l+g*o,f=f*l+y*o}else{c=c*l+d*o,h=h*l+p*o,u=u*l+g*o,f=f*l+y*o;let b=1/Math.sqrt(c*c+h*h+u*u+f*f);c*=b,h*=b,u*=b,f*=b}}e[t]=c,e[t+1]=h,e[t+2]=u,e[t+3]=f}static multiplyQuaternionsFlat(e,t,i,r,s,a){let o=i[r],c=i[r+1],h=i[r+2],u=i[r+3],f=s[a],d=s[a+1],p=s[a+2],g=s[a+3];return e[t]=o*g+u*f+c*p-h*d,e[t+1]=c*g+u*d+h*f-o*p,e[t+2]=h*g+u*p+o*d-c*f,e[t+3]=u*g-o*f-c*d-h*p,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,r){return this._x=e,this._y=t,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let i=e._x,r=e._y,s=e._z,a=e._order,o=Math.cos,c=Math.sin,h=o(i/2),u=o(r/2),f=o(s/2),d=c(i/2),p=c(r/2),g=c(s/2);switch(a){case"XYZ":this._x=d*u*f+h*p*g,this._y=h*p*f-d*u*g,this._z=h*u*g+d*p*f,this._w=h*u*f-d*p*g;break;case"YXZ":this._x=d*u*f+h*p*g,this._y=h*p*f-d*u*g,this._z=h*u*g-d*p*f,this._w=h*u*f+d*p*g;break;case"ZXY":this._x=d*u*f-h*p*g,this._y=h*p*f+d*u*g,this._z=h*u*g+d*p*f,this._w=h*u*f-d*p*g;break;case"ZYX":this._x=d*u*f-h*p*g,this._y=h*p*f+d*u*g,this._z=h*u*g-d*p*f,this._w=h*u*f+d*p*g;break;case"YZX":this._x=d*u*f+h*p*g,this._y=h*p*f+d*u*g,this._z=h*u*g-d*p*f,this._w=h*u*f-d*p*g;break;case"XZY":this._x=d*u*f-h*p*g,this._y=h*p*f-d*u*g,this._z=h*u*g+d*p*f,this._w=h*u*f+d*p*g;break;default:Ce("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let i=t/2,r=Math.sin(i);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,i=t[0],r=t[4],s=t[8],a=t[1],o=t[5],c=t[9],h=t[2],u=t[6],f=t[10],d=i+o+f;if(d>0){let p=.5/Math.sqrt(d+1);this._w=.25/p,this._x=(u-c)*p,this._y=(s-h)*p,this._z=(a-r)*p}else if(i>o&&i>f){let p=2*Math.sqrt(1+i-o-f);this._w=(u-c)/p,this._x=.25*p,this._y=(r+a)/p,this._z=(s+h)/p}else if(o>f){let p=2*Math.sqrt(1+o-i-f);this._w=(s-h)/p,this._x=(r+a)/p,this._y=.25*p,this._z=(c+u)/p}else{let p=2*Math.sqrt(1+f-i-o);this._w=(a-r)/p,this._x=(s+h)/p,this._y=(c+u)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<1e-8?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(We(this.dot(e),-1,1)))}rotateTowards(e,t){let i=this.angleTo(e);if(i===0)return this;let r=Math.min(1,t/i);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let i=e._x,r=e._y,s=e._z,a=e._w,o=t._x,c=t._y,h=t._z,u=t._w;return this._x=i*u+a*o+r*h-s*c,this._y=r*u+a*c+s*o-i*h,this._z=s*u+a*h+i*c-r*o,this._w=a*u-i*o-r*c-s*h,this._onChangeCallback(),this}slerp(e,t){let i=e._x,r=e._y,s=e._z,a=e._w,o=this.dot(e);o<0&&(i=-i,r=-r,s=-s,a=-a,o=-o);let c=1-t;if(o<.9995){let h=Math.acos(o),u=Math.sin(h);c=Math.sin(c*h)/u,t=Math.sin(t*h)/u,this._x=this._x*c+i*t,this._y=this._y*c+r*t,this._z=this._z*c+s*t,this._w=this._w*c+a*t,this._onChangeCallback()}else this._x=this._x*c+i*t,this._y=this._y*c+r*t,this._z=this._z*c+s*t,this._w=this._w*c+a*t,this.normalize();return this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),r=Math.sqrt(1-i),s=Math.sqrt(i);return this.set(r*Math.sin(e),r*Math.cos(e),s*Math.sin(t),s*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},R=class n{static{n.prototype.isVector3=!0}constructor(e=0,t=0,i=0){this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Sh.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Sh.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[3]*i+s[6]*r,this.y=s[1]*t+s[4]*i+s[7]*r,this.z=s[2]*t+s[5]*i+s[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,i=this.y,r=this.z,s=e.elements,a=1/(s[3]*t+s[7]*i+s[11]*r+s[15]);return this.x=(s[0]*t+s[4]*i+s[8]*r+s[12])*a,this.y=(s[1]*t+s[5]*i+s[9]*r+s[13])*a,this.z=(s[2]*t+s[6]*i+s[10]*r+s[14])*a,this}applyQuaternion(e){let t=this.x,i=this.y,r=this.z,s=e.x,a=e.y,o=e.z,c=e.w,h=2*(a*r-o*i),u=2*(o*t-s*r),f=2*(s*i-a*t);return this.x=t+c*h+a*f-o*u,this.y=i+c*u+o*h-s*f,this.z=r+c*f+s*u-a*h,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[4]*i+s[8]*r,this.y=s[1]*t+s[5]*i+s[9]*r,this.z=s[2]*t+s[6]*i+s[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=We(this.x,e.x,t.x),this.y=We(this.y,e.y,t.y),this.z=We(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=We(this.x,e,t),this.y=We(this.y,e,t),this.z=We(this.z,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(We(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let i=e.x,r=e.y,s=e.z,a=t.x,o=t.y,c=t.z;return this.x=r*c-s*o,this.y=s*a-i*c,this.z=i*o-r*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return pl.copy(this).projectOnVector(e),this.sub(pl)}reflect(e){return this.sub(pl.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(We(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y,r=this.z-e.z;return t*t+i*i+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){let r=Math.sin(t)*e;return this.x=r*Math.sin(i),this.y=Math.cos(t)*e,this.z=r*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},pl=new R,Sh=new Rn,Oe=class n{static{n.prototype.isMatrix3=!0}constructor(e,t,i,r,s,a,o,c,h){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,a,o,c,h)}set(e,t,i,r,s,a,o,c,h){let u=this.elements;return u[0]=e,u[1]=r,u[2]=o,u[3]=t,u[4]=s,u[5]=c,u[6]=i,u[7]=a,u[8]=h,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,r=t.elements,s=this.elements,a=i[0],o=i[3],c=i[6],h=i[1],u=i[4],f=i[7],d=i[2],p=i[5],g=i[8],y=r[0],m=r[3],l=r[6],b=r[1],v=r[4],_=r[7],E=r[2],T=r[5],C=r[8];return s[0]=a*y+o*b+c*E,s[3]=a*m+o*v+c*T,s[6]=a*l+o*_+c*C,s[1]=h*y+u*b+f*E,s[4]=h*m+u*v+f*T,s[7]=h*l+u*_+f*C,s[2]=d*y+p*b+g*E,s[5]=d*m+p*v+g*T,s[8]=d*l+p*_+g*C,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],c=e[6],h=e[7],u=e[8];return t*a*u-t*o*h-i*s*u+i*o*c+r*s*h-r*a*c}invert(){let e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],c=e[6],h=e[7],u=e[8],f=u*a-o*h,d=o*c-u*s,p=h*s-a*c,g=t*f+i*d+r*p;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let y=1/g;return e[0]=f*y,e[1]=(r*h-u*i)*y,e[2]=(o*i-r*a)*y,e[3]=d*y,e[4]=(u*t-r*c)*y,e[5]=(r*s-o*t)*y,e[6]=p*y,e[7]=(i*c-h*t)*y,e[8]=(a*t-i*s)*y,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,r,s,a,o){let c=Math.cos(s),h=Math.sin(s);return this.set(i*c,i*h,-i*(c*a+h*o)+a+e,-r*h,r*c,-r*(-h*a+c*o)+o+t,0,0,1),this}scale(e,t){return this.premultiply(ml.makeScale(e,t)),this}rotate(e){return this.premultiply(ml.makeRotation(-e)),this}translate(e,t){return this.premultiply(ml.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,i=e.elements;for(let r=0;r<9;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}},ml=new Oe,vh=new Oe().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),bh=new Oe().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function uf(){let n={enabled:!0,workingColorSpace:Xr,spaces:{},convert:function(r,s,a){return this.enabled===!1||s===a||!s||!a||(this.spaces[s].transfer===Qe&&(r.r=Xn(r.r),r.g=Xn(r.g),r.b=Xn(r.b)),this.spaces[s].primaries!==this.spaces[a].primaries&&(r.applyMatrix3(this.spaces[s].toXYZ),r.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===Qe&&(r.r=ur(r.r),r.g=ur(r.g),r.b=ur(r.b))),r},workingToColorSpace:function(r,s){return this.convert(r,this.workingColorSpace,s)},colorSpaceToWorking:function(r,s){return this.convert(r,s,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===Zn?Yr:this.spaces[r].transfer},getToneMappingMode:function(r){return this.spaces[r].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(r,s=this.workingColorSpace){return r.fromArray(this.spaces[s].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,s,a){return r.copy(this.spaces[s].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(r,s){return Ca("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),n.workingToColorSpace(r,s)},toWorkingColorSpace:function(r,s){return Ca("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),n.colorSpaceToWorking(r,s)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],i=[.3127,.329];return n.define({[Xr]:{primaries:e,whitePoint:i,transfer:Yr,toXYZ:vh,fromXYZ:bh,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:De},outputColorSpaceConfig:{drawingBufferColorSpace:De}},[De]:{primaries:e,whitePoint:i,transfer:Qe,toXYZ:vh,fromXYZ:bh,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:De}}}),n}var qe=uf();function Xn(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function ur(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}var $i,Ia=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let i;if(e instanceof HTMLCanvasElement)i=e;else{$i===void 0&&($i=fr("canvas")),$i.width=e.width,$i.height=e.height;let r=$i.getContext("2d");e instanceof ImageData?r.putImageData(e,0,0):r.drawImage(e,0,0,e.width,e.height),i=$i}return i.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=fr("canvas");t.width=e.width,t.height=e.height;let i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);let r=i.getImageData(0,0,e.width,e.height),s=r.data;for(let a=0;a<s.length;a++)s[a]=Xn(s[a]/255)*255;return i.putImageData(r,0,0),t}else if(e.data){let t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(Xn(t[i]/255)*255):t[i]=Xn(t[i]);return{data:t,width:e.width,height:e.height}}else return Ce("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},df=0,mr=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:df++}),this.uuid=Wn(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let a=0,o=r.length;a<o;a++)r[a].isDataTexture?s.push(gl(r[a].image)):s.push(gl(r[a]))}else s=gl(r);i.url=s}return t||(e.images[this.uuid]=i),i}};function gl(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?Ia.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(Ce("Texture: Unable to serialize Texture."),{})}var ff=0,_l=new R,Lt=class n extends Cn{constructor(e=n.DEFAULT_IMAGE,t=n.DEFAULT_MAPPING,i=Jt,r=Jt,s=ce,a=_n,o=hn,c=rn,h=n.DEFAULT_ANISOTROPY,u=Zn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:ff++}),this.uuid=Wn(),this.name="",this.source=new mr(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=s,this.minFilter=a,this.anisotropy=h,this.format=o,this.internalFormat=null,this.type=c,this.offset=new xe(0,0),this.repeat=new xe(1,1),this.center=new xe(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Oe,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(_l).x}get height(){return this.source.getSize(_l).y}get depth(){return this.source.getSize(_l).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let i=e[t];if(i===void 0){Ce(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){Ce(`Texture.setValues(): property '${t}' does not exist.`);continue}r&&i&&r.isVector2&&i.isVector2||r&&i&&r.isVector3&&i.isVector3||r&&i&&r.isMatrix3&&i.isMatrix3?r.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==hc)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Ta:e.x=e.x-Math.floor(e.x);break;case Jt:e.x=e.x<0?0:1;break;case Ea:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Ta:e.y=e.y-Math.floor(e.y);break;case Jt:e.y=e.y<0?0:1;break;case Ea:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Lt.DEFAULT_IMAGE=null;Lt.DEFAULT_MAPPING=hc;Lt.DEFAULT_ANISOTROPY=1;var bt=class n{static{n.prototype.isVector4=!0}constructor(e=0,t=0,i=0,r=1){this.x=e,this.y=t,this.z=i,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,r){return this.x=e,this.y=t,this.z=i,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,i=this.y,r=this.z,s=this.w,a=e.elements;return this.x=a[0]*t+a[4]*i+a[8]*r+a[12]*s,this.y=a[1]*t+a[5]*i+a[9]*r+a[13]*s,this.z=a[2]*t+a[6]*i+a[10]*r+a[14]*s,this.w=a[3]*t+a[7]*i+a[11]*r+a[15]*s,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,r,s,c=e.elements,h=c[0],u=c[4],f=c[8],d=c[1],p=c[5],g=c[9],y=c[2],m=c[6],l=c[10];if(Math.abs(u-d)<.01&&Math.abs(f-y)<.01&&Math.abs(g-m)<.01){if(Math.abs(u+d)<.1&&Math.abs(f+y)<.1&&Math.abs(g+m)<.1&&Math.abs(h+p+l-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let v=(h+1)/2,_=(p+1)/2,E=(l+1)/2,T=(u+d)/4,C=(f+y)/4,S=(g+m)/4;return v>_&&v>E?v<.01?(i=0,r=.707106781,s=.707106781):(i=Math.sqrt(v),r=T/i,s=C/i):_>E?_<.01?(i=.707106781,r=0,s=.707106781):(r=Math.sqrt(_),i=T/r,s=S/r):E<.01?(i=.707106781,r=.707106781,s=0):(s=Math.sqrt(E),i=C/s,r=S/s),this.set(i,r,s,t),this}let b=Math.sqrt((m-g)*(m-g)+(f-y)*(f-y)+(d-u)*(d-u));return Math.abs(b)<.001&&(b=1),this.x=(m-g)/b,this.y=(f-y)/b,this.z=(d-u)/b,this.w=Math.acos((h+p+l-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=We(this.x,e.x,t.x),this.y=We(this.y,e.y,t.y),this.z=We(this.z,e.z,t.z),this.w=We(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=We(this.x,e,t),this.y=We(this.y,e,t),this.z=We(this.z,e,t),this.w=We(this.w,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(We(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Pa=class extends Cn{constructor(e=1,t=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:ce,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1},i),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=i.depth,this.scissor=new bt(0,0,e,t),this.scissorTest=!1,this.viewport=new bt(0,0,e,t),this.textures=[];let r={width:e,height:t,depth:i.depth},s=new Lt(r),a=i.count;for(let o=0;o<a;o++)this.textures[o]=s.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview}_setTextureOptions(e={}){let t={minFilter:ce,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let r=0,s=this.textures.length;r<s;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=i,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,i=e.textures.length;t<i;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let r=Object.assign({},e.textures[t].image);this.textures[t].source=new mr(r)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this.multiview=e.multiview,this}dispose(){this.dispatchEvent({type:"dispose"})}},jt=class extends Pa{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}},Zr=class extends Lt{constructor(e=null,t=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=Dt,this.minFilter=Dt,this.wrapR=Jt,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var Da=class extends Lt{constructor(e=null,t=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=Dt,this.minFilter=Dt,this.wrapR=Jt,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var ft=class n{static{n.prototype.isMatrix4=!0}constructor(e,t,i,r,s,a,o,c,h,u,f,d,p,g,y,m){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,a,o,c,h,u,f,d,p,g,y,m)}set(e,t,i,r,s,a,o,c,h,u,f,d,p,g,y,m){let l=this.elements;return l[0]=e,l[4]=t,l[8]=i,l[12]=r,l[1]=s,l[5]=a,l[9]=o,l[13]=c,l[2]=h,l[6]=u,l[10]=f,l[14]=d,l[3]=p,l[7]=g,l[11]=y,l[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new n().fromArray(this.elements)}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){let t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return this.determinant()===0?(e.set(1,0,0),t.set(0,1,0),i.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){if(e.determinant()===0)return this.identity();let t=this.elements,i=e.elements,r=1/Zi.setFromMatrixColumn(e,0).length(),s=1/Zi.setFromMatrixColumn(e,1).length(),a=1/Zi.setFromMatrixColumn(e,2).length();return t[0]=i[0]*r,t[1]=i[1]*r,t[2]=i[2]*r,t[3]=0,t[4]=i[4]*s,t[5]=i[5]*s,t[6]=i[6]*s,t[7]=0,t[8]=i[8]*a,t[9]=i[9]*a,t[10]=i[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,i=e.x,r=e.y,s=e.z,a=Math.cos(i),o=Math.sin(i),c=Math.cos(r),h=Math.sin(r),u=Math.cos(s),f=Math.sin(s);if(e.order==="XYZ"){let d=a*u,p=a*f,g=o*u,y=o*f;t[0]=c*u,t[4]=-c*f,t[8]=h,t[1]=p+g*h,t[5]=d-y*h,t[9]=-o*c,t[2]=y-d*h,t[6]=g+p*h,t[10]=a*c}else if(e.order==="YXZ"){let d=c*u,p=c*f,g=h*u,y=h*f;t[0]=d+y*o,t[4]=g*o-p,t[8]=a*h,t[1]=a*f,t[5]=a*u,t[9]=-o,t[2]=p*o-g,t[6]=y+d*o,t[10]=a*c}else if(e.order==="ZXY"){let d=c*u,p=c*f,g=h*u,y=h*f;t[0]=d-y*o,t[4]=-a*f,t[8]=g+p*o,t[1]=p+g*o,t[5]=a*u,t[9]=y-d*o,t[2]=-a*h,t[6]=o,t[10]=a*c}else if(e.order==="ZYX"){let d=a*u,p=a*f,g=o*u,y=o*f;t[0]=c*u,t[4]=g*h-p,t[8]=d*h+y,t[1]=c*f,t[5]=y*h+d,t[9]=p*h-g,t[2]=-h,t[6]=o*c,t[10]=a*c}else if(e.order==="YZX"){let d=a*c,p=a*h,g=o*c,y=o*h;t[0]=c*u,t[4]=y-d*f,t[8]=g*f+p,t[1]=f,t[5]=a*u,t[9]=-o*u,t[2]=-h*u,t[6]=p*f+g,t[10]=d-y*f}else if(e.order==="XZY"){let d=a*c,p=a*h,g=o*c,y=o*h;t[0]=c*u,t[4]=-f,t[8]=h*u,t[1]=d*f+y,t[5]=a*u,t[9]=p*f-g,t[2]=g*f-p,t[6]=o*u,t[10]=y*f+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(pf,e,mf)}lookAt(e,t,i){let r=this.elements;return Zt.subVectors(e,t),Zt.lengthSq()===0&&(Zt.z=1),Zt.normalize(),ii.crossVectors(i,Zt),ii.lengthSq()===0&&(Math.abs(i.z)===1?Zt.x+=1e-4:Zt.z+=1e-4,Zt.normalize(),ii.crossVectors(i,Zt)),ii.normalize(),Hs.crossVectors(Zt,ii),r[0]=ii.x,r[4]=Hs.x,r[8]=Zt.x,r[1]=ii.y,r[5]=Hs.y,r[9]=Zt.y,r[2]=ii.z,r[6]=Hs.z,r[10]=Zt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,r=t.elements,s=this.elements,a=i[0],o=i[4],c=i[8],h=i[12],u=i[1],f=i[5],d=i[9],p=i[13],g=i[2],y=i[6],m=i[10],l=i[14],b=i[3],v=i[7],_=i[11],E=i[15],T=r[0],C=r[4],S=r[8],A=r[12],L=r[1],I=r[5],N=r[9],G=r[13],W=r[2],F=r[6],H=r[10],V=r[14],j=r[3],Q=r[7],de=r[11],be=r[15];return s[0]=a*T+o*L+c*W+h*j,s[4]=a*C+o*I+c*F+h*Q,s[8]=a*S+o*N+c*H+h*de,s[12]=a*A+o*G+c*V+h*be,s[1]=u*T+f*L+d*W+p*j,s[5]=u*C+f*I+d*F+p*Q,s[9]=u*S+f*N+d*H+p*de,s[13]=u*A+f*G+d*V+p*be,s[2]=g*T+y*L+m*W+l*j,s[6]=g*C+y*I+m*F+l*Q,s[10]=g*S+y*N+m*H+l*de,s[14]=g*A+y*G+m*V+l*be,s[3]=b*T+v*L+_*W+E*j,s[7]=b*C+v*I+_*F+E*Q,s[11]=b*S+v*N+_*H+E*de,s[15]=b*A+v*G+_*V+E*be,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[4],r=e[8],s=e[12],a=e[1],o=e[5],c=e[9],h=e[13],u=e[2],f=e[6],d=e[10],p=e[14],g=e[3],y=e[7],m=e[11],l=e[15],b=c*p-h*d,v=o*p-h*f,_=o*d-c*f,E=a*p-h*u,T=a*d-c*u,C=a*f-o*u;return t*(y*b-m*v+l*_)-i*(g*b-m*E+l*T)+r*(g*v-y*E+l*C)-s*(g*_-y*T+m*C)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){let r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=i),this}invert(){let e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],c=e[6],h=e[7],u=e[8],f=e[9],d=e[10],p=e[11],g=e[12],y=e[13],m=e[14],l=e[15],b=t*o-i*a,v=t*c-r*a,_=t*h-s*a,E=i*c-r*o,T=i*h-s*o,C=r*h-s*c,S=u*y-f*g,A=u*m-d*g,L=u*l-p*g,I=f*m-d*y,N=f*l-p*y,G=d*l-p*m,W=b*G-v*N+_*I+E*L-T*A+C*S;if(W===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let F=1/W;return e[0]=(o*G-c*N+h*I)*F,e[1]=(r*N-i*G-s*I)*F,e[2]=(y*C-m*T+l*E)*F,e[3]=(d*T-f*C-p*E)*F,e[4]=(c*L-a*G-h*A)*F,e[5]=(t*G-r*L+s*A)*F,e[6]=(m*_-g*C-l*v)*F,e[7]=(u*C-d*_+p*v)*F,e[8]=(a*N-o*L+h*S)*F,e[9]=(i*L-t*N-s*S)*F,e[10]=(g*T-y*_+l*b)*F,e[11]=(f*_-u*T-p*b)*F,e[12]=(o*A-a*I-c*S)*F,e[13]=(t*I-i*A+r*S)*F,e[14]=(y*v-g*E-m*b)*F,e[15]=(u*E-f*v+d*b)*F,this}scale(e){let t=this.elements,i=e.x,r=e.y,s=e.z;return t[0]*=i,t[4]*=r,t[8]*=s,t[1]*=i,t[5]*=r,t[9]*=s,t[2]*=i,t[6]*=r,t[10]*=s,t[3]*=i,t[7]*=r,t[11]*=s,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,r))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let i=Math.cos(t),r=Math.sin(t),s=1-i,a=e.x,o=e.y,c=e.z,h=s*a,u=s*o;return this.set(h*a+i,h*o-r*c,h*c+r*o,0,h*o+r*c,u*o+i,u*c-r*a,0,h*c-r*o,u*c+r*a,s*c*c+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,r,s,a){return this.set(1,i,s,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,i){let r=this.elements,s=t._x,a=t._y,o=t._z,c=t._w,h=s+s,u=a+a,f=o+o,d=s*h,p=s*u,g=s*f,y=a*u,m=a*f,l=o*f,b=c*h,v=c*u,_=c*f,E=i.x,T=i.y,C=i.z;return r[0]=(1-(y+l))*E,r[1]=(p+_)*E,r[2]=(g-v)*E,r[3]=0,r[4]=(p-_)*T,r[5]=(1-(d+l))*T,r[6]=(m+b)*T,r[7]=0,r[8]=(g+v)*C,r[9]=(m-b)*C,r[10]=(1-(d+y))*C,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,i){let r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];let s=this.determinant();if(s===0)return i.set(1,1,1),t.identity(),this;let a=Zi.set(r[0],r[1],r[2]).length(),o=Zi.set(r[4],r[5],r[6]).length(),c=Zi.set(r[8],r[9],r[10]).length();s<0&&(a=-a),un.copy(this);let h=1/a,u=1/o,f=1/c;return un.elements[0]*=h,un.elements[1]*=h,un.elements[2]*=h,un.elements[4]*=u,un.elements[5]*=u,un.elements[6]*=u,un.elements[8]*=f,un.elements[9]*=f,un.elements[10]*=f,t.setFromRotationMatrix(un),i.x=a,i.y=o,i.z=c,this}makePerspective(e,t,i,r,s,a,o=pn,c=!1){let h=this.elements,u=2*s/(t-e),f=2*s/(i-r),d=(t+e)/(t-e),p=(i+r)/(i-r),g,y;if(c)g=s/(a-s),y=a*s/(a-s);else if(o===pn)g=-(a+s)/(a-s),y=-2*a*s/(a-s);else if(o===qr)g=-a/(a-s),y=-a*s/(a-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return h[0]=u,h[4]=0,h[8]=d,h[12]=0,h[1]=0,h[5]=f,h[9]=p,h[13]=0,h[2]=0,h[6]=0,h[10]=g,h[14]=y,h[3]=0,h[7]=0,h[11]=-1,h[15]=0,this}makeOrthographic(e,t,i,r,s,a,o=pn,c=!1){let h=this.elements,u=2/(t-e),f=2/(i-r),d=-(t+e)/(t-e),p=-(i+r)/(i-r),g,y;if(c)g=1/(a-s),y=a/(a-s);else if(o===pn)g=-2/(a-s),y=-(a+s)/(a-s);else if(o===qr)g=-1/(a-s),y=-s/(a-s);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return h[0]=u,h[4]=0,h[8]=0,h[12]=d,h[1]=0,h[5]=f,h[9]=0,h[13]=p,h[2]=0,h[6]=0,h[10]=g,h[14]=y,h[3]=0,h[7]=0,h[11]=0,h[15]=1,this}equals(e){let t=this.elements,i=e.elements;for(let r=0;r<16;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}},Zi=new R,un=new ft,pf=new R(0,0,0),mf=new R(1,1,1),ii=new R,Hs=new R,Zt=new R,Mh=new ft,Th=new Rn,hi=class n{constructor(e=0,t=0,i=0,r=n.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,r=this._order){return this._x=e,this._y=t,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){let r=e.elements,s=r[0],a=r[4],o=r[8],c=r[1],h=r[5],u=r[9],f=r[2],d=r[6],p=r[10];switch(t){case"XYZ":this._y=Math.asin(We(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-u,p),this._z=Math.atan2(-a,s)):(this._x=Math.atan2(d,h),this._z=0);break;case"YXZ":this._x=Math.asin(-We(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(o,p),this._z=Math.atan2(c,h)):(this._y=Math.atan2(-f,s),this._z=0);break;case"ZXY":this._x=Math.asin(We(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-f,p),this._z=Math.atan2(-a,h)):(this._y=0,this._z=Math.atan2(c,s));break;case"ZYX":this._y=Math.asin(-We(f,-1,1)),Math.abs(f)<.9999999?(this._x=Math.atan2(d,p),this._z=Math.atan2(c,s)):(this._x=0,this._z=Math.atan2(-a,h));break;case"YZX":this._z=Math.asin(We(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-u,h),this._y=Math.atan2(-f,s)):(this._x=0,this._y=Math.atan2(o,p));break;case"XZY":this._z=Math.asin(-We(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,h),this._y=Math.atan2(o,s)):(this._x=Math.atan2(-u,p),this._y=0);break;default:Ce("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return Mh.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Mh,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Th.setFromEuler(this),this.setFromQuaternion(Th,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};hi.DEFAULT_ORDER="XYZ";var gr=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},gf=0,Eh=new R,Ki=new Rn,kn=new ft,zs=new R,Lr=new R,_f=new R,yf=new Rn,wh=new R(1,0,0),Ah=new R(0,1,0),Ch=new R(0,0,1),Rh={type:"added"},xf={type:"removed"},Ji={type:"childadded",child:null},yl={type:"childremoved",child:null},Yt=class n extends Cn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:gf++}),this.uuid=Wn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=n.DEFAULT_UP.clone();let e=new R,t=new hi,i=new Rn,r=new R(1,1,1);function s(){i.setFromEuler(t,!1)}function a(){t.setFromQuaternion(i,void 0,!1)}t._onChange(s),i._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new ft},normalMatrix:{value:new Oe}}),this.matrix=new ft,this.matrixWorld=new ft,this.matrixAutoUpdate=n.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=n.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new gr,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Ki.setFromAxisAngle(e,t),this.quaternion.multiply(Ki),this}rotateOnWorldAxis(e,t){return Ki.setFromAxisAngle(e,t),this.quaternion.premultiply(Ki),this}rotateX(e){return this.rotateOnAxis(wh,e)}rotateY(e){return this.rotateOnAxis(Ah,e)}rotateZ(e){return this.rotateOnAxis(Ch,e)}translateOnAxis(e,t){return Eh.copy(e).applyQuaternion(this.quaternion),this.position.add(Eh.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(wh,e)}translateY(e){return this.translateOnAxis(Ah,e)}translateZ(e){return this.translateOnAxis(Ch,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(kn.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?zs.copy(e):zs.set(e,t,i);let r=this.parent;this.updateWorldMatrix(!0,!1),Lr.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?kn.lookAt(Lr,zs,this.up):kn.lookAt(zs,Lr,this.up),this.quaternion.setFromRotationMatrix(kn),r&&(kn.extractRotation(r.matrixWorld),Ki.setFromRotationMatrix(kn),this.quaternion.premultiply(Ki.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(Re("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Rh),Ji.child=e,this.dispatchEvent(Ji),Ji.child=null):Re("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(xf),yl.child=e,this.dispatchEvent(yl),yl.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),kn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),kn.multiply(e.parent.matrixWorld)),e.applyMatrix4(kn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Rh),Ji.child=e,this.dispatchEvent(Ji),Ji.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,r=this.children.length;i<r;i++){let a=this.children[i].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);let r=this.children;for(let s=0,a=r.length;s<a;s++)r[s].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Lr,e,_f),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Lr,yf,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,i=e.y,r=e.z,s=this.matrix.elements;s[12]+=t-s[0]*t-s[4]*i-s[8]*r,s[13]+=i-s[1]*t-s[5]*i-s[9]*r,s[14]+=r-s[2]*t-s[6]*i-s[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t){let i=this.parent;if(e===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){let r=this.children;for(let s=0,a=r.length;s<a;s++)r[s].updateWorldMatrix(!1,!0)}}toJSON(e){let t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let r={};r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.castShadow===!0&&(r.castShadow=!0),this.receiveShadow===!0&&(r.receiveShadow=!0),this.visible===!1&&(r.visible=!1),this.frustumCulled===!1&&(r.frustumCulled=!1),this.renderOrder!==0&&(r.renderOrder=this.renderOrder),this.static!==!1&&(r.static=this.static),Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.matrixAutoUpdate===!1&&(r.matrixAutoUpdate=!1),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(o=>({...o})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function s(o,c){return o[c.uuid]===void 0&&(o[c.uuid]=c.toJSON(e)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(e.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let c=o.shapes;if(Array.isArray(c))for(let h=0,u=c.length;h<u;h++){let f=c[h];s(e.shapes,f)}else s(e.shapes,c)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let c=0,h=this.material.length;c<h;c++)o.push(s(e.materials,this.material[c]));r.material=o}else r.material=s(e.materials,this.material);if(this.children.length>0){r.children=[];for(let o=0;o<this.children.length;o++)r.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let o=0;o<this.animations.length;o++){let c=this.animations[o];r.animations.push(s(e.animations,c))}}if(t){let o=a(e.geometries),c=a(e.materials),h=a(e.textures),u=a(e.images),f=a(e.shapes),d=a(e.skeletons),p=a(e.animations),g=a(e.nodes);o.length>0&&(i.geometries=o),c.length>0&&(i.materials=c),h.length>0&&(i.textures=h),u.length>0&&(i.images=u),f.length>0&&(i.shapes=f),d.length>0&&(i.skeletons=d),p.length>0&&(i.animations=p),g.length>0&&(i.nodes=g)}return i.object=r,i;function a(o){let c=[];for(let h in o){let u=o[h];delete u.metadata,c.push(u)}return c}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){let r=e.children[i];this.add(r.clone())}return this}};Yt.DEFAULT_UP=new R(0,1,0);Yt.DEFAULT_MATRIX_AUTO_UPDATE=!0;Yt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var mn=class extends Yt{constructor(){super(),this.isGroup=!0,this.type="Group"}},Sf={type:"move"},_r=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new mn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new mn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new R,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new R),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new mn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new R,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new R,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let r=null,s=null,a=null,o=this._targetRay,c=this._grip,h=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(h&&e.hand){a=!0;for(let y of e.hand.values()){let m=t.getJointPose(y,i),l=this._getHandJoint(h,y);m!==null&&(l.matrix.fromArray(m.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,l.jointRadius=m.radius),l.visible=m!==null}let u=h.joints["index-finger-tip"],f=h.joints["thumb-tip"],d=u.position.distanceTo(f.position),p=.02,g=.005;h.inputState.pinching&&d>p+g?(h.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!h.inputState.pinching&&d<=p-g&&(h.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else c!==null&&e.gripSpace&&(s=t.getPose(e.gripSpace,i),s!==null&&(c.matrix.fromArray(s.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,s.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(s.linearVelocity)):c.hasLinearVelocity=!1,s.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(s.angularVelocity)):c.hasAngularVelocity=!1,c.eventsEnabled&&c.dispatchEvent({type:"gripUpdated",data:e,target:this})));o!==null&&(r=t.getPose(e.targetRaySpace,i),r===null&&s!==null&&(r=s),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Sf)))}return o!==null&&(o.visible=r!==null),c!==null&&(c.visible=s!==null),h!==null&&(h.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let i=new mn;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}},Ou={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},ri={h:0,s:0,l:0},Vs={h:0,s:0,l:0};function xl(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}var Ke=class{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){let r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=De){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,qe.colorSpaceToWorking(this,t),this}setRGB(e,t,i,r=qe.workingColorSpace){return this.r=e,this.g=t,this.b=i,qe.colorSpaceToWorking(this,r),this}setHSL(e,t,i,r=qe.workingColorSpace){if(e=hf(e,1),t=We(t,0,1),i=We(i,0,1),t===0)this.r=this.g=this.b=i;else{let s=i<=.5?i*(1+t):i+t-i*t,a=2*i-s;this.r=xl(a,s,e+1/3),this.g=xl(a,s,e),this.b=xl(a,s,e-1/3)}return qe.colorSpaceToWorking(this,r),this}setStyle(e,t=De){function i(s){s!==void 0&&parseFloat(s)<1&&Ce("Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let s,a=r[1],o=r[2];switch(a){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,t);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,t);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,t);break;default:Ce("Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){let s=r[1],a=s.length;if(a===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(s,16),t);Ce("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=De){let i=Ou[e.toLowerCase()];return i!==void 0?this.setHex(i,t):Ce("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Xn(e.r),this.g=Xn(e.g),this.b=Xn(e.b),this}copyLinearToSRGB(e){return this.r=ur(e.r),this.g=ur(e.g),this.b=ur(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=De){return qe.workingToColorSpace(kt.copy(this),e),Math.round(We(kt.r*255,0,255))*65536+Math.round(We(kt.g*255,0,255))*256+Math.round(We(kt.b*255,0,255))}getHexString(e=De){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=qe.workingColorSpace){qe.workingToColorSpace(kt.copy(this),t);let i=kt.r,r=kt.g,s=kt.b,a=Math.max(i,r,s),o=Math.min(i,r,s),c,h,u=(o+a)/2;if(o===a)c=0,h=0;else{let f=a-o;switch(h=u<=.5?f/(a+o):f/(2-a-o),a){case i:c=(r-s)/f+(r<s?6:0);break;case r:c=(s-i)/f+2;break;case s:c=(i-r)/f+4;break}c/=6}return e.h=c,e.s=h,e.l=u,e}getRGB(e,t=qe.workingColorSpace){return qe.workingToColorSpace(kt.copy(this),t),e.r=kt.r,e.g=kt.g,e.b=kt.b,e}getStyle(e=De){qe.workingToColorSpace(kt.copy(this),e);let t=kt.r,i=kt.g,r=kt.b;return e!==De?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(r*255)})`}offsetHSL(e,t,i){return this.getHSL(ri),this.setHSL(ri.h+e,ri.s+t,ri.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(ri),e.getHSL(Vs);let i=fl(ri.h,Vs.h,t),r=fl(ri.s,Vs.s,t),s=fl(ri.l,Vs.l,t);return this.setHSL(i,r,s),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,i=this.g,r=this.b,s=e.elements;return this.r=s[0]*t+s[3]*i+s[6]*r,this.g=s[1]*t+s[4]*i+s[7]*r,this.b=s[2]*t+s[5]*i+s[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},kt=new Ke;Ke.NAMES=Ou;var yr=class extends Yt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new hi,this.environmentIntensity=1,this.environmentRotation=new hi,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}},dn=new R,Bn=new R,Sl=new R,Hn=new R,ji=new R,Qi=new R,Ih=new R,vl=new R,bl=new R,Ml=new R,Tl=new bt,El=new bt,wl=new bt,Gn=class n{constructor(e=new R,t=new R,i=new R){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,r){r.subVectors(i,t),dn.subVectors(e,t),r.cross(dn);let s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(e,t,i,r,s){dn.subVectors(r,t),Bn.subVectors(i,t),Sl.subVectors(e,t);let a=dn.dot(dn),o=dn.dot(Bn),c=dn.dot(Sl),h=Bn.dot(Bn),u=Bn.dot(Sl),f=a*h-o*o;if(f===0)return s.set(0,0,0),null;let d=1/f,p=(h*c-o*u)*d,g=(a*u-o*c)*d;return s.set(1-p-g,g,p)}static containsPoint(e,t,i,r){return this.getBarycoord(e,t,i,r,Hn)===null?!1:Hn.x>=0&&Hn.y>=0&&Hn.x+Hn.y<=1}static getInterpolation(e,t,i,r,s,a,o,c){return this.getBarycoord(e,t,i,r,Hn)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(s,Hn.x),c.addScaledVector(a,Hn.y),c.addScaledVector(o,Hn.z),c)}static getInterpolatedAttribute(e,t,i,r,s,a){return Tl.setScalar(0),El.setScalar(0),wl.setScalar(0),Tl.fromBufferAttribute(e,t),El.fromBufferAttribute(e,i),wl.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(Tl,s.x),a.addScaledVector(El,s.y),a.addScaledVector(wl,s.z),a}static isFrontFacing(e,t,i,r){return dn.subVectors(i,t),Bn.subVectors(e,t),dn.cross(Bn).dot(r)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,r){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,i,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return dn.subVectors(this.c,this.b),Bn.subVectors(this.a,this.b),dn.cross(Bn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return n.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return n.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,r,s){return n.getInterpolation(e,this.a,this.b,this.c,t,i,r,s)}containsPoint(e){return n.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return n.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let i=this.a,r=this.b,s=this.c,a,o;ji.subVectors(r,i),Qi.subVectors(s,i),vl.subVectors(e,i);let c=ji.dot(vl),h=Qi.dot(vl);if(c<=0&&h<=0)return t.copy(i);bl.subVectors(e,r);let u=ji.dot(bl),f=Qi.dot(bl);if(u>=0&&f<=u)return t.copy(r);let d=c*f-u*h;if(d<=0&&c>=0&&u<=0)return a=c/(c-u),t.copy(i).addScaledVector(ji,a);Ml.subVectors(e,s);let p=ji.dot(Ml),g=Qi.dot(Ml);if(g>=0&&p<=g)return t.copy(s);let y=p*h-c*g;if(y<=0&&h>=0&&g<=0)return o=h/(h-g),t.copy(i).addScaledVector(Qi,o);let m=u*g-p*f;if(m<=0&&f-u>=0&&p-g>=0)return Ih.subVectors(s,r),o=(f-u)/(f-u+(p-g)),t.copy(r).addScaledVector(Ih,o);let l=1/(m+y+d);return a=y*l,o=d*l,t.copy(i).addScaledVector(ji,a).addScaledVector(Qi,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},ui=class{constructor(e=new R(1/0,1/0,1/0),t=new R(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(fn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(fn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let i=fn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let i=e.geometry;if(i!==void 0){let s=i.getAttribute("position");if(t===!0&&s!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=s.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,fn):fn.fromBufferAttribute(s,a),fn.applyMatrix4(e.matrixWorld),this.expandByPoint(fn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Gs.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),Gs.copy(i.boundingBox)),Gs.applyMatrix4(e.matrixWorld),this.union(Gs)}let r=e.children;for(let s=0,a=r.length;s<a;s++)this.expandByObject(r[s],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,fn),fn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Or),Ws.subVectors(this.max,Or),er.subVectors(e.a,Or),tr.subVectors(e.b,Or),nr.subVectors(e.c,Or),si.subVectors(tr,er),ai.subVectors(nr,tr),Ci.subVectors(er,nr);let t=[0,-si.z,si.y,0,-ai.z,ai.y,0,-Ci.z,Ci.y,si.z,0,-si.x,ai.z,0,-ai.x,Ci.z,0,-Ci.x,-si.y,si.x,0,-ai.y,ai.x,0,-Ci.y,Ci.x,0];return!Al(t,er,tr,nr,Ws)||(t=[1,0,0,0,1,0,0,0,1],!Al(t,er,tr,nr,Ws))?!1:(Xs.crossVectors(si,ai),t=[Xs.x,Xs.y,Xs.z],Al(t,er,tr,nr,Ws))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,fn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(fn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(zn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),zn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),zn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),zn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),zn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),zn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),zn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),zn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(zn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},zn=[new R,new R,new R,new R,new R,new R,new R,new R],fn=new R,Gs=new ui,er=new R,tr=new R,nr=new R,si=new R,ai=new R,Ci=new R,Or=new R,Ws=new R,Xs=new R,Ri=new R;function Al(n,e,t,i,r){for(let s=0,a=n.length-3;s<=a;s+=3){Ri.fromArray(n,s);let o=r.x*Math.abs(Ri.x)+r.y*Math.abs(Ri.y)+r.z*Math.abs(Ri.z),c=e.dot(Ri),h=t.dot(Ri),u=i.dot(Ri);if(Math.max(-Math.max(c,h,u),Math.min(c,h,u))>o)return!1}return!0}var wt=new R,Ys=new xe,vf=0,Xt=class extends Cn{constructor(e,t,i=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:vf++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=Aa,this.updateRanges=[],this.gpuType=xn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[e+r]=t.array[i+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)Ys.fromBufferAttribute(this,t),Ys.applyMatrix3(e),this.setXY(t,Ys.x,Ys.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)wt.fromBufferAttribute(this,t),wt.applyMatrix3(e),this.setXYZ(t,wt.x,wt.y,wt.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)wt.fromBufferAttribute(this,t),wt.applyMatrix4(e),this.setXYZ(t,wt.x,wt.y,wt.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)wt.fromBufferAttribute(this,t),wt.applyNormalMatrix(e),this.setXYZ(t,wt.x,wt.y,wt.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)wt.fromBufferAttribute(this,t),wt.transformDirection(e),this.setXYZ(t,wt.x,wt.y,wt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=wn(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=st(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=wn(t,this.array)),t}setX(e,t){return this.normalized&&(t=st(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=wn(t,this.array)),t}setY(e,t){return this.normalized&&(t=st(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=wn(t,this.array)),t}setZ(e,t){return this.normalized&&(t=st(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=wn(t,this.array)),t}setW(e,t){return this.normalized&&(t=st(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=st(t,this.array),i=st(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,r){return e*=this.itemSize,this.normalized&&(t=st(t,this.array),i=st(i,this.array),r=st(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this}setXYZW(e,t,i,r,s){return e*=this.itemSize,this.normalized&&(t=st(t,this.array),i=st(i,this.array),r=st(r,this.array),s=st(s,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this.array[e+3]=s,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==Aa&&(e.usage=this.usage),e}dispose(){this.dispatchEvent({type:"dispose"})}};var Kr=class extends Xt{constructor(e,t,i){super(new Uint16Array(e),t,i)}};var Jr=class extends Xt{constructor(e,t,i){super(new Uint32Array(e),t,i)}};var yt=class extends Xt{constructor(e,t,i){super(new Float32Array(e),t,i)}},bf=new ui,Fr=new R,Cl=new R,Fi=class{constructor(e=new R,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let i=this.center;t!==void 0?i.copy(t):bf.setFromPoints(e).getCenter(i);let r=0;for(let s=0,a=e.length;s<a;s++)r=Math.max(r,i.distanceToSquared(e[s]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Fr.subVectors(e,this.center);let t=Fr.lengthSq();if(t>this.radius*this.radius){let i=Math.sqrt(t),r=(i-this.radius)*.5;this.center.addScaledVector(Fr,r/i),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Cl.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Fr.copy(e.center).add(Cl)),this.expandByPoint(Fr.copy(e.center).sub(Cl))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},Mf=0,ln=new ft,Rl=new Yt,ir=new R,Kt=new ui,Nr=new ui,Pt=new R,et=class n extends Cn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Mf++}),this.uuid=Wn(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(lf(e)?Jr:Kr)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let s=new Oe().getNormalMatrix(e);i.applyNormalMatrix(s),i.needsUpdate=!0}let r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return ln.makeRotationFromQuaternion(e),this.applyMatrix4(ln),this}rotateX(e){return ln.makeRotationX(e),this.applyMatrix4(ln),this}rotateY(e){return ln.makeRotationY(e),this.applyMatrix4(ln),this}rotateZ(e){return ln.makeRotationZ(e),this.applyMatrix4(ln),this}translate(e,t,i){return ln.makeTranslation(e,t,i),this.applyMatrix4(ln),this}scale(e,t,i){return ln.makeScale(e,t,i),this.applyMatrix4(ln),this}lookAt(e){return Rl.lookAt(e),Rl.updateMatrix(),this.applyMatrix4(Rl.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(ir).negate(),this.translate(ir.x,ir.y,ir.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let i=[];for(let r=0,s=e.length;r<s;r++){let a=e[r];i.push(a.x,a.y,a.z||0)}this.setAttribute("position",new yt(i,3))}else{let i=Math.min(e.length,t.count);for(let r=0;r<i;r++){let s=e[r];t.setXYZ(r,s.x,s.y,s.z||0)}e.length>t.count&&Ce("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new ui);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Re("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new R(-1/0,-1/0,-1/0),new R(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,r=t.length;i<r;i++){let s=t[i];Kt.setFromBufferAttribute(s),this.morphTargetsRelative?(Pt.addVectors(this.boundingBox.min,Kt.min),this.boundingBox.expandByPoint(Pt),Pt.addVectors(this.boundingBox.max,Kt.max),this.boundingBox.expandByPoint(Pt)):(this.boundingBox.expandByPoint(Kt.min),this.boundingBox.expandByPoint(Kt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Re('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Fi);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Re("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new R,1/0);return}if(e){let i=this.boundingSphere.center;if(Kt.setFromBufferAttribute(e),t)for(let s=0,a=t.length;s<a;s++){let o=t[s];Nr.setFromBufferAttribute(o),this.morphTargetsRelative?(Pt.addVectors(Kt.min,Nr.min),Kt.expandByPoint(Pt),Pt.addVectors(Kt.max,Nr.max),Kt.expandByPoint(Pt)):(Kt.expandByPoint(Nr.min),Kt.expandByPoint(Nr.max))}Kt.getCenter(i);let r=0;for(let s=0,a=e.count;s<a;s++)Pt.fromBufferAttribute(e,s),r=Math.max(r,i.distanceToSquared(Pt));if(t)for(let s=0,a=t.length;s<a;s++){let o=t[s],c=this.morphTargetsRelative;for(let h=0,u=o.count;h<u;h++)Pt.fromBufferAttribute(o,h),c&&(ir.fromBufferAttribute(e,h),Pt.add(ir)),r=Math.max(r,i.distanceToSquared(Pt))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&Re('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){Re("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=t.position,r=t.normal,s=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Xt(new Float32Array(4*i.count),4));let a=this.getAttribute("tangent"),o=[],c=[];for(let S=0;S<i.count;S++)o[S]=new R,c[S]=new R;let h=new R,u=new R,f=new R,d=new xe,p=new xe,g=new xe,y=new R,m=new R;function l(S,A,L){h.fromBufferAttribute(i,S),u.fromBufferAttribute(i,A),f.fromBufferAttribute(i,L),d.fromBufferAttribute(s,S),p.fromBufferAttribute(s,A),g.fromBufferAttribute(s,L),u.sub(h),f.sub(h),p.sub(d),g.sub(d);let I=1/(p.x*g.y-g.x*p.y);isFinite(I)&&(y.copy(u).multiplyScalar(g.y).addScaledVector(f,-p.y).multiplyScalar(I),m.copy(f).multiplyScalar(p.x).addScaledVector(u,-g.x).multiplyScalar(I),o[S].add(y),o[A].add(y),o[L].add(y),c[S].add(m),c[A].add(m),c[L].add(m))}let b=this.groups;b.length===0&&(b=[{start:0,count:e.count}]);for(let S=0,A=b.length;S<A;++S){let L=b[S],I=L.start,N=L.count;for(let G=I,W=I+N;G<W;G+=3)l(e.getX(G+0),e.getX(G+1),e.getX(G+2))}let v=new R,_=new R,E=new R,T=new R;function C(S){E.fromBufferAttribute(r,S),T.copy(E);let A=o[S];v.copy(A),v.sub(E.multiplyScalar(E.dot(A))).normalize(),_.crossVectors(T,A);let I=_.dot(c[S])<0?-1:1;a.setXYZW(S,v.x,v.y,v.z,I)}for(let S=0,A=b.length;S<A;++S){let L=b[S],I=L.start,N=L.count;for(let G=I,W=I+N;G<W;G+=3)C(e.getX(G+0)),C(e.getX(G+1)),C(e.getX(G+2))}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new Xt(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let d=0,p=i.count;d<p;d++)i.setXYZ(d,0,0,0);let r=new R,s=new R,a=new R,o=new R,c=new R,h=new R,u=new R,f=new R;if(e)for(let d=0,p=e.count;d<p;d+=3){let g=e.getX(d+0),y=e.getX(d+1),m=e.getX(d+2);r.fromBufferAttribute(t,g),s.fromBufferAttribute(t,y),a.fromBufferAttribute(t,m),u.subVectors(a,s),f.subVectors(r,s),u.cross(f),o.fromBufferAttribute(i,g),c.fromBufferAttribute(i,y),h.fromBufferAttribute(i,m),o.add(u),c.add(u),h.add(u),i.setXYZ(g,o.x,o.y,o.z),i.setXYZ(y,c.x,c.y,c.z),i.setXYZ(m,h.x,h.y,h.z)}else for(let d=0,p=t.count;d<p;d+=3)r.fromBufferAttribute(t,d+0),s.fromBufferAttribute(t,d+1),a.fromBufferAttribute(t,d+2),u.subVectors(a,s),f.subVectors(r,s),u.cross(f),i.setXYZ(d+0,u.x,u.y,u.z),i.setXYZ(d+1,u.x,u.y,u.z),i.setXYZ(d+2,u.x,u.y,u.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)Pt.fromBufferAttribute(e,t),Pt.normalize(),e.setXYZ(t,Pt.x,Pt.y,Pt.z)}toNonIndexed(){function e(o,c){let h=o.array,u=o.itemSize,f=o.normalized,d=new h.constructor(c.length*u),p=0,g=0;for(let y=0,m=c.length;y<m;y++){o.isInterleavedBufferAttribute?p=c[y]*o.data.stride+o.offset:p=c[y]*u;for(let l=0;l<u;l++)d[g++]=h[p++]}return new Xt(d,u,f)}if(this.index===null)return Ce("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new n,i=this.index.array,r=this.attributes;for(let o in r){let c=r[o],h=e(c,i);t.setAttribute(o,h)}let s=this.morphAttributes;for(let o in s){let c=[],h=s[o];for(let u=0,f=h.length;u<f;u++){let d=h[u],p=e(d,i);c.push(p)}t.morphAttributes[o]=c}t.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,c=a.length;o<c;o++){let h=a[o];t.addGroup(h.start,h.count,h.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let c=this.parameters;for(let h in c)c[h]!==void 0&&(e[h]=c[h]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let i=this.attributes;for(let c in i){let h=i[c];e.data.attributes[c]=h.toJSON(e.data)}let r={},s=!1;for(let c in this.morphAttributes){let h=this.morphAttributes[c],u=[];for(let f=0,d=h.length;f<d;f++){let p=h[f];u.push(p.toJSON(e.data))}u.length>0&&(r[c]=u,s=!0)}s&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let i=e.index;i!==null&&this.setIndex(i.clone());let r=e.attributes;for(let h in r){let u=r[h];this.setAttribute(h,u.clone(t))}let s=e.morphAttributes;for(let h in s){let u=[],f=s[h];for(let d=0,p=f.length;d<p;d++)u.push(f[d].clone(t));this.morphAttributes[h]=u}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let h=0,u=a.length;h<u;h++){let f=a[h];this.addGroup(f.start,f.count,f.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let c=e.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},La=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=Aa,this.updateRanges=[],this.version=0,this.uuid=Wn()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,i){e*=this.stride,i*=t.stride;for(let r=0,s=this.stride;r<s;r++)this.array[e+r]=t.array[i+r];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Wn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),i=new this.constructor(t,this.stride);return i.setUsage(this.usage),i}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){return e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Wn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}},zt=new R,jr=class n{constructor(e,t,i,r=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=i,this.normalized=r}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,i=this.data.count;t<i;t++)zt.fromBufferAttribute(this,t),zt.applyMatrix4(e),this.setXYZ(t,zt.x,zt.y,zt.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)zt.fromBufferAttribute(this,t),zt.applyNormalMatrix(e),this.setXYZ(t,zt.x,zt.y,zt.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)zt.fromBufferAttribute(this,t),zt.transformDirection(e),this.setXYZ(t,zt.x,zt.y,zt.z);return this}getComponent(e,t){let i=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(i=wn(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=st(i,this.array)),this.data.array[e*this.data.stride+this.offset+t]=i,this}setX(e,t){return this.normalized&&(t=st(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=st(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=st(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=st(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=wn(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=wn(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=wn(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=wn(t,this.array)),t}setXY(e,t,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=st(t,this.array),i=st(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this}setXYZ(e,t,i,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=st(t,this.array),i=st(i,this.array),r=st(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this.data.array[e+2]=r,this}setXYZW(e,t,i,r,s){return e=e*this.data.stride+this.offset,this.normalized&&(t=st(t,this.array),i=st(i,this.array),r=st(r,this.array),s=st(s,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this.data.array[e+2]=r,this.data.array[e+3]=s,this}clone(e){if(e===void 0){$r("InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let i=0;i<this.count;i++){let r=i*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)t.push(this.data.array[r+s])}return new Xt(new this.array.constructor(t),this.itemSize,this.normalized)}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new n(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){$r("InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let i=0;i<this.count;i++){let r=i*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)t.push(this.data.array[r+s])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}},Tf=0,qn=class extends Cn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Tf++}),this.uuid=Wn(),this.name="",this.type="Material",this.blending=Li,this.side=Yn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=ma,this.blendDst=ga,this.blendEquation=ci,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ke(0,0,0),this.blendAlpha=0,this.depthFunc=Oi,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Wl,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Di,this.stencilZFail=Di,this.stencilZPass=Di,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let i=e[t];if(i===void 0){Ce(`Material: parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){Ce(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(i):r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==Li&&(i.blending=this.blending),this.side!==Yn&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==ma&&(i.blendSrc=this.blendSrc),this.blendDst!==ga&&(i.blendDst=this.blendDst),this.blendEquation!==ci&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==Oi&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Wl&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Di&&(i.stencilFail=this.stencilFail),this.stencilZFail!==Di&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==Di&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.allowOverride===!1&&(i.allowOverride=!1),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function r(s){let a=[];for(let o in s){let c=s[o];delete c.metadata,a.push(c)}return a}if(t){let s=r(e.textures),a=r(e.images);s.length>0&&(i.textures=s),a.length>0&&(i.images=a)}return i}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,i=null;if(t!==null){let r=t.length;i=new Array(r);for(let s=0;s!==r;++s)i[s]=t[s].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}},pt=class extends qn{constructor(e){super(),this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new Ke(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.rotation=e.rotation,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},rr,Ur=new R,sr=new R,ar=new R,or=new xe,kr=new xe,Fu=new ft,qs=new R,Br=new R,$s=new R,Ph=new xe,Il=new xe,Dh=new xe,xt=class extends Yt{constructor(e=new pt){if(super(),this.isSprite=!0,this.type="Sprite",rr===void 0){rr=new et;let t=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),i=new La(t,5);rr.setIndex([0,1,2,0,2,3]),rr.setAttribute("position",new jr(i,3,0,!1)),rr.setAttribute("uv",new jr(i,2,3,!1))}this.geometry=rr,this.material=e,this.center=new xe(.5,.5),this.count=1}raycast(e,t){e.camera===null&&Re('Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),sr.setFromMatrixScale(this.matrixWorld),Fu.copy(e.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(e.camera.matrixWorldInverse,this.matrixWorld),ar.setFromMatrixPosition(this.modelViewMatrix),e.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&sr.multiplyScalar(-ar.z);let i=this.material.rotation,r,s;i!==0&&(s=Math.cos(i),r=Math.sin(i));let a=this.center;Zs(qs.set(-.5,-.5,0),ar,a,sr,r,s),Zs(Br.set(.5,-.5,0),ar,a,sr,r,s),Zs($s.set(.5,.5,0),ar,a,sr,r,s),Ph.set(0,0),Il.set(1,0),Dh.set(1,1);let o=e.ray.intersectTriangle(qs,Br,$s,!1,Ur);if(o===null&&(Zs(Br.set(-.5,.5,0),ar,a,sr,r,s),Il.set(0,1),o=e.ray.intersectTriangle(qs,$s,Br,!1,Ur),o===null))return;let c=e.ray.origin.distanceTo(Ur);c<e.near||c>e.far||t.push({distance:c,point:Ur.clone(),uv:Gn.getInterpolation(Ur,qs,Br,$s,Ph,Il,Dh,new xe),face:null,object:this})}copy(e,t){return super.copy(e,t),e.center!==void 0&&this.center.copy(e.center),this.material=e.material,this}};function Zs(n,e,t,i,r,s){or.subVectors(n,t).addScalar(.5).multiply(i),r!==void 0?(kr.x=s*or.x-r*or.y,kr.y=r*or.x+s*or.y):kr.copy(or),n.copy(e),n.x+=kr.x,n.y+=kr.y,n.applyMatrix4(Fu)}var Vn=new R,Pl=new R,Ks=new R,oi=new R,Dl=new R,Js=new R,Ll=new R,xr=class{constructor(e=new R,t=new R(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Vn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=Vn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Vn.copy(this.origin).addScaledVector(this.direction,t),Vn.distanceToSquared(e))}distanceSqToSegment(e,t,i,r){Pl.copy(e).add(t).multiplyScalar(.5),Ks.copy(t).sub(e).normalize(),oi.copy(this.origin).sub(Pl);let s=e.distanceTo(t)*.5,a=-this.direction.dot(Ks),o=oi.dot(this.direction),c=-oi.dot(Ks),h=oi.lengthSq(),u=Math.abs(1-a*a),f,d,p,g;if(u>0)if(f=a*c-o,d=a*o-c,g=s*u,f>=0)if(d>=-g)if(d<=g){let y=1/u;f*=y,d*=y,p=f*(f+a*d+2*o)+d*(a*f+d+2*c)+h}else d=s,f=Math.max(0,-(a*d+o)),p=-f*f+d*(d+2*c)+h;else d=-s,f=Math.max(0,-(a*d+o)),p=-f*f+d*(d+2*c)+h;else d<=-g?(f=Math.max(0,-(-a*s+o)),d=f>0?-s:Math.min(Math.max(-s,-c),s),p=-f*f+d*(d+2*c)+h):d<=g?(f=0,d=Math.min(Math.max(-s,-c),s),p=d*(d+2*c)+h):(f=Math.max(0,-(a*s+o)),d=f>0?s:Math.min(Math.max(-s,-c),s),p=-f*f+d*(d+2*c)+h);else d=a>0?-s:s,f=Math.max(0,-(a*d+o)),p=-f*f+d*(d+2*c)+h;return i&&i.copy(this.origin).addScaledVector(this.direction,f),r&&r.copy(Pl).addScaledVector(Ks,d),p}intersectSphere(e,t){Vn.subVectors(e.center,this.origin);let i=Vn.dot(this.direction),r=Vn.dot(Vn)-i*i,s=e.radius*e.radius;if(r>s)return null;let a=Math.sqrt(s-r),o=i-a,c=i+a;return c<0?null:o<0?this.at(c,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){let i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,r,s,a,o,c,h=1/this.direction.x,u=1/this.direction.y,f=1/this.direction.z,d=this.origin;return h>=0?(i=(e.min.x-d.x)*h,r=(e.max.x-d.x)*h):(i=(e.max.x-d.x)*h,r=(e.min.x-d.x)*h),u>=0?(s=(e.min.y-d.y)*u,a=(e.max.y-d.y)*u):(s=(e.max.y-d.y)*u,a=(e.min.y-d.y)*u),i>a||s>r||((s>i||isNaN(i))&&(i=s),(a<r||isNaN(r))&&(r=a),f>=0?(o=(e.min.z-d.z)*f,c=(e.max.z-d.z)*f):(o=(e.max.z-d.z)*f,c=(e.min.z-d.z)*f),i>c||o>r)||((o>i||i!==i)&&(i=o),(c<r||r!==r)&&(r=c),r<0)?null:this.at(i>=0?i:r,t)}intersectsBox(e){return this.intersectBox(e,Vn)!==null}intersectTriangle(e,t,i,r,s){Dl.subVectors(t,e),Js.subVectors(i,e),Ll.crossVectors(Dl,Js);let a=this.direction.dot(Ll),o;if(a>0){if(r)return null;o=1}else if(a<0)o=-1,a=-a;else return null;oi.subVectors(this.origin,e);let c=o*this.direction.dot(Js.crossVectors(oi,Js));if(c<0)return null;let h=o*this.direction.dot(Dl.cross(oi));if(h<0||c+h>a)return null;let u=-o*oi.dot(Ll);return u<0?null:this.at(u/a,s)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Ot=class extends qn{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Ke(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new hi,this.combine=nc,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},Lh=new ft,Ii=new xr,js=new Fi,Oh=new R,Qs=new R,ea=new R,ta=new R,Ol=new R,na=new R,Fh=new R,ia=new R,dt=class extends Yt{constructor(e=new et,t=new Ot){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){let o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}getVertexPosition(e,t){let i=this.geometry,r=i.attributes.position,s=i.morphAttributes.position,a=i.morphTargetsRelative;t.fromBufferAttribute(r,e);let o=this.morphTargetInfluences;if(s&&o){na.set(0,0,0);for(let c=0,h=s.length;c<h;c++){let u=o[c],f=s[c];u!==0&&(Ol.fromBufferAttribute(f,e),a?na.addScaledVector(Ol,u):na.addScaledVector(Ol.sub(t),u))}t.add(na)}return t}raycast(e,t){let i=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),js.copy(i.boundingSphere),js.applyMatrix4(s),Ii.copy(e.ray).recast(e.near),!(js.containsPoint(Ii.origin)===!1&&(Ii.intersectSphere(js,Oh)===null||Ii.origin.distanceToSquared(Oh)>(e.far-e.near)**2))&&(Lh.copy(s).invert(),Ii.copy(e.ray).applyMatrix4(Lh),!(i.boundingBox!==null&&Ii.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,Ii)))}_computeIntersections(e,t,i){let r,s=this.geometry,a=this.material,o=s.index,c=s.attributes.position,h=s.attributes.uv,u=s.attributes.uv1,f=s.attributes.normal,d=s.groups,p=s.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,y=d.length;g<y;g++){let m=d[g],l=a[m.materialIndex],b=Math.max(m.start,p.start),v=Math.min(o.count,Math.min(m.start+m.count,p.start+p.count));for(let _=b,E=v;_<E;_+=3){let T=o.getX(_),C=o.getX(_+1),S=o.getX(_+2);r=ra(this,l,e,i,h,u,f,T,C,S),r&&(r.faceIndex=Math.floor(_/3),r.face.materialIndex=m.materialIndex,t.push(r))}}else{let g=Math.max(0,p.start),y=Math.min(o.count,p.start+p.count);for(let m=g,l=y;m<l;m+=3){let b=o.getX(m),v=o.getX(m+1),_=o.getX(m+2);r=ra(this,a,e,i,h,u,f,b,v,_),r&&(r.faceIndex=Math.floor(m/3),t.push(r))}}else if(c!==void 0)if(Array.isArray(a))for(let g=0,y=d.length;g<y;g++){let m=d[g],l=a[m.materialIndex],b=Math.max(m.start,p.start),v=Math.min(c.count,Math.min(m.start+m.count,p.start+p.count));for(let _=b,E=v;_<E;_+=3){let T=_,C=_+1,S=_+2;r=ra(this,l,e,i,h,u,f,T,C,S),r&&(r.faceIndex=Math.floor(_/3),r.face.materialIndex=m.materialIndex,t.push(r))}}else{let g=Math.max(0,p.start),y=Math.min(c.count,p.start+p.count);for(let m=g,l=y;m<l;m+=3){let b=m,v=m+1,_=m+2;r=ra(this,a,e,i,h,u,f,b,v,_),r&&(r.faceIndex=Math.floor(m/3),t.push(r))}}}};function Ef(n,e,t,i,r,s,a,o){let c;if(e.side===Vt?c=i.intersectTriangle(a,s,r,!0,o):c=i.intersectTriangle(r,s,a,e.side===Yn,o),c===null)return null;ia.copy(o),ia.applyMatrix4(n.matrixWorld);let h=t.ray.origin.distanceTo(ia);return h<t.near||h>t.far?null:{distance:h,point:ia.clone(),object:n}}function ra(n,e,t,i,r,s,a,o,c,h){n.getVertexPosition(o,Qs),n.getVertexPosition(c,ea),n.getVertexPosition(h,ta);let u=Ef(n,e,t,i,Qs,ea,ta,Fh);if(u){let f=new R;Gn.getBarycoord(Fh,Qs,ea,ta,f),r&&(u.uv=Gn.getInterpolatedAttribute(r,o,c,h,f,new xe)),s&&(u.uv1=Gn.getInterpolatedAttribute(s,o,c,h,f,new xe)),a&&(u.normal=Gn.getInterpolatedAttribute(a,o,c,h,f,new R),u.normal.dot(i.direction)>0&&u.normal.multiplyScalar(-1));let d={a:o,b:c,c:h,normal:new R,materialIndex:0};Gn.getNormal(Qs,ea,ta,d.normal),u.face=d,u.barycoord=f}return u}var Oa=class extends Lt{constructor(e=null,t=1,i=1,r,s,a,o,c,h=Dt,u=Dt,f,d){super(null,a,o,c,h,u,r,s,f,d),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Fl=new R,wf=new R,Af=new Oe,En=class{constructor(e=new R(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,r){return this.normal.set(e,t,i),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){let r=Fl.subVectors(i,t).cross(wf.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,i=!0){let r=e.delta(Fl),s=this.normal.dot(r);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let a=-(e.start.dot(this.normal)+this.constant)/s;return i===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(r,a)}intersectsLine(e){let t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let i=t||Af.getNormalMatrix(e),r=this.coplanarPoint(Fl).applyMatrix4(e),s=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(s),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},Pi=new Fi,Cf=new xe(.5,.5),sa=new R,Qr=class{constructor(e=new En,t=new En,i=new En,r=new En,s=new En,a=new En){this.planes=[e,t,i,r,s,a]}set(e,t,i,r,s,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(i),o[3].copy(r),o[4].copy(s),o[5].copy(a),this}copy(e){let t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=pn,i=!1){let r=this.planes,s=e.elements,a=s[0],o=s[1],c=s[2],h=s[3],u=s[4],f=s[5],d=s[6],p=s[7],g=s[8],y=s[9],m=s[10],l=s[11],b=s[12],v=s[13],_=s[14],E=s[15];if(r[0].setComponents(h-a,p-u,l-g,E-b).normalize(),r[1].setComponents(h+a,p+u,l+g,E+b).normalize(),r[2].setComponents(h+o,p+f,l+y,E+v).normalize(),r[3].setComponents(h-o,p-f,l-y,E-v).normalize(),i)r[4].setComponents(c,d,m,_).normalize(),r[5].setComponents(h-c,p-d,l-m,E-_).normalize();else if(r[4].setComponents(h-c,p-d,l-m,E-_).normalize(),t===pn)r[5].setComponents(h+c,p+d,l+m,E+_).normalize();else if(t===qr)r[5].setComponents(c,d,m,_).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Pi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Pi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Pi)}intersectsSprite(e){Pi.center.set(0,0,0);let t=Cf.distanceTo(e.center);return Pi.radius=.7071067811865476+t,Pi.applyMatrix4(e.matrixWorld),this.intersectsSphere(Pi)}intersectsSphere(e){let t=this.planes,i=e.center,r=-e.radius;for(let s=0;s<6;s++)if(t[s].distanceToPoint(i)<r)return!1;return!0}intersectsBox(e){let t=this.planes;for(let i=0;i<6;i++){let r=t[i];if(sa.x=r.normal.x>0?e.max.x:e.min.x,sa.y=r.normal.y>0?e.max.y:e.min.y,sa.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(sa)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var Ft=class extends qn{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Ke(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},Fa=new R,Na=new R,Nh=new ft,Hr=new xr,aa=new Fi,Nl=new R,Uh=new R,cn=class extends Yt{constructor(e=new et,t=new Ft){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[0];for(let r=1,s=t.count;r<s;r++)Fa.fromBufferAttribute(t,r-1),Na.fromBufferAttribute(t,r),i[r]=i[r-1],i[r]+=Fa.distanceTo(Na);e.setAttribute("lineDistance",new yt(i,1))}else Ce("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){let i=this.geometry,r=this.matrixWorld,s=e.params.Line.threshold,a=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),aa.copy(i.boundingSphere),aa.applyMatrix4(r),aa.radius+=s,e.ray.intersectsSphere(aa)===!1)return;Nh.copy(r).invert(),Hr.copy(e.ray).applyMatrix4(Nh);let o=s/((this.scale.x+this.scale.y+this.scale.z)/3),c=o*o,h=this.isLineSegments?2:1,u=i.index,d=i.attributes.position;if(u!==null){let p=Math.max(0,a.start),g=Math.min(u.count,a.start+a.count);for(let y=p,m=g-1;y<m;y+=h){let l=u.getX(y),b=u.getX(y+1),v=oa(this,e,Hr,c,l,b,y);v&&t.push(v)}if(this.isLineLoop){let y=u.getX(g-1),m=u.getX(p),l=oa(this,e,Hr,c,y,m,g-1);l&&t.push(l)}}else{let p=Math.max(0,a.start),g=Math.min(d.count,a.start+a.count);for(let y=p,m=g-1;y<m;y+=h){let l=oa(this,e,Hr,c,y,y+1,y);l&&t.push(l)}if(this.isLineLoop){let y=oa(this,e,Hr,c,g-1,p,g-1);y&&t.push(y)}}}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){let o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}};function oa(n,e,t,i,r,s,a){let o=n.geometry.attributes.position;if(Fa.fromBufferAttribute(o,r),Na.fromBufferAttribute(o,s),t.distanceSqToSegment(Fa,Na,Nl,Uh)>i)return;Nl.applyMatrix4(n.matrixWorld);let h=e.ray.origin.distanceTo(Nl);if(!(h<e.near||h>e.far))return{distance:h,point:Uh.clone().applyMatrix4(n.matrixWorld),index:a,face:null,faceIndex:null,barycoord:null,object:n}}var kh=new R,Bh=new R,Sr=class extends cn{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[];for(let r=0,s=t.count;r<s;r+=2)kh.fromBufferAttribute(t,r),Bh.fromBufferAttribute(t,r+1),i[r]=r===0?0:i[r-1],i[r+1]=i[r]+kh.distanceTo(Bh);e.setAttribute("lineDistance",new yt(i,1))}else Ce("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}},In=class extends cn{constructor(e,t){super(e,t),this.isLineLoop=!0,this.type="LineLoop"}};var es=class extends Lt{constructor(e=[],t=yi,i,r,s,a,o,c,h,u){super(e,t,i,r,s,a,o,c,h,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},je=class extends Lt{constructor(e,t,i,r,s,a,o,c,h){super(e,t,i,r,s,a,o,c,h),this.isCanvasTexture=!0,this.needsUpdate=!0}};var $n=class extends Lt{constructor(e,t,i=yn,r,s,a,o=Dt,c=Dt,h,u=An,f=1){if(u!==An&&u!==xi)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let d={width:e,height:t,depth:f};super(d,r,s,a,o,c,u,i,h),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new mr(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},Ua=class extends $n{constructor(e,t=yn,i=yi,r,s,a=Dt,o=Dt,c,h=An){let u={width:e,height:e,depth:1},f=[u,u,u,u,u,u];super(e,e,t,i,r,s,a,o,c,h),this.image=f,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},ts=class extends Lt{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},vr=class n extends et{constructor(e=1,t=1,i=1,r=1,s=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:r,heightSegments:s,depthSegments:a};let o=this;r=Math.floor(r),s=Math.floor(s),a=Math.floor(a);let c=[],h=[],u=[],f=[],d=0,p=0;g("z","y","x",-1,-1,i,t,e,a,s,0),g("z","y","x",1,-1,i,t,-e,a,s,1),g("x","z","y",1,1,e,i,t,r,a,2),g("x","z","y",1,-1,e,i,-t,r,a,3),g("x","y","z",1,-1,e,t,i,r,s,4),g("x","y","z",-1,-1,e,t,-i,r,s,5),this.setIndex(c),this.setAttribute("position",new yt(h,3)),this.setAttribute("normal",new yt(u,3)),this.setAttribute("uv",new yt(f,2));function g(y,m,l,b,v,_,E,T,C,S,A){let L=_/C,I=E/S,N=_/2,G=E/2,W=T/2,F=C+1,H=S+1,V=0,j=0,Q=new R;for(let de=0;de<H;de++){let be=de*I-G;for(let we=0;we<F;we++){let $e=we*L-N;Q[y]=$e*b,Q[m]=be*v,Q[l]=W,h.push(Q.x,Q.y,Q.z),Q[y]=0,Q[m]=0,Q[l]=T>0?1:-1,u.push(Q.x,Q.y,Q.z),f.push(we/C),f.push(1-de/S),V+=1}}for(let de=0;de<S;de++)for(let be=0;be<C;be++){let we=d+be+F*de,$e=d+be+F*(de+1),tt=d+(be+1)+F*(de+1),ke=d+(be+1)+F*de;c.push(we,$e,ke),c.push($e,tt,ke),j+=6}o.addGroup(p,j,A),p+=j,d+=V}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};var Qt=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){Ce("Curve: .getPoint() not implemented.")}getPointAt(e,t){let i=this.getUtoTmapping(e);return this.getPoint(i,t)}getPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return t}getSpacedPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPointAt(i/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],i,r=this.getPoint(0),s=0;t.push(0);for(let a=1;a<=e;a++)i=this.getPoint(a/e),s+=i.distanceTo(r),t.push(s),r=i;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){let i=this.getLengths(),r=0,s=i.length,a;t?a=t:a=e*i[s-1];let o=0,c=s-1,h;for(;o<=c;)if(r=Math.floor(o+(c-o)/2),h=i[r]-a,h<0)o=r+1;else if(h>0)c=r-1;else{c=r;break}if(r=c,i[r]===a)return r/(s-1);let u=i[r],d=i[r+1]-u,p=(a-u)/d;return(r+p)/(s-1)}getTangent(e,t){let r=e-1e-4,s=e+1e-4;r<0&&(r=0),s>1&&(s=1);let a=this.getPoint(r),o=this.getPoint(s),c=t||(a.isVector2?new xe:new R);return c.copy(o).sub(a).normalize(),c}getTangentAt(e,t){let i=this.getUtoTmapping(e);return this.getTangent(i,t)}computeFrenetFrames(e,t=!1){let i=new R,r=[],s=[],a=[],o=new R,c=new ft;for(let p=0;p<=e;p++){let g=p/e;r[p]=this.getTangentAt(g,new R)}s[0]=new R,a[0]=new R;let h=Number.MAX_VALUE,u=Math.abs(r[0].x),f=Math.abs(r[0].y),d=Math.abs(r[0].z);u<=h&&(h=u,i.set(1,0,0)),f<=h&&(h=f,i.set(0,1,0)),d<=h&&i.set(0,0,1),o.crossVectors(r[0],i).normalize(),s[0].crossVectors(r[0],o),a[0].crossVectors(r[0],s[0]);for(let p=1;p<=e;p++){if(s[p]=s[p-1].clone(),a[p]=a[p-1].clone(),o.crossVectors(r[p-1],r[p]),o.length()>Number.EPSILON){o.normalize();let g=Math.acos(We(r[p-1].dot(r[p]),-1,1));s[p].applyMatrix4(c.makeRotationAxis(o,g))}a[p].crossVectors(r[p],s[p])}if(t===!0){let p=Math.acos(We(s[0].dot(s[e]),-1,1));p/=e,r[0].dot(o.crossVectors(s[0],s[e]))>0&&(p=-p);for(let g=1;g<=e;g++)s[g].applyMatrix4(c.makeRotationAxis(r[g],p*g)),a[g].crossVectors(r[g],s[g])}return{tangents:r,normals:s,binormals:a}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}},br=class extends Qt{constructor(e=0,t=0,i=1,r=1,s=0,a=Math.PI*2,o=!1,c=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=i,this.yRadius=r,this.aStartAngle=s,this.aEndAngle=a,this.aClockwise=o,this.aRotation=c}getPoint(e,t=new xe){let i=t,r=Math.PI*2,s=this.aEndAngle-this.aStartAngle,a=Math.abs(s)<Number.EPSILON;for(;s<0;)s+=r;for(;s>r;)s-=r;s<Number.EPSILON&&(a?s=0:s=r),this.aClockwise===!0&&!a&&(s===r?s=-r:s=s-r);let o=this.aStartAngle+e*s,c=this.aX+this.xRadius*Math.cos(o),h=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){let u=Math.cos(this.aRotation),f=Math.sin(this.aRotation),d=c-this.aX,p=h-this.aY;c=d*u-p*f+this.aX,h=d*f+p*u+this.aY}return i.set(c,h)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},ka=class extends br{constructor(e,t,i,r,s,a){super(e,t,i,i,r,s,a),this.isArcCurve=!0,this.type="ArcCurve"}};function Sc(){let n=0,e=0,t=0,i=0;function r(s,a,o,c){n=s,e=o,t=-3*s+3*a-2*o-c,i=2*s-2*a+o+c}return{initCatmullRom:function(s,a,o,c,h){r(a,o,h*(o-s),h*(c-a))},initNonuniformCatmullRom:function(s,a,o,c,h,u,f){let d=(a-s)/h-(o-s)/(h+u)+(o-a)/u,p=(o-a)/u-(c-a)/(u+f)+(c-o)/f;d*=u,p*=u,r(a,o,d,p)},calc:function(s){let a=s*s,o=a*s;return n+e*s+t*a+i*o}}}var Hh=new R,zh=new R,Ul=new Sc,kl=new Sc,Bl=new Sc,di=class extends Qt{constructor(e=[],t=!1,i="centripetal",r=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=i,this.tension=r}getPoint(e,t=new R){let i=t,r=this.points,s=r.length,a=(s-(this.closed?0:1))*e,o=Math.floor(a),c=a-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/s)+1)*s:c===0&&o===s-1&&(o=s-2,c=1);let h,u;this.closed||o>0?h=r[(o-1)%s]:(zh.subVectors(r[0],r[1]).add(r[0]),h=zh);let f=r[o%s],d=r[(o+1)%s];if(this.closed||o+2<s?u=r[(o+2)%s]:(Hh.subVectors(r[s-1],r[s-2]).add(r[s-1]),u=Hh),this.curveType==="centripetal"||this.curveType==="chordal"){let p=this.curveType==="chordal"?.5:.25,g=Math.pow(h.distanceToSquared(f),p),y=Math.pow(f.distanceToSquared(d),p),m=Math.pow(d.distanceToSquared(u),p);y<1e-4&&(y=1),g<1e-4&&(g=y),m<1e-4&&(m=y),Ul.initNonuniformCatmullRom(h.x,f.x,d.x,u.x,g,y,m),kl.initNonuniformCatmullRom(h.y,f.y,d.y,u.y,g,y,m),Bl.initNonuniformCatmullRom(h.z,f.z,d.z,u.z,g,y,m)}else this.curveType==="catmullrom"&&(Ul.initCatmullRom(h.x,f.x,d.x,u.x,this.tension),kl.initCatmullRom(h.y,f.y,d.y,u.y,this.tension),Bl.initCatmullRom(h.z,f.z,d.z,u.z,this.tension));return i.set(Ul.calc(c),kl.calc(c),Bl.calc(c)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(r.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let r=this.points[t];e.points.push(r.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(new R().fromArray(r))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function Vh(n,e,t,i,r){let s=(i-e)*.5,a=(r-t)*.5,o=n*n,c=n*o;return(2*t-2*i+s+a)*c+(-3*t+3*i-2*s-a)*o+s*n+t}function Rf(n,e){let t=1-n;return t*t*e}function If(n,e){return 2*(1-n)*n*e}function Pf(n,e){return n*n*e}function Vr(n,e,t,i){return Rf(n,e)+If(n,t)+Pf(n,i)}function Df(n,e){let t=1-n;return t*t*t*e}function Lf(n,e){let t=1-n;return 3*t*t*n*e}function Of(n,e){return 3*(1-n)*n*n*e}function Ff(n,e){return n*n*n*e}function Gr(n,e,t,i,r){return Df(n,e)+Lf(n,t)+Of(n,i)+Ff(n,r)}var ns=class extends Qt{constructor(e=new xe,t=new xe,i=new xe,r=new xe){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=i,this.v3=r}getPoint(e,t=new xe){let i=t,r=this.v0,s=this.v1,a=this.v2,o=this.v3;return i.set(Gr(e,r.x,s.x,a.x,o.x),Gr(e,r.y,s.y,a.y,o.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},Ba=class extends Qt{constructor(e=new R,t=new R,i=new R,r=new R){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=i,this.v3=r}getPoint(e,t=new R){let i=t,r=this.v0,s=this.v1,a=this.v2,o=this.v3;return i.set(Gr(e,r.x,s.x,a.x,o.x),Gr(e,r.y,s.y,a.y,o.y),Gr(e,r.z,s.z,a.z,o.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},is=class extends Qt{constructor(e=new xe,t=new xe){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new xe){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new xe){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Ha=class extends Qt{constructor(e=new R,t=new R){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new R){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new R){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},rs=class extends Qt{constructor(e=new xe,t=new xe,i=new xe){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new xe){let i=t,r=this.v0,s=this.v1,a=this.v2;return i.set(Vr(e,r.x,s.x,a.x),Vr(e,r.y,s.y,a.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},fi=class extends Qt{constructor(e=new R,t=new R,i=new R){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new R){let i=t,r=this.v0,s=this.v1,a=this.v2;return i.set(Vr(e,r.x,s.x,a.x),Vr(e,r.y,s.y,a.y),Vr(e,r.z,s.z,a.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},ss=class extends Qt{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new xe){let i=t,r=this.points,s=(r.length-1)*e,a=Math.floor(s),o=s-a,c=r[a===0?a:a-1],h=r[a],u=r[a>r.length-2?r.length-1:a+1],f=r[a>r.length-3?r.length-1:a+2];return i.set(Vh(o,c.x,h.x,u.x,f.x),Vh(o,c.y,h.y,u.y,f.y)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(r.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let r=this.points[t];e.points.push(r.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(new xe().fromArray(r))}return this}},Xl=Object.freeze({__proto__:null,ArcCurve:ka,CatmullRomCurve3:di,CubicBezierCurve:ns,CubicBezierCurve3:Ba,EllipseCurve:br,LineCurve:is,LineCurve3:Ha,QuadraticBezierCurve:rs,QuadraticBezierCurve3:fi,SplineCurve:ss}),za=class extends Qt{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){let e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){let i=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new Xl[i](t,e))}return this}getPoint(e,t){let i=e*this.getLength(),r=this.getCurveLengths(),s=0;for(;s<r.length;){if(r[s]>=i){let a=r[s]-i,o=this.curves[s],c=o.getLength(),h=c===0?0:1-a/c;return o.getPointAt(h,t)}s++}return null}getLength(){let e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let e=[],t=0;for(let i=0,r=this.curves.length;i<r;i++)t+=this.curves[i].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){let t=[],i;for(let r=0,s=this.curves;r<s.length;r++){let a=s[r],o=a.isEllipseCurve?e*2:a.isLineCurve||a.isLineCurve3?1:a.isSplineCurve?e*a.points.length:e,c=a.getPoints(o);for(let h=0;h<c.length;h++){let u=c[h];i&&i.equals(u)||(t.push(u),i=u)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let r=e.curves[t];this.curves.push(r.clone())}return this.autoClose=e.autoClose,this}toJSON(){let e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,i=this.curves.length;t<i;t++){let r=this.curves[t];e.curves.push(r.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let r=e.curves[t];this.curves.push(new Xl[r.type]().fromJSON(r))}return this}},as=class extends za{constructor(e){super(),this.type="Path",this.currentPoint=new xe,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,i=e.length;t<i;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){let i=new is(this.currentPoint.clone(),new xe(e,t));return this.curves.push(i),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,i,r){let s=new rs(this.currentPoint.clone(),new xe(e,t),new xe(i,r));return this.curves.push(s),this.currentPoint.set(i,r),this}bezierCurveTo(e,t,i,r,s,a){let o=new ns(this.currentPoint.clone(),new xe(e,t),new xe(i,r),new xe(s,a));return this.curves.push(o),this.currentPoint.set(s,a),this}splineThru(e){let t=[this.currentPoint.clone()].concat(e),i=new ss(t);return this.curves.push(i),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,i,r,s,a){let o=this.currentPoint.x,c=this.currentPoint.y;return this.absarc(e+o,t+c,i,r,s,a),this}absarc(e,t,i,r,s,a){return this.absellipse(e,t,i,i,r,s,a),this}ellipse(e,t,i,r,s,a,o,c){let h=this.currentPoint.x,u=this.currentPoint.y;return this.absellipse(e+h,t+u,i,r,s,a,o,c),this}absellipse(e,t,i,r,s,a,o,c){let h=new br(e,t,i,r,s,a,o,c);if(this.curves.length>0){let f=h.getPoint(0);f.equals(this.currentPoint)||this.lineTo(f.x,f.y)}this.curves.push(h);let u=h.getPoint(1);return this.currentPoint.copy(u),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){let e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}},Mr=class extends as{constructor(e){super(e),this.uuid=Wn(),this.type="Shape",this.holes=[]}getPointsHoles(e){let t=[];for(let i=0,r=this.holes.length;i<r;i++)t[i]=this.holes[i].getPoints(e);return t}extractPoints(e){return{shape:this.getPoints(e),holes:this.getPointsHoles(e)}}copy(e){super.copy(e),this.holes=[];for(let t=0,i=e.holes.length;t<i;t++){let r=e.holes[t];this.holes.push(r.clone())}return this}toJSON(){let e=super.toJSON();e.uuid=this.uuid,e.holes=[];for(let t=0,i=this.holes.length;t<i;t++){let r=this.holes[t];e.holes.push(r.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.uuid=e.uuid,this.holes=[];for(let t=0,i=e.holes.length;t<i;t++){let r=e.holes[t];this.holes.push(new as().fromJSON(r))}return this}};function Nf(n,e,t=2){let i=e&&e.length,r=i?e[0]*t:n.length,s=Nu(n,0,r,t,!0),a=[];if(!s||s.next===s.prev)return a;let o,c,h;if(i&&(s=zf(n,e,s,t)),n.length>80*t){o=n[0],c=n[1];let u=o,f=c;for(let d=t;d<r;d+=t){let p=n[d],g=n[d+1];p<o&&(o=p),g<c&&(c=g),p>u&&(u=p),g>f&&(f=g)}h=Math.max(u-o,f-c),h=h!==0?32767/h:0}return os(s,a,t,o,c,h,0),a}function Nu(n,e,t,i,r){let s;if(r===jf(n,e,t,i)>0)for(let a=e;a<t;a+=i)s=Gh(a/i|0,n[a],n[a+1],s);else for(let a=t-i;a>=e;a-=i)s=Gh(a/i|0,n[a],n[a+1],s);return s&&Tr(s,s.next)&&(cs(s),s=s.next),s}function Ni(n,e){if(!n)return n;e||(e=n);let t=n,i;do if(i=!1,!t.steiner&&(Tr(t,t.next)||_t(t.prev,t,t.next)===0)){if(cs(t),t=e=t.prev,t===t.next)break;i=!0}else t=t.next;while(i||t!==e);return e}function os(n,e,t,i,r,s,a){if(!n)return;!a&&s&&Yf(n,i,r,s);let o=n;for(;n.prev!==n.next;){let c=n.prev,h=n.next;if(s?kf(n,i,r,s):Uf(n)){e.push(c.i,n.i,h.i),cs(n),n=h.next,o=h.next;continue}if(n=h,n===o){a?a===1?(n=Bf(Ni(n),e),os(n,e,t,i,r,s,2)):a===2&&Hf(n,e,t,i,r,s):os(Ni(n),e,t,i,r,s,1);break}}}function Uf(n){let e=n.prev,t=n,i=n.next;if(_t(e,t,i)>=0)return!1;let r=e.x,s=t.x,a=i.x,o=e.y,c=t.y,h=i.y,u=Math.min(r,s,a),f=Math.min(o,c,h),d=Math.max(r,s,a),p=Math.max(o,c,h),g=i.next;for(;g!==e;){if(g.x>=u&&g.x<=d&&g.y>=f&&g.y<=p&&zr(r,o,s,c,a,h,g.x,g.y)&&_t(g.prev,g,g.next)>=0)return!1;g=g.next}return!0}function kf(n,e,t,i){let r=n.prev,s=n,a=n.next;if(_t(r,s,a)>=0)return!1;let o=r.x,c=s.x,h=a.x,u=r.y,f=s.y,d=a.y,p=Math.min(o,c,h),g=Math.min(u,f,d),y=Math.max(o,c,h),m=Math.max(u,f,d),l=Yl(p,g,e,t,i),b=Yl(y,m,e,t,i),v=n.prevZ,_=n.nextZ;for(;v&&v.z>=l&&_&&_.z<=b;){if(v.x>=p&&v.x<=y&&v.y>=g&&v.y<=m&&v!==r&&v!==a&&zr(o,u,c,f,h,d,v.x,v.y)&&_t(v.prev,v,v.next)>=0||(v=v.prevZ,_.x>=p&&_.x<=y&&_.y>=g&&_.y<=m&&_!==r&&_!==a&&zr(o,u,c,f,h,d,_.x,_.y)&&_t(_.prev,_,_.next)>=0))return!1;_=_.nextZ}for(;v&&v.z>=l;){if(v.x>=p&&v.x<=y&&v.y>=g&&v.y<=m&&v!==r&&v!==a&&zr(o,u,c,f,h,d,v.x,v.y)&&_t(v.prev,v,v.next)>=0)return!1;v=v.prevZ}for(;_&&_.z<=b;){if(_.x>=p&&_.x<=y&&_.y>=g&&_.y<=m&&_!==r&&_!==a&&zr(o,u,c,f,h,d,_.x,_.y)&&_t(_.prev,_,_.next)>=0)return!1;_=_.nextZ}return!0}function Bf(n,e){let t=n;do{let i=t.prev,r=t.next.next;!Tr(i,r)&&ku(i,t,t.next,r)&&ls(i,r)&&ls(r,i)&&(e.push(i.i,t.i,r.i),cs(t),cs(t.next),t=n=r),t=t.next}while(t!==n);return Ni(t)}function Hf(n,e,t,i,r,s){let a=n;do{let o=a.next.next;for(;o!==a.prev;){if(a.i!==o.i&&Zf(a,o)){let c=Bu(a,o);a=Ni(a,a.next),c=Ni(c,c.next),os(a,e,t,i,r,s,0),os(c,e,t,i,r,s,0);return}o=o.next}a=a.next}while(a!==n)}function zf(n,e,t,i){let r=[];for(let s=0,a=e.length;s<a;s++){let o=e[s]*i,c=s<a-1?e[s+1]*i:n.length,h=Nu(n,o,c,i,!1);h===h.next&&(h.steiner=!0),r.push($f(h))}r.sort(Vf);for(let s=0;s<r.length;s++)t=Gf(r[s],t);return t}function Vf(n,e){let t=n.x-e.x;if(t===0&&(t=n.y-e.y,t===0)){let i=(n.next.y-n.y)/(n.next.x-n.x),r=(e.next.y-e.y)/(e.next.x-e.x);t=i-r}return t}function Gf(n,e){let t=Wf(n,e);if(!t)return e;let i=Bu(t,n);return Ni(i,i.next),Ni(t,t.next)}function Wf(n,e){let t=e,i=n.x,r=n.y,s=-1/0,a;if(Tr(n,t))return t;do{if(Tr(n,t.next))return t.next;if(r<=t.y&&r>=t.next.y&&t.next.y!==t.y){let f=t.x+(r-t.y)*(t.next.x-t.x)/(t.next.y-t.y);if(f<=i&&f>s&&(s=f,a=t.x<t.next.x?t:t.next,f===i))return a}t=t.next}while(t!==e);if(!a)return null;let o=a,c=a.x,h=a.y,u=1/0;t=a;do{if(i>=t.x&&t.x>=c&&i!==t.x&&Uu(r<h?i:s,r,c,h,r<h?s:i,r,t.x,t.y)){let f=Math.abs(r-t.y)/(i-t.x);ls(t,n)&&(f<u||f===u&&(t.x>a.x||t.x===a.x&&Xf(a,t)))&&(a=t,u=f)}t=t.next}while(t!==o);return a}function Xf(n,e){return _t(n.prev,n,e.prev)<0&&_t(e.next,n,n.next)<0}function Yf(n,e,t,i){let r=n;do r.z===0&&(r.z=Yl(r.x,r.y,e,t,i)),r.prevZ=r.prev,r.nextZ=r.next,r=r.next;while(r!==n);r.prevZ.nextZ=null,r.prevZ=null,qf(r)}function qf(n){let e,t=1;do{let i=n,r;n=null;let s=null;for(e=0;i;){e++;let a=i,o=0;for(let h=0;h<t&&(o++,a=a.nextZ,!!a);h++);let c=t;for(;o>0||c>0&&a;)o!==0&&(c===0||!a||i.z<=a.z)?(r=i,i=i.nextZ,o--):(r=a,a=a.nextZ,c--),s?s.nextZ=r:n=r,r.prevZ=s,s=r;i=a}s.nextZ=null,t*=2}while(e>1);return n}function Yl(n,e,t,i,r){return n=(n-t)*r|0,e=(e-i)*r|0,n=(n|n<<8)&16711935,n=(n|n<<4)&252645135,n=(n|n<<2)&858993459,n=(n|n<<1)&1431655765,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,n|e<<1}function $f(n){let e=n,t=n;do(e.x<t.x||e.x===t.x&&e.y<t.y)&&(t=e),e=e.next;while(e!==n);return t}function Uu(n,e,t,i,r,s,a,o){return(r-a)*(e-o)>=(n-a)*(s-o)&&(n-a)*(i-o)>=(t-a)*(e-o)&&(t-a)*(s-o)>=(r-a)*(i-o)}function zr(n,e,t,i,r,s,a,o){return!(n===a&&e===o)&&Uu(n,e,t,i,r,s,a,o)}function Zf(n,e){return n.next.i!==e.i&&n.prev.i!==e.i&&!Kf(n,e)&&(ls(n,e)&&ls(e,n)&&Jf(n,e)&&(_t(n.prev,n,e.prev)||_t(n,e.prev,e))||Tr(n,e)&&_t(n.prev,n,n.next)>0&&_t(e.prev,e,e.next)>0)}function _t(n,e,t){return(e.y-n.y)*(t.x-e.x)-(e.x-n.x)*(t.y-e.y)}function Tr(n,e){return n.x===e.x&&n.y===e.y}function ku(n,e,t,i){let r=ca(_t(n,e,t)),s=ca(_t(n,e,i)),a=ca(_t(t,i,n)),o=ca(_t(t,i,e));return!!(r!==s&&a!==o||r===0&&la(n,t,e)||s===0&&la(n,i,e)||a===0&&la(t,n,i)||o===0&&la(t,e,i))}function la(n,e,t){return e.x<=Math.max(n.x,t.x)&&e.x>=Math.min(n.x,t.x)&&e.y<=Math.max(n.y,t.y)&&e.y>=Math.min(n.y,t.y)}function ca(n){return n>0?1:n<0?-1:0}function Kf(n,e){let t=n;do{if(t.i!==n.i&&t.next.i!==n.i&&t.i!==e.i&&t.next.i!==e.i&&ku(t,t.next,n,e))return!0;t=t.next}while(t!==n);return!1}function ls(n,e){return _t(n.prev,n,n.next)<0?_t(n,e,n.next)>=0&&_t(n,n.prev,e)>=0:_t(n,e,n.prev)<0||_t(n,n.next,e)<0}function Jf(n,e){let t=n,i=!1,r=(n.x+e.x)/2,s=(n.y+e.y)/2;do t.y>s!=t.next.y>s&&t.next.y!==t.y&&r<(t.next.x-t.x)*(s-t.y)/(t.next.y-t.y)+t.x&&(i=!i),t=t.next;while(t!==n);return i}function Bu(n,e){let t=ql(n.i,n.x,n.y),i=ql(e.i,e.x,e.y),r=n.next,s=e.prev;return n.next=e,e.prev=n,t.next=r,r.prev=t,i.next=t,t.prev=i,s.next=i,i.prev=s,i}function Gh(n,e,t,i){let r=ql(n,e,t);return i?(r.next=i.next,r.prev=i,i.next.prev=r,i.next=r):(r.prev=r,r.next=r),r}function cs(n){n.next.prev=n.prev,n.prev.next=n.next,n.prevZ&&(n.prevZ.nextZ=n.nextZ),n.nextZ&&(n.nextZ.prevZ=n.prevZ)}function ql(n,e,t){return{i:n,x:e,y:t,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function jf(n,e,t,i){let r=0;for(let s=e,a=t-i;s<t;s+=i)r+=(n[a]-n[s])*(n[s+1]+n[a+1]),a=s;return r}var $l=class{static triangulate(e,t,i=2){return Nf(e,t,i)}},dr=class n{static area(e){let t=e.length,i=0;for(let r=t-1,s=0;s<t;r=s++)i+=e[r].x*e[s].y-e[s].x*e[r].y;return i*.5}static isClockWise(e){return n.area(e)<0}static triangulateShape(e,t){let i=[],r=[],s=[];Wh(e),Xh(i,e);let a=e.length;t.forEach(Wh);for(let c=0;c<t.length;c++)r.push(a),a+=t[c].length,Xh(i,t[c]);let o=$l.triangulate(i,r);for(let c=0;c<o.length;c+=3)s.push(o.slice(c,c+3));return s}};function Wh(n){let e=n.length;e>2&&n[e-1].equals(n[0])&&n.pop()}function Xh(n,e){for(let t=0;t<e.length;t++)n.push(e[t].x),n.push(e[t].y)}var en=class n extends et{constructor(e=1,t=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:r};let s=e/2,a=t/2,o=Math.floor(i),c=Math.floor(r),h=o+1,u=c+1,f=e/o,d=t/c,p=[],g=[],y=[],m=[];for(let l=0;l<u;l++){let b=l*d-a;for(let v=0;v<h;v++){let _=v*f-s;g.push(_,-b,0),y.push(0,0,1),m.push(v/o),m.push(1-l/c)}}for(let l=0;l<c;l++)for(let b=0;b<o;b++){let v=b+h*l,_=b+h*(l+1),E=b+1+h*(l+1),T=b+1+h*l;p.push(v,_,T),p.push(_,E,T)}this.setIndex(p),this.setAttribute("position",new yt(g,3)),this.setAttribute("normal",new yt(y,3)),this.setAttribute("uv",new yt(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.widthSegments,e.heightSegments)}};var hs=class n extends et{constructor(e=new Mr([new xe(0,.5),new xe(-.5,-.5),new xe(.5,-.5)]),t=12){super(),this.type="ShapeGeometry",this.parameters={shapes:e,curveSegments:t};let i=[],r=[],s=[],a=[],o=0,c=0;if(Array.isArray(e)===!1)h(e);else for(let u=0;u<e.length;u++)h(e[u]),this.addGroup(o,c,u),o+=c,c=0;this.setIndex(i),this.setAttribute("position",new yt(r,3)),this.setAttribute("normal",new yt(s,3)),this.setAttribute("uv",new yt(a,2));function h(u){let f=r.length/3,d=u.extractPoints(t),p=d.shape,g=d.holes;dr.isClockWise(p)===!1&&(p=p.reverse());for(let m=0,l=g.length;m<l;m++){let b=g[m];dr.isClockWise(b)===!0&&(g[m]=b.reverse())}let y=dr.triangulateShape(p,g);for(let m=0,l=g.length;m<l;m++){let b=g[m];p=p.concat(b)}for(let m=0,l=p.length;m<l;m++){let b=p[m];r.push(b.x,b.y,0),s.push(0,0,1),a.push(b.x,b.y)}for(let m=0,l=y.length;m<l;m++){let b=y[m],v=b[0]+f,_=b[1]+f,E=b[2]+f;i.push(v,_,E),c+=3}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON(),t=this.parameters.shapes;return Qf(t,e)}static fromJSON(e,t){let i=[];for(let r=0,s=e.shapes.length;r<s;r++){let a=t[e.shapes[r]];i.push(a)}return new n(i,e.curveSegments)}};function Qf(n,e){if(e.shapes=[],Array.isArray(n))for(let t=0,i=n.length;t<i;t++){let r=n[t];e.shapes.push(r.uuid)}else e.shapes.push(n.uuid);return e}var us=class n extends et{constructor(e=new fi(new R(-1,-1,0),new R(-1,1,0),new R(1,1,0)),t=64,i=1,r=8,s=!1){super(),this.type="TubeGeometry",this.parameters={path:e,tubularSegments:t,radius:i,radialSegments:r,closed:s};let a=e.computeFrenetFrames(t,s);this.tangents=a.tangents,this.normals=a.normals,this.binormals=a.binormals;let o=new R,c=new R,h=new xe,u=new R,f=[],d=[],p=[],g=[];y(),this.setIndex(g),this.setAttribute("position",new yt(f,3)),this.setAttribute("normal",new yt(d,3)),this.setAttribute("uv",new yt(p,2));function y(){for(let v=0;v<t;v++)m(v);m(s===!1?t:0),b(),l()}function m(v){u=e.getPointAt(v/t,u);let _=a.normals[v],E=a.binormals[v];for(let T=0;T<=r;T++){let C=T/r*Math.PI*2,S=Math.sin(C),A=-Math.cos(C);c.x=A*_.x+S*E.x,c.y=A*_.y+S*E.y,c.z=A*_.z+S*E.z,c.normalize(),d.push(c.x,c.y,c.z),o.x=u.x+i*c.x,o.y=u.y+i*c.y,o.z=u.z+i*c.z,f.push(o.x,o.y,o.z)}}function l(){for(let v=1;v<=t;v++)for(let _=1;_<=r;_++){let E=(r+1)*(v-1)+(_-1),T=(r+1)*v+(_-1),C=(r+1)*v+_,S=(r+1)*(v-1)+_;g.push(E,T,S),g.push(T,C,S)}}function b(){for(let v=0;v<=t;v++)for(let _=0;_<=r;_++)h.x=v/t,h.y=_/r,p.push(h.x,h.y)}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON();return e.path=this.parameters.path.toJSON(),e}static fromJSON(e){return new n(new Xl[e.path.type]().fromJSON(e.path),e.tubularSegments,e.radius,e.radialSegments,e.closed)}};function Bi(n){let e={};for(let t in n){e[t]={};for(let i in n[t]){let r=n[t][i];if(Yh(r))r.isRenderTargetTexture?(Ce("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=r.clone();else if(Array.isArray(r))if(Yh(r[0])){let s=[];for(let a=0,o=r.length;a<o;a++)s[a]=r[a].clone();e[t][i]=s}else e[t][i]=r.slice();else e[t][i]=r}}return e}function Ht(n){let e={};for(let t=0;t<n.length;t++){let i=Bi(n[t]);for(let r in i)e[r]=i[r]}return e}function Yh(n){return n&&(n.isColor||n.isMatrix3||n.isMatrix4||n.isVector2||n.isVector3||n.isVector4||n.isTexture||n.isQuaternion)}function ep(n){let e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function vc(n){let e=n.getRenderTarget();return e===null?n.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:qe.workingColorSpace}var Hu={clone:Bi,merge:Ht},tp=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,np=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,tn=class extends qn{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=tp,this.fragmentShader=np,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Bi(e.uniforms),this.uniformsGroups=ep(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let r in this.uniforms){let a=this.uniforms[r].value;a&&a.isTexture?t.uniforms[r]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[r]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[r]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[r]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[r]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[r]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[r]={type:"m4",value:a.toArray()}:t.uniforms[r]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let i={};for(let r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}},Va=class extends tn{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}};var Ga=class extends qn{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=bu,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},Wa=class extends qn{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};var Ui=class extends Ft{constructor(e){super(),this.isLineDashedMaterial=!0,this.type="LineDashedMaterial",this.scale=1,this.dashSize=3,this.gapSize=1,this.setValues(e)}copy(e){return super.copy(e),this.scale=e.scale,this.dashSize=e.dashSize,this.gapSize=e.gapSize,this}};function ha(n,e){return!n||n.constructor===e?n:typeof e.BYTES_PER_ELEMENT=="number"?new e(n):Array.prototype.slice.call(n)}var pi=class{constructor(e,t,i,r){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=r!==void 0?r:new t.constructor(i),this.sampleValues=t,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,i=this._cachedIndex,r=t[i],s=t[i-1];n:{e:{let a;t:{i:if(!(e<r)){for(let o=i+2;;){if(r===void 0){if(e<s)break i;return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===o)break;if(s=r,r=t[++i],e<r)break e}a=t.length;break t}if(!(e>=s)){let o=t[1];e<o&&(i=2,s=o);for(let c=i-2;;){if(s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===c)break;if(r=s,s=t[--i-1],e>=s)break e}a=i,i=0;break t}break n}for(;i<a;){let o=i+a>>>1;e<t[o]?a=o:i=o+1}if(r=t[i],s=t[i-1],s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===void 0)return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,s,r)}return this.interpolate_(i,s,e,r)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,i=this.sampleValues,r=this.valueSize,s=e*r;for(let a=0;a!==r;++a)t[a]=i[s+a];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},Xa=class extends pi{constructor(e,t,i,r){super(e,t,i,r),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:zl,endingEnd:zl}}intervalChanged_(e,t,i){let r=this.parameterPositions,s=e-2,a=e+1,o=r[s],c=r[a];if(o===void 0)switch(this.getSettings_().endingStart){case Vl:s=e,o=2*t-i;break;case Gl:s=r.length-2,o=t+r[s]-r[s+1];break;default:s=e,o=i}if(c===void 0)switch(this.getSettings_().endingEnd){case Vl:a=e,c=2*i-t;break;case Gl:a=1,c=i+r[1]-r[0];break;default:a=e-1,c=t}let h=(i-t)*.5,u=this.valueSize;this._weightPrev=h/(t-o),this._weightNext=h/(c-i),this._offsetPrev=s*u,this._offsetNext=a*u}interpolate_(e,t,i,r){let s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,c=e*o,h=c-o,u=this._offsetPrev,f=this._offsetNext,d=this._weightPrev,p=this._weightNext,g=(i-t)/(r-t),y=g*g,m=y*g,l=-d*m+2*d*y-d*g,b=(1+d)*m+(-1.5-2*d)*y+(-.5+d)*g+1,v=(-1-p)*m+(1.5+p)*y+.5*g,_=p*m-p*y;for(let E=0;E!==o;++E)s[E]=l*a[u+E]+b*a[h+E]+v*a[c+E]+_*a[f+E];return s}},Ya=class extends pi{constructor(e,t,i,r){super(e,t,i,r)}interpolate_(e,t,i,r){let s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,c=e*o,h=c-o,u=(i-t)/(r-t),f=1-u;for(let d=0;d!==o;++d)s[d]=a[h+d]*f+a[c+d]*u;return s}},qa=class extends pi{constructor(e,t,i,r){super(e,t,i,r)}interpolate_(e){return this.copySampleValue_(e-1)}},$a=class extends pi{interpolate_(e,t,i,r){let s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,c=e*o,h=c-o,u=this.settings||this.DefaultSettings_,f=u.inTangents,d=u.outTangents;if(!f||!d){let y=(i-t)/(r-t),m=1-y;for(let l=0;l!==o;++l)s[l]=a[h+l]*m+a[c+l]*y;return s}let p=o*2,g=e-1;for(let y=0;y!==o;++y){let m=a[h+y],l=a[c+y],b=g*p+y*2,v=d[b],_=d[b+1],E=e*p+y*2,T=f[E],C=f[E+1],S=(i-t)/(r-t),A,L,I,N,G;for(let W=0;W<8;W++){A=S*S,L=A*S,I=1-S,N=I*I,G=N*I;let H=G*t+3*N*S*v+3*I*A*T+L*r-i;if(Math.abs(H)<1e-10)break;let V=3*N*(v-t)+6*I*S*(T-v)+3*A*(r-T);if(Math.abs(V)<1e-10)break;S=S-H/V,S=Math.max(0,Math.min(1,S))}s[y]=G*m+3*N*S*_+3*I*A*C+L*l}return s}},nn=class{constructor(e,t,i,r){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=ha(t,this.TimeBufferType),this.values=ha(i,this.ValueBufferType),this.setInterpolation(r||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,i;if(t.toJSON!==this.toJSON)i=t.toJSON(e);else{i={name:e.name,times:ha(e.times,Array),values:ha(e.values,Array)};let r=e.getInterpolation();r!==e.DefaultInterpolation&&(i.interpolation=r)}return i.type=e.ValueTypeName,i}InterpolantFactoryMethodDiscrete(e){return new qa(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Ya(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Xa(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new $a(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.settings=this.settings),t}setInterpolation(e){let t;switch(e){case Wr:t=this.InterpolantFactoryMethodDiscrete;break;case wa:t=this.InterpolantFactoryMethodLinear;break;case fa:t=this.InterpolantFactoryMethodSmooth;break;case Hl:t=this.InterpolantFactoryMethodBezier;break}if(t===void 0){let i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(i);return Ce("KeyframeTrack:",i),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Wr;case this.InterpolantFactoryMethodLinear:return wa;case this.InterpolantFactoryMethodSmooth:return fa;case this.InterpolantFactoryMethodBezier:return Hl}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let i=0,r=t.length;i!==r;++i)t[i]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let i=0,r=t.length;i!==r;++i)t[i]*=e}return this}trim(e,t){let i=this.times,r=i.length,s=0,a=r-1;for(;s!==r&&i[s]<e;)++s;for(;a!==-1&&i[a]>t;)--a;if(++a,s!==0||a!==r){s>=a&&(a=Math.max(a,1),s=a-1);let o=this.getValueSize();this.times=i.slice(s,a),this.values=this.values.slice(s*o,a*o)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(Re("KeyframeTrack: Invalid value size in track.",this),e=!1);let i=this.times,r=this.values,s=i.length;s===0&&(Re("KeyframeTrack: Track is empty.",this),e=!1);let a=null;for(let o=0;o!==s;o++){let c=i[o];if(typeof c=="number"&&isNaN(c)){Re("KeyframeTrack: Time is not a valid number.",this,o,c),e=!1;break}if(a!==null&&a>c){Re("KeyframeTrack: Out of order keys.",this,o,c,a),e=!1;break}a=c}if(r!==void 0&&cf(r))for(let o=0,c=r.length;o!==c;++o){let h=r[o];if(isNaN(h)){Re("KeyframeTrack: Value is not a valid number.",this,o,h),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),i=this.getValueSize(),r=this.getInterpolation()===fa,s=e.length-1,a=1;for(let o=1;o<s;++o){let c=!1,h=e[o],u=e[o+1];if(h!==u&&(o!==1||h!==e[0]))if(r)c=!0;else{let f=o*i,d=f-i,p=f+i;for(let g=0;g!==i;++g){let y=t[f+g];if(y!==t[d+g]||y!==t[p+g]){c=!0;break}}}if(c){if(o!==a){e[a]=e[o];let f=o*i,d=a*i;for(let p=0;p!==i;++p)t[d+p]=t[f+p]}++a}}if(s>0){e[a]=e[s];for(let o=s*i,c=a*i,h=0;h!==i;++h)t[c+h]=t[o+h];++a}return a!==e.length?(this.times=e.slice(0,a),this.values=t.slice(0,a*i)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),i=this.constructor,r=new i(this.name,e,t);return r.createInterpolant=this.createInterpolant,r}};nn.prototype.ValueTypeName="";nn.prototype.TimeBufferType=Float32Array;nn.prototype.ValueBufferType=Float32Array;nn.prototype.DefaultInterpolation=wa;var mi=class extends nn{constructor(e,t,i){super(e,t,i)}};mi.prototype.ValueTypeName="bool";mi.prototype.ValueBufferType=Array;mi.prototype.DefaultInterpolation=Wr;mi.prototype.InterpolantFactoryMethodLinear=void 0;mi.prototype.InterpolantFactoryMethodSmooth=void 0;var Za=class extends nn{constructor(e,t,i,r){super(e,t,i,r)}};Za.prototype.ValueTypeName="color";var Ka=class extends nn{constructor(e,t,i,r){super(e,t,i,r)}};Ka.prototype.ValueTypeName="number";var Ja=class extends pi{constructor(e,t,i,r){super(e,t,i,r)}interpolate_(e,t,i,r){let s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,c=(i-t)/(r-t),h=e*o;for(let u=h+o;h!==u;h+=4)Rn.slerpFlat(s,0,a,h-o,a,h,c);return s}},ds=class extends nn{constructor(e,t,i,r){super(e,t,i,r)}InterpolantFactoryMethodLinear(e){return new Ja(this.times,this.values,this.getValueSize(),e)}};ds.prototype.ValueTypeName="quaternion";ds.prototype.InterpolantFactoryMethodSmooth=void 0;var gi=class extends nn{constructor(e,t,i){super(e,t,i)}};gi.prototype.ValueTypeName="string";gi.prototype.ValueBufferType=Array;gi.prototype.DefaultInterpolation=Wr;gi.prototype.InterpolantFactoryMethodLinear=void 0;gi.prototype.InterpolantFactoryMethodSmooth=void 0;var ja=class extends nn{constructor(e,t,i,r){super(e,t,i,r)}};ja.prototype.ValueTypeName="vector";var pa={enabled:!1,files:{},add:function(n,e){this.enabled!==!1&&(qh(n)||(this.files[n]=e))},get:function(n){if(this.enabled!==!1&&!qh(n))return this.files[n]},remove:function(n){delete this.files[n]},clear:function(){this.files={}}};function qh(n){try{let e=n.slice(n.indexOf(":")+1);return new URL(e).protocol==="blob:"}catch{return!1}}var Qa=class{constructor(e,t,i){let r=this,s=!1,a=0,o=0,c,h=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=i,this._abortController=null,this.itemStart=function(u){o++,s===!1&&r.onStart!==void 0&&r.onStart(u,a,o),s=!0},this.itemEnd=function(u){a++,r.onProgress!==void 0&&r.onProgress(u,a,o),a===o&&(s=!1,r.onLoad!==void 0&&r.onLoad())},this.itemError=function(u){r.onError!==void 0&&r.onError(u)},this.resolveURL=function(u){return c?c(u):u},this.setURLModifier=function(u){return c=u,this},this.addHandler=function(u,f){return h.push(u,f),this},this.removeHandler=function(u){let f=h.indexOf(u);return f!==-1&&h.splice(f,2),this},this.getHandler=function(u){for(let f=0,d=h.length;f<d;f+=2){let p=h[f],g=h[f+1];if(p.global&&(p.lastIndex=0),p.test(u))return g}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},zu=new Qa,Er=class{constructor(e){this.manager=e!==void 0?e:zu,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(e,t){let i=this;return new Promise(function(r,s){i.load(e,r,t,s)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};Er.DEFAULT_MATERIAL_NAME="__DEFAULT";var lr=new WeakMap,eo=class extends Er{constructor(e){super(e)}load(e,t,i,r){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let s=this,a=pa.get(`image:${e}`);if(a!==void 0){if(a.complete===!0)s.manager.itemStart(e),setTimeout(function(){t&&t(a),s.manager.itemEnd(e)},0);else{let f=lr.get(a);f===void 0&&(f=[],lr.set(a,f)),f.push({onLoad:t,onError:r})}return a}let o=fr("img");function c(){u(),t&&t(this);let f=lr.get(this)||[];for(let d=0;d<f.length;d++){let p=f[d];p.onLoad&&p.onLoad(this)}lr.delete(this),s.manager.itemEnd(e)}function h(f){u(),r&&r(f),pa.remove(`image:${e}`);let d=lr.get(this)||[];for(let p=0;p<d.length;p++){let g=d[p];g.onError&&g.onError(f)}lr.delete(this),s.manager.itemError(e),s.manager.itemEnd(e)}function u(){o.removeEventListener("load",c,!1),o.removeEventListener("error",h,!1)}return o.addEventListener("load",c,!1),o.addEventListener("error",h,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(o.crossOrigin=this.crossOrigin),pa.add(`image:${e}`,o),s.manager.itemStart(e),o.src=e,o}};var fs=class extends Er{constructor(e){super(e)}load(e,t,i,r){let s=new Lt,a=new eo(this.manager);return a.setCrossOrigin(this.crossOrigin),a.setPath(this.path),a.load(e,function(o){s.image=o,s.needsUpdate=!0,t!==void 0&&t(s)},i,r),s}};var ua=new R,da=new Rn,Tn=new R,ps=class extends Yt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ft,this.projectionMatrix=new ft,this.projectionMatrixInverse=new ft,this.coordinateSystem=pn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(ua,da,Tn),Tn.x===1&&Tn.y===1&&Tn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ua,da,Tn.set(1,1,1)).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorld.decompose(ua,da,Tn),Tn.x===1&&Tn.y===1&&Tn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ua,da,Tn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},li=new R,$h=new xe,Zh=new xe,Wt=class extends ps{constructor(e=50,t=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=Ra*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(dl*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Ra*2*Math.atan(Math.tan(dl*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){li.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(li.x,li.y).multiplyScalar(-e/li.z),li.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(li.x,li.y).multiplyScalar(-e/li.z)}getViewSize(e,t){return this.getViewBounds(e,$h,Zh),t.subVectors(Zh,$h)}setViewOffset(e,t,i,r,s,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(dl*.5*this.fov)/this.zoom,i=2*t,r=this.aspect*i,s=-.5*r,a=this.view;if(this.view!==null&&this.view.enabled){let c=a.fullWidth,h=a.fullHeight;s+=a.offsetX*r/c,t-=a.offsetY*i/h,r*=a.width/c,i*=a.height/h}let o=this.filmOffset;o!==0&&(s+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,t,t-i,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}};var _i=class extends ps{constructor(e=-1,t=1,i=1,r=-1,s=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=r,this.near=s,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,r,s,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2,s=i-e,a=i+e,o=r+t,c=r-t;if(this.view!==null&&this.view.enabled){let h=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=h*this.view.offsetX,a=s+h*this.view.width,o-=u*this.view.offsetY,c=o-u*this.view.height}this.projectionMatrix.makeOrthographic(s,a,o,c,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}};var cr=-90,hr=1,to=class extends Yt{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new Wt(cr,hr,e,t);r.layers=this.layers,this.add(r);let s=new Wt(cr,hr,e,t);s.layers=this.layers,this.add(s);let a=new Wt(cr,hr,e,t);a.layers=this.layers,this.add(a);let o=new Wt(cr,hr,e,t);o.layers=this.layers,this.add(o);let c=new Wt(cr,hr,e,t);c.layers=this.layers,this.add(c);let h=new Wt(cr,hr,e,t);h.layers=this.layers,this.add(h)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[i,r,s,a,o,c]=t;for(let h of t)this.remove(h);if(e===pn)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(e===qr)i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let h of t)this.add(h),h.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[s,a,o,c,h,u]=this.children,f=e.getRenderTarget(),d=e.getActiveCubeFace(),p=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;let y=i.texture.generateMipmaps;i.texture.generateMipmaps=!1;let m=!1;e.isWebGLRenderer===!0?m=e.state.buffers.depth.getReversed():m=e.reversedDepthBuffer,e.setRenderTarget(i,0,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(i,1,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(i,2,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(i,3,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),e.setRenderTarget(i,4,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,h),i.texture.generateMipmaps=y,e.setRenderTarget(i,5,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,u),e.setRenderTarget(f,d,p),e.xr.enabled=g,i.texture.needsPMREMUpdate=!0}},no=class extends Wt{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}};var bc="\\[\\]\\.:\\/",ip=new RegExp("["+bc+"]","g"),Mc="[^"+bc+"]",rp="[^"+bc.replace("\\.","")+"]",sp=/((?:WC+[\/:])*)/.source.replace("WC",Mc),ap=/(WCOD+)?/.source.replace("WCOD",rp),op=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Mc),lp=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Mc),cp=new RegExp("^"+sp+ap+op+lp+"$"),hp=["material","materials","bones","map"],Zl=class{constructor(e,t,i){let r=i||ut.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,r)}getValue(e,t){this.bind();let i=this._targetGroup.nCachedObjects_,r=this._bindings[i];r!==void 0&&r.getValue(e,t)}setValue(e,t){let i=this._bindings;for(let r=this._targetGroup.nCachedObjects_,s=i.length;r!==s;++r)i[r].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].unbind()}},ut=class n{constructor(e,t,i){this.path=t,this.parsedPath=i||n.parseTrackName(t),this.node=n.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,i){return e&&e.isAnimationObjectGroup?new n.Composite(e,t,i):new n(e,t,i)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(ip,"")}static parseTrackName(e){let t=cp.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let i={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},r=i.nodeName&&i.nodeName.lastIndexOf(".");if(r!==void 0&&r!==-1){let s=i.nodeName.substring(r+1);hp.indexOf(s)!==-1&&(i.nodeName=i.nodeName.substring(0,r),i.objectName=s)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return i}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let i=e.skeleton.getBoneByName(t);if(i!==void 0)return i}if(e.children){let i=function(s){for(let a=0;a<s.length;a++){let o=s[a];if(o.name===t||o.uuid===t)return o;let c=i(o.children);if(c)return c}return null},r=i(e.children);if(r)return r}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)e[t++]=i[r]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)i[r]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)i[r]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)i[r]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,i=t.objectName,r=t.propertyName,s=t.propertyIndex;if(e||(e=n.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){Ce("PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let h=t.objectIndex;switch(i){case"materials":if(!e.material){Re("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){Re("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){Re("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let u=0;u<e.length;u++)if(e[u].name===h){h=u;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){Re("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){Re("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[i]===void 0){Re("PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[i]}if(h!==void 0){if(e[h]===void 0){Re("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[h]}}let a=e[r];if(a===void 0){let h=t.nodeName;Re("PropertyBinding: Trying to update property for track: "+h+"."+r+" but it wasn't found.",e);return}let o=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?o=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(s!==void 0){if(r==="morphTargetInfluences"){if(!e.geometry){Re("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){Re("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[s]!==void 0&&(s=e.morphTargetDictionary[s])}c=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=s}else a.fromArray!==void 0&&a.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(c=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=r;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};ut.Composite=Zl;ut.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};ut.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};ut.prototype.GetterByBindingType=[ut.prototype._getValue_direct,ut.prototype._getValue_array,ut.prototype._getValue_arrayElement,ut.prototype._getValue_toArray];ut.prototype.SetterByBindingTypeAndVersioning=[[ut.prototype._setValue_direct,ut.prototype._setValue_direct_setNeedsUpdate,ut.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[ut.prototype._setValue_array,ut.prototype._setValue_array_setNeedsUpdate,ut.prototype._setValue_array_setMatrixWorldNeedsUpdate],[ut.prototype._setValue_arrayElement,ut.prototype._setValue_arrayElement_setNeedsUpdate,ut.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[ut.prototype._setValue_fromArray,ut.prototype._setValue_fromArray_setNeedsUpdate,ut.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var Ax=new Float32Array(1);var Kh=new ft,wr=class{constructor(e,t,i=0,r=1/0){this.ray=new xr(e,t),this.near=i,this.far=r,this.camera=null,this.layers=new gr,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,(t.near+t.far)/(t.near-t.far)).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):Re("Raycaster: Unsupported camera type: "+t.type)}setFromXRController(e){return Kh.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Kh),this}intersectObject(e,t=!0,i=[]){return Kl(e,this,i,t),i.sort(Jh),i}intersectObjects(e,t=!0,i=[]){for(let r=0,s=e.length;r<s;r++)Kl(e[r],this,i,t);return i.sort(Jh),i}};function Jh(n,e){return n.distance-e.distance}function Kl(n,e,t,i){let r=!0;if(n.layers.test(e.layers)&&n.raycast(e,t)===!1&&(r=!1),r===!0&&i===!0){let s=n.children;for(let a=0,o=s.length;a<o;a++)Kl(s[a],e,t,!0)}}var Jl=class n{static{n.prototype.isMatrix2=!0}constructor(e,t,i,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,i,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let i=0;i<4;i++)this.elements[i]=e[i+t];return this}set(e,t,i,r){let s=this.elements;return s[0]=e,s[2]=t,s[1]=i,s[3]=r,this}};function Tc(n,e,t,i){let r=up(i);switch(t){case mc:return n*e;case _c:return n*e/r.components*r.byteLength;case co:return n*e/r.components*r.byteLength;case Si:return n*e*2/r.components*r.byteLength;case ho:return n*e*2/r.components*r.byteLength;case gc:return n*e*3/r.components*r.byteLength;case hn:return n*e*4/r.components*r.byteLength;case uo:return n*e*4/r.components*r.byteLength;case ys:case xs:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case Ss:case vs:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case po:case go:return Math.max(n,16)*Math.max(e,8)/4;case fo:case mo:return Math.max(n,8)*Math.max(e,8)/2;case _o:case yo:case So:case vo:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case xo:case bs:case bo:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Mo:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case To:return Math.floor((n+4)/5)*Math.floor((e+3)/4)*16;case Eo:return Math.floor((n+4)/5)*Math.floor((e+4)/5)*16;case wo:return Math.floor((n+5)/6)*Math.floor((e+4)/5)*16;case Ao:return Math.floor((n+5)/6)*Math.floor((e+5)/6)*16;case Co:return Math.floor((n+7)/8)*Math.floor((e+4)/5)*16;case Ro:return Math.floor((n+7)/8)*Math.floor((e+5)/6)*16;case Io:return Math.floor((n+7)/8)*Math.floor((e+7)/8)*16;case Po:return Math.floor((n+9)/10)*Math.floor((e+4)/5)*16;case Do:return Math.floor((n+9)/10)*Math.floor((e+5)/6)*16;case Lo:return Math.floor((n+9)/10)*Math.floor((e+7)/8)*16;case Oo:return Math.floor((n+9)/10)*Math.floor((e+9)/10)*16;case Fo:return Math.floor((n+11)/12)*Math.floor((e+9)/10)*16;case No:return Math.floor((n+11)/12)*Math.floor((e+11)/12)*16;case Uo:case ko:case Bo:return Math.ceil(n/4)*Math.ceil(e/4)*16;case Ho:case zo:return Math.ceil(n/4)*Math.ceil(e/4)*8;case Ms:case Vo:return Math.ceil(n/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function up(n){switch(n){case rn:case uc:return{byteLength:1,components:1};case Cr:case dc:case Dn:return{byteLength:2,components:1};case oo:case lo:return{byteLength:2,components:4};case yn:case ao:case xn:return{byteLength:4,components:1};case fc:case pc:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${n}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"184"}}));typeof window<"u"&&(window.__THREE__?Ce("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="184");function hd(){let n=null,e=!1,t=null,i=null;function r(s,a){t(s,a),i=n.requestAnimationFrame(r)}return{start:function(){e!==!0&&t!==null&&n!==null&&(i=n.requestAnimationFrame(r),e=!0)},stop:function(){n!==null&&n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(s){t=s},setContext:function(s){n=s}}}function fp(n){let e=new WeakMap;function t(o,c){let h=o.array,u=o.usage,f=h.byteLength,d=n.createBuffer();n.bindBuffer(c,d),n.bufferData(c,h,u),o.onUploadCallback();let p;if(h instanceof Float32Array)p=n.FLOAT;else if(typeof Float16Array<"u"&&h instanceof Float16Array)p=n.HALF_FLOAT;else if(h instanceof Uint16Array)o.isFloat16BufferAttribute?p=n.HALF_FLOAT:p=n.UNSIGNED_SHORT;else if(h instanceof Int16Array)p=n.SHORT;else if(h instanceof Uint32Array)p=n.UNSIGNED_INT;else if(h instanceof Int32Array)p=n.INT;else if(h instanceof Int8Array)p=n.BYTE;else if(h instanceof Uint8Array)p=n.UNSIGNED_BYTE;else if(h instanceof Uint8ClampedArray)p=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+h);return{buffer:d,type:p,bytesPerElement:h.BYTES_PER_ELEMENT,version:o.version,size:f}}function i(o,c,h){let u=c.array,f=c.updateRanges;if(n.bindBuffer(h,o),f.length===0)n.bufferSubData(h,0,u);else{f.sort((p,g)=>p.start-g.start);let d=0;for(let p=1;p<f.length;p++){let g=f[d],y=f[p];y.start<=g.start+g.count+1?g.count=Math.max(g.count,y.start+y.count-g.start):(++d,f[d]=y)}f.length=d+1;for(let p=0,g=f.length;p<g;p++){let y=f[p];n.bufferSubData(h,y.start*u.BYTES_PER_ELEMENT,u,y.start,y.count)}c.clearUpdateRanges()}c.onUploadCallback()}function r(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function s(o){o.isInterleavedBufferAttribute&&(o=o.data);let c=e.get(o);c&&(n.deleteBuffer(c.buffer),e.delete(o))}function a(o,c){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let u=e.get(o);(!u||u.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let h=e.get(o);if(h===void 0)e.set(o,t(o,c));else if(h.version<o.version){if(h.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(h.buffer,o,c),h.version=o.version}}return{get:r,remove:s,update:a}}var pp=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,mp=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,gp=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,_p=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,yp=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,xp=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Sp=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT )
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN )
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,vp=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,bp=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,Mp=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Tp=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Ep=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,wp=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Ap=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Cp=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Rp=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,Ip=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Pp=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Dp=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Lp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,Op=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Fp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,Np=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,Up=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,kp=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Bp=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,Hp=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,zp=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Vp=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Gp=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Wp="gl_FragColor = linearToOutputTexel( gl_FragColor );",Xp=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Yp=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,qp=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,$p=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Zp=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS

		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Kp=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Jp=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,jp=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Qp=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,em=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,tm=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,nm=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,im=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,rm=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,sm=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,am=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,om=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,lm=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,cm=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,hm=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,um=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,dm=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
		vec3 iridescenceFresnelDielectric;
		vec3 iridescenceFresnelMetallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
vec3 BRDF_GGX_Multiscatter( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 singleScatter = BRDF_GGX( lightDir, viewDir, normal, material );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 dfgV = texture2D( dfgLUT, vec2( material.roughness, dotNV ) ).rg;
	vec2 dfgL = texture2D( dfgLUT, vec2( material.roughness, dotNL ) ).rg;
	vec3 FssEss_V = material.specularColorBlended * dfgV.x + material.specularF90 * dfgV.y;
	vec3 FssEss_L = material.specularColorBlended * dfgL.x + material.specularF90 * dfgL.y;
	float Ess_V = dfgV.x + dfgV.y;
	float Ess_L = dfgL.x + dfgL.y;
	float Ems_V = 1.0 - Ess_V;
	float Ems_L = 1.0 - Ess_L;
	vec3 Favg = material.specularColorBlended + ( 1.0 - material.specularColorBlended ) * 0.047619;
	vec3 Fms = FssEss_V * FssEss_L * Favg / ( 1.0 - Ems_V * Ems_L * Favg + EPSILON );
	float compensationFactor = Ems_V * Ems_L;
	vec3 multiScatter = Fms * compensationFactor;
	return singleScatter + multiScatter;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN

		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );

		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );

		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );

		irradiance *= sheenEnergyComp;

	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX_Multiscatter( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnelDielectric, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceFresnelMetallic, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,fm=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( material.iridescenceFresnelDielectric, material.iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = inverseTransformDirection( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,pm=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,mm=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,gm=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,_m=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,ym=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,xm=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Sm=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,vm=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,bm=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Mm=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Tm=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Em=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,wm=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Am=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Cm=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Rm=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Im=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Pm=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Dm=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Lm=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Om=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Fm=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Nm=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Um=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,km=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Bm=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Hm=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,zm=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Vm=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Gm=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER

		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {

	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,Wm=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Xm=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Ym=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,qm=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,$m=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Zm=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Km=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif

				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,Jm=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,jm=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Qm=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,eg=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,tg=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,ng=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,ig=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,rg=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,sg=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,ag=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,og=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,lg=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,cg=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,hg=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,ug=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,dg=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,fg=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,pg=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,mg=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,gg=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,_g=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,yg=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,xg=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Sg=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,vg=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,bg=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Mg=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,Tg=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Eg=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,wg=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Ag=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Cg=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Rg=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Ig=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Pg=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Dg=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Lg=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Og=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Fg=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Ng=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Ug=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,kg=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Bg=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN

		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;

	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Hg=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,zg=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Vg=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Gg=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Wg=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Xg=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Yg=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,qg=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,He={alphahash_fragment:pp,alphahash_pars_fragment:mp,alphamap_fragment:gp,alphamap_pars_fragment:_p,alphatest_fragment:yp,alphatest_pars_fragment:xp,aomap_fragment:Sp,aomap_pars_fragment:vp,batching_pars_vertex:bp,batching_vertex:Mp,begin_vertex:Tp,beginnormal_vertex:Ep,bsdfs:wp,iridescence_fragment:Ap,bumpmap_pars_fragment:Cp,clipping_planes_fragment:Rp,clipping_planes_pars_fragment:Ip,clipping_planes_pars_vertex:Pp,clipping_planes_vertex:Dp,color_fragment:Lp,color_pars_fragment:Op,color_pars_vertex:Fp,color_vertex:Np,common:Up,cube_uv_reflection_fragment:kp,defaultnormal_vertex:Bp,displacementmap_pars_vertex:Hp,displacementmap_vertex:zp,emissivemap_fragment:Vp,emissivemap_pars_fragment:Gp,colorspace_fragment:Wp,colorspace_pars_fragment:Xp,envmap_fragment:Yp,envmap_common_pars_fragment:qp,envmap_pars_fragment:$p,envmap_pars_vertex:Zp,envmap_physical_pars_fragment:am,envmap_vertex:Kp,fog_vertex:Jp,fog_pars_vertex:jp,fog_fragment:Qp,fog_pars_fragment:em,gradientmap_pars_fragment:tm,lightmap_pars_fragment:nm,lights_lambert_fragment:im,lights_lambert_pars_fragment:rm,lights_pars_begin:sm,lights_toon_fragment:om,lights_toon_pars_fragment:lm,lights_phong_fragment:cm,lights_phong_pars_fragment:hm,lights_physical_fragment:um,lights_physical_pars_fragment:dm,lights_fragment_begin:fm,lights_fragment_maps:pm,lights_fragment_end:mm,lightprobes_pars_fragment:gm,logdepthbuf_fragment:_m,logdepthbuf_pars_fragment:ym,logdepthbuf_pars_vertex:xm,logdepthbuf_vertex:Sm,map_fragment:vm,map_pars_fragment:bm,map_particle_fragment:Mm,map_particle_pars_fragment:Tm,metalnessmap_fragment:Em,metalnessmap_pars_fragment:wm,morphinstance_vertex:Am,morphcolor_vertex:Cm,morphnormal_vertex:Rm,morphtarget_pars_vertex:Im,morphtarget_vertex:Pm,normal_fragment_begin:Dm,normal_fragment_maps:Lm,normal_pars_fragment:Om,normal_pars_vertex:Fm,normal_vertex:Nm,normalmap_pars_fragment:Um,clearcoat_normal_fragment_begin:km,clearcoat_normal_fragment_maps:Bm,clearcoat_pars_fragment:Hm,iridescence_pars_fragment:zm,opaque_fragment:Vm,packing:Gm,premultiplied_alpha_fragment:Wm,project_vertex:Xm,dithering_fragment:Ym,dithering_pars_fragment:qm,roughnessmap_fragment:$m,roughnessmap_pars_fragment:Zm,shadowmap_pars_fragment:Km,shadowmap_pars_vertex:Jm,shadowmap_vertex:jm,shadowmask_pars_fragment:Qm,skinbase_vertex:eg,skinning_pars_vertex:tg,skinning_vertex:ng,skinnormal_vertex:ig,specularmap_fragment:rg,specularmap_pars_fragment:sg,tonemapping_fragment:ag,tonemapping_pars_fragment:og,transmission_fragment:lg,transmission_pars_fragment:cg,uv_pars_fragment:hg,uv_pars_vertex:ug,uv_vertex:dg,worldpos_vertex:fg,background_vert:pg,background_frag:mg,backgroundCube_vert:gg,backgroundCube_frag:_g,cube_vert:yg,cube_frag:xg,depth_vert:Sg,depth_frag:vg,distance_vert:bg,distance_frag:Mg,equirect_vert:Tg,equirect_frag:Eg,linedashed_vert:wg,linedashed_frag:Ag,meshbasic_vert:Cg,meshbasic_frag:Rg,meshlambert_vert:Ig,meshlambert_frag:Pg,meshmatcap_vert:Dg,meshmatcap_frag:Lg,meshnormal_vert:Og,meshnormal_frag:Fg,meshphong_vert:Ng,meshphong_frag:Ug,meshphysical_vert:kg,meshphysical_frag:Bg,meshtoon_vert:Hg,meshtoon_frag:zg,points_vert:Vg,points_frag:Gg,shadow_vert:Wg,shadow_frag:Xg,sprite_vert:Yg,sprite_frag:qg},ue={common:{diffuse:{value:new Ke(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Oe},alphaMap:{value:null},alphaMapTransform:{value:new Oe},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Oe}},envmap:{envMap:{value:null},envMapRotation:{value:new Oe},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Oe}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Oe}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Oe},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Oe},normalScale:{value:new xe(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Oe},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Oe}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Oe}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Oe}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ke(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new R},probesMax:{value:new R},probesResolution:{value:new R}},points:{diffuse:{value:new Ke(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Oe},alphaTest:{value:0},uvTransform:{value:new Oe}},sprite:{diffuse:{value:new Ke(16777215)},opacity:{value:1},center:{value:new xe(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Oe},alphaMap:{value:null},alphaMapTransform:{value:new Oe},alphaTest:{value:0}}},On={basic:{uniforms:Ht([ue.common,ue.specularmap,ue.envmap,ue.aomap,ue.lightmap,ue.fog]),vertexShader:He.meshbasic_vert,fragmentShader:He.meshbasic_frag},lambert:{uniforms:Ht([ue.common,ue.specularmap,ue.envmap,ue.aomap,ue.lightmap,ue.emissivemap,ue.bumpmap,ue.normalmap,ue.displacementmap,ue.fog,ue.lights,{emissive:{value:new Ke(0)},envMapIntensity:{value:1}}]),vertexShader:He.meshlambert_vert,fragmentShader:He.meshlambert_frag},phong:{uniforms:Ht([ue.common,ue.specularmap,ue.envmap,ue.aomap,ue.lightmap,ue.emissivemap,ue.bumpmap,ue.normalmap,ue.displacementmap,ue.fog,ue.lights,{emissive:{value:new Ke(0)},specular:{value:new Ke(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:He.meshphong_vert,fragmentShader:He.meshphong_frag},standard:{uniforms:Ht([ue.common,ue.envmap,ue.aomap,ue.lightmap,ue.emissivemap,ue.bumpmap,ue.normalmap,ue.displacementmap,ue.roughnessmap,ue.metalnessmap,ue.fog,ue.lights,{emissive:{value:new Ke(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:He.meshphysical_vert,fragmentShader:He.meshphysical_frag},toon:{uniforms:Ht([ue.common,ue.aomap,ue.lightmap,ue.emissivemap,ue.bumpmap,ue.normalmap,ue.displacementmap,ue.gradientmap,ue.fog,ue.lights,{emissive:{value:new Ke(0)}}]),vertexShader:He.meshtoon_vert,fragmentShader:He.meshtoon_frag},matcap:{uniforms:Ht([ue.common,ue.bumpmap,ue.normalmap,ue.displacementmap,ue.fog,{matcap:{value:null}}]),vertexShader:He.meshmatcap_vert,fragmentShader:He.meshmatcap_frag},points:{uniforms:Ht([ue.points,ue.fog]),vertexShader:He.points_vert,fragmentShader:He.points_frag},dashed:{uniforms:Ht([ue.common,ue.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:He.linedashed_vert,fragmentShader:He.linedashed_frag},depth:{uniforms:Ht([ue.common,ue.displacementmap]),vertexShader:He.depth_vert,fragmentShader:He.depth_frag},normal:{uniforms:Ht([ue.common,ue.bumpmap,ue.normalmap,ue.displacementmap,{opacity:{value:1}}]),vertexShader:He.meshnormal_vert,fragmentShader:He.meshnormal_frag},sprite:{uniforms:Ht([ue.sprite,ue.fog]),vertexShader:He.sprite_vert,fragmentShader:He.sprite_frag},background:{uniforms:{uvTransform:{value:new Oe},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:He.background_vert,fragmentShader:He.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Oe}},vertexShader:He.backgroundCube_vert,fragmentShader:He.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:He.cube_vert,fragmentShader:He.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:He.equirect_vert,fragmentShader:He.equirect_frag},distance:{uniforms:Ht([ue.common,ue.displacementmap,{referencePosition:{value:new R},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:He.distance_vert,fragmentShader:He.distance_frag},shadow:{uniforms:Ht([ue.lights,ue.fog,{color:{value:new Ke(0)},opacity:{value:1}}]),vertexShader:He.shadow_vert,fragmentShader:He.shadow_frag}};On.physical={uniforms:Ht([On.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Oe},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Oe},clearcoatNormalScale:{value:new xe(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Oe},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Oe},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Oe},sheen:{value:0},sheenColor:{value:new Ke(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Oe},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Oe},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Oe},transmissionSamplerSize:{value:new xe},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Oe},attenuationDistance:{value:0},attenuationColor:{value:new Ke(0)},specularColor:{value:new Ke(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Oe},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Oe},anisotropyVector:{value:new xe},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Oe}}]),vertexShader:He.meshphysical_vert,fragmentShader:He.meshphysical_frag};var Xo={r:0,b:0,g:0},$g=new ft,ud=new Oe;ud.set(-1,0,0,0,1,0,0,0,1);function Zg(n,e,t,i,r,s){let a=new Ke(0),o=r===!0?0:1,c,h,u=null,f=0,d=null;function p(b){let v=b.isScene===!0?b.background:null;if(v&&v.isTexture){let _=b.backgroundBlurriness>0;v=e.get(v,_)}return v}function g(b){let v=!1,_=p(b);_===null?m(a,o):_&&_.isColor&&(m(_,1),v=!0);let E=n.xr.getEnvironmentBlendMode();E==="additive"?t.buffers.color.setClear(0,0,0,1,s):E==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,s),(n.autoClear||v)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function y(b,v){let _=p(v);_&&(_.isCubeTexture||_.mapping===gs)?(h===void 0&&(h=new dt(new vr(1,1,1),new tn({name:"BackgroundCubeMaterial",uniforms:Bi(On.backgroundCube.uniforms),vertexShader:On.backgroundCube.vertexShader,fragmentShader:On.backgroundCube.fragmentShader,side:Vt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(E,T,C){this.matrixWorld.copyPosition(C.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(h)),h.material.uniforms.envMap.value=_,h.material.uniforms.backgroundBlurriness.value=v.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=v.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4($g.makeRotationFromEuler(v.backgroundRotation)).transpose(),_.isCubeTexture&&_.isRenderTargetTexture===!1&&h.material.uniforms.backgroundRotation.value.premultiply(ud),h.material.toneMapped=qe.getTransfer(_.colorSpace)!==Qe,(u!==_||f!==_.version||d!==n.toneMapping)&&(h.material.needsUpdate=!0,u=_,f=_.version,d=n.toneMapping),h.layers.enableAll(),b.unshift(h,h.geometry,h.material,0,0,null)):_&&_.isTexture&&(c===void 0&&(c=new dt(new en(2,2),new tn({name:"BackgroundMaterial",uniforms:Bi(On.background.uniforms),vertexShader:On.background.vertexShader,fragmentShader:On.background.fragmentShader,side:Yn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(c)),c.material.uniforms.t2D.value=_,c.material.uniforms.backgroundIntensity.value=v.backgroundIntensity,c.material.toneMapped=qe.getTransfer(_.colorSpace)!==Qe,_.matrixAutoUpdate===!0&&_.updateMatrix(),c.material.uniforms.uvTransform.value.copy(_.matrix),(u!==_||f!==_.version||d!==n.toneMapping)&&(c.material.needsUpdate=!0,u=_,f=_.version,d=n.toneMapping),c.layers.enableAll(),b.unshift(c,c.geometry,c.material,0,0,null))}function m(b,v){b.getRGB(Xo,vc(n)),t.buffers.color.setClear(Xo.r,Xo.g,Xo.b,v,s)}function l(){h!==void 0&&(h.geometry.dispose(),h.material.dispose(),h=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return a},setClearColor:function(b,v=1){a.set(b),o=v,m(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(b){o=b,m(a,o)},render:g,addToRenderList:y,dispose:l}}function Kg(n,e){let t=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},r=d(null),s=r,a=!1;function o(I,N,G,W,F){let H=!1,V=f(I,W,G,N);s!==V&&(s=V,h(s.object)),H=p(I,W,G,F),H&&g(I,W,G,F),F!==null&&e.update(F,n.ELEMENT_ARRAY_BUFFER),(H||a)&&(a=!1,_(I,N,G,W),F!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(F).buffer))}function c(){return n.createVertexArray()}function h(I){return n.bindVertexArray(I)}function u(I){return n.deleteVertexArray(I)}function f(I,N,G,W){let F=W.wireframe===!0,H=i[N.id];H===void 0&&(H={},i[N.id]=H);let V=I.isInstancedMesh===!0?I.id:0,j=H[V];j===void 0&&(j={},H[V]=j);let Q=j[G.id];Q===void 0&&(Q={},j[G.id]=Q);let de=Q[F];return de===void 0&&(de=d(c()),Q[F]=de),de}function d(I){let N=[],G=[],W=[];for(let F=0;F<t;F++)N[F]=0,G[F]=0,W[F]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:N,enabledAttributes:G,attributeDivisors:W,object:I,attributes:{},index:null}}function p(I,N,G,W){let F=s.attributes,H=N.attributes,V=0,j=G.getAttributes();for(let Q in j)if(j[Q].location>=0){let be=F[Q],we=H[Q];if(we===void 0&&(Q==="instanceMatrix"&&I.instanceMatrix&&(we=I.instanceMatrix),Q==="instanceColor"&&I.instanceColor&&(we=I.instanceColor)),be===void 0||be.attribute!==we||we&&be.data!==we.data)return!0;V++}return s.attributesNum!==V||s.index!==W}function g(I,N,G,W){let F={},H=N.attributes,V=0,j=G.getAttributes();for(let Q in j)if(j[Q].location>=0){let be=H[Q];be===void 0&&(Q==="instanceMatrix"&&I.instanceMatrix&&(be=I.instanceMatrix),Q==="instanceColor"&&I.instanceColor&&(be=I.instanceColor));let we={};we.attribute=be,be&&be.data&&(we.data=be.data),F[Q]=we,V++}s.attributes=F,s.attributesNum=V,s.index=W}function y(){let I=s.newAttributes;for(let N=0,G=I.length;N<G;N++)I[N]=0}function m(I){l(I,0)}function l(I,N){let G=s.newAttributes,W=s.enabledAttributes,F=s.attributeDivisors;G[I]=1,W[I]===0&&(n.enableVertexAttribArray(I),W[I]=1),F[I]!==N&&(n.vertexAttribDivisor(I,N),F[I]=N)}function b(){let I=s.newAttributes,N=s.enabledAttributes;for(let G=0,W=N.length;G<W;G++)N[G]!==I[G]&&(n.disableVertexAttribArray(G),N[G]=0)}function v(I,N,G,W,F,H,V){V===!0?n.vertexAttribIPointer(I,N,G,F,H):n.vertexAttribPointer(I,N,G,W,F,H)}function _(I,N,G,W){y();let F=W.attributes,H=G.getAttributes(),V=N.defaultAttributeValues;for(let j in H){let Q=H[j];if(Q.location>=0){let de=F[j];if(de===void 0&&(j==="instanceMatrix"&&I.instanceMatrix&&(de=I.instanceMatrix),j==="instanceColor"&&I.instanceColor&&(de=I.instanceColor)),de!==void 0){let be=de.normalized,we=de.itemSize,$e=e.get(de);if($e===void 0)continue;let tt=$e.buffer,ke=$e.type,Z=$e.bytesPerElement,me=ke===n.INT||ke===n.UNSIGNED_INT||de.gpuType===ao;if(de.isInterleavedBufferAttribute){let re=de.data,Ie=re.stride,Fe=de.offset;if(re.isInstancedInterleavedBuffer){for(let Pe=0;Pe<Q.locationSize;Pe++)l(Q.location+Pe,re.meshPerAttribute);I.isInstancedMesh!==!0&&W._maxInstanceCount===void 0&&(W._maxInstanceCount=re.meshPerAttribute*re.count)}else for(let Pe=0;Pe<Q.locationSize;Pe++)m(Q.location+Pe);n.bindBuffer(n.ARRAY_BUFFER,tt);for(let Pe=0;Pe<Q.locationSize;Pe++)v(Q.location+Pe,we/Q.locationSize,ke,be,Ie*Z,(Fe+we/Q.locationSize*Pe)*Z,me)}else{if(de.isInstancedBufferAttribute){for(let re=0;re<Q.locationSize;re++)l(Q.location+re,de.meshPerAttribute);I.isInstancedMesh!==!0&&W._maxInstanceCount===void 0&&(W._maxInstanceCount=de.meshPerAttribute*de.count)}else for(let re=0;re<Q.locationSize;re++)m(Q.location+re);n.bindBuffer(n.ARRAY_BUFFER,tt);for(let re=0;re<Q.locationSize;re++)v(Q.location+re,we/Q.locationSize,ke,be,we*Z,we/Q.locationSize*re*Z,me)}}else if(V!==void 0){let be=V[j];if(be!==void 0)switch(be.length){case 2:n.vertexAttrib2fv(Q.location,be);break;case 3:n.vertexAttrib3fv(Q.location,be);break;case 4:n.vertexAttrib4fv(Q.location,be);break;default:n.vertexAttrib1fv(Q.location,be)}}}}b()}function E(){A();for(let I in i){let N=i[I];for(let G in N){let W=N[G];for(let F in W){let H=W[F];for(let V in H)u(H[V].object),delete H[V];delete W[F]}}delete i[I]}}function T(I){if(i[I.id]===void 0)return;let N=i[I.id];for(let G in N){let W=N[G];for(let F in W){let H=W[F];for(let V in H)u(H[V].object),delete H[V];delete W[F]}}delete i[I.id]}function C(I){for(let N in i){let G=i[N];for(let W in G){let F=G[W];if(F[I.id]===void 0)continue;let H=F[I.id];for(let V in H)u(H[V].object),delete H[V];delete F[I.id]}}}function S(I){for(let N in i){let G=i[N],W=I.isInstancedMesh===!0?I.id:0,F=G[W];if(F!==void 0){for(let H in F){let V=F[H];for(let j in V)u(V[j].object),delete V[j];delete F[H]}delete G[W],Object.keys(G).length===0&&delete i[N]}}}function A(){L(),a=!0,s!==r&&(s=r,h(s.object))}function L(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:o,reset:A,resetDefaultState:L,dispose:E,releaseStatesOfGeometry:T,releaseStatesOfObject:S,releaseStatesOfProgram:C,initAttributes:y,enableAttribute:m,disableUnusedAttributes:b}}function Jg(n,e,t){let i;function r(c){i=c}function s(c,h){n.drawArrays(i,c,h),t.update(h,i,1)}function a(c,h,u){u!==0&&(n.drawArraysInstanced(i,c,h,u),t.update(h,i,u))}function o(c,h,u){if(u===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,c,0,h,0,u);let d=0;for(let p=0;p<u;p++)d+=h[p];t.update(d,i,1)}this.setMode=r,this.render=s,this.renderInstances=a,this.renderMultiDraw=o}function jg(n,e,t,i){let r;function s(){if(r!==void 0)return r;if(e.has("EXT_texture_filter_anisotropic")===!0){let C=e.get("EXT_texture_filter_anisotropic");r=n.getParameter(C.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function a(C){return!(C!==hn&&i.convert(C)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(C){let S=C===Dn&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(C!==rn&&i.convert(C)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE)&&C!==xn&&!S)}function c(C){if(C==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";C="mediump"}return C==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let h=t.precision!==void 0?t.precision:"highp",u=c(h);u!==h&&(Ce("WebGLRenderer:",h,"not supported, using",u,"instead."),h=u);let f=t.logarithmicDepthBuffer===!0,d=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control");t.reversedDepthBuffer===!0&&d===!1&&Ce("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let p=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),g=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),y=n.getParameter(n.MAX_TEXTURE_SIZE),m=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),l=n.getParameter(n.MAX_VERTEX_ATTRIBS),b=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),v=n.getParameter(n.MAX_VARYING_VECTORS),_=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),E=n.getParameter(n.MAX_SAMPLES),T=n.getParameter(n.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:c,textureFormatReadable:a,textureTypeReadable:o,precision:h,logarithmicDepthBuffer:f,reversedDepthBuffer:d,maxTextures:p,maxVertexTextures:g,maxTextureSize:y,maxCubemapSize:m,maxAttributes:l,maxVertexUniforms:b,maxVaryings:v,maxFragmentUniforms:_,maxSamples:E,samples:T}}function Qg(n){let e=this,t=null,i=0,r=!1,s=!1,a=new En,o=new Oe,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(f,d){let p=f.length!==0||d||i!==0||r;return r=d,i=f.length,p},this.beginShadows=function(){s=!0,u(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(f,d){t=u(f,d,0)},this.setState=function(f,d,p){let g=f.clippingPlanes,y=f.clipIntersection,m=f.clipShadows,l=n.get(f);if(!r||g===null||g.length===0||s&&!m)s?u(null):h();else{let b=s?0:i,v=b*4,_=l.clippingState||null;c.value=_,_=u(g,d,v,p);for(let E=0;E!==v;++E)_[E]=t[E];l.clippingState=_,this.numIntersection=y?this.numPlanes:0,this.numPlanes+=b}};function h(){c.value!==t&&(c.value=t,c.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function u(f,d,p,g){let y=f!==null?f.length:0,m=null;if(y!==0){if(m=c.value,g!==!0||m===null){let l=p+y*4,b=d.matrixWorldInverse;o.getNormalMatrix(b),(m===null||m.length<l)&&(m=new Float32Array(l));for(let v=0,_=p;v!==y;++v,_+=4)a.copy(f[v]).applyMatrix4(b,o),a.normal.toArray(m,_),m[_+3]=a.constant}c.value=m,c.needsUpdate=!0}return e.numPlanes=y,e.numIntersection=0,m}}var vi=4,Vu=[.125,.215,.35,.446,.526,.582],Hi=20,e0=256,Ts=new _i,Gu=new Ke,Ec=null,wc=0,Ac=0,Cc=!1,t0=new R,qo=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._sigmas=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,i=.1,r=100,s={}){let{size:a=256,position:o=t0}=s;Ec=this._renderer.getRenderTarget(),wc=this._renderer.getActiveCubeFace(),Ac=this._renderer.getActiveMipmapLevel(),Cc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);let c=this._allocateTargets();return c.depthBuffer=!0,this._sceneToCubeUV(e,i,r,c,o),t>0&&this._blur(c,0,0,t),this._applyPMREM(c),this._cleanup(c),c}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Yu(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Xu(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(Ec,wc,Ac),this._renderer.xr.enabled=Cc,e.scissorTest=!1,Ir(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===yi||e.mapping===ki?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Ec=this._renderer.getRenderTarget(),wc=this._renderer.getActiveCubeFace(),Ac=this._renderer.getActiveMipmapLevel(),Cc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:ce,minFilter:ce,generateMipmaps:!1,type:Dn,format:hn,colorSpace:Xr,depthBuffer:!1},r=Wu(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Wu(e,t,i);let{_lodMax:s}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods,sigmas:this._sigmas}=n0(s)),this._blurMaterial=r0(s,e,t),this._ggxMaterial=i0(s,e,t)}return r}_compileMaterial(e){let t=new dt(new et,e);this._renderer.compile(t,Ts)}_sceneToCubeUV(e,t,i,r,s){let c=new Wt(90,1,t,i),h=[1,-1,1,1,1,1],u=[1,1,1,-1,-1,-1],f=this._renderer,d=f.autoClear,p=f.toneMapping;f.getClearColor(Gu),f.toneMapping=gn,f.autoClear=!1,f.state.buffers.depth.getReversed()&&(f.setRenderTarget(r),f.clearDepth(),f.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new dt(new vr,new Ot({name:"PMREM.Background",side:Vt,depthWrite:!1,depthTest:!1})));let y=this._backgroundBox,m=y.material,l=!1,b=e.background;b?b.isColor&&(m.color.copy(b),e.background=null,l=!0):(m.color.copy(Gu),l=!0);for(let v=0;v<6;v++){let _=v%3;_===0?(c.up.set(0,h[v],0),c.position.set(s.x,s.y,s.z),c.lookAt(s.x+u[v],s.y,s.z)):_===1?(c.up.set(0,0,h[v]),c.position.set(s.x,s.y,s.z),c.lookAt(s.x,s.y+u[v],s.z)):(c.up.set(0,h[v],0),c.position.set(s.x,s.y,s.z),c.lookAt(s.x,s.y,s.z+u[v]));let E=this._cubeSize;Ir(r,_*E,v>2?E:0,E,E),f.setRenderTarget(r),l&&f.render(y,c),f.render(e,c)}f.toneMapping=p,f.autoClear=d,e.background=b}_textureToCubeUV(e,t){let i=this._renderer,r=e.mapping===yi||e.mapping===ki;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=Yu()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Xu());let s=r?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=s;let o=s.uniforms;o.envMap.value=e;let c=this._cubeSize;Ir(t,0,0,3*c,2*c),i.setRenderTarget(t),i.render(a,Ts)}_applyPMREM(e){let t=this._renderer,i=t.autoClear;t.autoClear=!1;let r=this._lodMeshes.length;for(let s=1;s<r;s++)this._applyGGXFilter(e,s-1,s);t.autoClear=i}_applyGGXFilter(e,t,i){let r=this._renderer,s=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[i];o.material=a;let c=a.uniforms,h=i/(this._lodMeshes.length-1),u=t/(this._lodMeshes.length-1),f=Math.sqrt(h*h-u*u),d=0+h*1.25,p=f*d,{_lodMax:g}=this,y=this._sizeLods[i],m=3*y*(i>g-vi?i-g+vi:0),l=4*(this._cubeSize-y);c.envMap.value=e.texture,c.roughness.value=p,c.mipInt.value=g-t,Ir(s,m,l,3*y,2*y),r.setRenderTarget(s),r.render(o,Ts),c.envMap.value=s.texture,c.roughness.value=0,c.mipInt.value=g-i,Ir(e,m,l,3*y,2*y),r.setRenderTarget(e),r.render(o,Ts)}_blur(e,t,i,r,s){let a=this._pingPongRenderTarget;this._halfBlur(e,a,t,i,r,"latitudinal",s),this._halfBlur(a,e,i,i,r,"longitudinal",s)}_halfBlur(e,t,i,r,s,a,o){let c=this._renderer,h=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&Re("blur direction must be either latitudinal or longitudinal!");let u=3,f=this._lodMeshes[r];f.material=h;let d=h.uniforms,p=this._sizeLods[i]-1,g=isFinite(s)?Math.PI/(2*p):2*Math.PI/(2*Hi-1),y=s/g,m=isFinite(s)?1+Math.floor(u*y):Hi;m>Hi&&Ce(`sigmaRadians, ${s}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${Hi}`);let l=[],b=0;for(let C=0;C<Hi;++C){let S=C/y,A=Math.exp(-S*S/2);l.push(A),C===0?b+=A:C<m&&(b+=2*A)}for(let C=0;C<l.length;C++)l[C]=l[C]/b;d.envMap.value=e.texture,d.samples.value=m,d.weights.value=l,d.latitudinal.value=a==="latitudinal",o&&(d.poleAxis.value=o);let{_lodMax:v}=this;d.dTheta.value=g,d.mipInt.value=v-i;let _=this._sizeLods[r],E=3*_*(r>v-vi?r-v+vi:0),T=4*(this._cubeSize-_);Ir(t,E,T,3*_,2*_),c.setRenderTarget(t),c.render(f,Ts)}};function n0(n){let e=[],t=[],i=[],r=n,s=n-vi+1+Vu.length;for(let a=0;a<s;a++){let o=Math.pow(2,r);e.push(o);let c=1/o;a>n-vi?c=Vu[a-n+vi-1]:a===0&&(c=0),t.push(c);let h=1/(o-2),u=-h,f=1+h,d=[u,u,f,u,f,f,u,u,f,f,u,f],p=6,g=6,y=3,m=2,l=1,b=new Float32Array(y*g*p),v=new Float32Array(m*g*p),_=new Float32Array(l*g*p);for(let T=0;T<p;T++){let C=T%3*2/3-1,S=T>2?0:-1,A=[C,S,0,C+2/3,S,0,C+2/3,S+1,0,C,S,0,C+2/3,S+1,0,C,S+1,0];b.set(A,y*g*T),v.set(d,m*g*T);let L=[T,T,T,T,T,T];_.set(L,l*g*T)}let E=new et;E.setAttribute("position",new Xt(b,y)),E.setAttribute("uv",new Xt(v,m)),E.setAttribute("faceIndex",new Xt(_,l)),i.push(new dt(E,null)),r>vi&&r--}return{lodMeshes:i,sizeLods:e,sigmas:t}}function Wu(n,e,t){let i=new jt(n,e,t);return i.texture.mapping=gs,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Ir(n,e,t,i,r){n.viewport.set(e,t,i,r),n.scissor.set(e,t,i,r)}function i0(n,e,t){return new tn({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:e0,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Zo(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:Pn,depthTest:!1,depthWrite:!1})}function r0(n,e,t){let i=new Float32Array(Hi),r=new R(0,1,0);return new tn({name:"SphericalGaussianBlur",defines:{n:Hi,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:r}},vertexShader:Zo(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Pn,depthTest:!1,depthWrite:!1})}function Xu(){return new tn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Zo(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Pn,depthTest:!1,depthWrite:!1})}function Yu(){return new tn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Zo(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Pn,depthTest:!1,depthWrite:!1})}function Zo(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}var $o=class extends jt{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let i={width:e,height:e,depth:1},r=[i,i,i,i,i,i];this.texture=new es(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new vr(5,5,5),s=new tn({name:"CubemapFromEquirect",uniforms:Bi(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Vt,blending:Pn});s.uniforms.tEquirect.value=t;let a=new dt(r,s),o=t.minFilter;return t.minFilter===_n&&(t.minFilter=ce),new to(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,i=!0,r=!0){let s=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,i,r);e.setRenderTarget(s)}};function s0(n){let e=new WeakMap,t=new WeakMap,i=null;function r(d,p=!1){return d==null?null:p?a(d):s(d)}function s(d){if(d&&d.isTexture){let p=d.mapping;if(p===io||p===ro)if(e.has(d)){let g=e.get(d).texture;return o(g,d.mapping)}else{let g=d.image;if(g&&g.height>0){let y=new $o(g.height);return y.fromEquirectangularTexture(n,d),e.set(d,y),d.addEventListener("dispose",h),o(y.texture,d.mapping)}else return null}}return d}function a(d){if(d&&d.isTexture){let p=d.mapping,g=p===io||p===ro,y=p===yi||p===ki;if(g||y){let m=t.get(d),l=m!==void 0?m.texture.pmremVersion:0;if(d.isRenderTargetTexture&&d.pmremVersion!==l)return i===null&&(i=new qo(n)),m=g?i.fromEquirectangular(d,m):i.fromCubemap(d,m),m.texture.pmremVersion=d.pmremVersion,t.set(d,m),m.texture;if(m!==void 0)return m.texture;{let b=d.image;return g&&b&&b.height>0||y&&b&&c(b)?(i===null&&(i=new qo(n)),m=g?i.fromEquirectangular(d):i.fromCubemap(d),m.texture.pmremVersion=d.pmremVersion,t.set(d,m),d.addEventListener("dispose",u),m.texture):null}}}return d}function o(d,p){return p===io?d.mapping=yi:p===ro&&(d.mapping=ki),d}function c(d){let p=0,g=6;for(let y=0;y<g;y++)d[y]!==void 0&&p++;return p===g}function h(d){let p=d.target;p.removeEventListener("dispose",h);let g=e.get(p);g!==void 0&&(e.delete(p),g.dispose())}function u(d){let p=d.target;p.removeEventListener("dispose",u);let g=t.get(p);g!==void 0&&(t.delete(p),g.dispose())}function f(){e=new WeakMap,t=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:r,dispose:f}}function a0(n){let e={};function t(i){if(e[i]!==void 0)return e[i];let r=n.getExtension(i);return e[i]=r,r}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){let r=t(i);return r===null&&Ca("WebGLRenderer: "+i+" extension not supported."),r}}}function o0(n,e,t,i){let r={},s=new WeakMap;function a(f){let d=f.target;d.index!==null&&e.remove(d.index);for(let g in d.attributes)e.remove(d.attributes[g]);d.removeEventListener("dispose",a),delete r[d.id];let p=s.get(d);p&&(e.remove(p),s.delete(d)),i.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function o(f,d){return r[d.id]===!0||(d.addEventListener("dispose",a),r[d.id]=!0,t.memory.geometries++),d}function c(f){let d=f.attributes;for(let p in d)e.update(d[p],n.ARRAY_BUFFER)}function h(f){let d=[],p=f.index,g=f.attributes.position,y=0;if(g===void 0)return;if(p!==null){let b=p.array;y=p.version;for(let v=0,_=b.length;v<_;v+=3){let E=b[v+0],T=b[v+1],C=b[v+2];d.push(E,T,T,C,C,E)}}else{let b=g.array;y=g.version;for(let v=0,_=b.length/3-1;v<_;v+=3){let E=v+0,T=v+1,C=v+2;d.push(E,T,T,C,C,E)}}let m=new(g.count>=65535?Jr:Kr)(d,1);m.version=y;let l=s.get(f);l&&e.remove(l),s.set(f,m)}function u(f){let d=s.get(f);if(d){let p=f.index;p!==null&&d.version<p.version&&h(f)}else h(f);return s.get(f)}return{get:o,update:c,getWireframeAttribute:u}}function l0(n,e,t){let i;function r(f){i=f}let s,a;function o(f){s=f.type,a=f.bytesPerElement}function c(f,d){n.drawElements(i,d,s,f*a),t.update(d,i,1)}function h(f,d,p){p!==0&&(n.drawElementsInstanced(i,d,s,f*a,p),t.update(d,i,p))}function u(f,d,p){if(p===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,d,0,s,f,0,p);let y=0;for(let m=0;m<p;m++)y+=d[m];t.update(y,i,1)}this.setMode=r,this.setIndex=o,this.render=c,this.renderInstances=h,this.renderMultiDraw=u}function c0(n){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(s,a,o){switch(t.calls++,a){case n.TRIANGLES:t.triangles+=o*(s/3);break;case n.LINES:t.lines+=o*(s/2);break;case n.LINE_STRIP:t.lines+=o*(s-1);break;case n.LINE_LOOP:t.lines+=o*s;break;case n.POINTS:t.points+=o*s;break;default:Re("WebGLInfo: Unknown draw mode:",a);break}}function r(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:r,update:i}}function h0(n,e,t){let i=new WeakMap,r=new bt;function s(a,o,c){let h=a.morphTargetInfluences,u=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,f=u!==void 0?u.length:0,d=i.get(o);if(d===void 0||d.count!==f){let A=function(){C.dispose(),i.delete(o),o.removeEventListener("dispose",A)};d!==void 0&&d.texture.dispose();let p=o.morphAttributes.position!==void 0,g=o.morphAttributes.normal!==void 0,y=o.morphAttributes.color!==void 0,m=o.morphAttributes.position||[],l=o.morphAttributes.normal||[],b=o.morphAttributes.color||[],v=0;p===!0&&(v=1),g===!0&&(v=2),y===!0&&(v=3);let _=o.attributes.position.count*v,E=1;_>e.maxTextureSize&&(E=Math.ceil(_/e.maxTextureSize),_=e.maxTextureSize);let T=new Float32Array(_*E*4*f),C=new Zr(T,_,E,f);C.type=xn,C.needsUpdate=!0;let S=v*4;for(let L=0;L<f;L++){let I=m[L],N=l[L],G=b[L],W=_*E*4*L;for(let F=0;F<I.count;F++){let H=F*S;p===!0&&(r.fromBufferAttribute(I,F),T[W+H+0]=r.x,T[W+H+1]=r.y,T[W+H+2]=r.z,T[W+H+3]=0),g===!0&&(r.fromBufferAttribute(N,F),T[W+H+4]=r.x,T[W+H+5]=r.y,T[W+H+6]=r.z,T[W+H+7]=0),y===!0&&(r.fromBufferAttribute(G,F),T[W+H+8]=r.x,T[W+H+9]=r.y,T[W+H+10]=r.z,T[W+H+11]=G.itemSize===4?r.w:1)}}d={count:f,texture:C,size:new xe(_,E)},i.set(o,d),o.addEventListener("dispose",A)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)c.getUniforms().setValue(n,"morphTexture",a.morphTexture,t);else{let p=0;for(let y=0;y<h.length;y++)p+=h[y];let g=o.morphTargetsRelative?1:1-p;c.getUniforms().setValue(n,"morphTargetBaseInfluence",g),c.getUniforms().setValue(n,"morphTargetInfluences",h)}c.getUniforms().setValue(n,"morphTargetsTexture",d.texture,t),c.getUniforms().setValue(n,"morphTargetsTextureSize",d.size)}return{update:s}}function u0(n,e,t,i,r){let s=new WeakMap;function a(h){let u=r.render.frame,f=h.geometry,d=e.get(h,f);if(s.get(d)!==u&&(e.update(d),s.set(d,u)),h.isInstancedMesh&&(h.hasEventListener("dispose",c)===!1&&h.addEventListener("dispose",c),s.get(h)!==u&&(t.update(h.instanceMatrix,n.ARRAY_BUFFER),h.instanceColor!==null&&t.update(h.instanceColor,n.ARRAY_BUFFER),s.set(h,u))),h.isSkinnedMesh){let p=h.skeleton;s.get(p)!==u&&(p.update(),s.set(p,u))}return d}function o(){s=new WeakMap}function c(h){let u=h.target;u.removeEventListener("dispose",c),i.releaseStatesOfObject(u),t.remove(u.instanceMatrix),u.instanceColor!==null&&t.remove(u.instanceColor)}return{update:a,dispose:o}}var d0={[ic]:"LINEAR_TONE_MAPPING",[rc]:"REINHARD_TONE_MAPPING",[sc]:"CINEON_TONE_MAPPING",[ac]:"ACES_FILMIC_TONE_MAPPING",[lc]:"AGX_TONE_MAPPING",[cc]:"NEUTRAL_TONE_MAPPING",[oc]:"CUSTOM_TONE_MAPPING"};function f0(n,e,t,i,r){let s=new jt(e,t,{type:n,depthBuffer:i,stencilBuffer:r,depthTexture:i?new $n(e,t):void 0}),a=new jt(e,t,{type:Dn,depthBuffer:!1,stencilBuffer:!1}),o=new et;o.setAttribute("position",new yt([-1,3,0,-1,-1,0,3,-1,0],3)),o.setAttribute("uv",new yt([0,2,0,0,2,0],2));let c=new Va({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),h=new dt(o,c),u=new _i(-1,1,1,-1,0,1),f=null,d=null,p=!1,g,y=null,m=[],l=!1;this.setSize=function(b,v){s.setSize(b,v),a.setSize(b,v);for(let _=0;_<m.length;_++){let E=m[_];E.setSize&&E.setSize(b,v)}},this.setEffects=function(b){m=b,l=m.length>0&&m[0].isRenderPass===!0;let v=s.width,_=s.height;for(let E=0;E<m.length;E++){let T=m[E];T.setSize&&T.setSize(v,_)}},this.begin=function(b,v){if(p||b.toneMapping===gn&&m.length===0)return!1;if(y=v,v!==null){let _=v.width,E=v.height;(s.width!==_||s.height!==E)&&this.setSize(_,E)}return l===!1&&b.setRenderTarget(s),g=b.toneMapping,b.toneMapping=gn,!0},this.hasRenderPass=function(){return l},this.end=function(b,v){b.toneMapping=g,p=!0;let _=s,E=a;for(let T=0;T<m.length;T++){let C=m[T];if(C.enabled!==!1&&(C.render(b,E,_,v),C.needsSwap!==!1)){let S=_;_=E,E=S}}if(f!==b.outputColorSpace||d!==b.toneMapping){f=b.outputColorSpace,d=b.toneMapping,c.defines={},qe.getTransfer(f)===Qe&&(c.defines.SRGB_TRANSFER="");let T=d0[d];T&&(c.defines[T]=""),c.needsUpdate=!0}c.uniforms.tDiffuse.value=_.texture,b.setRenderTarget(y),b.render(h,u),y=null,p=!1},this.isCompositing=function(){return p},this.dispose=function(){s.depthTexture&&s.depthTexture.dispose(),s.dispose(),a.dispose(),o.dispose(),c.dispose()}}var dd=new Lt,Pc=new $n(1,1),fd=new Zr,pd=new Da,md=new es,qu=[],$u=[],Zu=new Float32Array(16),Ku=new Float32Array(9),Ju=new Float32Array(4);function Dr(n,e,t){let i=n[0];if(i<=0||i>0)return n;let r=e*t,s=qu[r];if(s===void 0&&(s=new Float32Array(r),qu[r]=s),e!==0){i.toArray(s,0);for(let a=1,o=0;a!==e;++a)o+=t,n[a].toArray(s,o)}return s}function Rt(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function It(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function Ko(n,e){let t=$u[e];t===void 0&&(t=new Int32Array(e),$u[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function p0(n,e){let t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function m0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Rt(t,e))return;n.uniform2fv(this.addr,e),It(t,e)}}function g0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Rt(t,e))return;n.uniform3fv(this.addr,e),It(t,e)}}function _0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Rt(t,e))return;n.uniform4fv(this.addr,e),It(t,e)}}function y0(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Rt(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),It(t,e)}else{if(Rt(t,i))return;Ju.set(i),n.uniformMatrix2fv(this.addr,!1,Ju),It(t,i)}}function x0(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Rt(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),It(t,e)}else{if(Rt(t,i))return;Ku.set(i),n.uniformMatrix3fv(this.addr,!1,Ku),It(t,i)}}function S0(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Rt(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),It(t,e)}else{if(Rt(t,i))return;Zu.set(i),n.uniformMatrix4fv(this.addr,!1,Zu),It(t,i)}}function v0(n,e){let t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function b0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Rt(t,e))return;n.uniform2iv(this.addr,e),It(t,e)}}function M0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Rt(t,e))return;n.uniform3iv(this.addr,e),It(t,e)}}function T0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Rt(t,e))return;n.uniform4iv(this.addr,e),It(t,e)}}function E0(n,e){let t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function w0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Rt(t,e))return;n.uniform2uiv(this.addr,e),It(t,e)}}function A0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Rt(t,e))return;n.uniform3uiv(this.addr,e),It(t,e)}}function C0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Rt(t,e))return;n.uniform4uiv(this.addr,e),It(t,e)}}function R0(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r);let s;this.type===n.SAMPLER_2D_SHADOW?(Pc.compareFunction=t.isReversedDepthBuffer()?Wo:Go,s=Pc):s=dd,t.setTexture2D(e||s,r)}function I0(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture3D(e||pd,r)}function P0(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTextureCube(e||md,r)}function D0(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture2DArray(e||fd,r)}function L0(n){switch(n){case 5126:return p0;case 35664:return m0;case 35665:return g0;case 35666:return _0;case 35674:return y0;case 35675:return x0;case 35676:return S0;case 5124:case 35670:return v0;case 35667:case 35671:return b0;case 35668:case 35672:return M0;case 35669:case 35673:return T0;case 5125:return E0;case 36294:return w0;case 36295:return A0;case 36296:return C0;case 35678:case 36198:case 36298:case 36306:case 35682:return R0;case 35679:case 36299:case 36307:return I0;case 35680:case 36300:case 36308:case 36293:return P0;case 36289:case 36303:case 36311:case 36292:return D0}}function O0(n,e){n.uniform1fv(this.addr,e)}function F0(n,e){let t=Dr(e,this.size,2);n.uniform2fv(this.addr,t)}function N0(n,e){let t=Dr(e,this.size,3);n.uniform3fv(this.addr,t)}function U0(n,e){let t=Dr(e,this.size,4);n.uniform4fv(this.addr,t)}function k0(n,e){let t=Dr(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function B0(n,e){let t=Dr(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function H0(n,e){let t=Dr(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function z0(n,e){n.uniform1iv(this.addr,e)}function V0(n,e){n.uniform2iv(this.addr,e)}function G0(n,e){n.uniform3iv(this.addr,e)}function W0(n,e){n.uniform4iv(this.addr,e)}function X0(n,e){n.uniform1uiv(this.addr,e)}function Y0(n,e){n.uniform2uiv(this.addr,e)}function q0(n,e){n.uniform3uiv(this.addr,e)}function $0(n,e){n.uniform4uiv(this.addr,e)}function Z0(n,e,t){let i=this.cache,r=e.length,s=Ko(t,r);Rt(i,s)||(n.uniform1iv(this.addr,s),It(i,s));let a;this.type===n.SAMPLER_2D_SHADOW?a=Pc:a=dd;for(let o=0;o!==r;++o)t.setTexture2D(e[o]||a,s[o])}function K0(n,e,t){let i=this.cache,r=e.length,s=Ko(t,r);Rt(i,s)||(n.uniform1iv(this.addr,s),It(i,s));for(let a=0;a!==r;++a)t.setTexture3D(e[a]||pd,s[a])}function J0(n,e,t){let i=this.cache,r=e.length,s=Ko(t,r);Rt(i,s)||(n.uniform1iv(this.addr,s),It(i,s));for(let a=0;a!==r;++a)t.setTextureCube(e[a]||md,s[a])}function j0(n,e,t){let i=this.cache,r=e.length,s=Ko(t,r);Rt(i,s)||(n.uniform1iv(this.addr,s),It(i,s));for(let a=0;a!==r;++a)t.setTexture2DArray(e[a]||fd,s[a])}function Q0(n){switch(n){case 5126:return O0;case 35664:return F0;case 35665:return N0;case 35666:return U0;case 35674:return k0;case 35675:return B0;case 35676:return H0;case 5124:case 35670:return z0;case 35667:case 35671:return V0;case 35668:case 35672:return G0;case 35669:case 35673:return W0;case 5125:return X0;case 36294:return Y0;case 36295:return q0;case 36296:return $0;case 35678:case 36198:case 36298:case 36306:case 35682:return Z0;case 35679:case 36299:case 36307:return K0;case 35680:case 36300:case 36308:case 36293:return J0;case 36289:case 36303:case 36311:case 36292:return j0}}var Dc=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=L0(t.type)}},Lc=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Q0(t.type)}},Oc=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){let r=this.seq;for(let s=0,a=r.length;s!==a;++s){let o=r[s];o.setValue(e,t[o.id],i)}}},Rc=/(\w+)(\])?(\[|\.)?/g;function ju(n,e){n.seq.push(e),n.map[e.id]=e}function e_(n,e,t){let i=n.name,r=i.length;for(Rc.lastIndex=0;;){let s=Rc.exec(i),a=Rc.lastIndex,o=s[1],c=s[2]==="]",h=s[3];if(c&&(o=o|0),h===void 0||h==="["&&a+2===r){ju(t,h===void 0?new Dc(o,n,e):new Lc(o,n,e));break}else{let f=t.map[o];f===void 0&&(f=new Oc(o),ju(t,f)),t=f}}}var Pr=class{constructor(e,t){this.seq=[],this.map={};let i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let a=0;a<i;++a){let o=e.getActiveUniform(t,a),c=e.getUniformLocation(t,o.name);e_(o,c,this)}let r=[],s=[];for(let a of this.seq)a.type===e.SAMPLER_2D_SHADOW||a.type===e.SAMPLER_CUBE_SHADOW||a.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(a):s.push(a);r.length>0&&(this.seq=r.concat(s))}setValue(e,t,i,r){let s=this.map[t];s!==void 0&&s.setValue(e,i,r)}setOptional(e,t,i){let r=t[i];r!==void 0&&this.setValue(e,i,r)}static upload(e,t,i,r){for(let s=0,a=t.length;s!==a;++s){let o=t[s],c=i[o.id];c.needsUpdate!==!1&&o.setValue(e,c.value,r)}}static seqWithValue(e,t){let i=[];for(let r=0,s=e.length;r!==s;++r){let a=e[r];a.id in t&&i.push(a)}return i}};function Qu(n,e,t){let i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}var t_=37297,n_=0;function i_(n,e){let t=n.split(`
`),i=[],r=Math.max(e-6,0),s=Math.min(e+6,t.length);for(let a=r;a<s;a++){let o=a+1;i.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return i.join(`
`)}var ed=new Oe;function r_(n){qe._getMatrix(ed,qe.workingColorSpace,n);let e=`mat3( ${ed.elements.map(t=>t.toFixed(4))} )`;switch(qe.getTransfer(n)){case Yr:return[e,"LinearTransferOETF"];case Qe:return[e,"sRGBTransferOETF"];default:return Ce("WebGLProgram: Unsupported color space: ",n),[e,"LinearTransferOETF"]}}function td(n,e,t){let i=n.getShaderParameter(e,n.COMPILE_STATUS),s=(n.getShaderInfoLog(e)||"").trim();if(i&&s==="")return"";let a=/ERROR: 0:(\d+)/.exec(s);if(a){let o=parseInt(a[1]);return t.toUpperCase()+`

`+s+`

`+i_(n.getShaderSource(e),o)}else return s}function s_(n,e){let t=r_(e);return[`vec4 ${n}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}var a_={[ic]:"Linear",[rc]:"Reinhard",[sc]:"Cineon",[ac]:"ACESFilmic",[lc]:"AgX",[cc]:"Neutral",[oc]:"Custom"};function o_(n,e){let t=a_[e];return t===void 0?(Ce("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+n+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var Yo=new R;function l_(){qe.getLuminanceCoefficients(Yo);let n=Yo.x.toFixed(4),e=Yo.y.toFixed(4),t=Yo.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function c_(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(ws).join(`
`)}function h_(n){let e=[];for(let t in n){let i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function u_(n,e){let t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){let s=n.getActiveAttrib(e,r),a=s.name,o=1;s.type===n.FLOAT_MAT2&&(o=2),s.type===n.FLOAT_MAT3&&(o=3),s.type===n.FLOAT_MAT4&&(o=4),t[a]={type:s.type,location:n.getAttribLocation(e,a),locationSize:o}}return t}function ws(n){return n!==""}function nd(n,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function id(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var d_=/^[ \t]*#include +<([\w\d./]+)>/gm;function Fc(n){return n.replace(d_,p_)}var f_=new Map;function p_(n,e){let t=He[e];if(t===void 0){let i=f_.get(e);if(i!==void 0)t=He[i],Ce('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("Can not resolve #include <"+e+">")}return Fc(t)}var m_=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function rd(n){return n.replace(m_,g_)}function g_(n,e,t,i){let r="";for(let s=parseInt(e);s<parseInt(t);s++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function sd(n){let e=`precision ${n.precision} float;
	precision ${n.precision} int;
	precision ${n.precision} sampler2D;
	precision ${n.precision} samplerCube;
	precision ${n.precision} sampler3D;
	precision ${n.precision} sampler2DArray;
	precision ${n.precision} sampler2DShadow;
	precision ${n.precision} samplerCubeShadow;
	precision ${n.precision} sampler2DArrayShadow;
	precision ${n.precision} isampler2D;
	precision ${n.precision} isampler3D;
	precision ${n.precision} isamplerCube;
	precision ${n.precision} isampler2DArray;
	precision ${n.precision} usampler2D;
	precision ${n.precision} usampler3D;
	precision ${n.precision} usamplerCube;
	precision ${n.precision} usampler2DArray;
	`;return n.precision==="highp"?e+=`
#define HIGH_PRECISION`:n.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}var __={[ms]:"SHADOWMAP_TYPE_PCF",[Ar]:"SHADOWMAP_TYPE_VSM"};function y_(n){return __[n.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var x_={[yi]:"ENVMAP_TYPE_CUBE",[ki]:"ENVMAP_TYPE_CUBE",[gs]:"ENVMAP_TYPE_CUBE_UV"};function S_(n){return n.envMap===!1?"ENVMAP_TYPE_CUBE":x_[n.envMapMode]||"ENVMAP_TYPE_CUBE"}var v_={[ki]:"ENVMAP_MODE_REFRACTION"};function b_(n){return n.envMap===!1?"ENVMAP_MODE_REFLECTION":v_[n.envMapMode]||"ENVMAP_MODE_REFLECTION"}var M_={[nc]:"ENVMAP_BLENDING_MULTIPLY",[xu]:"ENVMAP_BLENDING_MIX",[Su]:"ENVMAP_BLENDING_ADD"};function T_(n){return n.envMap===!1?"ENVMAP_BLENDING_NONE":M_[n.combine]||"ENVMAP_BLENDING_NONE"}function E_(n){let e=n.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:i,maxMip:t}}function w_(n,e,t,i){let r=n.getContext(),s=t.defines,a=t.vertexShader,o=t.fragmentShader,c=y_(t),h=S_(t),u=b_(t),f=T_(t),d=E_(t),p=c_(t),g=h_(s),y=r.createProgram(),m,l,b=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(ws).join(`
`),m.length>0&&(m+=`
`),l=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(ws).join(`
`),l.length>0&&(l+=`
`)):(m=[sd(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(ws).join(`
`),l=[sd(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.envMap?"#define "+u:"",t.envMap?"#define "+f:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==gn?"#define TONE_MAPPING":"",t.toneMapping!==gn?He.tonemapping_pars_fragment:"",t.toneMapping!==gn?o_("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",He.colorspace_pars_fragment,s_("linearToOutputTexel",t.outputColorSpace),l_(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(ws).join(`
`)),a=Fc(a),a=nd(a,t),a=id(a,t),o=Fc(o),o=nd(o,t),o=id(o,t),a=rd(a),o=rd(o),t.isRawShaderMaterial!==!0&&(b=`#version 300 es
`,m=[p,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,l=["#define varying in",t.glslVersion===xc?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===xc?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+l);let v=b+m+a,_=b+l+o,E=Qu(r,r.VERTEX_SHADER,v),T=Qu(r,r.FRAGMENT_SHADER,_);r.attachShader(y,E),r.attachShader(y,T),t.index0AttributeName!==void 0?r.bindAttribLocation(y,0,t.index0AttributeName):t.morphTargets===!0&&r.bindAttribLocation(y,0,"position"),r.linkProgram(y);function C(I){if(n.debug.checkShaderErrors){let N=r.getProgramInfoLog(y)||"",G=r.getShaderInfoLog(E)||"",W=r.getShaderInfoLog(T)||"",F=N.trim(),H=G.trim(),V=W.trim(),j=!0,Q=!0;if(r.getProgramParameter(y,r.LINK_STATUS)===!1)if(j=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(r,y,E,T);else{let de=td(r,E,"vertex"),be=td(r,T,"fragment");Re("THREE.WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(y,r.VALIDATE_STATUS)+`

Material Name: `+I.name+`
Material Type: `+I.type+`

Program Info Log: `+F+`
`+de+`
`+be)}else F!==""?Ce("WebGLProgram: Program Info Log:",F):(H===""||V==="")&&(Q=!1);Q&&(I.diagnostics={runnable:j,programLog:F,vertexShader:{log:H,prefix:m},fragmentShader:{log:V,prefix:l}})}r.deleteShader(E),r.deleteShader(T),S=new Pr(r,y),A=u_(r,y)}let S;this.getUniforms=function(){return S===void 0&&C(this),S};let A;this.getAttributes=function(){return A===void 0&&C(this),A};let L=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return L===!1&&(L=r.getProgramParameter(y,t_)),L},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(y),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=n_++,this.cacheKey=e,this.usedTimes=1,this.program=y,this.vertexShader=E,this.fragmentShader=T,this}var A_=0,Nc=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,i=e.fragmentShader,r=this._getShaderStage(t),s=this._getShaderStage(i),a=this._getShaderCacheForMaterial(e);return a.has(r)===!1&&(a.add(r),r.usedTimes++),a.has(s)===!1&&(a.add(s),s.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){let t=this.shaderCache,i=t.get(e);return i===void 0&&(i=new Uc(e),t.set(e,i)),i}},Uc=class{constructor(e){this.id=A_++,this.code=e,this.usedTimes=0}};function C_(n){return n===Si||n===bs||n===Ms}function R_(n,e,t,i,r,s){let a=new gr,o=new Nc,c=new Set,h=[],u=new Map,f=i.logarithmicDepthBuffer,d=i.precision,p={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function g(S){return c.add(S),S===0?"uv":`uv${S}`}function y(S,A,L,I,N,G){let W=I.fog,F=N.geometry,H=S.isMeshStandardMaterial||S.isMeshLambertMaterial||S.isMeshPhongMaterial?I.environment:null,V=S.isMeshStandardMaterial||S.isMeshLambertMaterial&&!S.envMap||S.isMeshPhongMaterial&&!S.envMap,j=e.get(S.envMap||H,V),Q=j&&j.mapping===gs?j.image.height:null,de=p[S.type];S.precision!==null&&(d=i.getMaxPrecision(S.precision),d!==S.precision&&Ce("WebGLProgram.getParameters:",S.precision,"not supported, using",d,"instead."));let be=F.morphAttributes.position||F.morphAttributes.normal||F.morphAttributes.color,we=be!==void 0?be.length:0,$e=0;F.morphAttributes.position!==void 0&&($e=1),F.morphAttributes.normal!==void 0&&($e=2),F.morphAttributes.color!==void 0&&($e=3);let tt,ke,Z,me;if(de){let Ne=On[de];tt=Ne.vertexShader,ke=Ne.fragmentShader}else tt=S.vertexShader,ke=S.fragmentShader,o.update(S),Z=o.getVertexShaderID(S),me=o.getFragmentShaderID(S);let re=n.getRenderTarget(),Ie=n.state.buffers.depth.getReversed(),Fe=N.isInstancedMesh===!0,Pe=N.isBatchedMesh===!0,mt=!!S.map,Xe=!!S.matcap,nt=!!j,ht=!!S.aoMap,Ge=!!S.lightMap,At=!!S.bumpMap,gt=!!S.normalMap,qt=!!S.displacementMap,D=!!S.emissiveMap,Ct=!!S.metalnessMap,Ye=!!S.roughnessMap,lt=S.anisotropy>0,he=S.clearcoat>0,St=S.dispersion>0,w=S.iridescence>0,x=S.sheen>0,U=S.transmission>0,q=lt&&!!S.anisotropyMap,J=he&&!!S.clearcoatMap,ee=he&&!!S.clearcoatNormalMap,oe=he&&!!S.clearcoatRoughnessMap,X=w&&!!S.iridescenceMap,$=w&&!!S.iridescenceThicknessMap,ge=x&&!!S.sheenColorMap,Se=x&&!!S.sheenRoughnessMap,se=!!S.specularMap,te=!!S.specularColorMap,Le=!!S.specularIntensityMap,Be=U&&!!S.transmissionMap,Je=U&&!!S.thicknessMap,P=!!S.gradientMap,ne=!!S.alphaMap,Y=S.alphaTest>0,_e=!!S.alphaHash,ae=!!S.extensions,K=gn;S.toneMapped&&(re===null||re.isXRRenderTarget===!0)&&(K=n.toneMapping);let Te={shaderID:de,shaderType:S.type,shaderName:S.name,vertexShader:tt,fragmentShader:ke,defines:S.defines,customVertexShaderID:Z,customFragmentShaderID:me,isRawShaderMaterial:S.isRawShaderMaterial===!0,glslVersion:S.glslVersion,precision:d,batching:Pe,batchingColor:Pe&&N._colorsTexture!==null,instancing:Fe,instancingColor:Fe&&N.instanceColor!==null,instancingMorph:Fe&&N.morphTexture!==null,outputColorSpace:re===null?n.outputColorSpace:re.isXRRenderTarget===!0?re.texture.colorSpace:qe.workingColorSpace,alphaToCoverage:!!S.alphaToCoverage,map:mt,matcap:Xe,envMap:nt,envMapMode:nt&&j.mapping,envMapCubeUVHeight:Q,aoMap:ht,lightMap:Ge,bumpMap:At,normalMap:gt,displacementMap:qt,emissiveMap:D,normalMapObjectSpace:gt&&S.normalMapType===Mu,normalMapTangentSpace:gt&&S.normalMapType===yc,packedNormalMap:gt&&S.normalMapType===yc&&C_(S.normalMap.format),metalnessMap:Ct,roughnessMap:Ye,anisotropy:lt,anisotropyMap:q,clearcoat:he,clearcoatMap:J,clearcoatNormalMap:ee,clearcoatRoughnessMap:oe,dispersion:St,iridescence:w,iridescenceMap:X,iridescenceThicknessMap:$,sheen:x,sheenColorMap:ge,sheenRoughnessMap:Se,specularMap:se,specularColorMap:te,specularIntensityMap:Le,transmission:U,transmissionMap:Be,thicknessMap:Je,gradientMap:P,opaque:S.transparent===!1&&S.blending===Li&&S.alphaToCoverage===!1,alphaMap:ne,alphaTest:Y,alphaHash:_e,combine:S.combine,mapUv:mt&&g(S.map.channel),aoMapUv:ht&&g(S.aoMap.channel),lightMapUv:Ge&&g(S.lightMap.channel),bumpMapUv:At&&g(S.bumpMap.channel),normalMapUv:gt&&g(S.normalMap.channel),displacementMapUv:qt&&g(S.displacementMap.channel),emissiveMapUv:D&&g(S.emissiveMap.channel),metalnessMapUv:Ct&&g(S.metalnessMap.channel),roughnessMapUv:Ye&&g(S.roughnessMap.channel),anisotropyMapUv:q&&g(S.anisotropyMap.channel),clearcoatMapUv:J&&g(S.clearcoatMap.channel),clearcoatNormalMapUv:ee&&g(S.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:oe&&g(S.clearcoatRoughnessMap.channel),iridescenceMapUv:X&&g(S.iridescenceMap.channel),iridescenceThicknessMapUv:$&&g(S.iridescenceThicknessMap.channel),sheenColorMapUv:ge&&g(S.sheenColorMap.channel),sheenRoughnessMapUv:Se&&g(S.sheenRoughnessMap.channel),specularMapUv:se&&g(S.specularMap.channel),specularColorMapUv:te&&g(S.specularColorMap.channel),specularIntensityMapUv:Le&&g(S.specularIntensityMap.channel),transmissionMapUv:Be&&g(S.transmissionMap.channel),thicknessMapUv:Je&&g(S.thicknessMap.channel),alphaMapUv:ne&&g(S.alphaMap.channel),vertexTangents:!!F.attributes.tangent&&(gt||lt),vertexNormals:!!F.attributes.normal,vertexColors:S.vertexColors,vertexAlphas:S.vertexColors===!0&&!!F.attributes.color&&F.attributes.color.itemSize===4,pointsUvs:N.isPoints===!0&&!!F.attributes.uv&&(mt||ne),fog:!!W,useFog:S.fog===!0,fogExp2:!!W&&W.isFogExp2,flatShading:S.wireframe===!1&&(S.flatShading===!0||F.attributes.normal===void 0&&gt===!1&&(S.isMeshLambertMaterial||S.isMeshPhongMaterial||S.isMeshStandardMaterial||S.isMeshPhysicalMaterial)),sizeAttenuation:S.sizeAttenuation===!0,logarithmicDepthBuffer:f,reversedDepthBuffer:Ie,skinning:N.isSkinnedMesh===!0,morphTargets:F.morphAttributes.position!==void 0,morphNormals:F.morphAttributes.normal!==void 0,morphColors:F.morphAttributes.color!==void 0,morphTargetsCount:we,morphTextureStride:$e,numDirLights:A.directional.length,numPointLights:A.point.length,numSpotLights:A.spot.length,numSpotLightMaps:A.spotLightMap.length,numRectAreaLights:A.rectArea.length,numHemiLights:A.hemi.length,numDirLightShadows:A.directionalShadowMap.length,numPointLightShadows:A.pointShadowMap.length,numSpotLightShadows:A.spotShadowMap.length,numSpotLightShadowsWithMaps:A.numSpotLightShadowsWithMaps,numLightProbes:A.numLightProbes,numLightProbeGrids:G.length,numClippingPlanes:s.numPlanes,numClipIntersection:s.numIntersection,dithering:S.dithering,shadowMapEnabled:n.shadowMap.enabled&&L.length>0,shadowMapType:n.shadowMap.type,toneMapping:K,decodeVideoTexture:mt&&S.map.isVideoTexture===!0&&qe.getTransfer(S.map.colorSpace)===Qe,decodeVideoTextureEmissive:D&&S.emissiveMap.isVideoTexture===!0&&qe.getTransfer(S.emissiveMap.colorSpace)===Qe,premultipliedAlpha:S.premultipliedAlpha,doubleSided:S.side===Bt,flipSided:S.side===Vt,useDepthPacking:S.depthPacking>=0,depthPacking:S.depthPacking||0,index0AttributeName:S.index0AttributeName,extensionClipCullDistance:ae&&S.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(ae&&S.extensions.multiDraw===!0||Pe)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:S.customProgramCacheKey()};return Te.vertexUv1s=c.has(1),Te.vertexUv2s=c.has(2),Te.vertexUv3s=c.has(3),c.clear(),Te}function m(S){let A=[];if(S.shaderID?A.push(S.shaderID):(A.push(S.customVertexShaderID),A.push(S.customFragmentShaderID)),S.defines!==void 0)for(let L in S.defines)A.push(L),A.push(S.defines[L]);return S.isRawShaderMaterial===!1&&(l(A,S),b(A,S),A.push(n.outputColorSpace)),A.push(S.customProgramCacheKey),A.join()}function l(S,A){S.push(A.precision),S.push(A.outputColorSpace),S.push(A.envMapMode),S.push(A.envMapCubeUVHeight),S.push(A.mapUv),S.push(A.alphaMapUv),S.push(A.lightMapUv),S.push(A.aoMapUv),S.push(A.bumpMapUv),S.push(A.normalMapUv),S.push(A.displacementMapUv),S.push(A.emissiveMapUv),S.push(A.metalnessMapUv),S.push(A.roughnessMapUv),S.push(A.anisotropyMapUv),S.push(A.clearcoatMapUv),S.push(A.clearcoatNormalMapUv),S.push(A.clearcoatRoughnessMapUv),S.push(A.iridescenceMapUv),S.push(A.iridescenceThicknessMapUv),S.push(A.sheenColorMapUv),S.push(A.sheenRoughnessMapUv),S.push(A.specularMapUv),S.push(A.specularColorMapUv),S.push(A.specularIntensityMapUv),S.push(A.transmissionMapUv),S.push(A.thicknessMapUv),S.push(A.combine),S.push(A.fogExp2),S.push(A.sizeAttenuation),S.push(A.morphTargetsCount),S.push(A.morphAttributeCount),S.push(A.numDirLights),S.push(A.numPointLights),S.push(A.numSpotLights),S.push(A.numSpotLightMaps),S.push(A.numHemiLights),S.push(A.numRectAreaLights),S.push(A.numDirLightShadows),S.push(A.numPointLightShadows),S.push(A.numSpotLightShadows),S.push(A.numSpotLightShadowsWithMaps),S.push(A.numLightProbes),S.push(A.shadowMapType),S.push(A.toneMapping),S.push(A.numClippingPlanes),S.push(A.numClipIntersection),S.push(A.depthPacking)}function b(S,A){a.disableAll(),A.instancing&&a.enable(0),A.instancingColor&&a.enable(1),A.instancingMorph&&a.enable(2),A.matcap&&a.enable(3),A.envMap&&a.enable(4),A.normalMapObjectSpace&&a.enable(5),A.normalMapTangentSpace&&a.enable(6),A.clearcoat&&a.enable(7),A.iridescence&&a.enable(8),A.alphaTest&&a.enable(9),A.vertexColors&&a.enable(10),A.vertexAlphas&&a.enable(11),A.vertexUv1s&&a.enable(12),A.vertexUv2s&&a.enable(13),A.vertexUv3s&&a.enable(14),A.vertexTangents&&a.enable(15),A.anisotropy&&a.enable(16),A.alphaHash&&a.enable(17),A.batching&&a.enable(18),A.dispersion&&a.enable(19),A.batchingColor&&a.enable(20),A.gradientMap&&a.enable(21),A.packedNormalMap&&a.enable(22),A.vertexNormals&&a.enable(23),S.push(a.mask),a.disableAll(),A.fog&&a.enable(0),A.useFog&&a.enable(1),A.flatShading&&a.enable(2),A.logarithmicDepthBuffer&&a.enable(3),A.reversedDepthBuffer&&a.enable(4),A.skinning&&a.enable(5),A.morphTargets&&a.enable(6),A.morphNormals&&a.enable(7),A.morphColors&&a.enable(8),A.premultipliedAlpha&&a.enable(9),A.shadowMapEnabled&&a.enable(10),A.doubleSided&&a.enable(11),A.flipSided&&a.enable(12),A.useDepthPacking&&a.enable(13),A.dithering&&a.enable(14),A.transmission&&a.enable(15),A.sheen&&a.enable(16),A.opaque&&a.enable(17),A.pointsUvs&&a.enable(18),A.decodeVideoTexture&&a.enable(19),A.decodeVideoTextureEmissive&&a.enable(20),A.alphaToCoverage&&a.enable(21),A.numLightProbeGrids>0&&a.enable(22),S.push(a.mask)}function v(S){let A=p[S.type],L;if(A){let I=On[A];L=Hu.clone(I.uniforms)}else L=S.uniforms;return L}function _(S,A){let L=u.get(A);return L!==void 0?++L.usedTimes:(L=new w_(n,A,S,r),h.push(L),u.set(A,L)),L}function E(S){if(--S.usedTimes===0){let A=h.indexOf(S);h[A]=h[h.length-1],h.pop(),u.delete(S.cacheKey),S.destroy()}}function T(S){o.remove(S)}function C(){o.dispose()}return{getParameters:y,getProgramCacheKey:m,getUniforms:v,acquireProgram:_,releaseProgram:E,releaseShaderCache:T,programs:h,dispose:C}}function I_(){let n=new WeakMap;function e(a){return n.has(a)}function t(a){let o=n.get(a);return o===void 0&&(o={},n.set(a,o)),o}function i(a){n.delete(a)}function r(a,o,c){n.get(a)[o]=c}function s(){n=new WeakMap}return{has:e,get:t,remove:i,update:r,dispose:s}}function P_(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.materialVariant!==e.materialVariant?n.materialVariant-e.materialVariant:n.z!==e.z?n.z-e.z:n.id-e.id}function ad(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function od(){let n=[],e=0,t=[],i=[],r=[];function s(){e=0,t.length=0,i.length=0,r.length=0}function a(d){let p=0;return d.isInstancedMesh&&(p+=2),d.isSkinnedMesh&&(p+=1),p}function o(d,p,g,y,m,l){let b=n[e];return b===void 0?(b={id:d.id,object:d,geometry:p,material:g,materialVariant:a(d),groupOrder:y,renderOrder:d.renderOrder,z:m,group:l},n[e]=b):(b.id=d.id,b.object=d,b.geometry=p,b.material=g,b.materialVariant=a(d),b.groupOrder=y,b.renderOrder=d.renderOrder,b.z=m,b.group=l),e++,b}function c(d,p,g,y,m,l){let b=o(d,p,g,y,m,l);g.transmission>0?i.push(b):g.transparent===!0?r.push(b):t.push(b)}function h(d,p,g,y,m,l){let b=o(d,p,g,y,m,l);g.transmission>0?i.unshift(b):g.transparent===!0?r.unshift(b):t.unshift(b)}function u(d,p){t.length>1&&t.sort(d||P_),i.length>1&&i.sort(p||ad),r.length>1&&r.sort(p||ad)}function f(){for(let d=e,p=n.length;d<p;d++){let g=n[d];if(g.id===null)break;g.id=null,g.object=null,g.geometry=null,g.material=null,g.group=null}}return{opaque:t,transmissive:i,transparent:r,init:s,push:c,unshift:h,finish:f,sort:u}}function D_(){let n=new WeakMap;function e(i,r){let s=n.get(i),a;return s===void 0?(a=new od,n.set(i,[a])):r>=s.length?(a=new od,s.push(a)):a=s[r],a}function t(){n=new WeakMap}return{get:e,dispose:t}}function L_(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new R,color:new Ke};break;case"SpotLight":t={position:new R,direction:new R,color:new Ke,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new R,color:new Ke,distance:0,decay:0};break;case"HemisphereLight":t={direction:new R,skyColor:new Ke,groundColor:new Ke};break;case"RectAreaLight":t={color:new Ke,position:new R,halfWidth:new R,halfHeight:new R};break}return n[e.id]=t,t}}}function O_(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new xe};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new xe};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new xe,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}var F_=0;function N_(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function U_(n){let e=new L_,t=O_(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let h=0;h<9;h++)i.probe.push(new R);let r=new R,s=new ft,a=new ft;function o(h){let u=0,f=0,d=0;for(let A=0;A<9;A++)i.probe[A].set(0,0,0);let p=0,g=0,y=0,m=0,l=0,b=0,v=0,_=0,E=0,T=0,C=0;h.sort(N_);for(let A=0,L=h.length;A<L;A++){let I=h[A],N=I.color,G=I.intensity,W=I.distance,F=null;if(I.shadow&&I.shadow.map&&(I.shadow.map.texture.format===Si?F=I.shadow.map.texture:F=I.shadow.map.depthTexture||I.shadow.map.texture),I.isAmbientLight)u+=N.r*G,f+=N.g*G,d+=N.b*G;else if(I.isLightProbe){for(let H=0;H<9;H++)i.probe[H].addScaledVector(I.sh.coefficients[H],G);C++}else if(I.isDirectionalLight){let H=e.get(I);if(H.color.copy(I.color).multiplyScalar(I.intensity),I.castShadow){let V=I.shadow,j=t.get(I);j.shadowIntensity=V.intensity,j.shadowBias=V.bias,j.shadowNormalBias=V.normalBias,j.shadowRadius=V.radius,j.shadowMapSize=V.mapSize,i.directionalShadow[p]=j,i.directionalShadowMap[p]=F,i.directionalShadowMatrix[p]=I.shadow.matrix,b++}i.directional[p]=H,p++}else if(I.isSpotLight){let H=e.get(I);H.position.setFromMatrixPosition(I.matrixWorld),H.color.copy(N).multiplyScalar(G),H.distance=W,H.coneCos=Math.cos(I.angle),H.penumbraCos=Math.cos(I.angle*(1-I.penumbra)),H.decay=I.decay,i.spot[y]=H;let V=I.shadow;if(I.map&&(i.spotLightMap[E]=I.map,E++,V.updateMatrices(I),I.castShadow&&T++),i.spotLightMatrix[y]=V.matrix,I.castShadow){let j=t.get(I);j.shadowIntensity=V.intensity,j.shadowBias=V.bias,j.shadowNormalBias=V.normalBias,j.shadowRadius=V.radius,j.shadowMapSize=V.mapSize,i.spotShadow[y]=j,i.spotShadowMap[y]=F,_++}y++}else if(I.isRectAreaLight){let H=e.get(I);H.color.copy(N).multiplyScalar(G),H.halfWidth.set(I.width*.5,0,0),H.halfHeight.set(0,I.height*.5,0),i.rectArea[m]=H,m++}else if(I.isPointLight){let H=e.get(I);if(H.color.copy(I.color).multiplyScalar(I.intensity),H.distance=I.distance,H.decay=I.decay,I.castShadow){let V=I.shadow,j=t.get(I);j.shadowIntensity=V.intensity,j.shadowBias=V.bias,j.shadowNormalBias=V.normalBias,j.shadowRadius=V.radius,j.shadowMapSize=V.mapSize,j.shadowCameraNear=V.camera.near,j.shadowCameraFar=V.camera.far,i.pointShadow[g]=j,i.pointShadowMap[g]=F,i.pointShadowMatrix[g]=I.shadow.matrix,v++}i.point[g]=H,g++}else if(I.isHemisphereLight){let H=e.get(I);H.skyColor.copy(I.color).multiplyScalar(G),H.groundColor.copy(I.groundColor).multiplyScalar(G),i.hemi[l]=H,l++}}m>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=ue.LTC_FLOAT_1,i.rectAreaLTC2=ue.LTC_FLOAT_2):(i.rectAreaLTC1=ue.LTC_HALF_1,i.rectAreaLTC2=ue.LTC_HALF_2)),i.ambient[0]=u,i.ambient[1]=f,i.ambient[2]=d;let S=i.hash;(S.directionalLength!==p||S.pointLength!==g||S.spotLength!==y||S.rectAreaLength!==m||S.hemiLength!==l||S.numDirectionalShadows!==b||S.numPointShadows!==v||S.numSpotShadows!==_||S.numSpotMaps!==E||S.numLightProbes!==C)&&(i.directional.length=p,i.spot.length=y,i.rectArea.length=m,i.point.length=g,i.hemi.length=l,i.directionalShadow.length=b,i.directionalShadowMap.length=b,i.pointShadow.length=v,i.pointShadowMap.length=v,i.spotShadow.length=_,i.spotShadowMap.length=_,i.directionalShadowMatrix.length=b,i.pointShadowMatrix.length=v,i.spotLightMatrix.length=_+E-T,i.spotLightMap.length=E,i.numSpotLightShadowsWithMaps=T,i.numLightProbes=C,S.directionalLength=p,S.pointLength=g,S.spotLength=y,S.rectAreaLength=m,S.hemiLength=l,S.numDirectionalShadows=b,S.numPointShadows=v,S.numSpotShadows=_,S.numSpotMaps=E,S.numLightProbes=C,i.version=F_++)}function c(h,u){let f=0,d=0,p=0,g=0,y=0,m=u.matrixWorldInverse;for(let l=0,b=h.length;l<b;l++){let v=h[l];if(v.isDirectionalLight){let _=i.directional[f];_.direction.setFromMatrixPosition(v.matrixWorld),r.setFromMatrixPosition(v.target.matrixWorld),_.direction.sub(r),_.direction.transformDirection(m),f++}else if(v.isSpotLight){let _=i.spot[p];_.position.setFromMatrixPosition(v.matrixWorld),_.position.applyMatrix4(m),_.direction.setFromMatrixPosition(v.matrixWorld),r.setFromMatrixPosition(v.target.matrixWorld),_.direction.sub(r),_.direction.transformDirection(m),p++}else if(v.isRectAreaLight){let _=i.rectArea[g];_.position.setFromMatrixPosition(v.matrixWorld),_.position.applyMatrix4(m),a.identity(),s.copy(v.matrixWorld),s.premultiply(m),a.extractRotation(s),_.halfWidth.set(v.width*.5,0,0),_.halfHeight.set(0,v.height*.5,0),_.halfWidth.applyMatrix4(a),_.halfHeight.applyMatrix4(a),g++}else if(v.isPointLight){let _=i.point[d];_.position.setFromMatrixPosition(v.matrixWorld),_.position.applyMatrix4(m),d++}else if(v.isHemisphereLight){let _=i.hemi[y];_.direction.setFromMatrixPosition(v.matrixWorld),_.direction.transformDirection(m),y++}}}return{setup:o,setupView:c,state:i}}function ld(n){let e=new U_(n),t=[],i=[],r=[];function s(d){f.camera=d,t.length=0,i.length=0,r.length=0}function a(d){t.push(d)}function o(d){i.push(d)}function c(d){r.push(d)}function h(){e.setup(t)}function u(d){e.setupView(t,d)}let f={lightsArray:t,shadowsArray:i,lightProbeGridArray:r,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:s,state:f,setupLights:h,setupLightsView:u,pushLight:a,pushShadow:o,pushLightProbeGrid:c}}function k_(n){let e=new WeakMap;function t(r,s=0){let a=e.get(r),o;return a===void 0?(o=new ld(n),e.set(r,[o])):s>=a.length?(o=new ld(n),a.push(o)):o=a[s],o}function i(){e=new WeakMap}return{get:t,dispose:i}}var B_=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,H_=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,z_=[new R(1,0,0),new R(-1,0,0),new R(0,1,0),new R(0,-1,0),new R(0,0,1),new R(0,0,-1)],V_=[new R(0,-1,0),new R(0,-1,0),new R(0,0,1),new R(0,0,-1),new R(0,-1,0),new R(0,-1,0)],cd=new ft,Es=new R,Ic=new R;function G_(n,e,t){let i=new Qr,r=new xe,s=new xe,a=new bt,o=new Ga,c=new Wa,h={},u=t.maxTextureSize,f={[Yn]:Vt,[Vt]:Yn,[Bt]:Bt},d=new tn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new xe},radius:{value:4}},vertexShader:B_,fragmentShader:H_}),p=d.clone();p.defines.HORIZONTAL_PASS=1;let g=new et;g.setAttribute("position",new Xt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let y=new dt(g,d),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=ms;let l=this.type;this.render=function(T,C,S){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||T.length===0)return;this.type===eu&&(Ce("WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead."),this.type=ms);let A=n.getRenderTarget(),L=n.getActiveCubeFace(),I=n.getActiveMipmapLevel(),N=n.state;N.setBlending(Pn),N.buffers.depth.getReversed()===!0?N.buffers.color.setClear(0,0,0,0):N.buffers.color.setClear(1,1,1,1),N.buffers.depth.setTest(!0),N.setScissorTest(!1);let G=l!==this.type;G&&C.traverse(function(W){W.material&&(Array.isArray(W.material)?W.material.forEach(F=>F.needsUpdate=!0):W.material.needsUpdate=!0)});for(let W=0,F=T.length;W<F;W++){let H=T[W],V=H.shadow;if(V===void 0){Ce("WebGLShadowMap:",H,"has no shadow.");continue}if(V.autoUpdate===!1&&V.needsUpdate===!1)continue;r.copy(V.mapSize);let j=V.getFrameExtents();r.multiply(j),s.copy(V.mapSize),(r.x>u||r.y>u)&&(r.x>u&&(s.x=Math.floor(u/j.x),r.x=s.x*j.x,V.mapSize.x=s.x),r.y>u&&(s.y=Math.floor(u/j.y),r.y=s.y*j.y,V.mapSize.y=s.y));let Q=n.state.buffers.depth.getReversed();if(V.camera._reversedDepth=Q,V.map===null||G===!0){if(V.map!==null&&(V.map.depthTexture!==null&&(V.map.depthTexture.dispose(),V.map.depthTexture=null),V.map.dispose()),this.type===Ar){if(H.isPointLight){Ce("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}V.map=new jt(r.x,r.y,{format:Si,type:Dn,minFilter:ce,magFilter:ce,generateMipmaps:!1}),V.map.texture.name=H.name+".shadowMap",V.map.depthTexture=new $n(r.x,r.y,xn),V.map.depthTexture.name=H.name+".shadowMapDepth",V.map.depthTexture.format=An,V.map.depthTexture.compareFunction=null,V.map.depthTexture.minFilter=Dt,V.map.depthTexture.magFilter=Dt}else H.isPointLight?(V.map=new $o(r.x),V.map.depthTexture=new Ua(r.x,yn)):(V.map=new jt(r.x,r.y),V.map.depthTexture=new $n(r.x,r.y,yn)),V.map.depthTexture.name=H.name+".shadowMap",V.map.depthTexture.format=An,this.type===ms?(V.map.depthTexture.compareFunction=Q?Wo:Go,V.map.depthTexture.minFilter=ce,V.map.depthTexture.magFilter=ce):(V.map.depthTexture.compareFunction=null,V.map.depthTexture.minFilter=Dt,V.map.depthTexture.magFilter=Dt);V.camera.updateProjectionMatrix()}let de=V.map.isWebGLCubeRenderTarget?6:1;for(let be=0;be<de;be++){if(V.map.isWebGLCubeRenderTarget)n.setRenderTarget(V.map,be),n.clear();else{be===0&&(n.setRenderTarget(V.map),n.clear());let we=V.getViewport(be);a.set(s.x*we.x,s.y*we.y,s.x*we.z,s.y*we.w),N.viewport(a)}if(H.isPointLight){let we=V.camera,$e=V.matrix,tt=H.distance||we.far;tt!==we.far&&(we.far=tt,we.updateProjectionMatrix()),Es.setFromMatrixPosition(H.matrixWorld),we.position.copy(Es),Ic.copy(we.position),Ic.add(z_[be]),we.up.copy(V_[be]),we.lookAt(Ic),we.updateMatrixWorld(),$e.makeTranslation(-Es.x,-Es.y,-Es.z),cd.multiplyMatrices(we.projectionMatrix,we.matrixWorldInverse),V._frustum.setFromProjectionMatrix(cd,we.coordinateSystem,we.reversedDepth)}else V.updateMatrices(H);i=V.getFrustum(),_(C,S,V.camera,H,this.type)}V.isPointLightShadow!==!0&&this.type===Ar&&b(V,S),V.needsUpdate=!1}l=this.type,m.needsUpdate=!1,n.setRenderTarget(A,L,I)};function b(T,C){let S=e.update(y);d.defines.VSM_SAMPLES!==T.blurSamples&&(d.defines.VSM_SAMPLES=T.blurSamples,p.defines.VSM_SAMPLES=T.blurSamples,d.needsUpdate=!0,p.needsUpdate=!0),T.mapPass===null&&(T.mapPass=new jt(r.x,r.y,{format:Si,type:Dn})),d.uniforms.shadow_pass.value=T.map.depthTexture,d.uniforms.resolution.value=T.mapSize,d.uniforms.radius.value=T.radius,n.setRenderTarget(T.mapPass),n.clear(),n.renderBufferDirect(C,null,S,d,y,null),p.uniforms.shadow_pass.value=T.mapPass.texture,p.uniforms.resolution.value=T.mapSize,p.uniforms.radius.value=T.radius,n.setRenderTarget(T.map),n.clear(),n.renderBufferDirect(C,null,S,p,y,null)}function v(T,C,S,A){let L=null,I=S.isPointLight===!0?T.customDistanceMaterial:T.customDepthMaterial;if(I!==void 0)L=I;else if(L=S.isPointLight===!0?c:o,n.localClippingEnabled&&C.clipShadows===!0&&Array.isArray(C.clippingPlanes)&&C.clippingPlanes.length!==0||C.displacementMap&&C.displacementScale!==0||C.alphaMap&&C.alphaTest>0||C.map&&C.alphaTest>0||C.alphaToCoverage===!0){let N=L.uuid,G=C.uuid,W=h[N];W===void 0&&(W={},h[N]=W);let F=W[G];F===void 0&&(F=L.clone(),W[G]=F,C.addEventListener("dispose",E)),L=F}if(L.visible=C.visible,L.wireframe=C.wireframe,A===Ar?L.side=C.shadowSide!==null?C.shadowSide:C.side:L.side=C.shadowSide!==null?C.shadowSide:f[C.side],L.alphaMap=C.alphaMap,L.alphaTest=C.alphaToCoverage===!0?.5:C.alphaTest,L.map=C.map,L.clipShadows=C.clipShadows,L.clippingPlanes=C.clippingPlanes,L.clipIntersection=C.clipIntersection,L.displacementMap=C.displacementMap,L.displacementScale=C.displacementScale,L.displacementBias=C.displacementBias,L.wireframeLinewidth=C.wireframeLinewidth,L.linewidth=C.linewidth,S.isPointLight===!0&&L.isMeshDistanceMaterial===!0){let N=n.properties.get(L);N.light=S}return L}function _(T,C,S,A,L){if(T.visible===!1)return;if(T.layers.test(C.layers)&&(T.isMesh||T.isLine||T.isPoints)&&(T.castShadow||T.receiveShadow&&L===Ar)&&(!T.frustumCulled||i.intersectsObject(T))){T.modelViewMatrix.multiplyMatrices(S.matrixWorldInverse,T.matrixWorld);let G=e.update(T),W=T.material;if(Array.isArray(W)){let F=G.groups;for(let H=0,V=F.length;H<V;H++){let j=F[H],Q=W[j.materialIndex];if(Q&&Q.visible){let de=v(T,Q,A,L);T.onBeforeShadow(n,T,C,S,G,de,j),n.renderBufferDirect(S,null,G,de,T,j),T.onAfterShadow(n,T,C,S,G,de,j)}}}else if(W.visible){let F=v(T,W,A,L);T.onBeforeShadow(n,T,C,S,G,F,null),n.renderBufferDirect(S,null,G,F,T,null),T.onAfterShadow(n,T,C,S,G,F,null)}}let N=T.children;for(let G=0,W=N.length;G<W;G++)_(N[G],C,S,A,L)}function E(T){T.target.removeEventListener("dispose",E);for(let S in h){let A=h[S],L=T.target.uuid;L in A&&(A[L].dispose(),delete A[L])}}}function W_(n,e){function t(){let P=!1,ne=new bt,Y=null,_e=new bt(0,0,0,0);return{setMask:function(ae){Y!==ae&&!P&&(n.colorMask(ae,ae,ae,ae),Y=ae)},setLocked:function(ae){P=ae},setClear:function(ae,K,Te,Ne,Mt){Mt===!0&&(ae*=Ne,K*=Ne,Te*=Ne),ne.set(ae,K,Te,Ne),_e.equals(ne)===!1&&(n.clearColor(ae,K,Te,Ne),_e.copy(ne))},reset:function(){P=!1,Y=null,_e.set(-1,0,0,0)}}}function i(){let P=!1,ne=!1,Y=null,_e=null,ae=null;return{setReversed:function(K){if(ne!==K){let Te=e.get("EXT_clip_control");K?Te.clipControlEXT(Te.LOWER_LEFT_EXT,Te.ZERO_TO_ONE_EXT):Te.clipControlEXT(Te.LOWER_LEFT_EXT,Te.NEGATIVE_ONE_TO_ONE_EXT),ne=K;let Ne=ae;ae=null,this.setClear(Ne)}},getReversed:function(){return ne},setTest:function(K){K?re(n.DEPTH_TEST):Ie(n.DEPTH_TEST)},setMask:function(K){Y!==K&&!P&&(n.depthMask(K),Y=K)},setFunc:function(K){if(ne&&(K=Lu[K]),_e!==K){switch(K){case _a:n.depthFunc(n.NEVER);break;case ya:n.depthFunc(n.ALWAYS);break;case xa:n.depthFunc(n.LESS);break;case Oi:n.depthFunc(n.LEQUAL);break;case Sa:n.depthFunc(n.EQUAL);break;case va:n.depthFunc(n.GEQUAL);break;case ba:n.depthFunc(n.GREATER);break;case Ma:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}_e=K}},setLocked:function(K){P=K},setClear:function(K){ae!==K&&(ae=K,ne&&(K=1-K),n.clearDepth(K))},reset:function(){P=!1,Y=null,_e=null,ae=null,ne=!1}}}function r(){let P=!1,ne=null,Y=null,_e=null,ae=null,K=null,Te=null,Ne=null,Mt=null;return{setTest:function(it){P||(it?re(n.STENCIL_TEST):Ie(n.STENCIL_TEST))},setMask:function(it){ne!==it&&!P&&(n.stencilMask(it),ne=it)},setFunc:function(it,Un,bn){(Y!==it||_e!==Un||ae!==bn)&&(n.stencilFunc(it,Un,bn),Y=it,_e=Un,ae=bn)},setOp:function(it,Un,bn){(K!==it||Te!==Un||Ne!==bn)&&(n.stencilOp(it,Un,bn),K=it,Te=Un,Ne=bn)},setLocked:function(it){P=it},setClear:function(it){Mt!==it&&(n.clearStencil(it),Mt=it)},reset:function(){P=!1,ne=null,Y=null,_e=null,ae=null,K=null,Te=null,Ne=null,Mt=null}}}let s=new t,a=new i,o=new r,c=new WeakMap,h=new WeakMap,u={},f={},d={},p=new WeakMap,g=[],y=null,m=!1,l=null,b=null,v=null,_=null,E=null,T=null,C=null,S=new Ke(0,0,0),A=0,L=!1,I=null,N=null,G=null,W=null,F=null,H=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS),V=!1,j=0,Q=n.getParameter(n.VERSION);Q.indexOf("WebGL")!==-1?(j=parseFloat(/^WebGL (\d)/.exec(Q)[1]),V=j>=1):Q.indexOf("OpenGL ES")!==-1&&(j=parseFloat(/^OpenGL ES (\d)/.exec(Q)[1]),V=j>=2);let de=null,be={},we=n.getParameter(n.SCISSOR_BOX),$e=n.getParameter(n.VIEWPORT),tt=new bt().fromArray(we),ke=new bt().fromArray($e);function Z(P,ne,Y,_e){let ae=new Uint8Array(4),K=n.createTexture();n.bindTexture(P,K),n.texParameteri(P,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(P,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let Te=0;Te<Y;Te++)P===n.TEXTURE_3D||P===n.TEXTURE_2D_ARRAY?n.texImage3D(ne,0,n.RGBA,1,1,_e,0,n.RGBA,n.UNSIGNED_BYTE,ae):n.texImage2D(ne+Te,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,ae);return K}let me={};me[n.TEXTURE_2D]=Z(n.TEXTURE_2D,n.TEXTURE_2D,1),me[n.TEXTURE_CUBE_MAP]=Z(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),me[n.TEXTURE_2D_ARRAY]=Z(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),me[n.TEXTURE_3D]=Z(n.TEXTURE_3D,n.TEXTURE_3D,1,1),s.setClear(0,0,0,1),a.setClear(1),o.setClear(0),re(n.DEPTH_TEST),a.setFunc(Oi),At(!1),gt(jl),re(n.CULL_FACE),ht(Pn);function re(P){u[P]!==!0&&(n.enable(P),u[P]=!0)}function Ie(P){u[P]!==!1&&(n.disable(P),u[P]=!1)}function Fe(P,ne){return d[P]!==ne?(n.bindFramebuffer(P,ne),d[P]=ne,P===n.DRAW_FRAMEBUFFER&&(d[n.FRAMEBUFFER]=ne),P===n.FRAMEBUFFER&&(d[n.DRAW_FRAMEBUFFER]=ne),!0):!1}function Pe(P,ne){let Y=g,_e=!1;if(P){Y=p.get(ne),Y===void 0&&(Y=[],p.set(ne,Y));let ae=P.textures;if(Y.length!==ae.length||Y[0]!==n.COLOR_ATTACHMENT0){for(let K=0,Te=ae.length;K<Te;K++)Y[K]=n.COLOR_ATTACHMENT0+K;Y.length=ae.length,_e=!0}}else Y[0]!==n.BACK&&(Y[0]=n.BACK,_e=!0);_e&&n.drawBuffers(Y)}function mt(P){return y!==P?(n.useProgram(P),y=P,!0):!1}let Xe={[ci]:n.FUNC_ADD,[nu]:n.FUNC_SUBTRACT,[iu]:n.FUNC_REVERSE_SUBTRACT};Xe[ru]=n.MIN,Xe[su]=n.MAX;let nt={[au]:n.ZERO,[ou]:n.ONE,[lu]:n.SRC_COLOR,[ma]:n.SRC_ALPHA,[pu]:n.SRC_ALPHA_SATURATE,[du]:n.DST_COLOR,[hu]:n.DST_ALPHA,[cu]:n.ONE_MINUS_SRC_COLOR,[ga]:n.ONE_MINUS_SRC_ALPHA,[fu]:n.ONE_MINUS_DST_COLOR,[uu]:n.ONE_MINUS_DST_ALPHA,[mu]:n.CONSTANT_COLOR,[gu]:n.ONE_MINUS_CONSTANT_COLOR,[_u]:n.CONSTANT_ALPHA,[yu]:n.ONE_MINUS_CONSTANT_ALPHA};function ht(P,ne,Y,_e,ae,K,Te,Ne,Mt,it){if(P===Pn){m===!0&&(Ie(n.BLEND),m=!1);return}if(m===!1&&(re(n.BLEND),m=!0),P!==tu){if(P!==l||it!==L){if((b!==ci||E!==ci)&&(n.blendEquation(n.FUNC_ADD),b=ci,E=ci),it)switch(P){case Li:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Ql:n.blendFunc(n.ONE,n.ONE);break;case ec:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case tc:n.blendFuncSeparate(n.DST_COLOR,n.ONE_MINUS_SRC_ALPHA,n.ZERO,n.ONE);break;default:Re("WebGLState: Invalid blending: ",P);break}else switch(P){case Li:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Ql:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE,n.ONE,n.ONE);break;case ec:Re("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case tc:Re("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Re("WebGLState: Invalid blending: ",P);break}v=null,_=null,T=null,C=null,S.set(0,0,0),A=0,l=P,L=it}return}ae=ae||ne,K=K||Y,Te=Te||_e,(ne!==b||ae!==E)&&(n.blendEquationSeparate(Xe[ne],Xe[ae]),b=ne,E=ae),(Y!==v||_e!==_||K!==T||Te!==C)&&(n.blendFuncSeparate(nt[Y],nt[_e],nt[K],nt[Te]),v=Y,_=_e,T=K,C=Te),(Ne.equals(S)===!1||Mt!==A)&&(n.blendColor(Ne.r,Ne.g,Ne.b,Mt),S.copy(Ne),A=Mt),l=P,L=!1}function Ge(P,ne){P.side===Bt?Ie(n.CULL_FACE):re(n.CULL_FACE);let Y=P.side===Vt;ne&&(Y=!Y),At(Y),P.blending===Li&&P.transparent===!1?ht(Pn):ht(P.blending,P.blendEquation,P.blendSrc,P.blendDst,P.blendEquationAlpha,P.blendSrcAlpha,P.blendDstAlpha,P.blendColor,P.blendAlpha,P.premultipliedAlpha),a.setFunc(P.depthFunc),a.setTest(P.depthTest),a.setMask(P.depthWrite),s.setMask(P.colorWrite);let _e=P.stencilWrite;o.setTest(_e),_e&&(o.setMask(P.stencilWriteMask),o.setFunc(P.stencilFunc,P.stencilRef,P.stencilFuncMask),o.setOp(P.stencilFail,P.stencilZFail,P.stencilZPass)),D(P.polygonOffset,P.polygonOffsetFactor,P.polygonOffsetUnits),P.alphaToCoverage===!0?re(n.SAMPLE_ALPHA_TO_COVERAGE):Ie(n.SAMPLE_ALPHA_TO_COVERAGE)}function At(P){I!==P&&(P?n.frontFace(n.CW):n.frontFace(n.CCW),I=P)}function gt(P){P!==jh?(re(n.CULL_FACE),P!==N&&(P===jl?n.cullFace(n.BACK):P===Qh?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):Ie(n.CULL_FACE),N=P}function qt(P){P!==G&&(V&&n.lineWidth(P),G=P)}function D(P,ne,Y){P?(re(n.POLYGON_OFFSET_FILL),(W!==ne||F!==Y)&&(W=ne,F=Y,a.getReversed()&&(ne=-ne),n.polygonOffset(ne,Y))):Ie(n.POLYGON_OFFSET_FILL)}function Ct(P){P?re(n.SCISSOR_TEST):Ie(n.SCISSOR_TEST)}function Ye(P){P===void 0&&(P=n.TEXTURE0+H-1),de!==P&&(n.activeTexture(P),de=P)}function lt(P,ne,Y){Y===void 0&&(de===null?Y=n.TEXTURE0+H-1:Y=de);let _e=be[Y];_e===void 0&&(_e={type:void 0,texture:void 0},be[Y]=_e),(_e.type!==P||_e.texture!==ne)&&(de!==Y&&(n.activeTexture(Y),de=Y),n.bindTexture(P,ne||me[P]),_e.type=P,_e.texture=ne)}function he(){let P=be[de];P!==void 0&&P.type!==void 0&&(n.bindTexture(P.type,null),P.type=void 0,P.texture=void 0)}function St(){try{n.compressedTexImage2D(...arguments)}catch(P){Re("WebGLState:",P)}}function w(){try{n.compressedTexImage3D(...arguments)}catch(P){Re("WebGLState:",P)}}function x(){try{n.texSubImage2D(...arguments)}catch(P){Re("WebGLState:",P)}}function U(){try{n.texSubImage3D(...arguments)}catch(P){Re("WebGLState:",P)}}function q(){try{n.compressedTexSubImage2D(...arguments)}catch(P){Re("WebGLState:",P)}}function J(){try{n.compressedTexSubImage3D(...arguments)}catch(P){Re("WebGLState:",P)}}function ee(){try{n.texStorage2D(...arguments)}catch(P){Re("WebGLState:",P)}}function oe(){try{n.texStorage3D(...arguments)}catch(P){Re("WebGLState:",P)}}function X(){try{n.texImage2D(...arguments)}catch(P){Re("WebGLState:",P)}}function $(){try{n.texImage3D(...arguments)}catch(P){Re("WebGLState:",P)}}function ge(P){return f[P]!==void 0?f[P]:n.getParameter(P)}function Se(P,ne){f[P]!==ne&&(n.pixelStorei(P,ne),f[P]=ne)}function se(P){tt.equals(P)===!1&&(n.scissor(P.x,P.y,P.z,P.w),tt.copy(P))}function te(P){ke.equals(P)===!1&&(n.viewport(P.x,P.y,P.z,P.w),ke.copy(P))}function Le(P,ne){let Y=h.get(ne);Y===void 0&&(Y=new WeakMap,h.set(ne,Y));let _e=Y.get(P);_e===void 0&&(_e=n.getUniformBlockIndex(ne,P.name),Y.set(P,_e))}function Be(P,ne){let _e=h.get(ne).get(P);c.get(ne)!==_e&&(n.uniformBlockBinding(ne,_e,P.__bindingPointIndex),c.set(ne,_e))}function Je(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),a.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),n.pixelStorei(n.PACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,!1),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,n.BROWSER_DEFAULT_WEBGL),n.pixelStorei(n.PACK_ROW_LENGTH,0),n.pixelStorei(n.PACK_SKIP_PIXELS,0),n.pixelStorei(n.PACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_ROW_LENGTH,0),n.pixelStorei(n.UNPACK_IMAGE_HEIGHT,0),n.pixelStorei(n.UNPACK_SKIP_PIXELS,0),n.pixelStorei(n.UNPACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_SKIP_IMAGES,0),u={},f={},de=null,be={},d={},p=new WeakMap,g=[],y=null,m=!1,l=null,b=null,v=null,_=null,E=null,T=null,C=null,S=new Ke(0,0,0),A=0,L=!1,I=null,N=null,G=null,W=null,F=null,tt.set(0,0,n.canvas.width,n.canvas.height),ke.set(0,0,n.canvas.width,n.canvas.height),s.reset(),a.reset(),o.reset()}return{buffers:{color:s,depth:a,stencil:o},enable:re,disable:Ie,bindFramebuffer:Fe,drawBuffers:Pe,useProgram:mt,setBlending:ht,setMaterial:Ge,setFlipSided:At,setCullFace:gt,setLineWidth:qt,setPolygonOffset:D,setScissorTest:Ct,activeTexture:Ye,bindTexture:lt,unbindTexture:he,compressedTexImage2D:St,compressedTexImage3D:w,texImage2D:X,texImage3D:$,pixelStorei:Se,getParameter:ge,updateUBOMapping:Le,uniformBlockBinding:Be,texStorage2D:ee,texStorage3D:oe,texSubImage2D:x,texSubImage3D:U,compressedTexSubImage2D:q,compressedTexSubImage3D:J,scissor:se,viewport:te,reset:Je}}function X_(n,e,t,i,r,s,a){let o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),h=new xe,u=new WeakMap,f=new Set,d,p=new WeakMap,g=!1;try{g=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function y(w,x){return g?new OffscreenCanvas(w,x):fr("canvas")}function m(w,x,U){let q=1,J=St(w);if((J.width>U||J.height>U)&&(q=U/Math.max(J.width,J.height)),q<1)if(typeof HTMLImageElement<"u"&&w instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&w instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&w instanceof ImageBitmap||typeof VideoFrame<"u"&&w instanceof VideoFrame){let ee=Math.floor(q*J.width),oe=Math.floor(q*J.height);d===void 0&&(d=y(ee,oe));let X=x?y(ee,oe):d;return X.width=ee,X.height=oe,X.getContext("2d").drawImage(w,0,0,ee,oe),Ce("WebGLRenderer: Texture has been resized from ("+J.width+"x"+J.height+") to ("+ee+"x"+oe+")."),X}else return"data"in w&&Ce("WebGLRenderer: Image in DataTexture is too big ("+J.width+"x"+J.height+")."),w;return w}function l(w){return w.generateMipmaps}function b(w){n.generateMipmap(w)}function v(w){return w.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:w.isWebGL3DRenderTarget?n.TEXTURE_3D:w.isWebGLArrayRenderTarget||w.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function _(w,x,U,q,J,ee=!1){if(w!==null){if(n[w]!==void 0)return n[w];Ce("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+w+"'")}let oe;q&&(oe=e.get("EXT_texture_norm16"),oe||Ce("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let X=x;if(x===n.RED&&(U===n.FLOAT&&(X=n.R32F),U===n.HALF_FLOAT&&(X=n.R16F),U===n.UNSIGNED_BYTE&&(X=n.R8),U===n.UNSIGNED_SHORT&&oe&&(X=oe.R16_EXT),U===n.SHORT&&oe&&(X=oe.R16_SNORM_EXT)),x===n.RED_INTEGER&&(U===n.UNSIGNED_BYTE&&(X=n.R8UI),U===n.UNSIGNED_SHORT&&(X=n.R16UI),U===n.UNSIGNED_INT&&(X=n.R32UI),U===n.BYTE&&(X=n.R8I),U===n.SHORT&&(X=n.R16I),U===n.INT&&(X=n.R32I)),x===n.RG&&(U===n.FLOAT&&(X=n.RG32F),U===n.HALF_FLOAT&&(X=n.RG16F),U===n.UNSIGNED_BYTE&&(X=n.RG8),U===n.UNSIGNED_SHORT&&oe&&(X=oe.RG16_EXT),U===n.SHORT&&oe&&(X=oe.RG16_SNORM_EXT)),x===n.RG_INTEGER&&(U===n.UNSIGNED_BYTE&&(X=n.RG8UI),U===n.UNSIGNED_SHORT&&(X=n.RG16UI),U===n.UNSIGNED_INT&&(X=n.RG32UI),U===n.BYTE&&(X=n.RG8I),U===n.SHORT&&(X=n.RG16I),U===n.INT&&(X=n.RG32I)),x===n.RGB_INTEGER&&(U===n.UNSIGNED_BYTE&&(X=n.RGB8UI),U===n.UNSIGNED_SHORT&&(X=n.RGB16UI),U===n.UNSIGNED_INT&&(X=n.RGB32UI),U===n.BYTE&&(X=n.RGB8I),U===n.SHORT&&(X=n.RGB16I),U===n.INT&&(X=n.RGB32I)),x===n.RGBA_INTEGER&&(U===n.UNSIGNED_BYTE&&(X=n.RGBA8UI),U===n.UNSIGNED_SHORT&&(X=n.RGBA16UI),U===n.UNSIGNED_INT&&(X=n.RGBA32UI),U===n.BYTE&&(X=n.RGBA8I),U===n.SHORT&&(X=n.RGBA16I),U===n.INT&&(X=n.RGBA32I)),x===n.RGB&&(U===n.UNSIGNED_SHORT&&oe&&(X=oe.RGB16_EXT),U===n.SHORT&&oe&&(X=oe.RGB16_SNORM_EXT),U===n.UNSIGNED_INT_5_9_9_9_REV&&(X=n.RGB9_E5),U===n.UNSIGNED_INT_10F_11F_11F_REV&&(X=n.R11F_G11F_B10F)),x===n.RGBA){let $=ee?Yr:qe.getTransfer(J);U===n.FLOAT&&(X=n.RGBA32F),U===n.HALF_FLOAT&&(X=n.RGBA16F),U===n.UNSIGNED_BYTE&&(X=$===Qe?n.SRGB8_ALPHA8:n.RGBA8),U===n.UNSIGNED_SHORT&&oe&&(X=oe.RGBA16_EXT),U===n.SHORT&&oe&&(X=oe.RGBA16_SNORM_EXT),U===n.UNSIGNED_SHORT_4_4_4_4&&(X=n.RGBA4),U===n.UNSIGNED_SHORT_5_5_5_1&&(X=n.RGB5_A1)}return(X===n.R16F||X===n.R32F||X===n.RG16F||X===n.RG32F||X===n.RGBA16F||X===n.RGBA32F)&&e.get("EXT_color_buffer_float"),X}function E(w,x){let U;return w?x===null||x===yn||x===Rr?U=n.DEPTH24_STENCIL8:x===xn?U=n.DEPTH32F_STENCIL8:x===Cr&&(U=n.DEPTH24_STENCIL8,Ce("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):x===null||x===yn||x===Rr?U=n.DEPTH_COMPONENT24:x===xn?U=n.DEPTH_COMPONENT32F:x===Cr&&(U=n.DEPTH_COMPONENT16),U}function T(w,x){return l(w)===!0||w.isFramebufferTexture&&w.minFilter!==Dt&&w.minFilter!==ce?Math.log2(Math.max(x.width,x.height))+1:w.mipmaps!==void 0&&w.mipmaps.length>0?w.mipmaps.length:w.isCompressedTexture&&Array.isArray(w.image)?x.mipmaps.length:1}function C(w){let x=w.target;x.removeEventListener("dispose",C),A(x),x.isVideoTexture&&u.delete(x),x.isHTMLTexture&&f.delete(x)}function S(w){let x=w.target;x.removeEventListener("dispose",S),I(x)}function A(w){let x=i.get(w);if(x.__webglInit===void 0)return;let U=w.source,q=p.get(U);if(q){let J=q[x.__cacheKey];J.usedTimes--,J.usedTimes===0&&L(w),Object.keys(q).length===0&&p.delete(U)}i.remove(w)}function L(w){let x=i.get(w);n.deleteTexture(x.__webglTexture);let U=w.source,q=p.get(U);delete q[x.__cacheKey],a.memory.textures--}function I(w){let x=i.get(w);if(w.depthTexture&&(w.depthTexture.dispose(),i.remove(w.depthTexture)),w.isWebGLCubeRenderTarget)for(let q=0;q<6;q++){if(Array.isArray(x.__webglFramebuffer[q]))for(let J=0;J<x.__webglFramebuffer[q].length;J++)n.deleteFramebuffer(x.__webglFramebuffer[q][J]);else n.deleteFramebuffer(x.__webglFramebuffer[q]);x.__webglDepthbuffer&&n.deleteRenderbuffer(x.__webglDepthbuffer[q])}else{if(Array.isArray(x.__webglFramebuffer))for(let q=0;q<x.__webglFramebuffer.length;q++)n.deleteFramebuffer(x.__webglFramebuffer[q]);else n.deleteFramebuffer(x.__webglFramebuffer);if(x.__webglDepthbuffer&&n.deleteRenderbuffer(x.__webglDepthbuffer),x.__webglMultisampledFramebuffer&&n.deleteFramebuffer(x.__webglMultisampledFramebuffer),x.__webglColorRenderbuffer)for(let q=0;q<x.__webglColorRenderbuffer.length;q++)x.__webglColorRenderbuffer[q]&&n.deleteRenderbuffer(x.__webglColorRenderbuffer[q]);x.__webglDepthRenderbuffer&&n.deleteRenderbuffer(x.__webglDepthRenderbuffer)}let U=w.textures;for(let q=0,J=U.length;q<J;q++){let ee=i.get(U[q]);ee.__webglTexture&&(n.deleteTexture(ee.__webglTexture),a.memory.textures--),i.remove(U[q])}i.remove(w)}let N=0;function G(){N=0}function W(){return N}function F(w){N=w}function H(){let w=N;return w>=r.maxTextures&&Ce("WebGLTextures: Trying to use "+w+" texture units while this GPU supports only "+r.maxTextures),N+=1,w}function V(w){let x=[];return x.push(w.wrapS),x.push(w.wrapT),x.push(w.wrapR||0),x.push(w.magFilter),x.push(w.minFilter),x.push(w.anisotropy),x.push(w.internalFormat),x.push(w.format),x.push(w.type),x.push(w.generateMipmaps),x.push(w.premultiplyAlpha),x.push(w.flipY),x.push(w.unpackAlignment),x.push(w.colorSpace),x.join()}function j(w,x){let U=i.get(w);if(w.isVideoTexture&&lt(w),w.isRenderTargetTexture===!1&&w.isExternalTexture!==!0&&w.version>0&&U.__version!==w.version){let q=w.image;if(q===null)Ce("WebGLRenderer: Texture marked for update but no image data found.");else if(q.complete===!1)Ce("WebGLRenderer: Texture marked for update but image is incomplete");else{Ie(U,w,x);return}}else w.isExternalTexture&&(U.__webglTexture=w.sourceTexture?w.sourceTexture:null);t.bindTexture(n.TEXTURE_2D,U.__webglTexture,n.TEXTURE0+x)}function Q(w,x){let U=i.get(w);if(w.isRenderTargetTexture===!1&&w.version>0&&U.__version!==w.version){Ie(U,w,x);return}else w.isExternalTexture&&(U.__webglTexture=w.sourceTexture?w.sourceTexture:null);t.bindTexture(n.TEXTURE_2D_ARRAY,U.__webglTexture,n.TEXTURE0+x)}function de(w,x){let U=i.get(w);if(w.isRenderTargetTexture===!1&&w.version>0&&U.__version!==w.version){Ie(U,w,x);return}t.bindTexture(n.TEXTURE_3D,U.__webglTexture,n.TEXTURE0+x)}function be(w,x){let U=i.get(w);if(w.isCubeDepthTexture!==!0&&w.version>0&&U.__version!==w.version){Fe(U,w,x);return}t.bindTexture(n.TEXTURE_CUBE_MAP,U.__webglTexture,n.TEXTURE0+x)}let we={[Ta]:n.REPEAT,[Jt]:n.CLAMP_TO_EDGE,[Ea]:n.MIRRORED_REPEAT},$e={[Dt]:n.NEAREST,[vu]:n.NEAREST_MIPMAP_NEAREST,[_s]:n.NEAREST_MIPMAP_LINEAR,[ce]:n.LINEAR,[so]:n.LINEAR_MIPMAP_NEAREST,[_n]:n.LINEAR_MIPMAP_LINEAR},tt={[Tu]:n.NEVER,[Ru]:n.ALWAYS,[Eu]:n.LESS,[Go]:n.LEQUAL,[wu]:n.EQUAL,[Wo]:n.GEQUAL,[Au]:n.GREATER,[Cu]:n.NOTEQUAL};function ke(w,x){if(x.type===xn&&e.has("OES_texture_float_linear")===!1&&(x.magFilter===ce||x.magFilter===so||x.magFilter===_s||x.magFilter===_n||x.minFilter===ce||x.minFilter===so||x.minFilter===_s||x.minFilter===_n)&&Ce("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(w,n.TEXTURE_WRAP_S,we[x.wrapS]),n.texParameteri(w,n.TEXTURE_WRAP_T,we[x.wrapT]),(w===n.TEXTURE_3D||w===n.TEXTURE_2D_ARRAY)&&n.texParameteri(w,n.TEXTURE_WRAP_R,we[x.wrapR]),n.texParameteri(w,n.TEXTURE_MAG_FILTER,$e[x.magFilter]),n.texParameteri(w,n.TEXTURE_MIN_FILTER,$e[x.minFilter]),x.compareFunction&&(n.texParameteri(w,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(w,n.TEXTURE_COMPARE_FUNC,tt[x.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(x.magFilter===Dt||x.minFilter!==_s&&x.minFilter!==_n||x.type===xn&&e.has("OES_texture_float_linear")===!1)return;if(x.anisotropy>1||i.get(x).__currentAnisotropy){let U=e.get("EXT_texture_filter_anisotropic");n.texParameterf(w,U.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(x.anisotropy,r.getMaxAnisotropy())),i.get(x).__currentAnisotropy=x.anisotropy}}}function Z(w,x){let U=!1;w.__webglInit===void 0&&(w.__webglInit=!0,x.addEventListener("dispose",C));let q=x.source,J=p.get(q);J===void 0&&(J={},p.set(q,J));let ee=V(x);if(ee!==w.__cacheKey){J[ee]===void 0&&(J[ee]={texture:n.createTexture(),usedTimes:0},a.memory.textures++,U=!0),J[ee].usedTimes++;let oe=J[w.__cacheKey];oe!==void 0&&(J[w.__cacheKey].usedTimes--,oe.usedTimes===0&&L(x)),w.__cacheKey=ee,w.__webglTexture=J[ee].texture}return U}function me(w,x,U){return Math.floor(Math.floor(w/U)/x)}function re(w,x,U,q){let ee=w.updateRanges;if(ee.length===0)t.texSubImage2D(n.TEXTURE_2D,0,0,0,x.width,x.height,U,q,x.data);else{ee.sort((Se,se)=>Se.start-se.start);let oe=0;for(let Se=1;Se<ee.length;Se++){let se=ee[oe],te=ee[Se],Le=se.start+se.count,Be=me(te.start,x.width,4),Je=me(se.start,x.width,4);te.start<=Le+1&&Be===Je&&me(te.start+te.count-1,x.width,4)===Be?se.count=Math.max(se.count,te.start+te.count-se.start):(++oe,ee[oe]=te)}ee.length=oe+1;let X=t.getParameter(n.UNPACK_ROW_LENGTH),$=t.getParameter(n.UNPACK_SKIP_PIXELS),ge=t.getParameter(n.UNPACK_SKIP_ROWS);t.pixelStorei(n.UNPACK_ROW_LENGTH,x.width);for(let Se=0,se=ee.length;Se<se;Se++){let te=ee[Se],Le=Math.floor(te.start/4),Be=Math.ceil(te.count/4),Je=Le%x.width,P=Math.floor(Le/x.width),ne=Be,Y=1;t.pixelStorei(n.UNPACK_SKIP_PIXELS,Je),t.pixelStorei(n.UNPACK_SKIP_ROWS,P),t.texSubImage2D(n.TEXTURE_2D,0,Je,P,ne,Y,U,q,x.data)}w.clearUpdateRanges(),t.pixelStorei(n.UNPACK_ROW_LENGTH,X),t.pixelStorei(n.UNPACK_SKIP_PIXELS,$),t.pixelStorei(n.UNPACK_SKIP_ROWS,ge)}}function Ie(w,x,U){let q=n.TEXTURE_2D;(x.isDataArrayTexture||x.isCompressedArrayTexture)&&(q=n.TEXTURE_2D_ARRAY),x.isData3DTexture&&(q=n.TEXTURE_3D);let J=Z(w,x),ee=x.source;t.bindTexture(q,w.__webglTexture,n.TEXTURE0+U);let oe=i.get(ee);if(ee.version!==oe.__version||J===!0){if(t.activeTexture(n.TEXTURE0+U),(typeof ImageBitmap<"u"&&x.image instanceof ImageBitmap)===!1){let Y=qe.getPrimaries(qe.workingColorSpace),_e=x.colorSpace===Zn?null:qe.getPrimaries(x.colorSpace),ae=x.colorSpace===Zn||Y===_e?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,x.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,ae)}t.pixelStorei(n.UNPACK_ALIGNMENT,x.unpackAlignment);let $=m(x.image,!1,r.maxTextureSize);$=he(x,$);let ge=s.convert(x.format,x.colorSpace),Se=s.convert(x.type),se=_(x.internalFormat,ge,Se,x.normalized,x.colorSpace,x.isVideoTexture);ke(q,x);let te,Le=x.mipmaps,Be=x.isVideoTexture!==!0,Je=oe.__version===void 0||J===!0,P=ee.dataReady,ne=T(x,$);if(x.isDepthTexture)se=E(x.format===xi,x.type),Je&&(Be?t.texStorage2D(n.TEXTURE_2D,1,se,$.width,$.height):t.texImage2D(n.TEXTURE_2D,0,se,$.width,$.height,0,ge,Se,null));else if(x.isDataTexture)if(Le.length>0){Be&&Je&&t.texStorage2D(n.TEXTURE_2D,ne,se,Le[0].width,Le[0].height);for(let Y=0,_e=Le.length;Y<_e;Y++)te=Le[Y],Be?P&&t.texSubImage2D(n.TEXTURE_2D,Y,0,0,te.width,te.height,ge,Se,te.data):t.texImage2D(n.TEXTURE_2D,Y,se,te.width,te.height,0,ge,Se,te.data);x.generateMipmaps=!1}else Be?(Je&&t.texStorage2D(n.TEXTURE_2D,ne,se,$.width,$.height),P&&re(x,$,ge,Se)):t.texImage2D(n.TEXTURE_2D,0,se,$.width,$.height,0,ge,Se,$.data);else if(x.isCompressedTexture)if(x.isCompressedArrayTexture){Be&&Je&&t.texStorage3D(n.TEXTURE_2D_ARRAY,ne,se,Le[0].width,Le[0].height,$.depth);for(let Y=0,_e=Le.length;Y<_e;Y++)if(te=Le[Y],x.format!==hn)if(ge!==null)if(Be){if(P)if(x.layerUpdates.size>0){let ae=Tc(te.width,te.height,x.format,x.type);for(let K of x.layerUpdates){let Te=te.data.subarray(K*ae/te.data.BYTES_PER_ELEMENT,(K+1)*ae/te.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,Y,0,0,K,te.width,te.height,1,ge,Te)}x.clearLayerUpdates()}else t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,Y,0,0,0,te.width,te.height,$.depth,ge,te.data)}else t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,Y,se,te.width,te.height,$.depth,0,te.data,0,0);else Ce("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Be?P&&t.texSubImage3D(n.TEXTURE_2D_ARRAY,Y,0,0,0,te.width,te.height,$.depth,ge,Se,te.data):t.texImage3D(n.TEXTURE_2D_ARRAY,Y,se,te.width,te.height,$.depth,0,ge,Se,te.data)}else{Be&&Je&&t.texStorage2D(n.TEXTURE_2D,ne,se,Le[0].width,Le[0].height);for(let Y=0,_e=Le.length;Y<_e;Y++)te=Le[Y],x.format!==hn?ge!==null?Be?P&&t.compressedTexSubImage2D(n.TEXTURE_2D,Y,0,0,te.width,te.height,ge,te.data):t.compressedTexImage2D(n.TEXTURE_2D,Y,se,te.width,te.height,0,te.data):Ce("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Be?P&&t.texSubImage2D(n.TEXTURE_2D,Y,0,0,te.width,te.height,ge,Se,te.data):t.texImage2D(n.TEXTURE_2D,Y,se,te.width,te.height,0,ge,Se,te.data)}else if(x.isDataArrayTexture)if(Be){if(Je&&t.texStorage3D(n.TEXTURE_2D_ARRAY,ne,se,$.width,$.height,$.depth),P)if(x.layerUpdates.size>0){let Y=Tc($.width,$.height,x.format,x.type);for(let _e of x.layerUpdates){let ae=$.data.subarray(_e*Y/$.data.BYTES_PER_ELEMENT,(_e+1)*Y/$.data.BYTES_PER_ELEMENT);t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,_e,$.width,$.height,1,ge,Se,ae)}x.clearLayerUpdates()}else t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,$.width,$.height,$.depth,ge,Se,$.data)}else t.texImage3D(n.TEXTURE_2D_ARRAY,0,se,$.width,$.height,$.depth,0,ge,Se,$.data);else if(x.isData3DTexture)Be?(Je&&t.texStorage3D(n.TEXTURE_3D,ne,se,$.width,$.height,$.depth),P&&t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,$.width,$.height,$.depth,ge,Se,$.data)):t.texImage3D(n.TEXTURE_3D,0,se,$.width,$.height,$.depth,0,ge,Se,$.data);else if(x.isFramebufferTexture){if(Je)if(Be)t.texStorage2D(n.TEXTURE_2D,ne,se,$.width,$.height);else{let Y=$.width,_e=$.height;for(let ae=0;ae<ne;ae++)t.texImage2D(n.TEXTURE_2D,ae,se,Y,_e,0,ge,Se,null),Y>>=1,_e>>=1}}else if(x.isHTMLTexture){if("texElementImage2D"in n){let Y=n.canvas;if(Y.hasAttribute("layoutsubtree")||Y.setAttribute("layoutsubtree","true"),$.parentNode!==Y){Y.appendChild($),f.add(x),Y.onpaint=Ne=>{let Mt=Ne.changedElements;for(let it of f)Mt.includes(it.image)&&(it.needsUpdate=!0)},Y.requestPaint();return}let _e=0,ae=n.RGBA,K=n.RGBA,Te=n.UNSIGNED_BYTE;n.texElementImage2D(n.TEXTURE_2D,_e,ae,K,Te,$),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MIN_FILTER,n.LINEAR),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE)}}else if(Le.length>0){if(Be&&Je){let Y=St(Le[0]);t.texStorage2D(n.TEXTURE_2D,ne,se,Y.width,Y.height)}for(let Y=0,_e=Le.length;Y<_e;Y++)te=Le[Y],Be?P&&t.texSubImage2D(n.TEXTURE_2D,Y,0,0,ge,Se,te):t.texImage2D(n.TEXTURE_2D,Y,se,ge,Se,te);x.generateMipmaps=!1}else if(Be){if(Je){let Y=St($);t.texStorage2D(n.TEXTURE_2D,ne,se,Y.width,Y.height)}P&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,ge,Se,$)}else t.texImage2D(n.TEXTURE_2D,0,se,ge,Se,$);l(x)&&b(q),oe.__version=ee.version,x.onUpdate&&x.onUpdate(x)}w.__version=x.version}function Fe(w,x,U){if(x.image.length!==6)return;let q=Z(w,x),J=x.source;t.bindTexture(n.TEXTURE_CUBE_MAP,w.__webglTexture,n.TEXTURE0+U);let ee=i.get(J);if(J.version!==ee.__version||q===!0){t.activeTexture(n.TEXTURE0+U);let oe=qe.getPrimaries(qe.workingColorSpace),X=x.colorSpace===Zn?null:qe.getPrimaries(x.colorSpace),$=x.colorSpace===Zn||oe===X?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,x.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),t.pixelStorei(n.UNPACK_ALIGNMENT,x.unpackAlignment),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,$);let ge=x.isCompressedTexture||x.image[0].isCompressedTexture,Se=x.image[0]&&x.image[0].isDataTexture,se=[];for(let K=0;K<6;K++)!ge&&!Se?se[K]=m(x.image[K],!0,r.maxCubemapSize):se[K]=Se?x.image[K].image:x.image[K],se[K]=he(x,se[K]);let te=se[0],Le=s.convert(x.format,x.colorSpace),Be=s.convert(x.type),Je=_(x.internalFormat,Le,Be,x.normalized,x.colorSpace),P=x.isVideoTexture!==!0,ne=ee.__version===void 0||q===!0,Y=J.dataReady,_e=T(x,te);ke(n.TEXTURE_CUBE_MAP,x);let ae;if(ge){P&&ne&&t.texStorage2D(n.TEXTURE_CUBE_MAP,_e,Je,te.width,te.height);for(let K=0;K<6;K++){ae=se[K].mipmaps;for(let Te=0;Te<ae.length;Te++){let Ne=ae[Te];x.format!==hn?Le!==null?P?Y&&t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Te,0,0,Ne.width,Ne.height,Le,Ne.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Te,Je,Ne.width,Ne.height,0,Ne.data):Ce("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):P?Y&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Te,0,0,Ne.width,Ne.height,Le,Be,Ne.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Te,Je,Ne.width,Ne.height,0,Le,Be,Ne.data)}}}else{if(ae=x.mipmaps,P&&ne){ae.length>0&&_e++;let K=St(se[0]);t.texStorage2D(n.TEXTURE_CUBE_MAP,_e,Je,K.width,K.height)}for(let K=0;K<6;K++)if(Se){P?Y&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,0,0,se[K].width,se[K].height,Le,Be,se[K].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,Je,se[K].width,se[K].height,0,Le,Be,se[K].data);for(let Te=0;Te<ae.length;Te++){let Mt=ae[Te].image[K].image;P?Y&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Te+1,0,0,Mt.width,Mt.height,Le,Be,Mt.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Te+1,Je,Mt.width,Mt.height,0,Le,Be,Mt.data)}}else{P?Y&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,0,0,Le,Be,se[K]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,Je,Le,Be,se[K]);for(let Te=0;Te<ae.length;Te++){let Ne=ae[Te];P?Y&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Te+1,0,0,Le,Be,Ne.image[K]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Te+1,Je,Le,Be,Ne.image[K])}}}l(x)&&b(n.TEXTURE_CUBE_MAP),ee.__version=J.version,x.onUpdate&&x.onUpdate(x)}w.__version=x.version}function Pe(w,x,U,q,J,ee){let oe=s.convert(U.format,U.colorSpace),X=s.convert(U.type),$=_(U.internalFormat,oe,X,U.normalized,U.colorSpace),ge=i.get(x),Se=i.get(U);if(Se.__renderTarget=x,!ge.__hasExternalTextures){let se=Math.max(1,x.width>>ee),te=Math.max(1,x.height>>ee);J===n.TEXTURE_3D||J===n.TEXTURE_2D_ARRAY?t.texImage3D(J,ee,$,se,te,x.depth,0,oe,X,null):t.texImage2D(J,ee,$,se,te,0,oe,X,null)}t.bindFramebuffer(n.FRAMEBUFFER,w),Ye(x)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,q,J,Se.__webglTexture,0,Ct(x)):(J===n.TEXTURE_2D||J>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&J<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,q,J,Se.__webglTexture,ee),t.bindFramebuffer(n.FRAMEBUFFER,null)}function mt(w,x,U){if(n.bindRenderbuffer(n.RENDERBUFFER,w),x.depthBuffer){let q=x.depthTexture,J=q&&q.isDepthTexture?q.type:null,ee=E(x.stencilBuffer,J),oe=x.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;Ye(x)?o.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Ct(x),ee,x.width,x.height):U?n.renderbufferStorageMultisample(n.RENDERBUFFER,Ct(x),ee,x.width,x.height):n.renderbufferStorage(n.RENDERBUFFER,ee,x.width,x.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,oe,n.RENDERBUFFER,w)}else{let q=x.textures;for(let J=0;J<q.length;J++){let ee=q[J],oe=s.convert(ee.format,ee.colorSpace),X=s.convert(ee.type),$=_(ee.internalFormat,oe,X,ee.normalized,ee.colorSpace);Ye(x)?o.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Ct(x),$,x.width,x.height):U?n.renderbufferStorageMultisample(n.RENDERBUFFER,Ct(x),$,x.width,x.height):n.renderbufferStorage(n.RENDERBUFFER,$,x.width,x.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function Xe(w,x,U){let q=x.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(n.FRAMEBUFFER,w),!(x.depthTexture&&x.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let J=i.get(x.depthTexture);if(J.__renderTarget=x,(!J.__webglTexture||x.depthTexture.image.width!==x.width||x.depthTexture.image.height!==x.height)&&(x.depthTexture.image.width=x.width,x.depthTexture.image.height=x.height,x.depthTexture.needsUpdate=!0),q){if(J.__webglInit===void 0&&(J.__webglInit=!0,x.depthTexture.addEventListener("dispose",C)),J.__webglTexture===void 0){J.__webglTexture=n.createTexture(),t.bindTexture(n.TEXTURE_CUBE_MAP,J.__webglTexture),ke(n.TEXTURE_CUBE_MAP,x.depthTexture);let ge=s.convert(x.depthTexture.format),Se=s.convert(x.depthTexture.type),se;x.depthTexture.format===An?se=n.DEPTH_COMPONENT24:x.depthTexture.format===xi&&(se=n.DEPTH24_STENCIL8);for(let te=0;te<6;te++)n.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,se,x.width,x.height,0,ge,Se,null)}}else j(x.depthTexture,0);let ee=J.__webglTexture,oe=Ct(x),X=q?n.TEXTURE_CUBE_MAP_POSITIVE_X+U:n.TEXTURE_2D,$=x.depthTexture.format===xi?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;if(x.depthTexture.format===An)Ye(x)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,$,X,ee,0,oe):n.framebufferTexture2D(n.FRAMEBUFFER,$,X,ee,0);else if(x.depthTexture.format===xi)Ye(x)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,$,X,ee,0,oe):n.framebufferTexture2D(n.FRAMEBUFFER,$,X,ee,0);else throw new Error("Unknown depthTexture format")}function nt(w){let x=i.get(w),U=w.isWebGLCubeRenderTarget===!0;if(x.__boundDepthTexture!==w.depthTexture){let q=w.depthTexture;if(x.__depthDisposeCallback&&x.__depthDisposeCallback(),q){let J=()=>{delete x.__boundDepthTexture,delete x.__depthDisposeCallback,q.removeEventListener("dispose",J)};q.addEventListener("dispose",J),x.__depthDisposeCallback=J}x.__boundDepthTexture=q}if(w.depthTexture&&!x.__autoAllocateDepthBuffer)if(U)for(let q=0;q<6;q++)Xe(x.__webglFramebuffer[q],w,q);else{let q=w.texture.mipmaps;q&&q.length>0?Xe(x.__webglFramebuffer[0],w,0):Xe(x.__webglFramebuffer,w,0)}else if(U){x.__webglDepthbuffer=[];for(let q=0;q<6;q++)if(t.bindFramebuffer(n.FRAMEBUFFER,x.__webglFramebuffer[q]),x.__webglDepthbuffer[q]===void 0)x.__webglDepthbuffer[q]=n.createRenderbuffer(),mt(x.__webglDepthbuffer[q],w,!1);else{let J=w.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ee=x.__webglDepthbuffer[q];n.bindRenderbuffer(n.RENDERBUFFER,ee),n.framebufferRenderbuffer(n.FRAMEBUFFER,J,n.RENDERBUFFER,ee)}}else{let q=w.texture.mipmaps;if(q&&q.length>0?t.bindFramebuffer(n.FRAMEBUFFER,x.__webglFramebuffer[0]):t.bindFramebuffer(n.FRAMEBUFFER,x.__webglFramebuffer),x.__webglDepthbuffer===void 0)x.__webglDepthbuffer=n.createRenderbuffer(),mt(x.__webglDepthbuffer,w,!1);else{let J=w.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ee=x.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,ee),n.framebufferRenderbuffer(n.FRAMEBUFFER,J,n.RENDERBUFFER,ee)}}t.bindFramebuffer(n.FRAMEBUFFER,null)}function ht(w,x,U){let q=i.get(w);x!==void 0&&Pe(q.__webglFramebuffer,w,w.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),U!==void 0&&nt(w)}function Ge(w){let x=w.texture,U=i.get(w),q=i.get(x);w.addEventListener("dispose",S);let J=w.textures,ee=w.isWebGLCubeRenderTarget===!0,oe=J.length>1;if(oe||(q.__webglTexture===void 0&&(q.__webglTexture=n.createTexture()),q.__version=x.version,a.memory.textures++),ee){U.__webglFramebuffer=[];for(let X=0;X<6;X++)if(x.mipmaps&&x.mipmaps.length>0){U.__webglFramebuffer[X]=[];for(let $=0;$<x.mipmaps.length;$++)U.__webglFramebuffer[X][$]=n.createFramebuffer()}else U.__webglFramebuffer[X]=n.createFramebuffer()}else{if(x.mipmaps&&x.mipmaps.length>0){U.__webglFramebuffer=[];for(let X=0;X<x.mipmaps.length;X++)U.__webglFramebuffer[X]=n.createFramebuffer()}else U.__webglFramebuffer=n.createFramebuffer();if(oe)for(let X=0,$=J.length;X<$;X++){let ge=i.get(J[X]);ge.__webglTexture===void 0&&(ge.__webglTexture=n.createTexture(),a.memory.textures++)}if(w.samples>0&&Ye(w)===!1){U.__webglMultisampledFramebuffer=n.createFramebuffer(),U.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,U.__webglMultisampledFramebuffer);for(let X=0;X<J.length;X++){let $=J[X];U.__webglColorRenderbuffer[X]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,U.__webglColorRenderbuffer[X]);let ge=s.convert($.format,$.colorSpace),Se=s.convert($.type),se=_($.internalFormat,ge,Se,$.normalized,$.colorSpace,w.isXRRenderTarget===!0),te=Ct(w);n.renderbufferStorageMultisample(n.RENDERBUFFER,te,se,w.width,w.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+X,n.RENDERBUFFER,U.__webglColorRenderbuffer[X])}n.bindRenderbuffer(n.RENDERBUFFER,null),w.depthBuffer&&(U.__webglDepthRenderbuffer=n.createRenderbuffer(),mt(U.__webglDepthRenderbuffer,w,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(ee){t.bindTexture(n.TEXTURE_CUBE_MAP,q.__webglTexture),ke(n.TEXTURE_CUBE_MAP,x);for(let X=0;X<6;X++)if(x.mipmaps&&x.mipmaps.length>0)for(let $=0;$<x.mipmaps.length;$++)Pe(U.__webglFramebuffer[X][$],w,x,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+X,$);else Pe(U.__webglFramebuffer[X],w,x,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+X,0);l(x)&&b(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(oe){for(let X=0,$=J.length;X<$;X++){let ge=J[X],Se=i.get(ge),se=n.TEXTURE_2D;(w.isWebGL3DRenderTarget||w.isWebGLArrayRenderTarget)&&(se=w.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(se,Se.__webglTexture),ke(se,ge),Pe(U.__webglFramebuffer,w,ge,n.COLOR_ATTACHMENT0+X,se,0),l(ge)&&b(se)}t.unbindTexture()}else{let X=n.TEXTURE_2D;if((w.isWebGL3DRenderTarget||w.isWebGLArrayRenderTarget)&&(X=w.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(X,q.__webglTexture),ke(X,x),x.mipmaps&&x.mipmaps.length>0)for(let $=0;$<x.mipmaps.length;$++)Pe(U.__webglFramebuffer[$],w,x,n.COLOR_ATTACHMENT0,X,$);else Pe(U.__webglFramebuffer,w,x,n.COLOR_ATTACHMENT0,X,0);l(x)&&b(X),t.unbindTexture()}w.depthBuffer&&nt(w)}function At(w){let x=w.textures;for(let U=0,q=x.length;U<q;U++){let J=x[U];if(l(J)){let ee=v(w),oe=i.get(J).__webglTexture;t.bindTexture(ee,oe),b(ee),t.unbindTexture()}}}let gt=[],qt=[];function D(w){if(w.samples>0){if(Ye(w)===!1){let x=w.textures,U=w.width,q=w.height,J=n.COLOR_BUFFER_BIT,ee=w.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,oe=i.get(w),X=x.length>1;if(X)for(let ge=0;ge<x.length;ge++)t.bindFramebuffer(n.FRAMEBUFFER,oe.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+ge,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,oe.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+ge,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,oe.__webglMultisampledFramebuffer);let $=w.texture.mipmaps;$&&$.length>0?t.bindFramebuffer(n.DRAW_FRAMEBUFFER,oe.__webglFramebuffer[0]):t.bindFramebuffer(n.DRAW_FRAMEBUFFER,oe.__webglFramebuffer);for(let ge=0;ge<x.length;ge++){if(w.resolveDepthBuffer&&(w.depthBuffer&&(J|=n.DEPTH_BUFFER_BIT),w.stencilBuffer&&w.resolveStencilBuffer&&(J|=n.STENCIL_BUFFER_BIT)),X){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,oe.__webglColorRenderbuffer[ge]);let Se=i.get(x[ge]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,Se,0)}n.blitFramebuffer(0,0,U,q,0,0,U,q,J,n.NEAREST),c===!0&&(gt.length=0,qt.length=0,gt.push(n.COLOR_ATTACHMENT0+ge),w.depthBuffer&&w.resolveDepthBuffer===!1&&(gt.push(ee),qt.push(ee),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,qt)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,gt))}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),X)for(let ge=0;ge<x.length;ge++){t.bindFramebuffer(n.FRAMEBUFFER,oe.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+ge,n.RENDERBUFFER,oe.__webglColorRenderbuffer[ge]);let Se=i.get(x[ge]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,oe.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+ge,n.TEXTURE_2D,Se,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,oe.__webglMultisampledFramebuffer)}else if(w.depthBuffer&&w.resolveDepthBuffer===!1&&c){let x=w.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[x])}}}function Ct(w){return Math.min(r.maxSamples,w.samples)}function Ye(w){let x=i.get(w);return w.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&x.__useRenderToTexture!==!1}function lt(w){let x=a.render.frame;u.get(w)!==x&&(u.set(w,x),w.update())}function he(w,x){let U=w.colorSpace,q=w.format,J=w.type;return w.isCompressedTexture===!0||w.isVideoTexture===!0||U!==Xr&&U!==Zn&&(qe.getTransfer(U)===Qe?(q!==hn||J!==rn)&&Ce("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Re("WebGLTextures: Unsupported texture color space:",U)),x}function St(w){return typeof HTMLImageElement<"u"&&w instanceof HTMLImageElement?(h.width=w.naturalWidth||w.width,h.height=w.naturalHeight||w.height):typeof VideoFrame<"u"&&w instanceof VideoFrame?(h.width=w.displayWidth,h.height=w.displayHeight):(h.width=w.width,h.height=w.height),h}this.allocateTextureUnit=H,this.resetTextureUnits=G,this.getTextureUnits=W,this.setTextureUnits=F,this.setTexture2D=j,this.setTexture2DArray=Q,this.setTexture3D=de,this.setTextureCube=be,this.rebindTextures=ht,this.setupRenderTarget=Ge,this.updateRenderTargetMipmap=At,this.updateMultisampleRenderTarget=D,this.setupDepthRenderbuffer=nt,this.setupFrameBufferTexture=Pe,this.useMultisampledRTT=Ye,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function Y_(n,e){function t(i,r=Zn){let s,a=qe.getTransfer(r);if(i===rn)return n.UNSIGNED_BYTE;if(i===oo)return n.UNSIGNED_SHORT_4_4_4_4;if(i===lo)return n.UNSIGNED_SHORT_5_5_5_1;if(i===fc)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===pc)return n.UNSIGNED_INT_10F_11F_11F_REV;if(i===uc)return n.BYTE;if(i===dc)return n.SHORT;if(i===Cr)return n.UNSIGNED_SHORT;if(i===ao)return n.INT;if(i===yn)return n.UNSIGNED_INT;if(i===xn)return n.FLOAT;if(i===Dn)return n.HALF_FLOAT;if(i===mc)return n.ALPHA;if(i===gc)return n.RGB;if(i===hn)return n.RGBA;if(i===An)return n.DEPTH_COMPONENT;if(i===xi)return n.DEPTH_STENCIL;if(i===_c)return n.RED;if(i===co)return n.RED_INTEGER;if(i===Si)return n.RG;if(i===ho)return n.RG_INTEGER;if(i===uo)return n.RGBA_INTEGER;if(i===ys||i===xs||i===Ss||i===vs)if(a===Qe)if(s=e.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(i===ys)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===xs)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===Ss)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===vs)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=e.get("WEBGL_compressed_texture_s3tc"),s!==null){if(i===ys)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===xs)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===Ss)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===vs)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===fo||i===po||i===mo||i===go)if(s=e.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(i===fo)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===po)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===mo)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===go)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===_o||i===yo||i===xo||i===So||i===vo||i===bs||i===bo)if(s=e.get("WEBGL_compressed_texture_etc"),s!==null){if(i===_o||i===yo)return a===Qe?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(i===xo)return a===Qe?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC;if(i===So)return s.COMPRESSED_R11_EAC;if(i===vo)return s.COMPRESSED_SIGNED_R11_EAC;if(i===bs)return s.COMPRESSED_RG11_EAC;if(i===bo)return s.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===Mo||i===To||i===Eo||i===wo||i===Ao||i===Co||i===Ro||i===Io||i===Po||i===Do||i===Lo||i===Oo||i===Fo||i===No)if(s=e.get("WEBGL_compressed_texture_astc"),s!==null){if(i===Mo)return a===Qe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===To)return a===Qe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===Eo)return a===Qe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===wo)return a===Qe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===Ao)return a===Qe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===Co)return a===Qe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===Ro)return a===Qe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===Io)return a===Qe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===Po)return a===Qe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===Do)return a===Qe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===Lo)return a===Qe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===Oo)return a===Qe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===Fo)return a===Qe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===No)return a===Qe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===Uo||i===ko||i===Bo)if(s=e.get("EXT_texture_compression_bptc"),s!==null){if(i===Uo)return a===Qe?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===ko)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===Bo)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===Ho||i===zo||i===Ms||i===Vo)if(s=e.get("EXT_texture_compression_rgtc"),s!==null){if(i===Ho)return s.COMPRESSED_RED_RGTC1_EXT;if(i===zo)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Ms)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===Vo)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===Rr?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:t}}var q_=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,$_=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,kc=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let i=new ts(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=i}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,i=new tn({vertexShader:q_,fragmentShader:$_,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new dt(new en(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Bc=class extends Cn{constructor(e,t){super();let i=this,r=null,s=1,a=null,o="local-floor",c=1,h=null,u=null,f=null,d=null,p=null,g=null,y=typeof XRWebGLBinding<"u",m=new kc,l={},b=t.getContextAttributes(),v=null,_=null,E=[],T=[],C=new xe,S=null,A=new Wt;A.viewport=new bt;let L=new Wt;L.viewport=new bt;let I=[A,L],N=new no,G=null,W=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Z){let me=E[Z];return me===void 0&&(me=new _r,E[Z]=me),me.getTargetRaySpace()},this.getControllerGrip=function(Z){let me=E[Z];return me===void 0&&(me=new _r,E[Z]=me),me.getGripSpace()},this.getHand=function(Z){let me=E[Z];return me===void 0&&(me=new _r,E[Z]=me),me.getHandSpace()};function F(Z){let me=T.indexOf(Z.inputSource);if(me===-1)return;let re=E[me];re!==void 0&&(re.update(Z.inputSource,Z.frame,h||a),re.dispatchEvent({type:Z.type,data:Z.inputSource}))}function H(){r.removeEventListener("select",F),r.removeEventListener("selectstart",F),r.removeEventListener("selectend",F),r.removeEventListener("squeeze",F),r.removeEventListener("squeezestart",F),r.removeEventListener("squeezeend",F),r.removeEventListener("end",H),r.removeEventListener("inputsourceschange",V);for(let Z=0;Z<E.length;Z++){let me=T[Z];me!==null&&(T[Z]=null,E[Z].disconnect(me))}G=null,W=null,m.reset();for(let Z in l)delete l[Z];e.setRenderTarget(v),p=null,d=null,f=null,r=null,_=null,ke.stop(),i.isPresenting=!1,e.setPixelRatio(S),e.setSize(C.width,C.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Z){s=Z,i.isPresenting===!0&&Ce("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Z){o=Z,i.isPresenting===!0&&Ce("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return h||a},this.setReferenceSpace=function(Z){h=Z},this.getBaseLayer=function(){return d!==null?d:p},this.getBinding=function(){return f===null&&y&&(f=new XRWebGLBinding(r,t)),f},this.getFrame=function(){return g},this.getSession=function(){return r},this.setSession=async function(Z){if(r=Z,r!==null){if(v=e.getRenderTarget(),r.addEventListener("select",F),r.addEventListener("selectstart",F),r.addEventListener("selectend",F),r.addEventListener("squeeze",F),r.addEventListener("squeezestart",F),r.addEventListener("squeezeend",F),r.addEventListener("end",H),r.addEventListener("inputsourceschange",V),b.xrCompatible!==!0&&await t.makeXRCompatible(),S=e.getPixelRatio(),e.getSize(C),y&&"createProjectionLayer"in XRWebGLBinding.prototype){let re=null,Ie=null,Fe=null;b.depth&&(Fe=b.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,re=b.stencil?xi:An,Ie=b.stencil?Rr:yn);let Pe={colorFormat:t.RGBA8,depthFormat:Fe,scaleFactor:s};f=this.getBinding(),d=f.createProjectionLayer(Pe),r.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),_=new jt(d.textureWidth,d.textureHeight,{format:hn,type:rn,depthTexture:new $n(d.textureWidth,d.textureHeight,Ie,void 0,void 0,void 0,void 0,void 0,void 0,re),stencilBuffer:b.stencil,colorSpace:e.outputColorSpace,samples:b.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1})}else{let re={antialias:b.antialias,alpha:!0,depth:b.depth,stencil:b.stencil,framebufferScaleFactor:s};p=new XRWebGLLayer(r,t,re),r.updateRenderState({baseLayer:p}),e.setPixelRatio(1),e.setSize(p.framebufferWidth,p.framebufferHeight,!1),_=new jt(p.framebufferWidth,p.framebufferHeight,{format:hn,type:rn,colorSpace:e.outputColorSpace,stencilBuffer:b.stencil,resolveDepthBuffer:p.ignoreDepthValues===!1,resolveStencilBuffer:p.ignoreDepthValues===!1})}_.isXRRenderTarget=!0,this.setFoveation(c),h=null,a=await r.requestReferenceSpace(o),ke.setContext(r),ke.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function V(Z){for(let me=0;me<Z.removed.length;me++){let re=Z.removed[me],Ie=T.indexOf(re);Ie>=0&&(T[Ie]=null,E[Ie].disconnect(re))}for(let me=0;me<Z.added.length;me++){let re=Z.added[me],Ie=T.indexOf(re);if(Ie===-1){for(let Pe=0;Pe<E.length;Pe++)if(Pe>=T.length){T.push(re),Ie=Pe;break}else if(T[Pe]===null){T[Pe]=re,Ie=Pe;break}if(Ie===-1)break}let Fe=E[Ie];Fe&&Fe.connect(re)}}let j=new R,Q=new R;function de(Z,me,re){j.setFromMatrixPosition(me.matrixWorld),Q.setFromMatrixPosition(re.matrixWorld);let Ie=j.distanceTo(Q),Fe=me.projectionMatrix.elements,Pe=re.projectionMatrix.elements,mt=Fe[14]/(Fe[10]-1),Xe=Fe[14]/(Fe[10]+1),nt=(Fe[9]+1)/Fe[5],ht=(Fe[9]-1)/Fe[5],Ge=(Fe[8]-1)/Fe[0],At=(Pe[8]+1)/Pe[0],gt=mt*Ge,qt=mt*At,D=Ie/(-Ge+At),Ct=D*-Ge;if(me.matrixWorld.decompose(Z.position,Z.quaternion,Z.scale),Z.translateX(Ct),Z.translateZ(D),Z.matrixWorld.compose(Z.position,Z.quaternion,Z.scale),Z.matrixWorldInverse.copy(Z.matrixWorld).invert(),Fe[10]===-1)Z.projectionMatrix.copy(me.projectionMatrix),Z.projectionMatrixInverse.copy(me.projectionMatrixInverse);else{let Ye=mt+D,lt=Xe+D,he=gt-Ct,St=qt+(Ie-Ct),w=nt*Xe/lt*Ye,x=ht*Xe/lt*Ye;Z.projectionMatrix.makePerspective(he,St,w,x,Ye,lt),Z.projectionMatrixInverse.copy(Z.projectionMatrix).invert()}}function be(Z,me){me===null?Z.matrixWorld.copy(Z.matrix):Z.matrixWorld.multiplyMatrices(me.matrixWorld,Z.matrix),Z.matrixWorldInverse.copy(Z.matrixWorld).invert()}this.updateCamera=function(Z){if(r===null)return;let me=Z.near,re=Z.far;m.texture!==null&&(m.depthNear>0&&(me=m.depthNear),m.depthFar>0&&(re=m.depthFar)),N.near=L.near=A.near=me,N.far=L.far=A.far=re,(G!==N.near||W!==N.far)&&(r.updateRenderState({depthNear:N.near,depthFar:N.far}),G=N.near,W=N.far),N.layers.mask=Z.layers.mask|6,A.layers.mask=N.layers.mask&-5,L.layers.mask=N.layers.mask&-3;let Ie=Z.parent,Fe=N.cameras;be(N,Ie);for(let Pe=0;Pe<Fe.length;Pe++)be(Fe[Pe],Ie);Fe.length===2?de(N,A,L):N.projectionMatrix.copy(A.projectionMatrix),we(Z,N,Ie)};function we(Z,me,re){re===null?Z.matrix.copy(me.matrixWorld):(Z.matrix.copy(re.matrixWorld),Z.matrix.invert(),Z.matrix.multiply(me.matrixWorld)),Z.matrix.decompose(Z.position,Z.quaternion,Z.scale),Z.updateMatrixWorld(!0),Z.projectionMatrix.copy(me.projectionMatrix),Z.projectionMatrixInverse.copy(me.projectionMatrixInverse),Z.isPerspectiveCamera&&(Z.fov=Ra*2*Math.atan(1/Z.projectionMatrix.elements[5]),Z.zoom=1)}this.getCamera=function(){return N},this.getFoveation=function(){if(!(d===null&&p===null))return c},this.setFoveation=function(Z){c=Z,d!==null&&(d.fixedFoveation=Z),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=Z)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(N)},this.getCameraTexture=function(Z){return l[Z]};let $e=null;function tt(Z,me){if(u=me.getViewerPose(h||a),g=me,u!==null){let re=u.views;p!==null&&(e.setRenderTargetFramebuffer(_,p.framebuffer),e.setRenderTarget(_));let Ie=!1;re.length!==N.cameras.length&&(N.cameras.length=0,Ie=!0);for(let Xe=0;Xe<re.length;Xe++){let nt=re[Xe],ht=null;if(p!==null)ht=p.getViewport(nt);else{let At=f.getViewSubImage(d,nt);ht=At.viewport,Xe===0&&(e.setRenderTargetTextures(_,At.colorTexture,At.depthStencilTexture),e.setRenderTarget(_))}let Ge=I[Xe];Ge===void 0&&(Ge=new Wt,Ge.layers.enable(Xe),Ge.viewport=new bt,I[Xe]=Ge),Ge.matrix.fromArray(nt.transform.matrix),Ge.matrix.decompose(Ge.position,Ge.quaternion,Ge.scale),Ge.projectionMatrix.fromArray(nt.projectionMatrix),Ge.projectionMatrixInverse.copy(Ge.projectionMatrix).invert(),Ge.viewport.set(ht.x,ht.y,ht.width,ht.height),Xe===0&&(N.matrix.copy(Ge.matrix),N.matrix.decompose(N.position,N.quaternion,N.scale)),Ie===!0&&N.cameras.push(Ge)}let Fe=r.enabledFeatures;if(Fe&&Fe.includes("depth-sensing")&&r.depthUsage=="gpu-optimized"&&y){f=i.getBinding();let Xe=f.getDepthInformation(re[0]);Xe&&Xe.isValid&&Xe.texture&&m.init(Xe,r.renderState)}if(Fe&&Fe.includes("camera-access")&&y){e.state.unbindTexture(),f=i.getBinding();for(let Xe=0;Xe<re.length;Xe++){let nt=re[Xe].camera;if(nt){let ht=l[nt];ht||(ht=new ts,l[nt]=ht);let Ge=f.getCameraImage(nt);ht.sourceTexture=Ge}}}}for(let re=0;re<E.length;re++){let Ie=T[re],Fe=E[re];Ie!==null&&Fe!==void 0&&Fe.update(Ie,me,h||a)}$e&&$e(Z,me),me.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:me}),g=null}let ke=new hd;ke.setAnimationLoop(tt),this.setAnimationLoop=function(Z){$e=Z},this.dispose=function(){}}},Z_=new ft,gd=new Oe;gd.set(-1,0,0,0,1,0,0,0,1);function K_(n,e){function t(m,l){m.matrixAutoUpdate===!0&&m.updateMatrix(),l.value.copy(m.matrix)}function i(m,l){l.color.getRGB(m.fogColor.value,vc(n)),l.isFog?(m.fogNear.value=l.near,m.fogFar.value=l.far):l.isFogExp2&&(m.fogDensity.value=l.density)}function r(m,l,b,v,_){l.isNodeMaterial?l.uniformsNeedUpdate=!1:l.isMeshBasicMaterial?s(m,l):l.isMeshLambertMaterial?(s(m,l),l.envMap&&(m.envMapIntensity.value=l.envMapIntensity)):l.isMeshToonMaterial?(s(m,l),f(m,l)):l.isMeshPhongMaterial?(s(m,l),u(m,l),l.envMap&&(m.envMapIntensity.value=l.envMapIntensity)):l.isMeshStandardMaterial?(s(m,l),d(m,l),l.isMeshPhysicalMaterial&&p(m,l,_)):l.isMeshMatcapMaterial?(s(m,l),g(m,l)):l.isMeshDepthMaterial?s(m,l):l.isMeshDistanceMaterial?(s(m,l),y(m,l)):l.isMeshNormalMaterial?s(m,l):l.isLineBasicMaterial?(a(m,l),l.isLineDashedMaterial&&o(m,l)):l.isPointsMaterial?c(m,l,b,v):l.isSpriteMaterial?h(m,l):l.isShadowMaterial?(m.color.value.copy(l.color),m.opacity.value=l.opacity):l.isShaderMaterial&&(l.uniformsNeedUpdate=!1)}function s(m,l){m.opacity.value=l.opacity,l.color&&m.diffuse.value.copy(l.color),l.emissive&&m.emissive.value.copy(l.emissive).multiplyScalar(l.emissiveIntensity),l.map&&(m.map.value=l.map,t(l.map,m.mapTransform)),l.alphaMap&&(m.alphaMap.value=l.alphaMap,t(l.alphaMap,m.alphaMapTransform)),l.bumpMap&&(m.bumpMap.value=l.bumpMap,t(l.bumpMap,m.bumpMapTransform),m.bumpScale.value=l.bumpScale,l.side===Vt&&(m.bumpScale.value*=-1)),l.normalMap&&(m.normalMap.value=l.normalMap,t(l.normalMap,m.normalMapTransform),m.normalScale.value.copy(l.normalScale),l.side===Vt&&m.normalScale.value.negate()),l.displacementMap&&(m.displacementMap.value=l.displacementMap,t(l.displacementMap,m.displacementMapTransform),m.displacementScale.value=l.displacementScale,m.displacementBias.value=l.displacementBias),l.emissiveMap&&(m.emissiveMap.value=l.emissiveMap,t(l.emissiveMap,m.emissiveMapTransform)),l.specularMap&&(m.specularMap.value=l.specularMap,t(l.specularMap,m.specularMapTransform)),l.alphaTest>0&&(m.alphaTest.value=l.alphaTest);let b=e.get(l),v=b.envMap,_=b.envMapRotation;v&&(m.envMap.value=v,m.envMapRotation.value.setFromMatrix4(Z_.makeRotationFromEuler(_)).transpose(),v.isCubeTexture&&v.isRenderTargetTexture===!1&&m.envMapRotation.value.premultiply(gd),m.reflectivity.value=l.reflectivity,m.ior.value=l.ior,m.refractionRatio.value=l.refractionRatio),l.lightMap&&(m.lightMap.value=l.lightMap,m.lightMapIntensity.value=l.lightMapIntensity,t(l.lightMap,m.lightMapTransform)),l.aoMap&&(m.aoMap.value=l.aoMap,m.aoMapIntensity.value=l.aoMapIntensity,t(l.aoMap,m.aoMapTransform))}function a(m,l){m.diffuse.value.copy(l.color),m.opacity.value=l.opacity,l.map&&(m.map.value=l.map,t(l.map,m.mapTransform))}function o(m,l){m.dashSize.value=l.dashSize,m.totalSize.value=l.dashSize+l.gapSize,m.scale.value=l.scale}function c(m,l,b,v){m.diffuse.value.copy(l.color),m.opacity.value=l.opacity,m.size.value=l.size*b,m.scale.value=v*.5,l.map&&(m.map.value=l.map,t(l.map,m.uvTransform)),l.alphaMap&&(m.alphaMap.value=l.alphaMap,t(l.alphaMap,m.alphaMapTransform)),l.alphaTest>0&&(m.alphaTest.value=l.alphaTest)}function h(m,l){m.diffuse.value.copy(l.color),m.opacity.value=l.opacity,m.rotation.value=l.rotation,l.map&&(m.map.value=l.map,t(l.map,m.mapTransform)),l.alphaMap&&(m.alphaMap.value=l.alphaMap,t(l.alphaMap,m.alphaMapTransform)),l.alphaTest>0&&(m.alphaTest.value=l.alphaTest)}function u(m,l){m.specular.value.copy(l.specular),m.shininess.value=Math.max(l.shininess,1e-4)}function f(m,l){l.gradientMap&&(m.gradientMap.value=l.gradientMap)}function d(m,l){m.metalness.value=l.metalness,l.metalnessMap&&(m.metalnessMap.value=l.metalnessMap,t(l.metalnessMap,m.metalnessMapTransform)),m.roughness.value=l.roughness,l.roughnessMap&&(m.roughnessMap.value=l.roughnessMap,t(l.roughnessMap,m.roughnessMapTransform)),l.envMap&&(m.envMapIntensity.value=l.envMapIntensity)}function p(m,l,b){m.ior.value=l.ior,l.sheen>0&&(m.sheenColor.value.copy(l.sheenColor).multiplyScalar(l.sheen),m.sheenRoughness.value=l.sheenRoughness,l.sheenColorMap&&(m.sheenColorMap.value=l.sheenColorMap,t(l.sheenColorMap,m.sheenColorMapTransform)),l.sheenRoughnessMap&&(m.sheenRoughnessMap.value=l.sheenRoughnessMap,t(l.sheenRoughnessMap,m.sheenRoughnessMapTransform))),l.clearcoat>0&&(m.clearcoat.value=l.clearcoat,m.clearcoatRoughness.value=l.clearcoatRoughness,l.clearcoatMap&&(m.clearcoatMap.value=l.clearcoatMap,t(l.clearcoatMap,m.clearcoatMapTransform)),l.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=l.clearcoatRoughnessMap,t(l.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),l.clearcoatNormalMap&&(m.clearcoatNormalMap.value=l.clearcoatNormalMap,t(l.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(l.clearcoatNormalScale),l.side===Vt&&m.clearcoatNormalScale.value.negate())),l.dispersion>0&&(m.dispersion.value=l.dispersion),l.iridescence>0&&(m.iridescence.value=l.iridescence,m.iridescenceIOR.value=l.iridescenceIOR,m.iridescenceThicknessMinimum.value=l.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=l.iridescenceThicknessRange[1],l.iridescenceMap&&(m.iridescenceMap.value=l.iridescenceMap,t(l.iridescenceMap,m.iridescenceMapTransform)),l.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=l.iridescenceThicknessMap,t(l.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),l.transmission>0&&(m.transmission.value=l.transmission,m.transmissionSamplerMap.value=b.texture,m.transmissionSamplerSize.value.set(b.width,b.height),l.transmissionMap&&(m.transmissionMap.value=l.transmissionMap,t(l.transmissionMap,m.transmissionMapTransform)),m.thickness.value=l.thickness,l.thicknessMap&&(m.thicknessMap.value=l.thicknessMap,t(l.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=l.attenuationDistance,m.attenuationColor.value.copy(l.attenuationColor)),l.anisotropy>0&&(m.anisotropyVector.value.set(l.anisotropy*Math.cos(l.anisotropyRotation),l.anisotropy*Math.sin(l.anisotropyRotation)),l.anisotropyMap&&(m.anisotropyMap.value=l.anisotropyMap,t(l.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=l.specularIntensity,m.specularColor.value.copy(l.specularColor),l.specularColorMap&&(m.specularColorMap.value=l.specularColorMap,t(l.specularColorMap,m.specularColorMapTransform)),l.specularIntensityMap&&(m.specularIntensityMap.value=l.specularIntensityMap,t(l.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,l){l.matcap&&(m.matcap.value=l.matcap)}function y(m,l){let b=e.get(l).light;m.referencePosition.value.setFromMatrixPosition(b.matrixWorld),m.nearDistance.value=b.shadow.camera.near,m.farDistance.value=b.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function J_(n,e,t,i){let r={},s={},a=[],o=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function c(b,v){let _=v.program;i.uniformBlockBinding(b,_)}function h(b,v){let _=r[b.id];_===void 0&&(g(b),_=u(b),r[b.id]=_,b.addEventListener("dispose",m));let E=v.program;i.updateUBOMapping(b,E);let T=e.render.frame;s[b.id]!==T&&(d(b),s[b.id]=T)}function u(b){let v=f();b.__bindingPointIndex=v;let _=n.createBuffer(),E=b.__size,T=b.usage;return n.bindBuffer(n.UNIFORM_BUFFER,_),n.bufferData(n.UNIFORM_BUFFER,E,T),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,v,_),_}function f(){for(let b=0;b<o;b++)if(a.indexOf(b)===-1)return a.push(b),b;return Re("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(b){let v=r[b.id],_=b.uniforms,E=b.__cache;n.bindBuffer(n.UNIFORM_BUFFER,v);for(let T=0,C=_.length;T<C;T++){let S=Array.isArray(_[T])?_[T]:[_[T]];for(let A=0,L=S.length;A<L;A++){let I=S[A];if(p(I,T,A,E)===!0){let N=I.__offset,G=Array.isArray(I.value)?I.value:[I.value],W=0;for(let F=0;F<G.length;F++){let H=G[F],V=y(H);typeof H=="number"||typeof H=="boolean"?(I.__data[0]=H,n.bufferSubData(n.UNIFORM_BUFFER,N+W,I.__data)):H.isMatrix3?(I.__data[0]=H.elements[0],I.__data[1]=H.elements[1],I.__data[2]=H.elements[2],I.__data[3]=0,I.__data[4]=H.elements[3],I.__data[5]=H.elements[4],I.__data[6]=H.elements[5],I.__data[7]=0,I.__data[8]=H.elements[6],I.__data[9]=H.elements[7],I.__data[10]=H.elements[8],I.__data[11]=0):ArrayBuffer.isView(H)?I.__data.set(new H.constructor(H.buffer,H.byteOffset,I.__data.length)):(H.toArray(I.__data,W),W+=V.storage/Float32Array.BYTES_PER_ELEMENT)}n.bufferSubData(n.UNIFORM_BUFFER,N,I.__data)}}}n.bindBuffer(n.UNIFORM_BUFFER,null)}function p(b,v,_,E){let T=b.value,C=v+"_"+_;if(E[C]===void 0)return typeof T=="number"||typeof T=="boolean"?E[C]=T:ArrayBuffer.isView(T)?E[C]=T.slice():E[C]=T.clone(),!0;{let S=E[C];if(typeof T=="number"||typeof T=="boolean"){if(S!==T)return E[C]=T,!0}else{if(ArrayBuffer.isView(T))return!0;if(S.equals(T)===!1)return S.copy(T),!0}}return!1}function g(b){let v=b.uniforms,_=0,E=16;for(let C=0,S=v.length;C<S;C++){let A=Array.isArray(v[C])?v[C]:[v[C]];for(let L=0,I=A.length;L<I;L++){let N=A[L],G=Array.isArray(N.value)?N.value:[N.value];for(let W=0,F=G.length;W<F;W++){let H=G[W],V=y(H),j=_%E,Q=j%V.boundary,de=j+Q;_+=Q,de!==0&&E-de<V.storage&&(_+=E-de),N.__data=new Float32Array(V.storage/Float32Array.BYTES_PER_ELEMENT),N.__offset=_,_+=V.storage}}}let T=_%E;return T>0&&(_+=E-T),b.__size=_,b.__cache={},this}function y(b){let v={boundary:0,storage:0};return typeof b=="number"||typeof b=="boolean"?(v.boundary=4,v.storage=4):b.isVector2?(v.boundary=8,v.storage=8):b.isVector3||b.isColor?(v.boundary=16,v.storage=12):b.isVector4?(v.boundary=16,v.storage=16):b.isMatrix3?(v.boundary=48,v.storage=48):b.isMatrix4?(v.boundary=64,v.storage=64):b.isTexture?Ce("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(b)?(v.boundary=16,v.storage=b.byteLength):Ce("WebGLRenderer: Unsupported uniform value type.",b),v}function m(b){let v=b.target;v.removeEventListener("dispose",m);let _=a.indexOf(v.__bindingPointIndex);a.splice(_,1),n.deleteBuffer(r[v.id]),delete r[v.id],delete s[v.id]}function l(){for(let b in r)n.deleteBuffer(r[b]);a=[],r={},s={}}return{bind:c,update:h,dispose:l}}var j_=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),Ln=null;function Q_(){return Ln===null&&(Ln=new Oa(j_,16,16,Si,Dn),Ln.name="DFG_LUT",Ln.minFilter=ce,Ln.magFilter=ce,Ln.wrapS=Jt,Ln.wrapT=Jt,Ln.generateMipmaps=!1,Ln.needsUpdate=!0),Ln}var As=class{constructor(e={}){let{canvas:t=Iu(),context:i=null,depth:r=!0,stencil:s=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:h=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:f=!1,reversedDepthBuffer:d=!1,outputBufferType:p=rn}=e;this.isWebGLRenderer=!0;let g;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");g=i.getContextAttributes().alpha}else g=a;let y=p,m=new Set([uo,ho,co]),l=new Set([rn,yn,Cr,Rr,oo,lo]),b=new Uint32Array(4),v=new Int32Array(4),_=new R,E=null,T=null,C=[],S=[],A=null;this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=gn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let L=this,I=!1,N=null;this._outputColorSpace=De;let G=0,W=0,F=null,H=-1,V=null,j=new bt,Q=new bt,de=null,be=new Ke(0),we=0,$e=t.width,tt=t.height,ke=1,Z=null,me=null,re=new bt(0,0,$e,tt),Ie=new bt(0,0,$e,tt),Fe=!1,Pe=new Qr,mt=!1,Xe=!1,nt=new ft,ht=new R,Ge=new bt,At={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},gt=!1;function qt(){return F===null?ke:1}let D=i;function Ct(M,O){return t.getContext(M,O)}try{let M={alpha:!0,depth:r,stencil:s,antialias:o,premultipliedAlpha:c,preserveDrawingBuffer:h,powerPreference:u,failIfMajorPerformanceCaveat:f};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"184"}`),t.addEventListener("webglcontextlost",K,!1),t.addEventListener("webglcontextrestored",Te,!1),t.addEventListener("webglcontextcreationerror",Ne,!1),D===null){let O="webgl2";if(D=Ct(O,M),D===null)throw Ct(O)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(M){throw Re("WebGLRenderer: "+M.message),M}let Ye,lt,he,St,w,x,U,q,J,ee,oe,X,$,ge,Se,se,te,Le,Be,Je,P,ne,Y;function _e(){Ye=new a0(D),Ye.init(),P=new Y_(D,Ye),lt=new jg(D,Ye,e,P),he=new W_(D,Ye),lt.reversedDepthBuffer&&d&&he.buffers.depth.setReversed(!0),St=new c0(D),w=new I_,x=new X_(D,Ye,he,w,lt,P,St),U=new s0(L),q=new fp(D),ne=new Kg(D,q),J=new o0(D,q,St,ne),ee=new u0(D,J,q,ne,St),Le=new h0(D,lt,x),Se=new Qg(w),oe=new R_(L,U,Ye,lt,ne,Se),X=new K_(L,w),$=new D_,ge=new k_(Ye),te=new Zg(L,U,he,ee,g,c),se=new G_(L,ee,lt),Y=new J_(D,St,lt,he),Be=new Jg(D,Ye,St),Je=new l0(D,Ye,St),St.programs=oe.programs,L.capabilities=lt,L.extensions=Ye,L.properties=w,L.renderLists=$,L.shadowMap=se,L.state=he,L.info=St}_e(),y!==rn&&(A=new f0(y,t.width,t.height,r,s));let ae=new Bc(L,D);this.xr=ae,this.getContext=function(){return D},this.getContextAttributes=function(){return D.getContextAttributes()},this.forceContextLoss=function(){let M=Ye.get("WEBGL_lose_context");M&&M.loseContext()},this.forceContextRestore=function(){let M=Ye.get("WEBGL_lose_context");M&&M.restoreContext()},this.getPixelRatio=function(){return ke},this.setPixelRatio=function(M){M!==void 0&&(ke=M,this.setSize($e,tt,!1))},this.getSize=function(M){return M.set($e,tt)},this.setSize=function(M,O,z=!0){if(ae.isPresenting){Ce("WebGLRenderer: Can't change size while VR device is presenting.");return}$e=M,tt=O,t.width=Math.floor(M*ke),t.height=Math.floor(O*ke),z===!0&&(t.style.width=M+"px",t.style.height=O+"px"),A!==null&&A.setSize(t.width,t.height),this.setViewport(0,0,M,O)},this.getDrawingBufferSize=function(M){return M.set($e*ke,tt*ke).floor()},this.setDrawingBufferSize=function(M,O,z){$e=M,tt=O,ke=z,t.width=Math.floor(M*z),t.height=Math.floor(O*z),this.setViewport(0,0,M,O)},this.setEffects=function(M){if(y===rn){Re("THREE.WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(M){for(let O=0;O<M.length;O++)if(M[O].isOutputPass===!0){Ce("THREE.WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}A.setEffects(M||[])},this.getCurrentViewport=function(M){return M.copy(j)},this.getViewport=function(M){return M.copy(re)},this.setViewport=function(M,O,z,k){M.isVector4?re.set(M.x,M.y,M.z,M.w):re.set(M,O,z,k),he.viewport(j.copy(re).multiplyScalar(ke).round())},this.getScissor=function(M){return M.copy(Ie)},this.setScissor=function(M,O,z,k){M.isVector4?Ie.set(M.x,M.y,M.z,M.w):Ie.set(M,O,z,k),he.scissor(Q.copy(Ie).multiplyScalar(ke).round())},this.getScissorTest=function(){return Fe},this.setScissorTest=function(M){he.setScissorTest(Fe=M)},this.setOpaqueSort=function(M){Z=M},this.setTransparentSort=function(M){me=M},this.getClearColor=function(M){return M.copy(te.getClearColor())},this.setClearColor=function(){te.setClearColor(...arguments)},this.getClearAlpha=function(){return te.getClearAlpha()},this.setClearAlpha=function(){te.setClearAlpha(...arguments)},this.clear=function(M=!0,O=!0,z=!0){let k=0;if(M){let B=!1;if(F!==null){let pe=F.texture.format;B=m.has(pe)}if(B){let pe=F.texture.type,ve=l.has(pe),fe=te.getClearColor(),Me=te.getClearAlpha(),Ee=fe.r,Ue=fe.g,ze=fe.b;ve?(b[0]=Ee,b[1]=Ue,b[2]=ze,b[3]=Me,D.clearBufferuiv(D.COLOR,0,b)):(v[0]=Ee,v[1]=Ue,v[2]=ze,v[3]=Me,D.clearBufferiv(D.COLOR,0,v))}else k|=D.COLOR_BUFFER_BIT}O&&(k|=D.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),z&&(k|=D.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),k!==0&&D.clear(k)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(M){M.setRenderer(this),N=M},this.dispose=function(){t.removeEventListener("webglcontextlost",K,!1),t.removeEventListener("webglcontextrestored",Te,!1),t.removeEventListener("webglcontextcreationerror",Ne,!1),te.dispose(),$.dispose(),ge.dispose(),w.dispose(),U.dispose(),ee.dispose(),ne.dispose(),Y.dispose(),oe.dispose(),ae.dispose(),ae.removeEventListener("sessionstart",uh),ae.removeEventListener("sessionend",dh),Ai.stop()};function K(M){M.preventDefault(),$r("WebGLRenderer: Context Lost."),I=!0}function Te(){$r("WebGLRenderer: Context Restored."),I=!1;let M=St.autoReset,O=se.enabled,z=se.autoUpdate,k=se.needsUpdate,B=se.type;_e(),St.autoReset=M,se.enabled=O,se.autoUpdate=z,se.needsUpdate=k,se.type=B}function Ne(M){Re("WebGLRenderer: A WebGL context could not be created. Reason: ",M.statusMessage)}function Mt(M){let O=M.target;O.removeEventListener("dispose",Mt),it(O)}function it(M){Un(M),w.remove(M)}function Un(M){let O=w.get(M).programs;O!==void 0&&(O.forEach(function(z){oe.releaseProgram(z)}),M.isShaderMaterial&&oe.releaseShaderCache(M))}this.renderBufferDirect=function(M,O,z,k,B,pe){O===null&&(O=At);let ve=B.isMesh&&B.matrixWorld.determinant()<0,fe=tf(M,O,z,k,B);he.setMaterial(k,ve);let Me=z.index,Ee=1;if(k.wireframe===!0){if(Me=J.getWireframeAttribute(z),Me===void 0)return;Ee=2}let Ue=z.drawRange,ze=z.attributes.position,Ae=Ue.start*Ee,rt=(Ue.start+Ue.count)*Ee;pe!==null&&(Ae=Math.max(Ae,pe.start*Ee),rt=Math.min(rt,(pe.start+pe.count)*Ee)),Me!==null?(Ae=Math.max(Ae,0),rt=Math.min(rt,Me.count)):ze!=null&&(Ae=Math.max(Ae,0),rt=Math.min(rt,ze.count));let Tt=rt-Ae;if(Tt<0||Tt===1/0)return;ne.setup(B,k,fe,z,Me);let vt,at=Be;if(Me!==null&&(vt=q.get(Me),at=Je,at.setIndex(vt)),B.isMesh)k.wireframe===!0?(he.setLineWidth(k.wireframeLinewidth*qt()),at.setMode(D.LINES)):at.setMode(D.TRIANGLES);else if(B.isLine){let Nt=k.linewidth;Nt===void 0&&(Nt=1),he.setLineWidth(Nt*qt()),B.isLineSegments?at.setMode(D.LINES):B.isLineLoop?at.setMode(D.LINE_LOOP):at.setMode(D.LINE_STRIP)}else B.isPoints?at.setMode(D.POINTS):B.isSprite&&at.setMode(D.TRIANGLES);if(B.isBatchedMesh)if(Ye.get("WEBGL_multi_draw"))at.renderMultiDraw(B._multiDrawStarts,B._multiDrawCounts,B._multiDrawCount);else{let Nt=B._multiDrawStarts,ye=B._multiDrawCounts,$t=B._multiDrawCount,Ze=Me?q.get(Me).bytesPerElement:1,on=w.get(k).currentProgram.getUniforms();for(let Mn=0;Mn<$t;Mn++)on.setValue(D,"_gl_DrawID",Mn),at.render(Nt[Mn]/Ze,ye[Mn])}else if(B.isInstancedMesh)at.renderInstances(Ae,Tt,B.count);else if(z.isInstancedBufferGeometry){let Nt=z._maxInstanceCount!==void 0?z._maxInstanceCount:1/0,ye=Math.min(z.instanceCount,Nt);at.renderInstances(Ae,Tt,ye)}else at.render(Ae,Tt)};function bn(M,O,z){M.transparent===!0&&M.side===Bt&&M.forceSinglePass===!1?(M.side=Vt,M.needsUpdate=!0,Bs(M,O,z),M.side=Yn,M.needsUpdate=!0,Bs(M,O,z),M.side=Bt):Bs(M,O,z)}this.compile=function(M,O,z=null){z===null&&(z=M),T=ge.get(z),T.init(O),S.push(T),z.traverseVisible(function(B){B.isLight&&B.layers.test(O.layers)&&(T.pushLight(B),B.castShadow&&T.pushShadow(B))}),M!==z&&M.traverseVisible(function(B){B.isLight&&B.layers.test(O.layers)&&(T.pushLight(B),B.castShadow&&T.pushShadow(B))}),T.setupLights();let k=new Set;return M.traverse(function(B){if(!(B.isMesh||B.isPoints||B.isLine||B.isSprite))return;let pe=B.material;if(pe)if(Array.isArray(pe))for(let ve=0;ve<pe.length;ve++){let fe=pe[ve];bn(fe,z,B),k.add(fe)}else bn(pe,z,B),k.add(pe)}),T=S.pop(),k},this.compileAsync=function(M,O,z=null){let k=this.compile(M,O,z);return new Promise(B=>{function pe(){if(k.forEach(function(ve){w.get(ve).currentProgram.isReady()&&k.delete(ve)}),k.size===0){B(M);return}setTimeout(pe,10)}Ye.get("KHR_parallel_shader_compile")!==null?pe():setTimeout(pe,10)})};let hl=null;function Qd(M){hl&&hl(M)}function uh(){Ai.stop()}function dh(){Ai.start()}let Ai=new hd;Ai.setAnimationLoop(Qd),typeof self<"u"&&Ai.setContext(self),this.setAnimationLoop=function(M){hl=M,ae.setAnimationLoop(M),M===null?Ai.stop():Ai.start()},ae.addEventListener("sessionstart",uh),ae.addEventListener("sessionend",dh),this.render=function(M,O){if(O!==void 0&&O.isCamera!==!0){Re("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(I===!0)return;N!==null&&N.renderStart(M,O);let z=ae.enabled===!0&&ae.isPresenting===!0,k=A!==null&&(F===null||z)&&A.begin(L,F);if(M.matrixWorldAutoUpdate===!0&&M.updateMatrixWorld(),O.parent===null&&O.matrixWorldAutoUpdate===!0&&O.updateMatrixWorld(),ae.enabled===!0&&ae.isPresenting===!0&&(A===null||A.isCompositing()===!1)&&(ae.cameraAutoUpdate===!0&&ae.updateCamera(O),O=ae.getCamera()),M.isScene===!0&&M.onBeforeRender(L,M,O,F),T=ge.get(M,S.length),T.init(O),T.state.textureUnits=x.getTextureUnits(),S.push(T),nt.multiplyMatrices(O.projectionMatrix,O.matrixWorldInverse),Pe.setFromProjectionMatrix(nt,pn,O.reversedDepth),Xe=this.localClippingEnabled,mt=Se.init(this.clippingPlanes,Xe),E=$.get(M,C.length),E.init(),C.push(E),ae.enabled===!0&&ae.isPresenting===!0){let ve=L.xr.getDepthSensingMesh();ve!==null&&ul(ve,O,-1/0,L.sortObjects)}ul(M,O,0,L.sortObjects),E.finish(),L.sortObjects===!0&&E.sort(Z,me),gt=ae.enabled===!1||ae.isPresenting===!1||ae.hasDepthSensing()===!1,gt&&te.addToRenderList(E,M),this.info.render.frame++,mt===!0&&Se.beginShadows();let B=T.state.shadowsArray;if(se.render(B,M,O),mt===!0&&Se.endShadows(),this.info.autoReset===!0&&this.info.reset(),(k&&A.hasRenderPass())===!1){let ve=E.opaque,fe=E.transmissive;if(T.setupLights(),O.isArrayCamera){let Me=O.cameras;if(fe.length>0)for(let Ee=0,Ue=Me.length;Ee<Ue;Ee++){let ze=Me[Ee];ph(ve,fe,M,ze)}gt&&te.render(M);for(let Ee=0,Ue=Me.length;Ee<Ue;Ee++){let ze=Me[Ee];fh(E,M,ze,ze.viewport)}}else fe.length>0&&ph(ve,fe,M,O),gt&&te.render(M),fh(E,M,O)}F!==null&&W===0&&(x.updateMultisampleRenderTarget(F),x.updateRenderTargetMipmap(F)),k&&A.end(L),M.isScene===!0&&M.onAfterRender(L,M,O),ne.resetDefaultState(),H=-1,V=null,S.pop(),S.length>0?(T=S[S.length-1],x.setTextureUnits(T.state.textureUnits),mt===!0&&Se.setGlobalState(L.clippingPlanes,T.state.camera)):T=null,C.pop(),C.length>0?E=C[C.length-1]:E=null,N!==null&&N.renderEnd()};function ul(M,O,z,k){if(M.visible===!1)return;if(M.layers.test(O.layers)){if(M.isGroup)z=M.renderOrder;else if(M.isLOD)M.autoUpdate===!0&&M.update(O);else if(M.isLightProbeGrid)T.pushLightProbeGrid(M);else if(M.isLight)T.pushLight(M),M.castShadow&&T.pushShadow(M);else if(M.isSprite){if(!M.frustumCulled||Pe.intersectsSprite(M)){k&&Ge.setFromMatrixPosition(M.matrixWorld).applyMatrix4(nt);let ve=ee.update(M),fe=M.material;fe.visible&&E.push(M,ve,fe,z,Ge.z,null)}}else if((M.isMesh||M.isLine||M.isPoints)&&(!M.frustumCulled||Pe.intersectsObject(M))){let ve=ee.update(M),fe=M.material;if(k&&(M.boundingSphere!==void 0?(M.boundingSphere===null&&M.computeBoundingSphere(),Ge.copy(M.boundingSphere.center)):(ve.boundingSphere===null&&ve.computeBoundingSphere(),Ge.copy(ve.boundingSphere.center)),Ge.applyMatrix4(M.matrixWorld).applyMatrix4(nt)),Array.isArray(fe)){let Me=ve.groups;for(let Ee=0,Ue=Me.length;Ee<Ue;Ee++){let ze=Me[Ee],Ae=fe[ze.materialIndex];Ae&&Ae.visible&&E.push(M,ve,Ae,z,Ge.z,ze)}}else fe.visible&&E.push(M,ve,fe,z,Ge.z,null)}}let pe=M.children;for(let ve=0,fe=pe.length;ve<fe;ve++)ul(pe[ve],O,z,k)}function fh(M,O,z,k){let{opaque:B,transmissive:pe,transparent:ve}=M;T.setupLightsView(z),mt===!0&&Se.setGlobalState(L.clippingPlanes,z),k&&he.viewport(j.copy(k)),B.length>0&&ks(B,O,z),pe.length>0&&ks(pe,O,z),ve.length>0&&ks(ve,O,z),he.buffers.depth.setTest(!0),he.buffers.depth.setMask(!0),he.buffers.color.setMask(!0),he.setPolygonOffset(!1)}function ph(M,O,z,k){if((z.isScene===!0?z.overrideMaterial:null)!==null)return;if(T.state.transmissionRenderTarget[k.id]===void 0){let Ae=Ye.has("EXT_color_buffer_half_float")||Ye.has("EXT_color_buffer_float");T.state.transmissionRenderTarget[k.id]=new jt(1,1,{generateMipmaps:!0,type:Ae?Dn:rn,minFilter:_n,samples:Math.max(4,lt.samples),stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:qe.workingColorSpace})}let pe=T.state.transmissionRenderTarget[k.id],ve=k.viewport||j;pe.setSize(ve.z*L.transmissionResolutionScale,ve.w*L.transmissionResolutionScale);let fe=L.getRenderTarget(),Me=L.getActiveCubeFace(),Ee=L.getActiveMipmapLevel();L.setRenderTarget(pe),L.getClearColor(be),we=L.getClearAlpha(),we<1&&L.setClearColor(16777215,.5),L.clear(),gt&&te.render(z);let Ue=L.toneMapping;L.toneMapping=gn;let ze=k.viewport;if(k.viewport!==void 0&&(k.viewport=void 0),T.setupLightsView(k),mt===!0&&Se.setGlobalState(L.clippingPlanes,k),ks(M,z,k),x.updateMultisampleRenderTarget(pe),x.updateRenderTargetMipmap(pe),Ye.has("WEBGL_multisampled_render_to_texture")===!1){let Ae=!1;for(let rt=0,Tt=O.length;rt<Tt;rt++){let vt=O[rt],{object:at,geometry:Nt,material:ye,group:$t}=vt;if(ye.side===Bt&&at.layers.test(k.layers)){let Ze=ye.side;ye.side=Vt,ye.needsUpdate=!0,mh(at,z,k,Nt,ye,$t),ye.side=Ze,ye.needsUpdate=!0,Ae=!0}}Ae===!0&&(x.updateMultisampleRenderTarget(pe),x.updateRenderTargetMipmap(pe))}L.setRenderTarget(fe,Me,Ee),L.setClearColor(be,we),ze!==void 0&&(k.viewport=ze),L.toneMapping=Ue}function ks(M,O,z){let k=O.isScene===!0?O.overrideMaterial:null;for(let B=0,pe=M.length;B<pe;B++){let ve=M[B],{object:fe,geometry:Me,group:Ee}=ve,Ue=ve.material;Ue.allowOverride===!0&&k!==null&&(Ue=k),fe.layers.test(z.layers)&&mh(fe,O,z,Me,Ue,Ee)}}function mh(M,O,z,k,B,pe){M.onBeforeRender(L,O,z,k,B,pe),M.modelViewMatrix.multiplyMatrices(z.matrixWorldInverse,M.matrixWorld),M.normalMatrix.getNormalMatrix(M.modelViewMatrix),B.onBeforeRender(L,O,z,k,M,pe),B.transparent===!0&&B.side===Bt&&B.forceSinglePass===!1?(B.side=Vt,B.needsUpdate=!0,L.renderBufferDirect(z,O,k,B,M,pe),B.side=Yn,B.needsUpdate=!0,L.renderBufferDirect(z,O,k,B,M,pe),B.side=Bt):L.renderBufferDirect(z,O,k,B,M,pe),M.onAfterRender(L,O,z,k,B,pe)}function Bs(M,O,z){O.isScene!==!0&&(O=At);let k=w.get(M),B=T.state.lights,pe=T.state.shadowsArray,ve=B.state.version,fe=oe.getParameters(M,B.state,pe,O,z,T.state.lightProbeGridArray),Me=oe.getProgramCacheKey(fe),Ee=k.programs;k.environment=M.isMeshStandardMaterial||M.isMeshLambertMaterial||M.isMeshPhongMaterial?O.environment:null,k.fog=O.fog;let Ue=M.isMeshStandardMaterial||M.isMeshLambertMaterial&&!M.envMap||M.isMeshPhongMaterial&&!M.envMap;k.envMap=U.get(M.envMap||k.environment,Ue),k.envMapRotation=k.environment!==null&&M.envMap===null?O.environmentRotation:M.envMapRotation,Ee===void 0&&(M.addEventListener("dispose",Mt),Ee=new Map,k.programs=Ee);let ze=Ee.get(Me);if(ze!==void 0){if(k.currentProgram===ze&&k.lightsStateVersion===ve)return _h(M,fe),ze}else fe.uniforms=oe.getUniforms(M),N!==null&&M.isNodeMaterial&&N.build(M,z,fe),M.onBeforeCompile(fe,L),ze=oe.acquireProgram(fe,Me),Ee.set(Me,ze),k.uniforms=fe.uniforms;let Ae=k.uniforms;return(!M.isShaderMaterial&&!M.isRawShaderMaterial||M.clipping===!0)&&(Ae.clippingPlanes=Se.uniform),_h(M,fe),k.needsLights=rf(M),k.lightsStateVersion=ve,k.needsLights&&(Ae.ambientLightColor.value=B.state.ambient,Ae.lightProbe.value=B.state.probe,Ae.directionalLights.value=B.state.directional,Ae.directionalLightShadows.value=B.state.directionalShadow,Ae.spotLights.value=B.state.spot,Ae.spotLightShadows.value=B.state.spotShadow,Ae.rectAreaLights.value=B.state.rectArea,Ae.ltc_1.value=B.state.rectAreaLTC1,Ae.ltc_2.value=B.state.rectAreaLTC2,Ae.pointLights.value=B.state.point,Ae.pointLightShadows.value=B.state.pointShadow,Ae.hemisphereLights.value=B.state.hemi,Ae.directionalShadowMatrix.value=B.state.directionalShadowMatrix,Ae.spotLightMatrix.value=B.state.spotLightMatrix,Ae.spotLightMap.value=B.state.spotLightMap,Ae.pointShadowMatrix.value=B.state.pointShadowMatrix),k.lightProbeGrid=T.state.lightProbeGridArray.length>0,k.currentProgram=ze,k.uniformsList=null,ze}function gh(M){if(M.uniformsList===null){let O=M.currentProgram.getUniforms();M.uniformsList=Pr.seqWithValue(O.seq,M.uniforms)}return M.uniformsList}function _h(M,O){let z=w.get(M);z.outputColorSpace=O.outputColorSpace,z.batching=O.batching,z.batchingColor=O.batchingColor,z.instancing=O.instancing,z.instancingColor=O.instancingColor,z.instancingMorph=O.instancingMorph,z.skinning=O.skinning,z.morphTargets=O.morphTargets,z.morphNormals=O.morphNormals,z.morphColors=O.morphColors,z.morphTargetsCount=O.morphTargetsCount,z.numClippingPlanes=O.numClippingPlanes,z.numIntersection=O.numClipIntersection,z.vertexAlphas=O.vertexAlphas,z.vertexTangents=O.vertexTangents,z.toneMapping=O.toneMapping}function ef(M,O){if(M.length===0)return null;if(M.length===1)return M[0].texture!==null?M[0]:null;_.setFromMatrixPosition(O.matrixWorld);for(let z=0,k=M.length;z<k;z++){let B=M[z];if(B.texture!==null&&B.boundingBox.containsPoint(_))return B}return null}function tf(M,O,z,k,B){O.isScene!==!0&&(O=At),x.resetTextureUnits();let pe=O.fog,ve=k.isMeshStandardMaterial||k.isMeshLambertMaterial||k.isMeshPhongMaterial?O.environment:null,fe=F===null?L.outputColorSpace:F.isXRRenderTarget===!0?F.texture.colorSpace:qe.workingColorSpace,Me=k.isMeshStandardMaterial||k.isMeshLambertMaterial&&!k.envMap||k.isMeshPhongMaterial&&!k.envMap,Ee=U.get(k.envMap||ve,Me),Ue=k.vertexColors===!0&&!!z.attributes.color&&z.attributes.color.itemSize===4,ze=!!z.attributes.tangent&&(!!k.normalMap||k.anisotropy>0),Ae=!!z.morphAttributes.position,rt=!!z.morphAttributes.normal,Tt=!!z.morphAttributes.color,vt=gn;k.toneMapped&&(F===null||F.isXRRenderTarget===!0)&&(vt=L.toneMapping);let at=z.morphAttributes.position||z.morphAttributes.normal||z.morphAttributes.color,Nt=at!==void 0?at.length:0,ye=w.get(k),$t=T.state.lights;if(mt===!0&&(Xe===!0||M!==V)){let ct=M===V&&k.id===H;Se.setState(k,M,ct)}let Ze=!1;k.version===ye.__version?(ye.needsLights&&ye.lightsStateVersion!==$t.state.version||ye.outputColorSpace!==fe||B.isBatchedMesh&&ye.batching===!1||!B.isBatchedMesh&&ye.batching===!0||B.isBatchedMesh&&ye.batchingColor===!0&&B.colorTexture===null||B.isBatchedMesh&&ye.batchingColor===!1&&B.colorTexture!==null||B.isInstancedMesh&&ye.instancing===!1||!B.isInstancedMesh&&ye.instancing===!0||B.isSkinnedMesh&&ye.skinning===!1||!B.isSkinnedMesh&&ye.skinning===!0||B.isInstancedMesh&&ye.instancingColor===!0&&B.instanceColor===null||B.isInstancedMesh&&ye.instancingColor===!1&&B.instanceColor!==null||B.isInstancedMesh&&ye.instancingMorph===!0&&B.morphTexture===null||B.isInstancedMesh&&ye.instancingMorph===!1&&B.morphTexture!==null||ye.envMap!==Ee||k.fog===!0&&ye.fog!==pe||ye.numClippingPlanes!==void 0&&(ye.numClippingPlanes!==Se.numPlanes||ye.numIntersection!==Se.numIntersection)||ye.vertexAlphas!==Ue||ye.vertexTangents!==ze||ye.morphTargets!==Ae||ye.morphNormals!==rt||ye.morphColors!==Tt||ye.toneMapping!==vt||ye.morphTargetsCount!==Nt||!!ye.lightProbeGrid!=T.state.lightProbeGridArray.length>0)&&(Ze=!0):(Ze=!0,ye.__version=k.version);let on=ye.currentProgram;Ze===!0&&(on=Bs(k,O,B),N&&k.isNodeMaterial&&N.onUpdateProgram(k,on,ye));let Mn=!1,ei=!1,Yi=!1,ot=on.getUniforms(),Et=ye.uniforms;if(he.useProgram(on.program)&&(Mn=!0,ei=!0,Yi=!0),k.id!==H&&(H=k.id,ei=!0),ye.needsLights){let ct=ef(T.state.lightProbeGridArray,B);ye.lightProbeGrid!==ct&&(ye.lightProbeGrid=ct,ei=!0)}if(Mn||V!==M){he.buffers.depth.getReversed()&&M.reversedDepth!==!0&&(M._reversedDepth=!0,M.updateProjectionMatrix()),ot.setValue(D,"projectionMatrix",M.projectionMatrix),ot.setValue(D,"viewMatrix",M.matrixWorldInverse);let ni=ot.map.cameraPosition;ni!==void 0&&ni.setValue(D,ht.setFromMatrixPosition(M.matrixWorld)),lt.logarithmicDepthBuffer&&ot.setValue(D,"logDepthBufFC",2/(Math.log(M.far+1)/Math.LN2)),(k.isMeshPhongMaterial||k.isMeshToonMaterial||k.isMeshLambertMaterial||k.isMeshBasicMaterial||k.isMeshStandardMaterial||k.isShaderMaterial)&&ot.setValue(D,"isOrthographic",M.isOrthographicCamera===!0),V!==M&&(V=M,ei=!0,Yi=!0)}if(ye.needsLights&&($t.state.directionalShadowMap.length>0&&ot.setValue(D,"directionalShadowMap",$t.state.directionalShadowMap,x),$t.state.spotShadowMap.length>0&&ot.setValue(D,"spotShadowMap",$t.state.spotShadowMap,x),$t.state.pointShadowMap.length>0&&ot.setValue(D,"pointShadowMap",$t.state.pointShadowMap,x)),B.isSkinnedMesh){ot.setOptional(D,B,"bindMatrix"),ot.setOptional(D,B,"bindMatrixInverse");let ct=B.skeleton;ct&&(ct.boneTexture===null&&ct.computeBoneTexture(),ot.setValue(D,"boneTexture",ct.boneTexture,x))}B.isBatchedMesh&&(ot.setOptional(D,B,"batchingTexture"),ot.setValue(D,"batchingTexture",B._matricesTexture,x),ot.setOptional(D,B,"batchingIdTexture"),ot.setValue(D,"batchingIdTexture",B._indirectTexture,x),ot.setOptional(D,B,"batchingColorTexture"),B._colorsTexture!==null&&ot.setValue(D,"batchingColorTexture",B._colorsTexture,x));let ti=z.morphAttributes;if((ti.position!==void 0||ti.normal!==void 0||ti.color!==void 0)&&Le.update(B,z,on),(ei||ye.receiveShadow!==B.receiveShadow)&&(ye.receiveShadow=B.receiveShadow,ot.setValue(D,"receiveShadow",B.receiveShadow)),(k.isMeshStandardMaterial||k.isMeshLambertMaterial||k.isMeshPhongMaterial)&&k.envMap===null&&O.environment!==null&&(Et.envMapIntensity.value=O.environmentIntensity),Et.dfgLUT!==void 0&&(Et.dfgLUT.value=Q_()),ei){if(ot.setValue(D,"toneMappingExposure",L.toneMappingExposure),ye.needsLights&&nf(Et,Yi),pe&&k.fog===!0&&X.refreshFogUniforms(Et,pe),X.refreshMaterialUniforms(Et,k,ke,tt,T.state.transmissionRenderTarget[M.id]),ye.needsLights&&ye.lightProbeGrid){let ct=ye.lightProbeGrid;Et.probesSH.value=ct.texture,Et.probesMin.value.copy(ct.boundingBox.min),Et.probesMax.value.copy(ct.boundingBox.max),Et.probesResolution.value.copy(ct.resolution)}Pr.upload(D,gh(ye),Et,x)}if(k.isShaderMaterial&&k.uniformsNeedUpdate===!0&&(Pr.upload(D,gh(ye),Et,x),k.uniformsNeedUpdate=!1),k.isSpriteMaterial&&ot.setValue(D,"center",B.center),ot.setValue(D,"modelViewMatrix",B.modelViewMatrix),ot.setValue(D,"normalMatrix",B.normalMatrix),ot.setValue(D,"modelMatrix",B.matrixWorld),k.uniformsGroups!==void 0){let ct=k.uniformsGroups;for(let ni=0,qi=ct.length;ni<qi;ni++){let yh=ct[ni];Y.update(yh,on),Y.bind(yh,on)}}return on}function nf(M,O){M.ambientLightColor.needsUpdate=O,M.lightProbe.needsUpdate=O,M.directionalLights.needsUpdate=O,M.directionalLightShadows.needsUpdate=O,M.pointLights.needsUpdate=O,M.pointLightShadows.needsUpdate=O,M.spotLights.needsUpdate=O,M.spotLightShadows.needsUpdate=O,M.rectAreaLights.needsUpdate=O,M.hemisphereLights.needsUpdate=O}function rf(M){return M.isMeshLambertMaterial||M.isMeshToonMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isShadowMaterial||M.isShaderMaterial&&M.lights===!0}this.getActiveCubeFace=function(){return G},this.getActiveMipmapLevel=function(){return W},this.getRenderTarget=function(){return F},this.setRenderTargetTextures=function(M,O,z){let k=w.get(M);k.__autoAllocateDepthBuffer=M.resolveDepthBuffer===!1,k.__autoAllocateDepthBuffer===!1&&(k.__useRenderToTexture=!1),w.get(M.texture).__webglTexture=O,w.get(M.depthTexture).__webglTexture=k.__autoAllocateDepthBuffer?void 0:z,k.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(M,O){let z=w.get(M);z.__webglFramebuffer=O,z.__useDefaultFramebuffer=O===void 0};let sf=D.createFramebuffer();this.setRenderTarget=function(M,O=0,z=0){F=M,G=O,W=z;let k=null,B=!1,pe=!1;if(M){let fe=w.get(M);if(fe.__useDefaultFramebuffer!==void 0){he.bindFramebuffer(D.FRAMEBUFFER,fe.__webglFramebuffer),j.copy(M.viewport),Q.copy(M.scissor),de=M.scissorTest,he.viewport(j),he.scissor(Q),he.setScissorTest(de),H=-1;return}else if(fe.__webglFramebuffer===void 0)x.setupRenderTarget(M);else if(fe.__hasExternalTextures)x.rebindTextures(M,w.get(M.texture).__webglTexture,w.get(M.depthTexture).__webglTexture);else if(M.depthBuffer){let Ue=M.depthTexture;if(fe.__boundDepthTexture!==Ue){if(Ue!==null&&w.has(Ue)&&(M.width!==Ue.image.width||M.height!==Ue.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");x.setupDepthRenderbuffer(M)}}let Me=M.texture;(Me.isData3DTexture||Me.isDataArrayTexture||Me.isCompressedArrayTexture)&&(pe=!0);let Ee=w.get(M).__webglFramebuffer;M.isWebGLCubeRenderTarget?(Array.isArray(Ee[O])?k=Ee[O][z]:k=Ee[O],B=!0):M.samples>0&&x.useMultisampledRTT(M)===!1?k=w.get(M).__webglMultisampledFramebuffer:Array.isArray(Ee)?k=Ee[z]:k=Ee,j.copy(M.viewport),Q.copy(M.scissor),de=M.scissorTest}else j.copy(re).multiplyScalar(ke).floor(),Q.copy(Ie).multiplyScalar(ke).floor(),de=Fe;if(z!==0&&(k=sf),he.bindFramebuffer(D.FRAMEBUFFER,k)&&he.drawBuffers(M,k),he.viewport(j),he.scissor(Q),he.setScissorTest(de),B){let fe=w.get(M.texture);D.framebufferTexture2D(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_CUBE_MAP_POSITIVE_X+O,fe.__webglTexture,z)}else if(pe){let fe=O;for(let Me=0;Me<M.textures.length;Me++){let Ee=w.get(M.textures[Me]);D.framebufferTextureLayer(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0+Me,Ee.__webglTexture,z,fe)}}else if(M!==null&&z!==0){let fe=w.get(M.texture);D.framebufferTexture2D(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,fe.__webglTexture,z)}H=-1},this.readRenderTargetPixels=function(M,O,z,k,B,pe,ve,fe=0){if(!(M&&M.isWebGLRenderTarget)){Re("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Me=w.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&ve!==void 0&&(Me=Me[ve]),Me){he.bindFramebuffer(D.FRAMEBUFFER,Me);try{let Ee=M.textures[fe],Ue=Ee.format,ze=Ee.type;if(M.textures.length>1&&D.readBuffer(D.COLOR_ATTACHMENT0+fe),!lt.textureFormatReadable(Ue)){Re("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!lt.textureTypeReadable(ze)){Re("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}O>=0&&O<=M.width-k&&z>=0&&z<=M.height-B&&D.readPixels(O,z,k,B,P.convert(Ue),P.convert(ze),pe)}finally{let Ee=F!==null?w.get(F).__webglFramebuffer:null;he.bindFramebuffer(D.FRAMEBUFFER,Ee)}}},this.readRenderTargetPixelsAsync=async function(M,O,z,k,B,pe,ve,fe=0){if(!(M&&M.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Me=w.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&ve!==void 0&&(Me=Me[ve]),Me)if(O>=0&&O<=M.width-k&&z>=0&&z<=M.height-B){he.bindFramebuffer(D.FRAMEBUFFER,Me);let Ee=M.textures[fe],Ue=Ee.format,ze=Ee.type;if(M.textures.length>1&&D.readBuffer(D.COLOR_ATTACHMENT0+fe),!lt.textureFormatReadable(Ue))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!lt.textureTypeReadable(ze))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let Ae=D.createBuffer();D.bindBuffer(D.PIXEL_PACK_BUFFER,Ae),D.bufferData(D.PIXEL_PACK_BUFFER,pe.byteLength,D.STREAM_READ),D.readPixels(O,z,k,B,P.convert(Ue),P.convert(ze),0);let rt=F!==null?w.get(F).__webglFramebuffer:null;he.bindFramebuffer(D.FRAMEBUFFER,rt);let Tt=D.fenceSync(D.SYNC_GPU_COMMANDS_COMPLETE,0);return D.flush(),await Du(D,Tt,4),D.bindBuffer(D.PIXEL_PACK_BUFFER,Ae),D.getBufferSubData(D.PIXEL_PACK_BUFFER,0,pe),D.deleteBuffer(Ae),D.deleteSync(Tt),pe}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(M,O=null,z=0){let k=Math.pow(2,-z),B=Math.floor(M.image.width*k),pe=Math.floor(M.image.height*k),ve=O!==null?O.x:0,fe=O!==null?O.y:0;x.setTexture2D(M,0),D.copyTexSubImage2D(D.TEXTURE_2D,z,0,0,ve,fe,B,pe),he.unbindTexture()};let af=D.createFramebuffer(),of=D.createFramebuffer();this.copyTextureToTexture=function(M,O,z=null,k=null,B=0,pe=0){let ve,fe,Me,Ee,Ue,ze,Ae,rt,Tt,vt=M.isCompressedTexture?M.mipmaps[pe]:M.image;if(z!==null)ve=z.max.x-z.min.x,fe=z.max.y-z.min.y,Me=z.isBox3?z.max.z-z.min.z:1,Ee=z.min.x,Ue=z.min.y,ze=z.isBox3?z.min.z:0;else{let Et=Math.pow(2,-B);ve=Math.floor(vt.width*Et),fe=Math.floor(vt.height*Et),M.isDataArrayTexture?Me=vt.depth:M.isData3DTexture?Me=Math.floor(vt.depth*Et):Me=1,Ee=0,Ue=0,ze=0}k!==null?(Ae=k.x,rt=k.y,Tt=k.z):(Ae=0,rt=0,Tt=0);let at=P.convert(O.format),Nt=P.convert(O.type),ye;O.isData3DTexture?(x.setTexture3D(O,0),ye=D.TEXTURE_3D):O.isDataArrayTexture||O.isCompressedArrayTexture?(x.setTexture2DArray(O,0),ye=D.TEXTURE_2D_ARRAY):(x.setTexture2D(O,0),ye=D.TEXTURE_2D),he.activeTexture(D.TEXTURE0),he.pixelStorei(D.UNPACK_FLIP_Y_WEBGL,O.flipY),he.pixelStorei(D.UNPACK_PREMULTIPLY_ALPHA_WEBGL,O.premultiplyAlpha),he.pixelStorei(D.UNPACK_ALIGNMENT,O.unpackAlignment);let $t=he.getParameter(D.UNPACK_ROW_LENGTH),Ze=he.getParameter(D.UNPACK_IMAGE_HEIGHT),on=he.getParameter(D.UNPACK_SKIP_PIXELS),Mn=he.getParameter(D.UNPACK_SKIP_ROWS),ei=he.getParameter(D.UNPACK_SKIP_IMAGES);he.pixelStorei(D.UNPACK_ROW_LENGTH,vt.width),he.pixelStorei(D.UNPACK_IMAGE_HEIGHT,vt.height),he.pixelStorei(D.UNPACK_SKIP_PIXELS,Ee),he.pixelStorei(D.UNPACK_SKIP_ROWS,Ue),he.pixelStorei(D.UNPACK_SKIP_IMAGES,ze);let Yi=M.isDataArrayTexture||M.isData3DTexture,ot=O.isDataArrayTexture||O.isData3DTexture;if(M.isDepthTexture){let Et=w.get(M),ti=w.get(O),ct=w.get(Et.__renderTarget),ni=w.get(ti.__renderTarget);he.bindFramebuffer(D.READ_FRAMEBUFFER,ct.__webglFramebuffer),he.bindFramebuffer(D.DRAW_FRAMEBUFFER,ni.__webglFramebuffer);for(let qi=0;qi<Me;qi++)Yi&&(D.framebufferTextureLayer(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,w.get(M).__webglTexture,B,ze+qi),D.framebufferTextureLayer(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,w.get(O).__webglTexture,pe,Tt+qi)),D.blitFramebuffer(Ee,Ue,ve,fe,Ae,rt,ve,fe,D.DEPTH_BUFFER_BIT,D.NEAREST);he.bindFramebuffer(D.READ_FRAMEBUFFER,null),he.bindFramebuffer(D.DRAW_FRAMEBUFFER,null)}else if(B!==0||M.isRenderTargetTexture||w.has(M)){let Et=w.get(M),ti=w.get(O);he.bindFramebuffer(D.READ_FRAMEBUFFER,af),he.bindFramebuffer(D.DRAW_FRAMEBUFFER,of);for(let ct=0;ct<Me;ct++)Yi?D.framebufferTextureLayer(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,Et.__webglTexture,B,ze+ct):D.framebufferTexture2D(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,Et.__webglTexture,B),ot?D.framebufferTextureLayer(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,ti.__webglTexture,pe,Tt+ct):D.framebufferTexture2D(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,ti.__webglTexture,pe),B!==0?D.blitFramebuffer(Ee,Ue,ve,fe,Ae,rt,ve,fe,D.COLOR_BUFFER_BIT,D.NEAREST):ot?D.copyTexSubImage3D(ye,pe,Ae,rt,Tt+ct,Ee,Ue,ve,fe):D.copyTexSubImage2D(ye,pe,Ae,rt,Ee,Ue,ve,fe);he.bindFramebuffer(D.READ_FRAMEBUFFER,null),he.bindFramebuffer(D.DRAW_FRAMEBUFFER,null)}else ot?M.isDataTexture||M.isData3DTexture?D.texSubImage3D(ye,pe,Ae,rt,Tt,ve,fe,Me,at,Nt,vt.data):O.isCompressedArrayTexture?D.compressedTexSubImage3D(ye,pe,Ae,rt,Tt,ve,fe,Me,at,vt.data):D.texSubImage3D(ye,pe,Ae,rt,Tt,ve,fe,Me,at,Nt,vt):M.isDataTexture?D.texSubImage2D(D.TEXTURE_2D,pe,Ae,rt,ve,fe,at,Nt,vt.data):M.isCompressedTexture?D.compressedTexSubImage2D(D.TEXTURE_2D,pe,Ae,rt,vt.width,vt.height,at,vt.data):D.texSubImage2D(D.TEXTURE_2D,pe,Ae,rt,ve,fe,at,Nt,vt);he.pixelStorei(D.UNPACK_ROW_LENGTH,$t),he.pixelStorei(D.UNPACK_IMAGE_HEIGHT,Ze),he.pixelStorei(D.UNPACK_SKIP_PIXELS,on),he.pixelStorei(D.UNPACK_SKIP_ROWS,Mn),he.pixelStorei(D.UNPACK_SKIP_IMAGES,ei),pe===0&&O.generateMipmaps&&D.generateMipmap(ye),he.unbindTexture()},this.initRenderTarget=function(M){w.get(M).__webglFramebuffer===void 0&&x.setupRenderTarget(M)},this.initTexture=function(M){M.isCubeTexture?x.setTextureCube(M,0):M.isData3DTexture?x.setTexture3D(M,0):M.isDataArrayTexture||M.isCompressedArrayTexture?x.setTexture2DArray(M,0):x.setTexture2D(M,0),he.unbindTexture()},this.resetState=function(){G=0,W=0,F=null,he.reset(),ne.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return pn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=qe._getDrawingBufferColorSpace(e),t.unpackColorSpace=qe._getUnpackColorSpace()}};var bi=16,Mi=9,qc=new WeakMap,Xi=new WeakMap,le=new Map;function ie(n,e=0){let t=Number(n);return Number.isFinite(t)?t:e}function Ve(n,e,t){return Math.max(e,Math.min(t,n))}function Os(n){return(ie(n,.5)-.5)*bi}function Fs(n){return(.5-ie(n,.5))*Mi}function Hc(n={},e=-1.65){return new R(Os(n.x),Fs(n.y),e)}function Fd(n={},e=0){return-1+(1-ie(n.y,.5))*.6+ie(n.z,0)*.025+e}function Ds(n=""){switch(String(n)){case"builder":return{fill:"#c97a3d",stroke:"#5a2f16",cue:"#ffe4a0",mark:"B",face:"#ffe5bd",accent:"#ffd34f",trim:"#7f3f1c"};case"worker":return{fill:"#5f8d8e",stroke:"#173f41",cue:"#d6f1ef",mark:"W",face:"#ffe0b4",accent:"#9fd3c8",trim:"#31585b"};case"hauler":return{fill:"#d7ae50",stroke:"#654716",cue:"#fff0bd",mark:"H",face:"#f5d29b",accent:"#8bb36d",trim:"#8a5d1f"};case"messenger":return{fill:"#c85c75",stroke:"#5a1c2b",cue:"#ffd5de",mark:"!",face:"#ffe1be",accent:"#78a9d6",trim:"#7e2c3c"};default:return{fill:"#7f9b66",stroke:"#254526",cue:"#daf0cf",mark:"C",face:"#ffe8c4",accent:"#a7c884",trim:"#446235"}}}function nl(n=""){let e=String(n||""),t=0;for(let i=0;i<e.length;i+=1)t=(t<<5)-t+e.charCodeAt(i)|0;return Math.abs(t%628)/100}function ty(n,e,t,i="busy"){n.fillStyle="#2e1b0e",n.beginPath(),n.ellipse(e-17,t,5,7,0,0,Math.PI*2),n.ellipse(e+17,t,5,7,0,0,Math.PI*2),n.fill(),n.fillStyle="#fff8e8",n.beginPath(),n.arc(e-19,t-3,2,0,Math.PI*2),n.arc(e+15,t-3,2,0,Math.PI*2),n.fill(),n.strokeStyle="#2e1b0e",n.lineWidth=4,n.lineCap="round",n.beginPath(),i==="alert"?(n.moveTo(e-26,t-15),n.lineTo(e-12,t-19),n.moveTo(e+12,t-19),n.lineTo(e+27,t-14)):(n.moveTo(e-26,t-15),n.lineTo(e-12,t-13),n.moveTo(e+12,t-13),n.lineTo(e+27,t-15)),n.stroke(),n.beginPath(),i==="happy"?n.arc(e,t+13,14,.1,Math.PI-.1):(n.moveTo(e-8,t+15),n.quadraticCurveTo(e,t+20,e+10,t+14)),n.stroke()}function _d(n,e,t,i){n.fillStyle="#ffe0b4",n.strokeStyle=i,n.lineWidth=4,n.beginPath(),n.arc(e,t,10,0,Math.PI*2),n.fill(),n.stroke()}function ny(n="worker"){let e=`character:${n}:v1`;if(le.has(e))return le.get(e);let t=Ds(n),i=document.createElement("canvas");i.width=224,i.height=256;let r=i.getContext("2d");r.clearRect(0,0,i.width,i.height),r.fillStyle="rgba(46, 27, 14, 0.22)",r.beginPath(),r.ellipse(112,222,62,17,0,0,Math.PI*2),r.fill(),n==="hauler"&&(r.fillStyle="#8bb36d",r.strokeStyle=t.stroke,r.lineWidth=7,r.beginPath(),r.roundRect(132,88,48,84,19),r.fill(),r.stroke(),r.fillStyle="#6d8c55",r.fillRect(141,102,29,12)),r.strokeStyle=t.stroke,r.lineWidth=10,r.lineCap="round",r.beginPath(),n==="messenger"?(r.moveTo(151,126),r.lineTo(181,84)):n==="builder"?(r.moveTo(151,128),r.lineTo(180,96)):(r.moveTo(151,130),r.lineTo(174,147)),r.stroke(),_d(r,n==="messenger"?181:n==="builder"?180:174,n==="messenger"?84:n==="builder"?96:147,t.stroke),n==="builder"?(r.strokeStyle=t.stroke,r.lineWidth=7,r.beginPath(),r.moveTo(170,98),r.lineTo(193,75),r.moveTo(183,71),r.lineTo(204,92),r.stroke()):n==="worker"?(r.strokeStyle=t.stroke,r.lineWidth=6,r.beginPath(),r.moveTo(165,142),r.lineTo(190,126),r.moveTo(184,122),r.lineTo(198,137),r.stroke()):n==="messenger"&&(r.fillStyle=t.accent,r.strokeStyle=t.stroke,r.lineWidth=5,r.beginPath(),r.moveTo(182,72),r.lineTo(205,84),r.lineTo(182,97),r.closePath(),r.fill(),r.stroke()),r.strokeStyle=t.stroke,r.lineWidth=10,r.beginPath(),r.moveTo(73,128),r.lineTo(n==="hauler"?50:44,n==="hauler"?146:116),r.stroke(),_d(r,n==="hauler"?50:44,n==="hauler"?146:116,t.stroke),r.fillStyle=t.fill,r.strokeStyle=t.stroke,r.lineWidth=10,r.beginPath(),r.roundRect(62,94,100,96,34),r.fill(),r.stroke(),n==="worker"?(r.fillStyle="#fff8e8",r.strokeStyle=t.stroke,r.lineWidth=5,r.beginPath(),r.roundRect(84,116,56,57,13),r.fill(),r.stroke(),r.strokeStyle=t.trim,r.lineWidth=4,r.beginPath(),r.moveTo(94,133),r.lineTo(130,133),r.moveTo(94,149),r.lineTo(122,149),r.stroke()):n==="hauler"?(r.strokeStyle=t.trim,r.lineWidth=7,r.beginPath(),r.moveTo(78,107),r.lineTo(146,178),r.moveTo(146,107),r.lineTo(78,178),r.stroke(),r.fillStyle="#c4883a",r.strokeStyle=t.stroke,r.lineWidth=6,r.beginPath(),r.roundRect(82,134,60,40,10),r.fill(),r.stroke()):n==="messenger"&&(r.fillStyle="#6b4631",r.strokeStyle=t.stroke,r.lineWidth=5,r.beginPath(),r.roundRect(118,142,42,38,9),r.fill(),r.stroke(),r.strokeStyle="#fff0bd",r.lineWidth=5,r.beginPath(),r.moveTo(79,110),r.lineTo(145,172),r.stroke()),r.strokeStyle=t.stroke,r.lineWidth=11,r.beginPath(),r.moveTo(91,184),r.lineTo(82,213),r.moveTo(132,184),r.lineTo(143,213),r.stroke(),r.fillStyle=t.trim,r.strokeStyle=t.stroke,r.lineWidth=5,r.beginPath(),r.roundRect(61,207,38,17,8),r.roundRect(128,207,38,17,8),r.fill(),r.stroke(),r.fillStyle=t.face,r.strokeStyle=t.stroke,r.lineWidth=8,r.beginPath(),r.arc(112,76,45,0,Math.PI*2),r.fill(),r.stroke(),n==="builder"?(r.fillStyle=t.accent,r.strokeStyle=t.stroke,r.lineWidth=7,r.beginPath(),r.arc(112,70,48,Math.PI,Math.PI*2),r.lineTo(160,75),r.lineTo(64,75),r.closePath(),r.fill(),r.stroke(),r.strokeStyle="#f4a92f",r.lineWidth=5,r.beginPath(),r.moveTo(112,27),r.lineTo(112,73),r.moveTo(91,38),r.lineTo(91,73),r.moveTo(133,38),r.lineTo(133,73),r.stroke()):(r.fillStyle=t.trim,r.beginPath(),r.arc(112,45,34,Math.PI,Math.PI*2),r.lineTo(146,63),r.quadraticCurveTo(112,53,78,63),r.closePath(),r.fill(),n==="messenger"&&(r.fillStyle=t.accent,r.beginPath(),r.arc(144,56,12,0,Math.PI*2),r.fill())),r.fillStyle="rgba(200, 92, 117, 0.28)",r.beginPath(),r.arc(82,88,7,0,Math.PI*2),r.arc(142,88,7,0,Math.PI*2),r.fill(),ty(r,112,82,n==="messenger"?"alert":n==="hauler"?"happy":"busy");let s=new je(i);return s.colorSpace=De,s.minFilter=ce,s.magFilter=ce,le.set(e,s),s}function Nd(n="",e="neutral"){let t=`text:${e}:${n}`;if(le.has(t))return le.get(t);let i=document.createElement("canvas");i.width=384,i.height=96;let r=i.getContext("2d"),s=e==="ready"?"#ffe4a0":e==="selected"?"#d6f1ef":"#fff8e8";r.clearRect(0,0,i.width,i.height),r.fillStyle=s,r.strokeStyle="rgba(46, 27, 14, 0.25)",r.lineWidth=6,r.beginPath(),r.roundRect(10,12,i.width-20,i.height-24,22),r.fill(),r.stroke(),r.fillStyle="#2e1b0e",r.font='700 30px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',r.textAlign="center",r.textBaseline="middle";let a=String(n||"").length>20?`${String(n).slice(0,17)}...`:String(n||"");r.fillText(a,i.width/2,i.height/2+2,i.width-44);let o=new je(i);return o.colorSpace=De,o.minFilter=ce,o.magFilter=ce,le.set(t,o),o}function Ud(n,e,t,i,r){n.beginPath();for(let s=0;s<10;s+=1){let a=s%2===0?i:r,o=-Math.PI/2+s*Math.PI/5,c=e+Math.cos(o)*a,h=t+Math.sin(o)*a;s===0?n.moveTo(c,h):n.lineTo(c,h)}n.closePath()}function iy(n="worker",e={}){let t=String(e.accessory||"tools"),i=String(e.actionKind||""),r=`cue:${n}:${t}:${i}`;if(le.has(r))return le.get(r);let s=Ds(n),a=document.createElement("canvas");a.width=160,a.height=160;let o=a.getContext("2d");if(o.clearRect(0,0,a.width,a.height),o.fillStyle="rgba(46, 27, 14, 0.24)",o.beginPath(),o.ellipse(84,126,46,14,0,0,Math.PI*2),o.fill(),o.fillStyle=s.cue,o.strokeStyle=s.stroke,o.lineWidth=8,o.beginPath(),o.roundRect(31,20,98,98,28),o.fill(),o.stroke(),o.strokeStyle=s.stroke,o.fillStyle=s.fill,o.lineCap="round",o.lineJoin="round",o.lineWidth=10,t==="hammer")o.beginPath(),o.moveTo(58,88),o.lineTo(104,42),o.moveTo(85,37),o.lineTo(119,71),o.stroke();else if(t==="wrench")o.beginPath(),o.arc(62,50,18,.2,Math.PI*1.55),o.moveTo(73,65),o.lineTo(108,100),o.stroke();else if(t==="bundle")o.fillStyle="#c4883a",o.strokeStyle=s.stroke,o.lineWidth=7,o.beginPath(),o.roundRect(50,54,60,46,10),o.fill(),o.stroke(),o.beginPath(),o.moveTo(50,78),o.lineTo(110,78),o.moveTo(80,54),o.lineTo(80,100),o.stroke();else if(t==="coin"){o.fillStyle="#d7ae50";for(let h of[92,77,62])o.beginPath(),o.ellipse(80,h,30,10,0,0,Math.PI*2),o.fill(),o.stroke()}else t==="approval"?(o.font='900 46px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',o.textAlign="center",o.textBaseline="middle",o.fillText("OK",80,74)):t==="reward"?(o.fillStyle="#d7ae50",Ud(o,80,74,34,15),o.fill(),o.stroke()):t==="quest"?(o.beginPath(),o.moveTo(80,38),o.lineTo(112,74),o.lineTo(80,110),o.lineTo(48,74),o.closePath(),o.fill(),o.stroke()):t==="clover"?(o.font='900 58px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',o.textAlign="center",o.textBaseline="middle",o.fillText("C",80,76)):t==="notice"?(o.font='900 70px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',o.textAlign="center",o.textBaseline="middle",o.fillText("!",80,74)):(o.beginPath(),o.arc(80,74,24,0,Math.PI*2),o.moveTo(48,74),o.lineTo(112,74),o.moveTo(80,42),o.lineTo(80,106),o.stroke());let c=new je(a);return c.colorSpace=De,c.minFilter=ce,c.magFilter=ce,le.set(r,c),c}function ry(n="worker",e=0){let t=Ve(ie(e,0),0,1),i=Math.round(t*100),r=`progress:${n}:${i}`;if(le.has(r))return le.get(r);let s=Ds(n),a=document.createElement("canvas");a.width=256,a.height=64;let o=a.getContext("2d");o.clearRect(0,0,a.width,a.height),o.fillStyle="rgba(46, 27, 14, 0.40)",o.beginPath(),o.roundRect(18,18,220,28,14),o.fill(),o.fillStyle="#fff8e8",o.beginPath(),o.roundRect(24,23,208,18,9),o.fill(),o.fillStyle=s.fill,o.beginPath(),o.roundRect(24,23,Math.max(12,208*t),18,9),o.fill(),o.strokeStyle=s.stroke,o.lineWidth=5,o.beginPath(),o.roundRect(18,18,220,28,14),o.stroke();let c=new je(a);return c.colorSpace=De,c.minFilter=ce,c.magFilter=ce,le.set(r,c),c}function sy(n={}){let e=String(n.cueType||"crossing_greeting"),t=Array.isArray(n.roles)?n.roles:[],i=`encounter:${e}:${t.join("+")}`;if(le.has(i))return le.get(i);let r=document.createElement("canvas");r.width=192,r.height=160;let s=r.getContext("2d");s.clearRect(0,0,r.width,r.height),s.fillStyle="rgba(46, 27, 14, 0.22)",s.beginPath(),s.ellipse(96,126,52,14,0,0,Math.PI*2),s.fill(),s.fillStyle=e==="handoff"?"#fff0bd":"#d6f1ef",s.strokeStyle="#3b2513",s.lineWidth=7,s.beginPath(),s.roundRect(36,22,120,84,28),s.fill(),s.stroke();let a=Ds(t[0]||"worker"),o=Ds(t[1]||"messenger");s.fillStyle=a.fill,s.strokeStyle=a.stroke,s.lineWidth=5,s.beginPath(),s.arc(78,64,20,0,Math.PI*2),s.fill(),s.stroke(),s.fillStyle=o.fill,s.strokeStyle=o.stroke,s.beginPath(),s.arc(116,64,20,0,Math.PI*2),s.fill(),s.stroke(),s.strokeStyle="#3b2513",s.lineWidth=6,s.lineCap="round",s.beginPath(),s.moveTo(91,82),s.lineTo(103,82),s.stroke(),s.fillStyle=e==="handoff"?"#c4883a":"#c85c75",Ud(s,97,38,13,6),s.fill(),s.stroke();let c=new je(r);return c.colorSpace=De,c.minFilter=ce,c.magFilter=ce,le.set(i,c),c}function il(n){let e=n?.image||null;return!!e&&e.complete!==!1}function $c(n,e,t){let i=String(n||"").trim();if(!i)return null;if(le.has(i)){let s=le.get(i);return typeof e=="function"&&(il(s)?queueMicrotask(()=>e(s)):s.userData.pendingOnLoad=[...s.userData.pendingOnLoad||[],e]),typeof t=="function"&&!il(s)&&(s.userData.pendingOnError=[...s.userData.pendingOnError||[],t]),s}let r=new fs().load(i,()=>{r.colorSpace=De,r.minFilter=_n,r.magFilter=ce;let s=r.userData.pendingOnLoad||[];r.userData.pendingOnLoad=[],r.userData.pendingOnError=[];for(let a of s)a(r)},void 0,()=>{let s=r.userData.pendingOnError||[];le.delete(i);for(let a of s)a()});return r.colorSpace=De,r.userData.pendingOnLoad=typeof e=="function"?[e]:[],r.userData.pendingOnError=typeof t=="function"?[t]:[],le.set(i,r),r}function ay(n=null){if(!n||typeof n!="object")return null;let e=Ve(Math.round(ie(n.columns,1)),1,32),t=Ve(Math.round(ie(n.rows,1)),1,32),i=Ve(Math.round(ie(n.row,0)),0,t-1),s=(Array.isArray(n.frames)?n.frames:[0]).map(a=>Ve(Math.round(ie(a,0)),0,e-1)).filter((a,o,c)=>c.indexOf(a)===o);return{id:String(n.id||""),metadataSrc:String(n.metadataSrc||""),action:String(n.action||""),columns:e,rows:t,row:i,frames:s.length>0?s:[0],fps:Ve(ie(n.fps,4),1,12),frameWidth:ie(n.frameWidth,1),frameHeight:ie(n.frameHeight,1)}}function kd(n,e,t){if(!n||!e)return;let i=Ve(Math.round(ie(t,0)),0,e.columns-1);n.repeat.set(1/e.columns,1/e.rows),n.offset.set(i/e.columns,1-(e.row+1)/e.rows),il(n)&&(n.needsUpdate=!0)}function oy(n){let e=new Lt;return e.source=n.source,e.mapping=n.mapping,e.channel=n.channel,e.wrapS=n.wrapS,e.wrapT=n.wrapT,e.generateMipmaps=n.generateMipmaps,e.premultiplyAlpha=n.premultiplyAlpha,e.flipY=n.flipY,e.unpackAlignment=n.unpackAlignment,e}function ly(n={},e){let t=ay(n.assetSprite);if(!t||!e)return{texture:e,sheet:null};let i=il(e)?e.clone():oy(e);return i.colorSpace=De,i.minFilter=_n,i.magFilter=ce,i.userData={spriteSheetClone:!0},kd(i,t,t.frames[0]),{texture:i,sheet:t}}function cy(n={}){return n.kind==="actor"?n.canonicalRoleId==="clover"?1.35:1.22:n.kind==="pad"?1.05:n.buildingType==="HQ"?2.15*ie(n.scale,1):1.55*ie(n.scale,1)}function hy(n={},e,t=0){let i=ly(n,e),r=i.sheet,s=new pt({map:i.texture,transparent:!0,depthTest:!0,depthWrite:!1,alphaTest:.04}),a=new xt(s),o=r?.frameWidth&&r?.frameHeight?{width:r.frameWidth,height:r.frameHeight}:i.texture?.image||null,c=o&&o.width&&o.height?o.width/o.height:1,h=cy(n);return a.position.set(Os(n.x),Fs(n.y),Fd(n,t)),a.scale.set(h*Ve(c,.62,1.75),h,1),a.userData=Ls(n,{sprite:!0,baseX:a.position.x,baseY:a.position.y,baseScaleX:a.scale.x,baseScaleY:a.scale.y,baseRotation:a.material.rotation||0,phase:nl(n.actionAnimation?.phaseSeed||n.actorId||n.id),spriteSheet:!!r,spriteSheetId:r?.id||"",spriteSheetAction:r?.action||"",spriteSheetMetadataSrc:r?.metadataSrc||"",spriteSheetColumns:r?.columns||0,spriteSheetRows:r?.rows||0,spriteSheetRow:r?.row??-1,spriteSheetFrames:r?.frames||[],spriteSheetFps:r?.fps||0}),a}function Ls(n={},e={}){return{objectId:String(n.id||""),kind:String(n.kind||""),label:String(n.label||""),selectionKey:String(n.selectionKey||""),drawerKey:String(n.drawerKey||""),testId:String(n.testId||""),state:String(n.state||""),visualOnly:n.visualOnly===!0,actorId:String(n.actorId||""),canonicalRoleId:String(n.canonicalRoleId||""),generatedOverlayRoleId:String(n.generatedOverlayRoleId||""),sourceDomain:String(n.sourceDomain||""),sourceObjectId:String(n.sourceObjectId||""),sourceStateHash:String(n.sourceStateHash||""),visualState:String(n.visualState||""),assetSrc:String(n.assetSrc||""),assetSprite:n.assetSprite||null,actionKind:String(n.actionKind||""),actionCueType:String(n.actionCue?.cueType||""),actionCueAccessory:String(n.actionCue?.accessory||""),animationMode:String(n.actionAnimation?.mode||""),animationTempo:ie(n.actionAnimation?.tempo,1),animationStepStyle:String(n.actionAnimation?.stepStyle||""),hasWalkOffset:n.actionAnimation?.hasWalkOffset===!0,progress:ie(n.progress,0),routeId:String(n.route?.routeId||""),wayId:String(n.route?.wayId||""),routeMode:String(n.route?.mode||""),routeProgress:ie(n.route?.progress,0),routeTargetId:String(n.route?.targetId||""),validPlacement:n.validPlacement===!0,x:ie(n.x,.5),y:ie(n.y,.5),...e}}function uy(n={},e){let t=Math.max(1.05,e.scale.x*1.04),i=Math.max(1.05,e.scale.y*1.12),r=new dt(new en(t,i),new Ot({color:16777215,transparent:!0,opacity:.001,depthWrite:!1}));return r.position.copy(e.position),r.position.z+=.1,r.userData=Ls(n,{hitTarget:!0}),r}function dy(n={},e){if(n.kind==="actor")return null;let t=String(n.state||""),i=n.selected?"selected":t==="OUTPUT_READY"?"ready":"neutral",r=Nd(n.label||n.id,i),s=new xt(new pt({map:r,transparent:!0,depthTest:!0,depthWrite:!1,alphaTest:.03}));return s.position.set(e.position.x,e.position.y-e.scale.y*.58,e.position.z+.18),s.scale.set(1.55,.39,1),s.userData=Ls(n,{labelSprite:!0}),s}function fy(n={},e){if(n.kind!=="actor"||!n.actionCue)return[];let t=String(n.canonicalRoleId||"worker"),i=n.actionCue||{},r=[],s=new xt(new pt({map:iy(t,i),transparent:!0,depthTest:!0,depthWrite:!1,alphaTest:.03})),a=t==="hauler"?.52:t==="messenger"?.38:.44,o=t==="hauler"?-.08:e.scale.y*.52;if(s.position.set(e.position.x+a,e.position.y+o,e.position.z+.22),s.scale.set(t==="messenger"?.62:.54,t==="messenger"?.62:.54,1),s.userData=Ls(n,{actionCueSprite:!0,actionCueType:String(i.cueType||""),actionCueAccessory:String(i.accessory||""),baseX:s.position.x,baseY:s.position.y,baseScaleX:s.scale.x,baseScaleY:s.scale.y,baseRotation:s.material.rotation||0,phase:nl(n.actionAnimation?.phaseSeed||n.actorId||n.id)}),r.push(s),t==="builder"||t==="worker"){let c=new xt(new pt({map:ry(t,i.progress),transparent:!0,depthTest:!0,depthWrite:!1,alphaTest:.03}));c.position.set(e.position.x,e.position.y-e.scale.y*.62,e.position.z+.24),c.scale.set(1.15,.29,1),c.userData=Ls(n,{actionCueSprite:!0,progressSprite:!0,actionCueType:String(i.cueType||""),actionCueAccessory:"progress",baseX:c.position.x,baseY:c.position.y,baseScaleX:c.scale.x,baseScaleY:c.scale.y,baseRotation:c.material.rotation||0,phase:nl(n.actionAnimation?.phaseSeed||n.actorId||n.id)}),r.push(c)}return r}function py(n={}){return n.selected?6262158:n.buildable?8362854:n.occupied?12879930:10319192}function my(n={}){let e={x:Ve((ie(n.x)+.5)/3,.08,.92),y:Ve((ie(n.y)+.5)/3,.1,.9)},t=new dt(new en(3.55,1.78),new Ot({color:py(n),transparent:!0,opacity:n.selected?.34:n.buildable?.18:.1,depthWrite:!1,side:Bt}));return t.position.set(Os(e.x),Fs(e.y),-2.1),t.userData={objectId:String(n.id||""),kind:"grid_cell",selectionKey:String(n.selectionKey||""),buildable:n.buildable===!0,occupied:n.occupied===!0,hitTarget:!0},t}function gy(n={}){let e=Array.isArray(n.points)?n.points:[],t=e.length>=2?e.map(s=>Hc(s,-1.72)):[Hc({x:.5,y:.5},-1.72),Hc({x:.55,y:.55},-1.72)],i=new di(t,!1,"centripetal",.4),r=new dt(new us(i,18,.055,7,!1),new Ot({color:7161893,transparent:!0,opacity:.62,depthWrite:!1}));return r.userData={kind:"way",wayLine:!0,wayId:String(n.wayId||""),label:String(n.label||""),targetId:String(n.targetId||""),visualOnly:n.visualOnly===!0,points:e},r}function _y(n={}){let e=new xt(new pt({map:sy(n),transparent:!0,depthTest:!0,depthWrite:!1,alphaTest:.03}));return e.position.set(Os(n.x),Fs(n.y)+.46,2.25),e.scale.set(.68,.56,1),e.userData={kind:"encounter",encounterSprite:!0,encounterId:String(n.encounterId||""),targetId:String(n.targetId||""),cueType:String(n.cueType||""),label:String(n.label||""),roles:Array.isArray(n.roles)?n.roles:[],actorIds:Array.isArray(n.actorIds)?n.actorIds:[],visualOnly:n.visualOnly===!0,baseX:e.position.x,baseY:e.position.y,baseScaleX:e.scale.x,baseScaleY:e.scale.y,phase:nl(n.encounterId||n.targetId||"")},e}function yy(n,e="three-raycast"){let t=n?.userData||{};return{objectId:String(t.objectId||""),kind:String(t.kind||""),label:String(t.label||""),selectionKey:String(t.selectionKey||""),drawerKey:String(t.drawerKey||""),testId:String(t.testId||""),visualOnly:t.visualOnly===!0,actorId:String(t.actorId||""),canonicalRoleId:String(t.canonicalRoleId||""),generatedOverlayRoleId:String(t.generatedOverlayRoleId||""),sourceDomain:String(t.sourceDomain||""),sourceObjectId:String(t.sourceObjectId||""),sourceStateHash:String(t.sourceStateHash||""),visualState:String(t.visualState||""),actionKind:String(t.actionKind||""),actionCueType:String(t.actionCueType||""),actionCueAccessory:String(t.actionCueAccessory||""),animationMode:String(t.animationMode||""),animationStepStyle:String(t.animationStepStyle||""),progress:ie(t.progress,0),routeId:String(t.routeId||""),wayId:String(t.wayId||""),routeMode:String(t.routeMode||""),routeProgress:ie(t.routeProgress,0),routeTargetId:String(t.routeTargetId||""),validPlacement:t.validPlacement===!0,source:e,atMs:Date.now()}}var Zc=class{constructor(e){this.stageNode=e,this.viewport=null,this.scenePayload=null,this.pickables=[],this.objectMeshes=[],this.info={},this.scene=new yr,this.camera=new _i(bi/-2,bi/2,Mi/2,Mi/-2,.1,100),this.camera.position.set(0,0,12),this.camera.lookAt(0,0,0),this.raycaster=new wr,this.pointer=new xe,this.renderer=new As({antialias:!0,alpha:!1,preserveDrawingBuffer:!0}),this.renderer.setClearColor(16046248,1),this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),this.renderer.domElement.className="fp-three-canvas",this.renderer.domElement.dataset.testid="founders-three-canvas",this.renderer.domElement.setAttribute("aria-label","Founders Plot Three.js scene"),this.onClick=this.onClick.bind(this),this.onResize=this.onResize.bind(this),this.animate=this.animate.bind(this),this.running=!0,this.reducedMotion=typeof window.matchMedia=="function"?window.matchMedia("(prefers-reduced-motion: reduce)").matches:!1,this.resizeObserver=new ResizeObserver(this.onResize),requestAnimationFrame(this.animate)}attach(e){e instanceof HTMLElement&&(this.viewport=e,this.renderer.domElement.parentElement!==e&&e.appendChild(this.renderer.domElement),this.stageNode.addEventListener("click",this.onClick,!0),this.resizeObserver.observe(e),this.onResize())}dispose(){this.running=!1,this.stageNode.removeEventListener("click",this.onClick,!0),this.resizeObserver.disconnect(),this.clearScene(),this.renderer.dispose(),this.renderer.domElement.remove()}clearScene(){this.scene.children.slice().forEach(t=>{this.scene.remove(t),t.traverse(i=>{if(i.geometry&&i.geometry.dispose(),i.material){let r=Array.isArray(i.material)?i.material:[i.material];for(let s of r)s.map?.userData?.spriteSheetClone&&s.map.dispose(),s.dispose()}})}),this.pickables=[],this.objectMeshes=[]}onResize(){let e=(this.viewport||this.stageNode).getBoundingClientRect(),t=Math.max(1,Math.floor(e.width)),i=Math.max(1,Math.floor(e.height));this.renderer.setSize(t,i,!1);let r=t/i,s=bi/Mi;if(r>=s){let a=Mi*r;this.camera.left=a/-2,this.camera.right=a/2,this.camera.top=Mi/2,this.camera.bottom=Mi/-2}else{let a=bi/r;this.camera.left=bi/-2,this.camera.right=bi/2,this.camera.top=a/2,this.camera.bottom=a/-2}this.camera.updateProjectionMatrix(),this.render()}sync(e={}){this.scenePayload=e,this.rebuild(),this.render()}rebuild(){this.clearScene();let e=this.scenePayload||{},t=window.innerWidth<=560?e.stageBackgrounds?.mobile:e.stageBackgrounds?.desktop,i=$c(t,()=>this.render()),r=new dt(new en(bi,Mi),new Ot({map:i||Nd("Founders Plot")}));r.position.set(0,0,-4),this.scene.add(r);for(let s of e.grid?.cells||[]){let a=my(s);this.scene.add(a),this.pickables.push(a)}for(let s of e.ways||[]){let a=gy(s);this.scene.add(a),this.objectMeshes.push(a)}for(let s of e.objects||[]){let a=s.canonicalRoleId||s.kind,o=ny(a||"worker"),c=null,h=s.assetSrc?$c(s.assetSrc,()=>this.render(),()=>{c?.material&&(c.material.map?.userData?.spriteSheetClone&&c.material.map.dispose(),c.material.map=o,c.material.needsUpdate=!0,c.userData.assetFallback=!0,c.userData.spriteSheet=!1,this.render())}):o;c=hy(s,h||o,s.kind==="actor"?.8:0),this.scene.add(c),this.objectMeshes.push(c);let u=uy(s,c);this.scene.add(u),this.pickables.push(u);let f=dy(s,c);f&&this.scene.add(f);for(let d of fy(s,c))this.scene.add(d),this.objectMeshes.push(d)}for(let s of e.encounters||[]){let a=_y(s);this.scene.add(a),this.objectMeshes.push(a)}this.updateInfo()}pickFromEvent(e){let t=this.renderer.domElement.getBoundingClientRect();this.pointer.x=(e.clientX-t.left)/t.width*2-1,this.pointer.y=-((e.clientY-t.top)/t.height)*2+1,this.raycaster.setFromCamera(this.pointer,this.camera);let i=this.raycaster.intersectObjects(this.pickables,!1);return i.sort((r,s)=>{let a=c=>{let h=c?.object?.userData||{};return h.kind==="actor"?100:h.kind==="building"?70:h.kind==="pad"?60:h.kind==="grid_cell"?10:30},o=a(s)-a(r);return o||r.distance-s.distance}),i[0]?.object||null}onClick(e){let t=this.pickFromEvent(e);if(e.target instanceof Element&&e.target.closest(".fp-tile")&&t?.userData?.kind!=="actor"||!t)return;let i=yy(t);i.visualOnly&&(e.preventDefault(),e.stopPropagation()),window.dispatchEvent(new CustomEvent("founders-plot-scene-pick",{detail:i}))}canvasPointFor(e){let t=new R(Os(e.x),Fs(e.y),Fd(e,e.kind==="actor"?.8:0));t.project(this.camera);let i=this.renderer.domElement.getBoundingClientRect();return{x:(t.x+1)/2*i.width,y:(-t.y+1)/2*i.height}}updateInfo(){let e=this.scenePayload||{},t=this.renderer.domElement,i=Array.isArray(e.objects)?e.objects:[];return this.info={renderer:"three.js",stateHash:String(e.stateHash||""),canvasWidth:t.width,canvasHeight:t.height,objectCount:i.length,objectIds:i.map(r=>r.id),ways:(e.ways||[]).map(r=>({wayId:r.wayId||"",targetId:r.targetId||"",label:r.label||"",points:r.points||[],visualOnly:r.visualOnly===!0})),encounters:(e.encounters||[]).map(r=>({encounterId:r.encounterId||"",targetId:r.targetId||"",roles:r.roles||[],actorIds:r.actorIds||[],cueType:r.cueType||"",visualOnly:r.visualOnly===!0,canvas:this.canvasPointFor({x:r.x,y:r.y,z:0,kind:"encounter"})})),actorIds:(e.actors||[]).map(r=>r.actorId),actors:(e.actors||[]).map(r=>({...r,canvas:this.canvasPointFor(i.find(s=>s.actorId===r.actorId||s.id===r.id)||{})})),actionCues:(e.actors||[]).map(r=>({actorId:r.actorId,canonicalRoleId:r.canonicalRoleId,sourceDomain:r.sourceDomain,sourceObjectId:r.sourceObjectId,actionKind:r.actionKind||"",cueType:r.actionCue?.cueType||"",accessory:r.actionCue?.accessory||"",progress:ie(r.actionCue?.progress,r.progress||0)})),roles:(e.actors||[]).map(r=>r.canonicalRoleId),renderedActors:this.objectMeshes.filter(r=>r.userData?.kind==="actor"&&r.userData?.sprite===!0).map(r=>({actorId:r.userData.actorId||"",canonicalRoleId:r.userData.canonicalRoleId||"",assetSrc:r.userData.assetSrc||"",spriteSheet:r.userData.spriteSheet===!0,spriteSheetId:r.userData.spriteSheetId||"",spriteSheetAction:r.userData.spriteSheetAction||"",routeId:r.userData.routeId||"",wayId:r.userData.wayId||"",routeProgress:ie(r.userData.routeProgress,0),assetFallback:r.userData.assetFallback===!0})),renderedWays:this.objectMeshes.filter(r=>r.userData?.wayLine===!0).map(r=>({wayId:r.userData.wayId||"",targetId:r.userData.targetId||"",visualOnly:r.userData.visualOnly===!0})),renderedEncounters:this.objectMeshes.filter(r=>r.userData?.encounterSprite===!0).map(r=>({encounterId:r.userData.encounterId||"",targetId:r.userData.targetId||"",cueType:r.userData.cueType||"",roles:r.userData.roles||[],visualOnly:r.userData.visualOnly===!0})),pickTargets:i.map(r=>({objectId:r.id,kind:r.kind,label:r.label,selectionKey:r.selectionKey,drawerKey:r.drawerKey,testId:r.testId,visualOnly:r.visualOnly===!0,actorId:r.actorId||"",canonicalRoleId:r.canonicalRoleId||"",sourceDomain:r.sourceDomain||"",sourceObjectId:r.sourceObjectId||"",sourceStateHash:r.sourceStateHash||"",visualState:r.visualState||"",assetSrc:r.assetSrc||"",assetSprite:r.assetSprite||null,actionKind:r.actionKind||"",route:r.route||null,actionCue:r.actionCue||null,actionAnimation:r.actionAnimation||null,canvas:this.canvasPointFor(r)}))},this.info}animate(e=0){if(this.running){for(let t of this.objectMeshes){let i=t.userData||{},r=ie(i.baseX,t.position.x),s=ie(i.baseY,t.position.y),a=ie(i.baseScaleX,t.scale.x),o=ie(i.baseScaleY,t.scale.y),c=ie(i.baseRotation,0);if(i.kind==="actor"){if(i.spriteSheet&&t.material?.map){let v=Array.isArray(i.spriteSheetFrames)&&i.spriteSheetFrames.length>0?i.spriteSheetFrames:[0],_=ie(i.spriteSheetFps,4),E=v[Math.floor(e/1e3*_+ie(i.phase,0))%v.length];kd(t.material.map,{columns:ie(i.spriteSheetColumns,1),rows:ie(i.spriteSheetRows,1),row:ie(i.spriteSheetRow,0)},E)}if(this.reducedMotion){t.position.x=r,t.position.y=s,t.scale.set(a,o,1),t.material&&(t.material.rotation=c);continue}let h=ie(i.phase,0),u=ie(i.animationTempo,1),f=e/360*u+h,d=i.hasWalkOffset?Math.sin(e/170+h):0,p=Math.abs(d)*.018,g=r,y=s+Math.sin(f)*.024+p,m=a,l=o,b=c;i.animationMode==="work_swing"?(b+=Math.sin(e/120+h)*.075,y+=Math.max(0,Math.sin(e/155+h))*.035,l*=1+Math.sin(e/155+h)*.018):i.animationMode==="busy_work"?(g+=Math.sin(e/135+h)*.018,y+=Math.sin(e/95+h)*.012,m*=1+Math.sin(e/135+h)*.012):i.animationMode==="carry_wobble"?(g+=Math.sin(e/210+h)*.025,b+=Math.sin(e/180+h)*.055,l*=1+Math.abs(Math.sin(e/180+h))*.018):i.animationMode==="attention_wave"&&(y+=Math.abs(Math.sin(e/150+h))*.05,b+=Math.sin(e/125+h)*.045,m*=1+Math.sin(e/150+h)*.012),t.position.x=g,t.position.y=y,t.scale.set(m,l,1),t.material&&(t.material.rotation=b)}else if(i.actionCueSprite&&!i.progressSprite){if(this.reducedMotion){t.position.x=r,t.position.y=s,t.material&&(t.material.rotation=c);continue}let h=ie(i.phase,0);t.position.y=s+Math.sin(e/240+h)*.025,i.actionCueAccessory==="hammer"||i.actionCueAccessory==="wrench"?t.material.rotation=c+Math.sin(e/135+h)*.1:(i.actionCueAccessory==="notice"||i.actionCueAccessory==="approval"||i.actionCueAccessory==="quest")&&(t.material.rotation=c+Math.sin(e/180+h)*.07)}}this.render(),requestAnimationFrame(this.animate)}}render(){this.updateInfo(),this.renderer.render(this.scene,this.camera)}},Kn=13.6,Jn=8.2,Wi=.86,vn=Wi*1.64,Gt="hq14t_server_bound_terrain_underlay_v1",yd="hq14s_public_terrain_underlay_v1",ll="/experiences/founders-plot/assets/expedition-map",Ei=`${ll}/hq14s-public-terrain-underlay-v1`,xy="hq15e_expedition_unit_marker_sprites_v1",Fn=`${ll}/hq15e-expedition-unit-marker-sprites-v1`,Cs="hq17c-generated-hud-chrome-v1",Ti=`${ll}/${Cs}`,zc="hq17d_three_masked_profiles_and_text_v1",xd="hq17e_clean_hud_chrome_compositor_v1",Sd="hq17f_single_owner_canvas_hud_v1",sn="hq17g_renderer_owned_hud_materiality_v1",Rs="hq17h_renderer_hud_world_cohesion_v1",el="hq18_frontier_ledger_scratch_visual_hud_v1",Jo="hq18a_frontier_ledger_map_system_v1",Ns="hq18b_frontier_ledger_visual_parity_pass_v1",Vc="hq18d_frontier_ledger_outer_source_chrome_cutout_v1",Gc=.28,Wc=.12,vd=.44,bd="frontier-ledger-north-star-upload-2026-06-05",zi=Object.freeze({path:"/Users/robin/Downloads/Frontier_Ledger.png",width:1672,height:941,aspect:1672/941}),Kc="frontier-ledger-north-star-hud-v1",jo=`${ll}/${Kc}`,Sy=Object.freeze({"frontier-ledger-top-tabs-shadow":{slot:"frontier-ledger-top-tabs-shadow",path:`${jo}/top-tabs.png`,crop:{x:0,y:0,width:430,height:132}},"frontier-ledger-right-tab-shadow":{slot:"frontier-ledger-right-tab-shadow",path:`${jo}/right-ledger-tab.png`,crop:{x:1588,y:220,width:84,height:420}},"frontier-ledger-bottom-medallion-rail":{slot:"frontier-ledger-bottom-medallion-rail",path:`${jo}/bottom-rail.png`,crop:{x:0,y:650,width:1672,height:291}},"frontier-ledger-parcel-rangefinder-backplate":{slot:"frontier-ledger-parcel-rangefinder-backplate",path:`${jo}/parcel-rangefinder.png`,crop:{x:1325,y:575,width:300,height:345}}}),Md=Object.freeze([{index:0,sourceX:470,sourceY:785,sourceRadius:74,primary:!0},{index:1,sourceX:635,sourceY:785,sourceRadius:68},{index:2,sourceX:795,sourceY:785,sourceRadius:68},{index:3,sourceX:962,sourceY:785,sourceRadius:68}]),Bd=Object.freeze([{slot:"frontier-ledger-board-frame",layer:"hud",anchor:"viewport",x:0,y:0,width:1,height:1},{slot:"frontier-ledger-top-tabs-shadow",layer:"hud",anchor:"viewport",x:0,y:0,width:.257,height:.14,mobile:{x:0,y:.008,width:.62,height:.085}},{slot:"frontier-ledger-right-tab-shadow",layer:"hud",anchor:"viewport",x:.95,y:.234,width:.05,height:.446,mobile:{x:.875,y:.19,width:.12,height:.47}},{slot:"frontier-ledger-bottom-medallion-rail",layer:"hud",anchor:"viewport",x:0,y:.691,width:1,height:.309,mobile:{x:-.08,y:.755,width:1.16,height:.245}},{slot:"frontier-ledger-parcel-rangefinder-backplate",layer:"hud",anchor:"viewport",x:.793,y:.611,width:.179,height:.367,mobile:{x:.66,y:.585,width:.34,height:.26}},{slot:"frontier-ledger-dotted-target-trail",layer:"bridge",anchor:"world",source:"server_owned_command_target"},{slot:"frontier-ledger-route-arc",layer:"bridge",anchor:"world",source:"server_owned_command_target"},{slot:"frontier-ledger-target-callout",layer:"bridge",anchor:"world",source:"server_owned_command_target"},{slot:"frontier-ledger-selected-ring",layer:"world",anchor:"world",source:"server_owned_selection"},{slot:"frontier-ledger-unit-token",layer:"world",anchor:"world",source:"server_owned_unit_roster"}]),sh=Object.freeze(["unit-dock","command-tray","command-puck","selected-context"]),Jc="agenttown_public_terrain_asset_slots_v1",jc="server_read_model_v1",vy=Object.freeze(["field","forest","ridge","settled"]),Hd=Object.freeze({slot:"public_terrain_underlay",path:`${Ei}/public-terrain-underlay-candidate-01-v1.png`,assetKind:"visual_underlay"}),Td=Object.freeze({field:{slot:"field",path:`${Ei}/field-v1.png`,assetKind:"concrete_public_terrain"},settled:{slot:"settled",path:`${Ei}/settled-v1.png`,assetKind:"concrete_public_terrain"},forest:{slot:"forest",path:`${Ei}/forest-v1.png`,assetKind:"concrete_public_terrain"},ridge:{slot:"ridge",path:`${Ei}/ridge-v1.png`,assetKind:"concrete_public_terrain"},hinted:{slot:"hinted_frontier_fog",path:`${Ei}/hinted-frontier-fog-v1.png`,assetKind:"fog_only",fogOnly:!0},locked_unknown:{slot:"locked_unknown_fog",path:`${Ei}/locked-unknown-fog-v1.png`,assetKind:"fog_only",fogOnly:!0}}),zd=Object.freeze({scout:{slot:"scout",path:`${Fn}/scout-pathfinder-v1.png`,assetKind:"generated_unit_sprite"},settler_convoy:{slot:"settler_convoy",path:`${Fn}/settler-convoy-v1.png`,assetKind:"generated_unit_sprite"},surveyor:{slot:"surveyor",path:`${Fn}/surveyor-beacon-v1.png`,assetKind:"generated_unit_sprite"},courier:{slot:"courier",path:`${Fn}/courier-signal-runner-v1.png`,assetKind:"generated_unit_sprite"},outpost_crew:{slot:"outpost_crew",path:`${Fn}/outpost-crew-v1.png`,assetKind:"generated_unit_sprite"},field_support:{slot:"surveyor",path:`${Fn}/surveyor-beacon-v1.png`,assetKind:"generated_unit_sprite"}}),Gi=Object.freeze({objective_beacon:{slot:"objective_beacon",path:`${Fn}/objective-beacon-v1.png`,assetKind:"generated_marker_sprite"},event_packet:{slot:"event_packet",path:`${Fn}/event-packet-v1.png`,assetKind:"generated_marker_sprite"},receipt_ledger:{slot:"receipt_ledger",path:`${Fn}/receipt-ledger-v1.png`,assetKind:"generated_marker_sprite"}}),Ed=Object.freeze([{slot:"crest-status",path:`${Ti}/crest-status.png`,anchor:"top-left",widthRatio:.285,heightRatio:.092,marginX:.006,marginY:.014,opacity:.82},{slot:"objective-loop",path:`${Ti}/objective-plaque.png`,anchor:"top-left",widthRatio:.148,heightRatio:.068,marginX:.206,marginY:.032,opacity:.82},{slot:"unit-dock",path:`${Ti}/unit-dock.png`,anchor:"bottom-left",widthRatio:.575,heightRatio:.225,marginX:0,marginY:0,opacity:.88},{slot:"command-tray",path:`${Ti}/command-tray.png`,anchor:"bottom-right",widthRatio:.372,heightRatio:.245,marginX:.01,marginY:.01,opacity:.9},{slot:"collapsed-ledger",path:`${Ti}/ledger-rail.png`,anchor:"right",widthRatio:.07,heightRatio:.5,marginX:0,marginY:.18,opacity:.88},{slot:"selected-context",path:`${Ti}/selected-context-frame.png`,anchor:"bottom-right",widthRatio:.19,heightRatio:.178,marginX:.036,marginY:.258,opacity:.9},{slot:"command-puck",path:`${Ti}/command-puck.png`,anchor:"selected-command",widthRatio:.078,heightRatio:.112,marginX:0,marginY:0,opacity:.82}]),Qc=new Map,eh=new Set;function Vd(n={}){let t=(Array.isArray(n.generatedHudChrome?.assets)?n.generatedHudChrome.assets:[]).filter(i=>i?.path&&i?.slot).map(i=>{let r=Ed.find(s=>String(s.slot||"")===String(i.slot||""))||{};return{...i,...r,path:String(i.path||r.path||""),packId:String(n.generatedHudChrome?.packId||i.packId||Cs),visualOnly:!0,readOnly:!0,routeAuthority:!1,actionAuthority:!1,executableActions:0}});return t.length?t:Ed}function by(n="",e={}){return Vd(e).find(t=>String(t.slot||"")===String(n||""))||null}function My(){return Bd.map(n=>({...n}))}function th(n=""){return Bd.find(e=>String(e.slot||"")===String(n||""))||null}function Ty(n=""){return Sy[String(n||"")]||null}function wd(n="",e={width:1,height:1},t={x:0,y:0},i=!1){let r=th(n)||{},s=i&&r.mobile?r.mobile:{},a=ie(s.x,ie(r.x,0)),o=ie(s.y,ie(r.y,0)),c=ie(s.width,ie(r.width,.1)),h=ie(s.height,ie(r.height,.1)),u=t.x-e.width/2,f=t.y+e.height/2,d=Ve(c*e.width,.12,e.width*1.08),p=Ve(h*e.height,.12,e.height*1.08);return{x:u+a*e.width+d/2,y:f-o*e.height-p/2,width:d,height:p,left:u+a*e.width,right:u+a*e.width+d,top:f-o*e.height,bottom:f-o*e.height-p}}function Ey(n="",e=.82){let t=String(n||""),i=sh.includes(t);return{presentationVersion:Ns,suppressed:i,opacity:i?.001:ie(e,.82),role:i?"frontier_ledger_replaced_by_map_system_slot":"frontier_ledger_retained_legacy_hud_slot"}}function Ad(n="",e=.88){let t=String(n||""),i=t==="command-tray"||sh.includes(t);return{presentationVersion:Ns,suppressed:i,opacity:i?.001:ie(e,.88),role:i?"frontier_ledger_replaced_by_map_system_slot":"frontier_ledger_retained_legacy_hud_content"}}function jn(n,e=1){let t=Number(n||0),i=t>>16&255,r=t>>8&255,s=t&255;return`rgba(${i}, ${r}, ${s}, ${e})`}function wy(n=""){let e=String(n||""),t=2166136261;for(let i=0;i<e.length;i+=1)t^=e.charCodeAt(i),t=Math.imul(t,16777619);return t>>>0}function rl(n=""){return wy(n)%1e4/1e4}function Cd(n={}){let e=ie(n.q,0),t=ie(n.r,0);return{x:e+t*.5,y:-t*.86}}function Gd(n=[]){let e=n.map(m=>Cd(m));e.length||e.push({x:0,y:0});let t=Math.min(...e.map(m=>m.x),0),i=Math.max(...e.map(m=>m.x),0),r=Math.min(...e.map(m=>m.y),0),s=Math.max(...e.map(m=>m.y),0),a=Math.max(1,i-t),o=Math.max(1,s-r),c=Math.min((Kn-2.4)/a,(Jn-1.8)/o,1.62),h=(t+i)/2,u=(r+s)/2,f=new Map,d=1/0,p=-1/0,g=1/0,y=-1/0;for(let m of n){let l=Cd(m),b={x:(l.x-h)*c,y:(l.y-u)*c};f.set(String(m.cellId||""),b),d=Math.min(d,b.x-vn),p=Math.max(p,b.x+vn),g=Math.min(g,b.y-vn),y=Math.max(y,b.y+vn)}return Number.isFinite(d)||(d=-1,p=1,g=-1,y=1),{positions:f,bounds:{minX:d,maxX:p,minY:g,maxY:y,centerX:(d+p)/2,centerY:(g+y)/2,width:Math.max(1,p-d),height:Math.max(1,y-g)}}}function ah(n={},e=!1){let t=String(n.fogState||"locked_unknown");return e?{fill:14676452,line:1462092,rim:16110724,shadow:1457209,opacity:.98,lineOpacity:.98,labelTone:"selected",fogOverlay:15727092}:t==="discovered"?{fill:13153410,line:8020032,rim:14138490,shadow:5916717,opacity:.98,lineOpacity:.42,labelTone:"ready",fogOverlay:15851446}:t==="known"?{fill:12560504,line:7297596,rim:14206350,shadow:5192744,opacity:.96,lineOpacity:.38,labelTone:"selected",fogOverlay:14995618}:t==="hinted"?{fill:15047477,line:7159574,rim:16767096,shadow:8078611,opacity:.92,lineOpacity:.84,labelTone:"neutral",fogOverlay:15971400}:{fill:10130564,line:6116938,rim:14141352,shadow:5393218,opacity:.54,lineOpacity:.46,labelTone:"neutral",fogOverlay:13155498}}function Sn(n=Wi){let e=[];for(let t=0;t<6;t+=1){let i=Math.PI/6+t*Math.PI/3;e.push(new R(Math.cos(i)*n,Math.sin(i)*n,0))}return e.push(e[0].clone()),e}function Rd(n=Wi){let e=new Mr;return Sn(n).forEach((t,i)=>{i===0?e.moveTo(t.x,t.y):e.lineTo(t.x,t.y)}),new hs(e)}function Id(n=Wi){let e=Sn(n).slice(0,6),t=[0,0,0],i=[.5,.5];for(let a of e)t.push(a.x,a.y,0),i.push(.5+a.x/(n*2),.5-a.y/(n*2));let r=[];for(let a=1;a<=e.length;a+=1)r.push(0,a,a===e.length?1:a+1);let s=new et;return s.setAttribute("position",new yt(t,3)),s.setAttribute("uv",new yt(i,2)),s.setIndex(r),s.computeVertexNormals(),s}function Wd(n={}){let e=String(n.status||""),t=String(n.kind||""),i=String(n.fogState||"");return e.includes("OUTPOST")||t.includes("outpost")?"OUT":t==="origin_plot"?"HQ":e.includes("SITE_PLAN")?"PLAN":e.includes("SCOUT")?"SITE":i==="hinted"?"...":i==="locked_unknown"?"?":"MAP"}function Ay(n="",e=!1,t=!1){return e?1:t?.92:n==="locked_unknown"?.26:n==="hinted"?.46:.94}function Cy(n={},e="",t=!1,i=!1){let r=ie(n.opacity,.72);return t?1:i?Math.min(.96,r*1.02):e==="locked_unknown"?Math.min(.34,r*.58):e==="hinted"?Math.min(.52,r*.62):Math.min(.94,r*1.06)}function Ry(n="",e=!1,t=!1){return e?.7:t?.42:n==="locked_unknown"?.08:n==="hinted"?.16:.18}function Iy(n={},e="",t=!1,i=!1){return t?Math.max(.58,ie(n.lineOpacity,.58)):i?.38:e==="locked_unknown"?.14:e==="hinted"?.2:.22}function Py(n={}){let e=String(n.siteType||"").toLowerCase(),t=Array.isArray(n.traits)?n.traits.map(s=>String(s||"").toLowerCase()):[],i=String(n.kind||"").toLowerCase(),r=String(n.status||"").toLowerCase();return`${e} ${i} ${r} ${t.join(" ")}`}function wi(n={}){return["discovered","known"].includes(String(n.fogState||"locked_unknown"))}function Us(n={}){if(!wi(n))return null;let e=String(n.publicTerrainAssetSlot||"");return vy.includes(e)?e:null}function oh(n={}){let e=String(n.fogState||"locked_unknown"),t=String(n.fogAssetSlot||"");return e==="hinted"&&t==="hinted_frontier_fog"||e==="locked_unknown"&&t==="locked_unknown_fog"?t:e==="hinted"?"hinted_frontier_fog":"locked_unknown_fog"}function Qn(n={}){let e=String(n.fogState||"locked_unknown");return wi(n)?Us(n)||"field":e}function Dy(n={},e=null){return!wi(n)||!e?.slot?!1:e.slot===Us(n)}function lh(n={},e=Qn(n)){let t=String(n.fogState||"locked_unknown");if(!wi(n)){let r=Td[t]||null;return r&&r.slot===oh(n)?r:null}let i=Td[Us(n)||e]||null;return i&&Dy(n,i)?i:null}function Ly(n={},e=Qn(n),t=lh(n,e)){let i=String(n.fogState||"locked_unknown");return t?wi(n)?t.fogOnly!==!0&&t.assetKind==="concrete_public_terrain"&&t.slot===Us(n)&&String(n.terrainAssetContractVersion||"")===Jc&&String(n.publicTerrainAssetSlotSource||"")===jc:t.fogOnly===!0&&t.assetKind==="fog_only"&&t.slot===oh(n):e==="field"}function Pd(){for(let n of eh)n()}function Oy(n){return typeof n!="function"?()=>{}:(eh.add(n),()=>eh.delete(n))}function Nn(n=null){if(!n?.path)return null;let e=Qc.get(n.path);return!e||e.dataset?.loadFailed==="true"?null:e.complete&&e.naturalWidth>0?e:null}function cl(n=null){if(!n?.path||typeof Image>"u")return null;if(Qc.get(n.path))return Nn(n);let t=new Image;return t.decoding="async",t.onload=()=>Pd(),t.onerror=()=>{t.dataset.loadFailed="true",Pd()},Qc.set(n.path,t),t.src=n.path,Nn(n)}function sl(n={}){return zd[String(n.unitType||"")]||null}function ch(n,e=null,t=0,i=0,r=128,s=128,a=22){let o=cl(e);return o?(n.save(),n.beginPath(),n.roundRect(t,i,r,s,a),n.clip(),n.drawImage(o,t,i,r,s),n.restore(),!0):!1}function Xd(n,e=120,t=128){n.beginPath(),Sn(e).forEach((i,r)=>{let s=t+i.x,a=t+i.y;r===0?n.moveTo(s,a):n.lineTo(s,a)}),n.closePath()}function Fy(n,e,t,i=1,r="rgba(35, 104, 68, 0.62)"){n.fillStyle="rgba(46, 27, 14, 0.18)",n.beginPath(),n.ellipse(e+7*i,t+12*i,13*i,4*i,0,0,Math.PI*2),n.fill(),n.fillStyle="rgba(80, 55, 29, 0.58)",n.fillRect(e-2*i,t+4*i,4*i,14*i),n.fillStyle=r;for(let s=0;s<3;s+=1){let a=t-18*i+s*12*i,o=(18-s*2)*i;n.beginPath(),n.moveTo(e,a),n.lineTo(e-o,a+24*i),n.lineTo(e+o,a+24*i),n.closePath(),n.fill()}}function Xc(n,e,t,i=1,r="rgba(255, 248, 232, 0.78)"){n.fillStyle="rgba(46, 27, 14, 0.18)",n.beginPath(),n.ellipse(e+8*i,t+24*i,24*i,7*i,0,0,Math.PI*2),n.fill(),n.fillStyle=r,n.strokeStyle="rgba(46, 27, 14, 0.38)",n.lineWidth=4*i,n.beginPath(),n.roundRect(e-18*i,t,36*i,26*i,5*i),n.fill(),n.stroke(),n.fillStyle="rgba(151, 86, 44, 0.82)",n.beginPath(),n.moveTo(e-22*i,t+4*i),n.lineTo(e,t-17*i),n.lineTo(e+23*i,t+4*i),n.closePath(),n.fill(),n.stroke()}function al(n,e,t,i=1,r="rgba(27, 106, 100, 0.72)"){n.strokeStyle="rgba(46, 27, 14, 0.42)",n.lineWidth=4*i,n.lineCap="round",n.beginPath(),n.moveTo(e,t+22*i),n.lineTo(e,t-28*i),n.stroke(),n.fillStyle=r,n.beginPath(),n.moveTo(e+3*i,t-25*i),n.lineTo(e+30*i,t-17*i),n.lineTo(e+3*i,t-6*i),n.closePath(),n.fill(),n.strokeStyle="rgba(255, 248, 232, 0.52)",n.lineWidth=2*i;for(let s=0;s<3;s+=1)n.beginPath(),n.arc(e,t-21*i,(15+s*12)*i,-.72,.34),n.stroke()}function nh(n,e,t,i=92,r=.22){n.save(),n.strokeStyle=`rgba(46, 27, 14, ${r})`,n.lineWidth=3,n.lineCap="round",n.beginPath(),n.moveTo(e,t),n.bezierCurveTo(e+i*.25,t-7,e+i*.62,t+8,e+i,t-2),n.stroke(),n.strokeStyle=`rgba(255, 248, 232, ${r+.1})`,n.lineWidth=1.6,n.beginPath(),n.moveTo(e+4,t-4),n.bezierCurveTo(e+i*.28,t-9,e+i*.64,t+5,e+i-6,t-6),n.stroke(),n.restore()}function ih(n,e,t,i=1){n.save(),n.translate(e,t),n.fillStyle="rgba(255, 248, 232, 0.30)",n.strokeStyle="rgba(46, 27, 14, 0.34)",n.lineWidth=3*i,n.beginPath(),n.roundRect(-34*i,-17*i,68*i,34*i,8*i),n.fill(),n.stroke(),n.fillStyle="rgba(27, 106, 100, 0.35)",n.beginPath(),n.moveTo(-27*i,-17*i),n.lineTo(0,-39*i),n.lineTo(29*i,-17*i),n.closePath(),n.fill(),n.stroke(),n.strokeStyle="rgba(101, 74, 28, 0.45)",n.beginPath(),n.arc(-23*i,21*i,10*i,0,Math.PI*2),n.arc(24*i,21*i,10*i,0,Math.PI*2),n.stroke(),n.restore()}function Ny(n,e,t,i=1){n.fillStyle="rgba(255, 248, 232, 0.14)",n.strokeStyle="rgba(255, 248, 232, 0.22)",n.lineWidth=4*i;for(let r=0;r<3;r+=1){let s=e+(r-1)*18*i,a=(26+r%2*14)*i;n.beginPath(),n.roundRect(s-7*i,t-a,14*i,a,3*i),n.fill(),n.stroke()}n.beginPath(),n.moveTo(e-30*i,t+3*i),n.lineTo(e+32*i,t-2*i),n.stroke()}function Uy(n,e,t,i){let r=rl(`${e.cellId}:${i}`);n.save(),Xd(n),n.clip();let s=n.createLinearGradient(0,18,256,238);s.addColorStop(0,jn(t.rim,.92)),s.addColorStop(.46,jn(t.fill,.96)),s.addColorStop(1,jn(t.shadow,.72)),n.fillStyle=s,n.fillRect(0,0,256,256),n.strokeStyle="rgba(46, 27, 14, 0.08)",n.lineWidth=3;for(let a=0;a<7;a+=1){let o=28+a*31;n.beginPath(),n.moveTo(12,o),n.bezierCurveTo(66,o-12,121,o+14,182,o-3),n.bezierCurveTo(210,o-10,231,o+3,248,o-8),n.stroke()}if(i==="water"&&(n.strokeStyle="rgba(39, 126, 167, 0.26)",n.lineWidth=9,n.lineCap="round",n.beginPath(),n.moveTo(-10,172-r*30),n.bezierCurveTo(62,139-r*16,118,191+r*12,266,132-r*20),n.stroke(),n.strokeStyle="rgba(224, 248, 255, 0.28)",n.lineWidth=3,n.stroke()),i==="forest"){String(e.fogState||"")==="known"&&(n.fillStyle="rgba(24, 137, 132, 0.24)",n.fillRect(0,0,256,256));for(let a=0;a<34;a+=1){let o=38+(a*37+r*93)%178,c=50+(a*53+r*71)%150;Fy(n,o,c,.46+a%3*.07,String(e.fogState||"")==="known"?a%4===0?"rgba(18, 101, 103, 0.72)":"rgba(38, 139, 119, 0.64)":a%4===0?"rgba(29, 84, 61, 0.70)":"rgba(42, 119, 72, 0.62)")}n.strokeStyle="rgba(255, 248, 232, 0.22)",n.lineWidth=5}else if(i==="ridge"){n.strokeStyle="rgba(80, 68, 55, 0.48)",n.lineWidth=9;for(let a=0;a<5;a+=1){let o=62+a*30;n.beginPath(),n.moveTo(24,o),n.bezierCurveTo(74,o-26,126,o+24,232,o-12),n.stroke()}n.fillStyle="rgba(255, 248, 232, 0.18)";for(let a=0;a<12;a+=1){let o=30+a*43%180,c=58+a*29%122;n.beginPath(),n.moveTo(o,c-10),n.lineTo(o-12,c+14),n.lineTo(o+15,c+10),n.closePath(),n.fill()}n.strokeStyle="rgba(255, 248, 232, 0.26)",n.lineWidth=4}else if(i==="settled"){n.fillStyle="rgba(255, 248, 232, 0.28)",n.beginPath(),n.ellipse(128,132,78,48,-.18,0,Math.PI*2),n.fill(),n.strokeStyle="rgba(101, 74, 28, 0.22)",n.lineWidth=4;for(let a=0;a<4;a+=1)nh(n,56,86+a*23,128,.18);Xc(n,112,118,1.05),Xc(n,152,137,.72,"rgba(232, 244, 222, 0.78)"),Xc(n,82,146,.62,"rgba(255, 228, 160, 0.58)"),al(n,160,96,.56,"rgba(47, 125, 101, 0.74)"),ih(n,90,86,.42),n.strokeStyle="rgba(27, 106, 100, 0.34)",n.lineWidth=5,n.beginPath(),n.ellipse(128,132,90,58,-.18,0,Math.PI*2),n.stroke(),n.strokeStyle="rgba(255, 248, 232, 0.34)",n.lineWidth=3,n.beginPath(),n.moveTo(58,162),n.bezierCurveTo(112,142,152,167,206,141),n.stroke(),n.strokeStyle="rgba(27, 106, 100, 0.34)",n.lineWidth=5}else if(i==="water"){n.strokeStyle="rgba(46, 122, 152, 0.44)",n.lineWidth=10;for(let a=0;a<6;a+=1){let o=58+a*25;n.beginPath(),n.moveTo(22,o),n.bezierCurveTo(76,o+18,112,o-18,166,o+3),n.bezierCurveTo(194,o+14,218,o-6,236,o+4),n.stroke()}n.strokeStyle="rgba(255, 248, 232, 0.28)",n.lineWidth=4}else if(i==="ruin_signal"){n.fillStyle="rgba(255, 248, 232, 0.18)",n.fillRect(0,0,256,256),n.strokeStyle="rgba(80, 68, 55, 0.36)",n.lineWidth=7;for(let a=0;a<4;a+=1){let o=70+a*29;n.beginPath(),n.moveTo(34,o),n.bezierCurveTo(76,o-16,128,o+14,212,o-8),n.stroke()}Ny(n,105,154,.72),al(n,160,116,.48,"rgba(101, 74, 28, 0.56)"),n.strokeStyle="rgba(101, 74, 28, 0.32)",n.lineWidth=4}else if(i==="hinted"){n.fillStyle="rgba(226, 134, 40, 0.18)",n.fillRect(0,0,256,256),n.fillStyle="rgba(255, 248, 232, 0.16)";for(let a=0;a<10;a+=1){let o=28+a*22;n.beginPath(),n.ellipse(128+(a%3-1)*22,o,112-a%2*18,12,.12,0,Math.PI*2),n.fill()}n.setLineDash([10,9]),n.strokeStyle="rgba(255, 248, 232, 0.32)",n.lineWidth=4,n.beginPath(),n.ellipse(128,130,72,48,-.15,0,Math.PI*2),n.stroke(),n.setLineDash([]),n.fillStyle="rgba(46, 27, 14, 0.12)",n.beginPath(),n.ellipse(128,136,52,31,-.18,0,Math.PI*2),n.fill(),n.strokeStyle="rgba(138, 109, 65, 0.34)",n.lineWidth=5}else if(i==="locked_unknown"){n.fillStyle="rgba(255, 248, 232, 0.10)";for(let a=-2;a<11;a+=1)n.fillRect(a*31,20,13,220);n.fillStyle="rgba(255, 248, 232, 0.12)";for(let a=0;a<7;a+=1)n.beginPath(),n.ellipse(128,42+a*26,116-a%2*18,11,-.12,0,Math.PI*2),n.fill();n.fillStyle="rgba(68, 58, 48, 0.16)",n.beginPath(),n.ellipse(128,145,60,36,.1,0,Math.PI*2),n.fill(),n.strokeStyle="rgba(255, 248, 232, 0.20)",n.lineWidth=5}else{ih(n,88+r*64,86+r*42,.32),n.strokeStyle="rgba(69, 112, 68, 0.30)",n.lineWidth=5;for(let a=0;a<7;a+=1){let o=48+a*24;n.beginPath(),n.moveTo(26,o),n.bezierCurveTo(84,o-12,144,o+10,230,o-7),n.stroke()}}n.strokeStyle=i==="locked_unknown"?"rgba(255, 248, 232, 0.10)":n.strokeStyle;for(let a=0;a<4;a+=1){let o=60+a*38+r*12;n.beginPath(),n.moveTo(18,o),n.bezierCurveTo(82,o-18,152,o+15,238,o-9),n.stroke()}n.restore()}function Dd(n={},e=!1){let t=String(n.fogState||"locked_unknown"),i=Qn(n),r=lh(n,i),s=cl(r),a=s?"asset-ready":r?.slot||"procedural",o=`expedition-cell:${Gt}:${n.cellId}:${t}:${i}:${a}:${e?"selected":"idle"}`;if(le.has(o))return le.get(o);let c=ah(n,e),h=document.createElement("canvas");h.width=256,h.height=256;let u=h.getContext("2d");u.clearRect(0,0,h.width,h.height),u.shadowColor=jn(c.shadow,e?.34:.24),u.shadowBlur=e?22:13,u.shadowOffsetY=e?9:6,Uy(u,n,c,i),s&&(u.save(),Xd(u,120,128),u.clip(),u.globalAlpha=t==="locked_unknown"?.74:t==="hinted"?.72:1,u.drawImage(s,0,0,256,256),u.globalCompositeOperation="multiply",u.globalAlpha=t==="locked_unknown"?.16:t==="hinted"?.1:0,u.fillStyle=t==="locked_unknown"?"#3b3228":"#fff8e8",u.fillRect(0,0,256,256),u.restore()),u.shadowColor="transparent",u.shadowBlur=0,u.shadowOffsetY=0;let f=u.createRadialGradient(82,62,12,128,128,130);f.addColorStop(0,"rgba(255, 248, 232, 0.20)"),f.addColorStop(.64,jn(c.fogOverlay,t==="locked_unknown"?.22:t==="hinted"?.1:0)),f.addColorStop(1,jn(c.shadow,t==="locked_unknown"?.18:t==="hinted"?.12:0)),u.fillStyle=f,u.beginPath(),Sn(120).forEach((p,g)=>{let y=128+p.x,m=128+p.y;g===0?u.moveTo(y,m):u.lineTo(y,m)}),u.closePath(),u.fill(),u.strokeStyle=jn(e?c.rim:c.line,e?.98:.36),u.lineWidth=e?13:5,u.beginPath(),Sn(116).forEach((p,g)=>{let y=128+p.x,m=128+p.y;g===0?u.moveTo(y,m):u.lineTo(y,m)}),u.closePath(),u.stroke(),t==="hinted"&&(u.setLineDash([12,10]),u.strokeStyle="rgba(46, 27, 14, 0.36)",u.lineWidth=5,u.stroke(),u.setLineDash([]));let d=new je(h);return d.colorSpace=De,d.minFilter=ce,d.magFilter=ce,le.set(o,d),d}function ky(n={},e=!1){let t=Wd(n),i=String(n.fogState||"locked_unknown"),r=`expedition-marker:${Gt}:${t}:${i}:${e?"selected":"idle"}`;if(le.has(r))return le.get(r);let s=document.createElement("canvas");s.width=192,s.height=192;let a=s.getContext("2d"),o=ah(n,e);a.clearRect(0,0,s.width,s.height),a.fillStyle="rgba(22, 18, 13, 0.22)",a.beginPath(),a.ellipse(96,154,54,16,0,0,Math.PI*2),a.fill();let c=String(n.kind||""),h=String(n.status||"");a.fillStyle=i==="locked_unknown"?"rgba(46, 39, 32, 0.92)":i==="hinted"?"rgba(209, 154, 72, 0.94)":c==="origin_plot"?"rgba(255, 226, 128, 0.98)":h.includes("SITE_PLAN")?"rgba(154, 225, 216, 0.96)":jn(o.rim,.94),a.strokeStyle=jn(o.line,.92),a.lineWidth=e?10:7,a.beginPath(),a.arc(96,84,48,0,Math.PI*2),a.fill(),a.stroke(),a.beginPath(),a.moveTo(96,138),a.lineTo(75,112),a.lineTo(117,112),a.closePath(),a.fill(),a.stroke(),a.fillStyle=i==="locked_unknown"||i==="hinted"?"#fff8e8":"#2e1b0e",a.font="800 34px Georgia, serif",a.textAlign="center",a.textBaseline="middle",a.fillText(t.length>3?t.slice(0,3):t,96,84);let u=new je(s);return u.colorSpace=De,u.minFilter=ce,u.magFilter=ce,le.set(r,u),u}function By(n={},e=!1,t=!1){let i=Wd(n),r=String(n.fogState||""),s=["MAP","SITE"].includes(i)&&!["locked_unknown","hinted"].includes(r);return s&&!e&&!t?{visible:!1,opacity:0,scale:0}:s?{visible:!0,opacity:t?.18:.12,scale:e?.32:.26}:r==="locked_unknown"?{visible:!0,opacity:e?.62:.5,scale:e?.44:.34}:r==="hinted"?{visible:!0,opacity:e?.66:.54,scale:e?.48:.36}:{visible:!0,opacity:e?.84:.7,scale:e?.56:.42}}function Yd(n={}){return String(n.cellId||n.receiptLink?.cellId||n.sourceIds?.cellId||"").trim()}function Hy(n={}){return(Array.isArray(n?.eventPackets)?n.eventPackets:[]).filter(e=>e&&typeof e=="object"&&e.packetId&&Yd(e))}function zy(n={},e=!1){let t=String(n.packetId||"packet"),i=String(n.templateId||n.kind||"event_packet"),r=`expedition-event-marker:${Gt}:${t}:${i}:${e?"selected":"idle"}`;if(le.has(r))return le.get(r);let s=document.createElement("canvas");s.width=192,s.height=192;let a=s.getContext("2d");a.clearRect(0,0,s.width,s.height),a.fillStyle="rgba(46, 27, 14, 0.22)",a.beginPath(),a.ellipse(96,150,48,14,0,0,Math.PI*2),a.fill(),a.fillStyle=e?"rgba(255, 248, 232, 0.94)":"rgba(255, 248, 232, 0.84)",a.strokeStyle=e?"#f5d484":"#8a6d41",a.lineWidth=e?8:6,a.beginPath(),a.roundRect(52,48,88,78,12),a.fill(),a.stroke(),a.strokeStyle="#1b6a64",a.lineWidth=6,a.lineJoin="round",a.beginPath(),a.moveTo(56,60),a.lineTo(96,92),a.lineTo(136,60),a.stroke(),a.fillStyle="#d19a48",a.strokeStyle="#5a3418",a.lineWidth=5,a.beginPath(),a.arc(122,116,17,0,Math.PI*2),a.fill(),a.stroke(),a.fillStyle="#82d6d0",a.globalAlpha=e?.82:.58,a.beginPath(),a.arc(62,42,8,0,Math.PI*2),a.fill(),a.globalAlpha=1,ch(a,Gi.event_packet,42,34,108,108,16);let o=new je(s);return o.colorSpace=De,o.minFilter=ce,o.magFilter=ce,le.set(r,o),o}function Vy(n={},e=!1){let t=String(n.mode||"inspect"),i=`expedition-objective-marker:${Gt}:${t}:${n.targetCellId||""}:${e?"selected":"idle"}`;if(le.has(i))return le.get(i);let r=document.createElement("canvas");r.width=192,r.height=192;let s=r.getContext("2d");s.clearRect(0,0,r.width,r.height);let a=t==="scout"?"rgba(245, 212, 132, 0.40)":t==="packet"?"rgba(130, 214, 208, 0.38)":"rgba(255, 248, 232, 0.30)",o=t==="scout"?"#d19a48":t==="packet"?"#1b6a64":"#8a6d41";s.fillStyle=a,s.beginPath(),s.arc(96,88,e?68:58,0,Math.PI*2),s.fill(),s.fillStyle="rgba(46, 27, 14, 0.22)",s.beginPath(),s.ellipse(96,150,52,15,0,0,Math.PI*2),s.fill(),s.fillStyle=o,s.strokeStyle=e?"#fff8e8":"#5a3418",s.lineWidth=e?9:6,s.beginPath(),s.arc(96,82,38,0,Math.PI*2),s.fill(),s.stroke(),s.strokeStyle="#fff8e8",s.fillStyle="#fff8e8",s.lineWidth=8,s.lineCap="round",s.lineJoin="round",t==="scout"?(s.beginPath(),s.arc(96,82,20,0,Math.PI*2),s.moveTo(96,48),s.lineTo(96,61),s.moveTo(96,103),s.lineTo(96,118),s.moveTo(62,82),s.lineTo(75,82),s.moveTo(117,82),s.lineTo(130,82),s.stroke(),s.beginPath(),s.moveTo(96,58),s.lineTo(108,86),s.lineTo(84,106),s.closePath(),s.fill()):t==="packet"?(s.beginPath(),s.roundRect(72,60,48,44,7),s.moveTo(76,69),s.lineTo(96,86),s.lineTo(116,69),s.stroke()):(s.beginPath(),s.moveTo(72,116),s.lineTo(96,52),s.lineTo(120,116),s.stroke(),s.beginPath(),s.arc(96,56,12,0,Math.PI*2),s.fill()),ch(s,t==="packet"?Gi.event_packet:Gi.objective_beacon,42,28,108,108,18);let c=new je(r);return c.colorSpace=De,c.minFilter=ce,c.magFilter=ce,le.set(i,c),c}function Gy(n="edge"){let e=`expedition-fog:${Gt}:${n}`;if(le.has(e))return le.get(e);let t=document.createElement("canvas");t.width=512,t.height=512;let i=t.getContext("2d"),r=i.createRadialGradient(242,238,38,256,256,250);r.addColorStop(0,n==="locked"?"rgba(135, 129, 112, 0.34)":"rgba(228, 133, 38, 0.46)"),r.addColorStop(.5,n==="locked"?"rgba(116, 108, 92, 0.38)":"rgba(238, 184, 86, 0.42)"),r.addColorStop(.8,n==="locked"?"rgba(78, 70, 58, 0.22)":"rgba(255, 230, 158, 0.22)"),r.addColorStop(1,"rgba(255, 248, 232, 0)"),i.fillStyle=r,i.fillRect(0,0,t.width,t.height),i.strokeStyle=n==="locked"?"rgba(255, 248, 232, 0.18)":"rgba(255, 248, 232, 0.26)",i.lineWidth=8,i.lineCap="round";for(let a=0;a<7;a+=1){let o=104+a*42;i.beginPath(),i.moveTo(30,o),i.bezierCurveTo(130,o-28,262,o+36,480,o-20),i.stroke()}i.save(),i.globalCompositeOperation="multiply",i.strokeStyle=n==="locked"?"rgba(57, 49, 40, 0.18)":"rgba(124, 91, 48, 0.18)",i.lineWidth=3;for(let a=0;a<5;a+=1)i.beginPath(),i.ellipse(254,242+a*5,188-a*22,122-a*13,-.14,0,Math.PI*2),i.stroke();i.restore(),n!=="locked"&&(i.setLineDash([18,16]),i.strokeStyle="rgba(101, 74, 28, 0.24)",i.lineWidth=5,i.beginPath(),i.ellipse(256,256,164,112,-.16,0,Math.PI*2),i.stroke(),i.setLineDash([]));let s=new je(t);return s.colorSpace=De,s.minFilter=ce,s.magFilter=ce,le.set(e,s),s}function Wy(n,e,t){n.save(),n.globalCompositeOperation="multiply",n.lineCap="round",n.strokeStyle="rgba(46, 27, 14, 0.07)",n.lineWidth=3;for(let i=-1;i<11;i+=1){let r=62+i*58;n.beginPath(),n.moveTo(-70,r),n.bezierCurveTo(124,r-54,282,r+48,474,r-18),n.bezierCurveTo(650,r-78,814,r+40,e+80,r-36),n.stroke()}n.strokeStyle="rgba(27, 106, 100, 0.08)",n.lineWidth=2;for(let i=-2;i<9;i+=1){let r=112+i*128;n.beginPath(),n.moveTo(r,-50),n.bezierCurveTo(r+88,92,r-78,222,r+74,362),n.bezierCurveTo(r+202,480,r-62,546,r+138,t+52),n.stroke()}n.restore(),n.save(),n.strokeStyle="rgba(255, 248, 232, 0.26)",n.lineWidth=2;for(let i=0;i<5;i+=1){let r=610+i*80,s=118+i%2*74;n.beginPath(),n.ellipse(r,s,84+i*10,38+i*4,-.18,0,Math.PI*2),n.stroke()}n.restore()}function Xy(n="soft"){let e=`expedition-edge-fog:${Gt}:${n}`;if(le.has(e))return le.get(e);let t=document.createElement("canvas");t.width=1024,t.height=256;let i=t.getContext("2d"),r=i.createLinearGradient(0,0,t.width,0);r.addColorStop(0,"rgba(255, 248, 232, 0)"),r.addColorStop(.28,n==="locked"?"rgba(43, 35, 27, 0.30)":"rgba(234, 219, 184, 0.24)"),r.addColorStop(.52,n==="locked"?"rgba(43, 35, 27, 0.54)":"rgba(255, 248, 232, 0.50)"),r.addColorStop(.76,n==="locked"?"rgba(43, 35, 27, 0.30)":"rgba(27, 106, 100, 0.18)"),r.addColorStop(1,"rgba(255, 248, 232, 0)"),i.fillStyle=r,i.fillRect(0,0,t.width,t.height),i.strokeStyle=n==="locked"?"rgba(255, 248, 232, 0.14)":"rgba(255, 248, 232, 0.32)",i.lineWidth=2;for(let a=0;a<12;a+=1){let o=28+a*17;i.beginPath(),i.moveTo(0,o),i.bezierCurveTo(240,o-30,510,o+36,1024,o-18),i.stroke()}i.save(),i.setLineDash([20,14]),i.strokeStyle=n==="locked"?"rgba(255, 248, 232, 0.10)":"rgba(101, 74, 28, 0.22)",i.lineWidth=6,i.beginPath(),i.moveTo(34,132),i.bezierCurveTo(254,74,534,182,990,112),i.stroke(),i.restore();let s=new je(t);return s.colorSpace=De,s.minFilter=ce,s.magFilter=ce,le.set(e,s),s}function Yy(){let n=`expedition-map-base:${Gt}:${Ns}`;if(le.has(n))return le.get(n);let e=document.createElement("canvas");e.width=1024,e.height=640;let t=e.getContext("2d"),i=t.createLinearGradient(0,0,e.width,e.height);i.addColorStop(0,"#f4dfad"),i.addColorStop(.28,"#d8b979"),i.addColorStop(.62,"#b88755"),i.addColorStop(1,"#5b3a22"),t.fillStyle=i,t.fillRect(0,0,e.width,e.height),Wy(t,e.width,e.height),t.fillStyle="rgba(89, 114, 69, 0.08)";for(let a=0;a<9;a+=1){let o=-60+a*140;t.beginPath(),t.ellipse(o,470+a%3*18,148,45,-.12,0,Math.PI*2),t.fill()}t.strokeStyle="rgba(84, 55, 24, 0.17)",t.lineWidth=15,t.lineCap="round",t.beginPath(),t.moveTo(-70,452),t.bezierCurveTo(112,385,247,507,399,423),t.bezierCurveTo(552,339,709,440,1094,305),t.stroke(),t.strokeStyle="rgba(255, 233, 175, 0.18)",t.lineWidth=4,t.stroke(),t.fillStyle="rgba(86, 95, 48, 0.08)";for(let a=0;a<68;a+=1){let o=a*83%e.width,c=a*131%e.height,h=28+a*17%74;t.beginPath(),t.ellipse(o,c,h*1.4,h,a%5*.3,0,Math.PI*2),t.fill()}t.strokeStyle="rgba(92, 65, 39, 0.20)",t.lineWidth=6;for(let a=0;a<7;a+=1){let o=102+a*48;t.beginPath(),t.moveTo(554,o),t.bezierCurveTo(615,o-42,706,o+34,804,o-22),t.bezierCurveTo(873,o-60,946,o+11,1070,o-44),t.stroke()}t.strokeStyle="rgba(46, 27, 14, 0.13)",t.lineWidth=2.5;for(let a=54;a<e.height;a+=56)t.beginPath(),t.moveTo(-30,a),t.bezierCurveTo(150,a-36,280,a+42,470,a-8),t.bezierCurveTo(650,a-56,780,a+34,e.width+40,a-22),t.stroke();t.strokeStyle="rgba(67, 114, 116, 0.08)",t.lineWidth=2;for(let a=-70;a<e.width+90;a+=78)t.beginPath(),t.moveTo(a,-20),t.bezierCurveTo(a+120,160,a-90,350,a+140,e.height+30),t.stroke();t.save(),t.setLineDash([18,13]),t.lineCap="round",t.strokeStyle="rgba(101, 74, 28, 0.20)",t.lineWidth=5,[[[-24,248],[122,197,236,277,366,217],[506,154,612,232,714,184],[810,138,916,174,1048,120]],[[424,-20],[500,92,444,198,548,292],[646,382,586,478,742,676]],[[138,636],[226,512,336,564,430,452],[526,336,636,408,760,314],[862,236,930,284,1050,226]]].forEach(a=>{t.beginPath(),t.moveTo(a[0][0],a[0][1]);for(let o=1;o<a.length;o+=1){let c=a[o];t.bezierCurveTo(c[0],c[1],c[2],c[3],c[4],c[5])}t.stroke()}),t.strokeStyle="rgba(255, 248, 232, 0.50)",t.lineWidth=3,[[[-24,248],[122,197,236,277,366,217],[506,154,612,232,714,184],[810,138,916,174,1048,120]],[[424,-20],[500,92,444,198,548,292],[646,382,586,478,742,676]],[[138,636],[226,512,336,564,430,452],[526,336,636,408,760,314],[862,236,930,284,1050,226]]].forEach(a=>{t.beginPath(),t.moveTo(a[0][0],a[0][1]);for(let o=1;o<a.length;o+=1){let c=a[o];t.bezierCurveTo(c[0],c[1],c[2],c[3],c[4],c[5])}t.stroke()}),t.restore(),t.save(),t.globalCompositeOperation="multiply",t.strokeStyle="rgba(46, 27, 14, 0.12)",t.lineWidth=2;for(let a=34;a<e.height;a+=34)nh(t,42,a,270,.11),nh(t,676,a+10,250,.09);t.restore(),t.save(),t.globalCompositeOperation="multiply",t.fillStyle="rgba(134, 78, 34, 0.20)",t.fillRect(0,0,e.width,e.height),t.globalCompositeOperation="screen",t.fillStyle="rgba(255, 221, 150, 0.13)",t.fillRect(0,0,e.width,e.height),t.restore(),t.save(),t.globalAlpha=.72,ih(t,170,436,.86),al(t,780,180,.84,"rgba(27, 106, 100, 0.58)"),al(t,332,222,.58,"rgba(101, 74, 28, 0.52)"),t.restore(),t.strokeStyle="rgba(101, 74, 28, 0.18)",t.lineWidth=2,t.setLineDash([12,10]),t.strokeRect(28,28,e.width-56,e.height-56),t.setLineDash([]);let r=t.createRadialGradient(e.width*.48,e.height*.46,80,e.width*.48,e.height*.46,590);r.addColorStop(0,"rgba(255, 248, 232, 0.12)"),r.addColorStop(.74,"rgba(255, 248, 232, 0)"),r.addColorStop(1,"rgba(46, 27, 14, 0.28)"),t.fillStyle=r,t.fillRect(0,0,e.width,e.height);let s=new je(e);return s.colorSpace=De,s.wrapS=Jt,s.wrapT=Jt,s.minFilter=ce,s.magFilter=ce,le.set(n,s),s}function qd(n={}){let e=n.bounds||{minX:-1,maxX:1,minY:-1,maxY:1,centerX:0,centerY:0,width:2,height:2},t=vn*1.72,i=e.minX-t,r=e.maxX+t,s=e.minY-t,a=e.maxY+t;return{minX:i,maxX:r,minY:s,maxY:a,centerX:(i+r)/2,centerY:(s+a)/2,width:Math.max(.01,r-i),height:Math.max(.01,a-s)}}function qy(n={x:0,y:0},e,t){return{x:(n.x-e.minX)/Math.max(.01,e.width)*t.width,y:t.height-(n.y-e.minY)/Math.max(.01,e.height)*t.height}}function tl(n={},e=Qn(n)){let t=String(n.fogState||"locked_unknown");return wi(n)?e==="forest"?{terrain:e,fill:"rgba(79, 105, 57, 0.34)",mid:"rgba(142, 142, 76, 0.22)",edge:"rgba(255, 248, 232, 0)",contour:"rgba(56, 72, 42, 0.18)",bridge:"rgba(91, 105, 62, 0.18)",fogOnly:!1}:e==="ridge"||e==="ruin_signal"?{terrain:e,fill:"rgba(128, 91, 58, 0.40)",mid:"rgba(201, 157, 96, 0.24)",edge:"rgba(255, 248, 232, 0)",contour:"rgba(74, 50, 31, 0.20)",bridge:"rgba(135, 88, 49, 0.19)",fogOnly:!1}:e==="water"?{terrain:e,fill:"rgba(60, 125, 143, 0.30)",mid:"rgba(126, 183, 185, 0.20)",edge:"rgba(255, 248, 232, 0)",contour:"rgba(36, 83, 102, 0.17)",bridge:"rgba(65, 126, 139, 0.17)",fogOnly:!1}:e==="settled"?{terrain:e,fill:"rgba(205, 158, 80, 0.38)",mid:"rgba(167, 118, 65, 0.22)",edge:"rgba(255, 248, 232, 0)",contour:"rgba(92, 61, 28, 0.18)",bridge:"rgba(178, 127, 64, 0.18)",fogOnly:!1}:{terrain:e,fill:"rgba(174, 139, 75, 0.30)",mid:"rgba(218, 179, 103, 0.20)",edge:"rgba(255, 248, 232, 0)",contour:"rgba(96, 70, 39, 0.15)",bridge:"rgba(157, 112, 62, 0.16)",fogOnly:!1}:t==="hinted"?{terrain:"hinted",fill:"rgba(178, 121, 57, 0.38)",mid:"rgba(224, 180, 105, 0.28)",edge:"rgba(255, 248, 232, 0)",contour:"rgba(93, 65, 32, 0.18)",bridge:"rgba(177, 113, 47, 0.16)",fogOnly:!0}:{terrain:"locked_unknown",fill:"rgba(116, 101, 82, 0.32)",mid:"rgba(74, 64, 54, 0.22)",edge:"rgba(255, 248, 232, 0)",contour:"rgba(231, 204, 150, 0.12)",bridge:"rgba(98, 88, 75, 0.13)",fogOnly:!0}}function $y(n,e,t,i,r=0){let s=(e.x+t.x)/2,a=(e.y+t.y)/2,o=22+r*26;n.save(),n.filter="blur(13px)",n.lineCap="round",n.strokeStyle=i.bridge,n.lineWidth=104,n.beginPath(),n.moveTo(e.x,e.y),n.quadraticCurveTo(s,a-o,t.x,t.y),n.stroke(),n.restore()}function Zy(n,e,t,i,r=0){n.save();let s=n.createRadialGradient(e.x-t*.22,e.y-t*.24,t*.08,e.x,e.y,t);s.addColorStop(0,i.fill),s.addColorStop(.54,i.mid),s.addColorStop(1,i.edge),n.filter="blur(9px)",n.fillStyle=s,n.beginPath(),n.arc(e.x,e.y,t,0,Math.PI*2),n.fill(),n.restore(),n.save(),n.translate(e.x,e.y),n.rotate((r-.5)*.26),n.scale(1.28,.82),n.strokeStyle=i.contour,n.lineWidth=5,n.lineCap="round";for(let a=-2;a<=2;a+=1){let o=a*t*.18;n.beginPath(),n.moveTo(-t*.78,o),n.bezierCurveTo(-t*.34,o-t*.17,t*.18,o+t*.16,t*.76,o-t*.08),n.stroke()}i.fogOnly&&(n.setLineDash([15,13]),n.strokeStyle=i.terrain==="locked_unknown"?"rgba(255, 248, 232, 0.14)":"rgba(101, 74, 28, 0.22)",n.lineWidth=4,n.beginPath(),n.ellipse(0,0,t*.58,t*.34,-.08,0,Math.PI*2),n.stroke()),n.restore()}function Ky(n=[],e=Gd(n)){let t=cl(Hd),i=n.map(f=>`${f.cellId}:${f.fogState}:${Qn(f)}:${f.publicTerrainAssetSlot||""}:${f.fogAssetSlot||""}`).join("|"),r=`expedition-continuous-underlay:${Gt}:${Ns}:${i}:${t?"promoted-underlay-ready":"promoted-underlay-pending"}`;if(le.has(r))return le.get(r);let s=document.createElement("canvas");s.width=1024,s.height=768;let a=s.getContext("2d"),o=qd(e),c=new Map;for(let f of n){let d=e.positions.get(String(f.cellId||""));d&&c.set(String(f.cellId||""),qy(d,o,s))}a.clearRect(0,0,s.width,s.height),a.fillStyle="rgba(255, 248, 232, 0.04)",a.fillRect(0,0,s.width,s.height),t&&(a.save(),a.globalAlpha=.42,a.drawImage(t,0,0,s.width,s.height),a.globalCompositeOperation="screen",a.globalAlpha=.12,a.fillStyle="rgba(255, 231, 172, 0.68)",a.fillRect(0,0,s.width,s.height),a.restore());for(let f=0;f<n.length;f+=1)for(let d=f+1;d<n.length;d+=1){let p=n[f],g=n[d];if(!hh(p,g))continue;let y=c.get(String(p.cellId||"")),m=c.get(String(g.cellId||""));if(!y||!m)continue;let l=tl(p),b=tl(g),v=l.terrain==="locked_unknown"||b.terrain==="locked_unknown"?{bridge:"rgba(134, 126, 111, 0.12)"}:{bridge:l.fogOnly?l.bridge:b.fogOnly?b.bridge:"rgba(153, 102, 56, 0.16)"};$y(a,y,m,v,rl(`${p.cellId}:${g.cellId}:underlay`))}let h=Math.min(s.width/o.width,s.height/o.height);for(let f of n){let d=c.get(String(f.cellId||""));if(!d)continue;let p=Qn(f),g=tl(f,p),y=h*vn*(g.fogOnly?1.28:1.38);Zy(a,d,y,g,rl(`${f.cellId}:${p}:underlay`))}a.save(),a.globalCompositeOperation="multiply",a.strokeStyle="rgba(46, 27, 14, 0.06)",a.lineWidth=2;for(let f=42;f<s.height;f+=36)a.beginPath(),a.moveTo(-40,f),a.bezierCurveTo(150,f-24,298,f+28,482,f-8),a.bezierCurveTo(648,f-42,818,f+22,s.width+40,f-16),a.stroke();a.restore(),a.save(),a.globalCompositeOperation="multiply",a.fillStyle="rgba(150, 88, 39, 0.18)",a.fillRect(0,0,s.width,s.height),a.globalCompositeOperation="screen",a.fillStyle="rgba(255, 221, 153, 0.12)",a.fillRect(0,0,s.width,s.height),a.restore();let u=new je(s);return u.colorSpace=De,u.minFilter=ce,u.magFilter=ce,le.set(r,u),u}function Jy(){let n=`expedition-civic-beacon:${Gt}`;if(le.has(n))return le.get(n);let e=document.createElement("canvas");e.width=256,e.height=256;let t=e.getContext("2d");t.clearRect(0,0,e.width,e.height);let i=t.createRadialGradient(128,126,16,128,126,116);i.addColorStop(0,"rgba(245, 212, 132, 0.48)"),i.addColorStop(.48,"rgba(27, 106, 100, 0.18)"),i.addColorStop(1,"rgba(255, 248, 232, 0)"),t.fillStyle=i,t.fillRect(0,0,e.width,e.height),t.strokeStyle="rgba(46, 27, 14, 0.42)",t.lineWidth=9,t.lineCap="round",t.beginPath(),t.moveTo(128,174),t.lineTo(128,80),t.stroke(),t.strokeStyle="rgba(27, 106, 100, 0.42)",t.lineWidth=5;for(let s=0;s<3;s+=1)t.beginPath(),t.arc(128,83,30+s*22,-.78,.78),t.stroke();t.fillStyle="rgba(245, 212, 132, 0.86)",t.strokeStyle="rgba(46, 27, 14, 0.44)",t.lineWidth=5,t.beginPath(),t.moveTo(136,76),t.lineTo(188,94),t.lineTo(136,116),t.closePath(),t.fill(),t.stroke(),t.fillStyle="rgba(255, 248, 232, 0.54)",t.beginPath(),t.roundRect(91,174,74,25,8),t.fill();let r=new je(e);return r.colorSpace=De,r.minFilter=ce,r.magFilter=ce,le.set(n,r),r}function jy(n={},e={x:0,y:0},t=!1,i=!1){let r=ah(n,t),s=String(n.fogState||""),a=Qn(n),o=new mn;o.position.set(e.x,e.y,0);let c=vn*(t?1.04:i?1.02:1),h=new dt(Id(c),new Ot({color:16777215,map:Dd(n,t),transparent:!0,opacity:Ay(s,t,i),side:Bt,depthWrite:!1}));h.position.z=-.1,h.userData={kind:"expedition_cell",cellId:String(n.cellId||""),fogState:String(n.fogState||""),terrain:a,regionPlate:!0,waterCue:a==="water",status:String(n.status||""),title:String(n.title||""),selected:t,hovered:i},o.add(h);let u=new In(new et().setFromPoints(Sn(c*1.01)),new Ft({color:t?r.rim:r.line,transparent:!0,opacity:Ry(s,t,i)}));u.position.z=-.04,o.add(u);let f=new dt(Rd(Wi*1.16),new Ot({color:r.shadow,transparent:!0,opacity:t?.18:.08,side:Bt,depthWrite:!1}));f.position.set(.08,-.09,-.01),o.add(f);let d=new dt(Id(Wi),new Ot({color:16777215,map:Dd(n,t),transparent:!0,opacity:Cy(r,s,t,i),side:Bt,depthWrite:!1}));d.position.z=.02,d.userData={kind:"expedition_cell",cellId:String(n.cellId||""),fogState:String(n.fogState||""),terrain:a,waterCue:a==="water",status:String(n.status||""),title:String(n.title||""),selected:t,hovered:i},o.add(d);let p=new In(new et().setFromPoints(Sn(Wi*(t?1.08:1))),new Ft({color:r.line,transparent:!0,opacity:Iy(r,s,t,i)}));if(p.position.z=.08,o.add(p),t){let y=new In(new et().setFromPoints(Sn(c*1.08)),new Ft({color:r.rim,transparent:!0,opacity:.82}));y.position.z=.16,o.add(y)}if(i&&!t){let y=new In(new et().setFromPoints(Sn(c*1.04)),new Ft({color:16775400,transparent:!0,opacity:.7}));y.position.z=.15,o.add(y)}if(s==="discovered"&&a==="settled"){let y=new In(new et().setFromPoints(Sn(c*1.14)),new Ft({color:16774340,transparent:!0,opacity:.44}));y.position.z=.14,o.add(y);let m=new dt(Rd(c*1.02),new Ot({color:16774340,transparent:!0,opacity:.07,side:Bt,depthWrite:!1}));m.position.z=.07,o.add(m)}if(s==="locked_unknown"){let y=new Sr(new et().setFromPoints([new R(-.32,-.3,.1),new R(.32,.3,.1),new R(-.34,.02,.1),new R(.12,.46,.1),new R(-.1,-.46,.1),new R(.34,-.02,.1)]),new Ft({color:16775400,transparent:!0,opacity:.16}));o.add(y)}if(s==="hinted"&&String(n.kind||"")==="frontier_hint"){let y=new In(new et().setFromPoints(Sn(c*1.03)),new Ft({color:1796708,transparent:!0,opacity:.64}));y.position.z=.12,o.add(y)}let g=By(n,t,i);if(g.visible){let y=new xt(new pt({map:ky(n,t),transparent:!0,depthTest:!0,depthWrite:!1,alphaTest:.03,opacity:g.opacity}));y.position.set(0,t?.03:-.01,.2),y.scale.set(g.scale,g.scale,1),o.add(y)}return o}function hh(n={},e={}){let t=ie(n.q,0),i=ie(n.r,0),r=ie(e.q,0),s=ie(e.r,0),a=t-r,o=i-s;return Math.max(Math.abs(a),Math.abs(o),Math.abs(a+o))===1}function Qy(n={},e={}){let t=[String(n.fogState||""),String(e.fogState||"")];return t.includes("locked_unknown")?null:t.includes("hinted")?{color:9071937,glow:16110724,opacity:.34,dash:[.16,.16]}:{color:1796708,glow:16110724,opacity:.5,dash:[.18,.13]}}function ex(n,e,t){let i=Qy(n,e);if(!i)return null;let r=t.positions.get(String(n.cellId||"")),s=t.positions.get(String(e.cellId||""));if(!r||!s)return null;let a=new R((r.x+s.x)/2,(r.y+s.y)/2,-.2),o=.08+rl(`${n.cellId}:${e.cellId}`)*.1,c=new fi(new R(r.x,r.y,-.2),new R(a.x,a.y+o,-.2),new R(s.x,s.y,-.2)),h=new et().setFromPoints(c.getPoints(32)),u=new cn(h,new Ui({color:i.color,transparent:!0,opacity:i.opacity,dashSize:i.dash[0],gapSize:i.dash[1]}));u.computeLineDistances(),u.userData={kind:"expedition_receipt_trace",routeAuthority:!1,visualOnly:!0};let f=new cn(h.clone(),new Ft({color:i.glow,transparent:!0,opacity:.14}));f.position.z=-.02,f.userData={kind:"expedition_receipt_trace_glow",routeAuthority:!1,visualOnly:!0};let d=new mn;return d.add(f,u),d.userData={kind:"expedition_receipt_trace_group",routeAuthority:!1,visualOnly:!0},d}function $d(n={}){switch(String(n.unitType||n.role||"").toLowerCase()){case"scout":return{fill:"#1f756e",stroke:"#102f2f",accent:"#d6f1ef",glow:"#f5d484",glyph:"compass"};case"courier":return{fill:"#b95368",stroke:"#4f202b",accent:"#fff0bd",glow:"#78a9d6",glyph:"flag"};case"surveyor":return{fill:"#7a6540",stroke:"#342719",accent:"#d6f1ef",glow:"#82d6d0",glyph:"tripod"};case"settler_convoy":return{fill:"#c4883a",stroke:"#5a3418",accent:"#fff8e8",glow:"#f5d484",glyph:"wagon"};case"outpost_crew":return{fill:"#637f58",stroke:"#223a25",accent:"#ffe4a0",glow:"#82d6d0",glyph:"beacon"};default:return{fill:"#8a6d41",stroke:"#3b2513",accent:"#fff8e8",glow:"#82d6d0",glyph:"ledger"}}}function tx(n={},e=!1){let t=`expedition-unit:${Gt}:${n.unitType}:${n.unitId}:${e?"selected":"idle"}`;if(le.has(t))return le.get(t);let i=$d(n),r=document.createElement("canvas");r.width=192,r.height=192;let s=r.getContext("2d");s.clearRect(0,0,r.width,r.height),s.fillStyle="rgba(46, 27, 14, 0.24)",s.beginPath(),s.ellipse(96,146,55,18,0,0,Math.PI*2),s.fill(),s.fillStyle=e?"rgba(245, 212, 132, 0.34)":"rgba(255, 248, 232, 0.20)",s.strokeStyle=e?"#f5d484":"rgba(59, 37, 19, 0.55)",s.lineWidth=e?9:6,s.beginPath(),s.roundRect(38,30,116,116,34),s.fill(),s.stroke(),s.fillStyle=i.fill,s.strokeStyle=i.stroke,s.lineWidth=8,s.beginPath(),s.arc(96,88,42,0,Math.PI*2),s.fill(),s.stroke(),s.strokeStyle=i.accent,s.fillStyle=i.accent,s.lineWidth=8,s.lineCap="round",s.lineJoin="round",i.glyph==="compass"?(s.beginPath(),s.arc(96,88,24,0,Math.PI*2),s.moveTo(96,52),s.lineTo(96,66),s.moveTo(96,110),s.lineTo(96,124),s.moveTo(60,88),s.lineTo(74,88),s.moveTo(118,88),s.lineTo(132,88),s.stroke(),s.beginPath(),s.moveTo(96,58),s.lineTo(108,92),s.lineTo(84,118),s.closePath(),s.fill()):i.glyph==="flag"?(s.beginPath(),s.moveTo(80,122),s.lineTo(80,56),s.lineTo(124,68),s.lineTo(80,84),s.stroke()):i.glyph==="wagon"?(s.beginPath(),s.roundRect(66,80,60,34,9),s.stroke(),s.beginPath(),s.arc(78,124,9,0,Math.PI*2),s.arc(116,124,9,0,Math.PI*2),s.stroke()):i.glyph==="beacon"?(s.beginPath(),s.moveTo(72,124),s.lineTo(96,58),s.lineTo(120,124),s.stroke(),s.beginPath(),s.arc(96,62,15,0,Math.PI*2),s.fill()):i.glyph==="tripod"?(s.beginPath(),s.moveTo(96,58),s.lineTo(96,92),s.moveTo(96,92),s.lineTo(70,126),s.moveTo(96,92),s.lineTo(122,126),s.moveTo(76,70),s.lineTo(116,70),s.stroke(),s.beginPath(),s.arc(96,56,13,0,Math.PI*2),s.fill()):(s.beginPath(),s.roundRect(68,62,56,60,8),s.stroke(),s.beginPath(),s.moveTo(80,82),s.lineTo(112,82),s.moveTo(80,100),s.lineTo(106,100),s.stroke()),ch(s,sl(n),28,22,136,136,34),s.fillStyle=i.glow,s.globalAlpha=e?.8:.46,s.beginPath(),s.arc(136,47,e?8:6,0,Math.PI*2),s.fill(),s.globalAlpha=1;let a=new je(r);return a.colorSpace=De,a.minFilter=ce,a.magFilter=ce,le.set(t,a),a}function nx(n={}){return(Array.isArray(n.commandHints)?n.commandHints:[]).filter(e=>e?.enabled!==!1).length}function Ld(n=""){let e=String(n||"").replace(/^cell[_-]?/i,"").replace(/_/g," ").trim(),t=e.match(/q(-?\d+)/i)?.[1],i=e.match(/r(-?\d+)/i)?.[1];return t!=null&&i!=null?`Q${t} R${i}`:e?e.toUpperCase().slice(0,8):"MAP"}function Is(n={}){let e=String(n.displayName||"").trim();if(e){let i=e.split(/\s+/).filter(Boolean);return i.length>1?i.map(r=>r[0]).join("").slice(0,3).toUpperCase():e.slice(0,3).toUpperCase()}let t=String(n.unitType||"").replace(/_/g," ");return/settler/i.test(t)?"STL":/outpost/i.test(t)?"OUT":/surveyor/i.test(t)?"SRV":/courier/i.test(t)?"CR":/scout/i.test(t)?"SCT":"UNT"}function ix(n={},e=!1,t={}){let i=t?.sourceChrome===!0,r=sl(n),s=!!Nn(r),o=`expedition-hud-profile:${sn}:${i?"source-rail-portrait":"generated-frame"}:${n.unitId}:${n.unitType}:${s?"asset":"fallback"}:${e?"selected":"idle"}`;if(le.has(o))return le.get(o);let c=document.createElement("canvas");c.width=256,c.height=256;let h=c.getContext("2d"),u=$d(n);if(h.clearRect(0,0,c.width,c.height),i){let b=e?88:82;h.fillStyle="rgba(34, 20, 10, 0.32)",h.beginPath(),h.ellipse(128,190,70,17,0,0,Math.PI*2),h.fill();let v=h.createRadialGradient(90,62,10,128,122,108);v.addColorStop(0,"rgba(250, 233, 176, 0.98)"),v.addColorStop(.52,"rgba(193, 148, 77, 0.92)"),v.addColorStop(1,"rgba(55, 31, 15, 0.94)"),h.fillStyle=v,h.beginPath(),h.arc(128,122,b,0,Math.PI*2),h.fill(),h.save(),h.beginPath(),h.arc(128,122,b-9,0,Math.PI*2),h.clip();let _=Nn(r);if(_)h.drawImage(_,36,24,184,184);else{let C=h.createRadialGradient(104,70,14,128,122,92);C.addColorStop(0,u.accent),C.addColorStop(.52,u.fill),C.addColorStop(1,u.stroke),h.fillStyle=C,h.fillRect(36,24,184,184),h.fillStyle="rgba(255, 248, 232, 0.92)",h.font="900 54px Georgia, serif",h.textAlign="center",h.textBaseline="middle",h.fillText(Is(n),128,124,112)}h.globalCompositeOperation="multiply",h.fillStyle=e?"rgba(42, 23, 10, 0.04)":"rgba(42, 23, 10, 0.16)",h.fillRect(36,24,184,184),h.globalCompositeOperation="screen";let E=h.createLinearGradient(40,30,212,192);E.addColorStop(0,"rgba(255, 248, 232, 0.24)"),E.addColorStop(.45,"rgba(255, 248, 232, 0.04)"),E.addColorStop(1,"rgba(12, 33, 30, 0.00)"),h.fillStyle=E,h.fillRect(36,24,184,184),h.restore(),h.strokeStyle=e?"rgba(130, 214, 208, 0.92)":"rgba(245, 212, 132, 0.48)",h.lineWidth=e?8:4,h.beginPath(),h.arc(128,122,b-5,0,Math.PI*2),h.stroke(),e&&(h.strokeStyle="rgba(255, 248, 232, 0.88)",h.lineWidth=3,h.beginPath(),h.arc(128,122,b-16,-.85,Math.PI*1.45),h.stroke(),h.fillStyle="rgba(16, 111, 102, 0.92)",h.strokeStyle="rgba(245, 212, 132, 0.84)",h.lineWidth=4,h.beginPath(),h.moveTo(128,122+b-9),h.lineTo(139,122+b+6),h.lineTo(128,122+b+21),h.lineTo(117,122+b+6),h.closePath(),h.fill(),h.stroke());let T=new je(c);return T.colorSpace=De,T.minFilter=ce,T.magFilter=ce,le.set(o,T),T}h.fillStyle="rgba(4, 16, 15, 0.42)",h.beginPath(),h.ellipse(128,214,78,20,0,0,Math.PI*2),h.fill();let f=h.createRadialGradient(88,54,10,128,126,118);f.addColorStop(0,"rgba(255, 248, 232, 0.96)"),f.addColorStop(.38,e?"rgba(245, 212, 132, 0.96)":"rgba(130, 214, 208, 0.74)"),f.addColorStop(.74,e?"rgba(183, 142, 70, 0.92)":"rgba(27, 106, 100, 0.82)"),f.addColorStop(1,"rgba(46, 27, 14, 0.95)"),h.fillStyle=f,h.beginPath(),h.arc(128,122,92,0,Math.PI*2),h.fill(),h.save(),h.beginPath(),h.arc(128,122,69,0,Math.PI*2),h.clip();let d=Nn(r);if(d)h.drawImage(d,45,38,166,166);else{let m=h.createRadialGradient(110,76,16,128,126,82);m.addColorStop(0,u.accent),m.addColorStop(1,u.fill),h.fillStyle=m,h.fillRect(45,38,166,166),h.fillStyle=u.accent,h.font="900 54px Georgia, serif",h.textAlign="center",h.textBaseline="middle",h.fillText(Is(n),128,122,112)}h.globalCompositeOperation="multiply",h.fillStyle=e?"rgba(255, 248, 232, 0.03)":"rgba(12, 33, 30, 0.13)",h.fillRect(45,38,166,166),h.globalCompositeOperation="screen";let p=h.createLinearGradient(48,38,206,184);p.addColorStop(0,"rgba(255, 248, 232, 0.18)"),p.addColorStop(.55,"rgba(255, 248, 232, 0.02)"),p.addColorStop(1,"rgba(12, 33, 30, 0.00)"),h.fillStyle=p,h.fillRect(45,38,166,166),h.restore(),h.strokeStyle=e?"#f5d484":"rgba(255, 248, 232, 0.72)",h.lineWidth=e?10:7,h.beginPath(),h.arc(128,122,72,0,Math.PI*2),h.stroke(),h.strokeStyle="rgba(12, 33, 30, 0.62)",h.lineWidth=5,h.beginPath(),h.arc(128,122,90,-.84,Math.PI*1.38),h.stroke();for(let m=0;m<8;m+=1){let l=Math.PI*2*m/8;an(h,128+Math.cos(l)*88,122+Math.sin(l)*88,e?4.5:3.8,m%2===0)}let g=h.createLinearGradient(82,186,174,219);g.addColorStop(0,e?"rgba(255, 248, 232, 0.98)":"rgba(255, 248, 232, 0.92)"),g.addColorStop(1,e?"rgba(245, 212, 132, 0.92)":"rgba(130, 214, 208, 0.64)"),h.fillStyle=g,h.strokeStyle="rgba(46, 27, 14, 0.58)",h.lineWidth=4,h.beginPath(),h.roundRect(80,187,96,31,11),h.fill(),h.stroke(),h.fillStyle="#2e1b0e",h.font='900 18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',h.textAlign="center",h.textBaseline="middle",h.fillText(Is(n),128,203,74);let y=new je(c);return y.colorSpace=De,y.minFilter=ce,y.magFilter=ce,le.set(o,y),y}function rx(n={}){let e=n.objective&&typeof n.objective=="object"?n.objective:{},t=String(e.mode||"").toLowerCase();return t.includes("packet")?"PLAN":t.includes("review")?"REVIEW":t.includes("convoy")?"CONVOY":t.includes("settle")||t.includes("found")?"FOUND":t.includes("scout")?"SCOUT":e.targetCellId?"NEXT":"READY"}function Zd(n=""){let e=String(n||"");return e==="move_unit"?"\u21A6":e==="scout_sector"?"\u2316":e==="prepare_settler_convoy"?"\u25A3":e==="found_settlement"?"\u2302":/inspect/i.test(e)?"\u25C7":"\u2726"}function Kd(n={}){let e=String(n.commandId||"");return e==="move_unit"?"MOVE":e==="scout_sector"?"SCOUT":e==="prepare_settler_convoy"?"CONVOY":e==="found_settlement"?"FOUND":String(n.label||e||"CMD").replace(/_/g," ").trim().split(/\s+/).filter(Boolean).slice(0,2).join(" ").toUpperCase()||"CMD"}function sx(n={}){return(Array.isArray(n.commandHints)?n.commandHints:[]).filter(t=>t&&String(t.commandId||"").trim()).slice(0,5).map(t=>({commandId:String(t.commandId||""),enabled:t.enabled!==!1,glyph:Zd(t.commandId),label:Kd(t)}))}function an(n,e,t,i=7,r=!0){let s=n.createRadialGradient(e-i*.35,t-i*.45,1,e,t,i*1.18);s.addColorStop(0,r?"rgba(255, 248, 232, 0.95)":"rgba(245, 212, 132, 0.82)"),s.addColorStop(.45,"rgba(182, 151, 84, 0.92)"),s.addColorStop(1,"rgba(46, 27, 14, 0.86)"),n.fillStyle=s,n.beginPath(),n.arc(e,t,i,0,Math.PI*2),n.fill(),n.strokeStyle="rgba(12, 33, 30, 0.55)",n.lineWidth=Math.max(1.5,i*.24),n.stroke()}function Qo(n,e,t,i=.12){n.save(),n.globalAlpha=i;for(let r=0;r<120;r+=1){let s=(r*97+23)%e,a=(r*53+41)%t,o=1+r%3;n.fillStyle=r%2===0?"rgba(255, 248, 232, 0.55)":"rgba(12, 33, 30, 0.45)",n.fillRect(s,a,o,1)}n.restore()}function Jd(n,e,t,i=.18){n.save(),n.globalAlpha=i;for(let r=0;r<34;r+=1){let s=r*37%Math.max(1,t)+(r%3-1)*4,a=16+r%5*7;n.strokeStyle=r%2===0?"rgba(255, 214, 138, 0.42)":"rgba(32, 17, 9, 0.54)",n.lineWidth=1+r%4,n.beginPath(),n.moveTo(-20,s);for(let o=0;o<=e+40;o+=90)n.bezierCurveTo(o+20,s-a,o+64,s+a,o+90,s+(r%2?-5:5));n.stroke()}for(let r=0;r<80;r+=1){let s=(r*131+17)%e,a=(r*71+33)%t;n.fillStyle=r%3===0?"rgba(255, 248, 232, 0.32)":"rgba(18, 9, 4, 0.35)",n.fillRect(s,a,1+r%5,1)}n.restore()}function ol(n,e,t,i,r,s=18){n.beginPath(),n.moveTo(e+s,t+5),n.lineTo(e+i*.28,t+1),n.lineTo(e+i*.34,t+7),n.lineTo(e+i*.58,t+3),n.lineTo(e+i-s,t+8),n.quadraticCurveTo(e+i-3,t+8,e+i-5,t+s),n.lineTo(e+i-2,t+r*.38),n.lineTo(e+i-9,t+r*.45),n.lineTo(e+i-4,t+r-s),n.quadraticCurveTo(e+i-4,t+r-3,e+i-s,t+r-5),n.lineTo(e+i*.66,t+r-1),n.lineTo(e+i*.57,t+r-8),n.lineTo(e+i*.22,t+r-4),n.lineTo(e+s,t+r-9),n.quadraticCurveTo(e+3,t+r-8,e+7,t+r-s),n.lineTo(e+2,t+r*.54),n.lineTo(e+9,t+r*.47),n.lineTo(e+4,t+s),n.quadraticCurveTo(e+3,t+6,e+s,t+5),n.closePath()}function Ps(n,e,t,i,r="rgba(245, 212, 132, 0.78)"){n.save(),n.translate(e,t),n.strokeStyle=r,n.fillStyle=r,n.lineWidth=Math.max(2,i*.07),n.beginPath(),n.arc(0,0,i,0,Math.PI*2),n.stroke(),n.beginPath();for(let s=0;s<8;s+=1){let a=Math.PI*2*s/8,o=s%2===0?i*.88:i*.62;n.moveTo(Math.cos(a)*i*.22,Math.sin(a)*i*.22),n.lineTo(Math.cos(a)*o,Math.sin(a)*o)}n.stroke(),n.rotate(-.48),n.beginPath(),n.moveTo(0,-i*.72),n.lineTo(i*.16,0),n.lineTo(0,i*.34),n.lineTo(-i*.16,0),n.closePath(),n.fill(),n.restore()}function ax(n=""){let e=["crest-status","objective-loop","command-tray","command-puck","collapsed-ledger"].includes(n),t=["unit-dock","command-tray","command-puck"].includes(n),i=n==="selected-context";return{darkHardware:e,bottomHardware:t,parchment:i,wood:n==="unit-dock",outerA:i?"rgba(245, 224, 169, 0.98)":e?"rgba(6, 26, 25, 0.98)":"rgba(66, 36, 16, 0.96)",outerB:i?"rgba(219, 183, 118, 0.94)":e?"rgba(14, 68, 64, 0.96)":"rgba(114, 66, 28, 0.94)",outerC:i?"rgba(100, 61, 28, 0.78)":e?"rgba(29, 17, 10, 0.96)":"rgba(26, 12, 6, 0.98)",insetA:i?"rgba(255, 243, 202, 0.96)":e?"rgba(11, 51, 48, 0.84)":"rgba(94, 50, 20, 0.80)",insetB:i?"rgba(224, 190, 126, 0.88)":e?"rgba(18, 36, 32, 0.78)":"rgba(32, 16, 8, 0.74)",strokeA:"rgba(246, 209, 124, 0.90)",strokeB:i?"rgba(78, 44, 20, 0.54)":e?"rgba(130, 214, 208, 0.46)":"rgba(245, 212, 132, 0.38)",shadow:t?"rgba(0, 0, 0, 0.62)":"rgba(4, 16, 15, 0.42)",glow:e?"rgba(130, 214, 208, 0.52)":"rgba(245, 212, 132, 0.42)"}}function ox(n={}){let e=String(n.commandId||"command"),t=String(n.glyph||Zd(e)).slice(0,3),i=String(n.label||Kd(n)).toUpperCase().slice(0,10),r=n.enabled!==!1,s=`expedition-hud-command:${sn}:${e}:${r?"enabled":"disabled"}:${t}:${i}`;if(le.has(s))return le.get(s);let a=document.createElement("canvas");a.width=256,a.height=256;let o=a.getContext("2d");o.clearRect(0,0,a.width,a.height),o.fillStyle="rgba(4, 16, 15, 0.38)",o.beginPath(),o.ellipse(128,213,72,18,0,0,Math.PI*2),o.fill();let c=o.createRadialGradient(82,58,12,128,120,108);c.addColorStop(0,r?"rgba(255, 248, 232, 0.98)":"rgba(190, 184, 156, 0.72)"),c.addColorStop(.33,r?"rgba(245, 212, 132, 0.92)":"rgba(101, 113, 104, 0.62)"),c.addColorStop(.68,r?"rgba(27, 106, 100, 0.90)":"rgba(33, 48, 45, 0.74)"),c.addColorStop(1,"rgba(46, 27, 14, 0.92)"),o.fillStyle=c,o.beginPath(),o.arc(128,113,86,0,Math.PI*2),o.fill(),o.strokeStyle=r?"rgba(46, 27, 14, 0.76)":"rgba(46, 27, 14, 0.46)",o.lineWidth=11,o.beginPath(),o.arc(128,113,78,0,Math.PI*2),o.stroke(),o.strokeStyle=r?"rgba(255, 248, 232, 0.78)":"rgba(255, 248, 232, 0.36)",o.lineWidth=4,o.beginPath(),o.arc(128,113,64,0,Math.PI*2),o.stroke(),[60,196].forEach(f=>an(o,f,113,6,r)),o.fillStyle=r?"#fff8e8":"rgba(255, 248, 232, 0.56)",o.strokeStyle=r?"rgba(12, 33, 30, 0.72)":"rgba(12, 33, 30, 0.42)",o.lineWidth=8,o.textAlign="center",o.textBaseline="middle",o.shadowColor=r?"rgba(245, 212, 132, 0.38)":"transparent",o.shadowBlur=r?12:0,o.font="900 68px Georgia, serif",o.strokeText(t,128,108,116),o.fillText(t,128,108,116),o.shadowBlur=0;let h=o.createLinearGradient(54,176,202,212);h.addColorStop(0,r?"rgba(255, 248, 232, 0.96)":"rgba(190, 184, 156, 0.62)"),h.addColorStop(1,r?"rgba(245, 212, 132, 0.80)":"rgba(101, 113, 104, 0.48)"),o.fillStyle=h,o.strokeStyle="rgba(46, 27, 14, 0.66)",o.lineWidth=4,o.beginPath(),o.roundRect(54,178,148,34,10),o.fill(),o.stroke(),o.fillStyle=r?"#2e1b0e":"rgba(46, 27, 14, 0.62)",o.font='900 18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',o.fillText(i,128,196,118);let u=new je(a);return u.colorSpace=De,u.minFilter=ce,u.magFilter=ce,le.set(s,u),u}function lx(n={}){let e=String(n.slot||""),t=String(n.title||"").toUpperCase().slice(0,18),i=String(n.meta||"").toUpperCase().slice(0,24),r=String(n.tone||"light"),s=`expedition-hud-text:${sn}:${e}:${r}:${t}:${i}`;if(le.has(s))return le.get(s);let a=document.createElement("canvas");a.width=768,a.height=192;let o=a.getContext("2d");o.clearRect(0,0,a.width,a.height);let c=r!=="dark",h=e==="command-puck";if(["crest-status","objective-loop","unit-dock","command-puck","selected-context"].includes(e)){if(["crest-status","objective-loop","command-puck"].includes(e)){let b=new je(a);return b.colorSpace=De,b.minFilter=ce,b.magFilter=ce,le.set(s,b),b}let m=!["selected-context"].includes(e);o.textBaseline="middle",o.shadowColor=m?"rgba(0, 0, 0, 0.66)":"rgba(255, 248, 232, 0.38)",o.shadowBlur=m?8:3,o.lineWidth=m?7:4,e==="crest-status"?(o.textAlign="center",o.fillStyle="rgba(255, 248, 232, 0.96)",o.strokeStyle="rgba(25, 13, 7, 0.70)",o.font="900 46px Georgia, serif",o.strokeText(t||"EXPEDITION",410,82,440),o.fillText(t||"EXPEDITION",410,82,440),o.font='800 24px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',o.globalAlpha=.84,o.strokeText(i,410,132,420),o.fillText(i,410,132,420)):e==="objective-loop"?(o.textAlign="center",o.fillStyle="rgba(255, 248, 232, 0.98)",o.strokeStyle="rgba(4, 16, 15, 0.82)",o.font="900 58px Georgia, serif",o.strokeText(t||"SCOUT",384,96,560),o.fillText(t||"SCOUT",384,96,560)):e==="unit-dock"?(o.textAlign="center",o.fillStyle="rgba(255, 248, 232, 0.96)",o.strokeStyle="rgba(20, 9, 3, 0.78)",o.font="900 40px Georgia, serif",o.strokeText(t||"UNITS",132,88,210),o.fillText(t||"UNITS",132,88,210),o.font='800 22px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',o.strokeText(i,132,128,200),o.fillText(i,132,128,200)):e==="command-puck"?(o.textAlign="center",o.fillStyle="rgba(255, 248, 232, 0.96)",o.strokeStyle="rgba(4, 16, 15, 0.82)",o.font="900 42px Georgia, serif",o.strokeText(t||"NEXT",384,76,440),o.fillText(t||"NEXT",384,76,440),o.font='850 25px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',o.globalAlpha=.82,o.strokeText(i,384,126,420),o.fillText(i,384,126,420)):e==="selected-context"&&(o.textAlign="center",o.fillStyle="rgba(46, 27, 14, 0.96)",o.strokeStyle="rgba(255, 248, 232, 0.56)",o.font="900 46px Georgia, serif",o.strokeText(t||"PARCEL",384,68,470),o.fillText(t||"PARCEL",384,68,470),o.fillStyle="rgba(10, 84, 78, 0.92)",o.font="900 30px Georgia, serif",o.strokeText(i||"SCOUTED",384,134,420),o.fillText(i||"SCOUTED",384,134,420)),o.globalAlpha=1,o.shadowBlur=0;let l=new je(a);return l.colorSpace=De,l.minFilter=ce,l.magFilter=ce,le.set(s,l),l}let u=h?384:36,f=h?384:40,d=h?70:12,p=h?628:704,g=o.createLinearGradient(d,20,d+p,168);g.addColorStop(0,c?"rgba(10, 44, 41, 0.78)":"rgba(255, 248, 232, 0.82)"),g.addColorStop(.48,c?"rgba(27, 106, 100, 0.58)":"rgba(242, 224, 171, 0.74)"),g.addColorStop(1,c?"rgba(46, 27, 14, 0.70)":"rgba(183, 142, 70, 0.52)"),o.fillStyle=g,o.strokeStyle=c?"rgba(245, 212, 132, 0.62)":"rgba(46, 27, 14, 0.42)",o.lineWidth=5,o.beginPath(),o.roundRect(d,26,p,134,20),o.fill(),o.stroke(),o.globalAlpha=.86,o.strokeStyle=c?"rgba(130, 214, 208, 0.32)":"rgba(255, 248, 232, 0.34)",o.lineWidth=2,o.beginPath(),o.moveTo(d+22,50),o.lineTo(d+p-22,50),o.moveTo(d+22,142),o.lineTo(d+p-22,142),o.stroke(),o.globalAlpha=1,o.fillStyle=c?"rgba(255, 248, 232, 0.98)":"rgba(46, 27, 14, 0.95)",o.strokeStyle=c?"rgba(12, 33, 30, 0.70)":"rgba(255, 248, 232, 0.60)",o.shadowColor=c?"rgba(12, 33, 30, 0.52)":"rgba(255, 248, 232, 0.24)",o.shadowBlur=c?8:5,o.lineWidth=7,o.textAlign=h?"center":"left",o.textBaseline="middle",o.font='900 54px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',t&&(o.strokeText(t,u,76,h?560:640),o.fillText(t,u,76,h?560:640)),o.font='850 30px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',o.globalAlpha=.9,i&&(o.strokeText(i,f,132,h?520:610),o.fillText(i,f,132,h?520:610)),o.globalAlpha=1,o.shadowBlur=0;let y=new je(a);return y.colorSpace=De,y.minFilter=ce,y.magFilter=ce,le.set(s,y),y}function cx(n={}){let e=String(n.slot||"hud"),t=`expedition-clean-hud-chrome:${sn}:${Rs}:${e}`;if(le.has(t))return le.get(t);let i=e==="collapsed-ledger",r=e==="command-puck",s=document.createElement("canvas");s.width=i?256:r?384:1024,s.height=i?1024:r?384:320;let a=s.getContext("2d"),o=s.width,c=s.height,h=r?28:i?24:34,u=r?148:i?56:64,f=ax(e);a.clearRect(0,0,o,c);let d=()=>{let v=new je(s);return v.colorSpace=De,v.minFilter=ce,v.magFilter=ce,le.set(t,v),v};if(e==="unit-dock"){let v=a.createLinearGradient(0,0,0,c);v.addColorStop(0,"rgba(0, 0, 0, 0.00)"),v.addColorStop(.26,"rgba(12, 6, 2, 0.56)"),v.addColorStop(1,"rgba(4, 2, 1, 0.96)"),a.fillStyle=v,a.beginPath(),a.moveTo(0,c*.28),a.bezierCurveTo(o*.12,c*.12,o*.35,c*.2,o*.5,c*.3),a.bezierCurveTo(o*.7,c*.43,o*.86,c*.22,o,c*.32),a.lineTo(o,c),a.lineTo(0,c),a.closePath(),a.fill();let _=a.createLinearGradient(0,c*.38,o,c*.9);_.addColorStop(0,"rgba(29, 12, 5, 0.96)"),_.addColorStop(.28,"rgba(89, 48, 19, 0.98)"),_.addColorStop(.58,"rgba(42, 20, 8, 0.98)"),_.addColorStop(1,"rgba(13, 6, 3, 0.96)"),a.fillStyle=_,a.beginPath(),a.roundRect(0,c*.44,o*.98,c*.38,40),a.fill(),Jd(a,o,c,.24),a.strokeStyle="rgba(246, 209, 124, 0.58)",a.lineWidth=8,a.beginPath(),a.moveTo(28,c*.46),a.bezierCurveTo(o*.2,c*.34,o*.38,c*.48,o*.56,c*.53),a.bezierCurveTo(o*.72,c*.58,o*.86,c*.45,o-26,c*.5),a.stroke(),a.strokeStyle="rgba(9, 38, 35, 0.74)",a.lineWidth=6,a.beginPath(),a.moveTo(32,c*.78),a.lineTo(o*.9,c*.78),a.stroke();let E=c*.49;for(let T=0;T<5;T+=1){let C=o*(.24+T*.105),S=a.createRadialGradient(C-22,E-28,10,C,E,76);S.addColorStop(0,"rgba(255, 248, 232, 0.92)"),S.addColorStop(.28,"rgba(191, 149, 75, 0.96)"),S.addColorStop(.62,"rgba(38, 19, 8, 0.98)"),S.addColorStop(1,"rgba(5, 3, 2, 0.78)"),a.fillStyle=S,a.beginPath(),a.arc(C,E,T===0?72:61,0,Math.PI*2),a.fill(),a.strokeStyle=T===0?"rgba(130, 214, 208, 0.90)":"rgba(246, 209, 124, 0.56)",a.lineWidth=T===0?8:5,a.stroke(),an(a,C,E+(T===0?78:68),7,T===0)}return a.fillStyle="rgba(12, 33, 30, 0.86)",a.strokeStyle="rgba(246, 209, 124, 0.58)",a.lineWidth=5,a.beginPath(),a.roundRect(34,c*.49,118,62,10),a.fill(),a.stroke(),a.fillStyle="rgba(255, 248, 232, 0.92)",a.font="900 28px Georgia, serif",a.textAlign="center",a.textBaseline="middle",a.fillText("UNIT",93,c*.49+32,92),[34,o*.88,o*.96].forEach((T,C)=>an(a,T,c*.62,C===0?10:8,C<2)),d()}if(e==="command-tray"){a.shadowColor="rgba(0, 0, 0, 0.62)",a.shadowBlur=28,a.shadowOffsetY=12;let v=a.createLinearGradient(0,0,o,c);v.addColorStop(0,"rgba(7, 16, 14, 0.98)"),v.addColorStop(.26,"rgba(77, 49, 24, 0.98)"),v.addColorStop(.52,"rgba(15, 58, 54, 0.98)"),v.addColorStop(1,"rgba(21, 10, 5, 0.98)"),a.fillStyle=v,a.beginPath(),a.roundRect(26,26,o-52,c-52,48),a.fill(),a.shadowBlur=0,Qo(a,o,c,.22);let _=o*.3,E=c*.48,T=a.createRadialGradient(_-44,E-46,12,_,E,134);T.addColorStop(0,"rgba(255, 248, 232, 0.95)"),T.addColorStop(.25,"rgba(75, 135, 122, 0.80)"),T.addColorStop(.58,"rgba(14, 38, 34, 0.92)"),T.addColorStop(1,"rgba(3, 8, 7, 0.98)"),a.fillStyle=T,a.beginPath(),a.arc(_,E,112,0,Math.PI*2),a.fill(),a.strokeStyle="rgba(246, 209, 124, 0.84)",a.lineWidth=15,a.stroke(),a.strokeStyle="rgba(130, 214, 208, 0.48)",a.lineWidth=4,a.beginPath(),a.arc(_,E,74,0,Math.PI*2),a.moveTo(_-88,E),a.lineTo(_+88,E),a.moveTo(_,E-88),a.lineTo(_,E+88),a.stroke(),a.strokeStyle="rgba(255, 248, 232, 0.50)",a.lineWidth=3;for(let N=0;N<6;N+=1){let G=Math.PI*2*N/6;a.beginPath(),a.arc(_+Math.cos(G)*44,E+Math.sin(G)*44,7,0,Math.PI*2),a.stroke()}let C=o*.55,S=c*.17,A=o*.34,L=c*.54,I=a.createLinearGradient(C,S,C+A,S+L);I.addColorStop(0,"rgba(255, 243, 202, 0.98)"),I.addColorStop(.56,"rgba(229, 197, 131, 0.96)"),I.addColorStop(1,"rgba(175, 126, 70, 0.92)"),ol(a,C,S,A,L,18),a.fillStyle=I,a.fill(),a.strokeStyle="rgba(55, 29, 13, 0.64)",a.lineWidth=4,a.stroke(),a.fillStyle="rgba(46, 27, 14, 0.92)",a.font="900 42px Georgia, serif",a.textAlign="center",a.textBaseline="middle",a.fillText("PARCEL",C+A/2,S+45,A-28),a.strokeStyle="rgba(27, 106, 100, 0.74)",a.lineWidth=6,a.beginPath();for(let N=0;N<6;N+=1){let G=-Math.PI/2+N*Math.PI/3,W=C+A/2+Math.cos(G)*47,F=S+L*.53+Math.sin(G)*47;N===0?a.moveTo(W,F):a.lineTo(W,F)}return a.closePath(),a.stroke(),a.fillStyle="rgba(27, 106, 100, 0.88)",a.font="900 28px Georgia, serif",a.fillText("SCOUTED",C+A/2,S+L-38,A-32),a.fillStyle="rgba(10, 44, 41, 0.94)",a.strokeStyle="rgba(246, 209, 124, 0.72)",a.lineWidth=5,a.beginPath(),a.roundRect(o*.55,c*.74,o*.34,54,9),a.fill(),a.stroke(),a.fillStyle="rgba(255, 248, 232, 0.96)",a.font='900 28px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',a.fillText("DOUBLE-CLICK MOVE",o*.72,c*.74+29,o*.3),[58,o-58,o*.5].forEach((N,G)=>an(a,N,c-48,G===2?7:9,G<2)),d()}if(e==="selected-context"){a.shadowColor="rgba(0, 0, 0, 0.48)",a.shadowBlur=22,a.shadowOffsetY=8,ol(a,42,26,o-84,c-52,22);let v=a.createLinearGradient(42,26,o-42,c-26);v.addColorStop(0,"rgba(255, 244, 205, 0.99)"),v.addColorStop(.52,"rgba(228, 195, 128, 0.96)"),v.addColorStop(1,"rgba(156, 99, 49, 0.86)"),a.fillStyle=v,a.fill(),a.shadowBlur=0,a.strokeStyle="rgba(55, 29, 13, 0.60)",a.lineWidth=6,a.stroke(),a.strokeStyle="rgba(46, 27, 14, 0.48)",a.lineWidth=3,a.beginPath(),a.moveTo(o*.18,c*.26),a.lineTo(o*.82,c*.26),a.moveTo(o*.16,c*.72),a.lineTo(o*.84,c*.72),a.stroke(),a.strokeStyle="rgba(27, 106, 100, 0.78)",a.lineWidth=7,a.beginPath();let _=o*.38,E=c*.5;for(let T=0;T<6;T+=1){let C=-Math.PI/2+T*Math.PI/3,S=_+Math.cos(C)*54,A=E+Math.sin(C)*54;T===0?a.moveTo(S,A):a.lineTo(S,A)}return a.closePath(),a.stroke(),Ps(a,o*.78,c*.76,36,"rgba(55, 29, 13, 0.58)"),d()}if(e==="crest-status"||e==="objective-loop"){let v=e==="objective-loop",_=a.createLinearGradient(0,0,o,c);return _.addColorStop(0,v?"rgba(8, 50, 48, 0.98)":"rgba(64, 31, 12, 0.98)"),_.addColorStop(.48,v?"rgba(17, 92, 86, 0.98)":"rgba(109, 65, 26, 0.98)"),_.addColorStop(1,"rgba(9, 6, 4, 0.98)"),a.shadowColor="rgba(0, 0, 0, 0.52)",a.shadowBlur=16,a.shadowOffsetY=5,a.fillStyle=_,a.beginPath(),v?(a.moveTo(38,48),a.lineTo(o-72,48),a.lineTo(o-36,c/2),a.lineTo(o-72,c-48),a.lineTo(38,c-48),a.closePath()):a.roundRect(34,34,o-68,c-68,26),a.fill(),a.shadowBlur=0,a.strokeStyle="rgba(246, 209, 124, 0.82)",a.lineWidth=7,a.stroke(),Qo(a,o,c,.2),v?(a.fillStyle="rgba(255, 248, 232, 0.96)",a.font="900 54px Georgia, serif",a.textAlign="center",a.textBaseline="middle",a.fillText("SCOUT",o*.46,c*.52,o*.7),an(a,52,c/2,9,!0)):(Ps(a,108,c/2,42,"rgba(246, 209, 124, 0.86)"),a.fillStyle="rgba(255, 248, 232, 0.96)",a.font="900 48px Georgia, serif",a.textAlign="center",a.textBaseline="middle",a.fillText("EXPEDITION",o*.58,c*.51,o*.58),[38,o-38].forEach(E=>an(a,E,c/2,8,!0))),d()}if(e==="collapsed-ledger"){let v=a.createLinearGradient(0,0,o,c);return v.addColorStop(0,"rgba(46, 27, 14, 0.98)"),v.addColorStop(.4,"rgba(13, 65, 61, 0.98)"),v.addColorStop(1,"rgba(8, 6, 4, 0.98)"),a.fillStyle=v,a.beginPath(),a.roundRect(26,44,o-52,c-88,44),a.fill(),a.strokeStyle="rgba(246, 209, 124, 0.82)",a.lineWidth=10,a.stroke(),Qo(a,o,c,.26),a.save(),a.translate(o/2,c/2),a.rotate(-Math.PI/2),a.fillStyle="rgba(255, 248, 232, 0.96)",a.font="900 78px Georgia, serif",a.textAlign="center",a.textBaseline="middle",a.fillText("LEDGER",0,0,c*.72),a.restore(),[84,c-84,c/2].forEach((_,E)=>an(a,o/2,_,E===2?10:12,E<2)),d()}if(e==="command-puck"){let v=a.createRadialGradient(o/2,c/2,10,o/2,c/2,o*.46);return v.addColorStop(0,"rgba(130, 214, 208, 0.46)"),v.addColorStop(.45,"rgba(246, 209, 124, 0.30)"),v.addColorStop(1,"rgba(9, 6, 4, 0.00)"),a.fillStyle=v,a.fillRect(0,0,o,c),Ps(a,o/2,c/2,o*.31,"rgba(246, 209, 124, 0.76)"),a.strokeStyle="rgba(130, 214, 208, 0.72)",a.lineWidth=8,a.beginPath(),a.arc(o/2,c/2,o*.2,0,Math.PI*2),a.stroke(),d()}a.save(),a.shadowColor=f.shadow,a.shadowBlur=f.bottomHardware?28:18,a.shadowOffsetY=f.bottomHardware?12:6;let p=a.createLinearGradient(0,0,o,c);p.addColorStop(0,f.outerA),p.addColorStop(.46,f.outerB),p.addColorStop(1,f.outerC),a.fillStyle=p,a.beginPath(),a.roundRect(h,h,o-h*2,c-h*2,u),a.fill(),a.restore(),a.save(),a.beginPath(),a.roundRect(h,h,o-h*2,c-h*2,u),a.clip(),Qo(a,o,c,f.darkHardware?.16:.1),a.restore();let g=a.createLinearGradient(h,h,o-h,c-h);g.addColorStop(0,"rgba(255, 248, 232, 0.56)"),g.addColorStop(.24,f.strokeA),g.addColorStop(.72,"rgba(46, 27, 14, 0.34)"),g.addColorStop(1,f.strokeB),a.strokeStyle=g,a.lineWidth=r?12:9,a.beginPath(),a.roundRect(h+5,h+5,o-(h+5)*2,c-(h+5)*2,Math.max(18,u-8)),a.stroke();let y=h+(r?34:i?28:30),m=a.createLinearGradient(y,y,o-y,c-y);m.addColorStop(0,f.insetA),m.addColorStop(1,f.insetB),a.fillStyle=m,a.strokeStyle=f.strokeB,a.lineWidth=r?5:4,a.beginPath(),a.roundRect(y,y,o-y*2,c-y*2,Math.max(16,u-28)),a.fill(),a.stroke();let l=h+18;if([[l,l],[o-l,l],[l,c-l],[o-l,c-l]].forEach(([v,_],E)=>an(a,v,_,r?9:i?6:7,E<2)),a.globalAlpha=.72,a.strokeStyle=f.darkHardware?"rgba(255, 248, 232, 0.50)":"rgba(46, 27, 14, 0.40)",a.fillStyle=f.darkHardware?"rgba(255, 248, 232, 0.18)":"rgba(12, 33, 30, 0.12)",a.lineWidth=4,e==="unit-dock"){let v=c*.62;a.strokeStyle="rgba(46, 27, 14, 0.48)",a.lineWidth=5,a.beginPath(),a.moveTo(o*.3,v),a.lineTo(o*.9,v),a.stroke(),a.strokeStyle="rgba(245, 212, 132, 0.42)",a.lineWidth=3;for(let _=0;_<6;_+=1){let E=o*.43+_*o*.085;a.beginPath(),a.arc(E,v-10,42,0,Math.PI*2),a.stroke(),a.beginPath(),a.arc(E,v-10,27,0,Math.PI*2),a.stroke()}a.strokeStyle="rgba(12, 33, 30, 0.54)",a.lineWidth=5,a.beginPath(),a.arc(158,c/2,86,0,Math.PI*2),a.stroke(),a.strokeStyle="rgba(245, 212, 132, 0.42)",a.lineWidth=3,a.beginPath(),a.arc(158,c/2,54,0,Math.PI*2),a.stroke(),a.strokeStyle="rgba(245, 212, 132, 0.30)",a.lineWidth=8,a.beginPath(),a.moveTo(o*.82,c*.4),a.bezierCurveTo(o*.9,c*.44,o*.95,c*.58,o*.99,c*.62),a.stroke(),a.strokeStyle="rgba(12, 33, 30, 0.38)",a.lineWidth=4,a.beginPath(),a.moveTo(o*.84,c*.73),a.lineTo(o*.98,c*.73),a.stroke()}else if(e==="crest-status"){let _=c/2;a.strokeStyle="rgba(245, 212, 132, 0.72)",a.lineWidth=6,a.beginPath(),a.arc(156,_,72,0,Math.PI*2),a.stroke(),a.strokeStyle="rgba(130, 214, 208, 0.42)",a.lineWidth=3,a.beginPath(),a.arc(156,_,50,0,Math.PI*2),a.stroke(),a.fillStyle="rgba(255, 248, 232, 0.62)",a.beginPath(),a.moveTo(156,_-48),a.lineTo(182,_),a.lineTo(156,_+48),a.lineTo(130,_),a.closePath(),a.fill(),a.stroke()}else if(e==="collapsed-ledger"){a.strokeStyle="rgba(245, 212, 132, 0.58)",a.lineWidth=5,a.beginPath(),a.moveTo(o/2,128),a.lineTo(o/2,c-128),a.stroke();for(let v=0;v<7;v+=1){let _=180+v*96;a.fillStyle=v%2===0?"rgba(255, 248, 232, 0.26)":"rgba(130, 214, 208, 0.20)",a.beginPath(),a.arc(o/2,_,22,0,Math.PI*2),a.fill(),a.stroke()}}else if(e==="command-puck")a.strokeStyle="rgba(245, 212, 132, 0.68)",a.lineWidth=8,a.beginPath(),a.arc(o/2,c/2,110,0,Math.PI*2),a.stroke(),a.strokeStyle="rgba(130, 214, 208, 0.34)",a.lineWidth=4,a.beginPath(),a.arc(o/2,c/2,78,0,Math.PI*2),a.stroke();else if(e==="command-tray"){let v=c*.57;a.fillStyle="rgba(4, 16, 15, 0.30)",a.beginPath(),a.roundRect(o*.12,v-46,o*.72,92,32),a.fill(),a.strokeStyle="rgba(245, 212, 132, 0.44)",a.lineWidth=4;for(let _=0;_<5;_+=1){let E=o*.23+_*o*.115;a.beginPath(),a.arc(E,v,38,0,Math.PI*2),a.stroke()}a.strokeStyle="rgba(130, 214, 208, 0.40)",a.lineWidth=3,a.beginPath(),a.moveTo(o*.19,c*.78),a.lineTo(o*.72,c*.78),a.stroke(),a.strokeStyle="rgba(245, 212, 132, 0.32)",a.lineWidth=8,a.beginPath(),a.moveTo(o*.02,c*.62),a.bezierCurveTo(o*.08,c*.58,o*.11,c*.46,o*.18,c*.42),a.stroke(),a.strokeStyle="rgba(130, 214, 208, 0.30)",a.lineWidth=3,a.beginPath(),a.moveTo(o*.04,c*.74),a.lineTo(o*.2,c*.74),a.stroke()}else if(e==="objective-loop"){a.strokeStyle="rgba(46, 27, 14, 0.44)",a.lineWidth=4,a.beginPath(),a.moveTo(o*.14,c*.54),a.bezierCurveTo(o*.28,c*.34,o*.44,c*.74,o*.62,c*.52),a.stroke();for(let v=0;v<5;v+=1)an(a,o*(.15+v*.12),c*(.54+(v%2===0?-.04:.05)),6,v===0)}else if(e==="selected-context"){let v=o*.2,_=c*.52;a.strokeStyle="rgba(27, 106, 100, 0.54)",a.lineWidth=5,a.beginPath(),a.arc(v,_,52,0,Math.PI*2),a.stroke(),a.strokeStyle="rgba(245, 212, 132, 0.52)",a.lineWidth=3,a.beginPath(),a.moveTo(v-64,_),a.lineTo(v+64,_),a.moveTo(v,_-64),a.lineTo(v,_+64),a.stroke(),a.strokeStyle="rgba(245, 212, 132, 0.62)",a.lineWidth=7,a.beginPath(),a.moveTo(o*.02,_),a.lineTo(o*.08,_-22),a.lineTo(o*.08,_+22),a.closePath(),a.stroke(),a.fillStyle="rgba(245, 212, 132, 0.20)",a.fill()}a.globalAlpha=1;let b=new je(s);return b.colorSpace=De,b.minFilter=ce,b.magFilter=ce,le.set(t,b),b}function Yc(n="depth-veil"){let e=String(n||"depth-veil"),t=`expedition-hud-world-cohesion:${Rs}:${e}`;if(le.has(t))return le.get(t);let i=document.createElement("canvas");i.width=e==="bottom-bridge"?1024:768,i.height=e==="bottom-bridge"?320:768;let r=i.getContext("2d"),s=i.width,a=i.height;if(r.clearRect(0,0,s,a),e==="bottom-bridge"){let c=r.createLinearGradient(0,0,0,a);c.addColorStop(0,"rgba(4, 16, 15, 0.00)"),c.addColorStop(.38,"rgba(4, 16, 15, 0.02)"),c.addColorStop(.7,"rgba(4, 16, 15, 0.10)"),c.addColorStop(1,"rgba(4, 16, 15, 0.20)"),r.fillStyle=c,r.fillRect(0,0,s,a);let h=r.createLinearGradient(64,128,s-64,262);h.addColorStop(0,"rgba(12, 33, 30, 0.02)"),h.addColorStop(.18,"rgba(10, 44, 41, 0.12)"),h.addColorStop(.52,"rgba(78, 58, 32, 0.06)"),h.addColorStop(.82,"rgba(10, 44, 41, 0.12)"),h.addColorStop(1,"rgba(12, 33, 30, 0.02)"),r.fillStyle=h,r.beginPath(),r.roundRect(58,146,s-116,106,42),r.fill(),r.strokeStyle="rgba(245, 212, 132, 0.06)",r.lineWidth=7,r.beginPath(),r.moveTo(88,160),r.bezierCurveTo(260,110,420,170,514,186),r.bezierCurveTo(620,204,746,126,936,160),r.stroke(),r.strokeStyle="rgba(130, 214, 208, 0.05)",r.lineWidth=3;for(let u=0;u<11;u+=1){let f=122+u*82;r.beginPath(),r.moveTo(f,156),r.lineTo(f+36,246),r.stroke()}[118,232,784,906].forEach((u,f)=>an(r,u,204,f%2===0?8:6,f<2))}else if(e==="selected-aura"){let c=r.createRadialGradient(s/2,a/2,8,s/2,a/2,s*.46);c.addColorStop(0,"rgba(255, 248, 232, 0.34)"),c.addColorStop(.36,"rgba(245, 212, 132, 0.18)"),c.addColorStop(.7,"rgba(27, 106, 100, 0.10)"),c.addColorStop(1,"rgba(27, 106, 100, 0.00)"),r.fillStyle=c,r.fillRect(0,0,s,a),r.strokeStyle="rgba(245, 212, 132, 0.54)",r.lineWidth=7,r.setLineDash([22,15]),r.beginPath(),r.arc(s/2,a/2,s*.3,0,Math.PI*2),r.stroke(),r.setLineDash([]),r.strokeStyle="rgba(130, 214, 208, 0.38)",r.lineWidth=3,r.beginPath(),r.arc(s/2,a/2,s*.4,0,Math.PI*2),r.stroke()}else{let c=r.createRadialGradient(s*.5,a*.48,s*.1,s*.5,a*.5,s*.72);c.addColorStop(0,"rgba(4, 16, 15, 0.00)"),c.addColorStop(.5,"rgba(4, 16, 15, 0.01)"),c.addColorStop(.78,"rgba(4, 16, 15, 0.035)"),c.addColorStop(1,"rgba(4, 16, 15, 0.14)"),r.fillStyle=c,r.fillRect(0,0,s,a);let h=r.createLinearGradient(0,0,s,a*.56);h.addColorStop(0,"rgba(255, 248, 232, 0.025)"),h.addColorStop(.28,"rgba(255, 248, 232, 0.006)"),h.addColorStop(1,"rgba(255, 248, 232, 0.00)"),r.fillStyle=h,r.fillRect(0,0,s,a);let u=r.createLinearGradient(0,0,s,0);u.addColorStop(0,"rgba(10, 44, 41, 0.045)"),u.addColorStop(.18,"rgba(10, 44, 41, 0.006)"),u.addColorStop(.78,"rgba(10, 44, 41, 0.006)"),u.addColorStop(1,"rgba(10, 44, 41, 0.045)"),r.fillStyle=u,r.fillRect(0,0,s,a)}let o=new je(i);return o.colorSpace=De,o.minFilter=ce,o.magFilter=ce,le.set(t,o),o}function Vi(n="board-frame"){let e=String(n||"board-frame"),t=`expedition-frontier-ledger-scratch:${el}:${e}`;if(le.has(t))return le.get(t);let i=document.createElement("canvas");e==="bottom-medallion-rail"?(i.width=1536,i.height=360):e==="top-ledger-tabs"?(i.width=960,i.height=240):e==="right-ledger-tab"?(i.width=256,i.height=768):e==="parcel-rangefinder-backplate"?(i.width=720,i.height=420):e==="target-callout"?(i.width=420,i.height=180):e==="trail-pip"?(i.width=96,i.height=96):(i.width=1536,i.height=864);let r=i.getContext("2d"),s=i.width,a=i.height;if(r.clearRect(0,0,s,a),e==="board-frame"){let c=r.createRadialGradient(s*.5,a*.46,s*.42,s*.5,a*.5,s*.76);c.addColorStop(0,"rgba(255, 232, 172, 0.00)"),c.addColorStop(.62,"rgba(129, 79, 34, 0.00)"),c.addColorStop(.86,"rgba(25, 13, 7, 0.08)"),c.addColorStop(1,"rgba(5, 3, 2, 0.32)"),r.fillStyle=c,r.fillRect(0,0,s,a);let h=r.createLinearGradient(0,0,0,110);h.addColorStop(0,"rgba(15, 7, 3, 0.62)"),h.addColorStop(.55,"rgba(67, 35, 14, 0.26)"),h.addColorStop(1,"rgba(15, 7, 3, 0.02)"),r.fillStyle=h,r.fillRect(0,0,s,116);let u=r.createLinearGradient(0,0,72,0);u.addColorStop(0,"rgba(7, 3, 1, 0.48)"),u.addColorStop(.7,"rgba(64, 34, 14, 0.12)"),u.addColorStop(1,"rgba(7, 3, 1, 0.00)"),r.fillStyle=u,r.fillRect(0,0,92,a),r.save(),r.translate(s,0),r.scale(-1,1),r.fillStyle=u,r.fillRect(0,0,92,a),r.restore();let f=r.createLinearGradient(0,a-190,0,a);f.addColorStop(0,"rgba(5, 3, 2, 0.00)"),f.addColorStop(.36,"rgba(23, 12, 5, 0.28)"),f.addColorStop(1,"rgba(3, 1, 0, 0.58)"),r.fillStyle=f,r.fillRect(0,a-190,s,190),[[38,44],[s-38,44],[38,a-38],[s-38,a-38]].forEach(([d,p],g)=>{an(r,d,p,g<2?12:14,g%2===0)})}else if(e==="bottom-medallion-rail"){let c=r.createLinearGradient(0,0,0,a);c.addColorStop(0,"rgba(0, 0, 0, 0.00)"),c.addColorStop(.34,"rgba(15, 8, 3, 0.68)"),c.addColorStop(1,"rgba(3, 1, 0, 0.98)"),r.fillStyle=c,r.fillRect(0,0,s,a);let h=r.createLinearGradient(0,a*.36,s,a*.92);h.addColorStop(0,"rgba(23, 10, 4, 0.98)"),h.addColorStop(.25,"rgba(91, 48, 18, 0.98)"),h.addColorStop(.5,"rgba(44, 20, 8, 0.98)"),h.addColorStop(.8,"rgba(98, 52, 20, 0.96)"),h.addColorStop(1,"rgba(15, 7, 3, 0.98)"),r.fillStyle=h,r.beginPath(),r.roundRect(0,a*.45,s,a*.36,48),r.fill(),Jd(r,s,a,.26),r.strokeStyle="rgba(246, 209, 124, 0.44)",r.lineWidth=8,r.beginPath(),r.moveTo(s*.02,a*.49),r.bezierCurveTo(s*.18,a*.32,s*.34,a*.5,s*.5,a*.54),r.bezierCurveTo(s*.68,a*.59,s*.82,a*.39,s*.98,a*.5),r.stroke();for(let u=0;u<6;u+=1){let f=s*(.28+u*.095),d=a*.47;r.strokeStyle=u===0?"rgba(130, 214, 208, 0.76)":"rgba(246, 209, 124, 0.44)",r.lineWidth=u===0?8:5,r.beginPath(),r.arc(f,d,u===0?78:60,0,Math.PI*2),r.stroke()}}else if(e==="parcel-rangefinder-backplate"){r.shadowColor="rgba(0, 0, 0, 0.42)",r.shadowBlur=18,r.shadowOffsetY=8;let c=r.createLinearGradient(0,0,s,a);c.addColorStop(0,"rgba(255, 240, 194, 0.98)"),c.addColorStop(.48,"rgba(224, 185, 114, 0.96)"),c.addColorStop(1,"rgba(128, 78, 34, 0.92)"),r.fillStyle=c,ol(r,40,28,s-80,a-56,28),r.fill(),r.shadowBlur=0,r.strokeStyle="rgba(85, 53, 25, 0.46)",r.lineWidth=6,r.stroke(),r.fillStyle="rgba(50, 31, 16, 0.94)",r.font="900 50px Georgia, serif",r.textAlign="center",r.textBaseline="middle",r.fillText("PARCEL",s*.52,a*.24,s*.58),r.strokeStyle="rgba(91, 61, 30, 0.42)",r.lineWidth=3,r.beginPath(),r.moveTo(s*.2,a*.34),r.lineTo(s*.8,a*.34),r.stroke();let h=s*.5,u=a*.56,f=Math.min(s,a)*.16;r.save(),r.translate(h,u),r.strokeStyle="rgba(17, 111, 105, 0.72)",r.lineWidth=7,r.beginPath();for(let d=0;d<6;d+=1){let p=-Math.PI/2+d*Math.PI/3,g=Math.cos(p)*f,y=Math.sin(p)*f;d===0?r.moveTo(g,y):r.lineTo(g,y)}r.closePath(),r.stroke(),r.fillStyle="rgba(96, 76, 44, 0.18)",r.fill(),r.strokeStyle="rgba(73, 52, 28, 0.28)",r.lineWidth=3;for(let d=0;d<5;d+=1)r.beginPath(),r.moveTo(-f*.58,-f*.3+d*f*.16),r.bezierCurveTo(-f*.18,-f*.5+d*f*.16,f*.24,-f*.04+d*f*.13,f*.58,-f*.26+d*f*.15),r.stroke();r.restore(),r.fillStyle="rgba(10, 101, 94, 0.92)",r.font="900 42px Georgia, serif",r.fillText("SCOUTED",s*.52,a*.8,s*.5),r.strokeStyle="rgba(91, 61, 30, 0.36)",r.lineWidth=3,r.beginPath(),r.moveTo(s*.2,a*.88),r.lineTo(s*.8,a*.88),r.stroke(),Ps(r,s*.5,a*.91,22,"rgba(85, 53, 25, 0.42)")}else if(e==="right-ledger-tab"){let c=r.createLinearGradient(0,0,s,a);c.addColorStop(0,"rgba(16, 8, 3, 0.82)"),c.addColorStop(.42,"rgba(10, 56, 53, 0.80)"),c.addColorStop(1,"rgba(5, 3, 1, 0.88)"),r.fillStyle=c,r.beginPath(),r.roundRect(72,38,150,a-76,46),r.fill(),r.strokeStyle="rgba(246, 209, 124, 0.52)",r.lineWidth=8,r.stroke(),r.save(),r.translate(148,a/2),r.rotate(-Math.PI/2),r.fillStyle="rgba(255, 248, 232, 0.82)",r.font="900 64px Georgia, serif",r.textAlign="center",r.textBaseline="middle",r.fillText("LEDGER",0,0,a*.62),r.restore()}else if(e==="top-ledger-tabs"){let c=r.createLinearGradient(0,0,s,a);c.addColorStop(0,"rgba(50, 24, 10, 0.90)"),c.addColorStop(.54,"rgba(11, 46, 43, 0.88)"),c.addColorStop(1,"rgba(10, 5, 2, 0.72)"),r.fillStyle=c,r.beginPath(),r.roundRect(12,38,s*.58,a*.44,28),r.fill(),r.strokeStyle="rgba(246, 209, 124, 0.48)",r.lineWidth=6,r.stroke(),Ps(r,74,a*.6,38,"rgba(246, 209, 124, 0.58)")}else if(e==="target-callout"){r.shadowColor="rgba(0, 0, 0, 0.46)",r.shadowBlur=20,r.shadowOffsetY=8;let c=r.createLinearGradient(0,0,s,a);c.addColorStop(0,"rgba(255, 244, 205, 0.98)"),c.addColorStop(.52,"rgba(222, 183, 112, 0.95)"),c.addColorStop(1,"rgba(122, 75, 32, 0.90)"),r.fillStyle=c,ol(r,44,30,s-88,a*.48,18),r.fill(),r.shadowBlur=0,r.strokeStyle="rgba(59, 37, 19, 0.62)",r.lineWidth=5,r.stroke(),r.fillStyle="rgba(46, 27, 14, 0.94)",r.font="900 34px Georgia, serif",r.textAlign="center",r.textBaseline="middle",r.fillText("TARGET",s/2,a*.45,s*.58),r.strokeStyle="rgba(246, 209, 124, 0.78)",r.lineWidth=7,r.lineCap="round",r.beginPath(),r.moveTo(s/2,a*.7),r.lineTo(s/2,a*.98),r.stroke(),an(r,s/2,a*.7,10,!0)}else if(e==="trail-pip"){let c=r.createRadialGradient(s/2,a/2,2,s/2,a/2,s*.42);c.addColorStop(0,"rgba(255, 248, 232, 0.98)"),c.addColorStop(.4,"rgba(246, 209, 124, 0.88)"),c.addColorStop(.72,"rgba(130, 214, 208, 0.40)"),c.addColorStop(1,"rgba(130, 214, 208, 0.00)"),r.fillStyle=c,r.fillRect(0,0,s,a),r.fillStyle="rgba(255, 248, 232, 0.96)",r.beginPath(),r.arc(s/2,a/2,s*.16,0,Math.PI*2),r.fill()}let o=new je(i);return o.colorSpace=De,o.minFilter=ce,o.magFilter=ce,le.set(t,o),o}function hx(n,e="expedition-three-raycast"){let t=n?.userData||{};return{unitId:String(t.unitId||""),unitType:String(t.unitType||""),displayName:String(t.displayName||""),cellId:String(t.cellId||""),source:e,atMs:Date.now()}}function ux(n,e="expedition-three-raycast"){let t=n?.userData||{};return{markerKind:String(t.kind||""),packetId:String(t.packetId||""),mode:String(t.mode||""),cellId:String(t.cellId||t.targetCellId||""),targetCellId:String(t.targetCellId||t.cellId||""),visualOnly:t.visualOnly===!0,readOnly:t.readOnly===!0,source:e,atMs:Date.now()}}function dx(n,e="expedition-three-raycast"){let t=n?.userData||{};return{unitId:String(t.unitId||""),unitType:String(t.unitType||""),commandId:String(t.commandId||""),cellId:String(t.cellId||""),targetCellId:String(t.cellId||""),fogState:String(t.fogState||""),serverMutationImplemented:t.serverMutationImplemented===!0,movementMutation:t.movementMutation===!0,visualOnly:t.visualOnly===!0,readOnly:t.readOnly===!0,previewOnly:t.previewOnly===!0,source:e,atMs:Date.now()}}function jd(n=""){switch(String(n||"")){case"move_unit":return{stroke:"#1b6a64",fill:"rgba(130, 214, 208, 0)",glyph:"move"};case"scout_sector":return{stroke:"#d19a48",fill:"rgba(245, 212, 132, 0)",glyph:"scout"};case"prepare_settler_convoy":return{stroke:"#c4883a",fill:"rgba(255, 226, 128, 0)",glyph:"convoy"};case"found_settlement":return{stroke:"#637f58",fill:"rgba(130, 214, 208, 0)",glyph:"outpost"};default:return{stroke:"#8a6d41",fill:"rgba(255, 248, 232, 0)",glyph:"inspect"}}}function fx(n={}){let e=String(n.commandId||"inspect"),t=String(n.fogState||""),i=`expedition-command-target:${Gt}:${e}:${t}`;if(le.has(i))return le.get(i);let r=document.createElement("canvas");r.width=256,r.height=256;let s=r.getContext("2d"),a=jd(e);s.clearRect(0,0,r.width,r.height);let o=s.createRadialGradient(128,128,84,128,128,122);o.addColorStop(0,a.fill),o.addColorStop(.72,"rgba(255, 248, 232, 0)"),o.addColorStop(1,e==="scout_sector"?"rgba(245, 212, 132, 0.10)":"rgba(130, 214, 208, 0.08)"),s.fillStyle=o,s.beginPath(),s.arc(128,128,122,0,Math.PI*2),s.fill(),s.strokeStyle=a.stroke,s.lineWidth=e==="scout_sector"?8:7,e==="scout_sector"&&s.setLineDash([18,14]),s.beginPath(),s.arc(128,128,106,0,Math.PI*2),s.stroke(),s.setLineDash([]),s.strokeStyle="rgba(255, 248, 232, 0.58)",s.lineWidth=3,s.beginPath(),s.arc(128,128,86,0,Math.PI*2),s.stroke(),s.strokeStyle="rgba(46, 27, 14, 0.38)",s.lineWidth=5,s.lineCap="round",s.lineJoin="round",s.save(),s.strokeStyle=e==="scout_sector"?"rgba(245, 212, 132, 0.74)":"rgba(130, 214, 208, 0.68)",s.lineWidth=4,s.setLineDash([10,10]),s.beginPath(),s.arc(128,128,116,0,Math.PI*2),s.stroke(),s.setLineDash([]),s.strokeStyle="rgba(246, 209, 124, 0.74)",s.lineWidth=3,s.beginPath(),s.moveTo(128,28),s.lineTo(128,58),s.moveTo(128,198),s.lineTo(128,228),s.moveTo(28,128),s.lineTo(58,128),s.moveTo(198,128),s.lineTo(228,128),s.stroke(),s.restore();let c=new je(r);return c.colorSpace=De,c.minFilter=ce,c.magFilter=ce,le.set(i,c),c}function px(n={}){let e=String(n.commandId||"command"),t=String(n.feedbackId||`${e}:${n.cellId||""}`),i=`expedition-command-outcome:${Gt}:${t}`;if(le.has(i))return le.get(i);let r=document.createElement("canvas");r.width=256,r.height=256;let s=r.getContext("2d"),a=jd(e);s.clearRect(0,0,r.width,r.height),s.fillStyle=a.fill,s.beginPath(),s.arc(128,128,116,0,Math.PI*2),s.fill(),s.strokeStyle=a.stroke,s.lineWidth=10,s.beginPath(),s.arc(128,128,104,0,Math.PI*2),s.stroke(),s.strokeStyle="rgba(255, 248, 232, 0.78)",s.lineWidth=5,s.beginPath(),s.arc(128,128,78,0,Math.PI*2),s.stroke(),s.fillStyle="rgba(255, 248, 232, 0.88)",s.beginPath(),s.arc(128,128,42,0,Math.PI*2),s.fill(),s.strokeStyle=a.stroke,s.lineWidth=9,s.lineCap="round",s.lineJoin="round",e==="move_unit"?(s.beginPath(),s.moveTo(92,128),s.lineTo(160,128),s.moveTo(138,106),s.lineTo(160,128),s.lineTo(138,150),s.stroke()):e==="scout_sector"?(s.beginPath(),s.arc(128,128,24,0,Math.PI*2),s.moveTo(128,88),s.lineTo(128,104),s.moveTo(128,152),s.lineTo(128,168),s.moveTo(88,128),s.lineTo(104,128),s.moveTo(152,128),s.lineTo(168,128),s.stroke()):e==="prepare_settler_convoy"?(s.beginPath(),s.roundRect(92,112,72,34,9),s.stroke(),s.beginPath(),s.arc(106,158,8,0,Math.PI*2),s.arc(150,158,8,0,Math.PI*2),s.stroke()):e==="found_settlement"?(s.beginPath(),s.moveTo(96,158),s.lineTo(128,96),s.lineTo(160,158),s.stroke(),s.beginPath(),s.moveTo(108,158),s.lineTo(156,158),s.stroke()):(s.beginPath(),s.moveTo(98,130),s.lineTo(120,152),s.lineTo(164,104),s.stroke());let o=new je(r);return o.colorSpace=De,o.minFilter=ce,o.magFilter=ce,le.set(i,o),o}function Od(n={},e=new Map){if(!n?.unitId)return[];let t=new Map,i=(s={},a="",o="")=>{let c=String(s.commandId||o||""),h=String(a||"").trim();if(!c||!h)return;let u=e.get(h);if(!u)return;let f=String(u.fogState||"");if(c==="scout_sector"){if(!(f==="hinted"&&String(u.kind||"")==="frontier_hint"))return}else if(!["discovered","known"].includes(f))return;let d=`${c}:${h}`;t.has(d)||t.set(d,{unitId:String(n.unitId||""),unitType:String(n.unitType||""),commandId:c,cellId:h,fogState:f,serverMutationImplemented:s.serverMutationImplemented===!0||c==="move_unit"&&n.movement?.movementMutationImplemented===!0,movementMutation:c==="move_unit",routeAuthority:!1,actionAuthority:!1,visualOnly:!0,readOnly:!0,source:o})};return(Array.isArray(n.commandHints)?n.commandHints:[]).filter(s=>s&&s.enabled!==!1).forEach(s=>{let a=String(s.commandId||""),o=Array.isArray(s.targetCellIds)?s.targetCellIds.map(c=>String(c||"")).filter(Boolean):[];if(a==="move_unit"){let c=Array.isArray(n.movement?.allowedTargetCellIds)?n.movement.allowedTargetCellIds.map(h=>String(h||"")).filter(Boolean):[];[...new Set([...o,...c])].forEach(h=>i(s,h,"movement"));return}o.forEach(c=>i(s,c,"command_hint"))}),Array.from(t.values())}function mx(n={},e={}){let t=ie(n.q,0)-ie(e.q,0),i=ie(n.r,0)-ie(e.r,0),r=ie(n.q,0)+ie(n.r,0)-(ie(e.q,0)+ie(e.r,0));return Math.max(Math.abs(t),Math.abs(i),Math.abs(r))}function gx(n={},e=new Map,t=[],i=[]){if(!n?.unitId||String(n.unitType||n.role||"").toLowerCase()!=="outpost_crew")return null;let r=String(n.location?.cellId||n.cellId||"").trim();if(!r)return null;let s=e.get(r);if(!s||!["discovered","known"].includes(String(s.fogState||""))||!`${s.kind||""} ${s.status||""} ${(Array.isArray(s.traits)?s.traits:[]).join(" ")}`.toLowerCase().includes("outpost"))return null;let o=new Map((Array.isArray(i)?i:[]).map((u,f)=>[String(u||""),f]).filter(([u])=>u)),c=t.filter(u=>String(u.fogState||"")==="hinted"&&String(u.kind||"")==="frontier_hint").filter(u=>u.readOnly!==!1).map(u=>{let f=String(u.sourceIds?.adjacentCellId||"")===r,d=o.has(String(u.cellId||""))?o.get(String(u.cellId||"")):Number.POSITIVE_INFINITY;return{cell:u,adjacentSource:f,adjacentGeometry:hh(s,u),distance:mx(s,u),preferredCommandIndex:d}}).filter(u=>u.adjacentSource||u.adjacentGeometry||Number.isFinite(u.distance));if(!c.length)return null;c.sort((u,f)=>{let d=Number.isFinite(u.preferredCommandIndex),p=Number.isFinite(f.preferredCommandIndex);return d!==p?d?-1:1:d&&u.preferredCommandIndex!==f.preferredCommandIndex?u.preferredCommandIndex-f.preferredCommandIndex:u.adjacentSource!==f.adjacentSource?u.adjacentSource?-1:1:u.adjacentGeometry!==f.adjacentGeometry?u.adjacentGeometry?-1:1:u.distance-f.distance});let h=c[0].cell;return{unitId:String(n.unitId||""),unitType:String(n.unitType||""),commandId:"scout_sector",cueLabel:"Next Scout",originCellId:r,targetCellId:String(h.cellId||""),targetFogState:String(h.fogState||""),targetKind:String(h.kind||""),derivedFrom:Number.isFinite(c[0].preferredCommandIndex)?"server_owned_scout_command_target":c[0].adjacentSource?"sourceIds.adjacentCellId":"nearest_visible_hinted_frontier_cell",visualOnly:!0,readOnly:!0,selectable:!1,routeAuthority:!1,actionAuthority:!1,executableActions:0,hiddenTruthLeakage:!1}}function _x(n=!1){let e=`expedition-outpost-next-frontier:${Gt}:${n?"selected":"idle"}`;if(le.has(e))return le.get(e);let t=document.createElement("canvas");t.width=256,t.height=256;let i=t.getContext("2d");i.clearRect(0,0,t.width,t.height),i.fillStyle=n?"rgba(245, 212, 132, 0.22)":"rgba(255, 226, 128, 0.16)",i.beginPath(),i.arc(128,128,112,0,Math.PI*2),i.fill(),i.strokeStyle=n?"rgba(245, 212, 132, 0.92)":"rgba(209, 154, 72, 0.76)",i.lineWidth=n?12:9,i.setLineDash([18,12]),i.beginPath(),i.arc(128,128,100,0,Math.PI*2),i.stroke(),i.setLineDash([]),i.strokeStyle="rgba(27, 106, 100, 0.58)",i.lineWidth=5,i.beginPath(),i.arc(128,128,70,0,Math.PI*2),i.stroke(),i.fillStyle="rgba(255, 248, 232, 0.86)",i.beginPath(),i.moveTo(128,70),i.lineTo(148,128),i.lineTo(128,186),i.lineTo(108,128),i.closePath(),i.fill(),i.strokeStyle="rgba(46, 27, 14, 0.42)",i.lineWidth=4,i.stroke(),i.fillStyle=n?"rgba(46, 27, 14, 0.72)":"rgba(46, 27, 14, 0.58)",i.font="900 20px sans-serif",i.textAlign="center",i.textBaseline="middle",i.fillText("NEXT",128,214);let r=new je(t);return r.colorSpace=De,r.minFilter=ce,r.magFilter=ce,le.set(e,r),r}function yx(n={},e={},t=!1){let i=e.positions?.get?.(String(n.originCellId||"")),r=e.positions?.get?.(String(n.targetCellId||""));if(!i||!r)return null;let s={x:(i.x+r.x)/2,y:(i.y+r.y)/2},a=.34+Math.min(2.2,Math.hypot(r.x-i.x,r.y-i.y))*.12,o=new fi(new R(i.x,i.y+.3,.485),new R(s.x,s.y+a,.485),new R(r.x,r.y+.02,.485)),c=new et().setFromPoints(o.getPoints(34)),h=new cn(c,new Ui({color:13736520,transparent:!0,opacity:t?.88:.68,dashSize:.12,gapSize:.09}));h.computeLineDistances(),h.userData={kind:"expedition_outpost_next_frontier_connection",...n};let u=new cn(c.clone(),new Ft({color:16110724,transparent:!0,opacity:t?.22:.14}));u.position.z=-.01,u.userData={kind:"expedition_outpost_next_frontier_connection_glow",...n};let f=new xt(new pt({map:_x(t),transparent:!0,depthWrite:!1,depthTest:!0,alphaTest:.03,opacity:t?.94:.82}));f.position.set(r.x,r.y+.03,.505),f.scale.set(t?1.22:1.08,t?1.22:1.08,1),f.userData={kind:"expedition_outpost_next_frontier_beacon",...n};let d=new mn;return d.add(u,h,f),d.userData={kind:"expedition_outpost_next_frontier_group",...n},{group:d,ring:f,line:h}}function xx(n,e="expedition-three-raycast"){let t=n?.userData||{};return{cellId:String(t.cellId||""),fogState:String(t.fogState||""),status:String(t.status||""),title:String(t.title||""),source:e,atMs:Date.now()}}var rh=class{constructor(e){this.hostNode=e,this.model={},this.cells=[],this.info={},this.pickables=[],this.cellMeshes=[],this.unitSprites=[],this.commandTargetSprites=[],this.outcomeFeedbackSprites=[],this.eventMarkerSprites=[],this.objectiveMarkerSprites=[],this.outpostFrontierBeaconSprites=[],this.generatedHudWorldCohesionSprites=[],this.generatedHudWorldCohesionLines=[],this.generatedHudChromeSprites=[],this.generatedHudProfileSprites=[],this.generatedHudTextSprites=[],this.generatedHudCommandSprites=[],this.frontierLedgerScratchSprites=[],this.frontierLedgerScratchTrailPips=[],this.frontierLedgerSystemLines=[],this.outcomeFeedback=null,this.hoverCellId="",this.terrainUnderlayCount=0,this.surveyStrokeCount=0,this.markerCount=0,this.unitTokenCount=0,this.commandTargetCount=0,this.outcomeFeedbackCount=0,this.eventMarkerCount=0,this.objectiveMarkerCount=0,this.outpostFrontierBeaconCount=0,this.generatedHudWorldCohesionCount=0,this.generatedHudWorldTetherCount=0,this.generatedHudChromeCount=0,this.generatedHudProfileCount=0,this.generatedHudTextCount=0,this.generatedHudCommandCount=0,this.frontierLedgerScratchSpriteCount=0,this.frontierLedgerScratchTrailPipCount=0,this.frontierLedgerSystemLineCount=0,this.scene=new yr,this.camera=new _i(-Kn/2,Kn/2,Jn/2,-Jn/2,.1,100),this.camera.position.set(0,0,10),this.camera.lookAt(0,0,0),this.raycaster=new wr,this.pointer=new xe,this.renderer=new As({antialias:!0,alpha:!1,preserveDrawingBuffer:!0}),this.renderer.setClearColor(2957590,1),this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),this.renderer.domElement.className="fp-expedition-three-canvas",this.renderer.domElement.dataset.testid="fp-expedition-three-canvas",this.renderer.domElement.setAttribute("aria-label","Zoomable private Expedition Map"),this.dragging=!1,this.dragMoved=!1,this.lastPointer=null,this.activePointers=new Map,this.pinchDistance=0,this.pinchZoom=1,this.mapBounds={minX:-1,maxX:1,minY:-1,maxY:1,centerX:0,centerY:0,width:2,height:2},this.onResize=this.onResize.bind(this),this.onWheel=this.onWheel.bind(this),this.onPointerDown=this.onPointerDown.bind(this),this.onPointerMove=this.onPointerMove.bind(this),this.onPointerUp=this.onPointerUp.bind(this),this.onPointerLeave=this.onPointerLeave.bind(this),this.onRegionTileAssetLoaded=()=>{le.clear(),this.rebuild(),this.render()},this.disposeRegionTileAssetListener=Oy(this.onRegionTileAssetLoaded),this.resizeObserver=new ResizeObserver(this.onResize),this.attach()}attach(){this.renderer.domElement.parentElement!==this.hostNode&&this.hostNode.appendChild(this.renderer.domElement),this.hostNode.addEventListener("wheel",this.onWheel,{passive:!1}),this.hostNode.addEventListener("pointerdown",this.onPointerDown),this.hostNode.addEventListener("pointermove",this.onPointerMove),this.hostNode.addEventListener("pointerup",this.onPointerUp),this.hostNode.addEventListener("pointercancel",this.onPointerUp),this.hostNode.addEventListener("pointerleave",this.onPointerLeave),this.resizeObserver.observe(this.hostNode),this.onResize()}dispose(){this.hostNode.removeEventListener("wheel",this.onWheel),this.hostNode.removeEventListener("pointerdown",this.onPointerDown),this.hostNode.removeEventListener("pointermove",this.onPointerMove),this.hostNode.removeEventListener("pointerup",this.onPointerUp),this.hostNode.removeEventListener("pointercancel",this.onPointerUp),this.hostNode.removeEventListener("pointerleave",this.onPointerLeave),this.disposeRegionTileAssetListener&&this.disposeRegionTileAssetListener(),this.resizeObserver.disconnect(),this.clearScene(),this.renderer.dispose(),this.renderer.domElement.remove()}clearScene(){this.scene.children.slice().forEach(t=>{this.scene.remove(t),t.traverse(i=>{if(i.geometry&&i.geometry.dispose(),i.material){let r=Array.isArray(i.material)?i.material:[i.material];for(let s of r)s.dispose()}})}),this.pickables=[],this.cellMeshes=[],this.unitSprites=[],this.commandTargetSprites=[],this.outcomeFeedbackSprites=[],this.eventMarkerSprites=[],this.objectiveMarkerSprites=[],this.outpostFrontierBeaconSprites=[],this.generatedHudWorldCohesionSprites=[],this.generatedHudWorldCohesionLines=[],this.generatedHudChromeSprites=[],this.generatedHudProfileSprites=[],this.generatedHudTextSprites=[],this.generatedHudCommandSprites=[],this.frontierLedgerScratchSprites=[],this.frontierLedgerScratchTrailPips=[],this.frontierLedgerSystemLines=[],this.terrainUnderlayCount=0,this.surveyStrokeCount=0,this.markerCount=0,this.unitTokenCount=0,this.commandTargetCount=0,this.outcomeFeedbackCount=0,this.eventMarkerCount=0,this.objectiveMarkerCount=0,this.outpostFrontierBeaconCount=0,this.generatedHudWorldCohesionCount=0,this.generatedHudWorldTetherCount=0,this.generatedHudChromeCount=0,this.generatedHudProfileCount=0,this.generatedHudTextCount=0,this.generatedHudCommandCount=0,this.frontierLedgerScratchSpriteCount=0,this.frontierLedgerScratchTrailPipCount=0,this.frontierLedgerSystemLineCount=0,this.edgeFogCount=0,this.civicBeaconCount=0}onResize(){let e=this.hostNode.getBoundingClientRect(),t=Math.max(1,Math.floor(e.width)),i=Math.max(1,Math.floor(e.height));this.renderer.setSize(t,i,!1);let r=t/i,s=Kn/Jn;if(r>=s){let a=Jn*r;this.camera.left=a/-2,this.camera.right=a/2,this.camera.top=Jn/2,this.camera.bottom=Jn/-2}else{let a=Kn/r;this.camera.left=Kn/-2,this.camera.right=Kn/2,this.camera.top=a/2,this.camera.bottom=a/-2}this.camera.zoom=Math.max(this.camera.zoom,this.preferredHudWorldZoom(t,i)),this.applyCameraBounds(),this.render()}preferredHudWorldZoom(e=0,t=0){let i=Math.max(.01,ie(e,0)/Math.max(1,ie(t,1)));return e<=430&&i<.62?1.52:e<=560&&i<.75?1.34:1}sync(e={},t="",i="",r=null){this.model=e&&typeof e=="object"?e:{},this.cells=Array.isArray(this.model.cells)?this.model.cells.filter(a=>a?.cellId):[],this.selectedCellId=String(t||this.selectedCellId||this.cells[0]?.cellId||"");let s=Array.isArray(this.model.units?.items)?this.model.units.items.filter(a=>a?.unitId):[];return this.selectedUnitId=String(i||this.selectedUnitId||s[0]?.unitId||""),this.outcomeFeedback=r&&typeof r=="object"?r:null,this.rebuild(),this.applyCameraBounds(),this.render(),this.info}rebuild(){this.clearScene();let e=Gd(this.cells);this.mapBounds=e.bounds;let t=new dt(new en(Kn*1.35,Jn*1.35),new Ot({map:Yy(),transparent:!1}));t.position.set(0,0,-.8),this.scene.add(t),this.terrainUnderlayCount=0;let i=qd(e),r=new dt(new en(i.width,i.height),new Ot({map:Ky(this.cells,e),transparent:!0,opacity:vd,depthWrite:!1}));r.position.set(i.centerX,i.centerY,-.62),r.userData={kind:"expedition_continuous_terrain_underlay",visualOnly:!0,serverOwnedCellsOnly:!0,hiddenTruthLeakage:!1},this.terrainUnderlayCount=1,this.scene.add(r);let s=Math.max(Kn,Jn),a=[];for(let _=-6;_<=6;_+=1){let E=_*.9;a.push(new R(-s,E,-.42),new R(s,E,-.42)),a.push(new R(E,-s,-.42),new R(E,s,-.42))}let o=new Sr(new et().setFromPoints(a),new Ft({color:7165496,transparent:!0,opacity:.13}));this.scene.add(o),this.edgeFogCount=0;let c=[{x:this.mapBounds.centerX,y:this.mapBounds.maxY+.52,rotation:0,width:this.mapBounds.width+2.9,kind:"soft"},{x:this.mapBounds.centerX,y:this.mapBounds.minY-.54,rotation:Math.PI,width:this.mapBounds.width+2.7,kind:"soft"},{x:this.mapBounds.minX-.56,y:this.mapBounds.centerY,rotation:Math.PI/2,width:this.mapBounds.height+2.5,kind:"locked"},{x:this.mapBounds.maxX+.62,y:this.mapBounds.centerY,rotation:-Math.PI/2,width:this.mapBounds.height+2.5,kind:"soft"}];for(let _ of c){let E=new dt(new en(_.width,.64),new Ot({map:Xy(_.kind),transparent:!0,opacity:_.kind==="locked"?.54:.42,depthWrite:!1}));E.position.set(_.x,_.y,-.26),E.rotation.z=_.rotation,this.edgeFogCount+=1,this.scene.add(E)}this.civicBeaconCount=0;let h=this.cells.filter(_=>["discovered","known"].includes(String(_.fogState||""))).slice(0,4);for(let _ of h){let E=e.positions.get(String(_.cellId||""));if(!E)continue;let T=new xt(new pt({map:Jy(),transparent:!0,opacity:String(_.kind||"")==="origin_plot"?.82:.56,depthWrite:!1}));T.position.set(E.x+.36,E.y+.28,.1),T.scale.set(.62,.62,1),T.userData={kind:"expedition_civic_beacon_cue",visualOnly:!0,routeAuthority:!1,cellId:String(_.cellId||"")},this.civicBeaconCount+=1,this.scene.add(T)}this.surveyStrokeCount=0;for(let _=0;_<this.cells.length;_+=1)for(let E=_+1;E<this.cells.length;E+=1){let T=this.cells[_],C=this.cells[E];if(!hh(T,C))continue;let S=ex(T,C,e);S&&(this.surveyStrokeCount+=1,this.scene.add(S))}let u=this.cells.filter(_=>!["discovered","known"].includes(String(_.fogState||"")));for(let _ of u){let E=e.positions.get(String(_.cellId||""));if(!E)continue;let T=String(_.fogState||"locked_unknown"),C=new dt(new en(T==="locked_unknown"?vn*2.06:vn*1.86,T==="locked_unknown"?vn*2.06:vn*1.86),new Ot({map:Gy(T==="locked_unknown"?"locked":"hinted"),transparent:!0,opacity:T==="locked_unknown"?.34:.42,depthWrite:!1}));C.position.set(E.x,E.y,.24),this.scene.add(C)}this.markerCount=0;for(let _ of this.cells){let E=e.positions.get(String(_.cellId||""))||{x:0,y:0},T=String(_.cellId||"")===this.selectedCellId,C=String(_.cellId||"")===this.hoverCellId,S=jy(_,E,T,C);this.scene.add(S),S.traverse(A=>{A.userData?.kind==="expedition_cell"&&(this.pickables.push(A),this.cellMeshes.push(A))}),this.markerCount+=1}let f=new Map(this.cells.map(_=>[String(_.cellId||""),_])),d=this.model.objective&&typeof this.model.objective=="object"?this.model.objective:null;this.eventMarkerCount=0;for(let _ of Hy(this.model)){let E=Yd(_),T=f.get(E),C=String(T?.fogState||"");if(!T||!["discovered","known"].includes(C))continue;let S=e.positions.get(E);if(!S)continue;let A=String(_.packetId||"")===String(d?.packetId||"")||String(E)===String(this.selectedCellId||""),L=Gi.event_packet,I=new xt(new pt({map:zy(_,A),transparent:!0,depthWrite:!1,depthTest:!0,alphaTest:.03}));I.position.set(S.x-.36,S.y+.35,.47),I.scale.set(A?.48:.4,A?.48:.4,1),I.userData={kind:"expedition_event_packet_marker",packetId:String(_.packetId||""),cellId:E,templateId:String(_.templateId||_.kind||""),spriteAssetSlot:String(L.slot||""),spriteAssetPath:String(L.path||""),spriteAssetReady:!!Nn(L),visualOnly:!0,readOnly:!0,selectable:!0,inspectable:!0,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.pickables.push(I),this.eventMarkerSprites.push(I),this.eventMarkerCount+=1,this.scene.add(I)}if(this.objectiveMarkerCount=0,d&&String(d.mode||"read")!=="read"&&d.targetCellId){let _=String(d.targetCellId||""),E=f.get(_),T=e.positions.get(_);if(E&&T){let C=_===String(this.selectedCellId||""),S=String(d.mode||"")==="packet"?Gi.event_packet:Gi.objective_beacon,A=new xt(new pt({map:Vy(d,C),transparent:!0,depthWrite:!1,depthTest:!0,alphaTest:.03}));A.position.set(T.x+.38,T.y+.41,.5),A.scale.set(C?.56:.48,C?.56:.48,1),A.userData={kind:"expedition_objective_marker",mode:String(d.mode||""),cellId:_,targetCellId:_,packetId:String(d.packetId||""),spriteAssetSlot:String(S.slot||""),spriteAssetPath:String(S.path||""),spriteAssetReady:!!Nn(S),visualOnly:!0,readOnly:!0,selectable:!0,inspectable:!0,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.pickables.push(A),this.objectiveMarkerSprites.push(A),this.objectiveMarkerCount=1,this.scene.add(A)}}let p=Array.isArray(this.model.units?.items)?this.model.units.items.filter(_=>_?.unitId):[],g=p.find(_=>String(_.unitId||"")===String(this.selectedUnitId||""))||null;this.outpostFrontierBeaconCount=0;let y=p.flatMap(_=>Od(_,f).filter(E=>E.commandId==="scout_sector").map(E=>E.cellId)),m=gx(g||{},f,this.cells,y);if(m){let _=yx(m,e,String(m.targetCellId||"")===String(this.selectedCellId||""));_?.group&&(this.outpostFrontierBeaconSprites.push(_.ring),this.outpostFrontierBeaconCount=1,this.scene.add(_.group))}this.commandTargetCount=0;let l=[];for(let _ of Od(g||{},f)){let E=e.positions.get(String(_.cellId||""));if(!E)continue;let T=new xt(new pt({map:fx(_),transparent:!0,depthWrite:!1,depthTest:!0,alphaTest:.03,opacity:_.commandId==="scout_sector"?.84:.76}));T.position.set(E.x,E.y+.05,.515);let C=_.commandId==="scout_sector"?1.12:1.02;T.scale.set(C,C,1),T.userData={kind:"expedition_command_target",unitId:_.unitId,unitType:_.unitType,commandId:_.commandId,cellId:_.cellId,fogState:_.fogState,serverMutationImplemented:_.serverMutationImplemented===!0,movementMutation:_.movementMutation===!0,visualOnly:!0,readOnly:!0,previewOnly:!0,selectable:!0,ringFirstOverlay:!0,interiorFillAlpha:0,tileLegibleOverlay:!0,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.pickables.push(T),this.commandTargetSprites.push(T),l.push({target:_,position:E}),this.commandTargetCount+=1,this.scene.add(T)}let b=this.outcomeFeedback;if(b?.cellId){let _=e.positions.get(String(b.cellId||""));if(_){let E=new xt(new pt({map:px(b),transparent:!0,depthWrite:!1,depthTest:!0,alphaTest:.03,opacity:.92}));E.position.set(_.x,_.y+.05,.535),E.scale.set(1.48,1.48,1),E.userData={kind:"expedition_command_outcome_feedback",feedbackId:String(b.feedbackId||""),commandId:String(b.commandId||""),unitId:String(b.unitId||""),unitType:String(b.unitType||""),cellId:String(b.cellId||""),targetCellId:String(b.targetCellId||b.cellId||""),sourceCellId:String(b.sourceCellId||""),receiptId:String(b.receiptId||""),receiptKind:String(b.receiptKind||""),serverOwnedResult:b.serverOwnedResult===!0,visualOnly:!0,readOnly:!0,selectable:!1,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.outcomeFeedbackSprites.push(E),this.outcomeFeedbackCount=1,this.scene.add(E)}}this.unitTokenCount=0;let v=p.reduce((_,E)=>{let T=String(E.location?.cellId||"");return T&&(_[T]||(_[T]=[]),_[T].push(E)),_},{});for(let[_,E]of Object.entries(v)){let T=e.positions.get(_);T&&E.forEach((C,S)=>{let A=String(C.unitId||"")===this.selectedUnitId,L=sl(C),I=!!Nn(L),N=S/Math.max(1,E.length)*Math.PI*2-Math.PI/2,G=E.length>1?.26:0,W=new xt(new pt({map:tx(C,A),transparent:!0,depthWrite:!1,depthTest:!0,alphaTest:.03}));W.position.set(T.x+Math.cos(N)*G,T.y+.44+Math.sin(N)*G*.36,.54+S*.01);let F=A?.72:.58;W.scale.set(F,F,1),W.userData={kind:"expedition_unit",unitId:String(C.unitId||""),unitType:String(C.unitType||""),displayName:String(C.displayName||""),cellId:_,spriteAssetSlot:String(L?.slot||""),spriteAssetPath:String(L?.path||""),spriteAssetReady:I,selectable:C.selectable!==!1,readOnly:C.readOnly!==!1,movementMutationImplemented:C.movement?.movementMutationImplemented===!0},this.pickables.push(W),this.unitSprites.push(W),this.unitTokenCount+=1,this.scene.add(W)})}this.addFrontierLedgerScratchCompositionLayer(e,g,l),this.addGeneratedHudWorldCohesionLayer(e),this.addGeneratedHudChromeLayer(),this.addGeneratedHudContentLayer(),this.updateInfo()}visibleSize(){return{width:Math.max(.01,(this.camera.right-this.camera.left)/this.camera.zoom),height:Math.max(.01,(this.camera.top-this.camera.bottom)/this.camera.zoom)}}addFrontierLedgerScratchCompositionLayer(e,t=null,i=[]){this.frontierLedgerScratchSprites=[],this.frontierLedgerScratchTrailPips=[],this.frontierLedgerSystemLines=[];let r=(c,h,u,f,d={})=>{let p=th(c)||{},g=Ty(c),y=null,m=g?.path?$c(g.path,()=>{y&&(y.userData.northStarHudAssetLoaded=!0),this.render()},()=>{y&&(y.material.map=h,y.material.needsUpdate=!0,y.userData.northStarHudAtlasFallback=!0,this.render())}):h;return y=new xt(new pt({map:m,transparent:!0,depthWrite:!1,depthTest:!1,opacity:u,alphaTest:.01})),y.renderOrder=f,y.userData={kind:"expedition_frontier_ledger_scratch_hud",layerVersion:el,systemVersion:Jo,slot:c,systemLayer:String(p.layer||"hud"),systemAnchor:String(p.anchor||"viewport"),systemSource:String(p.source||"viewport_slot_manifest"),northStarPath:bd,northStarHudAtlas:!!g,northStarHudAtlasPackId:g?Kc:"",northStarHudAssetPath:String(g?.path||""),northStarHudSourceCrop:g?.crop||null,presentationOpacity:u,visualOnly:!0,readOnly:!0,selectable:!1,routeAuthority:!1,actionAuthority:!1,executableActions:0,...d},this.frontierLedgerScratchSprites.push(y),this.scene.add(y),y};r("frontier-ledger-board-frame",Vi("board-frame"),Gc,810,{cameraAnchored:!0,compositionRole:"transparent_center_outer_hud_matte",outerChromeCutout:!0,centerTransparent:!0}),r("frontier-ledger-bottom-medallion-rail",Vi("bottom-medallion-rail"),1,888,{cameraAnchored:!0,compositionRole:"bottom_unit_medallion_rail"}),r("frontier-ledger-parcel-rangefinder-backplate",Vi("parcel-rangefinder-backplate"),1,894,{cameraAnchored:!0,compositionRole:"bottom_right_parcel_rangefinder"}),r("frontier-ledger-right-tab-shadow",Vi("right-ledger-tab"),1,886,{cameraAnchored:!0,compositionRole:"collapsed_right_edge_ledger"}),r("frontier-ledger-top-tabs-shadow",Vi("top-ledger-tabs"),1,887,{cameraAnchored:!0,compositionRole:"top_left_expedition_scout_crest"});let s=String(t?.location?.cellId||""),a=e.positions.get(s),o=i.find(c=>String(c.target?.commandId||"")==="scout_sector")||i.find(c=>String(c.target?.commandId||"")==="move_unit")||i[0];if(a&&o?.position){let c=o.position,h=c.x-a.x,u=c.y-a.y,f=Math.hypot(h,u),d=Math.sin(Math.PI*.5)*Ve(f*.12,.12,.38),p=new di([new R(a.x,a.y+.1,.715),new R(a.x+h*.52-u*.05*d,a.y+u*.52+Math.abs(h)*.04*d+d,.715),new R(c.x,c.y+.1,.715)]),g=new cn(new et().setFromPoints(p.getPoints(36)),new Ui({color:16045450,transparent:!0,opacity:.54,dashSize:.16,gapSize:.11,depthWrite:!1,depthTest:!1}));g.computeLineDistances(),g.renderOrder=706,g.userData={kind:"expedition_frontier_ledger_system_bridge",layerVersion:el,systemVersion:Jo,slot:"frontier-ledger-route-arc",systemLayer:"bridge",systemAnchor:"world",systemSource:"server_owned_command_target",unitId:String(t?.unitId||""),sourceCellId:s,targetCellId:String(o.target?.cellId||""),commandId:String(o.target?.commandId||""),previewOnly:!0,visualOnly:!0,readOnly:!0,selectable:!1,routeAuthority:!1,actionAuthority:!1,executableActions:0,hiddenTruthLeakage:!1},this.frontierLedgerSystemLines.push(g),this.scene.add(g);let y=Ve(Math.round(f*2.2),4,11);for(let l=1;l<=y;l+=1){let b=l/(y+1),v=Math.sin(b*Math.PI)*Ve(f*.12,.12,.38),_=a.x+h*b-u*.06*v,E=a.y+u*b+Math.abs(h)*.04*v+v,T=r("frontier-ledger-dotted-target-trail",Vi("trail-pip"),.88,708+l,{cameraAnchored:!1,compositionRole:"map_native_dotted_path_preview",unitId:String(t?.unitId||""),sourceCellId:s,targetCellId:String(o.target?.cellId||""),commandId:String(o.target?.commandId||""),previewOnly:!0,hiddenTruthLeakage:!1}),C=Ve(.07+l/y*.035,.07,.12);T.position.set(_,E+.1,.72+l*.001),T.scale.set(C,C,1),this.frontierLedgerScratchTrailPips.push(T)}let m=r("frontier-ledger-target-callout",Vi("target-callout"),.88,724,{cameraAnchored:!1,compositionRole:"map_native_target_callout_preview",unitId:String(t?.unitId||""),sourceCellId:s,targetCellId:String(o.target?.cellId||""),commandId:String(o.target?.commandId||""),previewOnly:!0,hiddenTruthLeakage:!1});m.position.set(c.x,c.y+Ve(f*.3,.7,1.08),.755),m.scale.set(Ve(f*.28,.86,1.2),Ve(f*.12,.36,.48),1)}this.frontierLedgerScratchSpriteCount=this.frontierLedgerScratchSprites.length,this.frontierLedgerScratchTrailPipCount=this.frontierLedgerScratchTrailPips.length,this.frontierLedgerSystemLineCount=this.frontierLedgerSystemLines.length,this.syncFrontierLedgerScratchSprites()}syncFrontierLedgerScratchSprites(){if(!this.frontierLedgerScratchSprites.length)return;let e=this.visibleSize(),t=Number(this.renderer.domElement?.clientWidth||0)<=520;this.frontierLedgerScratchSprites.forEach(i=>{if(i.userData?.cameraAnchored===!1)return;let r=String(i.userData?.slot||""),s=th(r);if(s?.anchor==="viewport"){let a=wd(r,e,this.camera.position,t),o=r==="frontier-ledger-board-frame"?3.82:r==="frontier-ledger-bottom-medallion-rail"?4.1:4.14;i.position.set(a.x,a.y,o),i.scale.set(a.width,a.height,1);let c=i.userData?.northStarHudSourceCrop||null;i.userData.viewportBounds={x:a.x,y:a.y,width:a.width,height:a.height,left:a.left,right:a.right,top:a.top,bottom:a.bottom},i.userData.renderedAspectRatio=a.height>0?a.width/a.height:0;let h=Number(this.renderer.domElement?.clientWidth||this.renderer.domElement?.width||0),u=Number(this.renderer.domElement?.clientHeight||this.renderer.domElement?.height||0),f=e.width>0?a.width/e.width*h:0,d=e.height>0?a.height/e.height*u:0;i.userData.renderedPixelAspectRatio=d>0?f/d:0,i.userData.sourceAspectRatio=c?.height>0?Number(c.width||0)/Number(c.height||1):0,i.userData.mobileViewportOverride=t&&!!s.mobile}})}addGeneratedHudWorldCohesionLayer(e){this.generatedHudWorldCohesionSprites=[],this.generatedHudWorldCohesionLines=[];let t=(r,s,a,o)=>{let c=new xt(new pt({map:s,transparent:!0,depthWrite:!1,depthTest:!1,opacity:a,alphaTest:.01}));return c.renderOrder=o,c.userData={kind:"expedition_generated_hud_world_cohesion",layerVersion:Rs,slot:r,presentationOpacity:a,sourceChromeDemoted:r==="bottom-foreground-bridge",visualOnly:!0,readOnly:!0,selectable:!1,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.generatedHudWorldCohesionSprites.push(c),this.scene.add(c),c};t("map-depth-veil",Yc("depth-veil"),.1,860),t("bottom-foreground-bridge",Yc("bottom-bridge"),Wc,872);let i=e.positions.get(String(this.selectedCellId||""));if(i){let r=t("selected-world-aura",Yc("selected-aura"),.64,884);r.userData.cellId=String(this.selectedCellId||""),r.userData.worldX=i.x,r.userData.worldY=i.y;let s=new cn(new et().setFromPoints([new R(i.x,i.y,4.12),new R(i.x,i.y,4.12)]),new Ft({color:16110724,transparent:!0,opacity:.5,depthWrite:!1,depthTest:!1}));s.renderOrder=892,s.userData={kind:"expedition_generated_hud_world_tether",layerVersion:Rs,slot:"selected-context-tether",cellId:String(this.selectedCellId||""),startWorldX:i.x,startWorldY:i.y,targetSlot:"selected-context",visualOnly:!0,readOnly:!0,selectable:!1,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.generatedHudWorldCohesionLines.push(s),this.scene.add(s)}this.generatedHudWorldCohesionCount=this.generatedHudWorldCohesionSprites.length+this.generatedHudWorldCohesionLines.length,this.generatedHudWorldTetherCount=this.generatedHudWorldCohesionLines.length,this.syncGeneratedHudWorldCohesionSprites()}syncGeneratedHudWorldCohesionSprites(){if(!this.generatedHudWorldCohesionSprites.length&&!this.generatedHudWorldCohesionLines.length)return;let e=this.visibleSize(),t=this.camera.position.y-e.height/2;this.generatedHudWorldCohesionSprites.forEach(r=>{let s=String(r.userData?.slot||"");if(s==="map-depth-veil")r.position.set(this.camera.position.x,this.camera.position.y,4.02),r.scale.set(e.width*1.04,e.height*1.04,1);else if(s==="bottom-foreground-bridge"){let a=Ve(e.height*.3,1.34,2.44);r.position.set(this.camera.position.x,t+a/2,4.06),r.scale.set(e.width*1.02,a,1)}else s==="selected-world-aura"&&(r.position.set(ie(r.userData?.worldX,0),ie(r.userData?.worldY,0)+.08,.66),r.scale.set(1.54,1.54,1))});let i=this.generatedHudBoundsForSlot("selected-context");this.generatedHudWorldCohesionLines.forEach(r=>{let s=ie(r.userData?.startWorldX,0),a=ie(r.userData?.startWorldY,0)+.1,o=i.left+i.width*.08,c=i.top-i.height*.5,h=s+(o-s)*.56,u=Math.max(a,c)+Math.abs(o-s)*.035,f=new di([new R(s,a,4.12),new R(h,u,4.12),new R(o,c,4.12)]);r.geometry.dispose(),r.geometry=new et().setFromPoints(f.getPoints(28)),r.userData.startCanvas={x:s,y:a},r.userData.endCanvas={x:o,y:c}})}addGeneratedHudChromeLayer(){this.generatedHudChromeSprites=[],Vd(this.model).forEach((t,i)=>{let r=Ey(t.slot,t.opacity),s=cx(t);if(!s)return;let a=new xt(new pt({map:s,transparent:!0,depthWrite:!1,depthTest:!1,opacity:Ve(ie(r.opacity,.72)*1.18,.001,.94),alphaTest:.02}));a.renderOrder=900+i,a.userData={kind:"expedition_generated_hud_chrome",packId:String(t.packId||this.model.generatedHudChrome?.packId||Cs),slot:String(t.slot||""),assetPath:String(t.path||""),anchor:String(t.anchor||""),widthRatio:ie(t.widthRatio,.2),heightRatio:ie(t.heightRatio,.16),marginX:ie(t.marginX,.02),marginY:ie(t.marginY,.02),assetReady:!0,cleanCompositeVersion:xd,materialityVersion:sn,materialProfile:"procedural_beveled_metal_parchment_frame",frontierLedgerPresentationVersion:r.presentationVersion,frontierLedgerPresentationRole:r.role,frontierLedgerSuppressed:r.suppressed,presentationOpacity:ie(r.opacity,.82),chromeSource:"three_canvas_clean_frame",sourceAssetPath:String(t.path||""),liveTextSource:"dom",visualOnly:!0,readOnly:!0,selectable:!1,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.generatedHudChromeSprites.push(a),this.scene.add(a)}),this.generatedHudChromeCount=this.generatedHudChromeSprites.length,this.syncGeneratedHudChromeSprites()}generatedHudBoundsForData(e={}){let t=this.visibleSize(),i=this.camera.position.x-t.width/2,r=this.camera.position.x+t.width/2,s=this.camera.position.y+t.height/2,a=this.camera.position.y-t.height/2,o=Ve(ie(e.widthRatio,.2)*t.width,.35,t.width*.88),c=Ve(ie(e.heightRatio,.16)*t.height,.26,t.height*.8),h=ie(e.marginX,.02)*t.width,u=ie(e.marginY,.02)*t.height,f=i+h+o/2,d=s-u-c/2;return e.anchor==="bottom-left"?d=a+u+c/2:e.anchor==="bottom-right"?(f=r-h-o/2,d=a+u+c/2):e.anchor==="right"?(f=r-h-o/2,d=s-u-c/2):e.anchor==="selected-command"&&(f=this.camera.position.x+t.width*.18,d=a+t.height*.28),{x:f,y:d,width:o,height:c,left:f-o/2,right:f+o/2,top:d+c/2,bottom:d-c/2}}generatedHudBoundsForSlot(e=""){let t=this.generatedHudChromeSprites.find(r=>String(r.userData?.slot||"")===String(e||""));if(t)return this.generatedHudBoundsForData(t.userData||{});let i=by(e,this.model)||{};return this.generatedHudBoundsForData(i)}syncGeneratedHudChromeSprites(){this.generatedHudChromeSprites.length&&this.generatedHudChromeSprites.forEach(e=>{let t=this.generatedHudBoundsForData(e.userData||{});e.position.set(t.x,t.y,4.25),e.scale.set(t.width,t.height,1)})}addGeneratedHudContentLayer(){this.generatedHudProfileSprites=[],this.generatedHudTextSprites=[],this.generatedHudCommandSprites=[];let e=Array.isArray(this.model.units?.items)?this.model.units.items.filter(f=>f?.unitId).slice(0,6):[],t=e.find(f=>String(f.unitId||"")===String(this.selectedUnitId||""))||e[0]||null;e.forEach((f,d)=>{let p=String(f.unitId||"")===String(t?.unitId||""),g=sl(f),y=new xt(new pt({map:ix(f,p,{sourceChrome:!0}),transparent:!0,depthWrite:!1,depthTest:!1,alphaTest:.04}));y.renderOrder=940+d,y.userData={kind:"expedition_generated_hud_profile_mask",layerVersion:zc,materialityVersion:sn,slot:"unit-profile",unitId:String(f.unitId||""),unitType:String(f.unitType||""),displayName:String(f.displayName||""),profileMask:"circle_alpha_clip",profileSource:"north_star_source_rail_portrait_insert",sourceChromeCompositionVersion:Vc,spriteAssetSlot:String(g?.slot||""),spriteAssetPath:String(g?.path||""),spriteAssetReady:!!Nn(g),visualOnly:!0,readOnly:!0,selectable:!1,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.generatedHudProfileSprites.push(y),this.scene.add(y)}),this.generatedHudProfileCount=this.generatedHudProfileSprites.length;let i=Array.isArray(this.model.cells)?this.model.cells:[],r=i.find(f=>String(f.cellId||"")===String(this.selectedCellId||""))||i[0]||{},s=i.filter(f=>["known","discovered"].includes(String(f.fogState||""))).length,a=i.length-s,o=this.model.objective&&typeof this.model.objective=="object"?this.model.objective:{},c=t?nx(t):0;[{slot:"crest-status",title:"EXPEDITION",meta:`${s} MAP / ${a} FOG`,tone:"light"},{slot:"objective-loop",title:rx(this.model),meta:o.targetCellId?Ld(o.targetCellId):"READY",tone:"dark"},{slot:"unit-dock",title:`${e.length} UNITS`,meta:t?Is(t):"SELECT",tone:"dark"},{slot:"command-puck",title:c?`${c} CMD`:"CMD",meta:t?Is(t):"READY",tone:"light"},{slot:"selected-context",title:Ld(r.cellId||this.selectedCellId),meta:String(r.fogState||"sector").replace(/_/g," "),tone:"light"}].forEach((f,d)=>{let p=Ad(f.slot,.88),g=new xt(new pt({map:lx(f),transparent:!0,depthWrite:!1,depthTest:!1,opacity:Ve(p.opacity,.001,.88),alphaTest:.03}));g.renderOrder=960+d,g.userData={kind:"expedition_generated_hud_text",layerVersion:zc,materialityVersion:sn,slot:String(f.slot||""),title:String(f.title||""),meta:String(f.meta||""),liveTextSource:"three_canvas_texture",domA11yOverlayRetained:!0,frontierLedgerPresentationVersion:p.presentationVersion,frontierLedgerPresentationRole:p.role,frontierLedgerSuppressed:p.suppressed,presentationOpacity:ie(p.opacity,.88),visualOnly:!0,readOnly:!0,selectable:!1,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.generatedHudTextSprites.push(g),this.scene.add(g)}),this.generatedHudTextCount=this.generatedHudTextSprites.length,(t?sx(t):[]).forEach((f,d)=>{let p=Ad("command-tray",f.enabled===!1?.58:.92),g=new xt(new pt({map:ox(f),transparent:!0,depthWrite:!1,depthTest:!1,opacity:Ve(p.opacity,.001,f.enabled===!1?.58:.92),alphaTest:.04}));g.renderOrder=980+d,g.userData={kind:"expedition_generated_hud_command_glyph",layerVersion:Sd,materialityVersion:sn,slot:"command-tray",commandId:String(f.commandId||""),label:String(f.label||""),glyph:String(f.glyph||""),enabled:f.enabled!==!1,liveSource:"server_owned_command_hint",frontierLedgerPresentationVersion:p.presentationVersion,frontierLedgerPresentationRole:p.role,frontierLedgerSuppressed:p.suppressed,presentationOpacity:ie(p.opacity,f.enabled===!1?.58:.92),visualOnly:!0,readOnly:!0,selectable:!1,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.generatedHudCommandSprites.push(g),this.scene.add(g)}),this.generatedHudCommandCount=this.generatedHudCommandSprites.length,this.syncGeneratedHudContentSprites()}syncGeneratedHudContentSprites(){let e=this.generatedHudBoundsForSlot("unit-dock"),t=this.generatedHudProfileSprites,i=Number(this.renderer?.domElement?.clientWidth||this.hostNode?.clientWidth||0)<=520;t.length&&t.forEach((a,o)=>{let c=this.frontierLedgerUnitDockSourceSlot(o,i);if(c)a.position.set(c.x,c.y,4.5+o*.004),a.scale.set(c.size,c.size,1),a.userData.sourceChromeDockSlotIndex=c.index,a.userData.sourceChromeDockSlotSourceX=c.sourceX,a.userData.sourceChromeDockSlotSourceY=c.sourceY,a.userData.sourceChromeDockSlotMode="north_star_bottom_rail_aperture";else{let h=i?Ve(Math.min(e.height*.66,e.width/Math.max(4.2,t.length+1.4)),.46,.76):Ve(Math.min(e.height*.62,e.width/Math.max(4.7,t.length+1.3)),.5,.96),u=i?Ve(e.width*.145,h*1.08,h*1.48):Ve(e.width*.118,h*1.1,h*1.58),f=e.left+e.width*(i?.38:.3),d=e.bottom+e.height*(i?.58:.56);a.position.set(f+o*u,d,4.5+o*.004),a.scale.set(h,h,1),a.userData.sourceChromeDockSlotIndex=-1,a.userData.sourceChromeDockSlotMode="legacy_unit_dock_fallback"}}),this.generatedHudTextSprites.forEach(a=>{let o=String(a.userData?.slot||""),c=this.generatedHudBoundsForSlot(o),h=c.width*.48,u=c.height*.46,f=c.left+c.width*.42,d=c.top-c.height*.5,p=c.width,g=c.height;o==="crest-status"?(h=c.width*.54,u=c.height*.48,f=c.left+c.width*.62,d=c.top-c.height*.5):o==="objective-loop"?(h=c.width*.68,u=c.height*.52,f=c.left+c.width*.54,d=c.top-c.height*.5):o==="unit-dock"?(h=c.width*(i?.35:.25),u=c.height*.42,f=c.left+c.width*(i?.31:.15),d=c.bottom+c.height*.57):o==="command-puck"?(c=this.generatedHudBoundsForSlot("command-tray"),h=c.width*(i?.38:.36),u=c.height*.54,f=c.left+c.width*(i?.66:.7),d=c.top-c.height*.48,p=c.width*.74,g=c.height*.78):o==="selected-context"&&(h=c.width*.72,u=c.height*.6,f=c.left+c.width*.56,d=c.top-c.height*.5),a.position.set(f,d,4.62),a.scale.set(Ve(h,.58,p),Ve(u,.24,g),1)});let r=this.generatedHudBoundsForSlot("command-tray"),s=this.generatedHudCommandSprites;if(s.length){let a=i?Ve(Math.min(r.height*.34,r.width/Math.max(6.4,s.length+2.8)),.24,.4):Ve(Math.min(r.height*.34,r.width/Math.max(6.8,s.length+3)),.26,.46),o=Ve(r.width/Math.max(7.8,s.length+3.6),a*1.04,a*1.34),c=r.left+r.width*(i?.17:.2),h=r.bottom+r.height*(i?.35:.34);s.forEach((u,f)=>{u.position.set(c+f*o,h,4.72+f*.004),u.scale.set(a,a,1)})}}frontierLedgerUnitDockSourceSlot(e=0,t=!1){let i=Md[e];if(!i)return null;let r=this.visibleSize(),s=wd("frontier-ledger-bottom-medallion-rail",r,this.camera.position,t),a=i.sourceX/zi.width,o=(i.sourceY-650)/291,c=s.left+s.width*a,h=s.top-s.height*o,u=i.sourceRadius*(i.primary?1.78:1.72),f=Ve(s.width*(u/zi.width),.54,t?.78:1.08);return{index:i.index,sourceX:i.sourceX,sourceY:i.sourceY,x:c,y:h,size:f}}applyCameraBounds(){let t=this.visibleSize(),i=this.mapBounds.minX-.85,r=this.mapBounds.maxX+.85,s=this.mapBounds.minY-.85,a=this.mapBounds.maxY+.85,o=Math.max(.01,r-i),c=Math.max(.01,a-s);this.camera.position.x=t.width>=o?(i+r)/2:Ve(this.camera.position.x,i+t.width/2,r-t.width/2),this.camera.position.y=t.height>=c?(s+a)/2:Ve(this.camera.position.y,s+t.height/2,a-t.height/2),this.camera.zoom=Ve(this.camera.zoom,.85,3.4),this.camera.updateProjectionMatrix()}setZoom(e){this.camera.zoom=Ve(e,.85,3.4),this.applyCameraBounds(),this.render(),this.notifyViewChange()}resetView(){let e=this.hostNode.getBoundingClientRect();this.camera.zoom=this.preferredHudWorldZoom(e.width,e.height),this.camera.position.x=this.mapBounds.centerX,this.camera.position.y=this.mapBounds.centerY,this.applyCameraBounds(),this.render(),this.notifyViewChange()}panBy(e,t){let i=this.renderer.domElement.getBoundingClientRect(),r=this.visibleSize();this.camera.position.x-=e/Math.max(1,i.width)*r.width,this.camera.position.y+=t/Math.max(1,i.height)*r.height,this.applyCameraBounds(),this.render(),this.notifyViewChange()}notifyViewChange(){this.hostNode.dispatchEvent(new CustomEvent("founders-plot-expedition-map-view-change"))}onWheel(e){e.preventDefault();let t=e.deltaY<0?1.13:1/1.13;this.setZoom(this.camera.zoom*t)}onPointerDown(e){this.activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});try{this.hostNode.setPointerCapture?.(e.pointerId)}catch{}if(this.dragging=!0,this.dragMoved=!1,this.lastPointer={x:e.clientX,y:e.clientY},this.hostNode.dataset.dragging="true",this.activePointers.size>=2){let t=Array.from(this.activePointers.values());this.pinchDistance=Math.hypot(t[0].x-t[1].x,t[0].y-t[1].y),this.pinchZoom=this.camera.zoom}}onPointerMove(e){if(!this.activePointers.has(e.pointerId)){this.setHoverFromPoint(e.clientX,e.clientY);return}let t=this.activePointers.get(e.pointerId);if(this.activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY}),this.activePointers.size>=2){let s=Array.from(this.activePointers.values()),a=Math.hypot(s[0].x-s[1].x,s[0].y-s[1].y);this.pinchDistance>0&&this.setZoom(this.pinchZoom*(a/this.pinchDistance)),this.dragMoved=!0;return}let i=e.clientX-t.x,r=e.clientY-t.y;Math.abs(i)+Math.abs(r)>1&&(this.dragMoved=this.dragMoved||Math.abs(e.clientX-(this.lastPointer?.x||e.clientX))+Math.abs(e.clientY-(this.lastPointer?.y||e.clientY))>4,this.panBy(i,r))}onPointerLeave(){this.setHoverCell("")}onPointerUp(e){let t=this.dragging&&!this.dragMoved&&this.activePointers.size<=1;this.activePointers.delete(e.pointerId);try{this.hostNode.releasePointerCapture?.(e.pointerId)}catch{}if(this.dragging=this.activePointers.size>0,this.dragging||(delete this.hostNode.dataset.dragging,this.pinchDistance=0),t){let i=this.pickFromPoint(e.clientX,e.clientY);if(i)if(i.userData?.kind==="expedition_unit"){let r=hx(i);this.selectedUnitId=r.unitId,r.cellId&&(this.selectedCellId=r.cellId),r.cellId&&this.setHoverCell(r.cellId),window.dispatchEvent(new CustomEvent("founders-plot-expedition-unit-select",{detail:r}))}else if(["expedition_event_packet_marker","expedition_objective_marker"].includes(String(i.userData?.kind||""))){let r=ux(i);r.cellId&&(this.selectedCellId=r.cellId),r.cellId&&this.setHoverCell(r.cellId),window.dispatchEvent(new CustomEvent("founders-plot-expedition-map-select",{detail:r}))}else if(i.userData?.kind==="expedition_command_target"){let r=dx(i);r.cellId&&(this.selectedCellId=r.cellId),r.cellId&&this.setHoverCell(r.cellId),window.dispatchEvent(new CustomEvent("founders-plot-expedition-command-target-preview",{detail:r}))}else{let r=xx(i);this.selectedCellId=r.cellId,this.setHoverCell(r.cellId),window.dispatchEvent(new CustomEvent("founders-plot-expedition-map-select",{detail:r}))}}}setHoverFromPoint(e,t){let i=this.pickFromPoint(e,t);this.setHoverCell(i?.userData?.cellId||i?.userData?.targetCellId||"")}setHoverCell(e=""){let t=String(e||"");t!==this.hoverCellId&&(this.hoverCellId=t,t?this.hostNode.dataset.hoverCellId=t:delete this.hostNode.dataset.hoverCellId,this.rebuild(),this.render())}pickFromPoint(e,t){let i=this.renderer.domElement.getBoundingClientRect();return this.pointer.x=(e-i.left)/i.width*2-1,this.pointer.y=-((t-i.top)/i.height)*2+1,this.raycaster.setFromCamera(this.pointer,this.camera),this.raycaster.intersectObjects(this.pickables,!1)[0]?.object||null}canvasPointForCell(e){let t=this.cellMeshes.find(i=>String(i.userData?.cellId||"")===String(e||""));return t?this.canvasPointForObject(t):null}canvasPointForObject(e){if(!e)return null;let t=new R;e.getWorldPosition(t),t.project(this.camera);let i=this.renderer.domElement.getBoundingClientRect();return{x:(t.x+1)/2*i.width,y:(-t.y+1)/2*i.height}}updateInfo(){this.syncFrontierLedgerScratchSprites(),this.syncGeneratedHudWorldCohesionSprites(),this.syncGeneratedHudChromeSprites(),this.syncGeneratedHudContentSprites();let e=this.renderer.domElement,t=Array.isArray(this.model.units?.items)?this.model.units.items.filter(l=>l?.unitId):[],i=this.cells.map(l=>{let b=String(l.fogState||"locked_unknown"),v=Qn(l),_=Py(l),E=lh(l,v),T=Nn(E),C=tl(l,v),S=Us(l),A=wi(l)?null:oh(l);return{cellId:String(l.cellId||""),fogState:b,siteType:String(l.siteType||""),kind:String(l.kind||""),publicTerrainText:_,publicTerrainAssetSlot:S,publicTerrainAssetSlotSource:String(l.publicTerrainAssetSlotSource||""),publicTerrainAssetSlotReason:String(l.publicTerrainAssetSlotReason||""),fogAssetSlot:A,terrainAssetContractVersion:String(l.terrainAssetContractVersion||""),terrain:v,runtimeAssetPack:yd,assetSlot:E?.slot||null,assetPath:E?.path||null,assetKind:E?.assetKind||null,fogOnly:E?.fogOnly===!0,assetReady:!!T,assetAllowedByServerTruth:Ly(l,v,E),underlayTerrain:C.terrain,underlayFogOnly:C.fogOnly===!0,waterCue:v==="water",ruinSignalCue:v==="ruin_signal",hiddenSpecificitySuppressed:!wi(l)&&v===b}}),r=Array.from(new Map([...Object.values(zd),...Object.values(Gi)].map(l=>[l.path,l])).values()),s=r.filter(l=>!!cl(l)).length,a=this.generatedHudWorldCohesionSprites.map(l=>({slot:String(l.userData?.slot||""),layerVersion:String(l.userData?.layerVersion||""),cellId:String(l.userData?.cellId||""),visualOnly:l.userData?.visualOnly===!0,readOnly:l.userData?.readOnly===!0,selectable:l.userData?.selectable===!0,routeAuthority:l.userData?.routeAuthority===!0,actionAuthority:l.userData?.actionAuthority===!0,executableActions:Number(l.userData?.executableActions||0),presentationOpacity:Number(l.userData?.presentationOpacity??1),sourceChromeDemoted:l.userData?.sourceChromeDemoted===!0,canvas:this.canvasPointForObject(l)})),o=this.generatedHudWorldCohesionLines.map(l=>({slot:String(l.userData?.slot||""),layerVersion:String(l.userData?.layerVersion||""),cellId:String(l.userData?.cellId||""),targetSlot:String(l.userData?.targetSlot||""),visualOnly:l.userData?.visualOnly===!0,readOnly:l.userData?.readOnly===!0,selectable:l.userData?.selectable===!0,routeAuthority:l.userData?.routeAuthority===!0,actionAuthority:l.userData?.actionAuthority===!0,executableActions:Number(l.userData?.executableActions||0),startCanvas:l.userData?.startCanvas||null,endCanvas:l.userData?.endCanvas||null})),c=this.generatedHudChromeSprites.map(l=>({slot:String(l.userData?.slot||""),packId:String(l.userData?.packId||""),assetPath:String(l.userData?.assetPath||""),anchor:String(l.userData?.anchor||""),assetReady:l.userData?.assetReady===!0,cleanCompositeVersion:String(l.userData?.cleanCompositeVersion||""),materialityVersion:String(l.userData?.materialityVersion||""),materialProfile:String(l.userData?.materialProfile||""),frontierLedgerPresentationVersion:String(l.userData?.frontierLedgerPresentationVersion||""),frontierLedgerPresentationRole:String(l.userData?.frontierLedgerPresentationRole||""),frontierLedgerSuppressed:l.userData?.frontierLedgerSuppressed===!0,presentationOpacity:Number(l.userData?.presentationOpacity??1),chromeSource:String(l.userData?.chromeSource||""),sourceAssetPath:String(l.userData?.sourceAssetPath||""),liveTextSource:String(l.userData?.liveTextSource||""),visualOnly:l.userData?.visualOnly===!0,readOnly:l.userData?.readOnly===!0,selectable:l.userData?.selectable===!0,routeAuthority:l.userData?.routeAuthority===!0,actionAuthority:l.userData?.actionAuthority===!0,executableActions:Number(l.userData?.executableActions||0),canvas:this.canvasPointForObject(l)})),h=this.generatedHudProfileSprites.map(l=>({slot:String(l.userData?.slot||""),layerVersion:String(l.userData?.layerVersion||""),unitId:String(l.userData?.unitId||""),unitType:String(l.userData?.unitType||""),profileMask:String(l.userData?.profileMask||""),profileSource:String(l.userData?.profileSource||""),sourceChromeCompositionVersion:String(l.userData?.sourceChromeCompositionVersion||""),sourceChromeDockSlotIndex:Number(l.userData?.sourceChromeDockSlotIndex??-1),sourceChromeDockSlotSourceX:Number(l.userData?.sourceChromeDockSlotSourceX||0),sourceChromeDockSlotSourceY:Number(l.userData?.sourceChromeDockSlotSourceY||0),sourceChromeDockSlotMode:String(l.userData?.sourceChromeDockSlotMode||""),materialityVersion:String(l.userData?.materialityVersion||""),spriteAssetSlot:String(l.userData?.spriteAssetSlot||""),spriteAssetPath:String(l.userData?.spriteAssetPath||""),spriteAssetReady:l.userData?.spriteAssetReady===!0,visualOnly:l.userData?.visualOnly===!0,readOnly:l.userData?.readOnly===!0,selectable:l.userData?.selectable===!0,routeAuthority:l.userData?.routeAuthority===!0,actionAuthority:l.userData?.actionAuthority===!0,executableActions:Number(l.userData?.executableActions||0),canvas:this.canvasPointForObject(l)})),u=this.generatedHudTextSprites.map(l=>({slot:String(l.userData?.slot||""),layerVersion:String(l.userData?.layerVersion||""),title:String(l.userData?.title||""),meta:String(l.userData?.meta||""),liveTextSource:String(l.userData?.liveTextSource||""),materialityVersion:String(l.userData?.materialityVersion||""),domA11yOverlayRetained:l.userData?.domA11yOverlayRetained===!0,frontierLedgerPresentationVersion:String(l.userData?.frontierLedgerPresentationVersion||""),frontierLedgerPresentationRole:String(l.userData?.frontierLedgerPresentationRole||""),frontierLedgerSuppressed:l.userData?.frontierLedgerSuppressed===!0,presentationOpacity:Number(l.userData?.presentationOpacity??1),visualOnly:l.userData?.visualOnly===!0,readOnly:l.userData?.readOnly===!0,selectable:l.userData?.selectable===!0,routeAuthority:l.userData?.routeAuthority===!0,actionAuthority:l.userData?.actionAuthority===!0,executableActions:Number(l.userData?.executableActions||0),canvas:this.canvasPointForObject(l)})),f=this.generatedHudCommandSprites.map(l=>({slot:String(l.userData?.slot||""),layerVersion:String(l.userData?.layerVersion||""),commandId:String(l.userData?.commandId||""),label:String(l.userData?.label||""),glyph:String(l.userData?.glyph||""),enabled:l.userData?.enabled!==!1,liveSource:String(l.userData?.liveSource||""),materialityVersion:String(l.userData?.materialityVersion||""),frontierLedgerPresentationVersion:String(l.userData?.frontierLedgerPresentationVersion||""),frontierLedgerPresentationRole:String(l.userData?.frontierLedgerPresentationRole||""),frontierLedgerSuppressed:l.userData?.frontierLedgerSuppressed===!0,presentationOpacity:Number(l.userData?.presentationOpacity??1),visualOnly:l.userData?.visualOnly===!0,readOnly:l.userData?.readOnly===!0,selectable:l.userData?.selectable===!0,routeAuthority:l.userData?.routeAuthority===!0,actionAuthority:l.userData?.actionAuthority===!0,executableActions:Number(l.userData?.executableActions||0),canvas:this.canvasPointForObject(l)})),d=this.frontierLedgerScratchSprites.map(l=>{let b=l.userData?.northStarHudSourceCrop||null,v=l.scale?.y>0?l.scale.x/l.scale.y:0,_=Number(l.userData?.renderedAspectRatio||v||0),E=Number(l.userData?.renderedPixelAspectRatio||_||0);return{slot:String(l.userData?.slot||""),layerVersion:String(l.userData?.layerVersion||""),systemVersion:String(l.userData?.systemVersion||""),systemLayer:String(l.userData?.systemLayer||""),systemAnchor:String(l.userData?.systemAnchor||""),systemSource:String(l.userData?.systemSource||""),compositionRole:String(l.userData?.compositionRole||""),northStarPath:String(l.userData?.northStarPath||""),unitId:String(l.userData?.unitId||""),sourceCellId:String(l.userData?.sourceCellId||""),targetCellId:String(l.userData?.targetCellId||""),commandId:String(l.userData?.commandId||""),cameraAnchored:l.userData?.cameraAnchored!==!1,northStarHudAtlas:l.userData?.northStarHudAtlas===!0,northStarHudAtlasPackId:String(l.userData?.northStarHudAtlasPackId||""),northStarHudAssetPath:String(l.userData?.northStarHudAssetPath||""),northStarHudAssetLoaded:l.userData?.northStarHudAssetLoaded===!0,northStarHudAtlasFallback:l.userData?.northStarHudAtlasFallback===!0,northStarHudSourceCrop:b,presentationOpacity:Number(l.userData?.presentationOpacity??1),viewportBounds:l.userData?.viewportBounds||null,renderedAspectRatio:_,renderedPixelAspectRatio:E,sourceAspectRatio:Number(l.userData?.sourceAspectRatio||(b?.height>0?Number(b.width||0)/Number(b.height||1):0)),mobileViewportOverride:l.userData?.mobileViewportOverride===!0,outerChromeCutout:l.userData?.outerChromeCutout===!0,centerTransparent:l.userData?.centerTransparent===!0,previewOnly:l.userData?.previewOnly===!0,visualOnly:l.userData?.visualOnly===!0,readOnly:l.userData?.readOnly===!0,selectable:l.userData?.selectable===!0,routeAuthority:l.userData?.routeAuthority===!0,actionAuthority:l.userData?.actionAuthority===!0,executableActions:Number(l.userData?.executableActions||0),hiddenTruthLeakage:l.userData?.hiddenTruthLeakage===!0,canvas:this.canvasPointForObject(l)}}),p=this.frontierLedgerSystemLines.map(l=>({slot:String(l.userData?.slot||""),layerVersion:String(l.userData?.layerVersion||""),systemVersion:String(l.userData?.systemVersion||""),systemLayer:String(l.userData?.systemLayer||""),systemAnchor:String(l.userData?.systemAnchor||""),systemSource:String(l.userData?.systemSource||""),unitId:String(l.userData?.unitId||""),sourceCellId:String(l.userData?.sourceCellId||""),targetCellId:String(l.userData?.targetCellId||""),commandId:String(l.userData?.commandId||""),previewOnly:l.userData?.previewOnly===!0,visualOnly:l.userData?.visualOnly===!0,readOnly:l.userData?.readOnly===!0,selectable:l.userData?.selectable===!0,routeAuthority:l.userData?.routeAuthority===!0,actionAuthority:l.userData?.actionAuthority===!0,executableActions:Number(l.userData?.executableActions||0),hiddenTruthLeakage:l.userData?.hiddenTruthLeakage===!0})),g=My(),y=[...d,...p],m=c.map(l=>({slot:l.slot,owner:"three_canvas",source:"three_canvas_clean_frame",sourceCropPainted:l.chromeSource!=="three_canvas_clean_frame",materialityVersion:l.materialityVersion,materialProfile:l.materialProfile,visualOnly:l.visualOnly,readOnly:l.readOnly,selectable:l.selectable,routeAuthority:l.routeAuthority,actionAuthority:l.actionAuthority,executableActions:l.executableActions,noAuthority:!l.routeAuthority&&!l.actionAuthority&&l.executableActions===0,canvas:l.canvas}));return this.info={renderer:"three.js",surface:"expedition-map",projectionHash:String(this.model?.projectionHash||""),canvasWidth:e.width,canvasHeight:e.height,cellCount:this.cells.length,selectedCellId:String(this.selectedCellId||""),hoverCellId:String(this.hoverCellId||""),zoom:Number(this.camera.zoom.toFixed(3)),visualShell:Gt,visualLayers:{terrainTexture:!0,runtimeRegionAssetPack:yd,runtimeRegionAtlas:`${Ei}/manifest.json`,runtimeTerrainUnderlay:Hd.path,runtimeSpriteAssetPack:xy,runtimeSpriteAtlas:`${Fn}/manifest.json`,generatedSpriteAssets:!0,generatedSpriteAssetCount:r.length,generatedSpriteAssetsReady:s,generatedSpriteAssetsVisualOnly:!0,generatedSpriteAssetsReadOnly:!0,singleVisibleHudOwner:!0,visibleHudOwner:"three_canvas",visibleHudOwnerVersion:Sd,domVisibleHudDemoted:!0,domHudRole:"transparent_hit_a11y_layer",domHudHitLayerRetained:!0,domHudHitLayerPainted:!1,visibleDomHudPaintCount:0,visibleDomHudTextCount:0,noVisibleDomHudDuplication:!0,rendererNetworkRequests:0,rendererMutationHandlers:[],threeCanvasHudOwnsChrome:!0,threeCanvasHudOwnsProfiles:!0,threeCanvasHudOwnsText:!0,threeCanvasHudOwnsCommandTray:!0,threeCanvasHudOwnsCollapsedLedgerHint:!0,threeCanvasHudNoGameplayAuthority:!0,generatedHudChrome:!0,generatedHudChromeInThreeLayer:!0,generatedHudChromeAssetPack:String(this.model.generatedHudChrome?.packId||Cs),generatedHudChromeManifest:`${Ti}/manifest.json`,generatedHudChromeSpriteCount:c.length,generatedHudChromeAssetsReady:c.filter(l=>l.assetReady).length,generatedHudChromeCleanComposite:!0,generatedHudChromeCleanCompositeVersion:xd,generatedHudMaterialityPass:!0,generatedHudMaterialityVersion:sn,generatedHudMaterialityRendererOwned:!0,generatedHudMaterialitySource:"procedural_canvas_textures",generatedHudWorldCohesionPass:!0,generatedHudWorldCohesionVersion:Rs,generatedHudWorldCohesionSource:"procedural_canvas_textures_and_three_lines",generatedHudWorldCohesionRendererOwned:!0,generatedHudWorldCohesionSpriteCount:a.length,generatedHudWorldCohesionLineCount:o.length,generatedHudWorldCohesionSlots:[...a.map(l=>l.slot),...o.map(l=>l.slot)],generatedHudWorldDepthSeparation:a.some(l=>l.slot==="map-depth-veil"),generatedHudForegroundBridge:a.some(l=>l.slot==="bottom-foreground-bridge"),generatedHudSelectedWorldAura:a.some(l=>l.slot==="selected-world-aura"),generatedHudSelectedContextTether:o.some(l=>l.slot==="selected-context-tether"),generatedHudWorldCohesionVisualOnly:[...a,...o].every(l=>l.visualOnly),generatedHudWorldCohesionReadOnly:[...a,...o].every(l=>l.readOnly),generatedHudWorldCohesionSelectable:[...a,...o].some(l=>l.selectable),generatedHudWorldCohesionAuthority:[...a,...o].some(l=>l.routeAuthority||l.actionAuthority||l.executableActions>0),generatedHudBottomDockTrayBalanced:!0,generatedHudSelectedContextWorldConnection:o.some(l=>l.targetSlot==="selected-context"),generatedHudMaterialityProfiles:h.every(l=>l.materialityVersion===sn),generatedHudMaterialityText:u.every(l=>l.materialityVersion===sn),generatedHudMaterialityCommands:f.every(l=>l.materialityVersion===sn),generatedHudMaterialityChromeSlots:c.filter(l=>l.materialityVersion===sn).map(l=>l.slot),generatedHudChromeSourcePackRetained:c.every(l=>l.sourceAssetPath.includes(`/${Cs}/`)),generatedHudChromePaintedSourceCrops:c.some(l=>l.chromeSource!=="three_canvas_clean_frame"),generatedHudChromeSpritesVisualOnly:c.every(l=>l.visualOnly),generatedHudChromeSpritesReadOnly:c.every(l=>l.readOnly),generatedHudChromeSpritesSelectable:c.some(l=>l.selectable),generatedHudChromeAuthority:c.some(l=>l.routeAuthority||l.actionAuthority||l.executableActions>0),generatedHudMaskLayerVersion:zc,generatedHudProfileMasks:!0,generatedHudProfileMasksInThreeLayer:!0,generatedHudProfileMaskSpriteCount:h.length,generatedHudProfileMaskSpriteAssetsReady:h.filter(l=>l.spriteAssetReady).length,generatedHudProfileMaskType:"circle_alpha_clip",generatedHudProfileSourceChromeCompositionVersion:Vc,generatedHudProfileSource:"north_star_source_rail_portrait_insert",generatedHudProfileSourceRailProjection:h.every(l=>l.profileSource==="north_star_source_rail_portrait_insert"),generatedHudProfileSourceRailSlotMode:"north_star_bottom_rail_aperture",generatedHudProfileSourceRailSlotCount:Md.length,generatedHudProfileSourceRailProjectedCount:h.filter(l=>l.sourceChromeDockSlotMode==="north_star_bottom_rail_aperture").length,generatedHudProfileSourceRailProjectedSlotIndexes:h.map(l=>l.sourceChromeDockSlotIndex).filter(l=>l>=0),generatedHudProfileMasksVisualOnly:h.every(l=>l.visualOnly),generatedHudProfileMasksReadOnly:h.every(l=>l.readOnly),generatedHudProfileMasksSelectable:h.some(l=>l.selectable),generatedHudProfileMaskAuthority:h.some(l=>l.routeAuthority||l.actionAuthority||l.executableActions>0),generatedHudTextInThreeLayer:!0,generatedHudTextSpriteCount:u.length,generatedHudTextLiveSource:"three_canvas_texture",generatedHudTextDomA11yOverlayRetained:u.every(l=>l.domA11yOverlayRetained),generatedHudTextSpritesVisualOnly:u.every(l=>l.visualOnly),generatedHudTextSpritesReadOnly:u.every(l=>l.readOnly),generatedHudTextSpritesSelectable:u.some(l=>l.selectable),generatedHudTextAuthority:u.some(l=>l.routeAuthority||l.actionAuthority||l.executableActions>0),generatedHudCommandGlyphsInThreeLayer:!0,generatedHudCommandGlyphSpriteCount:f.length,generatedHudCommandGlyphLiveSource:"server_owned_command_hint",generatedHudCommandGlyphsVisualOnly:f.every(l=>l.visualOnly),generatedHudCommandGlyphsReadOnly:f.every(l=>l.readOnly),generatedHudCommandGlyphsSelectable:f.some(l=>l.selectable),generatedHudCommandGlyphAuthority:f.some(l=>l.routeAuthority||l.actionAuthority||l.executableActions>0),frontierLedgerVisualParityPass:!0,frontierLedgerVisualParityVersion:Ns,frontierLedgerVisualParityNorthStarPath:zi.path,frontierLedgerVisualParityBaseMap:"warm_parchment_cartographic_map",frontierLedgerVisualParityNorthStarHudAtlas:!0,frontierLedgerVisualParityNorthStarHudAtlasPackId:Kc,frontierLedgerVisualParityNorthStarChromeMode:"source_cutout_static_viewport_chrome_dynamic_map",frontierLedgerVisualParityNorthStarHudAtlasSlots:d.filter(l=>l.northStarHudAtlas).map(l=>l.slot),frontierLedgerVisualParityNorthStarHudAtlasLoaded:d.filter(l=>l.northStarHudAtlas).every(l=>l.northStarHudAssetLoaded),frontierLedgerVisualParityNorthStarHudAtlasFallback:d.some(l=>l.northStarHudAtlasFallback),frontierLedgerVisualParitySourceChromeCompositionVersion:Vc,frontierLedgerVisualParitySourceChromeResponsiveMobileOverrides:d.filter(l=>l.northStarHudAtlas&&l.mobileViewportOverride).map(l=>l.slot),frontierLedgerVisualParitySourceChromeResponsiveAspectPass:d.filter(l=>l.northStarHudAtlas).every(l=>{let b=Number(l.renderedAspectRatio||0),v=Number(l.renderedPixelAspectRatio||b||0);return l.slot==="frontier-ledger-top-tabs-shadow"?v>=2.7:l.slot==="frontier-ledger-parcel-rangefinder-backplate"?v>=.45:l.slot==="frontier-ledger-right-tab-shadow"?v>=.08:b>0}),frontierLedgerVisualParitySourceChromeUnitDockMode:"dynamic_unit_portraits_projected_into_north_star_bottom_rail",frontierLedgerVisualParitySourceChromeLegacyUnitDockSuppressed:c.some(l=>l.slot==="unit-dock"&&l.frontierLedgerSuppressed),frontierLedgerVisualParitySourceChromeLegacyUnitTextSuppressed:u.some(l=>l.slot==="unit-dock"&&l.frontierLedgerSuppressed),frontierLedgerVisualParityUnderlayOpacity:vd,frontierLedgerVisualParityTileLegibilityPass:!0,frontierLedgerVisualParityMapDepthVeilOpacity:.1,frontierLedgerVisualParityBottomBridgeOpacity:Wc,frontierLedgerVisualParityBottomBridgeDemotedBySourceChrome:a.some(l=>l.slot==="bottom-foreground-bridge"&&l.sourceChromeDemoted&&l.presentationOpacity<=Wc),frontierLedgerVisualParitySelectedAuraOpacity:.64,frontierLedgerVisualParityBoardFrameOpacity:Gc,frontierLedgerVisualParityBoardFrameOuterChromeCutout:d.some(l=>l.slot==="frontier-ledger-board-frame"&&l.outerChromeCutout&&l.centerTransparent&&l.presentationOpacity<=Gc),frontierLedgerVisualParityBoardFrameCenterWash:"transparent_center_outer_hud_cutout",frontierLedgerVisualParityTargetOverlayMode:"ring_first_tile_legible",frontierLedgerVisualParityCommandTargetInteriorFillAlpha:0,frontierLedgerVisualParityGenericCellMarkerMode:"hidden_until_hover_or_selection",frontierLedgerVisualParityPublicCellMarkerMode:"normal_map_and_site_hidden_until_hover_or_selection",frontierLedgerVisualParityPublicBorderTone:"sepia_non_selected_teal_reserved_for_active",frontierLedgerVisualParityLegacyChromeSuppression:!0,frontierLedgerVisualParitySuppressedChromeSlots:c.filter(l=>l.frontierLedgerSuppressed).map(l=>l.slot),frontierLedgerVisualParitySuppressedTextSlots:u.filter(l=>l.frontierLedgerSuppressed).map(l=>l.slot),frontierLedgerVisualParitySuppressedCommandGlyphCount:f.filter(l=>l.frontierLedgerSuppressed).length,frontierLedgerVisualParityLegacyChromeConflict:c.some(l=>l.frontierLedgerSuppressed&&l.presentationOpacity>.02),frontierLedgerVisualParityLegacyContentConflict:[...u,...f].some(l=>l.frontierLedgerSuppressed&&l.presentationOpacity>.02),frontierLedgerVisualParityRetainsLegacyTelemetry:c.filter(l=>sh.includes(l.slot)).every(l=>l.frontierLedgerSuppressed),frontierLedgerMapSystem:!0,frontierLedgerMapSystemVersion:Jo,frontierLedgerMapSystemNorthStarPath:zi.path,frontierLedgerMapSystemNorthStarWidth:zi.width,frontierLedgerMapSystemNorthStarHeight:zi.height,frontierLedgerMapSystemNorthStarAspect:Number(zi.aspect.toFixed(4)),frontierLedgerMapSystemNotOneScreen:!0,frontierLedgerMapSystemScalableWorld:!0,frontierLedgerMapSystemWorldLayer:!0,frontierLedgerMapSystemHudLayer:!0,frontierLedgerMapSystemBridgeLayer:!0,frontierLedgerMapSystemPanZoomReady:!0,frontierLedgerMapSystemSelectionReady:!!this.selectedCellId,frontierLedgerMapSystemUnitReady:t.length>0,frontierLedgerMapSystemActionTargetReady:this.commandTargetSprites.length>0,frontierLedgerMapSystemLargeMapCellCount:this.cells.length,frontierLedgerMapSystemSlotManifest:!0,frontierLedgerMapSystemSlotManifestVersion:Jo,frontierLedgerMapSystemSlotManifestSlots:g.map(l=>l.slot),frontierLedgerMapSystemViewportHudSlots:g.filter(l=>l.layer==="hud").map(l=>l.slot),frontierLedgerMapSystemWorldSlots:g.filter(l=>l.layer==="world").map(l=>l.slot),frontierLedgerMapSystemBridgeSlots:g.filter(l=>l.layer==="bridge").map(l=>l.slot),frontierLedgerMapSystemRenderedSlots:y.map(l=>l.slot),frontierLedgerMapSystemRenderedBridgeSlots:y.filter(l=>l.systemLayer==="bridge").map(l=>l.slot),frontierLedgerMapSystemCoreHudSlotsComplete:["frontier-ledger-board-frame","frontier-ledger-top-tabs-shadow","frontier-ledger-right-tab-shadow","frontier-ledger-bottom-medallion-rail","frontier-ledger-parcel-rangefinder-backplate"].every(l=>d.some(b=>b.slot===l)),frontierLedgerMapSystemBridgeTargetCallout:d.some(l=>l.slot==="frontier-ledger-target-callout"),frontierLedgerMapSystemBridgeRouteArc:p.some(l=>l.slot==="frontier-ledger-route-arc"),frontierLedgerMapSystemBridgeTrailPips:d.filter(l=>l.slot==="frontier-ledger-dotted-target-trail").length,frontierLedgerMapSystemViewportAnchoredCount:d.filter(l=>l.systemAnchor==="viewport").length,frontierLedgerMapSystemWorldAnchoredCount:y.filter(l=>l.systemAnchor==="world").length,frontierLedgerMapSystemBridgeLineCount:p.length,frontierLedgerMapSystemStateAdapterFields:["cells","units.items","buildings","commandHints","selectedCellId","selectedUnitId","fogState"],frontierLedgerMapSystemBridgeSource:"server_owned_selection_unit_roster_and_command_hints",frontierLedgerMapSystemVisualOnly:y.every(l=>l.visualOnly),frontierLedgerMapSystemReadOnly:y.every(l=>l.readOnly),frontierLedgerMapSystemSelectable:y.some(l=>l.selectable),frontierLedgerMapSystemAuthority:y.some(l=>l.routeAuthority||l.actionAuthority||l.executableActions>0),frontierLedgerMapSystemHiddenTruthLeakage:y.some(l=>l.hiddenTruthLeakage),frontierLedgerScratchVisualHud:!0,frontierLedgerScratchVersion:el,frontierLedgerScratchNorthStarPath:bd,frontierLedgerScratchRendererOwned:!0,frontierLedgerScratchSource:"procedural_canvas_textures_and_three_sprites",frontierLedgerScratchComposition:"map_first_frontier_ledger_board_with_leather_rail_parcel_rangefinder_and_ledger_tab",frontierLedgerScratchSpriteCount:d.length,frontierLedgerScratchTrailPipCount:d.filter(l=>l.slot==="frontier-ledger-dotted-target-trail").length,frontierLedgerScratchCameraAnchoredSpriteCount:d.filter(l=>l.cameraAnchored).length,frontierLedgerScratchSlots:d.map(l=>l.slot),frontierLedgerScratchBoardFrame:d.some(l=>l.slot==="frontier-ledger-board-frame"),frontierLedgerScratchBottomMedallionRail:d.some(l=>l.slot==="frontier-ledger-bottom-medallion-rail"),frontierLedgerScratchParcelRangefinder:d.some(l=>l.slot==="frontier-ledger-parcel-rangefinder-backplate"),frontierLedgerScratchCollapsedLedgerTab:d.some(l=>l.slot==="frontier-ledger-right-tab-shadow"),frontierLedgerScratchTopLedgerTabs:d.some(l=>l.slot==="frontier-ledger-top-tabs-shadow"),frontierLedgerScratchDottedPath:d.some(l=>l.slot==="frontier-ledger-dotted-target-trail"),frontierLedgerScratchVisualOnly:d.every(l=>l.visualOnly),frontierLedgerScratchReadOnly:d.every(l=>l.readOnly),frontierLedgerScratchSelectable:d.some(l=>l.selectable),frontierLedgerScratchAuthority:d.some(l=>l.routeAuthority||l.actionAuthority||l.executableActions>0),frontierLedgerScratchHiddenTruthLeakage:d.some(l=>l.hiddenTruthLeakage),frontierLedgerScratchPreservesDomHitLayer:!0,frontierLedgerScratchMovementUx:"direct_double_click_existing_handler_no_confirm_added",serverTerrainAssetContractVersion:Jc,serverTerrainSlotSource:jc,assetBackedRegionTiles:i.filter(l=>l.assetPath).length,assetBackedLoadedTiles:i.filter(l=>l.assetReady).length,assetBackedTerrainTextures:!0,continuousTerrainUnderlay:!0,continuousTerrainUnderlayVersion:Gt,continuousUnderlayUsesServerOwnedCells:!0,continuousUnderlayHiddenCellsFogOnly:i.filter(l=>!["discovered","known"].includes(l.fogState)).every(l=>l.underlayFogOnly&&l.underlayTerrain===l.fogState),continuousUnderlayVisualOnly:!0,plateBlendLayer:!0,softRegionSeams:!0,reducedPlateEdgeContrast:!0,centerTileMutedForUnderlay:!0,cartographicFogDepth:!0,ambientContourField:!0,fogDepthGlyphsVisualOnly:!0,terrainUnderlayCount:this.terrainUnderlayCount,proceduralFallbackWhenAssetPending:!0,candidate02Cues:!0,agentTownIdentityCues:!0,scoutLedgerHud:!0,mapFirstHudOverlays:!0,hoverAffordance:!0,selectedSectorOutline:!0,beaconPlanWagonCues:!0,homeNodeEmphasis:!0,riverFlatCues:!0,waterCuesServerGated:!0,woodlandRidgeCues:!0,ruinSignalCues:!0,ruinSignalCuesServerGated:!0,lockedUnknownSealedFogOnly:!0,hintedAbstractFogEdge:!0,frontierBoundaryDashes:!0,frontierBoundaryVisualOnly:!0,fogVeils:this.cells.filter(l=>!["discovered","known"].includes(String(l.fogState||""))).length,edgeFogCount:this.edgeFogCount,civicBeaconCount:this.civicBeaconCount,surveyStrokeCount:this.surveyStrokeCount,surveyStrokesVisualOnly:!0,receiptTraceVisualOnly:!0,markerCount:this.markerCount,eventPacketMarkers:!0,eventPacketMarkerCount:this.eventMarkerCount,objectiveMarkers:!0,objectiveMarkerCount:this.objectiveMarkerCount,eventObjectiveMarkersVisualOnly:[...this.eventMarkerSprites,...this.objectiveMarkerSprites].every(l=>l.userData?.visualOnly===!0),eventObjectiveMarkersReadOnly:[...this.eventMarkerSprites,...this.objectiveMarkerSprites].every(l=>l.userData?.readOnly===!0),eventObjectiveMarkersInspectable:[...this.eventMarkerSprites,...this.objectiveMarkerSprites].every(l=>l.userData?.selectable===!0&&l.userData?.inspectable===!0),eventObjectiveMarkerAuthority:!1,outpostNextFrontierBeacon:!0,outpostNextFrontierBeaconCount:this.outpostFrontierBeaconCount,outpostNextFrontierBeaconVisualOnly:this.outpostFrontierBeaconSprites.every(l=>l.userData?.visualOnly===!0),outpostNextFrontierBeaconReadOnly:this.outpostFrontierBeaconSprites.every(l=>l.userData?.readOnly===!0),outpostNextFrontierBeaconSelectable:this.outpostFrontierBeaconSprites.some(l=>l.userData?.selectable===!0),outpostNextFrontierBeaconAuthority:!1,outpostNextFrontierBeaconHiddenTruthLeakage:this.outpostFrontierBeaconSprites.some(l=>l.userData?.hiddenTruthLeakage===!0),unitTokens:!0,unitTokenCount:this.unitTokenCount,unitTokensReadOnly:this.unitSprites.every(l=>l.userData?.readOnly===!0),unitMovementMutationImplemented:this.unitSprites.some(l=>l.userData?.movementMutationImplemented===!0),commandTargetRings:!0,commandTargetCount:this.commandTargetCount,commandTargetRingsVisualOnly:this.commandTargetSprites.every(l=>l.userData?.visualOnly===!0),commandTargetRingsReadOnly:this.commandTargetSprites.every(l=>l.userData?.readOnly===!0),commandTargetRingsSelectable:this.commandTargetSprites.every(l=>l.userData?.selectable===!0),commandTargetRingsPreviewOnly:this.commandTargetSprites.every(l=>l.userData?.previewOnly===!0),commandTargetRingsRingFirstOverlay:this.commandTargetSprites.every(l=>l.userData?.ringFirstOverlay===!0),commandTargetRingsTileLegibleOverlay:this.commandTargetSprites.every(l=>l.userData?.tileLegibleOverlay===!0),commandTargetRingInteriorFillAlpha:Math.max(0,...this.commandTargetSprites.map(l=>Number(l.userData?.interiorFillAlpha||0))),commandTargetRingAuthority:!1,commandOutcomeFeedback:this.outcomeFeedbackCount>0,commandOutcomeFeedbackCount:this.outcomeFeedbackCount,commandOutcomeFeedbackVisualOnly:this.outcomeFeedbackSprites.every(l=>l.userData?.visualOnly===!0),commandOutcomeFeedbackReadOnly:this.outcomeFeedbackSprites.every(l=>l.userData?.readOnly===!0),commandOutcomeFeedbackServerOwned:this.outcomeFeedbackSprites.every(l=>l.userData?.serverOwnedResult===!0),commandOutcomeFeedbackSelectable:this.outcomeFeedbackSprites.some(l=>l.userData?.selectable===!0),commandOutcomeFeedbackAuthority:!1,clientAuthority:!1},generatedHudWorldCohesionSprites:a,generatedHudWorldCohesionLines:o,generatedHudChromeSprites:c,generatedHudProfileSprites:h,generatedHudTextSprites:u,generatedHudCommandSprites:f,frontierLedgerScratchSprites:d,frontierLedgerSystemLines:p,frontierLedgerSystemManifest:g,visibleHudSlots:m,regionConsistency:{waterCueCells:i.filter(l=>l.waterCue).map(l=>l.cellId),ruinSignalCueCells:i.filter(l=>l.ruinSignalCue).map(l=>l.cellId),lockedUnknownCellsSealed:i.filter(l=>l.fogState==="locked_unknown").every(l=>l.hiddenSpecificitySuppressed&&!l.waterCue&&!l.ruinSignalCue),hintedCellsAbstract:i.filter(l=>l.fogState==="hinted").every(l=>l.hiddenSpecificitySuppressed&&!l.waterCue&&!l.ruinSignalCue),waterCuesRequireServerOwnedWater:i.filter(l=>l.waterCue).every(l=>l.publicTerrainAssetSlot==="water"),waterCoastRuntimeAssetsBlocked:i.every(l=>!["water","coast"].includes(String(l.assetSlot||""))),hiddenCellsHaveNoPublicTerrainSlot:i.filter(l=>!["discovered","known"].includes(l.fogState)).every(l=>l.publicTerrainAssetSlot==null),hiddenCellsUseOnlyFogAssets:i.filter(l=>!["discovered","known"].includes(l.fogState)).every(l=>["hinted_frontier_fog","locked_unknown_fog"].includes(String(l.assetSlot||""))&&l.fogOnly===!0&&l.assetKind==="fog_only"),knownDiscoveredAssetsMatchServerTerrain:i.filter(l=>["discovered","known"].includes(l.fogState)&&l.assetPath).every(l=>l.assetAllowedByServerTruth===!0),visibleAssetsMatchPublicTerrainSlot:i.filter(l=>["discovered","known"].includes(l.fogState)&&l.assetPath).every(l=>l.assetSlot===l.publicTerrainAssetSlot&&l.assetKind==="concrete_public_terrain"),serverTerrainAssetContractComplete:i.every(l=>l.terrainAssetContractVersion===Jc&&(["discovered","known"].includes(l.fogState)?l.publicTerrainAssetSlotSource===jc:l.fogAssetSlot!=null)),runtimeAssetProofMetadataComplete:i.filter(l=>l.assetPath).every(l=>l.cellId&&l.fogState&&l.runtimeAssetPack&&l.assetSlot&&l.assetKind&&typeof l.assetAllowedByServerTruth=="boolean"),runtimeAssetCellsRegionTruthBound:i.filter(l=>l.assetPath).every(l=>l.assetAllowedByServerTruth===!0),continuousUnderlayHiddenCellsFogOnly:i.filter(l=>!["discovered","known"].includes(l.fogState)).every(l=>l.underlayFogOnly&&l.underlayTerrain===l.fogState),continuousUnderlayNoActionAuthority:this.terrainUnderlayCount===1},regionVisuals:i,eventMarkers:this.eventMarkerSprites.map(l=>({packetId:String(l.userData?.packetId||""),cellId:String(l.userData?.cellId||""),templateId:String(l.userData?.templateId||""),spriteAssetSlot:String(l.userData?.spriteAssetSlot||""),spriteAssetPath:String(l.userData?.spriteAssetPath||""),spriteAssetReady:l.userData?.spriteAssetReady===!0,visualOnly:l.userData?.visualOnly===!0,readOnly:l.userData?.readOnly===!0,selectable:l.userData?.selectable===!0,inspectable:l.userData?.inspectable===!0,routeAuthority:l.userData?.routeAuthority===!0,actionAuthority:l.userData?.actionAuthority===!0,executableActions:Number(l.userData?.executableActions||0),canvas:this.canvasPointForObject(l)})),objectiveMarkers:this.objectiveMarkerSprites.map(l=>({mode:String(l.userData?.mode||""),targetCellId:String(l.userData?.targetCellId||""),packetId:String(l.userData?.packetId||""),spriteAssetSlot:String(l.userData?.spriteAssetSlot||""),spriteAssetPath:String(l.userData?.spriteAssetPath||""),spriteAssetReady:l.userData?.spriteAssetReady===!0,visualOnly:l.userData?.visualOnly===!0,readOnly:l.userData?.readOnly===!0,selectable:l.userData?.selectable===!0,inspectable:l.userData?.inspectable===!0,routeAuthority:l.userData?.routeAuthority===!0,actionAuthority:l.userData?.actionAuthority===!0,executableActions:Number(l.userData?.executableActions||0),canvas:this.canvasPointForObject(l)})),outpostNextFrontierBeacons:this.outpostFrontierBeaconSprites.map(l=>({unitId:String(l.userData?.unitId||""),unitType:String(l.userData?.unitType||""),commandId:String(l.userData?.commandId||""),cueLabel:String(l.userData?.cueLabel||""),originCellId:String(l.userData?.originCellId||""),targetCellId:String(l.userData?.targetCellId||""),targetFogState:String(l.userData?.targetFogState||""),targetKind:String(l.userData?.targetKind||""),derivedFrom:String(l.userData?.derivedFrom||""),visualOnly:l.userData?.visualOnly===!0,readOnly:l.userData?.readOnly===!0,selectable:l.userData?.selectable===!0,routeAuthority:l.userData?.routeAuthority===!0,actionAuthority:l.userData?.actionAuthority===!0,executableActions:Number(l.userData?.executableActions||0),hiddenTruthLeakage:l.userData?.hiddenTruthLeakage===!0,canvas:this.canvasPointForObject(l)})),units:this.unitSprites.map(l=>({unitId:String(l.userData?.unitId||""),unitType:String(l.userData?.unitType||""),displayName:String(l.userData?.displayName||""),cellId:String(l.userData?.cellId||""),spriteAssetSlot:String(l.userData?.spriteAssetSlot||""),spriteAssetPath:String(l.userData?.spriteAssetPath||""),spriteAssetReady:l.userData?.spriteAssetReady===!0,selected:String(l.userData?.unitId||"")===String(this.selectedUnitId||""),readOnly:l.userData?.readOnly===!0,movementMutationImplemented:l.userData?.movementMutationImplemented===!0,canvas:this.canvasPointForObject(l)})),commandTargets:this.commandTargetSprites.map(l=>({unitId:String(l.userData?.unitId||""),unitType:String(l.userData?.unitType||""),commandId:String(l.userData?.commandId||""),cellId:String(l.userData?.cellId||""),fogState:String(l.userData?.fogState||""),serverMutationImplemented:l.userData?.serverMutationImplemented===!0,movementMutation:l.userData?.movementMutation===!0,visualOnly:l.userData?.visualOnly===!0,readOnly:l.userData?.readOnly===!0,previewOnly:l.userData?.previewOnly===!0,selectable:l.userData?.selectable===!0,ringFirstOverlay:l.userData?.ringFirstOverlay===!0,tileLegibleOverlay:l.userData?.tileLegibleOverlay===!0,interiorFillAlpha:Number(l.userData?.interiorFillAlpha||0),routeAuthority:l.userData?.routeAuthority===!0,actionAuthority:l.userData?.actionAuthority===!0,executableActions:Number(l.userData?.executableActions||0),canvas:this.canvasPointForObject(l)})),commandOutcomeFeedback:this.outcomeFeedbackSprites.map(l=>({feedbackId:String(l.userData?.feedbackId||""),unitId:String(l.userData?.unitId||""),unitType:String(l.userData?.unitType||""),commandId:String(l.userData?.commandId||""),cellId:String(l.userData?.cellId||""),targetCellId:String(l.userData?.targetCellId||""),sourceCellId:String(l.userData?.sourceCellId||""),receiptId:String(l.userData?.receiptId||""),receiptKind:String(l.userData?.receiptKind||""),serverOwnedResult:l.userData?.serverOwnedResult===!0,visualOnly:l.userData?.visualOnly===!0,readOnly:l.userData?.readOnly===!0,selectable:l.userData?.selectable===!0,routeAuthority:l.userData?.routeAuthority===!0,actionAuthority:l.userData?.actionAuthority===!0,executableActions:Number(l.userData?.executableActions||0),canvas:this.canvasPointForObject(l)})),camera:{x:Number(this.camera.position.x.toFixed(3)),y:Number(this.camera.position.y.toFixed(3)),zoom:Number(this.camera.zoom.toFixed(3))},bounds:{minX:Number(this.mapBounds.minX.toFixed(3)),maxX:Number(this.mapBounds.maxX.toFixed(3)),minY:Number(this.mapBounds.minY.toFixed(3)),maxY:Number(this.mapBounds.maxY.toFixed(3))},fogStates:this.cells.reduce((l,b)=>{let v=String(b.fogState||"locked_unknown");return l[v]=Number(l[v]||0)+1,l},{}),pickTargets:this.cells.map(l=>({cellId:String(l.cellId||""),fogState:String(l.fogState||""),terrain:Qn(l),status:String(l.status||""),title:String(l.title||""),canvas:this.canvasPointForCell(l.cellId)}))},this.info}render(){this.updateInfo(),this.renderer.render(this.scene,this.camera)}};function Sx(n,e,t){let i=qc.get(n);return i||(i=new Zc(n),qc.set(n,i)),i.attach(e),i.sync(t||{}),i.info}function vx(n){let e=qc.get(n);return e?e.updateInfo():null}function bx(n,e={},t={}){let i=Xi.get(n);return i||(i=new rh(n),Xi.set(n,i)),i.sync(e||{},t.selectedCellId||"",t.selectedUnitId||"",t.outcomeFeedback||null)}function Mx(n){let e=Xi.get(n);return e?e.updateInfo():null}function Tx(n,e=1){let t=Xi.get(n);return t?(t.setZoom(t.camera.zoom*ie(e,1)),t.updateInfo()):null}function Ex(n){let e=Xi.get(n);return e?(e.resetView(),e.updateInfo()):null}function wx(n){let e=Xi.get(n);e&&(e.dispose(),Xi.delete(n))}window.FoundersPlotThreeRenderer={renderPlotScene:Sx,getPlotSceneInfo:vx,renderExpeditionMap:bx,getExpeditionMapInfo:Mx,zoomExpeditionMap:Tx,resetExpeditionMapCamera:Ex,disposeExpeditionMap:wx};})();
