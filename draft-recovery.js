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
