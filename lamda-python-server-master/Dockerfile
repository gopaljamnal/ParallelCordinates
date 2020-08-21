FROM python:3.6

WORKDIR /app/backend
COPY requirements.txt /app/backend/requirements.txt


RUN pip install --upgrade pip \
    && pip install -r requirements.txt

COPY .  /app/backend/

CMD ["python","python_data_server.py"]