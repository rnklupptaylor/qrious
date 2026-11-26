# Embed the rendered shelf (render/shelf.png + boxes) as parts/shelfimg.js
import json, base64, io, sys
from PIL import Image
src=sys.argv[1]; im=Image.open(src).convert('RGB'); im=im.resize((1140, round(im.size[1]*1140/im.size[0])), Image.LANCZOS)
b=io.BytesIO(); im.save(b,'JPEG',quality=80,optimize=True,progressive=True)
boxes=json.load(open(src.rsplit('.',1)[0]+'.png.boxes.json' if not src.endswith('.png') else src+'.boxes.json'))
key={'CEM I':'CEM'}
boxes={key.get(k,k):v for k,v in boxes.items()}
js='/* Shelf picture: path-traced render (Mitsuba 3, scene in tools/render/scene.py). Boxes: jar outlines as fractions of the picture. */\nApp.SHELF = '+json.dumps({'src':'data:image/jpeg;base64,'+base64.b64encode(b.getvalue()).decode(),'w':im.size[0],'h':im.size[1],'boxes':boxes})+';\n'
open('v2/parts/shelfimg.js','w').write(js); print(len(b.getvalue()), im.size)
