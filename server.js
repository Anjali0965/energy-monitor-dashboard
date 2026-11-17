const express=require('express');
const http=require('http');
const WebSocket=require('ws');
const mqtt=require('mqtt');
const path=require('path');
const app=express();app.disable('x-powered-by');
app.use(express.static(path.join(__dirname,'public')));
const server=http.createServer(app);
const wss=new WebSocket.Server({server,path:'/live'});
const topic=process.env.MQTT_TOPIC||'esp32/energy';
let connected=false,last=null,lastAt=null;const history=[];
const broadcast=obj=>{const s=JSON.stringify(obj);wss.clients.forEach(c=>{if(c.readyState===WebSocket.OPEN)c.send(s)})};
wss.on('connection',ws=>ws.send(JSON.stringify({type:'snapshot',connected,last,lastAt,history})));
app.get('/api/status',(_req,res)=>res.json({connected,lastAt,hasData:!!last}));
const host=process.env.MQTT_HOST;
if(host&&process.env.MQTT_USERNAME&&process.env.MQTT_PASSWORD){
 const client=mqtt.connect('mqtts://'+host+':'+(process.env.MQTT_PORT||8883),{
  username:process.env.MQTT_USERNAME,password:process.env.MQTT_PASSWORD,
  clientId:'energy_web_'+Math.random().toString(16).slice(2),reconnectPeriod:3000,
  rejectUnauthorized:true,connectTimeout:15000
 });
 client.on('connect',()=>{console.log('MQTT broker connected');connected=true;client.subscribe(topic,err=>{if(err)console.error('Subscribe:',err.message);else console.log('MQTT subscribed to',topic)});broadcast({type:'status',connected})});
 client.on('close',()=>{connected=false;broadcast({type:'status',connected})});
 client.on('error',err=>console.error('MQTT:',err.message));
 client.on('message',(t,buf)=>{
  if(t!==topic)return;
  try{
   const obj=JSON.parse(buf.toString());
   const keys=['voltage','current','power','rotation','rpm','wind_speed'];
   if(!keys.every(k=>typeof obj[k]==='number'&&Number.isFinite(obj[k])))return;
   last=Object.fromEntries(keys.map(k=>[k,obj[k]]));
   last.pzem_status=String(obj.pzem_status||'UNKNOWN').slice(0,32);
   lastAt=new Date().toISOString();if(history.length===0)console.log('First live MQTT sensor reading received');history.push({...last,at:lastAt});if(history.length>120)history.shift();
   broadcast({type:'reading',data:last,at:lastAt});
  }catch(e){console.error('Invalid payload:',e.message)}
 });
}else console.log('MQTT environment variables missing; optional browser demo available.');
server.listen(process.env.PORT||3000,'0.0.0.0',()=>console.log('Dashboard running'));