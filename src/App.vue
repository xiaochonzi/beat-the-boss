<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { GameEngine } from './game/GameEngine'
import { achievements, seededLook, weapons } from './game/data'
import type { GameStats, WeaponId } from './game/types'

type Page = 'home' | 'game' | 'result'
const page = ref<Page>('home')
const bossName = ref('王总')
const previewKey = ref(0)
const canvas = ref<HTMLCanvasElement>()
const selected = ref<WeaponId>('whip')
const engine = ref<GameEngine>()
const dialogue = ref('这个需求应该很简单吧？')
const bubbleVisible = ref(true)
const settingsOpen = ref(false)
const achievementsOpen = ref(false)
const helpOpen = ref(false)
const toast = ref('')
const impacts = ref<{id:number;x:number;y:number;label:string;points:number}[]>([])
const stats = reactive<GameStats>({stress:0,combo:0,maxCombo:0,destruction:0,hits:0,slipperHits:0,bestWeapon:'巴掌',rage:false,rageRemaining:0})
const settings = reactive({bgm:.35,sfx:.6,shake:true,slowmo:true,particles:2,quality:'high',fps:60})
const unlocked = reactive<Record<string,boolean>>(JSON.parse(localStorage.getItem('beat-boss-achievements')||'{}'))
let impactId=0,bubbleTimer=0
const look = computed(()=>seededLook(bossName.value.trim()||'老板'))
const stressFace = computed(()=>stats.stress>=100?'😆':stats.stress>=75?'🤣':stats.stress>=50?'😃':stats.stress>=25?'🙂':'😫')
const currentWeapon = computed(()=>weapons.find(w=>w.id===selected.value)!)
const availableWeapons = computed(()=>weapons.filter(w=>w.unlockStress<=stats.stress || (stats.rage && w.unlockStress===100)))
const lookStyle = computed(()=>({ '--skin':`#${look.value.skin.toString(16).padStart(6,'0')}`,'--suit':`#${look.value.suit.toString(16).padStart(6,'0')}`,'--hair':`#${look.value.hair.toString(16).padStart(6,'0')}`,'--tie':`#${look.value.tie.toString(16).padStart(6,'0')}` }))

watch(settings,()=>{localStorage.setItem('beat-boss-settings',JSON.stringify(settings));engine.value?.setSettings(settings)},{deep:true})
const saved=localStorage.getItem('beat-boss-settings');if(saved)Object.assign(settings,JSON.parse(saved))

