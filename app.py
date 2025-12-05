import os
import sys
import logging
import time
import re
import uuid
import json
import threading
from datetime import datetime
from flask import Flask, request, jsonify, Response
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
import fitz  # PyMuPDF
from bs4 import BeautifulSoup
from html import unescape

# Selenium Imports
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.options import Options

# --- Configuração Inicial ---

app = Flask(__name__)
app.secret_key = 'crm_virgula_secret_key'

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)

# Diretório de Uploads
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'sefaz_uploads')
ALLOWED_EXTENSIONS = {'pdf'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Banco de Dados
db_path = os.path.join(os.getcwd(), 'consultas.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# --- Modelos do Banco de Dados ---

class Consulta(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    filename = db.Column(db.String(120))
    total = db.Column(db.Integer, default=0)
    processed = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20)) # processing, completed, error
    start_time = db.Column(db.DateTime, default=datetime.utcnow)
    end_time = db.Column(db.DateTime)
    results = db.relationship('Resultado', backref='consulta', lazy=True)

class Resultado(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    consulta_id = db.Column(db.String(36), db.ForeignKey('consulta.id'))
    
    # Dados SEFAZ
    inscricao_estadual = db.Column(db.String(20))
    cnpj = db.Column(db.String(20))
    razao_social = db.Column(db.String(200))
    nome_fantasia = db.Column(db.String(200))
    unidade_fiscalizacao = db.Column(db.String(100))
    logradouro = db.Column(db.String(200))
    bairro_distrito = db.Column(db.String(100))
    municipio = db.Column(db.String(100))
    uf = db.Column(db.String(2))
    cep = db.Column(db.String(10))
    telefone = db.Column(db.String(20))
    email = db.Column(db.String(100))
    atividade_economica_principal = db.Column(db.String(200))
    condicao = db.Column(db.String(100))
    forma_pagamento = db.Column(db.String(100))
    situacao_cadastral = db.Column(db.String(100))
    data_situacao_cadastral = db.Column(db.String(20))
    motivo_situacao_cadastral = db.Column(db.String(200))
    nome_contador = db.Column(db.String(100))
    status = db.Column(db.String(20)) # Sucesso, Erro

    # Campos do CRM (Novos)
    campaign_status = db.Column(db.String(50), default='pending') # pending, sent, replied
    last_contacted = db.Column(db.DateTime, nullable=True)
    notes = db.Column(db.Text, nullable=True)

# --- CRIAÇÃO DAS TABELAS (CRÍTICO PARA GUNICORN) ---
# Executa a criação das tabelas no contexto global para garantir
# que elas existam quando o Gunicorn iniciar o worker.
with app.app_context():
    db.create_all()

# --- Funções Auxiliares ---

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def configurar_navegador():
    """Configura o Chrome para rodar no Docker (Headless)."""
    try:
        options = Options()
        # Configurações críticas para Docker
        options.add_argument('--headless=new') 
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-gpu')
        options.add_argument('--window-size=1920,1080')
        options.add_argument('--disable-extensions')
        
        # Como instalamos o Chrome via apt-get, ele está no PATH padrão
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
        return driver
    except Exception as e:
        logging.error(f"Erro ao configurar navegador: {e}")
        raise

def extrair_ie_pdf(filepath):
    """Lê o PDF e extrai números que parecem Inscrição Estadual."""
    ies = []
    try:
        padrao = re.compile(r'(\d{1,3}\.\d{1,3}\.\d{1,3})\s*-')
        doc = fitz.open(filepath)
        for page in doc:
            text = page.get_text("text")
            matches = padrao.finditer(text)
            for match in matches:
                ie_limpa = re.sub(r'\D', '', match.group(1))
                if len(ie_limpa) == 9:
                    ies.append(ie_limpa)
        doc.close()
        return list(set(ies))
    except Exception as e:
        logging.error(f"Erro ao ler PDF: {e}")
        return []

def extrair_dados_resultado(driver, inscricao_estadual):
    """Faz o parser do HTML da SEFAZ."""
    try:
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//td[contains(., 'Consulta Básica ao Cadastro do ICMS da Bahia')]"))
        )
        
        html = driver.page_source
        soup = BeautifulSoup(html, 'html.parser')
        
        dados = {
            'Inscrição Estadual': inscricao_estadual,
            'Status': 'Sucesso',
            'Motivo Situação Cadastral': 'Não informado'
        }

        def limpar_texto(texto):
            if not texto: return None
            return unescape(str(texto)).replace('\xa0', ' ').strip()

        # Mapeamento de campos
        campos_map = {
            'CNPJ': ['CNPJ:'],
            'Razão Social': ['Razão Social:', 'Raz&atilde;o Social:'],
            'Nome Fantasia': ['Nome Fantasia:'],
            'Unidade de Fiscalização': ['Unidade de Fiscalização:', 'Unidade de Fiscaliza&ccedil;&atilde;o:'],
            'Logradouro': ['Logradouro:'],
            'Bairro/Distrito': ['Bairro/Distrito:'],
            'Município': ['Município:', 'Munic&iacute;pio:'],
            'UF': ['UF:'],
            'CEP': ['CEP:'],
            'Telefone': ['Telefone:'],
            'E-mail': ['E-mail:'],
            'Condição': ['Condição:', 'Condi&ccedil;&atilde;o:'],
            'Forma de pagamento': ['Forma de pagamento:'],
            'Situação Cadastral Vigente': ['Situação Cadastral Vigente:', 'Situa&ccedil;&atilde;o Cadastral Vigente:'],
            'Motivo Situação Cadastral': ['Motivo desta Situação Cadastral:', 'Motivo desta Situa&ccedil;&atilde;o Cadastral:'],
            'Data Situação Cadastral': ['Data desta Situação Cadastral:', 'Data desta Situa&ccedil;&atilde;o Cadastral:'],
            'Nome (Contador)': ['Nome:']
        }

        for campo, labels in campos_map.items():
            for label in labels:
                label_tag = soup.find('b', string=lambda t: t and limpar_texto(label) in limpar_texto(t))
                if label_tag:
                    valor = label_tag.next_sibling
                    if valor:
                        dados[campo] = limpar_texto(valor)
                        break
        
        # Extração específica para Atividade Econômica
        try:
            atividade_tag = soup.find('b', string=lambda t: t and ('Atividade Econômica Principal' in limpar_texto(t) or 'Atividade Econ&ocirc;mica Principal' in limpar_texto(t)))
            if atividade_tag:
                linha = atividade_tag.find_parent('tr')
                if linha:
                    prox_linha = linha.find_next_sibling('tr')
                    if prox_linha:
                        dados['Atividade Econômica Principal'] = limpar_texto(prox_linha.get_text())
        except:
            pass

        return dados

    except Exception as e:
        logging.error(f"Erro parser IE {inscricao_estadual}: {e}")
        return {'Inscrição Estadual': inscricao_estadual, 'Status': f'Erro: {str(e)}'}

def consultar_ie(driver, wait, ie):
    """Navega no site da SEFAZ."""
    try:
        driver.get('https://portal.sefaz.ba.gov.br/scripts/cadastro/cadastroBa/consultaBa.asp')
        campo_ie = wait.until(EC.presence_of_element_located((By.NAME, 'IE')))
        campo_ie.clear()
        campo_ie.send_keys(ie)
        botao = wait.until(EC.element_to_be_clickable((By.XPATH, "//input[@type='submit' and @name='B2' and contains(@value, 'IE')]")))
        botao.click()
        wait.until(EC.url_contains('result.asp'))
        return True
    except:
        return False

def thread_processamento(filepath, process_id):
    """Lógica principal executada em background."""
    with app.app_context():
        consulta = Consulta.query.get(process_id)
        if not consulta: return

        try:
            ies = extrair_ie_pdf(filepath)
            
            if not ies:
                consulta.status = 'completed' # PDF válido mas sem IEs
                consulta.total = 0
                consulta.end_time = datetime.now()
                db.session.commit()
                return

            consulta.total = len(ies)
            db.session.commit()

            driver = configurar_navegador()
            wait = WebDriverWait(driver, 15)

            for index, ie in enumerate(ies):
                try:
                    if consultar_ie(driver, wait, ie):
                        dados = extrair_dados_resultado(driver, ie)
                        
                        resultado = Resultado(
                            consulta_id=process_id,
                            inscricao_estadual=dados.get('Inscrição Estadual'),
                            cnpj=dados.get('CNPJ'),
                            razao_social=dados.get('Razão Social'),
                            nome_fantasia=dados.get('Nome Fantasia'),
                            unidade_fiscalizacao=dados.get('Unidade de Fiscalização'),
                            logradouro=dados.get('Logradouro'),
                            bairro_distrito=dados.get('Bairro/Distrito'),
                            municipio=dados.get('Município'),
                            uf=dados.get('UF'),
                            cep=dados.get('CEP'),
                            telefone=dados.get('Telefone'),
                            email=dados.get('E-mail'),
                            atividade_economica_principal=dados.get('Atividade Econômica Principal'),
                            condicao=dados.get('Condição'),
                            forma_pagamento=dados.get('Forma de pagamento'),
                            situacao_cadastral=dados.get('Situação Cadastral Vigente'),
                            data_situacao_cadastral=dados.get('Data Situação Cadastral'),
                            motivo_situacao_cadastral=dados.get('Motivo Situação Cadastral'),
                            nome_contador=dados.get('Nome (Contador)'),
                            status=dados.get('Status'),
                            campaign_status='pending'
                        )
                        db.session.add(resultado)
                    else:
                        erro = Resultado(consulta_id=process_id, inscricao_estadual=ie, status='Erro: Navegação', campaign_status='error')
                        db.session.add(erro)
                    
                    consulta.processed = index + 1
                    db.session.commit()
                    
                except Exception as e:
                    logging.error(f"Erro item {ie}: {e}")
                    consulta.processed = index + 1
                    db.session.commit()

            driver.quit()
            consulta.status = 'completed'
            consulta.end_time = datetime.now()
            db.session.commit()

        except Exception as e:
            logging.error(f"Erro fatal process_id {process_id}: {e}")
            consulta.status = 'error'
            consulta.end_time = datetime.now()
            db.session.commit()

# --- Rotas da API ---

@app.route('/start-processing', methods=['POST'])
def start_processing():
    if 'file' not in request.files:
        return jsonify({'error': 'Nenhum arquivo enviado'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Nome de arquivo vazio'}), 400
    
    if file and allowed_file(file.filename):
        process_id = str(uuid.uuid4())
        filename = secure_filename(f"{process_id}.pdf")
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        nova_consulta = Consulta(
            id=process_id,
            filename=file.filename,
            total=0,
            processed=0,
            status='processing'
        )
        db.session.add(nova_consulta)
        db.session.commit()
        
        # Inicia thread
        t = threading.Thread(target=thread_processamento, args=(filepath, process_id))
        t.start()
        
        return jsonify({'processId': process_id})
    
    return jsonify({'error': 'Arquivo inválido'}), 400

@app.route('/progress/<process_id>')
def progress(process_id):
    def generate():
        with app.app_context():
            last_processed = -1
            while True:
                consulta = Consulta.query.get(process_id)
                if not consulta:
                    yield f"data: {json.dumps({'status': 'not_found'})}\n\n"
                    break
                
                # Envia atualização apenas se mudou ou terminou
                if consulta.processed != last_processed or consulta.status in ['completed', 'error']:
                    data = {
                        'total': consulta.total,
                        'processed': consulta.processed,
                        'status': consulta.status
                    }
                    yield f"data: {json.dumps(data)}\n\n"
                    last_processed = consulta.processed

                if consulta.status in ['completed', 'error']:
                    break
                
                time.sleep(1)

    return Response(generate(), mimetype='text/event-stream')

@app.route('/get-all-results')
def get_all_results():
    """Retorna TODAS as empresas cadastradas no banco."""
    resultados = Resultado.query.all()
    
    data = []
    for r in resultados:
        data.append({
            'id': str(r.id),
            'inscricaoEstadual': r.inscricao_estadual,
            'cnpj': r.cnpj,
            'razaoSocial': r.razao_social,
            'municipio': r.municipio,
            'telefone': r.telefone,
            'situacaoCadastral': r.situacao_cadastral,
            'motivoSituacao': r.motivo_situacao_cadastral,
            'nomeContador': r.nome_contador,
            'status': r.status,
            'campaignStatus': r.campaign_status
        })
    
    return jsonify(data)

@app.route('/get-results/<process_id>')
def get_results_by_id(process_id):
    resultados = Resultado.query.filter_by(consulta_id=process_id).all()
    data = []
    for r in resultados:
        data.append({
            'id': str(r.id),
            'razaoSocial': r.razao_social,
            'status': r.status
        })
    return jsonify({'results': data})

if __name__ == '__main__':
    # Mantemos aqui também para rodar localmente (python app.py)
    app.run(host='0.0.0.0', port=5000)
