import{d as u,c as m,r as c,n as f,o as y}from"./iframe-bYm7_1LF.js";import"./preload-helper-C1FmrZbK.js";const v=["disabled","type"],t=u({__name:"SpButton",props:{variant:{default:""},size:{default:"md"},disabled:{type:Boolean,default:!1},type:{default:"button"}},emits:["click"],setup(e,{emit:p}){const o=p;return(i,n)=>(y(),m("button",{class:f(["ui-btn",[e.variant,e.size]]),disabled:e.disabled,type:e.type,onClick:n[0]||(n[0]=d=>o("click",d))},[c(i.$slots,"default")],10,v))}});t.__docgenInfo={exportName:"default",displayName:"SpButton",description:"",tags:{},props:[{name:"variant",required:!1,type:{name:"union",elements:[{name:'"primary"'},{name:'"ghost"'},{name:'"danger"'},{name:'""'}]},defaultValue:{func:!1,value:"''"}},{name:"size",required:!1,type:{name:"union",elements:[{name:'"sm"'},{name:'"md"'},{name:'"lg"'}]},defaultValue:{func:!1,value:"'md'"}},{name:"disabled",required:!1,type:{name:"boolean"},defaultValue:{func:!1,value:"false"}},{name:"type",required:!1,type:{name:"union",elements:[{name:'"button"'},{name:'"submit"'},{name:'"reset"'}]},defaultValue:{func:!1,value:"'button'"}}],events:[{name:"click",type:{names:["MouseEvent"]}}],slots:[{name:"default"}],sourceFiles:["/Users/michaelheller/dev/socioprophet-web/socioprophet-web_full_ui_r1/src/components/ui/SpButton.vue"]};const g={title:"UI/SpButton",component:t,parameters:{layout:"centered"}},a={render:()=>({components:{SpButton:t},template:`
      <div style="display:grid; gap:14px;">
        <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
          <SpButton>Default</SpButton>
          <SpButton disabled>Disabled</SpButton>
        </div>
        <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
          <SpButton variant="primary" data-canary="sp">Primary</SpButton>
          <SpButton variant="ghost" data-canary="sp">Ghost</SpButton>
          <SpButton variant="danger" data-canary="sp">Danger</SpButton>
        </div>
      </div>
    `})};var s,r,l;a.parameters={...a.parameters,docs:{...(s=a.parameters)==null?void 0:s.docs,source:{originalSource:`{
  render: () => ({
    components: {
      SpButton
    },
    template: \`
      <div style="display:grid; gap:14px;">
        <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
          <SpButton>Default</SpButton>
          <SpButton disabled>Disabled</SpButton>
        </div>
        <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
          <SpButton variant="primary" data-canary="sp">Primary</SpButton>
          <SpButton variant="ghost" data-canary="sp">Ghost</SpButton>
          <SpButton variant="danger" data-canary="sp">Danger</SpButton>
        </div>
      </div>
    \`
  })
}`,...(l=(r=a.parameters)==null?void 0:r.docs)==null?void 0:l.source}}};const b=["Variants"];export{a as Variants,b as __namedExportsOrder,g as default};
