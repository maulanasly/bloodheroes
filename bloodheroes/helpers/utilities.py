from flask import current_app
from bloodheroes import fcm
from datetime import datetime
import calendar
import bcrypt
import re

LATIDTUDE = '^(\+|-)?(?:90(?:(?:\.0{1,6})?)|(?:[0-9]|[1-8][0-9])(?:(?:\.[0-9]{1,6})?))$'
LONGITUDE = '^(\+|-)?(?:180(?:(?:\.0{1,6})?)|(?:[0-9]|[1-9][0-9]|1[0-7][0-9])(?:(?:\.[0-9]{1,6})?))$'


def email_validator(email):
    return re.search(r'^.+@[?[a-zA-Z0-9-.]+.([a-zA-Z]{2,3}|[0-9]{1,3})(]?)$', email)


def latitude_validator(latitude):
    return re.search(r'%s' % LATIDTUDE, latitude)


def longitude_validator(longitude):
    return re.search(r'%s' % LONGITUDE, longitude)


def from_timestamp(timestamp):
    return datetime.fromtimestamp(int(timestamp))


def to_timestamp(date):
    return calendar.timegm(date.timetuple())


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1] in current_app.config['ALLOWED_EXTENSIONS']


def encrypt_password(password):
    return bcrypt.hashpw(str(password), bcrypt.gensalt(8))


def send_notification(user, message):
    if user['fcm_token'] is not '':
        try:
            fcm.notify_single_device(user['fcm_token'], data_message=message)
        except Exception:
            current_app.logger.exception("Failed to send notification")
            return False
    return True
