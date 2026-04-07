import{r as y,j as c}from"./index-D0oj2B0q.js";import{g as d,u as p,c as x}from"./userStore-BMLnZDkk.js";import{g as b,a as T,u as g,b as B,d as h}from"./vocabularyStore-Dc_-xj1j.js";import{w,u as I,e as s}from"./index-BrtuR1A6.js";import{v as S,m as V}from"./MockSupabase-DRKvxdHf.js";import"./_commonjsHelpers-CqkleIqs.js";import"./supabase-Bd3P2Fuf.js";import"./preload-helper-PPVm8Dsz.js";S.mock("../lib/supabase",()=>({supabase:V}));const v=()=>{const[u,e]=y.useState({}),r=async()=>{const t={},n=d("test-user");t.getUserStats=!!n;const l=p("test-user");t.updateStudyStats=l.streak>=0;const i=x([{lastReviewed:new Date().toISOString()}]);t.calculateStatsFromVocabulary=i.streak===1;const m=await b("en");t.getVocabulary=Array.isArray(m);try{const a=await T("Hallo","Hello","en");t.addVocabularyItem=!!a}catch{t.addVocabularyItem=!1}try{const a=await g("test-id",!0);t.updateVocabularyStatus=!!a.updated}catch{t.updateVocabularyStatus=!1}try{const a=await B("test-id","Hallo2","Hello2");t.updateVocabularyItem=!!a}catch{t.updateVocabularyItem=!1}try{await h("test-id"),t.deleteVocabularyItem=!0}catch{t.deleteVocabularyItem=!1}e(t)};return c.jsxs("div",{className:"p-4 bg-white rounded-lg shadow",children:[c.jsx("button",{onClick:r,className:"px-4 py-2 bg-primary text-white rounded mb-4",id:"run-tests",children:"Run Store Function Tests"}),c.jsx("div",{className:"space-y-2",children:Object.entries(u).map(([t,n])=>c.jsxs("div",{className:"flex items-center gap-2",children:[c.jsx("span",{className:n?"text-success":"text-error",children:n?"✅":"❌"}),c.jsx("span",{className:"font-mono text-sm",children:t})]},t))})]})},A={title:"Internal/StoreFunctions",component:v},o={play:async({canvasElement:u})=>{const e=w(u),r=e.getByRole("button",{name:/Run Store Function Tests/i});await I.click(r),await s(e.getByText("getUserStats")).toBeInTheDocument(),await s(e.getByText("updateStudyStats")).toBeInTheDocument(),await s(e.getByText("calculateStatsFromVocabulary")).toBeInTheDocument(),await s(e.getByText("getVocabulary")).toBeInTheDocument(),await s(e.getByText("addVocabularyItem")).toBeInTheDocument(),await s(e.getByText("updateVocabularyStatus")).toBeInTheDocument(),await s(e.getByText("updateVocabularyItem")).toBeInTheDocument(),await s(e.getByText("deleteVocabularyItem")).toBeInTheDocument();const t=e.getAllByText("✅");await s(t.length).toBe(8)}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', {
      name: /Run Store Function Tests/i
    });
    await userEvent.click(button);

    // Wait for all results to appear
    await expect(canvas.getByText('getUserStats')).toBeInTheDocument();
    await expect(canvas.getByText('updateStudyStats')).toBeInTheDocument();
    await expect(canvas.getByText('calculateStatsFromVocabulary')).toBeInTheDocument();
    await expect(canvas.getByText('getVocabulary')).toBeInTheDocument();
    await expect(canvas.getByText('addVocabularyItem')).toBeInTheDocument();
    await expect(canvas.getByText('updateVocabularyStatus')).toBeInTheDocument();
    await expect(canvas.getByText('updateVocabularyItem')).toBeInTheDocument();
    await expect(canvas.getByText('deleteVocabularyItem')).toBeInTheDocument();

    // Check if they all passed
    const successes = canvas.getAllByText('✅');
    await expect(successes.length).toBe(8);
  }
}`,...o.parameters?.docs?.source}}};const H=["Tests"];export{o as Tests,H as __namedExportsOrder,A as default};
