/************************
 *  MODE INITIALISATION *
 ************************/
let currentMode = "usa";
let tileLayer   = null;
let geocoderCtl = null;

const map = L.map("map");
initMode("usa");                             // default view

function initMode(mode) {
  if (tileLayer)   map.removeLayer(tileLayer);
  if (geocoderCtl) map.removeControl(geocoderCtl);

  if (mode === "japan") {
    tileLayer = L.tileLayer(
      "https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png",
      { attribution:'<a href="https://maps.gsi.go.jp/">© GSI Japan</a>' }
    ).addTo(map);

    geocoderCtl = L.Control.geocoder({
      defaultMarkGeocode:false,
      geocoder:L.Control.Geocoder.nominatim({
        geocodingQueryParams:{
          countrycodes:"jp",
          viewbox:"122,24,154,46",
          bounded:1
        },
        reverseQueryParams:{acceptLanguage:"ja"}
      })
    })
    .on("markgeocode",({geocode})=>{
      addMarker(geocode.center,geocode.name,"default");
      map.setView(geocode.center,15);
    })
    .addTo(map);

    map.setView([36.5,139.5],6);
    map.setMaxBounds([[20,118],[46,154]]);
    currentMode="japan";
  } else {
    tileLayer = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      { attribution:"© OpenStreetMap" }
    ).addTo(map);

    geocoderCtl = L.Control.geocoder({ defaultMarkGeocode:false })
      .on("markgeocode",({geocode})=>{
        addMarker(geocode.center,geocode.name,"default");
        map.setView(geocode.center,15);
      })
      .addTo(map);

    map.setView([37.7749,-122.4194],5);
    map.setMaxBounds(null);
    currentMode="usa";
  }
}

/* buttons in HTML */
document.getElementById("modeUSA").onclick   = () => initMode("usa");
document.getElementById("modeJapan").onclick = () => initMode("japan");

/* --------------------------------------------------
   MARKERS + LISTS
-------------------------------------------------- */
const markers = new Map();
const lists   = new Map();       // listName → Set(markerIds)

function addMarker(latlng,name,list="default"){
  const mk = L.marker(latlng,{listId:list}).addTo(map);
  mk.bindPopup(
    `<b>${name}</b><br><i>${list}</i><br>
     <button onclick="deleteMarker(${mk._leaflet_id})">Delete</button>`
  );
  markers.set(mk._leaflet_id,mk);
  if(!lists.has(list)) lists.set(list,new Set());
  lists.get(list).add(mk._leaflet_id);
  rebuildListUI();
}

function deleteMarker(id){
  const mk = markers.get(id); if(!mk) return;
  const list = mk.options.listId;
  mk.removeFrom(map);
  markers.delete(id);
  lists.get(list)?.delete(id);
  if(lists.get(list)?.size===0) lists.delete(list);
  rebuildListUI();
}
window.deleteMarker = deleteMarker;

function rebuildListUI(){
  let box = document.getElementById("listToggles");
  if(!box){
    box=document.createElement("div");
    Object.assign(box.style,{
      position:"absolute",top:"10px",left:"10px",
      background:"white",padding:"6px",zIndex:1000,
      boxShadow:"0 2px 6px rgba(0,0,0,.25)"
    });
    box.id="listToggles";
    document.body.appendChild(box);
  }
  box.innerHTML="";
  lists.forEach((set,name)=>{
    const label=document.createElement("label");
    const cb=document.createElement("input");
    cb.type="checkbox";cb.checked=true;
    cb.onchange=()=>set.forEach(id=>{
      const m=markers.get(id);
      if(m)(cb.checked?m.addTo(map):m.removeFrom(map));
    });
    label.append(cb,` ${name}`);
    box.append(label,document.createElement("br"));
  });
}

map.on("click",e=>{
  const name=prompt("Enter location name:"); if(!name) return;
  const list=prompt("Enter list/category (default):")||"default";
  addMarker(e.latlng,name,list);
});

/* --------------------------------------------------
   USER LOCATION (toggle visibility)
-------------------------------------------------- */
let userMarker=null, showUser=true;
const NEAR_RADIUS=100;

if(navigator.geolocation){
  navigator.geolocation.watchPosition(
    ({coords})=>{
      const pos=[coords.latitude,coords.longitude];
      if(!userMarker){
        userMarker=L.marker(pos,{color:"blue"}).bindPopup("You are here");
        if(showUser) userMarker.addTo(map);
      }else{
        userMarker.setLatLng(pos);
        if(showUser&&!map.hasLayer(userMarker)) userMarker.addTo(map);
      }
      markers.forEach(m=>{
        if(!m._notified&&map.distance(pos,m.getLatLng())<NEAR_RADIUS){
          alert(`You’re near “${m.getPopup().getContent().match(/<b>(.*?)<\/b>/)[1]}”`);
          m._notified=true;
        }
      });
    },
    console.error,{enableHighAccuracy:true}
  );
}

const locBtn=document.createElement("button");
locBtn.textContent="Toggle My Location";
Object.assign(locBtn.style,{
  position:"absolute",top:"40px",right:"10px",zIndex:1000
});
document.body.appendChild(locBtn);
locBtn.onclick=()=>{
  if(!userMarker){alert("Location not available yet.");return;}
  showUser=!showUser;
  showUser?userMarker.addTo(map):userMarker.removeFrom(map);
};

/* --------------------------------------------------
   ROUTING  (single OSRM demo, ≤10 waypoints)
-------------------------------------------------- */
let routingCtl=null;

function createRoute(start, wp, mode="car"){
  if(routingCtl){map.removeControl(routingCtl);routingCtl=null;}

  /* OSRM fails with super-long URLs; keep 10 points max */
  if(wp.length>10){
    alert("Route limited to the 10 closest markers for reliability.");
    wp = wp.slice(0,10);
  }

  routingCtl=L.Routing.control({
    waypoints:[start,...wp],
    router:L.Routing.osrmv1({
      profile: mode==="walk" ? "foot" : "car",
      serviceUrl:"https://router.project-osrm.org/route/v1",
      timeout: 30 * 1000                          // 30 s
    }),
    lineOptions:{styles:[{color:"blue",weight:5,opacity:0.7}]},
    createMarker:()=>null, addWaypoints:false,
    fitSelectedRoutes:true, showAlternatives:false
  })
  .on("routingerror",e=>{
    console.error(e);
    alert("Routing failed or timed out — please try again.");
  })
  .addTo(map);
}

/* Draw-Route button */
const routeBtn=document.createElement("button");
routeBtn.id="drawRouteBtn";
routeBtn.textContent="Draw Route";
Object.assign(routeBtn.style,{
  position:"absolute",top:"10px",right:"10px",zIndex:1000
});
document.body.appendChild(routeBtn);

routeBtn.onclick=()=>{
  if(!userMarker){alert("User location not found.");return;}
  const mode=prompt("Travel mode: 'car' or 'walk'","car")||"car";
  const here=userMarker.getLatLng();
  const visible=[...markers.values()].filter(m=>map.hasLayer(m));
  if(!visible.length){alert("No visible markers.");return;}

  /* nearest-neighbour ordering */
  const ordered=[], tmp=[...visible];
  let cur=here;
  while(tmp.length){
    tmp.sort((a,b)=>map.distance(cur,a.getLatLng())-map.distance(cur,b.getLatLng()));
    const nxt=tmp.shift();
    ordered.push(nxt.getLatLng());
    cur=nxt.getLatLng();
  }
  createRoute(here,ordered,mode==="walk"?"walk":"car");
};
