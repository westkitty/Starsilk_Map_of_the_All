import {seedAtlas,normalizeDraft} from './atlas-data.js';

// The exact rejected bytes stay available for recovery; never silently overwrite them.
export function readDraft(raw) {
  if(raw===null) return {state:seedAtlas(),rejectedRaw:null,issue:null};
  try{
    const parsed=JSON.parse(raw);
    const normalized=normalizeDraft(parsed);
    if(!normalized.valid)throw new Error(normalized.errors[0]||'Draft validation failed');
    return {state:normalized.data,rejectedRaw:null,issue:null};
  }catch(error){
    return {state:seedAtlas(),rejectedRaw:raw,issue:String(error?.message||error)};
  }
}

/**
 * Select a validated draft without overwriting rejected JSON.
 * When a local write failed, sessionStorage may contain a NEWER snapshot.
 * A bad candidate is preserved verbatim and must be explicitly replaced.
 */
export function readStoredDraft(localRaw,sessionRaw,sessionPreferred=false) {
  const local=readDraft(localRaw),session=readDraft(sessionRaw);
  const localBad=localRaw!==null&&local.rejectedRaw!==null;
  const sessionBad=sessionRaw!==null&&session.rejectedRaw!==null;
  if(localBad||sessionBad) {
    const rejected=localBad?local:session;
    const good=localBad&&!sessionBad&&sessionRaw!==null?session:local;
    return {...rejected,state:good.state,source:localBad?'local':'session'};
  }
  const localTime=Date.parse(local.state.updatedAt);
  const sessionTime=Date.parse(session.state.updatedAt);
  const sessionNewer=Number.isFinite(sessionTime)&&(!Number.isFinite(localTime)||sessionTime>localTime);
  const markedRecent=sessionPreferred&&(!Number.isFinite(localTime)||!Number.isFinite(sessionTime)||sessionTime>=localTime);
  if(sessionRaw!==null&&(localRaw===null||sessionNewer||markedRecent))
    return {...session,source:'session'};
  return {...local,source:localRaw===null?'seed':'local'};
}
