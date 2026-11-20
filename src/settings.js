export const DEFAULT_SETTINGS=Object.freeze({volume:.35,sensitivity:1,enabled:false});
export function normalizeSettings(raw={}){return {volume:Number.isFinite(raw.volume)?Math.max(0,Math.min(1,raw.volume)):.35,sensitivity:Number.isFinite(raw.sensitivity)?Math.max(.2,Math.min(2.5,raw.sensitivity)):1,enabled:typeof raw.enabled==='boolean'?raw.enabled:false};}
export function loadSettings(storage){try{return normalizeSettings(JSON.parse(storage.getItem('dao-den-long.settings')??'{}'));}catch{return {...DEFAULT_SETTINGS};}}
export function saveSettings(storage,settings){const value=normalizeSettings(settings);try{storage.setItem('dao-den-long.settings',JSON.stringify(value));}catch{}return value;}
