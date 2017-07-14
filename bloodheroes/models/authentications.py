from flask import current_app
from mallsini import redis
from mallsini import mongo
from mallsini.exceptions import UnAuthorized, IncorrectPassword, InvalidTokenType

from datetime import datetime
import md5
import hmac
import bcrypt
import threading

hash_semaphore = threading.Semaphore(4)


class Authentication(object):
    """docstring for Authentication"""

    def do_login(self, user, password):
        with hash_semaphore:
            if not bcrypt.hashpw(password, str(user.bcrypt_password)) == user.bcrypt_password:
                raise IncorrectPassword
            else:
                hashed_username = md5.new(user.email.lower()).hexdigest() + str(user.user_id)
                session_id = self.get_session_from_cache(hashed_username)
                if session_id is None:
                    session = mongo.db.sessions.find_one({'user_id': user['user_id']})
                    if session is None:
                        session = self.generate_session(user['user_id'])
                    session_id = session['session_id']
                    redis.hset('user_sessions', hashed_username, session_id)
        return session_id

    def generate_session(user_id):
        session_id = hmac.new(current_app.config.get('APP_SECRET'), datetime.now().strftime('%Y-%m-%d %H:%m:%s'))
        session_id = session_id.digest().encode("hex")
        prepared_data = {
            "user_id": user_id,
            "session_id": session_id
        }
        mongo.db.sessions.insert_one(prepared_data)
        return session_id

    def validate_session(self, session_id):
        session = mongo.db.sessions.find_one({'session_id': session_id})
        if session is None:
            raise UnAuthorized
        return session

    def validate_token(self, token):
        token = mongo.db.applications.find_one({'token': token})
        if token is None:
            raise InvalidTokenType
        return token

    def get_session_from_cache(self, key):
        return redis.hget('user_sessions', key)

    def delete_session_in_cache(self, email, user_id):
        hashed_username = md5.new(email.lower()).hexdigest() + str(user_id)
        redis.hdel('user_sessions', hashed_username)
        return True
