from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from API.productos import router as productos_router

app = FastAPI(
    title="API App 3D Bin Packing",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173"
    ],

    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



app.include_router(productos_router)


@app.get("/")
def inicio():

    return {
        "mensaje": "API funcionando correctamente"
    }