from flask import Flask, jsonify, request
from flask_restful import Api
from flask_restful_swagger import swagger
from flask_pymongo import PyMongo
from flask_redis import FlaskRedis
from bloodheroes.exceptions import BaseExceptions, SessionExpired, MissingSessionID
from bloodheroes.config import config

import os

app = Flask(__name__, instance_relative_config=True)

environment = os.getenv('APP_CONFIGURATION', 'development')
config_file = environment + '.cfg'
app.config.from_object(config[environment])
app.config.from_pyfile(config_file, silent=True)


api = swagger.docs(Api(app), apiVersion='0.1', api_spec_url='/spec', description="bloodheroes-api")
mongo = PyMongo(app)
redis = FlaskRedis(app)

app.config['SENTRY_CONFIG'] = {
    'ignore_exceptions': ['werkzeug.exceptions.HTTPException', 'IOError']
}


from bloodheroes.resources.users import UserAPI, UserListAPI
from bloodheroes.resources.authentications import AuthAPI, SignOutAPI
from bloodheroes.resources.donations import RequestDonationListAPI
from bloodheroes.resources.bloodtype import BloodTypesAPI,BloodTypesListAPI


api.add_resource(AuthAPI, '/login')
api.add_resource(SignOutAPI, '/logout')
api.add_resource(UserListAPI, '/user')
api.add_resource(UserAPI, '/user/<string:user_id>')
api.add_resource(RequestDonationListAPI, '/donations')
api.add_resource(BloodTypesAPI,'/bloodtypes/<string:blood_id>')
api.add_resource(BloodTypesListAPI,'/bloodtypes')


@app.errorhandler(BaseExceptions)
def handler_senseauth_exception(error):
    session_id = request.headers.get('X-SESSION-ID', None)
    if session_id:
        new_error = SessionExpired(session_id=session_id)
    else:
        new_error = MissingSessionID()
    data = {
        "code": new_error.code,
        "reason": new_error.message,
        "extra_info": new_error.extra
    }
    response = jsonify(data)
    response.status_code = new_error.status_code
    return response


@app.errorhandler(BaseExceptions)
def handle_exception(error):
    data = {
        "code": error.code,
        "reason": error.message,
        "extra_info": error.extra
    }
    response = jsonify(data)
    response.status_code = error.status_code
    return response