function randomBoss(){const names=['王总','李经理','赵主管','周老板','钱总监','孙总','马老师','陈老板'];bossName.value=names[Math.floor(Math.random()*names.length)];previewKey.value++}
function validateName(){bossName.value=[...(bossName.value.trim()||'老板')].slice(0,12).join('')}
async function startGame(){validateName();resetStats();page.value='game';await nextTick();if(!canvas.value)return;engine.value=new GameEngine(canvas.value,look.value,{onHit,onStats,onDialogue:showDialogue,onAchievement:unlock,onRageEnd:finish});await engine.value.init();engine.value.setSettings(settings);engine.value.setHeldWeapon('whip');showDialogue('这个需求应该很简单吧？')}
function resetStats(){Object.assign(stats,{stress:0,combo:0,maxCombo:0,destruction:0,hits:0,slipperHits:0,bestWeapon:'巴掌',rage:false,rageRemaining:0});selected.value='whip'}
function onStats(s:GameStats){const old=stats.stress;Object.assign(stats,s);if(old<20&&s.stress>=20)notify('🔓 已解锁：充气锤');if(old<30&&s.stress>=30)notify('🔓 已解锁：棒球棍');if(old<40&&s.stress>=40)notify('🔓 已解锁：咸鱼');if(s.combo>=10)unlock('combo-10','部门团建');if(s.combo>=30)unlock('combo-30','企业级事故');if(s.destruction>=70)unlock('flat','公司完成扁平化管理')}
function onHit(points:number,label:string,x:number,y:number){unlock('first-hit','打工人的问候');const id=++impactId;impacts.value.push({id,x,y,label,points});setTimeout(()=>impacts.value=impacts.value.filter(i=>i.id!==id),800)}
function showDialogue(text:string){dialogue.value=text;bubbleVisible.value=true;clearTimeout(bubbleTimer);bubbleTimer=window.setTimeout(()=>bubbleVisible.value=false,2800)}
function unlock(id:string,name:string){if(unlocked[id])return;unlocked[id]=true;localStorage.setItem('beat-boss-achievements',JSON.stringify(unlocked));notify(`🏆 成就解锁：${name}`)}
function notify(text:string){toast.value=text;setTimeout(()=>{if(toast.value===text)toast.value=''},2600)}
function selectWeapon(id:WeaponId){selected.value=id;engine.value?.setHeldWeapon(id);notify(weapons.find(w=>w.id===id)?.hint||'')}
function canvasClick(e:MouseEvent){if(['slipper','hammer'].includes(selected.value))return;engine.value?.useWeapon(selected.value,e.clientX,e.clientY)}
function chargeStart(e:PointerEvent){if(['slipper','hammer'].includes(selected.value)){canvas.value?.setPointerCapture(e.pointerId);engine.value?.beginCharge(selected.value)}}
function chargeEnd(e:PointerEvent){if(['slipper','hammer'].includes(selected.value)){engine.value?.releaseCharge(e.clientX,e.clientY);if(canvas.value?.hasPointerCapture(e.pointerId))canvas.value.releasePointerCapture(e.pointerId)}}
function finish(){unlock('rage','很有精神');localStorage.setItem('beat-boss-best-combo',String(Math.max(stats.maxCombo,Number(localStorage.getItem('beat-boss-best-combo')||0))));engine.value?.dispose();engine.value=undefined;page.value='result'}
function exitHome(){engine.value?.dispose();engine.value=undefined;page.value='home'}
function replay(){startGame()}
function downloadCard(){const c=document.createElement('canvas');c.width=1200;c.height=630;const x=c.getContext('2d')!;const g=x.createLinearGradient(0,0,1200,630);g.addColorStop(0,'#f8d44f');g.addColorStop(1,'#ff7c5e');x.fillStyle=g;x.fillRect(0,0,1200,630);x.fillStyle='#182138';x.font='bold 76px sans-serif';x.fillText('今日解压完成！',80,125);x.font='44px sans-serif';x.fillText(`我把「${bossName.value}」打出了`,80,220);x.font='bold 64px sans-serif';x.fillText(`COMBO × ${stats.maxCombo}`,80,325);x.fillText(`办公室破坏度 ${Math.round(stats.destruction)}%`,80,415);x.font='38px sans-serif';x.fillText('《今天又想打老板》· 卡通物理解压小游戏',80,525);const shareUrl=`${window.location.origin}${window.location.pathname}`;x.fillStyle='rgba(24,33,56,.78)';x.font='600 27px sans-serif';x.fillText(`来这里一起解压：${shareUrl}`,80,582);const a=document.createElement('a');a.download=`今日解压-${bossName.value}.png`;a.href=c.toDataURL('image/png');a.click()}
onBeforeUnmount(()=>engine.value?.dispose())
</script>

