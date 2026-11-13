export function buildPrompt({brand="",direction="",scene="",index=0,total=1}){
  return `You are creating a commercial product mockup for a multi-frame marketing campaign.
SOURCE PRODUCT IDENTITY IS THE HIGHEST PRIORITY. Use the supplied first image as the canonical product reference. If a second image is supplied, use it only as a campaign continuity reference.
${brand?`Brand or product name: ${brand}.`:""}
TASK: ${scene}
${direction?`Creative direction: ${direction}.`:""}
Consistency requirements:
- Reproduce the exact same physical product, packaging, silhouette, logo, typography, label, colors, proportions and unique visual details from the canonical source image.
- Do not redesign, rename, recolor, simplify, invent, distort, mirror or replace the product or its branding.
- Only change the surrounding marketing medium, environment, camera, lighting and composition.
- Product must remain clearly recognizable and be the primary subject.
- Photorealistic premium commercial photography, realistic materials, believable shadows, crisp detail.
- Do not add random text, fake logos, watermarks, borders, collages, grids or multiple panels.
Campaign frame ${index+1} of ${total}. Return one finished image only.`;
}
export function fileToBase64(dataUrl){return String(dataUrl).split(",")[1]||"";}
export function parseImageResponse(payload){
  const parts=payload?.candidates?.[0]?.content?.parts||[];
  const image=parts.find(p=>p.inlineData?.data||p.inline_data?.data);
  if(!image)return null;
  const data=image.inlineData?.data||image.inline_data?.data;
  const mimeType=image.inlineData?.mimeType||image.inline_data?.mime_type||"image/png";
  return {data,mimeType};
}
export function validateSelection({key,sourceData,chosen}){
  if(!sourceData)return "Upload a product image before generating.";
  if(!key)return "Add your Gemini API key to enable image generation.";
  if(!chosen?.length)return "Select at least one marketing scene.";
  return "";
}
