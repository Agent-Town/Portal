var FoundersPlotThreeBundle=(()=>{var Lh=0,zl=1,Fh=2;var us=1,Nh=2,Mr=3,Gn=0,Vt=1,Bt=2,Rn=0,Ii=1,Hl=2,Vl=3,Gl=4,Uh=5;var oi=100,Oh=101,kh=102,Bh=103,zh=104,Hh=200,Vh=201,Gh=202,Wh=203,la=204,ca=205,Xh=206,qh=207,Yh=208,$h=209,Zh=210,Kh=211,Jh=212,jh=213,Qh=214,ha=0,ua=1,da=2,Pi=3,fa=4,pa=5,ma=6,ga=7,Wl=0,eu=1,tu=2,fn=0,Xl=1,ql=2,Yl=3,$l=4,Zl=5,Kl=6,Jl=7;var jl=300,mi=301,Fi=302,Ka=303,Ja=304,ds=306,_a=1e3,Jt=1001,xa=1002,Dt=1003,nu=1004;var fs=1005;var Se=1006,ja=1007;var pn=1008;var rn=1009,Ql=1010,ec=1011,Tr=1012,Qa=1013,mn=1014,gn=1015,In=1016,eo=1017,to=1018,Er=1020,tc=35902,nc=35899,ic=1021,rc=1022,on=1023,Tn=1026,gi=1027,sc=1028,no=1029,_i=1030,io=1031;var ro=1033,ps=33776,ms=33777,gs=33778,_s=33779,so=35840,ao=35841,oo=35842,lo=35843,co=36196,ho=37492,uo=37496,fo=37488,po=37489,xs=37490,mo=37491,go=37808,_o=37809,xo=37810,yo=37811,vo=37812,So=37813,bo=37814,Mo=37815,To=37816,Eo=37817,wo=37818,Ao=37819,Co=37820,Ro=37821,Io=36492,Po=36494,Do=36495,Lo=36283,Fo=36284,ys=36285,No=36286;var zr=2300,ya=2301,aa=2302,Cl=2303,Rl=2400,Il=2401,Pl=2402;var iu=3200;var ac=0,ru=1,qn="",He="srgb",Hr="srgb-linear",Vr="linear",Je="srgb";var Ri=7680;var Dl=519,su=512,au=513,ou=514,Uo=515,lu=516,cu=517,Oo=518,hu=519,va=35044;var oc="300 es",un=2e3,Gr=2001;function Id(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function Pd(n){return ArrayBuffer.isView(n)&&!(n instanceof DataView)}function or(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function uu(){let n=or("canvas");return n.style.display="block",n}var eh={},lr=null;function Wr(...n){let e="THREE."+n.shift();lr?lr("log",e,...n):console.log(e,...n)}function du(n){let e=n[0];if(typeof e=="string"&&e.startsWith("TSL:")){let t=n[1];t&&t.isStackTrace?n[0]+=" "+t.getLocation():n[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return n}function Ce(...n){n=du(n);let e="THREE."+n.shift();if(lr)lr("warn",e,...n);else{let t=n[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...n)}}function Re(...n){n=du(n);let e="THREE."+n.shift();if(lr)lr("error",e,...n);else{let t=n[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...n)}}function Sa(...n){let e=n.join(" ");e in eh||(eh[e]=!0,Ce(...n))}function fu(n,e,t){return new Promise(function(i,r){function s(){switch(n.clientWaitSync(e,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:r();break;case n.TIMEOUT_EXPIRED:setTimeout(s,t);break;default:i()}}setTimeout(s,t)})}var pu={[ha]:ua,[da]:ma,[fa]:ga,[Pi]:pa,[ua]:ha,[ma]:da,[ga]:fa,[pa]:Pi},En=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){let i=this._listeners;return i===void 0?!1:i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){let i=this._listeners;if(i===void 0)return;let r=i[e];if(r!==void 0){let s=r.indexOf(t);s!==-1&&r.splice(s,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let i=t[e.type];if(i!==void 0){e.target=this;let r=i.slice(0);for(let s=0,a=r.length;s<a;s++)r[s].call(this,e);e.target=null}}},Ut=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var el=Math.PI/180,ba=180/Math.PI;function Hn(){let n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Ut[n&255]+Ut[n>>8&255]+Ut[n>>16&255]+Ut[n>>24&255]+"-"+Ut[e&255]+Ut[e>>8&255]+"-"+Ut[e>>16&15|64]+Ut[e>>24&255]+"-"+Ut[t&63|128]+Ut[t>>8&255]+"-"+Ut[t>>16&255]+Ut[t>>24&255]+Ut[i&255]+Ut[i>>8&255]+Ut[i>>16&255]+Ut[i>>24&255]).toLowerCase()}function Ge(n,e,t){return Math.max(e,Math.min(t,n))}function Dd(n,e){return(n%e+e)%e}function tl(n,e,t){return(1-t)*n+t*e}function Mn(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("Invalid component type.")}}function nt(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("Invalid component type.")}}var _e=class n{static{n.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,i=this.y,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6],this.y=r[1]*t+r[4]*i+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Ge(this.x,e.x,t.x),this.y=Ge(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=Ge(this.x,e,t),this.y=Ge(this.y,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Ge(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(Ge(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let i=Math.cos(t),r=Math.sin(t),s=this.x-e.x,a=this.y-e.y;return this.x=s*i-a*r+e.x,this.y=s*r+a*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},wn=class{constructor(e=0,t=0,i=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=r}static slerpFlat(e,t,i,r,s,a,l){let o=i[r+0],c=i[r+1],h=i[r+2],d=i[r+3],u=s[a+0],f=s[a+1],g=s[a+2],v=s[a+3];if(d!==v||o!==u||c!==f||h!==g){let p=o*u+c*f+h*g+d*v;p<0&&(u=-u,f=-f,g=-g,v=-v,p=-p);let m=1-l;if(p<.9995){let x=Math.acos(p),b=Math.sin(x);m=Math.sin(m*x)/b,l=Math.sin(l*x)/b,o=o*m+u*l,c=c*m+f*l,h=h*m+g*l,d=d*m+v*l}else{o=o*m+u*l,c=c*m+f*l,h=h*m+g*l,d=d*m+v*l;let x=1/Math.sqrt(o*o+c*c+h*h+d*d);o*=x,c*=x,h*=x,d*=x}}e[t]=o,e[t+1]=c,e[t+2]=h,e[t+3]=d}static multiplyQuaternionsFlat(e,t,i,r,s,a){let l=i[r],o=i[r+1],c=i[r+2],h=i[r+3],d=s[a],u=s[a+1],f=s[a+2],g=s[a+3];return e[t]=l*g+h*d+o*f-c*u,e[t+1]=o*g+h*u+c*d-l*f,e[t+2]=c*g+h*f+l*u-o*d,e[t+3]=h*g-l*d-o*u-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,r){return this._x=e,this._y=t,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let i=e._x,r=e._y,s=e._z,a=e._order,l=Math.cos,o=Math.sin,c=l(i/2),h=l(r/2),d=l(s/2),u=o(i/2),f=o(r/2),g=o(s/2);switch(a){case"XYZ":this._x=u*h*d+c*f*g,this._y=c*f*d-u*h*g,this._z=c*h*g+u*f*d,this._w=c*h*d-u*f*g;break;case"YXZ":this._x=u*h*d+c*f*g,this._y=c*f*d-u*h*g,this._z=c*h*g-u*f*d,this._w=c*h*d+u*f*g;break;case"ZXY":this._x=u*h*d-c*f*g,this._y=c*f*d+u*h*g,this._z=c*h*g+u*f*d,this._w=c*h*d-u*f*g;break;case"ZYX":this._x=u*h*d-c*f*g,this._y=c*f*d+u*h*g,this._z=c*h*g-u*f*d,this._w=c*h*d+u*f*g;break;case"YZX":this._x=u*h*d+c*f*g,this._y=c*f*d+u*h*g,this._z=c*h*g-u*f*d,this._w=c*h*d-u*f*g;break;case"XZY":this._x=u*h*d-c*f*g,this._y=c*f*d-u*h*g,this._z=c*h*g+u*f*d,this._w=c*h*d+u*f*g;break;default:Ce("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let i=t/2,r=Math.sin(i);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,i=t[0],r=t[4],s=t[8],a=t[1],l=t[5],o=t[9],c=t[2],h=t[6],d=t[10],u=i+l+d;if(u>0){let f=.5/Math.sqrt(u+1);this._w=.25/f,this._x=(h-o)*f,this._y=(s-c)*f,this._z=(a-r)*f}else if(i>l&&i>d){let f=2*Math.sqrt(1+i-l-d);this._w=(h-o)/f,this._x=.25*f,this._y=(r+a)/f,this._z=(s+c)/f}else if(l>d){let f=2*Math.sqrt(1+l-i-d);this._w=(s-c)/f,this._x=(r+a)/f,this._y=.25*f,this._z=(o+h)/f}else{let f=2*Math.sqrt(1+d-i-l);this._w=(a-r)/f,this._x=(s+c)/f,this._y=(o+h)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<1e-8?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Ge(this.dot(e),-1,1)))}rotateTowards(e,t){let i=this.angleTo(e);if(i===0)return this;let r=Math.min(1,t/i);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let i=e._x,r=e._y,s=e._z,a=e._w,l=t._x,o=t._y,c=t._z,h=t._w;return this._x=i*h+a*l+r*c-s*o,this._y=r*h+a*o+s*l-i*c,this._z=s*h+a*c+i*o-r*l,this._w=a*h-i*l-r*o-s*c,this._onChangeCallback(),this}slerp(e,t){let i=e._x,r=e._y,s=e._z,a=e._w,l=this.dot(e);l<0&&(i=-i,r=-r,s=-s,a=-a,l=-l);let o=1-t;if(l<.9995){let c=Math.acos(l),h=Math.sin(c);o=Math.sin(o*c)/h,t=Math.sin(t*c)/h,this._x=this._x*o+i*t,this._y=this._y*o+r*t,this._z=this._z*o+s*t,this._w=this._w*o+a*t,this._onChangeCallback()}else this._x=this._x*o+i*t,this._y=this._y*o+r*t,this._z=this._z*o+s*t,this._w=this._w*o+a*t,this.normalize();return this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),r=Math.sqrt(1-i),s=Math.sqrt(i);return this.set(r*Math.sin(e),r*Math.cos(e),s*Math.sin(t),s*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},C=class n{static{n.prototype.isVector3=!0}constructor(e=0,t=0,i=0){this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(th.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(th.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[3]*i+s[6]*r,this.y=s[1]*t+s[4]*i+s[7]*r,this.z=s[2]*t+s[5]*i+s[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,i=this.y,r=this.z,s=e.elements,a=1/(s[3]*t+s[7]*i+s[11]*r+s[15]);return this.x=(s[0]*t+s[4]*i+s[8]*r+s[12])*a,this.y=(s[1]*t+s[5]*i+s[9]*r+s[13])*a,this.z=(s[2]*t+s[6]*i+s[10]*r+s[14])*a,this}applyQuaternion(e){let t=this.x,i=this.y,r=this.z,s=e.x,a=e.y,l=e.z,o=e.w,c=2*(a*r-l*i),h=2*(l*t-s*r),d=2*(s*i-a*t);return this.x=t+o*c+a*d-l*h,this.y=i+o*h+l*c-s*d,this.z=r+o*d+s*h-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[4]*i+s[8]*r,this.y=s[1]*t+s[5]*i+s[9]*r,this.z=s[2]*t+s[6]*i+s[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Ge(this.x,e.x,t.x),this.y=Ge(this.y,e.y,t.y),this.z=Ge(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=Ge(this.x,e,t),this.y=Ge(this.y,e,t),this.z=Ge(this.z,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Ge(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let i=e.x,r=e.y,s=e.z,a=t.x,l=t.y,o=t.z;return this.x=r*o-s*l,this.y=s*a-i*o,this.z=i*l-r*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return nl.copy(this).projectOnVector(e),this.sub(nl)}reflect(e){return this.sub(nl.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(Ge(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y,r=this.z-e.z;return t*t+i*i+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){let r=Math.sin(t)*e;return this.x=r*Math.sin(i),this.y=Math.cos(t)*e,this.z=r*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},nl=new C,th=new wn,Le=class n{static{n.prototype.isMatrix3=!0}constructor(e,t,i,r,s,a,l,o,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,a,l,o,c)}set(e,t,i,r,s,a,l,o,c){let h=this.elements;return h[0]=e,h[1]=r,h[2]=l,h[3]=t,h[4]=s,h[5]=o,h[6]=i,h[7]=a,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,r=t.elements,s=this.elements,a=i[0],l=i[3],o=i[6],c=i[1],h=i[4],d=i[7],u=i[2],f=i[5],g=i[8],v=r[0],p=r[3],m=r[6],x=r[1],b=r[4],M=r[7],A=r[2],E=r[5],I=r[8];return s[0]=a*v+l*x+o*A,s[3]=a*p+l*b+o*E,s[6]=a*m+l*M+o*I,s[1]=c*v+h*x+d*A,s[4]=c*p+h*b+d*E,s[7]=c*m+h*M+d*I,s[2]=u*v+f*x+g*A,s[5]=u*p+f*b+g*E,s[8]=u*m+f*M+g*I,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],a=e[4],l=e[5],o=e[6],c=e[7],h=e[8];return t*a*h-t*l*c-i*s*h+i*l*o+r*s*c-r*a*o}invert(){let e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],a=e[4],l=e[5],o=e[6],c=e[7],h=e[8],d=h*a-l*c,u=l*o-h*s,f=c*s-a*o,g=t*d+i*u+r*f;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let v=1/g;return e[0]=d*v,e[1]=(r*c-h*i)*v,e[2]=(l*i-r*a)*v,e[3]=u*v,e[4]=(h*t-r*o)*v,e[5]=(r*s-l*t)*v,e[6]=f*v,e[7]=(i*o-c*t)*v,e[8]=(a*t-i*s)*v,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,r,s,a,l){let o=Math.cos(s),c=Math.sin(s);return this.set(i*o,i*c,-i*(o*a+c*l)+a+e,-r*c,r*o,-r*(-c*a+o*l)+l+t,0,0,1),this}scale(e,t){return this.premultiply(il.makeScale(e,t)),this}rotate(e){return this.premultiply(il.makeRotation(-e)),this}translate(e,t){return this.premultiply(il.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,i=e.elements;for(let r=0;r<9;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}},il=new Le,nh=new Le().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),ih=new Le().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Ld(){let n={enabled:!0,workingColorSpace:Hr,spaces:{},convert:function(r,s,a){return this.enabled===!1||s===a||!s||!a||(this.spaces[s].transfer===Je&&(r.r=Vn(r.r),r.g=Vn(r.g),r.b=Vn(r.b)),this.spaces[s].primaries!==this.spaces[a].primaries&&(r.applyMatrix3(this.spaces[s].toXYZ),r.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===Je&&(r.r=sr(r.r),r.g=sr(r.g),r.b=sr(r.b))),r},workingToColorSpace:function(r,s){return this.convert(r,this.workingColorSpace,s)},colorSpaceToWorking:function(r,s){return this.convert(r,s,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===qn?Vr:this.spaces[r].transfer},getToneMappingMode:function(r){return this.spaces[r].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(r,s=this.workingColorSpace){return r.fromArray(this.spaces[s].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,s,a){return r.copy(this.spaces[s].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(r,s){return Sa("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),n.workingToColorSpace(r,s)},toWorkingColorSpace:function(r,s){return Sa("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),n.colorSpaceToWorking(r,s)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],i=[.3127,.329];return n.define({[Hr]:{primaries:e,whitePoint:i,transfer:Vr,toXYZ:nh,fromXYZ:ih,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:He},outputColorSpaceConfig:{drawingBufferColorSpace:He}},[He]:{primaries:e,whitePoint:i,transfer:Je,toXYZ:nh,fromXYZ:ih,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:He}}}),n}var qe=Ld();function Vn(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function sr(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}var Vi,Ma=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let i;if(e instanceof HTMLCanvasElement)i=e;else{Vi===void 0&&(Vi=or("canvas")),Vi.width=e.width,Vi.height=e.height;let r=Vi.getContext("2d");e instanceof ImageData?r.putImageData(e,0,0):r.drawImage(e,0,0,e.width,e.height),i=Vi}return i.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=or("canvas");t.width=e.width,t.height=e.height;let i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);let r=i.getImageData(0,0,e.width,e.height),s=r.data;for(let a=0;a<s.length;a++)s[a]=Vn(s[a]/255)*255;return i.putImageData(r,0,0),t}else if(e.data){let t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(Vn(t[i]/255)*255):t[i]=Vn(t[i]);return{data:t,width:e.width,height:e.height}}else return Ce("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},Fd=0,cr=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Fd++}),this.uuid=Hn(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let a=0,l=r.length;a<l;a++)r[a].isDataTexture?s.push(rl(r[a].image)):s.push(rl(r[a]))}else s=rl(r);i.url=s}return t||(e.images[this.uuid]=i),i}};function rl(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?Ma.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(Ce("Texture: Unable to serialize Texture."),{})}var Nd=0,sl=new C,Lt=class n extends En{constructor(e=n.DEFAULT_IMAGE,t=n.DEFAULT_MAPPING,i=Jt,r=Jt,s=Se,a=pn,l=on,o=rn,c=n.DEFAULT_ANISOTROPY,h=qn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Nd++}),this.uuid=Hn(),this.name="",this.source=new cr(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=s,this.minFilter=a,this.anisotropy=c,this.format=l,this.internalFormat=null,this.type=o,this.offset=new _e(0,0),this.repeat=new _e(1,1),this.center=new _e(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Le,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(sl).x}get height(){return this.source.getSize(sl).y}get depth(){return this.source.getSize(sl).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let i=e[t];if(i===void 0){Ce(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){Ce(`Texture.setValues(): property '${t}' does not exist.`);continue}r&&i&&r.isVector2&&i.isVector2||r&&i&&r.isVector3&&i.isVector3||r&&i&&r.isMatrix3&&i.isMatrix3?r.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==jl)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case _a:e.x=e.x-Math.floor(e.x);break;case Jt:e.x=e.x<0?0:1;break;case xa:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case _a:e.y=e.y-Math.floor(e.y);break;case Jt:e.y=e.y<0?0:1;break;case xa:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Lt.DEFAULT_IMAGE=null;Lt.DEFAULT_MAPPING=jl;Lt.DEFAULT_ANISOTROPY=1;var vt=class n{static{n.prototype.isVector4=!0}constructor(e=0,t=0,i=0,r=1){this.x=e,this.y=t,this.z=i,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,r){return this.x=e,this.y=t,this.z=i,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,i=this.y,r=this.z,s=this.w,a=e.elements;return this.x=a[0]*t+a[4]*i+a[8]*r+a[12]*s,this.y=a[1]*t+a[5]*i+a[9]*r+a[13]*s,this.z=a[2]*t+a[6]*i+a[10]*r+a[14]*s,this.w=a[3]*t+a[7]*i+a[11]*r+a[15]*s,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,r,s,o=e.elements,c=o[0],h=o[4],d=o[8],u=o[1],f=o[5],g=o[9],v=o[2],p=o[6],m=o[10];if(Math.abs(h-u)<.01&&Math.abs(d-v)<.01&&Math.abs(g-p)<.01){if(Math.abs(h+u)<.1&&Math.abs(d+v)<.1&&Math.abs(g+p)<.1&&Math.abs(c+f+m-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let b=(c+1)/2,M=(f+1)/2,A=(m+1)/2,E=(h+u)/4,I=(d+v)/4,y=(g+p)/4;return b>M&&b>A?b<.01?(i=0,r=.707106781,s=.707106781):(i=Math.sqrt(b),r=E/i,s=I/i):M>A?M<.01?(i=.707106781,r=0,s=.707106781):(r=Math.sqrt(M),i=E/r,s=y/r):A<.01?(i=.707106781,r=.707106781,s=0):(s=Math.sqrt(A),i=I/s,r=y/s),this.set(i,r,s,t),this}let x=Math.sqrt((p-g)*(p-g)+(d-v)*(d-v)+(u-h)*(u-h));return Math.abs(x)<.001&&(x=1),this.x=(p-g)/x,this.y=(d-v)/x,this.z=(u-h)/x,this.w=Math.acos((c+f+m-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Ge(this.x,e.x,t.x),this.y=Ge(this.y,e.y,t.y),this.z=Ge(this.z,e.z,t.z),this.w=Ge(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=Ge(this.x,e,t),this.y=Ge(this.y,e,t),this.z=Ge(this.z,e,t),this.w=Ge(this.w,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Ge(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Ta=class extends En{constructor(e=1,t=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Se,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1},i),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=i.depth,this.scissor=new vt(0,0,e,t),this.scissorTest=!1,this.viewport=new vt(0,0,e,t),this.textures=[];let r={width:e,height:t,depth:i.depth},s=new Lt(r),a=i.count;for(let l=0;l<a;l++)this.textures[l]=s.clone(),this.textures[l].isRenderTargetTexture=!0,this.textures[l].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview}_setTextureOptions(e={}){let t={minFilter:Se,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let r=0,s=this.textures.length;r<s;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=i,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,i=e.textures.length;t<i;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let r=Object.assign({},e.textures[t].image);this.textures[t].source=new cr(r)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this.multiview=e.multiview,this}dispose(){this.dispatchEvent({type:"dispose"})}},jt=class extends Ta{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}},Xr=class extends Lt{constructor(e=null,t=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=Dt,this.minFilter=Dt,this.wrapR=Jt,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var Ea=class extends Lt{constructor(e=null,t=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=Dt,this.minFilter=Dt,this.wrapR=Jt,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var dt=class n{static{n.prototype.isMatrix4=!0}constructor(e,t,i,r,s,a,l,o,c,h,d,u,f,g,v,p){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,a,l,o,c,h,d,u,f,g,v,p)}set(e,t,i,r,s,a,l,o,c,h,d,u,f,g,v,p){let m=this.elements;return m[0]=e,m[4]=t,m[8]=i,m[12]=r,m[1]=s,m[5]=a,m[9]=l,m[13]=o,m[2]=c,m[6]=h,m[10]=d,m[14]=u,m[3]=f,m[7]=g,m[11]=v,m[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new n().fromArray(this.elements)}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){let t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return this.determinant()===0?(e.set(1,0,0),t.set(0,1,0),i.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){if(e.determinant()===0)return this.identity();let t=this.elements,i=e.elements,r=1/Gi.setFromMatrixColumn(e,0).length(),s=1/Gi.setFromMatrixColumn(e,1).length(),a=1/Gi.setFromMatrixColumn(e,2).length();return t[0]=i[0]*r,t[1]=i[1]*r,t[2]=i[2]*r,t[3]=0,t[4]=i[4]*s,t[5]=i[5]*s,t[6]=i[6]*s,t[7]=0,t[8]=i[8]*a,t[9]=i[9]*a,t[10]=i[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,i=e.x,r=e.y,s=e.z,a=Math.cos(i),l=Math.sin(i),o=Math.cos(r),c=Math.sin(r),h=Math.cos(s),d=Math.sin(s);if(e.order==="XYZ"){let u=a*h,f=a*d,g=l*h,v=l*d;t[0]=o*h,t[4]=-o*d,t[8]=c,t[1]=f+g*c,t[5]=u-v*c,t[9]=-l*o,t[2]=v-u*c,t[6]=g+f*c,t[10]=a*o}else if(e.order==="YXZ"){let u=o*h,f=o*d,g=c*h,v=c*d;t[0]=u+v*l,t[4]=g*l-f,t[8]=a*c,t[1]=a*d,t[5]=a*h,t[9]=-l,t[2]=f*l-g,t[6]=v+u*l,t[10]=a*o}else if(e.order==="ZXY"){let u=o*h,f=o*d,g=c*h,v=c*d;t[0]=u-v*l,t[4]=-a*d,t[8]=g+f*l,t[1]=f+g*l,t[5]=a*h,t[9]=v-u*l,t[2]=-a*c,t[6]=l,t[10]=a*o}else if(e.order==="ZYX"){let u=a*h,f=a*d,g=l*h,v=l*d;t[0]=o*h,t[4]=g*c-f,t[8]=u*c+v,t[1]=o*d,t[5]=v*c+u,t[9]=f*c-g,t[2]=-c,t[6]=l*o,t[10]=a*o}else if(e.order==="YZX"){let u=a*o,f=a*c,g=l*o,v=l*c;t[0]=o*h,t[4]=v-u*d,t[8]=g*d+f,t[1]=d,t[5]=a*h,t[9]=-l*h,t[2]=-c*h,t[6]=f*d+g,t[10]=u-v*d}else if(e.order==="XZY"){let u=a*o,f=a*c,g=l*o,v=l*c;t[0]=o*h,t[4]=-d,t[8]=c*h,t[1]=u*d+v,t[5]=a*h,t[9]=f*d-g,t[2]=g*d-f,t[6]=l*h,t[10]=v*d+u}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Ud,e,Od)}lookAt(e,t,i){let r=this.elements;return Zt.subVectors(e,t),Zt.lengthSq()===0&&(Zt.z=1),Zt.normalize(),ti.crossVectors(i,Zt),ti.lengthSq()===0&&(Math.abs(i.z)===1?Zt.x+=1e-4:Zt.z+=1e-4,Zt.normalize(),ti.crossVectors(i,Zt)),ti.normalize(),Ls.crossVectors(Zt,ti),r[0]=ti.x,r[4]=Ls.x,r[8]=Zt.x,r[1]=ti.y,r[5]=Ls.y,r[9]=Zt.y,r[2]=ti.z,r[6]=Ls.z,r[10]=Zt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,r=t.elements,s=this.elements,a=i[0],l=i[4],o=i[8],c=i[12],h=i[1],d=i[5],u=i[9],f=i[13],g=i[2],v=i[6],p=i[10],m=i[14],x=i[3],b=i[7],M=i[11],A=i[15],E=r[0],I=r[4],y=r[8],w=r[12],F=r[1],R=r[5],O=r[9],G=r[13],X=r[2],N=r[6],z=r[10],V=r[14],j=r[3],Q=r[7],ce=r[11],be=r[15];return s[0]=a*E+l*F+o*X+c*j,s[4]=a*I+l*R+o*N+c*Q,s[8]=a*y+l*O+o*z+c*ce,s[12]=a*w+l*G+o*V+c*be,s[1]=h*E+d*F+u*X+f*j,s[5]=h*I+d*R+u*N+f*Q,s[9]=h*y+d*O+u*z+f*ce,s[13]=h*w+d*G+u*V+f*be,s[2]=g*E+v*F+p*X+m*j,s[6]=g*I+v*R+p*N+m*Q,s[10]=g*y+v*O+p*z+m*ce,s[14]=g*w+v*G+p*V+m*be,s[3]=x*E+b*F+M*X+A*j,s[7]=x*I+b*R+M*N+A*Q,s[11]=x*y+b*O+M*z+A*ce,s[15]=x*w+b*G+M*V+A*be,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[4],r=e[8],s=e[12],a=e[1],l=e[5],o=e[9],c=e[13],h=e[2],d=e[6],u=e[10],f=e[14],g=e[3],v=e[7],p=e[11],m=e[15],x=o*f-c*u,b=l*f-c*d,M=l*u-o*d,A=a*f-c*h,E=a*u-o*h,I=a*d-l*h;return t*(v*x-p*b+m*M)-i*(g*x-p*A+m*E)+r*(g*b-v*A+m*I)-s*(g*M-v*E+p*I)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){let r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=i),this}invert(){let e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],a=e[4],l=e[5],o=e[6],c=e[7],h=e[8],d=e[9],u=e[10],f=e[11],g=e[12],v=e[13],p=e[14],m=e[15],x=t*l-i*a,b=t*o-r*a,M=t*c-s*a,A=i*o-r*l,E=i*c-s*l,I=r*c-s*o,y=h*v-d*g,w=h*p-u*g,F=h*m-f*g,R=d*p-u*v,O=d*m-f*v,G=u*m-f*p,X=x*G-b*O+M*R+A*F-E*w+I*y;if(X===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let N=1/X;return e[0]=(l*G-o*O+c*R)*N,e[1]=(r*O-i*G-s*R)*N,e[2]=(v*I-p*E+m*A)*N,e[3]=(u*E-d*I-f*A)*N,e[4]=(o*F-a*G-c*w)*N,e[5]=(t*G-r*F+s*w)*N,e[6]=(p*M-g*I-m*b)*N,e[7]=(h*I-u*M+f*b)*N,e[8]=(a*O-l*F+c*y)*N,e[9]=(i*F-t*O-s*y)*N,e[10]=(g*E-v*M+m*x)*N,e[11]=(d*M-h*E-f*x)*N,e[12]=(l*w-a*R-o*y)*N,e[13]=(t*R-i*w+r*y)*N,e[14]=(v*b-g*A-p*x)*N,e[15]=(h*A-d*b+u*x)*N,this}scale(e){let t=this.elements,i=e.x,r=e.y,s=e.z;return t[0]*=i,t[4]*=r,t[8]*=s,t[1]*=i,t[5]*=r,t[9]*=s,t[2]*=i,t[6]*=r,t[10]*=s,t[3]*=i,t[7]*=r,t[11]*=s,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,r))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let i=Math.cos(t),r=Math.sin(t),s=1-i,a=e.x,l=e.y,o=e.z,c=s*a,h=s*l;return this.set(c*a+i,c*l-r*o,c*o+r*l,0,c*l+r*o,h*l+i,h*o-r*a,0,c*o-r*l,h*o+r*a,s*o*o+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,r,s,a){return this.set(1,i,s,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,i){let r=this.elements,s=t._x,a=t._y,l=t._z,o=t._w,c=s+s,h=a+a,d=l+l,u=s*c,f=s*h,g=s*d,v=a*h,p=a*d,m=l*d,x=o*c,b=o*h,M=o*d,A=i.x,E=i.y,I=i.z;return r[0]=(1-(v+m))*A,r[1]=(f+M)*A,r[2]=(g-b)*A,r[3]=0,r[4]=(f-M)*E,r[5]=(1-(u+m))*E,r[6]=(p+x)*E,r[7]=0,r[8]=(g+b)*I,r[9]=(p-x)*I,r[10]=(1-(u+v))*I,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,i){let r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];let s=this.determinant();if(s===0)return i.set(1,1,1),t.identity(),this;let a=Gi.set(r[0],r[1],r[2]).length(),l=Gi.set(r[4],r[5],r[6]).length(),o=Gi.set(r[8],r[9],r[10]).length();s<0&&(a=-a),ln.copy(this);let c=1/a,h=1/l,d=1/o;return ln.elements[0]*=c,ln.elements[1]*=c,ln.elements[2]*=c,ln.elements[4]*=h,ln.elements[5]*=h,ln.elements[6]*=h,ln.elements[8]*=d,ln.elements[9]*=d,ln.elements[10]*=d,t.setFromRotationMatrix(ln),i.x=a,i.y=l,i.z=o,this}makePerspective(e,t,i,r,s,a,l=un,o=!1){let c=this.elements,h=2*s/(t-e),d=2*s/(i-r),u=(t+e)/(t-e),f=(i+r)/(i-r),g,v;if(o)g=s/(a-s),v=a*s/(a-s);else if(l===un)g=-(a+s)/(a-s),v=-2*a*s/(a-s);else if(l===Gr)g=-a/(a-s),v=-a*s/(a-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+l);return c[0]=h,c[4]=0,c[8]=u,c[12]=0,c[1]=0,c[5]=d,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=g,c[14]=v,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,i,r,s,a,l=un,o=!1){let c=this.elements,h=2/(t-e),d=2/(i-r),u=-(t+e)/(t-e),f=-(i+r)/(i-r),g,v;if(o)g=1/(a-s),v=a/(a-s);else if(l===un)g=-2/(a-s),v=-(a+s)/(a-s);else if(l===Gr)g=-1/(a-s),v=-s/(a-s);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+l);return c[0]=h,c[4]=0,c[8]=0,c[12]=u,c[1]=0,c[5]=d,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=g,c[14]=v,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,i=e.elements;for(let r=0;r<16;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}},Gi=new C,ln=new dt,Ud=new C(0,0,0),Od=new C(1,1,1),ti=new C,Ls=new C,Zt=new C,rh=new dt,sh=new wn,li=class n{constructor(e=0,t=0,i=0,r=n.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,r=this._order){return this._x=e,this._y=t,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){let r=e.elements,s=r[0],a=r[4],l=r[8],o=r[1],c=r[5],h=r[9],d=r[2],u=r[6],f=r[10];switch(t){case"XYZ":this._y=Math.asin(Ge(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,f),this._z=Math.atan2(-a,s)):(this._x=Math.atan2(u,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Ge(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(l,f),this._z=Math.atan2(o,c)):(this._y=Math.atan2(-d,s),this._z=0);break;case"ZXY":this._x=Math.asin(Ge(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-d,f),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(o,s));break;case"ZYX":this._y=Math.asin(-Ge(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(u,f),this._z=Math.atan2(o,s)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(Ge(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-d,s)):(this._x=0,this._y=Math.atan2(l,f));break;case"XZY":this._z=Math.asin(-Ge(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(u,c),this._y=Math.atan2(l,s)):(this._x=Math.atan2(-h,f),this._y=0);break;default:Ce("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return rh.makeRotationFromQuaternion(e),this.setFromRotationMatrix(rh,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return sh.setFromEuler(this),this.setFromQuaternion(sh,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};li.DEFAULT_ORDER="XYZ";var hr=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},kd=0,ah=new C,Wi=new wn,Nn=new dt,Fs=new C,Rr=new C,Bd=new C,zd=new wn,oh=new C(1,0,0),lh=new C(0,1,0),ch=new C(0,0,1),hh={type:"added"},Hd={type:"removed"},Xi={type:"childadded",child:null},al={type:"childremoved",child:null},qt=class n extends En{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:kd++}),this.uuid=Hn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=n.DEFAULT_UP.clone();let e=new C,t=new li,i=new wn,r=new C(1,1,1);function s(){i.setFromEuler(t,!1)}function a(){t.setFromQuaternion(i,void 0,!1)}t._onChange(s),i._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new dt},normalMatrix:{value:new Le}}),this.matrix=new dt,this.matrixWorld=new dt,this.matrixAutoUpdate=n.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=n.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new hr,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Wi.setFromAxisAngle(e,t),this.quaternion.multiply(Wi),this}rotateOnWorldAxis(e,t){return Wi.setFromAxisAngle(e,t),this.quaternion.premultiply(Wi),this}rotateX(e){return this.rotateOnAxis(oh,e)}rotateY(e){return this.rotateOnAxis(lh,e)}rotateZ(e){return this.rotateOnAxis(ch,e)}translateOnAxis(e,t){return ah.copy(e).applyQuaternion(this.quaternion),this.position.add(ah.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(oh,e)}translateY(e){return this.translateOnAxis(lh,e)}translateZ(e){return this.translateOnAxis(ch,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Nn.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?Fs.copy(e):Fs.set(e,t,i);let r=this.parent;this.updateWorldMatrix(!0,!1),Rr.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Nn.lookAt(Rr,Fs,this.up):Nn.lookAt(Fs,Rr,this.up),this.quaternion.setFromRotationMatrix(Nn),r&&(Nn.extractRotation(r.matrixWorld),Wi.setFromRotationMatrix(Nn),this.quaternion.premultiply(Wi.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(Re("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(hh),Xi.child=e,this.dispatchEvent(Xi),Xi.child=null):Re("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Hd),al.child=e,this.dispatchEvent(al),al.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Nn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Nn.multiply(e.parent.matrixWorld)),e.applyMatrix4(Nn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(hh),Xi.child=e,this.dispatchEvent(Xi),Xi.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,r=this.children.length;i<r;i++){let a=this.children[i].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);let r=this.children;for(let s=0,a=r.length;s<a;s++)r[s].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Rr,e,Bd),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Rr,zd,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,i=e.y,r=e.z,s=this.matrix.elements;s[12]+=t-s[0]*t-s[4]*i-s[8]*r,s[13]+=i-s[1]*t-s[5]*i-s[9]*r,s[14]+=r-s[2]*t-s[6]*i-s[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t){let i=this.parent;if(e===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){let r=this.children;for(let s=0,a=r.length;s<a;s++)r[s].updateWorldMatrix(!1,!0)}}toJSON(e){let t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let r={};r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.castShadow===!0&&(r.castShadow=!0),this.receiveShadow===!0&&(r.receiveShadow=!0),this.visible===!1&&(r.visible=!1),this.frustumCulled===!1&&(r.frustumCulled=!1),this.renderOrder!==0&&(r.renderOrder=this.renderOrder),this.static!==!1&&(r.static=this.static),Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.matrixAutoUpdate===!1&&(r.matrixAutoUpdate=!1),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(l=>({...l,boundingBox:l.boundingBox?l.boundingBox.toJSON():void 0,boundingSphere:l.boundingSphere?l.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(l=>({...l})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function s(l,o){return l[o.uuid]===void 0&&(l[o.uuid]=o.toJSON(e)),o.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(e.geometries,this.geometry);let l=this.geometry.parameters;if(l!==void 0&&l.shapes!==void 0){let o=l.shapes;if(Array.isArray(o))for(let c=0,h=o.length;c<h;c++){let d=o[c];s(e.shapes,d)}else s(e.shapes,o)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let l=[];for(let o=0,c=this.material.length;o<c;o++)l.push(s(e.materials,this.material[o]));r.material=l}else r.material=s(e.materials,this.material);if(this.children.length>0){r.children=[];for(let l=0;l<this.children.length;l++)r.children.push(this.children[l].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let l=0;l<this.animations.length;l++){let o=this.animations[l];r.animations.push(s(e.animations,o))}}if(t){let l=a(e.geometries),o=a(e.materials),c=a(e.textures),h=a(e.images),d=a(e.shapes),u=a(e.skeletons),f=a(e.animations),g=a(e.nodes);l.length>0&&(i.geometries=l),o.length>0&&(i.materials=o),c.length>0&&(i.textures=c),h.length>0&&(i.images=h),d.length>0&&(i.shapes=d),u.length>0&&(i.skeletons=u),f.length>0&&(i.animations=f),g.length>0&&(i.nodes=g)}return i.object=r,i;function a(l){let o=[];for(let c in l){let h=l[c];delete h.metadata,o.push(h)}return o}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){let r=e.children[i];this.add(r.clone())}return this}};qt.DEFAULT_UP=new C(0,1,0);qt.DEFAULT_MATRIX_AUTO_UPDATE=!0;qt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var dn=class extends qt{constructor(){super(),this.isGroup=!0,this.type="Group"}},Vd={type:"move"},ur=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new dn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new dn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new C,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new C),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new dn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new C,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new C,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let r=null,s=null,a=null,l=this._targetRay,o=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){a=!0;for(let v of e.hand.values()){let p=t.getJointPose(v,i),m=this._getHandJoint(c,v);p!==null&&(m.matrix.fromArray(p.transform.matrix),m.matrix.decompose(m.position,m.rotation,m.scale),m.matrixWorldNeedsUpdate=!0,m.jointRadius=p.radius),m.visible=p!==null}let h=c.joints["index-finger-tip"],d=c.joints["thumb-tip"],u=h.position.distanceTo(d.position),f=.02,g=.005;c.inputState.pinching&&u>f+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&u<=f-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else o!==null&&e.gripSpace&&(s=t.getPose(e.gripSpace,i),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,o.eventsEnabled&&o.dispatchEvent({type:"gripUpdated",data:e,target:this})));l!==null&&(r=t.getPose(e.targetRaySpace,i),r===null&&s!==null&&(r=s),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1,this.dispatchEvent(Vd)))}return l!==null&&(l.visible=r!==null),o!==null&&(o.visible=s!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let i=new dn;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}},mu={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},ni={h:0,s:0,l:0},Ns={h:0,s:0,l:0};function ol(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}var Ze=class{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){let r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=He){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,qe.colorSpaceToWorking(this,t),this}setRGB(e,t,i,r=qe.workingColorSpace){return this.r=e,this.g=t,this.b=i,qe.colorSpaceToWorking(this,r),this}setHSL(e,t,i,r=qe.workingColorSpace){if(e=Dd(e,1),t=Ge(t,0,1),i=Ge(i,0,1),t===0)this.r=this.g=this.b=i;else{let s=i<=.5?i*(1+t):i+t-i*t,a=2*i-s;this.r=ol(a,s,e+1/3),this.g=ol(a,s,e),this.b=ol(a,s,e-1/3)}return qe.colorSpaceToWorking(this,r),this}setStyle(e,t=He){function i(s){s!==void 0&&parseFloat(s)<1&&Ce("Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let s,a=r[1],l=r[2];switch(a){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(l))return i(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,t);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(l))return i(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,t);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(l))return i(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,t);break;default:Ce("Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){let s=r[1],a=s.length;if(a===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(s,16),t);Ce("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=He){let i=mu[e.toLowerCase()];return i!==void 0?this.setHex(i,t):Ce("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Vn(e.r),this.g=Vn(e.g),this.b=Vn(e.b),this}copyLinearToSRGB(e){return this.r=sr(e.r),this.g=sr(e.g),this.b=sr(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=He){return qe.workingToColorSpace(Ot.copy(this),e),Math.round(Ge(Ot.r*255,0,255))*65536+Math.round(Ge(Ot.g*255,0,255))*256+Math.round(Ge(Ot.b*255,0,255))}getHexString(e=He){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=qe.workingColorSpace){qe.workingToColorSpace(Ot.copy(this),t);let i=Ot.r,r=Ot.g,s=Ot.b,a=Math.max(i,r,s),l=Math.min(i,r,s),o,c,h=(l+a)/2;if(l===a)o=0,c=0;else{let d=a-l;switch(c=h<=.5?d/(a+l):d/(2-a-l),a){case i:o=(r-s)/d+(r<s?6:0);break;case r:o=(s-i)/d+2;break;case s:o=(i-r)/d+4;break}o/=6}return e.h=o,e.s=c,e.l=h,e}getRGB(e,t=qe.workingColorSpace){return qe.workingToColorSpace(Ot.copy(this),t),e.r=Ot.r,e.g=Ot.g,e.b=Ot.b,e}getStyle(e=He){qe.workingToColorSpace(Ot.copy(this),e);let t=Ot.r,i=Ot.g,r=Ot.b;return e!==He?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(r*255)})`}offsetHSL(e,t,i){return this.getHSL(ni),this.setHSL(ni.h+e,ni.s+t,ni.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(ni),e.getHSL(Ns);let i=tl(ni.h,Ns.h,t),r=tl(ni.s,Ns.s,t),s=tl(ni.l,Ns.l,t);return this.setHSL(i,r,s),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,i=this.g,r=this.b,s=e.elements;return this.r=s[0]*t+s[3]*i+s[6]*r,this.g=s[1]*t+s[4]*i+s[7]*r,this.b=s[2]*t+s[5]*i+s[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Ot=new Ze;Ze.NAMES=mu;var dr=class extends qt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new li,this.environmentIntensity=1,this.environmentRotation=new li,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}},cn=new C,Un=new C,ll=new C,On=new C,qi=new C,Yi=new C,uh=new C,cl=new C,hl=new C,ul=new C,dl=new vt,fl=new vt,pl=new vt,zn=class n{constructor(e=new C,t=new C,i=new C){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,r){r.subVectors(i,t),cn.subVectors(e,t),r.cross(cn);let s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(e,t,i,r,s){cn.subVectors(r,t),Un.subVectors(i,t),ll.subVectors(e,t);let a=cn.dot(cn),l=cn.dot(Un),o=cn.dot(ll),c=Un.dot(Un),h=Un.dot(ll),d=a*c-l*l;if(d===0)return s.set(0,0,0),null;let u=1/d,f=(c*o-l*h)*u,g=(a*h-l*o)*u;return s.set(1-f-g,g,f)}static containsPoint(e,t,i,r){return this.getBarycoord(e,t,i,r,On)===null?!1:On.x>=0&&On.y>=0&&On.x+On.y<=1}static getInterpolation(e,t,i,r,s,a,l,o){return this.getBarycoord(e,t,i,r,On)===null?(o.x=0,o.y=0,"z"in o&&(o.z=0),"w"in o&&(o.w=0),null):(o.setScalar(0),o.addScaledVector(s,On.x),o.addScaledVector(a,On.y),o.addScaledVector(l,On.z),o)}static getInterpolatedAttribute(e,t,i,r,s,a){return dl.setScalar(0),fl.setScalar(0),pl.setScalar(0),dl.fromBufferAttribute(e,t),fl.fromBufferAttribute(e,i),pl.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(dl,s.x),a.addScaledVector(fl,s.y),a.addScaledVector(pl,s.z),a}static isFrontFacing(e,t,i,r){return cn.subVectors(i,t),Un.subVectors(e,t),cn.cross(Un).dot(r)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,r){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,i,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return cn.subVectors(this.c,this.b),Un.subVectors(this.a,this.b),cn.cross(Un).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return n.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return n.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,r,s){return n.getInterpolation(e,this.a,this.b,this.c,t,i,r,s)}containsPoint(e){return n.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return n.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let i=this.a,r=this.b,s=this.c,a,l;qi.subVectors(r,i),Yi.subVectors(s,i),cl.subVectors(e,i);let o=qi.dot(cl),c=Yi.dot(cl);if(o<=0&&c<=0)return t.copy(i);hl.subVectors(e,r);let h=qi.dot(hl),d=Yi.dot(hl);if(h>=0&&d<=h)return t.copy(r);let u=o*d-h*c;if(u<=0&&o>=0&&h<=0)return a=o/(o-h),t.copy(i).addScaledVector(qi,a);ul.subVectors(e,s);let f=qi.dot(ul),g=Yi.dot(ul);if(g>=0&&f<=g)return t.copy(s);let v=f*c-o*g;if(v<=0&&c>=0&&g<=0)return l=c/(c-g),t.copy(i).addScaledVector(Yi,l);let p=h*g-f*d;if(p<=0&&d-h>=0&&f-g>=0)return uh.subVectors(s,r),l=(d-h)/(d-h+(f-g)),t.copy(r).addScaledVector(uh,l);let m=1/(p+v+u);return a=v*m,l=u*m,t.copy(i).addScaledVector(qi,a).addScaledVector(Yi,l)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},ci=class{constructor(e=new C(1/0,1/0,1/0),t=new C(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(hn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(hn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let i=hn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let i=e.geometry;if(i!==void 0){let s=i.getAttribute("position");if(t===!0&&s!==void 0&&e.isInstancedMesh!==!0)for(let a=0,l=s.count;a<l;a++)e.isMesh===!0?e.getVertexPosition(a,hn):hn.fromBufferAttribute(s,a),hn.applyMatrix4(e.matrixWorld),this.expandByPoint(hn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Us.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),Us.copy(i.boundingBox)),Us.applyMatrix4(e.matrixWorld),this.union(Us)}let r=e.children;for(let s=0,a=r.length;s<a;s++)this.expandByObject(r[s],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,hn),hn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Ir),Os.subVectors(this.max,Ir),$i.subVectors(e.a,Ir),Zi.subVectors(e.b,Ir),Ki.subVectors(e.c,Ir),ii.subVectors(Zi,$i),ri.subVectors(Ki,Zi),Ei.subVectors($i,Ki);let t=[0,-ii.z,ii.y,0,-ri.z,ri.y,0,-Ei.z,Ei.y,ii.z,0,-ii.x,ri.z,0,-ri.x,Ei.z,0,-Ei.x,-ii.y,ii.x,0,-ri.y,ri.x,0,-Ei.y,Ei.x,0];return!ml(t,$i,Zi,Ki,Os)||(t=[1,0,0,0,1,0,0,0,1],!ml(t,$i,Zi,Ki,Os))?!1:(ks.crossVectors(ii,ri),t=[ks.x,ks.y,ks.z],ml(t,$i,Zi,Ki,Os))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,hn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(hn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(kn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),kn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),kn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),kn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),kn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),kn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),kn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),kn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(kn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},kn=[new C,new C,new C,new C,new C,new C,new C,new C],hn=new C,Us=new ci,$i=new C,Zi=new C,Ki=new C,ii=new C,ri=new C,Ei=new C,Ir=new C,Os=new C,ks=new C,wi=new C;function ml(n,e,t,i,r){for(let s=0,a=n.length-3;s<=a;s+=3){wi.fromArray(n,s);let l=r.x*Math.abs(wi.x)+r.y*Math.abs(wi.y)+r.z*Math.abs(wi.z),o=e.dot(wi),c=t.dot(wi),h=i.dot(wi);if(Math.max(-Math.max(o,c,h),Math.min(o,c,h))>l)return!1}return!0}var Et=new C,Bs=new _e,Gd=0,Xt=class extends En{constructor(e,t,i=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Gd++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=va,this.updateRanges=[],this.gpuType=gn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[e+r]=t.array[i+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)Bs.fromBufferAttribute(this,t),Bs.applyMatrix3(e),this.setXY(t,Bs.x,Bs.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)Et.fromBufferAttribute(this,t),Et.applyMatrix3(e),this.setXYZ(t,Et.x,Et.y,Et.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)Et.fromBufferAttribute(this,t),Et.applyMatrix4(e),this.setXYZ(t,Et.x,Et.y,Et.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)Et.fromBufferAttribute(this,t),Et.applyNormalMatrix(e),this.setXYZ(t,Et.x,Et.y,Et.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)Et.fromBufferAttribute(this,t),Et.transformDirection(e),this.setXYZ(t,Et.x,Et.y,Et.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=Mn(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=nt(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Mn(t,this.array)),t}setX(e,t){return this.normalized&&(t=nt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Mn(t,this.array)),t}setY(e,t){return this.normalized&&(t=nt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Mn(t,this.array)),t}setZ(e,t){return this.normalized&&(t=nt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Mn(t,this.array)),t}setW(e,t){return this.normalized&&(t=nt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=nt(t,this.array),i=nt(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,r){return e*=this.itemSize,this.normalized&&(t=nt(t,this.array),i=nt(i,this.array),r=nt(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this}setXYZW(e,t,i,r,s){return e*=this.itemSize,this.normalized&&(t=nt(t,this.array),i=nt(i,this.array),r=nt(r,this.array),s=nt(s,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this.array[e+3]=s,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==va&&(e.usage=this.usage),e}dispose(){this.dispatchEvent({type:"dispose"})}};var qr=class extends Xt{constructor(e,t,i){super(new Uint16Array(e),t,i)}};var Yr=class extends Xt{constructor(e,t,i){super(new Uint32Array(e),t,i)}};var gt=class extends Xt{constructor(e,t,i){super(new Float32Array(e),t,i)}},Wd=new ci,Pr=new C,gl=new C,Di=class{constructor(e=new C,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let i=this.center;t!==void 0?i.copy(t):Wd.setFromPoints(e).getCenter(i);let r=0;for(let s=0,a=e.length;s<a;s++)r=Math.max(r,i.distanceToSquared(e[s]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Pr.subVectors(e,this.center);let t=Pr.lengthSq();if(t>this.radius*this.radius){let i=Math.sqrt(t),r=(i-this.radius)*.5;this.center.addScaledVector(Pr,r/i),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(gl.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Pr.copy(e.center).add(gl)),this.expandByPoint(Pr.copy(e.center).sub(gl))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},Xd=0,an=new dt,_l=new qt,Ji=new C,Kt=new ci,Dr=new ci,Pt=new C,ot=class n extends En{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Xd++}),this.uuid=Hn(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Id(e)?Yr:qr)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let s=new Le().getNormalMatrix(e);i.applyNormalMatrix(s),i.needsUpdate=!0}let r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return an.makeRotationFromQuaternion(e),this.applyMatrix4(an),this}rotateX(e){return an.makeRotationX(e),this.applyMatrix4(an),this}rotateY(e){return an.makeRotationY(e),this.applyMatrix4(an),this}rotateZ(e){return an.makeRotationZ(e),this.applyMatrix4(an),this}translate(e,t,i){return an.makeTranslation(e,t,i),this.applyMatrix4(an),this}scale(e,t,i){return an.makeScale(e,t,i),this.applyMatrix4(an),this}lookAt(e){return _l.lookAt(e),_l.updateMatrix(),this.applyMatrix4(_l.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Ji).negate(),this.translate(Ji.x,Ji.y,Ji.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let i=[];for(let r=0,s=e.length;r<s;r++){let a=e[r];i.push(a.x,a.y,a.z||0)}this.setAttribute("position",new gt(i,3))}else{let i=Math.min(e.length,t.count);for(let r=0;r<i;r++){let s=e[r];t.setXYZ(r,s.x,s.y,s.z||0)}e.length>t.count&&Ce("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new ci);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Re("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new C(-1/0,-1/0,-1/0),new C(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,r=t.length;i<r;i++){let s=t[i];Kt.setFromBufferAttribute(s),this.morphTargetsRelative?(Pt.addVectors(this.boundingBox.min,Kt.min),this.boundingBox.expandByPoint(Pt),Pt.addVectors(this.boundingBox.max,Kt.max),this.boundingBox.expandByPoint(Pt)):(this.boundingBox.expandByPoint(Kt.min),this.boundingBox.expandByPoint(Kt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Re('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Di);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Re("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new C,1/0);return}if(e){let i=this.boundingSphere.center;if(Kt.setFromBufferAttribute(e),t)for(let s=0,a=t.length;s<a;s++){let l=t[s];Dr.setFromBufferAttribute(l),this.morphTargetsRelative?(Pt.addVectors(Kt.min,Dr.min),Kt.expandByPoint(Pt),Pt.addVectors(Kt.max,Dr.max),Kt.expandByPoint(Pt)):(Kt.expandByPoint(Dr.min),Kt.expandByPoint(Dr.max))}Kt.getCenter(i);let r=0;for(let s=0,a=e.count;s<a;s++)Pt.fromBufferAttribute(e,s),r=Math.max(r,i.distanceToSquared(Pt));if(t)for(let s=0,a=t.length;s<a;s++){let l=t[s],o=this.morphTargetsRelative;for(let c=0,h=l.count;c<h;c++)Pt.fromBufferAttribute(l,c),o&&(Ji.fromBufferAttribute(e,c),Pt.add(Ji)),r=Math.max(r,i.distanceToSquared(Pt))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&Re('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){Re("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=t.position,r=t.normal,s=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Xt(new Float32Array(4*i.count),4));let a=this.getAttribute("tangent"),l=[],o=[];for(let y=0;y<i.count;y++)l[y]=new C,o[y]=new C;let c=new C,h=new C,d=new C,u=new _e,f=new _e,g=new _e,v=new C,p=new C;function m(y,w,F){c.fromBufferAttribute(i,y),h.fromBufferAttribute(i,w),d.fromBufferAttribute(i,F),u.fromBufferAttribute(s,y),f.fromBufferAttribute(s,w),g.fromBufferAttribute(s,F),h.sub(c),d.sub(c),f.sub(u),g.sub(u);let R=1/(f.x*g.y-g.x*f.y);isFinite(R)&&(v.copy(h).multiplyScalar(g.y).addScaledVector(d,-f.y).multiplyScalar(R),p.copy(d).multiplyScalar(f.x).addScaledVector(h,-g.x).multiplyScalar(R),l[y].add(v),l[w].add(v),l[F].add(v),o[y].add(p),o[w].add(p),o[F].add(p))}let x=this.groups;x.length===0&&(x=[{start:0,count:e.count}]);for(let y=0,w=x.length;y<w;++y){let F=x[y],R=F.start,O=F.count;for(let G=R,X=R+O;G<X;G+=3)m(e.getX(G+0),e.getX(G+1),e.getX(G+2))}let b=new C,M=new C,A=new C,E=new C;function I(y){A.fromBufferAttribute(r,y),E.copy(A);let w=l[y];b.copy(w),b.sub(A.multiplyScalar(A.dot(w))).normalize(),M.crossVectors(E,w);let R=M.dot(o[y])<0?-1:1;a.setXYZW(y,b.x,b.y,b.z,R)}for(let y=0,w=x.length;y<w;++y){let F=x[y],R=F.start,O=F.count;for(let G=R,X=R+O;G<X;G+=3)I(e.getX(G+0)),I(e.getX(G+1)),I(e.getX(G+2))}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new Xt(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let u=0,f=i.count;u<f;u++)i.setXYZ(u,0,0,0);let r=new C,s=new C,a=new C,l=new C,o=new C,c=new C,h=new C,d=new C;if(e)for(let u=0,f=e.count;u<f;u+=3){let g=e.getX(u+0),v=e.getX(u+1),p=e.getX(u+2);r.fromBufferAttribute(t,g),s.fromBufferAttribute(t,v),a.fromBufferAttribute(t,p),h.subVectors(a,s),d.subVectors(r,s),h.cross(d),l.fromBufferAttribute(i,g),o.fromBufferAttribute(i,v),c.fromBufferAttribute(i,p),l.add(h),o.add(h),c.add(h),i.setXYZ(g,l.x,l.y,l.z),i.setXYZ(v,o.x,o.y,o.z),i.setXYZ(p,c.x,c.y,c.z)}else for(let u=0,f=t.count;u<f;u+=3)r.fromBufferAttribute(t,u+0),s.fromBufferAttribute(t,u+1),a.fromBufferAttribute(t,u+2),h.subVectors(a,s),d.subVectors(r,s),h.cross(d),i.setXYZ(u+0,h.x,h.y,h.z),i.setXYZ(u+1,h.x,h.y,h.z),i.setXYZ(u+2,h.x,h.y,h.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)Pt.fromBufferAttribute(e,t),Pt.normalize(),e.setXYZ(t,Pt.x,Pt.y,Pt.z)}toNonIndexed(){function e(l,o){let c=l.array,h=l.itemSize,d=l.normalized,u=new c.constructor(o.length*h),f=0,g=0;for(let v=0,p=o.length;v<p;v++){l.isInterleavedBufferAttribute?f=o[v]*l.data.stride+l.offset:f=o[v]*h;for(let m=0;m<h;m++)u[g++]=c[f++]}return new Xt(u,h,d)}if(this.index===null)return Ce("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new n,i=this.index.array,r=this.attributes;for(let l in r){let o=r[l],c=e(o,i);t.setAttribute(l,c)}let s=this.morphAttributes;for(let l in s){let o=[],c=s[l];for(let h=0,d=c.length;h<d;h++){let u=c[h],f=e(u,i);o.push(f)}t.morphAttributes[l]=o}t.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let l=0,o=a.length;l<o;l++){let c=a[l];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let o=this.parameters;for(let c in o)o[c]!==void 0&&(e[c]=o[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let i=this.attributes;for(let o in i){let c=i[o];e.data.attributes[o]=c.toJSON(e.data)}let r={},s=!1;for(let o in this.morphAttributes){let c=this.morphAttributes[o],h=[];for(let d=0,u=c.length;d<u;d++){let f=c[d];h.push(f.toJSON(e.data))}h.length>0&&(r[o]=h,s=!0)}s&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let l=this.boundingSphere;return l!==null&&(e.data.boundingSphere=l.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let i=e.index;i!==null&&this.setIndex(i.clone());let r=e.attributes;for(let c in r){let h=r[c];this.setAttribute(c,h.clone(t))}let s=e.morphAttributes;for(let c in s){let h=[],d=s[c];for(let u=0,f=d.length;u<f;u++)h.push(d[u].clone(t));this.morphAttributes[c]=h}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let c=0,h=a.length;c<h;c++){let d=a[c];this.addGroup(d.start,d.count,d.materialIndex)}let l=e.boundingBox;l!==null&&(this.boundingBox=l.clone());let o=e.boundingSphere;return o!==null&&(this.boundingSphere=o.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},wa=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=va,this.updateRanges=[],this.version=0,this.uuid=Hn()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,i){e*=this.stride,i*=t.stride;for(let r=0,s=this.stride;r<s;r++)this.array[e+r]=t.array[i+r];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Hn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),i=new this.constructor(t,this.stride);return i.setUsage(this.usage),i}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){return e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Hn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}},Ht=new C,$r=class n{constructor(e,t,i,r=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=i,this.normalized=r}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,i=this.data.count;t<i;t++)Ht.fromBufferAttribute(this,t),Ht.applyMatrix4(e),this.setXYZ(t,Ht.x,Ht.y,Ht.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)Ht.fromBufferAttribute(this,t),Ht.applyNormalMatrix(e),this.setXYZ(t,Ht.x,Ht.y,Ht.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)Ht.fromBufferAttribute(this,t),Ht.transformDirection(e),this.setXYZ(t,Ht.x,Ht.y,Ht.z);return this}getComponent(e,t){let i=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(i=Mn(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=nt(i,this.array)),this.data.array[e*this.data.stride+this.offset+t]=i,this}setX(e,t){return this.normalized&&(t=nt(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=nt(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=nt(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=nt(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=Mn(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=Mn(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=Mn(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=Mn(t,this.array)),t}setXY(e,t,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=nt(t,this.array),i=nt(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this}setXYZ(e,t,i,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=nt(t,this.array),i=nt(i,this.array),r=nt(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this.data.array[e+2]=r,this}setXYZW(e,t,i,r,s){return e=e*this.data.stride+this.offset,this.normalized&&(t=nt(t,this.array),i=nt(i,this.array),r=nt(r,this.array),s=nt(s,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this.data.array[e+2]=r,this.data.array[e+3]=s,this}clone(e){if(e===void 0){Wr("InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let i=0;i<this.count;i++){let r=i*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)t.push(this.data.array[r+s])}return new Xt(new this.array.constructor(t),this.itemSize,this.normalized)}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new n(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){Wr("InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let i=0;i<this.count;i++){let r=i*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)t.push(this.data.array[r+s])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}},qd=0,Wn=class extends En{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:qd++}),this.uuid=Hn(),this.name="",this.type="Material",this.blending=Ii,this.side=Gn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=la,this.blendDst=ca,this.blendEquation=oi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ze(0,0,0),this.blendAlpha=0,this.depthFunc=Pi,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Dl,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ri,this.stencilZFail=Ri,this.stencilZPass=Ri,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let i=e[t];if(i===void 0){Ce(`Material: parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){Ce(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(i):r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==Ii&&(i.blending=this.blending),this.side!==Gn&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==la&&(i.blendSrc=this.blendSrc),this.blendDst!==ca&&(i.blendDst=this.blendDst),this.blendEquation!==oi&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==Pi&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Dl&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Ri&&(i.stencilFail=this.stencilFail),this.stencilZFail!==Ri&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==Ri&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.allowOverride===!1&&(i.allowOverride=!1),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function r(s){let a=[];for(let l in s){let o=s[l];delete o.metadata,a.push(o)}return a}if(t){let s=r(e.textures),a=r(e.images);s.length>0&&(i.textures=s),a.length>0&&(i.images=a)}return i}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,i=null;if(t!==null){let r=t.length;i=new Array(r);for(let s=0;s!==r;++s)i[s]=t[s].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}},Tt=class extends Wn{constructor(e){super(),this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new Ze(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.rotation=e.rotation,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},ji,Lr=new C,Qi=new C,er=new C,tr=new _e,Fr=new _e,gu=new dt,zs=new C,Nr=new C,Hs=new C,dh=new _e,xl=new _e,fh=new _e,wt=class extends qt{constructor(e=new Tt){if(super(),this.isSprite=!0,this.type="Sprite",ji===void 0){ji=new ot;let t=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),i=new wa(t,5);ji.setIndex([0,1,2,0,2,3]),ji.setAttribute("position",new $r(i,3,0,!1)),ji.setAttribute("uv",new $r(i,2,3,!1))}this.geometry=ji,this.material=e,this.center=new _e(.5,.5),this.count=1}raycast(e,t){e.camera===null&&Re('Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),Qi.setFromMatrixScale(this.matrixWorld),gu.copy(e.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(e.camera.matrixWorldInverse,this.matrixWorld),er.setFromMatrixPosition(this.modelViewMatrix),e.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&Qi.multiplyScalar(-er.z);let i=this.material.rotation,r,s;i!==0&&(s=Math.cos(i),r=Math.sin(i));let a=this.center;Vs(zs.set(-.5,-.5,0),er,a,Qi,r,s),Vs(Nr.set(.5,-.5,0),er,a,Qi,r,s),Vs(Hs.set(.5,.5,0),er,a,Qi,r,s),dh.set(0,0),xl.set(1,0),fh.set(1,1);let l=e.ray.intersectTriangle(zs,Nr,Hs,!1,Lr);if(l===null&&(Vs(Nr.set(-.5,.5,0),er,a,Qi,r,s),xl.set(0,1),l=e.ray.intersectTriangle(zs,Hs,Nr,!1,Lr),l===null))return;let o=e.ray.origin.distanceTo(Lr);o<e.near||o>e.far||t.push({distance:o,point:Lr.clone(),uv:zn.getInterpolation(Lr,zs,Nr,Hs,dh,xl,fh,new _e),face:null,object:this})}copy(e,t){return super.copy(e,t),e.center!==void 0&&this.center.copy(e.center),this.material=e.material,this}};function Vs(n,e,t,i,r,s){tr.subVectors(n,t).addScalar(.5).multiply(i),r!==void 0?(Fr.x=s*tr.x-r*tr.y,Fr.y=r*tr.x+s*tr.y):Fr.copy(tr),n.copy(e),n.x+=Fr.x,n.y+=Fr.y,n.applyMatrix4(gu)}var Bn=new C,yl=new C,Gs=new C,si=new C,vl=new C,Ws=new C,Sl=new C,fr=class{constructor(e=new C,t=new C(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Bn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=Bn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Bn.copy(this.origin).addScaledVector(this.direction,t),Bn.distanceToSquared(e))}distanceSqToSegment(e,t,i,r){yl.copy(e).add(t).multiplyScalar(.5),Gs.copy(t).sub(e).normalize(),si.copy(this.origin).sub(yl);let s=e.distanceTo(t)*.5,a=-this.direction.dot(Gs),l=si.dot(this.direction),o=-si.dot(Gs),c=si.lengthSq(),h=Math.abs(1-a*a),d,u,f,g;if(h>0)if(d=a*o-l,u=a*l-o,g=s*h,d>=0)if(u>=-g)if(u<=g){let v=1/h;d*=v,u*=v,f=d*(d+a*u+2*l)+u*(a*d+u+2*o)+c}else u=s,d=Math.max(0,-(a*u+l)),f=-d*d+u*(u+2*o)+c;else u=-s,d=Math.max(0,-(a*u+l)),f=-d*d+u*(u+2*o)+c;else u<=-g?(d=Math.max(0,-(-a*s+l)),u=d>0?-s:Math.min(Math.max(-s,-o),s),f=-d*d+u*(u+2*o)+c):u<=g?(d=0,u=Math.min(Math.max(-s,-o),s),f=u*(u+2*o)+c):(d=Math.max(0,-(a*s+l)),u=d>0?s:Math.min(Math.max(-s,-o),s),f=-d*d+u*(u+2*o)+c);else u=a>0?-s:s,d=Math.max(0,-(a*u+l)),f=-d*d+u*(u+2*o)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,d),r&&r.copy(yl).addScaledVector(Gs,u),f}intersectSphere(e,t){Bn.subVectors(e.center,this.origin);let i=Bn.dot(this.direction),r=Bn.dot(Bn)-i*i,s=e.radius*e.radius;if(r>s)return null;let a=Math.sqrt(s-r),l=i-a,o=i+a;return o<0?null:l<0?this.at(o,t):this.at(l,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){let i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,r,s,a,l,o,c=1/this.direction.x,h=1/this.direction.y,d=1/this.direction.z,u=this.origin;return c>=0?(i=(e.min.x-u.x)*c,r=(e.max.x-u.x)*c):(i=(e.max.x-u.x)*c,r=(e.min.x-u.x)*c),h>=0?(s=(e.min.y-u.y)*h,a=(e.max.y-u.y)*h):(s=(e.max.y-u.y)*h,a=(e.min.y-u.y)*h),i>a||s>r||((s>i||isNaN(i))&&(i=s),(a<r||isNaN(r))&&(r=a),d>=0?(l=(e.min.z-u.z)*d,o=(e.max.z-u.z)*d):(l=(e.max.z-u.z)*d,o=(e.min.z-u.z)*d),i>o||l>r)||((l>i||i!==i)&&(i=l),(o<r||r!==r)&&(r=o),r<0)?null:this.at(i>=0?i:r,t)}intersectsBox(e){return this.intersectBox(e,Bn)!==null}intersectTriangle(e,t,i,r,s){vl.subVectors(t,e),Ws.subVectors(i,e),Sl.crossVectors(vl,Ws);let a=this.direction.dot(Sl),l;if(a>0){if(r)return null;l=1}else if(a<0)l=-1,a=-a;else return null;si.subVectors(this.origin,e);let o=l*this.direction.dot(Ws.crossVectors(si,Ws));if(o<0)return null;let c=l*this.direction.dot(vl.cross(si));if(c<0||o+c>a)return null;let h=-l*si.dot(Sl);return h<0?null:this.at(h/a,s)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Ft=class extends Wn{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Ze(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new li,this.combine=Wl,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},ph=new dt,Ai=new fr,Xs=new Di,mh=new C,qs=new C,Ys=new C,$s=new C,bl=new C,Zs=new C,gh=new C,Ks=new C,ht=class extends qt{constructor(e=new ot,t=new Ft){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){let l=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[l]=s}}}}getVertexPosition(e,t){let i=this.geometry,r=i.attributes.position,s=i.morphAttributes.position,a=i.morphTargetsRelative;t.fromBufferAttribute(r,e);let l=this.morphTargetInfluences;if(s&&l){Zs.set(0,0,0);for(let o=0,c=s.length;o<c;o++){let h=l[o],d=s[o];h!==0&&(bl.fromBufferAttribute(d,e),a?Zs.addScaledVector(bl,h):Zs.addScaledVector(bl.sub(t),h))}t.add(Zs)}return t}raycast(e,t){let i=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Xs.copy(i.boundingSphere),Xs.applyMatrix4(s),Ai.copy(e.ray).recast(e.near),!(Xs.containsPoint(Ai.origin)===!1&&(Ai.intersectSphere(Xs,mh)===null||Ai.origin.distanceToSquared(mh)>(e.far-e.near)**2))&&(ph.copy(s).invert(),Ai.copy(e.ray).applyMatrix4(ph),!(i.boundingBox!==null&&Ai.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,Ai)))}_computeIntersections(e,t,i){let r,s=this.geometry,a=this.material,l=s.index,o=s.attributes.position,c=s.attributes.uv,h=s.attributes.uv1,d=s.attributes.normal,u=s.groups,f=s.drawRange;if(l!==null)if(Array.isArray(a))for(let g=0,v=u.length;g<v;g++){let p=u[g],m=a[p.materialIndex],x=Math.max(p.start,f.start),b=Math.min(l.count,Math.min(p.start+p.count,f.start+f.count));for(let M=x,A=b;M<A;M+=3){let E=l.getX(M),I=l.getX(M+1),y=l.getX(M+2);r=Js(this,m,e,i,c,h,d,E,I,y),r&&(r.faceIndex=Math.floor(M/3),r.face.materialIndex=p.materialIndex,t.push(r))}}else{let g=Math.max(0,f.start),v=Math.min(l.count,f.start+f.count);for(let p=g,m=v;p<m;p+=3){let x=l.getX(p),b=l.getX(p+1),M=l.getX(p+2);r=Js(this,a,e,i,c,h,d,x,b,M),r&&(r.faceIndex=Math.floor(p/3),t.push(r))}}else if(o!==void 0)if(Array.isArray(a))for(let g=0,v=u.length;g<v;g++){let p=u[g],m=a[p.materialIndex],x=Math.max(p.start,f.start),b=Math.min(o.count,Math.min(p.start+p.count,f.start+f.count));for(let M=x,A=b;M<A;M+=3){let E=M,I=M+1,y=M+2;r=Js(this,m,e,i,c,h,d,E,I,y),r&&(r.faceIndex=Math.floor(M/3),r.face.materialIndex=p.materialIndex,t.push(r))}}else{let g=Math.max(0,f.start),v=Math.min(o.count,f.start+f.count);for(let p=g,m=v;p<m;p+=3){let x=p,b=p+1,M=p+2;r=Js(this,a,e,i,c,h,d,x,b,M),r&&(r.faceIndex=Math.floor(p/3),t.push(r))}}}};function Yd(n,e,t,i,r,s,a,l){let o;if(e.side===Vt?o=i.intersectTriangle(a,s,r,!0,l):o=i.intersectTriangle(r,s,a,e.side===Gn,l),o===null)return null;Ks.copy(l),Ks.applyMatrix4(n.matrixWorld);let c=t.ray.origin.distanceTo(Ks);return c<t.near||c>t.far?null:{distance:c,point:Ks.clone(),object:n}}function Js(n,e,t,i,r,s,a,l,o,c){n.getVertexPosition(l,qs),n.getVertexPosition(o,Ys),n.getVertexPosition(c,$s);let h=Yd(n,e,t,i,qs,Ys,$s,gh);if(h){let d=new C;zn.getBarycoord(gh,qs,Ys,$s,d),r&&(h.uv=zn.getInterpolatedAttribute(r,l,o,c,d,new _e)),s&&(h.uv1=zn.getInterpolatedAttribute(s,l,o,c,d,new _e)),a&&(h.normal=zn.getInterpolatedAttribute(a,l,o,c,d,new C),h.normal.dot(i.direction)>0&&h.normal.multiplyScalar(-1));let u={a:l,b:o,c,normal:new C,materialIndex:0};zn.getNormal(qs,Ys,$s,u.normal),h.face=u,h.barycoord=d}return h}var Aa=class extends Lt{constructor(e=null,t=1,i=1,r,s,a,l,o,c=Dt,h=Dt,d,u){super(null,a,l,o,c,h,r,s,d,u),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Ml=new C,$d=new C,Zd=new Le,bn=class{constructor(e=new C(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,r){return this.normal.set(e,t,i),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){let r=Ml.subVectors(i,t).cross($d.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,i=!0){let r=e.delta(Ml),s=this.normal.dot(r);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let a=-(e.start.dot(this.normal)+this.constant)/s;return i===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(r,a)}intersectsLine(e){let t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let i=t||Zd.getNormalMatrix(e),r=this.coplanarPoint(Ml).applyMatrix4(e),s=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(s),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},Ci=new Di,Kd=new _e(.5,.5),js=new C,Zr=class{constructor(e=new bn,t=new bn,i=new bn,r=new bn,s=new bn,a=new bn){this.planes=[e,t,i,r,s,a]}set(e,t,i,r,s,a){let l=this.planes;return l[0].copy(e),l[1].copy(t),l[2].copy(i),l[3].copy(r),l[4].copy(s),l[5].copy(a),this}copy(e){let t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=un,i=!1){let r=this.planes,s=e.elements,a=s[0],l=s[1],o=s[2],c=s[3],h=s[4],d=s[5],u=s[6],f=s[7],g=s[8],v=s[9],p=s[10],m=s[11],x=s[12],b=s[13],M=s[14],A=s[15];if(r[0].setComponents(c-a,f-h,m-g,A-x).normalize(),r[1].setComponents(c+a,f+h,m+g,A+x).normalize(),r[2].setComponents(c+l,f+d,m+v,A+b).normalize(),r[3].setComponents(c-l,f-d,m-v,A-b).normalize(),i)r[4].setComponents(o,u,p,M).normalize(),r[5].setComponents(c-o,f-u,m-p,A-M).normalize();else if(r[4].setComponents(c-o,f-u,m-p,A-M).normalize(),t===un)r[5].setComponents(c+o,f+u,m+p,A+M).normalize();else if(t===Gr)r[5].setComponents(o,u,p,M).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Ci.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Ci.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Ci)}intersectsSprite(e){Ci.center.set(0,0,0);let t=Kd.distanceTo(e.center);return Ci.radius=.7071067811865476+t,Ci.applyMatrix4(e.matrixWorld),this.intersectsSphere(Ci)}intersectsSphere(e){let t=this.planes,i=e.center,r=-e.radius;for(let s=0;s<6;s++)if(t[s].distanceToPoint(i)<r)return!1;return!0}intersectsBox(e){let t=this.planes;for(let i=0;i<6;i++){let r=t[i];if(js.x=r.normal.x>0?e.max.x:e.min.x,js.y=r.normal.y>0?e.max.y:e.min.y,js.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(js)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var kt=class extends Wn{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Ze(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},Ca=new C,Ra=new C,_h=new dt,Ur=new fr,Qs=new Di,Tl=new C,xh=new C,An=class extends qt{constructor(e=new ot,t=new kt){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[0];for(let r=1,s=t.count;r<s;r++)Ca.fromBufferAttribute(t,r-1),Ra.fromBufferAttribute(t,r),i[r]=i[r-1],i[r]+=Ca.distanceTo(Ra);e.setAttribute("lineDistance",new gt(i,1))}else Ce("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){let i=this.geometry,r=this.matrixWorld,s=e.params.Line.threshold,a=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Qs.copy(i.boundingSphere),Qs.applyMatrix4(r),Qs.radius+=s,e.ray.intersectsSphere(Qs)===!1)return;_h.copy(r).invert(),Ur.copy(e.ray).applyMatrix4(_h);let l=s/((this.scale.x+this.scale.y+this.scale.z)/3),o=l*l,c=this.isLineSegments?2:1,h=i.index,u=i.attributes.position;if(h!==null){let f=Math.max(0,a.start),g=Math.min(h.count,a.start+a.count);for(let v=f,p=g-1;v<p;v+=c){let m=h.getX(v),x=h.getX(v+1),b=ea(this,e,Ur,o,m,x,v);b&&t.push(b)}if(this.isLineLoop){let v=h.getX(g-1),p=h.getX(f),m=ea(this,e,Ur,o,v,p,g-1);m&&t.push(m)}}else{let f=Math.max(0,a.start),g=Math.min(u.count,a.start+a.count);for(let v=f,p=g-1;v<p;v+=c){let m=ea(this,e,Ur,o,v,v+1,v);m&&t.push(m)}if(this.isLineLoop){let v=ea(this,e,Ur,o,g-1,f,g-1);v&&t.push(v)}}}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){let l=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[l]=s}}}}};function ea(n,e,t,i,r,s,a){let l=n.geometry.attributes.position;if(Ca.fromBufferAttribute(l,r),Ra.fromBufferAttribute(l,s),t.distanceSqToSegment(Ca,Ra,Tl,xh)>i)return;Tl.applyMatrix4(n.matrixWorld);let c=e.ray.origin.distanceTo(Tl);if(!(c<e.near||c>e.far))return{distance:c,point:xh.clone().applyMatrix4(n.matrixWorld),index:a,face:null,faceIndex:null,barycoord:null,object:n}}var yh=new C,vh=new C,pr=class extends An{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[];for(let r=0,s=t.count;r<s;r+=2)yh.fromBufferAttribute(t,r),vh.fromBufferAttribute(t,r+1),i[r]=r===0?0:i[r-1],i[r+1]=i[r]+yh.distanceTo(vh);e.setAttribute("lineDistance",new gt(i,1))}else Ce("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}},Cn=class extends An{constructor(e,t){super(e,t),this.isLineLoop=!0,this.type="LineLoop"}};var Kr=class extends Lt{constructor(e=[],t=mi,i,r,s,a,l,o,c,h){super(e,t,i,r,s,a,l,o,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},ut=class extends Lt{constructor(e,t,i,r,s,a,l,o,c){super(e,t,i,r,s,a,l,o,c),this.isCanvasTexture=!0,this.needsUpdate=!0}};var Xn=class extends Lt{constructor(e,t,i=mn,r,s,a,l=Dt,o=Dt,c,h=Tn,d=1){if(h!==Tn&&h!==gi)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let u={width:e,height:t,depth:d};super(u,r,s,a,l,o,h,i,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new cr(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},Ia=class extends Xn{constructor(e,t=mn,i=mi,r,s,a=Dt,l=Dt,o,c=Tn){let h={width:e,height:e,depth:1},d=[h,h,h,h,h,h];super(e,e,t,i,r,s,a,l,o,c),this.image=d,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},Jr=class extends Lt{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},mr=class n extends ot{constructor(e=1,t=1,i=1,r=1,s=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:r,heightSegments:s,depthSegments:a};let l=this;r=Math.floor(r),s=Math.floor(s),a=Math.floor(a);let o=[],c=[],h=[],d=[],u=0,f=0;g("z","y","x",-1,-1,i,t,e,a,s,0),g("z","y","x",1,-1,i,t,-e,a,s,1),g("x","z","y",1,1,e,i,t,r,a,2),g("x","z","y",1,-1,e,i,-t,r,a,3),g("x","y","z",1,-1,e,t,i,r,s,4),g("x","y","z",-1,-1,e,t,-i,r,s,5),this.setIndex(o),this.setAttribute("position",new gt(c,3)),this.setAttribute("normal",new gt(h,3)),this.setAttribute("uv",new gt(d,2));function g(v,p,m,x,b,M,A,E,I,y,w){let F=M/I,R=A/y,O=M/2,G=A/2,X=E/2,N=I+1,z=y+1,V=0,j=0,Q=new C;for(let ce=0;ce<z;ce++){let be=ce*R-G;for(let we=0;we<N;we++){let Ye=we*F-O;Q[v]=Ye*x,Q[p]=be*b,Q[m]=X,c.push(Q.x,Q.y,Q.z),Q[v]=0,Q[p]=0,Q[m]=E>0?1:-1,h.push(Q.x,Q.y,Q.z),d.push(we/I),d.push(1-ce/y),V+=1}}for(let ce=0;ce<y;ce++)for(let be=0;be<I;be++){let we=u+be+N*ce,Ye=u+be+N*(ce+1),je=u+(be+1)+N*(ce+1),Oe=u+(be+1)+N*ce;o.push(we,Ye,Oe),o.push(Ye,je,Oe),j+=6}l.addGroup(f,j,w),f+=j,u+=V}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};var Qt=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){Ce("Curve: .getPoint() not implemented.")}getPointAt(e,t){let i=this.getUtoTmapping(e);return this.getPoint(i,t)}getPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return t}getSpacedPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPointAt(i/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],i,r=this.getPoint(0),s=0;t.push(0);for(let a=1;a<=e;a++)i=this.getPoint(a/e),s+=i.distanceTo(r),t.push(s),r=i;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){let i=this.getLengths(),r=0,s=i.length,a;t?a=t:a=e*i[s-1];let l=0,o=s-1,c;for(;l<=o;)if(r=Math.floor(l+(o-l)/2),c=i[r]-a,c<0)l=r+1;else if(c>0)o=r-1;else{o=r;break}if(r=o,i[r]===a)return r/(s-1);let h=i[r],u=i[r+1]-h,f=(a-h)/u;return(r+f)/(s-1)}getTangent(e,t){let r=e-1e-4,s=e+1e-4;r<0&&(r=0),s>1&&(s=1);let a=this.getPoint(r),l=this.getPoint(s),o=t||(a.isVector2?new _e:new C);return o.copy(l).sub(a).normalize(),o}getTangentAt(e,t){let i=this.getUtoTmapping(e);return this.getTangent(i,t)}computeFrenetFrames(e,t=!1){let i=new C,r=[],s=[],a=[],l=new C,o=new dt;for(let f=0;f<=e;f++){let g=f/e;r[f]=this.getTangentAt(g,new C)}s[0]=new C,a[0]=new C;let c=Number.MAX_VALUE,h=Math.abs(r[0].x),d=Math.abs(r[0].y),u=Math.abs(r[0].z);h<=c&&(c=h,i.set(1,0,0)),d<=c&&(c=d,i.set(0,1,0)),u<=c&&i.set(0,0,1),l.crossVectors(r[0],i).normalize(),s[0].crossVectors(r[0],l),a[0].crossVectors(r[0],s[0]);for(let f=1;f<=e;f++){if(s[f]=s[f-1].clone(),a[f]=a[f-1].clone(),l.crossVectors(r[f-1],r[f]),l.length()>Number.EPSILON){l.normalize();let g=Math.acos(Ge(r[f-1].dot(r[f]),-1,1));s[f].applyMatrix4(o.makeRotationAxis(l,g))}a[f].crossVectors(r[f],s[f])}if(t===!0){let f=Math.acos(Ge(s[0].dot(s[e]),-1,1));f/=e,r[0].dot(l.crossVectors(s[0],s[e]))>0&&(f=-f);for(let g=1;g<=e;g++)s[g].applyMatrix4(o.makeRotationAxis(r[g],f*g)),a[g].crossVectors(r[g],s[g])}return{tangents:r,normals:s,binormals:a}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}},gr=class extends Qt{constructor(e=0,t=0,i=1,r=1,s=0,a=Math.PI*2,l=!1,o=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=i,this.yRadius=r,this.aStartAngle=s,this.aEndAngle=a,this.aClockwise=l,this.aRotation=o}getPoint(e,t=new _e){let i=t,r=Math.PI*2,s=this.aEndAngle-this.aStartAngle,a=Math.abs(s)<Number.EPSILON;for(;s<0;)s+=r;for(;s>r;)s-=r;s<Number.EPSILON&&(a?s=0:s=r),this.aClockwise===!0&&!a&&(s===r?s=-r:s=s-r);let l=this.aStartAngle+e*s,o=this.aX+this.xRadius*Math.cos(l),c=this.aY+this.yRadius*Math.sin(l);if(this.aRotation!==0){let h=Math.cos(this.aRotation),d=Math.sin(this.aRotation),u=o-this.aX,f=c-this.aY;o=u*h-f*d+this.aX,c=u*d+f*h+this.aY}return i.set(o,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},Pa=class extends gr{constructor(e,t,i,r,s,a){super(e,t,i,i,r,s,a),this.isArcCurve=!0,this.type="ArcCurve"}};function lc(){let n=0,e=0,t=0,i=0;function r(s,a,l,o){n=s,e=l,t=-3*s+3*a-2*l-o,i=2*s-2*a+l+o}return{initCatmullRom:function(s,a,l,o,c){r(a,l,c*(l-s),c*(o-a))},initNonuniformCatmullRom:function(s,a,l,o,c,h,d){let u=(a-s)/c-(l-s)/(c+h)+(l-a)/h,f=(l-a)/h-(o-a)/(h+d)+(o-l)/d;u*=h,f*=h,r(a,l,u,f)},calc:function(s){let a=s*s,l=a*s;return n+e*s+t*a+i*l}}}var Sh=new C,bh=new C,El=new lc,wl=new lc,Al=new lc,_r=class extends Qt{constructor(e=[],t=!1,i="centripetal",r=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=i,this.tension=r}getPoint(e,t=new C){let i=t,r=this.points,s=r.length,a=(s-(this.closed?0:1))*e,l=Math.floor(a),o=a-l;this.closed?l+=l>0?0:(Math.floor(Math.abs(l)/s)+1)*s:o===0&&l===s-1&&(l=s-2,o=1);let c,h;this.closed||l>0?c=r[(l-1)%s]:(bh.subVectors(r[0],r[1]).add(r[0]),c=bh);let d=r[l%s],u=r[(l+1)%s];if(this.closed||l+2<s?h=r[(l+2)%s]:(Sh.subVectors(r[s-1],r[s-2]).add(r[s-1]),h=Sh),this.curveType==="centripetal"||this.curveType==="chordal"){let f=this.curveType==="chordal"?.5:.25,g=Math.pow(c.distanceToSquared(d),f),v=Math.pow(d.distanceToSquared(u),f),p=Math.pow(u.distanceToSquared(h),f);v<1e-4&&(v=1),g<1e-4&&(g=v),p<1e-4&&(p=v),El.initNonuniformCatmullRom(c.x,d.x,u.x,h.x,g,v,p),wl.initNonuniformCatmullRom(c.y,d.y,u.y,h.y,g,v,p),Al.initNonuniformCatmullRom(c.z,d.z,u.z,h.z,g,v,p)}else this.curveType==="catmullrom"&&(El.initCatmullRom(c.x,d.x,u.x,h.x,this.tension),wl.initCatmullRom(c.y,d.y,u.y,h.y,this.tension),Al.initCatmullRom(c.z,d.z,u.z,h.z,this.tension));return i.set(El.calc(o),wl.calc(o),Al.calc(o)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(r.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let r=this.points[t];e.points.push(r.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(new C().fromArray(r))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function Mh(n,e,t,i,r){let s=(i-e)*.5,a=(r-t)*.5,l=n*n,o=n*l;return(2*t-2*i+s+a)*o+(-3*t+3*i-2*s-a)*l+s*n+t}function Jd(n,e){let t=1-n;return t*t*e}function jd(n,e){return 2*(1-n)*n*e}function Qd(n,e){return n*n*e}function kr(n,e,t,i){return Jd(n,e)+jd(n,t)+Qd(n,i)}function ef(n,e){let t=1-n;return t*t*t*e}function tf(n,e){let t=1-n;return 3*t*t*n*e}function nf(n,e){return 3*(1-n)*n*n*e}function rf(n,e){return n*n*n*e}function Br(n,e,t,i,r){return ef(n,e)+tf(n,t)+nf(n,i)+rf(n,r)}var jr=class extends Qt{constructor(e=new _e,t=new _e,i=new _e,r=new _e){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=i,this.v3=r}getPoint(e,t=new _e){let i=t,r=this.v0,s=this.v1,a=this.v2,l=this.v3;return i.set(Br(e,r.x,s.x,a.x,l.x),Br(e,r.y,s.y,a.y,l.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},Da=class extends Qt{constructor(e=new C,t=new C,i=new C,r=new C){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=i,this.v3=r}getPoint(e,t=new C){let i=t,r=this.v0,s=this.v1,a=this.v2,l=this.v3;return i.set(Br(e,r.x,s.x,a.x,l.x),Br(e,r.y,s.y,a.y,l.y),Br(e,r.z,s.z,a.z,l.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},Qr=class extends Qt{constructor(e=new _e,t=new _e){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new _e){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new _e){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},La=class extends Qt{constructor(e=new C,t=new C){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new C){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new C){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},es=class extends Qt{constructor(e=new _e,t=new _e,i=new _e){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new _e){let i=t,r=this.v0,s=this.v1,a=this.v2;return i.set(kr(e,r.x,s.x,a.x),kr(e,r.y,s.y,a.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},hi=class extends Qt{constructor(e=new C,t=new C,i=new C){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new C){let i=t,r=this.v0,s=this.v1,a=this.v2;return i.set(kr(e,r.x,s.x,a.x),kr(e,r.y,s.y,a.y),kr(e,r.z,s.z,a.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},ts=class extends Qt{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new _e){let i=t,r=this.points,s=(r.length-1)*e,a=Math.floor(s),l=s-a,o=r[a===0?a:a-1],c=r[a],h=r[a>r.length-2?r.length-1:a+1],d=r[a>r.length-3?r.length-1:a+2];return i.set(Mh(l,o.x,c.x,h.x,d.x),Mh(l,o.y,c.y,h.y,d.y)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(r.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let r=this.points[t];e.points.push(r.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(new _e().fromArray(r))}return this}},Ll=Object.freeze({__proto__:null,ArcCurve:Pa,CatmullRomCurve3:_r,CubicBezierCurve:jr,CubicBezierCurve3:Da,EllipseCurve:gr,LineCurve:Qr,LineCurve3:La,QuadraticBezierCurve:es,QuadraticBezierCurve3:hi,SplineCurve:ts}),Fa=class extends Qt{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){let e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){let i=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new Ll[i](t,e))}return this}getPoint(e,t){let i=e*this.getLength(),r=this.getCurveLengths(),s=0;for(;s<r.length;){if(r[s]>=i){let a=r[s]-i,l=this.curves[s],o=l.getLength(),c=o===0?0:1-a/o;return l.getPointAt(c,t)}s++}return null}getLength(){let e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let e=[],t=0;for(let i=0,r=this.curves.length;i<r;i++)t+=this.curves[i].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){let t=[],i;for(let r=0,s=this.curves;r<s.length;r++){let a=s[r],l=a.isEllipseCurve?e*2:a.isLineCurve||a.isLineCurve3?1:a.isSplineCurve?e*a.points.length:e,o=a.getPoints(l);for(let c=0;c<o.length;c++){let h=o[c];i&&i.equals(h)||(t.push(h),i=h)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let r=e.curves[t];this.curves.push(r.clone())}return this.autoClose=e.autoClose,this}toJSON(){let e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,i=this.curves.length;t<i;t++){let r=this.curves[t];e.curves.push(r.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let r=e.curves[t];this.curves.push(new Ll[r.type]().fromJSON(r))}return this}},ns=class extends Fa{constructor(e){super(),this.type="Path",this.currentPoint=new _e,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,i=e.length;t<i;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){let i=new Qr(this.currentPoint.clone(),new _e(e,t));return this.curves.push(i),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,i,r){let s=new es(this.currentPoint.clone(),new _e(e,t),new _e(i,r));return this.curves.push(s),this.currentPoint.set(i,r),this}bezierCurveTo(e,t,i,r,s,a){let l=new jr(this.currentPoint.clone(),new _e(e,t),new _e(i,r),new _e(s,a));return this.curves.push(l),this.currentPoint.set(s,a),this}splineThru(e){let t=[this.currentPoint.clone()].concat(e),i=new ts(t);return this.curves.push(i),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,i,r,s,a){let l=this.currentPoint.x,o=this.currentPoint.y;return this.absarc(e+l,t+o,i,r,s,a),this}absarc(e,t,i,r,s,a){return this.absellipse(e,t,i,i,r,s,a),this}ellipse(e,t,i,r,s,a,l,o){let c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(e+c,t+h,i,r,s,a,l,o),this}absellipse(e,t,i,r,s,a,l,o){let c=new gr(e,t,i,r,s,a,l,o);if(this.curves.length>0){let d=c.getPoint(0);d.equals(this.currentPoint)||this.lineTo(d.x,d.y)}this.curves.push(c);let h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){let e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}},xr=class extends ns{constructor(e){super(e),this.uuid=Hn(),this.type="Shape",this.holes=[]}getPointsHoles(e){let t=[];for(let i=0,r=this.holes.length;i<r;i++)t[i]=this.holes[i].getPoints(e);return t}extractPoints(e){return{shape:this.getPoints(e),holes:this.getPointsHoles(e)}}copy(e){super.copy(e),this.holes=[];for(let t=0,i=e.holes.length;t<i;t++){let r=e.holes[t];this.holes.push(r.clone())}return this}toJSON(){let e=super.toJSON();e.uuid=this.uuid,e.holes=[];for(let t=0,i=this.holes.length;t<i;t++){let r=this.holes[t];e.holes.push(r.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.uuid=e.uuid,this.holes=[];for(let t=0,i=e.holes.length;t<i;t++){let r=e.holes[t];this.holes.push(new ns().fromJSON(r))}return this}};function sf(n,e,t=2){let i=e&&e.length,r=i?e[0]*t:n.length,s=_u(n,0,r,t,!0),a=[];if(!s||s.next===s.prev)return a;let l,o,c;if(i&&(s=hf(n,e,s,t)),n.length>80*t){l=n[0],o=n[1];let h=l,d=o;for(let u=t;u<r;u+=t){let f=n[u],g=n[u+1];f<l&&(l=f),g<o&&(o=g),f>h&&(h=f),g>d&&(d=g)}c=Math.max(h-l,d-o),c=c!==0?32767/c:0}return is(s,a,t,l,o,c,0),a}function _u(n,e,t,i,r){let s;if(r===Sf(n,e,t,i)>0)for(let a=e;a<t;a+=i)s=Th(a/i|0,n[a],n[a+1],s);else for(let a=t-i;a>=e;a-=i)s=Th(a/i|0,n[a],n[a+1],s);return s&&yr(s,s.next)&&(ss(s),s=s.next),s}function Li(n,e){if(!n)return n;e||(e=n);let t=n,i;do if(i=!1,!t.steiner&&(yr(t,t.next)||mt(t.prev,t,t.next)===0)){if(ss(t),t=e=t.prev,t===t.next)break;i=!0}else t=t.next;while(i||t!==e);return e}function is(n,e,t,i,r,s,a){if(!n)return;!a&&s&&mf(n,i,r,s);let l=n;for(;n.prev!==n.next;){let o=n.prev,c=n.next;if(s?of(n,i,r,s):af(n)){e.push(o.i,n.i,c.i),ss(n),n=c.next,l=c.next;continue}if(n=c,n===l){a?a===1?(n=lf(Li(n),e),is(n,e,t,i,r,s,2)):a===2&&cf(n,e,t,i,r,s):is(Li(n),e,t,i,r,s,1);break}}}function af(n){let e=n.prev,t=n,i=n.next;if(mt(e,t,i)>=0)return!1;let r=e.x,s=t.x,a=i.x,l=e.y,o=t.y,c=i.y,h=Math.min(r,s,a),d=Math.min(l,o,c),u=Math.max(r,s,a),f=Math.max(l,o,c),g=i.next;for(;g!==e;){if(g.x>=h&&g.x<=u&&g.y>=d&&g.y<=f&&Or(r,l,s,o,a,c,g.x,g.y)&&mt(g.prev,g,g.next)>=0)return!1;g=g.next}return!0}function of(n,e,t,i){let r=n.prev,s=n,a=n.next;if(mt(r,s,a)>=0)return!1;let l=r.x,o=s.x,c=a.x,h=r.y,d=s.y,u=a.y,f=Math.min(l,o,c),g=Math.min(h,d,u),v=Math.max(l,o,c),p=Math.max(h,d,u),m=Fl(f,g,e,t,i),x=Fl(v,p,e,t,i),b=n.prevZ,M=n.nextZ;for(;b&&b.z>=m&&M&&M.z<=x;){if(b.x>=f&&b.x<=v&&b.y>=g&&b.y<=p&&b!==r&&b!==a&&Or(l,h,o,d,c,u,b.x,b.y)&&mt(b.prev,b,b.next)>=0||(b=b.prevZ,M.x>=f&&M.x<=v&&M.y>=g&&M.y<=p&&M!==r&&M!==a&&Or(l,h,o,d,c,u,M.x,M.y)&&mt(M.prev,M,M.next)>=0))return!1;M=M.nextZ}for(;b&&b.z>=m;){if(b.x>=f&&b.x<=v&&b.y>=g&&b.y<=p&&b!==r&&b!==a&&Or(l,h,o,d,c,u,b.x,b.y)&&mt(b.prev,b,b.next)>=0)return!1;b=b.prevZ}for(;M&&M.z<=x;){if(M.x>=f&&M.x<=v&&M.y>=g&&M.y<=p&&M!==r&&M!==a&&Or(l,h,o,d,c,u,M.x,M.y)&&mt(M.prev,M,M.next)>=0)return!1;M=M.nextZ}return!0}function lf(n,e){let t=n;do{let i=t.prev,r=t.next.next;!yr(i,r)&&yu(i,t,t.next,r)&&rs(i,r)&&rs(r,i)&&(e.push(i.i,t.i,r.i),ss(t),ss(t.next),t=n=r),t=t.next}while(t!==n);return Li(t)}function cf(n,e,t,i,r,s){let a=n;do{let l=a.next.next;for(;l!==a.prev;){if(a.i!==l.i&&xf(a,l)){let o=vu(a,l);a=Li(a,a.next),o=Li(o,o.next),is(a,e,t,i,r,s,0),is(o,e,t,i,r,s,0);return}l=l.next}a=a.next}while(a!==n)}function hf(n,e,t,i){let r=[];for(let s=0,a=e.length;s<a;s++){let l=e[s]*i,o=s<a-1?e[s+1]*i:n.length,c=_u(n,l,o,i,!1);c===c.next&&(c.steiner=!0),r.push(_f(c))}r.sort(uf);for(let s=0;s<r.length;s++)t=df(r[s],t);return t}function uf(n,e){let t=n.x-e.x;if(t===0&&(t=n.y-e.y,t===0)){let i=(n.next.y-n.y)/(n.next.x-n.x),r=(e.next.y-e.y)/(e.next.x-e.x);t=i-r}return t}function df(n,e){let t=ff(n,e);if(!t)return e;let i=vu(t,n);return Li(i,i.next),Li(t,t.next)}function ff(n,e){let t=e,i=n.x,r=n.y,s=-1/0,a;if(yr(n,t))return t;do{if(yr(n,t.next))return t.next;if(r<=t.y&&r>=t.next.y&&t.next.y!==t.y){let d=t.x+(r-t.y)*(t.next.x-t.x)/(t.next.y-t.y);if(d<=i&&d>s&&(s=d,a=t.x<t.next.x?t:t.next,d===i))return a}t=t.next}while(t!==e);if(!a)return null;let l=a,o=a.x,c=a.y,h=1/0;t=a;do{if(i>=t.x&&t.x>=o&&i!==t.x&&xu(r<c?i:s,r,o,c,r<c?s:i,r,t.x,t.y)){let d=Math.abs(r-t.y)/(i-t.x);rs(t,n)&&(d<h||d===h&&(t.x>a.x||t.x===a.x&&pf(a,t)))&&(a=t,h=d)}t=t.next}while(t!==l);return a}function pf(n,e){return mt(n.prev,n,e.prev)<0&&mt(e.next,n,n.next)<0}function mf(n,e,t,i){let r=n;do r.z===0&&(r.z=Fl(r.x,r.y,e,t,i)),r.prevZ=r.prev,r.nextZ=r.next,r=r.next;while(r!==n);r.prevZ.nextZ=null,r.prevZ=null,gf(r)}function gf(n){let e,t=1;do{let i=n,r;n=null;let s=null;for(e=0;i;){e++;let a=i,l=0;for(let c=0;c<t&&(l++,a=a.nextZ,!!a);c++);let o=t;for(;l>0||o>0&&a;)l!==0&&(o===0||!a||i.z<=a.z)?(r=i,i=i.nextZ,l--):(r=a,a=a.nextZ,o--),s?s.nextZ=r:n=r,r.prevZ=s,s=r;i=a}s.nextZ=null,t*=2}while(e>1);return n}function Fl(n,e,t,i,r){return n=(n-t)*r|0,e=(e-i)*r|0,n=(n|n<<8)&16711935,n=(n|n<<4)&252645135,n=(n|n<<2)&858993459,n=(n|n<<1)&1431655765,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,n|e<<1}function _f(n){let e=n,t=n;do(e.x<t.x||e.x===t.x&&e.y<t.y)&&(t=e),e=e.next;while(e!==n);return t}function xu(n,e,t,i,r,s,a,l){return(r-a)*(e-l)>=(n-a)*(s-l)&&(n-a)*(i-l)>=(t-a)*(e-l)&&(t-a)*(s-l)>=(r-a)*(i-l)}function Or(n,e,t,i,r,s,a,l){return!(n===a&&e===l)&&xu(n,e,t,i,r,s,a,l)}function xf(n,e){return n.next.i!==e.i&&n.prev.i!==e.i&&!yf(n,e)&&(rs(n,e)&&rs(e,n)&&vf(n,e)&&(mt(n.prev,n,e.prev)||mt(n,e.prev,e))||yr(n,e)&&mt(n.prev,n,n.next)>0&&mt(e.prev,e,e.next)>0)}function mt(n,e,t){return(e.y-n.y)*(t.x-e.x)-(e.x-n.x)*(t.y-e.y)}function yr(n,e){return n.x===e.x&&n.y===e.y}function yu(n,e,t,i){let r=na(mt(n,e,t)),s=na(mt(n,e,i)),a=na(mt(t,i,n)),l=na(mt(t,i,e));return!!(r!==s&&a!==l||r===0&&ta(n,t,e)||s===0&&ta(n,i,e)||a===0&&ta(t,n,i)||l===0&&ta(t,e,i))}function ta(n,e,t){return e.x<=Math.max(n.x,t.x)&&e.x>=Math.min(n.x,t.x)&&e.y<=Math.max(n.y,t.y)&&e.y>=Math.min(n.y,t.y)}function na(n){return n>0?1:n<0?-1:0}function yf(n,e){let t=n;do{if(t.i!==n.i&&t.next.i!==n.i&&t.i!==e.i&&t.next.i!==e.i&&yu(t,t.next,n,e))return!0;t=t.next}while(t!==n);return!1}function rs(n,e){return mt(n.prev,n,n.next)<0?mt(n,e,n.next)>=0&&mt(n,n.prev,e)>=0:mt(n,e,n.prev)<0||mt(n,n.next,e)<0}function vf(n,e){let t=n,i=!1,r=(n.x+e.x)/2,s=(n.y+e.y)/2;do t.y>s!=t.next.y>s&&t.next.y!==t.y&&r<(t.next.x-t.x)*(s-t.y)/(t.next.y-t.y)+t.x&&(i=!i),t=t.next;while(t!==n);return i}function vu(n,e){let t=Nl(n.i,n.x,n.y),i=Nl(e.i,e.x,e.y),r=n.next,s=e.prev;return n.next=e,e.prev=n,t.next=r,r.prev=t,i.next=t,t.prev=i,s.next=i,i.prev=s,i}function Th(n,e,t,i){let r=Nl(n,e,t);return i?(r.next=i.next,r.prev=i,i.next.prev=r,i.next=r):(r.prev=r,r.next=r),r}function ss(n){n.next.prev=n.prev,n.prev.next=n.next,n.prevZ&&(n.prevZ.nextZ=n.nextZ),n.nextZ&&(n.nextZ.prevZ=n.prevZ)}function Nl(n,e,t){return{i:n,x:e,y:t,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function Sf(n,e,t,i){let r=0;for(let s=e,a=t-i;s<t;s+=i)r+=(n[a]-n[s])*(n[s+1]+n[a+1]),a=s;return r}var Ul=class{static triangulate(e,t,i=2){return sf(e,t,i)}},ar=class n{static area(e){let t=e.length,i=0;for(let r=t-1,s=0;s<t;r=s++)i+=e[r].x*e[s].y-e[s].x*e[r].y;return i*.5}static isClockWise(e){return n.area(e)<0}static triangulateShape(e,t){let i=[],r=[],s=[];Eh(e),wh(i,e);let a=e.length;t.forEach(Eh);for(let o=0;o<t.length;o++)r.push(a),a+=t[o].length,wh(i,t[o]);let l=Ul.triangulate(i,r);for(let o=0;o<l.length;o+=3)s.push(l.slice(o,o+3));return s}};function Eh(n){let e=n.length;e>2&&n[e-1].equals(n[0])&&n.pop()}function wh(n,e){for(let t=0;t<e.length;t++)n.push(e[t].x),n.push(e[t].y)}var en=class n extends ot{constructor(e=1,t=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:r};let s=e/2,a=t/2,l=Math.floor(i),o=Math.floor(r),c=l+1,h=o+1,d=e/l,u=t/o,f=[],g=[],v=[],p=[];for(let m=0;m<h;m++){let x=m*u-a;for(let b=0;b<c;b++){let M=b*d-s;g.push(M,-x,0),v.push(0,0,1),p.push(b/l),p.push(1-m/o)}}for(let m=0;m<o;m++)for(let x=0;x<l;x++){let b=x+c*m,M=x+c*(m+1),A=x+1+c*(m+1),E=x+1+c*m;f.push(b,M,E),f.push(M,A,E)}this.setIndex(f),this.setAttribute("position",new gt(g,3)),this.setAttribute("normal",new gt(v,3)),this.setAttribute("uv",new gt(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.widthSegments,e.heightSegments)}};var as=class n extends ot{constructor(e=new xr([new _e(0,.5),new _e(-.5,-.5),new _e(.5,-.5)]),t=12){super(),this.type="ShapeGeometry",this.parameters={shapes:e,curveSegments:t};let i=[],r=[],s=[],a=[],l=0,o=0;if(Array.isArray(e)===!1)c(e);else for(let h=0;h<e.length;h++)c(e[h]),this.addGroup(l,o,h),l+=o,o=0;this.setIndex(i),this.setAttribute("position",new gt(r,3)),this.setAttribute("normal",new gt(s,3)),this.setAttribute("uv",new gt(a,2));function c(h){let d=r.length/3,u=h.extractPoints(t),f=u.shape,g=u.holes;ar.isClockWise(f)===!1&&(f=f.reverse());for(let p=0,m=g.length;p<m;p++){let x=g[p];ar.isClockWise(x)===!0&&(g[p]=x.reverse())}let v=ar.triangulateShape(f,g);for(let p=0,m=g.length;p<m;p++){let x=g[p];f=f.concat(x)}for(let p=0,m=f.length;p<m;p++){let x=f[p];r.push(x.x,x.y,0),s.push(0,0,1),a.push(x.x,x.y)}for(let p=0,m=v.length;p<m;p++){let x=v[p],b=x[0]+d,M=x[1]+d,A=x[2]+d;i.push(b,M,A),o+=3}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON(),t=this.parameters.shapes;return bf(t,e)}static fromJSON(e,t){let i=[];for(let r=0,s=e.shapes.length;r<s;r++){let a=t[e.shapes[r]];i.push(a)}return new n(i,e.curveSegments)}};function bf(n,e){if(e.shapes=[],Array.isArray(n))for(let t=0,i=n.length;t<i;t++){let r=n[t];e.shapes.push(r.uuid)}else e.shapes.push(n.uuid);return e}var os=class n extends ot{constructor(e=new hi(new C(-1,-1,0),new C(-1,1,0),new C(1,1,0)),t=64,i=1,r=8,s=!1){super(),this.type="TubeGeometry",this.parameters={path:e,tubularSegments:t,radius:i,radialSegments:r,closed:s};let a=e.computeFrenetFrames(t,s);this.tangents=a.tangents,this.normals=a.normals,this.binormals=a.binormals;let l=new C,o=new C,c=new _e,h=new C,d=[],u=[],f=[],g=[];v(),this.setIndex(g),this.setAttribute("position",new gt(d,3)),this.setAttribute("normal",new gt(u,3)),this.setAttribute("uv",new gt(f,2));function v(){for(let b=0;b<t;b++)p(b);p(s===!1?t:0),x(),m()}function p(b){h=e.getPointAt(b/t,h);let M=a.normals[b],A=a.binormals[b];for(let E=0;E<=r;E++){let I=E/r*Math.PI*2,y=Math.sin(I),w=-Math.cos(I);o.x=w*M.x+y*A.x,o.y=w*M.y+y*A.y,o.z=w*M.z+y*A.z,o.normalize(),u.push(o.x,o.y,o.z),l.x=h.x+i*o.x,l.y=h.y+i*o.y,l.z=h.z+i*o.z,d.push(l.x,l.y,l.z)}}function m(){for(let b=1;b<=t;b++)for(let M=1;M<=r;M++){let A=(r+1)*(b-1)+(M-1),E=(r+1)*b+(M-1),I=(r+1)*b+M,y=(r+1)*(b-1)+M;g.push(A,E,y),g.push(E,I,y)}}function x(){for(let b=0;b<=t;b++)for(let M=0;M<=r;M++)c.x=b/t,c.y=M/r,f.push(c.x,c.y)}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON();return e.path=this.parameters.path.toJSON(),e}static fromJSON(e){return new n(new Ll[e.path.type]().fromJSON(e.path),e.tubularSegments,e.radius,e.radialSegments,e.closed)}};function Ni(n){let e={};for(let t in n){e[t]={};for(let i in n[t]){let r=n[t][i];if(Ah(r))r.isRenderTargetTexture?(Ce("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=r.clone();else if(Array.isArray(r))if(Ah(r[0])){let s=[];for(let a=0,l=r.length;a<l;a++)s[a]=r[a].clone();e[t][i]=s}else e[t][i]=r.slice();else e[t][i]=r}}return e}function zt(n){let e={};for(let t=0;t<n.length;t++){let i=Ni(n[t]);for(let r in i)e[r]=i[r]}return e}function Ah(n){return n&&(n.isColor||n.isMatrix3||n.isMatrix4||n.isVector2||n.isVector3||n.isVector4||n.isTexture||n.isQuaternion)}function Mf(n){let e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function cc(n){let e=n.getRenderTarget();return e===null?n.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:qe.workingColorSpace}var Su={clone:Ni,merge:zt},Tf=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Ef=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,tn=class extends Wn{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Tf,this.fragmentShader=Ef,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Ni(e.uniforms),this.uniformsGroups=Mf(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let r in this.uniforms){let a=this.uniforms[r].value;a&&a.isTexture?t.uniforms[r]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[r]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[r]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[r]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[r]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[r]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[r]={type:"m4",value:a.toArray()}:t.uniforms[r]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let i={};for(let r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}},Na=class extends tn{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}};var Ua=class extends Wn{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=iu,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},Oa=class extends Wn{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};var vr=class extends kt{constructor(e){super(),this.isLineDashedMaterial=!0,this.type="LineDashedMaterial",this.scale=1,this.dashSize=3,this.gapSize=1,this.setValues(e)}copy(e){return super.copy(e),this.scale=e.scale,this.dashSize=e.dashSize,this.gapSize=e.gapSize,this}};function ia(n,e){return!n||n.constructor===e?n:typeof e.BYTES_PER_ELEMENT=="number"?new e(n):Array.prototype.slice.call(n)}var ui=class{constructor(e,t,i,r){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=r!==void 0?r:new t.constructor(i),this.sampleValues=t,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,i=this._cachedIndex,r=t[i],s=t[i-1];n:{e:{let a;t:{i:if(!(e<r)){for(let l=i+2;;){if(r===void 0){if(e<s)break i;return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===l)break;if(s=r,r=t[++i],e<r)break e}a=t.length;break t}if(!(e>=s)){let l=t[1];e<l&&(i=2,s=l);for(let o=i-2;;){if(s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===o)break;if(r=s,s=t[--i-1],e>=s)break e}a=i,i=0;break t}break n}for(;i<a;){let l=i+a>>>1;e<t[l]?a=l:i=l+1}if(r=t[i],s=t[i-1],s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===void 0)return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,s,r)}return this.interpolate_(i,s,e,r)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,i=this.sampleValues,r=this.valueSize,s=e*r;for(let a=0;a!==r;++a)t[a]=i[s+a];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},ka=class extends ui{constructor(e,t,i,r){super(e,t,i,r),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Rl,endingEnd:Rl}}intervalChanged_(e,t,i){let r=this.parameterPositions,s=e-2,a=e+1,l=r[s],o=r[a];if(l===void 0)switch(this.getSettings_().endingStart){case Il:s=e,l=2*t-i;break;case Pl:s=r.length-2,l=t+r[s]-r[s+1];break;default:s=e,l=i}if(o===void 0)switch(this.getSettings_().endingEnd){case Il:a=e,o=2*i-t;break;case Pl:a=1,o=i+r[1]-r[0];break;default:a=e-1,o=t}let c=(i-t)*.5,h=this.valueSize;this._weightPrev=c/(t-l),this._weightNext=c/(o-i),this._offsetPrev=s*h,this._offsetNext=a*h}interpolate_(e,t,i,r){let s=this.resultBuffer,a=this.sampleValues,l=this.valueSize,o=e*l,c=o-l,h=this._offsetPrev,d=this._offsetNext,u=this._weightPrev,f=this._weightNext,g=(i-t)/(r-t),v=g*g,p=v*g,m=-u*p+2*u*v-u*g,x=(1+u)*p+(-1.5-2*u)*v+(-.5+u)*g+1,b=(-1-f)*p+(1.5+f)*v+.5*g,M=f*p-f*v;for(let A=0;A!==l;++A)s[A]=m*a[h+A]+x*a[c+A]+b*a[o+A]+M*a[d+A];return s}},Ba=class extends ui{constructor(e,t,i,r){super(e,t,i,r)}interpolate_(e,t,i,r){let s=this.resultBuffer,a=this.sampleValues,l=this.valueSize,o=e*l,c=o-l,h=(i-t)/(r-t),d=1-h;for(let u=0;u!==l;++u)s[u]=a[c+u]*d+a[o+u]*h;return s}},za=class extends ui{constructor(e,t,i,r){super(e,t,i,r)}interpolate_(e){return this.copySampleValue_(e-1)}},Ha=class extends ui{interpolate_(e,t,i,r){let s=this.resultBuffer,a=this.sampleValues,l=this.valueSize,o=e*l,c=o-l,h=this.settings||this.DefaultSettings_,d=h.inTangents,u=h.outTangents;if(!d||!u){let v=(i-t)/(r-t),p=1-v;for(let m=0;m!==l;++m)s[m]=a[c+m]*p+a[o+m]*v;return s}let f=l*2,g=e-1;for(let v=0;v!==l;++v){let p=a[c+v],m=a[o+v],x=g*f+v*2,b=u[x],M=u[x+1],A=e*f+v*2,E=d[A],I=d[A+1],y=(i-t)/(r-t),w,F,R,O,G;for(let X=0;X<8;X++){w=y*y,F=w*y,R=1-y,O=R*R,G=O*R;let z=G*t+3*O*y*b+3*R*w*E+F*r-i;if(Math.abs(z)<1e-10)break;let V=3*O*(b-t)+6*R*y*(E-b)+3*w*(r-E);if(Math.abs(V)<1e-10)break;y=y-z/V,y=Math.max(0,Math.min(1,y))}s[v]=G*p+3*O*y*M+3*R*w*I+F*m}return s}},nn=class{constructor(e,t,i,r){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=ia(t,this.TimeBufferType),this.values=ia(i,this.ValueBufferType),this.setInterpolation(r||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,i;if(t.toJSON!==this.toJSON)i=t.toJSON(e);else{i={name:e.name,times:ia(e.times,Array),values:ia(e.values,Array)};let r=e.getInterpolation();r!==e.DefaultInterpolation&&(i.interpolation=r)}return i.type=e.ValueTypeName,i}InterpolantFactoryMethodDiscrete(e){return new za(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Ba(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new ka(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new Ha(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.settings=this.settings),t}setInterpolation(e){let t;switch(e){case zr:t=this.InterpolantFactoryMethodDiscrete;break;case ya:t=this.InterpolantFactoryMethodLinear;break;case aa:t=this.InterpolantFactoryMethodSmooth;break;case Cl:t=this.InterpolantFactoryMethodBezier;break}if(t===void 0){let i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(i);return Ce("KeyframeTrack:",i),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return zr;case this.InterpolantFactoryMethodLinear:return ya;case this.InterpolantFactoryMethodSmooth:return aa;case this.InterpolantFactoryMethodBezier:return Cl}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let i=0,r=t.length;i!==r;++i)t[i]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let i=0,r=t.length;i!==r;++i)t[i]*=e}return this}trim(e,t){let i=this.times,r=i.length,s=0,a=r-1;for(;s!==r&&i[s]<e;)++s;for(;a!==-1&&i[a]>t;)--a;if(++a,s!==0||a!==r){s>=a&&(a=Math.max(a,1),s=a-1);let l=this.getValueSize();this.times=i.slice(s,a),this.values=this.values.slice(s*l,a*l)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(Re("KeyframeTrack: Invalid value size in track.",this),e=!1);let i=this.times,r=this.values,s=i.length;s===0&&(Re("KeyframeTrack: Track is empty.",this),e=!1);let a=null;for(let l=0;l!==s;l++){let o=i[l];if(typeof o=="number"&&isNaN(o)){Re("KeyframeTrack: Time is not a valid number.",this,l,o),e=!1;break}if(a!==null&&a>o){Re("KeyframeTrack: Out of order keys.",this,l,o,a),e=!1;break}a=o}if(r!==void 0&&Pd(r))for(let l=0,o=r.length;l!==o;++l){let c=r[l];if(isNaN(c)){Re("KeyframeTrack: Value is not a valid number.",this,l,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),i=this.getValueSize(),r=this.getInterpolation()===aa,s=e.length-1,a=1;for(let l=1;l<s;++l){let o=!1,c=e[l],h=e[l+1];if(c!==h&&(l!==1||c!==e[0]))if(r)o=!0;else{let d=l*i,u=d-i,f=d+i;for(let g=0;g!==i;++g){let v=t[d+g];if(v!==t[u+g]||v!==t[f+g]){o=!0;break}}}if(o){if(l!==a){e[a]=e[l];let d=l*i,u=a*i;for(let f=0;f!==i;++f)t[u+f]=t[d+f]}++a}}if(s>0){e[a]=e[s];for(let l=s*i,o=a*i,c=0;c!==i;++c)t[o+c]=t[l+c];++a}return a!==e.length?(this.times=e.slice(0,a),this.values=t.slice(0,a*i)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),i=this.constructor,r=new i(this.name,e,t);return r.createInterpolant=this.createInterpolant,r}};nn.prototype.ValueTypeName="";nn.prototype.TimeBufferType=Float32Array;nn.prototype.ValueBufferType=Float32Array;nn.prototype.DefaultInterpolation=ya;var di=class extends nn{constructor(e,t,i){super(e,t,i)}};di.prototype.ValueTypeName="bool";di.prototype.ValueBufferType=Array;di.prototype.DefaultInterpolation=zr;di.prototype.InterpolantFactoryMethodLinear=void 0;di.prototype.InterpolantFactoryMethodSmooth=void 0;var Va=class extends nn{constructor(e,t,i,r){super(e,t,i,r)}};Va.prototype.ValueTypeName="color";var Ga=class extends nn{constructor(e,t,i,r){super(e,t,i,r)}};Ga.prototype.ValueTypeName="number";var Wa=class extends ui{constructor(e,t,i,r){super(e,t,i,r)}interpolate_(e,t,i,r){let s=this.resultBuffer,a=this.sampleValues,l=this.valueSize,o=(i-t)/(r-t),c=e*l;for(let h=c+l;c!==h;c+=4)wn.slerpFlat(s,0,a,c-l,a,c,o);return s}},ls=class extends nn{constructor(e,t,i,r){super(e,t,i,r)}InterpolantFactoryMethodLinear(e){return new Wa(this.times,this.values,this.getValueSize(),e)}};ls.prototype.ValueTypeName="quaternion";ls.prototype.InterpolantFactoryMethodSmooth=void 0;var fi=class extends nn{constructor(e,t,i){super(e,t,i)}};fi.prototype.ValueTypeName="string";fi.prototype.ValueBufferType=Array;fi.prototype.DefaultInterpolation=zr;fi.prototype.InterpolantFactoryMethodLinear=void 0;fi.prototype.InterpolantFactoryMethodSmooth=void 0;var Xa=class extends nn{constructor(e,t,i,r){super(e,t,i,r)}};Xa.prototype.ValueTypeName="vector";var oa={enabled:!1,files:{},add:function(n,e){this.enabled!==!1&&(Ch(n)||(this.files[n]=e))},get:function(n){if(this.enabled!==!1&&!Ch(n))return this.files[n]},remove:function(n){delete this.files[n]},clear:function(){this.files={}}};function Ch(n){try{let e=n.slice(n.indexOf(":")+1);return new URL(e).protocol==="blob:"}catch{return!1}}var qa=class{constructor(e,t,i){let r=this,s=!1,a=0,l=0,o,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=i,this._abortController=null,this.itemStart=function(h){l++,s===!1&&r.onStart!==void 0&&r.onStart(h,a,l),s=!0},this.itemEnd=function(h){a++,r.onProgress!==void 0&&r.onProgress(h,a,l),a===l&&(s=!1,r.onLoad!==void 0&&r.onLoad())},this.itemError=function(h){r.onError!==void 0&&r.onError(h)},this.resolveURL=function(h){return o?o(h):h},this.setURLModifier=function(h){return o=h,this},this.addHandler=function(h,d){return c.push(h,d),this},this.removeHandler=function(h){let d=c.indexOf(h);return d!==-1&&c.splice(d,2),this},this.getHandler=function(h){for(let d=0,u=c.length;d<u;d+=2){let f=c[d],g=c[d+1];if(f.global&&(f.lastIndex=0),f.test(h))return g}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},bu=new qa,Sr=class{constructor(e){this.manager=e!==void 0?e:bu,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(e,t){let i=this;return new Promise(function(r,s){i.load(e,r,t,s)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};Sr.DEFAULT_MATERIAL_NAME="__DEFAULT";var nr=new WeakMap,Ya=class extends Sr{constructor(e){super(e)}load(e,t,i,r){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let s=this,a=oa.get(`image:${e}`);if(a!==void 0){if(a.complete===!0)s.manager.itemStart(e),setTimeout(function(){t&&t(a),s.manager.itemEnd(e)},0);else{let d=nr.get(a);d===void 0&&(d=[],nr.set(a,d)),d.push({onLoad:t,onError:r})}return a}let l=or("img");function o(){h(),t&&t(this);let d=nr.get(this)||[];for(let u=0;u<d.length;u++){let f=d[u];f.onLoad&&f.onLoad(this)}nr.delete(this),s.manager.itemEnd(e)}function c(d){h(),r&&r(d),oa.remove(`image:${e}`);let u=nr.get(this)||[];for(let f=0;f<u.length;f++){let g=u[f];g.onError&&g.onError(d)}nr.delete(this),s.manager.itemError(e),s.manager.itemEnd(e)}function h(){l.removeEventListener("load",o,!1),l.removeEventListener("error",c,!1)}return l.addEventListener("load",o,!1),l.addEventListener("error",c,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(l.crossOrigin=this.crossOrigin),oa.add(`image:${e}`,l),s.manager.itemStart(e),l.src=e,l}};var cs=class extends Sr{constructor(e){super(e)}load(e,t,i,r){let s=new Lt,a=new Ya(this.manager);return a.setCrossOrigin(this.crossOrigin),a.setPath(this.path),a.load(e,function(l){s.image=l,s.needsUpdate=!0,t!==void 0&&t(s)},i,r),s}};var ra=new C,sa=new wn,Sn=new C,hs=class extends qt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new dt,this.projectionMatrix=new dt,this.projectionMatrixInverse=new dt,this.coordinateSystem=un,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(ra,sa,Sn),Sn.x===1&&Sn.y===1&&Sn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ra,sa,Sn.set(1,1,1)).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorld.decompose(ra,sa,Sn),Sn.x===1&&Sn.y===1&&Sn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ra,sa,Sn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},ai=new C,Rh=new _e,Ih=new _e,Wt=class extends hs{constructor(e=50,t=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=ba*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(el*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return ba*2*Math.atan(Math.tan(el*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){ai.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(ai.x,ai.y).multiplyScalar(-e/ai.z),ai.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(ai.x,ai.y).multiplyScalar(-e/ai.z)}getViewSize(e,t){return this.getViewBounds(e,Rh,Ih),t.subVectors(Ih,Rh)}setViewOffset(e,t,i,r,s,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(el*.5*this.fov)/this.zoom,i=2*t,r=this.aspect*i,s=-.5*r,a=this.view;if(this.view!==null&&this.view.enabled){let o=a.fullWidth,c=a.fullHeight;s+=a.offsetX*r/o,t-=a.offsetY*i/c,r*=a.width/o,i*=a.height/c}let l=this.filmOffset;l!==0&&(s+=e*l/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,t,t-i,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}};var pi=class extends hs{constructor(e=-1,t=1,i=1,r=-1,s=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=r,this.near=s,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,r,s,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2,s=i-e,a=i+e,l=r+t,o=r-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=c*this.view.offsetX,a=s+c*this.view.width,l-=h*this.view.offsetY,o=l-h*this.view.height}this.projectionMatrix.makeOrthographic(s,a,l,o,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}};var ir=-90,rr=1,$a=class extends qt{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new Wt(ir,rr,e,t);r.layers=this.layers,this.add(r);let s=new Wt(ir,rr,e,t);s.layers=this.layers,this.add(s);let a=new Wt(ir,rr,e,t);a.layers=this.layers,this.add(a);let l=new Wt(ir,rr,e,t);l.layers=this.layers,this.add(l);let o=new Wt(ir,rr,e,t);o.layers=this.layers,this.add(o);let c=new Wt(ir,rr,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[i,r,s,a,l,o]=t;for(let c of t)this.remove(c);if(e===un)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),l.up.set(0,1,0),l.lookAt(0,0,1),o.up.set(0,1,0),o.lookAt(0,0,-1);else if(e===Gr)i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),l.up.set(0,-1,0),l.lookAt(0,0,1),o.up.set(0,-1,0),o.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[s,a,l,o,c,h]=this.children,d=e.getRenderTarget(),u=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;let v=i.texture.generateMipmaps;i.texture.generateMipmaps=!1;let p=!1;e.isWebGLRenderer===!0?p=e.state.buffers.depth.getReversed():p=e.reversedDepthBuffer,e.setRenderTarget(i,0,r),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(i,1,r),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(i,2,r),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(i,3,r),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(i,4,r),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),i.texture.generateMipmaps=v,e.setRenderTarget(i,5,r),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,h),e.setRenderTarget(d,u,f),e.xr.enabled=g,i.texture.needsPMREMUpdate=!0}},Za=class extends Wt{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}};var hc="\\[\\]\\.:\\/",wf=new RegExp("["+hc+"]","g"),uc="[^"+hc+"]",Af="[^"+hc.replace("\\.","")+"]",Cf=/((?:WC+[\/:])*)/.source.replace("WC",uc),Rf=/(WCOD+)?/.source.replace("WCOD",Af),If=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",uc),Pf=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",uc),Df=new RegExp("^"+Cf+Rf+If+Pf+"$"),Lf=["material","materials","bones","map"],Ol=class{constructor(e,t,i){let r=i||ct.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,r)}getValue(e,t){this.bind();let i=this._targetGroup.nCachedObjects_,r=this._bindings[i];r!==void 0&&r.getValue(e,t)}setValue(e,t){let i=this._bindings;for(let r=this._targetGroup.nCachedObjects_,s=i.length;r!==s;++r)i[r].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].unbind()}},ct=class n{constructor(e,t,i){this.path=t,this.parsedPath=i||n.parseTrackName(t),this.node=n.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,i){return e&&e.isAnimationObjectGroup?new n.Composite(e,t,i):new n(e,t,i)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(wf,"")}static parseTrackName(e){let t=Df.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let i={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},r=i.nodeName&&i.nodeName.lastIndexOf(".");if(r!==void 0&&r!==-1){let s=i.nodeName.substring(r+1);Lf.indexOf(s)!==-1&&(i.nodeName=i.nodeName.substring(0,r),i.objectName=s)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return i}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let i=e.skeleton.getBoneByName(t);if(i!==void 0)return i}if(e.children){let i=function(s){for(let a=0;a<s.length;a++){let l=s[a];if(l.name===t||l.uuid===t)return l;let o=i(l.children);if(o)return o}return null},r=i(e.children);if(r)return r}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)e[t++]=i[r]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)i[r]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)i[r]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)i[r]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,i=t.objectName,r=t.propertyName,s=t.propertyIndex;if(e||(e=n.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){Ce("PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let c=t.objectIndex;switch(i){case"materials":if(!e.material){Re("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){Re("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){Re("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===c){c=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){Re("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){Re("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[i]===void 0){Re("PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[i]}if(c!==void 0){if(e[c]===void 0){Re("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}let a=e[r];if(a===void 0){let c=t.nodeName;Re("PropertyBinding: Trying to update property for track: "+c+"."+r+" but it wasn't found.",e);return}let l=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?l=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(l=this.Versioning.MatrixWorldNeedsUpdate);let o=this.BindingType.Direct;if(s!==void 0){if(r==="morphTargetInfluences"){if(!e.geometry){Re("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){Re("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[s]!==void 0&&(s=e.morphTargetDictionary[s])}o=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=s}else a.fromArray!==void 0&&a.toArray!==void 0?(o=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(o=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=r;this.getValue=this.GetterByBindingType[o],this.setValue=this.SetterByBindingTypeAndVersioning[o][l]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};ct.Composite=Ol;ct.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};ct.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};ct.prototype.GetterByBindingType=[ct.prototype._getValue_direct,ct.prototype._getValue_array,ct.prototype._getValue_arrayElement,ct.prototype._getValue_toArray];ct.prototype.SetterByBindingTypeAndVersioning=[[ct.prototype._setValue_direct,ct.prototype._setValue_direct_setNeedsUpdate,ct.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[ct.prototype._setValue_array,ct.prototype._setValue_array_setNeedsUpdate,ct.prototype._setValue_array_setMatrixWorldNeedsUpdate],[ct.prototype._setValue_arrayElement,ct.prototype._setValue_arrayElement_setNeedsUpdate,ct.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[ct.prototype._setValue_fromArray,ct.prototype._setValue_fromArray_setNeedsUpdate,ct.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var Wx=new Float32Array(1);var Ph=new dt,br=class{constructor(e,t,i=0,r=1/0){this.ray=new fr(e,t),this.near=i,this.far=r,this.camera=null,this.layers=new hr,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,(t.near+t.far)/(t.near-t.far)).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):Re("Raycaster: Unsupported camera type: "+t.type)}setFromXRController(e){return Ph.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Ph),this}intersectObject(e,t=!0,i=[]){return kl(e,this,i,t),i.sort(Dh),i}intersectObjects(e,t=!0,i=[]){for(let r=0,s=e.length;r<s;r++)kl(e[r],this,i,t);return i.sort(Dh),i}};function Dh(n,e){return n.distance-e.distance}function kl(n,e,t,i){let r=!0;if(n.layers.test(e.layers)&&n.raycast(e,t)===!1&&(r=!1),r===!0&&i===!0){let s=n.children;for(let a=0,l=s.length;a<l;a++)kl(s[a],e,t,!0)}}var Bl=class n{static{n.prototype.isMatrix2=!0}constructor(e,t,i,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,i,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let i=0;i<4;i++)this.elements[i]=e[i+t];return this}set(e,t,i,r){let s=this.elements;return s[0]=e,s[2]=t,s[1]=i,s[3]=r,this}};function dc(n,e,t,i){let r=Ff(i);switch(t){case ic:return n*e;case sc:return n*e/r.components*r.byteLength;case no:return n*e/r.components*r.byteLength;case _i:return n*e*2/r.components*r.byteLength;case io:return n*e*2/r.components*r.byteLength;case rc:return n*e*3/r.components*r.byteLength;case on:return n*e*4/r.components*r.byteLength;case ro:return n*e*4/r.components*r.byteLength;case ps:case ms:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case gs:case _s:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case ao:case lo:return Math.max(n,16)*Math.max(e,8)/4;case so:case oo:return Math.max(n,8)*Math.max(e,8)/2;case co:case ho:case fo:case po:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case uo:case xs:case mo:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case go:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case _o:return Math.floor((n+4)/5)*Math.floor((e+3)/4)*16;case xo:return Math.floor((n+4)/5)*Math.floor((e+4)/5)*16;case yo:return Math.floor((n+5)/6)*Math.floor((e+4)/5)*16;case vo:return Math.floor((n+5)/6)*Math.floor((e+5)/6)*16;case So:return Math.floor((n+7)/8)*Math.floor((e+4)/5)*16;case bo:return Math.floor((n+7)/8)*Math.floor((e+5)/6)*16;case Mo:return Math.floor((n+7)/8)*Math.floor((e+7)/8)*16;case To:return Math.floor((n+9)/10)*Math.floor((e+4)/5)*16;case Eo:return Math.floor((n+9)/10)*Math.floor((e+5)/6)*16;case wo:return Math.floor((n+9)/10)*Math.floor((e+7)/8)*16;case Ao:return Math.floor((n+9)/10)*Math.floor((e+9)/10)*16;case Co:return Math.floor((n+11)/12)*Math.floor((e+9)/10)*16;case Ro:return Math.floor((n+11)/12)*Math.floor((e+11)/12)*16;case Io:case Po:case Do:return Math.ceil(n/4)*Math.ceil(e/4)*16;case Lo:case Fo:return Math.ceil(n/4)*Math.ceil(e/4)*8;case ys:case No:return Math.ceil(n/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function Ff(n){switch(n){case rn:case Ql:return{byteLength:1,components:1};case Tr:case ec:case In:return{byteLength:2,components:1};case eo:case to:return{byteLength:2,components:4};case mn:case Qa:case gn:return{byteLength:4,components:1};case tc:case nc:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${n}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"184"}}));typeof window<"u"&&(window.__THREE__?Ce("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="184");function Xu(){let n=null,e=!1,t=null,i=null;function r(s,a){t(s,a),i=n.requestAnimationFrame(r)}return{start:function(){e!==!0&&t!==null&&n!==null&&(i=n.requestAnimationFrame(r),e=!0)},stop:function(){n!==null&&n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(s){t=s},setContext:function(s){n=s}}}function Uf(n){let e=new WeakMap;function t(l,o){let c=l.array,h=l.usage,d=c.byteLength,u=n.createBuffer();n.bindBuffer(o,u),n.bufferData(o,c,h),l.onUploadCallback();let f;if(c instanceof Float32Array)f=n.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)f=n.HALF_FLOAT;else if(c instanceof Uint16Array)l.isFloat16BufferAttribute?f=n.HALF_FLOAT:f=n.UNSIGNED_SHORT;else if(c instanceof Int16Array)f=n.SHORT;else if(c instanceof Uint32Array)f=n.UNSIGNED_INT;else if(c instanceof Int32Array)f=n.INT;else if(c instanceof Int8Array)f=n.BYTE;else if(c instanceof Uint8Array)f=n.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)f=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:u,type:f,bytesPerElement:c.BYTES_PER_ELEMENT,version:l.version,size:d}}function i(l,o,c){let h=o.array,d=o.updateRanges;if(n.bindBuffer(c,l),d.length===0)n.bufferSubData(c,0,h);else{d.sort((f,g)=>f.start-g.start);let u=0;for(let f=1;f<d.length;f++){let g=d[u],v=d[f];v.start<=g.start+g.count+1?g.count=Math.max(g.count,v.start+v.count-g.start):(++u,d[u]=v)}d.length=u+1;for(let f=0,g=d.length;f<g;f++){let v=d[f];n.bufferSubData(c,v.start*h.BYTES_PER_ELEMENT,h,v.start,v.count)}o.clearUpdateRanges()}o.onUploadCallback()}function r(l){return l.isInterleavedBufferAttribute&&(l=l.data),e.get(l)}function s(l){l.isInterleavedBufferAttribute&&(l=l.data);let o=e.get(l);o&&(n.deleteBuffer(o.buffer),e.delete(l))}function a(l,o){if(l.isInterleavedBufferAttribute&&(l=l.data),l.isGLBufferAttribute){let h=e.get(l);(!h||h.version<l.version)&&e.set(l,{buffer:l.buffer,type:l.type,bytesPerElement:l.elementSize,version:l.version});return}let c=e.get(l);if(c===void 0)e.set(l,t(l,o));else if(c.version<l.version){if(c.size!==l.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,l,o),c.version=l.version}}return{get:r,remove:s,update:a}}var Of=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,kf=`#ifdef USE_ALPHAHASH
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
#endif`,Bf=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,zf=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Hf=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Vf=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Gf=`#ifdef USE_AOMAP
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
#endif`,Wf=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Xf=`#ifdef USE_BATCHING
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
#endif`,qf=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Yf=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,$f=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Zf=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,Kf=`#ifdef USE_IRIDESCENCE
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
#endif`,Jf=`#ifdef USE_BUMPMAP
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
#endif`,jf=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,Qf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,ep=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,tp=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,np=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,ip=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,rp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,sp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,ap=`#define PI 3.141592653589793
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
} // validated`,op=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,lp=`vec3 transformedNormal = objectNormal;
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
#endif`,cp=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,hp=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,up=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,dp=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,fp="gl_FragColor = linearToOutputTexel( gl_FragColor );",pp=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,mp=`#ifdef USE_ENVMAP
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
#endif`,gp=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,_p=`#ifdef USE_ENVMAP
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
#endif`,xp=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS

		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,yp=`#ifdef USE_ENVMAP
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
#endif`,vp=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Sp=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,bp=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Mp=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Tp=`#ifdef USE_GRADIENTMAP
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
}`,Ep=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,wp=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Ap=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Cp=`uniform bool receiveShadow;
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
#include <lightprobes_pars_fragment>`,Rp=`#ifdef USE_ENVMAP
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
#endif`,Ip=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Pp=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Dp=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Lp=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Fp=`PhysicalMaterial material;
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
#endif`,Np=`uniform sampler2D dfgLUT;
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
}`,Up=`
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
#endif`,Op=`#if defined( RE_IndirectDiffuse )
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
#endif`,kp=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Bp=`#ifdef USE_LIGHT_PROBES_GRID
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
#endif`,zp=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Hp=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Vp=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Gp=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Wp=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Xp=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,qp=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,Yp=`#if defined( USE_POINTS_UV )
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
#endif`,$p=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Zp=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Kp=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Jp=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,jp=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Qp=`#ifdef USE_MORPHTARGETS
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
#endif`,em=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,tm=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,nm=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,im=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,rm=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,sm=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,am=`#ifdef USE_NORMALMAP
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
#endif`,om=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,lm=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,cm=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,hm=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,um=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,dm=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,fm=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,pm=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,mm=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,gm=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,_m=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,xm=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,ym=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,vm=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Sm=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,bm=`float getShadowMask() {
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
}`,Mm=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Tm=`#ifdef USE_SKINNING
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
#endif`,Em=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,wm=`#ifdef USE_SKINNING
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
#endif`,Am=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Cm=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Rm=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Im=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,Pm=`#ifdef USE_TRANSMISSION
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
#endif`,Dm=`#ifdef USE_TRANSMISSION
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
#endif`,Lm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Fm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Nm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Um=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,Om=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,km=`uniform sampler2D t2D;
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
}`,Bm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,zm=`#ifdef ENVMAP_TYPE_CUBE
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
}`,Hm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Vm=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Gm=`#include <common>
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
}`,Wm=`#if DEPTH_PACKING == 3200
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
}`,Xm=`#define DISTANCE
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
}`,qm=`#define DISTANCE
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
}`,Ym=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,$m=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Zm=`uniform float scale;
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
}`,Km=`uniform vec3 diffuse;
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
}`,Jm=`#include <common>
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
}`,jm=`uniform vec3 diffuse;
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
}`,Qm=`#define LAMBERT
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
}`,eg=`#define LAMBERT
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
}`,tg=`#define MATCAP
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
}`,ng=`#define MATCAP
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
}`,ig=`#define NORMAL
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
}`,rg=`#define NORMAL
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
}`,sg=`#define PHONG
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
}`,ag=`#define PHONG
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
}`,og=`#define STANDARD
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
}`,lg=`#define STANDARD
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
}`,cg=`#define TOON
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
}`,hg=`#define TOON
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
}`,ug=`uniform float size;
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
}`,dg=`uniform vec3 diffuse;
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
}`,fg=`#include <common>
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
}`,pg=`uniform vec3 color;
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
}`,mg=`uniform float rotation;
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
}`,gg=`uniform vec3 diffuse;
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
}`,Be={alphahash_fragment:Of,alphahash_pars_fragment:kf,alphamap_fragment:Bf,alphamap_pars_fragment:zf,alphatest_fragment:Hf,alphatest_pars_fragment:Vf,aomap_fragment:Gf,aomap_pars_fragment:Wf,batching_pars_vertex:Xf,batching_vertex:qf,begin_vertex:Yf,beginnormal_vertex:$f,bsdfs:Zf,iridescence_fragment:Kf,bumpmap_pars_fragment:Jf,clipping_planes_fragment:jf,clipping_planes_pars_fragment:Qf,clipping_planes_pars_vertex:ep,clipping_planes_vertex:tp,color_fragment:np,color_pars_fragment:ip,color_pars_vertex:rp,color_vertex:sp,common:ap,cube_uv_reflection_fragment:op,defaultnormal_vertex:lp,displacementmap_pars_vertex:cp,displacementmap_vertex:hp,emissivemap_fragment:up,emissivemap_pars_fragment:dp,colorspace_fragment:fp,colorspace_pars_fragment:pp,envmap_fragment:mp,envmap_common_pars_fragment:gp,envmap_pars_fragment:_p,envmap_pars_vertex:xp,envmap_physical_pars_fragment:Rp,envmap_vertex:yp,fog_vertex:vp,fog_pars_vertex:Sp,fog_fragment:bp,fog_pars_fragment:Mp,gradientmap_pars_fragment:Tp,lightmap_pars_fragment:Ep,lights_lambert_fragment:wp,lights_lambert_pars_fragment:Ap,lights_pars_begin:Cp,lights_toon_fragment:Ip,lights_toon_pars_fragment:Pp,lights_phong_fragment:Dp,lights_phong_pars_fragment:Lp,lights_physical_fragment:Fp,lights_physical_pars_fragment:Np,lights_fragment_begin:Up,lights_fragment_maps:Op,lights_fragment_end:kp,lightprobes_pars_fragment:Bp,logdepthbuf_fragment:zp,logdepthbuf_pars_fragment:Hp,logdepthbuf_pars_vertex:Vp,logdepthbuf_vertex:Gp,map_fragment:Wp,map_pars_fragment:Xp,map_particle_fragment:qp,map_particle_pars_fragment:Yp,metalnessmap_fragment:$p,metalnessmap_pars_fragment:Zp,morphinstance_vertex:Kp,morphcolor_vertex:Jp,morphnormal_vertex:jp,morphtarget_pars_vertex:Qp,morphtarget_vertex:em,normal_fragment_begin:tm,normal_fragment_maps:nm,normal_pars_fragment:im,normal_pars_vertex:rm,normal_vertex:sm,normalmap_pars_fragment:am,clearcoat_normal_fragment_begin:om,clearcoat_normal_fragment_maps:lm,clearcoat_pars_fragment:cm,iridescence_pars_fragment:hm,opaque_fragment:um,packing:dm,premultiplied_alpha_fragment:fm,project_vertex:pm,dithering_fragment:mm,dithering_pars_fragment:gm,roughnessmap_fragment:_m,roughnessmap_pars_fragment:xm,shadowmap_pars_fragment:ym,shadowmap_pars_vertex:vm,shadowmap_vertex:Sm,shadowmask_pars_fragment:bm,skinbase_vertex:Mm,skinning_pars_vertex:Tm,skinning_vertex:Em,skinnormal_vertex:wm,specularmap_fragment:Am,specularmap_pars_fragment:Cm,tonemapping_fragment:Rm,tonemapping_pars_fragment:Im,transmission_fragment:Pm,transmission_pars_fragment:Dm,uv_pars_fragment:Lm,uv_pars_vertex:Fm,uv_vertex:Nm,worldpos_vertex:Um,background_vert:Om,background_frag:km,backgroundCube_vert:Bm,backgroundCube_frag:zm,cube_vert:Hm,cube_frag:Vm,depth_vert:Gm,depth_frag:Wm,distance_vert:Xm,distance_frag:qm,equirect_vert:Ym,equirect_frag:$m,linedashed_vert:Zm,linedashed_frag:Km,meshbasic_vert:Jm,meshbasic_frag:jm,meshlambert_vert:Qm,meshlambert_frag:eg,meshmatcap_vert:tg,meshmatcap_frag:ng,meshnormal_vert:ig,meshnormal_frag:rg,meshphong_vert:sg,meshphong_frag:ag,meshphysical_vert:og,meshphysical_frag:lg,meshtoon_vert:cg,meshtoon_frag:hg,points_vert:ug,points_frag:dg,shadow_vert:fg,shadow_frag:pg,sprite_vert:mg,sprite_frag:gg},le={common:{diffuse:{value:new Ze(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Le},alphaMap:{value:null},alphaMapTransform:{value:new Le},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Le}},envmap:{envMap:{value:null},envMapRotation:{value:new Le},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Le}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Le}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Le},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Le},normalScale:{value:new _e(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Le},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Le}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Le}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Le}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ze(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new C},probesMax:{value:new C},probesResolution:{value:new C}},points:{diffuse:{value:new Ze(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Le},alphaTest:{value:0},uvTransform:{value:new Le}},sprite:{diffuse:{value:new Ze(16777215)},opacity:{value:1},center:{value:new _e(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Le},alphaMap:{value:null},alphaMapTransform:{value:new Le},alphaTest:{value:0}}},Dn={basic:{uniforms:zt([le.common,le.specularmap,le.envmap,le.aomap,le.lightmap,le.fog]),vertexShader:Be.meshbasic_vert,fragmentShader:Be.meshbasic_frag},lambert:{uniforms:zt([le.common,le.specularmap,le.envmap,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.fog,le.lights,{emissive:{value:new Ze(0)},envMapIntensity:{value:1}}]),vertexShader:Be.meshlambert_vert,fragmentShader:Be.meshlambert_frag},phong:{uniforms:zt([le.common,le.specularmap,le.envmap,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.fog,le.lights,{emissive:{value:new Ze(0)},specular:{value:new Ze(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Be.meshphong_vert,fragmentShader:Be.meshphong_frag},standard:{uniforms:zt([le.common,le.envmap,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.roughnessmap,le.metalnessmap,le.fog,le.lights,{emissive:{value:new Ze(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Be.meshphysical_vert,fragmentShader:Be.meshphysical_frag},toon:{uniforms:zt([le.common,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.gradientmap,le.fog,le.lights,{emissive:{value:new Ze(0)}}]),vertexShader:Be.meshtoon_vert,fragmentShader:Be.meshtoon_frag},matcap:{uniforms:zt([le.common,le.bumpmap,le.normalmap,le.displacementmap,le.fog,{matcap:{value:null}}]),vertexShader:Be.meshmatcap_vert,fragmentShader:Be.meshmatcap_frag},points:{uniforms:zt([le.points,le.fog]),vertexShader:Be.points_vert,fragmentShader:Be.points_frag},dashed:{uniforms:zt([le.common,le.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Be.linedashed_vert,fragmentShader:Be.linedashed_frag},depth:{uniforms:zt([le.common,le.displacementmap]),vertexShader:Be.depth_vert,fragmentShader:Be.depth_frag},normal:{uniforms:zt([le.common,le.bumpmap,le.normalmap,le.displacementmap,{opacity:{value:1}}]),vertexShader:Be.meshnormal_vert,fragmentShader:Be.meshnormal_frag},sprite:{uniforms:zt([le.sprite,le.fog]),vertexShader:Be.sprite_vert,fragmentShader:Be.sprite_frag},background:{uniforms:{uvTransform:{value:new Le},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Be.background_vert,fragmentShader:Be.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Le}},vertexShader:Be.backgroundCube_vert,fragmentShader:Be.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Be.cube_vert,fragmentShader:Be.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Be.equirect_vert,fragmentShader:Be.equirect_frag},distance:{uniforms:zt([le.common,le.displacementmap,{referencePosition:{value:new C},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Be.distance_vert,fragmentShader:Be.distance_frag},shadow:{uniforms:zt([le.lights,le.fog,{color:{value:new Ze(0)},opacity:{value:1}}]),vertexShader:Be.shadow_vert,fragmentShader:Be.shadow_frag}};Dn.physical={uniforms:zt([Dn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Le},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Le},clearcoatNormalScale:{value:new _e(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Le},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Le},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Le},sheen:{value:0},sheenColor:{value:new Ze(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Le},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Le},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Le},transmissionSamplerSize:{value:new _e},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Le},attenuationDistance:{value:0},attenuationColor:{value:new Ze(0)},specularColor:{value:new Ze(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Le},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Le},anisotropyVector:{value:new _e},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Le}}]),vertexShader:Be.meshphysical_vert,fragmentShader:Be.meshphysical_frag};var ko={r:0,b:0,g:0},_g=new dt,qu=new Le;qu.set(-1,0,0,0,1,0,0,0,1);function xg(n,e,t,i,r,s){let a=new Ze(0),l=r===!0?0:1,o,c,h=null,d=0,u=null;function f(x){let b=x.isScene===!0?x.background:null;if(b&&b.isTexture){let M=x.backgroundBlurriness>0;b=e.get(b,M)}return b}function g(x){let b=!1,M=f(x);M===null?p(a,l):M&&M.isColor&&(p(M,1),b=!0);let A=n.xr.getEnvironmentBlendMode();A==="additive"?t.buffers.color.setClear(0,0,0,1,s):A==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,s),(n.autoClear||b)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function v(x,b){let M=f(b);M&&(M.isCubeTexture||M.mapping===ds)?(c===void 0&&(c=new ht(new mr(1,1,1),new tn({name:"BackgroundCubeMaterial",uniforms:Ni(Dn.backgroundCube.uniforms),vertexShader:Dn.backgroundCube.vertexShader,fragmentShader:Dn.backgroundCube.fragmentShader,side:Vt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(A,E,I){this.matrixWorld.copyPosition(I.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(c)),c.material.uniforms.envMap.value=M,c.material.uniforms.backgroundBlurriness.value=b.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=b.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(_g.makeRotationFromEuler(b.backgroundRotation)).transpose(),M.isCubeTexture&&M.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(qu),c.material.toneMapped=qe.getTransfer(M.colorSpace)!==Je,(h!==M||d!==M.version||u!==n.toneMapping)&&(c.material.needsUpdate=!0,h=M,d=M.version,u=n.toneMapping),c.layers.enableAll(),x.unshift(c,c.geometry,c.material,0,0,null)):M&&M.isTexture&&(o===void 0&&(o=new ht(new en(2,2),new tn({name:"BackgroundMaterial",uniforms:Ni(Dn.background.uniforms),vertexShader:Dn.background.vertexShader,fragmentShader:Dn.background.fragmentShader,side:Gn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),o.geometry.deleteAttribute("normal"),Object.defineProperty(o.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(o)),o.material.uniforms.t2D.value=M,o.material.uniforms.backgroundIntensity.value=b.backgroundIntensity,o.material.toneMapped=qe.getTransfer(M.colorSpace)!==Je,M.matrixAutoUpdate===!0&&M.updateMatrix(),o.material.uniforms.uvTransform.value.copy(M.matrix),(h!==M||d!==M.version||u!==n.toneMapping)&&(o.material.needsUpdate=!0,h=M,d=M.version,u=n.toneMapping),o.layers.enableAll(),x.unshift(o,o.geometry,o.material,0,0,null))}function p(x,b){x.getRGB(ko,cc(n)),t.buffers.color.setClear(ko.r,ko.g,ko.b,b,s)}function m(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),o!==void 0&&(o.geometry.dispose(),o.material.dispose(),o=void 0)}return{getClearColor:function(){return a},setClearColor:function(x,b=1){a.set(x),l=b,p(a,l)},getClearAlpha:function(){return l},setClearAlpha:function(x){l=x,p(a,l)},render:g,addToRenderList:v,dispose:m}}function yg(n,e){let t=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},r=u(null),s=r,a=!1;function l(R,O,G,X,N){let z=!1,V=d(R,X,G,O);s!==V&&(s=V,c(s.object)),z=f(R,X,G,N),z&&g(R,X,G,N),N!==null&&e.update(N,n.ELEMENT_ARRAY_BUFFER),(z||a)&&(a=!1,M(R,O,G,X),N!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(N).buffer))}function o(){return n.createVertexArray()}function c(R){return n.bindVertexArray(R)}function h(R){return n.deleteVertexArray(R)}function d(R,O,G,X){let N=X.wireframe===!0,z=i[O.id];z===void 0&&(z={},i[O.id]=z);let V=R.isInstancedMesh===!0?R.id:0,j=z[V];j===void 0&&(j={},z[V]=j);let Q=j[G.id];Q===void 0&&(Q={},j[G.id]=Q);let ce=Q[N];return ce===void 0&&(ce=u(o()),Q[N]=ce),ce}function u(R){let O=[],G=[],X=[];for(let N=0;N<t;N++)O[N]=0,G[N]=0,X[N]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:O,enabledAttributes:G,attributeDivisors:X,object:R,attributes:{},index:null}}function f(R,O,G,X){let N=s.attributes,z=O.attributes,V=0,j=G.getAttributes();for(let Q in j)if(j[Q].location>=0){let be=N[Q],we=z[Q];if(we===void 0&&(Q==="instanceMatrix"&&R.instanceMatrix&&(we=R.instanceMatrix),Q==="instanceColor"&&R.instanceColor&&(we=R.instanceColor)),be===void 0||be.attribute!==we||we&&be.data!==we.data)return!0;V++}return s.attributesNum!==V||s.index!==X}function g(R,O,G,X){let N={},z=O.attributes,V=0,j=G.getAttributes();for(let Q in j)if(j[Q].location>=0){let be=z[Q];be===void 0&&(Q==="instanceMatrix"&&R.instanceMatrix&&(be=R.instanceMatrix),Q==="instanceColor"&&R.instanceColor&&(be=R.instanceColor));let we={};we.attribute=be,be&&be.data&&(we.data=be.data),N[Q]=we,V++}s.attributes=N,s.attributesNum=V,s.index=X}function v(){let R=s.newAttributes;for(let O=0,G=R.length;O<G;O++)R[O]=0}function p(R){m(R,0)}function m(R,O){let G=s.newAttributes,X=s.enabledAttributes,N=s.attributeDivisors;G[R]=1,X[R]===0&&(n.enableVertexAttribArray(R),X[R]=1),N[R]!==O&&(n.vertexAttribDivisor(R,O),N[R]=O)}function x(){let R=s.newAttributes,O=s.enabledAttributes;for(let G=0,X=O.length;G<X;G++)O[G]!==R[G]&&(n.disableVertexAttribArray(G),O[G]=0)}function b(R,O,G,X,N,z,V){V===!0?n.vertexAttribIPointer(R,O,G,N,z):n.vertexAttribPointer(R,O,G,X,N,z)}function M(R,O,G,X){v();let N=X.attributes,z=G.getAttributes(),V=O.defaultAttributeValues;for(let j in z){let Q=z[j];if(Q.location>=0){let ce=N[j];if(ce===void 0&&(j==="instanceMatrix"&&R.instanceMatrix&&(ce=R.instanceMatrix),j==="instanceColor"&&R.instanceColor&&(ce=R.instanceColor)),ce!==void 0){let be=ce.normalized,we=ce.itemSize,Ye=e.get(ce);if(Ye===void 0)continue;let je=Ye.buffer,Oe=Ye.type,Z=Ye.bytesPerElement,de=Oe===n.INT||Oe===n.UNSIGNED_INT||ce.gpuType===Qa;if(ce.isInterleavedBufferAttribute){let ie=ce.data,Ie=ie.stride,Fe=ce.offset;if(ie.isInstancedInterleavedBuffer){for(let Pe=0;Pe<Q.locationSize;Pe++)m(Q.location+Pe,ie.meshPerAttribute);R.isInstancedMesh!==!0&&X._maxInstanceCount===void 0&&(X._maxInstanceCount=ie.meshPerAttribute*ie.count)}else for(let Pe=0;Pe<Q.locationSize;Pe++)p(Q.location+Pe);n.bindBuffer(n.ARRAY_BUFFER,je);for(let Pe=0;Pe<Q.locationSize;Pe++)b(Q.location+Pe,we/Q.locationSize,Oe,be,Ie*Z,(Fe+we/Q.locationSize*Pe)*Z,de)}else{if(ce.isInstancedBufferAttribute){for(let ie=0;ie<Q.locationSize;ie++)m(Q.location+ie,ce.meshPerAttribute);R.isInstancedMesh!==!0&&X._maxInstanceCount===void 0&&(X._maxInstanceCount=ce.meshPerAttribute*ce.count)}else for(let ie=0;ie<Q.locationSize;ie++)p(Q.location+ie);n.bindBuffer(n.ARRAY_BUFFER,je);for(let ie=0;ie<Q.locationSize;ie++)b(Q.location+ie,we/Q.locationSize,Oe,be,we*Z,we/Q.locationSize*ie*Z,de)}}else if(V!==void 0){let be=V[j];if(be!==void 0)switch(be.length){case 2:n.vertexAttrib2fv(Q.location,be);break;case 3:n.vertexAttrib3fv(Q.location,be);break;case 4:n.vertexAttrib4fv(Q.location,be);break;default:n.vertexAttrib1fv(Q.location,be)}}}}x()}function A(){w();for(let R in i){let O=i[R];for(let G in O){let X=O[G];for(let N in X){let z=X[N];for(let V in z)h(z[V].object),delete z[V];delete X[N]}}delete i[R]}}function E(R){if(i[R.id]===void 0)return;let O=i[R.id];for(let G in O){let X=O[G];for(let N in X){let z=X[N];for(let V in z)h(z[V].object),delete z[V];delete X[N]}}delete i[R.id]}function I(R){for(let O in i){let G=i[O];for(let X in G){let N=G[X];if(N[R.id]===void 0)continue;let z=N[R.id];for(let V in z)h(z[V].object),delete z[V];delete N[R.id]}}}function y(R){for(let O in i){let G=i[O],X=R.isInstancedMesh===!0?R.id:0,N=G[X];if(N!==void 0){for(let z in N){let V=N[z];for(let j in V)h(V[j].object),delete V[j];delete N[z]}delete G[X],Object.keys(G).length===0&&delete i[O]}}}function w(){F(),a=!0,s!==r&&(s=r,c(s.object))}function F(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:l,reset:w,resetDefaultState:F,dispose:A,releaseStatesOfGeometry:E,releaseStatesOfObject:y,releaseStatesOfProgram:I,initAttributes:v,enableAttribute:p,disableUnusedAttributes:x}}function vg(n,e,t){let i;function r(o){i=o}function s(o,c){n.drawArrays(i,o,c),t.update(c,i,1)}function a(o,c,h){h!==0&&(n.drawArraysInstanced(i,o,c,h),t.update(c,i,h))}function l(o,c,h){if(h===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,o,0,c,0,h);let u=0;for(let f=0;f<h;f++)u+=c[f];t.update(u,i,1)}this.setMode=r,this.render=s,this.renderInstances=a,this.renderMultiDraw=l}function Sg(n,e,t,i){let r;function s(){if(r!==void 0)return r;if(e.has("EXT_texture_filter_anisotropic")===!0){let I=e.get("EXT_texture_filter_anisotropic");r=n.getParameter(I.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function a(I){return!(I!==on&&i.convert(I)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function l(I){let y=I===In&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(I!==rn&&i.convert(I)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE)&&I!==gn&&!y)}function o(I){if(I==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";I="mediump"}return I==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp",h=o(c);h!==c&&(Ce("WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);let d=t.logarithmicDepthBuffer===!0,u=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control");t.reversedDepthBuffer===!0&&u===!1&&Ce("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let f=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),g=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),v=n.getParameter(n.MAX_TEXTURE_SIZE),p=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),m=n.getParameter(n.MAX_VERTEX_ATTRIBS),x=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),b=n.getParameter(n.MAX_VARYING_VECTORS),M=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),A=n.getParameter(n.MAX_SAMPLES),E=n.getParameter(n.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:o,textureFormatReadable:a,textureTypeReadable:l,precision:c,logarithmicDepthBuffer:d,reversedDepthBuffer:u,maxTextures:f,maxVertexTextures:g,maxTextureSize:v,maxCubemapSize:p,maxAttributes:m,maxVertexUniforms:x,maxVaryings:b,maxFragmentUniforms:M,maxSamples:A,samples:E}}function bg(n){let e=this,t=null,i=0,r=!1,s=!1,a=new bn,l=new Le,o={value:null,needsUpdate:!1};this.uniform=o,this.numPlanes=0,this.numIntersection=0,this.init=function(d,u){let f=d.length!==0||u||i!==0||r;return r=u,i=d.length,f},this.beginShadows=function(){s=!0,h(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(d,u){t=h(d,u,0)},this.setState=function(d,u,f){let g=d.clippingPlanes,v=d.clipIntersection,p=d.clipShadows,m=n.get(d);if(!r||g===null||g.length===0||s&&!p)s?h(null):c();else{let x=s?0:i,b=x*4,M=m.clippingState||null;o.value=M,M=h(g,u,b,f);for(let A=0;A!==b;++A)M[A]=t[A];m.clippingState=M,this.numIntersection=v?this.numPlanes:0,this.numPlanes+=x}};function c(){o.value!==t&&(o.value=t,o.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function h(d,u,f,g){let v=d!==null?d.length:0,p=null;if(v!==0){if(p=o.value,g!==!0||p===null){let m=f+v*4,x=u.matrixWorldInverse;l.getNormalMatrix(x),(p===null||p.length<m)&&(p=new Float32Array(m));for(let b=0,M=f;b!==v;++b,M+=4)a.copy(d[b]).applyMatrix4(x,l),a.normal.toArray(p,M),p[M+3]=a.constant}o.value=p,o.needsUpdate=!0}return e.numPlanes=v,e.numIntersection=0,p}}var xi=4,Mu=[.125,.215,.35,.446,.526,.582],Ui=20,Mg=256,vs=new pi,Tu=new Ze,fc=null,pc=0,mc=0,gc=!1,Tg=new C,zo=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._sigmas=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,i=.1,r=100,s={}){let{size:a=256,position:l=Tg}=s;fc=this._renderer.getRenderTarget(),pc=this._renderer.getActiveCubeFace(),mc=this._renderer.getActiveMipmapLevel(),gc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);let o=this._allocateTargets();return o.depthBuffer=!0,this._sceneToCubeUV(e,i,r,o,l),t>0&&this._blur(o,0,0,t),this._applyPMREM(o),this._cleanup(o),o}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Au(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=wu(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(fc,pc,mc),this._renderer.xr.enabled=gc,e.scissorTest=!1,wr(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===mi||e.mapping===Fi?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),fc=this._renderer.getRenderTarget(),pc=this._renderer.getActiveCubeFace(),mc=this._renderer.getActiveMipmapLevel(),gc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:Se,minFilter:Se,generateMipmaps:!1,type:In,format:on,colorSpace:Hr,depthBuffer:!1},r=Eu(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Eu(e,t,i);let{_lodMax:s}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods,sigmas:this._sigmas}=Eg(s)),this._blurMaterial=Ag(s,e,t),this._ggxMaterial=wg(s,e,t)}return r}_compileMaterial(e){let t=new ht(new ot,e);this._renderer.compile(t,vs)}_sceneToCubeUV(e,t,i,r,s){let o=new Wt(90,1,t,i),c=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],d=this._renderer,u=d.autoClear,f=d.toneMapping;d.getClearColor(Tu),d.toneMapping=fn,d.autoClear=!1,d.state.buffers.depth.getReversed()&&(d.setRenderTarget(r),d.clearDepth(),d.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new ht(new mr,new Ft({name:"PMREM.Background",side:Vt,depthWrite:!1,depthTest:!1})));let v=this._backgroundBox,p=v.material,m=!1,x=e.background;x?x.isColor&&(p.color.copy(x),e.background=null,m=!0):(p.color.copy(Tu),m=!0);for(let b=0;b<6;b++){let M=b%3;M===0?(o.up.set(0,c[b],0),o.position.set(s.x,s.y,s.z),o.lookAt(s.x+h[b],s.y,s.z)):M===1?(o.up.set(0,0,c[b]),o.position.set(s.x,s.y,s.z),o.lookAt(s.x,s.y+h[b],s.z)):(o.up.set(0,c[b],0),o.position.set(s.x,s.y,s.z),o.lookAt(s.x,s.y,s.z+h[b]));let A=this._cubeSize;wr(r,M*A,b>2?A:0,A,A),d.setRenderTarget(r),m&&d.render(v,o),d.render(e,o)}d.toneMapping=f,d.autoClear=u,e.background=x}_textureToCubeUV(e,t){let i=this._renderer,r=e.mapping===mi||e.mapping===Fi;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=Au()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=wu());let s=r?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=s;let l=s.uniforms;l.envMap.value=e;let o=this._cubeSize;wr(t,0,0,3*o,2*o),i.setRenderTarget(t),i.render(a,vs)}_applyPMREM(e){let t=this._renderer,i=t.autoClear;t.autoClear=!1;let r=this._lodMeshes.length;for(let s=1;s<r;s++)this._applyGGXFilter(e,s-1,s);t.autoClear=i}_applyGGXFilter(e,t,i){let r=this._renderer,s=this._pingPongRenderTarget,a=this._ggxMaterial,l=this._lodMeshes[i];l.material=a;let o=a.uniforms,c=i/(this._lodMeshes.length-1),h=t/(this._lodMeshes.length-1),d=Math.sqrt(c*c-h*h),u=0+c*1.25,f=d*u,{_lodMax:g}=this,v=this._sizeLods[i],p=3*v*(i>g-xi?i-g+xi:0),m=4*(this._cubeSize-v);o.envMap.value=e.texture,o.roughness.value=f,o.mipInt.value=g-t,wr(s,p,m,3*v,2*v),r.setRenderTarget(s),r.render(l,vs),o.envMap.value=s.texture,o.roughness.value=0,o.mipInt.value=g-i,wr(e,p,m,3*v,2*v),r.setRenderTarget(e),r.render(l,vs)}_blur(e,t,i,r,s){let a=this._pingPongRenderTarget;this._halfBlur(e,a,t,i,r,"latitudinal",s),this._halfBlur(a,e,i,i,r,"longitudinal",s)}_halfBlur(e,t,i,r,s,a,l){let o=this._renderer,c=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&Re("blur direction must be either latitudinal or longitudinal!");let h=3,d=this._lodMeshes[r];d.material=c;let u=c.uniforms,f=this._sizeLods[i]-1,g=isFinite(s)?Math.PI/(2*f):2*Math.PI/(2*Ui-1),v=s/g,p=isFinite(s)?1+Math.floor(h*v):Ui;p>Ui&&Ce(`sigmaRadians, ${s}, is too large and will clip, as it requested ${p} samples when the maximum is set to ${Ui}`);let m=[],x=0;for(let I=0;I<Ui;++I){let y=I/v,w=Math.exp(-y*y/2);m.push(w),I===0?x+=w:I<p&&(x+=2*w)}for(let I=0;I<m.length;I++)m[I]=m[I]/x;u.envMap.value=e.texture,u.samples.value=p,u.weights.value=m,u.latitudinal.value=a==="latitudinal",l&&(u.poleAxis.value=l);let{_lodMax:b}=this;u.dTheta.value=g,u.mipInt.value=b-i;let M=this._sizeLods[r],A=3*M*(r>b-xi?r-b+xi:0),E=4*(this._cubeSize-M);wr(t,A,E,3*M,2*M),o.setRenderTarget(t),o.render(d,vs)}};function Eg(n){let e=[],t=[],i=[],r=n,s=n-xi+1+Mu.length;for(let a=0;a<s;a++){let l=Math.pow(2,r);e.push(l);let o=1/l;a>n-xi?o=Mu[a-n+xi-1]:a===0&&(o=0),t.push(o);let c=1/(l-2),h=-c,d=1+c,u=[h,h,d,h,d,d,h,h,d,d,h,d],f=6,g=6,v=3,p=2,m=1,x=new Float32Array(v*g*f),b=new Float32Array(p*g*f),M=new Float32Array(m*g*f);for(let E=0;E<f;E++){let I=E%3*2/3-1,y=E>2?0:-1,w=[I,y,0,I+2/3,y,0,I+2/3,y+1,0,I,y,0,I+2/3,y+1,0,I,y+1,0];x.set(w,v*g*E),b.set(u,p*g*E);let F=[E,E,E,E,E,E];M.set(F,m*g*E)}let A=new ot;A.setAttribute("position",new Xt(x,v)),A.setAttribute("uv",new Xt(b,p)),A.setAttribute("faceIndex",new Xt(M,m)),i.push(new ht(A,null)),r>xi&&r--}return{lodMeshes:i,sizeLods:e,sigmas:t}}function Eu(n,e,t){let i=new jt(n,e,t);return i.texture.mapping=ds,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function wr(n,e,t,i,r){n.viewport.set(e,t,i,r),n.scissor.set(e,t,i,r)}function wg(n,e,t){return new tn({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:Mg,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Vo(),fragmentShader:`

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
		`,blending:Rn,depthTest:!1,depthWrite:!1})}function Ag(n,e,t){let i=new Float32Array(Ui),r=new C(0,1,0);return new tn({name:"SphericalGaussianBlur",defines:{n:Ui,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:r}},vertexShader:Vo(),fragmentShader:`

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
		`,blending:Rn,depthTest:!1,depthWrite:!1})}function wu(){return new tn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Vo(),fragmentShader:`

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
		`,blending:Rn,depthTest:!1,depthWrite:!1})}function Au(){return new tn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Vo(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Rn,depthTest:!1,depthWrite:!1})}function Vo(){return`

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
	`}var Ho=class extends jt{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let i={width:e,height:e,depth:1},r=[i,i,i,i,i,i];this.texture=new Kr(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},r=new mr(5,5,5),s=new tn({name:"CubemapFromEquirect",uniforms:Ni(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Vt,blending:Rn});s.uniforms.tEquirect.value=t;let a=new ht(r,s),l=t.minFilter;return t.minFilter===pn&&(t.minFilter=Se),new $a(1,10,this).update(e,a),t.minFilter=l,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,i=!0,r=!0){let s=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,i,r);e.setRenderTarget(s)}};function Cg(n){let e=new WeakMap,t=new WeakMap,i=null;function r(u,f=!1){return u==null?null:f?a(u):s(u)}function s(u){if(u&&u.isTexture){let f=u.mapping;if(f===Ka||f===Ja)if(e.has(u)){let g=e.get(u).texture;return l(g,u.mapping)}else{let g=u.image;if(g&&g.height>0){let v=new Ho(g.height);return v.fromEquirectangularTexture(n,u),e.set(u,v),u.addEventListener("dispose",c),l(v.texture,u.mapping)}else return null}}return u}function a(u){if(u&&u.isTexture){let f=u.mapping,g=f===Ka||f===Ja,v=f===mi||f===Fi;if(g||v){let p=t.get(u),m=p!==void 0?p.texture.pmremVersion:0;if(u.isRenderTargetTexture&&u.pmremVersion!==m)return i===null&&(i=new zo(n)),p=g?i.fromEquirectangular(u,p):i.fromCubemap(u,p),p.texture.pmremVersion=u.pmremVersion,t.set(u,p),p.texture;if(p!==void 0)return p.texture;{let x=u.image;return g&&x&&x.height>0||v&&x&&o(x)?(i===null&&(i=new zo(n)),p=g?i.fromEquirectangular(u):i.fromCubemap(u),p.texture.pmremVersion=u.pmremVersion,t.set(u,p),u.addEventListener("dispose",h),p.texture):null}}}return u}function l(u,f){return f===Ka?u.mapping=mi:f===Ja&&(u.mapping=Fi),u}function o(u){let f=0,g=6;for(let v=0;v<g;v++)u[v]!==void 0&&f++;return f===g}function c(u){let f=u.target;f.removeEventListener("dispose",c);let g=e.get(f);g!==void 0&&(e.delete(f),g.dispose())}function h(u){let f=u.target;f.removeEventListener("dispose",h);let g=t.get(f);g!==void 0&&(t.delete(f),g.dispose())}function d(){e=new WeakMap,t=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:r,dispose:d}}function Rg(n){let e={};function t(i){if(e[i]!==void 0)return e[i];let r=n.getExtension(i);return e[i]=r,r}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){let r=t(i);return r===null&&Sa("WebGLRenderer: "+i+" extension not supported."),r}}}function Ig(n,e,t,i){let r={},s=new WeakMap;function a(d){let u=d.target;u.index!==null&&e.remove(u.index);for(let g in u.attributes)e.remove(u.attributes[g]);u.removeEventListener("dispose",a),delete r[u.id];let f=s.get(u);f&&(e.remove(f),s.delete(u)),i.releaseStatesOfGeometry(u),u.isInstancedBufferGeometry===!0&&delete u._maxInstanceCount,t.memory.geometries--}function l(d,u){return r[u.id]===!0||(u.addEventListener("dispose",a),r[u.id]=!0,t.memory.geometries++),u}function o(d){let u=d.attributes;for(let f in u)e.update(u[f],n.ARRAY_BUFFER)}function c(d){let u=[],f=d.index,g=d.attributes.position,v=0;if(g===void 0)return;if(f!==null){let x=f.array;v=f.version;for(let b=0,M=x.length;b<M;b+=3){let A=x[b+0],E=x[b+1],I=x[b+2];u.push(A,E,E,I,I,A)}}else{let x=g.array;v=g.version;for(let b=0,M=x.length/3-1;b<M;b+=3){let A=b+0,E=b+1,I=b+2;u.push(A,E,E,I,I,A)}}let p=new(g.count>=65535?Yr:qr)(u,1);p.version=v;let m=s.get(d);m&&e.remove(m),s.set(d,p)}function h(d){let u=s.get(d);if(u){let f=d.index;f!==null&&u.version<f.version&&c(d)}else c(d);return s.get(d)}return{get:l,update:o,getWireframeAttribute:h}}function Pg(n,e,t){let i;function r(d){i=d}let s,a;function l(d){s=d.type,a=d.bytesPerElement}function o(d,u){n.drawElements(i,u,s,d*a),t.update(u,i,1)}function c(d,u,f){f!==0&&(n.drawElementsInstanced(i,u,s,d*a,f),t.update(u,i,f))}function h(d,u,f){if(f===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,u,0,s,d,0,f);let v=0;for(let p=0;p<f;p++)v+=u[p];t.update(v,i,1)}this.setMode=r,this.setIndex=l,this.render=o,this.renderInstances=c,this.renderMultiDraw=h}function Dg(n){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(s,a,l){switch(t.calls++,a){case n.TRIANGLES:t.triangles+=l*(s/3);break;case n.LINES:t.lines+=l*(s/2);break;case n.LINE_STRIP:t.lines+=l*(s-1);break;case n.LINE_LOOP:t.lines+=l*s;break;case n.POINTS:t.points+=l*s;break;default:Re("WebGLInfo: Unknown draw mode:",a);break}}function r(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:r,update:i}}function Lg(n,e,t){let i=new WeakMap,r=new vt;function s(a,l,o){let c=a.morphTargetInfluences,h=l.morphAttributes.position||l.morphAttributes.normal||l.morphAttributes.color,d=h!==void 0?h.length:0,u=i.get(l);if(u===void 0||u.count!==d){let w=function(){I.dispose(),i.delete(l),l.removeEventListener("dispose",w)};u!==void 0&&u.texture.dispose();let f=l.morphAttributes.position!==void 0,g=l.morphAttributes.normal!==void 0,v=l.morphAttributes.color!==void 0,p=l.morphAttributes.position||[],m=l.morphAttributes.normal||[],x=l.morphAttributes.color||[],b=0;f===!0&&(b=1),g===!0&&(b=2),v===!0&&(b=3);let M=l.attributes.position.count*b,A=1;M>e.maxTextureSize&&(A=Math.ceil(M/e.maxTextureSize),M=e.maxTextureSize);let E=new Float32Array(M*A*4*d),I=new Xr(E,M,A,d);I.type=gn,I.needsUpdate=!0;let y=b*4;for(let F=0;F<d;F++){let R=p[F],O=m[F],G=x[F],X=M*A*4*F;for(let N=0;N<R.count;N++){let z=N*y;f===!0&&(r.fromBufferAttribute(R,N),E[X+z+0]=r.x,E[X+z+1]=r.y,E[X+z+2]=r.z,E[X+z+3]=0),g===!0&&(r.fromBufferAttribute(O,N),E[X+z+4]=r.x,E[X+z+5]=r.y,E[X+z+6]=r.z,E[X+z+7]=0),v===!0&&(r.fromBufferAttribute(G,N),E[X+z+8]=r.x,E[X+z+9]=r.y,E[X+z+10]=r.z,E[X+z+11]=G.itemSize===4?r.w:1)}}u={count:d,texture:I,size:new _e(M,A)},i.set(l,u),l.addEventListener("dispose",w)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)o.getUniforms().setValue(n,"morphTexture",a.morphTexture,t);else{let f=0;for(let v=0;v<c.length;v++)f+=c[v];let g=l.morphTargetsRelative?1:1-f;o.getUniforms().setValue(n,"morphTargetBaseInfluence",g),o.getUniforms().setValue(n,"morphTargetInfluences",c)}o.getUniforms().setValue(n,"morphTargetsTexture",u.texture,t),o.getUniforms().setValue(n,"morphTargetsTextureSize",u.size)}return{update:s}}function Fg(n,e,t,i,r){let s=new WeakMap;function a(c){let h=r.render.frame,d=c.geometry,u=e.get(c,d);if(s.get(u)!==h&&(e.update(u),s.set(u,h)),c.isInstancedMesh&&(c.hasEventListener("dispose",o)===!1&&c.addEventListener("dispose",o),s.get(c)!==h&&(t.update(c.instanceMatrix,n.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,n.ARRAY_BUFFER),s.set(c,h))),c.isSkinnedMesh){let f=c.skeleton;s.get(f)!==h&&(f.update(),s.set(f,h))}return u}function l(){s=new WeakMap}function o(c){let h=c.target;h.removeEventListener("dispose",o),i.releaseStatesOfObject(h),t.remove(h.instanceMatrix),h.instanceColor!==null&&t.remove(h.instanceColor)}return{update:a,dispose:l}}var Ng={[Xl]:"LINEAR_TONE_MAPPING",[ql]:"REINHARD_TONE_MAPPING",[Yl]:"CINEON_TONE_MAPPING",[$l]:"ACES_FILMIC_TONE_MAPPING",[Kl]:"AGX_TONE_MAPPING",[Jl]:"NEUTRAL_TONE_MAPPING",[Zl]:"CUSTOM_TONE_MAPPING"};function Ug(n,e,t,i,r){let s=new jt(e,t,{type:n,depthBuffer:i,stencilBuffer:r,depthTexture:i?new Xn(e,t):void 0}),a=new jt(e,t,{type:In,depthBuffer:!1,stencilBuffer:!1}),l=new ot;l.setAttribute("position",new gt([-1,3,0,-1,-1,0,3,-1,0],3)),l.setAttribute("uv",new gt([0,2,0,0,2,0],2));let o=new Na({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),c=new ht(l,o),h=new pi(-1,1,1,-1,0,1),d=null,u=null,f=!1,g,v=null,p=[],m=!1;this.setSize=function(x,b){s.setSize(x,b),a.setSize(x,b);for(let M=0;M<p.length;M++){let A=p[M];A.setSize&&A.setSize(x,b)}},this.setEffects=function(x){p=x,m=p.length>0&&p[0].isRenderPass===!0;let b=s.width,M=s.height;for(let A=0;A<p.length;A++){let E=p[A];E.setSize&&E.setSize(b,M)}},this.begin=function(x,b){if(f||x.toneMapping===fn&&p.length===0)return!1;if(v=b,b!==null){let M=b.width,A=b.height;(s.width!==M||s.height!==A)&&this.setSize(M,A)}return m===!1&&x.setRenderTarget(s),g=x.toneMapping,x.toneMapping=fn,!0},this.hasRenderPass=function(){return m},this.end=function(x,b){x.toneMapping=g,f=!0;let M=s,A=a;for(let E=0;E<p.length;E++){let I=p[E];if(I.enabled!==!1&&(I.render(x,A,M,b),I.needsSwap!==!1)){let y=M;M=A,A=y}}if(d!==x.outputColorSpace||u!==x.toneMapping){d=x.outputColorSpace,u=x.toneMapping,o.defines={},qe.getTransfer(d)===Je&&(o.defines.SRGB_TRANSFER="");let E=Ng[u];E&&(o.defines[E]=""),o.needsUpdate=!0}o.uniforms.tDiffuse.value=M.texture,x.setRenderTarget(v),x.render(c,h),v=null,f=!1},this.isCompositing=function(){return f},this.dispose=function(){s.depthTexture&&s.depthTexture.dispose(),s.dispose(),a.dispose(),l.dispose(),o.dispose()}}var Yu=new Lt,yc=new Xn(1,1),$u=new Xr,Zu=new Ea,Ku=new Kr,Cu=[],Ru=[],Iu=new Float32Array(16),Pu=new Float32Array(9),Du=new Float32Array(4);function Cr(n,e,t){let i=n[0];if(i<=0||i>0)return n;let r=e*t,s=Cu[r];if(s===void 0&&(s=new Float32Array(r),Cu[r]=s),e!==0){i.toArray(s,0);for(let a=1,l=0;a!==e;++a)l+=t,n[a].toArray(s,l)}return s}function Rt(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function It(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function Go(n,e){let t=Ru[e];t===void 0&&(t=new Int32Array(e),Ru[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function Og(n,e){let t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function kg(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Rt(t,e))return;n.uniform2fv(this.addr,e),It(t,e)}}function Bg(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Rt(t,e))return;n.uniform3fv(this.addr,e),It(t,e)}}function zg(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Rt(t,e))return;n.uniform4fv(this.addr,e),It(t,e)}}function Hg(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Rt(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),It(t,e)}else{if(Rt(t,i))return;Du.set(i),n.uniformMatrix2fv(this.addr,!1,Du),It(t,i)}}function Vg(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Rt(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),It(t,e)}else{if(Rt(t,i))return;Pu.set(i),n.uniformMatrix3fv(this.addr,!1,Pu),It(t,i)}}function Gg(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Rt(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),It(t,e)}else{if(Rt(t,i))return;Iu.set(i),n.uniformMatrix4fv(this.addr,!1,Iu),It(t,i)}}function Wg(n,e){let t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function Xg(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Rt(t,e))return;n.uniform2iv(this.addr,e),It(t,e)}}function qg(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Rt(t,e))return;n.uniform3iv(this.addr,e),It(t,e)}}function Yg(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Rt(t,e))return;n.uniform4iv(this.addr,e),It(t,e)}}function $g(n,e){let t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function Zg(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Rt(t,e))return;n.uniform2uiv(this.addr,e),It(t,e)}}function Kg(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Rt(t,e))return;n.uniform3uiv(this.addr,e),It(t,e)}}function Jg(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Rt(t,e))return;n.uniform4uiv(this.addr,e),It(t,e)}}function jg(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r);let s;this.type===n.SAMPLER_2D_SHADOW?(yc.compareFunction=t.isReversedDepthBuffer()?Oo:Uo,s=yc):s=Yu,t.setTexture2D(e||s,r)}function Qg(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture3D(e||Zu,r)}function e0(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTextureCube(e||Ku,r)}function t0(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture2DArray(e||$u,r)}function n0(n){switch(n){case 5126:return Og;case 35664:return kg;case 35665:return Bg;case 35666:return zg;case 35674:return Hg;case 35675:return Vg;case 35676:return Gg;case 5124:case 35670:return Wg;case 35667:case 35671:return Xg;case 35668:case 35672:return qg;case 35669:case 35673:return Yg;case 5125:return $g;case 36294:return Zg;case 36295:return Kg;case 36296:return Jg;case 35678:case 36198:case 36298:case 36306:case 35682:return jg;case 35679:case 36299:case 36307:return Qg;case 35680:case 36300:case 36308:case 36293:return e0;case 36289:case 36303:case 36311:case 36292:return t0}}function i0(n,e){n.uniform1fv(this.addr,e)}function r0(n,e){let t=Cr(e,this.size,2);n.uniform2fv(this.addr,t)}function s0(n,e){let t=Cr(e,this.size,3);n.uniform3fv(this.addr,t)}function a0(n,e){let t=Cr(e,this.size,4);n.uniform4fv(this.addr,t)}function o0(n,e){let t=Cr(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function l0(n,e){let t=Cr(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function c0(n,e){let t=Cr(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function h0(n,e){n.uniform1iv(this.addr,e)}function u0(n,e){n.uniform2iv(this.addr,e)}function d0(n,e){n.uniform3iv(this.addr,e)}function f0(n,e){n.uniform4iv(this.addr,e)}function p0(n,e){n.uniform1uiv(this.addr,e)}function m0(n,e){n.uniform2uiv(this.addr,e)}function g0(n,e){n.uniform3uiv(this.addr,e)}function _0(n,e){n.uniform4uiv(this.addr,e)}function x0(n,e,t){let i=this.cache,r=e.length,s=Go(t,r);Rt(i,s)||(n.uniform1iv(this.addr,s),It(i,s));let a;this.type===n.SAMPLER_2D_SHADOW?a=yc:a=Yu;for(let l=0;l!==r;++l)t.setTexture2D(e[l]||a,s[l])}function y0(n,e,t){let i=this.cache,r=e.length,s=Go(t,r);Rt(i,s)||(n.uniform1iv(this.addr,s),It(i,s));for(let a=0;a!==r;++a)t.setTexture3D(e[a]||Zu,s[a])}function v0(n,e,t){let i=this.cache,r=e.length,s=Go(t,r);Rt(i,s)||(n.uniform1iv(this.addr,s),It(i,s));for(let a=0;a!==r;++a)t.setTextureCube(e[a]||Ku,s[a])}function S0(n,e,t){let i=this.cache,r=e.length,s=Go(t,r);Rt(i,s)||(n.uniform1iv(this.addr,s),It(i,s));for(let a=0;a!==r;++a)t.setTexture2DArray(e[a]||$u,s[a])}function b0(n){switch(n){case 5126:return i0;case 35664:return r0;case 35665:return s0;case 35666:return a0;case 35674:return o0;case 35675:return l0;case 35676:return c0;case 5124:case 35670:return h0;case 35667:case 35671:return u0;case 35668:case 35672:return d0;case 35669:case 35673:return f0;case 5125:return p0;case 36294:return m0;case 36295:return g0;case 36296:return _0;case 35678:case 36198:case 36298:case 36306:case 35682:return x0;case 35679:case 36299:case 36307:return y0;case 35680:case 36300:case 36308:case 36293:return v0;case 36289:case 36303:case 36311:case 36292:return S0}}var vc=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=n0(t.type)}},Sc=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=b0(t.type)}},bc=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){let r=this.seq;for(let s=0,a=r.length;s!==a;++s){let l=r[s];l.setValue(e,t[l.id],i)}}},_c=/(\w+)(\])?(\[|\.)?/g;function Lu(n,e){n.seq.push(e),n.map[e.id]=e}function M0(n,e,t){let i=n.name,r=i.length;for(_c.lastIndex=0;;){let s=_c.exec(i),a=_c.lastIndex,l=s[1],o=s[2]==="]",c=s[3];if(o&&(l=l|0),c===void 0||c==="["&&a+2===r){Lu(t,c===void 0?new vc(l,n,e):new Sc(l,n,e));break}else{let d=t.map[l];d===void 0&&(d=new bc(l),Lu(t,d)),t=d}}}var Ar=class{constructor(e,t){this.seq=[],this.map={};let i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let a=0;a<i;++a){let l=e.getActiveUniform(t,a),o=e.getUniformLocation(t,l.name);M0(l,o,this)}let r=[],s=[];for(let a of this.seq)a.type===e.SAMPLER_2D_SHADOW||a.type===e.SAMPLER_CUBE_SHADOW||a.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(a):s.push(a);r.length>0&&(this.seq=r.concat(s))}setValue(e,t,i,r){let s=this.map[t];s!==void 0&&s.setValue(e,i,r)}setOptional(e,t,i){let r=t[i];r!==void 0&&this.setValue(e,i,r)}static upload(e,t,i,r){for(let s=0,a=t.length;s!==a;++s){let l=t[s],o=i[l.id];o.needsUpdate!==!1&&l.setValue(e,o.value,r)}}static seqWithValue(e,t){let i=[];for(let r=0,s=e.length;r!==s;++r){let a=e[r];a.id in t&&i.push(a)}return i}};function Fu(n,e,t){let i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}var T0=37297,E0=0;function w0(n,e){let t=n.split(`
`),i=[],r=Math.max(e-6,0),s=Math.min(e+6,t.length);for(let a=r;a<s;a++){let l=a+1;i.push(`${l===e?">":" "} ${l}: ${t[a]}`)}return i.join(`
`)}var Nu=new Le;function A0(n){qe._getMatrix(Nu,qe.workingColorSpace,n);let e=`mat3( ${Nu.elements.map(t=>t.toFixed(4))} )`;switch(qe.getTransfer(n)){case Vr:return[e,"LinearTransferOETF"];case Je:return[e,"sRGBTransferOETF"];default:return Ce("WebGLProgram: Unsupported color space: ",n),[e,"LinearTransferOETF"]}}function Uu(n,e,t){let i=n.getShaderParameter(e,n.COMPILE_STATUS),s=(n.getShaderInfoLog(e)||"").trim();if(i&&s==="")return"";let a=/ERROR: 0:(\d+)/.exec(s);if(a){let l=parseInt(a[1]);return t.toUpperCase()+`

`+s+`

`+w0(n.getShaderSource(e),l)}else return s}function C0(n,e){let t=A0(e);return[`vec4 ${n}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}var R0={[Xl]:"Linear",[ql]:"Reinhard",[Yl]:"Cineon",[$l]:"ACESFilmic",[Kl]:"AgX",[Jl]:"Neutral",[Zl]:"Custom"};function I0(n,e){let t=R0[e];return t===void 0?(Ce("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+n+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var Bo=new C;function P0(){qe.getLuminanceCoefficients(Bo);let n=Bo.x.toFixed(4),e=Bo.y.toFixed(4),t=Bo.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function D0(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(bs).join(`
`)}function L0(n){let e=[];for(let t in n){let i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function F0(n,e){let t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){let s=n.getActiveAttrib(e,r),a=s.name,l=1;s.type===n.FLOAT_MAT2&&(l=2),s.type===n.FLOAT_MAT3&&(l=3),s.type===n.FLOAT_MAT4&&(l=4),t[a]={type:s.type,location:n.getAttribLocation(e,a),locationSize:l}}return t}function bs(n){return n!==""}function Ou(n,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function ku(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var N0=/^[ \t]*#include +<([\w\d./]+)>/gm;function Mc(n){return n.replace(N0,O0)}var U0=new Map;function O0(n,e){let t=Be[e];if(t===void 0){let i=U0.get(e);if(i!==void 0)t=Be[i],Ce('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("Can not resolve #include <"+e+">")}return Mc(t)}var k0=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Bu(n){return n.replace(k0,B0)}function B0(n,e,t,i){let r="";for(let s=parseInt(e);s<parseInt(t);s++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function zu(n){let e=`precision ${n.precision} float;
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
#define LOW_PRECISION`),e}var z0={[us]:"SHADOWMAP_TYPE_PCF",[Mr]:"SHADOWMAP_TYPE_VSM"};function H0(n){return z0[n.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var V0={[mi]:"ENVMAP_TYPE_CUBE",[Fi]:"ENVMAP_TYPE_CUBE",[ds]:"ENVMAP_TYPE_CUBE_UV"};function G0(n){return n.envMap===!1?"ENVMAP_TYPE_CUBE":V0[n.envMapMode]||"ENVMAP_TYPE_CUBE"}var W0={[Fi]:"ENVMAP_MODE_REFRACTION"};function X0(n){return n.envMap===!1?"ENVMAP_MODE_REFLECTION":W0[n.envMapMode]||"ENVMAP_MODE_REFLECTION"}var q0={[Wl]:"ENVMAP_BLENDING_MULTIPLY",[eu]:"ENVMAP_BLENDING_MIX",[tu]:"ENVMAP_BLENDING_ADD"};function Y0(n){return n.envMap===!1?"ENVMAP_BLENDING_NONE":q0[n.combine]||"ENVMAP_BLENDING_NONE"}function $0(n){let e=n.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:i,maxMip:t}}function Z0(n,e,t,i){let r=n.getContext(),s=t.defines,a=t.vertexShader,l=t.fragmentShader,o=H0(t),c=G0(t),h=X0(t),d=Y0(t),u=$0(t),f=D0(t),g=L0(s),v=r.createProgram(),p,m,x=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(bs).join(`
`),p.length>0&&(p+=`
`),m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(bs).join(`
`),m.length>0&&(m+=`
`)):(p=[zu(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+o:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(bs).join(`
`),m=[zu(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+h:"",t.envMap?"#define "+d:"",u?"#define CUBEUV_TEXEL_WIDTH "+u.texelWidth:"",u?"#define CUBEUV_TEXEL_HEIGHT "+u.texelHeight:"",u?"#define CUBEUV_MAX_MIP "+u.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+o:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==fn?"#define TONE_MAPPING":"",t.toneMapping!==fn?Be.tonemapping_pars_fragment:"",t.toneMapping!==fn?I0("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Be.colorspace_pars_fragment,C0("linearToOutputTexel",t.outputColorSpace),P0(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(bs).join(`
`)),a=Mc(a),a=Ou(a,t),a=ku(a,t),l=Mc(l),l=Ou(l,t),l=ku(l,t),a=Bu(a),l=Bu(l),t.isRawShaderMaterial!==!0&&(x=`#version 300 es
`,p=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,m=["#define varying in",t.glslVersion===oc?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===oc?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+m);let b=x+p+a,M=x+m+l,A=Fu(r,r.VERTEX_SHADER,b),E=Fu(r,r.FRAGMENT_SHADER,M);r.attachShader(v,A),r.attachShader(v,E),t.index0AttributeName!==void 0?r.bindAttribLocation(v,0,t.index0AttributeName):t.morphTargets===!0&&r.bindAttribLocation(v,0,"position"),r.linkProgram(v);function I(R){if(n.debug.checkShaderErrors){let O=r.getProgramInfoLog(v)||"",G=r.getShaderInfoLog(A)||"",X=r.getShaderInfoLog(E)||"",N=O.trim(),z=G.trim(),V=X.trim(),j=!0,Q=!0;if(r.getProgramParameter(v,r.LINK_STATUS)===!1)if(j=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(r,v,A,E);else{let ce=Uu(r,A,"vertex"),be=Uu(r,E,"fragment");Re("THREE.WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(v,r.VALIDATE_STATUS)+`

Material Name: `+R.name+`
Material Type: `+R.type+`

Program Info Log: `+N+`
`+ce+`
`+be)}else N!==""?Ce("WebGLProgram: Program Info Log:",N):(z===""||V==="")&&(Q=!1);Q&&(R.diagnostics={runnable:j,programLog:N,vertexShader:{log:z,prefix:p},fragmentShader:{log:V,prefix:m}})}r.deleteShader(A),r.deleteShader(E),y=new Ar(r,v),w=F0(r,v)}let y;this.getUniforms=function(){return y===void 0&&I(this),y};let w;this.getAttributes=function(){return w===void 0&&I(this),w};let F=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return F===!1&&(F=r.getProgramParameter(v,T0)),F},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(v),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=E0++,this.cacheKey=e,this.usedTimes=1,this.program=v,this.vertexShader=A,this.fragmentShader=E,this}var K0=0,Tc=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,i=e.fragmentShader,r=this._getShaderStage(t),s=this._getShaderStage(i),a=this._getShaderCacheForMaterial(e);return a.has(r)===!1&&(a.add(r),r.usedTimes++),a.has(s)===!1&&(a.add(s),s.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){let t=this.shaderCache,i=t.get(e);return i===void 0&&(i=new Ec(e),t.set(e,i)),i}},Ec=class{constructor(e){this.id=K0++,this.code=e,this.usedTimes=0}};function J0(n){return n===_i||n===xs||n===ys}function j0(n,e,t,i,r,s){let a=new hr,l=new Tc,o=new Set,c=[],h=new Map,d=i.logarithmicDepthBuffer,u=i.precision,f={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function g(y){return o.add(y),y===0?"uv":`uv${y}`}function v(y,w,F,R,O,G){let X=R.fog,N=O.geometry,z=y.isMeshStandardMaterial||y.isMeshLambertMaterial||y.isMeshPhongMaterial?R.environment:null,V=y.isMeshStandardMaterial||y.isMeshLambertMaterial&&!y.envMap||y.isMeshPhongMaterial&&!y.envMap,j=e.get(y.envMap||z,V),Q=j&&j.mapping===ds?j.image.height:null,ce=f[y.type];y.precision!==null&&(u=i.getMaxPrecision(y.precision),u!==y.precision&&Ce("WebGLProgram.getParameters:",y.precision,"not supported, using",u,"instead."));let be=N.morphAttributes.position||N.morphAttributes.normal||N.morphAttributes.color,we=be!==void 0?be.length:0,Ye=0;N.morphAttributes.position!==void 0&&(Ye=1),N.morphAttributes.normal!==void 0&&(Ye=2),N.morphAttributes.color!==void 0&&(Ye=3);let je,Oe,Z,de;if(ce){let Ne=Dn[ce];je=Ne.vertexShader,Oe=Ne.fragmentShader}else je=y.vertexShader,Oe=y.fragmentShader,l.update(y),Z=l.getVertexShaderID(y),de=l.getFragmentShaderID(y);let ie=n.getRenderTarget(),Ie=n.state.buffers.depth.getReversed(),Fe=O.isInstancedMesh===!0,Pe=O.isBatchedMesh===!0,ft=!!y.map,We=!!y.matcap,Qe=!!j,lt=!!y.aoMap,Ve=!!y.lightMap,At=!!y.bumpMap,pt=!!y.normalMap,Yt=!!y.displacementMap,D=!!y.emissiveMap,Ct=!!y.metalnessMap,Xe=!!y.roughnessMap,st=y.anisotropy>0,oe=y.clearcoat>0,xt=y.dispersion>0,T=y.iridescence>0,_=y.sheen>0,U=y.transmission>0,Y=st&&!!y.anisotropyMap,J=oe&&!!y.clearcoatMap,ee=oe&&!!y.clearcoatNormalMap,ae=oe&&!!y.clearcoatRoughnessMap,W=T&&!!y.iridescenceMap,$=T&&!!y.iridescenceThicknessMap,fe=_&&!!y.sheenColorMap,xe=_&&!!y.sheenRoughnessMap,re=!!y.specularMap,te=!!y.specularColorMap,De=!!y.specularIntensityMap,ke=U&&!!y.transmissionMap,Ke=U&&!!y.thicknessMap,P=!!y.gradientMap,ne=!!y.alphaMap,q=y.alphaTest>0,pe=!!y.alphaHash,se=!!y.extensions,K=fn;y.toneMapped&&(ie===null||ie.isXRRenderTarget===!0)&&(K=n.toneMapping);let Te={shaderID:ce,shaderType:y.type,shaderName:y.name,vertexShader:je,fragmentShader:Oe,defines:y.defines,customVertexShaderID:Z,customFragmentShaderID:de,isRawShaderMaterial:y.isRawShaderMaterial===!0,glslVersion:y.glslVersion,precision:u,batching:Pe,batchingColor:Pe&&O._colorsTexture!==null,instancing:Fe,instancingColor:Fe&&O.instanceColor!==null,instancingMorph:Fe&&O.morphTexture!==null,outputColorSpace:ie===null?n.outputColorSpace:ie.isXRRenderTarget===!0?ie.texture.colorSpace:qe.workingColorSpace,alphaToCoverage:!!y.alphaToCoverage,map:ft,matcap:We,envMap:Qe,envMapMode:Qe&&j.mapping,envMapCubeUVHeight:Q,aoMap:lt,lightMap:Ve,bumpMap:At,normalMap:pt,displacementMap:Yt,emissiveMap:D,normalMapObjectSpace:pt&&y.normalMapType===ru,normalMapTangentSpace:pt&&y.normalMapType===ac,packedNormalMap:pt&&y.normalMapType===ac&&J0(y.normalMap.format),metalnessMap:Ct,roughnessMap:Xe,anisotropy:st,anisotropyMap:Y,clearcoat:oe,clearcoatMap:J,clearcoatNormalMap:ee,clearcoatRoughnessMap:ae,dispersion:xt,iridescence:T,iridescenceMap:W,iridescenceThicknessMap:$,sheen:_,sheenColorMap:fe,sheenRoughnessMap:xe,specularMap:re,specularColorMap:te,specularIntensityMap:De,transmission:U,transmissionMap:ke,thicknessMap:Ke,gradientMap:P,opaque:y.transparent===!1&&y.blending===Ii&&y.alphaToCoverage===!1,alphaMap:ne,alphaTest:q,alphaHash:pe,combine:y.combine,mapUv:ft&&g(y.map.channel),aoMapUv:lt&&g(y.aoMap.channel),lightMapUv:Ve&&g(y.lightMap.channel),bumpMapUv:At&&g(y.bumpMap.channel),normalMapUv:pt&&g(y.normalMap.channel),displacementMapUv:Yt&&g(y.displacementMap.channel),emissiveMapUv:D&&g(y.emissiveMap.channel),metalnessMapUv:Ct&&g(y.metalnessMap.channel),roughnessMapUv:Xe&&g(y.roughnessMap.channel),anisotropyMapUv:Y&&g(y.anisotropyMap.channel),clearcoatMapUv:J&&g(y.clearcoatMap.channel),clearcoatNormalMapUv:ee&&g(y.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ae&&g(y.clearcoatRoughnessMap.channel),iridescenceMapUv:W&&g(y.iridescenceMap.channel),iridescenceThicknessMapUv:$&&g(y.iridescenceThicknessMap.channel),sheenColorMapUv:fe&&g(y.sheenColorMap.channel),sheenRoughnessMapUv:xe&&g(y.sheenRoughnessMap.channel),specularMapUv:re&&g(y.specularMap.channel),specularColorMapUv:te&&g(y.specularColorMap.channel),specularIntensityMapUv:De&&g(y.specularIntensityMap.channel),transmissionMapUv:ke&&g(y.transmissionMap.channel),thicknessMapUv:Ke&&g(y.thicknessMap.channel),alphaMapUv:ne&&g(y.alphaMap.channel),vertexTangents:!!N.attributes.tangent&&(pt||st),vertexNormals:!!N.attributes.normal,vertexColors:y.vertexColors,vertexAlphas:y.vertexColors===!0&&!!N.attributes.color&&N.attributes.color.itemSize===4,pointsUvs:O.isPoints===!0&&!!N.attributes.uv&&(ft||ne),fog:!!X,useFog:y.fog===!0,fogExp2:!!X&&X.isFogExp2,flatShading:y.wireframe===!1&&(y.flatShading===!0||N.attributes.normal===void 0&&pt===!1&&(y.isMeshLambertMaterial||y.isMeshPhongMaterial||y.isMeshStandardMaterial||y.isMeshPhysicalMaterial)),sizeAttenuation:y.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:Ie,skinning:O.isSkinnedMesh===!0,morphTargets:N.morphAttributes.position!==void 0,morphNormals:N.morphAttributes.normal!==void 0,morphColors:N.morphAttributes.color!==void 0,morphTargetsCount:we,morphTextureStride:Ye,numDirLights:w.directional.length,numPointLights:w.point.length,numSpotLights:w.spot.length,numSpotLightMaps:w.spotLightMap.length,numRectAreaLights:w.rectArea.length,numHemiLights:w.hemi.length,numDirLightShadows:w.directionalShadowMap.length,numPointLightShadows:w.pointShadowMap.length,numSpotLightShadows:w.spotShadowMap.length,numSpotLightShadowsWithMaps:w.numSpotLightShadowsWithMaps,numLightProbes:w.numLightProbes,numLightProbeGrids:G.length,numClippingPlanes:s.numPlanes,numClipIntersection:s.numIntersection,dithering:y.dithering,shadowMapEnabled:n.shadowMap.enabled&&F.length>0,shadowMapType:n.shadowMap.type,toneMapping:K,decodeVideoTexture:ft&&y.map.isVideoTexture===!0&&qe.getTransfer(y.map.colorSpace)===Je,decodeVideoTextureEmissive:D&&y.emissiveMap.isVideoTexture===!0&&qe.getTransfer(y.emissiveMap.colorSpace)===Je,premultipliedAlpha:y.premultipliedAlpha,doubleSided:y.side===Bt,flipSided:y.side===Vt,useDepthPacking:y.depthPacking>=0,depthPacking:y.depthPacking||0,index0AttributeName:y.index0AttributeName,extensionClipCullDistance:se&&y.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(se&&y.extensions.multiDraw===!0||Pe)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:y.customProgramCacheKey()};return Te.vertexUv1s=o.has(1),Te.vertexUv2s=o.has(2),Te.vertexUv3s=o.has(3),o.clear(),Te}function p(y){let w=[];if(y.shaderID?w.push(y.shaderID):(w.push(y.customVertexShaderID),w.push(y.customFragmentShaderID)),y.defines!==void 0)for(let F in y.defines)w.push(F),w.push(y.defines[F]);return y.isRawShaderMaterial===!1&&(m(w,y),x(w,y),w.push(n.outputColorSpace)),w.push(y.customProgramCacheKey),w.join()}function m(y,w){y.push(w.precision),y.push(w.outputColorSpace),y.push(w.envMapMode),y.push(w.envMapCubeUVHeight),y.push(w.mapUv),y.push(w.alphaMapUv),y.push(w.lightMapUv),y.push(w.aoMapUv),y.push(w.bumpMapUv),y.push(w.normalMapUv),y.push(w.displacementMapUv),y.push(w.emissiveMapUv),y.push(w.metalnessMapUv),y.push(w.roughnessMapUv),y.push(w.anisotropyMapUv),y.push(w.clearcoatMapUv),y.push(w.clearcoatNormalMapUv),y.push(w.clearcoatRoughnessMapUv),y.push(w.iridescenceMapUv),y.push(w.iridescenceThicknessMapUv),y.push(w.sheenColorMapUv),y.push(w.sheenRoughnessMapUv),y.push(w.specularMapUv),y.push(w.specularColorMapUv),y.push(w.specularIntensityMapUv),y.push(w.transmissionMapUv),y.push(w.thicknessMapUv),y.push(w.combine),y.push(w.fogExp2),y.push(w.sizeAttenuation),y.push(w.morphTargetsCount),y.push(w.morphAttributeCount),y.push(w.numDirLights),y.push(w.numPointLights),y.push(w.numSpotLights),y.push(w.numSpotLightMaps),y.push(w.numHemiLights),y.push(w.numRectAreaLights),y.push(w.numDirLightShadows),y.push(w.numPointLightShadows),y.push(w.numSpotLightShadows),y.push(w.numSpotLightShadowsWithMaps),y.push(w.numLightProbes),y.push(w.shadowMapType),y.push(w.toneMapping),y.push(w.numClippingPlanes),y.push(w.numClipIntersection),y.push(w.depthPacking)}function x(y,w){a.disableAll(),w.instancing&&a.enable(0),w.instancingColor&&a.enable(1),w.instancingMorph&&a.enable(2),w.matcap&&a.enable(3),w.envMap&&a.enable(4),w.normalMapObjectSpace&&a.enable(5),w.normalMapTangentSpace&&a.enable(6),w.clearcoat&&a.enable(7),w.iridescence&&a.enable(8),w.alphaTest&&a.enable(9),w.vertexColors&&a.enable(10),w.vertexAlphas&&a.enable(11),w.vertexUv1s&&a.enable(12),w.vertexUv2s&&a.enable(13),w.vertexUv3s&&a.enable(14),w.vertexTangents&&a.enable(15),w.anisotropy&&a.enable(16),w.alphaHash&&a.enable(17),w.batching&&a.enable(18),w.dispersion&&a.enable(19),w.batchingColor&&a.enable(20),w.gradientMap&&a.enable(21),w.packedNormalMap&&a.enable(22),w.vertexNormals&&a.enable(23),y.push(a.mask),a.disableAll(),w.fog&&a.enable(0),w.useFog&&a.enable(1),w.flatShading&&a.enable(2),w.logarithmicDepthBuffer&&a.enable(3),w.reversedDepthBuffer&&a.enable(4),w.skinning&&a.enable(5),w.morphTargets&&a.enable(6),w.morphNormals&&a.enable(7),w.morphColors&&a.enable(8),w.premultipliedAlpha&&a.enable(9),w.shadowMapEnabled&&a.enable(10),w.doubleSided&&a.enable(11),w.flipSided&&a.enable(12),w.useDepthPacking&&a.enable(13),w.dithering&&a.enable(14),w.transmission&&a.enable(15),w.sheen&&a.enable(16),w.opaque&&a.enable(17),w.pointsUvs&&a.enable(18),w.decodeVideoTexture&&a.enable(19),w.decodeVideoTextureEmissive&&a.enable(20),w.alphaToCoverage&&a.enable(21),w.numLightProbeGrids>0&&a.enable(22),y.push(a.mask)}function b(y){let w=f[y.type],F;if(w){let R=Dn[w];F=Su.clone(R.uniforms)}else F=y.uniforms;return F}function M(y,w){let F=h.get(w);return F!==void 0?++F.usedTimes:(F=new Z0(n,w,y,r),c.push(F),h.set(w,F)),F}function A(y){if(--y.usedTimes===0){let w=c.indexOf(y);c[w]=c[c.length-1],c.pop(),h.delete(y.cacheKey),y.destroy()}}function E(y){l.remove(y)}function I(){l.dispose()}return{getParameters:v,getProgramCacheKey:p,getUniforms:b,acquireProgram:M,releaseProgram:A,releaseShaderCache:E,programs:c,dispose:I}}function Q0(){let n=new WeakMap;function e(a){return n.has(a)}function t(a){let l=n.get(a);return l===void 0&&(l={},n.set(a,l)),l}function i(a){n.delete(a)}function r(a,l,o){n.get(a)[l]=o}function s(){n=new WeakMap}return{has:e,get:t,remove:i,update:r,dispose:s}}function e_(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.materialVariant!==e.materialVariant?n.materialVariant-e.materialVariant:n.z!==e.z?n.z-e.z:n.id-e.id}function Hu(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function Vu(){let n=[],e=0,t=[],i=[],r=[];function s(){e=0,t.length=0,i.length=0,r.length=0}function a(u){let f=0;return u.isInstancedMesh&&(f+=2),u.isSkinnedMesh&&(f+=1),f}function l(u,f,g,v,p,m){let x=n[e];return x===void 0?(x={id:u.id,object:u,geometry:f,material:g,materialVariant:a(u),groupOrder:v,renderOrder:u.renderOrder,z:p,group:m},n[e]=x):(x.id=u.id,x.object=u,x.geometry=f,x.material=g,x.materialVariant=a(u),x.groupOrder=v,x.renderOrder=u.renderOrder,x.z=p,x.group=m),e++,x}function o(u,f,g,v,p,m){let x=l(u,f,g,v,p,m);g.transmission>0?i.push(x):g.transparent===!0?r.push(x):t.push(x)}function c(u,f,g,v,p,m){let x=l(u,f,g,v,p,m);g.transmission>0?i.unshift(x):g.transparent===!0?r.unshift(x):t.unshift(x)}function h(u,f){t.length>1&&t.sort(u||e_),i.length>1&&i.sort(f||Hu),r.length>1&&r.sort(f||Hu)}function d(){for(let u=e,f=n.length;u<f;u++){let g=n[u];if(g.id===null)break;g.id=null,g.object=null,g.geometry=null,g.material=null,g.group=null}}return{opaque:t,transmissive:i,transparent:r,init:s,push:o,unshift:c,finish:d,sort:h}}function t_(){let n=new WeakMap;function e(i,r){let s=n.get(i),a;return s===void 0?(a=new Vu,n.set(i,[a])):r>=s.length?(a=new Vu,s.push(a)):a=s[r],a}function t(){n=new WeakMap}return{get:e,dispose:t}}function n_(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new C,color:new Ze};break;case"SpotLight":t={position:new C,direction:new C,color:new Ze,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new C,color:new Ze,distance:0,decay:0};break;case"HemisphereLight":t={direction:new C,skyColor:new Ze,groundColor:new Ze};break;case"RectAreaLight":t={color:new Ze,position:new C,halfWidth:new C,halfHeight:new C};break}return n[e.id]=t,t}}}function i_(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new _e};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new _e};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new _e,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}var r_=0;function s_(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function a_(n){let e=new n_,t=i_(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new C);let r=new C,s=new dt,a=new dt;function l(c){let h=0,d=0,u=0;for(let w=0;w<9;w++)i.probe[w].set(0,0,0);let f=0,g=0,v=0,p=0,m=0,x=0,b=0,M=0,A=0,E=0,I=0;c.sort(s_);for(let w=0,F=c.length;w<F;w++){let R=c[w],O=R.color,G=R.intensity,X=R.distance,N=null;if(R.shadow&&R.shadow.map&&(R.shadow.map.texture.format===_i?N=R.shadow.map.texture:N=R.shadow.map.depthTexture||R.shadow.map.texture),R.isAmbientLight)h+=O.r*G,d+=O.g*G,u+=O.b*G;else if(R.isLightProbe){for(let z=0;z<9;z++)i.probe[z].addScaledVector(R.sh.coefficients[z],G);I++}else if(R.isDirectionalLight){let z=e.get(R);if(z.color.copy(R.color).multiplyScalar(R.intensity),R.castShadow){let V=R.shadow,j=t.get(R);j.shadowIntensity=V.intensity,j.shadowBias=V.bias,j.shadowNormalBias=V.normalBias,j.shadowRadius=V.radius,j.shadowMapSize=V.mapSize,i.directionalShadow[f]=j,i.directionalShadowMap[f]=N,i.directionalShadowMatrix[f]=R.shadow.matrix,x++}i.directional[f]=z,f++}else if(R.isSpotLight){let z=e.get(R);z.position.setFromMatrixPosition(R.matrixWorld),z.color.copy(O).multiplyScalar(G),z.distance=X,z.coneCos=Math.cos(R.angle),z.penumbraCos=Math.cos(R.angle*(1-R.penumbra)),z.decay=R.decay,i.spot[v]=z;let V=R.shadow;if(R.map&&(i.spotLightMap[A]=R.map,A++,V.updateMatrices(R),R.castShadow&&E++),i.spotLightMatrix[v]=V.matrix,R.castShadow){let j=t.get(R);j.shadowIntensity=V.intensity,j.shadowBias=V.bias,j.shadowNormalBias=V.normalBias,j.shadowRadius=V.radius,j.shadowMapSize=V.mapSize,i.spotShadow[v]=j,i.spotShadowMap[v]=N,M++}v++}else if(R.isRectAreaLight){let z=e.get(R);z.color.copy(O).multiplyScalar(G),z.halfWidth.set(R.width*.5,0,0),z.halfHeight.set(0,R.height*.5,0),i.rectArea[p]=z,p++}else if(R.isPointLight){let z=e.get(R);if(z.color.copy(R.color).multiplyScalar(R.intensity),z.distance=R.distance,z.decay=R.decay,R.castShadow){let V=R.shadow,j=t.get(R);j.shadowIntensity=V.intensity,j.shadowBias=V.bias,j.shadowNormalBias=V.normalBias,j.shadowRadius=V.radius,j.shadowMapSize=V.mapSize,j.shadowCameraNear=V.camera.near,j.shadowCameraFar=V.camera.far,i.pointShadow[g]=j,i.pointShadowMap[g]=N,i.pointShadowMatrix[g]=R.shadow.matrix,b++}i.point[g]=z,g++}else if(R.isHemisphereLight){let z=e.get(R);z.skyColor.copy(R.color).multiplyScalar(G),z.groundColor.copy(R.groundColor).multiplyScalar(G),i.hemi[m]=z,m++}}p>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=le.LTC_FLOAT_1,i.rectAreaLTC2=le.LTC_FLOAT_2):(i.rectAreaLTC1=le.LTC_HALF_1,i.rectAreaLTC2=le.LTC_HALF_2)),i.ambient[0]=h,i.ambient[1]=d,i.ambient[2]=u;let y=i.hash;(y.directionalLength!==f||y.pointLength!==g||y.spotLength!==v||y.rectAreaLength!==p||y.hemiLength!==m||y.numDirectionalShadows!==x||y.numPointShadows!==b||y.numSpotShadows!==M||y.numSpotMaps!==A||y.numLightProbes!==I)&&(i.directional.length=f,i.spot.length=v,i.rectArea.length=p,i.point.length=g,i.hemi.length=m,i.directionalShadow.length=x,i.directionalShadowMap.length=x,i.pointShadow.length=b,i.pointShadowMap.length=b,i.spotShadow.length=M,i.spotShadowMap.length=M,i.directionalShadowMatrix.length=x,i.pointShadowMatrix.length=b,i.spotLightMatrix.length=M+A-E,i.spotLightMap.length=A,i.numSpotLightShadowsWithMaps=E,i.numLightProbes=I,y.directionalLength=f,y.pointLength=g,y.spotLength=v,y.rectAreaLength=p,y.hemiLength=m,y.numDirectionalShadows=x,y.numPointShadows=b,y.numSpotShadows=M,y.numSpotMaps=A,y.numLightProbes=I,i.version=r_++)}function o(c,h){let d=0,u=0,f=0,g=0,v=0,p=h.matrixWorldInverse;for(let m=0,x=c.length;m<x;m++){let b=c[m];if(b.isDirectionalLight){let M=i.directional[d];M.direction.setFromMatrixPosition(b.matrixWorld),r.setFromMatrixPosition(b.target.matrixWorld),M.direction.sub(r),M.direction.transformDirection(p),d++}else if(b.isSpotLight){let M=i.spot[f];M.position.setFromMatrixPosition(b.matrixWorld),M.position.applyMatrix4(p),M.direction.setFromMatrixPosition(b.matrixWorld),r.setFromMatrixPosition(b.target.matrixWorld),M.direction.sub(r),M.direction.transformDirection(p),f++}else if(b.isRectAreaLight){let M=i.rectArea[g];M.position.setFromMatrixPosition(b.matrixWorld),M.position.applyMatrix4(p),a.identity(),s.copy(b.matrixWorld),s.premultiply(p),a.extractRotation(s),M.halfWidth.set(b.width*.5,0,0),M.halfHeight.set(0,b.height*.5,0),M.halfWidth.applyMatrix4(a),M.halfHeight.applyMatrix4(a),g++}else if(b.isPointLight){let M=i.point[u];M.position.setFromMatrixPosition(b.matrixWorld),M.position.applyMatrix4(p),u++}else if(b.isHemisphereLight){let M=i.hemi[v];M.direction.setFromMatrixPosition(b.matrixWorld),M.direction.transformDirection(p),v++}}}return{setup:l,setupView:o,state:i}}function Gu(n){let e=new a_(n),t=[],i=[],r=[];function s(u){d.camera=u,t.length=0,i.length=0,r.length=0}function a(u){t.push(u)}function l(u){i.push(u)}function o(u){r.push(u)}function c(){e.setup(t)}function h(u){e.setupView(t,u)}let d={lightsArray:t,shadowsArray:i,lightProbeGridArray:r,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:s,state:d,setupLights:c,setupLightsView:h,pushLight:a,pushShadow:l,pushLightProbeGrid:o}}function o_(n){let e=new WeakMap;function t(r,s=0){let a=e.get(r),l;return a===void 0?(l=new Gu(n),e.set(r,[l])):s>=a.length?(l=new Gu(n),a.push(l)):l=a[s],l}function i(){e=new WeakMap}return{get:t,dispose:i}}var l_=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,c_=`uniform sampler2D shadow_pass;
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
}`,h_=[new C(1,0,0),new C(-1,0,0),new C(0,1,0),new C(0,-1,0),new C(0,0,1),new C(0,0,-1)],u_=[new C(0,-1,0),new C(0,-1,0),new C(0,0,1),new C(0,0,-1),new C(0,-1,0),new C(0,-1,0)],Wu=new dt,Ss=new C,xc=new C;function d_(n,e,t){let i=new Zr,r=new _e,s=new _e,a=new vt,l=new Ua,o=new Oa,c={},h=t.maxTextureSize,d={[Gn]:Vt,[Vt]:Gn,[Bt]:Bt},u=new tn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new _e},radius:{value:4}},vertexShader:l_,fragmentShader:c_}),f=u.clone();f.defines.HORIZONTAL_PASS=1;let g=new ot;g.setAttribute("position",new Xt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let v=new ht(g,u),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=us;let m=this.type;this.render=function(E,I,y){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||E.length===0)return;this.type===Nh&&(Ce("WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead."),this.type=us);let w=n.getRenderTarget(),F=n.getActiveCubeFace(),R=n.getActiveMipmapLevel(),O=n.state;O.setBlending(Rn),O.buffers.depth.getReversed()===!0?O.buffers.color.setClear(0,0,0,0):O.buffers.color.setClear(1,1,1,1),O.buffers.depth.setTest(!0),O.setScissorTest(!1);let G=m!==this.type;G&&I.traverse(function(X){X.material&&(Array.isArray(X.material)?X.material.forEach(N=>N.needsUpdate=!0):X.material.needsUpdate=!0)});for(let X=0,N=E.length;X<N;X++){let z=E[X],V=z.shadow;if(V===void 0){Ce("WebGLShadowMap:",z,"has no shadow.");continue}if(V.autoUpdate===!1&&V.needsUpdate===!1)continue;r.copy(V.mapSize);let j=V.getFrameExtents();r.multiply(j),s.copy(V.mapSize),(r.x>h||r.y>h)&&(r.x>h&&(s.x=Math.floor(h/j.x),r.x=s.x*j.x,V.mapSize.x=s.x),r.y>h&&(s.y=Math.floor(h/j.y),r.y=s.y*j.y,V.mapSize.y=s.y));let Q=n.state.buffers.depth.getReversed();if(V.camera._reversedDepth=Q,V.map===null||G===!0){if(V.map!==null&&(V.map.depthTexture!==null&&(V.map.depthTexture.dispose(),V.map.depthTexture=null),V.map.dispose()),this.type===Mr){if(z.isPointLight){Ce("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}V.map=new jt(r.x,r.y,{format:_i,type:In,minFilter:Se,magFilter:Se,generateMipmaps:!1}),V.map.texture.name=z.name+".shadowMap",V.map.depthTexture=new Xn(r.x,r.y,gn),V.map.depthTexture.name=z.name+".shadowMapDepth",V.map.depthTexture.format=Tn,V.map.depthTexture.compareFunction=null,V.map.depthTexture.minFilter=Dt,V.map.depthTexture.magFilter=Dt}else z.isPointLight?(V.map=new Ho(r.x),V.map.depthTexture=new Ia(r.x,mn)):(V.map=new jt(r.x,r.y),V.map.depthTexture=new Xn(r.x,r.y,mn)),V.map.depthTexture.name=z.name+".shadowMap",V.map.depthTexture.format=Tn,this.type===us?(V.map.depthTexture.compareFunction=Q?Oo:Uo,V.map.depthTexture.minFilter=Se,V.map.depthTexture.magFilter=Se):(V.map.depthTexture.compareFunction=null,V.map.depthTexture.minFilter=Dt,V.map.depthTexture.magFilter=Dt);V.camera.updateProjectionMatrix()}let ce=V.map.isWebGLCubeRenderTarget?6:1;for(let be=0;be<ce;be++){if(V.map.isWebGLCubeRenderTarget)n.setRenderTarget(V.map,be),n.clear();else{be===0&&(n.setRenderTarget(V.map),n.clear());let we=V.getViewport(be);a.set(s.x*we.x,s.y*we.y,s.x*we.z,s.y*we.w),O.viewport(a)}if(z.isPointLight){let we=V.camera,Ye=V.matrix,je=z.distance||we.far;je!==we.far&&(we.far=je,we.updateProjectionMatrix()),Ss.setFromMatrixPosition(z.matrixWorld),we.position.copy(Ss),xc.copy(we.position),xc.add(h_[be]),we.up.copy(u_[be]),we.lookAt(xc),we.updateMatrixWorld(),Ye.makeTranslation(-Ss.x,-Ss.y,-Ss.z),Wu.multiplyMatrices(we.projectionMatrix,we.matrixWorldInverse),V._frustum.setFromProjectionMatrix(Wu,we.coordinateSystem,we.reversedDepth)}else V.updateMatrices(z);i=V.getFrustum(),M(I,y,V.camera,z,this.type)}V.isPointLightShadow!==!0&&this.type===Mr&&x(V,y),V.needsUpdate=!1}m=this.type,p.needsUpdate=!1,n.setRenderTarget(w,F,R)};function x(E,I){let y=e.update(v);u.defines.VSM_SAMPLES!==E.blurSamples&&(u.defines.VSM_SAMPLES=E.blurSamples,f.defines.VSM_SAMPLES=E.blurSamples,u.needsUpdate=!0,f.needsUpdate=!0),E.mapPass===null&&(E.mapPass=new jt(r.x,r.y,{format:_i,type:In})),u.uniforms.shadow_pass.value=E.map.depthTexture,u.uniforms.resolution.value=E.mapSize,u.uniforms.radius.value=E.radius,n.setRenderTarget(E.mapPass),n.clear(),n.renderBufferDirect(I,null,y,u,v,null),f.uniforms.shadow_pass.value=E.mapPass.texture,f.uniforms.resolution.value=E.mapSize,f.uniforms.radius.value=E.radius,n.setRenderTarget(E.map),n.clear(),n.renderBufferDirect(I,null,y,f,v,null)}function b(E,I,y,w){let F=null,R=y.isPointLight===!0?E.customDistanceMaterial:E.customDepthMaterial;if(R!==void 0)F=R;else if(F=y.isPointLight===!0?o:l,n.localClippingEnabled&&I.clipShadows===!0&&Array.isArray(I.clippingPlanes)&&I.clippingPlanes.length!==0||I.displacementMap&&I.displacementScale!==0||I.alphaMap&&I.alphaTest>0||I.map&&I.alphaTest>0||I.alphaToCoverage===!0){let O=F.uuid,G=I.uuid,X=c[O];X===void 0&&(X={},c[O]=X);let N=X[G];N===void 0&&(N=F.clone(),X[G]=N,I.addEventListener("dispose",A)),F=N}if(F.visible=I.visible,F.wireframe=I.wireframe,w===Mr?F.side=I.shadowSide!==null?I.shadowSide:I.side:F.side=I.shadowSide!==null?I.shadowSide:d[I.side],F.alphaMap=I.alphaMap,F.alphaTest=I.alphaToCoverage===!0?.5:I.alphaTest,F.map=I.map,F.clipShadows=I.clipShadows,F.clippingPlanes=I.clippingPlanes,F.clipIntersection=I.clipIntersection,F.displacementMap=I.displacementMap,F.displacementScale=I.displacementScale,F.displacementBias=I.displacementBias,F.wireframeLinewidth=I.wireframeLinewidth,F.linewidth=I.linewidth,y.isPointLight===!0&&F.isMeshDistanceMaterial===!0){let O=n.properties.get(F);O.light=y}return F}function M(E,I,y,w,F){if(E.visible===!1)return;if(E.layers.test(I.layers)&&(E.isMesh||E.isLine||E.isPoints)&&(E.castShadow||E.receiveShadow&&F===Mr)&&(!E.frustumCulled||i.intersectsObject(E))){E.modelViewMatrix.multiplyMatrices(y.matrixWorldInverse,E.matrixWorld);let G=e.update(E),X=E.material;if(Array.isArray(X)){let N=G.groups;for(let z=0,V=N.length;z<V;z++){let j=N[z],Q=X[j.materialIndex];if(Q&&Q.visible){let ce=b(E,Q,w,F);E.onBeforeShadow(n,E,I,y,G,ce,j),n.renderBufferDirect(y,null,G,ce,E,j),E.onAfterShadow(n,E,I,y,G,ce,j)}}}else if(X.visible){let N=b(E,X,w,F);E.onBeforeShadow(n,E,I,y,G,N,null),n.renderBufferDirect(y,null,G,N,E,null),E.onAfterShadow(n,E,I,y,G,N,null)}}let O=E.children;for(let G=0,X=O.length;G<X;G++)M(O[G],I,y,w,F)}function A(E){E.target.removeEventListener("dispose",A);for(let y in c){let w=c[y],F=E.target.uuid;F in w&&(w[F].dispose(),delete w[F])}}}function f_(n,e){function t(){let P=!1,ne=new vt,q=null,pe=new vt(0,0,0,0);return{setMask:function(se){q!==se&&!P&&(n.colorMask(se,se,se,se),q=se)},setLocked:function(se){P=se},setClear:function(se,K,Te,Ne,St){St===!0&&(se*=Ne,K*=Ne,Te*=Ne),ne.set(se,K,Te,Ne),pe.equals(ne)===!1&&(n.clearColor(se,K,Te,Ne),pe.copy(ne))},reset:function(){P=!1,q=null,pe.set(-1,0,0,0)}}}function i(){let P=!1,ne=!1,q=null,pe=null,se=null;return{setReversed:function(K){if(ne!==K){let Te=e.get("EXT_clip_control");K?Te.clipControlEXT(Te.LOWER_LEFT_EXT,Te.ZERO_TO_ONE_EXT):Te.clipControlEXT(Te.LOWER_LEFT_EXT,Te.NEGATIVE_ONE_TO_ONE_EXT),ne=K;let Ne=se;se=null,this.setClear(Ne)}},getReversed:function(){return ne},setTest:function(K){K?ie(n.DEPTH_TEST):Ie(n.DEPTH_TEST)},setMask:function(K){q!==K&&!P&&(n.depthMask(K),q=K)},setFunc:function(K){if(ne&&(K=pu[K]),pe!==K){switch(K){case ha:n.depthFunc(n.NEVER);break;case ua:n.depthFunc(n.ALWAYS);break;case da:n.depthFunc(n.LESS);break;case Pi:n.depthFunc(n.LEQUAL);break;case fa:n.depthFunc(n.EQUAL);break;case pa:n.depthFunc(n.GEQUAL);break;case ma:n.depthFunc(n.GREATER);break;case ga:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}pe=K}},setLocked:function(K){P=K},setClear:function(K){se!==K&&(se=K,ne&&(K=1-K),n.clearDepth(K))},reset:function(){P=!1,q=null,pe=null,se=null,ne=!1}}}function r(){let P=!1,ne=null,q=null,pe=null,se=null,K=null,Te=null,Ne=null,St=null;return{setTest:function(et){P||(et?ie(n.STENCIL_TEST):Ie(n.STENCIL_TEST))},setMask:function(et){ne!==et&&!P&&(n.stencilMask(et),ne=et)},setFunc:function(et,Fn,yn){(q!==et||pe!==Fn||se!==yn)&&(n.stencilFunc(et,Fn,yn),q=et,pe=Fn,se=yn)},setOp:function(et,Fn,yn){(K!==et||Te!==Fn||Ne!==yn)&&(n.stencilOp(et,Fn,yn),K=et,Te=Fn,Ne=yn)},setLocked:function(et){P=et},setClear:function(et){St!==et&&(n.clearStencil(et),St=et)},reset:function(){P=!1,ne=null,q=null,pe=null,se=null,K=null,Te=null,Ne=null,St=null}}}let s=new t,a=new i,l=new r,o=new WeakMap,c=new WeakMap,h={},d={},u={},f=new WeakMap,g=[],v=null,p=!1,m=null,x=null,b=null,M=null,A=null,E=null,I=null,y=new Ze(0,0,0),w=0,F=!1,R=null,O=null,G=null,X=null,N=null,z=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS),V=!1,j=0,Q=n.getParameter(n.VERSION);Q.indexOf("WebGL")!==-1?(j=parseFloat(/^WebGL (\d)/.exec(Q)[1]),V=j>=1):Q.indexOf("OpenGL ES")!==-1&&(j=parseFloat(/^OpenGL ES (\d)/.exec(Q)[1]),V=j>=2);let ce=null,be={},we=n.getParameter(n.SCISSOR_BOX),Ye=n.getParameter(n.VIEWPORT),je=new vt().fromArray(we),Oe=new vt().fromArray(Ye);function Z(P,ne,q,pe){let se=new Uint8Array(4),K=n.createTexture();n.bindTexture(P,K),n.texParameteri(P,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(P,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let Te=0;Te<q;Te++)P===n.TEXTURE_3D||P===n.TEXTURE_2D_ARRAY?n.texImage3D(ne,0,n.RGBA,1,1,pe,0,n.RGBA,n.UNSIGNED_BYTE,se):n.texImage2D(ne+Te,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,se);return K}let de={};de[n.TEXTURE_2D]=Z(n.TEXTURE_2D,n.TEXTURE_2D,1),de[n.TEXTURE_CUBE_MAP]=Z(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),de[n.TEXTURE_2D_ARRAY]=Z(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),de[n.TEXTURE_3D]=Z(n.TEXTURE_3D,n.TEXTURE_3D,1,1),s.setClear(0,0,0,1),a.setClear(1),l.setClear(0),ie(n.DEPTH_TEST),a.setFunc(Pi),At(!1),pt(zl),ie(n.CULL_FACE),lt(Rn);function ie(P){h[P]!==!0&&(n.enable(P),h[P]=!0)}function Ie(P){h[P]!==!1&&(n.disable(P),h[P]=!1)}function Fe(P,ne){return u[P]!==ne?(n.bindFramebuffer(P,ne),u[P]=ne,P===n.DRAW_FRAMEBUFFER&&(u[n.FRAMEBUFFER]=ne),P===n.FRAMEBUFFER&&(u[n.DRAW_FRAMEBUFFER]=ne),!0):!1}function Pe(P,ne){let q=g,pe=!1;if(P){q=f.get(ne),q===void 0&&(q=[],f.set(ne,q));let se=P.textures;if(q.length!==se.length||q[0]!==n.COLOR_ATTACHMENT0){for(let K=0,Te=se.length;K<Te;K++)q[K]=n.COLOR_ATTACHMENT0+K;q.length=se.length,pe=!0}}else q[0]!==n.BACK&&(q[0]=n.BACK,pe=!0);pe&&n.drawBuffers(q)}function ft(P){return v!==P?(n.useProgram(P),v=P,!0):!1}let We={[oi]:n.FUNC_ADD,[Oh]:n.FUNC_SUBTRACT,[kh]:n.FUNC_REVERSE_SUBTRACT};We[Bh]=n.MIN,We[zh]=n.MAX;let Qe={[Hh]:n.ZERO,[Vh]:n.ONE,[Gh]:n.SRC_COLOR,[la]:n.SRC_ALPHA,[Zh]:n.SRC_ALPHA_SATURATE,[Yh]:n.DST_COLOR,[Xh]:n.DST_ALPHA,[Wh]:n.ONE_MINUS_SRC_COLOR,[ca]:n.ONE_MINUS_SRC_ALPHA,[$h]:n.ONE_MINUS_DST_COLOR,[qh]:n.ONE_MINUS_DST_ALPHA,[Kh]:n.CONSTANT_COLOR,[Jh]:n.ONE_MINUS_CONSTANT_COLOR,[jh]:n.CONSTANT_ALPHA,[Qh]:n.ONE_MINUS_CONSTANT_ALPHA};function lt(P,ne,q,pe,se,K,Te,Ne,St,et){if(P===Rn){p===!0&&(Ie(n.BLEND),p=!1);return}if(p===!1&&(ie(n.BLEND),p=!0),P!==Uh){if(P!==m||et!==F){if((x!==oi||A!==oi)&&(n.blendEquation(n.FUNC_ADD),x=oi,A=oi),et)switch(P){case Ii:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Hl:n.blendFunc(n.ONE,n.ONE);break;case Vl:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Gl:n.blendFuncSeparate(n.DST_COLOR,n.ONE_MINUS_SRC_ALPHA,n.ZERO,n.ONE);break;default:Re("WebGLState: Invalid blending: ",P);break}else switch(P){case Ii:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Hl:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE,n.ONE,n.ONE);break;case Vl:Re("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Gl:Re("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Re("WebGLState: Invalid blending: ",P);break}b=null,M=null,E=null,I=null,y.set(0,0,0),w=0,m=P,F=et}return}se=se||ne,K=K||q,Te=Te||pe,(ne!==x||se!==A)&&(n.blendEquationSeparate(We[ne],We[se]),x=ne,A=se),(q!==b||pe!==M||K!==E||Te!==I)&&(n.blendFuncSeparate(Qe[q],Qe[pe],Qe[K],Qe[Te]),b=q,M=pe,E=K,I=Te),(Ne.equals(y)===!1||St!==w)&&(n.blendColor(Ne.r,Ne.g,Ne.b,St),y.copy(Ne),w=St),m=P,F=!1}function Ve(P,ne){P.side===Bt?Ie(n.CULL_FACE):ie(n.CULL_FACE);let q=P.side===Vt;ne&&(q=!q),At(q),P.blending===Ii&&P.transparent===!1?lt(Rn):lt(P.blending,P.blendEquation,P.blendSrc,P.blendDst,P.blendEquationAlpha,P.blendSrcAlpha,P.blendDstAlpha,P.blendColor,P.blendAlpha,P.premultipliedAlpha),a.setFunc(P.depthFunc),a.setTest(P.depthTest),a.setMask(P.depthWrite),s.setMask(P.colorWrite);let pe=P.stencilWrite;l.setTest(pe),pe&&(l.setMask(P.stencilWriteMask),l.setFunc(P.stencilFunc,P.stencilRef,P.stencilFuncMask),l.setOp(P.stencilFail,P.stencilZFail,P.stencilZPass)),D(P.polygonOffset,P.polygonOffsetFactor,P.polygonOffsetUnits),P.alphaToCoverage===!0?ie(n.SAMPLE_ALPHA_TO_COVERAGE):Ie(n.SAMPLE_ALPHA_TO_COVERAGE)}function At(P){R!==P&&(P?n.frontFace(n.CW):n.frontFace(n.CCW),R=P)}function pt(P){P!==Lh?(ie(n.CULL_FACE),P!==O&&(P===zl?n.cullFace(n.BACK):P===Fh?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):Ie(n.CULL_FACE),O=P}function Yt(P){P!==G&&(V&&n.lineWidth(P),G=P)}function D(P,ne,q){P?(ie(n.POLYGON_OFFSET_FILL),(X!==ne||N!==q)&&(X=ne,N=q,a.getReversed()&&(ne=-ne),n.polygonOffset(ne,q))):Ie(n.POLYGON_OFFSET_FILL)}function Ct(P){P?ie(n.SCISSOR_TEST):Ie(n.SCISSOR_TEST)}function Xe(P){P===void 0&&(P=n.TEXTURE0+z-1),ce!==P&&(n.activeTexture(P),ce=P)}function st(P,ne,q){q===void 0&&(ce===null?q=n.TEXTURE0+z-1:q=ce);let pe=be[q];pe===void 0&&(pe={type:void 0,texture:void 0},be[q]=pe),(pe.type!==P||pe.texture!==ne)&&(ce!==q&&(n.activeTexture(q),ce=q),n.bindTexture(P,ne||de[P]),pe.type=P,pe.texture=ne)}function oe(){let P=be[ce];P!==void 0&&P.type!==void 0&&(n.bindTexture(P.type,null),P.type=void 0,P.texture=void 0)}function xt(){try{n.compressedTexImage2D(...arguments)}catch(P){Re("WebGLState:",P)}}function T(){try{n.compressedTexImage3D(...arguments)}catch(P){Re("WebGLState:",P)}}function _(){try{n.texSubImage2D(...arguments)}catch(P){Re("WebGLState:",P)}}function U(){try{n.texSubImage3D(...arguments)}catch(P){Re("WebGLState:",P)}}function Y(){try{n.compressedTexSubImage2D(...arguments)}catch(P){Re("WebGLState:",P)}}function J(){try{n.compressedTexSubImage3D(...arguments)}catch(P){Re("WebGLState:",P)}}function ee(){try{n.texStorage2D(...arguments)}catch(P){Re("WebGLState:",P)}}function ae(){try{n.texStorage3D(...arguments)}catch(P){Re("WebGLState:",P)}}function W(){try{n.texImage2D(...arguments)}catch(P){Re("WebGLState:",P)}}function $(){try{n.texImage3D(...arguments)}catch(P){Re("WebGLState:",P)}}function fe(P){return d[P]!==void 0?d[P]:n.getParameter(P)}function xe(P,ne){d[P]!==ne&&(n.pixelStorei(P,ne),d[P]=ne)}function re(P){je.equals(P)===!1&&(n.scissor(P.x,P.y,P.z,P.w),je.copy(P))}function te(P){Oe.equals(P)===!1&&(n.viewport(P.x,P.y,P.z,P.w),Oe.copy(P))}function De(P,ne){let q=c.get(ne);q===void 0&&(q=new WeakMap,c.set(ne,q));let pe=q.get(P);pe===void 0&&(pe=n.getUniformBlockIndex(ne,P.name),q.set(P,pe))}function ke(P,ne){let pe=c.get(ne).get(P);o.get(ne)!==pe&&(n.uniformBlockBinding(ne,pe,P.__bindingPointIndex),o.set(ne,pe))}function Ke(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),a.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),n.pixelStorei(n.PACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,!1),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,n.BROWSER_DEFAULT_WEBGL),n.pixelStorei(n.PACK_ROW_LENGTH,0),n.pixelStorei(n.PACK_SKIP_PIXELS,0),n.pixelStorei(n.PACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_ROW_LENGTH,0),n.pixelStorei(n.UNPACK_IMAGE_HEIGHT,0),n.pixelStorei(n.UNPACK_SKIP_PIXELS,0),n.pixelStorei(n.UNPACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_SKIP_IMAGES,0),h={},d={},ce=null,be={},u={},f=new WeakMap,g=[],v=null,p=!1,m=null,x=null,b=null,M=null,A=null,E=null,I=null,y=new Ze(0,0,0),w=0,F=!1,R=null,O=null,G=null,X=null,N=null,je.set(0,0,n.canvas.width,n.canvas.height),Oe.set(0,0,n.canvas.width,n.canvas.height),s.reset(),a.reset(),l.reset()}return{buffers:{color:s,depth:a,stencil:l},enable:ie,disable:Ie,bindFramebuffer:Fe,drawBuffers:Pe,useProgram:ft,setBlending:lt,setMaterial:Ve,setFlipSided:At,setCullFace:pt,setLineWidth:Yt,setPolygonOffset:D,setScissorTest:Ct,activeTexture:Xe,bindTexture:st,unbindTexture:oe,compressedTexImage2D:xt,compressedTexImage3D:T,texImage2D:W,texImage3D:$,pixelStorei:xe,getParameter:fe,updateUBOMapping:De,uniformBlockBinding:ke,texStorage2D:ee,texStorage3D:ae,texSubImage2D:_,texSubImage3D:U,compressedTexSubImage2D:Y,compressedTexSubImage3D:J,scissor:re,viewport:te,reset:Ke}}function p_(n,e,t,i,r,s,a){let l=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,o=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new _e,h=new WeakMap,d=new Set,u,f=new WeakMap,g=!1;try{g=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function v(T,_){return g?new OffscreenCanvas(T,_):or("canvas")}function p(T,_,U){let Y=1,J=xt(T);if((J.width>U||J.height>U)&&(Y=U/Math.max(J.width,J.height)),Y<1)if(typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&T instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&T instanceof ImageBitmap||typeof VideoFrame<"u"&&T instanceof VideoFrame){let ee=Math.floor(Y*J.width),ae=Math.floor(Y*J.height);u===void 0&&(u=v(ee,ae));let W=_?v(ee,ae):u;return W.width=ee,W.height=ae,W.getContext("2d").drawImage(T,0,0,ee,ae),Ce("WebGLRenderer: Texture has been resized from ("+J.width+"x"+J.height+") to ("+ee+"x"+ae+")."),W}else return"data"in T&&Ce("WebGLRenderer: Image in DataTexture is too big ("+J.width+"x"+J.height+")."),T;return T}function m(T){return T.generateMipmaps}function x(T){n.generateMipmap(T)}function b(T){return T.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:T.isWebGL3DRenderTarget?n.TEXTURE_3D:T.isWebGLArrayRenderTarget||T.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function M(T,_,U,Y,J,ee=!1){if(T!==null){if(n[T]!==void 0)return n[T];Ce("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+T+"'")}let ae;Y&&(ae=e.get("EXT_texture_norm16"),ae||Ce("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let W=_;if(_===n.RED&&(U===n.FLOAT&&(W=n.R32F),U===n.HALF_FLOAT&&(W=n.R16F),U===n.UNSIGNED_BYTE&&(W=n.R8),U===n.UNSIGNED_SHORT&&ae&&(W=ae.R16_EXT),U===n.SHORT&&ae&&(W=ae.R16_SNORM_EXT)),_===n.RED_INTEGER&&(U===n.UNSIGNED_BYTE&&(W=n.R8UI),U===n.UNSIGNED_SHORT&&(W=n.R16UI),U===n.UNSIGNED_INT&&(W=n.R32UI),U===n.BYTE&&(W=n.R8I),U===n.SHORT&&(W=n.R16I),U===n.INT&&(W=n.R32I)),_===n.RG&&(U===n.FLOAT&&(W=n.RG32F),U===n.HALF_FLOAT&&(W=n.RG16F),U===n.UNSIGNED_BYTE&&(W=n.RG8),U===n.UNSIGNED_SHORT&&ae&&(W=ae.RG16_EXT),U===n.SHORT&&ae&&(W=ae.RG16_SNORM_EXT)),_===n.RG_INTEGER&&(U===n.UNSIGNED_BYTE&&(W=n.RG8UI),U===n.UNSIGNED_SHORT&&(W=n.RG16UI),U===n.UNSIGNED_INT&&(W=n.RG32UI),U===n.BYTE&&(W=n.RG8I),U===n.SHORT&&(W=n.RG16I),U===n.INT&&(W=n.RG32I)),_===n.RGB_INTEGER&&(U===n.UNSIGNED_BYTE&&(W=n.RGB8UI),U===n.UNSIGNED_SHORT&&(W=n.RGB16UI),U===n.UNSIGNED_INT&&(W=n.RGB32UI),U===n.BYTE&&(W=n.RGB8I),U===n.SHORT&&(W=n.RGB16I),U===n.INT&&(W=n.RGB32I)),_===n.RGBA_INTEGER&&(U===n.UNSIGNED_BYTE&&(W=n.RGBA8UI),U===n.UNSIGNED_SHORT&&(W=n.RGBA16UI),U===n.UNSIGNED_INT&&(W=n.RGBA32UI),U===n.BYTE&&(W=n.RGBA8I),U===n.SHORT&&(W=n.RGBA16I),U===n.INT&&(W=n.RGBA32I)),_===n.RGB&&(U===n.UNSIGNED_SHORT&&ae&&(W=ae.RGB16_EXT),U===n.SHORT&&ae&&(W=ae.RGB16_SNORM_EXT),U===n.UNSIGNED_INT_5_9_9_9_REV&&(W=n.RGB9_E5),U===n.UNSIGNED_INT_10F_11F_11F_REV&&(W=n.R11F_G11F_B10F)),_===n.RGBA){let $=ee?Vr:qe.getTransfer(J);U===n.FLOAT&&(W=n.RGBA32F),U===n.HALF_FLOAT&&(W=n.RGBA16F),U===n.UNSIGNED_BYTE&&(W=$===Je?n.SRGB8_ALPHA8:n.RGBA8),U===n.UNSIGNED_SHORT&&ae&&(W=ae.RGBA16_EXT),U===n.SHORT&&ae&&(W=ae.RGBA16_SNORM_EXT),U===n.UNSIGNED_SHORT_4_4_4_4&&(W=n.RGBA4),U===n.UNSIGNED_SHORT_5_5_5_1&&(W=n.RGB5_A1)}return(W===n.R16F||W===n.R32F||W===n.RG16F||W===n.RG32F||W===n.RGBA16F||W===n.RGBA32F)&&e.get("EXT_color_buffer_float"),W}function A(T,_){let U;return T?_===null||_===mn||_===Er?U=n.DEPTH24_STENCIL8:_===gn?U=n.DEPTH32F_STENCIL8:_===Tr&&(U=n.DEPTH24_STENCIL8,Ce("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):_===null||_===mn||_===Er?U=n.DEPTH_COMPONENT24:_===gn?U=n.DEPTH_COMPONENT32F:_===Tr&&(U=n.DEPTH_COMPONENT16),U}function E(T,_){return m(T)===!0||T.isFramebufferTexture&&T.minFilter!==Dt&&T.minFilter!==Se?Math.log2(Math.max(_.width,_.height))+1:T.mipmaps!==void 0&&T.mipmaps.length>0?T.mipmaps.length:T.isCompressedTexture&&Array.isArray(T.image)?_.mipmaps.length:1}function I(T){let _=T.target;_.removeEventListener("dispose",I),w(_),_.isVideoTexture&&h.delete(_),_.isHTMLTexture&&d.delete(_)}function y(T){let _=T.target;_.removeEventListener("dispose",y),R(_)}function w(T){let _=i.get(T);if(_.__webglInit===void 0)return;let U=T.source,Y=f.get(U);if(Y){let J=Y[_.__cacheKey];J.usedTimes--,J.usedTimes===0&&F(T),Object.keys(Y).length===0&&f.delete(U)}i.remove(T)}function F(T){let _=i.get(T);n.deleteTexture(_.__webglTexture);let U=T.source,Y=f.get(U);delete Y[_.__cacheKey],a.memory.textures--}function R(T){let _=i.get(T);if(T.depthTexture&&(T.depthTexture.dispose(),i.remove(T.depthTexture)),T.isWebGLCubeRenderTarget)for(let Y=0;Y<6;Y++){if(Array.isArray(_.__webglFramebuffer[Y]))for(let J=0;J<_.__webglFramebuffer[Y].length;J++)n.deleteFramebuffer(_.__webglFramebuffer[Y][J]);else n.deleteFramebuffer(_.__webglFramebuffer[Y]);_.__webglDepthbuffer&&n.deleteRenderbuffer(_.__webglDepthbuffer[Y])}else{if(Array.isArray(_.__webglFramebuffer))for(let Y=0;Y<_.__webglFramebuffer.length;Y++)n.deleteFramebuffer(_.__webglFramebuffer[Y]);else n.deleteFramebuffer(_.__webglFramebuffer);if(_.__webglDepthbuffer&&n.deleteRenderbuffer(_.__webglDepthbuffer),_.__webglMultisampledFramebuffer&&n.deleteFramebuffer(_.__webglMultisampledFramebuffer),_.__webglColorRenderbuffer)for(let Y=0;Y<_.__webglColorRenderbuffer.length;Y++)_.__webglColorRenderbuffer[Y]&&n.deleteRenderbuffer(_.__webglColorRenderbuffer[Y]);_.__webglDepthRenderbuffer&&n.deleteRenderbuffer(_.__webglDepthRenderbuffer)}let U=T.textures;for(let Y=0,J=U.length;Y<J;Y++){let ee=i.get(U[Y]);ee.__webglTexture&&(n.deleteTexture(ee.__webglTexture),a.memory.textures--),i.remove(U[Y])}i.remove(T)}let O=0;function G(){O=0}function X(){return O}function N(T){O=T}function z(){let T=O;return T>=r.maxTextures&&Ce("WebGLTextures: Trying to use "+T+" texture units while this GPU supports only "+r.maxTextures),O+=1,T}function V(T){let _=[];return _.push(T.wrapS),_.push(T.wrapT),_.push(T.wrapR||0),_.push(T.magFilter),_.push(T.minFilter),_.push(T.anisotropy),_.push(T.internalFormat),_.push(T.format),_.push(T.type),_.push(T.generateMipmaps),_.push(T.premultiplyAlpha),_.push(T.flipY),_.push(T.unpackAlignment),_.push(T.colorSpace),_.join()}function j(T,_){let U=i.get(T);if(T.isVideoTexture&&st(T),T.isRenderTargetTexture===!1&&T.isExternalTexture!==!0&&T.version>0&&U.__version!==T.version){let Y=T.image;if(Y===null)Ce("WebGLRenderer: Texture marked for update but no image data found.");else if(Y.complete===!1)Ce("WebGLRenderer: Texture marked for update but image is incomplete");else{Ie(U,T,_);return}}else T.isExternalTexture&&(U.__webglTexture=T.sourceTexture?T.sourceTexture:null);t.bindTexture(n.TEXTURE_2D,U.__webglTexture,n.TEXTURE0+_)}function Q(T,_){let U=i.get(T);if(T.isRenderTargetTexture===!1&&T.version>0&&U.__version!==T.version){Ie(U,T,_);return}else T.isExternalTexture&&(U.__webglTexture=T.sourceTexture?T.sourceTexture:null);t.bindTexture(n.TEXTURE_2D_ARRAY,U.__webglTexture,n.TEXTURE0+_)}function ce(T,_){let U=i.get(T);if(T.isRenderTargetTexture===!1&&T.version>0&&U.__version!==T.version){Ie(U,T,_);return}t.bindTexture(n.TEXTURE_3D,U.__webglTexture,n.TEXTURE0+_)}function be(T,_){let U=i.get(T);if(T.isCubeDepthTexture!==!0&&T.version>0&&U.__version!==T.version){Fe(U,T,_);return}t.bindTexture(n.TEXTURE_CUBE_MAP,U.__webglTexture,n.TEXTURE0+_)}let we={[_a]:n.REPEAT,[Jt]:n.CLAMP_TO_EDGE,[xa]:n.MIRRORED_REPEAT},Ye={[Dt]:n.NEAREST,[nu]:n.NEAREST_MIPMAP_NEAREST,[fs]:n.NEAREST_MIPMAP_LINEAR,[Se]:n.LINEAR,[ja]:n.LINEAR_MIPMAP_NEAREST,[pn]:n.LINEAR_MIPMAP_LINEAR},je={[su]:n.NEVER,[hu]:n.ALWAYS,[au]:n.LESS,[Uo]:n.LEQUAL,[ou]:n.EQUAL,[Oo]:n.GEQUAL,[lu]:n.GREATER,[cu]:n.NOTEQUAL};function Oe(T,_){if(_.type===gn&&e.has("OES_texture_float_linear")===!1&&(_.magFilter===Se||_.magFilter===ja||_.magFilter===fs||_.magFilter===pn||_.minFilter===Se||_.minFilter===ja||_.minFilter===fs||_.minFilter===pn)&&Ce("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(T,n.TEXTURE_WRAP_S,we[_.wrapS]),n.texParameteri(T,n.TEXTURE_WRAP_T,we[_.wrapT]),(T===n.TEXTURE_3D||T===n.TEXTURE_2D_ARRAY)&&n.texParameteri(T,n.TEXTURE_WRAP_R,we[_.wrapR]),n.texParameteri(T,n.TEXTURE_MAG_FILTER,Ye[_.magFilter]),n.texParameteri(T,n.TEXTURE_MIN_FILTER,Ye[_.minFilter]),_.compareFunction&&(n.texParameteri(T,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(T,n.TEXTURE_COMPARE_FUNC,je[_.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(_.magFilter===Dt||_.minFilter!==fs&&_.minFilter!==pn||_.type===gn&&e.has("OES_texture_float_linear")===!1)return;if(_.anisotropy>1||i.get(_).__currentAnisotropy){let U=e.get("EXT_texture_filter_anisotropic");n.texParameterf(T,U.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(_.anisotropy,r.getMaxAnisotropy())),i.get(_).__currentAnisotropy=_.anisotropy}}}function Z(T,_){let U=!1;T.__webglInit===void 0&&(T.__webglInit=!0,_.addEventListener("dispose",I));let Y=_.source,J=f.get(Y);J===void 0&&(J={},f.set(Y,J));let ee=V(_);if(ee!==T.__cacheKey){J[ee]===void 0&&(J[ee]={texture:n.createTexture(),usedTimes:0},a.memory.textures++,U=!0),J[ee].usedTimes++;let ae=J[T.__cacheKey];ae!==void 0&&(J[T.__cacheKey].usedTimes--,ae.usedTimes===0&&F(_)),T.__cacheKey=ee,T.__webglTexture=J[ee].texture}return U}function de(T,_,U){return Math.floor(Math.floor(T/U)/_)}function ie(T,_,U,Y){let ee=T.updateRanges;if(ee.length===0)t.texSubImage2D(n.TEXTURE_2D,0,0,0,_.width,_.height,U,Y,_.data);else{ee.sort((xe,re)=>xe.start-re.start);let ae=0;for(let xe=1;xe<ee.length;xe++){let re=ee[ae],te=ee[xe],De=re.start+re.count,ke=de(te.start,_.width,4),Ke=de(re.start,_.width,4);te.start<=De+1&&ke===Ke&&de(te.start+te.count-1,_.width,4)===ke?re.count=Math.max(re.count,te.start+te.count-re.start):(++ae,ee[ae]=te)}ee.length=ae+1;let W=t.getParameter(n.UNPACK_ROW_LENGTH),$=t.getParameter(n.UNPACK_SKIP_PIXELS),fe=t.getParameter(n.UNPACK_SKIP_ROWS);t.pixelStorei(n.UNPACK_ROW_LENGTH,_.width);for(let xe=0,re=ee.length;xe<re;xe++){let te=ee[xe],De=Math.floor(te.start/4),ke=Math.ceil(te.count/4),Ke=De%_.width,P=Math.floor(De/_.width),ne=ke,q=1;t.pixelStorei(n.UNPACK_SKIP_PIXELS,Ke),t.pixelStorei(n.UNPACK_SKIP_ROWS,P),t.texSubImage2D(n.TEXTURE_2D,0,Ke,P,ne,q,U,Y,_.data)}T.clearUpdateRanges(),t.pixelStorei(n.UNPACK_ROW_LENGTH,W),t.pixelStorei(n.UNPACK_SKIP_PIXELS,$),t.pixelStorei(n.UNPACK_SKIP_ROWS,fe)}}function Ie(T,_,U){let Y=n.TEXTURE_2D;(_.isDataArrayTexture||_.isCompressedArrayTexture)&&(Y=n.TEXTURE_2D_ARRAY),_.isData3DTexture&&(Y=n.TEXTURE_3D);let J=Z(T,_),ee=_.source;t.bindTexture(Y,T.__webglTexture,n.TEXTURE0+U);let ae=i.get(ee);if(ee.version!==ae.__version||J===!0){if(t.activeTexture(n.TEXTURE0+U),(typeof ImageBitmap<"u"&&_.image instanceof ImageBitmap)===!1){let q=qe.getPrimaries(qe.workingColorSpace),pe=_.colorSpace===qn?null:qe.getPrimaries(_.colorSpace),se=_.colorSpace===qn||q===pe?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,_.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,se)}t.pixelStorei(n.UNPACK_ALIGNMENT,_.unpackAlignment);let $=p(_.image,!1,r.maxTextureSize);$=oe(_,$);let fe=s.convert(_.format,_.colorSpace),xe=s.convert(_.type),re=M(_.internalFormat,fe,xe,_.normalized,_.colorSpace,_.isVideoTexture);Oe(Y,_);let te,De=_.mipmaps,ke=_.isVideoTexture!==!0,Ke=ae.__version===void 0||J===!0,P=ee.dataReady,ne=E(_,$);if(_.isDepthTexture)re=A(_.format===gi,_.type),Ke&&(ke?t.texStorage2D(n.TEXTURE_2D,1,re,$.width,$.height):t.texImage2D(n.TEXTURE_2D,0,re,$.width,$.height,0,fe,xe,null));else if(_.isDataTexture)if(De.length>0){ke&&Ke&&t.texStorage2D(n.TEXTURE_2D,ne,re,De[0].width,De[0].height);for(let q=0,pe=De.length;q<pe;q++)te=De[q],ke?P&&t.texSubImage2D(n.TEXTURE_2D,q,0,0,te.width,te.height,fe,xe,te.data):t.texImage2D(n.TEXTURE_2D,q,re,te.width,te.height,0,fe,xe,te.data);_.generateMipmaps=!1}else ke?(Ke&&t.texStorage2D(n.TEXTURE_2D,ne,re,$.width,$.height),P&&ie(_,$,fe,xe)):t.texImage2D(n.TEXTURE_2D,0,re,$.width,$.height,0,fe,xe,$.data);else if(_.isCompressedTexture)if(_.isCompressedArrayTexture){ke&&Ke&&t.texStorage3D(n.TEXTURE_2D_ARRAY,ne,re,De[0].width,De[0].height,$.depth);for(let q=0,pe=De.length;q<pe;q++)if(te=De[q],_.format!==on)if(fe!==null)if(ke){if(P)if(_.layerUpdates.size>0){let se=dc(te.width,te.height,_.format,_.type);for(let K of _.layerUpdates){let Te=te.data.subarray(K*se/te.data.BYTES_PER_ELEMENT,(K+1)*se/te.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,q,0,0,K,te.width,te.height,1,fe,Te)}_.clearLayerUpdates()}else t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,q,0,0,0,te.width,te.height,$.depth,fe,te.data)}else t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,q,re,te.width,te.height,$.depth,0,te.data,0,0);else Ce("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else ke?P&&t.texSubImage3D(n.TEXTURE_2D_ARRAY,q,0,0,0,te.width,te.height,$.depth,fe,xe,te.data):t.texImage3D(n.TEXTURE_2D_ARRAY,q,re,te.width,te.height,$.depth,0,fe,xe,te.data)}else{ke&&Ke&&t.texStorage2D(n.TEXTURE_2D,ne,re,De[0].width,De[0].height);for(let q=0,pe=De.length;q<pe;q++)te=De[q],_.format!==on?fe!==null?ke?P&&t.compressedTexSubImage2D(n.TEXTURE_2D,q,0,0,te.width,te.height,fe,te.data):t.compressedTexImage2D(n.TEXTURE_2D,q,re,te.width,te.height,0,te.data):Ce("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):ke?P&&t.texSubImage2D(n.TEXTURE_2D,q,0,0,te.width,te.height,fe,xe,te.data):t.texImage2D(n.TEXTURE_2D,q,re,te.width,te.height,0,fe,xe,te.data)}else if(_.isDataArrayTexture)if(ke){if(Ke&&t.texStorage3D(n.TEXTURE_2D_ARRAY,ne,re,$.width,$.height,$.depth),P)if(_.layerUpdates.size>0){let q=dc($.width,$.height,_.format,_.type);for(let pe of _.layerUpdates){let se=$.data.subarray(pe*q/$.data.BYTES_PER_ELEMENT,(pe+1)*q/$.data.BYTES_PER_ELEMENT);t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,pe,$.width,$.height,1,fe,xe,se)}_.clearLayerUpdates()}else t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,$.width,$.height,$.depth,fe,xe,$.data)}else t.texImage3D(n.TEXTURE_2D_ARRAY,0,re,$.width,$.height,$.depth,0,fe,xe,$.data);else if(_.isData3DTexture)ke?(Ke&&t.texStorage3D(n.TEXTURE_3D,ne,re,$.width,$.height,$.depth),P&&t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,$.width,$.height,$.depth,fe,xe,$.data)):t.texImage3D(n.TEXTURE_3D,0,re,$.width,$.height,$.depth,0,fe,xe,$.data);else if(_.isFramebufferTexture){if(Ke)if(ke)t.texStorage2D(n.TEXTURE_2D,ne,re,$.width,$.height);else{let q=$.width,pe=$.height;for(let se=0;se<ne;se++)t.texImage2D(n.TEXTURE_2D,se,re,q,pe,0,fe,xe,null),q>>=1,pe>>=1}}else if(_.isHTMLTexture){if("texElementImage2D"in n){let q=n.canvas;if(q.hasAttribute("layoutsubtree")||q.setAttribute("layoutsubtree","true"),$.parentNode!==q){q.appendChild($),d.add(_),q.onpaint=Ne=>{let St=Ne.changedElements;for(let et of d)St.includes(et.image)&&(et.needsUpdate=!0)},q.requestPaint();return}let pe=0,se=n.RGBA,K=n.RGBA,Te=n.UNSIGNED_BYTE;n.texElementImage2D(n.TEXTURE_2D,pe,se,K,Te,$),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MIN_FILTER,n.LINEAR),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE)}}else if(De.length>0){if(ke&&Ke){let q=xt(De[0]);t.texStorage2D(n.TEXTURE_2D,ne,re,q.width,q.height)}for(let q=0,pe=De.length;q<pe;q++)te=De[q],ke?P&&t.texSubImage2D(n.TEXTURE_2D,q,0,0,fe,xe,te):t.texImage2D(n.TEXTURE_2D,q,re,fe,xe,te);_.generateMipmaps=!1}else if(ke){if(Ke){let q=xt($);t.texStorage2D(n.TEXTURE_2D,ne,re,q.width,q.height)}P&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,fe,xe,$)}else t.texImage2D(n.TEXTURE_2D,0,re,fe,xe,$);m(_)&&x(Y),ae.__version=ee.version,_.onUpdate&&_.onUpdate(_)}T.__version=_.version}function Fe(T,_,U){if(_.image.length!==6)return;let Y=Z(T,_),J=_.source;t.bindTexture(n.TEXTURE_CUBE_MAP,T.__webglTexture,n.TEXTURE0+U);let ee=i.get(J);if(J.version!==ee.__version||Y===!0){t.activeTexture(n.TEXTURE0+U);let ae=qe.getPrimaries(qe.workingColorSpace),W=_.colorSpace===qn?null:qe.getPrimaries(_.colorSpace),$=_.colorSpace===qn||ae===W?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,_.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),t.pixelStorei(n.UNPACK_ALIGNMENT,_.unpackAlignment),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,$);let fe=_.isCompressedTexture||_.image[0].isCompressedTexture,xe=_.image[0]&&_.image[0].isDataTexture,re=[];for(let K=0;K<6;K++)!fe&&!xe?re[K]=p(_.image[K],!0,r.maxCubemapSize):re[K]=xe?_.image[K].image:_.image[K],re[K]=oe(_,re[K]);let te=re[0],De=s.convert(_.format,_.colorSpace),ke=s.convert(_.type),Ke=M(_.internalFormat,De,ke,_.normalized,_.colorSpace),P=_.isVideoTexture!==!0,ne=ee.__version===void 0||Y===!0,q=J.dataReady,pe=E(_,te);Oe(n.TEXTURE_CUBE_MAP,_);let se;if(fe){P&&ne&&t.texStorage2D(n.TEXTURE_CUBE_MAP,pe,Ke,te.width,te.height);for(let K=0;K<6;K++){se=re[K].mipmaps;for(let Te=0;Te<se.length;Te++){let Ne=se[Te];_.format!==on?De!==null?P?q&&t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Te,0,0,Ne.width,Ne.height,De,Ne.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Te,Ke,Ne.width,Ne.height,0,Ne.data):Ce("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):P?q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Te,0,0,Ne.width,Ne.height,De,ke,Ne.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Te,Ke,Ne.width,Ne.height,0,De,ke,Ne.data)}}}else{if(se=_.mipmaps,P&&ne){se.length>0&&pe++;let K=xt(re[0]);t.texStorage2D(n.TEXTURE_CUBE_MAP,pe,Ke,K.width,K.height)}for(let K=0;K<6;K++)if(xe){P?q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,0,0,re[K].width,re[K].height,De,ke,re[K].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,Ke,re[K].width,re[K].height,0,De,ke,re[K].data);for(let Te=0;Te<se.length;Te++){let St=se[Te].image[K].image;P?q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Te+1,0,0,St.width,St.height,De,ke,St.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Te+1,Ke,St.width,St.height,0,De,ke,St.data)}}else{P?q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,0,0,De,ke,re[K]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,Ke,De,ke,re[K]);for(let Te=0;Te<se.length;Te++){let Ne=se[Te];P?q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Te+1,0,0,De,ke,Ne.image[K]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Te+1,Ke,De,ke,Ne.image[K])}}}m(_)&&x(n.TEXTURE_CUBE_MAP),ee.__version=J.version,_.onUpdate&&_.onUpdate(_)}T.__version=_.version}function Pe(T,_,U,Y,J,ee){let ae=s.convert(U.format,U.colorSpace),W=s.convert(U.type),$=M(U.internalFormat,ae,W,U.normalized,U.colorSpace),fe=i.get(_),xe=i.get(U);if(xe.__renderTarget=_,!fe.__hasExternalTextures){let re=Math.max(1,_.width>>ee),te=Math.max(1,_.height>>ee);J===n.TEXTURE_3D||J===n.TEXTURE_2D_ARRAY?t.texImage3D(J,ee,$,re,te,_.depth,0,ae,W,null):t.texImage2D(J,ee,$,re,te,0,ae,W,null)}t.bindFramebuffer(n.FRAMEBUFFER,T),Xe(_)?l.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,Y,J,xe.__webglTexture,0,Ct(_)):(J===n.TEXTURE_2D||J>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&J<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,Y,J,xe.__webglTexture,ee),t.bindFramebuffer(n.FRAMEBUFFER,null)}function ft(T,_,U){if(n.bindRenderbuffer(n.RENDERBUFFER,T),_.depthBuffer){let Y=_.depthTexture,J=Y&&Y.isDepthTexture?Y.type:null,ee=A(_.stencilBuffer,J),ae=_.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;Xe(_)?l.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Ct(_),ee,_.width,_.height):U?n.renderbufferStorageMultisample(n.RENDERBUFFER,Ct(_),ee,_.width,_.height):n.renderbufferStorage(n.RENDERBUFFER,ee,_.width,_.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,ae,n.RENDERBUFFER,T)}else{let Y=_.textures;for(let J=0;J<Y.length;J++){let ee=Y[J],ae=s.convert(ee.format,ee.colorSpace),W=s.convert(ee.type),$=M(ee.internalFormat,ae,W,ee.normalized,ee.colorSpace);Xe(_)?l.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Ct(_),$,_.width,_.height):U?n.renderbufferStorageMultisample(n.RENDERBUFFER,Ct(_),$,_.width,_.height):n.renderbufferStorage(n.RENDERBUFFER,$,_.width,_.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function We(T,_,U){let Y=_.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(n.FRAMEBUFFER,T),!(_.depthTexture&&_.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let J=i.get(_.depthTexture);if(J.__renderTarget=_,(!J.__webglTexture||_.depthTexture.image.width!==_.width||_.depthTexture.image.height!==_.height)&&(_.depthTexture.image.width=_.width,_.depthTexture.image.height=_.height,_.depthTexture.needsUpdate=!0),Y){if(J.__webglInit===void 0&&(J.__webglInit=!0,_.depthTexture.addEventListener("dispose",I)),J.__webglTexture===void 0){J.__webglTexture=n.createTexture(),t.bindTexture(n.TEXTURE_CUBE_MAP,J.__webglTexture),Oe(n.TEXTURE_CUBE_MAP,_.depthTexture);let fe=s.convert(_.depthTexture.format),xe=s.convert(_.depthTexture.type),re;_.depthTexture.format===Tn?re=n.DEPTH_COMPONENT24:_.depthTexture.format===gi&&(re=n.DEPTH24_STENCIL8);for(let te=0;te<6;te++)n.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,re,_.width,_.height,0,fe,xe,null)}}else j(_.depthTexture,0);let ee=J.__webglTexture,ae=Ct(_),W=Y?n.TEXTURE_CUBE_MAP_POSITIVE_X+U:n.TEXTURE_2D,$=_.depthTexture.format===gi?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;if(_.depthTexture.format===Tn)Xe(_)?l.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,$,W,ee,0,ae):n.framebufferTexture2D(n.FRAMEBUFFER,$,W,ee,0);else if(_.depthTexture.format===gi)Xe(_)?l.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,$,W,ee,0,ae):n.framebufferTexture2D(n.FRAMEBUFFER,$,W,ee,0);else throw new Error("Unknown depthTexture format")}function Qe(T){let _=i.get(T),U=T.isWebGLCubeRenderTarget===!0;if(_.__boundDepthTexture!==T.depthTexture){let Y=T.depthTexture;if(_.__depthDisposeCallback&&_.__depthDisposeCallback(),Y){let J=()=>{delete _.__boundDepthTexture,delete _.__depthDisposeCallback,Y.removeEventListener("dispose",J)};Y.addEventListener("dispose",J),_.__depthDisposeCallback=J}_.__boundDepthTexture=Y}if(T.depthTexture&&!_.__autoAllocateDepthBuffer)if(U)for(let Y=0;Y<6;Y++)We(_.__webglFramebuffer[Y],T,Y);else{let Y=T.texture.mipmaps;Y&&Y.length>0?We(_.__webglFramebuffer[0],T,0):We(_.__webglFramebuffer,T,0)}else if(U){_.__webglDepthbuffer=[];for(let Y=0;Y<6;Y++)if(t.bindFramebuffer(n.FRAMEBUFFER,_.__webglFramebuffer[Y]),_.__webglDepthbuffer[Y]===void 0)_.__webglDepthbuffer[Y]=n.createRenderbuffer(),ft(_.__webglDepthbuffer[Y],T,!1);else{let J=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ee=_.__webglDepthbuffer[Y];n.bindRenderbuffer(n.RENDERBUFFER,ee),n.framebufferRenderbuffer(n.FRAMEBUFFER,J,n.RENDERBUFFER,ee)}}else{let Y=T.texture.mipmaps;if(Y&&Y.length>0?t.bindFramebuffer(n.FRAMEBUFFER,_.__webglFramebuffer[0]):t.bindFramebuffer(n.FRAMEBUFFER,_.__webglFramebuffer),_.__webglDepthbuffer===void 0)_.__webglDepthbuffer=n.createRenderbuffer(),ft(_.__webglDepthbuffer,T,!1);else{let J=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ee=_.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,ee),n.framebufferRenderbuffer(n.FRAMEBUFFER,J,n.RENDERBUFFER,ee)}}t.bindFramebuffer(n.FRAMEBUFFER,null)}function lt(T,_,U){let Y=i.get(T);_!==void 0&&Pe(Y.__webglFramebuffer,T,T.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),U!==void 0&&Qe(T)}function Ve(T){let _=T.texture,U=i.get(T),Y=i.get(_);T.addEventListener("dispose",y);let J=T.textures,ee=T.isWebGLCubeRenderTarget===!0,ae=J.length>1;if(ae||(Y.__webglTexture===void 0&&(Y.__webglTexture=n.createTexture()),Y.__version=_.version,a.memory.textures++),ee){U.__webglFramebuffer=[];for(let W=0;W<6;W++)if(_.mipmaps&&_.mipmaps.length>0){U.__webglFramebuffer[W]=[];for(let $=0;$<_.mipmaps.length;$++)U.__webglFramebuffer[W][$]=n.createFramebuffer()}else U.__webglFramebuffer[W]=n.createFramebuffer()}else{if(_.mipmaps&&_.mipmaps.length>0){U.__webglFramebuffer=[];for(let W=0;W<_.mipmaps.length;W++)U.__webglFramebuffer[W]=n.createFramebuffer()}else U.__webglFramebuffer=n.createFramebuffer();if(ae)for(let W=0,$=J.length;W<$;W++){let fe=i.get(J[W]);fe.__webglTexture===void 0&&(fe.__webglTexture=n.createTexture(),a.memory.textures++)}if(T.samples>0&&Xe(T)===!1){U.__webglMultisampledFramebuffer=n.createFramebuffer(),U.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,U.__webglMultisampledFramebuffer);for(let W=0;W<J.length;W++){let $=J[W];U.__webglColorRenderbuffer[W]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,U.__webglColorRenderbuffer[W]);let fe=s.convert($.format,$.colorSpace),xe=s.convert($.type),re=M($.internalFormat,fe,xe,$.normalized,$.colorSpace,T.isXRRenderTarget===!0),te=Ct(T);n.renderbufferStorageMultisample(n.RENDERBUFFER,te,re,T.width,T.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+W,n.RENDERBUFFER,U.__webglColorRenderbuffer[W])}n.bindRenderbuffer(n.RENDERBUFFER,null),T.depthBuffer&&(U.__webglDepthRenderbuffer=n.createRenderbuffer(),ft(U.__webglDepthRenderbuffer,T,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(ee){t.bindTexture(n.TEXTURE_CUBE_MAP,Y.__webglTexture),Oe(n.TEXTURE_CUBE_MAP,_);for(let W=0;W<6;W++)if(_.mipmaps&&_.mipmaps.length>0)for(let $=0;$<_.mipmaps.length;$++)Pe(U.__webglFramebuffer[W][$],T,_,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+W,$);else Pe(U.__webglFramebuffer[W],T,_,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+W,0);m(_)&&x(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(ae){for(let W=0,$=J.length;W<$;W++){let fe=J[W],xe=i.get(fe),re=n.TEXTURE_2D;(T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&(re=T.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(re,xe.__webglTexture),Oe(re,fe),Pe(U.__webglFramebuffer,T,fe,n.COLOR_ATTACHMENT0+W,re,0),m(fe)&&x(re)}t.unbindTexture()}else{let W=n.TEXTURE_2D;if((T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&(W=T.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(W,Y.__webglTexture),Oe(W,_),_.mipmaps&&_.mipmaps.length>0)for(let $=0;$<_.mipmaps.length;$++)Pe(U.__webglFramebuffer[$],T,_,n.COLOR_ATTACHMENT0,W,$);else Pe(U.__webglFramebuffer,T,_,n.COLOR_ATTACHMENT0,W,0);m(_)&&x(W),t.unbindTexture()}T.depthBuffer&&Qe(T)}function At(T){let _=T.textures;for(let U=0,Y=_.length;U<Y;U++){let J=_[U];if(m(J)){let ee=b(T),ae=i.get(J).__webglTexture;t.bindTexture(ee,ae),x(ee),t.unbindTexture()}}}let pt=[],Yt=[];function D(T){if(T.samples>0){if(Xe(T)===!1){let _=T.textures,U=T.width,Y=T.height,J=n.COLOR_BUFFER_BIT,ee=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ae=i.get(T),W=_.length>1;if(W)for(let fe=0;fe<_.length;fe++)t.bindFramebuffer(n.FRAMEBUFFER,ae.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+fe,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,ae.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+fe,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,ae.__webglMultisampledFramebuffer);let $=T.texture.mipmaps;$&&$.length>0?t.bindFramebuffer(n.DRAW_FRAMEBUFFER,ae.__webglFramebuffer[0]):t.bindFramebuffer(n.DRAW_FRAMEBUFFER,ae.__webglFramebuffer);for(let fe=0;fe<_.length;fe++){if(T.resolveDepthBuffer&&(T.depthBuffer&&(J|=n.DEPTH_BUFFER_BIT),T.stencilBuffer&&T.resolveStencilBuffer&&(J|=n.STENCIL_BUFFER_BIT)),W){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,ae.__webglColorRenderbuffer[fe]);let xe=i.get(_[fe]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,xe,0)}n.blitFramebuffer(0,0,U,Y,0,0,U,Y,J,n.NEAREST),o===!0&&(pt.length=0,Yt.length=0,pt.push(n.COLOR_ATTACHMENT0+fe),T.depthBuffer&&T.resolveDepthBuffer===!1&&(pt.push(ee),Yt.push(ee),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,Yt)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,pt))}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),W)for(let fe=0;fe<_.length;fe++){t.bindFramebuffer(n.FRAMEBUFFER,ae.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+fe,n.RENDERBUFFER,ae.__webglColorRenderbuffer[fe]);let xe=i.get(_[fe]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,ae.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+fe,n.TEXTURE_2D,xe,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,ae.__webglMultisampledFramebuffer)}else if(T.depthBuffer&&T.resolveDepthBuffer===!1&&o){let _=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[_])}}}function Ct(T){return Math.min(r.maxSamples,T.samples)}function Xe(T){let _=i.get(T);return T.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&_.__useRenderToTexture!==!1}function st(T){let _=a.render.frame;h.get(T)!==_&&(h.set(T,_),T.update())}function oe(T,_){let U=T.colorSpace,Y=T.format,J=T.type;return T.isCompressedTexture===!0||T.isVideoTexture===!0||U!==Hr&&U!==qn&&(qe.getTransfer(U)===Je?(Y!==on||J!==rn)&&Ce("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Re("WebGLTextures: Unsupported texture color space:",U)),_}function xt(T){return typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement?(c.width=T.naturalWidth||T.width,c.height=T.naturalHeight||T.height):typeof VideoFrame<"u"&&T instanceof VideoFrame?(c.width=T.displayWidth,c.height=T.displayHeight):(c.width=T.width,c.height=T.height),c}this.allocateTextureUnit=z,this.resetTextureUnits=G,this.getTextureUnits=X,this.setTextureUnits=N,this.setTexture2D=j,this.setTexture2DArray=Q,this.setTexture3D=ce,this.setTextureCube=be,this.rebindTextures=lt,this.setupRenderTarget=Ve,this.updateRenderTargetMipmap=At,this.updateMultisampleRenderTarget=D,this.setupDepthRenderbuffer=Qe,this.setupFrameBufferTexture=Pe,this.useMultisampledRTT=Xe,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function m_(n,e){function t(i,r=qn){let s,a=qe.getTransfer(r);if(i===rn)return n.UNSIGNED_BYTE;if(i===eo)return n.UNSIGNED_SHORT_4_4_4_4;if(i===to)return n.UNSIGNED_SHORT_5_5_5_1;if(i===tc)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===nc)return n.UNSIGNED_INT_10F_11F_11F_REV;if(i===Ql)return n.BYTE;if(i===ec)return n.SHORT;if(i===Tr)return n.UNSIGNED_SHORT;if(i===Qa)return n.INT;if(i===mn)return n.UNSIGNED_INT;if(i===gn)return n.FLOAT;if(i===In)return n.HALF_FLOAT;if(i===ic)return n.ALPHA;if(i===rc)return n.RGB;if(i===on)return n.RGBA;if(i===Tn)return n.DEPTH_COMPONENT;if(i===gi)return n.DEPTH_STENCIL;if(i===sc)return n.RED;if(i===no)return n.RED_INTEGER;if(i===_i)return n.RG;if(i===io)return n.RG_INTEGER;if(i===ro)return n.RGBA_INTEGER;if(i===ps||i===ms||i===gs||i===_s)if(a===Je)if(s=e.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(i===ps)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===ms)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===gs)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===_s)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=e.get("WEBGL_compressed_texture_s3tc"),s!==null){if(i===ps)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===ms)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===gs)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===_s)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===so||i===ao||i===oo||i===lo)if(s=e.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(i===so)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===ao)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===oo)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===lo)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===co||i===ho||i===uo||i===fo||i===po||i===xs||i===mo)if(s=e.get("WEBGL_compressed_texture_etc"),s!==null){if(i===co||i===ho)return a===Je?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(i===uo)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC;if(i===fo)return s.COMPRESSED_R11_EAC;if(i===po)return s.COMPRESSED_SIGNED_R11_EAC;if(i===xs)return s.COMPRESSED_RG11_EAC;if(i===mo)return s.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===go||i===_o||i===xo||i===yo||i===vo||i===So||i===bo||i===Mo||i===To||i===Eo||i===wo||i===Ao||i===Co||i===Ro)if(s=e.get("WEBGL_compressed_texture_astc"),s!==null){if(i===go)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===_o)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===xo)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===yo)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===vo)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===So)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===bo)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===Mo)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===To)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===Eo)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===wo)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===Ao)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===Co)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===Ro)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===Io||i===Po||i===Do)if(s=e.get("EXT_texture_compression_bptc"),s!==null){if(i===Io)return a===Je?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===Po)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===Do)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===Lo||i===Fo||i===ys||i===No)if(s=e.get("EXT_texture_compression_rgtc"),s!==null){if(i===Lo)return s.COMPRESSED_RED_RGTC1_EXT;if(i===Fo)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===ys)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===No)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===Er?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:t}}var g_=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,__=`
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

}`,wc=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let i=new Jr(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=i}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,i=new tn({vertexShader:g_,fragmentShader:__,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new ht(new en(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Ac=class extends En{constructor(e,t){super();let i=this,r=null,s=1,a=null,l="local-floor",o=1,c=null,h=null,d=null,u=null,f=null,g=null,v=typeof XRWebGLBinding<"u",p=new wc,m={},x=t.getContextAttributes(),b=null,M=null,A=[],E=[],I=new _e,y=null,w=new Wt;w.viewport=new vt;let F=new Wt;F.viewport=new vt;let R=[w,F],O=new Za,G=null,X=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Z){let de=A[Z];return de===void 0&&(de=new ur,A[Z]=de),de.getTargetRaySpace()},this.getControllerGrip=function(Z){let de=A[Z];return de===void 0&&(de=new ur,A[Z]=de),de.getGripSpace()},this.getHand=function(Z){let de=A[Z];return de===void 0&&(de=new ur,A[Z]=de),de.getHandSpace()};function N(Z){let de=E.indexOf(Z.inputSource);if(de===-1)return;let ie=A[de];ie!==void 0&&(ie.update(Z.inputSource,Z.frame,c||a),ie.dispatchEvent({type:Z.type,data:Z.inputSource}))}function z(){r.removeEventListener("select",N),r.removeEventListener("selectstart",N),r.removeEventListener("selectend",N),r.removeEventListener("squeeze",N),r.removeEventListener("squeezestart",N),r.removeEventListener("squeezeend",N),r.removeEventListener("end",z),r.removeEventListener("inputsourceschange",V);for(let Z=0;Z<A.length;Z++){let de=E[Z];de!==null&&(E[Z]=null,A[Z].disconnect(de))}G=null,X=null,p.reset();for(let Z in m)delete m[Z];e.setRenderTarget(b),f=null,u=null,d=null,r=null,M=null,Oe.stop(),i.isPresenting=!1,e.setPixelRatio(y),e.setSize(I.width,I.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Z){s=Z,i.isPresenting===!0&&Ce("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Z){l=Z,i.isPresenting===!0&&Ce("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(Z){c=Z},this.getBaseLayer=function(){return u!==null?u:f},this.getBinding=function(){return d===null&&v&&(d=new XRWebGLBinding(r,t)),d},this.getFrame=function(){return g},this.getSession=function(){return r},this.setSession=async function(Z){if(r=Z,r!==null){if(b=e.getRenderTarget(),r.addEventListener("select",N),r.addEventListener("selectstart",N),r.addEventListener("selectend",N),r.addEventListener("squeeze",N),r.addEventListener("squeezestart",N),r.addEventListener("squeezeend",N),r.addEventListener("end",z),r.addEventListener("inputsourceschange",V),x.xrCompatible!==!0&&await t.makeXRCompatible(),y=e.getPixelRatio(),e.getSize(I),v&&"createProjectionLayer"in XRWebGLBinding.prototype){let ie=null,Ie=null,Fe=null;x.depth&&(Fe=x.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,ie=x.stencil?gi:Tn,Ie=x.stencil?Er:mn);let Pe={colorFormat:t.RGBA8,depthFormat:Fe,scaleFactor:s};d=this.getBinding(),u=d.createProjectionLayer(Pe),r.updateRenderState({layers:[u]}),e.setPixelRatio(1),e.setSize(u.textureWidth,u.textureHeight,!1),M=new jt(u.textureWidth,u.textureHeight,{format:on,type:rn,depthTexture:new Xn(u.textureWidth,u.textureHeight,Ie,void 0,void 0,void 0,void 0,void 0,void 0,ie),stencilBuffer:x.stencil,colorSpace:e.outputColorSpace,samples:x.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1})}else{let ie={antialias:x.antialias,alpha:!0,depth:x.depth,stencil:x.stencil,framebufferScaleFactor:s};f=new XRWebGLLayer(r,t,ie),r.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),M=new jt(f.framebufferWidth,f.framebufferHeight,{format:on,type:rn,colorSpace:e.outputColorSpace,stencilBuffer:x.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1})}M.isXRRenderTarget=!0,this.setFoveation(o),c=null,a=await r.requestReferenceSpace(l),Oe.setContext(r),Oe.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return p.getDepthTexture()};function V(Z){for(let de=0;de<Z.removed.length;de++){let ie=Z.removed[de],Ie=E.indexOf(ie);Ie>=0&&(E[Ie]=null,A[Ie].disconnect(ie))}for(let de=0;de<Z.added.length;de++){let ie=Z.added[de],Ie=E.indexOf(ie);if(Ie===-1){for(let Pe=0;Pe<A.length;Pe++)if(Pe>=E.length){E.push(ie),Ie=Pe;break}else if(E[Pe]===null){E[Pe]=ie,Ie=Pe;break}if(Ie===-1)break}let Fe=A[Ie];Fe&&Fe.connect(ie)}}let j=new C,Q=new C;function ce(Z,de,ie){j.setFromMatrixPosition(de.matrixWorld),Q.setFromMatrixPosition(ie.matrixWorld);let Ie=j.distanceTo(Q),Fe=de.projectionMatrix.elements,Pe=ie.projectionMatrix.elements,ft=Fe[14]/(Fe[10]-1),We=Fe[14]/(Fe[10]+1),Qe=(Fe[9]+1)/Fe[5],lt=(Fe[9]-1)/Fe[5],Ve=(Fe[8]-1)/Fe[0],At=(Pe[8]+1)/Pe[0],pt=ft*Ve,Yt=ft*At,D=Ie/(-Ve+At),Ct=D*-Ve;if(de.matrixWorld.decompose(Z.position,Z.quaternion,Z.scale),Z.translateX(Ct),Z.translateZ(D),Z.matrixWorld.compose(Z.position,Z.quaternion,Z.scale),Z.matrixWorldInverse.copy(Z.matrixWorld).invert(),Fe[10]===-1)Z.projectionMatrix.copy(de.projectionMatrix),Z.projectionMatrixInverse.copy(de.projectionMatrixInverse);else{let Xe=ft+D,st=We+D,oe=pt-Ct,xt=Yt+(Ie-Ct),T=Qe*We/st*Xe,_=lt*We/st*Xe;Z.projectionMatrix.makePerspective(oe,xt,T,_,Xe,st),Z.projectionMatrixInverse.copy(Z.projectionMatrix).invert()}}function be(Z,de){de===null?Z.matrixWorld.copy(Z.matrix):Z.matrixWorld.multiplyMatrices(de.matrixWorld,Z.matrix),Z.matrixWorldInverse.copy(Z.matrixWorld).invert()}this.updateCamera=function(Z){if(r===null)return;let de=Z.near,ie=Z.far;p.texture!==null&&(p.depthNear>0&&(de=p.depthNear),p.depthFar>0&&(ie=p.depthFar)),O.near=F.near=w.near=de,O.far=F.far=w.far=ie,(G!==O.near||X!==O.far)&&(r.updateRenderState({depthNear:O.near,depthFar:O.far}),G=O.near,X=O.far),O.layers.mask=Z.layers.mask|6,w.layers.mask=O.layers.mask&-5,F.layers.mask=O.layers.mask&-3;let Ie=Z.parent,Fe=O.cameras;be(O,Ie);for(let Pe=0;Pe<Fe.length;Pe++)be(Fe[Pe],Ie);Fe.length===2?ce(O,w,F):O.projectionMatrix.copy(w.projectionMatrix),we(Z,O,Ie)};function we(Z,de,ie){ie===null?Z.matrix.copy(de.matrixWorld):(Z.matrix.copy(ie.matrixWorld),Z.matrix.invert(),Z.matrix.multiply(de.matrixWorld)),Z.matrix.decompose(Z.position,Z.quaternion,Z.scale),Z.updateMatrixWorld(!0),Z.projectionMatrix.copy(de.projectionMatrix),Z.projectionMatrixInverse.copy(de.projectionMatrixInverse),Z.isPerspectiveCamera&&(Z.fov=ba*2*Math.atan(1/Z.projectionMatrix.elements[5]),Z.zoom=1)}this.getCamera=function(){return O},this.getFoveation=function(){if(!(u===null&&f===null))return o},this.setFoveation=function(Z){o=Z,u!==null&&(u.fixedFoveation=Z),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=Z)},this.hasDepthSensing=function(){return p.texture!==null},this.getDepthSensingMesh=function(){return p.getMesh(O)},this.getCameraTexture=function(Z){return m[Z]};let Ye=null;function je(Z,de){if(h=de.getViewerPose(c||a),g=de,h!==null){let ie=h.views;f!==null&&(e.setRenderTargetFramebuffer(M,f.framebuffer),e.setRenderTarget(M));let Ie=!1;ie.length!==O.cameras.length&&(O.cameras.length=0,Ie=!0);for(let We=0;We<ie.length;We++){let Qe=ie[We],lt=null;if(f!==null)lt=f.getViewport(Qe);else{let At=d.getViewSubImage(u,Qe);lt=At.viewport,We===0&&(e.setRenderTargetTextures(M,At.colorTexture,At.depthStencilTexture),e.setRenderTarget(M))}let Ve=R[We];Ve===void 0&&(Ve=new Wt,Ve.layers.enable(We),Ve.viewport=new vt,R[We]=Ve),Ve.matrix.fromArray(Qe.transform.matrix),Ve.matrix.decompose(Ve.position,Ve.quaternion,Ve.scale),Ve.projectionMatrix.fromArray(Qe.projectionMatrix),Ve.projectionMatrixInverse.copy(Ve.projectionMatrix).invert(),Ve.viewport.set(lt.x,lt.y,lt.width,lt.height),We===0&&(O.matrix.copy(Ve.matrix),O.matrix.decompose(O.position,O.quaternion,O.scale)),Ie===!0&&O.cameras.push(Ve)}let Fe=r.enabledFeatures;if(Fe&&Fe.includes("depth-sensing")&&r.depthUsage=="gpu-optimized"&&v){d=i.getBinding();let We=d.getDepthInformation(ie[0]);We&&We.isValid&&We.texture&&p.init(We,r.renderState)}if(Fe&&Fe.includes("camera-access")&&v){e.state.unbindTexture(),d=i.getBinding();for(let We=0;We<ie.length;We++){let Qe=ie[We].camera;if(Qe){let lt=m[Qe];lt||(lt=new Jr,m[Qe]=lt);let Ve=d.getCameraImage(Qe);lt.sourceTexture=Ve}}}}for(let ie=0;ie<A.length;ie++){let Ie=E[ie],Fe=A[ie];Ie!==null&&Fe!==void 0&&Fe.update(Ie,de,c||a)}Ye&&Ye(Z,de),de.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:de}),g=null}let Oe=new Xu;Oe.setAnimationLoop(je),this.setAnimationLoop=function(Z){Ye=Z},this.dispose=function(){}}},x_=new dt,Ju=new Le;Ju.set(-1,0,0,0,1,0,0,0,1);function y_(n,e){function t(p,m){p.matrixAutoUpdate===!0&&p.updateMatrix(),m.value.copy(p.matrix)}function i(p,m){m.color.getRGB(p.fogColor.value,cc(n)),m.isFog?(p.fogNear.value=m.near,p.fogFar.value=m.far):m.isFogExp2&&(p.fogDensity.value=m.density)}function r(p,m,x,b,M){m.isNodeMaterial?m.uniformsNeedUpdate=!1:m.isMeshBasicMaterial?s(p,m):m.isMeshLambertMaterial?(s(p,m),m.envMap&&(p.envMapIntensity.value=m.envMapIntensity)):m.isMeshToonMaterial?(s(p,m),d(p,m)):m.isMeshPhongMaterial?(s(p,m),h(p,m),m.envMap&&(p.envMapIntensity.value=m.envMapIntensity)):m.isMeshStandardMaterial?(s(p,m),u(p,m),m.isMeshPhysicalMaterial&&f(p,m,M)):m.isMeshMatcapMaterial?(s(p,m),g(p,m)):m.isMeshDepthMaterial?s(p,m):m.isMeshDistanceMaterial?(s(p,m),v(p,m)):m.isMeshNormalMaterial?s(p,m):m.isLineBasicMaterial?(a(p,m),m.isLineDashedMaterial&&l(p,m)):m.isPointsMaterial?o(p,m,x,b):m.isSpriteMaterial?c(p,m):m.isShadowMaterial?(p.color.value.copy(m.color),p.opacity.value=m.opacity):m.isShaderMaterial&&(m.uniformsNeedUpdate=!1)}function s(p,m){p.opacity.value=m.opacity,m.color&&p.diffuse.value.copy(m.color),m.emissive&&p.emissive.value.copy(m.emissive).multiplyScalar(m.emissiveIntensity),m.map&&(p.map.value=m.map,t(m.map,p.mapTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,t(m.alphaMap,p.alphaMapTransform)),m.bumpMap&&(p.bumpMap.value=m.bumpMap,t(m.bumpMap,p.bumpMapTransform),p.bumpScale.value=m.bumpScale,m.side===Vt&&(p.bumpScale.value*=-1)),m.normalMap&&(p.normalMap.value=m.normalMap,t(m.normalMap,p.normalMapTransform),p.normalScale.value.copy(m.normalScale),m.side===Vt&&p.normalScale.value.negate()),m.displacementMap&&(p.displacementMap.value=m.displacementMap,t(m.displacementMap,p.displacementMapTransform),p.displacementScale.value=m.displacementScale,p.displacementBias.value=m.displacementBias),m.emissiveMap&&(p.emissiveMap.value=m.emissiveMap,t(m.emissiveMap,p.emissiveMapTransform)),m.specularMap&&(p.specularMap.value=m.specularMap,t(m.specularMap,p.specularMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest);let x=e.get(m),b=x.envMap,M=x.envMapRotation;b&&(p.envMap.value=b,p.envMapRotation.value.setFromMatrix4(x_.makeRotationFromEuler(M)).transpose(),b.isCubeTexture&&b.isRenderTargetTexture===!1&&p.envMapRotation.value.premultiply(Ju),p.reflectivity.value=m.reflectivity,p.ior.value=m.ior,p.refractionRatio.value=m.refractionRatio),m.lightMap&&(p.lightMap.value=m.lightMap,p.lightMapIntensity.value=m.lightMapIntensity,t(m.lightMap,p.lightMapTransform)),m.aoMap&&(p.aoMap.value=m.aoMap,p.aoMapIntensity.value=m.aoMapIntensity,t(m.aoMap,p.aoMapTransform))}function a(p,m){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,m.map&&(p.map.value=m.map,t(m.map,p.mapTransform))}function l(p,m){p.dashSize.value=m.dashSize,p.totalSize.value=m.dashSize+m.gapSize,p.scale.value=m.scale}function o(p,m,x,b){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,p.size.value=m.size*x,p.scale.value=b*.5,m.map&&(p.map.value=m.map,t(m.map,p.uvTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,t(m.alphaMap,p.alphaMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest)}function c(p,m){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,p.rotation.value=m.rotation,m.map&&(p.map.value=m.map,t(m.map,p.mapTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,t(m.alphaMap,p.alphaMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest)}function h(p,m){p.specular.value.copy(m.specular),p.shininess.value=Math.max(m.shininess,1e-4)}function d(p,m){m.gradientMap&&(p.gradientMap.value=m.gradientMap)}function u(p,m){p.metalness.value=m.metalness,m.metalnessMap&&(p.metalnessMap.value=m.metalnessMap,t(m.metalnessMap,p.metalnessMapTransform)),p.roughness.value=m.roughness,m.roughnessMap&&(p.roughnessMap.value=m.roughnessMap,t(m.roughnessMap,p.roughnessMapTransform)),m.envMap&&(p.envMapIntensity.value=m.envMapIntensity)}function f(p,m,x){p.ior.value=m.ior,m.sheen>0&&(p.sheenColor.value.copy(m.sheenColor).multiplyScalar(m.sheen),p.sheenRoughness.value=m.sheenRoughness,m.sheenColorMap&&(p.sheenColorMap.value=m.sheenColorMap,t(m.sheenColorMap,p.sheenColorMapTransform)),m.sheenRoughnessMap&&(p.sheenRoughnessMap.value=m.sheenRoughnessMap,t(m.sheenRoughnessMap,p.sheenRoughnessMapTransform))),m.clearcoat>0&&(p.clearcoat.value=m.clearcoat,p.clearcoatRoughness.value=m.clearcoatRoughness,m.clearcoatMap&&(p.clearcoatMap.value=m.clearcoatMap,t(m.clearcoatMap,p.clearcoatMapTransform)),m.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=m.clearcoatRoughnessMap,t(m.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),m.clearcoatNormalMap&&(p.clearcoatNormalMap.value=m.clearcoatNormalMap,t(m.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(m.clearcoatNormalScale),m.side===Vt&&p.clearcoatNormalScale.value.negate())),m.dispersion>0&&(p.dispersion.value=m.dispersion),m.iridescence>0&&(p.iridescence.value=m.iridescence,p.iridescenceIOR.value=m.iridescenceIOR,p.iridescenceThicknessMinimum.value=m.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=m.iridescenceThicknessRange[1],m.iridescenceMap&&(p.iridescenceMap.value=m.iridescenceMap,t(m.iridescenceMap,p.iridescenceMapTransform)),m.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=m.iridescenceThicknessMap,t(m.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),m.transmission>0&&(p.transmission.value=m.transmission,p.transmissionSamplerMap.value=x.texture,p.transmissionSamplerSize.value.set(x.width,x.height),m.transmissionMap&&(p.transmissionMap.value=m.transmissionMap,t(m.transmissionMap,p.transmissionMapTransform)),p.thickness.value=m.thickness,m.thicknessMap&&(p.thicknessMap.value=m.thicknessMap,t(m.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=m.attenuationDistance,p.attenuationColor.value.copy(m.attenuationColor)),m.anisotropy>0&&(p.anisotropyVector.value.set(m.anisotropy*Math.cos(m.anisotropyRotation),m.anisotropy*Math.sin(m.anisotropyRotation)),m.anisotropyMap&&(p.anisotropyMap.value=m.anisotropyMap,t(m.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=m.specularIntensity,p.specularColor.value.copy(m.specularColor),m.specularColorMap&&(p.specularColorMap.value=m.specularColorMap,t(m.specularColorMap,p.specularColorMapTransform)),m.specularIntensityMap&&(p.specularIntensityMap.value=m.specularIntensityMap,t(m.specularIntensityMap,p.specularIntensityMapTransform))}function g(p,m){m.matcap&&(p.matcap.value=m.matcap)}function v(p,m){let x=e.get(m).light;p.referencePosition.value.setFromMatrixPosition(x.matrixWorld),p.nearDistance.value=x.shadow.camera.near,p.farDistance.value=x.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function v_(n,e,t,i){let r={},s={},a=[],l=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function o(x,b){let M=b.program;i.uniformBlockBinding(x,M)}function c(x,b){let M=r[x.id];M===void 0&&(g(x),M=h(x),r[x.id]=M,x.addEventListener("dispose",p));let A=b.program;i.updateUBOMapping(x,A);let E=e.render.frame;s[x.id]!==E&&(u(x),s[x.id]=E)}function h(x){let b=d();x.__bindingPointIndex=b;let M=n.createBuffer(),A=x.__size,E=x.usage;return n.bindBuffer(n.UNIFORM_BUFFER,M),n.bufferData(n.UNIFORM_BUFFER,A,E),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,b,M),M}function d(){for(let x=0;x<l;x++)if(a.indexOf(x)===-1)return a.push(x),x;return Re("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function u(x){let b=r[x.id],M=x.uniforms,A=x.__cache;n.bindBuffer(n.UNIFORM_BUFFER,b);for(let E=0,I=M.length;E<I;E++){let y=Array.isArray(M[E])?M[E]:[M[E]];for(let w=0,F=y.length;w<F;w++){let R=y[w];if(f(R,E,w,A)===!0){let O=R.__offset,G=Array.isArray(R.value)?R.value:[R.value],X=0;for(let N=0;N<G.length;N++){let z=G[N],V=v(z);typeof z=="number"||typeof z=="boolean"?(R.__data[0]=z,n.bufferSubData(n.UNIFORM_BUFFER,O+X,R.__data)):z.isMatrix3?(R.__data[0]=z.elements[0],R.__data[1]=z.elements[1],R.__data[2]=z.elements[2],R.__data[3]=0,R.__data[4]=z.elements[3],R.__data[5]=z.elements[4],R.__data[6]=z.elements[5],R.__data[7]=0,R.__data[8]=z.elements[6],R.__data[9]=z.elements[7],R.__data[10]=z.elements[8],R.__data[11]=0):ArrayBuffer.isView(z)?R.__data.set(new z.constructor(z.buffer,z.byteOffset,R.__data.length)):(z.toArray(R.__data,X),X+=V.storage/Float32Array.BYTES_PER_ELEMENT)}n.bufferSubData(n.UNIFORM_BUFFER,O,R.__data)}}}n.bindBuffer(n.UNIFORM_BUFFER,null)}function f(x,b,M,A){let E=x.value,I=b+"_"+M;if(A[I]===void 0)return typeof E=="number"||typeof E=="boolean"?A[I]=E:ArrayBuffer.isView(E)?A[I]=E.slice():A[I]=E.clone(),!0;{let y=A[I];if(typeof E=="number"||typeof E=="boolean"){if(y!==E)return A[I]=E,!0}else{if(ArrayBuffer.isView(E))return!0;if(y.equals(E)===!1)return y.copy(E),!0}}return!1}function g(x){let b=x.uniforms,M=0,A=16;for(let I=0,y=b.length;I<y;I++){let w=Array.isArray(b[I])?b[I]:[b[I]];for(let F=0,R=w.length;F<R;F++){let O=w[F],G=Array.isArray(O.value)?O.value:[O.value];for(let X=0,N=G.length;X<N;X++){let z=G[X],V=v(z),j=M%A,Q=j%V.boundary,ce=j+Q;M+=Q,ce!==0&&A-ce<V.storage&&(M+=A-ce),O.__data=new Float32Array(V.storage/Float32Array.BYTES_PER_ELEMENT),O.__offset=M,M+=V.storage}}}let E=M%A;return E>0&&(M+=A-E),x.__size=M,x.__cache={},this}function v(x){let b={boundary:0,storage:0};return typeof x=="number"||typeof x=="boolean"?(b.boundary=4,b.storage=4):x.isVector2?(b.boundary=8,b.storage=8):x.isVector3||x.isColor?(b.boundary=16,b.storage=12):x.isVector4?(b.boundary=16,b.storage=16):x.isMatrix3?(b.boundary=48,b.storage=48):x.isMatrix4?(b.boundary=64,b.storage=64):x.isTexture?Ce("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(x)?(b.boundary=16,b.storage=x.byteLength):Ce("WebGLRenderer: Unsupported uniform value type.",x),b}function p(x){let b=x.target;b.removeEventListener("dispose",p);let M=a.indexOf(b.__bindingPointIndex);a.splice(M,1),n.deleteBuffer(r[b.id]),delete r[b.id],delete s[b.id]}function m(){for(let x in r)n.deleteBuffer(r[x]);a=[],r={},s={}}return{bind:o,update:c,dispose:m}}var S_=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),Pn=null;function b_(){return Pn===null&&(Pn=new Aa(S_,16,16,_i,In),Pn.name="DFG_LUT",Pn.minFilter=Se,Pn.magFilter=Se,Pn.wrapS=Jt,Pn.wrapT=Jt,Pn.generateMipmaps=!1,Pn.needsUpdate=!0),Pn}var Ms=class{constructor(e={}){let{canvas:t=uu(),context:i=null,depth:r=!0,stencil:s=!1,alpha:a=!1,antialias:l=!1,premultipliedAlpha:o=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:d=!1,reversedDepthBuffer:u=!1,outputBufferType:f=rn}=e;this.isWebGLRenderer=!0;let g;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");g=i.getContextAttributes().alpha}else g=a;let v=f,p=new Set([ro,io,no]),m=new Set([rn,mn,Tr,Er,eo,to]),x=new Uint32Array(4),b=new Int32Array(4),M=new C,A=null,E=null,I=[],y=[],w=null;this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=fn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let F=this,R=!1,O=null;this._outputColorSpace=He;let G=0,X=0,N=null,z=-1,V=null,j=new vt,Q=new vt,ce=null,be=new Ze(0),we=0,Ye=t.width,je=t.height,Oe=1,Z=null,de=null,ie=new vt(0,0,Ye,je),Ie=new vt(0,0,Ye,je),Fe=!1,Pe=new Zr,ft=!1,We=!1,Qe=new dt,lt=new C,Ve=new vt,At={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},pt=!1;function Yt(){return N===null?Oe:1}let D=i;function Ct(S,L){return t.getContext(S,L)}try{let S={alpha:!0,depth:r,stencil:s,antialias:l,premultipliedAlpha:o,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:d};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"184"}`),t.addEventListener("webglcontextlost",K,!1),t.addEventListener("webglcontextrestored",Te,!1),t.addEventListener("webglcontextcreationerror",Ne,!1),D===null){let L="webgl2";if(D=Ct(L,S),D===null)throw Ct(L)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(S){throw Re("WebGLRenderer: "+S.message),S}let Xe,st,oe,xt,T,_,U,Y,J,ee,ae,W,$,fe,xe,re,te,De,ke,Ke,P,ne,q;function pe(){Xe=new Rg(D),Xe.init(),P=new m_(D,Xe),st=new Sg(D,Xe,e,P),oe=new f_(D,Xe),st.reversedDepthBuffer&&u&&oe.buffers.depth.setReversed(!0),xt=new Dg(D),T=new Q0,_=new p_(D,Xe,oe,T,st,P,xt),U=new Cg(F),Y=new Uf(D),ne=new yg(D,Y),J=new Ig(D,Y,xt,ne),ee=new Fg(D,J,Y,ne,xt),De=new Lg(D,st,_),xe=new bg(T),ae=new j0(F,U,Xe,st,ne,xe),W=new y_(F,T),$=new t_,fe=new o_(Xe),te=new xg(F,U,oe,ee,g,o),re=new d_(F,ee,st),q=new v_(D,xt,st,oe),ke=new vg(D,Xe,xt),Ke=new Pg(D,Xe,xt),xt.programs=ae.programs,F.capabilities=st,F.extensions=Xe,F.properties=T,F.renderLists=$,F.shadowMap=re,F.state=oe,F.info=xt}pe(),v!==rn&&(w=new Ug(v,t.width,t.height,r,s));let se=new Ac(F,D);this.xr=se,this.getContext=function(){return D},this.getContextAttributes=function(){return D.getContextAttributes()},this.forceContextLoss=function(){let S=Xe.get("WEBGL_lose_context");S&&S.loseContext()},this.forceContextRestore=function(){let S=Xe.get("WEBGL_lose_context");S&&S.restoreContext()},this.getPixelRatio=function(){return Oe},this.setPixelRatio=function(S){S!==void 0&&(Oe=S,this.setSize(Ye,je,!1))},this.getSize=function(S){return S.set(Ye,je)},this.setSize=function(S,L,H=!0){if(se.isPresenting){Ce("WebGLRenderer: Can't change size while VR device is presenting.");return}Ye=S,je=L,t.width=Math.floor(S*Oe),t.height=Math.floor(L*Oe),H===!0&&(t.style.width=S+"px",t.style.height=L+"px"),w!==null&&w.setSize(t.width,t.height),this.setViewport(0,0,S,L)},this.getDrawingBufferSize=function(S){return S.set(Ye*Oe,je*Oe).floor()},this.setDrawingBufferSize=function(S,L,H){Ye=S,je=L,Oe=H,t.width=Math.floor(S*H),t.height=Math.floor(L*H),this.setViewport(0,0,S,L)},this.setEffects=function(S){if(v===rn){Re("THREE.WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(S){for(let L=0;L<S.length;L++)if(S[L].isOutputPass===!0){Ce("THREE.WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}w.setEffects(S||[])},this.getCurrentViewport=function(S){return S.copy(j)},this.getViewport=function(S){return S.copy(ie)},this.setViewport=function(S,L,H,k){S.isVector4?ie.set(S.x,S.y,S.z,S.w):ie.set(S,L,H,k),oe.viewport(j.copy(ie).multiplyScalar(Oe).round())},this.getScissor=function(S){return S.copy(Ie)},this.setScissor=function(S,L,H,k){S.isVector4?Ie.set(S.x,S.y,S.z,S.w):Ie.set(S,L,H,k),oe.scissor(Q.copy(Ie).multiplyScalar(Oe).round())},this.getScissorTest=function(){return Fe},this.setScissorTest=function(S){oe.setScissorTest(Fe=S)},this.setOpaqueSort=function(S){Z=S},this.setTransparentSort=function(S){de=S},this.getClearColor=function(S){return S.copy(te.getClearColor())},this.setClearColor=function(){te.setClearColor(...arguments)},this.getClearAlpha=function(){return te.getClearAlpha()},this.setClearAlpha=function(){te.setClearAlpha(...arguments)},this.clear=function(S=!0,L=!0,H=!0){let k=0;if(S){let B=!1;if(N!==null){let ue=N.texture.format;B=p.has(ue)}if(B){let ue=N.texture.type,ye=m.has(ue),he=te.getClearColor(),Me=te.getClearAlpha(),Ee=he.r,Ue=he.g,ze=he.b;ye?(x[0]=Ee,x[1]=Ue,x[2]=ze,x[3]=Me,D.clearBufferuiv(D.COLOR,0,x)):(b[0]=Ee,b[1]=Ue,b[2]=ze,b[3]=Me,D.clearBufferiv(D.COLOR,0,b))}else k|=D.COLOR_BUFFER_BIT}L&&(k|=D.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),H&&(k|=D.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),k!==0&&D.clear(k)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(S){S.setRenderer(this),O=S},this.dispose=function(){t.removeEventListener("webglcontextlost",K,!1),t.removeEventListener("webglcontextrestored",Te,!1),t.removeEventListener("webglcontextcreationerror",Ne,!1),te.dispose(),$.dispose(),fe.dispose(),T.dispose(),U.dispose(),ee.dispose(),ne.dispose(),q.dispose(),ae.dispose(),se.dispose(),se.removeEventListener("sessionstart",qc),se.removeEventListener("sessionend",Yc),Ti.stop()};function K(S){S.preventDefault(),Wr("WebGLRenderer: Context Lost."),R=!0}function Te(){Wr("WebGLRenderer: Context Restored."),R=!1;let S=xt.autoReset,L=re.enabled,H=re.autoUpdate,k=re.needsUpdate,B=re.type;pe(),xt.autoReset=S,re.enabled=L,re.autoUpdate=H,re.needsUpdate=k,re.type=B}function Ne(S){Re("WebGLRenderer: A WebGL context could not be created. Reason: ",S.statusMessage)}function St(S){let L=S.target;L.removeEventListener("dispose",St),et(L)}function et(S){Fn(S),T.remove(S)}function Fn(S){let L=T.get(S).programs;L!==void 0&&(L.forEach(function(H){ae.releaseProgram(H)}),S.isShaderMaterial&&ae.releaseShaderCache(S))}this.renderBufferDirect=function(S,L,H,k,B,ue){L===null&&(L=At);let ye=B.isMesh&&B.matrixWorld.determinant()<0,he=Td(S,L,H,k,B);oe.setMaterial(k,ye);let Me=H.index,Ee=1;if(k.wireframe===!0){if(Me=J.getWireframeAttribute(H),Me===void 0)return;Ee=2}let Ue=H.drawRange,ze=H.attributes.position,Ae=Ue.start*Ee,tt=(Ue.start+Ue.count)*Ee;ue!==null&&(Ae=Math.max(Ae,ue.start*Ee),tt=Math.min(tt,(ue.start+ue.count)*Ee)),Me!==null?(Ae=Math.max(Ae,0),tt=Math.min(tt,Me.count)):ze!=null&&(Ae=Math.max(Ae,0),tt=Math.min(tt,ze.count));let bt=tt-Ae;if(bt<0||bt===1/0)return;ne.setup(B,k,he,H,Me);let yt,it=ke;if(Me!==null&&(yt=Y.get(Me),it=Ke,it.setIndex(yt)),B.isMesh)k.wireframe===!0?(oe.setLineWidth(k.wireframeLinewidth*Yt()),it.setMode(D.LINES)):it.setMode(D.TRIANGLES);else if(B.isLine){let Nt=k.linewidth;Nt===void 0&&(Nt=1),oe.setLineWidth(Nt*Yt()),B.isLineSegments?it.setMode(D.LINES):B.isLineLoop?it.setMode(D.LINE_LOOP):it.setMode(D.LINE_STRIP)}else B.isPoints?it.setMode(D.POINTS):B.isSprite&&it.setMode(D.TRIANGLES);if(B.isBatchedMesh)if(Xe.get("WEBGL_multi_draw"))it.renderMultiDraw(B._multiDrawStarts,B._multiDrawCounts,B._multiDrawCount);else{let Nt=B._multiDrawStarts,ge=B._multiDrawCounts,$t=B._multiDrawCount,$e=Me?Y.get(Me).bytesPerElement:1,sn=T.get(k).currentProgram.getUniforms();for(let vn=0;vn<$t;vn++)sn.setValue(D,"_gl_DrawID",vn),it.render(Nt[vn]/$e,ge[vn])}else if(B.isInstancedMesh)it.renderInstances(Ae,bt,B.count);else if(H.isInstancedBufferGeometry){let Nt=H._maxInstanceCount!==void 0?H._maxInstanceCount:1/0,ge=Math.min(H.instanceCount,Nt);it.renderInstances(Ae,bt,ge)}else it.render(Ae,bt)};function yn(S,L,H){S.transparent===!0&&S.side===Bt&&S.forceSinglePass===!1?(S.side=Vt,S.needsUpdate=!0,Ds(S,L,H),S.side=Gn,S.needsUpdate=!0,Ds(S,L,H),S.side=Bt):Ds(S,L,H)}this.compile=function(S,L,H=null){H===null&&(H=S),E=fe.get(H),E.init(L),y.push(E),H.traverseVisible(function(B){B.isLight&&B.layers.test(L.layers)&&(E.pushLight(B),B.castShadow&&E.pushShadow(B))}),S!==H&&S.traverseVisible(function(B){B.isLight&&B.layers.test(L.layers)&&(E.pushLight(B),B.castShadow&&E.pushShadow(B))}),E.setupLights();let k=new Set;return S.traverse(function(B){if(!(B.isMesh||B.isPoints||B.isLine||B.isSprite))return;let ue=B.material;if(ue)if(Array.isArray(ue))for(let ye=0;ye<ue.length;ye++){let he=ue[ye];yn(he,H,B),k.add(he)}else yn(ue,H,B),k.add(ue)}),E=y.pop(),k},this.compileAsync=function(S,L,H=null){let k=this.compile(S,L,H);return new Promise(B=>{function ue(){if(k.forEach(function(ye){T.get(ye).currentProgram.isReady()&&k.delete(ye)}),k.size===0){B(S);return}setTimeout(ue,10)}Xe.get("KHR_parallel_shader_compile")!==null?ue():setTimeout(ue,10)})};let jo=null;function bd(S){jo&&jo(S)}function qc(){Ti.stop()}function Yc(){Ti.start()}let Ti=new Xu;Ti.setAnimationLoop(bd),typeof self<"u"&&Ti.setContext(self),this.setAnimationLoop=function(S){jo=S,se.setAnimationLoop(S),S===null?Ti.stop():Ti.start()},se.addEventListener("sessionstart",qc),se.addEventListener("sessionend",Yc),this.render=function(S,L){if(L!==void 0&&L.isCamera!==!0){Re("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(R===!0)return;O!==null&&O.renderStart(S,L);let H=se.enabled===!0&&se.isPresenting===!0,k=w!==null&&(N===null||H)&&w.begin(F,N);if(S.matrixWorldAutoUpdate===!0&&S.updateMatrixWorld(),L.parent===null&&L.matrixWorldAutoUpdate===!0&&L.updateMatrixWorld(),se.enabled===!0&&se.isPresenting===!0&&(w===null||w.isCompositing()===!1)&&(se.cameraAutoUpdate===!0&&se.updateCamera(L),L=se.getCamera()),S.isScene===!0&&S.onBeforeRender(F,S,L,N),E=fe.get(S,y.length),E.init(L),E.state.textureUnits=_.getTextureUnits(),y.push(E),Qe.multiplyMatrices(L.projectionMatrix,L.matrixWorldInverse),Pe.setFromProjectionMatrix(Qe,un,L.reversedDepth),We=this.localClippingEnabled,ft=xe.init(this.clippingPlanes,We),A=$.get(S,I.length),A.init(),I.push(A),se.enabled===!0&&se.isPresenting===!0){let ye=F.xr.getDepthSensingMesh();ye!==null&&Qo(ye,L,-1/0,F.sortObjects)}Qo(S,L,0,F.sortObjects),A.finish(),F.sortObjects===!0&&A.sort(Z,de),pt=se.enabled===!1||se.isPresenting===!1||se.hasDepthSensing()===!1,pt&&te.addToRenderList(A,S),this.info.render.frame++,ft===!0&&xe.beginShadows();let B=E.state.shadowsArray;if(re.render(B,S,L),ft===!0&&xe.endShadows(),this.info.autoReset===!0&&this.info.reset(),(k&&w.hasRenderPass())===!1){let ye=A.opaque,he=A.transmissive;if(E.setupLights(),L.isArrayCamera){let Me=L.cameras;if(he.length>0)for(let Ee=0,Ue=Me.length;Ee<Ue;Ee++){let ze=Me[Ee];Zc(ye,he,S,ze)}pt&&te.render(S);for(let Ee=0,Ue=Me.length;Ee<Ue;Ee++){let ze=Me[Ee];$c(A,S,ze,ze.viewport)}}else he.length>0&&Zc(ye,he,S,L),pt&&te.render(S),$c(A,S,L)}N!==null&&X===0&&(_.updateMultisampleRenderTarget(N),_.updateRenderTargetMipmap(N)),k&&w.end(F),S.isScene===!0&&S.onAfterRender(F,S,L),ne.resetDefaultState(),z=-1,V=null,y.pop(),y.length>0?(E=y[y.length-1],_.setTextureUnits(E.state.textureUnits),ft===!0&&xe.setGlobalState(F.clippingPlanes,E.state.camera)):E=null,I.pop(),I.length>0?A=I[I.length-1]:A=null,O!==null&&O.renderEnd()};function Qo(S,L,H,k){if(S.visible===!1)return;if(S.layers.test(L.layers)){if(S.isGroup)H=S.renderOrder;else if(S.isLOD)S.autoUpdate===!0&&S.update(L);else if(S.isLightProbeGrid)E.pushLightProbeGrid(S);else if(S.isLight)E.pushLight(S),S.castShadow&&E.pushShadow(S);else if(S.isSprite){if(!S.frustumCulled||Pe.intersectsSprite(S)){k&&Ve.setFromMatrixPosition(S.matrixWorld).applyMatrix4(Qe);let ye=ee.update(S),he=S.material;he.visible&&A.push(S,ye,he,H,Ve.z,null)}}else if((S.isMesh||S.isLine||S.isPoints)&&(!S.frustumCulled||Pe.intersectsObject(S))){let ye=ee.update(S),he=S.material;if(k&&(S.boundingSphere!==void 0?(S.boundingSphere===null&&S.computeBoundingSphere(),Ve.copy(S.boundingSphere.center)):(ye.boundingSphere===null&&ye.computeBoundingSphere(),Ve.copy(ye.boundingSphere.center)),Ve.applyMatrix4(S.matrixWorld).applyMatrix4(Qe)),Array.isArray(he)){let Me=ye.groups;for(let Ee=0,Ue=Me.length;Ee<Ue;Ee++){let ze=Me[Ee],Ae=he[ze.materialIndex];Ae&&Ae.visible&&A.push(S,ye,Ae,H,Ve.z,ze)}}else he.visible&&A.push(S,ye,he,H,Ve.z,null)}}let ue=S.children;for(let ye=0,he=ue.length;ye<he;ye++)Qo(ue[ye],L,H,k)}function $c(S,L,H,k){let{opaque:B,transmissive:ue,transparent:ye}=S;E.setupLightsView(H),ft===!0&&xe.setGlobalState(F.clippingPlanes,H),k&&oe.viewport(j.copy(k)),B.length>0&&Ps(B,L,H),ue.length>0&&Ps(ue,L,H),ye.length>0&&Ps(ye,L,H),oe.buffers.depth.setTest(!0),oe.buffers.depth.setMask(!0),oe.buffers.color.setMask(!0),oe.setPolygonOffset(!1)}function Zc(S,L,H,k){if((H.isScene===!0?H.overrideMaterial:null)!==null)return;if(E.state.transmissionRenderTarget[k.id]===void 0){let Ae=Xe.has("EXT_color_buffer_half_float")||Xe.has("EXT_color_buffer_float");E.state.transmissionRenderTarget[k.id]=new jt(1,1,{generateMipmaps:!0,type:Ae?In:rn,minFilter:pn,samples:Math.max(4,st.samples),stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:qe.workingColorSpace})}let ue=E.state.transmissionRenderTarget[k.id],ye=k.viewport||j;ue.setSize(ye.z*F.transmissionResolutionScale,ye.w*F.transmissionResolutionScale);let he=F.getRenderTarget(),Me=F.getActiveCubeFace(),Ee=F.getActiveMipmapLevel();F.setRenderTarget(ue),F.getClearColor(be),we=F.getClearAlpha(),we<1&&F.setClearColor(16777215,.5),F.clear(),pt&&te.render(H);let Ue=F.toneMapping;F.toneMapping=fn;let ze=k.viewport;if(k.viewport!==void 0&&(k.viewport=void 0),E.setupLightsView(k),ft===!0&&xe.setGlobalState(F.clippingPlanes,k),Ps(S,H,k),_.updateMultisampleRenderTarget(ue),_.updateRenderTargetMipmap(ue),Xe.has("WEBGL_multisampled_render_to_texture")===!1){let Ae=!1;for(let tt=0,bt=L.length;tt<bt;tt++){let yt=L[tt],{object:it,geometry:Nt,material:ge,group:$t}=yt;if(ge.side===Bt&&it.layers.test(k.layers)){let $e=ge.side;ge.side=Vt,ge.needsUpdate=!0,Kc(it,H,k,Nt,ge,$t),ge.side=$e,ge.needsUpdate=!0,Ae=!0}}Ae===!0&&(_.updateMultisampleRenderTarget(ue),_.updateRenderTargetMipmap(ue))}F.setRenderTarget(he,Me,Ee),F.setClearColor(be,we),ze!==void 0&&(k.viewport=ze),F.toneMapping=Ue}function Ps(S,L,H){let k=L.isScene===!0?L.overrideMaterial:null;for(let B=0,ue=S.length;B<ue;B++){let ye=S[B],{object:he,geometry:Me,group:Ee}=ye,Ue=ye.material;Ue.allowOverride===!0&&k!==null&&(Ue=k),he.layers.test(H.layers)&&Kc(he,L,H,Me,Ue,Ee)}}function Kc(S,L,H,k,B,ue){S.onBeforeRender(F,L,H,k,B,ue),S.modelViewMatrix.multiplyMatrices(H.matrixWorldInverse,S.matrixWorld),S.normalMatrix.getNormalMatrix(S.modelViewMatrix),B.onBeforeRender(F,L,H,k,S,ue),B.transparent===!0&&B.side===Bt&&B.forceSinglePass===!1?(B.side=Vt,B.needsUpdate=!0,F.renderBufferDirect(H,L,k,B,S,ue),B.side=Gn,B.needsUpdate=!0,F.renderBufferDirect(H,L,k,B,S,ue),B.side=Bt):F.renderBufferDirect(H,L,k,B,S,ue),S.onAfterRender(F,L,H,k,B,ue)}function Ds(S,L,H){L.isScene!==!0&&(L=At);let k=T.get(S),B=E.state.lights,ue=E.state.shadowsArray,ye=B.state.version,he=ae.getParameters(S,B.state,ue,L,H,E.state.lightProbeGridArray),Me=ae.getProgramCacheKey(he),Ee=k.programs;k.environment=S.isMeshStandardMaterial||S.isMeshLambertMaterial||S.isMeshPhongMaterial?L.environment:null,k.fog=L.fog;let Ue=S.isMeshStandardMaterial||S.isMeshLambertMaterial&&!S.envMap||S.isMeshPhongMaterial&&!S.envMap;k.envMap=U.get(S.envMap||k.environment,Ue),k.envMapRotation=k.environment!==null&&S.envMap===null?L.environmentRotation:S.envMapRotation,Ee===void 0&&(S.addEventListener("dispose",St),Ee=new Map,k.programs=Ee);let ze=Ee.get(Me);if(ze!==void 0){if(k.currentProgram===ze&&k.lightsStateVersion===ye)return jc(S,he),ze}else he.uniforms=ae.getUniforms(S),O!==null&&S.isNodeMaterial&&O.build(S,H,he),S.onBeforeCompile(he,F),ze=ae.acquireProgram(he,Me),Ee.set(Me,ze),k.uniforms=he.uniforms;let Ae=k.uniforms;return(!S.isShaderMaterial&&!S.isRawShaderMaterial||S.clipping===!0)&&(Ae.clippingPlanes=xe.uniform),jc(S,he),k.needsLights=wd(S),k.lightsStateVersion=ye,k.needsLights&&(Ae.ambientLightColor.value=B.state.ambient,Ae.lightProbe.value=B.state.probe,Ae.directionalLights.value=B.state.directional,Ae.directionalLightShadows.value=B.state.directionalShadow,Ae.spotLights.value=B.state.spot,Ae.spotLightShadows.value=B.state.spotShadow,Ae.rectAreaLights.value=B.state.rectArea,Ae.ltc_1.value=B.state.rectAreaLTC1,Ae.ltc_2.value=B.state.rectAreaLTC2,Ae.pointLights.value=B.state.point,Ae.pointLightShadows.value=B.state.pointShadow,Ae.hemisphereLights.value=B.state.hemi,Ae.directionalShadowMatrix.value=B.state.directionalShadowMatrix,Ae.spotLightMatrix.value=B.state.spotLightMatrix,Ae.spotLightMap.value=B.state.spotLightMap,Ae.pointShadowMatrix.value=B.state.pointShadowMatrix),k.lightProbeGrid=E.state.lightProbeGridArray.length>0,k.currentProgram=ze,k.uniformsList=null,ze}function Jc(S){if(S.uniformsList===null){let L=S.currentProgram.getUniforms();S.uniformsList=Ar.seqWithValue(L.seq,S.uniforms)}return S.uniformsList}function jc(S,L){let H=T.get(S);H.outputColorSpace=L.outputColorSpace,H.batching=L.batching,H.batchingColor=L.batchingColor,H.instancing=L.instancing,H.instancingColor=L.instancingColor,H.instancingMorph=L.instancingMorph,H.skinning=L.skinning,H.morphTargets=L.morphTargets,H.morphNormals=L.morphNormals,H.morphColors=L.morphColors,H.morphTargetsCount=L.morphTargetsCount,H.numClippingPlanes=L.numClippingPlanes,H.numIntersection=L.numClipIntersection,H.vertexAlphas=L.vertexAlphas,H.vertexTangents=L.vertexTangents,H.toneMapping=L.toneMapping}function Md(S,L){if(S.length===0)return null;if(S.length===1)return S[0].texture!==null?S[0]:null;M.setFromMatrixPosition(L.matrixWorld);for(let H=0,k=S.length;H<k;H++){let B=S[H];if(B.texture!==null&&B.boundingBox.containsPoint(M))return B}return null}function Td(S,L,H,k,B){L.isScene!==!0&&(L=At),_.resetTextureUnits();let ue=L.fog,ye=k.isMeshStandardMaterial||k.isMeshLambertMaterial||k.isMeshPhongMaterial?L.environment:null,he=N===null?F.outputColorSpace:N.isXRRenderTarget===!0?N.texture.colorSpace:qe.workingColorSpace,Me=k.isMeshStandardMaterial||k.isMeshLambertMaterial&&!k.envMap||k.isMeshPhongMaterial&&!k.envMap,Ee=U.get(k.envMap||ye,Me),Ue=k.vertexColors===!0&&!!H.attributes.color&&H.attributes.color.itemSize===4,ze=!!H.attributes.tangent&&(!!k.normalMap||k.anisotropy>0),Ae=!!H.morphAttributes.position,tt=!!H.morphAttributes.normal,bt=!!H.morphAttributes.color,yt=fn;k.toneMapped&&(N===null||N.isXRRenderTarget===!0)&&(yt=F.toneMapping);let it=H.morphAttributes.position||H.morphAttributes.normal||H.morphAttributes.color,Nt=it!==void 0?it.length:0,ge=T.get(k),$t=E.state.lights;if(ft===!0&&(We===!0||S!==V)){let at=S===V&&k.id===z;xe.setState(k,S,at)}let $e=!1;k.version===ge.__version?(ge.needsLights&&ge.lightsStateVersion!==$t.state.version||ge.outputColorSpace!==he||B.isBatchedMesh&&ge.batching===!1||!B.isBatchedMesh&&ge.batching===!0||B.isBatchedMesh&&ge.batchingColor===!0&&B.colorTexture===null||B.isBatchedMesh&&ge.batchingColor===!1&&B.colorTexture!==null||B.isInstancedMesh&&ge.instancing===!1||!B.isInstancedMesh&&ge.instancing===!0||B.isSkinnedMesh&&ge.skinning===!1||!B.isSkinnedMesh&&ge.skinning===!0||B.isInstancedMesh&&ge.instancingColor===!0&&B.instanceColor===null||B.isInstancedMesh&&ge.instancingColor===!1&&B.instanceColor!==null||B.isInstancedMesh&&ge.instancingMorph===!0&&B.morphTexture===null||B.isInstancedMesh&&ge.instancingMorph===!1&&B.morphTexture!==null||ge.envMap!==Ee||k.fog===!0&&ge.fog!==ue||ge.numClippingPlanes!==void 0&&(ge.numClippingPlanes!==xe.numPlanes||ge.numIntersection!==xe.numIntersection)||ge.vertexAlphas!==Ue||ge.vertexTangents!==ze||ge.morphTargets!==Ae||ge.morphNormals!==tt||ge.morphColors!==bt||ge.toneMapping!==yt||ge.morphTargetsCount!==Nt||!!ge.lightProbeGrid!=E.state.lightProbeGridArray.length>0)&&($e=!0):($e=!0,ge.__version=k.version);let sn=ge.currentProgram;$e===!0&&(sn=Ds(k,L,B),O&&k.isNodeMaterial&&O.onUpdateProgram(k,sn,ge));let vn=!1,jn=!1,zi=!1,rt=sn.getUniforms(),Mt=ge.uniforms;if(oe.useProgram(sn.program)&&(vn=!0,jn=!0,zi=!0),k.id!==z&&(z=k.id,jn=!0),ge.needsLights){let at=Md(E.state.lightProbeGridArray,B);ge.lightProbeGrid!==at&&(ge.lightProbeGrid=at,jn=!0)}if(vn||V!==S){oe.buffers.depth.getReversed()&&S.reversedDepth!==!0&&(S._reversedDepth=!0,S.updateProjectionMatrix()),rt.setValue(D,"projectionMatrix",S.projectionMatrix),rt.setValue(D,"viewMatrix",S.matrixWorldInverse);let ei=rt.map.cameraPosition;ei!==void 0&&ei.setValue(D,lt.setFromMatrixPosition(S.matrixWorld)),st.logarithmicDepthBuffer&&rt.setValue(D,"logDepthBufFC",2/(Math.log(S.far+1)/Math.LN2)),(k.isMeshPhongMaterial||k.isMeshToonMaterial||k.isMeshLambertMaterial||k.isMeshBasicMaterial||k.isMeshStandardMaterial||k.isShaderMaterial)&&rt.setValue(D,"isOrthographic",S.isOrthographicCamera===!0),V!==S&&(V=S,jn=!0,zi=!0)}if(ge.needsLights&&($t.state.directionalShadowMap.length>0&&rt.setValue(D,"directionalShadowMap",$t.state.directionalShadowMap,_),$t.state.spotShadowMap.length>0&&rt.setValue(D,"spotShadowMap",$t.state.spotShadowMap,_),$t.state.pointShadowMap.length>0&&rt.setValue(D,"pointShadowMap",$t.state.pointShadowMap,_)),B.isSkinnedMesh){rt.setOptional(D,B,"bindMatrix"),rt.setOptional(D,B,"bindMatrixInverse");let at=B.skeleton;at&&(at.boneTexture===null&&at.computeBoneTexture(),rt.setValue(D,"boneTexture",at.boneTexture,_))}B.isBatchedMesh&&(rt.setOptional(D,B,"batchingTexture"),rt.setValue(D,"batchingTexture",B._matricesTexture,_),rt.setOptional(D,B,"batchingIdTexture"),rt.setValue(D,"batchingIdTexture",B._indirectTexture,_),rt.setOptional(D,B,"batchingColorTexture"),B._colorsTexture!==null&&rt.setValue(D,"batchingColorTexture",B._colorsTexture,_));let Qn=H.morphAttributes;if((Qn.position!==void 0||Qn.normal!==void 0||Qn.color!==void 0)&&De.update(B,H,sn),(jn||ge.receiveShadow!==B.receiveShadow)&&(ge.receiveShadow=B.receiveShadow,rt.setValue(D,"receiveShadow",B.receiveShadow)),(k.isMeshStandardMaterial||k.isMeshLambertMaterial||k.isMeshPhongMaterial)&&k.envMap===null&&L.environment!==null&&(Mt.envMapIntensity.value=L.environmentIntensity),Mt.dfgLUT!==void 0&&(Mt.dfgLUT.value=b_()),jn){if(rt.setValue(D,"toneMappingExposure",F.toneMappingExposure),ge.needsLights&&Ed(Mt,zi),ue&&k.fog===!0&&W.refreshFogUniforms(Mt,ue),W.refreshMaterialUniforms(Mt,k,Oe,je,E.state.transmissionRenderTarget[S.id]),ge.needsLights&&ge.lightProbeGrid){let at=ge.lightProbeGrid;Mt.probesSH.value=at.texture,Mt.probesMin.value.copy(at.boundingBox.min),Mt.probesMax.value.copy(at.boundingBox.max),Mt.probesResolution.value.copy(at.resolution)}Ar.upload(D,Jc(ge),Mt,_)}if(k.isShaderMaterial&&k.uniformsNeedUpdate===!0&&(Ar.upload(D,Jc(ge),Mt,_),k.uniformsNeedUpdate=!1),k.isSpriteMaterial&&rt.setValue(D,"center",B.center),rt.setValue(D,"modelViewMatrix",B.modelViewMatrix),rt.setValue(D,"normalMatrix",B.normalMatrix),rt.setValue(D,"modelMatrix",B.matrixWorld),k.uniformsGroups!==void 0){let at=k.uniformsGroups;for(let ei=0,Hi=at.length;ei<Hi;ei++){let Qc=at[ei];q.update(Qc,sn),q.bind(Qc,sn)}}return sn}function Ed(S,L){S.ambientLightColor.needsUpdate=L,S.lightProbe.needsUpdate=L,S.directionalLights.needsUpdate=L,S.directionalLightShadows.needsUpdate=L,S.pointLights.needsUpdate=L,S.pointLightShadows.needsUpdate=L,S.spotLights.needsUpdate=L,S.spotLightShadows.needsUpdate=L,S.rectAreaLights.needsUpdate=L,S.hemisphereLights.needsUpdate=L}function wd(S){return S.isMeshLambertMaterial||S.isMeshToonMaterial||S.isMeshPhongMaterial||S.isMeshStandardMaterial||S.isShadowMaterial||S.isShaderMaterial&&S.lights===!0}this.getActiveCubeFace=function(){return G},this.getActiveMipmapLevel=function(){return X},this.getRenderTarget=function(){return N},this.setRenderTargetTextures=function(S,L,H){let k=T.get(S);k.__autoAllocateDepthBuffer=S.resolveDepthBuffer===!1,k.__autoAllocateDepthBuffer===!1&&(k.__useRenderToTexture=!1),T.get(S.texture).__webglTexture=L,T.get(S.depthTexture).__webglTexture=k.__autoAllocateDepthBuffer?void 0:H,k.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(S,L){let H=T.get(S);H.__webglFramebuffer=L,H.__useDefaultFramebuffer=L===void 0};let Ad=D.createFramebuffer();this.setRenderTarget=function(S,L=0,H=0){N=S,G=L,X=H;let k=null,B=!1,ue=!1;if(S){let he=T.get(S);if(he.__useDefaultFramebuffer!==void 0){oe.bindFramebuffer(D.FRAMEBUFFER,he.__webglFramebuffer),j.copy(S.viewport),Q.copy(S.scissor),ce=S.scissorTest,oe.viewport(j),oe.scissor(Q),oe.setScissorTest(ce),z=-1;return}else if(he.__webglFramebuffer===void 0)_.setupRenderTarget(S);else if(he.__hasExternalTextures)_.rebindTextures(S,T.get(S.texture).__webglTexture,T.get(S.depthTexture).__webglTexture);else if(S.depthBuffer){let Ue=S.depthTexture;if(he.__boundDepthTexture!==Ue){if(Ue!==null&&T.has(Ue)&&(S.width!==Ue.image.width||S.height!==Ue.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");_.setupDepthRenderbuffer(S)}}let Me=S.texture;(Me.isData3DTexture||Me.isDataArrayTexture||Me.isCompressedArrayTexture)&&(ue=!0);let Ee=T.get(S).__webglFramebuffer;S.isWebGLCubeRenderTarget?(Array.isArray(Ee[L])?k=Ee[L][H]:k=Ee[L],B=!0):S.samples>0&&_.useMultisampledRTT(S)===!1?k=T.get(S).__webglMultisampledFramebuffer:Array.isArray(Ee)?k=Ee[H]:k=Ee,j.copy(S.viewport),Q.copy(S.scissor),ce=S.scissorTest}else j.copy(ie).multiplyScalar(Oe).floor(),Q.copy(Ie).multiplyScalar(Oe).floor(),ce=Fe;if(H!==0&&(k=Ad),oe.bindFramebuffer(D.FRAMEBUFFER,k)&&oe.drawBuffers(S,k),oe.viewport(j),oe.scissor(Q),oe.setScissorTest(ce),B){let he=T.get(S.texture);D.framebufferTexture2D(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_CUBE_MAP_POSITIVE_X+L,he.__webglTexture,H)}else if(ue){let he=L;for(let Me=0;Me<S.textures.length;Me++){let Ee=T.get(S.textures[Me]);D.framebufferTextureLayer(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0+Me,Ee.__webglTexture,H,he)}}else if(S!==null&&H!==0){let he=T.get(S.texture);D.framebufferTexture2D(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,he.__webglTexture,H)}z=-1},this.readRenderTargetPixels=function(S,L,H,k,B,ue,ye,he=0){if(!(S&&S.isWebGLRenderTarget)){Re("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Me=T.get(S).__webglFramebuffer;if(S.isWebGLCubeRenderTarget&&ye!==void 0&&(Me=Me[ye]),Me){oe.bindFramebuffer(D.FRAMEBUFFER,Me);try{let Ee=S.textures[he],Ue=Ee.format,ze=Ee.type;if(S.textures.length>1&&D.readBuffer(D.COLOR_ATTACHMENT0+he),!st.textureFormatReadable(Ue)){Re("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!st.textureTypeReadable(ze)){Re("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}L>=0&&L<=S.width-k&&H>=0&&H<=S.height-B&&D.readPixels(L,H,k,B,P.convert(Ue),P.convert(ze),ue)}finally{let Ee=N!==null?T.get(N).__webglFramebuffer:null;oe.bindFramebuffer(D.FRAMEBUFFER,Ee)}}},this.readRenderTargetPixelsAsync=async function(S,L,H,k,B,ue,ye,he=0){if(!(S&&S.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Me=T.get(S).__webglFramebuffer;if(S.isWebGLCubeRenderTarget&&ye!==void 0&&(Me=Me[ye]),Me)if(L>=0&&L<=S.width-k&&H>=0&&H<=S.height-B){oe.bindFramebuffer(D.FRAMEBUFFER,Me);let Ee=S.textures[he],Ue=Ee.format,ze=Ee.type;if(S.textures.length>1&&D.readBuffer(D.COLOR_ATTACHMENT0+he),!st.textureFormatReadable(Ue))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!st.textureTypeReadable(ze))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let Ae=D.createBuffer();D.bindBuffer(D.PIXEL_PACK_BUFFER,Ae),D.bufferData(D.PIXEL_PACK_BUFFER,ue.byteLength,D.STREAM_READ),D.readPixels(L,H,k,B,P.convert(Ue),P.convert(ze),0);let tt=N!==null?T.get(N).__webglFramebuffer:null;oe.bindFramebuffer(D.FRAMEBUFFER,tt);let bt=D.fenceSync(D.SYNC_GPU_COMMANDS_COMPLETE,0);return D.flush(),await fu(D,bt,4),D.bindBuffer(D.PIXEL_PACK_BUFFER,Ae),D.getBufferSubData(D.PIXEL_PACK_BUFFER,0,ue),D.deleteBuffer(Ae),D.deleteSync(bt),ue}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(S,L=null,H=0){let k=Math.pow(2,-H),B=Math.floor(S.image.width*k),ue=Math.floor(S.image.height*k),ye=L!==null?L.x:0,he=L!==null?L.y:0;_.setTexture2D(S,0),D.copyTexSubImage2D(D.TEXTURE_2D,H,0,0,ye,he,B,ue),oe.unbindTexture()};let Cd=D.createFramebuffer(),Rd=D.createFramebuffer();this.copyTextureToTexture=function(S,L,H=null,k=null,B=0,ue=0){let ye,he,Me,Ee,Ue,ze,Ae,tt,bt,yt=S.isCompressedTexture?S.mipmaps[ue]:S.image;if(H!==null)ye=H.max.x-H.min.x,he=H.max.y-H.min.y,Me=H.isBox3?H.max.z-H.min.z:1,Ee=H.min.x,Ue=H.min.y,ze=H.isBox3?H.min.z:0;else{let Mt=Math.pow(2,-B);ye=Math.floor(yt.width*Mt),he=Math.floor(yt.height*Mt),S.isDataArrayTexture?Me=yt.depth:S.isData3DTexture?Me=Math.floor(yt.depth*Mt):Me=1,Ee=0,Ue=0,ze=0}k!==null?(Ae=k.x,tt=k.y,bt=k.z):(Ae=0,tt=0,bt=0);let it=P.convert(L.format),Nt=P.convert(L.type),ge;L.isData3DTexture?(_.setTexture3D(L,0),ge=D.TEXTURE_3D):L.isDataArrayTexture||L.isCompressedArrayTexture?(_.setTexture2DArray(L,0),ge=D.TEXTURE_2D_ARRAY):(_.setTexture2D(L,0),ge=D.TEXTURE_2D),oe.activeTexture(D.TEXTURE0),oe.pixelStorei(D.UNPACK_FLIP_Y_WEBGL,L.flipY),oe.pixelStorei(D.UNPACK_PREMULTIPLY_ALPHA_WEBGL,L.premultiplyAlpha),oe.pixelStorei(D.UNPACK_ALIGNMENT,L.unpackAlignment);let $t=oe.getParameter(D.UNPACK_ROW_LENGTH),$e=oe.getParameter(D.UNPACK_IMAGE_HEIGHT),sn=oe.getParameter(D.UNPACK_SKIP_PIXELS),vn=oe.getParameter(D.UNPACK_SKIP_ROWS),jn=oe.getParameter(D.UNPACK_SKIP_IMAGES);oe.pixelStorei(D.UNPACK_ROW_LENGTH,yt.width),oe.pixelStorei(D.UNPACK_IMAGE_HEIGHT,yt.height),oe.pixelStorei(D.UNPACK_SKIP_PIXELS,Ee),oe.pixelStorei(D.UNPACK_SKIP_ROWS,Ue),oe.pixelStorei(D.UNPACK_SKIP_IMAGES,ze);let zi=S.isDataArrayTexture||S.isData3DTexture,rt=L.isDataArrayTexture||L.isData3DTexture;if(S.isDepthTexture){let Mt=T.get(S),Qn=T.get(L),at=T.get(Mt.__renderTarget),ei=T.get(Qn.__renderTarget);oe.bindFramebuffer(D.READ_FRAMEBUFFER,at.__webglFramebuffer),oe.bindFramebuffer(D.DRAW_FRAMEBUFFER,ei.__webglFramebuffer);for(let Hi=0;Hi<Me;Hi++)zi&&(D.framebufferTextureLayer(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,T.get(S).__webglTexture,B,ze+Hi),D.framebufferTextureLayer(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,T.get(L).__webglTexture,ue,bt+Hi)),D.blitFramebuffer(Ee,Ue,ye,he,Ae,tt,ye,he,D.DEPTH_BUFFER_BIT,D.NEAREST);oe.bindFramebuffer(D.READ_FRAMEBUFFER,null),oe.bindFramebuffer(D.DRAW_FRAMEBUFFER,null)}else if(B!==0||S.isRenderTargetTexture||T.has(S)){let Mt=T.get(S),Qn=T.get(L);oe.bindFramebuffer(D.READ_FRAMEBUFFER,Cd),oe.bindFramebuffer(D.DRAW_FRAMEBUFFER,Rd);for(let at=0;at<Me;at++)zi?D.framebufferTextureLayer(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,Mt.__webglTexture,B,ze+at):D.framebufferTexture2D(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,Mt.__webglTexture,B),rt?D.framebufferTextureLayer(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,Qn.__webglTexture,ue,bt+at):D.framebufferTexture2D(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,Qn.__webglTexture,ue),B!==0?D.blitFramebuffer(Ee,Ue,ye,he,Ae,tt,ye,he,D.COLOR_BUFFER_BIT,D.NEAREST):rt?D.copyTexSubImage3D(ge,ue,Ae,tt,bt+at,Ee,Ue,ye,he):D.copyTexSubImage2D(ge,ue,Ae,tt,Ee,Ue,ye,he);oe.bindFramebuffer(D.READ_FRAMEBUFFER,null),oe.bindFramebuffer(D.DRAW_FRAMEBUFFER,null)}else rt?S.isDataTexture||S.isData3DTexture?D.texSubImage3D(ge,ue,Ae,tt,bt,ye,he,Me,it,Nt,yt.data):L.isCompressedArrayTexture?D.compressedTexSubImage3D(ge,ue,Ae,tt,bt,ye,he,Me,it,yt.data):D.texSubImage3D(ge,ue,Ae,tt,bt,ye,he,Me,it,Nt,yt):S.isDataTexture?D.texSubImage2D(D.TEXTURE_2D,ue,Ae,tt,ye,he,it,Nt,yt.data):S.isCompressedTexture?D.compressedTexSubImage2D(D.TEXTURE_2D,ue,Ae,tt,yt.width,yt.height,it,yt.data):D.texSubImage2D(D.TEXTURE_2D,ue,Ae,tt,ye,he,it,Nt,yt);oe.pixelStorei(D.UNPACK_ROW_LENGTH,$t),oe.pixelStorei(D.UNPACK_IMAGE_HEIGHT,$e),oe.pixelStorei(D.UNPACK_SKIP_PIXELS,sn),oe.pixelStorei(D.UNPACK_SKIP_ROWS,vn),oe.pixelStorei(D.UNPACK_SKIP_IMAGES,jn),ue===0&&L.generateMipmaps&&D.generateMipmap(ge),oe.unbindTexture()},this.initRenderTarget=function(S){T.get(S).__webglFramebuffer===void 0&&_.setupRenderTarget(S)},this.initTexture=function(S){S.isCubeTexture?_.setTextureCube(S,0):S.isData3DTexture?_.setTexture3D(S,0):S.isDataArrayTexture||S.isCompressedArrayTexture?_.setTexture2DArray(S,0):_.setTexture2D(S,0),oe.unbindTexture()},this.resetState=function(){G=0,X=0,N=null,oe.reset(),ne.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return un}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=qe._getDrawingBufferColorSpace(e),t.unpackColorSpace=qe._getUnpackColorSpace()}};var yi=16,vi=9,Ic=new WeakMap,Bi=new WeakMap,me=new Map;function ve(n,e=0){let t=Number(n);return Number.isFinite(t)?t:e}function _t(n,e,t){return Math.max(e,Math.min(t,n))}function Cs(n){return(ve(n,.5)-.5)*yi}function Rs(n){return(.5-ve(n,.5))*vi}function Cc(n={},e=-1.65){return new C(Cs(n.x),Rs(n.y),e)}function cd(n={},e=0){return-1+(1-ve(n.y,.5))*.6+ve(n.z,0)*.025+e}function ws(n=""){switch(String(n)){case"builder":return{fill:"#c97a3d",stroke:"#5a2f16",cue:"#ffe4a0",mark:"B",face:"#ffe5bd",accent:"#ffd34f",trim:"#7f3f1c"};case"worker":return{fill:"#5f8d8e",stroke:"#173f41",cue:"#d6f1ef",mark:"W",face:"#ffe0b4",accent:"#9fd3c8",trim:"#31585b"};case"hauler":return{fill:"#d7ae50",stroke:"#654716",cue:"#fff0bd",mark:"H",face:"#f5d29b",accent:"#8bb36d",trim:"#8a5d1f"};case"messenger":return{fill:"#c85c75",stroke:"#5a1c2b",cue:"#ffd5de",mark:"!",face:"#ffe1be",accent:"#78a9d6",trim:"#7e2c3c"};default:return{fill:"#7f9b66",stroke:"#254526",cue:"#daf0cf",mark:"C",face:"#ffe8c4",accent:"#a7c884",trim:"#446235"}}}function Xo(n=""){let e=String(n||""),t=0;for(let i=0;i<e.length;i+=1)t=(t<<5)-t+e.charCodeAt(i)|0;return Math.abs(t%628)/100}function T_(n,e,t,i="busy"){n.fillStyle="#2e1b0e",n.beginPath(),n.ellipse(e-17,t,5,7,0,0,Math.PI*2),n.ellipse(e+17,t,5,7,0,0,Math.PI*2),n.fill(),n.fillStyle="#fff8e8",n.beginPath(),n.arc(e-19,t-3,2,0,Math.PI*2),n.arc(e+15,t-3,2,0,Math.PI*2),n.fill(),n.strokeStyle="#2e1b0e",n.lineWidth=4,n.lineCap="round",n.beginPath(),i==="alert"?(n.moveTo(e-26,t-15),n.lineTo(e-12,t-19),n.moveTo(e+12,t-19),n.lineTo(e+27,t-14)):(n.moveTo(e-26,t-15),n.lineTo(e-12,t-13),n.moveTo(e+12,t-13),n.lineTo(e+27,t-15)),n.stroke(),n.beginPath(),i==="happy"?n.arc(e,t+13,14,.1,Math.PI-.1):(n.moveTo(e-8,t+15),n.quadraticCurveTo(e,t+20,e+10,t+14)),n.stroke()}function ju(n,e,t,i){n.fillStyle="#ffe0b4",n.strokeStyle=i,n.lineWidth=4,n.beginPath(),n.arc(e,t,10,0,Math.PI*2),n.fill(),n.stroke()}function E_(n="worker"){let e=`character:${n}:v1`;if(me.has(e))return me.get(e);let t=ws(n),i=document.createElement("canvas");i.width=224,i.height=256;let r=i.getContext("2d");r.clearRect(0,0,i.width,i.height),r.fillStyle="rgba(46, 27, 14, 0.22)",r.beginPath(),r.ellipse(112,222,62,17,0,0,Math.PI*2),r.fill(),n==="hauler"&&(r.fillStyle="#8bb36d",r.strokeStyle=t.stroke,r.lineWidth=7,r.beginPath(),r.roundRect(132,88,48,84,19),r.fill(),r.stroke(),r.fillStyle="#6d8c55",r.fillRect(141,102,29,12)),r.strokeStyle=t.stroke,r.lineWidth=10,r.lineCap="round",r.beginPath(),n==="messenger"?(r.moveTo(151,126),r.lineTo(181,84)):n==="builder"?(r.moveTo(151,128),r.lineTo(180,96)):(r.moveTo(151,130),r.lineTo(174,147)),r.stroke(),ju(r,n==="messenger"?181:n==="builder"?180:174,n==="messenger"?84:n==="builder"?96:147,t.stroke),n==="builder"?(r.strokeStyle=t.stroke,r.lineWidth=7,r.beginPath(),r.moveTo(170,98),r.lineTo(193,75),r.moveTo(183,71),r.lineTo(204,92),r.stroke()):n==="worker"?(r.strokeStyle=t.stroke,r.lineWidth=6,r.beginPath(),r.moveTo(165,142),r.lineTo(190,126),r.moveTo(184,122),r.lineTo(198,137),r.stroke()):n==="messenger"&&(r.fillStyle=t.accent,r.strokeStyle=t.stroke,r.lineWidth=5,r.beginPath(),r.moveTo(182,72),r.lineTo(205,84),r.lineTo(182,97),r.closePath(),r.fill(),r.stroke()),r.strokeStyle=t.stroke,r.lineWidth=10,r.beginPath(),r.moveTo(73,128),r.lineTo(n==="hauler"?50:44,n==="hauler"?146:116),r.stroke(),ju(r,n==="hauler"?50:44,n==="hauler"?146:116,t.stroke),r.fillStyle=t.fill,r.strokeStyle=t.stroke,r.lineWidth=10,r.beginPath(),r.roundRect(62,94,100,96,34),r.fill(),r.stroke(),n==="worker"?(r.fillStyle="#fff8e8",r.strokeStyle=t.stroke,r.lineWidth=5,r.beginPath(),r.roundRect(84,116,56,57,13),r.fill(),r.stroke(),r.strokeStyle=t.trim,r.lineWidth=4,r.beginPath(),r.moveTo(94,133),r.lineTo(130,133),r.moveTo(94,149),r.lineTo(122,149),r.stroke()):n==="hauler"?(r.strokeStyle=t.trim,r.lineWidth=7,r.beginPath(),r.moveTo(78,107),r.lineTo(146,178),r.moveTo(146,107),r.lineTo(78,178),r.stroke(),r.fillStyle="#c4883a",r.strokeStyle=t.stroke,r.lineWidth=6,r.beginPath(),r.roundRect(82,134,60,40,10),r.fill(),r.stroke()):n==="messenger"&&(r.fillStyle="#6b4631",r.strokeStyle=t.stroke,r.lineWidth=5,r.beginPath(),r.roundRect(118,142,42,38,9),r.fill(),r.stroke(),r.strokeStyle="#fff0bd",r.lineWidth=5,r.beginPath(),r.moveTo(79,110),r.lineTo(145,172),r.stroke()),r.strokeStyle=t.stroke,r.lineWidth=11,r.beginPath(),r.moveTo(91,184),r.lineTo(82,213),r.moveTo(132,184),r.lineTo(143,213),r.stroke(),r.fillStyle=t.trim,r.strokeStyle=t.stroke,r.lineWidth=5,r.beginPath(),r.roundRect(61,207,38,17,8),r.roundRect(128,207,38,17,8),r.fill(),r.stroke(),r.fillStyle=t.face,r.strokeStyle=t.stroke,r.lineWidth=8,r.beginPath(),r.arc(112,76,45,0,Math.PI*2),r.fill(),r.stroke(),n==="builder"?(r.fillStyle=t.accent,r.strokeStyle=t.stroke,r.lineWidth=7,r.beginPath(),r.arc(112,70,48,Math.PI,Math.PI*2),r.lineTo(160,75),r.lineTo(64,75),r.closePath(),r.fill(),r.stroke(),r.strokeStyle="#f4a92f",r.lineWidth=5,r.beginPath(),r.moveTo(112,27),r.lineTo(112,73),r.moveTo(91,38),r.lineTo(91,73),r.moveTo(133,38),r.lineTo(133,73),r.stroke()):(r.fillStyle=t.trim,r.beginPath(),r.arc(112,45,34,Math.PI,Math.PI*2),r.lineTo(146,63),r.quadraticCurveTo(112,53,78,63),r.closePath(),r.fill(),n==="messenger"&&(r.fillStyle=t.accent,r.beginPath(),r.arc(144,56,12,0,Math.PI*2),r.fill())),r.fillStyle="rgba(200, 92, 117, 0.28)",r.beginPath(),r.arc(82,88,7,0,Math.PI*2),r.arc(142,88,7,0,Math.PI*2),r.fill(),T_(r,112,82,n==="messenger"?"alert":n==="hauler"?"happy":"busy");let s=new ut(i);return s.colorSpace=He,s.minFilter=Se,s.magFilter=Se,me.set(e,s),s}function hd(n="",e="neutral"){let t=`text:${e}:${n}`;if(me.has(t))return me.get(t);let i=document.createElement("canvas");i.width=384,i.height=96;let r=i.getContext("2d"),s=e==="ready"?"#ffe4a0":e==="selected"?"#d6f1ef":"#fff8e8";r.clearRect(0,0,i.width,i.height),r.fillStyle=s,r.strokeStyle="rgba(46, 27, 14, 0.25)",r.lineWidth=6,r.beginPath(),r.roundRect(10,12,i.width-20,i.height-24,22),r.fill(),r.stroke(),r.fillStyle="#2e1b0e",r.font='700 30px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',r.textAlign="center",r.textBaseline="middle";let a=String(n||"").length>20?`${String(n).slice(0,17)}...`:String(n||"");r.fillText(a,i.width/2,i.height/2+2,i.width-44);let l=new ut(i);return l.colorSpace=He,l.minFilter=Se,l.magFilter=Se,me.set(t,l),l}function ud(n,e,t,i,r){n.beginPath();for(let s=0;s<10;s+=1){let a=s%2===0?i:r,l=-Math.PI/2+s*Math.PI/5,o=e+Math.cos(l)*a,c=t+Math.sin(l)*a;s===0?n.moveTo(o,c):n.lineTo(o,c)}n.closePath()}function w_(n="worker",e={}){let t=String(e.accessory||"tools"),i=String(e.actionKind||""),r=`cue:${n}:${t}:${i}`;if(me.has(r))return me.get(r);let s=ws(n),a=document.createElement("canvas");a.width=160,a.height=160;let l=a.getContext("2d");if(l.clearRect(0,0,a.width,a.height),l.fillStyle="rgba(46, 27, 14, 0.24)",l.beginPath(),l.ellipse(84,126,46,14,0,0,Math.PI*2),l.fill(),l.fillStyle=s.cue,l.strokeStyle=s.stroke,l.lineWidth=8,l.beginPath(),l.roundRect(31,20,98,98,28),l.fill(),l.stroke(),l.strokeStyle=s.stroke,l.fillStyle=s.fill,l.lineCap="round",l.lineJoin="round",l.lineWidth=10,t==="hammer")l.beginPath(),l.moveTo(58,88),l.lineTo(104,42),l.moveTo(85,37),l.lineTo(119,71),l.stroke();else if(t==="wrench")l.beginPath(),l.arc(62,50,18,.2,Math.PI*1.55),l.moveTo(73,65),l.lineTo(108,100),l.stroke();else if(t==="bundle")l.fillStyle="#c4883a",l.strokeStyle=s.stroke,l.lineWidth=7,l.beginPath(),l.roundRect(50,54,60,46,10),l.fill(),l.stroke(),l.beginPath(),l.moveTo(50,78),l.lineTo(110,78),l.moveTo(80,54),l.lineTo(80,100),l.stroke();else if(t==="coin"){l.fillStyle="#d7ae50";for(let c of[92,77,62])l.beginPath(),l.ellipse(80,c,30,10,0,0,Math.PI*2),l.fill(),l.stroke()}else t==="approval"?(l.font='900 46px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',l.textAlign="center",l.textBaseline="middle",l.fillText("OK",80,74)):t==="reward"?(l.fillStyle="#d7ae50",ud(l,80,74,34,15),l.fill(),l.stroke()):t==="quest"?(l.beginPath(),l.moveTo(80,38),l.lineTo(112,74),l.lineTo(80,110),l.lineTo(48,74),l.closePath(),l.fill(),l.stroke()):t==="clover"?(l.font='900 58px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',l.textAlign="center",l.textBaseline="middle",l.fillText("C",80,76)):t==="notice"?(l.font='900 70px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',l.textAlign="center",l.textBaseline="middle",l.fillText("!",80,74)):(l.beginPath(),l.arc(80,74,24,0,Math.PI*2),l.moveTo(48,74),l.lineTo(112,74),l.moveTo(80,42),l.lineTo(80,106),l.stroke());let o=new ut(a);return o.colorSpace=He,o.minFilter=Se,o.magFilter=Se,me.set(r,o),o}function A_(n="worker",e=0){let t=_t(ve(e,0),0,1),i=Math.round(t*100),r=`progress:${n}:${i}`;if(me.has(r))return me.get(r);let s=ws(n),a=document.createElement("canvas");a.width=256,a.height=64;let l=a.getContext("2d");l.clearRect(0,0,a.width,a.height),l.fillStyle="rgba(46, 27, 14, 0.40)",l.beginPath(),l.roundRect(18,18,220,28,14),l.fill(),l.fillStyle="#fff8e8",l.beginPath(),l.roundRect(24,23,208,18,9),l.fill(),l.fillStyle=s.fill,l.beginPath(),l.roundRect(24,23,Math.max(12,208*t),18,9),l.fill(),l.strokeStyle=s.stroke,l.lineWidth=5,l.beginPath(),l.roundRect(18,18,220,28,14),l.stroke();let o=new ut(a);return o.colorSpace=He,o.minFilter=Se,o.magFilter=Se,me.set(r,o),o}function C_(n={}){let e=String(n.cueType||"crossing_greeting"),t=Array.isArray(n.roles)?n.roles:[],i=`encounter:${e}:${t.join("+")}`;if(me.has(i))return me.get(i);let r=document.createElement("canvas");r.width=192,r.height=160;let s=r.getContext("2d");s.clearRect(0,0,r.width,r.height),s.fillStyle="rgba(46, 27, 14, 0.22)",s.beginPath(),s.ellipse(96,126,52,14,0,0,Math.PI*2),s.fill(),s.fillStyle=e==="handoff"?"#fff0bd":"#d6f1ef",s.strokeStyle="#3b2513",s.lineWidth=7,s.beginPath(),s.roundRect(36,22,120,84,28),s.fill(),s.stroke();let a=ws(t[0]||"worker"),l=ws(t[1]||"messenger");s.fillStyle=a.fill,s.strokeStyle=a.stroke,s.lineWidth=5,s.beginPath(),s.arc(78,64,20,0,Math.PI*2),s.fill(),s.stroke(),s.fillStyle=l.fill,s.strokeStyle=l.stroke,s.beginPath(),s.arc(116,64,20,0,Math.PI*2),s.fill(),s.stroke(),s.strokeStyle="#3b2513",s.lineWidth=6,s.lineCap="round",s.beginPath(),s.moveTo(91,82),s.lineTo(103,82),s.stroke(),s.fillStyle=e==="handoff"?"#c4883a":"#c85c75",ud(s,97,38,13,6),s.fill(),s.stroke();let o=new ut(r);return o.colorSpace=He,o.minFilter=Se,o.magFilter=Se,me.set(i,o),o}function qo(n){let e=n?.image||null;return!!e&&e.complete!==!1}function Qu(n,e,t){let i=String(n||"").trim();if(!i)return null;if(me.has(i)){let s=me.get(i);return typeof e=="function"&&(qo(s)?queueMicrotask(()=>e(s)):s.userData.pendingOnLoad=[...s.userData.pendingOnLoad||[],e]),typeof t=="function"&&!qo(s)&&(s.userData.pendingOnError=[...s.userData.pendingOnError||[],t]),s}let r=new cs().load(i,()=>{r.colorSpace=He,r.minFilter=pn,r.magFilter=Se;let s=r.userData.pendingOnLoad||[];r.userData.pendingOnLoad=[],r.userData.pendingOnError=[];for(let a of s)a(r)},void 0,()=>{let s=r.userData.pendingOnError||[];me.delete(i);for(let a of s)a()});return r.colorSpace=He,r.userData.pendingOnLoad=typeof e=="function"?[e]:[],r.userData.pendingOnError=typeof t=="function"?[t]:[],me.set(i,r),r}function R_(n=null){if(!n||typeof n!="object")return null;let e=_t(Math.round(ve(n.columns,1)),1,32),t=_t(Math.round(ve(n.rows,1)),1,32),i=_t(Math.round(ve(n.row,0)),0,t-1),s=(Array.isArray(n.frames)?n.frames:[0]).map(a=>_t(Math.round(ve(a,0)),0,e-1)).filter((a,l,o)=>o.indexOf(a)===l);return{id:String(n.id||""),metadataSrc:String(n.metadataSrc||""),action:String(n.action||""),columns:e,rows:t,row:i,frames:s.length>0?s:[0],fps:_t(ve(n.fps,4),1,12),frameWidth:ve(n.frameWidth,1),frameHeight:ve(n.frameHeight,1)}}function dd(n,e,t){if(!n||!e)return;let i=_t(Math.round(ve(t,0)),0,e.columns-1);n.repeat.set(1/e.columns,1/e.rows),n.offset.set(i/e.columns,1-(e.row+1)/e.rows),qo(n)&&(n.needsUpdate=!0)}function I_(n){let e=new Lt;return e.source=n.source,e.mapping=n.mapping,e.channel=n.channel,e.wrapS=n.wrapS,e.wrapT=n.wrapT,e.generateMipmaps=n.generateMipmaps,e.premultiplyAlpha=n.premultiplyAlpha,e.flipY=n.flipY,e.unpackAlignment=n.unpackAlignment,e}function P_(n={},e){let t=R_(n.assetSprite);if(!t||!e)return{texture:e,sheet:null};let i=qo(e)?e.clone():I_(e);return i.colorSpace=He,i.minFilter=pn,i.magFilter=Se,i.userData={spriteSheetClone:!0},dd(i,t,t.frames[0]),{texture:i,sheet:t}}function D_(n={}){return n.kind==="actor"?n.canonicalRoleId==="clover"?1.35:1.22:n.kind==="pad"?1.05:n.buildingType==="HQ"?2.15*ve(n.scale,1):1.55*ve(n.scale,1)}function L_(n={},e,t=0){let i=P_(n,e),r=i.sheet,s=new Tt({map:i.texture,transparent:!0,depthTest:!0,depthWrite:!1,alphaTest:.04}),a=new wt(s),l=r?.frameWidth&&r?.frameHeight?{width:r.frameWidth,height:r.frameHeight}:i.texture?.image||null,o=l&&l.width&&l.height?l.width/l.height:1,c=D_(n);return a.position.set(Cs(n.x),Rs(n.y),cd(n,t)),a.scale.set(c*_t(o,.62,1.75),c,1),a.userData=As(n,{sprite:!0,baseX:a.position.x,baseY:a.position.y,baseScaleX:a.scale.x,baseScaleY:a.scale.y,baseRotation:a.material.rotation||0,phase:Xo(n.actionAnimation?.phaseSeed||n.actorId||n.id),spriteSheet:!!r,spriteSheetId:r?.id||"",spriteSheetAction:r?.action||"",spriteSheetMetadataSrc:r?.metadataSrc||"",spriteSheetColumns:r?.columns||0,spriteSheetRows:r?.rows||0,spriteSheetRow:r?.row??-1,spriteSheetFrames:r?.frames||[],spriteSheetFps:r?.fps||0}),a}function As(n={},e={}){return{objectId:String(n.id||""),kind:String(n.kind||""),label:String(n.label||""),selectionKey:String(n.selectionKey||""),drawerKey:String(n.drawerKey||""),testId:String(n.testId||""),state:String(n.state||""),visualOnly:n.visualOnly===!0,actorId:String(n.actorId||""),canonicalRoleId:String(n.canonicalRoleId||""),generatedOverlayRoleId:String(n.generatedOverlayRoleId||""),sourceDomain:String(n.sourceDomain||""),sourceObjectId:String(n.sourceObjectId||""),sourceStateHash:String(n.sourceStateHash||""),visualState:String(n.visualState||""),assetSrc:String(n.assetSrc||""),assetSprite:n.assetSprite||null,actionKind:String(n.actionKind||""),actionCueType:String(n.actionCue?.cueType||""),actionCueAccessory:String(n.actionCue?.accessory||""),animationMode:String(n.actionAnimation?.mode||""),animationTempo:ve(n.actionAnimation?.tempo,1),animationStepStyle:String(n.actionAnimation?.stepStyle||""),hasWalkOffset:n.actionAnimation?.hasWalkOffset===!0,progress:ve(n.progress,0),routeId:String(n.route?.routeId||""),wayId:String(n.route?.wayId||""),routeMode:String(n.route?.mode||""),routeProgress:ve(n.route?.progress,0),routeTargetId:String(n.route?.targetId||""),validPlacement:n.validPlacement===!0,x:ve(n.x,.5),y:ve(n.y,.5),...e}}function F_(n={},e){let t=Math.max(1.05,e.scale.x*1.04),i=Math.max(1.05,e.scale.y*1.12),r=new ht(new en(t,i),new Ft({color:16777215,transparent:!0,opacity:.001,depthWrite:!1}));return r.position.copy(e.position),r.position.z+=.1,r.userData=As(n,{hitTarget:!0}),r}function N_(n={},e){if(n.kind==="actor")return null;let t=String(n.state||""),i=n.selected?"selected":t==="OUTPUT_READY"?"ready":"neutral",r=hd(n.label||n.id,i),s=new wt(new Tt({map:r,transparent:!0,depthTest:!0,depthWrite:!1,alphaTest:.03}));return s.position.set(e.position.x,e.position.y-e.scale.y*.58,e.position.z+.18),s.scale.set(1.55,.39,1),s.userData=As(n,{labelSprite:!0}),s}function U_(n={},e){if(n.kind!=="actor"||!n.actionCue)return[];let t=String(n.canonicalRoleId||"worker"),i=n.actionCue||{},r=[],s=new wt(new Tt({map:w_(t,i),transparent:!0,depthTest:!0,depthWrite:!1,alphaTest:.03})),a=t==="hauler"?.52:t==="messenger"?.38:.44,l=t==="hauler"?-.08:e.scale.y*.52;if(s.position.set(e.position.x+a,e.position.y+l,e.position.z+.22),s.scale.set(t==="messenger"?.62:.54,t==="messenger"?.62:.54,1),s.userData=As(n,{actionCueSprite:!0,actionCueType:String(i.cueType||""),actionCueAccessory:String(i.accessory||""),baseX:s.position.x,baseY:s.position.y,baseScaleX:s.scale.x,baseScaleY:s.scale.y,baseRotation:s.material.rotation||0,phase:Xo(n.actionAnimation?.phaseSeed||n.actorId||n.id)}),r.push(s),t==="builder"||t==="worker"){let o=new wt(new Tt({map:A_(t,i.progress),transparent:!0,depthTest:!0,depthWrite:!1,alphaTest:.03}));o.position.set(e.position.x,e.position.y-e.scale.y*.62,e.position.z+.24),o.scale.set(1.15,.29,1),o.userData=As(n,{actionCueSprite:!0,progressSprite:!0,actionCueType:String(i.cueType||""),actionCueAccessory:"progress",baseX:o.position.x,baseY:o.position.y,baseScaleX:o.scale.x,baseScaleY:o.scale.y,baseRotation:o.material.rotation||0,phase:Xo(n.actionAnimation?.phaseSeed||n.actorId||n.id)}),r.push(o)}return r}function O_(n={}){return n.selected?6262158:n.buildable?8362854:n.occupied?12879930:10319192}function k_(n={}){let e={x:_t((ve(n.x)+.5)/3,.08,.92),y:_t((ve(n.y)+.5)/3,.1,.9)},t=new ht(new en(3.55,1.78),new Ft({color:O_(n),transparent:!0,opacity:n.selected?.34:n.buildable?.18:.1,depthWrite:!1,side:Bt}));return t.position.set(Cs(e.x),Rs(e.y),-2.1),t.userData={objectId:String(n.id||""),kind:"grid_cell",selectionKey:String(n.selectionKey||""),buildable:n.buildable===!0,occupied:n.occupied===!0,hitTarget:!0},t}function B_(n={}){let e=Array.isArray(n.points)?n.points:[],t=e.length>=2?e.map(s=>Cc(s,-1.72)):[Cc({x:.5,y:.5},-1.72),Cc({x:.55,y:.55},-1.72)],i=new _r(t,!1,"centripetal",.4),r=new ht(new os(i,18,.055,7,!1),new Ft({color:7161893,transparent:!0,opacity:.62,depthWrite:!1}));return r.userData={kind:"way",wayLine:!0,wayId:String(n.wayId||""),label:String(n.label||""),targetId:String(n.targetId||""),visualOnly:n.visualOnly===!0,points:e},r}function z_(n={}){let e=new wt(new Tt({map:C_(n),transparent:!0,depthTest:!0,depthWrite:!1,alphaTest:.03}));return e.position.set(Cs(n.x),Rs(n.y)+.46,2.25),e.scale.set(.68,.56,1),e.userData={kind:"encounter",encounterSprite:!0,encounterId:String(n.encounterId||""),targetId:String(n.targetId||""),cueType:String(n.cueType||""),label:String(n.label||""),roles:Array.isArray(n.roles)?n.roles:[],actorIds:Array.isArray(n.actorIds)?n.actorIds:[],visualOnly:n.visualOnly===!0,baseX:e.position.x,baseY:e.position.y,baseScaleX:e.scale.x,baseScaleY:e.scale.y,phase:Xo(n.encounterId||n.targetId||"")},e}function H_(n,e="three-raycast"){let t=n?.userData||{};return{objectId:String(t.objectId||""),kind:String(t.kind||""),label:String(t.label||""),selectionKey:String(t.selectionKey||""),drawerKey:String(t.drawerKey||""),testId:String(t.testId||""),visualOnly:t.visualOnly===!0,actorId:String(t.actorId||""),canonicalRoleId:String(t.canonicalRoleId||""),generatedOverlayRoleId:String(t.generatedOverlayRoleId||""),sourceDomain:String(t.sourceDomain||""),sourceObjectId:String(t.sourceObjectId||""),sourceStateHash:String(t.sourceStateHash||""),visualState:String(t.visualState||""),actionKind:String(t.actionKind||""),actionCueType:String(t.actionCueType||""),actionCueAccessory:String(t.actionCueAccessory||""),animationMode:String(t.animationMode||""),animationStepStyle:String(t.animationStepStyle||""),progress:ve(t.progress,0),routeId:String(t.routeId||""),wayId:String(t.wayId||""),routeMode:String(t.routeMode||""),routeProgress:ve(t.routeProgress,0),routeTargetId:String(t.routeTargetId||""),validPlacement:t.validPlacement===!0,source:e,atMs:Date.now()}}var Pc=class{constructor(e){this.stageNode=e,this.viewport=null,this.scenePayload=null,this.pickables=[],this.objectMeshes=[],this.info={},this.scene=new dr,this.camera=new pi(yi/-2,yi/2,vi/2,vi/-2,.1,100),this.camera.position.set(0,0,12),this.camera.lookAt(0,0,0),this.raycaster=new br,this.pointer=new _e,this.renderer=new Ms({antialias:!0,alpha:!1,preserveDrawingBuffer:!0}),this.renderer.setClearColor(16046248,1),this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),this.renderer.domElement.className="fp-three-canvas",this.renderer.domElement.dataset.testid="founders-three-canvas",this.renderer.domElement.setAttribute("aria-label","Founders Plot Three.js scene"),this.onClick=this.onClick.bind(this),this.onResize=this.onResize.bind(this),this.animate=this.animate.bind(this),this.running=!0,this.reducedMotion=typeof window.matchMedia=="function"?window.matchMedia("(prefers-reduced-motion: reduce)").matches:!1,this.resizeObserver=new ResizeObserver(this.onResize),requestAnimationFrame(this.animate)}attach(e){e instanceof HTMLElement&&(this.viewport=e,this.renderer.domElement.parentElement!==e&&e.appendChild(this.renderer.domElement),this.stageNode.addEventListener("click",this.onClick,!0),this.resizeObserver.observe(e),this.onResize())}dispose(){this.running=!1,this.stageNode.removeEventListener("click",this.onClick,!0),this.resizeObserver.disconnect(),this.clearScene(),this.renderer.dispose(),this.renderer.domElement.remove()}clearScene(){this.scene.children.slice().forEach(t=>{this.scene.remove(t),t.traverse(i=>{if(i.geometry&&i.geometry.dispose(),i.material){let r=Array.isArray(i.material)?i.material:[i.material];for(let s of r)s.map?.userData?.spriteSheetClone&&s.map.dispose(),s.dispose()}})}),this.pickables=[],this.objectMeshes=[]}onResize(){let e=(this.viewport||this.stageNode).getBoundingClientRect(),t=Math.max(1,Math.floor(e.width)),i=Math.max(1,Math.floor(e.height));this.renderer.setSize(t,i,!1);let r=t/i,s=yi/vi;if(r>=s){let a=vi*r;this.camera.left=a/-2,this.camera.right=a/2,this.camera.top=vi/2,this.camera.bottom=vi/-2}else{let a=yi/r;this.camera.left=yi/-2,this.camera.right=yi/2,this.camera.top=a/2,this.camera.bottom=a/-2}this.camera.updateProjectionMatrix(),this.render()}sync(e={}){this.scenePayload=e,this.rebuild(),this.render()}rebuild(){this.clearScene();let e=this.scenePayload||{},t=window.innerWidth<=560?e.stageBackgrounds?.mobile:e.stageBackgrounds?.desktop,i=Qu(t,()=>this.render()),r=new ht(new en(yi,vi),new Ft({map:i||hd("Founders Plot")}));r.position.set(0,0,-4),this.scene.add(r);for(let s of e.grid?.cells||[]){let a=k_(s);this.scene.add(a),this.pickables.push(a)}for(let s of e.ways||[]){let a=B_(s);this.scene.add(a),this.objectMeshes.push(a)}for(let s of e.objects||[]){let a=s.canonicalRoleId||s.kind,l=E_(a||"worker"),o=null,c=s.assetSrc?Qu(s.assetSrc,()=>this.render(),()=>{o?.material&&(o.material.map?.userData?.spriteSheetClone&&o.material.map.dispose(),o.material.map=l,o.material.needsUpdate=!0,o.userData.assetFallback=!0,o.userData.spriteSheet=!1,this.render())}):l;o=L_(s,c||l,s.kind==="actor"?.8:0),this.scene.add(o),this.objectMeshes.push(o);let h=F_(s,o);this.scene.add(h),this.pickables.push(h);let d=N_(s,o);d&&this.scene.add(d);for(let u of U_(s,o))this.scene.add(u),this.objectMeshes.push(u)}for(let s of e.encounters||[]){let a=z_(s);this.scene.add(a),this.objectMeshes.push(a)}this.updateInfo()}pickFromEvent(e){let t=this.renderer.domElement.getBoundingClientRect();return this.pointer.x=(e.clientX-t.left)/t.width*2-1,this.pointer.y=-((e.clientY-t.top)/t.height)*2+1,this.raycaster.setFromCamera(this.pointer,this.camera),this.raycaster.intersectObjects(this.pickables,!1)[0]?.object||null}onClick(e){if(e.target instanceof Element&&e.target.closest(".fp-tile"))return;let t=this.pickFromEvent(e);if(!t)return;let i=H_(t);i.visualOnly&&(e.preventDefault(),e.stopPropagation()),window.dispatchEvent(new CustomEvent("founders-plot-scene-pick",{detail:i}))}canvasPointFor(e){let t=new C(Cs(e.x),Rs(e.y),cd(e,e.kind==="actor"?.8:0));t.project(this.camera);let i=this.renderer.domElement.getBoundingClientRect();return{x:(t.x+1)/2*i.width,y:(-t.y+1)/2*i.height}}updateInfo(){let e=this.scenePayload||{},t=this.renderer.domElement,i=Array.isArray(e.objects)?e.objects:[];return this.info={renderer:"three.js",stateHash:String(e.stateHash||""),canvasWidth:t.width,canvasHeight:t.height,objectCount:i.length,objectIds:i.map(r=>r.id),ways:(e.ways||[]).map(r=>({wayId:r.wayId||"",targetId:r.targetId||"",label:r.label||"",points:r.points||[],visualOnly:r.visualOnly===!0})),encounters:(e.encounters||[]).map(r=>({encounterId:r.encounterId||"",targetId:r.targetId||"",roles:r.roles||[],actorIds:r.actorIds||[],cueType:r.cueType||"",visualOnly:r.visualOnly===!0,canvas:this.canvasPointFor({x:r.x,y:r.y,z:0,kind:"encounter"})})),actorIds:(e.actors||[]).map(r=>r.actorId),actors:(e.actors||[]).map(r=>({...r,canvas:this.canvasPointFor(i.find(s=>s.actorId===r.actorId||s.id===r.id)||{})})),actionCues:(e.actors||[]).map(r=>({actorId:r.actorId,canonicalRoleId:r.canonicalRoleId,sourceDomain:r.sourceDomain,sourceObjectId:r.sourceObjectId,actionKind:r.actionKind||"",cueType:r.actionCue?.cueType||"",accessory:r.actionCue?.accessory||"",progress:ve(r.actionCue?.progress,r.progress||0)})),roles:(e.actors||[]).map(r=>r.canonicalRoleId),renderedActors:this.objectMeshes.filter(r=>r.userData?.kind==="actor"&&r.userData?.sprite===!0).map(r=>({actorId:r.userData.actorId||"",canonicalRoleId:r.userData.canonicalRoleId||"",assetSrc:r.userData.assetSrc||"",spriteSheet:r.userData.spriteSheet===!0,spriteSheetId:r.userData.spriteSheetId||"",spriteSheetAction:r.userData.spriteSheetAction||"",routeId:r.userData.routeId||"",wayId:r.userData.wayId||"",routeProgress:ve(r.userData.routeProgress,0),assetFallback:r.userData.assetFallback===!0})),renderedWays:this.objectMeshes.filter(r=>r.userData?.wayLine===!0).map(r=>({wayId:r.userData.wayId||"",targetId:r.userData.targetId||"",visualOnly:r.userData.visualOnly===!0})),renderedEncounters:this.objectMeshes.filter(r=>r.userData?.encounterSprite===!0).map(r=>({encounterId:r.userData.encounterId||"",targetId:r.userData.targetId||"",cueType:r.userData.cueType||"",roles:r.userData.roles||[],visualOnly:r.userData.visualOnly===!0})),pickTargets:i.map(r=>({objectId:r.id,kind:r.kind,label:r.label,selectionKey:r.selectionKey,drawerKey:r.drawerKey,testId:r.testId,visualOnly:r.visualOnly===!0,actorId:r.actorId||"",canonicalRoleId:r.canonicalRoleId||"",sourceDomain:r.sourceDomain||"",sourceObjectId:r.sourceObjectId||"",sourceStateHash:r.sourceStateHash||"",visualState:r.visualState||"",assetSrc:r.assetSrc||"",assetSprite:r.assetSprite||null,actionKind:r.actionKind||"",route:r.route||null,actionCue:r.actionCue||null,actionAnimation:r.actionAnimation||null,canvas:this.canvasPointFor(r)}))},this.info}animate(e=0){if(this.running){for(let t of this.objectMeshes){let i=t.userData||{},r=ve(i.baseX,t.position.x),s=ve(i.baseY,t.position.y),a=ve(i.baseScaleX,t.scale.x),l=ve(i.baseScaleY,t.scale.y),o=ve(i.baseRotation,0);if(i.kind==="actor"){if(i.spriteSheet&&t.material?.map){let b=Array.isArray(i.spriteSheetFrames)&&i.spriteSheetFrames.length>0?i.spriteSheetFrames:[0],M=ve(i.spriteSheetFps,4),A=b[Math.floor(e/1e3*M+ve(i.phase,0))%b.length];dd(t.material.map,{columns:ve(i.spriteSheetColumns,1),rows:ve(i.spriteSheetRows,1),row:ve(i.spriteSheetRow,0)},A)}if(this.reducedMotion){t.position.x=r,t.position.y=s,t.scale.set(a,l,1),t.material&&(t.material.rotation=o);continue}let c=ve(i.phase,0),h=ve(i.animationTempo,1),d=e/360*h+c,u=i.hasWalkOffset?Math.sin(e/170+c):0,f=Math.abs(u)*.018,g=r,v=s+Math.sin(d)*.024+f,p=a,m=l,x=o;i.animationMode==="work_swing"?(x+=Math.sin(e/120+c)*.075,v+=Math.max(0,Math.sin(e/155+c))*.035,m*=1+Math.sin(e/155+c)*.018):i.animationMode==="busy_work"?(g+=Math.sin(e/135+c)*.018,v+=Math.sin(e/95+c)*.012,p*=1+Math.sin(e/135+c)*.012):i.animationMode==="carry_wobble"?(g+=Math.sin(e/210+c)*.025,x+=Math.sin(e/180+c)*.055,m*=1+Math.abs(Math.sin(e/180+c))*.018):i.animationMode==="attention_wave"&&(v+=Math.abs(Math.sin(e/150+c))*.05,x+=Math.sin(e/125+c)*.045,p*=1+Math.sin(e/150+c)*.012),t.position.x=g,t.position.y=v,t.scale.set(p,m,1),t.material&&(t.material.rotation=x)}else if(i.actionCueSprite&&!i.progressSprite){if(this.reducedMotion){t.position.x=r,t.position.y=s,t.material&&(t.material.rotation=o);continue}let c=ve(i.phase,0);t.position.y=s+Math.sin(e/240+c)*.025,i.actionCueAccessory==="hammer"||i.actionCueAccessory==="wrench"?t.material.rotation=o+Math.sin(e/135+c)*.1:(i.actionCueAccessory==="notice"||i.actionCueAccessory==="approval"||i.actionCueAccessory==="quest")&&(t.material.rotation=o+Math.sin(e/180+c)*.07)}}this.render(),requestAnimationFrame(this.animate)}}render(){this.updateInfo(),this.renderer.render(this.scene,this.camera)}},Yn=13.6,$n=8.2,ki=.86,xn=ki*1.64,Gt="hq14t_server_bound_terrain_underlay_v1",ed="hq14s_public_terrain_underlay_v1",zc="/experiences/founders-plot/assets/expedition-map",bi=`${zc}/hq14s-public-terrain-underlay-v1`,V_="hq15e_expedition_unit_marker_sprites_v1",Ln=`${zc}/hq15e-expedition-unit-marker-sprites-v1`,Ts="hq17c-generated-hud-chrome-v1",Si=`${zc}/${Ts}`,Es="hq17d_three_masked_profiles_and_text_v1",Dc="hq17e_clean_hud_chrome_compositor_v1",Lc="agenttown_public_terrain_asset_slots_v1",Fc="server_read_model_v1",G_=Object.freeze(["field","forest","ridge","settled"]),fd=Object.freeze({slot:"public_terrain_underlay",path:`${bi}/public-terrain-underlay-candidate-01-v1.png`,assetKind:"visual_underlay"}),td=Object.freeze({field:{slot:"field",path:`${bi}/field-v1.png`,assetKind:"concrete_public_terrain"},settled:{slot:"settled",path:`${bi}/settled-v1.png`,assetKind:"concrete_public_terrain"},forest:{slot:"forest",path:`${bi}/forest-v1.png`,assetKind:"concrete_public_terrain"},ridge:{slot:"ridge",path:`${bi}/ridge-v1.png`,assetKind:"concrete_public_terrain"},hinted:{slot:"hinted_frontier_fog",path:`${bi}/hinted-frontier-fog-v1.png`,assetKind:"fog_only",fogOnly:!0},locked_unknown:{slot:"locked_unknown_fog",path:`${bi}/locked-unknown-fog-v1.png`,assetKind:"fog_only",fogOnly:!0}}),pd=Object.freeze({scout:{slot:"scout",path:`${Ln}/scout-pathfinder-v1.png`,assetKind:"generated_unit_sprite"},settler_convoy:{slot:"settler_convoy",path:`${Ln}/settler-convoy-v1.png`,assetKind:"generated_unit_sprite"},surveyor:{slot:"surveyor",path:`${Ln}/surveyor-beacon-v1.png`,assetKind:"generated_unit_sprite"},courier:{slot:"courier",path:`${Ln}/courier-signal-runner-v1.png`,assetKind:"generated_unit_sprite"},outpost_crew:{slot:"outpost_crew",path:`${Ln}/outpost-crew-v1.png`,assetKind:"generated_unit_sprite"},field_support:{slot:"surveyor",path:`${Ln}/surveyor-beacon-v1.png`,assetKind:"generated_unit_sprite"}}),Oi=Object.freeze({objective_beacon:{slot:"objective_beacon",path:`${Ln}/objective-beacon-v1.png`,assetKind:"generated_marker_sprite"},event_packet:{slot:"event_packet",path:`${Ln}/event-packet-v1.png`,assetKind:"generated_marker_sprite"},receipt_ledger:{slot:"receipt_ledger",path:`${Ln}/receipt-ledger-v1.png`,assetKind:"generated_marker_sprite"}}),nd=Object.freeze([{slot:"crest-status",path:`${Si}/crest-status.png`,anchor:"top-left",widthRatio:.42,heightRatio:.15,marginX:.015,marginY:.018,opacity:.36},{slot:"objective-loop",path:`${Si}/objective-plaque.png`,anchor:"top-left",widthRatio:.32,heightRatio:.13,marginX:.032,marginY:.175,opacity:.32},{slot:"unit-dock",path:`${Si}/unit-dock.png`,anchor:"bottom-left",widthRatio:.52,heightRatio:.19,marginX:.012,marginY:.015,opacity:.36},{slot:"command-tray",path:`${Si}/command-tray.png`,anchor:"bottom-right",widthRatio:.34,heightRatio:.18,marginX:.014,marginY:.018,opacity:.34},{slot:"collapsed-ledger",path:`${Si}/ledger-rail.png`,anchor:"right",widthRatio:.065,heightRatio:.58,marginX:.01,marginY:.19,opacity:.36},{slot:"selected-context",path:`${Si}/selected-context-frame.png`,anchor:"bottom-right",widthRatio:.27,heightRatio:.13,marginX:.052,marginY:.205,opacity:.3},{slot:"command-puck",path:`${Si}/command-puck.png`,anchor:"selected-command",widthRatio:.075,heightRatio:.11,marginX:0,marginY:0,opacity:.36}]),Nc=new Map,Uc=new Set;function md(n={}){let t=(Array.isArray(n.generatedHudChrome?.assets)?n.generatedHudChrome.assets:[]).filter(i=>i?.path&&i?.slot).map(i=>({...nd.find(s=>String(s.slot||"")===String(i.slot||""))||{},...i,packId:String(n.generatedHudChrome?.packId||i.packId||Ts),visualOnly:!0,readOnly:!0,routeAuthority:!1,actionAuthority:!1,executableActions:0}));return t.length?t:nd}function W_(n="",e={}){return md(e).find(t=>String(t.slot||"")===String(n||""))||null}function Kn(n,e=1){let t=Number(n||0),i=t>>16&255,r=t>>8&255,s=t&255;return`rgba(${i}, ${r}, ${s}, ${e})`}function X_(n=""){let e=String(n||""),t=2166136261;for(let i=0;i<e.length;i+=1)t^=e.charCodeAt(i),t=Math.imul(t,16777619);return t>>>0}function Yo(n=""){return X_(n)%1e4/1e4}function id(n={}){let e=ve(n.q,0),t=ve(n.r,0);return{x:e+t*.5,y:-t*.86}}function gd(n=[]){let e=n.map(p=>id(p));e.length||e.push({x:0,y:0});let t=Math.min(...e.map(p=>p.x),0),i=Math.max(...e.map(p=>p.x),0),r=Math.min(...e.map(p=>p.y),0),s=Math.max(...e.map(p=>p.y),0),a=Math.max(1,i-t),l=Math.max(1,s-r),o=Math.min((Yn-2.4)/a,($n-1.8)/l,1.62),c=(t+i)/2,h=(r+s)/2,d=new Map,u=1/0,f=-1/0,g=1/0,v=-1/0;for(let p of n){let m=id(p),x={x:(m.x-c)*o,y:(m.y-h)*o};d.set(String(p.cellId||""),x),u=Math.min(u,x.x-xn),f=Math.max(f,x.x+xn),g=Math.min(g,x.y-xn),v=Math.max(v,x.y+xn)}return Number.isFinite(u)||(u=-1,f=1,g=-1,v=1),{positions:d,bounds:{minX:u,maxX:f,minY:g,maxY:v,centerX:(u+f)/2,centerY:(g+v)/2,width:Math.max(1,f-u),height:Math.max(1,v-g)}}}function Hc(n={},e=!1){let t=String(n.fogState||"locked_unknown");return e?{fill:14676452,line:1462092,rim:16110724,shadow:1457209,opacity:.98,lineOpacity:.98,labelTone:"selected",fogOverlay:15727092}:t==="discovered"?{fill:11192718,line:2976326,rim:15784338,shadow:2969391,opacity:.98,lineOpacity:.9,labelTone:"ready",fogOverlay:15070932}:t==="known"?{fill:4038555,line:1399381,rim:12251373,shadow:1194808,opacity:.96,lineOpacity:.86,labelTone:"selected",fogOverlay:11923949}:t==="hinted"?{fill:15047477,line:7159574,rim:16767096,shadow:8078611,opacity:.92,lineOpacity:.84,labelTone:"neutral",fogOverlay:15971400}:{fill:10130564,line:6116938,rim:14141352,shadow:5393218,opacity:.54,lineOpacity:.46,labelTone:"neutral",fogOverlay:13155498}}function _n(n=ki){let e=[];for(let t=0;t<6;t+=1){let i=Math.PI/6+t*Math.PI/3;e.push(new C(Math.cos(i)*n,Math.sin(i)*n,0))}return e.push(e[0].clone()),e}function rd(n=ki){let e=new xr;return _n(n).forEach((t,i)=>{i===0?e.moveTo(t.x,t.y):e.lineTo(t.x,t.y)}),new as(e)}function sd(n=ki){let e=_n(n).slice(0,6),t=[0,0,0],i=[.5,.5];for(let a of e)t.push(a.x,a.y,0),i.push(.5+a.x/(n*2),.5-a.y/(n*2));let r=[];for(let a=1;a<=e.length;a+=1)r.push(0,a,a===e.length?1:a+1);let s=new ot;return s.setAttribute("position",new gt(t,3)),s.setAttribute("uv",new gt(i,2)),s.setIndex(r),s.computeVertexNormals(),s}function q_(n={}){let e=String(n.status||""),t=String(n.kind||""),i=String(n.fogState||"");return e.includes("OUTPOST")||t.includes("outpost")?"OUT":t==="origin_plot"?"HQ":e.includes("SITE_PLAN")?"PLAN":e.includes("SCOUT")?"SITE":i==="hinted"?"...":i==="locked_unknown"?"?":"MAP"}function Y_(n="",e=!1,t=!1){return e?.72:t?.62:n==="locked_unknown"?.26:n==="hinted"?.46:.58}function $_(n={},e="",t=!1,i=!1){let r=ve(n.opacity,.72);return t?Math.min(.82,r*.88):i?Math.min(.72,r*.76):e==="locked_unknown"?Math.min(.34,r*.58):e==="hinted"?Math.min(.52,r*.62):Math.min(.58,r*.66)}function Z_(n="",e=!1,t=!1){return e?.7:t?.42:n==="locked_unknown"?.08:n==="hinted"?.16:.18}function K_(n={},e="",t=!1,i=!1){return t?Math.max(.58,ve(n.lineOpacity,.58)):i?.38:e==="locked_unknown"?.14:e==="hinted"?.2:.22}function J_(n={}){let e=String(n.siteType||"").toLowerCase(),t=Array.isArray(n.traits)?n.traits.map(s=>String(s||"").toLowerCase()):[],i=String(n.kind||"").toLowerCase(),r=String(n.status||"").toLowerCase();return`${e} ${i} ${r} ${t.join(" ")}`}function Mi(n={}){return["discovered","known"].includes(String(n.fogState||"locked_unknown"))}function Is(n={}){if(!Mi(n))return null;let e=String(n.publicTerrainAssetSlot||"");return G_.includes(e)?e:null}function Vc(n={}){let e=String(n.fogState||"locked_unknown"),t=String(n.fogAssetSlot||"");return e==="hinted"&&t==="hinted_frontier_fog"||e==="locked_unknown"&&t==="locked_unknown_fog"?t:e==="hinted"?"hinted_frontier_fog":"locked_unknown_fog"}function Jn(n={}){let e=String(n.fogState||"locked_unknown");return Mi(n)?Is(n)||"field":e}function j_(n={},e=null){return!Mi(n)||!e?.slot?!1:e.slot===Is(n)}function Gc(n={},e=Jn(n)){let t=String(n.fogState||"locked_unknown");if(!Mi(n)){let r=td[t]||null;return r&&r.slot===Vc(n)?r:null}let i=td[Is(n)||e]||null;return i&&j_(n,i)?i:null}function Q_(n={},e=Jn(n),t=Gc(n,e)){let i=String(n.fogState||"locked_unknown");return t?Mi(n)?t.fogOnly!==!0&&t.assetKind==="concrete_public_terrain"&&t.slot===Is(n)&&String(n.terrainAssetContractVersion||"")===Lc&&String(n.publicTerrainAssetSlotSource||"")===Fc:t.fogOnly===!0&&t.assetKind==="fog_only"&&t.slot===Vc(n):e==="field"}function ad(){for(let n of Uc)n()}function ex(n){return typeof n!="function"?()=>{}:(Uc.add(n),()=>Uc.delete(n))}function Zn(n=null){if(!n?.path)return null;let e=Nc.get(n.path);return!e||e.dataset?.loadFailed==="true"?null:e.complete&&e.naturalWidth>0?e:null}function Jo(n=null){if(!n?.path||typeof Image>"u")return null;if(Nc.get(n.path))return Zn(n);let t=new Image;return t.decoding="async",t.onload=()=>ad(),t.onerror=()=>{t.dataset.loadFailed="true",ad()},Nc.set(n.path,t),t.src=n.path,Zn(n)}function $o(n={}){return pd[String(n.unitType||"")]||null}function Wc(n,e=null,t=0,i=0,r=128,s=128,a=22){let l=Jo(e);return l?(n.save(),n.beginPath(),n.roundRect(t,i,r,s,a),n.clip(),n.drawImage(l,t,i,r,s),n.restore(),!0):!1}function _d(n,e=120,t=128){n.beginPath(),_n(e).forEach((i,r)=>{let s=t+i.x,a=t+i.y;r===0?n.moveTo(s,a):n.lineTo(s,a)}),n.closePath()}function tx(n,e,t,i=1,r="rgba(35, 104, 68, 0.62)"){n.fillStyle="rgba(46, 27, 14, 0.18)",n.beginPath(),n.ellipse(e+7*i,t+12*i,13*i,4*i,0,0,Math.PI*2),n.fill(),n.fillStyle="rgba(80, 55, 29, 0.58)",n.fillRect(e-2*i,t+4*i,4*i,14*i),n.fillStyle=r;for(let s=0;s<3;s+=1){let a=t-18*i+s*12*i,l=(18-s*2)*i;n.beginPath(),n.moveTo(e,a),n.lineTo(e-l,a+24*i),n.lineTo(e+l,a+24*i),n.closePath(),n.fill()}}function Rc(n,e,t,i=1,r="rgba(255, 248, 232, 0.78)"){n.fillStyle="rgba(46, 27, 14, 0.18)",n.beginPath(),n.ellipse(e+8*i,t+24*i,24*i,7*i,0,0,Math.PI*2),n.fill(),n.fillStyle=r,n.strokeStyle="rgba(46, 27, 14, 0.38)",n.lineWidth=4*i,n.beginPath(),n.roundRect(e-18*i,t,36*i,26*i,5*i),n.fill(),n.stroke(),n.fillStyle="rgba(151, 86, 44, 0.82)",n.beginPath(),n.moveTo(e-22*i,t+4*i),n.lineTo(e,t-17*i),n.lineTo(e+23*i,t+4*i),n.closePath(),n.fill(),n.stroke()}function Zo(n,e,t,i=1,r="rgba(27, 106, 100, 0.72)"){n.strokeStyle="rgba(46, 27, 14, 0.42)",n.lineWidth=4*i,n.lineCap="round",n.beginPath(),n.moveTo(e,t+22*i),n.lineTo(e,t-28*i),n.stroke(),n.fillStyle=r,n.beginPath(),n.moveTo(e+3*i,t-25*i),n.lineTo(e+30*i,t-17*i),n.lineTo(e+3*i,t-6*i),n.closePath(),n.fill(),n.strokeStyle="rgba(255, 248, 232, 0.52)",n.lineWidth=2*i;for(let s=0;s<3;s+=1)n.beginPath(),n.arc(e,t-21*i,(15+s*12)*i,-.72,.34),n.stroke()}function Oc(n,e,t,i=92,r=.22){n.save(),n.strokeStyle=`rgba(46, 27, 14, ${r})`,n.lineWidth=3,n.lineCap="round",n.beginPath(),n.moveTo(e,t),n.bezierCurveTo(e+i*.25,t-7,e+i*.62,t+8,e+i,t-2),n.stroke(),n.strokeStyle=`rgba(255, 248, 232, ${r+.1})`,n.lineWidth=1.6,n.beginPath(),n.moveTo(e+4,t-4),n.bezierCurveTo(e+i*.28,t-9,e+i*.64,t+5,e+i-6,t-6),n.stroke(),n.restore()}function kc(n,e,t,i=1){n.save(),n.translate(e,t),n.fillStyle="rgba(255, 248, 232, 0.30)",n.strokeStyle="rgba(46, 27, 14, 0.34)",n.lineWidth=3*i,n.beginPath(),n.roundRect(-34*i,-17*i,68*i,34*i,8*i),n.fill(),n.stroke(),n.fillStyle="rgba(27, 106, 100, 0.35)",n.beginPath(),n.moveTo(-27*i,-17*i),n.lineTo(0,-39*i),n.lineTo(29*i,-17*i),n.closePath(),n.fill(),n.stroke(),n.strokeStyle="rgba(101, 74, 28, 0.45)",n.beginPath(),n.arc(-23*i,21*i,10*i,0,Math.PI*2),n.arc(24*i,21*i,10*i,0,Math.PI*2),n.stroke(),n.restore()}function nx(n,e,t,i=1){n.fillStyle="rgba(255, 248, 232, 0.14)",n.strokeStyle="rgba(255, 248, 232, 0.22)",n.lineWidth=4*i;for(let r=0;r<3;r+=1){let s=e+(r-1)*18*i,a=(26+r%2*14)*i;n.beginPath(),n.roundRect(s-7*i,t-a,14*i,a,3*i),n.fill(),n.stroke()}n.beginPath(),n.moveTo(e-30*i,t+3*i),n.lineTo(e+32*i,t-2*i),n.stroke()}function ix(n,e,t,i){let r=Yo(`${e.cellId}:${i}`);n.save(),_d(n),n.clip();let s=n.createLinearGradient(0,18,256,238);s.addColorStop(0,Kn(t.rim,.92)),s.addColorStop(.46,Kn(t.fill,.96)),s.addColorStop(1,Kn(t.shadow,.72)),n.fillStyle=s,n.fillRect(0,0,256,256),n.strokeStyle="rgba(46, 27, 14, 0.08)",n.lineWidth=3;for(let a=0;a<7;a+=1){let l=28+a*31;n.beginPath(),n.moveTo(12,l),n.bezierCurveTo(66,l-12,121,l+14,182,l-3),n.bezierCurveTo(210,l-10,231,l+3,248,l-8),n.stroke()}if(i==="water"&&(n.strokeStyle="rgba(39, 126, 167, 0.26)",n.lineWidth=9,n.lineCap="round",n.beginPath(),n.moveTo(-10,172-r*30),n.bezierCurveTo(62,139-r*16,118,191+r*12,266,132-r*20),n.stroke(),n.strokeStyle="rgba(224, 248, 255, 0.28)",n.lineWidth=3,n.stroke()),i==="forest"){String(e.fogState||"")==="known"&&(n.fillStyle="rgba(24, 137, 132, 0.24)",n.fillRect(0,0,256,256));for(let a=0;a<34;a+=1){let l=38+(a*37+r*93)%178,o=50+(a*53+r*71)%150;tx(n,l,o,.46+a%3*.07,String(e.fogState||"")==="known"?a%4===0?"rgba(18, 101, 103, 0.72)":"rgba(38, 139, 119, 0.64)":a%4===0?"rgba(29, 84, 61, 0.70)":"rgba(42, 119, 72, 0.62)")}n.strokeStyle="rgba(255, 248, 232, 0.22)",n.lineWidth=5}else if(i==="ridge"){n.strokeStyle="rgba(80, 68, 55, 0.48)",n.lineWidth=9;for(let a=0;a<5;a+=1){let l=62+a*30;n.beginPath(),n.moveTo(24,l),n.bezierCurveTo(74,l-26,126,l+24,232,l-12),n.stroke()}n.fillStyle="rgba(255, 248, 232, 0.18)";for(let a=0;a<12;a+=1){let l=30+a*43%180,o=58+a*29%122;n.beginPath(),n.moveTo(l,o-10),n.lineTo(l-12,o+14),n.lineTo(l+15,o+10),n.closePath(),n.fill()}n.strokeStyle="rgba(255, 248, 232, 0.26)",n.lineWidth=4}else if(i==="settled"){n.fillStyle="rgba(255, 248, 232, 0.28)",n.beginPath(),n.ellipse(128,132,78,48,-.18,0,Math.PI*2),n.fill(),n.strokeStyle="rgba(101, 74, 28, 0.22)",n.lineWidth=4;for(let a=0;a<4;a+=1)Oc(n,56,86+a*23,128,.18);Rc(n,112,118,1.05),Rc(n,152,137,.72,"rgba(232, 244, 222, 0.78)"),Rc(n,82,146,.62,"rgba(255, 228, 160, 0.58)"),Zo(n,160,96,.56,"rgba(47, 125, 101, 0.74)"),kc(n,90,86,.42),n.strokeStyle="rgba(27, 106, 100, 0.34)",n.lineWidth=5,n.beginPath(),n.ellipse(128,132,90,58,-.18,0,Math.PI*2),n.stroke(),n.strokeStyle="rgba(255, 248, 232, 0.34)",n.lineWidth=3,n.beginPath(),n.moveTo(58,162),n.bezierCurveTo(112,142,152,167,206,141),n.stroke(),n.strokeStyle="rgba(27, 106, 100, 0.34)",n.lineWidth=5}else if(i==="water"){n.strokeStyle="rgba(46, 122, 152, 0.44)",n.lineWidth=10;for(let a=0;a<6;a+=1){let l=58+a*25;n.beginPath(),n.moveTo(22,l),n.bezierCurveTo(76,l+18,112,l-18,166,l+3),n.bezierCurveTo(194,l+14,218,l-6,236,l+4),n.stroke()}n.strokeStyle="rgba(255, 248, 232, 0.28)",n.lineWidth=4}else if(i==="ruin_signal"){n.fillStyle="rgba(255, 248, 232, 0.18)",n.fillRect(0,0,256,256),n.strokeStyle="rgba(80, 68, 55, 0.36)",n.lineWidth=7;for(let a=0;a<4;a+=1){let l=70+a*29;n.beginPath(),n.moveTo(34,l),n.bezierCurveTo(76,l-16,128,l+14,212,l-8),n.stroke()}nx(n,105,154,.72),Zo(n,160,116,.48,"rgba(101, 74, 28, 0.56)"),n.strokeStyle="rgba(101, 74, 28, 0.32)",n.lineWidth=4}else if(i==="hinted"){n.fillStyle="rgba(226, 134, 40, 0.18)",n.fillRect(0,0,256,256),n.fillStyle="rgba(255, 248, 232, 0.16)";for(let a=0;a<10;a+=1){let l=28+a*22;n.beginPath(),n.ellipse(128+(a%3-1)*22,l,112-a%2*18,12,.12,0,Math.PI*2),n.fill()}n.setLineDash([10,9]),n.strokeStyle="rgba(255, 248, 232, 0.32)",n.lineWidth=4,n.beginPath(),n.ellipse(128,130,72,48,-.15,0,Math.PI*2),n.stroke(),n.setLineDash([]),n.fillStyle="rgba(46, 27, 14, 0.12)",n.beginPath(),n.ellipse(128,136,52,31,-.18,0,Math.PI*2),n.fill(),n.strokeStyle="rgba(138, 109, 65, 0.34)",n.lineWidth=5}else if(i==="locked_unknown"){n.fillStyle="rgba(255, 248, 232, 0.10)";for(let a=-2;a<11;a+=1)n.fillRect(a*31,20,13,220);n.fillStyle="rgba(255, 248, 232, 0.12)";for(let a=0;a<7;a+=1)n.beginPath(),n.ellipse(128,42+a*26,116-a%2*18,11,-.12,0,Math.PI*2),n.fill();n.fillStyle="rgba(68, 58, 48, 0.16)",n.beginPath(),n.ellipse(128,145,60,36,.1,0,Math.PI*2),n.fill(),n.strokeStyle="rgba(255, 248, 232, 0.20)",n.lineWidth=5}else{kc(n,88+r*64,86+r*42,.32),n.strokeStyle="rgba(69, 112, 68, 0.30)",n.lineWidth=5;for(let a=0;a<7;a+=1){let l=48+a*24;n.beginPath(),n.moveTo(26,l),n.bezierCurveTo(84,l-12,144,l+10,230,l-7),n.stroke()}}n.strokeStyle=i==="locked_unknown"?"rgba(255, 248, 232, 0.10)":n.strokeStyle;for(let a=0;a<4;a+=1){let l=60+a*38+r*12;n.beginPath(),n.moveTo(18,l),n.bezierCurveTo(82,l-18,152,l+15,238,l-9),n.stroke()}n.restore()}function od(n={},e=!1){let t=String(n.fogState||"locked_unknown"),i=Jn(n),r=Gc(n,i),s=Jo(r),a=s?"asset-ready":r?.slot||"procedural",l=`expedition-cell:${Gt}:${n.cellId}:${t}:${i}:${a}:${e?"selected":"idle"}`;if(me.has(l))return me.get(l);let o=Hc(n,e),c=document.createElement("canvas");c.width=256,c.height=256;let h=c.getContext("2d");h.clearRect(0,0,c.width,c.height),h.shadowColor=Kn(o.shadow,e?.34:.24),h.shadowBlur=e?22:13,h.shadowOffsetY=e?9:6,ix(h,n,o,i),s&&(h.save(),_d(h,120,128),h.clip(),h.globalAlpha=t==="locked_unknown"?.74:t==="hinted"?.72:.92,h.drawImage(s,0,0,256,256),h.globalCompositeOperation="multiply",h.globalAlpha=t==="locked_unknown"?.16:.1,h.fillStyle=t==="locked_unknown"?"#3b3228":"#fff8e8",h.fillRect(0,0,256,256),h.restore()),h.shadowColor="transparent",h.shadowBlur=0,h.shadowOffsetY=0;let d=h.createRadialGradient(82,62,12,128,128,130);d.addColorStop(0,"rgba(255, 248, 232, 0.20)"),d.addColorStop(.64,Kn(o.fogOverlay,t==="locked_unknown"?.22:.1)),d.addColorStop(1,Kn(o.shadow,t==="locked_unknown"?.18:.12)),h.fillStyle=d,h.beginPath(),_n(120).forEach((f,g)=>{let v=128+f.x,p=128+f.y;g===0?h.moveTo(v,p):h.lineTo(v,p)}),h.closePath(),h.fill(),h.strokeStyle=Kn(e?o.rim:o.line,e?.98:.76),h.lineWidth=e?13:8,h.beginPath(),_n(116).forEach((f,g)=>{let v=128+f.x,p=128+f.y;g===0?h.moveTo(v,p):h.lineTo(v,p)}),h.closePath(),h.stroke(),t==="hinted"&&(h.setLineDash([12,10]),h.strokeStyle="rgba(46, 27, 14, 0.36)",h.lineWidth=5,h.stroke(),h.setLineDash([]));let u=new ut(c);return u.colorSpace=He,u.minFilter=Se,u.magFilter=Se,me.set(l,u),u}function rx(n={},e=!1){let t=q_(n),i=String(n.fogState||"locked_unknown"),r=`expedition-marker:${Gt}:${t}:${i}:${e?"selected":"idle"}`;if(me.has(r))return me.get(r);let s=document.createElement("canvas");s.width=192,s.height=192;let a=s.getContext("2d"),l=Hc(n,e);a.clearRect(0,0,s.width,s.height),a.fillStyle="rgba(22, 18, 13, 0.22)",a.beginPath(),a.ellipse(96,154,54,16,0,0,Math.PI*2),a.fill();let o=String(n.kind||""),c=String(n.status||"");a.fillStyle=i==="locked_unknown"?"rgba(46, 39, 32, 0.92)":i==="hinted"?"rgba(209, 154, 72, 0.94)":o==="origin_plot"?"rgba(255, 226, 128, 0.98)":c.includes("SITE_PLAN")?"rgba(154, 225, 216, 0.96)":Kn(l.rim,.94),a.strokeStyle=Kn(l.line,.92),a.lineWidth=e?10:7,a.beginPath(),a.arc(96,84,48,0,Math.PI*2),a.fill(),a.stroke(),a.beginPath(),a.moveTo(96,138),a.lineTo(75,112),a.lineTo(117,112),a.closePath(),a.fill(),a.stroke(),a.fillStyle=i==="locked_unknown"||i==="hinted"?"#fff8e8":"#2e1b0e",a.font="800 34px Georgia, serif",a.textAlign="center",a.textBaseline="middle",a.fillText(t.length>3?t.slice(0,3):t,96,84);let h=new ut(s);return h.colorSpace=He,h.minFilter=Se,h.magFilter=Se,me.set(r,h),h}function xd(n={}){return String(n.cellId||n.receiptLink?.cellId||n.sourceIds?.cellId||"").trim()}function sx(n={}){return(Array.isArray(n?.eventPackets)?n.eventPackets:[]).filter(e=>e&&typeof e=="object"&&e.packetId&&xd(e))}function ax(n={},e=!1){let t=String(n.packetId||"packet"),i=String(n.templateId||n.kind||"event_packet"),r=`expedition-event-marker:${Gt}:${t}:${i}:${e?"selected":"idle"}`;if(me.has(r))return me.get(r);let s=document.createElement("canvas");s.width=192,s.height=192;let a=s.getContext("2d");a.clearRect(0,0,s.width,s.height),a.fillStyle="rgba(46, 27, 14, 0.22)",a.beginPath(),a.ellipse(96,150,48,14,0,0,Math.PI*2),a.fill(),a.fillStyle=e?"rgba(255, 248, 232, 0.94)":"rgba(255, 248, 232, 0.84)",a.strokeStyle=e?"#f5d484":"#8a6d41",a.lineWidth=e?8:6,a.beginPath(),a.roundRect(52,48,88,78,12),a.fill(),a.stroke(),a.strokeStyle="#1b6a64",a.lineWidth=6,a.lineJoin="round",a.beginPath(),a.moveTo(56,60),a.lineTo(96,92),a.lineTo(136,60),a.stroke(),a.fillStyle="#d19a48",a.strokeStyle="#5a3418",a.lineWidth=5,a.beginPath(),a.arc(122,116,17,0,Math.PI*2),a.fill(),a.stroke(),a.fillStyle="#82d6d0",a.globalAlpha=e?.82:.58,a.beginPath(),a.arc(62,42,8,0,Math.PI*2),a.fill(),a.globalAlpha=1,Wc(a,Oi.event_packet,42,34,108,108,16);let l=new ut(s);return l.colorSpace=He,l.minFilter=Se,l.magFilter=Se,me.set(r,l),l}function ox(n={},e=!1){let t=String(n.mode||"inspect"),i=`expedition-objective-marker:${Gt}:${t}:${n.targetCellId||""}:${e?"selected":"idle"}`;if(me.has(i))return me.get(i);let r=document.createElement("canvas");r.width=192,r.height=192;let s=r.getContext("2d");s.clearRect(0,0,r.width,r.height);let a=t==="scout"?"rgba(245, 212, 132, 0.40)":t==="packet"?"rgba(130, 214, 208, 0.38)":"rgba(255, 248, 232, 0.30)",l=t==="scout"?"#d19a48":t==="packet"?"#1b6a64":"#8a6d41";s.fillStyle=a,s.beginPath(),s.arc(96,88,e?68:58,0,Math.PI*2),s.fill(),s.fillStyle="rgba(46, 27, 14, 0.22)",s.beginPath(),s.ellipse(96,150,52,15,0,0,Math.PI*2),s.fill(),s.fillStyle=l,s.strokeStyle=e?"#fff8e8":"#5a3418",s.lineWidth=e?9:6,s.beginPath(),s.arc(96,82,38,0,Math.PI*2),s.fill(),s.stroke(),s.strokeStyle="#fff8e8",s.fillStyle="#fff8e8",s.lineWidth=8,s.lineCap="round",s.lineJoin="round",t==="scout"?(s.beginPath(),s.arc(96,82,20,0,Math.PI*2),s.moveTo(96,48),s.lineTo(96,61),s.moveTo(96,103),s.lineTo(96,118),s.moveTo(62,82),s.lineTo(75,82),s.moveTo(117,82),s.lineTo(130,82),s.stroke(),s.beginPath(),s.moveTo(96,58),s.lineTo(108,86),s.lineTo(84,106),s.closePath(),s.fill()):t==="packet"?(s.beginPath(),s.roundRect(72,60,48,44,7),s.moveTo(76,69),s.lineTo(96,86),s.lineTo(116,69),s.stroke()):(s.beginPath(),s.moveTo(72,116),s.lineTo(96,52),s.lineTo(120,116),s.stroke(),s.beginPath(),s.arc(96,56,12,0,Math.PI*2),s.fill()),Wc(s,t==="packet"?Oi.event_packet:Oi.objective_beacon,42,28,108,108,18);let o=new ut(r);return o.colorSpace=He,o.minFilter=Se,o.magFilter=Se,me.set(i,o),o}function lx(n="edge"){let e=`expedition-fog:${Gt}:${n}`;if(me.has(e))return me.get(e);let t=document.createElement("canvas");t.width=512,t.height=512;let i=t.getContext("2d"),r=i.createRadialGradient(242,238,38,256,256,250);r.addColorStop(0,n==="locked"?"rgba(135, 129, 112, 0.34)":"rgba(228, 133, 38, 0.46)"),r.addColorStop(.5,n==="locked"?"rgba(116, 108, 92, 0.38)":"rgba(238, 184, 86, 0.42)"),r.addColorStop(.8,n==="locked"?"rgba(78, 70, 58, 0.22)":"rgba(255, 230, 158, 0.22)"),r.addColorStop(1,"rgba(255, 248, 232, 0)"),i.fillStyle=r,i.fillRect(0,0,t.width,t.height),i.strokeStyle=n==="locked"?"rgba(255, 248, 232, 0.18)":"rgba(255, 248, 232, 0.26)",i.lineWidth=8,i.lineCap="round";for(let a=0;a<7;a+=1){let l=104+a*42;i.beginPath(),i.moveTo(30,l),i.bezierCurveTo(130,l-28,262,l+36,480,l-20),i.stroke()}i.save(),i.globalCompositeOperation="multiply",i.strokeStyle=n==="locked"?"rgba(57, 49, 40, 0.18)":"rgba(124, 91, 48, 0.18)",i.lineWidth=3;for(let a=0;a<5;a+=1)i.beginPath(),i.ellipse(254,242+a*5,188-a*22,122-a*13,-.14,0,Math.PI*2),i.stroke();i.restore(),n!=="locked"&&(i.setLineDash([18,16]),i.strokeStyle="rgba(101, 74, 28, 0.24)",i.lineWidth=5,i.beginPath(),i.ellipse(256,256,164,112,-.16,0,Math.PI*2),i.stroke(),i.setLineDash([]));let s=new ut(t);return s.colorSpace=He,s.minFilter=Se,s.magFilter=Se,me.set(e,s),s}function cx(n,e,t){n.save(),n.globalCompositeOperation="multiply",n.lineCap="round",n.strokeStyle="rgba(46, 27, 14, 0.07)",n.lineWidth=3;for(let i=-1;i<11;i+=1){let r=62+i*58;n.beginPath(),n.moveTo(-70,r),n.bezierCurveTo(124,r-54,282,r+48,474,r-18),n.bezierCurveTo(650,r-78,814,r+40,e+80,r-36),n.stroke()}n.strokeStyle="rgba(27, 106, 100, 0.08)",n.lineWidth=2;for(let i=-2;i<9;i+=1){let r=112+i*128;n.beginPath(),n.moveTo(r,-50),n.bezierCurveTo(r+88,92,r-78,222,r+74,362),n.bezierCurveTo(r+202,480,r-62,546,r+138,t+52),n.stroke()}n.restore(),n.save(),n.strokeStyle="rgba(255, 248, 232, 0.26)",n.lineWidth=2;for(let i=0;i<5;i+=1){let r=610+i*80,s=118+i%2*74;n.beginPath(),n.ellipse(r,s,84+i*10,38+i*4,-.18,0,Math.PI*2),n.stroke()}n.restore()}function hx(n="soft"){let e=`expedition-edge-fog:${Gt}:${n}`;if(me.has(e))return me.get(e);let t=document.createElement("canvas");t.width=1024,t.height=256;let i=t.getContext("2d"),r=i.createLinearGradient(0,0,t.width,0);r.addColorStop(0,"rgba(255, 248, 232, 0)"),r.addColorStop(.28,n==="locked"?"rgba(43, 35, 27, 0.30)":"rgba(234, 219, 184, 0.24)"),r.addColorStop(.52,n==="locked"?"rgba(43, 35, 27, 0.54)":"rgba(255, 248, 232, 0.50)"),r.addColorStop(.76,n==="locked"?"rgba(43, 35, 27, 0.30)":"rgba(27, 106, 100, 0.18)"),r.addColorStop(1,"rgba(255, 248, 232, 0)"),i.fillStyle=r,i.fillRect(0,0,t.width,t.height),i.strokeStyle=n==="locked"?"rgba(255, 248, 232, 0.14)":"rgba(255, 248, 232, 0.32)",i.lineWidth=2;for(let a=0;a<12;a+=1){let l=28+a*17;i.beginPath(),i.moveTo(0,l),i.bezierCurveTo(240,l-30,510,l+36,1024,l-18),i.stroke()}i.save(),i.setLineDash([20,14]),i.strokeStyle=n==="locked"?"rgba(255, 248, 232, 0.10)":"rgba(101, 74, 28, 0.22)",i.lineWidth=6,i.beginPath(),i.moveTo(34,132),i.bezierCurveTo(254,74,534,182,990,112),i.stroke(),i.restore();let s=new ut(t);return s.colorSpace=He,s.minFilter=Se,s.magFilter=Se,me.set(e,s),s}function ux(){let n=`expedition-map-base:${Gt}`;if(me.has(n))return me.get(n);let e=document.createElement("canvas");e.width=1024,e.height=640;let t=e.getContext("2d"),i=t.createLinearGradient(0,0,e.width,e.height);i.addColorStop(0,"#f3e4bf"),i.addColorStop(.32,"#d8dfbd"),i.addColorStop(.64,"#b9cfa5"),i.addColorStop(1,"#6aa39b"),t.fillStyle=i,t.fillRect(0,0,e.width,e.height),cx(t,e.width,e.height),t.fillStyle="rgba(72, 152, 124, 0.11)";for(let a=0;a<9;a+=1){let l=-60+a*140;t.beginPath(),t.ellipse(l,470+a%3*18,148,45,-.12,0,Math.PI*2),t.fill()}t.strokeStyle="rgba(101, 74, 28, 0.12)",t.lineWidth=15,t.lineCap="round",t.beginPath(),t.moveTo(-70,452),t.bezierCurveTo(112,385,247,507,399,423),t.bezierCurveTo(552,339,709,440,1094,305),t.stroke(),t.strokeStyle="rgba(255, 248, 232, 0.20)",t.lineWidth=4,t.stroke(),t.fillStyle="rgba(33, 113, 80, 0.13)";for(let a=0;a<68;a+=1){let l=a*83%e.width,o=a*131%e.height,c=28+a*17%74;t.beginPath(),t.ellipse(l,o,c*1.4,c,a%5*.3,0,Math.PI*2),t.fill()}t.strokeStyle="rgba(68, 57, 46, 0.20)",t.lineWidth=6;for(let a=0;a<7;a+=1){let l=102+a*48;t.beginPath(),t.moveTo(554,l),t.bezierCurveTo(615,l-42,706,l+34,804,l-22),t.bezierCurveTo(873,l-60,946,l+11,1070,l-44),t.stroke()}t.strokeStyle="rgba(46, 27, 14, 0.13)",t.lineWidth=2.5;for(let a=54;a<e.height;a+=56)t.beginPath(),t.moveTo(-30,a),t.bezierCurveTo(150,a-36,280,a+42,470,a-8),t.bezierCurveTo(650,a-56,780,a+34,e.width+40,a-22),t.stroke();t.strokeStyle="rgba(27, 106, 100, 0.12)",t.lineWidth=2;for(let a=-70;a<e.width+90;a+=78)t.beginPath(),t.moveTo(a,-20),t.bezierCurveTo(a+120,160,a-90,350,a+140,e.height+30),t.stroke();t.save(),t.setLineDash([18,13]),t.lineCap="round",t.strokeStyle="rgba(101, 74, 28, 0.20)",t.lineWidth=5,[[[-24,248],[122,197,236,277,366,217],[506,154,612,232,714,184],[810,138,916,174,1048,120]],[[424,-20],[500,92,444,198,548,292],[646,382,586,478,742,676]],[[138,636],[226,512,336,564,430,452],[526,336,636,408,760,314],[862,236,930,284,1050,226]]].forEach(a=>{t.beginPath(),t.moveTo(a[0][0],a[0][1]);for(let l=1;l<a.length;l+=1){let o=a[l];t.bezierCurveTo(o[0],o[1],o[2],o[3],o[4],o[5])}t.stroke()}),t.strokeStyle="rgba(255, 248, 232, 0.50)",t.lineWidth=3,[[[-24,248],[122,197,236,277,366,217],[506,154,612,232,714,184],[810,138,916,174,1048,120]],[[424,-20],[500,92,444,198,548,292],[646,382,586,478,742,676]],[[138,636],[226,512,336,564,430,452],[526,336,636,408,760,314],[862,236,930,284,1050,226]]].forEach(a=>{t.beginPath(),t.moveTo(a[0][0],a[0][1]);for(let l=1;l<a.length;l+=1){let o=a[l];t.bezierCurveTo(o[0],o[1],o[2],o[3],o[4],o[5])}t.stroke()}),t.restore(),t.save(),t.globalCompositeOperation="multiply",t.strokeStyle="rgba(46, 27, 14, 0.08)",t.lineWidth=2;for(let a=34;a<e.height;a+=34)Oc(t,42,a,270,.11),Oc(t,676,a+10,250,.09);t.restore(),t.save(),t.globalAlpha=.72,kc(t,170,436,.86),Zo(t,780,180,.84,"rgba(27, 106, 100, 0.58)"),Zo(t,332,222,.58,"rgba(101, 74, 28, 0.52)"),t.restore(),t.strokeStyle="rgba(101, 74, 28, 0.18)",t.lineWidth=2,t.setLineDash([12,10]),t.strokeRect(28,28,e.width-56,e.height-56),t.setLineDash([]);let r=t.createRadialGradient(e.width*.48,e.height*.46,80,e.width*.48,e.height*.46,590);r.addColorStop(0,"rgba(255, 248, 232, 0.12)"),r.addColorStop(.74,"rgba(255, 248, 232, 0)"),r.addColorStop(1,"rgba(46, 27, 14, 0.28)"),t.fillStyle=r,t.fillRect(0,0,e.width,e.height);let s=new ut(e);return s.colorSpace=He,s.wrapS=Jt,s.wrapT=Jt,s.minFilter=Se,s.magFilter=Se,me.set(n,s),s}function yd(n={}){let e=n.bounds||{minX:-1,maxX:1,minY:-1,maxY:1,centerX:0,centerY:0,width:2,height:2},t=xn*1.72,i=e.minX-t,r=e.maxX+t,s=e.minY-t,a=e.maxY+t;return{minX:i,maxX:r,minY:s,maxY:a,centerX:(i+r)/2,centerY:(s+a)/2,width:Math.max(.01,r-i),height:Math.max(.01,a-s)}}function dx(n={x:0,y:0},e,t){return{x:(n.x-e.minX)/Math.max(.01,e.width)*t.width,y:t.height-(n.y-e.minY)/Math.max(.01,e.height)*t.height}}function Wo(n={},e=Jn(n)){let t=String(n.fogState||"locked_unknown");return Mi(n)?e==="forest"?{terrain:e,fill:"rgba(42, 126, 86, 0.46)",mid:"rgba(35, 145, 123, 0.26)",edge:"rgba(255, 248, 232, 0)",contour:"rgba(23, 80, 64, 0.20)",bridge:"rgba(43, 126, 91, 0.24)",fogOnly:!1}:e==="ridge"||e==="ruin_signal"?{terrain:e,fill:"rgba(118, 104, 85, 0.42)",mid:"rgba(194, 176, 128, 0.24)",edge:"rgba(255, 248, 232, 0)",contour:"rgba(68, 57, 46, 0.20)",bridge:"rgba(129, 111, 82, 0.22)",fogOnly:!1}:e==="water"?{terrain:e,fill:"rgba(63, 143, 166, 0.42)",mid:"rgba(123, 196, 207, 0.26)",edge:"rgba(255, 248, 232, 0)",contour:"rgba(35, 95, 126, 0.18)",bridge:"rgba(67, 148, 169, 0.22)",fogOnly:!1}:e==="settled"?{terrain:e,fill:"rgba(214, 181, 102, 0.44)",mid:"rgba(73, 143, 128, 0.24)",edge:"rgba(255, 248, 232, 0)",contour:"rgba(101, 74, 28, 0.18)",bridge:"rgba(196, 165, 94, 0.22)",fogOnly:!1}:{terrain:e,fill:"rgba(121, 158, 90, 0.38)",mid:"rgba(216, 209, 151, 0.22)",edge:"rgba(255, 248, 232, 0)",contour:"rgba(68, 91, 63, 0.17)",bridge:"rgba(124, 156, 97, 0.20)",fogOnly:!1}:t==="hinted"?{terrain:"hinted",fill:"rgba(224, 150, 52, 0.46)",mid:"rgba(245, 212, 132, 0.32)",edge:"rgba(255, 248, 232, 0)",contour:"rgba(101, 74, 28, 0.18)",bridge:"rgba(214, 148, 58, 0.20)",fogOnly:!0}:{terrain:"locked_unknown",fill:"rgba(157, 150, 132, 0.30)",mid:"rgba(104, 96, 82, 0.20)",edge:"rgba(255, 248, 232, 0)",contour:"rgba(255, 248, 232, 0.13)",bridge:"rgba(134, 126, 111, 0.14)",fogOnly:!0}}function fx(n,e,t,i,r=0){let s=(e.x+t.x)/2,a=(e.y+t.y)/2,l=22+r*26;n.save(),n.filter="blur(13px)",n.lineCap="round",n.strokeStyle=i.bridge,n.lineWidth=104,n.beginPath(),n.moveTo(e.x,e.y),n.quadraticCurveTo(s,a-l,t.x,t.y),n.stroke(),n.restore()}function px(n,e,t,i,r=0){n.save();let s=n.createRadialGradient(e.x-t*.22,e.y-t*.24,t*.08,e.x,e.y,t);s.addColorStop(0,i.fill),s.addColorStop(.54,i.mid),s.addColorStop(1,i.edge),n.filter="blur(9px)",n.fillStyle=s,n.beginPath(),n.arc(e.x,e.y,t,0,Math.PI*2),n.fill(),n.restore(),n.save(),n.translate(e.x,e.y),n.rotate((r-.5)*.26),n.scale(1.28,.82),n.strokeStyle=i.contour,n.lineWidth=5,n.lineCap="round";for(let a=-2;a<=2;a+=1){let l=a*t*.18;n.beginPath(),n.moveTo(-t*.78,l),n.bezierCurveTo(-t*.34,l-t*.17,t*.18,l+t*.16,t*.76,l-t*.08),n.stroke()}i.fogOnly&&(n.setLineDash([15,13]),n.strokeStyle=i.terrain==="locked_unknown"?"rgba(255, 248, 232, 0.14)":"rgba(101, 74, 28, 0.22)",n.lineWidth=4,n.beginPath(),n.ellipse(0,0,t*.58,t*.34,-.08,0,Math.PI*2),n.stroke()),n.restore()}function mx(n=[],e=gd(n)){let t=Jo(fd),i=n.map(d=>`${d.cellId}:${d.fogState}:${Jn(d)}:${d.publicTerrainAssetSlot||""}:${d.fogAssetSlot||""}`).join("|"),r=`expedition-continuous-underlay:${Gt}:${i}:${t?"promoted-underlay-ready":"promoted-underlay-pending"}`;if(me.has(r))return me.get(r);let s=document.createElement("canvas");s.width=1024,s.height=768;let a=s.getContext("2d"),l=yd(e),o=new Map;for(let d of n){let u=e.positions.get(String(d.cellId||""));u&&o.set(String(d.cellId||""),dx(u,l,s))}a.clearRect(0,0,s.width,s.height),a.fillStyle="rgba(255, 248, 232, 0.04)",a.fillRect(0,0,s.width,s.height),t&&(a.save(),a.globalAlpha=.68,a.drawImage(t,0,0,s.width,s.height),a.globalCompositeOperation="screen",a.globalAlpha=.18,a.fillStyle="rgba(255, 248, 232, 0.70)",a.fillRect(0,0,s.width,s.height),a.restore());for(let d=0;d<n.length;d+=1)for(let u=d+1;u<n.length;u+=1){let f=n[d],g=n[u];if(!Xc(f,g))continue;let v=o.get(String(f.cellId||"")),p=o.get(String(g.cellId||""));if(!v||!p)continue;let m=Wo(f),x=Wo(g),b=m.terrain==="locked_unknown"||x.terrain==="locked_unknown"?{bridge:"rgba(134, 126, 111, 0.12)"}:{bridge:m.fogOnly?m.bridge:x.fogOnly?x.bridge:"rgba(75, 132, 105, 0.20)"};fx(a,v,p,b,Yo(`${f.cellId}:${g.cellId}:underlay`))}let c=Math.min(s.width/l.width,s.height/l.height);for(let d of n){let u=o.get(String(d.cellId||""));if(!u)continue;let f=Jn(d),g=Wo(d,f),v=c*xn*(g.fogOnly?1.28:1.38);px(a,u,v,g,Yo(`${d.cellId}:${f}:underlay`))}a.save(),a.globalCompositeOperation="multiply",a.strokeStyle="rgba(46, 27, 14, 0.06)",a.lineWidth=2;for(let d=42;d<s.height;d+=36)a.beginPath(),a.moveTo(-40,d),a.bezierCurveTo(150,d-24,298,d+28,482,d-8),a.bezierCurveTo(648,d-42,818,d+22,s.width+40,d-16),a.stroke();a.restore();let h=new ut(s);return h.colorSpace=He,h.minFilter=Se,h.magFilter=Se,me.set(r,h),h}function gx(){let n=`expedition-civic-beacon:${Gt}`;if(me.has(n))return me.get(n);let e=document.createElement("canvas");e.width=256,e.height=256;let t=e.getContext("2d");t.clearRect(0,0,e.width,e.height);let i=t.createRadialGradient(128,126,16,128,126,116);i.addColorStop(0,"rgba(245, 212, 132, 0.48)"),i.addColorStop(.48,"rgba(27, 106, 100, 0.18)"),i.addColorStop(1,"rgba(255, 248, 232, 0)"),t.fillStyle=i,t.fillRect(0,0,e.width,e.height),t.strokeStyle="rgba(46, 27, 14, 0.42)",t.lineWidth=9,t.lineCap="round",t.beginPath(),t.moveTo(128,174),t.lineTo(128,80),t.stroke(),t.strokeStyle="rgba(27, 106, 100, 0.42)",t.lineWidth=5;for(let s=0;s<3;s+=1)t.beginPath(),t.arc(128,83,30+s*22,-.78,.78),t.stroke();t.fillStyle="rgba(245, 212, 132, 0.86)",t.strokeStyle="rgba(46, 27, 14, 0.44)",t.lineWidth=5,t.beginPath(),t.moveTo(136,76),t.lineTo(188,94),t.lineTo(136,116),t.closePath(),t.fill(),t.stroke(),t.fillStyle="rgba(255, 248, 232, 0.54)",t.beginPath(),t.roundRect(91,174,74,25,8),t.fill();let r=new ut(e);return r.colorSpace=He,r.minFilter=Se,r.magFilter=Se,me.set(n,r),r}function _x(n={},e={x:0,y:0},t=!1,i=!1){let r=Hc(n,t),s=String(n.fogState||""),a=Jn(n),l=new dn;l.position.set(e.x,e.y,0);let o=xn*(t?1.04:i?1.02:1),c=new ht(sd(o),new Ft({color:16777215,map:od(n,t),transparent:!0,opacity:Y_(s,t,i),side:Bt,depthWrite:!1}));c.position.z=-.1,c.userData={kind:"expedition_cell",cellId:String(n.cellId||""),fogState:String(n.fogState||""),terrain:a,regionPlate:!0,waterCue:a==="water",status:String(n.status||""),title:String(n.title||""),selected:t,hovered:i},l.add(c);let h=new Cn(new ot().setFromPoints(_n(o*1.01)),new kt({color:t?r.rim:r.line,transparent:!0,opacity:Z_(s,t,i)}));h.position.z=-.04,l.add(h);let d=new ht(rd(ki*1.16),new Ft({color:r.shadow,transparent:!0,opacity:t?.18:.08,side:Bt,depthWrite:!1}));d.position.set(.08,-.09,-.01),l.add(d);let u=new ht(sd(ki),new Ft({color:16777215,map:od(n,t),transparent:!0,opacity:$_(r,s,t,i),side:Bt,depthWrite:!1}));u.position.z=.02,u.userData={kind:"expedition_cell",cellId:String(n.cellId||""),fogState:String(n.fogState||""),terrain:a,waterCue:a==="water",status:String(n.status||""),title:String(n.title||""),selected:t,hovered:i},l.add(u);let f=new Cn(new ot().setFromPoints(_n(ki*(t?1.08:1))),new kt({color:r.line,transparent:!0,opacity:K_(r,s,t,i)}));if(f.position.z=.08,l.add(f),t){let v=new Cn(new ot().setFromPoints(_n(o*1.08)),new kt({color:r.rim,transparent:!0,opacity:.82}));v.position.z=.16,l.add(v)}if(i&&!t){let v=new Cn(new ot().setFromPoints(_n(o*1.04)),new kt({color:16775400,transparent:!0,opacity:.7}));v.position.z=.15,l.add(v)}if(s==="discovered"&&a==="settled"){let v=new Cn(new ot().setFromPoints(_n(o*1.14)),new kt({color:16774340,transparent:!0,opacity:.44}));v.position.z=.14,l.add(v);let p=new ht(rd(o*1.02),new Ft({color:16774340,transparent:!0,opacity:.07,side:Bt,depthWrite:!1}));p.position.z=.07,l.add(p)}if(s==="locked_unknown"){let v=new pr(new ot().setFromPoints([new C(-.32,-.3,.1),new C(.32,.3,.1),new C(-.34,.02,.1),new C(.12,.46,.1),new C(-.1,-.46,.1),new C(.34,-.02,.1)]),new kt({color:16775400,transparent:!0,opacity:.16}));l.add(v)}if(s==="hinted"&&String(n.kind||"")==="frontier_hint"){let v=new Cn(new ot().setFromPoints(_n(o*1.03)),new kt({color:1796708,transparent:!0,opacity:.64}));v.position.z=.12,l.add(v)}let g=new wt(new Tt({map:rx(n,t),transparent:!0,depthTest:!0,depthWrite:!1,alphaTest:.03}));return g.position.set(0,t?.03:-.01,.2),g.scale.set(t?.72:.54,t?.72:.54,1),l.add(g),l}function Xc(n={},e={}){let t=ve(n.q,0),i=ve(n.r,0),r=ve(e.q,0),s=ve(e.r,0),a=t-r,l=i-s;return Math.max(Math.abs(a),Math.abs(l),Math.abs(a+l))===1}function xx(n={},e={}){let t=[String(n.fogState||""),String(e.fogState||"")];return t.includes("locked_unknown")?null:t.includes("hinted")?{color:9071937,glow:16110724,opacity:.34,dash:[.16,.16]}:{color:1796708,glow:16110724,opacity:.5,dash:[.18,.13]}}function yx(n,e,t){let i=xx(n,e);if(!i)return null;let r=t.positions.get(String(n.cellId||"")),s=t.positions.get(String(e.cellId||""));if(!r||!s)return null;let a=new C((r.x+s.x)/2,(r.y+s.y)/2,-.2),l=.08+Yo(`${n.cellId}:${e.cellId}`)*.1,o=new hi(new C(r.x,r.y,-.2),new C(a.x,a.y+l,-.2),new C(s.x,s.y,-.2)),c=new ot().setFromPoints(o.getPoints(32)),h=new An(c,new vr({color:i.color,transparent:!0,opacity:i.opacity,dashSize:i.dash[0],gapSize:i.dash[1]}));h.computeLineDistances(),h.userData={kind:"expedition_receipt_trace",routeAuthority:!1,visualOnly:!0};let d=new An(c.clone(),new kt({color:i.glow,transparent:!0,opacity:.14}));d.position.z=-.02,d.userData={kind:"expedition_receipt_trace_glow",routeAuthority:!1,visualOnly:!0};let u=new dn;return u.add(d,h),u.userData={kind:"expedition_receipt_trace_group",routeAuthority:!1,visualOnly:!0},u}function vd(n={}){switch(String(n.unitType||n.role||"").toLowerCase()){case"scout":return{fill:"#1f756e",stroke:"#102f2f",accent:"#d6f1ef",glow:"#f5d484",glyph:"compass"};case"courier":return{fill:"#b95368",stroke:"#4f202b",accent:"#fff0bd",glow:"#78a9d6",glyph:"flag"};case"surveyor":return{fill:"#7a6540",stroke:"#342719",accent:"#d6f1ef",glow:"#82d6d0",glyph:"tripod"};case"settler_convoy":return{fill:"#c4883a",stroke:"#5a3418",accent:"#fff8e8",glow:"#f5d484",glyph:"wagon"};case"outpost_crew":return{fill:"#637f58",stroke:"#223a25",accent:"#ffe4a0",glow:"#82d6d0",glyph:"beacon"};default:return{fill:"#8a6d41",stroke:"#3b2513",accent:"#fff8e8",glow:"#82d6d0",glyph:"ledger"}}}function vx(n={},e=!1){let t=`expedition-unit:${Gt}:${n.unitType}:${n.unitId}:${e?"selected":"idle"}`;if(me.has(t))return me.get(t);let i=vd(n),r=document.createElement("canvas");r.width=192,r.height=192;let s=r.getContext("2d");s.clearRect(0,0,r.width,r.height),s.fillStyle="rgba(46, 27, 14, 0.24)",s.beginPath(),s.ellipse(96,146,55,18,0,0,Math.PI*2),s.fill(),s.fillStyle=e?"rgba(245, 212, 132, 0.34)":"rgba(255, 248, 232, 0.20)",s.strokeStyle=e?"#f5d484":"rgba(59, 37, 19, 0.55)",s.lineWidth=e?9:6,s.beginPath(),s.roundRect(38,30,116,116,34),s.fill(),s.stroke(),s.fillStyle=i.fill,s.strokeStyle=i.stroke,s.lineWidth=8,s.beginPath(),s.arc(96,88,42,0,Math.PI*2),s.fill(),s.stroke(),s.strokeStyle=i.accent,s.fillStyle=i.accent,s.lineWidth=8,s.lineCap="round",s.lineJoin="round",i.glyph==="compass"?(s.beginPath(),s.arc(96,88,24,0,Math.PI*2),s.moveTo(96,52),s.lineTo(96,66),s.moveTo(96,110),s.lineTo(96,124),s.moveTo(60,88),s.lineTo(74,88),s.moveTo(118,88),s.lineTo(132,88),s.stroke(),s.beginPath(),s.moveTo(96,58),s.lineTo(108,92),s.lineTo(84,118),s.closePath(),s.fill()):i.glyph==="flag"?(s.beginPath(),s.moveTo(80,122),s.lineTo(80,56),s.lineTo(124,68),s.lineTo(80,84),s.stroke()):i.glyph==="wagon"?(s.beginPath(),s.roundRect(66,80,60,34,9),s.stroke(),s.beginPath(),s.arc(78,124,9,0,Math.PI*2),s.arc(116,124,9,0,Math.PI*2),s.stroke()):i.glyph==="beacon"?(s.beginPath(),s.moveTo(72,124),s.lineTo(96,58),s.lineTo(120,124),s.stroke(),s.beginPath(),s.arc(96,62,15,0,Math.PI*2),s.fill()):i.glyph==="tripod"?(s.beginPath(),s.moveTo(96,58),s.lineTo(96,92),s.moveTo(96,92),s.lineTo(70,126),s.moveTo(96,92),s.lineTo(122,126),s.moveTo(76,70),s.lineTo(116,70),s.stroke(),s.beginPath(),s.arc(96,56,13,0,Math.PI*2),s.fill()):(s.beginPath(),s.roundRect(68,62,56,60,8),s.stroke(),s.beginPath(),s.moveTo(80,82),s.lineTo(112,82),s.moveTo(80,100),s.lineTo(106,100),s.stroke()),Wc(s,$o(n),28,22,136,136,34),s.fillStyle=i.glow,s.globalAlpha=e?.8:.46,s.beginPath(),s.arc(136,47,e?8:6,0,Math.PI*2),s.fill(),s.globalAlpha=1;let a=new ut(r);return a.colorSpace=He,a.minFilter=Se,a.magFilter=Se,me.set(t,a),a}function Sx(n={}){return(Array.isArray(n.commandHints)?n.commandHints:[]).filter(e=>e?.enabled!==!1).length}function ld(n=""){let e=String(n||"").replace(/^cell[_-]?/i,"").replace(/_/g," ").trim(),t=e.match(/q(-?\d+)/i)?.[1],i=e.match(/r(-?\d+)/i)?.[1];return t!=null&&i!=null?`Q${t} R${i}`:e?e.toUpperCase().slice(0,8):"MAP"}function Ko(n={}){let e=String(n.displayName||"").trim();if(e){let i=e.split(/\s+/).filter(Boolean);return i.length>1?i.map(r=>r[0]).join("").slice(0,3).toUpperCase():e.slice(0,3).toUpperCase()}let t=String(n.unitType||"").replace(/_/g," ");return/settler/i.test(t)?"STL":/outpost/i.test(t)?"OUT":/surveyor/i.test(t)?"SRV":/courier/i.test(t)?"CR":/scout/i.test(t)?"SCT":"UNT"}function bx(n={},e=!1){let t=$o(n),i=!!Zn(t),r=`expedition-hud-profile:${Es}:${n.unitId}:${n.unitType}:${i?"asset":"fallback"}:${e?"selected":"idle"}`;if(me.has(r))return me.get(r);let s=document.createElement("canvas");s.width=256,s.height=256;let a=s.getContext("2d"),l=vd(n);a.clearRect(0,0,s.width,s.height),a.fillStyle="rgba(12, 33, 30, 0.36)",a.beginPath(),a.ellipse(128,210,74,19,0,0,Math.PI*2),a.fill();let o=a.createRadialGradient(92,62,12,128,128,118);o.addColorStop(0,"rgba(255, 248, 232, 0.96)"),o.addColorStop(.52,e?"rgba(245, 212, 132, 0.92)":"rgba(130, 214, 208, 0.70)"),o.addColorStop(1,"rgba(46, 27, 14, 0.90)"),a.fillStyle=o,a.beginPath(),a.arc(128,123,88,0,Math.PI*2),a.fill(),a.save(),a.beginPath(),a.arc(128,123,70,0,Math.PI*2),a.clip();let c=Zn(t);if(c)a.drawImage(c,48,42,160,160);else{let d=a.createRadialGradient(110,76,16,128,126,82);d.addColorStop(0,l.accent),d.addColorStop(1,l.fill),a.fillStyle=d,a.fillRect(48,42,160,160),a.fillStyle=l.accent,a.font="900 54px Georgia, serif",a.textAlign="center",a.textBaseline="middle",a.fillText(Ko(n),128,122,112)}a.globalCompositeOperation="multiply",a.fillStyle=e?"rgba(255, 248, 232, 0.04)":"rgba(12, 33, 30, 0.10)",a.fillRect(48,42,160,160),a.restore(),a.strokeStyle=e?"#f5d484":"rgba(255, 248, 232, 0.66)",a.lineWidth=e?10:7,a.beginPath(),a.arc(128,123,72,0,Math.PI*2),a.stroke(),a.strokeStyle="rgba(12, 33, 30, 0.48)",a.lineWidth=4,a.beginPath(),a.arc(128,123,89,-.78,Math.PI*1.34),a.stroke(),a.fillStyle=e?"rgba(245, 212, 132, 0.98)":"rgba(255, 248, 232, 0.92)",a.strokeStyle="rgba(46, 27, 14, 0.46)",a.lineWidth=3,a.beginPath(),a.roundRect(82,188,92,28,14),a.fill(),a.stroke(),a.fillStyle="#2e1b0e",a.font='900 18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',a.textAlign="center",a.textBaseline="middle",a.fillText(Ko(n),128,203,72);let h=new ut(s);return h.colorSpace=He,h.minFilter=Se,h.magFilter=Se,me.set(r,h),h}function Mx(n={}){let e=n.objective&&typeof n.objective=="object"?n.objective:{},t=String(e.mode||"").toLowerCase();return t.includes("packet")?"PLAN":t.includes("review")?"REVIEW":t.includes("convoy")?"CONVOY":t.includes("settle")||t.includes("found")?"FOUND":t.includes("scout")?"SCOUT":e.targetCellId?"NEXT":"READY"}function Tx(n={}){let e=String(n.slot||""),t=String(n.title||"").toUpperCase().slice(0,18),i=String(n.meta||"").toUpperCase().slice(0,24),r=String(n.tone||"light"),s=`expedition-hud-text:${Es}:${e}:${r}:${t}:${i}`;if(me.has(s))return me.get(s);let a=document.createElement("canvas");a.width=768,a.height=192;let l=a.getContext("2d");l.clearRect(0,0,a.width,a.height);let o=r!=="dark",c=e==="command-puck",h=c?384:30,d=c?384:34;l.fillStyle=o?"rgba(12, 33, 30, 0.42)":"rgba(255, 248, 232, 0.68)",l.strokeStyle=o?"rgba(245, 212, 132, 0.40)":"rgba(101, 74, 28, 0.24)",l.lineWidth=3,l.beginPath(),l.roundRect(10,20,748,152,34),l.fill(),l.stroke(),l.fillStyle=o?"rgba(255, 248, 232, 0.94)":"rgba(46, 27, 14, 0.92)",l.strokeStyle=o?"rgba(12, 33, 30, 0.58)":"rgba(255, 248, 232, 0.50)",l.shadowColor=o?"rgba(12, 33, 30, 0.34)":"rgba(255, 248, 232, 0.24)",l.shadowBlur=10,l.lineWidth=8,l.textAlign=c?"center":"left",l.textBaseline="middle",l.font='900 64px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',t&&(l.strokeText(t,h,72,706),l.fillText(t,h,72,706)),l.font='800 36px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',l.globalAlpha=.9,i&&(l.strokeText(i,d,136,700),l.fillText(i,d,136,700)),l.globalAlpha=1,l.shadowBlur=0;let u=new ut(a);return u.colorSpace=He,u.minFilter=Se,u.magFilter=Se,me.set(s,u),u}function Ex(n={}){let e=String(n.slot||"hud"),t=`expedition-clean-hud-chrome:${Dc}:${e}`;if(me.has(t))return me.get(t);let i=e==="collapsed-ledger",r=e==="command-puck",s=document.createElement("canvas");s.width=i?256:r?384:1024,s.height=i?1024:r?384:320;let a=s.getContext("2d"),l=s.width,o=s.height,c=r?28:i?24:34,h=r?160:i?72:86;a.clearRect(0,0,l,o);let d=a.createLinearGradient(0,0,l,o);if(d.addColorStop(0,e==="crest-status"||e==="collapsed-ledger"?"rgba(12, 33, 30, 0.24)":"rgba(255, 248, 232, 0.18)"),d.addColorStop(.55,e==="command-puck"||e==="command-tray"?"rgba(27, 106, 100, 0.18)":"rgba(182, 151, 84, 0.10)"),d.addColorStop(1,e==="crest-status"||e==="collapsed-ledger"?"rgba(22, 62, 56, 0.18)":"rgba(12, 33, 30, 0.08)"),a.save(),a.shadowColor="rgba(12, 33, 30, 0.14)",a.shadowBlur=8,a.shadowOffsetY=3,a.fillStyle=d,a.beginPath(),a.roundRect(c,c,l-c*2,o-c*2,h),a.fill(),a.restore(),a.strokeStyle="rgba(245, 212, 132, 0.38)",a.lineWidth=r?10:i?8:7,a.beginPath(),a.roundRect(c+6,c+6,l-(c+6)*2,o-(c+6)*2,Math.max(24,h-14)),a.stroke(),a.strokeStyle="rgba(12, 33, 30, 0.24)",a.lineWidth=r?5:4,a.beginPath(),a.roundRect(c+22,c+22,l-(c+22)*2,o-(c+22)*2,Math.max(18,h-30)),a.stroke(),a.globalAlpha=.42,a.strokeStyle=e==="crest-status"||e==="collapsed-ledger"?"rgba(255, 248, 232, 0.46)":"rgba(46, 27, 14, 0.34)",a.lineWidth=3,e==="unit-dock")a.beginPath(),a.arc(152,o/2,92,0,Math.PI*2),a.stroke(),a.beginPath(),a.arc(152,o/2,58,0,Math.PI*2),a.stroke();else if(e==="crest-status")a.beginPath(),a.arc(172,o/2,74,0,Math.PI*2),a.stroke(),a.beginPath(),a.moveTo(172,o/2-46),a.lineTo(204,o/2),a.lineTo(172,o/2+46),a.lineTo(140,o/2),a.closePath(),a.stroke();else if(e==="collapsed-ledger")for(let f=0;f<7;f+=1){let g=180+f*96;a.beginPath(),a.arc(l/2,g,16,0,Math.PI*2),a.stroke()}else e==="command-puck"&&(a.beginPath(),a.arc(l/2,o/2,108,0,Math.PI*2),a.stroke());a.globalAlpha=1;let u=new ut(s);return u.colorSpace=He,u.minFilter=Se,u.magFilter=Se,me.set(t,u),u}function wx(n,e="expedition-three-raycast"){let t=n?.userData||{};return{unitId:String(t.unitId||""),unitType:String(t.unitType||""),displayName:String(t.displayName||""),cellId:String(t.cellId||""),source:e,atMs:Date.now()}}function Ax(n,e="expedition-three-raycast"){let t=n?.userData||{};return{markerKind:String(t.kind||""),packetId:String(t.packetId||""),mode:String(t.mode||""),cellId:String(t.cellId||t.targetCellId||""),targetCellId:String(t.targetCellId||t.cellId||""),visualOnly:t.visualOnly===!0,readOnly:t.readOnly===!0,source:e,atMs:Date.now()}}function Cx(n,e="expedition-three-raycast"){let t=n?.userData||{};return{unitId:String(t.unitId||""),unitType:String(t.unitType||""),commandId:String(t.commandId||""),cellId:String(t.cellId||""),targetCellId:String(t.cellId||""),fogState:String(t.fogState||""),serverMutationImplemented:t.serverMutationImplemented===!0,movementMutation:t.movementMutation===!0,visualOnly:t.visualOnly===!0,readOnly:t.readOnly===!0,previewOnly:t.previewOnly===!0,source:e,atMs:Date.now()}}function Sd(n=""){switch(String(n||"")){case"move_unit":return{stroke:"#1b6a64",fill:"rgba(130, 214, 208, 0.18)",glyph:"move"};case"scout_sector":return{stroke:"#d19a48",fill:"rgba(245, 212, 132, 0.20)",glyph:"scout"};case"prepare_settler_convoy":return{stroke:"#c4883a",fill:"rgba(255, 226, 128, 0.18)",glyph:"convoy"};case"found_settlement":return{stroke:"#637f58",fill:"rgba(130, 214, 208, 0.16)",glyph:"outpost"};default:return{stroke:"#8a6d41",fill:"rgba(255, 248, 232, 0.16)",glyph:"inspect"}}}function Rx(n={}){let e=String(n.commandId||"inspect"),t=String(n.fogState||""),i=`expedition-command-target:${Gt}:${e}:${t}`;if(me.has(i))return me.get(i);let r=document.createElement("canvas");r.width=256,r.height=256;let s=r.getContext("2d"),a=Sd(e);s.clearRect(0,0,r.width,r.height),s.fillStyle=a.fill,s.beginPath(),s.arc(128,128,106,0,Math.PI*2),s.fill(),s.strokeStyle=a.stroke,s.lineWidth=e==="scout_sector"?10:8,e==="scout_sector"&&s.setLineDash([18,12]),s.beginPath(),s.arc(128,128,98,0,Math.PI*2),s.stroke(),s.setLineDash([]),s.strokeStyle="rgba(255, 248, 232, 0.72)",s.lineWidth=4,s.beginPath(),s.arc(128,128,80,0,Math.PI*2),s.stroke(),s.fillStyle="rgba(46, 27, 14, 0.24)",s.beginPath(),s.ellipse(128,210,54,13,0,0,Math.PI*2),s.fill(),s.strokeStyle=a.stroke,s.fillStyle="#fff8e8",s.lineWidth=8,s.lineCap="round",s.lineJoin="round",a.glyph==="move"?(s.beginPath(),s.moveTo(86,128),s.lineTo(164,128),s.moveTo(140,104),s.lineTo(164,128),s.lineTo(140,152),s.stroke()):a.glyph==="scout"?(s.beginPath(),s.arc(128,128,30,0,Math.PI*2),s.moveTo(128,78),s.lineTo(128,98),s.moveTo(128,158),s.lineTo(128,178),s.moveTo(78,128),s.lineTo(98,128),s.moveTo(158,128),s.lineTo(178,128),s.stroke()):a.glyph==="convoy"?(s.beginPath(),s.roundRect(88,112,80,38,10),s.stroke(),s.beginPath(),s.arc(104,164,10,0,Math.PI*2),s.arc(152,164,10,0,Math.PI*2),s.stroke()):a.glyph==="outpost"?(s.beginPath(),s.moveTo(96,174),s.lineTo(128,82),s.lineTo(160,174),s.stroke(),s.beginPath(),s.arc(128,84,18,0,Math.PI*2),s.fillStyle=a.stroke,s.fill()):(s.beginPath(),s.roundRect(96,88,64,78,10),s.stroke());let l=new ut(r);return l.colorSpace=He,l.minFilter=Se,l.magFilter=Se,me.set(i,l),l}function Ix(n={}){let e=String(n.commandId||"command"),t=String(n.feedbackId||`${e}:${n.cellId||""}`),i=`expedition-command-outcome:${Gt}:${t}`;if(me.has(i))return me.get(i);let r=document.createElement("canvas");r.width=256,r.height=256;let s=r.getContext("2d"),a=Sd(e);s.clearRect(0,0,r.width,r.height),s.fillStyle=a.fill,s.beginPath(),s.arc(128,128,116,0,Math.PI*2),s.fill(),s.strokeStyle=a.stroke,s.lineWidth=10,s.beginPath(),s.arc(128,128,104,0,Math.PI*2),s.stroke(),s.strokeStyle="rgba(255, 248, 232, 0.78)",s.lineWidth=5,s.beginPath(),s.arc(128,128,78,0,Math.PI*2),s.stroke(),s.fillStyle="rgba(255, 248, 232, 0.88)",s.beginPath(),s.arc(128,128,42,0,Math.PI*2),s.fill(),s.strokeStyle=a.stroke,s.lineWidth=9,s.lineCap="round",s.lineJoin="round",e==="move_unit"?(s.beginPath(),s.moveTo(92,128),s.lineTo(160,128),s.moveTo(138,106),s.lineTo(160,128),s.lineTo(138,150),s.stroke()):e==="scout_sector"?(s.beginPath(),s.arc(128,128,24,0,Math.PI*2),s.moveTo(128,88),s.lineTo(128,104),s.moveTo(128,152),s.lineTo(128,168),s.moveTo(88,128),s.lineTo(104,128),s.moveTo(152,128),s.lineTo(168,128),s.stroke()):e==="prepare_settler_convoy"?(s.beginPath(),s.roundRect(92,112,72,34,9),s.stroke(),s.beginPath(),s.arc(106,158,8,0,Math.PI*2),s.arc(150,158,8,0,Math.PI*2),s.stroke()):e==="found_settlement"?(s.beginPath(),s.moveTo(96,158),s.lineTo(128,96),s.lineTo(160,158),s.stroke(),s.beginPath(),s.moveTo(108,158),s.lineTo(156,158),s.stroke()):(s.beginPath(),s.moveTo(98,130),s.lineTo(120,152),s.lineTo(164,104),s.stroke());let l=new ut(r);return l.colorSpace=He,l.minFilter=Se,l.magFilter=Se,me.set(i,l),l}function Px(n={},e=new Map){if(!n?.unitId)return[];let t=new Map,i=(s={},a="",l="")=>{let o=String(s.commandId||l||""),c=String(a||"").trim();if(!o||!c)return;let h=e.get(c);if(!h)return;let d=String(h.fogState||"");if(o==="scout_sector"){if(!(d==="hinted"&&String(h.kind||"")==="frontier_hint"))return}else if(!["discovered","known"].includes(d))return;let u=`${o}:${c}`;t.has(u)||t.set(u,{unitId:String(n.unitId||""),unitType:String(n.unitType||""),commandId:o,cellId:c,fogState:d,serverMutationImplemented:s.serverMutationImplemented===!0||o==="move_unit"&&n.movement?.movementMutationImplemented===!0,movementMutation:o==="move_unit",routeAuthority:!1,actionAuthority:!1,visualOnly:!0,readOnly:!0,source:l})};return(Array.isArray(n.commandHints)?n.commandHints:[]).filter(s=>s&&s.enabled!==!1).forEach(s=>{let a=String(s.commandId||""),l=Array.isArray(s.targetCellIds)?s.targetCellIds.map(o=>String(o||"")).filter(Boolean):[];if(a==="move_unit"){let o=Array.isArray(n.movement?.allowedTargetCellIds)?n.movement.allowedTargetCellIds.map(c=>String(c||"")).filter(Boolean):[];[...new Set([...l,...o])].forEach(c=>i(s,c,"movement"));return}l.forEach(o=>i(s,o,"command_hint"))}),Array.from(t.values())}function Dx(n={},e={}){let t=ve(n.q,0)-ve(e.q,0),i=ve(n.r,0)-ve(e.r,0),r=ve(n.q,0)+ve(n.r,0)-(ve(e.q,0)+ve(e.r,0));return Math.max(Math.abs(t),Math.abs(i),Math.abs(r))}function Lx(n={},e=new Map,t=[]){if(!n?.unitId||String(n.unitType||n.role||"").toLowerCase()!=="outpost_crew")return null;let i=String(n.location?.cellId||n.cellId||"").trim();if(!i)return null;let r=e.get(i);if(!r||!["discovered","known"].includes(String(r.fogState||""))||!`${r.kind||""} ${r.status||""} ${(Array.isArray(r.traits)?r.traits:[]).join(" ")}`.toLowerCase().includes("outpost"))return null;let a=t.filter(o=>String(o.fogState||"")==="hinted"&&String(o.kind||"")==="frontier_hint").filter(o=>o.readOnly!==!1).map(o=>{let c=String(o.sourceIds?.adjacentCellId||"")===i;return{cell:o,adjacentSource:c,adjacentGeometry:Xc(r,o),distance:Dx(r,o)}}).filter(o=>o.adjacentSource||o.adjacentGeometry||Number.isFinite(o.distance));if(!a.length)return null;a.sort((o,c)=>o.adjacentSource!==c.adjacentSource?o.adjacentSource?-1:1:o.adjacentGeometry!==c.adjacentGeometry?o.adjacentGeometry?-1:1:o.distance-c.distance);let l=a[0].cell;return{unitId:String(n.unitId||""),unitType:String(n.unitType||""),commandId:"scout_sector",cueLabel:"Next Scout",originCellId:i,targetCellId:String(l.cellId||""),targetFogState:String(l.fogState||""),targetKind:String(l.kind||""),derivedFrom:a[0].adjacentSource?"sourceIds.adjacentCellId":"nearest_visible_hinted_frontier_cell",visualOnly:!0,readOnly:!0,selectable:!1,routeAuthority:!1,actionAuthority:!1,executableActions:0,hiddenTruthLeakage:!1}}function Fx(n=!1){let e=`expedition-outpost-next-frontier:${Gt}:${n?"selected":"idle"}`;if(me.has(e))return me.get(e);let t=document.createElement("canvas");t.width=256,t.height=256;let i=t.getContext("2d");i.clearRect(0,0,t.width,t.height),i.fillStyle=n?"rgba(245, 212, 132, 0.22)":"rgba(255, 226, 128, 0.16)",i.beginPath(),i.arc(128,128,112,0,Math.PI*2),i.fill(),i.strokeStyle=n?"rgba(245, 212, 132, 0.92)":"rgba(209, 154, 72, 0.76)",i.lineWidth=n?12:9,i.setLineDash([18,12]),i.beginPath(),i.arc(128,128,100,0,Math.PI*2),i.stroke(),i.setLineDash([]),i.strokeStyle="rgba(27, 106, 100, 0.58)",i.lineWidth=5,i.beginPath(),i.arc(128,128,70,0,Math.PI*2),i.stroke(),i.fillStyle="rgba(255, 248, 232, 0.86)",i.beginPath(),i.moveTo(128,70),i.lineTo(148,128),i.lineTo(128,186),i.lineTo(108,128),i.closePath(),i.fill(),i.strokeStyle="rgba(46, 27, 14, 0.42)",i.lineWidth=4,i.stroke(),i.fillStyle=n?"rgba(46, 27, 14, 0.72)":"rgba(46, 27, 14, 0.58)",i.font="900 20px sans-serif",i.textAlign="center",i.textBaseline="middle",i.fillText("NEXT",128,214);let r=new ut(t);return r.colorSpace=He,r.minFilter=Se,r.magFilter=Se,me.set(e,r),r}function Nx(n={},e={},t=!1){let i=e.positions?.get?.(String(n.originCellId||"")),r=e.positions?.get?.(String(n.targetCellId||""));if(!i||!r)return null;let s={x:(i.x+r.x)/2,y:(i.y+r.y)/2},a=.34+Math.min(2.2,Math.hypot(r.x-i.x,r.y-i.y))*.12,l=new hi(new C(i.x,i.y+.3,.485),new C(s.x,s.y+a,.485),new C(r.x,r.y+.02,.485)),o=new ot().setFromPoints(l.getPoints(34)),c=new An(o,new vr({color:13736520,transparent:!0,opacity:t?.88:.68,dashSize:.12,gapSize:.09}));c.computeLineDistances(),c.userData={kind:"expedition_outpost_next_frontier_connection",...n};let h=new An(o.clone(),new kt({color:16110724,transparent:!0,opacity:t?.22:.14}));h.position.z=-.01,h.userData={kind:"expedition_outpost_next_frontier_connection_glow",...n};let d=new wt(new Tt({map:Fx(t),transparent:!0,depthWrite:!1,depthTest:!0,alphaTest:.03,opacity:t?.94:.82}));d.position.set(r.x,r.y+.03,.505),d.scale.set(t?1.22:1.08,t?1.22:1.08,1),d.userData={kind:"expedition_outpost_next_frontier_beacon",...n};let u=new dn;return u.add(h,c,d),u.userData={kind:"expedition_outpost_next_frontier_group",...n},{group:u,ring:d,line:c}}function Ux(n,e="expedition-three-raycast"){let t=n?.userData||{};return{cellId:String(t.cellId||""),fogState:String(t.fogState||""),status:String(t.status||""),title:String(t.title||""),source:e,atMs:Date.now()}}var Bc=class{constructor(e){this.hostNode=e,this.model={},this.cells=[],this.info={},this.pickables=[],this.cellMeshes=[],this.unitSprites=[],this.commandTargetSprites=[],this.outcomeFeedbackSprites=[],this.eventMarkerSprites=[],this.objectiveMarkerSprites=[],this.outpostFrontierBeaconSprites=[],this.generatedHudChromeSprites=[],this.generatedHudProfileSprites=[],this.generatedHudTextSprites=[],this.outcomeFeedback=null,this.hoverCellId="",this.terrainUnderlayCount=0,this.surveyStrokeCount=0,this.markerCount=0,this.unitTokenCount=0,this.commandTargetCount=0,this.outcomeFeedbackCount=0,this.eventMarkerCount=0,this.objectiveMarkerCount=0,this.outpostFrontierBeaconCount=0,this.generatedHudChromeCount=0,this.generatedHudProfileCount=0,this.generatedHudTextCount=0,this.scene=new dr,this.camera=new pi(-Yn/2,Yn/2,$n/2,-$n/2,.1,100),this.camera.position.set(0,0,10),this.camera.lookAt(0,0,0),this.raycaster=new br,this.pointer=new _e,this.renderer=new Ms({antialias:!0,alpha:!1,preserveDrawingBuffer:!0}),this.renderer.setClearColor(14151135,1),this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),this.renderer.domElement.className="fp-expedition-three-canvas",this.renderer.domElement.dataset.testid="fp-expedition-three-canvas",this.renderer.domElement.setAttribute("aria-label","Zoomable private Expedition Map"),this.dragging=!1,this.dragMoved=!1,this.lastPointer=null,this.activePointers=new Map,this.pinchDistance=0,this.pinchZoom=1,this.mapBounds={minX:-1,maxX:1,minY:-1,maxY:1,centerX:0,centerY:0,width:2,height:2},this.onResize=this.onResize.bind(this),this.onWheel=this.onWheel.bind(this),this.onPointerDown=this.onPointerDown.bind(this),this.onPointerMove=this.onPointerMove.bind(this),this.onPointerUp=this.onPointerUp.bind(this),this.onPointerLeave=this.onPointerLeave.bind(this),this.onRegionTileAssetLoaded=()=>{me.clear(),this.rebuild(),this.render()},this.disposeRegionTileAssetListener=ex(this.onRegionTileAssetLoaded),this.resizeObserver=new ResizeObserver(this.onResize),this.attach()}attach(){this.renderer.domElement.parentElement!==this.hostNode&&this.hostNode.appendChild(this.renderer.domElement),this.hostNode.addEventListener("wheel",this.onWheel,{passive:!1}),this.hostNode.addEventListener("pointerdown",this.onPointerDown),this.hostNode.addEventListener("pointermove",this.onPointerMove),this.hostNode.addEventListener("pointerup",this.onPointerUp),this.hostNode.addEventListener("pointercancel",this.onPointerUp),this.hostNode.addEventListener("pointerleave",this.onPointerLeave),this.resizeObserver.observe(this.hostNode),this.onResize()}dispose(){this.hostNode.removeEventListener("wheel",this.onWheel),this.hostNode.removeEventListener("pointerdown",this.onPointerDown),this.hostNode.removeEventListener("pointermove",this.onPointerMove),this.hostNode.removeEventListener("pointerup",this.onPointerUp),this.hostNode.removeEventListener("pointercancel",this.onPointerUp),this.hostNode.removeEventListener("pointerleave",this.onPointerLeave),this.disposeRegionTileAssetListener&&this.disposeRegionTileAssetListener(),this.resizeObserver.disconnect(),this.clearScene(),this.renderer.dispose(),this.renderer.domElement.remove()}clearScene(){this.scene.children.slice().forEach(t=>{this.scene.remove(t),t.traverse(i=>{if(i.geometry&&i.geometry.dispose(),i.material){let r=Array.isArray(i.material)?i.material:[i.material];for(let s of r)s.dispose()}})}),this.pickables=[],this.cellMeshes=[],this.unitSprites=[],this.commandTargetSprites=[],this.outcomeFeedbackSprites=[],this.eventMarkerSprites=[],this.objectiveMarkerSprites=[],this.outpostFrontierBeaconSprites=[],this.generatedHudChromeSprites=[],this.generatedHudProfileSprites=[],this.generatedHudTextSprites=[],this.terrainUnderlayCount=0,this.surveyStrokeCount=0,this.markerCount=0,this.unitTokenCount=0,this.commandTargetCount=0,this.outcomeFeedbackCount=0,this.eventMarkerCount=0,this.objectiveMarkerCount=0,this.outpostFrontierBeaconCount=0,this.generatedHudChromeCount=0,this.generatedHudProfileCount=0,this.generatedHudTextCount=0,this.edgeFogCount=0,this.civicBeaconCount=0}onResize(){let e=this.hostNode.getBoundingClientRect(),t=Math.max(1,Math.floor(e.width)),i=Math.max(1,Math.floor(e.height));this.renderer.setSize(t,i,!1);let r=t/i,s=Yn/$n;if(r>=s){let a=$n*r;this.camera.left=a/-2,this.camera.right=a/2,this.camera.top=$n/2,this.camera.bottom=$n/-2}else{let a=Yn/r;this.camera.left=Yn/-2,this.camera.right=Yn/2,this.camera.top=a/2,this.camera.bottom=a/-2}this.applyCameraBounds(),this.render()}sync(e={},t="",i="",r=null){this.model=e&&typeof e=="object"?e:{},this.cells=Array.isArray(this.model.cells)?this.model.cells.filter(a=>a?.cellId):[],this.selectedCellId=String(t||this.selectedCellId||this.cells[0]?.cellId||"");let s=Array.isArray(this.model.units?.items)?this.model.units.items.filter(a=>a?.unitId):[];return this.selectedUnitId=String(i||this.selectedUnitId||s[0]?.unitId||""),this.outcomeFeedback=r&&typeof r=="object"?r:null,this.rebuild(),this.applyCameraBounds(),this.render(),this.info}rebuild(){this.clearScene();let e=gd(this.cells);this.mapBounds=e.bounds;let t=new ht(new en(Yn*1.35,$n*1.35),new Ft({map:ux(),transparent:!1}));t.position.set(0,0,-.8),this.scene.add(t),this.terrainUnderlayCount=0;let i=yd(e),r=new ht(new en(i.width,i.height),new Ft({map:mx(this.cells,e),transparent:!0,opacity:.94,depthWrite:!1}));r.position.set(i.centerX,i.centerY,-.62),r.userData={kind:"expedition_continuous_terrain_underlay",visualOnly:!0,serverOwnedCellsOnly:!0,hiddenTruthLeakage:!1},this.terrainUnderlayCount=1,this.scene.add(r);let s=Math.max(Yn,$n),a=[];for(let x=-6;x<=6;x+=1){let b=x*.9;a.push(new C(-s,b,-.42),new C(s,b,-.42)),a.push(new C(b,-s,-.42),new C(b,s,-.42))}let l=new pr(new ot().setFromPoints(a),new kt({color:1796708,transparent:!0,opacity:.1}));this.scene.add(l),this.edgeFogCount=0;let o=[{x:this.mapBounds.centerX,y:this.mapBounds.maxY+.52,rotation:0,width:this.mapBounds.width+2.9,kind:"soft"},{x:this.mapBounds.centerX,y:this.mapBounds.minY-.54,rotation:Math.PI,width:this.mapBounds.width+2.7,kind:"soft"},{x:this.mapBounds.minX-.56,y:this.mapBounds.centerY,rotation:Math.PI/2,width:this.mapBounds.height+2.5,kind:"locked"},{x:this.mapBounds.maxX+.62,y:this.mapBounds.centerY,rotation:-Math.PI/2,width:this.mapBounds.height+2.5,kind:"soft"}];for(let x of o){let b=new ht(new en(x.width,.64),new Ft({map:hx(x.kind),transparent:!0,opacity:x.kind==="locked"?.54:.42,depthWrite:!1}));b.position.set(x.x,x.y,-.26),b.rotation.z=x.rotation,this.edgeFogCount+=1,this.scene.add(b)}this.civicBeaconCount=0;let c=this.cells.filter(x=>["discovered","known"].includes(String(x.fogState||""))).slice(0,4);for(let x of c){let b=e.positions.get(String(x.cellId||""));if(!b)continue;let M=new wt(new Tt({map:gx(),transparent:!0,opacity:String(x.kind||"")==="origin_plot"?.82:.56,depthWrite:!1}));M.position.set(b.x+.36,b.y+.28,.1),M.scale.set(.62,.62,1),M.userData={kind:"expedition_civic_beacon_cue",visualOnly:!0,routeAuthority:!1,cellId:String(x.cellId||"")},this.civicBeaconCount+=1,this.scene.add(M)}this.surveyStrokeCount=0;for(let x=0;x<this.cells.length;x+=1)for(let b=x+1;b<this.cells.length;b+=1){let M=this.cells[x],A=this.cells[b];if(!Xc(M,A))continue;let E=yx(M,A,e);E&&(this.surveyStrokeCount+=1,this.scene.add(E))}let h=this.cells.filter(x=>!["discovered","known"].includes(String(x.fogState||"")));for(let x of h){let b=e.positions.get(String(x.cellId||""));if(!b)continue;let M=String(x.fogState||"locked_unknown"),A=new ht(new en(M==="locked_unknown"?xn*2.06:xn*1.86,M==="locked_unknown"?xn*2.06:xn*1.86),new Ft({map:lx(M==="locked_unknown"?"locked":"hinted"),transparent:!0,opacity:M==="locked_unknown"?.34:.42,depthWrite:!1}));A.position.set(b.x,b.y,.24),this.scene.add(A)}this.markerCount=0;for(let x of this.cells){let b=e.positions.get(String(x.cellId||""))||{x:0,y:0},M=String(x.cellId||"")===this.selectedCellId,A=String(x.cellId||"")===this.hoverCellId,E=_x(x,b,M,A);this.scene.add(E),E.traverse(I=>{I.userData?.kind==="expedition_cell"&&(this.pickables.push(I),this.cellMeshes.push(I))}),this.markerCount+=1}let d=new Map(this.cells.map(x=>[String(x.cellId||""),x])),u=this.model.objective&&typeof this.model.objective=="object"?this.model.objective:null;this.eventMarkerCount=0;for(let x of sx(this.model)){let b=xd(x),M=d.get(b),A=String(M?.fogState||"");if(!M||!["discovered","known"].includes(A))continue;let E=e.positions.get(b);if(!E)continue;let I=String(x.packetId||"")===String(u?.packetId||"")||String(b)===String(this.selectedCellId||""),y=Oi.event_packet,w=new wt(new Tt({map:ax(x,I),transparent:!0,depthWrite:!1,depthTest:!0,alphaTest:.03}));w.position.set(E.x-.36,E.y+.35,.47),w.scale.set(I?.48:.4,I?.48:.4,1),w.userData={kind:"expedition_event_packet_marker",packetId:String(x.packetId||""),cellId:b,templateId:String(x.templateId||x.kind||""),spriteAssetSlot:String(y.slot||""),spriteAssetPath:String(y.path||""),spriteAssetReady:!!Zn(y),visualOnly:!0,readOnly:!0,selectable:!0,inspectable:!0,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.pickables.push(w),this.eventMarkerSprites.push(w),this.eventMarkerCount+=1,this.scene.add(w)}if(this.objectiveMarkerCount=0,u&&String(u.mode||"read")!=="read"&&u.targetCellId){let x=String(u.targetCellId||""),b=d.get(x),M=e.positions.get(x);if(b&&M){let A=x===String(this.selectedCellId||""),E=String(u.mode||"")==="packet"?Oi.event_packet:Oi.objective_beacon,I=new wt(new Tt({map:ox(u,A),transparent:!0,depthWrite:!1,depthTest:!0,alphaTest:.03}));I.position.set(M.x+.38,M.y+.41,.5),I.scale.set(A?.56:.48,A?.56:.48,1),I.userData={kind:"expedition_objective_marker",mode:String(u.mode||""),cellId:x,targetCellId:x,packetId:String(u.packetId||""),spriteAssetSlot:String(E.slot||""),spriteAssetPath:String(E.path||""),spriteAssetReady:!!Zn(E),visualOnly:!0,readOnly:!0,selectable:!0,inspectable:!0,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.pickables.push(I),this.objectiveMarkerSprites.push(I),this.objectiveMarkerCount=1,this.scene.add(I)}}let f=Array.isArray(this.model.units?.items)?this.model.units.items.filter(x=>x?.unitId):[],g=f.find(x=>String(x.unitId||"")===String(this.selectedUnitId||""))||null;this.outpostFrontierBeaconCount=0;let v=Lx(g||{},d,this.cells);if(v){let x=Nx(v,e,String(v.targetCellId||"")===String(this.selectedCellId||""));x?.group&&(this.outpostFrontierBeaconSprites.push(x.ring),this.outpostFrontierBeaconCount=1,this.scene.add(x.group))}this.commandTargetCount=0;for(let x of Px(g||{},d)){let b=e.positions.get(String(x.cellId||""));if(!b)continue;let M=new wt(new Tt({map:Rx(x),transparent:!0,depthWrite:!1,depthTest:!0,alphaTest:.03,opacity:x.commandId==="scout_sector"?.92:.84}));M.position.set(b.x,b.y+.05,.515),M.scale.set(x.commandId==="scout_sector"?1.34:1.2,x.commandId==="scout_sector"?1.34:1.2,1),M.userData={kind:"expedition_command_target",unitId:x.unitId,unitType:x.unitType,commandId:x.commandId,cellId:x.cellId,fogState:x.fogState,serverMutationImplemented:x.serverMutationImplemented===!0,movementMutation:x.movementMutation===!0,visualOnly:!0,readOnly:!0,previewOnly:!0,selectable:!0,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.pickables.push(M),this.commandTargetSprites.push(M),this.commandTargetCount+=1,this.scene.add(M)}let p=this.outcomeFeedback;if(p?.cellId){let x=e.positions.get(String(p.cellId||""));if(x){let b=new wt(new Tt({map:Ix(p),transparent:!0,depthWrite:!1,depthTest:!0,alphaTest:.03,opacity:.92}));b.position.set(x.x,x.y+.05,.535),b.scale.set(1.48,1.48,1),b.userData={kind:"expedition_command_outcome_feedback",feedbackId:String(p.feedbackId||""),commandId:String(p.commandId||""),unitId:String(p.unitId||""),unitType:String(p.unitType||""),cellId:String(p.cellId||""),targetCellId:String(p.targetCellId||p.cellId||""),sourceCellId:String(p.sourceCellId||""),receiptId:String(p.receiptId||""),receiptKind:String(p.receiptKind||""),serverOwnedResult:p.serverOwnedResult===!0,visualOnly:!0,readOnly:!0,selectable:!1,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.outcomeFeedbackSprites.push(b),this.outcomeFeedbackCount=1,this.scene.add(b)}}this.unitTokenCount=0;let m=f.reduce((x,b)=>{let M=String(b.location?.cellId||"");return M&&(x[M]||(x[M]=[]),x[M].push(b)),x},{});for(let[x,b]of Object.entries(m)){let M=e.positions.get(x);M&&b.forEach((A,E)=>{let I=String(A.unitId||"")===this.selectedUnitId,y=$o(A),w=!!Zn(y),F=E/Math.max(1,b.length)*Math.PI*2-Math.PI/2,R=b.length>1?.26:0,O=new wt(new Tt({map:vx(A,I),transparent:!0,depthWrite:!1,depthTest:!0,alphaTest:.03}));O.position.set(M.x+Math.cos(F)*R,M.y+.44+Math.sin(F)*R*.36,.54+E*.01);let G=I?.72:.58;O.scale.set(G,G,1),O.userData={kind:"expedition_unit",unitId:String(A.unitId||""),unitType:String(A.unitType||""),displayName:String(A.displayName||""),cellId:x,spriteAssetSlot:String(y?.slot||""),spriteAssetPath:String(y?.path||""),spriteAssetReady:w,selectable:A.selectable!==!1,readOnly:A.readOnly!==!1,movementMutationImplemented:A.movement?.movementMutationImplemented===!0},this.pickables.push(O),this.unitSprites.push(O),this.unitTokenCount+=1,this.scene.add(O)})}this.addGeneratedHudChromeLayer(),this.addGeneratedHudContentLayer(),this.updateInfo()}visibleSize(){return{width:Math.max(.01,(this.camera.right-this.camera.left)/this.camera.zoom),height:Math.max(.01,(this.camera.top-this.camera.bottom)/this.camera.zoom)}}addGeneratedHudChromeLayer(){this.generatedHudChromeSprites=[],md(this.model).forEach((t,i)=>{let r=Ex(t);if(!r)return;let s=new wt(new Tt({map:r,transparent:!0,depthWrite:!1,depthTest:!1,opacity:_t(ve(t.opacity,.72)*.62,.16,.34),alphaTest:.02}));s.renderOrder=900+i,s.userData={kind:"expedition_generated_hud_chrome",packId:String(t.packId||this.model.generatedHudChrome?.packId||Ts),slot:String(t.slot||""),assetPath:String(t.path||""),anchor:String(t.anchor||""),widthRatio:ve(t.widthRatio,.2),heightRatio:ve(t.heightRatio,.16),marginX:ve(t.marginX,.02),marginY:ve(t.marginY,.02),assetReady:!0,cleanCompositeVersion:Dc,chromeSource:"three_canvas_clean_frame",sourceAssetPath:String(t.path||""),liveTextSource:"dom",visualOnly:!0,readOnly:!0,selectable:!1,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.generatedHudChromeSprites.push(s),this.scene.add(s)}),this.generatedHudChromeCount=this.generatedHudChromeSprites.length,this.syncGeneratedHudChromeSprites()}generatedHudBoundsForData(e={}){let t=this.visibleSize(),i=this.camera.position.x-t.width/2,r=this.camera.position.x+t.width/2,s=this.camera.position.y+t.height/2,a=this.camera.position.y-t.height/2,l=_t(ve(e.widthRatio,.2)*t.width,.35,t.width*.88),o=_t(ve(e.heightRatio,.16)*t.height,.26,t.height*.8),c=ve(e.marginX,.02)*t.width,h=ve(e.marginY,.02)*t.height,d=i+c+l/2,u=s-h-o/2;return e.anchor==="bottom-left"?u=a+h+o/2:e.anchor==="bottom-right"?(d=r-c-l/2,u=a+h+o/2):e.anchor==="right"?(d=r-c-l/2,u=s-h-o/2):e.anchor==="selected-command"&&(d=this.camera.position.x+t.width*.18,u=a+t.height*.28),{x:d,y:u,width:l,height:o,left:d-l/2,right:d+l/2,top:u+o/2,bottom:u-o/2}}generatedHudBoundsForSlot(e=""){let t=this.generatedHudChromeSprites.find(r=>String(r.userData?.slot||"")===String(e||""));if(t)return this.generatedHudBoundsForData(t.userData||{});let i=W_(e,this.model)||{};return this.generatedHudBoundsForData(i)}syncGeneratedHudChromeSprites(){this.generatedHudChromeSprites.length&&this.generatedHudChromeSprites.forEach(e=>{let t=this.generatedHudBoundsForData(e.userData||{});e.position.set(t.x,t.y,4.25),e.scale.set(t.width,t.height,1)})}addGeneratedHudContentLayer(){this.generatedHudProfileSprites=[],this.generatedHudTextSprites=[];let e=Array.isArray(this.model.units?.items)?this.model.units.items.filter(h=>h?.unitId).slice(0,6):[],t=e.find(h=>String(h.unitId||"")===String(this.selectedUnitId||""))||e[0]||null;e.forEach((h,d)=>{let u=String(h.unitId||"")===String(t?.unitId||""),f=$o(h),g=new wt(new Tt({map:bx(h,u),transparent:!0,depthWrite:!1,depthTest:!1,alphaTest:.04}));g.renderOrder=940+d,g.userData={kind:"expedition_generated_hud_profile_mask",layerVersion:Es,slot:"unit-profile",unitId:String(h.unitId||""),unitType:String(h.unitType||""),displayName:String(h.displayName||""),profileMask:"circle_alpha_clip",profileSource:"three_canvas_texture",spriteAssetSlot:String(f?.slot||""),spriteAssetPath:String(f?.path||""),spriteAssetReady:!!Zn(f),visualOnly:!0,readOnly:!0,selectable:!1,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.generatedHudProfileSprites.push(g),this.scene.add(g)}),this.generatedHudProfileCount=this.generatedHudProfileSprites.length;let i=Array.isArray(this.model.cells)?this.model.cells:[],r=i.find(h=>String(h.cellId||"")===String(this.selectedCellId||""))||i[0]||{},s=i.filter(h=>["known","discovered"].includes(String(h.fogState||""))).length,a=i.length-s,l=this.model.objective&&typeof this.model.objective=="object"?this.model.objective:{},o=t?Sx(t):0;[{slot:"crest-status",title:"EXPEDITION",meta:`${s} MAP / ${a} FOG`,tone:"light"},{slot:"objective-loop",title:Mx(this.model),meta:l.targetCellId?ld(l.targetCellId):"READY",tone:"dark"},{slot:"unit-dock",title:`${e.length} UNITS`,meta:t?Ko(t):"SELECT",tone:"dark"},{slot:"command-puck",title:o?`${o} CMD`:"CMD",meta:t?Ko(t):"READY",tone:"light"},{slot:"selected-context",title:ld(r.cellId||this.selectedCellId),meta:String(r.fogState||"sector").replace(/_/g," "),tone:"dark"}].forEach((h,d)=>{let u=new wt(new Tt({map:Tx(h),transparent:!0,depthWrite:!1,depthTest:!1,opacity:.88,alphaTest:.03}));u.renderOrder=960+d,u.userData={kind:"expedition_generated_hud_text",layerVersion:Es,slot:String(h.slot||""),title:String(h.title||""),meta:String(h.meta||""),liveTextSource:"three_canvas_texture",domA11yOverlayRetained:!0,visualOnly:!0,readOnly:!0,selectable:!1,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.generatedHudTextSprites.push(u),this.scene.add(u)}),this.generatedHudTextCount=this.generatedHudTextSprites.length,this.syncGeneratedHudContentSprites()}syncGeneratedHudContentSprites(){let e=this.generatedHudBoundsForSlot("unit-dock"),t=this.generatedHudProfileSprites,i=Number(this.canvas?.clientWidth||0)<=520;if(t.length){let r=i?_t(Math.min(e.height*.54,e.width/Math.max(4.4,t.length+1.8)),.42,.66):_t(Math.min(e.height*.46,e.width/Math.max(5.2,t.length+1.8)),.4,.78),s=i?_t(e.width*.14,r*1.1,r*1.5):_t(e.width*.115,r*1.18,r*1.72),a=e.left+e.width*(i?.5:.32),l=e.bottom+e.height*(i?.52:.5);t.forEach((o,c)=>{o.position.set(a+c*s,l,4.5+c*.004),o.scale.set(r,r,1)})}this.generatedHudTextSprites.forEach(r=>{let s=String(r.userData?.slot||""),a=this.generatedHudBoundsForSlot(s),l=a.width*.48,o=a.height*.46,c=a.left+a.width*.42,h=a.top-a.height*.5,d=a.width,u=a.height;s==="objective-loop"?(l=a.width*.68,o=a.height*.52,c=a.left+a.width*.54,h=a.top-a.height*.5):s==="unit-dock"?(l=a.width*(i?.34:.26),o=a.height*.46,c=a.left+a.width*(i?.34:.16),h=a.bottom+a.height*.56):s==="command-puck"?(a=this.generatedHudBoundsForSlot("command-tray"),l=a.width*.54,o=a.height*.58,c=a.left+a.width*.49,h=a.top-a.height*.48,d=a.width*.74,u=a.height*.78):s==="selected-context"&&(l=a.width*.72,o=a.height*.6,c=a.left+a.width*.56,h=a.top-a.height*.5),r.position.set(c,h,4.62),r.scale.set(_t(l,.58,d),_t(o,.24,u),1)})}applyCameraBounds(){let t=this.visibleSize(),i=this.mapBounds.minX-.85,r=this.mapBounds.maxX+.85,s=this.mapBounds.minY-.85,a=this.mapBounds.maxY+.85,l=Math.max(.01,r-i),o=Math.max(.01,a-s);this.camera.position.x=t.width>=l?(i+r)/2:_t(this.camera.position.x,i+t.width/2,r-t.width/2),this.camera.position.y=t.height>=o?(s+a)/2:_t(this.camera.position.y,s+t.height/2,a-t.height/2),this.camera.zoom=_t(this.camera.zoom,.85,3.4),this.camera.updateProjectionMatrix()}setZoom(e){this.camera.zoom=_t(e,.85,3.4),this.applyCameraBounds(),this.render(),this.notifyViewChange()}resetView(){this.camera.zoom=1,this.camera.position.x=this.mapBounds.centerX,this.camera.position.y=this.mapBounds.centerY,this.applyCameraBounds(),this.render(),this.notifyViewChange()}panBy(e,t){let i=this.renderer.domElement.getBoundingClientRect(),r=this.visibleSize();this.camera.position.x-=e/Math.max(1,i.width)*r.width,this.camera.position.y+=t/Math.max(1,i.height)*r.height,this.applyCameraBounds(),this.render(),this.notifyViewChange()}notifyViewChange(){this.hostNode.dispatchEvent(new CustomEvent("founders-plot-expedition-map-view-change"))}onWheel(e){e.preventDefault();let t=e.deltaY<0?1.13:1/1.13;this.setZoom(this.camera.zoom*t)}onPointerDown(e){this.activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});try{this.hostNode.setPointerCapture?.(e.pointerId)}catch{}if(this.dragging=!0,this.dragMoved=!1,this.lastPointer={x:e.clientX,y:e.clientY},this.hostNode.dataset.dragging="true",this.activePointers.size>=2){let t=Array.from(this.activePointers.values());this.pinchDistance=Math.hypot(t[0].x-t[1].x,t[0].y-t[1].y),this.pinchZoom=this.camera.zoom}}onPointerMove(e){if(!this.activePointers.has(e.pointerId)){this.setHoverFromPoint(e.clientX,e.clientY);return}let t=this.activePointers.get(e.pointerId);if(this.activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY}),this.activePointers.size>=2){let s=Array.from(this.activePointers.values()),a=Math.hypot(s[0].x-s[1].x,s[0].y-s[1].y);this.pinchDistance>0&&this.setZoom(this.pinchZoom*(a/this.pinchDistance)),this.dragMoved=!0;return}let i=e.clientX-t.x,r=e.clientY-t.y;Math.abs(i)+Math.abs(r)>1&&(this.dragMoved=this.dragMoved||Math.abs(e.clientX-(this.lastPointer?.x||e.clientX))+Math.abs(e.clientY-(this.lastPointer?.y||e.clientY))>4,this.panBy(i,r))}onPointerLeave(){this.setHoverCell("")}onPointerUp(e){let t=this.dragging&&!this.dragMoved&&this.activePointers.size<=1;this.activePointers.delete(e.pointerId);try{this.hostNode.releasePointerCapture?.(e.pointerId)}catch{}if(this.dragging=this.activePointers.size>0,this.dragging||(delete this.hostNode.dataset.dragging,this.pinchDistance=0),t){let i=this.pickFromPoint(e.clientX,e.clientY);if(i)if(i.userData?.kind==="expedition_unit"){let r=wx(i);this.selectedUnitId=r.unitId,r.cellId&&(this.selectedCellId=r.cellId),r.cellId&&this.setHoverCell(r.cellId),window.dispatchEvent(new CustomEvent("founders-plot-expedition-unit-select",{detail:r}))}else if(["expedition_event_packet_marker","expedition_objective_marker"].includes(String(i.userData?.kind||""))){let r=Ax(i);r.cellId&&(this.selectedCellId=r.cellId),r.cellId&&this.setHoverCell(r.cellId),window.dispatchEvent(new CustomEvent("founders-plot-expedition-map-select",{detail:r}))}else if(i.userData?.kind==="expedition_command_target"){let r=Cx(i);r.cellId&&(this.selectedCellId=r.cellId),r.cellId&&this.setHoverCell(r.cellId),window.dispatchEvent(new CustomEvent("founders-plot-expedition-command-target-preview",{detail:r}))}else{let r=Ux(i);this.selectedCellId=r.cellId,this.setHoverCell(r.cellId),window.dispatchEvent(new CustomEvent("founders-plot-expedition-map-select",{detail:r}))}}}setHoverFromPoint(e,t){let i=this.pickFromPoint(e,t);this.setHoverCell(i?.userData?.cellId||i?.userData?.targetCellId||"")}setHoverCell(e=""){let t=String(e||"");t!==this.hoverCellId&&(this.hoverCellId=t,t?this.hostNode.dataset.hoverCellId=t:delete this.hostNode.dataset.hoverCellId,this.rebuild(),this.render())}pickFromPoint(e,t){let i=this.renderer.domElement.getBoundingClientRect();return this.pointer.x=(e-i.left)/i.width*2-1,this.pointer.y=-((t-i.top)/i.height)*2+1,this.raycaster.setFromCamera(this.pointer,this.camera),this.raycaster.intersectObjects(this.pickables,!1)[0]?.object||null}canvasPointForCell(e){let t=this.cellMeshes.find(i=>String(i.userData?.cellId||"")===String(e||""));return t?this.canvasPointForObject(t):null}canvasPointForObject(e){if(!e)return null;let t=new C;e.getWorldPosition(t),t.project(this.camera);let i=this.renderer.domElement.getBoundingClientRect();return{x:(t.x+1)/2*i.width,y:(-t.y+1)/2*i.height}}updateInfo(){this.syncGeneratedHudChromeSprites(),this.syncGeneratedHudContentSprites();let e=this.renderer.domElement,t=this.cells.map(o=>{let c=String(o.fogState||"locked_unknown"),h=Jn(o),d=J_(o),u=Gc(o,h),f=Zn(u),g=Wo(o,h),v=Is(o),p=Mi(o)?null:Vc(o);return{cellId:String(o.cellId||""),fogState:c,siteType:String(o.siteType||""),kind:String(o.kind||""),publicTerrainText:d,publicTerrainAssetSlot:v,publicTerrainAssetSlotSource:String(o.publicTerrainAssetSlotSource||""),publicTerrainAssetSlotReason:String(o.publicTerrainAssetSlotReason||""),fogAssetSlot:p,terrainAssetContractVersion:String(o.terrainAssetContractVersion||""),terrain:h,runtimeAssetPack:ed,assetSlot:u?.slot||null,assetPath:u?.path||null,assetKind:u?.assetKind||null,fogOnly:u?.fogOnly===!0,assetReady:!!f,assetAllowedByServerTruth:Q_(o,h,u),underlayTerrain:g.terrain,underlayFogOnly:g.fogOnly===!0,waterCue:h==="water",ruinSignalCue:h==="ruin_signal",hiddenSpecificitySuppressed:!Mi(o)&&h===c}}),i=Array.from(new Map([...Object.values(pd),...Object.values(Oi)].map(o=>[o.path,o])).values()),r=i.filter(o=>!!Jo(o)).length,s=this.generatedHudChromeSprites.map(o=>({slot:String(o.userData?.slot||""),packId:String(o.userData?.packId||""),assetPath:String(o.userData?.assetPath||""),anchor:String(o.userData?.anchor||""),assetReady:o.userData?.assetReady===!0,cleanCompositeVersion:String(o.userData?.cleanCompositeVersion||""),chromeSource:String(o.userData?.chromeSource||""),sourceAssetPath:String(o.userData?.sourceAssetPath||""),liveTextSource:String(o.userData?.liveTextSource||""),visualOnly:o.userData?.visualOnly===!0,readOnly:o.userData?.readOnly===!0,selectable:o.userData?.selectable===!0,routeAuthority:o.userData?.routeAuthority===!0,actionAuthority:o.userData?.actionAuthority===!0,executableActions:Number(o.userData?.executableActions||0),canvas:this.canvasPointForObject(o)})),a=this.generatedHudProfileSprites.map(o=>({slot:String(o.userData?.slot||""),layerVersion:String(o.userData?.layerVersion||""),unitId:String(o.userData?.unitId||""),unitType:String(o.userData?.unitType||""),profileMask:String(o.userData?.profileMask||""),profileSource:String(o.userData?.profileSource||""),spriteAssetSlot:String(o.userData?.spriteAssetSlot||""),spriteAssetPath:String(o.userData?.spriteAssetPath||""),spriteAssetReady:o.userData?.spriteAssetReady===!0,visualOnly:o.userData?.visualOnly===!0,readOnly:o.userData?.readOnly===!0,selectable:o.userData?.selectable===!0,routeAuthority:o.userData?.routeAuthority===!0,actionAuthority:o.userData?.actionAuthority===!0,executableActions:Number(o.userData?.executableActions||0),canvas:this.canvasPointForObject(o)})),l=this.generatedHudTextSprites.map(o=>({slot:String(o.userData?.slot||""),layerVersion:String(o.userData?.layerVersion||""),title:String(o.userData?.title||""),meta:String(o.userData?.meta||""),liveTextSource:String(o.userData?.liveTextSource||""),domA11yOverlayRetained:o.userData?.domA11yOverlayRetained===!0,visualOnly:o.userData?.visualOnly===!0,readOnly:o.userData?.readOnly===!0,selectable:o.userData?.selectable===!0,routeAuthority:o.userData?.routeAuthority===!0,actionAuthority:o.userData?.actionAuthority===!0,executableActions:Number(o.userData?.executableActions||0),canvas:this.canvasPointForObject(o)}));return this.info={renderer:"three.js",surface:"expedition-map",projectionHash:String(this.model?.projectionHash||""),canvasWidth:e.width,canvasHeight:e.height,cellCount:this.cells.length,selectedCellId:String(this.selectedCellId||""),hoverCellId:String(this.hoverCellId||""),zoom:Number(this.camera.zoom.toFixed(3)),visualShell:Gt,visualLayers:{terrainTexture:!0,runtimeRegionAssetPack:ed,runtimeRegionAtlas:`${bi}/manifest.json`,runtimeTerrainUnderlay:fd.path,runtimeSpriteAssetPack:V_,runtimeSpriteAtlas:`${Ln}/manifest.json`,generatedSpriteAssets:!0,generatedSpriteAssetCount:i.length,generatedSpriteAssetsReady:r,generatedSpriteAssetsVisualOnly:!0,generatedSpriteAssetsReadOnly:!0,generatedHudChrome:!0,generatedHudChromeInThreeLayer:!0,generatedHudChromeAssetPack:String(this.model.generatedHudChrome?.packId||Ts),generatedHudChromeManifest:`${Si}/manifest.json`,generatedHudChromeSpriteCount:s.length,generatedHudChromeAssetsReady:s.filter(o=>o.assetReady).length,generatedHudChromeCleanComposite:!0,generatedHudChromeCleanCompositeVersion:Dc,generatedHudChromeSourcePackRetained:s.every(o=>o.sourceAssetPath.includes(`/${Ts}/`)),generatedHudChromePaintedSourceCrops:s.some(o=>o.chromeSource!=="three_canvas_clean_frame"),generatedHudChromeSpritesVisualOnly:s.every(o=>o.visualOnly),generatedHudChromeSpritesReadOnly:s.every(o=>o.readOnly),generatedHudChromeSpritesSelectable:s.some(o=>o.selectable),generatedHudChromeAuthority:s.some(o=>o.routeAuthority||o.actionAuthority||o.executableActions>0),generatedHudMaskLayerVersion:Es,generatedHudProfileMasks:!0,generatedHudProfileMasksInThreeLayer:!0,generatedHudProfileMaskSpriteCount:a.length,generatedHudProfileMaskSpriteAssetsReady:a.filter(o=>o.spriteAssetReady).length,generatedHudProfileMaskType:"circle_alpha_clip",generatedHudProfileMasksVisualOnly:a.every(o=>o.visualOnly),generatedHudProfileMasksReadOnly:a.every(o=>o.readOnly),generatedHudProfileMasksSelectable:a.some(o=>o.selectable),generatedHudProfileMaskAuthority:a.some(o=>o.routeAuthority||o.actionAuthority||o.executableActions>0),generatedHudTextInThreeLayer:!0,generatedHudTextSpriteCount:l.length,generatedHudTextLiveSource:"three_canvas_texture",generatedHudTextDomA11yOverlayRetained:l.every(o=>o.domA11yOverlayRetained),generatedHudTextSpritesVisualOnly:l.every(o=>o.visualOnly),generatedHudTextSpritesReadOnly:l.every(o=>o.readOnly),generatedHudTextSpritesSelectable:l.some(o=>o.selectable),generatedHudTextAuthority:l.some(o=>o.routeAuthority||o.actionAuthority||o.executableActions>0),serverTerrainAssetContractVersion:Lc,serverTerrainSlotSource:Fc,assetBackedRegionTiles:t.filter(o=>o.assetPath).length,assetBackedLoadedTiles:t.filter(o=>o.assetReady).length,assetBackedTerrainTextures:!0,continuousTerrainUnderlay:!0,continuousTerrainUnderlayVersion:Gt,continuousUnderlayUsesServerOwnedCells:!0,continuousUnderlayHiddenCellsFogOnly:t.filter(o=>!["discovered","known"].includes(o.fogState)).every(o=>o.underlayFogOnly&&o.underlayTerrain===o.fogState),continuousUnderlayVisualOnly:!0,plateBlendLayer:!0,softRegionSeams:!0,reducedPlateEdgeContrast:!0,centerTileMutedForUnderlay:!0,cartographicFogDepth:!0,ambientContourField:!0,fogDepthGlyphsVisualOnly:!0,terrainUnderlayCount:this.terrainUnderlayCount,proceduralFallbackWhenAssetPending:!0,candidate02Cues:!0,agentTownIdentityCues:!0,scoutLedgerHud:!0,mapFirstHudOverlays:!0,hoverAffordance:!0,selectedSectorOutline:!0,beaconPlanWagonCues:!0,homeNodeEmphasis:!0,riverFlatCues:!0,waterCuesServerGated:!0,woodlandRidgeCues:!0,ruinSignalCues:!0,ruinSignalCuesServerGated:!0,lockedUnknownSealedFogOnly:!0,hintedAbstractFogEdge:!0,frontierBoundaryDashes:!0,frontierBoundaryVisualOnly:!0,fogVeils:this.cells.filter(o=>!["discovered","known"].includes(String(o.fogState||""))).length,edgeFogCount:this.edgeFogCount,civicBeaconCount:this.civicBeaconCount,surveyStrokeCount:this.surveyStrokeCount,surveyStrokesVisualOnly:!0,receiptTraceVisualOnly:!0,markerCount:this.markerCount,eventPacketMarkers:!0,eventPacketMarkerCount:this.eventMarkerCount,objectiveMarkers:!0,objectiveMarkerCount:this.objectiveMarkerCount,eventObjectiveMarkersVisualOnly:[...this.eventMarkerSprites,...this.objectiveMarkerSprites].every(o=>o.userData?.visualOnly===!0),eventObjectiveMarkersReadOnly:[...this.eventMarkerSprites,...this.objectiveMarkerSprites].every(o=>o.userData?.readOnly===!0),eventObjectiveMarkersInspectable:[...this.eventMarkerSprites,...this.objectiveMarkerSprites].every(o=>o.userData?.selectable===!0&&o.userData?.inspectable===!0),eventObjectiveMarkerAuthority:!1,outpostNextFrontierBeacon:!0,outpostNextFrontierBeaconCount:this.outpostFrontierBeaconCount,outpostNextFrontierBeaconVisualOnly:this.outpostFrontierBeaconSprites.every(o=>o.userData?.visualOnly===!0),outpostNextFrontierBeaconReadOnly:this.outpostFrontierBeaconSprites.every(o=>o.userData?.readOnly===!0),outpostNextFrontierBeaconSelectable:this.outpostFrontierBeaconSprites.some(o=>o.userData?.selectable===!0),outpostNextFrontierBeaconAuthority:!1,outpostNextFrontierBeaconHiddenTruthLeakage:this.outpostFrontierBeaconSprites.some(o=>o.userData?.hiddenTruthLeakage===!0),unitTokens:!0,unitTokenCount:this.unitTokenCount,unitTokensReadOnly:this.unitSprites.every(o=>o.userData?.readOnly===!0),unitMovementMutationImplemented:this.unitSprites.some(o=>o.userData?.movementMutationImplemented===!0),commandTargetRings:!0,commandTargetCount:this.commandTargetCount,commandTargetRingsVisualOnly:this.commandTargetSprites.every(o=>o.userData?.visualOnly===!0),commandTargetRingsReadOnly:this.commandTargetSprites.every(o=>o.userData?.readOnly===!0),commandTargetRingsSelectable:this.commandTargetSprites.every(o=>o.userData?.selectable===!0),commandTargetRingsPreviewOnly:this.commandTargetSprites.every(o=>o.userData?.previewOnly===!0),commandTargetRingAuthority:!1,commandOutcomeFeedback:this.outcomeFeedbackCount>0,commandOutcomeFeedbackCount:this.outcomeFeedbackCount,commandOutcomeFeedbackVisualOnly:this.outcomeFeedbackSprites.every(o=>o.userData?.visualOnly===!0),commandOutcomeFeedbackReadOnly:this.outcomeFeedbackSprites.every(o=>o.userData?.readOnly===!0),commandOutcomeFeedbackServerOwned:this.outcomeFeedbackSprites.every(o=>o.userData?.serverOwnedResult===!0),commandOutcomeFeedbackSelectable:this.outcomeFeedbackSprites.some(o=>o.userData?.selectable===!0),commandOutcomeFeedbackAuthority:!1,clientAuthority:!1},generatedHudChromeSprites:s,generatedHudProfileSprites:a,generatedHudTextSprites:l,regionConsistency:{waterCueCells:t.filter(o=>o.waterCue).map(o=>o.cellId),ruinSignalCueCells:t.filter(o=>o.ruinSignalCue).map(o=>o.cellId),lockedUnknownCellsSealed:t.filter(o=>o.fogState==="locked_unknown").every(o=>o.hiddenSpecificitySuppressed&&!o.waterCue&&!o.ruinSignalCue),hintedCellsAbstract:t.filter(o=>o.fogState==="hinted").every(o=>o.hiddenSpecificitySuppressed&&!o.waterCue&&!o.ruinSignalCue),waterCuesRequireServerOwnedWater:t.filter(o=>o.waterCue).every(o=>o.publicTerrainAssetSlot==="water"),waterCoastRuntimeAssetsBlocked:t.every(o=>!["water","coast"].includes(String(o.assetSlot||""))),hiddenCellsHaveNoPublicTerrainSlot:t.filter(o=>!["discovered","known"].includes(o.fogState)).every(o=>o.publicTerrainAssetSlot==null),hiddenCellsUseOnlyFogAssets:t.filter(o=>!["discovered","known"].includes(o.fogState)).every(o=>["hinted_frontier_fog","locked_unknown_fog"].includes(String(o.assetSlot||""))&&o.fogOnly===!0&&o.assetKind==="fog_only"),knownDiscoveredAssetsMatchServerTerrain:t.filter(o=>["discovered","known"].includes(o.fogState)&&o.assetPath).every(o=>o.assetAllowedByServerTruth===!0),visibleAssetsMatchPublicTerrainSlot:t.filter(o=>["discovered","known"].includes(o.fogState)&&o.assetPath).every(o=>o.assetSlot===o.publicTerrainAssetSlot&&o.assetKind==="concrete_public_terrain"),serverTerrainAssetContractComplete:t.every(o=>o.terrainAssetContractVersion===Lc&&(["discovered","known"].includes(o.fogState)?o.publicTerrainAssetSlotSource===Fc:o.fogAssetSlot!=null)),runtimeAssetProofMetadataComplete:t.filter(o=>o.assetPath).every(o=>o.cellId&&o.fogState&&o.runtimeAssetPack&&o.assetSlot&&o.assetKind&&typeof o.assetAllowedByServerTruth=="boolean"),runtimeAssetCellsRegionTruthBound:t.filter(o=>o.assetPath).every(o=>o.assetAllowedByServerTruth===!0),continuousUnderlayHiddenCellsFogOnly:t.filter(o=>!["discovered","known"].includes(o.fogState)).every(o=>o.underlayFogOnly&&o.underlayTerrain===o.fogState),continuousUnderlayNoActionAuthority:this.terrainUnderlayCount===1},regionVisuals:t,eventMarkers:this.eventMarkerSprites.map(o=>({packetId:String(o.userData?.packetId||""),cellId:String(o.userData?.cellId||""),templateId:String(o.userData?.templateId||""),spriteAssetSlot:String(o.userData?.spriteAssetSlot||""),spriteAssetPath:String(o.userData?.spriteAssetPath||""),spriteAssetReady:o.userData?.spriteAssetReady===!0,visualOnly:o.userData?.visualOnly===!0,readOnly:o.userData?.readOnly===!0,selectable:o.userData?.selectable===!0,inspectable:o.userData?.inspectable===!0,routeAuthority:o.userData?.routeAuthority===!0,actionAuthority:o.userData?.actionAuthority===!0,executableActions:Number(o.userData?.executableActions||0),canvas:this.canvasPointForObject(o)})),objectiveMarkers:this.objectiveMarkerSprites.map(o=>({mode:String(o.userData?.mode||""),targetCellId:String(o.userData?.targetCellId||""),packetId:String(o.userData?.packetId||""),spriteAssetSlot:String(o.userData?.spriteAssetSlot||""),spriteAssetPath:String(o.userData?.spriteAssetPath||""),spriteAssetReady:o.userData?.spriteAssetReady===!0,visualOnly:o.userData?.visualOnly===!0,readOnly:o.userData?.readOnly===!0,selectable:o.userData?.selectable===!0,inspectable:o.userData?.inspectable===!0,routeAuthority:o.userData?.routeAuthority===!0,actionAuthority:o.userData?.actionAuthority===!0,executableActions:Number(o.userData?.executableActions||0),canvas:this.canvasPointForObject(o)})),outpostNextFrontierBeacons:this.outpostFrontierBeaconSprites.map(o=>({unitId:String(o.userData?.unitId||""),unitType:String(o.userData?.unitType||""),commandId:String(o.userData?.commandId||""),cueLabel:String(o.userData?.cueLabel||""),originCellId:String(o.userData?.originCellId||""),targetCellId:String(o.userData?.targetCellId||""),targetFogState:String(o.userData?.targetFogState||""),targetKind:String(o.userData?.targetKind||""),derivedFrom:String(o.userData?.derivedFrom||""),visualOnly:o.userData?.visualOnly===!0,readOnly:o.userData?.readOnly===!0,selectable:o.userData?.selectable===!0,routeAuthority:o.userData?.routeAuthority===!0,actionAuthority:o.userData?.actionAuthority===!0,executableActions:Number(o.userData?.executableActions||0),hiddenTruthLeakage:o.userData?.hiddenTruthLeakage===!0,canvas:this.canvasPointForObject(o)})),units:this.unitSprites.map(o=>({unitId:String(o.userData?.unitId||""),unitType:String(o.userData?.unitType||""),displayName:String(o.userData?.displayName||""),cellId:String(o.userData?.cellId||""),spriteAssetSlot:String(o.userData?.spriteAssetSlot||""),spriteAssetPath:String(o.userData?.spriteAssetPath||""),spriteAssetReady:o.userData?.spriteAssetReady===!0,selected:String(o.userData?.unitId||"")===String(this.selectedUnitId||""),readOnly:o.userData?.readOnly===!0,movementMutationImplemented:o.userData?.movementMutationImplemented===!0,canvas:this.canvasPointForObject(o)})),commandTargets:this.commandTargetSprites.map(o=>({unitId:String(o.userData?.unitId||""),unitType:String(o.userData?.unitType||""),commandId:String(o.userData?.commandId||""),cellId:String(o.userData?.cellId||""),fogState:String(o.userData?.fogState||""),serverMutationImplemented:o.userData?.serverMutationImplemented===!0,movementMutation:o.userData?.movementMutation===!0,visualOnly:o.userData?.visualOnly===!0,readOnly:o.userData?.readOnly===!0,previewOnly:o.userData?.previewOnly===!0,selectable:o.userData?.selectable===!0,routeAuthority:o.userData?.routeAuthority===!0,actionAuthority:o.userData?.actionAuthority===!0,executableActions:Number(o.userData?.executableActions||0),canvas:this.canvasPointForObject(o)})),commandOutcomeFeedback:this.outcomeFeedbackSprites.map(o=>({feedbackId:String(o.userData?.feedbackId||""),unitId:String(o.userData?.unitId||""),unitType:String(o.userData?.unitType||""),commandId:String(o.userData?.commandId||""),cellId:String(o.userData?.cellId||""),targetCellId:String(o.userData?.targetCellId||""),sourceCellId:String(o.userData?.sourceCellId||""),receiptId:String(o.userData?.receiptId||""),receiptKind:String(o.userData?.receiptKind||""),serverOwnedResult:o.userData?.serverOwnedResult===!0,visualOnly:o.userData?.visualOnly===!0,readOnly:o.userData?.readOnly===!0,selectable:o.userData?.selectable===!0,routeAuthority:o.userData?.routeAuthority===!0,actionAuthority:o.userData?.actionAuthority===!0,executableActions:Number(o.userData?.executableActions||0),canvas:this.canvasPointForObject(o)})),camera:{x:Number(this.camera.position.x.toFixed(3)),y:Number(this.camera.position.y.toFixed(3)),zoom:Number(this.camera.zoom.toFixed(3))},bounds:{minX:Number(this.mapBounds.minX.toFixed(3)),maxX:Number(this.mapBounds.maxX.toFixed(3)),minY:Number(this.mapBounds.minY.toFixed(3)),maxY:Number(this.mapBounds.maxY.toFixed(3))},fogStates:this.cells.reduce((o,c)=>{let h=String(c.fogState||"locked_unknown");return o[h]=Number(o[h]||0)+1,o},{}),pickTargets:this.cells.map(o=>({cellId:String(o.cellId||""),fogState:String(o.fogState||""),terrain:Jn(o),status:String(o.status||""),title:String(o.title||""),canvas:this.canvasPointForCell(o.cellId)}))},this.info}render(){this.updateInfo(),this.renderer.render(this.scene,this.camera)}};function Ox(n,e,t){let i=Ic.get(n);return i||(i=new Pc(n),Ic.set(n,i)),i.attach(e),i.sync(t||{}),i.info}function kx(n){let e=Ic.get(n);return e?e.updateInfo():null}function Bx(n,e={},t={}){let i=Bi.get(n);return i||(i=new Bc(n),Bi.set(n,i)),i.sync(e||{},t.selectedCellId||"",t.selectedUnitId||"",t.outcomeFeedback||null)}function zx(n){let e=Bi.get(n);return e?e.updateInfo():null}function Hx(n,e=1){let t=Bi.get(n);return t?(t.setZoom(t.camera.zoom*ve(e,1)),t.updateInfo()):null}function Vx(n){let e=Bi.get(n);return e?(e.resetView(),e.updateInfo()):null}function Gx(n){let e=Bi.get(n);e&&(e.dispose(),Bi.delete(n))}window.FoundersPlotThreeRenderer={renderPlotScene:Ox,getPlotSceneInfo:kx,renderExpeditionMap:Bx,getExpeditionMapInfo:zx,zoomExpeditionMap:Hx,resetExpeditionMapCamera:Vx,disposeExpeditionMap:Gx};})();
