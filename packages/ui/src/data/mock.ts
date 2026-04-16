export const MERCHANTS = [
  {id:'1',name:'The Coffee Lab',cat:'Coffee',emoji:'☕',rating:4.9,wait:6,waitStr:'6 MIN',area:'Indiranagar',queue:8,color:'#f5c418',dist:'0.4km',offerTag:'Popular',hot:true,reviews:312},
  {id:'2',name:'Green Valley Pharmacy',cat:'Pharmacy',emoji:'💊',rating:4.7,wait:12,waitStr:'12 MIN',area:'Koramangala',queue:15,color:'#1fd97c',dist:'0.9km',reviews:189},
  {id:'3',name:'Artisan Bakehouse',cat:'Bakery',emoji:'🥐',rating:4.8,wait:4,waitStr:'4 MIN',area:'HSR Layout',queue:5,color:'#fb923c',dist:'1.2km',offerTag:'Flash',hot:true,reviews:256},
  {id:'4',name:'FreshMart Groceries',cat:'Groceries',emoji:'🥬',rating:4.6,wait:18,waitStr:'18 MIN',area:'Whitefield',queue:22,color:'#34d399',dist:'2.1km',reviews:143},
  {id:'5',name:'City Dental Clinic',cat:'Healthcare',emoji:'🦷',rating:4.9,wait:25,waitStr:'25 MIN',area:'Jayanagar',queue:4,color:'#a78bfa',dist:'1.8km',reviews:88},
  {id:'6',name:'Brew Republic',cat:'Coffee',emoji:'🍵',rating:4.7,wait:3,waitStr:'3 MIN',area:'MG Road',queue:3,color:'#fbbf24',dist:'0.6km',offerTag:'Flash',hot:true,reviews:201},
  {id:'7',name:'QuickMeds 24/7',cat:'Pharmacy',emoji:'🏥',rating:4.5,wait:8,waitStr:'8 MIN',area:'Koramangala',queue:9,color:'#22d3ee',dist:'1.1km',reviews:175},
  {id:'8',name:'Bloom Salon',cat:'Beauty',emoji:'💅',rating:4.8,wait:20,waitStr:'20 MIN',area:'Indiranagar',queue:7,color:'#f472b6',dist:'0.7km',reviews:394},
  {id:'9',name:'Axis Bank Branch',cat:'Finance',emoji:'🏦',rating:4.3,wait:35,waitStr:'35 MIN',area:'MG Road',queue:28,color:'#60a5fa',dist:'1.4km',reviews:67},
  {id:'10',name:'SpiceMaster Restaurant',cat:'Dining',emoji:'🍛',rating:4.7,wait:15,waitStr:'15 MIN',area:'HSR Layout',queue:12,color:'#f87171',dist:'0.8km',offerTag:'Popular',reviews:520},
];

export const CATEGORIES = [
  {id:'all',label:'All',icon:'✦'},
  {id:'Coffee',label:'Coffee',icon:'☕'},
  {id:'Pharmacy',label:'Pharmacy',icon:'💊'},
  {id:'Bakery',label:'Bakery',icon:'🥐'},
  {id:'Groceries',label:'Groceries',icon:'🥬'},
  {id:'Healthcare',label:'Healthcare',icon:'🏥'},
  {id:'Beauty',label:'Beauty',icon:'💅'},
  {id:'Finance',label:'Finance',icon:'🏦'},
  {id:'Dining',label:'Dining',icon:'🍛'},
];

export const OUTLETS = [
  {id:'o1',name:'Main Branch',addr:'12 Church Street, Indiranagar',open:true,queue:8,hours:'7:00 AM – 10:00 PM',lat:48,lng:42},
  {id:'o2',name:'Airport Terminal',addr:'BIAL, Terminal 1, Level 2',open:true,queue:3,hours:'5:00 AM – 11:00 PM',lat:32,lng:68},
  {id:'o3',name:'UB City Mall',addr:'UB City, Vittal Mallya Rd',open:false,queue:0,hours:'10:00 AM – 9:00 PM',lat:62,lng:55},
];

export const QUEUE_ENTRIES = [
  {id:'q1',token:41,status:'CALLED',wait:'Now',initials:'RK'},
  {id:'q2',token:42,status:'WAITING',wait:'~2 min',initials:'AP'},
  {id:'q3',token:43,status:'WAITING',wait:'~6 min',initials:'SM'},
  {id:'q4',token:44,status:'WAITING',wait:'~10 min',initials:'VR'},
  {id:'q5',token:45,status:'WAITING',wait:'~14 min',initials:'NK'},
];

export const OFFERS = [
  {id:1,title:'Lightning Fast',sub:'Brew Republic — only 3 min wait right now!',emoji:'⚡',color:'#fbbf24',bg:'rgba(251,191,36,.1)'},
  {id:2,title:'No Queue Now',sub:'Coffee Lab just cleared — join instantly',emoji:'🟢',color:'#1fd97c',bg:'rgba(31,217,124,.1)'},
  {id:3,title:'Beat the Rush',sub:'Visit Artisan Bakehouse before 10 AM',emoji:'🎯',color:'#a78bfa',bg:'rgba(167,139,250,.1)'},
];

export const ANALYTICS = {
  hours:[8,22,45,68,82,95,88,72,54,40,28,35,58,80,76,68,55,42,30,20,14,10,7,5],
  weekly:[120,145,98,210,185,230,190],
  wLabels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
  daily:[{time:'8AM',v:8},{time:'9AM',v:22},{time:'10AM',v:45},{time:'11AM',v:68},{time:'12PM',v:82},{time:'1PM',v:95},{time:'2PM',v:88},{time:'3PM',v:72},{time:'4PM',v:54},{time:'5PM',v:40},{time:'6PM',v:58},{time:'7PM',v:80},{time:'8PM',v:68},{time:'9PM',v:42}],
};

export const ACTIVITY_FEED = [
  {id:1,token:41,action:'served',outlet:'Main Branch',time:'just now',color:'#1fd97c'},
  {id:2,token:40,action:'joined',outlet:'Airport Terminal',time:'1m ago',color:'#f5c418'},
  {id:3,token:39,action:'missed',outlet:'Main Branch',time:'3m ago',color:'#ff4d6d'},
  {id:4,token:38,action:'served',outlet:'UB City Mall',time:'5m ago',color:'#1fd97c'},
  {id:5,token:37,action:'joined',outlet:'Main Branch',time:'7m ago',color:'#f5c418'},
];
