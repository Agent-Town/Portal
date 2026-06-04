var FoundersPlotThreeBundle=(()=>{var Oh=0,Vl=1,Uh=2;var ds=1,kh=2,Tr=3,Wn=0,Vt=1,Bt=2,In=0,Pi=1,Gl=2,Wl=3,Xl=4,Bh=5;var li=100,Hh=101,zh=102,Vh=103,Gh=104,Wh=200,Xh=201,qh=202,Yh=203,ha=204,ua=205,$h=206,Zh=207,Kh=208,Jh=209,jh=210,Qh=211,eu=212,tu=213,nu=214,da=0,fa=1,pa=2,Di=3,ma=4,ga=5,_a=6,ya=7,ql=0,iu=1,ru=2,mn=0,Yl=1,$l=2,Zl=3,Kl=4,Jl=5,jl=6,Ql=7;var ec=300,gi=301,Oi=302,ja=303,Qa=304,fs=306,xa=1e3,Jt=1001,va=1002,Dt=1003,su=1004;var ps=1005;var Se=1006,eo=1007;var gn=1008;var rn=1009,tc=1010,nc=1011,Er=1012,to=1013,_n=1014,yn=1015,Pn=1016,no=1017,io=1018,wr=1020,ic=35902,rc=35899,sc=1021,ac=1022,ln=1023,wn=1026,_i=1027,oc=1028,ro=1029,yi=1030,so=1031;var ao=1033,ms=33776,gs=33777,_s=33778,ys=33779,oo=35840,lo=35841,co=35842,ho=35843,uo=36196,fo=37492,po=37496,mo=37488,go=37489,xs=37490,_o=37491,yo=37808,xo=37809,vo=37810,So=37811,bo=37812,Mo=37813,To=37814,Eo=37815,wo=37816,Ao=37817,Co=37818,Ro=37819,Io=37820,Po=37821,Do=36492,Lo=36494,Fo=36495,No=36283,Oo=36284,vs=36285,Uo=36286;var zr=2300,Sa=2301,la=2302,Il=2303,Pl=2400,Dl=2401,Ll=2402;var au=3200;var lc=0,ou=1,Yn="",Be="srgb",Vr="srgb-linear",Gr="linear",Je="srgb";var Ii=7680;var Fl=519,lu=512,cu=513,hu=514,ko=515,uu=516,du=517,Bo=518,fu=519,ba=35044;var cc="300 es",dn=2e3,Wr=2001;function Ud(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function kd(n){return ArrayBuffer.isView(n)&&!(n instanceof DataView)}function cr(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function pu(){let n=cr("canvas");return n.style.display="block",n}var ih={},hr=null;function Xr(...n){let e="THREE."+n.shift();hr?hr("log",e,...n):console.log(e,...n)}function mu(n){let e=n[0];if(typeof e=="string"&&e.startsWith("TSL:")){let t=n[1];t&&t.isStackTrace?n[0]+=" "+t.getLocation():n[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return n}function Ce(...n){n=mu(n);let e="THREE."+n.shift();if(hr)hr("warn",e,...n);else{let t=n[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...n)}}function Re(...n){n=mu(n);let e="THREE."+n.shift();if(hr)hr("error",e,...n);else{let t=n[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...n)}}function Ma(...n){let e=n.join(" ");e in ih||(ih[e]=!0,Ce(...n))}function gu(n,e,t){return new Promise(function(i,r){function s(){switch(n.clientWaitSync(e,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:r();break;case n.TIMEOUT_EXPIRED:setTimeout(s,t);break;default:i()}}setTimeout(s,t)})}var _u={[da]:fa,[pa]:_a,[ma]:ya,[Di]:ga,[fa]:da,[_a]:pa,[ya]:ma,[ga]:Di},An=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){let i=this._listeners;return i===void 0?!1:i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){let i=this._listeners;if(i===void 0)return;let r=i[e];if(r!==void 0){let s=r.indexOf(t);s!==-1&&r.splice(s,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let i=t[e.type];if(i!==void 0){e.target=this;let r=i.slice(0);for(let s=0,a=r.length;s<a;s++)r[s].call(this,e);e.target=null}}},Ut=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var nl=Math.PI/180,Ta=180/Math.PI;function Vn(){let n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Ut[n&255]+Ut[n>>8&255]+Ut[n>>16&255]+Ut[n>>24&255]+"-"+Ut[e&255]+Ut[e>>8&255]+"-"+Ut[e>>16&15|64]+Ut[e>>24&255]+"-"+Ut[t&63|128]+Ut[t>>8&255]+"-"+Ut[t>>16&255]+Ut[t>>24&255]+Ut[i&255]+Ut[i>>8&255]+Ut[i>>16&255]+Ut[i>>24&255]).toLowerCase()}function Ge(n,e,t){return Math.max(e,Math.min(t,n))}function Bd(n,e){return(n%e+e)%e}function il(n,e,t){return(1-t)*n+t*e}function En(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("Invalid component type.")}}function nt(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("Invalid component type.")}}var ye=class n{static{n.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,i=this.y,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6],this.y=r[1]*t+r[4]*i+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Ge(this.x,e.x,t.x),this.y=Ge(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=Ge(this.x,e,t),this.y=Ge(this.y,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Ge(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(Ge(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let i=Math.cos(t),r=Math.sin(t),s=this.x-e.x,a=this.y-e.y;return this.x=s*i-a*r+e.x,this.y=s*r+a*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Cn=class{constructor(e=0,t=0,i=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=r}static slerpFlat(e,t,i,r,s,a,o){let c=i[r+0],h=i[r+1],u=i[r+2],d=i[r+3],l=s[a+0],f=s[a+1],g=s[a+2],v=s[a+3];if(d!==v||c!==l||h!==f||u!==g){let p=c*l+h*f+u*g+d*v;p<0&&(l=-l,f=-f,g=-g,v=-v,p=-p);let m=1-o;if(p<.9995){let _=Math.acos(p),x=Math.sin(_);m=Math.sin(m*_)/x,o=Math.sin(o*_)/x,c=c*m+l*o,h=h*m+f*o,u=u*m+g*o,d=d*m+v*o}else{c=c*m+l*o,h=h*m+f*o,u=u*m+g*o,d=d*m+v*o;let _=1/Math.sqrt(c*c+h*h+u*u+d*d);c*=_,h*=_,u*=_,d*=_}}e[t]=c,e[t+1]=h,e[t+2]=u,e[t+3]=d}static multiplyQuaternionsFlat(e,t,i,r,s,a){let o=i[r],c=i[r+1],h=i[r+2],u=i[r+3],d=s[a],l=s[a+1],f=s[a+2],g=s[a+3];return e[t]=o*g+u*d+c*f-h*l,e[t+1]=c*g+u*l+h*d-o*f,e[t+2]=h*g+u*f+o*l-c*d,e[t+3]=u*g-o*d-c*l-h*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,r){return this._x=e,this._y=t,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let i=e._x,r=e._y,s=e._z,a=e._order,o=Math.cos,c=Math.sin,h=o(i/2),u=o(r/2),d=o(s/2),l=c(i/2),f=c(r/2),g=c(s/2);switch(a){case"XYZ":this._x=l*u*d+h*f*g,this._y=h*f*d-l*u*g,this._z=h*u*g+l*f*d,this._w=h*u*d-l*f*g;break;case"YXZ":this._x=l*u*d+h*f*g,this._y=h*f*d-l*u*g,this._z=h*u*g-l*f*d,this._w=h*u*d+l*f*g;break;case"ZXY":this._x=l*u*d-h*f*g,this._y=h*f*d+l*u*g,this._z=h*u*g+l*f*d,this._w=h*u*d-l*f*g;break;case"ZYX":this._x=l*u*d-h*f*g,this._y=h*f*d+l*u*g,this._z=h*u*g-l*f*d,this._w=h*u*d+l*f*g;break;case"YZX":this._x=l*u*d+h*f*g,this._y=h*f*d+l*u*g,this._z=h*u*g-l*f*d,this._w=h*u*d-l*f*g;break;case"XZY":this._x=l*u*d-h*f*g,this._y=h*f*d-l*u*g,this._z=h*u*g+l*f*d,this._w=h*u*d+l*f*g;break;default:Ce("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let i=t/2,r=Math.sin(i);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,i=t[0],r=t[4],s=t[8],a=t[1],o=t[5],c=t[9],h=t[2],u=t[6],d=t[10],l=i+o+d;if(l>0){let f=.5/Math.sqrt(l+1);this._w=.25/f,this._x=(u-c)*f,this._y=(s-h)*f,this._z=(a-r)*f}else if(i>o&&i>d){let f=2*Math.sqrt(1+i-o-d);this._w=(u-c)/f,this._x=.25*f,this._y=(r+a)/f,this._z=(s+h)/f}else if(o>d){let f=2*Math.sqrt(1+o-i-d);this._w=(s-h)/f,this._x=(r+a)/f,this._y=.25*f,this._z=(c+u)/f}else{let f=2*Math.sqrt(1+d-i-o);this._w=(a-r)/f,this._x=(s+h)/f,this._y=(c+u)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<1e-8?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Ge(this.dot(e),-1,1)))}rotateTowards(e,t){let i=this.angleTo(e);if(i===0)return this;let r=Math.min(1,t/i);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let i=e._x,r=e._y,s=e._z,a=e._w,o=t._x,c=t._y,h=t._z,u=t._w;return this._x=i*u+a*o+r*h-s*c,this._y=r*u+a*c+s*o-i*h,this._z=s*u+a*h+i*c-r*o,this._w=a*u-i*o-r*c-s*h,this._onChangeCallback(),this}slerp(e,t){let i=e._x,r=e._y,s=e._z,a=e._w,o=this.dot(e);o<0&&(i=-i,r=-r,s=-s,a=-a,o=-o);let c=1-t;if(o<.9995){let h=Math.acos(o),u=Math.sin(h);c=Math.sin(c*h)/u,t=Math.sin(t*h)/u,this._x=this._x*c+i*t,this._y=this._y*c+r*t,this._z=this._z*c+s*t,this._w=this._w*c+a*t,this._onChangeCallback()}else this._x=this._x*c+i*t,this._y=this._y*c+r*t,this._z=this._z*c+s*t,this._w=this._w*c+a*t,this.normalize();return this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),r=Math.sqrt(1-i),s=Math.sqrt(i);return this.set(r*Math.sin(e),r*Math.cos(e),s*Math.sin(t),s*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},C=class n{static{n.prototype.isVector3=!0}constructor(e=0,t=0,i=0){this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(rh.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(rh.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[3]*i+s[6]*r,this.y=s[1]*t+s[4]*i+s[7]*r,this.z=s[2]*t+s[5]*i+s[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,i=this.y,r=this.z,s=e.elements,a=1/(s[3]*t+s[7]*i+s[11]*r+s[15]);return this.x=(s[0]*t+s[4]*i+s[8]*r+s[12])*a,this.y=(s[1]*t+s[5]*i+s[9]*r+s[13])*a,this.z=(s[2]*t+s[6]*i+s[10]*r+s[14])*a,this}applyQuaternion(e){let t=this.x,i=this.y,r=this.z,s=e.x,a=e.y,o=e.z,c=e.w,h=2*(a*r-o*i),u=2*(o*t-s*r),d=2*(s*i-a*t);return this.x=t+c*h+a*d-o*u,this.y=i+c*u+o*h-s*d,this.z=r+c*d+s*u-a*h,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[4]*i+s[8]*r,this.y=s[1]*t+s[5]*i+s[9]*r,this.z=s[2]*t+s[6]*i+s[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Ge(this.x,e.x,t.x),this.y=Ge(this.y,e.y,t.y),this.z=Ge(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=Ge(this.x,e,t),this.y=Ge(this.y,e,t),this.z=Ge(this.z,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Ge(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let i=e.x,r=e.y,s=e.z,a=t.x,o=t.y,c=t.z;return this.x=r*c-s*o,this.y=s*a-i*c,this.z=i*o-r*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return rl.copy(this).projectOnVector(e),this.sub(rl)}reflect(e){return this.sub(rl.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(Ge(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y,r=this.z-e.z;return t*t+i*i+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){let r=Math.sin(t)*e;return this.x=r*Math.sin(i),this.y=Math.cos(t)*e,this.z=r*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},rl=new C,rh=new Cn,Le=class n{static{n.prototype.isMatrix3=!0}constructor(e,t,i,r,s,a,o,c,h){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,a,o,c,h)}set(e,t,i,r,s,a,o,c,h){let u=this.elements;return u[0]=e,u[1]=r,u[2]=o,u[3]=t,u[4]=s,u[5]=c,u[6]=i,u[7]=a,u[8]=h,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,r=t.elements,s=this.elements,a=i[0],o=i[3],c=i[6],h=i[1],u=i[4],d=i[7],l=i[2],f=i[5],g=i[8],v=r[0],p=r[3],m=r[6],_=r[1],x=r[4],M=r[7],A=r[2],E=r[5],I=r[8];return s[0]=a*v+o*_+c*A,s[3]=a*p+o*x+c*E,s[6]=a*m+o*M+c*I,s[1]=h*v+u*_+d*A,s[4]=h*p+u*x+d*E,s[7]=h*m+u*M+d*I,s[2]=l*v+f*_+g*A,s[5]=l*p+f*x+g*E,s[8]=l*m+f*M+g*I,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],c=e[6],h=e[7],u=e[8];return t*a*u-t*o*h-i*s*u+i*o*c+r*s*h-r*a*c}invert(){let e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],c=e[6],h=e[7],u=e[8],d=u*a-o*h,l=o*c-u*s,f=h*s-a*c,g=t*d+i*l+r*f;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let v=1/g;return e[0]=d*v,e[1]=(r*h-u*i)*v,e[2]=(o*i-r*a)*v,e[3]=l*v,e[4]=(u*t-r*c)*v,e[5]=(r*s-o*t)*v,e[6]=f*v,e[7]=(i*c-h*t)*v,e[8]=(a*t-i*s)*v,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,r,s,a,o){let c=Math.cos(s),h=Math.sin(s);return this.set(i*c,i*h,-i*(c*a+h*o)+a+e,-r*h,r*c,-r*(-h*a+c*o)+o+t,0,0,1),this}scale(e,t){return this.premultiply(sl.makeScale(e,t)),this}rotate(e){return this.premultiply(sl.makeRotation(-e)),this}translate(e,t){return this.premultiply(sl.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,i=e.elements;for(let r=0;r<9;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}},sl=new Le,sh=new Le().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),ah=new Le().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Hd(){let n={enabled:!0,workingColorSpace:Vr,spaces:{},convert:function(r,s,a){return this.enabled===!1||s===a||!s||!a||(this.spaces[s].transfer===Je&&(r.r=Gn(r.r),r.g=Gn(r.g),r.b=Gn(r.b)),this.spaces[s].primaries!==this.spaces[a].primaries&&(r.applyMatrix3(this.spaces[s].toXYZ),r.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===Je&&(r.r=or(r.r),r.g=or(r.g),r.b=or(r.b))),r},workingToColorSpace:function(r,s){return this.convert(r,this.workingColorSpace,s)},colorSpaceToWorking:function(r,s){return this.convert(r,s,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===Yn?Gr:this.spaces[r].transfer},getToneMappingMode:function(r){return this.spaces[r].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(r,s=this.workingColorSpace){return r.fromArray(this.spaces[s].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,s,a){return r.copy(this.spaces[s].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(r,s){return Ma("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),n.workingToColorSpace(r,s)},toWorkingColorSpace:function(r,s){return Ma("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),n.colorSpaceToWorking(r,s)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],i=[.3127,.329];return n.define({[Vr]:{primaries:e,whitePoint:i,transfer:Gr,toXYZ:sh,fromXYZ:ah,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:Be},outputColorSpaceConfig:{drawingBufferColorSpace:Be}},[Be]:{primaries:e,whitePoint:i,transfer:Je,toXYZ:sh,fromXYZ:ah,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:Be}}}),n}var qe=Hd();function Gn(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function or(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}var Wi,Ea=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let i;if(e instanceof HTMLCanvasElement)i=e;else{Wi===void 0&&(Wi=cr("canvas")),Wi.width=e.width,Wi.height=e.height;let r=Wi.getContext("2d");e instanceof ImageData?r.putImageData(e,0,0):r.drawImage(e,0,0,e.width,e.height),i=Wi}return i.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=cr("canvas");t.width=e.width,t.height=e.height;let i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);let r=i.getImageData(0,0,e.width,e.height),s=r.data;for(let a=0;a<s.length;a++)s[a]=Gn(s[a]/255)*255;return i.putImageData(r,0,0),t}else if(e.data){let t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(Gn(t[i]/255)*255):t[i]=Gn(t[i]);return{data:t,width:e.width,height:e.height}}else return Ce("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},zd=0,ur=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:zd++}),this.uuid=Vn(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let a=0,o=r.length;a<o;a++)r[a].isDataTexture?s.push(al(r[a].image)):s.push(al(r[a]))}else s=al(r);i.url=s}return t||(e.images[this.uuid]=i),i}};function al(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?Ea.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(Ce("Texture: Unable to serialize Texture."),{})}var Vd=0,ol=new C,Lt=class n extends An{constructor(e=n.DEFAULT_IMAGE,t=n.DEFAULT_MAPPING,i=Jt,r=Jt,s=Se,a=gn,o=ln,c=rn,h=n.DEFAULT_ANISOTROPY,u=Yn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Vd++}),this.uuid=Vn(),this.name="",this.source=new ur(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=s,this.minFilter=a,this.anisotropy=h,this.format=o,this.internalFormat=null,this.type=c,this.offset=new ye(0,0),this.repeat=new ye(1,1),this.center=new ye(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Le,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(ol).x}get height(){return this.source.getSize(ol).y}get depth(){return this.source.getSize(ol).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let i=e[t];if(i===void 0){Ce(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){Ce(`Texture.setValues(): property '${t}' does not exist.`);continue}r&&i&&r.isVector2&&i.isVector2||r&&i&&r.isVector3&&i.isVector3||r&&i&&r.isMatrix3&&i.isMatrix3?r.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==ec)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case xa:e.x=e.x-Math.floor(e.x);break;case Jt:e.x=e.x<0?0:1;break;case va:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case xa:e.y=e.y-Math.floor(e.y);break;case Jt:e.y=e.y<0?0:1;break;case va:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Lt.DEFAULT_IMAGE=null;Lt.DEFAULT_MAPPING=ec;Lt.DEFAULT_ANISOTROPY=1;var St=class n{static{n.prototype.isVector4=!0}constructor(e=0,t=0,i=0,r=1){this.x=e,this.y=t,this.z=i,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,r){return this.x=e,this.y=t,this.z=i,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,i=this.y,r=this.z,s=this.w,a=e.elements;return this.x=a[0]*t+a[4]*i+a[8]*r+a[12]*s,this.y=a[1]*t+a[5]*i+a[9]*r+a[13]*s,this.z=a[2]*t+a[6]*i+a[10]*r+a[14]*s,this.w=a[3]*t+a[7]*i+a[11]*r+a[15]*s,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,r,s,c=e.elements,h=c[0],u=c[4],d=c[8],l=c[1],f=c[5],g=c[9],v=c[2],p=c[6],m=c[10];if(Math.abs(u-l)<.01&&Math.abs(d-v)<.01&&Math.abs(g-p)<.01){if(Math.abs(u+l)<.1&&Math.abs(d+v)<.1&&Math.abs(g+p)<.1&&Math.abs(h+f+m-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let x=(h+1)/2,M=(f+1)/2,A=(m+1)/2,E=(u+l)/4,I=(d+v)/4,S=(g+p)/4;return x>M&&x>A?x<.01?(i=0,r=.707106781,s=.707106781):(i=Math.sqrt(x),r=E/i,s=I/i):M>A?M<.01?(i=.707106781,r=0,s=.707106781):(r=Math.sqrt(M),i=E/r,s=S/r):A<.01?(i=.707106781,r=.707106781,s=0):(s=Math.sqrt(A),i=I/s,r=S/s),this.set(i,r,s,t),this}let _=Math.sqrt((p-g)*(p-g)+(d-v)*(d-v)+(l-u)*(l-u));return Math.abs(_)<.001&&(_=1),this.x=(p-g)/_,this.y=(d-v)/_,this.z=(l-u)/_,this.w=Math.acos((h+f+m-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Ge(this.x,e.x,t.x),this.y=Ge(this.y,e.y,t.y),this.z=Ge(this.z,e.z,t.z),this.w=Ge(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=Ge(this.x,e,t),this.y=Ge(this.y,e,t),this.z=Ge(this.z,e,t),this.w=Ge(this.w,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Ge(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},wa=class extends An{constructor(e=1,t=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Se,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1},i),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=i.depth,this.scissor=new St(0,0,e,t),this.scissorTest=!1,this.viewport=new St(0,0,e,t),this.textures=[];let r={width:e,height:t,depth:i.depth},s=new Lt(r),a=i.count;for(let o=0;o<a;o++)this.textures[o]=s.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview}_setTextureOptions(e={}){let t={minFilter:Se,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let r=0,s=this.textures.length;r<s;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=i,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,i=e.textures.length;t<i;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let r=Object.assign({},e.textures[t].image);this.textures[t].source=new ur(r)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this.multiview=e.multiview,this}dispose(){this.dispatchEvent({type:"dispose"})}},jt=class extends wa{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}},qr=class extends Lt{constructor(e=null,t=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=Dt,this.minFilter=Dt,this.wrapR=Jt,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var Aa=class extends Lt{constructor(e=null,t=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=Dt,this.minFilter=Dt,this.wrapR=Jt,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var ft=class n{static{n.prototype.isMatrix4=!0}constructor(e,t,i,r,s,a,o,c,h,u,d,l,f,g,v,p){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,a,o,c,h,u,d,l,f,g,v,p)}set(e,t,i,r,s,a,o,c,h,u,d,l,f,g,v,p){let m=this.elements;return m[0]=e,m[4]=t,m[8]=i,m[12]=r,m[1]=s,m[5]=a,m[9]=o,m[13]=c,m[2]=h,m[6]=u,m[10]=d,m[14]=l,m[3]=f,m[7]=g,m[11]=v,m[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new n().fromArray(this.elements)}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){let t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return this.determinant()===0?(e.set(1,0,0),t.set(0,1,0),i.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){if(e.determinant()===0)return this.identity();let t=this.elements,i=e.elements,r=1/Xi.setFromMatrixColumn(e,0).length(),s=1/Xi.setFromMatrixColumn(e,1).length(),a=1/Xi.setFromMatrixColumn(e,2).length();return t[0]=i[0]*r,t[1]=i[1]*r,t[2]=i[2]*r,t[3]=0,t[4]=i[4]*s,t[5]=i[5]*s,t[6]=i[6]*s,t[7]=0,t[8]=i[8]*a,t[9]=i[9]*a,t[10]=i[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,i=e.x,r=e.y,s=e.z,a=Math.cos(i),o=Math.sin(i),c=Math.cos(r),h=Math.sin(r),u=Math.cos(s),d=Math.sin(s);if(e.order==="XYZ"){let l=a*u,f=a*d,g=o*u,v=o*d;t[0]=c*u,t[4]=-c*d,t[8]=h,t[1]=f+g*h,t[5]=l-v*h,t[9]=-o*c,t[2]=v-l*h,t[6]=g+f*h,t[10]=a*c}else if(e.order==="YXZ"){let l=c*u,f=c*d,g=h*u,v=h*d;t[0]=l+v*o,t[4]=g*o-f,t[8]=a*h,t[1]=a*d,t[5]=a*u,t[9]=-o,t[2]=f*o-g,t[6]=v+l*o,t[10]=a*c}else if(e.order==="ZXY"){let l=c*u,f=c*d,g=h*u,v=h*d;t[0]=l-v*o,t[4]=-a*d,t[8]=g+f*o,t[1]=f+g*o,t[5]=a*u,t[9]=v-l*o,t[2]=-a*h,t[6]=o,t[10]=a*c}else if(e.order==="ZYX"){let l=a*u,f=a*d,g=o*u,v=o*d;t[0]=c*u,t[4]=g*h-f,t[8]=l*h+v,t[1]=c*d,t[5]=v*h+l,t[9]=f*h-g,t[2]=-h,t[6]=o*c,t[10]=a*c}else if(e.order==="YZX"){let l=a*c,f=a*h,g=o*c,v=o*h;t[0]=c*u,t[4]=v-l*d,t[8]=g*d+f,t[1]=d,t[5]=a*u,t[9]=-o*u,t[2]=-h*u,t[6]=f*d+g,t[10]=l-v*d}else if(e.order==="XZY"){let l=a*c,f=a*h,g=o*c,v=o*h;t[0]=c*u,t[4]=-d,t[8]=h*u,t[1]=l*d+v,t[5]=a*u,t[9]=f*d-g,t[2]=g*d-f,t[6]=o*u,t[10]=v*d+l}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Gd,e,Wd)}lookAt(e,t,i){let r=this.elements;return Zt.subVectors(e,t),Zt.lengthSq()===0&&(Zt.z=1),Zt.normalize(),ni.crossVectors(i,Zt),ni.lengthSq()===0&&(Math.abs(i.z)===1?Zt.x+=1e-4:Zt.z+=1e-4,Zt.normalize(),ni.crossVectors(i,Zt)),ni.normalize(),Ns.crossVectors(Zt,ni),r[0]=ni.x,r[4]=Ns.x,r[8]=Zt.x,r[1]=ni.y,r[5]=Ns.y,r[9]=Zt.y,r[2]=ni.z,r[6]=Ns.z,r[10]=Zt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,r=t.elements,s=this.elements,a=i[0],o=i[4],c=i[8],h=i[12],u=i[1],d=i[5],l=i[9],f=i[13],g=i[2],v=i[6],p=i[10],m=i[14],_=i[3],x=i[7],M=i[11],A=i[15],E=r[0],I=r[4],S=r[8],w=r[12],F=r[1],R=r[5],U=r[9],G=r[13],X=r[2],N=r[6],H=r[10],V=r[14],j=r[3],Q=r[7],ce=r[11],be=r[15];return s[0]=a*E+o*F+c*X+h*j,s[4]=a*I+o*R+c*N+h*Q,s[8]=a*S+o*U+c*H+h*ce,s[12]=a*w+o*G+c*V+h*be,s[1]=u*E+d*F+l*X+f*j,s[5]=u*I+d*R+l*N+f*Q,s[9]=u*S+d*U+l*H+f*ce,s[13]=u*w+d*G+l*V+f*be,s[2]=g*E+v*F+p*X+m*j,s[6]=g*I+v*R+p*N+m*Q,s[10]=g*S+v*U+p*H+m*ce,s[14]=g*w+v*G+p*V+m*be,s[3]=_*E+x*F+M*X+A*j,s[7]=_*I+x*R+M*N+A*Q,s[11]=_*S+x*U+M*H+A*ce,s[15]=_*w+x*G+M*V+A*be,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[4],r=e[8],s=e[12],a=e[1],o=e[5],c=e[9],h=e[13],u=e[2],d=e[6],l=e[10],f=e[14],g=e[3],v=e[7],p=e[11],m=e[15],_=c*f-h*l,x=o*f-h*d,M=o*l-c*d,A=a*f-h*u,E=a*l-c*u,I=a*d-o*u;return t*(v*_-p*x+m*M)-i*(g*_-p*A+m*E)+r*(g*x-v*A+m*I)-s*(g*M-v*E+p*I)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){let r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=i),this}invert(){let e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],c=e[6],h=e[7],u=e[8],d=e[9],l=e[10],f=e[11],g=e[12],v=e[13],p=e[14],m=e[15],_=t*o-i*a,x=t*c-r*a,M=t*h-s*a,A=i*c-r*o,E=i*h-s*o,I=r*h-s*c,S=u*v-d*g,w=u*p-l*g,F=u*m-f*g,R=d*p-l*v,U=d*m-f*v,G=l*m-f*p,X=_*G-x*U+M*R+A*F-E*w+I*S;if(X===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let N=1/X;return e[0]=(o*G-c*U+h*R)*N,e[1]=(r*U-i*G-s*R)*N,e[2]=(v*I-p*E+m*A)*N,e[3]=(l*E-d*I-f*A)*N,e[4]=(c*F-a*G-h*w)*N,e[5]=(t*G-r*F+s*w)*N,e[6]=(p*M-g*I-m*x)*N,e[7]=(u*I-l*M+f*x)*N,e[8]=(a*U-o*F+h*S)*N,e[9]=(i*F-t*U-s*S)*N,e[10]=(g*E-v*M+m*_)*N,e[11]=(d*M-u*E-f*_)*N,e[12]=(o*w-a*R-c*S)*N,e[13]=(t*R-i*w+r*S)*N,e[14]=(v*x-g*A-p*_)*N,e[15]=(u*A-d*x+l*_)*N,this}scale(e){let t=this.elements,i=e.x,r=e.y,s=e.z;return t[0]*=i,t[4]*=r,t[8]*=s,t[1]*=i,t[5]*=r,t[9]*=s,t[2]*=i,t[6]*=r,t[10]*=s,t[3]*=i,t[7]*=r,t[11]*=s,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,r))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let i=Math.cos(t),r=Math.sin(t),s=1-i,a=e.x,o=e.y,c=e.z,h=s*a,u=s*o;return this.set(h*a+i,h*o-r*c,h*c+r*o,0,h*o+r*c,u*o+i,u*c-r*a,0,h*c-r*o,u*c+r*a,s*c*c+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,r,s,a){return this.set(1,i,s,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,i){let r=this.elements,s=t._x,a=t._y,o=t._z,c=t._w,h=s+s,u=a+a,d=o+o,l=s*h,f=s*u,g=s*d,v=a*u,p=a*d,m=o*d,_=c*h,x=c*u,M=c*d,A=i.x,E=i.y,I=i.z;return r[0]=(1-(v+m))*A,r[1]=(f+M)*A,r[2]=(g-x)*A,r[3]=0,r[4]=(f-M)*E,r[5]=(1-(l+m))*E,r[6]=(p+_)*E,r[7]=0,r[8]=(g+x)*I,r[9]=(p-_)*I,r[10]=(1-(l+v))*I,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,i){let r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];let s=this.determinant();if(s===0)return i.set(1,1,1),t.identity(),this;let a=Xi.set(r[0],r[1],r[2]).length(),o=Xi.set(r[4],r[5],r[6]).length(),c=Xi.set(r[8],r[9],r[10]).length();s<0&&(a=-a),cn.copy(this);let h=1/a,u=1/o,d=1/c;return cn.elements[0]*=h,cn.elements[1]*=h,cn.elements[2]*=h,cn.elements[4]*=u,cn.elements[5]*=u,cn.elements[6]*=u,cn.elements[8]*=d,cn.elements[9]*=d,cn.elements[10]*=d,t.setFromRotationMatrix(cn),i.x=a,i.y=o,i.z=c,this}makePerspective(e,t,i,r,s,a,o=dn,c=!1){let h=this.elements,u=2*s/(t-e),d=2*s/(i-r),l=(t+e)/(t-e),f=(i+r)/(i-r),g,v;if(c)g=s/(a-s),v=a*s/(a-s);else if(o===dn)g=-(a+s)/(a-s),v=-2*a*s/(a-s);else if(o===Wr)g=-a/(a-s),v=-a*s/(a-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return h[0]=u,h[4]=0,h[8]=l,h[12]=0,h[1]=0,h[5]=d,h[9]=f,h[13]=0,h[2]=0,h[6]=0,h[10]=g,h[14]=v,h[3]=0,h[7]=0,h[11]=-1,h[15]=0,this}makeOrthographic(e,t,i,r,s,a,o=dn,c=!1){let h=this.elements,u=2/(t-e),d=2/(i-r),l=-(t+e)/(t-e),f=-(i+r)/(i-r),g,v;if(c)g=1/(a-s),v=a/(a-s);else if(o===dn)g=-2/(a-s),v=-(a+s)/(a-s);else if(o===Wr)g=-1/(a-s),v=-s/(a-s);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return h[0]=u,h[4]=0,h[8]=0,h[12]=l,h[1]=0,h[5]=d,h[9]=0,h[13]=f,h[2]=0,h[6]=0,h[10]=g,h[14]=v,h[3]=0,h[7]=0,h[11]=0,h[15]=1,this}equals(e){let t=this.elements,i=e.elements;for(let r=0;r<16;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}},Xi=new C,cn=new ft,Gd=new C(0,0,0),Wd=new C(1,1,1),ni=new C,Ns=new C,Zt=new C,oh=new ft,lh=new Cn,ci=class n{constructor(e=0,t=0,i=0,r=n.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,r=this._order){return this._x=e,this._y=t,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){let r=e.elements,s=r[0],a=r[4],o=r[8],c=r[1],h=r[5],u=r[9],d=r[2],l=r[6],f=r[10];switch(t){case"XYZ":this._y=Math.asin(Ge(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-u,f),this._z=Math.atan2(-a,s)):(this._x=Math.atan2(l,h),this._z=0);break;case"YXZ":this._x=Math.asin(-Ge(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(c,h)):(this._y=Math.atan2(-d,s),this._z=0);break;case"ZXY":this._x=Math.asin(Ge(l,-1,1)),Math.abs(l)<.9999999?(this._y=Math.atan2(-d,f),this._z=Math.atan2(-a,h)):(this._y=0,this._z=Math.atan2(c,s));break;case"ZYX":this._y=Math.asin(-Ge(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(l,f),this._z=Math.atan2(c,s)):(this._x=0,this._z=Math.atan2(-a,h));break;case"YZX":this._z=Math.asin(Ge(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-u,h),this._y=Math.atan2(-d,s)):(this._x=0,this._y=Math.atan2(o,f));break;case"XZY":this._z=Math.asin(-Ge(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(l,h),this._y=Math.atan2(o,s)):(this._x=Math.atan2(-u,f),this._y=0);break;default:Ce("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return oh.makeRotationFromQuaternion(e),this.setFromRotationMatrix(oh,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return lh.setFromEuler(this),this.setFromQuaternion(lh,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};ci.DEFAULT_ORDER="XYZ";var dr=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},Xd=0,ch=new C,qi=new Cn,On=new ft,Os=new C,Ir=new C,qd=new C,Yd=new Cn,hh=new C(1,0,0),uh=new C(0,1,0),dh=new C(0,0,1),fh={type:"added"},$d={type:"removed"},Yi={type:"childadded",child:null},ll={type:"childremoved",child:null},qt=class n extends An{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Xd++}),this.uuid=Vn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=n.DEFAULT_UP.clone();let e=new C,t=new ci,i=new Cn,r=new C(1,1,1);function s(){i.setFromEuler(t,!1)}function a(){t.setFromQuaternion(i,void 0,!1)}t._onChange(s),i._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new ft},normalMatrix:{value:new Le}}),this.matrix=new ft,this.matrixWorld=new ft,this.matrixAutoUpdate=n.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=n.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new dr,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return qi.setFromAxisAngle(e,t),this.quaternion.multiply(qi),this}rotateOnWorldAxis(e,t){return qi.setFromAxisAngle(e,t),this.quaternion.premultiply(qi),this}rotateX(e){return this.rotateOnAxis(hh,e)}rotateY(e){return this.rotateOnAxis(uh,e)}rotateZ(e){return this.rotateOnAxis(dh,e)}translateOnAxis(e,t){return ch.copy(e).applyQuaternion(this.quaternion),this.position.add(ch.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(hh,e)}translateY(e){return this.translateOnAxis(uh,e)}translateZ(e){return this.translateOnAxis(dh,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(On.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?Os.copy(e):Os.set(e,t,i);let r=this.parent;this.updateWorldMatrix(!0,!1),Ir.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?On.lookAt(Ir,Os,this.up):On.lookAt(Os,Ir,this.up),this.quaternion.setFromRotationMatrix(On),r&&(On.extractRotation(r.matrixWorld),qi.setFromRotationMatrix(On),this.quaternion.premultiply(qi.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(Re("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(fh),Yi.child=e,this.dispatchEvent(Yi),Yi.child=null):Re("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent($d),ll.child=e,this.dispatchEvent(ll),ll.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),On.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),On.multiply(e.parent.matrixWorld)),e.applyMatrix4(On),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(fh),Yi.child=e,this.dispatchEvent(Yi),Yi.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,r=this.children.length;i<r;i++){let a=this.children[i].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);let r=this.children;for(let s=0,a=r.length;s<a;s++)r[s].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ir,e,qd),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ir,Yd,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,i=e.y,r=e.z,s=this.matrix.elements;s[12]+=t-s[0]*t-s[4]*i-s[8]*r,s[13]+=i-s[1]*t-s[5]*i-s[9]*r,s[14]+=r-s[2]*t-s[6]*i-s[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t){let i=this.parent;if(e===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){let r=this.children;for(let s=0,a=r.length;s<a;s++)r[s].updateWorldMatrix(!1,!0)}}toJSON(e){let t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let r={};r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.castShadow===!0&&(r.castShadow=!0),this.receiveShadow===!0&&(r.receiveShadow=!0),this.visible===!1&&(r.visible=!1),this.frustumCulled===!1&&(r.frustumCulled=!1),this.renderOrder!==0&&(r.renderOrder=this.renderOrder),this.static!==!1&&(r.static=this.static),Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.matrixAutoUpdate===!1&&(r.matrixAutoUpdate=!1),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(o=>({...o})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function s(o,c){return o[c.uuid]===void 0&&(o[c.uuid]=c.toJSON(e)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(e.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let c=o.shapes;if(Array.isArray(c))for(let h=0,u=c.length;h<u;h++){let d=c[h];s(e.shapes,d)}else s(e.shapes,c)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let c=0,h=this.material.length;c<h;c++)o.push(s(e.materials,this.material[c]));r.material=o}else r.material=s(e.materials,this.material);if(this.children.length>0){r.children=[];for(let o=0;o<this.children.length;o++)r.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let o=0;o<this.animations.length;o++){let c=this.animations[o];r.animations.push(s(e.animations,c))}}if(t){let o=a(e.geometries),c=a(e.materials),h=a(e.textures),u=a(e.images),d=a(e.shapes),l=a(e.skeletons),f=a(e.animations),g=a(e.nodes);o.length>0&&(i.geometries=o),c.length>0&&(i.materials=c),h.length>0&&(i.textures=h),u.length>0&&(i.images=u),d.length>0&&(i.shapes=d),l.length>0&&(i.skeletons=l),f.length>0&&(i.animations=f),g.length>0&&(i.nodes=g)}return i.object=r,i;function a(o){let c=[];for(let h in o){let u=o[h];delete u.metadata,c.push(u)}return c}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){let r=e.children[i];this.add(r.clone())}return this}};qt.DEFAULT_UP=new C(0,1,0);qt.DEFAULT_MATRIX_AUTO_UPDATE=!0;qt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var fn=class extends qt{constructor(){super(),this.isGroup=!0,this.type="Group"}},Zd={type:"move"},fr=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new fn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new fn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new C,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new C),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new fn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new C,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new C,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let r=null,s=null,a=null,o=this._targetRay,c=this._grip,h=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(h&&e.hand){a=!0;for(let v of e.hand.values()){let p=t.getJointPose(v,i),m=this._getHandJoint(h,v);p!==null&&(m.matrix.fromArray(p.transform.matrix),m.matrix.decompose(m.position,m.rotation,m.scale),m.matrixWorldNeedsUpdate=!0,m.jointRadius=p.radius),m.visible=p!==null}let u=h.joints["index-finger-tip"],d=h.joints["thumb-tip"],l=u.position.distanceTo(d.position),f=.02,g=.005;h.inputState.pinching&&l>f+g?(h.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!h.inputState.pinching&&l<=f-g&&(h.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else c!==null&&e.gripSpace&&(s=t.getPose(e.gripSpace,i),s!==null&&(c.matrix.fromArray(s.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,s.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(s.linearVelocity)):c.hasLinearVelocity=!1,s.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(s.angularVelocity)):c.hasAngularVelocity=!1,c.eventsEnabled&&c.dispatchEvent({type:"gripUpdated",data:e,target:this})));o!==null&&(r=t.getPose(e.targetRaySpace,i),r===null&&s!==null&&(r=s),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Zd)))}return o!==null&&(o.visible=r!==null),c!==null&&(c.visible=s!==null),h!==null&&(h.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let i=new fn;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}},yu={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},ii={h:0,s:0,l:0},Us={h:0,s:0,l:0};function cl(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}var Ze=class{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){let r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Be){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,qe.colorSpaceToWorking(this,t),this}setRGB(e,t,i,r=qe.workingColorSpace){return this.r=e,this.g=t,this.b=i,qe.colorSpaceToWorking(this,r),this}setHSL(e,t,i,r=qe.workingColorSpace){if(e=Bd(e,1),t=Ge(t,0,1),i=Ge(i,0,1),t===0)this.r=this.g=this.b=i;else{let s=i<=.5?i*(1+t):i+t-i*t,a=2*i-s;this.r=cl(a,s,e+1/3),this.g=cl(a,s,e),this.b=cl(a,s,e-1/3)}return qe.colorSpaceToWorking(this,r),this}setStyle(e,t=Be){function i(s){s!==void 0&&parseFloat(s)<1&&Ce("Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let s,a=r[1],o=r[2];switch(a){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,t);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,t);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,t);break;default:Ce("Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){let s=r[1],a=s.length;if(a===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(s,16),t);Ce("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Be){let i=yu[e.toLowerCase()];return i!==void 0?this.setHex(i,t):Ce("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Gn(e.r),this.g=Gn(e.g),this.b=Gn(e.b),this}copyLinearToSRGB(e){return this.r=or(e.r),this.g=or(e.g),this.b=or(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Be){return qe.workingToColorSpace(kt.copy(this),e),Math.round(Ge(kt.r*255,0,255))*65536+Math.round(Ge(kt.g*255,0,255))*256+Math.round(Ge(kt.b*255,0,255))}getHexString(e=Be){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=qe.workingColorSpace){qe.workingToColorSpace(kt.copy(this),t);let i=kt.r,r=kt.g,s=kt.b,a=Math.max(i,r,s),o=Math.min(i,r,s),c,h,u=(o+a)/2;if(o===a)c=0,h=0;else{let d=a-o;switch(h=u<=.5?d/(a+o):d/(2-a-o),a){case i:c=(r-s)/d+(r<s?6:0);break;case r:c=(s-i)/d+2;break;case s:c=(i-r)/d+4;break}c/=6}return e.h=c,e.s=h,e.l=u,e}getRGB(e,t=qe.workingColorSpace){return qe.workingToColorSpace(kt.copy(this),t),e.r=kt.r,e.g=kt.g,e.b=kt.b,e}getStyle(e=Be){qe.workingToColorSpace(kt.copy(this),e);let t=kt.r,i=kt.g,r=kt.b;return e!==Be?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(r*255)})`}offsetHSL(e,t,i){return this.getHSL(ii),this.setHSL(ii.h+e,ii.s+t,ii.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(ii),e.getHSL(Us);let i=il(ii.h,Us.h,t),r=il(ii.s,Us.s,t),s=il(ii.l,Us.l,t);return this.setHSL(i,r,s),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,i=this.g,r=this.b,s=e.elements;return this.r=s[0]*t+s[3]*i+s[6]*r,this.g=s[1]*t+s[4]*i+s[7]*r,this.b=s[2]*t+s[5]*i+s[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},kt=new Ze;Ze.NAMES=yu;var pr=class extends qt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new ci,this.environmentIntensity=1,this.environmentRotation=new ci,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}},hn=new C,Un=new C,hl=new C,kn=new C,$i=new C,Zi=new C,ph=new C,ul=new C,dl=new C,fl=new C,pl=new St,ml=new St,gl=new St,zn=class n{constructor(e=new C,t=new C,i=new C){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,r){r.subVectors(i,t),hn.subVectors(e,t),r.cross(hn);let s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(e,t,i,r,s){hn.subVectors(r,t),Un.subVectors(i,t),hl.subVectors(e,t);let a=hn.dot(hn),o=hn.dot(Un),c=hn.dot(hl),h=Un.dot(Un),u=Un.dot(hl),d=a*h-o*o;if(d===0)return s.set(0,0,0),null;let l=1/d,f=(h*c-o*u)*l,g=(a*u-o*c)*l;return s.set(1-f-g,g,f)}static containsPoint(e,t,i,r){return this.getBarycoord(e,t,i,r,kn)===null?!1:kn.x>=0&&kn.y>=0&&kn.x+kn.y<=1}static getInterpolation(e,t,i,r,s,a,o,c){return this.getBarycoord(e,t,i,r,kn)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(s,kn.x),c.addScaledVector(a,kn.y),c.addScaledVector(o,kn.z),c)}static getInterpolatedAttribute(e,t,i,r,s,a){return pl.setScalar(0),ml.setScalar(0),gl.setScalar(0),pl.fromBufferAttribute(e,t),ml.fromBufferAttribute(e,i),gl.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(pl,s.x),a.addScaledVector(ml,s.y),a.addScaledVector(gl,s.z),a}static isFrontFacing(e,t,i,r){return hn.subVectors(i,t),Un.subVectors(e,t),hn.cross(Un).dot(r)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,r){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,i,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return hn.subVectors(this.c,this.b),Un.subVectors(this.a,this.b),hn.cross(Un).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return n.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return n.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,r,s){return n.getInterpolation(e,this.a,this.b,this.c,t,i,r,s)}containsPoint(e){return n.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return n.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let i=this.a,r=this.b,s=this.c,a,o;$i.subVectors(r,i),Zi.subVectors(s,i),ul.subVectors(e,i);let c=$i.dot(ul),h=Zi.dot(ul);if(c<=0&&h<=0)return t.copy(i);dl.subVectors(e,r);let u=$i.dot(dl),d=Zi.dot(dl);if(u>=0&&d<=u)return t.copy(r);let l=c*d-u*h;if(l<=0&&c>=0&&u<=0)return a=c/(c-u),t.copy(i).addScaledVector($i,a);fl.subVectors(e,s);let f=$i.dot(fl),g=Zi.dot(fl);if(g>=0&&f<=g)return t.copy(s);let v=f*h-c*g;if(v<=0&&h>=0&&g<=0)return o=h/(h-g),t.copy(i).addScaledVector(Zi,o);let p=u*g-f*d;if(p<=0&&d-u>=0&&f-g>=0)return ph.subVectors(s,r),o=(d-u)/(d-u+(f-g)),t.copy(r).addScaledVector(ph,o);let m=1/(p+v+l);return a=v*m,o=l*m,t.copy(i).addScaledVector($i,a).addScaledVector(Zi,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},hi=class{constructor(e=new C(1/0,1/0,1/0),t=new C(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(un.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(un.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let i=un.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let i=e.geometry;if(i!==void 0){let s=i.getAttribute("position");if(t===!0&&s!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=s.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,un):un.fromBufferAttribute(s,a),un.applyMatrix4(e.matrixWorld),this.expandByPoint(un);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),ks.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),ks.copy(i.boundingBox)),ks.applyMatrix4(e.matrixWorld),this.union(ks)}let r=e.children;for(let s=0,a=r.length;s<a;s++)this.expandByObject(r[s],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,un),un.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Pr),Bs.subVectors(this.max,Pr),Ki.subVectors(e.a,Pr),Ji.subVectors(e.b,Pr),ji.subVectors(e.c,Pr),ri.subVectors(Ji,Ki),si.subVectors(ji,Ji),wi.subVectors(Ki,ji);let t=[0,-ri.z,ri.y,0,-si.z,si.y,0,-wi.z,wi.y,ri.z,0,-ri.x,si.z,0,-si.x,wi.z,0,-wi.x,-ri.y,ri.x,0,-si.y,si.x,0,-wi.y,wi.x,0];return!_l(t,Ki,Ji,ji,Bs)||(t=[1,0,0,0,1,0,0,0,1],!_l(t,Ki,Ji,ji,Bs))?!1:(Hs.crossVectors(ri,si),t=[Hs.x,Hs.y,Hs.z],_l(t,Ki,Ji,ji,Bs))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,un).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(un).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Bn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Bn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Bn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Bn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Bn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Bn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Bn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Bn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Bn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},Bn=[new C,new C,new C,new C,new C,new C,new C,new C],un=new C,ks=new hi,Ki=new C,Ji=new C,ji=new C,ri=new C,si=new C,wi=new C,Pr=new C,Bs=new C,Hs=new C,Ai=new C;function _l(n,e,t,i,r){for(let s=0,a=n.length-3;s<=a;s+=3){Ai.fromArray(n,s);let o=r.x*Math.abs(Ai.x)+r.y*Math.abs(Ai.y)+r.z*Math.abs(Ai.z),c=e.dot(Ai),h=t.dot(Ai),u=i.dot(Ai);if(Math.max(-Math.max(c,h,u),Math.min(c,h,u))>o)return!1}return!0}var wt=new C,zs=new ye,Kd=0,Xt=class extends An{constructor(e,t,i=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Kd++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=ba,this.updateRanges=[],this.gpuType=yn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[e+r]=t.array[i+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)zs.fromBufferAttribute(this,t),zs.applyMatrix3(e),this.setXY(t,zs.x,zs.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)wt.fromBufferAttribute(this,t),wt.applyMatrix3(e),this.setXYZ(t,wt.x,wt.y,wt.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)wt.fromBufferAttribute(this,t),wt.applyMatrix4(e),this.setXYZ(t,wt.x,wt.y,wt.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)wt.fromBufferAttribute(this,t),wt.applyNormalMatrix(e),this.setXYZ(t,wt.x,wt.y,wt.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)wt.fromBufferAttribute(this,t),wt.transformDirection(e),this.setXYZ(t,wt.x,wt.y,wt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=En(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=nt(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=En(t,this.array)),t}setX(e,t){return this.normalized&&(t=nt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=En(t,this.array)),t}setY(e,t){return this.normalized&&(t=nt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=En(t,this.array)),t}setZ(e,t){return this.normalized&&(t=nt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=En(t,this.array)),t}setW(e,t){return this.normalized&&(t=nt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=nt(t,this.array),i=nt(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,r){return e*=this.itemSize,this.normalized&&(t=nt(t,this.array),i=nt(i,this.array),r=nt(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this}setXYZW(e,t,i,r,s){return e*=this.itemSize,this.normalized&&(t=nt(t,this.array),i=nt(i,this.array),r=nt(r,this.array),s=nt(s,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this.array[e+3]=s,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==ba&&(e.usage=this.usage),e}dispose(){this.dispatchEvent({type:"dispose"})}};var Yr=class extends Xt{constructor(e,t,i){super(new Uint16Array(e),t,i)}};var $r=class extends Xt{constructor(e,t,i){super(new Uint32Array(e),t,i)}};var _t=class extends Xt{constructor(e,t,i){super(new Float32Array(e),t,i)}},Jd=new hi,Dr=new C,yl=new C,Li=class{constructor(e=new C,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let i=this.center;t!==void 0?i.copy(t):Jd.setFromPoints(e).getCenter(i);let r=0;for(let s=0,a=e.length;s<a;s++)r=Math.max(r,i.distanceToSquared(e[s]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Dr.subVectors(e,this.center);let t=Dr.lengthSq();if(t>this.radius*this.radius){let i=Math.sqrt(t),r=(i-this.radius)*.5;this.center.addScaledVector(Dr,r/i),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(yl.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Dr.copy(e.center).add(yl)),this.expandByPoint(Dr.copy(e.center).sub(yl))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},jd=0,on=new ft,xl=new qt,Qi=new C,Kt=new hi,Lr=new hi,Pt=new C,it=class n extends An{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:jd++}),this.uuid=Vn(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Ud(e)?$r:Yr)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let s=new Le().getNormalMatrix(e);i.applyNormalMatrix(s),i.needsUpdate=!0}let r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return on.makeRotationFromQuaternion(e),this.applyMatrix4(on),this}rotateX(e){return on.makeRotationX(e),this.applyMatrix4(on),this}rotateY(e){return on.makeRotationY(e),this.applyMatrix4(on),this}rotateZ(e){return on.makeRotationZ(e),this.applyMatrix4(on),this}translate(e,t,i){return on.makeTranslation(e,t,i),this.applyMatrix4(on),this}scale(e,t,i){return on.makeScale(e,t,i),this.applyMatrix4(on),this}lookAt(e){return xl.lookAt(e),xl.updateMatrix(),this.applyMatrix4(xl.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Qi).negate(),this.translate(Qi.x,Qi.y,Qi.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let i=[];for(let r=0,s=e.length;r<s;r++){let a=e[r];i.push(a.x,a.y,a.z||0)}this.setAttribute("position",new _t(i,3))}else{let i=Math.min(e.length,t.count);for(let r=0;r<i;r++){let s=e[r];t.setXYZ(r,s.x,s.y,s.z||0)}e.length>t.count&&Ce("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new hi);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Re("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new C(-1/0,-1/0,-1/0),new C(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,r=t.length;i<r;i++){let s=t[i];Kt.setFromBufferAttribute(s),this.morphTargetsRelative?(Pt.addVectors(this.boundingBox.min,Kt.min),this.boundingBox.expandByPoint(Pt),Pt.addVectors(this.boundingBox.max,Kt.max),this.boundingBox.expandByPoint(Pt)):(this.boundingBox.expandByPoint(Kt.min),this.boundingBox.expandByPoint(Kt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Re('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Li);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Re("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new C,1/0);return}if(e){let i=this.boundingSphere.center;if(Kt.setFromBufferAttribute(e),t)for(let s=0,a=t.length;s<a;s++){let o=t[s];Lr.setFromBufferAttribute(o),this.morphTargetsRelative?(Pt.addVectors(Kt.min,Lr.min),Kt.expandByPoint(Pt),Pt.addVectors(Kt.max,Lr.max),Kt.expandByPoint(Pt)):(Kt.expandByPoint(Lr.min),Kt.expandByPoint(Lr.max))}Kt.getCenter(i);let r=0;for(let s=0,a=e.count;s<a;s++)Pt.fromBufferAttribute(e,s),r=Math.max(r,i.distanceToSquared(Pt));if(t)for(let s=0,a=t.length;s<a;s++){let o=t[s],c=this.morphTargetsRelative;for(let h=0,u=o.count;h<u;h++)Pt.fromBufferAttribute(o,h),c&&(Qi.fromBufferAttribute(e,h),Pt.add(Qi)),r=Math.max(r,i.distanceToSquared(Pt))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&Re('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){Re("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=t.position,r=t.normal,s=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Xt(new Float32Array(4*i.count),4));let a=this.getAttribute("tangent"),o=[],c=[];for(let S=0;S<i.count;S++)o[S]=new C,c[S]=new C;let h=new C,u=new C,d=new C,l=new ye,f=new ye,g=new ye,v=new C,p=new C;function m(S,w,F){h.fromBufferAttribute(i,S),u.fromBufferAttribute(i,w),d.fromBufferAttribute(i,F),l.fromBufferAttribute(s,S),f.fromBufferAttribute(s,w),g.fromBufferAttribute(s,F),u.sub(h),d.sub(h),f.sub(l),g.sub(l);let R=1/(f.x*g.y-g.x*f.y);isFinite(R)&&(v.copy(u).multiplyScalar(g.y).addScaledVector(d,-f.y).multiplyScalar(R),p.copy(d).multiplyScalar(f.x).addScaledVector(u,-g.x).multiplyScalar(R),o[S].add(v),o[w].add(v),o[F].add(v),c[S].add(p),c[w].add(p),c[F].add(p))}let _=this.groups;_.length===0&&(_=[{start:0,count:e.count}]);for(let S=0,w=_.length;S<w;++S){let F=_[S],R=F.start,U=F.count;for(let G=R,X=R+U;G<X;G+=3)m(e.getX(G+0),e.getX(G+1),e.getX(G+2))}let x=new C,M=new C,A=new C,E=new C;function I(S){A.fromBufferAttribute(r,S),E.copy(A);let w=o[S];x.copy(w),x.sub(A.multiplyScalar(A.dot(w))).normalize(),M.crossVectors(E,w);let R=M.dot(c[S])<0?-1:1;a.setXYZW(S,x.x,x.y,x.z,R)}for(let S=0,w=_.length;S<w;++S){let F=_[S],R=F.start,U=F.count;for(let G=R,X=R+U;G<X;G+=3)I(e.getX(G+0)),I(e.getX(G+1)),I(e.getX(G+2))}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new Xt(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let l=0,f=i.count;l<f;l++)i.setXYZ(l,0,0,0);let r=new C,s=new C,a=new C,o=new C,c=new C,h=new C,u=new C,d=new C;if(e)for(let l=0,f=e.count;l<f;l+=3){let g=e.getX(l+0),v=e.getX(l+1),p=e.getX(l+2);r.fromBufferAttribute(t,g),s.fromBufferAttribute(t,v),a.fromBufferAttribute(t,p),u.subVectors(a,s),d.subVectors(r,s),u.cross(d),o.fromBufferAttribute(i,g),c.fromBufferAttribute(i,v),h.fromBufferAttribute(i,p),o.add(u),c.add(u),h.add(u),i.setXYZ(g,o.x,o.y,o.z),i.setXYZ(v,c.x,c.y,c.z),i.setXYZ(p,h.x,h.y,h.z)}else for(let l=0,f=t.count;l<f;l+=3)r.fromBufferAttribute(t,l+0),s.fromBufferAttribute(t,l+1),a.fromBufferAttribute(t,l+2),u.subVectors(a,s),d.subVectors(r,s),u.cross(d),i.setXYZ(l+0,u.x,u.y,u.z),i.setXYZ(l+1,u.x,u.y,u.z),i.setXYZ(l+2,u.x,u.y,u.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)Pt.fromBufferAttribute(e,t),Pt.normalize(),e.setXYZ(t,Pt.x,Pt.y,Pt.z)}toNonIndexed(){function e(o,c){let h=o.array,u=o.itemSize,d=o.normalized,l=new h.constructor(c.length*u),f=0,g=0;for(let v=0,p=c.length;v<p;v++){o.isInterleavedBufferAttribute?f=c[v]*o.data.stride+o.offset:f=c[v]*u;for(let m=0;m<u;m++)l[g++]=h[f++]}return new Xt(l,u,d)}if(this.index===null)return Ce("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new n,i=this.index.array,r=this.attributes;for(let o in r){let c=r[o],h=e(c,i);t.setAttribute(o,h)}let s=this.morphAttributes;for(let o in s){let c=[],h=s[o];for(let u=0,d=h.length;u<d;u++){let l=h[u],f=e(l,i);c.push(f)}t.morphAttributes[o]=c}t.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,c=a.length;o<c;o++){let h=a[o];t.addGroup(h.start,h.count,h.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let c=this.parameters;for(let h in c)c[h]!==void 0&&(e[h]=c[h]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let i=this.attributes;for(let c in i){let h=i[c];e.data.attributes[c]=h.toJSON(e.data)}let r={},s=!1;for(let c in this.morphAttributes){let h=this.morphAttributes[c],u=[];for(let d=0,l=h.length;d<l;d++){let f=h[d];u.push(f.toJSON(e.data))}u.length>0&&(r[c]=u,s=!0)}s&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let i=e.index;i!==null&&this.setIndex(i.clone());let r=e.attributes;for(let h in r){let u=r[h];this.setAttribute(h,u.clone(t))}let s=e.morphAttributes;for(let h in s){let u=[],d=s[h];for(let l=0,f=d.length;l<f;l++)u.push(d[l].clone(t));this.morphAttributes[h]=u}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let h=0,u=a.length;h<u;h++){let d=a[h];this.addGroup(d.start,d.count,d.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let c=e.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},Ca=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=ba,this.updateRanges=[],this.version=0,this.uuid=Vn()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,i){e*=this.stride,i*=t.stride;for(let r=0,s=this.stride;r<s;r++)this.array[e+r]=t.array[i+r];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Vn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),i=new this.constructor(t,this.stride);return i.setUsage(this.usage),i}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){return e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Vn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}},zt=new C,Zr=class n{constructor(e,t,i,r=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=i,this.normalized=r}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,i=this.data.count;t<i;t++)zt.fromBufferAttribute(this,t),zt.applyMatrix4(e),this.setXYZ(t,zt.x,zt.y,zt.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)zt.fromBufferAttribute(this,t),zt.applyNormalMatrix(e),this.setXYZ(t,zt.x,zt.y,zt.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)zt.fromBufferAttribute(this,t),zt.transformDirection(e),this.setXYZ(t,zt.x,zt.y,zt.z);return this}getComponent(e,t){let i=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(i=En(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=nt(i,this.array)),this.data.array[e*this.data.stride+this.offset+t]=i,this}setX(e,t){return this.normalized&&(t=nt(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=nt(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=nt(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=nt(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=En(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=En(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=En(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=En(t,this.array)),t}setXY(e,t,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=nt(t,this.array),i=nt(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this}setXYZ(e,t,i,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=nt(t,this.array),i=nt(i,this.array),r=nt(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this.data.array[e+2]=r,this}setXYZW(e,t,i,r,s){return e=e*this.data.stride+this.offset,this.normalized&&(t=nt(t,this.array),i=nt(i,this.array),r=nt(r,this.array),s=nt(s,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this.data.array[e+2]=r,this.data.array[e+3]=s,this}clone(e){if(e===void 0){Xr("InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let i=0;i<this.count;i++){let r=i*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)t.push(this.data.array[r+s])}return new Xt(new this.array.constructor(t),this.itemSize,this.normalized)}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new n(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){Xr("InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let i=0;i<this.count;i++){let r=i*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)t.push(this.data.array[r+s])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}},Qd=0,Xn=class extends An{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Qd++}),this.uuid=Vn(),this.name="",this.type="Material",this.blending=Pi,this.side=Wn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=ha,this.blendDst=ua,this.blendEquation=li,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ze(0,0,0),this.blendAlpha=0,this.depthFunc=Di,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Fl,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ii,this.stencilZFail=Ii,this.stencilZPass=Ii,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let i=e[t];if(i===void 0){Ce(`Material: parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){Ce(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(i):r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==Pi&&(i.blending=this.blending),this.side!==Wn&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==ha&&(i.blendSrc=this.blendSrc),this.blendDst!==ua&&(i.blendDst=this.blendDst),this.blendEquation!==li&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==Di&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Fl&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Ii&&(i.stencilFail=this.stencilFail),this.stencilZFail!==Ii&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==Ii&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.allowOverride===!1&&(i.allowOverride=!1),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function r(s){let a=[];for(let o in s){let c=s[o];delete c.metadata,a.push(c)}return a}if(t){let s=r(e.textures),a=r(e.images);s.length>0&&(i.textures=s),a.length>0&&(i.images=a)}return i}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,i=null;if(t!==null){let r=t.length;i=new Array(r);for(let s=0;s!==r;++s)i[s]=t[s].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}},yt=class extends Xn{constructor(e){super(),this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new Ze(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.rotation=e.rotation,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},er,Fr=new C,tr=new C,nr=new C,ir=new ye,Nr=new ye,xu=new ft,Vs=new C,Or=new C,Gs=new C,mh=new ye,vl=new ye,gh=new ye,bt=class extends qt{constructor(e=new yt){if(super(),this.isSprite=!0,this.type="Sprite",er===void 0){er=new it;let t=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),i=new Ca(t,5);er.setIndex([0,1,2,0,2,3]),er.setAttribute("position",new Zr(i,3,0,!1)),er.setAttribute("uv",new Zr(i,2,3,!1))}this.geometry=er,this.material=e,this.center=new ye(.5,.5),this.count=1}raycast(e,t){e.camera===null&&Re('Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),tr.setFromMatrixScale(this.matrixWorld),xu.copy(e.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(e.camera.matrixWorldInverse,this.matrixWorld),nr.setFromMatrixPosition(this.modelViewMatrix),e.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&tr.multiplyScalar(-nr.z);let i=this.material.rotation,r,s;i!==0&&(s=Math.cos(i),r=Math.sin(i));let a=this.center;Ws(Vs.set(-.5,-.5,0),nr,a,tr,r,s),Ws(Or.set(.5,-.5,0),nr,a,tr,r,s),Ws(Gs.set(.5,.5,0),nr,a,tr,r,s),mh.set(0,0),vl.set(1,0),gh.set(1,1);let o=e.ray.intersectTriangle(Vs,Or,Gs,!1,Fr);if(o===null&&(Ws(Or.set(-.5,.5,0),nr,a,tr,r,s),vl.set(0,1),o=e.ray.intersectTriangle(Vs,Gs,Or,!1,Fr),o===null))return;let c=e.ray.origin.distanceTo(Fr);c<e.near||c>e.far||t.push({distance:c,point:Fr.clone(),uv:zn.getInterpolation(Fr,Vs,Or,Gs,mh,vl,gh,new ye),face:null,object:this})}copy(e,t){return super.copy(e,t),e.center!==void 0&&this.center.copy(e.center),this.material=e.material,this}};function Ws(n,e,t,i,r,s){ir.subVectors(n,t).addScalar(.5).multiply(i),r!==void 0?(Nr.x=s*ir.x-r*ir.y,Nr.y=r*ir.x+s*ir.y):Nr.copy(ir),n.copy(e),n.x+=Nr.x,n.y+=Nr.y,n.applyMatrix4(xu)}var Hn=new C,Sl=new C,Xs=new C,ai=new C,bl=new C,qs=new C,Ml=new C,mr=class{constructor(e=new C,t=new C(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Hn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=Hn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Hn.copy(this.origin).addScaledVector(this.direction,t),Hn.distanceToSquared(e))}distanceSqToSegment(e,t,i,r){Sl.copy(e).add(t).multiplyScalar(.5),Xs.copy(t).sub(e).normalize(),ai.copy(this.origin).sub(Sl);let s=e.distanceTo(t)*.5,a=-this.direction.dot(Xs),o=ai.dot(this.direction),c=-ai.dot(Xs),h=ai.lengthSq(),u=Math.abs(1-a*a),d,l,f,g;if(u>0)if(d=a*c-o,l=a*o-c,g=s*u,d>=0)if(l>=-g)if(l<=g){let v=1/u;d*=v,l*=v,f=d*(d+a*l+2*o)+l*(a*d+l+2*c)+h}else l=s,d=Math.max(0,-(a*l+o)),f=-d*d+l*(l+2*c)+h;else l=-s,d=Math.max(0,-(a*l+o)),f=-d*d+l*(l+2*c)+h;else l<=-g?(d=Math.max(0,-(-a*s+o)),l=d>0?-s:Math.min(Math.max(-s,-c),s),f=-d*d+l*(l+2*c)+h):l<=g?(d=0,l=Math.min(Math.max(-s,-c),s),f=l*(l+2*c)+h):(d=Math.max(0,-(a*s+o)),l=d>0?s:Math.min(Math.max(-s,-c),s),f=-d*d+l*(l+2*c)+h);else l=a>0?-s:s,d=Math.max(0,-(a*l+o)),f=-d*d+l*(l+2*c)+h;return i&&i.copy(this.origin).addScaledVector(this.direction,d),r&&r.copy(Sl).addScaledVector(Xs,l),f}intersectSphere(e,t){Hn.subVectors(e.center,this.origin);let i=Hn.dot(this.direction),r=Hn.dot(Hn)-i*i,s=e.radius*e.radius;if(r>s)return null;let a=Math.sqrt(s-r),o=i-a,c=i+a;return c<0?null:o<0?this.at(c,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){let i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,r,s,a,o,c,h=1/this.direction.x,u=1/this.direction.y,d=1/this.direction.z,l=this.origin;return h>=0?(i=(e.min.x-l.x)*h,r=(e.max.x-l.x)*h):(i=(e.max.x-l.x)*h,r=(e.min.x-l.x)*h),u>=0?(s=(e.min.y-l.y)*u,a=(e.max.y-l.y)*u):(s=(e.max.y-l.y)*u,a=(e.min.y-l.y)*u),i>a||s>r||((s>i||isNaN(i))&&(i=s),(a<r||isNaN(r))&&(r=a),d>=0?(o=(e.min.z-l.z)*d,c=(e.max.z-l.z)*d):(o=(e.max.z-l.z)*d,c=(e.min.z-l.z)*d),i>c||o>r)||((o>i||i!==i)&&(i=o),(c<r||r!==r)&&(r=c),r<0)?null:this.at(i>=0?i:r,t)}intersectsBox(e){return this.intersectBox(e,Hn)!==null}intersectTriangle(e,t,i,r,s){bl.subVectors(t,e),qs.subVectors(i,e),Ml.crossVectors(bl,qs);let a=this.direction.dot(Ml),o;if(a>0){if(r)return null;o=1}else if(a<0)o=-1,a=-a;else return null;ai.subVectors(this.origin,e);let c=o*this.direction.dot(qs.crossVectors(ai,qs));if(c<0)return null;let h=o*this.direction.dot(bl.cross(ai));if(h<0||c+h>a)return null;let u=-o*ai.dot(Ml);return u<0?null:this.at(u/a,s)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Ft=class extends Xn{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Ze(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ci,this.combine=ql,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},_h=new ft,Ci=new mr,Ys=new Li,yh=new C,$s=new C,Zs=new C,Ks=new C,Tl=new C,Js=new C,xh=new C,js=new C,dt=class extends qt{constructor(e=new it,t=new Ft){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){let o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}getVertexPosition(e,t){let i=this.geometry,r=i.attributes.position,s=i.morphAttributes.position,a=i.morphTargetsRelative;t.fromBufferAttribute(r,e);let o=this.morphTargetInfluences;if(s&&o){Js.set(0,0,0);for(let c=0,h=s.length;c<h;c++){let u=o[c],d=s[c];u!==0&&(Tl.fromBufferAttribute(d,e),a?Js.addScaledVector(Tl,u):Js.addScaledVector(Tl.sub(t),u))}t.add(Js)}return t}raycast(e,t){let i=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Ys.copy(i.boundingSphere),Ys.applyMatrix4(s),Ci.copy(e.ray).recast(e.near),!(Ys.containsPoint(Ci.origin)===!1&&(Ci.intersectSphere(Ys,yh)===null||Ci.origin.distanceToSquared(yh)>(e.far-e.near)**2))&&(_h.copy(s).invert(),Ci.copy(e.ray).applyMatrix4(_h),!(i.boundingBox!==null&&Ci.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,Ci)))}_computeIntersections(e,t,i){let r,s=this.geometry,a=this.material,o=s.index,c=s.attributes.position,h=s.attributes.uv,u=s.attributes.uv1,d=s.attributes.normal,l=s.groups,f=s.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,v=l.length;g<v;g++){let p=l[g],m=a[p.materialIndex],_=Math.max(p.start,f.start),x=Math.min(o.count,Math.min(p.start+p.count,f.start+f.count));for(let M=_,A=x;M<A;M+=3){let E=o.getX(M),I=o.getX(M+1),S=o.getX(M+2);r=Qs(this,m,e,i,h,u,d,E,I,S),r&&(r.faceIndex=Math.floor(M/3),r.face.materialIndex=p.materialIndex,t.push(r))}}else{let g=Math.max(0,f.start),v=Math.min(o.count,f.start+f.count);for(let p=g,m=v;p<m;p+=3){let _=o.getX(p),x=o.getX(p+1),M=o.getX(p+2);r=Qs(this,a,e,i,h,u,d,_,x,M),r&&(r.faceIndex=Math.floor(p/3),t.push(r))}}else if(c!==void 0)if(Array.isArray(a))for(let g=0,v=l.length;g<v;g++){let p=l[g],m=a[p.materialIndex],_=Math.max(p.start,f.start),x=Math.min(c.count,Math.min(p.start+p.count,f.start+f.count));for(let M=_,A=x;M<A;M+=3){let E=M,I=M+1,S=M+2;r=Qs(this,m,e,i,h,u,d,E,I,S),r&&(r.faceIndex=Math.floor(M/3),r.face.materialIndex=p.materialIndex,t.push(r))}}else{let g=Math.max(0,f.start),v=Math.min(c.count,f.start+f.count);for(let p=g,m=v;p<m;p+=3){let _=p,x=p+1,M=p+2;r=Qs(this,a,e,i,h,u,d,_,x,M),r&&(r.faceIndex=Math.floor(p/3),t.push(r))}}}};function ef(n,e,t,i,r,s,a,o){let c;if(e.side===Vt?c=i.intersectTriangle(a,s,r,!0,o):c=i.intersectTriangle(r,s,a,e.side===Wn,o),c===null)return null;js.copy(o),js.applyMatrix4(n.matrixWorld);let h=t.ray.origin.distanceTo(js);return h<t.near||h>t.far?null:{distance:h,point:js.clone(),object:n}}function Qs(n,e,t,i,r,s,a,o,c,h){n.getVertexPosition(o,$s),n.getVertexPosition(c,Zs),n.getVertexPosition(h,Ks);let u=ef(n,e,t,i,$s,Zs,Ks,xh);if(u){let d=new C;zn.getBarycoord(xh,$s,Zs,Ks,d),r&&(u.uv=zn.getInterpolatedAttribute(r,o,c,h,d,new ye)),s&&(u.uv1=zn.getInterpolatedAttribute(s,o,c,h,d,new ye)),a&&(u.normal=zn.getInterpolatedAttribute(a,o,c,h,d,new C),u.normal.dot(i.direction)>0&&u.normal.multiplyScalar(-1));let l={a:o,b:c,c:h,normal:new C,materialIndex:0};zn.getNormal($s,Zs,Ks,l.normal),u.face=l,u.barycoord=d}return u}var Ra=class extends Lt{constructor(e=null,t=1,i=1,r,s,a,o,c,h=Dt,u=Dt,d,l){super(null,a,o,c,h,u,r,s,d,l),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var El=new C,tf=new C,nf=new Le,Tn=class{constructor(e=new C(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,r){return this.normal.set(e,t,i),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){let r=El.subVectors(i,t).cross(tf.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,i=!0){let r=e.delta(El),s=this.normal.dot(r);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let a=-(e.start.dot(this.normal)+this.constant)/s;return i===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(r,a)}intersectsLine(e){let t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let i=t||nf.getNormalMatrix(e),r=this.coplanarPoint(El).applyMatrix4(e),s=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(s),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},Ri=new Li,rf=new ye(.5,.5),ea=new C,Kr=class{constructor(e=new Tn,t=new Tn,i=new Tn,r=new Tn,s=new Tn,a=new Tn){this.planes=[e,t,i,r,s,a]}set(e,t,i,r,s,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(i),o[3].copy(r),o[4].copy(s),o[5].copy(a),this}copy(e){let t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=dn,i=!1){let r=this.planes,s=e.elements,a=s[0],o=s[1],c=s[2],h=s[3],u=s[4],d=s[5],l=s[6],f=s[7],g=s[8],v=s[9],p=s[10],m=s[11],_=s[12],x=s[13],M=s[14],A=s[15];if(r[0].setComponents(h-a,f-u,m-g,A-_).normalize(),r[1].setComponents(h+a,f+u,m+g,A+_).normalize(),r[2].setComponents(h+o,f+d,m+v,A+x).normalize(),r[3].setComponents(h-o,f-d,m-v,A-x).normalize(),i)r[4].setComponents(c,l,p,M).normalize(),r[5].setComponents(h-c,f-l,m-p,A-M).normalize();else if(r[4].setComponents(h-c,f-l,m-p,A-M).normalize(),t===dn)r[5].setComponents(h+c,f+l,m+p,A+M).normalize();else if(t===Wr)r[5].setComponents(c,l,p,M).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Ri.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Ri.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Ri)}intersectsSprite(e){Ri.center.set(0,0,0);let t=rf.distanceTo(e.center);return Ri.radius=.7071067811865476+t,Ri.applyMatrix4(e.matrixWorld),this.intersectsSphere(Ri)}intersectsSphere(e){let t=this.planes,i=e.center,r=-e.radius;for(let s=0;s<6;s++)if(t[s].distanceToPoint(i)<r)return!1;return!0}intersectsBox(e){let t=this.planes;for(let i=0;i<6;i++){let r=t[i];if(ea.x=r.normal.x>0?e.max.x:e.min.x,ea.y=r.normal.y>0?e.max.y:e.min.y,ea.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(ea)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var Nt=class extends Xn{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Ze(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},Ia=new C,Pa=new C,vh=new ft,Ur=new mr,ta=new Li,wl=new C,Sh=new C,pn=class extends qt{constructor(e=new it,t=new Nt){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[0];for(let r=1,s=t.count;r<s;r++)Ia.fromBufferAttribute(t,r-1),Pa.fromBufferAttribute(t,r),i[r]=i[r-1],i[r]+=Ia.distanceTo(Pa);e.setAttribute("lineDistance",new _t(i,1))}else Ce("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){let i=this.geometry,r=this.matrixWorld,s=e.params.Line.threshold,a=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),ta.copy(i.boundingSphere),ta.applyMatrix4(r),ta.radius+=s,e.ray.intersectsSphere(ta)===!1)return;vh.copy(r).invert(),Ur.copy(e.ray).applyMatrix4(vh);let o=s/((this.scale.x+this.scale.y+this.scale.z)/3),c=o*o,h=this.isLineSegments?2:1,u=i.index,l=i.attributes.position;if(u!==null){let f=Math.max(0,a.start),g=Math.min(u.count,a.start+a.count);for(let v=f,p=g-1;v<p;v+=h){let m=u.getX(v),_=u.getX(v+1),x=na(this,e,Ur,c,m,_,v);x&&t.push(x)}if(this.isLineLoop){let v=u.getX(g-1),p=u.getX(f),m=na(this,e,Ur,c,v,p,g-1);m&&t.push(m)}}else{let f=Math.max(0,a.start),g=Math.min(l.count,a.start+a.count);for(let v=f,p=g-1;v<p;v+=h){let m=na(this,e,Ur,c,v,v+1,v);m&&t.push(m)}if(this.isLineLoop){let v=na(this,e,Ur,c,g-1,f,g-1);v&&t.push(v)}}}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){let o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}};function na(n,e,t,i,r,s,a){let o=n.geometry.attributes.position;if(Ia.fromBufferAttribute(o,r),Pa.fromBufferAttribute(o,s),t.distanceSqToSegment(Ia,Pa,wl,Sh)>i)return;wl.applyMatrix4(n.matrixWorld);let h=e.ray.origin.distanceTo(wl);if(!(h<e.near||h>e.far))return{distance:h,point:Sh.clone().applyMatrix4(n.matrixWorld),index:a,face:null,faceIndex:null,barycoord:null,object:n}}var bh=new C,Mh=new C,gr=class extends pn{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[];for(let r=0,s=t.count;r<s;r+=2)bh.fromBufferAttribute(t,r),Mh.fromBufferAttribute(t,r+1),i[r]=r===0?0:i[r-1],i[r+1]=i[r]+bh.distanceTo(Mh);e.setAttribute("lineDistance",new _t(i,1))}else Ce("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}},Rn=class extends pn{constructor(e,t){super(e,t),this.isLineLoop=!0,this.type="LineLoop"}};var Jr=class extends Lt{constructor(e=[],t=gi,i,r,s,a,o,c,h,u){super(e,t,i,r,s,a,o,c,h,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},at=class extends Lt{constructor(e,t,i,r,s,a,o,c,h){super(e,t,i,r,s,a,o,c,h),this.isCanvasTexture=!0,this.needsUpdate=!0}};var qn=class extends Lt{constructor(e,t,i=_n,r,s,a,o=Dt,c=Dt,h,u=wn,d=1){if(u!==wn&&u!==_i)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let l={width:e,height:t,depth:d};super(l,r,s,a,o,c,u,i,h),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new ur(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},Da=class extends qn{constructor(e,t=_n,i=gi,r,s,a=Dt,o=Dt,c,h=wn){let u={width:e,height:e,depth:1},d=[u,u,u,u,u,u];super(e,e,t,i,r,s,a,o,c,h),this.image=d,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},jr=class extends Lt{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},_r=class n extends it{constructor(e=1,t=1,i=1,r=1,s=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:r,heightSegments:s,depthSegments:a};let o=this;r=Math.floor(r),s=Math.floor(s),a=Math.floor(a);let c=[],h=[],u=[],d=[],l=0,f=0;g("z","y","x",-1,-1,i,t,e,a,s,0),g("z","y","x",1,-1,i,t,-e,a,s,1),g("x","z","y",1,1,e,i,t,r,a,2),g("x","z","y",1,-1,e,i,-t,r,a,3),g("x","y","z",1,-1,e,t,i,r,s,4),g("x","y","z",-1,-1,e,t,-i,r,s,5),this.setIndex(c),this.setAttribute("position",new _t(h,3)),this.setAttribute("normal",new _t(u,3)),this.setAttribute("uv",new _t(d,2));function g(v,p,m,_,x,M,A,E,I,S,w){let F=M/I,R=A/S,U=M/2,G=A/2,X=E/2,N=I+1,H=S+1,V=0,j=0,Q=new C;for(let ce=0;ce<H;ce++){let be=ce*R-G;for(let we=0;we<N;we++){let Ye=we*F-U;Q[v]=Ye*_,Q[p]=be*x,Q[m]=X,h.push(Q.x,Q.y,Q.z),Q[v]=0,Q[p]=0,Q[m]=E>0?1:-1,u.push(Q.x,Q.y,Q.z),d.push(we/I),d.push(1-ce/S),V+=1}}for(let ce=0;ce<S;ce++)for(let be=0;be<I;be++){let we=l+be+N*ce,Ye=l+be+N*(ce+1),je=l+(be+1)+N*(ce+1),Ue=l+(be+1)+N*ce;c.push(we,Ye,Ue),c.push(Ye,je,Ue),j+=6}o.addGroup(f,j,w),f+=j,l+=V}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};var Qt=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){Ce("Curve: .getPoint() not implemented.")}getPointAt(e,t){let i=this.getUtoTmapping(e);return this.getPoint(i,t)}getPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return t}getSpacedPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPointAt(i/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],i,r=this.getPoint(0),s=0;t.push(0);for(let a=1;a<=e;a++)i=this.getPoint(a/e),s+=i.distanceTo(r),t.push(s),r=i;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){let i=this.getLengths(),r=0,s=i.length,a;t?a=t:a=e*i[s-1];let o=0,c=s-1,h;for(;o<=c;)if(r=Math.floor(o+(c-o)/2),h=i[r]-a,h<0)o=r+1;else if(h>0)c=r-1;else{c=r;break}if(r=c,i[r]===a)return r/(s-1);let u=i[r],l=i[r+1]-u,f=(a-u)/l;return(r+f)/(s-1)}getTangent(e,t){let r=e-1e-4,s=e+1e-4;r<0&&(r=0),s>1&&(s=1);let a=this.getPoint(r),o=this.getPoint(s),c=t||(a.isVector2?new ye:new C);return c.copy(o).sub(a).normalize(),c}getTangentAt(e,t){let i=this.getUtoTmapping(e);return this.getTangent(i,t)}computeFrenetFrames(e,t=!1){let i=new C,r=[],s=[],a=[],o=new C,c=new ft;for(let f=0;f<=e;f++){let g=f/e;r[f]=this.getTangentAt(g,new C)}s[0]=new C,a[0]=new C;let h=Number.MAX_VALUE,u=Math.abs(r[0].x),d=Math.abs(r[0].y),l=Math.abs(r[0].z);u<=h&&(h=u,i.set(1,0,0)),d<=h&&(h=d,i.set(0,1,0)),l<=h&&i.set(0,0,1),o.crossVectors(r[0],i).normalize(),s[0].crossVectors(r[0],o),a[0].crossVectors(r[0],s[0]);for(let f=1;f<=e;f++){if(s[f]=s[f-1].clone(),a[f]=a[f-1].clone(),o.crossVectors(r[f-1],r[f]),o.length()>Number.EPSILON){o.normalize();let g=Math.acos(Ge(r[f-1].dot(r[f]),-1,1));s[f].applyMatrix4(c.makeRotationAxis(o,g))}a[f].crossVectors(r[f],s[f])}if(t===!0){let f=Math.acos(Ge(s[0].dot(s[e]),-1,1));f/=e,r[0].dot(o.crossVectors(s[0],s[e]))>0&&(f=-f);for(let g=1;g<=e;g++)s[g].applyMatrix4(c.makeRotationAxis(r[g],f*g)),a[g].crossVectors(r[g],s[g])}return{tangents:r,normals:s,binormals:a}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}},yr=class extends Qt{constructor(e=0,t=0,i=1,r=1,s=0,a=Math.PI*2,o=!1,c=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=i,this.yRadius=r,this.aStartAngle=s,this.aEndAngle=a,this.aClockwise=o,this.aRotation=c}getPoint(e,t=new ye){let i=t,r=Math.PI*2,s=this.aEndAngle-this.aStartAngle,a=Math.abs(s)<Number.EPSILON;for(;s<0;)s+=r;for(;s>r;)s-=r;s<Number.EPSILON&&(a?s=0:s=r),this.aClockwise===!0&&!a&&(s===r?s=-r:s=s-r);let o=this.aStartAngle+e*s,c=this.aX+this.xRadius*Math.cos(o),h=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){let u=Math.cos(this.aRotation),d=Math.sin(this.aRotation),l=c-this.aX,f=h-this.aY;c=l*u-f*d+this.aX,h=l*d+f*u+this.aY}return i.set(c,h)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},La=class extends yr{constructor(e,t,i,r,s,a){super(e,t,i,i,r,s,a),this.isArcCurve=!0,this.type="ArcCurve"}};function hc(){let n=0,e=0,t=0,i=0;function r(s,a,o,c){n=s,e=o,t=-3*s+3*a-2*o-c,i=2*s-2*a+o+c}return{initCatmullRom:function(s,a,o,c,h){r(a,o,h*(o-s),h*(c-a))},initNonuniformCatmullRom:function(s,a,o,c,h,u,d){let l=(a-s)/h-(o-s)/(h+u)+(o-a)/u,f=(o-a)/u-(c-a)/(u+d)+(c-o)/d;l*=u,f*=u,r(a,o,l,f)},calc:function(s){let a=s*s,o=a*s;return n+e*s+t*a+i*o}}}var Th=new C,Eh=new C,Al=new hc,Cl=new hc,Rl=new hc,Fi=class extends Qt{constructor(e=[],t=!1,i="centripetal",r=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=i,this.tension=r}getPoint(e,t=new C){let i=t,r=this.points,s=r.length,a=(s-(this.closed?0:1))*e,o=Math.floor(a),c=a-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/s)+1)*s:c===0&&o===s-1&&(o=s-2,c=1);let h,u;this.closed||o>0?h=r[(o-1)%s]:(Eh.subVectors(r[0],r[1]).add(r[0]),h=Eh);let d=r[o%s],l=r[(o+1)%s];if(this.closed||o+2<s?u=r[(o+2)%s]:(Th.subVectors(r[s-1],r[s-2]).add(r[s-1]),u=Th),this.curveType==="centripetal"||this.curveType==="chordal"){let f=this.curveType==="chordal"?.5:.25,g=Math.pow(h.distanceToSquared(d),f),v=Math.pow(d.distanceToSquared(l),f),p=Math.pow(l.distanceToSquared(u),f);v<1e-4&&(v=1),g<1e-4&&(g=v),p<1e-4&&(p=v),Al.initNonuniformCatmullRom(h.x,d.x,l.x,u.x,g,v,p),Cl.initNonuniformCatmullRom(h.y,d.y,l.y,u.y,g,v,p),Rl.initNonuniformCatmullRom(h.z,d.z,l.z,u.z,g,v,p)}else this.curveType==="catmullrom"&&(Al.initCatmullRom(h.x,d.x,l.x,u.x,this.tension),Cl.initCatmullRom(h.y,d.y,l.y,u.y,this.tension),Rl.initCatmullRom(h.z,d.z,l.z,u.z,this.tension));return i.set(Al.calc(c),Cl.calc(c),Rl.calc(c)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(r.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let r=this.points[t];e.points.push(r.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(new C().fromArray(r))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function wh(n,e,t,i,r){let s=(i-e)*.5,a=(r-t)*.5,o=n*n,c=n*o;return(2*t-2*i+s+a)*c+(-3*t+3*i-2*s-a)*o+s*n+t}function sf(n,e){let t=1-n;return t*t*e}function af(n,e){return 2*(1-n)*n*e}function of(n,e){return n*n*e}function Br(n,e,t,i){return sf(n,e)+af(n,t)+of(n,i)}function lf(n,e){let t=1-n;return t*t*t*e}function cf(n,e){let t=1-n;return 3*t*t*n*e}function hf(n,e){return 3*(1-n)*n*n*e}function uf(n,e){return n*n*n*e}function Hr(n,e,t,i,r){return lf(n,e)+cf(n,t)+hf(n,i)+uf(n,r)}var Qr=class extends Qt{constructor(e=new ye,t=new ye,i=new ye,r=new ye){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=i,this.v3=r}getPoint(e,t=new ye){let i=t,r=this.v0,s=this.v1,a=this.v2,o=this.v3;return i.set(Hr(e,r.x,s.x,a.x,o.x),Hr(e,r.y,s.y,a.y,o.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},Fa=class extends Qt{constructor(e=new C,t=new C,i=new C,r=new C){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=i,this.v3=r}getPoint(e,t=new C){let i=t,r=this.v0,s=this.v1,a=this.v2,o=this.v3;return i.set(Hr(e,r.x,s.x,a.x,o.x),Hr(e,r.y,s.y,a.y,o.y),Hr(e,r.z,s.z,a.z,o.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},es=class extends Qt{constructor(e=new ye,t=new ye){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new ye){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new ye){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Na=class extends Qt{constructor(e=new C,t=new C){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new C){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new C){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},ts=class extends Qt{constructor(e=new ye,t=new ye,i=new ye){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new ye){let i=t,r=this.v0,s=this.v1,a=this.v2;return i.set(Br(e,r.x,s.x,a.x),Br(e,r.y,s.y,a.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},ui=class extends Qt{constructor(e=new C,t=new C,i=new C){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new C){let i=t,r=this.v0,s=this.v1,a=this.v2;return i.set(Br(e,r.x,s.x,a.x),Br(e,r.y,s.y,a.y),Br(e,r.z,s.z,a.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},ns=class extends Qt{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new ye){let i=t,r=this.points,s=(r.length-1)*e,a=Math.floor(s),o=s-a,c=r[a===0?a:a-1],h=r[a],u=r[a>r.length-2?r.length-1:a+1],d=r[a>r.length-3?r.length-1:a+2];return i.set(wh(o,c.x,h.x,u.x,d.x),wh(o,c.y,h.y,u.y,d.y)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(r.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let r=this.points[t];e.points.push(r.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(new ye().fromArray(r))}return this}},Nl=Object.freeze({__proto__:null,ArcCurve:La,CatmullRomCurve3:Fi,CubicBezierCurve:Qr,CubicBezierCurve3:Fa,EllipseCurve:yr,LineCurve:es,LineCurve3:Na,QuadraticBezierCurve:ts,QuadraticBezierCurve3:ui,SplineCurve:ns}),Oa=class extends Qt{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){let e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){let i=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new Nl[i](t,e))}return this}getPoint(e,t){let i=e*this.getLength(),r=this.getCurveLengths(),s=0;for(;s<r.length;){if(r[s]>=i){let a=r[s]-i,o=this.curves[s],c=o.getLength(),h=c===0?0:1-a/c;return o.getPointAt(h,t)}s++}return null}getLength(){let e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let e=[],t=0;for(let i=0,r=this.curves.length;i<r;i++)t+=this.curves[i].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){let t=[],i;for(let r=0,s=this.curves;r<s.length;r++){let a=s[r],o=a.isEllipseCurve?e*2:a.isLineCurve||a.isLineCurve3?1:a.isSplineCurve?e*a.points.length:e,c=a.getPoints(o);for(let h=0;h<c.length;h++){let u=c[h];i&&i.equals(u)||(t.push(u),i=u)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let r=e.curves[t];this.curves.push(r.clone())}return this.autoClose=e.autoClose,this}toJSON(){let e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,i=this.curves.length;t<i;t++){let r=this.curves[t];e.curves.push(r.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let r=e.curves[t];this.curves.push(new Nl[r.type]().fromJSON(r))}return this}},is=class extends Oa{constructor(e){super(),this.type="Path",this.currentPoint=new ye,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,i=e.length;t<i;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){let i=new es(this.currentPoint.clone(),new ye(e,t));return this.curves.push(i),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,i,r){let s=new ts(this.currentPoint.clone(),new ye(e,t),new ye(i,r));return this.curves.push(s),this.currentPoint.set(i,r),this}bezierCurveTo(e,t,i,r,s,a){let o=new Qr(this.currentPoint.clone(),new ye(e,t),new ye(i,r),new ye(s,a));return this.curves.push(o),this.currentPoint.set(s,a),this}splineThru(e){let t=[this.currentPoint.clone()].concat(e),i=new ns(t);return this.curves.push(i),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,i,r,s,a){let o=this.currentPoint.x,c=this.currentPoint.y;return this.absarc(e+o,t+c,i,r,s,a),this}absarc(e,t,i,r,s,a){return this.absellipse(e,t,i,i,r,s,a),this}ellipse(e,t,i,r,s,a,o,c){let h=this.currentPoint.x,u=this.currentPoint.y;return this.absellipse(e+h,t+u,i,r,s,a,o,c),this}absellipse(e,t,i,r,s,a,o,c){let h=new yr(e,t,i,r,s,a,o,c);if(this.curves.length>0){let d=h.getPoint(0);d.equals(this.currentPoint)||this.lineTo(d.x,d.y)}this.curves.push(h);let u=h.getPoint(1);return this.currentPoint.copy(u),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){let e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}},xr=class extends is{constructor(e){super(e),this.uuid=Vn(),this.type="Shape",this.holes=[]}getPointsHoles(e){let t=[];for(let i=0,r=this.holes.length;i<r;i++)t[i]=this.holes[i].getPoints(e);return t}extractPoints(e){return{shape:this.getPoints(e),holes:this.getPointsHoles(e)}}copy(e){super.copy(e),this.holes=[];for(let t=0,i=e.holes.length;t<i;t++){let r=e.holes[t];this.holes.push(r.clone())}return this}toJSON(){let e=super.toJSON();e.uuid=this.uuid,e.holes=[];for(let t=0,i=this.holes.length;t<i;t++){let r=this.holes[t];e.holes.push(r.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.uuid=e.uuid,this.holes=[];for(let t=0,i=e.holes.length;t<i;t++){let r=e.holes[t];this.holes.push(new is().fromJSON(r))}return this}};function df(n,e,t=2){let i=e&&e.length,r=i?e[0]*t:n.length,s=vu(n,0,r,t,!0),a=[];if(!s||s.next===s.prev)return a;let o,c,h;if(i&&(s=_f(n,e,s,t)),n.length>80*t){o=n[0],c=n[1];let u=o,d=c;for(let l=t;l<r;l+=t){let f=n[l],g=n[l+1];f<o&&(o=f),g<c&&(c=g),f>u&&(u=f),g>d&&(d=g)}h=Math.max(u-o,d-c),h=h!==0?32767/h:0}return rs(s,a,t,o,c,h,0),a}function vu(n,e,t,i,r){let s;if(r===Cf(n,e,t,i)>0)for(let a=e;a<t;a+=i)s=Ah(a/i|0,n[a],n[a+1],s);else for(let a=t-i;a>=e;a-=i)s=Ah(a/i|0,n[a],n[a+1],s);return s&&vr(s,s.next)&&(as(s),s=s.next),s}function Ni(n,e){if(!n)return n;e||(e=n);let t=n,i;do if(i=!1,!t.steiner&&(vr(t,t.next)||gt(t.prev,t,t.next)===0)){if(as(t),t=e=t.prev,t===t.next)break;i=!0}else t=t.next;while(i||t!==e);return e}function rs(n,e,t,i,r,s,a){if(!n)return;!a&&s&&bf(n,i,r,s);let o=n;for(;n.prev!==n.next;){let c=n.prev,h=n.next;if(s?pf(n,i,r,s):ff(n)){e.push(c.i,n.i,h.i),as(n),n=h.next,o=h.next;continue}if(n=h,n===o){a?a===1?(n=mf(Ni(n),e),rs(n,e,t,i,r,s,2)):a===2&&gf(n,e,t,i,r,s):rs(Ni(n),e,t,i,r,s,1);break}}}function ff(n){let e=n.prev,t=n,i=n.next;if(gt(e,t,i)>=0)return!1;let r=e.x,s=t.x,a=i.x,o=e.y,c=t.y,h=i.y,u=Math.min(r,s,a),d=Math.min(o,c,h),l=Math.max(r,s,a),f=Math.max(o,c,h),g=i.next;for(;g!==e;){if(g.x>=u&&g.x<=l&&g.y>=d&&g.y<=f&&kr(r,o,s,c,a,h,g.x,g.y)&&gt(g.prev,g,g.next)>=0)return!1;g=g.next}return!0}function pf(n,e,t,i){let r=n.prev,s=n,a=n.next;if(gt(r,s,a)>=0)return!1;let o=r.x,c=s.x,h=a.x,u=r.y,d=s.y,l=a.y,f=Math.min(o,c,h),g=Math.min(u,d,l),v=Math.max(o,c,h),p=Math.max(u,d,l),m=Ol(f,g,e,t,i),_=Ol(v,p,e,t,i),x=n.prevZ,M=n.nextZ;for(;x&&x.z>=m&&M&&M.z<=_;){if(x.x>=f&&x.x<=v&&x.y>=g&&x.y<=p&&x!==r&&x!==a&&kr(o,u,c,d,h,l,x.x,x.y)&&gt(x.prev,x,x.next)>=0||(x=x.prevZ,M.x>=f&&M.x<=v&&M.y>=g&&M.y<=p&&M!==r&&M!==a&&kr(o,u,c,d,h,l,M.x,M.y)&&gt(M.prev,M,M.next)>=0))return!1;M=M.nextZ}for(;x&&x.z>=m;){if(x.x>=f&&x.x<=v&&x.y>=g&&x.y<=p&&x!==r&&x!==a&&kr(o,u,c,d,h,l,x.x,x.y)&&gt(x.prev,x,x.next)>=0)return!1;x=x.prevZ}for(;M&&M.z<=_;){if(M.x>=f&&M.x<=v&&M.y>=g&&M.y<=p&&M!==r&&M!==a&&kr(o,u,c,d,h,l,M.x,M.y)&&gt(M.prev,M,M.next)>=0)return!1;M=M.nextZ}return!0}function mf(n,e){let t=n;do{let i=t.prev,r=t.next.next;!vr(i,r)&&bu(i,t,t.next,r)&&ss(i,r)&&ss(r,i)&&(e.push(i.i,t.i,r.i),as(t),as(t.next),t=n=r),t=t.next}while(t!==n);return Ni(t)}function gf(n,e,t,i,r,s){let a=n;do{let o=a.next.next;for(;o!==a.prev;){if(a.i!==o.i&&Ef(a,o)){let c=Mu(a,o);a=Ni(a,a.next),c=Ni(c,c.next),rs(a,e,t,i,r,s,0),rs(c,e,t,i,r,s,0);return}o=o.next}a=a.next}while(a!==n)}function _f(n,e,t,i){let r=[];for(let s=0,a=e.length;s<a;s++){let o=e[s]*i,c=s<a-1?e[s+1]*i:n.length,h=vu(n,o,c,i,!1);h===h.next&&(h.steiner=!0),r.push(Tf(h))}r.sort(yf);for(let s=0;s<r.length;s++)t=xf(r[s],t);return t}function yf(n,e){let t=n.x-e.x;if(t===0&&(t=n.y-e.y,t===0)){let i=(n.next.y-n.y)/(n.next.x-n.x),r=(e.next.y-e.y)/(e.next.x-e.x);t=i-r}return t}function xf(n,e){let t=vf(n,e);if(!t)return e;let i=Mu(t,n);return Ni(i,i.next),Ni(t,t.next)}function vf(n,e){let t=e,i=n.x,r=n.y,s=-1/0,a;if(vr(n,t))return t;do{if(vr(n,t.next))return t.next;if(r<=t.y&&r>=t.next.y&&t.next.y!==t.y){let d=t.x+(r-t.y)*(t.next.x-t.x)/(t.next.y-t.y);if(d<=i&&d>s&&(s=d,a=t.x<t.next.x?t:t.next,d===i))return a}t=t.next}while(t!==e);if(!a)return null;let o=a,c=a.x,h=a.y,u=1/0;t=a;do{if(i>=t.x&&t.x>=c&&i!==t.x&&Su(r<h?i:s,r,c,h,r<h?s:i,r,t.x,t.y)){let d=Math.abs(r-t.y)/(i-t.x);ss(t,n)&&(d<u||d===u&&(t.x>a.x||t.x===a.x&&Sf(a,t)))&&(a=t,u=d)}t=t.next}while(t!==o);return a}function Sf(n,e){return gt(n.prev,n,e.prev)<0&&gt(e.next,n,n.next)<0}function bf(n,e,t,i){let r=n;do r.z===0&&(r.z=Ol(r.x,r.y,e,t,i)),r.prevZ=r.prev,r.nextZ=r.next,r=r.next;while(r!==n);r.prevZ.nextZ=null,r.prevZ=null,Mf(r)}function Mf(n){let e,t=1;do{let i=n,r;n=null;let s=null;for(e=0;i;){e++;let a=i,o=0;for(let h=0;h<t&&(o++,a=a.nextZ,!!a);h++);let c=t;for(;o>0||c>0&&a;)o!==0&&(c===0||!a||i.z<=a.z)?(r=i,i=i.nextZ,o--):(r=a,a=a.nextZ,c--),s?s.nextZ=r:n=r,r.prevZ=s,s=r;i=a}s.nextZ=null,t*=2}while(e>1);return n}function Ol(n,e,t,i,r){return n=(n-t)*r|0,e=(e-i)*r|0,n=(n|n<<8)&16711935,n=(n|n<<4)&252645135,n=(n|n<<2)&858993459,n=(n|n<<1)&1431655765,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,n|e<<1}function Tf(n){let e=n,t=n;do(e.x<t.x||e.x===t.x&&e.y<t.y)&&(t=e),e=e.next;while(e!==n);return t}function Su(n,e,t,i,r,s,a,o){return(r-a)*(e-o)>=(n-a)*(s-o)&&(n-a)*(i-o)>=(t-a)*(e-o)&&(t-a)*(s-o)>=(r-a)*(i-o)}function kr(n,e,t,i,r,s,a,o){return!(n===a&&e===o)&&Su(n,e,t,i,r,s,a,o)}function Ef(n,e){return n.next.i!==e.i&&n.prev.i!==e.i&&!wf(n,e)&&(ss(n,e)&&ss(e,n)&&Af(n,e)&&(gt(n.prev,n,e.prev)||gt(n,e.prev,e))||vr(n,e)&&gt(n.prev,n,n.next)>0&&gt(e.prev,e,e.next)>0)}function gt(n,e,t){return(e.y-n.y)*(t.x-e.x)-(e.x-n.x)*(t.y-e.y)}function vr(n,e){return n.x===e.x&&n.y===e.y}function bu(n,e,t,i){let r=ra(gt(n,e,t)),s=ra(gt(n,e,i)),a=ra(gt(t,i,n)),o=ra(gt(t,i,e));return!!(r!==s&&a!==o||r===0&&ia(n,t,e)||s===0&&ia(n,i,e)||a===0&&ia(t,n,i)||o===0&&ia(t,e,i))}function ia(n,e,t){return e.x<=Math.max(n.x,t.x)&&e.x>=Math.min(n.x,t.x)&&e.y<=Math.max(n.y,t.y)&&e.y>=Math.min(n.y,t.y)}function ra(n){return n>0?1:n<0?-1:0}function wf(n,e){let t=n;do{if(t.i!==n.i&&t.next.i!==n.i&&t.i!==e.i&&t.next.i!==e.i&&bu(t,t.next,n,e))return!0;t=t.next}while(t!==n);return!1}function ss(n,e){return gt(n.prev,n,n.next)<0?gt(n,e,n.next)>=0&&gt(n,n.prev,e)>=0:gt(n,e,n.prev)<0||gt(n,n.next,e)<0}function Af(n,e){let t=n,i=!1,r=(n.x+e.x)/2,s=(n.y+e.y)/2;do t.y>s!=t.next.y>s&&t.next.y!==t.y&&r<(t.next.x-t.x)*(s-t.y)/(t.next.y-t.y)+t.x&&(i=!i),t=t.next;while(t!==n);return i}function Mu(n,e){let t=Ul(n.i,n.x,n.y),i=Ul(e.i,e.x,e.y),r=n.next,s=e.prev;return n.next=e,e.prev=n,t.next=r,r.prev=t,i.next=t,t.prev=i,s.next=i,i.prev=s,i}function Ah(n,e,t,i){let r=Ul(n,e,t);return i?(r.next=i.next,r.prev=i,i.next.prev=r,i.next=r):(r.prev=r,r.next=r),r}function as(n){n.next.prev=n.prev,n.prev.next=n.next,n.prevZ&&(n.prevZ.nextZ=n.nextZ),n.nextZ&&(n.nextZ.prevZ=n.prevZ)}function Ul(n,e,t){return{i:n,x:e,y:t,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function Cf(n,e,t,i){let r=0;for(let s=e,a=t-i;s<t;s+=i)r+=(n[a]-n[s])*(n[s+1]+n[a+1]),a=s;return r}var kl=class{static triangulate(e,t,i=2){return df(e,t,i)}},lr=class n{static area(e){let t=e.length,i=0;for(let r=t-1,s=0;s<t;r=s++)i+=e[r].x*e[s].y-e[s].x*e[r].y;return i*.5}static isClockWise(e){return n.area(e)<0}static triangulateShape(e,t){let i=[],r=[],s=[];Ch(e),Rh(i,e);let a=e.length;t.forEach(Ch);for(let c=0;c<t.length;c++)r.push(a),a+=t[c].length,Rh(i,t[c]);let o=kl.triangulate(i,r);for(let c=0;c<o.length;c+=3)s.push(o.slice(c,c+3));return s}};function Ch(n){let e=n.length;e>2&&n[e-1].equals(n[0])&&n.pop()}function Rh(n,e){for(let t=0;t<e.length;t++)n.push(e[t].x),n.push(e[t].y)}var en=class n extends it{constructor(e=1,t=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:r};let s=e/2,a=t/2,o=Math.floor(i),c=Math.floor(r),h=o+1,u=c+1,d=e/o,l=t/c,f=[],g=[],v=[],p=[];for(let m=0;m<u;m++){let _=m*l-a;for(let x=0;x<h;x++){let M=x*d-s;g.push(M,-_,0),v.push(0,0,1),p.push(x/o),p.push(1-m/c)}}for(let m=0;m<c;m++)for(let _=0;_<o;_++){let x=_+h*m,M=_+h*(m+1),A=_+1+h*(m+1),E=_+1+h*m;f.push(x,M,E),f.push(M,A,E)}this.setIndex(f),this.setAttribute("position",new _t(g,3)),this.setAttribute("normal",new _t(v,3)),this.setAttribute("uv",new _t(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.widthSegments,e.heightSegments)}};var os=class n extends it{constructor(e=new xr([new ye(0,.5),new ye(-.5,-.5),new ye(.5,-.5)]),t=12){super(),this.type="ShapeGeometry",this.parameters={shapes:e,curveSegments:t};let i=[],r=[],s=[],a=[],o=0,c=0;if(Array.isArray(e)===!1)h(e);else for(let u=0;u<e.length;u++)h(e[u]),this.addGroup(o,c,u),o+=c,c=0;this.setIndex(i),this.setAttribute("position",new _t(r,3)),this.setAttribute("normal",new _t(s,3)),this.setAttribute("uv",new _t(a,2));function h(u){let d=r.length/3,l=u.extractPoints(t),f=l.shape,g=l.holes;lr.isClockWise(f)===!1&&(f=f.reverse());for(let p=0,m=g.length;p<m;p++){let _=g[p];lr.isClockWise(_)===!0&&(g[p]=_.reverse())}let v=lr.triangulateShape(f,g);for(let p=0,m=g.length;p<m;p++){let _=g[p];f=f.concat(_)}for(let p=0,m=f.length;p<m;p++){let _=f[p];r.push(_.x,_.y,0),s.push(0,0,1),a.push(_.x,_.y)}for(let p=0,m=v.length;p<m;p++){let _=v[p],x=_[0]+d,M=_[1]+d,A=_[2]+d;i.push(x,M,A),c+=3}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON(),t=this.parameters.shapes;return Rf(t,e)}static fromJSON(e,t){let i=[];for(let r=0,s=e.shapes.length;r<s;r++){let a=t[e.shapes[r]];i.push(a)}return new n(i,e.curveSegments)}};function Rf(n,e){if(e.shapes=[],Array.isArray(n))for(let t=0,i=n.length;t<i;t++){let r=n[t];e.shapes.push(r.uuid)}else e.shapes.push(n.uuid);return e}var ls=class n extends it{constructor(e=new ui(new C(-1,-1,0),new C(-1,1,0),new C(1,1,0)),t=64,i=1,r=8,s=!1){super(),this.type="TubeGeometry",this.parameters={path:e,tubularSegments:t,radius:i,radialSegments:r,closed:s};let a=e.computeFrenetFrames(t,s);this.tangents=a.tangents,this.normals=a.normals,this.binormals=a.binormals;let o=new C,c=new C,h=new ye,u=new C,d=[],l=[],f=[],g=[];v(),this.setIndex(g),this.setAttribute("position",new _t(d,3)),this.setAttribute("normal",new _t(l,3)),this.setAttribute("uv",new _t(f,2));function v(){for(let x=0;x<t;x++)p(x);p(s===!1?t:0),_(),m()}function p(x){u=e.getPointAt(x/t,u);let M=a.normals[x],A=a.binormals[x];for(let E=0;E<=r;E++){let I=E/r*Math.PI*2,S=Math.sin(I),w=-Math.cos(I);c.x=w*M.x+S*A.x,c.y=w*M.y+S*A.y,c.z=w*M.z+S*A.z,c.normalize(),l.push(c.x,c.y,c.z),o.x=u.x+i*c.x,o.y=u.y+i*c.y,o.z=u.z+i*c.z,d.push(o.x,o.y,o.z)}}function m(){for(let x=1;x<=t;x++)for(let M=1;M<=r;M++){let A=(r+1)*(x-1)+(M-1),E=(r+1)*x+(M-1),I=(r+1)*x+M,S=(r+1)*(x-1)+M;g.push(A,E,S),g.push(E,I,S)}}function _(){for(let x=0;x<=t;x++)for(let M=0;M<=r;M++)h.x=x/t,h.y=M/r,f.push(h.x,h.y)}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON();return e.path=this.parameters.path.toJSON(),e}static fromJSON(e){return new n(new Nl[e.path.type]().fromJSON(e.path),e.tubularSegments,e.radius,e.radialSegments,e.closed)}};function Ui(n){let e={};for(let t in n){e[t]={};for(let i in n[t]){let r=n[t][i];if(Ih(r))r.isRenderTargetTexture?(Ce("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=r.clone();else if(Array.isArray(r))if(Ih(r[0])){let s=[];for(let a=0,o=r.length;a<o;a++)s[a]=r[a].clone();e[t][i]=s}else e[t][i]=r.slice();else e[t][i]=r}}return e}function Ht(n){let e={};for(let t=0;t<n.length;t++){let i=Ui(n[t]);for(let r in i)e[r]=i[r]}return e}function Ih(n){return n&&(n.isColor||n.isMatrix3||n.isMatrix4||n.isVector2||n.isVector3||n.isVector4||n.isTexture||n.isQuaternion)}function If(n){let e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function uc(n){let e=n.getRenderTarget();return e===null?n.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:qe.workingColorSpace}var Tu={clone:Ui,merge:Ht},Pf=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Df=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,tn=class extends Xn{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Pf,this.fragmentShader=Df,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Ui(e.uniforms),this.uniformsGroups=If(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let r in this.uniforms){let a=this.uniforms[r].value;a&&a.isTexture?t.uniforms[r]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[r]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[r]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[r]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[r]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[r]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[r]={type:"m4",value:a.toArray()}:t.uniforms[r]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let i={};for(let r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}},Ua=class extends tn{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}};var ka=class extends Xn{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=au,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},Ba=class extends Xn{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};var Sr=class extends Nt{constructor(e){super(),this.isLineDashedMaterial=!0,this.type="LineDashedMaterial",this.scale=1,this.dashSize=3,this.gapSize=1,this.setValues(e)}copy(e){return super.copy(e),this.scale=e.scale,this.dashSize=e.dashSize,this.gapSize=e.gapSize,this}};function sa(n,e){return!n||n.constructor===e?n:typeof e.BYTES_PER_ELEMENT=="number"?new e(n):Array.prototype.slice.call(n)}var di=class{constructor(e,t,i,r){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=r!==void 0?r:new t.constructor(i),this.sampleValues=t,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,i=this._cachedIndex,r=t[i],s=t[i-1];n:{e:{let a;t:{i:if(!(e<r)){for(let o=i+2;;){if(r===void 0){if(e<s)break i;return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===o)break;if(s=r,r=t[++i],e<r)break e}a=t.length;break t}if(!(e>=s)){let o=t[1];e<o&&(i=2,s=o);for(let c=i-2;;){if(s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===c)break;if(r=s,s=t[--i-1],e>=s)break e}a=i,i=0;break t}break n}for(;i<a;){let o=i+a>>>1;e<t[o]?a=o:i=o+1}if(r=t[i],s=t[i-1],s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===void 0)return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,s,r)}return this.interpolate_(i,s,e,r)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,i=this.sampleValues,r=this.valueSize,s=e*r;for(let a=0;a!==r;++a)t[a]=i[s+a];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},Ha=class extends di{constructor(e,t,i,r){super(e,t,i,r),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Pl,endingEnd:Pl}}intervalChanged_(e,t,i){let r=this.parameterPositions,s=e-2,a=e+1,o=r[s],c=r[a];if(o===void 0)switch(this.getSettings_().endingStart){case Dl:s=e,o=2*t-i;break;case Ll:s=r.length-2,o=t+r[s]-r[s+1];break;default:s=e,o=i}if(c===void 0)switch(this.getSettings_().endingEnd){case Dl:a=e,c=2*i-t;break;case Ll:a=1,c=i+r[1]-r[0];break;default:a=e-1,c=t}let h=(i-t)*.5,u=this.valueSize;this._weightPrev=h/(t-o),this._weightNext=h/(c-i),this._offsetPrev=s*u,this._offsetNext=a*u}interpolate_(e,t,i,r){let s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,c=e*o,h=c-o,u=this._offsetPrev,d=this._offsetNext,l=this._weightPrev,f=this._weightNext,g=(i-t)/(r-t),v=g*g,p=v*g,m=-l*p+2*l*v-l*g,_=(1+l)*p+(-1.5-2*l)*v+(-.5+l)*g+1,x=(-1-f)*p+(1.5+f)*v+.5*g,M=f*p-f*v;for(let A=0;A!==o;++A)s[A]=m*a[u+A]+_*a[h+A]+x*a[c+A]+M*a[d+A];return s}},za=class extends di{constructor(e,t,i,r){super(e,t,i,r)}interpolate_(e,t,i,r){let s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,c=e*o,h=c-o,u=(i-t)/(r-t),d=1-u;for(let l=0;l!==o;++l)s[l]=a[h+l]*d+a[c+l]*u;return s}},Va=class extends di{constructor(e,t,i,r){super(e,t,i,r)}interpolate_(e){return this.copySampleValue_(e-1)}},Ga=class extends di{interpolate_(e,t,i,r){let s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,c=e*o,h=c-o,u=this.settings||this.DefaultSettings_,d=u.inTangents,l=u.outTangents;if(!d||!l){let v=(i-t)/(r-t),p=1-v;for(let m=0;m!==o;++m)s[m]=a[h+m]*p+a[c+m]*v;return s}let f=o*2,g=e-1;for(let v=0;v!==o;++v){let p=a[h+v],m=a[c+v],_=g*f+v*2,x=l[_],M=l[_+1],A=e*f+v*2,E=d[A],I=d[A+1],S=(i-t)/(r-t),w,F,R,U,G;for(let X=0;X<8;X++){w=S*S,F=w*S,R=1-S,U=R*R,G=U*R;let H=G*t+3*U*S*x+3*R*w*E+F*r-i;if(Math.abs(H)<1e-10)break;let V=3*U*(x-t)+6*R*S*(E-x)+3*w*(r-E);if(Math.abs(V)<1e-10)break;S=S-H/V,S=Math.max(0,Math.min(1,S))}s[v]=G*p+3*U*S*M+3*R*w*I+F*m}return s}},nn=class{constructor(e,t,i,r){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=sa(t,this.TimeBufferType),this.values=sa(i,this.ValueBufferType),this.setInterpolation(r||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,i;if(t.toJSON!==this.toJSON)i=t.toJSON(e);else{i={name:e.name,times:sa(e.times,Array),values:sa(e.values,Array)};let r=e.getInterpolation();r!==e.DefaultInterpolation&&(i.interpolation=r)}return i.type=e.ValueTypeName,i}InterpolantFactoryMethodDiscrete(e){return new Va(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new za(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Ha(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new Ga(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.settings=this.settings),t}setInterpolation(e){let t;switch(e){case zr:t=this.InterpolantFactoryMethodDiscrete;break;case Sa:t=this.InterpolantFactoryMethodLinear;break;case la:t=this.InterpolantFactoryMethodSmooth;break;case Il:t=this.InterpolantFactoryMethodBezier;break}if(t===void 0){let i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(i);return Ce("KeyframeTrack:",i),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return zr;case this.InterpolantFactoryMethodLinear:return Sa;case this.InterpolantFactoryMethodSmooth:return la;case this.InterpolantFactoryMethodBezier:return Il}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let i=0,r=t.length;i!==r;++i)t[i]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let i=0,r=t.length;i!==r;++i)t[i]*=e}return this}trim(e,t){let i=this.times,r=i.length,s=0,a=r-1;for(;s!==r&&i[s]<e;)++s;for(;a!==-1&&i[a]>t;)--a;if(++a,s!==0||a!==r){s>=a&&(a=Math.max(a,1),s=a-1);let o=this.getValueSize();this.times=i.slice(s,a),this.values=this.values.slice(s*o,a*o)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(Re("KeyframeTrack: Invalid value size in track.",this),e=!1);let i=this.times,r=this.values,s=i.length;s===0&&(Re("KeyframeTrack: Track is empty.",this),e=!1);let a=null;for(let o=0;o!==s;o++){let c=i[o];if(typeof c=="number"&&isNaN(c)){Re("KeyframeTrack: Time is not a valid number.",this,o,c),e=!1;break}if(a!==null&&a>c){Re("KeyframeTrack: Out of order keys.",this,o,c,a),e=!1;break}a=c}if(r!==void 0&&kd(r))for(let o=0,c=r.length;o!==c;++o){let h=r[o];if(isNaN(h)){Re("KeyframeTrack: Value is not a valid number.",this,o,h),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),i=this.getValueSize(),r=this.getInterpolation()===la,s=e.length-1,a=1;for(let o=1;o<s;++o){let c=!1,h=e[o],u=e[o+1];if(h!==u&&(o!==1||h!==e[0]))if(r)c=!0;else{let d=o*i,l=d-i,f=d+i;for(let g=0;g!==i;++g){let v=t[d+g];if(v!==t[l+g]||v!==t[f+g]){c=!0;break}}}if(c){if(o!==a){e[a]=e[o];let d=o*i,l=a*i;for(let f=0;f!==i;++f)t[l+f]=t[d+f]}++a}}if(s>0){e[a]=e[s];for(let o=s*i,c=a*i,h=0;h!==i;++h)t[c+h]=t[o+h];++a}return a!==e.length?(this.times=e.slice(0,a),this.values=t.slice(0,a*i)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),i=this.constructor,r=new i(this.name,e,t);return r.createInterpolant=this.createInterpolant,r}};nn.prototype.ValueTypeName="";nn.prototype.TimeBufferType=Float32Array;nn.prototype.ValueBufferType=Float32Array;nn.prototype.DefaultInterpolation=Sa;var fi=class extends nn{constructor(e,t,i){super(e,t,i)}};fi.prototype.ValueTypeName="bool";fi.prototype.ValueBufferType=Array;fi.prototype.DefaultInterpolation=zr;fi.prototype.InterpolantFactoryMethodLinear=void 0;fi.prototype.InterpolantFactoryMethodSmooth=void 0;var Wa=class extends nn{constructor(e,t,i,r){super(e,t,i,r)}};Wa.prototype.ValueTypeName="color";var Xa=class extends nn{constructor(e,t,i,r){super(e,t,i,r)}};Xa.prototype.ValueTypeName="number";var qa=class extends di{constructor(e,t,i,r){super(e,t,i,r)}interpolate_(e,t,i,r){let s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,c=(i-t)/(r-t),h=e*o;for(let u=h+o;h!==u;h+=4)Cn.slerpFlat(s,0,a,h-o,a,h,c);return s}},cs=class extends nn{constructor(e,t,i,r){super(e,t,i,r)}InterpolantFactoryMethodLinear(e){return new qa(this.times,this.values,this.getValueSize(),e)}};cs.prototype.ValueTypeName="quaternion";cs.prototype.InterpolantFactoryMethodSmooth=void 0;var pi=class extends nn{constructor(e,t,i){super(e,t,i)}};pi.prototype.ValueTypeName="string";pi.prototype.ValueBufferType=Array;pi.prototype.DefaultInterpolation=zr;pi.prototype.InterpolantFactoryMethodLinear=void 0;pi.prototype.InterpolantFactoryMethodSmooth=void 0;var Ya=class extends nn{constructor(e,t,i,r){super(e,t,i,r)}};Ya.prototype.ValueTypeName="vector";var ca={enabled:!1,files:{},add:function(n,e){this.enabled!==!1&&(Ph(n)||(this.files[n]=e))},get:function(n){if(this.enabled!==!1&&!Ph(n))return this.files[n]},remove:function(n){delete this.files[n]},clear:function(){this.files={}}};function Ph(n){try{let e=n.slice(n.indexOf(":")+1);return new URL(e).protocol==="blob:"}catch{return!1}}var $a=class{constructor(e,t,i){let r=this,s=!1,a=0,o=0,c,h=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=i,this._abortController=null,this.itemStart=function(u){o++,s===!1&&r.onStart!==void 0&&r.onStart(u,a,o),s=!0},this.itemEnd=function(u){a++,r.onProgress!==void 0&&r.onProgress(u,a,o),a===o&&(s=!1,r.onLoad!==void 0&&r.onLoad())},this.itemError=function(u){r.onError!==void 0&&r.onError(u)},this.resolveURL=function(u){return c?c(u):u},this.setURLModifier=function(u){return c=u,this},this.addHandler=function(u,d){return h.push(u,d),this},this.removeHandler=function(u){let d=h.indexOf(u);return d!==-1&&h.splice(d,2),this},this.getHandler=function(u){for(let d=0,l=h.length;d<l;d+=2){let f=h[d],g=h[d+1];if(f.global&&(f.lastIndex=0),f.test(u))return g}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},Eu=new $a,br=class{constructor(e){this.manager=e!==void 0?e:Eu,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(e,t){let i=this;return new Promise(function(r,s){i.load(e,r,t,s)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};br.DEFAULT_MATERIAL_NAME="__DEFAULT";var rr=new WeakMap,Za=class extends br{constructor(e){super(e)}load(e,t,i,r){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let s=this,a=ca.get(`image:${e}`);if(a!==void 0){if(a.complete===!0)s.manager.itemStart(e),setTimeout(function(){t&&t(a),s.manager.itemEnd(e)},0);else{let d=rr.get(a);d===void 0&&(d=[],rr.set(a,d)),d.push({onLoad:t,onError:r})}return a}let o=cr("img");function c(){u(),t&&t(this);let d=rr.get(this)||[];for(let l=0;l<d.length;l++){let f=d[l];f.onLoad&&f.onLoad(this)}rr.delete(this),s.manager.itemEnd(e)}function h(d){u(),r&&r(d),ca.remove(`image:${e}`);let l=rr.get(this)||[];for(let f=0;f<l.length;f++){let g=l[f];g.onError&&g.onError(d)}rr.delete(this),s.manager.itemError(e),s.manager.itemEnd(e)}function u(){o.removeEventListener("load",c,!1),o.removeEventListener("error",h,!1)}return o.addEventListener("load",c,!1),o.addEventListener("error",h,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(o.crossOrigin=this.crossOrigin),ca.add(`image:${e}`,o),s.manager.itemStart(e),o.src=e,o}};var hs=class extends br{constructor(e){super(e)}load(e,t,i,r){let s=new Lt,a=new Za(this.manager);return a.setCrossOrigin(this.crossOrigin),a.setPath(this.path),a.load(e,function(o){s.image=o,s.needsUpdate=!0,t!==void 0&&t(s)},i,r),s}};var aa=new C,oa=new Cn,Mn=new C,us=class extends qt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ft,this.projectionMatrix=new ft,this.projectionMatrixInverse=new ft,this.coordinateSystem=dn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(aa,oa,Mn),Mn.x===1&&Mn.y===1&&Mn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(aa,oa,Mn.set(1,1,1)).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorld.decompose(aa,oa,Mn),Mn.x===1&&Mn.y===1&&Mn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(aa,oa,Mn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},oi=new C,Dh=new ye,Lh=new ye,Wt=class extends us{constructor(e=50,t=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=Ta*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(nl*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Ta*2*Math.atan(Math.tan(nl*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){oi.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(oi.x,oi.y).multiplyScalar(-e/oi.z),oi.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(oi.x,oi.y).multiplyScalar(-e/oi.z)}getViewSize(e,t){return this.getViewBounds(e,Dh,Lh),t.subVectors(Lh,Dh)}setViewOffset(e,t,i,r,s,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(nl*.5*this.fov)/this.zoom,i=2*t,r=this.aspect*i,s=-.5*r,a=this.view;if(this.view!==null&&this.view.enabled){let c=a.fullWidth,h=a.fullHeight;s+=a.offsetX*r/c,t-=a.offsetY*i/h,r*=a.width/c,i*=a.height/h}let o=this.filmOffset;o!==0&&(s+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,t,t-i,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}};var mi=class extends us{constructor(e=-1,t=1,i=1,r=-1,s=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=r,this.near=s,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,r,s,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2,s=i-e,a=i+e,o=r+t,c=r-t;if(this.view!==null&&this.view.enabled){let h=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=h*this.view.offsetX,a=s+h*this.view.width,o-=u*this.view.offsetY,c=o-u*this.view.height}this.projectionMatrix.makeOrthographic(s,a,o,c,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}};var sr=-90,ar=1,Ka=class extends qt{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new Wt(sr,ar,e,t);r.layers=this.layers,this.add(r);let s=new Wt(sr,ar,e,t);s.layers=this.layers,this.add(s);let a=new Wt(sr,ar,e,t);a.layers=this.layers,this.add(a);let o=new Wt(sr,ar,e,t);o.layers=this.layers,this.add(o);let c=new Wt(sr,ar,e,t);c.layers=this.layers,this.add(c);let h=new Wt(sr,ar,e,t);h.layers=this.layers,this.add(h)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[i,r,s,a,o,c]=t;for(let h of t)this.remove(h);if(e===dn)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(e===Wr)i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let h of t)this.add(h),h.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[s,a,o,c,h,u]=this.children,d=e.getRenderTarget(),l=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;let v=i.texture.generateMipmaps;i.texture.generateMipmaps=!1;let p=!1;e.isWebGLRenderer===!0?p=e.state.buffers.depth.getReversed():p=e.reversedDepthBuffer,e.setRenderTarget(i,0,r),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(i,1,r),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(i,2,r),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(i,3,r),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),e.setRenderTarget(i,4,r),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,h),i.texture.generateMipmaps=v,e.setRenderTarget(i,5,r),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,u),e.setRenderTarget(d,l,f),e.xr.enabled=g,i.texture.needsPMREMUpdate=!0}},Ja=class extends Wt{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}};var dc="\\[\\]\\.:\\/",Lf=new RegExp("["+dc+"]","g"),fc="[^"+dc+"]",Ff="[^"+dc.replace("\\.","")+"]",Nf=/((?:WC+[\/:])*)/.source.replace("WC",fc),Of=/(WCOD+)?/.source.replace("WCOD",Ff),Uf=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",fc),kf=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",fc),Bf=new RegExp("^"+Nf+Of+Uf+kf+"$"),Hf=["material","materials","bones","map"],Bl=class{constructor(e,t,i){let r=i||ut.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,r)}getValue(e,t){this.bind();let i=this._targetGroup.nCachedObjects_,r=this._bindings[i];r!==void 0&&r.getValue(e,t)}setValue(e,t){let i=this._bindings;for(let r=this._targetGroup.nCachedObjects_,s=i.length;r!==s;++r)i[r].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].unbind()}},ut=class n{constructor(e,t,i){this.path=t,this.parsedPath=i||n.parseTrackName(t),this.node=n.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,i){return e&&e.isAnimationObjectGroup?new n.Composite(e,t,i):new n(e,t,i)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(Lf,"")}static parseTrackName(e){let t=Bf.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let i={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},r=i.nodeName&&i.nodeName.lastIndexOf(".");if(r!==void 0&&r!==-1){let s=i.nodeName.substring(r+1);Hf.indexOf(s)!==-1&&(i.nodeName=i.nodeName.substring(0,r),i.objectName=s)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return i}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let i=e.skeleton.getBoneByName(t);if(i!==void 0)return i}if(e.children){let i=function(s){for(let a=0;a<s.length;a++){let o=s[a];if(o.name===t||o.uuid===t)return o;let c=i(o.children);if(c)return c}return null},r=i(e.children);if(r)return r}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)e[t++]=i[r]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)i[r]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)i[r]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)i[r]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,i=t.objectName,r=t.propertyName,s=t.propertyIndex;if(e||(e=n.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){Ce("PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let h=t.objectIndex;switch(i){case"materials":if(!e.material){Re("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){Re("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){Re("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let u=0;u<e.length;u++)if(e[u].name===h){h=u;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){Re("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){Re("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[i]===void 0){Re("PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[i]}if(h!==void 0){if(e[h]===void 0){Re("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[h]}}let a=e[r];if(a===void 0){let h=t.nodeName;Re("PropertyBinding: Trying to update property for track: "+h+"."+r+" but it wasn't found.",e);return}let o=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?o=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(s!==void 0){if(r==="morphTargetInfluences"){if(!e.geometry){Re("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){Re("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[s]!==void 0&&(s=e.morphTargetDictionary[s])}c=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=s}else a.fromArray!==void 0&&a.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(c=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=r;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};ut.Composite=Bl;ut.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};ut.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};ut.prototype.GetterByBindingType=[ut.prototype._getValue_direct,ut.prototype._getValue_array,ut.prototype._getValue_arrayElement,ut.prototype._getValue_toArray];ut.prototype.SetterByBindingTypeAndVersioning=[[ut.prototype._setValue_direct,ut.prototype._setValue_direct_setNeedsUpdate,ut.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[ut.prototype._setValue_array,ut.prototype._setValue_array_setNeedsUpdate,ut.prototype._setValue_array_setMatrixWorldNeedsUpdate],[ut.prototype._setValue_arrayElement,ut.prototype._setValue_arrayElement_setNeedsUpdate,ut.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[ut.prototype._setValue_fromArray,ut.prototype._setValue_fromArray_setNeedsUpdate,ut.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var tx=new Float32Array(1);var Fh=new ft,Mr=class{constructor(e,t,i=0,r=1/0){this.ray=new mr(e,t),this.near=i,this.far=r,this.camera=null,this.layers=new dr,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,(t.near+t.far)/(t.near-t.far)).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):Re("Raycaster: Unsupported camera type: "+t.type)}setFromXRController(e){return Fh.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Fh),this}intersectObject(e,t=!0,i=[]){return Hl(e,this,i,t),i.sort(Nh),i}intersectObjects(e,t=!0,i=[]){for(let r=0,s=e.length;r<s;r++)Hl(e[r],this,i,t);return i.sort(Nh),i}};function Nh(n,e){return n.distance-e.distance}function Hl(n,e,t,i){let r=!0;if(n.layers.test(e.layers)&&n.raycast(e,t)===!1&&(r=!1),r===!0&&i===!0){let s=n.children;for(let a=0,o=s.length;a<o;a++)Hl(s[a],e,t,!0)}}var zl=class n{static{n.prototype.isMatrix2=!0}constructor(e,t,i,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,i,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let i=0;i<4;i++)this.elements[i]=e[i+t];return this}set(e,t,i,r){let s=this.elements;return s[0]=e,s[2]=t,s[1]=i,s[3]=r,this}};function pc(n,e,t,i){let r=zf(i);switch(t){case sc:return n*e;case oc:return n*e/r.components*r.byteLength;case ro:return n*e/r.components*r.byteLength;case yi:return n*e*2/r.components*r.byteLength;case so:return n*e*2/r.components*r.byteLength;case ac:return n*e*3/r.components*r.byteLength;case ln:return n*e*4/r.components*r.byteLength;case ao:return n*e*4/r.components*r.byteLength;case ms:case gs:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case _s:case ys:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case lo:case ho:return Math.max(n,16)*Math.max(e,8)/4;case oo:case co:return Math.max(n,8)*Math.max(e,8)/2;case uo:case fo:case mo:case go:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case po:case xs:case _o:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case yo:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case xo:return Math.floor((n+4)/5)*Math.floor((e+3)/4)*16;case vo:return Math.floor((n+4)/5)*Math.floor((e+4)/5)*16;case So:return Math.floor((n+5)/6)*Math.floor((e+4)/5)*16;case bo:return Math.floor((n+5)/6)*Math.floor((e+5)/6)*16;case Mo:return Math.floor((n+7)/8)*Math.floor((e+4)/5)*16;case To:return Math.floor((n+7)/8)*Math.floor((e+5)/6)*16;case Eo:return Math.floor((n+7)/8)*Math.floor((e+7)/8)*16;case wo:return Math.floor((n+9)/10)*Math.floor((e+4)/5)*16;case Ao:return Math.floor((n+9)/10)*Math.floor((e+5)/6)*16;case Co:return Math.floor((n+9)/10)*Math.floor((e+7)/8)*16;case Ro:return Math.floor((n+9)/10)*Math.floor((e+9)/10)*16;case Io:return Math.floor((n+11)/12)*Math.floor((e+9)/10)*16;case Po:return Math.floor((n+11)/12)*Math.floor((e+11)/12)*16;case Do:case Lo:case Fo:return Math.ceil(n/4)*Math.ceil(e/4)*16;case No:case Oo:return Math.ceil(n/4)*Math.ceil(e/4)*8;case vs:case Uo:return Math.ceil(n/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function zf(n){switch(n){case rn:case tc:return{byteLength:1,components:1};case Er:case nc:case Pn:return{byteLength:2,components:1};case no:case io:return{byteLength:2,components:4};case _n:case to:case yn:return{byteLength:4,components:1};case ic:case rc:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${n}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"184"}}));typeof window<"u"&&(window.__THREE__?Ce("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="184");function $u(){let n=null,e=!1,t=null,i=null;function r(s,a){t(s,a),i=n.requestAnimationFrame(r)}return{start:function(){e!==!0&&t!==null&&n!==null&&(i=n.requestAnimationFrame(r),e=!0)},stop:function(){n!==null&&n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(s){t=s},setContext:function(s){n=s}}}function Gf(n){let e=new WeakMap;function t(o,c){let h=o.array,u=o.usage,d=h.byteLength,l=n.createBuffer();n.bindBuffer(c,l),n.bufferData(c,h,u),o.onUploadCallback();let f;if(h instanceof Float32Array)f=n.FLOAT;else if(typeof Float16Array<"u"&&h instanceof Float16Array)f=n.HALF_FLOAT;else if(h instanceof Uint16Array)o.isFloat16BufferAttribute?f=n.HALF_FLOAT:f=n.UNSIGNED_SHORT;else if(h instanceof Int16Array)f=n.SHORT;else if(h instanceof Uint32Array)f=n.UNSIGNED_INT;else if(h instanceof Int32Array)f=n.INT;else if(h instanceof Int8Array)f=n.BYTE;else if(h instanceof Uint8Array)f=n.UNSIGNED_BYTE;else if(h instanceof Uint8ClampedArray)f=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+h);return{buffer:l,type:f,bytesPerElement:h.BYTES_PER_ELEMENT,version:o.version,size:d}}function i(o,c,h){let u=c.array,d=c.updateRanges;if(n.bindBuffer(h,o),d.length===0)n.bufferSubData(h,0,u);else{d.sort((f,g)=>f.start-g.start);let l=0;for(let f=1;f<d.length;f++){let g=d[l],v=d[f];v.start<=g.start+g.count+1?g.count=Math.max(g.count,v.start+v.count-g.start):(++l,d[l]=v)}d.length=l+1;for(let f=0,g=d.length;f<g;f++){let v=d[f];n.bufferSubData(h,v.start*u.BYTES_PER_ELEMENT,u,v.start,v.count)}c.clearUpdateRanges()}c.onUploadCallback()}function r(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function s(o){o.isInterleavedBufferAttribute&&(o=o.data);let c=e.get(o);c&&(n.deleteBuffer(c.buffer),e.delete(o))}function a(o,c){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let u=e.get(o);(!u||u.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let h=e.get(o);if(h===void 0)e.set(o,t(o,c));else if(h.version<o.version){if(h.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(h.buffer,o,c),h.version=o.version}}return{get:r,remove:s,update:a}}var Wf=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Xf=`#ifdef USE_ALPHAHASH
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
#endif`,qf=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Yf=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,$f=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Zf=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Kf=`#ifdef USE_AOMAP
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
#endif`,Jf=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,jf=`#ifdef USE_BATCHING
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
#endif`,Qf=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,ep=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,tp=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,np=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,ip=`#ifdef USE_IRIDESCENCE
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
#endif`,rp=`#ifdef USE_BUMPMAP
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
#endif`,sp=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,ap=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,op=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,lp=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,cp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,hp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,up=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,dp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,fp=`#define PI 3.141592653589793
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
} // validated`,pp=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,mp=`vec3 transformedNormal = objectNormal;
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
#endif`,gp=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,_p=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,yp=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,xp=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,vp="gl_FragColor = linearToOutputTexel( gl_FragColor );",Sp=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,bp=`#ifdef USE_ENVMAP
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
#endif`,Mp=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,Tp=`#ifdef USE_ENVMAP
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
#endif`,Ep=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS

		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,wp=`#ifdef USE_ENVMAP
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
#endif`,Ap=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Cp=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Rp=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Ip=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Pp=`#ifdef USE_GRADIENTMAP
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
}`,Dp=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Lp=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Fp=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Np=`uniform bool receiveShadow;
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
#include <lightprobes_pars_fragment>`,Op=`#ifdef USE_ENVMAP
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
#endif`,Up=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,kp=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Bp=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Hp=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,zp=`PhysicalMaterial material;
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
#endif`,Vp=`uniform sampler2D dfgLUT;
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
}`,Gp=`
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
#endif`,Wp=`#if defined( RE_IndirectDiffuse )
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
#endif`,Xp=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,qp=`#ifdef USE_LIGHT_PROBES_GRID
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
#endif`,Yp=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,$p=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Zp=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Kp=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Jp=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,jp=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Qp=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,em=`#if defined( USE_POINTS_UV )
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
#endif`,tm=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,nm=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,im=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,rm=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,sm=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,am=`#ifdef USE_MORPHTARGETS
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
#endif`,om=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,lm=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,cm=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,hm=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,um=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,dm=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,fm=`#ifdef USE_NORMALMAP
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
#endif`,pm=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,mm=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,gm=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,_m=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,ym=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,xm=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,vm=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Sm=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,bm=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Mm=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Tm=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Em=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,wm=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Am=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Cm=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,Rm=`float getShadowMask() {
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
}`,Im=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Pm=`#ifdef USE_SKINNING
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
#endif`,Dm=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Lm=`#ifdef USE_SKINNING
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
#endif`,Fm=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Nm=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Om=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Um=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,km=`#ifdef USE_TRANSMISSION
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
#endif`,Bm=`#ifdef USE_TRANSMISSION
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
#endif`,Hm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,zm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Vm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Gm=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,Wm=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Xm=`uniform sampler2D t2D;
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
}`,qm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Ym=`#ifdef ENVMAP_TYPE_CUBE
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
}`,$m=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Zm=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Km=`#include <common>
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
}`,Jm=`#if DEPTH_PACKING == 3200
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
}`,jm=`#define DISTANCE
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
}`,Qm=`#define DISTANCE
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
}`,eg=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,tg=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,ng=`uniform float scale;
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
}`,ig=`uniform vec3 diffuse;
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
}`,rg=`#include <common>
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
}`,sg=`uniform vec3 diffuse;
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
}`,ag=`#define LAMBERT
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
}`,og=`#define LAMBERT
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
}`,lg=`#define MATCAP
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
}`,cg=`#define MATCAP
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
}`,hg=`#define NORMAL
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
}`,ug=`#define NORMAL
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
}`,dg=`#define PHONG
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
}`,fg=`#define PHONG
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
}`,pg=`#define STANDARD
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
}`,mg=`#define STANDARD
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
}`,gg=`#define TOON
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
}`,_g=`#define TOON
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
}`,yg=`uniform float size;
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
}`,xg=`uniform vec3 diffuse;
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
}`,vg=`#include <common>
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
}`,Sg=`uniform vec3 color;
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
}`,bg=`uniform float rotation;
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
}`,Mg=`uniform vec3 diffuse;
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
}`,He={alphahash_fragment:Wf,alphahash_pars_fragment:Xf,alphamap_fragment:qf,alphamap_pars_fragment:Yf,alphatest_fragment:$f,alphatest_pars_fragment:Zf,aomap_fragment:Kf,aomap_pars_fragment:Jf,batching_pars_vertex:jf,batching_vertex:Qf,begin_vertex:ep,beginnormal_vertex:tp,bsdfs:np,iridescence_fragment:ip,bumpmap_pars_fragment:rp,clipping_planes_fragment:sp,clipping_planes_pars_fragment:ap,clipping_planes_pars_vertex:op,clipping_planes_vertex:lp,color_fragment:cp,color_pars_fragment:hp,color_pars_vertex:up,color_vertex:dp,common:fp,cube_uv_reflection_fragment:pp,defaultnormal_vertex:mp,displacementmap_pars_vertex:gp,displacementmap_vertex:_p,emissivemap_fragment:yp,emissivemap_pars_fragment:xp,colorspace_fragment:vp,colorspace_pars_fragment:Sp,envmap_fragment:bp,envmap_common_pars_fragment:Mp,envmap_pars_fragment:Tp,envmap_pars_vertex:Ep,envmap_physical_pars_fragment:Op,envmap_vertex:wp,fog_vertex:Ap,fog_pars_vertex:Cp,fog_fragment:Rp,fog_pars_fragment:Ip,gradientmap_pars_fragment:Pp,lightmap_pars_fragment:Dp,lights_lambert_fragment:Lp,lights_lambert_pars_fragment:Fp,lights_pars_begin:Np,lights_toon_fragment:Up,lights_toon_pars_fragment:kp,lights_phong_fragment:Bp,lights_phong_pars_fragment:Hp,lights_physical_fragment:zp,lights_physical_pars_fragment:Vp,lights_fragment_begin:Gp,lights_fragment_maps:Wp,lights_fragment_end:Xp,lightprobes_pars_fragment:qp,logdepthbuf_fragment:Yp,logdepthbuf_pars_fragment:$p,logdepthbuf_pars_vertex:Zp,logdepthbuf_vertex:Kp,map_fragment:Jp,map_pars_fragment:jp,map_particle_fragment:Qp,map_particle_pars_fragment:em,metalnessmap_fragment:tm,metalnessmap_pars_fragment:nm,morphinstance_vertex:im,morphcolor_vertex:rm,morphnormal_vertex:sm,morphtarget_pars_vertex:am,morphtarget_vertex:om,normal_fragment_begin:lm,normal_fragment_maps:cm,normal_pars_fragment:hm,normal_pars_vertex:um,normal_vertex:dm,normalmap_pars_fragment:fm,clearcoat_normal_fragment_begin:pm,clearcoat_normal_fragment_maps:mm,clearcoat_pars_fragment:gm,iridescence_pars_fragment:_m,opaque_fragment:ym,packing:xm,premultiplied_alpha_fragment:vm,project_vertex:Sm,dithering_fragment:bm,dithering_pars_fragment:Mm,roughnessmap_fragment:Tm,roughnessmap_pars_fragment:Em,shadowmap_pars_fragment:wm,shadowmap_pars_vertex:Am,shadowmap_vertex:Cm,shadowmask_pars_fragment:Rm,skinbase_vertex:Im,skinning_pars_vertex:Pm,skinning_vertex:Dm,skinnormal_vertex:Lm,specularmap_fragment:Fm,specularmap_pars_fragment:Nm,tonemapping_fragment:Om,tonemapping_pars_fragment:Um,transmission_fragment:km,transmission_pars_fragment:Bm,uv_pars_fragment:Hm,uv_pars_vertex:zm,uv_vertex:Vm,worldpos_vertex:Gm,background_vert:Wm,background_frag:Xm,backgroundCube_vert:qm,backgroundCube_frag:Ym,cube_vert:$m,cube_frag:Zm,depth_vert:Km,depth_frag:Jm,distance_vert:jm,distance_frag:Qm,equirect_vert:eg,equirect_frag:tg,linedashed_vert:ng,linedashed_frag:ig,meshbasic_vert:rg,meshbasic_frag:sg,meshlambert_vert:ag,meshlambert_frag:og,meshmatcap_vert:lg,meshmatcap_frag:cg,meshnormal_vert:hg,meshnormal_frag:ug,meshphong_vert:dg,meshphong_frag:fg,meshphysical_vert:pg,meshphysical_frag:mg,meshtoon_vert:gg,meshtoon_frag:_g,points_vert:yg,points_frag:xg,shadow_vert:vg,shadow_frag:Sg,sprite_vert:bg,sprite_frag:Mg},le={common:{diffuse:{value:new Ze(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Le},alphaMap:{value:null},alphaMapTransform:{value:new Le},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Le}},envmap:{envMap:{value:null},envMapRotation:{value:new Le},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Le}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Le}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Le},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Le},normalScale:{value:new ye(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Le},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Le}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Le}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Le}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ze(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new C},probesMax:{value:new C},probesResolution:{value:new C}},points:{diffuse:{value:new Ze(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Le},alphaTest:{value:0},uvTransform:{value:new Le}},sprite:{diffuse:{value:new Ze(16777215)},opacity:{value:1},center:{value:new ye(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Le},alphaMap:{value:null},alphaMapTransform:{value:new Le},alphaTest:{value:0}}},Ln={basic:{uniforms:Ht([le.common,le.specularmap,le.envmap,le.aomap,le.lightmap,le.fog]),vertexShader:He.meshbasic_vert,fragmentShader:He.meshbasic_frag},lambert:{uniforms:Ht([le.common,le.specularmap,le.envmap,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.fog,le.lights,{emissive:{value:new Ze(0)},envMapIntensity:{value:1}}]),vertexShader:He.meshlambert_vert,fragmentShader:He.meshlambert_frag},phong:{uniforms:Ht([le.common,le.specularmap,le.envmap,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.fog,le.lights,{emissive:{value:new Ze(0)},specular:{value:new Ze(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:He.meshphong_vert,fragmentShader:He.meshphong_frag},standard:{uniforms:Ht([le.common,le.envmap,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.roughnessmap,le.metalnessmap,le.fog,le.lights,{emissive:{value:new Ze(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:He.meshphysical_vert,fragmentShader:He.meshphysical_frag},toon:{uniforms:Ht([le.common,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.gradientmap,le.fog,le.lights,{emissive:{value:new Ze(0)}}]),vertexShader:He.meshtoon_vert,fragmentShader:He.meshtoon_frag},matcap:{uniforms:Ht([le.common,le.bumpmap,le.normalmap,le.displacementmap,le.fog,{matcap:{value:null}}]),vertexShader:He.meshmatcap_vert,fragmentShader:He.meshmatcap_frag},points:{uniforms:Ht([le.points,le.fog]),vertexShader:He.points_vert,fragmentShader:He.points_frag},dashed:{uniforms:Ht([le.common,le.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:He.linedashed_vert,fragmentShader:He.linedashed_frag},depth:{uniforms:Ht([le.common,le.displacementmap]),vertexShader:He.depth_vert,fragmentShader:He.depth_frag},normal:{uniforms:Ht([le.common,le.bumpmap,le.normalmap,le.displacementmap,{opacity:{value:1}}]),vertexShader:He.meshnormal_vert,fragmentShader:He.meshnormal_frag},sprite:{uniforms:Ht([le.sprite,le.fog]),vertexShader:He.sprite_vert,fragmentShader:He.sprite_frag},background:{uniforms:{uvTransform:{value:new Le},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:He.background_vert,fragmentShader:He.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Le}},vertexShader:He.backgroundCube_vert,fragmentShader:He.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:He.cube_vert,fragmentShader:He.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:He.equirect_vert,fragmentShader:He.equirect_frag},distance:{uniforms:Ht([le.common,le.displacementmap,{referencePosition:{value:new C},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:He.distance_vert,fragmentShader:He.distance_frag},shadow:{uniforms:Ht([le.lights,le.fog,{color:{value:new Ze(0)},opacity:{value:1}}]),vertexShader:He.shadow_vert,fragmentShader:He.shadow_frag}};Ln.physical={uniforms:Ht([Ln.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Le},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Le},clearcoatNormalScale:{value:new ye(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Le},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Le},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Le},sheen:{value:0},sheenColor:{value:new Ze(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Le},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Le},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Le},transmissionSamplerSize:{value:new ye},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Le},attenuationDistance:{value:0},attenuationColor:{value:new Ze(0)},specularColor:{value:new Ze(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Le},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Le},anisotropyVector:{value:new ye},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Le}}]),vertexShader:He.meshphysical_vert,fragmentShader:He.meshphysical_frag};var Ho={r:0,b:0,g:0},Tg=new ft,Zu=new Le;Zu.set(-1,0,0,0,1,0,0,0,1);function Eg(n,e,t,i,r,s){let a=new Ze(0),o=r===!0?0:1,c,h,u=null,d=0,l=null;function f(_){let x=_.isScene===!0?_.background:null;if(x&&x.isTexture){let M=_.backgroundBlurriness>0;x=e.get(x,M)}return x}function g(_){let x=!1,M=f(_);M===null?p(a,o):M&&M.isColor&&(p(M,1),x=!0);let A=n.xr.getEnvironmentBlendMode();A==="additive"?t.buffers.color.setClear(0,0,0,1,s):A==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,s),(n.autoClear||x)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function v(_,x){let M=f(x);M&&(M.isCubeTexture||M.mapping===fs)?(h===void 0&&(h=new dt(new _r(1,1,1),new tn({name:"BackgroundCubeMaterial",uniforms:Ui(Ln.backgroundCube.uniforms),vertexShader:Ln.backgroundCube.vertexShader,fragmentShader:Ln.backgroundCube.fragmentShader,side:Vt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(A,E,I){this.matrixWorld.copyPosition(I.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(h)),h.material.uniforms.envMap.value=M,h.material.uniforms.backgroundBlurriness.value=x.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=x.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(Tg.makeRotationFromEuler(x.backgroundRotation)).transpose(),M.isCubeTexture&&M.isRenderTargetTexture===!1&&h.material.uniforms.backgroundRotation.value.premultiply(Zu),h.material.toneMapped=qe.getTransfer(M.colorSpace)!==Je,(u!==M||d!==M.version||l!==n.toneMapping)&&(h.material.needsUpdate=!0,u=M,d=M.version,l=n.toneMapping),h.layers.enableAll(),_.unshift(h,h.geometry,h.material,0,0,null)):M&&M.isTexture&&(c===void 0&&(c=new dt(new en(2,2),new tn({name:"BackgroundMaterial",uniforms:Ui(Ln.background.uniforms),vertexShader:Ln.background.vertexShader,fragmentShader:Ln.background.fragmentShader,side:Wn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(c)),c.material.uniforms.t2D.value=M,c.material.uniforms.backgroundIntensity.value=x.backgroundIntensity,c.material.toneMapped=qe.getTransfer(M.colorSpace)!==Je,M.matrixAutoUpdate===!0&&M.updateMatrix(),c.material.uniforms.uvTransform.value.copy(M.matrix),(u!==M||d!==M.version||l!==n.toneMapping)&&(c.material.needsUpdate=!0,u=M,d=M.version,l=n.toneMapping),c.layers.enableAll(),_.unshift(c,c.geometry,c.material,0,0,null))}function p(_,x){_.getRGB(Ho,uc(n)),t.buffers.color.setClear(Ho.r,Ho.g,Ho.b,x,s)}function m(){h!==void 0&&(h.geometry.dispose(),h.material.dispose(),h=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return a},setClearColor:function(_,x=1){a.set(_),o=x,p(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(_){o=_,p(a,o)},render:g,addToRenderList:v,dispose:m}}function wg(n,e){let t=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},r=l(null),s=r,a=!1;function o(R,U,G,X,N){let H=!1,V=d(R,X,G,U);s!==V&&(s=V,h(s.object)),H=f(R,X,G,N),H&&g(R,X,G,N),N!==null&&e.update(N,n.ELEMENT_ARRAY_BUFFER),(H||a)&&(a=!1,M(R,U,G,X),N!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(N).buffer))}function c(){return n.createVertexArray()}function h(R){return n.bindVertexArray(R)}function u(R){return n.deleteVertexArray(R)}function d(R,U,G,X){let N=X.wireframe===!0,H=i[U.id];H===void 0&&(H={},i[U.id]=H);let V=R.isInstancedMesh===!0?R.id:0,j=H[V];j===void 0&&(j={},H[V]=j);let Q=j[G.id];Q===void 0&&(Q={},j[G.id]=Q);let ce=Q[N];return ce===void 0&&(ce=l(c()),Q[N]=ce),ce}function l(R){let U=[],G=[],X=[];for(let N=0;N<t;N++)U[N]=0,G[N]=0,X[N]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:U,enabledAttributes:G,attributeDivisors:X,object:R,attributes:{},index:null}}function f(R,U,G,X){let N=s.attributes,H=U.attributes,V=0,j=G.getAttributes();for(let Q in j)if(j[Q].location>=0){let be=N[Q],we=H[Q];if(we===void 0&&(Q==="instanceMatrix"&&R.instanceMatrix&&(we=R.instanceMatrix),Q==="instanceColor"&&R.instanceColor&&(we=R.instanceColor)),be===void 0||be.attribute!==we||we&&be.data!==we.data)return!0;V++}return s.attributesNum!==V||s.index!==X}function g(R,U,G,X){let N={},H=U.attributes,V=0,j=G.getAttributes();for(let Q in j)if(j[Q].location>=0){let be=H[Q];be===void 0&&(Q==="instanceMatrix"&&R.instanceMatrix&&(be=R.instanceMatrix),Q==="instanceColor"&&R.instanceColor&&(be=R.instanceColor));let we={};we.attribute=be,be&&be.data&&(we.data=be.data),N[Q]=we,V++}s.attributes=N,s.attributesNum=V,s.index=X}function v(){let R=s.newAttributes;for(let U=0,G=R.length;U<G;U++)R[U]=0}function p(R){m(R,0)}function m(R,U){let G=s.newAttributes,X=s.enabledAttributes,N=s.attributeDivisors;G[R]=1,X[R]===0&&(n.enableVertexAttribArray(R),X[R]=1),N[R]!==U&&(n.vertexAttribDivisor(R,U),N[R]=U)}function _(){let R=s.newAttributes,U=s.enabledAttributes;for(let G=0,X=U.length;G<X;G++)U[G]!==R[G]&&(n.disableVertexAttribArray(G),U[G]=0)}function x(R,U,G,X,N,H,V){V===!0?n.vertexAttribIPointer(R,U,G,N,H):n.vertexAttribPointer(R,U,G,X,N,H)}function M(R,U,G,X){v();let N=X.attributes,H=G.getAttributes(),V=U.defaultAttributeValues;for(let j in H){let Q=H[j];if(Q.location>=0){let ce=N[j];if(ce===void 0&&(j==="instanceMatrix"&&R.instanceMatrix&&(ce=R.instanceMatrix),j==="instanceColor"&&R.instanceColor&&(ce=R.instanceColor)),ce!==void 0){let be=ce.normalized,we=ce.itemSize,Ye=e.get(ce);if(Ye===void 0)continue;let je=Ye.buffer,Ue=Ye.type,Z=Ye.bytesPerElement,fe=Ue===n.INT||Ue===n.UNSIGNED_INT||ce.gpuType===to;if(ce.isInterleavedBufferAttribute){let ie=ce.data,Ie=ie.stride,Fe=ce.offset;if(ie.isInstancedInterleavedBuffer){for(let Pe=0;Pe<Q.locationSize;Pe++)m(Q.location+Pe,ie.meshPerAttribute);R.isInstancedMesh!==!0&&X._maxInstanceCount===void 0&&(X._maxInstanceCount=ie.meshPerAttribute*ie.count)}else for(let Pe=0;Pe<Q.locationSize;Pe++)p(Q.location+Pe);n.bindBuffer(n.ARRAY_BUFFER,je);for(let Pe=0;Pe<Q.locationSize;Pe++)x(Q.location+Pe,we/Q.locationSize,Ue,be,Ie*Z,(Fe+we/Q.locationSize*Pe)*Z,fe)}else{if(ce.isInstancedBufferAttribute){for(let ie=0;ie<Q.locationSize;ie++)m(Q.location+ie,ce.meshPerAttribute);R.isInstancedMesh!==!0&&X._maxInstanceCount===void 0&&(X._maxInstanceCount=ce.meshPerAttribute*ce.count)}else for(let ie=0;ie<Q.locationSize;ie++)p(Q.location+ie);n.bindBuffer(n.ARRAY_BUFFER,je);for(let ie=0;ie<Q.locationSize;ie++)x(Q.location+ie,we/Q.locationSize,Ue,be,we*Z,we/Q.locationSize*ie*Z,fe)}}else if(V!==void 0){let be=V[j];if(be!==void 0)switch(be.length){case 2:n.vertexAttrib2fv(Q.location,be);break;case 3:n.vertexAttrib3fv(Q.location,be);break;case 4:n.vertexAttrib4fv(Q.location,be);break;default:n.vertexAttrib1fv(Q.location,be)}}}}_()}function A(){w();for(let R in i){let U=i[R];for(let G in U){let X=U[G];for(let N in X){let H=X[N];for(let V in H)u(H[V].object),delete H[V];delete X[N]}}delete i[R]}}function E(R){if(i[R.id]===void 0)return;let U=i[R.id];for(let G in U){let X=U[G];for(let N in X){let H=X[N];for(let V in H)u(H[V].object),delete H[V];delete X[N]}}delete i[R.id]}function I(R){for(let U in i){let G=i[U];for(let X in G){let N=G[X];if(N[R.id]===void 0)continue;let H=N[R.id];for(let V in H)u(H[V].object),delete H[V];delete N[R.id]}}}function S(R){for(let U in i){let G=i[U],X=R.isInstancedMesh===!0?R.id:0,N=G[X];if(N!==void 0){for(let H in N){let V=N[H];for(let j in V)u(V[j].object),delete V[j];delete N[H]}delete G[X],Object.keys(G).length===0&&delete i[U]}}}function w(){F(),a=!0,s!==r&&(s=r,h(s.object))}function F(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:o,reset:w,resetDefaultState:F,dispose:A,releaseStatesOfGeometry:E,releaseStatesOfObject:S,releaseStatesOfProgram:I,initAttributes:v,enableAttribute:p,disableUnusedAttributes:_}}function Ag(n,e,t){let i;function r(c){i=c}function s(c,h){n.drawArrays(i,c,h),t.update(h,i,1)}function a(c,h,u){u!==0&&(n.drawArraysInstanced(i,c,h,u),t.update(h,i,u))}function o(c,h,u){if(u===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,c,0,h,0,u);let l=0;for(let f=0;f<u;f++)l+=h[f];t.update(l,i,1)}this.setMode=r,this.render=s,this.renderInstances=a,this.renderMultiDraw=o}function Cg(n,e,t,i){let r;function s(){if(r!==void 0)return r;if(e.has("EXT_texture_filter_anisotropic")===!0){let I=e.get("EXT_texture_filter_anisotropic");r=n.getParameter(I.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function a(I){return!(I!==ln&&i.convert(I)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(I){let S=I===Pn&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(I!==rn&&i.convert(I)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE)&&I!==yn&&!S)}function c(I){if(I==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";I="mediump"}return I==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let h=t.precision!==void 0?t.precision:"highp",u=c(h);u!==h&&(Ce("WebGLRenderer:",h,"not supported, using",u,"instead."),h=u);let d=t.logarithmicDepthBuffer===!0,l=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control");t.reversedDepthBuffer===!0&&l===!1&&Ce("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let f=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),g=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),v=n.getParameter(n.MAX_TEXTURE_SIZE),p=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),m=n.getParameter(n.MAX_VERTEX_ATTRIBS),_=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),x=n.getParameter(n.MAX_VARYING_VECTORS),M=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),A=n.getParameter(n.MAX_SAMPLES),E=n.getParameter(n.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:c,textureFormatReadable:a,textureTypeReadable:o,precision:h,logarithmicDepthBuffer:d,reversedDepthBuffer:l,maxTextures:f,maxVertexTextures:g,maxTextureSize:v,maxCubemapSize:p,maxAttributes:m,maxVertexUniforms:_,maxVaryings:x,maxFragmentUniforms:M,maxSamples:A,samples:E}}function Rg(n){let e=this,t=null,i=0,r=!1,s=!1,a=new Tn,o=new Le,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(d,l){let f=d.length!==0||l||i!==0||r;return r=l,i=d.length,f},this.beginShadows=function(){s=!0,u(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(d,l){t=u(d,l,0)},this.setState=function(d,l,f){let g=d.clippingPlanes,v=d.clipIntersection,p=d.clipShadows,m=n.get(d);if(!r||g===null||g.length===0||s&&!p)s?u(null):h();else{let _=s?0:i,x=_*4,M=m.clippingState||null;c.value=M,M=u(g,l,x,f);for(let A=0;A!==x;++A)M[A]=t[A];m.clippingState=M,this.numIntersection=v?this.numPlanes:0,this.numPlanes+=_}};function h(){c.value!==t&&(c.value=t,c.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function u(d,l,f,g){let v=d!==null?d.length:0,p=null;if(v!==0){if(p=c.value,g!==!0||p===null){let m=f+v*4,_=l.matrixWorldInverse;o.getNormalMatrix(_),(p===null||p.length<m)&&(p=new Float32Array(m));for(let x=0,M=f;x!==v;++x,M+=4)a.copy(d[x]).applyMatrix4(_,o),a.normal.toArray(p,M),p[M+3]=a.constant}c.value=p,c.needsUpdate=!0}return e.numPlanes=v,e.numIntersection=0,p}}var xi=4,wu=[.125,.215,.35,.446,.526,.582],ki=20,Ig=256,Ss=new mi,Au=new Ze,mc=null,gc=0,_c=0,yc=!1,Pg=new C,Vo=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._sigmas=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,i=.1,r=100,s={}){let{size:a=256,position:o=Pg}=s;mc=this._renderer.getRenderTarget(),gc=this._renderer.getActiveCubeFace(),_c=this._renderer.getActiveMipmapLevel(),yc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);let c=this._allocateTargets();return c.depthBuffer=!0,this._sceneToCubeUV(e,i,r,c,o),t>0&&this._blur(c,0,0,t),this._applyPMREM(c),this._cleanup(c),c}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Iu(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Ru(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(mc,gc,_c),this._renderer.xr.enabled=yc,e.scissorTest=!1,Ar(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===gi||e.mapping===Oi?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),mc=this._renderer.getRenderTarget(),gc=this._renderer.getActiveCubeFace(),_c=this._renderer.getActiveMipmapLevel(),yc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:Se,minFilter:Se,generateMipmaps:!1,type:Pn,format:ln,colorSpace:Vr,depthBuffer:!1},r=Cu(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Cu(e,t,i);let{_lodMax:s}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods,sigmas:this._sigmas}=Dg(s)),this._blurMaterial=Fg(s,e,t),this._ggxMaterial=Lg(s,e,t)}return r}_compileMaterial(e){let t=new dt(new it,e);this._renderer.compile(t,Ss)}_sceneToCubeUV(e,t,i,r,s){let c=new Wt(90,1,t,i),h=[1,-1,1,1,1,1],u=[1,1,1,-1,-1,-1],d=this._renderer,l=d.autoClear,f=d.toneMapping;d.getClearColor(Au),d.toneMapping=mn,d.autoClear=!1,d.state.buffers.depth.getReversed()&&(d.setRenderTarget(r),d.clearDepth(),d.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new dt(new _r,new Ft({name:"PMREM.Background",side:Vt,depthWrite:!1,depthTest:!1})));let v=this._backgroundBox,p=v.material,m=!1,_=e.background;_?_.isColor&&(p.color.copy(_),e.background=null,m=!0):(p.color.copy(Au),m=!0);for(let x=0;x<6;x++){let M=x%3;M===0?(c.up.set(0,h[x],0),c.position.set(s.x,s.y,s.z),c.lookAt(s.x+u[x],s.y,s.z)):M===1?(c.up.set(0,0,h[x]),c.position.set(s.x,s.y,s.z),c.lookAt(s.x,s.y+u[x],s.z)):(c.up.set(0,h[x],0),c.position.set(s.x,s.y,s.z),c.lookAt(s.x,s.y,s.z+u[x]));let A=this._cubeSize;Ar(r,M*A,x>2?A:0,A,A),d.setRenderTarget(r),m&&d.render(v,c),d.render(e,c)}d.toneMapping=f,d.autoClear=l,e.background=_}_textureToCubeUV(e,t){let i=this._renderer,r=e.mapping===gi||e.mapping===Oi;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=Iu()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Ru());let s=r?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=s;let o=s.uniforms;o.envMap.value=e;let c=this._cubeSize;Ar(t,0,0,3*c,2*c),i.setRenderTarget(t),i.render(a,Ss)}_applyPMREM(e){let t=this._renderer,i=t.autoClear;t.autoClear=!1;let r=this._lodMeshes.length;for(let s=1;s<r;s++)this._applyGGXFilter(e,s-1,s);t.autoClear=i}_applyGGXFilter(e,t,i){let r=this._renderer,s=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[i];o.material=a;let c=a.uniforms,h=i/(this._lodMeshes.length-1),u=t/(this._lodMeshes.length-1),d=Math.sqrt(h*h-u*u),l=0+h*1.25,f=d*l,{_lodMax:g}=this,v=this._sizeLods[i],p=3*v*(i>g-xi?i-g+xi:0),m=4*(this._cubeSize-v);c.envMap.value=e.texture,c.roughness.value=f,c.mipInt.value=g-t,Ar(s,p,m,3*v,2*v),r.setRenderTarget(s),r.render(o,Ss),c.envMap.value=s.texture,c.roughness.value=0,c.mipInt.value=g-i,Ar(e,p,m,3*v,2*v),r.setRenderTarget(e),r.render(o,Ss)}_blur(e,t,i,r,s){let a=this._pingPongRenderTarget;this._halfBlur(e,a,t,i,r,"latitudinal",s),this._halfBlur(a,e,i,i,r,"longitudinal",s)}_halfBlur(e,t,i,r,s,a,o){let c=this._renderer,h=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&Re("blur direction must be either latitudinal or longitudinal!");let u=3,d=this._lodMeshes[r];d.material=h;let l=h.uniforms,f=this._sizeLods[i]-1,g=isFinite(s)?Math.PI/(2*f):2*Math.PI/(2*ki-1),v=s/g,p=isFinite(s)?1+Math.floor(u*v):ki;p>ki&&Ce(`sigmaRadians, ${s}, is too large and will clip, as it requested ${p} samples when the maximum is set to ${ki}`);let m=[],_=0;for(let I=0;I<ki;++I){let S=I/v,w=Math.exp(-S*S/2);m.push(w),I===0?_+=w:I<p&&(_+=2*w)}for(let I=0;I<m.length;I++)m[I]=m[I]/_;l.envMap.value=e.texture,l.samples.value=p,l.weights.value=m,l.latitudinal.value=a==="latitudinal",o&&(l.poleAxis.value=o);let{_lodMax:x}=this;l.dTheta.value=g,l.mipInt.value=x-i;let M=this._sizeLods[r],A=3*M*(r>x-xi?r-x+xi:0),E=4*(this._cubeSize-M);Ar(t,A,E,3*M,2*M),c.setRenderTarget(t),c.render(d,Ss)}};function Dg(n){let e=[],t=[],i=[],r=n,s=n-xi+1+wu.length;for(let a=0;a<s;a++){let o=Math.pow(2,r);e.push(o);let c=1/o;a>n-xi?c=wu[a-n+xi-1]:a===0&&(c=0),t.push(c);let h=1/(o-2),u=-h,d=1+h,l=[u,u,d,u,d,d,u,u,d,d,u,d],f=6,g=6,v=3,p=2,m=1,_=new Float32Array(v*g*f),x=new Float32Array(p*g*f),M=new Float32Array(m*g*f);for(let E=0;E<f;E++){let I=E%3*2/3-1,S=E>2?0:-1,w=[I,S,0,I+2/3,S,0,I+2/3,S+1,0,I,S,0,I+2/3,S+1,0,I,S+1,0];_.set(w,v*g*E),x.set(l,p*g*E);let F=[E,E,E,E,E,E];M.set(F,m*g*E)}let A=new it;A.setAttribute("position",new Xt(_,v)),A.setAttribute("uv",new Xt(x,p)),A.setAttribute("faceIndex",new Xt(M,m)),i.push(new dt(A,null)),r>xi&&r--}return{lodMeshes:i,sizeLods:e,sigmas:t}}function Cu(n,e,t){let i=new jt(n,e,t);return i.texture.mapping=fs,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Ar(n,e,t,i,r){n.viewport.set(e,t,i,r),n.scissor.set(e,t,i,r)}function Lg(n,e,t){return new tn({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:Ig,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Wo(),fragmentShader:`

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
		`,blending:In,depthTest:!1,depthWrite:!1})}function Fg(n,e,t){let i=new Float32Array(ki),r=new C(0,1,0);return new tn({name:"SphericalGaussianBlur",defines:{n:ki,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:r}},vertexShader:Wo(),fragmentShader:`

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
		`,blending:In,depthTest:!1,depthWrite:!1})}function Ru(){return new tn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Wo(),fragmentShader:`

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
		`,blending:In,depthTest:!1,depthWrite:!1})}function Iu(){return new tn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Wo(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:In,depthTest:!1,depthWrite:!1})}function Wo(){return`

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
	`}var Go=class extends jt{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let i={width:e,height:e,depth:1},r=[i,i,i,i,i,i];this.texture=new Jr(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},r=new _r(5,5,5),s=new tn({name:"CubemapFromEquirect",uniforms:Ui(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Vt,blending:In});s.uniforms.tEquirect.value=t;let a=new dt(r,s),o=t.minFilter;return t.minFilter===gn&&(t.minFilter=Se),new Ka(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,i=!0,r=!0){let s=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,i,r);e.setRenderTarget(s)}};function Ng(n){let e=new WeakMap,t=new WeakMap,i=null;function r(l,f=!1){return l==null?null:f?a(l):s(l)}function s(l){if(l&&l.isTexture){let f=l.mapping;if(f===ja||f===Qa)if(e.has(l)){let g=e.get(l).texture;return o(g,l.mapping)}else{let g=l.image;if(g&&g.height>0){let v=new Go(g.height);return v.fromEquirectangularTexture(n,l),e.set(l,v),l.addEventListener("dispose",h),o(v.texture,l.mapping)}else return null}}return l}function a(l){if(l&&l.isTexture){let f=l.mapping,g=f===ja||f===Qa,v=f===gi||f===Oi;if(g||v){let p=t.get(l),m=p!==void 0?p.texture.pmremVersion:0;if(l.isRenderTargetTexture&&l.pmremVersion!==m)return i===null&&(i=new Vo(n)),p=g?i.fromEquirectangular(l,p):i.fromCubemap(l,p),p.texture.pmremVersion=l.pmremVersion,t.set(l,p),p.texture;if(p!==void 0)return p.texture;{let _=l.image;return g&&_&&_.height>0||v&&_&&c(_)?(i===null&&(i=new Vo(n)),p=g?i.fromEquirectangular(l):i.fromCubemap(l),p.texture.pmremVersion=l.pmremVersion,t.set(l,p),l.addEventListener("dispose",u),p.texture):null}}}return l}function o(l,f){return f===ja?l.mapping=gi:f===Qa&&(l.mapping=Oi),l}function c(l){let f=0,g=6;for(let v=0;v<g;v++)l[v]!==void 0&&f++;return f===g}function h(l){let f=l.target;f.removeEventListener("dispose",h);let g=e.get(f);g!==void 0&&(e.delete(f),g.dispose())}function u(l){let f=l.target;f.removeEventListener("dispose",u);let g=t.get(f);g!==void 0&&(t.delete(f),g.dispose())}function d(){e=new WeakMap,t=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:r,dispose:d}}function Og(n){let e={};function t(i){if(e[i]!==void 0)return e[i];let r=n.getExtension(i);return e[i]=r,r}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){let r=t(i);return r===null&&Ma("WebGLRenderer: "+i+" extension not supported."),r}}}function Ug(n,e,t,i){let r={},s=new WeakMap;function a(d){let l=d.target;l.index!==null&&e.remove(l.index);for(let g in l.attributes)e.remove(l.attributes[g]);l.removeEventListener("dispose",a),delete r[l.id];let f=s.get(l);f&&(e.remove(f),s.delete(l)),i.releaseStatesOfGeometry(l),l.isInstancedBufferGeometry===!0&&delete l._maxInstanceCount,t.memory.geometries--}function o(d,l){return r[l.id]===!0||(l.addEventListener("dispose",a),r[l.id]=!0,t.memory.geometries++),l}function c(d){let l=d.attributes;for(let f in l)e.update(l[f],n.ARRAY_BUFFER)}function h(d){let l=[],f=d.index,g=d.attributes.position,v=0;if(g===void 0)return;if(f!==null){let _=f.array;v=f.version;for(let x=0,M=_.length;x<M;x+=3){let A=_[x+0],E=_[x+1],I=_[x+2];l.push(A,E,E,I,I,A)}}else{let _=g.array;v=g.version;for(let x=0,M=_.length/3-1;x<M;x+=3){let A=x+0,E=x+1,I=x+2;l.push(A,E,E,I,I,A)}}let p=new(g.count>=65535?$r:Yr)(l,1);p.version=v;let m=s.get(d);m&&e.remove(m),s.set(d,p)}function u(d){let l=s.get(d);if(l){let f=d.index;f!==null&&l.version<f.version&&h(d)}else h(d);return s.get(d)}return{get:o,update:c,getWireframeAttribute:u}}function kg(n,e,t){let i;function r(d){i=d}let s,a;function o(d){s=d.type,a=d.bytesPerElement}function c(d,l){n.drawElements(i,l,s,d*a),t.update(l,i,1)}function h(d,l,f){f!==0&&(n.drawElementsInstanced(i,l,s,d*a,f),t.update(l,i,f))}function u(d,l,f){if(f===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,l,0,s,d,0,f);let v=0;for(let p=0;p<f;p++)v+=l[p];t.update(v,i,1)}this.setMode=r,this.setIndex=o,this.render=c,this.renderInstances=h,this.renderMultiDraw=u}function Bg(n){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(s,a,o){switch(t.calls++,a){case n.TRIANGLES:t.triangles+=o*(s/3);break;case n.LINES:t.lines+=o*(s/2);break;case n.LINE_STRIP:t.lines+=o*(s-1);break;case n.LINE_LOOP:t.lines+=o*s;break;case n.POINTS:t.points+=o*s;break;default:Re("WebGLInfo: Unknown draw mode:",a);break}}function r(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:r,update:i}}function Hg(n,e,t){let i=new WeakMap,r=new St;function s(a,o,c){let h=a.morphTargetInfluences,u=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,d=u!==void 0?u.length:0,l=i.get(o);if(l===void 0||l.count!==d){let w=function(){I.dispose(),i.delete(o),o.removeEventListener("dispose",w)};l!==void 0&&l.texture.dispose();let f=o.morphAttributes.position!==void 0,g=o.morphAttributes.normal!==void 0,v=o.morphAttributes.color!==void 0,p=o.morphAttributes.position||[],m=o.morphAttributes.normal||[],_=o.morphAttributes.color||[],x=0;f===!0&&(x=1),g===!0&&(x=2),v===!0&&(x=3);let M=o.attributes.position.count*x,A=1;M>e.maxTextureSize&&(A=Math.ceil(M/e.maxTextureSize),M=e.maxTextureSize);let E=new Float32Array(M*A*4*d),I=new qr(E,M,A,d);I.type=yn,I.needsUpdate=!0;let S=x*4;for(let F=0;F<d;F++){let R=p[F],U=m[F],G=_[F],X=M*A*4*F;for(let N=0;N<R.count;N++){let H=N*S;f===!0&&(r.fromBufferAttribute(R,N),E[X+H+0]=r.x,E[X+H+1]=r.y,E[X+H+2]=r.z,E[X+H+3]=0),g===!0&&(r.fromBufferAttribute(U,N),E[X+H+4]=r.x,E[X+H+5]=r.y,E[X+H+6]=r.z,E[X+H+7]=0),v===!0&&(r.fromBufferAttribute(G,N),E[X+H+8]=r.x,E[X+H+9]=r.y,E[X+H+10]=r.z,E[X+H+11]=G.itemSize===4?r.w:1)}}l={count:d,texture:I,size:new ye(M,A)},i.set(o,l),o.addEventListener("dispose",w)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)c.getUniforms().setValue(n,"morphTexture",a.morphTexture,t);else{let f=0;for(let v=0;v<h.length;v++)f+=h[v];let g=o.morphTargetsRelative?1:1-f;c.getUniforms().setValue(n,"morphTargetBaseInfluence",g),c.getUniforms().setValue(n,"morphTargetInfluences",h)}c.getUniforms().setValue(n,"morphTargetsTexture",l.texture,t),c.getUniforms().setValue(n,"morphTargetsTextureSize",l.size)}return{update:s}}function zg(n,e,t,i,r){let s=new WeakMap;function a(h){let u=r.render.frame,d=h.geometry,l=e.get(h,d);if(s.get(l)!==u&&(e.update(l),s.set(l,u)),h.isInstancedMesh&&(h.hasEventListener("dispose",c)===!1&&h.addEventListener("dispose",c),s.get(h)!==u&&(t.update(h.instanceMatrix,n.ARRAY_BUFFER),h.instanceColor!==null&&t.update(h.instanceColor,n.ARRAY_BUFFER),s.set(h,u))),h.isSkinnedMesh){let f=h.skeleton;s.get(f)!==u&&(f.update(),s.set(f,u))}return l}function o(){s=new WeakMap}function c(h){let u=h.target;u.removeEventListener("dispose",c),i.releaseStatesOfObject(u),t.remove(u.instanceMatrix),u.instanceColor!==null&&t.remove(u.instanceColor)}return{update:a,dispose:o}}var Vg={[Yl]:"LINEAR_TONE_MAPPING",[$l]:"REINHARD_TONE_MAPPING",[Zl]:"CINEON_TONE_MAPPING",[Kl]:"ACES_FILMIC_TONE_MAPPING",[jl]:"AGX_TONE_MAPPING",[Ql]:"NEUTRAL_TONE_MAPPING",[Jl]:"CUSTOM_TONE_MAPPING"};function Gg(n,e,t,i,r){let s=new jt(e,t,{type:n,depthBuffer:i,stencilBuffer:r,depthTexture:i?new qn(e,t):void 0}),a=new jt(e,t,{type:Pn,depthBuffer:!1,stencilBuffer:!1}),o=new it;o.setAttribute("position",new _t([-1,3,0,-1,-1,0,3,-1,0],3)),o.setAttribute("uv",new _t([0,2,0,0,2,0],2));let c=new Ua({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),h=new dt(o,c),u=new mi(-1,1,1,-1,0,1),d=null,l=null,f=!1,g,v=null,p=[],m=!1;this.setSize=function(_,x){s.setSize(_,x),a.setSize(_,x);for(let M=0;M<p.length;M++){let A=p[M];A.setSize&&A.setSize(_,x)}},this.setEffects=function(_){p=_,m=p.length>0&&p[0].isRenderPass===!0;let x=s.width,M=s.height;for(let A=0;A<p.length;A++){let E=p[A];E.setSize&&E.setSize(x,M)}},this.begin=function(_,x){if(f||_.toneMapping===mn&&p.length===0)return!1;if(v=x,x!==null){let M=x.width,A=x.height;(s.width!==M||s.height!==A)&&this.setSize(M,A)}return m===!1&&_.setRenderTarget(s),g=_.toneMapping,_.toneMapping=mn,!0},this.hasRenderPass=function(){return m},this.end=function(_,x){_.toneMapping=g,f=!0;let M=s,A=a;for(let E=0;E<p.length;E++){let I=p[E];if(I.enabled!==!1&&(I.render(_,A,M,x),I.needsSwap!==!1)){let S=M;M=A,A=S}}if(d!==_.outputColorSpace||l!==_.toneMapping){d=_.outputColorSpace,l=_.toneMapping,c.defines={},qe.getTransfer(d)===Je&&(c.defines.SRGB_TRANSFER="");let E=Vg[l];E&&(c.defines[E]=""),c.needsUpdate=!0}c.uniforms.tDiffuse.value=M.texture,_.setRenderTarget(v),_.render(h,u),v=null,f=!1},this.isCompositing=function(){return f},this.dispose=function(){s.depthTexture&&s.depthTexture.dispose(),s.dispose(),a.dispose(),o.dispose(),c.dispose()}}var Ku=new Lt,Sc=new qn(1,1),Ju=new qr,ju=new Aa,Qu=new Jr,Pu=[],Du=[],Lu=new Float32Array(16),Fu=new Float32Array(9),Nu=new Float32Array(4);function Rr(n,e,t){let i=n[0];if(i<=0||i>0)return n;let r=e*t,s=Pu[r];if(s===void 0&&(s=new Float32Array(r),Pu[r]=s),e!==0){i.toArray(s,0);for(let a=1,o=0;a!==e;++a)o+=t,n[a].toArray(s,o)}return s}function Rt(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function It(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function Xo(n,e){let t=Du[e];t===void 0&&(t=new Int32Array(e),Du[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function Wg(n,e){let t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function Xg(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Rt(t,e))return;n.uniform2fv(this.addr,e),It(t,e)}}function qg(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Rt(t,e))return;n.uniform3fv(this.addr,e),It(t,e)}}function Yg(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Rt(t,e))return;n.uniform4fv(this.addr,e),It(t,e)}}function $g(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Rt(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),It(t,e)}else{if(Rt(t,i))return;Nu.set(i),n.uniformMatrix2fv(this.addr,!1,Nu),It(t,i)}}function Zg(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Rt(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),It(t,e)}else{if(Rt(t,i))return;Fu.set(i),n.uniformMatrix3fv(this.addr,!1,Fu),It(t,i)}}function Kg(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Rt(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),It(t,e)}else{if(Rt(t,i))return;Lu.set(i),n.uniformMatrix4fv(this.addr,!1,Lu),It(t,i)}}function Jg(n,e){let t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function jg(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Rt(t,e))return;n.uniform2iv(this.addr,e),It(t,e)}}function Qg(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Rt(t,e))return;n.uniform3iv(this.addr,e),It(t,e)}}function e0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Rt(t,e))return;n.uniform4iv(this.addr,e),It(t,e)}}function t0(n,e){let t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function n0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Rt(t,e))return;n.uniform2uiv(this.addr,e),It(t,e)}}function i0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Rt(t,e))return;n.uniform3uiv(this.addr,e),It(t,e)}}function r0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Rt(t,e))return;n.uniform4uiv(this.addr,e),It(t,e)}}function s0(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r);let s;this.type===n.SAMPLER_2D_SHADOW?(Sc.compareFunction=t.isReversedDepthBuffer()?Bo:ko,s=Sc):s=Ku,t.setTexture2D(e||s,r)}function a0(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture3D(e||ju,r)}function o0(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTextureCube(e||Qu,r)}function l0(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture2DArray(e||Ju,r)}function c0(n){switch(n){case 5126:return Wg;case 35664:return Xg;case 35665:return qg;case 35666:return Yg;case 35674:return $g;case 35675:return Zg;case 35676:return Kg;case 5124:case 35670:return Jg;case 35667:case 35671:return jg;case 35668:case 35672:return Qg;case 35669:case 35673:return e0;case 5125:return t0;case 36294:return n0;case 36295:return i0;case 36296:return r0;case 35678:case 36198:case 36298:case 36306:case 35682:return s0;case 35679:case 36299:case 36307:return a0;case 35680:case 36300:case 36308:case 36293:return o0;case 36289:case 36303:case 36311:case 36292:return l0}}function h0(n,e){n.uniform1fv(this.addr,e)}function u0(n,e){let t=Rr(e,this.size,2);n.uniform2fv(this.addr,t)}function d0(n,e){let t=Rr(e,this.size,3);n.uniform3fv(this.addr,t)}function f0(n,e){let t=Rr(e,this.size,4);n.uniform4fv(this.addr,t)}function p0(n,e){let t=Rr(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function m0(n,e){let t=Rr(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function g0(n,e){let t=Rr(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function _0(n,e){n.uniform1iv(this.addr,e)}function y0(n,e){n.uniform2iv(this.addr,e)}function x0(n,e){n.uniform3iv(this.addr,e)}function v0(n,e){n.uniform4iv(this.addr,e)}function S0(n,e){n.uniform1uiv(this.addr,e)}function b0(n,e){n.uniform2uiv(this.addr,e)}function M0(n,e){n.uniform3uiv(this.addr,e)}function T0(n,e){n.uniform4uiv(this.addr,e)}function E0(n,e,t){let i=this.cache,r=e.length,s=Xo(t,r);Rt(i,s)||(n.uniform1iv(this.addr,s),It(i,s));let a;this.type===n.SAMPLER_2D_SHADOW?a=Sc:a=Ku;for(let o=0;o!==r;++o)t.setTexture2D(e[o]||a,s[o])}function w0(n,e,t){let i=this.cache,r=e.length,s=Xo(t,r);Rt(i,s)||(n.uniform1iv(this.addr,s),It(i,s));for(let a=0;a!==r;++a)t.setTexture3D(e[a]||ju,s[a])}function A0(n,e,t){let i=this.cache,r=e.length,s=Xo(t,r);Rt(i,s)||(n.uniform1iv(this.addr,s),It(i,s));for(let a=0;a!==r;++a)t.setTextureCube(e[a]||Qu,s[a])}function C0(n,e,t){let i=this.cache,r=e.length,s=Xo(t,r);Rt(i,s)||(n.uniform1iv(this.addr,s),It(i,s));for(let a=0;a!==r;++a)t.setTexture2DArray(e[a]||Ju,s[a])}function R0(n){switch(n){case 5126:return h0;case 35664:return u0;case 35665:return d0;case 35666:return f0;case 35674:return p0;case 35675:return m0;case 35676:return g0;case 5124:case 35670:return _0;case 35667:case 35671:return y0;case 35668:case 35672:return x0;case 35669:case 35673:return v0;case 5125:return S0;case 36294:return b0;case 36295:return M0;case 36296:return T0;case 35678:case 36198:case 36298:case 36306:case 35682:return E0;case 35679:case 36299:case 36307:return w0;case 35680:case 36300:case 36308:case 36293:return A0;case 36289:case 36303:case 36311:case 36292:return C0}}var bc=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=c0(t.type)}},Mc=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=R0(t.type)}},Tc=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){let r=this.seq;for(let s=0,a=r.length;s!==a;++s){let o=r[s];o.setValue(e,t[o.id],i)}}},xc=/(\w+)(\])?(\[|\.)?/g;function Ou(n,e){n.seq.push(e),n.map[e.id]=e}function I0(n,e,t){let i=n.name,r=i.length;for(xc.lastIndex=0;;){let s=xc.exec(i),a=xc.lastIndex,o=s[1],c=s[2]==="]",h=s[3];if(c&&(o=o|0),h===void 0||h==="["&&a+2===r){Ou(t,h===void 0?new bc(o,n,e):new Mc(o,n,e));break}else{let d=t.map[o];d===void 0&&(d=new Tc(o),Ou(t,d)),t=d}}}var Cr=class{constructor(e,t){this.seq=[],this.map={};let i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let a=0;a<i;++a){let o=e.getActiveUniform(t,a),c=e.getUniformLocation(t,o.name);I0(o,c,this)}let r=[],s=[];for(let a of this.seq)a.type===e.SAMPLER_2D_SHADOW||a.type===e.SAMPLER_CUBE_SHADOW||a.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(a):s.push(a);r.length>0&&(this.seq=r.concat(s))}setValue(e,t,i,r){let s=this.map[t];s!==void 0&&s.setValue(e,i,r)}setOptional(e,t,i){let r=t[i];r!==void 0&&this.setValue(e,i,r)}static upload(e,t,i,r){for(let s=0,a=t.length;s!==a;++s){let o=t[s],c=i[o.id];c.needsUpdate!==!1&&o.setValue(e,c.value,r)}}static seqWithValue(e,t){let i=[];for(let r=0,s=e.length;r!==s;++r){let a=e[r];a.id in t&&i.push(a)}return i}};function Uu(n,e,t){let i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}var P0=37297,D0=0;function L0(n,e){let t=n.split(`
`),i=[],r=Math.max(e-6,0),s=Math.min(e+6,t.length);for(let a=r;a<s;a++){let o=a+1;i.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return i.join(`
`)}var ku=new Le;function F0(n){qe._getMatrix(ku,qe.workingColorSpace,n);let e=`mat3( ${ku.elements.map(t=>t.toFixed(4))} )`;switch(qe.getTransfer(n)){case Gr:return[e,"LinearTransferOETF"];case Je:return[e,"sRGBTransferOETF"];default:return Ce("WebGLProgram: Unsupported color space: ",n),[e,"LinearTransferOETF"]}}function Bu(n,e,t){let i=n.getShaderParameter(e,n.COMPILE_STATUS),s=(n.getShaderInfoLog(e)||"").trim();if(i&&s==="")return"";let a=/ERROR: 0:(\d+)/.exec(s);if(a){let o=parseInt(a[1]);return t.toUpperCase()+`

`+s+`

`+L0(n.getShaderSource(e),o)}else return s}function N0(n,e){let t=F0(e);return[`vec4 ${n}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}var O0={[Yl]:"Linear",[$l]:"Reinhard",[Zl]:"Cineon",[Kl]:"ACESFilmic",[jl]:"AgX",[Ql]:"Neutral",[Jl]:"Custom"};function U0(n,e){let t=O0[e];return t===void 0?(Ce("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+n+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var zo=new C;function k0(){qe.getLuminanceCoefficients(zo);let n=zo.x.toFixed(4),e=zo.y.toFixed(4),t=zo.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function B0(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Ms).join(`
`)}function H0(n){let e=[];for(let t in n){let i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function z0(n,e){let t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){let s=n.getActiveAttrib(e,r),a=s.name,o=1;s.type===n.FLOAT_MAT2&&(o=2),s.type===n.FLOAT_MAT3&&(o=3),s.type===n.FLOAT_MAT4&&(o=4),t[a]={type:s.type,location:n.getAttribLocation(e,a),locationSize:o}}return t}function Ms(n){return n!==""}function Hu(n,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function zu(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var V0=/^[ \t]*#include +<([\w\d./]+)>/gm;function Ec(n){return n.replace(V0,W0)}var G0=new Map;function W0(n,e){let t=He[e];if(t===void 0){let i=G0.get(e);if(i!==void 0)t=He[i],Ce('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("Can not resolve #include <"+e+">")}return Ec(t)}var X0=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Vu(n){return n.replace(X0,q0)}function q0(n,e,t,i){let r="";for(let s=parseInt(e);s<parseInt(t);s++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function Gu(n){let e=`precision ${n.precision} float;
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
#define LOW_PRECISION`),e}var Y0={[ds]:"SHADOWMAP_TYPE_PCF",[Tr]:"SHADOWMAP_TYPE_VSM"};function $0(n){return Y0[n.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var Z0={[gi]:"ENVMAP_TYPE_CUBE",[Oi]:"ENVMAP_TYPE_CUBE",[fs]:"ENVMAP_TYPE_CUBE_UV"};function K0(n){return n.envMap===!1?"ENVMAP_TYPE_CUBE":Z0[n.envMapMode]||"ENVMAP_TYPE_CUBE"}var J0={[Oi]:"ENVMAP_MODE_REFRACTION"};function j0(n){return n.envMap===!1?"ENVMAP_MODE_REFLECTION":J0[n.envMapMode]||"ENVMAP_MODE_REFLECTION"}var Q0={[ql]:"ENVMAP_BLENDING_MULTIPLY",[iu]:"ENVMAP_BLENDING_MIX",[ru]:"ENVMAP_BLENDING_ADD"};function e_(n){return n.envMap===!1?"ENVMAP_BLENDING_NONE":Q0[n.combine]||"ENVMAP_BLENDING_NONE"}function t_(n){let e=n.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:i,maxMip:t}}function n_(n,e,t,i){let r=n.getContext(),s=t.defines,a=t.vertexShader,o=t.fragmentShader,c=$0(t),h=K0(t),u=j0(t),d=e_(t),l=t_(t),f=B0(t),g=H0(s),v=r.createProgram(),p,m,_=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(Ms).join(`
`),p.length>0&&(p+=`
`),m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(Ms).join(`
`),m.length>0&&(m+=`
`)):(p=[Gu(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Ms).join(`
`),m=[Gu(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.envMap?"#define "+u:"",t.envMap?"#define "+d:"",l?"#define CUBEUV_TEXEL_WIDTH "+l.texelWidth:"",l?"#define CUBEUV_TEXEL_HEIGHT "+l.texelHeight:"",l?"#define CUBEUV_MAX_MIP "+l.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==mn?"#define TONE_MAPPING":"",t.toneMapping!==mn?He.tonemapping_pars_fragment:"",t.toneMapping!==mn?U0("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",He.colorspace_pars_fragment,N0("linearToOutputTexel",t.outputColorSpace),k0(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Ms).join(`
`)),a=Ec(a),a=Hu(a,t),a=zu(a,t),o=Ec(o),o=Hu(o,t),o=zu(o,t),a=Vu(a),o=Vu(o),t.isRawShaderMaterial!==!0&&(_=`#version 300 es
`,p=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,m=["#define varying in",t.glslVersion===cc?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===cc?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+m);let x=_+p+a,M=_+m+o,A=Uu(r,r.VERTEX_SHADER,x),E=Uu(r,r.FRAGMENT_SHADER,M);r.attachShader(v,A),r.attachShader(v,E),t.index0AttributeName!==void 0?r.bindAttribLocation(v,0,t.index0AttributeName):t.morphTargets===!0&&r.bindAttribLocation(v,0,"position"),r.linkProgram(v);function I(R){if(n.debug.checkShaderErrors){let U=r.getProgramInfoLog(v)||"",G=r.getShaderInfoLog(A)||"",X=r.getShaderInfoLog(E)||"",N=U.trim(),H=G.trim(),V=X.trim(),j=!0,Q=!0;if(r.getProgramParameter(v,r.LINK_STATUS)===!1)if(j=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(r,v,A,E);else{let ce=Bu(r,A,"vertex"),be=Bu(r,E,"fragment");Re("THREE.WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(v,r.VALIDATE_STATUS)+`

Material Name: `+R.name+`
Material Type: `+R.type+`

Program Info Log: `+N+`
`+ce+`
`+be)}else N!==""?Ce("WebGLProgram: Program Info Log:",N):(H===""||V==="")&&(Q=!1);Q&&(R.diagnostics={runnable:j,programLog:N,vertexShader:{log:H,prefix:p},fragmentShader:{log:V,prefix:m}})}r.deleteShader(A),r.deleteShader(E),S=new Cr(r,v),w=z0(r,v)}let S;this.getUniforms=function(){return S===void 0&&I(this),S};let w;this.getAttributes=function(){return w===void 0&&I(this),w};let F=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return F===!1&&(F=r.getProgramParameter(v,P0)),F},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(v),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=D0++,this.cacheKey=e,this.usedTimes=1,this.program=v,this.vertexShader=A,this.fragmentShader=E,this}var i_=0,wc=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,i=e.fragmentShader,r=this._getShaderStage(t),s=this._getShaderStage(i),a=this._getShaderCacheForMaterial(e);return a.has(r)===!1&&(a.add(r),r.usedTimes++),a.has(s)===!1&&(a.add(s),s.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){let t=this.shaderCache,i=t.get(e);return i===void 0&&(i=new Ac(e),t.set(e,i)),i}},Ac=class{constructor(e){this.id=i_++,this.code=e,this.usedTimes=0}};function r_(n){return n===yi||n===xs||n===vs}function s_(n,e,t,i,r,s){let a=new dr,o=new wc,c=new Set,h=[],u=new Map,d=i.logarithmicDepthBuffer,l=i.precision,f={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function g(S){return c.add(S),S===0?"uv":`uv${S}`}function v(S,w,F,R,U,G){let X=R.fog,N=U.geometry,H=S.isMeshStandardMaterial||S.isMeshLambertMaterial||S.isMeshPhongMaterial?R.environment:null,V=S.isMeshStandardMaterial||S.isMeshLambertMaterial&&!S.envMap||S.isMeshPhongMaterial&&!S.envMap,j=e.get(S.envMap||H,V),Q=j&&j.mapping===fs?j.image.height:null,ce=f[S.type];S.precision!==null&&(l=i.getMaxPrecision(S.precision),l!==S.precision&&Ce("WebGLProgram.getParameters:",S.precision,"not supported, using",l,"instead."));let be=N.morphAttributes.position||N.morphAttributes.normal||N.morphAttributes.color,we=be!==void 0?be.length:0,Ye=0;N.morphAttributes.position!==void 0&&(Ye=1),N.morphAttributes.normal!==void 0&&(Ye=2),N.morphAttributes.color!==void 0&&(Ye=3);let je,Ue,Z,fe;if(ce){let Ne=Ln[ce];je=Ne.vertexShader,Ue=Ne.fragmentShader}else je=S.vertexShader,Ue=S.fragmentShader,o.update(S),Z=o.getVertexShaderID(S),fe=o.getFragmentShaderID(S);let ie=n.getRenderTarget(),Ie=n.state.buffers.depth.getReversed(),Fe=U.isInstancedMesh===!0,Pe=U.isBatchedMesh===!0,pt=!!S.map,We=!!S.matcap,Qe=!!j,ht=!!S.aoMap,Ve=!!S.lightMap,At=!!S.bumpMap,mt=!!S.normalMap,Yt=!!S.displacementMap,D=!!S.emissiveMap,Ct=!!S.metalnessMap,Xe=!!S.roughnessMap,lt=S.anisotropy>0,oe=S.clearcoat>0,xt=S.dispersion>0,T=S.iridescence>0,y=S.sheen>0,O=S.transmission>0,Y=lt&&!!S.anisotropyMap,J=oe&&!!S.clearcoatMap,ee=oe&&!!S.clearcoatNormalMap,ae=oe&&!!S.clearcoatRoughnessMap,W=T&&!!S.iridescenceMap,$=T&&!!S.iridescenceThicknessMap,pe=y&&!!S.sheenColorMap,xe=y&&!!S.sheenRoughnessMap,re=!!S.specularMap,te=!!S.specularColorMap,De=!!S.specularIntensityMap,ke=O&&!!S.transmissionMap,Ke=O&&!!S.thicknessMap,P=!!S.gradientMap,ne=!!S.alphaMap,q=S.alphaTest>0,ge=!!S.alphaHash,se=!!S.extensions,K=mn;S.toneMapped&&(ie===null||ie.isXRRenderTarget===!0)&&(K=n.toneMapping);let Te={shaderID:ce,shaderType:S.type,shaderName:S.name,vertexShader:je,fragmentShader:Ue,defines:S.defines,customVertexShaderID:Z,customFragmentShaderID:fe,isRawShaderMaterial:S.isRawShaderMaterial===!0,glslVersion:S.glslVersion,precision:l,batching:Pe,batchingColor:Pe&&U._colorsTexture!==null,instancing:Fe,instancingColor:Fe&&U.instanceColor!==null,instancingMorph:Fe&&U.morphTexture!==null,outputColorSpace:ie===null?n.outputColorSpace:ie.isXRRenderTarget===!0?ie.texture.colorSpace:qe.workingColorSpace,alphaToCoverage:!!S.alphaToCoverage,map:pt,matcap:We,envMap:Qe,envMapMode:Qe&&j.mapping,envMapCubeUVHeight:Q,aoMap:ht,lightMap:Ve,bumpMap:At,normalMap:mt,displacementMap:Yt,emissiveMap:D,normalMapObjectSpace:mt&&S.normalMapType===ou,normalMapTangentSpace:mt&&S.normalMapType===lc,packedNormalMap:mt&&S.normalMapType===lc&&r_(S.normalMap.format),metalnessMap:Ct,roughnessMap:Xe,anisotropy:lt,anisotropyMap:Y,clearcoat:oe,clearcoatMap:J,clearcoatNormalMap:ee,clearcoatRoughnessMap:ae,dispersion:xt,iridescence:T,iridescenceMap:W,iridescenceThicknessMap:$,sheen:y,sheenColorMap:pe,sheenRoughnessMap:xe,specularMap:re,specularColorMap:te,specularIntensityMap:De,transmission:O,transmissionMap:ke,thicknessMap:Ke,gradientMap:P,opaque:S.transparent===!1&&S.blending===Pi&&S.alphaToCoverage===!1,alphaMap:ne,alphaTest:q,alphaHash:ge,combine:S.combine,mapUv:pt&&g(S.map.channel),aoMapUv:ht&&g(S.aoMap.channel),lightMapUv:Ve&&g(S.lightMap.channel),bumpMapUv:At&&g(S.bumpMap.channel),normalMapUv:mt&&g(S.normalMap.channel),displacementMapUv:Yt&&g(S.displacementMap.channel),emissiveMapUv:D&&g(S.emissiveMap.channel),metalnessMapUv:Ct&&g(S.metalnessMap.channel),roughnessMapUv:Xe&&g(S.roughnessMap.channel),anisotropyMapUv:Y&&g(S.anisotropyMap.channel),clearcoatMapUv:J&&g(S.clearcoatMap.channel),clearcoatNormalMapUv:ee&&g(S.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ae&&g(S.clearcoatRoughnessMap.channel),iridescenceMapUv:W&&g(S.iridescenceMap.channel),iridescenceThicknessMapUv:$&&g(S.iridescenceThicknessMap.channel),sheenColorMapUv:pe&&g(S.sheenColorMap.channel),sheenRoughnessMapUv:xe&&g(S.sheenRoughnessMap.channel),specularMapUv:re&&g(S.specularMap.channel),specularColorMapUv:te&&g(S.specularColorMap.channel),specularIntensityMapUv:De&&g(S.specularIntensityMap.channel),transmissionMapUv:ke&&g(S.transmissionMap.channel),thicknessMapUv:Ke&&g(S.thicknessMap.channel),alphaMapUv:ne&&g(S.alphaMap.channel),vertexTangents:!!N.attributes.tangent&&(mt||lt),vertexNormals:!!N.attributes.normal,vertexColors:S.vertexColors,vertexAlphas:S.vertexColors===!0&&!!N.attributes.color&&N.attributes.color.itemSize===4,pointsUvs:U.isPoints===!0&&!!N.attributes.uv&&(pt||ne),fog:!!X,useFog:S.fog===!0,fogExp2:!!X&&X.isFogExp2,flatShading:S.wireframe===!1&&(S.flatShading===!0||N.attributes.normal===void 0&&mt===!1&&(S.isMeshLambertMaterial||S.isMeshPhongMaterial||S.isMeshStandardMaterial||S.isMeshPhysicalMaterial)),sizeAttenuation:S.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:Ie,skinning:U.isSkinnedMesh===!0,morphTargets:N.morphAttributes.position!==void 0,morphNormals:N.morphAttributes.normal!==void 0,morphColors:N.morphAttributes.color!==void 0,morphTargetsCount:we,morphTextureStride:Ye,numDirLights:w.directional.length,numPointLights:w.point.length,numSpotLights:w.spot.length,numSpotLightMaps:w.spotLightMap.length,numRectAreaLights:w.rectArea.length,numHemiLights:w.hemi.length,numDirLightShadows:w.directionalShadowMap.length,numPointLightShadows:w.pointShadowMap.length,numSpotLightShadows:w.spotShadowMap.length,numSpotLightShadowsWithMaps:w.numSpotLightShadowsWithMaps,numLightProbes:w.numLightProbes,numLightProbeGrids:G.length,numClippingPlanes:s.numPlanes,numClipIntersection:s.numIntersection,dithering:S.dithering,shadowMapEnabled:n.shadowMap.enabled&&F.length>0,shadowMapType:n.shadowMap.type,toneMapping:K,decodeVideoTexture:pt&&S.map.isVideoTexture===!0&&qe.getTransfer(S.map.colorSpace)===Je,decodeVideoTextureEmissive:D&&S.emissiveMap.isVideoTexture===!0&&qe.getTransfer(S.emissiveMap.colorSpace)===Je,premultipliedAlpha:S.premultipliedAlpha,doubleSided:S.side===Bt,flipSided:S.side===Vt,useDepthPacking:S.depthPacking>=0,depthPacking:S.depthPacking||0,index0AttributeName:S.index0AttributeName,extensionClipCullDistance:se&&S.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(se&&S.extensions.multiDraw===!0||Pe)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:S.customProgramCacheKey()};return Te.vertexUv1s=c.has(1),Te.vertexUv2s=c.has(2),Te.vertexUv3s=c.has(3),c.clear(),Te}function p(S){let w=[];if(S.shaderID?w.push(S.shaderID):(w.push(S.customVertexShaderID),w.push(S.customFragmentShaderID)),S.defines!==void 0)for(let F in S.defines)w.push(F),w.push(S.defines[F]);return S.isRawShaderMaterial===!1&&(m(w,S),_(w,S),w.push(n.outputColorSpace)),w.push(S.customProgramCacheKey),w.join()}function m(S,w){S.push(w.precision),S.push(w.outputColorSpace),S.push(w.envMapMode),S.push(w.envMapCubeUVHeight),S.push(w.mapUv),S.push(w.alphaMapUv),S.push(w.lightMapUv),S.push(w.aoMapUv),S.push(w.bumpMapUv),S.push(w.normalMapUv),S.push(w.displacementMapUv),S.push(w.emissiveMapUv),S.push(w.metalnessMapUv),S.push(w.roughnessMapUv),S.push(w.anisotropyMapUv),S.push(w.clearcoatMapUv),S.push(w.clearcoatNormalMapUv),S.push(w.clearcoatRoughnessMapUv),S.push(w.iridescenceMapUv),S.push(w.iridescenceThicknessMapUv),S.push(w.sheenColorMapUv),S.push(w.sheenRoughnessMapUv),S.push(w.specularMapUv),S.push(w.specularColorMapUv),S.push(w.specularIntensityMapUv),S.push(w.transmissionMapUv),S.push(w.thicknessMapUv),S.push(w.combine),S.push(w.fogExp2),S.push(w.sizeAttenuation),S.push(w.morphTargetsCount),S.push(w.morphAttributeCount),S.push(w.numDirLights),S.push(w.numPointLights),S.push(w.numSpotLights),S.push(w.numSpotLightMaps),S.push(w.numHemiLights),S.push(w.numRectAreaLights),S.push(w.numDirLightShadows),S.push(w.numPointLightShadows),S.push(w.numSpotLightShadows),S.push(w.numSpotLightShadowsWithMaps),S.push(w.numLightProbes),S.push(w.shadowMapType),S.push(w.toneMapping),S.push(w.numClippingPlanes),S.push(w.numClipIntersection),S.push(w.depthPacking)}function _(S,w){a.disableAll(),w.instancing&&a.enable(0),w.instancingColor&&a.enable(1),w.instancingMorph&&a.enable(2),w.matcap&&a.enable(3),w.envMap&&a.enable(4),w.normalMapObjectSpace&&a.enable(5),w.normalMapTangentSpace&&a.enable(6),w.clearcoat&&a.enable(7),w.iridescence&&a.enable(8),w.alphaTest&&a.enable(9),w.vertexColors&&a.enable(10),w.vertexAlphas&&a.enable(11),w.vertexUv1s&&a.enable(12),w.vertexUv2s&&a.enable(13),w.vertexUv3s&&a.enable(14),w.vertexTangents&&a.enable(15),w.anisotropy&&a.enable(16),w.alphaHash&&a.enable(17),w.batching&&a.enable(18),w.dispersion&&a.enable(19),w.batchingColor&&a.enable(20),w.gradientMap&&a.enable(21),w.packedNormalMap&&a.enable(22),w.vertexNormals&&a.enable(23),S.push(a.mask),a.disableAll(),w.fog&&a.enable(0),w.useFog&&a.enable(1),w.flatShading&&a.enable(2),w.logarithmicDepthBuffer&&a.enable(3),w.reversedDepthBuffer&&a.enable(4),w.skinning&&a.enable(5),w.morphTargets&&a.enable(6),w.morphNormals&&a.enable(7),w.morphColors&&a.enable(8),w.premultipliedAlpha&&a.enable(9),w.shadowMapEnabled&&a.enable(10),w.doubleSided&&a.enable(11),w.flipSided&&a.enable(12),w.useDepthPacking&&a.enable(13),w.dithering&&a.enable(14),w.transmission&&a.enable(15),w.sheen&&a.enable(16),w.opaque&&a.enable(17),w.pointsUvs&&a.enable(18),w.decodeVideoTexture&&a.enable(19),w.decodeVideoTextureEmissive&&a.enable(20),w.alphaToCoverage&&a.enable(21),w.numLightProbeGrids>0&&a.enable(22),S.push(a.mask)}function x(S){let w=f[S.type],F;if(w){let R=Ln[w];F=Tu.clone(R.uniforms)}else F=S.uniforms;return F}function M(S,w){let F=u.get(w);return F!==void 0?++F.usedTimes:(F=new n_(n,w,S,r),h.push(F),u.set(w,F)),F}function A(S){if(--S.usedTimes===0){let w=h.indexOf(S);h[w]=h[h.length-1],h.pop(),u.delete(S.cacheKey),S.destroy()}}function E(S){o.remove(S)}function I(){o.dispose()}return{getParameters:v,getProgramCacheKey:p,getUniforms:x,acquireProgram:M,releaseProgram:A,releaseShaderCache:E,programs:h,dispose:I}}function a_(){let n=new WeakMap;function e(a){return n.has(a)}function t(a){let o=n.get(a);return o===void 0&&(o={},n.set(a,o)),o}function i(a){n.delete(a)}function r(a,o,c){n.get(a)[o]=c}function s(){n=new WeakMap}return{has:e,get:t,remove:i,update:r,dispose:s}}function o_(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.materialVariant!==e.materialVariant?n.materialVariant-e.materialVariant:n.z!==e.z?n.z-e.z:n.id-e.id}function Wu(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function Xu(){let n=[],e=0,t=[],i=[],r=[];function s(){e=0,t.length=0,i.length=0,r.length=0}function a(l){let f=0;return l.isInstancedMesh&&(f+=2),l.isSkinnedMesh&&(f+=1),f}function o(l,f,g,v,p,m){let _=n[e];return _===void 0?(_={id:l.id,object:l,geometry:f,material:g,materialVariant:a(l),groupOrder:v,renderOrder:l.renderOrder,z:p,group:m},n[e]=_):(_.id=l.id,_.object=l,_.geometry=f,_.material=g,_.materialVariant=a(l),_.groupOrder=v,_.renderOrder=l.renderOrder,_.z=p,_.group=m),e++,_}function c(l,f,g,v,p,m){let _=o(l,f,g,v,p,m);g.transmission>0?i.push(_):g.transparent===!0?r.push(_):t.push(_)}function h(l,f,g,v,p,m){let _=o(l,f,g,v,p,m);g.transmission>0?i.unshift(_):g.transparent===!0?r.unshift(_):t.unshift(_)}function u(l,f){t.length>1&&t.sort(l||o_),i.length>1&&i.sort(f||Wu),r.length>1&&r.sort(f||Wu)}function d(){for(let l=e,f=n.length;l<f;l++){let g=n[l];if(g.id===null)break;g.id=null,g.object=null,g.geometry=null,g.material=null,g.group=null}}return{opaque:t,transmissive:i,transparent:r,init:s,push:c,unshift:h,finish:d,sort:u}}function l_(){let n=new WeakMap;function e(i,r){let s=n.get(i),a;return s===void 0?(a=new Xu,n.set(i,[a])):r>=s.length?(a=new Xu,s.push(a)):a=s[r],a}function t(){n=new WeakMap}return{get:e,dispose:t}}function c_(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new C,color:new Ze};break;case"SpotLight":t={position:new C,direction:new C,color:new Ze,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new C,color:new Ze,distance:0,decay:0};break;case"HemisphereLight":t={direction:new C,skyColor:new Ze,groundColor:new Ze};break;case"RectAreaLight":t={color:new Ze,position:new C,halfWidth:new C,halfHeight:new C};break}return n[e.id]=t,t}}}function h_(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ye};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ye};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ye,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}var u_=0;function d_(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function f_(n){let e=new c_,t=h_(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let h=0;h<9;h++)i.probe.push(new C);let r=new C,s=new ft,a=new ft;function o(h){let u=0,d=0,l=0;for(let w=0;w<9;w++)i.probe[w].set(0,0,0);let f=0,g=0,v=0,p=0,m=0,_=0,x=0,M=0,A=0,E=0,I=0;h.sort(d_);for(let w=0,F=h.length;w<F;w++){let R=h[w],U=R.color,G=R.intensity,X=R.distance,N=null;if(R.shadow&&R.shadow.map&&(R.shadow.map.texture.format===yi?N=R.shadow.map.texture:N=R.shadow.map.depthTexture||R.shadow.map.texture),R.isAmbientLight)u+=U.r*G,d+=U.g*G,l+=U.b*G;else if(R.isLightProbe){for(let H=0;H<9;H++)i.probe[H].addScaledVector(R.sh.coefficients[H],G);I++}else if(R.isDirectionalLight){let H=e.get(R);if(H.color.copy(R.color).multiplyScalar(R.intensity),R.castShadow){let V=R.shadow,j=t.get(R);j.shadowIntensity=V.intensity,j.shadowBias=V.bias,j.shadowNormalBias=V.normalBias,j.shadowRadius=V.radius,j.shadowMapSize=V.mapSize,i.directionalShadow[f]=j,i.directionalShadowMap[f]=N,i.directionalShadowMatrix[f]=R.shadow.matrix,_++}i.directional[f]=H,f++}else if(R.isSpotLight){let H=e.get(R);H.position.setFromMatrixPosition(R.matrixWorld),H.color.copy(U).multiplyScalar(G),H.distance=X,H.coneCos=Math.cos(R.angle),H.penumbraCos=Math.cos(R.angle*(1-R.penumbra)),H.decay=R.decay,i.spot[v]=H;let V=R.shadow;if(R.map&&(i.spotLightMap[A]=R.map,A++,V.updateMatrices(R),R.castShadow&&E++),i.spotLightMatrix[v]=V.matrix,R.castShadow){let j=t.get(R);j.shadowIntensity=V.intensity,j.shadowBias=V.bias,j.shadowNormalBias=V.normalBias,j.shadowRadius=V.radius,j.shadowMapSize=V.mapSize,i.spotShadow[v]=j,i.spotShadowMap[v]=N,M++}v++}else if(R.isRectAreaLight){let H=e.get(R);H.color.copy(U).multiplyScalar(G),H.halfWidth.set(R.width*.5,0,0),H.halfHeight.set(0,R.height*.5,0),i.rectArea[p]=H,p++}else if(R.isPointLight){let H=e.get(R);if(H.color.copy(R.color).multiplyScalar(R.intensity),H.distance=R.distance,H.decay=R.decay,R.castShadow){let V=R.shadow,j=t.get(R);j.shadowIntensity=V.intensity,j.shadowBias=V.bias,j.shadowNormalBias=V.normalBias,j.shadowRadius=V.radius,j.shadowMapSize=V.mapSize,j.shadowCameraNear=V.camera.near,j.shadowCameraFar=V.camera.far,i.pointShadow[g]=j,i.pointShadowMap[g]=N,i.pointShadowMatrix[g]=R.shadow.matrix,x++}i.point[g]=H,g++}else if(R.isHemisphereLight){let H=e.get(R);H.skyColor.copy(R.color).multiplyScalar(G),H.groundColor.copy(R.groundColor).multiplyScalar(G),i.hemi[m]=H,m++}}p>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=le.LTC_FLOAT_1,i.rectAreaLTC2=le.LTC_FLOAT_2):(i.rectAreaLTC1=le.LTC_HALF_1,i.rectAreaLTC2=le.LTC_HALF_2)),i.ambient[0]=u,i.ambient[1]=d,i.ambient[2]=l;let S=i.hash;(S.directionalLength!==f||S.pointLength!==g||S.spotLength!==v||S.rectAreaLength!==p||S.hemiLength!==m||S.numDirectionalShadows!==_||S.numPointShadows!==x||S.numSpotShadows!==M||S.numSpotMaps!==A||S.numLightProbes!==I)&&(i.directional.length=f,i.spot.length=v,i.rectArea.length=p,i.point.length=g,i.hemi.length=m,i.directionalShadow.length=_,i.directionalShadowMap.length=_,i.pointShadow.length=x,i.pointShadowMap.length=x,i.spotShadow.length=M,i.spotShadowMap.length=M,i.directionalShadowMatrix.length=_,i.pointShadowMatrix.length=x,i.spotLightMatrix.length=M+A-E,i.spotLightMap.length=A,i.numSpotLightShadowsWithMaps=E,i.numLightProbes=I,S.directionalLength=f,S.pointLength=g,S.spotLength=v,S.rectAreaLength=p,S.hemiLength=m,S.numDirectionalShadows=_,S.numPointShadows=x,S.numSpotShadows=M,S.numSpotMaps=A,S.numLightProbes=I,i.version=u_++)}function c(h,u){let d=0,l=0,f=0,g=0,v=0,p=u.matrixWorldInverse;for(let m=0,_=h.length;m<_;m++){let x=h[m];if(x.isDirectionalLight){let M=i.directional[d];M.direction.setFromMatrixPosition(x.matrixWorld),r.setFromMatrixPosition(x.target.matrixWorld),M.direction.sub(r),M.direction.transformDirection(p),d++}else if(x.isSpotLight){let M=i.spot[f];M.position.setFromMatrixPosition(x.matrixWorld),M.position.applyMatrix4(p),M.direction.setFromMatrixPosition(x.matrixWorld),r.setFromMatrixPosition(x.target.matrixWorld),M.direction.sub(r),M.direction.transformDirection(p),f++}else if(x.isRectAreaLight){let M=i.rectArea[g];M.position.setFromMatrixPosition(x.matrixWorld),M.position.applyMatrix4(p),a.identity(),s.copy(x.matrixWorld),s.premultiply(p),a.extractRotation(s),M.halfWidth.set(x.width*.5,0,0),M.halfHeight.set(0,x.height*.5,0),M.halfWidth.applyMatrix4(a),M.halfHeight.applyMatrix4(a),g++}else if(x.isPointLight){let M=i.point[l];M.position.setFromMatrixPosition(x.matrixWorld),M.position.applyMatrix4(p),l++}else if(x.isHemisphereLight){let M=i.hemi[v];M.direction.setFromMatrixPosition(x.matrixWorld),M.direction.transformDirection(p),v++}}}return{setup:o,setupView:c,state:i}}function qu(n){let e=new f_(n),t=[],i=[],r=[];function s(l){d.camera=l,t.length=0,i.length=0,r.length=0}function a(l){t.push(l)}function o(l){i.push(l)}function c(l){r.push(l)}function h(){e.setup(t)}function u(l){e.setupView(t,l)}let d={lightsArray:t,shadowsArray:i,lightProbeGridArray:r,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:s,state:d,setupLights:h,setupLightsView:u,pushLight:a,pushShadow:o,pushLightProbeGrid:c}}function p_(n){let e=new WeakMap;function t(r,s=0){let a=e.get(r),o;return a===void 0?(o=new qu(n),e.set(r,[o])):s>=a.length?(o=new qu(n),a.push(o)):o=a[s],o}function i(){e=new WeakMap}return{get:t,dispose:i}}var m_=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,g_=`uniform sampler2D shadow_pass;
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
}`,__=[new C(1,0,0),new C(-1,0,0),new C(0,1,0),new C(0,-1,0),new C(0,0,1),new C(0,0,-1)],y_=[new C(0,-1,0),new C(0,-1,0),new C(0,0,1),new C(0,0,-1),new C(0,-1,0),new C(0,-1,0)],Yu=new ft,bs=new C,vc=new C;function x_(n,e,t){let i=new Kr,r=new ye,s=new ye,a=new St,o=new ka,c=new Ba,h={},u=t.maxTextureSize,d={[Wn]:Vt,[Vt]:Wn,[Bt]:Bt},l=new tn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ye},radius:{value:4}},vertexShader:m_,fragmentShader:g_}),f=l.clone();f.defines.HORIZONTAL_PASS=1;let g=new it;g.setAttribute("position",new Xt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let v=new dt(g,l),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=ds;let m=this.type;this.render=function(E,I,S){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||E.length===0)return;this.type===kh&&(Ce("WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead."),this.type=ds);let w=n.getRenderTarget(),F=n.getActiveCubeFace(),R=n.getActiveMipmapLevel(),U=n.state;U.setBlending(In),U.buffers.depth.getReversed()===!0?U.buffers.color.setClear(0,0,0,0):U.buffers.color.setClear(1,1,1,1),U.buffers.depth.setTest(!0),U.setScissorTest(!1);let G=m!==this.type;G&&I.traverse(function(X){X.material&&(Array.isArray(X.material)?X.material.forEach(N=>N.needsUpdate=!0):X.material.needsUpdate=!0)});for(let X=0,N=E.length;X<N;X++){let H=E[X],V=H.shadow;if(V===void 0){Ce("WebGLShadowMap:",H,"has no shadow.");continue}if(V.autoUpdate===!1&&V.needsUpdate===!1)continue;r.copy(V.mapSize);let j=V.getFrameExtents();r.multiply(j),s.copy(V.mapSize),(r.x>u||r.y>u)&&(r.x>u&&(s.x=Math.floor(u/j.x),r.x=s.x*j.x,V.mapSize.x=s.x),r.y>u&&(s.y=Math.floor(u/j.y),r.y=s.y*j.y,V.mapSize.y=s.y));let Q=n.state.buffers.depth.getReversed();if(V.camera._reversedDepth=Q,V.map===null||G===!0){if(V.map!==null&&(V.map.depthTexture!==null&&(V.map.depthTexture.dispose(),V.map.depthTexture=null),V.map.dispose()),this.type===Tr){if(H.isPointLight){Ce("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}V.map=new jt(r.x,r.y,{format:yi,type:Pn,minFilter:Se,magFilter:Se,generateMipmaps:!1}),V.map.texture.name=H.name+".shadowMap",V.map.depthTexture=new qn(r.x,r.y,yn),V.map.depthTexture.name=H.name+".shadowMapDepth",V.map.depthTexture.format=wn,V.map.depthTexture.compareFunction=null,V.map.depthTexture.minFilter=Dt,V.map.depthTexture.magFilter=Dt}else H.isPointLight?(V.map=new Go(r.x),V.map.depthTexture=new Da(r.x,_n)):(V.map=new jt(r.x,r.y),V.map.depthTexture=new qn(r.x,r.y,_n)),V.map.depthTexture.name=H.name+".shadowMap",V.map.depthTexture.format=wn,this.type===ds?(V.map.depthTexture.compareFunction=Q?Bo:ko,V.map.depthTexture.minFilter=Se,V.map.depthTexture.magFilter=Se):(V.map.depthTexture.compareFunction=null,V.map.depthTexture.minFilter=Dt,V.map.depthTexture.magFilter=Dt);V.camera.updateProjectionMatrix()}let ce=V.map.isWebGLCubeRenderTarget?6:1;for(let be=0;be<ce;be++){if(V.map.isWebGLCubeRenderTarget)n.setRenderTarget(V.map,be),n.clear();else{be===0&&(n.setRenderTarget(V.map),n.clear());let we=V.getViewport(be);a.set(s.x*we.x,s.y*we.y,s.x*we.z,s.y*we.w),U.viewport(a)}if(H.isPointLight){let we=V.camera,Ye=V.matrix,je=H.distance||we.far;je!==we.far&&(we.far=je,we.updateProjectionMatrix()),bs.setFromMatrixPosition(H.matrixWorld),we.position.copy(bs),vc.copy(we.position),vc.add(__[be]),we.up.copy(y_[be]),we.lookAt(vc),we.updateMatrixWorld(),Ye.makeTranslation(-bs.x,-bs.y,-bs.z),Yu.multiplyMatrices(we.projectionMatrix,we.matrixWorldInverse),V._frustum.setFromProjectionMatrix(Yu,we.coordinateSystem,we.reversedDepth)}else V.updateMatrices(H);i=V.getFrustum(),M(I,S,V.camera,H,this.type)}V.isPointLightShadow!==!0&&this.type===Tr&&_(V,S),V.needsUpdate=!1}m=this.type,p.needsUpdate=!1,n.setRenderTarget(w,F,R)};function _(E,I){let S=e.update(v);l.defines.VSM_SAMPLES!==E.blurSamples&&(l.defines.VSM_SAMPLES=E.blurSamples,f.defines.VSM_SAMPLES=E.blurSamples,l.needsUpdate=!0,f.needsUpdate=!0),E.mapPass===null&&(E.mapPass=new jt(r.x,r.y,{format:yi,type:Pn})),l.uniforms.shadow_pass.value=E.map.depthTexture,l.uniforms.resolution.value=E.mapSize,l.uniforms.radius.value=E.radius,n.setRenderTarget(E.mapPass),n.clear(),n.renderBufferDirect(I,null,S,l,v,null),f.uniforms.shadow_pass.value=E.mapPass.texture,f.uniforms.resolution.value=E.mapSize,f.uniforms.radius.value=E.radius,n.setRenderTarget(E.map),n.clear(),n.renderBufferDirect(I,null,S,f,v,null)}function x(E,I,S,w){let F=null,R=S.isPointLight===!0?E.customDistanceMaterial:E.customDepthMaterial;if(R!==void 0)F=R;else if(F=S.isPointLight===!0?c:o,n.localClippingEnabled&&I.clipShadows===!0&&Array.isArray(I.clippingPlanes)&&I.clippingPlanes.length!==0||I.displacementMap&&I.displacementScale!==0||I.alphaMap&&I.alphaTest>0||I.map&&I.alphaTest>0||I.alphaToCoverage===!0){let U=F.uuid,G=I.uuid,X=h[U];X===void 0&&(X={},h[U]=X);let N=X[G];N===void 0&&(N=F.clone(),X[G]=N,I.addEventListener("dispose",A)),F=N}if(F.visible=I.visible,F.wireframe=I.wireframe,w===Tr?F.side=I.shadowSide!==null?I.shadowSide:I.side:F.side=I.shadowSide!==null?I.shadowSide:d[I.side],F.alphaMap=I.alphaMap,F.alphaTest=I.alphaToCoverage===!0?.5:I.alphaTest,F.map=I.map,F.clipShadows=I.clipShadows,F.clippingPlanes=I.clippingPlanes,F.clipIntersection=I.clipIntersection,F.displacementMap=I.displacementMap,F.displacementScale=I.displacementScale,F.displacementBias=I.displacementBias,F.wireframeLinewidth=I.wireframeLinewidth,F.linewidth=I.linewidth,S.isPointLight===!0&&F.isMeshDistanceMaterial===!0){let U=n.properties.get(F);U.light=S}return F}function M(E,I,S,w,F){if(E.visible===!1)return;if(E.layers.test(I.layers)&&(E.isMesh||E.isLine||E.isPoints)&&(E.castShadow||E.receiveShadow&&F===Tr)&&(!E.frustumCulled||i.intersectsObject(E))){E.modelViewMatrix.multiplyMatrices(S.matrixWorldInverse,E.matrixWorld);let G=e.update(E),X=E.material;if(Array.isArray(X)){let N=G.groups;for(let H=0,V=N.length;H<V;H++){let j=N[H],Q=X[j.materialIndex];if(Q&&Q.visible){let ce=x(E,Q,w,F);E.onBeforeShadow(n,E,I,S,G,ce,j),n.renderBufferDirect(S,null,G,ce,E,j),E.onAfterShadow(n,E,I,S,G,ce,j)}}}else if(X.visible){let N=x(E,X,w,F);E.onBeforeShadow(n,E,I,S,G,N,null),n.renderBufferDirect(S,null,G,N,E,null),E.onAfterShadow(n,E,I,S,G,N,null)}}let U=E.children;for(let G=0,X=U.length;G<X;G++)M(U[G],I,S,w,F)}function A(E){E.target.removeEventListener("dispose",A);for(let S in h){let w=h[S],F=E.target.uuid;F in w&&(w[F].dispose(),delete w[F])}}}function v_(n,e){function t(){let P=!1,ne=new St,q=null,ge=new St(0,0,0,0);return{setMask:function(se){q!==se&&!P&&(n.colorMask(se,se,se,se),q=se)},setLocked:function(se){P=se},setClear:function(se,K,Te,Ne,Mt){Mt===!0&&(se*=Ne,K*=Ne,Te*=Ne),ne.set(se,K,Te,Ne),ge.equals(ne)===!1&&(n.clearColor(se,K,Te,Ne),ge.copy(ne))},reset:function(){P=!1,q=null,ge.set(-1,0,0,0)}}}function i(){let P=!1,ne=!1,q=null,ge=null,se=null;return{setReversed:function(K){if(ne!==K){let Te=e.get("EXT_clip_control");K?Te.clipControlEXT(Te.LOWER_LEFT_EXT,Te.ZERO_TO_ONE_EXT):Te.clipControlEXT(Te.LOWER_LEFT_EXT,Te.NEGATIVE_ONE_TO_ONE_EXT),ne=K;let Ne=se;se=null,this.setClear(Ne)}},getReversed:function(){return ne},setTest:function(K){K?ie(n.DEPTH_TEST):Ie(n.DEPTH_TEST)},setMask:function(K){q!==K&&!P&&(n.depthMask(K),q=K)},setFunc:function(K){if(ne&&(K=_u[K]),ge!==K){switch(K){case da:n.depthFunc(n.NEVER);break;case fa:n.depthFunc(n.ALWAYS);break;case pa:n.depthFunc(n.LESS);break;case Di:n.depthFunc(n.LEQUAL);break;case ma:n.depthFunc(n.EQUAL);break;case ga:n.depthFunc(n.GEQUAL);break;case _a:n.depthFunc(n.GREATER);break;case ya:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}ge=K}},setLocked:function(K){P=K},setClear:function(K){se!==K&&(se=K,ne&&(K=1-K),n.clearDepth(K))},reset:function(){P=!1,q=null,ge=null,se=null,ne=!1}}}function r(){let P=!1,ne=null,q=null,ge=null,se=null,K=null,Te=null,Ne=null,Mt=null;return{setTest:function(et){P||(et?ie(n.STENCIL_TEST):Ie(n.STENCIL_TEST))},setMask:function(et){ne!==et&&!P&&(n.stencilMask(et),ne=et)},setFunc:function(et,Nn,Sn){(q!==et||ge!==Nn||se!==Sn)&&(n.stencilFunc(et,Nn,Sn),q=et,ge=Nn,se=Sn)},setOp:function(et,Nn,Sn){(K!==et||Te!==Nn||Ne!==Sn)&&(n.stencilOp(et,Nn,Sn),K=et,Te=Nn,Ne=Sn)},setLocked:function(et){P=et},setClear:function(et){Mt!==et&&(n.clearStencil(et),Mt=et)},reset:function(){P=!1,ne=null,q=null,ge=null,se=null,K=null,Te=null,Ne=null,Mt=null}}}let s=new t,a=new i,o=new r,c=new WeakMap,h=new WeakMap,u={},d={},l={},f=new WeakMap,g=[],v=null,p=!1,m=null,_=null,x=null,M=null,A=null,E=null,I=null,S=new Ze(0,0,0),w=0,F=!1,R=null,U=null,G=null,X=null,N=null,H=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS),V=!1,j=0,Q=n.getParameter(n.VERSION);Q.indexOf("WebGL")!==-1?(j=parseFloat(/^WebGL (\d)/.exec(Q)[1]),V=j>=1):Q.indexOf("OpenGL ES")!==-1&&(j=parseFloat(/^OpenGL ES (\d)/.exec(Q)[1]),V=j>=2);let ce=null,be={},we=n.getParameter(n.SCISSOR_BOX),Ye=n.getParameter(n.VIEWPORT),je=new St().fromArray(we),Ue=new St().fromArray(Ye);function Z(P,ne,q,ge){let se=new Uint8Array(4),K=n.createTexture();n.bindTexture(P,K),n.texParameteri(P,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(P,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let Te=0;Te<q;Te++)P===n.TEXTURE_3D||P===n.TEXTURE_2D_ARRAY?n.texImage3D(ne,0,n.RGBA,1,1,ge,0,n.RGBA,n.UNSIGNED_BYTE,se):n.texImage2D(ne+Te,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,se);return K}let fe={};fe[n.TEXTURE_2D]=Z(n.TEXTURE_2D,n.TEXTURE_2D,1),fe[n.TEXTURE_CUBE_MAP]=Z(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),fe[n.TEXTURE_2D_ARRAY]=Z(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),fe[n.TEXTURE_3D]=Z(n.TEXTURE_3D,n.TEXTURE_3D,1,1),s.setClear(0,0,0,1),a.setClear(1),o.setClear(0),ie(n.DEPTH_TEST),a.setFunc(Di),At(!1),mt(Vl),ie(n.CULL_FACE),ht(In);function ie(P){u[P]!==!0&&(n.enable(P),u[P]=!0)}function Ie(P){u[P]!==!1&&(n.disable(P),u[P]=!1)}function Fe(P,ne){return l[P]!==ne?(n.bindFramebuffer(P,ne),l[P]=ne,P===n.DRAW_FRAMEBUFFER&&(l[n.FRAMEBUFFER]=ne),P===n.FRAMEBUFFER&&(l[n.DRAW_FRAMEBUFFER]=ne),!0):!1}function Pe(P,ne){let q=g,ge=!1;if(P){q=f.get(ne),q===void 0&&(q=[],f.set(ne,q));let se=P.textures;if(q.length!==se.length||q[0]!==n.COLOR_ATTACHMENT0){for(let K=0,Te=se.length;K<Te;K++)q[K]=n.COLOR_ATTACHMENT0+K;q.length=se.length,ge=!0}}else q[0]!==n.BACK&&(q[0]=n.BACK,ge=!0);ge&&n.drawBuffers(q)}function pt(P){return v!==P?(n.useProgram(P),v=P,!0):!1}let We={[li]:n.FUNC_ADD,[Hh]:n.FUNC_SUBTRACT,[zh]:n.FUNC_REVERSE_SUBTRACT};We[Vh]=n.MIN,We[Gh]=n.MAX;let Qe={[Wh]:n.ZERO,[Xh]:n.ONE,[qh]:n.SRC_COLOR,[ha]:n.SRC_ALPHA,[jh]:n.SRC_ALPHA_SATURATE,[Kh]:n.DST_COLOR,[$h]:n.DST_ALPHA,[Yh]:n.ONE_MINUS_SRC_COLOR,[ua]:n.ONE_MINUS_SRC_ALPHA,[Jh]:n.ONE_MINUS_DST_COLOR,[Zh]:n.ONE_MINUS_DST_ALPHA,[Qh]:n.CONSTANT_COLOR,[eu]:n.ONE_MINUS_CONSTANT_COLOR,[tu]:n.CONSTANT_ALPHA,[nu]:n.ONE_MINUS_CONSTANT_ALPHA};function ht(P,ne,q,ge,se,K,Te,Ne,Mt,et){if(P===In){p===!0&&(Ie(n.BLEND),p=!1);return}if(p===!1&&(ie(n.BLEND),p=!0),P!==Bh){if(P!==m||et!==F){if((_!==li||A!==li)&&(n.blendEquation(n.FUNC_ADD),_=li,A=li),et)switch(P){case Pi:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Gl:n.blendFunc(n.ONE,n.ONE);break;case Wl:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Xl:n.blendFuncSeparate(n.DST_COLOR,n.ONE_MINUS_SRC_ALPHA,n.ZERO,n.ONE);break;default:Re("WebGLState: Invalid blending: ",P);break}else switch(P){case Pi:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Gl:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE,n.ONE,n.ONE);break;case Wl:Re("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Xl:Re("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Re("WebGLState: Invalid blending: ",P);break}x=null,M=null,E=null,I=null,S.set(0,0,0),w=0,m=P,F=et}return}se=se||ne,K=K||q,Te=Te||ge,(ne!==_||se!==A)&&(n.blendEquationSeparate(We[ne],We[se]),_=ne,A=se),(q!==x||ge!==M||K!==E||Te!==I)&&(n.blendFuncSeparate(Qe[q],Qe[ge],Qe[K],Qe[Te]),x=q,M=ge,E=K,I=Te),(Ne.equals(S)===!1||Mt!==w)&&(n.blendColor(Ne.r,Ne.g,Ne.b,Mt),S.copy(Ne),w=Mt),m=P,F=!1}function Ve(P,ne){P.side===Bt?Ie(n.CULL_FACE):ie(n.CULL_FACE);let q=P.side===Vt;ne&&(q=!q),At(q),P.blending===Pi&&P.transparent===!1?ht(In):ht(P.blending,P.blendEquation,P.blendSrc,P.blendDst,P.blendEquationAlpha,P.blendSrcAlpha,P.blendDstAlpha,P.blendColor,P.blendAlpha,P.premultipliedAlpha),a.setFunc(P.depthFunc),a.setTest(P.depthTest),a.setMask(P.depthWrite),s.setMask(P.colorWrite);let ge=P.stencilWrite;o.setTest(ge),ge&&(o.setMask(P.stencilWriteMask),o.setFunc(P.stencilFunc,P.stencilRef,P.stencilFuncMask),o.setOp(P.stencilFail,P.stencilZFail,P.stencilZPass)),D(P.polygonOffset,P.polygonOffsetFactor,P.polygonOffsetUnits),P.alphaToCoverage===!0?ie(n.SAMPLE_ALPHA_TO_COVERAGE):Ie(n.SAMPLE_ALPHA_TO_COVERAGE)}function At(P){R!==P&&(P?n.frontFace(n.CW):n.frontFace(n.CCW),R=P)}function mt(P){P!==Oh?(ie(n.CULL_FACE),P!==U&&(P===Vl?n.cullFace(n.BACK):P===Uh?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):Ie(n.CULL_FACE),U=P}function Yt(P){P!==G&&(V&&n.lineWidth(P),G=P)}function D(P,ne,q){P?(ie(n.POLYGON_OFFSET_FILL),(X!==ne||N!==q)&&(X=ne,N=q,a.getReversed()&&(ne=-ne),n.polygonOffset(ne,q))):Ie(n.POLYGON_OFFSET_FILL)}function Ct(P){P?ie(n.SCISSOR_TEST):Ie(n.SCISSOR_TEST)}function Xe(P){P===void 0&&(P=n.TEXTURE0+H-1),ce!==P&&(n.activeTexture(P),ce=P)}function lt(P,ne,q){q===void 0&&(ce===null?q=n.TEXTURE0+H-1:q=ce);let ge=be[q];ge===void 0&&(ge={type:void 0,texture:void 0},be[q]=ge),(ge.type!==P||ge.texture!==ne)&&(ce!==q&&(n.activeTexture(q),ce=q),n.bindTexture(P,ne||fe[P]),ge.type=P,ge.texture=ne)}function oe(){let P=be[ce];P!==void 0&&P.type!==void 0&&(n.bindTexture(P.type,null),P.type=void 0,P.texture=void 0)}function xt(){try{n.compressedTexImage2D(...arguments)}catch(P){Re("WebGLState:",P)}}function T(){try{n.compressedTexImage3D(...arguments)}catch(P){Re("WebGLState:",P)}}function y(){try{n.texSubImage2D(...arguments)}catch(P){Re("WebGLState:",P)}}function O(){try{n.texSubImage3D(...arguments)}catch(P){Re("WebGLState:",P)}}function Y(){try{n.compressedTexSubImage2D(...arguments)}catch(P){Re("WebGLState:",P)}}function J(){try{n.compressedTexSubImage3D(...arguments)}catch(P){Re("WebGLState:",P)}}function ee(){try{n.texStorage2D(...arguments)}catch(P){Re("WebGLState:",P)}}function ae(){try{n.texStorage3D(...arguments)}catch(P){Re("WebGLState:",P)}}function W(){try{n.texImage2D(...arguments)}catch(P){Re("WebGLState:",P)}}function $(){try{n.texImage3D(...arguments)}catch(P){Re("WebGLState:",P)}}function pe(P){return d[P]!==void 0?d[P]:n.getParameter(P)}function xe(P,ne){d[P]!==ne&&(n.pixelStorei(P,ne),d[P]=ne)}function re(P){je.equals(P)===!1&&(n.scissor(P.x,P.y,P.z,P.w),je.copy(P))}function te(P){Ue.equals(P)===!1&&(n.viewport(P.x,P.y,P.z,P.w),Ue.copy(P))}function De(P,ne){let q=h.get(ne);q===void 0&&(q=new WeakMap,h.set(ne,q));let ge=q.get(P);ge===void 0&&(ge=n.getUniformBlockIndex(ne,P.name),q.set(P,ge))}function ke(P,ne){let ge=h.get(ne).get(P);c.get(ne)!==ge&&(n.uniformBlockBinding(ne,ge,P.__bindingPointIndex),c.set(ne,ge))}function Ke(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),a.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),n.pixelStorei(n.PACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,!1),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,n.BROWSER_DEFAULT_WEBGL),n.pixelStorei(n.PACK_ROW_LENGTH,0),n.pixelStorei(n.PACK_SKIP_PIXELS,0),n.pixelStorei(n.PACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_ROW_LENGTH,0),n.pixelStorei(n.UNPACK_IMAGE_HEIGHT,0),n.pixelStorei(n.UNPACK_SKIP_PIXELS,0),n.pixelStorei(n.UNPACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_SKIP_IMAGES,0),u={},d={},ce=null,be={},l={},f=new WeakMap,g=[],v=null,p=!1,m=null,_=null,x=null,M=null,A=null,E=null,I=null,S=new Ze(0,0,0),w=0,F=!1,R=null,U=null,G=null,X=null,N=null,je.set(0,0,n.canvas.width,n.canvas.height),Ue.set(0,0,n.canvas.width,n.canvas.height),s.reset(),a.reset(),o.reset()}return{buffers:{color:s,depth:a,stencil:o},enable:ie,disable:Ie,bindFramebuffer:Fe,drawBuffers:Pe,useProgram:pt,setBlending:ht,setMaterial:Ve,setFlipSided:At,setCullFace:mt,setLineWidth:Yt,setPolygonOffset:D,setScissorTest:Ct,activeTexture:Xe,bindTexture:lt,unbindTexture:oe,compressedTexImage2D:xt,compressedTexImage3D:T,texImage2D:W,texImage3D:$,pixelStorei:xe,getParameter:pe,updateUBOMapping:De,uniformBlockBinding:ke,texStorage2D:ee,texStorage3D:ae,texSubImage2D:y,texSubImage3D:O,compressedTexSubImage2D:Y,compressedTexSubImage3D:J,scissor:re,viewport:te,reset:Ke}}function S_(n,e,t,i,r,s,a){let o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),h=new ye,u=new WeakMap,d=new Set,l,f=new WeakMap,g=!1;try{g=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function v(T,y){return g?new OffscreenCanvas(T,y):cr("canvas")}function p(T,y,O){let Y=1,J=xt(T);if((J.width>O||J.height>O)&&(Y=O/Math.max(J.width,J.height)),Y<1)if(typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&T instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&T instanceof ImageBitmap||typeof VideoFrame<"u"&&T instanceof VideoFrame){let ee=Math.floor(Y*J.width),ae=Math.floor(Y*J.height);l===void 0&&(l=v(ee,ae));let W=y?v(ee,ae):l;return W.width=ee,W.height=ae,W.getContext("2d").drawImage(T,0,0,ee,ae),Ce("WebGLRenderer: Texture has been resized from ("+J.width+"x"+J.height+") to ("+ee+"x"+ae+")."),W}else return"data"in T&&Ce("WebGLRenderer: Image in DataTexture is too big ("+J.width+"x"+J.height+")."),T;return T}function m(T){return T.generateMipmaps}function _(T){n.generateMipmap(T)}function x(T){return T.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:T.isWebGL3DRenderTarget?n.TEXTURE_3D:T.isWebGLArrayRenderTarget||T.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function M(T,y,O,Y,J,ee=!1){if(T!==null){if(n[T]!==void 0)return n[T];Ce("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+T+"'")}let ae;Y&&(ae=e.get("EXT_texture_norm16"),ae||Ce("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let W=y;if(y===n.RED&&(O===n.FLOAT&&(W=n.R32F),O===n.HALF_FLOAT&&(W=n.R16F),O===n.UNSIGNED_BYTE&&(W=n.R8),O===n.UNSIGNED_SHORT&&ae&&(W=ae.R16_EXT),O===n.SHORT&&ae&&(W=ae.R16_SNORM_EXT)),y===n.RED_INTEGER&&(O===n.UNSIGNED_BYTE&&(W=n.R8UI),O===n.UNSIGNED_SHORT&&(W=n.R16UI),O===n.UNSIGNED_INT&&(W=n.R32UI),O===n.BYTE&&(W=n.R8I),O===n.SHORT&&(W=n.R16I),O===n.INT&&(W=n.R32I)),y===n.RG&&(O===n.FLOAT&&(W=n.RG32F),O===n.HALF_FLOAT&&(W=n.RG16F),O===n.UNSIGNED_BYTE&&(W=n.RG8),O===n.UNSIGNED_SHORT&&ae&&(W=ae.RG16_EXT),O===n.SHORT&&ae&&(W=ae.RG16_SNORM_EXT)),y===n.RG_INTEGER&&(O===n.UNSIGNED_BYTE&&(W=n.RG8UI),O===n.UNSIGNED_SHORT&&(W=n.RG16UI),O===n.UNSIGNED_INT&&(W=n.RG32UI),O===n.BYTE&&(W=n.RG8I),O===n.SHORT&&(W=n.RG16I),O===n.INT&&(W=n.RG32I)),y===n.RGB_INTEGER&&(O===n.UNSIGNED_BYTE&&(W=n.RGB8UI),O===n.UNSIGNED_SHORT&&(W=n.RGB16UI),O===n.UNSIGNED_INT&&(W=n.RGB32UI),O===n.BYTE&&(W=n.RGB8I),O===n.SHORT&&(W=n.RGB16I),O===n.INT&&(W=n.RGB32I)),y===n.RGBA_INTEGER&&(O===n.UNSIGNED_BYTE&&(W=n.RGBA8UI),O===n.UNSIGNED_SHORT&&(W=n.RGBA16UI),O===n.UNSIGNED_INT&&(W=n.RGBA32UI),O===n.BYTE&&(W=n.RGBA8I),O===n.SHORT&&(W=n.RGBA16I),O===n.INT&&(W=n.RGBA32I)),y===n.RGB&&(O===n.UNSIGNED_SHORT&&ae&&(W=ae.RGB16_EXT),O===n.SHORT&&ae&&(W=ae.RGB16_SNORM_EXT),O===n.UNSIGNED_INT_5_9_9_9_REV&&(W=n.RGB9_E5),O===n.UNSIGNED_INT_10F_11F_11F_REV&&(W=n.R11F_G11F_B10F)),y===n.RGBA){let $=ee?Gr:qe.getTransfer(J);O===n.FLOAT&&(W=n.RGBA32F),O===n.HALF_FLOAT&&(W=n.RGBA16F),O===n.UNSIGNED_BYTE&&(W=$===Je?n.SRGB8_ALPHA8:n.RGBA8),O===n.UNSIGNED_SHORT&&ae&&(W=ae.RGBA16_EXT),O===n.SHORT&&ae&&(W=ae.RGBA16_SNORM_EXT),O===n.UNSIGNED_SHORT_4_4_4_4&&(W=n.RGBA4),O===n.UNSIGNED_SHORT_5_5_5_1&&(W=n.RGB5_A1)}return(W===n.R16F||W===n.R32F||W===n.RG16F||W===n.RG32F||W===n.RGBA16F||W===n.RGBA32F)&&e.get("EXT_color_buffer_float"),W}function A(T,y){let O;return T?y===null||y===_n||y===wr?O=n.DEPTH24_STENCIL8:y===yn?O=n.DEPTH32F_STENCIL8:y===Er&&(O=n.DEPTH24_STENCIL8,Ce("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):y===null||y===_n||y===wr?O=n.DEPTH_COMPONENT24:y===yn?O=n.DEPTH_COMPONENT32F:y===Er&&(O=n.DEPTH_COMPONENT16),O}function E(T,y){return m(T)===!0||T.isFramebufferTexture&&T.minFilter!==Dt&&T.minFilter!==Se?Math.log2(Math.max(y.width,y.height))+1:T.mipmaps!==void 0&&T.mipmaps.length>0?T.mipmaps.length:T.isCompressedTexture&&Array.isArray(T.image)?y.mipmaps.length:1}function I(T){let y=T.target;y.removeEventListener("dispose",I),w(y),y.isVideoTexture&&u.delete(y),y.isHTMLTexture&&d.delete(y)}function S(T){let y=T.target;y.removeEventListener("dispose",S),R(y)}function w(T){let y=i.get(T);if(y.__webglInit===void 0)return;let O=T.source,Y=f.get(O);if(Y){let J=Y[y.__cacheKey];J.usedTimes--,J.usedTimes===0&&F(T),Object.keys(Y).length===0&&f.delete(O)}i.remove(T)}function F(T){let y=i.get(T);n.deleteTexture(y.__webglTexture);let O=T.source,Y=f.get(O);delete Y[y.__cacheKey],a.memory.textures--}function R(T){let y=i.get(T);if(T.depthTexture&&(T.depthTexture.dispose(),i.remove(T.depthTexture)),T.isWebGLCubeRenderTarget)for(let Y=0;Y<6;Y++){if(Array.isArray(y.__webglFramebuffer[Y]))for(let J=0;J<y.__webglFramebuffer[Y].length;J++)n.deleteFramebuffer(y.__webglFramebuffer[Y][J]);else n.deleteFramebuffer(y.__webglFramebuffer[Y]);y.__webglDepthbuffer&&n.deleteRenderbuffer(y.__webglDepthbuffer[Y])}else{if(Array.isArray(y.__webglFramebuffer))for(let Y=0;Y<y.__webglFramebuffer.length;Y++)n.deleteFramebuffer(y.__webglFramebuffer[Y]);else n.deleteFramebuffer(y.__webglFramebuffer);if(y.__webglDepthbuffer&&n.deleteRenderbuffer(y.__webglDepthbuffer),y.__webglMultisampledFramebuffer&&n.deleteFramebuffer(y.__webglMultisampledFramebuffer),y.__webglColorRenderbuffer)for(let Y=0;Y<y.__webglColorRenderbuffer.length;Y++)y.__webglColorRenderbuffer[Y]&&n.deleteRenderbuffer(y.__webglColorRenderbuffer[Y]);y.__webglDepthRenderbuffer&&n.deleteRenderbuffer(y.__webglDepthRenderbuffer)}let O=T.textures;for(let Y=0,J=O.length;Y<J;Y++){let ee=i.get(O[Y]);ee.__webglTexture&&(n.deleteTexture(ee.__webglTexture),a.memory.textures--),i.remove(O[Y])}i.remove(T)}let U=0;function G(){U=0}function X(){return U}function N(T){U=T}function H(){let T=U;return T>=r.maxTextures&&Ce("WebGLTextures: Trying to use "+T+" texture units while this GPU supports only "+r.maxTextures),U+=1,T}function V(T){let y=[];return y.push(T.wrapS),y.push(T.wrapT),y.push(T.wrapR||0),y.push(T.magFilter),y.push(T.minFilter),y.push(T.anisotropy),y.push(T.internalFormat),y.push(T.format),y.push(T.type),y.push(T.generateMipmaps),y.push(T.premultiplyAlpha),y.push(T.flipY),y.push(T.unpackAlignment),y.push(T.colorSpace),y.join()}function j(T,y){let O=i.get(T);if(T.isVideoTexture&&lt(T),T.isRenderTargetTexture===!1&&T.isExternalTexture!==!0&&T.version>0&&O.__version!==T.version){let Y=T.image;if(Y===null)Ce("WebGLRenderer: Texture marked for update but no image data found.");else if(Y.complete===!1)Ce("WebGLRenderer: Texture marked for update but image is incomplete");else{Ie(O,T,y);return}}else T.isExternalTexture&&(O.__webglTexture=T.sourceTexture?T.sourceTexture:null);t.bindTexture(n.TEXTURE_2D,O.__webglTexture,n.TEXTURE0+y)}function Q(T,y){let O=i.get(T);if(T.isRenderTargetTexture===!1&&T.version>0&&O.__version!==T.version){Ie(O,T,y);return}else T.isExternalTexture&&(O.__webglTexture=T.sourceTexture?T.sourceTexture:null);t.bindTexture(n.TEXTURE_2D_ARRAY,O.__webglTexture,n.TEXTURE0+y)}function ce(T,y){let O=i.get(T);if(T.isRenderTargetTexture===!1&&T.version>0&&O.__version!==T.version){Ie(O,T,y);return}t.bindTexture(n.TEXTURE_3D,O.__webglTexture,n.TEXTURE0+y)}function be(T,y){let O=i.get(T);if(T.isCubeDepthTexture!==!0&&T.version>0&&O.__version!==T.version){Fe(O,T,y);return}t.bindTexture(n.TEXTURE_CUBE_MAP,O.__webglTexture,n.TEXTURE0+y)}let we={[xa]:n.REPEAT,[Jt]:n.CLAMP_TO_EDGE,[va]:n.MIRRORED_REPEAT},Ye={[Dt]:n.NEAREST,[su]:n.NEAREST_MIPMAP_NEAREST,[ps]:n.NEAREST_MIPMAP_LINEAR,[Se]:n.LINEAR,[eo]:n.LINEAR_MIPMAP_NEAREST,[gn]:n.LINEAR_MIPMAP_LINEAR},je={[lu]:n.NEVER,[fu]:n.ALWAYS,[cu]:n.LESS,[ko]:n.LEQUAL,[hu]:n.EQUAL,[Bo]:n.GEQUAL,[uu]:n.GREATER,[du]:n.NOTEQUAL};function Ue(T,y){if(y.type===yn&&e.has("OES_texture_float_linear")===!1&&(y.magFilter===Se||y.magFilter===eo||y.magFilter===ps||y.magFilter===gn||y.minFilter===Se||y.minFilter===eo||y.minFilter===ps||y.minFilter===gn)&&Ce("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(T,n.TEXTURE_WRAP_S,we[y.wrapS]),n.texParameteri(T,n.TEXTURE_WRAP_T,we[y.wrapT]),(T===n.TEXTURE_3D||T===n.TEXTURE_2D_ARRAY)&&n.texParameteri(T,n.TEXTURE_WRAP_R,we[y.wrapR]),n.texParameteri(T,n.TEXTURE_MAG_FILTER,Ye[y.magFilter]),n.texParameteri(T,n.TEXTURE_MIN_FILTER,Ye[y.minFilter]),y.compareFunction&&(n.texParameteri(T,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(T,n.TEXTURE_COMPARE_FUNC,je[y.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(y.magFilter===Dt||y.minFilter!==ps&&y.minFilter!==gn||y.type===yn&&e.has("OES_texture_float_linear")===!1)return;if(y.anisotropy>1||i.get(y).__currentAnisotropy){let O=e.get("EXT_texture_filter_anisotropic");n.texParameterf(T,O.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(y.anisotropy,r.getMaxAnisotropy())),i.get(y).__currentAnisotropy=y.anisotropy}}}function Z(T,y){let O=!1;T.__webglInit===void 0&&(T.__webglInit=!0,y.addEventListener("dispose",I));let Y=y.source,J=f.get(Y);J===void 0&&(J={},f.set(Y,J));let ee=V(y);if(ee!==T.__cacheKey){J[ee]===void 0&&(J[ee]={texture:n.createTexture(),usedTimes:0},a.memory.textures++,O=!0),J[ee].usedTimes++;let ae=J[T.__cacheKey];ae!==void 0&&(J[T.__cacheKey].usedTimes--,ae.usedTimes===0&&F(y)),T.__cacheKey=ee,T.__webglTexture=J[ee].texture}return O}function fe(T,y,O){return Math.floor(Math.floor(T/O)/y)}function ie(T,y,O,Y){let ee=T.updateRanges;if(ee.length===0)t.texSubImage2D(n.TEXTURE_2D,0,0,0,y.width,y.height,O,Y,y.data);else{ee.sort((xe,re)=>xe.start-re.start);let ae=0;for(let xe=1;xe<ee.length;xe++){let re=ee[ae],te=ee[xe],De=re.start+re.count,ke=fe(te.start,y.width,4),Ke=fe(re.start,y.width,4);te.start<=De+1&&ke===Ke&&fe(te.start+te.count-1,y.width,4)===ke?re.count=Math.max(re.count,te.start+te.count-re.start):(++ae,ee[ae]=te)}ee.length=ae+1;let W=t.getParameter(n.UNPACK_ROW_LENGTH),$=t.getParameter(n.UNPACK_SKIP_PIXELS),pe=t.getParameter(n.UNPACK_SKIP_ROWS);t.pixelStorei(n.UNPACK_ROW_LENGTH,y.width);for(let xe=0,re=ee.length;xe<re;xe++){let te=ee[xe],De=Math.floor(te.start/4),ke=Math.ceil(te.count/4),Ke=De%y.width,P=Math.floor(De/y.width),ne=ke,q=1;t.pixelStorei(n.UNPACK_SKIP_PIXELS,Ke),t.pixelStorei(n.UNPACK_SKIP_ROWS,P),t.texSubImage2D(n.TEXTURE_2D,0,Ke,P,ne,q,O,Y,y.data)}T.clearUpdateRanges(),t.pixelStorei(n.UNPACK_ROW_LENGTH,W),t.pixelStorei(n.UNPACK_SKIP_PIXELS,$),t.pixelStorei(n.UNPACK_SKIP_ROWS,pe)}}function Ie(T,y,O){let Y=n.TEXTURE_2D;(y.isDataArrayTexture||y.isCompressedArrayTexture)&&(Y=n.TEXTURE_2D_ARRAY),y.isData3DTexture&&(Y=n.TEXTURE_3D);let J=Z(T,y),ee=y.source;t.bindTexture(Y,T.__webglTexture,n.TEXTURE0+O);let ae=i.get(ee);if(ee.version!==ae.__version||J===!0){if(t.activeTexture(n.TEXTURE0+O),(typeof ImageBitmap<"u"&&y.image instanceof ImageBitmap)===!1){let q=qe.getPrimaries(qe.workingColorSpace),ge=y.colorSpace===Yn?null:qe.getPrimaries(y.colorSpace),se=y.colorSpace===Yn||q===ge?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,y.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,se)}t.pixelStorei(n.UNPACK_ALIGNMENT,y.unpackAlignment);let $=p(y.image,!1,r.maxTextureSize);$=oe(y,$);let pe=s.convert(y.format,y.colorSpace),xe=s.convert(y.type),re=M(y.internalFormat,pe,xe,y.normalized,y.colorSpace,y.isVideoTexture);Ue(Y,y);let te,De=y.mipmaps,ke=y.isVideoTexture!==!0,Ke=ae.__version===void 0||J===!0,P=ee.dataReady,ne=E(y,$);if(y.isDepthTexture)re=A(y.format===_i,y.type),Ke&&(ke?t.texStorage2D(n.TEXTURE_2D,1,re,$.width,$.height):t.texImage2D(n.TEXTURE_2D,0,re,$.width,$.height,0,pe,xe,null));else if(y.isDataTexture)if(De.length>0){ke&&Ke&&t.texStorage2D(n.TEXTURE_2D,ne,re,De[0].width,De[0].height);for(let q=0,ge=De.length;q<ge;q++)te=De[q],ke?P&&t.texSubImage2D(n.TEXTURE_2D,q,0,0,te.width,te.height,pe,xe,te.data):t.texImage2D(n.TEXTURE_2D,q,re,te.width,te.height,0,pe,xe,te.data);y.generateMipmaps=!1}else ke?(Ke&&t.texStorage2D(n.TEXTURE_2D,ne,re,$.width,$.height),P&&ie(y,$,pe,xe)):t.texImage2D(n.TEXTURE_2D,0,re,$.width,$.height,0,pe,xe,$.data);else if(y.isCompressedTexture)if(y.isCompressedArrayTexture){ke&&Ke&&t.texStorage3D(n.TEXTURE_2D_ARRAY,ne,re,De[0].width,De[0].height,$.depth);for(let q=0,ge=De.length;q<ge;q++)if(te=De[q],y.format!==ln)if(pe!==null)if(ke){if(P)if(y.layerUpdates.size>0){let se=pc(te.width,te.height,y.format,y.type);for(let K of y.layerUpdates){let Te=te.data.subarray(K*se/te.data.BYTES_PER_ELEMENT,(K+1)*se/te.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,q,0,0,K,te.width,te.height,1,pe,Te)}y.clearLayerUpdates()}else t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,q,0,0,0,te.width,te.height,$.depth,pe,te.data)}else t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,q,re,te.width,te.height,$.depth,0,te.data,0,0);else Ce("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else ke?P&&t.texSubImage3D(n.TEXTURE_2D_ARRAY,q,0,0,0,te.width,te.height,$.depth,pe,xe,te.data):t.texImage3D(n.TEXTURE_2D_ARRAY,q,re,te.width,te.height,$.depth,0,pe,xe,te.data)}else{ke&&Ke&&t.texStorage2D(n.TEXTURE_2D,ne,re,De[0].width,De[0].height);for(let q=0,ge=De.length;q<ge;q++)te=De[q],y.format!==ln?pe!==null?ke?P&&t.compressedTexSubImage2D(n.TEXTURE_2D,q,0,0,te.width,te.height,pe,te.data):t.compressedTexImage2D(n.TEXTURE_2D,q,re,te.width,te.height,0,te.data):Ce("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):ke?P&&t.texSubImage2D(n.TEXTURE_2D,q,0,0,te.width,te.height,pe,xe,te.data):t.texImage2D(n.TEXTURE_2D,q,re,te.width,te.height,0,pe,xe,te.data)}else if(y.isDataArrayTexture)if(ke){if(Ke&&t.texStorage3D(n.TEXTURE_2D_ARRAY,ne,re,$.width,$.height,$.depth),P)if(y.layerUpdates.size>0){let q=pc($.width,$.height,y.format,y.type);for(let ge of y.layerUpdates){let se=$.data.subarray(ge*q/$.data.BYTES_PER_ELEMENT,(ge+1)*q/$.data.BYTES_PER_ELEMENT);t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,ge,$.width,$.height,1,pe,xe,se)}y.clearLayerUpdates()}else t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,$.width,$.height,$.depth,pe,xe,$.data)}else t.texImage3D(n.TEXTURE_2D_ARRAY,0,re,$.width,$.height,$.depth,0,pe,xe,$.data);else if(y.isData3DTexture)ke?(Ke&&t.texStorage3D(n.TEXTURE_3D,ne,re,$.width,$.height,$.depth),P&&t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,$.width,$.height,$.depth,pe,xe,$.data)):t.texImage3D(n.TEXTURE_3D,0,re,$.width,$.height,$.depth,0,pe,xe,$.data);else if(y.isFramebufferTexture){if(Ke)if(ke)t.texStorage2D(n.TEXTURE_2D,ne,re,$.width,$.height);else{let q=$.width,ge=$.height;for(let se=0;se<ne;se++)t.texImage2D(n.TEXTURE_2D,se,re,q,ge,0,pe,xe,null),q>>=1,ge>>=1}}else if(y.isHTMLTexture){if("texElementImage2D"in n){let q=n.canvas;if(q.hasAttribute("layoutsubtree")||q.setAttribute("layoutsubtree","true"),$.parentNode!==q){q.appendChild($),d.add(y),q.onpaint=Ne=>{let Mt=Ne.changedElements;for(let et of d)Mt.includes(et.image)&&(et.needsUpdate=!0)},q.requestPaint();return}let ge=0,se=n.RGBA,K=n.RGBA,Te=n.UNSIGNED_BYTE;n.texElementImage2D(n.TEXTURE_2D,ge,se,K,Te,$),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MIN_FILTER,n.LINEAR),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE)}}else if(De.length>0){if(ke&&Ke){let q=xt(De[0]);t.texStorage2D(n.TEXTURE_2D,ne,re,q.width,q.height)}for(let q=0,ge=De.length;q<ge;q++)te=De[q],ke?P&&t.texSubImage2D(n.TEXTURE_2D,q,0,0,pe,xe,te):t.texImage2D(n.TEXTURE_2D,q,re,pe,xe,te);y.generateMipmaps=!1}else if(ke){if(Ke){let q=xt($);t.texStorage2D(n.TEXTURE_2D,ne,re,q.width,q.height)}P&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,pe,xe,$)}else t.texImage2D(n.TEXTURE_2D,0,re,pe,xe,$);m(y)&&_(Y),ae.__version=ee.version,y.onUpdate&&y.onUpdate(y)}T.__version=y.version}function Fe(T,y,O){if(y.image.length!==6)return;let Y=Z(T,y),J=y.source;t.bindTexture(n.TEXTURE_CUBE_MAP,T.__webglTexture,n.TEXTURE0+O);let ee=i.get(J);if(J.version!==ee.__version||Y===!0){t.activeTexture(n.TEXTURE0+O);let ae=qe.getPrimaries(qe.workingColorSpace),W=y.colorSpace===Yn?null:qe.getPrimaries(y.colorSpace),$=y.colorSpace===Yn||ae===W?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,y.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),t.pixelStorei(n.UNPACK_ALIGNMENT,y.unpackAlignment),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,$);let pe=y.isCompressedTexture||y.image[0].isCompressedTexture,xe=y.image[0]&&y.image[0].isDataTexture,re=[];for(let K=0;K<6;K++)!pe&&!xe?re[K]=p(y.image[K],!0,r.maxCubemapSize):re[K]=xe?y.image[K].image:y.image[K],re[K]=oe(y,re[K]);let te=re[0],De=s.convert(y.format,y.colorSpace),ke=s.convert(y.type),Ke=M(y.internalFormat,De,ke,y.normalized,y.colorSpace),P=y.isVideoTexture!==!0,ne=ee.__version===void 0||Y===!0,q=J.dataReady,ge=E(y,te);Ue(n.TEXTURE_CUBE_MAP,y);let se;if(pe){P&&ne&&t.texStorage2D(n.TEXTURE_CUBE_MAP,ge,Ke,te.width,te.height);for(let K=0;K<6;K++){se=re[K].mipmaps;for(let Te=0;Te<se.length;Te++){let Ne=se[Te];y.format!==ln?De!==null?P?q&&t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Te,0,0,Ne.width,Ne.height,De,Ne.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Te,Ke,Ne.width,Ne.height,0,Ne.data):Ce("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):P?q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Te,0,0,Ne.width,Ne.height,De,ke,Ne.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Te,Ke,Ne.width,Ne.height,0,De,ke,Ne.data)}}}else{if(se=y.mipmaps,P&&ne){se.length>0&&ge++;let K=xt(re[0]);t.texStorage2D(n.TEXTURE_CUBE_MAP,ge,Ke,K.width,K.height)}for(let K=0;K<6;K++)if(xe){P?q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,0,0,re[K].width,re[K].height,De,ke,re[K].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,Ke,re[K].width,re[K].height,0,De,ke,re[K].data);for(let Te=0;Te<se.length;Te++){let Mt=se[Te].image[K].image;P?q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Te+1,0,0,Mt.width,Mt.height,De,ke,Mt.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Te+1,Ke,Mt.width,Mt.height,0,De,ke,Mt.data)}}else{P?q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,0,0,De,ke,re[K]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,Ke,De,ke,re[K]);for(let Te=0;Te<se.length;Te++){let Ne=se[Te];P?q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Te+1,0,0,De,ke,Ne.image[K]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Te+1,Ke,De,ke,Ne.image[K])}}}m(y)&&_(n.TEXTURE_CUBE_MAP),ee.__version=J.version,y.onUpdate&&y.onUpdate(y)}T.__version=y.version}function Pe(T,y,O,Y,J,ee){let ae=s.convert(O.format,O.colorSpace),W=s.convert(O.type),$=M(O.internalFormat,ae,W,O.normalized,O.colorSpace),pe=i.get(y),xe=i.get(O);if(xe.__renderTarget=y,!pe.__hasExternalTextures){let re=Math.max(1,y.width>>ee),te=Math.max(1,y.height>>ee);J===n.TEXTURE_3D||J===n.TEXTURE_2D_ARRAY?t.texImage3D(J,ee,$,re,te,y.depth,0,ae,W,null):t.texImage2D(J,ee,$,re,te,0,ae,W,null)}t.bindFramebuffer(n.FRAMEBUFFER,T),Xe(y)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,Y,J,xe.__webglTexture,0,Ct(y)):(J===n.TEXTURE_2D||J>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&J<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,Y,J,xe.__webglTexture,ee),t.bindFramebuffer(n.FRAMEBUFFER,null)}function pt(T,y,O){if(n.bindRenderbuffer(n.RENDERBUFFER,T),y.depthBuffer){let Y=y.depthTexture,J=Y&&Y.isDepthTexture?Y.type:null,ee=A(y.stencilBuffer,J),ae=y.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;Xe(y)?o.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Ct(y),ee,y.width,y.height):O?n.renderbufferStorageMultisample(n.RENDERBUFFER,Ct(y),ee,y.width,y.height):n.renderbufferStorage(n.RENDERBUFFER,ee,y.width,y.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,ae,n.RENDERBUFFER,T)}else{let Y=y.textures;for(let J=0;J<Y.length;J++){let ee=Y[J],ae=s.convert(ee.format,ee.colorSpace),W=s.convert(ee.type),$=M(ee.internalFormat,ae,W,ee.normalized,ee.colorSpace);Xe(y)?o.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Ct(y),$,y.width,y.height):O?n.renderbufferStorageMultisample(n.RENDERBUFFER,Ct(y),$,y.width,y.height):n.renderbufferStorage(n.RENDERBUFFER,$,y.width,y.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function We(T,y,O){let Y=y.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(n.FRAMEBUFFER,T),!(y.depthTexture&&y.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let J=i.get(y.depthTexture);if(J.__renderTarget=y,(!J.__webglTexture||y.depthTexture.image.width!==y.width||y.depthTexture.image.height!==y.height)&&(y.depthTexture.image.width=y.width,y.depthTexture.image.height=y.height,y.depthTexture.needsUpdate=!0),Y){if(J.__webglInit===void 0&&(J.__webglInit=!0,y.depthTexture.addEventListener("dispose",I)),J.__webglTexture===void 0){J.__webglTexture=n.createTexture(),t.bindTexture(n.TEXTURE_CUBE_MAP,J.__webglTexture),Ue(n.TEXTURE_CUBE_MAP,y.depthTexture);let pe=s.convert(y.depthTexture.format),xe=s.convert(y.depthTexture.type),re;y.depthTexture.format===wn?re=n.DEPTH_COMPONENT24:y.depthTexture.format===_i&&(re=n.DEPTH24_STENCIL8);for(let te=0;te<6;te++)n.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,re,y.width,y.height,0,pe,xe,null)}}else j(y.depthTexture,0);let ee=J.__webglTexture,ae=Ct(y),W=Y?n.TEXTURE_CUBE_MAP_POSITIVE_X+O:n.TEXTURE_2D,$=y.depthTexture.format===_i?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;if(y.depthTexture.format===wn)Xe(y)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,$,W,ee,0,ae):n.framebufferTexture2D(n.FRAMEBUFFER,$,W,ee,0);else if(y.depthTexture.format===_i)Xe(y)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,$,W,ee,0,ae):n.framebufferTexture2D(n.FRAMEBUFFER,$,W,ee,0);else throw new Error("Unknown depthTexture format")}function Qe(T){let y=i.get(T),O=T.isWebGLCubeRenderTarget===!0;if(y.__boundDepthTexture!==T.depthTexture){let Y=T.depthTexture;if(y.__depthDisposeCallback&&y.__depthDisposeCallback(),Y){let J=()=>{delete y.__boundDepthTexture,delete y.__depthDisposeCallback,Y.removeEventListener("dispose",J)};Y.addEventListener("dispose",J),y.__depthDisposeCallback=J}y.__boundDepthTexture=Y}if(T.depthTexture&&!y.__autoAllocateDepthBuffer)if(O)for(let Y=0;Y<6;Y++)We(y.__webglFramebuffer[Y],T,Y);else{let Y=T.texture.mipmaps;Y&&Y.length>0?We(y.__webglFramebuffer[0],T,0):We(y.__webglFramebuffer,T,0)}else if(O){y.__webglDepthbuffer=[];for(let Y=0;Y<6;Y++)if(t.bindFramebuffer(n.FRAMEBUFFER,y.__webglFramebuffer[Y]),y.__webglDepthbuffer[Y]===void 0)y.__webglDepthbuffer[Y]=n.createRenderbuffer(),pt(y.__webglDepthbuffer[Y],T,!1);else{let J=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ee=y.__webglDepthbuffer[Y];n.bindRenderbuffer(n.RENDERBUFFER,ee),n.framebufferRenderbuffer(n.FRAMEBUFFER,J,n.RENDERBUFFER,ee)}}else{let Y=T.texture.mipmaps;if(Y&&Y.length>0?t.bindFramebuffer(n.FRAMEBUFFER,y.__webglFramebuffer[0]):t.bindFramebuffer(n.FRAMEBUFFER,y.__webglFramebuffer),y.__webglDepthbuffer===void 0)y.__webglDepthbuffer=n.createRenderbuffer(),pt(y.__webglDepthbuffer,T,!1);else{let J=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ee=y.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,ee),n.framebufferRenderbuffer(n.FRAMEBUFFER,J,n.RENDERBUFFER,ee)}}t.bindFramebuffer(n.FRAMEBUFFER,null)}function ht(T,y,O){let Y=i.get(T);y!==void 0&&Pe(Y.__webglFramebuffer,T,T.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),O!==void 0&&Qe(T)}function Ve(T){let y=T.texture,O=i.get(T),Y=i.get(y);T.addEventListener("dispose",S);let J=T.textures,ee=T.isWebGLCubeRenderTarget===!0,ae=J.length>1;if(ae||(Y.__webglTexture===void 0&&(Y.__webglTexture=n.createTexture()),Y.__version=y.version,a.memory.textures++),ee){O.__webglFramebuffer=[];for(let W=0;W<6;W++)if(y.mipmaps&&y.mipmaps.length>0){O.__webglFramebuffer[W]=[];for(let $=0;$<y.mipmaps.length;$++)O.__webglFramebuffer[W][$]=n.createFramebuffer()}else O.__webglFramebuffer[W]=n.createFramebuffer()}else{if(y.mipmaps&&y.mipmaps.length>0){O.__webglFramebuffer=[];for(let W=0;W<y.mipmaps.length;W++)O.__webglFramebuffer[W]=n.createFramebuffer()}else O.__webglFramebuffer=n.createFramebuffer();if(ae)for(let W=0,$=J.length;W<$;W++){let pe=i.get(J[W]);pe.__webglTexture===void 0&&(pe.__webglTexture=n.createTexture(),a.memory.textures++)}if(T.samples>0&&Xe(T)===!1){O.__webglMultisampledFramebuffer=n.createFramebuffer(),O.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,O.__webglMultisampledFramebuffer);for(let W=0;W<J.length;W++){let $=J[W];O.__webglColorRenderbuffer[W]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,O.__webglColorRenderbuffer[W]);let pe=s.convert($.format,$.colorSpace),xe=s.convert($.type),re=M($.internalFormat,pe,xe,$.normalized,$.colorSpace,T.isXRRenderTarget===!0),te=Ct(T);n.renderbufferStorageMultisample(n.RENDERBUFFER,te,re,T.width,T.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+W,n.RENDERBUFFER,O.__webglColorRenderbuffer[W])}n.bindRenderbuffer(n.RENDERBUFFER,null),T.depthBuffer&&(O.__webglDepthRenderbuffer=n.createRenderbuffer(),pt(O.__webglDepthRenderbuffer,T,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(ee){t.bindTexture(n.TEXTURE_CUBE_MAP,Y.__webglTexture),Ue(n.TEXTURE_CUBE_MAP,y);for(let W=0;W<6;W++)if(y.mipmaps&&y.mipmaps.length>0)for(let $=0;$<y.mipmaps.length;$++)Pe(O.__webglFramebuffer[W][$],T,y,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+W,$);else Pe(O.__webglFramebuffer[W],T,y,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+W,0);m(y)&&_(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(ae){for(let W=0,$=J.length;W<$;W++){let pe=J[W],xe=i.get(pe),re=n.TEXTURE_2D;(T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&(re=T.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(re,xe.__webglTexture),Ue(re,pe),Pe(O.__webglFramebuffer,T,pe,n.COLOR_ATTACHMENT0+W,re,0),m(pe)&&_(re)}t.unbindTexture()}else{let W=n.TEXTURE_2D;if((T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&(W=T.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(W,Y.__webglTexture),Ue(W,y),y.mipmaps&&y.mipmaps.length>0)for(let $=0;$<y.mipmaps.length;$++)Pe(O.__webglFramebuffer[$],T,y,n.COLOR_ATTACHMENT0,W,$);else Pe(O.__webglFramebuffer,T,y,n.COLOR_ATTACHMENT0,W,0);m(y)&&_(W),t.unbindTexture()}T.depthBuffer&&Qe(T)}function At(T){let y=T.textures;for(let O=0,Y=y.length;O<Y;O++){let J=y[O];if(m(J)){let ee=x(T),ae=i.get(J).__webglTexture;t.bindTexture(ee,ae),_(ee),t.unbindTexture()}}}let mt=[],Yt=[];function D(T){if(T.samples>0){if(Xe(T)===!1){let y=T.textures,O=T.width,Y=T.height,J=n.COLOR_BUFFER_BIT,ee=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ae=i.get(T),W=y.length>1;if(W)for(let pe=0;pe<y.length;pe++)t.bindFramebuffer(n.FRAMEBUFFER,ae.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+pe,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,ae.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+pe,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,ae.__webglMultisampledFramebuffer);let $=T.texture.mipmaps;$&&$.length>0?t.bindFramebuffer(n.DRAW_FRAMEBUFFER,ae.__webglFramebuffer[0]):t.bindFramebuffer(n.DRAW_FRAMEBUFFER,ae.__webglFramebuffer);for(let pe=0;pe<y.length;pe++){if(T.resolveDepthBuffer&&(T.depthBuffer&&(J|=n.DEPTH_BUFFER_BIT),T.stencilBuffer&&T.resolveStencilBuffer&&(J|=n.STENCIL_BUFFER_BIT)),W){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,ae.__webglColorRenderbuffer[pe]);let xe=i.get(y[pe]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,xe,0)}n.blitFramebuffer(0,0,O,Y,0,0,O,Y,J,n.NEAREST),c===!0&&(mt.length=0,Yt.length=0,mt.push(n.COLOR_ATTACHMENT0+pe),T.depthBuffer&&T.resolveDepthBuffer===!1&&(mt.push(ee),Yt.push(ee),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,Yt)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,mt))}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),W)for(let pe=0;pe<y.length;pe++){t.bindFramebuffer(n.FRAMEBUFFER,ae.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+pe,n.RENDERBUFFER,ae.__webglColorRenderbuffer[pe]);let xe=i.get(y[pe]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,ae.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+pe,n.TEXTURE_2D,xe,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,ae.__webglMultisampledFramebuffer)}else if(T.depthBuffer&&T.resolveDepthBuffer===!1&&c){let y=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[y])}}}function Ct(T){return Math.min(r.maxSamples,T.samples)}function Xe(T){let y=i.get(T);return T.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&y.__useRenderToTexture!==!1}function lt(T){let y=a.render.frame;u.get(T)!==y&&(u.set(T,y),T.update())}function oe(T,y){let O=T.colorSpace,Y=T.format,J=T.type;return T.isCompressedTexture===!0||T.isVideoTexture===!0||O!==Vr&&O!==Yn&&(qe.getTransfer(O)===Je?(Y!==ln||J!==rn)&&Ce("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Re("WebGLTextures: Unsupported texture color space:",O)),y}function xt(T){return typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement?(h.width=T.naturalWidth||T.width,h.height=T.naturalHeight||T.height):typeof VideoFrame<"u"&&T instanceof VideoFrame?(h.width=T.displayWidth,h.height=T.displayHeight):(h.width=T.width,h.height=T.height),h}this.allocateTextureUnit=H,this.resetTextureUnits=G,this.getTextureUnits=X,this.setTextureUnits=N,this.setTexture2D=j,this.setTexture2DArray=Q,this.setTexture3D=ce,this.setTextureCube=be,this.rebindTextures=ht,this.setupRenderTarget=Ve,this.updateRenderTargetMipmap=At,this.updateMultisampleRenderTarget=D,this.setupDepthRenderbuffer=Qe,this.setupFrameBufferTexture=Pe,this.useMultisampledRTT=Xe,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function b_(n,e){function t(i,r=Yn){let s,a=qe.getTransfer(r);if(i===rn)return n.UNSIGNED_BYTE;if(i===no)return n.UNSIGNED_SHORT_4_4_4_4;if(i===io)return n.UNSIGNED_SHORT_5_5_5_1;if(i===ic)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===rc)return n.UNSIGNED_INT_10F_11F_11F_REV;if(i===tc)return n.BYTE;if(i===nc)return n.SHORT;if(i===Er)return n.UNSIGNED_SHORT;if(i===to)return n.INT;if(i===_n)return n.UNSIGNED_INT;if(i===yn)return n.FLOAT;if(i===Pn)return n.HALF_FLOAT;if(i===sc)return n.ALPHA;if(i===ac)return n.RGB;if(i===ln)return n.RGBA;if(i===wn)return n.DEPTH_COMPONENT;if(i===_i)return n.DEPTH_STENCIL;if(i===oc)return n.RED;if(i===ro)return n.RED_INTEGER;if(i===yi)return n.RG;if(i===so)return n.RG_INTEGER;if(i===ao)return n.RGBA_INTEGER;if(i===ms||i===gs||i===_s||i===ys)if(a===Je)if(s=e.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(i===ms)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===gs)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===_s)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===ys)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=e.get("WEBGL_compressed_texture_s3tc"),s!==null){if(i===ms)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===gs)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===_s)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===ys)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===oo||i===lo||i===co||i===ho)if(s=e.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(i===oo)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===lo)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===co)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===ho)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===uo||i===fo||i===po||i===mo||i===go||i===xs||i===_o)if(s=e.get("WEBGL_compressed_texture_etc"),s!==null){if(i===uo||i===fo)return a===Je?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(i===po)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC;if(i===mo)return s.COMPRESSED_R11_EAC;if(i===go)return s.COMPRESSED_SIGNED_R11_EAC;if(i===xs)return s.COMPRESSED_RG11_EAC;if(i===_o)return s.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===yo||i===xo||i===vo||i===So||i===bo||i===Mo||i===To||i===Eo||i===wo||i===Ao||i===Co||i===Ro||i===Io||i===Po)if(s=e.get("WEBGL_compressed_texture_astc"),s!==null){if(i===yo)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===xo)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===vo)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===So)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===bo)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===Mo)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===To)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===Eo)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===wo)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===Ao)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===Co)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===Ro)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===Io)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===Po)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===Do||i===Lo||i===Fo)if(s=e.get("EXT_texture_compression_bptc"),s!==null){if(i===Do)return a===Je?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===Lo)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===Fo)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===No||i===Oo||i===vs||i===Uo)if(s=e.get("EXT_texture_compression_rgtc"),s!==null){if(i===No)return s.COMPRESSED_RED_RGTC1_EXT;if(i===Oo)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===vs)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===Uo)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===wr?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:t}}var M_=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,T_=`
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

}`,Cc=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let i=new jr(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=i}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,i=new tn({vertexShader:M_,fragmentShader:T_,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new dt(new en(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Rc=class extends An{constructor(e,t){super();let i=this,r=null,s=1,a=null,o="local-floor",c=1,h=null,u=null,d=null,l=null,f=null,g=null,v=typeof XRWebGLBinding<"u",p=new Cc,m={},_=t.getContextAttributes(),x=null,M=null,A=[],E=[],I=new ye,S=null,w=new Wt;w.viewport=new St;let F=new Wt;F.viewport=new St;let R=[w,F],U=new Ja,G=null,X=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Z){let fe=A[Z];return fe===void 0&&(fe=new fr,A[Z]=fe),fe.getTargetRaySpace()},this.getControllerGrip=function(Z){let fe=A[Z];return fe===void 0&&(fe=new fr,A[Z]=fe),fe.getGripSpace()},this.getHand=function(Z){let fe=A[Z];return fe===void 0&&(fe=new fr,A[Z]=fe),fe.getHandSpace()};function N(Z){let fe=E.indexOf(Z.inputSource);if(fe===-1)return;let ie=A[fe];ie!==void 0&&(ie.update(Z.inputSource,Z.frame,h||a),ie.dispatchEvent({type:Z.type,data:Z.inputSource}))}function H(){r.removeEventListener("select",N),r.removeEventListener("selectstart",N),r.removeEventListener("selectend",N),r.removeEventListener("squeeze",N),r.removeEventListener("squeezestart",N),r.removeEventListener("squeezeend",N),r.removeEventListener("end",H),r.removeEventListener("inputsourceschange",V);for(let Z=0;Z<A.length;Z++){let fe=E[Z];fe!==null&&(E[Z]=null,A[Z].disconnect(fe))}G=null,X=null,p.reset();for(let Z in m)delete m[Z];e.setRenderTarget(x),f=null,l=null,d=null,r=null,M=null,Ue.stop(),i.isPresenting=!1,e.setPixelRatio(S),e.setSize(I.width,I.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Z){s=Z,i.isPresenting===!0&&Ce("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Z){o=Z,i.isPresenting===!0&&Ce("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return h||a},this.setReferenceSpace=function(Z){h=Z},this.getBaseLayer=function(){return l!==null?l:f},this.getBinding=function(){return d===null&&v&&(d=new XRWebGLBinding(r,t)),d},this.getFrame=function(){return g},this.getSession=function(){return r},this.setSession=async function(Z){if(r=Z,r!==null){if(x=e.getRenderTarget(),r.addEventListener("select",N),r.addEventListener("selectstart",N),r.addEventListener("selectend",N),r.addEventListener("squeeze",N),r.addEventListener("squeezestart",N),r.addEventListener("squeezeend",N),r.addEventListener("end",H),r.addEventListener("inputsourceschange",V),_.xrCompatible!==!0&&await t.makeXRCompatible(),S=e.getPixelRatio(),e.getSize(I),v&&"createProjectionLayer"in XRWebGLBinding.prototype){let ie=null,Ie=null,Fe=null;_.depth&&(Fe=_.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,ie=_.stencil?_i:wn,Ie=_.stencil?wr:_n);let Pe={colorFormat:t.RGBA8,depthFormat:Fe,scaleFactor:s};d=this.getBinding(),l=d.createProjectionLayer(Pe),r.updateRenderState({layers:[l]}),e.setPixelRatio(1),e.setSize(l.textureWidth,l.textureHeight,!1),M=new jt(l.textureWidth,l.textureHeight,{format:ln,type:rn,depthTexture:new qn(l.textureWidth,l.textureHeight,Ie,void 0,void 0,void 0,void 0,void 0,void 0,ie),stencilBuffer:_.stencil,colorSpace:e.outputColorSpace,samples:_.antialias?4:0,resolveDepthBuffer:l.ignoreDepthValues===!1,resolveStencilBuffer:l.ignoreDepthValues===!1})}else{let ie={antialias:_.antialias,alpha:!0,depth:_.depth,stencil:_.stencil,framebufferScaleFactor:s};f=new XRWebGLLayer(r,t,ie),r.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),M=new jt(f.framebufferWidth,f.framebufferHeight,{format:ln,type:rn,colorSpace:e.outputColorSpace,stencilBuffer:_.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1})}M.isXRRenderTarget=!0,this.setFoveation(c),h=null,a=await r.requestReferenceSpace(o),Ue.setContext(r),Ue.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return p.getDepthTexture()};function V(Z){for(let fe=0;fe<Z.removed.length;fe++){let ie=Z.removed[fe],Ie=E.indexOf(ie);Ie>=0&&(E[Ie]=null,A[Ie].disconnect(ie))}for(let fe=0;fe<Z.added.length;fe++){let ie=Z.added[fe],Ie=E.indexOf(ie);if(Ie===-1){for(let Pe=0;Pe<A.length;Pe++)if(Pe>=E.length){E.push(ie),Ie=Pe;break}else if(E[Pe]===null){E[Pe]=ie,Ie=Pe;break}if(Ie===-1)break}let Fe=A[Ie];Fe&&Fe.connect(ie)}}let j=new C,Q=new C;function ce(Z,fe,ie){j.setFromMatrixPosition(fe.matrixWorld),Q.setFromMatrixPosition(ie.matrixWorld);let Ie=j.distanceTo(Q),Fe=fe.projectionMatrix.elements,Pe=ie.projectionMatrix.elements,pt=Fe[14]/(Fe[10]-1),We=Fe[14]/(Fe[10]+1),Qe=(Fe[9]+1)/Fe[5],ht=(Fe[9]-1)/Fe[5],Ve=(Fe[8]-1)/Fe[0],At=(Pe[8]+1)/Pe[0],mt=pt*Ve,Yt=pt*At,D=Ie/(-Ve+At),Ct=D*-Ve;if(fe.matrixWorld.decompose(Z.position,Z.quaternion,Z.scale),Z.translateX(Ct),Z.translateZ(D),Z.matrixWorld.compose(Z.position,Z.quaternion,Z.scale),Z.matrixWorldInverse.copy(Z.matrixWorld).invert(),Fe[10]===-1)Z.projectionMatrix.copy(fe.projectionMatrix),Z.projectionMatrixInverse.copy(fe.projectionMatrixInverse);else{let Xe=pt+D,lt=We+D,oe=mt-Ct,xt=Yt+(Ie-Ct),T=Qe*We/lt*Xe,y=ht*We/lt*Xe;Z.projectionMatrix.makePerspective(oe,xt,T,y,Xe,lt),Z.projectionMatrixInverse.copy(Z.projectionMatrix).invert()}}function be(Z,fe){fe===null?Z.matrixWorld.copy(Z.matrix):Z.matrixWorld.multiplyMatrices(fe.matrixWorld,Z.matrix),Z.matrixWorldInverse.copy(Z.matrixWorld).invert()}this.updateCamera=function(Z){if(r===null)return;let fe=Z.near,ie=Z.far;p.texture!==null&&(p.depthNear>0&&(fe=p.depthNear),p.depthFar>0&&(ie=p.depthFar)),U.near=F.near=w.near=fe,U.far=F.far=w.far=ie,(G!==U.near||X!==U.far)&&(r.updateRenderState({depthNear:U.near,depthFar:U.far}),G=U.near,X=U.far),U.layers.mask=Z.layers.mask|6,w.layers.mask=U.layers.mask&-5,F.layers.mask=U.layers.mask&-3;let Ie=Z.parent,Fe=U.cameras;be(U,Ie);for(let Pe=0;Pe<Fe.length;Pe++)be(Fe[Pe],Ie);Fe.length===2?ce(U,w,F):U.projectionMatrix.copy(w.projectionMatrix),we(Z,U,Ie)};function we(Z,fe,ie){ie===null?Z.matrix.copy(fe.matrixWorld):(Z.matrix.copy(ie.matrixWorld),Z.matrix.invert(),Z.matrix.multiply(fe.matrixWorld)),Z.matrix.decompose(Z.position,Z.quaternion,Z.scale),Z.updateMatrixWorld(!0),Z.projectionMatrix.copy(fe.projectionMatrix),Z.projectionMatrixInverse.copy(fe.projectionMatrixInverse),Z.isPerspectiveCamera&&(Z.fov=Ta*2*Math.atan(1/Z.projectionMatrix.elements[5]),Z.zoom=1)}this.getCamera=function(){return U},this.getFoveation=function(){if(!(l===null&&f===null))return c},this.setFoveation=function(Z){c=Z,l!==null&&(l.fixedFoveation=Z),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=Z)},this.hasDepthSensing=function(){return p.texture!==null},this.getDepthSensingMesh=function(){return p.getMesh(U)},this.getCameraTexture=function(Z){return m[Z]};let Ye=null;function je(Z,fe){if(u=fe.getViewerPose(h||a),g=fe,u!==null){let ie=u.views;f!==null&&(e.setRenderTargetFramebuffer(M,f.framebuffer),e.setRenderTarget(M));let Ie=!1;ie.length!==U.cameras.length&&(U.cameras.length=0,Ie=!0);for(let We=0;We<ie.length;We++){let Qe=ie[We],ht=null;if(f!==null)ht=f.getViewport(Qe);else{let At=d.getViewSubImage(l,Qe);ht=At.viewport,We===0&&(e.setRenderTargetTextures(M,At.colorTexture,At.depthStencilTexture),e.setRenderTarget(M))}let Ve=R[We];Ve===void 0&&(Ve=new Wt,Ve.layers.enable(We),Ve.viewport=new St,R[We]=Ve),Ve.matrix.fromArray(Qe.transform.matrix),Ve.matrix.decompose(Ve.position,Ve.quaternion,Ve.scale),Ve.projectionMatrix.fromArray(Qe.projectionMatrix),Ve.projectionMatrixInverse.copy(Ve.projectionMatrix).invert(),Ve.viewport.set(ht.x,ht.y,ht.width,ht.height),We===0&&(U.matrix.copy(Ve.matrix),U.matrix.decompose(U.position,U.quaternion,U.scale)),Ie===!0&&U.cameras.push(Ve)}let Fe=r.enabledFeatures;if(Fe&&Fe.includes("depth-sensing")&&r.depthUsage=="gpu-optimized"&&v){d=i.getBinding();let We=d.getDepthInformation(ie[0]);We&&We.isValid&&We.texture&&p.init(We,r.renderState)}if(Fe&&Fe.includes("camera-access")&&v){e.state.unbindTexture(),d=i.getBinding();for(let We=0;We<ie.length;We++){let Qe=ie[We].camera;if(Qe){let ht=m[Qe];ht||(ht=new jr,m[Qe]=ht);let Ve=d.getCameraImage(Qe);ht.sourceTexture=Ve}}}}for(let ie=0;ie<A.length;ie++){let Ie=E[ie],Fe=A[ie];Ie!==null&&Fe!==void 0&&Fe.update(Ie,fe,h||a)}Ye&&Ye(Z,fe),fe.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:fe}),g=null}let Ue=new $u;Ue.setAnimationLoop(je),this.setAnimationLoop=function(Z){Ye=Z},this.dispose=function(){}}},E_=new ft,ed=new Le;ed.set(-1,0,0,0,1,0,0,0,1);function w_(n,e){function t(p,m){p.matrixAutoUpdate===!0&&p.updateMatrix(),m.value.copy(p.matrix)}function i(p,m){m.color.getRGB(p.fogColor.value,uc(n)),m.isFog?(p.fogNear.value=m.near,p.fogFar.value=m.far):m.isFogExp2&&(p.fogDensity.value=m.density)}function r(p,m,_,x,M){m.isNodeMaterial?m.uniformsNeedUpdate=!1:m.isMeshBasicMaterial?s(p,m):m.isMeshLambertMaterial?(s(p,m),m.envMap&&(p.envMapIntensity.value=m.envMapIntensity)):m.isMeshToonMaterial?(s(p,m),d(p,m)):m.isMeshPhongMaterial?(s(p,m),u(p,m),m.envMap&&(p.envMapIntensity.value=m.envMapIntensity)):m.isMeshStandardMaterial?(s(p,m),l(p,m),m.isMeshPhysicalMaterial&&f(p,m,M)):m.isMeshMatcapMaterial?(s(p,m),g(p,m)):m.isMeshDepthMaterial?s(p,m):m.isMeshDistanceMaterial?(s(p,m),v(p,m)):m.isMeshNormalMaterial?s(p,m):m.isLineBasicMaterial?(a(p,m),m.isLineDashedMaterial&&o(p,m)):m.isPointsMaterial?c(p,m,_,x):m.isSpriteMaterial?h(p,m):m.isShadowMaterial?(p.color.value.copy(m.color),p.opacity.value=m.opacity):m.isShaderMaterial&&(m.uniformsNeedUpdate=!1)}function s(p,m){p.opacity.value=m.opacity,m.color&&p.diffuse.value.copy(m.color),m.emissive&&p.emissive.value.copy(m.emissive).multiplyScalar(m.emissiveIntensity),m.map&&(p.map.value=m.map,t(m.map,p.mapTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,t(m.alphaMap,p.alphaMapTransform)),m.bumpMap&&(p.bumpMap.value=m.bumpMap,t(m.bumpMap,p.bumpMapTransform),p.bumpScale.value=m.bumpScale,m.side===Vt&&(p.bumpScale.value*=-1)),m.normalMap&&(p.normalMap.value=m.normalMap,t(m.normalMap,p.normalMapTransform),p.normalScale.value.copy(m.normalScale),m.side===Vt&&p.normalScale.value.negate()),m.displacementMap&&(p.displacementMap.value=m.displacementMap,t(m.displacementMap,p.displacementMapTransform),p.displacementScale.value=m.displacementScale,p.displacementBias.value=m.displacementBias),m.emissiveMap&&(p.emissiveMap.value=m.emissiveMap,t(m.emissiveMap,p.emissiveMapTransform)),m.specularMap&&(p.specularMap.value=m.specularMap,t(m.specularMap,p.specularMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest);let _=e.get(m),x=_.envMap,M=_.envMapRotation;x&&(p.envMap.value=x,p.envMapRotation.value.setFromMatrix4(E_.makeRotationFromEuler(M)).transpose(),x.isCubeTexture&&x.isRenderTargetTexture===!1&&p.envMapRotation.value.premultiply(ed),p.reflectivity.value=m.reflectivity,p.ior.value=m.ior,p.refractionRatio.value=m.refractionRatio),m.lightMap&&(p.lightMap.value=m.lightMap,p.lightMapIntensity.value=m.lightMapIntensity,t(m.lightMap,p.lightMapTransform)),m.aoMap&&(p.aoMap.value=m.aoMap,p.aoMapIntensity.value=m.aoMapIntensity,t(m.aoMap,p.aoMapTransform))}function a(p,m){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,m.map&&(p.map.value=m.map,t(m.map,p.mapTransform))}function o(p,m){p.dashSize.value=m.dashSize,p.totalSize.value=m.dashSize+m.gapSize,p.scale.value=m.scale}function c(p,m,_,x){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,p.size.value=m.size*_,p.scale.value=x*.5,m.map&&(p.map.value=m.map,t(m.map,p.uvTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,t(m.alphaMap,p.alphaMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest)}function h(p,m){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,p.rotation.value=m.rotation,m.map&&(p.map.value=m.map,t(m.map,p.mapTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,t(m.alphaMap,p.alphaMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest)}function u(p,m){p.specular.value.copy(m.specular),p.shininess.value=Math.max(m.shininess,1e-4)}function d(p,m){m.gradientMap&&(p.gradientMap.value=m.gradientMap)}function l(p,m){p.metalness.value=m.metalness,m.metalnessMap&&(p.metalnessMap.value=m.metalnessMap,t(m.metalnessMap,p.metalnessMapTransform)),p.roughness.value=m.roughness,m.roughnessMap&&(p.roughnessMap.value=m.roughnessMap,t(m.roughnessMap,p.roughnessMapTransform)),m.envMap&&(p.envMapIntensity.value=m.envMapIntensity)}function f(p,m,_){p.ior.value=m.ior,m.sheen>0&&(p.sheenColor.value.copy(m.sheenColor).multiplyScalar(m.sheen),p.sheenRoughness.value=m.sheenRoughness,m.sheenColorMap&&(p.sheenColorMap.value=m.sheenColorMap,t(m.sheenColorMap,p.sheenColorMapTransform)),m.sheenRoughnessMap&&(p.sheenRoughnessMap.value=m.sheenRoughnessMap,t(m.sheenRoughnessMap,p.sheenRoughnessMapTransform))),m.clearcoat>0&&(p.clearcoat.value=m.clearcoat,p.clearcoatRoughness.value=m.clearcoatRoughness,m.clearcoatMap&&(p.clearcoatMap.value=m.clearcoatMap,t(m.clearcoatMap,p.clearcoatMapTransform)),m.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=m.clearcoatRoughnessMap,t(m.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),m.clearcoatNormalMap&&(p.clearcoatNormalMap.value=m.clearcoatNormalMap,t(m.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(m.clearcoatNormalScale),m.side===Vt&&p.clearcoatNormalScale.value.negate())),m.dispersion>0&&(p.dispersion.value=m.dispersion),m.iridescence>0&&(p.iridescence.value=m.iridescence,p.iridescenceIOR.value=m.iridescenceIOR,p.iridescenceThicknessMinimum.value=m.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=m.iridescenceThicknessRange[1],m.iridescenceMap&&(p.iridescenceMap.value=m.iridescenceMap,t(m.iridescenceMap,p.iridescenceMapTransform)),m.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=m.iridescenceThicknessMap,t(m.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),m.transmission>0&&(p.transmission.value=m.transmission,p.transmissionSamplerMap.value=_.texture,p.transmissionSamplerSize.value.set(_.width,_.height),m.transmissionMap&&(p.transmissionMap.value=m.transmissionMap,t(m.transmissionMap,p.transmissionMapTransform)),p.thickness.value=m.thickness,m.thicknessMap&&(p.thicknessMap.value=m.thicknessMap,t(m.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=m.attenuationDistance,p.attenuationColor.value.copy(m.attenuationColor)),m.anisotropy>0&&(p.anisotropyVector.value.set(m.anisotropy*Math.cos(m.anisotropyRotation),m.anisotropy*Math.sin(m.anisotropyRotation)),m.anisotropyMap&&(p.anisotropyMap.value=m.anisotropyMap,t(m.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=m.specularIntensity,p.specularColor.value.copy(m.specularColor),m.specularColorMap&&(p.specularColorMap.value=m.specularColorMap,t(m.specularColorMap,p.specularColorMapTransform)),m.specularIntensityMap&&(p.specularIntensityMap.value=m.specularIntensityMap,t(m.specularIntensityMap,p.specularIntensityMapTransform))}function g(p,m){m.matcap&&(p.matcap.value=m.matcap)}function v(p,m){let _=e.get(m).light;p.referencePosition.value.setFromMatrixPosition(_.matrixWorld),p.nearDistance.value=_.shadow.camera.near,p.farDistance.value=_.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function A_(n,e,t,i){let r={},s={},a=[],o=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function c(_,x){let M=x.program;i.uniformBlockBinding(_,M)}function h(_,x){let M=r[_.id];M===void 0&&(g(_),M=u(_),r[_.id]=M,_.addEventListener("dispose",p));let A=x.program;i.updateUBOMapping(_,A);let E=e.render.frame;s[_.id]!==E&&(l(_),s[_.id]=E)}function u(_){let x=d();_.__bindingPointIndex=x;let M=n.createBuffer(),A=_.__size,E=_.usage;return n.bindBuffer(n.UNIFORM_BUFFER,M),n.bufferData(n.UNIFORM_BUFFER,A,E),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,x,M),M}function d(){for(let _=0;_<o;_++)if(a.indexOf(_)===-1)return a.push(_),_;return Re("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function l(_){let x=r[_.id],M=_.uniforms,A=_.__cache;n.bindBuffer(n.UNIFORM_BUFFER,x);for(let E=0,I=M.length;E<I;E++){let S=Array.isArray(M[E])?M[E]:[M[E]];for(let w=0,F=S.length;w<F;w++){let R=S[w];if(f(R,E,w,A)===!0){let U=R.__offset,G=Array.isArray(R.value)?R.value:[R.value],X=0;for(let N=0;N<G.length;N++){let H=G[N],V=v(H);typeof H=="number"||typeof H=="boolean"?(R.__data[0]=H,n.bufferSubData(n.UNIFORM_BUFFER,U+X,R.__data)):H.isMatrix3?(R.__data[0]=H.elements[0],R.__data[1]=H.elements[1],R.__data[2]=H.elements[2],R.__data[3]=0,R.__data[4]=H.elements[3],R.__data[5]=H.elements[4],R.__data[6]=H.elements[5],R.__data[7]=0,R.__data[8]=H.elements[6],R.__data[9]=H.elements[7],R.__data[10]=H.elements[8],R.__data[11]=0):ArrayBuffer.isView(H)?R.__data.set(new H.constructor(H.buffer,H.byteOffset,R.__data.length)):(H.toArray(R.__data,X),X+=V.storage/Float32Array.BYTES_PER_ELEMENT)}n.bufferSubData(n.UNIFORM_BUFFER,U,R.__data)}}}n.bindBuffer(n.UNIFORM_BUFFER,null)}function f(_,x,M,A){let E=_.value,I=x+"_"+M;if(A[I]===void 0)return typeof E=="number"||typeof E=="boolean"?A[I]=E:ArrayBuffer.isView(E)?A[I]=E.slice():A[I]=E.clone(),!0;{let S=A[I];if(typeof E=="number"||typeof E=="boolean"){if(S!==E)return A[I]=E,!0}else{if(ArrayBuffer.isView(E))return!0;if(S.equals(E)===!1)return S.copy(E),!0}}return!1}function g(_){let x=_.uniforms,M=0,A=16;for(let I=0,S=x.length;I<S;I++){let w=Array.isArray(x[I])?x[I]:[x[I]];for(let F=0,R=w.length;F<R;F++){let U=w[F],G=Array.isArray(U.value)?U.value:[U.value];for(let X=0,N=G.length;X<N;X++){let H=G[X],V=v(H),j=M%A,Q=j%V.boundary,ce=j+Q;M+=Q,ce!==0&&A-ce<V.storage&&(M+=A-ce),U.__data=new Float32Array(V.storage/Float32Array.BYTES_PER_ELEMENT),U.__offset=M,M+=V.storage}}}let E=M%A;return E>0&&(M+=A-E),_.__size=M,_.__cache={},this}function v(_){let x={boundary:0,storage:0};return typeof _=="number"||typeof _=="boolean"?(x.boundary=4,x.storage=4):_.isVector2?(x.boundary=8,x.storage=8):_.isVector3||_.isColor?(x.boundary=16,x.storage=12):_.isVector4?(x.boundary=16,x.storage=16):_.isMatrix3?(x.boundary=48,x.storage=48):_.isMatrix4?(x.boundary=64,x.storage=64):_.isTexture?Ce("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(_)?(x.boundary=16,x.storage=_.byteLength):Ce("WebGLRenderer: Unsupported uniform value type.",_),x}function p(_){let x=_.target;x.removeEventListener("dispose",p);let M=a.indexOf(x.__bindingPointIndex);a.splice(M,1),n.deleteBuffer(r[x.id]),delete r[x.id],delete s[x.id]}function m(){for(let _ in r)n.deleteBuffer(r[_]);a=[],r={},s={}}return{bind:c,update:h,dispose:m}}var C_=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),Dn=null;function R_(){return Dn===null&&(Dn=new Ra(C_,16,16,yi,Pn),Dn.name="DFG_LUT",Dn.minFilter=Se,Dn.magFilter=Se,Dn.wrapS=Jt,Dn.wrapT=Jt,Dn.generateMipmaps=!1,Dn.needsUpdate=!0),Dn}var Ts=class{constructor(e={}){let{canvas:t=pu(),context:i=null,depth:r=!0,stencil:s=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:h=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:d=!1,reversedDepthBuffer:l=!1,outputBufferType:f=rn}=e;this.isWebGLRenderer=!0;let g;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");g=i.getContextAttributes().alpha}else g=a;let v=f,p=new Set([ao,so,ro]),m=new Set([rn,_n,Er,wr,no,io]),_=new Uint32Array(4),x=new Int32Array(4),M=new C,A=null,E=null,I=[],S=[],w=null;this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=mn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let F=this,R=!1,U=null;this._outputColorSpace=Be;let G=0,X=0,N=null,H=-1,V=null,j=new St,Q=new St,ce=null,be=new Ze(0),we=0,Ye=t.width,je=t.height,Ue=1,Z=null,fe=null,ie=new St(0,0,Ye,je),Ie=new St(0,0,Ye,je),Fe=!1,Pe=new Kr,pt=!1,We=!1,Qe=new ft,ht=new C,Ve=new St,At={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},mt=!1;function Yt(){return N===null?Ue:1}let D=i;function Ct(b,L){return t.getContext(b,L)}try{let b={alpha:!0,depth:r,stencil:s,antialias:o,premultipliedAlpha:c,preserveDrawingBuffer:h,powerPreference:u,failIfMajorPerformanceCaveat:d};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"184"}`),t.addEventListener("webglcontextlost",K,!1),t.addEventListener("webglcontextrestored",Te,!1),t.addEventListener("webglcontextcreationerror",Ne,!1),D===null){let L="webgl2";if(D=Ct(L,b),D===null)throw Ct(L)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(b){throw Re("WebGLRenderer: "+b.message),b}let Xe,lt,oe,xt,T,y,O,Y,J,ee,ae,W,$,pe,xe,re,te,De,ke,Ke,P,ne,q;function ge(){Xe=new Og(D),Xe.init(),P=new b_(D,Xe),lt=new Cg(D,Xe,e,P),oe=new v_(D,Xe),lt.reversedDepthBuffer&&l&&oe.buffers.depth.setReversed(!0),xt=new Bg(D),T=new a_,y=new S_(D,Xe,oe,T,lt,P,xt),O=new Ng(F),Y=new Gf(D),ne=new wg(D,Y),J=new Ug(D,Y,xt,ne),ee=new zg(D,J,Y,ne,xt),De=new Hg(D,lt,y),xe=new Rg(T),ae=new s_(F,O,Xe,lt,ne,xe),W=new w_(F,T),$=new l_,pe=new p_(Xe),te=new Eg(F,O,oe,ee,g,c),re=new x_(F,ee,lt),q=new A_(D,xt,lt,oe),ke=new Ag(D,Xe,xt),Ke=new kg(D,Xe,xt),xt.programs=ae.programs,F.capabilities=lt,F.extensions=Xe,F.properties=T,F.renderLists=$,F.shadowMap=re,F.state=oe,F.info=xt}ge(),v!==rn&&(w=new Gg(v,t.width,t.height,r,s));let se=new Rc(F,D);this.xr=se,this.getContext=function(){return D},this.getContextAttributes=function(){return D.getContextAttributes()},this.forceContextLoss=function(){let b=Xe.get("WEBGL_lose_context");b&&b.loseContext()},this.forceContextRestore=function(){let b=Xe.get("WEBGL_lose_context");b&&b.restoreContext()},this.getPixelRatio=function(){return Ue},this.setPixelRatio=function(b){b!==void 0&&(Ue=b,this.setSize(Ye,je,!1))},this.getSize=function(b){return b.set(Ye,je)},this.setSize=function(b,L,z=!0){if(se.isPresenting){Ce("WebGLRenderer: Can't change size while VR device is presenting.");return}Ye=b,je=L,t.width=Math.floor(b*Ue),t.height=Math.floor(L*Ue),z===!0&&(t.style.width=b+"px",t.style.height=L+"px"),w!==null&&w.setSize(t.width,t.height),this.setViewport(0,0,b,L)},this.getDrawingBufferSize=function(b){return b.set(Ye*Ue,je*Ue).floor()},this.setDrawingBufferSize=function(b,L,z){Ye=b,je=L,Ue=z,t.width=Math.floor(b*z),t.height=Math.floor(L*z),this.setViewport(0,0,b,L)},this.setEffects=function(b){if(v===rn){Re("THREE.WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(b){for(let L=0;L<b.length;L++)if(b[L].isOutputPass===!0){Ce("THREE.WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}w.setEffects(b||[])},this.getCurrentViewport=function(b){return b.copy(j)},this.getViewport=function(b){return b.copy(ie)},this.setViewport=function(b,L,z,k){b.isVector4?ie.set(b.x,b.y,b.z,b.w):ie.set(b,L,z,k),oe.viewport(j.copy(ie).multiplyScalar(Ue).round())},this.getScissor=function(b){return b.copy(Ie)},this.setScissor=function(b,L,z,k){b.isVector4?Ie.set(b.x,b.y,b.z,b.w):Ie.set(b,L,z,k),oe.scissor(Q.copy(Ie).multiplyScalar(Ue).round())},this.getScissorTest=function(){return Fe},this.setScissorTest=function(b){oe.setScissorTest(Fe=b)},this.setOpaqueSort=function(b){Z=b},this.setTransparentSort=function(b){fe=b},this.getClearColor=function(b){return b.copy(te.getClearColor())},this.setClearColor=function(){te.setClearColor(...arguments)},this.getClearAlpha=function(){return te.getClearAlpha()},this.setClearAlpha=function(){te.setClearAlpha(...arguments)},this.clear=function(b=!0,L=!0,z=!0){let k=0;if(b){let B=!1;if(N!==null){let de=N.texture.format;B=p.has(de)}if(B){let de=N.texture.type,ve=m.has(de),he=te.getClearColor(),Me=te.getClearAlpha(),Ee=he.r,Oe=he.g,ze=he.b;ve?(_[0]=Ee,_[1]=Oe,_[2]=ze,_[3]=Me,D.clearBufferuiv(D.COLOR,0,_)):(x[0]=Ee,x[1]=Oe,x[2]=ze,x[3]=Me,D.clearBufferiv(D.COLOR,0,x))}else k|=D.COLOR_BUFFER_BIT}L&&(k|=D.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),z&&(k|=D.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),k!==0&&D.clear(k)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(b){b.setRenderer(this),U=b},this.dispose=function(){t.removeEventListener("webglcontextlost",K,!1),t.removeEventListener("webglcontextrestored",Te,!1),t.removeEventListener("webglcontextcreationerror",Ne,!1),te.dispose(),$.dispose(),pe.dispose(),T.dispose(),O.dispose(),ee.dispose(),ne.dispose(),q.dispose(),ae.dispose(),se.dispose(),se.removeEventListener("sessionstart",Zc),se.removeEventListener("sessionend",Kc),Ei.stop()};function K(b){b.preventDefault(),Xr("WebGLRenderer: Context Lost."),R=!0}function Te(){Xr("WebGLRenderer: Context Restored."),R=!1;let b=xt.autoReset,L=re.enabled,z=re.autoUpdate,k=re.needsUpdate,B=re.type;ge(),xt.autoReset=b,re.enabled=L,re.autoUpdate=z,re.needsUpdate=k,re.type=B}function Ne(b){Re("WebGLRenderer: A WebGL context could not be created. Reason: ",b.statusMessage)}function Mt(b){let L=b.target;L.removeEventListener("dispose",Mt),et(L)}function et(b){Nn(b),T.remove(b)}function Nn(b){let L=T.get(b).programs;L!==void 0&&(L.forEach(function(z){ae.releaseProgram(z)}),b.isShaderMaterial&&ae.releaseShaderCache(b))}this.renderBufferDirect=function(b,L,z,k,B,de){L===null&&(L=At);let ve=B.isMesh&&B.matrixWorld.determinant()<0,he=Pd(b,L,z,k,B);oe.setMaterial(k,ve);let Me=z.index,Ee=1;if(k.wireframe===!0){if(Me=J.getWireframeAttribute(z),Me===void 0)return;Ee=2}let Oe=z.drawRange,ze=z.attributes.position,Ae=Oe.start*Ee,tt=(Oe.start+Oe.count)*Ee;de!==null&&(Ae=Math.max(Ae,de.start*Ee),tt=Math.min(tt,(de.start+de.count)*Ee)),Me!==null?(Ae=Math.max(Ae,0),tt=Math.min(tt,Me.count)):ze!=null&&(Ae=Math.max(Ae,0),tt=Math.min(tt,ze.count));let Tt=tt-Ae;if(Tt<0||Tt===1/0)return;ne.setup(B,k,he,z,Me);let vt,rt=ke;if(Me!==null&&(vt=Y.get(Me),rt=Ke,rt.setIndex(vt)),B.isMesh)k.wireframe===!0?(oe.setLineWidth(k.wireframeLinewidth*Yt()),rt.setMode(D.LINES)):rt.setMode(D.TRIANGLES);else if(B.isLine){let Ot=k.linewidth;Ot===void 0&&(Ot=1),oe.setLineWidth(Ot*Yt()),B.isLineSegments?rt.setMode(D.LINES):B.isLineLoop?rt.setMode(D.LINE_LOOP):rt.setMode(D.LINE_STRIP)}else B.isPoints?rt.setMode(D.POINTS):B.isSprite&&rt.setMode(D.TRIANGLES);if(B.isBatchedMesh)if(Xe.get("WEBGL_multi_draw"))rt.renderMultiDraw(B._multiDrawStarts,B._multiDrawCounts,B._multiDrawCount);else{let Ot=B._multiDrawStarts,_e=B._multiDrawCounts,$t=B._multiDrawCount,$e=Me?Y.get(Me).bytesPerElement:1,an=T.get(k).currentProgram.getUniforms();for(let bn=0;bn<$t;bn++)an.setValue(D,"_gl_DrawID",bn),rt.render(Ot[bn]/$e,_e[bn])}else if(B.isInstancedMesh)rt.renderInstances(Ae,Tt,B.count);else if(z.isInstancedBufferGeometry){let Ot=z._maxInstanceCount!==void 0?z._maxInstanceCount:1/0,_e=Math.min(z.instanceCount,Ot);rt.renderInstances(Ae,Tt,_e)}else rt.render(Ae,Tt)};function Sn(b,L,z){b.transparent===!0&&b.side===Bt&&b.forceSinglePass===!1?(b.side=Vt,b.needsUpdate=!0,Fs(b,L,z),b.side=Wn,b.needsUpdate=!0,Fs(b,L,z),b.side=Bt):Fs(b,L,z)}this.compile=function(b,L,z=null){z===null&&(z=b),E=pe.get(z),E.init(L),S.push(E),z.traverseVisible(function(B){B.isLight&&B.layers.test(L.layers)&&(E.pushLight(B),B.castShadow&&E.pushShadow(B))}),b!==z&&b.traverseVisible(function(B){B.isLight&&B.layers.test(L.layers)&&(E.pushLight(B),B.castShadow&&E.pushShadow(B))}),E.setupLights();let k=new Set;return b.traverse(function(B){if(!(B.isMesh||B.isPoints||B.isLine||B.isSprite))return;let de=B.material;if(de)if(Array.isArray(de))for(let ve=0;ve<de.length;ve++){let he=de[ve];Sn(he,z,B),k.add(he)}else Sn(de,z,B),k.add(de)}),E=S.pop(),k},this.compileAsync=function(b,L,z=null){let k=this.compile(b,L,z);return new Promise(B=>{function de(){if(k.forEach(function(ve){T.get(ve).currentProgram.isReady()&&k.delete(ve)}),k.size===0){B(b);return}setTimeout(de,10)}Xe.get("KHR_parallel_shader_compile")!==null?de():setTimeout(de,10)})};let el=null;function Rd(b){el&&el(b)}function Zc(){Ei.stop()}function Kc(){Ei.start()}let Ei=new $u;Ei.setAnimationLoop(Rd),typeof self<"u"&&Ei.setContext(self),this.setAnimationLoop=function(b){el=b,se.setAnimationLoop(b),b===null?Ei.stop():Ei.start()},se.addEventListener("sessionstart",Zc),se.addEventListener("sessionend",Kc),this.render=function(b,L){if(L!==void 0&&L.isCamera!==!0){Re("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(R===!0)return;U!==null&&U.renderStart(b,L);let z=se.enabled===!0&&se.isPresenting===!0,k=w!==null&&(N===null||z)&&w.begin(F,N);if(b.matrixWorldAutoUpdate===!0&&b.updateMatrixWorld(),L.parent===null&&L.matrixWorldAutoUpdate===!0&&L.updateMatrixWorld(),se.enabled===!0&&se.isPresenting===!0&&(w===null||w.isCompositing()===!1)&&(se.cameraAutoUpdate===!0&&se.updateCamera(L),L=se.getCamera()),b.isScene===!0&&b.onBeforeRender(F,b,L,N),E=pe.get(b,S.length),E.init(L),E.state.textureUnits=y.getTextureUnits(),S.push(E),Qe.multiplyMatrices(L.projectionMatrix,L.matrixWorldInverse),Pe.setFromProjectionMatrix(Qe,dn,L.reversedDepth),We=this.localClippingEnabled,pt=xe.init(this.clippingPlanes,We),A=$.get(b,I.length),A.init(),I.push(A),se.enabled===!0&&se.isPresenting===!0){let ve=F.xr.getDepthSensingMesh();ve!==null&&tl(ve,L,-1/0,F.sortObjects)}tl(b,L,0,F.sortObjects),A.finish(),F.sortObjects===!0&&A.sort(Z,fe),mt=se.enabled===!1||se.isPresenting===!1||se.hasDepthSensing()===!1,mt&&te.addToRenderList(A,b),this.info.render.frame++,pt===!0&&xe.beginShadows();let B=E.state.shadowsArray;if(re.render(B,b,L),pt===!0&&xe.endShadows(),this.info.autoReset===!0&&this.info.reset(),(k&&w.hasRenderPass())===!1){let ve=A.opaque,he=A.transmissive;if(E.setupLights(),L.isArrayCamera){let Me=L.cameras;if(he.length>0)for(let Ee=0,Oe=Me.length;Ee<Oe;Ee++){let ze=Me[Ee];jc(ve,he,b,ze)}mt&&te.render(b);for(let Ee=0,Oe=Me.length;Ee<Oe;Ee++){let ze=Me[Ee];Jc(A,b,ze,ze.viewport)}}else he.length>0&&jc(ve,he,b,L),mt&&te.render(b),Jc(A,b,L)}N!==null&&X===0&&(y.updateMultisampleRenderTarget(N),y.updateRenderTargetMipmap(N)),k&&w.end(F),b.isScene===!0&&b.onAfterRender(F,b,L),ne.resetDefaultState(),H=-1,V=null,S.pop(),S.length>0?(E=S[S.length-1],y.setTextureUnits(E.state.textureUnits),pt===!0&&xe.setGlobalState(F.clippingPlanes,E.state.camera)):E=null,I.pop(),I.length>0?A=I[I.length-1]:A=null,U!==null&&U.renderEnd()};function tl(b,L,z,k){if(b.visible===!1)return;if(b.layers.test(L.layers)){if(b.isGroup)z=b.renderOrder;else if(b.isLOD)b.autoUpdate===!0&&b.update(L);else if(b.isLightProbeGrid)E.pushLightProbeGrid(b);else if(b.isLight)E.pushLight(b),b.castShadow&&E.pushShadow(b);else if(b.isSprite){if(!b.frustumCulled||Pe.intersectsSprite(b)){k&&Ve.setFromMatrixPosition(b.matrixWorld).applyMatrix4(Qe);let ve=ee.update(b),he=b.material;he.visible&&A.push(b,ve,he,z,Ve.z,null)}}else if((b.isMesh||b.isLine||b.isPoints)&&(!b.frustumCulled||Pe.intersectsObject(b))){let ve=ee.update(b),he=b.material;if(k&&(b.boundingSphere!==void 0?(b.boundingSphere===null&&b.computeBoundingSphere(),Ve.copy(b.boundingSphere.center)):(ve.boundingSphere===null&&ve.computeBoundingSphere(),Ve.copy(ve.boundingSphere.center)),Ve.applyMatrix4(b.matrixWorld).applyMatrix4(Qe)),Array.isArray(he)){let Me=ve.groups;for(let Ee=0,Oe=Me.length;Ee<Oe;Ee++){let ze=Me[Ee],Ae=he[ze.materialIndex];Ae&&Ae.visible&&A.push(b,ve,Ae,z,Ve.z,ze)}}else he.visible&&A.push(b,ve,he,z,Ve.z,null)}}let de=b.children;for(let ve=0,he=de.length;ve<he;ve++)tl(de[ve],L,z,k)}function Jc(b,L,z,k){let{opaque:B,transmissive:de,transparent:ve}=b;E.setupLightsView(z),pt===!0&&xe.setGlobalState(F.clippingPlanes,z),k&&oe.viewport(j.copy(k)),B.length>0&&Ls(B,L,z),de.length>0&&Ls(de,L,z),ve.length>0&&Ls(ve,L,z),oe.buffers.depth.setTest(!0),oe.buffers.depth.setMask(!0),oe.buffers.color.setMask(!0),oe.setPolygonOffset(!1)}function jc(b,L,z,k){if((z.isScene===!0?z.overrideMaterial:null)!==null)return;if(E.state.transmissionRenderTarget[k.id]===void 0){let Ae=Xe.has("EXT_color_buffer_half_float")||Xe.has("EXT_color_buffer_float");E.state.transmissionRenderTarget[k.id]=new jt(1,1,{generateMipmaps:!0,type:Ae?Pn:rn,minFilter:gn,samples:Math.max(4,lt.samples),stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:qe.workingColorSpace})}let de=E.state.transmissionRenderTarget[k.id],ve=k.viewport||j;de.setSize(ve.z*F.transmissionResolutionScale,ve.w*F.transmissionResolutionScale);let he=F.getRenderTarget(),Me=F.getActiveCubeFace(),Ee=F.getActiveMipmapLevel();F.setRenderTarget(de),F.getClearColor(be),we=F.getClearAlpha(),we<1&&F.setClearColor(16777215,.5),F.clear(),mt&&te.render(z);let Oe=F.toneMapping;F.toneMapping=mn;let ze=k.viewport;if(k.viewport!==void 0&&(k.viewport=void 0),E.setupLightsView(k),pt===!0&&xe.setGlobalState(F.clippingPlanes,k),Ls(b,z,k),y.updateMultisampleRenderTarget(de),y.updateRenderTargetMipmap(de),Xe.has("WEBGL_multisampled_render_to_texture")===!1){let Ae=!1;for(let tt=0,Tt=L.length;tt<Tt;tt++){let vt=L[tt],{object:rt,geometry:Ot,material:_e,group:$t}=vt;if(_e.side===Bt&&rt.layers.test(k.layers)){let $e=_e.side;_e.side=Vt,_e.needsUpdate=!0,Qc(rt,z,k,Ot,_e,$t),_e.side=$e,_e.needsUpdate=!0,Ae=!0}}Ae===!0&&(y.updateMultisampleRenderTarget(de),y.updateRenderTargetMipmap(de))}F.setRenderTarget(he,Me,Ee),F.setClearColor(be,we),ze!==void 0&&(k.viewport=ze),F.toneMapping=Oe}function Ls(b,L,z){let k=L.isScene===!0?L.overrideMaterial:null;for(let B=0,de=b.length;B<de;B++){let ve=b[B],{object:he,geometry:Me,group:Ee}=ve,Oe=ve.material;Oe.allowOverride===!0&&k!==null&&(Oe=k),he.layers.test(z.layers)&&Qc(he,L,z,Me,Oe,Ee)}}function Qc(b,L,z,k,B,de){b.onBeforeRender(F,L,z,k,B,de),b.modelViewMatrix.multiplyMatrices(z.matrixWorldInverse,b.matrixWorld),b.normalMatrix.getNormalMatrix(b.modelViewMatrix),B.onBeforeRender(F,L,z,k,b,de),B.transparent===!0&&B.side===Bt&&B.forceSinglePass===!1?(B.side=Vt,B.needsUpdate=!0,F.renderBufferDirect(z,L,k,B,b,de),B.side=Wn,B.needsUpdate=!0,F.renderBufferDirect(z,L,k,B,b,de),B.side=Bt):F.renderBufferDirect(z,L,k,B,b,de),b.onAfterRender(F,L,z,k,B,de)}function Fs(b,L,z){L.isScene!==!0&&(L=At);let k=T.get(b),B=E.state.lights,de=E.state.shadowsArray,ve=B.state.version,he=ae.getParameters(b,B.state,de,L,z,E.state.lightProbeGridArray),Me=ae.getProgramCacheKey(he),Ee=k.programs;k.environment=b.isMeshStandardMaterial||b.isMeshLambertMaterial||b.isMeshPhongMaterial?L.environment:null,k.fog=L.fog;let Oe=b.isMeshStandardMaterial||b.isMeshLambertMaterial&&!b.envMap||b.isMeshPhongMaterial&&!b.envMap;k.envMap=O.get(b.envMap||k.environment,Oe),k.envMapRotation=k.environment!==null&&b.envMap===null?L.environmentRotation:b.envMapRotation,Ee===void 0&&(b.addEventListener("dispose",Mt),Ee=new Map,k.programs=Ee);let ze=Ee.get(Me);if(ze!==void 0){if(k.currentProgram===ze&&k.lightsStateVersion===ve)return th(b,he),ze}else he.uniforms=ae.getUniforms(b),U!==null&&b.isNodeMaterial&&U.build(b,z,he),b.onBeforeCompile(he,F),ze=ae.acquireProgram(he,Me),Ee.set(Me,ze),k.uniforms=he.uniforms;let Ae=k.uniforms;return(!b.isShaderMaterial&&!b.isRawShaderMaterial||b.clipping===!0)&&(Ae.clippingPlanes=xe.uniform),th(b,he),k.needsLights=Ld(b),k.lightsStateVersion=ve,k.needsLights&&(Ae.ambientLightColor.value=B.state.ambient,Ae.lightProbe.value=B.state.probe,Ae.directionalLights.value=B.state.directional,Ae.directionalLightShadows.value=B.state.directionalShadow,Ae.spotLights.value=B.state.spot,Ae.spotLightShadows.value=B.state.spotShadow,Ae.rectAreaLights.value=B.state.rectArea,Ae.ltc_1.value=B.state.rectAreaLTC1,Ae.ltc_2.value=B.state.rectAreaLTC2,Ae.pointLights.value=B.state.point,Ae.pointLightShadows.value=B.state.pointShadow,Ae.hemisphereLights.value=B.state.hemi,Ae.directionalShadowMatrix.value=B.state.directionalShadowMatrix,Ae.spotLightMatrix.value=B.state.spotLightMatrix,Ae.spotLightMap.value=B.state.spotLightMap,Ae.pointShadowMatrix.value=B.state.pointShadowMatrix),k.lightProbeGrid=E.state.lightProbeGridArray.length>0,k.currentProgram=ze,k.uniformsList=null,ze}function eh(b){if(b.uniformsList===null){let L=b.currentProgram.getUniforms();b.uniformsList=Cr.seqWithValue(L.seq,b.uniforms)}return b.uniformsList}function th(b,L){let z=T.get(b);z.outputColorSpace=L.outputColorSpace,z.batching=L.batching,z.batchingColor=L.batchingColor,z.instancing=L.instancing,z.instancingColor=L.instancingColor,z.instancingMorph=L.instancingMorph,z.skinning=L.skinning,z.morphTargets=L.morphTargets,z.morphNormals=L.morphNormals,z.morphColors=L.morphColors,z.morphTargetsCount=L.morphTargetsCount,z.numClippingPlanes=L.numClippingPlanes,z.numIntersection=L.numClipIntersection,z.vertexAlphas=L.vertexAlphas,z.vertexTangents=L.vertexTangents,z.toneMapping=L.toneMapping}function Id(b,L){if(b.length===0)return null;if(b.length===1)return b[0].texture!==null?b[0]:null;M.setFromMatrixPosition(L.matrixWorld);for(let z=0,k=b.length;z<k;z++){let B=b[z];if(B.texture!==null&&B.boundingBox.containsPoint(M))return B}return null}function Pd(b,L,z,k,B){L.isScene!==!0&&(L=At),y.resetTextureUnits();let de=L.fog,ve=k.isMeshStandardMaterial||k.isMeshLambertMaterial||k.isMeshPhongMaterial?L.environment:null,he=N===null?F.outputColorSpace:N.isXRRenderTarget===!0?N.texture.colorSpace:qe.workingColorSpace,Me=k.isMeshStandardMaterial||k.isMeshLambertMaterial&&!k.envMap||k.isMeshPhongMaterial&&!k.envMap,Ee=O.get(k.envMap||ve,Me),Oe=k.vertexColors===!0&&!!z.attributes.color&&z.attributes.color.itemSize===4,ze=!!z.attributes.tangent&&(!!k.normalMap||k.anisotropy>0),Ae=!!z.morphAttributes.position,tt=!!z.morphAttributes.normal,Tt=!!z.morphAttributes.color,vt=mn;k.toneMapped&&(N===null||N.isXRRenderTarget===!0)&&(vt=F.toneMapping);let rt=z.morphAttributes.position||z.morphAttributes.normal||z.morphAttributes.color,Ot=rt!==void 0?rt.length:0,_e=T.get(k),$t=E.state.lights;if(pt===!0&&(We===!0||b!==V)){let ct=b===V&&k.id===H;xe.setState(k,b,ct)}let $e=!1;k.version===_e.__version?(_e.needsLights&&_e.lightsStateVersion!==$t.state.version||_e.outputColorSpace!==he||B.isBatchedMesh&&_e.batching===!1||!B.isBatchedMesh&&_e.batching===!0||B.isBatchedMesh&&_e.batchingColor===!0&&B.colorTexture===null||B.isBatchedMesh&&_e.batchingColor===!1&&B.colorTexture!==null||B.isInstancedMesh&&_e.instancing===!1||!B.isInstancedMesh&&_e.instancing===!0||B.isSkinnedMesh&&_e.skinning===!1||!B.isSkinnedMesh&&_e.skinning===!0||B.isInstancedMesh&&_e.instancingColor===!0&&B.instanceColor===null||B.isInstancedMesh&&_e.instancingColor===!1&&B.instanceColor!==null||B.isInstancedMesh&&_e.instancingMorph===!0&&B.morphTexture===null||B.isInstancedMesh&&_e.instancingMorph===!1&&B.morphTexture!==null||_e.envMap!==Ee||k.fog===!0&&_e.fog!==de||_e.numClippingPlanes!==void 0&&(_e.numClippingPlanes!==xe.numPlanes||_e.numIntersection!==xe.numIntersection)||_e.vertexAlphas!==Oe||_e.vertexTangents!==ze||_e.morphTargets!==Ae||_e.morphNormals!==tt||_e.morphColors!==Tt||_e.toneMapping!==vt||_e.morphTargetsCount!==Ot||!!_e.lightProbeGrid!=E.state.lightProbeGridArray.length>0)&&($e=!0):($e=!0,_e.__version=k.version);let an=_e.currentProgram;$e===!0&&(an=Fs(k,L,B),U&&k.isNodeMaterial&&U.onUpdateProgram(k,an,_e));let bn=!1,Qn=!1,Vi=!1,st=an.getUniforms(),Et=_e.uniforms;if(oe.useProgram(an.program)&&(bn=!0,Qn=!0,Vi=!0),k.id!==H&&(H=k.id,Qn=!0),_e.needsLights){let ct=Id(E.state.lightProbeGridArray,B);_e.lightProbeGrid!==ct&&(_e.lightProbeGrid=ct,Qn=!0)}if(bn||V!==b){oe.buffers.depth.getReversed()&&b.reversedDepth!==!0&&(b._reversedDepth=!0,b.updateProjectionMatrix()),st.setValue(D,"projectionMatrix",b.projectionMatrix),st.setValue(D,"viewMatrix",b.matrixWorldInverse);let ti=st.map.cameraPosition;ti!==void 0&&ti.setValue(D,ht.setFromMatrixPosition(b.matrixWorld)),lt.logarithmicDepthBuffer&&st.setValue(D,"logDepthBufFC",2/(Math.log(b.far+1)/Math.LN2)),(k.isMeshPhongMaterial||k.isMeshToonMaterial||k.isMeshLambertMaterial||k.isMeshBasicMaterial||k.isMeshStandardMaterial||k.isShaderMaterial)&&st.setValue(D,"isOrthographic",b.isOrthographicCamera===!0),V!==b&&(V=b,Qn=!0,Vi=!0)}if(_e.needsLights&&($t.state.directionalShadowMap.length>0&&st.setValue(D,"directionalShadowMap",$t.state.directionalShadowMap,y),$t.state.spotShadowMap.length>0&&st.setValue(D,"spotShadowMap",$t.state.spotShadowMap,y),$t.state.pointShadowMap.length>0&&st.setValue(D,"pointShadowMap",$t.state.pointShadowMap,y)),B.isSkinnedMesh){st.setOptional(D,B,"bindMatrix"),st.setOptional(D,B,"bindMatrixInverse");let ct=B.skeleton;ct&&(ct.boneTexture===null&&ct.computeBoneTexture(),st.setValue(D,"boneTexture",ct.boneTexture,y))}B.isBatchedMesh&&(st.setOptional(D,B,"batchingTexture"),st.setValue(D,"batchingTexture",B._matricesTexture,y),st.setOptional(D,B,"batchingIdTexture"),st.setValue(D,"batchingIdTexture",B._indirectTexture,y),st.setOptional(D,B,"batchingColorTexture"),B._colorsTexture!==null&&st.setValue(D,"batchingColorTexture",B._colorsTexture,y));let ei=z.morphAttributes;if((ei.position!==void 0||ei.normal!==void 0||ei.color!==void 0)&&De.update(B,z,an),(Qn||_e.receiveShadow!==B.receiveShadow)&&(_e.receiveShadow=B.receiveShadow,st.setValue(D,"receiveShadow",B.receiveShadow)),(k.isMeshStandardMaterial||k.isMeshLambertMaterial||k.isMeshPhongMaterial)&&k.envMap===null&&L.environment!==null&&(Et.envMapIntensity.value=L.environmentIntensity),Et.dfgLUT!==void 0&&(Et.dfgLUT.value=R_()),Qn){if(st.setValue(D,"toneMappingExposure",F.toneMappingExposure),_e.needsLights&&Dd(Et,Vi),de&&k.fog===!0&&W.refreshFogUniforms(Et,de),W.refreshMaterialUniforms(Et,k,Ue,je,E.state.transmissionRenderTarget[b.id]),_e.needsLights&&_e.lightProbeGrid){let ct=_e.lightProbeGrid;Et.probesSH.value=ct.texture,Et.probesMin.value.copy(ct.boundingBox.min),Et.probesMax.value.copy(ct.boundingBox.max),Et.probesResolution.value.copy(ct.resolution)}Cr.upload(D,eh(_e),Et,y)}if(k.isShaderMaterial&&k.uniformsNeedUpdate===!0&&(Cr.upload(D,eh(_e),Et,y),k.uniformsNeedUpdate=!1),k.isSpriteMaterial&&st.setValue(D,"center",B.center),st.setValue(D,"modelViewMatrix",B.modelViewMatrix),st.setValue(D,"normalMatrix",B.normalMatrix),st.setValue(D,"modelMatrix",B.matrixWorld),k.uniformsGroups!==void 0){let ct=k.uniformsGroups;for(let ti=0,Gi=ct.length;ti<Gi;ti++){let nh=ct[ti];q.update(nh,an),q.bind(nh,an)}}return an}function Dd(b,L){b.ambientLightColor.needsUpdate=L,b.lightProbe.needsUpdate=L,b.directionalLights.needsUpdate=L,b.directionalLightShadows.needsUpdate=L,b.pointLights.needsUpdate=L,b.pointLightShadows.needsUpdate=L,b.spotLights.needsUpdate=L,b.spotLightShadows.needsUpdate=L,b.rectAreaLights.needsUpdate=L,b.hemisphereLights.needsUpdate=L}function Ld(b){return b.isMeshLambertMaterial||b.isMeshToonMaterial||b.isMeshPhongMaterial||b.isMeshStandardMaterial||b.isShadowMaterial||b.isShaderMaterial&&b.lights===!0}this.getActiveCubeFace=function(){return G},this.getActiveMipmapLevel=function(){return X},this.getRenderTarget=function(){return N},this.setRenderTargetTextures=function(b,L,z){let k=T.get(b);k.__autoAllocateDepthBuffer=b.resolveDepthBuffer===!1,k.__autoAllocateDepthBuffer===!1&&(k.__useRenderToTexture=!1),T.get(b.texture).__webglTexture=L,T.get(b.depthTexture).__webglTexture=k.__autoAllocateDepthBuffer?void 0:z,k.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(b,L){let z=T.get(b);z.__webglFramebuffer=L,z.__useDefaultFramebuffer=L===void 0};let Fd=D.createFramebuffer();this.setRenderTarget=function(b,L=0,z=0){N=b,G=L,X=z;let k=null,B=!1,de=!1;if(b){let he=T.get(b);if(he.__useDefaultFramebuffer!==void 0){oe.bindFramebuffer(D.FRAMEBUFFER,he.__webglFramebuffer),j.copy(b.viewport),Q.copy(b.scissor),ce=b.scissorTest,oe.viewport(j),oe.scissor(Q),oe.setScissorTest(ce),H=-1;return}else if(he.__webglFramebuffer===void 0)y.setupRenderTarget(b);else if(he.__hasExternalTextures)y.rebindTextures(b,T.get(b.texture).__webglTexture,T.get(b.depthTexture).__webglTexture);else if(b.depthBuffer){let Oe=b.depthTexture;if(he.__boundDepthTexture!==Oe){if(Oe!==null&&T.has(Oe)&&(b.width!==Oe.image.width||b.height!==Oe.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");y.setupDepthRenderbuffer(b)}}let Me=b.texture;(Me.isData3DTexture||Me.isDataArrayTexture||Me.isCompressedArrayTexture)&&(de=!0);let Ee=T.get(b).__webglFramebuffer;b.isWebGLCubeRenderTarget?(Array.isArray(Ee[L])?k=Ee[L][z]:k=Ee[L],B=!0):b.samples>0&&y.useMultisampledRTT(b)===!1?k=T.get(b).__webglMultisampledFramebuffer:Array.isArray(Ee)?k=Ee[z]:k=Ee,j.copy(b.viewport),Q.copy(b.scissor),ce=b.scissorTest}else j.copy(ie).multiplyScalar(Ue).floor(),Q.copy(Ie).multiplyScalar(Ue).floor(),ce=Fe;if(z!==0&&(k=Fd),oe.bindFramebuffer(D.FRAMEBUFFER,k)&&oe.drawBuffers(b,k),oe.viewport(j),oe.scissor(Q),oe.setScissorTest(ce),B){let he=T.get(b.texture);D.framebufferTexture2D(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_CUBE_MAP_POSITIVE_X+L,he.__webglTexture,z)}else if(de){let he=L;for(let Me=0;Me<b.textures.length;Me++){let Ee=T.get(b.textures[Me]);D.framebufferTextureLayer(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0+Me,Ee.__webglTexture,z,he)}}else if(b!==null&&z!==0){let he=T.get(b.texture);D.framebufferTexture2D(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,he.__webglTexture,z)}H=-1},this.readRenderTargetPixels=function(b,L,z,k,B,de,ve,he=0){if(!(b&&b.isWebGLRenderTarget)){Re("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Me=T.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&ve!==void 0&&(Me=Me[ve]),Me){oe.bindFramebuffer(D.FRAMEBUFFER,Me);try{let Ee=b.textures[he],Oe=Ee.format,ze=Ee.type;if(b.textures.length>1&&D.readBuffer(D.COLOR_ATTACHMENT0+he),!lt.textureFormatReadable(Oe)){Re("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!lt.textureTypeReadable(ze)){Re("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}L>=0&&L<=b.width-k&&z>=0&&z<=b.height-B&&D.readPixels(L,z,k,B,P.convert(Oe),P.convert(ze),de)}finally{let Ee=N!==null?T.get(N).__webglFramebuffer:null;oe.bindFramebuffer(D.FRAMEBUFFER,Ee)}}},this.readRenderTargetPixelsAsync=async function(b,L,z,k,B,de,ve,he=0){if(!(b&&b.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Me=T.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&ve!==void 0&&(Me=Me[ve]),Me)if(L>=0&&L<=b.width-k&&z>=0&&z<=b.height-B){oe.bindFramebuffer(D.FRAMEBUFFER,Me);let Ee=b.textures[he],Oe=Ee.format,ze=Ee.type;if(b.textures.length>1&&D.readBuffer(D.COLOR_ATTACHMENT0+he),!lt.textureFormatReadable(Oe))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!lt.textureTypeReadable(ze))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let Ae=D.createBuffer();D.bindBuffer(D.PIXEL_PACK_BUFFER,Ae),D.bufferData(D.PIXEL_PACK_BUFFER,de.byteLength,D.STREAM_READ),D.readPixels(L,z,k,B,P.convert(Oe),P.convert(ze),0);let tt=N!==null?T.get(N).__webglFramebuffer:null;oe.bindFramebuffer(D.FRAMEBUFFER,tt);let Tt=D.fenceSync(D.SYNC_GPU_COMMANDS_COMPLETE,0);return D.flush(),await gu(D,Tt,4),D.bindBuffer(D.PIXEL_PACK_BUFFER,Ae),D.getBufferSubData(D.PIXEL_PACK_BUFFER,0,de),D.deleteBuffer(Ae),D.deleteSync(Tt),de}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(b,L=null,z=0){let k=Math.pow(2,-z),B=Math.floor(b.image.width*k),de=Math.floor(b.image.height*k),ve=L!==null?L.x:0,he=L!==null?L.y:0;y.setTexture2D(b,0),D.copyTexSubImage2D(D.TEXTURE_2D,z,0,0,ve,he,B,de),oe.unbindTexture()};let Nd=D.createFramebuffer(),Od=D.createFramebuffer();this.copyTextureToTexture=function(b,L,z=null,k=null,B=0,de=0){let ve,he,Me,Ee,Oe,ze,Ae,tt,Tt,vt=b.isCompressedTexture?b.mipmaps[de]:b.image;if(z!==null)ve=z.max.x-z.min.x,he=z.max.y-z.min.y,Me=z.isBox3?z.max.z-z.min.z:1,Ee=z.min.x,Oe=z.min.y,ze=z.isBox3?z.min.z:0;else{let Et=Math.pow(2,-B);ve=Math.floor(vt.width*Et),he=Math.floor(vt.height*Et),b.isDataArrayTexture?Me=vt.depth:b.isData3DTexture?Me=Math.floor(vt.depth*Et):Me=1,Ee=0,Oe=0,ze=0}k!==null?(Ae=k.x,tt=k.y,Tt=k.z):(Ae=0,tt=0,Tt=0);let rt=P.convert(L.format),Ot=P.convert(L.type),_e;L.isData3DTexture?(y.setTexture3D(L,0),_e=D.TEXTURE_3D):L.isDataArrayTexture||L.isCompressedArrayTexture?(y.setTexture2DArray(L,0),_e=D.TEXTURE_2D_ARRAY):(y.setTexture2D(L,0),_e=D.TEXTURE_2D),oe.activeTexture(D.TEXTURE0),oe.pixelStorei(D.UNPACK_FLIP_Y_WEBGL,L.flipY),oe.pixelStorei(D.UNPACK_PREMULTIPLY_ALPHA_WEBGL,L.premultiplyAlpha),oe.pixelStorei(D.UNPACK_ALIGNMENT,L.unpackAlignment);let $t=oe.getParameter(D.UNPACK_ROW_LENGTH),$e=oe.getParameter(D.UNPACK_IMAGE_HEIGHT),an=oe.getParameter(D.UNPACK_SKIP_PIXELS),bn=oe.getParameter(D.UNPACK_SKIP_ROWS),Qn=oe.getParameter(D.UNPACK_SKIP_IMAGES);oe.pixelStorei(D.UNPACK_ROW_LENGTH,vt.width),oe.pixelStorei(D.UNPACK_IMAGE_HEIGHT,vt.height),oe.pixelStorei(D.UNPACK_SKIP_PIXELS,Ee),oe.pixelStorei(D.UNPACK_SKIP_ROWS,Oe),oe.pixelStorei(D.UNPACK_SKIP_IMAGES,ze);let Vi=b.isDataArrayTexture||b.isData3DTexture,st=L.isDataArrayTexture||L.isData3DTexture;if(b.isDepthTexture){let Et=T.get(b),ei=T.get(L),ct=T.get(Et.__renderTarget),ti=T.get(ei.__renderTarget);oe.bindFramebuffer(D.READ_FRAMEBUFFER,ct.__webglFramebuffer),oe.bindFramebuffer(D.DRAW_FRAMEBUFFER,ti.__webglFramebuffer);for(let Gi=0;Gi<Me;Gi++)Vi&&(D.framebufferTextureLayer(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,T.get(b).__webglTexture,B,ze+Gi),D.framebufferTextureLayer(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,T.get(L).__webglTexture,de,Tt+Gi)),D.blitFramebuffer(Ee,Oe,ve,he,Ae,tt,ve,he,D.DEPTH_BUFFER_BIT,D.NEAREST);oe.bindFramebuffer(D.READ_FRAMEBUFFER,null),oe.bindFramebuffer(D.DRAW_FRAMEBUFFER,null)}else if(B!==0||b.isRenderTargetTexture||T.has(b)){let Et=T.get(b),ei=T.get(L);oe.bindFramebuffer(D.READ_FRAMEBUFFER,Nd),oe.bindFramebuffer(D.DRAW_FRAMEBUFFER,Od);for(let ct=0;ct<Me;ct++)Vi?D.framebufferTextureLayer(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,Et.__webglTexture,B,ze+ct):D.framebufferTexture2D(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,Et.__webglTexture,B),st?D.framebufferTextureLayer(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,ei.__webglTexture,de,Tt+ct):D.framebufferTexture2D(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,ei.__webglTexture,de),B!==0?D.blitFramebuffer(Ee,Oe,ve,he,Ae,tt,ve,he,D.COLOR_BUFFER_BIT,D.NEAREST):st?D.copyTexSubImage3D(_e,de,Ae,tt,Tt+ct,Ee,Oe,ve,he):D.copyTexSubImage2D(_e,de,Ae,tt,Ee,Oe,ve,he);oe.bindFramebuffer(D.READ_FRAMEBUFFER,null),oe.bindFramebuffer(D.DRAW_FRAMEBUFFER,null)}else st?b.isDataTexture||b.isData3DTexture?D.texSubImage3D(_e,de,Ae,tt,Tt,ve,he,Me,rt,Ot,vt.data):L.isCompressedArrayTexture?D.compressedTexSubImage3D(_e,de,Ae,tt,Tt,ve,he,Me,rt,vt.data):D.texSubImage3D(_e,de,Ae,tt,Tt,ve,he,Me,rt,Ot,vt):b.isDataTexture?D.texSubImage2D(D.TEXTURE_2D,de,Ae,tt,ve,he,rt,Ot,vt.data):b.isCompressedTexture?D.compressedTexSubImage2D(D.TEXTURE_2D,de,Ae,tt,vt.width,vt.height,rt,vt.data):D.texSubImage2D(D.TEXTURE_2D,de,Ae,tt,ve,he,rt,Ot,vt);oe.pixelStorei(D.UNPACK_ROW_LENGTH,$t),oe.pixelStorei(D.UNPACK_IMAGE_HEIGHT,$e),oe.pixelStorei(D.UNPACK_SKIP_PIXELS,an),oe.pixelStorei(D.UNPACK_SKIP_ROWS,bn),oe.pixelStorei(D.UNPACK_SKIP_IMAGES,Qn),de===0&&L.generateMipmaps&&D.generateMipmap(_e),oe.unbindTexture()},this.initRenderTarget=function(b){T.get(b).__webglFramebuffer===void 0&&y.setupRenderTarget(b)},this.initTexture=function(b){b.isCubeTexture?y.setTextureCube(b,0):b.isData3DTexture?y.setTexture3D(b,0):b.isDataArrayTexture||b.isCompressedArrayTexture?y.setTexture2DArray(b,0):y.setTexture2D(b,0),oe.unbindTexture()},this.resetState=function(){G=0,X=0,N=null,oe.reset(),ne.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return dn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=qe._getDrawingBufferColorSpace(e),t.unpackColorSpace=qe._getUnpackColorSpace()}};var vi=16,Si=9,Fc=new WeakMap,zi=new WeakMap,ue=new Map;function me(n,e=0){let t=Number(n);return Number.isFinite(t)?t:e}function ot(n,e,t){return Math.max(e,Math.min(t,n))}function Is(n){return(me(n,.5)-.5)*vi}function Ps(n){return(.5-me(n,.5))*Si}function Ic(n={},e=-1.65){return new C(Is(n.x),Ps(n.y),e)}function pd(n={},e=0){return-1+(1-me(n.y,.5))*.6+me(n.z,0)*.025+e}function As(n=""){switch(String(n)){case"builder":return{fill:"#c97a3d",stroke:"#5a2f16",cue:"#ffe4a0",mark:"B",face:"#ffe5bd",accent:"#ffd34f",trim:"#7f3f1c"};case"worker":return{fill:"#5f8d8e",stroke:"#173f41",cue:"#d6f1ef",mark:"W",face:"#ffe0b4",accent:"#9fd3c8",trim:"#31585b"};case"hauler":return{fill:"#d7ae50",stroke:"#654716",cue:"#fff0bd",mark:"H",face:"#f5d29b",accent:"#8bb36d",trim:"#8a5d1f"};case"messenger":return{fill:"#c85c75",stroke:"#5a1c2b",cue:"#ffd5de",mark:"!",face:"#ffe1be",accent:"#78a9d6",trim:"#7e2c3c"};default:return{fill:"#7f9b66",stroke:"#254526",cue:"#daf0cf",mark:"C",face:"#ffe8c4",accent:"#a7c884",trim:"#446235"}}}function Yo(n=""){let e=String(n||""),t=0;for(let i=0;i<e.length;i+=1)t=(t<<5)-t+e.charCodeAt(i)|0;return Math.abs(t%628)/100}function P_(n,e,t,i="busy"){n.fillStyle="#2e1b0e",n.beginPath(),n.ellipse(e-17,t,5,7,0,0,Math.PI*2),n.ellipse(e+17,t,5,7,0,0,Math.PI*2),n.fill(),n.fillStyle="#fff8e8",n.beginPath(),n.arc(e-19,t-3,2,0,Math.PI*2),n.arc(e+15,t-3,2,0,Math.PI*2),n.fill(),n.strokeStyle="#2e1b0e",n.lineWidth=4,n.lineCap="round",n.beginPath(),i==="alert"?(n.moveTo(e-26,t-15),n.lineTo(e-12,t-19),n.moveTo(e+12,t-19),n.lineTo(e+27,t-14)):(n.moveTo(e-26,t-15),n.lineTo(e-12,t-13),n.moveTo(e+12,t-13),n.lineTo(e+27,t-15)),n.stroke(),n.beginPath(),i==="happy"?n.arc(e,t+13,14,.1,Math.PI-.1):(n.moveTo(e-8,t+15),n.quadraticCurveTo(e,t+20,e+10,t+14)),n.stroke()}function td(n,e,t,i){n.fillStyle="#ffe0b4",n.strokeStyle=i,n.lineWidth=4,n.beginPath(),n.arc(e,t,10,0,Math.PI*2),n.fill(),n.stroke()}function D_(n="worker"){let e=`character:${n}:v1`;if(ue.has(e))return ue.get(e);let t=As(n),i=document.createElement("canvas");i.width=224,i.height=256;let r=i.getContext("2d");r.clearRect(0,0,i.width,i.height),r.fillStyle="rgba(46, 27, 14, 0.22)",r.beginPath(),r.ellipse(112,222,62,17,0,0,Math.PI*2),r.fill(),n==="hauler"&&(r.fillStyle="#8bb36d",r.strokeStyle=t.stroke,r.lineWidth=7,r.beginPath(),r.roundRect(132,88,48,84,19),r.fill(),r.stroke(),r.fillStyle="#6d8c55",r.fillRect(141,102,29,12)),r.strokeStyle=t.stroke,r.lineWidth=10,r.lineCap="round",r.beginPath(),n==="messenger"?(r.moveTo(151,126),r.lineTo(181,84)):n==="builder"?(r.moveTo(151,128),r.lineTo(180,96)):(r.moveTo(151,130),r.lineTo(174,147)),r.stroke(),td(r,n==="messenger"?181:n==="builder"?180:174,n==="messenger"?84:n==="builder"?96:147,t.stroke),n==="builder"?(r.strokeStyle=t.stroke,r.lineWidth=7,r.beginPath(),r.moveTo(170,98),r.lineTo(193,75),r.moveTo(183,71),r.lineTo(204,92),r.stroke()):n==="worker"?(r.strokeStyle=t.stroke,r.lineWidth=6,r.beginPath(),r.moveTo(165,142),r.lineTo(190,126),r.moveTo(184,122),r.lineTo(198,137),r.stroke()):n==="messenger"&&(r.fillStyle=t.accent,r.strokeStyle=t.stroke,r.lineWidth=5,r.beginPath(),r.moveTo(182,72),r.lineTo(205,84),r.lineTo(182,97),r.closePath(),r.fill(),r.stroke()),r.strokeStyle=t.stroke,r.lineWidth=10,r.beginPath(),r.moveTo(73,128),r.lineTo(n==="hauler"?50:44,n==="hauler"?146:116),r.stroke(),td(r,n==="hauler"?50:44,n==="hauler"?146:116,t.stroke),r.fillStyle=t.fill,r.strokeStyle=t.stroke,r.lineWidth=10,r.beginPath(),r.roundRect(62,94,100,96,34),r.fill(),r.stroke(),n==="worker"?(r.fillStyle="#fff8e8",r.strokeStyle=t.stroke,r.lineWidth=5,r.beginPath(),r.roundRect(84,116,56,57,13),r.fill(),r.stroke(),r.strokeStyle=t.trim,r.lineWidth=4,r.beginPath(),r.moveTo(94,133),r.lineTo(130,133),r.moveTo(94,149),r.lineTo(122,149),r.stroke()):n==="hauler"?(r.strokeStyle=t.trim,r.lineWidth=7,r.beginPath(),r.moveTo(78,107),r.lineTo(146,178),r.moveTo(146,107),r.lineTo(78,178),r.stroke(),r.fillStyle="#c4883a",r.strokeStyle=t.stroke,r.lineWidth=6,r.beginPath(),r.roundRect(82,134,60,40,10),r.fill(),r.stroke()):n==="messenger"&&(r.fillStyle="#6b4631",r.strokeStyle=t.stroke,r.lineWidth=5,r.beginPath(),r.roundRect(118,142,42,38,9),r.fill(),r.stroke(),r.strokeStyle="#fff0bd",r.lineWidth=5,r.beginPath(),r.moveTo(79,110),r.lineTo(145,172),r.stroke()),r.strokeStyle=t.stroke,r.lineWidth=11,r.beginPath(),r.moveTo(91,184),r.lineTo(82,213),r.moveTo(132,184),r.lineTo(143,213),r.stroke(),r.fillStyle=t.trim,r.strokeStyle=t.stroke,r.lineWidth=5,r.beginPath(),r.roundRect(61,207,38,17,8),r.roundRect(128,207,38,17,8),r.fill(),r.stroke(),r.fillStyle=t.face,r.strokeStyle=t.stroke,r.lineWidth=8,r.beginPath(),r.arc(112,76,45,0,Math.PI*2),r.fill(),r.stroke(),n==="builder"?(r.fillStyle=t.accent,r.strokeStyle=t.stroke,r.lineWidth=7,r.beginPath(),r.arc(112,70,48,Math.PI,Math.PI*2),r.lineTo(160,75),r.lineTo(64,75),r.closePath(),r.fill(),r.stroke(),r.strokeStyle="#f4a92f",r.lineWidth=5,r.beginPath(),r.moveTo(112,27),r.lineTo(112,73),r.moveTo(91,38),r.lineTo(91,73),r.moveTo(133,38),r.lineTo(133,73),r.stroke()):(r.fillStyle=t.trim,r.beginPath(),r.arc(112,45,34,Math.PI,Math.PI*2),r.lineTo(146,63),r.quadraticCurveTo(112,53,78,63),r.closePath(),r.fill(),n==="messenger"&&(r.fillStyle=t.accent,r.beginPath(),r.arc(144,56,12,0,Math.PI*2),r.fill())),r.fillStyle="rgba(200, 92, 117, 0.28)",r.beginPath(),r.arc(82,88,7,0,Math.PI*2),r.arc(142,88,7,0,Math.PI*2),r.fill(),P_(r,112,82,n==="messenger"?"alert":n==="hauler"?"happy":"busy");let s=new at(i);return s.colorSpace=Be,s.minFilter=Se,s.magFilter=Se,ue.set(e,s),s}function md(n="",e="neutral"){let t=`text:${e}:${n}`;if(ue.has(t))return ue.get(t);let i=document.createElement("canvas");i.width=384,i.height=96;let r=i.getContext("2d"),s=e==="ready"?"#ffe4a0":e==="selected"?"#d6f1ef":"#fff8e8";r.clearRect(0,0,i.width,i.height),r.fillStyle=s,r.strokeStyle="rgba(46, 27, 14, 0.25)",r.lineWidth=6,r.beginPath(),r.roundRect(10,12,i.width-20,i.height-24,22),r.fill(),r.stroke(),r.fillStyle="#2e1b0e",r.font='700 30px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',r.textAlign="center",r.textBaseline="middle";let a=String(n||"").length>20?`${String(n).slice(0,17)}...`:String(n||"");r.fillText(a,i.width/2,i.height/2+2,i.width-44);let o=new at(i);return o.colorSpace=Be,o.minFilter=Se,o.magFilter=Se,ue.set(t,o),o}function gd(n,e,t,i,r){n.beginPath();for(let s=0;s<10;s+=1){let a=s%2===0?i:r,o=-Math.PI/2+s*Math.PI/5,c=e+Math.cos(o)*a,h=t+Math.sin(o)*a;s===0?n.moveTo(c,h):n.lineTo(c,h)}n.closePath()}function L_(n="worker",e={}){let t=String(e.accessory||"tools"),i=String(e.actionKind||""),r=`cue:${n}:${t}:${i}`;if(ue.has(r))return ue.get(r);let s=As(n),a=document.createElement("canvas");a.width=160,a.height=160;let o=a.getContext("2d");if(o.clearRect(0,0,a.width,a.height),o.fillStyle="rgba(46, 27, 14, 0.24)",o.beginPath(),o.ellipse(84,126,46,14,0,0,Math.PI*2),o.fill(),o.fillStyle=s.cue,o.strokeStyle=s.stroke,o.lineWidth=8,o.beginPath(),o.roundRect(31,20,98,98,28),o.fill(),o.stroke(),o.strokeStyle=s.stroke,o.fillStyle=s.fill,o.lineCap="round",o.lineJoin="round",o.lineWidth=10,t==="hammer")o.beginPath(),o.moveTo(58,88),o.lineTo(104,42),o.moveTo(85,37),o.lineTo(119,71),o.stroke();else if(t==="wrench")o.beginPath(),o.arc(62,50,18,.2,Math.PI*1.55),o.moveTo(73,65),o.lineTo(108,100),o.stroke();else if(t==="bundle")o.fillStyle="#c4883a",o.strokeStyle=s.stroke,o.lineWidth=7,o.beginPath(),o.roundRect(50,54,60,46,10),o.fill(),o.stroke(),o.beginPath(),o.moveTo(50,78),o.lineTo(110,78),o.moveTo(80,54),o.lineTo(80,100),o.stroke();else if(t==="coin"){o.fillStyle="#d7ae50";for(let h of[92,77,62])o.beginPath(),o.ellipse(80,h,30,10,0,0,Math.PI*2),o.fill(),o.stroke()}else t==="approval"?(o.font='900 46px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',o.textAlign="center",o.textBaseline="middle",o.fillText("OK",80,74)):t==="reward"?(o.fillStyle="#d7ae50",gd(o,80,74,34,15),o.fill(),o.stroke()):t==="quest"?(o.beginPath(),o.moveTo(80,38),o.lineTo(112,74),o.lineTo(80,110),o.lineTo(48,74),o.closePath(),o.fill(),o.stroke()):t==="clover"?(o.font='900 58px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',o.textAlign="center",o.textBaseline="middle",o.fillText("C",80,76)):t==="notice"?(o.font='900 70px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',o.textAlign="center",o.textBaseline="middle",o.fillText("!",80,74)):(o.beginPath(),o.arc(80,74,24,0,Math.PI*2),o.moveTo(48,74),o.lineTo(112,74),o.moveTo(80,42),o.lineTo(80,106),o.stroke());let c=new at(a);return c.colorSpace=Be,c.minFilter=Se,c.magFilter=Se,ue.set(r,c),c}function F_(n="worker",e=0){let t=ot(me(e,0),0,1),i=Math.round(t*100),r=`progress:${n}:${i}`;if(ue.has(r))return ue.get(r);let s=As(n),a=document.createElement("canvas");a.width=256,a.height=64;let o=a.getContext("2d");o.clearRect(0,0,a.width,a.height),o.fillStyle="rgba(46, 27, 14, 0.40)",o.beginPath(),o.roundRect(18,18,220,28,14),o.fill(),o.fillStyle="#fff8e8",o.beginPath(),o.roundRect(24,23,208,18,9),o.fill(),o.fillStyle=s.fill,o.beginPath(),o.roundRect(24,23,Math.max(12,208*t),18,9),o.fill(),o.strokeStyle=s.stroke,o.lineWidth=5,o.beginPath(),o.roundRect(18,18,220,28,14),o.stroke();let c=new at(a);return c.colorSpace=Be,c.minFilter=Se,c.magFilter=Se,ue.set(r,c),c}function N_(n={}){let e=String(n.cueType||"crossing_greeting"),t=Array.isArray(n.roles)?n.roles:[],i=`encounter:${e}:${t.join("+")}`;if(ue.has(i))return ue.get(i);let r=document.createElement("canvas");r.width=192,r.height=160;let s=r.getContext("2d");s.clearRect(0,0,r.width,r.height),s.fillStyle="rgba(46, 27, 14, 0.22)",s.beginPath(),s.ellipse(96,126,52,14,0,0,Math.PI*2),s.fill(),s.fillStyle=e==="handoff"?"#fff0bd":"#d6f1ef",s.strokeStyle="#3b2513",s.lineWidth=7,s.beginPath(),s.roundRect(36,22,120,84,28),s.fill(),s.stroke();let a=As(t[0]||"worker"),o=As(t[1]||"messenger");s.fillStyle=a.fill,s.strokeStyle=a.stroke,s.lineWidth=5,s.beginPath(),s.arc(78,64,20,0,Math.PI*2),s.fill(),s.stroke(),s.fillStyle=o.fill,s.strokeStyle=o.stroke,s.beginPath(),s.arc(116,64,20,0,Math.PI*2),s.fill(),s.stroke(),s.strokeStyle="#3b2513",s.lineWidth=6,s.lineCap="round",s.beginPath(),s.moveTo(91,82),s.lineTo(103,82),s.stroke(),s.fillStyle=e==="handoff"?"#c4883a":"#c85c75",gd(s,97,38,13,6),s.fill(),s.stroke();let c=new at(r);return c.colorSpace=Be,c.minFilter=Se,c.magFilter=Se,ue.set(i,c),c}function $o(n){let e=n?.image||null;return!!e&&e.complete!==!1}function nd(n,e,t){let i=String(n||"").trim();if(!i)return null;if(ue.has(i)){let s=ue.get(i);return typeof e=="function"&&($o(s)?queueMicrotask(()=>e(s)):s.userData.pendingOnLoad=[...s.userData.pendingOnLoad||[],e]),typeof t=="function"&&!$o(s)&&(s.userData.pendingOnError=[...s.userData.pendingOnError||[],t]),s}let r=new hs().load(i,()=>{r.colorSpace=Be,r.minFilter=gn,r.magFilter=Se;let s=r.userData.pendingOnLoad||[];r.userData.pendingOnLoad=[],r.userData.pendingOnError=[];for(let a of s)a(r)},void 0,()=>{let s=r.userData.pendingOnError||[];ue.delete(i);for(let a of s)a()});return r.colorSpace=Be,r.userData.pendingOnLoad=typeof e=="function"?[e]:[],r.userData.pendingOnError=typeof t=="function"?[t]:[],ue.set(i,r),r}function O_(n=null){if(!n||typeof n!="object")return null;let e=ot(Math.round(me(n.columns,1)),1,32),t=ot(Math.round(me(n.rows,1)),1,32),i=ot(Math.round(me(n.row,0)),0,t-1),s=(Array.isArray(n.frames)?n.frames:[0]).map(a=>ot(Math.round(me(a,0)),0,e-1)).filter((a,o,c)=>c.indexOf(a)===o);return{id:String(n.id||""),metadataSrc:String(n.metadataSrc||""),action:String(n.action||""),columns:e,rows:t,row:i,frames:s.length>0?s:[0],fps:ot(me(n.fps,4),1,12),frameWidth:me(n.frameWidth,1),frameHeight:me(n.frameHeight,1)}}function _d(n,e,t){if(!n||!e)return;let i=ot(Math.round(me(t,0)),0,e.columns-1);n.repeat.set(1/e.columns,1/e.rows),n.offset.set(i/e.columns,1-(e.row+1)/e.rows),$o(n)&&(n.needsUpdate=!0)}function U_(n){let e=new Lt;return e.source=n.source,e.mapping=n.mapping,e.channel=n.channel,e.wrapS=n.wrapS,e.wrapT=n.wrapT,e.generateMipmaps=n.generateMipmaps,e.premultiplyAlpha=n.premultiplyAlpha,e.flipY=n.flipY,e.unpackAlignment=n.unpackAlignment,e}function k_(n={},e){let t=O_(n.assetSprite);if(!t||!e)return{texture:e,sheet:null};let i=$o(e)?e.clone():U_(e);return i.colorSpace=Be,i.minFilter=gn,i.magFilter=Se,i.userData={spriteSheetClone:!0},_d(i,t,t.frames[0]),{texture:i,sheet:t}}function B_(n={}){return n.kind==="actor"?n.canonicalRoleId==="clover"?1.35:1.22:n.kind==="pad"?1.05:n.buildingType==="HQ"?2.15*me(n.scale,1):1.55*me(n.scale,1)}function H_(n={},e,t=0){let i=k_(n,e),r=i.sheet,s=new yt({map:i.texture,transparent:!0,depthTest:!0,depthWrite:!1,alphaTest:.04}),a=new bt(s),o=r?.frameWidth&&r?.frameHeight?{width:r.frameWidth,height:r.frameHeight}:i.texture?.image||null,c=o&&o.width&&o.height?o.width/o.height:1,h=B_(n);return a.position.set(Is(n.x),Ps(n.y),pd(n,t)),a.scale.set(h*ot(c,.62,1.75),h,1),a.userData=Cs(n,{sprite:!0,baseX:a.position.x,baseY:a.position.y,baseScaleX:a.scale.x,baseScaleY:a.scale.y,baseRotation:a.material.rotation||0,phase:Yo(n.actionAnimation?.phaseSeed||n.actorId||n.id),spriteSheet:!!r,spriteSheetId:r?.id||"",spriteSheetAction:r?.action||"",spriteSheetMetadataSrc:r?.metadataSrc||"",spriteSheetColumns:r?.columns||0,spriteSheetRows:r?.rows||0,spriteSheetRow:r?.row??-1,spriteSheetFrames:r?.frames||[],spriteSheetFps:r?.fps||0}),a}function Cs(n={},e={}){return{objectId:String(n.id||""),kind:String(n.kind||""),label:String(n.label||""),selectionKey:String(n.selectionKey||""),drawerKey:String(n.drawerKey||""),testId:String(n.testId||""),state:String(n.state||""),visualOnly:n.visualOnly===!0,actorId:String(n.actorId||""),canonicalRoleId:String(n.canonicalRoleId||""),generatedOverlayRoleId:String(n.generatedOverlayRoleId||""),sourceDomain:String(n.sourceDomain||""),sourceObjectId:String(n.sourceObjectId||""),sourceStateHash:String(n.sourceStateHash||""),visualState:String(n.visualState||""),assetSrc:String(n.assetSrc||""),assetSprite:n.assetSprite||null,actionKind:String(n.actionKind||""),actionCueType:String(n.actionCue?.cueType||""),actionCueAccessory:String(n.actionCue?.accessory||""),animationMode:String(n.actionAnimation?.mode||""),animationTempo:me(n.actionAnimation?.tempo,1),animationStepStyle:String(n.actionAnimation?.stepStyle||""),hasWalkOffset:n.actionAnimation?.hasWalkOffset===!0,progress:me(n.progress,0),routeId:String(n.route?.routeId||""),wayId:String(n.route?.wayId||""),routeMode:String(n.route?.mode||""),routeProgress:me(n.route?.progress,0),routeTargetId:String(n.route?.targetId||""),validPlacement:n.validPlacement===!0,x:me(n.x,.5),y:me(n.y,.5),...e}}function z_(n={},e){let t=Math.max(1.05,e.scale.x*1.04),i=Math.max(1.05,e.scale.y*1.12),r=new dt(new en(t,i),new Ft({color:16777215,transparent:!0,opacity:.001,depthWrite:!1}));return r.position.copy(e.position),r.position.z+=.1,r.userData=Cs(n,{hitTarget:!0}),r}function V_(n={},e){if(n.kind==="actor")return null;let t=String(n.state||""),i=n.selected?"selected":t==="OUTPUT_READY"?"ready":"neutral",r=md(n.label||n.id,i),s=new bt(new yt({map:r,transparent:!0,depthTest:!0,depthWrite:!1,alphaTest:.03}));return s.position.set(e.position.x,e.position.y-e.scale.y*.58,e.position.z+.18),s.scale.set(1.55,.39,1),s.userData=Cs(n,{labelSprite:!0}),s}function G_(n={},e){if(n.kind!=="actor"||!n.actionCue)return[];let t=String(n.canonicalRoleId||"worker"),i=n.actionCue||{},r=[],s=new bt(new yt({map:L_(t,i),transparent:!0,depthTest:!0,depthWrite:!1,alphaTest:.03})),a=t==="hauler"?.52:t==="messenger"?.38:.44,o=t==="hauler"?-.08:e.scale.y*.52;if(s.position.set(e.position.x+a,e.position.y+o,e.position.z+.22),s.scale.set(t==="messenger"?.62:.54,t==="messenger"?.62:.54,1),s.userData=Cs(n,{actionCueSprite:!0,actionCueType:String(i.cueType||""),actionCueAccessory:String(i.accessory||""),baseX:s.position.x,baseY:s.position.y,baseScaleX:s.scale.x,baseScaleY:s.scale.y,baseRotation:s.material.rotation||0,phase:Yo(n.actionAnimation?.phaseSeed||n.actorId||n.id)}),r.push(s),t==="builder"||t==="worker"){let c=new bt(new yt({map:F_(t,i.progress),transparent:!0,depthTest:!0,depthWrite:!1,alphaTest:.03}));c.position.set(e.position.x,e.position.y-e.scale.y*.62,e.position.z+.24),c.scale.set(1.15,.29,1),c.userData=Cs(n,{actionCueSprite:!0,progressSprite:!0,actionCueType:String(i.cueType||""),actionCueAccessory:"progress",baseX:c.position.x,baseY:c.position.y,baseScaleX:c.scale.x,baseScaleY:c.scale.y,baseRotation:c.material.rotation||0,phase:Yo(n.actionAnimation?.phaseSeed||n.actorId||n.id)}),r.push(c)}return r}function W_(n={}){return n.selected?6262158:n.buildable?8362854:n.occupied?12879930:10319192}function X_(n={}){let e={x:ot((me(n.x)+.5)/3,.08,.92),y:ot((me(n.y)+.5)/3,.1,.9)},t=new dt(new en(3.55,1.78),new Ft({color:W_(n),transparent:!0,opacity:n.selected?.34:n.buildable?.18:.1,depthWrite:!1,side:Bt}));return t.position.set(Is(e.x),Ps(e.y),-2.1),t.userData={objectId:String(n.id||""),kind:"grid_cell",selectionKey:String(n.selectionKey||""),buildable:n.buildable===!0,occupied:n.occupied===!0,hitTarget:!0},t}function q_(n={}){let e=Array.isArray(n.points)?n.points:[],t=e.length>=2?e.map(s=>Ic(s,-1.72)):[Ic({x:.5,y:.5},-1.72),Ic({x:.55,y:.55},-1.72)],i=new Fi(t,!1,"centripetal",.4),r=new dt(new ls(i,18,.055,7,!1),new Ft({color:7161893,transparent:!0,opacity:.62,depthWrite:!1}));return r.userData={kind:"way",wayLine:!0,wayId:String(n.wayId||""),label:String(n.label||""),targetId:String(n.targetId||""),visualOnly:n.visualOnly===!0,points:e},r}function Y_(n={}){let e=new bt(new yt({map:N_(n),transparent:!0,depthTest:!0,depthWrite:!1,alphaTest:.03}));return e.position.set(Is(n.x),Ps(n.y)+.46,2.25),e.scale.set(.68,.56,1),e.userData={kind:"encounter",encounterSprite:!0,encounterId:String(n.encounterId||""),targetId:String(n.targetId||""),cueType:String(n.cueType||""),label:String(n.label||""),roles:Array.isArray(n.roles)?n.roles:[],actorIds:Array.isArray(n.actorIds)?n.actorIds:[],visualOnly:n.visualOnly===!0,baseX:e.position.x,baseY:e.position.y,baseScaleX:e.scale.x,baseScaleY:e.scale.y,phase:Yo(n.encounterId||n.targetId||"")},e}function $_(n,e="three-raycast"){let t=n?.userData||{};return{objectId:String(t.objectId||""),kind:String(t.kind||""),label:String(t.label||""),selectionKey:String(t.selectionKey||""),drawerKey:String(t.drawerKey||""),testId:String(t.testId||""),visualOnly:t.visualOnly===!0,actorId:String(t.actorId||""),canonicalRoleId:String(t.canonicalRoleId||""),generatedOverlayRoleId:String(t.generatedOverlayRoleId||""),sourceDomain:String(t.sourceDomain||""),sourceObjectId:String(t.sourceObjectId||""),sourceStateHash:String(t.sourceStateHash||""),visualState:String(t.visualState||""),actionKind:String(t.actionKind||""),actionCueType:String(t.actionCueType||""),actionCueAccessory:String(t.actionCueAccessory||""),animationMode:String(t.animationMode||""),animationStepStyle:String(t.animationStepStyle||""),progress:me(t.progress,0),routeId:String(t.routeId||""),wayId:String(t.wayId||""),routeMode:String(t.routeMode||""),routeProgress:me(t.routeProgress,0),routeTargetId:String(t.routeTargetId||""),validPlacement:t.validPlacement===!0,source:e,atMs:Date.now()}}var Nc=class{constructor(e){this.stageNode=e,this.viewport=null,this.scenePayload=null,this.pickables=[],this.objectMeshes=[],this.info={},this.scene=new pr,this.camera=new mi(vi/-2,vi/2,Si/2,Si/-2,.1,100),this.camera.position.set(0,0,12),this.camera.lookAt(0,0,0),this.raycaster=new Mr,this.pointer=new ye,this.renderer=new Ts({antialias:!0,alpha:!1,preserveDrawingBuffer:!0}),this.renderer.setClearColor(16046248,1),this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),this.renderer.domElement.className="fp-three-canvas",this.renderer.domElement.dataset.testid="founders-three-canvas",this.renderer.domElement.setAttribute("aria-label","Founders Plot Three.js scene"),this.onClick=this.onClick.bind(this),this.onResize=this.onResize.bind(this),this.animate=this.animate.bind(this),this.running=!0,this.reducedMotion=typeof window.matchMedia=="function"?window.matchMedia("(prefers-reduced-motion: reduce)").matches:!1,this.resizeObserver=new ResizeObserver(this.onResize),requestAnimationFrame(this.animate)}attach(e){e instanceof HTMLElement&&(this.viewport=e,this.renderer.domElement.parentElement!==e&&e.appendChild(this.renderer.domElement),this.stageNode.addEventListener("click",this.onClick,!0),this.resizeObserver.observe(e),this.onResize())}dispose(){this.running=!1,this.stageNode.removeEventListener("click",this.onClick,!0),this.resizeObserver.disconnect(),this.clearScene(),this.renderer.dispose(),this.renderer.domElement.remove()}clearScene(){this.scene.children.slice().forEach(t=>{this.scene.remove(t),t.traverse(i=>{if(i.geometry&&i.geometry.dispose(),i.material){let r=Array.isArray(i.material)?i.material:[i.material];for(let s of r)s.map?.userData?.spriteSheetClone&&s.map.dispose(),s.dispose()}})}),this.pickables=[],this.objectMeshes=[]}onResize(){let e=(this.viewport||this.stageNode).getBoundingClientRect(),t=Math.max(1,Math.floor(e.width)),i=Math.max(1,Math.floor(e.height));this.renderer.setSize(t,i,!1);let r=t/i,s=vi/Si;if(r>=s){let a=Si*r;this.camera.left=a/-2,this.camera.right=a/2,this.camera.top=Si/2,this.camera.bottom=Si/-2}else{let a=vi/r;this.camera.left=vi/-2,this.camera.right=vi/2,this.camera.top=a/2,this.camera.bottom=a/-2}this.camera.updateProjectionMatrix(),this.render()}sync(e={}){this.scenePayload=e,this.rebuild(),this.render()}rebuild(){this.clearScene();let e=this.scenePayload||{},t=window.innerWidth<=560?e.stageBackgrounds?.mobile:e.stageBackgrounds?.desktop,i=nd(t,()=>this.render()),r=new dt(new en(vi,Si),new Ft({map:i||md("Founders Plot")}));r.position.set(0,0,-4),this.scene.add(r);for(let s of e.grid?.cells||[]){let a=X_(s);this.scene.add(a),this.pickables.push(a)}for(let s of e.ways||[]){let a=q_(s);this.scene.add(a),this.objectMeshes.push(a)}for(let s of e.objects||[]){let a=s.canonicalRoleId||s.kind,o=D_(a||"worker"),c=null,h=s.assetSrc?nd(s.assetSrc,()=>this.render(),()=>{c?.material&&(c.material.map?.userData?.spriteSheetClone&&c.material.map.dispose(),c.material.map=o,c.material.needsUpdate=!0,c.userData.assetFallback=!0,c.userData.spriteSheet=!1,this.render())}):o;c=H_(s,h||o,s.kind==="actor"?.8:0),this.scene.add(c),this.objectMeshes.push(c);let u=z_(s,c);this.scene.add(u),this.pickables.push(u);let d=V_(s,c);d&&this.scene.add(d);for(let l of G_(s,c))this.scene.add(l),this.objectMeshes.push(l)}for(let s of e.encounters||[]){let a=Y_(s);this.scene.add(a),this.objectMeshes.push(a)}this.updateInfo()}pickFromEvent(e){let t=this.renderer.domElement.getBoundingClientRect();return this.pointer.x=(e.clientX-t.left)/t.width*2-1,this.pointer.y=-((e.clientY-t.top)/t.height)*2+1,this.raycaster.setFromCamera(this.pointer,this.camera),this.raycaster.intersectObjects(this.pickables,!1)[0]?.object||null}onClick(e){if(e.target instanceof Element&&e.target.closest(".fp-tile"))return;let t=this.pickFromEvent(e);if(!t)return;let i=$_(t);i.visualOnly&&(e.preventDefault(),e.stopPropagation()),window.dispatchEvent(new CustomEvent("founders-plot-scene-pick",{detail:i}))}canvasPointFor(e){let t=new C(Is(e.x),Ps(e.y),pd(e,e.kind==="actor"?.8:0));t.project(this.camera);let i=this.renderer.domElement.getBoundingClientRect();return{x:(t.x+1)/2*i.width,y:(-t.y+1)/2*i.height}}updateInfo(){let e=this.scenePayload||{},t=this.renderer.domElement,i=Array.isArray(e.objects)?e.objects:[];return this.info={renderer:"three.js",stateHash:String(e.stateHash||""),canvasWidth:t.width,canvasHeight:t.height,objectCount:i.length,objectIds:i.map(r=>r.id),ways:(e.ways||[]).map(r=>({wayId:r.wayId||"",targetId:r.targetId||"",label:r.label||"",points:r.points||[],visualOnly:r.visualOnly===!0})),encounters:(e.encounters||[]).map(r=>({encounterId:r.encounterId||"",targetId:r.targetId||"",roles:r.roles||[],actorIds:r.actorIds||[],cueType:r.cueType||"",visualOnly:r.visualOnly===!0,canvas:this.canvasPointFor({x:r.x,y:r.y,z:0,kind:"encounter"})})),actorIds:(e.actors||[]).map(r=>r.actorId),actors:(e.actors||[]).map(r=>({...r,canvas:this.canvasPointFor(i.find(s=>s.actorId===r.actorId||s.id===r.id)||{})})),actionCues:(e.actors||[]).map(r=>({actorId:r.actorId,canonicalRoleId:r.canonicalRoleId,sourceDomain:r.sourceDomain,sourceObjectId:r.sourceObjectId,actionKind:r.actionKind||"",cueType:r.actionCue?.cueType||"",accessory:r.actionCue?.accessory||"",progress:me(r.actionCue?.progress,r.progress||0)})),roles:(e.actors||[]).map(r=>r.canonicalRoleId),renderedActors:this.objectMeshes.filter(r=>r.userData?.kind==="actor"&&r.userData?.sprite===!0).map(r=>({actorId:r.userData.actorId||"",canonicalRoleId:r.userData.canonicalRoleId||"",assetSrc:r.userData.assetSrc||"",spriteSheet:r.userData.spriteSheet===!0,spriteSheetId:r.userData.spriteSheetId||"",spriteSheetAction:r.userData.spriteSheetAction||"",routeId:r.userData.routeId||"",wayId:r.userData.wayId||"",routeProgress:me(r.userData.routeProgress,0),assetFallback:r.userData.assetFallback===!0})),renderedWays:this.objectMeshes.filter(r=>r.userData?.wayLine===!0).map(r=>({wayId:r.userData.wayId||"",targetId:r.userData.targetId||"",visualOnly:r.userData.visualOnly===!0})),renderedEncounters:this.objectMeshes.filter(r=>r.userData?.encounterSprite===!0).map(r=>({encounterId:r.userData.encounterId||"",targetId:r.userData.targetId||"",cueType:r.userData.cueType||"",roles:r.userData.roles||[],visualOnly:r.userData.visualOnly===!0})),pickTargets:i.map(r=>({objectId:r.id,kind:r.kind,label:r.label,selectionKey:r.selectionKey,drawerKey:r.drawerKey,testId:r.testId,visualOnly:r.visualOnly===!0,actorId:r.actorId||"",canonicalRoleId:r.canonicalRoleId||"",sourceDomain:r.sourceDomain||"",sourceObjectId:r.sourceObjectId||"",sourceStateHash:r.sourceStateHash||"",visualState:r.visualState||"",assetSrc:r.assetSrc||"",assetSprite:r.assetSprite||null,actionKind:r.actionKind||"",route:r.route||null,actionCue:r.actionCue||null,actionAnimation:r.actionAnimation||null,canvas:this.canvasPointFor(r)}))},this.info}animate(e=0){if(this.running){for(let t of this.objectMeshes){let i=t.userData||{},r=me(i.baseX,t.position.x),s=me(i.baseY,t.position.y),a=me(i.baseScaleX,t.scale.x),o=me(i.baseScaleY,t.scale.y),c=me(i.baseRotation,0);if(i.kind==="actor"){if(i.spriteSheet&&t.material?.map){let x=Array.isArray(i.spriteSheetFrames)&&i.spriteSheetFrames.length>0?i.spriteSheetFrames:[0],M=me(i.spriteSheetFps,4),A=x[Math.floor(e/1e3*M+me(i.phase,0))%x.length];_d(t.material.map,{columns:me(i.spriteSheetColumns,1),rows:me(i.spriteSheetRows,1),row:me(i.spriteSheetRow,0)},A)}if(this.reducedMotion){t.position.x=r,t.position.y=s,t.scale.set(a,o,1),t.material&&(t.material.rotation=c);continue}let h=me(i.phase,0),u=me(i.animationTempo,1),d=e/360*u+h,l=i.hasWalkOffset?Math.sin(e/170+h):0,f=Math.abs(l)*.018,g=r,v=s+Math.sin(d)*.024+f,p=a,m=o,_=c;i.animationMode==="work_swing"?(_+=Math.sin(e/120+h)*.075,v+=Math.max(0,Math.sin(e/155+h))*.035,m*=1+Math.sin(e/155+h)*.018):i.animationMode==="busy_work"?(g+=Math.sin(e/135+h)*.018,v+=Math.sin(e/95+h)*.012,p*=1+Math.sin(e/135+h)*.012):i.animationMode==="carry_wobble"?(g+=Math.sin(e/210+h)*.025,_+=Math.sin(e/180+h)*.055,m*=1+Math.abs(Math.sin(e/180+h))*.018):i.animationMode==="attention_wave"&&(v+=Math.abs(Math.sin(e/150+h))*.05,_+=Math.sin(e/125+h)*.045,p*=1+Math.sin(e/150+h)*.012),t.position.x=g,t.position.y=v,t.scale.set(p,m,1),t.material&&(t.material.rotation=_)}else if(i.actionCueSprite&&!i.progressSprite){if(this.reducedMotion){t.position.x=r,t.position.y=s,t.material&&(t.material.rotation=c);continue}let h=me(i.phase,0);t.position.y=s+Math.sin(e/240+h)*.025,i.actionCueAccessory==="hammer"||i.actionCueAccessory==="wrench"?t.material.rotation=c+Math.sin(e/135+h)*.1:(i.actionCueAccessory==="notice"||i.actionCueAccessory==="approval"||i.actionCueAccessory==="quest")&&(t.material.rotation=c+Math.sin(e/180+h)*.07)}}this.render(),requestAnimationFrame(this.animate)}}render(){this.updateInfo(),this.renderer.render(this.scene,this.camera)}},$n=13.6,Zn=8.2,Hi=.86,vn=Hi*1.64,Gt="hq14t_server_bound_terrain_underlay_v1",id="hq14s_public_terrain_underlay_v1",Gc="/experiences/founders-plot/assets/expedition-map",Mi=`${Gc}/hq14s-public-terrain-underlay-v1`,Z_="hq15e_expedition_unit_marker_sprites_v1",Fn=`${Gc}/hq15e-expedition-unit-marker-sprites-v1`,Es="hq17c-generated-hud-chrome-v1",bi=`${Gc}/${Es}`,Pc="hq17d_three_masked_profiles_and_text_v1",rd="hq17e_clean_hud_chrome_compositor_v1",sd="hq17f_single_owner_canvas_hud_v1",sn="hq17g_renderer_owned_hud_materiality_v1",ws="hq17h_renderer_hud_world_cohesion_v1",Oc="agenttown_public_terrain_asset_slots_v1",Uc="server_read_model_v1",K_=Object.freeze(["field","forest","ridge","settled"]),yd=Object.freeze({slot:"public_terrain_underlay",path:`${Mi}/public-terrain-underlay-candidate-01-v1.png`,assetKind:"visual_underlay"}),ad=Object.freeze({field:{slot:"field",path:`${Mi}/field-v1.png`,assetKind:"concrete_public_terrain"},settled:{slot:"settled",path:`${Mi}/settled-v1.png`,assetKind:"concrete_public_terrain"},forest:{slot:"forest",path:`${Mi}/forest-v1.png`,assetKind:"concrete_public_terrain"},ridge:{slot:"ridge",path:`${Mi}/ridge-v1.png`,assetKind:"concrete_public_terrain"},hinted:{slot:"hinted_frontier_fog",path:`${Mi}/hinted-frontier-fog-v1.png`,assetKind:"fog_only",fogOnly:!0},locked_unknown:{slot:"locked_unknown_fog",path:`${Mi}/locked-unknown-fog-v1.png`,assetKind:"fog_only",fogOnly:!0}}),xd=Object.freeze({scout:{slot:"scout",path:`${Fn}/scout-pathfinder-v1.png`,assetKind:"generated_unit_sprite"},settler_convoy:{slot:"settler_convoy",path:`${Fn}/settler-convoy-v1.png`,assetKind:"generated_unit_sprite"},surveyor:{slot:"surveyor",path:`${Fn}/surveyor-beacon-v1.png`,assetKind:"generated_unit_sprite"},courier:{slot:"courier",path:`${Fn}/courier-signal-runner-v1.png`,assetKind:"generated_unit_sprite"},outpost_crew:{slot:"outpost_crew",path:`${Fn}/outpost-crew-v1.png`,assetKind:"generated_unit_sprite"},field_support:{slot:"surveyor",path:`${Fn}/surveyor-beacon-v1.png`,assetKind:"generated_unit_sprite"}}),Bi=Object.freeze({objective_beacon:{slot:"objective_beacon",path:`${Fn}/objective-beacon-v1.png`,assetKind:"generated_marker_sprite"},event_packet:{slot:"event_packet",path:`${Fn}/event-packet-v1.png`,assetKind:"generated_marker_sprite"},receipt_ledger:{slot:"receipt_ledger",path:`${Fn}/receipt-ledger-v1.png`,assetKind:"generated_marker_sprite"}}),od=Object.freeze([{slot:"crest-status",path:`${bi}/crest-status.png`,anchor:"top-left",widthRatio:.36,heightRatio:.14,marginX:.04,marginY:.016,opacity:.58},{slot:"objective-loop",path:`${bi}/objective-plaque.png`,anchor:"top-left",widthRatio:.3,heightRatio:.12,marginX:.03,marginY:.166,opacity:.54},{slot:"unit-dock",path:`${bi}/unit-dock.png`,anchor:"bottom-left",widthRatio:.52,heightRatio:.188,marginX:.012,marginY:.012,opacity:.62},{slot:"command-tray",path:`${bi}/command-tray.png`,anchor:"bottom-right",widthRatio:.38,heightRatio:.188,marginX:.012,marginY:.012,opacity:.62},{slot:"collapsed-ledger",path:`${bi}/ledger-rail.png`,anchor:"right",widthRatio:.058,heightRatio:.56,marginX:.008,marginY:.2,opacity:.58},{slot:"selected-context",path:`${bi}/selected-context-frame.png`,anchor:"bottom-right",widthRatio:.3,heightRatio:.13,marginX:.04,marginY:.205,opacity:.58},{slot:"command-puck",path:`${bi}/command-puck.png`,anchor:"selected-command",widthRatio:.07,heightRatio:.102,marginX:0,marginY:0,opacity:.6}]),kc=new Map,Bc=new Set;function vd(n={}){let t=(Array.isArray(n.generatedHudChrome?.assets)?n.generatedHudChrome.assets:[]).filter(i=>i?.path&&i?.slot).map(i=>({...od.find(s=>String(s.slot||"")===String(i.slot||""))||{},...i,packId:String(n.generatedHudChrome?.packId||i.packId||Es),visualOnly:!0,readOnly:!0,routeAuthority:!1,actionAuthority:!1,executableActions:0}));return t.length?t:od}function J_(n="",e={}){return vd(e).find(t=>String(t.slot||"")===String(n||""))||null}function Jn(n,e=1){let t=Number(n||0),i=t>>16&255,r=t>>8&255,s=t&255;return`rgba(${i}, ${r}, ${s}, ${e})`}function j_(n=""){let e=String(n||""),t=2166136261;for(let i=0;i<e.length;i+=1)t^=e.charCodeAt(i),t=Math.imul(t,16777619);return t>>>0}function Zo(n=""){return j_(n)%1e4/1e4}function ld(n={}){let e=me(n.q,0),t=me(n.r,0);return{x:e+t*.5,y:-t*.86}}function Sd(n=[]){let e=n.map(p=>ld(p));e.length||e.push({x:0,y:0});let t=Math.min(...e.map(p=>p.x),0),i=Math.max(...e.map(p=>p.x),0),r=Math.min(...e.map(p=>p.y),0),s=Math.max(...e.map(p=>p.y),0),a=Math.max(1,i-t),o=Math.max(1,s-r),c=Math.min(($n-2.4)/a,(Zn-1.8)/o,1.62),h=(t+i)/2,u=(r+s)/2,d=new Map,l=1/0,f=-1/0,g=1/0,v=-1/0;for(let p of n){let m=ld(p),_={x:(m.x-h)*c,y:(m.y-u)*c};d.set(String(p.cellId||""),_),l=Math.min(l,_.x-vn),f=Math.max(f,_.x+vn),g=Math.min(g,_.y-vn),v=Math.max(v,_.y+vn)}return Number.isFinite(l)||(l=-1,f=1,g=-1,v=1),{positions:d,bounds:{minX:l,maxX:f,minY:g,maxY:v,centerX:(l+f)/2,centerY:(g+v)/2,width:Math.max(1,f-l),height:Math.max(1,v-g)}}}function Wc(n={},e=!1){let t=String(n.fogState||"locked_unknown");return e?{fill:14676452,line:1462092,rim:16110724,shadow:1457209,opacity:.98,lineOpacity:.98,labelTone:"selected",fogOverlay:15727092}:t==="discovered"?{fill:11192718,line:2976326,rim:15784338,shadow:2969391,opacity:.98,lineOpacity:.9,labelTone:"ready",fogOverlay:15070932}:t==="known"?{fill:4038555,line:1399381,rim:12251373,shadow:1194808,opacity:.96,lineOpacity:.86,labelTone:"selected",fogOverlay:11923949}:t==="hinted"?{fill:15047477,line:7159574,rim:16767096,shadow:8078611,opacity:.92,lineOpacity:.84,labelTone:"neutral",fogOverlay:15971400}:{fill:10130564,line:6116938,rim:14141352,shadow:5393218,opacity:.54,lineOpacity:.46,labelTone:"neutral",fogOverlay:13155498}}function xn(n=Hi){let e=[];for(let t=0;t<6;t+=1){let i=Math.PI/6+t*Math.PI/3;e.push(new C(Math.cos(i)*n,Math.sin(i)*n,0))}return e.push(e[0].clone()),e}function cd(n=Hi){let e=new xr;return xn(n).forEach((t,i)=>{i===0?e.moveTo(t.x,t.y):e.lineTo(t.x,t.y)}),new os(e)}function hd(n=Hi){let e=xn(n).slice(0,6),t=[0,0,0],i=[.5,.5];for(let a of e)t.push(a.x,a.y,0),i.push(.5+a.x/(n*2),.5-a.y/(n*2));let r=[];for(let a=1;a<=e.length;a+=1)r.push(0,a,a===e.length?1:a+1);let s=new it;return s.setAttribute("position",new _t(t,3)),s.setAttribute("uv",new _t(i,2)),s.setIndex(r),s.computeVertexNormals(),s}function Q_(n={}){let e=String(n.status||""),t=String(n.kind||""),i=String(n.fogState||"");return e.includes("OUTPOST")||t.includes("outpost")?"OUT":t==="origin_plot"?"HQ":e.includes("SITE_PLAN")?"PLAN":e.includes("SCOUT")?"SITE":i==="hinted"?"...":i==="locked_unknown"?"?":"MAP"}function ey(n="",e=!1,t=!1){return e?.72:t?.62:n==="locked_unknown"?.26:n==="hinted"?.46:.58}function ty(n={},e="",t=!1,i=!1){let r=me(n.opacity,.72);return t?Math.min(.82,r*.88):i?Math.min(.72,r*.76):e==="locked_unknown"?Math.min(.34,r*.58):e==="hinted"?Math.min(.52,r*.62):Math.min(.58,r*.66)}function ny(n="",e=!1,t=!1){return e?.7:t?.42:n==="locked_unknown"?.08:n==="hinted"?.16:.18}function iy(n={},e="",t=!1,i=!1){return t?Math.max(.58,me(n.lineOpacity,.58)):i?.38:e==="locked_unknown"?.14:e==="hinted"?.2:.22}function ry(n={}){let e=String(n.siteType||"").toLowerCase(),t=Array.isArray(n.traits)?n.traits.map(s=>String(s||"").toLowerCase()):[],i=String(n.kind||"").toLowerCase(),r=String(n.status||"").toLowerCase();return`${e} ${i} ${r} ${t.join(" ")}`}function Ti(n={}){return["discovered","known"].includes(String(n.fogState||"locked_unknown"))}function Ds(n={}){if(!Ti(n))return null;let e=String(n.publicTerrainAssetSlot||"");return K_.includes(e)?e:null}function Xc(n={}){let e=String(n.fogState||"locked_unknown"),t=String(n.fogAssetSlot||"");return e==="hinted"&&t==="hinted_frontier_fog"||e==="locked_unknown"&&t==="locked_unknown_fog"?t:e==="hinted"?"hinted_frontier_fog":"locked_unknown_fog"}function jn(n={}){let e=String(n.fogState||"locked_unknown");return Ti(n)?Ds(n)||"field":e}function sy(n={},e=null){return!Ti(n)||!e?.slot?!1:e.slot===Ds(n)}function qc(n={},e=jn(n)){let t=String(n.fogState||"locked_unknown");if(!Ti(n)){let r=ad[t]||null;return r&&r.slot===Xc(n)?r:null}let i=ad[Ds(n)||e]||null;return i&&sy(n,i)?i:null}function ay(n={},e=jn(n),t=qc(n,e)){let i=String(n.fogState||"locked_unknown");return t?Ti(n)?t.fogOnly!==!0&&t.assetKind==="concrete_public_terrain"&&t.slot===Ds(n)&&String(n.terrainAssetContractVersion||"")===Oc&&String(n.publicTerrainAssetSlotSource||"")===Uc:t.fogOnly===!0&&t.assetKind==="fog_only"&&t.slot===Xc(n):e==="field"}function ud(){for(let n of Bc)n()}function oy(n){return typeof n!="function"?()=>{}:(Bc.add(n),()=>Bc.delete(n))}function Kn(n=null){if(!n?.path)return null;let e=kc.get(n.path);return!e||e.dataset?.loadFailed==="true"?null:e.complete&&e.naturalWidth>0?e:null}function Qo(n=null){if(!n?.path||typeof Image>"u")return null;if(kc.get(n.path))return Kn(n);let t=new Image;return t.decoding="async",t.onload=()=>ud(),t.onerror=()=>{t.dataset.loadFailed="true",ud()},kc.set(n.path,t),t.src=n.path,Kn(n)}function Ko(n={}){return xd[String(n.unitType||"")]||null}function Yc(n,e=null,t=0,i=0,r=128,s=128,a=22){let o=Qo(e);return o?(n.save(),n.beginPath(),n.roundRect(t,i,r,s,a),n.clip(),n.drawImage(o,t,i,r,s),n.restore(),!0):!1}function bd(n,e=120,t=128){n.beginPath(),xn(e).forEach((i,r)=>{let s=t+i.x,a=t+i.y;r===0?n.moveTo(s,a):n.lineTo(s,a)}),n.closePath()}function ly(n,e,t,i=1,r="rgba(35, 104, 68, 0.62)"){n.fillStyle="rgba(46, 27, 14, 0.18)",n.beginPath(),n.ellipse(e+7*i,t+12*i,13*i,4*i,0,0,Math.PI*2),n.fill(),n.fillStyle="rgba(80, 55, 29, 0.58)",n.fillRect(e-2*i,t+4*i,4*i,14*i),n.fillStyle=r;for(let s=0;s<3;s+=1){let a=t-18*i+s*12*i,o=(18-s*2)*i;n.beginPath(),n.moveTo(e,a),n.lineTo(e-o,a+24*i),n.lineTo(e+o,a+24*i),n.closePath(),n.fill()}}function Dc(n,e,t,i=1,r="rgba(255, 248, 232, 0.78)"){n.fillStyle="rgba(46, 27, 14, 0.18)",n.beginPath(),n.ellipse(e+8*i,t+24*i,24*i,7*i,0,0,Math.PI*2),n.fill(),n.fillStyle=r,n.strokeStyle="rgba(46, 27, 14, 0.38)",n.lineWidth=4*i,n.beginPath(),n.roundRect(e-18*i,t,36*i,26*i,5*i),n.fill(),n.stroke(),n.fillStyle="rgba(151, 86, 44, 0.82)",n.beginPath(),n.moveTo(e-22*i,t+4*i),n.lineTo(e,t-17*i),n.lineTo(e+23*i,t+4*i),n.closePath(),n.fill(),n.stroke()}function Jo(n,e,t,i=1,r="rgba(27, 106, 100, 0.72)"){n.strokeStyle="rgba(46, 27, 14, 0.42)",n.lineWidth=4*i,n.lineCap="round",n.beginPath(),n.moveTo(e,t+22*i),n.lineTo(e,t-28*i),n.stroke(),n.fillStyle=r,n.beginPath(),n.moveTo(e+3*i,t-25*i),n.lineTo(e+30*i,t-17*i),n.lineTo(e+3*i,t-6*i),n.closePath(),n.fill(),n.strokeStyle="rgba(255, 248, 232, 0.52)",n.lineWidth=2*i;for(let s=0;s<3;s+=1)n.beginPath(),n.arc(e,t-21*i,(15+s*12)*i,-.72,.34),n.stroke()}function Hc(n,e,t,i=92,r=.22){n.save(),n.strokeStyle=`rgba(46, 27, 14, ${r})`,n.lineWidth=3,n.lineCap="round",n.beginPath(),n.moveTo(e,t),n.bezierCurveTo(e+i*.25,t-7,e+i*.62,t+8,e+i,t-2),n.stroke(),n.strokeStyle=`rgba(255, 248, 232, ${r+.1})`,n.lineWidth=1.6,n.beginPath(),n.moveTo(e+4,t-4),n.bezierCurveTo(e+i*.28,t-9,e+i*.64,t+5,e+i-6,t-6),n.stroke(),n.restore()}function zc(n,e,t,i=1){n.save(),n.translate(e,t),n.fillStyle="rgba(255, 248, 232, 0.30)",n.strokeStyle="rgba(46, 27, 14, 0.34)",n.lineWidth=3*i,n.beginPath(),n.roundRect(-34*i,-17*i,68*i,34*i,8*i),n.fill(),n.stroke(),n.fillStyle="rgba(27, 106, 100, 0.35)",n.beginPath(),n.moveTo(-27*i,-17*i),n.lineTo(0,-39*i),n.lineTo(29*i,-17*i),n.closePath(),n.fill(),n.stroke(),n.strokeStyle="rgba(101, 74, 28, 0.45)",n.beginPath(),n.arc(-23*i,21*i,10*i,0,Math.PI*2),n.arc(24*i,21*i,10*i,0,Math.PI*2),n.stroke(),n.restore()}function cy(n,e,t,i=1){n.fillStyle="rgba(255, 248, 232, 0.14)",n.strokeStyle="rgba(255, 248, 232, 0.22)",n.lineWidth=4*i;for(let r=0;r<3;r+=1){let s=e+(r-1)*18*i,a=(26+r%2*14)*i;n.beginPath(),n.roundRect(s-7*i,t-a,14*i,a,3*i),n.fill(),n.stroke()}n.beginPath(),n.moveTo(e-30*i,t+3*i),n.lineTo(e+32*i,t-2*i),n.stroke()}function hy(n,e,t,i){let r=Zo(`${e.cellId}:${i}`);n.save(),bd(n),n.clip();let s=n.createLinearGradient(0,18,256,238);s.addColorStop(0,Jn(t.rim,.92)),s.addColorStop(.46,Jn(t.fill,.96)),s.addColorStop(1,Jn(t.shadow,.72)),n.fillStyle=s,n.fillRect(0,0,256,256),n.strokeStyle="rgba(46, 27, 14, 0.08)",n.lineWidth=3;for(let a=0;a<7;a+=1){let o=28+a*31;n.beginPath(),n.moveTo(12,o),n.bezierCurveTo(66,o-12,121,o+14,182,o-3),n.bezierCurveTo(210,o-10,231,o+3,248,o-8),n.stroke()}if(i==="water"&&(n.strokeStyle="rgba(39, 126, 167, 0.26)",n.lineWidth=9,n.lineCap="round",n.beginPath(),n.moveTo(-10,172-r*30),n.bezierCurveTo(62,139-r*16,118,191+r*12,266,132-r*20),n.stroke(),n.strokeStyle="rgba(224, 248, 255, 0.28)",n.lineWidth=3,n.stroke()),i==="forest"){String(e.fogState||"")==="known"&&(n.fillStyle="rgba(24, 137, 132, 0.24)",n.fillRect(0,0,256,256));for(let a=0;a<34;a+=1){let o=38+(a*37+r*93)%178,c=50+(a*53+r*71)%150;ly(n,o,c,.46+a%3*.07,String(e.fogState||"")==="known"?a%4===0?"rgba(18, 101, 103, 0.72)":"rgba(38, 139, 119, 0.64)":a%4===0?"rgba(29, 84, 61, 0.70)":"rgba(42, 119, 72, 0.62)")}n.strokeStyle="rgba(255, 248, 232, 0.22)",n.lineWidth=5}else if(i==="ridge"){n.strokeStyle="rgba(80, 68, 55, 0.48)",n.lineWidth=9;for(let a=0;a<5;a+=1){let o=62+a*30;n.beginPath(),n.moveTo(24,o),n.bezierCurveTo(74,o-26,126,o+24,232,o-12),n.stroke()}n.fillStyle="rgba(255, 248, 232, 0.18)";for(let a=0;a<12;a+=1){let o=30+a*43%180,c=58+a*29%122;n.beginPath(),n.moveTo(o,c-10),n.lineTo(o-12,c+14),n.lineTo(o+15,c+10),n.closePath(),n.fill()}n.strokeStyle="rgba(255, 248, 232, 0.26)",n.lineWidth=4}else if(i==="settled"){n.fillStyle="rgba(255, 248, 232, 0.28)",n.beginPath(),n.ellipse(128,132,78,48,-.18,0,Math.PI*2),n.fill(),n.strokeStyle="rgba(101, 74, 28, 0.22)",n.lineWidth=4;for(let a=0;a<4;a+=1)Hc(n,56,86+a*23,128,.18);Dc(n,112,118,1.05),Dc(n,152,137,.72,"rgba(232, 244, 222, 0.78)"),Dc(n,82,146,.62,"rgba(255, 228, 160, 0.58)"),Jo(n,160,96,.56,"rgba(47, 125, 101, 0.74)"),zc(n,90,86,.42),n.strokeStyle="rgba(27, 106, 100, 0.34)",n.lineWidth=5,n.beginPath(),n.ellipse(128,132,90,58,-.18,0,Math.PI*2),n.stroke(),n.strokeStyle="rgba(255, 248, 232, 0.34)",n.lineWidth=3,n.beginPath(),n.moveTo(58,162),n.bezierCurveTo(112,142,152,167,206,141),n.stroke(),n.strokeStyle="rgba(27, 106, 100, 0.34)",n.lineWidth=5}else if(i==="water"){n.strokeStyle="rgba(46, 122, 152, 0.44)",n.lineWidth=10;for(let a=0;a<6;a+=1){let o=58+a*25;n.beginPath(),n.moveTo(22,o),n.bezierCurveTo(76,o+18,112,o-18,166,o+3),n.bezierCurveTo(194,o+14,218,o-6,236,o+4),n.stroke()}n.strokeStyle="rgba(255, 248, 232, 0.28)",n.lineWidth=4}else if(i==="ruin_signal"){n.fillStyle="rgba(255, 248, 232, 0.18)",n.fillRect(0,0,256,256),n.strokeStyle="rgba(80, 68, 55, 0.36)",n.lineWidth=7;for(let a=0;a<4;a+=1){let o=70+a*29;n.beginPath(),n.moveTo(34,o),n.bezierCurveTo(76,o-16,128,o+14,212,o-8),n.stroke()}cy(n,105,154,.72),Jo(n,160,116,.48,"rgba(101, 74, 28, 0.56)"),n.strokeStyle="rgba(101, 74, 28, 0.32)",n.lineWidth=4}else if(i==="hinted"){n.fillStyle="rgba(226, 134, 40, 0.18)",n.fillRect(0,0,256,256),n.fillStyle="rgba(255, 248, 232, 0.16)";for(let a=0;a<10;a+=1){let o=28+a*22;n.beginPath(),n.ellipse(128+(a%3-1)*22,o,112-a%2*18,12,.12,0,Math.PI*2),n.fill()}n.setLineDash([10,9]),n.strokeStyle="rgba(255, 248, 232, 0.32)",n.lineWidth=4,n.beginPath(),n.ellipse(128,130,72,48,-.15,0,Math.PI*2),n.stroke(),n.setLineDash([]),n.fillStyle="rgba(46, 27, 14, 0.12)",n.beginPath(),n.ellipse(128,136,52,31,-.18,0,Math.PI*2),n.fill(),n.strokeStyle="rgba(138, 109, 65, 0.34)",n.lineWidth=5}else if(i==="locked_unknown"){n.fillStyle="rgba(255, 248, 232, 0.10)";for(let a=-2;a<11;a+=1)n.fillRect(a*31,20,13,220);n.fillStyle="rgba(255, 248, 232, 0.12)";for(let a=0;a<7;a+=1)n.beginPath(),n.ellipse(128,42+a*26,116-a%2*18,11,-.12,0,Math.PI*2),n.fill();n.fillStyle="rgba(68, 58, 48, 0.16)",n.beginPath(),n.ellipse(128,145,60,36,.1,0,Math.PI*2),n.fill(),n.strokeStyle="rgba(255, 248, 232, 0.20)",n.lineWidth=5}else{zc(n,88+r*64,86+r*42,.32),n.strokeStyle="rgba(69, 112, 68, 0.30)",n.lineWidth=5;for(let a=0;a<7;a+=1){let o=48+a*24;n.beginPath(),n.moveTo(26,o),n.bezierCurveTo(84,o-12,144,o+10,230,o-7),n.stroke()}}n.strokeStyle=i==="locked_unknown"?"rgba(255, 248, 232, 0.10)":n.strokeStyle;for(let a=0;a<4;a+=1){let o=60+a*38+r*12;n.beginPath(),n.moveTo(18,o),n.bezierCurveTo(82,o-18,152,o+15,238,o-9),n.stroke()}n.restore()}function dd(n={},e=!1){let t=String(n.fogState||"locked_unknown"),i=jn(n),r=qc(n,i),s=Qo(r),a=s?"asset-ready":r?.slot||"procedural",o=`expedition-cell:${Gt}:${n.cellId}:${t}:${i}:${a}:${e?"selected":"idle"}`;if(ue.has(o))return ue.get(o);let c=Wc(n,e),h=document.createElement("canvas");h.width=256,h.height=256;let u=h.getContext("2d");u.clearRect(0,0,h.width,h.height),u.shadowColor=Jn(c.shadow,e?.34:.24),u.shadowBlur=e?22:13,u.shadowOffsetY=e?9:6,hy(u,n,c,i),s&&(u.save(),bd(u,120,128),u.clip(),u.globalAlpha=t==="locked_unknown"?.74:t==="hinted"?.72:.92,u.drawImage(s,0,0,256,256),u.globalCompositeOperation="multiply",u.globalAlpha=t==="locked_unknown"?.16:.1,u.fillStyle=t==="locked_unknown"?"#3b3228":"#fff8e8",u.fillRect(0,0,256,256),u.restore()),u.shadowColor="transparent",u.shadowBlur=0,u.shadowOffsetY=0;let d=u.createRadialGradient(82,62,12,128,128,130);d.addColorStop(0,"rgba(255, 248, 232, 0.20)"),d.addColorStop(.64,Jn(c.fogOverlay,t==="locked_unknown"?.22:.1)),d.addColorStop(1,Jn(c.shadow,t==="locked_unknown"?.18:.12)),u.fillStyle=d,u.beginPath(),xn(120).forEach((f,g)=>{let v=128+f.x,p=128+f.y;g===0?u.moveTo(v,p):u.lineTo(v,p)}),u.closePath(),u.fill(),u.strokeStyle=Jn(e?c.rim:c.line,e?.98:.76),u.lineWidth=e?13:8,u.beginPath(),xn(116).forEach((f,g)=>{let v=128+f.x,p=128+f.y;g===0?u.moveTo(v,p):u.lineTo(v,p)}),u.closePath(),u.stroke(),t==="hinted"&&(u.setLineDash([12,10]),u.strokeStyle="rgba(46, 27, 14, 0.36)",u.lineWidth=5,u.stroke(),u.setLineDash([]));let l=new at(h);return l.colorSpace=Be,l.minFilter=Se,l.magFilter=Se,ue.set(o,l),l}function uy(n={},e=!1){let t=Q_(n),i=String(n.fogState||"locked_unknown"),r=`expedition-marker:${Gt}:${t}:${i}:${e?"selected":"idle"}`;if(ue.has(r))return ue.get(r);let s=document.createElement("canvas");s.width=192,s.height=192;let a=s.getContext("2d"),o=Wc(n,e);a.clearRect(0,0,s.width,s.height),a.fillStyle="rgba(22, 18, 13, 0.22)",a.beginPath(),a.ellipse(96,154,54,16,0,0,Math.PI*2),a.fill();let c=String(n.kind||""),h=String(n.status||"");a.fillStyle=i==="locked_unknown"?"rgba(46, 39, 32, 0.92)":i==="hinted"?"rgba(209, 154, 72, 0.94)":c==="origin_plot"?"rgba(255, 226, 128, 0.98)":h.includes("SITE_PLAN")?"rgba(154, 225, 216, 0.96)":Jn(o.rim,.94),a.strokeStyle=Jn(o.line,.92),a.lineWidth=e?10:7,a.beginPath(),a.arc(96,84,48,0,Math.PI*2),a.fill(),a.stroke(),a.beginPath(),a.moveTo(96,138),a.lineTo(75,112),a.lineTo(117,112),a.closePath(),a.fill(),a.stroke(),a.fillStyle=i==="locked_unknown"||i==="hinted"?"#fff8e8":"#2e1b0e",a.font="800 34px Georgia, serif",a.textAlign="center",a.textBaseline="middle",a.fillText(t.length>3?t.slice(0,3):t,96,84);let u=new at(s);return u.colorSpace=Be,u.minFilter=Se,u.magFilter=Se,ue.set(r,u),u}function Md(n={}){return String(n.cellId||n.receiptLink?.cellId||n.sourceIds?.cellId||"").trim()}function dy(n={}){return(Array.isArray(n?.eventPackets)?n.eventPackets:[]).filter(e=>e&&typeof e=="object"&&e.packetId&&Md(e))}function fy(n={},e=!1){let t=String(n.packetId||"packet"),i=String(n.templateId||n.kind||"event_packet"),r=`expedition-event-marker:${Gt}:${t}:${i}:${e?"selected":"idle"}`;if(ue.has(r))return ue.get(r);let s=document.createElement("canvas");s.width=192,s.height=192;let a=s.getContext("2d");a.clearRect(0,0,s.width,s.height),a.fillStyle="rgba(46, 27, 14, 0.22)",a.beginPath(),a.ellipse(96,150,48,14,0,0,Math.PI*2),a.fill(),a.fillStyle=e?"rgba(255, 248, 232, 0.94)":"rgba(255, 248, 232, 0.84)",a.strokeStyle=e?"#f5d484":"#8a6d41",a.lineWidth=e?8:6,a.beginPath(),a.roundRect(52,48,88,78,12),a.fill(),a.stroke(),a.strokeStyle="#1b6a64",a.lineWidth=6,a.lineJoin="round",a.beginPath(),a.moveTo(56,60),a.lineTo(96,92),a.lineTo(136,60),a.stroke(),a.fillStyle="#d19a48",a.strokeStyle="#5a3418",a.lineWidth=5,a.beginPath(),a.arc(122,116,17,0,Math.PI*2),a.fill(),a.stroke(),a.fillStyle="#82d6d0",a.globalAlpha=e?.82:.58,a.beginPath(),a.arc(62,42,8,0,Math.PI*2),a.fill(),a.globalAlpha=1,Yc(a,Bi.event_packet,42,34,108,108,16);let o=new at(s);return o.colorSpace=Be,o.minFilter=Se,o.magFilter=Se,ue.set(r,o),o}function py(n={},e=!1){let t=String(n.mode||"inspect"),i=`expedition-objective-marker:${Gt}:${t}:${n.targetCellId||""}:${e?"selected":"idle"}`;if(ue.has(i))return ue.get(i);let r=document.createElement("canvas");r.width=192,r.height=192;let s=r.getContext("2d");s.clearRect(0,0,r.width,r.height);let a=t==="scout"?"rgba(245, 212, 132, 0.40)":t==="packet"?"rgba(130, 214, 208, 0.38)":"rgba(255, 248, 232, 0.30)",o=t==="scout"?"#d19a48":t==="packet"?"#1b6a64":"#8a6d41";s.fillStyle=a,s.beginPath(),s.arc(96,88,e?68:58,0,Math.PI*2),s.fill(),s.fillStyle="rgba(46, 27, 14, 0.22)",s.beginPath(),s.ellipse(96,150,52,15,0,0,Math.PI*2),s.fill(),s.fillStyle=o,s.strokeStyle=e?"#fff8e8":"#5a3418",s.lineWidth=e?9:6,s.beginPath(),s.arc(96,82,38,0,Math.PI*2),s.fill(),s.stroke(),s.strokeStyle="#fff8e8",s.fillStyle="#fff8e8",s.lineWidth=8,s.lineCap="round",s.lineJoin="round",t==="scout"?(s.beginPath(),s.arc(96,82,20,0,Math.PI*2),s.moveTo(96,48),s.lineTo(96,61),s.moveTo(96,103),s.lineTo(96,118),s.moveTo(62,82),s.lineTo(75,82),s.moveTo(117,82),s.lineTo(130,82),s.stroke(),s.beginPath(),s.moveTo(96,58),s.lineTo(108,86),s.lineTo(84,106),s.closePath(),s.fill()):t==="packet"?(s.beginPath(),s.roundRect(72,60,48,44,7),s.moveTo(76,69),s.lineTo(96,86),s.lineTo(116,69),s.stroke()):(s.beginPath(),s.moveTo(72,116),s.lineTo(96,52),s.lineTo(120,116),s.stroke(),s.beginPath(),s.arc(96,56,12,0,Math.PI*2),s.fill()),Yc(s,t==="packet"?Bi.event_packet:Bi.objective_beacon,42,28,108,108,18);let c=new at(r);return c.colorSpace=Be,c.minFilter=Se,c.magFilter=Se,ue.set(i,c),c}function my(n="edge"){let e=`expedition-fog:${Gt}:${n}`;if(ue.has(e))return ue.get(e);let t=document.createElement("canvas");t.width=512,t.height=512;let i=t.getContext("2d"),r=i.createRadialGradient(242,238,38,256,256,250);r.addColorStop(0,n==="locked"?"rgba(135, 129, 112, 0.34)":"rgba(228, 133, 38, 0.46)"),r.addColorStop(.5,n==="locked"?"rgba(116, 108, 92, 0.38)":"rgba(238, 184, 86, 0.42)"),r.addColorStop(.8,n==="locked"?"rgba(78, 70, 58, 0.22)":"rgba(255, 230, 158, 0.22)"),r.addColorStop(1,"rgba(255, 248, 232, 0)"),i.fillStyle=r,i.fillRect(0,0,t.width,t.height),i.strokeStyle=n==="locked"?"rgba(255, 248, 232, 0.18)":"rgba(255, 248, 232, 0.26)",i.lineWidth=8,i.lineCap="round";for(let a=0;a<7;a+=1){let o=104+a*42;i.beginPath(),i.moveTo(30,o),i.bezierCurveTo(130,o-28,262,o+36,480,o-20),i.stroke()}i.save(),i.globalCompositeOperation="multiply",i.strokeStyle=n==="locked"?"rgba(57, 49, 40, 0.18)":"rgba(124, 91, 48, 0.18)",i.lineWidth=3;for(let a=0;a<5;a+=1)i.beginPath(),i.ellipse(254,242+a*5,188-a*22,122-a*13,-.14,0,Math.PI*2),i.stroke();i.restore(),n!=="locked"&&(i.setLineDash([18,16]),i.strokeStyle="rgba(101, 74, 28, 0.24)",i.lineWidth=5,i.beginPath(),i.ellipse(256,256,164,112,-.16,0,Math.PI*2),i.stroke(),i.setLineDash([]));let s=new at(t);return s.colorSpace=Be,s.minFilter=Se,s.magFilter=Se,ue.set(e,s),s}function gy(n,e,t){n.save(),n.globalCompositeOperation="multiply",n.lineCap="round",n.strokeStyle="rgba(46, 27, 14, 0.07)",n.lineWidth=3;for(let i=-1;i<11;i+=1){let r=62+i*58;n.beginPath(),n.moveTo(-70,r),n.bezierCurveTo(124,r-54,282,r+48,474,r-18),n.bezierCurveTo(650,r-78,814,r+40,e+80,r-36),n.stroke()}n.strokeStyle="rgba(27, 106, 100, 0.08)",n.lineWidth=2;for(let i=-2;i<9;i+=1){let r=112+i*128;n.beginPath(),n.moveTo(r,-50),n.bezierCurveTo(r+88,92,r-78,222,r+74,362),n.bezierCurveTo(r+202,480,r-62,546,r+138,t+52),n.stroke()}n.restore(),n.save(),n.strokeStyle="rgba(255, 248, 232, 0.26)",n.lineWidth=2;for(let i=0;i<5;i+=1){let r=610+i*80,s=118+i%2*74;n.beginPath(),n.ellipse(r,s,84+i*10,38+i*4,-.18,0,Math.PI*2),n.stroke()}n.restore()}function _y(n="soft"){let e=`expedition-edge-fog:${Gt}:${n}`;if(ue.has(e))return ue.get(e);let t=document.createElement("canvas");t.width=1024,t.height=256;let i=t.getContext("2d"),r=i.createLinearGradient(0,0,t.width,0);r.addColorStop(0,"rgba(255, 248, 232, 0)"),r.addColorStop(.28,n==="locked"?"rgba(43, 35, 27, 0.30)":"rgba(234, 219, 184, 0.24)"),r.addColorStop(.52,n==="locked"?"rgba(43, 35, 27, 0.54)":"rgba(255, 248, 232, 0.50)"),r.addColorStop(.76,n==="locked"?"rgba(43, 35, 27, 0.30)":"rgba(27, 106, 100, 0.18)"),r.addColorStop(1,"rgba(255, 248, 232, 0)"),i.fillStyle=r,i.fillRect(0,0,t.width,t.height),i.strokeStyle=n==="locked"?"rgba(255, 248, 232, 0.14)":"rgba(255, 248, 232, 0.32)",i.lineWidth=2;for(let a=0;a<12;a+=1){let o=28+a*17;i.beginPath(),i.moveTo(0,o),i.bezierCurveTo(240,o-30,510,o+36,1024,o-18),i.stroke()}i.save(),i.setLineDash([20,14]),i.strokeStyle=n==="locked"?"rgba(255, 248, 232, 0.10)":"rgba(101, 74, 28, 0.22)",i.lineWidth=6,i.beginPath(),i.moveTo(34,132),i.bezierCurveTo(254,74,534,182,990,112),i.stroke(),i.restore();let s=new at(t);return s.colorSpace=Be,s.minFilter=Se,s.magFilter=Se,ue.set(e,s),s}function yy(){let n=`expedition-map-base:${Gt}`;if(ue.has(n))return ue.get(n);let e=document.createElement("canvas");e.width=1024,e.height=640;let t=e.getContext("2d"),i=t.createLinearGradient(0,0,e.width,e.height);i.addColorStop(0,"#f3e4bf"),i.addColorStop(.32,"#d8dfbd"),i.addColorStop(.64,"#b9cfa5"),i.addColorStop(1,"#6aa39b"),t.fillStyle=i,t.fillRect(0,0,e.width,e.height),gy(t,e.width,e.height),t.fillStyle="rgba(72, 152, 124, 0.11)";for(let a=0;a<9;a+=1){let o=-60+a*140;t.beginPath(),t.ellipse(o,470+a%3*18,148,45,-.12,0,Math.PI*2),t.fill()}t.strokeStyle="rgba(101, 74, 28, 0.12)",t.lineWidth=15,t.lineCap="round",t.beginPath(),t.moveTo(-70,452),t.bezierCurveTo(112,385,247,507,399,423),t.bezierCurveTo(552,339,709,440,1094,305),t.stroke(),t.strokeStyle="rgba(255, 248, 232, 0.20)",t.lineWidth=4,t.stroke(),t.fillStyle="rgba(33, 113, 80, 0.13)";for(let a=0;a<68;a+=1){let o=a*83%e.width,c=a*131%e.height,h=28+a*17%74;t.beginPath(),t.ellipse(o,c,h*1.4,h,a%5*.3,0,Math.PI*2),t.fill()}t.strokeStyle="rgba(68, 57, 46, 0.20)",t.lineWidth=6;for(let a=0;a<7;a+=1){let o=102+a*48;t.beginPath(),t.moveTo(554,o),t.bezierCurveTo(615,o-42,706,o+34,804,o-22),t.bezierCurveTo(873,o-60,946,o+11,1070,o-44),t.stroke()}t.strokeStyle="rgba(46, 27, 14, 0.13)",t.lineWidth=2.5;for(let a=54;a<e.height;a+=56)t.beginPath(),t.moveTo(-30,a),t.bezierCurveTo(150,a-36,280,a+42,470,a-8),t.bezierCurveTo(650,a-56,780,a+34,e.width+40,a-22),t.stroke();t.strokeStyle="rgba(27, 106, 100, 0.12)",t.lineWidth=2;for(let a=-70;a<e.width+90;a+=78)t.beginPath(),t.moveTo(a,-20),t.bezierCurveTo(a+120,160,a-90,350,a+140,e.height+30),t.stroke();t.save(),t.setLineDash([18,13]),t.lineCap="round",t.strokeStyle="rgba(101, 74, 28, 0.20)",t.lineWidth=5,[[[-24,248],[122,197,236,277,366,217],[506,154,612,232,714,184],[810,138,916,174,1048,120]],[[424,-20],[500,92,444,198,548,292],[646,382,586,478,742,676]],[[138,636],[226,512,336,564,430,452],[526,336,636,408,760,314],[862,236,930,284,1050,226]]].forEach(a=>{t.beginPath(),t.moveTo(a[0][0],a[0][1]);for(let o=1;o<a.length;o+=1){let c=a[o];t.bezierCurveTo(c[0],c[1],c[2],c[3],c[4],c[5])}t.stroke()}),t.strokeStyle="rgba(255, 248, 232, 0.50)",t.lineWidth=3,[[[-24,248],[122,197,236,277,366,217],[506,154,612,232,714,184],[810,138,916,174,1048,120]],[[424,-20],[500,92,444,198,548,292],[646,382,586,478,742,676]],[[138,636],[226,512,336,564,430,452],[526,336,636,408,760,314],[862,236,930,284,1050,226]]].forEach(a=>{t.beginPath(),t.moveTo(a[0][0],a[0][1]);for(let o=1;o<a.length;o+=1){let c=a[o];t.bezierCurveTo(c[0],c[1],c[2],c[3],c[4],c[5])}t.stroke()}),t.restore(),t.save(),t.globalCompositeOperation="multiply",t.strokeStyle="rgba(46, 27, 14, 0.08)",t.lineWidth=2;for(let a=34;a<e.height;a+=34)Hc(t,42,a,270,.11),Hc(t,676,a+10,250,.09);t.restore(),t.save(),t.globalAlpha=.72,zc(t,170,436,.86),Jo(t,780,180,.84,"rgba(27, 106, 100, 0.58)"),Jo(t,332,222,.58,"rgba(101, 74, 28, 0.52)"),t.restore(),t.strokeStyle="rgba(101, 74, 28, 0.18)",t.lineWidth=2,t.setLineDash([12,10]),t.strokeRect(28,28,e.width-56,e.height-56),t.setLineDash([]);let r=t.createRadialGradient(e.width*.48,e.height*.46,80,e.width*.48,e.height*.46,590);r.addColorStop(0,"rgba(255, 248, 232, 0.12)"),r.addColorStop(.74,"rgba(255, 248, 232, 0)"),r.addColorStop(1,"rgba(46, 27, 14, 0.28)"),t.fillStyle=r,t.fillRect(0,0,e.width,e.height);let s=new at(e);return s.colorSpace=Be,s.wrapS=Jt,s.wrapT=Jt,s.minFilter=Se,s.magFilter=Se,ue.set(n,s),s}function Td(n={}){let e=n.bounds||{minX:-1,maxX:1,minY:-1,maxY:1,centerX:0,centerY:0,width:2,height:2},t=vn*1.72,i=e.minX-t,r=e.maxX+t,s=e.minY-t,a=e.maxY+t;return{minX:i,maxX:r,minY:s,maxY:a,centerX:(i+r)/2,centerY:(s+a)/2,width:Math.max(.01,r-i),height:Math.max(.01,a-s)}}function xy(n={x:0,y:0},e,t){return{x:(n.x-e.minX)/Math.max(.01,e.width)*t.width,y:t.height-(n.y-e.minY)/Math.max(.01,e.height)*t.height}}function qo(n={},e=jn(n)){let t=String(n.fogState||"locked_unknown");return Ti(n)?e==="forest"?{terrain:e,fill:"rgba(42, 126, 86, 0.46)",mid:"rgba(35, 145, 123, 0.26)",edge:"rgba(255, 248, 232, 0)",contour:"rgba(23, 80, 64, 0.20)",bridge:"rgba(43, 126, 91, 0.24)",fogOnly:!1}:e==="ridge"||e==="ruin_signal"?{terrain:e,fill:"rgba(118, 104, 85, 0.42)",mid:"rgba(194, 176, 128, 0.24)",edge:"rgba(255, 248, 232, 0)",contour:"rgba(68, 57, 46, 0.20)",bridge:"rgba(129, 111, 82, 0.22)",fogOnly:!1}:e==="water"?{terrain:e,fill:"rgba(63, 143, 166, 0.42)",mid:"rgba(123, 196, 207, 0.26)",edge:"rgba(255, 248, 232, 0)",contour:"rgba(35, 95, 126, 0.18)",bridge:"rgba(67, 148, 169, 0.22)",fogOnly:!1}:e==="settled"?{terrain:e,fill:"rgba(214, 181, 102, 0.44)",mid:"rgba(73, 143, 128, 0.24)",edge:"rgba(255, 248, 232, 0)",contour:"rgba(101, 74, 28, 0.18)",bridge:"rgba(196, 165, 94, 0.22)",fogOnly:!1}:{terrain:e,fill:"rgba(121, 158, 90, 0.38)",mid:"rgba(216, 209, 151, 0.22)",edge:"rgba(255, 248, 232, 0)",contour:"rgba(68, 91, 63, 0.17)",bridge:"rgba(124, 156, 97, 0.20)",fogOnly:!1}:t==="hinted"?{terrain:"hinted",fill:"rgba(224, 150, 52, 0.46)",mid:"rgba(245, 212, 132, 0.32)",edge:"rgba(255, 248, 232, 0)",contour:"rgba(101, 74, 28, 0.18)",bridge:"rgba(214, 148, 58, 0.20)",fogOnly:!0}:{terrain:"locked_unknown",fill:"rgba(157, 150, 132, 0.30)",mid:"rgba(104, 96, 82, 0.20)",edge:"rgba(255, 248, 232, 0)",contour:"rgba(255, 248, 232, 0.13)",bridge:"rgba(134, 126, 111, 0.14)",fogOnly:!0}}function vy(n,e,t,i,r=0){let s=(e.x+t.x)/2,a=(e.y+t.y)/2,o=22+r*26;n.save(),n.filter="blur(13px)",n.lineCap="round",n.strokeStyle=i.bridge,n.lineWidth=104,n.beginPath(),n.moveTo(e.x,e.y),n.quadraticCurveTo(s,a-o,t.x,t.y),n.stroke(),n.restore()}function Sy(n,e,t,i,r=0){n.save();let s=n.createRadialGradient(e.x-t*.22,e.y-t*.24,t*.08,e.x,e.y,t);s.addColorStop(0,i.fill),s.addColorStop(.54,i.mid),s.addColorStop(1,i.edge),n.filter="blur(9px)",n.fillStyle=s,n.beginPath(),n.arc(e.x,e.y,t,0,Math.PI*2),n.fill(),n.restore(),n.save(),n.translate(e.x,e.y),n.rotate((r-.5)*.26),n.scale(1.28,.82),n.strokeStyle=i.contour,n.lineWidth=5,n.lineCap="round";for(let a=-2;a<=2;a+=1){let o=a*t*.18;n.beginPath(),n.moveTo(-t*.78,o),n.bezierCurveTo(-t*.34,o-t*.17,t*.18,o+t*.16,t*.76,o-t*.08),n.stroke()}i.fogOnly&&(n.setLineDash([15,13]),n.strokeStyle=i.terrain==="locked_unknown"?"rgba(255, 248, 232, 0.14)":"rgba(101, 74, 28, 0.22)",n.lineWidth=4,n.beginPath(),n.ellipse(0,0,t*.58,t*.34,-.08,0,Math.PI*2),n.stroke()),n.restore()}function by(n=[],e=Sd(n)){let t=Qo(yd),i=n.map(d=>`${d.cellId}:${d.fogState}:${jn(d)}:${d.publicTerrainAssetSlot||""}:${d.fogAssetSlot||""}`).join("|"),r=`expedition-continuous-underlay:${Gt}:${i}:${t?"promoted-underlay-ready":"promoted-underlay-pending"}`;if(ue.has(r))return ue.get(r);let s=document.createElement("canvas");s.width=1024,s.height=768;let a=s.getContext("2d"),o=Td(e),c=new Map;for(let d of n){let l=e.positions.get(String(d.cellId||""));l&&c.set(String(d.cellId||""),xy(l,o,s))}a.clearRect(0,0,s.width,s.height),a.fillStyle="rgba(255, 248, 232, 0.04)",a.fillRect(0,0,s.width,s.height),t&&(a.save(),a.globalAlpha=.68,a.drawImage(t,0,0,s.width,s.height),a.globalCompositeOperation="screen",a.globalAlpha=.18,a.fillStyle="rgba(255, 248, 232, 0.70)",a.fillRect(0,0,s.width,s.height),a.restore());for(let d=0;d<n.length;d+=1)for(let l=d+1;l<n.length;l+=1){let f=n[d],g=n[l];if(!$c(f,g))continue;let v=c.get(String(f.cellId||"")),p=c.get(String(g.cellId||""));if(!v||!p)continue;let m=qo(f),_=qo(g),x=m.terrain==="locked_unknown"||_.terrain==="locked_unknown"?{bridge:"rgba(134, 126, 111, 0.12)"}:{bridge:m.fogOnly?m.bridge:_.fogOnly?_.bridge:"rgba(75, 132, 105, 0.20)"};vy(a,v,p,x,Zo(`${f.cellId}:${g.cellId}:underlay`))}let h=Math.min(s.width/o.width,s.height/o.height);for(let d of n){let l=c.get(String(d.cellId||""));if(!l)continue;let f=jn(d),g=qo(d,f),v=h*vn*(g.fogOnly?1.28:1.38);Sy(a,l,v,g,Zo(`${d.cellId}:${f}:underlay`))}a.save(),a.globalCompositeOperation="multiply",a.strokeStyle="rgba(46, 27, 14, 0.06)",a.lineWidth=2;for(let d=42;d<s.height;d+=36)a.beginPath(),a.moveTo(-40,d),a.bezierCurveTo(150,d-24,298,d+28,482,d-8),a.bezierCurveTo(648,d-42,818,d+22,s.width+40,d-16),a.stroke();a.restore();let u=new at(s);return u.colorSpace=Be,u.minFilter=Se,u.magFilter=Se,ue.set(r,u),u}function My(){let n=`expedition-civic-beacon:${Gt}`;if(ue.has(n))return ue.get(n);let e=document.createElement("canvas");e.width=256,e.height=256;let t=e.getContext("2d");t.clearRect(0,0,e.width,e.height);let i=t.createRadialGradient(128,126,16,128,126,116);i.addColorStop(0,"rgba(245, 212, 132, 0.48)"),i.addColorStop(.48,"rgba(27, 106, 100, 0.18)"),i.addColorStop(1,"rgba(255, 248, 232, 0)"),t.fillStyle=i,t.fillRect(0,0,e.width,e.height),t.strokeStyle="rgba(46, 27, 14, 0.42)",t.lineWidth=9,t.lineCap="round",t.beginPath(),t.moveTo(128,174),t.lineTo(128,80),t.stroke(),t.strokeStyle="rgba(27, 106, 100, 0.42)",t.lineWidth=5;for(let s=0;s<3;s+=1)t.beginPath(),t.arc(128,83,30+s*22,-.78,.78),t.stroke();t.fillStyle="rgba(245, 212, 132, 0.86)",t.strokeStyle="rgba(46, 27, 14, 0.44)",t.lineWidth=5,t.beginPath(),t.moveTo(136,76),t.lineTo(188,94),t.lineTo(136,116),t.closePath(),t.fill(),t.stroke(),t.fillStyle="rgba(255, 248, 232, 0.54)",t.beginPath(),t.roundRect(91,174,74,25,8),t.fill();let r=new at(e);return r.colorSpace=Be,r.minFilter=Se,r.magFilter=Se,ue.set(n,r),r}function Ty(n={},e={x:0,y:0},t=!1,i=!1){let r=Wc(n,t),s=String(n.fogState||""),a=jn(n),o=new fn;o.position.set(e.x,e.y,0);let c=vn*(t?1.04:i?1.02:1),h=new dt(hd(c),new Ft({color:16777215,map:dd(n,t),transparent:!0,opacity:ey(s,t,i),side:Bt,depthWrite:!1}));h.position.z=-.1,h.userData={kind:"expedition_cell",cellId:String(n.cellId||""),fogState:String(n.fogState||""),terrain:a,regionPlate:!0,waterCue:a==="water",status:String(n.status||""),title:String(n.title||""),selected:t,hovered:i},o.add(h);let u=new Rn(new it().setFromPoints(xn(c*1.01)),new Nt({color:t?r.rim:r.line,transparent:!0,opacity:ny(s,t,i)}));u.position.z=-.04,o.add(u);let d=new dt(cd(Hi*1.16),new Ft({color:r.shadow,transparent:!0,opacity:t?.18:.08,side:Bt,depthWrite:!1}));d.position.set(.08,-.09,-.01),o.add(d);let l=new dt(hd(Hi),new Ft({color:16777215,map:dd(n,t),transparent:!0,opacity:ty(r,s,t,i),side:Bt,depthWrite:!1}));l.position.z=.02,l.userData={kind:"expedition_cell",cellId:String(n.cellId||""),fogState:String(n.fogState||""),terrain:a,waterCue:a==="water",status:String(n.status||""),title:String(n.title||""),selected:t,hovered:i},o.add(l);let f=new Rn(new it().setFromPoints(xn(Hi*(t?1.08:1))),new Nt({color:r.line,transparent:!0,opacity:iy(r,s,t,i)}));if(f.position.z=.08,o.add(f),t){let v=new Rn(new it().setFromPoints(xn(c*1.08)),new Nt({color:r.rim,transparent:!0,opacity:.82}));v.position.z=.16,o.add(v)}if(i&&!t){let v=new Rn(new it().setFromPoints(xn(c*1.04)),new Nt({color:16775400,transparent:!0,opacity:.7}));v.position.z=.15,o.add(v)}if(s==="discovered"&&a==="settled"){let v=new Rn(new it().setFromPoints(xn(c*1.14)),new Nt({color:16774340,transparent:!0,opacity:.44}));v.position.z=.14,o.add(v);let p=new dt(cd(c*1.02),new Ft({color:16774340,transparent:!0,opacity:.07,side:Bt,depthWrite:!1}));p.position.z=.07,o.add(p)}if(s==="locked_unknown"){let v=new gr(new it().setFromPoints([new C(-.32,-.3,.1),new C(.32,.3,.1),new C(-.34,.02,.1),new C(.12,.46,.1),new C(-.1,-.46,.1),new C(.34,-.02,.1)]),new Nt({color:16775400,transparent:!0,opacity:.16}));o.add(v)}if(s==="hinted"&&String(n.kind||"")==="frontier_hint"){let v=new Rn(new it().setFromPoints(xn(c*1.03)),new Nt({color:1796708,transparent:!0,opacity:.64}));v.position.z=.12,o.add(v)}let g=new bt(new yt({map:uy(n,t),transparent:!0,depthTest:!0,depthWrite:!1,alphaTest:.03}));return g.position.set(0,t?.03:-.01,.2),g.scale.set(t?.72:.54,t?.72:.54,1),o.add(g),o}function $c(n={},e={}){let t=me(n.q,0),i=me(n.r,0),r=me(e.q,0),s=me(e.r,0),a=t-r,o=i-s;return Math.max(Math.abs(a),Math.abs(o),Math.abs(a+o))===1}function Ey(n={},e={}){let t=[String(n.fogState||""),String(e.fogState||"")];return t.includes("locked_unknown")?null:t.includes("hinted")?{color:9071937,glow:16110724,opacity:.34,dash:[.16,.16]}:{color:1796708,glow:16110724,opacity:.5,dash:[.18,.13]}}function wy(n,e,t){let i=Ey(n,e);if(!i)return null;let r=t.positions.get(String(n.cellId||"")),s=t.positions.get(String(e.cellId||""));if(!r||!s)return null;let a=new C((r.x+s.x)/2,(r.y+s.y)/2,-.2),o=.08+Zo(`${n.cellId}:${e.cellId}`)*.1,c=new ui(new C(r.x,r.y,-.2),new C(a.x,a.y+o,-.2),new C(s.x,s.y,-.2)),h=new it().setFromPoints(c.getPoints(32)),u=new pn(h,new Sr({color:i.color,transparent:!0,opacity:i.opacity,dashSize:i.dash[0],gapSize:i.dash[1]}));u.computeLineDistances(),u.userData={kind:"expedition_receipt_trace",routeAuthority:!1,visualOnly:!0};let d=new pn(h.clone(),new Nt({color:i.glow,transparent:!0,opacity:.14}));d.position.z=-.02,d.userData={kind:"expedition_receipt_trace_glow",routeAuthority:!1,visualOnly:!0};let l=new fn;return l.add(d,u),l.userData={kind:"expedition_receipt_trace_group",routeAuthority:!1,visualOnly:!0},l}function Ed(n={}){switch(String(n.unitType||n.role||"").toLowerCase()){case"scout":return{fill:"#1f756e",stroke:"#102f2f",accent:"#d6f1ef",glow:"#f5d484",glyph:"compass"};case"courier":return{fill:"#b95368",stroke:"#4f202b",accent:"#fff0bd",glow:"#78a9d6",glyph:"flag"};case"surveyor":return{fill:"#7a6540",stroke:"#342719",accent:"#d6f1ef",glow:"#82d6d0",glyph:"tripod"};case"settler_convoy":return{fill:"#c4883a",stroke:"#5a3418",accent:"#fff8e8",glow:"#f5d484",glyph:"wagon"};case"outpost_crew":return{fill:"#637f58",stroke:"#223a25",accent:"#ffe4a0",glow:"#82d6d0",glyph:"beacon"};default:return{fill:"#8a6d41",stroke:"#3b2513",accent:"#fff8e8",glow:"#82d6d0",glyph:"ledger"}}}function Ay(n={},e=!1){let t=`expedition-unit:${Gt}:${n.unitType}:${n.unitId}:${e?"selected":"idle"}`;if(ue.has(t))return ue.get(t);let i=Ed(n),r=document.createElement("canvas");r.width=192,r.height=192;let s=r.getContext("2d");s.clearRect(0,0,r.width,r.height),s.fillStyle="rgba(46, 27, 14, 0.24)",s.beginPath(),s.ellipse(96,146,55,18,0,0,Math.PI*2),s.fill(),s.fillStyle=e?"rgba(245, 212, 132, 0.34)":"rgba(255, 248, 232, 0.20)",s.strokeStyle=e?"#f5d484":"rgba(59, 37, 19, 0.55)",s.lineWidth=e?9:6,s.beginPath(),s.roundRect(38,30,116,116,34),s.fill(),s.stroke(),s.fillStyle=i.fill,s.strokeStyle=i.stroke,s.lineWidth=8,s.beginPath(),s.arc(96,88,42,0,Math.PI*2),s.fill(),s.stroke(),s.strokeStyle=i.accent,s.fillStyle=i.accent,s.lineWidth=8,s.lineCap="round",s.lineJoin="round",i.glyph==="compass"?(s.beginPath(),s.arc(96,88,24,0,Math.PI*2),s.moveTo(96,52),s.lineTo(96,66),s.moveTo(96,110),s.lineTo(96,124),s.moveTo(60,88),s.lineTo(74,88),s.moveTo(118,88),s.lineTo(132,88),s.stroke(),s.beginPath(),s.moveTo(96,58),s.lineTo(108,92),s.lineTo(84,118),s.closePath(),s.fill()):i.glyph==="flag"?(s.beginPath(),s.moveTo(80,122),s.lineTo(80,56),s.lineTo(124,68),s.lineTo(80,84),s.stroke()):i.glyph==="wagon"?(s.beginPath(),s.roundRect(66,80,60,34,9),s.stroke(),s.beginPath(),s.arc(78,124,9,0,Math.PI*2),s.arc(116,124,9,0,Math.PI*2),s.stroke()):i.glyph==="beacon"?(s.beginPath(),s.moveTo(72,124),s.lineTo(96,58),s.lineTo(120,124),s.stroke(),s.beginPath(),s.arc(96,62,15,0,Math.PI*2),s.fill()):i.glyph==="tripod"?(s.beginPath(),s.moveTo(96,58),s.lineTo(96,92),s.moveTo(96,92),s.lineTo(70,126),s.moveTo(96,92),s.lineTo(122,126),s.moveTo(76,70),s.lineTo(116,70),s.stroke(),s.beginPath(),s.arc(96,56,13,0,Math.PI*2),s.fill()):(s.beginPath(),s.roundRect(68,62,56,60,8),s.stroke(),s.beginPath(),s.moveTo(80,82),s.lineTo(112,82),s.moveTo(80,100),s.lineTo(106,100),s.stroke()),Yc(s,Ko(n),28,22,136,136,34),s.fillStyle=i.glow,s.globalAlpha=e?.8:.46,s.beginPath(),s.arc(136,47,e?8:6,0,Math.PI*2),s.fill(),s.globalAlpha=1;let a=new at(r);return a.colorSpace=Be,a.minFilter=Se,a.magFilter=Se,ue.set(t,a),a}function Cy(n={}){return(Array.isArray(n.commandHints)?n.commandHints:[]).filter(e=>e?.enabled!==!1).length}function fd(n=""){let e=String(n||"").replace(/^cell[_-]?/i,"").replace(/_/g," ").trim(),t=e.match(/q(-?\d+)/i)?.[1],i=e.match(/r(-?\d+)/i)?.[1];return t!=null&&i!=null?`Q${t} R${i}`:e?e.toUpperCase().slice(0,8):"MAP"}function jo(n={}){let e=String(n.displayName||"").trim();if(e){let i=e.split(/\s+/).filter(Boolean);return i.length>1?i.map(r=>r[0]).join("").slice(0,3).toUpperCase():e.slice(0,3).toUpperCase()}let t=String(n.unitType||"").replace(/_/g," ");return/settler/i.test(t)?"STL":/outpost/i.test(t)?"OUT":/surveyor/i.test(t)?"SRV":/courier/i.test(t)?"CR":/scout/i.test(t)?"SCT":"UNT"}function Ry(n={},e=!1){let t=Ko(n),i=!!Kn(t),r=`expedition-hud-profile:${sn}:${n.unitId}:${n.unitType}:${i?"asset":"fallback"}:${e?"selected":"idle"}`;if(ue.has(r))return ue.get(r);let s=document.createElement("canvas");s.width=256,s.height=256;let a=s.getContext("2d"),o=Ed(n);a.clearRect(0,0,s.width,s.height),a.fillStyle="rgba(4, 16, 15, 0.42)",a.beginPath(),a.ellipse(128,214,78,20,0,0,Math.PI*2),a.fill();let c=a.createRadialGradient(88,54,10,128,126,118);c.addColorStop(0,"rgba(255, 248, 232, 0.96)"),c.addColorStop(.38,e?"rgba(245, 212, 132, 0.96)":"rgba(130, 214, 208, 0.74)"),c.addColorStop(.74,e?"rgba(183, 142, 70, 0.92)":"rgba(27, 106, 100, 0.82)"),c.addColorStop(1,"rgba(46, 27, 14, 0.95)"),a.fillStyle=c,a.beginPath(),a.arc(128,122,92,0,Math.PI*2),a.fill(),a.save(),a.beginPath(),a.arc(128,122,69,0,Math.PI*2),a.clip();let h=Kn(t);if(h)a.drawImage(h,45,38,166,166);else{let f=a.createRadialGradient(110,76,16,128,126,82);f.addColorStop(0,o.accent),f.addColorStop(1,o.fill),a.fillStyle=f,a.fillRect(45,38,166,166),a.fillStyle=o.accent,a.font="900 54px Georgia, serif",a.textAlign="center",a.textBaseline="middle",a.fillText(jo(n),128,122,112)}a.globalCompositeOperation="multiply",a.fillStyle=e?"rgba(255, 248, 232, 0.03)":"rgba(12, 33, 30, 0.13)",a.fillRect(45,38,166,166),a.globalCompositeOperation="screen";let u=a.createLinearGradient(48,38,206,184);u.addColorStop(0,"rgba(255, 248, 232, 0.18)"),u.addColorStop(.55,"rgba(255, 248, 232, 0.02)"),u.addColorStop(1,"rgba(12, 33, 30, 0.00)"),a.fillStyle=u,a.fillRect(45,38,166,166),a.restore(),a.strokeStyle=e?"#f5d484":"rgba(255, 248, 232, 0.72)",a.lineWidth=e?10:7,a.beginPath(),a.arc(128,122,72,0,Math.PI*2),a.stroke(),a.strokeStyle="rgba(12, 33, 30, 0.62)",a.lineWidth=5,a.beginPath(),a.arc(128,122,90,-.84,Math.PI*1.38),a.stroke();for(let f=0;f<8;f+=1){let g=Math.PI*2*f/8;Rs(a,128+Math.cos(g)*88,122+Math.sin(g)*88,e?4.5:3.8,f%2===0)}let d=a.createLinearGradient(82,186,174,219);d.addColorStop(0,e?"rgba(255, 248, 232, 0.98)":"rgba(255, 248, 232, 0.92)"),d.addColorStop(1,e?"rgba(245, 212, 132, 0.92)":"rgba(130, 214, 208, 0.64)"),a.fillStyle=d,a.strokeStyle="rgba(46, 27, 14, 0.58)",a.lineWidth=4,a.beginPath(),a.roundRect(80,187,96,31,11),a.fill(),a.stroke(),a.fillStyle="#2e1b0e",a.font='900 18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',a.textAlign="center",a.textBaseline="middle",a.fillText(jo(n),128,203,74);let l=new at(s);return l.colorSpace=Be,l.minFilter=Se,l.magFilter=Se,ue.set(r,l),l}function Iy(n={}){let e=n.objective&&typeof n.objective=="object"?n.objective:{},t=String(e.mode||"").toLowerCase();return t.includes("packet")?"PLAN":t.includes("review")?"REVIEW":t.includes("convoy")?"CONVOY":t.includes("settle")||t.includes("found")?"FOUND":t.includes("scout")?"SCOUT":e.targetCellId?"NEXT":"READY"}function wd(n=""){let e=String(n||"");return e==="move_unit"?"\u21A6":e==="scout_sector"?"\u2316":e==="prepare_settler_convoy"?"\u25A3":e==="found_settlement"?"\u2302":/inspect/i.test(e)?"\u25C7":"\u2726"}function Ad(n={}){let e=String(n.commandId||"");return e==="move_unit"?"MOVE":e==="scout_sector"?"SCOUT":e==="prepare_settler_convoy"?"CONVOY":e==="found_settlement"?"FOUND":String(n.label||e||"CMD").replace(/_/g," ").trim().split(/\s+/).filter(Boolean).slice(0,2).join(" ").toUpperCase()||"CMD"}function Py(n={}){return(Array.isArray(n.commandHints)?n.commandHints:[]).filter(t=>t&&String(t.commandId||"").trim()).slice(0,5).map(t=>({commandId:String(t.commandId||""),enabled:t.enabled!==!1,glyph:wd(t.commandId),label:Ad(t)}))}function Rs(n,e,t,i=7,r=!0){let s=n.createRadialGradient(e-i*.35,t-i*.45,1,e,t,i*1.18);s.addColorStop(0,r?"rgba(255, 248, 232, 0.95)":"rgba(245, 212, 132, 0.82)"),s.addColorStop(.45,"rgba(182, 151, 84, 0.92)"),s.addColorStop(1,"rgba(46, 27, 14, 0.86)"),n.fillStyle=s,n.beginPath(),n.arc(e,t,i,0,Math.PI*2),n.fill(),n.strokeStyle="rgba(12, 33, 30, 0.55)",n.lineWidth=Math.max(1.5,i*.24),n.stroke()}function Dy(n,e,t,i=.12){n.save(),n.globalAlpha=i;for(let r=0;r<120;r+=1){let s=(r*97+23)%e,a=(r*53+41)%t,o=1+r%3;n.fillStyle=r%2===0?"rgba(255, 248, 232, 0.55)":"rgba(12, 33, 30, 0.45)",n.fillRect(s,a,o,1)}n.restore()}function Ly(n=""){let e=["crest-status","command-tray","command-puck","collapsed-ledger","selected-context"].includes(n),t=["unit-dock","command-tray","command-puck"].includes(n);return{darkHardware:e,bottomHardware:t,outerA:e?"rgba(10, 44, 41, 0.96)":"rgba(78, 58, 32, 0.86)",outerB:e?"rgba(23, 90, 84, 0.92)":"rgba(183, 142, 70, 0.76)",outerC:e?"rgba(45, 31, 18, 0.92)":"rgba(18, 58, 52, 0.72)",insetA:e?"rgba(16, 45, 41, 0.76)":"rgba(255, 248, 232, 0.72)",insetB:e?"rgba(41, 69, 58, 0.64)":"rgba(222, 201, 143, 0.62)",strokeA:"rgba(245, 212, 132, 0.78)",strokeB:e?"rgba(130, 214, 208, 0.34)":"rgba(46, 27, 14, 0.34)",shadow:t?"rgba(4, 16, 15, 0.40)":"rgba(4, 16, 15, 0.26)",glow:e?"rgba(130, 214, 208, 0.38)":"rgba(245, 212, 132, 0.34)"}}function Fy(n={}){let e=String(n.commandId||"command"),t=String(n.glyph||wd(e)).slice(0,3),i=String(n.label||Ad(n)).toUpperCase().slice(0,10),r=n.enabled!==!1,s=`expedition-hud-command:${sn}:${e}:${r?"enabled":"disabled"}:${t}:${i}`;if(ue.has(s))return ue.get(s);let a=document.createElement("canvas");a.width=256,a.height=256;let o=a.getContext("2d");o.clearRect(0,0,a.width,a.height),o.fillStyle="rgba(4, 16, 15, 0.38)",o.beginPath(),o.ellipse(128,213,72,18,0,0,Math.PI*2),o.fill();let c=o.createRadialGradient(82,58,12,128,120,108);c.addColorStop(0,r?"rgba(255, 248, 232, 0.98)":"rgba(190, 184, 156, 0.72)"),c.addColorStop(.33,r?"rgba(245, 212, 132, 0.92)":"rgba(101, 113, 104, 0.62)"),c.addColorStop(.68,r?"rgba(27, 106, 100, 0.90)":"rgba(33, 48, 45, 0.74)"),c.addColorStop(1,"rgba(46, 27, 14, 0.92)"),o.fillStyle=c,o.beginPath(),o.arc(128,113,86,0,Math.PI*2),o.fill(),o.strokeStyle=r?"rgba(46, 27, 14, 0.76)":"rgba(46, 27, 14, 0.46)",o.lineWidth=11,o.beginPath(),o.arc(128,113,78,0,Math.PI*2),o.stroke(),o.strokeStyle=r?"rgba(255, 248, 232, 0.78)":"rgba(255, 248, 232, 0.36)",o.lineWidth=4,o.beginPath(),o.arc(128,113,64,0,Math.PI*2),o.stroke(),[60,196].forEach(d=>Rs(o,d,113,6,r)),o.fillStyle=r?"#fff8e8":"rgba(255, 248, 232, 0.56)",o.strokeStyle=r?"rgba(12, 33, 30, 0.72)":"rgba(12, 33, 30, 0.42)",o.lineWidth=8,o.textAlign="center",o.textBaseline="middle",o.shadowColor=r?"rgba(245, 212, 132, 0.38)":"transparent",o.shadowBlur=r?12:0,o.font="900 68px Georgia, serif",o.strokeText(t,128,108,116),o.fillText(t,128,108,116),o.shadowBlur=0;let h=o.createLinearGradient(54,176,202,212);h.addColorStop(0,r?"rgba(255, 248, 232, 0.96)":"rgba(190, 184, 156, 0.62)"),h.addColorStop(1,r?"rgba(245, 212, 132, 0.80)":"rgba(101, 113, 104, 0.48)"),o.fillStyle=h,o.strokeStyle="rgba(46, 27, 14, 0.66)",o.lineWidth=4,o.beginPath(),o.roundRect(54,178,148,34,10),o.fill(),o.stroke(),o.fillStyle=r?"#2e1b0e":"rgba(46, 27, 14, 0.62)",o.font='900 18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',o.fillText(i,128,196,118);let u=new at(a);return u.colorSpace=Be,u.minFilter=Se,u.magFilter=Se,ue.set(s,u),u}function Ny(n={}){let e=String(n.slot||""),t=String(n.title||"").toUpperCase().slice(0,18),i=String(n.meta||"").toUpperCase().slice(0,24),r=String(n.tone||"light"),s=`expedition-hud-text:${sn}:${e}:${r}:${t}:${i}`;if(ue.has(s))return ue.get(s);let a=document.createElement("canvas");a.width=768,a.height=192;let o=a.getContext("2d");o.clearRect(0,0,a.width,a.height);let c=r!=="dark",h=e==="command-puck",u=h?384:36,d=h?384:40,l=h?70:12,f=h?628:704,g=o.createLinearGradient(l,20,l+f,168);g.addColorStop(0,c?"rgba(10, 44, 41, 0.78)":"rgba(255, 248, 232, 0.82)"),g.addColorStop(.48,c?"rgba(27, 106, 100, 0.58)":"rgba(242, 224, 171, 0.74)"),g.addColorStop(1,c?"rgba(46, 27, 14, 0.70)":"rgba(183, 142, 70, 0.52)"),o.fillStyle=g,o.strokeStyle=c?"rgba(245, 212, 132, 0.62)":"rgba(46, 27, 14, 0.42)",o.lineWidth=5,o.beginPath(),o.roundRect(l,26,f,134,20),o.fill(),o.stroke(),o.globalAlpha=.86,o.strokeStyle=c?"rgba(130, 214, 208, 0.32)":"rgba(255, 248, 232, 0.34)",o.lineWidth=2,o.beginPath(),o.moveTo(l+22,50),o.lineTo(l+f-22,50),o.moveTo(l+22,142),o.lineTo(l+f-22,142),o.stroke(),o.globalAlpha=1,o.fillStyle=c?"rgba(255, 248, 232, 0.98)":"rgba(46, 27, 14, 0.95)",o.strokeStyle=c?"rgba(12, 33, 30, 0.70)":"rgba(255, 248, 232, 0.60)",o.shadowColor=c?"rgba(12, 33, 30, 0.52)":"rgba(255, 248, 232, 0.24)",o.shadowBlur=c?8:5,o.lineWidth=7,o.textAlign=h?"center":"left",o.textBaseline="middle",o.font='900 54px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',t&&(o.strokeText(t,u,76,h?560:640),o.fillText(t,u,76,h?560:640)),o.font='850 30px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',o.globalAlpha=.9,i&&(o.strokeText(i,d,132,h?520:610),o.fillText(i,d,132,h?520:610)),o.globalAlpha=1,o.shadowBlur=0;let v=new at(a);return v.colorSpace=Be,v.minFilter=Se,v.magFilter=Se,ue.set(s,v),v}function Oy(n={}){let e=String(n.slot||"hud"),t=`expedition-clean-hud-chrome:${sn}:${ws}:${e}`;if(ue.has(t))return ue.get(t);let i=e==="collapsed-ledger",r=e==="command-puck",s=document.createElement("canvas");s.width=i?256:r?384:1024,s.height=i?1024:r?384:320;let a=s.getContext("2d"),o=s.width,c=s.height,h=r?28:i?24:34,u=r?148:i?56:64,d=Ly(e);a.clearRect(0,0,o,c),a.save(),a.shadowColor=d.shadow,a.shadowBlur=d.bottomHardware?28:18,a.shadowOffsetY=d.bottomHardware?12:6;let l=a.createLinearGradient(0,0,o,c);l.addColorStop(0,d.outerA),l.addColorStop(.46,d.outerB),l.addColorStop(1,d.outerC),a.fillStyle=l,a.beginPath(),a.roundRect(h,h,o-h*2,c-h*2,u),a.fill(),a.restore(),a.save(),a.beginPath(),a.roundRect(h,h,o-h*2,c-h*2,u),a.clip(),Dy(a,o,c,d.darkHardware?.16:.1),a.restore();let f=a.createLinearGradient(h,h,o-h,c-h);f.addColorStop(0,"rgba(255, 248, 232, 0.56)"),f.addColorStop(.24,d.strokeA),f.addColorStop(.72,"rgba(46, 27, 14, 0.34)"),f.addColorStop(1,d.strokeB),a.strokeStyle=f,a.lineWidth=r?12:9,a.beginPath(),a.roundRect(h+5,h+5,o-(h+5)*2,c-(h+5)*2,Math.max(18,u-8)),a.stroke();let g=h+(r?34:i?28:30),v=a.createLinearGradient(g,g,o-g,c-g);v.addColorStop(0,d.insetA),v.addColorStop(1,d.insetB),a.fillStyle=v,a.strokeStyle=d.strokeB,a.lineWidth=r?5:4,a.beginPath(),a.roundRect(g,g,o-g*2,c-g*2,Math.max(16,u-28)),a.fill(),a.stroke();let p=h+18;if([[p,p],[o-p,p],[p,c-p],[o-p,c-p]].forEach(([_,x],M)=>Rs(a,_,x,r?9:i?6:7,M<2)),a.globalAlpha=.72,a.strokeStyle=d.darkHardware?"rgba(255, 248, 232, 0.50)":"rgba(46, 27, 14, 0.40)",a.fillStyle=d.darkHardware?"rgba(255, 248, 232, 0.18)":"rgba(12, 33, 30, 0.12)",a.lineWidth=4,e==="unit-dock"){let _=c*.62;a.strokeStyle="rgba(46, 27, 14, 0.48)",a.lineWidth=5,a.beginPath(),a.moveTo(o*.3,_),a.lineTo(o*.9,_),a.stroke(),a.strokeStyle="rgba(245, 212, 132, 0.42)",a.lineWidth=3;for(let x=0;x<6;x+=1){let M=o*.43+x*o*.085;a.beginPath(),a.arc(M,_-10,42,0,Math.PI*2),a.stroke(),a.beginPath(),a.arc(M,_-10,27,0,Math.PI*2),a.stroke()}a.strokeStyle="rgba(12, 33, 30, 0.54)",a.lineWidth=5,a.beginPath(),a.arc(158,c/2,86,0,Math.PI*2),a.stroke(),a.strokeStyle="rgba(245, 212, 132, 0.42)",a.lineWidth=3,a.beginPath(),a.arc(158,c/2,54,0,Math.PI*2),a.stroke(),a.strokeStyle="rgba(245, 212, 132, 0.30)",a.lineWidth=8,a.beginPath(),a.moveTo(o*.82,c*.4),a.bezierCurveTo(o*.9,c*.44,o*.95,c*.58,o*.99,c*.62),a.stroke(),a.strokeStyle="rgba(12, 33, 30, 0.38)",a.lineWidth=4,a.beginPath(),a.moveTo(o*.84,c*.73),a.lineTo(o*.98,c*.73),a.stroke()}else if(e==="crest-status"){let x=c/2;a.strokeStyle="rgba(245, 212, 132, 0.72)",a.lineWidth=6,a.beginPath(),a.arc(156,x,72,0,Math.PI*2),a.stroke(),a.strokeStyle="rgba(130, 214, 208, 0.42)",a.lineWidth=3,a.beginPath(),a.arc(156,x,50,0,Math.PI*2),a.stroke(),a.fillStyle="rgba(255, 248, 232, 0.62)",a.beginPath(),a.moveTo(156,x-48),a.lineTo(182,x),a.lineTo(156,x+48),a.lineTo(130,x),a.closePath(),a.fill(),a.stroke()}else if(e==="collapsed-ledger"){a.strokeStyle="rgba(245, 212, 132, 0.58)",a.lineWidth=5,a.beginPath(),a.moveTo(o/2,128),a.lineTo(o/2,c-128),a.stroke();for(let _=0;_<7;_+=1){let x=180+_*96;a.fillStyle=_%2===0?"rgba(255, 248, 232, 0.26)":"rgba(130, 214, 208, 0.20)",a.beginPath(),a.arc(o/2,x,22,0,Math.PI*2),a.fill(),a.stroke()}}else if(e==="command-puck")a.strokeStyle="rgba(245, 212, 132, 0.68)",a.lineWidth=8,a.beginPath(),a.arc(o/2,c/2,110,0,Math.PI*2),a.stroke(),a.strokeStyle="rgba(130, 214, 208, 0.34)",a.lineWidth=4,a.beginPath(),a.arc(o/2,c/2,78,0,Math.PI*2),a.stroke();else if(e==="command-tray"){let _=c*.57;a.fillStyle="rgba(4, 16, 15, 0.30)",a.beginPath(),a.roundRect(o*.12,_-46,o*.72,92,32),a.fill(),a.strokeStyle="rgba(245, 212, 132, 0.44)",a.lineWidth=4;for(let x=0;x<5;x+=1){let M=o*.23+x*o*.115;a.beginPath(),a.arc(M,_,38,0,Math.PI*2),a.stroke()}a.strokeStyle="rgba(130, 214, 208, 0.40)",a.lineWidth=3,a.beginPath(),a.moveTo(o*.19,c*.78),a.lineTo(o*.72,c*.78),a.stroke(),a.strokeStyle="rgba(245, 212, 132, 0.32)",a.lineWidth=8,a.beginPath(),a.moveTo(o*.02,c*.62),a.bezierCurveTo(o*.08,c*.58,o*.11,c*.46,o*.18,c*.42),a.stroke(),a.strokeStyle="rgba(130, 214, 208, 0.30)",a.lineWidth=3,a.beginPath(),a.moveTo(o*.04,c*.74),a.lineTo(o*.2,c*.74),a.stroke()}else if(e==="objective-loop"){a.strokeStyle="rgba(46, 27, 14, 0.44)",a.lineWidth=4,a.beginPath(),a.moveTo(o*.14,c*.54),a.bezierCurveTo(o*.28,c*.34,o*.44,c*.74,o*.62,c*.52),a.stroke();for(let _=0;_<5;_+=1)Rs(a,o*(.15+_*.12),c*(.54+(_%2===0?-.04:.05)),6,_===0)}else if(e==="selected-context"){let _=o*.2,x=c*.52;a.strokeStyle="rgba(27, 106, 100, 0.54)",a.lineWidth=5,a.beginPath(),a.arc(_,x,52,0,Math.PI*2),a.stroke(),a.strokeStyle="rgba(245, 212, 132, 0.52)",a.lineWidth=3,a.beginPath(),a.moveTo(_-64,x),a.lineTo(_+64,x),a.moveTo(_,x-64),a.lineTo(_,x+64),a.stroke(),a.strokeStyle="rgba(245, 212, 132, 0.62)",a.lineWidth=7,a.beginPath(),a.moveTo(o*.02,x),a.lineTo(o*.08,x-22),a.lineTo(o*.08,x+22),a.closePath(),a.stroke(),a.fillStyle="rgba(245, 212, 132, 0.20)",a.fill()}a.globalAlpha=1;let m=new at(s);return m.colorSpace=Be,m.minFilter=Se,m.magFilter=Se,ue.set(t,m),m}function Lc(n="depth-veil"){let e=String(n||"depth-veil"),t=`expedition-hud-world-cohesion:${ws}:${e}`;if(ue.has(t))return ue.get(t);let i=document.createElement("canvas");i.width=e==="bottom-bridge"?1024:768,i.height=e==="bottom-bridge"?320:768;let r=i.getContext("2d"),s=i.width,a=i.height;if(r.clearRect(0,0,s,a),e==="bottom-bridge"){let c=r.createLinearGradient(0,0,0,a);c.addColorStop(0,"rgba(4, 16, 15, 0.00)"),c.addColorStop(.3,"rgba(4, 16, 15, 0.08)"),c.addColorStop(.62,"rgba(4, 16, 15, 0.34)"),c.addColorStop(1,"rgba(4, 16, 15, 0.58)"),r.fillStyle=c,r.fillRect(0,0,s,a);let h=r.createLinearGradient(64,128,s-64,262);h.addColorStop(0,"rgba(12, 33, 30, 0.12)"),h.addColorStop(.18,"rgba(10, 44, 41, 0.62)"),h.addColorStop(.52,"rgba(78, 58, 32, 0.38)"),h.addColorStop(.82,"rgba(10, 44, 41, 0.62)"),h.addColorStop(1,"rgba(12, 33, 30, 0.12)"),r.fillStyle=h,r.beginPath(),r.roundRect(58,146,s-116,106,42),r.fill(),r.strokeStyle="rgba(245, 212, 132, 0.28)",r.lineWidth=7,r.beginPath(),r.moveTo(88,160),r.bezierCurveTo(260,110,420,170,514,186),r.bezierCurveTo(620,204,746,126,936,160),r.stroke(),r.strokeStyle="rgba(130, 214, 208, 0.20)",r.lineWidth=3;for(let u=0;u<11;u+=1){let d=122+u*82;r.beginPath(),r.moveTo(d,156),r.lineTo(d+36,246),r.stroke()}[118,232,784,906].forEach((u,d)=>Rs(r,u,204,d%2===0?8:6,d<2))}else if(e==="selected-aura"){let c=r.createRadialGradient(s/2,a/2,8,s/2,a/2,s*.46);c.addColorStop(0,"rgba(255, 248, 232, 0.34)"),c.addColorStop(.36,"rgba(245, 212, 132, 0.18)"),c.addColorStop(.7,"rgba(27, 106, 100, 0.10)"),c.addColorStop(1,"rgba(27, 106, 100, 0.00)"),r.fillStyle=c,r.fillRect(0,0,s,a),r.strokeStyle="rgba(245, 212, 132, 0.54)",r.lineWidth=7,r.setLineDash([22,15]),r.beginPath(),r.arc(s/2,a/2,s*.3,0,Math.PI*2),r.stroke(),r.setLineDash([]),r.strokeStyle="rgba(130, 214, 208, 0.38)",r.lineWidth=3,r.beginPath(),r.arc(s/2,a/2,s*.4,0,Math.PI*2),r.stroke()}else{let c=r.createRadialGradient(s*.5,a*.48,s*.1,s*.5,a*.5,s*.72);c.addColorStop(0,"rgba(4, 16, 15, 0.00)"),c.addColorStop(.5,"rgba(4, 16, 15, 0.03)"),c.addColorStop(.78,"rgba(4, 16, 15, 0.13)"),c.addColorStop(1,"rgba(4, 16, 15, 0.34)"),r.fillStyle=c,r.fillRect(0,0,s,a);let h=r.createLinearGradient(0,0,s,a*.56);h.addColorStop(0,"rgba(255, 248, 232, 0.13)"),h.addColorStop(.28,"rgba(255, 248, 232, 0.04)"),h.addColorStop(1,"rgba(255, 248, 232, 0.00)"),r.fillStyle=h,r.fillRect(0,0,s,a);let u=r.createLinearGradient(0,0,s,0);u.addColorStop(0,"rgba(10, 44, 41, 0.20)"),u.addColorStop(.18,"rgba(10, 44, 41, 0.04)"),u.addColorStop(.78,"rgba(10, 44, 41, 0.03)"),u.addColorStop(1,"rgba(10, 44, 41, 0.20)"),r.fillStyle=u,r.fillRect(0,0,s,a)}let o=new at(i);return o.colorSpace=Be,o.minFilter=Se,o.magFilter=Se,ue.set(t,o),o}function Uy(n,e="expedition-three-raycast"){let t=n?.userData||{};return{unitId:String(t.unitId||""),unitType:String(t.unitType||""),displayName:String(t.displayName||""),cellId:String(t.cellId||""),source:e,atMs:Date.now()}}function ky(n,e="expedition-three-raycast"){let t=n?.userData||{};return{markerKind:String(t.kind||""),packetId:String(t.packetId||""),mode:String(t.mode||""),cellId:String(t.cellId||t.targetCellId||""),targetCellId:String(t.targetCellId||t.cellId||""),visualOnly:t.visualOnly===!0,readOnly:t.readOnly===!0,source:e,atMs:Date.now()}}function By(n,e="expedition-three-raycast"){let t=n?.userData||{};return{unitId:String(t.unitId||""),unitType:String(t.unitType||""),commandId:String(t.commandId||""),cellId:String(t.cellId||""),targetCellId:String(t.cellId||""),fogState:String(t.fogState||""),serverMutationImplemented:t.serverMutationImplemented===!0,movementMutation:t.movementMutation===!0,visualOnly:t.visualOnly===!0,readOnly:t.readOnly===!0,previewOnly:t.previewOnly===!0,source:e,atMs:Date.now()}}function Cd(n=""){switch(String(n||"")){case"move_unit":return{stroke:"#1b6a64",fill:"rgba(130, 214, 208, 0.18)",glyph:"move"};case"scout_sector":return{stroke:"#d19a48",fill:"rgba(245, 212, 132, 0.20)",glyph:"scout"};case"prepare_settler_convoy":return{stroke:"#c4883a",fill:"rgba(255, 226, 128, 0.18)",glyph:"convoy"};case"found_settlement":return{stroke:"#637f58",fill:"rgba(130, 214, 208, 0.16)",glyph:"outpost"};default:return{stroke:"#8a6d41",fill:"rgba(255, 248, 232, 0.16)",glyph:"inspect"}}}function Hy(n={}){let e=String(n.commandId||"inspect"),t=String(n.fogState||""),i=`expedition-command-target:${Gt}:${e}:${t}`;if(ue.has(i))return ue.get(i);let r=document.createElement("canvas");r.width=256,r.height=256;let s=r.getContext("2d"),a=Cd(e);s.clearRect(0,0,r.width,r.height),s.fillStyle=a.fill,s.beginPath(),s.arc(128,128,106,0,Math.PI*2),s.fill(),s.strokeStyle=a.stroke,s.lineWidth=e==="scout_sector"?10:8,e==="scout_sector"&&s.setLineDash([18,12]),s.beginPath(),s.arc(128,128,98,0,Math.PI*2),s.stroke(),s.setLineDash([]),s.strokeStyle="rgba(255, 248, 232, 0.72)",s.lineWidth=4,s.beginPath(),s.arc(128,128,80,0,Math.PI*2),s.stroke(),s.fillStyle="rgba(46, 27, 14, 0.24)",s.beginPath(),s.ellipse(128,210,54,13,0,0,Math.PI*2),s.fill(),s.strokeStyle=a.stroke,s.fillStyle="#fff8e8",s.lineWidth=8,s.lineCap="round",s.lineJoin="round",a.glyph==="move"?(s.beginPath(),s.moveTo(86,128),s.lineTo(164,128),s.moveTo(140,104),s.lineTo(164,128),s.lineTo(140,152),s.stroke()):a.glyph==="scout"?(s.beginPath(),s.arc(128,128,30,0,Math.PI*2),s.moveTo(128,78),s.lineTo(128,98),s.moveTo(128,158),s.lineTo(128,178),s.moveTo(78,128),s.lineTo(98,128),s.moveTo(158,128),s.lineTo(178,128),s.stroke()):a.glyph==="convoy"?(s.beginPath(),s.roundRect(88,112,80,38,10),s.stroke(),s.beginPath(),s.arc(104,164,10,0,Math.PI*2),s.arc(152,164,10,0,Math.PI*2),s.stroke()):a.glyph==="outpost"?(s.beginPath(),s.moveTo(96,174),s.lineTo(128,82),s.lineTo(160,174),s.stroke(),s.beginPath(),s.arc(128,84,18,0,Math.PI*2),s.fillStyle=a.stroke,s.fill()):(s.beginPath(),s.roundRect(96,88,64,78,10),s.stroke());let o=new at(r);return o.colorSpace=Be,o.minFilter=Se,o.magFilter=Se,ue.set(i,o),o}function zy(n={}){let e=String(n.commandId||"command"),t=String(n.feedbackId||`${e}:${n.cellId||""}`),i=`expedition-command-outcome:${Gt}:${t}`;if(ue.has(i))return ue.get(i);let r=document.createElement("canvas");r.width=256,r.height=256;let s=r.getContext("2d"),a=Cd(e);s.clearRect(0,0,r.width,r.height),s.fillStyle=a.fill,s.beginPath(),s.arc(128,128,116,0,Math.PI*2),s.fill(),s.strokeStyle=a.stroke,s.lineWidth=10,s.beginPath(),s.arc(128,128,104,0,Math.PI*2),s.stroke(),s.strokeStyle="rgba(255, 248, 232, 0.78)",s.lineWidth=5,s.beginPath(),s.arc(128,128,78,0,Math.PI*2),s.stroke(),s.fillStyle="rgba(255, 248, 232, 0.88)",s.beginPath(),s.arc(128,128,42,0,Math.PI*2),s.fill(),s.strokeStyle=a.stroke,s.lineWidth=9,s.lineCap="round",s.lineJoin="round",e==="move_unit"?(s.beginPath(),s.moveTo(92,128),s.lineTo(160,128),s.moveTo(138,106),s.lineTo(160,128),s.lineTo(138,150),s.stroke()):e==="scout_sector"?(s.beginPath(),s.arc(128,128,24,0,Math.PI*2),s.moveTo(128,88),s.lineTo(128,104),s.moveTo(128,152),s.lineTo(128,168),s.moveTo(88,128),s.lineTo(104,128),s.moveTo(152,128),s.lineTo(168,128),s.stroke()):e==="prepare_settler_convoy"?(s.beginPath(),s.roundRect(92,112,72,34,9),s.stroke(),s.beginPath(),s.arc(106,158,8,0,Math.PI*2),s.arc(150,158,8,0,Math.PI*2),s.stroke()):e==="found_settlement"?(s.beginPath(),s.moveTo(96,158),s.lineTo(128,96),s.lineTo(160,158),s.stroke(),s.beginPath(),s.moveTo(108,158),s.lineTo(156,158),s.stroke()):(s.beginPath(),s.moveTo(98,130),s.lineTo(120,152),s.lineTo(164,104),s.stroke());let o=new at(r);return o.colorSpace=Be,o.minFilter=Se,o.magFilter=Se,ue.set(i,o),o}function Vy(n={},e=new Map){if(!n?.unitId)return[];let t=new Map,i=(s={},a="",o="")=>{let c=String(s.commandId||o||""),h=String(a||"").trim();if(!c||!h)return;let u=e.get(h);if(!u)return;let d=String(u.fogState||"");if(c==="scout_sector"){if(!(d==="hinted"&&String(u.kind||"")==="frontier_hint"))return}else if(!["discovered","known"].includes(d))return;let l=`${c}:${h}`;t.has(l)||t.set(l,{unitId:String(n.unitId||""),unitType:String(n.unitType||""),commandId:c,cellId:h,fogState:d,serverMutationImplemented:s.serverMutationImplemented===!0||c==="move_unit"&&n.movement?.movementMutationImplemented===!0,movementMutation:c==="move_unit",routeAuthority:!1,actionAuthority:!1,visualOnly:!0,readOnly:!0,source:o})};return(Array.isArray(n.commandHints)?n.commandHints:[]).filter(s=>s&&s.enabled!==!1).forEach(s=>{let a=String(s.commandId||""),o=Array.isArray(s.targetCellIds)?s.targetCellIds.map(c=>String(c||"")).filter(Boolean):[];if(a==="move_unit"){let c=Array.isArray(n.movement?.allowedTargetCellIds)?n.movement.allowedTargetCellIds.map(h=>String(h||"")).filter(Boolean):[];[...new Set([...o,...c])].forEach(h=>i(s,h,"movement"));return}o.forEach(c=>i(s,c,"command_hint"))}),Array.from(t.values())}function Gy(n={},e={}){let t=me(n.q,0)-me(e.q,0),i=me(n.r,0)-me(e.r,0),r=me(n.q,0)+me(n.r,0)-(me(e.q,0)+me(e.r,0));return Math.max(Math.abs(t),Math.abs(i),Math.abs(r))}function Wy(n={},e=new Map,t=[]){if(!n?.unitId||String(n.unitType||n.role||"").toLowerCase()!=="outpost_crew")return null;let i=String(n.location?.cellId||n.cellId||"").trim();if(!i)return null;let r=e.get(i);if(!r||!["discovered","known"].includes(String(r.fogState||""))||!`${r.kind||""} ${r.status||""} ${(Array.isArray(r.traits)?r.traits:[]).join(" ")}`.toLowerCase().includes("outpost"))return null;let a=t.filter(c=>String(c.fogState||"")==="hinted"&&String(c.kind||"")==="frontier_hint").filter(c=>c.readOnly!==!1).map(c=>{let h=String(c.sourceIds?.adjacentCellId||"")===i;return{cell:c,adjacentSource:h,adjacentGeometry:$c(r,c),distance:Gy(r,c)}}).filter(c=>c.adjacentSource||c.adjacentGeometry||Number.isFinite(c.distance));if(!a.length)return null;a.sort((c,h)=>c.adjacentSource!==h.adjacentSource?c.adjacentSource?-1:1:c.adjacentGeometry!==h.adjacentGeometry?c.adjacentGeometry?-1:1:c.distance-h.distance);let o=a[0].cell;return{unitId:String(n.unitId||""),unitType:String(n.unitType||""),commandId:"scout_sector",cueLabel:"Next Scout",originCellId:i,targetCellId:String(o.cellId||""),targetFogState:String(o.fogState||""),targetKind:String(o.kind||""),derivedFrom:a[0].adjacentSource?"sourceIds.adjacentCellId":"nearest_visible_hinted_frontier_cell",visualOnly:!0,readOnly:!0,selectable:!1,routeAuthority:!1,actionAuthority:!1,executableActions:0,hiddenTruthLeakage:!1}}function Xy(n=!1){let e=`expedition-outpost-next-frontier:${Gt}:${n?"selected":"idle"}`;if(ue.has(e))return ue.get(e);let t=document.createElement("canvas");t.width=256,t.height=256;let i=t.getContext("2d");i.clearRect(0,0,t.width,t.height),i.fillStyle=n?"rgba(245, 212, 132, 0.22)":"rgba(255, 226, 128, 0.16)",i.beginPath(),i.arc(128,128,112,0,Math.PI*2),i.fill(),i.strokeStyle=n?"rgba(245, 212, 132, 0.92)":"rgba(209, 154, 72, 0.76)",i.lineWidth=n?12:9,i.setLineDash([18,12]),i.beginPath(),i.arc(128,128,100,0,Math.PI*2),i.stroke(),i.setLineDash([]),i.strokeStyle="rgba(27, 106, 100, 0.58)",i.lineWidth=5,i.beginPath(),i.arc(128,128,70,0,Math.PI*2),i.stroke(),i.fillStyle="rgba(255, 248, 232, 0.86)",i.beginPath(),i.moveTo(128,70),i.lineTo(148,128),i.lineTo(128,186),i.lineTo(108,128),i.closePath(),i.fill(),i.strokeStyle="rgba(46, 27, 14, 0.42)",i.lineWidth=4,i.stroke(),i.fillStyle=n?"rgba(46, 27, 14, 0.72)":"rgba(46, 27, 14, 0.58)",i.font="900 20px sans-serif",i.textAlign="center",i.textBaseline="middle",i.fillText("NEXT",128,214);let r=new at(t);return r.colorSpace=Be,r.minFilter=Se,r.magFilter=Se,ue.set(e,r),r}function qy(n={},e={},t=!1){let i=e.positions?.get?.(String(n.originCellId||"")),r=e.positions?.get?.(String(n.targetCellId||""));if(!i||!r)return null;let s={x:(i.x+r.x)/2,y:(i.y+r.y)/2},a=.34+Math.min(2.2,Math.hypot(r.x-i.x,r.y-i.y))*.12,o=new ui(new C(i.x,i.y+.3,.485),new C(s.x,s.y+a,.485),new C(r.x,r.y+.02,.485)),c=new it().setFromPoints(o.getPoints(34)),h=new pn(c,new Sr({color:13736520,transparent:!0,opacity:t?.88:.68,dashSize:.12,gapSize:.09}));h.computeLineDistances(),h.userData={kind:"expedition_outpost_next_frontier_connection",...n};let u=new pn(c.clone(),new Nt({color:16110724,transparent:!0,opacity:t?.22:.14}));u.position.z=-.01,u.userData={kind:"expedition_outpost_next_frontier_connection_glow",...n};let d=new bt(new yt({map:Xy(t),transparent:!0,depthWrite:!1,depthTest:!0,alphaTest:.03,opacity:t?.94:.82}));d.position.set(r.x,r.y+.03,.505),d.scale.set(t?1.22:1.08,t?1.22:1.08,1),d.userData={kind:"expedition_outpost_next_frontier_beacon",...n};let l=new fn;return l.add(u,h,d),l.userData={kind:"expedition_outpost_next_frontier_group",...n},{group:l,ring:d,line:h}}function Yy(n,e="expedition-three-raycast"){let t=n?.userData||{};return{cellId:String(t.cellId||""),fogState:String(t.fogState||""),status:String(t.status||""),title:String(t.title||""),source:e,atMs:Date.now()}}var Vc=class{constructor(e){this.hostNode=e,this.model={},this.cells=[],this.info={},this.pickables=[],this.cellMeshes=[],this.unitSprites=[],this.commandTargetSprites=[],this.outcomeFeedbackSprites=[],this.eventMarkerSprites=[],this.objectiveMarkerSprites=[],this.outpostFrontierBeaconSprites=[],this.generatedHudWorldCohesionSprites=[],this.generatedHudWorldCohesionLines=[],this.generatedHudChromeSprites=[],this.generatedHudProfileSprites=[],this.generatedHudTextSprites=[],this.generatedHudCommandSprites=[],this.outcomeFeedback=null,this.hoverCellId="",this.terrainUnderlayCount=0,this.surveyStrokeCount=0,this.markerCount=0,this.unitTokenCount=0,this.commandTargetCount=0,this.outcomeFeedbackCount=0,this.eventMarkerCount=0,this.objectiveMarkerCount=0,this.outpostFrontierBeaconCount=0,this.generatedHudWorldCohesionCount=0,this.generatedHudWorldTetherCount=0,this.generatedHudChromeCount=0,this.generatedHudProfileCount=0,this.generatedHudTextCount=0,this.generatedHudCommandCount=0,this.scene=new pr,this.camera=new mi(-$n/2,$n/2,Zn/2,-Zn/2,.1,100),this.camera.position.set(0,0,10),this.camera.lookAt(0,0,0),this.raycaster=new Mr,this.pointer=new ye,this.renderer=new Ts({antialias:!0,alpha:!1,preserveDrawingBuffer:!0}),this.renderer.setClearColor(14151135,1),this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),this.renderer.domElement.className="fp-expedition-three-canvas",this.renderer.domElement.dataset.testid="fp-expedition-three-canvas",this.renderer.domElement.setAttribute("aria-label","Zoomable private Expedition Map"),this.dragging=!1,this.dragMoved=!1,this.lastPointer=null,this.activePointers=new Map,this.pinchDistance=0,this.pinchZoom=1,this.mapBounds={minX:-1,maxX:1,minY:-1,maxY:1,centerX:0,centerY:0,width:2,height:2},this.onResize=this.onResize.bind(this),this.onWheel=this.onWheel.bind(this),this.onPointerDown=this.onPointerDown.bind(this),this.onPointerMove=this.onPointerMove.bind(this),this.onPointerUp=this.onPointerUp.bind(this),this.onPointerLeave=this.onPointerLeave.bind(this),this.onRegionTileAssetLoaded=()=>{ue.clear(),this.rebuild(),this.render()},this.disposeRegionTileAssetListener=oy(this.onRegionTileAssetLoaded),this.resizeObserver=new ResizeObserver(this.onResize),this.attach()}attach(){this.renderer.domElement.parentElement!==this.hostNode&&this.hostNode.appendChild(this.renderer.domElement),this.hostNode.addEventListener("wheel",this.onWheel,{passive:!1}),this.hostNode.addEventListener("pointerdown",this.onPointerDown),this.hostNode.addEventListener("pointermove",this.onPointerMove),this.hostNode.addEventListener("pointerup",this.onPointerUp),this.hostNode.addEventListener("pointercancel",this.onPointerUp),this.hostNode.addEventListener("pointerleave",this.onPointerLeave),this.resizeObserver.observe(this.hostNode),this.onResize()}dispose(){this.hostNode.removeEventListener("wheel",this.onWheel),this.hostNode.removeEventListener("pointerdown",this.onPointerDown),this.hostNode.removeEventListener("pointermove",this.onPointerMove),this.hostNode.removeEventListener("pointerup",this.onPointerUp),this.hostNode.removeEventListener("pointercancel",this.onPointerUp),this.hostNode.removeEventListener("pointerleave",this.onPointerLeave),this.disposeRegionTileAssetListener&&this.disposeRegionTileAssetListener(),this.resizeObserver.disconnect(),this.clearScene(),this.renderer.dispose(),this.renderer.domElement.remove()}clearScene(){this.scene.children.slice().forEach(t=>{this.scene.remove(t),t.traverse(i=>{if(i.geometry&&i.geometry.dispose(),i.material){let r=Array.isArray(i.material)?i.material:[i.material];for(let s of r)s.dispose()}})}),this.pickables=[],this.cellMeshes=[],this.unitSprites=[],this.commandTargetSprites=[],this.outcomeFeedbackSprites=[],this.eventMarkerSprites=[],this.objectiveMarkerSprites=[],this.outpostFrontierBeaconSprites=[],this.generatedHudWorldCohesionSprites=[],this.generatedHudWorldCohesionLines=[],this.generatedHudChromeSprites=[],this.generatedHudProfileSprites=[],this.generatedHudTextSprites=[],this.generatedHudCommandSprites=[],this.terrainUnderlayCount=0,this.surveyStrokeCount=0,this.markerCount=0,this.unitTokenCount=0,this.commandTargetCount=0,this.outcomeFeedbackCount=0,this.eventMarkerCount=0,this.objectiveMarkerCount=0,this.outpostFrontierBeaconCount=0,this.generatedHudWorldCohesionCount=0,this.generatedHudWorldTetherCount=0,this.generatedHudChromeCount=0,this.generatedHudProfileCount=0,this.generatedHudTextCount=0,this.generatedHudCommandCount=0,this.edgeFogCount=0,this.civicBeaconCount=0}onResize(){let e=this.hostNode.getBoundingClientRect(),t=Math.max(1,Math.floor(e.width)),i=Math.max(1,Math.floor(e.height));this.renderer.setSize(t,i,!1);let r=t/i,s=$n/Zn;if(r>=s){let a=Zn*r;this.camera.left=a/-2,this.camera.right=a/2,this.camera.top=Zn/2,this.camera.bottom=Zn/-2}else{let a=$n/r;this.camera.left=$n/-2,this.camera.right=$n/2,this.camera.top=a/2,this.camera.bottom=a/-2}this.camera.zoom=Math.max(this.camera.zoom,this.preferredHudWorldZoom(t,i)),this.applyCameraBounds(),this.render()}preferredHudWorldZoom(e=0,t=0){let i=Math.max(.01,me(e,0)/Math.max(1,me(t,1)));return e<=430&&i<.62?1.52:e<=560&&i<.75?1.34:1}sync(e={},t="",i="",r=null){this.model=e&&typeof e=="object"?e:{},this.cells=Array.isArray(this.model.cells)?this.model.cells.filter(a=>a?.cellId):[],this.selectedCellId=String(t||this.selectedCellId||this.cells[0]?.cellId||"");let s=Array.isArray(this.model.units?.items)?this.model.units.items.filter(a=>a?.unitId):[];return this.selectedUnitId=String(i||this.selectedUnitId||s[0]?.unitId||""),this.outcomeFeedback=r&&typeof r=="object"?r:null,this.rebuild(),this.applyCameraBounds(),this.render(),this.info}rebuild(){this.clearScene();let e=Sd(this.cells);this.mapBounds=e.bounds;let t=new dt(new en($n*1.35,Zn*1.35),new Ft({map:yy(),transparent:!1}));t.position.set(0,0,-.8),this.scene.add(t),this.terrainUnderlayCount=0;let i=Td(e),r=new dt(new en(i.width,i.height),new Ft({map:by(this.cells,e),transparent:!0,opacity:.94,depthWrite:!1}));r.position.set(i.centerX,i.centerY,-.62),r.userData={kind:"expedition_continuous_terrain_underlay",visualOnly:!0,serverOwnedCellsOnly:!0,hiddenTruthLeakage:!1},this.terrainUnderlayCount=1,this.scene.add(r);let s=Math.max($n,Zn),a=[];for(let _=-6;_<=6;_+=1){let x=_*.9;a.push(new C(-s,x,-.42),new C(s,x,-.42)),a.push(new C(x,-s,-.42),new C(x,s,-.42))}let o=new gr(new it().setFromPoints(a),new Nt({color:1796708,transparent:!0,opacity:.1}));this.scene.add(o),this.edgeFogCount=0;let c=[{x:this.mapBounds.centerX,y:this.mapBounds.maxY+.52,rotation:0,width:this.mapBounds.width+2.9,kind:"soft"},{x:this.mapBounds.centerX,y:this.mapBounds.minY-.54,rotation:Math.PI,width:this.mapBounds.width+2.7,kind:"soft"},{x:this.mapBounds.minX-.56,y:this.mapBounds.centerY,rotation:Math.PI/2,width:this.mapBounds.height+2.5,kind:"locked"},{x:this.mapBounds.maxX+.62,y:this.mapBounds.centerY,rotation:-Math.PI/2,width:this.mapBounds.height+2.5,kind:"soft"}];for(let _ of c){let x=new dt(new en(_.width,.64),new Ft({map:_y(_.kind),transparent:!0,opacity:_.kind==="locked"?.54:.42,depthWrite:!1}));x.position.set(_.x,_.y,-.26),x.rotation.z=_.rotation,this.edgeFogCount+=1,this.scene.add(x)}this.civicBeaconCount=0;let h=this.cells.filter(_=>["discovered","known"].includes(String(_.fogState||""))).slice(0,4);for(let _ of h){let x=e.positions.get(String(_.cellId||""));if(!x)continue;let M=new bt(new yt({map:My(),transparent:!0,opacity:String(_.kind||"")==="origin_plot"?.82:.56,depthWrite:!1}));M.position.set(x.x+.36,x.y+.28,.1),M.scale.set(.62,.62,1),M.userData={kind:"expedition_civic_beacon_cue",visualOnly:!0,routeAuthority:!1,cellId:String(_.cellId||"")},this.civicBeaconCount+=1,this.scene.add(M)}this.surveyStrokeCount=0;for(let _=0;_<this.cells.length;_+=1)for(let x=_+1;x<this.cells.length;x+=1){let M=this.cells[_],A=this.cells[x];if(!$c(M,A))continue;let E=wy(M,A,e);E&&(this.surveyStrokeCount+=1,this.scene.add(E))}let u=this.cells.filter(_=>!["discovered","known"].includes(String(_.fogState||"")));for(let _ of u){let x=e.positions.get(String(_.cellId||""));if(!x)continue;let M=String(_.fogState||"locked_unknown"),A=new dt(new en(M==="locked_unknown"?vn*2.06:vn*1.86,M==="locked_unknown"?vn*2.06:vn*1.86),new Ft({map:my(M==="locked_unknown"?"locked":"hinted"),transparent:!0,opacity:M==="locked_unknown"?.34:.42,depthWrite:!1}));A.position.set(x.x,x.y,.24),this.scene.add(A)}this.markerCount=0;for(let _ of this.cells){let x=e.positions.get(String(_.cellId||""))||{x:0,y:0},M=String(_.cellId||"")===this.selectedCellId,A=String(_.cellId||"")===this.hoverCellId,E=Ty(_,x,M,A);this.scene.add(E),E.traverse(I=>{I.userData?.kind==="expedition_cell"&&(this.pickables.push(I),this.cellMeshes.push(I))}),this.markerCount+=1}let d=new Map(this.cells.map(_=>[String(_.cellId||""),_])),l=this.model.objective&&typeof this.model.objective=="object"?this.model.objective:null;this.eventMarkerCount=0;for(let _ of dy(this.model)){let x=Md(_),M=d.get(x),A=String(M?.fogState||"");if(!M||!["discovered","known"].includes(A))continue;let E=e.positions.get(x);if(!E)continue;let I=String(_.packetId||"")===String(l?.packetId||"")||String(x)===String(this.selectedCellId||""),S=Bi.event_packet,w=new bt(new yt({map:fy(_,I),transparent:!0,depthWrite:!1,depthTest:!0,alphaTest:.03}));w.position.set(E.x-.36,E.y+.35,.47),w.scale.set(I?.48:.4,I?.48:.4,1),w.userData={kind:"expedition_event_packet_marker",packetId:String(_.packetId||""),cellId:x,templateId:String(_.templateId||_.kind||""),spriteAssetSlot:String(S.slot||""),spriteAssetPath:String(S.path||""),spriteAssetReady:!!Kn(S),visualOnly:!0,readOnly:!0,selectable:!0,inspectable:!0,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.pickables.push(w),this.eventMarkerSprites.push(w),this.eventMarkerCount+=1,this.scene.add(w)}if(this.objectiveMarkerCount=0,l&&String(l.mode||"read")!=="read"&&l.targetCellId){let _=String(l.targetCellId||""),x=d.get(_),M=e.positions.get(_);if(x&&M){let A=_===String(this.selectedCellId||""),E=String(l.mode||"")==="packet"?Bi.event_packet:Bi.objective_beacon,I=new bt(new yt({map:py(l,A),transparent:!0,depthWrite:!1,depthTest:!0,alphaTest:.03}));I.position.set(M.x+.38,M.y+.41,.5),I.scale.set(A?.56:.48,A?.56:.48,1),I.userData={kind:"expedition_objective_marker",mode:String(l.mode||""),cellId:_,targetCellId:_,packetId:String(l.packetId||""),spriteAssetSlot:String(E.slot||""),spriteAssetPath:String(E.path||""),spriteAssetReady:!!Kn(E),visualOnly:!0,readOnly:!0,selectable:!0,inspectable:!0,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.pickables.push(I),this.objectiveMarkerSprites.push(I),this.objectiveMarkerCount=1,this.scene.add(I)}}let f=Array.isArray(this.model.units?.items)?this.model.units.items.filter(_=>_?.unitId):[],g=f.find(_=>String(_.unitId||"")===String(this.selectedUnitId||""))||null;this.outpostFrontierBeaconCount=0;let v=Wy(g||{},d,this.cells);if(v){let _=qy(v,e,String(v.targetCellId||"")===String(this.selectedCellId||""));_?.group&&(this.outpostFrontierBeaconSprites.push(_.ring),this.outpostFrontierBeaconCount=1,this.scene.add(_.group))}this.commandTargetCount=0;for(let _ of Vy(g||{},d)){let x=e.positions.get(String(_.cellId||""));if(!x)continue;let M=new bt(new yt({map:Hy(_),transparent:!0,depthWrite:!1,depthTest:!0,alphaTest:.03,opacity:_.commandId==="scout_sector"?.92:.84}));M.position.set(x.x,x.y+.05,.515),M.scale.set(_.commandId==="scout_sector"?1.34:1.2,_.commandId==="scout_sector"?1.34:1.2,1),M.userData={kind:"expedition_command_target",unitId:_.unitId,unitType:_.unitType,commandId:_.commandId,cellId:_.cellId,fogState:_.fogState,serverMutationImplemented:_.serverMutationImplemented===!0,movementMutation:_.movementMutation===!0,visualOnly:!0,readOnly:!0,previewOnly:!0,selectable:!0,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.pickables.push(M),this.commandTargetSprites.push(M),this.commandTargetCount+=1,this.scene.add(M)}let p=this.outcomeFeedback;if(p?.cellId){let _=e.positions.get(String(p.cellId||""));if(_){let x=new bt(new yt({map:zy(p),transparent:!0,depthWrite:!1,depthTest:!0,alphaTest:.03,opacity:.92}));x.position.set(_.x,_.y+.05,.535),x.scale.set(1.48,1.48,1),x.userData={kind:"expedition_command_outcome_feedback",feedbackId:String(p.feedbackId||""),commandId:String(p.commandId||""),unitId:String(p.unitId||""),unitType:String(p.unitType||""),cellId:String(p.cellId||""),targetCellId:String(p.targetCellId||p.cellId||""),sourceCellId:String(p.sourceCellId||""),receiptId:String(p.receiptId||""),receiptKind:String(p.receiptKind||""),serverOwnedResult:p.serverOwnedResult===!0,visualOnly:!0,readOnly:!0,selectable:!1,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.outcomeFeedbackSprites.push(x),this.outcomeFeedbackCount=1,this.scene.add(x)}}this.unitTokenCount=0;let m=f.reduce((_,x)=>{let M=String(x.location?.cellId||"");return M&&(_[M]||(_[M]=[]),_[M].push(x)),_},{});for(let[_,x]of Object.entries(m)){let M=e.positions.get(_);M&&x.forEach((A,E)=>{let I=String(A.unitId||"")===this.selectedUnitId,S=Ko(A),w=!!Kn(S),F=E/Math.max(1,x.length)*Math.PI*2-Math.PI/2,R=x.length>1?.26:0,U=new bt(new yt({map:Ay(A,I),transparent:!0,depthWrite:!1,depthTest:!0,alphaTest:.03}));U.position.set(M.x+Math.cos(F)*R,M.y+.44+Math.sin(F)*R*.36,.54+E*.01);let G=I?.72:.58;U.scale.set(G,G,1),U.userData={kind:"expedition_unit",unitId:String(A.unitId||""),unitType:String(A.unitType||""),displayName:String(A.displayName||""),cellId:_,spriteAssetSlot:String(S?.slot||""),spriteAssetPath:String(S?.path||""),spriteAssetReady:w,selectable:A.selectable!==!1,readOnly:A.readOnly!==!1,movementMutationImplemented:A.movement?.movementMutationImplemented===!0},this.pickables.push(U),this.unitSprites.push(U),this.unitTokenCount+=1,this.scene.add(U)})}this.addGeneratedHudWorldCohesionLayer(e),this.addGeneratedHudChromeLayer(),this.addGeneratedHudContentLayer(),this.updateInfo()}visibleSize(){return{width:Math.max(.01,(this.camera.right-this.camera.left)/this.camera.zoom),height:Math.max(.01,(this.camera.top-this.camera.bottom)/this.camera.zoom)}}addGeneratedHudWorldCohesionLayer(e){this.generatedHudWorldCohesionSprites=[],this.generatedHudWorldCohesionLines=[];let t=(r,s,a,o)=>{let c=new bt(new yt({map:s,transparent:!0,depthWrite:!1,depthTest:!1,opacity:a,alphaTest:.01}));return c.renderOrder=o,c.userData={kind:"expedition_generated_hud_world_cohesion",layerVersion:ws,slot:r,visualOnly:!0,readOnly:!0,selectable:!1,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.generatedHudWorldCohesionSprites.push(c),this.scene.add(c),c};t("map-depth-veil",Lc("depth-veil"),.82,860),t("bottom-foreground-bridge",Lc("bottom-bridge"),.88,872);let i=e.positions.get(String(this.selectedCellId||""));if(i){let r=t("selected-world-aura",Lc("selected-aura"),.86,884);r.userData.cellId=String(this.selectedCellId||""),r.userData.worldX=i.x,r.userData.worldY=i.y;let s=new pn(new it().setFromPoints([new C(i.x,i.y,4.12),new C(i.x,i.y,4.12)]),new Nt({color:16110724,transparent:!0,opacity:.5,depthWrite:!1,depthTest:!1}));s.renderOrder=892,s.userData={kind:"expedition_generated_hud_world_tether",layerVersion:ws,slot:"selected-context-tether",cellId:String(this.selectedCellId||""),startWorldX:i.x,startWorldY:i.y,targetSlot:"selected-context",visualOnly:!0,readOnly:!0,selectable:!1,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.generatedHudWorldCohesionLines.push(s),this.scene.add(s)}this.generatedHudWorldCohesionCount=this.generatedHudWorldCohesionSprites.length+this.generatedHudWorldCohesionLines.length,this.generatedHudWorldTetherCount=this.generatedHudWorldCohesionLines.length,this.syncGeneratedHudWorldCohesionSprites()}syncGeneratedHudWorldCohesionSprites(){if(!this.generatedHudWorldCohesionSprites.length&&!this.generatedHudWorldCohesionLines.length)return;let e=this.visibleSize(),t=this.camera.position.y-e.height/2;this.generatedHudWorldCohesionSprites.forEach(r=>{let s=String(r.userData?.slot||"");if(s==="map-depth-veil")r.position.set(this.camera.position.x,this.camera.position.y,4.02),r.scale.set(e.width*1.04,e.height*1.04,1);else if(s==="bottom-foreground-bridge"){let a=ot(e.height*.3,1.34,2.44);r.position.set(this.camera.position.x,t+a/2,4.06),r.scale.set(e.width*1.02,a,1)}else s==="selected-world-aura"&&(r.position.set(me(r.userData?.worldX,0),me(r.userData?.worldY,0)+.08,.66),r.scale.set(1.54,1.54,1))});let i=this.generatedHudBoundsForSlot("selected-context");this.generatedHudWorldCohesionLines.forEach(r=>{let s=me(r.userData?.startWorldX,0),a=me(r.userData?.startWorldY,0)+.1,o=i.left+i.width*.08,c=i.top-i.height*.5,h=s+(o-s)*.56,u=Math.max(a,c)+Math.abs(o-s)*.035,d=new Fi([new C(s,a,4.12),new C(h,u,4.12),new C(o,c,4.12)]);r.geometry.dispose(),r.geometry=new it().setFromPoints(d.getPoints(28)),r.userData.startCanvas={x:s,y:a},r.userData.endCanvas={x:o,y:c}})}addGeneratedHudChromeLayer(){this.generatedHudChromeSprites=[],vd(this.model).forEach((t,i)=>{let r=Oy(t);if(!r)return;let s=new bt(new yt({map:r,transparent:!0,depthWrite:!1,depthTest:!1,opacity:ot(me(t.opacity,.72)*1.34,.54,.86),alphaTest:.02}));s.renderOrder=900+i,s.userData={kind:"expedition_generated_hud_chrome",packId:String(t.packId||this.model.generatedHudChrome?.packId||Es),slot:String(t.slot||""),assetPath:String(t.path||""),anchor:String(t.anchor||""),widthRatio:me(t.widthRatio,.2),heightRatio:me(t.heightRatio,.16),marginX:me(t.marginX,.02),marginY:me(t.marginY,.02),assetReady:!0,cleanCompositeVersion:rd,materialityVersion:sn,materialProfile:"procedural_beveled_metal_parchment_frame",chromeSource:"three_canvas_clean_frame",sourceAssetPath:String(t.path||""),liveTextSource:"dom",visualOnly:!0,readOnly:!0,selectable:!1,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.generatedHudChromeSprites.push(s),this.scene.add(s)}),this.generatedHudChromeCount=this.generatedHudChromeSprites.length,this.syncGeneratedHudChromeSprites()}generatedHudBoundsForData(e={}){let t=this.visibleSize(),i=this.camera.position.x-t.width/2,r=this.camera.position.x+t.width/2,s=this.camera.position.y+t.height/2,a=this.camera.position.y-t.height/2,o=ot(me(e.widthRatio,.2)*t.width,.35,t.width*.88),c=ot(me(e.heightRatio,.16)*t.height,.26,t.height*.8),h=me(e.marginX,.02)*t.width,u=me(e.marginY,.02)*t.height,d=i+h+o/2,l=s-u-c/2;return e.anchor==="bottom-left"?l=a+u+c/2:e.anchor==="bottom-right"?(d=r-h-o/2,l=a+u+c/2):e.anchor==="right"?(d=r-h-o/2,l=s-u-c/2):e.anchor==="selected-command"&&(d=this.camera.position.x+t.width*.18,l=a+t.height*.28),{x:d,y:l,width:o,height:c,left:d-o/2,right:d+o/2,top:l+c/2,bottom:l-c/2}}generatedHudBoundsForSlot(e=""){let t=this.generatedHudChromeSprites.find(r=>String(r.userData?.slot||"")===String(e||""));if(t)return this.generatedHudBoundsForData(t.userData||{});let i=J_(e,this.model)||{};return this.generatedHudBoundsForData(i)}syncGeneratedHudChromeSprites(){this.generatedHudChromeSprites.length&&this.generatedHudChromeSprites.forEach(e=>{let t=this.generatedHudBoundsForData(e.userData||{});e.position.set(t.x,t.y,4.25),e.scale.set(t.width,t.height,1)})}addGeneratedHudContentLayer(){this.generatedHudProfileSprites=[],this.generatedHudTextSprites=[],this.generatedHudCommandSprites=[];let e=Array.isArray(this.model.units?.items)?this.model.units.items.filter(d=>d?.unitId).slice(0,6):[],t=e.find(d=>String(d.unitId||"")===String(this.selectedUnitId||""))||e[0]||null;e.forEach((d,l)=>{let f=String(d.unitId||"")===String(t?.unitId||""),g=Ko(d),v=new bt(new yt({map:Ry(d,f),transparent:!0,depthWrite:!1,depthTest:!1,alphaTest:.04}));v.renderOrder=940+l,v.userData={kind:"expedition_generated_hud_profile_mask",layerVersion:Pc,materialityVersion:sn,slot:"unit-profile",unitId:String(d.unitId||""),unitType:String(d.unitType||""),displayName:String(d.displayName||""),profileMask:"circle_alpha_clip",profileSource:"three_canvas_texture",spriteAssetSlot:String(g?.slot||""),spriteAssetPath:String(g?.path||""),spriteAssetReady:!!Kn(g),visualOnly:!0,readOnly:!0,selectable:!1,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.generatedHudProfileSprites.push(v),this.scene.add(v)}),this.generatedHudProfileCount=this.generatedHudProfileSprites.length;let i=Array.isArray(this.model.cells)?this.model.cells:[],r=i.find(d=>String(d.cellId||"")===String(this.selectedCellId||""))||i[0]||{},s=i.filter(d=>["known","discovered"].includes(String(d.fogState||""))).length,a=i.length-s,o=this.model.objective&&typeof this.model.objective=="object"?this.model.objective:{},c=t?Cy(t):0;[{slot:"crest-status",title:"EXPEDITION",meta:`${s} MAP / ${a} FOG`,tone:"light"},{slot:"objective-loop",title:Iy(this.model),meta:o.targetCellId?fd(o.targetCellId):"READY",tone:"dark"},{slot:"unit-dock",title:`${e.length} UNITS`,meta:t?jo(t):"SELECT",tone:"dark"},{slot:"command-puck",title:c?`${c} CMD`:"CMD",meta:t?jo(t):"READY",tone:"light"},{slot:"selected-context",title:fd(r.cellId||this.selectedCellId),meta:String(r.fogState||"sector").replace(/_/g," "),tone:"light"}].forEach((d,l)=>{let f=new bt(new yt({map:Ny(d),transparent:!0,depthWrite:!1,depthTest:!1,opacity:.88,alphaTest:.03}));f.renderOrder=960+l,f.userData={kind:"expedition_generated_hud_text",layerVersion:Pc,materialityVersion:sn,slot:String(d.slot||""),title:String(d.title||""),meta:String(d.meta||""),liveTextSource:"three_canvas_texture",domA11yOverlayRetained:!0,visualOnly:!0,readOnly:!0,selectable:!1,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.generatedHudTextSprites.push(f),this.scene.add(f)}),this.generatedHudTextCount=this.generatedHudTextSprites.length,(t?Py(t):[]).forEach((d,l)=>{let f=new bt(new yt({map:Fy(d),transparent:!0,depthWrite:!1,depthTest:!1,opacity:d.enabled===!1?.58:.92,alphaTest:.04}));f.renderOrder=980+l,f.userData={kind:"expedition_generated_hud_command_glyph",layerVersion:sd,materialityVersion:sn,slot:"command-tray",commandId:String(d.commandId||""),label:String(d.label||""),glyph:String(d.glyph||""),enabled:d.enabled!==!1,liveSource:"server_owned_command_hint",visualOnly:!0,readOnly:!0,selectable:!1,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.generatedHudCommandSprites.push(f),this.scene.add(f)}),this.generatedHudCommandCount=this.generatedHudCommandSprites.length,this.syncGeneratedHudContentSprites()}syncGeneratedHudContentSprites(){let e=this.generatedHudBoundsForSlot("unit-dock"),t=this.generatedHudProfileSprites,i=Number(this.canvas?.clientWidth||0)<=520;if(t.length){let a=i?ot(Math.min(e.height*.66,e.width/Math.max(4.2,t.length+1.4)),.46,.76):ot(Math.min(e.height*.62,e.width/Math.max(4.7,t.length+1.3)),.5,.96),o=i?ot(e.width*.145,a*1.08,a*1.48):ot(e.width*.118,a*1.1,a*1.58),c=e.left+e.width*(i?.47:.34),h=e.bottom+e.height*(i?.55:.53);t.forEach((u,d)=>{u.position.set(c+d*o,h,4.5+d*.004),u.scale.set(a,a,1)})}this.generatedHudTextSprites.forEach(a=>{let o=String(a.userData?.slot||""),c=this.generatedHudBoundsForSlot(o),h=c.width*.48,u=c.height*.46,d=c.left+c.width*.42,l=c.top-c.height*.5,f=c.width,g=c.height;o==="crest-status"?(h=c.width*.54,u=c.height*.48,d=c.left+c.width*.62,l=c.top-c.height*.5):o==="objective-loop"?(h=c.width*.68,u=c.height*.52,d=c.left+c.width*.54,l=c.top-c.height*.5):o==="unit-dock"?(h=c.width*(i?.35:.25),u=c.height*.42,d=c.left+c.width*(i?.31:.15),l=c.bottom+c.height*.57):o==="command-puck"?(c=this.generatedHudBoundsForSlot("command-tray"),h=c.width*(i?.38:.36),u=c.height*.54,d=c.left+c.width*(i?.66:.7),l=c.top-c.height*.48,f=c.width*.74,g=c.height*.78):o==="selected-context"&&(h=c.width*.72,u=c.height*.6,d=c.left+c.width*.56,l=c.top-c.height*.5),a.position.set(d,l,4.62),a.scale.set(ot(h,.58,f),ot(u,.24,g),1)});let r=this.generatedHudBoundsForSlot("command-tray"),s=this.generatedHudCommandSprites;if(s.length){let a=i?ot(Math.min(r.height*.54,r.width/Math.max(4,s.length+.9)),.38,.62):ot(Math.min(r.height*.56,r.width/Math.max(4.4,s.length+1)),.42,.78),o=ot(r.width/Math.max(4.5,s.length+.8),a*1.02,a*1.42),c=r.left+r.width*(i?.26:.28),h=r.bottom+r.height*(i?.52:.51);s.forEach((u,d)=>{u.position.set(c+d*o,h,4.72+d*.004),u.scale.set(a,a,1)})}}applyCameraBounds(){let t=this.visibleSize(),i=this.mapBounds.minX-.85,r=this.mapBounds.maxX+.85,s=this.mapBounds.minY-.85,a=this.mapBounds.maxY+.85,o=Math.max(.01,r-i),c=Math.max(.01,a-s);this.camera.position.x=t.width>=o?(i+r)/2:ot(this.camera.position.x,i+t.width/2,r-t.width/2),this.camera.position.y=t.height>=c?(s+a)/2:ot(this.camera.position.y,s+t.height/2,a-t.height/2),this.camera.zoom=ot(this.camera.zoom,.85,3.4),this.camera.updateProjectionMatrix()}setZoom(e){this.camera.zoom=ot(e,.85,3.4),this.applyCameraBounds(),this.render(),this.notifyViewChange()}resetView(){let e=this.hostNode.getBoundingClientRect();this.camera.zoom=this.preferredHudWorldZoom(e.width,e.height),this.camera.position.x=this.mapBounds.centerX,this.camera.position.y=this.mapBounds.centerY,this.applyCameraBounds(),this.render(),this.notifyViewChange()}panBy(e,t){let i=this.renderer.domElement.getBoundingClientRect(),r=this.visibleSize();this.camera.position.x-=e/Math.max(1,i.width)*r.width,this.camera.position.y+=t/Math.max(1,i.height)*r.height,this.applyCameraBounds(),this.render(),this.notifyViewChange()}notifyViewChange(){this.hostNode.dispatchEvent(new CustomEvent("founders-plot-expedition-map-view-change"))}onWheel(e){e.preventDefault();let t=e.deltaY<0?1.13:1/1.13;this.setZoom(this.camera.zoom*t)}onPointerDown(e){this.activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});try{this.hostNode.setPointerCapture?.(e.pointerId)}catch{}if(this.dragging=!0,this.dragMoved=!1,this.lastPointer={x:e.clientX,y:e.clientY},this.hostNode.dataset.dragging="true",this.activePointers.size>=2){let t=Array.from(this.activePointers.values());this.pinchDistance=Math.hypot(t[0].x-t[1].x,t[0].y-t[1].y),this.pinchZoom=this.camera.zoom}}onPointerMove(e){if(!this.activePointers.has(e.pointerId)){this.setHoverFromPoint(e.clientX,e.clientY);return}let t=this.activePointers.get(e.pointerId);if(this.activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY}),this.activePointers.size>=2){let s=Array.from(this.activePointers.values()),a=Math.hypot(s[0].x-s[1].x,s[0].y-s[1].y);this.pinchDistance>0&&this.setZoom(this.pinchZoom*(a/this.pinchDistance)),this.dragMoved=!0;return}let i=e.clientX-t.x,r=e.clientY-t.y;Math.abs(i)+Math.abs(r)>1&&(this.dragMoved=this.dragMoved||Math.abs(e.clientX-(this.lastPointer?.x||e.clientX))+Math.abs(e.clientY-(this.lastPointer?.y||e.clientY))>4,this.panBy(i,r))}onPointerLeave(){this.setHoverCell("")}onPointerUp(e){let t=this.dragging&&!this.dragMoved&&this.activePointers.size<=1;this.activePointers.delete(e.pointerId);try{this.hostNode.releasePointerCapture?.(e.pointerId)}catch{}if(this.dragging=this.activePointers.size>0,this.dragging||(delete this.hostNode.dataset.dragging,this.pinchDistance=0),t){let i=this.pickFromPoint(e.clientX,e.clientY);if(i)if(i.userData?.kind==="expedition_unit"){let r=Uy(i);this.selectedUnitId=r.unitId,r.cellId&&(this.selectedCellId=r.cellId),r.cellId&&this.setHoverCell(r.cellId),window.dispatchEvent(new CustomEvent("founders-plot-expedition-unit-select",{detail:r}))}else if(["expedition_event_packet_marker","expedition_objective_marker"].includes(String(i.userData?.kind||""))){let r=ky(i);r.cellId&&(this.selectedCellId=r.cellId),r.cellId&&this.setHoverCell(r.cellId),window.dispatchEvent(new CustomEvent("founders-plot-expedition-map-select",{detail:r}))}else if(i.userData?.kind==="expedition_command_target"){let r=By(i);r.cellId&&(this.selectedCellId=r.cellId),r.cellId&&this.setHoverCell(r.cellId),window.dispatchEvent(new CustomEvent("founders-plot-expedition-command-target-preview",{detail:r}))}else{let r=Yy(i);this.selectedCellId=r.cellId,this.setHoverCell(r.cellId),window.dispatchEvent(new CustomEvent("founders-plot-expedition-map-select",{detail:r}))}}}setHoverFromPoint(e,t){let i=this.pickFromPoint(e,t);this.setHoverCell(i?.userData?.cellId||i?.userData?.targetCellId||"")}setHoverCell(e=""){let t=String(e||"");t!==this.hoverCellId&&(this.hoverCellId=t,t?this.hostNode.dataset.hoverCellId=t:delete this.hostNode.dataset.hoverCellId,this.rebuild(),this.render())}pickFromPoint(e,t){let i=this.renderer.domElement.getBoundingClientRect();return this.pointer.x=(e-i.left)/i.width*2-1,this.pointer.y=-((t-i.top)/i.height)*2+1,this.raycaster.setFromCamera(this.pointer,this.camera),this.raycaster.intersectObjects(this.pickables,!1)[0]?.object||null}canvasPointForCell(e){let t=this.cellMeshes.find(i=>String(i.userData?.cellId||"")===String(e||""));return t?this.canvasPointForObject(t):null}canvasPointForObject(e){if(!e)return null;let t=new C;e.getWorldPosition(t),t.project(this.camera);let i=this.renderer.domElement.getBoundingClientRect();return{x:(t.x+1)/2*i.width,y:(-t.y+1)/2*i.height}}updateInfo(){this.syncGeneratedHudWorldCohesionSprites(),this.syncGeneratedHudChromeSprites(),this.syncGeneratedHudContentSprites();let e=this.renderer.domElement,t=this.cells.map(l=>{let f=String(l.fogState||"locked_unknown"),g=jn(l),v=ry(l),p=qc(l,g),m=Kn(p),_=qo(l,g),x=Ds(l),M=Ti(l)?null:Xc(l);return{cellId:String(l.cellId||""),fogState:f,siteType:String(l.siteType||""),kind:String(l.kind||""),publicTerrainText:v,publicTerrainAssetSlot:x,publicTerrainAssetSlotSource:String(l.publicTerrainAssetSlotSource||""),publicTerrainAssetSlotReason:String(l.publicTerrainAssetSlotReason||""),fogAssetSlot:M,terrainAssetContractVersion:String(l.terrainAssetContractVersion||""),terrain:g,runtimeAssetPack:id,assetSlot:p?.slot||null,assetPath:p?.path||null,assetKind:p?.assetKind||null,fogOnly:p?.fogOnly===!0,assetReady:!!m,assetAllowedByServerTruth:ay(l,g,p),underlayTerrain:_.terrain,underlayFogOnly:_.fogOnly===!0,waterCue:g==="water",ruinSignalCue:g==="ruin_signal",hiddenSpecificitySuppressed:!Ti(l)&&g===f}}),i=Array.from(new Map([...Object.values(xd),...Object.values(Bi)].map(l=>[l.path,l])).values()),r=i.filter(l=>!!Qo(l)).length,s=this.generatedHudWorldCohesionSprites.map(l=>({slot:String(l.userData?.slot||""),layerVersion:String(l.userData?.layerVersion||""),cellId:String(l.userData?.cellId||""),visualOnly:l.userData?.visualOnly===!0,readOnly:l.userData?.readOnly===!0,selectable:l.userData?.selectable===!0,routeAuthority:l.userData?.routeAuthority===!0,actionAuthority:l.userData?.actionAuthority===!0,executableActions:Number(l.userData?.executableActions||0),canvas:this.canvasPointForObject(l)})),a=this.generatedHudWorldCohesionLines.map(l=>({slot:String(l.userData?.slot||""),layerVersion:String(l.userData?.layerVersion||""),cellId:String(l.userData?.cellId||""),targetSlot:String(l.userData?.targetSlot||""),visualOnly:l.userData?.visualOnly===!0,readOnly:l.userData?.readOnly===!0,selectable:l.userData?.selectable===!0,routeAuthority:l.userData?.routeAuthority===!0,actionAuthority:l.userData?.actionAuthority===!0,executableActions:Number(l.userData?.executableActions||0),startCanvas:l.userData?.startCanvas||null,endCanvas:l.userData?.endCanvas||null})),o=this.generatedHudChromeSprites.map(l=>({slot:String(l.userData?.slot||""),packId:String(l.userData?.packId||""),assetPath:String(l.userData?.assetPath||""),anchor:String(l.userData?.anchor||""),assetReady:l.userData?.assetReady===!0,cleanCompositeVersion:String(l.userData?.cleanCompositeVersion||""),materialityVersion:String(l.userData?.materialityVersion||""),materialProfile:String(l.userData?.materialProfile||""),chromeSource:String(l.userData?.chromeSource||""),sourceAssetPath:String(l.userData?.sourceAssetPath||""),liveTextSource:String(l.userData?.liveTextSource||""),visualOnly:l.userData?.visualOnly===!0,readOnly:l.userData?.readOnly===!0,selectable:l.userData?.selectable===!0,routeAuthority:l.userData?.routeAuthority===!0,actionAuthority:l.userData?.actionAuthority===!0,executableActions:Number(l.userData?.executableActions||0),canvas:this.canvasPointForObject(l)})),c=this.generatedHudProfileSprites.map(l=>({slot:String(l.userData?.slot||""),layerVersion:String(l.userData?.layerVersion||""),unitId:String(l.userData?.unitId||""),unitType:String(l.userData?.unitType||""),profileMask:String(l.userData?.profileMask||""),profileSource:String(l.userData?.profileSource||""),materialityVersion:String(l.userData?.materialityVersion||""),spriteAssetSlot:String(l.userData?.spriteAssetSlot||""),spriteAssetPath:String(l.userData?.spriteAssetPath||""),spriteAssetReady:l.userData?.spriteAssetReady===!0,visualOnly:l.userData?.visualOnly===!0,readOnly:l.userData?.readOnly===!0,selectable:l.userData?.selectable===!0,routeAuthority:l.userData?.routeAuthority===!0,actionAuthority:l.userData?.actionAuthority===!0,executableActions:Number(l.userData?.executableActions||0),canvas:this.canvasPointForObject(l)})),h=this.generatedHudTextSprites.map(l=>({slot:String(l.userData?.slot||""),layerVersion:String(l.userData?.layerVersion||""),title:String(l.userData?.title||""),meta:String(l.userData?.meta||""),liveTextSource:String(l.userData?.liveTextSource||""),materialityVersion:String(l.userData?.materialityVersion||""),domA11yOverlayRetained:l.userData?.domA11yOverlayRetained===!0,visualOnly:l.userData?.visualOnly===!0,readOnly:l.userData?.readOnly===!0,selectable:l.userData?.selectable===!0,routeAuthority:l.userData?.routeAuthority===!0,actionAuthority:l.userData?.actionAuthority===!0,executableActions:Number(l.userData?.executableActions||0),canvas:this.canvasPointForObject(l)})),u=this.generatedHudCommandSprites.map(l=>({slot:String(l.userData?.slot||""),layerVersion:String(l.userData?.layerVersion||""),commandId:String(l.userData?.commandId||""),label:String(l.userData?.label||""),glyph:String(l.userData?.glyph||""),enabled:l.userData?.enabled!==!1,liveSource:String(l.userData?.liveSource||""),materialityVersion:String(l.userData?.materialityVersion||""),visualOnly:l.userData?.visualOnly===!0,readOnly:l.userData?.readOnly===!0,selectable:l.userData?.selectable===!0,routeAuthority:l.userData?.routeAuthority===!0,actionAuthority:l.userData?.actionAuthority===!0,executableActions:Number(l.userData?.executableActions||0),canvas:this.canvasPointForObject(l)})),d=o.map(l=>({slot:l.slot,owner:"three_canvas",source:"three_canvas_clean_frame",sourceCropPainted:l.chromeSource!=="three_canvas_clean_frame",materialityVersion:l.materialityVersion,materialProfile:l.materialProfile,visualOnly:l.visualOnly,readOnly:l.readOnly,selectable:l.selectable,routeAuthority:l.routeAuthority,actionAuthority:l.actionAuthority,executableActions:l.executableActions,noAuthority:!l.routeAuthority&&!l.actionAuthority&&l.executableActions===0,canvas:l.canvas}));return this.info={renderer:"three.js",surface:"expedition-map",projectionHash:String(this.model?.projectionHash||""),canvasWidth:e.width,canvasHeight:e.height,cellCount:this.cells.length,selectedCellId:String(this.selectedCellId||""),hoverCellId:String(this.hoverCellId||""),zoom:Number(this.camera.zoom.toFixed(3)),visualShell:Gt,visualLayers:{terrainTexture:!0,runtimeRegionAssetPack:id,runtimeRegionAtlas:`${Mi}/manifest.json`,runtimeTerrainUnderlay:yd.path,runtimeSpriteAssetPack:Z_,runtimeSpriteAtlas:`${Fn}/manifest.json`,generatedSpriteAssets:!0,generatedSpriteAssetCount:i.length,generatedSpriteAssetsReady:r,generatedSpriteAssetsVisualOnly:!0,generatedSpriteAssetsReadOnly:!0,singleVisibleHudOwner:!0,visibleHudOwner:"three_canvas",visibleHudOwnerVersion:sd,domVisibleHudDemoted:!0,domHudRole:"transparent_hit_a11y_layer",domHudHitLayerRetained:!0,domHudHitLayerPainted:!1,visibleDomHudPaintCount:0,visibleDomHudTextCount:0,noVisibleDomHudDuplication:!0,rendererNetworkRequests:0,rendererMutationHandlers:[],threeCanvasHudOwnsChrome:!0,threeCanvasHudOwnsProfiles:!0,threeCanvasHudOwnsText:!0,threeCanvasHudOwnsCommandTray:!0,threeCanvasHudOwnsCollapsedLedgerHint:!0,threeCanvasHudNoGameplayAuthority:!0,generatedHudChrome:!0,generatedHudChromeInThreeLayer:!0,generatedHudChromeAssetPack:String(this.model.generatedHudChrome?.packId||Es),generatedHudChromeManifest:`${bi}/manifest.json`,generatedHudChromeSpriteCount:o.length,generatedHudChromeAssetsReady:o.filter(l=>l.assetReady).length,generatedHudChromeCleanComposite:!0,generatedHudChromeCleanCompositeVersion:rd,generatedHudMaterialityPass:!0,generatedHudMaterialityVersion:sn,generatedHudMaterialityRendererOwned:!0,generatedHudMaterialitySource:"procedural_canvas_textures",generatedHudWorldCohesionPass:!0,generatedHudWorldCohesionVersion:ws,generatedHudWorldCohesionSource:"procedural_canvas_textures_and_three_lines",generatedHudWorldCohesionRendererOwned:!0,generatedHudWorldCohesionSpriteCount:s.length,generatedHudWorldCohesionLineCount:a.length,generatedHudWorldCohesionSlots:[...s.map(l=>l.slot),...a.map(l=>l.slot)],generatedHudWorldDepthSeparation:s.some(l=>l.slot==="map-depth-veil"),generatedHudForegroundBridge:s.some(l=>l.slot==="bottom-foreground-bridge"),generatedHudSelectedWorldAura:s.some(l=>l.slot==="selected-world-aura"),generatedHudSelectedContextTether:a.some(l=>l.slot==="selected-context-tether"),generatedHudWorldCohesionVisualOnly:[...s,...a].every(l=>l.visualOnly),generatedHudWorldCohesionReadOnly:[...s,...a].every(l=>l.readOnly),generatedHudWorldCohesionSelectable:[...s,...a].some(l=>l.selectable),generatedHudWorldCohesionAuthority:[...s,...a].some(l=>l.routeAuthority||l.actionAuthority||l.executableActions>0),generatedHudBottomDockTrayBalanced:!0,generatedHudSelectedContextWorldConnection:a.some(l=>l.targetSlot==="selected-context"),generatedHudMaterialityProfiles:c.every(l=>l.materialityVersion===sn),generatedHudMaterialityText:h.every(l=>l.materialityVersion===sn),generatedHudMaterialityCommands:u.every(l=>l.materialityVersion===sn),generatedHudMaterialityChromeSlots:o.filter(l=>l.materialityVersion===sn).map(l=>l.slot),generatedHudChromeSourcePackRetained:o.every(l=>l.sourceAssetPath.includes(`/${Es}/`)),generatedHudChromePaintedSourceCrops:o.some(l=>l.chromeSource!=="three_canvas_clean_frame"),generatedHudChromeSpritesVisualOnly:o.every(l=>l.visualOnly),generatedHudChromeSpritesReadOnly:o.every(l=>l.readOnly),generatedHudChromeSpritesSelectable:o.some(l=>l.selectable),generatedHudChromeAuthority:o.some(l=>l.routeAuthority||l.actionAuthority||l.executableActions>0),generatedHudMaskLayerVersion:Pc,generatedHudProfileMasks:!0,generatedHudProfileMasksInThreeLayer:!0,generatedHudProfileMaskSpriteCount:c.length,generatedHudProfileMaskSpriteAssetsReady:c.filter(l=>l.spriteAssetReady).length,generatedHudProfileMaskType:"circle_alpha_clip",generatedHudProfileMasksVisualOnly:c.every(l=>l.visualOnly),generatedHudProfileMasksReadOnly:c.every(l=>l.readOnly),generatedHudProfileMasksSelectable:c.some(l=>l.selectable),generatedHudProfileMaskAuthority:c.some(l=>l.routeAuthority||l.actionAuthority||l.executableActions>0),generatedHudTextInThreeLayer:!0,generatedHudTextSpriteCount:h.length,generatedHudTextLiveSource:"three_canvas_texture",generatedHudTextDomA11yOverlayRetained:h.every(l=>l.domA11yOverlayRetained),generatedHudTextSpritesVisualOnly:h.every(l=>l.visualOnly),generatedHudTextSpritesReadOnly:h.every(l=>l.readOnly),generatedHudTextSpritesSelectable:h.some(l=>l.selectable),generatedHudTextAuthority:h.some(l=>l.routeAuthority||l.actionAuthority||l.executableActions>0),generatedHudCommandGlyphsInThreeLayer:!0,generatedHudCommandGlyphSpriteCount:u.length,generatedHudCommandGlyphLiveSource:"server_owned_command_hint",generatedHudCommandGlyphsVisualOnly:u.every(l=>l.visualOnly),generatedHudCommandGlyphsReadOnly:u.every(l=>l.readOnly),generatedHudCommandGlyphsSelectable:u.some(l=>l.selectable),generatedHudCommandGlyphAuthority:u.some(l=>l.routeAuthority||l.actionAuthority||l.executableActions>0),serverTerrainAssetContractVersion:Oc,serverTerrainSlotSource:Uc,assetBackedRegionTiles:t.filter(l=>l.assetPath).length,assetBackedLoadedTiles:t.filter(l=>l.assetReady).length,assetBackedTerrainTextures:!0,continuousTerrainUnderlay:!0,continuousTerrainUnderlayVersion:Gt,continuousUnderlayUsesServerOwnedCells:!0,continuousUnderlayHiddenCellsFogOnly:t.filter(l=>!["discovered","known"].includes(l.fogState)).every(l=>l.underlayFogOnly&&l.underlayTerrain===l.fogState),continuousUnderlayVisualOnly:!0,plateBlendLayer:!0,softRegionSeams:!0,reducedPlateEdgeContrast:!0,centerTileMutedForUnderlay:!0,cartographicFogDepth:!0,ambientContourField:!0,fogDepthGlyphsVisualOnly:!0,terrainUnderlayCount:this.terrainUnderlayCount,proceduralFallbackWhenAssetPending:!0,candidate02Cues:!0,agentTownIdentityCues:!0,scoutLedgerHud:!0,mapFirstHudOverlays:!0,hoverAffordance:!0,selectedSectorOutline:!0,beaconPlanWagonCues:!0,homeNodeEmphasis:!0,riverFlatCues:!0,waterCuesServerGated:!0,woodlandRidgeCues:!0,ruinSignalCues:!0,ruinSignalCuesServerGated:!0,lockedUnknownSealedFogOnly:!0,hintedAbstractFogEdge:!0,frontierBoundaryDashes:!0,frontierBoundaryVisualOnly:!0,fogVeils:this.cells.filter(l=>!["discovered","known"].includes(String(l.fogState||""))).length,edgeFogCount:this.edgeFogCount,civicBeaconCount:this.civicBeaconCount,surveyStrokeCount:this.surveyStrokeCount,surveyStrokesVisualOnly:!0,receiptTraceVisualOnly:!0,markerCount:this.markerCount,eventPacketMarkers:!0,eventPacketMarkerCount:this.eventMarkerCount,objectiveMarkers:!0,objectiveMarkerCount:this.objectiveMarkerCount,eventObjectiveMarkersVisualOnly:[...this.eventMarkerSprites,...this.objectiveMarkerSprites].every(l=>l.userData?.visualOnly===!0),eventObjectiveMarkersReadOnly:[...this.eventMarkerSprites,...this.objectiveMarkerSprites].every(l=>l.userData?.readOnly===!0),eventObjectiveMarkersInspectable:[...this.eventMarkerSprites,...this.objectiveMarkerSprites].every(l=>l.userData?.selectable===!0&&l.userData?.inspectable===!0),eventObjectiveMarkerAuthority:!1,outpostNextFrontierBeacon:!0,outpostNextFrontierBeaconCount:this.outpostFrontierBeaconCount,outpostNextFrontierBeaconVisualOnly:this.outpostFrontierBeaconSprites.every(l=>l.userData?.visualOnly===!0),outpostNextFrontierBeaconReadOnly:this.outpostFrontierBeaconSprites.every(l=>l.userData?.readOnly===!0),outpostNextFrontierBeaconSelectable:this.outpostFrontierBeaconSprites.some(l=>l.userData?.selectable===!0),outpostNextFrontierBeaconAuthority:!1,outpostNextFrontierBeaconHiddenTruthLeakage:this.outpostFrontierBeaconSprites.some(l=>l.userData?.hiddenTruthLeakage===!0),unitTokens:!0,unitTokenCount:this.unitTokenCount,unitTokensReadOnly:this.unitSprites.every(l=>l.userData?.readOnly===!0),unitMovementMutationImplemented:this.unitSprites.some(l=>l.userData?.movementMutationImplemented===!0),commandTargetRings:!0,commandTargetCount:this.commandTargetCount,commandTargetRingsVisualOnly:this.commandTargetSprites.every(l=>l.userData?.visualOnly===!0),commandTargetRingsReadOnly:this.commandTargetSprites.every(l=>l.userData?.readOnly===!0),commandTargetRingsSelectable:this.commandTargetSprites.every(l=>l.userData?.selectable===!0),commandTargetRingsPreviewOnly:this.commandTargetSprites.every(l=>l.userData?.previewOnly===!0),commandTargetRingAuthority:!1,commandOutcomeFeedback:this.outcomeFeedbackCount>0,commandOutcomeFeedbackCount:this.outcomeFeedbackCount,commandOutcomeFeedbackVisualOnly:this.outcomeFeedbackSprites.every(l=>l.userData?.visualOnly===!0),commandOutcomeFeedbackReadOnly:this.outcomeFeedbackSprites.every(l=>l.userData?.readOnly===!0),commandOutcomeFeedbackServerOwned:this.outcomeFeedbackSprites.every(l=>l.userData?.serverOwnedResult===!0),commandOutcomeFeedbackSelectable:this.outcomeFeedbackSprites.some(l=>l.userData?.selectable===!0),commandOutcomeFeedbackAuthority:!1,clientAuthority:!1},generatedHudWorldCohesionSprites:s,generatedHudWorldCohesionLines:a,generatedHudChromeSprites:o,generatedHudProfileSprites:c,generatedHudTextSprites:h,generatedHudCommandSprites:u,visibleHudSlots:d,regionConsistency:{waterCueCells:t.filter(l=>l.waterCue).map(l=>l.cellId),ruinSignalCueCells:t.filter(l=>l.ruinSignalCue).map(l=>l.cellId),lockedUnknownCellsSealed:t.filter(l=>l.fogState==="locked_unknown").every(l=>l.hiddenSpecificitySuppressed&&!l.waterCue&&!l.ruinSignalCue),hintedCellsAbstract:t.filter(l=>l.fogState==="hinted").every(l=>l.hiddenSpecificitySuppressed&&!l.waterCue&&!l.ruinSignalCue),waterCuesRequireServerOwnedWater:t.filter(l=>l.waterCue).every(l=>l.publicTerrainAssetSlot==="water"),waterCoastRuntimeAssetsBlocked:t.every(l=>!["water","coast"].includes(String(l.assetSlot||""))),hiddenCellsHaveNoPublicTerrainSlot:t.filter(l=>!["discovered","known"].includes(l.fogState)).every(l=>l.publicTerrainAssetSlot==null),hiddenCellsUseOnlyFogAssets:t.filter(l=>!["discovered","known"].includes(l.fogState)).every(l=>["hinted_frontier_fog","locked_unknown_fog"].includes(String(l.assetSlot||""))&&l.fogOnly===!0&&l.assetKind==="fog_only"),knownDiscoveredAssetsMatchServerTerrain:t.filter(l=>["discovered","known"].includes(l.fogState)&&l.assetPath).every(l=>l.assetAllowedByServerTruth===!0),visibleAssetsMatchPublicTerrainSlot:t.filter(l=>["discovered","known"].includes(l.fogState)&&l.assetPath).every(l=>l.assetSlot===l.publicTerrainAssetSlot&&l.assetKind==="concrete_public_terrain"),serverTerrainAssetContractComplete:t.every(l=>l.terrainAssetContractVersion===Oc&&(["discovered","known"].includes(l.fogState)?l.publicTerrainAssetSlotSource===Uc:l.fogAssetSlot!=null)),runtimeAssetProofMetadataComplete:t.filter(l=>l.assetPath).every(l=>l.cellId&&l.fogState&&l.runtimeAssetPack&&l.assetSlot&&l.assetKind&&typeof l.assetAllowedByServerTruth=="boolean"),runtimeAssetCellsRegionTruthBound:t.filter(l=>l.assetPath).every(l=>l.assetAllowedByServerTruth===!0),continuousUnderlayHiddenCellsFogOnly:t.filter(l=>!["discovered","known"].includes(l.fogState)).every(l=>l.underlayFogOnly&&l.underlayTerrain===l.fogState),continuousUnderlayNoActionAuthority:this.terrainUnderlayCount===1},regionVisuals:t,eventMarkers:this.eventMarkerSprites.map(l=>({packetId:String(l.userData?.packetId||""),cellId:String(l.userData?.cellId||""),templateId:String(l.userData?.templateId||""),spriteAssetSlot:String(l.userData?.spriteAssetSlot||""),spriteAssetPath:String(l.userData?.spriteAssetPath||""),spriteAssetReady:l.userData?.spriteAssetReady===!0,visualOnly:l.userData?.visualOnly===!0,readOnly:l.userData?.readOnly===!0,selectable:l.userData?.selectable===!0,inspectable:l.userData?.inspectable===!0,routeAuthority:l.userData?.routeAuthority===!0,actionAuthority:l.userData?.actionAuthority===!0,executableActions:Number(l.userData?.executableActions||0),canvas:this.canvasPointForObject(l)})),objectiveMarkers:this.objectiveMarkerSprites.map(l=>({mode:String(l.userData?.mode||""),targetCellId:String(l.userData?.targetCellId||""),packetId:String(l.userData?.packetId||""),spriteAssetSlot:String(l.userData?.spriteAssetSlot||""),spriteAssetPath:String(l.userData?.spriteAssetPath||""),spriteAssetReady:l.userData?.spriteAssetReady===!0,visualOnly:l.userData?.visualOnly===!0,readOnly:l.userData?.readOnly===!0,selectable:l.userData?.selectable===!0,inspectable:l.userData?.inspectable===!0,routeAuthority:l.userData?.routeAuthority===!0,actionAuthority:l.userData?.actionAuthority===!0,executableActions:Number(l.userData?.executableActions||0),canvas:this.canvasPointForObject(l)})),outpostNextFrontierBeacons:this.outpostFrontierBeaconSprites.map(l=>({unitId:String(l.userData?.unitId||""),unitType:String(l.userData?.unitType||""),commandId:String(l.userData?.commandId||""),cueLabel:String(l.userData?.cueLabel||""),originCellId:String(l.userData?.originCellId||""),targetCellId:String(l.userData?.targetCellId||""),targetFogState:String(l.userData?.targetFogState||""),targetKind:String(l.userData?.targetKind||""),derivedFrom:String(l.userData?.derivedFrom||""),visualOnly:l.userData?.visualOnly===!0,readOnly:l.userData?.readOnly===!0,selectable:l.userData?.selectable===!0,routeAuthority:l.userData?.routeAuthority===!0,actionAuthority:l.userData?.actionAuthority===!0,executableActions:Number(l.userData?.executableActions||0),hiddenTruthLeakage:l.userData?.hiddenTruthLeakage===!0,canvas:this.canvasPointForObject(l)})),units:this.unitSprites.map(l=>({unitId:String(l.userData?.unitId||""),unitType:String(l.userData?.unitType||""),displayName:String(l.userData?.displayName||""),cellId:String(l.userData?.cellId||""),spriteAssetSlot:String(l.userData?.spriteAssetSlot||""),spriteAssetPath:String(l.userData?.spriteAssetPath||""),spriteAssetReady:l.userData?.spriteAssetReady===!0,selected:String(l.userData?.unitId||"")===String(this.selectedUnitId||""),readOnly:l.userData?.readOnly===!0,movementMutationImplemented:l.userData?.movementMutationImplemented===!0,canvas:this.canvasPointForObject(l)})),commandTargets:this.commandTargetSprites.map(l=>({unitId:String(l.userData?.unitId||""),unitType:String(l.userData?.unitType||""),commandId:String(l.userData?.commandId||""),cellId:String(l.userData?.cellId||""),fogState:String(l.userData?.fogState||""),serverMutationImplemented:l.userData?.serverMutationImplemented===!0,movementMutation:l.userData?.movementMutation===!0,visualOnly:l.userData?.visualOnly===!0,readOnly:l.userData?.readOnly===!0,previewOnly:l.userData?.previewOnly===!0,selectable:l.userData?.selectable===!0,routeAuthority:l.userData?.routeAuthority===!0,actionAuthority:l.userData?.actionAuthority===!0,executableActions:Number(l.userData?.executableActions||0),canvas:this.canvasPointForObject(l)})),commandOutcomeFeedback:this.outcomeFeedbackSprites.map(l=>({feedbackId:String(l.userData?.feedbackId||""),unitId:String(l.userData?.unitId||""),unitType:String(l.userData?.unitType||""),commandId:String(l.userData?.commandId||""),cellId:String(l.userData?.cellId||""),targetCellId:String(l.userData?.targetCellId||""),sourceCellId:String(l.userData?.sourceCellId||""),receiptId:String(l.userData?.receiptId||""),receiptKind:String(l.userData?.receiptKind||""),serverOwnedResult:l.userData?.serverOwnedResult===!0,visualOnly:l.userData?.visualOnly===!0,readOnly:l.userData?.readOnly===!0,selectable:l.userData?.selectable===!0,routeAuthority:l.userData?.routeAuthority===!0,actionAuthority:l.userData?.actionAuthority===!0,executableActions:Number(l.userData?.executableActions||0),canvas:this.canvasPointForObject(l)})),camera:{x:Number(this.camera.position.x.toFixed(3)),y:Number(this.camera.position.y.toFixed(3)),zoom:Number(this.camera.zoom.toFixed(3))},bounds:{minX:Number(this.mapBounds.minX.toFixed(3)),maxX:Number(this.mapBounds.maxX.toFixed(3)),minY:Number(this.mapBounds.minY.toFixed(3)),maxY:Number(this.mapBounds.maxY.toFixed(3))},fogStates:this.cells.reduce((l,f)=>{let g=String(f.fogState||"locked_unknown");return l[g]=Number(l[g]||0)+1,l},{}),pickTargets:this.cells.map(l=>({cellId:String(l.cellId||""),fogState:String(l.fogState||""),terrain:jn(l),status:String(l.status||""),title:String(l.title||""),canvas:this.canvasPointForCell(l.cellId)}))},this.info}render(){this.updateInfo(),this.renderer.render(this.scene,this.camera)}};function $y(n,e,t){let i=Fc.get(n);return i||(i=new Nc(n),Fc.set(n,i)),i.attach(e),i.sync(t||{}),i.info}function Zy(n){let e=Fc.get(n);return e?e.updateInfo():null}function Ky(n,e={},t={}){let i=zi.get(n);return i||(i=new Vc(n),zi.set(n,i)),i.sync(e||{},t.selectedCellId||"",t.selectedUnitId||"",t.outcomeFeedback||null)}function Jy(n){let e=zi.get(n);return e?e.updateInfo():null}function jy(n,e=1){let t=zi.get(n);return t?(t.setZoom(t.camera.zoom*me(e,1)),t.updateInfo()):null}function Qy(n){let e=zi.get(n);return e?(e.resetView(),e.updateInfo()):null}function ex(n){let e=zi.get(n);e&&(e.dispose(),zi.delete(n))}window.FoundersPlotThreeRenderer={renderPlotScene:$y,getPlotSceneInfo:Zy,renderExpeditionMap:Ky,getExpeditionMapInfo:Jy,zoomExpeditionMap:jy,resetExpeditionMapCamera:Qy,disposeExpeditionMap:ex};})();
