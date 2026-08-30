import psycopg2
def conectar():
    return psycopg2.connect(
        host="localhost",
        database="Darnel_3DBinPacking_DB",
        user="postgres",
        password="junior2003"
    )