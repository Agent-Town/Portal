var FoundersPlotThreeBundle=(()=>{var Vh=0,Xl=1,Gh=2;var ps=1,Wh=2,Er=3,Xn=0,Vt=1,Bt=2,Pn=0,Di=1,ql=2,Yl=3,$l=4,Xh=5;var ci=100,qh=101,Yh=102,$h=103,Zh=104,Kh=200,Jh=201,jh=202,Qh=203,da=204,fa=205,eu=206,tu=207,nu=208,iu=209,ru=210,su=211,au=212,ou=213,lu=214,pa=0,ma=1,ga=2,Li=3,_a=4,ya=5,xa=6,va=7,Zl=0,cu=1,hu=2,gn=0,Kl=1,Jl=2,jl=3,Ql=4,ec=5,tc=6,nc=7;var ic=300,_i=301,Ui=302,eo=303,to=304,ms=306,Sa=1e3,Jt=1001,ba=1002,Dt=1003,uu=1004;var gs=1005;var de=1006,no=1007;var _n=1008;var rn=1009,rc=1010,sc=1011,wr=1012,io=1013,yn=1014,xn=1015,Dn=1016,ro=1017,so=1018,Ar=1020,ac=35902,oc=35899,lc=1021,cc=1022,cn=1023,An=1026,yi=1027,hc=1028,ao=1029,xi=1030,oo=1031;var lo=1033,_s=33776,ys=33777,xs=33778,vs=33779,co=35840,ho=35841,uo=35842,fo=35843,po=36196,mo=37492,go=37496,_o=37488,yo=37489,Ss=37490,xo=37491,vo=37808,So=37809,bo=37810,Mo=37811,To=37812,Eo=37813,wo=37814,Ao=37815,Co=37816,Ro=37817,Io=37818,Po=37819,Do=37820,Lo=37821,Fo=36492,No=36494,Oo=36495,Uo=36283,ko=36284,bs=36285,Bo=36286;var Gr=2300,Ma=2301,ha=2302,Ll=2303,Fl=2400,Nl=2401,Ol=2402;var du=3200;var uc=0,fu=1,$n="",Le="srgb",Wr="srgb-linear",Xr="linear",Qe="srgb";var Pi=7680;var Ul=519,pu=512,mu=513,gu=514,Ho=515,_u=516,yu=517,zo=518,xu=519,Ta=35044;var dc="300 es",fn=2e3,qr=2001;function Wd(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function Xd(n){return ArrayBuffer.isView(n)&&!(n instanceof DataView)}function hr(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function vu(){let n=hr("canvas");return n.style.display="block",n}var ch={},ur=null;function Yr(...n){let e="THREE."+n.shift();ur?ur("log",e,...n):console.log(e,...n)}function Su(n){let e=n[0];if(typeof e=="string"&&e.startsWith("TSL:")){let t=n[1];t&&t.isStackTrace?n[0]+=" "+t.getLocation():n[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return n}function Ce(...n){n=Su(n);let e="THREE."+n.shift();if(ur)ur("warn",e,...n);else{let t=n[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...n)}}function Re(...n){n=Su(n);let e="THREE."+n.shift();if(ur)ur("error",e,...n);else{let t=n[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...n)}}function Ea(...n){let e=n.join(" ");e in ch||(ch[e]=!0,Ce(...n))}function bu(n,e,t){return new Promise(function(i,r){function s(){switch(n.clientWaitSync(e,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:r();break;case n.TIMEOUT_EXPIRED:setTimeout(s,t);break;default:i()}}setTimeout(s,t)})}var Mu={[pa]:ma,[ga]:xa,[_a]:va,[Li]:ya,[ma]:pa,[xa]:ga,[va]:_a,[ya]:Li},Cn=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){let i=this._listeners;return i===void 0?!1:i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){let i=this._listeners;if(i===void 0)return;let r=i[e];if(r!==void 0){let s=r.indexOf(t);s!==-1&&r.splice(s,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let i=t[e.type];if(i!==void 0){e.target=this;let r=i.slice(0);for(let s=0,a=r.length;s<a;s++)r[s].call(this,e);e.target=null}}},Ut=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var sl=Math.PI/180,wa=180/Math.PI;function Gn(){let n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Ut[n&255]+Ut[n>>8&255]+Ut[n>>16&255]+Ut[n>>24&255]+"-"+Ut[e&255]+Ut[e>>8&255]+"-"+Ut[e>>16&15|64]+Ut[e>>24&255]+"-"+Ut[t&63|128]+Ut[t>>8&255]+"-"+Ut[t>>16&255]+Ut[t>>24&255]+Ut[i&255]+Ut[i>>8&255]+Ut[i>>16&255]+Ut[i>>24&255]).toLowerCase()}function Ge(n,e,t){return Math.max(e,Math.min(t,n))}function qd(n,e){return(n%e+e)%e}function al(n,e,t){return(1-t)*n+t*e}function wn(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("Invalid component type.")}}function rt(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("Invalid component type.")}}var xe=class n{static{n.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,i=this.y,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6],this.y=r[1]*t+r[4]*i+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Ge(this.x,e.x,t.x),this.y=Ge(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=Ge(this.x,e,t),this.y=Ge(this.y,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Ge(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(Ge(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let i=Math.cos(t),r=Math.sin(t),s=this.x-e.x,a=this.y-e.y;return this.x=s*i-a*r+e.x,this.y=s*r+a*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Rn=class{constructor(e=0,t=0,i=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=r}static slerpFlat(e,t,i,r,s,a,o){let l=i[r+0],h=i[r+1],u=i[r+2],d=i[r+3],f=s[a+0],c=s[a+1],g=s[a+2],S=s[a+3];if(d!==S||l!==f||h!==c||u!==g){let m=l*f+h*c+u*g+d*S;m<0&&(f=-f,c=-c,g=-g,S=-S,m=-m);let p=1-o;if(m<.9995){let M=Math.acos(m),_=Math.sin(M);p=Math.sin(p*M)/_,o=Math.sin(o*M)/_,l=l*p+f*o,h=h*p+c*o,u=u*p+g*o,d=d*p+S*o}else{l=l*p+f*o,h=h*p+c*o,u=u*p+g*o,d=d*p+S*o;let M=1/Math.sqrt(l*l+h*h+u*u+d*d);l*=M,h*=M,u*=M,d*=M}}e[t]=l,e[t+1]=h,e[t+2]=u,e[t+3]=d}static multiplyQuaternionsFlat(e,t,i,r,s,a){let o=i[r],l=i[r+1],h=i[r+2],u=i[r+3],d=s[a],f=s[a+1],c=s[a+2],g=s[a+3];return e[t]=o*g+u*d+l*c-h*f,e[t+1]=l*g+u*f+h*d-o*c,e[t+2]=h*g+u*c+o*f-l*d,e[t+3]=u*g-o*d-l*f-h*c,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,r){return this._x=e,this._y=t,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let i=e._x,r=e._y,s=e._z,a=e._order,o=Math.cos,l=Math.sin,h=o(i/2),u=o(r/2),d=o(s/2),f=l(i/2),c=l(r/2),g=l(s/2);switch(a){case"XYZ":this._x=f*u*d+h*c*g,this._y=h*c*d-f*u*g,this._z=h*u*g+f*c*d,this._w=h*u*d-f*c*g;break;case"YXZ":this._x=f*u*d+h*c*g,this._y=h*c*d-f*u*g,this._z=h*u*g-f*c*d,this._w=h*u*d+f*c*g;break;case"ZXY":this._x=f*u*d-h*c*g,this._y=h*c*d+f*u*g,this._z=h*u*g+f*c*d,this._w=h*u*d-f*c*g;break;case"ZYX":this._x=f*u*d-h*c*g,this._y=h*c*d+f*u*g,this._z=h*u*g-f*c*d,this._w=h*u*d+f*c*g;break;case"YZX":this._x=f*u*d+h*c*g,this._y=h*c*d+f*u*g,this._z=h*u*g-f*c*d,this._w=h*u*d-f*c*g;break;case"XZY":this._x=f*u*d-h*c*g,this._y=h*c*d-f*u*g,this._z=h*u*g+f*c*d,this._w=h*u*d+f*c*g;break;default:Ce("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let i=t/2,r=Math.sin(i);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,i=t[0],r=t[4],s=t[8],a=t[1],o=t[5],l=t[9],h=t[2],u=t[6],d=t[10],f=i+o+d;if(f>0){let c=.5/Math.sqrt(f+1);this._w=.25/c,this._x=(u-l)*c,this._y=(s-h)*c,this._z=(a-r)*c}else if(i>o&&i>d){let c=2*Math.sqrt(1+i-o-d);this._w=(u-l)/c,this._x=.25*c,this._y=(r+a)/c,this._z=(s+h)/c}else if(o>d){let c=2*Math.sqrt(1+o-i-d);this._w=(s-h)/c,this._x=(r+a)/c,this._y=.25*c,this._z=(l+u)/c}else{let c=2*Math.sqrt(1+d-i-o);this._w=(a-r)/c,this._x=(s+h)/c,this._y=(l+u)/c,this._z=.25*c}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<1e-8?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Ge(this.dot(e),-1,1)))}rotateTowards(e,t){let i=this.angleTo(e);if(i===0)return this;let r=Math.min(1,t/i);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let i=e._x,r=e._y,s=e._z,a=e._w,o=t._x,l=t._y,h=t._z,u=t._w;return this._x=i*u+a*o+r*h-s*l,this._y=r*u+a*l+s*o-i*h,this._z=s*u+a*h+i*l-r*o,this._w=a*u-i*o-r*l-s*h,this._onChangeCallback(),this}slerp(e,t){let i=e._x,r=e._y,s=e._z,a=e._w,o=this.dot(e);o<0&&(i=-i,r=-r,s=-s,a=-a,o=-o);let l=1-t;if(o<.9995){let h=Math.acos(o),u=Math.sin(h);l=Math.sin(l*h)/u,t=Math.sin(t*h)/u,this._x=this._x*l+i*t,this._y=this._y*l+r*t,this._z=this._z*l+s*t,this._w=this._w*l+a*t,this._onChangeCallback()}else this._x=this._x*l+i*t,this._y=this._y*l+r*t,this._z=this._z*l+s*t,this._w=this._w*l+a*t,this.normalize();return this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),r=Math.sqrt(1-i),s=Math.sqrt(i);return this.set(r*Math.sin(e),r*Math.cos(e),s*Math.sin(t),s*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},R=class n{static{n.prototype.isVector3=!0}constructor(e=0,t=0,i=0){this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(hh.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(hh.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[3]*i+s[6]*r,this.y=s[1]*t+s[4]*i+s[7]*r,this.z=s[2]*t+s[5]*i+s[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,i=this.y,r=this.z,s=e.elements,a=1/(s[3]*t+s[7]*i+s[11]*r+s[15]);return this.x=(s[0]*t+s[4]*i+s[8]*r+s[12])*a,this.y=(s[1]*t+s[5]*i+s[9]*r+s[13])*a,this.z=(s[2]*t+s[6]*i+s[10]*r+s[14])*a,this}applyQuaternion(e){let t=this.x,i=this.y,r=this.z,s=e.x,a=e.y,o=e.z,l=e.w,h=2*(a*r-o*i),u=2*(o*t-s*r),d=2*(s*i-a*t);return this.x=t+l*h+a*d-o*u,this.y=i+l*u+o*h-s*d,this.z=r+l*d+s*u-a*h,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[4]*i+s[8]*r,this.y=s[1]*t+s[5]*i+s[9]*r,this.z=s[2]*t+s[6]*i+s[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Ge(this.x,e.x,t.x),this.y=Ge(this.y,e.y,t.y),this.z=Ge(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=Ge(this.x,e,t),this.y=Ge(this.y,e,t),this.z=Ge(this.z,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Ge(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let i=e.x,r=e.y,s=e.z,a=t.x,o=t.y,l=t.z;return this.x=r*l-s*o,this.y=s*a-i*l,this.z=i*o-r*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return ol.copy(this).projectOnVector(e),this.sub(ol)}reflect(e){return this.sub(ol.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(Ge(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y,r=this.z-e.z;return t*t+i*i+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){let r=Math.sin(t)*e;return this.x=r*Math.sin(i),this.y=Math.cos(t)*e,this.z=r*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},ol=new R,hh=new Rn,Fe=class n{static{n.prototype.isMatrix3=!0}constructor(e,t,i,r,s,a,o,l,h){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,a,o,l,h)}set(e,t,i,r,s,a,o,l,h){let u=this.elements;return u[0]=e,u[1]=r,u[2]=o,u[3]=t,u[4]=s,u[5]=l,u[6]=i,u[7]=a,u[8]=h,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,r=t.elements,s=this.elements,a=i[0],o=i[3],l=i[6],h=i[1],u=i[4],d=i[7],f=i[2],c=i[5],g=i[8],S=r[0],m=r[3],p=r[6],M=r[1],_=r[4],x=r[7],w=r[2],E=r[5],C=r[8];return s[0]=a*S+o*M+l*w,s[3]=a*m+o*_+l*E,s[6]=a*p+o*x+l*C,s[1]=h*S+u*M+d*w,s[4]=h*m+u*_+d*E,s[7]=h*p+u*x+d*C,s[2]=f*S+c*M+g*w,s[5]=f*m+c*_+g*E,s[8]=f*p+c*x+g*C,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],h=e[7],u=e[8];return t*a*u-t*o*h-i*s*u+i*o*l+r*s*h-r*a*l}invert(){let e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],h=e[7],u=e[8],d=u*a-o*h,f=o*l-u*s,c=h*s-a*l,g=t*d+i*f+r*c;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let S=1/g;return e[0]=d*S,e[1]=(r*h-u*i)*S,e[2]=(o*i-r*a)*S,e[3]=f*S,e[4]=(u*t-r*l)*S,e[5]=(r*s-o*t)*S,e[6]=c*S,e[7]=(i*l-h*t)*S,e[8]=(a*t-i*s)*S,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,r,s,a,o){let l=Math.cos(s),h=Math.sin(s);return this.set(i*l,i*h,-i*(l*a+h*o)+a+e,-r*h,r*l,-r*(-h*a+l*o)+o+t,0,0,1),this}scale(e,t){return this.premultiply(ll.makeScale(e,t)),this}rotate(e){return this.premultiply(ll.makeRotation(-e)),this}translate(e,t){return this.premultiply(ll.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,i=e.elements;for(let r=0;r<9;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}},ll=new Fe,uh=new Fe().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),dh=new Fe().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Yd(){let n={enabled:!0,workingColorSpace:Wr,spaces:{},convert:function(r,s,a){return this.enabled===!1||s===a||!s||!a||(this.spaces[s].transfer===Qe&&(r.r=Wn(r.r),r.g=Wn(r.g),r.b=Wn(r.b)),this.spaces[s].primaries!==this.spaces[a].primaries&&(r.applyMatrix3(this.spaces[s].toXYZ),r.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===Qe&&(r.r=lr(r.r),r.g=lr(r.g),r.b=lr(r.b))),r},workingToColorSpace:function(r,s){return this.convert(r,this.workingColorSpace,s)},colorSpaceToWorking:function(r,s){return this.convert(r,s,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===$n?Xr:this.spaces[r].transfer},getToneMappingMode:function(r){return this.spaces[r].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(r,s=this.workingColorSpace){return r.fromArray(this.spaces[s].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,s,a){return r.copy(this.spaces[s].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(r,s){return Ea("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),n.workingToColorSpace(r,s)},toWorkingColorSpace:function(r,s){return Ea("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),n.colorSpaceToWorking(r,s)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],i=[.3127,.329];return n.define({[Wr]:{primaries:e,whitePoint:i,transfer:Xr,toXYZ:uh,fromXYZ:dh,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:Le},outputColorSpaceConfig:{drawingBufferColorSpace:Le}},[Le]:{primaries:e,whitePoint:i,transfer:Qe,toXYZ:uh,fromXYZ:dh,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:Le}}}),n}var Ye=Yd();function Wn(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function lr(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}var Xi,Aa=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let i;if(e instanceof HTMLCanvasElement)i=e;else{Xi===void 0&&(Xi=hr("canvas")),Xi.width=e.width,Xi.height=e.height;let r=Xi.getContext("2d");e instanceof ImageData?r.putImageData(e,0,0):r.drawImage(e,0,0,e.width,e.height),i=Xi}return i.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=hr("canvas");t.width=e.width,t.height=e.height;let i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);let r=i.getImageData(0,0,e.width,e.height),s=r.data;for(let a=0;a<s.length;a++)s[a]=Wn(s[a]/255)*255;return i.putImageData(r,0,0),t}else if(e.data){let t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(Wn(t[i]/255)*255):t[i]=Wn(t[i]);return{data:t,width:e.width,height:e.height}}else return Ce("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},$d=0,dr=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:$d++}),this.uuid=Gn(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let a=0,o=r.length;a<o;a++)r[a].isDataTexture?s.push(cl(r[a].image)):s.push(cl(r[a]))}else s=cl(r);i.url=s}return t||(e.images[this.uuid]=i),i}};function cl(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?Aa.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(Ce("Texture: Unable to serialize Texture."),{})}var Zd=0,hl=new R,Lt=class n extends Cn{constructor(e=n.DEFAULT_IMAGE,t=n.DEFAULT_MAPPING,i=Jt,r=Jt,s=de,a=_n,o=cn,l=rn,h=n.DEFAULT_ANISOTROPY,u=$n){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Zd++}),this.uuid=Gn(),this.name="",this.source=new dr(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=s,this.minFilter=a,this.anisotropy=h,this.format=o,this.internalFormat=null,this.type=l,this.offset=new xe(0,0),this.repeat=new xe(1,1),this.center=new xe(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Fe,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(hl).x}get height(){return this.source.getSize(hl).y}get depth(){return this.source.getSize(hl).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let i=e[t];if(i===void 0){Ce(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){Ce(`Texture.setValues(): property '${t}' does not exist.`);continue}r&&i&&r.isVector2&&i.isVector2||r&&i&&r.isVector3&&i.isVector3||r&&i&&r.isMatrix3&&i.isMatrix3?r.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==ic)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Sa:e.x=e.x-Math.floor(e.x);break;case Jt:e.x=e.x<0?0:1;break;case ba:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Sa:e.y=e.y-Math.floor(e.y);break;case Jt:e.y=e.y<0?0:1;break;case ba:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Lt.DEFAULT_IMAGE=null;Lt.DEFAULT_MAPPING=ic;Lt.DEFAULT_ANISOTROPY=1;var bt=class n{static{n.prototype.isVector4=!0}constructor(e=0,t=0,i=0,r=1){this.x=e,this.y=t,this.z=i,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,r){return this.x=e,this.y=t,this.z=i,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,i=this.y,r=this.z,s=this.w,a=e.elements;return this.x=a[0]*t+a[4]*i+a[8]*r+a[12]*s,this.y=a[1]*t+a[5]*i+a[9]*r+a[13]*s,this.z=a[2]*t+a[6]*i+a[10]*r+a[14]*s,this.w=a[3]*t+a[7]*i+a[11]*r+a[15]*s,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,r,s,l=e.elements,h=l[0],u=l[4],d=l[8],f=l[1],c=l[5],g=l[9],S=l[2],m=l[6],p=l[10];if(Math.abs(u-f)<.01&&Math.abs(d-S)<.01&&Math.abs(g-m)<.01){if(Math.abs(u+f)<.1&&Math.abs(d+S)<.1&&Math.abs(g+m)<.1&&Math.abs(h+c+p-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let _=(h+1)/2,x=(c+1)/2,w=(p+1)/2,E=(u+f)/4,C=(d+S)/4,v=(g+m)/4;return _>x&&_>w?_<.01?(i=0,r=.707106781,s=.707106781):(i=Math.sqrt(_),r=E/i,s=C/i):x>w?x<.01?(i=.707106781,r=0,s=.707106781):(r=Math.sqrt(x),i=E/r,s=v/r):w<.01?(i=.707106781,r=.707106781,s=0):(s=Math.sqrt(w),i=C/s,r=v/s),this.set(i,r,s,t),this}let M=Math.sqrt((m-g)*(m-g)+(d-S)*(d-S)+(f-u)*(f-u));return Math.abs(M)<.001&&(M=1),this.x=(m-g)/M,this.y=(d-S)/M,this.z=(f-u)/M,this.w=Math.acos((h+c+p-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Ge(this.x,e.x,t.x),this.y=Ge(this.y,e.y,t.y),this.z=Ge(this.z,e.z,t.z),this.w=Ge(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=Ge(this.x,e,t),this.y=Ge(this.y,e,t),this.z=Ge(this.z,e,t),this.w=Ge(this.w,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Ge(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Ca=class extends Cn{constructor(e=1,t=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:de,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1},i),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=i.depth,this.scissor=new bt(0,0,e,t),this.scissorTest=!1,this.viewport=new bt(0,0,e,t),this.textures=[];let r={width:e,height:t,depth:i.depth},s=new Lt(r),a=i.count;for(let o=0;o<a;o++)this.textures[o]=s.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview}_setTextureOptions(e={}){let t={minFilter:de,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let r=0,s=this.textures.length;r<s;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=i,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,i=e.textures.length;t<i;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let r=Object.assign({},e.textures[t].image);this.textures[t].source=new dr(r)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this.multiview=e.multiview,this}dispose(){this.dispatchEvent({type:"dispose"})}},jt=class extends Ca{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}},$r=class extends Lt{constructor(e=null,t=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=Dt,this.minFilter=Dt,this.wrapR=Jt,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var Ra=class extends Lt{constructor(e=null,t=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=Dt,this.minFilter=Dt,this.wrapR=Jt,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var ft=class n{static{n.prototype.isMatrix4=!0}constructor(e,t,i,r,s,a,o,l,h,u,d,f,c,g,S,m){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,a,o,l,h,u,d,f,c,g,S,m)}set(e,t,i,r,s,a,o,l,h,u,d,f,c,g,S,m){let p=this.elements;return p[0]=e,p[4]=t,p[8]=i,p[12]=r,p[1]=s,p[5]=a,p[9]=o,p[13]=l,p[2]=h,p[6]=u,p[10]=d,p[14]=f,p[3]=c,p[7]=g,p[11]=S,p[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new n().fromArray(this.elements)}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){let t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return this.determinant()===0?(e.set(1,0,0),t.set(0,1,0),i.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){if(e.determinant()===0)return this.identity();let t=this.elements,i=e.elements,r=1/qi.setFromMatrixColumn(e,0).length(),s=1/qi.setFromMatrixColumn(e,1).length(),a=1/qi.setFromMatrixColumn(e,2).length();return t[0]=i[0]*r,t[1]=i[1]*r,t[2]=i[2]*r,t[3]=0,t[4]=i[4]*s,t[5]=i[5]*s,t[6]=i[6]*s,t[7]=0,t[8]=i[8]*a,t[9]=i[9]*a,t[10]=i[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,i=e.x,r=e.y,s=e.z,a=Math.cos(i),o=Math.sin(i),l=Math.cos(r),h=Math.sin(r),u=Math.cos(s),d=Math.sin(s);if(e.order==="XYZ"){let f=a*u,c=a*d,g=o*u,S=o*d;t[0]=l*u,t[4]=-l*d,t[8]=h,t[1]=c+g*h,t[5]=f-S*h,t[9]=-o*l,t[2]=S-f*h,t[6]=g+c*h,t[10]=a*l}else if(e.order==="YXZ"){let f=l*u,c=l*d,g=h*u,S=h*d;t[0]=f+S*o,t[4]=g*o-c,t[8]=a*h,t[1]=a*d,t[5]=a*u,t[9]=-o,t[2]=c*o-g,t[6]=S+f*o,t[10]=a*l}else if(e.order==="ZXY"){let f=l*u,c=l*d,g=h*u,S=h*d;t[0]=f-S*o,t[4]=-a*d,t[8]=g+c*o,t[1]=c+g*o,t[5]=a*u,t[9]=S-f*o,t[2]=-a*h,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){let f=a*u,c=a*d,g=o*u,S=o*d;t[0]=l*u,t[4]=g*h-c,t[8]=f*h+S,t[1]=l*d,t[5]=S*h+f,t[9]=c*h-g,t[2]=-h,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){let f=a*l,c=a*h,g=o*l,S=o*h;t[0]=l*u,t[4]=S-f*d,t[8]=g*d+c,t[1]=d,t[5]=a*u,t[9]=-o*u,t[2]=-h*u,t[6]=c*d+g,t[10]=f-S*d}else if(e.order==="XZY"){let f=a*l,c=a*h,g=o*l,S=o*h;t[0]=l*u,t[4]=-d,t[8]=h*u,t[1]=f*d+S,t[5]=a*u,t[9]=c*d-g,t[2]=g*d-c,t[6]=o*u,t[10]=S*d+f}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Kd,e,Jd)}lookAt(e,t,i){let r=this.elements;return Zt.subVectors(e,t),Zt.lengthSq()===0&&(Zt.z=1),Zt.normalize(),ii.crossVectors(i,Zt),ii.lengthSq()===0&&(Math.abs(i.z)===1?Zt.x+=1e-4:Zt.z+=1e-4,Zt.normalize(),ii.crossVectors(i,Zt)),ii.normalize(),Us.crossVectors(Zt,ii),r[0]=ii.x,r[4]=Us.x,r[8]=Zt.x,r[1]=ii.y,r[5]=Us.y,r[9]=Zt.y,r[2]=ii.z,r[6]=Us.z,r[10]=Zt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,r=t.elements,s=this.elements,a=i[0],o=i[4],l=i[8],h=i[12],u=i[1],d=i[5],f=i[9],c=i[13],g=i[2],S=i[6],m=i[10],p=i[14],M=i[3],_=i[7],x=i[11],w=i[15],E=r[0],C=r[4],v=r[8],A=r[12],L=r[1],I=r[5],O=r[9],G=r[13],W=r[2],N=r[6],H=r[10],V=r[14],j=r[3],Q=r[7],he=r[11],be=r[15];return s[0]=a*E+o*L+l*W+h*j,s[4]=a*C+o*I+l*N+h*Q,s[8]=a*v+o*O+l*H+h*he,s[12]=a*A+o*G+l*V+h*be,s[1]=u*E+d*L+f*W+c*j,s[5]=u*C+d*I+f*N+c*Q,s[9]=u*v+d*O+f*H+c*he,s[13]=u*A+d*G+f*V+c*be,s[2]=g*E+S*L+m*W+p*j,s[6]=g*C+S*I+m*N+p*Q,s[10]=g*v+S*O+m*H+p*he,s[14]=g*A+S*G+m*V+p*be,s[3]=M*E+_*L+x*W+w*j,s[7]=M*C+_*I+x*N+w*Q,s[11]=M*v+_*O+x*H+w*he,s[15]=M*A+_*G+x*V+w*be,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[4],r=e[8],s=e[12],a=e[1],o=e[5],l=e[9],h=e[13],u=e[2],d=e[6],f=e[10],c=e[14],g=e[3],S=e[7],m=e[11],p=e[15],M=l*c-h*f,_=o*c-h*d,x=o*f-l*d,w=a*c-h*u,E=a*f-l*u,C=a*d-o*u;return t*(S*M-m*_+p*x)-i*(g*M-m*w+p*E)+r*(g*_-S*w+p*C)-s*(g*x-S*E+m*C)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){let r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=i),this}invert(){let e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],h=e[7],u=e[8],d=e[9],f=e[10],c=e[11],g=e[12],S=e[13],m=e[14],p=e[15],M=t*o-i*a,_=t*l-r*a,x=t*h-s*a,w=i*l-r*o,E=i*h-s*o,C=r*h-s*l,v=u*S-d*g,A=u*m-f*g,L=u*p-c*g,I=d*m-f*S,O=d*p-c*S,G=f*p-c*m,W=M*G-_*O+x*I+w*L-E*A+C*v;if(W===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let N=1/W;return e[0]=(o*G-l*O+h*I)*N,e[1]=(r*O-i*G-s*I)*N,e[2]=(S*C-m*E+p*w)*N,e[3]=(f*E-d*C-c*w)*N,e[4]=(l*L-a*G-h*A)*N,e[5]=(t*G-r*L+s*A)*N,e[6]=(m*x-g*C-p*_)*N,e[7]=(u*C-f*x+c*_)*N,e[8]=(a*O-o*L+h*v)*N,e[9]=(i*L-t*O-s*v)*N,e[10]=(g*E-S*x+p*M)*N,e[11]=(d*x-u*E-c*M)*N,e[12]=(o*A-a*I-l*v)*N,e[13]=(t*I-i*A+r*v)*N,e[14]=(S*_-g*w-m*M)*N,e[15]=(u*w-d*_+f*M)*N,this}scale(e){let t=this.elements,i=e.x,r=e.y,s=e.z;return t[0]*=i,t[4]*=r,t[8]*=s,t[1]*=i,t[5]*=r,t[9]*=s,t[2]*=i,t[6]*=r,t[10]*=s,t[3]*=i,t[7]*=r,t[11]*=s,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,r))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let i=Math.cos(t),r=Math.sin(t),s=1-i,a=e.x,o=e.y,l=e.z,h=s*a,u=s*o;return this.set(h*a+i,h*o-r*l,h*l+r*o,0,h*o+r*l,u*o+i,u*l-r*a,0,h*l-r*o,u*l+r*a,s*l*l+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,r,s,a){return this.set(1,i,s,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,i){let r=this.elements,s=t._x,a=t._y,o=t._z,l=t._w,h=s+s,u=a+a,d=o+o,f=s*h,c=s*u,g=s*d,S=a*u,m=a*d,p=o*d,M=l*h,_=l*u,x=l*d,w=i.x,E=i.y,C=i.z;return r[0]=(1-(S+p))*w,r[1]=(c+x)*w,r[2]=(g-_)*w,r[3]=0,r[4]=(c-x)*E,r[5]=(1-(f+p))*E,r[6]=(m+M)*E,r[7]=0,r[8]=(g+_)*C,r[9]=(m-M)*C,r[10]=(1-(f+S))*C,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,i){let r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];let s=this.determinant();if(s===0)return i.set(1,1,1),t.identity(),this;let a=qi.set(r[0],r[1],r[2]).length(),o=qi.set(r[4],r[5],r[6]).length(),l=qi.set(r[8],r[9],r[10]).length();s<0&&(a=-a),hn.copy(this);let h=1/a,u=1/o,d=1/l;return hn.elements[0]*=h,hn.elements[1]*=h,hn.elements[2]*=h,hn.elements[4]*=u,hn.elements[5]*=u,hn.elements[6]*=u,hn.elements[8]*=d,hn.elements[9]*=d,hn.elements[10]*=d,t.setFromRotationMatrix(hn),i.x=a,i.y=o,i.z=l,this}makePerspective(e,t,i,r,s,a,o=fn,l=!1){let h=this.elements,u=2*s/(t-e),d=2*s/(i-r),f=(t+e)/(t-e),c=(i+r)/(i-r),g,S;if(l)g=s/(a-s),S=a*s/(a-s);else if(o===fn)g=-(a+s)/(a-s),S=-2*a*s/(a-s);else if(o===qr)g=-a/(a-s),S=-a*s/(a-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return h[0]=u,h[4]=0,h[8]=f,h[12]=0,h[1]=0,h[5]=d,h[9]=c,h[13]=0,h[2]=0,h[6]=0,h[10]=g,h[14]=S,h[3]=0,h[7]=0,h[11]=-1,h[15]=0,this}makeOrthographic(e,t,i,r,s,a,o=fn,l=!1){let h=this.elements,u=2/(t-e),d=2/(i-r),f=-(t+e)/(t-e),c=-(i+r)/(i-r),g,S;if(l)g=1/(a-s),S=a/(a-s);else if(o===fn)g=-2/(a-s),S=-(a+s)/(a-s);else if(o===qr)g=-1/(a-s),S=-s/(a-s);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return h[0]=u,h[4]=0,h[8]=0,h[12]=f,h[1]=0,h[5]=d,h[9]=0,h[13]=c,h[2]=0,h[6]=0,h[10]=g,h[14]=S,h[3]=0,h[7]=0,h[11]=0,h[15]=1,this}equals(e){let t=this.elements,i=e.elements;for(let r=0;r<16;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}},qi=new R,hn=new ft,Kd=new R(0,0,0),Jd=new R(1,1,1),ii=new R,Us=new R,Zt=new R,fh=new ft,ph=new Rn,hi=class n{constructor(e=0,t=0,i=0,r=n.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,r=this._order){return this._x=e,this._y=t,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){let r=e.elements,s=r[0],a=r[4],o=r[8],l=r[1],h=r[5],u=r[9],d=r[2],f=r[6],c=r[10];switch(t){case"XYZ":this._y=Math.asin(Ge(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-u,c),this._z=Math.atan2(-a,s)):(this._x=Math.atan2(f,h),this._z=0);break;case"YXZ":this._x=Math.asin(-Ge(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(o,c),this._z=Math.atan2(l,h)):(this._y=Math.atan2(-d,s),this._z=0);break;case"ZXY":this._x=Math.asin(Ge(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(-d,c),this._z=Math.atan2(-a,h)):(this._y=0,this._z=Math.atan2(l,s));break;case"ZYX":this._y=Math.asin(-Ge(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(f,c),this._z=Math.atan2(l,s)):(this._x=0,this._z=Math.atan2(-a,h));break;case"YZX":this._z=Math.asin(Ge(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,h),this._y=Math.atan2(-d,s)):(this._x=0,this._y=Math.atan2(o,c));break;case"XZY":this._z=Math.asin(-Ge(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(f,h),this._y=Math.atan2(o,s)):(this._x=Math.atan2(-u,c),this._y=0);break;default:Ce("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return fh.makeRotationFromQuaternion(e),this.setFromRotationMatrix(fh,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return ph.setFromEuler(this),this.setFromQuaternion(ph,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};hi.DEFAULT_ORDER="XYZ";var fr=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},jd=0,mh=new R,Yi=new Rn,Un=new ft,ks=new R,Dr=new R,Qd=new R,ef=new Rn,gh=new R(1,0,0),_h=new R(0,1,0),yh=new R(0,0,1),xh={type:"added"},tf={type:"removed"},$i={type:"childadded",child:null},ul={type:"childremoved",child:null},qt=class n extends Cn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:jd++}),this.uuid=Gn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=n.DEFAULT_UP.clone();let e=new R,t=new hi,i=new Rn,r=new R(1,1,1);function s(){i.setFromEuler(t,!1)}function a(){t.setFromQuaternion(i,void 0,!1)}t._onChange(s),i._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new ft},normalMatrix:{value:new Fe}}),this.matrix=new ft,this.matrixWorld=new ft,this.matrixAutoUpdate=n.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=n.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new fr,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Yi.setFromAxisAngle(e,t),this.quaternion.multiply(Yi),this}rotateOnWorldAxis(e,t){return Yi.setFromAxisAngle(e,t),this.quaternion.premultiply(Yi),this}rotateX(e){return this.rotateOnAxis(gh,e)}rotateY(e){return this.rotateOnAxis(_h,e)}rotateZ(e){return this.rotateOnAxis(yh,e)}translateOnAxis(e,t){return mh.copy(e).applyQuaternion(this.quaternion),this.position.add(mh.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(gh,e)}translateY(e){return this.translateOnAxis(_h,e)}translateZ(e){return this.translateOnAxis(yh,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Un.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?ks.copy(e):ks.set(e,t,i);let r=this.parent;this.updateWorldMatrix(!0,!1),Dr.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Un.lookAt(Dr,ks,this.up):Un.lookAt(ks,Dr,this.up),this.quaternion.setFromRotationMatrix(Un),r&&(Un.extractRotation(r.matrixWorld),Yi.setFromRotationMatrix(Un),this.quaternion.premultiply(Yi.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(Re("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(xh),$i.child=e,this.dispatchEvent($i),$i.child=null):Re("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(tf),ul.child=e,this.dispatchEvent(ul),ul.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Un.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Un.multiply(e.parent.matrixWorld)),e.applyMatrix4(Un),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(xh),$i.child=e,this.dispatchEvent($i),$i.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,r=this.children.length;i<r;i++){let a=this.children[i].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);let r=this.children;for(let s=0,a=r.length;s<a;s++)r[s].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Dr,e,Qd),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Dr,ef,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,i=e.y,r=e.z,s=this.matrix.elements;s[12]+=t-s[0]*t-s[4]*i-s[8]*r,s[13]+=i-s[1]*t-s[5]*i-s[9]*r,s[14]+=r-s[2]*t-s[6]*i-s[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t){let i=this.parent;if(e===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){let r=this.children;for(let s=0,a=r.length;s<a;s++)r[s].updateWorldMatrix(!1,!0)}}toJSON(e){let t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let r={};r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.castShadow===!0&&(r.castShadow=!0),this.receiveShadow===!0&&(r.receiveShadow=!0),this.visible===!1&&(r.visible=!1),this.frustumCulled===!1&&(r.frustumCulled=!1),this.renderOrder!==0&&(r.renderOrder=this.renderOrder),this.static!==!1&&(r.static=this.static),Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.matrixAutoUpdate===!1&&(r.matrixAutoUpdate=!1),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(o=>({...o})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function s(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(e.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let h=0,u=l.length;h<u;h++){let d=l[h];s(e.shapes,d)}else s(e.shapes,l)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,h=this.material.length;l<h;l++)o.push(s(e.materials,this.material[l]));r.material=o}else r.material=s(e.materials,this.material);if(this.children.length>0){r.children=[];for(let o=0;o<this.children.length;o++)r.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];r.animations.push(s(e.animations,l))}}if(t){let o=a(e.geometries),l=a(e.materials),h=a(e.textures),u=a(e.images),d=a(e.shapes),f=a(e.skeletons),c=a(e.animations),g=a(e.nodes);o.length>0&&(i.geometries=o),l.length>0&&(i.materials=l),h.length>0&&(i.textures=h),u.length>0&&(i.images=u),d.length>0&&(i.shapes=d),f.length>0&&(i.skeletons=f),c.length>0&&(i.animations=c),g.length>0&&(i.nodes=g)}return i.object=r,i;function a(o){let l=[];for(let h in o){let u=o[h];delete u.metadata,l.push(u)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){let r=e.children[i];this.add(r.clone())}return this}};qt.DEFAULT_UP=new R(0,1,0);qt.DEFAULT_MATRIX_AUTO_UPDATE=!0;qt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var pn=class extends qt{constructor(){super(),this.isGroup=!0,this.type="Group"}},nf={type:"move"},pr=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new pn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new pn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new R,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new R),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new pn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new R,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new R,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let r=null,s=null,a=null,o=this._targetRay,l=this._grip,h=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(h&&e.hand){a=!0;for(let S of e.hand.values()){let m=t.getJointPose(S,i),p=this._getHandJoint(h,S);m!==null&&(p.matrix.fromArray(m.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=m.radius),p.visible=m!==null}let u=h.joints["index-finger-tip"],d=h.joints["thumb-tip"],f=u.position.distanceTo(d.position),c=.02,g=.005;h.inputState.pinching&&f>c+g?(h.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!h.inputState.pinching&&f<=c-g&&(h.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(s=t.getPose(e.gripSpace,i),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:e,target:this})));o!==null&&(r=t.getPose(e.targetRaySpace,i),r===null&&s!==null&&(r=s),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(nf)))}return o!==null&&(o.visible=r!==null),l!==null&&(l.visible=s!==null),h!==null&&(h.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let i=new pn;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}},Tu={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},ri={h:0,s:0,l:0},Bs={h:0,s:0,l:0};function dl(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}var Ke=class{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){let r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Le){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Ye.colorSpaceToWorking(this,t),this}setRGB(e,t,i,r=Ye.workingColorSpace){return this.r=e,this.g=t,this.b=i,Ye.colorSpaceToWorking(this,r),this}setHSL(e,t,i,r=Ye.workingColorSpace){if(e=qd(e,1),t=Ge(t,0,1),i=Ge(i,0,1),t===0)this.r=this.g=this.b=i;else{let s=i<=.5?i*(1+t):i+t-i*t,a=2*i-s;this.r=dl(a,s,e+1/3),this.g=dl(a,s,e),this.b=dl(a,s,e-1/3)}return Ye.colorSpaceToWorking(this,r),this}setStyle(e,t=Le){function i(s){s!==void 0&&parseFloat(s)<1&&Ce("Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let s,a=r[1],o=r[2];switch(a){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,t);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,t);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,t);break;default:Ce("Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){let s=r[1],a=s.length;if(a===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(s,16),t);Ce("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Le){let i=Tu[e.toLowerCase()];return i!==void 0?this.setHex(i,t):Ce("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Wn(e.r),this.g=Wn(e.g),this.b=Wn(e.b),this}copyLinearToSRGB(e){return this.r=lr(e.r),this.g=lr(e.g),this.b=lr(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Le){return Ye.workingToColorSpace(kt.copy(this),e),Math.round(Ge(kt.r*255,0,255))*65536+Math.round(Ge(kt.g*255,0,255))*256+Math.round(Ge(kt.b*255,0,255))}getHexString(e=Le){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Ye.workingColorSpace){Ye.workingToColorSpace(kt.copy(this),t);let i=kt.r,r=kt.g,s=kt.b,a=Math.max(i,r,s),o=Math.min(i,r,s),l,h,u=(o+a)/2;if(o===a)l=0,h=0;else{let d=a-o;switch(h=u<=.5?d/(a+o):d/(2-a-o),a){case i:l=(r-s)/d+(r<s?6:0);break;case r:l=(s-i)/d+2;break;case s:l=(i-r)/d+4;break}l/=6}return e.h=l,e.s=h,e.l=u,e}getRGB(e,t=Ye.workingColorSpace){return Ye.workingToColorSpace(kt.copy(this),t),e.r=kt.r,e.g=kt.g,e.b=kt.b,e}getStyle(e=Le){Ye.workingToColorSpace(kt.copy(this),e);let t=kt.r,i=kt.g,r=kt.b;return e!==Le?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(r*255)})`}offsetHSL(e,t,i){return this.getHSL(ri),this.setHSL(ri.h+e,ri.s+t,ri.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(ri),e.getHSL(Bs);let i=al(ri.h,Bs.h,t),r=al(ri.s,Bs.s,t),s=al(ri.l,Bs.l,t);return this.setHSL(i,r,s),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,i=this.g,r=this.b,s=e.elements;return this.r=s[0]*t+s[3]*i+s[6]*r,this.g=s[1]*t+s[4]*i+s[7]*r,this.b=s[2]*t+s[5]*i+s[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},kt=new Ke;Ke.NAMES=Tu;var mr=class extends qt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new hi,this.environmentIntensity=1,this.environmentRotation=new hi,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}},un=new R,kn=new R,fl=new R,Bn=new R,Zi=new R,Ki=new R,vh=new R,pl=new R,ml=new R,gl=new R,_l=new bt,yl=new bt,xl=new bt,Vn=class n{constructor(e=new R,t=new R,i=new R){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,r){r.subVectors(i,t),un.subVectors(e,t),r.cross(un);let s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(e,t,i,r,s){un.subVectors(r,t),kn.subVectors(i,t),fl.subVectors(e,t);let a=un.dot(un),o=un.dot(kn),l=un.dot(fl),h=kn.dot(kn),u=kn.dot(fl),d=a*h-o*o;if(d===0)return s.set(0,0,0),null;let f=1/d,c=(h*l-o*u)*f,g=(a*u-o*l)*f;return s.set(1-c-g,g,c)}static containsPoint(e,t,i,r){return this.getBarycoord(e,t,i,r,Bn)===null?!1:Bn.x>=0&&Bn.y>=0&&Bn.x+Bn.y<=1}static getInterpolation(e,t,i,r,s,a,o,l){return this.getBarycoord(e,t,i,r,Bn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(s,Bn.x),l.addScaledVector(a,Bn.y),l.addScaledVector(o,Bn.z),l)}static getInterpolatedAttribute(e,t,i,r,s,a){return _l.setScalar(0),yl.setScalar(0),xl.setScalar(0),_l.fromBufferAttribute(e,t),yl.fromBufferAttribute(e,i),xl.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(_l,s.x),a.addScaledVector(yl,s.y),a.addScaledVector(xl,s.z),a}static isFrontFacing(e,t,i,r){return un.subVectors(i,t),kn.subVectors(e,t),un.cross(kn).dot(r)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,r){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,i,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return un.subVectors(this.c,this.b),kn.subVectors(this.a,this.b),un.cross(kn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return n.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return n.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,r,s){return n.getInterpolation(e,this.a,this.b,this.c,t,i,r,s)}containsPoint(e){return n.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return n.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let i=this.a,r=this.b,s=this.c,a,o;Zi.subVectors(r,i),Ki.subVectors(s,i),pl.subVectors(e,i);let l=Zi.dot(pl),h=Ki.dot(pl);if(l<=0&&h<=0)return t.copy(i);ml.subVectors(e,r);let u=Zi.dot(ml),d=Ki.dot(ml);if(u>=0&&d<=u)return t.copy(r);let f=l*d-u*h;if(f<=0&&l>=0&&u<=0)return a=l/(l-u),t.copy(i).addScaledVector(Zi,a);gl.subVectors(e,s);let c=Zi.dot(gl),g=Ki.dot(gl);if(g>=0&&c<=g)return t.copy(s);let S=c*h-l*g;if(S<=0&&h>=0&&g<=0)return o=h/(h-g),t.copy(i).addScaledVector(Ki,o);let m=u*g-c*d;if(m<=0&&d-u>=0&&c-g>=0)return vh.subVectors(s,r),o=(d-u)/(d-u+(c-g)),t.copy(r).addScaledVector(vh,o);let p=1/(m+S+f);return a=S*p,o=f*p,t.copy(i).addScaledVector(Zi,a).addScaledVector(Ki,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},ui=class{constructor(e=new R(1/0,1/0,1/0),t=new R(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(dn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(dn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let i=dn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let i=e.geometry;if(i!==void 0){let s=i.getAttribute("position");if(t===!0&&s!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=s.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,dn):dn.fromBufferAttribute(s,a),dn.applyMatrix4(e.matrixWorld),this.expandByPoint(dn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Hs.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),Hs.copy(i.boundingBox)),Hs.applyMatrix4(e.matrixWorld),this.union(Hs)}let r=e.children;for(let s=0,a=r.length;s<a;s++)this.expandByObject(r[s],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,dn),dn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Lr),zs.subVectors(this.max,Lr),Ji.subVectors(e.a,Lr),ji.subVectors(e.b,Lr),Qi.subVectors(e.c,Lr),si.subVectors(ji,Ji),ai.subVectors(Qi,ji),Ai.subVectors(Ji,Qi);let t=[0,-si.z,si.y,0,-ai.z,ai.y,0,-Ai.z,Ai.y,si.z,0,-si.x,ai.z,0,-ai.x,Ai.z,0,-Ai.x,-si.y,si.x,0,-ai.y,ai.x,0,-Ai.y,Ai.x,0];return!vl(t,Ji,ji,Qi,zs)||(t=[1,0,0,0,1,0,0,0,1],!vl(t,Ji,ji,Qi,zs))?!1:(Vs.crossVectors(si,ai),t=[Vs.x,Vs.y,Vs.z],vl(t,Ji,ji,Qi,zs))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,dn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(dn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Hn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Hn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Hn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Hn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Hn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Hn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Hn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Hn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Hn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},Hn=[new R,new R,new R,new R,new R,new R,new R,new R],dn=new R,Hs=new ui,Ji=new R,ji=new R,Qi=new R,si=new R,ai=new R,Ai=new R,Lr=new R,zs=new R,Vs=new R,Ci=new R;function vl(n,e,t,i,r){for(let s=0,a=n.length-3;s<=a;s+=3){Ci.fromArray(n,s);let o=r.x*Math.abs(Ci.x)+r.y*Math.abs(Ci.y)+r.z*Math.abs(Ci.z),l=e.dot(Ci),h=t.dot(Ci),u=i.dot(Ci);if(Math.max(-Math.max(l,h,u),Math.min(l,h,u))>o)return!1}return!0}var wt=new R,Gs=new xe,rf=0,Xt=class extends Cn{constructor(e,t,i=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:rf++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=Ta,this.updateRanges=[],this.gpuType=xn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[e+r]=t.array[i+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)Gs.fromBufferAttribute(this,t),Gs.applyMatrix3(e),this.setXY(t,Gs.x,Gs.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)wt.fromBufferAttribute(this,t),wt.applyMatrix3(e),this.setXYZ(t,wt.x,wt.y,wt.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)wt.fromBufferAttribute(this,t),wt.applyMatrix4(e),this.setXYZ(t,wt.x,wt.y,wt.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)wt.fromBufferAttribute(this,t),wt.applyNormalMatrix(e),this.setXYZ(t,wt.x,wt.y,wt.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)wt.fromBufferAttribute(this,t),wt.transformDirection(e),this.setXYZ(t,wt.x,wt.y,wt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=wn(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=rt(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=wn(t,this.array)),t}setX(e,t){return this.normalized&&(t=rt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=wn(t,this.array)),t}setY(e,t){return this.normalized&&(t=rt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=wn(t,this.array)),t}setZ(e,t){return this.normalized&&(t=rt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=wn(t,this.array)),t}setW(e,t){return this.normalized&&(t=rt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=rt(t,this.array),i=rt(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,r){return e*=this.itemSize,this.normalized&&(t=rt(t,this.array),i=rt(i,this.array),r=rt(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this}setXYZW(e,t,i,r,s){return e*=this.itemSize,this.normalized&&(t=rt(t,this.array),i=rt(i,this.array),r=rt(r,this.array),s=rt(s,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this.array[e+3]=s,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==Ta&&(e.usage=this.usage),e}dispose(){this.dispatchEvent({type:"dispose"})}};var Zr=class extends Xt{constructor(e,t,i){super(new Uint16Array(e),t,i)}};var Kr=class extends Xt{constructor(e,t,i){super(new Uint32Array(e),t,i)}};var yt=class extends Xt{constructor(e,t,i){super(new Float32Array(e),t,i)}},sf=new ui,Fr=new R,Sl=new R,Fi=class{constructor(e=new R,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let i=this.center;t!==void 0?i.copy(t):sf.setFromPoints(e).getCenter(i);let r=0;for(let s=0,a=e.length;s<a;s++)r=Math.max(r,i.distanceToSquared(e[s]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Fr.subVectors(e,this.center);let t=Fr.lengthSq();if(t>this.radius*this.radius){let i=Math.sqrt(t),r=(i-this.radius)*.5;this.center.addScaledVector(Fr,r/i),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Sl.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Fr.copy(e.center).add(Sl)),this.expandByPoint(Fr.copy(e.center).sub(Sl))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},af=0,ln=new ft,bl=new qt,er=new R,Kt=new ui,Nr=new ui,Pt=new R,st=class n extends Cn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:af++}),this.uuid=Gn(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Wd(e)?Kr:Zr)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let s=new Fe().getNormalMatrix(e);i.applyNormalMatrix(s),i.needsUpdate=!0}let r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return ln.makeRotationFromQuaternion(e),this.applyMatrix4(ln),this}rotateX(e){return ln.makeRotationX(e),this.applyMatrix4(ln),this}rotateY(e){return ln.makeRotationY(e),this.applyMatrix4(ln),this}rotateZ(e){return ln.makeRotationZ(e),this.applyMatrix4(ln),this}translate(e,t,i){return ln.makeTranslation(e,t,i),this.applyMatrix4(ln),this}scale(e,t,i){return ln.makeScale(e,t,i),this.applyMatrix4(ln),this}lookAt(e){return bl.lookAt(e),bl.updateMatrix(),this.applyMatrix4(bl.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(er).negate(),this.translate(er.x,er.y,er.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let i=[];for(let r=0,s=e.length;r<s;r++){let a=e[r];i.push(a.x,a.y,a.z||0)}this.setAttribute("position",new yt(i,3))}else{let i=Math.min(e.length,t.count);for(let r=0;r<i;r++){let s=e[r];t.setXYZ(r,s.x,s.y,s.z||0)}e.length>t.count&&Ce("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new ui);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Re("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new R(-1/0,-1/0,-1/0),new R(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,r=t.length;i<r;i++){let s=t[i];Kt.setFromBufferAttribute(s),this.morphTargetsRelative?(Pt.addVectors(this.boundingBox.min,Kt.min),this.boundingBox.expandByPoint(Pt),Pt.addVectors(this.boundingBox.max,Kt.max),this.boundingBox.expandByPoint(Pt)):(this.boundingBox.expandByPoint(Kt.min),this.boundingBox.expandByPoint(Kt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Re('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Fi);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Re("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new R,1/0);return}if(e){let i=this.boundingSphere.center;if(Kt.setFromBufferAttribute(e),t)for(let s=0,a=t.length;s<a;s++){let o=t[s];Nr.setFromBufferAttribute(o),this.morphTargetsRelative?(Pt.addVectors(Kt.min,Nr.min),Kt.expandByPoint(Pt),Pt.addVectors(Kt.max,Nr.max),Kt.expandByPoint(Pt)):(Kt.expandByPoint(Nr.min),Kt.expandByPoint(Nr.max))}Kt.getCenter(i);let r=0;for(let s=0,a=e.count;s<a;s++)Pt.fromBufferAttribute(e,s),r=Math.max(r,i.distanceToSquared(Pt));if(t)for(let s=0,a=t.length;s<a;s++){let o=t[s],l=this.morphTargetsRelative;for(let h=0,u=o.count;h<u;h++)Pt.fromBufferAttribute(o,h),l&&(er.fromBufferAttribute(e,h),Pt.add(er)),r=Math.max(r,i.distanceToSquared(Pt))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&Re('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){Re("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=t.position,r=t.normal,s=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Xt(new Float32Array(4*i.count),4));let a=this.getAttribute("tangent"),o=[],l=[];for(let v=0;v<i.count;v++)o[v]=new R,l[v]=new R;let h=new R,u=new R,d=new R,f=new xe,c=new xe,g=new xe,S=new R,m=new R;function p(v,A,L){h.fromBufferAttribute(i,v),u.fromBufferAttribute(i,A),d.fromBufferAttribute(i,L),f.fromBufferAttribute(s,v),c.fromBufferAttribute(s,A),g.fromBufferAttribute(s,L),u.sub(h),d.sub(h),c.sub(f),g.sub(f);let I=1/(c.x*g.y-g.x*c.y);isFinite(I)&&(S.copy(u).multiplyScalar(g.y).addScaledVector(d,-c.y).multiplyScalar(I),m.copy(d).multiplyScalar(c.x).addScaledVector(u,-g.x).multiplyScalar(I),o[v].add(S),o[A].add(S),o[L].add(S),l[v].add(m),l[A].add(m),l[L].add(m))}let M=this.groups;M.length===0&&(M=[{start:0,count:e.count}]);for(let v=0,A=M.length;v<A;++v){let L=M[v],I=L.start,O=L.count;for(let G=I,W=I+O;G<W;G+=3)p(e.getX(G+0),e.getX(G+1),e.getX(G+2))}let _=new R,x=new R,w=new R,E=new R;function C(v){w.fromBufferAttribute(r,v),E.copy(w);let A=o[v];_.copy(A),_.sub(w.multiplyScalar(w.dot(A))).normalize(),x.crossVectors(E,A);let I=x.dot(l[v])<0?-1:1;a.setXYZW(v,_.x,_.y,_.z,I)}for(let v=0,A=M.length;v<A;++v){let L=M[v],I=L.start,O=L.count;for(let G=I,W=I+O;G<W;G+=3)C(e.getX(G+0)),C(e.getX(G+1)),C(e.getX(G+2))}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new Xt(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let f=0,c=i.count;f<c;f++)i.setXYZ(f,0,0,0);let r=new R,s=new R,a=new R,o=new R,l=new R,h=new R,u=new R,d=new R;if(e)for(let f=0,c=e.count;f<c;f+=3){let g=e.getX(f+0),S=e.getX(f+1),m=e.getX(f+2);r.fromBufferAttribute(t,g),s.fromBufferAttribute(t,S),a.fromBufferAttribute(t,m),u.subVectors(a,s),d.subVectors(r,s),u.cross(d),o.fromBufferAttribute(i,g),l.fromBufferAttribute(i,S),h.fromBufferAttribute(i,m),o.add(u),l.add(u),h.add(u),i.setXYZ(g,o.x,o.y,o.z),i.setXYZ(S,l.x,l.y,l.z),i.setXYZ(m,h.x,h.y,h.z)}else for(let f=0,c=t.count;f<c;f+=3)r.fromBufferAttribute(t,f+0),s.fromBufferAttribute(t,f+1),a.fromBufferAttribute(t,f+2),u.subVectors(a,s),d.subVectors(r,s),u.cross(d),i.setXYZ(f+0,u.x,u.y,u.z),i.setXYZ(f+1,u.x,u.y,u.z),i.setXYZ(f+2,u.x,u.y,u.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)Pt.fromBufferAttribute(e,t),Pt.normalize(),e.setXYZ(t,Pt.x,Pt.y,Pt.z)}toNonIndexed(){function e(o,l){let h=o.array,u=o.itemSize,d=o.normalized,f=new h.constructor(l.length*u),c=0,g=0;for(let S=0,m=l.length;S<m;S++){o.isInterleavedBufferAttribute?c=l[S]*o.data.stride+o.offset:c=l[S]*u;for(let p=0;p<u;p++)f[g++]=h[c++]}return new Xt(f,u,d)}if(this.index===null)return Ce("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new n,i=this.index.array,r=this.attributes;for(let o in r){let l=r[o],h=e(l,i);t.setAttribute(o,h)}let s=this.morphAttributes;for(let o in s){let l=[],h=s[o];for(let u=0,d=h.length;u<d;u++){let f=h[u],c=e(f,i);l.push(c)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,l=a.length;o<l;o++){let h=a[o];t.addGroup(h.start,h.count,h.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let h in l)l[h]!==void 0&&(e[h]=l[h]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let i=this.attributes;for(let l in i){let h=i[l];e.data.attributes[l]=h.toJSON(e.data)}let r={},s=!1;for(let l in this.morphAttributes){let h=this.morphAttributes[l],u=[];for(let d=0,f=h.length;d<f;d++){let c=h[d];u.push(c.toJSON(e.data))}u.length>0&&(r[l]=u,s=!0)}s&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let i=e.index;i!==null&&this.setIndex(i.clone());let r=e.attributes;for(let h in r){let u=r[h];this.setAttribute(h,u.clone(t))}let s=e.morphAttributes;for(let h in s){let u=[],d=s[h];for(let f=0,c=d.length;f<c;f++)u.push(d[f].clone(t));this.morphAttributes[h]=u}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let h=0,u=a.length;h<u;h++){let d=a[h];this.addGroup(d.start,d.count,d.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},Ia=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=Ta,this.updateRanges=[],this.version=0,this.uuid=Gn()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,i){e*=this.stride,i*=t.stride;for(let r=0,s=this.stride;r<s;r++)this.array[e+r]=t.array[i+r];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Gn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),i=new this.constructor(t,this.stride);return i.setUsage(this.usage),i}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){return e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Gn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}},zt=new R,Jr=class n{constructor(e,t,i,r=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=i,this.normalized=r}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,i=this.data.count;t<i;t++)zt.fromBufferAttribute(this,t),zt.applyMatrix4(e),this.setXYZ(t,zt.x,zt.y,zt.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)zt.fromBufferAttribute(this,t),zt.applyNormalMatrix(e),this.setXYZ(t,zt.x,zt.y,zt.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)zt.fromBufferAttribute(this,t),zt.transformDirection(e),this.setXYZ(t,zt.x,zt.y,zt.z);return this}getComponent(e,t){let i=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(i=wn(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=rt(i,this.array)),this.data.array[e*this.data.stride+this.offset+t]=i,this}setX(e,t){return this.normalized&&(t=rt(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=rt(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=rt(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=rt(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=wn(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=wn(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=wn(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=wn(t,this.array)),t}setXY(e,t,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=rt(t,this.array),i=rt(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this}setXYZ(e,t,i,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=rt(t,this.array),i=rt(i,this.array),r=rt(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this.data.array[e+2]=r,this}setXYZW(e,t,i,r,s){return e=e*this.data.stride+this.offset,this.normalized&&(t=rt(t,this.array),i=rt(i,this.array),r=rt(r,this.array),s=rt(s,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this.data.array[e+2]=r,this.data.array[e+3]=s,this}clone(e){if(e===void 0){Yr("InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let i=0;i<this.count;i++){let r=i*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)t.push(this.data.array[r+s])}return new Xt(new this.array.constructor(t),this.itemSize,this.normalized)}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new n(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){Yr("InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let i=0;i<this.count;i++){let r=i*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)t.push(this.data.array[r+s])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}},of=0,qn=class extends Cn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:of++}),this.uuid=Gn(),this.name="",this.type="Material",this.blending=Di,this.side=Xn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=da,this.blendDst=fa,this.blendEquation=ci,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ke(0,0,0),this.blendAlpha=0,this.depthFunc=Li,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Ul,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Pi,this.stencilZFail=Pi,this.stencilZPass=Pi,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let i=e[t];if(i===void 0){Ce(`Material: parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){Ce(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(i):r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==Di&&(i.blending=this.blending),this.side!==Xn&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==da&&(i.blendSrc=this.blendSrc),this.blendDst!==fa&&(i.blendDst=this.blendDst),this.blendEquation!==ci&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==Li&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Ul&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Pi&&(i.stencilFail=this.stencilFail),this.stencilZFail!==Pi&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==Pi&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.allowOverride===!1&&(i.allowOverride=!1),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function r(s){let a=[];for(let o in s){let l=s[o];delete l.metadata,a.push(l)}return a}if(t){let s=r(e.textures),a=r(e.images);s.length>0&&(i.textures=s),a.length>0&&(i.images=a)}return i}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,i=null;if(t!==null){let r=t.length;i=new Array(r);for(let s=0;s!==r;++s)i[s]=t[s].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}},pt=class extends qn{constructor(e){super(),this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new Ke(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.rotation=e.rotation,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},tr,Or=new R,nr=new R,ir=new R,rr=new xe,Ur=new xe,Eu=new ft,Ws=new R,kr=new R,Xs=new R,Sh=new xe,Ml=new xe,bh=new xe,xt=class extends qt{constructor(e=new pt){if(super(),this.isSprite=!0,this.type="Sprite",tr===void 0){tr=new st;let t=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),i=new Ia(t,5);tr.setIndex([0,1,2,0,2,3]),tr.setAttribute("position",new Jr(i,3,0,!1)),tr.setAttribute("uv",new Jr(i,2,3,!1))}this.geometry=tr,this.material=e,this.center=new xe(.5,.5),this.count=1}raycast(e,t){e.camera===null&&Re('Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),nr.setFromMatrixScale(this.matrixWorld),Eu.copy(e.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(e.camera.matrixWorldInverse,this.matrixWorld),ir.setFromMatrixPosition(this.modelViewMatrix),e.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&nr.multiplyScalar(-ir.z);let i=this.material.rotation,r,s;i!==0&&(s=Math.cos(i),r=Math.sin(i));let a=this.center;qs(Ws.set(-.5,-.5,0),ir,a,nr,r,s),qs(kr.set(.5,-.5,0),ir,a,nr,r,s),qs(Xs.set(.5,.5,0),ir,a,nr,r,s),Sh.set(0,0),Ml.set(1,0),bh.set(1,1);let o=e.ray.intersectTriangle(Ws,kr,Xs,!1,Or);if(o===null&&(qs(kr.set(-.5,.5,0),ir,a,nr,r,s),Ml.set(0,1),o=e.ray.intersectTriangle(Ws,Xs,kr,!1,Or),o===null))return;let l=e.ray.origin.distanceTo(Or);l<e.near||l>e.far||t.push({distance:l,point:Or.clone(),uv:Vn.getInterpolation(Or,Ws,kr,Xs,Sh,Ml,bh,new xe),face:null,object:this})}copy(e,t){return super.copy(e,t),e.center!==void 0&&this.center.copy(e.center),this.material=e.material,this}};function qs(n,e,t,i,r,s){rr.subVectors(n,t).addScalar(.5).multiply(i),r!==void 0?(Ur.x=s*rr.x-r*rr.y,Ur.y=r*rr.x+s*rr.y):Ur.copy(rr),n.copy(e),n.x+=Ur.x,n.y+=Ur.y,n.applyMatrix4(Eu)}var zn=new R,Tl=new R,Ys=new R,oi=new R,El=new R,$s=new R,wl=new R,gr=class{constructor(e=new R,t=new R(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,zn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=zn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(zn.copy(this.origin).addScaledVector(this.direction,t),zn.distanceToSquared(e))}distanceSqToSegment(e,t,i,r){Tl.copy(e).add(t).multiplyScalar(.5),Ys.copy(t).sub(e).normalize(),oi.copy(this.origin).sub(Tl);let s=e.distanceTo(t)*.5,a=-this.direction.dot(Ys),o=oi.dot(this.direction),l=-oi.dot(Ys),h=oi.lengthSq(),u=Math.abs(1-a*a),d,f,c,g;if(u>0)if(d=a*l-o,f=a*o-l,g=s*u,d>=0)if(f>=-g)if(f<=g){let S=1/u;d*=S,f*=S,c=d*(d+a*f+2*o)+f*(a*d+f+2*l)+h}else f=s,d=Math.max(0,-(a*f+o)),c=-d*d+f*(f+2*l)+h;else f=-s,d=Math.max(0,-(a*f+o)),c=-d*d+f*(f+2*l)+h;else f<=-g?(d=Math.max(0,-(-a*s+o)),f=d>0?-s:Math.min(Math.max(-s,-l),s),c=-d*d+f*(f+2*l)+h):f<=g?(d=0,f=Math.min(Math.max(-s,-l),s),c=f*(f+2*l)+h):(d=Math.max(0,-(a*s+o)),f=d>0?s:Math.min(Math.max(-s,-l),s),c=-d*d+f*(f+2*l)+h);else f=a>0?-s:s,d=Math.max(0,-(a*f+o)),c=-d*d+f*(f+2*l)+h;return i&&i.copy(this.origin).addScaledVector(this.direction,d),r&&r.copy(Tl).addScaledVector(Ys,f),c}intersectSphere(e,t){zn.subVectors(e.center,this.origin);let i=zn.dot(this.direction),r=zn.dot(zn)-i*i,s=e.radius*e.radius;if(r>s)return null;let a=Math.sqrt(s-r),o=i-a,l=i+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){let i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,r,s,a,o,l,h=1/this.direction.x,u=1/this.direction.y,d=1/this.direction.z,f=this.origin;return h>=0?(i=(e.min.x-f.x)*h,r=(e.max.x-f.x)*h):(i=(e.max.x-f.x)*h,r=(e.min.x-f.x)*h),u>=0?(s=(e.min.y-f.y)*u,a=(e.max.y-f.y)*u):(s=(e.max.y-f.y)*u,a=(e.min.y-f.y)*u),i>a||s>r||((s>i||isNaN(i))&&(i=s),(a<r||isNaN(r))&&(r=a),d>=0?(o=(e.min.z-f.z)*d,l=(e.max.z-f.z)*d):(o=(e.max.z-f.z)*d,l=(e.min.z-f.z)*d),i>l||o>r)||((o>i||i!==i)&&(i=o),(l<r||r!==r)&&(r=l),r<0)?null:this.at(i>=0?i:r,t)}intersectsBox(e){return this.intersectBox(e,zn)!==null}intersectTriangle(e,t,i,r,s){El.subVectors(t,e),$s.subVectors(i,e),wl.crossVectors(El,$s);let a=this.direction.dot(wl),o;if(a>0){if(r)return null;o=1}else if(a<0)o=-1,a=-a;else return null;oi.subVectors(this.origin,e);let l=o*this.direction.dot($s.crossVectors(oi,$s));if(l<0)return null;let h=o*this.direction.dot(El.cross(oi));if(h<0||l+h>a)return null;let u=-o*oi.dot(wl);return u<0?null:this.at(u/a,s)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Ft=class extends qn{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Ke(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new hi,this.combine=Zl,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},Mh=new ft,Ri=new gr,Zs=new Fi,Th=new R,Ks=new R,Js=new R,js=new R,Al=new R,Qs=new R,Eh=new R,ea=new R,dt=class extends qt{constructor(e=new st,t=new Ft){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){let o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}getVertexPosition(e,t){let i=this.geometry,r=i.attributes.position,s=i.morphAttributes.position,a=i.morphTargetsRelative;t.fromBufferAttribute(r,e);let o=this.morphTargetInfluences;if(s&&o){Qs.set(0,0,0);for(let l=0,h=s.length;l<h;l++){let u=o[l],d=s[l];u!==0&&(Al.fromBufferAttribute(d,e),a?Qs.addScaledVector(Al,u):Qs.addScaledVector(Al.sub(t),u))}t.add(Qs)}return t}raycast(e,t){let i=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Zs.copy(i.boundingSphere),Zs.applyMatrix4(s),Ri.copy(e.ray).recast(e.near),!(Zs.containsPoint(Ri.origin)===!1&&(Ri.intersectSphere(Zs,Th)===null||Ri.origin.distanceToSquared(Th)>(e.far-e.near)**2))&&(Mh.copy(s).invert(),Ri.copy(e.ray).applyMatrix4(Mh),!(i.boundingBox!==null&&Ri.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,Ri)))}_computeIntersections(e,t,i){let r,s=this.geometry,a=this.material,o=s.index,l=s.attributes.position,h=s.attributes.uv,u=s.attributes.uv1,d=s.attributes.normal,f=s.groups,c=s.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,S=f.length;g<S;g++){let m=f[g],p=a[m.materialIndex],M=Math.max(m.start,c.start),_=Math.min(o.count,Math.min(m.start+m.count,c.start+c.count));for(let x=M,w=_;x<w;x+=3){let E=o.getX(x),C=o.getX(x+1),v=o.getX(x+2);r=ta(this,p,e,i,h,u,d,E,C,v),r&&(r.faceIndex=Math.floor(x/3),r.face.materialIndex=m.materialIndex,t.push(r))}}else{let g=Math.max(0,c.start),S=Math.min(o.count,c.start+c.count);for(let m=g,p=S;m<p;m+=3){let M=o.getX(m),_=o.getX(m+1),x=o.getX(m+2);r=ta(this,a,e,i,h,u,d,M,_,x),r&&(r.faceIndex=Math.floor(m/3),t.push(r))}}else if(l!==void 0)if(Array.isArray(a))for(let g=0,S=f.length;g<S;g++){let m=f[g],p=a[m.materialIndex],M=Math.max(m.start,c.start),_=Math.min(l.count,Math.min(m.start+m.count,c.start+c.count));for(let x=M,w=_;x<w;x+=3){let E=x,C=x+1,v=x+2;r=ta(this,p,e,i,h,u,d,E,C,v),r&&(r.faceIndex=Math.floor(x/3),r.face.materialIndex=m.materialIndex,t.push(r))}}else{let g=Math.max(0,c.start),S=Math.min(l.count,c.start+c.count);for(let m=g,p=S;m<p;m+=3){let M=m,_=m+1,x=m+2;r=ta(this,a,e,i,h,u,d,M,_,x),r&&(r.faceIndex=Math.floor(m/3),t.push(r))}}}};function lf(n,e,t,i,r,s,a,o){let l;if(e.side===Vt?l=i.intersectTriangle(a,s,r,!0,o):l=i.intersectTriangle(r,s,a,e.side===Xn,o),l===null)return null;ea.copy(o),ea.applyMatrix4(n.matrixWorld);let h=t.ray.origin.distanceTo(ea);return h<t.near||h>t.far?null:{distance:h,point:ea.clone(),object:n}}function ta(n,e,t,i,r,s,a,o,l,h){n.getVertexPosition(o,Ks),n.getVertexPosition(l,Js),n.getVertexPosition(h,js);let u=lf(n,e,t,i,Ks,Js,js,Eh);if(u){let d=new R;Vn.getBarycoord(Eh,Ks,Js,js,d),r&&(u.uv=Vn.getInterpolatedAttribute(r,o,l,h,d,new xe)),s&&(u.uv1=Vn.getInterpolatedAttribute(s,o,l,h,d,new xe)),a&&(u.normal=Vn.getInterpolatedAttribute(a,o,l,h,d,new R),u.normal.dot(i.direction)>0&&u.normal.multiplyScalar(-1));let f={a:o,b:l,c:h,normal:new R,materialIndex:0};Vn.getNormal(Ks,Js,js,f.normal),u.face=f,u.barycoord=d}return u}var Pa=class extends Lt{constructor(e=null,t=1,i=1,r,s,a,o,l,h=Dt,u=Dt,d,f){super(null,a,o,l,h,u,r,s,d,f),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Cl=new R,cf=new R,hf=new Fe,En=class{constructor(e=new R(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,r){return this.normal.set(e,t,i),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){let r=Cl.subVectors(i,t).cross(cf.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,i=!0){let r=e.delta(Cl),s=this.normal.dot(r);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let a=-(e.start.dot(this.normal)+this.constant)/s;return i===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(r,a)}intersectsLine(e){let t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let i=t||hf.getNormalMatrix(e),r=this.coplanarPoint(Cl).applyMatrix4(e),s=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(s),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},Ii=new Fi,uf=new xe(.5,.5),na=new R,jr=class{constructor(e=new En,t=new En,i=new En,r=new En,s=new En,a=new En){this.planes=[e,t,i,r,s,a]}set(e,t,i,r,s,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(i),o[3].copy(r),o[4].copy(s),o[5].copy(a),this}copy(e){let t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=fn,i=!1){let r=this.planes,s=e.elements,a=s[0],o=s[1],l=s[2],h=s[3],u=s[4],d=s[5],f=s[6],c=s[7],g=s[8],S=s[9],m=s[10],p=s[11],M=s[12],_=s[13],x=s[14],w=s[15];if(r[0].setComponents(h-a,c-u,p-g,w-M).normalize(),r[1].setComponents(h+a,c+u,p+g,w+M).normalize(),r[2].setComponents(h+o,c+d,p+S,w+_).normalize(),r[3].setComponents(h-o,c-d,p-S,w-_).normalize(),i)r[4].setComponents(l,f,m,x).normalize(),r[5].setComponents(h-l,c-f,p-m,w-x).normalize();else if(r[4].setComponents(h-l,c-f,p-m,w-x).normalize(),t===fn)r[5].setComponents(h+l,c+f,p+m,w+x).normalize();else if(t===qr)r[5].setComponents(l,f,m,x).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Ii.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Ii.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Ii)}intersectsSprite(e){Ii.center.set(0,0,0);let t=uf.distanceTo(e.center);return Ii.radius=.7071067811865476+t,Ii.applyMatrix4(e.matrixWorld),this.intersectsSphere(Ii)}intersectsSphere(e){let t=this.planes,i=e.center,r=-e.radius;for(let s=0;s<6;s++)if(t[s].distanceToPoint(i)<r)return!1;return!0}intersectsBox(e){let t=this.planes;for(let i=0;i<6;i++){let r=t[i];if(na.x=r.normal.x>0?e.max.x:e.min.x,na.y=r.normal.y>0?e.max.y:e.min.y,na.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(na)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var Nt=class extends qn{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Ke(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},Da=new R,La=new R,wh=new ft,Br=new gr,ia=new Fi,Rl=new R,Ah=new R,mn=class extends qt{constructor(e=new st,t=new Nt){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[0];for(let r=1,s=t.count;r<s;r++)Da.fromBufferAttribute(t,r-1),La.fromBufferAttribute(t,r),i[r]=i[r-1],i[r]+=Da.distanceTo(La);e.setAttribute("lineDistance",new yt(i,1))}else Ce("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){let i=this.geometry,r=this.matrixWorld,s=e.params.Line.threshold,a=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),ia.copy(i.boundingSphere),ia.applyMatrix4(r),ia.radius+=s,e.ray.intersectsSphere(ia)===!1)return;wh.copy(r).invert(),Br.copy(e.ray).applyMatrix4(wh);let o=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,h=this.isLineSegments?2:1,u=i.index,f=i.attributes.position;if(u!==null){let c=Math.max(0,a.start),g=Math.min(u.count,a.start+a.count);for(let S=c,m=g-1;S<m;S+=h){let p=u.getX(S),M=u.getX(S+1),_=ra(this,e,Br,l,p,M,S);_&&t.push(_)}if(this.isLineLoop){let S=u.getX(g-1),m=u.getX(c),p=ra(this,e,Br,l,S,m,g-1);p&&t.push(p)}}else{let c=Math.max(0,a.start),g=Math.min(f.count,a.start+a.count);for(let S=c,m=g-1;S<m;S+=h){let p=ra(this,e,Br,l,S,S+1,S);p&&t.push(p)}if(this.isLineLoop){let S=ra(this,e,Br,l,g-1,c,g-1);S&&t.push(S)}}}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){let o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}};function ra(n,e,t,i,r,s,a){let o=n.geometry.attributes.position;if(Da.fromBufferAttribute(o,r),La.fromBufferAttribute(o,s),t.distanceSqToSegment(Da,La,Rl,Ah)>i)return;Rl.applyMatrix4(n.matrixWorld);let h=e.ray.origin.distanceTo(Rl);if(!(h<e.near||h>e.far))return{distance:h,point:Ah.clone().applyMatrix4(n.matrixWorld),index:a,face:null,faceIndex:null,barycoord:null,object:n}}var Ch=new R,Rh=new R,_r=class extends mn{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[];for(let r=0,s=t.count;r<s;r+=2)Ch.fromBufferAttribute(t,r),Rh.fromBufferAttribute(t,r+1),i[r]=r===0?0:i[r-1],i[r+1]=i[r]+Ch.distanceTo(Rh);e.setAttribute("lineDistance",new yt(i,1))}else Ce("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}},In=class extends mn{constructor(e,t){super(e,t),this.isLineLoop=!0,this.type="LineLoop"}};var Qr=class extends Lt{constructor(e=[],t=_i,i,r,s,a,o,l,h,u){super(e,t,i,r,s,a,o,l,h,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},je=class extends Lt{constructor(e,t,i,r,s,a,o,l,h){super(e,t,i,r,s,a,o,l,h),this.isCanvasTexture=!0,this.needsUpdate=!0}};var Yn=class extends Lt{constructor(e,t,i=yn,r,s,a,o=Dt,l=Dt,h,u=An,d=1){if(u!==An&&u!==yi)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let f={width:e,height:t,depth:d};super(f,r,s,a,o,l,u,i,h),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new dr(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},Fa=class extends Yn{constructor(e,t=yn,i=_i,r,s,a=Dt,o=Dt,l,h=An){let u={width:e,height:e,depth:1},d=[u,u,u,u,u,u];super(e,e,t,i,r,s,a,o,l,h),this.image=d,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},es=class extends Lt{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},yr=class n extends st{constructor(e=1,t=1,i=1,r=1,s=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:r,heightSegments:s,depthSegments:a};let o=this;r=Math.floor(r),s=Math.floor(s),a=Math.floor(a);let l=[],h=[],u=[],d=[],f=0,c=0;g("z","y","x",-1,-1,i,t,e,a,s,0),g("z","y","x",1,-1,i,t,-e,a,s,1),g("x","z","y",1,1,e,i,t,r,a,2),g("x","z","y",1,-1,e,i,-t,r,a,3),g("x","y","z",1,-1,e,t,i,r,s,4),g("x","y","z",-1,-1,e,t,-i,r,s,5),this.setIndex(l),this.setAttribute("position",new yt(h,3)),this.setAttribute("normal",new yt(u,3)),this.setAttribute("uv",new yt(d,2));function g(S,m,p,M,_,x,w,E,C,v,A){let L=x/C,I=w/v,O=x/2,G=w/2,W=E/2,N=C+1,H=v+1,V=0,j=0,Q=new R;for(let he=0;he<H;he++){let be=he*I-G;for(let we=0;we<N;we++){let $e=we*L-O;Q[S]=$e*M,Q[m]=be*_,Q[p]=W,h.push(Q.x,Q.y,Q.z),Q[S]=0,Q[m]=0,Q[p]=E>0?1:-1,u.push(Q.x,Q.y,Q.z),d.push(we/C),d.push(1-he/v),V+=1}}for(let he=0;he<v;he++)for(let be=0;be<C;be++){let we=f+be+N*he,$e=f+be+N*(he+1),et=f+(be+1)+N*(he+1),ke=f+(be+1)+N*he;l.push(we,$e,ke),l.push($e,et,ke),j+=6}o.addGroup(c,j,A),c+=j,f+=V}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};var Qt=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){Ce("Curve: .getPoint() not implemented.")}getPointAt(e,t){let i=this.getUtoTmapping(e);return this.getPoint(i,t)}getPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return t}getSpacedPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPointAt(i/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],i,r=this.getPoint(0),s=0;t.push(0);for(let a=1;a<=e;a++)i=this.getPoint(a/e),s+=i.distanceTo(r),t.push(s),r=i;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){let i=this.getLengths(),r=0,s=i.length,a;t?a=t:a=e*i[s-1];let o=0,l=s-1,h;for(;o<=l;)if(r=Math.floor(o+(l-o)/2),h=i[r]-a,h<0)o=r+1;else if(h>0)l=r-1;else{l=r;break}if(r=l,i[r]===a)return r/(s-1);let u=i[r],f=i[r+1]-u,c=(a-u)/f;return(r+c)/(s-1)}getTangent(e,t){let r=e-1e-4,s=e+1e-4;r<0&&(r=0),s>1&&(s=1);let a=this.getPoint(r),o=this.getPoint(s),l=t||(a.isVector2?new xe:new R);return l.copy(o).sub(a).normalize(),l}getTangentAt(e,t){let i=this.getUtoTmapping(e);return this.getTangent(i,t)}computeFrenetFrames(e,t=!1){let i=new R,r=[],s=[],a=[],o=new R,l=new ft;for(let c=0;c<=e;c++){let g=c/e;r[c]=this.getTangentAt(g,new R)}s[0]=new R,a[0]=new R;let h=Number.MAX_VALUE,u=Math.abs(r[0].x),d=Math.abs(r[0].y),f=Math.abs(r[0].z);u<=h&&(h=u,i.set(1,0,0)),d<=h&&(h=d,i.set(0,1,0)),f<=h&&i.set(0,0,1),o.crossVectors(r[0],i).normalize(),s[0].crossVectors(r[0],o),a[0].crossVectors(r[0],s[0]);for(let c=1;c<=e;c++){if(s[c]=s[c-1].clone(),a[c]=a[c-1].clone(),o.crossVectors(r[c-1],r[c]),o.length()>Number.EPSILON){o.normalize();let g=Math.acos(Ge(r[c-1].dot(r[c]),-1,1));s[c].applyMatrix4(l.makeRotationAxis(o,g))}a[c].crossVectors(r[c],s[c])}if(t===!0){let c=Math.acos(Ge(s[0].dot(s[e]),-1,1));c/=e,r[0].dot(o.crossVectors(s[0],s[e]))>0&&(c=-c);for(let g=1;g<=e;g++)s[g].applyMatrix4(l.makeRotationAxis(r[g],c*g)),a[g].crossVectors(r[g],s[g])}return{tangents:r,normals:s,binormals:a}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}},xr=class extends Qt{constructor(e=0,t=0,i=1,r=1,s=0,a=Math.PI*2,o=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=i,this.yRadius=r,this.aStartAngle=s,this.aEndAngle=a,this.aClockwise=o,this.aRotation=l}getPoint(e,t=new xe){let i=t,r=Math.PI*2,s=this.aEndAngle-this.aStartAngle,a=Math.abs(s)<Number.EPSILON;for(;s<0;)s+=r;for(;s>r;)s-=r;s<Number.EPSILON&&(a?s=0:s=r),this.aClockwise===!0&&!a&&(s===r?s=-r:s=s-r);let o=this.aStartAngle+e*s,l=this.aX+this.xRadius*Math.cos(o),h=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){let u=Math.cos(this.aRotation),d=Math.sin(this.aRotation),f=l-this.aX,c=h-this.aY;l=f*u-c*d+this.aX,h=f*d+c*u+this.aY}return i.set(l,h)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},Na=class extends xr{constructor(e,t,i,r,s,a){super(e,t,i,i,r,s,a),this.isArcCurve=!0,this.type="ArcCurve"}};function fc(){let n=0,e=0,t=0,i=0;function r(s,a,o,l){n=s,e=o,t=-3*s+3*a-2*o-l,i=2*s-2*a+o+l}return{initCatmullRom:function(s,a,o,l,h){r(a,o,h*(o-s),h*(l-a))},initNonuniformCatmullRom:function(s,a,o,l,h,u,d){let f=(a-s)/h-(o-s)/(h+u)+(o-a)/u,c=(o-a)/u-(l-a)/(u+d)+(l-o)/d;f*=u,c*=u,r(a,o,f,c)},calc:function(s){let a=s*s,o=a*s;return n+e*s+t*a+i*o}}}var Ih=new R,Ph=new R,Il=new fc,Pl=new fc,Dl=new fc,Ni=class extends Qt{constructor(e=[],t=!1,i="centripetal",r=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=i,this.tension=r}getPoint(e,t=new R){let i=t,r=this.points,s=r.length,a=(s-(this.closed?0:1))*e,o=Math.floor(a),l=a-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/s)+1)*s:l===0&&o===s-1&&(o=s-2,l=1);let h,u;this.closed||o>0?h=r[(o-1)%s]:(Ph.subVectors(r[0],r[1]).add(r[0]),h=Ph);let d=r[o%s],f=r[(o+1)%s];if(this.closed||o+2<s?u=r[(o+2)%s]:(Ih.subVectors(r[s-1],r[s-2]).add(r[s-1]),u=Ih),this.curveType==="centripetal"||this.curveType==="chordal"){let c=this.curveType==="chordal"?.5:.25,g=Math.pow(h.distanceToSquared(d),c),S=Math.pow(d.distanceToSquared(f),c),m=Math.pow(f.distanceToSquared(u),c);S<1e-4&&(S=1),g<1e-4&&(g=S),m<1e-4&&(m=S),Il.initNonuniformCatmullRom(h.x,d.x,f.x,u.x,g,S,m),Pl.initNonuniformCatmullRom(h.y,d.y,f.y,u.y,g,S,m),Dl.initNonuniformCatmullRom(h.z,d.z,f.z,u.z,g,S,m)}else this.curveType==="catmullrom"&&(Il.initCatmullRom(h.x,d.x,f.x,u.x,this.tension),Pl.initCatmullRom(h.y,d.y,f.y,u.y,this.tension),Dl.initCatmullRom(h.z,d.z,f.z,u.z,this.tension));return i.set(Il.calc(l),Pl.calc(l),Dl.calc(l)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(r.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let r=this.points[t];e.points.push(r.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(new R().fromArray(r))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function Dh(n,e,t,i,r){let s=(i-e)*.5,a=(r-t)*.5,o=n*n,l=n*o;return(2*t-2*i+s+a)*l+(-3*t+3*i-2*s-a)*o+s*n+t}function df(n,e){let t=1-n;return t*t*e}function ff(n,e){return 2*(1-n)*n*e}function pf(n,e){return n*n*e}function zr(n,e,t,i){return df(n,e)+ff(n,t)+pf(n,i)}function mf(n,e){let t=1-n;return t*t*t*e}function gf(n,e){let t=1-n;return 3*t*t*n*e}function _f(n,e){return 3*(1-n)*n*n*e}function yf(n,e){return n*n*n*e}function Vr(n,e,t,i,r){return mf(n,e)+gf(n,t)+_f(n,i)+yf(n,r)}var ts=class extends Qt{constructor(e=new xe,t=new xe,i=new xe,r=new xe){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=i,this.v3=r}getPoint(e,t=new xe){let i=t,r=this.v0,s=this.v1,a=this.v2,o=this.v3;return i.set(Vr(e,r.x,s.x,a.x,o.x),Vr(e,r.y,s.y,a.y,o.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},Oa=class extends Qt{constructor(e=new R,t=new R,i=new R,r=new R){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=i,this.v3=r}getPoint(e,t=new R){let i=t,r=this.v0,s=this.v1,a=this.v2,o=this.v3;return i.set(Vr(e,r.x,s.x,a.x,o.x),Vr(e,r.y,s.y,a.y,o.y),Vr(e,r.z,s.z,a.z,o.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},ns=class extends Qt{constructor(e=new xe,t=new xe){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new xe){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new xe){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Ua=class extends Qt{constructor(e=new R,t=new R){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new R){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new R){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},is=class extends Qt{constructor(e=new xe,t=new xe,i=new xe){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new xe){let i=t,r=this.v0,s=this.v1,a=this.v2;return i.set(zr(e,r.x,s.x,a.x),zr(e,r.y,s.y,a.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},di=class extends Qt{constructor(e=new R,t=new R,i=new R){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new R){let i=t,r=this.v0,s=this.v1,a=this.v2;return i.set(zr(e,r.x,s.x,a.x),zr(e,r.y,s.y,a.y),zr(e,r.z,s.z,a.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},rs=class extends Qt{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new xe){let i=t,r=this.points,s=(r.length-1)*e,a=Math.floor(s),o=s-a,l=r[a===0?a:a-1],h=r[a],u=r[a>r.length-2?r.length-1:a+1],d=r[a>r.length-3?r.length-1:a+2];return i.set(Dh(o,l.x,h.x,u.x,d.x),Dh(o,l.y,h.y,u.y,d.y)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(r.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let r=this.points[t];e.points.push(r.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(new xe().fromArray(r))}return this}},kl=Object.freeze({__proto__:null,ArcCurve:Na,CatmullRomCurve3:Ni,CubicBezierCurve:ts,CubicBezierCurve3:Oa,EllipseCurve:xr,LineCurve:ns,LineCurve3:Ua,QuadraticBezierCurve:is,QuadraticBezierCurve3:di,SplineCurve:rs}),ka=class extends Qt{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){let e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){let i=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new kl[i](t,e))}return this}getPoint(e,t){let i=e*this.getLength(),r=this.getCurveLengths(),s=0;for(;s<r.length;){if(r[s]>=i){let a=r[s]-i,o=this.curves[s],l=o.getLength(),h=l===0?0:1-a/l;return o.getPointAt(h,t)}s++}return null}getLength(){let e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let e=[],t=0;for(let i=0,r=this.curves.length;i<r;i++)t+=this.curves[i].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){let t=[],i;for(let r=0,s=this.curves;r<s.length;r++){let a=s[r],o=a.isEllipseCurve?e*2:a.isLineCurve||a.isLineCurve3?1:a.isSplineCurve?e*a.points.length:e,l=a.getPoints(o);for(let h=0;h<l.length;h++){let u=l[h];i&&i.equals(u)||(t.push(u),i=u)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let r=e.curves[t];this.curves.push(r.clone())}return this.autoClose=e.autoClose,this}toJSON(){let e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,i=this.curves.length;t<i;t++){let r=this.curves[t];e.curves.push(r.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let r=e.curves[t];this.curves.push(new kl[r.type]().fromJSON(r))}return this}},ss=class extends ka{constructor(e){super(),this.type="Path",this.currentPoint=new xe,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,i=e.length;t<i;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){let i=new ns(this.currentPoint.clone(),new xe(e,t));return this.curves.push(i),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,i,r){let s=new is(this.currentPoint.clone(),new xe(e,t),new xe(i,r));return this.curves.push(s),this.currentPoint.set(i,r),this}bezierCurveTo(e,t,i,r,s,a){let o=new ts(this.currentPoint.clone(),new xe(e,t),new xe(i,r),new xe(s,a));return this.curves.push(o),this.currentPoint.set(s,a),this}splineThru(e){let t=[this.currentPoint.clone()].concat(e),i=new rs(t);return this.curves.push(i),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,i,r,s,a){let o=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(e+o,t+l,i,r,s,a),this}absarc(e,t,i,r,s,a){return this.absellipse(e,t,i,i,r,s,a),this}ellipse(e,t,i,r,s,a,o,l){let h=this.currentPoint.x,u=this.currentPoint.y;return this.absellipse(e+h,t+u,i,r,s,a,o,l),this}absellipse(e,t,i,r,s,a,o,l){let h=new xr(e,t,i,r,s,a,o,l);if(this.curves.length>0){let d=h.getPoint(0);d.equals(this.currentPoint)||this.lineTo(d.x,d.y)}this.curves.push(h);let u=h.getPoint(1);return this.currentPoint.copy(u),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){let e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}},vr=class extends ss{constructor(e){super(e),this.uuid=Gn(),this.type="Shape",this.holes=[]}getPointsHoles(e){let t=[];for(let i=0,r=this.holes.length;i<r;i++)t[i]=this.holes[i].getPoints(e);return t}extractPoints(e){return{shape:this.getPoints(e),holes:this.getPointsHoles(e)}}copy(e){super.copy(e),this.holes=[];for(let t=0,i=e.holes.length;t<i;t++){let r=e.holes[t];this.holes.push(r.clone())}return this}toJSON(){let e=super.toJSON();e.uuid=this.uuid,e.holes=[];for(let t=0,i=this.holes.length;t<i;t++){let r=this.holes[t];e.holes.push(r.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.uuid=e.uuid,this.holes=[];for(let t=0,i=e.holes.length;t<i;t++){let r=e.holes[t];this.holes.push(new ss().fromJSON(r))}return this}};function xf(n,e,t=2){let i=e&&e.length,r=i?e[0]*t:n.length,s=wu(n,0,r,t,!0),a=[];if(!s||s.next===s.prev)return a;let o,l,h;if(i&&(s=Tf(n,e,s,t)),n.length>80*t){o=n[0],l=n[1];let u=o,d=l;for(let f=t;f<r;f+=t){let c=n[f],g=n[f+1];c<o&&(o=c),g<l&&(l=g),c>u&&(u=c),g>d&&(d=g)}h=Math.max(u-o,d-l),h=h!==0?32767/h:0}return as(s,a,t,o,l,h,0),a}function wu(n,e,t,i,r){let s;if(r===Nf(n,e,t,i)>0)for(let a=e;a<t;a+=i)s=Lh(a/i|0,n[a],n[a+1],s);else for(let a=t-i;a>=e;a-=i)s=Lh(a/i|0,n[a],n[a+1],s);return s&&Sr(s,s.next)&&(ls(s),s=s.next),s}function Oi(n,e){if(!n)return n;e||(e=n);let t=n,i;do if(i=!1,!t.steiner&&(Sr(t,t.next)||_t(t.prev,t,t.next)===0)){if(ls(t),t=e=t.prev,t===t.next)break;i=!0}else t=t.next;while(i||t!==e);return e}function as(n,e,t,i,r,s,a){if(!n)return;!a&&s&&Rf(n,i,r,s);let o=n;for(;n.prev!==n.next;){let l=n.prev,h=n.next;if(s?Sf(n,i,r,s):vf(n)){e.push(l.i,n.i,h.i),ls(n),n=h.next,o=h.next;continue}if(n=h,n===o){a?a===1?(n=bf(Oi(n),e),as(n,e,t,i,r,s,2)):a===2&&Mf(n,e,t,i,r,s):as(Oi(n),e,t,i,r,s,1);break}}}function vf(n){let e=n.prev,t=n,i=n.next;if(_t(e,t,i)>=0)return!1;let r=e.x,s=t.x,a=i.x,o=e.y,l=t.y,h=i.y,u=Math.min(r,s,a),d=Math.min(o,l,h),f=Math.max(r,s,a),c=Math.max(o,l,h),g=i.next;for(;g!==e;){if(g.x>=u&&g.x<=f&&g.y>=d&&g.y<=c&&Hr(r,o,s,l,a,h,g.x,g.y)&&_t(g.prev,g,g.next)>=0)return!1;g=g.next}return!0}function Sf(n,e,t,i){let r=n.prev,s=n,a=n.next;if(_t(r,s,a)>=0)return!1;let o=r.x,l=s.x,h=a.x,u=r.y,d=s.y,f=a.y,c=Math.min(o,l,h),g=Math.min(u,d,f),S=Math.max(o,l,h),m=Math.max(u,d,f),p=Bl(c,g,e,t,i),M=Bl(S,m,e,t,i),_=n.prevZ,x=n.nextZ;for(;_&&_.z>=p&&x&&x.z<=M;){if(_.x>=c&&_.x<=S&&_.y>=g&&_.y<=m&&_!==r&&_!==a&&Hr(o,u,l,d,h,f,_.x,_.y)&&_t(_.prev,_,_.next)>=0||(_=_.prevZ,x.x>=c&&x.x<=S&&x.y>=g&&x.y<=m&&x!==r&&x!==a&&Hr(o,u,l,d,h,f,x.x,x.y)&&_t(x.prev,x,x.next)>=0))return!1;x=x.nextZ}for(;_&&_.z>=p;){if(_.x>=c&&_.x<=S&&_.y>=g&&_.y<=m&&_!==r&&_!==a&&Hr(o,u,l,d,h,f,_.x,_.y)&&_t(_.prev,_,_.next)>=0)return!1;_=_.prevZ}for(;x&&x.z<=M;){if(x.x>=c&&x.x<=S&&x.y>=g&&x.y<=m&&x!==r&&x!==a&&Hr(o,u,l,d,h,f,x.x,x.y)&&_t(x.prev,x,x.next)>=0)return!1;x=x.nextZ}return!0}function bf(n,e){let t=n;do{let i=t.prev,r=t.next.next;!Sr(i,r)&&Cu(i,t,t.next,r)&&os(i,r)&&os(r,i)&&(e.push(i.i,t.i,r.i),ls(t),ls(t.next),t=n=r),t=t.next}while(t!==n);return Oi(t)}function Mf(n,e,t,i,r,s){let a=n;do{let o=a.next.next;for(;o!==a.prev;){if(a.i!==o.i&&Df(a,o)){let l=Ru(a,o);a=Oi(a,a.next),l=Oi(l,l.next),as(a,e,t,i,r,s,0),as(l,e,t,i,r,s,0);return}o=o.next}a=a.next}while(a!==n)}function Tf(n,e,t,i){let r=[];for(let s=0,a=e.length;s<a;s++){let o=e[s]*i,l=s<a-1?e[s+1]*i:n.length,h=wu(n,o,l,i,!1);h===h.next&&(h.steiner=!0),r.push(Pf(h))}r.sort(Ef);for(let s=0;s<r.length;s++)t=wf(r[s],t);return t}function Ef(n,e){let t=n.x-e.x;if(t===0&&(t=n.y-e.y,t===0)){let i=(n.next.y-n.y)/(n.next.x-n.x),r=(e.next.y-e.y)/(e.next.x-e.x);t=i-r}return t}function wf(n,e){let t=Af(n,e);if(!t)return e;let i=Ru(t,n);return Oi(i,i.next),Oi(t,t.next)}function Af(n,e){let t=e,i=n.x,r=n.y,s=-1/0,a;if(Sr(n,t))return t;do{if(Sr(n,t.next))return t.next;if(r<=t.y&&r>=t.next.y&&t.next.y!==t.y){let d=t.x+(r-t.y)*(t.next.x-t.x)/(t.next.y-t.y);if(d<=i&&d>s&&(s=d,a=t.x<t.next.x?t:t.next,d===i))return a}t=t.next}while(t!==e);if(!a)return null;let o=a,l=a.x,h=a.y,u=1/0;t=a;do{if(i>=t.x&&t.x>=l&&i!==t.x&&Au(r<h?i:s,r,l,h,r<h?s:i,r,t.x,t.y)){let d=Math.abs(r-t.y)/(i-t.x);os(t,n)&&(d<u||d===u&&(t.x>a.x||t.x===a.x&&Cf(a,t)))&&(a=t,u=d)}t=t.next}while(t!==o);return a}function Cf(n,e){return _t(n.prev,n,e.prev)<0&&_t(e.next,n,n.next)<0}function Rf(n,e,t,i){let r=n;do r.z===0&&(r.z=Bl(r.x,r.y,e,t,i)),r.prevZ=r.prev,r.nextZ=r.next,r=r.next;while(r!==n);r.prevZ.nextZ=null,r.prevZ=null,If(r)}function If(n){let e,t=1;do{let i=n,r;n=null;let s=null;for(e=0;i;){e++;let a=i,o=0;for(let h=0;h<t&&(o++,a=a.nextZ,!!a);h++);let l=t;for(;o>0||l>0&&a;)o!==0&&(l===0||!a||i.z<=a.z)?(r=i,i=i.nextZ,o--):(r=a,a=a.nextZ,l--),s?s.nextZ=r:n=r,r.prevZ=s,s=r;i=a}s.nextZ=null,t*=2}while(e>1);return n}function Bl(n,e,t,i,r){return n=(n-t)*r|0,e=(e-i)*r|0,n=(n|n<<8)&16711935,n=(n|n<<4)&252645135,n=(n|n<<2)&858993459,n=(n|n<<1)&1431655765,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,n|e<<1}function Pf(n){let e=n,t=n;do(e.x<t.x||e.x===t.x&&e.y<t.y)&&(t=e),e=e.next;while(e!==n);return t}function Au(n,e,t,i,r,s,a,o){return(r-a)*(e-o)>=(n-a)*(s-o)&&(n-a)*(i-o)>=(t-a)*(e-o)&&(t-a)*(s-o)>=(r-a)*(i-o)}function Hr(n,e,t,i,r,s,a,o){return!(n===a&&e===o)&&Au(n,e,t,i,r,s,a,o)}function Df(n,e){return n.next.i!==e.i&&n.prev.i!==e.i&&!Lf(n,e)&&(os(n,e)&&os(e,n)&&Ff(n,e)&&(_t(n.prev,n,e.prev)||_t(n,e.prev,e))||Sr(n,e)&&_t(n.prev,n,n.next)>0&&_t(e.prev,e,e.next)>0)}function _t(n,e,t){return(e.y-n.y)*(t.x-e.x)-(e.x-n.x)*(t.y-e.y)}function Sr(n,e){return n.x===e.x&&n.y===e.y}function Cu(n,e,t,i){let r=aa(_t(n,e,t)),s=aa(_t(n,e,i)),a=aa(_t(t,i,n)),o=aa(_t(t,i,e));return!!(r!==s&&a!==o||r===0&&sa(n,t,e)||s===0&&sa(n,i,e)||a===0&&sa(t,n,i)||o===0&&sa(t,e,i))}function sa(n,e,t){return e.x<=Math.max(n.x,t.x)&&e.x>=Math.min(n.x,t.x)&&e.y<=Math.max(n.y,t.y)&&e.y>=Math.min(n.y,t.y)}function aa(n){return n>0?1:n<0?-1:0}function Lf(n,e){let t=n;do{if(t.i!==n.i&&t.next.i!==n.i&&t.i!==e.i&&t.next.i!==e.i&&Cu(t,t.next,n,e))return!0;t=t.next}while(t!==n);return!1}function os(n,e){return _t(n.prev,n,n.next)<0?_t(n,e,n.next)>=0&&_t(n,n.prev,e)>=0:_t(n,e,n.prev)<0||_t(n,n.next,e)<0}function Ff(n,e){let t=n,i=!1,r=(n.x+e.x)/2,s=(n.y+e.y)/2;do t.y>s!=t.next.y>s&&t.next.y!==t.y&&r<(t.next.x-t.x)*(s-t.y)/(t.next.y-t.y)+t.x&&(i=!i),t=t.next;while(t!==n);return i}function Ru(n,e){let t=Hl(n.i,n.x,n.y),i=Hl(e.i,e.x,e.y),r=n.next,s=e.prev;return n.next=e,e.prev=n,t.next=r,r.prev=t,i.next=t,t.prev=i,s.next=i,i.prev=s,i}function Lh(n,e,t,i){let r=Hl(n,e,t);return i?(r.next=i.next,r.prev=i,i.next.prev=r,i.next=r):(r.prev=r,r.next=r),r}function ls(n){n.next.prev=n.prev,n.prev.next=n.next,n.prevZ&&(n.prevZ.nextZ=n.nextZ),n.nextZ&&(n.nextZ.prevZ=n.prevZ)}function Hl(n,e,t){return{i:n,x:e,y:t,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function Nf(n,e,t,i){let r=0;for(let s=e,a=t-i;s<t;s+=i)r+=(n[a]-n[s])*(n[s+1]+n[a+1]),a=s;return r}var zl=class{static triangulate(e,t,i=2){return xf(e,t,i)}},cr=class n{static area(e){let t=e.length,i=0;for(let r=t-1,s=0;s<t;r=s++)i+=e[r].x*e[s].y-e[s].x*e[r].y;return i*.5}static isClockWise(e){return n.area(e)<0}static triangulateShape(e,t){let i=[],r=[],s=[];Fh(e),Nh(i,e);let a=e.length;t.forEach(Fh);for(let l=0;l<t.length;l++)r.push(a),a+=t[l].length,Nh(i,t[l]);let o=zl.triangulate(i,r);for(let l=0;l<o.length;l+=3)s.push(o.slice(l,l+3));return s}};function Fh(n){let e=n.length;e>2&&n[e-1].equals(n[0])&&n.pop()}function Nh(n,e){for(let t=0;t<e.length;t++)n.push(e[t].x),n.push(e[t].y)}var en=class n extends st{constructor(e=1,t=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:r};let s=e/2,a=t/2,o=Math.floor(i),l=Math.floor(r),h=o+1,u=l+1,d=e/o,f=t/l,c=[],g=[],S=[],m=[];for(let p=0;p<u;p++){let M=p*f-a;for(let _=0;_<h;_++){let x=_*d-s;g.push(x,-M,0),S.push(0,0,1),m.push(_/o),m.push(1-p/l)}}for(let p=0;p<l;p++)for(let M=0;M<o;M++){let _=M+h*p,x=M+h*(p+1),w=M+1+h*(p+1),E=M+1+h*p;c.push(_,x,E),c.push(x,w,E)}this.setIndex(c),this.setAttribute("position",new yt(g,3)),this.setAttribute("normal",new yt(S,3)),this.setAttribute("uv",new yt(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.widthSegments,e.heightSegments)}};var cs=class n extends st{constructor(e=new vr([new xe(0,.5),new xe(-.5,-.5),new xe(.5,-.5)]),t=12){super(),this.type="ShapeGeometry",this.parameters={shapes:e,curveSegments:t};let i=[],r=[],s=[],a=[],o=0,l=0;if(Array.isArray(e)===!1)h(e);else for(let u=0;u<e.length;u++)h(e[u]),this.addGroup(o,l,u),o+=l,l=0;this.setIndex(i),this.setAttribute("position",new yt(r,3)),this.setAttribute("normal",new yt(s,3)),this.setAttribute("uv",new yt(a,2));function h(u){let d=r.length/3,f=u.extractPoints(t),c=f.shape,g=f.holes;cr.isClockWise(c)===!1&&(c=c.reverse());for(let m=0,p=g.length;m<p;m++){let M=g[m];cr.isClockWise(M)===!0&&(g[m]=M.reverse())}let S=cr.triangulateShape(c,g);for(let m=0,p=g.length;m<p;m++){let M=g[m];c=c.concat(M)}for(let m=0,p=c.length;m<p;m++){let M=c[m];r.push(M.x,M.y,0),s.push(0,0,1),a.push(M.x,M.y)}for(let m=0,p=S.length;m<p;m++){let M=S[m],_=M[0]+d,x=M[1]+d,w=M[2]+d;i.push(_,x,w),l+=3}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON(),t=this.parameters.shapes;return Of(t,e)}static fromJSON(e,t){let i=[];for(let r=0,s=e.shapes.length;r<s;r++){let a=t[e.shapes[r]];i.push(a)}return new n(i,e.curveSegments)}};function Of(n,e){if(e.shapes=[],Array.isArray(n))for(let t=0,i=n.length;t<i;t++){let r=n[t];e.shapes.push(r.uuid)}else e.shapes.push(n.uuid);return e}var hs=class n extends st{constructor(e=new di(new R(-1,-1,0),new R(-1,1,0),new R(1,1,0)),t=64,i=1,r=8,s=!1){super(),this.type="TubeGeometry",this.parameters={path:e,tubularSegments:t,radius:i,radialSegments:r,closed:s};let a=e.computeFrenetFrames(t,s);this.tangents=a.tangents,this.normals=a.normals,this.binormals=a.binormals;let o=new R,l=new R,h=new xe,u=new R,d=[],f=[],c=[],g=[];S(),this.setIndex(g),this.setAttribute("position",new yt(d,3)),this.setAttribute("normal",new yt(f,3)),this.setAttribute("uv",new yt(c,2));function S(){for(let _=0;_<t;_++)m(_);m(s===!1?t:0),M(),p()}function m(_){u=e.getPointAt(_/t,u);let x=a.normals[_],w=a.binormals[_];for(let E=0;E<=r;E++){let C=E/r*Math.PI*2,v=Math.sin(C),A=-Math.cos(C);l.x=A*x.x+v*w.x,l.y=A*x.y+v*w.y,l.z=A*x.z+v*w.z,l.normalize(),f.push(l.x,l.y,l.z),o.x=u.x+i*l.x,o.y=u.y+i*l.y,o.z=u.z+i*l.z,d.push(o.x,o.y,o.z)}}function p(){for(let _=1;_<=t;_++)for(let x=1;x<=r;x++){let w=(r+1)*(_-1)+(x-1),E=(r+1)*_+(x-1),C=(r+1)*_+x,v=(r+1)*(_-1)+x;g.push(w,E,v),g.push(E,C,v)}}function M(){for(let _=0;_<=t;_++)for(let x=0;x<=r;x++)h.x=_/t,h.y=x/r,c.push(h.x,h.y)}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON();return e.path=this.parameters.path.toJSON(),e}static fromJSON(e){return new n(new kl[e.path.type]().fromJSON(e.path),e.tubularSegments,e.radius,e.radialSegments,e.closed)}};function ki(n){let e={};for(let t in n){e[t]={};for(let i in n[t]){let r=n[t][i];if(Oh(r))r.isRenderTargetTexture?(Ce("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=r.clone();else if(Array.isArray(r))if(Oh(r[0])){let s=[];for(let a=0,o=r.length;a<o;a++)s[a]=r[a].clone();e[t][i]=s}else e[t][i]=r.slice();else e[t][i]=r}}return e}function Ht(n){let e={};for(let t=0;t<n.length;t++){let i=ki(n[t]);for(let r in i)e[r]=i[r]}return e}function Oh(n){return n&&(n.isColor||n.isMatrix3||n.isMatrix4||n.isVector2||n.isVector3||n.isVector4||n.isTexture||n.isQuaternion)}function Uf(n){let e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function pc(n){let e=n.getRenderTarget();return e===null?n.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:Ye.workingColorSpace}var Iu={clone:ki,merge:Ht},kf=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Bf=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,tn=class extends qn{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=kf,this.fragmentShader=Bf,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=ki(e.uniforms),this.uniformsGroups=Uf(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let r in this.uniforms){let a=this.uniforms[r].value;a&&a.isTexture?t.uniforms[r]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[r]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[r]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[r]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[r]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[r]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[r]={type:"m4",value:a.toArray()}:t.uniforms[r]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let i={};for(let r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}},Ba=class extends tn{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}};var Ha=class extends qn{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=du,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},za=class extends qn{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};var br=class extends Nt{constructor(e){super(),this.isLineDashedMaterial=!0,this.type="LineDashedMaterial",this.scale=1,this.dashSize=3,this.gapSize=1,this.setValues(e)}copy(e){return super.copy(e),this.scale=e.scale,this.dashSize=e.dashSize,this.gapSize=e.gapSize,this}};function oa(n,e){return!n||n.constructor===e?n:typeof e.BYTES_PER_ELEMENT=="number"?new e(n):Array.prototype.slice.call(n)}var fi=class{constructor(e,t,i,r){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=r!==void 0?r:new t.constructor(i),this.sampleValues=t,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,i=this._cachedIndex,r=t[i],s=t[i-1];n:{e:{let a;t:{i:if(!(e<r)){for(let o=i+2;;){if(r===void 0){if(e<s)break i;return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===o)break;if(s=r,r=t[++i],e<r)break e}a=t.length;break t}if(!(e>=s)){let o=t[1];e<o&&(i=2,s=o);for(let l=i-2;;){if(s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===l)break;if(r=s,s=t[--i-1],e>=s)break e}a=i,i=0;break t}break n}for(;i<a;){let o=i+a>>>1;e<t[o]?a=o:i=o+1}if(r=t[i],s=t[i-1],s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===void 0)return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,s,r)}return this.interpolate_(i,s,e,r)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,i=this.sampleValues,r=this.valueSize,s=e*r;for(let a=0;a!==r;++a)t[a]=i[s+a];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},Va=class extends fi{constructor(e,t,i,r){super(e,t,i,r),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Fl,endingEnd:Fl}}intervalChanged_(e,t,i){let r=this.parameterPositions,s=e-2,a=e+1,o=r[s],l=r[a];if(o===void 0)switch(this.getSettings_().endingStart){case Nl:s=e,o=2*t-i;break;case Ol:s=r.length-2,o=t+r[s]-r[s+1];break;default:s=e,o=i}if(l===void 0)switch(this.getSettings_().endingEnd){case Nl:a=e,l=2*i-t;break;case Ol:a=1,l=i+r[1]-r[0];break;default:a=e-1,l=t}let h=(i-t)*.5,u=this.valueSize;this._weightPrev=h/(t-o),this._weightNext=h/(l-i),this._offsetPrev=s*u,this._offsetNext=a*u}interpolate_(e,t,i,r){let s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,h=l-o,u=this._offsetPrev,d=this._offsetNext,f=this._weightPrev,c=this._weightNext,g=(i-t)/(r-t),S=g*g,m=S*g,p=-f*m+2*f*S-f*g,M=(1+f)*m+(-1.5-2*f)*S+(-.5+f)*g+1,_=(-1-c)*m+(1.5+c)*S+.5*g,x=c*m-c*S;for(let w=0;w!==o;++w)s[w]=p*a[u+w]+M*a[h+w]+_*a[l+w]+x*a[d+w];return s}},Ga=class extends fi{constructor(e,t,i,r){super(e,t,i,r)}interpolate_(e,t,i,r){let s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,h=l-o,u=(i-t)/(r-t),d=1-u;for(let f=0;f!==o;++f)s[f]=a[h+f]*d+a[l+f]*u;return s}},Wa=class extends fi{constructor(e,t,i,r){super(e,t,i,r)}interpolate_(e){return this.copySampleValue_(e-1)}},Xa=class extends fi{interpolate_(e,t,i,r){let s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,h=l-o,u=this.settings||this.DefaultSettings_,d=u.inTangents,f=u.outTangents;if(!d||!f){let S=(i-t)/(r-t),m=1-S;for(let p=0;p!==o;++p)s[p]=a[h+p]*m+a[l+p]*S;return s}let c=o*2,g=e-1;for(let S=0;S!==o;++S){let m=a[h+S],p=a[l+S],M=g*c+S*2,_=f[M],x=f[M+1],w=e*c+S*2,E=d[w],C=d[w+1],v=(i-t)/(r-t),A,L,I,O,G;for(let W=0;W<8;W++){A=v*v,L=A*v,I=1-v,O=I*I,G=O*I;let H=G*t+3*O*v*_+3*I*A*E+L*r-i;if(Math.abs(H)<1e-10)break;let V=3*O*(_-t)+6*I*v*(E-_)+3*A*(r-E);if(Math.abs(V)<1e-10)break;v=v-H/V,v=Math.max(0,Math.min(1,v))}s[S]=G*m+3*O*v*x+3*I*A*C+L*p}return s}},nn=class{constructor(e,t,i,r){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=oa(t,this.TimeBufferType),this.values=oa(i,this.ValueBufferType),this.setInterpolation(r||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,i;if(t.toJSON!==this.toJSON)i=t.toJSON(e);else{i={name:e.name,times:oa(e.times,Array),values:oa(e.values,Array)};let r=e.getInterpolation();r!==e.DefaultInterpolation&&(i.interpolation=r)}return i.type=e.ValueTypeName,i}InterpolantFactoryMethodDiscrete(e){return new Wa(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Ga(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Va(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new Xa(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.settings=this.settings),t}setInterpolation(e){let t;switch(e){case Gr:t=this.InterpolantFactoryMethodDiscrete;break;case Ma:t=this.InterpolantFactoryMethodLinear;break;case ha:t=this.InterpolantFactoryMethodSmooth;break;case Ll:t=this.InterpolantFactoryMethodBezier;break}if(t===void 0){let i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(i);return Ce("KeyframeTrack:",i),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Gr;case this.InterpolantFactoryMethodLinear:return Ma;case this.InterpolantFactoryMethodSmooth:return ha;case this.InterpolantFactoryMethodBezier:return Ll}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let i=0,r=t.length;i!==r;++i)t[i]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let i=0,r=t.length;i!==r;++i)t[i]*=e}return this}trim(e,t){let i=this.times,r=i.length,s=0,a=r-1;for(;s!==r&&i[s]<e;)++s;for(;a!==-1&&i[a]>t;)--a;if(++a,s!==0||a!==r){s>=a&&(a=Math.max(a,1),s=a-1);let o=this.getValueSize();this.times=i.slice(s,a),this.values=this.values.slice(s*o,a*o)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(Re("KeyframeTrack: Invalid value size in track.",this),e=!1);let i=this.times,r=this.values,s=i.length;s===0&&(Re("KeyframeTrack: Track is empty.",this),e=!1);let a=null;for(let o=0;o!==s;o++){let l=i[o];if(typeof l=="number"&&isNaN(l)){Re("KeyframeTrack: Time is not a valid number.",this,o,l),e=!1;break}if(a!==null&&a>l){Re("KeyframeTrack: Out of order keys.",this,o,l,a),e=!1;break}a=l}if(r!==void 0&&Xd(r))for(let o=0,l=r.length;o!==l;++o){let h=r[o];if(isNaN(h)){Re("KeyframeTrack: Value is not a valid number.",this,o,h),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),i=this.getValueSize(),r=this.getInterpolation()===ha,s=e.length-1,a=1;for(let o=1;o<s;++o){let l=!1,h=e[o],u=e[o+1];if(h!==u&&(o!==1||h!==e[0]))if(r)l=!0;else{let d=o*i,f=d-i,c=d+i;for(let g=0;g!==i;++g){let S=t[d+g];if(S!==t[f+g]||S!==t[c+g]){l=!0;break}}}if(l){if(o!==a){e[a]=e[o];let d=o*i,f=a*i;for(let c=0;c!==i;++c)t[f+c]=t[d+c]}++a}}if(s>0){e[a]=e[s];for(let o=s*i,l=a*i,h=0;h!==i;++h)t[l+h]=t[o+h];++a}return a!==e.length?(this.times=e.slice(0,a),this.values=t.slice(0,a*i)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),i=this.constructor,r=new i(this.name,e,t);return r.createInterpolant=this.createInterpolant,r}};nn.prototype.ValueTypeName="";nn.prototype.TimeBufferType=Float32Array;nn.prototype.ValueBufferType=Float32Array;nn.prototype.DefaultInterpolation=Ma;var pi=class extends nn{constructor(e,t,i){super(e,t,i)}};pi.prototype.ValueTypeName="bool";pi.prototype.ValueBufferType=Array;pi.prototype.DefaultInterpolation=Gr;pi.prototype.InterpolantFactoryMethodLinear=void 0;pi.prototype.InterpolantFactoryMethodSmooth=void 0;var qa=class extends nn{constructor(e,t,i,r){super(e,t,i,r)}};qa.prototype.ValueTypeName="color";var Ya=class extends nn{constructor(e,t,i,r){super(e,t,i,r)}};Ya.prototype.ValueTypeName="number";var $a=class extends fi{constructor(e,t,i,r){super(e,t,i,r)}interpolate_(e,t,i,r){let s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(i-t)/(r-t),h=e*o;for(let u=h+o;h!==u;h+=4)Rn.slerpFlat(s,0,a,h-o,a,h,l);return s}},us=class extends nn{constructor(e,t,i,r){super(e,t,i,r)}InterpolantFactoryMethodLinear(e){return new $a(this.times,this.values,this.getValueSize(),e)}};us.prototype.ValueTypeName="quaternion";us.prototype.InterpolantFactoryMethodSmooth=void 0;var mi=class extends nn{constructor(e,t,i){super(e,t,i)}};mi.prototype.ValueTypeName="string";mi.prototype.ValueBufferType=Array;mi.prototype.DefaultInterpolation=Gr;mi.prototype.InterpolantFactoryMethodLinear=void 0;mi.prototype.InterpolantFactoryMethodSmooth=void 0;var Za=class extends nn{constructor(e,t,i,r){super(e,t,i,r)}};Za.prototype.ValueTypeName="vector";var ua={enabled:!1,files:{},add:function(n,e){this.enabled!==!1&&(Uh(n)||(this.files[n]=e))},get:function(n){if(this.enabled!==!1&&!Uh(n))return this.files[n]},remove:function(n){delete this.files[n]},clear:function(){this.files={}}};function Uh(n){try{let e=n.slice(n.indexOf(":")+1);return new URL(e).protocol==="blob:"}catch{return!1}}var Ka=class{constructor(e,t,i){let r=this,s=!1,a=0,o=0,l,h=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=i,this._abortController=null,this.itemStart=function(u){o++,s===!1&&r.onStart!==void 0&&r.onStart(u,a,o),s=!0},this.itemEnd=function(u){a++,r.onProgress!==void 0&&r.onProgress(u,a,o),a===o&&(s=!1,r.onLoad!==void 0&&r.onLoad())},this.itemError=function(u){r.onError!==void 0&&r.onError(u)},this.resolveURL=function(u){return l?l(u):u},this.setURLModifier=function(u){return l=u,this},this.addHandler=function(u,d){return h.push(u,d),this},this.removeHandler=function(u){let d=h.indexOf(u);return d!==-1&&h.splice(d,2),this},this.getHandler=function(u){for(let d=0,f=h.length;d<f;d+=2){let c=h[d],g=h[d+1];if(c.global&&(c.lastIndex=0),c.test(u))return g}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},Pu=new Ka,Mr=class{constructor(e){this.manager=e!==void 0?e:Pu,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(e,t){let i=this;return new Promise(function(r,s){i.load(e,r,t,s)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};Mr.DEFAULT_MATERIAL_NAME="__DEFAULT";var sr=new WeakMap,Ja=class extends Mr{constructor(e){super(e)}load(e,t,i,r){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let s=this,a=ua.get(`image:${e}`);if(a!==void 0){if(a.complete===!0)s.manager.itemStart(e),setTimeout(function(){t&&t(a),s.manager.itemEnd(e)},0);else{let d=sr.get(a);d===void 0&&(d=[],sr.set(a,d)),d.push({onLoad:t,onError:r})}return a}let o=hr("img");function l(){u(),t&&t(this);let d=sr.get(this)||[];for(let f=0;f<d.length;f++){let c=d[f];c.onLoad&&c.onLoad(this)}sr.delete(this),s.manager.itemEnd(e)}function h(d){u(),r&&r(d),ua.remove(`image:${e}`);let f=sr.get(this)||[];for(let c=0;c<f.length;c++){let g=f[c];g.onError&&g.onError(d)}sr.delete(this),s.manager.itemError(e),s.manager.itemEnd(e)}function u(){o.removeEventListener("load",l,!1),o.removeEventListener("error",h,!1)}return o.addEventListener("load",l,!1),o.addEventListener("error",h,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(o.crossOrigin=this.crossOrigin),ua.add(`image:${e}`,o),s.manager.itemStart(e),o.src=e,o}};var ds=class extends Mr{constructor(e){super(e)}load(e,t,i,r){let s=new Lt,a=new Ja(this.manager);return a.setCrossOrigin(this.crossOrigin),a.setPath(this.path),a.load(e,function(o){s.image=o,s.needsUpdate=!0,t!==void 0&&t(s)},i,r),s}};var la=new R,ca=new Rn,Tn=new R,fs=class extends qt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ft,this.projectionMatrix=new ft,this.projectionMatrixInverse=new ft,this.coordinateSystem=fn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(la,ca,Tn),Tn.x===1&&Tn.y===1&&Tn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(la,ca,Tn.set(1,1,1)).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorld.decompose(la,ca,Tn),Tn.x===1&&Tn.y===1&&Tn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(la,ca,Tn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},li=new R,kh=new xe,Bh=new xe,Wt=class extends fs{constructor(e=50,t=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=wa*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(sl*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return wa*2*Math.atan(Math.tan(sl*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){li.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(li.x,li.y).multiplyScalar(-e/li.z),li.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(li.x,li.y).multiplyScalar(-e/li.z)}getViewSize(e,t){return this.getViewBounds(e,kh,Bh),t.subVectors(Bh,kh)}setViewOffset(e,t,i,r,s,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(sl*.5*this.fov)/this.zoom,i=2*t,r=this.aspect*i,s=-.5*r,a=this.view;if(this.view!==null&&this.view.enabled){let l=a.fullWidth,h=a.fullHeight;s+=a.offsetX*r/l,t-=a.offsetY*i/h,r*=a.width/l,i*=a.height/h}let o=this.filmOffset;o!==0&&(s+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,t,t-i,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}};var gi=class extends fs{constructor(e=-1,t=1,i=1,r=-1,s=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=r,this.near=s,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,r,s,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2,s=i-e,a=i+e,o=r+t,l=r-t;if(this.view!==null&&this.view.enabled){let h=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=h*this.view.offsetX,a=s+h*this.view.width,o-=u*this.view.offsetY,l=o-u*this.view.height}this.projectionMatrix.makeOrthographic(s,a,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}};var ar=-90,or=1,ja=class extends qt{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new Wt(ar,or,e,t);r.layers=this.layers,this.add(r);let s=new Wt(ar,or,e,t);s.layers=this.layers,this.add(s);let a=new Wt(ar,or,e,t);a.layers=this.layers,this.add(a);let o=new Wt(ar,or,e,t);o.layers=this.layers,this.add(o);let l=new Wt(ar,or,e,t);l.layers=this.layers,this.add(l);let h=new Wt(ar,or,e,t);h.layers=this.layers,this.add(h)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[i,r,s,a,o,l]=t;for(let h of t)this.remove(h);if(e===fn)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===qr)i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let h of t)this.add(h),h.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[s,a,o,l,h,u]=this.children,d=e.getRenderTarget(),f=e.getActiveCubeFace(),c=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;let S=i.texture.generateMipmaps;i.texture.generateMipmaps=!1;let m=!1;e.isWebGLRenderer===!0?m=e.state.buffers.depth.getReversed():m=e.reversedDepthBuffer,e.setRenderTarget(i,0,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(i,1,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(i,2,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(i,3,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(i,4,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,h),i.texture.generateMipmaps=S,e.setRenderTarget(i,5,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,u),e.setRenderTarget(d,f,c),e.xr.enabled=g,i.texture.needsPMREMUpdate=!0}},Qa=class extends Wt{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}};var mc="\\[\\]\\.:\\/",Hf=new RegExp("["+mc+"]","g"),gc="[^"+mc+"]",zf="[^"+mc.replace("\\.","")+"]",Vf=/((?:WC+[\/:])*)/.source.replace("WC",gc),Gf=/(WCOD+)?/.source.replace("WCOD",zf),Wf=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",gc),Xf=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",gc),qf=new RegExp("^"+Vf+Gf+Wf+Xf+"$"),Yf=["material","materials","bones","map"],Vl=class{constructor(e,t,i){let r=i||ut.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,r)}getValue(e,t){this.bind();let i=this._targetGroup.nCachedObjects_,r=this._bindings[i];r!==void 0&&r.getValue(e,t)}setValue(e,t){let i=this._bindings;for(let r=this._targetGroup.nCachedObjects_,s=i.length;r!==s;++r)i[r].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].unbind()}},ut=class n{constructor(e,t,i){this.path=t,this.parsedPath=i||n.parseTrackName(t),this.node=n.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,i){return e&&e.isAnimationObjectGroup?new n.Composite(e,t,i):new n(e,t,i)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(Hf,"")}static parseTrackName(e){let t=qf.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let i={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},r=i.nodeName&&i.nodeName.lastIndexOf(".");if(r!==void 0&&r!==-1){let s=i.nodeName.substring(r+1);Yf.indexOf(s)!==-1&&(i.nodeName=i.nodeName.substring(0,r),i.objectName=s)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return i}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let i=e.skeleton.getBoneByName(t);if(i!==void 0)return i}if(e.children){let i=function(s){for(let a=0;a<s.length;a++){let o=s[a];if(o.name===t||o.uuid===t)return o;let l=i(o.children);if(l)return l}return null},r=i(e.children);if(r)return r}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)e[t++]=i[r]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)i[r]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)i[r]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)i[r]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,i=t.objectName,r=t.propertyName,s=t.propertyIndex;if(e||(e=n.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){Ce("PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let h=t.objectIndex;switch(i){case"materials":if(!e.material){Re("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){Re("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){Re("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let u=0;u<e.length;u++)if(e[u].name===h){h=u;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){Re("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){Re("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[i]===void 0){Re("PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[i]}if(h!==void 0){if(e[h]===void 0){Re("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[h]}}let a=e[r];if(a===void 0){let h=t.nodeName;Re("PropertyBinding: Trying to update property for track: "+h+"."+r+" but it wasn't found.",e);return}let o=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?o=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(s!==void 0){if(r==="morphTargetInfluences"){if(!e.geometry){Re("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){Re("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[s]!==void 0&&(s=e.morphTargetDictionary[s])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=s}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=r;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};ut.Composite=Vl;ut.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};ut.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};ut.prototype.GetterByBindingType=[ut.prototype._getValue_direct,ut.prototype._getValue_array,ut.prototype._getValue_arrayElement,ut.prototype._getValue_toArray];ut.prototype.SetterByBindingTypeAndVersioning=[[ut.prototype._setValue_direct,ut.prototype._setValue_direct_setNeedsUpdate,ut.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[ut.prototype._setValue_array,ut.prototype._setValue_array_setNeedsUpdate,ut.prototype._setValue_array_setMatrixWorldNeedsUpdate],[ut.prototype._setValue_arrayElement,ut.prototype._setValue_arrayElement_setNeedsUpdate,ut.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[ut.prototype._setValue_fromArray,ut.prototype._setValue_fromArray_setNeedsUpdate,ut.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var ox=new Float32Array(1);var Hh=new ft,Tr=class{constructor(e,t,i=0,r=1/0){this.ray=new gr(e,t),this.near=i,this.far=r,this.camera=null,this.layers=new fr,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,(t.near+t.far)/(t.near-t.far)).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):Re("Raycaster: Unsupported camera type: "+t.type)}setFromXRController(e){return Hh.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Hh),this}intersectObject(e,t=!0,i=[]){return Gl(e,this,i,t),i.sort(zh),i}intersectObjects(e,t=!0,i=[]){for(let r=0,s=e.length;r<s;r++)Gl(e[r],this,i,t);return i.sort(zh),i}};function zh(n,e){return n.distance-e.distance}function Gl(n,e,t,i){let r=!0;if(n.layers.test(e.layers)&&n.raycast(e,t)===!1&&(r=!1),r===!0&&i===!0){let s=n.children;for(let a=0,o=s.length;a<o;a++)Gl(s[a],e,t,!0)}}var Wl=class n{static{n.prototype.isMatrix2=!0}constructor(e,t,i,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,i,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let i=0;i<4;i++)this.elements[i]=e[i+t];return this}set(e,t,i,r){let s=this.elements;return s[0]=e,s[2]=t,s[1]=i,s[3]=r,this}};function _c(n,e,t,i){let r=$f(i);switch(t){case lc:return n*e;case hc:return n*e/r.components*r.byteLength;case ao:return n*e/r.components*r.byteLength;case xi:return n*e*2/r.components*r.byteLength;case oo:return n*e*2/r.components*r.byteLength;case cc:return n*e*3/r.components*r.byteLength;case cn:return n*e*4/r.components*r.byteLength;case lo:return n*e*4/r.components*r.byteLength;case _s:case ys:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case xs:case vs:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case ho:case fo:return Math.max(n,16)*Math.max(e,8)/4;case co:case uo:return Math.max(n,8)*Math.max(e,8)/2;case po:case mo:case _o:case yo:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case go:case Ss:case xo:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case vo:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case So:return Math.floor((n+4)/5)*Math.floor((e+3)/4)*16;case bo:return Math.floor((n+4)/5)*Math.floor((e+4)/5)*16;case Mo:return Math.floor((n+5)/6)*Math.floor((e+4)/5)*16;case To:return Math.floor((n+5)/6)*Math.floor((e+5)/6)*16;case Eo:return Math.floor((n+7)/8)*Math.floor((e+4)/5)*16;case wo:return Math.floor((n+7)/8)*Math.floor((e+5)/6)*16;case Ao:return Math.floor((n+7)/8)*Math.floor((e+7)/8)*16;case Co:return Math.floor((n+9)/10)*Math.floor((e+4)/5)*16;case Ro:return Math.floor((n+9)/10)*Math.floor((e+5)/6)*16;case Io:return Math.floor((n+9)/10)*Math.floor((e+7)/8)*16;case Po:return Math.floor((n+9)/10)*Math.floor((e+9)/10)*16;case Do:return Math.floor((n+11)/12)*Math.floor((e+9)/10)*16;case Lo:return Math.floor((n+11)/12)*Math.floor((e+11)/12)*16;case Fo:case No:case Oo:return Math.ceil(n/4)*Math.ceil(e/4)*16;case Uo:case ko:return Math.ceil(n/4)*Math.ceil(e/4)*8;case bs:case Bo:return Math.ceil(n/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function $f(n){switch(n){case rn:case rc:return{byteLength:1,components:1};case wr:case sc:case Dn:return{byteLength:2,components:1};case ro:case so:return{byteLength:2,components:4};case yn:case io:case xn:return{byteLength:4,components:1};case ac:case oc:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${n}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"184"}}));typeof window<"u"&&(window.__THREE__?Ce("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="184");function ed(){let n=null,e=!1,t=null,i=null;function r(s,a){t(s,a),i=n.requestAnimationFrame(r)}return{start:function(){e!==!0&&t!==null&&n!==null&&(i=n.requestAnimationFrame(r),e=!0)},stop:function(){n!==null&&n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(s){t=s},setContext:function(s){n=s}}}function Kf(n){let e=new WeakMap;function t(o,l){let h=o.array,u=o.usage,d=h.byteLength,f=n.createBuffer();n.bindBuffer(l,f),n.bufferData(l,h,u),o.onUploadCallback();let c;if(h instanceof Float32Array)c=n.FLOAT;else if(typeof Float16Array<"u"&&h instanceof Float16Array)c=n.HALF_FLOAT;else if(h instanceof Uint16Array)o.isFloat16BufferAttribute?c=n.HALF_FLOAT:c=n.UNSIGNED_SHORT;else if(h instanceof Int16Array)c=n.SHORT;else if(h instanceof Uint32Array)c=n.UNSIGNED_INT;else if(h instanceof Int32Array)c=n.INT;else if(h instanceof Int8Array)c=n.BYTE;else if(h instanceof Uint8Array)c=n.UNSIGNED_BYTE;else if(h instanceof Uint8ClampedArray)c=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+h);return{buffer:f,type:c,bytesPerElement:h.BYTES_PER_ELEMENT,version:o.version,size:d}}function i(o,l,h){let u=l.array,d=l.updateRanges;if(n.bindBuffer(h,o),d.length===0)n.bufferSubData(h,0,u);else{d.sort((c,g)=>c.start-g.start);let f=0;for(let c=1;c<d.length;c++){let g=d[f],S=d[c];S.start<=g.start+g.count+1?g.count=Math.max(g.count,S.start+S.count-g.start):(++f,d[f]=S)}d.length=f+1;for(let c=0,g=d.length;c<g;c++){let S=d[c];n.bufferSubData(h,S.start*u.BYTES_PER_ELEMENT,u,S.start,S.count)}l.clearUpdateRanges()}l.onUploadCallback()}function r(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function s(o){o.isInterleavedBufferAttribute&&(o=o.data);let l=e.get(o);l&&(n.deleteBuffer(l.buffer),e.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let u=e.get(o);(!u||u.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let h=e.get(o);if(h===void 0)e.set(o,t(o,l));else if(h.version<o.version){if(h.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(h.buffer,o,l),h.version=o.version}}return{get:r,remove:s,update:a}}var Jf=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,jf=`#ifdef USE_ALPHAHASH
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
#endif`,Qf=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,ep=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,tp=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,np=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,ip=`#ifdef USE_AOMAP
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
#endif`,rp=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,sp=`#ifdef USE_BATCHING
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
#endif`,ap=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,op=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,lp=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,cp=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,hp=`#ifdef USE_IRIDESCENCE
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
#endif`,up=`#ifdef USE_BUMPMAP
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
#endif`,dp=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,fp=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,pp=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,mp=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,gp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,_p=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,yp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,xp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,vp=`#define PI 3.141592653589793
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
} // validated`,Sp=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,bp=`vec3 transformedNormal = objectNormal;
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
#endif`,Mp=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Tp=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Ep=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,wp=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Ap="gl_FragColor = linearToOutputTexel( gl_FragColor );",Cp=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Rp=`#ifdef USE_ENVMAP
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
#endif`,Ip=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,Pp=`#ifdef USE_ENVMAP
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
#endif`,Dp=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS

		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Lp=`#ifdef USE_ENVMAP
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
#endif`,Fp=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Np=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Op=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Up=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,kp=`#ifdef USE_GRADIENTMAP
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
}`,Bp=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Hp=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,zp=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Vp=`uniform bool receiveShadow;
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
#include <lightprobes_pars_fragment>`,Gp=`#ifdef USE_ENVMAP
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
#endif`,Wp=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Xp=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,qp=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Yp=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,$p=`PhysicalMaterial material;
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
#endif`,Zp=`uniform sampler2D dfgLUT;
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
}`,Kp=`
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
#endif`,Jp=`#if defined( RE_IndirectDiffuse )
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
#endif`,jp=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Qp=`#ifdef USE_LIGHT_PROBES_GRID
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
#endif`,em=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,tm=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,nm=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,im=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,rm=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,sm=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,am=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,om=`#if defined( USE_POINTS_UV )
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
#endif`,lm=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,cm=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,hm=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,um=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,dm=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,fm=`#ifdef USE_MORPHTARGETS
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
#endif`,pm=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,mm=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,gm=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,_m=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,ym=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,xm=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,vm=`#ifdef USE_NORMALMAP
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
#endif`,Sm=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,bm=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Mm=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Tm=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Em=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,wm=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,Am=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Cm=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Rm=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Im=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Pm=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Dm=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Lm=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Fm=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Nm=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,Om=`float getShadowMask() {
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
}`,Um=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,km=`#ifdef USE_SKINNING
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
#endif`,Bm=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Hm=`#ifdef USE_SKINNING
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
#endif`,zm=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Vm=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Gm=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Wm=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,Xm=`#ifdef USE_TRANSMISSION
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
#endif`,qm=`#ifdef USE_TRANSMISSION
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
#endif`,Ym=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,$m=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Zm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Km=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,Jm=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,jm=`uniform sampler2D t2D;
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
}`,Qm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,eg=`#ifdef ENVMAP_TYPE_CUBE
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
}`,tg=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,ng=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,ig=`#include <common>
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
}`,rg=`#if DEPTH_PACKING == 3200
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
}`,sg=`#define DISTANCE
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
}`,ag=`#define DISTANCE
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
}`,og=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,lg=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,cg=`uniform float scale;
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
}`,hg=`uniform vec3 diffuse;
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
}`,ug=`#include <common>
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
}`,dg=`uniform vec3 diffuse;
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
}`,fg=`#define LAMBERT
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
}`,pg=`#define LAMBERT
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
}`,mg=`#define MATCAP
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
}`,gg=`#define MATCAP
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
}`,_g=`#define NORMAL
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
}`,yg=`#define NORMAL
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
}`,xg=`#define PHONG
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
}`,vg=`#define PHONG
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
}`,Sg=`#define STANDARD
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
}`,bg=`#define STANDARD
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
}`,Mg=`#define TOON
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
}`,Tg=`#define TOON
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
}`,Eg=`uniform float size;
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
}`,wg=`uniform vec3 diffuse;
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
}`,Ag=`#include <common>
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
}`,Cg=`uniform vec3 color;
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
}`,Rg=`uniform float rotation;
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
}`,Ig=`uniform vec3 diffuse;
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
}`,He={alphahash_fragment:Jf,alphahash_pars_fragment:jf,alphamap_fragment:Qf,alphamap_pars_fragment:ep,alphatest_fragment:tp,alphatest_pars_fragment:np,aomap_fragment:ip,aomap_pars_fragment:rp,batching_pars_vertex:sp,batching_vertex:ap,begin_vertex:op,beginnormal_vertex:lp,bsdfs:cp,iridescence_fragment:hp,bumpmap_pars_fragment:up,clipping_planes_fragment:dp,clipping_planes_pars_fragment:fp,clipping_planes_pars_vertex:pp,clipping_planes_vertex:mp,color_fragment:gp,color_pars_fragment:_p,color_pars_vertex:yp,color_vertex:xp,common:vp,cube_uv_reflection_fragment:Sp,defaultnormal_vertex:bp,displacementmap_pars_vertex:Mp,displacementmap_vertex:Tp,emissivemap_fragment:Ep,emissivemap_pars_fragment:wp,colorspace_fragment:Ap,colorspace_pars_fragment:Cp,envmap_fragment:Rp,envmap_common_pars_fragment:Ip,envmap_pars_fragment:Pp,envmap_pars_vertex:Dp,envmap_physical_pars_fragment:Gp,envmap_vertex:Lp,fog_vertex:Fp,fog_pars_vertex:Np,fog_fragment:Op,fog_pars_fragment:Up,gradientmap_pars_fragment:kp,lightmap_pars_fragment:Bp,lights_lambert_fragment:Hp,lights_lambert_pars_fragment:zp,lights_pars_begin:Vp,lights_toon_fragment:Wp,lights_toon_pars_fragment:Xp,lights_phong_fragment:qp,lights_phong_pars_fragment:Yp,lights_physical_fragment:$p,lights_physical_pars_fragment:Zp,lights_fragment_begin:Kp,lights_fragment_maps:Jp,lights_fragment_end:jp,lightprobes_pars_fragment:Qp,logdepthbuf_fragment:em,logdepthbuf_pars_fragment:tm,logdepthbuf_pars_vertex:nm,logdepthbuf_vertex:im,map_fragment:rm,map_pars_fragment:sm,map_particle_fragment:am,map_particle_pars_fragment:om,metalnessmap_fragment:lm,metalnessmap_pars_fragment:cm,morphinstance_vertex:hm,morphcolor_vertex:um,morphnormal_vertex:dm,morphtarget_pars_vertex:fm,morphtarget_vertex:pm,normal_fragment_begin:mm,normal_fragment_maps:gm,normal_pars_fragment:_m,normal_pars_vertex:ym,normal_vertex:xm,normalmap_pars_fragment:vm,clearcoat_normal_fragment_begin:Sm,clearcoat_normal_fragment_maps:bm,clearcoat_pars_fragment:Mm,iridescence_pars_fragment:Tm,opaque_fragment:Em,packing:wm,premultiplied_alpha_fragment:Am,project_vertex:Cm,dithering_fragment:Rm,dithering_pars_fragment:Im,roughnessmap_fragment:Pm,roughnessmap_pars_fragment:Dm,shadowmap_pars_fragment:Lm,shadowmap_pars_vertex:Fm,shadowmap_vertex:Nm,shadowmask_pars_fragment:Om,skinbase_vertex:Um,skinning_pars_vertex:km,skinning_vertex:Bm,skinnormal_vertex:Hm,specularmap_fragment:zm,specularmap_pars_fragment:Vm,tonemapping_fragment:Gm,tonemapping_pars_fragment:Wm,transmission_fragment:Xm,transmission_pars_fragment:qm,uv_pars_fragment:Ym,uv_pars_vertex:$m,uv_vertex:Zm,worldpos_vertex:Km,background_vert:Jm,background_frag:jm,backgroundCube_vert:Qm,backgroundCube_frag:eg,cube_vert:tg,cube_frag:ng,depth_vert:ig,depth_frag:rg,distance_vert:sg,distance_frag:ag,equirect_vert:og,equirect_frag:lg,linedashed_vert:cg,linedashed_frag:hg,meshbasic_vert:ug,meshbasic_frag:dg,meshlambert_vert:fg,meshlambert_frag:pg,meshmatcap_vert:mg,meshmatcap_frag:gg,meshnormal_vert:_g,meshnormal_frag:yg,meshphong_vert:xg,meshphong_frag:vg,meshphysical_vert:Sg,meshphysical_frag:bg,meshtoon_vert:Mg,meshtoon_frag:Tg,points_vert:Eg,points_frag:wg,shadow_vert:Ag,shadow_frag:Cg,sprite_vert:Rg,sprite_frag:Ig},ce={common:{diffuse:{value:new Ke(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Fe},alphaMap:{value:null},alphaMapTransform:{value:new Fe},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Fe}},envmap:{envMap:{value:null},envMapRotation:{value:new Fe},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Fe}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Fe}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Fe},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Fe},normalScale:{value:new xe(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Fe},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Fe}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Fe}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Fe}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ke(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new R},probesMax:{value:new R},probesResolution:{value:new R}},points:{diffuse:{value:new Ke(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Fe},alphaTest:{value:0},uvTransform:{value:new Fe}},sprite:{diffuse:{value:new Ke(16777215)},opacity:{value:1},center:{value:new xe(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Fe},alphaMap:{value:null},alphaMapTransform:{value:new Fe},alphaTest:{value:0}}},Fn={basic:{uniforms:Ht([ce.common,ce.specularmap,ce.envmap,ce.aomap,ce.lightmap,ce.fog]),vertexShader:He.meshbasic_vert,fragmentShader:He.meshbasic_frag},lambert:{uniforms:Ht([ce.common,ce.specularmap,ce.envmap,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.fog,ce.lights,{emissive:{value:new Ke(0)},envMapIntensity:{value:1}}]),vertexShader:He.meshlambert_vert,fragmentShader:He.meshlambert_frag},phong:{uniforms:Ht([ce.common,ce.specularmap,ce.envmap,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.fog,ce.lights,{emissive:{value:new Ke(0)},specular:{value:new Ke(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:He.meshphong_vert,fragmentShader:He.meshphong_frag},standard:{uniforms:Ht([ce.common,ce.envmap,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.roughnessmap,ce.metalnessmap,ce.fog,ce.lights,{emissive:{value:new Ke(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:He.meshphysical_vert,fragmentShader:He.meshphysical_frag},toon:{uniforms:Ht([ce.common,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.gradientmap,ce.fog,ce.lights,{emissive:{value:new Ke(0)}}]),vertexShader:He.meshtoon_vert,fragmentShader:He.meshtoon_frag},matcap:{uniforms:Ht([ce.common,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.fog,{matcap:{value:null}}]),vertexShader:He.meshmatcap_vert,fragmentShader:He.meshmatcap_frag},points:{uniforms:Ht([ce.points,ce.fog]),vertexShader:He.points_vert,fragmentShader:He.points_frag},dashed:{uniforms:Ht([ce.common,ce.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:He.linedashed_vert,fragmentShader:He.linedashed_frag},depth:{uniforms:Ht([ce.common,ce.displacementmap]),vertexShader:He.depth_vert,fragmentShader:He.depth_frag},normal:{uniforms:Ht([ce.common,ce.bumpmap,ce.normalmap,ce.displacementmap,{opacity:{value:1}}]),vertexShader:He.meshnormal_vert,fragmentShader:He.meshnormal_frag},sprite:{uniforms:Ht([ce.sprite,ce.fog]),vertexShader:He.sprite_vert,fragmentShader:He.sprite_frag},background:{uniforms:{uvTransform:{value:new Fe},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:He.background_vert,fragmentShader:He.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Fe}},vertexShader:He.backgroundCube_vert,fragmentShader:He.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:He.cube_vert,fragmentShader:He.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:He.equirect_vert,fragmentShader:He.equirect_frag},distance:{uniforms:Ht([ce.common,ce.displacementmap,{referencePosition:{value:new R},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:He.distance_vert,fragmentShader:He.distance_frag},shadow:{uniforms:Ht([ce.lights,ce.fog,{color:{value:new Ke(0)},opacity:{value:1}}]),vertexShader:He.shadow_vert,fragmentShader:He.shadow_frag}};Fn.physical={uniforms:Ht([Fn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Fe},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Fe},clearcoatNormalScale:{value:new xe(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Fe},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Fe},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Fe},sheen:{value:0},sheenColor:{value:new Ke(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Fe},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Fe},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Fe},transmissionSamplerSize:{value:new xe},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Fe},attenuationDistance:{value:0},attenuationColor:{value:new Ke(0)},specularColor:{value:new Ke(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Fe},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Fe},anisotropyVector:{value:new xe},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Fe}}]),vertexShader:He.meshphysical_vert,fragmentShader:He.meshphysical_frag};var Vo={r:0,b:0,g:0},Pg=new ft,td=new Fe;td.set(-1,0,0,0,1,0,0,0,1);function Dg(n,e,t,i,r,s){let a=new Ke(0),o=r===!0?0:1,l,h,u=null,d=0,f=null;function c(M){let _=M.isScene===!0?M.background:null;if(_&&_.isTexture){let x=M.backgroundBlurriness>0;_=e.get(_,x)}return _}function g(M){let _=!1,x=c(M);x===null?m(a,o):x&&x.isColor&&(m(x,1),_=!0);let w=n.xr.getEnvironmentBlendMode();w==="additive"?t.buffers.color.setClear(0,0,0,1,s):w==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,s),(n.autoClear||_)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function S(M,_){let x=c(_);x&&(x.isCubeTexture||x.mapping===ms)?(h===void 0&&(h=new dt(new yr(1,1,1),new tn({name:"BackgroundCubeMaterial",uniforms:ki(Fn.backgroundCube.uniforms),vertexShader:Fn.backgroundCube.vertexShader,fragmentShader:Fn.backgroundCube.fragmentShader,side:Vt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(w,E,C){this.matrixWorld.copyPosition(C.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(h)),h.material.uniforms.envMap.value=x,h.material.uniforms.backgroundBlurriness.value=_.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=_.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(Pg.makeRotationFromEuler(_.backgroundRotation)).transpose(),x.isCubeTexture&&x.isRenderTargetTexture===!1&&h.material.uniforms.backgroundRotation.value.premultiply(td),h.material.toneMapped=Ye.getTransfer(x.colorSpace)!==Qe,(u!==x||d!==x.version||f!==n.toneMapping)&&(h.material.needsUpdate=!0,u=x,d=x.version,f=n.toneMapping),h.layers.enableAll(),M.unshift(h,h.geometry,h.material,0,0,null)):x&&x.isTexture&&(l===void 0&&(l=new dt(new en(2,2),new tn({name:"BackgroundMaterial",uniforms:ki(Fn.background.uniforms),vertexShader:Fn.background.vertexShader,fragmentShader:Fn.background.fragmentShader,side:Xn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(l)),l.material.uniforms.t2D.value=x,l.material.uniforms.backgroundIntensity.value=_.backgroundIntensity,l.material.toneMapped=Ye.getTransfer(x.colorSpace)!==Qe,x.matrixAutoUpdate===!0&&x.updateMatrix(),l.material.uniforms.uvTransform.value.copy(x.matrix),(u!==x||d!==x.version||f!==n.toneMapping)&&(l.material.needsUpdate=!0,u=x,d=x.version,f=n.toneMapping),l.layers.enableAll(),M.unshift(l,l.geometry,l.material,0,0,null))}function m(M,_){M.getRGB(Vo,pc(n)),t.buffers.color.setClear(Vo.r,Vo.g,Vo.b,_,s)}function p(){h!==void 0&&(h.geometry.dispose(),h.material.dispose(),h=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(M,_=1){a.set(M),o=_,m(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(M){o=M,m(a,o)},render:g,addToRenderList:S,dispose:p}}function Lg(n,e){let t=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},r=f(null),s=r,a=!1;function o(I,O,G,W,N){let H=!1,V=d(I,W,G,O);s!==V&&(s=V,h(s.object)),H=c(I,W,G,N),H&&g(I,W,G,N),N!==null&&e.update(N,n.ELEMENT_ARRAY_BUFFER),(H||a)&&(a=!1,x(I,O,G,W),N!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(N).buffer))}function l(){return n.createVertexArray()}function h(I){return n.bindVertexArray(I)}function u(I){return n.deleteVertexArray(I)}function d(I,O,G,W){let N=W.wireframe===!0,H=i[O.id];H===void 0&&(H={},i[O.id]=H);let V=I.isInstancedMesh===!0?I.id:0,j=H[V];j===void 0&&(j={},H[V]=j);let Q=j[G.id];Q===void 0&&(Q={},j[G.id]=Q);let he=Q[N];return he===void 0&&(he=f(l()),Q[N]=he),he}function f(I){let O=[],G=[],W=[];for(let N=0;N<t;N++)O[N]=0,G[N]=0,W[N]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:O,enabledAttributes:G,attributeDivisors:W,object:I,attributes:{},index:null}}function c(I,O,G,W){let N=s.attributes,H=O.attributes,V=0,j=G.getAttributes();for(let Q in j)if(j[Q].location>=0){let be=N[Q],we=H[Q];if(we===void 0&&(Q==="instanceMatrix"&&I.instanceMatrix&&(we=I.instanceMatrix),Q==="instanceColor"&&I.instanceColor&&(we=I.instanceColor)),be===void 0||be.attribute!==we||we&&be.data!==we.data)return!0;V++}return s.attributesNum!==V||s.index!==W}function g(I,O,G,W){let N={},H=O.attributes,V=0,j=G.getAttributes();for(let Q in j)if(j[Q].location>=0){let be=H[Q];be===void 0&&(Q==="instanceMatrix"&&I.instanceMatrix&&(be=I.instanceMatrix),Q==="instanceColor"&&I.instanceColor&&(be=I.instanceColor));let we={};we.attribute=be,be&&be.data&&(we.data=be.data),N[Q]=we,V++}s.attributes=N,s.attributesNum=V,s.index=W}function S(){let I=s.newAttributes;for(let O=0,G=I.length;O<G;O++)I[O]=0}function m(I){p(I,0)}function p(I,O){let G=s.newAttributes,W=s.enabledAttributes,N=s.attributeDivisors;G[I]=1,W[I]===0&&(n.enableVertexAttribArray(I),W[I]=1),N[I]!==O&&(n.vertexAttribDivisor(I,O),N[I]=O)}function M(){let I=s.newAttributes,O=s.enabledAttributes;for(let G=0,W=O.length;G<W;G++)O[G]!==I[G]&&(n.disableVertexAttribArray(G),O[G]=0)}function _(I,O,G,W,N,H,V){V===!0?n.vertexAttribIPointer(I,O,G,N,H):n.vertexAttribPointer(I,O,G,W,N,H)}function x(I,O,G,W){S();let N=W.attributes,H=G.getAttributes(),V=O.defaultAttributeValues;for(let j in H){let Q=H[j];if(Q.location>=0){let he=N[j];if(he===void 0&&(j==="instanceMatrix"&&I.instanceMatrix&&(he=I.instanceMatrix),j==="instanceColor"&&I.instanceColor&&(he=I.instanceColor)),he!==void 0){let be=he.normalized,we=he.itemSize,$e=e.get(he);if($e===void 0)continue;let et=$e.buffer,ke=$e.type,Z=$e.bytesPerElement,pe=ke===n.INT||ke===n.UNSIGNED_INT||he.gpuType===io;if(he.isInterleavedBufferAttribute){let ie=he.data,Ie=ie.stride,Ne=he.offset;if(ie.isInstancedInterleavedBuffer){for(let Pe=0;Pe<Q.locationSize;Pe++)p(Q.location+Pe,ie.meshPerAttribute);I.isInstancedMesh!==!0&&W._maxInstanceCount===void 0&&(W._maxInstanceCount=ie.meshPerAttribute*ie.count)}else for(let Pe=0;Pe<Q.locationSize;Pe++)m(Q.location+Pe);n.bindBuffer(n.ARRAY_BUFFER,et);for(let Pe=0;Pe<Q.locationSize;Pe++)_(Q.location+Pe,we/Q.locationSize,ke,be,Ie*Z,(Ne+we/Q.locationSize*Pe)*Z,pe)}else{if(he.isInstancedBufferAttribute){for(let ie=0;ie<Q.locationSize;ie++)p(Q.location+ie,he.meshPerAttribute);I.isInstancedMesh!==!0&&W._maxInstanceCount===void 0&&(W._maxInstanceCount=he.meshPerAttribute*he.count)}else for(let ie=0;ie<Q.locationSize;ie++)m(Q.location+ie);n.bindBuffer(n.ARRAY_BUFFER,et);for(let ie=0;ie<Q.locationSize;ie++)_(Q.location+ie,we/Q.locationSize,ke,be,we*Z,we/Q.locationSize*ie*Z,pe)}}else if(V!==void 0){let be=V[j];if(be!==void 0)switch(be.length){case 2:n.vertexAttrib2fv(Q.location,be);break;case 3:n.vertexAttrib3fv(Q.location,be);break;case 4:n.vertexAttrib4fv(Q.location,be);break;default:n.vertexAttrib1fv(Q.location,be)}}}}M()}function w(){A();for(let I in i){let O=i[I];for(let G in O){let W=O[G];for(let N in W){let H=W[N];for(let V in H)u(H[V].object),delete H[V];delete W[N]}}delete i[I]}}function E(I){if(i[I.id]===void 0)return;let O=i[I.id];for(let G in O){let W=O[G];for(let N in W){let H=W[N];for(let V in H)u(H[V].object),delete H[V];delete W[N]}}delete i[I.id]}function C(I){for(let O in i){let G=i[O];for(let W in G){let N=G[W];if(N[I.id]===void 0)continue;let H=N[I.id];for(let V in H)u(H[V].object),delete H[V];delete N[I.id]}}}function v(I){for(let O in i){let G=i[O],W=I.isInstancedMesh===!0?I.id:0,N=G[W];if(N!==void 0){for(let H in N){let V=N[H];for(let j in V)u(V[j].object),delete V[j];delete N[H]}delete G[W],Object.keys(G).length===0&&delete i[O]}}}function A(){L(),a=!0,s!==r&&(s=r,h(s.object))}function L(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:o,reset:A,resetDefaultState:L,dispose:w,releaseStatesOfGeometry:E,releaseStatesOfObject:v,releaseStatesOfProgram:C,initAttributes:S,enableAttribute:m,disableUnusedAttributes:M}}function Fg(n,e,t){let i;function r(l){i=l}function s(l,h){n.drawArrays(i,l,h),t.update(h,i,1)}function a(l,h,u){u!==0&&(n.drawArraysInstanced(i,l,h,u),t.update(h,i,u))}function o(l,h,u){if(u===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,l,0,h,0,u);let f=0;for(let c=0;c<u;c++)f+=h[c];t.update(f,i,1)}this.setMode=r,this.render=s,this.renderInstances=a,this.renderMultiDraw=o}function Ng(n,e,t,i){let r;function s(){if(r!==void 0)return r;if(e.has("EXT_texture_filter_anisotropic")===!0){let C=e.get("EXT_texture_filter_anisotropic");r=n.getParameter(C.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function a(C){return!(C!==cn&&i.convert(C)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(C){let v=C===Dn&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(C!==rn&&i.convert(C)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE)&&C!==xn&&!v)}function l(C){if(C==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";C="mediump"}return C==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let h=t.precision!==void 0?t.precision:"highp",u=l(h);u!==h&&(Ce("WebGLRenderer:",h,"not supported, using",u,"instead."),h=u);let d=t.logarithmicDepthBuffer===!0,f=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control");t.reversedDepthBuffer===!0&&f===!1&&Ce("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let c=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),g=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),S=n.getParameter(n.MAX_TEXTURE_SIZE),m=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),p=n.getParameter(n.MAX_VERTEX_ATTRIBS),M=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),_=n.getParameter(n.MAX_VARYING_VECTORS),x=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),w=n.getParameter(n.MAX_SAMPLES),E=n.getParameter(n.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:h,logarithmicDepthBuffer:d,reversedDepthBuffer:f,maxTextures:c,maxVertexTextures:g,maxTextureSize:S,maxCubemapSize:m,maxAttributes:p,maxVertexUniforms:M,maxVaryings:_,maxFragmentUniforms:x,maxSamples:w,samples:E}}function Og(n){let e=this,t=null,i=0,r=!1,s=!1,a=new En,o=new Fe,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(d,f){let c=d.length!==0||f||i!==0||r;return r=f,i=d.length,c},this.beginShadows=function(){s=!0,u(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(d,f){t=u(d,f,0)},this.setState=function(d,f,c){let g=d.clippingPlanes,S=d.clipIntersection,m=d.clipShadows,p=n.get(d);if(!r||g===null||g.length===0||s&&!m)s?u(null):h();else{let M=s?0:i,_=M*4,x=p.clippingState||null;l.value=x,x=u(g,f,_,c);for(let w=0;w!==_;++w)x[w]=t[w];p.clippingState=x,this.numIntersection=S?this.numPlanes:0,this.numPlanes+=M}};function h(){l.value!==t&&(l.value=t,l.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function u(d,f,c,g){let S=d!==null?d.length:0,m=null;if(S!==0){if(m=l.value,g!==!0||m===null){let p=c+S*4,M=f.matrixWorldInverse;o.getNormalMatrix(M),(m===null||m.length<p)&&(m=new Float32Array(p));for(let _=0,x=c;_!==S;++_,x+=4)a.copy(d[_]).applyMatrix4(M,o),a.normal.toArray(m,x),m[x+3]=a.constant}l.value=m,l.needsUpdate=!0}return e.numPlanes=S,e.numIntersection=0,m}}var vi=4,Du=[.125,.215,.35,.446,.526,.582],Bi=20,Ug=256,Ms=new gi,Lu=new Ke,yc=null,xc=0,vc=0,Sc=!1,kg=new R,Wo=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._sigmas=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,i=.1,r=100,s={}){let{size:a=256,position:o=kg}=s;yc=this._renderer.getRenderTarget(),xc=this._renderer.getActiveCubeFace(),vc=this._renderer.getActiveMipmapLevel(),Sc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);let l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,i,r,l,o),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Ou(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Nu(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(yc,xc,vc),this._renderer.xr.enabled=Sc,e.scissorTest=!1,Cr(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===_i||e.mapping===Ui?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),yc=this._renderer.getRenderTarget(),xc=this._renderer.getActiveCubeFace(),vc=this._renderer.getActiveMipmapLevel(),Sc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:de,minFilter:de,generateMipmaps:!1,type:Dn,format:cn,colorSpace:Wr,depthBuffer:!1},r=Fu(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Fu(e,t,i);let{_lodMax:s}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods,sigmas:this._sigmas}=Bg(s)),this._blurMaterial=zg(s,e,t),this._ggxMaterial=Hg(s,e,t)}return r}_compileMaterial(e){let t=new dt(new st,e);this._renderer.compile(t,Ms)}_sceneToCubeUV(e,t,i,r,s){let l=new Wt(90,1,t,i),h=[1,-1,1,1,1,1],u=[1,1,1,-1,-1,-1],d=this._renderer,f=d.autoClear,c=d.toneMapping;d.getClearColor(Lu),d.toneMapping=gn,d.autoClear=!1,d.state.buffers.depth.getReversed()&&(d.setRenderTarget(r),d.clearDepth(),d.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new dt(new yr,new Ft({name:"PMREM.Background",side:Vt,depthWrite:!1,depthTest:!1})));let S=this._backgroundBox,m=S.material,p=!1,M=e.background;M?M.isColor&&(m.color.copy(M),e.background=null,p=!0):(m.color.copy(Lu),p=!0);for(let _=0;_<6;_++){let x=_%3;x===0?(l.up.set(0,h[_],0),l.position.set(s.x,s.y,s.z),l.lookAt(s.x+u[_],s.y,s.z)):x===1?(l.up.set(0,0,h[_]),l.position.set(s.x,s.y,s.z),l.lookAt(s.x,s.y+u[_],s.z)):(l.up.set(0,h[_],0),l.position.set(s.x,s.y,s.z),l.lookAt(s.x,s.y,s.z+u[_]));let w=this._cubeSize;Cr(r,x*w,_>2?w:0,w,w),d.setRenderTarget(r),p&&d.render(S,l),d.render(e,l)}d.toneMapping=c,d.autoClear=f,e.background=M}_textureToCubeUV(e,t){let i=this._renderer,r=e.mapping===_i||e.mapping===Ui;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=Ou()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Nu());let s=r?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=s;let o=s.uniforms;o.envMap.value=e;let l=this._cubeSize;Cr(t,0,0,3*l,2*l),i.setRenderTarget(t),i.render(a,Ms)}_applyPMREM(e){let t=this._renderer,i=t.autoClear;t.autoClear=!1;let r=this._lodMeshes.length;for(let s=1;s<r;s++)this._applyGGXFilter(e,s-1,s);t.autoClear=i}_applyGGXFilter(e,t,i){let r=this._renderer,s=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[i];o.material=a;let l=a.uniforms,h=i/(this._lodMeshes.length-1),u=t/(this._lodMeshes.length-1),d=Math.sqrt(h*h-u*u),f=0+h*1.25,c=d*f,{_lodMax:g}=this,S=this._sizeLods[i],m=3*S*(i>g-vi?i-g+vi:0),p=4*(this._cubeSize-S);l.envMap.value=e.texture,l.roughness.value=c,l.mipInt.value=g-t,Cr(s,m,p,3*S,2*S),r.setRenderTarget(s),r.render(o,Ms),l.envMap.value=s.texture,l.roughness.value=0,l.mipInt.value=g-i,Cr(e,m,p,3*S,2*S),r.setRenderTarget(e),r.render(o,Ms)}_blur(e,t,i,r,s){let a=this._pingPongRenderTarget;this._halfBlur(e,a,t,i,r,"latitudinal",s),this._halfBlur(a,e,i,i,r,"longitudinal",s)}_halfBlur(e,t,i,r,s,a,o){let l=this._renderer,h=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&Re("blur direction must be either latitudinal or longitudinal!");let u=3,d=this._lodMeshes[r];d.material=h;let f=h.uniforms,c=this._sizeLods[i]-1,g=isFinite(s)?Math.PI/(2*c):2*Math.PI/(2*Bi-1),S=s/g,m=isFinite(s)?1+Math.floor(u*S):Bi;m>Bi&&Ce(`sigmaRadians, ${s}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${Bi}`);let p=[],M=0;for(let C=0;C<Bi;++C){let v=C/S,A=Math.exp(-v*v/2);p.push(A),C===0?M+=A:C<m&&(M+=2*A)}for(let C=0;C<p.length;C++)p[C]=p[C]/M;f.envMap.value=e.texture,f.samples.value=m,f.weights.value=p,f.latitudinal.value=a==="latitudinal",o&&(f.poleAxis.value=o);let{_lodMax:_}=this;f.dTheta.value=g,f.mipInt.value=_-i;let x=this._sizeLods[r],w=3*x*(r>_-vi?r-_+vi:0),E=4*(this._cubeSize-x);Cr(t,w,E,3*x,2*x),l.setRenderTarget(t),l.render(d,Ms)}};function Bg(n){let e=[],t=[],i=[],r=n,s=n-vi+1+Du.length;for(let a=0;a<s;a++){let o=Math.pow(2,r);e.push(o);let l=1/o;a>n-vi?l=Du[a-n+vi-1]:a===0&&(l=0),t.push(l);let h=1/(o-2),u=-h,d=1+h,f=[u,u,d,u,d,d,u,u,d,d,u,d],c=6,g=6,S=3,m=2,p=1,M=new Float32Array(S*g*c),_=new Float32Array(m*g*c),x=new Float32Array(p*g*c);for(let E=0;E<c;E++){let C=E%3*2/3-1,v=E>2?0:-1,A=[C,v,0,C+2/3,v,0,C+2/3,v+1,0,C,v,0,C+2/3,v+1,0,C,v+1,0];M.set(A,S*g*E),_.set(f,m*g*E);let L=[E,E,E,E,E,E];x.set(L,p*g*E)}let w=new st;w.setAttribute("position",new Xt(M,S)),w.setAttribute("uv",new Xt(_,m)),w.setAttribute("faceIndex",new Xt(x,p)),i.push(new dt(w,null)),r>vi&&r--}return{lodMeshes:i,sizeLods:e,sigmas:t}}function Fu(n,e,t){let i=new jt(n,e,t);return i.texture.mapping=ms,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Cr(n,e,t,i,r){n.viewport.set(e,t,i,r),n.scissor.set(e,t,i,r)}function Hg(n,e,t){return new tn({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:Ug,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:qo(),fragmentShader:`

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
		`,blending:Pn,depthTest:!1,depthWrite:!1})}function zg(n,e,t){let i=new Float32Array(Bi),r=new R(0,1,0);return new tn({name:"SphericalGaussianBlur",defines:{n:Bi,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:r}},vertexShader:qo(),fragmentShader:`

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
		`,blending:Pn,depthTest:!1,depthWrite:!1})}function Nu(){return new tn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:qo(),fragmentShader:`

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
		`,blending:Pn,depthTest:!1,depthWrite:!1})}function Ou(){return new tn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:qo(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Pn,depthTest:!1,depthWrite:!1})}function qo(){return`

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
	`}var Xo=class extends jt{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let i={width:e,height:e,depth:1},r=[i,i,i,i,i,i];this.texture=new Qr(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},r=new yr(5,5,5),s=new tn({name:"CubemapFromEquirect",uniforms:ki(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Vt,blending:Pn});s.uniforms.tEquirect.value=t;let a=new dt(r,s),o=t.minFilter;return t.minFilter===_n&&(t.minFilter=de),new ja(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,i=!0,r=!0){let s=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,i,r);e.setRenderTarget(s)}};function Vg(n){let e=new WeakMap,t=new WeakMap,i=null;function r(f,c=!1){return f==null?null:c?a(f):s(f)}function s(f){if(f&&f.isTexture){let c=f.mapping;if(c===eo||c===to)if(e.has(f)){let g=e.get(f).texture;return o(g,f.mapping)}else{let g=f.image;if(g&&g.height>0){let S=new Xo(g.height);return S.fromEquirectangularTexture(n,f),e.set(f,S),f.addEventListener("dispose",h),o(S.texture,f.mapping)}else return null}}return f}function a(f){if(f&&f.isTexture){let c=f.mapping,g=c===eo||c===to,S=c===_i||c===Ui;if(g||S){let m=t.get(f),p=m!==void 0?m.texture.pmremVersion:0;if(f.isRenderTargetTexture&&f.pmremVersion!==p)return i===null&&(i=new Wo(n)),m=g?i.fromEquirectangular(f,m):i.fromCubemap(f,m),m.texture.pmremVersion=f.pmremVersion,t.set(f,m),m.texture;if(m!==void 0)return m.texture;{let M=f.image;return g&&M&&M.height>0||S&&M&&l(M)?(i===null&&(i=new Wo(n)),m=g?i.fromEquirectangular(f):i.fromCubemap(f),m.texture.pmremVersion=f.pmremVersion,t.set(f,m),f.addEventListener("dispose",u),m.texture):null}}}return f}function o(f,c){return c===eo?f.mapping=_i:c===to&&(f.mapping=Ui),f}function l(f){let c=0,g=6;for(let S=0;S<g;S++)f[S]!==void 0&&c++;return c===g}function h(f){let c=f.target;c.removeEventListener("dispose",h);let g=e.get(c);g!==void 0&&(e.delete(c),g.dispose())}function u(f){let c=f.target;c.removeEventListener("dispose",u);let g=t.get(c);g!==void 0&&(t.delete(c),g.dispose())}function d(){e=new WeakMap,t=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:r,dispose:d}}function Gg(n){let e={};function t(i){if(e[i]!==void 0)return e[i];let r=n.getExtension(i);return e[i]=r,r}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){let r=t(i);return r===null&&Ea("WebGLRenderer: "+i+" extension not supported."),r}}}function Wg(n,e,t,i){let r={},s=new WeakMap;function a(d){let f=d.target;f.index!==null&&e.remove(f.index);for(let g in f.attributes)e.remove(f.attributes[g]);f.removeEventListener("dispose",a),delete r[f.id];let c=s.get(f);c&&(e.remove(c),s.delete(f)),i.releaseStatesOfGeometry(f),f.isInstancedBufferGeometry===!0&&delete f._maxInstanceCount,t.memory.geometries--}function o(d,f){return r[f.id]===!0||(f.addEventListener("dispose",a),r[f.id]=!0,t.memory.geometries++),f}function l(d){let f=d.attributes;for(let c in f)e.update(f[c],n.ARRAY_BUFFER)}function h(d){let f=[],c=d.index,g=d.attributes.position,S=0;if(g===void 0)return;if(c!==null){let M=c.array;S=c.version;for(let _=0,x=M.length;_<x;_+=3){let w=M[_+0],E=M[_+1],C=M[_+2];f.push(w,E,E,C,C,w)}}else{let M=g.array;S=g.version;for(let _=0,x=M.length/3-1;_<x;_+=3){let w=_+0,E=_+1,C=_+2;f.push(w,E,E,C,C,w)}}let m=new(g.count>=65535?Kr:Zr)(f,1);m.version=S;let p=s.get(d);p&&e.remove(p),s.set(d,m)}function u(d){let f=s.get(d);if(f){let c=d.index;c!==null&&f.version<c.version&&h(d)}else h(d);return s.get(d)}return{get:o,update:l,getWireframeAttribute:u}}function Xg(n,e,t){let i;function r(d){i=d}let s,a;function o(d){s=d.type,a=d.bytesPerElement}function l(d,f){n.drawElements(i,f,s,d*a),t.update(f,i,1)}function h(d,f,c){c!==0&&(n.drawElementsInstanced(i,f,s,d*a,c),t.update(f,i,c))}function u(d,f,c){if(c===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,f,0,s,d,0,c);let S=0;for(let m=0;m<c;m++)S+=f[m];t.update(S,i,1)}this.setMode=r,this.setIndex=o,this.render=l,this.renderInstances=h,this.renderMultiDraw=u}function qg(n){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(s,a,o){switch(t.calls++,a){case n.TRIANGLES:t.triangles+=o*(s/3);break;case n.LINES:t.lines+=o*(s/2);break;case n.LINE_STRIP:t.lines+=o*(s-1);break;case n.LINE_LOOP:t.lines+=o*s;break;case n.POINTS:t.points+=o*s;break;default:Re("WebGLInfo: Unknown draw mode:",a);break}}function r(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:r,update:i}}function Yg(n,e,t){let i=new WeakMap,r=new bt;function s(a,o,l){let h=a.morphTargetInfluences,u=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,d=u!==void 0?u.length:0,f=i.get(o);if(f===void 0||f.count!==d){let A=function(){C.dispose(),i.delete(o),o.removeEventListener("dispose",A)};f!==void 0&&f.texture.dispose();let c=o.morphAttributes.position!==void 0,g=o.morphAttributes.normal!==void 0,S=o.morphAttributes.color!==void 0,m=o.morphAttributes.position||[],p=o.morphAttributes.normal||[],M=o.morphAttributes.color||[],_=0;c===!0&&(_=1),g===!0&&(_=2),S===!0&&(_=3);let x=o.attributes.position.count*_,w=1;x>e.maxTextureSize&&(w=Math.ceil(x/e.maxTextureSize),x=e.maxTextureSize);let E=new Float32Array(x*w*4*d),C=new $r(E,x,w,d);C.type=xn,C.needsUpdate=!0;let v=_*4;for(let L=0;L<d;L++){let I=m[L],O=p[L],G=M[L],W=x*w*4*L;for(let N=0;N<I.count;N++){let H=N*v;c===!0&&(r.fromBufferAttribute(I,N),E[W+H+0]=r.x,E[W+H+1]=r.y,E[W+H+2]=r.z,E[W+H+3]=0),g===!0&&(r.fromBufferAttribute(O,N),E[W+H+4]=r.x,E[W+H+5]=r.y,E[W+H+6]=r.z,E[W+H+7]=0),S===!0&&(r.fromBufferAttribute(G,N),E[W+H+8]=r.x,E[W+H+9]=r.y,E[W+H+10]=r.z,E[W+H+11]=G.itemSize===4?r.w:1)}}f={count:d,texture:C,size:new xe(x,w)},i.set(o,f),o.addEventListener("dispose",A)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(n,"morphTexture",a.morphTexture,t);else{let c=0;for(let S=0;S<h.length;S++)c+=h[S];let g=o.morphTargetsRelative?1:1-c;l.getUniforms().setValue(n,"morphTargetBaseInfluence",g),l.getUniforms().setValue(n,"morphTargetInfluences",h)}l.getUniforms().setValue(n,"morphTargetsTexture",f.texture,t),l.getUniforms().setValue(n,"morphTargetsTextureSize",f.size)}return{update:s}}function $g(n,e,t,i,r){let s=new WeakMap;function a(h){let u=r.render.frame,d=h.geometry,f=e.get(h,d);if(s.get(f)!==u&&(e.update(f),s.set(f,u)),h.isInstancedMesh&&(h.hasEventListener("dispose",l)===!1&&h.addEventListener("dispose",l),s.get(h)!==u&&(t.update(h.instanceMatrix,n.ARRAY_BUFFER),h.instanceColor!==null&&t.update(h.instanceColor,n.ARRAY_BUFFER),s.set(h,u))),h.isSkinnedMesh){let c=h.skeleton;s.get(c)!==u&&(c.update(),s.set(c,u))}return f}function o(){s=new WeakMap}function l(h){let u=h.target;u.removeEventListener("dispose",l),i.releaseStatesOfObject(u),t.remove(u.instanceMatrix),u.instanceColor!==null&&t.remove(u.instanceColor)}return{update:a,dispose:o}}var Zg={[Kl]:"LINEAR_TONE_MAPPING",[Jl]:"REINHARD_TONE_MAPPING",[jl]:"CINEON_TONE_MAPPING",[Ql]:"ACES_FILMIC_TONE_MAPPING",[tc]:"AGX_TONE_MAPPING",[nc]:"NEUTRAL_TONE_MAPPING",[ec]:"CUSTOM_TONE_MAPPING"};function Kg(n,e,t,i,r){let s=new jt(e,t,{type:n,depthBuffer:i,stencilBuffer:r,depthTexture:i?new Yn(e,t):void 0}),a=new jt(e,t,{type:Dn,depthBuffer:!1,stencilBuffer:!1}),o=new st;o.setAttribute("position",new yt([-1,3,0,-1,-1,0,3,-1,0],3)),o.setAttribute("uv",new yt([0,2,0,0,2,0],2));let l=new Ba({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),h=new dt(o,l),u=new gi(-1,1,1,-1,0,1),d=null,f=null,c=!1,g,S=null,m=[],p=!1;this.setSize=function(M,_){s.setSize(M,_),a.setSize(M,_);for(let x=0;x<m.length;x++){let w=m[x];w.setSize&&w.setSize(M,_)}},this.setEffects=function(M){m=M,p=m.length>0&&m[0].isRenderPass===!0;let _=s.width,x=s.height;for(let w=0;w<m.length;w++){let E=m[w];E.setSize&&E.setSize(_,x)}},this.begin=function(M,_){if(c||M.toneMapping===gn&&m.length===0)return!1;if(S=_,_!==null){let x=_.width,w=_.height;(s.width!==x||s.height!==w)&&this.setSize(x,w)}return p===!1&&M.setRenderTarget(s),g=M.toneMapping,M.toneMapping=gn,!0},this.hasRenderPass=function(){return p},this.end=function(M,_){M.toneMapping=g,c=!0;let x=s,w=a;for(let E=0;E<m.length;E++){let C=m[E];if(C.enabled!==!1&&(C.render(M,w,x,_),C.needsSwap!==!1)){let v=x;x=w,w=v}}if(d!==M.outputColorSpace||f!==M.toneMapping){d=M.outputColorSpace,f=M.toneMapping,l.defines={},Ye.getTransfer(d)===Qe&&(l.defines.SRGB_TRANSFER="");let E=Zg[f];E&&(l.defines[E]=""),l.needsUpdate=!0}l.uniforms.tDiffuse.value=x.texture,M.setRenderTarget(S),M.render(h,u),S=null,c=!1},this.isCompositing=function(){return c},this.dispose=function(){s.depthTexture&&s.depthTexture.dispose(),s.dispose(),a.dispose(),o.dispose(),l.dispose()}}var nd=new Lt,Tc=new Yn(1,1),id=new $r,rd=new Ra,sd=new Qr,Uu=[],ku=[],Bu=new Float32Array(16),Hu=new Float32Array(9),zu=new Float32Array(4);function Ir(n,e,t){let i=n[0];if(i<=0||i>0)return n;let r=e*t,s=Uu[r];if(s===void 0&&(s=new Float32Array(r),Uu[r]=s),e!==0){i.toArray(s,0);for(let a=1,o=0;a!==e;++a)o+=t,n[a].toArray(s,o)}return s}function Rt(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function It(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function Yo(n,e){let t=ku[e];t===void 0&&(t=new Int32Array(e),ku[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function Jg(n,e){let t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function jg(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Rt(t,e))return;n.uniform2fv(this.addr,e),It(t,e)}}function Qg(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Rt(t,e))return;n.uniform3fv(this.addr,e),It(t,e)}}function e0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Rt(t,e))return;n.uniform4fv(this.addr,e),It(t,e)}}function t0(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Rt(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),It(t,e)}else{if(Rt(t,i))return;zu.set(i),n.uniformMatrix2fv(this.addr,!1,zu),It(t,i)}}function n0(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Rt(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),It(t,e)}else{if(Rt(t,i))return;Hu.set(i),n.uniformMatrix3fv(this.addr,!1,Hu),It(t,i)}}function i0(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Rt(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),It(t,e)}else{if(Rt(t,i))return;Bu.set(i),n.uniformMatrix4fv(this.addr,!1,Bu),It(t,i)}}function r0(n,e){let t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function s0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Rt(t,e))return;n.uniform2iv(this.addr,e),It(t,e)}}function a0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Rt(t,e))return;n.uniform3iv(this.addr,e),It(t,e)}}function o0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Rt(t,e))return;n.uniform4iv(this.addr,e),It(t,e)}}function l0(n,e){let t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function c0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Rt(t,e))return;n.uniform2uiv(this.addr,e),It(t,e)}}function h0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Rt(t,e))return;n.uniform3uiv(this.addr,e),It(t,e)}}function u0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Rt(t,e))return;n.uniform4uiv(this.addr,e),It(t,e)}}function d0(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r);let s;this.type===n.SAMPLER_2D_SHADOW?(Tc.compareFunction=t.isReversedDepthBuffer()?zo:Ho,s=Tc):s=nd,t.setTexture2D(e||s,r)}function f0(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture3D(e||rd,r)}function p0(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTextureCube(e||sd,r)}function m0(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture2DArray(e||id,r)}function g0(n){switch(n){case 5126:return Jg;case 35664:return jg;case 35665:return Qg;case 35666:return e0;case 35674:return t0;case 35675:return n0;case 35676:return i0;case 5124:case 35670:return r0;case 35667:case 35671:return s0;case 35668:case 35672:return a0;case 35669:case 35673:return o0;case 5125:return l0;case 36294:return c0;case 36295:return h0;case 36296:return u0;case 35678:case 36198:case 36298:case 36306:case 35682:return d0;case 35679:case 36299:case 36307:return f0;case 35680:case 36300:case 36308:case 36293:return p0;case 36289:case 36303:case 36311:case 36292:return m0}}function _0(n,e){n.uniform1fv(this.addr,e)}function y0(n,e){let t=Ir(e,this.size,2);n.uniform2fv(this.addr,t)}function x0(n,e){let t=Ir(e,this.size,3);n.uniform3fv(this.addr,t)}function v0(n,e){let t=Ir(e,this.size,4);n.uniform4fv(this.addr,t)}function S0(n,e){let t=Ir(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function b0(n,e){let t=Ir(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function M0(n,e){let t=Ir(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function T0(n,e){n.uniform1iv(this.addr,e)}function E0(n,e){n.uniform2iv(this.addr,e)}function w0(n,e){n.uniform3iv(this.addr,e)}function A0(n,e){n.uniform4iv(this.addr,e)}function C0(n,e){n.uniform1uiv(this.addr,e)}function R0(n,e){n.uniform2uiv(this.addr,e)}function I0(n,e){n.uniform3uiv(this.addr,e)}function P0(n,e){n.uniform4uiv(this.addr,e)}function D0(n,e,t){let i=this.cache,r=e.length,s=Yo(t,r);Rt(i,s)||(n.uniform1iv(this.addr,s),It(i,s));let a;this.type===n.SAMPLER_2D_SHADOW?a=Tc:a=nd;for(let o=0;o!==r;++o)t.setTexture2D(e[o]||a,s[o])}function L0(n,e,t){let i=this.cache,r=e.length,s=Yo(t,r);Rt(i,s)||(n.uniform1iv(this.addr,s),It(i,s));for(let a=0;a!==r;++a)t.setTexture3D(e[a]||rd,s[a])}function F0(n,e,t){let i=this.cache,r=e.length,s=Yo(t,r);Rt(i,s)||(n.uniform1iv(this.addr,s),It(i,s));for(let a=0;a!==r;++a)t.setTextureCube(e[a]||sd,s[a])}function N0(n,e,t){let i=this.cache,r=e.length,s=Yo(t,r);Rt(i,s)||(n.uniform1iv(this.addr,s),It(i,s));for(let a=0;a!==r;++a)t.setTexture2DArray(e[a]||id,s[a])}function O0(n){switch(n){case 5126:return _0;case 35664:return y0;case 35665:return x0;case 35666:return v0;case 35674:return S0;case 35675:return b0;case 35676:return M0;case 5124:case 35670:return T0;case 35667:case 35671:return E0;case 35668:case 35672:return w0;case 35669:case 35673:return A0;case 5125:return C0;case 36294:return R0;case 36295:return I0;case 36296:return P0;case 35678:case 36198:case 36298:case 36306:case 35682:return D0;case 35679:case 36299:case 36307:return L0;case 35680:case 36300:case 36308:case 36293:return F0;case 36289:case 36303:case 36311:case 36292:return N0}}var Ec=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=g0(t.type)}},wc=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=O0(t.type)}},Ac=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){let r=this.seq;for(let s=0,a=r.length;s!==a;++s){let o=r[s];o.setValue(e,t[o.id],i)}}},bc=/(\w+)(\])?(\[|\.)?/g;function Vu(n,e){n.seq.push(e),n.map[e.id]=e}function U0(n,e,t){let i=n.name,r=i.length;for(bc.lastIndex=0;;){let s=bc.exec(i),a=bc.lastIndex,o=s[1],l=s[2]==="]",h=s[3];if(l&&(o=o|0),h===void 0||h==="["&&a+2===r){Vu(t,h===void 0?new Ec(o,n,e):new wc(o,n,e));break}else{let d=t.map[o];d===void 0&&(d=new Ac(o),Vu(t,d)),t=d}}}var Rr=class{constructor(e,t){this.seq=[],this.map={};let i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let a=0;a<i;++a){let o=e.getActiveUniform(t,a),l=e.getUniformLocation(t,o.name);U0(o,l,this)}let r=[],s=[];for(let a of this.seq)a.type===e.SAMPLER_2D_SHADOW||a.type===e.SAMPLER_CUBE_SHADOW||a.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(a):s.push(a);r.length>0&&(this.seq=r.concat(s))}setValue(e,t,i,r){let s=this.map[t];s!==void 0&&s.setValue(e,i,r)}setOptional(e,t,i){let r=t[i];r!==void 0&&this.setValue(e,i,r)}static upload(e,t,i,r){for(let s=0,a=t.length;s!==a;++s){let o=t[s],l=i[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,r)}}static seqWithValue(e,t){let i=[];for(let r=0,s=e.length;r!==s;++r){let a=e[r];a.id in t&&i.push(a)}return i}};function Gu(n,e,t){let i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}var k0=37297,B0=0;function H0(n,e){let t=n.split(`
`),i=[],r=Math.max(e-6,0),s=Math.min(e+6,t.length);for(let a=r;a<s;a++){let o=a+1;i.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return i.join(`
`)}var Wu=new Fe;function z0(n){Ye._getMatrix(Wu,Ye.workingColorSpace,n);let e=`mat3( ${Wu.elements.map(t=>t.toFixed(4))} )`;switch(Ye.getTransfer(n)){case Xr:return[e,"LinearTransferOETF"];case Qe:return[e,"sRGBTransferOETF"];default:return Ce("WebGLProgram: Unsupported color space: ",n),[e,"LinearTransferOETF"]}}function Xu(n,e,t){let i=n.getShaderParameter(e,n.COMPILE_STATUS),s=(n.getShaderInfoLog(e)||"").trim();if(i&&s==="")return"";let a=/ERROR: 0:(\d+)/.exec(s);if(a){let o=parseInt(a[1]);return t.toUpperCase()+`

`+s+`

`+H0(n.getShaderSource(e),o)}else return s}function V0(n,e){let t=z0(e);return[`vec4 ${n}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}var G0={[Kl]:"Linear",[Jl]:"Reinhard",[jl]:"Cineon",[Ql]:"ACESFilmic",[tc]:"AgX",[nc]:"Neutral",[ec]:"Custom"};function W0(n,e){let t=G0[e];return t===void 0?(Ce("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+n+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var Go=new R;function X0(){Ye.getLuminanceCoefficients(Go);let n=Go.x.toFixed(4),e=Go.y.toFixed(4),t=Go.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function q0(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Es).join(`
`)}function Y0(n){let e=[];for(let t in n){let i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function $0(n,e){let t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){let s=n.getActiveAttrib(e,r),a=s.name,o=1;s.type===n.FLOAT_MAT2&&(o=2),s.type===n.FLOAT_MAT3&&(o=3),s.type===n.FLOAT_MAT4&&(o=4),t[a]={type:s.type,location:n.getAttribLocation(e,a),locationSize:o}}return t}function Es(n){return n!==""}function qu(n,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Yu(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var Z0=/^[ \t]*#include +<([\w\d./]+)>/gm;function Cc(n){return n.replace(Z0,J0)}var K0=new Map;function J0(n,e){let t=He[e];if(t===void 0){let i=K0.get(e);if(i!==void 0)t=He[i],Ce('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("Can not resolve #include <"+e+">")}return Cc(t)}var j0=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function $u(n){return n.replace(j0,Q0)}function Q0(n,e,t,i){let r="";for(let s=parseInt(e);s<parseInt(t);s++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function Zu(n){let e=`precision ${n.precision} float;
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
#define LOW_PRECISION`),e}var e_={[ps]:"SHADOWMAP_TYPE_PCF",[Er]:"SHADOWMAP_TYPE_VSM"};function t_(n){return e_[n.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var n_={[_i]:"ENVMAP_TYPE_CUBE",[Ui]:"ENVMAP_TYPE_CUBE",[ms]:"ENVMAP_TYPE_CUBE_UV"};function i_(n){return n.envMap===!1?"ENVMAP_TYPE_CUBE":n_[n.envMapMode]||"ENVMAP_TYPE_CUBE"}var r_={[Ui]:"ENVMAP_MODE_REFRACTION"};function s_(n){return n.envMap===!1?"ENVMAP_MODE_REFLECTION":r_[n.envMapMode]||"ENVMAP_MODE_REFLECTION"}var a_={[Zl]:"ENVMAP_BLENDING_MULTIPLY",[cu]:"ENVMAP_BLENDING_MIX",[hu]:"ENVMAP_BLENDING_ADD"};function o_(n){return n.envMap===!1?"ENVMAP_BLENDING_NONE":a_[n.combine]||"ENVMAP_BLENDING_NONE"}function l_(n){let e=n.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:i,maxMip:t}}function c_(n,e,t,i){let r=n.getContext(),s=t.defines,a=t.vertexShader,o=t.fragmentShader,l=t_(t),h=i_(t),u=s_(t),d=o_(t),f=l_(t),c=q0(t),g=Y0(s),S=r.createProgram(),m,p,M=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(Es).join(`
`),m.length>0&&(m+=`
`),p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(Es).join(`
`),p.length>0&&(p+=`
`)):(m=[Zu(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Es).join(`
`),p=[Zu(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.envMap?"#define "+u:"",t.envMap?"#define "+d:"",f?"#define CUBEUV_TEXEL_WIDTH "+f.texelWidth:"",f?"#define CUBEUV_TEXEL_HEIGHT "+f.texelHeight:"",f?"#define CUBEUV_MAX_MIP "+f.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==gn?"#define TONE_MAPPING":"",t.toneMapping!==gn?He.tonemapping_pars_fragment:"",t.toneMapping!==gn?W0("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",He.colorspace_pars_fragment,V0("linearToOutputTexel",t.outputColorSpace),X0(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Es).join(`
`)),a=Cc(a),a=qu(a,t),a=Yu(a,t),o=Cc(o),o=qu(o,t),o=Yu(o,t),a=$u(a),o=$u(o),t.isRawShaderMaterial!==!0&&(M=`#version 300 es
`,m=[c,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,p=["#define varying in",t.glslVersion===dc?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===dc?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);let _=M+m+a,x=M+p+o,w=Gu(r,r.VERTEX_SHADER,_),E=Gu(r,r.FRAGMENT_SHADER,x);r.attachShader(S,w),r.attachShader(S,E),t.index0AttributeName!==void 0?r.bindAttribLocation(S,0,t.index0AttributeName):t.morphTargets===!0&&r.bindAttribLocation(S,0,"position"),r.linkProgram(S);function C(I){if(n.debug.checkShaderErrors){let O=r.getProgramInfoLog(S)||"",G=r.getShaderInfoLog(w)||"",W=r.getShaderInfoLog(E)||"",N=O.trim(),H=G.trim(),V=W.trim(),j=!0,Q=!0;if(r.getProgramParameter(S,r.LINK_STATUS)===!1)if(j=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(r,S,w,E);else{let he=Xu(r,w,"vertex"),be=Xu(r,E,"fragment");Re("THREE.WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(S,r.VALIDATE_STATUS)+`

Material Name: `+I.name+`
Material Type: `+I.type+`

Program Info Log: `+N+`
`+he+`
`+be)}else N!==""?Ce("WebGLProgram: Program Info Log:",N):(H===""||V==="")&&(Q=!1);Q&&(I.diagnostics={runnable:j,programLog:N,vertexShader:{log:H,prefix:m},fragmentShader:{log:V,prefix:p}})}r.deleteShader(w),r.deleteShader(E),v=new Rr(r,S),A=$0(r,S)}let v;this.getUniforms=function(){return v===void 0&&C(this),v};let A;this.getAttributes=function(){return A===void 0&&C(this),A};let L=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return L===!1&&(L=r.getProgramParameter(S,k0)),L},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(S),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=B0++,this.cacheKey=e,this.usedTimes=1,this.program=S,this.vertexShader=w,this.fragmentShader=E,this}var h_=0,Rc=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,i=e.fragmentShader,r=this._getShaderStage(t),s=this._getShaderStage(i),a=this._getShaderCacheForMaterial(e);return a.has(r)===!1&&(a.add(r),r.usedTimes++),a.has(s)===!1&&(a.add(s),s.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){let t=this.shaderCache,i=t.get(e);return i===void 0&&(i=new Ic(e),t.set(e,i)),i}},Ic=class{constructor(e){this.id=h_++,this.code=e,this.usedTimes=0}};function u_(n){return n===xi||n===Ss||n===bs}function d_(n,e,t,i,r,s){let a=new fr,o=new Rc,l=new Set,h=[],u=new Map,d=i.logarithmicDepthBuffer,f=i.precision,c={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function g(v){return l.add(v),v===0?"uv":`uv${v}`}function S(v,A,L,I,O,G){let W=I.fog,N=O.geometry,H=v.isMeshStandardMaterial||v.isMeshLambertMaterial||v.isMeshPhongMaterial?I.environment:null,V=v.isMeshStandardMaterial||v.isMeshLambertMaterial&&!v.envMap||v.isMeshPhongMaterial&&!v.envMap,j=e.get(v.envMap||H,V),Q=j&&j.mapping===ms?j.image.height:null,he=c[v.type];v.precision!==null&&(f=i.getMaxPrecision(v.precision),f!==v.precision&&Ce("WebGLProgram.getParameters:",v.precision,"not supported, using",f,"instead."));let be=N.morphAttributes.position||N.morphAttributes.normal||N.morphAttributes.color,we=be!==void 0?be.length:0,$e=0;N.morphAttributes.position!==void 0&&($e=1),N.morphAttributes.normal!==void 0&&($e=2),N.morphAttributes.color!==void 0&&($e=3);let et,ke,Z,pe;if(he){let Oe=Fn[he];et=Oe.vertexShader,ke=Oe.fragmentShader}else et=v.vertexShader,ke=v.fragmentShader,o.update(v),Z=o.getVertexShaderID(v),pe=o.getFragmentShaderID(v);let ie=n.getRenderTarget(),Ie=n.state.buffers.depth.getReversed(),Ne=O.isInstancedMesh===!0,Pe=O.isBatchedMesh===!0,mt=!!v.map,Xe=!!v.matcap,tt=!!j,ht=!!v.aoMap,Ve=!!v.lightMap,At=!!v.bumpMap,gt=!!v.normalMap,Yt=!!v.displacementMap,D=!!v.emissiveMap,Ct=!!v.metalnessMap,qe=!!v.roughnessMap,lt=v.anisotropy>0,le=v.clearcoat>0,vt=v.dispersion>0,T=v.iridescence>0,y=v.sheen>0,U=v.transmission>0,Y=lt&&!!v.anisotropyMap,J=le&&!!v.clearcoatMap,ee=le&&!!v.clearcoatNormalMap,ae=le&&!!v.clearcoatRoughnessMap,X=T&&!!v.iridescenceMap,$=T&&!!v.iridescenceThicknessMap,me=y&&!!v.sheenColorMap,ve=y&&!!v.sheenRoughnessMap,re=!!v.specularMap,te=!!v.specularColorMap,De=!!v.specularIntensityMap,Be=U&&!!v.transmissionMap,Je=U&&!!v.thicknessMap,P=!!v.gradientMap,ne=!!v.alphaMap,q=v.alphaTest>0,_e=!!v.alphaHash,se=!!v.extensions,K=gn;v.toneMapped&&(ie===null||ie.isXRRenderTarget===!0)&&(K=n.toneMapping);let Te={shaderID:he,shaderType:v.type,shaderName:v.name,vertexShader:et,fragmentShader:ke,defines:v.defines,customVertexShaderID:Z,customFragmentShaderID:pe,isRawShaderMaterial:v.isRawShaderMaterial===!0,glslVersion:v.glslVersion,precision:f,batching:Pe,batchingColor:Pe&&O._colorsTexture!==null,instancing:Ne,instancingColor:Ne&&O.instanceColor!==null,instancingMorph:Ne&&O.morphTexture!==null,outputColorSpace:ie===null?n.outputColorSpace:ie.isXRRenderTarget===!0?ie.texture.colorSpace:Ye.workingColorSpace,alphaToCoverage:!!v.alphaToCoverage,map:mt,matcap:Xe,envMap:tt,envMapMode:tt&&j.mapping,envMapCubeUVHeight:Q,aoMap:ht,lightMap:Ve,bumpMap:At,normalMap:gt,displacementMap:Yt,emissiveMap:D,normalMapObjectSpace:gt&&v.normalMapType===fu,normalMapTangentSpace:gt&&v.normalMapType===uc,packedNormalMap:gt&&v.normalMapType===uc&&u_(v.normalMap.format),metalnessMap:Ct,roughnessMap:qe,anisotropy:lt,anisotropyMap:Y,clearcoat:le,clearcoatMap:J,clearcoatNormalMap:ee,clearcoatRoughnessMap:ae,dispersion:vt,iridescence:T,iridescenceMap:X,iridescenceThicknessMap:$,sheen:y,sheenColorMap:me,sheenRoughnessMap:ve,specularMap:re,specularColorMap:te,specularIntensityMap:De,transmission:U,transmissionMap:Be,thicknessMap:Je,gradientMap:P,opaque:v.transparent===!1&&v.blending===Di&&v.alphaToCoverage===!1,alphaMap:ne,alphaTest:q,alphaHash:_e,combine:v.combine,mapUv:mt&&g(v.map.channel),aoMapUv:ht&&g(v.aoMap.channel),lightMapUv:Ve&&g(v.lightMap.channel),bumpMapUv:At&&g(v.bumpMap.channel),normalMapUv:gt&&g(v.normalMap.channel),displacementMapUv:Yt&&g(v.displacementMap.channel),emissiveMapUv:D&&g(v.emissiveMap.channel),metalnessMapUv:Ct&&g(v.metalnessMap.channel),roughnessMapUv:qe&&g(v.roughnessMap.channel),anisotropyMapUv:Y&&g(v.anisotropyMap.channel),clearcoatMapUv:J&&g(v.clearcoatMap.channel),clearcoatNormalMapUv:ee&&g(v.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ae&&g(v.clearcoatRoughnessMap.channel),iridescenceMapUv:X&&g(v.iridescenceMap.channel),iridescenceThicknessMapUv:$&&g(v.iridescenceThicknessMap.channel),sheenColorMapUv:me&&g(v.sheenColorMap.channel),sheenRoughnessMapUv:ve&&g(v.sheenRoughnessMap.channel),specularMapUv:re&&g(v.specularMap.channel),specularColorMapUv:te&&g(v.specularColorMap.channel),specularIntensityMapUv:De&&g(v.specularIntensityMap.channel),transmissionMapUv:Be&&g(v.transmissionMap.channel),thicknessMapUv:Je&&g(v.thicknessMap.channel),alphaMapUv:ne&&g(v.alphaMap.channel),vertexTangents:!!N.attributes.tangent&&(gt||lt),vertexNormals:!!N.attributes.normal,vertexColors:v.vertexColors,vertexAlphas:v.vertexColors===!0&&!!N.attributes.color&&N.attributes.color.itemSize===4,pointsUvs:O.isPoints===!0&&!!N.attributes.uv&&(mt||ne),fog:!!W,useFog:v.fog===!0,fogExp2:!!W&&W.isFogExp2,flatShading:v.wireframe===!1&&(v.flatShading===!0||N.attributes.normal===void 0&&gt===!1&&(v.isMeshLambertMaterial||v.isMeshPhongMaterial||v.isMeshStandardMaterial||v.isMeshPhysicalMaterial)),sizeAttenuation:v.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:Ie,skinning:O.isSkinnedMesh===!0,morphTargets:N.morphAttributes.position!==void 0,morphNormals:N.morphAttributes.normal!==void 0,morphColors:N.morphAttributes.color!==void 0,morphTargetsCount:we,morphTextureStride:$e,numDirLights:A.directional.length,numPointLights:A.point.length,numSpotLights:A.spot.length,numSpotLightMaps:A.spotLightMap.length,numRectAreaLights:A.rectArea.length,numHemiLights:A.hemi.length,numDirLightShadows:A.directionalShadowMap.length,numPointLightShadows:A.pointShadowMap.length,numSpotLightShadows:A.spotShadowMap.length,numSpotLightShadowsWithMaps:A.numSpotLightShadowsWithMaps,numLightProbes:A.numLightProbes,numLightProbeGrids:G.length,numClippingPlanes:s.numPlanes,numClipIntersection:s.numIntersection,dithering:v.dithering,shadowMapEnabled:n.shadowMap.enabled&&L.length>0,shadowMapType:n.shadowMap.type,toneMapping:K,decodeVideoTexture:mt&&v.map.isVideoTexture===!0&&Ye.getTransfer(v.map.colorSpace)===Qe,decodeVideoTextureEmissive:D&&v.emissiveMap.isVideoTexture===!0&&Ye.getTransfer(v.emissiveMap.colorSpace)===Qe,premultipliedAlpha:v.premultipliedAlpha,doubleSided:v.side===Bt,flipSided:v.side===Vt,useDepthPacking:v.depthPacking>=0,depthPacking:v.depthPacking||0,index0AttributeName:v.index0AttributeName,extensionClipCullDistance:se&&v.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(se&&v.extensions.multiDraw===!0||Pe)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:v.customProgramCacheKey()};return Te.vertexUv1s=l.has(1),Te.vertexUv2s=l.has(2),Te.vertexUv3s=l.has(3),l.clear(),Te}function m(v){let A=[];if(v.shaderID?A.push(v.shaderID):(A.push(v.customVertexShaderID),A.push(v.customFragmentShaderID)),v.defines!==void 0)for(let L in v.defines)A.push(L),A.push(v.defines[L]);return v.isRawShaderMaterial===!1&&(p(A,v),M(A,v),A.push(n.outputColorSpace)),A.push(v.customProgramCacheKey),A.join()}function p(v,A){v.push(A.precision),v.push(A.outputColorSpace),v.push(A.envMapMode),v.push(A.envMapCubeUVHeight),v.push(A.mapUv),v.push(A.alphaMapUv),v.push(A.lightMapUv),v.push(A.aoMapUv),v.push(A.bumpMapUv),v.push(A.normalMapUv),v.push(A.displacementMapUv),v.push(A.emissiveMapUv),v.push(A.metalnessMapUv),v.push(A.roughnessMapUv),v.push(A.anisotropyMapUv),v.push(A.clearcoatMapUv),v.push(A.clearcoatNormalMapUv),v.push(A.clearcoatRoughnessMapUv),v.push(A.iridescenceMapUv),v.push(A.iridescenceThicknessMapUv),v.push(A.sheenColorMapUv),v.push(A.sheenRoughnessMapUv),v.push(A.specularMapUv),v.push(A.specularColorMapUv),v.push(A.specularIntensityMapUv),v.push(A.transmissionMapUv),v.push(A.thicknessMapUv),v.push(A.combine),v.push(A.fogExp2),v.push(A.sizeAttenuation),v.push(A.morphTargetsCount),v.push(A.morphAttributeCount),v.push(A.numDirLights),v.push(A.numPointLights),v.push(A.numSpotLights),v.push(A.numSpotLightMaps),v.push(A.numHemiLights),v.push(A.numRectAreaLights),v.push(A.numDirLightShadows),v.push(A.numPointLightShadows),v.push(A.numSpotLightShadows),v.push(A.numSpotLightShadowsWithMaps),v.push(A.numLightProbes),v.push(A.shadowMapType),v.push(A.toneMapping),v.push(A.numClippingPlanes),v.push(A.numClipIntersection),v.push(A.depthPacking)}function M(v,A){a.disableAll(),A.instancing&&a.enable(0),A.instancingColor&&a.enable(1),A.instancingMorph&&a.enable(2),A.matcap&&a.enable(3),A.envMap&&a.enable(4),A.normalMapObjectSpace&&a.enable(5),A.normalMapTangentSpace&&a.enable(6),A.clearcoat&&a.enable(7),A.iridescence&&a.enable(8),A.alphaTest&&a.enable(9),A.vertexColors&&a.enable(10),A.vertexAlphas&&a.enable(11),A.vertexUv1s&&a.enable(12),A.vertexUv2s&&a.enable(13),A.vertexUv3s&&a.enable(14),A.vertexTangents&&a.enable(15),A.anisotropy&&a.enable(16),A.alphaHash&&a.enable(17),A.batching&&a.enable(18),A.dispersion&&a.enable(19),A.batchingColor&&a.enable(20),A.gradientMap&&a.enable(21),A.packedNormalMap&&a.enable(22),A.vertexNormals&&a.enable(23),v.push(a.mask),a.disableAll(),A.fog&&a.enable(0),A.useFog&&a.enable(1),A.flatShading&&a.enable(2),A.logarithmicDepthBuffer&&a.enable(3),A.reversedDepthBuffer&&a.enable(4),A.skinning&&a.enable(5),A.morphTargets&&a.enable(6),A.morphNormals&&a.enable(7),A.morphColors&&a.enable(8),A.premultipliedAlpha&&a.enable(9),A.shadowMapEnabled&&a.enable(10),A.doubleSided&&a.enable(11),A.flipSided&&a.enable(12),A.useDepthPacking&&a.enable(13),A.dithering&&a.enable(14),A.transmission&&a.enable(15),A.sheen&&a.enable(16),A.opaque&&a.enable(17),A.pointsUvs&&a.enable(18),A.decodeVideoTexture&&a.enable(19),A.decodeVideoTextureEmissive&&a.enable(20),A.alphaToCoverage&&a.enable(21),A.numLightProbeGrids>0&&a.enable(22),v.push(a.mask)}function _(v){let A=c[v.type],L;if(A){let I=Fn[A];L=Iu.clone(I.uniforms)}else L=v.uniforms;return L}function x(v,A){let L=u.get(A);return L!==void 0?++L.usedTimes:(L=new c_(n,A,v,r),h.push(L),u.set(A,L)),L}function w(v){if(--v.usedTimes===0){let A=h.indexOf(v);h[A]=h[h.length-1],h.pop(),u.delete(v.cacheKey),v.destroy()}}function E(v){o.remove(v)}function C(){o.dispose()}return{getParameters:S,getProgramCacheKey:m,getUniforms:_,acquireProgram:x,releaseProgram:w,releaseShaderCache:E,programs:h,dispose:C}}function f_(){let n=new WeakMap;function e(a){return n.has(a)}function t(a){let o=n.get(a);return o===void 0&&(o={},n.set(a,o)),o}function i(a){n.delete(a)}function r(a,o,l){n.get(a)[o]=l}function s(){n=new WeakMap}return{has:e,get:t,remove:i,update:r,dispose:s}}function p_(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.materialVariant!==e.materialVariant?n.materialVariant-e.materialVariant:n.z!==e.z?n.z-e.z:n.id-e.id}function Ku(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function Ju(){let n=[],e=0,t=[],i=[],r=[];function s(){e=0,t.length=0,i.length=0,r.length=0}function a(f){let c=0;return f.isInstancedMesh&&(c+=2),f.isSkinnedMesh&&(c+=1),c}function o(f,c,g,S,m,p){let M=n[e];return M===void 0?(M={id:f.id,object:f,geometry:c,material:g,materialVariant:a(f),groupOrder:S,renderOrder:f.renderOrder,z:m,group:p},n[e]=M):(M.id=f.id,M.object=f,M.geometry=c,M.material=g,M.materialVariant=a(f),M.groupOrder=S,M.renderOrder=f.renderOrder,M.z=m,M.group=p),e++,M}function l(f,c,g,S,m,p){let M=o(f,c,g,S,m,p);g.transmission>0?i.push(M):g.transparent===!0?r.push(M):t.push(M)}function h(f,c,g,S,m,p){let M=o(f,c,g,S,m,p);g.transmission>0?i.unshift(M):g.transparent===!0?r.unshift(M):t.unshift(M)}function u(f,c){t.length>1&&t.sort(f||p_),i.length>1&&i.sort(c||Ku),r.length>1&&r.sort(c||Ku)}function d(){for(let f=e,c=n.length;f<c;f++){let g=n[f];if(g.id===null)break;g.id=null,g.object=null,g.geometry=null,g.material=null,g.group=null}}return{opaque:t,transmissive:i,transparent:r,init:s,push:l,unshift:h,finish:d,sort:u}}function m_(){let n=new WeakMap;function e(i,r){let s=n.get(i),a;return s===void 0?(a=new Ju,n.set(i,[a])):r>=s.length?(a=new Ju,s.push(a)):a=s[r],a}function t(){n=new WeakMap}return{get:e,dispose:t}}function g_(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new R,color:new Ke};break;case"SpotLight":t={position:new R,direction:new R,color:new Ke,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new R,color:new Ke,distance:0,decay:0};break;case"HemisphereLight":t={direction:new R,skyColor:new Ke,groundColor:new Ke};break;case"RectAreaLight":t={color:new Ke,position:new R,halfWidth:new R,halfHeight:new R};break}return n[e.id]=t,t}}}function __(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new xe};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new xe};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new xe,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}var y_=0;function x_(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function v_(n){let e=new g_,t=__(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let h=0;h<9;h++)i.probe.push(new R);let r=new R,s=new ft,a=new ft;function o(h){let u=0,d=0,f=0;for(let A=0;A<9;A++)i.probe[A].set(0,0,0);let c=0,g=0,S=0,m=0,p=0,M=0,_=0,x=0,w=0,E=0,C=0;h.sort(x_);for(let A=0,L=h.length;A<L;A++){let I=h[A],O=I.color,G=I.intensity,W=I.distance,N=null;if(I.shadow&&I.shadow.map&&(I.shadow.map.texture.format===xi?N=I.shadow.map.texture:N=I.shadow.map.depthTexture||I.shadow.map.texture),I.isAmbientLight)u+=O.r*G,d+=O.g*G,f+=O.b*G;else if(I.isLightProbe){for(let H=0;H<9;H++)i.probe[H].addScaledVector(I.sh.coefficients[H],G);C++}else if(I.isDirectionalLight){let H=e.get(I);if(H.color.copy(I.color).multiplyScalar(I.intensity),I.castShadow){let V=I.shadow,j=t.get(I);j.shadowIntensity=V.intensity,j.shadowBias=V.bias,j.shadowNormalBias=V.normalBias,j.shadowRadius=V.radius,j.shadowMapSize=V.mapSize,i.directionalShadow[c]=j,i.directionalShadowMap[c]=N,i.directionalShadowMatrix[c]=I.shadow.matrix,M++}i.directional[c]=H,c++}else if(I.isSpotLight){let H=e.get(I);H.position.setFromMatrixPosition(I.matrixWorld),H.color.copy(O).multiplyScalar(G),H.distance=W,H.coneCos=Math.cos(I.angle),H.penumbraCos=Math.cos(I.angle*(1-I.penumbra)),H.decay=I.decay,i.spot[S]=H;let V=I.shadow;if(I.map&&(i.spotLightMap[w]=I.map,w++,V.updateMatrices(I),I.castShadow&&E++),i.spotLightMatrix[S]=V.matrix,I.castShadow){let j=t.get(I);j.shadowIntensity=V.intensity,j.shadowBias=V.bias,j.shadowNormalBias=V.normalBias,j.shadowRadius=V.radius,j.shadowMapSize=V.mapSize,i.spotShadow[S]=j,i.spotShadowMap[S]=N,x++}S++}else if(I.isRectAreaLight){let H=e.get(I);H.color.copy(O).multiplyScalar(G),H.halfWidth.set(I.width*.5,0,0),H.halfHeight.set(0,I.height*.5,0),i.rectArea[m]=H,m++}else if(I.isPointLight){let H=e.get(I);if(H.color.copy(I.color).multiplyScalar(I.intensity),H.distance=I.distance,H.decay=I.decay,I.castShadow){let V=I.shadow,j=t.get(I);j.shadowIntensity=V.intensity,j.shadowBias=V.bias,j.shadowNormalBias=V.normalBias,j.shadowRadius=V.radius,j.shadowMapSize=V.mapSize,j.shadowCameraNear=V.camera.near,j.shadowCameraFar=V.camera.far,i.pointShadow[g]=j,i.pointShadowMap[g]=N,i.pointShadowMatrix[g]=I.shadow.matrix,_++}i.point[g]=H,g++}else if(I.isHemisphereLight){let H=e.get(I);H.skyColor.copy(I.color).multiplyScalar(G),H.groundColor.copy(I.groundColor).multiplyScalar(G),i.hemi[p]=H,p++}}m>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=ce.LTC_FLOAT_1,i.rectAreaLTC2=ce.LTC_FLOAT_2):(i.rectAreaLTC1=ce.LTC_HALF_1,i.rectAreaLTC2=ce.LTC_HALF_2)),i.ambient[0]=u,i.ambient[1]=d,i.ambient[2]=f;let v=i.hash;(v.directionalLength!==c||v.pointLength!==g||v.spotLength!==S||v.rectAreaLength!==m||v.hemiLength!==p||v.numDirectionalShadows!==M||v.numPointShadows!==_||v.numSpotShadows!==x||v.numSpotMaps!==w||v.numLightProbes!==C)&&(i.directional.length=c,i.spot.length=S,i.rectArea.length=m,i.point.length=g,i.hemi.length=p,i.directionalShadow.length=M,i.directionalShadowMap.length=M,i.pointShadow.length=_,i.pointShadowMap.length=_,i.spotShadow.length=x,i.spotShadowMap.length=x,i.directionalShadowMatrix.length=M,i.pointShadowMatrix.length=_,i.spotLightMatrix.length=x+w-E,i.spotLightMap.length=w,i.numSpotLightShadowsWithMaps=E,i.numLightProbes=C,v.directionalLength=c,v.pointLength=g,v.spotLength=S,v.rectAreaLength=m,v.hemiLength=p,v.numDirectionalShadows=M,v.numPointShadows=_,v.numSpotShadows=x,v.numSpotMaps=w,v.numLightProbes=C,i.version=y_++)}function l(h,u){let d=0,f=0,c=0,g=0,S=0,m=u.matrixWorldInverse;for(let p=0,M=h.length;p<M;p++){let _=h[p];if(_.isDirectionalLight){let x=i.directional[d];x.direction.setFromMatrixPosition(_.matrixWorld),r.setFromMatrixPosition(_.target.matrixWorld),x.direction.sub(r),x.direction.transformDirection(m),d++}else if(_.isSpotLight){let x=i.spot[c];x.position.setFromMatrixPosition(_.matrixWorld),x.position.applyMatrix4(m),x.direction.setFromMatrixPosition(_.matrixWorld),r.setFromMatrixPosition(_.target.matrixWorld),x.direction.sub(r),x.direction.transformDirection(m),c++}else if(_.isRectAreaLight){let x=i.rectArea[g];x.position.setFromMatrixPosition(_.matrixWorld),x.position.applyMatrix4(m),a.identity(),s.copy(_.matrixWorld),s.premultiply(m),a.extractRotation(s),x.halfWidth.set(_.width*.5,0,0),x.halfHeight.set(0,_.height*.5,0),x.halfWidth.applyMatrix4(a),x.halfHeight.applyMatrix4(a),g++}else if(_.isPointLight){let x=i.point[f];x.position.setFromMatrixPosition(_.matrixWorld),x.position.applyMatrix4(m),f++}else if(_.isHemisphereLight){let x=i.hemi[S];x.direction.setFromMatrixPosition(_.matrixWorld),x.direction.transformDirection(m),S++}}}return{setup:o,setupView:l,state:i}}function ju(n){let e=new v_(n),t=[],i=[],r=[];function s(f){d.camera=f,t.length=0,i.length=0,r.length=0}function a(f){t.push(f)}function o(f){i.push(f)}function l(f){r.push(f)}function h(){e.setup(t)}function u(f){e.setupView(t,f)}let d={lightsArray:t,shadowsArray:i,lightProbeGridArray:r,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:s,state:d,setupLights:h,setupLightsView:u,pushLight:a,pushShadow:o,pushLightProbeGrid:l}}function S_(n){let e=new WeakMap;function t(r,s=0){let a=e.get(r),o;return a===void 0?(o=new ju(n),e.set(r,[o])):s>=a.length?(o=new ju(n),a.push(o)):o=a[s],o}function i(){e=new WeakMap}return{get:t,dispose:i}}var b_=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,M_=`uniform sampler2D shadow_pass;
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
}`,T_=[new R(1,0,0),new R(-1,0,0),new R(0,1,0),new R(0,-1,0),new R(0,0,1),new R(0,0,-1)],E_=[new R(0,-1,0),new R(0,-1,0),new R(0,0,1),new R(0,0,-1),new R(0,-1,0),new R(0,-1,0)],Qu=new ft,Ts=new R,Mc=new R;function w_(n,e,t){let i=new jr,r=new xe,s=new xe,a=new bt,o=new Ha,l=new za,h={},u=t.maxTextureSize,d={[Xn]:Vt,[Vt]:Xn,[Bt]:Bt},f=new tn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new xe},radius:{value:4}},vertexShader:b_,fragmentShader:M_}),c=f.clone();c.defines.HORIZONTAL_PASS=1;let g=new st;g.setAttribute("position",new Xt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let S=new dt(g,f),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=ps;let p=this.type;this.render=function(E,C,v){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||E.length===0)return;this.type===Wh&&(Ce("WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead."),this.type=ps);let A=n.getRenderTarget(),L=n.getActiveCubeFace(),I=n.getActiveMipmapLevel(),O=n.state;O.setBlending(Pn),O.buffers.depth.getReversed()===!0?O.buffers.color.setClear(0,0,0,0):O.buffers.color.setClear(1,1,1,1),O.buffers.depth.setTest(!0),O.setScissorTest(!1);let G=p!==this.type;G&&C.traverse(function(W){W.material&&(Array.isArray(W.material)?W.material.forEach(N=>N.needsUpdate=!0):W.material.needsUpdate=!0)});for(let W=0,N=E.length;W<N;W++){let H=E[W],V=H.shadow;if(V===void 0){Ce("WebGLShadowMap:",H,"has no shadow.");continue}if(V.autoUpdate===!1&&V.needsUpdate===!1)continue;r.copy(V.mapSize);let j=V.getFrameExtents();r.multiply(j),s.copy(V.mapSize),(r.x>u||r.y>u)&&(r.x>u&&(s.x=Math.floor(u/j.x),r.x=s.x*j.x,V.mapSize.x=s.x),r.y>u&&(s.y=Math.floor(u/j.y),r.y=s.y*j.y,V.mapSize.y=s.y));let Q=n.state.buffers.depth.getReversed();if(V.camera._reversedDepth=Q,V.map===null||G===!0){if(V.map!==null&&(V.map.depthTexture!==null&&(V.map.depthTexture.dispose(),V.map.depthTexture=null),V.map.dispose()),this.type===Er){if(H.isPointLight){Ce("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}V.map=new jt(r.x,r.y,{format:xi,type:Dn,minFilter:de,magFilter:de,generateMipmaps:!1}),V.map.texture.name=H.name+".shadowMap",V.map.depthTexture=new Yn(r.x,r.y,xn),V.map.depthTexture.name=H.name+".shadowMapDepth",V.map.depthTexture.format=An,V.map.depthTexture.compareFunction=null,V.map.depthTexture.minFilter=Dt,V.map.depthTexture.magFilter=Dt}else H.isPointLight?(V.map=new Xo(r.x),V.map.depthTexture=new Fa(r.x,yn)):(V.map=new jt(r.x,r.y),V.map.depthTexture=new Yn(r.x,r.y,yn)),V.map.depthTexture.name=H.name+".shadowMap",V.map.depthTexture.format=An,this.type===ps?(V.map.depthTexture.compareFunction=Q?zo:Ho,V.map.depthTexture.minFilter=de,V.map.depthTexture.magFilter=de):(V.map.depthTexture.compareFunction=null,V.map.depthTexture.minFilter=Dt,V.map.depthTexture.magFilter=Dt);V.camera.updateProjectionMatrix()}let he=V.map.isWebGLCubeRenderTarget?6:1;for(let be=0;be<he;be++){if(V.map.isWebGLCubeRenderTarget)n.setRenderTarget(V.map,be),n.clear();else{be===0&&(n.setRenderTarget(V.map),n.clear());let we=V.getViewport(be);a.set(s.x*we.x,s.y*we.y,s.x*we.z,s.y*we.w),O.viewport(a)}if(H.isPointLight){let we=V.camera,$e=V.matrix,et=H.distance||we.far;et!==we.far&&(we.far=et,we.updateProjectionMatrix()),Ts.setFromMatrixPosition(H.matrixWorld),we.position.copy(Ts),Mc.copy(we.position),Mc.add(T_[be]),we.up.copy(E_[be]),we.lookAt(Mc),we.updateMatrixWorld(),$e.makeTranslation(-Ts.x,-Ts.y,-Ts.z),Qu.multiplyMatrices(we.projectionMatrix,we.matrixWorldInverse),V._frustum.setFromProjectionMatrix(Qu,we.coordinateSystem,we.reversedDepth)}else V.updateMatrices(H);i=V.getFrustum(),x(C,v,V.camera,H,this.type)}V.isPointLightShadow!==!0&&this.type===Er&&M(V,v),V.needsUpdate=!1}p=this.type,m.needsUpdate=!1,n.setRenderTarget(A,L,I)};function M(E,C){let v=e.update(S);f.defines.VSM_SAMPLES!==E.blurSamples&&(f.defines.VSM_SAMPLES=E.blurSamples,c.defines.VSM_SAMPLES=E.blurSamples,f.needsUpdate=!0,c.needsUpdate=!0),E.mapPass===null&&(E.mapPass=new jt(r.x,r.y,{format:xi,type:Dn})),f.uniforms.shadow_pass.value=E.map.depthTexture,f.uniforms.resolution.value=E.mapSize,f.uniforms.radius.value=E.radius,n.setRenderTarget(E.mapPass),n.clear(),n.renderBufferDirect(C,null,v,f,S,null),c.uniforms.shadow_pass.value=E.mapPass.texture,c.uniforms.resolution.value=E.mapSize,c.uniforms.radius.value=E.radius,n.setRenderTarget(E.map),n.clear(),n.renderBufferDirect(C,null,v,c,S,null)}function _(E,C,v,A){let L=null,I=v.isPointLight===!0?E.customDistanceMaterial:E.customDepthMaterial;if(I!==void 0)L=I;else if(L=v.isPointLight===!0?l:o,n.localClippingEnabled&&C.clipShadows===!0&&Array.isArray(C.clippingPlanes)&&C.clippingPlanes.length!==0||C.displacementMap&&C.displacementScale!==0||C.alphaMap&&C.alphaTest>0||C.map&&C.alphaTest>0||C.alphaToCoverage===!0){let O=L.uuid,G=C.uuid,W=h[O];W===void 0&&(W={},h[O]=W);let N=W[G];N===void 0&&(N=L.clone(),W[G]=N,C.addEventListener("dispose",w)),L=N}if(L.visible=C.visible,L.wireframe=C.wireframe,A===Er?L.side=C.shadowSide!==null?C.shadowSide:C.side:L.side=C.shadowSide!==null?C.shadowSide:d[C.side],L.alphaMap=C.alphaMap,L.alphaTest=C.alphaToCoverage===!0?.5:C.alphaTest,L.map=C.map,L.clipShadows=C.clipShadows,L.clippingPlanes=C.clippingPlanes,L.clipIntersection=C.clipIntersection,L.displacementMap=C.displacementMap,L.displacementScale=C.displacementScale,L.displacementBias=C.displacementBias,L.wireframeLinewidth=C.wireframeLinewidth,L.linewidth=C.linewidth,v.isPointLight===!0&&L.isMeshDistanceMaterial===!0){let O=n.properties.get(L);O.light=v}return L}function x(E,C,v,A,L){if(E.visible===!1)return;if(E.layers.test(C.layers)&&(E.isMesh||E.isLine||E.isPoints)&&(E.castShadow||E.receiveShadow&&L===Er)&&(!E.frustumCulled||i.intersectsObject(E))){E.modelViewMatrix.multiplyMatrices(v.matrixWorldInverse,E.matrixWorld);let G=e.update(E),W=E.material;if(Array.isArray(W)){let N=G.groups;for(let H=0,V=N.length;H<V;H++){let j=N[H],Q=W[j.materialIndex];if(Q&&Q.visible){let he=_(E,Q,A,L);E.onBeforeShadow(n,E,C,v,G,he,j),n.renderBufferDirect(v,null,G,he,E,j),E.onAfterShadow(n,E,C,v,G,he,j)}}}else if(W.visible){let N=_(E,W,A,L);E.onBeforeShadow(n,E,C,v,G,N,null),n.renderBufferDirect(v,null,G,N,E,null),E.onAfterShadow(n,E,C,v,G,N,null)}}let O=E.children;for(let G=0,W=O.length;G<W;G++)x(O[G],C,v,A,L)}function w(E){E.target.removeEventListener("dispose",w);for(let v in h){let A=h[v],L=E.target.uuid;L in A&&(A[L].dispose(),delete A[L])}}}function A_(n,e){function t(){let P=!1,ne=new bt,q=null,_e=new bt(0,0,0,0);return{setMask:function(se){q!==se&&!P&&(n.colorMask(se,se,se,se),q=se)},setLocked:function(se){P=se},setClear:function(se,K,Te,Oe,Mt){Mt===!0&&(se*=Oe,K*=Oe,Te*=Oe),ne.set(se,K,Te,Oe),_e.equals(ne)===!1&&(n.clearColor(se,K,Te,Oe),_e.copy(ne))},reset:function(){P=!1,q=null,_e.set(-1,0,0,0)}}}function i(){let P=!1,ne=!1,q=null,_e=null,se=null;return{setReversed:function(K){if(ne!==K){let Te=e.get("EXT_clip_control");K?Te.clipControlEXT(Te.LOWER_LEFT_EXT,Te.ZERO_TO_ONE_EXT):Te.clipControlEXT(Te.LOWER_LEFT_EXT,Te.NEGATIVE_ONE_TO_ONE_EXT),ne=K;let Oe=se;se=null,this.setClear(Oe)}},getReversed:function(){return ne},setTest:function(K){K?ie(n.DEPTH_TEST):Ie(n.DEPTH_TEST)},setMask:function(K){q!==K&&!P&&(n.depthMask(K),q=K)},setFunc:function(K){if(ne&&(K=Mu[K]),_e!==K){switch(K){case pa:n.depthFunc(n.NEVER);break;case ma:n.depthFunc(n.ALWAYS);break;case ga:n.depthFunc(n.LESS);break;case Li:n.depthFunc(n.LEQUAL);break;case _a:n.depthFunc(n.EQUAL);break;case ya:n.depthFunc(n.GEQUAL);break;case xa:n.depthFunc(n.GREATER);break;case va:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}_e=K}},setLocked:function(K){P=K},setClear:function(K){se!==K&&(se=K,ne&&(K=1-K),n.clearDepth(K))},reset:function(){P=!1,q=null,_e=null,se=null,ne=!1}}}function r(){let P=!1,ne=null,q=null,_e=null,se=null,K=null,Te=null,Oe=null,Mt=null;return{setTest:function(nt){P||(nt?ie(n.STENCIL_TEST):Ie(n.STENCIL_TEST))},setMask:function(nt){ne!==nt&&!P&&(n.stencilMask(nt),ne=nt)},setFunc:function(nt,On,bn){(q!==nt||_e!==On||se!==bn)&&(n.stencilFunc(nt,On,bn),q=nt,_e=On,se=bn)},setOp:function(nt,On,bn){(K!==nt||Te!==On||Oe!==bn)&&(n.stencilOp(nt,On,bn),K=nt,Te=On,Oe=bn)},setLocked:function(nt){P=nt},setClear:function(nt){Mt!==nt&&(n.clearStencil(nt),Mt=nt)},reset:function(){P=!1,ne=null,q=null,_e=null,se=null,K=null,Te=null,Oe=null,Mt=null}}}let s=new t,a=new i,o=new r,l=new WeakMap,h=new WeakMap,u={},d={},f={},c=new WeakMap,g=[],S=null,m=!1,p=null,M=null,_=null,x=null,w=null,E=null,C=null,v=new Ke(0,0,0),A=0,L=!1,I=null,O=null,G=null,W=null,N=null,H=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS),V=!1,j=0,Q=n.getParameter(n.VERSION);Q.indexOf("WebGL")!==-1?(j=parseFloat(/^WebGL (\d)/.exec(Q)[1]),V=j>=1):Q.indexOf("OpenGL ES")!==-1&&(j=parseFloat(/^OpenGL ES (\d)/.exec(Q)[1]),V=j>=2);let he=null,be={},we=n.getParameter(n.SCISSOR_BOX),$e=n.getParameter(n.VIEWPORT),et=new bt().fromArray(we),ke=new bt().fromArray($e);function Z(P,ne,q,_e){let se=new Uint8Array(4),K=n.createTexture();n.bindTexture(P,K),n.texParameteri(P,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(P,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let Te=0;Te<q;Te++)P===n.TEXTURE_3D||P===n.TEXTURE_2D_ARRAY?n.texImage3D(ne,0,n.RGBA,1,1,_e,0,n.RGBA,n.UNSIGNED_BYTE,se):n.texImage2D(ne+Te,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,se);return K}let pe={};pe[n.TEXTURE_2D]=Z(n.TEXTURE_2D,n.TEXTURE_2D,1),pe[n.TEXTURE_CUBE_MAP]=Z(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),pe[n.TEXTURE_2D_ARRAY]=Z(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),pe[n.TEXTURE_3D]=Z(n.TEXTURE_3D,n.TEXTURE_3D,1,1),s.setClear(0,0,0,1),a.setClear(1),o.setClear(0),ie(n.DEPTH_TEST),a.setFunc(Li),At(!1),gt(Xl),ie(n.CULL_FACE),ht(Pn);function ie(P){u[P]!==!0&&(n.enable(P),u[P]=!0)}function Ie(P){u[P]!==!1&&(n.disable(P),u[P]=!1)}function Ne(P,ne){return f[P]!==ne?(n.bindFramebuffer(P,ne),f[P]=ne,P===n.DRAW_FRAMEBUFFER&&(f[n.FRAMEBUFFER]=ne),P===n.FRAMEBUFFER&&(f[n.DRAW_FRAMEBUFFER]=ne),!0):!1}function Pe(P,ne){let q=g,_e=!1;if(P){q=c.get(ne),q===void 0&&(q=[],c.set(ne,q));let se=P.textures;if(q.length!==se.length||q[0]!==n.COLOR_ATTACHMENT0){for(let K=0,Te=se.length;K<Te;K++)q[K]=n.COLOR_ATTACHMENT0+K;q.length=se.length,_e=!0}}else q[0]!==n.BACK&&(q[0]=n.BACK,_e=!0);_e&&n.drawBuffers(q)}function mt(P){return S!==P?(n.useProgram(P),S=P,!0):!1}let Xe={[ci]:n.FUNC_ADD,[qh]:n.FUNC_SUBTRACT,[Yh]:n.FUNC_REVERSE_SUBTRACT};Xe[$h]=n.MIN,Xe[Zh]=n.MAX;let tt={[Kh]:n.ZERO,[Jh]:n.ONE,[jh]:n.SRC_COLOR,[da]:n.SRC_ALPHA,[ru]:n.SRC_ALPHA_SATURATE,[nu]:n.DST_COLOR,[eu]:n.DST_ALPHA,[Qh]:n.ONE_MINUS_SRC_COLOR,[fa]:n.ONE_MINUS_SRC_ALPHA,[iu]:n.ONE_MINUS_DST_COLOR,[tu]:n.ONE_MINUS_DST_ALPHA,[su]:n.CONSTANT_COLOR,[au]:n.ONE_MINUS_CONSTANT_COLOR,[ou]:n.CONSTANT_ALPHA,[lu]:n.ONE_MINUS_CONSTANT_ALPHA};function ht(P,ne,q,_e,se,K,Te,Oe,Mt,nt){if(P===Pn){m===!0&&(Ie(n.BLEND),m=!1);return}if(m===!1&&(ie(n.BLEND),m=!0),P!==Xh){if(P!==p||nt!==L){if((M!==ci||w!==ci)&&(n.blendEquation(n.FUNC_ADD),M=ci,w=ci),nt)switch(P){case Di:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case ql:n.blendFunc(n.ONE,n.ONE);break;case Yl:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case $l:n.blendFuncSeparate(n.DST_COLOR,n.ONE_MINUS_SRC_ALPHA,n.ZERO,n.ONE);break;default:Re("WebGLState: Invalid blending: ",P);break}else switch(P){case Di:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case ql:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE,n.ONE,n.ONE);break;case Yl:Re("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case $l:Re("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Re("WebGLState: Invalid blending: ",P);break}_=null,x=null,E=null,C=null,v.set(0,0,0),A=0,p=P,L=nt}return}se=se||ne,K=K||q,Te=Te||_e,(ne!==M||se!==w)&&(n.blendEquationSeparate(Xe[ne],Xe[se]),M=ne,w=se),(q!==_||_e!==x||K!==E||Te!==C)&&(n.blendFuncSeparate(tt[q],tt[_e],tt[K],tt[Te]),_=q,x=_e,E=K,C=Te),(Oe.equals(v)===!1||Mt!==A)&&(n.blendColor(Oe.r,Oe.g,Oe.b,Mt),v.copy(Oe),A=Mt),p=P,L=!1}function Ve(P,ne){P.side===Bt?Ie(n.CULL_FACE):ie(n.CULL_FACE);let q=P.side===Vt;ne&&(q=!q),At(q),P.blending===Di&&P.transparent===!1?ht(Pn):ht(P.blending,P.blendEquation,P.blendSrc,P.blendDst,P.blendEquationAlpha,P.blendSrcAlpha,P.blendDstAlpha,P.blendColor,P.blendAlpha,P.premultipliedAlpha),a.setFunc(P.depthFunc),a.setTest(P.depthTest),a.setMask(P.depthWrite),s.setMask(P.colorWrite);let _e=P.stencilWrite;o.setTest(_e),_e&&(o.setMask(P.stencilWriteMask),o.setFunc(P.stencilFunc,P.stencilRef,P.stencilFuncMask),o.setOp(P.stencilFail,P.stencilZFail,P.stencilZPass)),D(P.polygonOffset,P.polygonOffsetFactor,P.polygonOffsetUnits),P.alphaToCoverage===!0?ie(n.SAMPLE_ALPHA_TO_COVERAGE):Ie(n.SAMPLE_ALPHA_TO_COVERAGE)}function At(P){I!==P&&(P?n.frontFace(n.CW):n.frontFace(n.CCW),I=P)}function gt(P){P!==Vh?(ie(n.CULL_FACE),P!==O&&(P===Xl?n.cullFace(n.BACK):P===Gh?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):Ie(n.CULL_FACE),O=P}function Yt(P){P!==G&&(V&&n.lineWidth(P),G=P)}function D(P,ne,q){P?(ie(n.POLYGON_OFFSET_FILL),(W!==ne||N!==q)&&(W=ne,N=q,a.getReversed()&&(ne=-ne),n.polygonOffset(ne,q))):Ie(n.POLYGON_OFFSET_FILL)}function Ct(P){P?ie(n.SCISSOR_TEST):Ie(n.SCISSOR_TEST)}function qe(P){P===void 0&&(P=n.TEXTURE0+H-1),he!==P&&(n.activeTexture(P),he=P)}function lt(P,ne,q){q===void 0&&(he===null?q=n.TEXTURE0+H-1:q=he);let _e=be[q];_e===void 0&&(_e={type:void 0,texture:void 0},be[q]=_e),(_e.type!==P||_e.texture!==ne)&&(he!==q&&(n.activeTexture(q),he=q),n.bindTexture(P,ne||pe[P]),_e.type=P,_e.texture=ne)}function le(){let P=be[he];P!==void 0&&P.type!==void 0&&(n.bindTexture(P.type,null),P.type=void 0,P.texture=void 0)}function vt(){try{n.compressedTexImage2D(...arguments)}catch(P){Re("WebGLState:",P)}}function T(){try{n.compressedTexImage3D(...arguments)}catch(P){Re("WebGLState:",P)}}function y(){try{n.texSubImage2D(...arguments)}catch(P){Re("WebGLState:",P)}}function U(){try{n.texSubImage3D(...arguments)}catch(P){Re("WebGLState:",P)}}function Y(){try{n.compressedTexSubImage2D(...arguments)}catch(P){Re("WebGLState:",P)}}function J(){try{n.compressedTexSubImage3D(...arguments)}catch(P){Re("WebGLState:",P)}}function ee(){try{n.texStorage2D(...arguments)}catch(P){Re("WebGLState:",P)}}function ae(){try{n.texStorage3D(...arguments)}catch(P){Re("WebGLState:",P)}}function X(){try{n.texImage2D(...arguments)}catch(P){Re("WebGLState:",P)}}function $(){try{n.texImage3D(...arguments)}catch(P){Re("WebGLState:",P)}}function me(P){return d[P]!==void 0?d[P]:n.getParameter(P)}function ve(P,ne){d[P]!==ne&&(n.pixelStorei(P,ne),d[P]=ne)}function re(P){et.equals(P)===!1&&(n.scissor(P.x,P.y,P.z,P.w),et.copy(P))}function te(P){ke.equals(P)===!1&&(n.viewport(P.x,P.y,P.z,P.w),ke.copy(P))}function De(P,ne){let q=h.get(ne);q===void 0&&(q=new WeakMap,h.set(ne,q));let _e=q.get(P);_e===void 0&&(_e=n.getUniformBlockIndex(ne,P.name),q.set(P,_e))}function Be(P,ne){let _e=h.get(ne).get(P);l.get(ne)!==_e&&(n.uniformBlockBinding(ne,_e,P.__bindingPointIndex),l.set(ne,_e))}function Je(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),a.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),n.pixelStorei(n.PACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,!1),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,n.BROWSER_DEFAULT_WEBGL),n.pixelStorei(n.PACK_ROW_LENGTH,0),n.pixelStorei(n.PACK_SKIP_PIXELS,0),n.pixelStorei(n.PACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_ROW_LENGTH,0),n.pixelStorei(n.UNPACK_IMAGE_HEIGHT,0),n.pixelStorei(n.UNPACK_SKIP_PIXELS,0),n.pixelStorei(n.UNPACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_SKIP_IMAGES,0),u={},d={},he=null,be={},f={},c=new WeakMap,g=[],S=null,m=!1,p=null,M=null,_=null,x=null,w=null,E=null,C=null,v=new Ke(0,0,0),A=0,L=!1,I=null,O=null,G=null,W=null,N=null,et.set(0,0,n.canvas.width,n.canvas.height),ke.set(0,0,n.canvas.width,n.canvas.height),s.reset(),a.reset(),o.reset()}return{buffers:{color:s,depth:a,stencil:o},enable:ie,disable:Ie,bindFramebuffer:Ne,drawBuffers:Pe,useProgram:mt,setBlending:ht,setMaterial:Ve,setFlipSided:At,setCullFace:gt,setLineWidth:Yt,setPolygonOffset:D,setScissorTest:Ct,activeTexture:qe,bindTexture:lt,unbindTexture:le,compressedTexImage2D:vt,compressedTexImage3D:T,texImage2D:X,texImage3D:$,pixelStorei:ve,getParameter:me,updateUBOMapping:De,uniformBlockBinding:Be,texStorage2D:ee,texStorage3D:ae,texSubImage2D:y,texSubImage3D:U,compressedTexSubImage2D:Y,compressedTexSubImage3D:J,scissor:re,viewport:te,reset:Je}}function C_(n,e,t,i,r,s,a){let o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),h=new xe,u=new WeakMap,d=new Set,f,c=new WeakMap,g=!1;try{g=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function S(T,y){return g?new OffscreenCanvas(T,y):hr("canvas")}function m(T,y,U){let Y=1,J=vt(T);if((J.width>U||J.height>U)&&(Y=U/Math.max(J.width,J.height)),Y<1)if(typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&T instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&T instanceof ImageBitmap||typeof VideoFrame<"u"&&T instanceof VideoFrame){let ee=Math.floor(Y*J.width),ae=Math.floor(Y*J.height);f===void 0&&(f=S(ee,ae));let X=y?S(ee,ae):f;return X.width=ee,X.height=ae,X.getContext("2d").drawImage(T,0,0,ee,ae),Ce("WebGLRenderer: Texture has been resized from ("+J.width+"x"+J.height+") to ("+ee+"x"+ae+")."),X}else return"data"in T&&Ce("WebGLRenderer: Image in DataTexture is too big ("+J.width+"x"+J.height+")."),T;return T}function p(T){return T.generateMipmaps}function M(T){n.generateMipmap(T)}function _(T){return T.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:T.isWebGL3DRenderTarget?n.TEXTURE_3D:T.isWebGLArrayRenderTarget||T.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function x(T,y,U,Y,J,ee=!1){if(T!==null){if(n[T]!==void 0)return n[T];Ce("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+T+"'")}let ae;Y&&(ae=e.get("EXT_texture_norm16"),ae||Ce("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let X=y;if(y===n.RED&&(U===n.FLOAT&&(X=n.R32F),U===n.HALF_FLOAT&&(X=n.R16F),U===n.UNSIGNED_BYTE&&(X=n.R8),U===n.UNSIGNED_SHORT&&ae&&(X=ae.R16_EXT),U===n.SHORT&&ae&&(X=ae.R16_SNORM_EXT)),y===n.RED_INTEGER&&(U===n.UNSIGNED_BYTE&&(X=n.R8UI),U===n.UNSIGNED_SHORT&&(X=n.R16UI),U===n.UNSIGNED_INT&&(X=n.R32UI),U===n.BYTE&&(X=n.R8I),U===n.SHORT&&(X=n.R16I),U===n.INT&&(X=n.R32I)),y===n.RG&&(U===n.FLOAT&&(X=n.RG32F),U===n.HALF_FLOAT&&(X=n.RG16F),U===n.UNSIGNED_BYTE&&(X=n.RG8),U===n.UNSIGNED_SHORT&&ae&&(X=ae.RG16_EXT),U===n.SHORT&&ae&&(X=ae.RG16_SNORM_EXT)),y===n.RG_INTEGER&&(U===n.UNSIGNED_BYTE&&(X=n.RG8UI),U===n.UNSIGNED_SHORT&&(X=n.RG16UI),U===n.UNSIGNED_INT&&(X=n.RG32UI),U===n.BYTE&&(X=n.RG8I),U===n.SHORT&&(X=n.RG16I),U===n.INT&&(X=n.RG32I)),y===n.RGB_INTEGER&&(U===n.UNSIGNED_BYTE&&(X=n.RGB8UI),U===n.UNSIGNED_SHORT&&(X=n.RGB16UI),U===n.UNSIGNED_INT&&(X=n.RGB32UI),U===n.BYTE&&(X=n.RGB8I),U===n.SHORT&&(X=n.RGB16I),U===n.INT&&(X=n.RGB32I)),y===n.RGBA_INTEGER&&(U===n.UNSIGNED_BYTE&&(X=n.RGBA8UI),U===n.UNSIGNED_SHORT&&(X=n.RGBA16UI),U===n.UNSIGNED_INT&&(X=n.RGBA32UI),U===n.BYTE&&(X=n.RGBA8I),U===n.SHORT&&(X=n.RGBA16I),U===n.INT&&(X=n.RGBA32I)),y===n.RGB&&(U===n.UNSIGNED_SHORT&&ae&&(X=ae.RGB16_EXT),U===n.SHORT&&ae&&(X=ae.RGB16_SNORM_EXT),U===n.UNSIGNED_INT_5_9_9_9_REV&&(X=n.RGB9_E5),U===n.UNSIGNED_INT_10F_11F_11F_REV&&(X=n.R11F_G11F_B10F)),y===n.RGBA){let $=ee?Xr:Ye.getTransfer(J);U===n.FLOAT&&(X=n.RGBA32F),U===n.HALF_FLOAT&&(X=n.RGBA16F),U===n.UNSIGNED_BYTE&&(X=$===Qe?n.SRGB8_ALPHA8:n.RGBA8),U===n.UNSIGNED_SHORT&&ae&&(X=ae.RGBA16_EXT),U===n.SHORT&&ae&&(X=ae.RGBA16_SNORM_EXT),U===n.UNSIGNED_SHORT_4_4_4_4&&(X=n.RGBA4),U===n.UNSIGNED_SHORT_5_5_5_1&&(X=n.RGB5_A1)}return(X===n.R16F||X===n.R32F||X===n.RG16F||X===n.RG32F||X===n.RGBA16F||X===n.RGBA32F)&&e.get("EXT_color_buffer_float"),X}function w(T,y){let U;return T?y===null||y===yn||y===Ar?U=n.DEPTH24_STENCIL8:y===xn?U=n.DEPTH32F_STENCIL8:y===wr&&(U=n.DEPTH24_STENCIL8,Ce("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):y===null||y===yn||y===Ar?U=n.DEPTH_COMPONENT24:y===xn?U=n.DEPTH_COMPONENT32F:y===wr&&(U=n.DEPTH_COMPONENT16),U}function E(T,y){return p(T)===!0||T.isFramebufferTexture&&T.minFilter!==Dt&&T.minFilter!==de?Math.log2(Math.max(y.width,y.height))+1:T.mipmaps!==void 0&&T.mipmaps.length>0?T.mipmaps.length:T.isCompressedTexture&&Array.isArray(T.image)?y.mipmaps.length:1}function C(T){let y=T.target;y.removeEventListener("dispose",C),A(y),y.isVideoTexture&&u.delete(y),y.isHTMLTexture&&d.delete(y)}function v(T){let y=T.target;y.removeEventListener("dispose",v),I(y)}function A(T){let y=i.get(T);if(y.__webglInit===void 0)return;let U=T.source,Y=c.get(U);if(Y){let J=Y[y.__cacheKey];J.usedTimes--,J.usedTimes===0&&L(T),Object.keys(Y).length===0&&c.delete(U)}i.remove(T)}function L(T){let y=i.get(T);n.deleteTexture(y.__webglTexture);let U=T.source,Y=c.get(U);delete Y[y.__cacheKey],a.memory.textures--}function I(T){let y=i.get(T);if(T.depthTexture&&(T.depthTexture.dispose(),i.remove(T.depthTexture)),T.isWebGLCubeRenderTarget)for(let Y=0;Y<6;Y++){if(Array.isArray(y.__webglFramebuffer[Y]))for(let J=0;J<y.__webglFramebuffer[Y].length;J++)n.deleteFramebuffer(y.__webglFramebuffer[Y][J]);else n.deleteFramebuffer(y.__webglFramebuffer[Y]);y.__webglDepthbuffer&&n.deleteRenderbuffer(y.__webglDepthbuffer[Y])}else{if(Array.isArray(y.__webglFramebuffer))for(let Y=0;Y<y.__webglFramebuffer.length;Y++)n.deleteFramebuffer(y.__webglFramebuffer[Y]);else n.deleteFramebuffer(y.__webglFramebuffer);if(y.__webglDepthbuffer&&n.deleteRenderbuffer(y.__webglDepthbuffer),y.__webglMultisampledFramebuffer&&n.deleteFramebuffer(y.__webglMultisampledFramebuffer),y.__webglColorRenderbuffer)for(let Y=0;Y<y.__webglColorRenderbuffer.length;Y++)y.__webglColorRenderbuffer[Y]&&n.deleteRenderbuffer(y.__webglColorRenderbuffer[Y]);y.__webglDepthRenderbuffer&&n.deleteRenderbuffer(y.__webglDepthRenderbuffer)}let U=T.textures;for(let Y=0,J=U.length;Y<J;Y++){let ee=i.get(U[Y]);ee.__webglTexture&&(n.deleteTexture(ee.__webglTexture),a.memory.textures--),i.remove(U[Y])}i.remove(T)}let O=0;function G(){O=0}function W(){return O}function N(T){O=T}function H(){let T=O;return T>=r.maxTextures&&Ce("WebGLTextures: Trying to use "+T+" texture units while this GPU supports only "+r.maxTextures),O+=1,T}function V(T){let y=[];return y.push(T.wrapS),y.push(T.wrapT),y.push(T.wrapR||0),y.push(T.magFilter),y.push(T.minFilter),y.push(T.anisotropy),y.push(T.internalFormat),y.push(T.format),y.push(T.type),y.push(T.generateMipmaps),y.push(T.premultiplyAlpha),y.push(T.flipY),y.push(T.unpackAlignment),y.push(T.colorSpace),y.join()}function j(T,y){let U=i.get(T);if(T.isVideoTexture&&lt(T),T.isRenderTargetTexture===!1&&T.isExternalTexture!==!0&&T.version>0&&U.__version!==T.version){let Y=T.image;if(Y===null)Ce("WebGLRenderer: Texture marked for update but no image data found.");else if(Y.complete===!1)Ce("WebGLRenderer: Texture marked for update but image is incomplete");else{Ie(U,T,y);return}}else T.isExternalTexture&&(U.__webglTexture=T.sourceTexture?T.sourceTexture:null);t.bindTexture(n.TEXTURE_2D,U.__webglTexture,n.TEXTURE0+y)}function Q(T,y){let U=i.get(T);if(T.isRenderTargetTexture===!1&&T.version>0&&U.__version!==T.version){Ie(U,T,y);return}else T.isExternalTexture&&(U.__webglTexture=T.sourceTexture?T.sourceTexture:null);t.bindTexture(n.TEXTURE_2D_ARRAY,U.__webglTexture,n.TEXTURE0+y)}function he(T,y){let U=i.get(T);if(T.isRenderTargetTexture===!1&&T.version>0&&U.__version!==T.version){Ie(U,T,y);return}t.bindTexture(n.TEXTURE_3D,U.__webglTexture,n.TEXTURE0+y)}function be(T,y){let U=i.get(T);if(T.isCubeDepthTexture!==!0&&T.version>0&&U.__version!==T.version){Ne(U,T,y);return}t.bindTexture(n.TEXTURE_CUBE_MAP,U.__webglTexture,n.TEXTURE0+y)}let we={[Sa]:n.REPEAT,[Jt]:n.CLAMP_TO_EDGE,[ba]:n.MIRRORED_REPEAT},$e={[Dt]:n.NEAREST,[uu]:n.NEAREST_MIPMAP_NEAREST,[gs]:n.NEAREST_MIPMAP_LINEAR,[de]:n.LINEAR,[no]:n.LINEAR_MIPMAP_NEAREST,[_n]:n.LINEAR_MIPMAP_LINEAR},et={[pu]:n.NEVER,[xu]:n.ALWAYS,[mu]:n.LESS,[Ho]:n.LEQUAL,[gu]:n.EQUAL,[zo]:n.GEQUAL,[_u]:n.GREATER,[yu]:n.NOTEQUAL};function ke(T,y){if(y.type===xn&&e.has("OES_texture_float_linear")===!1&&(y.magFilter===de||y.magFilter===no||y.magFilter===gs||y.magFilter===_n||y.minFilter===de||y.minFilter===no||y.minFilter===gs||y.minFilter===_n)&&Ce("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(T,n.TEXTURE_WRAP_S,we[y.wrapS]),n.texParameteri(T,n.TEXTURE_WRAP_T,we[y.wrapT]),(T===n.TEXTURE_3D||T===n.TEXTURE_2D_ARRAY)&&n.texParameteri(T,n.TEXTURE_WRAP_R,we[y.wrapR]),n.texParameteri(T,n.TEXTURE_MAG_FILTER,$e[y.magFilter]),n.texParameteri(T,n.TEXTURE_MIN_FILTER,$e[y.minFilter]),y.compareFunction&&(n.texParameteri(T,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(T,n.TEXTURE_COMPARE_FUNC,et[y.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(y.magFilter===Dt||y.minFilter!==gs&&y.minFilter!==_n||y.type===xn&&e.has("OES_texture_float_linear")===!1)return;if(y.anisotropy>1||i.get(y).__currentAnisotropy){let U=e.get("EXT_texture_filter_anisotropic");n.texParameterf(T,U.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(y.anisotropy,r.getMaxAnisotropy())),i.get(y).__currentAnisotropy=y.anisotropy}}}function Z(T,y){let U=!1;T.__webglInit===void 0&&(T.__webglInit=!0,y.addEventListener("dispose",C));let Y=y.source,J=c.get(Y);J===void 0&&(J={},c.set(Y,J));let ee=V(y);if(ee!==T.__cacheKey){J[ee]===void 0&&(J[ee]={texture:n.createTexture(),usedTimes:0},a.memory.textures++,U=!0),J[ee].usedTimes++;let ae=J[T.__cacheKey];ae!==void 0&&(J[T.__cacheKey].usedTimes--,ae.usedTimes===0&&L(y)),T.__cacheKey=ee,T.__webglTexture=J[ee].texture}return U}function pe(T,y,U){return Math.floor(Math.floor(T/U)/y)}function ie(T,y,U,Y){let ee=T.updateRanges;if(ee.length===0)t.texSubImage2D(n.TEXTURE_2D,0,0,0,y.width,y.height,U,Y,y.data);else{ee.sort((ve,re)=>ve.start-re.start);let ae=0;for(let ve=1;ve<ee.length;ve++){let re=ee[ae],te=ee[ve],De=re.start+re.count,Be=pe(te.start,y.width,4),Je=pe(re.start,y.width,4);te.start<=De+1&&Be===Je&&pe(te.start+te.count-1,y.width,4)===Be?re.count=Math.max(re.count,te.start+te.count-re.start):(++ae,ee[ae]=te)}ee.length=ae+1;let X=t.getParameter(n.UNPACK_ROW_LENGTH),$=t.getParameter(n.UNPACK_SKIP_PIXELS),me=t.getParameter(n.UNPACK_SKIP_ROWS);t.pixelStorei(n.UNPACK_ROW_LENGTH,y.width);for(let ve=0,re=ee.length;ve<re;ve++){let te=ee[ve],De=Math.floor(te.start/4),Be=Math.ceil(te.count/4),Je=De%y.width,P=Math.floor(De/y.width),ne=Be,q=1;t.pixelStorei(n.UNPACK_SKIP_PIXELS,Je),t.pixelStorei(n.UNPACK_SKIP_ROWS,P),t.texSubImage2D(n.TEXTURE_2D,0,Je,P,ne,q,U,Y,y.data)}T.clearUpdateRanges(),t.pixelStorei(n.UNPACK_ROW_LENGTH,X),t.pixelStorei(n.UNPACK_SKIP_PIXELS,$),t.pixelStorei(n.UNPACK_SKIP_ROWS,me)}}function Ie(T,y,U){let Y=n.TEXTURE_2D;(y.isDataArrayTexture||y.isCompressedArrayTexture)&&(Y=n.TEXTURE_2D_ARRAY),y.isData3DTexture&&(Y=n.TEXTURE_3D);let J=Z(T,y),ee=y.source;t.bindTexture(Y,T.__webglTexture,n.TEXTURE0+U);let ae=i.get(ee);if(ee.version!==ae.__version||J===!0){if(t.activeTexture(n.TEXTURE0+U),(typeof ImageBitmap<"u"&&y.image instanceof ImageBitmap)===!1){let q=Ye.getPrimaries(Ye.workingColorSpace),_e=y.colorSpace===$n?null:Ye.getPrimaries(y.colorSpace),se=y.colorSpace===$n||q===_e?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,y.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,se)}t.pixelStorei(n.UNPACK_ALIGNMENT,y.unpackAlignment);let $=m(y.image,!1,r.maxTextureSize);$=le(y,$);let me=s.convert(y.format,y.colorSpace),ve=s.convert(y.type),re=x(y.internalFormat,me,ve,y.normalized,y.colorSpace,y.isVideoTexture);ke(Y,y);let te,De=y.mipmaps,Be=y.isVideoTexture!==!0,Je=ae.__version===void 0||J===!0,P=ee.dataReady,ne=E(y,$);if(y.isDepthTexture)re=w(y.format===yi,y.type),Je&&(Be?t.texStorage2D(n.TEXTURE_2D,1,re,$.width,$.height):t.texImage2D(n.TEXTURE_2D,0,re,$.width,$.height,0,me,ve,null));else if(y.isDataTexture)if(De.length>0){Be&&Je&&t.texStorage2D(n.TEXTURE_2D,ne,re,De[0].width,De[0].height);for(let q=0,_e=De.length;q<_e;q++)te=De[q],Be?P&&t.texSubImage2D(n.TEXTURE_2D,q,0,0,te.width,te.height,me,ve,te.data):t.texImage2D(n.TEXTURE_2D,q,re,te.width,te.height,0,me,ve,te.data);y.generateMipmaps=!1}else Be?(Je&&t.texStorage2D(n.TEXTURE_2D,ne,re,$.width,$.height),P&&ie(y,$,me,ve)):t.texImage2D(n.TEXTURE_2D,0,re,$.width,$.height,0,me,ve,$.data);else if(y.isCompressedTexture)if(y.isCompressedArrayTexture){Be&&Je&&t.texStorage3D(n.TEXTURE_2D_ARRAY,ne,re,De[0].width,De[0].height,$.depth);for(let q=0,_e=De.length;q<_e;q++)if(te=De[q],y.format!==cn)if(me!==null)if(Be){if(P)if(y.layerUpdates.size>0){let se=_c(te.width,te.height,y.format,y.type);for(let K of y.layerUpdates){let Te=te.data.subarray(K*se/te.data.BYTES_PER_ELEMENT,(K+1)*se/te.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,q,0,0,K,te.width,te.height,1,me,Te)}y.clearLayerUpdates()}else t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,q,0,0,0,te.width,te.height,$.depth,me,te.data)}else t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,q,re,te.width,te.height,$.depth,0,te.data,0,0);else Ce("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Be?P&&t.texSubImage3D(n.TEXTURE_2D_ARRAY,q,0,0,0,te.width,te.height,$.depth,me,ve,te.data):t.texImage3D(n.TEXTURE_2D_ARRAY,q,re,te.width,te.height,$.depth,0,me,ve,te.data)}else{Be&&Je&&t.texStorage2D(n.TEXTURE_2D,ne,re,De[0].width,De[0].height);for(let q=0,_e=De.length;q<_e;q++)te=De[q],y.format!==cn?me!==null?Be?P&&t.compressedTexSubImage2D(n.TEXTURE_2D,q,0,0,te.width,te.height,me,te.data):t.compressedTexImage2D(n.TEXTURE_2D,q,re,te.width,te.height,0,te.data):Ce("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Be?P&&t.texSubImage2D(n.TEXTURE_2D,q,0,0,te.width,te.height,me,ve,te.data):t.texImage2D(n.TEXTURE_2D,q,re,te.width,te.height,0,me,ve,te.data)}else if(y.isDataArrayTexture)if(Be){if(Je&&t.texStorage3D(n.TEXTURE_2D_ARRAY,ne,re,$.width,$.height,$.depth),P)if(y.layerUpdates.size>0){let q=_c($.width,$.height,y.format,y.type);for(let _e of y.layerUpdates){let se=$.data.subarray(_e*q/$.data.BYTES_PER_ELEMENT,(_e+1)*q/$.data.BYTES_PER_ELEMENT);t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,_e,$.width,$.height,1,me,ve,se)}y.clearLayerUpdates()}else t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,$.width,$.height,$.depth,me,ve,$.data)}else t.texImage3D(n.TEXTURE_2D_ARRAY,0,re,$.width,$.height,$.depth,0,me,ve,$.data);else if(y.isData3DTexture)Be?(Je&&t.texStorage3D(n.TEXTURE_3D,ne,re,$.width,$.height,$.depth),P&&t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,$.width,$.height,$.depth,me,ve,$.data)):t.texImage3D(n.TEXTURE_3D,0,re,$.width,$.height,$.depth,0,me,ve,$.data);else if(y.isFramebufferTexture){if(Je)if(Be)t.texStorage2D(n.TEXTURE_2D,ne,re,$.width,$.height);else{let q=$.width,_e=$.height;for(let se=0;se<ne;se++)t.texImage2D(n.TEXTURE_2D,se,re,q,_e,0,me,ve,null),q>>=1,_e>>=1}}else if(y.isHTMLTexture){if("texElementImage2D"in n){let q=n.canvas;if(q.hasAttribute("layoutsubtree")||q.setAttribute("layoutsubtree","true"),$.parentNode!==q){q.appendChild($),d.add(y),q.onpaint=Oe=>{let Mt=Oe.changedElements;for(let nt of d)Mt.includes(nt.image)&&(nt.needsUpdate=!0)},q.requestPaint();return}let _e=0,se=n.RGBA,K=n.RGBA,Te=n.UNSIGNED_BYTE;n.texElementImage2D(n.TEXTURE_2D,_e,se,K,Te,$),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MIN_FILTER,n.LINEAR),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE)}}else if(De.length>0){if(Be&&Je){let q=vt(De[0]);t.texStorage2D(n.TEXTURE_2D,ne,re,q.width,q.height)}for(let q=0,_e=De.length;q<_e;q++)te=De[q],Be?P&&t.texSubImage2D(n.TEXTURE_2D,q,0,0,me,ve,te):t.texImage2D(n.TEXTURE_2D,q,re,me,ve,te);y.generateMipmaps=!1}else if(Be){if(Je){let q=vt($);t.texStorage2D(n.TEXTURE_2D,ne,re,q.width,q.height)}P&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,me,ve,$)}else t.texImage2D(n.TEXTURE_2D,0,re,me,ve,$);p(y)&&M(Y),ae.__version=ee.version,y.onUpdate&&y.onUpdate(y)}T.__version=y.version}function Ne(T,y,U){if(y.image.length!==6)return;let Y=Z(T,y),J=y.source;t.bindTexture(n.TEXTURE_CUBE_MAP,T.__webglTexture,n.TEXTURE0+U);let ee=i.get(J);if(J.version!==ee.__version||Y===!0){t.activeTexture(n.TEXTURE0+U);let ae=Ye.getPrimaries(Ye.workingColorSpace),X=y.colorSpace===$n?null:Ye.getPrimaries(y.colorSpace),$=y.colorSpace===$n||ae===X?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,y.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),t.pixelStorei(n.UNPACK_ALIGNMENT,y.unpackAlignment),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,$);let me=y.isCompressedTexture||y.image[0].isCompressedTexture,ve=y.image[0]&&y.image[0].isDataTexture,re=[];for(let K=0;K<6;K++)!me&&!ve?re[K]=m(y.image[K],!0,r.maxCubemapSize):re[K]=ve?y.image[K].image:y.image[K],re[K]=le(y,re[K]);let te=re[0],De=s.convert(y.format,y.colorSpace),Be=s.convert(y.type),Je=x(y.internalFormat,De,Be,y.normalized,y.colorSpace),P=y.isVideoTexture!==!0,ne=ee.__version===void 0||Y===!0,q=J.dataReady,_e=E(y,te);ke(n.TEXTURE_CUBE_MAP,y);let se;if(me){P&&ne&&t.texStorage2D(n.TEXTURE_CUBE_MAP,_e,Je,te.width,te.height);for(let K=0;K<6;K++){se=re[K].mipmaps;for(let Te=0;Te<se.length;Te++){let Oe=se[Te];y.format!==cn?De!==null?P?q&&t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Te,0,0,Oe.width,Oe.height,De,Oe.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Te,Je,Oe.width,Oe.height,0,Oe.data):Ce("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):P?q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Te,0,0,Oe.width,Oe.height,De,Be,Oe.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Te,Je,Oe.width,Oe.height,0,De,Be,Oe.data)}}}else{if(se=y.mipmaps,P&&ne){se.length>0&&_e++;let K=vt(re[0]);t.texStorage2D(n.TEXTURE_CUBE_MAP,_e,Je,K.width,K.height)}for(let K=0;K<6;K++)if(ve){P?q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,0,0,re[K].width,re[K].height,De,Be,re[K].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,Je,re[K].width,re[K].height,0,De,Be,re[K].data);for(let Te=0;Te<se.length;Te++){let Mt=se[Te].image[K].image;P?q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Te+1,0,0,Mt.width,Mt.height,De,Be,Mt.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Te+1,Je,Mt.width,Mt.height,0,De,Be,Mt.data)}}else{P?q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,0,0,De,Be,re[K]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,Je,De,Be,re[K]);for(let Te=0;Te<se.length;Te++){let Oe=se[Te];P?q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Te+1,0,0,De,Be,Oe.image[K]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Te+1,Je,De,Be,Oe.image[K])}}}p(y)&&M(n.TEXTURE_CUBE_MAP),ee.__version=J.version,y.onUpdate&&y.onUpdate(y)}T.__version=y.version}function Pe(T,y,U,Y,J,ee){let ae=s.convert(U.format,U.colorSpace),X=s.convert(U.type),$=x(U.internalFormat,ae,X,U.normalized,U.colorSpace),me=i.get(y),ve=i.get(U);if(ve.__renderTarget=y,!me.__hasExternalTextures){let re=Math.max(1,y.width>>ee),te=Math.max(1,y.height>>ee);J===n.TEXTURE_3D||J===n.TEXTURE_2D_ARRAY?t.texImage3D(J,ee,$,re,te,y.depth,0,ae,X,null):t.texImage2D(J,ee,$,re,te,0,ae,X,null)}t.bindFramebuffer(n.FRAMEBUFFER,T),qe(y)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,Y,J,ve.__webglTexture,0,Ct(y)):(J===n.TEXTURE_2D||J>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&J<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,Y,J,ve.__webglTexture,ee),t.bindFramebuffer(n.FRAMEBUFFER,null)}function mt(T,y,U){if(n.bindRenderbuffer(n.RENDERBUFFER,T),y.depthBuffer){let Y=y.depthTexture,J=Y&&Y.isDepthTexture?Y.type:null,ee=w(y.stencilBuffer,J),ae=y.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;qe(y)?o.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Ct(y),ee,y.width,y.height):U?n.renderbufferStorageMultisample(n.RENDERBUFFER,Ct(y),ee,y.width,y.height):n.renderbufferStorage(n.RENDERBUFFER,ee,y.width,y.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,ae,n.RENDERBUFFER,T)}else{let Y=y.textures;for(let J=0;J<Y.length;J++){let ee=Y[J],ae=s.convert(ee.format,ee.colorSpace),X=s.convert(ee.type),$=x(ee.internalFormat,ae,X,ee.normalized,ee.colorSpace);qe(y)?o.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Ct(y),$,y.width,y.height):U?n.renderbufferStorageMultisample(n.RENDERBUFFER,Ct(y),$,y.width,y.height):n.renderbufferStorage(n.RENDERBUFFER,$,y.width,y.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function Xe(T,y,U){let Y=y.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(n.FRAMEBUFFER,T),!(y.depthTexture&&y.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let J=i.get(y.depthTexture);if(J.__renderTarget=y,(!J.__webglTexture||y.depthTexture.image.width!==y.width||y.depthTexture.image.height!==y.height)&&(y.depthTexture.image.width=y.width,y.depthTexture.image.height=y.height,y.depthTexture.needsUpdate=!0),Y){if(J.__webglInit===void 0&&(J.__webglInit=!0,y.depthTexture.addEventListener("dispose",C)),J.__webglTexture===void 0){J.__webglTexture=n.createTexture(),t.bindTexture(n.TEXTURE_CUBE_MAP,J.__webglTexture),ke(n.TEXTURE_CUBE_MAP,y.depthTexture);let me=s.convert(y.depthTexture.format),ve=s.convert(y.depthTexture.type),re;y.depthTexture.format===An?re=n.DEPTH_COMPONENT24:y.depthTexture.format===yi&&(re=n.DEPTH24_STENCIL8);for(let te=0;te<6;te++)n.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,re,y.width,y.height,0,me,ve,null)}}else j(y.depthTexture,0);let ee=J.__webglTexture,ae=Ct(y),X=Y?n.TEXTURE_CUBE_MAP_POSITIVE_X+U:n.TEXTURE_2D,$=y.depthTexture.format===yi?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;if(y.depthTexture.format===An)qe(y)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,$,X,ee,0,ae):n.framebufferTexture2D(n.FRAMEBUFFER,$,X,ee,0);else if(y.depthTexture.format===yi)qe(y)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,$,X,ee,0,ae):n.framebufferTexture2D(n.FRAMEBUFFER,$,X,ee,0);else throw new Error("Unknown depthTexture format")}function tt(T){let y=i.get(T),U=T.isWebGLCubeRenderTarget===!0;if(y.__boundDepthTexture!==T.depthTexture){let Y=T.depthTexture;if(y.__depthDisposeCallback&&y.__depthDisposeCallback(),Y){let J=()=>{delete y.__boundDepthTexture,delete y.__depthDisposeCallback,Y.removeEventListener("dispose",J)};Y.addEventListener("dispose",J),y.__depthDisposeCallback=J}y.__boundDepthTexture=Y}if(T.depthTexture&&!y.__autoAllocateDepthBuffer)if(U)for(let Y=0;Y<6;Y++)Xe(y.__webglFramebuffer[Y],T,Y);else{let Y=T.texture.mipmaps;Y&&Y.length>0?Xe(y.__webglFramebuffer[0],T,0):Xe(y.__webglFramebuffer,T,0)}else if(U){y.__webglDepthbuffer=[];for(let Y=0;Y<6;Y++)if(t.bindFramebuffer(n.FRAMEBUFFER,y.__webglFramebuffer[Y]),y.__webglDepthbuffer[Y]===void 0)y.__webglDepthbuffer[Y]=n.createRenderbuffer(),mt(y.__webglDepthbuffer[Y],T,!1);else{let J=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ee=y.__webglDepthbuffer[Y];n.bindRenderbuffer(n.RENDERBUFFER,ee),n.framebufferRenderbuffer(n.FRAMEBUFFER,J,n.RENDERBUFFER,ee)}}else{let Y=T.texture.mipmaps;if(Y&&Y.length>0?t.bindFramebuffer(n.FRAMEBUFFER,y.__webglFramebuffer[0]):t.bindFramebuffer(n.FRAMEBUFFER,y.__webglFramebuffer),y.__webglDepthbuffer===void 0)y.__webglDepthbuffer=n.createRenderbuffer(),mt(y.__webglDepthbuffer,T,!1);else{let J=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ee=y.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,ee),n.framebufferRenderbuffer(n.FRAMEBUFFER,J,n.RENDERBUFFER,ee)}}t.bindFramebuffer(n.FRAMEBUFFER,null)}function ht(T,y,U){let Y=i.get(T);y!==void 0&&Pe(Y.__webglFramebuffer,T,T.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),U!==void 0&&tt(T)}function Ve(T){let y=T.texture,U=i.get(T),Y=i.get(y);T.addEventListener("dispose",v);let J=T.textures,ee=T.isWebGLCubeRenderTarget===!0,ae=J.length>1;if(ae||(Y.__webglTexture===void 0&&(Y.__webglTexture=n.createTexture()),Y.__version=y.version,a.memory.textures++),ee){U.__webglFramebuffer=[];for(let X=0;X<6;X++)if(y.mipmaps&&y.mipmaps.length>0){U.__webglFramebuffer[X]=[];for(let $=0;$<y.mipmaps.length;$++)U.__webglFramebuffer[X][$]=n.createFramebuffer()}else U.__webglFramebuffer[X]=n.createFramebuffer()}else{if(y.mipmaps&&y.mipmaps.length>0){U.__webglFramebuffer=[];for(let X=0;X<y.mipmaps.length;X++)U.__webglFramebuffer[X]=n.createFramebuffer()}else U.__webglFramebuffer=n.createFramebuffer();if(ae)for(let X=0,$=J.length;X<$;X++){let me=i.get(J[X]);me.__webglTexture===void 0&&(me.__webglTexture=n.createTexture(),a.memory.textures++)}if(T.samples>0&&qe(T)===!1){U.__webglMultisampledFramebuffer=n.createFramebuffer(),U.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,U.__webglMultisampledFramebuffer);for(let X=0;X<J.length;X++){let $=J[X];U.__webglColorRenderbuffer[X]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,U.__webglColorRenderbuffer[X]);let me=s.convert($.format,$.colorSpace),ve=s.convert($.type),re=x($.internalFormat,me,ve,$.normalized,$.colorSpace,T.isXRRenderTarget===!0),te=Ct(T);n.renderbufferStorageMultisample(n.RENDERBUFFER,te,re,T.width,T.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+X,n.RENDERBUFFER,U.__webglColorRenderbuffer[X])}n.bindRenderbuffer(n.RENDERBUFFER,null),T.depthBuffer&&(U.__webglDepthRenderbuffer=n.createRenderbuffer(),mt(U.__webglDepthRenderbuffer,T,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(ee){t.bindTexture(n.TEXTURE_CUBE_MAP,Y.__webglTexture),ke(n.TEXTURE_CUBE_MAP,y);for(let X=0;X<6;X++)if(y.mipmaps&&y.mipmaps.length>0)for(let $=0;$<y.mipmaps.length;$++)Pe(U.__webglFramebuffer[X][$],T,y,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+X,$);else Pe(U.__webglFramebuffer[X],T,y,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+X,0);p(y)&&M(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(ae){for(let X=0,$=J.length;X<$;X++){let me=J[X],ve=i.get(me),re=n.TEXTURE_2D;(T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&(re=T.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(re,ve.__webglTexture),ke(re,me),Pe(U.__webglFramebuffer,T,me,n.COLOR_ATTACHMENT0+X,re,0),p(me)&&M(re)}t.unbindTexture()}else{let X=n.TEXTURE_2D;if((T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&(X=T.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(X,Y.__webglTexture),ke(X,y),y.mipmaps&&y.mipmaps.length>0)for(let $=0;$<y.mipmaps.length;$++)Pe(U.__webglFramebuffer[$],T,y,n.COLOR_ATTACHMENT0,X,$);else Pe(U.__webglFramebuffer,T,y,n.COLOR_ATTACHMENT0,X,0);p(y)&&M(X),t.unbindTexture()}T.depthBuffer&&tt(T)}function At(T){let y=T.textures;for(let U=0,Y=y.length;U<Y;U++){let J=y[U];if(p(J)){let ee=_(T),ae=i.get(J).__webglTexture;t.bindTexture(ee,ae),M(ee),t.unbindTexture()}}}let gt=[],Yt=[];function D(T){if(T.samples>0){if(qe(T)===!1){let y=T.textures,U=T.width,Y=T.height,J=n.COLOR_BUFFER_BIT,ee=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ae=i.get(T),X=y.length>1;if(X)for(let me=0;me<y.length;me++)t.bindFramebuffer(n.FRAMEBUFFER,ae.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+me,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,ae.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+me,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,ae.__webglMultisampledFramebuffer);let $=T.texture.mipmaps;$&&$.length>0?t.bindFramebuffer(n.DRAW_FRAMEBUFFER,ae.__webglFramebuffer[0]):t.bindFramebuffer(n.DRAW_FRAMEBUFFER,ae.__webglFramebuffer);for(let me=0;me<y.length;me++){if(T.resolveDepthBuffer&&(T.depthBuffer&&(J|=n.DEPTH_BUFFER_BIT),T.stencilBuffer&&T.resolveStencilBuffer&&(J|=n.STENCIL_BUFFER_BIT)),X){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,ae.__webglColorRenderbuffer[me]);let ve=i.get(y[me]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,ve,0)}n.blitFramebuffer(0,0,U,Y,0,0,U,Y,J,n.NEAREST),l===!0&&(gt.length=0,Yt.length=0,gt.push(n.COLOR_ATTACHMENT0+me),T.depthBuffer&&T.resolveDepthBuffer===!1&&(gt.push(ee),Yt.push(ee),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,Yt)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,gt))}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),X)for(let me=0;me<y.length;me++){t.bindFramebuffer(n.FRAMEBUFFER,ae.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+me,n.RENDERBUFFER,ae.__webglColorRenderbuffer[me]);let ve=i.get(y[me]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,ae.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+me,n.TEXTURE_2D,ve,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,ae.__webglMultisampledFramebuffer)}else if(T.depthBuffer&&T.resolveDepthBuffer===!1&&l){let y=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[y])}}}function Ct(T){return Math.min(r.maxSamples,T.samples)}function qe(T){let y=i.get(T);return T.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&y.__useRenderToTexture!==!1}function lt(T){let y=a.render.frame;u.get(T)!==y&&(u.set(T,y),T.update())}function le(T,y){let U=T.colorSpace,Y=T.format,J=T.type;return T.isCompressedTexture===!0||T.isVideoTexture===!0||U!==Wr&&U!==$n&&(Ye.getTransfer(U)===Qe?(Y!==cn||J!==rn)&&Ce("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Re("WebGLTextures: Unsupported texture color space:",U)),y}function vt(T){return typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement?(h.width=T.naturalWidth||T.width,h.height=T.naturalHeight||T.height):typeof VideoFrame<"u"&&T instanceof VideoFrame?(h.width=T.displayWidth,h.height=T.displayHeight):(h.width=T.width,h.height=T.height),h}this.allocateTextureUnit=H,this.resetTextureUnits=G,this.getTextureUnits=W,this.setTextureUnits=N,this.setTexture2D=j,this.setTexture2DArray=Q,this.setTexture3D=he,this.setTextureCube=be,this.rebindTextures=ht,this.setupRenderTarget=Ve,this.updateRenderTargetMipmap=At,this.updateMultisampleRenderTarget=D,this.setupDepthRenderbuffer=tt,this.setupFrameBufferTexture=Pe,this.useMultisampledRTT=qe,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function R_(n,e){function t(i,r=$n){let s,a=Ye.getTransfer(r);if(i===rn)return n.UNSIGNED_BYTE;if(i===ro)return n.UNSIGNED_SHORT_4_4_4_4;if(i===so)return n.UNSIGNED_SHORT_5_5_5_1;if(i===ac)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===oc)return n.UNSIGNED_INT_10F_11F_11F_REV;if(i===rc)return n.BYTE;if(i===sc)return n.SHORT;if(i===wr)return n.UNSIGNED_SHORT;if(i===io)return n.INT;if(i===yn)return n.UNSIGNED_INT;if(i===xn)return n.FLOAT;if(i===Dn)return n.HALF_FLOAT;if(i===lc)return n.ALPHA;if(i===cc)return n.RGB;if(i===cn)return n.RGBA;if(i===An)return n.DEPTH_COMPONENT;if(i===yi)return n.DEPTH_STENCIL;if(i===hc)return n.RED;if(i===ao)return n.RED_INTEGER;if(i===xi)return n.RG;if(i===oo)return n.RG_INTEGER;if(i===lo)return n.RGBA_INTEGER;if(i===_s||i===ys||i===xs||i===vs)if(a===Qe)if(s=e.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(i===_s)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===ys)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===xs)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===vs)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=e.get("WEBGL_compressed_texture_s3tc"),s!==null){if(i===_s)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===ys)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===xs)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===vs)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===co||i===ho||i===uo||i===fo)if(s=e.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(i===co)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===ho)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===uo)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===fo)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===po||i===mo||i===go||i===_o||i===yo||i===Ss||i===xo)if(s=e.get("WEBGL_compressed_texture_etc"),s!==null){if(i===po||i===mo)return a===Qe?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(i===go)return a===Qe?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC;if(i===_o)return s.COMPRESSED_R11_EAC;if(i===yo)return s.COMPRESSED_SIGNED_R11_EAC;if(i===Ss)return s.COMPRESSED_RG11_EAC;if(i===xo)return s.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===vo||i===So||i===bo||i===Mo||i===To||i===Eo||i===wo||i===Ao||i===Co||i===Ro||i===Io||i===Po||i===Do||i===Lo)if(s=e.get("WEBGL_compressed_texture_astc"),s!==null){if(i===vo)return a===Qe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===So)return a===Qe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===bo)return a===Qe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===Mo)return a===Qe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===To)return a===Qe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===Eo)return a===Qe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===wo)return a===Qe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===Ao)return a===Qe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===Co)return a===Qe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===Ro)return a===Qe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===Io)return a===Qe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===Po)return a===Qe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===Do)return a===Qe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===Lo)return a===Qe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===Fo||i===No||i===Oo)if(s=e.get("EXT_texture_compression_bptc"),s!==null){if(i===Fo)return a===Qe?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===No)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===Oo)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===Uo||i===ko||i===bs||i===Bo)if(s=e.get("EXT_texture_compression_rgtc"),s!==null){if(i===Uo)return s.COMPRESSED_RED_RGTC1_EXT;if(i===ko)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===bs)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===Bo)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===Ar?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:t}}var I_=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,P_=`
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

}`,Pc=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let i=new es(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=i}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,i=new tn({vertexShader:I_,fragmentShader:P_,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new dt(new en(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Dc=class extends Cn{constructor(e,t){super();let i=this,r=null,s=1,a=null,o="local-floor",l=1,h=null,u=null,d=null,f=null,c=null,g=null,S=typeof XRWebGLBinding<"u",m=new Pc,p={},M=t.getContextAttributes(),_=null,x=null,w=[],E=[],C=new xe,v=null,A=new Wt;A.viewport=new bt;let L=new Wt;L.viewport=new bt;let I=[A,L],O=new Qa,G=null,W=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Z){let pe=w[Z];return pe===void 0&&(pe=new pr,w[Z]=pe),pe.getTargetRaySpace()},this.getControllerGrip=function(Z){let pe=w[Z];return pe===void 0&&(pe=new pr,w[Z]=pe),pe.getGripSpace()},this.getHand=function(Z){let pe=w[Z];return pe===void 0&&(pe=new pr,w[Z]=pe),pe.getHandSpace()};function N(Z){let pe=E.indexOf(Z.inputSource);if(pe===-1)return;let ie=w[pe];ie!==void 0&&(ie.update(Z.inputSource,Z.frame,h||a),ie.dispatchEvent({type:Z.type,data:Z.inputSource}))}function H(){r.removeEventListener("select",N),r.removeEventListener("selectstart",N),r.removeEventListener("selectend",N),r.removeEventListener("squeeze",N),r.removeEventListener("squeezestart",N),r.removeEventListener("squeezeend",N),r.removeEventListener("end",H),r.removeEventListener("inputsourceschange",V);for(let Z=0;Z<w.length;Z++){let pe=E[Z];pe!==null&&(E[Z]=null,w[Z].disconnect(pe))}G=null,W=null,m.reset();for(let Z in p)delete p[Z];e.setRenderTarget(_),c=null,f=null,d=null,r=null,x=null,ke.stop(),i.isPresenting=!1,e.setPixelRatio(v),e.setSize(C.width,C.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Z){s=Z,i.isPresenting===!0&&Ce("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Z){o=Z,i.isPresenting===!0&&Ce("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return h||a},this.setReferenceSpace=function(Z){h=Z},this.getBaseLayer=function(){return f!==null?f:c},this.getBinding=function(){return d===null&&S&&(d=new XRWebGLBinding(r,t)),d},this.getFrame=function(){return g},this.getSession=function(){return r},this.setSession=async function(Z){if(r=Z,r!==null){if(_=e.getRenderTarget(),r.addEventListener("select",N),r.addEventListener("selectstart",N),r.addEventListener("selectend",N),r.addEventListener("squeeze",N),r.addEventListener("squeezestart",N),r.addEventListener("squeezeend",N),r.addEventListener("end",H),r.addEventListener("inputsourceschange",V),M.xrCompatible!==!0&&await t.makeXRCompatible(),v=e.getPixelRatio(),e.getSize(C),S&&"createProjectionLayer"in XRWebGLBinding.prototype){let ie=null,Ie=null,Ne=null;M.depth&&(Ne=M.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,ie=M.stencil?yi:An,Ie=M.stencil?Ar:yn);let Pe={colorFormat:t.RGBA8,depthFormat:Ne,scaleFactor:s};d=this.getBinding(),f=d.createProjectionLayer(Pe),r.updateRenderState({layers:[f]}),e.setPixelRatio(1),e.setSize(f.textureWidth,f.textureHeight,!1),x=new jt(f.textureWidth,f.textureHeight,{format:cn,type:rn,depthTexture:new Yn(f.textureWidth,f.textureHeight,Ie,void 0,void 0,void 0,void 0,void 0,void 0,ie),stencilBuffer:M.stencil,colorSpace:e.outputColorSpace,samples:M.antialias?4:0,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1})}else{let ie={antialias:M.antialias,alpha:!0,depth:M.depth,stencil:M.stencil,framebufferScaleFactor:s};c=new XRWebGLLayer(r,t,ie),r.updateRenderState({baseLayer:c}),e.setPixelRatio(1),e.setSize(c.framebufferWidth,c.framebufferHeight,!1),x=new jt(c.framebufferWidth,c.framebufferHeight,{format:cn,type:rn,colorSpace:e.outputColorSpace,stencilBuffer:M.stencil,resolveDepthBuffer:c.ignoreDepthValues===!1,resolveStencilBuffer:c.ignoreDepthValues===!1})}x.isXRRenderTarget=!0,this.setFoveation(l),h=null,a=await r.requestReferenceSpace(o),ke.setContext(r),ke.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function V(Z){for(let pe=0;pe<Z.removed.length;pe++){let ie=Z.removed[pe],Ie=E.indexOf(ie);Ie>=0&&(E[Ie]=null,w[Ie].disconnect(ie))}for(let pe=0;pe<Z.added.length;pe++){let ie=Z.added[pe],Ie=E.indexOf(ie);if(Ie===-1){for(let Pe=0;Pe<w.length;Pe++)if(Pe>=E.length){E.push(ie),Ie=Pe;break}else if(E[Pe]===null){E[Pe]=ie,Ie=Pe;break}if(Ie===-1)break}let Ne=w[Ie];Ne&&Ne.connect(ie)}}let j=new R,Q=new R;function he(Z,pe,ie){j.setFromMatrixPosition(pe.matrixWorld),Q.setFromMatrixPosition(ie.matrixWorld);let Ie=j.distanceTo(Q),Ne=pe.projectionMatrix.elements,Pe=ie.projectionMatrix.elements,mt=Ne[14]/(Ne[10]-1),Xe=Ne[14]/(Ne[10]+1),tt=(Ne[9]+1)/Ne[5],ht=(Ne[9]-1)/Ne[5],Ve=(Ne[8]-1)/Ne[0],At=(Pe[8]+1)/Pe[0],gt=mt*Ve,Yt=mt*At,D=Ie/(-Ve+At),Ct=D*-Ve;if(pe.matrixWorld.decompose(Z.position,Z.quaternion,Z.scale),Z.translateX(Ct),Z.translateZ(D),Z.matrixWorld.compose(Z.position,Z.quaternion,Z.scale),Z.matrixWorldInverse.copy(Z.matrixWorld).invert(),Ne[10]===-1)Z.projectionMatrix.copy(pe.projectionMatrix),Z.projectionMatrixInverse.copy(pe.projectionMatrixInverse);else{let qe=mt+D,lt=Xe+D,le=gt-Ct,vt=Yt+(Ie-Ct),T=tt*Xe/lt*qe,y=ht*Xe/lt*qe;Z.projectionMatrix.makePerspective(le,vt,T,y,qe,lt),Z.projectionMatrixInverse.copy(Z.projectionMatrix).invert()}}function be(Z,pe){pe===null?Z.matrixWorld.copy(Z.matrix):Z.matrixWorld.multiplyMatrices(pe.matrixWorld,Z.matrix),Z.matrixWorldInverse.copy(Z.matrixWorld).invert()}this.updateCamera=function(Z){if(r===null)return;let pe=Z.near,ie=Z.far;m.texture!==null&&(m.depthNear>0&&(pe=m.depthNear),m.depthFar>0&&(ie=m.depthFar)),O.near=L.near=A.near=pe,O.far=L.far=A.far=ie,(G!==O.near||W!==O.far)&&(r.updateRenderState({depthNear:O.near,depthFar:O.far}),G=O.near,W=O.far),O.layers.mask=Z.layers.mask|6,A.layers.mask=O.layers.mask&-5,L.layers.mask=O.layers.mask&-3;let Ie=Z.parent,Ne=O.cameras;be(O,Ie);for(let Pe=0;Pe<Ne.length;Pe++)be(Ne[Pe],Ie);Ne.length===2?he(O,A,L):O.projectionMatrix.copy(A.projectionMatrix),we(Z,O,Ie)};function we(Z,pe,ie){ie===null?Z.matrix.copy(pe.matrixWorld):(Z.matrix.copy(ie.matrixWorld),Z.matrix.invert(),Z.matrix.multiply(pe.matrixWorld)),Z.matrix.decompose(Z.position,Z.quaternion,Z.scale),Z.updateMatrixWorld(!0),Z.projectionMatrix.copy(pe.projectionMatrix),Z.projectionMatrixInverse.copy(pe.projectionMatrixInverse),Z.isPerspectiveCamera&&(Z.fov=wa*2*Math.atan(1/Z.projectionMatrix.elements[5]),Z.zoom=1)}this.getCamera=function(){return O},this.getFoveation=function(){if(!(f===null&&c===null))return l},this.setFoveation=function(Z){l=Z,f!==null&&(f.fixedFoveation=Z),c!==null&&c.fixedFoveation!==void 0&&(c.fixedFoveation=Z)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(O)},this.getCameraTexture=function(Z){return p[Z]};let $e=null;function et(Z,pe){if(u=pe.getViewerPose(h||a),g=pe,u!==null){let ie=u.views;c!==null&&(e.setRenderTargetFramebuffer(x,c.framebuffer),e.setRenderTarget(x));let Ie=!1;ie.length!==O.cameras.length&&(O.cameras.length=0,Ie=!0);for(let Xe=0;Xe<ie.length;Xe++){let tt=ie[Xe],ht=null;if(c!==null)ht=c.getViewport(tt);else{let At=d.getViewSubImage(f,tt);ht=At.viewport,Xe===0&&(e.setRenderTargetTextures(x,At.colorTexture,At.depthStencilTexture),e.setRenderTarget(x))}let Ve=I[Xe];Ve===void 0&&(Ve=new Wt,Ve.layers.enable(Xe),Ve.viewport=new bt,I[Xe]=Ve),Ve.matrix.fromArray(tt.transform.matrix),Ve.matrix.decompose(Ve.position,Ve.quaternion,Ve.scale),Ve.projectionMatrix.fromArray(tt.projectionMatrix),Ve.projectionMatrixInverse.copy(Ve.projectionMatrix).invert(),Ve.viewport.set(ht.x,ht.y,ht.width,ht.height),Xe===0&&(O.matrix.copy(Ve.matrix),O.matrix.decompose(O.position,O.quaternion,O.scale)),Ie===!0&&O.cameras.push(Ve)}let Ne=r.enabledFeatures;if(Ne&&Ne.includes("depth-sensing")&&r.depthUsage=="gpu-optimized"&&S){d=i.getBinding();let Xe=d.getDepthInformation(ie[0]);Xe&&Xe.isValid&&Xe.texture&&m.init(Xe,r.renderState)}if(Ne&&Ne.includes("camera-access")&&S){e.state.unbindTexture(),d=i.getBinding();for(let Xe=0;Xe<ie.length;Xe++){let tt=ie[Xe].camera;if(tt){let ht=p[tt];ht||(ht=new es,p[tt]=ht);let Ve=d.getCameraImage(tt);ht.sourceTexture=Ve}}}}for(let ie=0;ie<w.length;ie++){let Ie=E[ie],Ne=w[ie];Ie!==null&&Ne!==void 0&&Ne.update(Ie,pe,h||a)}$e&&$e(Z,pe),pe.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:pe}),g=null}let ke=new ed;ke.setAnimationLoop(et),this.setAnimationLoop=function(Z){$e=Z},this.dispose=function(){}}},D_=new ft,ad=new Fe;ad.set(-1,0,0,0,1,0,0,0,1);function L_(n,e){function t(m,p){m.matrixAutoUpdate===!0&&m.updateMatrix(),p.value.copy(m.matrix)}function i(m,p){p.color.getRGB(m.fogColor.value,pc(n)),p.isFog?(m.fogNear.value=p.near,m.fogFar.value=p.far):p.isFogExp2&&(m.fogDensity.value=p.density)}function r(m,p,M,_,x){p.isNodeMaterial?p.uniformsNeedUpdate=!1:p.isMeshBasicMaterial?s(m,p):p.isMeshLambertMaterial?(s(m,p),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)):p.isMeshToonMaterial?(s(m,p),d(m,p)):p.isMeshPhongMaterial?(s(m,p),u(m,p),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)):p.isMeshStandardMaterial?(s(m,p),f(m,p),p.isMeshPhysicalMaterial&&c(m,p,x)):p.isMeshMatcapMaterial?(s(m,p),g(m,p)):p.isMeshDepthMaterial?s(m,p):p.isMeshDistanceMaterial?(s(m,p),S(m,p)):p.isMeshNormalMaterial?s(m,p):p.isLineBasicMaterial?(a(m,p),p.isLineDashedMaterial&&o(m,p)):p.isPointsMaterial?l(m,p,M,_):p.isSpriteMaterial?h(m,p):p.isShadowMaterial?(m.color.value.copy(p.color),m.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function s(m,p){m.opacity.value=p.opacity,p.color&&m.diffuse.value.copy(p.color),p.emissive&&m.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.bumpMap&&(m.bumpMap.value=p.bumpMap,t(p.bumpMap,m.bumpMapTransform),m.bumpScale.value=p.bumpScale,p.side===Vt&&(m.bumpScale.value*=-1)),p.normalMap&&(m.normalMap.value=p.normalMap,t(p.normalMap,m.normalMapTransform),m.normalScale.value.copy(p.normalScale),p.side===Vt&&m.normalScale.value.negate()),p.displacementMap&&(m.displacementMap.value=p.displacementMap,t(p.displacementMap,m.displacementMapTransform),m.displacementScale.value=p.displacementScale,m.displacementBias.value=p.displacementBias),p.emissiveMap&&(m.emissiveMap.value=p.emissiveMap,t(p.emissiveMap,m.emissiveMapTransform)),p.specularMap&&(m.specularMap.value=p.specularMap,t(p.specularMap,m.specularMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest);let M=e.get(p),_=M.envMap,x=M.envMapRotation;_&&(m.envMap.value=_,m.envMapRotation.value.setFromMatrix4(D_.makeRotationFromEuler(x)).transpose(),_.isCubeTexture&&_.isRenderTargetTexture===!1&&m.envMapRotation.value.premultiply(ad),m.reflectivity.value=p.reflectivity,m.ior.value=p.ior,m.refractionRatio.value=p.refractionRatio),p.lightMap&&(m.lightMap.value=p.lightMap,m.lightMapIntensity.value=p.lightMapIntensity,t(p.lightMap,m.lightMapTransform)),p.aoMap&&(m.aoMap.value=p.aoMap,m.aoMapIntensity.value=p.aoMapIntensity,t(p.aoMap,m.aoMapTransform))}function a(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform))}function o(m,p){m.dashSize.value=p.dashSize,m.totalSize.value=p.dashSize+p.gapSize,m.scale.value=p.scale}function l(m,p,M,_){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.size.value=p.size*M,m.scale.value=_*.5,p.map&&(m.map.value=p.map,t(p.map,m.uvTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function h(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.rotation.value=p.rotation,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function u(m,p){m.specular.value.copy(p.specular),m.shininess.value=Math.max(p.shininess,1e-4)}function d(m,p){p.gradientMap&&(m.gradientMap.value=p.gradientMap)}function f(m,p){m.metalness.value=p.metalness,p.metalnessMap&&(m.metalnessMap.value=p.metalnessMap,t(p.metalnessMap,m.metalnessMapTransform)),m.roughness.value=p.roughness,p.roughnessMap&&(m.roughnessMap.value=p.roughnessMap,t(p.roughnessMap,m.roughnessMapTransform)),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)}function c(m,p,M){m.ior.value=p.ior,p.sheen>0&&(m.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),m.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(m.sheenColorMap.value=p.sheenColorMap,t(p.sheenColorMap,m.sheenColorMapTransform)),p.sheenRoughnessMap&&(m.sheenRoughnessMap.value=p.sheenRoughnessMap,t(p.sheenRoughnessMap,m.sheenRoughnessMapTransform))),p.clearcoat>0&&(m.clearcoat.value=p.clearcoat,m.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(m.clearcoatMap.value=p.clearcoatMap,t(p.clearcoatMap,m.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,t(p.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(m.clearcoatNormalMap.value=p.clearcoatNormalMap,t(p.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===Vt&&m.clearcoatNormalScale.value.negate())),p.dispersion>0&&(m.dispersion.value=p.dispersion),p.iridescence>0&&(m.iridescence.value=p.iridescence,m.iridescenceIOR.value=p.iridescenceIOR,m.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(m.iridescenceMap.value=p.iridescenceMap,t(p.iridescenceMap,m.iridescenceMapTransform)),p.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=p.iridescenceThicknessMap,t(p.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),p.transmission>0&&(m.transmission.value=p.transmission,m.transmissionSamplerMap.value=M.texture,m.transmissionSamplerSize.value.set(M.width,M.height),p.transmissionMap&&(m.transmissionMap.value=p.transmissionMap,t(p.transmissionMap,m.transmissionMapTransform)),m.thickness.value=p.thickness,p.thicknessMap&&(m.thicknessMap.value=p.thicknessMap,t(p.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=p.attenuationDistance,m.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(m.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(m.anisotropyMap.value=p.anisotropyMap,t(p.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=p.specularIntensity,m.specularColor.value.copy(p.specularColor),p.specularColorMap&&(m.specularColorMap.value=p.specularColorMap,t(p.specularColorMap,m.specularColorMapTransform)),p.specularIntensityMap&&(m.specularIntensityMap.value=p.specularIntensityMap,t(p.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,p){p.matcap&&(m.matcap.value=p.matcap)}function S(m,p){let M=e.get(p).light;m.referencePosition.value.setFromMatrixPosition(M.matrixWorld),m.nearDistance.value=M.shadow.camera.near,m.farDistance.value=M.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function F_(n,e,t,i){let r={},s={},a=[],o=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function l(M,_){let x=_.program;i.uniformBlockBinding(M,x)}function h(M,_){let x=r[M.id];x===void 0&&(g(M),x=u(M),r[M.id]=x,M.addEventListener("dispose",m));let w=_.program;i.updateUBOMapping(M,w);let E=e.render.frame;s[M.id]!==E&&(f(M),s[M.id]=E)}function u(M){let _=d();M.__bindingPointIndex=_;let x=n.createBuffer(),w=M.__size,E=M.usage;return n.bindBuffer(n.UNIFORM_BUFFER,x),n.bufferData(n.UNIFORM_BUFFER,w,E),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,_,x),x}function d(){for(let M=0;M<o;M++)if(a.indexOf(M)===-1)return a.push(M),M;return Re("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function f(M){let _=r[M.id],x=M.uniforms,w=M.__cache;n.bindBuffer(n.UNIFORM_BUFFER,_);for(let E=0,C=x.length;E<C;E++){let v=Array.isArray(x[E])?x[E]:[x[E]];for(let A=0,L=v.length;A<L;A++){let I=v[A];if(c(I,E,A,w)===!0){let O=I.__offset,G=Array.isArray(I.value)?I.value:[I.value],W=0;for(let N=0;N<G.length;N++){let H=G[N],V=S(H);typeof H=="number"||typeof H=="boolean"?(I.__data[0]=H,n.bufferSubData(n.UNIFORM_BUFFER,O+W,I.__data)):H.isMatrix3?(I.__data[0]=H.elements[0],I.__data[1]=H.elements[1],I.__data[2]=H.elements[2],I.__data[3]=0,I.__data[4]=H.elements[3],I.__data[5]=H.elements[4],I.__data[6]=H.elements[5],I.__data[7]=0,I.__data[8]=H.elements[6],I.__data[9]=H.elements[7],I.__data[10]=H.elements[8],I.__data[11]=0):ArrayBuffer.isView(H)?I.__data.set(new H.constructor(H.buffer,H.byteOffset,I.__data.length)):(H.toArray(I.__data,W),W+=V.storage/Float32Array.BYTES_PER_ELEMENT)}n.bufferSubData(n.UNIFORM_BUFFER,O,I.__data)}}}n.bindBuffer(n.UNIFORM_BUFFER,null)}function c(M,_,x,w){let E=M.value,C=_+"_"+x;if(w[C]===void 0)return typeof E=="number"||typeof E=="boolean"?w[C]=E:ArrayBuffer.isView(E)?w[C]=E.slice():w[C]=E.clone(),!0;{let v=w[C];if(typeof E=="number"||typeof E=="boolean"){if(v!==E)return w[C]=E,!0}else{if(ArrayBuffer.isView(E))return!0;if(v.equals(E)===!1)return v.copy(E),!0}}return!1}function g(M){let _=M.uniforms,x=0,w=16;for(let C=0,v=_.length;C<v;C++){let A=Array.isArray(_[C])?_[C]:[_[C]];for(let L=0,I=A.length;L<I;L++){let O=A[L],G=Array.isArray(O.value)?O.value:[O.value];for(let W=0,N=G.length;W<N;W++){let H=G[W],V=S(H),j=x%w,Q=j%V.boundary,he=j+Q;x+=Q,he!==0&&w-he<V.storage&&(x+=w-he),O.__data=new Float32Array(V.storage/Float32Array.BYTES_PER_ELEMENT),O.__offset=x,x+=V.storage}}}let E=x%w;return E>0&&(x+=w-E),M.__size=x,M.__cache={},this}function S(M){let _={boundary:0,storage:0};return typeof M=="number"||typeof M=="boolean"?(_.boundary=4,_.storage=4):M.isVector2?(_.boundary=8,_.storage=8):M.isVector3||M.isColor?(_.boundary=16,_.storage=12):M.isVector4?(_.boundary=16,_.storage=16):M.isMatrix3?(_.boundary=48,_.storage=48):M.isMatrix4?(_.boundary=64,_.storage=64):M.isTexture?Ce("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(M)?(_.boundary=16,_.storage=M.byteLength):Ce("WebGLRenderer: Unsupported uniform value type.",M),_}function m(M){let _=M.target;_.removeEventListener("dispose",m);let x=a.indexOf(_.__bindingPointIndex);a.splice(x,1),n.deleteBuffer(r[_.id]),delete r[_.id],delete s[_.id]}function p(){for(let M in r)n.deleteBuffer(r[M]);a=[],r={},s={}}return{bind:l,update:h,dispose:p}}var N_=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),Ln=null;function O_(){return Ln===null&&(Ln=new Pa(N_,16,16,xi,Dn),Ln.name="DFG_LUT",Ln.minFilter=de,Ln.magFilter=de,Ln.wrapS=Jt,Ln.wrapT=Jt,Ln.generateMipmaps=!1,Ln.needsUpdate=!0),Ln}var ws=class{constructor(e={}){let{canvas:t=vu(),context:i=null,depth:r=!0,stencil:s=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:h=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:d=!1,reversedDepthBuffer:f=!1,outputBufferType:c=rn}=e;this.isWebGLRenderer=!0;let g;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");g=i.getContextAttributes().alpha}else g=a;let S=c,m=new Set([lo,oo,ao]),p=new Set([rn,yn,wr,Ar,ro,so]),M=new Uint32Array(4),_=new Int32Array(4),x=new R,w=null,E=null,C=[],v=[],A=null;this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=gn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let L=this,I=!1,O=null;this._outputColorSpace=Le;let G=0,W=0,N=null,H=-1,V=null,j=new bt,Q=new bt,he=null,be=new Ke(0),we=0,$e=t.width,et=t.height,ke=1,Z=null,pe=null,ie=new bt(0,0,$e,et),Ie=new bt(0,0,$e,et),Ne=!1,Pe=new jr,mt=!1,Xe=!1,tt=new ft,ht=new R,Ve=new bt,At={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},gt=!1;function Yt(){return N===null?ke:1}let D=i;function Ct(b,F){return t.getContext(b,F)}try{let b={alpha:!0,depth:r,stencil:s,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:h,powerPreference:u,failIfMajorPerformanceCaveat:d};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"184"}`),t.addEventListener("webglcontextlost",K,!1),t.addEventListener("webglcontextrestored",Te,!1),t.addEventListener("webglcontextcreationerror",Oe,!1),D===null){let F="webgl2";if(D=Ct(F,b),D===null)throw Ct(F)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(b){throw Re("WebGLRenderer: "+b.message),b}let qe,lt,le,vt,T,y,U,Y,J,ee,ae,X,$,me,ve,re,te,De,Be,Je,P,ne,q;function _e(){qe=new Gg(D),qe.init(),P=new R_(D,qe),lt=new Ng(D,qe,e,P),le=new A_(D,qe),lt.reversedDepthBuffer&&f&&le.buffers.depth.setReversed(!0),vt=new qg(D),T=new f_,y=new C_(D,qe,le,T,lt,P,vt),U=new Vg(L),Y=new Kf(D),ne=new Lg(D,Y),J=new Wg(D,Y,vt,ne),ee=new $g(D,J,Y,ne,vt),De=new Yg(D,lt,y),ve=new Og(T),ae=new d_(L,U,qe,lt,ne,ve),X=new L_(L,T),$=new m_,me=new S_(qe),te=new Dg(L,U,le,ee,g,l),re=new w_(L,ee,lt),q=new F_(D,vt,lt,le),Be=new Fg(D,qe,vt),Je=new Xg(D,qe,vt),vt.programs=ae.programs,L.capabilities=lt,L.extensions=qe,L.properties=T,L.renderLists=$,L.shadowMap=re,L.state=le,L.info=vt}_e(),S!==rn&&(A=new Kg(S,t.width,t.height,r,s));let se=new Dc(L,D);this.xr=se,this.getContext=function(){return D},this.getContextAttributes=function(){return D.getContextAttributes()},this.forceContextLoss=function(){let b=qe.get("WEBGL_lose_context");b&&b.loseContext()},this.forceContextRestore=function(){let b=qe.get("WEBGL_lose_context");b&&b.restoreContext()},this.getPixelRatio=function(){return ke},this.setPixelRatio=function(b){b!==void 0&&(ke=b,this.setSize($e,et,!1))},this.getSize=function(b){return b.set($e,et)},this.setSize=function(b,F,z=!0){if(se.isPresenting){Ce("WebGLRenderer: Can't change size while VR device is presenting.");return}$e=b,et=F,t.width=Math.floor(b*ke),t.height=Math.floor(F*ke),z===!0&&(t.style.width=b+"px",t.style.height=F+"px"),A!==null&&A.setSize(t.width,t.height),this.setViewport(0,0,b,F)},this.getDrawingBufferSize=function(b){return b.set($e*ke,et*ke).floor()},this.setDrawingBufferSize=function(b,F,z){$e=b,et=F,ke=z,t.width=Math.floor(b*z),t.height=Math.floor(F*z),this.setViewport(0,0,b,F)},this.setEffects=function(b){if(S===rn){Re("THREE.WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(b){for(let F=0;F<b.length;F++)if(b[F].isOutputPass===!0){Ce("THREE.WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}A.setEffects(b||[])},this.getCurrentViewport=function(b){return b.copy(j)},this.getViewport=function(b){return b.copy(ie)},this.setViewport=function(b,F,z,k){b.isVector4?ie.set(b.x,b.y,b.z,b.w):ie.set(b,F,z,k),le.viewport(j.copy(ie).multiplyScalar(ke).round())},this.getScissor=function(b){return b.copy(Ie)},this.setScissor=function(b,F,z,k){b.isVector4?Ie.set(b.x,b.y,b.z,b.w):Ie.set(b,F,z,k),le.scissor(Q.copy(Ie).multiplyScalar(ke).round())},this.getScissorTest=function(){return Ne},this.setScissorTest=function(b){le.setScissorTest(Ne=b)},this.setOpaqueSort=function(b){Z=b},this.setTransparentSort=function(b){pe=b},this.getClearColor=function(b){return b.copy(te.getClearColor())},this.setClearColor=function(){te.setClearColor(...arguments)},this.getClearAlpha=function(){return te.getClearAlpha()},this.setClearAlpha=function(){te.setClearAlpha(...arguments)},this.clear=function(b=!0,F=!0,z=!0){let k=0;if(b){let B=!1;if(N!==null){let fe=N.texture.format;B=m.has(fe)}if(B){let fe=N.texture.type,Se=p.has(fe),ue=te.getClearColor(),Me=te.getClearAlpha(),Ee=ue.r,Ue=ue.g,ze=ue.b;Se?(M[0]=Ee,M[1]=Ue,M[2]=ze,M[3]=Me,D.clearBufferuiv(D.COLOR,0,M)):(_[0]=Ee,_[1]=Ue,_[2]=ze,_[3]=Me,D.clearBufferiv(D.COLOR,0,_))}else k|=D.COLOR_BUFFER_BIT}F&&(k|=D.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),z&&(k|=D.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),k!==0&&D.clear(k)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(b){b.setRenderer(this),O=b},this.dispose=function(){t.removeEventListener("webglcontextlost",K,!1),t.removeEventListener("webglcontextrestored",Te,!1),t.removeEventListener("webglcontextcreationerror",Oe,!1),te.dispose(),$.dispose(),me.dispose(),T.dispose(),U.dispose(),ee.dispose(),ne.dispose(),q.dispose(),ae.dispose(),se.dispose(),se.removeEventListener("sessionstart",th),se.removeEventListener("sessionend",nh),wi.stop()};function K(b){b.preventDefault(),Yr("WebGLRenderer: Context Lost."),I=!0}function Te(){Yr("WebGLRenderer: Context Restored."),I=!1;let b=vt.autoReset,F=re.enabled,z=re.autoUpdate,k=re.needsUpdate,B=re.type;_e(),vt.autoReset=b,re.enabled=F,re.autoUpdate=z,re.needsUpdate=k,re.type=B}function Oe(b){Re("WebGLRenderer: A WebGL context could not be created. Reason: ",b.statusMessage)}function Mt(b){let F=b.target;F.removeEventListener("dispose",Mt),nt(F)}function nt(b){On(b),T.remove(b)}function On(b){let F=T.get(b).programs;F!==void 0&&(F.forEach(function(z){ae.releaseProgram(z)}),b.isShaderMaterial&&ae.releaseShaderCache(b))}this.renderBufferDirect=function(b,F,z,k,B,fe){F===null&&(F=At);let Se=B.isMesh&&B.matrixWorld.determinant()<0,ue=kd(b,F,z,k,B);le.setMaterial(k,Se);let Me=z.index,Ee=1;if(k.wireframe===!0){if(Me=J.getWireframeAttribute(z),Me===void 0)return;Ee=2}let Ue=z.drawRange,ze=z.attributes.position,Ae=Ue.start*Ee,it=(Ue.start+Ue.count)*Ee;fe!==null&&(Ae=Math.max(Ae,fe.start*Ee),it=Math.min(it,(fe.start+fe.count)*Ee)),Me!==null?(Ae=Math.max(Ae,0),it=Math.min(it,Me.count)):ze!=null&&(Ae=Math.max(Ae,0),it=Math.min(it,ze.count));let Tt=it-Ae;if(Tt<0||Tt===1/0)return;ne.setup(B,k,ue,z,Me);let St,at=Be;if(Me!==null&&(St=Y.get(Me),at=Je,at.setIndex(St)),B.isMesh)k.wireframe===!0?(le.setLineWidth(k.wireframeLinewidth*Yt()),at.setMode(D.LINES)):at.setMode(D.TRIANGLES);else if(B.isLine){let Ot=k.linewidth;Ot===void 0&&(Ot=1),le.setLineWidth(Ot*Yt()),B.isLineSegments?at.setMode(D.LINES):B.isLineLoop?at.setMode(D.LINE_LOOP):at.setMode(D.LINE_STRIP)}else B.isPoints?at.setMode(D.POINTS):B.isSprite&&at.setMode(D.TRIANGLES);if(B.isBatchedMesh)if(qe.get("WEBGL_multi_draw"))at.renderMultiDraw(B._multiDrawStarts,B._multiDrawCounts,B._multiDrawCount);else{let Ot=B._multiDrawStarts,ye=B._multiDrawCounts,$t=B._multiDrawCount,Ze=Me?Y.get(Me).bytesPerElement:1,on=T.get(k).currentProgram.getUniforms();for(let Mn=0;Mn<$t;Mn++)on.setValue(D,"_gl_DrawID",Mn),at.render(Ot[Mn]/Ze,ye[Mn])}else if(B.isInstancedMesh)at.renderInstances(Ae,Tt,B.count);else if(z.isInstancedBufferGeometry){let Ot=z._maxInstanceCount!==void 0?z._maxInstanceCount:1/0,ye=Math.min(z.instanceCount,Ot);at.renderInstances(Ae,Tt,ye)}else at.render(Ae,Tt)};function bn(b,F,z){b.transparent===!0&&b.side===Bt&&b.forceSinglePass===!1?(b.side=Vt,b.needsUpdate=!0,Os(b,F,z),b.side=Xn,b.needsUpdate=!0,Os(b,F,z),b.side=Bt):Os(b,F,z)}this.compile=function(b,F,z=null){z===null&&(z=b),E=me.get(z),E.init(F),v.push(E),z.traverseVisible(function(B){B.isLight&&B.layers.test(F.layers)&&(E.pushLight(B),B.castShadow&&E.pushShadow(B))}),b!==z&&b.traverseVisible(function(B){B.isLight&&B.layers.test(F.layers)&&(E.pushLight(B),B.castShadow&&E.pushShadow(B))}),E.setupLights();let k=new Set;return b.traverse(function(B){if(!(B.isMesh||B.isPoints||B.isLine||B.isSprite))return;let fe=B.material;if(fe)if(Array.isArray(fe))for(let Se=0;Se<fe.length;Se++){let ue=fe[Se];bn(ue,z,B),k.add(ue)}else bn(fe,z,B),k.add(fe)}),E=v.pop(),k},this.compileAsync=function(b,F,z=null){let k=this.compile(b,F,z);return new Promise(B=>{function fe(){if(k.forEach(function(Se){T.get(Se).currentProgram.isReady()&&k.delete(Se)}),k.size===0){B(b);return}setTimeout(fe,10)}qe.get("KHR_parallel_shader_compile")!==null?fe():setTimeout(fe,10)})};let il=null;function Od(b){il&&il(b)}function th(){wi.stop()}function nh(){wi.start()}let wi=new ed;wi.setAnimationLoop(Od),typeof self<"u"&&wi.setContext(self),this.setAnimationLoop=function(b){il=b,se.setAnimationLoop(b),b===null?wi.stop():wi.start()},se.addEventListener("sessionstart",th),se.addEventListener("sessionend",nh),this.render=function(b,F){if(F!==void 0&&F.isCamera!==!0){Re("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(I===!0)return;O!==null&&O.renderStart(b,F);let z=se.enabled===!0&&se.isPresenting===!0,k=A!==null&&(N===null||z)&&A.begin(L,N);if(b.matrixWorldAutoUpdate===!0&&b.updateMatrixWorld(),F.parent===null&&F.matrixWorldAutoUpdate===!0&&F.updateMatrixWorld(),se.enabled===!0&&se.isPresenting===!0&&(A===null||A.isCompositing()===!1)&&(se.cameraAutoUpdate===!0&&se.updateCamera(F),F=se.getCamera()),b.isScene===!0&&b.onBeforeRender(L,b,F,N),E=me.get(b,v.length),E.init(F),E.state.textureUnits=y.getTextureUnits(),v.push(E),tt.multiplyMatrices(F.projectionMatrix,F.matrixWorldInverse),Pe.setFromProjectionMatrix(tt,fn,F.reversedDepth),Xe=this.localClippingEnabled,mt=ve.init(this.clippingPlanes,Xe),w=$.get(b,C.length),w.init(),C.push(w),se.enabled===!0&&se.isPresenting===!0){let Se=L.xr.getDepthSensingMesh();Se!==null&&rl(Se,F,-1/0,L.sortObjects)}rl(b,F,0,L.sortObjects),w.finish(),L.sortObjects===!0&&w.sort(Z,pe),gt=se.enabled===!1||se.isPresenting===!1||se.hasDepthSensing()===!1,gt&&te.addToRenderList(w,b),this.info.render.frame++,mt===!0&&ve.beginShadows();let B=E.state.shadowsArray;if(re.render(B,b,F),mt===!0&&ve.endShadows(),this.info.autoReset===!0&&this.info.reset(),(k&&A.hasRenderPass())===!1){let Se=w.opaque,ue=w.transmissive;if(E.setupLights(),F.isArrayCamera){let Me=F.cameras;if(ue.length>0)for(let Ee=0,Ue=Me.length;Ee<Ue;Ee++){let ze=Me[Ee];rh(Se,ue,b,ze)}gt&&te.render(b);for(let Ee=0,Ue=Me.length;Ee<Ue;Ee++){let ze=Me[Ee];ih(w,b,ze,ze.viewport)}}else ue.length>0&&rh(Se,ue,b,F),gt&&te.render(b),ih(w,b,F)}N!==null&&W===0&&(y.updateMultisampleRenderTarget(N),y.updateRenderTargetMipmap(N)),k&&A.end(L),b.isScene===!0&&b.onAfterRender(L,b,F),ne.resetDefaultState(),H=-1,V=null,v.pop(),v.length>0?(E=v[v.length-1],y.setTextureUnits(E.state.textureUnits),mt===!0&&ve.setGlobalState(L.clippingPlanes,E.state.camera)):E=null,C.pop(),C.length>0?w=C[C.length-1]:w=null,O!==null&&O.renderEnd()};function rl(b,F,z,k){if(b.visible===!1)return;if(b.layers.test(F.layers)){if(b.isGroup)z=b.renderOrder;else if(b.isLOD)b.autoUpdate===!0&&b.update(F);else if(b.isLightProbeGrid)E.pushLightProbeGrid(b);else if(b.isLight)E.pushLight(b),b.castShadow&&E.pushShadow(b);else if(b.isSprite){if(!b.frustumCulled||Pe.intersectsSprite(b)){k&&Ve.setFromMatrixPosition(b.matrixWorld).applyMatrix4(tt);let Se=ee.update(b),ue=b.material;ue.visible&&w.push(b,Se,ue,z,Ve.z,null)}}else if((b.isMesh||b.isLine||b.isPoints)&&(!b.frustumCulled||Pe.intersectsObject(b))){let Se=ee.update(b),ue=b.material;if(k&&(b.boundingSphere!==void 0?(b.boundingSphere===null&&b.computeBoundingSphere(),Ve.copy(b.boundingSphere.center)):(Se.boundingSphere===null&&Se.computeBoundingSphere(),Ve.copy(Se.boundingSphere.center)),Ve.applyMatrix4(b.matrixWorld).applyMatrix4(tt)),Array.isArray(ue)){let Me=Se.groups;for(let Ee=0,Ue=Me.length;Ee<Ue;Ee++){let ze=Me[Ee],Ae=ue[ze.materialIndex];Ae&&Ae.visible&&w.push(b,Se,Ae,z,Ve.z,ze)}}else ue.visible&&w.push(b,Se,ue,z,Ve.z,null)}}let fe=b.children;for(let Se=0,ue=fe.length;Se<ue;Se++)rl(fe[Se],F,z,k)}function ih(b,F,z,k){let{opaque:B,transmissive:fe,transparent:Se}=b;E.setupLightsView(z),mt===!0&&ve.setGlobalState(L.clippingPlanes,z),k&&le.viewport(j.copy(k)),B.length>0&&Ns(B,F,z),fe.length>0&&Ns(fe,F,z),Se.length>0&&Ns(Se,F,z),le.buffers.depth.setTest(!0),le.buffers.depth.setMask(!0),le.buffers.color.setMask(!0),le.setPolygonOffset(!1)}function rh(b,F,z,k){if((z.isScene===!0?z.overrideMaterial:null)!==null)return;if(E.state.transmissionRenderTarget[k.id]===void 0){let Ae=qe.has("EXT_color_buffer_half_float")||qe.has("EXT_color_buffer_float");E.state.transmissionRenderTarget[k.id]=new jt(1,1,{generateMipmaps:!0,type:Ae?Dn:rn,minFilter:_n,samples:Math.max(4,lt.samples),stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Ye.workingColorSpace})}let fe=E.state.transmissionRenderTarget[k.id],Se=k.viewport||j;fe.setSize(Se.z*L.transmissionResolutionScale,Se.w*L.transmissionResolutionScale);let ue=L.getRenderTarget(),Me=L.getActiveCubeFace(),Ee=L.getActiveMipmapLevel();L.setRenderTarget(fe),L.getClearColor(be),we=L.getClearAlpha(),we<1&&L.setClearColor(16777215,.5),L.clear(),gt&&te.render(z);let Ue=L.toneMapping;L.toneMapping=gn;let ze=k.viewport;if(k.viewport!==void 0&&(k.viewport=void 0),E.setupLightsView(k),mt===!0&&ve.setGlobalState(L.clippingPlanes,k),Ns(b,z,k),y.updateMultisampleRenderTarget(fe),y.updateRenderTargetMipmap(fe),qe.has("WEBGL_multisampled_render_to_texture")===!1){let Ae=!1;for(let it=0,Tt=F.length;it<Tt;it++){let St=F[it],{object:at,geometry:Ot,material:ye,group:$t}=St;if(ye.side===Bt&&at.layers.test(k.layers)){let Ze=ye.side;ye.side=Vt,ye.needsUpdate=!0,sh(at,z,k,Ot,ye,$t),ye.side=Ze,ye.needsUpdate=!0,Ae=!0}}Ae===!0&&(y.updateMultisampleRenderTarget(fe),y.updateRenderTargetMipmap(fe))}L.setRenderTarget(ue,Me,Ee),L.setClearColor(be,we),ze!==void 0&&(k.viewport=ze),L.toneMapping=Ue}function Ns(b,F,z){let k=F.isScene===!0?F.overrideMaterial:null;for(let B=0,fe=b.length;B<fe;B++){let Se=b[B],{object:ue,geometry:Me,group:Ee}=Se,Ue=Se.material;Ue.allowOverride===!0&&k!==null&&(Ue=k),ue.layers.test(z.layers)&&sh(ue,F,z,Me,Ue,Ee)}}function sh(b,F,z,k,B,fe){b.onBeforeRender(L,F,z,k,B,fe),b.modelViewMatrix.multiplyMatrices(z.matrixWorldInverse,b.matrixWorld),b.normalMatrix.getNormalMatrix(b.modelViewMatrix),B.onBeforeRender(L,F,z,k,b,fe),B.transparent===!0&&B.side===Bt&&B.forceSinglePass===!1?(B.side=Vt,B.needsUpdate=!0,L.renderBufferDirect(z,F,k,B,b,fe),B.side=Xn,B.needsUpdate=!0,L.renderBufferDirect(z,F,k,B,b,fe),B.side=Bt):L.renderBufferDirect(z,F,k,B,b,fe),b.onAfterRender(L,F,z,k,B,fe)}function Os(b,F,z){F.isScene!==!0&&(F=At);let k=T.get(b),B=E.state.lights,fe=E.state.shadowsArray,Se=B.state.version,ue=ae.getParameters(b,B.state,fe,F,z,E.state.lightProbeGridArray),Me=ae.getProgramCacheKey(ue),Ee=k.programs;k.environment=b.isMeshStandardMaterial||b.isMeshLambertMaterial||b.isMeshPhongMaterial?F.environment:null,k.fog=F.fog;let Ue=b.isMeshStandardMaterial||b.isMeshLambertMaterial&&!b.envMap||b.isMeshPhongMaterial&&!b.envMap;k.envMap=U.get(b.envMap||k.environment,Ue),k.envMapRotation=k.environment!==null&&b.envMap===null?F.environmentRotation:b.envMapRotation,Ee===void 0&&(b.addEventListener("dispose",Mt),Ee=new Map,k.programs=Ee);let ze=Ee.get(Me);if(ze!==void 0){if(k.currentProgram===ze&&k.lightsStateVersion===Se)return oh(b,ue),ze}else ue.uniforms=ae.getUniforms(b),O!==null&&b.isNodeMaterial&&O.build(b,z,ue),b.onBeforeCompile(ue,L),ze=ae.acquireProgram(ue,Me),Ee.set(Me,ze),k.uniforms=ue.uniforms;let Ae=k.uniforms;return(!b.isShaderMaterial&&!b.isRawShaderMaterial||b.clipping===!0)&&(Ae.clippingPlanes=ve.uniform),oh(b,ue),k.needsLights=Hd(b),k.lightsStateVersion=Se,k.needsLights&&(Ae.ambientLightColor.value=B.state.ambient,Ae.lightProbe.value=B.state.probe,Ae.directionalLights.value=B.state.directional,Ae.directionalLightShadows.value=B.state.directionalShadow,Ae.spotLights.value=B.state.spot,Ae.spotLightShadows.value=B.state.spotShadow,Ae.rectAreaLights.value=B.state.rectArea,Ae.ltc_1.value=B.state.rectAreaLTC1,Ae.ltc_2.value=B.state.rectAreaLTC2,Ae.pointLights.value=B.state.point,Ae.pointLightShadows.value=B.state.pointShadow,Ae.hemisphereLights.value=B.state.hemi,Ae.directionalShadowMatrix.value=B.state.directionalShadowMatrix,Ae.spotLightMatrix.value=B.state.spotLightMatrix,Ae.spotLightMap.value=B.state.spotLightMap,Ae.pointShadowMatrix.value=B.state.pointShadowMatrix),k.lightProbeGrid=E.state.lightProbeGridArray.length>0,k.currentProgram=ze,k.uniformsList=null,ze}function ah(b){if(b.uniformsList===null){let F=b.currentProgram.getUniforms();b.uniformsList=Rr.seqWithValue(F.seq,b.uniforms)}return b.uniformsList}function oh(b,F){let z=T.get(b);z.outputColorSpace=F.outputColorSpace,z.batching=F.batching,z.batchingColor=F.batchingColor,z.instancing=F.instancing,z.instancingColor=F.instancingColor,z.instancingMorph=F.instancingMorph,z.skinning=F.skinning,z.morphTargets=F.morphTargets,z.morphNormals=F.morphNormals,z.morphColors=F.morphColors,z.morphTargetsCount=F.morphTargetsCount,z.numClippingPlanes=F.numClippingPlanes,z.numIntersection=F.numClipIntersection,z.vertexAlphas=F.vertexAlphas,z.vertexTangents=F.vertexTangents,z.toneMapping=F.toneMapping}function Ud(b,F){if(b.length===0)return null;if(b.length===1)return b[0].texture!==null?b[0]:null;x.setFromMatrixPosition(F.matrixWorld);for(let z=0,k=b.length;z<k;z++){let B=b[z];if(B.texture!==null&&B.boundingBox.containsPoint(x))return B}return null}function kd(b,F,z,k,B){F.isScene!==!0&&(F=At),y.resetTextureUnits();let fe=F.fog,Se=k.isMeshStandardMaterial||k.isMeshLambertMaterial||k.isMeshPhongMaterial?F.environment:null,ue=N===null?L.outputColorSpace:N.isXRRenderTarget===!0?N.texture.colorSpace:Ye.workingColorSpace,Me=k.isMeshStandardMaterial||k.isMeshLambertMaterial&&!k.envMap||k.isMeshPhongMaterial&&!k.envMap,Ee=U.get(k.envMap||Se,Me),Ue=k.vertexColors===!0&&!!z.attributes.color&&z.attributes.color.itemSize===4,ze=!!z.attributes.tangent&&(!!k.normalMap||k.anisotropy>0),Ae=!!z.morphAttributes.position,it=!!z.morphAttributes.normal,Tt=!!z.morphAttributes.color,St=gn;k.toneMapped&&(N===null||N.isXRRenderTarget===!0)&&(St=L.toneMapping);let at=z.morphAttributes.position||z.morphAttributes.normal||z.morphAttributes.color,Ot=at!==void 0?at.length:0,ye=T.get(k),$t=E.state.lights;if(mt===!0&&(Xe===!0||b!==V)){let ct=b===V&&k.id===H;ve.setState(k,b,ct)}let Ze=!1;k.version===ye.__version?(ye.needsLights&&ye.lightsStateVersion!==$t.state.version||ye.outputColorSpace!==ue||B.isBatchedMesh&&ye.batching===!1||!B.isBatchedMesh&&ye.batching===!0||B.isBatchedMesh&&ye.batchingColor===!0&&B.colorTexture===null||B.isBatchedMesh&&ye.batchingColor===!1&&B.colorTexture!==null||B.isInstancedMesh&&ye.instancing===!1||!B.isInstancedMesh&&ye.instancing===!0||B.isSkinnedMesh&&ye.skinning===!1||!B.isSkinnedMesh&&ye.skinning===!0||B.isInstancedMesh&&ye.instancingColor===!0&&B.instanceColor===null||B.isInstancedMesh&&ye.instancingColor===!1&&B.instanceColor!==null||B.isInstancedMesh&&ye.instancingMorph===!0&&B.morphTexture===null||B.isInstancedMesh&&ye.instancingMorph===!1&&B.morphTexture!==null||ye.envMap!==Ee||k.fog===!0&&ye.fog!==fe||ye.numClippingPlanes!==void 0&&(ye.numClippingPlanes!==ve.numPlanes||ye.numIntersection!==ve.numIntersection)||ye.vertexAlphas!==Ue||ye.vertexTangents!==ze||ye.morphTargets!==Ae||ye.morphNormals!==it||ye.morphColors!==Tt||ye.toneMapping!==St||ye.morphTargetsCount!==Ot||!!ye.lightProbeGrid!=E.state.lightProbeGridArray.length>0)&&(Ze=!0):(Ze=!0,ye.__version=k.version);let on=ye.currentProgram;Ze===!0&&(on=Os(k,F,B),O&&k.isNodeMaterial&&O.onUpdateProgram(k,on,ye));let Mn=!1,ei=!1,Gi=!1,ot=on.getUniforms(),Et=ye.uniforms;if(le.useProgram(on.program)&&(Mn=!0,ei=!0,Gi=!0),k.id!==H&&(H=k.id,ei=!0),ye.needsLights){let ct=Ud(E.state.lightProbeGridArray,B);ye.lightProbeGrid!==ct&&(ye.lightProbeGrid=ct,ei=!0)}if(Mn||V!==b){le.buffers.depth.getReversed()&&b.reversedDepth!==!0&&(b._reversedDepth=!0,b.updateProjectionMatrix()),ot.setValue(D,"projectionMatrix",b.projectionMatrix),ot.setValue(D,"viewMatrix",b.matrixWorldInverse);let ni=ot.map.cameraPosition;ni!==void 0&&ni.setValue(D,ht.setFromMatrixPosition(b.matrixWorld)),lt.logarithmicDepthBuffer&&ot.setValue(D,"logDepthBufFC",2/(Math.log(b.far+1)/Math.LN2)),(k.isMeshPhongMaterial||k.isMeshToonMaterial||k.isMeshLambertMaterial||k.isMeshBasicMaterial||k.isMeshStandardMaterial||k.isShaderMaterial)&&ot.setValue(D,"isOrthographic",b.isOrthographicCamera===!0),V!==b&&(V=b,ei=!0,Gi=!0)}if(ye.needsLights&&($t.state.directionalShadowMap.length>0&&ot.setValue(D,"directionalShadowMap",$t.state.directionalShadowMap,y),$t.state.spotShadowMap.length>0&&ot.setValue(D,"spotShadowMap",$t.state.spotShadowMap,y),$t.state.pointShadowMap.length>0&&ot.setValue(D,"pointShadowMap",$t.state.pointShadowMap,y)),B.isSkinnedMesh){ot.setOptional(D,B,"bindMatrix"),ot.setOptional(D,B,"bindMatrixInverse");let ct=B.skeleton;ct&&(ct.boneTexture===null&&ct.computeBoneTexture(),ot.setValue(D,"boneTexture",ct.boneTexture,y))}B.isBatchedMesh&&(ot.setOptional(D,B,"batchingTexture"),ot.setValue(D,"batchingTexture",B._matricesTexture,y),ot.setOptional(D,B,"batchingIdTexture"),ot.setValue(D,"batchingIdTexture",B._indirectTexture,y),ot.setOptional(D,B,"batchingColorTexture"),B._colorsTexture!==null&&ot.setValue(D,"batchingColorTexture",B._colorsTexture,y));let ti=z.morphAttributes;if((ti.position!==void 0||ti.normal!==void 0||ti.color!==void 0)&&De.update(B,z,on),(ei||ye.receiveShadow!==B.receiveShadow)&&(ye.receiveShadow=B.receiveShadow,ot.setValue(D,"receiveShadow",B.receiveShadow)),(k.isMeshStandardMaterial||k.isMeshLambertMaterial||k.isMeshPhongMaterial)&&k.envMap===null&&F.environment!==null&&(Et.envMapIntensity.value=F.environmentIntensity),Et.dfgLUT!==void 0&&(Et.dfgLUT.value=O_()),ei){if(ot.setValue(D,"toneMappingExposure",L.toneMappingExposure),ye.needsLights&&Bd(Et,Gi),fe&&k.fog===!0&&X.refreshFogUniforms(Et,fe),X.refreshMaterialUniforms(Et,k,ke,et,E.state.transmissionRenderTarget[b.id]),ye.needsLights&&ye.lightProbeGrid){let ct=ye.lightProbeGrid;Et.probesSH.value=ct.texture,Et.probesMin.value.copy(ct.boundingBox.min),Et.probesMax.value.copy(ct.boundingBox.max),Et.probesResolution.value.copy(ct.resolution)}Rr.upload(D,ah(ye),Et,y)}if(k.isShaderMaterial&&k.uniformsNeedUpdate===!0&&(Rr.upload(D,ah(ye),Et,y),k.uniformsNeedUpdate=!1),k.isSpriteMaterial&&ot.setValue(D,"center",B.center),ot.setValue(D,"modelViewMatrix",B.modelViewMatrix),ot.setValue(D,"normalMatrix",B.normalMatrix),ot.setValue(D,"modelMatrix",B.matrixWorld),k.uniformsGroups!==void 0){let ct=k.uniformsGroups;for(let ni=0,Wi=ct.length;ni<Wi;ni++){let lh=ct[ni];q.update(lh,on),q.bind(lh,on)}}return on}function Bd(b,F){b.ambientLightColor.needsUpdate=F,b.lightProbe.needsUpdate=F,b.directionalLights.needsUpdate=F,b.directionalLightShadows.needsUpdate=F,b.pointLights.needsUpdate=F,b.pointLightShadows.needsUpdate=F,b.spotLights.needsUpdate=F,b.spotLightShadows.needsUpdate=F,b.rectAreaLights.needsUpdate=F,b.hemisphereLights.needsUpdate=F}function Hd(b){return b.isMeshLambertMaterial||b.isMeshToonMaterial||b.isMeshPhongMaterial||b.isMeshStandardMaterial||b.isShadowMaterial||b.isShaderMaterial&&b.lights===!0}this.getActiveCubeFace=function(){return G},this.getActiveMipmapLevel=function(){return W},this.getRenderTarget=function(){return N},this.setRenderTargetTextures=function(b,F,z){let k=T.get(b);k.__autoAllocateDepthBuffer=b.resolveDepthBuffer===!1,k.__autoAllocateDepthBuffer===!1&&(k.__useRenderToTexture=!1),T.get(b.texture).__webglTexture=F,T.get(b.depthTexture).__webglTexture=k.__autoAllocateDepthBuffer?void 0:z,k.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(b,F){let z=T.get(b);z.__webglFramebuffer=F,z.__useDefaultFramebuffer=F===void 0};let zd=D.createFramebuffer();this.setRenderTarget=function(b,F=0,z=0){N=b,G=F,W=z;let k=null,B=!1,fe=!1;if(b){let ue=T.get(b);if(ue.__useDefaultFramebuffer!==void 0){le.bindFramebuffer(D.FRAMEBUFFER,ue.__webglFramebuffer),j.copy(b.viewport),Q.copy(b.scissor),he=b.scissorTest,le.viewport(j),le.scissor(Q),le.setScissorTest(he),H=-1;return}else if(ue.__webglFramebuffer===void 0)y.setupRenderTarget(b);else if(ue.__hasExternalTextures)y.rebindTextures(b,T.get(b.texture).__webglTexture,T.get(b.depthTexture).__webglTexture);else if(b.depthBuffer){let Ue=b.depthTexture;if(ue.__boundDepthTexture!==Ue){if(Ue!==null&&T.has(Ue)&&(b.width!==Ue.image.width||b.height!==Ue.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");y.setupDepthRenderbuffer(b)}}let Me=b.texture;(Me.isData3DTexture||Me.isDataArrayTexture||Me.isCompressedArrayTexture)&&(fe=!0);let Ee=T.get(b).__webglFramebuffer;b.isWebGLCubeRenderTarget?(Array.isArray(Ee[F])?k=Ee[F][z]:k=Ee[F],B=!0):b.samples>0&&y.useMultisampledRTT(b)===!1?k=T.get(b).__webglMultisampledFramebuffer:Array.isArray(Ee)?k=Ee[z]:k=Ee,j.copy(b.viewport),Q.copy(b.scissor),he=b.scissorTest}else j.copy(ie).multiplyScalar(ke).floor(),Q.copy(Ie).multiplyScalar(ke).floor(),he=Ne;if(z!==0&&(k=zd),le.bindFramebuffer(D.FRAMEBUFFER,k)&&le.drawBuffers(b,k),le.viewport(j),le.scissor(Q),le.setScissorTest(he),B){let ue=T.get(b.texture);D.framebufferTexture2D(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_CUBE_MAP_POSITIVE_X+F,ue.__webglTexture,z)}else if(fe){let ue=F;for(let Me=0;Me<b.textures.length;Me++){let Ee=T.get(b.textures[Me]);D.framebufferTextureLayer(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0+Me,Ee.__webglTexture,z,ue)}}else if(b!==null&&z!==0){let ue=T.get(b.texture);D.framebufferTexture2D(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,ue.__webglTexture,z)}H=-1},this.readRenderTargetPixels=function(b,F,z,k,B,fe,Se,ue=0){if(!(b&&b.isWebGLRenderTarget)){Re("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Me=T.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&Se!==void 0&&(Me=Me[Se]),Me){le.bindFramebuffer(D.FRAMEBUFFER,Me);try{let Ee=b.textures[ue],Ue=Ee.format,ze=Ee.type;if(b.textures.length>1&&D.readBuffer(D.COLOR_ATTACHMENT0+ue),!lt.textureFormatReadable(Ue)){Re("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!lt.textureTypeReadable(ze)){Re("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}F>=0&&F<=b.width-k&&z>=0&&z<=b.height-B&&D.readPixels(F,z,k,B,P.convert(Ue),P.convert(ze),fe)}finally{let Ee=N!==null?T.get(N).__webglFramebuffer:null;le.bindFramebuffer(D.FRAMEBUFFER,Ee)}}},this.readRenderTargetPixelsAsync=async function(b,F,z,k,B,fe,Se,ue=0){if(!(b&&b.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Me=T.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&Se!==void 0&&(Me=Me[Se]),Me)if(F>=0&&F<=b.width-k&&z>=0&&z<=b.height-B){le.bindFramebuffer(D.FRAMEBUFFER,Me);let Ee=b.textures[ue],Ue=Ee.format,ze=Ee.type;if(b.textures.length>1&&D.readBuffer(D.COLOR_ATTACHMENT0+ue),!lt.textureFormatReadable(Ue))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!lt.textureTypeReadable(ze))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let Ae=D.createBuffer();D.bindBuffer(D.PIXEL_PACK_BUFFER,Ae),D.bufferData(D.PIXEL_PACK_BUFFER,fe.byteLength,D.STREAM_READ),D.readPixels(F,z,k,B,P.convert(Ue),P.convert(ze),0);let it=N!==null?T.get(N).__webglFramebuffer:null;le.bindFramebuffer(D.FRAMEBUFFER,it);let Tt=D.fenceSync(D.SYNC_GPU_COMMANDS_COMPLETE,0);return D.flush(),await bu(D,Tt,4),D.bindBuffer(D.PIXEL_PACK_BUFFER,Ae),D.getBufferSubData(D.PIXEL_PACK_BUFFER,0,fe),D.deleteBuffer(Ae),D.deleteSync(Tt),fe}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(b,F=null,z=0){let k=Math.pow(2,-z),B=Math.floor(b.image.width*k),fe=Math.floor(b.image.height*k),Se=F!==null?F.x:0,ue=F!==null?F.y:0;y.setTexture2D(b,0),D.copyTexSubImage2D(D.TEXTURE_2D,z,0,0,Se,ue,B,fe),le.unbindTexture()};let Vd=D.createFramebuffer(),Gd=D.createFramebuffer();this.copyTextureToTexture=function(b,F,z=null,k=null,B=0,fe=0){let Se,ue,Me,Ee,Ue,ze,Ae,it,Tt,St=b.isCompressedTexture?b.mipmaps[fe]:b.image;if(z!==null)Se=z.max.x-z.min.x,ue=z.max.y-z.min.y,Me=z.isBox3?z.max.z-z.min.z:1,Ee=z.min.x,Ue=z.min.y,ze=z.isBox3?z.min.z:0;else{let Et=Math.pow(2,-B);Se=Math.floor(St.width*Et),ue=Math.floor(St.height*Et),b.isDataArrayTexture?Me=St.depth:b.isData3DTexture?Me=Math.floor(St.depth*Et):Me=1,Ee=0,Ue=0,ze=0}k!==null?(Ae=k.x,it=k.y,Tt=k.z):(Ae=0,it=0,Tt=0);let at=P.convert(F.format),Ot=P.convert(F.type),ye;F.isData3DTexture?(y.setTexture3D(F,0),ye=D.TEXTURE_3D):F.isDataArrayTexture||F.isCompressedArrayTexture?(y.setTexture2DArray(F,0),ye=D.TEXTURE_2D_ARRAY):(y.setTexture2D(F,0),ye=D.TEXTURE_2D),le.activeTexture(D.TEXTURE0),le.pixelStorei(D.UNPACK_FLIP_Y_WEBGL,F.flipY),le.pixelStorei(D.UNPACK_PREMULTIPLY_ALPHA_WEBGL,F.premultiplyAlpha),le.pixelStorei(D.UNPACK_ALIGNMENT,F.unpackAlignment);let $t=le.getParameter(D.UNPACK_ROW_LENGTH),Ze=le.getParameter(D.UNPACK_IMAGE_HEIGHT),on=le.getParameter(D.UNPACK_SKIP_PIXELS),Mn=le.getParameter(D.UNPACK_SKIP_ROWS),ei=le.getParameter(D.UNPACK_SKIP_IMAGES);le.pixelStorei(D.UNPACK_ROW_LENGTH,St.width),le.pixelStorei(D.UNPACK_IMAGE_HEIGHT,St.height),le.pixelStorei(D.UNPACK_SKIP_PIXELS,Ee),le.pixelStorei(D.UNPACK_SKIP_ROWS,Ue),le.pixelStorei(D.UNPACK_SKIP_IMAGES,ze);let Gi=b.isDataArrayTexture||b.isData3DTexture,ot=F.isDataArrayTexture||F.isData3DTexture;if(b.isDepthTexture){let Et=T.get(b),ti=T.get(F),ct=T.get(Et.__renderTarget),ni=T.get(ti.__renderTarget);le.bindFramebuffer(D.READ_FRAMEBUFFER,ct.__webglFramebuffer),le.bindFramebuffer(D.DRAW_FRAMEBUFFER,ni.__webglFramebuffer);for(let Wi=0;Wi<Me;Wi++)Gi&&(D.framebufferTextureLayer(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,T.get(b).__webglTexture,B,ze+Wi),D.framebufferTextureLayer(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,T.get(F).__webglTexture,fe,Tt+Wi)),D.blitFramebuffer(Ee,Ue,Se,ue,Ae,it,Se,ue,D.DEPTH_BUFFER_BIT,D.NEAREST);le.bindFramebuffer(D.READ_FRAMEBUFFER,null),le.bindFramebuffer(D.DRAW_FRAMEBUFFER,null)}else if(B!==0||b.isRenderTargetTexture||T.has(b)){let Et=T.get(b),ti=T.get(F);le.bindFramebuffer(D.READ_FRAMEBUFFER,Vd),le.bindFramebuffer(D.DRAW_FRAMEBUFFER,Gd);for(let ct=0;ct<Me;ct++)Gi?D.framebufferTextureLayer(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,Et.__webglTexture,B,ze+ct):D.framebufferTexture2D(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,Et.__webglTexture,B),ot?D.framebufferTextureLayer(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,ti.__webglTexture,fe,Tt+ct):D.framebufferTexture2D(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,ti.__webglTexture,fe),B!==0?D.blitFramebuffer(Ee,Ue,Se,ue,Ae,it,Se,ue,D.COLOR_BUFFER_BIT,D.NEAREST):ot?D.copyTexSubImage3D(ye,fe,Ae,it,Tt+ct,Ee,Ue,Se,ue):D.copyTexSubImage2D(ye,fe,Ae,it,Ee,Ue,Se,ue);le.bindFramebuffer(D.READ_FRAMEBUFFER,null),le.bindFramebuffer(D.DRAW_FRAMEBUFFER,null)}else ot?b.isDataTexture||b.isData3DTexture?D.texSubImage3D(ye,fe,Ae,it,Tt,Se,ue,Me,at,Ot,St.data):F.isCompressedArrayTexture?D.compressedTexSubImage3D(ye,fe,Ae,it,Tt,Se,ue,Me,at,St.data):D.texSubImage3D(ye,fe,Ae,it,Tt,Se,ue,Me,at,Ot,St):b.isDataTexture?D.texSubImage2D(D.TEXTURE_2D,fe,Ae,it,Se,ue,at,Ot,St.data):b.isCompressedTexture?D.compressedTexSubImage2D(D.TEXTURE_2D,fe,Ae,it,St.width,St.height,at,St.data):D.texSubImage2D(D.TEXTURE_2D,fe,Ae,it,Se,ue,at,Ot,St);le.pixelStorei(D.UNPACK_ROW_LENGTH,$t),le.pixelStorei(D.UNPACK_IMAGE_HEIGHT,Ze),le.pixelStorei(D.UNPACK_SKIP_PIXELS,on),le.pixelStorei(D.UNPACK_SKIP_ROWS,Mn),le.pixelStorei(D.UNPACK_SKIP_IMAGES,ei),fe===0&&F.generateMipmaps&&D.generateMipmap(ye),le.unbindTexture()},this.initRenderTarget=function(b){T.get(b).__webglFramebuffer===void 0&&y.setupRenderTarget(b)},this.initTexture=function(b){b.isCubeTexture?y.setTextureCube(b,0):b.isData3DTexture?y.setTexture3D(b,0):b.isDataArrayTexture||b.isCompressedArrayTexture?y.setTexture2DArray(b,0):y.setTexture2D(b,0),le.unbindTexture()},this.resetState=function(){G=0,W=0,N=null,le.reset(),ne.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return fn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=Ye._getDrawingBufferColorSpace(e),t.unpackColorSpace=Ye._getUnpackColorSpace()}};var Si=16,bi=9,Uc=new WeakMap,Vi=new WeakMap,oe=new Map;function ge(n,e=0){let t=Number(n);return Number.isFinite(t)?t:e}function We(n,e,t){return Math.max(e,Math.min(t,n))}function Ds(n){return(ge(n,.5)-.5)*Si}function Ls(n){return(.5-ge(n,.5))*bi}function Lc(n={},e=-1.65){return new R(Ds(n.x),Ls(n.y),e)}function Sd(n={},e=0){return-1+(1-ge(n.y,.5))*.6+ge(n.z,0)*.025+e}function Is(n=""){switch(String(n)){case"builder":return{fill:"#c97a3d",stroke:"#5a2f16",cue:"#ffe4a0",mark:"B",face:"#ffe5bd",accent:"#ffd34f",trim:"#7f3f1c"};case"worker":return{fill:"#5f8d8e",stroke:"#173f41",cue:"#d6f1ef",mark:"W",face:"#ffe0b4",accent:"#9fd3c8",trim:"#31585b"};case"hauler":return{fill:"#d7ae50",stroke:"#654716",cue:"#fff0bd",mark:"H",face:"#f5d29b",accent:"#8bb36d",trim:"#8a5d1f"};case"messenger":return{fill:"#c85c75",stroke:"#5a1c2b",cue:"#ffd5de",mark:"!",face:"#ffe1be",accent:"#78a9d6",trim:"#7e2c3c"};default:return{fill:"#7f9b66",stroke:"#254526",cue:"#daf0cf",mark:"C",face:"#ffe8c4",accent:"#a7c884",trim:"#446235"}}}function Ko(n=""){let e=String(n||""),t=0;for(let i=0;i<e.length;i+=1)t=(t<<5)-t+e.charCodeAt(i)|0;return Math.abs(t%628)/100}function k_(n,e,t,i="busy"){n.fillStyle="#2e1b0e",n.beginPath(),n.ellipse(e-17,t,5,7,0,0,Math.PI*2),n.ellipse(e+17,t,5,7,0,0,Math.PI*2),n.fill(),n.fillStyle="#fff8e8",n.beginPath(),n.arc(e-19,t-3,2,0,Math.PI*2),n.arc(e+15,t-3,2,0,Math.PI*2),n.fill(),n.strokeStyle="#2e1b0e",n.lineWidth=4,n.lineCap="round",n.beginPath(),i==="alert"?(n.moveTo(e-26,t-15),n.lineTo(e-12,t-19),n.moveTo(e+12,t-19),n.lineTo(e+27,t-14)):(n.moveTo(e-26,t-15),n.lineTo(e-12,t-13),n.moveTo(e+12,t-13),n.lineTo(e+27,t-15)),n.stroke(),n.beginPath(),i==="happy"?n.arc(e,t+13,14,.1,Math.PI-.1):(n.moveTo(e-8,t+15),n.quadraticCurveTo(e,t+20,e+10,t+14)),n.stroke()}function od(n,e,t,i){n.fillStyle="#ffe0b4",n.strokeStyle=i,n.lineWidth=4,n.beginPath(),n.arc(e,t,10,0,Math.PI*2),n.fill(),n.stroke()}function B_(n="worker"){let e=`character:${n}:v1`;if(oe.has(e))return oe.get(e);let t=Is(n),i=document.createElement("canvas");i.width=224,i.height=256;let r=i.getContext("2d");r.clearRect(0,0,i.width,i.height),r.fillStyle="rgba(46, 27, 14, 0.22)",r.beginPath(),r.ellipse(112,222,62,17,0,0,Math.PI*2),r.fill(),n==="hauler"&&(r.fillStyle="#8bb36d",r.strokeStyle=t.stroke,r.lineWidth=7,r.beginPath(),r.roundRect(132,88,48,84,19),r.fill(),r.stroke(),r.fillStyle="#6d8c55",r.fillRect(141,102,29,12)),r.strokeStyle=t.stroke,r.lineWidth=10,r.lineCap="round",r.beginPath(),n==="messenger"?(r.moveTo(151,126),r.lineTo(181,84)):n==="builder"?(r.moveTo(151,128),r.lineTo(180,96)):(r.moveTo(151,130),r.lineTo(174,147)),r.stroke(),od(r,n==="messenger"?181:n==="builder"?180:174,n==="messenger"?84:n==="builder"?96:147,t.stroke),n==="builder"?(r.strokeStyle=t.stroke,r.lineWidth=7,r.beginPath(),r.moveTo(170,98),r.lineTo(193,75),r.moveTo(183,71),r.lineTo(204,92),r.stroke()):n==="worker"?(r.strokeStyle=t.stroke,r.lineWidth=6,r.beginPath(),r.moveTo(165,142),r.lineTo(190,126),r.moveTo(184,122),r.lineTo(198,137),r.stroke()):n==="messenger"&&(r.fillStyle=t.accent,r.strokeStyle=t.stroke,r.lineWidth=5,r.beginPath(),r.moveTo(182,72),r.lineTo(205,84),r.lineTo(182,97),r.closePath(),r.fill(),r.stroke()),r.strokeStyle=t.stroke,r.lineWidth=10,r.beginPath(),r.moveTo(73,128),r.lineTo(n==="hauler"?50:44,n==="hauler"?146:116),r.stroke(),od(r,n==="hauler"?50:44,n==="hauler"?146:116,t.stroke),r.fillStyle=t.fill,r.strokeStyle=t.stroke,r.lineWidth=10,r.beginPath(),r.roundRect(62,94,100,96,34),r.fill(),r.stroke(),n==="worker"?(r.fillStyle="#fff8e8",r.strokeStyle=t.stroke,r.lineWidth=5,r.beginPath(),r.roundRect(84,116,56,57,13),r.fill(),r.stroke(),r.strokeStyle=t.trim,r.lineWidth=4,r.beginPath(),r.moveTo(94,133),r.lineTo(130,133),r.moveTo(94,149),r.lineTo(122,149),r.stroke()):n==="hauler"?(r.strokeStyle=t.trim,r.lineWidth=7,r.beginPath(),r.moveTo(78,107),r.lineTo(146,178),r.moveTo(146,107),r.lineTo(78,178),r.stroke(),r.fillStyle="#c4883a",r.strokeStyle=t.stroke,r.lineWidth=6,r.beginPath(),r.roundRect(82,134,60,40,10),r.fill(),r.stroke()):n==="messenger"&&(r.fillStyle="#6b4631",r.strokeStyle=t.stroke,r.lineWidth=5,r.beginPath(),r.roundRect(118,142,42,38,9),r.fill(),r.stroke(),r.strokeStyle="#fff0bd",r.lineWidth=5,r.beginPath(),r.moveTo(79,110),r.lineTo(145,172),r.stroke()),r.strokeStyle=t.stroke,r.lineWidth=11,r.beginPath(),r.moveTo(91,184),r.lineTo(82,213),r.moveTo(132,184),r.lineTo(143,213),r.stroke(),r.fillStyle=t.trim,r.strokeStyle=t.stroke,r.lineWidth=5,r.beginPath(),r.roundRect(61,207,38,17,8),r.roundRect(128,207,38,17,8),r.fill(),r.stroke(),r.fillStyle=t.face,r.strokeStyle=t.stroke,r.lineWidth=8,r.beginPath(),r.arc(112,76,45,0,Math.PI*2),r.fill(),r.stroke(),n==="builder"?(r.fillStyle=t.accent,r.strokeStyle=t.stroke,r.lineWidth=7,r.beginPath(),r.arc(112,70,48,Math.PI,Math.PI*2),r.lineTo(160,75),r.lineTo(64,75),r.closePath(),r.fill(),r.stroke(),r.strokeStyle="#f4a92f",r.lineWidth=5,r.beginPath(),r.moveTo(112,27),r.lineTo(112,73),r.moveTo(91,38),r.lineTo(91,73),r.moveTo(133,38),r.lineTo(133,73),r.stroke()):(r.fillStyle=t.trim,r.beginPath(),r.arc(112,45,34,Math.PI,Math.PI*2),r.lineTo(146,63),r.quadraticCurveTo(112,53,78,63),r.closePath(),r.fill(),n==="messenger"&&(r.fillStyle=t.accent,r.beginPath(),r.arc(144,56,12,0,Math.PI*2),r.fill())),r.fillStyle="rgba(200, 92, 117, 0.28)",r.beginPath(),r.arc(82,88,7,0,Math.PI*2),r.arc(142,88,7,0,Math.PI*2),r.fill(),k_(r,112,82,n==="messenger"?"alert":n==="hauler"?"happy":"busy");let s=new je(i);return s.colorSpace=Le,s.minFilter=de,s.magFilter=de,oe.set(e,s),s}function bd(n="",e="neutral"){let t=`text:${e}:${n}`;if(oe.has(t))return oe.get(t);let i=document.createElement("canvas");i.width=384,i.height=96;let r=i.getContext("2d"),s=e==="ready"?"#ffe4a0":e==="selected"?"#d6f1ef":"#fff8e8";r.clearRect(0,0,i.width,i.height),r.fillStyle=s,r.strokeStyle="rgba(46, 27, 14, 0.25)",r.lineWidth=6,r.beginPath(),r.roundRect(10,12,i.width-20,i.height-24,22),r.fill(),r.stroke(),r.fillStyle="#2e1b0e",r.font='700 30px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',r.textAlign="center",r.textBaseline="middle";let a=String(n||"").length>20?`${String(n).slice(0,17)}...`:String(n||"");r.fillText(a,i.width/2,i.height/2+2,i.width-44);let o=new je(i);return o.colorSpace=Le,o.minFilter=de,o.magFilter=de,oe.set(t,o),o}function Md(n,e,t,i,r){n.beginPath();for(let s=0;s<10;s+=1){let a=s%2===0?i:r,o=-Math.PI/2+s*Math.PI/5,l=e+Math.cos(o)*a,h=t+Math.sin(o)*a;s===0?n.moveTo(l,h):n.lineTo(l,h)}n.closePath()}function H_(n="worker",e={}){let t=String(e.accessory||"tools"),i=String(e.actionKind||""),r=`cue:${n}:${t}:${i}`;if(oe.has(r))return oe.get(r);let s=Is(n),a=document.createElement("canvas");a.width=160,a.height=160;let o=a.getContext("2d");if(o.clearRect(0,0,a.width,a.height),o.fillStyle="rgba(46, 27, 14, 0.24)",o.beginPath(),o.ellipse(84,126,46,14,0,0,Math.PI*2),o.fill(),o.fillStyle=s.cue,o.strokeStyle=s.stroke,o.lineWidth=8,o.beginPath(),o.roundRect(31,20,98,98,28),o.fill(),o.stroke(),o.strokeStyle=s.stroke,o.fillStyle=s.fill,o.lineCap="round",o.lineJoin="round",o.lineWidth=10,t==="hammer")o.beginPath(),o.moveTo(58,88),o.lineTo(104,42),o.moveTo(85,37),o.lineTo(119,71),o.stroke();else if(t==="wrench")o.beginPath(),o.arc(62,50,18,.2,Math.PI*1.55),o.moveTo(73,65),o.lineTo(108,100),o.stroke();else if(t==="bundle")o.fillStyle="#c4883a",o.strokeStyle=s.stroke,o.lineWidth=7,o.beginPath(),o.roundRect(50,54,60,46,10),o.fill(),o.stroke(),o.beginPath(),o.moveTo(50,78),o.lineTo(110,78),o.moveTo(80,54),o.lineTo(80,100),o.stroke();else if(t==="coin"){o.fillStyle="#d7ae50";for(let h of[92,77,62])o.beginPath(),o.ellipse(80,h,30,10,0,0,Math.PI*2),o.fill(),o.stroke()}else t==="approval"?(o.font='900 46px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',o.textAlign="center",o.textBaseline="middle",o.fillText("OK",80,74)):t==="reward"?(o.fillStyle="#d7ae50",Md(o,80,74,34,15),o.fill(),o.stroke()):t==="quest"?(o.beginPath(),o.moveTo(80,38),o.lineTo(112,74),o.lineTo(80,110),o.lineTo(48,74),o.closePath(),o.fill(),o.stroke()):t==="clover"?(o.font='900 58px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',o.textAlign="center",o.textBaseline="middle",o.fillText("C",80,76)):t==="notice"?(o.font='900 70px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',o.textAlign="center",o.textBaseline="middle",o.fillText("!",80,74)):(o.beginPath(),o.arc(80,74,24,0,Math.PI*2),o.moveTo(48,74),o.lineTo(112,74),o.moveTo(80,42),o.lineTo(80,106),o.stroke());let l=new je(a);return l.colorSpace=Le,l.minFilter=de,l.magFilter=de,oe.set(r,l),l}function z_(n="worker",e=0){let t=We(ge(e,0),0,1),i=Math.round(t*100),r=`progress:${n}:${i}`;if(oe.has(r))return oe.get(r);let s=Is(n),a=document.createElement("canvas");a.width=256,a.height=64;let o=a.getContext("2d");o.clearRect(0,0,a.width,a.height),o.fillStyle="rgba(46, 27, 14, 0.40)",o.beginPath(),o.roundRect(18,18,220,28,14),o.fill(),o.fillStyle="#fff8e8",o.beginPath(),o.roundRect(24,23,208,18,9),o.fill(),o.fillStyle=s.fill,o.beginPath(),o.roundRect(24,23,Math.max(12,208*t),18,9),o.fill(),o.strokeStyle=s.stroke,o.lineWidth=5,o.beginPath(),o.roundRect(18,18,220,28,14),o.stroke();let l=new je(a);return l.colorSpace=Le,l.minFilter=de,l.magFilter=de,oe.set(r,l),l}function V_(n={}){let e=String(n.cueType||"crossing_greeting"),t=Array.isArray(n.roles)?n.roles:[],i=`encounter:${e}:${t.join("+")}`;if(oe.has(i))return oe.get(i);let r=document.createElement("canvas");r.width=192,r.height=160;let s=r.getContext("2d");s.clearRect(0,0,r.width,r.height),s.fillStyle="rgba(46, 27, 14, 0.22)",s.beginPath(),s.ellipse(96,126,52,14,0,0,Math.PI*2),s.fill(),s.fillStyle=e==="handoff"?"#fff0bd":"#d6f1ef",s.strokeStyle="#3b2513",s.lineWidth=7,s.beginPath(),s.roundRect(36,22,120,84,28),s.fill(),s.stroke();let a=Is(t[0]||"worker"),o=Is(t[1]||"messenger");s.fillStyle=a.fill,s.strokeStyle=a.stroke,s.lineWidth=5,s.beginPath(),s.arc(78,64,20,0,Math.PI*2),s.fill(),s.stroke(),s.fillStyle=o.fill,s.strokeStyle=o.stroke,s.beginPath(),s.arc(116,64,20,0,Math.PI*2),s.fill(),s.stroke(),s.strokeStyle="#3b2513",s.lineWidth=6,s.lineCap="round",s.beginPath(),s.moveTo(91,82),s.lineTo(103,82),s.stroke(),s.fillStyle=e==="handoff"?"#c4883a":"#c85c75",Md(s,97,38,13,6),s.fill(),s.stroke();let l=new je(r);return l.colorSpace=Le,l.minFilter=de,l.magFilter=de,oe.set(i,l),l}function Jo(n){let e=n?.image||null;return!!e&&e.complete!==!1}function ld(n,e,t){let i=String(n||"").trim();if(!i)return null;if(oe.has(i)){let s=oe.get(i);return typeof e=="function"&&(Jo(s)?queueMicrotask(()=>e(s)):s.userData.pendingOnLoad=[...s.userData.pendingOnLoad||[],e]),typeof t=="function"&&!Jo(s)&&(s.userData.pendingOnError=[...s.userData.pendingOnError||[],t]),s}let r=new ds().load(i,()=>{r.colorSpace=Le,r.minFilter=_n,r.magFilter=de;let s=r.userData.pendingOnLoad||[];r.userData.pendingOnLoad=[],r.userData.pendingOnError=[];for(let a of s)a(r)},void 0,()=>{let s=r.userData.pendingOnError||[];oe.delete(i);for(let a of s)a()});return r.colorSpace=Le,r.userData.pendingOnLoad=typeof e=="function"?[e]:[],r.userData.pendingOnError=typeof t=="function"?[t]:[],oe.set(i,r),r}function G_(n=null){if(!n||typeof n!="object")return null;let e=We(Math.round(ge(n.columns,1)),1,32),t=We(Math.round(ge(n.rows,1)),1,32),i=We(Math.round(ge(n.row,0)),0,t-1),s=(Array.isArray(n.frames)?n.frames:[0]).map(a=>We(Math.round(ge(a,0)),0,e-1)).filter((a,o,l)=>l.indexOf(a)===o);return{id:String(n.id||""),metadataSrc:String(n.metadataSrc||""),action:String(n.action||""),columns:e,rows:t,row:i,frames:s.length>0?s:[0],fps:We(ge(n.fps,4),1,12),frameWidth:ge(n.frameWidth,1),frameHeight:ge(n.frameHeight,1)}}function Td(n,e,t){if(!n||!e)return;let i=We(Math.round(ge(t,0)),0,e.columns-1);n.repeat.set(1/e.columns,1/e.rows),n.offset.set(i/e.columns,1-(e.row+1)/e.rows),Jo(n)&&(n.needsUpdate=!0)}function W_(n){let e=new Lt;return e.source=n.source,e.mapping=n.mapping,e.channel=n.channel,e.wrapS=n.wrapS,e.wrapT=n.wrapT,e.generateMipmaps=n.generateMipmaps,e.premultiplyAlpha=n.premultiplyAlpha,e.flipY=n.flipY,e.unpackAlignment=n.unpackAlignment,e}function X_(n={},e){let t=G_(n.assetSprite);if(!t||!e)return{texture:e,sheet:null};let i=Jo(e)?e.clone():W_(e);return i.colorSpace=Le,i.minFilter=_n,i.magFilter=de,i.userData={spriteSheetClone:!0},Td(i,t,t.frames[0]),{texture:i,sheet:t}}function q_(n={}){return n.kind==="actor"?n.canonicalRoleId==="clover"?1.35:1.22:n.kind==="pad"?1.05:n.buildingType==="HQ"?2.15*ge(n.scale,1):1.55*ge(n.scale,1)}function Y_(n={},e,t=0){let i=X_(n,e),r=i.sheet,s=new pt({map:i.texture,transparent:!0,depthTest:!0,depthWrite:!1,alphaTest:.04}),a=new xt(s),o=r?.frameWidth&&r?.frameHeight?{width:r.frameWidth,height:r.frameHeight}:i.texture?.image||null,l=o&&o.width&&o.height?o.width/o.height:1,h=q_(n);return a.position.set(Ds(n.x),Ls(n.y),Sd(n,t)),a.scale.set(h*We(l,.62,1.75),h,1),a.userData=Ps(n,{sprite:!0,baseX:a.position.x,baseY:a.position.y,baseScaleX:a.scale.x,baseScaleY:a.scale.y,baseRotation:a.material.rotation||0,phase:Ko(n.actionAnimation?.phaseSeed||n.actorId||n.id),spriteSheet:!!r,spriteSheetId:r?.id||"",spriteSheetAction:r?.action||"",spriteSheetMetadataSrc:r?.metadataSrc||"",spriteSheetColumns:r?.columns||0,spriteSheetRows:r?.rows||0,spriteSheetRow:r?.row??-1,spriteSheetFrames:r?.frames||[],spriteSheetFps:r?.fps||0}),a}function Ps(n={},e={}){return{objectId:String(n.id||""),kind:String(n.kind||""),label:String(n.label||""),selectionKey:String(n.selectionKey||""),drawerKey:String(n.drawerKey||""),testId:String(n.testId||""),state:String(n.state||""),visualOnly:n.visualOnly===!0,actorId:String(n.actorId||""),canonicalRoleId:String(n.canonicalRoleId||""),generatedOverlayRoleId:String(n.generatedOverlayRoleId||""),sourceDomain:String(n.sourceDomain||""),sourceObjectId:String(n.sourceObjectId||""),sourceStateHash:String(n.sourceStateHash||""),visualState:String(n.visualState||""),assetSrc:String(n.assetSrc||""),assetSprite:n.assetSprite||null,actionKind:String(n.actionKind||""),actionCueType:String(n.actionCue?.cueType||""),actionCueAccessory:String(n.actionCue?.accessory||""),animationMode:String(n.actionAnimation?.mode||""),animationTempo:ge(n.actionAnimation?.tempo,1),animationStepStyle:String(n.actionAnimation?.stepStyle||""),hasWalkOffset:n.actionAnimation?.hasWalkOffset===!0,progress:ge(n.progress,0),routeId:String(n.route?.routeId||""),wayId:String(n.route?.wayId||""),routeMode:String(n.route?.mode||""),routeProgress:ge(n.route?.progress,0),routeTargetId:String(n.route?.targetId||""),validPlacement:n.validPlacement===!0,x:ge(n.x,.5),y:ge(n.y,.5),...e}}function $_(n={},e){let t=Math.max(1.05,e.scale.x*1.04),i=Math.max(1.05,e.scale.y*1.12),r=new dt(new en(t,i),new Ft({color:16777215,transparent:!0,opacity:.001,depthWrite:!1}));return r.position.copy(e.position),r.position.z+=.1,r.userData=Ps(n,{hitTarget:!0}),r}function Z_(n={},e){if(n.kind==="actor")return null;let t=String(n.state||""),i=n.selected?"selected":t==="OUTPUT_READY"?"ready":"neutral",r=bd(n.label||n.id,i),s=new xt(new pt({map:r,transparent:!0,depthTest:!0,depthWrite:!1,alphaTest:.03}));return s.position.set(e.position.x,e.position.y-e.scale.y*.58,e.position.z+.18),s.scale.set(1.55,.39,1),s.userData=Ps(n,{labelSprite:!0}),s}function K_(n={},e){if(n.kind!=="actor"||!n.actionCue)return[];let t=String(n.canonicalRoleId||"worker"),i=n.actionCue||{},r=[],s=new xt(new pt({map:H_(t,i),transparent:!0,depthTest:!0,depthWrite:!1,alphaTest:.03})),a=t==="hauler"?.52:t==="messenger"?.38:.44,o=t==="hauler"?-.08:e.scale.y*.52;if(s.position.set(e.position.x+a,e.position.y+o,e.position.z+.22),s.scale.set(t==="messenger"?.62:.54,t==="messenger"?.62:.54,1),s.userData=Ps(n,{actionCueSprite:!0,actionCueType:String(i.cueType||""),actionCueAccessory:String(i.accessory||""),baseX:s.position.x,baseY:s.position.y,baseScaleX:s.scale.x,baseScaleY:s.scale.y,baseRotation:s.material.rotation||0,phase:Ko(n.actionAnimation?.phaseSeed||n.actorId||n.id)}),r.push(s),t==="builder"||t==="worker"){let l=new xt(new pt({map:z_(t,i.progress),transparent:!0,depthTest:!0,depthWrite:!1,alphaTest:.03}));l.position.set(e.position.x,e.position.y-e.scale.y*.62,e.position.z+.24),l.scale.set(1.15,.29,1),l.userData=Ps(n,{actionCueSprite:!0,progressSprite:!0,actionCueType:String(i.cueType||""),actionCueAccessory:"progress",baseX:l.position.x,baseY:l.position.y,baseScaleX:l.scale.x,baseScaleY:l.scale.y,baseRotation:l.material.rotation||0,phase:Ko(n.actionAnimation?.phaseSeed||n.actorId||n.id)}),r.push(l)}return r}function J_(n={}){return n.selected?6262158:n.buildable?8362854:n.occupied?12879930:10319192}function j_(n={}){let e={x:We((ge(n.x)+.5)/3,.08,.92),y:We((ge(n.y)+.5)/3,.1,.9)},t=new dt(new en(3.55,1.78),new Ft({color:J_(n),transparent:!0,opacity:n.selected?.34:n.buildable?.18:.1,depthWrite:!1,side:Bt}));return t.position.set(Ds(e.x),Ls(e.y),-2.1),t.userData={objectId:String(n.id||""),kind:"grid_cell",selectionKey:String(n.selectionKey||""),buildable:n.buildable===!0,occupied:n.occupied===!0,hitTarget:!0},t}function Q_(n={}){let e=Array.isArray(n.points)?n.points:[],t=e.length>=2?e.map(s=>Lc(s,-1.72)):[Lc({x:.5,y:.5},-1.72),Lc({x:.55,y:.55},-1.72)],i=new Ni(t,!1,"centripetal",.4),r=new dt(new hs(i,18,.055,7,!1),new Ft({color:7161893,transparent:!0,opacity:.62,depthWrite:!1}));return r.userData={kind:"way",wayLine:!0,wayId:String(n.wayId||""),label:String(n.label||""),targetId:String(n.targetId||""),visualOnly:n.visualOnly===!0,points:e},r}function ey(n={}){let e=new xt(new pt({map:V_(n),transparent:!0,depthTest:!0,depthWrite:!1,alphaTest:.03}));return e.position.set(Ds(n.x),Ls(n.y)+.46,2.25),e.scale.set(.68,.56,1),e.userData={kind:"encounter",encounterSprite:!0,encounterId:String(n.encounterId||""),targetId:String(n.targetId||""),cueType:String(n.cueType||""),label:String(n.label||""),roles:Array.isArray(n.roles)?n.roles:[],actorIds:Array.isArray(n.actorIds)?n.actorIds:[],visualOnly:n.visualOnly===!0,baseX:e.position.x,baseY:e.position.y,baseScaleX:e.scale.x,baseScaleY:e.scale.y,phase:Ko(n.encounterId||n.targetId||"")},e}function ty(n,e="three-raycast"){let t=n?.userData||{};return{objectId:String(t.objectId||""),kind:String(t.kind||""),label:String(t.label||""),selectionKey:String(t.selectionKey||""),drawerKey:String(t.drawerKey||""),testId:String(t.testId||""),visualOnly:t.visualOnly===!0,actorId:String(t.actorId||""),canonicalRoleId:String(t.canonicalRoleId||""),generatedOverlayRoleId:String(t.generatedOverlayRoleId||""),sourceDomain:String(t.sourceDomain||""),sourceObjectId:String(t.sourceObjectId||""),sourceStateHash:String(t.sourceStateHash||""),visualState:String(t.visualState||""),actionKind:String(t.actionKind||""),actionCueType:String(t.actionCueType||""),actionCueAccessory:String(t.actionCueAccessory||""),animationMode:String(t.animationMode||""),animationStepStyle:String(t.animationStepStyle||""),progress:ge(t.progress,0),routeId:String(t.routeId||""),wayId:String(t.wayId||""),routeMode:String(t.routeMode||""),routeProgress:ge(t.routeProgress,0),routeTargetId:String(t.routeTargetId||""),validPlacement:t.validPlacement===!0,source:e,atMs:Date.now()}}var kc=class{constructor(e){this.stageNode=e,this.viewport=null,this.scenePayload=null,this.pickables=[],this.objectMeshes=[],this.info={},this.scene=new mr,this.camera=new gi(Si/-2,Si/2,bi/2,bi/-2,.1,100),this.camera.position.set(0,0,12),this.camera.lookAt(0,0,0),this.raycaster=new Tr,this.pointer=new xe,this.renderer=new ws({antialias:!0,alpha:!1,preserveDrawingBuffer:!0}),this.renderer.setClearColor(16046248,1),this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),this.renderer.domElement.className="fp-three-canvas",this.renderer.domElement.dataset.testid="founders-three-canvas",this.renderer.domElement.setAttribute("aria-label","Founders Plot Three.js scene"),this.onClick=this.onClick.bind(this),this.onResize=this.onResize.bind(this),this.animate=this.animate.bind(this),this.running=!0,this.reducedMotion=typeof window.matchMedia=="function"?window.matchMedia("(prefers-reduced-motion: reduce)").matches:!1,this.resizeObserver=new ResizeObserver(this.onResize),requestAnimationFrame(this.animate)}attach(e){e instanceof HTMLElement&&(this.viewport=e,this.renderer.domElement.parentElement!==e&&e.appendChild(this.renderer.domElement),this.stageNode.addEventListener("click",this.onClick,!0),this.resizeObserver.observe(e),this.onResize())}dispose(){this.running=!1,this.stageNode.removeEventListener("click",this.onClick,!0),this.resizeObserver.disconnect(),this.clearScene(),this.renderer.dispose(),this.renderer.domElement.remove()}clearScene(){this.scene.children.slice().forEach(t=>{this.scene.remove(t),t.traverse(i=>{if(i.geometry&&i.geometry.dispose(),i.material){let r=Array.isArray(i.material)?i.material:[i.material];for(let s of r)s.map?.userData?.spriteSheetClone&&s.map.dispose(),s.dispose()}})}),this.pickables=[],this.objectMeshes=[]}onResize(){let e=(this.viewport||this.stageNode).getBoundingClientRect(),t=Math.max(1,Math.floor(e.width)),i=Math.max(1,Math.floor(e.height));this.renderer.setSize(t,i,!1);let r=t/i,s=Si/bi;if(r>=s){let a=bi*r;this.camera.left=a/-2,this.camera.right=a/2,this.camera.top=bi/2,this.camera.bottom=bi/-2}else{let a=Si/r;this.camera.left=Si/-2,this.camera.right=Si/2,this.camera.top=a/2,this.camera.bottom=a/-2}this.camera.updateProjectionMatrix(),this.render()}sync(e={}){this.scenePayload=e,this.rebuild(),this.render()}rebuild(){this.clearScene();let e=this.scenePayload||{},t=window.innerWidth<=560?e.stageBackgrounds?.mobile:e.stageBackgrounds?.desktop,i=ld(t,()=>this.render()),r=new dt(new en(Si,bi),new Ft({map:i||bd("Founders Plot")}));r.position.set(0,0,-4),this.scene.add(r);for(let s of e.grid?.cells||[]){let a=j_(s);this.scene.add(a),this.pickables.push(a)}for(let s of e.ways||[]){let a=Q_(s);this.scene.add(a),this.objectMeshes.push(a)}for(let s of e.objects||[]){let a=s.canonicalRoleId||s.kind,o=B_(a||"worker"),l=null,h=s.assetSrc?ld(s.assetSrc,()=>this.render(),()=>{l?.material&&(l.material.map?.userData?.spriteSheetClone&&l.material.map.dispose(),l.material.map=o,l.material.needsUpdate=!0,l.userData.assetFallback=!0,l.userData.spriteSheet=!1,this.render())}):o;l=Y_(s,h||o,s.kind==="actor"?.8:0),this.scene.add(l),this.objectMeshes.push(l);let u=$_(s,l);this.scene.add(u),this.pickables.push(u);let d=Z_(s,l);d&&this.scene.add(d);for(let f of K_(s,l))this.scene.add(f),this.objectMeshes.push(f)}for(let s of e.encounters||[]){let a=ey(s);this.scene.add(a),this.objectMeshes.push(a)}this.updateInfo()}pickFromEvent(e){let t=this.renderer.domElement.getBoundingClientRect();return this.pointer.x=(e.clientX-t.left)/t.width*2-1,this.pointer.y=-((e.clientY-t.top)/t.height)*2+1,this.raycaster.setFromCamera(this.pointer,this.camera),this.raycaster.intersectObjects(this.pickables,!1)[0]?.object||null}onClick(e){if(e.target instanceof Element&&e.target.closest(".fp-tile"))return;let t=this.pickFromEvent(e);if(!t)return;let i=ty(t);i.visualOnly&&(e.preventDefault(),e.stopPropagation()),window.dispatchEvent(new CustomEvent("founders-plot-scene-pick",{detail:i}))}canvasPointFor(e){let t=new R(Ds(e.x),Ls(e.y),Sd(e,e.kind==="actor"?.8:0));t.project(this.camera);let i=this.renderer.domElement.getBoundingClientRect();return{x:(t.x+1)/2*i.width,y:(-t.y+1)/2*i.height}}updateInfo(){let e=this.scenePayload||{},t=this.renderer.domElement,i=Array.isArray(e.objects)?e.objects:[];return this.info={renderer:"three.js",stateHash:String(e.stateHash||""),canvasWidth:t.width,canvasHeight:t.height,objectCount:i.length,objectIds:i.map(r=>r.id),ways:(e.ways||[]).map(r=>({wayId:r.wayId||"",targetId:r.targetId||"",label:r.label||"",points:r.points||[],visualOnly:r.visualOnly===!0})),encounters:(e.encounters||[]).map(r=>({encounterId:r.encounterId||"",targetId:r.targetId||"",roles:r.roles||[],actorIds:r.actorIds||[],cueType:r.cueType||"",visualOnly:r.visualOnly===!0,canvas:this.canvasPointFor({x:r.x,y:r.y,z:0,kind:"encounter"})})),actorIds:(e.actors||[]).map(r=>r.actorId),actors:(e.actors||[]).map(r=>({...r,canvas:this.canvasPointFor(i.find(s=>s.actorId===r.actorId||s.id===r.id)||{})})),actionCues:(e.actors||[]).map(r=>({actorId:r.actorId,canonicalRoleId:r.canonicalRoleId,sourceDomain:r.sourceDomain,sourceObjectId:r.sourceObjectId,actionKind:r.actionKind||"",cueType:r.actionCue?.cueType||"",accessory:r.actionCue?.accessory||"",progress:ge(r.actionCue?.progress,r.progress||0)})),roles:(e.actors||[]).map(r=>r.canonicalRoleId),renderedActors:this.objectMeshes.filter(r=>r.userData?.kind==="actor"&&r.userData?.sprite===!0).map(r=>({actorId:r.userData.actorId||"",canonicalRoleId:r.userData.canonicalRoleId||"",assetSrc:r.userData.assetSrc||"",spriteSheet:r.userData.spriteSheet===!0,spriteSheetId:r.userData.spriteSheetId||"",spriteSheetAction:r.userData.spriteSheetAction||"",routeId:r.userData.routeId||"",wayId:r.userData.wayId||"",routeProgress:ge(r.userData.routeProgress,0),assetFallback:r.userData.assetFallback===!0})),renderedWays:this.objectMeshes.filter(r=>r.userData?.wayLine===!0).map(r=>({wayId:r.userData.wayId||"",targetId:r.userData.targetId||"",visualOnly:r.userData.visualOnly===!0})),renderedEncounters:this.objectMeshes.filter(r=>r.userData?.encounterSprite===!0).map(r=>({encounterId:r.userData.encounterId||"",targetId:r.userData.targetId||"",cueType:r.userData.cueType||"",roles:r.userData.roles||[],visualOnly:r.userData.visualOnly===!0})),pickTargets:i.map(r=>({objectId:r.id,kind:r.kind,label:r.label,selectionKey:r.selectionKey,drawerKey:r.drawerKey,testId:r.testId,visualOnly:r.visualOnly===!0,actorId:r.actorId||"",canonicalRoleId:r.canonicalRoleId||"",sourceDomain:r.sourceDomain||"",sourceObjectId:r.sourceObjectId||"",sourceStateHash:r.sourceStateHash||"",visualState:r.visualState||"",assetSrc:r.assetSrc||"",assetSprite:r.assetSprite||null,actionKind:r.actionKind||"",route:r.route||null,actionCue:r.actionCue||null,actionAnimation:r.actionAnimation||null,canvas:this.canvasPointFor(r)}))},this.info}animate(e=0){if(this.running){for(let t of this.objectMeshes){let i=t.userData||{},r=ge(i.baseX,t.position.x),s=ge(i.baseY,t.position.y),a=ge(i.baseScaleX,t.scale.x),o=ge(i.baseScaleY,t.scale.y),l=ge(i.baseRotation,0);if(i.kind==="actor"){if(i.spriteSheet&&t.material?.map){let _=Array.isArray(i.spriteSheetFrames)&&i.spriteSheetFrames.length>0?i.spriteSheetFrames:[0],x=ge(i.spriteSheetFps,4),w=_[Math.floor(e/1e3*x+ge(i.phase,0))%_.length];Td(t.material.map,{columns:ge(i.spriteSheetColumns,1),rows:ge(i.spriteSheetRows,1),row:ge(i.spriteSheetRow,0)},w)}if(this.reducedMotion){t.position.x=r,t.position.y=s,t.scale.set(a,o,1),t.material&&(t.material.rotation=l);continue}let h=ge(i.phase,0),u=ge(i.animationTempo,1),d=e/360*u+h,f=i.hasWalkOffset?Math.sin(e/170+h):0,c=Math.abs(f)*.018,g=r,S=s+Math.sin(d)*.024+c,m=a,p=o,M=l;i.animationMode==="work_swing"?(M+=Math.sin(e/120+h)*.075,S+=Math.max(0,Math.sin(e/155+h))*.035,p*=1+Math.sin(e/155+h)*.018):i.animationMode==="busy_work"?(g+=Math.sin(e/135+h)*.018,S+=Math.sin(e/95+h)*.012,m*=1+Math.sin(e/135+h)*.012):i.animationMode==="carry_wobble"?(g+=Math.sin(e/210+h)*.025,M+=Math.sin(e/180+h)*.055,p*=1+Math.abs(Math.sin(e/180+h))*.018):i.animationMode==="attention_wave"&&(S+=Math.abs(Math.sin(e/150+h))*.05,M+=Math.sin(e/125+h)*.045,m*=1+Math.sin(e/150+h)*.012),t.position.x=g,t.position.y=S,t.scale.set(m,p,1),t.material&&(t.material.rotation=M)}else if(i.actionCueSprite&&!i.progressSprite){if(this.reducedMotion){t.position.x=r,t.position.y=s,t.material&&(t.material.rotation=l);continue}let h=ge(i.phase,0);t.position.y=s+Math.sin(e/240+h)*.025,i.actionCueAccessory==="hammer"||i.actionCueAccessory==="wrench"?t.material.rotation=l+Math.sin(e/135+h)*.1:(i.actionCueAccessory==="notice"||i.actionCueAccessory==="approval"||i.actionCueAccessory==="quest")&&(t.material.rotation=l+Math.sin(e/180+h)*.07)}}this.render(),requestAnimationFrame(this.animate)}}render(){this.updateInfo(),this.renderer.render(this.scene,this.camera)}},Zn=13.6,Kn=8.2,zi=.86,Sn=zi*1.64,Gt="hq14t_server_bound_terrain_underlay_v1",cd="hq14s_public_terrain_underlay_v1",$c="/experiences/founders-plot/assets/expedition-map",Ti=`${$c}/hq14s-public-terrain-underlay-v1`,ny="hq15e_expedition_unit_marker_sprites_v1",Nn=`${$c}/hq15e-expedition-unit-marker-sprites-v1`,As="hq17c-generated-hud-chrome-v1",Mi=`${$c}/${As}`,Fc="hq17d_three_masked_profiles_and_text_v1",hd="hq17e_clean_hud_chrome_compositor_v1",ud="hq17f_single_owner_canvas_hud_v1",sn="hq17g_renderer_owned_hud_materiality_v1",Cs="hq17h_renderer_hud_world_cohesion_v1",Bc="hq18_frontier_ledger_scratch_visual_hud_v1",dd="frontier-ledger-north-star-upload-2026-06-05",Hc="agenttown_public_terrain_asset_slots_v1",zc="server_read_model_v1",iy=Object.freeze(["field","forest","ridge","settled"]),Ed=Object.freeze({slot:"public_terrain_underlay",path:`${Ti}/public-terrain-underlay-candidate-01-v1.png`,assetKind:"visual_underlay"}),fd=Object.freeze({field:{slot:"field",path:`${Ti}/field-v1.png`,assetKind:"concrete_public_terrain"},settled:{slot:"settled",path:`${Ti}/settled-v1.png`,assetKind:"concrete_public_terrain"},forest:{slot:"forest",path:`${Ti}/forest-v1.png`,assetKind:"concrete_public_terrain"},ridge:{slot:"ridge",path:`${Ti}/ridge-v1.png`,assetKind:"concrete_public_terrain"},hinted:{slot:"hinted_frontier_fog",path:`${Ti}/hinted-frontier-fog-v1.png`,assetKind:"fog_only",fogOnly:!0},locked_unknown:{slot:"locked_unknown_fog",path:`${Ti}/locked-unknown-fog-v1.png`,assetKind:"fog_only",fogOnly:!0}}),wd=Object.freeze({scout:{slot:"scout",path:`${Nn}/scout-pathfinder-v1.png`,assetKind:"generated_unit_sprite"},settler_convoy:{slot:"settler_convoy",path:`${Nn}/settler-convoy-v1.png`,assetKind:"generated_unit_sprite"},surveyor:{slot:"surveyor",path:`${Nn}/surveyor-beacon-v1.png`,assetKind:"generated_unit_sprite"},courier:{slot:"courier",path:`${Nn}/courier-signal-runner-v1.png`,assetKind:"generated_unit_sprite"},outpost_crew:{slot:"outpost_crew",path:`${Nn}/outpost-crew-v1.png`,assetKind:"generated_unit_sprite"},field_support:{slot:"surveyor",path:`${Nn}/surveyor-beacon-v1.png`,assetKind:"generated_unit_sprite"}}),Hi=Object.freeze({objective_beacon:{slot:"objective_beacon",path:`${Nn}/objective-beacon-v1.png`,assetKind:"generated_marker_sprite"},event_packet:{slot:"event_packet",path:`${Nn}/event-packet-v1.png`,assetKind:"generated_marker_sprite"},receipt_ledger:{slot:"receipt_ledger",path:`${Nn}/receipt-ledger-v1.png`,assetKind:"generated_marker_sprite"}}),pd=Object.freeze([{slot:"crest-status",path:`${Mi}/crest-status.png`,anchor:"top-left",widthRatio:.285,heightRatio:.092,marginX:.006,marginY:.014,opacity:.82},{slot:"objective-loop",path:`${Mi}/objective-plaque.png`,anchor:"top-left",widthRatio:.148,heightRatio:.068,marginX:.206,marginY:.032,opacity:.82},{slot:"unit-dock",path:`${Mi}/unit-dock.png`,anchor:"bottom-left",widthRatio:.575,heightRatio:.225,marginX:0,marginY:0,opacity:.88},{slot:"command-tray",path:`${Mi}/command-tray.png`,anchor:"bottom-right",widthRatio:.372,heightRatio:.245,marginX:.01,marginY:.01,opacity:.9},{slot:"collapsed-ledger",path:`${Mi}/ledger-rail.png`,anchor:"right",widthRatio:.07,heightRatio:.5,marginX:0,marginY:.18,opacity:.88},{slot:"selected-context",path:`${Mi}/selected-context-frame.png`,anchor:"bottom-right",widthRatio:.19,heightRatio:.178,marginX:.036,marginY:.258,opacity:.9},{slot:"command-puck",path:`${Mi}/command-puck.png`,anchor:"selected-command",widthRatio:.078,heightRatio:.112,marginX:0,marginY:0,opacity:.82}]),Vc=new Map,Gc=new Set;function Ad(n={}){let t=(Array.isArray(n.generatedHudChrome?.assets)?n.generatedHudChrome.assets:[]).filter(i=>i?.path&&i?.slot).map(i=>{let r=pd.find(s=>String(s.slot||"")===String(i.slot||""))||{};return{...i,...r,path:String(i.path||r.path||""),packId:String(n.generatedHudChrome?.packId||i.packId||As),visualOnly:!0,readOnly:!0,routeAuthority:!1,actionAuthority:!1,executableActions:0}});return t.length?t:pd}function ry(n="",e={}){return Ad(e).find(t=>String(t.slot||"")===String(n||""))||null}function jn(n,e=1){let t=Number(n||0),i=t>>16&255,r=t>>8&255,s=t&255;return`rgba(${i}, ${r}, ${s}, ${e})`}function sy(n=""){let e=String(n||""),t=2166136261;for(let i=0;i<e.length;i+=1)t^=e.charCodeAt(i),t=Math.imul(t,16777619);return t>>>0}function jo(n=""){return sy(n)%1e4/1e4}function md(n={}){let e=ge(n.q,0),t=ge(n.r,0);return{x:e+t*.5,y:-t*.86}}function Cd(n=[]){let e=n.map(m=>md(m));e.length||e.push({x:0,y:0});let t=Math.min(...e.map(m=>m.x),0),i=Math.max(...e.map(m=>m.x),0),r=Math.min(...e.map(m=>m.y),0),s=Math.max(...e.map(m=>m.y),0),a=Math.max(1,i-t),o=Math.max(1,s-r),l=Math.min((Zn-2.4)/a,(Kn-1.8)/o,1.62),h=(t+i)/2,u=(r+s)/2,d=new Map,f=1/0,c=-1/0,g=1/0,S=-1/0;for(let m of n){let p=md(m),M={x:(p.x-h)*l,y:(p.y-u)*l};d.set(String(m.cellId||""),M),f=Math.min(f,M.x-Sn),c=Math.max(c,M.x+Sn),g=Math.min(g,M.y-Sn),S=Math.max(S,M.y+Sn)}return Number.isFinite(f)||(f=-1,c=1,g=-1,S=1),{positions:d,bounds:{minX:f,maxX:c,minY:g,maxY:S,centerX:(f+c)/2,centerY:(g+S)/2,width:Math.max(1,c-f),height:Math.max(1,S-g)}}}function Zc(n={},e=!1){let t=String(n.fogState||"locked_unknown");return e?{fill:14676452,line:1462092,rim:16110724,shadow:1457209,opacity:.98,lineOpacity:.98,labelTone:"selected",fogOverlay:15727092}:t==="discovered"?{fill:11192718,line:2976326,rim:15784338,shadow:2969391,opacity:.98,lineOpacity:.9,labelTone:"ready",fogOverlay:15070932}:t==="known"?{fill:4038555,line:1399381,rim:12251373,shadow:1194808,opacity:.96,lineOpacity:.86,labelTone:"selected",fogOverlay:11923949}:t==="hinted"?{fill:15047477,line:7159574,rim:16767096,shadow:8078611,opacity:.92,lineOpacity:.84,labelTone:"neutral",fogOverlay:15971400}:{fill:10130564,line:6116938,rim:14141352,shadow:5393218,opacity:.54,lineOpacity:.46,labelTone:"neutral",fogOverlay:13155498}}function vn(n=zi){let e=[];for(let t=0;t<6;t+=1){let i=Math.PI/6+t*Math.PI/3;e.push(new R(Math.cos(i)*n,Math.sin(i)*n,0))}return e.push(e[0].clone()),e}function gd(n=zi){let e=new vr;return vn(n).forEach((t,i)=>{i===0?e.moveTo(t.x,t.y):e.lineTo(t.x,t.y)}),new cs(e)}function _d(n=zi){let e=vn(n).slice(0,6),t=[0,0,0],i=[.5,.5];for(let a of e)t.push(a.x,a.y,0),i.push(.5+a.x/(n*2),.5-a.y/(n*2));let r=[];for(let a=1;a<=e.length;a+=1)r.push(0,a,a===e.length?1:a+1);let s=new st;return s.setAttribute("position",new yt(t,3)),s.setAttribute("uv",new yt(i,2)),s.setIndex(r),s.computeVertexNormals(),s}function ay(n={}){let e=String(n.status||""),t=String(n.kind||""),i=String(n.fogState||"");return e.includes("OUTPOST")||t.includes("outpost")?"OUT":t==="origin_plot"?"HQ":e.includes("SITE_PLAN")?"PLAN":e.includes("SCOUT")?"SITE":i==="hinted"?"...":i==="locked_unknown"?"?":"MAP"}function oy(n="",e=!1,t=!1){return e?.72:t?.62:n==="locked_unknown"?.26:n==="hinted"?.46:.58}function ly(n={},e="",t=!1,i=!1){let r=ge(n.opacity,.72);return t?Math.min(.82,r*.88):i?Math.min(.72,r*.76):e==="locked_unknown"?Math.min(.34,r*.58):e==="hinted"?Math.min(.52,r*.62):Math.min(.58,r*.66)}function cy(n="",e=!1,t=!1){return e?.7:t?.42:n==="locked_unknown"?.08:n==="hinted"?.16:.18}function hy(n={},e="",t=!1,i=!1){return t?Math.max(.58,ge(n.lineOpacity,.58)):i?.38:e==="locked_unknown"?.14:e==="hinted"?.2:.22}function uy(n={}){let e=String(n.siteType||"").toLowerCase(),t=Array.isArray(n.traits)?n.traits.map(s=>String(s||"").toLowerCase()):[],i=String(n.kind||"").toLowerCase(),r=String(n.status||"").toLowerCase();return`${e} ${i} ${r} ${t.join(" ")}`}function Ei(n={}){return["discovered","known"].includes(String(n.fogState||"locked_unknown"))}function Fs(n={}){if(!Ei(n))return null;let e=String(n.publicTerrainAssetSlot||"");return iy.includes(e)?e:null}function Kc(n={}){let e=String(n.fogState||"locked_unknown"),t=String(n.fogAssetSlot||"");return e==="hinted"&&t==="hinted_frontier_fog"||e==="locked_unknown"&&t==="locked_unknown_fog"?t:e==="hinted"?"hinted_frontier_fog":"locked_unknown_fog"}function Qn(n={}){let e=String(n.fogState||"locked_unknown");return Ei(n)?Fs(n)||"field":e}function dy(n={},e=null){return!Ei(n)||!e?.slot?!1:e.slot===Fs(n)}function Jc(n={},e=Qn(n)){let t=String(n.fogState||"locked_unknown");if(!Ei(n)){let r=fd[t]||null;return r&&r.slot===Kc(n)?r:null}let i=fd[Fs(n)||e]||null;return i&&dy(n,i)?i:null}function fy(n={},e=Qn(n),t=Jc(n,e)){let i=String(n.fogState||"locked_unknown");return t?Ei(n)?t.fogOnly!==!0&&t.assetKind==="concrete_public_terrain"&&t.slot===Fs(n)&&String(n.terrainAssetContractVersion||"")===Hc&&String(n.publicTerrainAssetSlotSource||"")===zc:t.fogOnly===!0&&t.assetKind==="fog_only"&&t.slot===Kc(n):e==="field"}function yd(){for(let n of Gc)n()}function py(n){return typeof n!="function"?()=>{}:(Gc.add(n),()=>Gc.delete(n))}function Jn(n=null){if(!n?.path)return null;let e=Vc.get(n.path);return!e||e.dataset?.loadFailed==="true"?null:e.complete&&e.naturalWidth>0?e:null}function nl(n=null){if(!n?.path||typeof Image>"u")return null;if(Vc.get(n.path))return Jn(n);let t=new Image;return t.decoding="async",t.onload=()=>yd(),t.onerror=()=>{t.dataset.loadFailed="true",yd()},Vc.set(n.path,t),t.src=n.path,Jn(n)}function Qo(n={}){return wd[String(n.unitType||"")]||null}function jc(n,e=null,t=0,i=0,r=128,s=128,a=22){let o=nl(e);return o?(n.save(),n.beginPath(),n.roundRect(t,i,r,s,a),n.clip(),n.drawImage(o,t,i,r,s),n.restore(),!0):!1}function Rd(n,e=120,t=128){n.beginPath(),vn(e).forEach((i,r)=>{let s=t+i.x,a=t+i.y;r===0?n.moveTo(s,a):n.lineTo(s,a)}),n.closePath()}function my(n,e,t,i=1,r="rgba(35, 104, 68, 0.62)"){n.fillStyle="rgba(46, 27, 14, 0.18)",n.beginPath(),n.ellipse(e+7*i,t+12*i,13*i,4*i,0,0,Math.PI*2),n.fill(),n.fillStyle="rgba(80, 55, 29, 0.58)",n.fillRect(e-2*i,t+4*i,4*i,14*i),n.fillStyle=r;for(let s=0;s<3;s+=1){let a=t-18*i+s*12*i,o=(18-s*2)*i;n.beginPath(),n.moveTo(e,a),n.lineTo(e-o,a+24*i),n.lineTo(e+o,a+24*i),n.closePath(),n.fill()}}function Nc(n,e,t,i=1,r="rgba(255, 248, 232, 0.78)"){n.fillStyle="rgba(46, 27, 14, 0.18)",n.beginPath(),n.ellipse(e+8*i,t+24*i,24*i,7*i,0,0,Math.PI*2),n.fill(),n.fillStyle=r,n.strokeStyle="rgba(46, 27, 14, 0.38)",n.lineWidth=4*i,n.beginPath(),n.roundRect(e-18*i,t,36*i,26*i,5*i),n.fill(),n.stroke(),n.fillStyle="rgba(151, 86, 44, 0.82)",n.beginPath(),n.moveTo(e-22*i,t+4*i),n.lineTo(e,t-17*i),n.lineTo(e+23*i,t+4*i),n.closePath(),n.fill(),n.stroke()}function el(n,e,t,i=1,r="rgba(27, 106, 100, 0.72)"){n.strokeStyle="rgba(46, 27, 14, 0.42)",n.lineWidth=4*i,n.lineCap="round",n.beginPath(),n.moveTo(e,t+22*i),n.lineTo(e,t-28*i),n.stroke(),n.fillStyle=r,n.beginPath(),n.moveTo(e+3*i,t-25*i),n.lineTo(e+30*i,t-17*i),n.lineTo(e+3*i,t-6*i),n.closePath(),n.fill(),n.strokeStyle="rgba(255, 248, 232, 0.52)",n.lineWidth=2*i;for(let s=0;s<3;s+=1)n.beginPath(),n.arc(e,t-21*i,(15+s*12)*i,-.72,.34),n.stroke()}function Wc(n,e,t,i=92,r=.22){n.save(),n.strokeStyle=`rgba(46, 27, 14, ${r})`,n.lineWidth=3,n.lineCap="round",n.beginPath(),n.moveTo(e,t),n.bezierCurveTo(e+i*.25,t-7,e+i*.62,t+8,e+i,t-2),n.stroke(),n.strokeStyle=`rgba(255, 248, 232, ${r+.1})`,n.lineWidth=1.6,n.beginPath(),n.moveTo(e+4,t-4),n.bezierCurveTo(e+i*.28,t-9,e+i*.64,t+5,e+i-6,t-6),n.stroke(),n.restore()}function Xc(n,e,t,i=1){n.save(),n.translate(e,t),n.fillStyle="rgba(255, 248, 232, 0.30)",n.strokeStyle="rgba(46, 27, 14, 0.34)",n.lineWidth=3*i,n.beginPath(),n.roundRect(-34*i,-17*i,68*i,34*i,8*i),n.fill(),n.stroke(),n.fillStyle="rgba(27, 106, 100, 0.35)",n.beginPath(),n.moveTo(-27*i,-17*i),n.lineTo(0,-39*i),n.lineTo(29*i,-17*i),n.closePath(),n.fill(),n.stroke(),n.strokeStyle="rgba(101, 74, 28, 0.45)",n.beginPath(),n.arc(-23*i,21*i,10*i,0,Math.PI*2),n.arc(24*i,21*i,10*i,0,Math.PI*2),n.stroke(),n.restore()}function gy(n,e,t,i=1){n.fillStyle="rgba(255, 248, 232, 0.14)",n.strokeStyle="rgba(255, 248, 232, 0.22)",n.lineWidth=4*i;for(let r=0;r<3;r+=1){let s=e+(r-1)*18*i,a=(26+r%2*14)*i;n.beginPath(),n.roundRect(s-7*i,t-a,14*i,a,3*i),n.fill(),n.stroke()}n.beginPath(),n.moveTo(e-30*i,t+3*i),n.lineTo(e+32*i,t-2*i),n.stroke()}function _y(n,e,t,i){let r=jo(`${e.cellId}:${i}`);n.save(),Rd(n),n.clip();let s=n.createLinearGradient(0,18,256,238);s.addColorStop(0,jn(t.rim,.92)),s.addColorStop(.46,jn(t.fill,.96)),s.addColorStop(1,jn(t.shadow,.72)),n.fillStyle=s,n.fillRect(0,0,256,256),n.strokeStyle="rgba(46, 27, 14, 0.08)",n.lineWidth=3;for(let a=0;a<7;a+=1){let o=28+a*31;n.beginPath(),n.moveTo(12,o),n.bezierCurveTo(66,o-12,121,o+14,182,o-3),n.bezierCurveTo(210,o-10,231,o+3,248,o-8),n.stroke()}if(i==="water"&&(n.strokeStyle="rgba(39, 126, 167, 0.26)",n.lineWidth=9,n.lineCap="round",n.beginPath(),n.moveTo(-10,172-r*30),n.bezierCurveTo(62,139-r*16,118,191+r*12,266,132-r*20),n.stroke(),n.strokeStyle="rgba(224, 248, 255, 0.28)",n.lineWidth=3,n.stroke()),i==="forest"){String(e.fogState||"")==="known"&&(n.fillStyle="rgba(24, 137, 132, 0.24)",n.fillRect(0,0,256,256));for(let a=0;a<34;a+=1){let o=38+(a*37+r*93)%178,l=50+(a*53+r*71)%150;my(n,o,l,.46+a%3*.07,String(e.fogState||"")==="known"?a%4===0?"rgba(18, 101, 103, 0.72)":"rgba(38, 139, 119, 0.64)":a%4===0?"rgba(29, 84, 61, 0.70)":"rgba(42, 119, 72, 0.62)")}n.strokeStyle="rgba(255, 248, 232, 0.22)",n.lineWidth=5}else if(i==="ridge"){n.strokeStyle="rgba(80, 68, 55, 0.48)",n.lineWidth=9;for(let a=0;a<5;a+=1){let o=62+a*30;n.beginPath(),n.moveTo(24,o),n.bezierCurveTo(74,o-26,126,o+24,232,o-12),n.stroke()}n.fillStyle="rgba(255, 248, 232, 0.18)";for(let a=0;a<12;a+=1){let o=30+a*43%180,l=58+a*29%122;n.beginPath(),n.moveTo(o,l-10),n.lineTo(o-12,l+14),n.lineTo(o+15,l+10),n.closePath(),n.fill()}n.strokeStyle="rgba(255, 248, 232, 0.26)",n.lineWidth=4}else if(i==="settled"){n.fillStyle="rgba(255, 248, 232, 0.28)",n.beginPath(),n.ellipse(128,132,78,48,-.18,0,Math.PI*2),n.fill(),n.strokeStyle="rgba(101, 74, 28, 0.22)",n.lineWidth=4;for(let a=0;a<4;a+=1)Wc(n,56,86+a*23,128,.18);Nc(n,112,118,1.05),Nc(n,152,137,.72,"rgba(232, 244, 222, 0.78)"),Nc(n,82,146,.62,"rgba(255, 228, 160, 0.58)"),el(n,160,96,.56,"rgba(47, 125, 101, 0.74)"),Xc(n,90,86,.42),n.strokeStyle="rgba(27, 106, 100, 0.34)",n.lineWidth=5,n.beginPath(),n.ellipse(128,132,90,58,-.18,0,Math.PI*2),n.stroke(),n.strokeStyle="rgba(255, 248, 232, 0.34)",n.lineWidth=3,n.beginPath(),n.moveTo(58,162),n.bezierCurveTo(112,142,152,167,206,141),n.stroke(),n.strokeStyle="rgba(27, 106, 100, 0.34)",n.lineWidth=5}else if(i==="water"){n.strokeStyle="rgba(46, 122, 152, 0.44)",n.lineWidth=10;for(let a=0;a<6;a+=1){let o=58+a*25;n.beginPath(),n.moveTo(22,o),n.bezierCurveTo(76,o+18,112,o-18,166,o+3),n.bezierCurveTo(194,o+14,218,o-6,236,o+4),n.stroke()}n.strokeStyle="rgba(255, 248, 232, 0.28)",n.lineWidth=4}else if(i==="ruin_signal"){n.fillStyle="rgba(255, 248, 232, 0.18)",n.fillRect(0,0,256,256),n.strokeStyle="rgba(80, 68, 55, 0.36)",n.lineWidth=7;for(let a=0;a<4;a+=1){let o=70+a*29;n.beginPath(),n.moveTo(34,o),n.bezierCurveTo(76,o-16,128,o+14,212,o-8),n.stroke()}gy(n,105,154,.72),el(n,160,116,.48,"rgba(101, 74, 28, 0.56)"),n.strokeStyle="rgba(101, 74, 28, 0.32)",n.lineWidth=4}else if(i==="hinted"){n.fillStyle="rgba(226, 134, 40, 0.18)",n.fillRect(0,0,256,256),n.fillStyle="rgba(255, 248, 232, 0.16)";for(let a=0;a<10;a+=1){let o=28+a*22;n.beginPath(),n.ellipse(128+(a%3-1)*22,o,112-a%2*18,12,.12,0,Math.PI*2),n.fill()}n.setLineDash([10,9]),n.strokeStyle="rgba(255, 248, 232, 0.32)",n.lineWidth=4,n.beginPath(),n.ellipse(128,130,72,48,-.15,0,Math.PI*2),n.stroke(),n.setLineDash([]),n.fillStyle="rgba(46, 27, 14, 0.12)",n.beginPath(),n.ellipse(128,136,52,31,-.18,0,Math.PI*2),n.fill(),n.strokeStyle="rgba(138, 109, 65, 0.34)",n.lineWidth=5}else if(i==="locked_unknown"){n.fillStyle="rgba(255, 248, 232, 0.10)";for(let a=-2;a<11;a+=1)n.fillRect(a*31,20,13,220);n.fillStyle="rgba(255, 248, 232, 0.12)";for(let a=0;a<7;a+=1)n.beginPath(),n.ellipse(128,42+a*26,116-a%2*18,11,-.12,0,Math.PI*2),n.fill();n.fillStyle="rgba(68, 58, 48, 0.16)",n.beginPath(),n.ellipse(128,145,60,36,.1,0,Math.PI*2),n.fill(),n.strokeStyle="rgba(255, 248, 232, 0.20)",n.lineWidth=5}else{Xc(n,88+r*64,86+r*42,.32),n.strokeStyle="rgba(69, 112, 68, 0.30)",n.lineWidth=5;for(let a=0;a<7;a+=1){let o=48+a*24;n.beginPath(),n.moveTo(26,o),n.bezierCurveTo(84,o-12,144,o+10,230,o-7),n.stroke()}}n.strokeStyle=i==="locked_unknown"?"rgba(255, 248, 232, 0.10)":n.strokeStyle;for(let a=0;a<4;a+=1){let o=60+a*38+r*12;n.beginPath(),n.moveTo(18,o),n.bezierCurveTo(82,o-18,152,o+15,238,o-9),n.stroke()}n.restore()}function xd(n={},e=!1){let t=String(n.fogState||"locked_unknown"),i=Qn(n),r=Jc(n,i),s=nl(r),a=s?"asset-ready":r?.slot||"procedural",o=`expedition-cell:${Gt}:${n.cellId}:${t}:${i}:${a}:${e?"selected":"idle"}`;if(oe.has(o))return oe.get(o);let l=Zc(n,e),h=document.createElement("canvas");h.width=256,h.height=256;let u=h.getContext("2d");u.clearRect(0,0,h.width,h.height),u.shadowColor=jn(l.shadow,e?.34:.24),u.shadowBlur=e?22:13,u.shadowOffsetY=e?9:6,_y(u,n,l,i),s&&(u.save(),Rd(u,120,128),u.clip(),u.globalAlpha=t==="locked_unknown"?.74:t==="hinted"?.72:.92,u.drawImage(s,0,0,256,256),u.globalCompositeOperation="multiply",u.globalAlpha=t==="locked_unknown"?.16:.1,u.fillStyle=t==="locked_unknown"?"#3b3228":"#fff8e8",u.fillRect(0,0,256,256),u.restore()),u.shadowColor="transparent",u.shadowBlur=0,u.shadowOffsetY=0;let d=u.createRadialGradient(82,62,12,128,128,130);d.addColorStop(0,"rgba(255, 248, 232, 0.20)"),d.addColorStop(.64,jn(l.fogOverlay,t==="locked_unknown"?.22:.1)),d.addColorStop(1,jn(l.shadow,t==="locked_unknown"?.18:.12)),u.fillStyle=d,u.beginPath(),vn(120).forEach((c,g)=>{let S=128+c.x,m=128+c.y;g===0?u.moveTo(S,m):u.lineTo(S,m)}),u.closePath(),u.fill(),u.strokeStyle=jn(e?l.rim:l.line,e?.98:.76),u.lineWidth=e?13:8,u.beginPath(),vn(116).forEach((c,g)=>{let S=128+c.x,m=128+c.y;g===0?u.moveTo(S,m):u.lineTo(S,m)}),u.closePath(),u.stroke(),t==="hinted"&&(u.setLineDash([12,10]),u.strokeStyle="rgba(46, 27, 14, 0.36)",u.lineWidth=5,u.stroke(),u.setLineDash([]));let f=new je(h);return f.colorSpace=Le,f.minFilter=de,f.magFilter=de,oe.set(o,f),f}function yy(n={},e=!1){let t=ay(n),i=String(n.fogState||"locked_unknown"),r=`expedition-marker:${Gt}:${t}:${i}:${e?"selected":"idle"}`;if(oe.has(r))return oe.get(r);let s=document.createElement("canvas");s.width=192,s.height=192;let a=s.getContext("2d"),o=Zc(n,e);a.clearRect(0,0,s.width,s.height),a.fillStyle="rgba(22, 18, 13, 0.22)",a.beginPath(),a.ellipse(96,154,54,16,0,0,Math.PI*2),a.fill();let l=String(n.kind||""),h=String(n.status||"");a.fillStyle=i==="locked_unknown"?"rgba(46, 39, 32, 0.92)":i==="hinted"?"rgba(209, 154, 72, 0.94)":l==="origin_plot"?"rgba(255, 226, 128, 0.98)":h.includes("SITE_PLAN")?"rgba(154, 225, 216, 0.96)":jn(o.rim,.94),a.strokeStyle=jn(o.line,.92),a.lineWidth=e?10:7,a.beginPath(),a.arc(96,84,48,0,Math.PI*2),a.fill(),a.stroke(),a.beginPath(),a.moveTo(96,138),a.lineTo(75,112),a.lineTo(117,112),a.closePath(),a.fill(),a.stroke(),a.fillStyle=i==="locked_unknown"||i==="hinted"?"#fff8e8":"#2e1b0e",a.font="800 34px Georgia, serif",a.textAlign="center",a.textBaseline="middle",a.fillText(t.length>3?t.slice(0,3):t,96,84);let u=new je(s);return u.colorSpace=Le,u.minFilter=de,u.magFilter=de,oe.set(r,u),u}function Id(n={}){return String(n.cellId||n.receiptLink?.cellId||n.sourceIds?.cellId||"").trim()}function xy(n={}){return(Array.isArray(n?.eventPackets)?n.eventPackets:[]).filter(e=>e&&typeof e=="object"&&e.packetId&&Id(e))}function vy(n={},e=!1){let t=String(n.packetId||"packet"),i=String(n.templateId||n.kind||"event_packet"),r=`expedition-event-marker:${Gt}:${t}:${i}:${e?"selected":"idle"}`;if(oe.has(r))return oe.get(r);let s=document.createElement("canvas");s.width=192,s.height=192;let a=s.getContext("2d");a.clearRect(0,0,s.width,s.height),a.fillStyle="rgba(46, 27, 14, 0.22)",a.beginPath(),a.ellipse(96,150,48,14,0,0,Math.PI*2),a.fill(),a.fillStyle=e?"rgba(255, 248, 232, 0.94)":"rgba(255, 248, 232, 0.84)",a.strokeStyle=e?"#f5d484":"#8a6d41",a.lineWidth=e?8:6,a.beginPath(),a.roundRect(52,48,88,78,12),a.fill(),a.stroke(),a.strokeStyle="#1b6a64",a.lineWidth=6,a.lineJoin="round",a.beginPath(),a.moveTo(56,60),a.lineTo(96,92),a.lineTo(136,60),a.stroke(),a.fillStyle="#d19a48",a.strokeStyle="#5a3418",a.lineWidth=5,a.beginPath(),a.arc(122,116,17,0,Math.PI*2),a.fill(),a.stroke(),a.fillStyle="#82d6d0",a.globalAlpha=e?.82:.58,a.beginPath(),a.arc(62,42,8,0,Math.PI*2),a.fill(),a.globalAlpha=1,jc(a,Hi.event_packet,42,34,108,108,16);let o=new je(s);return o.colorSpace=Le,o.minFilter=de,o.magFilter=de,oe.set(r,o),o}function Sy(n={},e=!1){let t=String(n.mode||"inspect"),i=`expedition-objective-marker:${Gt}:${t}:${n.targetCellId||""}:${e?"selected":"idle"}`;if(oe.has(i))return oe.get(i);let r=document.createElement("canvas");r.width=192,r.height=192;let s=r.getContext("2d");s.clearRect(0,0,r.width,r.height);let a=t==="scout"?"rgba(245, 212, 132, 0.40)":t==="packet"?"rgba(130, 214, 208, 0.38)":"rgba(255, 248, 232, 0.30)",o=t==="scout"?"#d19a48":t==="packet"?"#1b6a64":"#8a6d41";s.fillStyle=a,s.beginPath(),s.arc(96,88,e?68:58,0,Math.PI*2),s.fill(),s.fillStyle="rgba(46, 27, 14, 0.22)",s.beginPath(),s.ellipse(96,150,52,15,0,0,Math.PI*2),s.fill(),s.fillStyle=o,s.strokeStyle=e?"#fff8e8":"#5a3418",s.lineWidth=e?9:6,s.beginPath(),s.arc(96,82,38,0,Math.PI*2),s.fill(),s.stroke(),s.strokeStyle="#fff8e8",s.fillStyle="#fff8e8",s.lineWidth=8,s.lineCap="round",s.lineJoin="round",t==="scout"?(s.beginPath(),s.arc(96,82,20,0,Math.PI*2),s.moveTo(96,48),s.lineTo(96,61),s.moveTo(96,103),s.lineTo(96,118),s.moveTo(62,82),s.lineTo(75,82),s.moveTo(117,82),s.lineTo(130,82),s.stroke(),s.beginPath(),s.moveTo(96,58),s.lineTo(108,86),s.lineTo(84,106),s.closePath(),s.fill()):t==="packet"?(s.beginPath(),s.roundRect(72,60,48,44,7),s.moveTo(76,69),s.lineTo(96,86),s.lineTo(116,69),s.stroke()):(s.beginPath(),s.moveTo(72,116),s.lineTo(96,52),s.lineTo(120,116),s.stroke(),s.beginPath(),s.arc(96,56,12,0,Math.PI*2),s.fill()),jc(s,t==="packet"?Hi.event_packet:Hi.objective_beacon,42,28,108,108,18);let l=new je(r);return l.colorSpace=Le,l.minFilter=de,l.magFilter=de,oe.set(i,l),l}function by(n="edge"){let e=`expedition-fog:${Gt}:${n}`;if(oe.has(e))return oe.get(e);let t=document.createElement("canvas");t.width=512,t.height=512;let i=t.getContext("2d"),r=i.createRadialGradient(242,238,38,256,256,250);r.addColorStop(0,n==="locked"?"rgba(135, 129, 112, 0.34)":"rgba(228, 133, 38, 0.46)"),r.addColorStop(.5,n==="locked"?"rgba(116, 108, 92, 0.38)":"rgba(238, 184, 86, 0.42)"),r.addColorStop(.8,n==="locked"?"rgba(78, 70, 58, 0.22)":"rgba(255, 230, 158, 0.22)"),r.addColorStop(1,"rgba(255, 248, 232, 0)"),i.fillStyle=r,i.fillRect(0,0,t.width,t.height),i.strokeStyle=n==="locked"?"rgba(255, 248, 232, 0.18)":"rgba(255, 248, 232, 0.26)",i.lineWidth=8,i.lineCap="round";for(let a=0;a<7;a+=1){let o=104+a*42;i.beginPath(),i.moveTo(30,o),i.bezierCurveTo(130,o-28,262,o+36,480,o-20),i.stroke()}i.save(),i.globalCompositeOperation="multiply",i.strokeStyle=n==="locked"?"rgba(57, 49, 40, 0.18)":"rgba(124, 91, 48, 0.18)",i.lineWidth=3;for(let a=0;a<5;a+=1)i.beginPath(),i.ellipse(254,242+a*5,188-a*22,122-a*13,-.14,0,Math.PI*2),i.stroke();i.restore(),n!=="locked"&&(i.setLineDash([18,16]),i.strokeStyle="rgba(101, 74, 28, 0.24)",i.lineWidth=5,i.beginPath(),i.ellipse(256,256,164,112,-.16,0,Math.PI*2),i.stroke(),i.setLineDash([]));let s=new je(t);return s.colorSpace=Le,s.minFilter=de,s.magFilter=de,oe.set(e,s),s}function My(n,e,t){n.save(),n.globalCompositeOperation="multiply",n.lineCap="round",n.strokeStyle="rgba(46, 27, 14, 0.07)",n.lineWidth=3;for(let i=-1;i<11;i+=1){let r=62+i*58;n.beginPath(),n.moveTo(-70,r),n.bezierCurveTo(124,r-54,282,r+48,474,r-18),n.bezierCurveTo(650,r-78,814,r+40,e+80,r-36),n.stroke()}n.strokeStyle="rgba(27, 106, 100, 0.08)",n.lineWidth=2;for(let i=-2;i<9;i+=1){let r=112+i*128;n.beginPath(),n.moveTo(r,-50),n.bezierCurveTo(r+88,92,r-78,222,r+74,362),n.bezierCurveTo(r+202,480,r-62,546,r+138,t+52),n.stroke()}n.restore(),n.save(),n.strokeStyle="rgba(255, 248, 232, 0.26)",n.lineWidth=2;for(let i=0;i<5;i+=1){let r=610+i*80,s=118+i%2*74;n.beginPath(),n.ellipse(r,s,84+i*10,38+i*4,-.18,0,Math.PI*2),n.stroke()}n.restore()}function Ty(n="soft"){let e=`expedition-edge-fog:${Gt}:${n}`;if(oe.has(e))return oe.get(e);let t=document.createElement("canvas");t.width=1024,t.height=256;let i=t.getContext("2d"),r=i.createLinearGradient(0,0,t.width,0);r.addColorStop(0,"rgba(255, 248, 232, 0)"),r.addColorStop(.28,n==="locked"?"rgba(43, 35, 27, 0.30)":"rgba(234, 219, 184, 0.24)"),r.addColorStop(.52,n==="locked"?"rgba(43, 35, 27, 0.54)":"rgba(255, 248, 232, 0.50)"),r.addColorStop(.76,n==="locked"?"rgba(43, 35, 27, 0.30)":"rgba(27, 106, 100, 0.18)"),r.addColorStop(1,"rgba(255, 248, 232, 0)"),i.fillStyle=r,i.fillRect(0,0,t.width,t.height),i.strokeStyle=n==="locked"?"rgba(255, 248, 232, 0.14)":"rgba(255, 248, 232, 0.32)",i.lineWidth=2;for(let a=0;a<12;a+=1){let o=28+a*17;i.beginPath(),i.moveTo(0,o),i.bezierCurveTo(240,o-30,510,o+36,1024,o-18),i.stroke()}i.save(),i.setLineDash([20,14]),i.strokeStyle=n==="locked"?"rgba(255, 248, 232, 0.10)":"rgba(101, 74, 28, 0.22)",i.lineWidth=6,i.beginPath(),i.moveTo(34,132),i.bezierCurveTo(254,74,534,182,990,112),i.stroke(),i.restore();let s=new je(t);return s.colorSpace=Le,s.minFilter=de,s.magFilter=de,oe.set(e,s),s}function Ey(){let n=`expedition-map-base:${Gt}`;if(oe.has(n))return oe.get(n);let e=document.createElement("canvas");e.width=1024,e.height=640;let t=e.getContext("2d"),i=t.createLinearGradient(0,0,e.width,e.height);i.addColorStop(0,"#f3e4bf"),i.addColorStop(.32,"#d8dfbd"),i.addColorStop(.64,"#b9cfa5"),i.addColorStop(1,"#6aa39b"),t.fillStyle=i,t.fillRect(0,0,e.width,e.height),My(t,e.width,e.height),t.fillStyle="rgba(72, 152, 124, 0.11)";for(let a=0;a<9;a+=1){let o=-60+a*140;t.beginPath(),t.ellipse(o,470+a%3*18,148,45,-.12,0,Math.PI*2),t.fill()}t.strokeStyle="rgba(101, 74, 28, 0.12)",t.lineWidth=15,t.lineCap="round",t.beginPath(),t.moveTo(-70,452),t.bezierCurveTo(112,385,247,507,399,423),t.bezierCurveTo(552,339,709,440,1094,305),t.stroke(),t.strokeStyle="rgba(255, 248, 232, 0.20)",t.lineWidth=4,t.stroke(),t.fillStyle="rgba(33, 113, 80, 0.13)";for(let a=0;a<68;a+=1){let o=a*83%e.width,l=a*131%e.height,h=28+a*17%74;t.beginPath(),t.ellipse(o,l,h*1.4,h,a%5*.3,0,Math.PI*2),t.fill()}t.strokeStyle="rgba(68, 57, 46, 0.20)",t.lineWidth=6;for(let a=0;a<7;a+=1){let o=102+a*48;t.beginPath(),t.moveTo(554,o),t.bezierCurveTo(615,o-42,706,o+34,804,o-22),t.bezierCurveTo(873,o-60,946,o+11,1070,o-44),t.stroke()}t.strokeStyle="rgba(46, 27, 14, 0.13)",t.lineWidth=2.5;for(let a=54;a<e.height;a+=56)t.beginPath(),t.moveTo(-30,a),t.bezierCurveTo(150,a-36,280,a+42,470,a-8),t.bezierCurveTo(650,a-56,780,a+34,e.width+40,a-22),t.stroke();t.strokeStyle="rgba(27, 106, 100, 0.12)",t.lineWidth=2;for(let a=-70;a<e.width+90;a+=78)t.beginPath(),t.moveTo(a,-20),t.bezierCurveTo(a+120,160,a-90,350,a+140,e.height+30),t.stroke();t.save(),t.setLineDash([18,13]),t.lineCap="round",t.strokeStyle="rgba(101, 74, 28, 0.20)",t.lineWidth=5,[[[-24,248],[122,197,236,277,366,217],[506,154,612,232,714,184],[810,138,916,174,1048,120]],[[424,-20],[500,92,444,198,548,292],[646,382,586,478,742,676]],[[138,636],[226,512,336,564,430,452],[526,336,636,408,760,314],[862,236,930,284,1050,226]]].forEach(a=>{t.beginPath(),t.moveTo(a[0][0],a[0][1]);for(let o=1;o<a.length;o+=1){let l=a[o];t.bezierCurveTo(l[0],l[1],l[2],l[3],l[4],l[5])}t.stroke()}),t.strokeStyle="rgba(255, 248, 232, 0.50)",t.lineWidth=3,[[[-24,248],[122,197,236,277,366,217],[506,154,612,232,714,184],[810,138,916,174,1048,120]],[[424,-20],[500,92,444,198,548,292],[646,382,586,478,742,676]],[[138,636],[226,512,336,564,430,452],[526,336,636,408,760,314],[862,236,930,284,1050,226]]].forEach(a=>{t.beginPath(),t.moveTo(a[0][0],a[0][1]);for(let o=1;o<a.length;o+=1){let l=a[o];t.bezierCurveTo(l[0],l[1],l[2],l[3],l[4],l[5])}t.stroke()}),t.restore(),t.save(),t.globalCompositeOperation="multiply",t.strokeStyle="rgba(46, 27, 14, 0.08)",t.lineWidth=2;for(let a=34;a<e.height;a+=34)Wc(t,42,a,270,.11),Wc(t,676,a+10,250,.09);t.restore(),t.save(),t.globalAlpha=.72,Xc(t,170,436,.86),el(t,780,180,.84,"rgba(27, 106, 100, 0.58)"),el(t,332,222,.58,"rgba(101, 74, 28, 0.52)"),t.restore(),t.strokeStyle="rgba(101, 74, 28, 0.18)",t.lineWidth=2,t.setLineDash([12,10]),t.strokeRect(28,28,e.width-56,e.height-56),t.setLineDash([]);let r=t.createRadialGradient(e.width*.48,e.height*.46,80,e.width*.48,e.height*.46,590);r.addColorStop(0,"rgba(255, 248, 232, 0.12)"),r.addColorStop(.74,"rgba(255, 248, 232, 0)"),r.addColorStop(1,"rgba(46, 27, 14, 0.28)"),t.fillStyle=r,t.fillRect(0,0,e.width,e.height);let s=new je(e);return s.colorSpace=Le,s.wrapS=Jt,s.wrapT=Jt,s.minFilter=de,s.magFilter=de,oe.set(n,s),s}function Pd(n={}){let e=n.bounds||{minX:-1,maxX:1,minY:-1,maxY:1,centerX:0,centerY:0,width:2,height:2},t=Sn*1.72,i=e.minX-t,r=e.maxX+t,s=e.minY-t,a=e.maxY+t;return{minX:i,maxX:r,minY:s,maxY:a,centerX:(i+r)/2,centerY:(s+a)/2,width:Math.max(.01,r-i),height:Math.max(.01,a-s)}}function wy(n={x:0,y:0},e,t){return{x:(n.x-e.minX)/Math.max(.01,e.width)*t.width,y:t.height-(n.y-e.minY)/Math.max(.01,e.height)*t.height}}function Zo(n={},e=Qn(n)){let t=String(n.fogState||"locked_unknown");return Ei(n)?e==="forest"?{terrain:e,fill:"rgba(42, 126, 86, 0.46)",mid:"rgba(35, 145, 123, 0.26)",edge:"rgba(255, 248, 232, 0)",contour:"rgba(23, 80, 64, 0.20)",bridge:"rgba(43, 126, 91, 0.24)",fogOnly:!1}:e==="ridge"||e==="ruin_signal"?{terrain:e,fill:"rgba(118, 104, 85, 0.42)",mid:"rgba(194, 176, 128, 0.24)",edge:"rgba(255, 248, 232, 0)",contour:"rgba(68, 57, 46, 0.20)",bridge:"rgba(129, 111, 82, 0.22)",fogOnly:!1}:e==="water"?{terrain:e,fill:"rgba(63, 143, 166, 0.42)",mid:"rgba(123, 196, 207, 0.26)",edge:"rgba(255, 248, 232, 0)",contour:"rgba(35, 95, 126, 0.18)",bridge:"rgba(67, 148, 169, 0.22)",fogOnly:!1}:e==="settled"?{terrain:e,fill:"rgba(214, 181, 102, 0.44)",mid:"rgba(73, 143, 128, 0.24)",edge:"rgba(255, 248, 232, 0)",contour:"rgba(101, 74, 28, 0.18)",bridge:"rgba(196, 165, 94, 0.22)",fogOnly:!1}:{terrain:e,fill:"rgba(121, 158, 90, 0.38)",mid:"rgba(216, 209, 151, 0.22)",edge:"rgba(255, 248, 232, 0)",contour:"rgba(68, 91, 63, 0.17)",bridge:"rgba(124, 156, 97, 0.20)",fogOnly:!1}:t==="hinted"?{terrain:"hinted",fill:"rgba(224, 150, 52, 0.46)",mid:"rgba(245, 212, 132, 0.32)",edge:"rgba(255, 248, 232, 0)",contour:"rgba(101, 74, 28, 0.18)",bridge:"rgba(214, 148, 58, 0.20)",fogOnly:!0}:{terrain:"locked_unknown",fill:"rgba(157, 150, 132, 0.30)",mid:"rgba(104, 96, 82, 0.20)",edge:"rgba(255, 248, 232, 0)",contour:"rgba(255, 248, 232, 0.13)",bridge:"rgba(134, 126, 111, 0.14)",fogOnly:!0}}function Ay(n,e,t,i,r=0){let s=(e.x+t.x)/2,a=(e.y+t.y)/2,o=22+r*26;n.save(),n.filter="blur(13px)",n.lineCap="round",n.strokeStyle=i.bridge,n.lineWidth=104,n.beginPath(),n.moveTo(e.x,e.y),n.quadraticCurveTo(s,a-o,t.x,t.y),n.stroke(),n.restore()}function Cy(n,e,t,i,r=0){n.save();let s=n.createRadialGradient(e.x-t*.22,e.y-t*.24,t*.08,e.x,e.y,t);s.addColorStop(0,i.fill),s.addColorStop(.54,i.mid),s.addColorStop(1,i.edge),n.filter="blur(9px)",n.fillStyle=s,n.beginPath(),n.arc(e.x,e.y,t,0,Math.PI*2),n.fill(),n.restore(),n.save(),n.translate(e.x,e.y),n.rotate((r-.5)*.26),n.scale(1.28,.82),n.strokeStyle=i.contour,n.lineWidth=5,n.lineCap="round";for(let a=-2;a<=2;a+=1){let o=a*t*.18;n.beginPath(),n.moveTo(-t*.78,o),n.bezierCurveTo(-t*.34,o-t*.17,t*.18,o+t*.16,t*.76,o-t*.08),n.stroke()}i.fogOnly&&(n.setLineDash([15,13]),n.strokeStyle=i.terrain==="locked_unknown"?"rgba(255, 248, 232, 0.14)":"rgba(101, 74, 28, 0.22)",n.lineWidth=4,n.beginPath(),n.ellipse(0,0,t*.58,t*.34,-.08,0,Math.PI*2),n.stroke()),n.restore()}function Ry(n=[],e=Cd(n)){let t=nl(Ed),i=n.map(d=>`${d.cellId}:${d.fogState}:${Qn(d)}:${d.publicTerrainAssetSlot||""}:${d.fogAssetSlot||""}`).join("|"),r=`expedition-continuous-underlay:${Gt}:${i}:${t?"promoted-underlay-ready":"promoted-underlay-pending"}`;if(oe.has(r))return oe.get(r);let s=document.createElement("canvas");s.width=1024,s.height=768;let a=s.getContext("2d"),o=Pd(e),l=new Map;for(let d of n){let f=e.positions.get(String(d.cellId||""));f&&l.set(String(d.cellId||""),wy(f,o,s))}a.clearRect(0,0,s.width,s.height),a.fillStyle="rgba(255, 248, 232, 0.04)",a.fillRect(0,0,s.width,s.height),t&&(a.save(),a.globalAlpha=.68,a.drawImage(t,0,0,s.width,s.height),a.globalCompositeOperation="screen",a.globalAlpha=.18,a.fillStyle="rgba(255, 248, 232, 0.70)",a.fillRect(0,0,s.width,s.height),a.restore());for(let d=0;d<n.length;d+=1)for(let f=d+1;f<n.length;f+=1){let c=n[d],g=n[f];if(!Qc(c,g))continue;let S=l.get(String(c.cellId||"")),m=l.get(String(g.cellId||""));if(!S||!m)continue;let p=Zo(c),M=Zo(g),_=p.terrain==="locked_unknown"||M.terrain==="locked_unknown"?{bridge:"rgba(134, 126, 111, 0.12)"}:{bridge:p.fogOnly?p.bridge:M.fogOnly?M.bridge:"rgba(75, 132, 105, 0.20)"};Ay(a,S,m,_,jo(`${c.cellId}:${g.cellId}:underlay`))}let h=Math.min(s.width/o.width,s.height/o.height);for(let d of n){let f=l.get(String(d.cellId||""));if(!f)continue;let c=Qn(d),g=Zo(d,c),S=h*Sn*(g.fogOnly?1.28:1.38);Cy(a,f,S,g,jo(`${d.cellId}:${c}:underlay`))}a.save(),a.globalCompositeOperation="multiply",a.strokeStyle="rgba(46, 27, 14, 0.06)",a.lineWidth=2;for(let d=42;d<s.height;d+=36)a.beginPath(),a.moveTo(-40,d),a.bezierCurveTo(150,d-24,298,d+28,482,d-8),a.bezierCurveTo(648,d-42,818,d+22,s.width+40,d-16),a.stroke();a.restore();let u=new je(s);return u.colorSpace=Le,u.minFilter=de,u.magFilter=de,oe.set(r,u),u}function Iy(){let n=`expedition-civic-beacon:${Gt}`;if(oe.has(n))return oe.get(n);let e=document.createElement("canvas");e.width=256,e.height=256;let t=e.getContext("2d");t.clearRect(0,0,e.width,e.height);let i=t.createRadialGradient(128,126,16,128,126,116);i.addColorStop(0,"rgba(245, 212, 132, 0.48)"),i.addColorStop(.48,"rgba(27, 106, 100, 0.18)"),i.addColorStop(1,"rgba(255, 248, 232, 0)"),t.fillStyle=i,t.fillRect(0,0,e.width,e.height),t.strokeStyle="rgba(46, 27, 14, 0.42)",t.lineWidth=9,t.lineCap="round",t.beginPath(),t.moveTo(128,174),t.lineTo(128,80),t.stroke(),t.strokeStyle="rgba(27, 106, 100, 0.42)",t.lineWidth=5;for(let s=0;s<3;s+=1)t.beginPath(),t.arc(128,83,30+s*22,-.78,.78),t.stroke();t.fillStyle="rgba(245, 212, 132, 0.86)",t.strokeStyle="rgba(46, 27, 14, 0.44)",t.lineWidth=5,t.beginPath(),t.moveTo(136,76),t.lineTo(188,94),t.lineTo(136,116),t.closePath(),t.fill(),t.stroke(),t.fillStyle="rgba(255, 248, 232, 0.54)",t.beginPath(),t.roundRect(91,174,74,25,8),t.fill();let r=new je(e);return r.colorSpace=Le,r.minFilter=de,r.magFilter=de,oe.set(n,r),r}function Py(n={},e={x:0,y:0},t=!1,i=!1){let r=Zc(n,t),s=String(n.fogState||""),a=Qn(n),o=new pn;o.position.set(e.x,e.y,0);let l=Sn*(t?1.04:i?1.02:1),h=new dt(_d(l),new Ft({color:16777215,map:xd(n,t),transparent:!0,opacity:oy(s,t,i),side:Bt,depthWrite:!1}));h.position.z=-.1,h.userData={kind:"expedition_cell",cellId:String(n.cellId||""),fogState:String(n.fogState||""),terrain:a,regionPlate:!0,waterCue:a==="water",status:String(n.status||""),title:String(n.title||""),selected:t,hovered:i},o.add(h);let u=new In(new st().setFromPoints(vn(l*1.01)),new Nt({color:t?r.rim:r.line,transparent:!0,opacity:cy(s,t,i)}));u.position.z=-.04,o.add(u);let d=new dt(gd(zi*1.16),new Ft({color:r.shadow,transparent:!0,opacity:t?.18:.08,side:Bt,depthWrite:!1}));d.position.set(.08,-.09,-.01),o.add(d);let f=new dt(_d(zi),new Ft({color:16777215,map:xd(n,t),transparent:!0,opacity:ly(r,s,t,i),side:Bt,depthWrite:!1}));f.position.z=.02,f.userData={kind:"expedition_cell",cellId:String(n.cellId||""),fogState:String(n.fogState||""),terrain:a,waterCue:a==="water",status:String(n.status||""),title:String(n.title||""),selected:t,hovered:i},o.add(f);let c=new In(new st().setFromPoints(vn(zi*(t?1.08:1))),new Nt({color:r.line,transparent:!0,opacity:hy(r,s,t,i)}));if(c.position.z=.08,o.add(c),t){let S=new In(new st().setFromPoints(vn(l*1.08)),new Nt({color:r.rim,transparent:!0,opacity:.82}));S.position.z=.16,o.add(S)}if(i&&!t){let S=new In(new st().setFromPoints(vn(l*1.04)),new Nt({color:16775400,transparent:!0,opacity:.7}));S.position.z=.15,o.add(S)}if(s==="discovered"&&a==="settled"){let S=new In(new st().setFromPoints(vn(l*1.14)),new Nt({color:16774340,transparent:!0,opacity:.44}));S.position.z=.14,o.add(S);let m=new dt(gd(l*1.02),new Ft({color:16774340,transparent:!0,opacity:.07,side:Bt,depthWrite:!1}));m.position.z=.07,o.add(m)}if(s==="locked_unknown"){let S=new _r(new st().setFromPoints([new R(-.32,-.3,.1),new R(.32,.3,.1),new R(-.34,.02,.1),new R(.12,.46,.1),new R(-.1,-.46,.1),new R(.34,-.02,.1)]),new Nt({color:16775400,transparent:!0,opacity:.16}));o.add(S)}if(s==="hinted"&&String(n.kind||"")==="frontier_hint"){let S=new In(new st().setFromPoints(vn(l*1.03)),new Nt({color:1796708,transparent:!0,opacity:.64}));S.position.z=.12,o.add(S)}let g=new xt(new pt({map:yy(n,t),transparent:!0,depthTest:!0,depthWrite:!1,alphaTest:.03}));return g.position.set(0,t?.03:-.01,.2),g.scale.set(t?.72:.54,t?.72:.54,1),o.add(g),o}function Qc(n={},e={}){let t=ge(n.q,0),i=ge(n.r,0),r=ge(e.q,0),s=ge(e.r,0),a=t-r,o=i-s;return Math.max(Math.abs(a),Math.abs(o),Math.abs(a+o))===1}function Dy(n={},e={}){let t=[String(n.fogState||""),String(e.fogState||"")];return t.includes("locked_unknown")?null:t.includes("hinted")?{color:9071937,glow:16110724,opacity:.34,dash:[.16,.16]}:{color:1796708,glow:16110724,opacity:.5,dash:[.18,.13]}}function Ly(n,e,t){let i=Dy(n,e);if(!i)return null;let r=t.positions.get(String(n.cellId||"")),s=t.positions.get(String(e.cellId||""));if(!r||!s)return null;let a=new R((r.x+s.x)/2,(r.y+s.y)/2,-.2),o=.08+jo(`${n.cellId}:${e.cellId}`)*.1,l=new di(new R(r.x,r.y,-.2),new R(a.x,a.y+o,-.2),new R(s.x,s.y,-.2)),h=new st().setFromPoints(l.getPoints(32)),u=new mn(h,new br({color:i.color,transparent:!0,opacity:i.opacity,dashSize:i.dash[0],gapSize:i.dash[1]}));u.computeLineDistances(),u.userData={kind:"expedition_receipt_trace",routeAuthority:!1,visualOnly:!0};let d=new mn(h.clone(),new Nt({color:i.glow,transparent:!0,opacity:.14}));d.position.z=-.02,d.userData={kind:"expedition_receipt_trace_glow",routeAuthority:!1,visualOnly:!0};let f=new pn;return f.add(d,u),f.userData={kind:"expedition_receipt_trace_group",routeAuthority:!1,visualOnly:!0},f}function Dd(n={}){switch(String(n.unitType||n.role||"").toLowerCase()){case"scout":return{fill:"#1f756e",stroke:"#102f2f",accent:"#d6f1ef",glow:"#f5d484",glyph:"compass"};case"courier":return{fill:"#b95368",stroke:"#4f202b",accent:"#fff0bd",glow:"#78a9d6",glyph:"flag"};case"surveyor":return{fill:"#7a6540",stroke:"#342719",accent:"#d6f1ef",glow:"#82d6d0",glyph:"tripod"};case"settler_convoy":return{fill:"#c4883a",stroke:"#5a3418",accent:"#fff8e8",glow:"#f5d484",glyph:"wagon"};case"outpost_crew":return{fill:"#637f58",stroke:"#223a25",accent:"#ffe4a0",glow:"#82d6d0",glyph:"beacon"};default:return{fill:"#8a6d41",stroke:"#3b2513",accent:"#fff8e8",glow:"#82d6d0",glyph:"ledger"}}}function Fy(n={},e=!1){let t=`expedition-unit:${Gt}:${n.unitType}:${n.unitId}:${e?"selected":"idle"}`;if(oe.has(t))return oe.get(t);let i=Dd(n),r=document.createElement("canvas");r.width=192,r.height=192;let s=r.getContext("2d");s.clearRect(0,0,r.width,r.height),s.fillStyle="rgba(46, 27, 14, 0.24)",s.beginPath(),s.ellipse(96,146,55,18,0,0,Math.PI*2),s.fill(),s.fillStyle=e?"rgba(245, 212, 132, 0.34)":"rgba(255, 248, 232, 0.20)",s.strokeStyle=e?"#f5d484":"rgba(59, 37, 19, 0.55)",s.lineWidth=e?9:6,s.beginPath(),s.roundRect(38,30,116,116,34),s.fill(),s.stroke(),s.fillStyle=i.fill,s.strokeStyle=i.stroke,s.lineWidth=8,s.beginPath(),s.arc(96,88,42,0,Math.PI*2),s.fill(),s.stroke(),s.strokeStyle=i.accent,s.fillStyle=i.accent,s.lineWidth=8,s.lineCap="round",s.lineJoin="round",i.glyph==="compass"?(s.beginPath(),s.arc(96,88,24,0,Math.PI*2),s.moveTo(96,52),s.lineTo(96,66),s.moveTo(96,110),s.lineTo(96,124),s.moveTo(60,88),s.lineTo(74,88),s.moveTo(118,88),s.lineTo(132,88),s.stroke(),s.beginPath(),s.moveTo(96,58),s.lineTo(108,92),s.lineTo(84,118),s.closePath(),s.fill()):i.glyph==="flag"?(s.beginPath(),s.moveTo(80,122),s.lineTo(80,56),s.lineTo(124,68),s.lineTo(80,84),s.stroke()):i.glyph==="wagon"?(s.beginPath(),s.roundRect(66,80,60,34,9),s.stroke(),s.beginPath(),s.arc(78,124,9,0,Math.PI*2),s.arc(116,124,9,0,Math.PI*2),s.stroke()):i.glyph==="beacon"?(s.beginPath(),s.moveTo(72,124),s.lineTo(96,58),s.lineTo(120,124),s.stroke(),s.beginPath(),s.arc(96,62,15,0,Math.PI*2),s.fill()):i.glyph==="tripod"?(s.beginPath(),s.moveTo(96,58),s.lineTo(96,92),s.moveTo(96,92),s.lineTo(70,126),s.moveTo(96,92),s.lineTo(122,126),s.moveTo(76,70),s.lineTo(116,70),s.stroke(),s.beginPath(),s.arc(96,56,13,0,Math.PI*2),s.fill()):(s.beginPath(),s.roundRect(68,62,56,60,8),s.stroke(),s.beginPath(),s.moveTo(80,82),s.lineTo(112,82),s.moveTo(80,100),s.lineTo(106,100),s.stroke()),jc(s,Qo(n),28,22,136,136,34),s.fillStyle=i.glow,s.globalAlpha=e?.8:.46,s.beginPath(),s.arc(136,47,e?8:6,0,Math.PI*2),s.fill(),s.globalAlpha=1;let a=new je(r);return a.colorSpace=Le,a.minFilter=de,a.magFilter=de,oe.set(t,a),a}function Ny(n={}){return(Array.isArray(n.commandHints)?n.commandHints:[]).filter(e=>e?.enabled!==!1).length}function vd(n=""){let e=String(n||"").replace(/^cell[_-]?/i,"").replace(/_/g," ").trim(),t=e.match(/q(-?\d+)/i)?.[1],i=e.match(/r(-?\d+)/i)?.[1];return t!=null&&i!=null?`Q${t} R${i}`:e?e.toUpperCase().slice(0,8):"MAP"}function tl(n={}){let e=String(n.displayName||"").trim();if(e){let i=e.split(/\s+/).filter(Boolean);return i.length>1?i.map(r=>r[0]).join("").slice(0,3).toUpperCase():e.slice(0,3).toUpperCase()}let t=String(n.unitType||"").replace(/_/g," ");return/settler/i.test(t)?"STL":/outpost/i.test(t)?"OUT":/surveyor/i.test(t)?"SRV":/courier/i.test(t)?"CR":/scout/i.test(t)?"SCT":"UNT"}function Oy(n={},e=!1){let t=Qo(n),i=!!Jn(t),r=`expedition-hud-profile:${sn}:${n.unitId}:${n.unitType}:${i?"asset":"fallback"}:${e?"selected":"idle"}`;if(oe.has(r))return oe.get(r);let s=document.createElement("canvas");s.width=256,s.height=256;let a=s.getContext("2d"),o=Dd(n);a.clearRect(0,0,s.width,s.height),a.fillStyle="rgba(4, 16, 15, 0.42)",a.beginPath(),a.ellipse(128,214,78,20,0,0,Math.PI*2),a.fill();let l=a.createRadialGradient(88,54,10,128,126,118);l.addColorStop(0,"rgba(255, 248, 232, 0.96)"),l.addColorStop(.38,e?"rgba(245, 212, 132, 0.96)":"rgba(130, 214, 208, 0.74)"),l.addColorStop(.74,e?"rgba(183, 142, 70, 0.92)":"rgba(27, 106, 100, 0.82)"),l.addColorStop(1,"rgba(46, 27, 14, 0.95)"),a.fillStyle=l,a.beginPath(),a.arc(128,122,92,0,Math.PI*2),a.fill(),a.save(),a.beginPath(),a.arc(128,122,69,0,Math.PI*2),a.clip();let h=Jn(t);if(h)a.drawImage(h,45,38,166,166);else{let c=a.createRadialGradient(110,76,16,128,126,82);c.addColorStop(0,o.accent),c.addColorStop(1,o.fill),a.fillStyle=c,a.fillRect(45,38,166,166),a.fillStyle=o.accent,a.font="900 54px Georgia, serif",a.textAlign="center",a.textBaseline="middle",a.fillText(tl(n),128,122,112)}a.globalCompositeOperation="multiply",a.fillStyle=e?"rgba(255, 248, 232, 0.03)":"rgba(12, 33, 30, 0.13)",a.fillRect(45,38,166,166),a.globalCompositeOperation="screen";let u=a.createLinearGradient(48,38,206,184);u.addColorStop(0,"rgba(255, 248, 232, 0.18)"),u.addColorStop(.55,"rgba(255, 248, 232, 0.02)"),u.addColorStop(1,"rgba(12, 33, 30, 0.00)"),a.fillStyle=u,a.fillRect(45,38,166,166),a.restore(),a.strokeStyle=e?"#f5d484":"rgba(255, 248, 232, 0.72)",a.lineWidth=e?10:7,a.beginPath(),a.arc(128,122,72,0,Math.PI*2),a.stroke(),a.strokeStyle="rgba(12, 33, 30, 0.62)",a.lineWidth=5,a.beginPath(),a.arc(128,122,90,-.84,Math.PI*1.38),a.stroke();for(let c=0;c<8;c+=1){let g=Math.PI*2*c/8;an(a,128+Math.cos(g)*88,122+Math.sin(g)*88,e?4.5:3.8,c%2===0)}let d=a.createLinearGradient(82,186,174,219);d.addColorStop(0,e?"rgba(255, 248, 232, 0.98)":"rgba(255, 248, 232, 0.92)"),d.addColorStop(1,e?"rgba(245, 212, 132, 0.92)":"rgba(130, 214, 208, 0.64)"),a.fillStyle=d,a.strokeStyle="rgba(46, 27, 14, 0.58)",a.lineWidth=4,a.beginPath(),a.roundRect(80,187,96,31,11),a.fill(),a.stroke(),a.fillStyle="#2e1b0e",a.font='900 18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',a.textAlign="center",a.textBaseline="middle",a.fillText(tl(n),128,203,74);let f=new je(s);return f.colorSpace=Le,f.minFilter=de,f.magFilter=de,oe.set(r,f),f}function Uy(n={}){let e=n.objective&&typeof n.objective=="object"?n.objective:{},t=String(e.mode||"").toLowerCase();return t.includes("packet")?"PLAN":t.includes("review")?"REVIEW":t.includes("convoy")?"CONVOY":t.includes("settle")||t.includes("found")?"FOUND":t.includes("scout")?"SCOUT":e.targetCellId?"NEXT":"READY"}function Ld(n=""){let e=String(n||"");return e==="move_unit"?"\u21A6":e==="scout_sector"?"\u2316":e==="prepare_settler_convoy"?"\u25A3":e==="found_settlement"?"\u2302":/inspect/i.test(e)?"\u25C7":"\u2726"}function eh(n={}){let e=String(n.commandId||"");return e==="move_unit"?"MOVE":e==="scout_sector"?"SCOUT":e==="prepare_settler_convoy"?"CONVOY":e==="found_settlement"?"FOUND":String(n.label||e||"CMD").replace(/_/g," ").trim().split(/\s+/).filter(Boolean).slice(0,2).join(" ").toUpperCase()||"CMD"}function ky(n={}){return(Array.isArray(n.commandHints)?n.commandHints:[]).filter(t=>t&&String(t.commandId||"").trim()).slice(0,5).map(t=>({commandId:String(t.commandId||""),enabled:t.enabled!==!1,glyph:Ld(t.commandId),label:eh(t)}))}function an(n,e,t,i=7,r=!0){let s=n.createRadialGradient(e-i*.35,t-i*.45,1,e,t,i*1.18);s.addColorStop(0,r?"rgba(255, 248, 232, 0.95)":"rgba(245, 212, 132, 0.82)"),s.addColorStop(.45,"rgba(182, 151, 84, 0.92)"),s.addColorStop(1,"rgba(46, 27, 14, 0.86)"),n.fillStyle=s,n.beginPath(),n.arc(e,t,i,0,Math.PI*2),n.fill(),n.strokeStyle="rgba(12, 33, 30, 0.55)",n.lineWidth=Math.max(1.5,i*.24),n.stroke()}function $o(n,e,t,i=.12){n.save(),n.globalAlpha=i;for(let r=0;r<120;r+=1){let s=(r*97+23)%e,a=(r*53+41)%t,o=1+r%3;n.fillStyle=r%2===0?"rgba(255, 248, 232, 0.55)":"rgba(12, 33, 30, 0.45)",n.fillRect(s,a,o,1)}n.restore()}function Fd(n,e,t,i=.18){n.save(),n.globalAlpha=i;for(let r=0;r<34;r+=1){let s=r*37%Math.max(1,t)+(r%3-1)*4,a=16+r%5*7;n.strokeStyle=r%2===0?"rgba(255, 214, 138, 0.42)":"rgba(32, 17, 9, 0.54)",n.lineWidth=1+r%4,n.beginPath(),n.moveTo(-20,s);for(let o=0;o<=e+40;o+=90)n.bezierCurveTo(o+20,s-a,o+64,s+a,o+90,s+(r%2?-5:5));n.stroke()}for(let r=0;r<80;r+=1){let s=(r*131+17)%e,a=(r*71+33)%t;n.fillStyle=r%3===0?"rgba(255, 248, 232, 0.32)":"rgba(18, 9, 4, 0.35)",n.fillRect(s,a,1+r%5,1)}n.restore()}function qc(n,e,t,i,r,s=18){n.beginPath(),n.moveTo(e+s,t+5),n.lineTo(e+i*.28,t+1),n.lineTo(e+i*.34,t+7),n.lineTo(e+i*.58,t+3),n.lineTo(e+i-s,t+8),n.quadraticCurveTo(e+i-3,t+8,e+i-5,t+s),n.lineTo(e+i-2,t+r*.38),n.lineTo(e+i-9,t+r*.45),n.lineTo(e+i-4,t+r-s),n.quadraticCurveTo(e+i-4,t+r-3,e+i-s,t+r-5),n.lineTo(e+i*.66,t+r-1),n.lineTo(e+i*.57,t+r-8),n.lineTo(e+i*.22,t+r-4),n.lineTo(e+s,t+r-9),n.quadraticCurveTo(e+3,t+r-8,e+7,t+r-s),n.lineTo(e+2,t+r*.54),n.lineTo(e+9,t+r*.47),n.lineTo(e+4,t+s),n.quadraticCurveTo(e+3,t+6,e+s,t+5),n.closePath()}function Rs(n,e,t,i,r="rgba(245, 212, 132, 0.78)"){n.save(),n.translate(e,t),n.strokeStyle=r,n.fillStyle=r,n.lineWidth=Math.max(2,i*.07),n.beginPath(),n.arc(0,0,i,0,Math.PI*2),n.stroke(),n.beginPath();for(let s=0;s<8;s+=1){let a=Math.PI*2*s/8,o=s%2===0?i*.88:i*.62;n.moveTo(Math.cos(a)*i*.22,Math.sin(a)*i*.22),n.lineTo(Math.cos(a)*o,Math.sin(a)*o)}n.stroke(),n.rotate(-.48),n.beginPath(),n.moveTo(0,-i*.72),n.lineTo(i*.16,0),n.lineTo(0,i*.34),n.lineTo(-i*.16,0),n.closePath(),n.fill(),n.restore()}function By(n=""){let e=["crest-status","objective-loop","command-tray","command-puck","collapsed-ledger"].includes(n),t=["unit-dock","command-tray","command-puck"].includes(n),i=n==="selected-context";return{darkHardware:e,bottomHardware:t,parchment:i,wood:n==="unit-dock",outerA:i?"rgba(245, 224, 169, 0.98)":e?"rgba(6, 26, 25, 0.98)":"rgba(66, 36, 16, 0.96)",outerB:i?"rgba(219, 183, 118, 0.94)":e?"rgba(14, 68, 64, 0.96)":"rgba(114, 66, 28, 0.94)",outerC:i?"rgba(100, 61, 28, 0.78)":e?"rgba(29, 17, 10, 0.96)":"rgba(26, 12, 6, 0.98)",insetA:i?"rgba(255, 243, 202, 0.96)":e?"rgba(11, 51, 48, 0.84)":"rgba(94, 50, 20, 0.80)",insetB:i?"rgba(224, 190, 126, 0.88)":e?"rgba(18, 36, 32, 0.78)":"rgba(32, 16, 8, 0.74)",strokeA:"rgba(246, 209, 124, 0.90)",strokeB:i?"rgba(78, 44, 20, 0.54)":e?"rgba(130, 214, 208, 0.46)":"rgba(245, 212, 132, 0.38)",shadow:t?"rgba(0, 0, 0, 0.62)":"rgba(4, 16, 15, 0.42)",glow:e?"rgba(130, 214, 208, 0.52)":"rgba(245, 212, 132, 0.42)"}}function Hy(n={}){let e=String(n.commandId||"command"),t=String(n.glyph||Ld(e)).slice(0,3),i=String(n.label||eh(n)).toUpperCase().slice(0,10),r=n.enabled!==!1,s=`expedition-hud-command:${sn}:${e}:${r?"enabled":"disabled"}:${t}:${i}`;if(oe.has(s))return oe.get(s);let a=document.createElement("canvas");a.width=256,a.height=256;let o=a.getContext("2d");o.clearRect(0,0,a.width,a.height),o.fillStyle="rgba(4, 16, 15, 0.38)",o.beginPath(),o.ellipse(128,213,72,18,0,0,Math.PI*2),o.fill();let l=o.createRadialGradient(82,58,12,128,120,108);l.addColorStop(0,r?"rgba(255, 248, 232, 0.98)":"rgba(190, 184, 156, 0.72)"),l.addColorStop(.33,r?"rgba(245, 212, 132, 0.92)":"rgba(101, 113, 104, 0.62)"),l.addColorStop(.68,r?"rgba(27, 106, 100, 0.90)":"rgba(33, 48, 45, 0.74)"),l.addColorStop(1,"rgba(46, 27, 14, 0.92)"),o.fillStyle=l,o.beginPath(),o.arc(128,113,86,0,Math.PI*2),o.fill(),o.strokeStyle=r?"rgba(46, 27, 14, 0.76)":"rgba(46, 27, 14, 0.46)",o.lineWidth=11,o.beginPath(),o.arc(128,113,78,0,Math.PI*2),o.stroke(),o.strokeStyle=r?"rgba(255, 248, 232, 0.78)":"rgba(255, 248, 232, 0.36)",o.lineWidth=4,o.beginPath(),o.arc(128,113,64,0,Math.PI*2),o.stroke(),[60,196].forEach(d=>an(o,d,113,6,r)),o.fillStyle=r?"#fff8e8":"rgba(255, 248, 232, 0.56)",o.strokeStyle=r?"rgba(12, 33, 30, 0.72)":"rgba(12, 33, 30, 0.42)",o.lineWidth=8,o.textAlign="center",o.textBaseline="middle",o.shadowColor=r?"rgba(245, 212, 132, 0.38)":"transparent",o.shadowBlur=r?12:0,o.font="900 68px Georgia, serif",o.strokeText(t,128,108,116),o.fillText(t,128,108,116),o.shadowBlur=0;let h=o.createLinearGradient(54,176,202,212);h.addColorStop(0,r?"rgba(255, 248, 232, 0.96)":"rgba(190, 184, 156, 0.62)"),h.addColorStop(1,r?"rgba(245, 212, 132, 0.80)":"rgba(101, 113, 104, 0.48)"),o.fillStyle=h,o.strokeStyle="rgba(46, 27, 14, 0.66)",o.lineWidth=4,o.beginPath(),o.roundRect(54,178,148,34,10),o.fill(),o.stroke(),o.fillStyle=r?"#2e1b0e":"rgba(46, 27, 14, 0.62)",o.font='900 18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',o.fillText(i,128,196,118);let u=new je(a);return u.colorSpace=Le,u.minFilter=de,u.magFilter=de,oe.set(s,u),u}function zy(n={}){let e=String(n.slot||""),t=String(n.title||"").toUpperCase().slice(0,18),i=String(n.meta||"").toUpperCase().slice(0,24),r=String(n.tone||"light"),s=`expedition-hud-text:${sn}:${e}:${r}:${t}:${i}`;if(oe.has(s))return oe.get(s);let a=document.createElement("canvas");a.width=768,a.height=192;let o=a.getContext("2d");o.clearRect(0,0,a.width,a.height);let l=r!=="dark",h=e==="command-puck";if(["crest-status","objective-loop","unit-dock","command-puck","selected-context"].includes(e)){if(["crest-status","objective-loop","command-puck"].includes(e)){let M=new je(a);return M.colorSpace=Le,M.minFilter=de,M.magFilter=de,oe.set(s,M),M}let m=!["selected-context"].includes(e);o.textBaseline="middle",o.shadowColor=m?"rgba(0, 0, 0, 0.66)":"rgba(255, 248, 232, 0.38)",o.shadowBlur=m?8:3,o.lineWidth=m?7:4,e==="crest-status"?(o.textAlign="center",o.fillStyle="rgba(255, 248, 232, 0.96)",o.strokeStyle="rgba(25, 13, 7, 0.70)",o.font="900 46px Georgia, serif",o.strokeText(t||"EXPEDITION",410,82,440),o.fillText(t||"EXPEDITION",410,82,440),o.font='800 24px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',o.globalAlpha=.84,o.strokeText(i,410,132,420),o.fillText(i,410,132,420)):e==="objective-loop"?(o.textAlign="center",o.fillStyle="rgba(255, 248, 232, 0.98)",o.strokeStyle="rgba(4, 16, 15, 0.82)",o.font="900 58px Georgia, serif",o.strokeText(t||"SCOUT",384,96,560),o.fillText(t||"SCOUT",384,96,560)):e==="unit-dock"?(o.textAlign="center",o.fillStyle="rgba(255, 248, 232, 0.96)",o.strokeStyle="rgba(20, 9, 3, 0.78)",o.font="900 40px Georgia, serif",o.strokeText(t||"UNITS",132,88,210),o.fillText(t||"UNITS",132,88,210),o.font='800 22px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',o.strokeText(i,132,128,200),o.fillText(i,132,128,200)):e==="command-puck"?(o.textAlign="center",o.fillStyle="rgba(255, 248, 232, 0.96)",o.strokeStyle="rgba(4, 16, 15, 0.82)",o.font="900 42px Georgia, serif",o.strokeText(t||"NEXT",384,76,440),o.fillText(t||"NEXT",384,76,440),o.font='850 25px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',o.globalAlpha=.82,o.strokeText(i,384,126,420),o.fillText(i,384,126,420)):e==="selected-context"&&(o.textAlign="center",o.fillStyle="rgba(46, 27, 14, 0.96)",o.strokeStyle="rgba(255, 248, 232, 0.56)",o.font="900 46px Georgia, serif",o.strokeText(t||"PARCEL",384,68,470),o.fillText(t||"PARCEL",384,68,470),o.fillStyle="rgba(10, 84, 78, 0.92)",o.font="900 30px Georgia, serif",o.strokeText(i||"SCOUTED",384,134,420),o.fillText(i||"SCOUTED",384,134,420)),o.globalAlpha=1,o.shadowBlur=0;let p=new je(a);return p.colorSpace=Le,p.minFilter=de,p.magFilter=de,oe.set(s,p),p}let u=h?384:36,d=h?384:40,f=h?70:12,c=h?628:704,g=o.createLinearGradient(f,20,f+c,168);g.addColorStop(0,l?"rgba(10, 44, 41, 0.78)":"rgba(255, 248, 232, 0.82)"),g.addColorStop(.48,l?"rgba(27, 106, 100, 0.58)":"rgba(242, 224, 171, 0.74)"),g.addColorStop(1,l?"rgba(46, 27, 14, 0.70)":"rgba(183, 142, 70, 0.52)"),o.fillStyle=g,o.strokeStyle=l?"rgba(245, 212, 132, 0.62)":"rgba(46, 27, 14, 0.42)",o.lineWidth=5,o.beginPath(),o.roundRect(f,26,c,134,20),o.fill(),o.stroke(),o.globalAlpha=.86,o.strokeStyle=l?"rgba(130, 214, 208, 0.32)":"rgba(255, 248, 232, 0.34)",o.lineWidth=2,o.beginPath(),o.moveTo(f+22,50),o.lineTo(f+c-22,50),o.moveTo(f+22,142),o.lineTo(f+c-22,142),o.stroke(),o.globalAlpha=1,o.fillStyle=l?"rgba(255, 248, 232, 0.98)":"rgba(46, 27, 14, 0.95)",o.strokeStyle=l?"rgba(12, 33, 30, 0.70)":"rgba(255, 248, 232, 0.60)",o.shadowColor=l?"rgba(12, 33, 30, 0.52)":"rgba(255, 248, 232, 0.24)",o.shadowBlur=l?8:5,o.lineWidth=7,o.textAlign=h?"center":"left",o.textBaseline="middle",o.font='900 54px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',t&&(o.strokeText(t,u,76,h?560:640),o.fillText(t,u,76,h?560:640)),o.font='850 30px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',o.globalAlpha=.9,i&&(o.strokeText(i,d,132,h?520:610),o.fillText(i,d,132,h?520:610)),o.globalAlpha=1,o.shadowBlur=0;let S=new je(a);return S.colorSpace=Le,S.minFilter=de,S.magFilter=de,oe.set(s,S),S}function Vy(n={}){let e=String(n.slot||"hud"),t=`expedition-clean-hud-chrome:${sn}:${Cs}:${e}`;if(oe.has(t))return oe.get(t);let i=e==="collapsed-ledger",r=e==="command-puck",s=document.createElement("canvas");s.width=i?256:r?384:1024,s.height=i?1024:r?384:320;let a=s.getContext("2d"),o=s.width,l=s.height,h=r?28:i?24:34,u=r?148:i?56:64,d=By(e);a.clearRect(0,0,o,l);let f=()=>{let _=new je(s);return _.colorSpace=Le,_.minFilter=de,_.magFilter=de,oe.set(t,_),_};if(e==="unit-dock"){let _=a.createLinearGradient(0,0,0,l);_.addColorStop(0,"rgba(0, 0, 0, 0.00)"),_.addColorStop(.26,"rgba(12, 6, 2, 0.56)"),_.addColorStop(1,"rgba(4, 2, 1, 0.96)"),a.fillStyle=_,a.beginPath(),a.moveTo(0,l*.28),a.bezierCurveTo(o*.12,l*.12,o*.35,l*.2,o*.5,l*.3),a.bezierCurveTo(o*.7,l*.43,o*.86,l*.22,o,l*.32),a.lineTo(o,l),a.lineTo(0,l),a.closePath(),a.fill();let x=a.createLinearGradient(0,l*.38,o,l*.9);x.addColorStop(0,"rgba(29, 12, 5, 0.96)"),x.addColorStop(.28,"rgba(89, 48, 19, 0.98)"),x.addColorStop(.58,"rgba(42, 20, 8, 0.98)"),x.addColorStop(1,"rgba(13, 6, 3, 0.96)"),a.fillStyle=x,a.beginPath(),a.roundRect(0,l*.44,o*.98,l*.38,40),a.fill(),Fd(a,o,l,.24),a.strokeStyle="rgba(246, 209, 124, 0.58)",a.lineWidth=8,a.beginPath(),a.moveTo(28,l*.46),a.bezierCurveTo(o*.2,l*.34,o*.38,l*.48,o*.56,l*.53),a.bezierCurveTo(o*.72,l*.58,o*.86,l*.45,o-26,l*.5),a.stroke(),a.strokeStyle="rgba(9, 38, 35, 0.74)",a.lineWidth=6,a.beginPath(),a.moveTo(32,l*.78),a.lineTo(o*.9,l*.78),a.stroke();let w=l*.49;for(let E=0;E<5;E+=1){let C=o*(.24+E*.105),v=a.createRadialGradient(C-22,w-28,10,C,w,76);v.addColorStop(0,"rgba(255, 248, 232, 0.92)"),v.addColorStop(.28,"rgba(191, 149, 75, 0.96)"),v.addColorStop(.62,"rgba(38, 19, 8, 0.98)"),v.addColorStop(1,"rgba(5, 3, 2, 0.78)"),a.fillStyle=v,a.beginPath(),a.arc(C,w,E===0?72:61,0,Math.PI*2),a.fill(),a.strokeStyle=E===0?"rgba(130, 214, 208, 0.90)":"rgba(246, 209, 124, 0.56)",a.lineWidth=E===0?8:5,a.stroke(),an(a,C,w+(E===0?78:68),7,E===0)}return a.fillStyle="rgba(12, 33, 30, 0.86)",a.strokeStyle="rgba(246, 209, 124, 0.58)",a.lineWidth=5,a.beginPath(),a.roundRect(34,l*.49,118,62,10),a.fill(),a.stroke(),a.fillStyle="rgba(255, 248, 232, 0.92)",a.font="900 28px Georgia, serif",a.textAlign="center",a.textBaseline="middle",a.fillText("UNIT",93,l*.49+32,92),[34,o*.88,o*.96].forEach((E,C)=>an(a,E,l*.62,C===0?10:8,C<2)),f()}if(e==="command-tray"){a.shadowColor="rgba(0, 0, 0, 0.62)",a.shadowBlur=28,a.shadowOffsetY=12;let _=a.createLinearGradient(0,0,o,l);_.addColorStop(0,"rgba(7, 16, 14, 0.98)"),_.addColorStop(.26,"rgba(77, 49, 24, 0.98)"),_.addColorStop(.52,"rgba(15, 58, 54, 0.98)"),_.addColorStop(1,"rgba(21, 10, 5, 0.98)"),a.fillStyle=_,a.beginPath(),a.roundRect(26,26,o-52,l-52,48),a.fill(),a.shadowBlur=0,$o(a,o,l,.22);let x=o*.3,w=l*.48,E=a.createRadialGradient(x-44,w-46,12,x,w,134);E.addColorStop(0,"rgba(255, 248, 232, 0.95)"),E.addColorStop(.25,"rgba(75, 135, 122, 0.80)"),E.addColorStop(.58,"rgba(14, 38, 34, 0.92)"),E.addColorStop(1,"rgba(3, 8, 7, 0.98)"),a.fillStyle=E,a.beginPath(),a.arc(x,w,112,0,Math.PI*2),a.fill(),a.strokeStyle="rgba(246, 209, 124, 0.84)",a.lineWidth=15,a.stroke(),a.strokeStyle="rgba(130, 214, 208, 0.48)",a.lineWidth=4,a.beginPath(),a.arc(x,w,74,0,Math.PI*2),a.moveTo(x-88,w),a.lineTo(x+88,w),a.moveTo(x,w-88),a.lineTo(x,w+88),a.stroke(),a.strokeStyle="rgba(255, 248, 232, 0.50)",a.lineWidth=3;for(let O=0;O<6;O+=1){let G=Math.PI*2*O/6;a.beginPath(),a.arc(x+Math.cos(G)*44,w+Math.sin(G)*44,7,0,Math.PI*2),a.stroke()}let C=o*.55,v=l*.17,A=o*.34,L=l*.54,I=a.createLinearGradient(C,v,C+A,v+L);I.addColorStop(0,"rgba(255, 243, 202, 0.98)"),I.addColorStop(.56,"rgba(229, 197, 131, 0.96)"),I.addColorStop(1,"rgba(175, 126, 70, 0.92)"),qc(a,C,v,A,L,18),a.fillStyle=I,a.fill(),a.strokeStyle="rgba(55, 29, 13, 0.64)",a.lineWidth=4,a.stroke(),a.fillStyle="rgba(46, 27, 14, 0.92)",a.font="900 42px Georgia, serif",a.textAlign="center",a.textBaseline="middle",a.fillText("PARCEL",C+A/2,v+45,A-28),a.strokeStyle="rgba(27, 106, 100, 0.74)",a.lineWidth=6,a.beginPath();for(let O=0;O<6;O+=1){let G=-Math.PI/2+O*Math.PI/3,W=C+A/2+Math.cos(G)*47,N=v+L*.53+Math.sin(G)*47;O===0?a.moveTo(W,N):a.lineTo(W,N)}return a.closePath(),a.stroke(),a.fillStyle="rgba(27, 106, 100, 0.88)",a.font="900 28px Georgia, serif",a.fillText("SCOUTED",C+A/2,v+L-38,A-32),a.fillStyle="rgba(10, 44, 41, 0.94)",a.strokeStyle="rgba(246, 209, 124, 0.72)",a.lineWidth=5,a.beginPath(),a.roundRect(o*.55,l*.74,o*.34,54,9),a.fill(),a.stroke(),a.fillStyle="rgba(255, 248, 232, 0.96)",a.font='900 28px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',a.fillText("DOUBLE-CLICK MOVE",o*.72,l*.74+29,o*.3),[58,o-58,o*.5].forEach((O,G)=>an(a,O,l-48,G===2?7:9,G<2)),f()}if(e==="selected-context"){a.shadowColor="rgba(0, 0, 0, 0.48)",a.shadowBlur=22,a.shadowOffsetY=8,qc(a,42,26,o-84,l-52,22);let _=a.createLinearGradient(42,26,o-42,l-26);_.addColorStop(0,"rgba(255, 244, 205, 0.99)"),_.addColorStop(.52,"rgba(228, 195, 128, 0.96)"),_.addColorStop(1,"rgba(156, 99, 49, 0.86)"),a.fillStyle=_,a.fill(),a.shadowBlur=0,a.strokeStyle="rgba(55, 29, 13, 0.60)",a.lineWidth=6,a.stroke(),a.strokeStyle="rgba(46, 27, 14, 0.48)",a.lineWidth=3,a.beginPath(),a.moveTo(o*.18,l*.26),a.lineTo(o*.82,l*.26),a.moveTo(o*.16,l*.72),a.lineTo(o*.84,l*.72),a.stroke(),a.strokeStyle="rgba(27, 106, 100, 0.78)",a.lineWidth=7,a.beginPath();let x=o*.38,w=l*.5;for(let E=0;E<6;E+=1){let C=-Math.PI/2+E*Math.PI/3,v=x+Math.cos(C)*54,A=w+Math.sin(C)*54;E===0?a.moveTo(v,A):a.lineTo(v,A)}return a.closePath(),a.stroke(),Rs(a,o*.78,l*.76,36,"rgba(55, 29, 13, 0.58)"),f()}if(e==="crest-status"||e==="objective-loop"){let _=e==="objective-loop",x=a.createLinearGradient(0,0,o,l);return x.addColorStop(0,_?"rgba(8, 50, 48, 0.98)":"rgba(64, 31, 12, 0.98)"),x.addColorStop(.48,_?"rgba(17, 92, 86, 0.98)":"rgba(109, 65, 26, 0.98)"),x.addColorStop(1,"rgba(9, 6, 4, 0.98)"),a.shadowColor="rgba(0, 0, 0, 0.52)",a.shadowBlur=16,a.shadowOffsetY=5,a.fillStyle=x,a.beginPath(),_?(a.moveTo(38,48),a.lineTo(o-72,48),a.lineTo(o-36,l/2),a.lineTo(o-72,l-48),a.lineTo(38,l-48),a.closePath()):a.roundRect(34,34,o-68,l-68,26),a.fill(),a.shadowBlur=0,a.strokeStyle="rgba(246, 209, 124, 0.82)",a.lineWidth=7,a.stroke(),$o(a,o,l,.2),_?(a.fillStyle="rgba(255, 248, 232, 0.96)",a.font="900 54px Georgia, serif",a.textAlign="center",a.textBaseline="middle",a.fillText("SCOUT",o*.46,l*.52,o*.7),an(a,52,l/2,9,!0)):(Rs(a,108,l/2,42,"rgba(246, 209, 124, 0.86)"),a.fillStyle="rgba(255, 248, 232, 0.96)",a.font="900 48px Georgia, serif",a.textAlign="center",a.textBaseline="middle",a.fillText("EXPEDITION",o*.58,l*.51,o*.58),[38,o-38].forEach(w=>an(a,w,l/2,8,!0))),f()}if(e==="collapsed-ledger"){let _=a.createLinearGradient(0,0,o,l);return _.addColorStop(0,"rgba(46, 27, 14, 0.98)"),_.addColorStop(.4,"rgba(13, 65, 61, 0.98)"),_.addColorStop(1,"rgba(8, 6, 4, 0.98)"),a.fillStyle=_,a.beginPath(),a.roundRect(26,44,o-52,l-88,44),a.fill(),a.strokeStyle="rgba(246, 209, 124, 0.82)",a.lineWidth=10,a.stroke(),$o(a,o,l,.26),a.save(),a.translate(o/2,l/2),a.rotate(-Math.PI/2),a.fillStyle="rgba(255, 248, 232, 0.96)",a.font="900 78px Georgia, serif",a.textAlign="center",a.textBaseline="middle",a.fillText("LEDGER",0,0,l*.72),a.restore(),[84,l-84,l/2].forEach((x,w)=>an(a,o/2,x,w===2?10:12,w<2)),f()}if(e==="command-puck"){let _=a.createRadialGradient(o/2,l/2,10,o/2,l/2,o*.46);return _.addColorStop(0,"rgba(130, 214, 208, 0.46)"),_.addColorStop(.45,"rgba(246, 209, 124, 0.30)"),_.addColorStop(1,"rgba(9, 6, 4, 0.00)"),a.fillStyle=_,a.fillRect(0,0,o,l),Rs(a,o/2,l/2,o*.31,"rgba(246, 209, 124, 0.76)"),a.strokeStyle="rgba(130, 214, 208, 0.72)",a.lineWidth=8,a.beginPath(),a.arc(o/2,l/2,o*.2,0,Math.PI*2),a.stroke(),f()}a.save(),a.shadowColor=d.shadow,a.shadowBlur=d.bottomHardware?28:18,a.shadowOffsetY=d.bottomHardware?12:6;let c=a.createLinearGradient(0,0,o,l);c.addColorStop(0,d.outerA),c.addColorStop(.46,d.outerB),c.addColorStop(1,d.outerC),a.fillStyle=c,a.beginPath(),a.roundRect(h,h,o-h*2,l-h*2,u),a.fill(),a.restore(),a.save(),a.beginPath(),a.roundRect(h,h,o-h*2,l-h*2,u),a.clip(),$o(a,o,l,d.darkHardware?.16:.1),a.restore();let g=a.createLinearGradient(h,h,o-h,l-h);g.addColorStop(0,"rgba(255, 248, 232, 0.56)"),g.addColorStop(.24,d.strokeA),g.addColorStop(.72,"rgba(46, 27, 14, 0.34)"),g.addColorStop(1,d.strokeB),a.strokeStyle=g,a.lineWidth=r?12:9,a.beginPath(),a.roundRect(h+5,h+5,o-(h+5)*2,l-(h+5)*2,Math.max(18,u-8)),a.stroke();let S=h+(r?34:i?28:30),m=a.createLinearGradient(S,S,o-S,l-S);m.addColorStop(0,d.insetA),m.addColorStop(1,d.insetB),a.fillStyle=m,a.strokeStyle=d.strokeB,a.lineWidth=r?5:4,a.beginPath(),a.roundRect(S,S,o-S*2,l-S*2,Math.max(16,u-28)),a.fill(),a.stroke();let p=h+18;if([[p,p],[o-p,p],[p,l-p],[o-p,l-p]].forEach(([_,x],w)=>an(a,_,x,r?9:i?6:7,w<2)),a.globalAlpha=.72,a.strokeStyle=d.darkHardware?"rgba(255, 248, 232, 0.50)":"rgba(46, 27, 14, 0.40)",a.fillStyle=d.darkHardware?"rgba(255, 248, 232, 0.18)":"rgba(12, 33, 30, 0.12)",a.lineWidth=4,e==="unit-dock"){let _=l*.62;a.strokeStyle="rgba(46, 27, 14, 0.48)",a.lineWidth=5,a.beginPath(),a.moveTo(o*.3,_),a.lineTo(o*.9,_),a.stroke(),a.strokeStyle="rgba(245, 212, 132, 0.42)",a.lineWidth=3;for(let x=0;x<6;x+=1){let w=o*.43+x*o*.085;a.beginPath(),a.arc(w,_-10,42,0,Math.PI*2),a.stroke(),a.beginPath(),a.arc(w,_-10,27,0,Math.PI*2),a.stroke()}a.strokeStyle="rgba(12, 33, 30, 0.54)",a.lineWidth=5,a.beginPath(),a.arc(158,l/2,86,0,Math.PI*2),a.stroke(),a.strokeStyle="rgba(245, 212, 132, 0.42)",a.lineWidth=3,a.beginPath(),a.arc(158,l/2,54,0,Math.PI*2),a.stroke(),a.strokeStyle="rgba(245, 212, 132, 0.30)",a.lineWidth=8,a.beginPath(),a.moveTo(o*.82,l*.4),a.bezierCurveTo(o*.9,l*.44,o*.95,l*.58,o*.99,l*.62),a.stroke(),a.strokeStyle="rgba(12, 33, 30, 0.38)",a.lineWidth=4,a.beginPath(),a.moveTo(o*.84,l*.73),a.lineTo(o*.98,l*.73),a.stroke()}else if(e==="crest-status"){let x=l/2;a.strokeStyle="rgba(245, 212, 132, 0.72)",a.lineWidth=6,a.beginPath(),a.arc(156,x,72,0,Math.PI*2),a.stroke(),a.strokeStyle="rgba(130, 214, 208, 0.42)",a.lineWidth=3,a.beginPath(),a.arc(156,x,50,0,Math.PI*2),a.stroke(),a.fillStyle="rgba(255, 248, 232, 0.62)",a.beginPath(),a.moveTo(156,x-48),a.lineTo(182,x),a.lineTo(156,x+48),a.lineTo(130,x),a.closePath(),a.fill(),a.stroke()}else if(e==="collapsed-ledger"){a.strokeStyle="rgba(245, 212, 132, 0.58)",a.lineWidth=5,a.beginPath(),a.moveTo(o/2,128),a.lineTo(o/2,l-128),a.stroke();for(let _=0;_<7;_+=1){let x=180+_*96;a.fillStyle=_%2===0?"rgba(255, 248, 232, 0.26)":"rgba(130, 214, 208, 0.20)",a.beginPath(),a.arc(o/2,x,22,0,Math.PI*2),a.fill(),a.stroke()}}else if(e==="command-puck")a.strokeStyle="rgba(245, 212, 132, 0.68)",a.lineWidth=8,a.beginPath(),a.arc(o/2,l/2,110,0,Math.PI*2),a.stroke(),a.strokeStyle="rgba(130, 214, 208, 0.34)",a.lineWidth=4,a.beginPath(),a.arc(o/2,l/2,78,0,Math.PI*2),a.stroke();else if(e==="command-tray"){let _=l*.57;a.fillStyle="rgba(4, 16, 15, 0.30)",a.beginPath(),a.roundRect(o*.12,_-46,o*.72,92,32),a.fill(),a.strokeStyle="rgba(245, 212, 132, 0.44)",a.lineWidth=4;for(let x=0;x<5;x+=1){let w=o*.23+x*o*.115;a.beginPath(),a.arc(w,_,38,0,Math.PI*2),a.stroke()}a.strokeStyle="rgba(130, 214, 208, 0.40)",a.lineWidth=3,a.beginPath(),a.moveTo(o*.19,l*.78),a.lineTo(o*.72,l*.78),a.stroke(),a.strokeStyle="rgba(245, 212, 132, 0.32)",a.lineWidth=8,a.beginPath(),a.moveTo(o*.02,l*.62),a.bezierCurveTo(o*.08,l*.58,o*.11,l*.46,o*.18,l*.42),a.stroke(),a.strokeStyle="rgba(130, 214, 208, 0.30)",a.lineWidth=3,a.beginPath(),a.moveTo(o*.04,l*.74),a.lineTo(o*.2,l*.74),a.stroke()}else if(e==="objective-loop"){a.strokeStyle="rgba(46, 27, 14, 0.44)",a.lineWidth=4,a.beginPath(),a.moveTo(o*.14,l*.54),a.bezierCurveTo(o*.28,l*.34,o*.44,l*.74,o*.62,l*.52),a.stroke();for(let _=0;_<5;_+=1)an(a,o*(.15+_*.12),l*(.54+(_%2===0?-.04:.05)),6,_===0)}else if(e==="selected-context"){let _=o*.2,x=l*.52;a.strokeStyle="rgba(27, 106, 100, 0.54)",a.lineWidth=5,a.beginPath(),a.arc(_,x,52,0,Math.PI*2),a.stroke(),a.strokeStyle="rgba(245, 212, 132, 0.52)",a.lineWidth=3,a.beginPath(),a.moveTo(_-64,x),a.lineTo(_+64,x),a.moveTo(_,x-64),a.lineTo(_,x+64),a.stroke(),a.strokeStyle="rgba(245, 212, 132, 0.62)",a.lineWidth=7,a.beginPath(),a.moveTo(o*.02,x),a.lineTo(o*.08,x-22),a.lineTo(o*.08,x+22),a.closePath(),a.stroke(),a.fillStyle="rgba(245, 212, 132, 0.20)",a.fill()}a.globalAlpha=1;let M=new je(s);return M.colorSpace=Le,M.minFilter=de,M.magFilter=de,oe.set(t,M),M}function Oc(n="depth-veil"){let e=String(n||"depth-veil"),t=`expedition-hud-world-cohesion:${Cs}:${e}`;if(oe.has(t))return oe.get(t);let i=document.createElement("canvas");i.width=e==="bottom-bridge"?1024:768,i.height=e==="bottom-bridge"?320:768;let r=i.getContext("2d"),s=i.width,a=i.height;if(r.clearRect(0,0,s,a),e==="bottom-bridge"){let l=r.createLinearGradient(0,0,0,a);l.addColorStop(0,"rgba(4, 16, 15, 0.00)"),l.addColorStop(.3,"rgba(4, 16, 15, 0.08)"),l.addColorStop(.62,"rgba(4, 16, 15, 0.34)"),l.addColorStop(1,"rgba(4, 16, 15, 0.58)"),r.fillStyle=l,r.fillRect(0,0,s,a);let h=r.createLinearGradient(64,128,s-64,262);h.addColorStop(0,"rgba(12, 33, 30, 0.12)"),h.addColorStop(.18,"rgba(10, 44, 41, 0.62)"),h.addColorStop(.52,"rgba(78, 58, 32, 0.38)"),h.addColorStop(.82,"rgba(10, 44, 41, 0.62)"),h.addColorStop(1,"rgba(12, 33, 30, 0.12)"),r.fillStyle=h,r.beginPath(),r.roundRect(58,146,s-116,106,42),r.fill(),r.strokeStyle="rgba(245, 212, 132, 0.28)",r.lineWidth=7,r.beginPath(),r.moveTo(88,160),r.bezierCurveTo(260,110,420,170,514,186),r.bezierCurveTo(620,204,746,126,936,160),r.stroke(),r.strokeStyle="rgba(130, 214, 208, 0.20)",r.lineWidth=3;for(let u=0;u<11;u+=1){let d=122+u*82;r.beginPath(),r.moveTo(d,156),r.lineTo(d+36,246),r.stroke()}[118,232,784,906].forEach((u,d)=>an(r,u,204,d%2===0?8:6,d<2))}else if(e==="selected-aura"){let l=r.createRadialGradient(s/2,a/2,8,s/2,a/2,s*.46);l.addColorStop(0,"rgba(255, 248, 232, 0.34)"),l.addColorStop(.36,"rgba(245, 212, 132, 0.18)"),l.addColorStop(.7,"rgba(27, 106, 100, 0.10)"),l.addColorStop(1,"rgba(27, 106, 100, 0.00)"),r.fillStyle=l,r.fillRect(0,0,s,a),r.strokeStyle="rgba(245, 212, 132, 0.54)",r.lineWidth=7,r.setLineDash([22,15]),r.beginPath(),r.arc(s/2,a/2,s*.3,0,Math.PI*2),r.stroke(),r.setLineDash([]),r.strokeStyle="rgba(130, 214, 208, 0.38)",r.lineWidth=3,r.beginPath(),r.arc(s/2,a/2,s*.4,0,Math.PI*2),r.stroke()}else{let l=r.createRadialGradient(s*.5,a*.48,s*.1,s*.5,a*.5,s*.72);l.addColorStop(0,"rgba(4, 16, 15, 0.00)"),l.addColorStop(.5,"rgba(4, 16, 15, 0.03)"),l.addColorStop(.78,"rgba(4, 16, 15, 0.13)"),l.addColorStop(1,"rgba(4, 16, 15, 0.34)"),r.fillStyle=l,r.fillRect(0,0,s,a);let h=r.createLinearGradient(0,0,s,a*.56);h.addColorStop(0,"rgba(255, 248, 232, 0.13)"),h.addColorStop(.28,"rgba(255, 248, 232, 0.04)"),h.addColorStop(1,"rgba(255, 248, 232, 0.00)"),r.fillStyle=h,r.fillRect(0,0,s,a);let u=r.createLinearGradient(0,0,s,0);u.addColorStop(0,"rgba(10, 44, 41, 0.20)"),u.addColorStop(.18,"rgba(10, 44, 41, 0.04)"),u.addColorStop(.78,"rgba(10, 44, 41, 0.03)"),u.addColorStop(1,"rgba(10, 44, 41, 0.20)"),r.fillStyle=u,r.fillRect(0,0,s,a)}let o=new je(i);return o.colorSpace=Le,o.minFilter=de,o.magFilter=de,oe.set(t,o),o}function Pr(n="board-frame"){let e=String(n||"board-frame"),t=`expedition-frontier-ledger-scratch:${Bc}:${e}`;if(oe.has(t))return oe.get(t);let i=document.createElement("canvas");e==="bottom-medallion-rail"?(i.width=1536,i.height=360):e==="top-ledger-tabs"?(i.width=960,i.height=240):e==="right-ledger-tab"?(i.width=256,i.height=768):e==="parcel-rangefinder-backplate"?(i.width=720,i.height=420):e==="trail-pip"?(i.width=96,i.height=96):(i.width=1536,i.height=864);let r=i.getContext("2d"),s=i.width,a=i.height;if(r.clearRect(0,0,s,a),e==="board-frame"){let l=r.createRadialGradient(s*.5,a*.45,s*.16,s*.5,a*.5,s*.74);l.addColorStop(0,"rgba(255, 232, 172, 0.06)"),l.addColorStop(.56,"rgba(129, 79, 34, 0.08)"),l.addColorStop(.82,"rgba(25, 13, 7, 0.30)"),l.addColorStop(1,"rgba(5, 3, 2, 0.66)"),r.fillStyle=l,r.fillRect(0,0,s,a);let h=r.createLinearGradient(0,0,s,a);h.addColorStop(0,"rgba(238, 206, 139, 0.15)"),h.addColorStop(.46,"rgba(255, 239, 190, 0.06)"),h.addColorStop(1,"rgba(101, 58, 28, 0.18)"),r.fillStyle=h,qc(r,54,46,s-108,a-106,34),r.fill(),r.strokeStyle="rgba(76, 43, 20, 0.30)",r.lineWidth=10,r.stroke();let u=r.createLinearGradient(0,0,0,110);u.addColorStop(0,"rgba(15, 7, 3, 0.86)"),u.addColorStop(.55,"rgba(67, 35, 14, 0.62)"),u.addColorStop(1,"rgba(15, 7, 3, 0.02)"),r.fillStyle=u,r.fillRect(0,0,s,116);let d=r.createLinearGradient(0,0,72,0);d.addColorStop(0,"rgba(7, 3, 1, 0.82)"),d.addColorStop(.7,"rgba(64, 34, 14, 0.34)"),d.addColorStop(1,"rgba(7, 3, 1, 0.00)"),r.fillStyle=d,r.fillRect(0,0,92,a),r.save(),r.translate(s,0),r.scale(-1,1),r.fillStyle=d,r.fillRect(0,0,92,a),r.restore();let f=r.createLinearGradient(0,a-190,0,a);f.addColorStop(0,"rgba(5, 3, 2, 0.00)"),f.addColorStop(.36,"rgba(23, 12, 5, 0.68)"),f.addColorStop(1,"rgba(3, 1, 0, 0.94)"),r.fillStyle=f,r.fillRect(0,a-190,s,190),r.strokeStyle="rgba(246, 209, 124, 0.35)",r.lineWidth=6,r.setLineDash([32,18]),r.strokeRect(72,58,s-144,a-128),r.setLineDash([]),[[38,44],[s-38,44],[38,a-38],[s-38,a-38]].forEach(([c,g],S)=>{an(r,c,g,S<2?12:14,S%2===0)})}else if(e==="bottom-medallion-rail"){let l=r.createLinearGradient(0,0,0,a);l.addColorStop(0,"rgba(0, 0, 0, 0.00)"),l.addColorStop(.34,"rgba(15, 8, 3, 0.68)"),l.addColorStop(1,"rgba(3, 1, 0, 0.98)"),r.fillStyle=l,r.fillRect(0,0,s,a);let h=r.createLinearGradient(0,a*.36,s,a*.92);h.addColorStop(0,"rgba(23, 10, 4, 0.98)"),h.addColorStop(.25,"rgba(91, 48, 18, 0.98)"),h.addColorStop(.5,"rgba(44, 20, 8, 0.98)"),h.addColorStop(.8,"rgba(98, 52, 20, 0.96)"),h.addColorStop(1,"rgba(15, 7, 3, 0.98)"),r.fillStyle=h,r.beginPath(),r.roundRect(0,a*.45,s,a*.36,48),r.fill(),Fd(r,s,a,.26),r.strokeStyle="rgba(246, 209, 124, 0.44)",r.lineWidth=8,r.beginPath(),r.moveTo(s*.02,a*.49),r.bezierCurveTo(s*.18,a*.32,s*.34,a*.5,s*.5,a*.54),r.bezierCurveTo(s*.68,a*.59,s*.82,a*.39,s*.98,a*.5),r.stroke();for(let u=0;u<6;u+=1){let d=s*(.28+u*.095),f=a*.47;r.strokeStyle=u===0?"rgba(130, 214, 208, 0.76)":"rgba(246, 209, 124, 0.44)",r.lineWidth=u===0?8:5,r.beginPath(),r.arc(d,f,u===0?78:60,0,Math.PI*2),r.stroke()}}else if(e==="parcel-rangefinder-backplate"){r.shadowColor="rgba(0, 0, 0, 0.58)",r.shadowBlur=24,r.shadowOffsetY=10;let l=r.createLinearGradient(0,0,s,a);l.addColorStop(0,"rgba(9, 15, 13, 0.86)"),l.addColorStop(.42,"rgba(80, 49, 23, 0.74)"),l.addColorStop(1,"rgba(10, 5, 2, 0.82)"),r.fillStyle=l,r.beginPath(),r.roundRect(24,34,s-48,a-68,42),r.fill(),r.shadowBlur=0,r.strokeStyle="rgba(246, 209, 124, 0.46)",r.lineWidth=8,r.stroke(),r.strokeStyle="rgba(130, 214, 208, 0.32)",r.lineWidth=4,r.beginPath(),r.arc(s*.29,a*.5,118,0,Math.PI*2),r.stroke(),Rs(r,s*.29,a*.5,86,"rgba(246, 209, 124, 0.38)"),[54,s-54,s*.52].forEach((h,u)=>an(r,h,a-54,u===2?7:9,!0))}else if(e==="right-ledger-tab"){let l=r.createLinearGradient(0,0,s,a);l.addColorStop(0,"rgba(16, 8, 3, 0.82)"),l.addColorStop(.42,"rgba(10, 56, 53, 0.80)"),l.addColorStop(1,"rgba(5, 3, 1, 0.88)"),r.fillStyle=l,r.beginPath(),r.roundRect(72,38,150,a-76,46),r.fill(),r.strokeStyle="rgba(246, 209, 124, 0.52)",r.lineWidth=8,r.stroke(),r.save(),r.translate(148,a/2),r.rotate(-Math.PI/2),r.fillStyle="rgba(255, 248, 232, 0.82)",r.font="900 64px Georgia, serif",r.textAlign="center",r.textBaseline="middle",r.fillText("LEDGER",0,0,a*.62),r.restore()}else if(e==="top-ledger-tabs"){let l=r.createLinearGradient(0,0,s,a);l.addColorStop(0,"rgba(50, 24, 10, 0.90)"),l.addColorStop(.54,"rgba(11, 46, 43, 0.88)"),l.addColorStop(1,"rgba(10, 5, 2, 0.72)"),r.fillStyle=l,r.beginPath(),r.roundRect(12,38,s*.58,a*.44,28),r.fill(),r.strokeStyle="rgba(246, 209, 124, 0.48)",r.lineWidth=6,r.stroke(),Rs(r,74,a*.6,38,"rgba(246, 209, 124, 0.58)")}else if(e==="trail-pip"){let l=r.createRadialGradient(s/2,a/2,2,s/2,a/2,s*.42);l.addColorStop(0,"rgba(255, 248, 232, 0.98)"),l.addColorStop(.4,"rgba(246, 209, 124, 0.88)"),l.addColorStop(.72,"rgba(130, 214, 208, 0.40)"),l.addColorStop(1,"rgba(130, 214, 208, 0.00)"),r.fillStyle=l,r.fillRect(0,0,s,a),r.fillStyle="rgba(255, 248, 232, 0.96)",r.beginPath(),r.arc(s/2,a/2,s*.16,0,Math.PI*2),r.fill()}let o=new je(i);return o.colorSpace=Le,o.minFilter=de,o.magFilter=de,oe.set(t,o),o}function Gy(n,e="expedition-three-raycast"){let t=n?.userData||{};return{unitId:String(t.unitId||""),unitType:String(t.unitType||""),displayName:String(t.displayName||""),cellId:String(t.cellId||""),source:e,atMs:Date.now()}}function Wy(n,e="expedition-three-raycast"){let t=n?.userData||{};return{markerKind:String(t.kind||""),packetId:String(t.packetId||""),mode:String(t.mode||""),cellId:String(t.cellId||t.targetCellId||""),targetCellId:String(t.targetCellId||t.cellId||""),visualOnly:t.visualOnly===!0,readOnly:t.readOnly===!0,source:e,atMs:Date.now()}}function Xy(n,e="expedition-three-raycast"){let t=n?.userData||{};return{unitId:String(t.unitId||""),unitType:String(t.unitType||""),commandId:String(t.commandId||""),cellId:String(t.cellId||""),targetCellId:String(t.cellId||""),fogState:String(t.fogState||""),serverMutationImplemented:t.serverMutationImplemented===!0,movementMutation:t.movementMutation===!0,visualOnly:t.visualOnly===!0,readOnly:t.readOnly===!0,previewOnly:t.previewOnly===!0,source:e,atMs:Date.now()}}function Nd(n=""){switch(String(n||"")){case"move_unit":return{stroke:"#1b6a64",fill:"rgba(130, 214, 208, 0.18)",glyph:"move"};case"scout_sector":return{stroke:"#d19a48",fill:"rgba(245, 212, 132, 0.20)",glyph:"scout"};case"prepare_settler_convoy":return{stroke:"#c4883a",fill:"rgba(255, 226, 128, 0.18)",glyph:"convoy"};case"found_settlement":return{stroke:"#637f58",fill:"rgba(130, 214, 208, 0.16)",glyph:"outpost"};default:return{stroke:"#8a6d41",fill:"rgba(255, 248, 232, 0.16)",glyph:"inspect"}}}function qy(n={}){let e=String(n.commandId||"inspect"),t=String(n.fogState||""),i=`expedition-command-target:${Gt}:${e}:${t}`;if(oe.has(i))return oe.get(i);let r=document.createElement("canvas");r.width=256,r.height=256;let s=r.getContext("2d"),a=Nd(e);s.clearRect(0,0,r.width,r.height),s.fillStyle=a.fill,s.beginPath(),s.arc(128,128,106,0,Math.PI*2),s.fill(),s.strokeStyle=a.stroke,s.lineWidth=e==="scout_sector"?10:8,e==="scout_sector"&&s.setLineDash([18,12]),s.beginPath(),s.arc(128,128,98,0,Math.PI*2),s.stroke(),s.setLineDash([]),s.strokeStyle="rgba(255, 248, 232, 0.72)",s.lineWidth=4,s.beginPath(),s.arc(128,128,80,0,Math.PI*2),s.stroke(),s.fillStyle="rgba(46, 27, 14, 0.24)",s.beginPath(),s.ellipse(128,210,54,13,0,0,Math.PI*2),s.fill(),s.strokeStyle=a.stroke,s.fillStyle="#fff8e8",s.lineWidth=8,s.lineCap="round",s.lineJoin="round",a.glyph==="move"?(s.beginPath(),s.moveTo(86,128),s.lineTo(164,128),s.moveTo(140,104),s.lineTo(164,128),s.lineTo(140,152),s.stroke()):a.glyph==="scout"?(s.beginPath(),s.arc(128,128,30,0,Math.PI*2),s.moveTo(128,78),s.lineTo(128,98),s.moveTo(128,158),s.lineTo(128,178),s.moveTo(78,128),s.lineTo(98,128),s.moveTo(158,128),s.lineTo(178,128),s.stroke()):a.glyph==="convoy"?(s.beginPath(),s.roundRect(88,112,80,38,10),s.stroke(),s.beginPath(),s.arc(104,164,10,0,Math.PI*2),s.arc(152,164,10,0,Math.PI*2),s.stroke()):a.glyph==="outpost"?(s.beginPath(),s.moveTo(96,174),s.lineTo(128,82),s.lineTo(160,174),s.stroke(),s.beginPath(),s.arc(128,84,18,0,Math.PI*2),s.fillStyle=a.stroke,s.fill()):(s.beginPath(),s.roundRect(96,88,64,78,10),s.stroke()),s.save(),s.strokeStyle="rgba(130, 214, 208, 0.82)",s.lineWidth=5,s.setLineDash([10,10]),s.beginPath(),s.arc(128,128,116,0,Math.PI*2),s.stroke(),s.setLineDash([]),s.strokeStyle="rgba(246, 209, 124, 0.74)",s.lineWidth=3,s.beginPath(),s.moveTo(128,28),s.lineTo(128,58),s.moveTo(128,198),s.lineTo(128,228),s.moveTo(28,128),s.lineTo(58,128),s.moveTo(198,128),s.lineTo(228,128),s.stroke();let o=eh({commandId:e}).replace("MOVE","TARGET").slice(0,8),l=s.createLinearGradient(66,20,190,58);l.addColorStop(0,"rgba(255, 243, 202, 0.96)"),l.addColorStop(1,"rgba(195, 139, 72, 0.88)"),s.fillStyle=l,s.strokeStyle="rgba(46, 27, 14, 0.66)",s.lineWidth=4,s.beginPath(),s.roundRect(62,20,132,38,8),s.fill(),s.stroke(),s.fillStyle="rgba(46, 27, 14, 0.94)",s.font="900 18px Georgia, serif",s.textAlign="center",s.textBaseline="middle",s.fillText(o||"TARGET",128,40,110),s.restore();let h=new je(r);return h.colorSpace=Le,h.minFilter=de,h.magFilter=de,oe.set(i,h),h}function Yy(n={}){let e=String(n.commandId||"command"),t=String(n.feedbackId||`${e}:${n.cellId||""}`),i=`expedition-command-outcome:${Gt}:${t}`;if(oe.has(i))return oe.get(i);let r=document.createElement("canvas");r.width=256,r.height=256;let s=r.getContext("2d"),a=Nd(e);s.clearRect(0,0,r.width,r.height),s.fillStyle=a.fill,s.beginPath(),s.arc(128,128,116,0,Math.PI*2),s.fill(),s.strokeStyle=a.stroke,s.lineWidth=10,s.beginPath(),s.arc(128,128,104,0,Math.PI*2),s.stroke(),s.strokeStyle="rgba(255, 248, 232, 0.78)",s.lineWidth=5,s.beginPath(),s.arc(128,128,78,0,Math.PI*2),s.stroke(),s.fillStyle="rgba(255, 248, 232, 0.88)",s.beginPath(),s.arc(128,128,42,0,Math.PI*2),s.fill(),s.strokeStyle=a.stroke,s.lineWidth=9,s.lineCap="round",s.lineJoin="round",e==="move_unit"?(s.beginPath(),s.moveTo(92,128),s.lineTo(160,128),s.moveTo(138,106),s.lineTo(160,128),s.lineTo(138,150),s.stroke()):e==="scout_sector"?(s.beginPath(),s.arc(128,128,24,0,Math.PI*2),s.moveTo(128,88),s.lineTo(128,104),s.moveTo(128,152),s.lineTo(128,168),s.moveTo(88,128),s.lineTo(104,128),s.moveTo(152,128),s.lineTo(168,128),s.stroke()):e==="prepare_settler_convoy"?(s.beginPath(),s.roundRect(92,112,72,34,9),s.stroke(),s.beginPath(),s.arc(106,158,8,0,Math.PI*2),s.arc(150,158,8,0,Math.PI*2),s.stroke()):e==="found_settlement"?(s.beginPath(),s.moveTo(96,158),s.lineTo(128,96),s.lineTo(160,158),s.stroke(),s.beginPath(),s.moveTo(108,158),s.lineTo(156,158),s.stroke()):(s.beginPath(),s.moveTo(98,130),s.lineTo(120,152),s.lineTo(164,104),s.stroke());let o=new je(r);return o.colorSpace=Le,o.minFilter=de,o.magFilter=de,oe.set(i,o),o}function $y(n={},e=new Map){if(!n?.unitId)return[];let t=new Map,i=(s={},a="",o="")=>{let l=String(s.commandId||o||""),h=String(a||"").trim();if(!l||!h)return;let u=e.get(h);if(!u)return;let d=String(u.fogState||"");if(l==="scout_sector"){if(!(d==="hinted"&&String(u.kind||"")==="frontier_hint"))return}else if(!["discovered","known"].includes(d))return;let f=`${l}:${h}`;t.has(f)||t.set(f,{unitId:String(n.unitId||""),unitType:String(n.unitType||""),commandId:l,cellId:h,fogState:d,serverMutationImplemented:s.serverMutationImplemented===!0||l==="move_unit"&&n.movement?.movementMutationImplemented===!0,movementMutation:l==="move_unit",routeAuthority:!1,actionAuthority:!1,visualOnly:!0,readOnly:!0,source:o})};return(Array.isArray(n.commandHints)?n.commandHints:[]).filter(s=>s&&s.enabled!==!1).forEach(s=>{let a=String(s.commandId||""),o=Array.isArray(s.targetCellIds)?s.targetCellIds.map(l=>String(l||"")).filter(Boolean):[];if(a==="move_unit"){let l=Array.isArray(n.movement?.allowedTargetCellIds)?n.movement.allowedTargetCellIds.map(h=>String(h||"")).filter(Boolean):[];[...new Set([...o,...l])].forEach(h=>i(s,h,"movement"));return}o.forEach(l=>i(s,l,"command_hint"))}),Array.from(t.values())}function Zy(n={},e={}){let t=ge(n.q,0)-ge(e.q,0),i=ge(n.r,0)-ge(e.r,0),r=ge(n.q,0)+ge(n.r,0)-(ge(e.q,0)+ge(e.r,0));return Math.max(Math.abs(t),Math.abs(i),Math.abs(r))}function Ky(n={},e=new Map,t=[]){if(!n?.unitId||String(n.unitType||n.role||"").toLowerCase()!=="outpost_crew")return null;let i=String(n.location?.cellId||n.cellId||"").trim();if(!i)return null;let r=e.get(i);if(!r||!["discovered","known"].includes(String(r.fogState||""))||!`${r.kind||""} ${r.status||""} ${(Array.isArray(r.traits)?r.traits:[]).join(" ")}`.toLowerCase().includes("outpost"))return null;let a=t.filter(l=>String(l.fogState||"")==="hinted"&&String(l.kind||"")==="frontier_hint").filter(l=>l.readOnly!==!1).map(l=>{let h=String(l.sourceIds?.adjacentCellId||"")===i;return{cell:l,adjacentSource:h,adjacentGeometry:Qc(r,l),distance:Zy(r,l)}}).filter(l=>l.adjacentSource||l.adjacentGeometry||Number.isFinite(l.distance));if(!a.length)return null;a.sort((l,h)=>l.adjacentSource!==h.adjacentSource?l.adjacentSource?-1:1:l.adjacentGeometry!==h.adjacentGeometry?l.adjacentGeometry?-1:1:l.distance-h.distance);let o=a[0].cell;return{unitId:String(n.unitId||""),unitType:String(n.unitType||""),commandId:"scout_sector",cueLabel:"Next Scout",originCellId:i,targetCellId:String(o.cellId||""),targetFogState:String(o.fogState||""),targetKind:String(o.kind||""),derivedFrom:a[0].adjacentSource?"sourceIds.adjacentCellId":"nearest_visible_hinted_frontier_cell",visualOnly:!0,readOnly:!0,selectable:!1,routeAuthority:!1,actionAuthority:!1,executableActions:0,hiddenTruthLeakage:!1}}function Jy(n=!1){let e=`expedition-outpost-next-frontier:${Gt}:${n?"selected":"idle"}`;if(oe.has(e))return oe.get(e);let t=document.createElement("canvas");t.width=256,t.height=256;let i=t.getContext("2d");i.clearRect(0,0,t.width,t.height),i.fillStyle=n?"rgba(245, 212, 132, 0.22)":"rgba(255, 226, 128, 0.16)",i.beginPath(),i.arc(128,128,112,0,Math.PI*2),i.fill(),i.strokeStyle=n?"rgba(245, 212, 132, 0.92)":"rgba(209, 154, 72, 0.76)",i.lineWidth=n?12:9,i.setLineDash([18,12]),i.beginPath(),i.arc(128,128,100,0,Math.PI*2),i.stroke(),i.setLineDash([]),i.strokeStyle="rgba(27, 106, 100, 0.58)",i.lineWidth=5,i.beginPath(),i.arc(128,128,70,0,Math.PI*2),i.stroke(),i.fillStyle="rgba(255, 248, 232, 0.86)",i.beginPath(),i.moveTo(128,70),i.lineTo(148,128),i.lineTo(128,186),i.lineTo(108,128),i.closePath(),i.fill(),i.strokeStyle="rgba(46, 27, 14, 0.42)",i.lineWidth=4,i.stroke(),i.fillStyle=n?"rgba(46, 27, 14, 0.72)":"rgba(46, 27, 14, 0.58)",i.font="900 20px sans-serif",i.textAlign="center",i.textBaseline="middle",i.fillText("NEXT",128,214);let r=new je(t);return r.colorSpace=Le,r.minFilter=de,r.magFilter=de,oe.set(e,r),r}function jy(n={},e={},t=!1){let i=e.positions?.get?.(String(n.originCellId||"")),r=e.positions?.get?.(String(n.targetCellId||""));if(!i||!r)return null;let s={x:(i.x+r.x)/2,y:(i.y+r.y)/2},a=.34+Math.min(2.2,Math.hypot(r.x-i.x,r.y-i.y))*.12,o=new di(new R(i.x,i.y+.3,.485),new R(s.x,s.y+a,.485),new R(r.x,r.y+.02,.485)),l=new st().setFromPoints(o.getPoints(34)),h=new mn(l,new br({color:13736520,transparent:!0,opacity:t?.88:.68,dashSize:.12,gapSize:.09}));h.computeLineDistances(),h.userData={kind:"expedition_outpost_next_frontier_connection",...n};let u=new mn(l.clone(),new Nt({color:16110724,transparent:!0,opacity:t?.22:.14}));u.position.z=-.01,u.userData={kind:"expedition_outpost_next_frontier_connection_glow",...n};let d=new xt(new pt({map:Jy(t),transparent:!0,depthWrite:!1,depthTest:!0,alphaTest:.03,opacity:t?.94:.82}));d.position.set(r.x,r.y+.03,.505),d.scale.set(t?1.22:1.08,t?1.22:1.08,1),d.userData={kind:"expedition_outpost_next_frontier_beacon",...n};let f=new pn;return f.add(u,h,d),f.userData={kind:"expedition_outpost_next_frontier_group",...n},{group:f,ring:d,line:h}}function Qy(n,e="expedition-three-raycast"){let t=n?.userData||{};return{cellId:String(t.cellId||""),fogState:String(t.fogState||""),status:String(t.status||""),title:String(t.title||""),source:e,atMs:Date.now()}}var Yc=class{constructor(e){this.hostNode=e,this.model={},this.cells=[],this.info={},this.pickables=[],this.cellMeshes=[],this.unitSprites=[],this.commandTargetSprites=[],this.outcomeFeedbackSprites=[],this.eventMarkerSprites=[],this.objectiveMarkerSprites=[],this.outpostFrontierBeaconSprites=[],this.generatedHudWorldCohesionSprites=[],this.generatedHudWorldCohesionLines=[],this.generatedHudChromeSprites=[],this.generatedHudProfileSprites=[],this.generatedHudTextSprites=[],this.generatedHudCommandSprites=[],this.frontierLedgerScratchSprites=[],this.frontierLedgerScratchTrailPips=[],this.outcomeFeedback=null,this.hoverCellId="",this.terrainUnderlayCount=0,this.surveyStrokeCount=0,this.markerCount=0,this.unitTokenCount=0,this.commandTargetCount=0,this.outcomeFeedbackCount=0,this.eventMarkerCount=0,this.objectiveMarkerCount=0,this.outpostFrontierBeaconCount=0,this.generatedHudWorldCohesionCount=0,this.generatedHudWorldTetherCount=0,this.generatedHudChromeCount=0,this.generatedHudProfileCount=0,this.generatedHudTextCount=0,this.generatedHudCommandCount=0,this.frontierLedgerScratchSpriteCount=0,this.frontierLedgerScratchTrailPipCount=0,this.scene=new mr,this.camera=new gi(-Zn/2,Zn/2,Kn/2,-Kn/2,.1,100),this.camera.position.set(0,0,10),this.camera.lookAt(0,0,0),this.raycaster=new Tr,this.pointer=new xe,this.renderer=new ws({antialias:!0,alpha:!1,preserveDrawingBuffer:!0}),this.renderer.setClearColor(2957590,1),this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),this.renderer.domElement.className="fp-expedition-three-canvas",this.renderer.domElement.dataset.testid="fp-expedition-three-canvas",this.renderer.domElement.setAttribute("aria-label","Zoomable private Expedition Map"),this.dragging=!1,this.dragMoved=!1,this.lastPointer=null,this.activePointers=new Map,this.pinchDistance=0,this.pinchZoom=1,this.mapBounds={minX:-1,maxX:1,minY:-1,maxY:1,centerX:0,centerY:0,width:2,height:2},this.onResize=this.onResize.bind(this),this.onWheel=this.onWheel.bind(this),this.onPointerDown=this.onPointerDown.bind(this),this.onPointerMove=this.onPointerMove.bind(this),this.onPointerUp=this.onPointerUp.bind(this),this.onPointerLeave=this.onPointerLeave.bind(this),this.onRegionTileAssetLoaded=()=>{oe.clear(),this.rebuild(),this.render()},this.disposeRegionTileAssetListener=py(this.onRegionTileAssetLoaded),this.resizeObserver=new ResizeObserver(this.onResize),this.attach()}attach(){this.renderer.domElement.parentElement!==this.hostNode&&this.hostNode.appendChild(this.renderer.domElement),this.hostNode.addEventListener("wheel",this.onWheel,{passive:!1}),this.hostNode.addEventListener("pointerdown",this.onPointerDown),this.hostNode.addEventListener("pointermove",this.onPointerMove),this.hostNode.addEventListener("pointerup",this.onPointerUp),this.hostNode.addEventListener("pointercancel",this.onPointerUp),this.hostNode.addEventListener("pointerleave",this.onPointerLeave),this.resizeObserver.observe(this.hostNode),this.onResize()}dispose(){this.hostNode.removeEventListener("wheel",this.onWheel),this.hostNode.removeEventListener("pointerdown",this.onPointerDown),this.hostNode.removeEventListener("pointermove",this.onPointerMove),this.hostNode.removeEventListener("pointerup",this.onPointerUp),this.hostNode.removeEventListener("pointercancel",this.onPointerUp),this.hostNode.removeEventListener("pointerleave",this.onPointerLeave),this.disposeRegionTileAssetListener&&this.disposeRegionTileAssetListener(),this.resizeObserver.disconnect(),this.clearScene(),this.renderer.dispose(),this.renderer.domElement.remove()}clearScene(){this.scene.children.slice().forEach(t=>{this.scene.remove(t),t.traverse(i=>{if(i.geometry&&i.geometry.dispose(),i.material){let r=Array.isArray(i.material)?i.material:[i.material];for(let s of r)s.dispose()}})}),this.pickables=[],this.cellMeshes=[],this.unitSprites=[],this.commandTargetSprites=[],this.outcomeFeedbackSprites=[],this.eventMarkerSprites=[],this.objectiveMarkerSprites=[],this.outpostFrontierBeaconSprites=[],this.generatedHudWorldCohesionSprites=[],this.generatedHudWorldCohesionLines=[],this.generatedHudChromeSprites=[],this.generatedHudProfileSprites=[],this.generatedHudTextSprites=[],this.generatedHudCommandSprites=[],this.frontierLedgerScratchSprites=[],this.frontierLedgerScratchTrailPips=[],this.terrainUnderlayCount=0,this.surveyStrokeCount=0,this.markerCount=0,this.unitTokenCount=0,this.commandTargetCount=0,this.outcomeFeedbackCount=0,this.eventMarkerCount=0,this.objectiveMarkerCount=0,this.outpostFrontierBeaconCount=0,this.generatedHudWorldCohesionCount=0,this.generatedHudWorldTetherCount=0,this.generatedHudChromeCount=0,this.generatedHudProfileCount=0,this.generatedHudTextCount=0,this.generatedHudCommandCount=0,this.frontierLedgerScratchSpriteCount=0,this.frontierLedgerScratchTrailPipCount=0,this.edgeFogCount=0,this.civicBeaconCount=0}onResize(){let e=this.hostNode.getBoundingClientRect(),t=Math.max(1,Math.floor(e.width)),i=Math.max(1,Math.floor(e.height));this.renderer.setSize(t,i,!1);let r=t/i,s=Zn/Kn;if(r>=s){let a=Kn*r;this.camera.left=a/-2,this.camera.right=a/2,this.camera.top=Kn/2,this.camera.bottom=Kn/-2}else{let a=Zn/r;this.camera.left=Zn/-2,this.camera.right=Zn/2,this.camera.top=a/2,this.camera.bottom=a/-2}this.camera.zoom=Math.max(this.camera.zoom,this.preferredHudWorldZoom(t,i)),this.applyCameraBounds(),this.render()}preferredHudWorldZoom(e=0,t=0){let i=Math.max(.01,ge(e,0)/Math.max(1,ge(t,1)));return e<=430&&i<.62?1.52:e<=560&&i<.75?1.34:1}sync(e={},t="",i="",r=null){this.model=e&&typeof e=="object"?e:{},this.cells=Array.isArray(this.model.cells)?this.model.cells.filter(a=>a?.cellId):[],this.selectedCellId=String(t||this.selectedCellId||this.cells[0]?.cellId||"");let s=Array.isArray(this.model.units?.items)?this.model.units.items.filter(a=>a?.unitId):[];return this.selectedUnitId=String(i||this.selectedUnitId||s[0]?.unitId||""),this.outcomeFeedback=r&&typeof r=="object"?r:null,this.rebuild(),this.applyCameraBounds(),this.render(),this.info}rebuild(){this.clearScene();let e=Cd(this.cells);this.mapBounds=e.bounds;let t=new dt(new en(Zn*1.35,Kn*1.35),new Ft({map:Ey(),transparent:!1}));t.position.set(0,0,-.8),this.scene.add(t),this.terrainUnderlayCount=0;let i=Pd(e),r=new dt(new en(i.width,i.height),new Ft({map:Ry(this.cells,e),transparent:!0,opacity:.94,depthWrite:!1}));r.position.set(i.centerX,i.centerY,-.62),r.userData={kind:"expedition_continuous_terrain_underlay",visualOnly:!0,serverOwnedCellsOnly:!0,hiddenTruthLeakage:!1},this.terrainUnderlayCount=1,this.scene.add(r);let s=Math.max(Zn,Kn),a=[];for(let _=-6;_<=6;_+=1){let x=_*.9;a.push(new R(-s,x,-.42),new R(s,x,-.42)),a.push(new R(x,-s,-.42),new R(x,s,-.42))}let o=new _r(new st().setFromPoints(a),new Nt({color:1796708,transparent:!0,opacity:.1}));this.scene.add(o),this.edgeFogCount=0;let l=[{x:this.mapBounds.centerX,y:this.mapBounds.maxY+.52,rotation:0,width:this.mapBounds.width+2.9,kind:"soft"},{x:this.mapBounds.centerX,y:this.mapBounds.minY-.54,rotation:Math.PI,width:this.mapBounds.width+2.7,kind:"soft"},{x:this.mapBounds.minX-.56,y:this.mapBounds.centerY,rotation:Math.PI/2,width:this.mapBounds.height+2.5,kind:"locked"},{x:this.mapBounds.maxX+.62,y:this.mapBounds.centerY,rotation:-Math.PI/2,width:this.mapBounds.height+2.5,kind:"soft"}];for(let _ of l){let x=new dt(new en(_.width,.64),new Ft({map:Ty(_.kind),transparent:!0,opacity:_.kind==="locked"?.54:.42,depthWrite:!1}));x.position.set(_.x,_.y,-.26),x.rotation.z=_.rotation,this.edgeFogCount+=1,this.scene.add(x)}this.civicBeaconCount=0;let h=this.cells.filter(_=>["discovered","known"].includes(String(_.fogState||""))).slice(0,4);for(let _ of h){let x=e.positions.get(String(_.cellId||""));if(!x)continue;let w=new xt(new pt({map:Iy(),transparent:!0,opacity:String(_.kind||"")==="origin_plot"?.82:.56,depthWrite:!1}));w.position.set(x.x+.36,x.y+.28,.1),w.scale.set(.62,.62,1),w.userData={kind:"expedition_civic_beacon_cue",visualOnly:!0,routeAuthority:!1,cellId:String(_.cellId||"")},this.civicBeaconCount+=1,this.scene.add(w)}this.surveyStrokeCount=0;for(let _=0;_<this.cells.length;_+=1)for(let x=_+1;x<this.cells.length;x+=1){let w=this.cells[_],E=this.cells[x];if(!Qc(w,E))continue;let C=Ly(w,E,e);C&&(this.surveyStrokeCount+=1,this.scene.add(C))}let u=this.cells.filter(_=>!["discovered","known"].includes(String(_.fogState||"")));for(let _ of u){let x=e.positions.get(String(_.cellId||""));if(!x)continue;let w=String(_.fogState||"locked_unknown"),E=new dt(new en(w==="locked_unknown"?Sn*2.06:Sn*1.86,w==="locked_unknown"?Sn*2.06:Sn*1.86),new Ft({map:by(w==="locked_unknown"?"locked":"hinted"),transparent:!0,opacity:w==="locked_unknown"?.34:.42,depthWrite:!1}));E.position.set(x.x,x.y,.24),this.scene.add(E)}this.markerCount=0;for(let _ of this.cells){let x=e.positions.get(String(_.cellId||""))||{x:0,y:0},w=String(_.cellId||"")===this.selectedCellId,E=String(_.cellId||"")===this.hoverCellId,C=Py(_,x,w,E);this.scene.add(C),C.traverse(v=>{v.userData?.kind==="expedition_cell"&&(this.pickables.push(v),this.cellMeshes.push(v))}),this.markerCount+=1}let d=new Map(this.cells.map(_=>[String(_.cellId||""),_])),f=this.model.objective&&typeof this.model.objective=="object"?this.model.objective:null;this.eventMarkerCount=0;for(let _ of xy(this.model)){let x=Id(_),w=d.get(x),E=String(w?.fogState||"");if(!w||!["discovered","known"].includes(E))continue;let C=e.positions.get(x);if(!C)continue;let v=String(_.packetId||"")===String(f?.packetId||"")||String(x)===String(this.selectedCellId||""),A=Hi.event_packet,L=new xt(new pt({map:vy(_,v),transparent:!0,depthWrite:!1,depthTest:!0,alphaTest:.03}));L.position.set(C.x-.36,C.y+.35,.47),L.scale.set(v?.48:.4,v?.48:.4,1),L.userData={kind:"expedition_event_packet_marker",packetId:String(_.packetId||""),cellId:x,templateId:String(_.templateId||_.kind||""),spriteAssetSlot:String(A.slot||""),spriteAssetPath:String(A.path||""),spriteAssetReady:!!Jn(A),visualOnly:!0,readOnly:!0,selectable:!0,inspectable:!0,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.pickables.push(L),this.eventMarkerSprites.push(L),this.eventMarkerCount+=1,this.scene.add(L)}if(this.objectiveMarkerCount=0,f&&String(f.mode||"read")!=="read"&&f.targetCellId){let _=String(f.targetCellId||""),x=d.get(_),w=e.positions.get(_);if(x&&w){let E=_===String(this.selectedCellId||""),C=String(f.mode||"")==="packet"?Hi.event_packet:Hi.objective_beacon,v=new xt(new pt({map:Sy(f,E),transparent:!0,depthWrite:!1,depthTest:!0,alphaTest:.03}));v.position.set(w.x+.38,w.y+.41,.5),v.scale.set(E?.56:.48,E?.56:.48,1),v.userData={kind:"expedition_objective_marker",mode:String(f.mode||""),cellId:_,targetCellId:_,packetId:String(f.packetId||""),spriteAssetSlot:String(C.slot||""),spriteAssetPath:String(C.path||""),spriteAssetReady:!!Jn(C),visualOnly:!0,readOnly:!0,selectable:!0,inspectable:!0,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.pickables.push(v),this.objectiveMarkerSprites.push(v),this.objectiveMarkerCount=1,this.scene.add(v)}}let c=Array.isArray(this.model.units?.items)?this.model.units.items.filter(_=>_?.unitId):[],g=c.find(_=>String(_.unitId||"")===String(this.selectedUnitId||""))||null;this.outpostFrontierBeaconCount=0;let S=Ky(g||{},d,this.cells);if(S){let _=jy(S,e,String(S.targetCellId||"")===String(this.selectedCellId||""));_?.group&&(this.outpostFrontierBeaconSprites.push(_.ring),this.outpostFrontierBeaconCount=1,this.scene.add(_.group))}this.commandTargetCount=0;let m=[];for(let _ of $y(g||{},d)){let x=e.positions.get(String(_.cellId||""));if(!x)continue;let w=new xt(new pt({map:qy(_),transparent:!0,depthWrite:!1,depthTest:!0,alphaTest:.03,opacity:_.commandId==="scout_sector"?.92:.84}));w.position.set(x.x,x.y+.05,.515),w.scale.set(_.commandId==="scout_sector"?1.34:1.2,_.commandId==="scout_sector"?1.34:1.2,1),w.userData={kind:"expedition_command_target",unitId:_.unitId,unitType:_.unitType,commandId:_.commandId,cellId:_.cellId,fogState:_.fogState,serverMutationImplemented:_.serverMutationImplemented===!0,movementMutation:_.movementMutation===!0,visualOnly:!0,readOnly:!0,previewOnly:!0,selectable:!0,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.pickables.push(w),this.commandTargetSprites.push(w),m.push({target:_,position:x}),this.commandTargetCount+=1,this.scene.add(w)}let p=this.outcomeFeedback;if(p?.cellId){let _=e.positions.get(String(p.cellId||""));if(_){let x=new xt(new pt({map:Yy(p),transparent:!0,depthWrite:!1,depthTest:!0,alphaTest:.03,opacity:.92}));x.position.set(_.x,_.y+.05,.535),x.scale.set(1.48,1.48,1),x.userData={kind:"expedition_command_outcome_feedback",feedbackId:String(p.feedbackId||""),commandId:String(p.commandId||""),unitId:String(p.unitId||""),unitType:String(p.unitType||""),cellId:String(p.cellId||""),targetCellId:String(p.targetCellId||p.cellId||""),sourceCellId:String(p.sourceCellId||""),receiptId:String(p.receiptId||""),receiptKind:String(p.receiptKind||""),serverOwnedResult:p.serverOwnedResult===!0,visualOnly:!0,readOnly:!0,selectable:!1,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.outcomeFeedbackSprites.push(x),this.outcomeFeedbackCount=1,this.scene.add(x)}}this.unitTokenCount=0;let M=c.reduce((_,x)=>{let w=String(x.location?.cellId||"");return w&&(_[w]||(_[w]=[]),_[w].push(x)),_},{});for(let[_,x]of Object.entries(M)){let w=e.positions.get(_);w&&x.forEach((E,C)=>{let v=String(E.unitId||"")===this.selectedUnitId,A=Qo(E),L=!!Jn(A),I=C/Math.max(1,x.length)*Math.PI*2-Math.PI/2,O=x.length>1?.26:0,G=new xt(new pt({map:Fy(E,v),transparent:!0,depthWrite:!1,depthTest:!0,alphaTest:.03}));G.position.set(w.x+Math.cos(I)*O,w.y+.44+Math.sin(I)*O*.36,.54+C*.01);let W=v?.72:.58;G.scale.set(W,W,1),G.userData={kind:"expedition_unit",unitId:String(E.unitId||""),unitType:String(E.unitType||""),displayName:String(E.displayName||""),cellId:_,spriteAssetSlot:String(A?.slot||""),spriteAssetPath:String(A?.path||""),spriteAssetReady:L,selectable:E.selectable!==!1,readOnly:E.readOnly!==!1,movementMutationImplemented:E.movement?.movementMutationImplemented===!0},this.pickables.push(G),this.unitSprites.push(G),this.unitTokenCount+=1,this.scene.add(G)})}this.addFrontierLedgerScratchCompositionLayer(e,g,m),this.addGeneratedHudWorldCohesionLayer(e),this.addGeneratedHudChromeLayer(),this.addGeneratedHudContentLayer(),this.updateInfo()}visibleSize(){return{width:Math.max(.01,(this.camera.right-this.camera.left)/this.camera.zoom),height:Math.max(.01,(this.camera.top-this.camera.bottom)/this.camera.zoom)}}addFrontierLedgerScratchCompositionLayer(e,t=null,i=[]){this.frontierLedgerScratchSprites=[],this.frontierLedgerScratchTrailPips=[];let r=(l,h,u,d,f={})=>{let c=new xt(new pt({map:h,transparent:!0,depthWrite:!1,depthTest:!1,opacity:u,alphaTest:.01}));return c.renderOrder=d,c.userData={kind:"expedition_frontier_ledger_scratch_hud",layerVersion:Bc,slot:l,northStarPath:dd,visualOnly:!0,readOnly:!0,selectable:!1,routeAuthority:!1,actionAuthority:!1,executableActions:0,...f},this.frontierLedgerScratchSprites.push(c),this.scene.add(c),c};r("frontier-ledger-board-frame",Pr("board-frame"),.96,810,{cameraAnchored:!0,compositionRole:"full_screen_parchment_leather_board"}),r("frontier-ledger-bottom-medallion-rail",Pr("bottom-medallion-rail"),.98,888,{cameraAnchored:!0,compositionRole:"bottom_unit_medallion_rail"}),r("frontier-ledger-parcel-rangefinder-backplate",Pr("parcel-rangefinder-backplate"),.86,894,{cameraAnchored:!0,compositionRole:"bottom_right_parcel_rangefinder"}),r("frontier-ledger-right-tab-shadow",Pr("right-ledger-tab"),.78,886,{cameraAnchored:!0,compositionRole:"collapsed_right_edge_ledger"}),r("frontier-ledger-top-tabs-shadow",Pr("top-ledger-tabs"),.72,887,{cameraAnchored:!0,compositionRole:"top_left_expedition_scout_crest"});let s=String(t?.location?.cellId||""),a=e.positions.get(s),o=i.find(l=>String(l.target?.commandId||"")==="scout_sector")||i.find(l=>String(l.target?.commandId||"")==="move_unit")||i[0];if(a&&o?.position){let l=o.position,h=l.x-a.x,u=l.y-a.y,d=Math.hypot(h,u),f=We(Math.round(d*2.2),4,11);for(let c=1;c<=f;c+=1){let g=c/(f+1),S=Math.sin(g*Math.PI)*We(d*.12,.12,.38),m=a.x+h*g-u*.06*S,p=a.y+u*g+Math.abs(h)*.04*S+S,M=r("frontier-ledger-dotted-target-trail",Pr("trail-pip"),.88,708+c,{cameraAnchored:!1,compositionRole:"map_native_dotted_path_preview",unitId:String(t?.unitId||""),sourceCellId:s,targetCellId:String(o.target?.cellId||""),commandId:String(o.target?.commandId||""),previewOnly:!0,hiddenTruthLeakage:!1}),_=We(.07+c/f*.035,.07,.12);M.position.set(m,p+.1,.72+c*.001),M.scale.set(_,_,1),this.frontierLedgerScratchTrailPips.push(M)}}this.frontierLedgerScratchSpriteCount=this.frontierLedgerScratchSprites.length,this.frontierLedgerScratchTrailPipCount=this.frontierLedgerScratchTrailPips.length,this.syncFrontierLedgerScratchSprites()}syncFrontierLedgerScratchSprites(){if(!this.frontierLedgerScratchSprites.length)return;let e=this.visibleSize(),t=this.camera.position.x-e.width/2,i=this.camera.position.x+e.width/2,r=this.camera.position.y+e.height/2,s=this.camera.position.y-e.height/2,a=Number(this.renderer.domElement?.clientWidth||0)<=520;this.frontierLedgerScratchSprites.forEach(o=>{if(o.userData?.cameraAnchored===!1)return;let l=String(o.userData?.slot||"");if(l==="frontier-ledger-board-frame")o.position.set(this.camera.position.x,this.camera.position.y,3.82),o.scale.set(e.width*1.04,e.height*1.04,1);else if(l==="frontier-ledger-bottom-medallion-rail"){let h=We(e.height*(a?.19:.235),1.12,2.12);o.position.set(this.camera.position.x,s+h/2,4.1),o.scale.set(e.width*1.05,h,1)}else if(l==="frontier-ledger-parcel-rangefinder-backplate"){let h=We(e.width*(a?.56:.39),2.35,e.width*.78),u=We(e.height*(a?.18:.25),1,2.18);o.position.set(i-h*(a?.49:.5)-e.width*.012,s+u*.53+e.height*.01,4.16),o.scale.set(h,u,1)}else if(l==="frontier-ledger-right-tab-shadow"){let h=We(e.width*.072,.42,.72),u=We(e.height*(a?.34:.48),2.1,4.6);o.position.set(i-h*.44,this.camera.position.y+e.height*.02,4.14),o.scale.set(h,u,1)}else if(l==="frontier-ledger-top-tabs-shadow"){let h=We(e.width*(a?.52:.36),2.15,5.15),u=We(e.height*.105,.48,.96);o.position.set(t+h*.48,r-u*.48,4.12),o.scale.set(h,u,1)}})}addGeneratedHudWorldCohesionLayer(e){this.generatedHudWorldCohesionSprites=[],this.generatedHudWorldCohesionLines=[];let t=(r,s,a,o)=>{let l=new xt(new pt({map:s,transparent:!0,depthWrite:!1,depthTest:!1,opacity:a,alphaTest:.01}));return l.renderOrder=o,l.userData={kind:"expedition_generated_hud_world_cohesion",layerVersion:Cs,slot:r,visualOnly:!0,readOnly:!0,selectable:!1,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.generatedHudWorldCohesionSprites.push(l),this.scene.add(l),l};t("map-depth-veil",Oc("depth-veil"),.82,860),t("bottom-foreground-bridge",Oc("bottom-bridge"),.88,872);let i=e.positions.get(String(this.selectedCellId||""));if(i){let r=t("selected-world-aura",Oc("selected-aura"),.86,884);r.userData.cellId=String(this.selectedCellId||""),r.userData.worldX=i.x,r.userData.worldY=i.y;let s=new mn(new st().setFromPoints([new R(i.x,i.y,4.12),new R(i.x,i.y,4.12)]),new Nt({color:16110724,transparent:!0,opacity:.5,depthWrite:!1,depthTest:!1}));s.renderOrder=892,s.userData={kind:"expedition_generated_hud_world_tether",layerVersion:Cs,slot:"selected-context-tether",cellId:String(this.selectedCellId||""),startWorldX:i.x,startWorldY:i.y,targetSlot:"selected-context",visualOnly:!0,readOnly:!0,selectable:!1,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.generatedHudWorldCohesionLines.push(s),this.scene.add(s)}this.generatedHudWorldCohesionCount=this.generatedHudWorldCohesionSprites.length+this.generatedHudWorldCohesionLines.length,this.generatedHudWorldTetherCount=this.generatedHudWorldCohesionLines.length,this.syncGeneratedHudWorldCohesionSprites()}syncGeneratedHudWorldCohesionSprites(){if(!this.generatedHudWorldCohesionSprites.length&&!this.generatedHudWorldCohesionLines.length)return;let e=this.visibleSize(),t=this.camera.position.y-e.height/2;this.generatedHudWorldCohesionSprites.forEach(r=>{let s=String(r.userData?.slot||"");if(s==="map-depth-veil")r.position.set(this.camera.position.x,this.camera.position.y,4.02),r.scale.set(e.width*1.04,e.height*1.04,1);else if(s==="bottom-foreground-bridge"){let a=We(e.height*.3,1.34,2.44);r.position.set(this.camera.position.x,t+a/2,4.06),r.scale.set(e.width*1.02,a,1)}else s==="selected-world-aura"&&(r.position.set(ge(r.userData?.worldX,0),ge(r.userData?.worldY,0)+.08,.66),r.scale.set(1.54,1.54,1))});let i=this.generatedHudBoundsForSlot("selected-context");this.generatedHudWorldCohesionLines.forEach(r=>{let s=ge(r.userData?.startWorldX,0),a=ge(r.userData?.startWorldY,0)+.1,o=i.left+i.width*.08,l=i.top-i.height*.5,h=s+(o-s)*.56,u=Math.max(a,l)+Math.abs(o-s)*.035,d=new Ni([new R(s,a,4.12),new R(h,u,4.12),new R(o,l,4.12)]);r.geometry.dispose(),r.geometry=new st().setFromPoints(d.getPoints(28)),r.userData.startCanvas={x:s,y:a},r.userData.endCanvas={x:o,y:l}})}addGeneratedHudChromeLayer(){this.generatedHudChromeSprites=[],Ad(this.model).forEach((t,i)=>{let r=Vy(t);if(!r)return;let s=new xt(new pt({map:r,transparent:!0,depthWrite:!1,depthTest:!1,opacity:We(ge(t.opacity,.72)*1.18,.54,.94),alphaTest:.02}));s.renderOrder=900+i,s.userData={kind:"expedition_generated_hud_chrome",packId:String(t.packId||this.model.generatedHudChrome?.packId||As),slot:String(t.slot||""),assetPath:String(t.path||""),anchor:String(t.anchor||""),widthRatio:ge(t.widthRatio,.2),heightRatio:ge(t.heightRatio,.16),marginX:ge(t.marginX,.02),marginY:ge(t.marginY,.02),assetReady:!0,cleanCompositeVersion:hd,materialityVersion:sn,materialProfile:"procedural_beveled_metal_parchment_frame",chromeSource:"three_canvas_clean_frame",sourceAssetPath:String(t.path||""),liveTextSource:"dom",visualOnly:!0,readOnly:!0,selectable:!1,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.generatedHudChromeSprites.push(s),this.scene.add(s)}),this.generatedHudChromeCount=this.generatedHudChromeSprites.length,this.syncGeneratedHudChromeSprites()}generatedHudBoundsForData(e={}){let t=this.visibleSize(),i=this.camera.position.x-t.width/2,r=this.camera.position.x+t.width/2,s=this.camera.position.y+t.height/2,a=this.camera.position.y-t.height/2,o=We(ge(e.widthRatio,.2)*t.width,.35,t.width*.88),l=We(ge(e.heightRatio,.16)*t.height,.26,t.height*.8),h=ge(e.marginX,.02)*t.width,u=ge(e.marginY,.02)*t.height,d=i+h+o/2,f=s-u-l/2;return e.anchor==="bottom-left"?f=a+u+l/2:e.anchor==="bottom-right"?(d=r-h-o/2,f=a+u+l/2):e.anchor==="right"?(d=r-h-o/2,f=s-u-l/2):e.anchor==="selected-command"&&(d=this.camera.position.x+t.width*.18,f=a+t.height*.28),{x:d,y:f,width:o,height:l,left:d-o/2,right:d+o/2,top:f+l/2,bottom:f-l/2}}generatedHudBoundsForSlot(e=""){let t=this.generatedHudChromeSprites.find(r=>String(r.userData?.slot||"")===String(e||""));if(t)return this.generatedHudBoundsForData(t.userData||{});let i=ry(e,this.model)||{};return this.generatedHudBoundsForData(i)}syncGeneratedHudChromeSprites(){this.generatedHudChromeSprites.length&&this.generatedHudChromeSprites.forEach(e=>{let t=this.generatedHudBoundsForData(e.userData||{});e.position.set(t.x,t.y,4.25),e.scale.set(t.width,t.height,1)})}addGeneratedHudContentLayer(){this.generatedHudProfileSprites=[],this.generatedHudTextSprites=[],this.generatedHudCommandSprites=[];let e=Array.isArray(this.model.units?.items)?this.model.units.items.filter(d=>d?.unitId).slice(0,6):[],t=e.find(d=>String(d.unitId||"")===String(this.selectedUnitId||""))||e[0]||null;e.forEach((d,f)=>{let c=String(d.unitId||"")===String(t?.unitId||""),g=Qo(d),S=new xt(new pt({map:Oy(d,c),transparent:!0,depthWrite:!1,depthTest:!1,alphaTest:.04}));S.renderOrder=940+f,S.userData={kind:"expedition_generated_hud_profile_mask",layerVersion:Fc,materialityVersion:sn,slot:"unit-profile",unitId:String(d.unitId||""),unitType:String(d.unitType||""),displayName:String(d.displayName||""),profileMask:"circle_alpha_clip",profileSource:"three_canvas_texture",spriteAssetSlot:String(g?.slot||""),spriteAssetPath:String(g?.path||""),spriteAssetReady:!!Jn(g),visualOnly:!0,readOnly:!0,selectable:!1,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.generatedHudProfileSprites.push(S),this.scene.add(S)}),this.generatedHudProfileCount=this.generatedHudProfileSprites.length;let i=Array.isArray(this.model.cells)?this.model.cells:[],r=i.find(d=>String(d.cellId||"")===String(this.selectedCellId||""))||i[0]||{},s=i.filter(d=>["known","discovered"].includes(String(d.fogState||""))).length,a=i.length-s,o=this.model.objective&&typeof this.model.objective=="object"?this.model.objective:{},l=t?Ny(t):0;[{slot:"crest-status",title:"EXPEDITION",meta:`${s} MAP / ${a} FOG`,tone:"light"},{slot:"objective-loop",title:Uy(this.model),meta:o.targetCellId?vd(o.targetCellId):"READY",tone:"dark"},{slot:"unit-dock",title:`${e.length} UNITS`,meta:t?tl(t):"SELECT",tone:"dark"},{slot:"command-puck",title:l?`${l} CMD`:"CMD",meta:t?tl(t):"READY",tone:"light"},{slot:"selected-context",title:vd(r.cellId||this.selectedCellId),meta:String(r.fogState||"sector").replace(/_/g," "),tone:"light"}].forEach((d,f)=>{let c=new xt(new pt({map:zy(d),transparent:!0,depthWrite:!1,depthTest:!1,opacity:.88,alphaTest:.03}));c.renderOrder=960+f,c.userData={kind:"expedition_generated_hud_text",layerVersion:Fc,materialityVersion:sn,slot:String(d.slot||""),title:String(d.title||""),meta:String(d.meta||""),liveTextSource:"three_canvas_texture",domA11yOverlayRetained:!0,visualOnly:!0,readOnly:!0,selectable:!1,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.generatedHudTextSprites.push(c),this.scene.add(c)}),this.generatedHudTextCount=this.generatedHudTextSprites.length,(t?ky(t):[]).forEach((d,f)=>{let c=new xt(new pt({map:Hy(d),transparent:!0,depthWrite:!1,depthTest:!1,opacity:d.enabled===!1?.58:.92,alphaTest:.04}));c.renderOrder=980+f,c.userData={kind:"expedition_generated_hud_command_glyph",layerVersion:ud,materialityVersion:sn,slot:"command-tray",commandId:String(d.commandId||""),label:String(d.label||""),glyph:String(d.glyph||""),enabled:d.enabled!==!1,liveSource:"server_owned_command_hint",visualOnly:!0,readOnly:!0,selectable:!1,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.generatedHudCommandSprites.push(c),this.scene.add(c)}),this.generatedHudCommandCount=this.generatedHudCommandSprites.length,this.syncGeneratedHudContentSprites()}syncGeneratedHudContentSprites(){let e=this.generatedHudBoundsForSlot("unit-dock"),t=this.generatedHudProfileSprites,i=Number(this.renderer?.domElement?.clientWidth||this.hostNode?.clientWidth||0)<=520;if(t.length){let a=i?We(Math.min(e.height*.66,e.width/Math.max(4.2,t.length+1.4)),.46,.76):We(Math.min(e.height*.62,e.width/Math.max(4.7,t.length+1.3)),.5,.96),o=i?We(e.width*.145,a*1.08,a*1.48):We(e.width*.118,a*1.1,a*1.58),l=e.left+e.width*(i?.38:.3),h=e.bottom+e.height*(i?.58:.56);t.forEach((u,d)=>{u.position.set(l+d*o,h,4.5+d*.004),u.scale.set(a,a,1)})}this.generatedHudTextSprites.forEach(a=>{let o=String(a.userData?.slot||""),l=this.generatedHudBoundsForSlot(o),h=l.width*.48,u=l.height*.46,d=l.left+l.width*.42,f=l.top-l.height*.5,c=l.width,g=l.height;o==="crest-status"?(h=l.width*.54,u=l.height*.48,d=l.left+l.width*.62,f=l.top-l.height*.5):o==="objective-loop"?(h=l.width*.68,u=l.height*.52,d=l.left+l.width*.54,f=l.top-l.height*.5):o==="unit-dock"?(h=l.width*(i?.35:.25),u=l.height*.42,d=l.left+l.width*(i?.31:.15),f=l.bottom+l.height*.57):o==="command-puck"?(l=this.generatedHudBoundsForSlot("command-tray"),h=l.width*(i?.38:.36),u=l.height*.54,d=l.left+l.width*(i?.66:.7),f=l.top-l.height*.48,c=l.width*.74,g=l.height*.78):o==="selected-context"&&(h=l.width*.72,u=l.height*.6,d=l.left+l.width*.56,f=l.top-l.height*.5),a.position.set(d,f,4.62),a.scale.set(We(h,.58,c),We(u,.24,g),1)});let r=this.generatedHudBoundsForSlot("command-tray"),s=this.generatedHudCommandSprites;if(s.length){let a=i?We(Math.min(r.height*.34,r.width/Math.max(6.4,s.length+2.8)),.24,.4):We(Math.min(r.height*.34,r.width/Math.max(6.8,s.length+3)),.26,.46),o=We(r.width/Math.max(7.8,s.length+3.6),a*1.04,a*1.34),l=r.left+r.width*(i?.17:.2),h=r.bottom+r.height*(i?.35:.34);s.forEach((u,d)=>{u.position.set(l+d*o,h,4.72+d*.004),u.scale.set(a,a,1)})}}applyCameraBounds(){let t=this.visibleSize(),i=this.mapBounds.minX-.85,r=this.mapBounds.maxX+.85,s=this.mapBounds.minY-.85,a=this.mapBounds.maxY+.85,o=Math.max(.01,r-i),l=Math.max(.01,a-s);this.camera.position.x=t.width>=o?(i+r)/2:We(this.camera.position.x,i+t.width/2,r-t.width/2),this.camera.position.y=t.height>=l?(s+a)/2:We(this.camera.position.y,s+t.height/2,a-t.height/2),this.camera.zoom=We(this.camera.zoom,.85,3.4),this.camera.updateProjectionMatrix()}setZoom(e){this.camera.zoom=We(e,.85,3.4),this.applyCameraBounds(),this.render(),this.notifyViewChange()}resetView(){let e=this.hostNode.getBoundingClientRect();this.camera.zoom=this.preferredHudWorldZoom(e.width,e.height),this.camera.position.x=this.mapBounds.centerX,this.camera.position.y=this.mapBounds.centerY,this.applyCameraBounds(),this.render(),this.notifyViewChange()}panBy(e,t){let i=this.renderer.domElement.getBoundingClientRect(),r=this.visibleSize();this.camera.position.x-=e/Math.max(1,i.width)*r.width,this.camera.position.y+=t/Math.max(1,i.height)*r.height,this.applyCameraBounds(),this.render(),this.notifyViewChange()}notifyViewChange(){this.hostNode.dispatchEvent(new CustomEvent("founders-plot-expedition-map-view-change"))}onWheel(e){e.preventDefault();let t=e.deltaY<0?1.13:1/1.13;this.setZoom(this.camera.zoom*t)}onPointerDown(e){this.activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});try{this.hostNode.setPointerCapture?.(e.pointerId)}catch{}if(this.dragging=!0,this.dragMoved=!1,this.lastPointer={x:e.clientX,y:e.clientY},this.hostNode.dataset.dragging="true",this.activePointers.size>=2){let t=Array.from(this.activePointers.values());this.pinchDistance=Math.hypot(t[0].x-t[1].x,t[0].y-t[1].y),this.pinchZoom=this.camera.zoom}}onPointerMove(e){if(!this.activePointers.has(e.pointerId)){this.setHoverFromPoint(e.clientX,e.clientY);return}let t=this.activePointers.get(e.pointerId);if(this.activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY}),this.activePointers.size>=2){let s=Array.from(this.activePointers.values()),a=Math.hypot(s[0].x-s[1].x,s[0].y-s[1].y);this.pinchDistance>0&&this.setZoom(this.pinchZoom*(a/this.pinchDistance)),this.dragMoved=!0;return}let i=e.clientX-t.x,r=e.clientY-t.y;Math.abs(i)+Math.abs(r)>1&&(this.dragMoved=this.dragMoved||Math.abs(e.clientX-(this.lastPointer?.x||e.clientX))+Math.abs(e.clientY-(this.lastPointer?.y||e.clientY))>4,this.panBy(i,r))}onPointerLeave(){this.setHoverCell("")}onPointerUp(e){let t=this.dragging&&!this.dragMoved&&this.activePointers.size<=1;this.activePointers.delete(e.pointerId);try{this.hostNode.releasePointerCapture?.(e.pointerId)}catch{}if(this.dragging=this.activePointers.size>0,this.dragging||(delete this.hostNode.dataset.dragging,this.pinchDistance=0),t){let i=this.pickFromPoint(e.clientX,e.clientY);if(i)if(i.userData?.kind==="expedition_unit"){let r=Gy(i);this.selectedUnitId=r.unitId,r.cellId&&(this.selectedCellId=r.cellId),r.cellId&&this.setHoverCell(r.cellId),window.dispatchEvent(new CustomEvent("founders-plot-expedition-unit-select",{detail:r}))}else if(["expedition_event_packet_marker","expedition_objective_marker"].includes(String(i.userData?.kind||""))){let r=Wy(i);r.cellId&&(this.selectedCellId=r.cellId),r.cellId&&this.setHoverCell(r.cellId),window.dispatchEvent(new CustomEvent("founders-plot-expedition-map-select",{detail:r}))}else if(i.userData?.kind==="expedition_command_target"){let r=Xy(i);r.cellId&&(this.selectedCellId=r.cellId),r.cellId&&this.setHoverCell(r.cellId),window.dispatchEvent(new CustomEvent("founders-plot-expedition-command-target-preview",{detail:r}))}else{let r=Qy(i);this.selectedCellId=r.cellId,this.setHoverCell(r.cellId),window.dispatchEvent(new CustomEvent("founders-plot-expedition-map-select",{detail:r}))}}}setHoverFromPoint(e,t){let i=this.pickFromPoint(e,t);this.setHoverCell(i?.userData?.cellId||i?.userData?.targetCellId||"")}setHoverCell(e=""){let t=String(e||"");t!==this.hoverCellId&&(this.hoverCellId=t,t?this.hostNode.dataset.hoverCellId=t:delete this.hostNode.dataset.hoverCellId,this.rebuild(),this.render())}pickFromPoint(e,t){let i=this.renderer.domElement.getBoundingClientRect();return this.pointer.x=(e-i.left)/i.width*2-1,this.pointer.y=-((t-i.top)/i.height)*2+1,this.raycaster.setFromCamera(this.pointer,this.camera),this.raycaster.intersectObjects(this.pickables,!1)[0]?.object||null}canvasPointForCell(e){let t=this.cellMeshes.find(i=>String(i.userData?.cellId||"")===String(e||""));return t?this.canvasPointForObject(t):null}canvasPointForObject(e){if(!e)return null;let t=new R;e.getWorldPosition(t),t.project(this.camera);let i=this.renderer.domElement.getBoundingClientRect();return{x:(t.x+1)/2*i.width,y:(-t.y+1)/2*i.height}}updateInfo(){this.syncFrontierLedgerScratchSprites(),this.syncGeneratedHudWorldCohesionSprites(),this.syncGeneratedHudChromeSprites(),this.syncGeneratedHudContentSprites();let e=this.renderer.domElement,t=this.cells.map(c=>{let g=String(c.fogState||"locked_unknown"),S=Qn(c),m=uy(c),p=Jc(c,S),M=Jn(p),_=Zo(c,S),x=Fs(c),w=Ei(c)?null:Kc(c);return{cellId:String(c.cellId||""),fogState:g,siteType:String(c.siteType||""),kind:String(c.kind||""),publicTerrainText:m,publicTerrainAssetSlot:x,publicTerrainAssetSlotSource:String(c.publicTerrainAssetSlotSource||""),publicTerrainAssetSlotReason:String(c.publicTerrainAssetSlotReason||""),fogAssetSlot:w,terrainAssetContractVersion:String(c.terrainAssetContractVersion||""),terrain:S,runtimeAssetPack:cd,assetSlot:p?.slot||null,assetPath:p?.path||null,assetKind:p?.assetKind||null,fogOnly:p?.fogOnly===!0,assetReady:!!M,assetAllowedByServerTruth:fy(c,S,p),underlayTerrain:_.terrain,underlayFogOnly:_.fogOnly===!0,waterCue:S==="water",ruinSignalCue:S==="ruin_signal",hiddenSpecificitySuppressed:!Ei(c)&&S===g}}),i=Array.from(new Map([...Object.values(wd),...Object.values(Hi)].map(c=>[c.path,c])).values()),r=i.filter(c=>!!nl(c)).length,s=this.generatedHudWorldCohesionSprites.map(c=>({slot:String(c.userData?.slot||""),layerVersion:String(c.userData?.layerVersion||""),cellId:String(c.userData?.cellId||""),visualOnly:c.userData?.visualOnly===!0,readOnly:c.userData?.readOnly===!0,selectable:c.userData?.selectable===!0,routeAuthority:c.userData?.routeAuthority===!0,actionAuthority:c.userData?.actionAuthority===!0,executableActions:Number(c.userData?.executableActions||0),canvas:this.canvasPointForObject(c)})),a=this.generatedHudWorldCohesionLines.map(c=>({slot:String(c.userData?.slot||""),layerVersion:String(c.userData?.layerVersion||""),cellId:String(c.userData?.cellId||""),targetSlot:String(c.userData?.targetSlot||""),visualOnly:c.userData?.visualOnly===!0,readOnly:c.userData?.readOnly===!0,selectable:c.userData?.selectable===!0,routeAuthority:c.userData?.routeAuthority===!0,actionAuthority:c.userData?.actionAuthority===!0,executableActions:Number(c.userData?.executableActions||0),startCanvas:c.userData?.startCanvas||null,endCanvas:c.userData?.endCanvas||null})),o=this.generatedHudChromeSprites.map(c=>({slot:String(c.userData?.slot||""),packId:String(c.userData?.packId||""),assetPath:String(c.userData?.assetPath||""),anchor:String(c.userData?.anchor||""),assetReady:c.userData?.assetReady===!0,cleanCompositeVersion:String(c.userData?.cleanCompositeVersion||""),materialityVersion:String(c.userData?.materialityVersion||""),materialProfile:String(c.userData?.materialProfile||""),chromeSource:String(c.userData?.chromeSource||""),sourceAssetPath:String(c.userData?.sourceAssetPath||""),liveTextSource:String(c.userData?.liveTextSource||""),visualOnly:c.userData?.visualOnly===!0,readOnly:c.userData?.readOnly===!0,selectable:c.userData?.selectable===!0,routeAuthority:c.userData?.routeAuthority===!0,actionAuthority:c.userData?.actionAuthority===!0,executableActions:Number(c.userData?.executableActions||0),canvas:this.canvasPointForObject(c)})),l=this.generatedHudProfileSprites.map(c=>({slot:String(c.userData?.slot||""),layerVersion:String(c.userData?.layerVersion||""),unitId:String(c.userData?.unitId||""),unitType:String(c.userData?.unitType||""),profileMask:String(c.userData?.profileMask||""),profileSource:String(c.userData?.profileSource||""),materialityVersion:String(c.userData?.materialityVersion||""),spriteAssetSlot:String(c.userData?.spriteAssetSlot||""),spriteAssetPath:String(c.userData?.spriteAssetPath||""),spriteAssetReady:c.userData?.spriteAssetReady===!0,visualOnly:c.userData?.visualOnly===!0,readOnly:c.userData?.readOnly===!0,selectable:c.userData?.selectable===!0,routeAuthority:c.userData?.routeAuthority===!0,actionAuthority:c.userData?.actionAuthority===!0,executableActions:Number(c.userData?.executableActions||0),canvas:this.canvasPointForObject(c)})),h=this.generatedHudTextSprites.map(c=>({slot:String(c.userData?.slot||""),layerVersion:String(c.userData?.layerVersion||""),title:String(c.userData?.title||""),meta:String(c.userData?.meta||""),liveTextSource:String(c.userData?.liveTextSource||""),materialityVersion:String(c.userData?.materialityVersion||""),domA11yOverlayRetained:c.userData?.domA11yOverlayRetained===!0,visualOnly:c.userData?.visualOnly===!0,readOnly:c.userData?.readOnly===!0,selectable:c.userData?.selectable===!0,routeAuthority:c.userData?.routeAuthority===!0,actionAuthority:c.userData?.actionAuthority===!0,executableActions:Number(c.userData?.executableActions||0),canvas:this.canvasPointForObject(c)})),u=this.generatedHudCommandSprites.map(c=>({slot:String(c.userData?.slot||""),layerVersion:String(c.userData?.layerVersion||""),commandId:String(c.userData?.commandId||""),label:String(c.userData?.label||""),glyph:String(c.userData?.glyph||""),enabled:c.userData?.enabled!==!1,liveSource:String(c.userData?.liveSource||""),materialityVersion:String(c.userData?.materialityVersion||""),visualOnly:c.userData?.visualOnly===!0,readOnly:c.userData?.readOnly===!0,selectable:c.userData?.selectable===!0,routeAuthority:c.userData?.routeAuthority===!0,actionAuthority:c.userData?.actionAuthority===!0,executableActions:Number(c.userData?.executableActions||0),canvas:this.canvasPointForObject(c)})),d=this.frontierLedgerScratchSprites.map(c=>({slot:String(c.userData?.slot||""),layerVersion:String(c.userData?.layerVersion||""),compositionRole:String(c.userData?.compositionRole||""),northStarPath:String(c.userData?.northStarPath||""),unitId:String(c.userData?.unitId||""),sourceCellId:String(c.userData?.sourceCellId||""),targetCellId:String(c.userData?.targetCellId||""),commandId:String(c.userData?.commandId||""),cameraAnchored:c.userData?.cameraAnchored!==!1,previewOnly:c.userData?.previewOnly===!0,visualOnly:c.userData?.visualOnly===!0,readOnly:c.userData?.readOnly===!0,selectable:c.userData?.selectable===!0,routeAuthority:c.userData?.routeAuthority===!0,actionAuthority:c.userData?.actionAuthority===!0,executableActions:Number(c.userData?.executableActions||0),hiddenTruthLeakage:c.userData?.hiddenTruthLeakage===!0,canvas:this.canvasPointForObject(c)})),f=o.map(c=>({slot:c.slot,owner:"three_canvas",source:"three_canvas_clean_frame",sourceCropPainted:c.chromeSource!=="three_canvas_clean_frame",materialityVersion:c.materialityVersion,materialProfile:c.materialProfile,visualOnly:c.visualOnly,readOnly:c.readOnly,selectable:c.selectable,routeAuthority:c.routeAuthority,actionAuthority:c.actionAuthority,executableActions:c.executableActions,noAuthority:!c.routeAuthority&&!c.actionAuthority&&c.executableActions===0,canvas:c.canvas}));return this.info={renderer:"three.js",surface:"expedition-map",projectionHash:String(this.model?.projectionHash||""),canvasWidth:e.width,canvasHeight:e.height,cellCount:this.cells.length,selectedCellId:String(this.selectedCellId||""),hoverCellId:String(this.hoverCellId||""),zoom:Number(this.camera.zoom.toFixed(3)),visualShell:Gt,visualLayers:{terrainTexture:!0,runtimeRegionAssetPack:cd,runtimeRegionAtlas:`${Ti}/manifest.json`,runtimeTerrainUnderlay:Ed.path,runtimeSpriteAssetPack:ny,runtimeSpriteAtlas:`${Nn}/manifest.json`,generatedSpriteAssets:!0,generatedSpriteAssetCount:i.length,generatedSpriteAssetsReady:r,generatedSpriteAssetsVisualOnly:!0,generatedSpriteAssetsReadOnly:!0,singleVisibleHudOwner:!0,visibleHudOwner:"three_canvas",visibleHudOwnerVersion:ud,domVisibleHudDemoted:!0,domHudRole:"transparent_hit_a11y_layer",domHudHitLayerRetained:!0,domHudHitLayerPainted:!1,visibleDomHudPaintCount:0,visibleDomHudTextCount:0,noVisibleDomHudDuplication:!0,rendererNetworkRequests:0,rendererMutationHandlers:[],threeCanvasHudOwnsChrome:!0,threeCanvasHudOwnsProfiles:!0,threeCanvasHudOwnsText:!0,threeCanvasHudOwnsCommandTray:!0,threeCanvasHudOwnsCollapsedLedgerHint:!0,threeCanvasHudNoGameplayAuthority:!0,generatedHudChrome:!0,generatedHudChromeInThreeLayer:!0,generatedHudChromeAssetPack:String(this.model.generatedHudChrome?.packId||As),generatedHudChromeManifest:`${Mi}/manifest.json`,generatedHudChromeSpriteCount:o.length,generatedHudChromeAssetsReady:o.filter(c=>c.assetReady).length,generatedHudChromeCleanComposite:!0,generatedHudChromeCleanCompositeVersion:hd,generatedHudMaterialityPass:!0,generatedHudMaterialityVersion:sn,generatedHudMaterialityRendererOwned:!0,generatedHudMaterialitySource:"procedural_canvas_textures",generatedHudWorldCohesionPass:!0,generatedHudWorldCohesionVersion:Cs,generatedHudWorldCohesionSource:"procedural_canvas_textures_and_three_lines",generatedHudWorldCohesionRendererOwned:!0,generatedHudWorldCohesionSpriteCount:s.length,generatedHudWorldCohesionLineCount:a.length,generatedHudWorldCohesionSlots:[...s.map(c=>c.slot),...a.map(c=>c.slot)],generatedHudWorldDepthSeparation:s.some(c=>c.slot==="map-depth-veil"),generatedHudForegroundBridge:s.some(c=>c.slot==="bottom-foreground-bridge"),generatedHudSelectedWorldAura:s.some(c=>c.slot==="selected-world-aura"),generatedHudSelectedContextTether:a.some(c=>c.slot==="selected-context-tether"),generatedHudWorldCohesionVisualOnly:[...s,...a].every(c=>c.visualOnly),generatedHudWorldCohesionReadOnly:[...s,...a].every(c=>c.readOnly),generatedHudWorldCohesionSelectable:[...s,...a].some(c=>c.selectable),generatedHudWorldCohesionAuthority:[...s,...a].some(c=>c.routeAuthority||c.actionAuthority||c.executableActions>0),generatedHudBottomDockTrayBalanced:!0,generatedHudSelectedContextWorldConnection:a.some(c=>c.targetSlot==="selected-context"),generatedHudMaterialityProfiles:l.every(c=>c.materialityVersion===sn),generatedHudMaterialityText:h.every(c=>c.materialityVersion===sn),generatedHudMaterialityCommands:u.every(c=>c.materialityVersion===sn),generatedHudMaterialityChromeSlots:o.filter(c=>c.materialityVersion===sn).map(c=>c.slot),generatedHudChromeSourcePackRetained:o.every(c=>c.sourceAssetPath.includes(`/${As}/`)),generatedHudChromePaintedSourceCrops:o.some(c=>c.chromeSource!=="three_canvas_clean_frame"),generatedHudChromeSpritesVisualOnly:o.every(c=>c.visualOnly),generatedHudChromeSpritesReadOnly:o.every(c=>c.readOnly),generatedHudChromeSpritesSelectable:o.some(c=>c.selectable),generatedHudChromeAuthority:o.some(c=>c.routeAuthority||c.actionAuthority||c.executableActions>0),generatedHudMaskLayerVersion:Fc,generatedHudProfileMasks:!0,generatedHudProfileMasksInThreeLayer:!0,generatedHudProfileMaskSpriteCount:l.length,generatedHudProfileMaskSpriteAssetsReady:l.filter(c=>c.spriteAssetReady).length,generatedHudProfileMaskType:"circle_alpha_clip",generatedHudProfileMasksVisualOnly:l.every(c=>c.visualOnly),generatedHudProfileMasksReadOnly:l.every(c=>c.readOnly),generatedHudProfileMasksSelectable:l.some(c=>c.selectable),generatedHudProfileMaskAuthority:l.some(c=>c.routeAuthority||c.actionAuthority||c.executableActions>0),generatedHudTextInThreeLayer:!0,generatedHudTextSpriteCount:h.length,generatedHudTextLiveSource:"three_canvas_texture",generatedHudTextDomA11yOverlayRetained:h.every(c=>c.domA11yOverlayRetained),generatedHudTextSpritesVisualOnly:h.every(c=>c.visualOnly),generatedHudTextSpritesReadOnly:h.every(c=>c.readOnly),generatedHudTextSpritesSelectable:h.some(c=>c.selectable),generatedHudTextAuthority:h.some(c=>c.routeAuthority||c.actionAuthority||c.executableActions>0),generatedHudCommandGlyphsInThreeLayer:!0,generatedHudCommandGlyphSpriteCount:u.length,generatedHudCommandGlyphLiveSource:"server_owned_command_hint",generatedHudCommandGlyphsVisualOnly:u.every(c=>c.visualOnly),generatedHudCommandGlyphsReadOnly:u.every(c=>c.readOnly),generatedHudCommandGlyphsSelectable:u.some(c=>c.selectable),generatedHudCommandGlyphAuthority:u.some(c=>c.routeAuthority||c.actionAuthority||c.executableActions>0),frontierLedgerScratchVisualHud:!0,frontierLedgerScratchVersion:Bc,frontierLedgerScratchNorthStarPath:dd,frontierLedgerScratchRendererOwned:!0,frontierLedgerScratchSource:"procedural_canvas_textures_and_three_sprites",frontierLedgerScratchComposition:"map_first_frontier_ledger_board_with_leather_rail_parcel_rangefinder_and_ledger_tab",frontierLedgerScratchSpriteCount:d.length,frontierLedgerScratchTrailPipCount:d.filter(c=>c.slot==="frontier-ledger-dotted-target-trail").length,frontierLedgerScratchCameraAnchoredSpriteCount:d.filter(c=>c.cameraAnchored).length,frontierLedgerScratchSlots:d.map(c=>c.slot),frontierLedgerScratchBoardFrame:d.some(c=>c.slot==="frontier-ledger-board-frame"),frontierLedgerScratchBottomMedallionRail:d.some(c=>c.slot==="frontier-ledger-bottom-medallion-rail"),frontierLedgerScratchParcelRangefinder:d.some(c=>c.slot==="frontier-ledger-parcel-rangefinder-backplate"),frontierLedgerScratchCollapsedLedgerTab:d.some(c=>c.slot==="frontier-ledger-right-tab-shadow"),frontierLedgerScratchTopLedgerTabs:d.some(c=>c.slot==="frontier-ledger-top-tabs-shadow"),frontierLedgerScratchDottedPath:d.some(c=>c.slot==="frontier-ledger-dotted-target-trail"),frontierLedgerScratchVisualOnly:d.every(c=>c.visualOnly),frontierLedgerScratchReadOnly:d.every(c=>c.readOnly),frontierLedgerScratchSelectable:d.some(c=>c.selectable),frontierLedgerScratchAuthority:d.some(c=>c.routeAuthority||c.actionAuthority||c.executableActions>0),frontierLedgerScratchHiddenTruthLeakage:d.some(c=>c.hiddenTruthLeakage),frontierLedgerScratchPreservesDomHitLayer:!0,frontierLedgerScratchMovementUx:"direct_double_click_existing_handler_no_confirm_added",serverTerrainAssetContractVersion:Hc,serverTerrainSlotSource:zc,assetBackedRegionTiles:t.filter(c=>c.assetPath).length,assetBackedLoadedTiles:t.filter(c=>c.assetReady).length,assetBackedTerrainTextures:!0,continuousTerrainUnderlay:!0,continuousTerrainUnderlayVersion:Gt,continuousUnderlayUsesServerOwnedCells:!0,continuousUnderlayHiddenCellsFogOnly:t.filter(c=>!["discovered","known"].includes(c.fogState)).every(c=>c.underlayFogOnly&&c.underlayTerrain===c.fogState),continuousUnderlayVisualOnly:!0,plateBlendLayer:!0,softRegionSeams:!0,reducedPlateEdgeContrast:!0,centerTileMutedForUnderlay:!0,cartographicFogDepth:!0,ambientContourField:!0,fogDepthGlyphsVisualOnly:!0,terrainUnderlayCount:this.terrainUnderlayCount,proceduralFallbackWhenAssetPending:!0,candidate02Cues:!0,agentTownIdentityCues:!0,scoutLedgerHud:!0,mapFirstHudOverlays:!0,hoverAffordance:!0,selectedSectorOutline:!0,beaconPlanWagonCues:!0,homeNodeEmphasis:!0,riverFlatCues:!0,waterCuesServerGated:!0,woodlandRidgeCues:!0,ruinSignalCues:!0,ruinSignalCuesServerGated:!0,lockedUnknownSealedFogOnly:!0,hintedAbstractFogEdge:!0,frontierBoundaryDashes:!0,frontierBoundaryVisualOnly:!0,fogVeils:this.cells.filter(c=>!["discovered","known"].includes(String(c.fogState||""))).length,edgeFogCount:this.edgeFogCount,civicBeaconCount:this.civicBeaconCount,surveyStrokeCount:this.surveyStrokeCount,surveyStrokesVisualOnly:!0,receiptTraceVisualOnly:!0,markerCount:this.markerCount,eventPacketMarkers:!0,eventPacketMarkerCount:this.eventMarkerCount,objectiveMarkers:!0,objectiveMarkerCount:this.objectiveMarkerCount,eventObjectiveMarkersVisualOnly:[...this.eventMarkerSprites,...this.objectiveMarkerSprites].every(c=>c.userData?.visualOnly===!0),eventObjectiveMarkersReadOnly:[...this.eventMarkerSprites,...this.objectiveMarkerSprites].every(c=>c.userData?.readOnly===!0),eventObjectiveMarkersInspectable:[...this.eventMarkerSprites,...this.objectiveMarkerSprites].every(c=>c.userData?.selectable===!0&&c.userData?.inspectable===!0),eventObjectiveMarkerAuthority:!1,outpostNextFrontierBeacon:!0,outpostNextFrontierBeaconCount:this.outpostFrontierBeaconCount,outpostNextFrontierBeaconVisualOnly:this.outpostFrontierBeaconSprites.every(c=>c.userData?.visualOnly===!0),outpostNextFrontierBeaconReadOnly:this.outpostFrontierBeaconSprites.every(c=>c.userData?.readOnly===!0),outpostNextFrontierBeaconSelectable:this.outpostFrontierBeaconSprites.some(c=>c.userData?.selectable===!0),outpostNextFrontierBeaconAuthority:!1,outpostNextFrontierBeaconHiddenTruthLeakage:this.outpostFrontierBeaconSprites.some(c=>c.userData?.hiddenTruthLeakage===!0),unitTokens:!0,unitTokenCount:this.unitTokenCount,unitTokensReadOnly:this.unitSprites.every(c=>c.userData?.readOnly===!0),unitMovementMutationImplemented:this.unitSprites.some(c=>c.userData?.movementMutationImplemented===!0),commandTargetRings:!0,commandTargetCount:this.commandTargetCount,commandTargetRingsVisualOnly:this.commandTargetSprites.every(c=>c.userData?.visualOnly===!0),commandTargetRingsReadOnly:this.commandTargetSprites.every(c=>c.userData?.readOnly===!0),commandTargetRingsSelectable:this.commandTargetSprites.every(c=>c.userData?.selectable===!0),commandTargetRingsPreviewOnly:this.commandTargetSprites.every(c=>c.userData?.previewOnly===!0),commandTargetRingAuthority:!1,commandOutcomeFeedback:this.outcomeFeedbackCount>0,commandOutcomeFeedbackCount:this.outcomeFeedbackCount,commandOutcomeFeedbackVisualOnly:this.outcomeFeedbackSprites.every(c=>c.userData?.visualOnly===!0),commandOutcomeFeedbackReadOnly:this.outcomeFeedbackSprites.every(c=>c.userData?.readOnly===!0),commandOutcomeFeedbackServerOwned:this.outcomeFeedbackSprites.every(c=>c.userData?.serverOwnedResult===!0),commandOutcomeFeedbackSelectable:this.outcomeFeedbackSprites.some(c=>c.userData?.selectable===!0),commandOutcomeFeedbackAuthority:!1,clientAuthority:!1},generatedHudWorldCohesionSprites:s,generatedHudWorldCohesionLines:a,generatedHudChromeSprites:o,generatedHudProfileSprites:l,generatedHudTextSprites:h,generatedHudCommandSprites:u,frontierLedgerScratchSprites:d,visibleHudSlots:f,regionConsistency:{waterCueCells:t.filter(c=>c.waterCue).map(c=>c.cellId),ruinSignalCueCells:t.filter(c=>c.ruinSignalCue).map(c=>c.cellId),lockedUnknownCellsSealed:t.filter(c=>c.fogState==="locked_unknown").every(c=>c.hiddenSpecificitySuppressed&&!c.waterCue&&!c.ruinSignalCue),hintedCellsAbstract:t.filter(c=>c.fogState==="hinted").every(c=>c.hiddenSpecificitySuppressed&&!c.waterCue&&!c.ruinSignalCue),waterCuesRequireServerOwnedWater:t.filter(c=>c.waterCue).every(c=>c.publicTerrainAssetSlot==="water"),waterCoastRuntimeAssetsBlocked:t.every(c=>!["water","coast"].includes(String(c.assetSlot||""))),hiddenCellsHaveNoPublicTerrainSlot:t.filter(c=>!["discovered","known"].includes(c.fogState)).every(c=>c.publicTerrainAssetSlot==null),hiddenCellsUseOnlyFogAssets:t.filter(c=>!["discovered","known"].includes(c.fogState)).every(c=>["hinted_frontier_fog","locked_unknown_fog"].includes(String(c.assetSlot||""))&&c.fogOnly===!0&&c.assetKind==="fog_only"),knownDiscoveredAssetsMatchServerTerrain:t.filter(c=>["discovered","known"].includes(c.fogState)&&c.assetPath).every(c=>c.assetAllowedByServerTruth===!0),visibleAssetsMatchPublicTerrainSlot:t.filter(c=>["discovered","known"].includes(c.fogState)&&c.assetPath).every(c=>c.assetSlot===c.publicTerrainAssetSlot&&c.assetKind==="concrete_public_terrain"),serverTerrainAssetContractComplete:t.every(c=>c.terrainAssetContractVersion===Hc&&(["discovered","known"].includes(c.fogState)?c.publicTerrainAssetSlotSource===zc:c.fogAssetSlot!=null)),runtimeAssetProofMetadataComplete:t.filter(c=>c.assetPath).every(c=>c.cellId&&c.fogState&&c.runtimeAssetPack&&c.assetSlot&&c.assetKind&&typeof c.assetAllowedByServerTruth=="boolean"),runtimeAssetCellsRegionTruthBound:t.filter(c=>c.assetPath).every(c=>c.assetAllowedByServerTruth===!0),continuousUnderlayHiddenCellsFogOnly:t.filter(c=>!["discovered","known"].includes(c.fogState)).every(c=>c.underlayFogOnly&&c.underlayTerrain===c.fogState),continuousUnderlayNoActionAuthority:this.terrainUnderlayCount===1},regionVisuals:t,eventMarkers:this.eventMarkerSprites.map(c=>({packetId:String(c.userData?.packetId||""),cellId:String(c.userData?.cellId||""),templateId:String(c.userData?.templateId||""),spriteAssetSlot:String(c.userData?.spriteAssetSlot||""),spriteAssetPath:String(c.userData?.spriteAssetPath||""),spriteAssetReady:c.userData?.spriteAssetReady===!0,visualOnly:c.userData?.visualOnly===!0,readOnly:c.userData?.readOnly===!0,selectable:c.userData?.selectable===!0,inspectable:c.userData?.inspectable===!0,routeAuthority:c.userData?.routeAuthority===!0,actionAuthority:c.userData?.actionAuthority===!0,executableActions:Number(c.userData?.executableActions||0),canvas:this.canvasPointForObject(c)})),objectiveMarkers:this.objectiveMarkerSprites.map(c=>({mode:String(c.userData?.mode||""),targetCellId:String(c.userData?.targetCellId||""),packetId:String(c.userData?.packetId||""),spriteAssetSlot:String(c.userData?.spriteAssetSlot||""),spriteAssetPath:String(c.userData?.spriteAssetPath||""),spriteAssetReady:c.userData?.spriteAssetReady===!0,visualOnly:c.userData?.visualOnly===!0,readOnly:c.userData?.readOnly===!0,selectable:c.userData?.selectable===!0,inspectable:c.userData?.inspectable===!0,routeAuthority:c.userData?.routeAuthority===!0,actionAuthority:c.userData?.actionAuthority===!0,executableActions:Number(c.userData?.executableActions||0),canvas:this.canvasPointForObject(c)})),outpostNextFrontierBeacons:this.outpostFrontierBeaconSprites.map(c=>({unitId:String(c.userData?.unitId||""),unitType:String(c.userData?.unitType||""),commandId:String(c.userData?.commandId||""),cueLabel:String(c.userData?.cueLabel||""),originCellId:String(c.userData?.originCellId||""),targetCellId:String(c.userData?.targetCellId||""),targetFogState:String(c.userData?.targetFogState||""),targetKind:String(c.userData?.targetKind||""),derivedFrom:String(c.userData?.derivedFrom||""),visualOnly:c.userData?.visualOnly===!0,readOnly:c.userData?.readOnly===!0,selectable:c.userData?.selectable===!0,routeAuthority:c.userData?.routeAuthority===!0,actionAuthority:c.userData?.actionAuthority===!0,executableActions:Number(c.userData?.executableActions||0),hiddenTruthLeakage:c.userData?.hiddenTruthLeakage===!0,canvas:this.canvasPointForObject(c)})),units:this.unitSprites.map(c=>({unitId:String(c.userData?.unitId||""),unitType:String(c.userData?.unitType||""),displayName:String(c.userData?.displayName||""),cellId:String(c.userData?.cellId||""),spriteAssetSlot:String(c.userData?.spriteAssetSlot||""),spriteAssetPath:String(c.userData?.spriteAssetPath||""),spriteAssetReady:c.userData?.spriteAssetReady===!0,selected:String(c.userData?.unitId||"")===String(this.selectedUnitId||""),readOnly:c.userData?.readOnly===!0,movementMutationImplemented:c.userData?.movementMutationImplemented===!0,canvas:this.canvasPointForObject(c)})),commandTargets:this.commandTargetSprites.map(c=>({unitId:String(c.userData?.unitId||""),unitType:String(c.userData?.unitType||""),commandId:String(c.userData?.commandId||""),cellId:String(c.userData?.cellId||""),fogState:String(c.userData?.fogState||""),serverMutationImplemented:c.userData?.serverMutationImplemented===!0,movementMutation:c.userData?.movementMutation===!0,visualOnly:c.userData?.visualOnly===!0,readOnly:c.userData?.readOnly===!0,previewOnly:c.userData?.previewOnly===!0,selectable:c.userData?.selectable===!0,routeAuthority:c.userData?.routeAuthority===!0,actionAuthority:c.userData?.actionAuthority===!0,executableActions:Number(c.userData?.executableActions||0),canvas:this.canvasPointForObject(c)})),commandOutcomeFeedback:this.outcomeFeedbackSprites.map(c=>({feedbackId:String(c.userData?.feedbackId||""),unitId:String(c.userData?.unitId||""),unitType:String(c.userData?.unitType||""),commandId:String(c.userData?.commandId||""),cellId:String(c.userData?.cellId||""),targetCellId:String(c.userData?.targetCellId||""),sourceCellId:String(c.userData?.sourceCellId||""),receiptId:String(c.userData?.receiptId||""),receiptKind:String(c.userData?.receiptKind||""),serverOwnedResult:c.userData?.serverOwnedResult===!0,visualOnly:c.userData?.visualOnly===!0,readOnly:c.userData?.readOnly===!0,selectable:c.userData?.selectable===!0,routeAuthority:c.userData?.routeAuthority===!0,actionAuthority:c.userData?.actionAuthority===!0,executableActions:Number(c.userData?.executableActions||0),canvas:this.canvasPointForObject(c)})),camera:{x:Number(this.camera.position.x.toFixed(3)),y:Number(this.camera.position.y.toFixed(3)),zoom:Number(this.camera.zoom.toFixed(3))},bounds:{minX:Number(this.mapBounds.minX.toFixed(3)),maxX:Number(this.mapBounds.maxX.toFixed(3)),minY:Number(this.mapBounds.minY.toFixed(3)),maxY:Number(this.mapBounds.maxY.toFixed(3))},fogStates:this.cells.reduce((c,g)=>{let S=String(g.fogState||"locked_unknown");return c[S]=Number(c[S]||0)+1,c},{}),pickTargets:this.cells.map(c=>({cellId:String(c.cellId||""),fogState:String(c.fogState||""),terrain:Qn(c),status:String(c.status||""),title:String(c.title||""),canvas:this.canvasPointForCell(c.cellId)}))},this.info}render(){this.updateInfo(),this.renderer.render(this.scene,this.camera)}};function ex(n,e,t){let i=Uc.get(n);return i||(i=new kc(n),Uc.set(n,i)),i.attach(e),i.sync(t||{}),i.info}function tx(n){let e=Uc.get(n);return e?e.updateInfo():null}function nx(n,e={},t={}){let i=Vi.get(n);return i||(i=new Yc(n),Vi.set(n,i)),i.sync(e||{},t.selectedCellId||"",t.selectedUnitId||"",t.outcomeFeedback||null)}function ix(n){let e=Vi.get(n);return e?e.updateInfo():null}function rx(n,e=1){let t=Vi.get(n);return t?(t.setZoom(t.camera.zoom*ge(e,1)),t.updateInfo()):null}function sx(n){let e=Vi.get(n);return e?(e.resetView(),e.updateInfo()):null}function ax(n){let e=Vi.get(n);e&&(e.dispose(),Vi.delete(n))}window.FoundersPlotThreeRenderer={renderPlotScene:ex,getPlotSceneInfo:tx,renderExpeditionMap:nx,getExpeditionMapInfo:ix,zoomExpeditionMap:rx,resetExpeditionMapCamera:sx,disposeExpeditionMap:ax};})();
