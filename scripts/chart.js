// scripts/chart.js
function getParam(name, fallback){ const u=new URLSearchParams(location.search); return u.get(name)||fallback; }
const elMarket=document.getElementById('market'); const elSymbol=document.getElementById('symbol'); const elInterval=document.getElementById('interval');
const elLoad=document.getElementById('loadBtn'); const elStatus=document.getElementById('status'); const container=document.getElementById('chart'); const overlay=document.getElementById('overlay');

elMarket.value=getParam('market','futures'); elSymbol.value=getParam('symbol','SOLUSDT'); elInterval.value=getParam('interval','1h');

let chart, candleSeries, smaSeries, emaSeries, rsiSeries, vwapSeries, atrSeries, stochSeries;
let ws=null; let candles=[];

const SMA=(arr,L)=>{const out=Array(arr.length).fill(null);let s=0;for(let i=0;i<arr.length;i++){s+=arr[i];if(i>=L)s-=arr[i-L];if(i>=L-1)out[i]=+(s/L).toFixed(6);}return out;};
const EMA=(arr,L)=>{const out=Array(arr.length).fill(null);const k=2/(L+1);let p=null;for(let i=0;i<arr.length;i++){const x=arr[i];p=p===null?x:x*k+p*(1-k);if(i>=L-1)out[i]=+p.toFixed(6);}return out;};
function RSI(close,L=14){const out=Array(close.length).fill(null);let g=0,l=0;for(let i=1;i<close.length;i++){const ch=close[i]-close[i-1];if(i<=L){if(ch>0)g+=ch;else l-=ch;if(i===L){const rs=g/(l||1e-9);out[i]=+(100-100/(1+rs)).toFixed(2);}}else{const up=Math.max(0,ch),dn=Math.max(0,-ch);g=(g*(L-1)+up)/L;l=(l*(L-1)+dn)/L;const rs=g/(l||1e-9);out[i]=+(100-100/(1+rs)).toFixed(2);}}return out;}
function VWAP(cs){let pv=0,vv=0;return cs.map(c=>{const tp=(c.high+c.low+c.close)/3;pv+=tp*(c.volume||0);vv+=(c.volume||0);return vv?+(pv/vv).toFixed(6):null;});}
function ATR(cs,L=14){const tr=cs.map((c,i)=>i?Math.max(c.high-c.low,Math.abs(c.high-cs[i-1].close),Math.abs(c.low-cs[i-1].close)):c.high-c.low);const out=Array(cs.length).fill(null);let s=0;for(let i=0;i<tr.length;i++){if(i<L)s+=tr[i];if(i===L){out[i]=+(s/L).toFixed(6);}if(i>L){out[i]=+(((out[i-1]*(L-1))+tr[i])/L).toFixed(6);} }return out;}
function STOCH(cs,L=14,S=3){const k=Array(cs.length).fill(null);for(let i=L-1;i<cs.length;i++){let hh=-Infinity,ll=Infinity;for(let j=i-L+1;j<=i;j++){hh=Math.max(hh,cs[j].high);ll=Math.min(ll,cs[j].low);}const cl=cs[i].close;const kv=((cl-ll)/(hh-ll||1e-9))*100;k[i]=+kv.toFixed(2);}const d=SMA(k.map(v=>v??0),S).map((v,i)=>k[i]==null?null:+(v??null));return {k,d};}
function detectOB(cs,lookback=100){let bull=null,bear=null;for(let i=cs.length-2;i>=Math.max(1,cs.length-lookback);i--){const c=cs[i];const body=Math.abs(c.close-c.open);const range=c.high-c.low||1e-9;const wide=body/range>0.6;if(!bull&&c.close>c.open&&wide) bull={index:i,high:c.high,low:c.low,o:c.open,c:c.close}; if(!bear&&c.close<c.open&&wide) bear={index:i,high:c.high,low:c.low,o:c.open,c:c.close}; if(bull&&bear) break;} return {bull,bear};}

