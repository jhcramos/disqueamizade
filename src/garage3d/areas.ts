/** Measured trace of the owner-supplied plan. No title block or private source image is stored. */
export type Place={x:number;z:number};
export type RoomId='garage'|'living'|'bar';
export type AreaId='living'|'dining'|'kitchen'|'garage'|'media'|'alfresco'|'pool'|'quiet'|'pride'|'dating'|'hall'|'games'|'bath'|'wc'|'ensuite'|'wir3'|'wir1'|'pantry'|'laundry'|'porch'|'court'|'path'|'study';
export type Rect=Place&{w:number;d:number};
export const PLAN_SCALE={x:22.020/841,z:12.800/488};
export function planPoint(x:number,y:number):Place{return{x:(x-254)*PLAN_SCALE.x-11.01,z:(y-260)*PLAN_SCALE.z-6.4};}
export function planRect(x1:number,y1:number,x2:number,y2:number):Rect{return{...planPoint((x1+x2)/2,(y1+y2)/2),w:(x2-x1)*PLAN_SCALE.x,d:(y2-y1)*PLAN_SCALE.z};}
export type Area=Rect&{id:AreaId;room:RoomId;name:string;topic:string;question:string;floor:string;outdoor?:boolean;service?:boolean;arrival:Place};
function area(id:AreaId,room:RoomId,name:string,topic:string,r:number[],arrival:number[],floor:string,service=false,outdoor=false):Area{return{id,room,name,topic,question:topic,...planRect(r[0],r[1],r[2],r[3]),arrival:planPoint(arrival[0],arrival[1]),floor,service,outdoor};}
export const HOUSE_AREAS:Area[]=[
 area('quiet','living','Quarto 3','Desabafa Aqui',[553,281,669,405],[643,385],'#d8cbb9'),
 area('pride','living','Quarto 2','Paquera LGBTQIA+',[779,281,895,405],[804,387],'#d8c3bd'),
 area('dating','living','Quarto 1 · suíte','Paquera e namoro',[944,327,1086,458],[972,438],'#d8c6b2'),
 area('wir3','living','Closet do quarto 3','Closet',[553,405,628,476],[598,447],'#cabcaa',true),
 area('bath','living','Banheiro','Banheiro social',[669,267,744,405],[725,369],'#e5e6de',true),
 area('wc','living','Lavabo','Lavabo',[744,267,779,405],[761,369],'#e5e6de',true),
 area('ensuite','living','Banheiro da suíte','Banheiro da suíte',[895,264,1070,327],[974,307],'#e5e6de',true),
 area('wir1','living','Closet da suíte','Closet',[895,327,944,476],[921,397],'#cabcaa',true),
 area('games','bar','Quarto 4 · jogos','Jogos e desafios',[553,519,667,663],[640,544],'#c8c4b7'),
 area('media','garage','Sala de cinema','Cinema e cultura',[667,519,798,663],[738,543],'#bfc5bd'),
 area('garage','garage','Garagem','Música e nostalgia',[798,519,1034,744],[840,548],'#d1d1c8'),
 area('laundry','bar','Lavanderia','Área de serviço',[254,673,329,744],[291,707],'#e4e2d7',true),
 area('pantry','bar','Despensa','Cozinha da casa',[329,673,456,744],[418,704],'#e4e2d7',true),
 area('kitchen','bar','Cozinha','Café e histórias',[254,508,414,673],[369,624],'#e1dfd1'),
 area('dining','bar','Jantar · pôquer','Jogos à mesa',[414,519,553,673],[454,536],'#ded6c6'),
 area('living','living','Sala de estar','Papo Livre',[385,281,553,519],[515,482],'#ded6c6'),
 area('study','living','Cantinho de estudo','Leitura e ideias',[674,447,774,476],[727,425],'#ded6c6',true),
 area('hall','living','Corredor','Boas-vindas',[628,405,818,447],[699,425],'#ded6c6',true),
 area('hall','living','Corredor','Boas-vindas',[628,447,674,476],[651,456],'#ded6c6',true),
 area('hall','living','Corredor','Boas-vindas',[774,429,895,476],[796,454],'#ded6c6',true),
 area('hall','living','Corredor de entrada','Boas-vindas',[553,476,1034,519],[804,496],'#ded6c6',true),
 area('hall','living','Entrada','Boas-vindas',[944,458,1034,476],[976,467],'#ded6c6',true),
 area('porch','living','Entrada coberta','Boas-vindas',[1034,464,1095,537],[1065,497],'#dbd4c5',true,true),
 area('alfresco','living','Alfresco','Amizade 40+',[259,281,385,508],[352,488],'#d6c9b4',false,true),
 area('pool','living','Piscina','Lazer e viagens',[238,160,681,281],[310,270],'#e4ddce',false,true),
 area('court','bar','Pátio externo','Ar livre e boas histórias',[456,663,798,748],[633,705],'#d8d2c4',false,true),
 area('path','living','Jardim lateral','Ao ar livre',[219,160,259,782],[237,470],'#b5bd91',true,true),
 area('path','bar','Passeio do jardim','Ao ar livre',[254,744,1070,782],[695,765],'#d4cebd',true,true),
 area('path','living','Caminho de entrada','Ao ar livre',[1034,537,1095,744],[1065,627],'#d4cebd',true,true),
];
export const areaById=(id:AreaId)=>HOUSE_AREAS.find(a=>a.id===id)!;
export const areaAt=(p:Place)=>HOUSE_AREAS.find(a=>Math.abs(p.x-a.x)<=a.w/2+.001&&Math.abs(p.z-a.z)<=a.d/2+.001);
export const SOCIAL_AREAS=HOUSE_AREAS.filter(a=>!a.service);
export const POOL={...planPoint(497,222),w:7,d:2};
export type Barrier=Rect&{h:number;exterior?:boolean;room:RoomId};
export type Opening=Rect&{kind:'door'|'window'|'garage';axis:'x'|'z';room:RoomId};
export const OPENINGS:Opening[]=[];
export const WALLS:Barrier[]=[];
/** Openings split collision as well as masonry. Window glass sits above the cutaway. */
function wall(room:RoomId,x1:number,y1:number,x2:number,y2:number,exterior=false,gaps:{from:number;to:number;kind:'door'|'window'|'garage'}[]=[]){
 const horizontal=y1===y2,lo=horizontal?x1:y1,hi=horizontal?x2:y2,thick=exterior?.23:.09;
 let cursor=lo;
 const segment=(a:number,b:number,h=.78)=>{if(b<=a)return;const p=horizontal?planPoint((a+b)/2,y1):planPoint(x1,(a+b)/2);WALLS.push({...p,w:horizontal?(b-a)*PLAN_SCALE.x:thick,d:horizontal?thick:(b-a)*PLAN_SCALE.z,h,exterior,room});};
 for(const gap of gaps.sort((a,b)=>a.from-b.from)){segment(cursor,gap.from);const a=gap.from,b=gap.to,p=horizontal?planPoint((a+b)/2,y1):planPoint(x1,(a+b)/2);OPENINGS.push({...p,w:horizontal?(b-a)*PLAN_SCALE.x:thick,d:horizontal?thick:(b-a)*PLAN_SCALE.z,axis:horizontal?'x':'z',kind:gap.kind,room});if(gap.kind==='window')segment(a,b,.58);cursor=b;}
 segment(cursor,hi);
}
// Actual perimeter, including the service wing, courtyard recess and entry recess.
wall('living',385,281,669,281,true,[{from:400,to:455,kind:'window'},{from:467,to:520,kind:'window'},{from:577,to:624,kind:'window'}]);
wall('living',669,264,669,281,true);wall('living',669,264,779,264,true,[{from:675,to:703,kind:'window'},{from:749,to:771,kind:'window'}]);wall('living',779,264,779,281,true);
wall('living',779,281,895,281,true,[{from:813,to:860,kind:'window'}]);wall('living',895,264,895,281,true);wall('living',895,264,1070,264,true,[{from:937,to:984,kind:'window'}]);
wall('living',1070,264,1070,327,true,[{from:282,to:317,kind:'window'}]);wall('living',1070,327,1086,327,true);wall('living',1086,327,1086,458,true,[{from:352,to:424,kind:'window'}]);wall('living',944,458,1086,458,true,[{from:951,to:983,kind:'door'}]);
wall('living',1034,458,1034,519,true,[{from:478,to:510,kind:'door'}]);
wall('garage',1034,519,1034,744,true,[{from:549,to:733,kind:'garage'}]);wall('garage',798,744,1034,744,true);
wall('garage',798,663,798,744,true,[{from:702,to:735,kind:'door'}]);wall('garage',667,663,798,663,true,[{from:698,to:744,kind:'window'}]);wall('bar',456,663,667,663,true,[{from:482,to:536,kind:'window'},{from:575,to:621,kind:'window'}]);
wall('bar',456,663,456,744,true,[{from:704,to:734,kind:'door'}]);wall('bar',254,744,456,744,true);wall('bar',254,508,254,744,true,[{from:548,to:613,kind:'window'},{from:696,to:727,kind:'door'}]);wall('bar',254,508,385,508,true);
wall('living',385,281,385,508,true,[{from:418,to:498,kind:'door'}]);
// Bedroom wing and its corridor, copied before adding furniture.
wall('living',553,281,553,476);wall('living',553,405,669,405,false,[{from:594,to:621,kind:'door'},{from:633,to:665,kind:'door'}]);wall('living',669,281,669,405);
wall('living',553,476,628,476);wall('living',628,405,628,476);
wall('living',669,405,779,405,false,[{from:711,to:742,kind:'door'},{from:747,to:777,kind:'door'}]);wall('living',744,264,744,405);wall('living',779,281,779,405);
wall('living',779,405,895,405,false,[{from:782,to:814,kind:'door'}]);wall('living',818,429,895,429);wall('living',818,405,818,429);
wall('living',895,281,895,476,false,[{from:436,to:468,kind:'door'}]);
wall('living',895,327,1070,327,false,[{from:904,to:936,kind:'door'},{from:981,to:1013,kind:'door'}]);wall('living',944,327,944,458,false,[{from:409,to:442,kind:'door'}]);wall('living',895,476,944,476);
wall('living',944,458,944,476);
// Study recess: its desk footprint closes the nook, not the surrounding corridor.
wall('living',674,447,774,447);wall('living',674,447,674,476);wall('living',674,476,774,476);wall('living',774,458,774,476);
// Front bedrooms, media room, garage and services.
wall('bar',553,519,667,519,false,[{from:628,to:660,kind:'door'}]);wall('garage',667,519,798,519,false,[{from:691,to:779,kind:'door'}]);wall('garage',798,519,1034,519,false,[{from:805,to:837,kind:'door'}]);
wall('bar',553,519,553,663);wall('garage',667,519,667,663);wall('garage',798,519,798,663);
wall('bar',254,673,456,673,false,[{from:278,to:310,kind:'door'},{from:414,to:450,kind:'door'}]);wall('bar',329,673,329,744,false,[{from:678,to:710,kind:'door'}]);
// Cabinet and plumbing rectangles are shared by renderer and collision.
export type Fixture=Rect&{kind:'wardrobe'|'counter'|'island'|'fridge'|'bath'|'shower'|'toilet'|'basin'|'washer'|'desk';room:RoomId;h:number};
export const FIXTURES:Fixture[]=[];
function fixture(room:RoomId,kind:Fixture['kind'],x1:number,y1:number,x2:number,y2:number,h:number){FIXTURES.push({...planRect(x1,y1,x2,y2),kind,room,h});}
fixture('living','wardrobe',557,413,574,469,1.5);fixture('living','wardrobe',609,420,624,469,1.5);fixture('living','wardrobe',823,408,891,425,1.5);
fixture('living','wardrobe',899,339,912,427,1.5);fixture('living','wardrobe',929,341,941,398,1.5);fixture('bar','wardrobe',557,523,627,540,1.5);
fixture('living','desk',680,450,768,472,.75);fixture('living','bath',677,271,737,293,.55);fixture('living','basin',673,316,690,347,.8);fixture('living','shower',676,363,703,398,.06);fixture('living','toilet',751,276,771,309,.45);
fixture('living','basin',903,273,970,291,.8);fixture('living','toilet',986,274,1005,305,.45);fixture('living','shower',1023,271,1064,321,.06);
fixture('bar','counter',263,614,280,647,.9);fixture('bar','counter',263,647,414,669,.9);fixture('bar','island',300,568,414,596,.9);fixture('bar','washer',263,698,280,736,.8);fixture('bar','basin',299,715,323,738,.85);fixture('bar','counter',337,719,404,738,.9);fixture('bar','fridge',432,716,451,739,1.8);