<template>
  <main class="app-shell">
    <section v-if="page==='home'" class="home">
      <div class="home-noise"></div>
      <button class="round top-setting" aria-label="设置" @click="settingsOpen=true">⚙</button>
      <div class="brand"><span class="brand-kicker">BEAT THE BOSS · 3D</span><h1>今天又想<br><em>打老板</em></h1><p>一款荒诞但友好的卡通物理解压小游戏</p></div>
      <div class="hero-card">
        <div class="avatar-stage" :style="lookStyle" :key="previewKey">
          <div class="preview-boss"><i class="hair"></i><i class="ear left"></i><i class="ear right"></i><div class="face"><b>•</b><b>•</b><span class="nose"></span><span class="mouth"></span><span v-if="look.glasses" class="glasses">◎—◎</span></div><div class="body"><i class="shirt"></i><i class="tie"></i></div></div>
          <span class="float-note n1">需求很简单</span><span class="float-note n2">今晚辛苦一下</span>
        </div>
        <div class="start-panel"><label>今天想“友好交流”的老板是：</label><div class="name-row"><input v-model="bossName" maxlength="24" aria-label="老板名字" @blur="validateName" @keyup.enter="startGame"><button @click="randomBoss" title="随机老板">🎲</button></div><p class="seed-hint">名字会决定老板的固定外观 · 仅在本地处理</p><button class="primary" @click="startGame"><span>开始解压</span><b>→</b></button><button class="text-btn" @click="achievementsOpen=true">🏆 我的成就 {{Object.keys(unlocked).length}} / {{achievements.length}}</button></div>
      </div>
      <footer>所有角色均为随机生成的虚拟卡通形象 · 无血腥、无伤害表现 <span>建议使用桌面版 Chrome / Edge</span></footer>
    </section>

    <section v-else-if="page==='game'" class="game" :class="{rage:stats.rage}">
      <canvas ref="canvas" @click="canvasClick" @pointerdown="chargeStart" @pointerup="chargeEnd"></canvas>
      <header class="hud"><div class="boss-tag"><span>{{stressFace}}</span><div><small>今日老板</small><b>{{bossName}}</b></div></div><div class="stress"><div class="stress-title"><span>解压值</span><b>{{Math.round(stats.stress)}}%</b></div><div class="bar"><i :style="{width:stats.stress+'%'}"></i></div></div><div class="hud-actions"><button @click="helpOpen=true">?</button><button @click="settingsOpen=true">⚙</button><button @click="exitHome">⌂</button></div></header>
      <Transition name="pop"><div v-if="bubbleVisible" class="dialogue"><b>{{bossName}}：</b>{{dialogue}}</div></Transition>
      <div v-if="stats.combo>1" class="combo"><small>{{stats.combo>=30?'企业级事故':stats.combo>=10?'混乱现场':stats.combo>=5?'办公室事故':'不错'}}</small><strong>COMBO <i>× {{stats.combo}}</i></strong></div>
      <div v-if="stats.rage" class="rage-banner"><b>🔥 暴走模式 🔥</b><span>{{Math.ceil(stats.rageRemaining)}}</span><small>冲击力 ×3 · 全道具解锁</small></div>
      <div class="aim-hint"><span>{{currentWeapon.icon}}</span>{{currentWeapon.hint}}<small>右键拖动旋转 · 滚轮缩放</small></div>
      <div class="weapon-dock"><button v-for="w in availableWeapons" :key="w.id" :class="{active:selected===w.id}" @click="selectWeapon(w.id)"><span>{{w.icon}}</span><small>{{w.name}}</small><i v-if="w.unlockStress>0&&!stats.rage">{{w.unlockStress}}%</i></button></div>
      <div v-for="i in impacts" :key="i.id" class="impact" :style="{left:i.x+'px',top:i.y+'px'}"><b>{{i.label}}</b><span>+{{i.points}}</span></div>
      <Transition name="toast"><div v-if="toast" class="toast">{{toast}}</div></Transition>
    </section>

    <section v-else class="result"><div class="confetti"></div><div class="result-card"><div class="result-face">😆</div><span class="eyebrow">TODAY'S RELIEF REPORT</span><h2>今日解压完成！</h2><p>辛苦了，打工人。现在可以心平气和地回去工作了。</p><div class="result-grid"><div><small>解压值</small><b>100%</b></div><div><small>最高 Combo</small><b>× {{stats.maxCombo}}</b></div><div><small>办公室破坏度</small><b>{{Math.round(stats.destruction)}}%</b></div><div><small>使用最多</small><b>{{stats.bestWeapon}}</b></div></div><div class="result-actions"><button class="primary" @click="replay">再来一局 ↻</button><button @click="exitHome">换个老板</button><button @click="downloadCard">保存分享卡片 ↓</button></div></div></section>

    <div v-if="settingsOpen" class="modal-back" @click.self="settingsOpen=false"><div class="modal"><button class="close" @click="settingsOpen=false">×</button><h3>游戏设置</h3><label>背景音乐 <input v-model.number="settings.bgm" type="range" min="0" max="1" step=".1"></label><label>音效 <input v-model.number="settings.sfx" type="range" min="0" max="1" step=".1"></label><label>镜头震动 <input v-model="settings.shake" type="checkbox"></label><label>慢动作 <input v-model="settings.slowmo" type="checkbox"></label><label>粒子效果 <select v-model.number="settings.particles"><option :value="0">低</option><option :value="1">中</option><option :value="2">高</option></select></label><label>帧率 <select v-model.number="settings.fps"><option :value="30">30 FPS</option><option :value="60">60 FPS</option></select></label></div></div>
    <div v-if="achievementsOpen" class="modal-back" @click.self="achievementsOpen=false"><div class="modal achievements"><button class="close" @click="achievementsOpen=false">×</button><h3>成就图鉴</h3><div v-for="a in achievements" :class="{locked:!unlocked[a.id]}"><span>{{unlocked[a.id]?'🏆':'🔒'}}</span><p><b>{{a.name}}</b><small>{{a.desc}}</small></p></div></div></div>
    <div v-if="helpOpen" class="modal-back" @click.self="helpOpen=false"><div class="modal"><button class="close" @click="helpOpen=false">×</button><h3>怎么玩？</h3><ol><li>从底部选择道具</li><li>移动鼠标控制手持道具</li><li>点击甩鞭或攻击，部分道具可按住蓄力</li><li>制造连续碰撞累积 Combo</li><li>解压值满后进入 10 秒暴走模式</li></ol></div></div>
  </main>
</template>
