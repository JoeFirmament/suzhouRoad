import { loadProgress } from '../core/progression.js';
import { LIUYUAN_TEXT_VARIANT } from '../core/liuyuan-text-variant.js';
import { canCollateLiuyuan, LIUYUAN_VARIANT_COLLATED, recordLiuyuanCollation } from '../core/liuyuan-variant-collation.js';

export function createVariantCollation(onClose:()=>void, onOtherBooks:()=>void = ()=>{}) {
  const panel=document.getElementById('homeVariant')!;
  const book=document.getElementById('collationBook')!;
  const leaf=document.getElementById('collationLeaf')!;
  const result=document.getElementById('collationResult')!;
  const bookButton=document.getElementById('readVariantBook') as HTMLButtonElement;
  const leafButton=document.getElementById('readVariantLeaf') as HTMLButtonElement;
  const record=document.getElementById('recordVariant') as HTMLButtonElement;
  const close=document.getElementById('closeVariant') as HTMLButtonElement;
  const other=document.getElementById('otherVariantBooks') as HTMLButtonElement;
  let open=false, bookRead=false, leafRead=false;
  function render() {
    book.textContent=bookRead ? `府学藏本：“${LIUYUAN_TEXT_VARIANT.academy}”` : '书签夹着那一页，先展开原本。';
    leaf.textContent=leafRead ? `叶上原句：“${LIUYUAN_TEXT_VARIANT.copyist}”` : '叶片尚卷着，轻轻展平看字。';
    record.disabled=!(bookRead&&leafRead) || loadProgress().knowledge.includes(LIUYUAN_VARIANT_COLLATED);
    result.textContent=loadProgress().knowledge.includes(LIUYUAN_VARIANT_COLLATED)
      ? '原本确是“景同”，你没有记错。差异已收入园谱；哪一处先改了字，仍待查。'
      : bookRead&&leafRead ? '两个字确实不同。先把两种记录并列，别凭哪句好听就改掉另一句。' : '翻原本，展叶片。先核所见，再作判断。';
  }
  bookButton.addEventListener('click',()=>{if(open){bookRead=true;render();}});
  leafButton.addEventListener('click',()=>{if(open){leafRead=true;render();}});
  record.addEventListener('click',()=>{if(open){recordLiuyuanCollation(bookRead,leafRead);render();}});
  function hide(){if(!open)return;open=false;panel.hidden=true;onClose();}
  close.addEventListener('click',hide);
  other.addEventListener('click',()=>{if(open){hide();onOtherBooks();}});
  return {
    get open(){return open;},
    show(){
      if(!canCollateLiuyuan(loadProgress()))return;
      open=true;panel.hidden=false;
      bookRead=leafRead=loadProgress().knowledge.includes(LIUYUAN_VARIANT_COLLATED);
      render();bookButton.focus();
    },
    hide,
    key(event:KeyboardEvent){
      if(!open || event.ctrlKey || event.metaKey || event.altKey)return;
      if(['1','2','3','Escape'].includes(event.key)){
        event.preventDefault();if(event.repeat)return;
        if(event.key==='1')bookButton.click();
        else if(event.key==='2')leafButton.click();
        else if(event.key==='3')record.click();
        else hide();
      }
      if(event.key==='Tab'){
        const buttons=[bookButton,leafButton,...(record.disabled?[]:[record]),other,close];
        if(event.shiftKey&&document.activeElement===buttons[0]){event.preventDefault();close.focus();}
        else if(!event.shiftKey&&document.activeElement===close){event.preventDefault();bookButton.focus();}
      }
    },
  };
}
