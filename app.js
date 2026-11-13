import { buildPrompt, fileToBase64, parseImageResponse, validateSelection } from "./src/core.js";

const $ = (id) => document.getElementById(id);
const formats = {
  mug: ["Coffee mug", "Create a premium lifestyle product photograph of the exact uploaded product tastefully printed or represented on a ceramic coffee mug. Keep its original logo, shape, colors, label, proportions and distinctive details unchanged. Scene: beautiful modern coffee table, soft natural window light."],
  tshirt: ["T-shirt", "Create a photorealistic apparel mockup showing the exact uploaded product artwork faithfully printed on a premium T-shirt. Preserve all original design details, colors, lettering and proportions. Scene: clean fashion studio, natural fabric folds, front three-quarter view."],
  billboard: ["Billboard", "Create a photorealistic large outdoor advertising billboard featuring the exact uploaded product prominently. Preserve product identity, packaging, logo, colors and label. Scene: premium urban city avenue at golden hour, cinematic wide composition."],
  packaging: ["Retail packaging", "Create a premium retail packaging mockup inspired by and featuring the exact uploaded product. Preserve the product's exact branding, logo, label, color palette and proportions. Scene: elegant retail shelf, studio-quality commercial lighting."],
  phone: ["Mobile ad", "Create a polished smartphone campaign visual featuring the exact uploaded product. Preserve product identity and branding exactly. Scene: modern desk setup, premium social media advertising art direction."],
  store: ["Store display", "Create a photorealistic point-of-sale store display featuring the exact uploaded product. Preserve all distinctive product details, logo, label, colors and proportions. Scene: premium retail environment with realistic lighting."]
};
let sourceFile = null, sourceData = null, generated = [], deferredInstall = null, campaigns = 0;

