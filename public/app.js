(()=>{'use strict';
const $=id=>document.getElementById(id), today=()=>new Date().toLocaleDateString('en-CA'), dateLabel=d=>new Date(d+'T12:00:00').toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});
const KEY='project-physique-40-v1';
const blank=()=>({settings:{startingWeight:89,targetWeight:77,targetCalories:1900,targetDate:'',dietPlan:'',workoutPlan:''},foods:[],exercises:[],weights:[],photos:[],workoutSchedule:null});
let state=load(); function load(){try{return {...blank(),...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return blank()}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));$('saveState').textContent='Saved on this device · '+new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});render()}catch(e){$('saveState').textContent='Storage is full. Export a backup and remove large photos.'}}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function todayFoods(){return state.foods.filter(x=>x.date===today())}function sum(items,key){return items.reduce((a,x)=>a+(Number(x[key])||0),0)}function fmt(n){return Math.round(n*10)/10}
const starter=[
{name:'Egg, whole, raw',state:'Raw',cal:143,p:12.6,c:0.7,f:9.5},{name:'Chicken breast, skinless, raw',state:'Raw',cal:120,p:22.5,c:0,f:2.6},{name:'Rice, white, raw',state:'Raw',cal:365,p:7.1,c:80,c:80,f:.7},{name:'Rice, white, cooked',state:'Cooked',cal:130,p:2.7,c:28.2,f:.3},{name:'Soya chunks, dry',state:'Raw',cal:345,p:52,c:33,f:0.5},{name:'Lentils, cooked',state:'Cooked',cal:116,p:9,c:20,f:.4},{name:'Banana',state:'Raw',cal:89,p:1.1,c:22.8,f:.3},{name:'Oats, dry',state:'Raw',cal:389,p:16.9,c:66.3,f:6.9},{name:'Milk, whole',state:'Packaged',cal:61,p:3.2,c:4.8,f:3.3},{name:'Potato, boiled',state:'Cooked',cal:87,p:1.9,c:20.1,f:.1},{name:'Peanuts',state:'Raw',cal:567,p:25.8,c:16.1,f:49.2},{name:'Apple',state:'Raw',cal:52,p:.3,c:13.8,f:.2}
];
function showTab(name){document.querySelectorAll('.panel').forEach(x=>x.classList.toggle('active',x.id===name));document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.dataset.tab===name));if(name==='food')renderFood();if(name==='workout')renderWorkout();if(name==='progress')renderProgress();window.scrollTo({top:0,behavior:'smooth'})}
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab)));document.querySelectorAll('[data-goto]').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.goto)));
function render(){const fs=todayFoods(),s=state.settings,cal=sum(fs,'calories'),p=sum(fs,'protein');$('todayLabel').textContent=dateLabel(today());$('dashCalories').textContent=Math.round(cal).toLocaleString();$('dashProtein').textContent=fmt(p)+' g';$('calorieTarget').textContent='Target '+s.targetCalories+' kcal';$('remaining').textContent=fmt(Number(s.targetCalories)-cal)+' kcal remaining';$('caloriePercent').textContent=Math.round(cal/Math.max(1,Number(s.targetCalories))*100)+'% of target';$('calorieBar').style.width=Math.min(100,cal/Math.max(1,Number(s.targetCalories))*100)+'%';const latest=[...state.weights].sort((a,b)=>b.date.localeCompare(a.date))[0];$('dashWeight').textContent=latest?latest.weight+' kg':'—';$('weightChange').textContent=latest?'Latest weigh-in':'Add a weigh-in';$('dashWorkout').textContent=state.exercises.some(x=>x.date===today())?'Logged':'Not logged';$('todayFood').innerHTML=fs.length?fs.slice().reverse().map(foodRow).join(''):'No food logged yet.';renderFood();renderWorkout();renderProgress();$('startingWeight').value=s.startingWeight;$('targetWeight').value=s.targetWeight;$('targetCalories').value=s.targetCalories;$('targetDate').value=s.targetDate||'';$('dietPlan').value=s.dietPlan||'';$('workoutPlan').value=s.workoutPlan||'';$('plannedWorkout').textContent=planForToday(s.workoutPlan)||'Add your weekly workout plan under My plans.'}
function foodRow(x){return '<div class="entry"><div><strong>'+esc(x.name)+'</strong><small>'+x.grams+' g · '+esc(x.state)+' · '+dateLabel(x.date)+'</small>'+(x.offPlan?'<span class="off-plan">Outside plan</span>':'')+'</div><div class="entry-right"><strong>'+Math.round(x.calories)+' kcal</strong><small>'+fmt(x.protein)+' g protein</small><button data-delete-food="'+x.id+'">Remove</button></div></div>'}
function bindDelete(){document.querySelectorAll('[data-delete-food]').forEach(b=>b.onclick=()=>{state.foods=state.foods.filter(x=>x.id!==b.dataset.deleteFood);save()});document.querySelectorAll('[data-delete-exercise]').forEach(b=>b.onclick=()=>{state.exercises=state.exercises.filter(x=>x.id!==b.dataset.deleteExercise);save()});document.querySelectorAll('[data-delete-weight]').forEach(b=>b.onclick=()=>{state.weights=state.weights.filter(x=>x.id!==b.dataset.deleteWeight);save()});document.querySelectorAll('[data-delete-photo]').forEach(b=>b.onclick=()=>{state.photos=state.photos.filter(x=>x.id!==b.dataset.deletePhoto);save()})}
function renderFood(){const fs=todayFoods();$('foodTotalCal').textContent=Math.round(sum(fs,'calories'))+' kcal';$('foodTotalProtein').textContent=fmt(sum(fs,'protein'))+' g';$('foodTotalCarbs').textContent=fmt(sum(fs,'carbs'))+' g';$('foodTotalFat').textContent=fmt(sum(fs,'fat'))+' g';$('foodEntries').innerHTML=fs.length?fs.slice().reverse().map(foodRow).join(''):'No entries yet.';const week=new Date();week.setDate(week.getDate()-6);const start=week.toLocaleDateString('en-CA');const off=state.foods.filter(x=>x.offPlan&&x.date>=start&&x.date<=today());$('offPlanReport').innerHTML=off.length?'<p>'+off.length+' off-plan item(s) · '+Math.round(sum(off,'calories'))+' kcal total</p>'+off.slice().reverse().map(x=>'<div class="entry"><div>'+esc(x.name)+'<small>'+dateLabel(x.date)+'</small></div><strong>'+Math.round(x.calories)+' kcal</strong></div>').join(''):'No off-plan foods recorded this week.';bindDelete()}
function renderWorkout(){
 const xs=state.exercises.filter(x=>x.date===today());
 $('workoutDay').textContent=new Date().toLocaleDateString(undefined,{weekday:'long'});
 $('workoutEntries').innerHTML=xs.length?xs.slice().reverse().map(x=>'<div class="entry"><div><strong>'+esc(x.name)+'</strong><small>'+x.sets+' sets · reps '+esc(x.reps)+(x.notes?' · '+esc(x.notes):'')+'</small></div><div class="entry-right"><strong>'+x.weight+' kg</strong><button data-delete-exercise="'+x.id+'">Remove</button></div></div>').join(''):'No exercises logged.';
 const hist=[...state.exercises].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,12);
 $('workoutHistory').innerHTML=hist.length?hist.map(x=>'<div class="entry"><div><strong>'+esc(x.name)+'</strong><small>'+dateLabel(x.date)+' · '+x.sets+' sets · '+esc(x.reps)+' reps</small></div><strong>'+x.weight+' kg</strong></div>').join(''):'Your recent exercise history will appear here.';
 renderGuidedWorkout();bindDelete()
}
function localDate(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function shiftDate(s,n){const d=new Date(s+'T12:00:00');d.setDate(d.getDate()+n);return localDate(d)}
const weekdayNames=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
function parseWorkoutPlan(text){
 const result={};
 let day=null;
 for(const raw of String(text||'').split(/\r?\n/)){
  const line=raw.trim();
  const heading=line.match(/^(?:#{1,6}\s*)?(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)\b[^\n]*$/i);
  if(heading){day=heading[1][0].toUpperCase()+heading[1].slice(1).toLowerCase();result[day]=[];continue}
  if(!day||!line||/^[-_━—]{3,}$/.test(line)||/^(morning|evening):?$/i.test(line)||/^(keep|goal|note|rest)/i.test(line))continue;
  const cleaned=line.replace(/^\d+[.)]\s*/,'').replace(/^[-*•]\s*/,'').trim();
  if(!cleaned)continue;
  const match=cleaned.match(/^(.*?)\s*[—–-]\s*(\d+)\s*sets?\s*[×x]\s*(.*?)\s*reps?/i);
  if(match){result[day].push({name:match[1].trim(),sets:Number(match[2]),target:match[3].trim(),kind:'strength',weight:0})}
  else if(/walk|cycling|cardio|mobility|stretch|plank/i.test(cleaned)){result[day].push({name:cleaned,sets:1,target:'Complete duration',kind:'activity',weight:0})}
 }
 return result;
}
function renderGuidedWorkout(){
 const host=$('guidedWorkout');if(!host)return;
 const schedule=state.workoutSchedule;
 if(!schedule){
  host.innerHTML='<h3>Set up your weekly workout plan</h3><p class="muted">Paste the complete Monday–Sunday plan once. It stays saved until you reset it.</p><label>Weekly workout plan<textarea id="guidedPlanText" rows="16" placeholder="MONDAY — CHEST, SHOULDERS & TRICEPS\n1. Incline Dumbbell Press — 3 sets × 8–12 reps\n...\nTUESDAY — BACK..."></textarea></label><button id="saveGuidedPlan" class="primary">Save weekly workout plan</button><p class="hint">Your first training date will be tomorrow. The plan is stored on this device.</p>';
  $('saveGuidedPlan').onclick=()=>{
   const text=$('guidedPlanText').value.trim(),days=parseWorkoutPlan(text);
   if(!text||!Object.values(days).some(a=>a.length)){alert('Paste your plan with weekday headings and exercise lines, for example: Monday — Chest, then 1. Incline Press — 3 sets × 8–12 reps.');return}
   state.workoutSchedule={text,days,startDate:shiftDate(today(),1),sessions:{}};
   state.settings.workoutPlan=text;save();showTab('workout');
  };
  return;
 }
 const planDay=(date)=>weekdayNames[(new Date(date+'T12:00:00').getDay()+6)%7];
 const currentDate=today(),activeDate=currentDate<schedule.startDate?schedule.startDate:currentDate;
 const day=planDay(activeDate),exercises=(schedule.days[day]||[]),session=schedule.sessions[activeDate]||{exerciseIndex:0,sets:[]};
 const missed=[];
 for(let d=schedule.startDate;d<currentDate;d=shiftDate(d,1)){
  const dn=planDay(d),ds=schedule.days[dn]||[];
  if(ds.length&&!(schedule.sessions[d]&&schedule.sessions[d].done))missed.push({date:d,day:dn});
 }
 const weekStart=shiftDate(currentDate,-((new Date(currentDate+'T12:00:00').getDay()+6)%7));
 const week=weekdayNames.map((dn,i)=>{const date=shiftDate(weekStart,i),has=(schedule.days[dn]||[]).length,done=schedule.sessions[date]?.done,miss=date<currentDate&&has&&!done;return '<div class="day-chip '+(date===currentDate?'today ':'')+(done?'done ':'')+(miss?'missed ':'')+'"><strong>'+dn.slice(0,3)+'</strong><small>'+date.slice(5)+'</small><span>'+(done?'✓':miss?'MISSED':has?'Planned':'Rest')+'</span></div>'}).join('');
 if(activeDate!==currentDate){
  host.innerHTML='<div class="section-head"><h3>Your weekly plan</h3><button id="resetGuidedPlan" class="danger">Reset plan</button></div><div class="week-strip">'+week+'</div><p class="hint">Your plan starts '+dateLabel(schedule.startDate)+'. Today is before the start date, so the first session is shown below.</p>'+guidedSessionMarkup(day,activeDate,exercises,session,schedule)+guidedMissedMarkup(missed);
 }else{
  host.innerHTML='<div class="section-head"><div><p class="eyebrow">SAVED WEEKLY PLAN</p><h3>'+esc(day)+' · '+dateLabel(currentDate)+'</h3></div><button id="resetGuidedPlan" class="danger">Reset plan</button></div><div class="week-strip">'+week+'</div>'+guidedSessionMarkup(day,currentDate,exercises,session,schedule)+guidedMissedMarkup(missed);
 }
 const reset=$('resetGuidedPlan');if(reset)reset.onclick=()=>{if(confirm('Reset the saved workout plan and its set-by-set progress?')){state.workoutSchedule=null;state.settings.workoutPlan='';save()}};
 bindGuidedActions(activeDate,exercises,session,schedule);
}
function guidedMissedMarkup(missed){return missed.length?'<div class="missed-list"><strong>Missed workout days</strong>'+missed.map(x=>'<p>🔴 '+esc(x.day)+' · '+dateLabel(x.date)+' — not completed</p>').join('')+'</div>':'<p class="hint">No missed planned workout days so far.</p>'}
function guidedSessionMarkup(day,date,exercises,session,schedule){
 if(date<schedule.startDate)return '<div class="empty">Your first workout starts tomorrow.</div>';
 if(!exercises.length)return '<div class="empty"><strong>'+esc(day)+' — Rest day</strong><p>No workout is listed for this day.</p></div>';
 if(session.done)return '<div class="session-done"><h3>✓ '+esc(day)+' completed</h3><p>All planned exercises for '+dateLabel(date)+' are complete.</p></div>';
 const i=Math.min(session.exerciseIndex||0,exercises.length-1),ex=exercises[i],setLog=session.sets||[];
 const doneSets=setLog.filter(x=>x.exerciseIndex===i),setNumber=doneSets.length+1;
 const targetSets=Math.max(1,Number(ex.sets)||1);
 const allDone=i>=exercises.length-1&&doneSets.length>=targetSets;
 if(allDone)return '<div class="session-done"><h3>✓ Session completed</h3><p>All exercises logged for today.</p></div>';
 return '<div class="session-card"><p class="eyebrow">EXERCISE '+(i+1)+' OF '+exercises.length+'</p><h3>'+esc(ex.name)+'</h3><p class="muted">Target: '+(ex.kind==='activity'?esc(ex.target):targetSets+' sets × '+esc(ex.target)+' reps')+'</p><div class="set-progress">'+Array.from({length:targetSets},(_,j)=>'<span class="'+(j<doneSets.length?'set-done':'')+'">Set '+(j+1)+(doneSets[j]?' · '+doneSets[j].reps+' reps':'')+'</span>').join('')+'</div>'+(ex.kind==='activity'?'<p>When finished, mark this activity complete.</p><button class="primary" id="finishActivity">Mark activity complete</button>':'<label>Actual reps completed — Set '+setNumber+'<input id="actualReps" type="number" min="0" max="200" placeholder="Enter reps actually completed" required></label><label>Weight used (kg)<input id="actualWeight" type="number" min="0" step="0.5" value="'+(ex.weight||0)+'"></label><button class="primary" id="saveActualSet">Save Set '+setNumber+'</button>')+'<p class="hint">The next exercise stays locked until every set for this exercise is recorded.</p></div><div class="exercise-list"><h3>Today's exercise order</h3>'+exercises.map((x,j)=>'<div class="exercise-order '+(j<i?'completed ':j===i?'current ':'locked')+'"><span>'+(j<i?'✓':j+1)+'</span><div><strong>'+esc(x.name)+'</strong><small>'+(j<i?'Completed':j===i?'In progress':'Locked until previous exercise is complete')+'</small></div></div>').join('')+'</div>';
}
function bindGuidedActions(date,exercises,session,schedule){
 const saveSet=$('saveActualSet');
 if(saveSet)saveSet.onclick=()=>{
  const reps=$('actualReps').value;if(reps===''||Number(reps)<0){alert('Enter the reps you actually completed for this set.');return}
  const idx=session.exerciseIndex||0,ex=exercises[idx],logged=session.sets||[];
  logged.push({exerciseIndex:idx,set:logged.filter(x=>x.exerciseIndex===idx).length+1,reps:Number(reps),weight:Number($('actualWeight').value)||0,date});
  session.sets=logged;
  if(logged.filter(x=>x.exerciseIndex===idx).length>=Math.max(1,Number(ex.sets)||1)){
   state.exercises.push({id:crypto.randomUUID(),date,name:ex.name,sets:ex.sets,reps:logged.filter(x=>x.exerciseIndex===idx).map(x=>x.reps).join(', '),weight:Number($('actualWeight').value)||0,notes:'Guided plan'});
   session.exerciseIndex=idx+1;session.sets=logged;
   if(session.exerciseIndex>=exercises.length)session.done=true;
  }
  schedule.sessions[date]=session;save();
 };
 const finish=$('finishActivity');
 if(finish)finish.onclick=()=>{
  const idx=session.exerciseIndex||0,ex=exercises[idx];
  state.exercises.push({id:crypto.randomUUID(),date,name:ex.name,sets:1,reps:ex.target,weight:0,notes:'Activity completed'});
  session.exerciseIndex=idx+1;session.sets=session.sets||[];if(session.exerciseIndex>=exercises.length)session.done=true;
  schedule.sessions[date]=session;save();
 };
}
function renderProgress(){const ws=[...state.weights].sort((a,b)=>a.date.localeCompare(b.date)),last=ws.at(-1),recent=ws.filter(x=>x.date>=new Date(Date.now()-6*86400000).toLocaleDateString('en-CA'));$('latestWeight').textContent=last?last.weight+' kg':'—';$('avgWeight').textContent=recent.length?fmt(sum(recent,'weight')/recent.length)+' kg':'—';$('latestWaist').textContent=last&&last.waist?last.waist+' cm':'—';$('weightHistory').innerHTML=ws.length?ws.slice().reverse().slice(0,10).map(x=>'<div class="entry"><div><strong>'+x.weight+' kg'+(x.waist?' · waist '+x.waist+' cm':'')+'</strong><small>'+dateLabel(x.date)+(x.notes?' · '+esc(x.notes):'')+'</small></div><button data-delete-weight="'+x.id+'">Remove</button></div>').join(''):'No weigh-ins yet.';if(ws.length>1){const min=Math.min(...ws.map(x=>x.weight)),max=Math.max(...ws.map(x=>x.weight)),range=Math.max(1,max-min),points=ws.map((x,i)=>({x:12+i* (376/Math.max(1,ws.length-1)),y:190-(x.weight-min)/range*150}));$('weightChart').classList.remove('empty');$('weightChart').innerHTML='<svg viewBox="0 0 400 220" role="img" aria-label="Weight trend chart"><line x1="10" y1="190" x2="390" y2="190" stroke="#3a4539"/><polyline fill="none" stroke="#b9f36b" stroke-width="3" points="'+points.map(p=>p.x+','+p.y).join(' ')+'"/>'+points.map((p,i)=>'<circle cx="'+p.x+'" cy="'+p.y+'" r="4" fill="#b9f36b"><title>'+ws[i].date+': '+ws[i].weight+' kg</title></circle>').join('')+'<text x="12" y="212" fill="#a8b2a4" font-size="10">'+esc(ws[0].date)+'</text><text x="390" y="212" text-anchor="end" fill="#a8b2a4" font-size="10">'+esc(ws.at(-1).date)+'</text></svg>'}else{$('weightChart').classList.add('empty');$('weightChart').textContent=ws.length?'Log another weigh-in to see your trend.':'Log at least one weigh-in to see progress.'}
$('photoGallery').innerHTML=state.photos.length?'<div class="photo-grid">'+state.photos.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(x=>'<div class="photo-card"><img src="'+x.data+'" alt="Progress photo from '+esc(x.date)+'" loading="lazy"><small>'+esc(x.date)+(x.note?' · '+esc(x.note):'')+'</small><br><button data-delete-photo="'+x.id+'">Delete photo</button></div>').join('')+'</div>':'No photos saved yet.';bindDelete()}
function planForToday(plan){if(!plan)return '';const day=new Date().toLocaleDateString('en-US',{weekday:'long'}).toLowerCase();const line=plan.split(/\n/).find(x=>x.toLowerCase().includes(day));return line?line.replace(/^\s*[-*#]*\s*/,'') : 'Weekly plan saved. See My plans for full details.'}
$('foodForm').addEventListener('submit',e=>{e.preventDefault();state.foods.push({id:crypto.randomUUID(),date:today(),name:$('foodName').value.trim(),grams:Number($('foodGrams').value),state:$('foodState').value,calories:Number($('foodCalories').value),protein:Number($('foodProtein').value),carbs:Number($('foodCarbs').value),fat:Number($('foodFat').value),offPlan:$('foodOffPlan').checked});e.target.reset();$('foodGrams').value=100;$('foodCalories').value=0;$('foodProtein').value=0;$('foodCarbs').value=0;$('foodFat').value=0;save()});
$('foodSearch').addEventListener('input',()=>{const q=$('foodSearch').value.toLowerCase();const matches=starter.filter(x=>x.name.toLowerCase().includes(q)).slice(0,8);$('foodSuggestions').innerHTML=q?matches.map((x,i)=>'<button class="suggestion" data-food-pick="'+i+'"><span>'+esc(x.name)+'<small>'+x.state+' · per 100 g</small></span><strong>'+x.cal+' kcal</strong></button>').join(''):'Type to search starter foods';document.querySelectorAll('[data-food-pick]').forEach(b=>b.onclick=()=>{const x=matches[Number(b.dataset.foodPick)];$('foodName').value=x.name;$('foodState').value=x.state;$('foodGrams').value=100;$('foodCalories').value=x.cal;$('foodProtein').value=x.p;$('foodCarbs').value=x.c;$('foodFat').value=x.f;$('foodGrams').focus()})});
$('clearFoodBtn').onclick=()=>{if(confirm('Clear only today’s food entries?')){state.foods=state.foods.filter(x=>x.date!==today());save()}};
$('exerciseForm').addEventListener('submit',e=>{e.preventDefault();state.exercises.push({id:crypto.randomUUID(),date:today(),name:$('exerciseName').value.trim(),sets:Number($('exerciseSets').value),reps:$('exerciseReps').value.trim(),weight:Number($('exerciseWeight').value),notes:$('exerciseNotes').value.trim()});e.target.reset();$('exerciseSets').value=3;$('exerciseReps').value='12, 12, 10';$('exerciseWeight').value=0;save()});$('clearWorkoutBtn').onclick=()=>{if(confirm('Clear today’s workout entries?')){state.exercises=state.exercises.filter(x=>x.date!==today());save()}};
$('weightForm').addEventListener('submit',e=>{e.preventDefault();state.weights.push({id:crypto.randomUUID(),date:today(),weight:Number($('weightInput').value),waist:$('waistInput').value?Number($('waistInput').value):null,notes:$('weightNotes').value.trim()});e.target.reset();save()});
$('settingsForm').addEventListener('submit',e=>{e.preventDefault();state.settings={startingWeight:Number($('startingWeight').value),targetWeight:Number($('targetWeight').value),targetCalories:Number($('targetCalories').value),targetDate:$('targetDate').value,dietPlan:$('dietPlan').value,workoutPlan:$('workoutPlan').value};if(state.workoutSchedule&&$('workoutPlan').value.trim()!==state.workoutSchedule.text){$('planStatus').textContent='Workout plan text changed. Reset the saved workout plan in Workout and save it again to apply changes.'}else $('planStatus').textContent='Settings saved on this device.';save()});
$('parsePlanBtn').onclick=()=>{$('planStatus').textContent='Plan text is saved as written. Use clear day labels (Monday:, Tuesday:, etc.) for workout summaries; automatic AI interpretation is not connected in this version.'};
$('photoDate').value=today();$('photoForm').addEventListener('submit',e=>{e.preventDefault();const f=$('photoFile').files[0];if(!f)return;if(f.size>3*1024*1024){alert('Choose an image under 3 MB to avoid filling browser storage.');return}const reader=new FileReader();reader.onload=()=>{state.photos.push({id:crypto.randomUUID(),date:$('photoDate').value||today(),note:$('photoNote').value.trim(),data:reader.result});$('photoFile').value='';$('photoNote').value='';save()};reader.readAsDataURL(f)});
$('exportBtn').onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='project-physique-40-backup-'+today()+'.json';a.click();URL.revokeObjectURL(a.href)};
$('importBtn').onclick=()=>$('importFile').click();$('importFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const d=JSON.parse(await f.text());if(!d||!Array.isArray(d.foods)||!Array.isArray(d.weights))throw Error('Not a Project Physique 40 backup');if(confirm('Replace current local data with this backup?')){state={...blank(),...d};save()}}catch(err){alert('Could not import this backup: '+err.message)}e.target.value=''};
$('resetBtn').onclick=()=>{if(confirm('Permanently delete all Project Physique 40 data saved in this browser? Export a backup first if needed.')){state=blank();save()}};
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('/sw.js').catch(()=>{});
render();
})();