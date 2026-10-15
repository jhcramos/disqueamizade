/** World coordinates use metres, matching the architectural plan. Road loop: 98 × 86 m. */
export const BILLBOARD_DAILY_PRICE=35;
export const ROAD_LOOP_METRES=368;
export const BILLBOARD_SPACING_METRES=100;
export function billboardAt(distance:number){
 const d=((distance+20)%ROAD_LOOP_METRES+ROAD_LOOP_METRES)%ROAD_LOOP_METRES;
 if(d<98)return{x:-49+d,z:-49,yaw:0};
 if(d<184)return{x:55,z:-43+d-98,yaw:-Math.PI/2};
 if(d<282)return{x:49-(d-184),z:49,yaw:Math.PI};
 return{x:-55,z:43-(d-282),yaw:Math.PI/2};
}
export const BILLBOARDS=Array.from({length:Math.ceil(ROAD_LOOP_METRES/BILLBOARD_SPACING_METRES)},(_,i)=>({id:`outdoor-${i+1}`,metres:i*BILLBOARD_SPACING_METRES,...billboardAt(i*BILLBOARD_SPACING_METRES)}));
export const billboardContact=(id:string)=>`mailto:contato@disqueamizade.com.br?subject=${encodeURIComponent(`Anunciar no ${id} — Disque Amizade`)}&body=${encodeURIComponent(`Olá! Tenho interesse no ${id}, por R$ ${BILLBOARD_DAILY_PRICE} por dia.\nMarca/projeto:\nDatas desejadas:\nConteúdo do anúncio:\n`)}`;
