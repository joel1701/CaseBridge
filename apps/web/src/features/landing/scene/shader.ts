// Monsoon sky over a cable-stayed bridge. Copied verbatim from docs/design/setu-landing.html.
export const vertexShader =
  'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';

export const fragmentShader = `precision highp float;uniform vec2 r;uniform float t;uniform float rx;
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
    float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<6;i++){v+=a*n(p);p*=2.03;a*=.5;}return v;}
    float seg(vec2 p,vec2 a,vec2 b){vec2 pa=p-a,ba=b-a;float k=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*k);}
    void main(){
      vec2 uv=gl_FragCoord.xy/r;float asp=r.x/r.y;vec2 p=vec2(uv.x*asp,uv.y);
      float hz=.30;
      vec3 top=vec3(.06,.07,.18),mid=vec3(.17,.21,.62),glow=vec3(.66,.70,1.);
      float y=(uv.y-hz)/(1.-hz);
      vec3 sky=mix(glow,mid,smoothstep(0.,.45,y));sky=mix(sky,top,smoothstep(.4,1.,y));
      float c=fbm(vec2(p.x*1.6+t*.025,p.y*2.6-t*.01));float c2=fbm(vec2(p.x*3.2-t*.04,p.y*4.)+c);
      float cl=smoothstep(.42,.78,c*.7+c2*.45);
      vec3 cloud=mix(vec3(.08,.09,.2),vec3(.32,.35,.7),c2);
      sky=mix(sky,cloud,cl*smoothstep(.02,.35,y)*.92);
      float rays=pow(max(0.,1.-abs(uv.x-.62)*2.2),3.)*smoothstep(.1,.6,y)*(1.-cl)*.25;sky+=glow*rays;
      vec3 col=sky;
      if(uv.y<hz){
        vec2 q=vec2(uv.x,hz+(hz-uv.y)*1.4+.012*sin(uv.x*90.+t*1.6+uv.y*240.));
        float yy=(q.y-hz)/(1.-hz);vec3 ref=mix(glow,mid,smoothstep(0.,.45,yy));
        col=mix(vec3(.04,.05,.12),ref*.55,smoothstep(0.,hz,uv.y)*.9);
        col+=glow*.12*smoothstep(.6,1.,n(vec2(uv.x*60.,uv.y*400.+t*2.)));
      }
      float rain=smoothstep(.985,1.,n(vec2((p.x+p.y*.28)*140.,p.y*6.+t*9.)));col=mix(col,vec3(.85,.88,1.),rain*.35);
      vec3 ink=vec3(.03,.035,.06);
      float deck=hz+.06;float w=asp;
      float d=abs(p.y-deck)-.007;
      vec2 P1=vec2(w*.34,deck),P2=vec2(w*.70,deck);float ph=.34;
      d=min(d,max(abs(p.x-P1.x)-.006,abs(p.y-(deck+ph*.5-.03))-ph*.5-.03));
      d=min(d,max(abs(p.x-P2.x)-.006,abs(p.y-(deck+ph*.5-.03))-ph*.5-.03));
      for(int k=1;k<=9;k++){float fk=float(k)*.034;
        d=min(d,seg(p,P1+vec2(0.,ph-fk*.6),vec2(P1.x-fk*1.15,deck))-.0012);
        d=min(d,seg(p,P1+vec2(0.,ph-fk*.6),vec2(P1.x+fk*1.15,deck))-.0012);
        d=min(d,seg(p,P2+vec2(0.,ph-fk*.6),vec2(P2.x-fk*1.15,deck))-.0012);
        d=min(d,seg(p,P2+vec2(0.,ph-fk*.6),vec2(P2.x+fk*1.15,deck))-.0012);}
      col=mix(ink,col,smoothstep(0.,.0025,d));
      for(int k=0;k<7;k++){float fk=float(k);float sp=.05+.03*h(vec2(fk,3.));float x=fk==3.?rx*w:fract(h(vec2(fk,1.))+t*sp*(mod(fk,2.)<1.?1.:-1.))*w;
        float l=length((p-vec2(x,deck+.012))*vec2(1.,1.6));
        vec3 lc=fk==3.?vec3(1.,.36,.42):vec3(.78,.82,1.);col+=lc*smoothstep(.012,0.,l)*.9+lc*smoothstep(.06,0.,l)*.12;}
      col+=(h(gl_FragCoord.xy+t)-.5)*.03;
      gl_FragColor=vec4(col,1.);}`;
