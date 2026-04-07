import{j as o}from"./index-D0oj2B0q.js";import{P as p}from"./PasswordModal-B7yivPYZ.js";import{U as c}from"./UiLanguageContext-DTZv-VzW.js";import{w as u,e as r,u as a,f as m}from"./index-BrtuR1A6.js";import{m as i,v as w}from"./MockSupabase-DRKvxdHf.js";import"./_commonjsHelpers-CqkleIqs.js";import"./supabase-Bd3P2Fuf.js";import"./x-BWzLIbqH.js";import"./lock-D201T1QG.js";import"./circle-alert-DkkX3q7x.js";import"./preload-helper-PPVm8Dsz.js";w.mock("../lib/supabase",()=>({supabase:i}));const E={title:"Components/PasswordModal",component:p,decorators:[s=>o.jsx(c,{children:o.jsx("div",{className:"p-10",children:o.jsx(s,{})})})]},t={args:{isOpen:!0,onClose:m()},play:async({canvasElement:s,args:d})=>{const e=u(s);await r(e.getByText(/Aktuelles Passwort/i)).toBeInTheDocument(),e.getByPlaceholderText("••••••••");const n=e.getAllByPlaceholderText("••••••••");await a.type(n[0],"oldpassword"),await a.type(n[1],"newpassword"),await a.type(n[2],"newpassword");const l=e.getByRole("button",{name:/Passwort aktualisieren/i});await a.click(l),await r(i.auth.signInWithPassword).toHaveBeenCalled(),await r(i.auth.updateUser).toHaveBeenCalled()}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    isOpen: true,
    onClose: fn()
  },
  play: async ({
    canvasElement,
    args
  }) => {
    const canvas = within(canvasElement);

    // Check if labels are correct (de default)
    await expect(canvas.getByText(/Aktuelles Passwort/i)).toBeInTheDocument();

    // Fill form
    const oldPassInput = canvas.getByPlaceholderText('••••••••');
    // Note: there are multiple password inputs with same placeholder
    const inputs = canvas.getAllByPlaceholderText('••••••••');
    await userEvent.type(inputs[0], 'oldpassword');
    await userEvent.type(inputs[1], 'newpassword');
    await userEvent.type(inputs[2], 'newpassword');

    // Submit
    const submitButton = canvas.getByRole('button', {
      name: /Passwort aktualisieren/i
    });
    await userEvent.click(submitButton);

    // Check if supabase was called
    await expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalled();
    await expect(mockSupabase.auth.updateUser).toHaveBeenCalled();

    // Check if onClose was called after success (timeout 2s in component)
    // We can't wait for 2s in a simple interaction test usually without waiting
    // await new Promise(r => setTimeout(r, 2100));
    // await expect(args.onClose).toHaveBeenCalled();
  }
}`,...t.parameters?.docs?.source}}};const T=["Open"];export{t as Open,T as __namedExportsOrder,E as default};
