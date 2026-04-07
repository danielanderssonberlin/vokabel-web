import{j as t}from"./index-D0oj2B0q.js";import{L as p}from"./Login-BeoU5DiC.js";import{U as l}from"./UiLanguageContext-DTZv-VzW.js";import{w as u,e as o,u as s}from"./index-BrtuR1A6.js";import{m as i,v as d}from"./MockSupabase-DRKvxdHf.js";import{M as h}from"./chunk-JZWAC4HX-DxnhJF5N.js";import"./_commonjsHelpers-CqkleIqs.js";import"./supabase-Bd3P2Fuf.js";import"./UiLanguageSwitcher-dxzzGIuS.js";import"./bundle-mjs-BNe0Xlio.js";import"./mail-DdA2l3JE.js";import"./lock-D201T1QG.js";import"./circle-alert-DkkX3q7x.js";import"./preload-helper-PPVm8Dsz.js";d.mock("../lib/supabase",()=>({supabase:i}));const L={title:"Screens/Login",component:p,decorators:[n=>t.jsx(h,{children:t.jsx(l,{children:t.jsx("div",{className:"h-screen bg-background p-4",children:t.jsx(n,{})})})})]},a={play:async({canvasElement:n})=>{const e=u(n);await o(e.getByText(/Melde dich an/i)).toBeInTheDocument();const r=e.getByPlaceholderText(/deine@email.de/i),c=e.getByPlaceholderText("••••••••");await s.type(r,"test@example.com"),await s.type(c,"password123");const m=e.getByRole("button",{name:/Anmelden/i});await s.click(m),await o(i.auth.signInWithPassword).toHaveBeenCalled()}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);

    // Check for login title
    await expect(canvas.getByText(/Melde dich an/i)).toBeInTheDocument();

    // Fill login
    const emailInput = canvas.getByPlaceholderText(/deine@email.de/i);
    const passInput = canvas.getByPlaceholderText('••••••••');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passInput, 'password123');
    const submitButton = canvas.getByRole('button', {
      name: /Anmelden/i
    });
    await userEvent.click(submitButton);

    // Supabase should have been called
    await expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalled();
  }
}`,...a.parameters?.docs?.source}}};const S=["Default"];export{a as Default,S as __namedExportsOrder,L as default};
