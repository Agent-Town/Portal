var FoundersPlotThreeBundle=(()=>{var wh=0,Nl=1,Ah=2;var hr=1,Ch=2,Ss=3,Gn=0,Ht=1,Bt=2,Rn=0,Ci=1,Ul=2,Ol=3,Bl=4,Rh=5;var ai=100,Ih=101,Ph=102,Dh=103,Lh=104,Fh=200,Nh=201,Uh=202,Oh=203,ra=204,aa=205,Bh=206,kh=207,zh=208,Hh=209,Vh=210,Gh=211,Wh=212,Xh=213,qh=214,oa=0,la=1,ca=2,Ri=3,ha=4,ua=5,da=6,fa=7,kl=0,Yh=1,$h=2,fn=0,zl=1,Hl=2,Vl=3,Gl=4,Wl=5,Xl=6,ql=7;var Yl=300,pi=301,Di=302,Ya=303,$a=304,ur=306,pa=1e3,Kt=1001,ma=1002,Rt=1003,Zh=1004;var dr=1005;var we=1006,Za=1007;var pn=1008;var sn=1009,$l=1010,Zl=1011,Ms=1012,Ja=1013,mn=1014,gn=1015,In=1016,Ka=1017,ja=1018,bs=1020,Jl=35902,Kl=35899,jl=1021,Ql=1022,on=1023,Tn=1026,mi=1027,ec=1028,Qa=1029,gi=1030,eo=1031;var to=1033,fr=33776,pr=33777,mr=33778,gr=33779,no=35840,io=35841,so=35842,ro=35843,ao=36196,oo=37492,lo=37496,co=37488,ho=37489,_r=37490,uo=37491,fo=37808,po=37809,mo=37810,go=37811,_o=37812,xo=37813,yo=37814,vo=37815,So=37816,Mo=37817,bo=37818,To=37819,Eo=37820,wo=37821,Ao=36492,Co=36494,Ro=36495,Io=36283,Po=36284,xr=36285,Do=36286;var ks=2300,ga=2301,ia=2302,bl=2303,Tl=2400,El=2401,wl=2402;var Jh=3200;var tc=0,Kh=1,qn="",qe="srgb",zs="srgb-linear",Hs="linear",Ke="srgb";var Ai=7680;var Al=519,jh=512,Qh=513,eu=514,Lo=515,tu=516,nu=517,Fo=518,iu=519,_a=35044;var nc="300 es",un=2e3,Vs=2001;function Sd(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function Md(n){return ArrayBuffer.isView(n)&&!(n instanceof DataView)}function rs(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function su(){let n=rs("canvas");return n.style.display="block",n}var Yc={},as=null;function Gs(...n){let e="THREE."+n.shift();as?as("log",e,...n):console.log(e,...n)}function ru(n){let e=n[0];if(typeof e=="string"&&e.startsWith("TSL:")){let t=n[1];t&&t.isStackTrace?n[0]+=" "+t.getLocation():n[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return n}function Ce(...n){n=ru(n);let e="THREE."+n.shift();if(as)as("warn",e,...n);else{let t=n[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...n)}}function Re(...n){n=ru(n);let e="THREE."+n.shift();if(as)as("error",e,...n);else{let t=n[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...n)}}function xa(...n){let e=n.join(" ");e in Yc||(Yc[e]=!0,Ce(...n))}function au(n,e,t){return new Promise(function(i,s){function r(){switch(n.clientWaitSync(e,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:s();break;case n.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:i()}}setTimeout(r,t)})}var ou={[oa]:la,[ca]:da,[ha]:fa,[Ri]:ua,[la]:oa,[da]:ca,[fa]:ha,[ua]:Ri},En=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){let i=this._listeners;return i===void 0?!1:i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){let i=this._listeners;if(i===void 0)return;let s=i[e];if(s!==void 0){let r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let i=t[e.type];if(i!==void 0){e.target=this;let s=i.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,e);e.target=null}}},Nt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var Zo=Math.PI/180,ya=180/Math.PI;function Hn(){let n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Nt[n&255]+Nt[n>>8&255]+Nt[n>>16&255]+Nt[n>>24&255]+"-"+Nt[e&255]+Nt[e>>8&255]+"-"+Nt[e>>16&15|64]+Nt[e>>24&255]+"-"+Nt[t&63|128]+Nt[t>>8&255]+"-"+Nt[t>>16&255]+Nt[t>>24&255]+Nt[i&255]+Nt[i>>8&255]+Nt[i>>16&255]+Nt[i>>24&255]).toLowerCase()}function Ve(n,e,t){return Math.max(e,Math.min(t,n))}function bd(n,e){return(n%e+e)%e}function Jo(n,e,t){return(1-t)*n+t*e}function bn(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("Invalid component type.")}}function nt(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("Invalid component type.")}}var ge=class n{static{n.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,i=this.y,s=e.elements;return this.x=s[0]*t+s[3]*i+s[6],this.y=s[1]*t+s[4]*i+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Ve(this.x,e.x,t.x),this.y=Ve(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=Ve(this.x,e,t),this.y=Ve(this.y,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Ve(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(Ve(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let i=Math.cos(t),s=Math.sin(t),r=this.x-e.x,a=this.y-e.y;return this.x=r*i-a*s+e.x,this.y=r*s+a*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},wn=class{constructor(e=0,t=0,i=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=s}static slerpFlat(e,t,i,s,r,a,o){let l=i[s+0],c=i[s+1],h=i[s+2],d=i[s+3],u=r[a+0],f=r[a+1],g=r[a+2],S=r[a+3];if(d!==S||l!==u||c!==f||h!==g){let p=l*u+c*f+h*g+d*S;p<0&&(u=-u,f=-f,g=-g,S=-S,p=-p);let m=1-o;if(p<.9995){let x=Math.acos(p),M=Math.sin(x);m=Math.sin(m*x)/M,o=Math.sin(o*x)/M,l=l*m+u*o,c=c*m+f*o,h=h*m+g*o,d=d*m+S*o}else{l=l*m+u*o,c=c*m+f*o,h=h*m+g*o,d=d*m+S*o;let x=1/Math.sqrt(l*l+c*c+h*h+d*d);l*=x,c*=x,h*=x,d*=x}}e[t]=l,e[t+1]=c,e[t+2]=h,e[t+3]=d}static multiplyQuaternionsFlat(e,t,i,s,r,a){let o=i[s],l=i[s+1],c=i[s+2],h=i[s+3],d=r[a],u=r[a+1],f=r[a+2],g=r[a+3];return e[t]=o*g+h*d+l*f-c*u,e[t+1]=l*g+h*u+c*d-o*f,e[t+2]=c*g+h*f+o*u-l*d,e[t+3]=h*g-o*d-l*u-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,s){return this._x=e,this._y=t,this._z=i,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let i=e._x,s=e._y,r=e._z,a=e._order,o=Math.cos,l=Math.sin,c=o(i/2),h=o(s/2),d=o(r/2),u=l(i/2),f=l(s/2),g=l(r/2);switch(a){case"XYZ":this._x=u*h*d+c*f*g,this._y=c*f*d-u*h*g,this._z=c*h*g+u*f*d,this._w=c*h*d-u*f*g;break;case"YXZ":this._x=u*h*d+c*f*g,this._y=c*f*d-u*h*g,this._z=c*h*g-u*f*d,this._w=c*h*d+u*f*g;break;case"ZXY":this._x=u*h*d-c*f*g,this._y=c*f*d+u*h*g,this._z=c*h*g+u*f*d,this._w=c*h*d-u*f*g;break;case"ZYX":this._x=u*h*d-c*f*g,this._y=c*f*d+u*h*g,this._z=c*h*g-u*f*d,this._w=c*h*d+u*f*g;break;case"YZX":this._x=u*h*d+c*f*g,this._y=c*f*d+u*h*g,this._z=c*h*g-u*f*d,this._w=c*h*d-u*f*g;break;case"XZY":this._x=u*h*d-c*f*g,this._y=c*f*d-u*h*g,this._z=c*h*g+u*f*d,this._w=c*h*d+u*f*g;break;default:Ce("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let i=t/2,s=Math.sin(i);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,i=t[0],s=t[4],r=t[8],a=t[1],o=t[5],l=t[9],c=t[2],h=t[6],d=t[10],u=i+o+d;if(u>0){let f=.5/Math.sqrt(u+1);this._w=.25/f,this._x=(h-l)*f,this._y=(r-c)*f,this._z=(a-s)*f}else if(i>o&&i>d){let f=2*Math.sqrt(1+i-o-d);this._w=(h-l)/f,this._x=.25*f,this._y=(s+a)/f,this._z=(r+c)/f}else if(o>d){let f=2*Math.sqrt(1+o-i-d);this._w=(r-c)/f,this._x=(s+a)/f,this._y=.25*f,this._z=(l+h)/f}else{let f=2*Math.sqrt(1+d-i-o);this._w=(a-s)/f,this._x=(r+c)/f,this._y=(l+h)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<1e-8?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Ve(this.dot(e),-1,1)))}rotateTowards(e,t){let i=this.angleTo(e);if(i===0)return this;let s=Math.min(1,t/i);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let i=e._x,s=e._y,r=e._z,a=e._w,o=t._x,l=t._y,c=t._z,h=t._w;return this._x=i*h+a*o+s*c-r*l,this._y=s*h+a*l+r*o-i*c,this._z=r*h+a*c+i*l-s*o,this._w=a*h-i*o-s*l-r*c,this._onChangeCallback(),this}slerp(e,t){let i=e._x,s=e._y,r=e._z,a=e._w,o=this.dot(e);o<0&&(i=-i,s=-s,r=-r,a=-a,o=-o);let l=1-t;if(o<.9995){let c=Math.acos(o),h=Math.sin(c);l=Math.sin(l*c)/h,t=Math.sin(t*c)/h,this._x=this._x*l+i*t,this._y=this._y*l+s*t,this._z=this._z*l+r*t,this._w=this._w*l+a*t,this._onChangeCallback()}else this._x=this._x*l+i*t,this._y=this._y*l+s*t,this._z=this._z*l+r*t,this._w=this._w*l+a*t,this.normalize();return this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),s=Math.sqrt(1-i),r=Math.sqrt(i);return this.set(s*Math.sin(e),s*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},C=class n{static{n.prototype.isVector3=!0}constructor(e=0,t=0,i=0){this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion($c.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion($c.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,i=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6]*s,this.y=r[1]*t+r[4]*i+r[7]*s,this.z=r[2]*t+r[5]*i+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,i=this.y,s=this.z,r=e.elements,a=1/(r[3]*t+r[7]*i+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*i+r[8]*s+r[12])*a,this.y=(r[1]*t+r[5]*i+r[9]*s+r[13])*a,this.z=(r[2]*t+r[6]*i+r[10]*s+r[14])*a,this}applyQuaternion(e){let t=this.x,i=this.y,s=this.z,r=e.x,a=e.y,o=e.z,l=e.w,c=2*(a*s-o*i),h=2*(o*t-r*s),d=2*(r*i-a*t);return this.x=t+l*c+a*d-o*h,this.y=i+l*h+o*c-r*d,this.z=s+l*d+r*h-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,i=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*i+r[8]*s,this.y=r[1]*t+r[5]*i+r[9]*s,this.z=r[2]*t+r[6]*i+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Ve(this.x,e.x,t.x),this.y=Ve(this.y,e.y,t.y),this.z=Ve(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=Ve(this.x,e,t),this.y=Ve(this.y,e,t),this.z=Ve(this.z,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Ve(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let i=e.x,s=e.y,r=e.z,a=t.x,o=t.y,l=t.z;return this.x=s*l-r*o,this.y=r*a-i*l,this.z=i*o-s*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return Ko.copy(this).projectOnVector(e),this.sub(Ko)}reflect(e){return this.sub(Ko.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(Ve(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y,s=this.z-e.z;return t*t+i*i+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){let s=Math.sin(t)*e;return this.x=s*Math.sin(i),this.y=Math.cos(t)*e,this.z=s*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},Ko=new C,$c=new wn,Le=class n{static{n.prototype.isMatrix3=!0}constructor(e,t,i,s,r,a,o,l,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,s,r,a,o,l,c)}set(e,t,i,s,r,a,o,l,c){let h=this.elements;return h[0]=e,h[1]=s,h[2]=o,h[3]=t,h[4]=r,h[5]=l,h[6]=i,h[7]=a,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,s=t.elements,r=this.elements,a=i[0],o=i[3],l=i[6],c=i[1],h=i[4],d=i[7],u=i[2],f=i[5],g=i[8],S=s[0],p=s[3],m=s[6],x=s[1],M=s[4],b=s[7],A=s[2],E=s[5],I=s[8];return r[0]=a*S+o*x+l*A,r[3]=a*p+o*M+l*E,r[6]=a*m+o*b+l*I,r[1]=c*S+h*x+d*A,r[4]=c*p+h*M+d*E,r[7]=c*m+h*b+d*I,r[2]=u*S+f*x+g*A,r[5]=u*p+f*M+g*E,r[8]=u*m+f*b+g*I,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8];return t*a*h-t*o*c-i*r*h+i*o*l+s*r*c-s*a*l}invert(){let e=this.elements,t=e[0],i=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],d=h*a-o*c,u=o*l-h*r,f=c*r-a*l,g=t*d+i*u+s*f;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let S=1/g;return e[0]=d*S,e[1]=(s*c-h*i)*S,e[2]=(o*i-s*a)*S,e[3]=u*S,e[4]=(h*t-s*l)*S,e[5]=(s*r-o*t)*S,e[6]=f*S,e[7]=(i*l-c*t)*S,e[8]=(a*t-i*r)*S,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,s,r,a,o){let l=Math.cos(r),c=Math.sin(r);return this.set(i*l,i*c,-i*(l*a+c*o)+a+e,-s*c,s*l,-s*(-c*a+l*o)+o+t,0,0,1),this}scale(e,t){return this.premultiply(jo.makeScale(e,t)),this}rotate(e){return this.premultiply(jo.makeRotation(-e)),this}translate(e,t){return this.premultiply(jo.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,i=e.elements;for(let s=0;s<9;s++)if(t[s]!==i[s])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}},jo=new Le,Zc=new Le().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Jc=new Le().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Td(){let n={enabled:!0,workingColorSpace:zs,spaces:{},convert:function(s,r,a){return this.enabled===!1||r===a||!r||!a||(this.spaces[r].transfer===Ke&&(s.r=Vn(s.r),s.g=Vn(s.g),s.b=Vn(s.b)),this.spaces[r].primaries!==this.spaces[a].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===Ke&&(s.r=is(s.r),s.g=is(s.g),s.b=is(s.b))),s},workingToColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},colorSpaceToWorking:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===qn?Hs:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,a){return s.copy(this.spaces[r].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,r){return xa("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),n.workingToColorSpace(s,r)},toWorkingColorSpace:function(s,r){return xa("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),n.colorSpaceToWorking(s,r)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],i=[.3127,.329];return n.define({[zs]:{primaries:e,whitePoint:i,transfer:Hs,toXYZ:Zc,fromXYZ:Jc,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:qe},outputColorSpaceConfig:{drawingBufferColorSpace:qe}},[qe]:{primaries:e,whitePoint:i,transfer:Ke,toXYZ:Zc,fromXYZ:Jc,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:qe}}}),n}var Xe=Td();function Vn(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function is(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}var zi,va=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let i;if(e instanceof HTMLCanvasElement)i=e;else{zi===void 0&&(zi=rs("canvas")),zi.width=e.width,zi.height=e.height;let s=zi.getContext("2d");e instanceof ImageData?s.putImageData(e,0,0):s.drawImage(e,0,0,e.width,e.height),i=zi}return i.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=rs("canvas");t.width=e.width,t.height=e.height;let i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);let s=i.getImageData(0,0,e.width,e.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=Vn(r[a]/255)*255;return i.putImageData(s,0,0),t}else if(e.data){let t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(Vn(t[i]/255)*255):t[i]=Vn(t[i]);return{data:t,width:e.width,height:e.height}}else return Ce("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},Ed=0,os=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Ed++}),this.uuid=Hn(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let i={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(Qo(s[a].image)):r.push(Qo(s[a]))}else r=Qo(s);i.url=r}return t||(e.images[this.uuid]=i),i}};function Qo(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?va.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(Ce("Texture: Unable to serialize Texture."),{})}var wd=0,el=new C,It=class n extends En{constructor(e=n.DEFAULT_IMAGE,t=n.DEFAULT_MAPPING,i=Kt,s=Kt,r=we,a=pn,o=on,l=sn,c=n.DEFAULT_ANISOTROPY,h=qn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:wd++}),this.uuid=Hn(),this.name="",this.source=new os(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new ge(0,0),this.repeat=new ge(1,1),this.center=new ge(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Le,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(el).x}get height(){return this.source.getSize(el).y}get depth(){return this.source.getSize(el).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let i=e[t];if(i===void 0){Ce(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){Ce(`Texture.setValues(): property '${t}' does not exist.`);continue}s&&i&&s.isVector2&&i.isVector2||s&&i&&s.isVector3&&i.isVector3||s&&i&&s.isMatrix3&&i.isMatrix3?s.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Yl)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case pa:e.x=e.x-Math.floor(e.x);break;case Kt:e.x=e.x<0?0:1;break;case ma:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case pa:e.y=e.y-Math.floor(e.y);break;case Kt:e.y=e.y<0?0:1;break;case ma:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};It.DEFAULT_IMAGE=null;It.DEFAULT_MAPPING=Yl;It.DEFAULT_ANISOTROPY=1;var xt=class n{static{n.prototype.isVector4=!0}constructor(e=0,t=0,i=0,s=1){this.x=e,this.y=t,this.z=i,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,s){return this.x=e,this.y=t,this.z=i,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,i=this.y,s=this.z,r=this.w,a=e.elements;return this.x=a[0]*t+a[4]*i+a[8]*s+a[12]*r,this.y=a[1]*t+a[5]*i+a[9]*s+a[13]*r,this.z=a[2]*t+a[6]*i+a[10]*s+a[14]*r,this.w=a[3]*t+a[7]*i+a[11]*s+a[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,s,r,l=e.elements,c=l[0],h=l[4],d=l[8],u=l[1],f=l[5],g=l[9],S=l[2],p=l[6],m=l[10];if(Math.abs(h-u)<.01&&Math.abs(d-S)<.01&&Math.abs(g-p)<.01){if(Math.abs(h+u)<.1&&Math.abs(d+S)<.1&&Math.abs(g+p)<.1&&Math.abs(c+f+m-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let M=(c+1)/2,b=(f+1)/2,A=(m+1)/2,E=(h+u)/4,I=(d+S)/4,y=(g+p)/4;return M>b&&M>A?M<.01?(i=0,s=.707106781,r=.707106781):(i=Math.sqrt(M),s=E/i,r=I/i):b>A?b<.01?(i=.707106781,s=0,r=.707106781):(s=Math.sqrt(b),i=E/s,r=y/s):A<.01?(i=.707106781,s=.707106781,r=0):(r=Math.sqrt(A),i=I/r,s=y/r),this.set(i,s,r,t),this}let x=Math.sqrt((p-g)*(p-g)+(d-S)*(d-S)+(u-h)*(u-h));return Math.abs(x)<.001&&(x=1),this.x=(p-g)/x,this.y=(d-S)/x,this.z=(u-h)/x,this.w=Math.acos((c+f+m-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Ve(this.x,e.x,t.x),this.y=Ve(this.y,e.y,t.y),this.z=Ve(this.z,e.z,t.z),this.w=Ve(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=Ve(this.x,e,t),this.y=Ve(this.y,e,t),this.z=Ve(this.z,e,t),this.w=Ve(this.w,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Ve(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Sa=class extends En{constructor(e=1,t=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:we,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1},i),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=i.depth,this.scissor=new xt(0,0,e,t),this.scissorTest=!1,this.viewport=new xt(0,0,e,t),this.textures=[];let s={width:e,height:t,depth:i.depth},r=new It(s),a=i.count;for(let o=0;o<a;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview}_setTextureOptions(e={}){let t={minFilter:we,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=i,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,i=e.textures.length;t<i;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let s=Object.assign({},e.textures[t].image);this.textures[t].source=new os(s)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this.multiview=e.multiview,this}dispose(){this.dispatchEvent({type:"dispose"})}},jt=class extends Sa{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}},Ws=class extends It{constructor(e=null,t=1,i=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:s},this.magFilter=Rt,this.minFilter=Rt,this.wrapR=Kt,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var Ma=class extends It{constructor(e=null,t=1,i=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:s},this.magFilter=Rt,this.minFilter=Rt,this.wrapR=Kt,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var ut=class n{static{n.prototype.isMatrix4=!0}constructor(e,t,i,s,r,a,o,l,c,h,d,u,f,g,S,p){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,s,r,a,o,l,c,h,d,u,f,g,S,p)}set(e,t,i,s,r,a,o,l,c,h,d,u,f,g,S,p){let m=this.elements;return m[0]=e,m[4]=t,m[8]=i,m[12]=s,m[1]=r,m[5]=a,m[9]=o,m[13]=l,m[2]=c,m[6]=h,m[10]=d,m[14]=u,m[3]=f,m[7]=g,m[11]=S,m[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new n().fromArray(this.elements)}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){let t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return this.determinant()===0?(e.set(1,0,0),t.set(0,1,0),i.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){if(e.determinant()===0)return this.identity();let t=this.elements,i=e.elements,s=1/Hi.setFromMatrixColumn(e,0).length(),r=1/Hi.setFromMatrixColumn(e,1).length(),a=1/Hi.setFromMatrixColumn(e,2).length();return t[0]=i[0]*s,t[1]=i[1]*s,t[2]=i[2]*s,t[3]=0,t[4]=i[4]*r,t[5]=i[5]*r,t[6]=i[6]*r,t[7]=0,t[8]=i[8]*a,t[9]=i[9]*a,t[10]=i[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,i=e.x,s=e.y,r=e.z,a=Math.cos(i),o=Math.sin(i),l=Math.cos(s),c=Math.sin(s),h=Math.cos(r),d=Math.sin(r);if(e.order==="XYZ"){let u=a*h,f=a*d,g=o*h,S=o*d;t[0]=l*h,t[4]=-l*d,t[8]=c,t[1]=f+g*c,t[5]=u-S*c,t[9]=-o*l,t[2]=S-u*c,t[6]=g+f*c,t[10]=a*l}else if(e.order==="YXZ"){let u=l*h,f=l*d,g=c*h,S=c*d;t[0]=u+S*o,t[4]=g*o-f,t[8]=a*c,t[1]=a*d,t[5]=a*h,t[9]=-o,t[2]=f*o-g,t[6]=S+u*o,t[10]=a*l}else if(e.order==="ZXY"){let u=l*h,f=l*d,g=c*h,S=c*d;t[0]=u-S*o,t[4]=-a*d,t[8]=g+f*o,t[1]=f+g*o,t[5]=a*h,t[9]=S-u*o,t[2]=-a*c,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){let u=a*h,f=a*d,g=o*h,S=o*d;t[0]=l*h,t[4]=g*c-f,t[8]=u*c+S,t[1]=l*d,t[5]=S*c+u,t[9]=f*c-g,t[2]=-c,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){let u=a*l,f=a*c,g=o*l,S=o*c;t[0]=l*h,t[4]=S-u*d,t[8]=g*d+f,t[1]=d,t[5]=a*h,t[9]=-o*h,t[2]=-c*h,t[6]=f*d+g,t[10]=u-S*d}else if(e.order==="XZY"){let u=a*l,f=a*c,g=o*l,S=o*c;t[0]=l*h,t[4]=-d,t[8]=c*h,t[1]=u*d+S,t[5]=a*h,t[9]=f*d-g,t[2]=g*d-f,t[6]=o*h,t[10]=S*d+u}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Ad,e,Cd)}lookAt(e,t,i){let s=this.elements;return Zt.subVectors(e,t),Zt.lengthSq()===0&&(Zt.z=1),Zt.normalize(),ei.crossVectors(i,Zt),ei.lengthSq()===0&&(Math.abs(i.z)===1?Zt.x+=1e-4:Zt.z+=1e-4,Zt.normalize(),ei.crossVectors(i,Zt)),ei.normalize(),Ir.crossVectors(Zt,ei),s[0]=ei.x,s[4]=Ir.x,s[8]=Zt.x,s[1]=ei.y,s[5]=Ir.y,s[9]=Zt.y,s[2]=ei.z,s[6]=Ir.z,s[10]=Zt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,s=t.elements,r=this.elements,a=i[0],o=i[4],l=i[8],c=i[12],h=i[1],d=i[5],u=i[9],f=i[13],g=i[2],S=i[6],p=i[10],m=i[14],x=i[3],M=i[7],b=i[11],A=i[15],E=s[0],I=s[4],y=s[8],w=s[12],F=s[1],R=s[5],O=s[9],G=s[13],X=s[2],N=s[6],z=s[10],V=s[14],j=s[3],Q=s[7],ce=s[11],ye=s[15];return r[0]=a*E+o*F+l*X+c*j,r[4]=a*I+o*R+l*N+c*Q,r[8]=a*y+o*O+l*z+c*ce,r[12]=a*w+o*G+l*V+c*ye,r[1]=h*E+d*F+u*X+f*j,r[5]=h*I+d*R+u*N+f*Q,r[9]=h*y+d*O+u*z+f*ce,r[13]=h*w+d*G+u*V+f*ye,r[2]=g*E+S*F+p*X+m*j,r[6]=g*I+S*R+p*N+m*Q,r[10]=g*y+S*O+p*z+m*ce,r[14]=g*w+S*G+p*V+m*ye,r[3]=x*E+M*F+b*X+A*j,r[7]=x*I+M*R+b*N+A*Q,r[11]=x*y+M*O+b*z+A*ce,r[15]=x*w+M*G+b*V+A*ye,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[4],s=e[8],r=e[12],a=e[1],o=e[5],l=e[9],c=e[13],h=e[2],d=e[6],u=e[10],f=e[14],g=e[3],S=e[7],p=e[11],m=e[15],x=l*f-c*u,M=o*f-c*d,b=o*u-l*d,A=a*f-c*h,E=a*u-l*h,I=a*d-o*h;return t*(S*x-p*M+m*b)-i*(g*x-p*A+m*E)+s*(g*M-S*A+m*I)-r*(g*b-S*E+p*I)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){let s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=i),this}invert(){let e=this.elements,t=e[0],i=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],d=e[9],u=e[10],f=e[11],g=e[12],S=e[13],p=e[14],m=e[15],x=t*o-i*a,M=t*l-s*a,b=t*c-r*a,A=i*l-s*o,E=i*c-r*o,I=s*c-r*l,y=h*S-d*g,w=h*p-u*g,F=h*m-f*g,R=d*p-u*S,O=d*m-f*S,G=u*m-f*p,X=x*G-M*O+b*R+A*F-E*w+I*y;if(X===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let N=1/X;return e[0]=(o*G-l*O+c*R)*N,e[1]=(s*O-i*G-r*R)*N,e[2]=(S*I-p*E+m*A)*N,e[3]=(u*E-d*I-f*A)*N,e[4]=(l*F-a*G-c*w)*N,e[5]=(t*G-s*F+r*w)*N,e[6]=(p*b-g*I-m*M)*N,e[7]=(h*I-u*b+f*M)*N,e[8]=(a*O-o*F+c*y)*N,e[9]=(i*F-t*O-r*y)*N,e[10]=(g*E-S*b+m*x)*N,e[11]=(d*b-h*E-f*x)*N,e[12]=(o*w-a*R-l*y)*N,e[13]=(t*R-i*w+s*y)*N,e[14]=(S*M-g*A-p*x)*N,e[15]=(h*A-d*M+u*x)*N,this}scale(e){let t=this.elements,i=e.x,s=e.y,r=e.z;return t[0]*=i,t[4]*=s,t[8]*=r,t[1]*=i,t[5]*=s,t[9]*=r,t[2]*=i,t[6]*=s,t[10]*=r,t[3]*=i,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,s))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let i=Math.cos(t),s=Math.sin(t),r=1-i,a=e.x,o=e.y,l=e.z,c=r*a,h=r*o;return this.set(c*a+i,c*o-s*l,c*l+s*o,0,c*o+s*l,h*o+i,h*l-s*a,0,c*l-s*o,h*l+s*a,r*l*l+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,s,r,a){return this.set(1,i,r,0,e,1,a,0,t,s,1,0,0,0,0,1),this}compose(e,t,i){let s=this.elements,r=t._x,a=t._y,o=t._z,l=t._w,c=r+r,h=a+a,d=o+o,u=r*c,f=r*h,g=r*d,S=a*h,p=a*d,m=o*d,x=l*c,M=l*h,b=l*d,A=i.x,E=i.y,I=i.z;return s[0]=(1-(S+m))*A,s[1]=(f+b)*A,s[2]=(g-M)*A,s[3]=0,s[4]=(f-b)*E,s[5]=(1-(u+m))*E,s[6]=(p+x)*E,s[7]=0,s[8]=(g+M)*I,s[9]=(p-x)*I,s[10]=(1-(u+S))*I,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,i){let s=this.elements;e.x=s[12],e.y=s[13],e.z=s[14];let r=this.determinant();if(r===0)return i.set(1,1,1),t.identity(),this;let a=Hi.set(s[0],s[1],s[2]).length(),o=Hi.set(s[4],s[5],s[6]).length(),l=Hi.set(s[8],s[9],s[10]).length();r<0&&(a=-a),ln.copy(this);let c=1/a,h=1/o,d=1/l;return ln.elements[0]*=c,ln.elements[1]*=c,ln.elements[2]*=c,ln.elements[4]*=h,ln.elements[5]*=h,ln.elements[6]*=h,ln.elements[8]*=d,ln.elements[9]*=d,ln.elements[10]*=d,t.setFromRotationMatrix(ln),i.x=a,i.y=o,i.z=l,this}makePerspective(e,t,i,s,r,a,o=un,l=!1){let c=this.elements,h=2*r/(t-e),d=2*r/(i-s),u=(t+e)/(t-e),f=(i+s)/(i-s),g,S;if(l)g=r/(a-r),S=a*r/(a-r);else if(o===un)g=-(a+r)/(a-r),S=-2*a*r/(a-r);else if(o===Vs)g=-a/(a-r),S=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=u,c[12]=0,c[1]=0,c[5]=d,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=g,c[14]=S,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,i,s,r,a,o=un,l=!1){let c=this.elements,h=2/(t-e),d=2/(i-s),u=-(t+e)/(t-e),f=-(i+s)/(i-s),g,S;if(l)g=1/(a-r),S=a/(a-r);else if(o===un)g=-2/(a-r),S=-(a+r)/(a-r);else if(o===Vs)g=-1/(a-r),S=-r/(a-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=0,c[12]=u,c[1]=0,c[5]=d,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=g,c[14]=S,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,i=e.elements;for(let s=0;s<16;s++)if(t[s]!==i[s])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}},Hi=new C,ln=new ut,Ad=new C(0,0,0),Cd=new C(1,1,1),ei=new C,Ir=new C,Zt=new C,Kc=new ut,jc=new wn,oi=class n{constructor(e=0,t=0,i=0,s=n.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,s=this._order){return this._x=e,this._y=t,this._z=i,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){let s=e.elements,r=s[0],a=s[4],o=s[8],l=s[1],c=s[5],h=s[9],d=s[2],u=s[6],f=s[10];switch(t){case"XYZ":this._y=Math.asin(Ve(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,f),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(u,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Ve(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-d,r),this._z=0);break;case"ZXY":this._x=Math.asin(Ve(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-d,f),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-Ve(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(u,f),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(Ve(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-d,r)):(this._x=0,this._y=Math.atan2(o,f));break;case"XZY":this._z=Math.asin(-Ve(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(u,c),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-h,f),this._y=0);break;default:Ce("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return Kc.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Kc,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return jc.setFromEuler(this),this.setFromQuaternion(jc,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};oi.DEFAULT_ORDER="XYZ";var ls=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},Rd=0,Qc=new C,Vi=new wn,Nn=new ut,Pr=new C,Cs=new C,Id=new C,Pd=new wn,eh=new C(1,0,0),th=new C(0,1,0),nh=new C(0,0,1),ih={type:"added"},Dd={type:"removed"},Gi={type:"childadded",child:null},tl={type:"childremoved",child:null},Xt=class n extends En{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Rd++}),this.uuid=Hn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=n.DEFAULT_UP.clone();let e=new C,t=new oi,i=new wn,s=new C(1,1,1);function r(){i.setFromEuler(t,!1)}function a(){t.setFromQuaternion(i,void 0,!1)}t._onChange(r),i._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new ut},normalMatrix:{value:new Le}}),this.matrix=new ut,this.matrixWorld=new ut,this.matrixAutoUpdate=n.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=n.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new ls,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Vi.setFromAxisAngle(e,t),this.quaternion.multiply(Vi),this}rotateOnWorldAxis(e,t){return Vi.setFromAxisAngle(e,t),this.quaternion.premultiply(Vi),this}rotateX(e){return this.rotateOnAxis(eh,e)}rotateY(e){return this.rotateOnAxis(th,e)}rotateZ(e){return this.rotateOnAxis(nh,e)}translateOnAxis(e,t){return Qc.copy(e).applyQuaternion(this.quaternion),this.position.add(Qc.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(eh,e)}translateY(e){return this.translateOnAxis(th,e)}translateZ(e){return this.translateOnAxis(nh,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Nn.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?Pr.copy(e):Pr.set(e,t,i);let s=this.parent;this.updateWorldMatrix(!0,!1),Cs.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Nn.lookAt(Cs,Pr,this.up):Nn.lookAt(Pr,Cs,this.up),this.quaternion.setFromRotationMatrix(Nn),s&&(Nn.extractRotation(s.matrixWorld),Vi.setFromRotationMatrix(Nn),this.quaternion.premultiply(Vi.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(Re("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(ih),Gi.child=e,this.dispatchEvent(Gi),Gi.child=null):Re("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Dd),tl.child=e,this.dispatchEvent(tl),tl.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Nn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Nn.multiply(e.parent.matrixWorld)),e.applyMatrix4(Nn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(ih),Gi.child=e,this.dispatchEvent(Gi),Gi.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,s=this.children.length;i<s;i++){let a=this.children[i].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Cs,e,Id),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Cs,Pd,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,i=e.y,s=e.z,r=this.matrix.elements;r[12]+=t-r[0]*t-r[4]*i-r[8]*s,r[13]+=i-r[1]*t-r[5]*i-r[9]*s,r[14]+=s-r[2]*t-r[6]*i-r[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t){let i=this.parent;if(e===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(e){let t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),this.static!==!1&&(s.static=this.static),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(o=>({...o})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(e),s.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let d=l[c];r(e.shapes,d)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(r(e.materials,this.material[l]));s.material=o}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];s.animations.push(r(e.animations,l))}}if(t){let o=a(e.geometries),l=a(e.materials),c=a(e.textures),h=a(e.images),d=a(e.shapes),u=a(e.skeletons),f=a(e.animations),g=a(e.nodes);o.length>0&&(i.geometries=o),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),h.length>0&&(i.images=h),d.length>0&&(i.shapes=d),u.length>0&&(i.skeletons=u),f.length>0&&(i.animations=f),g.length>0&&(i.nodes=g)}return i.object=s,i;function a(o){let l=[];for(let c in o){let h=o[c];delete h.metadata,l.push(h)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){let s=e.children[i];this.add(s.clone())}return this}};Xt.DEFAULT_UP=new C(0,1,0);Xt.DEFAULT_MATRIX_AUTO_UPDATE=!0;Xt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var dn=class extends Xt{constructor(){super(),this.isGroup=!0,this.type="Group"}},Ld={type:"move"},cs=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new dn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new dn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new C,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new C),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new dn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new C,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new C,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let s=null,r=null,a=null,o=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){a=!0;for(let S of e.hand.values()){let p=t.getJointPose(S,i),m=this._getHandJoint(c,S);p!==null&&(m.matrix.fromArray(p.transform.matrix),m.matrix.decompose(m.position,m.rotation,m.scale),m.matrixWorldNeedsUpdate=!0,m.jointRadius=p.radius),m.visible=p!==null}let h=c.joints["index-finger-tip"],d=c.joints["thumb-tip"],u=h.position.distanceTo(d.position),f=.02,g=.005;c.inputState.pinching&&u>f+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&u<=f-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,i),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:e,target:this})));o!==null&&(s=t.getPose(e.targetRaySpace,i),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Ld)))}return o!==null&&(o.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let i=new dn;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}},lu={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},ti={h:0,s:0,l:0},Dr={h:0,s:0,l:0};function nl(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}var Ze=class{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){let s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=qe){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Xe.colorSpaceToWorking(this,t),this}setRGB(e,t,i,s=Xe.workingColorSpace){return this.r=e,this.g=t,this.b=i,Xe.colorSpaceToWorking(this,s),this}setHSL(e,t,i,s=Xe.workingColorSpace){if(e=bd(e,1),t=Ve(t,0,1),i=Ve(i,0,1),t===0)this.r=this.g=this.b=i;else{let r=i<=.5?i*(1+t):i+t-i*t,a=2*i-r;this.r=nl(a,r,e+1/3),this.g=nl(a,r,e),this.b=nl(a,r,e-1/3)}return Xe.colorSpaceToWorking(this,s),this}setStyle(e,t=qe){function i(r){r!==void 0&&parseFloat(r)<1&&Ce("Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:Ce("Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(r,16),t);Ce("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=qe){let i=lu[e.toLowerCase()];return i!==void 0?this.setHex(i,t):Ce("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Vn(e.r),this.g=Vn(e.g),this.b=Vn(e.b),this}copyLinearToSRGB(e){return this.r=is(e.r),this.g=is(e.g),this.b=is(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=qe){return Xe.workingToColorSpace(Ut.copy(this),e),Math.round(Ve(Ut.r*255,0,255))*65536+Math.round(Ve(Ut.g*255,0,255))*256+Math.round(Ve(Ut.b*255,0,255))}getHexString(e=qe){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Xe.workingColorSpace){Xe.workingToColorSpace(Ut.copy(this),t);let i=Ut.r,s=Ut.g,r=Ut.b,a=Math.max(i,s,r),o=Math.min(i,s,r),l,c,h=(o+a)/2;if(o===a)l=0,c=0;else{let d=a-o;switch(c=h<=.5?d/(a+o):d/(2-a-o),a){case i:l=(s-r)/d+(s<r?6:0);break;case s:l=(r-i)/d+2;break;case r:l=(i-s)/d+4;break}l/=6}return e.h=l,e.s=c,e.l=h,e}getRGB(e,t=Xe.workingColorSpace){return Xe.workingToColorSpace(Ut.copy(this),t),e.r=Ut.r,e.g=Ut.g,e.b=Ut.b,e}getStyle(e=qe){Xe.workingToColorSpace(Ut.copy(this),e);let t=Ut.r,i=Ut.g,s=Ut.b;return e!==qe?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(s*255)})`}offsetHSL(e,t,i){return this.getHSL(ti),this.setHSL(ti.h+e,ti.s+t,ti.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(ti),e.getHSL(Dr);let i=Jo(ti.h,Dr.h,t),s=Jo(ti.s,Dr.s,t),r=Jo(ti.l,Dr.l,t);return this.setHSL(i,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,i=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*i+r[6]*s,this.g=r[1]*t+r[4]*i+r[7]*s,this.b=r[2]*t+r[5]*i+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Ut=new Ze;Ze.NAMES=lu;var hs=class extends Xt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new oi,this.environmentIntensity=1,this.environmentRotation=new oi,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}},cn=new C,Un=new C,il=new C,On=new C,Wi=new C,Xi=new C,sh=new C,sl=new C,rl=new C,al=new C,ol=new xt,ll=new xt,cl=new xt,zn=class n{constructor(e=new C,t=new C,i=new C){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,s){s.subVectors(i,t),cn.subVectors(e,t),s.cross(cn);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,i,s,r){cn.subVectors(s,t),Un.subVectors(i,t),il.subVectors(e,t);let a=cn.dot(cn),o=cn.dot(Un),l=cn.dot(il),c=Un.dot(Un),h=Un.dot(il),d=a*c-o*o;if(d===0)return r.set(0,0,0),null;let u=1/d,f=(c*l-o*h)*u,g=(a*h-o*l)*u;return r.set(1-f-g,g,f)}static containsPoint(e,t,i,s){return this.getBarycoord(e,t,i,s,On)===null?!1:On.x>=0&&On.y>=0&&On.x+On.y<=1}static getInterpolation(e,t,i,s,r,a,o,l){return this.getBarycoord(e,t,i,s,On)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,On.x),l.addScaledVector(a,On.y),l.addScaledVector(o,On.z),l)}static getInterpolatedAttribute(e,t,i,s,r,a){return ol.setScalar(0),ll.setScalar(0),cl.setScalar(0),ol.fromBufferAttribute(e,t),ll.fromBufferAttribute(e,i),cl.fromBufferAttribute(e,s),a.setScalar(0),a.addScaledVector(ol,r.x),a.addScaledVector(ll,r.y),a.addScaledVector(cl,r.z),a}static isFrontFacing(e,t,i,s){return cn.subVectors(i,t),Un.subVectors(e,t),cn.cross(Un).dot(s)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,s){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,i,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return cn.subVectors(this.c,this.b),Un.subVectors(this.a,this.b),cn.cross(Un).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return n.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return n.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,s,r){return n.getInterpolation(e,this.a,this.b,this.c,t,i,s,r)}containsPoint(e){return n.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return n.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let i=this.a,s=this.b,r=this.c,a,o;Wi.subVectors(s,i),Xi.subVectors(r,i),sl.subVectors(e,i);let l=Wi.dot(sl),c=Xi.dot(sl);if(l<=0&&c<=0)return t.copy(i);rl.subVectors(e,s);let h=Wi.dot(rl),d=Xi.dot(rl);if(h>=0&&d<=h)return t.copy(s);let u=l*d-h*c;if(u<=0&&l>=0&&h<=0)return a=l/(l-h),t.copy(i).addScaledVector(Wi,a);al.subVectors(e,r);let f=Wi.dot(al),g=Xi.dot(al);if(g>=0&&f<=g)return t.copy(r);let S=f*c-l*g;if(S<=0&&c>=0&&g<=0)return o=c/(c-g),t.copy(i).addScaledVector(Xi,o);let p=h*g-f*d;if(p<=0&&d-h>=0&&f-g>=0)return sh.subVectors(r,s),o=(d-h)/(d-h+(f-g)),t.copy(s).addScaledVector(sh,o);let m=1/(p+S+u);return a=S*m,o=u*m,t.copy(i).addScaledVector(Wi,a).addScaledVector(Xi,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},li=class{constructor(e=new C(1/0,1/0,1/0),t=new C(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(hn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(hn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let i=hn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let i=e.geometry;if(i!==void 0){let r=i.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,hn):hn.fromBufferAttribute(r,a),hn.applyMatrix4(e.matrixWorld),this.expandByPoint(hn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Lr.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),Lr.copy(i.boundingBox)),Lr.applyMatrix4(e.matrixWorld),this.union(Lr)}let s=e.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,hn),hn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Rs),Fr.subVectors(this.max,Rs),qi.subVectors(e.a,Rs),Yi.subVectors(e.b,Rs),$i.subVectors(e.c,Rs),ni.subVectors(Yi,qi),ii.subVectors($i,Yi),bi.subVectors(qi,$i);let t=[0,-ni.z,ni.y,0,-ii.z,ii.y,0,-bi.z,bi.y,ni.z,0,-ni.x,ii.z,0,-ii.x,bi.z,0,-bi.x,-ni.y,ni.x,0,-ii.y,ii.x,0,-bi.y,bi.x,0];return!hl(t,qi,Yi,$i,Fr)||(t=[1,0,0,0,1,0,0,0,1],!hl(t,qi,Yi,$i,Fr))?!1:(Nr.crossVectors(ni,ii),t=[Nr.x,Nr.y,Nr.z],hl(t,qi,Yi,$i,Fr))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,hn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(hn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Bn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Bn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Bn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Bn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Bn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Bn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Bn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Bn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Bn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},Bn=[new C,new C,new C,new C,new C,new C,new C,new C],hn=new C,Lr=new li,qi=new C,Yi=new C,$i=new C,ni=new C,ii=new C,bi=new C,Rs=new C,Fr=new C,Nr=new C,Ti=new C;function hl(n,e,t,i,s){for(let r=0,a=n.length-3;r<=a;r+=3){Ti.fromArray(n,r);let o=s.x*Math.abs(Ti.x)+s.y*Math.abs(Ti.y)+s.z*Math.abs(Ti.z),l=e.dot(Ti),c=t.dot(Ti),h=i.dot(Ti);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}var bt=new C,Ur=new ge,Fd=0,Wt=class extends En{constructor(e,t,i=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Fd++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=_a,this.updateRanges=[],this.gpuType=gn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[i+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)Ur.fromBufferAttribute(this,t),Ur.applyMatrix3(e),this.setXY(t,Ur.x,Ur.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)bt.fromBufferAttribute(this,t),bt.applyMatrix3(e),this.setXYZ(t,bt.x,bt.y,bt.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)bt.fromBufferAttribute(this,t),bt.applyMatrix4(e),this.setXYZ(t,bt.x,bt.y,bt.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)bt.fromBufferAttribute(this,t),bt.applyNormalMatrix(e),this.setXYZ(t,bt.x,bt.y,bt.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)bt.fromBufferAttribute(this,t),bt.transformDirection(e),this.setXYZ(t,bt.x,bt.y,bt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=bn(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=nt(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=bn(t,this.array)),t}setX(e,t){return this.normalized&&(t=nt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=bn(t,this.array)),t}setY(e,t){return this.normalized&&(t=nt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=bn(t,this.array)),t}setZ(e,t){return this.normalized&&(t=nt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=bn(t,this.array)),t}setW(e,t){return this.normalized&&(t=nt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=nt(t,this.array),i=nt(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,s){return e*=this.itemSize,this.normalized&&(t=nt(t,this.array),i=nt(i,this.array),s=nt(s,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=s,this}setXYZW(e,t,i,s,r){return e*=this.itemSize,this.normalized&&(t=nt(t,this.array),i=nt(i,this.array),s=nt(s,this.array),r=nt(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==_a&&(e.usage=this.usage),e}dispose(){this.dispatchEvent({type:"dispose"})}};var Xs=class extends Wt{constructor(e,t,i){super(new Uint16Array(e),t,i)}};var qs=class extends Wt{constructor(e,t,i){super(new Uint32Array(e),t,i)}};var mt=class extends Wt{constructor(e,t,i){super(new Float32Array(e),t,i)}},Nd=new li,Is=new C,ul=new C,Ii=class{constructor(e=new C,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let i=this.center;t!==void 0?i.copy(t):Nd.setFromPoints(e).getCenter(i);let s=0;for(let r=0,a=e.length;r<a;r++)s=Math.max(s,i.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Is.subVectors(e,this.center);let t=Is.lengthSq();if(t>this.radius*this.radius){let i=Math.sqrt(t),s=(i-this.radius)*.5;this.center.addScaledVector(Is,s/i),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(ul.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Is.copy(e.center).add(ul)),this.expandByPoint(Is.copy(e.center).sub(ul))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},Ud=0,an=new ut,dl=new Xt,Zi=new C,Jt=new li,Ps=new li,Ct=new C,ot=class n extends En{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Ud++}),this.uuid=Hn(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Sd(e)?qs:Xs)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let r=new Le().getNormalMatrix(e);i.applyNormalMatrix(r),i.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return an.makeRotationFromQuaternion(e),this.applyMatrix4(an),this}rotateX(e){return an.makeRotationX(e),this.applyMatrix4(an),this}rotateY(e){return an.makeRotationY(e),this.applyMatrix4(an),this}rotateZ(e){return an.makeRotationZ(e),this.applyMatrix4(an),this}translate(e,t,i){return an.makeTranslation(e,t,i),this.applyMatrix4(an),this}scale(e,t,i){return an.makeScale(e,t,i),this.applyMatrix4(an),this}lookAt(e){return dl.lookAt(e),dl.updateMatrix(),this.applyMatrix4(dl.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Zi).negate(),this.translate(Zi.x,Zi.y,Zi.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let i=[];for(let s=0,r=e.length;s<r;s++){let a=e[s];i.push(a.x,a.y,a.z||0)}this.setAttribute("position",new mt(i,3))}else{let i=Math.min(e.length,t.count);for(let s=0;s<i;s++){let r=e[s];t.setXYZ(s,r.x,r.y,r.z||0)}e.length>t.count&&Ce("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new li);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Re("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new C(-1/0,-1/0,-1/0),new C(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,s=t.length;i<s;i++){let r=t[i];Jt.setFromBufferAttribute(r),this.morphTargetsRelative?(Ct.addVectors(this.boundingBox.min,Jt.min),this.boundingBox.expandByPoint(Ct),Ct.addVectors(this.boundingBox.max,Jt.max),this.boundingBox.expandByPoint(Ct)):(this.boundingBox.expandByPoint(Jt.min),this.boundingBox.expandByPoint(Jt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Re('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Ii);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Re("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new C,1/0);return}if(e){let i=this.boundingSphere.center;if(Jt.setFromBufferAttribute(e),t)for(let r=0,a=t.length;r<a;r++){let o=t[r];Ps.setFromBufferAttribute(o),this.morphTargetsRelative?(Ct.addVectors(Jt.min,Ps.min),Jt.expandByPoint(Ct),Ct.addVectors(Jt.max,Ps.max),Jt.expandByPoint(Ct)):(Jt.expandByPoint(Ps.min),Jt.expandByPoint(Ps.max))}Jt.getCenter(i);let s=0;for(let r=0,a=e.count;r<a;r++)Ct.fromBufferAttribute(e,r),s=Math.max(s,i.distanceToSquared(Ct));if(t)for(let r=0,a=t.length;r<a;r++){let o=t[r],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)Ct.fromBufferAttribute(o,c),l&&(Zi.fromBufferAttribute(e,c),Ct.add(Zi)),s=Math.max(s,i.distanceToSquared(Ct))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&Re('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){Re("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=t.position,s=t.normal,r=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Wt(new Float32Array(4*i.count),4));let a=this.getAttribute("tangent"),o=[],l=[];for(let y=0;y<i.count;y++)o[y]=new C,l[y]=new C;let c=new C,h=new C,d=new C,u=new ge,f=new ge,g=new ge,S=new C,p=new C;function m(y,w,F){c.fromBufferAttribute(i,y),h.fromBufferAttribute(i,w),d.fromBufferAttribute(i,F),u.fromBufferAttribute(r,y),f.fromBufferAttribute(r,w),g.fromBufferAttribute(r,F),h.sub(c),d.sub(c),f.sub(u),g.sub(u);let R=1/(f.x*g.y-g.x*f.y);isFinite(R)&&(S.copy(h).multiplyScalar(g.y).addScaledVector(d,-f.y).multiplyScalar(R),p.copy(d).multiplyScalar(f.x).addScaledVector(h,-g.x).multiplyScalar(R),o[y].add(S),o[w].add(S),o[F].add(S),l[y].add(p),l[w].add(p),l[F].add(p))}let x=this.groups;x.length===0&&(x=[{start:0,count:e.count}]);for(let y=0,w=x.length;y<w;++y){let F=x[y],R=F.start,O=F.count;for(let G=R,X=R+O;G<X;G+=3)m(e.getX(G+0),e.getX(G+1),e.getX(G+2))}let M=new C,b=new C,A=new C,E=new C;function I(y){A.fromBufferAttribute(s,y),E.copy(A);let w=o[y];M.copy(w),M.sub(A.multiplyScalar(A.dot(w))).normalize(),b.crossVectors(E,w);let R=b.dot(l[y])<0?-1:1;a.setXYZW(y,M.x,M.y,M.z,R)}for(let y=0,w=x.length;y<w;++y){let F=x[y],R=F.start,O=F.count;for(let G=R,X=R+O;G<X;G+=3)I(e.getX(G+0)),I(e.getX(G+1)),I(e.getX(G+2))}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new Wt(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let u=0,f=i.count;u<f;u++)i.setXYZ(u,0,0,0);let s=new C,r=new C,a=new C,o=new C,l=new C,c=new C,h=new C,d=new C;if(e)for(let u=0,f=e.count;u<f;u+=3){let g=e.getX(u+0),S=e.getX(u+1),p=e.getX(u+2);s.fromBufferAttribute(t,g),r.fromBufferAttribute(t,S),a.fromBufferAttribute(t,p),h.subVectors(a,r),d.subVectors(s,r),h.cross(d),o.fromBufferAttribute(i,g),l.fromBufferAttribute(i,S),c.fromBufferAttribute(i,p),o.add(h),l.add(h),c.add(h),i.setXYZ(g,o.x,o.y,o.z),i.setXYZ(S,l.x,l.y,l.z),i.setXYZ(p,c.x,c.y,c.z)}else for(let u=0,f=t.count;u<f;u+=3)s.fromBufferAttribute(t,u+0),r.fromBufferAttribute(t,u+1),a.fromBufferAttribute(t,u+2),h.subVectors(a,r),d.subVectors(s,r),h.cross(d),i.setXYZ(u+0,h.x,h.y,h.z),i.setXYZ(u+1,h.x,h.y,h.z),i.setXYZ(u+2,h.x,h.y,h.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)Ct.fromBufferAttribute(e,t),Ct.normalize(),e.setXYZ(t,Ct.x,Ct.y,Ct.z)}toNonIndexed(){function e(o,l){let c=o.array,h=o.itemSize,d=o.normalized,u=new c.constructor(l.length*h),f=0,g=0;for(let S=0,p=l.length;S<p;S++){o.isInterleavedBufferAttribute?f=l[S]*o.data.stride+o.offset:f=l[S]*h;for(let m=0;m<h;m++)u[g++]=c[f++]}return new Wt(u,h,d)}if(this.index===null)return Ce("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new n,i=this.index.array,s=this.attributes;for(let o in s){let l=s[o],c=e(l,i);t.setAttribute(o,c)}let r=this.morphAttributes;for(let o in r){let l=[],c=r[o];for(let h=0,d=c.length;h<d;h++){let u=c[h],f=e(u,i);l.push(f)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,l=a.length;o<l;o++){let c=a[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let i=this.attributes;for(let l in i){let c=i[l];e.data.attributes[l]=c.toJSON(e.data)}let s={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let d=0,u=c.length;d<u;d++){let f=c[d];h.push(f.toJSON(e.data))}h.length>0&&(s[l]=h,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let i=e.index;i!==null&&this.setIndex(i.clone());let s=e.attributes;for(let c in s){let h=s[c];this.setAttribute(c,h.clone(t))}let r=e.morphAttributes;for(let c in r){let h=[],d=r[c];for(let u=0,f=d.length;u<f;u++)h.push(d[u].clone(t));this.morphAttributes[c]=h}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let c=0,h=a.length;c<h;c++){let d=a[c];this.addGroup(d.start,d.count,d.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},ba=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=_a,this.updateRanges=[],this.version=0,this.uuid=Hn()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,i){e*=this.stride,i*=t.stride;for(let s=0,r=this.stride;s<r;s++)this.array[e+s]=t.array[i+s];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Hn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),i=new this.constructor(t,this.stride);return i.setUsage(this.usage),i}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){return e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Hn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}},zt=new C,Ys=class n{constructor(e,t,i,s=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=i,this.normalized=s}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,i=this.data.count;t<i;t++)zt.fromBufferAttribute(this,t),zt.applyMatrix4(e),this.setXYZ(t,zt.x,zt.y,zt.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)zt.fromBufferAttribute(this,t),zt.applyNormalMatrix(e),this.setXYZ(t,zt.x,zt.y,zt.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)zt.fromBufferAttribute(this,t),zt.transformDirection(e),this.setXYZ(t,zt.x,zt.y,zt.z);return this}getComponent(e,t){let i=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(i=bn(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=nt(i,this.array)),this.data.array[e*this.data.stride+this.offset+t]=i,this}setX(e,t){return this.normalized&&(t=nt(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=nt(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=nt(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=nt(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=bn(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=bn(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=bn(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=bn(t,this.array)),t}setXY(e,t,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=nt(t,this.array),i=nt(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this}setXYZ(e,t,i,s){return e=e*this.data.stride+this.offset,this.normalized&&(t=nt(t,this.array),i=nt(i,this.array),s=nt(s,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this.data.array[e+2]=s,this}setXYZW(e,t,i,s,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=nt(t,this.array),i=nt(i,this.array),s=nt(s,this.array),r=nt(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this.data.array[e+2]=s,this.data.array[e+3]=r,this}clone(e){if(e===void 0){Gs("InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let i=0;i<this.count;i++){let s=i*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[s+r])}return new Wt(new this.array.constructor(t),this.itemSize,this.normalized)}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new n(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){Gs("InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let i=0;i<this.count;i++){let s=i*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[s+r])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}},Od=0,Wn=class extends En{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Od++}),this.uuid=Hn(),this.name="",this.type="Material",this.blending=Ci,this.side=Gn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=ra,this.blendDst=aa,this.blendEquation=ai,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ze(0,0,0),this.blendAlpha=0,this.depthFunc=Ri,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Al,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ai,this.stencilZFail=Ai,this.stencilZPass=Ai,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let i=e[t];if(i===void 0){Ce(`Material: parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){Ce(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(i):s&&s.isVector3&&i&&i.isVector3?s.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==Ci&&(i.blending=this.blending),this.side!==Gn&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==ra&&(i.blendSrc=this.blendSrc),this.blendDst!==aa&&(i.blendDst=this.blendDst),this.blendEquation!==ai&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==Ri&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Al&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Ai&&(i.stencilFail=this.stencilFail),this.stencilZFail!==Ai&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==Ai&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.allowOverride===!1&&(i.allowOverride=!1),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function s(r){let a=[];for(let o in r){let l=r[o];delete l.metadata,a.push(l)}return a}if(t){let r=s(e.textures),a=s(e.images);r.length>0&&(i.textures=r),a.length>0&&(i.images=a)}return i}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,i=null;if(t!==null){let s=t.length;i=new Array(s);for(let r=0;r!==s;++r)i[r]=t[r].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}},Pt=class extends Wn{constructor(e){super(),this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new Ze(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.rotation=e.rotation,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},Ji,Ds=new C,Ki=new C,ji=new C,Qi=new ge,Ls=new ge,cu=new ut,Or=new C,Fs=new C,Br=new C,rh=new ge,fl=new ge,ah=new ge,Lt=class extends Xt{constructor(e=new Pt){if(super(),this.isSprite=!0,this.type="Sprite",Ji===void 0){Ji=new ot;let t=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),i=new ba(t,5);Ji.setIndex([0,1,2,0,2,3]),Ji.setAttribute("position",new Ys(i,3,0,!1)),Ji.setAttribute("uv",new Ys(i,2,3,!1))}this.geometry=Ji,this.material=e,this.center=new ge(.5,.5),this.count=1}raycast(e,t){e.camera===null&&Re('Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),Ki.setFromMatrixScale(this.matrixWorld),cu.copy(e.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(e.camera.matrixWorldInverse,this.matrixWorld),ji.setFromMatrixPosition(this.modelViewMatrix),e.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&Ki.multiplyScalar(-ji.z);let i=this.material.rotation,s,r;i!==0&&(r=Math.cos(i),s=Math.sin(i));let a=this.center;kr(Or.set(-.5,-.5,0),ji,a,Ki,s,r),kr(Fs.set(.5,-.5,0),ji,a,Ki,s,r),kr(Br.set(.5,.5,0),ji,a,Ki,s,r),rh.set(0,0),fl.set(1,0),ah.set(1,1);let o=e.ray.intersectTriangle(Or,Fs,Br,!1,Ds);if(o===null&&(kr(Fs.set(-.5,.5,0),ji,a,Ki,s,r),fl.set(0,1),o=e.ray.intersectTriangle(Or,Br,Fs,!1,Ds),o===null))return;let l=e.ray.origin.distanceTo(Ds);l<e.near||l>e.far||t.push({distance:l,point:Ds.clone(),uv:zn.getInterpolation(Ds,Or,Fs,Br,rh,fl,ah,new ge),face:null,object:this})}copy(e,t){return super.copy(e,t),e.center!==void 0&&this.center.copy(e.center),this.material=e.material,this}};function kr(n,e,t,i,s,r){Qi.subVectors(n,t).addScalar(.5).multiply(i),s!==void 0?(Ls.x=r*Qi.x-s*Qi.y,Ls.y=s*Qi.x+r*Qi.y):Ls.copy(Qi),n.copy(e),n.x+=Ls.x,n.y+=Ls.y,n.applyMatrix4(cu)}var kn=new C,pl=new C,zr=new C,si=new C,ml=new C,Hr=new C,gl=new C,us=class{constructor(e=new C,t=new C(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,kn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=kn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(kn.copy(this.origin).addScaledVector(this.direction,t),kn.distanceToSquared(e))}distanceSqToSegment(e,t,i,s){pl.copy(e).add(t).multiplyScalar(.5),zr.copy(t).sub(e).normalize(),si.copy(this.origin).sub(pl);let r=e.distanceTo(t)*.5,a=-this.direction.dot(zr),o=si.dot(this.direction),l=-si.dot(zr),c=si.lengthSq(),h=Math.abs(1-a*a),d,u,f,g;if(h>0)if(d=a*l-o,u=a*o-l,g=r*h,d>=0)if(u>=-g)if(u<=g){let S=1/h;d*=S,u*=S,f=d*(d+a*u+2*o)+u*(a*d+u+2*l)+c}else u=r,d=Math.max(0,-(a*u+o)),f=-d*d+u*(u+2*l)+c;else u=-r,d=Math.max(0,-(a*u+o)),f=-d*d+u*(u+2*l)+c;else u<=-g?(d=Math.max(0,-(-a*r+o)),u=d>0?-r:Math.min(Math.max(-r,-l),r),f=-d*d+u*(u+2*l)+c):u<=g?(d=0,u=Math.min(Math.max(-r,-l),r),f=u*(u+2*l)+c):(d=Math.max(0,-(a*r+o)),u=d>0?r:Math.min(Math.max(-r,-l),r),f=-d*d+u*(u+2*l)+c);else u=a>0?-r:r,d=Math.max(0,-(a*u+o)),f=-d*d+u*(u+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,d),s&&s.copy(pl).addScaledVector(zr,u),f}intersectSphere(e,t){kn.subVectors(e.center,this.origin);let i=kn.dot(this.direction),s=kn.dot(kn)-i*i,r=e.radius*e.radius;if(s>r)return null;let a=Math.sqrt(r-s),o=i-a,l=i+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){let i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,s,r,a,o,l,c=1/this.direction.x,h=1/this.direction.y,d=1/this.direction.z,u=this.origin;return c>=0?(i=(e.min.x-u.x)*c,s=(e.max.x-u.x)*c):(i=(e.max.x-u.x)*c,s=(e.min.x-u.x)*c),h>=0?(r=(e.min.y-u.y)*h,a=(e.max.y-u.y)*h):(r=(e.max.y-u.y)*h,a=(e.min.y-u.y)*h),i>a||r>s||((r>i||isNaN(i))&&(i=r),(a<s||isNaN(s))&&(s=a),d>=0?(o=(e.min.z-u.z)*d,l=(e.max.z-u.z)*d):(o=(e.max.z-u.z)*d,l=(e.min.z-u.z)*d),i>l||o>s)||((o>i||i!==i)&&(i=o),(l<s||s!==s)&&(s=l),s<0)?null:this.at(i>=0?i:s,t)}intersectsBox(e){return this.intersectBox(e,kn)!==null}intersectTriangle(e,t,i,s,r){ml.subVectors(t,e),Hr.subVectors(i,e),gl.crossVectors(ml,Hr);let a=this.direction.dot(gl),o;if(a>0){if(s)return null;o=1}else if(a<0)o=-1,a=-a;else return null;si.subVectors(this.origin,e);let l=o*this.direction.dot(Hr.crossVectors(si,Hr));if(l<0)return null;let c=o*this.direction.dot(ml.cross(si));if(c<0||l+c>a)return null;let h=-o*si.dot(gl);return h<0?null:this.at(h/a,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Dt=class extends Wn{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Ze(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new oi,this.combine=kl,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},oh=new ut,Ei=new us,Vr=new Ii,lh=new C,Gr=new C,Wr=new C,Xr=new C,_l=new C,qr=new C,ch=new C,Yr=new C,ht=class extends Xt{constructor(e=new ot,t=new Dt){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let s=t[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(e,t){let i=this.geometry,s=i.attributes.position,r=i.morphAttributes.position,a=i.morphTargetsRelative;t.fromBufferAttribute(s,e);let o=this.morphTargetInfluences;if(r&&o){qr.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let h=o[l],d=r[l];h!==0&&(_l.fromBufferAttribute(d,e),a?qr.addScaledVector(_l,h):qr.addScaledVector(_l.sub(t),h))}t.add(qr)}return t}raycast(e,t){let i=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Vr.copy(i.boundingSphere),Vr.applyMatrix4(r),Ei.copy(e.ray).recast(e.near),!(Vr.containsPoint(Ei.origin)===!1&&(Ei.intersectSphere(Vr,lh)===null||Ei.origin.distanceToSquared(lh)>(e.far-e.near)**2))&&(oh.copy(r).invert(),Ei.copy(e.ray).applyMatrix4(oh),!(i.boundingBox!==null&&Ei.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,Ei)))}_computeIntersections(e,t,i){let s,r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,d=r.attributes.normal,u=r.groups,f=r.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,S=u.length;g<S;g++){let p=u[g],m=a[p.materialIndex],x=Math.max(p.start,f.start),M=Math.min(o.count,Math.min(p.start+p.count,f.start+f.count));for(let b=x,A=M;b<A;b+=3){let E=o.getX(b),I=o.getX(b+1),y=o.getX(b+2);s=$r(this,m,e,i,c,h,d,E,I,y),s&&(s.faceIndex=Math.floor(b/3),s.face.materialIndex=p.materialIndex,t.push(s))}}else{let g=Math.max(0,f.start),S=Math.min(o.count,f.start+f.count);for(let p=g,m=S;p<m;p+=3){let x=o.getX(p),M=o.getX(p+1),b=o.getX(p+2);s=$r(this,a,e,i,c,h,d,x,M,b),s&&(s.faceIndex=Math.floor(p/3),t.push(s))}}else if(l!==void 0)if(Array.isArray(a))for(let g=0,S=u.length;g<S;g++){let p=u[g],m=a[p.materialIndex],x=Math.max(p.start,f.start),M=Math.min(l.count,Math.min(p.start+p.count,f.start+f.count));for(let b=x,A=M;b<A;b+=3){let E=b,I=b+1,y=b+2;s=$r(this,m,e,i,c,h,d,E,I,y),s&&(s.faceIndex=Math.floor(b/3),s.face.materialIndex=p.materialIndex,t.push(s))}}else{let g=Math.max(0,f.start),S=Math.min(l.count,f.start+f.count);for(let p=g,m=S;p<m;p+=3){let x=p,M=p+1,b=p+2;s=$r(this,a,e,i,c,h,d,x,M,b),s&&(s.faceIndex=Math.floor(p/3),t.push(s))}}}};function Bd(n,e,t,i,s,r,a,o){let l;if(e.side===Ht?l=i.intersectTriangle(a,r,s,!0,o):l=i.intersectTriangle(s,r,a,e.side===Gn,o),l===null)return null;Yr.copy(o),Yr.applyMatrix4(n.matrixWorld);let c=t.ray.origin.distanceTo(Yr);return c<t.near||c>t.far?null:{distance:c,point:Yr.clone(),object:n}}function $r(n,e,t,i,s,r,a,o,l,c){n.getVertexPosition(o,Gr),n.getVertexPosition(l,Wr),n.getVertexPosition(c,Xr);let h=Bd(n,e,t,i,Gr,Wr,Xr,ch);if(h){let d=new C;zn.getBarycoord(ch,Gr,Wr,Xr,d),s&&(h.uv=zn.getInterpolatedAttribute(s,o,l,c,d,new ge)),r&&(h.uv1=zn.getInterpolatedAttribute(r,o,l,c,d,new ge)),a&&(h.normal=zn.getInterpolatedAttribute(a,o,l,c,d,new C),h.normal.dot(i.direction)>0&&h.normal.multiplyScalar(-1));let u={a:o,b:l,c,normal:new C,materialIndex:0};zn.getNormal(Gr,Wr,Xr,u.normal),h.face=u,h.barycoord=d}return h}var Ta=class extends It{constructor(e=null,t=1,i=1,s,r,a,o,l,c=Rt,h=Rt,d,u){super(null,a,o,l,c,h,s,r,d,u),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var xl=new C,kd=new C,zd=new Le,Mn=class{constructor(e=new C(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,s){return this.normal.set(e,t,i),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){let s=xl.subVectors(i,t).cross(kd.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,i=!0){let s=e.delta(xl),r=this.normal.dot(s);if(r===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let a=-(e.start.dot(this.normal)+this.constant)/r;return i===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(s,a)}intersectsLine(e){let t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let i=t||zd.getNormalMatrix(e),s=this.coplanarPoint(xl).applyMatrix4(e),r=this.normal.applyMatrix3(i).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},wi=new Ii,Hd=new ge(.5,.5),Zr=new C,$s=class{constructor(e=new Mn,t=new Mn,i=new Mn,s=new Mn,r=new Mn,a=new Mn){this.planes=[e,t,i,s,r,a]}set(e,t,i,s,r,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(i),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(e){let t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=un,i=!1){let s=this.planes,r=e.elements,a=r[0],o=r[1],l=r[2],c=r[3],h=r[4],d=r[5],u=r[6],f=r[7],g=r[8],S=r[9],p=r[10],m=r[11],x=r[12],M=r[13],b=r[14],A=r[15];if(s[0].setComponents(c-a,f-h,m-g,A-x).normalize(),s[1].setComponents(c+a,f+h,m+g,A+x).normalize(),s[2].setComponents(c+o,f+d,m+S,A+M).normalize(),s[3].setComponents(c-o,f-d,m-S,A-M).normalize(),i)s[4].setComponents(l,u,p,b).normalize(),s[5].setComponents(c-l,f-u,m-p,A-b).normalize();else if(s[4].setComponents(c-l,f-u,m-p,A-b).normalize(),t===un)s[5].setComponents(c+l,f+u,m+p,A+b).normalize();else if(t===Vs)s[5].setComponents(l,u,p,b).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),wi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),wi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(wi)}intersectsSprite(e){wi.center.set(0,0,0);let t=Hd.distanceTo(e.center);return wi.radius=.7071067811865476+t,wi.applyMatrix4(e.matrixWorld),this.intersectsSphere(wi)}intersectsSphere(e){let t=this.planes,i=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(i)<s)return!1;return!0}intersectsBox(e){let t=this.planes;for(let i=0;i<6;i++){let s=t[i];if(Zr.x=s.normal.x>0?e.max.x:e.min.x,Zr.y=s.normal.y>0?e.max.y:e.min.y,Zr.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(Zr)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var Ot=class extends Wn{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Ze(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},Ea=new C,wa=new C,hh=new ut,Ns=new us,Jr=new Ii,yl=new C,uh=new C,An=class extends Xt{constructor(e=new ot,t=new Ot){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[0];for(let s=1,r=t.count;s<r;s++)Ea.fromBufferAttribute(t,s-1),wa.fromBufferAttribute(t,s),i[s]=i[s-1],i[s]+=Ea.distanceTo(wa);e.setAttribute("lineDistance",new mt(i,1))}else Ce("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){let i=this.geometry,s=this.matrixWorld,r=e.params.Line.threshold,a=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Jr.copy(i.boundingSphere),Jr.applyMatrix4(s),Jr.radius+=r,e.ray.intersectsSphere(Jr)===!1)return;hh.copy(s).invert(),Ns.copy(e.ray).applyMatrix4(hh);let o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=this.isLineSegments?2:1,h=i.index,u=i.attributes.position;if(h!==null){let f=Math.max(0,a.start),g=Math.min(h.count,a.start+a.count);for(let S=f,p=g-1;S<p;S+=c){let m=h.getX(S),x=h.getX(S+1),M=Kr(this,e,Ns,l,m,x,S);M&&t.push(M)}if(this.isLineLoop){let S=h.getX(g-1),p=h.getX(f),m=Kr(this,e,Ns,l,S,p,g-1);m&&t.push(m)}}else{let f=Math.max(0,a.start),g=Math.min(u.count,a.start+a.count);for(let S=f,p=g-1;S<p;S+=c){let m=Kr(this,e,Ns,l,S,S+1,S);m&&t.push(m)}if(this.isLineLoop){let S=Kr(this,e,Ns,l,g-1,f,g-1);S&&t.push(S)}}}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let s=t[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}};function Kr(n,e,t,i,s,r,a){let o=n.geometry.attributes.position;if(Ea.fromBufferAttribute(o,s),wa.fromBufferAttribute(o,r),t.distanceSqToSegment(Ea,wa,yl,uh)>i)return;yl.applyMatrix4(n.matrixWorld);let c=e.ray.origin.distanceTo(yl);if(!(c<e.near||c>e.far))return{distance:c,point:uh.clone().applyMatrix4(n.matrixWorld),index:a,face:null,faceIndex:null,barycoord:null,object:n}}var dh=new C,fh=new C,ds=class extends An{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[];for(let s=0,r=t.count;s<r;s+=2)dh.fromBufferAttribute(t,s),fh.fromBufferAttribute(t,s+1),i[s]=s===0?0:i[s-1],i[s+1]=i[s]+dh.distanceTo(fh);e.setAttribute("lineDistance",new mt(i,1))}else Ce("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}},Cn=class extends An{constructor(e,t){super(e,t),this.isLineLoop=!0,this.type="LineLoop"}};var Zs=class extends It{constructor(e=[],t=pi,i,s,r,a,o,l,c,h){super(e,t,i,s,r,a,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},yt=class extends It{constructor(e,t,i,s,r,a,o,l,c){super(e,t,i,s,r,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}};var Xn=class extends It{constructor(e,t,i=mn,s,r,a,o=Rt,l=Rt,c,h=Tn,d=1){if(h!==Tn&&h!==mi)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let u={width:e,height:t,depth:d};super(u,s,r,a,o,l,h,i,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new os(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},Aa=class extends Xn{constructor(e,t=mn,i=pi,s,r,a=Rt,o=Rt,l,c=Tn){let h={width:e,height:e,depth:1},d=[h,h,h,h,h,h];super(e,e,t,i,s,r,a,o,l,c),this.image=d,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},Js=class extends It{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},fs=class n extends ot{constructor(e=1,t=1,i=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:s,heightSegments:r,depthSegments:a};let o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);let l=[],c=[],h=[],d=[],u=0,f=0;g("z","y","x",-1,-1,i,t,e,a,r,0),g("z","y","x",1,-1,i,t,-e,a,r,1),g("x","z","y",1,1,e,i,t,s,a,2),g("x","z","y",1,-1,e,i,-t,s,a,3),g("x","y","z",1,-1,e,t,i,s,r,4),g("x","y","z",-1,-1,e,t,-i,s,r,5),this.setIndex(l),this.setAttribute("position",new mt(c,3)),this.setAttribute("normal",new mt(h,3)),this.setAttribute("uv",new mt(d,2));function g(S,p,m,x,M,b,A,E,I,y,w){let F=b/I,R=A/y,O=b/2,G=A/2,X=E/2,N=I+1,z=y+1,V=0,j=0,Q=new C;for(let ce=0;ce<z;ce++){let ye=ce*R-G;for(let Te=0;Te<N;Te++){let Ye=Te*F-O;Q[S]=Ye*x,Q[p]=ye*M,Q[m]=X,c.push(Q.x,Q.y,Q.z),Q[S]=0,Q[p]=0,Q[m]=E>0?1:-1,h.push(Q.x,Q.y,Q.z),d.push(Te/I),d.push(1-ce/y),V+=1}}for(let ce=0;ce<y;ce++)for(let ye=0;ye<I;ye++){let Te=u+ye+N*ce,Ye=u+ye+N*(ce+1),je=u+(ye+1)+N*(ce+1),Oe=u+(ye+1)+N*ce;l.push(Te,Ye,Oe),l.push(Ye,je,Oe),j+=6}o.addGroup(f,j,w),f+=j,u+=V}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};var Qt=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){Ce("Curve: .getPoint() not implemented.")}getPointAt(e,t){let i=this.getUtoTmapping(e);return this.getPoint(i,t)}getPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return t}getSpacedPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPointAt(i/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],i,s=this.getPoint(0),r=0;t.push(0);for(let a=1;a<=e;a++)i=this.getPoint(a/e),r+=i.distanceTo(s),t.push(r),s=i;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){let i=this.getLengths(),s=0,r=i.length,a;t?a=t:a=e*i[r-1];let o=0,l=r-1,c;for(;o<=l;)if(s=Math.floor(o+(l-o)/2),c=i[s]-a,c<0)o=s+1;else if(c>0)l=s-1;else{l=s;break}if(s=l,i[s]===a)return s/(r-1);let h=i[s],u=i[s+1]-h,f=(a-h)/u;return(s+f)/(r-1)}getTangent(e,t){let s=e-1e-4,r=e+1e-4;s<0&&(s=0),r>1&&(r=1);let a=this.getPoint(s),o=this.getPoint(r),l=t||(a.isVector2?new ge:new C);return l.copy(o).sub(a).normalize(),l}getTangentAt(e,t){let i=this.getUtoTmapping(e);return this.getTangent(i,t)}computeFrenetFrames(e,t=!1){let i=new C,s=[],r=[],a=[],o=new C,l=new ut;for(let f=0;f<=e;f++){let g=f/e;s[f]=this.getTangentAt(g,new C)}r[0]=new C,a[0]=new C;let c=Number.MAX_VALUE,h=Math.abs(s[0].x),d=Math.abs(s[0].y),u=Math.abs(s[0].z);h<=c&&(c=h,i.set(1,0,0)),d<=c&&(c=d,i.set(0,1,0)),u<=c&&i.set(0,0,1),o.crossVectors(s[0],i).normalize(),r[0].crossVectors(s[0],o),a[0].crossVectors(s[0],r[0]);for(let f=1;f<=e;f++){if(r[f]=r[f-1].clone(),a[f]=a[f-1].clone(),o.crossVectors(s[f-1],s[f]),o.length()>Number.EPSILON){o.normalize();let g=Math.acos(Ve(s[f-1].dot(s[f]),-1,1));r[f].applyMatrix4(l.makeRotationAxis(o,g))}a[f].crossVectors(s[f],r[f])}if(t===!0){let f=Math.acos(Ve(r[0].dot(r[e]),-1,1));f/=e,s[0].dot(o.crossVectors(r[0],r[e]))>0&&(f=-f);for(let g=1;g<=e;g++)r[g].applyMatrix4(l.makeRotationAxis(s[g],f*g)),a[g].crossVectors(s[g],r[g])}return{tangents:s,normals:r,binormals:a}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}},ps=class extends Qt{constructor(e=0,t=0,i=1,s=1,r=0,a=Math.PI*2,o=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=i,this.yRadius=s,this.aStartAngle=r,this.aEndAngle=a,this.aClockwise=o,this.aRotation=l}getPoint(e,t=new ge){let i=t,s=Math.PI*2,r=this.aEndAngle-this.aStartAngle,a=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=s;for(;r>s;)r-=s;r<Number.EPSILON&&(a?r=0:r=s),this.aClockwise===!0&&!a&&(r===s?r=-s:r=r-s);let o=this.aStartAngle+e*r,l=this.aX+this.xRadius*Math.cos(o),c=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){let h=Math.cos(this.aRotation),d=Math.sin(this.aRotation),u=l-this.aX,f=c-this.aY;l=u*h-f*d+this.aX,c=u*d+f*h+this.aY}return i.set(l,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},Ca=class extends ps{constructor(e,t,i,s,r,a){super(e,t,i,i,s,r,a),this.isArcCurve=!0,this.type="ArcCurve"}};function ic(){let n=0,e=0,t=0,i=0;function s(r,a,o,l){n=r,e=o,t=-3*r+3*a-2*o-l,i=2*r-2*a+o+l}return{initCatmullRom:function(r,a,o,l,c){s(a,o,c*(o-r),c*(l-a))},initNonuniformCatmullRom:function(r,a,o,l,c,h,d){let u=(a-r)/c-(o-r)/(c+h)+(o-a)/h,f=(o-a)/h-(l-a)/(h+d)+(l-o)/d;u*=h,f*=h,s(a,o,u,f)},calc:function(r){let a=r*r,o=a*r;return n+e*r+t*a+i*o}}}var ph=new C,mh=new C,vl=new ic,Sl=new ic,Ml=new ic,ms=class extends Qt{constructor(e=[],t=!1,i="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=i,this.tension=s}getPoint(e,t=new C){let i=t,s=this.points,r=s.length,a=(r-(this.closed?0:1))*e,o=Math.floor(a),l=a-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/r)+1)*r:l===0&&o===r-1&&(o=r-2,l=1);let c,h;this.closed||o>0?c=s[(o-1)%r]:(mh.subVectors(s[0],s[1]).add(s[0]),c=mh);let d=s[o%r],u=s[(o+1)%r];if(this.closed||o+2<r?h=s[(o+2)%r]:(ph.subVectors(s[r-1],s[r-2]).add(s[r-1]),h=ph),this.curveType==="centripetal"||this.curveType==="chordal"){let f=this.curveType==="chordal"?.5:.25,g=Math.pow(c.distanceToSquared(d),f),S=Math.pow(d.distanceToSquared(u),f),p=Math.pow(u.distanceToSquared(h),f);S<1e-4&&(S=1),g<1e-4&&(g=S),p<1e-4&&(p=S),vl.initNonuniformCatmullRom(c.x,d.x,u.x,h.x,g,S,p),Sl.initNonuniformCatmullRom(c.y,d.y,u.y,h.y,g,S,p),Ml.initNonuniformCatmullRom(c.z,d.z,u.z,h.z,g,S,p)}else this.curveType==="catmullrom"&&(vl.initCatmullRom(c.x,d.x,u.x,h.x,this.tension),Sl.initCatmullRom(c.y,d.y,u.y,h.y,this.tension),Ml.initCatmullRom(c.z,d.z,u.z,h.z,this.tension));return i.set(vl.calc(l),Sl.calc(l),Ml.calc(l)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(s.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let s=this.points[t];e.points.push(s.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(new C().fromArray(s))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function gh(n,e,t,i,s){let r=(i-e)*.5,a=(s-t)*.5,o=n*n,l=n*o;return(2*t-2*i+r+a)*l+(-3*t+3*i-2*r-a)*o+r*n+t}function Vd(n,e){let t=1-n;return t*t*e}function Gd(n,e){return 2*(1-n)*n*e}function Wd(n,e){return n*n*e}function Os(n,e,t,i){return Vd(n,e)+Gd(n,t)+Wd(n,i)}function Xd(n,e){let t=1-n;return t*t*t*e}function qd(n,e){let t=1-n;return 3*t*t*n*e}function Yd(n,e){return 3*(1-n)*n*n*e}function $d(n,e){return n*n*n*e}function Bs(n,e,t,i,s){return Xd(n,e)+qd(n,t)+Yd(n,i)+$d(n,s)}var Ks=class extends Qt{constructor(e=new ge,t=new ge,i=new ge,s=new ge){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=i,this.v3=s}getPoint(e,t=new ge){let i=t,s=this.v0,r=this.v1,a=this.v2,o=this.v3;return i.set(Bs(e,s.x,r.x,a.x,o.x),Bs(e,s.y,r.y,a.y,o.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},Ra=class extends Qt{constructor(e=new C,t=new C,i=new C,s=new C){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=i,this.v3=s}getPoint(e,t=new C){let i=t,s=this.v0,r=this.v1,a=this.v2,o=this.v3;return i.set(Bs(e,s.x,r.x,a.x,o.x),Bs(e,s.y,r.y,a.y,o.y),Bs(e,s.z,r.z,a.z,o.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},js=class extends Qt{constructor(e=new ge,t=new ge){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new ge){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new ge){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Ia=class extends Qt{constructor(e=new C,t=new C){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new C){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new C){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Qs=class extends Qt{constructor(e=new ge,t=new ge,i=new ge){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new ge){let i=t,s=this.v0,r=this.v1,a=this.v2;return i.set(Os(e,s.x,r.x,a.x),Os(e,s.y,r.y,a.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},ci=class extends Qt{constructor(e=new C,t=new C,i=new C){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new C){let i=t,s=this.v0,r=this.v1,a=this.v2;return i.set(Os(e,s.x,r.x,a.x),Os(e,s.y,r.y,a.y),Os(e,s.z,r.z,a.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},er=class extends Qt{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new ge){let i=t,s=this.points,r=(s.length-1)*e,a=Math.floor(r),o=r-a,l=s[a===0?a:a-1],c=s[a],h=s[a>s.length-2?s.length-1:a+1],d=s[a>s.length-3?s.length-1:a+2];return i.set(gh(o,l.x,c.x,h.x,d.x),gh(o,l.y,c.y,h.y,d.y)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(s.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let s=this.points[t];e.points.push(s.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(new ge().fromArray(s))}return this}},Cl=Object.freeze({__proto__:null,ArcCurve:Ca,CatmullRomCurve3:ms,CubicBezierCurve:Ks,CubicBezierCurve3:Ra,EllipseCurve:ps,LineCurve:js,LineCurve3:Ia,QuadraticBezierCurve:Qs,QuadraticBezierCurve3:ci,SplineCurve:er}),Pa=class extends Qt{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){let e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){let i=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new Cl[i](t,e))}return this}getPoint(e,t){let i=e*this.getLength(),s=this.getCurveLengths(),r=0;for(;r<s.length;){if(s[r]>=i){let a=s[r]-i,o=this.curves[r],l=o.getLength(),c=l===0?0:1-a/l;return o.getPointAt(c,t)}r++}return null}getLength(){let e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let e=[],t=0;for(let i=0,s=this.curves.length;i<s;i++)t+=this.curves[i].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){let t=[],i;for(let s=0,r=this.curves;s<r.length;s++){let a=r[s],o=a.isEllipseCurve?e*2:a.isLineCurve||a.isLineCurve3?1:a.isSplineCurve?e*a.points.length:e,l=a.getPoints(o);for(let c=0;c<l.length;c++){let h=l[c];i&&i.equals(h)||(t.push(h),i=h)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let s=e.curves[t];this.curves.push(s.clone())}return this.autoClose=e.autoClose,this}toJSON(){let e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,i=this.curves.length;t<i;t++){let s=this.curves[t];e.curves.push(s.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let s=e.curves[t];this.curves.push(new Cl[s.type]().fromJSON(s))}return this}},tr=class extends Pa{constructor(e){super(),this.type="Path",this.currentPoint=new ge,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,i=e.length;t<i;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){let i=new js(this.currentPoint.clone(),new ge(e,t));return this.curves.push(i),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,i,s){let r=new Qs(this.currentPoint.clone(),new ge(e,t),new ge(i,s));return this.curves.push(r),this.currentPoint.set(i,s),this}bezierCurveTo(e,t,i,s,r,a){let o=new Ks(this.currentPoint.clone(),new ge(e,t),new ge(i,s),new ge(r,a));return this.curves.push(o),this.currentPoint.set(r,a),this}splineThru(e){let t=[this.currentPoint.clone()].concat(e),i=new er(t);return this.curves.push(i),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,i,s,r,a){let o=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(e+o,t+l,i,s,r,a),this}absarc(e,t,i,s,r,a){return this.absellipse(e,t,i,i,s,r,a),this}ellipse(e,t,i,s,r,a,o,l){let c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(e+c,t+h,i,s,r,a,o,l),this}absellipse(e,t,i,s,r,a,o,l){let c=new ps(e,t,i,s,r,a,o,l);if(this.curves.length>0){let d=c.getPoint(0);d.equals(this.currentPoint)||this.lineTo(d.x,d.y)}this.curves.push(c);let h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){let e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}},gs=class extends tr{constructor(e){super(e),this.uuid=Hn(),this.type="Shape",this.holes=[]}getPointsHoles(e){let t=[];for(let i=0,s=this.holes.length;i<s;i++)t[i]=this.holes[i].getPoints(e);return t}extractPoints(e){return{shape:this.getPoints(e),holes:this.getPointsHoles(e)}}copy(e){super.copy(e),this.holes=[];for(let t=0,i=e.holes.length;t<i;t++){let s=e.holes[t];this.holes.push(s.clone())}return this}toJSON(){let e=super.toJSON();e.uuid=this.uuid,e.holes=[];for(let t=0,i=this.holes.length;t<i;t++){let s=this.holes[t];e.holes.push(s.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.uuid=e.uuid,this.holes=[];for(let t=0,i=e.holes.length;t<i;t++){let s=e.holes[t];this.holes.push(new tr().fromJSON(s))}return this}};function Zd(n,e,t=2){let i=e&&e.length,s=i?e[0]*t:n.length,r=hu(n,0,s,t,!0),a=[];if(!r||r.next===r.prev)return a;let o,l,c;if(i&&(r=ef(n,e,r,t)),n.length>80*t){o=n[0],l=n[1];let h=o,d=l;for(let u=t;u<s;u+=t){let f=n[u],g=n[u+1];f<o&&(o=f),g<l&&(l=g),f>h&&(h=f),g>d&&(d=g)}c=Math.max(h-o,d-l),c=c!==0?32767/c:0}return nr(r,a,t,o,l,c,0),a}function hu(n,e,t,i,s){let r;if(s===df(n,e,t,i)>0)for(let a=e;a<t;a+=i)r=_h(a/i|0,n[a],n[a+1],r);else for(let a=t-i;a>=e;a-=i)r=_h(a/i|0,n[a],n[a+1],r);return r&&_s(r,r.next)&&(sr(r),r=r.next),r}function Pi(n,e){if(!n)return n;e||(e=n);let t=n,i;do if(i=!1,!t.steiner&&(_s(t,t.next)||pt(t.prev,t,t.next)===0)){if(sr(t),t=e=t.prev,t===t.next)break;i=!0}else t=t.next;while(i||t!==e);return e}function nr(n,e,t,i,s,r,a){if(!n)return;!a&&r&&af(n,i,s,r);let o=n;for(;n.prev!==n.next;){let l=n.prev,c=n.next;if(r?Kd(n,i,s,r):Jd(n)){e.push(l.i,n.i,c.i),sr(n),n=c.next,o=c.next;continue}if(n=c,n===o){a?a===1?(n=jd(Pi(n),e),nr(n,e,t,i,s,r,2)):a===2&&Qd(n,e,t,i,s,r):nr(Pi(n),e,t,i,s,r,1);break}}}function Jd(n){let e=n.prev,t=n,i=n.next;if(pt(e,t,i)>=0)return!1;let s=e.x,r=t.x,a=i.x,o=e.y,l=t.y,c=i.y,h=Math.min(s,r,a),d=Math.min(o,l,c),u=Math.max(s,r,a),f=Math.max(o,l,c),g=i.next;for(;g!==e;){if(g.x>=h&&g.x<=u&&g.y>=d&&g.y<=f&&Us(s,o,r,l,a,c,g.x,g.y)&&pt(g.prev,g,g.next)>=0)return!1;g=g.next}return!0}function Kd(n,e,t,i){let s=n.prev,r=n,a=n.next;if(pt(s,r,a)>=0)return!1;let o=s.x,l=r.x,c=a.x,h=s.y,d=r.y,u=a.y,f=Math.min(o,l,c),g=Math.min(h,d,u),S=Math.max(o,l,c),p=Math.max(h,d,u),m=Rl(f,g,e,t,i),x=Rl(S,p,e,t,i),M=n.prevZ,b=n.nextZ;for(;M&&M.z>=m&&b&&b.z<=x;){if(M.x>=f&&M.x<=S&&M.y>=g&&M.y<=p&&M!==s&&M!==a&&Us(o,h,l,d,c,u,M.x,M.y)&&pt(M.prev,M,M.next)>=0||(M=M.prevZ,b.x>=f&&b.x<=S&&b.y>=g&&b.y<=p&&b!==s&&b!==a&&Us(o,h,l,d,c,u,b.x,b.y)&&pt(b.prev,b,b.next)>=0))return!1;b=b.nextZ}for(;M&&M.z>=m;){if(M.x>=f&&M.x<=S&&M.y>=g&&M.y<=p&&M!==s&&M!==a&&Us(o,h,l,d,c,u,M.x,M.y)&&pt(M.prev,M,M.next)>=0)return!1;M=M.prevZ}for(;b&&b.z<=x;){if(b.x>=f&&b.x<=S&&b.y>=g&&b.y<=p&&b!==s&&b!==a&&Us(o,h,l,d,c,u,b.x,b.y)&&pt(b.prev,b,b.next)>=0)return!1;b=b.nextZ}return!0}function jd(n,e){let t=n;do{let i=t.prev,s=t.next.next;!_s(i,s)&&du(i,t,t.next,s)&&ir(i,s)&&ir(s,i)&&(e.push(i.i,t.i,s.i),sr(t),sr(t.next),t=n=s),t=t.next}while(t!==n);return Pi(t)}function Qd(n,e,t,i,s,r){let a=n;do{let o=a.next.next;for(;o!==a.prev;){if(a.i!==o.i&&cf(a,o)){let l=fu(a,o);a=Pi(a,a.next),l=Pi(l,l.next),nr(a,e,t,i,s,r,0),nr(l,e,t,i,s,r,0);return}o=o.next}a=a.next}while(a!==n)}function ef(n,e,t,i){let s=[];for(let r=0,a=e.length;r<a;r++){let o=e[r]*i,l=r<a-1?e[r+1]*i:n.length,c=hu(n,o,l,i,!1);c===c.next&&(c.steiner=!0),s.push(lf(c))}s.sort(tf);for(let r=0;r<s.length;r++)t=nf(s[r],t);return t}function tf(n,e){let t=n.x-e.x;if(t===0&&(t=n.y-e.y,t===0)){let i=(n.next.y-n.y)/(n.next.x-n.x),s=(e.next.y-e.y)/(e.next.x-e.x);t=i-s}return t}function nf(n,e){let t=sf(n,e);if(!t)return e;let i=fu(t,n);return Pi(i,i.next),Pi(t,t.next)}function sf(n,e){let t=e,i=n.x,s=n.y,r=-1/0,a;if(_s(n,t))return t;do{if(_s(n,t.next))return t.next;if(s<=t.y&&s>=t.next.y&&t.next.y!==t.y){let d=t.x+(s-t.y)*(t.next.x-t.x)/(t.next.y-t.y);if(d<=i&&d>r&&(r=d,a=t.x<t.next.x?t:t.next,d===i))return a}t=t.next}while(t!==e);if(!a)return null;let o=a,l=a.x,c=a.y,h=1/0;t=a;do{if(i>=t.x&&t.x>=l&&i!==t.x&&uu(s<c?i:r,s,l,c,s<c?r:i,s,t.x,t.y)){let d=Math.abs(s-t.y)/(i-t.x);ir(t,n)&&(d<h||d===h&&(t.x>a.x||t.x===a.x&&rf(a,t)))&&(a=t,h=d)}t=t.next}while(t!==o);return a}function rf(n,e){return pt(n.prev,n,e.prev)<0&&pt(e.next,n,n.next)<0}function af(n,e,t,i){let s=n;do s.z===0&&(s.z=Rl(s.x,s.y,e,t,i)),s.prevZ=s.prev,s.nextZ=s.next,s=s.next;while(s!==n);s.prevZ.nextZ=null,s.prevZ=null,of(s)}function of(n){let e,t=1;do{let i=n,s;n=null;let r=null;for(e=0;i;){e++;let a=i,o=0;for(let c=0;c<t&&(o++,a=a.nextZ,!!a);c++);let l=t;for(;o>0||l>0&&a;)o!==0&&(l===0||!a||i.z<=a.z)?(s=i,i=i.nextZ,o--):(s=a,a=a.nextZ,l--),r?r.nextZ=s:n=s,s.prevZ=r,r=s;i=a}r.nextZ=null,t*=2}while(e>1);return n}function Rl(n,e,t,i,s){return n=(n-t)*s|0,e=(e-i)*s|0,n=(n|n<<8)&16711935,n=(n|n<<4)&252645135,n=(n|n<<2)&858993459,n=(n|n<<1)&1431655765,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,n|e<<1}function lf(n){let e=n,t=n;do(e.x<t.x||e.x===t.x&&e.y<t.y)&&(t=e),e=e.next;while(e!==n);return t}function uu(n,e,t,i,s,r,a,o){return(s-a)*(e-o)>=(n-a)*(r-o)&&(n-a)*(i-o)>=(t-a)*(e-o)&&(t-a)*(r-o)>=(s-a)*(i-o)}function Us(n,e,t,i,s,r,a,o){return!(n===a&&e===o)&&uu(n,e,t,i,s,r,a,o)}function cf(n,e){return n.next.i!==e.i&&n.prev.i!==e.i&&!hf(n,e)&&(ir(n,e)&&ir(e,n)&&uf(n,e)&&(pt(n.prev,n,e.prev)||pt(n,e.prev,e))||_s(n,e)&&pt(n.prev,n,n.next)>0&&pt(e.prev,e,e.next)>0)}function pt(n,e,t){return(e.y-n.y)*(t.x-e.x)-(e.x-n.x)*(t.y-e.y)}function _s(n,e){return n.x===e.x&&n.y===e.y}function du(n,e,t,i){let s=Qr(pt(n,e,t)),r=Qr(pt(n,e,i)),a=Qr(pt(t,i,n)),o=Qr(pt(t,i,e));return!!(s!==r&&a!==o||s===0&&jr(n,t,e)||r===0&&jr(n,i,e)||a===0&&jr(t,n,i)||o===0&&jr(t,e,i))}function jr(n,e,t){return e.x<=Math.max(n.x,t.x)&&e.x>=Math.min(n.x,t.x)&&e.y<=Math.max(n.y,t.y)&&e.y>=Math.min(n.y,t.y)}function Qr(n){return n>0?1:n<0?-1:0}function hf(n,e){let t=n;do{if(t.i!==n.i&&t.next.i!==n.i&&t.i!==e.i&&t.next.i!==e.i&&du(t,t.next,n,e))return!0;t=t.next}while(t!==n);return!1}function ir(n,e){return pt(n.prev,n,n.next)<0?pt(n,e,n.next)>=0&&pt(n,n.prev,e)>=0:pt(n,e,n.prev)<0||pt(n,n.next,e)<0}function uf(n,e){let t=n,i=!1,s=(n.x+e.x)/2,r=(n.y+e.y)/2;do t.y>r!=t.next.y>r&&t.next.y!==t.y&&s<(t.next.x-t.x)*(r-t.y)/(t.next.y-t.y)+t.x&&(i=!i),t=t.next;while(t!==n);return i}function fu(n,e){let t=Il(n.i,n.x,n.y),i=Il(e.i,e.x,e.y),s=n.next,r=e.prev;return n.next=e,e.prev=n,t.next=s,s.prev=t,i.next=t,t.prev=i,r.next=i,i.prev=r,i}function _h(n,e,t,i){let s=Il(n,e,t);return i?(s.next=i.next,s.prev=i,i.next.prev=s,i.next=s):(s.prev=s,s.next=s),s}function sr(n){n.next.prev=n.prev,n.prev.next=n.next,n.prevZ&&(n.prevZ.nextZ=n.nextZ),n.nextZ&&(n.nextZ.prevZ=n.prevZ)}function Il(n,e,t){return{i:n,x:e,y:t,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function df(n,e,t,i){let s=0;for(let r=e,a=t-i;r<t;r+=i)s+=(n[a]-n[r])*(n[r+1]+n[a+1]),a=r;return s}var Pl=class{static triangulate(e,t,i=2){return Zd(e,t,i)}},ss=class n{static area(e){let t=e.length,i=0;for(let s=t-1,r=0;r<t;s=r++)i+=e[s].x*e[r].y-e[r].x*e[s].y;return i*.5}static isClockWise(e){return n.area(e)<0}static triangulateShape(e,t){let i=[],s=[],r=[];xh(e),yh(i,e);let a=e.length;t.forEach(xh);for(let l=0;l<t.length;l++)s.push(a),a+=t[l].length,yh(i,t[l]);let o=Pl.triangulate(i,s);for(let l=0;l<o.length;l+=3)r.push(o.slice(l,l+3));return r}};function xh(n){let e=n.length;e>2&&n[e-1].equals(n[0])&&n.pop()}function yh(n,e){for(let t=0;t<e.length;t++)n.push(e[t].x),n.push(e[t].y)}var en=class n extends ot{constructor(e=1,t=1,i=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:s};let r=e/2,a=t/2,o=Math.floor(i),l=Math.floor(s),c=o+1,h=l+1,d=e/o,u=t/l,f=[],g=[],S=[],p=[];for(let m=0;m<h;m++){let x=m*u-a;for(let M=0;M<c;M++){let b=M*d-r;g.push(b,-x,0),S.push(0,0,1),p.push(M/o),p.push(1-m/l)}}for(let m=0;m<l;m++)for(let x=0;x<o;x++){let M=x+c*m,b=x+c*(m+1),A=x+1+c*(m+1),E=x+1+c*m;f.push(M,b,E),f.push(b,A,E)}this.setIndex(f),this.setAttribute("position",new mt(g,3)),this.setAttribute("normal",new mt(S,3)),this.setAttribute("uv",new mt(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.widthSegments,e.heightSegments)}};var rr=class n extends ot{constructor(e=new gs([new ge(0,.5),new ge(-.5,-.5),new ge(.5,-.5)]),t=12){super(),this.type="ShapeGeometry",this.parameters={shapes:e,curveSegments:t};let i=[],s=[],r=[],a=[],o=0,l=0;if(Array.isArray(e)===!1)c(e);else for(let h=0;h<e.length;h++)c(e[h]),this.addGroup(o,l,h),o+=l,l=0;this.setIndex(i),this.setAttribute("position",new mt(s,3)),this.setAttribute("normal",new mt(r,3)),this.setAttribute("uv",new mt(a,2));function c(h){let d=s.length/3,u=h.extractPoints(t),f=u.shape,g=u.holes;ss.isClockWise(f)===!1&&(f=f.reverse());for(let p=0,m=g.length;p<m;p++){let x=g[p];ss.isClockWise(x)===!0&&(g[p]=x.reverse())}let S=ss.triangulateShape(f,g);for(let p=0,m=g.length;p<m;p++){let x=g[p];f=f.concat(x)}for(let p=0,m=f.length;p<m;p++){let x=f[p];s.push(x.x,x.y,0),r.push(0,0,1),a.push(x.x,x.y)}for(let p=0,m=S.length;p<m;p++){let x=S[p],M=x[0]+d,b=x[1]+d,A=x[2]+d;i.push(M,b,A),l+=3}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON(),t=this.parameters.shapes;return ff(t,e)}static fromJSON(e,t){let i=[];for(let s=0,r=e.shapes.length;s<r;s++){let a=t[e.shapes[s]];i.push(a)}return new n(i,e.curveSegments)}};function ff(n,e){if(e.shapes=[],Array.isArray(n))for(let t=0,i=n.length;t<i;t++){let s=n[t];e.shapes.push(s.uuid)}else e.shapes.push(n.uuid);return e}var ar=class n extends ot{constructor(e=new ci(new C(-1,-1,0),new C(-1,1,0),new C(1,1,0)),t=64,i=1,s=8,r=!1){super(),this.type="TubeGeometry",this.parameters={path:e,tubularSegments:t,radius:i,radialSegments:s,closed:r};let a=e.computeFrenetFrames(t,r);this.tangents=a.tangents,this.normals=a.normals,this.binormals=a.binormals;let o=new C,l=new C,c=new ge,h=new C,d=[],u=[],f=[],g=[];S(),this.setIndex(g),this.setAttribute("position",new mt(d,3)),this.setAttribute("normal",new mt(u,3)),this.setAttribute("uv",new mt(f,2));function S(){for(let M=0;M<t;M++)p(M);p(r===!1?t:0),x(),m()}function p(M){h=e.getPointAt(M/t,h);let b=a.normals[M],A=a.binormals[M];for(let E=0;E<=s;E++){let I=E/s*Math.PI*2,y=Math.sin(I),w=-Math.cos(I);l.x=w*b.x+y*A.x,l.y=w*b.y+y*A.y,l.z=w*b.z+y*A.z,l.normalize(),u.push(l.x,l.y,l.z),o.x=h.x+i*l.x,o.y=h.y+i*l.y,o.z=h.z+i*l.z,d.push(o.x,o.y,o.z)}}function m(){for(let M=1;M<=t;M++)for(let b=1;b<=s;b++){let A=(s+1)*(M-1)+(b-1),E=(s+1)*M+(b-1),I=(s+1)*M+b,y=(s+1)*(M-1)+b;g.push(A,E,y),g.push(E,I,y)}}function x(){for(let M=0;M<=t;M++)for(let b=0;b<=s;b++)c.x=M/t,c.y=b/s,f.push(c.x,c.y)}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON();return e.path=this.parameters.path.toJSON(),e}static fromJSON(e){return new n(new Cl[e.path.type]().fromJSON(e.path),e.tubularSegments,e.radius,e.radialSegments,e.closed)}};function Li(n){let e={};for(let t in n){e[t]={};for(let i in n[t]){let s=n[t][i];if(vh(s))s.isRenderTargetTexture?(Ce("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=s.clone();else if(Array.isArray(s))if(vh(s[0])){let r=[];for(let a=0,o=s.length;a<o;a++)r[a]=s[a].clone();e[t][i]=r}else e[t][i]=s.slice();else e[t][i]=s}}return e}function kt(n){let e={};for(let t=0;t<n.length;t++){let i=Li(n[t]);for(let s in i)e[s]=i[s]}return e}function vh(n){return n&&(n.isColor||n.isMatrix3||n.isMatrix4||n.isVector2||n.isVector3||n.isVector4||n.isTexture||n.isQuaternion)}function pf(n){let e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function sc(n){let e=n.getRenderTarget();return e===null?n.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:Xe.workingColorSpace}var pu={clone:Li,merge:kt},mf=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,gf=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,tn=class extends Wn{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=mf,this.fragmentShader=gf,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Li(e.uniforms),this.uniformsGroups=pf(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let s in this.uniforms){let a=this.uniforms[s].value;a&&a.isTexture?t.uniforms[s]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[s]={type:"m4",value:a.toArray()}:t.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let i={};for(let s in this.extensions)this.extensions[s]===!0&&(i[s]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}},Da=class extends tn{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}};var La=class extends Wn{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Jh,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},Fa=class extends Wn{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};var xs=class extends Ot{constructor(e){super(),this.isLineDashedMaterial=!0,this.type="LineDashedMaterial",this.scale=1,this.dashSize=3,this.gapSize=1,this.setValues(e)}copy(e){return super.copy(e),this.scale=e.scale,this.dashSize=e.dashSize,this.gapSize=e.gapSize,this}};function ea(n,e){return!n||n.constructor===e?n:typeof e.BYTES_PER_ELEMENT=="number"?new e(n):Array.prototype.slice.call(n)}var hi=class{constructor(e,t,i,s){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new t.constructor(i),this.sampleValues=t,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,i=this._cachedIndex,s=t[i],r=t[i-1];n:{e:{let a;t:{i:if(!(e<s)){for(let o=i+2;;){if(s===void 0){if(e<r)break i;return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===o)break;if(r=s,s=t[++i],e<s)break e}a=t.length;break t}if(!(e>=r)){let o=t[1];e<o&&(i=2,r=o);for(let l=i-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===l)break;if(s=r,r=t[--i-1],e>=r)break e}a=i,i=0;break t}break n}for(;i<a;){let o=i+a>>>1;e<t[o]?a=o:i=o+1}if(s=t[i],r=t[i-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,r,s)}return this.interpolate_(i,r,e,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,i=this.sampleValues,s=this.valueSize,r=e*s;for(let a=0;a!==s;++a)t[a]=i[r+a];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},Na=class extends hi{constructor(e,t,i,s){super(e,t,i,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Tl,endingEnd:Tl}}intervalChanged_(e,t,i){let s=this.parameterPositions,r=e-2,a=e+1,o=s[r],l=s[a];if(o===void 0)switch(this.getSettings_().endingStart){case El:r=e,o=2*t-i;break;case wl:r=s.length-2,o=t+s[r]-s[r+1];break;default:r=e,o=i}if(l===void 0)switch(this.getSettings_().endingEnd){case El:a=e,l=2*i-t;break;case wl:a=1,l=i+s[1]-s[0];break;default:a=e-1,l=t}let c=(i-t)*.5,h=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(l-i),this._offsetPrev=r*h,this._offsetNext=a*h}interpolate_(e,t,i,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=this._offsetPrev,d=this._offsetNext,u=this._weightPrev,f=this._weightNext,g=(i-t)/(s-t),S=g*g,p=S*g,m=-u*p+2*u*S-u*g,x=(1+u)*p+(-1.5-2*u)*S+(-.5+u)*g+1,M=(-1-f)*p+(1.5+f)*S+.5*g,b=f*p-f*S;for(let A=0;A!==o;++A)r[A]=m*a[h+A]+x*a[c+A]+M*a[l+A]+b*a[d+A];return r}},Ua=class extends hi{constructor(e,t,i,s){super(e,t,i,s)}interpolate_(e,t,i,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=(i-t)/(s-t),d=1-h;for(let u=0;u!==o;++u)r[u]=a[c+u]*d+a[l+u]*h;return r}},Oa=class extends hi{constructor(e,t,i,s){super(e,t,i,s)}interpolate_(e){return this.copySampleValue_(e-1)}},Ba=class extends hi{interpolate_(e,t,i,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=this.settings||this.DefaultSettings_,d=h.inTangents,u=h.outTangents;if(!d||!u){let S=(i-t)/(s-t),p=1-S;for(let m=0;m!==o;++m)r[m]=a[c+m]*p+a[l+m]*S;return r}let f=o*2,g=e-1;for(let S=0;S!==o;++S){let p=a[c+S],m=a[l+S],x=g*f+S*2,M=u[x],b=u[x+1],A=e*f+S*2,E=d[A],I=d[A+1],y=(i-t)/(s-t),w,F,R,O,G;for(let X=0;X<8;X++){w=y*y,F=w*y,R=1-y,O=R*R,G=O*R;let z=G*t+3*O*y*M+3*R*w*E+F*s-i;if(Math.abs(z)<1e-10)break;let V=3*O*(M-t)+6*R*y*(E-M)+3*w*(s-E);if(Math.abs(V)<1e-10)break;y=y-z/V,y=Math.max(0,Math.min(1,y))}r[S]=G*p+3*O*y*b+3*R*w*I+F*m}return r}},nn=class{constructor(e,t,i,s){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=ea(t,this.TimeBufferType),this.values=ea(i,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,i;if(t.toJSON!==this.toJSON)i=t.toJSON(e);else{i={name:e.name,times:ea(e.times,Array),values:ea(e.values,Array)};let s=e.getInterpolation();s!==e.DefaultInterpolation&&(i.interpolation=s)}return i.type=e.ValueTypeName,i}InterpolantFactoryMethodDiscrete(e){return new Oa(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Ua(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Na(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new Ba(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.settings=this.settings),t}setInterpolation(e){let t;switch(e){case ks:t=this.InterpolantFactoryMethodDiscrete;break;case ga:t=this.InterpolantFactoryMethodLinear;break;case ia:t=this.InterpolantFactoryMethodSmooth;break;case bl:t=this.InterpolantFactoryMethodBezier;break}if(t===void 0){let i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(i);return Ce("KeyframeTrack:",i),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return ks;case this.InterpolantFactoryMethodLinear:return ga;case this.InterpolantFactoryMethodSmooth:return ia;case this.InterpolantFactoryMethodBezier:return bl}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let i=0,s=t.length;i!==s;++i)t[i]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let i=0,s=t.length;i!==s;++i)t[i]*=e}return this}trim(e,t){let i=this.times,s=i.length,r=0,a=s-1;for(;r!==s&&i[r]<e;)++r;for(;a!==-1&&i[a]>t;)--a;if(++a,r!==0||a!==s){r>=a&&(a=Math.max(a,1),r=a-1);let o=this.getValueSize();this.times=i.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(Re("KeyframeTrack: Invalid value size in track.",this),e=!1);let i=this.times,s=this.values,r=i.length;r===0&&(Re("KeyframeTrack: Track is empty.",this),e=!1);let a=null;for(let o=0;o!==r;o++){let l=i[o];if(typeof l=="number"&&isNaN(l)){Re("KeyframeTrack: Time is not a valid number.",this,o,l),e=!1;break}if(a!==null&&a>l){Re("KeyframeTrack: Out of order keys.",this,o,l,a),e=!1;break}a=l}if(s!==void 0&&Md(s))for(let o=0,l=s.length;o!==l;++o){let c=s[o];if(isNaN(c)){Re("KeyframeTrack: Value is not a valid number.",this,o,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),i=this.getValueSize(),s=this.getInterpolation()===ia,r=e.length-1,a=1;for(let o=1;o<r;++o){let l=!1,c=e[o],h=e[o+1];if(c!==h&&(o!==1||c!==e[0]))if(s)l=!0;else{let d=o*i,u=d-i,f=d+i;for(let g=0;g!==i;++g){let S=t[d+g];if(S!==t[u+g]||S!==t[f+g]){l=!0;break}}}if(l){if(o!==a){e[a]=e[o];let d=o*i,u=a*i;for(let f=0;f!==i;++f)t[u+f]=t[d+f]}++a}}if(r>0){e[a]=e[r];for(let o=r*i,l=a*i,c=0;c!==i;++c)t[l+c]=t[o+c];++a}return a!==e.length?(this.times=e.slice(0,a),this.values=t.slice(0,a*i)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),i=this.constructor,s=new i(this.name,e,t);return s.createInterpolant=this.createInterpolant,s}};nn.prototype.ValueTypeName="";nn.prototype.TimeBufferType=Float32Array;nn.prototype.ValueBufferType=Float32Array;nn.prototype.DefaultInterpolation=ga;var ui=class extends nn{constructor(e,t,i){super(e,t,i)}};ui.prototype.ValueTypeName="bool";ui.prototype.ValueBufferType=Array;ui.prototype.DefaultInterpolation=ks;ui.prototype.InterpolantFactoryMethodLinear=void 0;ui.prototype.InterpolantFactoryMethodSmooth=void 0;var ka=class extends nn{constructor(e,t,i,s){super(e,t,i,s)}};ka.prototype.ValueTypeName="color";var za=class extends nn{constructor(e,t,i,s){super(e,t,i,s)}};za.prototype.ValueTypeName="number";var Ha=class extends hi{constructor(e,t,i,s){super(e,t,i,s)}interpolate_(e,t,i,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(i-t)/(s-t),c=e*o;for(let h=c+o;c!==h;c+=4)wn.slerpFlat(r,0,a,c-o,a,c,l);return r}},or=class extends nn{constructor(e,t,i,s){super(e,t,i,s)}InterpolantFactoryMethodLinear(e){return new Ha(this.times,this.values,this.getValueSize(),e)}};or.prototype.ValueTypeName="quaternion";or.prototype.InterpolantFactoryMethodSmooth=void 0;var di=class extends nn{constructor(e,t,i){super(e,t,i)}};di.prototype.ValueTypeName="string";di.prototype.ValueBufferType=Array;di.prototype.DefaultInterpolation=ks;di.prototype.InterpolantFactoryMethodLinear=void 0;di.prototype.InterpolantFactoryMethodSmooth=void 0;var Va=class extends nn{constructor(e,t,i,s){super(e,t,i,s)}};Va.prototype.ValueTypeName="vector";var sa={enabled:!1,files:{},add:function(n,e){this.enabled!==!1&&(Sh(n)||(this.files[n]=e))},get:function(n){if(this.enabled!==!1&&!Sh(n))return this.files[n]},remove:function(n){delete this.files[n]},clear:function(){this.files={}}};function Sh(n){try{let e=n.slice(n.indexOf(":")+1);return new URL(e).protocol==="blob:"}catch{return!1}}var Ga=class{constructor(e,t,i){let s=this,r=!1,a=0,o=0,l,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=i,this._abortController=null,this.itemStart=function(h){o++,r===!1&&s.onStart!==void 0&&s.onStart(h,a,o),r=!0},this.itemEnd=function(h){a++,s.onProgress!==void 0&&s.onProgress(h,a,o),a===o&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,d){return c.push(h,d),this},this.removeHandler=function(h){let d=c.indexOf(h);return d!==-1&&c.splice(d,2),this},this.getHandler=function(h){for(let d=0,u=c.length;d<u;d+=2){let f=c[d],g=c[d+1];if(f.global&&(f.lastIndex=0),f.test(h))return g}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},mu=new Ga,ys=class{constructor(e){this.manager=e!==void 0?e:mu,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(e,t){let i=this;return new Promise(function(s,r){i.load(e,s,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};ys.DEFAULT_MATERIAL_NAME="__DEFAULT";var es=new WeakMap,Wa=class extends ys{constructor(e){super(e)}load(e,t,i,s){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let r=this,a=sa.get(`image:${e}`);if(a!==void 0){if(a.complete===!0)r.manager.itemStart(e),setTimeout(function(){t&&t(a),r.manager.itemEnd(e)},0);else{let d=es.get(a);d===void 0&&(d=[],es.set(a,d)),d.push({onLoad:t,onError:s})}return a}let o=rs("img");function l(){h(),t&&t(this);let d=es.get(this)||[];for(let u=0;u<d.length;u++){let f=d[u];f.onLoad&&f.onLoad(this)}es.delete(this),r.manager.itemEnd(e)}function c(d){h(),s&&s(d),sa.remove(`image:${e}`);let u=es.get(this)||[];for(let f=0;f<u.length;f++){let g=u[f];g.onError&&g.onError(d)}es.delete(this),r.manager.itemError(e),r.manager.itemEnd(e)}function h(){o.removeEventListener("load",l,!1),o.removeEventListener("error",c,!1)}return o.addEventListener("load",l,!1),o.addEventListener("error",c,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(o.crossOrigin=this.crossOrigin),sa.add(`image:${e}`,o),r.manager.itemStart(e),o.src=e,o}};var lr=class extends ys{constructor(e){super(e)}load(e,t,i,s){let r=new It,a=new Wa(this.manager);return a.setCrossOrigin(this.crossOrigin),a.setPath(this.path),a.load(e,function(o){r.image=o,r.needsUpdate=!0,t!==void 0&&t(r)},i,s),r}};var ta=new C,na=new wn,Sn=new C,cr=class extends Xt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ut,this.projectionMatrix=new ut,this.projectionMatrixInverse=new ut,this.coordinateSystem=un,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(ta,na,Sn),Sn.x===1&&Sn.y===1&&Sn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ta,na,Sn.set(1,1,1)).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorld.decompose(ta,na,Sn),Sn.x===1&&Sn.y===1&&Sn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ta,na,Sn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},ri=new C,Mh=new ge,bh=new ge,Gt=class extends cr{constructor(e=50,t=1,i=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=ya*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Zo*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return ya*2*Math.atan(Math.tan(Zo*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){ri.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(ri.x,ri.y).multiplyScalar(-e/ri.z),ri.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(ri.x,ri.y).multiplyScalar(-e/ri.z)}getViewSize(e,t){return this.getViewBounds(e,Mh,bh),t.subVectors(bh,Mh)}setViewOffset(e,t,i,s,r,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Zo*.5*this.fov)/this.zoom,i=2*t,s=this.aspect*i,r=-.5*s,a=this.view;if(this.view!==null&&this.view.enabled){let l=a.fullWidth,c=a.fullHeight;r+=a.offsetX*s/l,t-=a.offsetY*i/c,s*=a.width/l,i*=a.height/c}let o=this.filmOffset;o!==0&&(r+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-i,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}};var fi=class extends cr{constructor(e=-1,t=1,i=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=i-e,a=i+e,o=s+t,l=s-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,a=r+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}};var ts=-90,ns=1,Xa=class extends Xt{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Gt(ts,ns,e,t);s.layers=this.layers,this.add(s);let r=new Gt(ts,ns,e,t);r.layers=this.layers,this.add(r);let a=new Gt(ts,ns,e,t);a.layers=this.layers,this.add(a);let o=new Gt(ts,ns,e,t);o.layers=this.layers,this.add(o);let l=new Gt(ts,ns,e,t);l.layers=this.layers,this.add(l);let c=new Gt(ts,ns,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[i,s,r,a,o,l]=t;for(let c of t)this.remove(c);if(e===un)i.up.set(0,1,0),i.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===Vs)i.up.set(0,-1,0),i.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,a,o,l,c,h]=this.children,d=e.getRenderTarget(),u=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;let S=i.texture.generateMipmaps;i.texture.generateMipmaps=!1;let p=!1;e.isWebGLRenderer===!0?p=e.state.buffers.depth.getReversed():p=e.reversedDepthBuffer,e.setRenderTarget(i,0,s),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,r),e.setRenderTarget(i,1,s),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(i,2,s),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(i,3,s),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(i,4,s),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),i.texture.generateMipmaps=S,e.setRenderTarget(i,5,s),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,h),e.setRenderTarget(d,u,f),e.xr.enabled=g,i.texture.needsPMREMUpdate=!0}},qa=class extends Gt{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}};var rc="\\[\\]\\.:\\/",_f=new RegExp("["+rc+"]","g"),ac="[^"+rc+"]",xf="[^"+rc.replace("\\.","")+"]",yf=/((?:WC+[\/:])*)/.source.replace("WC",ac),vf=/(WCOD+)?/.source.replace("WCOD",xf),Sf=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",ac),Mf=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",ac),bf=new RegExp("^"+yf+vf+Sf+Mf+"$"),Tf=["material","materials","bones","map"],Dl=class{constructor(e,t,i){let s=i||ct.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,s)}getValue(e,t){this.bind();let i=this._targetGroup.nCachedObjects_,s=this._bindings[i];s!==void 0&&s.getValue(e,t)}setValue(e,t){let i=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=i.length;s!==r;++s)i[s].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].unbind()}},ct=class n{constructor(e,t,i){this.path=t,this.parsedPath=i||n.parseTrackName(t),this.node=n.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,i){return e&&e.isAnimationObjectGroup?new n.Composite(e,t,i):new n(e,t,i)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(_f,"")}static parseTrackName(e){let t=bf.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let i={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},s=i.nodeName&&i.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=i.nodeName.substring(s+1);Tf.indexOf(r)!==-1&&(i.nodeName=i.nodeName.substring(0,s),i.objectName=r)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return i}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let i=e.skeleton.getBoneByName(t);if(i!==void 0)return i}if(e.children){let i=function(r){for(let a=0;a<r.length;a++){let o=r[a];if(o.name===t||o.uuid===t)return o;let l=i(o.children);if(l)return l}return null},s=i(e.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)e[t++]=i[s]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,i=t.objectName,s=t.propertyName,r=t.propertyIndex;if(e||(e=n.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){Ce("PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let c=t.objectIndex;switch(i){case"materials":if(!e.material){Re("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){Re("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){Re("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===c){c=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){Re("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){Re("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[i]===void 0){Re("PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[i]}if(c!==void 0){if(e[c]===void 0){Re("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}let a=e[s];if(a===void 0){let c=t.nodeName;Re("PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",e);return}let o=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?o=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!e.geometry){Re("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){Re("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};ct.Composite=Dl;ct.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};ct.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};ct.prototype.GetterByBindingType=[ct.prototype._getValue_direct,ct.prototype._getValue_array,ct.prototype._getValue_arrayElement,ct.prototype._getValue_toArray];ct.prototype.SetterByBindingTypeAndVersioning=[[ct.prototype._setValue_direct,ct.prototype._setValue_direct_setNeedsUpdate,ct.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[ct.prototype._setValue_array,ct.prototype._setValue_array_setNeedsUpdate,ct.prototype._setValue_array_setMatrixWorldNeedsUpdate],[ct.prototype._setValue_arrayElement,ct.prototype._setValue_arrayElement_setNeedsUpdate,ct.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[ct.prototype._setValue_fromArray,ct.prototype._setValue_fromArray_setNeedsUpdate,ct.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var Ix=new Float32Array(1);var Th=new ut,vs=class{constructor(e,t,i=0,s=1/0){this.ray=new us(e,t),this.near=i,this.far=s,this.camera=null,this.layers=new ls,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,(t.near+t.far)/(t.near-t.far)).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):Re("Raycaster: Unsupported camera type: "+t.type)}setFromXRController(e){return Th.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Th),this}intersectObject(e,t=!0,i=[]){return Ll(e,this,i,t),i.sort(Eh),i}intersectObjects(e,t=!0,i=[]){for(let s=0,r=e.length;s<r;s++)Ll(e[s],this,i,t);return i.sort(Eh),i}};function Eh(n,e){return n.distance-e.distance}function Ll(n,e,t,i){let s=!0;if(n.layers.test(e.layers)&&n.raycast(e,t)===!1&&(s=!1),s===!0&&i===!0){let r=n.children;for(let a=0,o=r.length;a<o;a++)Ll(r[a],e,t,!0)}}var Fl=class n{static{n.prototype.isMatrix2=!0}constructor(e,t,i,s){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,i,s)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let i=0;i<4;i++)this.elements[i]=e[i+t];return this}set(e,t,i,s){let r=this.elements;return r[0]=e,r[2]=t,r[1]=i,r[3]=s,this}};function oc(n,e,t,i){let s=Ef(i);switch(t){case jl:return n*e;case ec:return n*e/s.components*s.byteLength;case Qa:return n*e/s.components*s.byteLength;case gi:return n*e*2/s.components*s.byteLength;case eo:return n*e*2/s.components*s.byteLength;case Ql:return n*e*3/s.components*s.byteLength;case on:return n*e*4/s.components*s.byteLength;case to:return n*e*4/s.components*s.byteLength;case fr:case pr:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case mr:case gr:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case io:case ro:return Math.max(n,16)*Math.max(e,8)/4;case no:case so:return Math.max(n,8)*Math.max(e,8)/2;case ao:case oo:case co:case ho:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case lo:case _r:case uo:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case fo:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case po:return Math.floor((n+4)/5)*Math.floor((e+3)/4)*16;case mo:return Math.floor((n+4)/5)*Math.floor((e+4)/5)*16;case go:return Math.floor((n+5)/6)*Math.floor((e+4)/5)*16;case _o:return Math.floor((n+5)/6)*Math.floor((e+5)/6)*16;case xo:return Math.floor((n+7)/8)*Math.floor((e+4)/5)*16;case yo:return Math.floor((n+7)/8)*Math.floor((e+5)/6)*16;case vo:return Math.floor((n+7)/8)*Math.floor((e+7)/8)*16;case So:return Math.floor((n+9)/10)*Math.floor((e+4)/5)*16;case Mo:return Math.floor((n+9)/10)*Math.floor((e+5)/6)*16;case bo:return Math.floor((n+9)/10)*Math.floor((e+7)/8)*16;case To:return Math.floor((n+9)/10)*Math.floor((e+9)/10)*16;case Eo:return Math.floor((n+11)/12)*Math.floor((e+9)/10)*16;case wo:return Math.floor((n+11)/12)*Math.floor((e+11)/12)*16;case Ao:case Co:case Ro:return Math.ceil(n/4)*Math.ceil(e/4)*16;case Io:case Po:return Math.ceil(n/4)*Math.ceil(e/4)*8;case xr:case Do:return Math.ceil(n/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function Ef(n){switch(n){case sn:case $l:return{byteLength:1,components:1};case Ms:case Zl:case In:return{byteLength:2,components:1};case Ka:case ja:return{byteLength:2,components:4};case mn:case Ja:case gn:return{byteLength:4,components:1};case Jl:case Kl:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${n}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"184"}}));typeof window<"u"&&(window.__THREE__?Ce("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="184");function Bu(){let n=null,e=!1,t=null,i=null;function s(r,a){t(r,a),i=n.requestAnimationFrame(s)}return{start:function(){e!==!0&&t!==null&&n!==null&&(i=n.requestAnimationFrame(s),e=!0)},stop:function(){n!==null&&n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){n=r}}}function Af(n){let e=new WeakMap;function t(o,l){let c=o.array,h=o.usage,d=c.byteLength,u=n.createBuffer();n.bindBuffer(l,u),n.bufferData(l,c,h),o.onUploadCallback();let f;if(c instanceof Float32Array)f=n.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)f=n.HALF_FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?f=n.HALF_FLOAT:f=n.UNSIGNED_SHORT;else if(c instanceof Int16Array)f=n.SHORT;else if(c instanceof Uint32Array)f=n.UNSIGNED_INT;else if(c instanceof Int32Array)f=n.INT;else if(c instanceof Int8Array)f=n.BYTE;else if(c instanceof Uint8Array)f=n.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)f=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:u,type:f,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:d}}function i(o,l,c){let h=l.array,d=l.updateRanges;if(n.bindBuffer(c,o),d.length===0)n.bufferSubData(c,0,h);else{d.sort((f,g)=>f.start-g.start);let u=0;for(let f=1;f<d.length;f++){let g=d[u],S=d[f];S.start<=g.start+g.count+1?g.count=Math.max(g.count,S.start+S.count-g.start):(++u,d[u]=S)}d.length=u+1;for(let f=0,g=d.length;f<g;f++){let S=d[f];n.bufferSubData(c,S.start*h.BYTES_PER_ELEMENT,h,S.start,S.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);let l=e.get(o);l&&(n.deleteBuffer(l.buffer),e.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let h=e.get(o);(!h||h.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let c=e.get(o);if(c===void 0)e.set(o,t(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,o,l),c.version=o.version}}return{get:s,remove:r,update:a}}var Cf=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Rf=`#ifdef USE_ALPHAHASH
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
#endif`,If=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Pf=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Df=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Lf=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Ff=`#ifdef USE_AOMAP
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
#endif`,Nf=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Uf=`#ifdef USE_BATCHING
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
#endif`,Of=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Bf=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,kf=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,zf=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,Hf=`#ifdef USE_IRIDESCENCE
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
#endif`,Vf=`#ifdef USE_BUMPMAP
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
#endif`,Gf=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,Wf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Xf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,qf=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Yf=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,$f=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Zf=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,Jf=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,Kf=`#define PI 3.141592653589793
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
} // validated`,jf=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,Qf=`vec3 transformedNormal = objectNormal;
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
#endif`,ep=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,tp=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,np=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,ip=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,sp="gl_FragColor = linearToOutputTexel( gl_FragColor );",rp=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,ap=`#ifdef USE_ENVMAP
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
#endif`,op=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,lp=`#ifdef USE_ENVMAP
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
#endif`,cp=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS

		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,hp=`#ifdef USE_ENVMAP
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
#endif`,up=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,dp=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,fp=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,pp=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,mp=`#ifdef USE_GRADIENTMAP
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
}`,gp=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,_p=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,xp=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,yp=`uniform bool receiveShadow;
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
#include <lightprobes_pars_fragment>`,vp=`#ifdef USE_ENVMAP
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
#endif`,Sp=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Mp=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,bp=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Tp=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Ep=`PhysicalMaterial material;
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
#endif`,wp=`uniform sampler2D dfgLUT;
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
}`,Ap=`
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
#endif`,Cp=`#if defined( RE_IndirectDiffuse )
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
#endif`,Rp=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Ip=`#ifdef USE_LIGHT_PROBES_GRID
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
#endif`,Pp=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Dp=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Lp=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Fp=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Np=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Up=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Op=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,Bp=`#if defined( USE_POINTS_UV )
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
#endif`,kp=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,zp=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Hp=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Vp=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Gp=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Wp=`#ifdef USE_MORPHTARGETS
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
#endif`,Xp=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,qp=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,Yp=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,$p=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Zp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Jp=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Kp=`#ifdef USE_NORMALMAP
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
#endif`,jp=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Qp=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,em=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,tm=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,nm=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,im=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,sm=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,rm=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,am=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,om=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,lm=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,cm=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,hm=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,um=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,dm=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,fm=`float getShadowMask() {
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
}`,pm=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,mm=`#ifdef USE_SKINNING
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
#endif`,gm=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,_m=`#ifdef USE_SKINNING
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
#endif`,xm=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,ym=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,vm=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Sm=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,Mm=`#ifdef USE_TRANSMISSION
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
#endif`,bm=`#ifdef USE_TRANSMISSION
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
#endif`,Tm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Em=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,wm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Am=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,Cm=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Rm=`uniform sampler2D t2D;
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
}`,Im=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Pm=`#ifdef ENVMAP_TYPE_CUBE
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
}`,Dm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Lm=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Fm=`#include <common>
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
}`,Nm=`#if DEPTH_PACKING == 3200
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
}`,Um=`#define DISTANCE
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
}`,Om=`#define DISTANCE
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
}`,Bm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,km=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,zm=`uniform float scale;
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
}`,Hm=`uniform vec3 diffuse;
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
}`,Vm=`#include <common>
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
}`,Gm=`uniform vec3 diffuse;
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
}`,Wm=`#define LAMBERT
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
}`,Xm=`#define LAMBERT
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
}`,qm=`#define MATCAP
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
}`,Ym=`#define MATCAP
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
}`,$m=`#define NORMAL
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
}`,Zm=`#define NORMAL
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
}`,Jm=`#define PHONG
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
}`,Km=`#define PHONG
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
}`,jm=`#define STANDARD
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
}`,Qm=`#define STANDARD
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
}`,eg=`#define TOON
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
}`,tg=`#define TOON
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
}`,ng=`uniform float size;
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
}`,ig=`uniform vec3 diffuse;
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
}`,sg=`#include <common>
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
}`,rg=`uniform vec3 color;
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
}`,ag=`uniform float rotation;
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
}`,og=`uniform vec3 diffuse;
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
}`,ke={alphahash_fragment:Cf,alphahash_pars_fragment:Rf,alphamap_fragment:If,alphamap_pars_fragment:Pf,alphatest_fragment:Df,alphatest_pars_fragment:Lf,aomap_fragment:Ff,aomap_pars_fragment:Nf,batching_pars_vertex:Uf,batching_vertex:Of,begin_vertex:Bf,beginnormal_vertex:kf,bsdfs:zf,iridescence_fragment:Hf,bumpmap_pars_fragment:Vf,clipping_planes_fragment:Gf,clipping_planes_pars_fragment:Wf,clipping_planes_pars_vertex:Xf,clipping_planes_vertex:qf,color_fragment:Yf,color_pars_fragment:$f,color_pars_vertex:Zf,color_vertex:Jf,common:Kf,cube_uv_reflection_fragment:jf,defaultnormal_vertex:Qf,displacementmap_pars_vertex:ep,displacementmap_vertex:tp,emissivemap_fragment:np,emissivemap_pars_fragment:ip,colorspace_fragment:sp,colorspace_pars_fragment:rp,envmap_fragment:ap,envmap_common_pars_fragment:op,envmap_pars_fragment:lp,envmap_pars_vertex:cp,envmap_physical_pars_fragment:vp,envmap_vertex:hp,fog_vertex:up,fog_pars_vertex:dp,fog_fragment:fp,fog_pars_fragment:pp,gradientmap_pars_fragment:mp,lightmap_pars_fragment:gp,lights_lambert_fragment:_p,lights_lambert_pars_fragment:xp,lights_pars_begin:yp,lights_toon_fragment:Sp,lights_toon_pars_fragment:Mp,lights_phong_fragment:bp,lights_phong_pars_fragment:Tp,lights_physical_fragment:Ep,lights_physical_pars_fragment:wp,lights_fragment_begin:Ap,lights_fragment_maps:Cp,lights_fragment_end:Rp,lightprobes_pars_fragment:Ip,logdepthbuf_fragment:Pp,logdepthbuf_pars_fragment:Dp,logdepthbuf_pars_vertex:Lp,logdepthbuf_vertex:Fp,map_fragment:Np,map_pars_fragment:Up,map_particle_fragment:Op,map_particle_pars_fragment:Bp,metalnessmap_fragment:kp,metalnessmap_pars_fragment:zp,morphinstance_vertex:Hp,morphcolor_vertex:Vp,morphnormal_vertex:Gp,morphtarget_pars_vertex:Wp,morphtarget_vertex:Xp,normal_fragment_begin:qp,normal_fragment_maps:Yp,normal_pars_fragment:$p,normal_pars_vertex:Zp,normal_vertex:Jp,normalmap_pars_fragment:Kp,clearcoat_normal_fragment_begin:jp,clearcoat_normal_fragment_maps:Qp,clearcoat_pars_fragment:em,iridescence_pars_fragment:tm,opaque_fragment:nm,packing:im,premultiplied_alpha_fragment:sm,project_vertex:rm,dithering_fragment:am,dithering_pars_fragment:om,roughnessmap_fragment:lm,roughnessmap_pars_fragment:cm,shadowmap_pars_fragment:hm,shadowmap_pars_vertex:um,shadowmap_vertex:dm,shadowmask_pars_fragment:fm,skinbase_vertex:pm,skinning_pars_vertex:mm,skinning_vertex:gm,skinnormal_vertex:_m,specularmap_fragment:xm,specularmap_pars_fragment:ym,tonemapping_fragment:vm,tonemapping_pars_fragment:Sm,transmission_fragment:Mm,transmission_pars_fragment:bm,uv_pars_fragment:Tm,uv_pars_vertex:Em,uv_vertex:wm,worldpos_vertex:Am,background_vert:Cm,background_frag:Rm,backgroundCube_vert:Im,backgroundCube_frag:Pm,cube_vert:Dm,cube_frag:Lm,depth_vert:Fm,depth_frag:Nm,distance_vert:Um,distance_frag:Om,equirect_vert:Bm,equirect_frag:km,linedashed_vert:zm,linedashed_frag:Hm,meshbasic_vert:Vm,meshbasic_frag:Gm,meshlambert_vert:Wm,meshlambert_frag:Xm,meshmatcap_vert:qm,meshmatcap_frag:Ym,meshnormal_vert:$m,meshnormal_frag:Zm,meshphong_vert:Jm,meshphong_frag:Km,meshphysical_vert:jm,meshphysical_frag:Qm,meshtoon_vert:eg,meshtoon_frag:tg,points_vert:ng,points_frag:ig,shadow_vert:sg,shadow_frag:rg,sprite_vert:ag,sprite_frag:og},le={common:{diffuse:{value:new Ze(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Le},alphaMap:{value:null},alphaMapTransform:{value:new Le},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Le}},envmap:{envMap:{value:null},envMapRotation:{value:new Le},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Le}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Le}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Le},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Le},normalScale:{value:new ge(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Le},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Le}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Le}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Le}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ze(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new C},probesMax:{value:new C},probesResolution:{value:new C}},points:{diffuse:{value:new Ze(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Le},alphaTest:{value:0},uvTransform:{value:new Le}},sprite:{diffuse:{value:new Ze(16777215)},opacity:{value:1},center:{value:new ge(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Le},alphaMap:{value:null},alphaMapTransform:{value:new Le},alphaTest:{value:0}}},Dn={basic:{uniforms:kt([le.common,le.specularmap,le.envmap,le.aomap,le.lightmap,le.fog]),vertexShader:ke.meshbasic_vert,fragmentShader:ke.meshbasic_frag},lambert:{uniforms:kt([le.common,le.specularmap,le.envmap,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.fog,le.lights,{emissive:{value:new Ze(0)},envMapIntensity:{value:1}}]),vertexShader:ke.meshlambert_vert,fragmentShader:ke.meshlambert_frag},phong:{uniforms:kt([le.common,le.specularmap,le.envmap,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.fog,le.lights,{emissive:{value:new Ze(0)},specular:{value:new Ze(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:ke.meshphong_vert,fragmentShader:ke.meshphong_frag},standard:{uniforms:kt([le.common,le.envmap,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.roughnessmap,le.metalnessmap,le.fog,le.lights,{emissive:{value:new Ze(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:ke.meshphysical_vert,fragmentShader:ke.meshphysical_frag},toon:{uniforms:kt([le.common,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.gradientmap,le.fog,le.lights,{emissive:{value:new Ze(0)}}]),vertexShader:ke.meshtoon_vert,fragmentShader:ke.meshtoon_frag},matcap:{uniforms:kt([le.common,le.bumpmap,le.normalmap,le.displacementmap,le.fog,{matcap:{value:null}}]),vertexShader:ke.meshmatcap_vert,fragmentShader:ke.meshmatcap_frag},points:{uniforms:kt([le.points,le.fog]),vertexShader:ke.points_vert,fragmentShader:ke.points_frag},dashed:{uniforms:kt([le.common,le.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:ke.linedashed_vert,fragmentShader:ke.linedashed_frag},depth:{uniforms:kt([le.common,le.displacementmap]),vertexShader:ke.depth_vert,fragmentShader:ke.depth_frag},normal:{uniforms:kt([le.common,le.bumpmap,le.normalmap,le.displacementmap,{opacity:{value:1}}]),vertexShader:ke.meshnormal_vert,fragmentShader:ke.meshnormal_frag},sprite:{uniforms:kt([le.sprite,le.fog]),vertexShader:ke.sprite_vert,fragmentShader:ke.sprite_frag},background:{uniforms:{uvTransform:{value:new Le},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:ke.background_vert,fragmentShader:ke.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Le}},vertexShader:ke.backgroundCube_vert,fragmentShader:ke.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:ke.cube_vert,fragmentShader:ke.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:ke.equirect_vert,fragmentShader:ke.equirect_frag},distance:{uniforms:kt([le.common,le.displacementmap,{referencePosition:{value:new C},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:ke.distance_vert,fragmentShader:ke.distance_frag},shadow:{uniforms:kt([le.lights,le.fog,{color:{value:new Ze(0)},opacity:{value:1}}]),vertexShader:ke.shadow_vert,fragmentShader:ke.shadow_frag}};Dn.physical={uniforms:kt([Dn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Le},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Le},clearcoatNormalScale:{value:new ge(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Le},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Le},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Le},sheen:{value:0},sheenColor:{value:new Ze(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Le},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Le},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Le},transmissionSamplerSize:{value:new ge},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Le},attenuationDistance:{value:0},attenuationColor:{value:new Ze(0)},specularColor:{value:new Ze(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Le},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Le},anisotropyVector:{value:new ge},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Le}}]),vertexShader:ke.meshphysical_vert,fragmentShader:ke.meshphysical_frag};var No={r:0,b:0,g:0},lg=new ut,ku=new Le;ku.set(-1,0,0,0,1,0,0,0,1);function cg(n,e,t,i,s,r){let a=new Ze(0),o=s===!0?0:1,l,c,h=null,d=0,u=null;function f(x){let M=x.isScene===!0?x.background:null;if(M&&M.isTexture){let b=x.backgroundBlurriness>0;M=e.get(M,b)}return M}function g(x){let M=!1,b=f(x);b===null?p(a,o):b&&b.isColor&&(p(b,1),M=!0);let A=n.xr.getEnvironmentBlendMode();A==="additive"?t.buffers.color.setClear(0,0,0,1,r):A==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,r),(n.autoClear||M)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function S(x,M){let b=f(M);b&&(b.isCubeTexture||b.mapping===ur)?(c===void 0&&(c=new ht(new fs(1,1,1),new tn({name:"BackgroundCubeMaterial",uniforms:Li(Dn.backgroundCube.uniforms),vertexShader:Dn.backgroundCube.vertexShader,fragmentShader:Dn.backgroundCube.fragmentShader,side:Ht,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(A,E,I){this.matrixWorld.copyPosition(I.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(c)),c.material.uniforms.envMap.value=b,c.material.uniforms.backgroundBlurriness.value=M.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(lg.makeRotationFromEuler(M.backgroundRotation)).transpose(),b.isCubeTexture&&b.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(ku),c.material.toneMapped=Xe.getTransfer(b.colorSpace)!==Ke,(h!==b||d!==b.version||u!==n.toneMapping)&&(c.material.needsUpdate=!0,h=b,d=b.version,u=n.toneMapping),c.layers.enableAll(),x.unshift(c,c.geometry,c.material,0,0,null)):b&&b.isTexture&&(l===void 0&&(l=new ht(new en(2,2),new tn({name:"BackgroundMaterial",uniforms:Li(Dn.background.uniforms),vertexShader:Dn.background.vertexShader,fragmentShader:Dn.background.fragmentShader,side:Gn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(l)),l.material.uniforms.t2D.value=b,l.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,l.material.toneMapped=Xe.getTransfer(b.colorSpace)!==Ke,b.matrixAutoUpdate===!0&&b.updateMatrix(),l.material.uniforms.uvTransform.value.copy(b.matrix),(h!==b||d!==b.version||u!==n.toneMapping)&&(l.material.needsUpdate=!0,h=b,d=b.version,u=n.toneMapping),l.layers.enableAll(),x.unshift(l,l.geometry,l.material,0,0,null))}function p(x,M){x.getRGB(No,sc(n)),t.buffers.color.setClear(No.r,No.g,No.b,M,r)}function m(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(x,M=1){a.set(x),o=M,p(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(x){o=x,p(a,o)},render:g,addToRenderList:S,dispose:m}}function hg(n,e){let t=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},s=u(null),r=s,a=!1;function o(R,O,G,X,N){let z=!1,V=d(R,X,G,O);r!==V&&(r=V,c(r.object)),z=f(R,X,G,N),z&&g(R,X,G,N),N!==null&&e.update(N,n.ELEMENT_ARRAY_BUFFER),(z||a)&&(a=!1,b(R,O,G,X),N!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(N).buffer))}function l(){return n.createVertexArray()}function c(R){return n.bindVertexArray(R)}function h(R){return n.deleteVertexArray(R)}function d(R,O,G,X){let N=X.wireframe===!0,z=i[O.id];z===void 0&&(z={},i[O.id]=z);let V=R.isInstancedMesh===!0?R.id:0,j=z[V];j===void 0&&(j={},z[V]=j);let Q=j[G.id];Q===void 0&&(Q={},j[G.id]=Q);let ce=Q[N];return ce===void 0&&(ce=u(l()),Q[N]=ce),ce}function u(R){let O=[],G=[],X=[];for(let N=0;N<t;N++)O[N]=0,G[N]=0,X[N]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:O,enabledAttributes:G,attributeDivisors:X,object:R,attributes:{},index:null}}function f(R,O,G,X){let N=r.attributes,z=O.attributes,V=0,j=G.getAttributes();for(let Q in j)if(j[Q].location>=0){let ye=N[Q],Te=z[Q];if(Te===void 0&&(Q==="instanceMatrix"&&R.instanceMatrix&&(Te=R.instanceMatrix),Q==="instanceColor"&&R.instanceColor&&(Te=R.instanceColor)),ye===void 0||ye.attribute!==Te||Te&&ye.data!==Te.data)return!0;V++}return r.attributesNum!==V||r.index!==X}function g(R,O,G,X){let N={},z=O.attributes,V=0,j=G.getAttributes();for(let Q in j)if(j[Q].location>=0){let ye=z[Q];ye===void 0&&(Q==="instanceMatrix"&&R.instanceMatrix&&(ye=R.instanceMatrix),Q==="instanceColor"&&R.instanceColor&&(ye=R.instanceColor));let Te={};Te.attribute=ye,ye&&ye.data&&(Te.data=ye.data),N[Q]=Te,V++}r.attributes=N,r.attributesNum=V,r.index=X}function S(){let R=r.newAttributes;for(let O=0,G=R.length;O<G;O++)R[O]=0}function p(R){m(R,0)}function m(R,O){let G=r.newAttributes,X=r.enabledAttributes,N=r.attributeDivisors;G[R]=1,X[R]===0&&(n.enableVertexAttribArray(R),X[R]=1),N[R]!==O&&(n.vertexAttribDivisor(R,O),N[R]=O)}function x(){let R=r.newAttributes,O=r.enabledAttributes;for(let G=0,X=O.length;G<X;G++)O[G]!==R[G]&&(n.disableVertexAttribArray(G),O[G]=0)}function M(R,O,G,X,N,z,V){V===!0?n.vertexAttribIPointer(R,O,G,N,z):n.vertexAttribPointer(R,O,G,X,N,z)}function b(R,O,G,X){S();let N=X.attributes,z=G.getAttributes(),V=O.defaultAttributeValues;for(let j in z){let Q=z[j];if(Q.location>=0){let ce=N[j];if(ce===void 0&&(j==="instanceMatrix"&&R.instanceMatrix&&(ce=R.instanceMatrix),j==="instanceColor"&&R.instanceColor&&(ce=R.instanceColor)),ce!==void 0){let ye=ce.normalized,Te=ce.itemSize,Ye=e.get(ce);if(Ye===void 0)continue;let je=Ye.buffer,Oe=Ye.type,Z=Ye.bytesPerElement,de=Oe===n.INT||Oe===n.UNSIGNED_INT||ce.gpuType===Ja;if(ce.isInterleavedBufferAttribute){let ie=ce.data,Ie=ie.stride,Fe=ce.offset;if(ie.isInstancedInterleavedBuffer){for(let Pe=0;Pe<Q.locationSize;Pe++)m(Q.location+Pe,ie.meshPerAttribute);R.isInstancedMesh!==!0&&X._maxInstanceCount===void 0&&(X._maxInstanceCount=ie.meshPerAttribute*ie.count)}else for(let Pe=0;Pe<Q.locationSize;Pe++)p(Q.location+Pe);n.bindBuffer(n.ARRAY_BUFFER,je);for(let Pe=0;Pe<Q.locationSize;Pe++)M(Q.location+Pe,Te/Q.locationSize,Oe,ye,Ie*Z,(Fe+Te/Q.locationSize*Pe)*Z,de)}else{if(ce.isInstancedBufferAttribute){for(let ie=0;ie<Q.locationSize;ie++)m(Q.location+ie,ce.meshPerAttribute);R.isInstancedMesh!==!0&&X._maxInstanceCount===void 0&&(X._maxInstanceCount=ce.meshPerAttribute*ce.count)}else for(let ie=0;ie<Q.locationSize;ie++)p(Q.location+ie);n.bindBuffer(n.ARRAY_BUFFER,je);for(let ie=0;ie<Q.locationSize;ie++)M(Q.location+ie,Te/Q.locationSize,Oe,ye,Te*Z,Te/Q.locationSize*ie*Z,de)}}else if(V!==void 0){let ye=V[j];if(ye!==void 0)switch(ye.length){case 2:n.vertexAttrib2fv(Q.location,ye);break;case 3:n.vertexAttrib3fv(Q.location,ye);break;case 4:n.vertexAttrib4fv(Q.location,ye);break;default:n.vertexAttrib1fv(Q.location,ye)}}}}x()}function A(){w();for(let R in i){let O=i[R];for(let G in O){let X=O[G];for(let N in X){let z=X[N];for(let V in z)h(z[V].object),delete z[V];delete X[N]}}delete i[R]}}function E(R){if(i[R.id]===void 0)return;let O=i[R.id];for(let G in O){let X=O[G];for(let N in X){let z=X[N];for(let V in z)h(z[V].object),delete z[V];delete X[N]}}delete i[R.id]}function I(R){for(let O in i){let G=i[O];for(let X in G){let N=G[X];if(N[R.id]===void 0)continue;let z=N[R.id];for(let V in z)h(z[V].object),delete z[V];delete N[R.id]}}}function y(R){for(let O in i){let G=i[O],X=R.isInstancedMesh===!0?R.id:0,N=G[X];if(N!==void 0){for(let z in N){let V=N[z];for(let j in V)h(V[j].object),delete V[j];delete N[z]}delete G[X],Object.keys(G).length===0&&delete i[O]}}}function w(){F(),a=!0,r!==s&&(r=s,c(r.object))}function F(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:w,resetDefaultState:F,dispose:A,releaseStatesOfGeometry:E,releaseStatesOfObject:y,releaseStatesOfProgram:I,initAttributes:S,enableAttribute:p,disableUnusedAttributes:x}}function ug(n,e,t){let i;function s(l){i=l}function r(l,c){n.drawArrays(i,l,c),t.update(c,i,1)}function a(l,c,h){h!==0&&(n.drawArraysInstanced(i,l,c,h),t.update(c,i,h))}function o(l,c,h){if(h===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,l,0,c,0,h);let u=0;for(let f=0;f<h;f++)u+=c[f];t.update(u,i,1)}this.setMode=s,this.render=r,this.renderInstances=a,this.renderMultiDraw=o}function dg(n,e,t,i){let s;function r(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){let I=e.get("EXT_texture_filter_anisotropic");s=n.getParameter(I.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function a(I){return!(I!==on&&i.convert(I)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(I){let y=I===In&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(I!==sn&&i.convert(I)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE)&&I!==gn&&!y)}function l(I){if(I==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";I="mediump"}return I==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp",h=l(c);h!==c&&(Ce("WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);let d=t.logarithmicDepthBuffer===!0,u=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control");t.reversedDepthBuffer===!0&&u===!1&&Ce("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let f=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),g=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),S=n.getParameter(n.MAX_TEXTURE_SIZE),p=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),m=n.getParameter(n.MAX_VERTEX_ATTRIBS),x=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),M=n.getParameter(n.MAX_VARYING_VECTORS),b=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),A=n.getParameter(n.MAX_SAMPLES),E=n.getParameter(n.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:d,reversedDepthBuffer:u,maxTextures:f,maxVertexTextures:g,maxTextureSize:S,maxCubemapSize:p,maxAttributes:m,maxVertexUniforms:x,maxVaryings:M,maxFragmentUniforms:b,maxSamples:A,samples:E}}function fg(n){let e=this,t=null,i=0,s=!1,r=!1,a=new Mn,o=new Le,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(d,u){let f=d.length!==0||u||i!==0||s;return s=u,i=d.length,f},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(d,u){t=h(d,u,0)},this.setState=function(d,u,f){let g=d.clippingPlanes,S=d.clipIntersection,p=d.clipShadows,m=n.get(d);if(!s||g===null||g.length===0||r&&!p)r?h(null):c();else{let x=r?0:i,M=x*4,b=m.clippingState||null;l.value=b,b=h(g,u,M,f);for(let A=0;A!==M;++A)b[A]=t[A];m.clippingState=b,this.numIntersection=S?this.numPlanes:0,this.numPlanes+=x}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function h(d,u,f,g){let S=d!==null?d.length:0,p=null;if(S!==0){if(p=l.value,g!==!0||p===null){let m=f+S*4,x=u.matrixWorldInverse;o.getNormalMatrix(x),(p===null||p.length<m)&&(p=new Float32Array(m));for(let M=0,b=f;M!==S;++M,b+=4)a.copy(d[M]).applyMatrix4(x,o),a.normal.toArray(p,b),p[b+3]=a.constant}l.value=p,l.needsUpdate=!0}return e.numPlanes=S,e.numIntersection=0,p}}var _i=4,gu=[.125,.215,.35,.446,.526,.582],Fi=20,pg=256,yr=new fi,_u=new Ze,lc=null,cc=0,hc=0,uc=!1,mg=new C,Oo=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._sigmas=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,i=.1,s=100,r={}){let{size:a=256,position:o=mg}=r;lc=this._renderer.getRenderTarget(),cc=this._renderer.getActiveCubeFace(),hc=this._renderer.getActiveMipmapLevel(),uc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);let l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,i,s,l,o),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=vu(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=yu(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(lc,cc,hc),this._renderer.xr.enabled=uc,e.scissorTest=!1,Ts(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===pi||e.mapping===Di?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),lc=this._renderer.getRenderTarget(),cc=this._renderer.getActiveCubeFace(),hc=this._renderer.getActiveMipmapLevel(),uc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:we,minFilter:we,generateMipmaps:!1,type:In,format:on,colorSpace:zs,depthBuffer:!1},s=xu(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=xu(e,t,i);let{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods,sigmas:this._sigmas}=gg(r)),this._blurMaterial=xg(r,e,t),this._ggxMaterial=_g(r,e,t)}return s}_compileMaterial(e){let t=new ht(new ot,e);this._renderer.compile(t,yr)}_sceneToCubeUV(e,t,i,s,r){let l=new Gt(90,1,t,i),c=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],d=this._renderer,u=d.autoClear,f=d.toneMapping;d.getClearColor(_u),d.toneMapping=fn,d.autoClear=!1,d.state.buffers.depth.getReversed()&&(d.setRenderTarget(s),d.clearDepth(),d.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new ht(new fs,new Dt({name:"PMREM.Background",side:Ht,depthWrite:!1,depthTest:!1})));let S=this._backgroundBox,p=S.material,m=!1,x=e.background;x?x.isColor&&(p.color.copy(x),e.background=null,m=!0):(p.color.copy(_u),m=!0);for(let M=0;M<6;M++){let b=M%3;b===0?(l.up.set(0,c[M],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x+h[M],r.y,r.z)):b===1?(l.up.set(0,0,c[M]),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y+h[M],r.z)):(l.up.set(0,c[M],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y,r.z+h[M]));let A=this._cubeSize;Ts(s,b*A,M>2?A:0,A,A),d.setRenderTarget(s),m&&d.render(S,l),d.render(e,l)}d.toneMapping=f,d.autoClear=u,e.background=x}_textureToCubeUV(e,t){let i=this._renderer,s=e.mapping===pi||e.mapping===Di;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=vu()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=yu());let r=s?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=r;let o=r.uniforms;o.envMap.value=e;let l=this._cubeSize;Ts(t,0,0,3*l,2*l),i.setRenderTarget(t),i.render(a,yr)}_applyPMREM(e){let t=this._renderer,i=t.autoClear;t.autoClear=!1;let s=this._lodMeshes.length;for(let r=1;r<s;r++)this._applyGGXFilter(e,r-1,r);t.autoClear=i}_applyGGXFilter(e,t,i){let s=this._renderer,r=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[i];o.material=a;let l=a.uniforms,c=i/(this._lodMeshes.length-1),h=t/(this._lodMeshes.length-1),d=Math.sqrt(c*c-h*h),u=0+c*1.25,f=d*u,{_lodMax:g}=this,S=this._sizeLods[i],p=3*S*(i>g-_i?i-g+_i:0),m=4*(this._cubeSize-S);l.envMap.value=e.texture,l.roughness.value=f,l.mipInt.value=g-t,Ts(r,p,m,3*S,2*S),s.setRenderTarget(r),s.render(o,yr),l.envMap.value=r.texture,l.roughness.value=0,l.mipInt.value=g-i,Ts(e,p,m,3*S,2*S),s.setRenderTarget(e),s.render(o,yr)}_blur(e,t,i,s,r){let a=this._pingPongRenderTarget;this._halfBlur(e,a,t,i,s,"latitudinal",r),this._halfBlur(a,e,i,i,s,"longitudinal",r)}_halfBlur(e,t,i,s,r,a,o){let l=this._renderer,c=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&Re("blur direction must be either latitudinal or longitudinal!");let h=3,d=this._lodMeshes[s];d.material=c;let u=c.uniforms,f=this._sizeLods[i]-1,g=isFinite(r)?Math.PI/(2*f):2*Math.PI/(2*Fi-1),S=r/g,p=isFinite(r)?1+Math.floor(h*S):Fi;p>Fi&&Ce(`sigmaRadians, ${r}, is too large and will clip, as it requested ${p} samples when the maximum is set to ${Fi}`);let m=[],x=0;for(let I=0;I<Fi;++I){let y=I/S,w=Math.exp(-y*y/2);m.push(w),I===0?x+=w:I<p&&(x+=2*w)}for(let I=0;I<m.length;I++)m[I]=m[I]/x;u.envMap.value=e.texture,u.samples.value=p,u.weights.value=m,u.latitudinal.value=a==="latitudinal",o&&(u.poleAxis.value=o);let{_lodMax:M}=this;u.dTheta.value=g,u.mipInt.value=M-i;let b=this._sizeLods[s],A=3*b*(s>M-_i?s-M+_i:0),E=4*(this._cubeSize-b);Ts(t,A,E,3*b,2*b),l.setRenderTarget(t),l.render(d,yr)}};function gg(n){let e=[],t=[],i=[],s=n,r=n-_i+1+gu.length;for(let a=0;a<r;a++){let o=Math.pow(2,s);e.push(o);let l=1/o;a>n-_i?l=gu[a-n+_i-1]:a===0&&(l=0),t.push(l);let c=1/(o-2),h=-c,d=1+c,u=[h,h,d,h,d,d,h,h,d,d,h,d],f=6,g=6,S=3,p=2,m=1,x=new Float32Array(S*g*f),M=new Float32Array(p*g*f),b=new Float32Array(m*g*f);for(let E=0;E<f;E++){let I=E%3*2/3-1,y=E>2?0:-1,w=[I,y,0,I+2/3,y,0,I+2/3,y+1,0,I,y,0,I+2/3,y+1,0,I,y+1,0];x.set(w,S*g*E),M.set(u,p*g*E);let F=[E,E,E,E,E,E];b.set(F,m*g*E)}let A=new ot;A.setAttribute("position",new Wt(x,S)),A.setAttribute("uv",new Wt(M,p)),A.setAttribute("faceIndex",new Wt(b,m)),i.push(new ht(A,null)),s>_i&&s--}return{lodMeshes:i,sizeLods:e,sigmas:t}}function xu(n,e,t){let i=new jt(n,e,t);return i.texture.mapping=ur,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Ts(n,e,t,i,s){n.viewport.set(e,t,i,s),n.scissor.set(e,t,i,s)}function _g(n,e,t){return new tn({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:pg,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:ko(),fragmentShader:`

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
		`,blending:Rn,depthTest:!1,depthWrite:!1})}function xg(n,e,t){let i=new Float32Array(Fi),s=new C(0,1,0);return new tn({name:"SphericalGaussianBlur",defines:{n:Fi,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:ko(),fragmentShader:`

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
		`,blending:Rn,depthTest:!1,depthWrite:!1})}function yu(){return new tn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:ko(),fragmentShader:`

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
		`,blending:Rn,depthTest:!1,depthWrite:!1})}function vu(){return new tn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:ko(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Rn,depthTest:!1,depthWrite:!1})}function ko(){return`

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
	`}var Bo=class extends jt{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let i={width:e,height:e,depth:1},s=[i,i,i,i,i,i];this.texture=new Zs(s),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},s=new fs(5,5,5),r=new tn({name:"CubemapFromEquirect",uniforms:Li(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Ht,blending:Rn});r.uniforms.tEquirect.value=t;let a=new ht(s,r),o=t.minFilter;return t.minFilter===pn&&(t.minFilter=we),new Xa(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,i=!0,s=!0){let r=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,i,s);e.setRenderTarget(r)}};function yg(n){let e=new WeakMap,t=new WeakMap,i=null;function s(u,f=!1){return u==null?null:f?a(u):r(u)}function r(u){if(u&&u.isTexture){let f=u.mapping;if(f===Ya||f===$a)if(e.has(u)){let g=e.get(u).texture;return o(g,u.mapping)}else{let g=u.image;if(g&&g.height>0){let S=new Bo(g.height);return S.fromEquirectangularTexture(n,u),e.set(u,S),u.addEventListener("dispose",c),o(S.texture,u.mapping)}else return null}}return u}function a(u){if(u&&u.isTexture){let f=u.mapping,g=f===Ya||f===$a,S=f===pi||f===Di;if(g||S){let p=t.get(u),m=p!==void 0?p.texture.pmremVersion:0;if(u.isRenderTargetTexture&&u.pmremVersion!==m)return i===null&&(i=new Oo(n)),p=g?i.fromEquirectangular(u,p):i.fromCubemap(u,p),p.texture.pmremVersion=u.pmremVersion,t.set(u,p),p.texture;if(p!==void 0)return p.texture;{let x=u.image;return g&&x&&x.height>0||S&&x&&l(x)?(i===null&&(i=new Oo(n)),p=g?i.fromEquirectangular(u):i.fromCubemap(u),p.texture.pmremVersion=u.pmremVersion,t.set(u,p),u.addEventListener("dispose",h),p.texture):null}}}return u}function o(u,f){return f===Ya?u.mapping=pi:f===$a&&(u.mapping=Di),u}function l(u){let f=0,g=6;for(let S=0;S<g;S++)u[S]!==void 0&&f++;return f===g}function c(u){let f=u.target;f.removeEventListener("dispose",c);let g=e.get(f);g!==void 0&&(e.delete(f),g.dispose())}function h(u){let f=u.target;f.removeEventListener("dispose",h);let g=t.get(f);g!==void 0&&(t.delete(f),g.dispose())}function d(){e=new WeakMap,t=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:s,dispose:d}}function vg(n){let e={};function t(i){if(e[i]!==void 0)return e[i];let s=n.getExtension(i);return e[i]=s,s}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){let s=t(i);return s===null&&xa("WebGLRenderer: "+i+" extension not supported."),s}}}function Sg(n,e,t,i){let s={},r=new WeakMap;function a(d){let u=d.target;u.index!==null&&e.remove(u.index);for(let g in u.attributes)e.remove(u.attributes[g]);u.removeEventListener("dispose",a),delete s[u.id];let f=r.get(u);f&&(e.remove(f),r.delete(u)),i.releaseStatesOfGeometry(u),u.isInstancedBufferGeometry===!0&&delete u._maxInstanceCount,t.memory.geometries--}function o(d,u){return s[u.id]===!0||(u.addEventListener("dispose",a),s[u.id]=!0,t.memory.geometries++),u}function l(d){let u=d.attributes;for(let f in u)e.update(u[f],n.ARRAY_BUFFER)}function c(d){let u=[],f=d.index,g=d.attributes.position,S=0;if(g===void 0)return;if(f!==null){let x=f.array;S=f.version;for(let M=0,b=x.length;M<b;M+=3){let A=x[M+0],E=x[M+1],I=x[M+2];u.push(A,E,E,I,I,A)}}else{let x=g.array;S=g.version;for(let M=0,b=x.length/3-1;M<b;M+=3){let A=M+0,E=M+1,I=M+2;u.push(A,E,E,I,I,A)}}let p=new(g.count>=65535?qs:Xs)(u,1);p.version=S;let m=r.get(d);m&&e.remove(m),r.set(d,p)}function h(d){let u=r.get(d);if(u){let f=d.index;f!==null&&u.version<f.version&&c(d)}else c(d);return r.get(d)}return{get:o,update:l,getWireframeAttribute:h}}function Mg(n,e,t){let i;function s(d){i=d}let r,a;function o(d){r=d.type,a=d.bytesPerElement}function l(d,u){n.drawElements(i,u,r,d*a),t.update(u,i,1)}function c(d,u,f){f!==0&&(n.drawElementsInstanced(i,u,r,d*a,f),t.update(u,i,f))}function h(d,u,f){if(f===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,u,0,r,d,0,f);let S=0;for(let p=0;p<f;p++)S+=u[p];t.update(S,i,1)}this.setMode=s,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=h}function bg(n){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(r,a,o){switch(t.calls++,a){case n.TRIANGLES:t.triangles+=o*(r/3);break;case n.LINES:t.lines+=o*(r/2);break;case n.LINE_STRIP:t.lines+=o*(r-1);break;case n.LINE_LOOP:t.lines+=o*r;break;case n.POINTS:t.points+=o*r;break;default:Re("WebGLInfo: Unknown draw mode:",a);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:i}}function Tg(n,e,t){let i=new WeakMap,s=new xt;function r(a,o,l){let c=a.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,d=h!==void 0?h.length:0,u=i.get(o);if(u===void 0||u.count!==d){let w=function(){I.dispose(),i.delete(o),o.removeEventListener("dispose",w)};u!==void 0&&u.texture.dispose();let f=o.morphAttributes.position!==void 0,g=o.morphAttributes.normal!==void 0,S=o.morphAttributes.color!==void 0,p=o.morphAttributes.position||[],m=o.morphAttributes.normal||[],x=o.morphAttributes.color||[],M=0;f===!0&&(M=1),g===!0&&(M=2),S===!0&&(M=3);let b=o.attributes.position.count*M,A=1;b>e.maxTextureSize&&(A=Math.ceil(b/e.maxTextureSize),b=e.maxTextureSize);let E=new Float32Array(b*A*4*d),I=new Ws(E,b,A,d);I.type=gn,I.needsUpdate=!0;let y=M*4;for(let F=0;F<d;F++){let R=p[F],O=m[F],G=x[F],X=b*A*4*F;for(let N=0;N<R.count;N++){let z=N*y;f===!0&&(s.fromBufferAttribute(R,N),E[X+z+0]=s.x,E[X+z+1]=s.y,E[X+z+2]=s.z,E[X+z+3]=0),g===!0&&(s.fromBufferAttribute(O,N),E[X+z+4]=s.x,E[X+z+5]=s.y,E[X+z+6]=s.z,E[X+z+7]=0),S===!0&&(s.fromBufferAttribute(G,N),E[X+z+8]=s.x,E[X+z+9]=s.y,E[X+z+10]=s.z,E[X+z+11]=G.itemSize===4?s.w:1)}}u={count:d,texture:I,size:new ge(b,A)},i.set(o,u),o.addEventListener("dispose",w)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(n,"morphTexture",a.morphTexture,t);else{let f=0;for(let S=0;S<c.length;S++)f+=c[S];let g=o.morphTargetsRelative?1:1-f;l.getUniforms().setValue(n,"morphTargetBaseInfluence",g),l.getUniforms().setValue(n,"morphTargetInfluences",c)}l.getUniforms().setValue(n,"morphTargetsTexture",u.texture,t),l.getUniforms().setValue(n,"morphTargetsTextureSize",u.size)}return{update:r}}function Eg(n,e,t,i,s){let r=new WeakMap;function a(c){let h=s.render.frame,d=c.geometry,u=e.get(c,d);if(r.get(u)!==h&&(e.update(u),r.set(u,h)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),r.get(c)!==h&&(t.update(c.instanceMatrix,n.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,n.ARRAY_BUFFER),r.set(c,h))),c.isSkinnedMesh){let f=c.skeleton;r.get(f)!==h&&(f.update(),r.set(f,h))}return u}function o(){r=new WeakMap}function l(c){let h=c.target;h.removeEventListener("dispose",l),i.releaseStatesOfObject(h),t.remove(h.instanceMatrix),h.instanceColor!==null&&t.remove(h.instanceColor)}return{update:a,dispose:o}}var wg={[zl]:"LINEAR_TONE_MAPPING",[Hl]:"REINHARD_TONE_MAPPING",[Vl]:"CINEON_TONE_MAPPING",[Gl]:"ACES_FILMIC_TONE_MAPPING",[Xl]:"AGX_TONE_MAPPING",[ql]:"NEUTRAL_TONE_MAPPING",[Wl]:"CUSTOM_TONE_MAPPING"};function Ag(n,e,t,i,s){let r=new jt(e,t,{type:n,depthBuffer:i,stencilBuffer:s,depthTexture:i?new Xn(e,t):void 0}),a=new jt(e,t,{type:In,depthBuffer:!1,stencilBuffer:!1}),o=new ot;o.setAttribute("position",new mt([-1,3,0,-1,-1,0,3,-1,0],3)),o.setAttribute("uv",new mt([0,2,0,0,2,0],2));let l=new Da({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),c=new ht(o,l),h=new fi(-1,1,1,-1,0,1),d=null,u=null,f=!1,g,S=null,p=[],m=!1;this.setSize=function(x,M){r.setSize(x,M),a.setSize(x,M);for(let b=0;b<p.length;b++){let A=p[b];A.setSize&&A.setSize(x,M)}},this.setEffects=function(x){p=x,m=p.length>0&&p[0].isRenderPass===!0;let M=r.width,b=r.height;for(let A=0;A<p.length;A++){let E=p[A];E.setSize&&E.setSize(M,b)}},this.begin=function(x,M){if(f||x.toneMapping===fn&&p.length===0)return!1;if(S=M,M!==null){let b=M.width,A=M.height;(r.width!==b||r.height!==A)&&this.setSize(b,A)}return m===!1&&x.setRenderTarget(r),g=x.toneMapping,x.toneMapping=fn,!0},this.hasRenderPass=function(){return m},this.end=function(x,M){x.toneMapping=g,f=!0;let b=r,A=a;for(let E=0;E<p.length;E++){let I=p[E];if(I.enabled!==!1&&(I.render(x,A,b,M),I.needsSwap!==!1)){let y=b;b=A,A=y}}if(d!==x.outputColorSpace||u!==x.toneMapping){d=x.outputColorSpace,u=x.toneMapping,l.defines={},Xe.getTransfer(d)===Ke&&(l.defines.SRGB_TRANSFER="");let E=wg[u];E&&(l.defines[E]=""),l.needsUpdate=!0}l.uniforms.tDiffuse.value=b.texture,x.setRenderTarget(S),x.render(c,h),S=null,f=!1},this.isCompositing=function(){return f},this.dispose=function(){r.depthTexture&&r.depthTexture.dispose(),r.dispose(),a.dispose(),o.dispose(),l.dispose()}}var zu=new It,pc=new Xn(1,1),Hu=new Ws,Vu=new Ma,Gu=new Zs,Su=[],Mu=[],bu=new Float32Array(16),Tu=new Float32Array(9),Eu=new Float32Array(4);function ws(n,e,t){let i=n[0];if(i<=0||i>0)return n;let s=e*t,r=Su[s];if(r===void 0&&(r=new Float32Array(s),Su[s]=r),e!==0){i.toArray(r,0);for(let a=1,o=0;a!==e;++a)o+=t,n[a].toArray(r,o)}return r}function wt(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function At(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function zo(n,e){let t=Mu[e];t===void 0&&(t=new Int32Array(e),Mu[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function Cg(n,e){let t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function Rg(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(wt(t,e))return;n.uniform2fv(this.addr,e),At(t,e)}}function Ig(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(wt(t,e))return;n.uniform3fv(this.addr,e),At(t,e)}}function Pg(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(wt(t,e))return;n.uniform4fv(this.addr,e),At(t,e)}}function Dg(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(wt(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),At(t,e)}else{if(wt(t,i))return;Eu.set(i),n.uniformMatrix2fv(this.addr,!1,Eu),At(t,i)}}function Lg(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(wt(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),At(t,e)}else{if(wt(t,i))return;Tu.set(i),n.uniformMatrix3fv(this.addr,!1,Tu),At(t,i)}}function Fg(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(wt(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),At(t,e)}else{if(wt(t,i))return;bu.set(i),n.uniformMatrix4fv(this.addr,!1,bu),At(t,i)}}function Ng(n,e){let t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function Ug(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(wt(t,e))return;n.uniform2iv(this.addr,e),At(t,e)}}function Og(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(wt(t,e))return;n.uniform3iv(this.addr,e),At(t,e)}}function Bg(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(wt(t,e))return;n.uniform4iv(this.addr,e),At(t,e)}}function kg(n,e){let t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function zg(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(wt(t,e))return;n.uniform2uiv(this.addr,e),At(t,e)}}function Hg(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(wt(t,e))return;n.uniform3uiv(this.addr,e),At(t,e)}}function Vg(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(wt(t,e))return;n.uniform4uiv(this.addr,e),At(t,e)}}function Gg(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s);let r;this.type===n.SAMPLER_2D_SHADOW?(pc.compareFunction=t.isReversedDepthBuffer()?Fo:Lo,r=pc):r=zu,t.setTexture2D(e||r,s)}function Wg(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTexture3D(e||Vu,s)}function Xg(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTextureCube(e||Gu,s)}function qg(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTexture2DArray(e||Hu,s)}function Yg(n){switch(n){case 5126:return Cg;case 35664:return Rg;case 35665:return Ig;case 35666:return Pg;case 35674:return Dg;case 35675:return Lg;case 35676:return Fg;case 5124:case 35670:return Ng;case 35667:case 35671:return Ug;case 35668:case 35672:return Og;case 35669:case 35673:return Bg;case 5125:return kg;case 36294:return zg;case 36295:return Hg;case 36296:return Vg;case 35678:case 36198:case 36298:case 36306:case 35682:return Gg;case 35679:case 36299:case 36307:return Wg;case 35680:case 36300:case 36308:case 36293:return Xg;case 36289:case 36303:case 36311:case 36292:return qg}}function $g(n,e){n.uniform1fv(this.addr,e)}function Zg(n,e){let t=ws(e,this.size,2);n.uniform2fv(this.addr,t)}function Jg(n,e){let t=ws(e,this.size,3);n.uniform3fv(this.addr,t)}function Kg(n,e){let t=ws(e,this.size,4);n.uniform4fv(this.addr,t)}function jg(n,e){let t=ws(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function Qg(n,e){let t=ws(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function e0(n,e){let t=ws(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function t0(n,e){n.uniform1iv(this.addr,e)}function n0(n,e){n.uniform2iv(this.addr,e)}function i0(n,e){n.uniform3iv(this.addr,e)}function s0(n,e){n.uniform4iv(this.addr,e)}function r0(n,e){n.uniform1uiv(this.addr,e)}function a0(n,e){n.uniform2uiv(this.addr,e)}function o0(n,e){n.uniform3uiv(this.addr,e)}function l0(n,e){n.uniform4uiv(this.addr,e)}function c0(n,e,t){let i=this.cache,s=e.length,r=zo(t,s);wt(i,r)||(n.uniform1iv(this.addr,r),At(i,r));let a;this.type===n.SAMPLER_2D_SHADOW?a=pc:a=zu;for(let o=0;o!==s;++o)t.setTexture2D(e[o]||a,r[o])}function h0(n,e,t){let i=this.cache,s=e.length,r=zo(t,s);wt(i,r)||(n.uniform1iv(this.addr,r),At(i,r));for(let a=0;a!==s;++a)t.setTexture3D(e[a]||Vu,r[a])}function u0(n,e,t){let i=this.cache,s=e.length,r=zo(t,s);wt(i,r)||(n.uniform1iv(this.addr,r),At(i,r));for(let a=0;a!==s;++a)t.setTextureCube(e[a]||Gu,r[a])}function d0(n,e,t){let i=this.cache,s=e.length,r=zo(t,s);wt(i,r)||(n.uniform1iv(this.addr,r),At(i,r));for(let a=0;a!==s;++a)t.setTexture2DArray(e[a]||Hu,r[a])}function f0(n){switch(n){case 5126:return $g;case 35664:return Zg;case 35665:return Jg;case 35666:return Kg;case 35674:return jg;case 35675:return Qg;case 35676:return e0;case 5124:case 35670:return t0;case 35667:case 35671:return n0;case 35668:case 35672:return i0;case 35669:case 35673:return s0;case 5125:return r0;case 36294:return a0;case 36295:return o0;case 36296:return l0;case 35678:case 36198:case 36298:case 36306:case 35682:return c0;case 35679:case 36299:case 36307:return h0;case 35680:case 36300:case 36308:case 36293:return u0;case 36289:case 36303:case 36311:case 36292:return d0}}var mc=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=Yg(t.type)}},gc=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=f0(t.type)}},_c=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){let s=this.seq;for(let r=0,a=s.length;r!==a;++r){let o=s[r];o.setValue(e,t[o.id],i)}}},dc=/(\w+)(\])?(\[|\.)?/g;function wu(n,e){n.seq.push(e),n.map[e.id]=e}function p0(n,e,t){let i=n.name,s=i.length;for(dc.lastIndex=0;;){let r=dc.exec(i),a=dc.lastIndex,o=r[1],l=r[2]==="]",c=r[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===s){wu(t,c===void 0?new mc(o,n,e):new gc(o,n,e));break}else{let d=t.map[o];d===void 0&&(d=new _c(o),wu(t,d)),t=d}}}var Es=class{constructor(e,t){this.seq=[],this.map={};let i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let a=0;a<i;++a){let o=e.getActiveUniform(t,a),l=e.getUniformLocation(t,o.name);p0(o,l,this)}let s=[],r=[];for(let a of this.seq)a.type===e.SAMPLER_2D_SHADOW||a.type===e.SAMPLER_CUBE_SHADOW||a.type===e.SAMPLER_2D_ARRAY_SHADOW?s.push(a):r.push(a);s.length>0&&(this.seq=s.concat(r))}setValue(e,t,i,s){let r=this.map[t];r!==void 0&&r.setValue(e,i,s)}setOptional(e,t,i){let s=t[i];s!==void 0&&this.setValue(e,i,s)}static upload(e,t,i,s){for(let r=0,a=t.length;r!==a;++r){let o=t[r],l=i[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,s)}}static seqWithValue(e,t){let i=[];for(let s=0,r=e.length;s!==r;++s){let a=e[s];a.id in t&&i.push(a)}return i}};function Au(n,e,t){let i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}var m0=37297,g0=0;function _0(n,e){let t=n.split(`
`),i=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let a=s;a<r;a++){let o=a+1;i.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return i.join(`
`)}var Cu=new Le;function x0(n){Xe._getMatrix(Cu,Xe.workingColorSpace,n);let e=`mat3( ${Cu.elements.map(t=>t.toFixed(4))} )`;switch(Xe.getTransfer(n)){case Hs:return[e,"LinearTransferOETF"];case Ke:return[e,"sRGBTransferOETF"];default:return Ce("WebGLProgram: Unsupported color space: ",n),[e,"LinearTransferOETF"]}}function Ru(n,e,t){let i=n.getShaderParameter(e,n.COMPILE_STATUS),r=(n.getShaderInfoLog(e)||"").trim();if(i&&r==="")return"";let a=/ERROR: 0:(\d+)/.exec(r);if(a){let o=parseInt(a[1]);return t.toUpperCase()+`

`+r+`

`+_0(n.getShaderSource(e),o)}else return r}function y0(n,e){let t=x0(e);return[`vec4 ${n}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}var v0={[zl]:"Linear",[Hl]:"Reinhard",[Vl]:"Cineon",[Gl]:"ACESFilmic",[Xl]:"AgX",[ql]:"Neutral",[Wl]:"Custom"};function S0(n,e){let t=v0[e];return t===void 0?(Ce("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+n+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var Uo=new C;function M0(){Xe.getLuminanceCoefficients(Uo);let n=Uo.x.toFixed(4),e=Uo.y.toFixed(4),t=Uo.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function b0(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Sr).join(`
`)}function T0(n){let e=[];for(let t in n){let i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function E0(n,e){let t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let s=0;s<i;s++){let r=n.getActiveAttrib(e,s),a=r.name,o=1;r.type===n.FLOAT_MAT2&&(o=2),r.type===n.FLOAT_MAT3&&(o=3),r.type===n.FLOAT_MAT4&&(o=4),t[a]={type:r.type,location:n.getAttribLocation(e,a),locationSize:o}}return t}function Sr(n){return n!==""}function Iu(n,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Pu(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var w0=/^[ \t]*#include +<([\w\d./]+)>/gm;function xc(n){return n.replace(w0,C0)}var A0=new Map;function C0(n,e){let t=ke[e];if(t===void 0){let i=A0.get(e);if(i!==void 0)t=ke[i],Ce('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("Can not resolve #include <"+e+">")}return xc(t)}var R0=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Du(n){return n.replace(R0,I0)}function I0(n,e,t,i){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=i.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function Lu(n){let e=`precision ${n.precision} float;
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
#define LOW_PRECISION`),e}var P0={[hr]:"SHADOWMAP_TYPE_PCF",[Ss]:"SHADOWMAP_TYPE_VSM"};function D0(n){return P0[n.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var L0={[pi]:"ENVMAP_TYPE_CUBE",[Di]:"ENVMAP_TYPE_CUBE",[ur]:"ENVMAP_TYPE_CUBE_UV"};function F0(n){return n.envMap===!1?"ENVMAP_TYPE_CUBE":L0[n.envMapMode]||"ENVMAP_TYPE_CUBE"}var N0={[Di]:"ENVMAP_MODE_REFRACTION"};function U0(n){return n.envMap===!1?"ENVMAP_MODE_REFLECTION":N0[n.envMapMode]||"ENVMAP_MODE_REFLECTION"}var O0={[kl]:"ENVMAP_BLENDING_MULTIPLY",[Yh]:"ENVMAP_BLENDING_MIX",[$h]:"ENVMAP_BLENDING_ADD"};function B0(n){return n.envMap===!1?"ENVMAP_BLENDING_NONE":O0[n.combine]||"ENVMAP_BLENDING_NONE"}function k0(n){let e=n.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:i,maxMip:t}}function z0(n,e,t,i){let s=n.getContext(),r=t.defines,a=t.vertexShader,o=t.fragmentShader,l=D0(t),c=F0(t),h=U0(t),d=B0(t),u=k0(t),f=b0(t),g=T0(r),S=s.createProgram(),p,m,x=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(Sr).join(`
`),p.length>0&&(p+=`
`),m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(Sr).join(`
`),m.length>0&&(m+=`
`)):(p=[Lu(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Sr).join(`
`),m=[Lu(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+h:"",t.envMap?"#define "+d:"",u?"#define CUBEUV_TEXEL_WIDTH "+u.texelWidth:"",u?"#define CUBEUV_TEXEL_HEIGHT "+u.texelHeight:"",u?"#define CUBEUV_MAX_MIP "+u.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==fn?"#define TONE_MAPPING":"",t.toneMapping!==fn?ke.tonemapping_pars_fragment:"",t.toneMapping!==fn?S0("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",ke.colorspace_pars_fragment,y0("linearToOutputTexel",t.outputColorSpace),M0(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Sr).join(`
`)),a=xc(a),a=Iu(a,t),a=Pu(a,t),o=xc(o),o=Iu(o,t),o=Pu(o,t),a=Du(a),o=Du(o),t.isRawShaderMaterial!==!0&&(x=`#version 300 es
`,p=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,m=["#define varying in",t.glslVersion===nc?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===nc?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+m);let M=x+p+a,b=x+m+o,A=Au(s,s.VERTEX_SHADER,M),E=Au(s,s.FRAGMENT_SHADER,b);s.attachShader(S,A),s.attachShader(S,E),t.index0AttributeName!==void 0?s.bindAttribLocation(S,0,t.index0AttributeName):t.morphTargets===!0&&s.bindAttribLocation(S,0,"position"),s.linkProgram(S);function I(R){if(n.debug.checkShaderErrors){let O=s.getProgramInfoLog(S)||"",G=s.getShaderInfoLog(A)||"",X=s.getShaderInfoLog(E)||"",N=O.trim(),z=G.trim(),V=X.trim(),j=!0,Q=!0;if(s.getProgramParameter(S,s.LINK_STATUS)===!1)if(j=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(s,S,A,E);else{let ce=Ru(s,A,"vertex"),ye=Ru(s,E,"fragment");Re("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(S,s.VALIDATE_STATUS)+`

Material Name: `+R.name+`
Material Type: `+R.type+`

Program Info Log: `+N+`
`+ce+`
`+ye)}else N!==""?Ce("WebGLProgram: Program Info Log:",N):(z===""||V==="")&&(Q=!1);Q&&(R.diagnostics={runnable:j,programLog:N,vertexShader:{log:z,prefix:p},fragmentShader:{log:V,prefix:m}})}s.deleteShader(A),s.deleteShader(E),y=new Es(s,S),w=E0(s,S)}let y;this.getUniforms=function(){return y===void 0&&I(this),y};let w;this.getAttributes=function(){return w===void 0&&I(this),w};let F=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return F===!1&&(F=s.getProgramParameter(S,m0)),F},this.destroy=function(){i.releaseStatesOfProgram(this),s.deleteProgram(S),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=g0++,this.cacheKey=e,this.usedTimes=1,this.program=S,this.vertexShader=A,this.fragmentShader=E,this}var H0=0,yc=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,i=e.fragmentShader,s=this._getShaderStage(t),r=this._getShaderStage(i),a=this._getShaderCacheForMaterial(e);return a.has(s)===!1&&(a.add(s),s.usedTimes++),a.has(r)===!1&&(a.add(r),r.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){let t=this.shaderCache,i=t.get(e);return i===void 0&&(i=new vc(e),t.set(e,i)),i}},vc=class{constructor(e){this.id=H0++,this.code=e,this.usedTimes=0}};function V0(n){return n===gi||n===_r||n===xr}function G0(n,e,t,i,s,r){let a=new ls,o=new yc,l=new Set,c=[],h=new Map,d=i.logarithmicDepthBuffer,u=i.precision,f={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function g(y){return l.add(y),y===0?"uv":`uv${y}`}function S(y,w,F,R,O,G){let X=R.fog,N=O.geometry,z=y.isMeshStandardMaterial||y.isMeshLambertMaterial||y.isMeshPhongMaterial?R.environment:null,V=y.isMeshStandardMaterial||y.isMeshLambertMaterial&&!y.envMap||y.isMeshPhongMaterial&&!y.envMap,j=e.get(y.envMap||z,V),Q=j&&j.mapping===ur?j.image.height:null,ce=f[y.type];y.precision!==null&&(u=i.getMaxPrecision(y.precision),u!==y.precision&&Ce("WebGLProgram.getParameters:",y.precision,"not supported, using",u,"instead."));let ye=N.morphAttributes.position||N.morphAttributes.normal||N.morphAttributes.color,Te=ye!==void 0?ye.length:0,Ye=0;N.morphAttributes.position!==void 0&&(Ye=1),N.morphAttributes.normal!==void 0&&(Ye=2),N.morphAttributes.color!==void 0&&(Ye=3);let je,Oe,Z,de;if(ce){let Ne=Dn[ce];je=Ne.vertexShader,Oe=Ne.fragmentShader}else je=y.vertexShader,Oe=y.fragmentShader,o.update(y),Z=o.getVertexShaderID(y),de=o.getFragmentShaderID(y);let ie=n.getRenderTarget(),Ie=n.state.buffers.depth.getReversed(),Fe=O.isInstancedMesh===!0,Pe=O.isBatchedMesh===!0,dt=!!y.map,Ge=!!y.matcap,Qe=!!j,lt=!!y.aoMap,He=!!y.lightMap,Tt=!!y.bumpMap,ft=!!y.normalMap,Yt=!!y.displacementMap,D=!!y.emissiveMap,Et=!!y.metalnessMap,We=!!y.roughnessMap,rt=y.anisotropy>0,oe=y.clearcoat>0,gt=y.dispersion>0,T=y.iridescence>0,_=y.sheen>0,U=y.transmission>0,Y=rt&&!!y.anisotropyMap,K=oe&&!!y.clearcoatMap,ee=oe&&!!y.clearcoatNormalMap,ae=oe&&!!y.clearcoatRoughnessMap,W=T&&!!y.iridescenceMap,$=T&&!!y.iridescenceThicknessMap,fe=_&&!!y.sheenColorMap,_e=_&&!!y.sheenRoughnessMap,se=!!y.specularMap,te=!!y.specularColorMap,De=!!y.specularIntensityMap,Be=U&&!!y.transmissionMap,Je=U&&!!y.thicknessMap,P=!!y.gradientMap,ne=!!y.alphaMap,q=y.alphaTest>0,pe=!!y.alphaHash,re=!!y.extensions,J=fn;y.toneMapped&&(ie===null||ie.isXRRenderTarget===!0)&&(J=n.toneMapping);let Me={shaderID:ce,shaderType:y.type,shaderName:y.name,vertexShader:je,fragmentShader:Oe,defines:y.defines,customVertexShaderID:Z,customFragmentShaderID:de,isRawShaderMaterial:y.isRawShaderMaterial===!0,glslVersion:y.glslVersion,precision:u,batching:Pe,batchingColor:Pe&&O._colorsTexture!==null,instancing:Fe,instancingColor:Fe&&O.instanceColor!==null,instancingMorph:Fe&&O.morphTexture!==null,outputColorSpace:ie===null?n.outputColorSpace:ie.isXRRenderTarget===!0?ie.texture.colorSpace:Xe.workingColorSpace,alphaToCoverage:!!y.alphaToCoverage,map:dt,matcap:Ge,envMap:Qe,envMapMode:Qe&&j.mapping,envMapCubeUVHeight:Q,aoMap:lt,lightMap:He,bumpMap:Tt,normalMap:ft,displacementMap:Yt,emissiveMap:D,normalMapObjectSpace:ft&&y.normalMapType===Kh,normalMapTangentSpace:ft&&y.normalMapType===tc,packedNormalMap:ft&&y.normalMapType===tc&&V0(y.normalMap.format),metalnessMap:Et,roughnessMap:We,anisotropy:rt,anisotropyMap:Y,clearcoat:oe,clearcoatMap:K,clearcoatNormalMap:ee,clearcoatRoughnessMap:ae,dispersion:gt,iridescence:T,iridescenceMap:W,iridescenceThicknessMap:$,sheen:_,sheenColorMap:fe,sheenRoughnessMap:_e,specularMap:se,specularColorMap:te,specularIntensityMap:De,transmission:U,transmissionMap:Be,thicknessMap:Je,gradientMap:P,opaque:y.transparent===!1&&y.blending===Ci&&y.alphaToCoverage===!1,alphaMap:ne,alphaTest:q,alphaHash:pe,combine:y.combine,mapUv:dt&&g(y.map.channel),aoMapUv:lt&&g(y.aoMap.channel),lightMapUv:He&&g(y.lightMap.channel),bumpMapUv:Tt&&g(y.bumpMap.channel),normalMapUv:ft&&g(y.normalMap.channel),displacementMapUv:Yt&&g(y.displacementMap.channel),emissiveMapUv:D&&g(y.emissiveMap.channel),metalnessMapUv:Et&&g(y.metalnessMap.channel),roughnessMapUv:We&&g(y.roughnessMap.channel),anisotropyMapUv:Y&&g(y.anisotropyMap.channel),clearcoatMapUv:K&&g(y.clearcoatMap.channel),clearcoatNormalMapUv:ee&&g(y.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ae&&g(y.clearcoatRoughnessMap.channel),iridescenceMapUv:W&&g(y.iridescenceMap.channel),iridescenceThicknessMapUv:$&&g(y.iridescenceThicknessMap.channel),sheenColorMapUv:fe&&g(y.sheenColorMap.channel),sheenRoughnessMapUv:_e&&g(y.sheenRoughnessMap.channel),specularMapUv:se&&g(y.specularMap.channel),specularColorMapUv:te&&g(y.specularColorMap.channel),specularIntensityMapUv:De&&g(y.specularIntensityMap.channel),transmissionMapUv:Be&&g(y.transmissionMap.channel),thicknessMapUv:Je&&g(y.thicknessMap.channel),alphaMapUv:ne&&g(y.alphaMap.channel),vertexTangents:!!N.attributes.tangent&&(ft||rt),vertexNormals:!!N.attributes.normal,vertexColors:y.vertexColors,vertexAlphas:y.vertexColors===!0&&!!N.attributes.color&&N.attributes.color.itemSize===4,pointsUvs:O.isPoints===!0&&!!N.attributes.uv&&(dt||ne),fog:!!X,useFog:y.fog===!0,fogExp2:!!X&&X.isFogExp2,flatShading:y.wireframe===!1&&(y.flatShading===!0||N.attributes.normal===void 0&&ft===!1&&(y.isMeshLambertMaterial||y.isMeshPhongMaterial||y.isMeshStandardMaterial||y.isMeshPhysicalMaterial)),sizeAttenuation:y.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:Ie,skinning:O.isSkinnedMesh===!0,morphTargets:N.morphAttributes.position!==void 0,morphNormals:N.morphAttributes.normal!==void 0,morphColors:N.morphAttributes.color!==void 0,morphTargetsCount:Te,morphTextureStride:Ye,numDirLights:w.directional.length,numPointLights:w.point.length,numSpotLights:w.spot.length,numSpotLightMaps:w.spotLightMap.length,numRectAreaLights:w.rectArea.length,numHemiLights:w.hemi.length,numDirLightShadows:w.directionalShadowMap.length,numPointLightShadows:w.pointShadowMap.length,numSpotLightShadows:w.spotShadowMap.length,numSpotLightShadowsWithMaps:w.numSpotLightShadowsWithMaps,numLightProbes:w.numLightProbes,numLightProbeGrids:G.length,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:y.dithering,shadowMapEnabled:n.shadowMap.enabled&&F.length>0,shadowMapType:n.shadowMap.type,toneMapping:J,decodeVideoTexture:dt&&y.map.isVideoTexture===!0&&Xe.getTransfer(y.map.colorSpace)===Ke,decodeVideoTextureEmissive:D&&y.emissiveMap.isVideoTexture===!0&&Xe.getTransfer(y.emissiveMap.colorSpace)===Ke,premultipliedAlpha:y.premultipliedAlpha,doubleSided:y.side===Bt,flipSided:y.side===Ht,useDepthPacking:y.depthPacking>=0,depthPacking:y.depthPacking||0,index0AttributeName:y.index0AttributeName,extensionClipCullDistance:re&&y.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(re&&y.extensions.multiDraw===!0||Pe)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:y.customProgramCacheKey()};return Me.vertexUv1s=l.has(1),Me.vertexUv2s=l.has(2),Me.vertexUv3s=l.has(3),l.clear(),Me}function p(y){let w=[];if(y.shaderID?w.push(y.shaderID):(w.push(y.customVertexShaderID),w.push(y.customFragmentShaderID)),y.defines!==void 0)for(let F in y.defines)w.push(F),w.push(y.defines[F]);return y.isRawShaderMaterial===!1&&(m(w,y),x(w,y),w.push(n.outputColorSpace)),w.push(y.customProgramCacheKey),w.join()}function m(y,w){y.push(w.precision),y.push(w.outputColorSpace),y.push(w.envMapMode),y.push(w.envMapCubeUVHeight),y.push(w.mapUv),y.push(w.alphaMapUv),y.push(w.lightMapUv),y.push(w.aoMapUv),y.push(w.bumpMapUv),y.push(w.normalMapUv),y.push(w.displacementMapUv),y.push(w.emissiveMapUv),y.push(w.metalnessMapUv),y.push(w.roughnessMapUv),y.push(w.anisotropyMapUv),y.push(w.clearcoatMapUv),y.push(w.clearcoatNormalMapUv),y.push(w.clearcoatRoughnessMapUv),y.push(w.iridescenceMapUv),y.push(w.iridescenceThicknessMapUv),y.push(w.sheenColorMapUv),y.push(w.sheenRoughnessMapUv),y.push(w.specularMapUv),y.push(w.specularColorMapUv),y.push(w.specularIntensityMapUv),y.push(w.transmissionMapUv),y.push(w.thicknessMapUv),y.push(w.combine),y.push(w.fogExp2),y.push(w.sizeAttenuation),y.push(w.morphTargetsCount),y.push(w.morphAttributeCount),y.push(w.numDirLights),y.push(w.numPointLights),y.push(w.numSpotLights),y.push(w.numSpotLightMaps),y.push(w.numHemiLights),y.push(w.numRectAreaLights),y.push(w.numDirLightShadows),y.push(w.numPointLightShadows),y.push(w.numSpotLightShadows),y.push(w.numSpotLightShadowsWithMaps),y.push(w.numLightProbes),y.push(w.shadowMapType),y.push(w.toneMapping),y.push(w.numClippingPlanes),y.push(w.numClipIntersection),y.push(w.depthPacking)}function x(y,w){a.disableAll(),w.instancing&&a.enable(0),w.instancingColor&&a.enable(1),w.instancingMorph&&a.enable(2),w.matcap&&a.enable(3),w.envMap&&a.enable(4),w.normalMapObjectSpace&&a.enable(5),w.normalMapTangentSpace&&a.enable(6),w.clearcoat&&a.enable(7),w.iridescence&&a.enable(8),w.alphaTest&&a.enable(9),w.vertexColors&&a.enable(10),w.vertexAlphas&&a.enable(11),w.vertexUv1s&&a.enable(12),w.vertexUv2s&&a.enable(13),w.vertexUv3s&&a.enable(14),w.vertexTangents&&a.enable(15),w.anisotropy&&a.enable(16),w.alphaHash&&a.enable(17),w.batching&&a.enable(18),w.dispersion&&a.enable(19),w.batchingColor&&a.enable(20),w.gradientMap&&a.enable(21),w.packedNormalMap&&a.enable(22),w.vertexNormals&&a.enable(23),y.push(a.mask),a.disableAll(),w.fog&&a.enable(0),w.useFog&&a.enable(1),w.flatShading&&a.enable(2),w.logarithmicDepthBuffer&&a.enable(3),w.reversedDepthBuffer&&a.enable(4),w.skinning&&a.enable(5),w.morphTargets&&a.enable(6),w.morphNormals&&a.enable(7),w.morphColors&&a.enable(8),w.premultipliedAlpha&&a.enable(9),w.shadowMapEnabled&&a.enable(10),w.doubleSided&&a.enable(11),w.flipSided&&a.enable(12),w.useDepthPacking&&a.enable(13),w.dithering&&a.enable(14),w.transmission&&a.enable(15),w.sheen&&a.enable(16),w.opaque&&a.enable(17),w.pointsUvs&&a.enable(18),w.decodeVideoTexture&&a.enable(19),w.decodeVideoTextureEmissive&&a.enable(20),w.alphaToCoverage&&a.enable(21),w.numLightProbeGrids>0&&a.enable(22),y.push(a.mask)}function M(y){let w=f[y.type],F;if(w){let R=Dn[w];F=pu.clone(R.uniforms)}else F=y.uniforms;return F}function b(y,w){let F=h.get(w);return F!==void 0?++F.usedTimes:(F=new z0(n,w,y,s),c.push(F),h.set(w,F)),F}function A(y){if(--y.usedTimes===0){let w=c.indexOf(y);c[w]=c[c.length-1],c.pop(),h.delete(y.cacheKey),y.destroy()}}function E(y){o.remove(y)}function I(){o.dispose()}return{getParameters:S,getProgramCacheKey:p,getUniforms:M,acquireProgram:b,releaseProgram:A,releaseShaderCache:E,programs:c,dispose:I}}function W0(){let n=new WeakMap;function e(a){return n.has(a)}function t(a){let o=n.get(a);return o===void 0&&(o={},n.set(a,o)),o}function i(a){n.delete(a)}function s(a,o,l){n.get(a)[o]=l}function r(){n=new WeakMap}return{has:e,get:t,remove:i,update:s,dispose:r}}function X0(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.materialVariant!==e.materialVariant?n.materialVariant-e.materialVariant:n.z!==e.z?n.z-e.z:n.id-e.id}function Fu(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function Nu(){let n=[],e=0,t=[],i=[],s=[];function r(){e=0,t.length=0,i.length=0,s.length=0}function a(u){let f=0;return u.isInstancedMesh&&(f+=2),u.isSkinnedMesh&&(f+=1),f}function o(u,f,g,S,p,m){let x=n[e];return x===void 0?(x={id:u.id,object:u,geometry:f,material:g,materialVariant:a(u),groupOrder:S,renderOrder:u.renderOrder,z:p,group:m},n[e]=x):(x.id=u.id,x.object=u,x.geometry=f,x.material=g,x.materialVariant=a(u),x.groupOrder=S,x.renderOrder=u.renderOrder,x.z=p,x.group=m),e++,x}function l(u,f,g,S,p,m){let x=o(u,f,g,S,p,m);g.transmission>0?i.push(x):g.transparent===!0?s.push(x):t.push(x)}function c(u,f,g,S,p,m){let x=o(u,f,g,S,p,m);g.transmission>0?i.unshift(x):g.transparent===!0?s.unshift(x):t.unshift(x)}function h(u,f){t.length>1&&t.sort(u||X0),i.length>1&&i.sort(f||Fu),s.length>1&&s.sort(f||Fu)}function d(){for(let u=e,f=n.length;u<f;u++){let g=n[u];if(g.id===null)break;g.id=null,g.object=null,g.geometry=null,g.material=null,g.group=null}}return{opaque:t,transmissive:i,transparent:s,init:r,push:l,unshift:c,finish:d,sort:h}}function q0(){let n=new WeakMap;function e(i,s){let r=n.get(i),a;return r===void 0?(a=new Nu,n.set(i,[a])):s>=r.length?(a=new Nu,r.push(a)):a=r[s],a}function t(){n=new WeakMap}return{get:e,dispose:t}}function Y0(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new C,color:new Ze};break;case"SpotLight":t={position:new C,direction:new C,color:new Ze,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new C,color:new Ze,distance:0,decay:0};break;case"HemisphereLight":t={direction:new C,skyColor:new Ze,groundColor:new Ze};break;case"RectAreaLight":t={color:new Ze,position:new C,halfWidth:new C,halfHeight:new C};break}return n[e.id]=t,t}}}function $0(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ge};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ge};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ge,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}var Z0=0;function J0(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function K0(n){let e=new Y0,t=$0(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new C);let s=new C,r=new ut,a=new ut;function o(c){let h=0,d=0,u=0;for(let w=0;w<9;w++)i.probe[w].set(0,0,0);let f=0,g=0,S=0,p=0,m=0,x=0,M=0,b=0,A=0,E=0,I=0;c.sort(J0);for(let w=0,F=c.length;w<F;w++){let R=c[w],O=R.color,G=R.intensity,X=R.distance,N=null;if(R.shadow&&R.shadow.map&&(R.shadow.map.texture.format===gi?N=R.shadow.map.texture:N=R.shadow.map.depthTexture||R.shadow.map.texture),R.isAmbientLight)h+=O.r*G,d+=O.g*G,u+=O.b*G;else if(R.isLightProbe){for(let z=0;z<9;z++)i.probe[z].addScaledVector(R.sh.coefficients[z],G);I++}else if(R.isDirectionalLight){let z=e.get(R);if(z.color.copy(R.color).multiplyScalar(R.intensity),R.castShadow){let V=R.shadow,j=t.get(R);j.shadowIntensity=V.intensity,j.shadowBias=V.bias,j.shadowNormalBias=V.normalBias,j.shadowRadius=V.radius,j.shadowMapSize=V.mapSize,i.directionalShadow[f]=j,i.directionalShadowMap[f]=N,i.directionalShadowMatrix[f]=R.shadow.matrix,x++}i.directional[f]=z,f++}else if(R.isSpotLight){let z=e.get(R);z.position.setFromMatrixPosition(R.matrixWorld),z.color.copy(O).multiplyScalar(G),z.distance=X,z.coneCos=Math.cos(R.angle),z.penumbraCos=Math.cos(R.angle*(1-R.penumbra)),z.decay=R.decay,i.spot[S]=z;let V=R.shadow;if(R.map&&(i.spotLightMap[A]=R.map,A++,V.updateMatrices(R),R.castShadow&&E++),i.spotLightMatrix[S]=V.matrix,R.castShadow){let j=t.get(R);j.shadowIntensity=V.intensity,j.shadowBias=V.bias,j.shadowNormalBias=V.normalBias,j.shadowRadius=V.radius,j.shadowMapSize=V.mapSize,i.spotShadow[S]=j,i.spotShadowMap[S]=N,b++}S++}else if(R.isRectAreaLight){let z=e.get(R);z.color.copy(O).multiplyScalar(G),z.halfWidth.set(R.width*.5,0,0),z.halfHeight.set(0,R.height*.5,0),i.rectArea[p]=z,p++}else if(R.isPointLight){let z=e.get(R);if(z.color.copy(R.color).multiplyScalar(R.intensity),z.distance=R.distance,z.decay=R.decay,R.castShadow){let V=R.shadow,j=t.get(R);j.shadowIntensity=V.intensity,j.shadowBias=V.bias,j.shadowNormalBias=V.normalBias,j.shadowRadius=V.radius,j.shadowMapSize=V.mapSize,j.shadowCameraNear=V.camera.near,j.shadowCameraFar=V.camera.far,i.pointShadow[g]=j,i.pointShadowMap[g]=N,i.pointShadowMatrix[g]=R.shadow.matrix,M++}i.point[g]=z,g++}else if(R.isHemisphereLight){let z=e.get(R);z.skyColor.copy(R.color).multiplyScalar(G),z.groundColor.copy(R.groundColor).multiplyScalar(G),i.hemi[m]=z,m++}}p>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=le.LTC_FLOAT_1,i.rectAreaLTC2=le.LTC_FLOAT_2):(i.rectAreaLTC1=le.LTC_HALF_1,i.rectAreaLTC2=le.LTC_HALF_2)),i.ambient[0]=h,i.ambient[1]=d,i.ambient[2]=u;let y=i.hash;(y.directionalLength!==f||y.pointLength!==g||y.spotLength!==S||y.rectAreaLength!==p||y.hemiLength!==m||y.numDirectionalShadows!==x||y.numPointShadows!==M||y.numSpotShadows!==b||y.numSpotMaps!==A||y.numLightProbes!==I)&&(i.directional.length=f,i.spot.length=S,i.rectArea.length=p,i.point.length=g,i.hemi.length=m,i.directionalShadow.length=x,i.directionalShadowMap.length=x,i.pointShadow.length=M,i.pointShadowMap.length=M,i.spotShadow.length=b,i.spotShadowMap.length=b,i.directionalShadowMatrix.length=x,i.pointShadowMatrix.length=M,i.spotLightMatrix.length=b+A-E,i.spotLightMap.length=A,i.numSpotLightShadowsWithMaps=E,i.numLightProbes=I,y.directionalLength=f,y.pointLength=g,y.spotLength=S,y.rectAreaLength=p,y.hemiLength=m,y.numDirectionalShadows=x,y.numPointShadows=M,y.numSpotShadows=b,y.numSpotMaps=A,y.numLightProbes=I,i.version=Z0++)}function l(c,h){let d=0,u=0,f=0,g=0,S=0,p=h.matrixWorldInverse;for(let m=0,x=c.length;m<x;m++){let M=c[m];if(M.isDirectionalLight){let b=i.directional[d];b.direction.setFromMatrixPosition(M.matrixWorld),s.setFromMatrixPosition(M.target.matrixWorld),b.direction.sub(s),b.direction.transformDirection(p),d++}else if(M.isSpotLight){let b=i.spot[f];b.position.setFromMatrixPosition(M.matrixWorld),b.position.applyMatrix4(p),b.direction.setFromMatrixPosition(M.matrixWorld),s.setFromMatrixPosition(M.target.matrixWorld),b.direction.sub(s),b.direction.transformDirection(p),f++}else if(M.isRectAreaLight){let b=i.rectArea[g];b.position.setFromMatrixPosition(M.matrixWorld),b.position.applyMatrix4(p),a.identity(),r.copy(M.matrixWorld),r.premultiply(p),a.extractRotation(r),b.halfWidth.set(M.width*.5,0,0),b.halfHeight.set(0,M.height*.5,0),b.halfWidth.applyMatrix4(a),b.halfHeight.applyMatrix4(a),g++}else if(M.isPointLight){let b=i.point[u];b.position.setFromMatrixPosition(M.matrixWorld),b.position.applyMatrix4(p),u++}else if(M.isHemisphereLight){let b=i.hemi[S];b.direction.setFromMatrixPosition(M.matrixWorld),b.direction.transformDirection(p),S++}}}return{setup:o,setupView:l,state:i}}function Uu(n){let e=new K0(n),t=[],i=[],s=[];function r(u){d.camera=u,t.length=0,i.length=0,s.length=0}function a(u){t.push(u)}function o(u){i.push(u)}function l(u){s.push(u)}function c(){e.setup(t)}function h(u){e.setupView(t,u)}let d={lightsArray:t,shadowsArray:i,lightProbeGridArray:s,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:r,state:d,setupLights:c,setupLightsView:h,pushLight:a,pushShadow:o,pushLightProbeGrid:l}}function j0(n){let e=new WeakMap;function t(s,r=0){let a=e.get(s),o;return a===void 0?(o=new Uu(n),e.set(s,[o])):r>=a.length?(o=new Uu(n),a.push(o)):o=a[r],o}function i(){e=new WeakMap}return{get:t,dispose:i}}var Q0=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,e_=`uniform sampler2D shadow_pass;
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
}`,t_=[new C(1,0,0),new C(-1,0,0),new C(0,1,0),new C(0,-1,0),new C(0,0,1),new C(0,0,-1)],n_=[new C(0,-1,0),new C(0,-1,0),new C(0,0,1),new C(0,0,-1),new C(0,-1,0),new C(0,-1,0)],Ou=new ut,vr=new C,fc=new C;function i_(n,e,t){let i=new $s,s=new ge,r=new ge,a=new xt,o=new La,l=new Fa,c={},h=t.maxTextureSize,d={[Gn]:Ht,[Ht]:Gn,[Bt]:Bt},u=new tn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ge},radius:{value:4}},vertexShader:Q0,fragmentShader:e_}),f=u.clone();f.defines.HORIZONTAL_PASS=1;let g=new ot;g.setAttribute("position",new Wt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let S=new ht(g,u),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=hr;let m=this.type;this.render=function(E,I,y){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||E.length===0)return;this.type===Ch&&(Ce("WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead."),this.type=hr);let w=n.getRenderTarget(),F=n.getActiveCubeFace(),R=n.getActiveMipmapLevel(),O=n.state;O.setBlending(Rn),O.buffers.depth.getReversed()===!0?O.buffers.color.setClear(0,0,0,0):O.buffers.color.setClear(1,1,1,1),O.buffers.depth.setTest(!0),O.setScissorTest(!1);let G=m!==this.type;G&&I.traverse(function(X){X.material&&(Array.isArray(X.material)?X.material.forEach(N=>N.needsUpdate=!0):X.material.needsUpdate=!0)});for(let X=0,N=E.length;X<N;X++){let z=E[X],V=z.shadow;if(V===void 0){Ce("WebGLShadowMap:",z,"has no shadow.");continue}if(V.autoUpdate===!1&&V.needsUpdate===!1)continue;s.copy(V.mapSize);let j=V.getFrameExtents();s.multiply(j),r.copy(V.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/j.x),s.x=r.x*j.x,V.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/j.y),s.y=r.y*j.y,V.mapSize.y=r.y));let Q=n.state.buffers.depth.getReversed();if(V.camera._reversedDepth=Q,V.map===null||G===!0){if(V.map!==null&&(V.map.depthTexture!==null&&(V.map.depthTexture.dispose(),V.map.depthTexture=null),V.map.dispose()),this.type===Ss){if(z.isPointLight){Ce("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}V.map=new jt(s.x,s.y,{format:gi,type:In,minFilter:we,magFilter:we,generateMipmaps:!1}),V.map.texture.name=z.name+".shadowMap",V.map.depthTexture=new Xn(s.x,s.y,gn),V.map.depthTexture.name=z.name+".shadowMapDepth",V.map.depthTexture.format=Tn,V.map.depthTexture.compareFunction=null,V.map.depthTexture.minFilter=Rt,V.map.depthTexture.magFilter=Rt}else z.isPointLight?(V.map=new Bo(s.x),V.map.depthTexture=new Aa(s.x,mn)):(V.map=new jt(s.x,s.y),V.map.depthTexture=new Xn(s.x,s.y,mn)),V.map.depthTexture.name=z.name+".shadowMap",V.map.depthTexture.format=Tn,this.type===hr?(V.map.depthTexture.compareFunction=Q?Fo:Lo,V.map.depthTexture.minFilter=we,V.map.depthTexture.magFilter=we):(V.map.depthTexture.compareFunction=null,V.map.depthTexture.minFilter=Rt,V.map.depthTexture.magFilter=Rt);V.camera.updateProjectionMatrix()}let ce=V.map.isWebGLCubeRenderTarget?6:1;for(let ye=0;ye<ce;ye++){if(V.map.isWebGLCubeRenderTarget)n.setRenderTarget(V.map,ye),n.clear();else{ye===0&&(n.setRenderTarget(V.map),n.clear());let Te=V.getViewport(ye);a.set(r.x*Te.x,r.y*Te.y,r.x*Te.z,r.y*Te.w),O.viewport(a)}if(z.isPointLight){let Te=V.camera,Ye=V.matrix,je=z.distance||Te.far;je!==Te.far&&(Te.far=je,Te.updateProjectionMatrix()),vr.setFromMatrixPosition(z.matrixWorld),Te.position.copy(vr),fc.copy(Te.position),fc.add(t_[ye]),Te.up.copy(n_[ye]),Te.lookAt(fc),Te.updateMatrixWorld(),Ye.makeTranslation(-vr.x,-vr.y,-vr.z),Ou.multiplyMatrices(Te.projectionMatrix,Te.matrixWorldInverse),V._frustum.setFromProjectionMatrix(Ou,Te.coordinateSystem,Te.reversedDepth)}else V.updateMatrices(z);i=V.getFrustum(),b(I,y,V.camera,z,this.type)}V.isPointLightShadow!==!0&&this.type===Ss&&x(V,y),V.needsUpdate=!1}m=this.type,p.needsUpdate=!1,n.setRenderTarget(w,F,R)};function x(E,I){let y=e.update(S);u.defines.VSM_SAMPLES!==E.blurSamples&&(u.defines.VSM_SAMPLES=E.blurSamples,f.defines.VSM_SAMPLES=E.blurSamples,u.needsUpdate=!0,f.needsUpdate=!0),E.mapPass===null&&(E.mapPass=new jt(s.x,s.y,{format:gi,type:In})),u.uniforms.shadow_pass.value=E.map.depthTexture,u.uniforms.resolution.value=E.mapSize,u.uniforms.radius.value=E.radius,n.setRenderTarget(E.mapPass),n.clear(),n.renderBufferDirect(I,null,y,u,S,null),f.uniforms.shadow_pass.value=E.mapPass.texture,f.uniforms.resolution.value=E.mapSize,f.uniforms.radius.value=E.radius,n.setRenderTarget(E.map),n.clear(),n.renderBufferDirect(I,null,y,f,S,null)}function M(E,I,y,w){let F=null,R=y.isPointLight===!0?E.customDistanceMaterial:E.customDepthMaterial;if(R!==void 0)F=R;else if(F=y.isPointLight===!0?l:o,n.localClippingEnabled&&I.clipShadows===!0&&Array.isArray(I.clippingPlanes)&&I.clippingPlanes.length!==0||I.displacementMap&&I.displacementScale!==0||I.alphaMap&&I.alphaTest>0||I.map&&I.alphaTest>0||I.alphaToCoverage===!0){let O=F.uuid,G=I.uuid,X=c[O];X===void 0&&(X={},c[O]=X);let N=X[G];N===void 0&&(N=F.clone(),X[G]=N,I.addEventListener("dispose",A)),F=N}if(F.visible=I.visible,F.wireframe=I.wireframe,w===Ss?F.side=I.shadowSide!==null?I.shadowSide:I.side:F.side=I.shadowSide!==null?I.shadowSide:d[I.side],F.alphaMap=I.alphaMap,F.alphaTest=I.alphaToCoverage===!0?.5:I.alphaTest,F.map=I.map,F.clipShadows=I.clipShadows,F.clippingPlanes=I.clippingPlanes,F.clipIntersection=I.clipIntersection,F.displacementMap=I.displacementMap,F.displacementScale=I.displacementScale,F.displacementBias=I.displacementBias,F.wireframeLinewidth=I.wireframeLinewidth,F.linewidth=I.linewidth,y.isPointLight===!0&&F.isMeshDistanceMaterial===!0){let O=n.properties.get(F);O.light=y}return F}function b(E,I,y,w,F){if(E.visible===!1)return;if(E.layers.test(I.layers)&&(E.isMesh||E.isLine||E.isPoints)&&(E.castShadow||E.receiveShadow&&F===Ss)&&(!E.frustumCulled||i.intersectsObject(E))){E.modelViewMatrix.multiplyMatrices(y.matrixWorldInverse,E.matrixWorld);let G=e.update(E),X=E.material;if(Array.isArray(X)){let N=G.groups;for(let z=0,V=N.length;z<V;z++){let j=N[z],Q=X[j.materialIndex];if(Q&&Q.visible){let ce=M(E,Q,w,F);E.onBeforeShadow(n,E,I,y,G,ce,j),n.renderBufferDirect(y,null,G,ce,E,j),E.onAfterShadow(n,E,I,y,G,ce,j)}}}else if(X.visible){let N=M(E,X,w,F);E.onBeforeShadow(n,E,I,y,G,N,null),n.renderBufferDirect(y,null,G,N,E,null),E.onAfterShadow(n,E,I,y,G,N,null)}}let O=E.children;for(let G=0,X=O.length;G<X;G++)b(O[G],I,y,w,F)}function A(E){E.target.removeEventListener("dispose",A);for(let y in c){let w=c[y],F=E.target.uuid;F in w&&(w[F].dispose(),delete w[F])}}}function s_(n,e){function t(){let P=!1,ne=new xt,q=null,pe=new xt(0,0,0,0);return{setMask:function(re){q!==re&&!P&&(n.colorMask(re,re,re,re),q=re)},setLocked:function(re){P=re},setClear:function(re,J,Me,Ne,vt){vt===!0&&(re*=Ne,J*=Ne,Me*=Ne),ne.set(re,J,Me,Ne),pe.equals(ne)===!1&&(n.clearColor(re,J,Me,Ne),pe.copy(ne))},reset:function(){P=!1,q=null,pe.set(-1,0,0,0)}}}function i(){let P=!1,ne=!1,q=null,pe=null,re=null;return{setReversed:function(J){if(ne!==J){let Me=e.get("EXT_clip_control");J?Me.clipControlEXT(Me.LOWER_LEFT_EXT,Me.ZERO_TO_ONE_EXT):Me.clipControlEXT(Me.LOWER_LEFT_EXT,Me.NEGATIVE_ONE_TO_ONE_EXT),ne=J;let Ne=re;re=null,this.setClear(Ne)}},getReversed:function(){return ne},setTest:function(J){J?ie(n.DEPTH_TEST):Ie(n.DEPTH_TEST)},setMask:function(J){q!==J&&!P&&(n.depthMask(J),q=J)},setFunc:function(J){if(ne&&(J=ou[J]),pe!==J){switch(J){case oa:n.depthFunc(n.NEVER);break;case la:n.depthFunc(n.ALWAYS);break;case ca:n.depthFunc(n.LESS);break;case Ri:n.depthFunc(n.LEQUAL);break;case ha:n.depthFunc(n.EQUAL);break;case ua:n.depthFunc(n.GEQUAL);break;case da:n.depthFunc(n.GREATER);break;case fa:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}pe=J}},setLocked:function(J){P=J},setClear:function(J){re!==J&&(re=J,ne&&(J=1-J),n.clearDepth(J))},reset:function(){P=!1,q=null,pe=null,re=null,ne=!1}}}function s(){let P=!1,ne=null,q=null,pe=null,re=null,J=null,Me=null,Ne=null,vt=null;return{setTest:function(et){P||(et?ie(n.STENCIL_TEST):Ie(n.STENCIL_TEST))},setMask:function(et){ne!==et&&!P&&(n.stencilMask(et),ne=et)},setFunc:function(et,Fn,yn){(q!==et||pe!==Fn||re!==yn)&&(n.stencilFunc(et,Fn,yn),q=et,pe=Fn,re=yn)},setOp:function(et,Fn,yn){(J!==et||Me!==Fn||Ne!==yn)&&(n.stencilOp(et,Fn,yn),J=et,Me=Fn,Ne=yn)},setLocked:function(et){P=et},setClear:function(et){vt!==et&&(n.clearStencil(et),vt=et)},reset:function(){P=!1,ne=null,q=null,pe=null,re=null,J=null,Me=null,Ne=null,vt=null}}}let r=new t,a=new i,o=new s,l=new WeakMap,c=new WeakMap,h={},d={},u={},f=new WeakMap,g=[],S=null,p=!1,m=null,x=null,M=null,b=null,A=null,E=null,I=null,y=new Ze(0,0,0),w=0,F=!1,R=null,O=null,G=null,X=null,N=null,z=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS),V=!1,j=0,Q=n.getParameter(n.VERSION);Q.indexOf("WebGL")!==-1?(j=parseFloat(/^WebGL (\d)/.exec(Q)[1]),V=j>=1):Q.indexOf("OpenGL ES")!==-1&&(j=parseFloat(/^OpenGL ES (\d)/.exec(Q)[1]),V=j>=2);let ce=null,ye={},Te=n.getParameter(n.SCISSOR_BOX),Ye=n.getParameter(n.VIEWPORT),je=new xt().fromArray(Te),Oe=new xt().fromArray(Ye);function Z(P,ne,q,pe){let re=new Uint8Array(4),J=n.createTexture();n.bindTexture(P,J),n.texParameteri(P,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(P,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let Me=0;Me<q;Me++)P===n.TEXTURE_3D||P===n.TEXTURE_2D_ARRAY?n.texImage3D(ne,0,n.RGBA,1,1,pe,0,n.RGBA,n.UNSIGNED_BYTE,re):n.texImage2D(ne+Me,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,re);return J}let de={};de[n.TEXTURE_2D]=Z(n.TEXTURE_2D,n.TEXTURE_2D,1),de[n.TEXTURE_CUBE_MAP]=Z(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),de[n.TEXTURE_2D_ARRAY]=Z(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),de[n.TEXTURE_3D]=Z(n.TEXTURE_3D,n.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),ie(n.DEPTH_TEST),a.setFunc(Ri),Tt(!1),ft(Nl),ie(n.CULL_FACE),lt(Rn);function ie(P){h[P]!==!0&&(n.enable(P),h[P]=!0)}function Ie(P){h[P]!==!1&&(n.disable(P),h[P]=!1)}function Fe(P,ne){return u[P]!==ne?(n.bindFramebuffer(P,ne),u[P]=ne,P===n.DRAW_FRAMEBUFFER&&(u[n.FRAMEBUFFER]=ne),P===n.FRAMEBUFFER&&(u[n.DRAW_FRAMEBUFFER]=ne),!0):!1}function Pe(P,ne){let q=g,pe=!1;if(P){q=f.get(ne),q===void 0&&(q=[],f.set(ne,q));let re=P.textures;if(q.length!==re.length||q[0]!==n.COLOR_ATTACHMENT0){for(let J=0,Me=re.length;J<Me;J++)q[J]=n.COLOR_ATTACHMENT0+J;q.length=re.length,pe=!0}}else q[0]!==n.BACK&&(q[0]=n.BACK,pe=!0);pe&&n.drawBuffers(q)}function dt(P){return S!==P?(n.useProgram(P),S=P,!0):!1}let Ge={[ai]:n.FUNC_ADD,[Ih]:n.FUNC_SUBTRACT,[Ph]:n.FUNC_REVERSE_SUBTRACT};Ge[Dh]=n.MIN,Ge[Lh]=n.MAX;let Qe={[Fh]:n.ZERO,[Nh]:n.ONE,[Uh]:n.SRC_COLOR,[ra]:n.SRC_ALPHA,[Vh]:n.SRC_ALPHA_SATURATE,[zh]:n.DST_COLOR,[Bh]:n.DST_ALPHA,[Oh]:n.ONE_MINUS_SRC_COLOR,[aa]:n.ONE_MINUS_SRC_ALPHA,[Hh]:n.ONE_MINUS_DST_COLOR,[kh]:n.ONE_MINUS_DST_ALPHA,[Gh]:n.CONSTANT_COLOR,[Wh]:n.ONE_MINUS_CONSTANT_COLOR,[Xh]:n.CONSTANT_ALPHA,[qh]:n.ONE_MINUS_CONSTANT_ALPHA};function lt(P,ne,q,pe,re,J,Me,Ne,vt,et){if(P===Rn){p===!0&&(Ie(n.BLEND),p=!1);return}if(p===!1&&(ie(n.BLEND),p=!0),P!==Rh){if(P!==m||et!==F){if((x!==ai||A!==ai)&&(n.blendEquation(n.FUNC_ADD),x=ai,A=ai),et)switch(P){case Ci:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Ul:n.blendFunc(n.ONE,n.ONE);break;case Ol:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Bl:n.blendFuncSeparate(n.DST_COLOR,n.ONE_MINUS_SRC_ALPHA,n.ZERO,n.ONE);break;default:Re("WebGLState: Invalid blending: ",P);break}else switch(P){case Ci:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Ul:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE,n.ONE,n.ONE);break;case Ol:Re("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Bl:Re("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Re("WebGLState: Invalid blending: ",P);break}M=null,b=null,E=null,I=null,y.set(0,0,0),w=0,m=P,F=et}return}re=re||ne,J=J||q,Me=Me||pe,(ne!==x||re!==A)&&(n.blendEquationSeparate(Ge[ne],Ge[re]),x=ne,A=re),(q!==M||pe!==b||J!==E||Me!==I)&&(n.blendFuncSeparate(Qe[q],Qe[pe],Qe[J],Qe[Me]),M=q,b=pe,E=J,I=Me),(Ne.equals(y)===!1||vt!==w)&&(n.blendColor(Ne.r,Ne.g,Ne.b,vt),y.copy(Ne),w=vt),m=P,F=!1}function He(P,ne){P.side===Bt?Ie(n.CULL_FACE):ie(n.CULL_FACE);let q=P.side===Ht;ne&&(q=!q),Tt(q),P.blending===Ci&&P.transparent===!1?lt(Rn):lt(P.blending,P.blendEquation,P.blendSrc,P.blendDst,P.blendEquationAlpha,P.blendSrcAlpha,P.blendDstAlpha,P.blendColor,P.blendAlpha,P.premultipliedAlpha),a.setFunc(P.depthFunc),a.setTest(P.depthTest),a.setMask(P.depthWrite),r.setMask(P.colorWrite);let pe=P.stencilWrite;o.setTest(pe),pe&&(o.setMask(P.stencilWriteMask),o.setFunc(P.stencilFunc,P.stencilRef,P.stencilFuncMask),o.setOp(P.stencilFail,P.stencilZFail,P.stencilZPass)),D(P.polygonOffset,P.polygonOffsetFactor,P.polygonOffsetUnits),P.alphaToCoverage===!0?ie(n.SAMPLE_ALPHA_TO_COVERAGE):Ie(n.SAMPLE_ALPHA_TO_COVERAGE)}function Tt(P){R!==P&&(P?n.frontFace(n.CW):n.frontFace(n.CCW),R=P)}function ft(P){P!==wh?(ie(n.CULL_FACE),P!==O&&(P===Nl?n.cullFace(n.BACK):P===Ah?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):Ie(n.CULL_FACE),O=P}function Yt(P){P!==G&&(V&&n.lineWidth(P),G=P)}function D(P,ne,q){P?(ie(n.POLYGON_OFFSET_FILL),(X!==ne||N!==q)&&(X=ne,N=q,a.getReversed()&&(ne=-ne),n.polygonOffset(ne,q))):Ie(n.POLYGON_OFFSET_FILL)}function Et(P){P?ie(n.SCISSOR_TEST):Ie(n.SCISSOR_TEST)}function We(P){P===void 0&&(P=n.TEXTURE0+z-1),ce!==P&&(n.activeTexture(P),ce=P)}function rt(P,ne,q){q===void 0&&(ce===null?q=n.TEXTURE0+z-1:q=ce);let pe=ye[q];pe===void 0&&(pe={type:void 0,texture:void 0},ye[q]=pe),(pe.type!==P||pe.texture!==ne)&&(ce!==q&&(n.activeTexture(q),ce=q),n.bindTexture(P,ne||de[P]),pe.type=P,pe.texture=ne)}function oe(){let P=ye[ce];P!==void 0&&P.type!==void 0&&(n.bindTexture(P.type,null),P.type=void 0,P.texture=void 0)}function gt(){try{n.compressedTexImage2D(...arguments)}catch(P){Re("WebGLState:",P)}}function T(){try{n.compressedTexImage3D(...arguments)}catch(P){Re("WebGLState:",P)}}function _(){try{n.texSubImage2D(...arguments)}catch(P){Re("WebGLState:",P)}}function U(){try{n.texSubImage3D(...arguments)}catch(P){Re("WebGLState:",P)}}function Y(){try{n.compressedTexSubImage2D(...arguments)}catch(P){Re("WebGLState:",P)}}function K(){try{n.compressedTexSubImage3D(...arguments)}catch(P){Re("WebGLState:",P)}}function ee(){try{n.texStorage2D(...arguments)}catch(P){Re("WebGLState:",P)}}function ae(){try{n.texStorage3D(...arguments)}catch(P){Re("WebGLState:",P)}}function W(){try{n.texImage2D(...arguments)}catch(P){Re("WebGLState:",P)}}function $(){try{n.texImage3D(...arguments)}catch(P){Re("WebGLState:",P)}}function fe(P){return d[P]!==void 0?d[P]:n.getParameter(P)}function _e(P,ne){d[P]!==ne&&(n.pixelStorei(P,ne),d[P]=ne)}function se(P){je.equals(P)===!1&&(n.scissor(P.x,P.y,P.z,P.w),je.copy(P))}function te(P){Oe.equals(P)===!1&&(n.viewport(P.x,P.y,P.z,P.w),Oe.copy(P))}function De(P,ne){let q=c.get(ne);q===void 0&&(q=new WeakMap,c.set(ne,q));let pe=q.get(P);pe===void 0&&(pe=n.getUniformBlockIndex(ne,P.name),q.set(P,pe))}function Be(P,ne){let pe=c.get(ne).get(P);l.get(ne)!==pe&&(n.uniformBlockBinding(ne,pe,P.__bindingPointIndex),l.set(ne,pe))}function Je(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),a.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),n.pixelStorei(n.PACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,!1),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,n.BROWSER_DEFAULT_WEBGL),n.pixelStorei(n.PACK_ROW_LENGTH,0),n.pixelStorei(n.PACK_SKIP_PIXELS,0),n.pixelStorei(n.PACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_ROW_LENGTH,0),n.pixelStorei(n.UNPACK_IMAGE_HEIGHT,0),n.pixelStorei(n.UNPACK_SKIP_PIXELS,0),n.pixelStorei(n.UNPACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_SKIP_IMAGES,0),h={},d={},ce=null,ye={},u={},f=new WeakMap,g=[],S=null,p=!1,m=null,x=null,M=null,b=null,A=null,E=null,I=null,y=new Ze(0,0,0),w=0,F=!1,R=null,O=null,G=null,X=null,N=null,je.set(0,0,n.canvas.width,n.canvas.height),Oe.set(0,0,n.canvas.width,n.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:ie,disable:Ie,bindFramebuffer:Fe,drawBuffers:Pe,useProgram:dt,setBlending:lt,setMaterial:He,setFlipSided:Tt,setCullFace:ft,setLineWidth:Yt,setPolygonOffset:D,setScissorTest:Et,activeTexture:We,bindTexture:rt,unbindTexture:oe,compressedTexImage2D:gt,compressedTexImage3D:T,texImage2D:W,texImage3D:$,pixelStorei:_e,getParameter:fe,updateUBOMapping:De,uniformBlockBinding:Be,texStorage2D:ee,texStorage3D:ae,texSubImage2D:_,texSubImage3D:U,compressedTexSubImage2D:Y,compressedTexSubImage3D:K,scissor:se,viewport:te,reset:Je}}function r_(n,e,t,i,s,r,a){let o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new ge,h=new WeakMap,d=new Set,u,f=new WeakMap,g=!1;try{g=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function S(T,_){return g?new OffscreenCanvas(T,_):rs("canvas")}function p(T,_,U){let Y=1,K=gt(T);if((K.width>U||K.height>U)&&(Y=U/Math.max(K.width,K.height)),Y<1)if(typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&T instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&T instanceof ImageBitmap||typeof VideoFrame<"u"&&T instanceof VideoFrame){let ee=Math.floor(Y*K.width),ae=Math.floor(Y*K.height);u===void 0&&(u=S(ee,ae));let W=_?S(ee,ae):u;return W.width=ee,W.height=ae,W.getContext("2d").drawImage(T,0,0,ee,ae),Ce("WebGLRenderer: Texture has been resized from ("+K.width+"x"+K.height+") to ("+ee+"x"+ae+")."),W}else return"data"in T&&Ce("WebGLRenderer: Image in DataTexture is too big ("+K.width+"x"+K.height+")."),T;return T}function m(T){return T.generateMipmaps}function x(T){n.generateMipmap(T)}function M(T){return T.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:T.isWebGL3DRenderTarget?n.TEXTURE_3D:T.isWebGLArrayRenderTarget||T.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function b(T,_,U,Y,K,ee=!1){if(T!==null){if(n[T]!==void 0)return n[T];Ce("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+T+"'")}let ae;Y&&(ae=e.get("EXT_texture_norm16"),ae||Ce("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let W=_;if(_===n.RED&&(U===n.FLOAT&&(W=n.R32F),U===n.HALF_FLOAT&&(W=n.R16F),U===n.UNSIGNED_BYTE&&(W=n.R8),U===n.UNSIGNED_SHORT&&ae&&(W=ae.R16_EXT),U===n.SHORT&&ae&&(W=ae.R16_SNORM_EXT)),_===n.RED_INTEGER&&(U===n.UNSIGNED_BYTE&&(W=n.R8UI),U===n.UNSIGNED_SHORT&&(W=n.R16UI),U===n.UNSIGNED_INT&&(W=n.R32UI),U===n.BYTE&&(W=n.R8I),U===n.SHORT&&(W=n.R16I),U===n.INT&&(W=n.R32I)),_===n.RG&&(U===n.FLOAT&&(W=n.RG32F),U===n.HALF_FLOAT&&(W=n.RG16F),U===n.UNSIGNED_BYTE&&(W=n.RG8),U===n.UNSIGNED_SHORT&&ae&&(W=ae.RG16_EXT),U===n.SHORT&&ae&&(W=ae.RG16_SNORM_EXT)),_===n.RG_INTEGER&&(U===n.UNSIGNED_BYTE&&(W=n.RG8UI),U===n.UNSIGNED_SHORT&&(W=n.RG16UI),U===n.UNSIGNED_INT&&(W=n.RG32UI),U===n.BYTE&&(W=n.RG8I),U===n.SHORT&&(W=n.RG16I),U===n.INT&&(W=n.RG32I)),_===n.RGB_INTEGER&&(U===n.UNSIGNED_BYTE&&(W=n.RGB8UI),U===n.UNSIGNED_SHORT&&(W=n.RGB16UI),U===n.UNSIGNED_INT&&(W=n.RGB32UI),U===n.BYTE&&(W=n.RGB8I),U===n.SHORT&&(W=n.RGB16I),U===n.INT&&(W=n.RGB32I)),_===n.RGBA_INTEGER&&(U===n.UNSIGNED_BYTE&&(W=n.RGBA8UI),U===n.UNSIGNED_SHORT&&(W=n.RGBA16UI),U===n.UNSIGNED_INT&&(W=n.RGBA32UI),U===n.BYTE&&(W=n.RGBA8I),U===n.SHORT&&(W=n.RGBA16I),U===n.INT&&(W=n.RGBA32I)),_===n.RGB&&(U===n.UNSIGNED_SHORT&&ae&&(W=ae.RGB16_EXT),U===n.SHORT&&ae&&(W=ae.RGB16_SNORM_EXT),U===n.UNSIGNED_INT_5_9_9_9_REV&&(W=n.RGB9_E5),U===n.UNSIGNED_INT_10F_11F_11F_REV&&(W=n.R11F_G11F_B10F)),_===n.RGBA){let $=ee?Hs:Xe.getTransfer(K);U===n.FLOAT&&(W=n.RGBA32F),U===n.HALF_FLOAT&&(W=n.RGBA16F),U===n.UNSIGNED_BYTE&&(W=$===Ke?n.SRGB8_ALPHA8:n.RGBA8),U===n.UNSIGNED_SHORT&&ae&&(W=ae.RGBA16_EXT),U===n.SHORT&&ae&&(W=ae.RGBA16_SNORM_EXT),U===n.UNSIGNED_SHORT_4_4_4_4&&(W=n.RGBA4),U===n.UNSIGNED_SHORT_5_5_5_1&&(W=n.RGB5_A1)}return(W===n.R16F||W===n.R32F||W===n.RG16F||W===n.RG32F||W===n.RGBA16F||W===n.RGBA32F)&&e.get("EXT_color_buffer_float"),W}function A(T,_){let U;return T?_===null||_===mn||_===bs?U=n.DEPTH24_STENCIL8:_===gn?U=n.DEPTH32F_STENCIL8:_===Ms&&(U=n.DEPTH24_STENCIL8,Ce("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):_===null||_===mn||_===bs?U=n.DEPTH_COMPONENT24:_===gn?U=n.DEPTH_COMPONENT32F:_===Ms&&(U=n.DEPTH_COMPONENT16),U}function E(T,_){return m(T)===!0||T.isFramebufferTexture&&T.minFilter!==Rt&&T.minFilter!==we?Math.log2(Math.max(_.width,_.height))+1:T.mipmaps!==void 0&&T.mipmaps.length>0?T.mipmaps.length:T.isCompressedTexture&&Array.isArray(T.image)?_.mipmaps.length:1}function I(T){let _=T.target;_.removeEventListener("dispose",I),w(_),_.isVideoTexture&&h.delete(_),_.isHTMLTexture&&d.delete(_)}function y(T){let _=T.target;_.removeEventListener("dispose",y),R(_)}function w(T){let _=i.get(T);if(_.__webglInit===void 0)return;let U=T.source,Y=f.get(U);if(Y){let K=Y[_.__cacheKey];K.usedTimes--,K.usedTimes===0&&F(T),Object.keys(Y).length===0&&f.delete(U)}i.remove(T)}function F(T){let _=i.get(T);n.deleteTexture(_.__webglTexture);let U=T.source,Y=f.get(U);delete Y[_.__cacheKey],a.memory.textures--}function R(T){let _=i.get(T);if(T.depthTexture&&(T.depthTexture.dispose(),i.remove(T.depthTexture)),T.isWebGLCubeRenderTarget)for(let Y=0;Y<6;Y++){if(Array.isArray(_.__webglFramebuffer[Y]))for(let K=0;K<_.__webglFramebuffer[Y].length;K++)n.deleteFramebuffer(_.__webglFramebuffer[Y][K]);else n.deleteFramebuffer(_.__webglFramebuffer[Y]);_.__webglDepthbuffer&&n.deleteRenderbuffer(_.__webglDepthbuffer[Y])}else{if(Array.isArray(_.__webglFramebuffer))for(let Y=0;Y<_.__webglFramebuffer.length;Y++)n.deleteFramebuffer(_.__webglFramebuffer[Y]);else n.deleteFramebuffer(_.__webglFramebuffer);if(_.__webglDepthbuffer&&n.deleteRenderbuffer(_.__webglDepthbuffer),_.__webglMultisampledFramebuffer&&n.deleteFramebuffer(_.__webglMultisampledFramebuffer),_.__webglColorRenderbuffer)for(let Y=0;Y<_.__webglColorRenderbuffer.length;Y++)_.__webglColorRenderbuffer[Y]&&n.deleteRenderbuffer(_.__webglColorRenderbuffer[Y]);_.__webglDepthRenderbuffer&&n.deleteRenderbuffer(_.__webglDepthRenderbuffer)}let U=T.textures;for(let Y=0,K=U.length;Y<K;Y++){let ee=i.get(U[Y]);ee.__webglTexture&&(n.deleteTexture(ee.__webglTexture),a.memory.textures--),i.remove(U[Y])}i.remove(T)}let O=0;function G(){O=0}function X(){return O}function N(T){O=T}function z(){let T=O;return T>=s.maxTextures&&Ce("WebGLTextures: Trying to use "+T+" texture units while this GPU supports only "+s.maxTextures),O+=1,T}function V(T){let _=[];return _.push(T.wrapS),_.push(T.wrapT),_.push(T.wrapR||0),_.push(T.magFilter),_.push(T.minFilter),_.push(T.anisotropy),_.push(T.internalFormat),_.push(T.format),_.push(T.type),_.push(T.generateMipmaps),_.push(T.premultiplyAlpha),_.push(T.flipY),_.push(T.unpackAlignment),_.push(T.colorSpace),_.join()}function j(T,_){let U=i.get(T);if(T.isVideoTexture&&rt(T),T.isRenderTargetTexture===!1&&T.isExternalTexture!==!0&&T.version>0&&U.__version!==T.version){let Y=T.image;if(Y===null)Ce("WebGLRenderer: Texture marked for update but no image data found.");else if(Y.complete===!1)Ce("WebGLRenderer: Texture marked for update but image is incomplete");else{Ie(U,T,_);return}}else T.isExternalTexture&&(U.__webglTexture=T.sourceTexture?T.sourceTexture:null);t.bindTexture(n.TEXTURE_2D,U.__webglTexture,n.TEXTURE0+_)}function Q(T,_){let U=i.get(T);if(T.isRenderTargetTexture===!1&&T.version>0&&U.__version!==T.version){Ie(U,T,_);return}else T.isExternalTexture&&(U.__webglTexture=T.sourceTexture?T.sourceTexture:null);t.bindTexture(n.TEXTURE_2D_ARRAY,U.__webglTexture,n.TEXTURE0+_)}function ce(T,_){let U=i.get(T);if(T.isRenderTargetTexture===!1&&T.version>0&&U.__version!==T.version){Ie(U,T,_);return}t.bindTexture(n.TEXTURE_3D,U.__webglTexture,n.TEXTURE0+_)}function ye(T,_){let U=i.get(T);if(T.isCubeDepthTexture!==!0&&T.version>0&&U.__version!==T.version){Fe(U,T,_);return}t.bindTexture(n.TEXTURE_CUBE_MAP,U.__webglTexture,n.TEXTURE0+_)}let Te={[pa]:n.REPEAT,[Kt]:n.CLAMP_TO_EDGE,[ma]:n.MIRRORED_REPEAT},Ye={[Rt]:n.NEAREST,[Zh]:n.NEAREST_MIPMAP_NEAREST,[dr]:n.NEAREST_MIPMAP_LINEAR,[we]:n.LINEAR,[Za]:n.LINEAR_MIPMAP_NEAREST,[pn]:n.LINEAR_MIPMAP_LINEAR},je={[jh]:n.NEVER,[iu]:n.ALWAYS,[Qh]:n.LESS,[Lo]:n.LEQUAL,[eu]:n.EQUAL,[Fo]:n.GEQUAL,[tu]:n.GREATER,[nu]:n.NOTEQUAL};function Oe(T,_){if(_.type===gn&&e.has("OES_texture_float_linear")===!1&&(_.magFilter===we||_.magFilter===Za||_.magFilter===dr||_.magFilter===pn||_.minFilter===we||_.minFilter===Za||_.minFilter===dr||_.minFilter===pn)&&Ce("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(T,n.TEXTURE_WRAP_S,Te[_.wrapS]),n.texParameteri(T,n.TEXTURE_WRAP_T,Te[_.wrapT]),(T===n.TEXTURE_3D||T===n.TEXTURE_2D_ARRAY)&&n.texParameteri(T,n.TEXTURE_WRAP_R,Te[_.wrapR]),n.texParameteri(T,n.TEXTURE_MAG_FILTER,Ye[_.magFilter]),n.texParameteri(T,n.TEXTURE_MIN_FILTER,Ye[_.minFilter]),_.compareFunction&&(n.texParameteri(T,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(T,n.TEXTURE_COMPARE_FUNC,je[_.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(_.magFilter===Rt||_.minFilter!==dr&&_.minFilter!==pn||_.type===gn&&e.has("OES_texture_float_linear")===!1)return;if(_.anisotropy>1||i.get(_).__currentAnisotropy){let U=e.get("EXT_texture_filter_anisotropic");n.texParameterf(T,U.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(_.anisotropy,s.getMaxAnisotropy())),i.get(_).__currentAnisotropy=_.anisotropy}}}function Z(T,_){let U=!1;T.__webglInit===void 0&&(T.__webglInit=!0,_.addEventListener("dispose",I));let Y=_.source,K=f.get(Y);K===void 0&&(K={},f.set(Y,K));let ee=V(_);if(ee!==T.__cacheKey){K[ee]===void 0&&(K[ee]={texture:n.createTexture(),usedTimes:0},a.memory.textures++,U=!0),K[ee].usedTimes++;let ae=K[T.__cacheKey];ae!==void 0&&(K[T.__cacheKey].usedTimes--,ae.usedTimes===0&&F(_)),T.__cacheKey=ee,T.__webglTexture=K[ee].texture}return U}function de(T,_,U){return Math.floor(Math.floor(T/U)/_)}function ie(T,_,U,Y){let ee=T.updateRanges;if(ee.length===0)t.texSubImage2D(n.TEXTURE_2D,0,0,0,_.width,_.height,U,Y,_.data);else{ee.sort((_e,se)=>_e.start-se.start);let ae=0;for(let _e=1;_e<ee.length;_e++){let se=ee[ae],te=ee[_e],De=se.start+se.count,Be=de(te.start,_.width,4),Je=de(se.start,_.width,4);te.start<=De+1&&Be===Je&&de(te.start+te.count-1,_.width,4)===Be?se.count=Math.max(se.count,te.start+te.count-se.start):(++ae,ee[ae]=te)}ee.length=ae+1;let W=t.getParameter(n.UNPACK_ROW_LENGTH),$=t.getParameter(n.UNPACK_SKIP_PIXELS),fe=t.getParameter(n.UNPACK_SKIP_ROWS);t.pixelStorei(n.UNPACK_ROW_LENGTH,_.width);for(let _e=0,se=ee.length;_e<se;_e++){let te=ee[_e],De=Math.floor(te.start/4),Be=Math.ceil(te.count/4),Je=De%_.width,P=Math.floor(De/_.width),ne=Be,q=1;t.pixelStorei(n.UNPACK_SKIP_PIXELS,Je),t.pixelStorei(n.UNPACK_SKIP_ROWS,P),t.texSubImage2D(n.TEXTURE_2D,0,Je,P,ne,q,U,Y,_.data)}T.clearUpdateRanges(),t.pixelStorei(n.UNPACK_ROW_LENGTH,W),t.pixelStorei(n.UNPACK_SKIP_PIXELS,$),t.pixelStorei(n.UNPACK_SKIP_ROWS,fe)}}function Ie(T,_,U){let Y=n.TEXTURE_2D;(_.isDataArrayTexture||_.isCompressedArrayTexture)&&(Y=n.TEXTURE_2D_ARRAY),_.isData3DTexture&&(Y=n.TEXTURE_3D);let K=Z(T,_),ee=_.source;t.bindTexture(Y,T.__webglTexture,n.TEXTURE0+U);let ae=i.get(ee);if(ee.version!==ae.__version||K===!0){if(t.activeTexture(n.TEXTURE0+U),(typeof ImageBitmap<"u"&&_.image instanceof ImageBitmap)===!1){let q=Xe.getPrimaries(Xe.workingColorSpace),pe=_.colorSpace===qn?null:Xe.getPrimaries(_.colorSpace),re=_.colorSpace===qn||q===pe?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,_.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,re)}t.pixelStorei(n.UNPACK_ALIGNMENT,_.unpackAlignment);let $=p(_.image,!1,s.maxTextureSize);$=oe(_,$);let fe=r.convert(_.format,_.colorSpace),_e=r.convert(_.type),se=b(_.internalFormat,fe,_e,_.normalized,_.colorSpace,_.isVideoTexture);Oe(Y,_);let te,De=_.mipmaps,Be=_.isVideoTexture!==!0,Je=ae.__version===void 0||K===!0,P=ee.dataReady,ne=E(_,$);if(_.isDepthTexture)se=A(_.format===mi,_.type),Je&&(Be?t.texStorage2D(n.TEXTURE_2D,1,se,$.width,$.height):t.texImage2D(n.TEXTURE_2D,0,se,$.width,$.height,0,fe,_e,null));else if(_.isDataTexture)if(De.length>0){Be&&Je&&t.texStorage2D(n.TEXTURE_2D,ne,se,De[0].width,De[0].height);for(let q=0,pe=De.length;q<pe;q++)te=De[q],Be?P&&t.texSubImage2D(n.TEXTURE_2D,q,0,0,te.width,te.height,fe,_e,te.data):t.texImage2D(n.TEXTURE_2D,q,se,te.width,te.height,0,fe,_e,te.data);_.generateMipmaps=!1}else Be?(Je&&t.texStorage2D(n.TEXTURE_2D,ne,se,$.width,$.height),P&&ie(_,$,fe,_e)):t.texImage2D(n.TEXTURE_2D,0,se,$.width,$.height,0,fe,_e,$.data);else if(_.isCompressedTexture)if(_.isCompressedArrayTexture){Be&&Je&&t.texStorage3D(n.TEXTURE_2D_ARRAY,ne,se,De[0].width,De[0].height,$.depth);for(let q=0,pe=De.length;q<pe;q++)if(te=De[q],_.format!==on)if(fe!==null)if(Be){if(P)if(_.layerUpdates.size>0){let re=oc(te.width,te.height,_.format,_.type);for(let J of _.layerUpdates){let Me=te.data.subarray(J*re/te.data.BYTES_PER_ELEMENT,(J+1)*re/te.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,q,0,0,J,te.width,te.height,1,fe,Me)}_.clearLayerUpdates()}else t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,q,0,0,0,te.width,te.height,$.depth,fe,te.data)}else t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,q,se,te.width,te.height,$.depth,0,te.data,0,0);else Ce("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Be?P&&t.texSubImage3D(n.TEXTURE_2D_ARRAY,q,0,0,0,te.width,te.height,$.depth,fe,_e,te.data):t.texImage3D(n.TEXTURE_2D_ARRAY,q,se,te.width,te.height,$.depth,0,fe,_e,te.data)}else{Be&&Je&&t.texStorage2D(n.TEXTURE_2D,ne,se,De[0].width,De[0].height);for(let q=0,pe=De.length;q<pe;q++)te=De[q],_.format!==on?fe!==null?Be?P&&t.compressedTexSubImage2D(n.TEXTURE_2D,q,0,0,te.width,te.height,fe,te.data):t.compressedTexImage2D(n.TEXTURE_2D,q,se,te.width,te.height,0,te.data):Ce("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Be?P&&t.texSubImage2D(n.TEXTURE_2D,q,0,0,te.width,te.height,fe,_e,te.data):t.texImage2D(n.TEXTURE_2D,q,se,te.width,te.height,0,fe,_e,te.data)}else if(_.isDataArrayTexture)if(Be){if(Je&&t.texStorage3D(n.TEXTURE_2D_ARRAY,ne,se,$.width,$.height,$.depth),P)if(_.layerUpdates.size>0){let q=oc($.width,$.height,_.format,_.type);for(let pe of _.layerUpdates){let re=$.data.subarray(pe*q/$.data.BYTES_PER_ELEMENT,(pe+1)*q/$.data.BYTES_PER_ELEMENT);t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,pe,$.width,$.height,1,fe,_e,re)}_.clearLayerUpdates()}else t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,$.width,$.height,$.depth,fe,_e,$.data)}else t.texImage3D(n.TEXTURE_2D_ARRAY,0,se,$.width,$.height,$.depth,0,fe,_e,$.data);else if(_.isData3DTexture)Be?(Je&&t.texStorage3D(n.TEXTURE_3D,ne,se,$.width,$.height,$.depth),P&&t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,$.width,$.height,$.depth,fe,_e,$.data)):t.texImage3D(n.TEXTURE_3D,0,se,$.width,$.height,$.depth,0,fe,_e,$.data);else if(_.isFramebufferTexture){if(Je)if(Be)t.texStorage2D(n.TEXTURE_2D,ne,se,$.width,$.height);else{let q=$.width,pe=$.height;for(let re=0;re<ne;re++)t.texImage2D(n.TEXTURE_2D,re,se,q,pe,0,fe,_e,null),q>>=1,pe>>=1}}else if(_.isHTMLTexture){if("texElementImage2D"in n){let q=n.canvas;if(q.hasAttribute("layoutsubtree")||q.setAttribute("layoutsubtree","true"),$.parentNode!==q){q.appendChild($),d.add(_),q.onpaint=Ne=>{let vt=Ne.changedElements;for(let et of d)vt.includes(et.image)&&(et.needsUpdate=!0)},q.requestPaint();return}let pe=0,re=n.RGBA,J=n.RGBA,Me=n.UNSIGNED_BYTE;n.texElementImage2D(n.TEXTURE_2D,pe,re,J,Me,$),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MIN_FILTER,n.LINEAR),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE)}}else if(De.length>0){if(Be&&Je){let q=gt(De[0]);t.texStorage2D(n.TEXTURE_2D,ne,se,q.width,q.height)}for(let q=0,pe=De.length;q<pe;q++)te=De[q],Be?P&&t.texSubImage2D(n.TEXTURE_2D,q,0,0,fe,_e,te):t.texImage2D(n.TEXTURE_2D,q,se,fe,_e,te);_.generateMipmaps=!1}else if(Be){if(Je){let q=gt($);t.texStorage2D(n.TEXTURE_2D,ne,se,q.width,q.height)}P&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,fe,_e,$)}else t.texImage2D(n.TEXTURE_2D,0,se,fe,_e,$);m(_)&&x(Y),ae.__version=ee.version,_.onUpdate&&_.onUpdate(_)}T.__version=_.version}function Fe(T,_,U){if(_.image.length!==6)return;let Y=Z(T,_),K=_.source;t.bindTexture(n.TEXTURE_CUBE_MAP,T.__webglTexture,n.TEXTURE0+U);let ee=i.get(K);if(K.version!==ee.__version||Y===!0){t.activeTexture(n.TEXTURE0+U);let ae=Xe.getPrimaries(Xe.workingColorSpace),W=_.colorSpace===qn?null:Xe.getPrimaries(_.colorSpace),$=_.colorSpace===qn||ae===W?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,_.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),t.pixelStorei(n.UNPACK_ALIGNMENT,_.unpackAlignment),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,$);let fe=_.isCompressedTexture||_.image[0].isCompressedTexture,_e=_.image[0]&&_.image[0].isDataTexture,se=[];for(let J=0;J<6;J++)!fe&&!_e?se[J]=p(_.image[J],!0,s.maxCubemapSize):se[J]=_e?_.image[J].image:_.image[J],se[J]=oe(_,se[J]);let te=se[0],De=r.convert(_.format,_.colorSpace),Be=r.convert(_.type),Je=b(_.internalFormat,De,Be,_.normalized,_.colorSpace),P=_.isVideoTexture!==!0,ne=ee.__version===void 0||Y===!0,q=K.dataReady,pe=E(_,te);Oe(n.TEXTURE_CUBE_MAP,_);let re;if(fe){P&&ne&&t.texStorage2D(n.TEXTURE_CUBE_MAP,pe,Je,te.width,te.height);for(let J=0;J<6;J++){re=se[J].mipmaps;for(let Me=0;Me<re.length;Me++){let Ne=re[Me];_.format!==on?De!==null?P?q&&t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+J,Me,0,0,Ne.width,Ne.height,De,Ne.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+J,Me,Je,Ne.width,Ne.height,0,Ne.data):Ce("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):P?q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+J,Me,0,0,Ne.width,Ne.height,De,Be,Ne.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+J,Me,Je,Ne.width,Ne.height,0,De,Be,Ne.data)}}}else{if(re=_.mipmaps,P&&ne){re.length>0&&pe++;let J=gt(se[0]);t.texStorage2D(n.TEXTURE_CUBE_MAP,pe,Je,J.width,J.height)}for(let J=0;J<6;J++)if(_e){P?q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+J,0,0,0,se[J].width,se[J].height,De,Be,se[J].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+J,0,Je,se[J].width,se[J].height,0,De,Be,se[J].data);for(let Me=0;Me<re.length;Me++){let vt=re[Me].image[J].image;P?q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+J,Me+1,0,0,vt.width,vt.height,De,Be,vt.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+J,Me+1,Je,vt.width,vt.height,0,De,Be,vt.data)}}else{P?q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+J,0,0,0,De,Be,se[J]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+J,0,Je,De,Be,se[J]);for(let Me=0;Me<re.length;Me++){let Ne=re[Me];P?q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+J,Me+1,0,0,De,Be,Ne.image[J]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+J,Me+1,Je,De,Be,Ne.image[J])}}}m(_)&&x(n.TEXTURE_CUBE_MAP),ee.__version=K.version,_.onUpdate&&_.onUpdate(_)}T.__version=_.version}function Pe(T,_,U,Y,K,ee){let ae=r.convert(U.format,U.colorSpace),W=r.convert(U.type),$=b(U.internalFormat,ae,W,U.normalized,U.colorSpace),fe=i.get(_),_e=i.get(U);if(_e.__renderTarget=_,!fe.__hasExternalTextures){let se=Math.max(1,_.width>>ee),te=Math.max(1,_.height>>ee);K===n.TEXTURE_3D||K===n.TEXTURE_2D_ARRAY?t.texImage3D(K,ee,$,se,te,_.depth,0,ae,W,null):t.texImage2D(K,ee,$,se,te,0,ae,W,null)}t.bindFramebuffer(n.FRAMEBUFFER,T),We(_)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,Y,K,_e.__webglTexture,0,Et(_)):(K===n.TEXTURE_2D||K>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&K<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,Y,K,_e.__webglTexture,ee),t.bindFramebuffer(n.FRAMEBUFFER,null)}function dt(T,_,U){if(n.bindRenderbuffer(n.RENDERBUFFER,T),_.depthBuffer){let Y=_.depthTexture,K=Y&&Y.isDepthTexture?Y.type:null,ee=A(_.stencilBuffer,K),ae=_.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;We(_)?o.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Et(_),ee,_.width,_.height):U?n.renderbufferStorageMultisample(n.RENDERBUFFER,Et(_),ee,_.width,_.height):n.renderbufferStorage(n.RENDERBUFFER,ee,_.width,_.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,ae,n.RENDERBUFFER,T)}else{let Y=_.textures;for(let K=0;K<Y.length;K++){let ee=Y[K],ae=r.convert(ee.format,ee.colorSpace),W=r.convert(ee.type),$=b(ee.internalFormat,ae,W,ee.normalized,ee.colorSpace);We(_)?o.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Et(_),$,_.width,_.height):U?n.renderbufferStorageMultisample(n.RENDERBUFFER,Et(_),$,_.width,_.height):n.renderbufferStorage(n.RENDERBUFFER,$,_.width,_.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function Ge(T,_,U){let Y=_.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(n.FRAMEBUFFER,T),!(_.depthTexture&&_.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let K=i.get(_.depthTexture);if(K.__renderTarget=_,(!K.__webglTexture||_.depthTexture.image.width!==_.width||_.depthTexture.image.height!==_.height)&&(_.depthTexture.image.width=_.width,_.depthTexture.image.height=_.height,_.depthTexture.needsUpdate=!0),Y){if(K.__webglInit===void 0&&(K.__webglInit=!0,_.depthTexture.addEventListener("dispose",I)),K.__webglTexture===void 0){K.__webglTexture=n.createTexture(),t.bindTexture(n.TEXTURE_CUBE_MAP,K.__webglTexture),Oe(n.TEXTURE_CUBE_MAP,_.depthTexture);let fe=r.convert(_.depthTexture.format),_e=r.convert(_.depthTexture.type),se;_.depthTexture.format===Tn?se=n.DEPTH_COMPONENT24:_.depthTexture.format===mi&&(se=n.DEPTH24_STENCIL8);for(let te=0;te<6;te++)n.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,se,_.width,_.height,0,fe,_e,null)}}else j(_.depthTexture,0);let ee=K.__webglTexture,ae=Et(_),W=Y?n.TEXTURE_CUBE_MAP_POSITIVE_X+U:n.TEXTURE_2D,$=_.depthTexture.format===mi?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;if(_.depthTexture.format===Tn)We(_)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,$,W,ee,0,ae):n.framebufferTexture2D(n.FRAMEBUFFER,$,W,ee,0);else if(_.depthTexture.format===mi)We(_)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,$,W,ee,0,ae):n.framebufferTexture2D(n.FRAMEBUFFER,$,W,ee,0);else throw new Error("Unknown depthTexture format")}function Qe(T){let _=i.get(T),U=T.isWebGLCubeRenderTarget===!0;if(_.__boundDepthTexture!==T.depthTexture){let Y=T.depthTexture;if(_.__depthDisposeCallback&&_.__depthDisposeCallback(),Y){let K=()=>{delete _.__boundDepthTexture,delete _.__depthDisposeCallback,Y.removeEventListener("dispose",K)};Y.addEventListener("dispose",K),_.__depthDisposeCallback=K}_.__boundDepthTexture=Y}if(T.depthTexture&&!_.__autoAllocateDepthBuffer)if(U)for(let Y=0;Y<6;Y++)Ge(_.__webglFramebuffer[Y],T,Y);else{let Y=T.texture.mipmaps;Y&&Y.length>0?Ge(_.__webglFramebuffer[0],T,0):Ge(_.__webglFramebuffer,T,0)}else if(U){_.__webglDepthbuffer=[];for(let Y=0;Y<6;Y++)if(t.bindFramebuffer(n.FRAMEBUFFER,_.__webglFramebuffer[Y]),_.__webglDepthbuffer[Y]===void 0)_.__webglDepthbuffer[Y]=n.createRenderbuffer(),dt(_.__webglDepthbuffer[Y],T,!1);else{let K=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ee=_.__webglDepthbuffer[Y];n.bindRenderbuffer(n.RENDERBUFFER,ee),n.framebufferRenderbuffer(n.FRAMEBUFFER,K,n.RENDERBUFFER,ee)}}else{let Y=T.texture.mipmaps;if(Y&&Y.length>0?t.bindFramebuffer(n.FRAMEBUFFER,_.__webglFramebuffer[0]):t.bindFramebuffer(n.FRAMEBUFFER,_.__webglFramebuffer),_.__webglDepthbuffer===void 0)_.__webglDepthbuffer=n.createRenderbuffer(),dt(_.__webglDepthbuffer,T,!1);else{let K=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ee=_.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,ee),n.framebufferRenderbuffer(n.FRAMEBUFFER,K,n.RENDERBUFFER,ee)}}t.bindFramebuffer(n.FRAMEBUFFER,null)}function lt(T,_,U){let Y=i.get(T);_!==void 0&&Pe(Y.__webglFramebuffer,T,T.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),U!==void 0&&Qe(T)}function He(T){let _=T.texture,U=i.get(T),Y=i.get(_);T.addEventListener("dispose",y);let K=T.textures,ee=T.isWebGLCubeRenderTarget===!0,ae=K.length>1;if(ae||(Y.__webglTexture===void 0&&(Y.__webglTexture=n.createTexture()),Y.__version=_.version,a.memory.textures++),ee){U.__webglFramebuffer=[];for(let W=0;W<6;W++)if(_.mipmaps&&_.mipmaps.length>0){U.__webglFramebuffer[W]=[];for(let $=0;$<_.mipmaps.length;$++)U.__webglFramebuffer[W][$]=n.createFramebuffer()}else U.__webglFramebuffer[W]=n.createFramebuffer()}else{if(_.mipmaps&&_.mipmaps.length>0){U.__webglFramebuffer=[];for(let W=0;W<_.mipmaps.length;W++)U.__webglFramebuffer[W]=n.createFramebuffer()}else U.__webglFramebuffer=n.createFramebuffer();if(ae)for(let W=0,$=K.length;W<$;W++){let fe=i.get(K[W]);fe.__webglTexture===void 0&&(fe.__webglTexture=n.createTexture(),a.memory.textures++)}if(T.samples>0&&We(T)===!1){U.__webglMultisampledFramebuffer=n.createFramebuffer(),U.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,U.__webglMultisampledFramebuffer);for(let W=0;W<K.length;W++){let $=K[W];U.__webglColorRenderbuffer[W]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,U.__webglColorRenderbuffer[W]);let fe=r.convert($.format,$.colorSpace),_e=r.convert($.type),se=b($.internalFormat,fe,_e,$.normalized,$.colorSpace,T.isXRRenderTarget===!0),te=Et(T);n.renderbufferStorageMultisample(n.RENDERBUFFER,te,se,T.width,T.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+W,n.RENDERBUFFER,U.__webglColorRenderbuffer[W])}n.bindRenderbuffer(n.RENDERBUFFER,null),T.depthBuffer&&(U.__webglDepthRenderbuffer=n.createRenderbuffer(),dt(U.__webglDepthRenderbuffer,T,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(ee){t.bindTexture(n.TEXTURE_CUBE_MAP,Y.__webglTexture),Oe(n.TEXTURE_CUBE_MAP,_);for(let W=0;W<6;W++)if(_.mipmaps&&_.mipmaps.length>0)for(let $=0;$<_.mipmaps.length;$++)Pe(U.__webglFramebuffer[W][$],T,_,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+W,$);else Pe(U.__webglFramebuffer[W],T,_,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+W,0);m(_)&&x(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(ae){for(let W=0,$=K.length;W<$;W++){let fe=K[W],_e=i.get(fe),se=n.TEXTURE_2D;(T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&(se=T.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(se,_e.__webglTexture),Oe(se,fe),Pe(U.__webglFramebuffer,T,fe,n.COLOR_ATTACHMENT0+W,se,0),m(fe)&&x(se)}t.unbindTexture()}else{let W=n.TEXTURE_2D;if((T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&(W=T.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(W,Y.__webglTexture),Oe(W,_),_.mipmaps&&_.mipmaps.length>0)for(let $=0;$<_.mipmaps.length;$++)Pe(U.__webglFramebuffer[$],T,_,n.COLOR_ATTACHMENT0,W,$);else Pe(U.__webglFramebuffer,T,_,n.COLOR_ATTACHMENT0,W,0);m(_)&&x(W),t.unbindTexture()}T.depthBuffer&&Qe(T)}function Tt(T){let _=T.textures;for(let U=0,Y=_.length;U<Y;U++){let K=_[U];if(m(K)){let ee=M(T),ae=i.get(K).__webglTexture;t.bindTexture(ee,ae),x(ee),t.unbindTexture()}}}let ft=[],Yt=[];function D(T){if(T.samples>0){if(We(T)===!1){let _=T.textures,U=T.width,Y=T.height,K=n.COLOR_BUFFER_BIT,ee=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ae=i.get(T),W=_.length>1;if(W)for(let fe=0;fe<_.length;fe++)t.bindFramebuffer(n.FRAMEBUFFER,ae.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+fe,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,ae.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+fe,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,ae.__webglMultisampledFramebuffer);let $=T.texture.mipmaps;$&&$.length>0?t.bindFramebuffer(n.DRAW_FRAMEBUFFER,ae.__webglFramebuffer[0]):t.bindFramebuffer(n.DRAW_FRAMEBUFFER,ae.__webglFramebuffer);for(let fe=0;fe<_.length;fe++){if(T.resolveDepthBuffer&&(T.depthBuffer&&(K|=n.DEPTH_BUFFER_BIT),T.stencilBuffer&&T.resolveStencilBuffer&&(K|=n.STENCIL_BUFFER_BIT)),W){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,ae.__webglColorRenderbuffer[fe]);let _e=i.get(_[fe]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,_e,0)}n.blitFramebuffer(0,0,U,Y,0,0,U,Y,K,n.NEAREST),l===!0&&(ft.length=0,Yt.length=0,ft.push(n.COLOR_ATTACHMENT0+fe),T.depthBuffer&&T.resolveDepthBuffer===!1&&(ft.push(ee),Yt.push(ee),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,Yt)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,ft))}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),W)for(let fe=0;fe<_.length;fe++){t.bindFramebuffer(n.FRAMEBUFFER,ae.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+fe,n.RENDERBUFFER,ae.__webglColorRenderbuffer[fe]);let _e=i.get(_[fe]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,ae.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+fe,n.TEXTURE_2D,_e,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,ae.__webglMultisampledFramebuffer)}else if(T.depthBuffer&&T.resolveDepthBuffer===!1&&l){let _=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[_])}}}function Et(T){return Math.min(s.maxSamples,T.samples)}function We(T){let _=i.get(T);return T.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&_.__useRenderToTexture!==!1}function rt(T){let _=a.render.frame;h.get(T)!==_&&(h.set(T,_),T.update())}function oe(T,_){let U=T.colorSpace,Y=T.format,K=T.type;return T.isCompressedTexture===!0||T.isVideoTexture===!0||U!==zs&&U!==qn&&(Xe.getTransfer(U)===Ke?(Y!==on||K!==sn)&&Ce("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Re("WebGLTextures: Unsupported texture color space:",U)),_}function gt(T){return typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement?(c.width=T.naturalWidth||T.width,c.height=T.naturalHeight||T.height):typeof VideoFrame<"u"&&T instanceof VideoFrame?(c.width=T.displayWidth,c.height=T.displayHeight):(c.width=T.width,c.height=T.height),c}this.allocateTextureUnit=z,this.resetTextureUnits=G,this.getTextureUnits=X,this.setTextureUnits=N,this.setTexture2D=j,this.setTexture2DArray=Q,this.setTexture3D=ce,this.setTextureCube=ye,this.rebindTextures=lt,this.setupRenderTarget=He,this.updateRenderTargetMipmap=Tt,this.updateMultisampleRenderTarget=D,this.setupDepthRenderbuffer=Qe,this.setupFrameBufferTexture=Pe,this.useMultisampledRTT=We,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function a_(n,e){function t(i,s=qn){let r,a=Xe.getTransfer(s);if(i===sn)return n.UNSIGNED_BYTE;if(i===Ka)return n.UNSIGNED_SHORT_4_4_4_4;if(i===ja)return n.UNSIGNED_SHORT_5_5_5_1;if(i===Jl)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===Kl)return n.UNSIGNED_INT_10F_11F_11F_REV;if(i===$l)return n.BYTE;if(i===Zl)return n.SHORT;if(i===Ms)return n.UNSIGNED_SHORT;if(i===Ja)return n.INT;if(i===mn)return n.UNSIGNED_INT;if(i===gn)return n.FLOAT;if(i===In)return n.HALF_FLOAT;if(i===jl)return n.ALPHA;if(i===Ql)return n.RGB;if(i===on)return n.RGBA;if(i===Tn)return n.DEPTH_COMPONENT;if(i===mi)return n.DEPTH_STENCIL;if(i===ec)return n.RED;if(i===Qa)return n.RED_INTEGER;if(i===gi)return n.RG;if(i===eo)return n.RG_INTEGER;if(i===to)return n.RGBA_INTEGER;if(i===fr||i===pr||i===mr||i===gr)if(a===Ke)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(i===fr)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===pr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===mr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===gr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(i===fr)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===pr)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===mr)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===gr)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===no||i===io||i===so||i===ro)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(i===no)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===io)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===so)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===ro)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===ao||i===oo||i===lo||i===co||i===ho||i===_r||i===uo)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(i===ao||i===oo)return a===Ke?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(i===lo)return a===Ke?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(i===co)return r.COMPRESSED_R11_EAC;if(i===ho)return r.COMPRESSED_SIGNED_R11_EAC;if(i===_r)return r.COMPRESSED_RG11_EAC;if(i===uo)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===fo||i===po||i===mo||i===go||i===_o||i===xo||i===yo||i===vo||i===So||i===Mo||i===bo||i===To||i===Eo||i===wo)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(i===fo)return a===Ke?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===po)return a===Ke?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===mo)return a===Ke?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===go)return a===Ke?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===_o)return a===Ke?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===xo)return a===Ke?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===yo)return a===Ke?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===vo)return a===Ke?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===So)return a===Ke?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===Mo)return a===Ke?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===bo)return a===Ke?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===To)return a===Ke?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===Eo)return a===Ke?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===wo)return a===Ke?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===Ao||i===Co||i===Ro)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(i===Ao)return a===Ke?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===Co)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===Ro)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===Io||i===Po||i===xr||i===Do)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(i===Io)return r.COMPRESSED_RED_RGTC1_EXT;if(i===Po)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===xr)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===Do)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===bs?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:t}}var o_=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,l_=`
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

}`,Sc=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let i=new Js(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=i}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,i=new tn({vertexShader:o_,fragmentShader:l_,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new ht(new en(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Mc=class extends En{constructor(e,t){super();let i=this,s=null,r=1,a=null,o="local-floor",l=1,c=null,h=null,d=null,u=null,f=null,g=null,S=typeof XRWebGLBinding<"u",p=new Sc,m={},x=t.getContextAttributes(),M=null,b=null,A=[],E=[],I=new ge,y=null,w=new Gt;w.viewport=new xt;let F=new Gt;F.viewport=new xt;let R=[w,F],O=new qa,G=null,X=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Z){let de=A[Z];return de===void 0&&(de=new cs,A[Z]=de),de.getTargetRaySpace()},this.getControllerGrip=function(Z){let de=A[Z];return de===void 0&&(de=new cs,A[Z]=de),de.getGripSpace()},this.getHand=function(Z){let de=A[Z];return de===void 0&&(de=new cs,A[Z]=de),de.getHandSpace()};function N(Z){let de=E.indexOf(Z.inputSource);if(de===-1)return;let ie=A[de];ie!==void 0&&(ie.update(Z.inputSource,Z.frame,c||a),ie.dispatchEvent({type:Z.type,data:Z.inputSource}))}function z(){s.removeEventListener("select",N),s.removeEventListener("selectstart",N),s.removeEventListener("selectend",N),s.removeEventListener("squeeze",N),s.removeEventListener("squeezestart",N),s.removeEventListener("squeezeend",N),s.removeEventListener("end",z),s.removeEventListener("inputsourceschange",V);for(let Z=0;Z<A.length;Z++){let de=E[Z];de!==null&&(E[Z]=null,A[Z].disconnect(de))}G=null,X=null,p.reset();for(let Z in m)delete m[Z];e.setRenderTarget(M),f=null,u=null,d=null,s=null,b=null,Oe.stop(),i.isPresenting=!1,e.setPixelRatio(y),e.setSize(I.width,I.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Z){r=Z,i.isPresenting===!0&&Ce("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Z){o=Z,i.isPresenting===!0&&Ce("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(Z){c=Z},this.getBaseLayer=function(){return u!==null?u:f},this.getBinding=function(){return d===null&&S&&(d=new XRWebGLBinding(s,t)),d},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(Z){if(s=Z,s!==null){if(M=e.getRenderTarget(),s.addEventListener("select",N),s.addEventListener("selectstart",N),s.addEventListener("selectend",N),s.addEventListener("squeeze",N),s.addEventListener("squeezestart",N),s.addEventListener("squeezeend",N),s.addEventListener("end",z),s.addEventListener("inputsourceschange",V),x.xrCompatible!==!0&&await t.makeXRCompatible(),y=e.getPixelRatio(),e.getSize(I),S&&"createProjectionLayer"in XRWebGLBinding.prototype){let ie=null,Ie=null,Fe=null;x.depth&&(Fe=x.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,ie=x.stencil?mi:Tn,Ie=x.stencil?bs:mn);let Pe={colorFormat:t.RGBA8,depthFormat:Fe,scaleFactor:r};d=this.getBinding(),u=d.createProjectionLayer(Pe),s.updateRenderState({layers:[u]}),e.setPixelRatio(1),e.setSize(u.textureWidth,u.textureHeight,!1),b=new jt(u.textureWidth,u.textureHeight,{format:on,type:sn,depthTexture:new Xn(u.textureWidth,u.textureHeight,Ie,void 0,void 0,void 0,void 0,void 0,void 0,ie),stencilBuffer:x.stencil,colorSpace:e.outputColorSpace,samples:x.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1})}else{let ie={antialias:x.antialias,alpha:!0,depth:x.depth,stencil:x.stencil,framebufferScaleFactor:r};f=new XRWebGLLayer(s,t,ie),s.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),b=new jt(f.framebufferWidth,f.framebufferHeight,{format:on,type:sn,colorSpace:e.outputColorSpace,stencilBuffer:x.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1})}b.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await s.requestReferenceSpace(o),Oe.setContext(s),Oe.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return p.getDepthTexture()};function V(Z){for(let de=0;de<Z.removed.length;de++){let ie=Z.removed[de],Ie=E.indexOf(ie);Ie>=0&&(E[Ie]=null,A[Ie].disconnect(ie))}for(let de=0;de<Z.added.length;de++){let ie=Z.added[de],Ie=E.indexOf(ie);if(Ie===-1){for(let Pe=0;Pe<A.length;Pe++)if(Pe>=E.length){E.push(ie),Ie=Pe;break}else if(E[Pe]===null){E[Pe]=ie,Ie=Pe;break}if(Ie===-1)break}let Fe=A[Ie];Fe&&Fe.connect(ie)}}let j=new C,Q=new C;function ce(Z,de,ie){j.setFromMatrixPosition(de.matrixWorld),Q.setFromMatrixPosition(ie.matrixWorld);let Ie=j.distanceTo(Q),Fe=de.projectionMatrix.elements,Pe=ie.projectionMatrix.elements,dt=Fe[14]/(Fe[10]-1),Ge=Fe[14]/(Fe[10]+1),Qe=(Fe[9]+1)/Fe[5],lt=(Fe[9]-1)/Fe[5],He=(Fe[8]-1)/Fe[0],Tt=(Pe[8]+1)/Pe[0],ft=dt*He,Yt=dt*Tt,D=Ie/(-He+Tt),Et=D*-He;if(de.matrixWorld.decompose(Z.position,Z.quaternion,Z.scale),Z.translateX(Et),Z.translateZ(D),Z.matrixWorld.compose(Z.position,Z.quaternion,Z.scale),Z.matrixWorldInverse.copy(Z.matrixWorld).invert(),Fe[10]===-1)Z.projectionMatrix.copy(de.projectionMatrix),Z.projectionMatrixInverse.copy(de.projectionMatrixInverse);else{let We=dt+D,rt=Ge+D,oe=ft-Et,gt=Yt+(Ie-Et),T=Qe*Ge/rt*We,_=lt*Ge/rt*We;Z.projectionMatrix.makePerspective(oe,gt,T,_,We,rt),Z.projectionMatrixInverse.copy(Z.projectionMatrix).invert()}}function ye(Z,de){de===null?Z.matrixWorld.copy(Z.matrix):Z.matrixWorld.multiplyMatrices(de.matrixWorld,Z.matrix),Z.matrixWorldInverse.copy(Z.matrixWorld).invert()}this.updateCamera=function(Z){if(s===null)return;let de=Z.near,ie=Z.far;p.texture!==null&&(p.depthNear>0&&(de=p.depthNear),p.depthFar>0&&(ie=p.depthFar)),O.near=F.near=w.near=de,O.far=F.far=w.far=ie,(G!==O.near||X!==O.far)&&(s.updateRenderState({depthNear:O.near,depthFar:O.far}),G=O.near,X=O.far),O.layers.mask=Z.layers.mask|6,w.layers.mask=O.layers.mask&-5,F.layers.mask=O.layers.mask&-3;let Ie=Z.parent,Fe=O.cameras;ye(O,Ie);for(let Pe=0;Pe<Fe.length;Pe++)ye(Fe[Pe],Ie);Fe.length===2?ce(O,w,F):O.projectionMatrix.copy(w.projectionMatrix),Te(Z,O,Ie)};function Te(Z,de,ie){ie===null?Z.matrix.copy(de.matrixWorld):(Z.matrix.copy(ie.matrixWorld),Z.matrix.invert(),Z.matrix.multiply(de.matrixWorld)),Z.matrix.decompose(Z.position,Z.quaternion,Z.scale),Z.updateMatrixWorld(!0),Z.projectionMatrix.copy(de.projectionMatrix),Z.projectionMatrixInverse.copy(de.projectionMatrixInverse),Z.isPerspectiveCamera&&(Z.fov=ya*2*Math.atan(1/Z.projectionMatrix.elements[5]),Z.zoom=1)}this.getCamera=function(){return O},this.getFoveation=function(){if(!(u===null&&f===null))return l},this.setFoveation=function(Z){l=Z,u!==null&&(u.fixedFoveation=Z),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=Z)},this.hasDepthSensing=function(){return p.texture!==null},this.getDepthSensingMesh=function(){return p.getMesh(O)},this.getCameraTexture=function(Z){return m[Z]};let Ye=null;function je(Z,de){if(h=de.getViewerPose(c||a),g=de,h!==null){let ie=h.views;f!==null&&(e.setRenderTargetFramebuffer(b,f.framebuffer),e.setRenderTarget(b));let Ie=!1;ie.length!==O.cameras.length&&(O.cameras.length=0,Ie=!0);for(let Ge=0;Ge<ie.length;Ge++){let Qe=ie[Ge],lt=null;if(f!==null)lt=f.getViewport(Qe);else{let Tt=d.getViewSubImage(u,Qe);lt=Tt.viewport,Ge===0&&(e.setRenderTargetTextures(b,Tt.colorTexture,Tt.depthStencilTexture),e.setRenderTarget(b))}let He=R[Ge];He===void 0&&(He=new Gt,He.layers.enable(Ge),He.viewport=new xt,R[Ge]=He),He.matrix.fromArray(Qe.transform.matrix),He.matrix.decompose(He.position,He.quaternion,He.scale),He.projectionMatrix.fromArray(Qe.projectionMatrix),He.projectionMatrixInverse.copy(He.projectionMatrix).invert(),He.viewport.set(lt.x,lt.y,lt.width,lt.height),Ge===0&&(O.matrix.copy(He.matrix),O.matrix.decompose(O.position,O.quaternion,O.scale)),Ie===!0&&O.cameras.push(He)}let Fe=s.enabledFeatures;if(Fe&&Fe.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&S){d=i.getBinding();let Ge=d.getDepthInformation(ie[0]);Ge&&Ge.isValid&&Ge.texture&&p.init(Ge,s.renderState)}if(Fe&&Fe.includes("camera-access")&&S){e.state.unbindTexture(),d=i.getBinding();for(let Ge=0;Ge<ie.length;Ge++){let Qe=ie[Ge].camera;if(Qe){let lt=m[Qe];lt||(lt=new Js,m[Qe]=lt);let He=d.getCameraImage(Qe);lt.sourceTexture=He}}}}for(let ie=0;ie<A.length;ie++){let Ie=E[ie],Fe=A[ie];Ie!==null&&Fe!==void 0&&Fe.update(Ie,de,c||a)}Ye&&Ye(Z,de),de.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:de}),g=null}let Oe=new Bu;Oe.setAnimationLoop(je),this.setAnimationLoop=function(Z){Ye=Z},this.dispose=function(){}}},c_=new ut,Wu=new Le;Wu.set(-1,0,0,0,1,0,0,0,1);function h_(n,e){function t(p,m){p.matrixAutoUpdate===!0&&p.updateMatrix(),m.value.copy(p.matrix)}function i(p,m){m.color.getRGB(p.fogColor.value,sc(n)),m.isFog?(p.fogNear.value=m.near,p.fogFar.value=m.far):m.isFogExp2&&(p.fogDensity.value=m.density)}function s(p,m,x,M,b){m.isNodeMaterial?m.uniformsNeedUpdate=!1:m.isMeshBasicMaterial?r(p,m):m.isMeshLambertMaterial?(r(p,m),m.envMap&&(p.envMapIntensity.value=m.envMapIntensity)):m.isMeshToonMaterial?(r(p,m),d(p,m)):m.isMeshPhongMaterial?(r(p,m),h(p,m),m.envMap&&(p.envMapIntensity.value=m.envMapIntensity)):m.isMeshStandardMaterial?(r(p,m),u(p,m),m.isMeshPhysicalMaterial&&f(p,m,b)):m.isMeshMatcapMaterial?(r(p,m),g(p,m)):m.isMeshDepthMaterial?r(p,m):m.isMeshDistanceMaterial?(r(p,m),S(p,m)):m.isMeshNormalMaterial?r(p,m):m.isLineBasicMaterial?(a(p,m),m.isLineDashedMaterial&&o(p,m)):m.isPointsMaterial?l(p,m,x,M):m.isSpriteMaterial?c(p,m):m.isShadowMaterial?(p.color.value.copy(m.color),p.opacity.value=m.opacity):m.isShaderMaterial&&(m.uniformsNeedUpdate=!1)}function r(p,m){p.opacity.value=m.opacity,m.color&&p.diffuse.value.copy(m.color),m.emissive&&p.emissive.value.copy(m.emissive).multiplyScalar(m.emissiveIntensity),m.map&&(p.map.value=m.map,t(m.map,p.mapTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,t(m.alphaMap,p.alphaMapTransform)),m.bumpMap&&(p.bumpMap.value=m.bumpMap,t(m.bumpMap,p.bumpMapTransform),p.bumpScale.value=m.bumpScale,m.side===Ht&&(p.bumpScale.value*=-1)),m.normalMap&&(p.normalMap.value=m.normalMap,t(m.normalMap,p.normalMapTransform),p.normalScale.value.copy(m.normalScale),m.side===Ht&&p.normalScale.value.negate()),m.displacementMap&&(p.displacementMap.value=m.displacementMap,t(m.displacementMap,p.displacementMapTransform),p.displacementScale.value=m.displacementScale,p.displacementBias.value=m.displacementBias),m.emissiveMap&&(p.emissiveMap.value=m.emissiveMap,t(m.emissiveMap,p.emissiveMapTransform)),m.specularMap&&(p.specularMap.value=m.specularMap,t(m.specularMap,p.specularMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest);let x=e.get(m),M=x.envMap,b=x.envMapRotation;M&&(p.envMap.value=M,p.envMapRotation.value.setFromMatrix4(c_.makeRotationFromEuler(b)).transpose(),M.isCubeTexture&&M.isRenderTargetTexture===!1&&p.envMapRotation.value.premultiply(Wu),p.reflectivity.value=m.reflectivity,p.ior.value=m.ior,p.refractionRatio.value=m.refractionRatio),m.lightMap&&(p.lightMap.value=m.lightMap,p.lightMapIntensity.value=m.lightMapIntensity,t(m.lightMap,p.lightMapTransform)),m.aoMap&&(p.aoMap.value=m.aoMap,p.aoMapIntensity.value=m.aoMapIntensity,t(m.aoMap,p.aoMapTransform))}function a(p,m){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,m.map&&(p.map.value=m.map,t(m.map,p.mapTransform))}function o(p,m){p.dashSize.value=m.dashSize,p.totalSize.value=m.dashSize+m.gapSize,p.scale.value=m.scale}function l(p,m,x,M){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,p.size.value=m.size*x,p.scale.value=M*.5,m.map&&(p.map.value=m.map,t(m.map,p.uvTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,t(m.alphaMap,p.alphaMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest)}function c(p,m){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,p.rotation.value=m.rotation,m.map&&(p.map.value=m.map,t(m.map,p.mapTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,t(m.alphaMap,p.alphaMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest)}function h(p,m){p.specular.value.copy(m.specular),p.shininess.value=Math.max(m.shininess,1e-4)}function d(p,m){m.gradientMap&&(p.gradientMap.value=m.gradientMap)}function u(p,m){p.metalness.value=m.metalness,m.metalnessMap&&(p.metalnessMap.value=m.metalnessMap,t(m.metalnessMap,p.metalnessMapTransform)),p.roughness.value=m.roughness,m.roughnessMap&&(p.roughnessMap.value=m.roughnessMap,t(m.roughnessMap,p.roughnessMapTransform)),m.envMap&&(p.envMapIntensity.value=m.envMapIntensity)}function f(p,m,x){p.ior.value=m.ior,m.sheen>0&&(p.sheenColor.value.copy(m.sheenColor).multiplyScalar(m.sheen),p.sheenRoughness.value=m.sheenRoughness,m.sheenColorMap&&(p.sheenColorMap.value=m.sheenColorMap,t(m.sheenColorMap,p.sheenColorMapTransform)),m.sheenRoughnessMap&&(p.sheenRoughnessMap.value=m.sheenRoughnessMap,t(m.sheenRoughnessMap,p.sheenRoughnessMapTransform))),m.clearcoat>0&&(p.clearcoat.value=m.clearcoat,p.clearcoatRoughness.value=m.clearcoatRoughness,m.clearcoatMap&&(p.clearcoatMap.value=m.clearcoatMap,t(m.clearcoatMap,p.clearcoatMapTransform)),m.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=m.clearcoatRoughnessMap,t(m.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),m.clearcoatNormalMap&&(p.clearcoatNormalMap.value=m.clearcoatNormalMap,t(m.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(m.clearcoatNormalScale),m.side===Ht&&p.clearcoatNormalScale.value.negate())),m.dispersion>0&&(p.dispersion.value=m.dispersion),m.iridescence>0&&(p.iridescence.value=m.iridescence,p.iridescenceIOR.value=m.iridescenceIOR,p.iridescenceThicknessMinimum.value=m.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=m.iridescenceThicknessRange[1],m.iridescenceMap&&(p.iridescenceMap.value=m.iridescenceMap,t(m.iridescenceMap,p.iridescenceMapTransform)),m.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=m.iridescenceThicknessMap,t(m.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),m.transmission>0&&(p.transmission.value=m.transmission,p.transmissionSamplerMap.value=x.texture,p.transmissionSamplerSize.value.set(x.width,x.height),m.transmissionMap&&(p.transmissionMap.value=m.transmissionMap,t(m.transmissionMap,p.transmissionMapTransform)),p.thickness.value=m.thickness,m.thicknessMap&&(p.thicknessMap.value=m.thicknessMap,t(m.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=m.attenuationDistance,p.attenuationColor.value.copy(m.attenuationColor)),m.anisotropy>0&&(p.anisotropyVector.value.set(m.anisotropy*Math.cos(m.anisotropyRotation),m.anisotropy*Math.sin(m.anisotropyRotation)),m.anisotropyMap&&(p.anisotropyMap.value=m.anisotropyMap,t(m.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=m.specularIntensity,p.specularColor.value.copy(m.specularColor),m.specularColorMap&&(p.specularColorMap.value=m.specularColorMap,t(m.specularColorMap,p.specularColorMapTransform)),m.specularIntensityMap&&(p.specularIntensityMap.value=m.specularIntensityMap,t(m.specularIntensityMap,p.specularIntensityMapTransform))}function g(p,m){m.matcap&&(p.matcap.value=m.matcap)}function S(p,m){let x=e.get(m).light;p.referencePosition.value.setFromMatrixPosition(x.matrixWorld),p.nearDistance.value=x.shadow.camera.near,p.farDistance.value=x.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:s}}function u_(n,e,t,i){let s={},r={},a=[],o=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function l(x,M){let b=M.program;i.uniformBlockBinding(x,b)}function c(x,M){let b=s[x.id];b===void 0&&(g(x),b=h(x),s[x.id]=b,x.addEventListener("dispose",p));let A=M.program;i.updateUBOMapping(x,A);let E=e.render.frame;r[x.id]!==E&&(u(x),r[x.id]=E)}function h(x){let M=d();x.__bindingPointIndex=M;let b=n.createBuffer(),A=x.__size,E=x.usage;return n.bindBuffer(n.UNIFORM_BUFFER,b),n.bufferData(n.UNIFORM_BUFFER,A,E),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,M,b),b}function d(){for(let x=0;x<o;x++)if(a.indexOf(x)===-1)return a.push(x),x;return Re("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function u(x){let M=s[x.id],b=x.uniforms,A=x.__cache;n.bindBuffer(n.UNIFORM_BUFFER,M);for(let E=0,I=b.length;E<I;E++){let y=Array.isArray(b[E])?b[E]:[b[E]];for(let w=0,F=y.length;w<F;w++){let R=y[w];if(f(R,E,w,A)===!0){let O=R.__offset,G=Array.isArray(R.value)?R.value:[R.value],X=0;for(let N=0;N<G.length;N++){let z=G[N],V=S(z);typeof z=="number"||typeof z=="boolean"?(R.__data[0]=z,n.bufferSubData(n.UNIFORM_BUFFER,O+X,R.__data)):z.isMatrix3?(R.__data[0]=z.elements[0],R.__data[1]=z.elements[1],R.__data[2]=z.elements[2],R.__data[3]=0,R.__data[4]=z.elements[3],R.__data[5]=z.elements[4],R.__data[6]=z.elements[5],R.__data[7]=0,R.__data[8]=z.elements[6],R.__data[9]=z.elements[7],R.__data[10]=z.elements[8],R.__data[11]=0):ArrayBuffer.isView(z)?R.__data.set(new z.constructor(z.buffer,z.byteOffset,R.__data.length)):(z.toArray(R.__data,X),X+=V.storage/Float32Array.BYTES_PER_ELEMENT)}n.bufferSubData(n.UNIFORM_BUFFER,O,R.__data)}}}n.bindBuffer(n.UNIFORM_BUFFER,null)}function f(x,M,b,A){let E=x.value,I=M+"_"+b;if(A[I]===void 0)return typeof E=="number"||typeof E=="boolean"?A[I]=E:ArrayBuffer.isView(E)?A[I]=E.slice():A[I]=E.clone(),!0;{let y=A[I];if(typeof E=="number"||typeof E=="boolean"){if(y!==E)return A[I]=E,!0}else{if(ArrayBuffer.isView(E))return!0;if(y.equals(E)===!1)return y.copy(E),!0}}return!1}function g(x){let M=x.uniforms,b=0,A=16;for(let I=0,y=M.length;I<y;I++){let w=Array.isArray(M[I])?M[I]:[M[I]];for(let F=0,R=w.length;F<R;F++){let O=w[F],G=Array.isArray(O.value)?O.value:[O.value];for(let X=0,N=G.length;X<N;X++){let z=G[X],V=S(z),j=b%A,Q=j%V.boundary,ce=j+Q;b+=Q,ce!==0&&A-ce<V.storage&&(b+=A-ce),O.__data=new Float32Array(V.storage/Float32Array.BYTES_PER_ELEMENT),O.__offset=b,b+=V.storage}}}let E=b%A;return E>0&&(b+=A-E),x.__size=b,x.__cache={},this}function S(x){let M={boundary:0,storage:0};return typeof x=="number"||typeof x=="boolean"?(M.boundary=4,M.storage=4):x.isVector2?(M.boundary=8,M.storage=8):x.isVector3||x.isColor?(M.boundary=16,M.storage=12):x.isVector4?(M.boundary=16,M.storage=16):x.isMatrix3?(M.boundary=48,M.storage=48):x.isMatrix4?(M.boundary=64,M.storage=64):x.isTexture?Ce("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(x)?(M.boundary=16,M.storage=x.byteLength):Ce("WebGLRenderer: Unsupported uniform value type.",x),M}function p(x){let M=x.target;M.removeEventListener("dispose",p);let b=a.indexOf(M.__bindingPointIndex);a.splice(b,1),n.deleteBuffer(s[M.id]),delete s[M.id],delete r[M.id]}function m(){for(let x in s)n.deleteBuffer(s[x]);a=[],s={},r={}}return{bind:l,update:c,dispose:m}}var d_=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),Pn=null;function f_(){return Pn===null&&(Pn=new Ta(d_,16,16,gi,In),Pn.name="DFG_LUT",Pn.minFilter=we,Pn.magFilter=we,Pn.wrapS=Kt,Pn.wrapT=Kt,Pn.generateMipmaps=!1,Pn.needsUpdate=!0),Pn}var Mr=class{constructor(e={}){let{canvas:t=su(),context:i=null,depth:s=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:d=!1,reversedDepthBuffer:u=!1,outputBufferType:f=sn}=e;this.isWebGLRenderer=!0;let g;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");g=i.getContextAttributes().alpha}else g=a;let S=f,p=new Set([to,eo,Qa]),m=new Set([sn,mn,Ms,bs,Ka,ja]),x=new Uint32Array(4),M=new Int32Array(4),b=new C,A=null,E=null,I=[],y=[],w=null;this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=fn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let F=this,R=!1,O=null;this._outputColorSpace=qe;let G=0,X=0,N=null,z=-1,V=null,j=new xt,Q=new xt,ce=null,ye=new Ze(0),Te=0,Ye=t.width,je=t.height,Oe=1,Z=null,de=null,ie=new xt(0,0,Ye,je),Ie=new xt(0,0,Ye,je),Fe=!1,Pe=new $s,dt=!1,Ge=!1,Qe=new ut,lt=new C,He=new xt,Tt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},ft=!1;function Yt(){return N===null?Oe:1}let D=i;function Et(v,L){return t.getContext(v,L)}try{let v={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:d};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"184"}`),t.addEventListener("webglcontextlost",J,!1),t.addEventListener("webglcontextrestored",Me,!1),t.addEventListener("webglcontextcreationerror",Ne,!1),D===null){let L="webgl2";if(D=Et(L,v),D===null)throw Et(L)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(v){throw Re("WebGLRenderer: "+v.message),v}let We,rt,oe,gt,T,_,U,Y,K,ee,ae,W,$,fe,_e,se,te,De,Be,Je,P,ne,q;function pe(){We=new vg(D),We.init(),P=new a_(D,We),rt=new dg(D,We,e,P),oe=new s_(D,We),rt.reversedDepthBuffer&&u&&oe.buffers.depth.setReversed(!0),gt=new bg(D),T=new W0,_=new r_(D,We,oe,T,rt,P,gt),U=new yg(F),Y=new Af(D),ne=new hg(D,Y),K=new Sg(D,Y,gt,ne),ee=new Eg(D,K,Y,ne,gt),De=new Tg(D,rt,_),_e=new fg(T),ae=new G0(F,U,We,rt,ne,_e),W=new h_(F,T),$=new q0,fe=new j0(We),te=new cg(F,U,oe,ee,g,l),se=new i_(F,ee,rt),q=new u_(D,gt,rt,oe),Be=new ug(D,We,gt),Je=new Mg(D,We,gt),gt.programs=ae.programs,F.capabilities=rt,F.extensions=We,F.properties=T,F.renderLists=$,F.shadowMap=se,F.state=oe,F.info=gt}pe(),S!==sn&&(w=new Ag(S,t.width,t.height,s,r));let re=new Mc(F,D);this.xr=re,this.getContext=function(){return D},this.getContextAttributes=function(){return D.getContextAttributes()},this.forceContextLoss=function(){let v=We.get("WEBGL_lose_context");v&&v.loseContext()},this.forceContextRestore=function(){let v=We.get("WEBGL_lose_context");v&&v.restoreContext()},this.getPixelRatio=function(){return Oe},this.setPixelRatio=function(v){v!==void 0&&(Oe=v,this.setSize(Ye,je,!1))},this.getSize=function(v){return v.set(Ye,je)},this.setSize=function(v,L,H=!0){if(re.isPresenting){Ce("WebGLRenderer: Can't change size while VR device is presenting.");return}Ye=v,je=L,t.width=Math.floor(v*Oe),t.height=Math.floor(L*Oe),H===!0&&(t.style.width=v+"px",t.style.height=L+"px"),w!==null&&w.setSize(t.width,t.height),this.setViewport(0,0,v,L)},this.getDrawingBufferSize=function(v){return v.set(Ye*Oe,je*Oe).floor()},this.setDrawingBufferSize=function(v,L,H){Ye=v,je=L,Oe=H,t.width=Math.floor(v*H),t.height=Math.floor(L*H),this.setViewport(0,0,v,L)},this.setEffects=function(v){if(S===sn){Re("THREE.WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(v){for(let L=0;L<v.length;L++)if(v[L].isOutputPass===!0){Ce("THREE.WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}w.setEffects(v||[])},this.getCurrentViewport=function(v){return v.copy(j)},this.getViewport=function(v){return v.copy(ie)},this.setViewport=function(v,L,H,B){v.isVector4?ie.set(v.x,v.y,v.z,v.w):ie.set(v,L,H,B),oe.viewport(j.copy(ie).multiplyScalar(Oe).round())},this.getScissor=function(v){return v.copy(Ie)},this.setScissor=function(v,L,H,B){v.isVector4?Ie.set(v.x,v.y,v.z,v.w):Ie.set(v,L,H,B),oe.scissor(Q.copy(Ie).multiplyScalar(Oe).round())},this.getScissorTest=function(){return Fe},this.setScissorTest=function(v){oe.setScissorTest(Fe=v)},this.setOpaqueSort=function(v){Z=v},this.setTransparentSort=function(v){de=v},this.getClearColor=function(v){return v.copy(te.getClearColor())},this.setClearColor=function(){te.setClearColor(...arguments)},this.getClearAlpha=function(){return te.getClearAlpha()},this.setClearAlpha=function(){te.setClearAlpha(...arguments)},this.clear=function(v=!0,L=!0,H=!0){let B=0;if(v){let k=!1;if(N!==null){let ue=N.texture.format;k=p.has(ue)}if(k){let ue=N.texture.type,xe=m.has(ue),he=te.getClearColor(),ve=te.getClearAlpha(),be=he.r,Ue=he.g,ze=he.b;xe?(x[0]=be,x[1]=Ue,x[2]=ze,x[3]=ve,D.clearBufferuiv(D.COLOR,0,x)):(M[0]=be,M[1]=Ue,M[2]=ze,M[3]=ve,D.clearBufferiv(D.COLOR,0,M))}else B|=D.COLOR_BUFFER_BIT}L&&(B|=D.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),H&&(B|=D.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),B!==0&&D.clear(B)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(v){v.setRenderer(this),O=v},this.dispose=function(){t.removeEventListener("webglcontextlost",J,!1),t.removeEventListener("webglcontextrestored",Me,!1),t.removeEventListener("webglcontextcreationerror",Ne,!1),te.dispose(),$.dispose(),fe.dispose(),T.dispose(),U.dispose(),ee.dispose(),ne.dispose(),q.dispose(),ae.dispose(),re.dispose(),re.removeEventListener("sessionstart",kc),re.removeEventListener("sessionend",zc),Mi.stop()};function J(v){v.preventDefault(),Gs("WebGLRenderer: Context Lost."),R=!0}function Me(){Gs("WebGLRenderer: Context Restored."),R=!1;let v=gt.autoReset,L=se.enabled,H=se.autoUpdate,B=se.needsUpdate,k=se.type;pe(),gt.autoReset=v,se.enabled=L,se.autoUpdate=H,se.needsUpdate=B,se.type=k}function Ne(v){Re("WebGLRenderer: A WebGL context could not be created. Reason: ",v.statusMessage)}function vt(v){let L=v.target;L.removeEventListener("dispose",vt),et(L)}function et(v){Fn(v),T.remove(v)}function Fn(v){let L=T.get(v).programs;L!==void 0&&(L.forEach(function(H){ae.releaseProgram(H)}),v.isShaderMaterial&&ae.releaseShaderCache(v))}this.renderBufferDirect=function(v,L,H,B,k,ue){L===null&&(L=Tt);let xe=k.isMesh&&k.matrixWorld.determinant()<0,he=md(v,L,H,B,k);oe.setMaterial(B,xe);let ve=H.index,be=1;if(B.wireframe===!0){if(ve=K.getWireframeAttribute(H),ve===void 0)return;be=2}let Ue=H.drawRange,ze=H.attributes.position,Ee=Ue.start*be,tt=(Ue.start+Ue.count)*be;ue!==null&&(Ee=Math.max(Ee,ue.start*be),tt=Math.min(tt,(ue.start+ue.count)*be)),ve!==null?(Ee=Math.max(Ee,0),tt=Math.min(tt,ve.count)):ze!=null&&(Ee=Math.max(Ee,0),tt=Math.min(tt,ze.count));let St=tt-Ee;if(St<0||St===1/0)return;ne.setup(k,B,he,H,ve);let _t,it=Be;if(ve!==null&&(_t=Y.get(ve),it=Je,it.setIndex(_t)),k.isMesh)B.wireframe===!0?(oe.setLineWidth(B.wireframeLinewidth*Yt()),it.setMode(D.LINES)):it.setMode(D.TRIANGLES);else if(k.isLine){let Ft=B.linewidth;Ft===void 0&&(Ft=1),oe.setLineWidth(Ft*Yt()),k.isLineSegments?it.setMode(D.LINES):k.isLineLoop?it.setMode(D.LINE_LOOP):it.setMode(D.LINE_STRIP)}else k.isPoints?it.setMode(D.POINTS):k.isSprite&&it.setMode(D.TRIANGLES);if(k.isBatchedMesh)if(We.get("WEBGL_multi_draw"))it.renderMultiDraw(k._multiDrawStarts,k._multiDrawCounts,k._multiDrawCount);else{let Ft=k._multiDrawStarts,me=k._multiDrawCounts,$t=k._multiDrawCount,$e=ve?Y.get(ve).bytesPerElement:1,rn=T.get(B).currentProgram.getUniforms();for(let vn=0;vn<$t;vn++)rn.setValue(D,"_gl_DrawID",vn),it.render(Ft[vn]/$e,me[vn])}else if(k.isInstancedMesh)it.renderInstances(Ee,St,k.count);else if(H.isInstancedBufferGeometry){let Ft=H._maxInstanceCount!==void 0?H._maxInstanceCount:1/0,me=Math.min(H.instanceCount,Ft);it.renderInstances(Ee,St,me)}else it.render(Ee,St)};function yn(v,L,H){v.transparent===!0&&v.side===Bt&&v.forceSinglePass===!1?(v.side=Ht,v.needsUpdate=!0,Rr(v,L,H),v.side=Gn,v.needsUpdate=!0,Rr(v,L,H),v.side=Bt):Rr(v,L,H)}this.compile=function(v,L,H=null){H===null&&(H=v),E=fe.get(H),E.init(L),y.push(E),H.traverseVisible(function(k){k.isLight&&k.layers.test(L.layers)&&(E.pushLight(k),k.castShadow&&E.pushShadow(k))}),v!==H&&v.traverseVisible(function(k){k.isLight&&k.layers.test(L.layers)&&(E.pushLight(k),k.castShadow&&E.pushShadow(k))}),E.setupLights();let B=new Set;return v.traverse(function(k){if(!(k.isMesh||k.isPoints||k.isLine||k.isSprite))return;let ue=k.material;if(ue)if(Array.isArray(ue))for(let xe=0;xe<ue.length;xe++){let he=ue[xe];yn(he,H,k),B.add(he)}else yn(ue,H,k),B.add(ue)}),E=y.pop(),B},this.compileAsync=function(v,L,H=null){let B=this.compile(v,L,H);return new Promise(k=>{function ue(){if(B.forEach(function(xe){T.get(xe).currentProgram.isReady()&&B.delete(xe)}),B.size===0){k(v);return}setTimeout(ue,10)}We.get("KHR_parallel_shader_compile")!==null?ue():setTimeout(ue,10)})};let Yo=null;function fd(v){Yo&&Yo(v)}function kc(){Mi.stop()}function zc(){Mi.start()}let Mi=new Bu;Mi.setAnimationLoop(fd),typeof self<"u"&&Mi.setContext(self),this.setAnimationLoop=function(v){Yo=v,re.setAnimationLoop(v),v===null?Mi.stop():Mi.start()},re.addEventListener("sessionstart",kc),re.addEventListener("sessionend",zc),this.render=function(v,L){if(L!==void 0&&L.isCamera!==!0){Re("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(R===!0)return;O!==null&&O.renderStart(v,L);let H=re.enabled===!0&&re.isPresenting===!0,B=w!==null&&(N===null||H)&&w.begin(F,N);if(v.matrixWorldAutoUpdate===!0&&v.updateMatrixWorld(),L.parent===null&&L.matrixWorldAutoUpdate===!0&&L.updateMatrixWorld(),re.enabled===!0&&re.isPresenting===!0&&(w===null||w.isCompositing()===!1)&&(re.cameraAutoUpdate===!0&&re.updateCamera(L),L=re.getCamera()),v.isScene===!0&&v.onBeforeRender(F,v,L,N),E=fe.get(v,y.length),E.init(L),E.state.textureUnits=_.getTextureUnits(),y.push(E),Qe.multiplyMatrices(L.projectionMatrix,L.matrixWorldInverse),Pe.setFromProjectionMatrix(Qe,un,L.reversedDepth),Ge=this.localClippingEnabled,dt=_e.init(this.clippingPlanes,Ge),A=$.get(v,I.length),A.init(),I.push(A),re.enabled===!0&&re.isPresenting===!0){let xe=F.xr.getDepthSensingMesh();xe!==null&&$o(xe,L,-1/0,F.sortObjects)}$o(v,L,0,F.sortObjects),A.finish(),F.sortObjects===!0&&A.sort(Z,de),ft=re.enabled===!1||re.isPresenting===!1||re.hasDepthSensing()===!1,ft&&te.addToRenderList(A,v),this.info.render.frame++,dt===!0&&_e.beginShadows();let k=E.state.shadowsArray;if(se.render(k,v,L),dt===!0&&_e.endShadows(),this.info.autoReset===!0&&this.info.reset(),(B&&w.hasRenderPass())===!1){let xe=A.opaque,he=A.transmissive;if(E.setupLights(),L.isArrayCamera){let ve=L.cameras;if(he.length>0)for(let be=0,Ue=ve.length;be<Ue;be++){let ze=ve[be];Vc(xe,he,v,ze)}ft&&te.render(v);for(let be=0,Ue=ve.length;be<Ue;be++){let ze=ve[be];Hc(A,v,ze,ze.viewport)}}else he.length>0&&Vc(xe,he,v,L),ft&&te.render(v),Hc(A,v,L)}N!==null&&X===0&&(_.updateMultisampleRenderTarget(N),_.updateRenderTargetMipmap(N)),B&&w.end(F),v.isScene===!0&&v.onAfterRender(F,v,L),ne.resetDefaultState(),z=-1,V=null,y.pop(),y.length>0?(E=y[y.length-1],_.setTextureUnits(E.state.textureUnits),dt===!0&&_e.setGlobalState(F.clippingPlanes,E.state.camera)):E=null,I.pop(),I.length>0?A=I[I.length-1]:A=null,O!==null&&O.renderEnd()};function $o(v,L,H,B){if(v.visible===!1)return;if(v.layers.test(L.layers)){if(v.isGroup)H=v.renderOrder;else if(v.isLOD)v.autoUpdate===!0&&v.update(L);else if(v.isLightProbeGrid)E.pushLightProbeGrid(v);else if(v.isLight)E.pushLight(v),v.castShadow&&E.pushShadow(v);else if(v.isSprite){if(!v.frustumCulled||Pe.intersectsSprite(v)){B&&He.setFromMatrixPosition(v.matrixWorld).applyMatrix4(Qe);let xe=ee.update(v),he=v.material;he.visible&&A.push(v,xe,he,H,He.z,null)}}else if((v.isMesh||v.isLine||v.isPoints)&&(!v.frustumCulled||Pe.intersectsObject(v))){let xe=ee.update(v),he=v.material;if(B&&(v.boundingSphere!==void 0?(v.boundingSphere===null&&v.computeBoundingSphere(),He.copy(v.boundingSphere.center)):(xe.boundingSphere===null&&xe.computeBoundingSphere(),He.copy(xe.boundingSphere.center)),He.applyMatrix4(v.matrixWorld).applyMatrix4(Qe)),Array.isArray(he)){let ve=xe.groups;for(let be=0,Ue=ve.length;be<Ue;be++){let ze=ve[be],Ee=he[ze.materialIndex];Ee&&Ee.visible&&A.push(v,xe,Ee,H,He.z,ze)}}else he.visible&&A.push(v,xe,he,H,He.z,null)}}let ue=v.children;for(let xe=0,he=ue.length;xe<he;xe++)$o(ue[xe],L,H,B)}function Hc(v,L,H,B){let{opaque:k,transmissive:ue,transparent:xe}=v;E.setupLightsView(H),dt===!0&&_e.setGlobalState(F.clippingPlanes,H),B&&oe.viewport(j.copy(B)),k.length>0&&Cr(k,L,H),ue.length>0&&Cr(ue,L,H),xe.length>0&&Cr(xe,L,H),oe.buffers.depth.setTest(!0),oe.buffers.depth.setMask(!0),oe.buffers.color.setMask(!0),oe.setPolygonOffset(!1)}function Vc(v,L,H,B){if((H.isScene===!0?H.overrideMaterial:null)!==null)return;if(E.state.transmissionRenderTarget[B.id]===void 0){let Ee=We.has("EXT_color_buffer_half_float")||We.has("EXT_color_buffer_float");E.state.transmissionRenderTarget[B.id]=new jt(1,1,{generateMipmaps:!0,type:Ee?In:sn,minFilter:pn,samples:Math.max(4,rt.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Xe.workingColorSpace})}let ue=E.state.transmissionRenderTarget[B.id],xe=B.viewport||j;ue.setSize(xe.z*F.transmissionResolutionScale,xe.w*F.transmissionResolutionScale);let he=F.getRenderTarget(),ve=F.getActiveCubeFace(),be=F.getActiveMipmapLevel();F.setRenderTarget(ue),F.getClearColor(ye),Te=F.getClearAlpha(),Te<1&&F.setClearColor(16777215,.5),F.clear(),ft&&te.render(H);let Ue=F.toneMapping;F.toneMapping=fn;let ze=B.viewport;if(B.viewport!==void 0&&(B.viewport=void 0),E.setupLightsView(B),dt===!0&&_e.setGlobalState(F.clippingPlanes,B),Cr(v,H,B),_.updateMultisampleRenderTarget(ue),_.updateRenderTargetMipmap(ue),We.has("WEBGL_multisampled_render_to_texture")===!1){let Ee=!1;for(let tt=0,St=L.length;tt<St;tt++){let _t=L[tt],{object:it,geometry:Ft,material:me,group:$t}=_t;if(me.side===Bt&&it.layers.test(B.layers)){let $e=me.side;me.side=Ht,me.needsUpdate=!0,Gc(it,H,B,Ft,me,$t),me.side=$e,me.needsUpdate=!0,Ee=!0}}Ee===!0&&(_.updateMultisampleRenderTarget(ue),_.updateRenderTargetMipmap(ue))}F.setRenderTarget(he,ve,be),F.setClearColor(ye,Te),ze!==void 0&&(B.viewport=ze),F.toneMapping=Ue}function Cr(v,L,H){let B=L.isScene===!0?L.overrideMaterial:null;for(let k=0,ue=v.length;k<ue;k++){let xe=v[k],{object:he,geometry:ve,group:be}=xe,Ue=xe.material;Ue.allowOverride===!0&&B!==null&&(Ue=B),he.layers.test(H.layers)&&Gc(he,L,H,ve,Ue,be)}}function Gc(v,L,H,B,k,ue){v.onBeforeRender(F,L,H,B,k,ue),v.modelViewMatrix.multiplyMatrices(H.matrixWorldInverse,v.matrixWorld),v.normalMatrix.getNormalMatrix(v.modelViewMatrix),k.onBeforeRender(F,L,H,B,v,ue),k.transparent===!0&&k.side===Bt&&k.forceSinglePass===!1?(k.side=Ht,k.needsUpdate=!0,F.renderBufferDirect(H,L,B,k,v,ue),k.side=Gn,k.needsUpdate=!0,F.renderBufferDirect(H,L,B,k,v,ue),k.side=Bt):F.renderBufferDirect(H,L,B,k,v,ue),v.onAfterRender(F,L,H,B,k,ue)}function Rr(v,L,H){L.isScene!==!0&&(L=Tt);let B=T.get(v),k=E.state.lights,ue=E.state.shadowsArray,xe=k.state.version,he=ae.getParameters(v,k.state,ue,L,H,E.state.lightProbeGridArray),ve=ae.getProgramCacheKey(he),be=B.programs;B.environment=v.isMeshStandardMaterial||v.isMeshLambertMaterial||v.isMeshPhongMaterial?L.environment:null,B.fog=L.fog;let Ue=v.isMeshStandardMaterial||v.isMeshLambertMaterial&&!v.envMap||v.isMeshPhongMaterial&&!v.envMap;B.envMap=U.get(v.envMap||B.environment,Ue),B.envMapRotation=B.environment!==null&&v.envMap===null?L.environmentRotation:v.envMapRotation,be===void 0&&(v.addEventListener("dispose",vt),be=new Map,B.programs=be);let ze=be.get(ve);if(ze!==void 0){if(B.currentProgram===ze&&B.lightsStateVersion===xe)return Xc(v,he),ze}else he.uniforms=ae.getUniforms(v),O!==null&&v.isNodeMaterial&&O.build(v,H,he),v.onBeforeCompile(he,F),ze=ae.acquireProgram(he,ve),be.set(ve,ze),B.uniforms=he.uniforms;let Ee=B.uniforms;return(!v.isShaderMaterial&&!v.isRawShaderMaterial||v.clipping===!0)&&(Ee.clippingPlanes=_e.uniform),Xc(v,he),B.needsLights=_d(v),B.lightsStateVersion=xe,B.needsLights&&(Ee.ambientLightColor.value=k.state.ambient,Ee.lightProbe.value=k.state.probe,Ee.directionalLights.value=k.state.directional,Ee.directionalLightShadows.value=k.state.directionalShadow,Ee.spotLights.value=k.state.spot,Ee.spotLightShadows.value=k.state.spotShadow,Ee.rectAreaLights.value=k.state.rectArea,Ee.ltc_1.value=k.state.rectAreaLTC1,Ee.ltc_2.value=k.state.rectAreaLTC2,Ee.pointLights.value=k.state.point,Ee.pointLightShadows.value=k.state.pointShadow,Ee.hemisphereLights.value=k.state.hemi,Ee.directionalShadowMatrix.value=k.state.directionalShadowMatrix,Ee.spotLightMatrix.value=k.state.spotLightMatrix,Ee.spotLightMap.value=k.state.spotLightMap,Ee.pointShadowMatrix.value=k.state.pointShadowMatrix),B.lightProbeGrid=E.state.lightProbeGridArray.length>0,B.currentProgram=ze,B.uniformsList=null,ze}function Wc(v){if(v.uniformsList===null){let L=v.currentProgram.getUniforms();v.uniformsList=Es.seqWithValue(L.seq,v.uniforms)}return v.uniformsList}function Xc(v,L){let H=T.get(v);H.outputColorSpace=L.outputColorSpace,H.batching=L.batching,H.batchingColor=L.batchingColor,H.instancing=L.instancing,H.instancingColor=L.instancingColor,H.instancingMorph=L.instancingMorph,H.skinning=L.skinning,H.morphTargets=L.morphTargets,H.morphNormals=L.morphNormals,H.morphColors=L.morphColors,H.morphTargetsCount=L.morphTargetsCount,H.numClippingPlanes=L.numClippingPlanes,H.numIntersection=L.numClipIntersection,H.vertexAlphas=L.vertexAlphas,H.vertexTangents=L.vertexTangents,H.toneMapping=L.toneMapping}function pd(v,L){if(v.length===0)return null;if(v.length===1)return v[0].texture!==null?v[0]:null;b.setFromMatrixPosition(L.matrixWorld);for(let H=0,B=v.length;H<B;H++){let k=v[H];if(k.texture!==null&&k.boundingBox.containsPoint(b))return k}return null}function md(v,L,H,B,k){L.isScene!==!0&&(L=Tt),_.resetTextureUnits();let ue=L.fog,xe=B.isMeshStandardMaterial||B.isMeshLambertMaterial||B.isMeshPhongMaterial?L.environment:null,he=N===null?F.outputColorSpace:N.isXRRenderTarget===!0?N.texture.colorSpace:Xe.workingColorSpace,ve=B.isMeshStandardMaterial||B.isMeshLambertMaterial&&!B.envMap||B.isMeshPhongMaterial&&!B.envMap,be=U.get(B.envMap||xe,ve),Ue=B.vertexColors===!0&&!!H.attributes.color&&H.attributes.color.itemSize===4,ze=!!H.attributes.tangent&&(!!B.normalMap||B.anisotropy>0),Ee=!!H.morphAttributes.position,tt=!!H.morphAttributes.normal,St=!!H.morphAttributes.color,_t=fn;B.toneMapped&&(N===null||N.isXRRenderTarget===!0)&&(_t=F.toneMapping);let it=H.morphAttributes.position||H.morphAttributes.normal||H.morphAttributes.color,Ft=it!==void 0?it.length:0,me=T.get(B),$t=E.state.lights;if(dt===!0&&(Ge===!0||v!==V)){let at=v===V&&B.id===z;_e.setState(B,v,at)}let $e=!1;B.version===me.__version?(me.needsLights&&me.lightsStateVersion!==$t.state.version||me.outputColorSpace!==he||k.isBatchedMesh&&me.batching===!1||!k.isBatchedMesh&&me.batching===!0||k.isBatchedMesh&&me.batchingColor===!0&&k.colorTexture===null||k.isBatchedMesh&&me.batchingColor===!1&&k.colorTexture!==null||k.isInstancedMesh&&me.instancing===!1||!k.isInstancedMesh&&me.instancing===!0||k.isSkinnedMesh&&me.skinning===!1||!k.isSkinnedMesh&&me.skinning===!0||k.isInstancedMesh&&me.instancingColor===!0&&k.instanceColor===null||k.isInstancedMesh&&me.instancingColor===!1&&k.instanceColor!==null||k.isInstancedMesh&&me.instancingMorph===!0&&k.morphTexture===null||k.isInstancedMesh&&me.instancingMorph===!1&&k.morphTexture!==null||me.envMap!==be||B.fog===!0&&me.fog!==ue||me.numClippingPlanes!==void 0&&(me.numClippingPlanes!==_e.numPlanes||me.numIntersection!==_e.numIntersection)||me.vertexAlphas!==Ue||me.vertexTangents!==ze||me.morphTargets!==Ee||me.morphNormals!==tt||me.morphColors!==St||me.toneMapping!==_t||me.morphTargetsCount!==Ft||!!me.lightProbeGrid!=E.state.lightProbeGridArray.length>0)&&($e=!0):($e=!0,me.__version=B.version);let rn=me.currentProgram;$e===!0&&(rn=Rr(B,L,k),O&&B.isNodeMaterial&&O.onUpdateProgram(B,rn,me));let vn=!1,Kn=!1,Bi=!1,st=rn.getUniforms(),Mt=me.uniforms;if(oe.useProgram(rn.program)&&(vn=!0,Kn=!0,Bi=!0),B.id!==z&&(z=B.id,Kn=!0),me.needsLights){let at=pd(E.state.lightProbeGridArray,k);me.lightProbeGrid!==at&&(me.lightProbeGrid=at,Kn=!0)}if(vn||V!==v){oe.buffers.depth.getReversed()&&v.reversedDepth!==!0&&(v._reversedDepth=!0,v.updateProjectionMatrix()),st.setValue(D,"projectionMatrix",v.projectionMatrix),st.setValue(D,"viewMatrix",v.matrixWorldInverse);let Qn=st.map.cameraPosition;Qn!==void 0&&Qn.setValue(D,lt.setFromMatrixPosition(v.matrixWorld)),rt.logarithmicDepthBuffer&&st.setValue(D,"logDepthBufFC",2/(Math.log(v.far+1)/Math.LN2)),(B.isMeshPhongMaterial||B.isMeshToonMaterial||B.isMeshLambertMaterial||B.isMeshBasicMaterial||B.isMeshStandardMaterial||B.isShaderMaterial)&&st.setValue(D,"isOrthographic",v.isOrthographicCamera===!0),V!==v&&(V=v,Kn=!0,Bi=!0)}if(me.needsLights&&($t.state.directionalShadowMap.length>0&&st.setValue(D,"directionalShadowMap",$t.state.directionalShadowMap,_),$t.state.spotShadowMap.length>0&&st.setValue(D,"spotShadowMap",$t.state.spotShadowMap,_),$t.state.pointShadowMap.length>0&&st.setValue(D,"pointShadowMap",$t.state.pointShadowMap,_)),k.isSkinnedMesh){st.setOptional(D,k,"bindMatrix"),st.setOptional(D,k,"bindMatrixInverse");let at=k.skeleton;at&&(at.boneTexture===null&&at.computeBoneTexture(),st.setValue(D,"boneTexture",at.boneTexture,_))}k.isBatchedMesh&&(st.setOptional(D,k,"batchingTexture"),st.setValue(D,"batchingTexture",k._matricesTexture,_),st.setOptional(D,k,"batchingIdTexture"),st.setValue(D,"batchingIdTexture",k._indirectTexture,_),st.setOptional(D,k,"batchingColorTexture"),k._colorsTexture!==null&&st.setValue(D,"batchingColorTexture",k._colorsTexture,_));let jn=H.morphAttributes;if((jn.position!==void 0||jn.normal!==void 0||jn.color!==void 0)&&De.update(k,H,rn),(Kn||me.receiveShadow!==k.receiveShadow)&&(me.receiveShadow=k.receiveShadow,st.setValue(D,"receiveShadow",k.receiveShadow)),(B.isMeshStandardMaterial||B.isMeshLambertMaterial||B.isMeshPhongMaterial)&&B.envMap===null&&L.environment!==null&&(Mt.envMapIntensity.value=L.environmentIntensity),Mt.dfgLUT!==void 0&&(Mt.dfgLUT.value=f_()),Kn){if(st.setValue(D,"toneMappingExposure",F.toneMappingExposure),me.needsLights&&gd(Mt,Bi),ue&&B.fog===!0&&W.refreshFogUniforms(Mt,ue),W.refreshMaterialUniforms(Mt,B,Oe,je,E.state.transmissionRenderTarget[v.id]),me.needsLights&&me.lightProbeGrid){let at=me.lightProbeGrid;Mt.probesSH.value=at.texture,Mt.probesMin.value.copy(at.boundingBox.min),Mt.probesMax.value.copy(at.boundingBox.max),Mt.probesResolution.value.copy(at.resolution)}Es.upload(D,Wc(me),Mt,_)}if(B.isShaderMaterial&&B.uniformsNeedUpdate===!0&&(Es.upload(D,Wc(me),Mt,_),B.uniformsNeedUpdate=!1),B.isSpriteMaterial&&st.setValue(D,"center",k.center),st.setValue(D,"modelViewMatrix",k.modelViewMatrix),st.setValue(D,"normalMatrix",k.normalMatrix),st.setValue(D,"modelMatrix",k.matrixWorld),B.uniformsGroups!==void 0){let at=B.uniformsGroups;for(let Qn=0,ki=at.length;Qn<ki;Qn++){let qc=at[Qn];q.update(qc,rn),q.bind(qc,rn)}}return rn}function gd(v,L){v.ambientLightColor.needsUpdate=L,v.lightProbe.needsUpdate=L,v.directionalLights.needsUpdate=L,v.directionalLightShadows.needsUpdate=L,v.pointLights.needsUpdate=L,v.pointLightShadows.needsUpdate=L,v.spotLights.needsUpdate=L,v.spotLightShadows.needsUpdate=L,v.rectAreaLights.needsUpdate=L,v.hemisphereLights.needsUpdate=L}function _d(v){return v.isMeshLambertMaterial||v.isMeshToonMaterial||v.isMeshPhongMaterial||v.isMeshStandardMaterial||v.isShadowMaterial||v.isShaderMaterial&&v.lights===!0}this.getActiveCubeFace=function(){return G},this.getActiveMipmapLevel=function(){return X},this.getRenderTarget=function(){return N},this.setRenderTargetTextures=function(v,L,H){let B=T.get(v);B.__autoAllocateDepthBuffer=v.resolveDepthBuffer===!1,B.__autoAllocateDepthBuffer===!1&&(B.__useRenderToTexture=!1),T.get(v.texture).__webglTexture=L,T.get(v.depthTexture).__webglTexture=B.__autoAllocateDepthBuffer?void 0:H,B.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(v,L){let H=T.get(v);H.__webglFramebuffer=L,H.__useDefaultFramebuffer=L===void 0};let xd=D.createFramebuffer();this.setRenderTarget=function(v,L=0,H=0){N=v,G=L,X=H;let B=null,k=!1,ue=!1;if(v){let he=T.get(v);if(he.__useDefaultFramebuffer!==void 0){oe.bindFramebuffer(D.FRAMEBUFFER,he.__webglFramebuffer),j.copy(v.viewport),Q.copy(v.scissor),ce=v.scissorTest,oe.viewport(j),oe.scissor(Q),oe.setScissorTest(ce),z=-1;return}else if(he.__webglFramebuffer===void 0)_.setupRenderTarget(v);else if(he.__hasExternalTextures)_.rebindTextures(v,T.get(v.texture).__webglTexture,T.get(v.depthTexture).__webglTexture);else if(v.depthBuffer){let Ue=v.depthTexture;if(he.__boundDepthTexture!==Ue){if(Ue!==null&&T.has(Ue)&&(v.width!==Ue.image.width||v.height!==Ue.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");_.setupDepthRenderbuffer(v)}}let ve=v.texture;(ve.isData3DTexture||ve.isDataArrayTexture||ve.isCompressedArrayTexture)&&(ue=!0);let be=T.get(v).__webglFramebuffer;v.isWebGLCubeRenderTarget?(Array.isArray(be[L])?B=be[L][H]:B=be[L],k=!0):v.samples>0&&_.useMultisampledRTT(v)===!1?B=T.get(v).__webglMultisampledFramebuffer:Array.isArray(be)?B=be[H]:B=be,j.copy(v.viewport),Q.copy(v.scissor),ce=v.scissorTest}else j.copy(ie).multiplyScalar(Oe).floor(),Q.copy(Ie).multiplyScalar(Oe).floor(),ce=Fe;if(H!==0&&(B=xd),oe.bindFramebuffer(D.FRAMEBUFFER,B)&&oe.drawBuffers(v,B),oe.viewport(j),oe.scissor(Q),oe.setScissorTest(ce),k){let he=T.get(v.texture);D.framebufferTexture2D(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_CUBE_MAP_POSITIVE_X+L,he.__webglTexture,H)}else if(ue){let he=L;for(let ve=0;ve<v.textures.length;ve++){let be=T.get(v.textures[ve]);D.framebufferTextureLayer(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0+ve,be.__webglTexture,H,he)}}else if(v!==null&&H!==0){let he=T.get(v.texture);D.framebufferTexture2D(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,he.__webglTexture,H)}z=-1},this.readRenderTargetPixels=function(v,L,H,B,k,ue,xe,he=0){if(!(v&&v.isWebGLRenderTarget)){Re("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let ve=T.get(v).__webglFramebuffer;if(v.isWebGLCubeRenderTarget&&xe!==void 0&&(ve=ve[xe]),ve){oe.bindFramebuffer(D.FRAMEBUFFER,ve);try{let be=v.textures[he],Ue=be.format,ze=be.type;if(v.textures.length>1&&D.readBuffer(D.COLOR_ATTACHMENT0+he),!rt.textureFormatReadable(Ue)){Re("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!rt.textureTypeReadable(ze)){Re("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}L>=0&&L<=v.width-B&&H>=0&&H<=v.height-k&&D.readPixels(L,H,B,k,P.convert(Ue),P.convert(ze),ue)}finally{let be=N!==null?T.get(N).__webglFramebuffer:null;oe.bindFramebuffer(D.FRAMEBUFFER,be)}}},this.readRenderTargetPixelsAsync=async function(v,L,H,B,k,ue,xe,he=0){if(!(v&&v.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let ve=T.get(v).__webglFramebuffer;if(v.isWebGLCubeRenderTarget&&xe!==void 0&&(ve=ve[xe]),ve)if(L>=0&&L<=v.width-B&&H>=0&&H<=v.height-k){oe.bindFramebuffer(D.FRAMEBUFFER,ve);let be=v.textures[he],Ue=be.format,ze=be.type;if(v.textures.length>1&&D.readBuffer(D.COLOR_ATTACHMENT0+he),!rt.textureFormatReadable(Ue))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!rt.textureTypeReadable(ze))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let Ee=D.createBuffer();D.bindBuffer(D.PIXEL_PACK_BUFFER,Ee),D.bufferData(D.PIXEL_PACK_BUFFER,ue.byteLength,D.STREAM_READ),D.readPixels(L,H,B,k,P.convert(Ue),P.convert(ze),0);let tt=N!==null?T.get(N).__webglFramebuffer:null;oe.bindFramebuffer(D.FRAMEBUFFER,tt);let St=D.fenceSync(D.SYNC_GPU_COMMANDS_COMPLETE,0);return D.flush(),await au(D,St,4),D.bindBuffer(D.PIXEL_PACK_BUFFER,Ee),D.getBufferSubData(D.PIXEL_PACK_BUFFER,0,ue),D.deleteBuffer(Ee),D.deleteSync(St),ue}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(v,L=null,H=0){let B=Math.pow(2,-H),k=Math.floor(v.image.width*B),ue=Math.floor(v.image.height*B),xe=L!==null?L.x:0,he=L!==null?L.y:0;_.setTexture2D(v,0),D.copyTexSubImage2D(D.TEXTURE_2D,H,0,0,xe,he,k,ue),oe.unbindTexture()};let yd=D.createFramebuffer(),vd=D.createFramebuffer();this.copyTextureToTexture=function(v,L,H=null,B=null,k=0,ue=0){let xe,he,ve,be,Ue,ze,Ee,tt,St,_t=v.isCompressedTexture?v.mipmaps[ue]:v.image;if(H!==null)xe=H.max.x-H.min.x,he=H.max.y-H.min.y,ve=H.isBox3?H.max.z-H.min.z:1,be=H.min.x,Ue=H.min.y,ze=H.isBox3?H.min.z:0;else{let Mt=Math.pow(2,-k);xe=Math.floor(_t.width*Mt),he=Math.floor(_t.height*Mt),v.isDataArrayTexture?ve=_t.depth:v.isData3DTexture?ve=Math.floor(_t.depth*Mt):ve=1,be=0,Ue=0,ze=0}B!==null?(Ee=B.x,tt=B.y,St=B.z):(Ee=0,tt=0,St=0);let it=P.convert(L.format),Ft=P.convert(L.type),me;L.isData3DTexture?(_.setTexture3D(L,0),me=D.TEXTURE_3D):L.isDataArrayTexture||L.isCompressedArrayTexture?(_.setTexture2DArray(L,0),me=D.TEXTURE_2D_ARRAY):(_.setTexture2D(L,0),me=D.TEXTURE_2D),oe.activeTexture(D.TEXTURE0),oe.pixelStorei(D.UNPACK_FLIP_Y_WEBGL,L.flipY),oe.pixelStorei(D.UNPACK_PREMULTIPLY_ALPHA_WEBGL,L.premultiplyAlpha),oe.pixelStorei(D.UNPACK_ALIGNMENT,L.unpackAlignment);let $t=oe.getParameter(D.UNPACK_ROW_LENGTH),$e=oe.getParameter(D.UNPACK_IMAGE_HEIGHT),rn=oe.getParameter(D.UNPACK_SKIP_PIXELS),vn=oe.getParameter(D.UNPACK_SKIP_ROWS),Kn=oe.getParameter(D.UNPACK_SKIP_IMAGES);oe.pixelStorei(D.UNPACK_ROW_LENGTH,_t.width),oe.pixelStorei(D.UNPACK_IMAGE_HEIGHT,_t.height),oe.pixelStorei(D.UNPACK_SKIP_PIXELS,be),oe.pixelStorei(D.UNPACK_SKIP_ROWS,Ue),oe.pixelStorei(D.UNPACK_SKIP_IMAGES,ze);let Bi=v.isDataArrayTexture||v.isData3DTexture,st=L.isDataArrayTexture||L.isData3DTexture;if(v.isDepthTexture){let Mt=T.get(v),jn=T.get(L),at=T.get(Mt.__renderTarget),Qn=T.get(jn.__renderTarget);oe.bindFramebuffer(D.READ_FRAMEBUFFER,at.__webglFramebuffer),oe.bindFramebuffer(D.DRAW_FRAMEBUFFER,Qn.__webglFramebuffer);for(let ki=0;ki<ve;ki++)Bi&&(D.framebufferTextureLayer(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,T.get(v).__webglTexture,k,ze+ki),D.framebufferTextureLayer(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,T.get(L).__webglTexture,ue,St+ki)),D.blitFramebuffer(be,Ue,xe,he,Ee,tt,xe,he,D.DEPTH_BUFFER_BIT,D.NEAREST);oe.bindFramebuffer(D.READ_FRAMEBUFFER,null),oe.bindFramebuffer(D.DRAW_FRAMEBUFFER,null)}else if(k!==0||v.isRenderTargetTexture||T.has(v)){let Mt=T.get(v),jn=T.get(L);oe.bindFramebuffer(D.READ_FRAMEBUFFER,yd),oe.bindFramebuffer(D.DRAW_FRAMEBUFFER,vd);for(let at=0;at<ve;at++)Bi?D.framebufferTextureLayer(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,Mt.__webglTexture,k,ze+at):D.framebufferTexture2D(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,Mt.__webglTexture,k),st?D.framebufferTextureLayer(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,jn.__webglTexture,ue,St+at):D.framebufferTexture2D(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,jn.__webglTexture,ue),k!==0?D.blitFramebuffer(be,Ue,xe,he,Ee,tt,xe,he,D.COLOR_BUFFER_BIT,D.NEAREST):st?D.copyTexSubImage3D(me,ue,Ee,tt,St+at,be,Ue,xe,he):D.copyTexSubImage2D(me,ue,Ee,tt,be,Ue,xe,he);oe.bindFramebuffer(D.READ_FRAMEBUFFER,null),oe.bindFramebuffer(D.DRAW_FRAMEBUFFER,null)}else st?v.isDataTexture||v.isData3DTexture?D.texSubImage3D(me,ue,Ee,tt,St,xe,he,ve,it,Ft,_t.data):L.isCompressedArrayTexture?D.compressedTexSubImage3D(me,ue,Ee,tt,St,xe,he,ve,it,_t.data):D.texSubImage3D(me,ue,Ee,tt,St,xe,he,ve,it,Ft,_t):v.isDataTexture?D.texSubImage2D(D.TEXTURE_2D,ue,Ee,tt,xe,he,it,Ft,_t.data):v.isCompressedTexture?D.compressedTexSubImage2D(D.TEXTURE_2D,ue,Ee,tt,_t.width,_t.height,it,_t.data):D.texSubImage2D(D.TEXTURE_2D,ue,Ee,tt,xe,he,it,Ft,_t);oe.pixelStorei(D.UNPACK_ROW_LENGTH,$t),oe.pixelStorei(D.UNPACK_IMAGE_HEIGHT,$e),oe.pixelStorei(D.UNPACK_SKIP_PIXELS,rn),oe.pixelStorei(D.UNPACK_SKIP_ROWS,vn),oe.pixelStorei(D.UNPACK_SKIP_IMAGES,Kn),ue===0&&L.generateMipmaps&&D.generateMipmap(me),oe.unbindTexture()},this.initRenderTarget=function(v){T.get(v).__webglFramebuffer===void 0&&_.setupRenderTarget(v)},this.initTexture=function(v){v.isCubeTexture?_.setTextureCube(v,0):v.isData3DTexture?_.setTexture3D(v,0):v.isDataArrayTexture||v.isCompressedArrayTexture?_.setTexture2DArray(v,0):_.setTexture2D(v,0),oe.unbindTexture()},this.resetState=function(){G=0,X=0,N=null,oe.reset(),ne.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return un}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=Xe._getDrawingBufferColorSpace(e),t.unpackColorSpace=Xe._getUnpackColorSpace()}};var xi=16,yi=9,Ec=new WeakMap,Oi=new WeakMap,Se=new Map;function Ae(n,e=0){let t=Number(n);return Number.isFinite(t)?t:e}function qt(n,e,t){return Math.max(e,Math.min(t,n))}function Er(n){return(Ae(n,.5)-.5)*xi}function wr(n){return(.5-Ae(n,.5))*yi}function bc(n={},e=-1.65){return new C(Er(n.x),wr(n.y),e)}function ed(n={},e=0){return-1+(1-Ae(n.y,.5))*.6+Ae(n.z,0)*.025+e}function br(n=""){switch(String(n)){case"builder":return{fill:"#c97a3d",stroke:"#5a2f16",cue:"#ffe4a0",mark:"B",face:"#ffe5bd",accent:"#ffd34f",trim:"#7f3f1c"};case"worker":return{fill:"#5f8d8e",stroke:"#173f41",cue:"#d6f1ef",mark:"W",face:"#ffe0b4",accent:"#9fd3c8",trim:"#31585b"};case"hauler":return{fill:"#d7ae50",stroke:"#654716",cue:"#fff0bd",mark:"H",face:"#f5d29b",accent:"#8bb36d",trim:"#8a5d1f"};case"messenger":return{fill:"#c85c75",stroke:"#5a1c2b",cue:"#ffd5de",mark:"!",face:"#ffe1be",accent:"#78a9d6",trim:"#7e2c3c"};default:return{fill:"#7f9b66",stroke:"#254526",cue:"#daf0cf",mark:"C",face:"#ffe8c4",accent:"#a7c884",trim:"#446235"}}}function Vo(n=""){let e=String(n||""),t=0;for(let i=0;i<e.length;i+=1)t=(t<<5)-t+e.charCodeAt(i)|0;return Math.abs(t%628)/100}function m_(n,e,t,i="busy"){n.fillStyle="#2e1b0e",n.beginPath(),n.ellipse(e-17,t,5,7,0,0,Math.PI*2),n.ellipse(e+17,t,5,7,0,0,Math.PI*2),n.fill(),n.fillStyle="#fff8e8",n.beginPath(),n.arc(e-19,t-3,2,0,Math.PI*2),n.arc(e+15,t-3,2,0,Math.PI*2),n.fill(),n.strokeStyle="#2e1b0e",n.lineWidth=4,n.lineCap="round",n.beginPath(),i==="alert"?(n.moveTo(e-26,t-15),n.lineTo(e-12,t-19),n.moveTo(e+12,t-19),n.lineTo(e+27,t-14)):(n.moveTo(e-26,t-15),n.lineTo(e-12,t-13),n.moveTo(e+12,t-13),n.lineTo(e+27,t-15)),n.stroke(),n.beginPath(),i==="happy"?n.arc(e,t+13,14,.1,Math.PI-.1):(n.moveTo(e-8,t+15),n.quadraticCurveTo(e,t+20,e+10,t+14)),n.stroke()}function Xu(n,e,t,i){n.fillStyle="#ffe0b4",n.strokeStyle=i,n.lineWidth=4,n.beginPath(),n.arc(e,t,10,0,Math.PI*2),n.fill(),n.stroke()}function g_(n="worker"){let e=`character:${n}:v1`;if(Se.has(e))return Se.get(e);let t=br(n),i=document.createElement("canvas");i.width=224,i.height=256;let s=i.getContext("2d");s.clearRect(0,0,i.width,i.height),s.fillStyle="rgba(46, 27, 14, 0.22)",s.beginPath(),s.ellipse(112,222,62,17,0,0,Math.PI*2),s.fill(),n==="hauler"&&(s.fillStyle="#8bb36d",s.strokeStyle=t.stroke,s.lineWidth=7,s.beginPath(),s.roundRect(132,88,48,84,19),s.fill(),s.stroke(),s.fillStyle="#6d8c55",s.fillRect(141,102,29,12)),s.strokeStyle=t.stroke,s.lineWidth=10,s.lineCap="round",s.beginPath(),n==="messenger"?(s.moveTo(151,126),s.lineTo(181,84)):n==="builder"?(s.moveTo(151,128),s.lineTo(180,96)):(s.moveTo(151,130),s.lineTo(174,147)),s.stroke(),Xu(s,n==="messenger"?181:n==="builder"?180:174,n==="messenger"?84:n==="builder"?96:147,t.stroke),n==="builder"?(s.strokeStyle=t.stroke,s.lineWidth=7,s.beginPath(),s.moveTo(170,98),s.lineTo(193,75),s.moveTo(183,71),s.lineTo(204,92),s.stroke()):n==="worker"?(s.strokeStyle=t.stroke,s.lineWidth=6,s.beginPath(),s.moveTo(165,142),s.lineTo(190,126),s.moveTo(184,122),s.lineTo(198,137),s.stroke()):n==="messenger"&&(s.fillStyle=t.accent,s.strokeStyle=t.stroke,s.lineWidth=5,s.beginPath(),s.moveTo(182,72),s.lineTo(205,84),s.lineTo(182,97),s.closePath(),s.fill(),s.stroke()),s.strokeStyle=t.stroke,s.lineWidth=10,s.beginPath(),s.moveTo(73,128),s.lineTo(n==="hauler"?50:44,n==="hauler"?146:116),s.stroke(),Xu(s,n==="hauler"?50:44,n==="hauler"?146:116,t.stroke),s.fillStyle=t.fill,s.strokeStyle=t.stroke,s.lineWidth=10,s.beginPath(),s.roundRect(62,94,100,96,34),s.fill(),s.stroke(),n==="worker"?(s.fillStyle="#fff8e8",s.strokeStyle=t.stroke,s.lineWidth=5,s.beginPath(),s.roundRect(84,116,56,57,13),s.fill(),s.stroke(),s.strokeStyle=t.trim,s.lineWidth=4,s.beginPath(),s.moveTo(94,133),s.lineTo(130,133),s.moveTo(94,149),s.lineTo(122,149),s.stroke()):n==="hauler"?(s.strokeStyle=t.trim,s.lineWidth=7,s.beginPath(),s.moveTo(78,107),s.lineTo(146,178),s.moveTo(146,107),s.lineTo(78,178),s.stroke(),s.fillStyle="#c4883a",s.strokeStyle=t.stroke,s.lineWidth=6,s.beginPath(),s.roundRect(82,134,60,40,10),s.fill(),s.stroke()):n==="messenger"&&(s.fillStyle="#6b4631",s.strokeStyle=t.stroke,s.lineWidth=5,s.beginPath(),s.roundRect(118,142,42,38,9),s.fill(),s.stroke(),s.strokeStyle="#fff0bd",s.lineWidth=5,s.beginPath(),s.moveTo(79,110),s.lineTo(145,172),s.stroke()),s.strokeStyle=t.stroke,s.lineWidth=11,s.beginPath(),s.moveTo(91,184),s.lineTo(82,213),s.moveTo(132,184),s.lineTo(143,213),s.stroke(),s.fillStyle=t.trim,s.strokeStyle=t.stroke,s.lineWidth=5,s.beginPath(),s.roundRect(61,207,38,17,8),s.roundRect(128,207,38,17,8),s.fill(),s.stroke(),s.fillStyle=t.face,s.strokeStyle=t.stroke,s.lineWidth=8,s.beginPath(),s.arc(112,76,45,0,Math.PI*2),s.fill(),s.stroke(),n==="builder"?(s.fillStyle=t.accent,s.strokeStyle=t.stroke,s.lineWidth=7,s.beginPath(),s.arc(112,70,48,Math.PI,Math.PI*2),s.lineTo(160,75),s.lineTo(64,75),s.closePath(),s.fill(),s.stroke(),s.strokeStyle="#f4a92f",s.lineWidth=5,s.beginPath(),s.moveTo(112,27),s.lineTo(112,73),s.moveTo(91,38),s.lineTo(91,73),s.moveTo(133,38),s.lineTo(133,73),s.stroke()):(s.fillStyle=t.trim,s.beginPath(),s.arc(112,45,34,Math.PI,Math.PI*2),s.lineTo(146,63),s.quadraticCurveTo(112,53,78,63),s.closePath(),s.fill(),n==="messenger"&&(s.fillStyle=t.accent,s.beginPath(),s.arc(144,56,12,0,Math.PI*2),s.fill())),s.fillStyle="rgba(200, 92, 117, 0.28)",s.beginPath(),s.arc(82,88,7,0,Math.PI*2),s.arc(142,88,7,0,Math.PI*2),s.fill(),m_(s,112,82,n==="messenger"?"alert":n==="hauler"?"happy":"busy");let r=new yt(i);return r.colorSpace=qe,r.minFilter=we,r.magFilter=we,Se.set(e,r),r}function td(n="",e="neutral"){let t=`text:${e}:${n}`;if(Se.has(t))return Se.get(t);let i=document.createElement("canvas");i.width=384,i.height=96;let s=i.getContext("2d"),r=e==="ready"?"#ffe4a0":e==="selected"?"#d6f1ef":"#fff8e8";s.clearRect(0,0,i.width,i.height),s.fillStyle=r,s.strokeStyle="rgba(46, 27, 14, 0.25)",s.lineWidth=6,s.beginPath(),s.roundRect(10,12,i.width-20,i.height-24,22),s.fill(),s.stroke(),s.fillStyle="#2e1b0e",s.font='700 30px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',s.textAlign="center",s.textBaseline="middle";let a=String(n||"").length>20?`${String(n).slice(0,17)}...`:String(n||"");s.fillText(a,i.width/2,i.height/2+2,i.width-44);let o=new yt(i);return o.colorSpace=qe,o.minFilter=we,o.magFilter=we,Se.set(t,o),o}function nd(n,e,t,i,s){n.beginPath();for(let r=0;r<10;r+=1){let a=r%2===0?i:s,o=-Math.PI/2+r*Math.PI/5,l=e+Math.cos(o)*a,c=t+Math.sin(o)*a;r===0?n.moveTo(l,c):n.lineTo(l,c)}n.closePath()}function __(n="worker",e={}){let t=String(e.accessory||"tools"),i=String(e.actionKind||""),s=`cue:${n}:${t}:${i}`;if(Se.has(s))return Se.get(s);let r=br(n),a=document.createElement("canvas");a.width=160,a.height=160;let o=a.getContext("2d");if(o.clearRect(0,0,a.width,a.height),o.fillStyle="rgba(46, 27, 14, 0.24)",o.beginPath(),o.ellipse(84,126,46,14,0,0,Math.PI*2),o.fill(),o.fillStyle=r.cue,o.strokeStyle=r.stroke,o.lineWidth=8,o.beginPath(),o.roundRect(31,20,98,98,28),o.fill(),o.stroke(),o.strokeStyle=r.stroke,o.fillStyle=r.fill,o.lineCap="round",o.lineJoin="round",o.lineWidth=10,t==="hammer")o.beginPath(),o.moveTo(58,88),o.lineTo(104,42),o.moveTo(85,37),o.lineTo(119,71),o.stroke();else if(t==="wrench")o.beginPath(),o.arc(62,50,18,.2,Math.PI*1.55),o.moveTo(73,65),o.lineTo(108,100),o.stroke();else if(t==="bundle")o.fillStyle="#c4883a",o.strokeStyle=r.stroke,o.lineWidth=7,o.beginPath(),o.roundRect(50,54,60,46,10),o.fill(),o.stroke(),o.beginPath(),o.moveTo(50,78),o.lineTo(110,78),o.moveTo(80,54),o.lineTo(80,100),o.stroke();else if(t==="coin"){o.fillStyle="#d7ae50";for(let c of[92,77,62])o.beginPath(),o.ellipse(80,c,30,10,0,0,Math.PI*2),o.fill(),o.stroke()}else t==="approval"?(o.font='900 46px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',o.textAlign="center",o.textBaseline="middle",o.fillText("OK",80,74)):t==="reward"?(o.fillStyle="#d7ae50",nd(o,80,74,34,15),o.fill(),o.stroke()):t==="quest"?(o.beginPath(),o.moveTo(80,38),o.lineTo(112,74),o.lineTo(80,110),o.lineTo(48,74),o.closePath(),o.fill(),o.stroke()):t==="clover"?(o.font='900 58px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',o.textAlign="center",o.textBaseline="middle",o.fillText("C",80,76)):t==="notice"?(o.font='900 70px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',o.textAlign="center",o.textBaseline="middle",o.fillText("!",80,74)):(o.beginPath(),o.arc(80,74,24,0,Math.PI*2),o.moveTo(48,74),o.lineTo(112,74),o.moveTo(80,42),o.lineTo(80,106),o.stroke());let l=new yt(a);return l.colorSpace=qe,l.minFilter=we,l.magFilter=we,Se.set(s,l),l}function x_(n="worker",e=0){let t=qt(Ae(e,0),0,1),i=Math.round(t*100),s=`progress:${n}:${i}`;if(Se.has(s))return Se.get(s);let r=br(n),a=document.createElement("canvas");a.width=256,a.height=64;let o=a.getContext("2d");o.clearRect(0,0,a.width,a.height),o.fillStyle="rgba(46, 27, 14, 0.40)",o.beginPath(),o.roundRect(18,18,220,28,14),o.fill(),o.fillStyle="#fff8e8",o.beginPath(),o.roundRect(24,23,208,18,9),o.fill(),o.fillStyle=r.fill,o.beginPath(),o.roundRect(24,23,Math.max(12,208*t),18,9),o.fill(),o.strokeStyle=r.stroke,o.lineWidth=5,o.beginPath(),o.roundRect(18,18,220,28,14),o.stroke();let l=new yt(a);return l.colorSpace=qe,l.minFilter=we,l.magFilter=we,Se.set(s,l),l}function y_(n={}){let e=String(n.cueType||"crossing_greeting"),t=Array.isArray(n.roles)?n.roles:[],i=`encounter:${e}:${t.join("+")}`;if(Se.has(i))return Se.get(i);let s=document.createElement("canvas");s.width=192,s.height=160;let r=s.getContext("2d");r.clearRect(0,0,s.width,s.height),r.fillStyle="rgba(46, 27, 14, 0.22)",r.beginPath(),r.ellipse(96,126,52,14,0,0,Math.PI*2),r.fill(),r.fillStyle=e==="handoff"?"#fff0bd":"#d6f1ef",r.strokeStyle="#3b2513",r.lineWidth=7,r.beginPath(),r.roundRect(36,22,120,84,28),r.fill(),r.stroke();let a=br(t[0]||"worker"),o=br(t[1]||"messenger");r.fillStyle=a.fill,r.strokeStyle=a.stroke,r.lineWidth=5,r.beginPath(),r.arc(78,64,20,0,Math.PI*2),r.fill(),r.stroke(),r.fillStyle=o.fill,r.strokeStyle=o.stroke,r.beginPath(),r.arc(116,64,20,0,Math.PI*2),r.fill(),r.stroke(),r.strokeStyle="#3b2513",r.lineWidth=6,r.lineCap="round",r.beginPath(),r.moveTo(91,82),r.lineTo(103,82),r.stroke(),r.fillStyle=e==="handoff"?"#c4883a":"#c85c75",nd(r,97,38,13,6),r.fill(),r.stroke();let l=new yt(s);return l.colorSpace=qe,l.minFilter=we,l.magFilter=we,Se.set(i,l),l}function Go(n){let e=n?.image||null;return!!e&&e.complete!==!1}function qu(n,e,t){let i=String(n||"").trim();if(!i)return null;if(Se.has(i)){let r=Se.get(i);return typeof e=="function"&&(Go(r)?queueMicrotask(()=>e(r)):r.userData.pendingOnLoad=[...r.userData.pendingOnLoad||[],e]),typeof t=="function"&&!Go(r)&&(r.userData.pendingOnError=[...r.userData.pendingOnError||[],t]),r}let s=new lr().load(i,()=>{s.colorSpace=qe,s.minFilter=pn,s.magFilter=we;let r=s.userData.pendingOnLoad||[];s.userData.pendingOnLoad=[],s.userData.pendingOnError=[];for(let a of r)a(s)},void 0,()=>{let r=s.userData.pendingOnError||[];Se.delete(i);for(let a of r)a()});return s.colorSpace=qe,s.userData.pendingOnLoad=typeof e=="function"?[e]:[],s.userData.pendingOnError=typeof t=="function"?[t]:[],Se.set(i,s),s}function v_(n=null){if(!n||typeof n!="object")return null;let e=qt(Math.round(Ae(n.columns,1)),1,32),t=qt(Math.round(Ae(n.rows,1)),1,32),i=qt(Math.round(Ae(n.row,0)),0,t-1),r=(Array.isArray(n.frames)?n.frames:[0]).map(a=>qt(Math.round(Ae(a,0)),0,e-1)).filter((a,o,l)=>l.indexOf(a)===o);return{id:String(n.id||""),metadataSrc:String(n.metadataSrc||""),action:String(n.action||""),columns:e,rows:t,row:i,frames:r.length>0?r:[0],fps:qt(Ae(n.fps,4),1,12),frameWidth:Ae(n.frameWidth,1),frameHeight:Ae(n.frameHeight,1)}}function id(n,e,t){if(!n||!e)return;let i=qt(Math.round(Ae(t,0)),0,e.columns-1);n.repeat.set(1/e.columns,1/e.rows),n.offset.set(i/e.columns,1-(e.row+1)/e.rows),Go(n)&&(n.needsUpdate=!0)}function S_(n){let e=new It;return e.source=n.source,e.mapping=n.mapping,e.channel=n.channel,e.wrapS=n.wrapS,e.wrapT=n.wrapT,e.generateMipmaps=n.generateMipmaps,e.premultiplyAlpha=n.premultiplyAlpha,e.flipY=n.flipY,e.unpackAlignment=n.unpackAlignment,e}function M_(n={},e){let t=v_(n.assetSprite);if(!t||!e)return{texture:e,sheet:null};let i=Go(e)?e.clone():S_(e);return i.colorSpace=qe,i.minFilter=pn,i.magFilter=we,i.userData={spriteSheetClone:!0},id(i,t,t.frames[0]),{texture:i,sheet:t}}function b_(n={}){return n.kind==="actor"?n.canonicalRoleId==="clover"?1.35:1.22:n.kind==="pad"?1.05:n.buildingType==="HQ"?2.15*Ae(n.scale,1):1.55*Ae(n.scale,1)}function T_(n={},e,t=0){let i=M_(n,e),s=i.sheet,r=new Pt({map:i.texture,transparent:!0,depthTest:!0,depthWrite:!1,alphaTest:.04}),a=new Lt(r),o=s?.frameWidth&&s?.frameHeight?{width:s.frameWidth,height:s.frameHeight}:i.texture?.image||null,l=o&&o.width&&o.height?o.width/o.height:1,c=b_(n);return a.position.set(Er(n.x),wr(n.y),ed(n,t)),a.scale.set(c*qt(l,.62,1.75),c,1),a.userData=Tr(n,{sprite:!0,baseX:a.position.x,baseY:a.position.y,baseScaleX:a.scale.x,baseScaleY:a.scale.y,baseRotation:a.material.rotation||0,phase:Vo(n.actionAnimation?.phaseSeed||n.actorId||n.id),spriteSheet:!!s,spriteSheetId:s?.id||"",spriteSheetAction:s?.action||"",spriteSheetMetadataSrc:s?.metadataSrc||"",spriteSheetColumns:s?.columns||0,spriteSheetRows:s?.rows||0,spriteSheetRow:s?.row??-1,spriteSheetFrames:s?.frames||[],spriteSheetFps:s?.fps||0}),a}function Tr(n={},e={}){return{objectId:String(n.id||""),kind:String(n.kind||""),label:String(n.label||""),selectionKey:String(n.selectionKey||""),drawerKey:String(n.drawerKey||""),testId:String(n.testId||""),state:String(n.state||""),visualOnly:n.visualOnly===!0,actorId:String(n.actorId||""),canonicalRoleId:String(n.canonicalRoleId||""),generatedOverlayRoleId:String(n.generatedOverlayRoleId||""),sourceDomain:String(n.sourceDomain||""),sourceObjectId:String(n.sourceObjectId||""),sourceStateHash:String(n.sourceStateHash||""),visualState:String(n.visualState||""),assetSrc:String(n.assetSrc||""),assetSprite:n.assetSprite||null,actionKind:String(n.actionKind||""),actionCueType:String(n.actionCue?.cueType||""),actionCueAccessory:String(n.actionCue?.accessory||""),animationMode:String(n.actionAnimation?.mode||""),animationTempo:Ae(n.actionAnimation?.tempo,1),animationStepStyle:String(n.actionAnimation?.stepStyle||""),hasWalkOffset:n.actionAnimation?.hasWalkOffset===!0,progress:Ae(n.progress,0),routeId:String(n.route?.routeId||""),wayId:String(n.route?.wayId||""),routeMode:String(n.route?.mode||""),routeProgress:Ae(n.route?.progress,0),routeTargetId:String(n.route?.targetId||""),validPlacement:n.validPlacement===!0,x:Ae(n.x,.5),y:Ae(n.y,.5),...e}}function E_(n={},e){let t=Math.max(1.05,e.scale.x*1.04),i=Math.max(1.05,e.scale.y*1.12),s=new ht(new en(t,i),new Dt({color:16777215,transparent:!0,opacity:.001,depthWrite:!1}));return s.position.copy(e.position),s.position.z+=.1,s.userData=Tr(n,{hitTarget:!0}),s}function w_(n={},e){if(n.kind==="actor")return null;let t=String(n.state||""),i=n.selected?"selected":t==="OUTPUT_READY"?"ready":"neutral",s=td(n.label||n.id,i),r=new Lt(new Pt({map:s,transparent:!0,depthTest:!0,depthWrite:!1,alphaTest:.03}));return r.position.set(e.position.x,e.position.y-e.scale.y*.58,e.position.z+.18),r.scale.set(1.55,.39,1),r.userData=Tr(n,{labelSprite:!0}),r}function A_(n={},e){if(n.kind!=="actor"||!n.actionCue)return[];let t=String(n.canonicalRoleId||"worker"),i=n.actionCue||{},s=[],r=new Lt(new Pt({map:__(t,i),transparent:!0,depthTest:!0,depthWrite:!1,alphaTest:.03})),a=t==="hauler"?.52:t==="messenger"?.38:.44,o=t==="hauler"?-.08:e.scale.y*.52;if(r.position.set(e.position.x+a,e.position.y+o,e.position.z+.22),r.scale.set(t==="messenger"?.62:.54,t==="messenger"?.62:.54,1),r.userData=Tr(n,{actionCueSprite:!0,actionCueType:String(i.cueType||""),actionCueAccessory:String(i.accessory||""),baseX:r.position.x,baseY:r.position.y,baseScaleX:r.scale.x,baseScaleY:r.scale.y,baseRotation:r.material.rotation||0,phase:Vo(n.actionAnimation?.phaseSeed||n.actorId||n.id)}),s.push(r),t==="builder"||t==="worker"){let l=new Lt(new Pt({map:x_(t,i.progress),transparent:!0,depthTest:!0,depthWrite:!1,alphaTest:.03}));l.position.set(e.position.x,e.position.y-e.scale.y*.62,e.position.z+.24),l.scale.set(1.15,.29,1),l.userData=Tr(n,{actionCueSprite:!0,progressSprite:!0,actionCueType:String(i.cueType||""),actionCueAccessory:"progress",baseX:l.position.x,baseY:l.position.y,baseScaleX:l.scale.x,baseScaleY:l.scale.y,baseRotation:l.material.rotation||0,phase:Vo(n.actionAnimation?.phaseSeed||n.actorId||n.id)}),s.push(l)}return s}function C_(n={}){return n.selected?6262158:n.buildable?8362854:n.occupied?12879930:10319192}function R_(n={}){let e={x:qt((Ae(n.x)+.5)/3,.08,.92),y:qt((Ae(n.y)+.5)/3,.1,.9)},t=new ht(new en(3.55,1.78),new Dt({color:C_(n),transparent:!0,opacity:n.selected?.34:n.buildable?.18:.1,depthWrite:!1,side:Bt}));return t.position.set(Er(e.x),wr(e.y),-2.1),t.userData={objectId:String(n.id||""),kind:"grid_cell",selectionKey:String(n.selectionKey||""),buildable:n.buildable===!0,occupied:n.occupied===!0,hitTarget:!0},t}function I_(n={}){let e=Array.isArray(n.points)?n.points:[],t=e.length>=2?e.map(r=>bc(r,-1.72)):[bc({x:.5,y:.5},-1.72),bc({x:.55,y:.55},-1.72)],i=new ms(t,!1,"centripetal",.4),s=new ht(new ar(i,18,.055,7,!1),new Dt({color:7161893,transparent:!0,opacity:.62,depthWrite:!1}));return s.userData={kind:"way",wayLine:!0,wayId:String(n.wayId||""),label:String(n.label||""),targetId:String(n.targetId||""),visualOnly:n.visualOnly===!0,points:e},s}function P_(n={}){let e=new Lt(new Pt({map:y_(n),transparent:!0,depthTest:!0,depthWrite:!1,alphaTest:.03}));return e.position.set(Er(n.x),wr(n.y)+.46,2.25),e.scale.set(.68,.56,1),e.userData={kind:"encounter",encounterSprite:!0,encounterId:String(n.encounterId||""),targetId:String(n.targetId||""),cueType:String(n.cueType||""),label:String(n.label||""),roles:Array.isArray(n.roles)?n.roles:[],actorIds:Array.isArray(n.actorIds)?n.actorIds:[],visualOnly:n.visualOnly===!0,baseX:e.position.x,baseY:e.position.y,baseScaleX:e.scale.x,baseScaleY:e.scale.y,phase:Vo(n.encounterId||n.targetId||"")},e}function D_(n,e="three-raycast"){let t=n?.userData||{};return{objectId:String(t.objectId||""),kind:String(t.kind||""),label:String(t.label||""),selectionKey:String(t.selectionKey||""),drawerKey:String(t.drawerKey||""),testId:String(t.testId||""),visualOnly:t.visualOnly===!0,actorId:String(t.actorId||""),canonicalRoleId:String(t.canonicalRoleId||""),generatedOverlayRoleId:String(t.generatedOverlayRoleId||""),sourceDomain:String(t.sourceDomain||""),sourceObjectId:String(t.sourceObjectId||""),sourceStateHash:String(t.sourceStateHash||""),visualState:String(t.visualState||""),actionKind:String(t.actionKind||""),actionCueType:String(t.actionCueType||""),actionCueAccessory:String(t.actionCueAccessory||""),animationMode:String(t.animationMode||""),animationStepStyle:String(t.animationStepStyle||""),progress:Ae(t.progress,0),routeId:String(t.routeId||""),wayId:String(t.wayId||""),routeMode:String(t.routeMode||""),routeProgress:Ae(t.routeProgress,0),routeTargetId:String(t.routeTargetId||""),validPlacement:t.validPlacement===!0,source:e,atMs:Date.now()}}var wc=class{constructor(e){this.stageNode=e,this.viewport=null,this.scenePayload=null,this.pickables=[],this.objectMeshes=[],this.info={},this.scene=new hs,this.camera=new fi(xi/-2,xi/2,yi/2,yi/-2,.1,100),this.camera.position.set(0,0,12),this.camera.lookAt(0,0,0),this.raycaster=new vs,this.pointer=new ge,this.renderer=new Mr({antialias:!0,alpha:!1,preserveDrawingBuffer:!0}),this.renderer.setClearColor(16046248,1),this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),this.renderer.domElement.className="fp-three-canvas",this.renderer.domElement.dataset.testid="founders-three-canvas",this.renderer.domElement.setAttribute("aria-label","Founders Plot Three.js scene"),this.onClick=this.onClick.bind(this),this.onResize=this.onResize.bind(this),this.animate=this.animate.bind(this),this.running=!0,this.reducedMotion=typeof window.matchMedia=="function"?window.matchMedia("(prefers-reduced-motion: reduce)").matches:!1,this.resizeObserver=new ResizeObserver(this.onResize),requestAnimationFrame(this.animate)}attach(e){e instanceof HTMLElement&&(this.viewport=e,this.renderer.domElement.parentElement!==e&&e.appendChild(this.renderer.domElement),this.stageNode.addEventListener("click",this.onClick,!0),this.resizeObserver.observe(e),this.onResize())}dispose(){this.running=!1,this.stageNode.removeEventListener("click",this.onClick,!0),this.resizeObserver.disconnect(),this.clearScene(),this.renderer.dispose(),this.renderer.domElement.remove()}clearScene(){this.scene.children.slice().forEach(t=>{this.scene.remove(t),t.traverse(i=>{if(i.geometry&&i.geometry.dispose(),i.material){let s=Array.isArray(i.material)?i.material:[i.material];for(let r of s)r.map?.userData?.spriteSheetClone&&r.map.dispose(),r.dispose()}})}),this.pickables=[],this.objectMeshes=[]}onResize(){let e=(this.viewport||this.stageNode).getBoundingClientRect(),t=Math.max(1,Math.floor(e.width)),i=Math.max(1,Math.floor(e.height));this.renderer.setSize(t,i,!1);let s=t/i,r=xi/yi;if(s>=r){let a=yi*s;this.camera.left=a/-2,this.camera.right=a/2,this.camera.top=yi/2,this.camera.bottom=yi/-2}else{let a=xi/s;this.camera.left=xi/-2,this.camera.right=xi/2,this.camera.top=a/2,this.camera.bottom=a/-2}this.camera.updateProjectionMatrix(),this.render()}sync(e={}){this.scenePayload=e,this.rebuild(),this.render()}rebuild(){this.clearScene();let e=this.scenePayload||{},t=window.innerWidth<=560?e.stageBackgrounds?.mobile:e.stageBackgrounds?.desktop,i=qu(t,()=>this.render()),s=new ht(new en(xi,yi),new Dt({map:i||td("Founders Plot")}));s.position.set(0,0,-4),this.scene.add(s);for(let r of e.grid?.cells||[]){let a=R_(r);this.scene.add(a),this.pickables.push(a)}for(let r of e.ways||[]){let a=I_(r);this.scene.add(a),this.objectMeshes.push(a)}for(let r of e.objects||[]){let a=r.canonicalRoleId||r.kind,o=g_(a||"worker"),l=null,c=r.assetSrc?qu(r.assetSrc,()=>this.render(),()=>{l?.material&&(l.material.map?.userData?.spriteSheetClone&&l.material.map.dispose(),l.material.map=o,l.material.needsUpdate=!0,l.userData.assetFallback=!0,l.userData.spriteSheet=!1,this.render())}):o;l=T_(r,c||o,r.kind==="actor"?.8:0),this.scene.add(l),this.objectMeshes.push(l);let h=E_(r,l);this.scene.add(h),this.pickables.push(h);let d=w_(r,l);d&&this.scene.add(d);for(let u of A_(r,l))this.scene.add(u),this.objectMeshes.push(u)}for(let r of e.encounters||[]){let a=P_(r);this.scene.add(a),this.objectMeshes.push(a)}this.updateInfo()}pickFromEvent(e){let t=this.renderer.domElement.getBoundingClientRect();return this.pointer.x=(e.clientX-t.left)/t.width*2-1,this.pointer.y=-((e.clientY-t.top)/t.height)*2+1,this.raycaster.setFromCamera(this.pointer,this.camera),this.raycaster.intersectObjects(this.pickables,!1)[0]?.object||null}onClick(e){if(e.target instanceof Element&&e.target.closest(".fp-tile"))return;let t=this.pickFromEvent(e);if(!t)return;let i=D_(t);i.visualOnly&&(e.preventDefault(),e.stopPropagation()),window.dispatchEvent(new CustomEvent("founders-plot-scene-pick",{detail:i}))}canvasPointFor(e){let t=new C(Er(e.x),wr(e.y),ed(e,e.kind==="actor"?.8:0));t.project(this.camera);let i=this.renderer.domElement.getBoundingClientRect();return{x:(t.x+1)/2*i.width,y:(-t.y+1)/2*i.height}}updateInfo(){let e=this.scenePayload||{},t=this.renderer.domElement,i=Array.isArray(e.objects)?e.objects:[];return this.info={renderer:"three.js",stateHash:String(e.stateHash||""),canvasWidth:t.width,canvasHeight:t.height,objectCount:i.length,objectIds:i.map(s=>s.id),ways:(e.ways||[]).map(s=>({wayId:s.wayId||"",targetId:s.targetId||"",label:s.label||"",points:s.points||[],visualOnly:s.visualOnly===!0})),encounters:(e.encounters||[]).map(s=>({encounterId:s.encounterId||"",targetId:s.targetId||"",roles:s.roles||[],actorIds:s.actorIds||[],cueType:s.cueType||"",visualOnly:s.visualOnly===!0,canvas:this.canvasPointFor({x:s.x,y:s.y,z:0,kind:"encounter"})})),actorIds:(e.actors||[]).map(s=>s.actorId),actors:(e.actors||[]).map(s=>({...s,canvas:this.canvasPointFor(i.find(r=>r.actorId===s.actorId||r.id===s.id)||{})})),actionCues:(e.actors||[]).map(s=>({actorId:s.actorId,canonicalRoleId:s.canonicalRoleId,sourceDomain:s.sourceDomain,sourceObjectId:s.sourceObjectId,actionKind:s.actionKind||"",cueType:s.actionCue?.cueType||"",accessory:s.actionCue?.accessory||"",progress:Ae(s.actionCue?.progress,s.progress||0)})),roles:(e.actors||[]).map(s=>s.canonicalRoleId),renderedActors:this.objectMeshes.filter(s=>s.userData?.kind==="actor"&&s.userData?.sprite===!0).map(s=>({actorId:s.userData.actorId||"",canonicalRoleId:s.userData.canonicalRoleId||"",assetSrc:s.userData.assetSrc||"",spriteSheet:s.userData.spriteSheet===!0,spriteSheetId:s.userData.spriteSheetId||"",spriteSheetAction:s.userData.spriteSheetAction||"",routeId:s.userData.routeId||"",wayId:s.userData.wayId||"",routeProgress:Ae(s.userData.routeProgress,0),assetFallback:s.userData.assetFallback===!0})),renderedWays:this.objectMeshes.filter(s=>s.userData?.wayLine===!0).map(s=>({wayId:s.userData.wayId||"",targetId:s.userData.targetId||"",visualOnly:s.userData.visualOnly===!0})),renderedEncounters:this.objectMeshes.filter(s=>s.userData?.encounterSprite===!0).map(s=>({encounterId:s.userData.encounterId||"",targetId:s.userData.targetId||"",cueType:s.userData.cueType||"",roles:s.userData.roles||[],visualOnly:s.userData.visualOnly===!0})),pickTargets:i.map(s=>({objectId:s.id,kind:s.kind,label:s.label,selectionKey:s.selectionKey,drawerKey:s.drawerKey,testId:s.testId,visualOnly:s.visualOnly===!0,actorId:s.actorId||"",canonicalRoleId:s.canonicalRoleId||"",sourceDomain:s.sourceDomain||"",sourceObjectId:s.sourceObjectId||"",sourceStateHash:s.sourceStateHash||"",visualState:s.visualState||"",assetSrc:s.assetSrc||"",assetSprite:s.assetSprite||null,actionKind:s.actionKind||"",route:s.route||null,actionCue:s.actionCue||null,actionAnimation:s.actionAnimation||null,canvas:this.canvasPointFor(s)}))},this.info}animate(e=0){if(this.running){for(let t of this.objectMeshes){let i=t.userData||{},s=Ae(i.baseX,t.position.x),r=Ae(i.baseY,t.position.y),a=Ae(i.baseScaleX,t.scale.x),o=Ae(i.baseScaleY,t.scale.y),l=Ae(i.baseRotation,0);if(i.kind==="actor"){if(i.spriteSheet&&t.material?.map){let M=Array.isArray(i.spriteSheetFrames)&&i.spriteSheetFrames.length>0?i.spriteSheetFrames:[0],b=Ae(i.spriteSheetFps,4),A=M[Math.floor(e/1e3*b+Ae(i.phase,0))%M.length];id(t.material.map,{columns:Ae(i.spriteSheetColumns,1),rows:Ae(i.spriteSheetRows,1),row:Ae(i.spriteSheetRow,0)},A)}if(this.reducedMotion){t.position.x=s,t.position.y=r,t.scale.set(a,o,1),t.material&&(t.material.rotation=l);continue}let c=Ae(i.phase,0),h=Ae(i.animationTempo,1),d=e/360*h+c,u=i.hasWalkOffset?Math.sin(e/170+c):0,f=Math.abs(u)*.018,g=s,S=r+Math.sin(d)*.024+f,p=a,m=o,x=l;i.animationMode==="work_swing"?(x+=Math.sin(e/120+c)*.075,S+=Math.max(0,Math.sin(e/155+c))*.035,m*=1+Math.sin(e/155+c)*.018):i.animationMode==="busy_work"?(g+=Math.sin(e/135+c)*.018,S+=Math.sin(e/95+c)*.012,p*=1+Math.sin(e/135+c)*.012):i.animationMode==="carry_wobble"?(g+=Math.sin(e/210+c)*.025,x+=Math.sin(e/180+c)*.055,m*=1+Math.abs(Math.sin(e/180+c))*.018):i.animationMode==="attention_wave"&&(S+=Math.abs(Math.sin(e/150+c))*.05,x+=Math.sin(e/125+c)*.045,p*=1+Math.sin(e/150+c)*.012),t.position.x=g,t.position.y=S,t.scale.set(p,m,1),t.material&&(t.material.rotation=x)}else if(i.actionCueSprite&&!i.progressSprite){if(this.reducedMotion){t.position.x=s,t.position.y=r,t.material&&(t.material.rotation=l);continue}let c=Ae(i.phase,0);t.position.y=r+Math.sin(e/240+c)*.025,i.actionCueAccessory==="hammer"||i.actionCueAccessory==="wrench"?t.material.rotation=l+Math.sin(e/135+c)*.1:(i.actionCueAccessory==="notice"||i.actionCueAccessory==="approval"||i.actionCueAccessory==="quest")&&(t.material.rotation=l+Math.sin(e/180+c)*.07)}}this.render(),requestAnimationFrame(this.animate)}}render(){this.updateInfo(),this.renderer.render(this.scene,this.camera)}},Yn=13.6,$n=8.2,Ui=.86,xn=Ui*1.64,Vt="hq14t_server_bound_terrain_underlay_v1",Yu="hq14s_public_terrain_underlay_v1",sd="/experiences/founders-plot/assets/expedition-map",vi=`${sd}/hq14s-public-terrain-underlay-v1`,L_="hq15e_expedition_unit_marker_sprites_v1",Ln=`${sd}/hq15e-expedition-unit-marker-sprites-v1`,Ac="agenttown_public_terrain_asset_slots_v1",Cc="server_read_model_v1",F_=Object.freeze(["field","forest","ridge","settled"]),rd=Object.freeze({slot:"public_terrain_underlay",path:`${vi}/public-terrain-underlay-candidate-01-v1.png`,assetKind:"visual_underlay"}),$u=Object.freeze({field:{slot:"field",path:`${vi}/field-v1.png`,assetKind:"concrete_public_terrain"},settled:{slot:"settled",path:`${vi}/settled-v1.png`,assetKind:"concrete_public_terrain"},forest:{slot:"forest",path:`${vi}/forest-v1.png`,assetKind:"concrete_public_terrain"},ridge:{slot:"ridge",path:`${vi}/ridge-v1.png`,assetKind:"concrete_public_terrain"},hinted:{slot:"hinted_frontier_fog",path:`${vi}/hinted-frontier-fog-v1.png`,assetKind:"fog_only",fogOnly:!0},locked_unknown:{slot:"locked_unknown_fog",path:`${vi}/locked-unknown-fog-v1.png`,assetKind:"fog_only",fogOnly:!0}}),ad=Object.freeze({scout:{slot:"scout",path:`${Ln}/scout-pathfinder-v1.png`,assetKind:"generated_unit_sprite"},settler_convoy:{slot:"settler_convoy",path:`${Ln}/settler-convoy-v1.png`,assetKind:"generated_unit_sprite"},surveyor:{slot:"surveyor",path:`${Ln}/surveyor-beacon-v1.png`,assetKind:"generated_unit_sprite"},courier:{slot:"courier",path:`${Ln}/courier-signal-runner-v1.png`,assetKind:"generated_unit_sprite"},outpost_crew:{slot:"outpost_crew",path:`${Ln}/outpost-crew-v1.png`,assetKind:"generated_unit_sprite"},field_support:{slot:"surveyor",path:`${Ln}/surveyor-beacon-v1.png`,assetKind:"generated_unit_sprite"}}),Ni=Object.freeze({objective_beacon:{slot:"objective_beacon",path:`${Ln}/objective-beacon-v1.png`,assetKind:"generated_marker_sprite"},event_packet:{slot:"event_packet",path:`${Ln}/event-packet-v1.png`,assetKind:"generated_marker_sprite"},receipt_ledger:{slot:"receipt_ledger",path:`${Ln}/receipt-ledger-v1.png`,assetKind:"generated_marker_sprite"}}),Rc=new Map,Ic=new Set;function Zn(n,e=1){let t=Number(n||0),i=t>>16&255,s=t>>8&255,r=t&255;return`rgba(${i}, ${s}, ${r}, ${e})`}function N_(n=""){let e=String(n||""),t=2166136261;for(let i=0;i<e.length;i+=1)t^=e.charCodeAt(i),t=Math.imul(t,16777619);return t>>>0}function Wo(n=""){return N_(n)%1e4/1e4}function Zu(n={}){let e=Ae(n.q,0),t=Ae(n.r,0);return{x:e+t*.5,y:-t*.86}}function od(n=[]){let e=n.map(p=>Zu(p));e.length||e.push({x:0,y:0});let t=Math.min(...e.map(p=>p.x),0),i=Math.max(...e.map(p=>p.x),0),s=Math.min(...e.map(p=>p.y),0),r=Math.max(...e.map(p=>p.y),0),a=Math.max(1,i-t),o=Math.max(1,r-s),l=Math.min((Yn-2.4)/a,($n-1.8)/o,1.62),c=(t+i)/2,h=(s+r)/2,d=new Map,u=1/0,f=-1/0,g=1/0,S=-1/0;for(let p of n){let m=Zu(p),x={x:(m.x-c)*l,y:(m.y-h)*l};d.set(String(p.cellId||""),x),u=Math.min(u,x.x-xn),f=Math.max(f,x.x+xn),g=Math.min(g,x.y-xn),S=Math.max(S,x.y+xn)}return Number.isFinite(u)||(u=-1,f=1,g=-1,S=1),{positions:d,bounds:{minX:u,maxX:f,minY:g,maxY:S,centerX:(u+f)/2,centerY:(g+S)/2,width:Math.max(1,f-u),height:Math.max(1,S-g)}}}function Fc(n={},e=!1){let t=String(n.fogState||"locked_unknown");return e?{fill:14676452,line:1462092,rim:16110724,shadow:1457209,opacity:.98,lineOpacity:.98,labelTone:"selected",fogOverlay:15727092}:t==="discovered"?{fill:11192718,line:2976326,rim:15784338,shadow:2969391,opacity:.98,lineOpacity:.9,labelTone:"ready",fogOverlay:15070932}:t==="known"?{fill:4038555,line:1399381,rim:12251373,shadow:1194808,opacity:.96,lineOpacity:.86,labelTone:"selected",fogOverlay:11923949}:t==="hinted"?{fill:15047477,line:7159574,rim:16767096,shadow:8078611,opacity:.92,lineOpacity:.84,labelTone:"neutral",fogOverlay:15971400}:{fill:10130564,line:6116938,rim:14141352,shadow:5393218,opacity:.54,lineOpacity:.46,labelTone:"neutral",fogOverlay:13155498}}function _n(n=Ui){let e=[];for(let t=0;t<6;t+=1){let i=Math.PI/6+t*Math.PI/3;e.push(new C(Math.cos(i)*n,Math.sin(i)*n,0))}return e.push(e[0].clone()),e}function Ju(n=Ui){let e=new gs;return _n(n).forEach((t,i)=>{i===0?e.moveTo(t.x,t.y):e.lineTo(t.x,t.y)}),new rr(e)}function Ku(n=Ui){let e=_n(n).slice(0,6),t=[0,0,0],i=[.5,.5];for(let a of e)t.push(a.x,a.y,0),i.push(.5+a.x/(n*2),.5-a.y/(n*2));let s=[];for(let a=1;a<=e.length;a+=1)s.push(0,a,a===e.length?1:a+1);let r=new ot;return r.setAttribute("position",new mt(t,3)),r.setAttribute("uv",new mt(i,2)),r.setIndex(s),r.computeVertexNormals(),r}function U_(n={}){let e=String(n.status||""),t=String(n.kind||""),i=String(n.fogState||"");return e.includes("OUTPOST")||t.includes("outpost")?"OUT":t==="origin_plot"?"HQ":e.includes("SITE_PLAN")?"PLAN":e.includes("SCOUT")?"SITE":i==="hinted"?"...":i==="locked_unknown"?"?":"MAP"}function O_(n="",e=!1,t=!1){return e?.72:t?.62:n==="locked_unknown"?.26:n==="hinted"?.46:.58}function B_(n={},e="",t=!1,i=!1){let s=Ae(n.opacity,.72);return t?Math.min(.82,s*.88):i?Math.min(.72,s*.76):e==="locked_unknown"?Math.min(.34,s*.58):e==="hinted"?Math.min(.52,s*.62):Math.min(.58,s*.66)}function k_(n="",e=!1,t=!1){return e?.7:t?.42:n==="locked_unknown"?.08:n==="hinted"?.16:.18}function z_(n={},e="",t=!1,i=!1){return t?Math.max(.58,Ae(n.lineOpacity,.58)):i?.38:e==="locked_unknown"?.14:e==="hinted"?.2:.22}function H_(n={}){let e=String(n.siteType||"").toLowerCase(),t=Array.isArray(n.traits)?n.traits.map(r=>String(r||"").toLowerCase()):[],i=String(n.kind||"").toLowerCase(),s=String(n.status||"").toLowerCase();return`${e} ${i} ${s} ${t.join(" ")}`}function Si(n={}){return["discovered","known"].includes(String(n.fogState||"locked_unknown"))}function Ar(n={}){if(!Si(n))return null;let e=String(n.publicTerrainAssetSlot||"");return F_.includes(e)?e:null}function Nc(n={}){let e=String(n.fogState||"locked_unknown"),t=String(n.fogAssetSlot||"");return e==="hinted"&&t==="hinted_frontier_fog"||e==="locked_unknown"&&t==="locked_unknown_fog"?t:e==="hinted"?"hinted_frontier_fog":"locked_unknown_fog"}function Jn(n={}){let e=String(n.fogState||"locked_unknown");return Si(n)?Ar(n)||"field":e}function V_(n={},e=null){return!Si(n)||!e?.slot?!1:e.slot===Ar(n)}function Uc(n={},e=Jn(n)){let t=String(n.fogState||"locked_unknown");if(!Si(n)){let s=$u[t]||null;return s&&s.slot===Nc(n)?s:null}let i=$u[Ar(n)||e]||null;return i&&V_(n,i)?i:null}function G_(n={},e=Jn(n),t=Uc(n,e)){let i=String(n.fogState||"locked_unknown");return t?Si(n)?t.fogOnly!==!0&&t.assetKind==="concrete_public_terrain"&&t.slot===Ar(n)&&String(n.terrainAssetContractVersion||"")===Ac&&String(n.publicTerrainAssetSlotSource||"")===Cc:t.fogOnly===!0&&t.assetKind==="fog_only"&&t.slot===Nc(n):e==="field"}function ju(){for(let n of Ic)n()}function W_(n){return typeof n!="function"?()=>{}:(Ic.add(n),()=>Ic.delete(n))}function As(n=null){if(!n?.path)return null;let e=Rc.get(n.path);return!e||e.dataset?.loadFailed==="true"?null:e.complete&&e.naturalWidth>0?e:null}function qo(n=null){if(!n?.path||typeof Image>"u")return null;if(Rc.get(n.path))return As(n);let t=new Image;return t.decoding="async",t.onload=()=>ju(),t.onerror=()=>{t.dataset.loadFailed="true",ju()},Rc.set(n.path,t),t.src=n.path,As(n)}function ld(n={}){return ad[String(n.unitType||"")]||null}function Oc(n,e=null,t=0,i=0,s=128,r=128,a=22){let o=qo(e);return o?(n.save(),n.beginPath(),n.roundRect(t,i,s,r,a),n.clip(),n.drawImage(o,t,i,s,r),n.restore(),!0):!1}function cd(n,e=120,t=128){n.beginPath(),_n(e).forEach((i,s)=>{let r=t+i.x,a=t+i.y;s===0?n.moveTo(r,a):n.lineTo(r,a)}),n.closePath()}function X_(n,e,t,i=1,s="rgba(35, 104, 68, 0.62)"){n.fillStyle="rgba(46, 27, 14, 0.18)",n.beginPath(),n.ellipse(e+7*i,t+12*i,13*i,4*i,0,0,Math.PI*2),n.fill(),n.fillStyle="rgba(80, 55, 29, 0.58)",n.fillRect(e-2*i,t+4*i,4*i,14*i),n.fillStyle=s;for(let r=0;r<3;r+=1){let a=t-18*i+r*12*i,o=(18-r*2)*i;n.beginPath(),n.moveTo(e,a),n.lineTo(e-o,a+24*i),n.lineTo(e+o,a+24*i),n.closePath(),n.fill()}}function Tc(n,e,t,i=1,s="rgba(255, 248, 232, 0.78)"){n.fillStyle="rgba(46, 27, 14, 0.18)",n.beginPath(),n.ellipse(e+8*i,t+24*i,24*i,7*i,0,0,Math.PI*2),n.fill(),n.fillStyle=s,n.strokeStyle="rgba(46, 27, 14, 0.38)",n.lineWidth=4*i,n.beginPath(),n.roundRect(e-18*i,t,36*i,26*i,5*i),n.fill(),n.stroke(),n.fillStyle="rgba(151, 86, 44, 0.82)",n.beginPath(),n.moveTo(e-22*i,t+4*i),n.lineTo(e,t-17*i),n.lineTo(e+23*i,t+4*i),n.closePath(),n.fill(),n.stroke()}function Xo(n,e,t,i=1,s="rgba(27, 106, 100, 0.72)"){n.strokeStyle="rgba(46, 27, 14, 0.42)",n.lineWidth=4*i,n.lineCap="round",n.beginPath(),n.moveTo(e,t+22*i),n.lineTo(e,t-28*i),n.stroke(),n.fillStyle=s,n.beginPath(),n.moveTo(e+3*i,t-25*i),n.lineTo(e+30*i,t-17*i),n.lineTo(e+3*i,t-6*i),n.closePath(),n.fill(),n.strokeStyle="rgba(255, 248, 232, 0.52)",n.lineWidth=2*i;for(let r=0;r<3;r+=1)n.beginPath(),n.arc(e,t-21*i,(15+r*12)*i,-.72,.34),n.stroke()}function Pc(n,e,t,i=92,s=.22){n.save(),n.strokeStyle=`rgba(46, 27, 14, ${s})`,n.lineWidth=3,n.lineCap="round",n.beginPath(),n.moveTo(e,t),n.bezierCurveTo(e+i*.25,t-7,e+i*.62,t+8,e+i,t-2),n.stroke(),n.strokeStyle=`rgba(255, 248, 232, ${s+.1})`,n.lineWidth=1.6,n.beginPath(),n.moveTo(e+4,t-4),n.bezierCurveTo(e+i*.28,t-9,e+i*.64,t+5,e+i-6,t-6),n.stroke(),n.restore()}function Dc(n,e,t,i=1){n.save(),n.translate(e,t),n.fillStyle="rgba(255, 248, 232, 0.30)",n.strokeStyle="rgba(46, 27, 14, 0.34)",n.lineWidth=3*i,n.beginPath(),n.roundRect(-34*i,-17*i,68*i,34*i,8*i),n.fill(),n.stroke(),n.fillStyle="rgba(27, 106, 100, 0.35)",n.beginPath(),n.moveTo(-27*i,-17*i),n.lineTo(0,-39*i),n.lineTo(29*i,-17*i),n.closePath(),n.fill(),n.stroke(),n.strokeStyle="rgba(101, 74, 28, 0.45)",n.beginPath(),n.arc(-23*i,21*i,10*i,0,Math.PI*2),n.arc(24*i,21*i,10*i,0,Math.PI*2),n.stroke(),n.restore()}function q_(n,e,t,i=1){n.fillStyle="rgba(255, 248, 232, 0.14)",n.strokeStyle="rgba(255, 248, 232, 0.22)",n.lineWidth=4*i;for(let s=0;s<3;s+=1){let r=e+(s-1)*18*i,a=(26+s%2*14)*i;n.beginPath(),n.roundRect(r-7*i,t-a,14*i,a,3*i),n.fill(),n.stroke()}n.beginPath(),n.moveTo(e-30*i,t+3*i),n.lineTo(e+32*i,t-2*i),n.stroke()}function Y_(n,e,t,i){let s=Wo(`${e.cellId}:${i}`);n.save(),cd(n),n.clip();let r=n.createLinearGradient(0,18,256,238);r.addColorStop(0,Zn(t.rim,.92)),r.addColorStop(.46,Zn(t.fill,.96)),r.addColorStop(1,Zn(t.shadow,.72)),n.fillStyle=r,n.fillRect(0,0,256,256),n.strokeStyle="rgba(46, 27, 14, 0.08)",n.lineWidth=3;for(let a=0;a<7;a+=1){let o=28+a*31;n.beginPath(),n.moveTo(12,o),n.bezierCurveTo(66,o-12,121,o+14,182,o-3),n.bezierCurveTo(210,o-10,231,o+3,248,o-8),n.stroke()}if(i==="water"&&(n.strokeStyle="rgba(39, 126, 167, 0.26)",n.lineWidth=9,n.lineCap="round",n.beginPath(),n.moveTo(-10,172-s*30),n.bezierCurveTo(62,139-s*16,118,191+s*12,266,132-s*20),n.stroke(),n.strokeStyle="rgba(224, 248, 255, 0.28)",n.lineWidth=3,n.stroke()),i==="forest"){String(e.fogState||"")==="known"&&(n.fillStyle="rgba(24, 137, 132, 0.24)",n.fillRect(0,0,256,256));for(let a=0;a<34;a+=1){let o=38+(a*37+s*93)%178,l=50+(a*53+s*71)%150;X_(n,o,l,.46+a%3*.07,String(e.fogState||"")==="known"?a%4===0?"rgba(18, 101, 103, 0.72)":"rgba(38, 139, 119, 0.64)":a%4===0?"rgba(29, 84, 61, 0.70)":"rgba(42, 119, 72, 0.62)")}n.strokeStyle="rgba(255, 248, 232, 0.22)",n.lineWidth=5}else if(i==="ridge"){n.strokeStyle="rgba(80, 68, 55, 0.48)",n.lineWidth=9;for(let a=0;a<5;a+=1){let o=62+a*30;n.beginPath(),n.moveTo(24,o),n.bezierCurveTo(74,o-26,126,o+24,232,o-12),n.stroke()}n.fillStyle="rgba(255, 248, 232, 0.18)";for(let a=0;a<12;a+=1){let o=30+a*43%180,l=58+a*29%122;n.beginPath(),n.moveTo(o,l-10),n.lineTo(o-12,l+14),n.lineTo(o+15,l+10),n.closePath(),n.fill()}n.strokeStyle="rgba(255, 248, 232, 0.26)",n.lineWidth=4}else if(i==="settled"){n.fillStyle="rgba(255, 248, 232, 0.28)",n.beginPath(),n.ellipse(128,132,78,48,-.18,0,Math.PI*2),n.fill(),n.strokeStyle="rgba(101, 74, 28, 0.22)",n.lineWidth=4;for(let a=0;a<4;a+=1)Pc(n,56,86+a*23,128,.18);Tc(n,112,118,1.05),Tc(n,152,137,.72,"rgba(232, 244, 222, 0.78)"),Tc(n,82,146,.62,"rgba(255, 228, 160, 0.58)"),Xo(n,160,96,.56,"rgba(47, 125, 101, 0.74)"),Dc(n,90,86,.42),n.strokeStyle="rgba(27, 106, 100, 0.34)",n.lineWidth=5,n.beginPath(),n.ellipse(128,132,90,58,-.18,0,Math.PI*2),n.stroke(),n.strokeStyle="rgba(255, 248, 232, 0.34)",n.lineWidth=3,n.beginPath(),n.moveTo(58,162),n.bezierCurveTo(112,142,152,167,206,141),n.stroke(),n.strokeStyle="rgba(27, 106, 100, 0.34)",n.lineWidth=5}else if(i==="water"){n.strokeStyle="rgba(46, 122, 152, 0.44)",n.lineWidth=10;for(let a=0;a<6;a+=1){let o=58+a*25;n.beginPath(),n.moveTo(22,o),n.bezierCurveTo(76,o+18,112,o-18,166,o+3),n.bezierCurveTo(194,o+14,218,o-6,236,o+4),n.stroke()}n.strokeStyle="rgba(255, 248, 232, 0.28)",n.lineWidth=4}else if(i==="ruin_signal"){n.fillStyle="rgba(255, 248, 232, 0.18)",n.fillRect(0,0,256,256),n.strokeStyle="rgba(80, 68, 55, 0.36)",n.lineWidth=7;for(let a=0;a<4;a+=1){let o=70+a*29;n.beginPath(),n.moveTo(34,o),n.bezierCurveTo(76,o-16,128,o+14,212,o-8),n.stroke()}q_(n,105,154,.72),Xo(n,160,116,.48,"rgba(101, 74, 28, 0.56)"),n.strokeStyle="rgba(101, 74, 28, 0.32)",n.lineWidth=4}else if(i==="hinted"){n.fillStyle="rgba(226, 134, 40, 0.18)",n.fillRect(0,0,256,256),n.fillStyle="rgba(255, 248, 232, 0.16)";for(let a=0;a<10;a+=1){let o=28+a*22;n.beginPath(),n.ellipse(128+(a%3-1)*22,o,112-a%2*18,12,.12,0,Math.PI*2),n.fill()}n.setLineDash([10,9]),n.strokeStyle="rgba(255, 248, 232, 0.32)",n.lineWidth=4,n.beginPath(),n.ellipse(128,130,72,48,-.15,0,Math.PI*2),n.stroke(),n.setLineDash([]),n.fillStyle="rgba(46, 27, 14, 0.12)",n.beginPath(),n.ellipse(128,136,52,31,-.18,0,Math.PI*2),n.fill(),n.strokeStyle="rgba(138, 109, 65, 0.34)",n.lineWidth=5}else if(i==="locked_unknown"){n.fillStyle="rgba(255, 248, 232, 0.10)";for(let a=-2;a<11;a+=1)n.fillRect(a*31,20,13,220);n.fillStyle="rgba(255, 248, 232, 0.12)";for(let a=0;a<7;a+=1)n.beginPath(),n.ellipse(128,42+a*26,116-a%2*18,11,-.12,0,Math.PI*2),n.fill();n.fillStyle="rgba(68, 58, 48, 0.16)",n.beginPath(),n.ellipse(128,145,60,36,.1,0,Math.PI*2),n.fill(),n.strokeStyle="rgba(255, 248, 232, 0.20)",n.lineWidth=5}else{Dc(n,88+s*64,86+s*42,.32),n.strokeStyle="rgba(69, 112, 68, 0.30)",n.lineWidth=5;for(let a=0;a<7;a+=1){let o=48+a*24;n.beginPath(),n.moveTo(26,o),n.bezierCurveTo(84,o-12,144,o+10,230,o-7),n.stroke()}}n.strokeStyle=i==="locked_unknown"?"rgba(255, 248, 232, 0.10)":n.strokeStyle;for(let a=0;a<4;a+=1){let o=60+a*38+s*12;n.beginPath(),n.moveTo(18,o),n.bezierCurveTo(82,o-18,152,o+15,238,o-9),n.stroke()}n.restore()}function Qu(n={},e=!1){let t=String(n.fogState||"locked_unknown"),i=Jn(n),s=Uc(n,i),r=qo(s),a=r?"asset-ready":s?.slot||"procedural",o=`expedition-cell:${Vt}:${n.cellId}:${t}:${i}:${a}:${e?"selected":"idle"}`;if(Se.has(o))return Se.get(o);let l=Fc(n,e),c=document.createElement("canvas");c.width=256,c.height=256;let h=c.getContext("2d");h.clearRect(0,0,c.width,c.height),h.shadowColor=Zn(l.shadow,e?.34:.24),h.shadowBlur=e?22:13,h.shadowOffsetY=e?9:6,Y_(h,n,l,i),r&&(h.save(),cd(h,120,128),h.clip(),h.globalAlpha=t==="locked_unknown"?.74:t==="hinted"?.72:.92,h.drawImage(r,0,0,256,256),h.globalCompositeOperation="multiply",h.globalAlpha=t==="locked_unknown"?.16:.1,h.fillStyle=t==="locked_unknown"?"#3b3228":"#fff8e8",h.fillRect(0,0,256,256),h.restore()),h.shadowColor="transparent",h.shadowBlur=0,h.shadowOffsetY=0;let d=h.createRadialGradient(82,62,12,128,128,130);d.addColorStop(0,"rgba(255, 248, 232, 0.20)"),d.addColorStop(.64,Zn(l.fogOverlay,t==="locked_unknown"?.22:.1)),d.addColorStop(1,Zn(l.shadow,t==="locked_unknown"?.18:.12)),h.fillStyle=d,h.beginPath(),_n(120).forEach((f,g)=>{let S=128+f.x,p=128+f.y;g===0?h.moveTo(S,p):h.lineTo(S,p)}),h.closePath(),h.fill(),h.strokeStyle=Zn(e?l.rim:l.line,e?.98:.76),h.lineWidth=e?13:8,h.beginPath(),_n(116).forEach((f,g)=>{let S=128+f.x,p=128+f.y;g===0?h.moveTo(S,p):h.lineTo(S,p)}),h.closePath(),h.stroke(),t==="hinted"&&(h.setLineDash([12,10]),h.strokeStyle="rgba(46, 27, 14, 0.36)",h.lineWidth=5,h.stroke(),h.setLineDash([]));let u=new yt(c);return u.colorSpace=qe,u.minFilter=we,u.magFilter=we,Se.set(o,u),u}function $_(n={},e=!1){let t=U_(n),i=String(n.fogState||"locked_unknown"),s=`expedition-marker:${Vt}:${t}:${i}:${e?"selected":"idle"}`;if(Se.has(s))return Se.get(s);let r=document.createElement("canvas");r.width=192,r.height=192;let a=r.getContext("2d"),o=Fc(n,e);a.clearRect(0,0,r.width,r.height),a.fillStyle="rgba(22, 18, 13, 0.22)",a.beginPath(),a.ellipse(96,154,54,16,0,0,Math.PI*2),a.fill();let l=String(n.kind||""),c=String(n.status||"");a.fillStyle=i==="locked_unknown"?"rgba(46, 39, 32, 0.92)":i==="hinted"?"rgba(209, 154, 72, 0.94)":l==="origin_plot"?"rgba(255, 226, 128, 0.98)":c.includes("SITE_PLAN")?"rgba(154, 225, 216, 0.96)":Zn(o.rim,.94),a.strokeStyle=Zn(o.line,.92),a.lineWidth=e?10:7,a.beginPath(),a.arc(96,84,48,0,Math.PI*2),a.fill(),a.stroke(),a.beginPath(),a.moveTo(96,138),a.lineTo(75,112),a.lineTo(117,112),a.closePath(),a.fill(),a.stroke(),a.fillStyle=i==="locked_unknown"||i==="hinted"?"#fff8e8":"#2e1b0e",a.font="800 34px Georgia, serif",a.textAlign="center",a.textBaseline="middle",a.fillText(t.length>3?t.slice(0,3):t,96,84);let h=new yt(r);return h.colorSpace=qe,h.minFilter=we,h.magFilter=we,Se.set(s,h),h}function hd(n={}){return String(n.cellId||n.receiptLink?.cellId||n.sourceIds?.cellId||"").trim()}function Z_(n={}){return(Array.isArray(n?.eventPackets)?n.eventPackets:[]).filter(e=>e&&typeof e=="object"&&e.packetId&&hd(e))}function J_(n={},e=!1){let t=String(n.packetId||"packet"),i=String(n.templateId||n.kind||"event_packet"),s=`expedition-event-marker:${Vt}:${t}:${i}:${e?"selected":"idle"}`;if(Se.has(s))return Se.get(s);let r=document.createElement("canvas");r.width=192,r.height=192;let a=r.getContext("2d");a.clearRect(0,0,r.width,r.height),a.fillStyle="rgba(46, 27, 14, 0.22)",a.beginPath(),a.ellipse(96,150,48,14,0,0,Math.PI*2),a.fill(),a.fillStyle=e?"rgba(255, 248, 232, 0.94)":"rgba(255, 248, 232, 0.84)",a.strokeStyle=e?"#f5d484":"#8a6d41",a.lineWidth=e?8:6,a.beginPath(),a.roundRect(52,48,88,78,12),a.fill(),a.stroke(),a.strokeStyle="#1b6a64",a.lineWidth=6,a.lineJoin="round",a.beginPath(),a.moveTo(56,60),a.lineTo(96,92),a.lineTo(136,60),a.stroke(),a.fillStyle="#d19a48",a.strokeStyle="#5a3418",a.lineWidth=5,a.beginPath(),a.arc(122,116,17,0,Math.PI*2),a.fill(),a.stroke(),a.fillStyle="#82d6d0",a.globalAlpha=e?.82:.58,a.beginPath(),a.arc(62,42,8,0,Math.PI*2),a.fill(),a.globalAlpha=1,Oc(a,Ni.event_packet,42,34,108,108,16);let o=new yt(r);return o.colorSpace=qe,o.minFilter=we,o.magFilter=we,Se.set(s,o),o}function K_(n={},e=!1){let t=String(n.mode||"inspect"),i=`expedition-objective-marker:${Vt}:${t}:${n.targetCellId||""}:${e?"selected":"idle"}`;if(Se.has(i))return Se.get(i);let s=document.createElement("canvas");s.width=192,s.height=192;let r=s.getContext("2d");r.clearRect(0,0,s.width,s.height);let a=t==="scout"?"rgba(245, 212, 132, 0.40)":t==="packet"?"rgba(130, 214, 208, 0.38)":"rgba(255, 248, 232, 0.30)",o=t==="scout"?"#d19a48":t==="packet"?"#1b6a64":"#8a6d41";r.fillStyle=a,r.beginPath(),r.arc(96,88,e?68:58,0,Math.PI*2),r.fill(),r.fillStyle="rgba(46, 27, 14, 0.22)",r.beginPath(),r.ellipse(96,150,52,15,0,0,Math.PI*2),r.fill(),r.fillStyle=o,r.strokeStyle=e?"#fff8e8":"#5a3418",r.lineWidth=e?9:6,r.beginPath(),r.arc(96,82,38,0,Math.PI*2),r.fill(),r.stroke(),r.strokeStyle="#fff8e8",r.fillStyle="#fff8e8",r.lineWidth=8,r.lineCap="round",r.lineJoin="round",t==="scout"?(r.beginPath(),r.arc(96,82,20,0,Math.PI*2),r.moveTo(96,48),r.lineTo(96,61),r.moveTo(96,103),r.lineTo(96,118),r.moveTo(62,82),r.lineTo(75,82),r.moveTo(117,82),r.lineTo(130,82),r.stroke(),r.beginPath(),r.moveTo(96,58),r.lineTo(108,86),r.lineTo(84,106),r.closePath(),r.fill()):t==="packet"?(r.beginPath(),r.roundRect(72,60,48,44,7),r.moveTo(76,69),r.lineTo(96,86),r.lineTo(116,69),r.stroke()):(r.beginPath(),r.moveTo(72,116),r.lineTo(96,52),r.lineTo(120,116),r.stroke(),r.beginPath(),r.arc(96,56,12,0,Math.PI*2),r.fill()),Oc(r,t==="packet"?Ni.event_packet:Ni.objective_beacon,42,28,108,108,18);let l=new yt(s);return l.colorSpace=qe,l.minFilter=we,l.magFilter=we,Se.set(i,l),l}function j_(n="edge"){let e=`expedition-fog:${Vt}:${n}`;if(Se.has(e))return Se.get(e);let t=document.createElement("canvas");t.width=512,t.height=512;let i=t.getContext("2d"),s=i.createRadialGradient(242,238,38,256,256,250);s.addColorStop(0,n==="locked"?"rgba(135, 129, 112, 0.34)":"rgba(228, 133, 38, 0.46)"),s.addColorStop(.5,n==="locked"?"rgba(116, 108, 92, 0.38)":"rgba(238, 184, 86, 0.42)"),s.addColorStop(.8,n==="locked"?"rgba(78, 70, 58, 0.22)":"rgba(255, 230, 158, 0.22)"),s.addColorStop(1,"rgba(255, 248, 232, 0)"),i.fillStyle=s,i.fillRect(0,0,t.width,t.height),i.strokeStyle=n==="locked"?"rgba(255, 248, 232, 0.18)":"rgba(255, 248, 232, 0.26)",i.lineWidth=8,i.lineCap="round";for(let a=0;a<7;a+=1){let o=104+a*42;i.beginPath(),i.moveTo(30,o),i.bezierCurveTo(130,o-28,262,o+36,480,o-20),i.stroke()}i.save(),i.globalCompositeOperation="multiply",i.strokeStyle=n==="locked"?"rgba(57, 49, 40, 0.18)":"rgba(124, 91, 48, 0.18)",i.lineWidth=3;for(let a=0;a<5;a+=1)i.beginPath(),i.ellipse(254,242+a*5,188-a*22,122-a*13,-.14,0,Math.PI*2),i.stroke();i.restore(),n!=="locked"&&(i.setLineDash([18,16]),i.strokeStyle="rgba(101, 74, 28, 0.24)",i.lineWidth=5,i.beginPath(),i.ellipse(256,256,164,112,-.16,0,Math.PI*2),i.stroke(),i.setLineDash([]));let r=new yt(t);return r.colorSpace=qe,r.minFilter=we,r.magFilter=we,Se.set(e,r),r}function Q_(n,e,t){n.save(),n.globalCompositeOperation="multiply",n.lineCap="round",n.strokeStyle="rgba(46, 27, 14, 0.07)",n.lineWidth=3;for(let i=-1;i<11;i+=1){let s=62+i*58;n.beginPath(),n.moveTo(-70,s),n.bezierCurveTo(124,s-54,282,s+48,474,s-18),n.bezierCurveTo(650,s-78,814,s+40,e+80,s-36),n.stroke()}n.strokeStyle="rgba(27, 106, 100, 0.08)",n.lineWidth=2;for(let i=-2;i<9;i+=1){let s=112+i*128;n.beginPath(),n.moveTo(s,-50),n.bezierCurveTo(s+88,92,s-78,222,s+74,362),n.bezierCurveTo(s+202,480,s-62,546,s+138,t+52),n.stroke()}n.restore(),n.save(),n.strokeStyle="rgba(255, 248, 232, 0.26)",n.lineWidth=2;for(let i=0;i<5;i+=1){let s=610+i*80,r=118+i%2*74;n.beginPath(),n.ellipse(s,r,84+i*10,38+i*4,-.18,0,Math.PI*2),n.stroke()}n.restore()}function ex(n="soft"){let e=`expedition-edge-fog:${Vt}:${n}`;if(Se.has(e))return Se.get(e);let t=document.createElement("canvas");t.width=1024,t.height=256;let i=t.getContext("2d"),s=i.createLinearGradient(0,0,t.width,0);s.addColorStop(0,"rgba(255, 248, 232, 0)"),s.addColorStop(.28,n==="locked"?"rgba(43, 35, 27, 0.30)":"rgba(234, 219, 184, 0.24)"),s.addColorStop(.52,n==="locked"?"rgba(43, 35, 27, 0.54)":"rgba(255, 248, 232, 0.50)"),s.addColorStop(.76,n==="locked"?"rgba(43, 35, 27, 0.30)":"rgba(27, 106, 100, 0.18)"),s.addColorStop(1,"rgba(255, 248, 232, 0)"),i.fillStyle=s,i.fillRect(0,0,t.width,t.height),i.strokeStyle=n==="locked"?"rgba(255, 248, 232, 0.14)":"rgba(255, 248, 232, 0.32)",i.lineWidth=2;for(let a=0;a<12;a+=1){let o=28+a*17;i.beginPath(),i.moveTo(0,o),i.bezierCurveTo(240,o-30,510,o+36,1024,o-18),i.stroke()}i.save(),i.setLineDash([20,14]),i.strokeStyle=n==="locked"?"rgba(255, 248, 232, 0.10)":"rgba(101, 74, 28, 0.22)",i.lineWidth=6,i.beginPath(),i.moveTo(34,132),i.bezierCurveTo(254,74,534,182,990,112),i.stroke(),i.restore();let r=new yt(t);return r.colorSpace=qe,r.minFilter=we,r.magFilter=we,Se.set(e,r),r}function tx(){let n=`expedition-map-base:${Vt}`;if(Se.has(n))return Se.get(n);let e=document.createElement("canvas");e.width=1024,e.height=640;let t=e.getContext("2d"),i=t.createLinearGradient(0,0,e.width,e.height);i.addColorStop(0,"#f3e4bf"),i.addColorStop(.32,"#d8dfbd"),i.addColorStop(.64,"#b9cfa5"),i.addColorStop(1,"#6aa39b"),t.fillStyle=i,t.fillRect(0,0,e.width,e.height),Q_(t,e.width,e.height),t.fillStyle="rgba(72, 152, 124, 0.11)";for(let a=0;a<9;a+=1){let o=-60+a*140;t.beginPath(),t.ellipse(o,470+a%3*18,148,45,-.12,0,Math.PI*2),t.fill()}t.strokeStyle="rgba(101, 74, 28, 0.12)",t.lineWidth=15,t.lineCap="round",t.beginPath(),t.moveTo(-70,452),t.bezierCurveTo(112,385,247,507,399,423),t.bezierCurveTo(552,339,709,440,1094,305),t.stroke(),t.strokeStyle="rgba(255, 248, 232, 0.20)",t.lineWidth=4,t.stroke(),t.fillStyle="rgba(33, 113, 80, 0.13)";for(let a=0;a<68;a+=1){let o=a*83%e.width,l=a*131%e.height,c=28+a*17%74;t.beginPath(),t.ellipse(o,l,c*1.4,c,a%5*.3,0,Math.PI*2),t.fill()}t.strokeStyle="rgba(68, 57, 46, 0.20)",t.lineWidth=6;for(let a=0;a<7;a+=1){let o=102+a*48;t.beginPath(),t.moveTo(554,o),t.bezierCurveTo(615,o-42,706,o+34,804,o-22),t.bezierCurveTo(873,o-60,946,o+11,1070,o-44),t.stroke()}t.strokeStyle="rgba(46, 27, 14, 0.13)",t.lineWidth=2.5;for(let a=54;a<e.height;a+=56)t.beginPath(),t.moveTo(-30,a),t.bezierCurveTo(150,a-36,280,a+42,470,a-8),t.bezierCurveTo(650,a-56,780,a+34,e.width+40,a-22),t.stroke();t.strokeStyle="rgba(27, 106, 100, 0.12)",t.lineWidth=2;for(let a=-70;a<e.width+90;a+=78)t.beginPath(),t.moveTo(a,-20),t.bezierCurveTo(a+120,160,a-90,350,a+140,e.height+30),t.stroke();t.save(),t.setLineDash([18,13]),t.lineCap="round",t.strokeStyle="rgba(101, 74, 28, 0.20)",t.lineWidth=5,[[[-24,248],[122,197,236,277,366,217],[506,154,612,232,714,184],[810,138,916,174,1048,120]],[[424,-20],[500,92,444,198,548,292],[646,382,586,478,742,676]],[[138,636],[226,512,336,564,430,452],[526,336,636,408,760,314],[862,236,930,284,1050,226]]].forEach(a=>{t.beginPath(),t.moveTo(a[0][0],a[0][1]);for(let o=1;o<a.length;o+=1){let l=a[o];t.bezierCurveTo(l[0],l[1],l[2],l[3],l[4],l[5])}t.stroke()}),t.strokeStyle="rgba(255, 248, 232, 0.50)",t.lineWidth=3,[[[-24,248],[122,197,236,277,366,217],[506,154,612,232,714,184],[810,138,916,174,1048,120]],[[424,-20],[500,92,444,198,548,292],[646,382,586,478,742,676]],[[138,636],[226,512,336,564,430,452],[526,336,636,408,760,314],[862,236,930,284,1050,226]]].forEach(a=>{t.beginPath(),t.moveTo(a[0][0],a[0][1]);for(let o=1;o<a.length;o+=1){let l=a[o];t.bezierCurveTo(l[0],l[1],l[2],l[3],l[4],l[5])}t.stroke()}),t.restore(),t.save(),t.globalCompositeOperation="multiply",t.strokeStyle="rgba(46, 27, 14, 0.08)",t.lineWidth=2;for(let a=34;a<e.height;a+=34)Pc(t,42,a,270,.11),Pc(t,676,a+10,250,.09);t.restore(),t.save(),t.globalAlpha=.72,Dc(t,170,436,.86),Xo(t,780,180,.84,"rgba(27, 106, 100, 0.58)"),Xo(t,332,222,.58,"rgba(101, 74, 28, 0.52)"),t.restore(),t.strokeStyle="rgba(101, 74, 28, 0.18)",t.lineWidth=2,t.setLineDash([12,10]),t.strokeRect(28,28,e.width-56,e.height-56),t.setLineDash([]);let s=t.createRadialGradient(e.width*.48,e.height*.46,80,e.width*.48,e.height*.46,590);s.addColorStop(0,"rgba(255, 248, 232, 0.12)"),s.addColorStop(.74,"rgba(255, 248, 232, 0)"),s.addColorStop(1,"rgba(46, 27, 14, 0.28)"),t.fillStyle=s,t.fillRect(0,0,e.width,e.height);let r=new yt(e);return r.colorSpace=qe,r.wrapS=Kt,r.wrapT=Kt,r.minFilter=we,r.magFilter=we,Se.set(n,r),r}function ud(n={}){let e=n.bounds||{minX:-1,maxX:1,minY:-1,maxY:1,centerX:0,centerY:0,width:2,height:2},t=xn*1.72,i=e.minX-t,s=e.maxX+t,r=e.minY-t,a=e.maxY+t;return{minX:i,maxX:s,minY:r,maxY:a,centerX:(i+s)/2,centerY:(r+a)/2,width:Math.max(.01,s-i),height:Math.max(.01,a-r)}}function nx(n={x:0,y:0},e,t){return{x:(n.x-e.minX)/Math.max(.01,e.width)*t.width,y:t.height-(n.y-e.minY)/Math.max(.01,e.height)*t.height}}function Ho(n={},e=Jn(n)){let t=String(n.fogState||"locked_unknown");return Si(n)?e==="forest"?{terrain:e,fill:"rgba(42, 126, 86, 0.46)",mid:"rgba(35, 145, 123, 0.26)",edge:"rgba(255, 248, 232, 0)",contour:"rgba(23, 80, 64, 0.20)",bridge:"rgba(43, 126, 91, 0.24)",fogOnly:!1}:e==="ridge"||e==="ruin_signal"?{terrain:e,fill:"rgba(118, 104, 85, 0.42)",mid:"rgba(194, 176, 128, 0.24)",edge:"rgba(255, 248, 232, 0)",contour:"rgba(68, 57, 46, 0.20)",bridge:"rgba(129, 111, 82, 0.22)",fogOnly:!1}:e==="water"?{terrain:e,fill:"rgba(63, 143, 166, 0.42)",mid:"rgba(123, 196, 207, 0.26)",edge:"rgba(255, 248, 232, 0)",contour:"rgba(35, 95, 126, 0.18)",bridge:"rgba(67, 148, 169, 0.22)",fogOnly:!1}:e==="settled"?{terrain:e,fill:"rgba(214, 181, 102, 0.44)",mid:"rgba(73, 143, 128, 0.24)",edge:"rgba(255, 248, 232, 0)",contour:"rgba(101, 74, 28, 0.18)",bridge:"rgba(196, 165, 94, 0.22)",fogOnly:!1}:{terrain:e,fill:"rgba(121, 158, 90, 0.38)",mid:"rgba(216, 209, 151, 0.22)",edge:"rgba(255, 248, 232, 0)",contour:"rgba(68, 91, 63, 0.17)",bridge:"rgba(124, 156, 97, 0.20)",fogOnly:!1}:t==="hinted"?{terrain:"hinted",fill:"rgba(224, 150, 52, 0.46)",mid:"rgba(245, 212, 132, 0.32)",edge:"rgba(255, 248, 232, 0)",contour:"rgba(101, 74, 28, 0.18)",bridge:"rgba(214, 148, 58, 0.20)",fogOnly:!0}:{terrain:"locked_unknown",fill:"rgba(157, 150, 132, 0.30)",mid:"rgba(104, 96, 82, 0.20)",edge:"rgba(255, 248, 232, 0)",contour:"rgba(255, 248, 232, 0.13)",bridge:"rgba(134, 126, 111, 0.14)",fogOnly:!0}}function ix(n,e,t,i,s=0){let r=(e.x+t.x)/2,a=(e.y+t.y)/2,o=22+s*26;n.save(),n.filter="blur(13px)",n.lineCap="round",n.strokeStyle=i.bridge,n.lineWidth=104,n.beginPath(),n.moveTo(e.x,e.y),n.quadraticCurveTo(r,a-o,t.x,t.y),n.stroke(),n.restore()}function sx(n,e,t,i,s=0){n.save();let r=n.createRadialGradient(e.x-t*.22,e.y-t*.24,t*.08,e.x,e.y,t);r.addColorStop(0,i.fill),r.addColorStop(.54,i.mid),r.addColorStop(1,i.edge),n.filter="blur(9px)",n.fillStyle=r,n.beginPath(),n.arc(e.x,e.y,t,0,Math.PI*2),n.fill(),n.restore(),n.save(),n.translate(e.x,e.y),n.rotate((s-.5)*.26),n.scale(1.28,.82),n.strokeStyle=i.contour,n.lineWidth=5,n.lineCap="round";for(let a=-2;a<=2;a+=1){let o=a*t*.18;n.beginPath(),n.moveTo(-t*.78,o),n.bezierCurveTo(-t*.34,o-t*.17,t*.18,o+t*.16,t*.76,o-t*.08),n.stroke()}i.fogOnly&&(n.setLineDash([15,13]),n.strokeStyle=i.terrain==="locked_unknown"?"rgba(255, 248, 232, 0.14)":"rgba(101, 74, 28, 0.22)",n.lineWidth=4,n.beginPath(),n.ellipse(0,0,t*.58,t*.34,-.08,0,Math.PI*2),n.stroke()),n.restore()}function rx(n=[],e=od(n)){let t=qo(rd),i=n.map(d=>`${d.cellId}:${d.fogState}:${Jn(d)}:${d.publicTerrainAssetSlot||""}:${d.fogAssetSlot||""}`).join("|"),s=`expedition-continuous-underlay:${Vt}:${i}:${t?"promoted-underlay-ready":"promoted-underlay-pending"}`;if(Se.has(s))return Se.get(s);let r=document.createElement("canvas");r.width=1024,r.height=768;let a=r.getContext("2d"),o=ud(e),l=new Map;for(let d of n){let u=e.positions.get(String(d.cellId||""));u&&l.set(String(d.cellId||""),nx(u,o,r))}a.clearRect(0,0,r.width,r.height),a.fillStyle="rgba(255, 248, 232, 0.04)",a.fillRect(0,0,r.width,r.height),t&&(a.save(),a.globalAlpha=.68,a.drawImage(t,0,0,r.width,r.height),a.globalCompositeOperation="screen",a.globalAlpha=.18,a.fillStyle="rgba(255, 248, 232, 0.70)",a.fillRect(0,0,r.width,r.height),a.restore());for(let d=0;d<n.length;d+=1)for(let u=d+1;u<n.length;u+=1){let f=n[d],g=n[u];if(!Bc(f,g))continue;let S=l.get(String(f.cellId||"")),p=l.get(String(g.cellId||""));if(!S||!p)continue;let m=Ho(f),x=Ho(g),M=m.terrain==="locked_unknown"||x.terrain==="locked_unknown"?{bridge:"rgba(134, 126, 111, 0.12)"}:{bridge:m.fogOnly?m.bridge:x.fogOnly?x.bridge:"rgba(75, 132, 105, 0.20)"};ix(a,S,p,M,Wo(`${f.cellId}:${g.cellId}:underlay`))}let c=Math.min(r.width/o.width,r.height/o.height);for(let d of n){let u=l.get(String(d.cellId||""));if(!u)continue;let f=Jn(d),g=Ho(d,f),S=c*xn*(g.fogOnly?1.28:1.38);sx(a,u,S,g,Wo(`${d.cellId}:${f}:underlay`))}a.save(),a.globalCompositeOperation="multiply",a.strokeStyle="rgba(46, 27, 14, 0.06)",a.lineWidth=2;for(let d=42;d<r.height;d+=36)a.beginPath(),a.moveTo(-40,d),a.bezierCurveTo(150,d-24,298,d+28,482,d-8),a.bezierCurveTo(648,d-42,818,d+22,r.width+40,d-16),a.stroke();a.restore();let h=new yt(r);return h.colorSpace=qe,h.minFilter=we,h.magFilter=we,Se.set(s,h),h}function ax(){let n=`expedition-civic-beacon:${Vt}`;if(Se.has(n))return Se.get(n);let e=document.createElement("canvas");e.width=256,e.height=256;let t=e.getContext("2d");t.clearRect(0,0,e.width,e.height);let i=t.createRadialGradient(128,126,16,128,126,116);i.addColorStop(0,"rgba(245, 212, 132, 0.48)"),i.addColorStop(.48,"rgba(27, 106, 100, 0.18)"),i.addColorStop(1,"rgba(255, 248, 232, 0)"),t.fillStyle=i,t.fillRect(0,0,e.width,e.height),t.strokeStyle="rgba(46, 27, 14, 0.42)",t.lineWidth=9,t.lineCap="round",t.beginPath(),t.moveTo(128,174),t.lineTo(128,80),t.stroke(),t.strokeStyle="rgba(27, 106, 100, 0.42)",t.lineWidth=5;for(let r=0;r<3;r+=1)t.beginPath(),t.arc(128,83,30+r*22,-.78,.78),t.stroke();t.fillStyle="rgba(245, 212, 132, 0.86)",t.strokeStyle="rgba(46, 27, 14, 0.44)",t.lineWidth=5,t.beginPath(),t.moveTo(136,76),t.lineTo(188,94),t.lineTo(136,116),t.closePath(),t.fill(),t.stroke(),t.fillStyle="rgba(255, 248, 232, 0.54)",t.beginPath(),t.roundRect(91,174,74,25,8),t.fill();let s=new yt(e);return s.colorSpace=qe,s.minFilter=we,s.magFilter=we,Se.set(n,s),s}function ox(n={},e={x:0,y:0},t=!1,i=!1){let s=Fc(n,t),r=String(n.fogState||""),a=Jn(n),o=new dn;o.position.set(e.x,e.y,0);let l=xn*(t?1.04:i?1.02:1),c=new ht(Ku(l),new Dt({color:16777215,map:Qu(n,t),transparent:!0,opacity:O_(r,t,i),side:Bt,depthWrite:!1}));c.position.z=-.1,c.userData={kind:"expedition_cell",cellId:String(n.cellId||""),fogState:String(n.fogState||""),terrain:a,regionPlate:!0,waterCue:a==="water",status:String(n.status||""),title:String(n.title||""),selected:t,hovered:i},o.add(c);let h=new Cn(new ot().setFromPoints(_n(l*1.01)),new Ot({color:t?s.rim:s.line,transparent:!0,opacity:k_(r,t,i)}));h.position.z=-.04,o.add(h);let d=new ht(Ju(Ui*1.16),new Dt({color:s.shadow,transparent:!0,opacity:t?.18:.08,side:Bt,depthWrite:!1}));d.position.set(.08,-.09,-.01),o.add(d);let u=new ht(Ku(Ui),new Dt({color:16777215,map:Qu(n,t),transparent:!0,opacity:B_(s,r,t,i),side:Bt,depthWrite:!1}));u.position.z=.02,u.userData={kind:"expedition_cell",cellId:String(n.cellId||""),fogState:String(n.fogState||""),terrain:a,waterCue:a==="water",status:String(n.status||""),title:String(n.title||""),selected:t,hovered:i},o.add(u);let f=new Cn(new ot().setFromPoints(_n(Ui*(t?1.08:1))),new Ot({color:s.line,transparent:!0,opacity:z_(s,r,t,i)}));if(f.position.z=.08,o.add(f),t){let S=new Cn(new ot().setFromPoints(_n(l*1.08)),new Ot({color:s.rim,transparent:!0,opacity:.82}));S.position.z=.16,o.add(S)}if(i&&!t){let S=new Cn(new ot().setFromPoints(_n(l*1.04)),new Ot({color:16775400,transparent:!0,opacity:.7}));S.position.z=.15,o.add(S)}if(r==="discovered"&&a==="settled"){let S=new Cn(new ot().setFromPoints(_n(l*1.14)),new Ot({color:16774340,transparent:!0,opacity:.44}));S.position.z=.14,o.add(S);let p=new ht(Ju(l*1.02),new Dt({color:16774340,transparent:!0,opacity:.07,side:Bt,depthWrite:!1}));p.position.z=.07,o.add(p)}if(r==="locked_unknown"){let S=new ds(new ot().setFromPoints([new C(-.32,-.3,.1),new C(.32,.3,.1),new C(-.34,.02,.1),new C(.12,.46,.1),new C(-.1,-.46,.1),new C(.34,-.02,.1)]),new Ot({color:16775400,transparent:!0,opacity:.16}));o.add(S)}if(r==="hinted"&&String(n.kind||"")==="frontier_hint"){let S=new Cn(new ot().setFromPoints(_n(l*1.03)),new Ot({color:1796708,transparent:!0,opacity:.64}));S.position.z=.12,o.add(S)}let g=new Lt(new Pt({map:$_(n,t),transparent:!0,depthTest:!0,depthWrite:!1,alphaTest:.03}));return g.position.set(0,t?.03:-.01,.2),g.scale.set(t?.72:.54,t?.72:.54,1),o.add(g),o}function Bc(n={},e={}){let t=Ae(n.q,0),i=Ae(n.r,0),s=Ae(e.q,0),r=Ae(e.r,0),a=t-s,o=i-r;return Math.max(Math.abs(a),Math.abs(o),Math.abs(a+o))===1}function lx(n={},e={}){let t=[String(n.fogState||""),String(e.fogState||"")];return t.includes("locked_unknown")?null:t.includes("hinted")?{color:9071937,glow:16110724,opacity:.34,dash:[.16,.16]}:{color:1796708,glow:16110724,opacity:.5,dash:[.18,.13]}}function cx(n,e,t){let i=lx(n,e);if(!i)return null;let s=t.positions.get(String(n.cellId||"")),r=t.positions.get(String(e.cellId||""));if(!s||!r)return null;let a=new C((s.x+r.x)/2,(s.y+r.y)/2,-.2),o=.08+Wo(`${n.cellId}:${e.cellId}`)*.1,l=new ci(new C(s.x,s.y,-.2),new C(a.x,a.y+o,-.2),new C(r.x,r.y,-.2)),c=new ot().setFromPoints(l.getPoints(32)),h=new An(c,new xs({color:i.color,transparent:!0,opacity:i.opacity,dashSize:i.dash[0],gapSize:i.dash[1]}));h.computeLineDistances(),h.userData={kind:"expedition_receipt_trace",routeAuthority:!1,visualOnly:!0};let d=new An(c.clone(),new Ot({color:i.glow,transparent:!0,opacity:.14}));d.position.z=-.02,d.userData={kind:"expedition_receipt_trace_glow",routeAuthority:!1,visualOnly:!0};let u=new dn;return u.add(d,h),u.userData={kind:"expedition_receipt_trace_group",routeAuthority:!1,visualOnly:!0},u}function hx(n={}){switch(String(n.unitType||n.role||"").toLowerCase()){case"scout":return{fill:"#1f756e",stroke:"#102f2f",accent:"#d6f1ef",glow:"#f5d484",glyph:"compass"};case"courier":return{fill:"#b95368",stroke:"#4f202b",accent:"#fff0bd",glow:"#78a9d6",glyph:"flag"};case"surveyor":return{fill:"#7a6540",stroke:"#342719",accent:"#d6f1ef",glow:"#82d6d0",glyph:"tripod"};case"settler_convoy":return{fill:"#c4883a",stroke:"#5a3418",accent:"#fff8e8",glow:"#f5d484",glyph:"wagon"};case"outpost_crew":return{fill:"#637f58",stroke:"#223a25",accent:"#ffe4a0",glow:"#82d6d0",glyph:"beacon"};default:return{fill:"#8a6d41",stroke:"#3b2513",accent:"#fff8e8",glow:"#82d6d0",glyph:"ledger"}}}function ux(n={},e=!1){let t=`expedition-unit:${Vt}:${n.unitType}:${n.unitId}:${e?"selected":"idle"}`;if(Se.has(t))return Se.get(t);let i=hx(n),s=document.createElement("canvas");s.width=192,s.height=192;let r=s.getContext("2d");r.clearRect(0,0,s.width,s.height),r.fillStyle="rgba(46, 27, 14, 0.24)",r.beginPath(),r.ellipse(96,146,55,18,0,0,Math.PI*2),r.fill(),r.fillStyle=e?"rgba(245, 212, 132, 0.34)":"rgba(255, 248, 232, 0.20)",r.strokeStyle=e?"#f5d484":"rgba(59, 37, 19, 0.55)",r.lineWidth=e?9:6,r.beginPath(),r.roundRect(38,30,116,116,34),r.fill(),r.stroke(),r.fillStyle=i.fill,r.strokeStyle=i.stroke,r.lineWidth=8,r.beginPath(),r.arc(96,88,42,0,Math.PI*2),r.fill(),r.stroke(),r.strokeStyle=i.accent,r.fillStyle=i.accent,r.lineWidth=8,r.lineCap="round",r.lineJoin="round",i.glyph==="compass"?(r.beginPath(),r.arc(96,88,24,0,Math.PI*2),r.moveTo(96,52),r.lineTo(96,66),r.moveTo(96,110),r.lineTo(96,124),r.moveTo(60,88),r.lineTo(74,88),r.moveTo(118,88),r.lineTo(132,88),r.stroke(),r.beginPath(),r.moveTo(96,58),r.lineTo(108,92),r.lineTo(84,118),r.closePath(),r.fill()):i.glyph==="flag"?(r.beginPath(),r.moveTo(80,122),r.lineTo(80,56),r.lineTo(124,68),r.lineTo(80,84),r.stroke()):i.glyph==="wagon"?(r.beginPath(),r.roundRect(66,80,60,34,9),r.stroke(),r.beginPath(),r.arc(78,124,9,0,Math.PI*2),r.arc(116,124,9,0,Math.PI*2),r.stroke()):i.glyph==="beacon"?(r.beginPath(),r.moveTo(72,124),r.lineTo(96,58),r.lineTo(120,124),r.stroke(),r.beginPath(),r.arc(96,62,15,0,Math.PI*2),r.fill()):i.glyph==="tripod"?(r.beginPath(),r.moveTo(96,58),r.lineTo(96,92),r.moveTo(96,92),r.lineTo(70,126),r.moveTo(96,92),r.lineTo(122,126),r.moveTo(76,70),r.lineTo(116,70),r.stroke(),r.beginPath(),r.arc(96,56,13,0,Math.PI*2),r.fill()):(r.beginPath(),r.roundRect(68,62,56,60,8),r.stroke(),r.beginPath(),r.moveTo(80,82),r.lineTo(112,82),r.moveTo(80,100),r.lineTo(106,100),r.stroke()),Oc(r,ld(n),28,22,136,136,34),r.fillStyle=i.glow,r.globalAlpha=e?.8:.46,r.beginPath(),r.arc(136,47,e?8:6,0,Math.PI*2),r.fill(),r.globalAlpha=1;let a=new yt(s);return a.colorSpace=qe,a.minFilter=we,a.magFilter=we,Se.set(t,a),a}function dx(n,e="expedition-three-raycast"){let t=n?.userData||{};return{unitId:String(t.unitId||""),unitType:String(t.unitType||""),displayName:String(t.displayName||""),cellId:String(t.cellId||""),source:e,atMs:Date.now()}}function fx(n,e="expedition-three-raycast"){let t=n?.userData||{};return{markerKind:String(t.kind||""),packetId:String(t.packetId||""),mode:String(t.mode||""),cellId:String(t.cellId||t.targetCellId||""),targetCellId:String(t.targetCellId||t.cellId||""),visualOnly:t.visualOnly===!0,readOnly:t.readOnly===!0,source:e,atMs:Date.now()}}function px(n,e="expedition-three-raycast"){let t=n?.userData||{};return{unitId:String(t.unitId||""),unitType:String(t.unitType||""),commandId:String(t.commandId||""),cellId:String(t.cellId||""),targetCellId:String(t.cellId||""),fogState:String(t.fogState||""),serverMutationImplemented:t.serverMutationImplemented===!0,movementMutation:t.movementMutation===!0,visualOnly:t.visualOnly===!0,readOnly:t.readOnly===!0,previewOnly:t.previewOnly===!0,source:e,atMs:Date.now()}}function dd(n=""){switch(String(n||"")){case"move_unit":return{stroke:"#1b6a64",fill:"rgba(130, 214, 208, 0.18)",glyph:"move"};case"scout_sector":return{stroke:"#d19a48",fill:"rgba(245, 212, 132, 0.20)",glyph:"scout"};case"prepare_settler_convoy":return{stroke:"#c4883a",fill:"rgba(255, 226, 128, 0.18)",glyph:"convoy"};case"found_settlement":return{stroke:"#637f58",fill:"rgba(130, 214, 208, 0.16)",glyph:"outpost"};default:return{stroke:"#8a6d41",fill:"rgba(255, 248, 232, 0.16)",glyph:"inspect"}}}function mx(n={}){let e=String(n.commandId||"inspect"),t=String(n.fogState||""),i=`expedition-command-target:${Vt}:${e}:${t}`;if(Se.has(i))return Se.get(i);let s=document.createElement("canvas");s.width=256,s.height=256;let r=s.getContext("2d"),a=dd(e);r.clearRect(0,0,s.width,s.height),r.fillStyle=a.fill,r.beginPath(),r.arc(128,128,106,0,Math.PI*2),r.fill(),r.strokeStyle=a.stroke,r.lineWidth=e==="scout_sector"?10:8,e==="scout_sector"&&r.setLineDash([18,12]),r.beginPath(),r.arc(128,128,98,0,Math.PI*2),r.stroke(),r.setLineDash([]),r.strokeStyle="rgba(255, 248, 232, 0.72)",r.lineWidth=4,r.beginPath(),r.arc(128,128,80,0,Math.PI*2),r.stroke(),r.fillStyle="rgba(46, 27, 14, 0.24)",r.beginPath(),r.ellipse(128,210,54,13,0,0,Math.PI*2),r.fill(),r.strokeStyle=a.stroke,r.fillStyle="#fff8e8",r.lineWidth=8,r.lineCap="round",r.lineJoin="round",a.glyph==="move"?(r.beginPath(),r.moveTo(86,128),r.lineTo(164,128),r.moveTo(140,104),r.lineTo(164,128),r.lineTo(140,152),r.stroke()):a.glyph==="scout"?(r.beginPath(),r.arc(128,128,30,0,Math.PI*2),r.moveTo(128,78),r.lineTo(128,98),r.moveTo(128,158),r.lineTo(128,178),r.moveTo(78,128),r.lineTo(98,128),r.moveTo(158,128),r.lineTo(178,128),r.stroke()):a.glyph==="convoy"?(r.beginPath(),r.roundRect(88,112,80,38,10),r.stroke(),r.beginPath(),r.arc(104,164,10,0,Math.PI*2),r.arc(152,164,10,0,Math.PI*2),r.stroke()):a.glyph==="outpost"?(r.beginPath(),r.moveTo(96,174),r.lineTo(128,82),r.lineTo(160,174),r.stroke(),r.beginPath(),r.arc(128,84,18,0,Math.PI*2),r.fillStyle=a.stroke,r.fill()):(r.beginPath(),r.roundRect(96,88,64,78,10),r.stroke());let o=new yt(s);return o.colorSpace=qe,o.minFilter=we,o.magFilter=we,Se.set(i,o),o}function gx(n={}){let e=String(n.commandId||"command"),t=String(n.feedbackId||`${e}:${n.cellId||""}`),i=`expedition-command-outcome:${Vt}:${t}`;if(Se.has(i))return Se.get(i);let s=document.createElement("canvas");s.width=256,s.height=256;let r=s.getContext("2d"),a=dd(e);r.clearRect(0,0,s.width,s.height),r.fillStyle=a.fill,r.beginPath(),r.arc(128,128,116,0,Math.PI*2),r.fill(),r.strokeStyle=a.stroke,r.lineWidth=10,r.beginPath(),r.arc(128,128,104,0,Math.PI*2),r.stroke(),r.strokeStyle="rgba(255, 248, 232, 0.78)",r.lineWidth=5,r.beginPath(),r.arc(128,128,78,0,Math.PI*2),r.stroke(),r.fillStyle="rgba(255, 248, 232, 0.88)",r.beginPath(),r.arc(128,128,42,0,Math.PI*2),r.fill(),r.strokeStyle=a.stroke,r.lineWidth=9,r.lineCap="round",r.lineJoin="round",e==="move_unit"?(r.beginPath(),r.moveTo(92,128),r.lineTo(160,128),r.moveTo(138,106),r.lineTo(160,128),r.lineTo(138,150),r.stroke()):e==="scout_sector"?(r.beginPath(),r.arc(128,128,24,0,Math.PI*2),r.moveTo(128,88),r.lineTo(128,104),r.moveTo(128,152),r.lineTo(128,168),r.moveTo(88,128),r.lineTo(104,128),r.moveTo(152,128),r.lineTo(168,128),r.stroke()):e==="prepare_settler_convoy"?(r.beginPath(),r.roundRect(92,112,72,34,9),r.stroke(),r.beginPath(),r.arc(106,158,8,0,Math.PI*2),r.arc(150,158,8,0,Math.PI*2),r.stroke()):e==="found_settlement"?(r.beginPath(),r.moveTo(96,158),r.lineTo(128,96),r.lineTo(160,158),r.stroke(),r.beginPath(),r.moveTo(108,158),r.lineTo(156,158),r.stroke()):(r.beginPath(),r.moveTo(98,130),r.lineTo(120,152),r.lineTo(164,104),r.stroke());let o=new yt(s);return o.colorSpace=qe,o.minFilter=we,o.magFilter=we,Se.set(i,o),o}function _x(n={},e=new Map){if(!n?.unitId)return[];let t=new Map,i=(r={},a="",o="")=>{let l=String(r.commandId||o||""),c=String(a||"").trim();if(!l||!c)return;let h=e.get(c);if(!h)return;let d=String(h.fogState||"");if(l==="scout_sector"){if(!(d==="hinted"&&String(h.kind||"")==="frontier_hint"))return}else if(!["discovered","known"].includes(d))return;let u=`${l}:${c}`;t.has(u)||t.set(u,{unitId:String(n.unitId||""),unitType:String(n.unitType||""),commandId:l,cellId:c,fogState:d,serverMutationImplemented:r.serverMutationImplemented===!0||l==="move_unit"&&n.movement?.movementMutationImplemented===!0,movementMutation:l==="move_unit",routeAuthority:!1,actionAuthority:!1,visualOnly:!0,readOnly:!0,source:o})};return(Array.isArray(n.commandHints)?n.commandHints:[]).filter(r=>r&&r.enabled!==!1).forEach(r=>{let a=String(r.commandId||""),o=Array.isArray(r.targetCellIds)?r.targetCellIds.map(l=>String(l||"")).filter(Boolean):[];if(a==="move_unit"){let l=Array.isArray(n.movement?.allowedTargetCellIds)?n.movement.allowedTargetCellIds.map(c=>String(c||"")).filter(Boolean):[];[...new Set([...o,...l])].forEach(c=>i(r,c,"movement"));return}o.forEach(l=>i(r,l,"command_hint"))}),Array.from(t.values())}function xx(n={},e={}){let t=Ae(n.q,0)-Ae(e.q,0),i=Ae(n.r,0)-Ae(e.r,0),s=Ae(n.q,0)+Ae(n.r,0)-(Ae(e.q,0)+Ae(e.r,0));return Math.max(Math.abs(t),Math.abs(i),Math.abs(s))}function yx(n={},e=new Map,t=[]){if(!n?.unitId||String(n.unitType||n.role||"").toLowerCase()!=="outpost_crew")return null;let i=String(n.location?.cellId||n.cellId||"").trim();if(!i)return null;let s=e.get(i);if(!s||!["discovered","known"].includes(String(s.fogState||""))||!`${s.kind||""} ${s.status||""} ${(Array.isArray(s.traits)?s.traits:[]).join(" ")}`.toLowerCase().includes("outpost"))return null;let a=t.filter(l=>String(l.fogState||"")==="hinted"&&String(l.kind||"")==="frontier_hint").filter(l=>l.readOnly!==!1).map(l=>{let c=String(l.sourceIds?.adjacentCellId||"")===i;return{cell:l,adjacentSource:c,adjacentGeometry:Bc(s,l),distance:xx(s,l)}}).filter(l=>l.adjacentSource||l.adjacentGeometry||Number.isFinite(l.distance));if(!a.length)return null;a.sort((l,c)=>l.adjacentSource!==c.adjacentSource?l.adjacentSource?-1:1:l.adjacentGeometry!==c.adjacentGeometry?l.adjacentGeometry?-1:1:l.distance-c.distance);let o=a[0].cell;return{unitId:String(n.unitId||""),unitType:String(n.unitType||""),originCellId:i,targetCellId:String(o.cellId||""),targetFogState:String(o.fogState||""),targetKind:String(o.kind||""),derivedFrom:a[0].adjacentSource?"sourceIds.adjacentCellId":"nearest_visible_hinted_frontier_cell",visualOnly:!0,readOnly:!0,selectable:!1,routeAuthority:!1,actionAuthority:!1,executableActions:0,hiddenTruthLeakage:!1}}function vx(n=!1){let e=`expedition-outpost-next-frontier:${Vt}:${n?"selected":"idle"}`;if(Se.has(e))return Se.get(e);let t=document.createElement("canvas");t.width=256,t.height=256;let i=t.getContext("2d");i.clearRect(0,0,t.width,t.height),i.fillStyle=n?"rgba(245, 212, 132, 0.22)":"rgba(255, 226, 128, 0.16)",i.beginPath(),i.arc(128,128,112,0,Math.PI*2),i.fill(),i.strokeStyle=n?"rgba(245, 212, 132, 0.92)":"rgba(209, 154, 72, 0.76)",i.lineWidth=n?12:9,i.setLineDash([18,12]),i.beginPath(),i.arc(128,128,100,0,Math.PI*2),i.stroke(),i.setLineDash([]),i.strokeStyle="rgba(27, 106, 100, 0.58)",i.lineWidth=5,i.beginPath(),i.arc(128,128,70,0,Math.PI*2),i.stroke(),i.fillStyle="rgba(255, 248, 232, 0.86)",i.beginPath(),i.moveTo(128,70),i.lineTo(148,128),i.lineTo(128,186),i.lineTo(108,128),i.closePath(),i.fill(),i.strokeStyle="rgba(46, 27, 14, 0.42)",i.lineWidth=4,i.stroke();let s=new yt(t);return s.colorSpace=qe,s.minFilter=we,s.magFilter=we,Se.set(e,s),s}function Sx(n={},e={},t=!1){let i=e.positions?.get?.(String(n.originCellId||"")),s=e.positions?.get?.(String(n.targetCellId||""));if(!i||!s)return null;let r={x:(i.x+s.x)/2,y:(i.y+s.y)/2},a=.34+Math.min(2.2,Math.hypot(s.x-i.x,s.y-i.y))*.12,o=new ci(new C(i.x,i.y+.3,.485),new C(r.x,r.y+a,.485),new C(s.x,s.y+.02,.485)),l=new ot().setFromPoints(o.getPoints(34)),c=new An(l,new xs({color:13736520,transparent:!0,opacity:t?.88:.68,dashSize:.12,gapSize:.09}));c.computeLineDistances(),c.userData={kind:"expedition_outpost_next_frontier_connection",...n};let h=new An(l.clone(),new Ot({color:16110724,transparent:!0,opacity:t?.22:.14}));h.position.z=-.01,h.userData={kind:"expedition_outpost_next_frontier_connection_glow",...n};let d=new Lt(new Pt({map:vx(t),transparent:!0,depthWrite:!1,depthTest:!0,alphaTest:.03,opacity:t?.94:.82}));d.position.set(s.x,s.y+.03,.505),d.scale.set(t?1.22:1.08,t?1.22:1.08,1),d.userData={kind:"expedition_outpost_next_frontier_beacon",...n};let u=new dn;return u.add(h,c,d),u.userData={kind:"expedition_outpost_next_frontier_group",...n},{group:u,ring:d,line:c}}function Mx(n,e="expedition-three-raycast"){let t=n?.userData||{};return{cellId:String(t.cellId||""),fogState:String(t.fogState||""),status:String(t.status||""),title:String(t.title||""),source:e,atMs:Date.now()}}var Lc=class{constructor(e){this.hostNode=e,this.model={},this.cells=[],this.info={},this.pickables=[],this.cellMeshes=[],this.unitSprites=[],this.commandTargetSprites=[],this.outcomeFeedbackSprites=[],this.eventMarkerSprites=[],this.objectiveMarkerSprites=[],this.outpostFrontierBeaconSprites=[],this.outcomeFeedback=null,this.hoverCellId="",this.terrainUnderlayCount=0,this.surveyStrokeCount=0,this.markerCount=0,this.unitTokenCount=0,this.commandTargetCount=0,this.outcomeFeedbackCount=0,this.eventMarkerCount=0,this.objectiveMarkerCount=0,this.outpostFrontierBeaconCount=0,this.scene=new hs,this.camera=new fi(-Yn/2,Yn/2,$n/2,-$n/2,.1,100),this.camera.position.set(0,0,10),this.camera.lookAt(0,0,0),this.raycaster=new vs,this.pointer=new ge,this.renderer=new Mr({antialias:!0,alpha:!1,preserveDrawingBuffer:!0}),this.renderer.setClearColor(14151135,1),this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),this.renderer.domElement.className="fp-expedition-three-canvas",this.renderer.domElement.dataset.testid="fp-expedition-three-canvas",this.renderer.domElement.setAttribute("aria-label","Zoomable private Expedition Map"),this.dragging=!1,this.dragMoved=!1,this.lastPointer=null,this.activePointers=new Map,this.pinchDistance=0,this.pinchZoom=1,this.mapBounds={minX:-1,maxX:1,minY:-1,maxY:1,centerX:0,centerY:0,width:2,height:2},this.onResize=this.onResize.bind(this),this.onWheel=this.onWheel.bind(this),this.onPointerDown=this.onPointerDown.bind(this),this.onPointerMove=this.onPointerMove.bind(this),this.onPointerUp=this.onPointerUp.bind(this),this.onPointerLeave=this.onPointerLeave.bind(this),this.onRegionTileAssetLoaded=()=>{Se.clear(),this.rebuild(),this.render()},this.disposeRegionTileAssetListener=W_(this.onRegionTileAssetLoaded),this.resizeObserver=new ResizeObserver(this.onResize),this.attach()}attach(){this.renderer.domElement.parentElement!==this.hostNode&&this.hostNode.appendChild(this.renderer.domElement),this.hostNode.addEventListener("wheel",this.onWheel,{passive:!1}),this.hostNode.addEventListener("pointerdown",this.onPointerDown),this.hostNode.addEventListener("pointermove",this.onPointerMove),this.hostNode.addEventListener("pointerup",this.onPointerUp),this.hostNode.addEventListener("pointercancel",this.onPointerUp),this.hostNode.addEventListener("pointerleave",this.onPointerLeave),this.resizeObserver.observe(this.hostNode),this.onResize()}dispose(){this.hostNode.removeEventListener("wheel",this.onWheel),this.hostNode.removeEventListener("pointerdown",this.onPointerDown),this.hostNode.removeEventListener("pointermove",this.onPointerMove),this.hostNode.removeEventListener("pointerup",this.onPointerUp),this.hostNode.removeEventListener("pointercancel",this.onPointerUp),this.hostNode.removeEventListener("pointerleave",this.onPointerLeave),this.disposeRegionTileAssetListener&&this.disposeRegionTileAssetListener(),this.resizeObserver.disconnect(),this.clearScene(),this.renderer.dispose(),this.renderer.domElement.remove()}clearScene(){this.scene.children.slice().forEach(t=>{this.scene.remove(t),t.traverse(i=>{if(i.geometry&&i.geometry.dispose(),i.material){let s=Array.isArray(i.material)?i.material:[i.material];for(let r of s)r.dispose()}})}),this.pickables=[],this.cellMeshes=[],this.unitSprites=[],this.commandTargetSprites=[],this.outcomeFeedbackSprites=[],this.eventMarkerSprites=[],this.objectiveMarkerSprites=[],this.outpostFrontierBeaconSprites=[],this.terrainUnderlayCount=0,this.surveyStrokeCount=0,this.markerCount=0,this.unitTokenCount=0,this.commandTargetCount=0,this.outcomeFeedbackCount=0,this.eventMarkerCount=0,this.objectiveMarkerCount=0,this.outpostFrontierBeaconCount=0,this.edgeFogCount=0,this.civicBeaconCount=0}onResize(){let e=this.hostNode.getBoundingClientRect(),t=Math.max(1,Math.floor(e.width)),i=Math.max(1,Math.floor(e.height));this.renderer.setSize(t,i,!1);let s=t/i,r=Yn/$n;if(s>=r){let a=$n*s;this.camera.left=a/-2,this.camera.right=a/2,this.camera.top=$n/2,this.camera.bottom=$n/-2}else{let a=Yn/s;this.camera.left=Yn/-2,this.camera.right=Yn/2,this.camera.top=a/2,this.camera.bottom=a/-2}this.applyCameraBounds(),this.render()}sync(e={},t="",i="",s=null){this.model=e&&typeof e=="object"?e:{},this.cells=Array.isArray(this.model.cells)?this.model.cells.filter(a=>a?.cellId):[],this.selectedCellId=String(t||this.selectedCellId||this.cells[0]?.cellId||"");let r=Array.isArray(this.model.units?.items)?this.model.units.items.filter(a=>a?.unitId):[];return this.selectedUnitId=String(i||this.selectedUnitId||r[0]?.unitId||""),this.outcomeFeedback=s&&typeof s=="object"?s:null,this.rebuild(),this.applyCameraBounds(),this.render(),this.info}rebuild(){this.clearScene();let e=od(this.cells);this.mapBounds=e.bounds;let t=new ht(new en(Yn*1.35,$n*1.35),new Dt({map:tx(),transparent:!1}));t.position.set(0,0,-.8),this.scene.add(t),this.terrainUnderlayCount=0;let i=ud(e),s=new ht(new en(i.width,i.height),new Dt({map:rx(this.cells,e),transparent:!0,opacity:.94,depthWrite:!1}));s.position.set(i.centerX,i.centerY,-.62),s.userData={kind:"expedition_continuous_terrain_underlay",visualOnly:!0,serverOwnedCellsOnly:!0,hiddenTruthLeakage:!1},this.terrainUnderlayCount=1,this.scene.add(s);let r=Math.max(Yn,$n),a=[];for(let x=-6;x<=6;x+=1){let M=x*.9;a.push(new C(-r,M,-.42),new C(r,M,-.42)),a.push(new C(M,-r,-.42),new C(M,r,-.42))}let o=new ds(new ot().setFromPoints(a),new Ot({color:1796708,transparent:!0,opacity:.1}));this.scene.add(o),this.edgeFogCount=0;let l=[{x:this.mapBounds.centerX,y:this.mapBounds.maxY+.52,rotation:0,width:this.mapBounds.width+2.9,kind:"soft"},{x:this.mapBounds.centerX,y:this.mapBounds.minY-.54,rotation:Math.PI,width:this.mapBounds.width+2.7,kind:"soft"},{x:this.mapBounds.minX-.56,y:this.mapBounds.centerY,rotation:Math.PI/2,width:this.mapBounds.height+2.5,kind:"locked"},{x:this.mapBounds.maxX+.62,y:this.mapBounds.centerY,rotation:-Math.PI/2,width:this.mapBounds.height+2.5,kind:"soft"}];for(let x of l){let M=new ht(new en(x.width,.64),new Dt({map:ex(x.kind),transparent:!0,opacity:x.kind==="locked"?.54:.42,depthWrite:!1}));M.position.set(x.x,x.y,-.26),M.rotation.z=x.rotation,this.edgeFogCount+=1,this.scene.add(M)}this.civicBeaconCount=0;let c=this.cells.filter(x=>["discovered","known"].includes(String(x.fogState||""))).slice(0,4);for(let x of c){let M=e.positions.get(String(x.cellId||""));if(!M)continue;let b=new Lt(new Pt({map:ax(),transparent:!0,opacity:String(x.kind||"")==="origin_plot"?.82:.56,depthWrite:!1}));b.position.set(M.x+.36,M.y+.28,.1),b.scale.set(.62,.62,1),b.userData={kind:"expedition_civic_beacon_cue",visualOnly:!0,routeAuthority:!1,cellId:String(x.cellId||"")},this.civicBeaconCount+=1,this.scene.add(b)}this.surveyStrokeCount=0;for(let x=0;x<this.cells.length;x+=1)for(let M=x+1;M<this.cells.length;M+=1){let b=this.cells[x],A=this.cells[M];if(!Bc(b,A))continue;let E=cx(b,A,e);E&&(this.surveyStrokeCount+=1,this.scene.add(E))}let h=this.cells.filter(x=>!["discovered","known"].includes(String(x.fogState||"")));for(let x of h){let M=e.positions.get(String(x.cellId||""));if(!M)continue;let b=String(x.fogState||"locked_unknown"),A=new ht(new en(b==="locked_unknown"?xn*2.06:xn*1.86,b==="locked_unknown"?xn*2.06:xn*1.86),new Dt({map:j_(b==="locked_unknown"?"locked":"hinted"),transparent:!0,opacity:b==="locked_unknown"?.34:.42,depthWrite:!1}));A.position.set(M.x,M.y,.24),this.scene.add(A)}this.markerCount=0;for(let x of this.cells){let M=e.positions.get(String(x.cellId||""))||{x:0,y:0},b=String(x.cellId||"")===this.selectedCellId,A=String(x.cellId||"")===this.hoverCellId,E=ox(x,M,b,A);this.scene.add(E),E.traverse(I=>{I.userData?.kind==="expedition_cell"&&(this.pickables.push(I),this.cellMeshes.push(I))}),this.markerCount+=1}let d=new Map(this.cells.map(x=>[String(x.cellId||""),x])),u=this.model.objective&&typeof this.model.objective=="object"?this.model.objective:null;this.eventMarkerCount=0;for(let x of Z_(this.model)){let M=hd(x),b=d.get(M),A=String(b?.fogState||"");if(!b||!["discovered","known"].includes(A))continue;let E=e.positions.get(M);if(!E)continue;let I=String(x.packetId||"")===String(u?.packetId||"")||String(M)===String(this.selectedCellId||""),y=Ni.event_packet,w=new Lt(new Pt({map:J_(x,I),transparent:!0,depthWrite:!1,depthTest:!0,alphaTest:.03}));w.position.set(E.x-.36,E.y+.35,.47),w.scale.set(I?.48:.4,I?.48:.4,1),w.userData={kind:"expedition_event_packet_marker",packetId:String(x.packetId||""),cellId:M,templateId:String(x.templateId||x.kind||""),spriteAssetSlot:String(y.slot||""),spriteAssetPath:String(y.path||""),spriteAssetReady:!!As(y),visualOnly:!0,readOnly:!0,selectable:!0,inspectable:!0,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.pickables.push(w),this.eventMarkerSprites.push(w),this.eventMarkerCount+=1,this.scene.add(w)}if(this.objectiveMarkerCount=0,u&&String(u.mode||"read")!=="read"&&u.targetCellId){let x=String(u.targetCellId||""),M=d.get(x),b=e.positions.get(x);if(M&&b){let A=x===String(this.selectedCellId||""),E=String(u.mode||"")==="packet"?Ni.event_packet:Ni.objective_beacon,I=new Lt(new Pt({map:K_(u,A),transparent:!0,depthWrite:!1,depthTest:!0,alphaTest:.03}));I.position.set(b.x+.38,b.y+.41,.5),I.scale.set(A?.56:.48,A?.56:.48,1),I.userData={kind:"expedition_objective_marker",mode:String(u.mode||""),cellId:x,targetCellId:x,packetId:String(u.packetId||""),spriteAssetSlot:String(E.slot||""),spriteAssetPath:String(E.path||""),spriteAssetReady:!!As(E),visualOnly:!0,readOnly:!0,selectable:!0,inspectable:!0,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.pickables.push(I),this.objectiveMarkerSprites.push(I),this.objectiveMarkerCount=1,this.scene.add(I)}}let f=Array.isArray(this.model.units?.items)?this.model.units.items.filter(x=>x?.unitId):[],g=f.find(x=>String(x.unitId||"")===String(this.selectedUnitId||""))||null;this.outpostFrontierBeaconCount=0;let S=yx(g||{},d,this.cells);if(S){let x=Sx(S,e,String(S.targetCellId||"")===String(this.selectedCellId||""));x?.group&&(this.outpostFrontierBeaconSprites.push(x.ring),this.outpostFrontierBeaconCount=1,this.scene.add(x.group))}this.commandTargetCount=0;for(let x of _x(g||{},d)){let M=e.positions.get(String(x.cellId||""));if(!M)continue;let b=new Lt(new Pt({map:mx(x),transparent:!0,depthWrite:!1,depthTest:!0,alphaTest:.03,opacity:x.commandId==="scout_sector"?.92:.84}));b.position.set(M.x,M.y+.05,.515),b.scale.set(x.commandId==="scout_sector"?1.34:1.2,x.commandId==="scout_sector"?1.34:1.2,1),b.userData={kind:"expedition_command_target",unitId:x.unitId,unitType:x.unitType,commandId:x.commandId,cellId:x.cellId,fogState:x.fogState,serverMutationImplemented:x.serverMutationImplemented===!0,movementMutation:x.movementMutation===!0,visualOnly:!0,readOnly:!0,previewOnly:!0,selectable:!0,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.pickables.push(b),this.commandTargetSprites.push(b),this.commandTargetCount+=1,this.scene.add(b)}let p=this.outcomeFeedback;if(p?.cellId){let x=e.positions.get(String(p.cellId||""));if(x){let M=new Lt(new Pt({map:gx(p),transparent:!0,depthWrite:!1,depthTest:!0,alphaTest:.03,opacity:.92}));M.position.set(x.x,x.y+.05,.535),M.scale.set(1.48,1.48,1),M.userData={kind:"expedition_command_outcome_feedback",feedbackId:String(p.feedbackId||""),commandId:String(p.commandId||""),unitId:String(p.unitId||""),unitType:String(p.unitType||""),cellId:String(p.cellId||""),targetCellId:String(p.targetCellId||p.cellId||""),sourceCellId:String(p.sourceCellId||""),receiptId:String(p.receiptId||""),receiptKind:String(p.receiptKind||""),serverOwnedResult:p.serverOwnedResult===!0,visualOnly:!0,readOnly:!0,selectable:!1,routeAuthority:!1,actionAuthority:!1,executableActions:0},this.outcomeFeedbackSprites.push(M),this.outcomeFeedbackCount=1,this.scene.add(M)}}this.unitTokenCount=0;let m=f.reduce((x,M)=>{let b=String(M.location?.cellId||"");return b&&(x[b]||(x[b]=[]),x[b].push(M)),x},{});for(let[x,M]of Object.entries(m)){let b=e.positions.get(x);b&&M.forEach((A,E)=>{let I=String(A.unitId||"")===this.selectedUnitId,y=ld(A),w=!!As(y),F=E/Math.max(1,M.length)*Math.PI*2-Math.PI/2,R=M.length>1?.26:0,O=new Lt(new Pt({map:ux(A,I),transparent:!0,depthWrite:!1,depthTest:!0,alphaTest:.03}));O.position.set(b.x+Math.cos(F)*R,b.y+.44+Math.sin(F)*R*.36,.54+E*.01);let G=I?.72:.58;O.scale.set(G,G,1),O.userData={kind:"expedition_unit",unitId:String(A.unitId||""),unitType:String(A.unitType||""),displayName:String(A.displayName||""),cellId:x,spriteAssetSlot:String(y?.slot||""),spriteAssetPath:String(y?.path||""),spriteAssetReady:w,selectable:A.selectable!==!1,readOnly:A.readOnly!==!1,movementMutationImplemented:A.movement?.movementMutationImplemented===!0},this.pickables.push(O),this.unitSprites.push(O),this.unitTokenCount+=1,this.scene.add(O)})}this.updateInfo()}visibleSize(){return{width:Math.max(.01,(this.camera.right-this.camera.left)/this.camera.zoom),height:Math.max(.01,(this.camera.top-this.camera.bottom)/this.camera.zoom)}}applyCameraBounds(){let t=this.visibleSize(),i=this.mapBounds.minX-.85,s=this.mapBounds.maxX+.85,r=this.mapBounds.minY-.85,a=this.mapBounds.maxY+.85,o=Math.max(.01,s-i),l=Math.max(.01,a-r);this.camera.position.x=t.width>=o?(i+s)/2:qt(this.camera.position.x,i+t.width/2,s-t.width/2),this.camera.position.y=t.height>=l?(r+a)/2:qt(this.camera.position.y,r+t.height/2,a-t.height/2),this.camera.zoom=qt(this.camera.zoom,.85,3.4),this.camera.updateProjectionMatrix()}setZoom(e){this.camera.zoom=qt(e,.85,3.4),this.applyCameraBounds(),this.render(),this.notifyViewChange()}resetView(){this.camera.zoom=1,this.camera.position.x=this.mapBounds.centerX,this.camera.position.y=this.mapBounds.centerY,this.applyCameraBounds(),this.render(),this.notifyViewChange()}panBy(e,t){let i=this.renderer.domElement.getBoundingClientRect(),s=this.visibleSize();this.camera.position.x-=e/Math.max(1,i.width)*s.width,this.camera.position.y+=t/Math.max(1,i.height)*s.height,this.applyCameraBounds(),this.render(),this.notifyViewChange()}notifyViewChange(){this.hostNode.dispatchEvent(new CustomEvent("founders-plot-expedition-map-view-change"))}onWheel(e){e.preventDefault();let t=e.deltaY<0?1.13:1/1.13;this.setZoom(this.camera.zoom*t)}onPointerDown(e){this.activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});try{this.hostNode.setPointerCapture?.(e.pointerId)}catch{}if(this.dragging=!0,this.dragMoved=!1,this.lastPointer={x:e.clientX,y:e.clientY},this.hostNode.dataset.dragging="true",this.activePointers.size>=2){let t=Array.from(this.activePointers.values());this.pinchDistance=Math.hypot(t[0].x-t[1].x,t[0].y-t[1].y),this.pinchZoom=this.camera.zoom}}onPointerMove(e){if(!this.activePointers.has(e.pointerId)){this.setHoverFromPoint(e.clientX,e.clientY);return}let t=this.activePointers.get(e.pointerId);if(this.activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY}),this.activePointers.size>=2){let r=Array.from(this.activePointers.values()),a=Math.hypot(r[0].x-r[1].x,r[0].y-r[1].y);this.pinchDistance>0&&this.setZoom(this.pinchZoom*(a/this.pinchDistance)),this.dragMoved=!0;return}let i=e.clientX-t.x,s=e.clientY-t.y;Math.abs(i)+Math.abs(s)>1&&(this.dragMoved=this.dragMoved||Math.abs(e.clientX-(this.lastPointer?.x||e.clientX))+Math.abs(e.clientY-(this.lastPointer?.y||e.clientY))>4,this.panBy(i,s))}onPointerLeave(){this.setHoverCell("")}onPointerUp(e){let t=this.dragging&&!this.dragMoved&&this.activePointers.size<=1;this.activePointers.delete(e.pointerId);try{this.hostNode.releasePointerCapture?.(e.pointerId)}catch{}if(this.dragging=this.activePointers.size>0,this.dragging||(delete this.hostNode.dataset.dragging,this.pinchDistance=0),t){let i=this.pickFromPoint(e.clientX,e.clientY);if(i)if(i.userData?.kind==="expedition_unit"){let s=dx(i);this.selectedUnitId=s.unitId,s.cellId&&(this.selectedCellId=s.cellId),s.cellId&&this.setHoverCell(s.cellId),window.dispatchEvent(new CustomEvent("founders-plot-expedition-unit-select",{detail:s}))}else if(["expedition_event_packet_marker","expedition_objective_marker"].includes(String(i.userData?.kind||""))){let s=fx(i);s.cellId&&(this.selectedCellId=s.cellId),s.cellId&&this.setHoverCell(s.cellId),window.dispatchEvent(new CustomEvent("founders-plot-expedition-map-select",{detail:s}))}else if(i.userData?.kind==="expedition_command_target"){let s=px(i);s.cellId&&(this.selectedCellId=s.cellId),s.cellId&&this.setHoverCell(s.cellId),window.dispatchEvent(new CustomEvent("founders-plot-expedition-command-target-preview",{detail:s}))}else{let s=Mx(i);this.selectedCellId=s.cellId,this.setHoverCell(s.cellId),window.dispatchEvent(new CustomEvent("founders-plot-expedition-map-select",{detail:s}))}}}setHoverFromPoint(e,t){let i=this.pickFromPoint(e,t);this.setHoverCell(i?.userData?.cellId||i?.userData?.targetCellId||"")}setHoverCell(e=""){let t=String(e||"");t!==this.hoverCellId&&(this.hoverCellId=t,t?this.hostNode.dataset.hoverCellId=t:delete this.hostNode.dataset.hoverCellId,this.rebuild(),this.render())}pickFromPoint(e,t){let i=this.renderer.domElement.getBoundingClientRect();return this.pointer.x=(e-i.left)/i.width*2-1,this.pointer.y=-((t-i.top)/i.height)*2+1,this.raycaster.setFromCamera(this.pointer,this.camera),this.raycaster.intersectObjects(this.pickables,!1)[0]?.object||null}canvasPointForCell(e){let t=this.cellMeshes.find(i=>String(i.userData?.cellId||"")===String(e||""));return t?this.canvasPointForObject(t):null}canvasPointForObject(e){if(!e)return null;let t=new C;e.getWorldPosition(t),t.project(this.camera);let i=this.renderer.domElement.getBoundingClientRect();return{x:(t.x+1)/2*i.width,y:(-t.y+1)/2*i.height}}updateInfo(){let e=this.renderer.domElement,t=this.cells.map(r=>{let a=String(r.fogState||"locked_unknown"),o=Jn(r),l=H_(r),c=Uc(r,o),h=As(c),d=Ho(r,o),u=Ar(r),f=Si(r)?null:Nc(r);return{cellId:String(r.cellId||""),fogState:a,siteType:String(r.siteType||""),kind:String(r.kind||""),publicTerrainText:l,publicTerrainAssetSlot:u,publicTerrainAssetSlotSource:String(r.publicTerrainAssetSlotSource||""),publicTerrainAssetSlotReason:String(r.publicTerrainAssetSlotReason||""),fogAssetSlot:f,terrainAssetContractVersion:String(r.terrainAssetContractVersion||""),terrain:o,runtimeAssetPack:Yu,assetSlot:c?.slot||null,assetPath:c?.path||null,assetKind:c?.assetKind||null,fogOnly:c?.fogOnly===!0,assetReady:!!h,assetAllowedByServerTruth:G_(r,o,c),underlayTerrain:d.terrain,underlayFogOnly:d.fogOnly===!0,waterCue:o==="water",ruinSignalCue:o==="ruin_signal",hiddenSpecificitySuppressed:!Si(r)&&o===a}}),i=Array.from(new Map([...Object.values(ad),...Object.values(Ni)].map(r=>[r.path,r])).values()),s=i.filter(r=>!!qo(r)).length;return this.info={renderer:"three.js",surface:"expedition-map",projectionHash:String(this.model?.projectionHash||""),canvasWidth:e.width,canvasHeight:e.height,cellCount:this.cells.length,selectedCellId:String(this.selectedCellId||""),hoverCellId:String(this.hoverCellId||""),zoom:Number(this.camera.zoom.toFixed(3)),visualShell:Vt,visualLayers:{terrainTexture:!0,runtimeRegionAssetPack:Yu,runtimeRegionAtlas:`${vi}/manifest.json`,runtimeTerrainUnderlay:rd.path,runtimeSpriteAssetPack:L_,runtimeSpriteAtlas:`${Ln}/manifest.json`,generatedSpriteAssets:!0,generatedSpriteAssetCount:i.length,generatedSpriteAssetsReady:s,generatedSpriteAssetsVisualOnly:!0,generatedSpriteAssetsReadOnly:!0,serverTerrainAssetContractVersion:Ac,serverTerrainSlotSource:Cc,assetBackedRegionTiles:t.filter(r=>r.assetPath).length,assetBackedLoadedTiles:t.filter(r=>r.assetReady).length,assetBackedTerrainTextures:!0,continuousTerrainUnderlay:!0,continuousTerrainUnderlayVersion:Vt,continuousUnderlayUsesServerOwnedCells:!0,continuousUnderlayHiddenCellsFogOnly:t.filter(r=>!["discovered","known"].includes(r.fogState)).every(r=>r.underlayFogOnly&&r.underlayTerrain===r.fogState),continuousUnderlayVisualOnly:!0,plateBlendLayer:!0,softRegionSeams:!0,reducedPlateEdgeContrast:!0,centerTileMutedForUnderlay:!0,cartographicFogDepth:!0,ambientContourField:!0,fogDepthGlyphsVisualOnly:!0,terrainUnderlayCount:this.terrainUnderlayCount,proceduralFallbackWhenAssetPending:!0,candidate02Cues:!0,agentTownIdentityCues:!0,scoutLedgerHud:!0,mapFirstHudOverlays:!0,hoverAffordance:!0,selectedSectorOutline:!0,beaconPlanWagonCues:!0,homeNodeEmphasis:!0,riverFlatCues:!0,waterCuesServerGated:!0,woodlandRidgeCues:!0,ruinSignalCues:!0,ruinSignalCuesServerGated:!0,lockedUnknownSealedFogOnly:!0,hintedAbstractFogEdge:!0,frontierBoundaryDashes:!0,frontierBoundaryVisualOnly:!0,fogVeils:this.cells.filter(r=>!["discovered","known"].includes(String(r.fogState||""))).length,edgeFogCount:this.edgeFogCount,civicBeaconCount:this.civicBeaconCount,surveyStrokeCount:this.surveyStrokeCount,surveyStrokesVisualOnly:!0,receiptTraceVisualOnly:!0,markerCount:this.markerCount,eventPacketMarkers:!0,eventPacketMarkerCount:this.eventMarkerCount,objectiveMarkers:!0,objectiveMarkerCount:this.objectiveMarkerCount,eventObjectiveMarkersVisualOnly:[...this.eventMarkerSprites,...this.objectiveMarkerSprites].every(r=>r.userData?.visualOnly===!0),eventObjectiveMarkersReadOnly:[...this.eventMarkerSprites,...this.objectiveMarkerSprites].every(r=>r.userData?.readOnly===!0),eventObjectiveMarkersInspectable:[...this.eventMarkerSprites,...this.objectiveMarkerSprites].every(r=>r.userData?.selectable===!0&&r.userData?.inspectable===!0),eventObjectiveMarkerAuthority:!1,outpostNextFrontierBeacon:!0,outpostNextFrontierBeaconCount:this.outpostFrontierBeaconCount,outpostNextFrontierBeaconVisualOnly:this.outpostFrontierBeaconSprites.every(r=>r.userData?.visualOnly===!0),outpostNextFrontierBeaconReadOnly:this.outpostFrontierBeaconSprites.every(r=>r.userData?.readOnly===!0),outpostNextFrontierBeaconSelectable:this.outpostFrontierBeaconSprites.some(r=>r.userData?.selectable===!0),outpostNextFrontierBeaconAuthority:!1,outpostNextFrontierBeaconHiddenTruthLeakage:this.outpostFrontierBeaconSprites.some(r=>r.userData?.hiddenTruthLeakage===!0),unitTokens:!0,unitTokenCount:this.unitTokenCount,unitTokensReadOnly:this.unitSprites.every(r=>r.userData?.readOnly===!0),unitMovementMutationImplemented:this.unitSprites.some(r=>r.userData?.movementMutationImplemented===!0),commandTargetRings:!0,commandTargetCount:this.commandTargetCount,commandTargetRingsVisualOnly:this.commandTargetSprites.every(r=>r.userData?.visualOnly===!0),commandTargetRingsReadOnly:this.commandTargetSprites.every(r=>r.userData?.readOnly===!0),commandTargetRingsSelectable:this.commandTargetSprites.every(r=>r.userData?.selectable===!0),commandTargetRingsPreviewOnly:this.commandTargetSprites.every(r=>r.userData?.previewOnly===!0),commandTargetRingAuthority:!1,commandOutcomeFeedback:this.outcomeFeedbackCount>0,commandOutcomeFeedbackCount:this.outcomeFeedbackCount,commandOutcomeFeedbackVisualOnly:this.outcomeFeedbackSprites.every(r=>r.userData?.visualOnly===!0),commandOutcomeFeedbackReadOnly:this.outcomeFeedbackSprites.every(r=>r.userData?.readOnly===!0),commandOutcomeFeedbackServerOwned:this.outcomeFeedbackSprites.every(r=>r.userData?.serverOwnedResult===!0),commandOutcomeFeedbackSelectable:this.outcomeFeedbackSprites.some(r=>r.userData?.selectable===!0),commandOutcomeFeedbackAuthority:!1,clientAuthority:!1},regionConsistency:{waterCueCells:t.filter(r=>r.waterCue).map(r=>r.cellId),ruinSignalCueCells:t.filter(r=>r.ruinSignalCue).map(r=>r.cellId),lockedUnknownCellsSealed:t.filter(r=>r.fogState==="locked_unknown").every(r=>r.hiddenSpecificitySuppressed&&!r.waterCue&&!r.ruinSignalCue),hintedCellsAbstract:t.filter(r=>r.fogState==="hinted").every(r=>r.hiddenSpecificitySuppressed&&!r.waterCue&&!r.ruinSignalCue),waterCuesRequireServerOwnedWater:t.filter(r=>r.waterCue).every(r=>r.publicTerrainAssetSlot==="water"),waterCoastRuntimeAssetsBlocked:t.every(r=>!["water","coast"].includes(String(r.assetSlot||""))),hiddenCellsHaveNoPublicTerrainSlot:t.filter(r=>!["discovered","known"].includes(r.fogState)).every(r=>r.publicTerrainAssetSlot==null),hiddenCellsUseOnlyFogAssets:t.filter(r=>!["discovered","known"].includes(r.fogState)).every(r=>["hinted_frontier_fog","locked_unknown_fog"].includes(String(r.assetSlot||""))&&r.fogOnly===!0&&r.assetKind==="fog_only"),knownDiscoveredAssetsMatchServerTerrain:t.filter(r=>["discovered","known"].includes(r.fogState)&&r.assetPath).every(r=>r.assetAllowedByServerTruth===!0),visibleAssetsMatchPublicTerrainSlot:t.filter(r=>["discovered","known"].includes(r.fogState)&&r.assetPath).every(r=>r.assetSlot===r.publicTerrainAssetSlot&&r.assetKind==="concrete_public_terrain"),serverTerrainAssetContractComplete:t.every(r=>r.terrainAssetContractVersion===Ac&&(["discovered","known"].includes(r.fogState)?r.publicTerrainAssetSlotSource===Cc:r.fogAssetSlot!=null)),runtimeAssetProofMetadataComplete:t.filter(r=>r.assetPath).every(r=>r.cellId&&r.fogState&&r.runtimeAssetPack&&r.assetSlot&&r.assetKind&&typeof r.assetAllowedByServerTruth=="boolean"),runtimeAssetCellsRegionTruthBound:t.filter(r=>r.assetPath).every(r=>r.assetAllowedByServerTruth===!0),continuousUnderlayHiddenCellsFogOnly:t.filter(r=>!["discovered","known"].includes(r.fogState)).every(r=>r.underlayFogOnly&&r.underlayTerrain===r.fogState),continuousUnderlayNoActionAuthority:this.terrainUnderlayCount===1},regionVisuals:t,eventMarkers:this.eventMarkerSprites.map(r=>({packetId:String(r.userData?.packetId||""),cellId:String(r.userData?.cellId||""),templateId:String(r.userData?.templateId||""),spriteAssetSlot:String(r.userData?.spriteAssetSlot||""),spriteAssetPath:String(r.userData?.spriteAssetPath||""),spriteAssetReady:r.userData?.spriteAssetReady===!0,visualOnly:r.userData?.visualOnly===!0,readOnly:r.userData?.readOnly===!0,selectable:r.userData?.selectable===!0,inspectable:r.userData?.inspectable===!0,routeAuthority:r.userData?.routeAuthority===!0,actionAuthority:r.userData?.actionAuthority===!0,executableActions:Number(r.userData?.executableActions||0),canvas:this.canvasPointForObject(r)})),objectiveMarkers:this.objectiveMarkerSprites.map(r=>({mode:String(r.userData?.mode||""),targetCellId:String(r.userData?.targetCellId||""),packetId:String(r.userData?.packetId||""),spriteAssetSlot:String(r.userData?.spriteAssetSlot||""),spriteAssetPath:String(r.userData?.spriteAssetPath||""),spriteAssetReady:r.userData?.spriteAssetReady===!0,visualOnly:r.userData?.visualOnly===!0,readOnly:r.userData?.readOnly===!0,selectable:r.userData?.selectable===!0,inspectable:r.userData?.inspectable===!0,routeAuthority:r.userData?.routeAuthority===!0,actionAuthority:r.userData?.actionAuthority===!0,executableActions:Number(r.userData?.executableActions||0),canvas:this.canvasPointForObject(r)})),outpostNextFrontierBeacons:this.outpostFrontierBeaconSprites.map(r=>({unitId:String(r.userData?.unitId||""),unitType:String(r.userData?.unitType||""),originCellId:String(r.userData?.originCellId||""),targetCellId:String(r.userData?.targetCellId||""),targetFogState:String(r.userData?.targetFogState||""),targetKind:String(r.userData?.targetKind||""),derivedFrom:String(r.userData?.derivedFrom||""),visualOnly:r.userData?.visualOnly===!0,readOnly:r.userData?.readOnly===!0,selectable:r.userData?.selectable===!0,routeAuthority:r.userData?.routeAuthority===!0,actionAuthority:r.userData?.actionAuthority===!0,executableActions:Number(r.userData?.executableActions||0),hiddenTruthLeakage:r.userData?.hiddenTruthLeakage===!0,canvas:this.canvasPointForObject(r)})),units:this.unitSprites.map(r=>({unitId:String(r.userData?.unitId||""),unitType:String(r.userData?.unitType||""),displayName:String(r.userData?.displayName||""),cellId:String(r.userData?.cellId||""),spriteAssetSlot:String(r.userData?.spriteAssetSlot||""),spriteAssetPath:String(r.userData?.spriteAssetPath||""),spriteAssetReady:r.userData?.spriteAssetReady===!0,selected:String(r.userData?.unitId||"")===String(this.selectedUnitId||""),readOnly:r.userData?.readOnly===!0,movementMutationImplemented:r.userData?.movementMutationImplemented===!0,canvas:this.canvasPointForObject(r)})),commandTargets:this.commandTargetSprites.map(r=>({unitId:String(r.userData?.unitId||""),unitType:String(r.userData?.unitType||""),commandId:String(r.userData?.commandId||""),cellId:String(r.userData?.cellId||""),fogState:String(r.userData?.fogState||""),serverMutationImplemented:r.userData?.serverMutationImplemented===!0,movementMutation:r.userData?.movementMutation===!0,visualOnly:r.userData?.visualOnly===!0,readOnly:r.userData?.readOnly===!0,previewOnly:r.userData?.previewOnly===!0,selectable:r.userData?.selectable===!0,routeAuthority:r.userData?.routeAuthority===!0,actionAuthority:r.userData?.actionAuthority===!0,executableActions:Number(r.userData?.executableActions||0),canvas:this.canvasPointForObject(r)})),commandOutcomeFeedback:this.outcomeFeedbackSprites.map(r=>({feedbackId:String(r.userData?.feedbackId||""),unitId:String(r.userData?.unitId||""),unitType:String(r.userData?.unitType||""),commandId:String(r.userData?.commandId||""),cellId:String(r.userData?.cellId||""),targetCellId:String(r.userData?.targetCellId||""),sourceCellId:String(r.userData?.sourceCellId||""),receiptId:String(r.userData?.receiptId||""),receiptKind:String(r.userData?.receiptKind||""),serverOwnedResult:r.userData?.serverOwnedResult===!0,visualOnly:r.userData?.visualOnly===!0,readOnly:r.userData?.readOnly===!0,selectable:r.userData?.selectable===!0,routeAuthority:r.userData?.routeAuthority===!0,actionAuthority:r.userData?.actionAuthority===!0,executableActions:Number(r.userData?.executableActions||0),canvas:this.canvasPointForObject(r)})),camera:{x:Number(this.camera.position.x.toFixed(3)),y:Number(this.camera.position.y.toFixed(3)),zoom:Number(this.camera.zoom.toFixed(3))},bounds:{minX:Number(this.mapBounds.minX.toFixed(3)),maxX:Number(this.mapBounds.maxX.toFixed(3)),minY:Number(this.mapBounds.minY.toFixed(3)),maxY:Number(this.mapBounds.maxY.toFixed(3))},fogStates:this.cells.reduce((r,a)=>{let o=String(a.fogState||"locked_unknown");return r[o]=Number(r[o]||0)+1,r},{}),pickTargets:this.cells.map(r=>({cellId:String(r.cellId||""),fogState:String(r.fogState||""),terrain:Jn(r),status:String(r.status||""),title:String(r.title||""),canvas:this.canvasPointForCell(r.cellId)}))},this.info}render(){this.updateInfo(),this.renderer.render(this.scene,this.camera)}};function bx(n,e,t){let i=Ec.get(n);return i||(i=new wc(n),Ec.set(n,i)),i.attach(e),i.sync(t||{}),i.info}function Tx(n){let e=Ec.get(n);return e?e.updateInfo():null}function Ex(n,e={},t={}){let i=Oi.get(n);return i||(i=new Lc(n),Oi.set(n,i)),i.sync(e||{},t.selectedCellId||"",t.selectedUnitId||"",t.outcomeFeedback||null)}function wx(n){let e=Oi.get(n);return e?e.updateInfo():null}function Ax(n,e=1){let t=Oi.get(n);return t?(t.setZoom(t.camera.zoom*Ae(e,1)),t.updateInfo()):null}function Cx(n){let e=Oi.get(n);return e?(e.resetView(),e.updateInfo()):null}function Rx(n){let e=Oi.get(n);e&&(e.dispose(),Oi.delete(n))}window.FoundersPlotThreeRenderer={renderPlotScene:bx,getPlotSceneInfo:Tx,renderExpeditionMap:Ex,getExpeditionMapInfo:wx,zoomExpeditionMap:Ax,resetExpeditionMapCamera:Cx,disposeExpeditionMap:Rx};})();
