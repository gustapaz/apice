import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Tower, GOAL, LIMIT, readSave, record, bindLifecycle } from './game.js';
import { createScene } from './scene.js';
import './style.css';

function App(){
  const game=useRef(null),stage=useRef(null),scene=useRef(null),preferences=useRef(null),audio=useRef(null);
  if(!game.current)game.current=new Tower();
  const [save,setSave]=useState(()=>{try{return readSave(localStorage.getItem('apice.save'));}catch{return readSave(null);}});
  const [hud,setHud]=useState({floors:0,score:0,fit:0,combo:0,mode:'ready',w:4,d:4});
  const [panel,setPanel]=useState('intro'),[pace,setPace]=useState('calm'),[kind,setKind]=useState('expedition'),[notice,setNotice]=useState(''),[error,setError]=useState(false),[feedback,setFeedback]=useState('A próxima altura é sua.');
  const panelRef=useRef(panel);preferences.current=save;panelRef.current=panel;
  function changeSave(next){setSave(next);preferences.current=next;try{localStorage.setItem('apice.save',JSON.stringify(next));}catch{}}
  function sound(frequency=400){if(preferences.current.muted)return;try{audio.current??=new AudioContext();const context=audio.current;if(context.state==='suspended')void context.resume();const osc=context.createOscillator(),gain=context.createGain(),now=context.currentTime;osc.type='sine';osc.frequency.setValueAtTime(frequency,now);osc.frequency.exponentialRampToValueAtTime(frequency*.65,now+.12);gain.gain.setValueAtTime(.045,now);gain.gain.exponentialRampToValueAtTime(.001,now+.17);osc.connect(gain);gain.connect(context.destination);osc.start();osc.stop(now+.18);osc.onended=()=>{osc.disconnect();gain.disconnect();};}catch{}}
  function publish(){const model=game.current;const next={floors:model.floors,score:model.score,fit:model.fit,combo:model.combo,mode:model.mode,w:model.top.w,d:model.top.d};setHud(previous=>Object.keys(next).every(key=>previous[key]===next[key])?previous:next);}
  function focusPlay(){requestAnimationFrame(()=>{if(!panelRef.current)document.getElementById('playfield')?.focus({preventScroll:true});});}
  function start(){game.current=new Tower(pace,kind);game.current.start();setPanel(null);panelRef.current=null;setFeedback('Espere o encaixe. Assente a placa.');setNotice('Partida iniciada. Espaço ou botão para assentar.');publish();sound(320);focusPlay();}
  function pause(){if(game.current.mode!=='playing'||panelRef.current)return;game.current.pause();setPanel('pause');panelRef.current='pause';setNotice('Jogo pausado.');publish();}
  function resume(){game.current.resume();setPanel(null);panelRef.current=null;setNotice('Jogo retomado.');publish();focusPlay();}
  function drop(){
    if(panelRef.current||error)return;
    const model=game.current,event=model.drop();if(!event)return;
    if(event.kind==='miss'){setFeedback('Sem base. Novo começo.');sound(100);}
    else{setFeedback(event.recovery?'Três perfeitos. Área recuperada.':event.kind==='perfect'?`Encaixe perfeito${model.combo>1?` ×${model.combo}`:''}.`:'A sobra cai. O essencial fica.');sound(event.kind==='perfect'?420+model.combo*35:260);}
    scene.current?.event(event,model.floors,preferences.current.reduced);publish();
    setNotice(event.kind==='miss'?'A placa passou da base. Fim de partida.':`Andar ${model.floors}. ${event.kind==='perfect'?'Encaixe perfeito.':'Placa cortada.'}`);
    if(model.mode==='won'||model.mode==='lost'){
      changeSave(record(preferences.current,model));setPanel('result');panelRef.current='result';
      setNotice(model.mode==='won'?`Torre concluída com ${model.floors} andares e ${model.score} pontos.`:`Fim de partida. ${model.floors} andares e ${model.score} pontos.`);
    }
  }
  function help(){game.current.pause();setPanel('help');panelRef.current='help';publish();}
  function closeHelp(){if(game.current.mode==='paused'){resume();}else{setPanel('intro');panelRef.current='intro';}}
  function home(){game.current=new Tower(pace,kind);setPanel('intro');panelRef.current='intro';publish();setFeedback('A próxima altura é sua.');}
  useEffect(()=>{
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)changeSave({...preferences.current,reduced:true});
    let view,raf=0,previous=performance.now(),accumulator=0,lastUI=0,disposed=false,failed=false;
    try{view=createScene(stage.current,()=>{failed=true;game.current.pause();setError(true);setPanel('error');panelRef.current='error';});scene.current=view;}
    catch{setError(true);setPanel('error');panelRef.current='error';return;}
    const frame=now=>{
      if(disposed||failed)return;const dt=Math.min((now-previous)/1000,.05);previous=now;accumulator=Math.min(.06,accumulator+dt);
      while(accumulator>=1/120){game.current.step(1/120);accumulator-=1/120;}
      view.sync(game.current);view.update(dt,preferences.current.reduced);
      if(now-lastUI>85){lastUI=now;publish();}
      raf=requestAnimationFrame(frame);
    };
    raf=requestAnimationFrame(frame);const cleanup=bindLifecycle(window,document,()=>pause());
    return()=>{disposed=true;cancelAnimationFrame(raf);cleanup();view.dispose();scene.current=null;void audio.current?.close();};
  },[]);
  useEffect(()=>{if(panel&&panel!=='intro')document.querySelector('.dialog button')?.focus({preventScroll:true});},[panel]);
  function keys(event){
    if(event.ctrlKey||event.metaKey||event.altKey)return;
    if((event.key===' '||event.key==='Enter')&&!event.repeat){event.preventDefault();drop();}
    if((event.key==='p'||event.key==='P'||event.key==='Escape')&&!event.repeat){event.preventDefault();pause();}
  }
  function dialogKeys(event){
    if(event.key==='Escape'){event.preventDefault();if(panel==='pause')resume();if(panel==='help')closeHelp();}
    if(event.key==='Tab'){
      const buttons=[...event.currentTarget.querySelectorAll('button:not(:disabled),a')];const first=buttons[0],last=buttons[buttons.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    }
  }
  const playing=!panel,won=game.current.mode==='won',fit=Math.round(hud.fit*100);
  return <div className={`app ${save.reduced?'reduced':''}`}>
    <div id="playfield" ref={stage} tabIndex={playing?0:-1} role="group" aria-label="Torre 3D. Espaço ou Enter assenta a placa. P ou Escape pausa." onKeyDown={keys} onPointerDown={event=>{if(playing){event.currentTarget.focus({preventScroll:true});drop();}}}/>
    <div className="sky-word" aria-hidden="true">ÁPICE</div><div className="horizon" aria-hidden="true"/>
    <header inert={panel&&panel!=='intro'?true:undefined}><a className="brand" href="./">á<span>p</span>ice<i>↗</i></a><span className="brand-sub">UM ANDAR<br/>DE CADA VEZ.</span><nav aria-label="Preferências e ajuda"><button aria-pressed={!save.muted} onClick={()=>{changeSave({...save,muted:!save.muted});if(save.muted)sound();}}>{save.muted?'Som desligado':'Som ligado'}</button><button aria-pressed={save.reduced} onClick={()=>changeSave({...save,reduced:!save.reduced})}>{save.reduced?'Efeitos reduzidos':'Reduzir efeitos'}</button><button onClick={help}>Como jogar ↗</button></nav></header>
    <main inert={panel&&panel!=='intro'?true:undefined}>
      <div className={`altitude ${panel==='intro'?'preview':''}`}><span>{panel==='intro'?'O CÉU NÃO É O LIMITE.':'ALTURA ATUAL'}</span><strong>{String(hud.floors).padStart(2,'0')}<sup>{kind==='expedition'?'/12':'/100'}</sup></strong><span>{playing?'ANDARES ASSENTADOS':'UM JOGO SOBRE ENCONTRAR SEU TEMPO.'}</span></div>
      <aside className="readings"><span className="tiny-label">SEU MELHOR · {pace==='calm'?'CALMO':'VIVO'}</span><strong>{String(save.best[pace]).padStart(4,'0')}</strong><div className="score"><span className="tiny-label">NESTA PARTIDA</span><b>{String(hud.score).padStart(4,'0')}</b></div><p>{feedback}</p><span className="axis" aria-hidden="true">↗<br/>↑<br/>↖</span></aside>
      {panel==='intro'?<section className="intro" aria-label="Iniciar partida"><p>Encaixe o instante.<br/><em>Construa o improvável.</em></p><div className="options"><fieldset><legend>SEU RITMO</legend><button aria-pressed={pace==='calm'} onClick={()=>setPace('calm')}>Calmo</button><button aria-pressed={pace==='vivid'} onClick={()=>setPace('vivid')}>Vivo</button></fieldset><fieldset><legend>SEU HORIZONTE</legend><button aria-pressed={kind==='expedition'} onClick={()=>setKind('expedition')}>12 andares</button><button aria-pressed={kind==='endless'} onClick={()=>setKind('endless')}>Infinito*</button></fieldset></div><button className="primary" onClick={start} disabled={error}>Começar a subir <span>↑</span></button><span className="intro-foot">UM TOQUE PARA ASSENTAR. NENHUMA PRESSA PARA COMEÇAR.</span></section>:playing?<section className="controller" aria-label="Controles da torre"><div className="fit-label"><span>ENCAIXE</span><strong>{fit}%</strong><span>{fit>=95?'AGORA É UM BOM INSTANTE':fit>0?'ENCONTRE O CENTRO':'ESPERE A APROXIMAÇÃO'}</span></div><div className="meter" role="progressbar" aria-label="Sobreposição com a base" aria-valuemin={0} aria-valuemax={100} aria-valuenow={fit}><i style={{width:`${fit}%`}}/></div><div className="control-row"><button id="drop" data-fit={fit>=95?'precise':'waiting'} className="primary" disabled={hud.mode!=='playing'||game.current.cooldown>0} onClick={drop}>Assentar placa <span>↓</span></button><button className="pause" aria-label="Pausar partida" onClick={pause}>Ⅱ</button></div><p>ESPAÇO / ENTER OU TOQUE · {hud.combo>0?`${hud.combo} ${hud.combo===1?'ENCAIXE PERFEITO':'ENCAIXES PERFEITOS'} EM SEQUÊNCIA`:'TRÊS PERFEITOS RECUPERAM ÁREA'}</p></section>:null}
    </main>
    <footer inert={panel&&panel!=='intro'?true:undefined}><span>PRECISÃO É UM INSTANTE.<br/>ALTURA É CONSEQUÊNCIA.</span><a href="https://github.com/gustapaz/apice" target="_blank" rel="noopener noreferrer">Explorar o código ↗</a><span>JOGO LOCAL · SEM CONTAS<br/>*INFINITO: LIMITE DE 100 ANDARES</span></footer>
    {panel&&panel!=='intro'?<div className="veil"><section className="dialog" role="dialog" tabIndex={-1} aria-modal="true" aria-labelledby="dialog-title" onKeyDown={dialogKeys}>
      <p className="eyebrow">{panel==='pause'?'O INSTANTE PODE ESPERAR':panel==='help'?'MANUAL DE ALTURA':panel==='error'?'PAUSA TÉCNICA':won?'VOCÊ CHEGOU AO ÁPICE':'TODA TORRE ENSINA'}</p>
      <h1 id="dialog-title">{panel==='pause'?'Respire. A torre fica.':panel==='help'?'Tudo começa na base.':panel==='error'?'Não foi possível desenhar o céu.':won?'Olha até onde você foi.':'O próximo começo é maior.'}</h1>
      {panel==='help'?<><ol><li>A placa se move sozinha, alternando os eixos. Espere a sobreposição e assente com o botão, um toque na cena ou Espaço/Enter na área do jogo.</li><li>O excesso cai. Sem base suficiente, a partida termina.</li><li>Encaixes até 0,12 unidade do centro são perfeitos. Três seguidos recuperam um pouco da área perdida.</li><li>Complete 12 andares na expedição. No infinito, vá até falhar ou atingir o teto técnico de 100.</li><li>Calmo e Vivo têm velocidades e recordes separados. P/Escape na cena pausa. O percentual de encaixe ajuda a ler a profundidade.</li></ol><button className="primary" onClick={closeHelp}>Entendi. Vamos subir ↗</button></>:panel==='pause'?<><p>Sua torre e a placa em movimento estão preservadas. Retome quando estiver pronto.</p><button className="primary" onClick={resume}>Retomar partida ↗</button><button className="text-button" onClick={home}>Voltar ao início</button></>:panel==='error'?<><p>Este jogo precisa de WebGL2. Seu navegador não conseguiu iniciar ou perdeu o contexto gráfico. Tente recarregar ou usar um navegador com aceleração gráfica disponível.</p><button className="primary" onClick={()=>location.reload()}>Tentar novamente ↗</button></>:<><div className="result-number">{String(hud.floors).padStart(2,'0')}<span>andares</span></div><p>{hud.score} pontos · {pace==='calm'?'ritmo calmo':'ritmo vivo'} · {game.current.perfects} encaixes perfeitos.</p><button className="primary" onClick={start}>Construir outra torre ↗</button><button className="text-button" onClick={home}>Escolher outro ritmo</button></>}
    </section></div>:null}
    <p className="sr-only" role="status">{notice}</p>
  </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