function buildChart(){ if(chart) chart.remove(); chart=LightweightCharts.createChart(container,{layout:{background:{color:'#0b0f14'},textColor:'#e6e9ef'},grid:{vertLines:{color:'#1f2937'},horzLines:{color:'#1f2937'}},timeScale:{timeVisible:true,secondsVisible:false,borderColor:'#233043'},rightPriceScale:{borderColor:'#233043'},crosshair:{mode:1}});
  candleSeries=chart.addCandlestickSeries({upColor:'#10b981',downColor:'#ef4444',borderUpColor:'#10b981',borderDownColor:'#ef4444',wickUpColor:'#10b981',wickDownColor:'#ef4444'});
  smaSeries=chart.addLineSeries({color:'#94a3b8',lineWidth:2}); emaSeries=chart.addLineSeries({color:'#d4af37',lineWidth:2}); rsiSeries=chart.addLineSeries({color:'#60a5fa',priceScaleId:'left'}); vwapSeries=chart.addLineSeries({color:'#f59e0b',lineWidth:2}); atrSeries=chart.addLineSeries({color:'#22d3ee',priceScaleId:'left'}); stochSeries=chart.addLineSeries({color:'#a78bfa',priceScaleId:'left'});
  function resize(){ chart.applyOptions({width:container.clientWidth,height:container.clientHeight}); overlay.width=container.clientWidth; overlay.height=container.clientHeight; } window.addEventListener('resize',resize); resize(); }
const mapLine=(arr)=>arr.map((v,i)=>v==null?null:{time:candles[i].time,value:v});

function drawOverlay(){const ctx=overlay.getContext('2d');ctx.clearRect(0,0,overlay.width,overlay.height);ctx.lineWidth=2;ctx.strokeStyle='#d4af37';drawings.forEach(d=>{if(d.type==='line'){ctx.beginPath();ctx.moveTo(d.x1,d.y1);ctx.lineTo(d.x2,d.y2);ctx.stroke();}else if(d.type==='box'){const x=Math.min(d.x1,d.x2),y=Math.min(d.y1,d.y2);ctx.strokeRect(x,y,Math.abs(d.x2-d.x1),Math.abs(d.y2-d.y1));}}); if(document.getElementById('ob').checked&&candles.length>5){const {bull,bear}=detectOB(candles);ctx.save();ctx.globalAlpha=0.15;if(bull){const x1=chart.timeScale().timeToCoordinate(candles[bull.index].time)||0;const x2=chart.timeScale().timeToCoordinate(candles[candles.length-1].time)||overlay.width;const y1=candleSeries.priceToCoordinate(Math.max(bull.o,bull.c));const y2=candleSeries.priceToCoordinate(Math.min(bull.o,bull.c));if(y1!=null&&y2!=null){ctx.fillStyle='#10b981';ctx.fillRect(x1,Math.min(y1,y2),(x2-x1),Math.abs(y2-y1));}} if(bear){const x1=chart.timeScale().timeToCoordinate(candles[bear.index].time)||0;const x2=chart.timeScale().timeToCoordinate(candles[candles.length-1].time)||overlay.width;const y1=candleSeries.priceToCoordinate(Math.max(bear.o,bear.c));const y2=candleSeries.priceToCoordinate(Math.min(bear.o,bear.c));if(y1!=null&&y2!=null){ctx.fillStyle='#ef4444';ctx.fillRect(x1,Math.min(y1,y2),(x2-x1),Math.abs(y2-y1));}} ctx.restore();}}

