import{j as e}from"./index-D0oj2B0q.js";import{L as o}from"./LanguageSwitcher-BTLMYT94.js";import{U as r}from"./UiLanguageContext-DTZv-VzW.js";import{L as s}from"./LanguageContext-Dcc80RfS.js";import{w as i,e as c,u as m}from"./index-BrtuR1A6.js";import"./_commonjsHelpers-CqkleIqs.js";import"./bundle-mjs-BNe0Xlio.js";import"./supabase-Bd3P2Fuf.js";const x={title:"Components/LanguageSwitcher",component:o,decorators:[n=>e.jsx(r,{children:e.jsx(s,{children:e.jsx("div",{className:"p-10 min-h-[300px]",children:e.jsx(n,{})})})})]},t={play:async({canvasElement:n})=>{const a=i(n).getByRole("button");await c(a).toBeInTheDocument(),await m.click(a)}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    // Check if it's rendered (flag might be empty if no languages)
    await expect(button).toBeInTheDocument();

    // Open dropdown
    await userEvent.click(button);

    // Check if dropdown items are visible
    // Note: This depends on what languages are in the mock/localStorage
    // Since we use real providers, they will try to fetch from Supabase or localStorage.
  }
}`,...t.parameters?.docs?.source}}};const b=["Default"];export{t as Default,b as __namedExportsOrder,x as default};
