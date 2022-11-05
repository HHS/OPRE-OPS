from sqlalchemy import create_engine, insert, MetaData, delete
from env.local import DATABASE_URL
import json5
import os

engine = create_engine(DATABASE_URL, echo=True, future=True)
metadata_obj = MetaData()
metadata_obj.reflect(bind=engine)

portfolio_data = json5.load(open(f"data/{os.getenv('DATA')}"))

with engine.connect() as conn:

    for ops_table in portfolio_data:
        conn.execute(delete(metadata_obj.tables[ops_table]))

    conn.commit()

    for ops_table in portfolio_data:
        data = portfolio_data[ops_table]

        result = conn.execute(
            insert(metadata_obj.tables[ops_table]),
            data,
        )

    conn.commit()