let drawings=[]; let currentTool=null; let dragStart=null;
function setTool(tool){ currentTool=tool; document.querySelectorAll('.tool').forEach(b=>b.classList.toggle('active',b.dataset.tool===tool)); if(tool==='clear'){drawings=[];drawOverlay(); currentTool=null; document.querySelectorAll('.tool').forEach(b=>b.classList.remove('active'));}}
overlay.addEventListener('mousedown',(e)=>{if(!currentTool)return;dragStart={x:e.offsetX,y:e.offsetY};});
overlay.addEventListener('mousemove',(e)=>{if(!dragStart)return;drawOverlay();const ctx=overlay.getContext('2d');ctx.lineWidth=2;ctx.strokeStyle='#d4af37';if(currentTool==='line'){ctx.beginPath();ctx.moveTo(dragStart.x,dragStart.y);ctx.lineTo(e.offsetX,e.offsetY);ctx.stroke();}else if(currentTool==='box'){const x=Math.min(dragStart.x,e.offsetX),y=Math.min(dragStart.y,e.offsetY);ctx.strokeRect(x,y,Math.abs(e.offsetX-dragStart.x),Math.abs(e.offsetY-dragStart.y));}});
overlay.addEventListener('mouseup',(e)=>{if(!dragStart)return;const end={x:e.offsetX,y:e.offsetY};if(currentTool==='line'||currentTool==='box'){drawings.push({type:currentTool,x1:dragStart.x,y1:dragStart.y,x2:end.x,y2:end.y});}dragStart=null;drawOverlay();});
document.querySelectorAll('.tool').forEach(btn=>btn.addEventListener('click',()=>setTool(btn.dataset.tool)));

function applyIndicators(){const close=candles.map(c=>c.close);const s20=SMA(close,20);const e50=EMA(close,50);const r14=RSI(close,14);const vwap=VWAP(candles);const atr14=ATR(candles,14);const st=STOCH(candles,14,3).k;
  document.getElementById('sma').checked?smaSeries.setData(mapLine(s20)):smaSeries.setData([]);
  document.getElementById('ema').checked?emaSeries.setData(mapLine(e50)):emaSeries.setData([]);
  document.getElementById('rsi').checked?rsiSeries.setData(mapLine(r14)):rsiSeries.setData([]);
  document.getElementById('vwap').checked?vwapSeries.setData(mapLine(vwap)):vwapSeries.setData([]);
  document.getElementById('atr').checked?atrSeries.setData(mapLine(atr14)):atrSeries.setData([]);
  document.getElementById('stoch').checked?stochSeries.setData(mapLine(st)):stochSeries.setData([]);
  drawOverlay(); }

async function loadREST(symbol,interval,market){ elStatus.textContent='REST 불러오는 중...'; const limit=500;
  const url = market==='spot' ? `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
                              : `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res=await fetch(url); if(!res.ok) throw new Error('REST 요청 실패');
  const raw=await res.json(); candles=raw.map(k=>({time:Math.floor(k[0]/1000),open:+k[1],high:+k[2],low:+k[3],close:+k[4],volume:+k[5]}));
  candleSeries.setData(candles); applyIndicators(); elStatus.textContent=`로드 완료 (${symbol} · ${interval} · ${market})`; }

function connectWS(symbol,interval,market){ if(ws){ws.close();ws=null;} const stream=`${symbol.toLowerCase()}@kline_${interval}`;
  const url = market==='spot'?`wss://stream.binance.com:9443/ws/${stream}`:`wss://fstream.binance.com/ws/${stream}`;
  ws=new WebSocket(url); ws.onopen=()=>elStatus.textContent='웹소켓 연결됨 · 실시간'; ws.onclose=()=>elStatus.textContent='웹소켓 종료'; ws.onerror=()=>elStatus.textContent='웹소켓 오류';
  ws.onmessage=(e)=>{const {k}=JSON.parse(e.data); const bar={time:Math.floor(k.t/1000),open:+k.o,high:+k.h,low:+k.l,close:+k.c,volume:+k.v};
    const last=candles[candles.length-1]; if(last&&bar.time===last.time) candles[candles.length-1]=bar; else if(!last||bar.time>last.time) candles.push(bar);
    candleSeries.update(bar); applyIndicators(); }; }

function run(){ buildChart(); const market=elMarket.value; const symbol=elSymbol.value.toUpperCase(); const interval=elInterval.value;
  loadREST(symbol,interval,market).then(()=>connectWS(symbol,interval,market)).catch(err=>{console.error(err); elStatus.textContent='에러: '+err.message;}); }

['sma','ema','rsi','vwap','atr','stoch','ob'].forEach(id=>document.getElementById(id).addEventListener('change',applyIndicators));
elLoad.addEventListener('click',run); run();
