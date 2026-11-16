import cv2, numpy as np, os
from PIL import Image, ImageOps
R=r'C:/Users/tadeo/OneDrive/Escritorio/98.vintage/98site/Fotos de la ropa/'
O=r'C:/Users/tadeo/OneDrive/Escritorio/98.vintage/98site/demo/img/prendas/'
sel={ # id: (folder file, rotation degrees CCW)
 'p01':('1/WhatsApp Image 2026-11-15 at 01.51.38 (1).jpeg',0),
 'p02':('2/WhatsApp Image 2026-11-15 at 01.51.54 (1).jpeg',0),
 'p03':('3/WhatsApp Image 2026-11-15 at 01.51.55 (1).jpeg',0),
 'p04':('4/WhatsApp Image 2026-11-15 at 01.52.18 (1).jpeg',0),
 'p05':('5/WhatsApp Image 2026-11-15 at 01.52.09 (2).jpeg',0),
 'p06':('6/WhatsApp Image 2026-11-15 at 01.52.15 (5).jpeg',180),
 'p07':('7/WhatsApp Image 2026-11-15 at 01.52.12 (1).jpeg',180),
 'p08':('8/WhatsApp Image 2026-11-15 at 01.52.10 (1).jpeg',0),
 'p09':('9/WhatsApp Image 2026-11-15 at 01.52.15 (1).jpeg',0),
 'p10':('10/WhatsApp Image 2026-11-15 at 01.52.14 (4).jpeg',0),
}
for k,(f,rot) in sel.items():
    im=ImageOps.exif_transpose(Image.open(R+f)).convert('RGB')
    if rot: im=im.rotate(rot,expand=True)
    a=cv2.cvtColor(np.array(im),cv2.COLOR_RGB2BGR)
    s=900/max(a.shape[:2]); a=cv2.resize(a,None,fx=s,fy=s,interpolation=cv2.INTER_AREA)
    h,w=a.shape[:2]
    # seed: carpet = low saturation grey near border; use grabcut on rect
    lab=cv2.cvtColor(a,cv2.COLOR_BGR2LAB).astype(np.float32)
    Lc=lab[...,0]; chroma=np.hypot(lab[...,1]-128,lab[...,2]-128)
    mu=cv2.blur(Lc,(9,9)); sd=np.sqrt(np.maximum(cv2.blur(Lc*Lc,(9,9))-mu*mu,0))
    # carpet reference = central band of border pixels with low chroma
    b=np.zeros((h,w),bool); t=int(min(h,w)*.05); b[:t]=b[-t:]=True; b[:,:t]=b[:,-t:]=True
    ref=b&(chroma<14)
    cm=np.median(Lc[ref]); cs=np.median(sd[ref])
    carpet=(chroma<16)&(np.abs(mu-cm)<22)&(sd>cs*0.55)
    carpet=cv2.morphologyEx(carpet.astype(np.uint8),cv2.MORPH_OPEN,np.ones((5,5),np.uint8))>0
    mask=np.full((h,w),cv2.GC_PR_FGD,np.uint8); mask[carpet]=cv2.GC_PR_BGD
    mask[b&(chroma<20)]=cv2.GC_BGD
    # anything outside central 92% box is bg
    mask[:int(h*.02)]=0; mask[-int(h*.02):]=0; mask[:,:int(w*.02)]=0; mask[:,-int(w*.02):]=0
    bg,fg=np.zeros((1,65),np.float64),np.zeros((1,65),np.float64)
    cv2.grabCut(a,mask,None,bg,fg,6,cv2.GC_INIT_WITH_MASK)
    m=np.where((mask==1)|(mask==3),255,0).astype(np.uint8)
    m=cv2.morphologyEx(m,cv2.MORPH_OPEN,np.ones((7,7),np.uint8)); m=cv2.morphologyEx(m,cv2.MORPH_CLOSE,np.ones((11,11),np.uint8))
    n,lb,st,_=cv2.connectedComponentsWithStats(m)
    if n>1:
        big=1+np.argmax(st[1:,cv2.CC_STAT_AREA]); m=np.where(lb==big,255,0).astype(np.uint8)
    cnts,_=cv2.findContours(m,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE); m2=np.zeros_like(m); cv2.drawContours(m2,cnts,-1,255,-1); m=m2
    m=cv2.erode(m,np.ones((3,3),np.uint8)); m=cv2.GaussianBlur(m,(5,5),0)
    # white balance + exposure using the grey carpet as a grey card
    f32=a.astype(np.float32); cpx=f32[ref]
    g=cpx.mean(0); f32*= (g.mean()/g); f32*= 118/ max(g.mean(),1)
    out=np.clip(f32,0,255).astype(np.uint8)
    # gentle local contrast
    L2=cv2.cvtColor(out,cv2.COLOR_BGR2LAB); cl=cv2.createCLAHE(1.6,(8,8)); L2[...,0]=cl.apply(L2[...,0]); out=cv2.cvtColor(L2,cv2.COLOR_LAB2BGR)
    x,y,bw,bh=cv2.boundingRect((m>128).astype(np.uint8))
    rgba=np.dstack([out,m])[y:y+bh,x:x+bw]
    cv2.imwrite(O+k+'.png',rgba)
    print(k,bw,bh)
