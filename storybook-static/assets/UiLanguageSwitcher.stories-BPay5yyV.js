import{j as s}from"./index-D0oj2B0q.js";import{U as i}from"./UiLanguageSwitcher-dxzzGIuS.js";import{U as u}from"./UiLanguageContext-DTZv-VzW.js";import{w as m,e as t,u as r}from"./index-BrtuR1A6.js";import"./_commonjsHelpers-CqkleIqs.js";import"./bundle-mjs-BNe0Xlio.js";const x={title:"Components/UiLanguageSwitcher",component:i,decorators:[a=>s.jsx(u,{children:s.jsx("div",{className:"p-4",children:s.jsx(a,{})})})]},e={play:async({canvasElement:a})=>{const c=m(a),n=c.getByText("DE"),o=c.getByText("EN");await t(n).toBeInTheDocument(),await t(o).toBeInTheDocument(),await r.click(o),await t(o).toHaveClass("bg-primary"),await r.click(n),await t(n).toHaveClass("bg-primary")}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const deButton = canvas.getByText('DE');
    const enButton = canvas.getByText('EN');
    await expect(deButton).toBeInTheDocument();
    await expect(enButton).toBeInTheDocument();

    // Test language switch
    await userEvent.click(enButton);
    await expect(enButton).toHaveClass('bg-primary');
    await userEvent.click(deButton);
    await expect(deButton).toHaveClass('bg-primary');
  }
}`,...e.parameters?.docs?.source}}};const v=["Default"];export{e as Default,v as __namedExportsOrder,x as default};
