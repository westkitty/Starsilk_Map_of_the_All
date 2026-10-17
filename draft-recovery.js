import {seedAtlas,validateAtlas} from './atlas-data.js';

// The exact rejected bytes stay available for recovery; never silently overwrite them.
export function readDraft(raw) {
  if(raw===null) return {state:seedAtlas(),rejectedRaw:null,issue:null};
  try{
    const state=JSON.parse(raw);
    const problems=validateAtlas(state);
    if(problems.length)throw new Error(problems[0]);
    return {state,rejectedRaw:null,issue:null};
  }catch(error){
    return {state:seedAtlas(),rejectedRaw:raw,issue:String(error?.message||error)};
  }
}
