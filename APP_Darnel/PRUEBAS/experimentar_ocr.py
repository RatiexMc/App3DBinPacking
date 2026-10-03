import json, os
from pathlib import Path
import cv2, numpy as np, pytesseract
from services.ocr_service import preparar, filas_desde_datos
from services.imagenes import abrir_imagen
from services.historial_service import transaccion
carpeta=Path(r"C:\Users\velau\Desktop\UltimoSemestreIngInformatica\TesisDoc\ImagenesPicking\WhatsApp Unknown 2026-09-08 at 22.20.14")
with transaccion() as c:
 c.execute("SELECT codigo,descripcion FROM productos")
 catalogo=c.fetchall()
for num in (1,2,3):
 img=abrir_imagen((carpeta/("WhatsApp Image 2026-09-08 at 19.52.38 ("+str(num)+").jpeg")).read_bytes())
 img,enh,pasos=preparar(img,True,"auto")
 gray=cv2.cvtColor(np.array(img),cv2.COLOR_RGB2GRAY)
 for modo,mat in (("normal",gray),("mejorada",enh)):
  for psm in (4,6,11):
   d=pytesseract.image_to_data(mat,lang="spa+eng",config="--psm "+str(psm),output_type=pytesseract.Output.DICT,timeout=60)
   filas,texto=filas_desde_datos(d,catalogo)
   Path(os.environ["TEMP"],"ocr-exp-"+str(num)+"-"+modo+"-"+str(psm)+".json").write_text(json.dumps({"data":d,"filas":filas,"texto":texto}),encoding="utf8")
   print(num,modo,psm,len(filas),sum(f["existe"] for f in filas),flush=True)