function setStatus(msg, error=false){ $("status").textContent=msg; $("status").style.color=error?"#ffb8a9":"#91e8c5"; }
function syncFormats(){
  const cards=[...document.querySelectorAll(".format-card")];
  cards.forEach(c=>c.classList.toggle("selected",c.querySelector("input").checked));
  $("selectedCount").textContent=`${cards.filter(c=>c.querySelector("input").checked).length} selected`;
}
function formatBytes(n){return n<1024*1024?`${(n/1024).toFixed(0)} KB`:`${(n/1024/1024).toFixed(1)} MB`;}
function loadFile(file){
  if(!file)return;
  if(!["image/png","image/jpeg","image/webp"].includes(file.type)){setStatus("Please upload a PNG, JPG or WEBP image.",true);return;}
  if(file.size>10*1024*1024){setStatus("Image is larger than 10 MB. Please choose a smaller file.",true);return;}
  sourceFile=file;
  const reader=new FileReader();
  reader.onload=()=>{sourceData=reader.result.split(",")[1];$("sourcePreview").src=reader.result;$("fileName").textContent=file.name;$("fileSize").textContent=formatBytes(file.size);$("uploadEmpty").classList.add("hidden");$("uploadPreview").classList.remove("hidden");setStatus("");};
  reader.onerror=()=>setStatus("Could not read that image. Try another file.",true);
  reader.readAsDataURL(file);
}
function dataUrl(base64,mime){return `data:${mime};base64,${base64}`;}
async function generateOne(apiKey,model,mime,refs,prompt){
  const parts=[{text:prompt},...refs.map(r=>({inline_data:{mime_type:r.mime,data:r.data}}))];
  const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{
    method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":apiKey},
    body:JSON.stringify({contents:[{parts}],generationConfig:{responseModalities:["IMAGE","TEXT"]}})
  });
  const payload=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(payload?.error?.message||`Gemini API error (${response.status})`);
  const image=parseImageResponse(payload);
  if(!image)throw new Error("The model returned no image. Try another model or prompt.");
  return image;
}
async function startCampaign(){
  const key=$("apiKey").value.trim(), chosen=[...document.querySelectorAll(".format-card input:checked")].map(x=>x.value);
  const validation=validateSelection({key,sourceData,chosen});
  if(validation){setStatus(validation,true);return;}
  generated=[];$("resultsGrid").innerHTML="";$("resultsSection").classList.add("hidden");$("progress").classList.remove("hidden");$("generateBtn").disabled=true;
  const model=$("modelSelect").value,mime=sourceFile.type,brand=$("brandName").value.trim(),direction=$("campaignPrompt").value.trim();
  let previous=null, failed=[];
  for(let i=0;i<chosen.length;i++){
    const id=chosen[i], [label,scene]=formats[id];
    $("progressLabel").textContent=`Creating ${label.toLowerCase()}…`;$("progressCount").textContent=`${i+1} / ${chosen.length}`;$("progressBar").style.width=`${(i/chosen.length)*100}%`;
    const refs=[{mime,data:sourceData}];if(previous)refs.push(previous);
    const prompt=buildPrompt({brand,direction,scene,index:i,total:chosen.length});
    try{
      const result=await generateOne(key,model,mime,refs,prompt);
      previous=result;generated.push({label,id,...result,url:dataUrl(result.data,result.mimeType)});
      renderResults();$("resultsSection").classList.remove("hidden");
    }catch(e){failed.push(`${label}: ${e.message}`);setStatus(e.message,true);break;}
  }
  $("progressBar").style.width="100%";$("progressLabel").textContent=failed.length?"Campaign stopped":"Campaign complete";$("progressCount").textContent=`${generated.length} / ${chosen.length}`;
  $("progressHint").textContent=failed.length?"Fix the issue and try again.":"Your campaign visuals are ready.";
  $("generateBtn").disabled=false;
  if(generated.length){campaigns++;updateStats();setStatus(failed.length?`Created ${generated.length} of ${chosen.length}. ${failed[0]}`:`Successfully generated ${generated.length} marketing visuals.`);}
}
function renderResults(){
  $("resultsGrid").innerHTML=generated.map((item,i)=>`<article class="result-card"><img src="${item.url}" alt="${escapeHtml(item.label)} mockup"><div class="result-info"><b>${escapeHtml(item.label)}</b><small>AI-generated · consistency reference used</small><button data-download="${i}">↓ Download image</button></div></article>`).join("");
  $("resultsGrid").querySelectorAll("[data-download]").forEach(btn=>btn.addEventListener("click",()=>download(generated[+btn.dataset.download])));
  $("libraryContent").innerHTML=generated.length?generated.map(x=>`<article class="result-card"><img src="${x.url}" alt="${escapeHtml(x.label)}"><div class="result-info"><b>${escapeHtml(x.label)}</b><small>Current browser session</small><button data-lib-download="${generated.indexOf(x)}">↓ Download</button></div></article>`).join(""):'<div class="empty-state">No saved campaign assets yet. Generate your first campaign in the studio.</div>';
  $("libraryContent").querySelectorAll("[data-lib-download]").forEach(b=>b.addEventListener("click",()=>download(generated[+b.dataset.libDownload])));
  updateStats();
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function download(item){const a=document.createElement("a");a.href=item.url;a.download=`productvision-${item.id}-${Date.now()}.png`;document.body.append(a);a.click();a.remove();}
async function downloadAll(){for(const item of generated){download(item);await new Promise(r=>setTimeout(r,180));}}
function updateStats(){$("statCampaigns").textContent=campaigns;$("statAssets").textContent=generated.length;}
function switchView(view){
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));$(`${view}View`).classList.add("active");
  document.querySelectorAll(".nav-item[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  $("crumbTitle").textContent=({studio:"Create mockups",library:"Asset library",admin:"Admin dashboard"})[view];$("sidebar").classList.remove("open");
}
function setLanguage(lang){
  const copy={
    en:["Create mockups","Upload your product","Choose marketing scenes","Generate campaign"],
    hi:["मॉकअप बनाएँ","अपना उत्पाद अपलोड करें","मार्केटिंग दृश्य चुनें","अभियान बनाएँ"],
    or:["ମକଅପ୍ ତିଆରି କରନ୍ତୁ","ଆପଣଙ୍କ ଉତ୍ପାଦ ଅପଲୋଡ୍ କରନ୍ତୁ","ମାର୍କେଟିଂ ଦୃଶ୍ୟ ବାଛନ୍ତୁ","କ୍ୟାମ୍ପେନ୍ ତିଆରି କରନ୍ତୁ"],
    bn:["মকআপ তৈরি করুন","আপনার পণ্য আপলোড করুন","মার্কেটিং দৃশ্য বেছে নিন","ক্যাম্পেইন তৈরি করুন"],
    es:["Crear maquetas","Sube tu producto","Elige escenas de marketing","Generar campaña"]
  }[lang]||null;
  if(!copy)return;
  document.querySelector('[data-view="studio"]').lastChild.textContent=copy[0];
  document.querySelector(".upload-panel h2").textContent=copy[1];
  document.querySelector(".format-panel h2").textContent=copy[2];
  $("generateBtn").childNodes[0].textContent=`✦ ${copy[3]} `;
}
function init(){
  $("imageInput").addEventListener("change",e=>loadFile(e.target.files[0]));
  $("removeImage").addEventListener("click",e=>{e.preventDefault();sourceFile=null;sourceData=null;$("imageInput").value="";$("uploadPreview").classList.add("hidden");$("uploadEmpty").classList.remove("hidden");});
  document.querySelectorAll(".format-card input").forEach(x=>x.addEventListener("change",syncFormats));
  $("generateBtn").addEventListener("click",startCampaign);$("downloadAll").addEventListener("click",downloadAll);
  $("toggleKey").addEventListener("click",()=>{const el=$("apiKey");el.type=el.type==="password"?"text":"password";$("toggleKey").textContent=el.type==="password"?"Show":"Hide";});
  $("themeBtn").addEventListener("click",()=>{document.body.classList.toggle("light");$("themeBtn").textContent=document.body.classList.contains("light")?"☾":"☼";});
  $("menuBtn").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
  document.querySelectorAll(".nav-item[data-view]").forEach(b=>b.addEventListener("click",()=>switchView(b.dataset.view)));
  $("languageSelect").addEventListener("change",e=>setLanguage(e.target.value));
  const dz=$("dropzone");["dragenter","dragover"].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.add("dragover");}));
  ["dragleave","drop"].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.remove("dragover");}));
  dz.addEventListener("drop",e=>loadFile(e.dataTransfer.files[0]));
  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;});
  $("installBtn").addEventListener("click",async()=>{if(!deferredInstall){setStatus("To install, use your browser menu → Install app / Add to Home Screen.");return;}deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;});
  if("serviceWorker" in navigator && location.protocol!=="file:")navigator.serviceWorker.register("./sw.js").catch(()=>{});
  syncFormats();updateStats();
}
init();
