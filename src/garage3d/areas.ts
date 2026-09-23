/** Spatial adaptation of the owner's reference plan. No private drawing data is stored. */
export type Place = {x:number;z:number};
export type RoomId = 'garage'|'living'|'bar';
export type AreaId = 'living'|'dining'|'kitchen'|'garage'|'media'|'alfresco'|'pool'|'quiet'|'pride'|'dating'|'hall';
export type Area = Place & {id:AreaId;room:RoomId;name:string;topic:string;question:string;w:number;d:number;floor:string;outdoor?:boolean;arrival:Place};
export const HOUSE_AREAS:Area[]=[
 {id:'pool',room:'living',name:'Piscina',topic:'Lazer e viagens',question:'Que lugar você quer conhecer nas próximas férias?',x:-10,z:-10,w:12,d:4,floor:'#e0d8c6',outdoor:true,arrival:{x:-6,z:-8.6}},
 {id:'alfresco',room:'living',name:'Alfresco',topic:'Amizade 40+',question:'Qual história de amizade você levaria para esta mesa?',x:-14,z:-4,w:4,d:8,floor:'#ccbba0',outdoor:true,arrival:{x:-13.8,z:-1.1}},
 {id:'living',room:'living',name:'Sala de estar',topic:'Papo Livre',question:'Qual foi a melhor parte do seu dia?',x:-7,z:-4,w:10,d:8,floor:'#ded2bb',arrival:{x:-6,z:-1.3}},
 {id:'quiet',room:'living',name:'Cantinho de escuta',topic:'Desabafa Aqui',question:'Você quer conversar ou prefere que alguém só escute?',x:.3,z:-5,w:4.6,d:6,floor:'#c5c2b1',arrival:{x:.3,z:-2.5}},
 {id:'pride',room:'living',name:'Lounge das cores',topic:'Paquera LGBTQIA+',question:'Que assunto faz você perder a noção do tempo?',x:4.9,z:-5,w:4.6,d:6,floor:'#d8c4bb',arrival:{x:4.9,z:-2.5}},
 {id:'dating',room:'living',name:'Sala dos encontros',topic:'Paquera e namoro',question:'Como seria um primeiro encontro que tivesse a sua cara?',x:9.6,z:-5,w:4.8,d:6,floor:'#ddc6b4',arrival:{x:9.6,z:-2.5}},
 {id:'hall',room:'living',name:'Hall da casa',topic:'Boas-vindas',question:'Qual cantinho combina com você hoje?',x:5,z:-1,w:14,d:2,floor:'#ded2bb',arrival:{x:3,z:-1}},
 {id:'kitchen',room:'bar',name:'Cozinha',topic:'Café e histórias',question:'Qual comida tem gosto de uma boa lembrança?',x:-10,z:4,w:4,d:8,floor:'#e2ddd0',arrival:{x:-9.8,z:6.9}},
 {id:'dining',room:'bar',name:'Sala de jogos',topic:'Jogos à mesa',question:'Quem topa uma partida de pôquer com fichas gratuitas?',x:-5,z:4,w:6,d:8,floor:'#d2b693',arrival:{x:-3,z:6.5}},
 {id:'media',room:'garage',name:'Sala de cinema',topic:'Cinema e cultura',question:'Qual filme você indicaria para todo mundo aqui?',x:0,z:4,w:4,d:8,floor:'#bfc4b9',arrival:{x:0,z:6.5}},
 {id:'garage',room:'garage',name:'Garagem',topic:'Música e nostalgia',question:'Qual música merece tocar nesta festa?',x:7,z:4,w:10,d:8,floor:'#d7d1c3',arrival:{x:7,z:6.8}},
];
export const areaById=(id:AreaId)=>HOUSE_AREAS.find(a=>a.id===id)!;
export const areaAt=(p:Place)=>HOUSE_AREAS.find(a=>Math.abs(p.x-a.x)<=a.w/2+.001&&Math.abs(p.z-a.z)<=a.d/2+.001);
export const POOL={x:-10,z:-10.65,w:9,d:1.8};
export type Barrier=Place&{w:number;d:number;h?:number;exterior?:boolean};
export const WALLS:Barrier[]=[
 {x:-8,z:-8,w:8,d:.18,h:.45,exterior:true},
 {x:4,z:-8,w:16,d:.18,h:2.6,exterior:true},
 {x:12,z:0,w:.18,d:16,h:.7,exterior:true},
 {x:0,z:8,w:24,d:.18,h:.28,exterior:true},
 {x:-12,z:-6.5,w:.18,d:3,h:2.6,exterior:true},
 {x:-12,z:-.5,w:.18,d:1,h:1,exterior:true},
 {x:-12,z:4,w:.18,d:8,h:.55,exterior:true},
 {x:-2,z:-5.3,w:.16,d:5.4,h:1.4},
 {x:2.6,z:-5,w:.16,d:6,h:1.15},
 {x:7.2,z:-5,w:.16,d:6,h:1.15},
 ...[.3,4.9,9.6].flatMap(x=>[{x:x-1.52,z:-2,w:1.55,d:.16,h:.65},{x:x+1.52,z:-2,w:1.55,d:.16,h:.65}]),
 {x:-2,z:2.7,w:.16,d:5.4,h:.85},{x:-2,z:7.75,w:.16,d:.5,h:.85},
 {x:2,z:2.7,w:.16,d:5.4,h:.85},{x:2,z:7.75,w:.16,d:.5,h:.85},
];
