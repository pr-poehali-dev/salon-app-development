import json
import os
import psycopg2
from datetime import datetime
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Обрабатывает запросы на создание бронирований и получение занятых слотов.
    При создании бронирования отправляет SMS уведомление владельцу.
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database configuration missing'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()
    
    try:
        if method == 'GET':
            cursor.execute("SELECT booking_date, booking_time FROM bookings")
            rows = cursor.fetchall()
            
            booked_slots = []
            for row in rows:
                booked_slots.append({
                    'date': row[0].isoformat() if row[0] else None,
                    'time': row[1]
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'booked_slots': booked_slots}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            
            client_name = body_data.get('client_name', '')
            client_phone = body_data.get('client_phone', '')
            services = body_data.get('services', '')
            booking_date = body_data.get('booking_date', '')
            booking_time = body_data.get('booking_time', '')
            payment_method = body_data.get('payment_method', 'cash')
            wishes = body_data.get('wishes', '')
            
            cursor.execute(
                "SELECT COUNT(*) FROM bookings WHERE booking_date = %s AND booking_time = %s",
                (booking_date, booking_time)
            )
            count = cursor.fetchone()[0]
            
            if count > 0:
                conn.close()
                return {
                    'statusCode': 409,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Time slot already booked'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute(
                """INSERT INTO bookings (client_name, client_phone, services, booking_date, booking_time, payment_method, wishes)
                VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (client_name, client_phone, services, booking_date, booking_time, payment_method, wishes)
            )
            conn.commit()
            
            try:
                send_sms_notification(client_name, services, booking_date, booking_time, wishes)
            except Exception as sms_error:
                print(f"SMS notification failed: {sms_error}")
            
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Booking created successfully'}),
                'isBase64Encoded': False
            }
        
        conn.close()
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        if conn:
            conn.close()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }


def send_sms_notification(client_name: str, services: str, booking_date: str, booking_time: str, wishes: str) -> None:
    '''Отправляет SMS уведомление владельцу о новой записи через sms.ru API'''
    import urllib.request
    import urllib.parse
    
    api_key = os.environ.get('SMS_API_KEY')
    owner_phone = os.environ.get('OWNER_PHONE')
    
    if not api_key or not owner_phone:
        raise ValueError("SMS credentials not configured")
    
    message = f"Новая запись!\nКлиент: {client_name}\nУслуги: {services}\nДата: {booking_date}\nВремя: {booking_time}"
    if wishes:
        message += f"\nПожелания: {wishes}"
    
    params = urllib.parse.urlencode({
        'api_id': api_key,
        'to': owner_phone,
        'msg': message,
        'json': 1
    })
    
    url = f'https://sms.ru/sms/send?{params}'
    
    with urllib.request.urlopen(url) as response:
        result = json.loads(response.read().decode())
        if result.get('status_code') != 100:
            raise Exception(f"SMS API error: {result}")
