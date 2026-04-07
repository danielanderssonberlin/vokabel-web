import{j as r}from"./index-D0oj2B0q.js";import{D as f}from"./DeleteConfirmModal-CThEpOZd.js";import{U as u}from"./UiLanguageContext-DTZv-VzW.js";import{f as a,w as d,e as n,u as c}from"./index-BrtuR1A6.js";import"./_commonjsHelpers-CqkleIqs.js";const v={title:"Components/DeleteConfirmModal",component:f,decorators:[s=>r.jsx(u,{children:r.jsx("div",{className:"p-4",children:r.jsx(s,{})})})],parameters:{layout:"centered"}},t={args:{isOpen:!0,onClose:a(),onConfirm:a(),title:"Test Title",message:"Test message for deletion confirm."},play:async({canvasElement:s,args:i})=>{const e=d(s);await n(e.getByText("Test Title")).toBeInTheDocument(),await n(e.getByText("Test message for deletion confirm.")).toBeInTheDocument();const l=e.getByRole("button",{name:/Abbrechen/i});await c.click(l),await n(i.onClose).toHaveBeenCalled();const m=e.getByRole("button",{name:/Löschen/i});await c.click(m),await n(i.onConfirm).toHaveBeenCalled()}},o={args:{isOpen:!1,onClose:a(),onConfirm:a()}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    isOpen: true,
    onClose: fn(),
    onConfirm: fn(),
    title: 'Test Title',
    message: 'Test message for deletion confirm.'
  },
  play: async ({
    canvasElement,
    args
  }) => {
    const canvas = within(canvasElement);

    // Check if title and message are rendered
    await expect(canvas.getByText('Test Title')).toBeInTheDocument();
    await expect(canvas.getByText('Test message for deletion confirm.')).toBeInTheDocument();

    // Test cancel button
    const cancelButton = canvas.getByRole('button', {
      name: /Abbrechen/i
    }); // Assuming 'de' is default and 'Abbrechen' is in COMMON.CANCEL
    await userEvent.click(cancelButton);
    await expect(args.onClose).toHaveBeenCalled();

    // Test confirm button
    const confirmButton = canvas.getByRole('button', {
      name: /Löschen/i
    }); // Assuming DELETE_MODAL.CONFIRM is 'Löschen'
    await userEvent.click(confirmButton);
    await expect(args.onConfirm).toHaveBeenCalled();
  }
}`,...t.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    isOpen: false,
    onClose: fn(),
    onConfirm: fn()
  }
}`,...o.parameters?.docs?.source}}};const x=["Default","Closed"];export{o as Closed,t as Default,x as __namedExportsOrder,v as default};
